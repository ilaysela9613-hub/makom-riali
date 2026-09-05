// The end screen.
//
// Five figures in a fixed order, then the drift chart as the reveal, then a way
// to run again. A run that stopped before election day says so first, in plain
// words, before any of the numbers.
//
// The five are ordered so the story reads downward: which list you ended on,
// what number you held on it, what that made you, what the list actually won,
// and what it had been worth at its best. The gap between the last two is the
// whole shape of a campaign — peaking in week nine and sliding is a different
// run from climbing all the way, and the numbers should say which happened.

import PARTIES from '../data/parties.js';
import { renderSeatChart, renderDriftChart } from './screen-election.js';
import { playerPartyId, popularityBand } from '../engine/index.js';
import { div, span, button } from './dom.js';

const EARLY_ENDING_LABELS = {
  dead_end: 'הריצה נעצרה',
  fake_news: 'הקמפיין נגמר',
};

function summaryLine(label, value, modifier = null) {
  return div({ className: `outcome-line${modifier ? ` outcome-line--${modifier}` : ''}` }, [
    span({ className: 'muted', text: label }),
    span({ className: 'outcome-line__value', text: value }),
  ]);
}

export function renderEndScreen({ outcome, startingAxes, onRestart }) {
  const { seats, shares, playerSeats, title, state } = outcome;
  const myPartyId = playerPartyId(state);
  const partyName = myPartyId ? PARTIES[myPartyId]?.name ?? myPartyId : null;
  const endedEarly = state.endedEarly;

  return div({}, [
    // Why it stopped, before anything else, in the words the branch used.
    endedEarly
      ? div({ className: 'panel early-ending' }, [
          div({
            className: 'early-ending__label',
            text: EARLY_ENDING_LABELS[endedEarly.cause] ?? EARLY_ENDING_LABELS.dead_end,
          }),
          div({ className: 'early-ending__text', text: endedEarly.text }),
        ])
      : null,

    div({ className: 'panel' }, [
      div({ className: 'section-label', text: '27 באוקטובר 2026' }),
      div({ className: 'outcome-lines' }, [
        summaryLine('מפלגה סופית', partyName ?? 'לא הגעת לאף רשימה'),
        summaryLine('מקום סופי', state.slot === null ? '—' : String(state.slot)),
        summaryLine('תואר', title.label, 'title'),
        summaryLine('מנדטים סופיים', myPartyId ? String(playerSeats) : '—'),
        summaryLine('שיא מנדטים', state.peakSeats > 0 ? String(state.peakSeats) : '—'),
      ]),
    ]),

    // The four axes ran the entire game without ever being shown. Here they are.
    renderDriftChart({
      startingAxes,
      finalAxes: state.axes,
      bandLabel: popularityBand(state).label,
    }),

    renderSeatChart({ seats, shares, state }),

    button({ type: 'button', className: 'button', onclick: onRestart }, 'סיבוב חדש'),
  ]);
}
