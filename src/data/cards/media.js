// תקשורת — ראיונות, רשתות, ניהול תדמית.
//
// One example card. Add the rest below it — the schema is documented in
// CLAUDE.md §3 and demonstrated end to end in security.js.
//
// Cards here are where the `media` patron's amplification bites: it multiplies
// every capital delta in both directions, so the same option is a bigger win
// and a bigger hole depending on who is backing you.

export default [
  {
    id: 'prime_time_interview',
    act: 2,
    weight: 1.0,
    camp: 'neutral',

    title: 'ראיון במהדורה המרכזית',
    text: 'הזמינו אותך לשבע דקות במהדורה. המראיין ידוע בכך שהוא שואל את אותה שאלה שלוש פעמים עד שמקבל תשובה.',

    options: [
      {
        label: 'להגיע מוכן עם מסר אחד ולחזור עליו',
        pill: 'רווח בטוח בפופולריות · לא מרגש אף אחד',
        capital: { popularity: +6 },
        segments: { secular_center: +0.5 },
      },
      {
        label: 'לוותר על הראיון ולשמור על עצמך',
        pill: 'לא קורה כלום · הזמן רץ',
        capital: { credibility: +2 },
      },
      {
        label: 'לענות בכנות על השאלה שהוא באמת שואל',
        pill: 'הימור · קפיצה גדולה בפופולריות ובאמינות · או ציטוט שירדוף אותך',
        risk: 0.35,
        capital: { popularity: +12, credibility: +5 },
        segments: { secular_center: +1.2, young_reservists: +1.0 },
        onFail: {
          capital: { popularity: -8, party_standing: -7 },
          text: 'שלוש שניות מתוך שבע דקות רצו בלופ יומיים. אף אחד לא זוכר את השאר.',
        },
      },
    ],
  },
];
