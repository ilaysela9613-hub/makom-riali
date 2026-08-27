// תקשורת — ראיונות, רשתות, ניהול תדמית.
//
// PLACEHOLDER CONTENT — see the note at the top of security.js, including the
// balance rule: an option is a trade, not a gift.
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
    placeholder: true,

    title: 'ראיון במהדורה המרכזית',
    text: 'הזמינו אותך לשבע דקות במהדורה. המראיין ידוע בכך שהוא שואל את אותה שאלה שלוש פעמים עד שמקבל תשובה.',

    options: [
      {
        label: 'להגיע מוכן עם מסר אחד ולחזור עליו',
        pill: 'רווח בטוח בפופולריות · עולה זמן והכנה',
        capital: { popularity: +6, resources: -4 },
        segments: { secular_center: +0.5 },
      },
      {
        label: 'לוותר על הראיון ולשמור על עצמך',
        pill: 'לא קורה כלום · הזמן רץ',
        capital: { credibility: +2, popularity: -2 },
      },
      {
        label: 'לענות בכנות על השאלה שהוא באמת שואל',
        pill: 'הימור · קפיצה גדולה בפופולריות · או ציטוט שירדוף אותך',
        risk: 0.35,
        capital: { popularity: +12, resources: -5 },
        segments: { secular_center: +1.2, young_reservists: +1.0 },
        onFail: {
          capital: { popularity: -8, party_standing: -7 },
          text: 'שלוש שניות מתוך שבע דקות רצו בלופ יומיים. אף אחד לא זוכר את השאר.',
        },
      },
    ],
  },

  {
    id: 'hostile_podcast_invite',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    requires: {
      capital: { credibility: { min: 30 } },
    },

    title: 'הזמנה לפודקאסט עוין',
    text: 'פודקאסט עם קהל גדול שלא מצביע לך מזמין אותך לשעה. המנחה לא ינסה להפיל אותך; הוא ינסה להבין אותך, וזה מסוכן יותר.',

    options: [
      {
        label: 'ללכת ולדבר בכנות',
        pill: 'מחזק במרכז החילוני · הבסיס שלך ישאל למה הלכת',
        capital: { popularity: +6, party_standing: -4 },
        segments: { secular_center: +1.4, religious_zionist: -0.7 },
      },
      {
        label: 'לוותר ולהישאר עם הקהל שלך',
        pill: 'שומר על הבסיס · לא מרחיב כלום',
        capital: { party_standing: +3, popularity: -3 },
        segments: { religious_zionist: +0.5 },
      },
    ],
  },

  {
    id: 'regional_radio_slot',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    title: 'פינה קבועה בתחנה אזורית',
    text: 'תחנה אזורית מציעה לך פינה שבועית. הקהל שלה מסורתי, מבוגר, ומצביע בשיעורים גבוהים.',

    options: [
      {
        label: 'לקחת את הפינה',
        pill: 'מחזק במסורתיים ובפריפריה · עולה זמן וכסף',
        capital: { resources: -6 },
        segments: { traditional_mizrahi: +1.5, periphery_general: +1.0 },
      },
      {
        label: 'לוותר ולהשקיע ברשתות',
        pill: 'מחזק בצעירים · מוותר על קהל שבאמת מצביע',
        capital: { resources: -3 },
        segments: { young_reservists: +1.1, traditional_mizrahi: -0.5 },
      },
    ],
  },

  {
    id: 'viral_clip_out_of_context',
    act: 3,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    title: 'קטע שיצא מהקשרו',
    text: 'ארבעים שניות מתוך נאום של עשרים דקות רצות ברשת. ההקשר קיים, מתועד, ולא מעניין אף אחד.',

    options: [
      {
        label: 'לפרסם את הנאום המלא ולהסביר',
        pill: 'מחיר קטן בפופולריות · הסיפור ידעך לבד',
        capital: { popularity: -3, credibility: +2 },
      },
      {
        label: 'לצאת להתקפה ולהפוך את זה לסיפור על מי ערך',
        pill: 'הימור · מוחק את הסיפור אם זה עובד · מכפיל אותו אם לא',
        risk: 0.45,
        capital: { popularity: +9, credibility: -2 },
        onFail: {
          capital: { popularity: -11, credibility: -6 },
          text: 'ההתקפה הפכה לסיפור השני. עכשיו יש שני סרטונים.',
        },
      },
    ],
  },

  {
    id: 'newspaper_endorsement_meeting',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'פגישה עם מערכת עיתון',
    text: 'מערכת עיתון מזמינה אותך לשיחה לפני שהם מגבשים עמדה. הם לא יגידו לך מה הם רוצים לשמוע, אבל אתה יודע.',

    options: [
      {
        label: 'לרכך את הניסוח ולצאת עם יחס אוהד',
        pill: 'מחזק במרכז החילוני · מחיר באמינות',
        capital: { popularity: +5, credibility: -4 },
        segments: { secular_center: +1.1 },
      },
      {
        label: 'להגיד בדיוק את מה שאתה אומר בכל מקום',
        pill: 'מחזק באמינות · הכתבה תהיה קרירה',
        capital: { credibility: +6, popularity: -4 },
      },
    ],
  },
];
