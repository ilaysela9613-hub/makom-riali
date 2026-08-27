# CLAUDE.md — מקום ריאלי

Turn-based political career sim for the 2026 Knesset elections.
Structural model: Legionnaire (football/basketball career sim), retargeted to
Israeli politics.

Design rationale lives in `SPEC.md`. **This file is the build contract.**
When the two disagree, this file wins.

---

## 0. Non-negotiables

1. **The engine is DOM-free.** Everything in `src/engine/` and `src/data/` must
   run unchanged in Node. No `window`, no `document`. This is what makes the
   headless simulator possible, and the simulator is what keeps the game balanced.
2. **Vanilla JS, ES modules, no build step.** No React, no bundler, no
   TypeScript, no runtime npm dependencies. The browser loads
   `<script type="module" src="src/main.js">` directly. Node tools import the
   same files. `package.json` exists only for `"type": "module"` and dev tooling.
3. **No balance numbers in components.** Every tunable value lives in
   `src/data/tuning.js`. A magic number in engine or UI code is a bug.
4. **All randomness goes through the seeded PRNG** in `src/engine/rng.js`.
   Never `Math.random()`. A run is fully reproducible from its seed.
5. **Engine functions are pure.** Take state, return new state. No mutation of
   the input, no side effects.
6. **The human writes the cards.** Do not bulk-generate mission content unless
   explicitly asked. Your job is the engine, the schema, the validator and the
   authoring tooling.
7. **Leave balance arithmetic unevaluated.** Write `1.20 * 0.92`, not `1.104`.
   The two factors mean different things (boost and price) and the author needs
   to see both. This applies everywhere a modifier is composed.

---

## 1. File layout

```
/
├── index.html
├── package.json                 # { "type": "module" } only
├── CLAUDE.md
├── SPEC.md
├── src/
│   ├── main.js                  # browser entry, wires engine to UI
│   ├── engine/                  # DOM-FREE. Must run in Node.
│   │   ├── rng.js               # seeded PRNG (mulberry32)
│   │   ├── state.js             # createRun, clone, flags
│   │   ├── cards.js             # eligibility, weighted draw, applyOption
│   │   ├── segments.js          # segment support math
│   │   ├── patron.js            # eligibility, affinities, upkeep, obligations
│   │   ├── slots.js             # offerChance + slotValue → the slot table
│   │   ├── election.js          # turnout, threshold, surplus, Bader-Ofer
│   │   ├── party.js             # own-party founding, recruitment
│   │   └── index.js             # public API barrel
│   ├── data/                    # DOM-FREE. Content + constants.
│   │   ├── tuning.js            # every balance constant
│   │   ├── segments.js
│   │   ├── parties.js
│   │   ├── patrons.js
│   │   ├── archetypes.js
│   │   ├── recruits.js
│   │   └── cards/
│   │       ├── index.js         # imports + concatenates all card files
│   │       ├── security.js
│   │       ├── religion.js
│   │       ├── economy.js
│   │       ├── rule-of-law.js
│   │       ├── party-internal.js
│   │       ├── media.js
│   │       ├── patron-obligations.js
│   │       └── own-party.js
│   └── ui/                      # browser only
│       ├── screen-card.js
│       ├── screen-patron.js
│       ├── hud-slots.js
│       ├── hud-poll.js
│       ├── screen-election.js
│       └── share-card.js        # canvas → PNG
└── tools/                       # Node only
    ├── validate.js
    ├── simulate.js
    └── balance.js
```

---

## 2. Data model

### 2.1 Ideology axes

Four, each `-1.0 … +1.0`: `security`, `religion`, `economy`, `rule_of_law`.
Poles in `SPEC.md §2.1`. Drift during a run; shown on the end card.

### 2.2 Coalition posture

String flag, not an axis:
`'right_religious' | 'center' | 'arab_parties' | 'anti_incumbent_only' | 'anyone'`
Changing it mid-run costs heavy `credibility`.

### 2.3 Capital meters

`0 … 100`: `popularity`, `party_standing`, `credibility`, `resources`.

### 2.4 Segments

Keys and starting weights (tunable game-balance values, not demographic claims):

| key | weight |
|---|---|
| `secular_center` | 0.22 |
| `traditional_mizrahi` | 0.18 |
| `arab` | 0.15 |
| `haredi` | 0.11 |
| `religious_zionist` | 0.10 |
| `russian_speaking` | 0.09 |
| `periphery_general` | 0.09 |
| `young_reservists` | 0.06 |

Each segment holds a distribution over parties summing to 1.0. The player
carries a per-segment `affinity` (`-1.0 … +1.0`) multiplying how much their
decisions move that segment.

### 2.5 Run state shape

```js
{
  seed: 1234567,
  turn: 12,
  act: 2,
  axes:     { security: 0.3, religion: -0.5, economy: 0.1, rule_of_law: -0.2 },
  posture:  'center',
  capital:  { popularity: 41, party_standing: 28, credibility: 62, resources: 35 },
  affinity: { secular_center: 0.6, haredi: -0.8, /* ... */ },
  segments: { secular_center: { likud: 0.08, /* ... */ }, /* ... */ },
  party:    'likud' | null,
  partyTurns: 6,                 // consecutive turns in current party
  slot:     14 | null,
  patron:   'donor' | 'none',
  patronTurns: 4,
  ownParty: null | { name, axes, recruits: [], surplusPartner: null },
  flags:    ['founded_party', 'lost_primaries'],
  seen:     ['draft_law_committee', /* ... */],
  history:  [{ turn, cardId, optionIndex }],
  log:      [/* human-readable strings for the end card */]
}
```

Never mutate. `applyOption` returns a new object.

---

## 3. Card authoring format

Cards are **JS modules, not JSON** — a human hand-writes 150 of these in Hebrew.
Comments, trailing commas and unquoted keys are the whole point.

Code identifiers and comments: English. Player-facing strings: Hebrew.

```js
// src/data/cards/religion.js
export default [
  {
    id: 'draft_law_committee',        // unique across ALL card files
    act: 3,                            // 2 | 3 | 4 | 5 | 6
    weight: 1.0,
    camp: 'neutral',                   // 'right' | 'left' | 'neutral' — REQUIRED

    requires: {                        // all optional; all must pass
      axes:     { religion: { max: 0.2 } },
      capital:  { resources: { min: 20 } },
      partyTier: ['A', 'B'],
      partySelection: ['primaries'],
      patron: ['donor', 'chairman'],
      ownParty: false,
      flags: ['is_mk'],
      notSeen: ['draft_law_floor_vote'],
    },
    excludes: ['draft_law_floor_vote'],

    title: 'הצבעה בוועדה על חוק הגיוס',
    text:  'ועדת החוץ והביטחון מצביעה מחר. יושב ראש הסיעה מבהיר שהוא מצפה למשמעת קואליציונית.',

    options: [
      {
        label: 'להצביע בעד, כמו שהתבקשת',
        pill:  'מחזק במעמד המפלגתי · פוגע בצעירים ובמרכז החילוני',
        axes:     { religion: +0.08 },
        capital:  { credibility: -4, party_standing: +6 },
        segments: { haredi: +1.2, young_reservists: -1.5 },
      },
      {
        label: 'להיעדר מההצבעה',
        pill:  'מחיר נמוך בכל הכיוונים',
        capital:  { credibility: -2, party_standing: -3 },
        segments: { haredi: -0.3 },
      },
      {
        label: 'להצביע נגד ולצאת לתקשורת',
        pill:  'הימור · מחזק בצעירים · עלול לעלות לך במעמד המפלגתי',
        risk: 0.35,
        capital:  { popularity: +9, party_standing: -12 },
        segments: { young_reservists: +2.0, haredi: -2.2 },
        onFail: {
          capital: { party_standing: -10 },
          flags: ['marked_as_rebel'],
          text: 'יושב ראש הסיעה הוריד אותך מהוועדה.',
        },
        unlocks: ['coalition_crisis_01'],
      },
    ],
  },
];
```

### Two strings per option

`label` is the choice as the player would phrase it. `pill` states the
mechanical direction plainly. The pill removes ambiguity without removing risk:
the player knows the direction, not the magnitude or whether a gamble lands.
Both are required.

### Authoring discipline

Most options should touch **one or two segments and one capital meter**. An
option moving six segments is unreadable to the player and unbalanceable by the
author.

### Validator rules

**Errors** (exit non-zero):
- `id` unique across all files
- `camp` present and valid
- `label` and `pill` present on every option
- ≥ 2 options
- every `segments` / `capital` / `axes` key is real
- `|segment delta| ≤ 3.0`, `|axis delta| ≤ 0.25`, `|capital delta| ≤ 20`
- `risk` present ⟹ `onFail` present
- every id in `excludes`, `unlocks`, `notSeen` resolves to a real card
- `requires` uses only known keys
- every `patron` id in `requires` exists in `data/patrons.js`

**Warnings** (report, don't fail):
- an option touching more than 3 segments
- an option touching more than 2 capital meters
- a card with no `requires` in acts 3+ (probably under-gated)

---

## 4. Patrons

The persistent modifier layer. See `SPEC.md §5` for the design argument.
Without it every run plays identically and variety comes only from card draw.

### 4.1 Record shape

Mirror the card format: mostly strings, plus small pure functions.

```js
// src/data/patrons.js
import { PATRON_POPULARITY_MID, PATRON_POPULARITY_HIGH, DONOR_MIN_RESOURCES } from './tuning.js';

const notFounder = (p) => !p.ownParty;
const PRIMARIES_PARTIES = new Set(['likud', 'democrats']);

export default {
  donor: {
    id: 'donor',
    displayName: 'תורם — <fictional>',
    shortName: '<fictional>',
    pitch: 'הוא לא מבקש ג׳וב ולא מבקש תפקיד. הוא רק רוצה שתזכור מי מימן לך את הסיבוב הראשון במרכז.',
    pillLabel: 'סיכוי גבוה יותר במפלגות עם פריימריז · חוב שייגבה בהמשך',

    eligible: (p) => p.capital.resources >= DONOR_MIN_RESOURCES,
    offerAffinity: (party, p) => PRIMARIES_PARTIES.has(party.id) ? 1.5 : 1,
    slotAffinity:  (party, p) => party.selection === 'primaries' ? 1.12 * 0.94 : 1,

    upkeep:   { credibility: -1 },
    axesPull: { economy: +0.02 },
    obligation: { cardId: 'donor_calls_in_favour', turnRange: [6, 14] },
  },
  // ...
};
```

Note `1.12 * 0.94` — boost and price, left unevaluated per §0.7.

### 4.2 Roster and gates

The gates ARE the progression ladder. Constants live in `tuning.js`.

| id | Gate | Boosts | Price |
|---|---|---|---|
| `none` | always | nothing | none; `credibility` decays slower |
| `local_boss` | always | 2–3 hardcoded party ids | low upkeep, caps ceiling |
| `donor` | `resources ≥ 25` | `primaries` parties | obligation card, credibility drain |
| `chairman` | `popularity ≥ 45` | `chairman_appointed` Tier A/B | heavy `axesPull` to party line |
| `media` | `popularity ≥ 60` | broad; amplifies `popularity` gains | amplifies bad events too |
| `sector_leader` | `partyTurns ≥ 8` AND max segment affinity ≥ 0.7 | current party far above all others | locks party and segment |

`sector_leader` must exclude players currently on `chairman` or `media`, or
dropping down from a high tier into the loyalty bonus is a free exploit.

Hardcode the party ids for `local_boss` as a `Set`. Three parties needing the
behaviour does not justify a relationship abstraction.

`none` is a real strategic option, not an absence. Independence should be
playable.

---

## 5. Engine API

```js
import {
  createRun, drawCard, applyOption,
  eligiblePatrons, choosePatron,
  slotTable, poll, runElection,
} from './engine/index.js';

createRun(seed, archetypeId)            → state
drawCard(state)                         → card | null
applyOption(state, cardId, optionIndex) → { state, resolution }
eligiblePatrons(state)                  → patron[]
choosePatron(state, patronId)           → state
slotTable(state)                        → [{ partyId, slot, projectedSeats, reachable }]
poll(state)                             → { [partyId]: seats }
runElection(state)                      → { seats, playerSeats, playerElected, title }
```

### 5.1 Offer chance and slot value are separate

Two independent multiplier chains. Whether a party wants you and what number
they give you are different questions, and every modifier must be able to move
one without the other.

```
offerChance(party, player) = base(party.tier, player.capital)
                           × party.offerAffinity(player)
                           × patron.offerAffinity(party, player)

slotValue(party, player)   = base(party.openSlots, player.capital)
                           × party.slotAffinity(player)
                           × patron.slotAffinity(party, player)
```

`slotTable` composes both. It is the player-facing score, derived and never
stored — the HUD shows what slot the player is currently worth in each party.

### 5.2 Election resolution

```
for each segment s:
  turnout[s]        = base_turnout[s] × rng.range(0.85, 1.15)
  effectiveVotes[s] = weight[s] × turnout[s]

share[p] = Σ_s effectiveVotes[s] × segments[s][p]
normalize → drop below 3.25% → surplus agreements → Bader-Ofer → 120 seats
```

Player outcome = slot vs. party seat count. Do not smooth this.

---

## 6. Neutrality as an engineering requirement

Tests, not disclaimers.

1. `tools/balance.js` runs N simulations per archetype (6 archetypes spanning
   the spectrum) and reports top-tier reach rates. **A spread above 20% between
   best and worst is a balance bug and must be reported as a failure.**
2. Card draw enforces a running `camp` balance counter. Never more than 2
   consecutive same-camp cards. Pure randomness produces runs that read as
   authored bias.
3. No option labelled good or bad. Only consequences.
4. Real parties, fictional leaders. Never attribute a criminal act, corruption,
   or a specific real scandal to a real party or its leader. Negative content
   stays structural: coalition demands, internal rebellion, primaries pressure.
5. Nothing on the end screen may resemble a voting recommendation.

---

## 7. Milestones

| # | Deliverable | Gate |
|---|---|---|
| **M1** | Engine + data + patrons + validator + headless simulator. **No UI.** | `node tools/simulate.js --runs 1000` prints a plausible outcome distribution |
| M2 | UI shell: card screen, patron screen, slot HUD, poll ticker | Playable loop in browser |
| M3 | Election night + canvas share card | Shareable PNG |
| M4 | Own party: founding, recruitment, surplus agreements | Threshold failure state works |
| M5 | Coalition negotiation (Act 5) | Reach 61 or fail |

Build M1 first despite having no UI. The simulator is what lets the author test
a new mission's balance impact in seconds instead of clicking through twenty turns.

---

## 8. Conventions

### 8.1 Naming

Identifiers are written for a human reader, not for brevity. This code will be
read far more often than it is written, and by an author who is spending most of
their attention on Hebrew content rather than on the engine.

- No single-letter or abbreviated identifiers except loop indices. `mandates`,
  not `m`. `credibility`, not `cred`. `party`, not `p`.
- Threshold constants are named for what they gate, not numbered:
  `CHAIRMAN_MIN_POPULARITY`, not `THRESHOLD_2`.
- Predicates read as assertions: `isEligibleForPatron`, `hasCrossedThreshold`,
  `canFoundParty`.
- Functions are named for what they return, not how they work internally:
  `slotTable`, not `computeSlots`.
- **One English gloss per domain concept, used everywhere.** Pick `slot` and
  never also write `place`, `position` or `rank` for the same thing. Same for
  `segment` (not `bloc`/`group`), `mandate` (not `seat` in some places and
  `mandate` in others — pick one), `patron` (not `sponsor`/`backer`).
  A bilingual domain makes drift here very easy and very confusing.
- Destructured locals keep the source name. No renaming to shorter forms.

### 8.2 General

- Code identifiers, comments, commit messages: English.
- Player-facing strings: Hebrew, in `data/` only. Never hardcode Hebrew in
  `engine/` or `ui/` logic.
- `index.html` sets `dir="rtl" lang="he"`.
- Party roster is not final until candidate lists are submitted in early
  September. `data/parties.js` must be editable without touching any other
  file, and no UI may assume a fixed party count.
- Dev server: `python3 -m http.server 8000`. No tooling beyond that.
