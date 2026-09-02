#!/usr/bin/env node
//
// Headless simulator.
//
//   node tools/simulate.js --runs 1000
//   node tools/simulate.js --runs 500 --archetype tech_founder
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
} from '../src/engine/index.js';
import ARCHETYPES from '../src/data/archetypes.js';
import PARTIES from '../src/data/parties.js';
import { OWN_PARTY_ID } from '../src/data/tuning.js';

const ARCHETYPE_IDS = Object.keys(ARCHETYPES);

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
  /** Per-turn chance of taking a patron, when any is eligible. */
  patronChance: 0.25,
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
 * @param {string} archetypeId
 * @param {object} [policy]
 * @returns {{ seed, archetypeId, title, playerSeats, playerElected, seats,
 *             founded, joinedPartyId, patron, cardsDrawn, emptyTurns, state }}
 */
export function playRun(seed, archetypeId, policy = {}) {
  const { foundChance, patronChance, acceptChance } = { ...DEFAULT_POLICY, ...policy };

  // A separate stream, so policy coin-flips never disturb the run's own cursor
  // and a given seed always produces the same run for a given policy.
  const decisions = createRng((seed ^ 0x5bf03635) >>> 0);

  const founded = decisions.chance(foundChance);
  let state = founded
    ? createFoundedRun(seed, archetypeId, {
        name: SIMULATED_PARTY_NAME,
        // A founder positions their list somewhere near, but not exactly on,
        // their own ideology.
        axes: Object.fromEntries(
          Object.entries(ARCHETYPES[archetypeId].axes).map(([axisKey, value]) => [
            axisKey,
            Math.max(-1, Math.min(1, value + decisions.range(-0.3, 0.3))),
          ]),
        ),
      })
    : createRun(seed, archetypeId);

  let cardsDrawn = 0;
  let emptyTurns = 0;
  let gamblesTaken = 0;
  let offersReceived = 0;
  let offersAccepted = 0;

  while (!isRunOver(state)) {
    const available = eligiblePatrons(state);
    if (available.length > 0 && decisions.chance(patronChance)) {
      state = choosePatron(state, decisions.pick(available).id);
    }

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
    archetypeId,
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

function main() {
  const options = parseArguments(process.argv.slice(2));
  const runs = Number(options.runs ?? 1000);
  const firstSeed = Number(options.seed ?? 1);
  const requestedArchetype = typeof options.archetype === 'string' ? options.archetype : null;

  if (requestedArchetype && !ARCHETYPES[requestedArchetype]) {
    console.error(
      `Unknown archetype "${requestedArchetype}". Known: ${ARCHETYPE_IDS.join(', ')}`,
    );
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

  for (let index = 0; index < runs; index += 1) {
    const archetypeId = requestedArchetype ?? ARCHETYPE_IDS[index % ARCHETYPE_IDS.length];
    const result = playRun(firstSeed + index, archetypeId, policy);

    titleCounts.set(result.title.label, (titleCounts.get(result.title.label) ?? 0) + 1);
    patronCounts.set(result.patron, (patronCounts.get(result.patron) ?? 0) + 1);

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
    `archetype ${requestedArchetype ?? 'all (rotating)'}`);

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

  console.log('');
  console.log('PATRON AT ELECTION');
  for (const [patronId, count] of [...patronCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${patronId.padEnd(20)} ${formatPercentage(count, runs).padStart(6)}`);
  }

  console.log('');
  console.log('DIAGNOSTICS');
  console.log(`  elected                ${formatPercentage(electedCount, runs).padStart(6)}`);
  console.log(`  founded own list       ${formatPercentage(foundedCount, runs).padStart(6)}`);
  console.log(`  joined a party         ${formatPercentage(joinedCount, runs).padStart(6)}`);
  const earlyTotal = [...earlyEndingsByCause.values()].reduce((sum, count) => sum + count, 0);
  console.log(
    `  ended early            ${formatPercentage(earlyTotal, runs).padStart(6)}` +
      '   <- a branch stopped the run before election day',
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
