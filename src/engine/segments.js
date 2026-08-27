// Segment support math.
//
// Each segment holds a distribution over parties summing to 1.0. A card option
// expresses its effect in *segment delta points* (roughly -3.0 … +3.0, see the
// validator), not in shares — the author thinks in "this moves the haredi
// segment a lot", and tuning.js converts points to share.
//
// Two things happen to every delta:
//   1. It nudges the player's affinity with that segment. Courting a segment
//      builds standing with it whether or not you have a list to move votes
//      onto yet, which is what makes pre-party turns worth playing.
//   2. If the player has a list, it moves support toward that list, scaled by
//      the affinity they already hold. You cannot credibly court a segment you
//      have no affinity with (SPEC §2.4).

import {
  SEGMENT_SHARE_MINIMUM,
  SEGMENT_DELTA_TO_SHARE,
  SEGMENT_DELTA_AFFINITY_FEEDBACK,
  AFFINITY_GAIN_MULTIPLIER_BASE,
  AFFINITY_GAIN_MULTIPLIER_SLOPE,
  AFFINITY_GAIN_MULTIPLIER_FLOOR,
  AFFINITY_MINIMUM,
  AFFINITY_MAXIMUM,
} from '../data/tuning.js';
import { clamp, playerPartyId, SEGMENT_KEYS } from './state.js';

/** Rescales a party distribution to sum to 1.0. */
export function normalizeDistribution(distribution) {
  const total = Object.values(distribution).reduce((sum, share) => sum + share, 0);
  if (total <= 0) return { ...distribution };
  const normalized = {};
  for (const [partyId, share] of Object.entries(distribution)) {
    normalized[partyId] = share / total;
  }
  return normalized;
}

/**
 * How hard a positive delta lands, given the affinity already held.
 * Affinity -1 damps a gain to the floor; affinity +1 amplifies it.
 *
 * Losses are deliberately NOT scaled: alienating a segment you were never
 * close to costs you just as much as alienating one you were.
 */
export function segmentAffinityMultiplier(affinity) {
  return Math.max(
    AFFINITY_GAIN_MULTIPLIER_FLOOR,
    AFFINITY_GAIN_MULTIPLIER_BASE + affinity * AFFINITY_GAIN_MULTIPLIER_SLOPE,
  );
}

/**
 * Moves `shareDelta` of a segment's support onto one party, taking it
 * proportionally from every other party, and renormalizes.
 */
export function shiftSupportToward(distribution, partyId, shareDelta) {
  const shifted = { ...distribution };
  const before = shifted[partyId] ?? 0;
  shifted[partyId] = Math.max(SEGMENT_SHARE_MINIMUM, before + shareDelta);
  const actualDelta = shifted[partyId] - before;

  let othersTotal = 0;
  for (const [otherPartyId, share] of Object.entries(shifted)) {
    if (otherPartyId !== partyId) othersTotal += share;
  }

  if (othersTotal > 0) {
    const scale = Math.max(0, (othersTotal - actualDelta) / othersTotal);
    for (const otherPartyId of Object.keys(shifted)) {
      if (otherPartyId !== partyId) shifted[otherPartyId] *= scale;
    }
  }

  return normalizeDistribution(shifted);
}

/**
 * Applies a card option's `segments` block. Returns a new state.
 * @param {object} state
 * @param {Record<string, number>} segmentDeltas  segment key → delta points
 */
export function applySegmentDeltas(state, segmentDeltas) {
  if (!segmentDeltas) return state;

  const partyId = playerPartyId(state);
  const segments = { ...state.segments };
  const affinity = { ...state.affinity };

  for (const [segmentKey, delta] of Object.entries(segmentDeltas)) {
    if (!(segmentKey in segments)) {
      throw new Error(`applySegmentDeltas: unknown segment "${segmentKey}"`);
    }

    if (partyId) {
      const scaledDelta =
        delta > 0 ? delta * segmentAffinityMultiplier(state.affinity[segmentKey]) : delta;
      segments[segmentKey] = shiftSupportToward(
        segments[segmentKey],
        partyId,
        scaledDelta * SEGMENT_DELTA_TO_SHARE,
      );
    }

    affinity[segmentKey] = clamp(
      affinity[segmentKey] + delta * SEGMENT_DELTA_AFFINITY_FEEDBACK,
      AFFINITY_MINIMUM,
      AFFINITY_MAXIMUM,
    );
  }

  return { ...state, segments, affinity };
}

/** Adds a party to every segment's distribution at zero share. */
export function withPartyOnEveryBallot(state, partyId) {
  const segments = {};
  for (const segmentKey of SEGMENT_KEYS) {
    segments[segmentKey] =
      partyId in state.segments[segmentKey]
        ? state.segments[segmentKey]
        : { ...state.segments[segmentKey], [partyId]: 0 };
  }
  return { ...state, segments };
}

/**
 * Takes one party off the ballot and puts another in its place, handing the
 * newcomer `inheritedFraction` of what the displaced party held in every
 * segment. Everything the newcomer does not inherit is freed, and normalizing
 * hands it back to the remaining parties in proportion to what they already
 * had — which is what actually happens when a list folds.
 *
 * @param {string} displacedPartyId    leaves the ballot entirely
 * @param {string} replacementPartyId  takes its niche
 * @param {number} inheritedFraction   0…1 of the displaced party's support
 */
export function withDisplacedParty(state, displacedPartyId, replacementPartyId, inheritedFraction) {
  const segments = {};
  for (const segmentKey of SEGMENT_KEYS) {
    const distribution = { ...state.segments[segmentKey] };
    const displacedShare = distribution[displacedPartyId] ?? 0;
    delete distribution[displacedPartyId];
    distribution[replacementPartyId] =
      (distribution[replacementPartyId] ?? 0) + displacedShare * inheritedFraction;
    segments[segmentKey] = normalizeDistribution(distribution);
  }
  return { ...state, segments };
}

/** A party's share within one segment. */
export function supportInSegment(state, segmentKey, partyId) {
  return state.segments[segmentKey][partyId] ?? 0;
}
