// Screen 1 of 3 — the premise.
//
// Title, four lines, one control. Everything else moved off this screen — a wall
// of choices before the player knows what the game is teaches them nothing.
//
// The only thing worth saying up front is that nothing here can be taken back;
// every other mechanic explains itself the first time it fires.

import { FINAL_TURN } from '../data/tuning.js';
import { div, element, button } from './dom.js';

const OPENING_LINES = [
  'אתה מתחיל בלי מפלגה ובלי שאף אחד יודע מי אתה.',
  `${FINAL_TURN} שבועות עד הבחירות. כל שבוע מביא החלטה אחת, ורק אחת.`,
  'אין חזרה אחורה. מה שאמרת בפומבי נשאר אמור, ומי שהבטחת לו — זוכר.',
  'בסוף סופרים קולות, ומספר אחד קובע: המקום שלך ברשימה מול המנדטים שהיא קיבלה.',
];

export function renderStartScreen({ onStart }) {
  return div({ className: 'screen screen--centred' }, [
    div({ className: 'masthead' }, [
      element('h1', { className: 'masthead__title', text: 'מקום ריאלי' }),
      element('p', {
        className: 'masthead__tagline',
        text: 'קריירה פוליטית אחת, מהתחלה עד ליל הבחירות',
      }),
    ]),

    div(
      { className: 'panel' },
      OPENING_LINES.map((line) => div({ className: 'opening-line', text: line })),
    ),

    button({ type: 'button', className: 'button', onclick: onStart }, 'להתחיל'),
  ]);
}
