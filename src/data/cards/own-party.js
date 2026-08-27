// המפלגה שלך — cards that only fire for a player running their own list.
//
// Every card in this file must carry `requires: { ownParty: true }`, or it will
// offer a founder's decision to a player who has no list to make it about.
//
// One example card. Add the rest below it — the schema is documented in
// CLAUDE.md §3 and demonstrated end to end in security.js.

export default [
  {
    id: 'list_submission_deadline',
    act: 3,
    weight: 1.4,
    camp: 'neutral',
    placeholder: true,

    requires: {
      ownParty: true,
    },

    title: 'הגשת הרשימה מתקרבת',
    text: 'נותרו ימים ספורים להגשה. שני שמות שרצית עדיין לא חתמו, ומישהו כבר הדליף שהרשימה שלך לא תיסגר בזמן.',

    options: [
      {
        label: 'לסגור את הרשימה עכשיו עם מי שכבר בפנים',
        pill: 'שומר על יציבות ועל אמינות · מוותר על שמות גדולים',
        capital: { credibility: +6, popularity: -3 },
        segments: { secular_center: +0.5 },
      },
      {
        label: 'לשרוף משאבים ולסגור את שני השמות',
        pill: 'קפיצה בפופולריות ובצעירים · יקר מאוד',
        capital: { resources: -16, popularity: +8 },
        segments: { young_reservists: +1.4, secular_center: +1.0 },
      },
      {
        label: 'לצאת להודעה על רשימה פתוחה ולחכות עד הרגע האחרון',
        pill: 'הימור · הרשימה החזקה ביותר שתוכל להרכיב · או הגשה בלחץ',
        risk: 0.40,
        capital: { popularity: +11 },
        segments: { secular_center: +1.8, young_reservists: +1.5 },
        onFail: {
          capital: { credibility: -10, popularity: -6 },
          flags: ['chaotic_list_submission'],
          text: 'הגשת ארבעים דקות לפני הסגירה עם שני מקומות ריקים. זה מה שיצולם.',
        },
      },
    ],
  },
];
