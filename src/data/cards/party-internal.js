// פוליטיקה פנים־מפלגתית — מרכז המפלגה, פריימריז, משמעת סיעתית.
//
// One example card. Add the rest below it — the schema is documented in
// CLAUDE.md §3 and demonstrated end to end in security.js.
//
// This is the deck where the satire lives: the machine, not a camp
// (SPEC §11.4). Everything here should be absurd to everyone.

export default [
  {
    id: 'party_conference_slot_deal',
    act: 2,
    weight: 1.2,
    camp: 'neutral',

    title: 'ועידת המפלגה מתכנסת',
    text: 'שני עסקנים שאתה לא מכיר מציעים לך שלוש מאות מתפקדים בוועידה. הם לא מבקשים כלום עכשיו. הם מדגישים במיוחד שהם לא מבקשים כלום עכשיו.',

    options: [
      {
        label: 'לקחת את המתפקדים ולהודות יפה',
        pill: 'קפיצה במעמד המפלגתי · מחיר באמינות',
        capital: { party_standing: +10, credibility: -6 },
      },
      {
        label: 'לסרב בנימוס ולבנות רשימה משלך',
        pill: 'מחזק באמינות · המעמד המפלגתי נבנה לאט',
        capital: { credibility: +6, party_standing: -3, resources: -4 },
      },
      {
        label: 'לקחת, ולספר על זה בעצמך לפני שמישהו אחר יספר',
        pill: 'הימור · מרוויח בשני הכיוונים אם זה עובר · מפולת אם לא',
        risk: 0.40,
        capital: { party_standing: +8, popularity: +7 },
        onFail: {
          capital: { credibility: -12 },
          flags: ['known_as_dealmaker'],
          text: 'הסיפור התגלגל אחרת ממה שתכננת. עכשיו מצטטים אותך בתור מי שסיפר, לא בתור מי שסירב.',
        },
      },
    ],
  },
];
