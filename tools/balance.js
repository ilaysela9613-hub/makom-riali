#!/usr/bin/env node
//
// Neutrality harness.
//
//   node tools/balance.js
//   node tools/balance.js --runs 2000
//   node tools/balance.js --found 1.0        (measure the founding path only)
//
// Runs N simulations per STREAM and reports how often each one reaches the top
// tier. CLAUDE.md §6.1: a spread wider than 20 points between the best and worst
// is a BALANCE BUG, not a curiosity. It exits non-zero on one.
//
// M8 moved this onto streams — the stream is now the whole of character
// creation, so it is the thing that has to be balanced.
//
// This is a test, not a disclaimer. Five streams spanning the political map have
// to be able to win comparably often, or the game is making a political argument
// the author did not write.

import { playRun, parseArguments } from './simulate.js';
import { STREAMS, STREAM_IDS } from '../src/data/streams.js';
import {
  TOP_TIER_TITLE_IDS,
  BALANCE_MAX_TOP_TIER_SPREAD,
  BALANCE_MIN_TOP_TIER_RATE,
  BALANCE_MAX_TOP_TIER_RATE,
} from '../src/data/tuning.js';



function bar(fraction, width = 28) {
  const filled = Math.round(fraction * width);
  return '█'.repeat(filled) + '·'.repeat(width - filled);
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const runsPerStream = Number(options.runs ?? 1000);
  const firstSeed = Number(options.seed ?? 1);

  const policy = {};
  if (options.found !== undefined) policy.foundChance = Number(options.found);

  const results = [];

  for (const [streamIndex, streamId] of STREAM_IDS.entries()) {
    let topTierCount = 0;
    let electedCount = 0;
    let belowThresholdCount = 0;
    let playerSeatTotal = 0;

    for (let index = 0; index < runsPerStream; index += 1) {
      // Offsetting the seed per stream stops every stream from being handed the
      // same sequence of policy coin-flips.
      const seed = firstSeed + streamIndex * runsPerStream + index;
      const result = playRun(seed, streamId, policy);

      if (TOP_TIER_TITLE_IDS.includes(result.title.id)) topTierCount += 1;
      if (result.playerElected) electedCount += 1;
      if (result.title.id === 'below_threshold') belowThresholdCount += 1;
      playerSeatTotal += result.playerSeats;
    }

    results.push({
      streamId,
      displayName: STREAMS.find((stream) => stream.id === streamId).label,
      topTierRate: topTierCount / runsPerStream,
      electedRate: electedCount / runsPerStream,
      belowThresholdRate: belowThresholdCount / runsPerStream,
      meanPlayerSeats: playerSeatTotal / runsPerStream,
    });
  }

  const topTierRates = results.map((result) => result.topTierRate);
  const best = Math.max(...topTierRates);
  const worst = Math.min(...topTierRates);
  const spread = best - worst;

  const bestStream = results.find((result) => result.topTierRate === best);
  const worstStream = results.find((result) => result.topTierRate === worst);

  console.log('');
  console.log(
    `${runsPerStream} runs per stream · ${STREAM_IDS.length} streams · ` +
      `${runsPerStream * STREAM_IDS.length} runs total`,
  );
  console.log(`top tier = ${TOP_TIER_TITLE_IDS.join(' | ')}`);
  console.log('');

  console.log('TOP-TIER REACH RATE BY STREAM');
  const longestId = Math.max(...STREAM_IDS.map((id) => id.length));
  for (const result of [...results].sort((left, right) => right.topTierRate - left.topTierRate)) {
    console.log(
      `  ${result.streamId.padEnd(longestId)}  ${bar(result.topTierRate)}  ` +
        `${(result.topTierRate * 100).toFixed(1).padStart(5)}%   ${result.displayName}`,
    );
  }

  console.log('');
  console.log('SUPPORTING RATES');
  console.log(
    `  ${'stream'.padEnd(longestId)}   elected  below threshold  mean seats`,
  );
  for (const result of results) {
    console.log(
      `  ${result.streamId.padEnd(longestId)}   ` +
        `${(result.electedRate * 100).toFixed(1).padStart(6)}%  ` +
        `${(result.belowThresholdRate * 100).toFixed(1).padStart(14)}%  ` +
        `${result.meanPlayerSeats.toFixed(1).padStart(10)}`,
    );
  }

  console.log('');
  console.log(
    `spread  ${(spread * 100).toFixed(1)} points   ` +
      `(best ${bestStream.streamId} ${(best * 100).toFixed(1)}% · ` +
      `worst ${worstStream.streamId} ${(worst * 100).toFixed(1)}%)`,
  );
  console.log(`limit   ${(BALANCE_MAX_TOP_TIER_SPREAD * 100).toFixed(1)} points`);
  // These two are guards against a VACUOUS pass, not a health band. The spread
  // test cannot tell a balanced cohort from a uniformly broken one, so the floor
  // asks whether anyone can win at all and the ceiling asks whether anyone can
  // lose at all. A stream sitting outside them on its own is reported below
  // as advice, not as a failure.
  console.log(
    `guards  fail if BEST < ${(BALANCE_MIN_TOP_TIER_RATE * 100).toFixed(0)}% (nobody can win) ` +
      `or WORST > ${(BALANCE_MAX_TOP_TIER_RATE * 100).toFixed(0)}% (nobody can lose)`,
  );

  const outsideBand = results.filter(
    (result) =>
      result.topTierRate > BALANCE_MAX_TOP_TIER_RATE ||
      result.topTierRate < BALANCE_MIN_TOP_TIER_RATE,
  );
  if (outsideBand.length > 0 && outsideBand.length < results.length) {
    console.log('');
    console.log(
      `NOTE    ${outsideBand.length} of ${results.length} streams sit outside ` +
        `${(BALANCE_MIN_TOP_TIER_RATE * 100).toFixed(0)}–${(BALANCE_MAX_TOP_TIER_RATE * 100).toFixed(0)}%: ` +
        outsideBand.map((result) => `${result.streamId} ${(result.topTierRate * 100).toFixed(1)}%`).join(', '),
    );
    console.log('        Not a failure — the guards above only fire on the whole cohort.');
    console.log('        It does mean the game is running generous for those starts.');
  }
  console.log('');

  const failures = [];

  if (spread > BALANCE_MAX_TOP_TIER_SPREAD) {
    failures.push([
      `spread is ${(spread * 100).toFixed(1)} points, above the ${(BALANCE_MAX_TOP_TIER_SPREAD * 100).toFixed(1)}-point limit`,
      `"${bestStream.displayName}" reaches the top tier ${(spread * 100).toFixed(1)} points more`,
      `often than "${worstStream.displayName}". Five streams spanning the map have to win`,
      'comparably often, or the game makes a political argument nobody wrote. Look at the',
      'startingCapital and startingBlocs in data/streams.js, and at which patrons each reaches.',
    ]);
  }

  // The spread test alone cannot tell a balanced cohort from a uniformly broken
  // one — all five at 0% has a spread of zero. These two catch that.
  if (best < BALANCE_MIN_TOP_TIER_RATE) {
    failures.push([
      `no stream clears the floor: the best is ${bestStream.streamId} at ${(best * 100).toFixed(1)}%, ` +
        `below ${(BALANCE_MIN_TOP_TIER_RATE * 100).toFixed(0)}%`,
      'This is not balance, it is a broken path — every stream is losing. The spread',
      'test would have passed this silently. Check that the deck has enough eligible',
      'cards, and that the outcome the top tier is measured on is reachable at all.',
    ]);
  }

  if (worst > BALANCE_MAX_TOP_TIER_RATE) {
    failures.push([
      `every stream clears the ceiling: the worst is ${worstStream.streamId} at ` +
        `${(worst * 100).toFixed(1)}%, above ${(BALANCE_MAX_TOP_TIER_RATE * 100).toFixed(0)}%`,
      'Everybody wins, so nothing the player does matters. Check the slot thresholds in',
      'data/titles.js and whether card options carry enough downside.',
    ]);
  }

  if (failures.length > 0) {
    for (const [headline, ...detail] of failures) {
      console.log(`FAIL — ${headline}.`);
      console.log('');
      for (const line of detail) console.log(`  ${line}`);
      console.log('');
    }
    process.exit(1);
  }

  console.log('PASS — spread within limit, and neither guard fired.');
  console.log('');
}

main();
