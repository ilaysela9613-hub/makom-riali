// Taking a patron, at the one place that can see both halves of the deal.
//
// A gatekeeper seats the player on their party's list, which means knowing what
// slot that party would give — and that lives in slots.js, which already imports
// patron.js. Rather than make those two modules import each other, the
// composition happens here.

import { patronById, choosePatron } from './patron.js';
import { slotValue } from './slots.js';
import { partyById } from './party.js';
import { GATEKEEPER_SLOT_CONCESSION, GATEKEEPER_SEAT_DEPTH } from '../data/tuning.js';
import { poll } from './election.js';

/**
 * Takes a patron and applies everything that follows from it.
 *
 * @param {object} state
 * @param {string} patronId
 * @returns {object} new state
 */
/**
 * The slot a gatekeeper would seat this player at, right now.
 *
 * Exported so the patron screen can promise exactly what the engine will
 * deliver — showing `slotValue` there instead would advertise a seat the player
 * does not actually get.
 */
export function gatekeeperSeat(state, patron) {
  if (patron.kind !== 'gatekeeper' || !patron.party) return null;
  const party = partyById(patron.party);
  if (!party) return null;

  const worthOnMerit = slotValue(state, party);
  const projectedSeats = poll(state)[party.id] ?? 0;
  // Where the gatekeeper wants you: comfortably inside the list, scaled to how
  // big that list actually is, and never better than the party has open.
  const target = Math.max(
    Math.min(...party.openSlots),
    Math.round(projectedSeats * GATEKEEPER_SEAT_DEPTH),
  );
  return Math.max(1, Math.round(worthOnMerit - (worthOnMerit - target) * GATEKEEPER_SLOT_CONCESSION));
}

export function takePatron(state, patronId) {
  const patron = patronById(patronId);

  const seatOnList = gatekeeperSeat(state, patron);

  return choosePatron(state, patronId, { seatOnList });
}
