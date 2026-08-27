// Patrons — the persistent modifier layer.
//
// Nobody arrives in the Knesset unsponsored. Someone put you there, and the
// price is never money: it is credibility, ideological independence, and a
// favour asked at the worst possible moment (SPEC §5).
//
// The gates ARE the progression ladder (CLAUDE.md §4.2). Every threshold lives
// in tuning.js; every multiplier is composed here so the boost and the price
// stay visible side by side (CLAUDE.md §0.7).
//
// `eligible`, `offerAffinity`, `slotAffinity` and `axesPull` all receive the
// whole run state. All patron names are fictional.

import PARTIES from './parties.js';
import {
  DONOR_MIN_RESOURCES,
  CHAIRMAN_MIN_POPULARITY,
  MEDIA_MIN_POPULARITY,
  SECTOR_LEADER_MIN_PARTY_TURNS,
  SECTOR_LEADER_MIN_SEGMENT_AFFINITY,
  LOCAL_BOSS_OFFER_BOOST,
  LOCAL_BOSS_SLOT_BOOST,
  LOCAL_BOSS_BEST_ATTAINABLE_SLOT,
  LOCAL_BOSS_UPKEEP_RESOURCES,
  LOCAL_BOSS_RULE_OF_LAW_PULL,
  DONOR_PRIMARIES_OFFER_BOOST,
  DONOR_PRIMARIES_SLOT_BOOST,
  DONOR_SLOT_PRICE,
  DONOR_UPKEEP_CREDIBILITY,
  DONOR_ECONOMY_PULL,
  CHAIRMAN_APPOINTED_OFFER_BOOST,
  CHAIRMAN_APPOINTED_SLOT_BOOST,
  CHAIRMAN_OFF_TIER_PENALTY,
  CHAIRMAN_UPKEEP_CREDIBILITY,
  CHAIRMAN_AXES_PULL_RATE,
  MEDIA_OFFER_BOOST,
  MEDIA_SLOT_BOOST,
  MEDIA_CAPITAL_AMPLIFICATION,
  MEDIA_UPKEEP_CREDIBILITY,
  SECTOR_LEADER_OWN_PARTY_OFFER_BOOST,
  SECTOR_LEADER_OWN_PARTY_SLOT_BOOST,
  SECTOR_LEADER_OTHER_PARTY_PENALTY,
  SECTOR_LEADER_UPKEEP_RESOURCES,
  SECTOR_LEADER_RELIGION_PULL,
} from './tuning.js';

/**
 * The three parties this particular עסקן can actually deliver. Hardcoded on
 * purpose (CLAUDE.md §4.2): three parties needing the behaviour does not
 * justify a relationship abstraction. Ids that leave the roster simply stop
 * matching.
 */
const LOCAL_BOSS_PARTY_IDS = new Set(['halikud', 'shas', 'amcha_yisrael']);

/** Parties selecting by primaries — read off the roster, never hardcoded. */
const isPrimariesParty = (party) => party.selection === 'primaries';

const isChairmanAppointedTopTier = (party) =>
  party.selection === 'chairman_appointed' && (party.tier === 'A' || party.tier === 'B');

const peakAffinity = (state) => Math.max(...Object.values(state.affinity));

const isFounder = (state) => Boolean(state.ownParty);

export default {
  // -------------------------------------------------------------------------
  // none — a real strategic option, not an absence. Independence is playable:
  // nothing boosts you, nothing pulls your axes, and your credibility erodes
  // at half the usual rate because nobody is spending it for you.
  // -------------------------------------------------------------------------
  none: {
    id: 'none',
    displayName: 'בלי פטרון',
    shortName: 'עצמאי',
    pitch: 'אף אחד לא הכניס אותך לכאן, ולכן אף אחד לא יכול להוציא אותך. גם אף אחד לא ירים לך טלפון.',
    pillLabel: 'בלי הטבות · האמינות נשחקת לאט יותר · הכול תלוי בך',

    eligible: () => true,
    offerAffinity: () => 1,
    slotAffinity: () => 1,

    upkeep: null,
    axesPull: null,
    obligation: null,
  },

  // -------------------------------------------------------------------------
  // local_boss — always available, delivers three specific parties, and caps
  // you at slot 8 forever. The early-game default, and a trap if you stay.
  // -------------------------------------------------------------------------
  local_boss: {
    id: 'local_boss',
    displayName: 'עסקן מקומי — יוסי דרעי־לוין',
    shortName: 'העסקן',
    pitch: 'הוא מכיר כל מתפקד בעיר בשמו הפרטי. הוא גם יודע בדיוק עד איפה הוא מוכן לקדם אותך, וזה לא רחוק.',
    pillLabel: 'סיכוי גבוה בשלוש מפלגות מסוימות · תקרה קשיחה במקום 8',

    eligible: () => true,
    offerAffinity: (party) => (LOCAL_BOSS_PARTY_IDS.has(party.id) ? LOCAL_BOSS_OFFER_BOOST : 1),
    slotAffinity: (party) => (LOCAL_BOSS_PARTY_IDS.has(party.id) ? LOCAL_BOSS_SLOT_BOOST : 1),

    /** No matter how good your capital gets, he cannot get you above this. */
    bestAttainableSlot: LOCAL_BOSS_BEST_ATTAINABLE_SLOT,

    upkeep: { resources: -LOCAL_BOSS_UPKEEP_RESOURCES },
    axesPull: { rule_of_law: +LOCAL_BOSS_RULE_OF_LAW_PULL },
    obligation: null,
  },

  // -------------------------------------------------------------------------
  // donor — buys you the primaries parties. The bill comes due as a card.
  // -------------------------------------------------------------------------
  donor: {
    id: 'donor',
    displayName: 'תורם — אבישי קלנר',
    shortName: 'התורם',
    pitch: 'הוא לא מבקש ג׳וב ולא מבקש תפקיד. הוא רק רוצה שתזכור מי מימן לך את הסיבוב הראשון במרכז.',
    pillLabel: 'סיכוי גבוה יותר במפלגות עם פריימריז · חוב שייגבה בהמשך',

    eligible: (state) => state.capital.resources >= DONOR_MIN_RESOURCES,
    offerAffinity: (party) => (isPrimariesParty(party) ? DONOR_PRIMARIES_OFFER_BOOST : 1),
    // Boost times price: he moves you up, and the debt is already priced in.
    slotAffinity: (party) =>
      isPrimariesParty(party) ? DONOR_PRIMARIES_SLOT_BOOST * DONOR_SLOT_PRICE : 1,

    upkeep: { credibility: -DONOR_UPKEEP_CREDIBILITY },
    axesPull: { economy: +DONOR_ECONOMY_PULL },
    obligation: { cardId: 'donor_calls_in_favour', turnRange: [6, 14] },
  },

  // -------------------------------------------------------------------------
  // chairman — the fast lane into Tier A/B, at the cost of your own positions.
  // -------------------------------------------------------------------------
  chairman: {
    id: 'chairman',
    displayName: 'יו״ר המפלגה',
    shortName: 'היו״ר',
    pitch: 'הוא ראה אותך באולפן והחליט שאתה שלו. מהיום הדעות שלך הן הדעות שלו, וזה קורה לאט מספיק כדי שלא תשים לב.',
    pillLabel: 'קפיצה במפלגות שבהן היו״ר קובע · הדעות שלך נסחפות לקו המפלגה',

    eligible: (state) => !isFounder(state) && state.capital.popularity >= CHAIRMAN_MIN_POPULARITY,
    offerAffinity: (party) =>
      isChairmanAppointedTopTier(party) ? CHAIRMAN_APPOINTED_OFFER_BOOST : CHAIRMAN_OFF_TIER_PENALTY,
    slotAffinity: (party) =>
      isChairmanAppointedTopTier(party) ? CHAIRMAN_APPOINTED_SLOT_BOOST : CHAIRMAN_OFF_TIER_PENALTY,

    upkeep: { credibility: -CHAIRMAN_UPKEEP_CREDIBILITY },
    // Closes a fixed fraction of the gap to the party line every single turn.
    // Nothing else in the game moves a player's axes this hard.
    axesPull: (state) => {
      const party = PARTIES[state.party];
      if (!party) return null;
      const pull = {};
      for (const [axisKey, partyValue] of Object.entries(party.axes)) {
        pull[axisKey] = (partyValue - state.axes[axisKey]) * CHAIRMAN_AXES_PULL_RATE;
      }
      return pull;
    },
    obligation: null,
  },

  // -------------------------------------------------------------------------
  // media — broad, and amplifies everything that happens to you in both
  // directions. This one is volatility, not cost.
  // -------------------------------------------------------------------------
  media: {
    id: 'media',
    displayName: 'גורם תקשורתי — שיר אבידן',
    shortName: 'התקשורת',
    pitch: 'היא לא תבקש ממך כלום. היא פשוט תדאג שכל מה שתעשה יגיע למהדורה — כולל מה שלא רצית שיגיע.',
    pillLabel: 'שיפור רחב בכל המפלגות · כל רווח וכל מפולת מוגברים',

    eligible: (state) => state.capital.popularity >= MEDIA_MIN_POPULARITY,
    offerAffinity: () => MEDIA_OFFER_BOOST,
    slotAffinity: () => MEDIA_SLOT_BOOST,

    /** Applied to every capital delta a card option lands, gain or loss. */
    capitalAmplification: {
      popularity: MEDIA_CAPITAL_AMPLIFICATION,
      credibility: MEDIA_CAPITAL_AMPLIFICATION,
    },

    upkeep: { credibility: -MEDIA_UPKEEP_CREDIBILITY },
    axesPull: null,
    obligation: null,
  },

  // -------------------------------------------------------------------------
  // sector_leader — the loyalty path. Earned by staying put, and it locks you
  // where you stand.
  //
  // Deliberately closed to anyone arriving from `chairman` or `media`: without
  // that exclusion, dropping down from a high tier into the loyalty bonus is a
  // free exploit (CLAUDE.md §4.2).
  // -------------------------------------------------------------------------
  sector_leader: {
    id: 'sector_leader',
    displayName: 'מנהיג מגזרי — הרב מנשה טולדנו',
    shortName: 'המנהיג',
    pitch: 'הוא לא מתרשם מסקרים ולא מאולפנים. הוא ראה אותך מגיע לכל אירוע במשך שנתיים, וזה מה שסופרים אצלו.',
    pillLabel: 'עוצמה גדולה במפלגה שאתה כבר בה · נועל אותך שם ובמגזר אחד',

    eligible: (state) =>
      state.patron !== 'chairman' &&
      state.patron !== 'media' &&
      state.partyTurns >= SECTOR_LEADER_MIN_PARTY_TURNS &&
      peakAffinity(state) >= SECTOR_LEADER_MIN_SEGMENT_AFFINITY,

    offerAffinity: (party, state) =>
      party.id === state.party ? SECTOR_LEADER_OWN_PARTY_OFFER_BOOST : SECTOR_LEADER_OTHER_PARTY_PENALTY,
    slotAffinity: (party, state) =>
      party.id === state.party ? SECTOR_LEADER_OWN_PARTY_SLOT_BOOST : SECTOR_LEADER_OTHER_PARTY_PENALTY,

    upkeep: { resources: -SECTOR_LEADER_UPKEEP_RESOURCES },
    axesPull: { religion: +SECTOR_LEADER_RELIGION_PULL },
    obligation: null,
  },
};
