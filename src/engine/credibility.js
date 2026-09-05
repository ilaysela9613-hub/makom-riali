// Stances, dirty dealing, and voters walking out. DOM-free.
//
// `credibility` as a meter still exists and still moves — it buffers scandals
// inside the engine and feeds the slot chains. What changed is that it stopped
// being the thing the PLAYER watches. The player watches defection: contradict
// a position you took in public, or pile up enough deals that serve only you,
// and specific voters leave, and the run names them.
//
// ONE TRIGGER. You said one thing in public, you did the opposite, and it lands
// the moment you do it.
//
// M8 deleted the other three punishment systems. Which segments react, and how
// hard, is per-segment (`punishes`) — applying one moral standard across the
// whole electorate would be worse modelling and a breach of CLAUDE.md §6.

import SEGMENTS from '../data/segments.js';
import { defectionNarration } from '../data/defections.js';
import { FLIP_DEFECTION_BASE, DEFECTION_MINIMUM_WEIGHT } from '../data/tuning.js';
import { SEGMENT_KEYS, AXIS_KEYS } from './state.js';
import { applySegmentDeltas } from './segments.js';

export const DEFECTION_REASONS = ['flip'];

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
export function segmentsPunishing() {
  return SEGMENT_KEYS.filter(
    (segmentKey) => SEGMENTS[segmentKey].punishes >= DEFECTION_MINIMUM_WEIGHT,
  );
}

/** Segment deltas for one defection. Always negative — these are losses. */
export function defectionDeltas() {
  const deltas = {};
  for (const segmentKey of segmentsPunishing()) {
    deltas[segmentKey] = -(FLIP_DEFECTION_BASE * SEGMENTS[segmentKey].punishes);
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

function buildDefection(state, { axis, turnsAgo }) {
  const segments = defectionDeltas();
  const blocs = blocsForSegments(Object.keys(segments));
  const narration = defectionNarration({ axis, turnsAgo, blocs });
  return {
    reason: 'flip',
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
  if (!stance) return { state, defections: [] };
  if (!AXIS_KEYS.includes(stance.axis)) {
    throw new Error(`applyStance: unknown ideology axis "${stance.axis}"`);
  }

  const declared = declaredStance(state, stance.axis);
  const flipped = declared !== null && declared.direction !== stance.direction;

  let next = {
    ...state,
    stances: {
      ...state.stances,
      [stance.axis]: {
        direction: stance.direction,
        // A reaffirmation keeps the date of the original commitment.
        turn: declared && declared.direction === stance.direction ? declared.turn : state.turn,
      },
    },
  };

  const defections = [];

  if (flipped) {
    const defection = buildDefection(state, {
      axis: stance.axis,
      turnsAgo: Math.max(1, state.turn - declared.turn),
    });
    next = withDefection(next, defection);
    defections.push(defection);
  }

  return { state: next, defections };
}

/**
 * Everything an option's `stance` tag does, in one call. Returns the defections
 * so the turn can narrate them.
 */
export function applyIntegrityConsequences(state, option) {
  return applyStance(state, option.stance);
}
