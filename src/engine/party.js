// The party roster as the engine sees it, plus founding and recruitment.
//
// M1 implements the founding gate, the recruit ledger and the surplus
// agreement so that election.js has something real to resolve. The richer
// recruitment market — defection rolls, baggage cards, slot economics — is M4.

import PARTIES, { SURPLUS_AGREEMENTS } from '../data/parties.js';
import RECRUITS from '../data/recruits.js';
import {
  OWN_PARTY_ID,
  OWN_PARTY_TIER,
  OWN_PARTY_OPEN_SLOTS,
  FOUND_PARTY_MIN_POPULARITY,
  FOUNDED_PARTY_INHERITANCE_MINIMUM,
  FOUNDED_PARTY_INHERITANCE_MAXIMUM,
  RECRUIT_DEFECTION_BASE_RISK,
} from '../data/tuning.js';
import { createRng } from './rng.js';
import { createRun, withCapital, withFlags, withAxes } from './state.js';
import {
  applySegmentDeltas,
  withPartyOnEveryBallot,
  withDisplacedParty,
} from './segments.js';

/** Every real and fictional party on the roster, in data order. */
export function rosterParties() {
  return Object.values(PARTIES);
}

export function partyById(partyId) {
  if (partyId === OWN_PARTY_ID) return null;
  return PARTIES[partyId] ?? null;
}

/**
 * The player's own list, presented with the same shape as a roster party so
 * that slots.js and election.js never need to special-case it.
 */
export function ownPartyRecord(ownParty) {
  return {
    id: OWN_PARTY_ID,
    name: ownParty.name,
    real: false,
    tier: OWN_PARTY_TIER,
    axes: { ...ownParty.axes },
    posture: ownParty.posture,
    baseSegments: [],
    selection: 'founder_controlled',
    leader: { name: ownParty.name, traits: ['founder'] },
    openSlots: [...OWN_PARTY_OPEN_SLOTS],
    prestige: 0,
    offerAffinity: () => 1,
    slotAffinity: () => 1,
  };
}

/**
 * The party a founded list pushed off the ballot, if any. That list is gone
 * for the rest of the run: it cannot be joined, polled or voted for.
 */
export function displacedPartyId(state) {
  return state.ownParty?.displacedPartyId ?? null;
}

/** Every party the player could be on a list for this turn. */
export function activeParties(state) {
  const displaced = displacedPartyId(state);
  const parties = rosterParties().filter((party) => party.id !== displaced);
  if (state.ownParty) return [...parties, ownPartyRecord(state.ownParty)];
  return parties;
}

/** Every party that appears on a ballot — the roster plus the player's list. */
export function ballotPartyIds(state) {
  const displaced = displacedPartyId(state);
  const ids = rosterParties()
    .filter((party) => party.id !== displaced)
    .map((party) => party.id);
  if (state.ownParty) ids.push(OWN_PARTY_ID);
  return ids;
}

export function currentParty(state) {
  if (state.ownParty) return ownPartyRecord(state.ownParty);
  return state.party ? partyById(state.party) : null;
}

// ---------------------------------------------------------------------------
// Joining and leaving an existing party
// ---------------------------------------------------------------------------

export function joinParty(state, partyId, slot) {
  const party = partyById(partyId);
  if (!party) throw new Error(`joinParty: unknown party id "${partyId}"`);
  if (state.ownParty) {
    throw new Error('joinParty: cannot join a party while running your own list');
  }
  return {
    ...state,
    party: partyId,
    partyTurns: 0,
    slot,
  };
}

export function leaveParty(state) {
  return { ...state, party: null, partyTurns: 0, slot: null };
}

// ---------------------------------------------------------------------------
// Founding your own party
// ---------------------------------------------------------------------------

/** SPEC §6: popularity above the gate. Below it the option is visible but shut. */
export function canFoundParty(state) {
  if (state.ownParty) return false;
  return state.capital.popularity > FOUND_PARTY_MIN_POPULARITY;
}

/** Straight-line distance between two positions in the four-axis space. */
export function axisDistance(fromAxes, toAxes) {
  let sumOfSquares = 0;
  for (const axisKey of Object.keys(fromAxes)) {
    const difference = fromAxes[axisKey] - (toAxes[axisKey] ?? 0);
    sumOfSquares += difference * difference;
  }
  return Math.sqrt(sumOfSquares);
}

/**
 * The fictional list a new party positioned at `axes` would be competing for
 * the same voters as — and therefore the one it pushes off the ballot.
 *
 * Only fictional parties are candidates. A player-founded list never displaces
 * a real one: real parties have machines, and a new list does not take a
 * machine's place (SPEC §6).
 *
 * Returns null if the roster has no fictional parties left, in which case the
 * founded list simply joins the ballot from nothing.
 */
export function displaceablePartyFor(axes) {
  const fictionalParties = rosterParties().filter((party) => party.real === false);
  if (fictionalParties.length === 0) return null;
  return fictionalParties.reduce((closest, party) =>
    axisDistance(axes, party.axes) < axisDistance(axes, closest.axes) ? party : closest,
  );
}

/**
 * What founding at these axes would cost and displace, without committing to
 * it. The inheritance figure is deliberately absent: it is rolled at founding,
 * so the player picks a niche without knowing what it is worth.
 */
export function foundingPreview(state, axes) {
  const displaced = displaceablePartyFor(axes);
  return {
    displacedPartyId: displaced?.id ?? null,
    displacedPartyName: displaced?.name ?? null,
    meetsCapitalGate: canFoundParty(state),
  };
}

/**
 * Establishes the player's list. Shared by both entry points; enforces no gate
 * of its own, because the two callers gate differently.
 *
 * @param {object} state
 * @param {string} name   Hebrew, supplied by the player — never composed here.
 * @param {object} axes   the list's platform, which need not match the
 *                        player's own ideology. A founder positioning their
 *                        party away from themselves is a real move, and the
 *                        end card's drift chart tracks the player, not the list.
 */
function establishParty(state, name, axes) {
  const partyAxes = { ...axes };
  const displaced = displaceablePartyFor(partyAxes);

  let founded = { ...state };
  let inheritedFraction = 0;

  if (displaced) {
    const rng = createRng(founded.rngCursor);
    inheritedFraction = rng.range(
      FOUNDED_PARTY_INHERITANCE_MINIMUM,
      FOUNDED_PARTY_INHERITANCE_MAXIMUM,
    );
    founded = { ...founded, rngCursor: rng.cursor };
    founded = withDisplacedParty(founded, displaced.id, OWN_PARTY_ID, inheritedFraction);
  } else {
    founded = withPartyOnEveryBallot(founded, OWN_PARTY_ID);
  }

  founded = {
    ...founded,
    party: null,
    partyTurns: 0,
    slot: 1, // you are number one on your own list
    ownParty: {
      name,
      axes: partyAxes,
      posture: state.posture,
      recruits: [],
      surplusPartner: null,
      displacedPartyId: displaced?.id ?? null,
      inheritedFraction,
    },
  };

  return withFlags(founded, ['founded_party']);
}

/**
 * Founds a party mid-run. Gated on capital: below the threshold the option is
 * visible to the player but shut.
 *
 * @param {object} state
 * @param {string} name
 * @param {object} [axes]  defaults to the player's own position
 */
export function foundParty(state, name, axes = state.axes) {
  if (!canFoundParty(state)) {
    throw new Error(
      `foundParty: gate not met — needs popularity > ${FOUND_PARTY_MIN_POPULARITY}`,
    );
  }
  return establishParty(state, name, axes);
}

/**
 * Starts a run that opens with the player's own list already founded, in place
 * of joining anyone. This is the run's premise rather than something bought
 * with capital, so it bypasses the mid-run gate — any stream may do it.
 *
 * @param {number} seed
 * @param {string} streamId
 * @param {{ name: string, axes: object }} founding
 */
export function createFoundedRun(seed, streamId, founding) {
  if (!founding?.name) {
    throw new Error('createFoundedRun: founding.name is required — the player names their own list');
  }
  const state = createRun(seed, streamId);
  return establishParty(state, founding.name, founding.axes ?? state.axes);
}

// ---------------------------------------------------------------------------
// Recruitment
// ---------------------------------------------------------------------------

export function availableRecruits(state) {
  if (!state.ownParty) return [];
  const alreadyRecruited = new Set(state.ownParty.recruits.map((entry) => entry.id));
  return Object.values(RECRUITS).filter(
    (recruit) =>
      !alreadyRecruited.has(recruit.id) && state.capital.party_standing >= recruit.cost.party_standing,
  );
}

/**
 * Signs a recruit. Their `brings` lands as segment support immediately; their
 * `risk` is the chance they walk before the list is submitted, which is rolled
 * at submission time, not here — see `resolveRecruitDefections`.
 */
export function recruit(state, recruitId) {
  const recruitRecord = RECRUITS[recruitId];
  if (!recruitRecord) throw new Error(`recruit: unknown recruit id "${recruitId}"`);
  if (!state.ownParty) throw new Error('recruit: no own party to recruit into');

  let next = withCapital(state, { party_standing: -recruitRecord.cost.party_standing });
  next = applySegmentDeltas(next, recruitRecord.brings);
  next = withAxes(next, recruitRecord.axesPull);
  next = {
    ...next,
    slot: next.slot + recruitRecord.cost.slots, // they take slots above you
    ownParty: {
      ...next.ownParty,
      recruits: [
        ...next.ownParty.recruits,
        { id: recruitRecord.id, defected: false },
      ],
    },
  };
  return next;
}

/**
 * Rolls every signed recruit against their defection risk. Called once, at the
 * submission deadline. A defector takes their segment support back out and
 * frees the slots they were holding.
 */
export function resolveRecruitDefections(state) {
  if (!state.ownParty || state.ownParty.recruits.length === 0) return state;

  const rng = createRng(state.rngCursor);
  let next = { ...state, rngCursor: state.rngCursor };
  const resolved = [];

  for (const entry of state.ownParty.recruits) {
    const recruitRecord = RECRUITS[entry.id];
    const risk = recruitRecord.risk ?? RECRUIT_DEFECTION_BASE_RISK;
    const defected = rng.chance(risk);
    if (defected) {
      const reversed = {};
      for (const [segmentKey, delta] of Object.entries(recruitRecord.brings)) {
        reversed[segmentKey] = -delta;
      }
      next = applySegmentDeltas(next, reversed);
      next = { ...next, slot: Math.max(1, next.slot - recruitRecord.cost.slots) };
    }
    resolved.push({ id: entry.id, defected });
  }

  return {
    ...next,
    rngCursor: rng.cursor,
    ownParty: { ...next.ownParty, recruits: resolved },
  };
}

// ---------------------------------------------------------------------------
// Surplus agreements (הסכם עודפים)
// ---------------------------------------------------------------------------

export function setSurplusPartner(state, partyId) {
  if (!state.ownParty) throw new Error('setSurplusPartner: no own party');
  if (partyId !== null && !partyById(partyId)) {
    throw new Error(`setSurplusPartner: unknown party id "${partyId}"`);
  }
  return { ...state, ownParty: { ...state.ownParty, surplusPartner: partyId } };
}

/**
 * Every surplus pairing in force for this run: the roster's standing
 * agreements plus whatever the player signed for their own list.
 */
export function surplusAgreements(state) {
  const agreements = SURPLUS_AGREEMENTS.map((pair) => [...pair]);
  if (state.ownParty?.surplusPartner) {
    agreements.push([OWN_PARTY_ID, state.ownParty.surplusPartner]);
  }
  return agreements;
}
