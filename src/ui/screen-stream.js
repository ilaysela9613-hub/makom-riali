// Screen 3 of 4 — what you say you are.
//
// Sits between the role and the patron because it is the thing the patron
// screen filters on: nobody crosses the map to back a stranger, so the door
// that opens next depends on the answer given here.
//
// Declared once and never again. If the player wants to represent a shift later
// that is a flip — a thing that costs them voters — not a change of stream.

import { STREAMS } from '../data/streams.js';
import { div, span, button, choiceButton } from './dom.js';

export function renderStreamScreen({ selectedStreamId, onSelect, onBack, onConfirm }) {
  const selected = STREAMS.find((stream) => stream.id === selectedStreamId) ?? null;

  return div({ className: 'screen' }, [
    div({ className: 'screen__head' }, [
      button({ type: 'button', className: 'back', onclick: onBack }, '→ חזרה'),
      span({ className: 'screen__step', text: 'שלב 1 מתוך 2' }),
    ]),

    div({ className: 'panel' }, [
      div({ className: 'screen-title', text: 'איפה אתה עומד' }),
      div({
        className: 'screen-text',
        text: 'זה מה שאתה מצהיר עליו בפומבי, וזה לא משתנה. מי שיעמוד בהמשך בצד השני — המצביעים יראו.',
      }),
      div(
        { className: 'choice-list' },
        STREAMS.map((stream) =>
          choiceButton({
            label: stream.label,
            lines: [{ chance: null, text: stream.description, valence: 'neutral' }],
            modifier: stream.id === selectedStreamId ? 'primary' : null,
            onSelect: () => onSelect(stream.id),
          }),
        ),
      ),
    ]),

    button(
      {
        type: 'button',
        className: `button${selected ? '' : ' button--disabled'}`,
        disabled: selected ? null : true,
        onclick: () => selected && onConfirm(selected.id),
      },
      selected ? 'המשך' : 'בחר/י מחנה',
    ),
  ]);
}
