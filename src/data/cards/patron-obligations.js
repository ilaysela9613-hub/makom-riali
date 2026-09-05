// חובות לפטרון — the bill coming due.
//
// This card is NOT drawn at random. engine/patron.js schedules it when a patron
// is taken (PATRON_BETRAYAL_CHANCE of runs, at a turn inside BETRAYAL_TURN_RANGE)
// and engine/cards.js forces it on the turn it falls due, ahead of the weighted
// draw. The `requires.patron` list below only stops it leaking into a normal
// draw for a player who has nobody to be betrayed by.
//
// The two options are answered by the engine through `patronBetrayal`:
//
//   'accept'  — every binding axis flips to the opposing position. The player
//               declared those positions when they took the patron, so the M3
//               flip detection fires by itself and the voters who care leave.
//               No punishment code runs here that is not already M3 code.
//   'refuse'  — the patron is gone, and with them a gatekeeper's seat on the
//               list. The damage of the refusal itself is on the branches.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.

import PATRONS from '../patrons.js';
import { FAKE_NEWS_CHANCE, BRANCH_CHANCE_TOTAL } from '../tuning.js';

/** Only a patron that binds you has anything to betray you over. */
const BINDING_PATRON_IDS = Object.values(PATRONS)
  .filter((patron) => (patron.bindingAxes ?? []).length > 0)
  .map((patron) => patron.id);

const FAKE_NEWS_BRANCH_CHANCE = Math.round(FAKE_NEWS_CHANCE * BRANCH_CHANCE_TOTAL);

export default [
  {
    id: 'patron_demands_realignment',
    act: 3,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    // Forced by engine/patron.js when the demand falls due, and unreachable by
    // the ordinary draw. Without this the deck would deal it to anyone with a
    // binding patron, and the stated betrayal rate would mean nothing.
    scheduledOnly: true,

    requires: {
      patron: BINDING_PATRON_IDS,
    },

    title: 'מי שהכניס אותך מבקש שתזוז',
    text: 'הפגישה נקבעה בלי סדר יום. הוא לא מזכיר את מה שהבטחת ולא צריך להזכיר — הוא רק מסביר, בשקט, שהעמדה שלך מהחודשים האחרונים כבר לא נוחה לו, ושהוא מצפה לשמוע אותך אומר את ההיפך עד סוף השבוע.',

    options: [
      {
        label: 'להתיישר עם הדרישה',
        patronBetrayal: 'accept',
        branches: [
          {
            chance: 80,
            text: 'הפטרון נשאר · מי שהאמין למה שהצהרת יראה בדיוק מה קרה',
            capital: { party_standing: +6 },
          },
          {
            chance: 20,
            text: '',
          },
        ],
      },
      {
        label: 'לסרב ולהישאר עם מה שאמרת',
        patronBetrayal: 'refuse',
        branches: [
          {
            chance: BRANCH_CHANCE_TOTAL - FAKE_NEWS_BRANCH_CHANCE,
            text: 'איבדת אותו ואת מה שהוא החזיק · שרדת את השבוע',
            capital: { popularity: -6, party_standing: -8 },
            segments: { secular_center: +0.9 },
          },
          {
            chance: FAKE_NEWS_BRANCH_CHANCE,
            text: 'סיפור מומצא עליך רץ בכל מקום — הקמפיין שלך נגמר',
            endsRun: 'fake_news',
            capital: { popularity: -20, party_standing: -14 },
            flags: ['target_of_fake_news'],
          },
        ],
      },
    ],
  },
];
