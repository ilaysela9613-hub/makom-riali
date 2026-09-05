// Screen 3 of 3 — who backs you.
//
// Pre-run setup, not an Act 2 turn. It used to render alongside the live HUD,
// which made the most binding decision in the game look like an ordinary week.
// It now carries the same weight as the stream declaration and comes before the
// first card is ever drawn.
//
// Every patron states three things plainly, because the binding IS the deal:
// what it gives, which axes it holds you to, and the agenda you are signing. A
// player who does not know what they are agreeing to has not agreed to it.
//
// Nothing here composes Hebrew beyond joining strings the data layer already
// wrote (CLAUDE.md §8.2).

import { eligiblePatrons, patronById, gatekeeperSeat } from '../engine/index.js';
import { STARTING_PATRON } from '../data/tuning.js';
import PARTIES from '../data/parties.js';
import { AXIS_NAMES } from '../data/feedback.js';
import { div, span, button, choiceButton } from './dom.js';

const KIND_LABELS = {
  gatekeeper: 'שומר סף',
  sponsor: 'מממן',
  none: 'עצמאי',
};

/** What this patron puts on the table, in one line. */
function whatItGives(state, patron) {
  if (patron.kind === 'gatekeeper') {
    // Exactly the seat the engine will hand over — never a different estimate.
    const seat = gatekeeperSeat(state, patron);
    const name = PARTIES[patron.party]?.name ?? patron.party;
    return seat === null ? `מקום ברשימת ${name}` : `מקום ${seat} ברשימת ${name}`;
  }

  if (patron.kind === 'sponsor') {
    const parts = [];
    const capital = patron.headStart?.capital ?? {};
    if (capital.popularity) parts.push('חשיפה מיידית');
    if (capital.party_standing) parts.push('גב במפלגה');
    if (Object.keys(patron.headStart?.segments ?? {}).length > 0) {
      parts.push('מצביעים מהיום הראשון');
    }
    return parts.join(' · ') || 'התחלה מוקדמת';
  }

  return 'שום דבר — וגם שום מחויבות';
}

/** The axes this patron owns from the moment the deal is struck. */
function whatItBinds(patron) {
  if (patron.bindingAxes.length === 0) return 'לא מחזיק אף עמדה שלך';
  const names = patron.bindingAxes.map((axisKey) => AXIS_NAMES[axisKey] ?? axisKey);
  return `מחזיק אותך על ${names.join(' ועל ')}`;
}

export function renderPatronScreen({ state, onChoose, onBack }) {
  const available = eligiblePatrons(state);
  const unpatroned = patronById(STARTING_PATRON);

  // The engine excludes the patron you already hold, which at setup is `none`.
  // Put it back: standing alone is a choice made here, not a default.
  const offered = available.some((patron) => patron.id === STARTING_PATRON)
    ? available
    : [...available, unpatroned];

  return div({ className: 'screen' }, [
    div({ className: 'screen__head' }, [
      button({ type: 'button', className: 'back', onclick: onBack }, '→ חזרה'),
      span({ className: 'screen__step', text: 'שלב 2 מתוך 2' }),
    ]),

    div({ className: 'panel' }, [
      div({ className: 'screen-title', text: 'מי מכניס אותך פנימה' }),
      div({
        className: 'screen-text',
        text: 'אף אחד לא מגיע לכנסת לבד. מי שיפתח לך דלתות יחזיק מהיום עמדה אחת שלך — ואם תזוז ממנה, המצביעים יראו.',
      }),
      div(
        { className: 'choice-list' },
        offered.map((patron) =>
          choiceButton({
            label: `${patron.displayName} · ${KIND_LABELS[patron.kind]}`,
            lines: [
              { chance: null, text: whatItGives(state, patron), valence: 'win' },
              {
                chance: null,
                text: whatItBinds(patron),
                valence: patron.bindingAxes.length > 0 ? 'loss' : 'neutral',
              },
              { chance: null, text: patron.agendaText, valence: 'neutral' },
            ],
            modifier: patron.id === STARTING_PATRON ? null : 'primary',
            onSelect: () => onChoose(patron.id),
          }),
        ),
      ),
    ]),
  ]);
}
