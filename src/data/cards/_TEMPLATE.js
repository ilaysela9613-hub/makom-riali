// ===========================================================================
// CARD TEMPLATE — copy from here, do not import this file.
//
// This file is deliberately NOT listed in cards/index.js, so nothing here is
// loaded, drawn or validated. It exists to be copied from.
//
// Workflow for one card:
//   1. copy a block below into the right deck file (religion.js, economy.js, …)
//   2. node tools/validate.js          <- run this after every single card
//   3. node tools/simulate.js --runs 500
// ===========================================================================


// ---------------------------------------------------------------------------
// THE MINIMUM VIABLE CARD — every required key, nothing optional.
// Start here. Add gates and risk only when the card needs them.
// ---------------------------------------------------------------------------

export const MINIMAL_EXAMPLE = {
  id: 'unique_snake_case_id',   // must be unique across ALL card files
  act: 2,                       // 2 = הרשימה (turns 1–8), 3 = הקמפיין (turns 9–24)
  weight: 1.0,                  // relative draw weight; 1.0 is the norm
  camp: 'neutral',              // 'right' | 'left' | 'neutral' — REQUIRED

  title: 'כותרת קצרה',
  text: 'שתיים־שלוש שורות שמעמידות את ההחלטה. מי מבקש ממך מה, ומה נשקל.',

  options: [                    // at least 2
    {
      label: 'מה שהשחקן היה אומר',
      pill: 'מחזק ב… · פוגע ב…',
      capital: { party_standing: +5 },
    },
    {
      label: 'האפשרות השנייה',
      pill: 'מחיר נמוך · לא מקדם אותך',
      capital: { credibility: +2 },
    },
  ],
};


// ---------------------------------------------------------------------------
// THE FULL CARD — every key the engine and validator understand.
// Delete what you don't use. Everything outside `id`, `act`, `camp`, `title`,
// `text` and `options` is optional.
// ---------------------------------------------------------------------------

export const FULL_EXAMPLE = {
  // -- identity ------------------------------------------------------------

  id: 'another_unique_id',
  act: 3,
  weight: 1.0,     // 2.0 = drawn twice as often as a 1.0 card in the same act
  camp: 'right',   // feeds the balance guard: never 3 same-camp cards in a row.
                   // 'neutral' is exempt from that guard.

  // -- gating --------------------------------------------------------------
  //
  // `requires` — ALL conditions must pass for the card to be drawable.
  // Every key below is optional; only these eight keys exist.
  // A card in act 3+ with no `requires` at all gets a validator warning.

  requires: {
    // Ideology. Keys: security | religion | economy | rule_of_law. Range -1…+1.
    axes: {
      religion: { max: 0.2 },
      security: { min: -0.5, max: 0.5 },
    },

    // Meters. Keys: popularity | party_standing | credibility | resources. 0…100.
    capital: {
      resources: { min: 20 },
    },

    // Tier of the party the player currently sits in: 'A' | 'B' | 'C' | 'D'.
    // A player with no party fails this check.
    partyTier: ['A', 'B'],

    // Selection method of the player's current party. One of:
    //   'primaries' | 'chairman_appointed' | 'rabbinical_council'
    //   | 'sectoral_quota' | 'founder_controlled'
    partySelection: ['primaries'],

    // Current patron. One of:
    //   'none' | 'local_boss' | 'donor' | 'chairman' | 'media' | 'sector_leader'
    patron: ['donor', 'chairman'],

    // true  = only for a player running their own list
    // false = only for a player who is NOT running their own list
    ownParty: false,

    // Flags the run must already carry. Flags are set by other cards' options.
    flags: ['is_mk'],

    // Card ids the player must NOT have seen yet. Must resolve to real cards.
    notSeen: ['some_other_card_id'],
  },

  // Once THIS card is seen, these cards can never be drawn.
  // Use it for mutually exclusive branches. Must resolve to real card ids.
  excludes: ['a_contradictory_card_id'],

  // -- content -------------------------------------------------------------

  title: 'הצבעה בוועדה על חוק הגיוס',
  text: 'ועדת החוץ והביטחון מצביעה מחר. יושב ראש הסיעה מבהיר שהוא מצפה למשמעת קואליציונית.',

  // -- options -------------------------------------------------------------

  options: [
    {
      // TWO STRINGS, both required.
      //   label — the choice as the PLAYER would phrase it
      //   pill  — the mechanical direction, stated plainly
      // The pill removes ambiguity without removing risk: the player learns the
      // direction, never the magnitude and never whether a gamble lands.
      label: 'להצביע בעד, כמו שהתבקשת',
      pill: 'מחזק במעמד המפלגתי · פוגע בצעירים ובמרכז החילוני',

      // Ideology drift. Limit: |delta| <= 0.25. Keep these SMALL — 0.05–0.10
      // is a real move. Drift accumulates over ~24 turns and shows on the end card.
      axes: { religion: +0.08 },

      // Meters. Limit: |delta| <= 20. Warning above 2 meters in one option.
      capital: { credibility: -4, party_standing: +6 },

      // Segment movement, in DELTA POINTS not percentages. Limit: |delta| <= 3.0.
      // Warning above 3 segments in one option.
      // Keys: secular_center | traditional_mizrahi | arab | haredi
      //     | religious_zionist | russian_speaking | periphery_general
      //     | young_reservists
      //
      // Gains are scaled by the player's affinity with that segment; losses
      // always land at full magnitude.
      segments: { haredi: +1.2, young_reservists: -1.5 },

      // Sets run flags. Other cards can gate on these via `requires.flags`.
      flags: ['voted_with_coalition'],
    },

    {
      label: 'להיעדר מההצבעה',
      pill: 'מחיר נמוך בכל הכיוונים',
      capital: { credibility: -2, party_standing: -3 },
      segments: { haredi: -0.3 },
    },

    {
      // A GAMBLE. `risk` and `onFail` are all-or-nothing: one without the
      // other is a validator error.
      label: 'להצביע נגד ולצאת לתקשורת',
      pill: 'הימור · מחזק בצעירים · עלול לעלות לך במעמד המפלגתי',

      // Probability the gamble goes WRONG, 0…1. 0.35 = fails about a third of
      // the time. Rolled against the run's seeded PRNG.
      risk: 0.35,

      // These land ALWAYS — win or lose. This is what you gambled.
      capital: { popularity: +9, party_standing: -12 },
      segments: { young_reservists: +2.0, haredi: -2.2 },

      // These land IN ADDITION, only on a failed roll. Not instead.
      // Same effect keys as an option, plus `text`.
      onFail: {
        capital: { party_standing: -10 },
        segments: { secular_center: -0.8 },
        axes: { rule_of_law: +0.05 },
        flags: ['marked_as_rebel'],
        text: 'יושב ראש הסיעה הוריד אותך מהוועדה.',   // shown to the player
      },

      // Makes follow-up cards drawable. A card named in ANY option's `unlocks`
      // is LOCKED until that option fires — that is what makes chains work.
      // Must resolve to real card ids.
      unlocks: ['coalition_crisis_01'],
    },
  ],
};


// ---------------------------------------------------------------------------
// LIMITS — the validator's hard rules. Exceeding one is an error, exit 1.
// ---------------------------------------------------------------------------
//
//   |segment delta|  <=  3.0
//   |axis delta|     <=  0.25
//   |capital delta|  <=  20
//   options          >=  2
//   risk             <=> onFail   (each requires the other)
//   id                   unique across all files
//   camp                 present, one of right | left | neutral
//   label + pill         present on every option
//   excludes / unlocks / notSeen   must resolve to real card ids
//
// WARNINGS — reported, do not fail the build:
//
//   an option touching more than 3 segments
//   an option touching more than 2 capital meters
//   an act 3+ card with no `requires`
//
// All of these live in src/data/tuning.js if you want to move them.


// ---------------------------------------------------------------------------
// AUTHORING DISCIPLINE
// ---------------------------------------------------------------------------
//
// ONE OR TWO SEGMENTS, ONE CAPITAL METER, most of the time. An option that
// moves six segments cannot be read by the player or balanced by you. The
// validator warns above three, but three is already a lot.
//
// NO OPTION IS THE GOOD ONE. Only consequences. If one option is obviously
// correct it is not a decision, it is a formality.
//
// NEUTRALITY IS A BUILD RULE, NOT A DISCLAIMER (CLAUDE.md §6):
//   - real parties, fictional leaders
//   - never attribute a criminal act, corruption, or a specific real scandal
//     to a real party or a real person
//   - negative content stays STRUCTURAL: coalition demands, internal rebellion,
//     primaries pressure, committee horse-trading
//   - satirize the machine, not a camp. מרכז המפלגה and הסכמי עודפים are
//     absurd to everyone, which is the point.
//
// CAMP BALANCE: tag honestly. The draw refuses to deal more than two same-camp
// cards in a row, and it can only do that if `camp` reflects what the card
// actually is. A deck of 40 'neutral' cards defeats the guard entirely.
//
// LANGUAGE: code identifiers and comments in English, everything the player
// reads in Hebrew, and Hebrew only ever inside src/data/.
