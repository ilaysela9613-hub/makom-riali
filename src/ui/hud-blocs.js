// Three bloc bars.
//
// The engine simulates eight segments and always will — the election maths
// needs the resolution. These three bars exist so the player tracks three
// numbers instead of eight. The grouping is `displayBloc` in data/segments.js
// and can be retuned there without touching this file.
//
// Bars animate from their previous values so the player SEES support move
// rather than reading that it moved. That is the whole point of the milestone:
// consequences as voters shifting, not as meters changing.

import { blocReadout } from '../engine/index.js';
import { BEAT_LABELS } from '../data/feedback.js';
import { FEEDBACK_ANIMATION_MS } from '../data/tuning.js';
import { div, span } from './dom.js';

// Vote share is a small fraction and needs magnifying to use the width; the
// affinity readout is already a full 0…1 scale and must not be.
const SUPPORT_FULL_SCALE = 0.35;

function barWidth(value, mode) {
  const fraction = mode === 'support' ? value / SUPPORT_FULL_SCALE : value;
  return `${Math.min(100, Math.max(0, fraction * 100))}%`;
}

/**
 * @param {object} state
 * @param {Array|null} previousBlocs  blocSupport() from before the decision;
 *                                    bars start there and animate to the new value
 */
export function renderBlocHud(state, previousBlocs = null) {
  const blocs = blocReadout(state);
  const mode = blocs[0]?.mode ?? 'support';

  const rows = blocs.map((bloc) => {
    const previous = previousBlocs?.find((candidate) => candidate.blocId === bloc.blocId);
    // Only animate between two readings of the SAME quantity. The turn the
    // player joins a list, the bars switch from affinity to vote share and an
    // animation between them would be meaningless.
    const comparable = previous && previous.mode === bloc.mode ? previous : null;
    const startsAt = comparable ? comparable.value : bloc.value;
    const isRising = comparable ? bloc.value > comparable.value + 1e-9 : false;
    const isFalling = comparable ? bloc.value < comparable.value - 1e-9 : false;

    const fill = div({
      className: 'bloc__fill',
      style:
        `inline-size: ${barWidth(startsAt, bloc.mode)}; ` +
        `transition: inline-size ${FEEDBACK_ANIMATION_MS}ms ease`,
    });
    // Hold the old width for one frame so the browser has something to animate
    // from. Rebuilding the DOM every turn otherwise means every bar is born at
    // its final width and nothing ever visibly moves.
    if (comparable) {
      requestAnimationFrame(() => {
        fill.style.inlineSize = barWidth(bloc.value, bloc.mode);
      });
    }

    const modifier = isRising ? ' bloc--rising' : isFalling ? ' bloc--falling' : '';

    return div({ className: `bloc${modifier}` }, [
      div({ className: 'bloc__head' }, [
        span({ className: 'bloc__name', text: bloc.displayName }),
        span({
          className: 'bloc__value',
          text: `${(bloc.value * 100).toFixed(0)}%`,
        }),
      ]),
      div({ className: 'bloc__track' }, [fill]),
    ]);
  });

  return div({ className: 'panel' }, [
    div({
      className: 'section-label',
      text: mode === 'support' ? BEAT_LABELS.blocs : BEAT_LABELS.blocsAffinity,
    }),
    div({ className: 'bloc-list' }, rows),
  ]);
}
