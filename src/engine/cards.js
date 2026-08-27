// Card eligibility, weighted draw, and option resolution.
//
// drawCard is a pure function of the run state: the same state always draws the
// same card. It does that without consuming the run's randomness, by deriving a
// throwaway generator from (rngCursor, turn). Only applyOption advances the
// cursor, and only when an option actually carries a `risk`.

import ALL_CARDS from '../data/cards/index.js';
import {
  MAX_CONSECUTIVE_SAME_CAMP,
  CAMP_BALANCE_EXEMPT_CAMPS,
  SEEN_CARD_WEIGHT_MULTIPLIER,
  UNLOCKED_CARD_WEIGHT_MULTIPLIER,
} from '../data/tuning.js';
import { deriveRng, createRng } from './rng.js';
import {
  withAxes,
  withCapital,
  withFlags,
  appendLog,
  advanceTurn,
} from './state.js';
import { applySegmentDeltas } from './segments.js';
import { currentParty } from './party.js';
import { amplifyCapitalDeltas, applyPatronUpkeep, dueObligationCardId } from './patron.js';
import { lapseUnansweredOffers, openOffers } from './slots.js';

/** The only keys a card's `requires` block may use. The validator imports this. */
export const REQUIRES_KEYS = [
  'axes',
  'capital',
  'partyTier',
  'partySelection',
  'patron',
  'ownParty',
  'flags',
  'notSeen',
];

export const CAMPS = ['right', 'left', 'neutral'];

const CARDS_BY_ID = new Map(ALL_CARDS.map((card) => [card.id, card]));

/**
 * Cards that some option unlocks are locked until that option fires. This is
 * what makes `unlocks` mean something: a follow-up card cannot show up before
 * the card it follows.
 */
const LOCKED_CARD_IDS = new Set(
  ALL_CARDS.flatMap((card) => card.options.flatMap((option) => option.unlocks ?? [])),
);

export function allCards() {
  return ALL_CARDS;
}

export function cardById(cardId) {
  return CARDS_BY_ID.get(cardId) ?? null;
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

function satisfiesRange(value, bounds) {
  if (bounds.min !== undefined && value < bounds.min) return false;
  if (bounds.max !== undefined && value > bounds.max) return false;
  return true;
}

/** Every card id shut off by a card the player has already seen. */
function excludedCardIds(state) {
  const excluded = new Set();
  for (const seenCardId of state.seen) {
    const seenCard = cardById(seenCardId);
    for (const cardId of seenCard?.excludes ?? []) excluded.add(cardId);
  }
  return excluded;
}

export function isCardEligible(state, card, excluded = excludedCardIds(state)) {
  if (card.act !== state.act) return false;
  if (excluded.has(card.id)) return false;
  if (LOCKED_CARD_IDS.has(card.id) && !state.unlocked.includes(card.id)) return false;
  if (state.seen.includes(card.id) && SEEN_CARD_WEIGHT_MULTIPLIER <= 0) return false;

  const requires = card.requires;
  if (!requires) return true;

  if (requires.axes) {
    for (const [axisKey, bounds] of Object.entries(requires.axes)) {
      if (!satisfiesRange(state.axes[axisKey], bounds)) return false;
    }
  }

  if (requires.capital) {
    for (const [capitalKey, bounds] of Object.entries(requires.capital)) {
      if (!satisfiesRange(state.capital[capitalKey], bounds)) return false;
    }
  }

  if (requires.partyTier) {
    const party = currentParty(state);
    if (!party || !requires.partyTier.includes(party.tier)) return false;
  }

  if (requires.partySelection) {
    const party = currentParty(state);
    if (!party || !requires.partySelection.includes(party.selection)) return false;
  }

  if (requires.patron && !requires.patron.includes(state.patron)) return false;

  if (requires.ownParty !== undefined && Boolean(state.ownParty) !== requires.ownParty) {
    return false;
  }

  if (requires.flags) {
    for (const flag of requires.flags) {
      if (!state.flags.includes(flag)) return false;
    }
  }

  if (requires.notSeen) {
    for (const cardId of requires.notSeen) {
      if (state.seen.includes(cardId)) return false;
    }
  }

  return true;
}

export function eligibleCards(state) {
  const excluded = excludedCardIds(state);
  return ALL_CARDS.filter((card) => isCardEligible(state, card, excluded));
}

// ---------------------------------------------------------------------------
// Camp balance (CLAUDE.md §6.2)
// ---------------------------------------------------------------------------

/**
 * How many cards at the tail of the run's history share a camp, and which camp.
 * Pure randomness produces streaks that read as authored bias, so the draw
 * refuses to extend one past MAX_CONSECUTIVE_SAME_CAMP.
 */
export function trailingCampStreak(state) {
  let camp = null;
  let length = 0;
  for (let index = state.history.length - 1; index >= 0; index -= 1) {
    const card = cardById(state.history[index].cardId);
    if (!card) break;
    if (CAMP_BALANCE_EXEMPT_CAMPS.includes(card.camp)) break;
    if (camp === null) camp = card.camp;
    else if (card.camp !== camp) break;
    length += 1;
  }
  return { camp, length };
}

function campBlockedBy(state) {
  const { camp, length } = trailingCampStreak(state);
  return length >= MAX_CONSECUTIVE_SAME_CAMP ? camp : null;
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

function drawWeight(state, card) {
  let weight = card.weight ?? 1;
  if (state.seen.includes(card.id)) weight *= SEEN_CARD_WEIGHT_MULTIPLIER;
  if (state.unlocked.includes(card.id)) weight *= UNLOCKED_CARD_WEIGHT_MULTIPLIER;
  return weight;
}

/**
 * The card for this turn, or null if the deck has nothing eligible — which in
 * M1, with three fixture cards, is most turns. tools/simulate.js reports how
 * often it happens so deck coverage stays visible while the author writes.
 */
export function drawCard(state) {
  const obligationCardId = dueObligationCardId(state);
  if (obligationCardId) {
    const obligationCard = cardById(obligationCardId);
    if (obligationCard) return obligationCard;
  }

  const eligible = eligibleCards(state);
  if (eligible.length === 0) return null;

  const blockedCamp = campBlockedBy(state);
  const balanced = blockedCamp ? eligible.filter((card) => card.camp !== blockedCamp) : eligible;
  // Never deadlock on the balance guard: if honouring it would leave nothing to
  // draw, the guard yields. A missing card is worse than a third same-camp card.
  const pool = balanced.length > 0 ? balanced : eligible;

  const rng = deriveRng(state.rngCursor, state.turn);
  return rng.weightedPick(pool, (card) => drawWeight(state, card));
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function applyEffectBlock(state, effects) {
  if (!effects) return state;
  let next = withAxes(state, effects.axes);
  next = withCapital(next, amplifyCapitalDeltas(next, effects.capital));
  next = applySegmentDeltas(next, effects.segments);
  next = withFlags(next, effects.flags);
  return next;
}

/**
 * Resolves one option of one card.
 *
 * An option's own effects always land. `onFail` is *additional* — a gamble that
 * misses costs you the thing you gambled plus the consequence.
 *
 * @returns {{ state: object, resolution: { cardId, optionIndex, risked, failed, failText } }}
 */
export function applyOption(state, cardId, optionIndex) {
  const card = cardById(cardId);
  if (!card) throw new Error(`applyOption: unknown card id "${cardId}"`);
  const option = card.options[optionIndex];
  if (!option) {
    throw new Error(
      `applyOption: card "${cardId}" has no option at index ${optionIndex} (it has ${card.options.length})`,
    );
  }

  const risked = typeof option.risk === 'number';
  let next = state;
  let failed = false;

  if (risked) {
    const rng = createRng(state.rngCursor);
    failed = rng.chance(option.risk);
    next = { ...next, rngCursor: rng.cursor };
  }

  next = applyEffectBlock(next, option);
  if (failed) next = applyEffectBlock(next, option.onFail);

  if (option.unlocks?.length) {
    const unlocked = [...next.unlocked];
    for (const unlockedCardId of option.unlocks) {
      if (!unlocked.includes(unlockedCardId)) unlocked.push(unlockedCardId);
    }
    next = { ...next, unlocked };
  }

  next = {
    ...next,
    seen: next.seen.includes(cardId) ? next.seen : [...next.seen, cardId],
    history: [...next.history, { turn: state.turn, cardId, optionIndex }],
    pendingObligation:
      next.pendingObligation?.cardId === cardId ? null : next.pendingObligation,
  };

  // The log carries the Hebrew the data layer already wrote. The engine copies
  // strings, it never composes them.
  next = appendLog(next, {
    title: card.title,
    label: option.label,
    failed,
    failText: failed ? option.onFail?.text ?? null : null,
  });

  return {
    state: next,
    resolution: {
      cardId,
      optionIndex,
      risked,
      failed,
      failText: failed ? option.onFail?.text ?? null : null,
    },
  };
}

/**
 * Closes the turn: patron upkeep and ideology pull, any offer left on the table
 * lapses, the clock advances, and the new turn's offers open.
 *
 * Lives here because the turn *is* the card cycle (SPEC §7.1), and because
 * state.js cannot import patron.js without a cycle.
 */
export function endTurn(state) {
  let next = applyPatronUpkeep(state);
  next = lapseUnansweredOffers(next);
  next = advanceTurn(next);
  return openOffers(next);
}
