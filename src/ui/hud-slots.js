// The slot line — מקום ריאלי.
//
// SPEC §1 asks for ONE legible score, so that is what this is: the best slot
// currently reachable and who is offering it, on a single line. The five-party
// table it used to show is still here, behind a tap, for the player who wants
// to know why the number is what it is.
//
// The player never sees the capital meters underneath. They see the number
// those meters produce.

import { slotTable, popularityBand } from '../engine/index.js';
import PARTIES from '../data/parties.js';
import { SLOT_HUD_ROW_LIMIT, POPULARITY_BAND_ANIMATION_MS } from '../data/tuning.js';
import { slotLine, slotWithBand, BEAT_LABELS } from '../data/feedback.js';
import { div, element, span } from './dom.js';

/**
 * The single slot line: the list the player is actually on, or — if they are on
 * none — the best prospect currently open to them.
 *
 * "Best" is the widest MARGIN between the slot and the list's projected seats,
 * not the lowest slot number. Slot 3 on a four-seat list is one bad week from
 * worthless; slot 9 on a sixteen-seat list is a career. Ranking by slot number
 * alone always surfaced the smallest lists on the board.
 *
 * @returns {{ slot, partyId, partyName, projectedSeats, isHeld } | null}
 */
export function bestSlotRow(state) {
  const rows = slotTable(state);

  const current = rows.find((row) => row.isCurrentParty);
  if (current) return decorate(current, true);

  const reachable = rows.filter((row) => row.reachable && !row.declined);
  if (reachable.length === 0) return null;

  const best = reachable.reduce((chosen, row) => {
    const margin = row.projectedSeats - row.slot;
    const chosenMargin = chosen.projectedSeats - chosen.slot;
    if (margin !== chosenMargin) return margin > chosenMargin ? row : chosen;
    return row.offerChance > chosen.offerChance ? row : chosen;
  });
  return decorate(best, false);
}

function decorate(row, isHeld) {
  return { ...row, isHeld, partyName: PARTIES[row.partyId]?.name ?? row.partyId };
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
export function renderSlotHud(state, { isTableOpen, onToggleTable, hasChanged = false, bandChanged = false }) {
  const best = bestSlotRow(state);
  const band = popularityBand(state);
  const hasParty = Boolean(state.party || state.ownParty);

  const slotText = best
    ? slotLine(best.slot, best.partyName, { isHeld: best.isHeld })
    : slotLine(null, null, { isHeld: false });

  const panel = element(
    'details',
    {
      className: `panel slot-panel${hasChanged ? ' slot-panel--changed' : ''}`,
      style: `--band-animation-ms: ${POPULARITY_BAND_ANIMATION_MS}ms`,
      ...(isTableOpen ? { open: true } : {}),
    },
    [
      element('summary', { className: 'slot-summary' }, [
        span({
          className: 'section-label',
          text: best?.isHeld ? BEAT_LABELS.yourSlot : BEAT_LABELS.bestProspect,
        }),
        span({
          className:
            `slot-summary__value${best && !best.isHeld ? ' slot-summary__value--prospect' : ''}` +
            `${bandChanged ? ' slot-summary__value--band-changed' : ''}`,
          text: slotWithBand(slotText, band.label, { hasParty }),
        }),
        span({ className: 'slot-summary__hint', text: BEAT_LABELS.fullTable }),
      ]),
      div({ className: 'slot-panel__body' }, [fullTable(state)]),
    ],
  );

  panel.addEventListener('toggle', () => onToggleTable(panel.open));
  return panel;
}
