// Debug panel, behind ?debug=1.
//
// Not in the CLAUDE.md §1 file layout — added because this is what makes the
// MVP testable. Without a way to replay a seed and force a specific card, every
// bug report is "it happened once and I can't get it back".
//
// Shows the whole run state as formatted JSON, takes a seed to replay from, and
// force-draws any card by id so a card can be exercised without waiting for the
// weighted draw to offer it.

import { allCards } from '../engine/index.js';
import { div, element, button } from './dom.js';

export function isDebugEnabled() {
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

function labelledRow(labelText, ...controls) {
  return div({ className: 'debug__row' }, [element('label', { text: labelText }), ...controls]);
}

export function renderDebugPanel({ state, phase, onReplaySeed, onForceCard, isOpen, onToggle }) {
  const seedInput = element('input', {
    type: 'number',
    value: String(state.seed),
    'aria-label': 'seed',
  });

  const cardSelect = element(
    'select',
    { 'aria-label': 'card id' },
    [
      element('option', { value: '', text: '— force a card —' }),
      ...allCards()
        .slice()
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((card) =>
          element('option', {
            value: card.id,
            text: `${card.id} (act ${card.act}, ${card.camp})`,
          }),
        ),
    ],
  );

  const panel = element('details', { className: 'debug', ...(isOpen ? { open: true } : {}) }, [
    element('summary', { text: `debug · turn ${state.turn} · act ${state.act} · ${phase}` }),
    div({ className: 'debug__body' }, [
      labelledRow(
        'seed',
        seedInput,
        button(
          {
            type: 'button',
            onclick: () => onReplaySeed(Number(seedInput.value)),
          },
          'replay',
        ),
      ),
      labelledRow(
        'card',
        cardSelect,
        button(
          {
            type: 'button',
            onclick: () => cardSelect.value && onForceCard(cardSelect.value),
          },
          'draw',
        ),
      ),
      div({ className: 'debug__row' }, [
        element('label', {
          text:
            `turn ${state.turn}/${state.act} · offers ${state.offers.length} · ` +
            `declined ${state.declinedParties.length} · seen ${state.seen.length}`,
        }),
      ]),
      element('pre', { className: 'debug__state', text: JSON.stringify(state, null, 2) }),
    ]),
  ]);

  // <details> fires toggle rather than click; the caller keeps the open state so
  // a turn rebuild does not collapse the panel under the reader.
  panel.addEventListener('toggle', () => onToggle(panel.open));
  return panel;
}
