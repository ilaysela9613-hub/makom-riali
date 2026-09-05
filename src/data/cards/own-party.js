// המפלגה שלך — cards that only fire for a player running their own list.
//
// Every card in this file must carry `requires: { ownParty: true }`, or it will
// offer a founder's decision to a player who has no list to make it about.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.

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
        branches: [
          {
            chance: 80,
            text: 'הרשימה יציבה · ויתרת על שמות גדולים',
            capital: { credibility: +6, popularity: -3 },
            segments: { secular_center: +0.5 },
          },
          {
            chance: 20,
            text: '',
            capital: { popularity: -3 },
          },
        ],
      },
      {
        label: 'לשרוף כל טובה שיש לך ולסגור את שני השמות',
        branches: [
          {
            chance: 65,
            text: 'צעירים ומרכז חילוני עוברים אליך · לא נשאר לך מה לבקש',
            capital: { party_standing: -16, popularity: +8 },
            segments: { young_reservists: +1.4, secular_center: +1 },
          },
          {
            chance: 35,
            text: 'השמות חתמו במקום אחר',
            capital: { party_standing: -16 },
          },
        ],
      },
      {
        label: 'לצאת להודעה על רשימה פתוחה ולחכות עד הרגע האחרון',
        branches: [
          {
            chance: 50,
            text: 'הרשימה החזקה ביותר שיכולת להרכיב, ובזמן',
            capital: { popularity: +12 },
            segments: { secular_center: +1.8, young_reservists: +1.5 },
          },
          {
            chance: 50,
            text: 'הגשת ארבעים דקות לפני הסגירה עם שני מקומות ריקים',
            capital: { credibility: -12, popularity: -9 },
            segments: { secular_center: -1.4 },
            flags: ['chaotic_list_submission'],
          },
        ],
      },
    ],
  },
];
