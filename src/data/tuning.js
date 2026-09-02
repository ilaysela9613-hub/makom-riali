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

/**
 * Election day, and how much of the calendar one turn burns. The HUD counts
 * down to this date, so a run covers the 24 weeks before the election.
 */
export const ELECTION_DATE_ISO = '2026-10-27';
export const DAYS_PER_TURN = 7;

/**
 * How many parties the slot HUD shows. A fourteen-row table is not glanceable,
 * and the slot table only works as a score if it can be read at a glance.
 */
export const SLOT_HUD_ROW_LIMIT = 5;

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
//
// Two kinds, and neither charges rent. The old upkeep/axesPull model is gone:
// a patron no longer drains you every turn, it BINDS you. Whoever backs you
// names the axes you are held to, and the M3 stance machinery does the rest —
// deviate from a binding axis and the existing flip detection fires, voters
// leave, and the run says why. There is no parallel punishment system.
//
//   gatekeeper — puts you straight onto an existing party's list, and holds you
//                to that party's line on the axes it names.
//   sponsor    — no party, but a head start in voters or capital, and a public
//                agenda you are held to just as tightly.
// ---------------------------------------------------------------------------

export const STARTING_PATRON = 'none';

/**
 * How far a gatekeeper drags your slot from what your capital is worth toward
 * the best slot their party has open. 0 means they spend nothing on you and the
 * seat is worthless on a big list; 1 means the seat is free and capital stops
 * mattering, which erases the offer game for anyone who takes one.
 */
export const GATEKEEPER_SLOT_CONCESSION = 0.5;

/**
 * The seat a gatekeeper aims for, as a fraction of what their party is polling.
 * 0.6 means "comfortably inside the list, not at the very top".
 *
 * Relative to the party's SIZE on purpose. Anchoring on each party's best open
 * slot instead made the deal worth wildly different amounts depending on who
 * was offering — slot 6 on a twelve-seat list against slot 11 on a sixteen-seat
 * one — and handed the run to whichever archetype could reach the good door.
 */
export const GATEKEEPER_SEAT_DEPTH = 0.6;

/** Dropping a patron mid-run. Changing who owns you was never free. */
export const PATRON_SWITCH_CREDIBILITY_COST = 12;

// Eligibility gates. These ARE the progression ladder (CLAUDE.md §4.2).
export const BRANCH_BOSS_MIN_PARTY_STANDING = 20;
export const COUNCIL_AIDE_MIN_RELIGION_AXIS = 0.35;
export const CHIEF_OF_STAFF_MIN_POPULARITY = 40;
/** Or buy your way to the same table. A big party notices either kind of asset. */
export const CHIEF_OF_STAFF_MIN_RESOURCES = 60;
export const ORGANISER_MIN_CREDIBILITY = 50;
export const DONOR_MIN_RESOURCES = 25;
export const FEDERATION_MIN_PARTY_STANDING = 25;
export const BROADCAST_MIN_POPULARITY = 45;

// ---------------------------------------------------------------------------
// Betrayal
//
// The patron who put you where you are comes back and asks you to stand
// somewhere else. Accepting flips your binding axes, which turns every position
// you already took on them into a flip — the M3 defection code fires on its own.
// Refusing costs you the patron, and can cost you the run.
// ---------------------------------------------------------------------------

/** Share of runs in which the patron turns on the player at all. */
export const PATRON_BETRAYAL_CHANCE = 0.25;

/** Inclusive turn range the betrayal is scheduled into. Mid-run, never turn 1. */
export const BETRAYAL_TURN_RANGE = [9, 18];

/**
 * Chance that refusing gets a fabricated story run against you, which ends the
 * run. The betrayal card reads this directly so the number lives in one place.
 */
export const FAKE_NEWS_CHANCE = 0.30;

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

// ---------------------------------------------------------------------------
// Stances, integrity and defection
//
// Replaces abstract credibility damage with something the player can watch
// happen. Contradicting a position you took in public, or piling up deals that
// serve you and nobody else, makes actual voters leave — and the run says which
// voters and why.
//
// `credibility` still exists and still moves; it simply stopped being shown.
// It buffers scandals inside the engine. Defection is what the player sees.
// ---------------------------------------------------------------------------

/** How many `integrity: 'dirty'` choices pile up before voters act on them. */
export const DIRTY_THRESHOLD = 3;

/**
 * Segment delta points removed from a punishing segment when the player is
 * caught contradicting a stance they took. Scaled per segment by the `flip`
 * weight below, so the same flip costs different amounts in different places.
 */
export const FLIP_DEFECTION_BASE = 1.8;

/** The same, for a defection triggered by accumulated dirty dealing. */
export const DIRTY_DEFECTION_BASE = 1.5;

/**
 * A defection only moves a segment whose weight for that reason clears this.
 * Keeps a defection legible: three or four segments move, not all eight.
 */
export const DEFECTION_MINIMUM_WEIGHT = 0.55;

/**
 * How heavily each segment weighs the two failures, 0…1.
 *
 * These are NOT moral scores and must never be presented as any electorate
 * being more or less honest than another. They model what an electorate votes
 * ON: some weigh ideological consistency most heavily, others weigh delivery
 * and access, and a voter who cares about delivery is not thereby indifferent
 * to it — they are simply answering a different question at the ballot box.
 *
 * Nothing sits at zero, and nothing sits at one for both. A caricature here
 * would be both bad modelling and a breach of CLAUDE.md §6.
 */
export const SEGMENT_PUNISH_WEIGHTS = {
  secular_center: { flip: 1.0, dirty: 0.9 },
  young_reservists: { flip: 0.9, dirty: 0.8 },
  religious_zionist: { flip: 0.8, dirty: 0.5 },
  haredi: { flip: 0.6, dirty: 0.3 },
  arab: { flip: 0.5, dirty: 0.6 },
  russian_speaking: { flip: 0.5, dirty: 0.4 },
  traditional_mizrahi: { flip: 0.4, dirty: 0.3 },
  periphery_general: { flip: 0.4, dirty: 0.5 },
};

// ---------------------------------------------------------------------------
// Post-turn feedback beat
//
// After a decision the run shows what moved, then carries on by itself. The
// player never clicks to dismiss it — a click only skips ahead.
// ---------------------------------------------------------------------------

/** A routine turn. Long enough to read two lines and watch the bars move. */
export const FEEDBACK_BEAT_MS = 2400;

/** A turn where voters walked out. Worth holding on. */
export const FEEDBACK_BEAT_DEFECTION_MS = 4200;

/** Bar and ticker animation. Must finish inside the shorter beat above. */
export const FEEDBACK_ANIMATION_MS = 700;

/** A bloc has to move at least this much before the beat bothers naming it. */
export const BLOC_MOVEMENT_NOTICE_THRESHOLD = 0.002;

// ---------------------------------------------------------------------------
// Option shapes: certain, or a two-branch gamble
//
// Options no longer carry a `pill`. The player follows their read of the
// situation, not a summary of where it pushes. What replaced it is honest odds:
// a gamble shows both branches with real percentages and real outcomes, and a
// certain option states its result flatly.
// ---------------------------------------------------------------------------

/** Every gamble has exactly this many branches, and their chances sum to 100. */
export const BRANCHES_PER_GAMBLE = 2;
export const BRANCH_CHANCE_TOTAL = 100;

/**
 * Share of all branches in the deck that end the run on the spot.
 *
 * A run-ender is rare on purpose: it should be the thing one card in the whole
 * deck can do to you, not a hazard you meet every few turns. Note that the
 * SHARE OF RUNS ending early runs far above this figure, because a run takes
 * several gambles and the chances compound — validate.js reports both.
 *
 * At a small deck this rate is coarse: one branch either side moves it by
 * 100/branchCount points, so validate.js reports the achievable band rather
 * than pretending an exact match is available.
 */
export const DEAD_END_TARGET_RATE = 0.01;

/**
 * Segment points weigh roughly this much against one capital point when
 * deciding whether a branch reads as a good outcome or a bad one. Presentation
 * only — it picks the colour of the branch line, nothing else.
 */
export const BRANCH_VALENCE_SEGMENT_WEIGHT = 4;
