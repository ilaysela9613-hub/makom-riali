// End-of-run titles.
//
// Not in the CLAUDE.md §1 file layout — added because these are player-facing
// Hebrew strings and §8.2 forbids them in engine/, while tuning.js is meant to
// hold balance constants. The slot bands they key off DO live in tuning.js.
//
// NEUTRALITY (CLAUDE.md §6.5): nothing here may resemble a voting
// recommendation. A title describes where the player's own run landed and
// says nothing about any party being good or bad to have voted for.
//
// Order matters — the first rule whose `matches` returns true wins. Rules run
// from the biggest outcome down, and the last rule must be unconditional.

import {
  PRIME_MINISTER_MAX_SLOT,
  PRIME_MINISTER_MIN_SEATS,
  SENIOR_MINISTER_MAX_SLOT,
  SENIOR_MINISTER_MIN_SEATS,
  MINISTER_WITHOUT_PORTFOLIO_MAX_SLOT,
  MINISTER_WITHOUT_PORTFOLIO_MIN_SEATS,
  COMMITTEE_CHAIR_MAX_SLOT,
} from './tuning.js';

/**
 * @typedef {object} OutcomeContext
 * @property {object}  state             the settled run state
 * @property {object}  seats             partyId → seats
 * @property {number}  playerSeats       seats won by the player's list
 * @property {number|null} playerSlot    the number the player was given
 * @property {boolean} playerElected     playerSeats >= playerSlot
 * @property {boolean} crossedThreshold  the player's list cleared 3.25%
 * @property {boolean} hasOwnParty
 * @property {boolean} isLargestParty
 */

export const END_TITLES = [
  {
    id: 'prime_minister',
    label: 'ראש הממשלה',
    matches: (outcome) =>
      outcome.playerElected &&
      outcome.isLargestParty &&
      outcome.playerSlot <= PRIME_MINISTER_MAX_SLOT &&
      outcome.playerSeats >= PRIME_MINISTER_MIN_SEATS,
  },
  {
    id: 'one_person_party',
    label: 'מפלגה של איש אחד',
    matches: (outcome) =>
      outcome.hasOwnParty && outcome.playerElected && outcome.playerSeats === 1,
  },
  // A slot number on its own is not an achievement. Slot 4 on a seven-seat list
  // is an easier thing to get than slot 12 on the largest party in the Knesset,
  // and a title that cannot tell them apart hands out ministries to
  // backbenchers. Every ministerial title is gated on the size of the list too.
  {
    id: 'senior_minister',
    label: 'שר/ה בכיר/ה',
    matches: (outcome) =>
      outcome.playerElected &&
      outcome.playerSlot <= SENIOR_MINISTER_MAX_SLOT &&
      outcome.playerSeats >= SENIOR_MINISTER_MIN_SEATS,
  },
  {
    id: 'minister_without_portfolio',
    label: 'שר/ה ללא תיק',
    matches: (outcome) =>
      outcome.playerElected &&
      outcome.playerSlot <= MINISTER_WITHOUT_PORTFOLIO_MAX_SLOT &&
      outcome.playerSeats >= MINISTER_WITHOUT_PORTFOLIO_MIN_SEATS,
  },
  {
    id: 'committee_chair',
    label: 'יו״ר ועדה',
    matches: (outcome) => outcome.playerElected && outcome.playerSlot <= COMMITTEE_CHAIR_MAX_SLOT,
  },
  {
    id: 'backbench_member',
    label: 'ח״כ מן המניין',
    matches: (outcome) => outcome.playerElected,
  },
  {
    id: 'below_threshold',
    label: 'לא עברת את אחוז החסימה',
    matches: (outcome) => outcome.playerSlot !== null && !outcome.crossedThreshold,
  },
  {
    id: 'back_to_local_politics',
    label: 'חזרת לעסקנות מקומית',
    matches: () => true,
  },
];

/**
 * @param {OutcomeContext} outcome
 * @returns {{ id: string, label: string }}
 */
export function endTitleFor(outcome) {
  const rule = END_TITLES.find((candidate) => candidate.matches(outcome));
  return { id: rule.id, label: rule.label };
}
