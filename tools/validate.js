#!/usr/bin/env node
//
// Card validator. Run it constantly while authoring:
//
//   node tools/validate.js
//
// Exits non-zero on errors. Warnings are reported and do not fail the run.
//
// The error messages matter more than the code in this file. Every one of them
// names the file, the card id, the option it came from, and what specifically
// is wrong — and where a key looks like a typo, what you probably meant.

import { CARD_FILES } from '../src/data/cards/index.js';
import PATRONS from '../src/data/patrons.js';
import PARTIES from '../src/data/parties.js';
import {
  VALID_CARD_ACTS,
  MAX_SEGMENT_DELTA,
  MAX_AXIS_DELTA,
  MAX_CAPITAL_DELTA,
  WARN_SEGMENTS_PER_OPTION,
  WARN_CAPITAL_METERS_PER_OPTION,
  WARN_UNGATED_FROM_ACT,
  OWN_PARTY_TIER,
} from '../src/data/tuning.js';
import { AXIS_KEYS, CAPITAL_KEYS, SEGMENT_KEYS } from '../src/engine/state.js';
import { REQUIRES_KEYS, CAMPS } from '../src/engine/cards.js';

const CARD_DIRECTORY = 'src/data/cards/';

const KNOWN_PATRON_IDS = Object.keys(PATRONS);
const KNOWN_PARTY_TIERS = [
  ...new Set([...Object.values(PARTIES).map((party) => party.tier), OWN_PARTY_TIER]),
];
const KNOWN_PARTY_SELECTIONS = [
  ...new Set([...Object.values(PARTIES).map((party) => party.selection), 'founder_controlled']),
];

// ---------------------------------------------------------------------------
// Problem collection
// ---------------------------------------------------------------------------

const problems = [];

function report(severity, file, cardId, location, message) {
  problems.push({ severity, file, cardId, location, message });
}

const error = (file, cardId, location, message) =>
  report('error', file, cardId, location, message);
const warn = (file, cardId, location, message) =>
  report('warning', file, cardId, location, message);

/**
 * Levenshtein distance, used only to say "did you mean". An author writing
 * Hebrew content all day should not lose an afternoon to `young_reservist`.
 */
function editDistance(left, right) {
  const distances = Array.from({ length: left.length + 1 }, (unused, index) => [index]);
  for (let column = 0; column <= right.length; column += 1) distances[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + substitutionCost,
      );
    }
  }
  return distances[left.length][right.length];
}

function nearestKnownKey(candidate, knownKeys) {
  let best = null;
  let bestDistance = Infinity;
  for (const knownKey of knownKeys) {
    const distance = editDistance(candidate, knownKey);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = knownKey;
    }
  }
  // Only suggest when it is plausibly a typo rather than a different word.
  return bestDistance <= Math.max(2, Math.floor(candidate.length / 3)) ? best : null;
}

function unknownKeyMessage(kind, candidate, knownKeys) {
  const suggestion = nearestKnownKey(candidate, knownKeys);
  return suggestion
    ? `unknown ${kind} "${candidate}" — did you mean "${suggestion}"?`
    : `unknown ${kind} "${candidate}" (known: ${knownKeys.join(', ')})`;
}

// ---------------------------------------------------------------------------
// Effect block checks — shared by an option and by its onFail
// ---------------------------------------------------------------------------

function checkDeltaBlock(file, cardId, location, block, kind, knownKeys, limit) {
  if (block === undefined || block === null) return 0;
  if (typeof block !== 'object' || Array.isArray(block)) {
    error(file, cardId, location, `\`${kind}\` must be an object of key → number`);
    return 0;
  }

  let touched = 0;
  for (const [key, delta] of Object.entries(block)) {
    if (!knownKeys.includes(key)) {
      error(file, cardId, location, unknownKeyMessage(`${kind} key`, key, knownKeys));
      continue;
    }
    if (typeof delta !== 'number' || Number.isNaN(delta)) {
      error(file, cardId, location, `${kind}.${key} must be a number, got ${JSON.stringify(delta)}`);
      continue;
    }
    if (Math.abs(delta) > limit) {
      error(
        file,
        cardId,
        location,
        `${kind}.${key} is ${delta > 0 ? '+' : ''}${delta} — the limit is ±${limit}`,
      );
    }
    touched += 1;
  }
  return touched;
}

function checkEffectBlock(file, cardId, location, effects) {
  const segmentsTouched = checkDeltaBlock(
    file, cardId, location, effects.segments, 'segments', SEGMENT_KEYS, MAX_SEGMENT_DELTA,
  );
  const capitalTouched = checkDeltaBlock(
    file, cardId, location, effects.capital, 'capital', CAPITAL_KEYS, MAX_CAPITAL_DELTA,
  );
  checkDeltaBlock(
    file, cardId, location, effects.axes, 'axes', AXIS_KEYS, MAX_AXIS_DELTA,
  );

  if (effects.flags !== undefined && !Array.isArray(effects.flags)) {
    error(file, cardId, location, '`flags` must be an array of strings');
  }

  return { segmentsTouched, capitalTouched };
}

// ---------------------------------------------------------------------------
// requires block
// ---------------------------------------------------------------------------

function checkRequiresRange(file, cardId, location, kind, bounds, knownKeys) {
  for (const [key, range] of Object.entries(bounds)) {
    if (!knownKeys.includes(key)) {
      error(file, cardId, location, unknownKeyMessage(`requires.${kind} key`, key, knownKeys));
      continue;
    }
    if (typeof range !== 'object' || range === null) {
      error(file, cardId, location, `requires.${kind}.${key} must be { min } and/or { max }`);
      continue;
    }
    for (const boundName of Object.keys(range)) {
      if (boundName !== 'min' && boundName !== 'max') {
        error(
          file, cardId, location,
          `requires.${kind}.${key} has unknown bound "${boundName}" — only min and max are supported`,
        );
      }
    }
    if (range.min !== undefined && range.max !== undefined && range.min > range.max) {
      error(
        file, cardId, location,
        `requires.${kind}.${key} can never pass: min ${range.min} is above max ${range.max}`,
      );
    }
  }
}

function checkRequires(file, card, cardIds) {
  const requires = card.requires;
  if (requires === undefined) return;
  if (typeof requires !== 'object' || requires === null) {
    error(file, card.id, 'requires', '`requires` must be an object');
    return;
  }

  for (const key of Object.keys(requires)) {
    if (!REQUIRES_KEYS.includes(key)) {
      error(file, card.id, 'requires', unknownKeyMessage('requires key', key, REQUIRES_KEYS));
    }
  }

  if (requires.axes) checkRequiresRange(file, card.id, 'requires', 'axes', requires.axes, AXIS_KEYS);
  if (requires.capital) {
    checkRequiresRange(file, card.id, 'requires', 'capital', requires.capital, CAPITAL_KEYS);
  }

  if (requires.patron) {
    for (const patronId of requires.patron) {
      if (!KNOWN_PATRON_IDS.includes(patronId)) {
        error(
          file, card.id, 'requires.patron',
          unknownKeyMessage('patron id', patronId, KNOWN_PATRON_IDS) + ' — not in data/patrons.js',
        );
      }
    }
  }

  if (requires.partyTier) {
    for (const tier of requires.partyTier) {
      if (!KNOWN_PARTY_TIERS.includes(tier)) {
        error(
          file, card.id, 'requires.partyTier',
          `no party on the roster has tier "${tier}" — this card can never be drawn (roster tiers: ${KNOWN_PARTY_TIERS.join(', ')})`,
        );
      }
    }
  }

  if (requires.partySelection) {
    for (const selection of requires.partySelection) {
      if (!KNOWN_PARTY_SELECTIONS.includes(selection)) {
        error(
          file, card.id, 'requires.partySelection',
          unknownKeyMessage('selection method', selection, KNOWN_PARTY_SELECTIONS) +
            ' — this card can never be drawn',
        );
      }
    }
  }

  if (requires.ownParty !== undefined && typeof requires.ownParty !== 'boolean') {
    error(file, card.id, 'requires.ownParty', '`requires.ownParty` must be true or false');
  }

  for (const cardId of requires.notSeen ?? []) {
    if (!cardIds.has(cardId)) {
      error(
        file, card.id, 'requires.notSeen',
        `references card "${cardId}", which does not exist in any card file`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Card and option checks
// ---------------------------------------------------------------------------

function checkOption(file, card, option, optionIndex) {
  const location = `option ${optionIndex + 1}`;

  if (typeof option !== 'object' || option === null) {
    error(file, card.id, location, 'option must be an object');
    return;
  }

  if (!option.label) error(file, card.id, location, 'missing `label` — every option needs one');
  if (!option.pill) {
    error(
      file, card.id, location,
      'missing `pill` — the player must be able to read the mechanical direction of every option',
    );
  }

  const { segmentsTouched, capitalTouched } = checkEffectBlock(file, card.id, location, option);

  if (option.risk !== undefined) {
    if (typeof option.risk !== 'number' || option.risk < 0 || option.risk > 1) {
      error(file, card.id, location, `\`risk\` must be a number in 0…1, got ${JSON.stringify(option.risk)}`);
    }
    if (!option.onFail) {
      error(
        file, card.id, location,
        'has `risk` but no `onFail` — a gamble the player cannot lose is not a gamble',
      );
    }
  }

  if (option.onFail) {
    if (option.risk === undefined) {
      error(file, card.id, location, 'has `onFail` but no `risk` — it can never fire');
    }
    checkEffectBlock(file, card.id, `${location}.onFail`, option.onFail);
  }

  for (const cardId of option.unlocks ?? []) {
    if (!ALL_CARD_IDS.has(cardId)) {
      error(
        file, card.id, `${location}.unlocks`,
        `references card "${cardId}", which does not exist in any card file`,
      );
    }
  }

  if (segmentsTouched > WARN_SEGMENTS_PER_OPTION) {
    warn(
      file, card.id, location,
      `touches ${segmentsTouched} segments — an option moving more than ${WARN_SEGMENTS_PER_OPTION} is hard for the player to read and hard for you to balance`,
    );
  }
  if (capitalTouched > WARN_CAPITAL_METERS_PER_OPTION) {
    warn(
      file, card.id, location,
      `touches ${capitalTouched} capital meters — guidance is at most ${WARN_CAPITAL_METERS_PER_OPTION}`,
    );
  }
}

function checkCard(file, card, seenIds) {
  if (!card.id) {
    error(file, '(no id)', 'card', 'card has no `id` — ids must be unique across ALL card files');
    return;
  }

  if (seenIds.has(card.id)) {
    error(
      file, card.id, 'card',
      `duplicate id — already defined in ${seenIds.get(card.id)}. Ids must be unique across ALL card files`,
    );
  } else {
    seenIds.set(card.id, file);
  }

  if (!VALID_CARD_ACTS.includes(card.act)) {
    error(
      file, card.id, 'card',
      `\`act\` is ${JSON.stringify(card.act)} — must be one of ${VALID_CARD_ACTS.join(' | ')}`,
    );
  }

  if (!card.camp) {
    error(file, card.id, 'card', `missing \`camp\` — required on every card (${CAMPS.join(' | ')})`);
  } else if (!CAMPS.includes(card.camp)) {
    error(file, card.id, 'card', unknownKeyMessage('camp', card.camp, CAMPS));
  }

  if (card.weight !== undefined && (typeof card.weight !== 'number' || card.weight < 0)) {
    error(file, card.id, 'card', `\`weight\` must be a non-negative number, got ${JSON.stringify(card.weight)}`);
  }

  if (!card.title) error(file, card.id, 'card', 'missing `title`');
  if (!card.text) error(file, card.id, 'card', 'missing `text`');

  if (card.placeholder !== undefined && typeof card.placeholder !== 'boolean') {
    error(
      file, card.id, 'card',
      `\`placeholder\` must be true or false, got ${JSON.stringify(card.placeholder)}`,
    );
  }

  if (!Array.isArray(card.options)) {
    error(file, card.id, 'card', '`options` must be an array — every card needs at least 2 options');
  } else {
    if (card.options.length < 2) {
      error(
        file, card.id, 'card',
        `has ${card.options.length} option${card.options.length === 1 ? '' : 's'} — every card needs at least 2`,
      );
    }
    // Checked even when there are too few, so that a half-written card still
    // reports everything wrong inside the options it does have.
    card.options.forEach((option, optionIndex) => checkOption(file, card, option, optionIndex));
  }

  for (const cardId of card.excludes ?? []) {
    if (!ALL_CARD_IDS.has(cardId)) {
      error(
        file, card.id, 'excludes',
        `references card "${cardId}", which does not exist in any card file`,
      );
    }
  }

  checkRequires(file, card, ALL_CARD_IDS);

  if (card.act >= WARN_UNGATED_FROM_ACT && !card.requires) {
    warn(
      file, card.id, 'card',
      `act ${card.act} card with no \`requires\` — probably under-gated, it can fire in any run at any time`,
    );
  }
}

// ---------------------------------------------------------------------------
// Cross-file checks
// ---------------------------------------------------------------------------

const ALL_CARD_IDS = new Set(
  CARD_FILES.flatMap((entry) => entry.cards.map((card) => card.id).filter(Boolean)),
);

function checkPatronObligations() {
  for (const patron of Object.values(PATRONS)) {
    const cardId = patron.obligation?.cardId;
    if (!cardId) continue;
    if (!ALL_CARD_IDS.has(cardId)) {
      warn(
        'src/data/patrons.js', patron.id, 'obligation',
        `obligation card "${cardId}" does not exist yet — the favour will silently never come due`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const seenIds = new Map();
let cardCount = 0;
let placeholderCount = 0;
const placeholdersByFile = new Map();

for (const entry of CARD_FILES) {
  const file = CARD_DIRECTORY + entry.file;
  if (!Array.isArray(entry.cards)) {
    error(file, '(file)', 'file', 'default export must be an array of cards');
    continue;
  }
  for (const card of entry.cards) {
    cardCount += 1;
    if (card.placeholder === true) {
      placeholderCount += 1;
      placeholdersByFile.set(entry.file, (placeholdersByFile.get(entry.file) ?? 0) + 1);
    }
    checkCard(file, card, seenIds);
  }
}

checkPatronObligations();

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const errors = problems.filter((problem) => problem.severity === 'error');
const warnings = problems.filter((problem) => problem.severity === 'warning');

const byFile = new Map();
for (const problem of problems) {
  if (!byFile.has(problem.file)) byFile.set(problem.file, []);
  byFile.get(problem.file).push(problem);
}

for (const [file, fileProblems] of byFile) {
  console.log('');
  console.log(file);
  for (const problem of fileProblems) {
    const marker = problem.severity === 'error' ? 'ERROR  ' : 'warning';
    console.log(`  ${marker}  ${problem.cardId} · ${problem.location}`);
    console.log(`           ${problem.message}`);
  }
}

const fileCount = CARD_FILES.length;
console.log('');
console.log(
  `${cardCount} card${cardCount === 1 ? '' : 's'} in ${fileCount} file${fileCount === 1 ? '' : 's'} · ` +
    `${errors.length} error${errors.length === 1 ? '' : 's'} · ` +
    `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
);

// Generated placeholder content still awaiting a rewrite. Reported on every
// run, never a warning and never an error — it is a progress bar, not a defect.
if (placeholderCount > 0) {
  const written = cardCount - placeholderCount;
  const barWidth = 24;
  const filled = Math.round((written / cardCount) * barWidth);
  console.log('');
  console.log(
    `PLACEHOLDERS  ${'█'.repeat(filled)}${'·'.repeat(barWidth - filled)}  ` +
      `${written}/${cardCount} rewritten · ${placeholderCount} to go`,
  );
  for (const [file, count] of [...placeholdersByFile].sort((left, right) => right[1] - left[1])) {
    console.log(`  ${String(count).padStart(3)}  ${file}`);
  }
} else if (cardCount > 0) {
  console.log('');
  console.log('PLACEHOLDERS  none — every card is yours.');
}
console.log('');

process.exit(errors.length > 0 ? 1 : 0);
