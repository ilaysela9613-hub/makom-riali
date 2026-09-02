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
  BRANCH_CHANCE_TOTAL,
  BRANCH_VALENCE_SEGMENT_WEIGHT,
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
import { dueBetrayalCardId, acceptBetrayal, refuseBetrayal } from './patron.js';
import { lapseUnansweredOffers, openOffers } from './slots.js';
import { poll } from './election.js';
import { playerPartyId } from './state.js';
import { applyIntegrityConsequences } from './credibility.js';

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
  // Engine-scheduled cards are never dealt by the weighted draw. They appear
  // when the system that owns them says so, and at no other time.
  if (card.scheduledOnly) return false;
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
  // The patron's demand jumps the queue: when it comes due it is the turn.
  const betrayalCardId = dueBetrayalCardId(state);
  if (betrayalCardId) {
    const betrayalCard = cardById(betrayalCardId);
    if (betrayalCard) return betrayalCard;
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
  next = withCapital(next, effects.capital);
  next = applySegmentDeltas(next, effects.segments);
  next = withFlags(next, effects.flags);
  return next;
}

/** A gamble carries branches; a certain option carries `certainText`. */
export function isGamble(option) {
  return Array.isArray(option.branches);
}

/**
 * Which branch a roll lands on. Chances are whole percentages summing to
 * BRANCH_CHANCE_TOTAL, walked in author order so the first branch listed owns
 * the bottom of the range.
 */
export function resolveBranch(option, rng) {
  const roll = rng.range(0, BRANCH_CHANCE_TOTAL);
  let cumulative = 0;
  for (const branch of option.branches) {
    cumulative += branch.chance;
    if (roll < cumulative) return branch;
  }
  return option.branches[option.branches.length - 1];
}

/**
 * Whether a branch reads as a good outcome or a bad one.
 *
 * Presentation only — it decides the colour of the branch line in the option
 * button and nothing else. A branch that ends the run is always bad news
 * however its numbers happen to add up.
 */
export function branchValence(branch) {
  if (branch.endsRun) return 'negative';
  const capitalTotal = Object.values(branch.capital ?? {}).reduce((sum, delta) => sum + delta, 0);
  const segmentTotal = Object.values(branch.segments ?? {}).reduce((sum, delta) => sum + delta, 0);
  const score = capitalTotal + segmentTotal * BRANCH_VALENCE_SEGMENT_WEIGHT;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/** The cause recorded when a branch ends the run. */
export function endsRunCause(branch) {
  if (!branch?.endsRun) return null;
  return typeof branch.endsRun === 'string' ? branch.endsRun : 'dead_end';
}

/**
 * Resolves one option of one card.
 *
 * A certain option applies its own effect block. A gamble applies exactly one
 * branch, chosen by a roll against the run's seeded PRNG — so the outcome is
 * reproducible from the seed and the player cannot reroll it.
 *
 * @returns {{ state: object, resolution: object }}
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

  const gamble = isGamble(option);
  let next = state;
  let branch = null;
  let branchIndex = null;

  if (gamble) {
    const rng = createRng(state.rngCursor);
    branch = resolveBranch(option, rng);
    branchIndex = option.branches.indexOf(branch);
    next = applyEffectBlock({ ...next, rngCursor: rng.cursor }, branch);
  } else {
    next = applyEffectBlock(next, option);
  }

  // Stances and dirty dealing resolve after the effects, so a defection is
  // priced against the support the player has just finished earning rather than
  // the support they started the turn with.
  const consequences = applyIntegrityConsequences(next, option);
  next = consequences.state;
  const defections = [...consequences.defections];

  // Answering the patron's demand. Accepting reverses the binding stances,
  // which the M3 flip detection then punishes on its own; refusing simply takes
  // back what the patron was providing.
  if (option.patronBetrayal === 'accept') {
    const accepted = acceptBetrayal(next);
    next = accepted.state;
    defections.push(...accepted.defections);
  } else if (option.patronBetrayal === 'refuse') {
    next = refuseBetrayal(next);
  }

  if (option.unlocks?.length) {
    const unlocked = [...next.unlocked];
    for (const unlockedCardId of option.unlocks) {
      if (!unlocked.includes(unlockedCardId)) unlocked.push(unlockedCardId);
    }
    next = { ...next, unlocked };
  }

  const outcomeText = gamble ? branch.text : option.certainText;
  const cause = endsRunCause(branch);

  next = {
    ...next,
    seen: next.seen.includes(cardId) ? next.seen : [...next.seen, cardId],
    history: [...next.history, { turn: state.turn, cardId, optionIndex, branchIndex }],
    pendingBetrayal:
      cardId === 'patron_demands_realignment' ? null : next.pendingBetrayal,
    endedEarly: cause
      ? { turn: state.turn, cardId, cause, text: outcomeText }
      : next.endedEarly,
  };

  // The log carries the Hebrew the data layer already wrote. The engine copies
  // strings, it never composes them.
  next = appendLog(next, {
    title: card.title,
    label: option.label,
    outcomeText,
    endedRun: Boolean(cause),
    defections: defections.map((defection) => defection.detail),
  });

  return {
    state: next,
    resolution: {
      cardId,
      optionIndex,
      gamble,
      branchIndex,
      branch,
      outcomeText,
      valence: branch ? branchValence(branch) : 'neutral',
      endsRun: Boolean(cause),
      cause,
      defections,
    },
  };
}

/** Remembers the best the player's list has ever polled. */
export function recordPeakSeats(state) {
  const partyId = playerPartyId(state);
  if (!partyId) return state;
  const seats = poll(state)[partyId] ?? 0;
  return seats > state.peakSeats ? { ...state, peakSeats: seats } : state;
}

/**
 * Closes the turn: any offer left on the table
 * lapses, the clock advances, and the new turn's offers open.
 *
 * Lives here because the turn *is* the card cycle (SPEC §7.1), and because
 * state.js cannot import patron.js without a cycle.
 */
export function endTurn(state) {
  // No patron upkeep: a patron binds, it does not charge rent.
  let next = recordPeakSeats(state);
  next = lapseUnansweredOffers(next);
  next = advanceTurn(next);
  return openOffers(next);
}
