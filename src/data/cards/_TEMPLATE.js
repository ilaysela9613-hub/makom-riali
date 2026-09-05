// ===========================================================================
// CARD TEMPLATE — copy from here, do not import this file.
//
// Deliberately NOT listed in cards/index.js, so nothing here is loaded, drawn
// or validated. It exists to be copied from.
//
// Workflow for one card:
//   1. copy a block below into the right deck file (religion.js, economy.js, …)
//   2. node tools/validate.js          <- run this after every single card
//   3. node tools/simulate.js --runs 500
// ===========================================================================


// ---------------------------------------------------------------------------
// THE SHAPE OF AN OPTION
//
// Every option is one of exactly two things, and the validator errors on
// anything else:
//
//   ACTION  — `branches`: exactly two, `chance` values summing to 100, neither
//             below 20. Doing something is always a bet.
//   ABSTAIN — `abstainText`: a flat statement. Reserved for genuine non-action:
//             standing back, refusing, walking away, not turning up. The
//             validator warns if it appears on an active-verb label.
//
// There is no `pill`, no `certainText`, and no `risk`/`onFail`. The player reads
// the situation and the odds, and infers the rest.
// ---------------------------------------------------------------------------


export const MINIMAL_EXAMPLE = {
  id: 'unique_snake_case_id',   // must be unique across ALL card files
  act: 2,                       // 2 = הרשימה (turns 1–7), 3 = הקמפיין (turns 8–24)
  weight: 1.0,                  // relative draw weight; 1.0 is the norm
  camp: 'neutral',              // 'right' | 'left' | 'neutral' — REQUIRED

  title: 'כותרת קצרה',
  text: 'שתיים־שלוש שורות שמעמידות את ההחלטה. מי מבקש ממך מה, ומה נשקל.',

  options: [                    // at least 2
    {
      label: 'מה שהשחקן היה אומר',
      branches: [
        { chance: 70, text: 'מה קרה כשזה הצליח', capital: { party_standing: +5 } },
        { chance: 30, text: '', capital: { party_standing: -2 } },
      ],
    },
    {
      label: 'לא להתערב',
      abstainText: 'ללא השפעה',
    },
  ],
};


// ---------------------------------------------------------------------------
// THE FULL CARD — every key the engine and validator understand.
// Delete what you don't use.
// ---------------------------------------------------------------------------

export const FULL_EXAMPLE = {
  id: 'another_unique_id',
  act: 3,
  weight: 1.0,     // 2.0 = drawn twice as often as a 1.0 card in the same act
  camp: 'right',   // feeds the balance guard: never 3 same-camp cards in a row.
                   // 'neutral' is exempt from that guard.

  // Engine-scheduled cards are never dealt by the weighted draw. Leave this out
  // unless some system owns the card and decides when it fires.
  // scheduledOnly: true,

  // -- gating --------------------------------------------------------------
  //
  // `requires` — ALL conditions must pass. Every key optional; only these eight
  // exist. An act 3+ card with no `requires` gets a warning.

  requires: {
    // Ideology. Keys: security | religion | economy | rule_of_law. Range -1…+1.
    axes: { religion: { max: 0.2 } },

    // Meters. Keys: popularity | party_standing | credibility. 0…100.
    // `resources` was removed in M6 and is now a validator error.
    capital: { party_standing: { min: 20 } },

    // Tier of the party the player currently sits in: 'A' | 'B' | 'C' | 'D'.
    // A player with no party fails this check.
    partyTier: ['A', 'B'],

    // 'primaries' | 'chairman_appointed' | 'rabbinical_council'
    // | 'sectoral_quota' | 'founder_controlled'
    partySelection: ['primaries'],

    // Patron ids from data/patrons.js.
    patron: ['business_donor', 'halikud_branch_boss'],

    ownParty: false,              // true = founders only, false = everyone else
    flags: ['is_mk'],             // set by other cards' branches
    notSeen: ['some_other_card'], // must resolve to real card ids
  },

  // Once THIS card is seen, these can never be drawn. Must resolve.
  excludes: ['a_contradictory_card_id'],

  title: 'הצבעה בוועדה על חוק הגיוס',
  text: 'ועדת החוץ והביטחון מצביעה מחר. יושב ראש הסיעה מצפה למשמעת קואליציונית.',

  options: [
    {
      // The action, as the PLAYER would phrase it. This is the only line that
      // is not an outcome.
      label: 'להצביע בעד, כמו שהתבקשת',

      // A public position. Contradicting it later is a flip, and voters leave
      // over it (engine/credibility.js). direction is +1 or -1.
      stance: { axis: 'religion', direction: +1 },

      // Patronage, horse-trading, a deal that serves you and nobody else.
      // Accumulates; breaks at DIRTY_THRESHOLD. Only 'dirty' or absent.

      // Makes follow-up cards drawable. A card named in ANY option's `unlocks`
      // is LOCKED until that option fires — that is what makes chains work.
      unlocks: ['coalition_crisis_01'],

      // TWO BRANCHES. Effects live on the branch, NEVER on the option.
      branches: [
        {
          chance: 65,   // 20…80. Below the floor it is a trap, not a bet.
          // The winning branch always says what happened.
          text: 'עלייה במעמד בסיעה · הצעירים עוזבים',

          // Ideology drift. |delta| <= 0.25. Keep it small — 0.05–0.10 is a
          // real move, and drift accumulates across ~24 turns.
          axes: { religion: +0.08 },

          // Meters. |delta| <= 20. Warning above 2 meters in one branch.
          capital: { credibility: -4, party_standing: +6 },

          // Segment DELTA POINTS, not percentages. |delta| <= 3.0.
          // Warning above 3 segments. Keys: secular_center | traditional_mizrahi
          // | arab | haredi | religious_zionist | russian_speaking
          // | periphery_general | young_reservists
          segments: { haredi: +1.2, young_reservists: -1.5 },

          flags: ['voted_with_coalition'],
        },
        {
          chance: 35,
          // A failure only needs words when the consequence is not obvious.
          // Otherwise leave it empty and it renders as a thin muted rule.
          text: '',
          capital: { credibility: -4 },
        },
      ],
    },

    {
      label: 'להצביע נגד ולצאת לתקשורת',
      branches: [
        {
          chance: 80,
          text: 'הצעירים מאמצים אותך',
          capital: { popularity: +9, party_standing: -8 },
          segments: { young_reservists: +2.0 },
        },
        {
          chance: 20,
          // A branch may end the run on the spot. `true` records the cause as
          // 'dead_end'; a string names another cause. Keep these RARE —
          // validate.js reports the deck's rate against DEAD_END_TARGET_RATE.
          endsRun: true,
          text: 'הוצאת מהסיעה — הריצה שלך נגמרת כאן',
          capital: { party_standing: -20 },
          flags: ['marked_as_rebel'],
        },
      ],
    },

    {
      // The one shape that carries no odds. Non-action only.
      label: 'להיעדר מההצבעה',
      abstainText: 'מחיר קטן בכל הכיוונים',
      capital: { credibility: -2, party_standing: -3 },
    },
  ],
};


// ---------------------------------------------------------------------------
// LIMITS — validator errors, exit 1.
// ---------------------------------------------------------------------------
//
//   |segment delta|  <=  3.0
//   |axis delta|     <=  0.25
//   |capital delta|  <=  20
//   options          >=  2
//   branches         ==  2, chances summing to 100, each in 20…80
//   abstainText  XOR  branches   (never both, never neither)
//   a gamble carries no effect blocks on the option itself
//   `resources`, `pill`, `certainText`, `risk`, `onFail`  — all removed
//   excludes / unlocks / notSeen   must resolve to real card ids
//
// WARNINGS — reported, do not fail:
//   an option touching more than 3 segments
//   a branch touching more than 2 capital meters
//   an act 3+ card with no `requires`
//   `abstainText` on a label that starts with an active verb
//
// All limits live in src/data/tuning.js.


// ---------------------------------------------------------------------------
// AUTHORING DISCIPLINE
// ---------------------------------------------------------------------------
//
// ONE OR TWO SEGMENTS, ONE CAPITAL METER, most of the time. A branch that moves
// six segments cannot be read by the player or balanced by you.
//
// NO OPTION IS THE GOOD ONE. Only consequences. If one option is obviously
// correct it is not a decision, it is a formality.
//
// OUTCOME TEXT NAMES WHAT THE PLAYER CAN SEE: voters, mandates, standing in the
// faction, popularity. Never credibility and never the ideology axes — both are
// hidden. Popularity is shown as a BAND ('אהוב'), never as a number.
//
// NEUTRALITY IS A BUILD RULE, NOT A DISCLAIMER (CLAUDE.md §6):
//   - real parties, fictional leaders
//   - never attribute a criminal act, corruption, or a specific real scandal to
//     a real party or a real person
//   - negative content stays STRUCTURAL: coalition demands, internal rebellion,
//     primaries pressure, committee horse-trading
//   - satirize the machine, not a camp
//
// CAMP BALANCE: tag honestly. The draw refuses more than two same-camp cards in
// a row, and it can only do that if `camp` reflects what the card actually is.
//
// LANGUAGE: code identifiers and comments in English, everything the player
// reads in Hebrew, and Hebrew only ever inside src/data/.
