// A party wants you on its list.
//
// Not in the CLAUDE.md §1 file layout — added because offers became a scarce,
// answerable event in the engine. Without this screen the loop cannot be
// completed: there is no other way onto a list, so there is no way to be
// elected.
//
// The decision is real and it is now. Every party rolls once per run, the slot
// on the table is priced on the capital the player holds this turn, and anything
// not accepted before the turn ends is gone for good.

import { poll } from '../engine/index.js';
import PARTIES from '../data/parties.js';
import { LIST_SUBMISSION_TURN } from '../data/tuning.js';
import { div, choiceButton, button } from './dom.js';

function offerPill(offer, projectedSeats, isSwitching) {
  const room = projectedSeats - offer.slot;
  const realism =
    room >= 3
      ? 'מקום ריאלי בבטחה'
      : room >= 0
        ? 'ריאלי בקושי — מנדט אחד פחות ואתה בחוץ'
        : 'לא ריאלי לפי הסקר הנוכחי';
  return isSwitching ? `${realism} · מעבר רשימה יעלה לך באמינות` : realism;
}

export function renderOfferScreen({ state, onAccept, onDecline }) {
  const projected = poll(state);
  const isSwitching = Boolean(state.party);
  const turnsLeftToJoin = LIST_SUBMISSION_TURN - state.turn;

  return div({ className: 'panel' }, [
    div({ className: 'section-label', text: 'הצעה' }),
    div({
      className: 'screen-title',
      text: state.offers.length > 1 ? 'שתי רשימות רוצות אותך' : 'מציעים לך מקום',
    }),
    div({
      className: 'screen-text',
      text:
        turnsLeftToJoin > 0
          ? `ההצעה על השולחן עכשיו. מי שלא עונים לו היום ממשיך הלאה, ונשארו ${turnsLeftToJoin} שבועות עד סגירת הרשימות.`
          : 'זו ההזדמנות האחרונה. הרשימות נסגרות השבוע.',
    }),
    div(
      { className: 'choice-list' },
      state.offers.map((offer) => {
        const party = PARTIES[offer.partyId];
        const projectedSeats = projected[offer.partyId] ?? 0;
        return choiceButton({
          label: `${party.name} — מקום ${offer.slot}`,
          lines: [{ chance: null, text: `${projectedSeats} מנדטים בסקר · ${offerPill(offer, projectedSeats, isSwitching)}`, valence: 'neutral' }],
          modifier: offer.slot <= projectedSeats ? 'primary' : null,
          onSelect: () => onAccept(offer.partyId),
        });
      }),
    ),
    div({ className: 'section-label', text: ' ' }),
    button(
      { type: 'button', className: 'button button--quiet', onclick: onDecline },
      state.offers.length > 1 ? 'לדחות את שתי ההצעות' : 'לדחות את ההצעה',
    ),
    div({
      className: 'placeholder-note',
      text: 'רשימה שנדחית לא חוזרת להציע.',
    }),
  ]);
}
