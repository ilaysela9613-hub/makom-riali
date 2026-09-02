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
//
// Two fields exist for the run's presentation and its integrity model:
//
//   `displayBloc` — which of the three visible BLOCS this segment is drawn
//   inside. The engine always works on all eight segments; blocs exist purely
//   so the player tracks three bars instead of eight. Retune the grouping here
//   and no UI code changes.
//
//   `punishes` — how heavily this segment weighs a broken stance versus a dirty
//   deal. Weights live in tuning.js; see the long note there on why these are
//   emphatically not moral scores.

import PARTIES from './parties.js';
import { SEGMENT_PUNISH_WEIGHTS } from './tuning.js';

/**
 * The three blocs the player actually sees, in display order.
 *
 * A DISPLAY grouping and nothing more. It is not a claim about how anyone
 * votes, it does not appear in the election maths, and no bloc is treated as a
 * camp. The split is by what an electorate organises around — the secular
 * statist centre, the traditional and religious publics, and Arab society —
 * because that is the grouping that stays legible at three bars.
 */
export const DISPLAY_BLOCS = [
  { id: 'secular_statist', displayName: 'חילוני־ממלכתי' },
  { id: 'traditional_religious', displayName: 'מסורתי־דתי' },
  { id: 'arab_society', displayName: 'החברה הערבית' },
];

const SEGMENT_DEFINITIONS = {
  secular_center: {
    displayName: 'מרכז חילוני',
    weight: 0.22,
    baseTurnout: 0.72,
    displayBloc: 'secular_statist',
    punishes: SEGMENT_PUNISH_WEIGHTS.secular_center,
  },
  traditional_mizrahi: {
    displayName: 'מסורתי־מזרחי',
    weight: 0.18,
    baseTurnout: 0.65,
    displayBloc: 'traditional_religious',
    punishes: SEGMENT_PUNISH_WEIGHTS.traditional_mizrahi,
  },
  // The most volatile turnout in the file, which is exactly what makes
  // election night worth watching.
  arab: {
    displayName: 'החברה הערבית',
    weight: 0.15,
    baseTurnout: 0.53,
    displayBloc: 'arab_society',
    punishes: SEGMENT_PUNISH_WEIGHTS.arab,
  },
  haredi: {
    displayName: 'חרדי',
    weight: 0.11,
    baseTurnout: 0.88,
    displayBloc: 'traditional_religious',
    punishes: SEGMENT_PUNISH_WEIGHTS.haredi,
  },
  religious_zionist: {
    displayName: 'ציוני־דתי',
    weight: 0.10,
    baseTurnout: 0.85,
    displayBloc: 'traditional_religious',
    punishes: SEGMENT_PUNISH_WEIGHTS.religious_zionist,
  },
  russian_speaking: {
    displayName: 'דוברי רוסית',
    weight: 0.09,
    baseTurnout: 0.62,
    displayBloc: 'secular_statist',
    punishes: SEGMENT_PUNISH_WEIGHTS.russian_speaking,
  },
  periphery_general: {
    displayName: 'פריפריה',
    weight: 0.09,
    baseTurnout: 0.60,
    displayBloc: 'traditional_religious',
    punishes: SEGMENT_PUNISH_WEIGHTS.periphery_general,
  },
  young_reservists: {
    displayName: 'צעירים ומשרתי מילואים',
    weight: 0.06,
    baseTurnout: 0.66,
    displayBloc: 'secular_statist',
    punishes: SEGMENT_PUNISH_WEIGHTS.young_reservists,
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
