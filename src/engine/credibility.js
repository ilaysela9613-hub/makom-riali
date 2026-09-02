// Stances, dirty dealing, and voters walking out. DOM-free.
//
// `credibility` as a meter still exists and still moves — it buffers scandals
// inside the engine and feeds the slot chains. What changed is that it stopped
// being the thing the PLAYER watches. The player watches defection: contradict
// a position you took in public, or pile up enough deals that serve only you,
// and specific voters leave, and the run names them.
//
// Two triggers, deliberately different in shape:
//
//   a FLIP is instant. You said one thing, you did the opposite, it lands now.
//   DIRTY accumulates. One arrangement is politics; DIRTY_THRESHOLD of them is
//   a story, and it breaks all at once.
//
// Which segments react, and how hard, is per-segment (`punishes`). Applying one
// moral standard across the whole electorate would be both worse modelling and
// a breach of CLAUDE.md §6.

import SEGMENTS from '../data/segments.js';
import { defectionNarration } from '../data/defections.js';
import {
  DIRTY_THRESHOLD,
  FLIP_DEFECTION_BASE,
  DIRTY_DEFECTION_BASE,
  DEFECTION_MINIMUM_WEIGHT,
} from '../data/tuning.js';
import { SEGMENT_KEYS, AXIS_KEYS } from './state.js';
import { applySegmentDeltas } from './segments.js';

export const INTEGRITY_VALUES = ['dirty'];
export const DEFECTION_REASONS = ['flip', 'dirty'];

/** The position the player has publicly taken on an axis, if any. */
export function declaredStance(state, axisKey) {
  return state.stances[axisKey] ?? null;
}

/** True when this stance contradicts one the player already took in public. */
export function isFlip(state, stance) {
  const declared = declaredStance(state, stance.axis);
  return declared !== null && declared.direction !== stance.direction;
}

/**
 * The segments that react to a given failure hard enough to be worth naming.
 * A defection that nudges all eight segments is not legible; three or four is.
 */
export function segmentsPunishing(reason) {
  return SEGMENT_KEYS.filter(
    (segmentKey) => SEGMENTS[segmentKey].punishes[reason] >= DEFECTION_MINIMUM_WEIGHT,
  );
}

/** Segment deltas for one defection. Always negative — these are losses. */
export function defectionDeltas(reason) {
  const base = reason === 'flip' ? FLIP_DEFECTION_BASE : DIRTY_DEFECTION_BASE;
  const deltas = {};
  for (const segmentKey of segmentsPunishing(reason)) {
    deltas[segmentKey] = -(base * SEGMENTS[segmentKey].punishes[reason]);
  }
  return deltas;
}

/** The blocs those segments sit in, deduplicated, in segment order. */
function blocsForSegments(segmentKeys) {
  const blocs = [];
  for (const segmentKey of segmentKeys) {
    const blocId = SEGMENTS[segmentKey].displayBloc;
    if (!blocs.includes(blocId)) blocs.push(blocId);
  }
  return blocs;
}

function buildDefection(state, { reason, axis = null, turnsAgo = null }) {
  const segments = defectionDeltas(reason);
  const blocs = blocsForSegments(Object.keys(segments));
  const narration = defectionNarration({ reason, axis, turnsAgo, blocs });
  return {
    reason,
    axis,
    turnsAgo,
    turn: state.turn,
    blocs,
    segments,
    headline: narration.headline,
    detail: narration.detail,
  };
}

function withDefection(state, defection) {
  const moved = applySegmentDeltas(state, defection.segments);
  return { ...moved, defections: [...moved.defections, defection] };
}

/**
 * Records a public position. Contradicting one already on the record is a flip,
 * and the flip lands the moment it is made.
 *
 * Re-affirming a position you already hold keeps the ORIGINAL turn, so the
 * narration can say how long you had been saying it.
 */
export function applyStance(state, stance) {
  if (!stance) return { state, defection: null };
  if (!AXIS_KEYS.includes(stance.axis)) {
    throw new Error(`applyStance: unknown ideology axis "${stance.axis}"`);
  }

  const declared = declaredStance(state, stance.axis);
  const flipped = declared !== null && declared.direction !== stance.direction;

  const stances = {
    ...state.stances,
    [stance.axis]: {
      direction: stance.direction,
      // A reaffirmation keeps the date of the original commitment.
      turn: declared && declared.direction === stance.direction ? declared.turn : state.turn,
    },
  };

  if (!flipped) return { state: { ...state, stances }, defection: null };

  const defection = buildDefection(state, {
    reason: 'flip',
    axis: stance.axis,
    turnsAgo: Math.max(1, state.turn - declared.turn),
  });
  return { state: withDefection({ ...state, stances }, defection), defection };
}

/**
 * Records a self-serving arrangement. One is politics. DIRTY_THRESHOLD of them
 * is a story, and then the whole accumulated load breaks at once and resets.
 */
export function applyIntegrity(state, integrity) {
  if (integrity !== 'dirty') return { state, defection: null };

  const dirtyLoad = state.dirtyLoad + 1;
  if (dirtyLoad < DIRTY_THRESHOLD) {
    return { state: { ...state, dirtyLoad }, defection: null };
  }

  const defection = buildDefection(state, { reason: 'dirty' });
  return {
    state: withDefection({ ...state, dirtyLoad: 0 }, defection),
    defection,
  };
}

/**
 * Everything an option's `stance` and `integrity` tags do, in one call.
 * Returns the defections so the turn can narrate them.
 */
export function applyIntegrityConsequences(state, option) {
  const defections = [];
  let next = state;

  const stanceResult = applyStance(next, option.stance);
  next = stanceResult.state;
  if (stanceResult.defection) defections.push(stanceResult.defection);

  const integrityResult = applyIntegrity(next, option.integrity);
  next = integrityResult.state;
  if (integrityResult.defection) defections.push(integrityResult.defection);

  return { state: next, defections };
}
