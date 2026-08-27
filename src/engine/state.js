// Run state: construction, immutable update helpers, turn and act bookkeeping.
//
// Every function here takes a state and returns a new one. Nothing mutates its
// argument. The cheap spreads are deliberate — a run state is a few kilobytes
// of plain data and a full simulation is only a couple of dozen turns, so
// there is no reason to trade clarity for allocation count.

import { createRng } from './rng.js';
import ARCHETYPES from '../data/archetypes.js';
import SEGMENTS from '../data/segments.js';
import {
  ACT_SCHEDULE,
  FINAL_TURN,
  CAPITAL_MINIMUM,
  CAPITAL_MAXIMUM,
  AXIS_MINIMUM,
  AXIS_MAXIMUM,
  AFFINITY_MINIMUM,
  AFFINITY_MAXIMUM,
  STARTING_PATRON,
  OWN_PARTY_ID,
} from '../data/tuning.js';

export const AXIS_KEYS = ['security', 'religion', 'economy', 'rule_of_law'];
export const CAPITAL_KEYS = ['popularity', 'party_standing', 'credibility', 'resources'];
export const SEGMENT_KEYS = Object.keys(SEGMENTS);
export const POSTURES = [
  'right_religious',
  'center',
  'arab_parties',
  'anti_incumbent_only',
  'anyone',
];

export function clamp(value, minimum, maximum) {
  if (value < minimum) return minimum;
  if (value > maximum) return maximum;
  return value;
}

/** The act a given turn number falls in. See ACT_SCHEDULE in tuning.js. */
export function actForTurn(turn) {
  const scheduled = ACT_SCHEDULE.find(
    (entry) => turn >= entry.firstTurn && turn <= entry.lastTurn,
  );
  return scheduled ? scheduled.act : ACT_SCHEDULE[ACT_SCHEDULE.length - 1].act;
}

function startingSegmentSupport() {
  const segments = {};
  for (const segmentKey of SEGMENT_KEYS) {
    segments[segmentKey] = { ...SEGMENTS[segmentKey].baseSupport };
  }
  return segments;
}

function completeAffinity(partialAffinity) {
  const affinity = {};
  for (const segmentKey of SEGMENT_KEYS) {
    affinity[segmentKey] = clamp(
      partialAffinity[segmentKey] ?? 0,
      AFFINITY_MINIMUM,
      AFFINITY_MAXIMUM,
    );
  }
  return affinity;
}

/**
 * @param {number} seed          a run is fully reproducible from this
 * @param {string} archetypeId   key into data/archetypes.js
 */
export function createRun(seed, archetypeId) {
  const archetype = ARCHETYPES[archetypeId];
  if (!archetype) {
    throw new Error(
      `createRun: unknown archetype id "${archetypeId}". Known ids: ${Object.keys(ARCHETYPES).join(', ')}`,
    );
  }

  const rng = createRng(seed);

  return {
    seed,
    // The PRNG's whole state. Advanced only by functions that consume
    // randomness; carried forward untouched by everything else.
    rngCursor: rng.cursor,

    turn: 1,
    act: actForTurn(1),

    archetype: archetypeId,
    axes: { ...archetype.axes },
    posture: archetype.posture,
    capital: { ...archetype.capital },
    affinity: completeAffinity(archetype.affinity),
    segments: startingSegmentSupport(),

    party: null,
    partyTurns: 0,
    slot: null,

    // Offers open RIGHT NOW, each { partyId, slot, offeredOnTurn }. Answered in
    // the turn they arrive; anything left unanswered lapses into declinedParties.
    offers: [],
    // Parties that offered and were turned down, or whose offer lapsed. They do
    // not come back — this is what makes an offer a decision.
    declinedParties: [],

    patron: STARTING_PATRON,
    patronTurns: 0,
    // Set when a patron is taken: { cardId, turn } — the favour comes due.
    pendingObligation: null,

    ownParty: null,

    flags: [...(archetype.flags ?? [])],
    seen: [],
    // Card ids made drawable by an option's `unlocks`.
    unlocked: [],
    history: [],
    log: [],
  };
}

export function cloneRun(state) {
  return structuredClone(state);
}

export function hasFlag(state, flag) {
  return state.flags.includes(flag);
}

export function withFlags(state, flags) {
  if (!flags || flags.length === 0) return state;
  const added = flags.filter((flag) => !state.flags.includes(flag));
  if (added.length === 0) return state;
  return { ...state, flags: [...state.flags, ...added] };
}

export function withoutFlag(state, flag) {
  if (!state.flags.includes(flag)) return state;
  return { ...state, flags: state.flags.filter((existing) => existing !== flag) };
}

export function withCapital(state, capitalDeltas) {
  if (!capitalDeltas) return state;
  const capital = { ...state.capital };
  for (const [capitalKey, delta] of Object.entries(capitalDeltas)) {
    if (!(capitalKey in capital)) {
      throw new Error(`withCapital: unknown capital meter "${capitalKey}"`);
    }
    capital[capitalKey] = clamp(capital[capitalKey] + delta, CAPITAL_MINIMUM, CAPITAL_MAXIMUM);
  }
  return { ...state, capital };
}

export function withAxes(state, axisDeltas) {
  if (!axisDeltas) return state;
  const axes = { ...state.axes };
  for (const [axisKey, delta] of Object.entries(axisDeltas)) {
    if (!(axisKey in axes)) {
      throw new Error(`withAxes: unknown ideology axis "${axisKey}"`);
    }
    axes[axisKey] = clamp(axes[axisKey] + delta, AXIS_MINIMUM, AXIS_MAXIMUM);
  }
  return { ...state, axes };
}

export function withAffinity(state, affinityDeltas) {
  if (!affinityDeltas) return state;
  const affinity = { ...state.affinity };
  for (const [segmentKey, delta] of Object.entries(affinityDeltas)) {
    if (!(segmentKey in affinity)) {
      throw new Error(`withAffinity: unknown segment "${segmentKey}"`);
    }
    affinity[segmentKey] = clamp(
      affinity[segmentKey] + delta,
      AFFINITY_MINIMUM,
      AFFINITY_MAXIMUM,
    );
  }
  return { ...state, affinity };
}

export function withPosture(state, posture) {
  if (!POSTURES.includes(posture)) {
    throw new Error(`withPosture: unknown coalition posture "${posture}"`);
  }
  return { ...state, posture };
}

/**
 * Log entries carry the Hebrew strings the data layer already authored. The
 * engine copies them, it never composes them — see CLAUDE.md §8.2.
 */
export function appendLog(state, entry) {
  return { ...state, log: [...state.log, { turn: state.turn, ...entry }] };
}

export function advanceTurn(state) {
  const turn = state.turn + 1;
  return {
    ...state,
    turn,
    act: actForTurn(turn),
    partyTurns: state.party || state.ownParty ? state.partyTurns + 1 : 0,
    patronTurns: state.patronTurns + 1,
  };
}

/**
 * The party id the player's votes land on: their own list if they founded one,
 * otherwise whatever party they currently sit in, otherwise null. Lives here
 * rather than in party.js because it reads nothing but the run state, and
 * segments.js needs it without dragging in the party roster.
 */
export function playerPartyId(state) {
  if (state.ownParty) return OWN_PARTY_ID;
  return state.party;
}

/** True once the campaign is over and only election night is left. */
export function isRunOver(state) {
  return state.turn > FINAL_TURN;
}

/** The maximum affinity the player holds with any single segment. */
export function peakSegmentAffinity(state) {
  return Math.max(...SEGMENT_KEYS.map((segmentKey) => state.affinity[segmentKey]));
}

/** The segment the player is closest to, by affinity. */
export function strongestSegment(state) {
  return SEGMENT_KEYS.reduce((best, segmentKey) =>
    state.affinity[segmentKey] > state.affinity[best] ? segmentKey : best,
  );
}
