# מקום ריאלי — Design Spec v0.2

A turn-based political career sim for the 2026 Knesset elections.
Structural model: Legionnaire (football/basketball career sim), retargeted to
Israeli politics.

`CLAUDE.md` is the build contract. This file is the design rationale.

**v0.2 changes:** added the patron layer (§5), split offer probability from
slot value (§4.4), replaced pill labels with certain/gamble options (§7.2).

---

## 1. Core premise

You are a nobody with an opinion. Over ~25 turns you climb from unknown to a
realistic slot on a Knesset list — or you found your own party and try to clear
the threshold. Election night resolves your run.

**The single readable score is your realistic slot**, displayed per party:

```
מקום ריאלי:
  ליכוד            14
  ישראל ביתנו       6
  מפלגה חדשה שלך    1   (0 מנדטים חזויים)
```

This replaces Legionnaire's rating number. It is derived from the capital
meters but the player only ever sees the slot table. It goes up, it goes down,
it is instantly legible, and it doubles as the offer preview.

---

## 2. Player model

### 2.1 Ideology vector (four axes, each −1.0 to +1.0)

| Axis | −1.0 | +1.0 |
|---|---|---|
| `security` | מדיני / פשרה | ביטחוני / נץ |
| `religion` | הפרדת דת ומדינה | סטטוס קוו דתי / הרחבה |
| `economy` | סוציאל־דמוקרטי | שוק חופשי |
| `rule_of_law` | חיזוק ביקורת שיפוטית | חיזוק הרשות המחוקקת |

Set at character creation (6 archetype presets + custom). Drifts during play.
Drift is tracked and shown on the end card — the best share hook available.

### 2.2 Coalition posture

A separate flag, not an axis:
`'right_religious' | 'center' | 'arab_parties' | 'anti_incumbent_only' | 'anyone'`

In Israeli politics this constrains you more than ideology does. Changing it
mid-run costs `credibility` heavily.

### 2.3 Capital meters (0–100)

| Meter | Role |
|---|---|
| `popularity` | Public recognition. Gates chairman-appointed slots and new-party viability. |
| `party_standing` | Internal machine strength. Gates primaries. |
| `credibility` | Buffers scandals. Burned by flip-flops, patron upkeep, coalition concessions. |
| `resources` | Money, staff, media access. Spent on campaigns, recruitment, primaries. |

### 2.4 Segment affinity

Per-segment `-1.0 … +1.0`. Multiplies how much your decisions move that
segment. You cannot credibly court a segment you have no affinity with, which
is the main reason a run has a shape.

---

## 3. The electorate

Eight segments. Weights are **game-balance starting values**, tunable — not
demographic claims. Sum to 1.0 of valid votes.

| Segment | Weight | Notes |
|---|---|---|
| `secular_center` | 0.22 | Metro, high turnout |
| `traditional_mizrahi` | 0.18 | Periphery + urban, swing |
| `arab` | 0.15 | Volatile turnout — model turnout as a variable |
| `haredi` | 0.11 | Bloc-voting, institutional gatekeepers |
| `religious_zionist` | 0.10 | High turnout, ideological |
| `russian_speaking` | 0.09 | Cross-cutting on religion/security |
| `periphery_general` | 0.09 | Economically driven |
| `young_reservists` | 0.06 | Newly salient, low institutional loyalty |

Each segment holds a distribution over parties. Turnout per segment is a
per-run random variable (±15%) — the main source of election-night drama.

---

## 4. The party system

### 4.1 Party record

```js
{
  id: 'likud',
  name: 'הליכוד',
  real: true,
  tier: 'A',
  axes: { security: 0.7, religion: 0.3, economy: 0.5, rule_of_law: 0.6 },
  posture: 'right_religious',
  baseSegments: ['traditional_mizrahi', 'periphery_general', 'religious_zionist'],
  selection: 'primaries',
  leader: { name: '<fictional>', traits: ['dominant', 'reserved_slots'] },
  openSlots: [11, 14, 18, 22],
  prestige: 95,

  offerAffinity: (p) => p.party_standing >= 40 ? 1.3 : 1,
  slotAffinity:  (p) => p.axes.security > 0.5 ? 1.1 : 1,
}
```

### 4.2 Selection methods — the core differentiator

Each method checks a **different stat**, so your build determines which doors
are open.

| Method | Gate stat | Play pattern |
|---|---|---|
| `primaries` | `party_standing` + `resources` | Grind מרכז/מתפקדים. Slow, expensive, reliable. |
| `chairman_appointed` | `popularity` + leader favour | Fast. One good TV moment jumps you 8 slots. Volatile. |
| `rabbinical_council` | religion axis + credentials | Locked unless `religion > 0.6` and you've spent turns on institutional cards. Cannot be bought. |
| `sectoral_quota` | segment affinity | Requires deep affinity with one segment. Narrow but cheap. |
| `founder_controlled` | you are the founder | Your own party only. |

### 4.3 Tiers

- **A** — ruling-scale, 20+ potential. Hardest entry, worst slots for newcomers.
- **B** — 7–12 mandates. Realistic mid-career target.
- **C** — 4–6 mandates. Easy entry, threshold risk.
- **D** — new/fictional parties and your own. High variance.

v0 roster: 10 real parties + 4 fictional new parties + player-founded.
Keep it in a config file — lists aren't final until early September.

### 4.4 Offer probability vs. slot value

These are **two separate multipliers**, not one number. Whether a party wants
you and what number they'll give you are different questions, and every
modifier in the game (patron, party, recruits) should be able to move one
without the other.

```
offerChance(party, player) = base(party.tier, player.capital)
                           × party.offerAffinity(player)
                           × patron.offerAffinity(party, player)

slotValue(party, player)   = base(party.openSlots, player.capital)
                           × party.slotAffinity(player)
                           × patron.slotAffinity(party, player)
```

---

## 5. Patrons

The persistent modifier layer. Chosen early, changeable at cost, biasing your
entire offer distribution for the rest of the run. Without this, every run
plays the same way and the only variety comes from card draw.

Politically: nobody arrives in the Knesset unsponsored. Someone put you there.

### 5.1 Structure

Five patrons plus a genuine "no patron" option. Each carries:

- `eligible(player)` — a gate. The gates ARE the progression ladder.
- `offerAffinity(party, player)` — multiplier on offer chance
- `slotAffinity(party, player)` — multiplier on slot value
- `upkeep` — per-turn capital cost, the standing price
- `axesPull` — per-turn drift toward the patron's position
- `obligation` — a card id that fires later in the run. The bill comes due.

The commission model is the point. A football agent takes a percentage of your
contract. A political patron takes credibility, ideological independence, and
a favour you'll be asked for at the worst possible moment.

### 5.2 The roster

| id | Who | Gate | Boosts | Price |
|---|---|---|---|---|
| `none` | בלי פטרון | always | nothing | none — and `credibility` decays slower |
| `local_boss` | עסקן/ראש עיר | always | 2–3 specific party ids, hardcoded | low upkeep, caps your ceiling |
| `donor` | תורם | `resources ≥ 25` | `primaries` parties strongly | obligation card, `credibility` risk |
| `chairman` | יו"ר המפלגה | `popularity ≥ 45` | `chairman_appointed` Tier A/B | heavy `axesPull` to party line |
| `media` | גורם תקשורתי | `popularity ≥ 60` | broad, amplifies `popularity` gains | amplifies bad events too — volatility, not cost |
| `sector_leader` | מנהיג מגזרי | held one party ≥ 8 turns AND one segment affinity ≥ 0.7 | your current party far above all others | locks you to that party and segment |

`sector_leader` is the loyalty path — the analog of Legionnaire's מעגל הקפטן.
It must exclude players arriving from `chairman` or `media`, or dropping down
from a high tier into the loyalty bonus becomes a free exploit.

Hardcode the specific party ids for `local_boss`. Three parties needing the
behaviour does not justify a relationship abstraction.

---

## 6. Founding your own party

Available from turn 1 as an explicit early choice. Hard mode.

**To launch:** `popularity > 55` OR `resources > 70`. Below that the option is
visible with its failure odds shown.

**What you lose:** no machine. Segments voting on institutional trust
(`haredi`, `religious_zionist`) are closed unless you recruit someone who
carries them. Most patrons become ineligible; `donor` and `media` do not.

**Recruitment** — the closest analog to Legionnaire's transfer market:

```js
{
  id: 'rec_former_cos',
  name: '<fictional> — רמטכ"ל לשעבר',
  cost: { resources: 25, slots: 2 },
  brings: { secular_center: +2.5, young_reservists: +3.0, russian_speaking: +1.2 },
  axesPull: { security: +0.2 },
  baggage: ['no_political_experience', 'rival_to_founder'],
  risk: 0.15,
}
```

Archetype pool: רמטכ"ל לשעבר, עיתונאי/ת בכיר/ה, ראש עיר מהפריפריה, יזם היי-טק,
שר/ה לשעבר שפרש/ה בכעס, ראש מועצה מהמגזר, אקדמאי/ת מוכר/ת, פעיל/ת מחאה.

`risk` is the chance they defect before the submission deadline.

**Surplus agreements (הסכם עודפים):** one decision before deadline, real
Bader-Ofer effect. Cheap to build, feels expert.

**Failure state:** below 3.25% the run ends with `לא עברת את אחוז החסימה`.
This should happen often.

---

## 7. Turn loop

### 7.1 Sequence

```
1. Draw card       — weighted by act, ideology, party, patron, event state
2. Present         — 2–4 options, each certain or a two-branch gamble
3. Apply deltas    — axes, capital, segments
4. Resolve         — a gamble rolls one of its two branches
5. Upkeep          — patron cost, axes pull
6. Update HUD      — slot table + weekly poll ticker
```

The poll ticker is essential. A mandate chart updating every turn is the
equivalent of Legionnaire's rating chart, and it's what keeps people clicking.

### 7.2 One shape or the other

Legionnaire's `pillLabel` is gone. A summary of where an option pushes lets the
player optimise against the label instead of reading the situation, so the
option itself now states either a certain result or honest odds:

```
label: 'לא להתערב'
certainText: 'ללא השפעה'
```

```
label: 'לקבל את ההצעה'
branches:
  30%  לא נתפסת — גל תמיכה
  70%  נתפסת — ירידה חדה בתמיכה ובמעמד המפלגתי
```

Both branches are shown before the choice, with their real probabilities. The
player knows exactly what is on the table and exactly how likely each side is;
what they do not know is which way the roll will go. That is the only
forward-looking information in the game.

### 7.3 Authoring discipline

Most options should touch **one or two segments and one capital meter**. An
option moving six segments is unreadable to the player and unbalanceable by
you. The validator warns above three.

---

## 8. Election night

```
for each segment s:
  turnout[s]        = base_turnout[s] × rng.range(0.85, 1.15)
  effectiveVotes[s] = weight[s] × turnout[s]

share[p] = Σ_s effectiveVotes[s] × segments[s][p]
normalize → drop below 3.25% → surplus agreements → Bader-Ofer → 120 seats
```

Player outcome = slot vs. party seat count. Do not smooth this. The gap
between "I was safe at 9" and "we got 7" is the emotional payload.

---

## 9. Acts

| Act | Turns | Content |
|---|---|---|
| 1 · כניסה | 1–8 | Entry path sets starting capital mix. *(v2)* |
| 2 · הרשימה | 9–16 | Patron choice. Party offers. Primaries or appointment. Or found your own. |
| 3 · הקמפיין | 17–28 | Campaign. Events deck fires hard. Poll ticker. |
| 4 · ליל הבחירות | 1 | Allocation, threshold drama, title. |
| 5 · קואליציה | 5–8 | Negotiation to 61. Concessions burn credibility. *(v1)* |
| 6 · כהונה | 8–15 | Stability decays. Survive → loop to Act 2 with your record as baggage. *(v2)* |

---

## 10. Titles and collections

**End titles:** ראש ממשלה · שר בכיר · יו"ר ועדה · ח"כ מן המניין ·
מפלגה של איש אחד · לא עברת את אחוז החסימה · חזרת לעסקנות מקומית

**Across runs:** אלבום מפלגות · ארון תפקידים · אלבום פטרונים · הישגים
(founded a party that crossed, survived a no-confidence vote, passed a private
member's bill, PM twice, served in a party >1.5 from your starting vector)

**End card (canvas → PNG):** parties served, patron, peak slot, peak mandates,
final title, and the ideology drift chart. The drift chart is the share hook:
"התחלתי כאן, סיימתי שם."

---

## 11. Neutrality as an engineering requirement

Tests, not disclaimers.

1. **Symmetric win conditions.** 6 archetypes spanning the spectrum.
   `tools/balance.js` runs 1,000 each and verifies comparable top-tier rates.
   A spread above 20% is a balance bug, and it will be read as a political
   statement.
2. **No moral scoring.** No option labelled good or bad. Only consequences.
3. **Balanced events deck** via a running `camp` counter, not raw randomness.
4. **Satirize the machine, not a camp.** מרכז המפלגה, spin doctors, ministries
   invented for a person, coalition horse-trading, surplus agreements. Absurd
   to everyone.
5. **Fictional leaders, and not caricatures.** Give each a biography that
   deliberately doesn't match the incumbent. Rotate leader traits per run.
   Never attribute a criminal act, corruption, or a specific real scandal to a
   real party or its leader. Negative content stays structural.
6. **No voting recommendation** anywhere on the end screen.
7. **Legal check.** Ask a colleague about לשון הרע exposure for the
   fictional-leader-on-real-party construction, and whether an interactive game
   touches חוק הבחירות (דרכי תעמולה) in the pre-election window.

---

## 12. Scope

Election day is 27 October 2026; final lists early September. Target soft
launch mid-September for 5–6 weeks of campaign attention.

| Version | Days | Contents |
|---|---|---|
| v0 | 1–7 | Acts 2–4. Patrons. 60 cards. 14 parties + founding. Slot table, poll ticker, election night, titles, share card. |
| v1 | 8–12 | Coalition negotiation. +30 cards. Balance harness in anger. |
| v2 | post-launch | Act 1 entry paths, Act 6 tenure, multi-cycle careers. |

Content is the cost, not code. Budget 120–150 cards.
