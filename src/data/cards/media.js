// תקשורת — ראיונות, רשתות, ניהול תדמית.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.
//
// Cards here are where the `media` patron's amplification bites: it multiplies
// every capital delta in both directions, so the same branch is a bigger win
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
        branches: [
          {
            chance: 75,
            text: 'עלייה בטוחה בפופולריות · עולה זמן והכנה',
            capital: { popularity: +6, party_standing: -4 },
            segments: { secular_center: +0.5 },
          },
          {
            chance: 25,
            text: '',
            capital: { party_standing: -4 },
          },
        ],
      },
      {
        label: 'לוותר על הראיון ולשמור על עצמך',
        abstainText: 'ללא השפעה',
        capital: { credibility: +2, popularity: -2 },
      },
      {
        label: 'לענות בכנות על השאלה שהוא באמת שואל',
        branches: [
          {
            chance: 65,
            text: 'הרגע רץ ברשת לטובתך — קפיצה גדולה בפופולריות',
            capital: { popularity: +13, party_standing: -5 },
            segments: { secular_center: +1.2, young_reservists: +1.0 },
          },
          {
            chance: 35,
            text: 'שלוש שניות מתוך שבע דקות רצו בלופ יומיים',
            capital: { popularity: -9, party_standing: -7 },
            segments: { secular_center: -0.8 },
          },
        ],
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
        branches: [
          {
            chance: 55,
            text: 'הרחבת קהל — המרכז החילוני עובר אליך',
            capital: { popularity: +8, party_standing: -4 },
            segments: { secular_center: +1.8 },
          },
          {
            chance: 45,
            text: 'הבסיס שלך שואל למה בכלל הלכת לשם',
            capital: { popularity: +2, party_standing: -6 },
            segments: { religious_zionist: -1.3, traditional_mizrahi: -0.7 },
          },
        ],
      },
      {
        label: 'לוותר ולהישאר עם הקהל שלך',
        abstainText: 'הבסיס נשמר · לא הרחבת כלום',
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
        branches: [
          {
            chance: 70,
            text: 'מסורתיים ופריפריה עוברים אליך · שבוע אחרי שבוע',
            capital: { party_standing: -6 },
            segments: { traditional_mizrahi: +1.5, periphery_general: +1 },
          },
          {
            chance: 30,
            text: '',
            capital: { party_standing: -6 },
          },
        ],
      },
      {
        label: 'לוותר ולהשקיע ברשתות',
        branches: [
          {
            chance: 60,
            text: 'צעירים עוברים אליך · ויתרת על קהל שבאמת מצביע',
            capital: { party_standing: -3 },
            segments: { young_reservists: +1.1, traditional_mizrahi: -0.5 },
          },
          {
            chance: 40,
            text: '',
            capital: { party_standing: -3 },
            segments: { traditional_mizrahi: -0.5 },
          },
        ],
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
        branches: [
          {
            chance: 65,
            text: 'הסיפור ידעך לבד · מחיר קטן בפופולריות',
            capital: { popularity: -3, credibility: +2 },
          },
          {
            chance: 35,
            text: 'ההסבר רץ פחות מהקטע',
            capital: { popularity: -3 },
          },
        ],
      },
      {
        label: 'לצאת להתקפה ולהפוך את זה לסיפור על מי ערך',
        branches: [
          {
            chance: 55,
            text: 'ההתקפה עבדה — הסיפור נמחק והרווחת ממנו',
            capital: { popularity: +10, credibility: -2 },
          },
          {
            chance: 45,
            text: 'עכשיו יש שני סרטונים, ואתה בשניהם',
            capital: { popularity: -12, credibility: -6 },
            segments: { secular_center: -1.0 },
          },
        ],
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
        branches: [
          {
            chance: 70,
            text: 'כתבה אוהדת · המרכז החילוני עובר אליך',
            capital: { popularity: +5, credibility: -4 },
            segments: { secular_center: +1.1 },
          },
          {
            chance: 30,
            text: '',
            capital: { credibility: -4 },
          },
        ],
      },
      {
        label: 'להגיד בדיוק את מה שאתה אומר בכל מקום',
        branches: [
          {
            chance: 75,
            text: 'הכתבה תהיה קרירה · לא ויתרת על כלום',
            capital: { credibility: +6, popularity: -4 },
          },
          {
            chance: 25,
            text: '',
            capital: { popularity: -4 },
          },
        ],
      },
    ],
  },
];
