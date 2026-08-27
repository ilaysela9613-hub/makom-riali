// ביטחון.
//
// PLACEHOLDER CONTENT — every card here carries `placeholder: true`. These were
// generated for the M2 playable build under a one-off scope override, so that a
// full run has something to draw. They are structurally correct and balanced to
// the limits, but the writing is not final. Rewrite and drop the flag as you go;
// `node tools/validate.js` reports how many are left.
//
// BALANCE RULE FOR THIS WHOLE DECK: an option is a TRADE, not a gift. Nearly
// every option that gains a meter pays for it in another meter or in a segment.
// A deck of pure-gain options inflates the player's capital over 24 turns until
// every run ends in the top tier, which tools/balance.js will fail you for.
// Whatever the pill names as a cost, the option must actually charge.

export default [
  {
    id: 'border_incident_briefing',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    title: 'תדריך סגור על אירוע בגבול',
    text: 'קיבלת תדריך סגור על אירוע שהסתיים בלי נפגעים. הפרשנים כבר מדברים עליו, וחלקם לא מדויקים.',

    options: [
      {
        label: 'לצאת ולהסביר את מה שמותר להסביר',
        pill: 'מחזק בציוני־דתי · מחיר במעמד המפלגתי',
        axes: { security: +0.05 },
        capital: { popularity: +5, party_standing: -3 },
        segments: { religious_zionist: +1.0 },
      },
      {
        label: 'להישאר בתוך כללי התדריך ולא להגיב',
        pill: 'מחזק באמינות · מוותר על הבמה',
        capital: { credibility: +4, popularity: -3 },
      },
    ],
  },

  {
    id: 'reserve_burden_op_ed',
    act: 2,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'טור דעה על נטל המילואים',
    text: 'עורך המוסף מציע לך טור על חלוקת הנטל. מי שכותב על זה עכשיו מקבל תשומת לב, ומי שמקבל תשומת לב מקבל גם את כל מי שחיכה להזדמנות לענות לו.',

    options: [
      {
        label: 'לכתוב טור מדוד על העלות למעסיקים',
        pill: 'מחזק בצעירים · מחיר קטן במעמד המפלגתי',
        capital: { popularity: +4, party_standing: -2 },
        segments: { young_reservists: +1.4 },
      },
      {
        label: 'לוותר על הטור',
        pill: 'לא קורה כלום · גם לא לטובה',
        capital: { credibility: +1 },
      },
      {
        label: 'לכתוב טור חריף ולתקוף את ההסדרים הקיימים',
        pill: 'הימור · מחזק חזק בצעירים · פוגע באמינות · עלול להצית מולך מערכה שלמה',
        risk: 0.35,
        capital: { popularity: +11, credibility: -4 },
        segments: { young_reservists: +2.4, haredi: -2.0 },
        onFail: {
          capital: { party_standing: -12 },
          flags: ['marked_as_rebel'],
          text: 'הטור התגלגל לכותרת שלא כתבת. בסיעה החליטו שאתה בעיה ולא נכס.',
        },
        unlocks: ['security_committee_seat'],
      },
    ],
  },

  {
    id: 'defence_budget_supplement',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    title: 'תוספת תקציב ביטחון',
    text: 'האוצר מתנגד לתוספת. מערכת הביטחון מבקשת אותה. שניהם מבקשים ממך להצביע בבוקר.',

    options: [
      {
        label: 'לתמוך בתוספת',
        pill: 'מחזק בציוני־דתי ובמעמד המפלגתי · מחיר באמינות ובפריפריה',
        axes: { security: +0.06 },
        capital: { party_standing: +5, credibility: -3 },
        segments: { religious_zionist: +1.1, periphery_general: -0.9 },
      },
      {
        label: 'להתנות את התמיכה בקיצוץ מקביל',
        pill: 'מחזק באמינות · שני הצדדים יזכרו שלא היית איתם',
        capital: { credibility: +5, party_standing: -4 },
      },
    ],
  },

  {
    id: 'security_committee_seat',
    act: 3,
    weight: 1.2,
    camp: 'right',
    placeholder: true,

    requires: {
      capital: { party_standing: { min: 20 } },
      ownParty: false,
    },

    title: 'מקום בוועדת החוץ והביטחון',
    text: 'ראש הסיעה מציע לך מקום בוועדה. הוא מזכיר, כבדרך אגב, שהוועדה מצביעה בחודש הבא בדיוק על הנושא שכתבת עליו.',

    options: [
      {
        label: 'לקבל את המקום ולהתיישר עם הסיעה',
        pill: 'קפיצה במעמד המפלגתי · פוגע באמינות ובצעירים',
        axes: { security: +0.06 },
        capital: { party_standing: +9, credibility: -4 },
        segments: { young_reservists: -1.2 },
      },
      {
        label: 'לקבל, ולהבהיר מראש שתצביע לפי עמדתך',
        pill: 'מחזק באמינות · המעמד המפלגתי כמעט לא זז',
        capital: { credibility: +5, party_standing: -1 },
      },
      {
        label: 'לסרב ולהישאר בלי מחויבות',
        pill: 'שומר על קו עצמאי · מוותר על במה מרכזית',
        capital: { credibility: +4, party_standing: -6 },
        segments: { secular_center: +0.6 },
      },
    ],
  },

  {
    id: 'home_front_drill_failure',
    act: 2,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    title: 'תרגיל העורף נכשל',
    text: 'תרגיל ארצי הסתיים בבלגן. שלוש רשויות בפריפריה לא קיבלו הודעה בכלל.',

    options: [
      {
        label: 'לדרוש ועדת בדיקה',
        pill: 'מחזק בפריפריה · עולה זמן ומשאבים',
        capital: { popularity: +4, resources: -3 },
        segments: { periphery_general: +1.3 },
      },
      {
        label: 'לטפל בזה מול המשרד בלי רעש',
        pill: 'מחזק באמינות · אף אחד לא ידע שעשית משהו',
        capital: { credibility: +3, popularity: -2 },
      },
    ],
  },
];
