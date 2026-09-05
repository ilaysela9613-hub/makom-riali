// The patron layer: who put you where you are, and what they hold over you.
//
// Nobody arrives in the Knesset unsponsored, and the price is never rent. There
// is no upkeep and no per-turn ideological drift. A patron BINDS you: they name
// the axes you are held to, and deviating from one is an ordinary flip that the
// M3 defection code punishes on its own (engine/credibility.js). There is no
// parallel patron punishment anywhere in this file, and there must never be one.
//
//   gatekeeper — puts you straight onto their party's list. Binding directions
//                come from the party's own position.
//   sponsor    — no party, but a head start in voters or capital, and a public
//                agenda whose directions the patron states itself.

import PATRONS from '../data/patrons.js';
import PARTIES from '../data/parties.js';
import {
  STARTING_PATRON,
  PATRON_SWITCH_CREDIBILITY_COST,
  PATRON_BETRAYAL_CHANCE,
  BETRAYAL_TURN_RANGE,
} from '../data/tuning.js';
import { createRng } from './rng.js';
import { withCapital, withFlags } from './state.js';
import { applySegmentDeltas } from './segments.js';
import { applyStance } from './credibility.js';

export const PATRON_KINDS = ['none', 'gatekeeper', 'sponsor'];

/** The card the betrayal demand is presented on. */
export const BETRAYAL_CARD_ID = 'patron_demands_realignment';

export function patronById(patronId) {
  const patron = PATRONS[patronId];
  if (!patron) throw new Error(`patronById: unknown patron id "${patronId}"`);
  return patron;
}

export function currentPatron(state) {
  return patronById(state.patron ?? STARTING_PATRON);
}

export function isEligibleForPatron(state, patron) {
  if (patron.id === state.patron) return false;
  // Nobody crosses the map to back a stranger. A patron who does not deal with
  // the player's declared stream never appears at all.
  if (state.stream && patron.streams && !patron.streams.includes(state.stream)) return false;
  if (typeof patron.eligible !== 'function') return true;
  return patron.eligible(state);
}

/** Every patron the player could take right now, in roster order. */
export function eligiblePatrons(state) {
  return Object.values(PATRONS).filter((patron) => isEligibleForPatron(state, patron));
}

// ---------------------------------------------------------------------------
// Binding
// ---------------------------------------------------------------------------

/**
 * Which way each binding axis points, as an { axis: direction } map.
 *
 * A gatekeeper reads it off their party — being held to a party's line means
 * exactly that. A sponsor has no party to read, so it states its own agenda.
 */
export function bindingDirections(patron) {
  const directions = {};
  for (const axisKey of patron.bindingAxes ?? []) {
    if (patron.kind === 'gatekeeper') {
      const party = PARTIES[patron.party];
      const partyPosition = party?.axes?.[axisKey] ?? 0;
      directions[axisKey] = partyPosition >= 0 ? +1 : -1;
    } else {
      directions[axisKey] = patron.agendaAxes?.[axisKey] ?? +1;
    }
  }
  return directions;
}

/** True while this axis is one the player's patron holds them to. */
export function isBindingAxis(state, axisKey) {
  return (currentPatron(state).bindingAxes ?? []).includes(axisKey);
}

// ---------------------------------------------------------------------------
// Taking a patron
// ---------------------------------------------------------------------------

/**
 * Takes a patron.
 *
 * The binding axes are declared as public stances the moment the deal is struck,
 * which is what makes any later deviation a flip. A gatekeeper also seats the
 * player on their party's list; a sponsor pays out its head start instead.
 *
 * `seatOnList` is passed in rather than computed here: working out what slot a
 * party would give requires slots.js, and slots.js already imports this module.
 */
export function choosePatron(state, patronId, { seatOnList = null } = {}) {
  const patron = patronById(patronId);
  if (!isEligibleForPatron(state, patron)) {
    throw new Error(`choosePatron: "${patronId}" is not eligible for this run state`);
  }

  const isSwitchingAwayFromAPatron = state.patron !== STARTING_PATRON;
  let next = isSwitchingAwayFromAPatron
    ? withCapital(state, { credibility: -PATRON_SWITCH_CREDIBILITY_COST })
    : state;

  next = { ...next, patron: patronId, patronTurns: 0 };

  if (patron.kind === 'sponsor' && patron.headStart) {
    next = withCapital(next, patron.headStart.capital);
    next = applySegmentDeltas(next, patron.headStart.segments);
  }

  if (patron.kind === 'gatekeeper' && seatOnList !== null) {
    next = { ...next, party: patron.party, partyTurns: 0, slot: seatOnList, offers: [] };
  }

  // Declaring the agenda IS the binding. Everything downstream is M3 code.
  const directions = bindingDirections(patron);
  for (const [axisKey, direction] of Object.entries(directions)) {
    next = applyStance(next, { axis: axisKey, direction }).state;
  }
  next = { ...next, bindingAxes: Object.keys(directions), bindingDirections: directions };

  next = scheduleBetrayal(next, patron);

  if (patron.flagsOnTaking) next = withFlags(next, patron.flagsOnTaking);
  return next;
}

// ---------------------------------------------------------------------------
// Betrayal
// ---------------------------------------------------------------------------

/**
 * Rolls whether a patron turns on the player, and when.
 *
 * PATRON_BETRAYAL_CHANCE is a chance PER RUN, not per patron. The roll happens
 * once, the first time the player takes a patron who binds them, and the answer
 * is then fixed for the whole run — switching patrons re-targets a betrayal that
 * was already coming, it never buys a fresh roll. Without that, a player who
 * changed patron every few turns would reroll their fate each time and the
 * stated 25% would mean nothing.
 */
export function scheduleBetrayal(state, patron) {
  const binds = (patron.bindingAxes ?? []).length > 0;

  // Already rolled this run: keep the verdict, just point it at whoever holds
  // the player now.
  if (state.betrayalRolled) {
    if (!state.pendingBetrayal) return state;
    if (!binds) return { ...state, pendingBetrayal: null };
    return { ...state, pendingBetrayal: { ...state.pendingBetrayal, patronId: patron.id } };
  }

  if (!binds) return { ...state, pendingBetrayal: null };

  const rng = createRng(state.rngCursor);
  const willBetray = rng.chance(PATRON_BETRAYAL_CHANCE);
  const [earliestTurn, latestTurn] = BETRAYAL_TURN_RANGE;
  const turn = rng.integer(earliestTurn, latestTurn);

  return {
    ...state,
    rngCursor: rng.cursor,
    betrayalRolled: true,
    pendingBetrayal: willBetray ? { patronId: patron.id, turn } : null,
  };
}

/** The betrayal card id if the demand comes due this turn, otherwise null. */
export function dueBetrayalCardId(state) {
  if (!state.pendingBetrayal) return null;
  if (state.turn < state.pendingBetrayal.turn) return null;
  return BETRAYAL_CARD_ID;
}

/**
 * The player folds. Every binding axis flips to the opposite position.
 *
 * Nothing here punishes anyone. It declares the reversed stances, and because
 * the player already declared the originals when they took the patron, the M3
 * flip detection fires and the voters who care walk out on their own.
 */
export function acceptBetrayal(state) {
  const reversed = {};
  for (const [axisKey, direction] of Object.entries(state.bindingDirections ?? {})) {
    reversed[axisKey] = direction > 0 ? -1 : +1;
  }

  let next = state;
  const defections = [];
  for (const [axisKey, direction] of Object.entries(reversed)) {
    const result = applyStance(next, { axis: axisKey, direction });
    next = result.state;
    defections.push(...result.defections);
  }

  return {
    state: {
      ...next,
      bindingDirections: reversed,
      pendingBetrayal: null,
      betrayalOutcome: 'accepted',
    },
    defections,
  };
}

/**
 * The player refuses. The patron is gone, and with them everything they were
 * holding open — a gatekeeper's seat on the list included.
 *
 * The damage of the refusal itself lives on the card's branches; this only
 * takes back what the patron was providing.
 */
export function refuseBetrayal(state) {
  const patron = currentPatron(state);
  let next = {
    ...state,
    patron: STARTING_PATRON,
    patronTurns: 0,
    bindingAxes: [],
    bindingDirections: {},
    pendingBetrayal: null,
    betrayalOutcome: 'refused',
  };

  if (patron.kind === 'gatekeeper') {
    // He put you on that list. He can take you off it.
    next = { ...next, party: null, partyTurns: 0, slot: null };
  }

  return withFlags(next, ['refused_a_patron']);
}
