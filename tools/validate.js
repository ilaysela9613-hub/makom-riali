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
  BRANCHES_PER_GAMBLE,
  BRANCH_CHANCE_TOTAL,
  BRANCH_CHANCE_MINIMUM,
  DEAD_END_TARGET_RATE,
} from '../src/data/tuning.js';
import { AXIS_KEYS, CAPITAL_KEYS, SEGMENT_KEYS } from '../src/engine/state.js';
import { REQUIRES_KEYS, CAMPS } from '../src/engine/cards.js';
import { PATRON_KINDS, BETRAYAL_CARD_ID, bindingDirections } from '../src/engine/patron.js';

const CARD_DIRECTORY = 'src/data/cards/';

/**
 * Hebrew infinitives that describe DOING something, as opposed to standing
 * back. Used only to warn when `abstainText` is attached to an active choice.
 */
const ACTIVE_VERB_PATTERN =
  /^(לתמוך|להתנגד|להצביע(?! נגד ולהודיע)|לקחת|לקבל|לדרוש|לכתוב|להשקיע|לאמץ|לסגור|לשרוף|לרכך|להסיר|להסכים|להתעמת|לדחוף|לצאת|לפרסם|לנהל|להתנות|לעמוד|ליזום|להגיע מוכן|להתיישר)/;

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

/**
 * `resources` was removed in M6. It gated `requires` and never once appeared in
 * a decision, which makes it a hidden constant rather than a meter. Anything
 * still naming it is a card written against a schema that no longer exists.
 */
const REMOVED_CAPITAL_KEYS = ['resources'];

function checkRemovedCapital(file, cardId, location, block, kind) {
  if (!block) return;
  for (const key of Object.keys(block)) {
    if (REMOVED_CAPITAL_KEYS.includes(key)) {
      error(
        file, cardId, location,
        `${kind}.${key} — \`${key}\` was removed in M6. Rewrite the gate in terms of ` +
          'popularity or party_standing, whichever fits what the card actually means.',
      );
    }
  }
}

/** Readability counts, for the warnings. Errors are checked separately. */
function countTouched(effects) {
  return {
    segmentsTouched: Object.keys(effects.segments ?? {}).length,
    capitalTouched: Object.keys(effects.capital ?? {}).length,
  };
}

function checkEffectBlock(file, cardId, location, effects) {
  checkRemovedCapital(file, cardId, location, effects.capital, 'capital');
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
    checkRemovedCapital(file, card.id, 'requires', requires.capital, 'requires.capital');
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

  // An option is EXACTLY one of two shapes. There is no third, and no hybrid.
  const isGambleOption = option.branches !== undefined;
  const isAbstainOption = option.abstainText !== undefined;

  if (isGambleOption && isAbstainOption) {
    error(
      file, card.id, location,
      'has both `abstainText` and `branches` — an option is one or the other, never both',
    );
  } else if (!isGambleOption && !isAbstainOption) {
    error(
      file, card.id, location,
      'has neither `abstainText` nor `branches` — every ACTION is a gamble; only a genuine non-action may be certain',
    );
  }

  // `abstainText` is reserved for standing back. An option that DOES something
  // has to carry odds, or the player is being handed a guaranteed outcome for
  // taking an action — which is the thing this milestone removed.
  if (isAbstainOption && ACTIVE_VERB_PATTERN.test(option.label)) {
    warn(
      file, card.id, location,
      `\`abstainText\` on an action label ("${option.label}") — abstainText is for abstaining, ` +
        'refusing or walking away. If the player does something, it needs branches.',
    );
  }

  if (option.pill !== undefined) {
    error(file, card.id, location, '`pill` was removed — state the outcome in each branch');
  }
  if (option.certainText !== undefined) {
    error(
      file, card.id, location,
      '`certainText` was replaced: a non-action uses `abstainText`, an action uses `branches`',
    );
  }
  if (option.risk !== undefined || option.onFail !== undefined) {
    error(
      file, card.id, location,
      '`risk`/`onFail` were replaced by `branches` — two branches with `chance` and `text`',
    );
  }

  if (isAbstainOption) {
    if (typeof option.abstainText !== 'string' || option.abstainText.length === 0) {
      error(file, card.id, location, '`abstainText` must be a non-empty string');
    }
    checkEffectBlock(file, card.id, location, option);
  }

  if (isGambleOption) {
    if (!Array.isArray(option.branches)) {
      error(file, card.id, location, '`branches` must be an array');
      return;
    }
    if (option.branches.length !== BRANCHES_PER_GAMBLE) {
      error(
        file, card.id, location,
        `has ${option.branches.length} branches — a gamble has exactly ${BRANCHES_PER_GAMBLE}`,
      );
    }

    const chanceTotal = option.branches.reduce(
      (sum, branch) => sum + (typeof branch?.chance === 'number' ? branch.chance : 0),
      0,
    );
    if (chanceTotal !== BRANCH_CHANCE_TOTAL) {
      error(
        file, card.id, location,
        `branch chances sum to ${chanceTotal}, not ${BRANCH_CHANCE_TOTAL} — the player is being shown odds that do not add up`,
      );
    }

    // Effects belong to the branches, never to the option around them.
    for (const effectKey of ['capital', 'segments', 'axes', 'flags']) {
      if (option[effectKey] !== undefined) {
        error(
          file, card.id, location,
          `a gamble carries \`${effectKey}\` on its branches, not on the option`,
        );
      }
    }

    option.branches.forEach((branch, branchIndex) => {
      const branchLocation = `${location} branch ${branchIndex + 1}`;
      if (typeof branch !== 'object' || branch === null) {
        error(file, card.id, branchLocation, 'branch must be an object');
        return;
      }
      if (typeof branch.chance !== 'number') {
        error(file, card.id, branchLocation, `\`chance\` must be a number, got ${JSON.stringify(branch.chance)}`);
      } else if (
        branch.chance < BRANCH_CHANCE_MINIMUM ||
        branch.chance > BRANCH_CHANCE_TOTAL - BRANCH_CHANCE_MINIMUM
      ) {
        error(
          file, card.id, branchLocation,
          `\`chance\` is ${branch.chance} — must sit between ${BRANCH_CHANCE_MINIMUM} and ` +
            `${BRANCH_CHANCE_TOTAL - BRANCH_CHANCE_MINIMUM}. Below the floor it is a trap, not a bet.`,
        );
      }
      // The winning branch always says what happened. A failure only needs words
      // when the consequence is not obvious — otherwise a dash, or nothing.
      if (typeof branch.text !== 'string') {
        error(file, card.id, branchLocation, '`text` must be a string (empty is allowed on a losing branch)');
      }
      if (branch.endsRun !== undefined && branch.endsRun !== true && typeof branch.endsRun !== 'string') {
        error(
          file, card.id, branchLocation,
          '`endsRun` must be true, or a string naming the cause',
        );
      }
      checkEffectBlock(file, card.id, branchLocation, branch);
    });
  }

  for (const cardId of option.unlocks ?? []) {
    if (!ALL_CARD_IDS.has(cardId)) {
      error(
        file, card.id, `${location}.unlocks`,
        `references card "${cardId}", which does not exist in any card file`,
      );
    }
  }

  const { segmentsTouched, capitalTouched } = isAbstainOption
    ? countTouched(option)
    : { segmentsTouched: 0, capitalTouched: 0 };

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

  // Two options on one card declaring the SAME position are not a choice — the
  // player cannot avoid the stance, so it should sit on the card, not an option.
  const stanceDirections = new Map();
  for (const [optionIndex, option] of (card.options ?? []).entries()) {
    if (!option?.stance?.axis || !option.stance.direction) continue;
    const signature = `${option.stance.axis} ${option.stance.direction > 0 ? '+1' : '-1'}`;
    if (stanceDirections.has(signature)) {
      warn(
        file, card.id, `option ${optionIndex + 1}`,
        `takes the same stance as option ${stanceDirections.get(signature) + 1} (${signature}) — ` +
          'if every option declares it, it is not a choice the player is making',
      );
    } else {
      stanceDirections.set(signature, optionIndex);
    }
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

function checkPatrons() {
  const file = 'src/data/patrons.js';

  for (const patron of Object.values(PATRONS)) {
    if (!PATRON_KINDS.includes(patron.kind)) {
      error(file, patron.id, 'kind', unknownKeyMessage('patron kind', String(patron.kind), PATRON_KINDS));
    }

    for (const axisKey of patron.bindingAxes ?? []) {
      if (!AXIS_KEYS.includes(axisKey)) {
        error(file, patron.id, 'bindingAxes', unknownKeyMessage('axis', axisKey, AXIS_KEYS));
      }
    }

    if (patron.kind === 'gatekeeper') {
      if (!patron.party) {
        error(file, patron.id, 'party', 'a gatekeeper must name the party it seats you on');
      } else if (!PARTIES[patron.party]) {
        error(
          file, patron.id, 'party',
          `names party "${patron.party}", which is not on the roster in data/parties.js`,
        );
      }
      if (patron.headStart) {
        warn(file, patron.id, 'headStart', 'a gatekeeper gives a seat, not a head start — this is ignored');
      }
    }

    if (patron.kind === 'sponsor') {
      if (patron.party) {
        error(file, patron.id, 'party', 'a sponsor has no party — set it to null');
      }
      for (const axisKey of patron.bindingAxes ?? []) {
        if (patron.agendaAxes?.[axisKey] !== 1 && patron.agendaAxes?.[axisKey] !== -1) {
          error(
            file, patron.id, 'agendaAxes',
            `binds "${axisKey}" but agendaAxes gives no direction for it — a sponsor has no party to read one from`,
          );
        }
      }
    }

    // Every binding axis must resolve to a real direction, or the patron binds
    // the player to nothing and the whole deal is silently free.
    const directions = bindingDirections(patron);
    for (const axisKey of patron.bindingAxes ?? []) {
      if (directions[axisKey] !== 1 && directions[axisKey] !== -1) {
        error(file, patron.id, 'bindingAxes', `"${axisKey}" resolves to no direction`);
      }
    }

    if (!patron.agendaText) {
      warn(file, patron.id, 'agendaText', 'no agenda text — the player is being bound without being told to what');
    }
  }

  if (!ALL_CARD_IDS.has(BETRAYAL_CARD_ID)) {
    error(
      'src/data/cards/', BETRAYAL_CARD_ID, 'betrayal',
      'the betrayal card is missing — patrons can never turn on the player',
    );
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const seenIds = new Map();
let cardCount = 0;
let placeholderCount = 0;
let branchCount = 0;
let deadEndCount = 0;
let systemBranchCount = 0;
let systemDeadEndCount = 0;
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
    for (const option of Array.isArray(card.options) ? card.options : []) {
      for (const branch of option?.branches ?? []) {
        // The betrayal card is engine-scheduled system content, not part of the
        // authored deck, and its run-ender fires at a rate the engine controls.
        // Budgeting it against DEAD_END_TARGET_RATE would be double-counting.
        if (card.id === BETRAYAL_CARD_ID) {
          systemBranchCount += 1;
          if (branch?.endsRun) systemDeadEndCount += 1;
          continue;
        }
        branchCount += 1;
        if (branch?.endsRun) deadEndCount += 1;
      }
    }
    checkCard(file, card, seenIds);
  }
}

checkPatrons();

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

// Dead ends: branches that end the run on the spot. Reported every run so the
// rate can be held while the deck grows — too few and no gamble frightens
// anyone, too many and the run is a coin flip nobody takes twice.
if (branchCount > 0) {
  const rate = deadEndCount / branchCount;
  const target = DEAD_END_TARGET_RATE;

  // One branch either way moves the rate by a whole 100/branchCount points, so
  // on a small deck an exact match to the target simply is not available. Report
  // the achievable counts around the target instead of a false verdict.
  const idealCount = target * branchCount;
  const lowCount = Math.floor(idealCount);
  const highCount = Math.ceil(idealCount);
  const withinBand = deadEndCount >= lowCount && deadEndCount <= highCount;
  const verdict = withinBand
    ? 'on target'
    : deadEndCount > highCount
      ? `HIGH — ${deadEndCount - highCount} too many`
      : `LOW — ${lowCount - deadEndCount} too few`;

  console.log('');
  console.log(
    `DEAD ENDS     ${deadEndCount}/${branchCount} branches end the run · ` +
      `${(rate * 100).toFixed(1)}% vs ${(target * 100).toFixed(0)}% target · ${verdict}`,
  );
  console.log(
    `              at ${branchCount} branches the target allows ` +
      `${lowCount}${highCount === lowCount ? '' : `–${highCount}`} of them`,
  );
  if (systemDeadEndCount > 0) {
    console.log(
      `              plus ${systemDeadEndCount} on engine-scheduled cards, ` +
        'budgeted separately',
    );
  }
}

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
