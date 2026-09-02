// Patron selection.
//
// Each patron is shown with its pitch, what it actually gives, and the agenda it
// binds you to. The binding is the whole deal, so it is never buried: a
// gatekeeper hands you a seat on a named list, a sponsor hands you voters or
// money, and both of them own a position of yours from that moment on.
//
// Nothing here composes Hebrew beyond joining strings the data layer already
// wrote (CLAUDE.md §8.2).

import { eligiblePatrons, patronById, gatekeeperSeat } from '../engine/index.js';
import { STARTING_PATRON } from '../data/tuning.js';
import PARTIES from '../data/parties.js';
import { div, span, choiceButton } from './dom.js';

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
    if (capital.resources) parts.push('קופה מלאה');
    if (capital.popularity) parts.push('חשיפה מיידית');
    if (capital.party_standing) parts.push('גב במפלגה');
    if (Object.keys(patron.headStart?.segments ?? {}).length > 0) parts.push('מצביעים מהיום הראשון');
    return parts.join(' · ') || 'התחלה מוקדמת';
  }

  return 'שום דבר — וגם שום מחויבות';
}

export function renderPatronScreen({ state, onChoose }) {
  const available = eligiblePatrons(state);
  const unpatroned = patronById(STARTING_PATRON);

  // The engine excludes the patron you already hold, which at run start is
  // `none`. Put it back: staying independent is a choice being made here.
  const offered = available.some((patron) => patron.id === STARTING_PATRON)
    ? available
    : [...available, unpatroned];

  return div({}, [
    div({ className: 'panel' }, [
      div({ className: 'section-label', text: 'מערכה 2 · הרשימה' }),
      div({ className: 'screen-title', text: 'מי מכניס אותך פנימה' }),
      div({
        className: 'screen-text',
        text: 'אף אחד לא מגיע לכנסת לבד. מי שיפתח לך דלתות יחזיק מהיום עמדה אחת שלך, ואם תזוז ממנה — המצביעים יראו.',
      }),
      div(
        { className: 'choice-list' },
        offered.map((patron) =>
          choiceButton({
            label: patron.displayName,
            lines: [
              { chance: null, text: whatItGives(state, patron), valence: 'positive' },
              {
                chance: null,
                text: patron.agendaText,
                valence: patron.bindingAxes.length > 0 ? 'negative' : 'neutral',
              },
            ],
            modifier: patron.id === STARTING_PATRON ? null : 'primary',
            onSelect: () => onChoose(patron.id),
          }),
        ),
      ),
    ]),

    div(
      { className: 'panel' },
      offered.map((patron) =>
        div({ className: 'screen-text' }, [
          div({ className: 'section-label' }, [
            span({ text: patron.shortName }),
            span({
              className: 'tag',
              text: patron.kind === 'gatekeeper' ? 'שומר סף' : patron.kind === 'sponsor' ? 'מממן' : 'עצמאי',
            }),
          ]),
          patron.pitch,
        ]),
      ),
    ),
  ]);
}
