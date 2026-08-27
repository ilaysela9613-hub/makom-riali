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
} from '../data/tuning.js';
import { clamp } from './state.js';
import { activeParties } from './party.js';
import { patronOfferAffinity, patronSlotAffinity, patronBestAttainableSlot } from './patron.js';
import { poll } from './election.js';

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
