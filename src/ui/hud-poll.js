// The poll: your own list's projected mandates, the date, and the countdown.
//
// SPEC §7.1 keeps the ticker because a seat chart that moves every turn is what
// keeps people clicking. What changed in M3 is the emphasis: ONE big number —
// your list — with everyone else demoted to a thin strip. The player is meant
// to track their own line, not run a national poll in their head.

import { poll, playerPartyId } from '../engine/index.js';
import PARTIES from '../data/parties.js';
import { ELECTION_DATE_ISO, DAYS_PER_TURN, FINAL_TURN } from '../data/tuning.js';
import { BEAT_LABELS } from '../data/feedback.js';
import { div, span } from './dom.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const RIVAL_STRIP_LIMIT = 6;

const hebrewDate = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
});

export function electionDate() {
  return new Date(`${ELECTION_DATE_ISO}T00:00:00`);
}

/** The in-game date on a given turn. Turn FINAL_TURN sits one week out. */
export function dateForTurn(turn) {
  const turnsRemaining = FINAL_TURN - turn + 1;
  return new Date(electionDate().getTime() - turnsRemaining * DAYS_PER_TURN * MILLISECONDS_PER_DAY);
}

export function daysUntilElection(turn) {
  return Math.round((electionDate() - dateForTurn(turn)) / MILLISECONDS_PER_DAY);
}

function deltaBadge(currentSeats, previousSeats) {
  if (previousSeats === null || previousSeats === undefined) return null;
  const difference = currentSeats - previousSeats;
  if (difference === 0) return null;
  return span({
    className: `seat-delta seat-delta--${difference > 0 ? 'up' : 'down'}`,
    text: `${difference > 0 ? '▲' : '▼'}${Math.abs(difference)}`,
  });
}

/**
 * @param {object} state
 * @param {object|null} previousSeats  the poll from before the decision
 */
export function renderPollHud(state, previousSeats = null) {
  const seats = poll(state);
  const myPartyId = playerPartyId(state);
  const mySeats = myPartyId ? seats[myPartyId] ?? 0 : null;

  const rivals = Object.entries(seats)
    .filter(([partyId, seatCount]) => seatCount > 0 && partyId !== myPartyId)
    .sort((left, right) => right[1] - left[1])
    .slice(0, RIVAL_STRIP_LIMIT);

  return div({ className: 'hud-poll' }, [
    div({ className: 'hud-poll__clock' }, [
      span({ className: 'hud-poll__date', text: hebrewDate.format(dateForTurn(state.turn)) }),
      span({
        className: 'hud-poll__countdown',
        text: `${daysUntilElection(state.turn)} ימים לבחירות`,
      }),
    ]),

    div({ className: 'hud-poll__mine' }, [
      div({ className: 'hud-poll__mine-label' }, [
        span({ text: myPartyId ? PARTIES[myPartyId]?.name ?? myPartyId : BEAT_LABELS.noList }),
      ]),
      div({ className: 'hud-poll__mine-value' }, [
        span({ className: 'hud-poll__seats', text: mySeats === null ? '—' : String(mySeats) }),
        span({ className: 'hud-poll__seats-unit', text: 'מנדטים' }),
        myPartyId ? deltaBadge(mySeats, previousSeats?.[myPartyId] ?? null) : null,
      ]),
    ]),

    div(
      { className: 'rival-strip' },
      rivals.map(([partyId, seatCount]) =>
        span({ className: 'rival-strip__item' }, [
          span({ className: 'rival-strip__seats', text: String(seatCount) }),
          span({ className: 'rival-strip__name', text: PARTIES[partyId]?.name ?? partyId }),
        ]),
      ),
    ),
  ]);
}
