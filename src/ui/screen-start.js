// The start screen.
//
// Four lines and a choice. No tutorial and no wall of rules: the only thing the
// player genuinely needs told up front is that nothing here can be taken back,
// because every other mechanic explains itself the first time it fires.

import ARCHETYPES from '../data/archetypes.js';
import { FINAL_TURN } from '../data/tuning.js';
import { div, element, button, choiceButton } from './dom.js';

const OPENING_LINES = [
  'אתה מתחיל בלי מפלגה, בלי כסף, ובלי שאף אחד יודע מי אתה.',
  `${FINAL_TURN} שבועות עד הבחירות. כל שבוע מביא החלטה אחת, ורק אחת.`,
  'אין חזרה אחורה. מה שאמרת בפומבי נשאר אמור, ומי שהבטחת לו — זוכר.',
  'בסוף סופרים קולות, ומספר אחד קובע: המקום שלך ברשימה מול המנדטים שהיא קיבלה.',
];

/**
 * @param {string|null} selectedArchetypeId  highlighted but not yet committed
 * @param {Function} onSelect
 * @param {Function} onStart  called only once an archetype is chosen
 */
export function renderStartScreen({ selectedArchetypeId, onSelect, onStart }) {
  const archetypes = Object.values(ARCHETYPES);
  const selected = selectedArchetypeId ? ARCHETYPES[selectedArchetypeId] : null;

  return div({}, [
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

    div({ className: 'panel' }, [
      div({ className: 'section-label', text: 'מאיפה אתה מתחיל' }),
      div(
        { className: 'choice-list' },
        archetypes.map((archetype) =>
          choiceButton({
            label: archetype.displayName,
            lines: [{ chance: null, text: archetype.blurb, valence: 'neutral' }],
            modifier: archetype.id === selectedArchetypeId ? 'primary' : null,
            onSelect: () => onSelect(archetype.id),
          }),
        ),
      ),
    ]),

    button(
      {
        type: 'button',
        className: `button${selected ? '' : ' button--disabled'}`,
        disabled: selected ? null : true,
        onclick: () => selected && onStart(selected.id),
      },
      selected ? `להתחיל כ${selected.displayName}` : 'בחר/י נקודת פתיחה',
    ),

    div({
      className: 'placeholder-note',
      text: 'מפלגות אמיתיות, מנהיגים בדיוניים. תוכן הקלפים בגרסה זו הוא תוכן זמני.',
    }),
  ]);
}
