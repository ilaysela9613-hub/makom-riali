#!/usr/bin/env node
//
// Headless simulator.
//
//   node tools/simulate.js --runs 1000
//   node tools/simulate.js --runs 500 --stream center
//   node tools/simulate.js --runs 500 --found 1.0
//
// Plays full runs with a random policy and prints the distribution of outcome
// titles plus the mean seats per party. This is what lets the author test a new
// mission's balance impact in seconds instead of clicking through twenty turns.
//
// `playRun` is exported because tools/balance.js drives the same policy.

import { pathToFileURL } from 'node:url';
import {
  createRun,
  createFoundedRun,
  drawCard,
  applyOption,
  endTurn,
  isRunOver,
  eligiblePatrons,
  choosePatron,
  acceptOffer,
  declineOffers,
  poll,
  runElection,
  createRng,
  allCards,
} from '../src/engine/index.js';
import PATRONS from '../src/data/patrons.js';
import PARTIES from '../src/data/parties.js';
import { OWN_PARTY_ID, DEAD_END_TARGET_RATE } from '../src/data/tuning.js';
import { STREAMS, STREAM_IDS } from '../src/data/streams.js';



// ---------------------------------------------------------------------------
// The random policy
//
// Deliberately not a good player. It exists to exercise the whole state space
// evenly, not to find the optimal line — a policy that plays well would hide
// exactly the balance problems this tool is for.
// ---------------------------------------------------------------------------

const DEFAULT_POLICY = {
  /** Chance of founding your own list at character creation. */
  foundChance: 0.2,
  /**
   * Chance of taking a real patron during setup rather than standing alone.
   * Chosen ONCE, before the first card — patron selection is pre-run setup now,
   * not something that can happen on turn 14.
   */
  patronChance: 0.75,
  /**
   * Chance of accepting an offer the policy judges realistic — a slot inside
   * that party's projected seat count. An unrealistic offer is always declined.
   * Offers cannot be deferred: whatever is not accepted this turn is gone.
   */
  acceptChance: 0.8,
};

/** A name for a player-founded list. Never shown to a player; simulator only. */
const SIMULATED_PARTY_NAME = 'רשימה חדשה';

/**
 * Plays one full run to election night.
 *
 * @param {number} seed
 * @param {string} streamId  the whole of character creation since M8
 * @param {object} [policy]
 * @returns {{ seed, streamId, title, playerSeats, playerElected, seats,
 *             founded, joinedPartyId, patron, cardsDrawn, emptyTurns, state }}
 */
export function playRun(seed, streamId, policy = {}) {
  const { foundChance, patronChance, acceptChance } = { ...DEFAULT_POLICY, ...policy };

  // A separate stream, so policy coin-flips never disturb the run's own cursor
  // and a given seed always produces the same run for a given policy.
  const decisions = createRng((seed ^ 0x5bf03635) >>> 0);

  const founded = decisions.chance(foundChance);
  let state = founded
    ? createFoundedRun(seed, streamId, {
        name: SIMULATED_PARTY_NAME,
        // A founder positions their list somewhere near, but not exactly on,
        // their own ideology.
        axes: Object.fromEntries(
          Object.entries(STREAMS.find((one) => one.id === streamId).startingAxes).map(([axisKey, value]) => [
            axisKey,
            Math.max(-1, Math.min(1, value + decisions.range(-0.3, 0.3))),
          ]),
        ),
      })
    : createRun(seed, streamId);

  // SETUP, in the order the player does it: stream, patron, cards. Nothing
  // below this point may change either the stream or who backs them.
  const bindingPatrons = eligiblePatrons(state).filter((patron) => patron.kind !== 'none');
  if (bindingPatrons.length > 0 && decisions.chance(patronChance)) {
    state = choosePatron(state, decisions.pick(bindingPatrons).id);
  }

  let cardsDrawn = 0;
  let emptyTurns = 0;
  let gamblesTaken = 0;
  let offersReceived = 0;
  let offersAccepted = 0;

  while (!isRunOver(state)) {
    // Answer whatever is on the table. Nothing carries to the next turn.
    if (state.offers.length > 0) {
      offersReceived += state.offers.length;
      const projected = poll(state);
      const worthTaking = state.offers.filter(
        (offer) => offer.slot <= (projected[offer.partyId] ?? 0),
      );
      // Best offer on the table is the one with the most room to spare between
      // the slot and the party's projected seats.
      const best = worthTaking.reduce(
        (chosen, offer) =>
          chosen === null ||
          projected[offer.partyId] - offer.slot > projected[chosen.partyId] - chosen.slot
            ? offer
            : chosen,
        null,
      );
      if (best && decisions.chance(acceptChance)) {
        state = acceptOffer(state, best.partyId);
        offersAccepted += 1;
      } else {
        state = declineOffers(state);
      }
    }

    const card = drawCard(state);
    if (card) {
      cardsDrawn += 1;
      const optionIndex = decisions.integer(0, card.options.length - 1);
      const played = applyOption(state, card.id, optionIndex);
      if (played.resolution.gamble) gamblesTaken += 1;
      state = played.state;
    } else {
      emptyTurns += 1;
    }

    state = endTurn(state);
  }

  const outcome = runElection(state);

  return {
    seed,
    streamId,
    title: outcome.title,
    playerSeats: outcome.playerSeats,
    playerElected: outcome.playerElected,
    seats: outcome.seats,
    founded,
    joinedPartyId: state.party,
    patron: state.patron,
    slot: state.slot,
    cardsDrawn,
    emptyTurns,
    gamblesTaken,
    betrayalOutcome: state.betrayalOutcome,
    patronKind: state.patron,
    endedEarly: state.endedEarly,
    offersReceived,
    offersAccepted,
    state: outcome.state,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function parseArguments(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) continue;
    const name = argv[index].slice(2);
    const value = argv[index + 1];
    parsed[name] = value === undefined || value.startsWith('--') ? true : value;
  }
  return parsed;
}

function formatPercentage(count, total) {
  return `${((count / total) * 100).toFixed(1)}%`;
}

function bar(fraction, width = 24) {
  const filled = Math.round(fraction * width);
  return '█'.repeat(filled) + '·'.repeat(width - filled);
}

/**
 * A poll is a projection, not the result. If turn-1 polling matched election
 * night the ticker would be telling the player the campaign is already decided,
 * so this asserts the two genuinely differ across a sample of runs.
 */
export function checkPollIsNotTheResult(runs = 200, firstSeed = 1) {
  let matchedExactly = 0;
  let totalSeatGap = 0;

  for (let index = 0; index < runs; index += 1) {
    const state = createRun(firstSeed + index, STREAM_IDS[index % STREAM_IDS.length]);
    const projected = poll(state);
    const { seats } = runElection(state);
    const gap = Object.keys(seats).reduce(
      (sum, partyId) => sum + Math.abs((projected[partyId] ?? 0) - seats[partyId]),
      0,
    );
    totalSeatGap += gap;
    if (gap === 0) matchedExactly += 1;
  }

  return { runs, matchedExactly, meanSeatGap: totalSeatGap / runs };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const runs = Number(options.runs ?? 1000);
  const firstSeed = Number(options.seed ?? 1);
  const requestedStream = typeof options.stream === 'string' ? options.stream : null;

  if (requestedStream && !STREAM_IDS.includes(requestedStream)) {
    console.error(`Unknown stream "${requestedStream}". Known: ${STREAM_IDS.join(', ')}`);
    process.exit(1);
  }

  const policy = {};
  if (options.found !== undefined) policy.foundChance = Number(options.found);

  const titleCounts = new Map();
  const seatTotals = new Map();
  let foundedCount = 0;
  let joinedCount = 0;
  let electedCount = 0;
  let cardsDrawnTotal = 0;
  let emptyTurnsTotal = 0;
  let offersReceivedTotal = 0;
  let noOfferRuns = 0;
  let gamblesTotal = 0;
  const earlyEndingsByCause = new Map();
  const betrayalOutcomes = new Map();
  let betrayedRuns = 0;
  let ownPartySeatTotal = 0;
  const patronCounts = new Map();
  const streamCounts = new Map();
  const patronsByStream = new Map();

  for (let index = 0; index < runs; index += 1) {
    const streamId = requestedStream ?? STREAM_IDS[index % STREAM_IDS.length];
    const result = playRun(firstSeed + index, streamId, policy);

    titleCounts.set(result.title.label, (titleCounts.get(result.title.label) ?? 0) + 1);
    patronCounts.set(result.patron, (patronCounts.get(result.patron) ?? 0) + 1);
    streamCounts.set(result.streamId, (streamCounts.get(result.streamId) ?? 0) + 1);
    if (!patronsByStream.has(result.streamId)) patronsByStream.set(result.streamId, new Set());
    patronsByStream.get(result.streamId).add(result.patron);

    for (const [partyId, seats] of Object.entries(result.seats)) {
      if (partyId === OWN_PARTY_ID) {
        ownPartySeatTotal += seats;
        continue;
      }
      seatTotals.set(partyId, (seatTotals.get(partyId) ?? 0) + seats);
    }

    if (result.founded) foundedCount += 1;
    if (result.joinedPartyId) joinedCount += 1;
    if (result.playerElected) electedCount += 1;
    cardsDrawnTotal += result.cardsDrawn;
    emptyTurnsTotal += result.emptyTurns;
    offersReceivedTotal += result.offersReceived;
    gamblesTotal += result.gamblesTaken;
    if (result.betrayalOutcome) {
      betrayedRuns += 1;
      betrayalOutcomes.set(
        result.betrayalOutcome,
        (betrayalOutcomes.get(result.betrayalOutcome) ?? 0) + 1,
      );
    }
    if (result.endedEarly) {
      const cause = result.endedEarly.cause;
      earlyEndingsByCause.set(cause, (earlyEndingsByCause.get(cause) ?? 0) + 1);
    }
    if (result.offersReceived === 0 && !result.founded) noOfferRuns += 1;
  }

  console.log('');
  console.log(`${runs} runs · seeds ${firstSeed}…${firstSeed + runs - 1} · ` +
    `stream ${requestedStream ?? 'all (rotating)'}`);

  console.log('');
  console.log('OUTCOME TITLES');
  const sortedTitles = [...titleCounts.entries()].sort((left, right) => right[1] - left[1]);
  const longestTitle = Math.max(...sortedTitles.map(([label]) => label.length));
  for (const [label, count] of sortedTitles) {
    console.log(
      `  ${label.padEnd(longestTitle)}  ${bar(count / runs)}  ` +
        `${String(count).padStart(5)}  ${formatPercentage(count, runs).padStart(6)}`,
    );
  }

  console.log('');
  console.log('MEAN SEATS PER PARTY');
  const sortedParties = [...seatTotals.entries()].sort((left, right) => right[1] - left[1]);
  for (const [partyId, total] of sortedParties) {
    const name = PARTIES[partyId]?.name ?? partyId;
    console.log(
      `  ${partyId.padEnd(20)} ${(total / runs).toFixed(1).padStart(5)}   ${name}`,
    );
  }
  if (foundedCount > 0) {
    console.log(
      `  ${OWN_PARTY_ID.padEnd(20)} ${(ownPartySeatTotal / foundedCount).toFixed(1).padStart(5)}` +
        `   (mean across the ${foundedCount} runs that founded)`,
    );
  }

  // Stream is declared before the first card, and patron eligibility filters on
  // it — so no stream may ever end up holding a patron that refuses to deal
  // with it. This is the assertion for that.
  console.log('');
  console.log('PATRONS REACHED, BY DECLARED STREAM');
  for (const [streamId, patrons] of [...patronsByStream].sort()) {
    const illegal = [...patrons].filter((patronId) => {
      const patron = PATRONS[patronId];
      return patron?.streams && !patron.streams.includes(streamId);
    });
    console.log(
      `  ${streamId.padEnd(17)} ${formatPercentage(streamCounts.get(streamId), runs).padStart(6)}` +
        `  ${[...patrons].map((id) => id.replace(/_.*/, '')).join(', ')}` +
        (illegal.length ? `   <- ILLEGAL: ${illegal.join(', ')}` : ''),
    );
  }

  console.log('');
  console.log('PATRON AT ELECTION');
  for (const [patronId, count] of [...patronCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${patronId.padEnd(20)} ${formatPercentage(count, runs).padStart(6)}`);
  }

  const pollCheck = checkPollIsNotTheResult(Math.min(runs, 200), firstSeed);
  console.log('');
  console.log('POLL SANITY');
  console.log(
    `  turn-1 poll = election ${formatPercentage(pollCheck.matchedExactly, pollCheck.runs).padStart(6)}` +
      '   <- must be near zero; a poll is not the result',
  );
  console.log(`  mean seat gap          ${pollCheck.meanSeatGap.toFixed(1).padStart(6)}`);

  console.log('');
  console.log('DIAGNOSTICS');
  console.log(`  elected                ${formatPercentage(electedCount, runs).padStart(6)}`);
  console.log(`  founded own list       ${formatPercentage(foundedCount, runs).padStart(6)}`);
  console.log(`  joined a party         ${formatPercentage(joinedCount, runs).padStart(6)}`);
  // Two different numbers, and the gap between them is the point. The authored
  // rate is how much of the DECK ends a run; the observed rate is how often a
  // RUN actually ends early, which compounds over every gamble the player takes
  // and always lands far higher.
  const allBranches = allCards().flatMap((card) =>
    card.options.flatMap((option) => option.branches ?? []),
  );
  const deadEndBranches = allBranches.filter((branch) => branch.endsRun).length;
  const earlyTotal = [...earlyEndingsByCause.values()].reduce((sum, count) => sum + count, 0);

  console.log(
    `  dead-end branches      ${((deadEndBranches / allBranches.length) * 100).toFixed(1).padStart(5)}%` +
      `   ${deadEndBranches}/${allBranches.length} of the deck (target ${(DEAD_END_TARGET_RATE * 100).toFixed(0)}%)`,
  );
  console.log(
    `  ended early            ${formatPercentage(earlyTotal, runs).padStart(6)}` +
      '   <- observed: compounds over every gamble taken',
  );
  for (const [cause, count] of [...earlyEndingsByCause].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cause.padEnd(19)}${formatPercentage(count, runs).padStart(6)}`);
  }
  console.log(
    `  patron turned on you   ${formatPercentage(betrayedRuns, runs).padStart(6)}`,
  );
  for (const [outcome, count] of [...betrayalOutcomes].sort((a, b) => b[1] - a[1])) {
    console.log(
      `    ${outcome.padEnd(19)}${formatPercentage(count, runs).padStart(6)}` +
        `   (${((count / Math.max(1, betrayedRuns)) * 100).toFixed(0)}% of betrayals)`,
    );
  }
  console.log(`  mean gambles taken     ${(gamblesTotal / runs).toFixed(1).padStart(6)}`);
  console.log(`  mean offers received   ${(offersReceivedTotal / runs).toFixed(1).padStart(6)}`);
  console.log(
    `  never offered a slot   ${formatPercentage(noOfferRuns, runs).padStart(6)}` +
      '   <- ran the whole way and nobody wanted them',
  );
  console.log(`  mean cards drawn       ${(cardsDrawnTotal / runs).toFixed(1).padStart(6)}`);
  console.log(
    `  mean turns with no card${(emptyTurnsTotal / runs).toFixed(1).padStart(6)}` +
      '   <- deck coverage. Every one of these is a wasted turn.',
  );
  console.log('');
}

// Only run the CLI when invoked directly — tools/balance.js imports playRun
// from here and must not trigger a simulation of its own.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
