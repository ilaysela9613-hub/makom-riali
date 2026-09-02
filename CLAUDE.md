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
│   │   ├── segments.js          # segment support math + display blocs
│   │   ├── credibility.js       # stances, dirty dealing, defection
│   │   ├── patron.js            # kinds, binding, betrayal
│   │   ├── patronage.js         # composes taking a patron with the slot chain
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
│   │   ├── titles.js            # end titles
│   │   ├── defections.js        # Hebrew for voters walking out
│   │   ├── feedback.js          # Hebrew for the post-turn beat
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
│       ├── styles.css           # the whole stylesheet; logical properties only
│       ├── dom.js               # element builders, no framework
│       ├── screen-start.js
│       ├── screen-patron.js
│       ├── screen-offer.js      # a party wants you on its list
│       ├── screen-card.js       # the card, and the post-turn beat
│       ├── screen-election.js   # seat chart + drift chart
│       ├── screen-end.js        # composes the end screen
│       ├── hud-slots.js         # the one slot line
│       ├── hud-blocs.js         # three bloc bars
│       ├── hud-poll.js          # own mandates + countdown
│       ├── debug-panel.js       # ?debug=1
│       └── share-card.js        # canvas → PNG  (M5)
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
      // CERTAIN — a flat statement of the result. No odds, because there are none.
      {
        label: 'להצביע בעד, כמו שהתבקשת',
        certainText: 'עלייה במעמד בסיעה · הצעירים עוזבים',
        axes:     { religion: +0.08 },
        capital:  { credibility: -4, party_standing: +6 },
        segments: { haredi: +1.2, young_reservists: -1.5 },
      },
      // GAMBLE — exactly two branches, chances summing to 100, each with its own
      // outcome text and its own effects. Effects live on the BRANCH, never on
      // the option around it.
      {
        label: 'להצביע נגד ולצאת לתקשורת',
        stance: { axis: 'religion', direction: -1 },
        unlocks: ['coalition_crisis_01'],
        branches: [
          {
            chance: 55,
            text: 'הצעירים מאמצים אותך · החרדים מוחקים אותך',
            capital:  { popularity: +9, party_standing: -8 },
            segments: { young_reservists: +2.0, haredi: -2.2 },
          },
          {
            chance: 45,
            text: 'הוצאת מהסיעה — הריצה שלך נגמרת כאן',
            endsRun: true,
            capital: { party_standing: -20 },
            flags: ['marked_as_rebel'],
          },
        ],
      },
    ],
  },
];
```

### One shape or the other, never both

An option carries **`certainText`** or **`branches`**, and the validator errors
on anything else. There is no `pill`: the player reads the situation, not a
summary of where it pushes. The only forward-looking information in the game is
the outcome text on a gamble's branches, and that comes with honest odds
attached.

`branches` has exactly two entries whose `chance` values sum to 100. Resolution
rolls against the run's seeded PRNG, so a gamble is reproducible from the seed
and cannot be rerolled.

A branch may set `endsRun: true` to stop the run on the spot (or a string
naming the cause). `tools/validate.js` reports the share of branches that do,
against `DEAD_END_TARGET_RATE` in tuning.js.

### Authoring discipline

Most options should touch **one or two segments and one capital meter**. An
option moving six segments is unreadable to the player and unbalanceable by the
author.

### Validator rules

**Errors** (exit non-zero):
- `id` unique across all files
- `camp` present and valid
- `label` present on every option
- every option has `certainText` OR `branches`, never both and never neither
- `branches` has exactly 2 entries, `chance` values summing to 100
- a gamble carries no effect blocks on the option itself
- ≥ 2 options
- every `segments` / `capital` / `axes` key is real
- `|segment delta| ≤ 3.0`, `|axis delta| ≤ 0.25`, `|capital delta| ≤ 20`
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

Two kinds, and neither charges rent. A patron does not drain you every turn — it
**binds** you. Whoever backs you names the axes you are held to, and deviating
from one is an ordinary flip that the M3 stance/defection machinery punishes on
its own. There is no parallel patron punishment system and there must never be
one.

```js
// src/data/patrons.js
{
  id: 'halikud_branch_boss',
  kind: 'gatekeeper',                  // 'gatekeeper' | 'sponsor' | 'none'
  displayName: 'ראש סניף בליכוד — <fictional>',
  pitch: '…',
  agendaText: 'קו ביטחוני נוקשה ושמירה על הסטטוס קוו הדתי — בלי סטיות.',

  eligible: (player) => player.capital.party_standing >= BRANCH_BOSS_MIN_PARTY_STANDING,

  party: 'halikud',                    // gatekeeper only; null for a sponsor
  bindingAxes: ['security', 'religion'],
  headStart: null,                     // sponsor only
}
```

- **gatekeeper** — seats the player on `party`'s list directly, no offer roll.
  Binding directions are read off the party's own `axes`, because being held to
  a party's line means exactly that.
- **sponsor** — no party. Pays a `headStart` of `{ capital, segments }` and
  states its own `agendaAxes: { economy: +1 }`, since it has no party to read
  directions from.
- **none** — a real strategic option. Nobody opens a door, and nobody owns one
  of your positions either.

The seat a gatekeeper gives is scaled to the party's projected size
(`GATEKEEPER_SEAT_DEPTH`) and then dragged only part of the way there from what
the player's capital is worth (`GATEKEEPER_SLOT_CONCESSION`). Anchoring it on
each party's best open slot instead makes the deal worth wildly different
amounts depending on who is offering.

### 4.2 Betrayal

`PATRON_BETRAYAL_CHANCE` of runs, at a turn inside `BETRAYAL_TURN_RANGE`. The
roll happens **once per run**, the first time a binding patron is taken —
switching patrons re-targets a betrayal that was already coming, it never buys a
fresh roll.

It arrives as an ordinary two-branch card (`patron_demands_realignment`, marked
`scheduledOnly` so the weighted draw can never deal it). Accepting reverses every
binding stance, which turns each position the player already declared into a
flip and lets the existing defection code fire. Refusing loses the patron — and
a gatekeeper's seat with them — and carries a `FAKE_NEWS_CHANCE` branch that
ends the run.

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

slotValue(party, player)   = base(party.openSlots, player.capital)
                           × party.slotAffinity(player)
```

M4 removed the patron leg of both chains. A patron no longer nudges the odds
from outside: a gatekeeper puts you on a list outright, a sponsor gives a head
start. The two chains stay separate because party modifiers still have to be
able to move one without touching the other.

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
  `segment` (not `group`/`demographic`), `seat` (not `mandate` in some places
  and `seat` in others — the §5 API fixes this one on `seat`), `patron` (not
  `sponsor`/`backer`), `stance` (not `position`/`pledge`/`commitment`),
  `defection` (not `backlash`/`churn`/`walkout`).
  A bilingual domain makes drift here very easy and very confusing.
- `segment` and `bloc` are **different concepts and both are needed.** A
  `segment` is one of the eight units the engine actually simulates; a `bloc` is
  one of the three display groupings the player sees, defined by `displayBloc`
  in `data/segments.js`. Never use `bloc` to mean a segment, and never let a
  bloc reach the election maths.
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
