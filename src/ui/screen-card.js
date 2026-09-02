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
import { branchValence, isGamble } from '../engine/index.js';
import { div, span, choiceButton, button } from './dom.js';

/**
 * The outcome rows shown inside an option button.
 *
 * A gamble shows both branches with their real percentages, coloured by whether
 * the outcome is good or bad news. A certain option shows one row with no
 * percentage at all — there is nothing to weigh.
 */
function outcomeLines(option) {
  if (!isGamble(option)) {
    return [{ chance: null, text: option.certainText, valence: 'neutral' }];
  }
  return option.branches.map((branch) => ({
    chance: branch.chance,
    text: branch.text,
    valence: branch.endsRun ? 'fatal' : branchValence(branch),
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
