// The electorate: eight segments.
//
// `weight` and `baseTurnout` are GAME-BALANCE STARTING VALUES, tuned so the
// opening poll reads like a plausible Knesset. They are not demographic claims
// and nothing here should be read as one.
//
// `baseSupport` — each segment's distribution over parties — is NOT authored
// here. It is built by transposing every party's own `baseSupport` block from
// data/parties.js and normalizing each segment to 1.0. That is what lets the
// roster be rewritten in September as a single-file edit (CLAUDE.md §8.2): add
// or delete a party there and this file needs no change at all.

import PARTIES from './parties.js';

const SEGMENT_DEFINITIONS = {
  secular_center: {
    displayName: 'מרכז חילוני',
    weight: 0.22,
    baseTurnout: 0.72,
  },
  traditional_mizrahi: {
    displayName: 'מסורתי־מזרחי',
    weight: 0.18,
    baseTurnout: 0.65,
  },
  // The most volatile turnout in the file, which is exactly what makes
  // election night worth watching.
  arab: {
    displayName: 'החברה הערבית',
    weight: 0.15,
    baseTurnout: 0.53,
  },
  haredi: {
    displayName: 'חרדי',
    weight: 0.11,
    baseTurnout: 0.88,
  },
  religious_zionist: {
    displayName: 'ציוני־דתי',
    weight: 0.10,
    baseTurnout: 0.85,
  },
  russian_speaking: {
    displayName: 'דוברי רוסית',
    weight: 0.09,
    baseTurnout: 0.62,
  },
  periphery_general: {
    displayName: 'פריפריה',
    weight: 0.09,
    baseTurnout: 0.60,
  },
  young_reservists: {
    displayName: 'צעירים ומשרתי מילואים',
    weight: 0.06,
    baseTurnout: 0.66,
  },
};

/** Transposes the roster's per-party pull into one segment's distribution. */
function distributionForSegment(segmentKey) {
  const distribution = {};
  let total = 0;
  for (const party of Object.values(PARTIES)) {
    const pull = party.baseSupport?.[segmentKey] ?? 0;
    if (pull <= 0) continue;
    distribution[party.id] = pull;
    total += pull;
  }
  if (total <= 0) return distribution;
  for (const partyId of Object.keys(distribution)) {
    distribution[partyId] /= total;
  }
  return distribution;
}

const SEGMENTS = {};
for (const [segmentKey, definition] of Object.entries(SEGMENT_DEFINITIONS)) {
  SEGMENTS[segmentKey] = {
    key: segmentKey,
    ...definition,
    baseSupport: distributionForSegment(segmentKey),
  };
}

export default SEGMENTS;
