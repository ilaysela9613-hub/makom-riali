// חובות לפטרון — the bill coming due.
//
// Cards here are NOT drawn at random. Each one is named by a patron's
// `obligation.cardId` in data/patrons.js, and engine/patron.js schedules it for
// a turn inside that patron's `turnRange` when the patron is taken. On that
// turn drawCard returns it regardless of the normal weighted draw.
//
// That means every patron with an `obligation` needs a card here whose id
// matches exactly. `node tools/validate.js` warns about any that is missing —
// without a card, the favour silently never comes due.
//
// Currently claimed:
//   donor_calls_in_favour  <- patrons.donor
//
// One example card. Add one per patron obligation as you write them.

export default [
  {
    id: 'donor_calls_in_favour',
    act: 3,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    requires: {
      patron: ['donor'],
    },

    title: 'התורם מבקש פגישה',
    text: 'הוא לא ביקש כלום במשך חודשים. עכשיו הוא מבקש שתיפגש עם מישהו, ומדגיש שזו רק פגישה, ושאתה כמובן לא מחויב לשום דבר.',

    options: [
      {
        label: 'להיפגש ולהקשיב',
        pill: 'שומר על התורם ועל המשאבים · מחיר באמינות',
        capital: { resources: +8, credibility: -7 },
      },
      {
        label: 'להיפגש, ולומר בסוף שאתה לא יכול לעזור',
        pill: 'שומר על האמינות · המשאבים מתחילים להתייבש',
        capital: { credibility: +4, resources: -9 },
      },
      {
        label: 'לא להגיע לפגישה',
        pill: 'הימור · ניתוק נקי אם זה עובר · הוא יודע לאסוף חובות',
        risk: 0.45,
        capital: { credibility: +7 },
        onFail: {
          capital: { resources: -14, party_standing: -6 },
          flags: ['burned_a_patron'],
          text: 'שני אנשים שהיו אמורים להחזיר לך טלפון היום לא החזירו. זה יימשך.',
        },
      },
    ],
  },
];
