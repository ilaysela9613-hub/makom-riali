// Every balance constant in the game. A number carrying balance meaning
// anywhere in src/engine/, src/ui/ or tools/ is a bug — it belongs here.
//
// Composed modifiers are left unevaluated on purpose (CLAUDE.md §0.7): when a
// value is a boost times a price, both factors stay visible so the next person
// to tune it can see what they are trading.

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

// Act 1 (כניסה) and Acts 5–6 are post-v0. v0 opens on Act 2 at turn 1.
export const ACT_SCHEDULE = [
  { act: 2, firstTurn: 1, lastTurn: 8 }, // הרשימה  — patron, party offers
  { act: 3, firstTurn: 9, lastTurn: 24 }, // הקמפיין — the events deck fires
];

/** The last turn that draws a card. Election night resolves after it. */
export const FINAL_TURN = 24;

// ---------------------------------------------------------------------------
// Player quantity bounds
// ---------------------------------------------------------------------------

export const CAPITAL_MINIMUM = 0;
export const CAPITAL_MAXIMUM = 100;

export const AXIS_MINIMUM = -1.0;
export const AXIS_MAXIMUM = 1.0;

export const AFFINITY_MINIMUM = -1.0;
export const AFFINITY_MAXIMUM = 1.0;

export const SEGMENT_SHARE_MINIMUM = 0;

// ---------------------------------------------------------------------------
// Segment movement
// ---------------------------------------------------------------------------

/**
 * One segment delta point, as a fraction of that segment's vote. Card options
 * are authored in points (|delta| ≤ 3.0), so the strongest single option can
 * swing a segment by about 3.6 percentage points.
 */
export const SEGMENT_DELTA_TO_SHARE = 0.012;

/**
 * How much a delta point also moves the player's affinity with that segment.
 * This is what makes turns before you have a list worth playing: you are
 * building standing you will cash in later.
 */
export const SEGMENT_DELTA_AFFINITY_FEEDBACK = 0.04;

// A positive delta lands at BASE + affinity × SLOPE, floored. Negative deltas
// are never scaled — see the note in engine/segments.js.
export const AFFINITY_GAIN_MULTIPLIER_BASE = 1.0;
export const AFFINITY_GAIN_MULTIPLIER_SLOPE = 0.6;
export const AFFINITY_GAIN_MULTIPLIER_FLOOR = 0.25;

// ---------------------------------------------------------------------------
// Card draw
// ---------------------------------------------------------------------------

/** CLAUDE.md §6.2 — never more than this many same-camp cards in a row. */
export const MAX_CONSECUTIVE_SAME_CAMP = 2;

/** Camps that cannot form a biased-looking streak, so the guard ignores them. */
export const CAMP_BALANCE_EXEMPT_CAMPS = ['neutral'];

/**
 * Weight applied to a card the run has already seen. Zero means a card fires
 * once per run, which is the right default for hand-authored content. Raise it
 * while the deck is thin to keep the simulator fed.
 */
export const SEEN_CARD_WEIGHT_MULTIPLIER = 0;

/** Follow-up cards should land soon after the card that unlocked them. */
export const UNLOCKED_CARD_WEIGHT_MULTIPLIER = 3.0;

// ---------------------------------------------------------------------------
// Patrons
// ---------------------------------------------------------------------------

export const STARTING_PATRON = 'none';

/** Changing who owns you is not free. */
export const PATRON_SWITCH_CREDIBILITY_COST = 12;

/** Background credibility erosion, every turn, for everyone. */
export const CREDIBILITY_DECAY_PER_TURN = 0.5;

/** Running unpatroned shelters you from part of that decay. */
export const UNPATRONED_CREDIBILITY_DECAY_RELIEF = 0.5;

// The gates. These ARE the progression ladder (CLAUDE.md §4.2).
export const DONOR_MIN_RESOURCES = 25;
export const CHAIRMAN_MIN_POPULARITY = 45;
export const MEDIA_MIN_POPULARITY = 60;
export const SECTOR_LEADER_MIN_PARTY_TURNS = 8;
export const SECTOR_LEADER_MIN_SEGMENT_AFFINITY = 0.7;

// Patron affinity factors. Named here, composed in data/patrons.js so the
// boost and the price stay side by side at the point of use.
export const LOCAL_BOSS_OFFER_BOOST = 1.6;
export const LOCAL_BOSS_SLOT_BOOST = 1.15;
export const LOCAL_BOSS_BEST_ATTAINABLE_SLOT = 8; // the ceiling he caps you at

export const DONOR_PRIMARIES_OFFER_BOOST = 1.5;
export const DONOR_PRIMARIES_SLOT_BOOST = 1.12;
export const DONOR_SLOT_PRICE = 0.94; // the debt, priced into the slot

export const CHAIRMAN_APPOINTED_OFFER_BOOST = 1.7;
export const CHAIRMAN_APPOINTED_SLOT_BOOST = 1.30;
export const CHAIRMAN_OFF_TIER_PENALTY = 0.85; // he has no pull outside Tier A/B

export const MEDIA_OFFER_BOOST = 1.25;
export const MEDIA_SLOT_BOOST = 1.18;
export const MEDIA_CAPITAL_AMPLIFICATION = 1.4; // in both directions

export const SECTOR_LEADER_OWN_PARTY_OFFER_BOOST = 2.2;
export const SECTOR_LEADER_OWN_PARTY_SLOT_BOOST = 1.35;
export const SECTOR_LEADER_OTHER_PARTY_PENALTY = 0.4; // he locks you where you are

// Per-turn upkeep, as positive magnitudes. Written negated at the point of use
// in data/patrons.js so the sign is visible next to the meter it drains.
export const LOCAL_BOSS_UPKEEP_RESOURCES = 1.0;
export const DONOR_UPKEEP_CREDIBILITY = 1.0;
export const CHAIRMAN_UPKEEP_CREDIBILITY = 1.5;
export const MEDIA_UPKEEP_CREDIBILITY = 1.0;
export const SECTOR_LEADER_UPKEEP_RESOURCES = 0.5;

// Per-turn ideological drift toward the patron's position.
export const DONOR_ECONOMY_PULL = 0.02;
export const LOCAL_BOSS_RULE_OF_LAW_PULL = 0.01;
/** Fraction of the gap to the party line closed every turn. This one bites. */
export const CHAIRMAN_AXES_PULL_RATE = 0.06;
export const SECTOR_LEADER_RELIGION_PULL = 0.015;

// ---------------------------------------------------------------------------
// Offer chance — does this party want you at all?
// ---------------------------------------------------------------------------

export const TIER_BASE_OFFER_CHANCE = {
  A: 0.35, // ruling-scale: hardest door
  B: 0.55,
  C: 0.75,
  D: 0.90, // new lists will take almost anyone
};

export const OFFER_CAPITAL_WEIGHTS = {
  party_standing: 0.45,
  popularity: 0.25,
  resources: 0.20,
  credibility: 0.10,
};

export const OFFER_CHANCE_MINIMUM = 0.02;
export const OFFER_CHANCE_MAXIMUM = 0.95;

/** Below this the slot is not worth showing as realistic, however good it is. */
export const OFFER_CHANCE_REACHABLE_MINIMUM = 0.25;

// ---------------------------------------------------------------------------
// Slot value — what number do they write next to your name?
// ---------------------------------------------------------------------------

export const SLOT_CAPITAL_WEIGHTS = {
  popularity: 0.40,
  party_standing: 0.30,
  credibility: 0.20,
  resources: 0.10,
};

export const BEST_POSSIBLE_SLOT = 1;

// ---------------------------------------------------------------------------
// Offers — scarcity in the career ladder
//
// `slotTable` says what you are WORTH everywhere. It is a read, not a door.
// Getting onto a list requires an actual offer, and offers are scarce:
//
//   - every party rolls exactly ONCE per run, on a turn fixed by the seed
//   - the roll is against offerChance, using your capital ON THAT TURN, so an
//     early offer is a worse offer
//   - your slot is fixed at the moment you accept
//   - an offer you decline, or leave unanswered, closes that party for the run
//
// Without this the player is handed a realistic slot on turn 1 of every run and
// keeps it on the table for 24 turns, which is 24 free chances at the same door.
// ---------------------------------------------------------------------------

/** No offers before this turn — you are not on anyone's radar yet. */
export const OFFER_FIRST_TURN = 2;

/** Lists are submitted. After this turn no offer arrives and your slot is locked. */
export const LIST_SUBMISSION_TURN = 16;

/** Leaving a list you already accepted a place on. */
export const PARTY_SWITCH_CREDIBILITY_COST = 8;

// ---------------------------------------------------------------------------
// Own party
// ---------------------------------------------------------------------------

export const OWN_PARTY_ID = 'own_party';
export const OWN_PARTY_TIER = 'D';
export const OWN_PARTY_OPEN_SLOTS = [1]; // you are number one on your own list

// The mid-run founding gate. Founding at character creation bypasses it: at
// turn 1 the choice is always open, because it is the run's premise rather
// than something you spend capital on (SPEC §6).
export const FOUND_PARTY_MIN_POPULARITY = 55;
export const FOUND_PARTY_MIN_RESOURCES = 70;

/**
 * A founded list displaces the fictional party closest to it in axis space and
 * inherits this fraction of that party's support in every segment. The rest
 * redistributes proportionally to everyone still on the ballot.
 *
 * Rolled once per run, from the run's own PRNG, so it is reproducible from the
 * seed and the player cannot know in advance whether the niche they picked was
 * worth much. At the low end you open well below the threshold and have to
 * campaign up, which is what keeps founding hard mode.
 */
export const FOUNDED_PARTY_INHERITANCE_MINIMUM = 0.15;
export const FOUNDED_PARTY_INHERITANCE_MAXIMUM = 0.35;

/** Used when a recruit record does not name its own risk. */
export const RECRUIT_DEFECTION_BASE_RISK = 0.15;

// ---------------------------------------------------------------------------
// Election night
// ---------------------------------------------------------------------------

export const KNESSET_SEATS = 120;
export const ELECTION_THRESHOLD_SHARE = 0.0325;

export const TURNOUT_VARIANCE_MINIMUM = 0.85;
export const TURNOUT_VARIANCE_MAXIMUM = 1.15;

// ---------------------------------------------------------------------------
// End titles — the slot bands each title sits in
// ---------------------------------------------------------------------------

// Ordered best to worst. Each band must be wider than the one above it, or the
// title it gates becomes unreachable.
export const PRIME_MINISTER_MAX_SLOT = 1;
export const SENIOR_MINISTER_MAX_SLOT = 5;
/** A minister, so it outranks a committee chair — who is an MK, not a minister. */
export const MINISTER_WITHOUT_PORTFOLIO_MAX_SLOT = 8;
export const COMMITTEE_CHAIR_MAX_SLOT = 12;

// Ministerial titles are gated on the size of the list as well as the slot.
// Without this, slot 4 on a seven-seat list scores the same as slot 4 on the
// largest party in the Knesset, and almost every run ends in a ministry.
export const SENIOR_MINISTER_MIN_SEATS = 10;
export const MINISTER_WITHOUT_PORTFOLIO_MIN_SEATS = 6;

/**
 * A party this size or larger can plausibly put its leader in the chair.
 * Sized against a fragmented 21-list field where the largest party lands around
 * 16–20 seats. Raise it if the roster consolidates — set above the largest
 * party's realistic ceiling and the ראש הממשלה title becomes dead content.
 */
export const PRIME_MINISTER_MIN_SEATS = 18;

// ---------------------------------------------------------------------------
// Card authoring limits (tools/validate.js)
//
// The hard limits are errors; the soft ones are warnings. The soft limits are
// about readability, not correctness: an option moving six segments cannot be
// understood by the player or balanced by the author (CLAUDE.md §3).
// ---------------------------------------------------------------------------

export const VALID_CARD_ACTS = [2, 3, 4, 5, 6];

export const MAX_SEGMENT_DELTA = 3.0;
export const MAX_AXIS_DELTA = 0.25;
export const MAX_CAPITAL_DELTA = 20;

export const WARN_SEGMENTS_PER_OPTION = 3;
export const WARN_CAPITAL_METERS_PER_OPTION = 2;

/** From this act on, a card with no `requires` is probably under-gated. */
export const WARN_UNGATED_FROM_ACT = 3;

// ---------------------------------------------------------------------------
// Balance harness (tools/balance.js)
// ---------------------------------------------------------------------------

/**
 * Outcome title ids that count as reaching the top tier.
 *
 * This list must stay a CONTIGUOUS run from the top of END_TITLES. Skip one and
 * the metric stops being monotonic in slot: a player improving from slot 10 to
 * slot 7 would drop out of the top tier, and balance.js would read a genuine
 * improvement as a regression.
 */
export const TOP_TIER_TITLE_IDS = [
  'prime_minister',
  'senior_minister',
  'minister_without_portfolio',
  'committee_chair',
];

/**
 * CLAUDE.md §6.1 — a spread wider than this between the best and worst
 * archetype's top-tier reach rate is a balance bug, and will be read as a
 * political statement. tools/balance.js exits non-zero on it.
 */
export const BALANCE_MAX_TOP_TIER_SPREAD = 0.20;

/**
 * Floor and ceiling on the cohort as a whole.
 *
 * The spread test only catches ASYMMETRY. It cannot tell "perfectly balanced"
 * from "equally broken for everyone" — six archetypes all reaching the top tier
 * 0% of the time has a spread of zero and would otherwise pass. These two
 * bounds catch that case from both directions:
 *
 *   best  < FLOOR    nobody can win. The path is broken, not balanced.
 *   worst > CEILING  everybody wins. There is no game here.
 */
export const BALANCE_MIN_TOP_TIER_RATE = 0.10;
export const BALANCE_MAX_TOP_TIER_RATE = 0.75;
