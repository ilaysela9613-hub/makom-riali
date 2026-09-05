// The card screen — the turn itself.
//
// Title, text, and every option as a button carrying its two strings: the label
// as the player would phrase the choice, and the pill stating the mechanical
// direction. The pill removes ambiguity without removing risk — the player knows
// which way a choice pushes, never by how much and never whether a gamble lands.
//
// Also renders the resolution of the turn just played, because a risk roll the
// player never sees resolve is a die thrown behind a curtain.

import {
  blocMovementLine,
  capitalMovementLine,
  slotChangeLine,
  seatChangeLine,
  QUIET_BEAT_LINE,
  BEAT_LABELS,
} from '../data/feedback.js';
import { BLOC_MOVEMENT_NOTICE_THRESHOLD } from '../data/tuning.js';
import { classifyBranches, isGamble } from '../engine/index.js';
import { ROLL_DURATION_MS, BRANCH_CHANCE_TOTAL } from '../data/tuning.js';
import { div, span, choiceButton, button } from './dom.js';

/**
 * The outcome rows shown inside an option button.
 *
 * A gamble shows both branches with their real percentages, coloured by whether
 * the outcome is good or bad news. A certain option shows one row with no
 * percentage at all — there is nothing to weigh.
 */
function outcomeLines(option) {
  // A non-action states its result flatly. There is nothing to weigh.
  if (!isGamble(option)) {
    return [{ chance: null, text: option.abstainText, valence: 'neutral' }];
  }
  const classes = classifyBranches(option);
  return option.branches.map((branch, index) => ({
    chance: branch.chance,
    text: branch.text,
    valence: branch.endsRun ? 'fatal' : classes[index],
  }));
}

export function renderCardScreen({ card, onChoose }) {
  return div({ className: 'panel' }, [
    div({ className: 'screen-title', text: card.title }),
    div({ className: 'screen-text', text: card.text }),
    div(
      { className: 'choice-list' },
      card.options.map((option, optionIndex) =>
        choiceButton({
          label: option.label,
          lines: outcomeLines(option),
          modifier: isGamble(option) ? 'gamble' : null,
          onSelect: () => onChoose(optionIndex),
        }),
      ),
    ),
  ]);
}

/**
 * A turn with nothing in the deck for it. Shown rather than skipped so the clock
 * advancing is always the player's own click.
 */
export function renderQuietTurn({ onContinue }) {
  return div({ className: 'panel' }, [
    div({ className: 'screen-title', text: 'שבוע שקט' }),
    div({
      className: 'screen-text',
      text: 'פגישות, טלפונים, ועוד סבב אחד של מי מדבר עם מי. שום דבר שיזכרו ממנו משהו.',
    }),
    button({ type: 'button', className: 'button', onclick: onContinue }, 'לשבוע הבא'),
  ]);
}

/**
 * The roll, played out where the option list was.
 *
 * The bar is the option's own odds drawn to scale: each branch owns a zone as
 * wide as its chance, in that branch's colour. A marker sweeps the full width
 * and stops where the roll landed — so the player watches the number they
 * accepted decide, instead of being handed a verdict.
 *
 * Nothing here is clickable. Input stays locked for ROLL_DURATION_MS and the
 * roll always plays in full.
 *
 * @param {number} roll  the value in [0,1) that already decided the branch
 */
export function renderRoll({ card, optionIndex, roll }) {
  const option = card.options[optionIndex];
  const classes = classifyBranches(option);

  const marker = div({
    className: 'roll__marker',
    style: `inset-inline-start: 0%; transition: inset-inline-start ${ROLL_DURATION_MS}ms cubic-bezier(0.16, 0.9, 0.3, 1)`,
  });
  // Start at the edge for one frame so the sweep has somewhere to travel from;
  // a marker born at its final position never appears to move.
  requestAnimationFrame(() => {
    marker.style.insetInlineStart = `${roll * 100}%`;
  });

  return div({ className: 'panel' }, [
    div({ className: 'screen-title', text: card.title }),
    div({ className: 'roll__label', text: option.label }),
    div({ className: 'roll' }, [
      ...option.branches.map((branch, index) =>
        div({
          className: `roll__zone roll__zone--${branch.endsRun ? 'fatal' : classes[index]}`,
          style: `flex: 0 0 ${(branch.chance / BRANCH_CHANCE_TOTAL) * 100}%`,
        }, [span({ className: 'roll__zone-chance', text: `${branch.chance}%` })]),
      ),
      marker,
    ]),
  ]);
}

/**
 * The post-turn beat.
 *
 * Shown inline where the card was, never as its own screen, and it dismisses
 * itself — a click only skips ahead. It says what moved in one or two lines of
 * Hebrew while the bloc bars and the seat count animate underneath it, so the
 * player watches the consequence rather than reading a changelog.
 *
 * @param {object}   beat.resolution   from applyOption
 * @param {object[]} beat.blocMovement  [{ displayName, difference }]
 * @param {object|null} beat.slotChange { previousSlot, nextSlot, partyName }
 * @param {object|null} beat.seatChange { previousSeats, nextSeats }
 * @param {Function} beat.onSkip
 */
export function renderFeedbackBeat({
  resolution,
  blocMovement,
  capitalMovement,
  slotChange,
  seatChange,
  holdMs,
  onSkip,
}) {
  const defections = resolution.defections ?? [];

  const lines = [];
  if (resolution.outcomeText) lines.push(resolution.outcomeText);

  // Name only the bloc that moved most. Listing all three is a changelog, and a
  // changelog is exactly what this milestone is replacing.
  const biggestMove = blocMovement
    .filter((bloc) => Math.abs(bloc.difference) >= BLOC_MOVEMENT_NOTICE_THRESHOLD)
    .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))[0];
  if (biggestMove) {
    lines.push(blocMovementLine(biggestMove.displayName, biggestMove.difference));
  }

  // A turn can move standing or money without moving a single voter. The meters
  // are hidden now, but "nothing happened" would be a lie, so say it plainly.
  const biggestCapitalMove = (capitalMovement ?? [])
    .filter((meter) => Math.abs(meter.difference) >= 1)
    .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))[0];
  if (biggestCapitalMove) {
    lines.push(capitalMovementLine(biggestCapitalMove.capitalKey, biggestCapitalMove.difference));
  }

  if (seatChange) {
    const line = seatChangeLine(seatChange.previousSeats, seatChange.nextSeats);
    if (line) lines.push(line);
  }

  if (lines.length === 0 && defections.length === 0) lines.push(QUIET_BEAT_LINE);

  const verdict = resolution.gamble
    ? div({
        className: `beat__verdict beat__verdict--${
          resolution.valence === 'positive' ? 'held' : 'failed'
        }`,
        text: `${resolution.branch.chance}%`,
      })
    : null;

  return div(
    {
      className: `panel beat${defections.length > 0 ? ' beat--defection' : ''}`,
      // Drives the countdown bar, so what the player sees draining matches the
      // timer that is actually running.
      style: `--beat-duration: ${holdMs}ms`,
      onclick: onSkip,
    },
    [
      div({ className: 'section-label', text: BEAT_LABELS.whatMoved }),
      verdict,

      // Voters walking out is the loudest thing that can happen in a turn.
      ...defections.map((defection) =>
        div({ className: 'beat__defection' }, [
          div({ className: 'beat__defection-headline', text: defection.headline }),
          div({ className: 'beat__defection-detail', text: defection.detail }),
        ]),
      ),

      ...lines.slice(0, 2).map((line) => div({ className: 'beat__line', text: line })),

      slotChange
        ? div({
            className: 'beat__slot',
            text: slotChangeLine(
              slotChange.previousSlot,
              slotChange.nextSlot,
              slotChange.partyName,
            ),
          })
        : null,

      div({ className: 'beat__progress' }, [span({ className: 'beat__progress-fill' })]),
    ],
  );
}
