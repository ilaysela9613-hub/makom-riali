// The patron layer: eligibility gates, the two affinity chains, per-turn
// upkeep and axes pull, and the scheduling of the obligation card.
//
// Nobody arrives in the Knesset unsponsored, and the price is never money.
// It is credibility, ideological independence, and a favour asked at the worst
// possible moment (SPEC §5).

import PATRONS from '../data/patrons.js';
import {
  STARTING_PATRON,
  PATRON_SWITCH_CREDIBILITY_COST,
  CREDIBILITY_DECAY_PER_TURN,
  UNPATRONED_CREDIBILITY_DECAY_RELIEF,
} from '../data/tuning.js';
import { createRng } from './rng.js';
import { withCapital, withAxes, withFlags } from './state.js';

export function patronById(patronId) {
  const patron = PATRONS[patronId];
  if (!patron) throw new Error(`patronById: unknown patron id "${patronId}"`);
  return patron;
}

export function currentPatron(state) {
  return patronById(state.patron ?? STARTING_PATRON);
}

export function isEligibleForPatron(state, patron) {
  if (patron.id === state.patron) return false;
  if (typeof patron.eligible !== 'function') return true;
  return patron.eligible(state);
}

/** Every patron the player could take right now, in roster order. */
export function eligiblePatrons(state) {
  return Object.values(PATRONS).filter((patron) => isEligibleForPatron(state, patron));
}

/**
 * Takes a patron. Switching away from an existing one burns credibility —
 * changing who owns you is not free.
 */
export function choosePatron(state, patronId) {
  const patron = patronById(patronId);
  if (!isEligibleForPatron(state, patron)) {
    throw new Error(`choosePatron: "${patronId}" is not eligible for this run state`);
  }

  const isSwitchingAwayFromAPatron = state.patron !== STARTING_PATRON;
  let next = isSwitchingAwayFromAPatron
    ? withCapital(state, { credibility: -PATRON_SWITCH_CREDIBILITY_COST })
    : state;

  next = { ...next, patron: patronId, patronTurns: 0, pendingObligation: null };

  if (patron.obligation) {
    const rng = createRng(next.rngCursor);
    const [earliestOffset, latestOffset] = patron.obligation.turnRange;
    next = {
      ...next,
      rngCursor: rng.cursor,
      pendingObligation: {
        cardId: patron.obligation.cardId,
        turn: next.turn + rng.integer(earliestOffset, latestOffset),
      },
    };
  }

  if (patron.flagsOnTaking) next = withFlags(next, patron.flagsOnTaking);

  return next;
}

// ---------------------------------------------------------------------------
// The two affinity chains — kept separate on purpose, see CLAUDE.md §5.1
// ---------------------------------------------------------------------------

/** Multiplier on the chance this party offers the player a slot at all. */
export function patronOfferAffinity(state, party) {
  const patron = currentPatron(state);
  if (typeof patron.offerAffinity !== 'function') return 1;
  return patron.offerAffinity(party, state);
}

/** Multiplier on how good a slot the player is worth in this party. */
export function patronSlotAffinity(state, party) {
  const patron = currentPatron(state);
  if (typeof patron.slotAffinity !== 'function') return 1;
  return patron.slotAffinity(party, state);
}

/**
 * The best slot this patron will ever get you, regardless of capital.
 * `local_boss` is the one that bites: cheap, always available, and it caps you.
 */
export function patronBestAttainableSlot(state) {
  return currentPatron(state).bestAttainableSlot ?? null;
}

// ---------------------------------------------------------------------------
// Per-turn price
// ---------------------------------------------------------------------------

/**
 * `media` amplifies what happens to you in both directions — it is volatility,
 * not cost. Applied to a card option's capital block before it lands.
 */
export function amplifyCapitalDeltas(state, capitalDeltas) {
  if (!capitalDeltas) return capitalDeltas;
  const patron = currentPatron(state);
  if (!patron.capitalAmplification) return capitalDeltas;

  const amplified = {};
  for (const [capitalKey, delta] of Object.entries(capitalDeltas)) {
    const factor = patron.capitalAmplification[capitalKey] ?? 1;
    amplified[capitalKey] = delta * factor;
  }
  return amplified;
}

/**
 * One turn of standing price: the patron's upkeep, their pull on the player's
 * ideology, and the background credibility decay that running unpatroned
 * partly shelters you from.
 */
export function applyPatronUpkeep(state) {
  const patron = currentPatron(state);

  const decay =
    patron.id === STARTING_PATRON
      ? CREDIBILITY_DECAY_PER_TURN * UNPATRONED_CREDIBILITY_DECAY_RELIEF
      : CREDIBILITY_DECAY_PER_TURN;

  let next = withCapital(state, { credibility: -decay });
  if (patron.upkeep) next = withCapital(next, patron.upkeep);

  const axesPull =
    typeof patron.axesPull === 'function' ? patron.axesPull(next) : patron.axesPull;
  if (axesPull) next = withAxes(next, axesPull);

  return next;
}

/** The obligation card due this turn, if the bill has come due. */
export function dueObligationCardId(state) {
  if (!state.pendingObligation) return null;
  if (state.turn < state.pendingObligation.turn) return null;
  return state.pendingObligation.cardId;
}
