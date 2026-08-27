// The slot table — מקום ריאלי — the one number the player actually reads.
//
// Two independent multiplier chains feed it, and they must stay independent
// (CLAUDE.md §5.1). Whether a party wants you and what number they write next
// to your name are different questions, and every modifier in the game has to
// be able to move one without touching the other.
//
//   offerChance(party, player) = base(party.tier, player.capital)
//                              × party.offerAffinity(player)
//                              × patron.offerAffinity(party, player)
//
//   slotValue(party, player)   = base(party.openSlots, player.capital)
//                              × party.slotAffinity(player)
//                              × patron.slotAffinity(party, player)
//
// Nothing here is stored on the run state. The slot table is derived, every
// time, from capital + party + patron.

import {
  TIER_BASE_OFFER_CHANCE,
  OFFER_CAPITAL_WEIGHTS,
  OFFER_CHANCE_MINIMUM,
  OFFER_CHANCE_MAXIMUM,
  OFFER_CHANCE_REACHABLE_MINIMUM,
  SLOT_CAPITAL_WEIGHTS,
  BEST_POSSIBLE_SLOT,
  CAPITAL_MAXIMUM,
  OFFER_FIRST_TURN,
  LIST_SUBMISSION_TURN,
  PARTY_SWITCH_CREDIBILITY_COST,
} from '../data/tuning.js';
import { clamp, withCapital } from './state.js';
import { activeParties, rosterParties, joinParty } from './party.js';
import { patronOfferAffinity, patronSlotAffinity, patronBestAttainableSlot } from './patron.js';
import { poll } from './election.js';
import { deriveRng } from './rng.js';

/**
 * A 0…1 reading of the player's capital under a set of weights. Different
 * questions weigh the four meters differently: getting offered a slot at all
 * leans on party standing, being given a *good* slot leans on popularity.
 */
export function capitalScore(capital, weights) {
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const [capitalKey, weight] of Object.entries(weights)) {
    weightedTotal += capital[capitalKey] * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return 0;
  return weightedTotal / totalWeight / CAPITAL_MAXIMUM;
}

/** Probability in 0…1 that this party would put the player on its list. */
export function offerChance(state, party) {
  const base = TIER_BASE_OFFER_CHANCE[party.tier] * capitalScore(state.capital, OFFER_CAPITAL_WEIGHTS);
  const partyMultiplier = typeof party.offerAffinity === 'function' ? party.offerAffinity(state) : 1;
  const patronMultiplier = patronOfferAffinity(state, party);
  return clamp(base * partyMultiplier * patronMultiplier, OFFER_CHANCE_MINIMUM, OFFER_CHANCE_MAXIMUM);
}

/**
 * The slot number this party would give the player. Lower is better.
 *
 * The base walks between the worst and best of the party's open slots
 * according to capital. Both multiplier chains improve the slot as they rise,
 * so they divide rather than multiply.
 */
export function slotValue(state, party) {
  const bestOpenSlot = Math.min(...party.openSlots);
  const worstOpenSlot = Math.max(...party.openSlots);
  const score = capitalScore(state.capital, SLOT_CAPITAL_WEIGHTS);
  const baseSlot = worstOpenSlot - score * (worstOpenSlot - bestOpenSlot);

  const partyMultiplier = typeof party.slotAffinity === 'function' ? party.slotAffinity(state) : 1;
  const patronMultiplier = patronSlotAffinity(state, party);

  const slot = Math.round(baseSlot / (partyMultiplier * patronMultiplier));
  const patronCeiling = patronBestAttainableSlot(state);
  const floor = patronCeiling === null ? BEST_POSSIBLE_SLOT : Math.max(BEST_POSSIBLE_SLOT, patronCeiling);
  return Math.max(floor, slot);
}

/**
 * What slot the player is currently worth in each party, and whether that slot
 * is realistic — inside the party's projected seat count.
 *
 * @returns {{ partyId: string, slot: number, projectedSeats: number,
 *             offerChance: number, reachable: boolean }[]}
 */
export function slotTable(state) {
  const projected = poll(state);

  return activeParties(state)
    .map((party) => {
      const slot = slotValue(state, party);
      const projectedSeats = projected[party.id] ?? 0;
      const chance = offerChance(state, party);
      return {
        partyId: party.id,
        slot,
        projectedSeats,
        // Not in the CLAUDE.md §5 shape, but the HUD needs it and hiding it
        // would collapse the two chains back into one number.
        offerChance: chance,
        reachable: slot <= projectedSeats && chance >= OFFER_CHANCE_REACHABLE_MINIMUM,
        // What the player is worth here is not the same as whether the door is
        // open. These three say whether it is.
        isCurrentParty: party.id === state.party,
        hasOpenOffer: state.offers.some((offer) => offer.partyId === party.id),
        declined: state.declinedParties.includes(party.id),
      };
    })
    .sort((left, right) => {
      if (left.reachable !== right.reachable) return left.reachable ? -1 : 1;
      return right.projectedSeats - left.projectedSeats;
    });
}

/** The best realistic slot on the board right now, or null if nothing is reachable. */
export function bestReachableSlot(state) {
  const reachable = slotTable(state).filter((row) => row.reachable);
  if (reachable.length === 0) return null;
  return reachable.reduce((best, row) => (row.slot < best.slot ? row : best));
}

// ---------------------------------------------------------------------------
// Offers
//
// slotTable above says what the player is WORTH. Nothing there is a door. To
// actually get onto a list you need an offer, and every party makes at most one
// per run. See the note in tuning.js for why.
// ---------------------------------------------------------------------------

// Stream offsets, so the schedule and the roll never draw the same numbers.
// Not balance values — they are PRNG stream separators.
const OFFER_SCHEDULE_STREAM = 1000;
const OFFER_ROLL_STREAM = 2000;

/**
 * The single turn on which this party decides whether it wants the player.
 * Fixed by the run's seed, so it is the same every time a seed is replayed and
 * the player cannot wait for a better moment — the moment is chosen for them.
 */
export function offerRollTurn(state, partyIndex) {
  const rng = deriveRng(state.seed, OFFER_SCHEDULE_STREAM + partyIndex);
  return rng.integer(OFFER_FIRST_TURN, LIST_SUBMISSION_TURN);
}

export function isListSubmissionClosed(state) {
  return state.turn > LIST_SUBMISSION_TURN;
}

export function hasDeclinedParty(state, partyId) {
  return state.declinedParties.includes(partyId);
}

/**
 * Rolls every party scheduled to decide on this turn. Pure: the same state
 * always produces the same offers.
 *
 * The slot in an offer is computed from the player's capital AT THIS MOMENT and
 * then frozen. An offer that arrives on turn 3 is worth what you were worth on
 * turn 3, which is the whole tension — hold out for a better list and you may
 * get nothing at all.
 */
export function offersForTurn(state) {
  if (isListSubmissionClosed(state)) return [];
  if (state.ownParty) return []; // you are running your own list

  const offers = [];
  for (const [partyIndex, party] of rosterParties().entries()) {
    if (party.id === state.party) continue;
    if (hasDeclinedParty(state, party.id)) continue;
    if (offerRollTurn(state, partyIndex) !== state.turn) continue;

    const rng = deriveRng(state.rngCursor, OFFER_ROLL_STREAM + partyIndex);
    if (!rng.chance(offerChance(state, party))) continue;

    offers.push({
      partyId: party.id,
      slot: slotValue(state, party),
      offeredOnTurn: state.turn,
    });
  }
  return offers;
}

/** Puts this turn's offers on the table. Called by endTurn. */
export function openOffers(state) {
  const offers = offersForTurn(state);
  if (offers.length === 0) return state;
  return { ...state, offers };
}

/**
 * Anything still on the table at the end of a turn is gone, and the party that
 * made it does not come back. An offer is answered in the turn it arrives.
 */
export function lapseUnansweredOffers(state) {
  if (state.offers.length === 0) return state;
  const declinedParties = [...state.declinedParties];
  for (const offer of state.offers) {
    if (!declinedParties.includes(offer.partyId)) declinedParties.push(offer.partyId);
  }
  return { ...state, offers: [], declinedParties };
}

/**
 * Takes one of the offers on the table. Every other open offer is turned down
 * in the same breath — those parties move on.
 *
 * Accepting while already on a list means leaving it, which costs credibility.
 */
export function acceptOffer(state, partyId) {
  const offer = state.offers.find((candidate) => candidate.partyId === partyId);
  if (!offer) {
    throw new Error(`acceptOffer: no open offer from "${partyId}" this turn`);
  }

  const declinedParties = [...state.declinedParties];
  for (const other of state.offers) {
    if (other.partyId !== partyId && !declinedParties.includes(other.partyId)) {
      declinedParties.push(other.partyId);
    }
  }

  const isSwitchingLists = Boolean(state.party) && state.party !== partyId;
  const priced = isSwitchingLists
    ? withCapital(state, { credibility: -PARTY_SWITCH_CREDIBILITY_COST })
    : state;

  return {
    ...joinParty({ ...priced, party: null }, partyId, offer.slot),
    offers: [],
    declinedParties,
  };
}

/** Turns down everything on the table. Those parties are closed for the run. */
export function declineOffers(state) {
  return lapseUnansweredOffers(state);
}
