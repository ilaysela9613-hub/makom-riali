// Election night — the result itself.
//
// Seat bars for everyone who crossed, the threshold drawn as a real line, and
// the lists that fell under it below it with their share. SPEC §8: the gap
// between "I was safe at 9" and "we got 7" is the emotional payload, and this
// is where it lands. Nothing here is smoothed.
//
// The surrounding end screen lives in screen-end.js and composes these two
// charts; this module owns only the charts themselves.
//
// NEUTRALITY (CLAUDE.md §6.5): nothing here may read as a voting recommendation.
// It reports where one fictional career landed and says nothing about any party
// being good or bad to have voted for.

import PARTIES from '../data/parties.js';
import { ELECTION_THRESHOLD_SHARE, KNESSET_SEATS } from '../data/tuning.js';
import { playerPartyId } from '../engine/index.js';
import { AXIS_POLES, driftCaption } from '../data/feedback.js';
import { div, span, formatPercentage } from './dom.js';

function seatRow({ partyId, seats, share, maxSeats, isMine, crossed }) {
  const classNames = ['seat-row'];
  if (isMine) classNames.push('seat-row--mine');
  if (!crossed) classNames.push('seat-row--failed');

  const width = crossed ? (seats / maxSeats) * 100 : (share / ELECTION_THRESHOLD_SHARE) * 12;

  return div({ className: classNames.join(' ') }, [
    div({ className: 'seat-row__name', text: PARTIES[partyId]?.name ?? partyId }),
    div({ className: 'seat-row__track' }, [
      div({ className: 'seat-row__bar', style: `inline-size: ${Math.max(2, width)}%` }),
    ]),
    div({
      className: 'seat-row__seats',
      text: crossed ? String(seats) : formatPercentage(share, 1),
    }),
  ]);
}

/** The full national result, threshold included. */
export function renderSeatChart({ seats, shares, state }) {
  const myPartyId = playerPartyId(state);

  const crossed = Object.entries(seats)
    .filter(([, seatCount]) => seatCount > 0)
    .sort((left, right) => right[1] - left[1]);
  const failed = Object.entries(shares)
    .filter(([partyId]) => (seats[partyId] ?? 0) === 0)
    .sort((left, right) => right[1] - left[1]);

  const maxSeats = crossed.length > 0 ? crossed[0][1] : KNESSET_SEATS;

  return div({ className: 'panel' }, [
    div({ className: 'section-label', text: 'תוצאות' }),
    div(
      { className: 'seat-chart' },
      crossed.map(([partyId, seatCount]) =>
        seatRow({
          partyId,
          seats: seatCount,
          share: shares[partyId] ?? 0,
          maxSeats,
          isMine: partyId === myPartyId,
          crossed: true,
        }),
      ),
    ),
    div({
      className: 'threshold-note',
      text: `אחוז החסימה · ${formatPercentage(ELECTION_THRESHOLD_SHARE, 2)}`,
    }),
    div(
      { className: 'seat-chart' },
      failed.map(([partyId, share]) =>
        seatRow({
          partyId,
          seats: 0,
          share,
          maxSeats,
          isMine: partyId === myPartyId,
          crossed: false,
        }),
      ),
    ),
  ]);
}

function driftAxis(axisKey, startValue, endValue) {
  const [negativePole, positivePole] = AXIS_POLES[axisKey];
  const positionOf = (value) => ((value + 1) / 2) * 100;

  return div({ className: 'drift-axis' }, [
    div({ className: 'drift-axis__label' }, [
      span({ text: negativePole }),
      span({ text: positivePole }),
    ]),
    div({ className: 'drift-axis__track' }, [
      div({
        className: 'drift-axis__marker drift-axis__marker--start',
        style: `inset-inline-start: ${positionOf(startValue)}%`,
      }),
      div({
        className: 'drift-axis__marker drift-axis__marker--end',
        style: `inset-inline-start: ${positionOf(endValue)}%`,
      }),
    ]),
  ]);
}

/**
 * The ideology drift chart — the one place the four axes are ever shown.
 * They run the whole game invisibly and surface here, once, as the reveal.
 */
export function renderDriftChart({ startingAxes, finalAxes, bandLabel }) {
  return div({ className: 'panel' }, [
    div({ className: 'section-label', text: 'איפה התחלת, איפה סיימת' }),
    ...Object.keys(AXIS_POLES).map((axisKey) =>
      driftAxis(axisKey, startingAxes[axisKey], finalAxes[axisKey]),
    ),
    div({ className: 'placeholder-note', text: driftCaption(bandLabel) }),
  ]);
}
