// Election night: turnout variance, vote shares, the threshold, surplus
// agreements, Bader-Ofer allocation to 120 seats, and the player's own outcome.
//
// The player's outcome is slot vs. their party's seat count and nothing else.
// It is not smoothed and must never be — the gap between "I was safe at 9" and
// "we got 7" is the entire emotional payload of the run (SPEC §8).
//
// Gloss note: CLAUDE.md §5 fixes the public API on `seats` / `projectedSeats` /
// `playerSeats`, so `seat` is the single English gloss used throughout this
// file. The word "mandate" appears nowhere in the code. Hebrew strings in
// data/ still say מנדטים.

import SEGMENTS from '../data/segments.js';
import {
  ELECTION_THRESHOLD_SHARE,
  KNESSET_SEATS,
  TURNOUT_VARIANCE_MINIMUM,
  TURNOUT_VARIANCE_MAXIMUM,
  POLL_NOISE_RANGE,
} from '../data/tuning.js';
import { createRng, deriveRng } from './rng.js';
import { playerPartyId, SEGMENT_KEYS } from './state.js';
import { ballotPartyIds, surplusAgreements, resolveRecruitDefections } from './party.js';
import { endTitleFor } from '../data/titles.js';

/**
 * Per-segment turnout. `rng` is optional: a poll asks what would happen at
 * expected turnout, election night rolls the variance that makes the night
 * worth watching.
 */
export function segmentTurnout(rng) {
  const turnout = {};
  for (const segmentKey of SEGMENT_KEYS) {
    const baseTurnout = SEGMENTS[segmentKey].baseTurnout;
    turnout[segmentKey] = rng
      ? baseTurnout * rng.range(TURNOUT_VARIANCE_MINIMUM, TURNOUT_VARIANCE_MAXIMUM)
      : baseTurnout;
  }
  return turnout;
}

/**
 * share[party] = Σ_segment weight[segment] × turnout[segment] × support[segment][party]
 * Normalized to sum to 1.
 */
export function voteShares(state, turnout) {
  const shares = {};
  for (const partyId of ballotPartyIds(state)) shares[partyId] = 0;

  for (const segmentKey of SEGMENT_KEYS) {
    const effectiveVotes = SEGMENTS[segmentKey].weight * turnout[segmentKey];
    const support = state.segments[segmentKey];
    for (const [partyId, segmentShare] of Object.entries(support)) {
      if (!(partyId in shares)) shares[partyId] = 0;
      shares[partyId] += effectiveVotes * segmentShare;
    }
  }

  const total = Object.values(shares).reduce((sum, share) => sum + share, 0);
  if (total <= 0) return shares;
  for (const partyId of Object.keys(shares)) shares[partyId] /= total;
  return shares;
}

export function hasCrossedThreshold(share) {
  return share >= ELECTION_THRESHOLD_SHARE;
}

/**
 * Bader-Ofer: repeatedly hand the next seat to the list with the highest
 * votes / (seats already held + 1). Identical to the highest-averages method.
 */
export function allocateByHighestAverage(voteTotals, totalSeats) {
  const partyIds = Object.keys(voteTotals);
  const seats = {};
  for (const partyId of partyIds) seats[partyId] = 0;
  if (partyIds.length === 0) return seats;

  for (let seatIndex = 0; seatIndex < totalSeats; seatIndex += 1) {
    let winningPartyId = null;
    let bestQuotient = -Infinity;
    for (const partyId of partyIds) {
      const quotient = voteTotals[partyId] / (seats[partyId] + 1);
      if (quotient > bestQuotient) {
        bestQuotient = quotient;
        winningPartyId = partyId;
      }
    }
    if (winningPartyId === null) break;
    seats[winningPartyId] += 1;
  }
  return seats;
}

/**
 * Groups qualifying parties into surplus blocs. Two parties with an agreement
 * are allocated as one list and then split internally — which is exactly why
 * the agreement is worth signing.
 */
function surplusBlocs(qualifyingVotes, agreements) {
  const blocOf = {};
  for (const [firstPartyId, secondPartyId] of agreements) {
    if (!(firstPartyId in qualifyingVotes) || !(secondPartyId in qualifyingVotes)) continue;
    if (firstPartyId in blocOf || secondPartyId in blocOf) continue;
    const blocId = `${firstPartyId}+${secondPartyId}`;
    blocOf[firstPartyId] = blocId;
    blocOf[secondPartyId] = blocId;
  }

  const blocMembers = {};
  for (const partyId of Object.keys(qualifyingVotes)) {
    const blocId = blocOf[partyId] ?? partyId;
    if (!blocMembers[blocId]) blocMembers[blocId] = [];
    blocMembers[blocId].push(partyId);
  }
  return blocMembers;
}

/**
 * Threshold → surplus blocs → Bader-Ofer → 120 seats.
 * @returns {{ [partyId: string]: number }}
 */
export function allocateSeats(shares, agreements) {
  const qualifyingVotes = {};
  for (const [partyId, share] of Object.entries(shares)) {
    if (hasCrossedThreshold(share)) qualifyingVotes[partyId] = share;
  }

  const seats = {};
  for (const partyId of Object.keys(shares)) seats[partyId] = 0;
  if (Object.keys(qualifyingVotes).length === 0) return seats;

  const blocMembers = surplusBlocs(qualifyingVotes, agreements);

  const blocVotes = {};
  for (const [blocId, memberPartyIds] of Object.entries(blocMembers)) {
    blocVotes[blocId] = memberPartyIds.reduce(
      (sum, partyId) => sum + qualifyingVotes[partyId],
      0,
    );
  }

  const blocSeats = allocateByHighestAverage(blocVotes, KNESSET_SEATS);

  for (const [blocId, memberPartyIds] of Object.entries(blocMembers)) {
    if (memberPartyIds.length === 1) {
      seats[memberPartyIds[0]] = blocSeats[blocId];
      continue;
    }
    const memberVotes = {};
    for (const partyId of memberPartyIds) memberVotes[partyId] = qualifyingVotes[partyId];
    const split = allocateByHighestAverage(memberVotes, blocSeats[blocId]);
    for (const partyId of memberPartyIds) seats[partyId] = split[partyId];
  }

  return seats;
}

// Stream offset for weekly polling noise. Not a balance value — a PRNG stream
// separator, kept away from the offer streams in slots.js.
const POLL_NOISE_STREAM = 7000;

/**
 * THIS WEEK'S POLL — a projection, not the result.
 *
 * Two things separate it from election night: it uses expected turnout rather
 * than the night's variance, and it carries a week's sampling noise of its own.
 * That noise is what makes it a poll. Without it the ticker is a pure function
 * of the player's decisions, sits perfectly still on a quiet week, and lands
 * within a seat of the final result from turn 1 — which quietly tells the
 * player the whole campaign is already over.
 *
 * Consumes no run randomness: the noise is derived from (seed, turn), so the
 * same week always polls the same number and repeated renders never flicker.
 *
 * @returns {{ [partyId: string]: number }} projected seats this week
 */
export function poll(state) {
  const trueShares = voteShares(state, segmentTurnout(null));

  const rng = deriveRng(state.seed, POLL_NOISE_STREAM + state.turn);
  const polled = {};
  for (const [partyId, share] of Object.entries(trueShares)) {
    polled[partyId] = share * rng.range(1 - POLL_NOISE_RANGE, 1 + POLL_NOISE_RANGE);
  }

  return allocateSeats(polled, surplusAgreements(state));
}

/**
 * The underlying shares with no sampling noise — what the poll is an estimate
 * OF. Used where a stable reading is needed rather than a weekly sample.
 */
export function trueSeats(state) {
  return allocateSeats(voteShares(state, segmentTurnout(null)), surplusAgreements(state));
}

function largestPartyId(seats) {
  let leader = null;
  for (const [partyId, seatCount] of Object.entries(seats)) {
    if (leader === null || seatCount > seats[leader]) leader = partyId;
  }
  return leader;
}

/**
 * Election night.
 * @returns {{ seats, playerSeats, playerElected, title, shares, turnout, state }}
 */
export function runElection(state) {
  // Recruits who were going to walk walk now, before the list is submitted.
  const submitted = resolveRecruitDefections(state);

  const rng = createRng(submitted.rngCursor);
  const turnout = segmentTurnout(rng);
  const shares = voteShares(submitted, turnout);
  const seats = allocateSeats(shares, surplusAgreements(submitted));
  const settled = { ...submitted, rngCursor: rng.cursor };

  const partyId = playerPartyId(settled);
  const playerSeats = partyId ? seats[partyId] ?? 0 : 0;
  const playerShare = partyId ? shares[partyId] ?? 0 : 0;
  const playerElected = partyId !== null && settled.slot !== null && playerSeats >= settled.slot;

  const title = endTitleFor({
    state: settled,
    seats,
    playerSeats,
    playerSlot: settled.slot,
    playerElected,
    crossedThreshold: partyId !== null && hasCrossedThreshold(playerShare),
    hasOwnParty: Boolean(settled.ownParty),
    isLargestParty: partyId !== null && largestPartyId(seats) === partyId,
  });

  return { seats, playerSeats, playerElected, title, shares, turnout, state: settled };
}
