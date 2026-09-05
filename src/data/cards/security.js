// ביטחון.
//
// PLACEHOLDER CONTENT — every card here carries `placeholder: true`.
// `node tools/validate.js` reports how many are left.
//
// SCHEMA: an option is EITHER certain (`certainText`, a flat statement of what
// happens) OR a gamble (`branches`: exactly two, chances summing to 100, each
// with its own outcome text). Never both. There is no `pill` — the player reads
// the situation, not a summary of where it pushes.
//
// Outcome text names things the player can SEE: voters, mandates, standing in
// the faction, popularity, money. It never names credibility or the ideology
// axes, because those are hidden (M3).
//
// BALANCE RULE: an option is a TRADE, not a gift.

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
        stance: { axis: 'security', direction: +1 },
        branches: [
          {
            chance: 60,
            text: 'נשארת בתוך הגבול — מצביעים בציוני־דתי עוברים אליך',
            axes: { security: +0.05 },
            capital: { popularity: +6 },
            segments: { religious_zionist: +1.2 },
          },
          {
            chance: 40,
            text: 'חרגת מהתדריך — נזק כבד למעמד שלך בסיעה',
            capital: { party_standing: -9, popularity: +2 },
          },
        ],
      },
      {
        label: 'להישאר בתוך כללי התדריך ולא להגיב',
        abstainText: 'שום דבר לא זז. גם לא לטובה.',
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
        branches: [
          {
            chance: 70,
            text: 'צעירים ומשרתי מילואים עוברים אליך · מחיר קטן בסיעה',
            capital: { popularity: +4, party_standing: -2 },
            segments: { young_reservists: +1.4 },
          },
          {
            chance: 30,
            text: '',
            capital: { party_standing: -2 },
          },
        ],
      },
      {
        label: 'לוותר על הטור',
        abstainText: 'ללא השפעה',
        capital: { credibility: +1 },
      },
      {
        label: 'לכתוב טור חריף ולתקוף את ההסדרים הקיימים',
        stance: { axis: 'religion', direction: -1 },
        unlocks: ['security_committee_seat'],
        branches: [
          {
            chance: 65,
            text: 'הטור תפס — גל תמיכה בצעירים, נטישה בחרדים',
            capital: { popularity: +11 },
            segments: { young_reservists: +2.4, haredi: -2.0 },
          },
          {
            chance: 35,
            text: 'הכותרת יצאה משליטה — הסיעה מסמנת אותך כבעיה',
            capital: { party_standing: -12, popularity: +3 },
            flags: ['marked_as_rebel'],
          },
        ],
      },
    ],
  },

  {
    id: 'defence_budget_supplement',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    title: 'תוספת למערכת הביטחון',
    text: 'האוצר מתנגד לתוספת. מערכת הביטחון מבקשת אותה. שניהם מבקשים ממך להצביע בבוקר.',

    options: [
      {
        label: 'לתמוך בתוספת',
        branches: [
          {
            chance: 75,
            text: 'ציוני־דתי עובר אליך · הפריפריה זוכרת מה לא קיבלה',
            axes: { security: +0.06 },
            capital: { party_standing: +5, credibility: -3 },
            segments: { religious_zionist: +1.1, periphery_general: -0.9 },
          },
          {
            chance: 25,
            text: '',
            axes: { security: +0.06 },
            capital: { credibility: -3 },
            segments: { periphery_general: -0.9 },
          },
        ],
      },
      {
        label: 'להתנות את התמיכה בקיצוץ מקביל',
        branches: [
          {
            chance: 55,
            text: 'אף צד לא מקבל מה שרצה · מחיר במעמד בסיעה',
            capital: { credibility: +5, party_standing: -4 },
          },
          {
            chance: 45,
            text: 'שני הצדדים עקפו אותך',
            capital: { party_standing: -4 },
          },
        ],
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
        branches: [
          {
            chance: 80,
            text: 'קפיצה במעמד בסיעה · הצעירים מוחקים אותך',
            axes: { security: +0.06 },
            capital: { party_standing: +9, credibility: -4 },
            segments: { young_reservists: -1.2 },
          },
          {
            chance: 20,
            text: '',
            axes: { security: +0.06 },
            capital: { credibility: -4 },
            segments: { young_reservists: -1.2 },
          },
        ],
      },
      {
        label: 'לקבל, ולהבהיר מראש שתצביע לפי עמדתך',
        branches: [
          {
            chance: 55,
            text: 'קיבלו את התנאי — נכנסת לוועדה בלי לשלם',
            capital: { party_standing: +6, popularity: +3 },
          },
          {
            chance: 45,
            text: 'ההצעה נמשכה — ומישהו אחר קיבל את המקום',
            capital: { party_standing: -7 },
          },
        ],
      },
      {
        label: 'לסרב ולהישאר בלי מחויבות',
        abstainText: 'קו עצמאי נשמר · ויתרת על במה מרכזית',
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
        branches: [
          {
            chance: 60,
            text: 'הפריפריה זוקפת לך את זה · מסבך אותך מול הדרג המקצועי',
            capital: { popularity: +4, party_standing: -3 },
            segments: { periphery_general: +1.3 },
          },
          {
            chance: 40,
            text: 'הוועדה נקברה בוועדת משנה',
            capital: { party_standing: -3 },
          },
        ],
      },
      {
        label: 'לטפל בזה מול המשרד בלי רעש',
        branches: [
          {
            chance: 70,
            text: 'הבעיה נפתרה · אף אחד לא יודע שזה אתה',
            capital: { credibility: +3, popularity: -2 },
          },
          {
            chance: 30,
            text: '',
            capital: { popularity: -2 },
          },
        ],
      },
    ],
  },
];
