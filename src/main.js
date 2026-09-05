// Browser entry. Wires the engine to the UI.
//
// The DOM is rebuilt from the run state on every turn — no virtual DOM, no
// reactivity layer, no framework. `render()` is the only function that touches
// the document, and it is a pure function of `session` plus the screen modules.
//
// The engine stays DOM-free: nothing under src/engine/ or src/data/ is imported
// for anything but data and pure functions, and nothing here reaches back into
// them except through the public barrel.

import {
  createRun,
  drawCard,
  cardById,
  applyOption,
  endTurn,
  isRunOver,
  choosePatron,
  acceptOffer,
  declineOffers,
  poll,
  blocReadout,
  playerPartyId,
  popularityBand,
  runElection,
} from './engine/index.js';
import { renderPatronScreen } from './ui/screen-patron.js';
import { renderOfferScreen } from './ui/screen-offer.js';
import { renderCardScreen, renderQuietTurn, renderFeedbackBeat, renderRoll } from './ui/screen-card.js';
import { renderSlotHud, bestSlotRow } from './ui/hud-slots.js';
import { renderBlocHud } from './ui/hud-blocs.js';
import { renderPollHud } from './ui/hud-poll.js';
import { renderStartScreen } from './ui/screen-start.js';
import { renderStreamScreen } from './ui/screen-stream.js';
import { renderEndScreen } from './ui/screen-end.js';
import { isDebugEnabled, renderDebugPanel } from './ui/debug-panel.js';
import {
  FEEDBACK_BEAT_MS,
  FEEDBACK_BEAT_DEFECTION_MS,
  ROLL_DURATION_MS,
} from './data/tuning.js';
import { NARRATABLE_CAPITAL } from './data/feedback.js';
import { div } from './ui/dom.js';

const root = document.getElementById('app');

/**
 * Everything the browser session holds that is not part of the run state.
 * The run state itself is never mutated — every transition replaces it.
 */
const session = {
  state: null,
  // Setup runs start -> stream -> patron, and only then the first card.
  // Back is allowed between the setup screens and never after.
  phase: 'start', // start | stream | patron | turn | rolling | feedback | election
  // The live roll in flight: { optionIndex, roll }. Input is locked while set.
  pendingRoll: null,
  resolution: null,
  outcome: null,
  startingAxes: null,
  forcedCardId: null,
  isDebugOpen: false,
  isSlotTableOpen: false,
  selectedStreamId: null,

  // Everything the HUD looked like BEFORE the decision being narrated. The bars
  // and the seat count animate from here to the current state.
  before: null,
  beatTimer: null,
  beatHoldMs: FEEDBACK_BEAT_MS,
};

/** The three HUD readings, captured so the beat can animate away from them. */
function snapshot(state) {
  const slotRow = bestSlotRow(state);
  return {
    blocs: blocReadout(state),
    capital: { ...state.capital },
    band: popularityBand(state).label,
    seats: poll(state),
    slot: slotRow ? slotRow.slot : null,
    slotPartyName: slotRow ? slotRow.partyName : null,
  };
}

function randomSeed() {
  // The only place a non-reproducible number is allowed: choosing which
  // reproducible run to play. Everything downstream flows from this seed.
  return Math.floor(Math.random() * 2 ** 31);
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

function startRun(seed, streamId) {
  const state = createRun(seed, streamId);
  session.state = state;
  session.startingAxes = { ...state.axes };
  session.before = snapshot(state);
  // The stream IS character creation, so the run state exists the moment it is
  // chosen and patron eligibility filters against real opening capital.
  session.phase = 'patron';
  session.resolution = null;
  session.outcome = null;
  session.forcedCardId = null;
  render();
}

function cardForThisTurn() {
  if (session.forcedCardId) return cardById(session.forcedCardId);
  return drawCard(session.state);
}

function clearBeatTimer() {
  if (session.beatTimer === null) return;
  window.clearTimeout(session.beatTimer);
  session.beatTimer = null;
}

function advanceTurn() {
  clearBeatTimer();
  // A branch that ended the run skips the rest of the turn entirely — no
  // upkeep, no new offers, no next card.
  if (session.state.endedEarly) {
    session.outcome = runElection(session.state);
    session.phase = 'election';
    session.resolution = null;
    render();
    return;
  }
  const next = endTurn(session.state);
  session.state = next;
  session.before = snapshot(next);
  session.resolution = null;
  session.forcedCardId = null;

  if (isRunOver(next)) {
    session.outcome = runElection(next);
    session.phase = 'election';
  } else {
    session.phase = 'turn';
  }
  render();
}

function handlePatronChosen(patronId) {
  // Taking `none` means staying where you already are; the engine rejects
  // choosing the patron you already hold, so only a real change is applied.
  if (patronId !== session.state.patron) {
    session.state = choosePatron(session.state, patronId);
  }
  // Setup is over. From here the first card is drawn and there is no way back.
  session.before = snapshot(session.state);
  session.phase = 'turn';
  render();
}

function handleOptionChosen(optionIndex) {
  const card = cardForThisTurn();
  const option = card.options[optionIndex];

  // A non-action has nothing to roll. It resolves on the spot.
  if (!option.branches) {
    resolveOption(optionIndex, null);
    return;
  }

  // THE ONE LIVE RANDOM NUMBER IN THE GAME (engine/cards.js explains the
  // carve-out). Rolled here, before the animation, so the marker can sweep to
  // the exact position that decides the branch — and so the two can never
  // disagree about where it landed.
  session.pendingRoll = { optionIndex, roll: Math.random() };
  session.phase = 'rolling';
  clearBeatTimer();
  session.beatTimer = window.setTimeout(() => {
    const { optionIndex: index, roll } = session.pendingRoll;
    session.pendingRoll = null;
    resolveOption(index, roll);
  }, ROLL_DURATION_MS);
  render();
}

/** Applies the chosen option and hands over to the post-turn beat. */
function resolveOption(optionIndex, roll) {
  const card = cardForThisTurn();
  // Capture the HUD as it stands BEFORE the decision, so the beat can animate
  // the bars and the seat count away from where the player last saw them.
  session.before = snapshot(session.state);

  const { state, resolution } = applyOption(
    session.state,
    card.id,
    optionIndex,
    roll === null ? {} : { rng: () => roll },
  );
  session.state = state;
  session.resolution = { ...resolution, optionLabel: card.options[optionIndex].label };
  session.phase = 'feedback';

  // The beat dismisses itself. A click only skips ahead; it is never required.
  clearBeatTimer();
  session.beatHoldMs =
    resolution.defections.length > 0 ? FEEDBACK_BEAT_DEFECTION_MS : FEEDBACK_BEAT_MS;
  session.beatTimer = window.setTimeout(advanceTurn, session.beatHoldMs);

  render();
}

/** What the beat narrates: the difference between `session.before` and now. */
function movementSinceDecision() {
  const before = session.before;
  const state = session.state;
  const nowBlocs = blocReadout(state);
  const nowSeats = poll(state);
  const nowSlotRow = bestSlotRow(state);
  const partyId = playerPartyId(state);

  const blocMovement = nowBlocs.map((bloc) => {
    const previous = before.blocs.find((one) => one.blocId === bloc.blocId);
    // A mode switch is not movement — see the note in hud-blocs.js.
    const comparable = previous && previous.mode === bloc.mode ? previous : null;
    return {
      displayName: bloc.displayName,
      difference: comparable ? bloc.value - comparable.value : 0,
    };
  });

  const nextSlot = nowSlotRow ? nowSlotRow.slot : null;
  const slotChange =
    nextSlot !== null && nextSlot !== before.slot
      ? {
          previousSlot: before.slot,
          nextSlot,
          partyName: nowSlotRow.partyName,
        }
      : null;

  const seatChange = partyId
    ? { previousSeats: before.seats[partyId] ?? 0, nextSeats: nowSeats[partyId] ?? 0 }
    : null;

  const capitalMovement = NARRATABLE_CAPITAL.map((capitalKey) => ({
    capitalKey,
    difference: state.capital[capitalKey] - before.capital[capitalKey],
  }));

  const bandChanged = popularityBand(state).label !== before.band;

  return { blocMovement, capitalMovement, slotChange, seatChange, bandChanged };
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

function renderTurn() {
  const state = session.state;

  if (state.offers.length > 0) {
    return renderOfferScreen({
      state,
      onAccept: (partyId) => {
        session.state = acceptOffer(state, partyId);
        render();
      },
      onDecline: () => {
        session.state = declineOffers(state);
        render();
      },
    });
  }

  const card = cardForThisTurn();
  if (!card) return renderQuietTurn({ onContinue: advanceTurn });

  // While the roll is in flight the option list is gone, so there is nothing to
  // click and no way to skip it.
  if (session.phase === 'rolling' && session.pendingRoll) {
    return renderRoll({ card, ...session.pendingRoll });
  }

  return renderCardScreen({ card, onChoose: handleOptionChosen });
}

function renderPlayingScreens() {
  const state = session.state;
  const isBeat = session.phase === 'feedback';
  const movement = isBeat ? movementSinceDecision() : null;

  const body =
    session.phase === 'rolling'
        ? renderTurn()
        : isBeat
        ? renderFeedbackBeat({
            resolution: session.resolution,
            blocMovement: movement.blocMovement,
            capitalMovement: movement.capitalMovement,
            slotChange: movement.slotChange,
            seatChange: movement.seatChange,
            holdMs: session.beatHoldMs,
            onSkip: advanceTurn,
          })
        : renderTurn();

  // Everything the player tracks: the seat count, three bloc bars, one slot
  // line. No axes, no capital meters, no patron upkeep — those all still run,
  // they simply stopped being shown (M3 Part 1).
  return div({}, [
    renderPollHud(state, isBeat ? session.before.seats : null),
    renderBlocHud(state, isBeat ? session.before.blocs : null),
    renderSlotHud(state, {
      isTableOpen: session.isSlotTableOpen,
      onToggleTable: (isOpen) => {
        session.isSlotTableOpen = isOpen;
      },
      hasChanged: Boolean(movement?.slotChange),
      bandChanged: Boolean(movement?.bandChanged),
    }),
    body,
  ]);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** One screen per phase. A ternary chain six deep is not a thing worth reading. */
function screenForPhase() {
  if (session.phase === 'start') {
    return renderStartScreen({
      onStart: () => {
        session.phase = 'stream';
        render();
      },
    });
  }

  if (session.phase === 'stream') {
    return renderStreamScreen({
      selectedStreamId: session.selectedStreamId,
      onSelect: (streamId) => {
        session.selectedStreamId = streamId;
        render();
      },
      onBack: () => {
        session.phase = 'start';
        render();
      },
      onConfirm: (streamId) => startRun(randomSeed(), streamId),
    });
  }

  if (session.phase === 'patron') {
    return renderPatronScreen({
      state: session.state,
      onChoose: handlePatronChosen,
      onBack: () => {
        // Nothing has been drawn yet, so stepping back is free. Past this
        // screen the first card is dealt and there is no way back.
        session.phase = 'stream';
        render();
      },
    });
  }

  if (session.phase === 'election') {
    return renderEndScreen({
      outcome: session.outcome,
      startingAxes: session.startingAxes,
      onRestart: () => {
        session.phase = 'start';
        session.selectedStreamId = null;
        session.state = null;
        render();
      },
    });
  }

  return renderPlayingScreens();
}

function render() {
  const screens = screenForPhase();

  const children = [screens];

  if (isDebugEnabled() && session.state) {
    children.push(
      renderDebugPanel({
        state: session.state,
        phase: session.phase,
        isOpen: session.isDebugOpen,
        onToggle: (isOpen) => {
          session.isDebugOpen = isOpen;
        },
        onReplaySeed: (seed) => startRun(seed, session.state.stream),
        onForceCard: (cardId) => {
          session.forcedCardId = cardId;
          session.phase = 'turn';
          render();
        },
      }),
    );
  }

  root.replaceChildren(...children);
  if (session.phase !== 'feedback') window.scrollTo({ top: 0 });
}

render();
