// The slot line — מקום ריאלי.
//
// SPEC §1 asks for ONE legible score, so that is what this is: the best slot
// currently reachable and who is offering it, on a single line. The five-party
// table it used to show is still here, behind a tap, for the player who wants
// to know why the number is what it is.
//
// The player never sees the capital meters underneath. They see the number
// those meters produce.

import { slotTable } from '../engine/index.js';
import PARTIES from '../data/parties.js';
import { SLOT_HUD_ROW_LIMIT } from '../data/tuning.js';
import { slotLine, BEAT_LABELS } from '../data/feedback.js';
import { div, element, span } from './dom.js';

/**
 * The single best slot on the board: the party the player is on if they are on
 * one, otherwise the best reachable offer-worthy row.
 *
 * @returns {{ slot: number, partyId: string, partyName: string,
 *             projectedSeats: number, reachable: boolean } | null}
 */
export function bestSlotRow(state) {
  const rows = slotTable(state);
  const current = rows.find((row) => row.isCurrentParty);
  if (current) return decorate(current);

  const reachable = rows.filter((row) => row.reachable && !row.declined);
  if (reachable.length === 0) return null;
  return decorate(reachable.reduce((best, row) => (row.slot < best.slot ? row : best)));
}

function decorate(row) {
  return { ...row, partyName: PARTIES[row.partyId]?.name ?? row.partyId };
}

/** The rows worth showing once the player opens the full table. */
export function mostRelevantRows(state, limit = SLOT_HUD_ROW_LIMIT) {
  const rows = slotTable(state);
  const currentRow = rows.find((row) => row.isCurrentParty);
  const openRows = rows
    .filter((row) => !row.isCurrentParty && !row.declined)
    .sort((left, right) => {
      if (left.hasOpenOffer !== right.hasOpenOffer) return left.hasOpenOffer ? -1 : 1;
      if (left.reachable !== right.reachable) return left.reachable ? -1 : 1;
      return right.offerChance - left.offerChance;
    });
  const closedRows = rows.filter((row) => !row.isCurrentParty && row.declined);
  return [currentRow, ...openRows, ...closedRows].filter(Boolean).slice(0, limit);
}

function fullTable(state) {
  return element('table', { className: 'slot-table' }, [
    element('thead', {}, [
      element('tr', {}, [
        element('th', { text: 'מפלגה' }),
        element('th', { className: 'slot-table__number', text: 'מקום' }),
        element('th', { className: 'slot-table__number', text: 'מנדטים' }),
      ]),
    ]),
    element(
      'tbody',
      {},
      mostRelevantRows(state).map((row) => {
        const classNames = ['slot-row', row.reachable ? 'slot-row--reachable' : 'slot-row--unreachable'];
        if (row.isCurrentParty) classNames.push('slot-row--current');
        if (row.declined) classNames.push('slot-row--declined');
        return element('tr', { className: classNames.join(' ') }, [
          element('td', { className: 'slot-table__party' }, [
            span({ text: PARTIES[row.partyId]?.name ?? row.partyId }),
            row.isCurrentParty ? span({ className: 'tag tag--current', text: 'הרשימה שלך' }) : null,
            row.hasOpenOffer ? span({ className: 'tag tag--offer', text: 'הצעה פתוחה' }) : null,
            row.declined ? span({ className: 'tag', text: 'נסגר' }) : null,
          ]),
          element('td', { className: 'slot-table__number slot-table__slot', text: String(row.slot) }),
          element('td', { className: 'slot-table__number', text: String(row.projectedSeats) }),
        ]);
      }),
    ),
  ]);
}

/**
 * @param {object} state
 * @param {boolean} isTableOpen  kept by the caller so a turn rebuild does not
 *                               collapse the table under the reader
 * @param {Function} onToggleTable
 * @param {boolean} hasChanged   highlights the line when the slot just moved
 */
export function renderSlotHud(state, { isTableOpen, onToggleTable, hasChanged = false }) {
  const best = bestSlotRow(state);

  const panel = element(
    'details',
    { className: `panel slot-panel${hasChanged ? ' slot-panel--changed' : ''}`, ...(isTableOpen ? { open: true } : {}) },
    [
      element('summary', { className: 'slot-summary' }, [
        span({ className: 'section-label', text: BEAT_LABELS.yourSlot }),
        span({
          className: 'slot-summary__value',
          text: best ? slotLine(best.slot, best.partyName) : slotLine(null, null),
        }),
        span({ className: 'slot-summary__hint', text: BEAT_LABELS.fullTable }),
      ]),
      div({ className: 'slot-panel__body' }, [fullTable(state)]),
    ],
  );

  panel.addEventListener('toggle', () => onToggleTable(panel.open));
  return panel;
}
