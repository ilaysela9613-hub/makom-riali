// כלכלה ותקציב.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.

export default [
  {
    id: 'budget_committee_cuts',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    requires: {
      capital: { party_standing: { min: 15 } },
    },

    title: 'קיצוץ רוחבי בוועדת הכספים',
    text: 'האוצר מציג קיצוץ רוחבי. שני סעיפים בו נוגעים ישירות ליישובים שהצבעת עליהם בכל ראיון מאז שהתחלת, ואתה יושב בוועדה שמאשרת אותו.',

    options: [
      {
        label: 'להתנגד בפומבי ולדרוש לפצל את ההצבעה',
        stance: { axis: 'economy', direction: -1 },
        branches: [
          {
            chance: 60,
            text: 'ההצבעה פוצלה — הפריפריה זוקפת לך את זה',
            axes: { economy: -0.08 },
            capital: { popularity: +6, party_standing: -6 },
            segments: { periphery_general: +2.0 },
          },
          {
            chance: 40,
            text: 'הקיצוץ עבר כמו שהוא, ואתה נשארת עם החשבון',
            axes: { economy: -0.08 },
            capital: { party_standing: -11, popularity: +2 },
            segments: { periphery_general: +0.5 },
          },
        ],
      },
      {
        label: 'לתמוך בקיצוץ ולהסביר שהוא הכרחי',
        certainText: 'עלייה במעמד בסיעה · הפריפריה והמסורתיים עוזבים',
        stance: { axis: 'economy', direction: +1 },
        axes: { economy: +0.07 },
        capital: { party_standing: +7, credibility: -5 },
        segments: { periphery_general: -1.8, traditional_mizrahi: -0.9 },
      },
      {
        label: 'לנהל מו״מ שקט על שני הסעיפים ולתמוך בשאר',
        certainText: 'שני הסעיפים ניצלו · אין כותרת ואין רווח ציבורי',
        capital: { credibility: +4, popularity: -3 },
        segments: { periphery_general: +0.6 },
      },
    ],
  },

  {
    id: 'housing_deregulation_bill',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    title: 'חוק להסרת חסמים בתכנון',
    text: 'ההצעה מקצרת הליכי תכנון בשנתיים. היזמים בעד. רשויות מקומיות וארגוני סביבה נגד, וגם שני ראשי ערים מהמפלגה שלך.',

    options: [
      {
        label: 'לתמוך בהצעה כפי שהיא',
        certainText: 'צעירים שממתינים לדיור עוברים אליך · הרשויות זוכרות',
        axes: { economy: +0.08 },
        capital: { popularity: +5, party_standing: -3 },
        segments: { young_reservists: +1.3 },
      },
      {
        label: 'לתמוך רק אחרי שיוסיפו סעיף התייעצות',
        branches: [
          {
            chance: 50,
            text: 'הסעיף נוסף — יצאת כמי שהשיג משהו',
            capital: { credibility: +5, popularity: +4 },
            segments: { periphery_general: +0.8 },
          },
          {
            chance: 50,
            text: 'עיכבת את החוק לחינם · הסיעה זוקפת לך את זה',
            capital: { party_standing: -7 },
          },
        ],
      },
      {
        label: 'להתנגד ולעמוד עם הרשויות',
        certainText: 'הפריפריה עוברת אליך · מחיר במעמד בסיעה',
        axes: { economy: -0.06 },
        capital: { party_standing: -6 },
        segments: { periphery_general: +1.4 },
      },
    ],
  },

  {
    id: 'minimum_wage_committee',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'העלאת שכר המינימום',
    text: 'ההסתדרות והמעסיקים סגרו מתווה. בוועדה יש מי שרוצה להעלות אותו ומי שרוצה להוריד, ושניהם מדברים בשם אותם עובדים.',

    options: [
      {
        label: 'לתמוך בהעלאה מעבר למתווה',
        certainText: 'הפריפריה עוברת אליך · המגזר העסקי נסגר בפניך',
        axes: { economy: -0.08 },
        capital: { popularity: +4, party_standing: -3 },
        segments: { periphery_general: +1.5 },
      },
      {
        label: 'לאשר את המתווה כפי שסוכם',
        certainText: 'ללא השפעה ציבורית',
        capital: { credibility: +4, popularity: -3 },
      },
    ],
  },

  {
    id: 'tax_bracket_reform',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    title: 'רפורמה במדרגות המס',
    text: 'הרפורמה מורידה מס למעמד הביניים ומקצצת בסעיף רווחה כדי לממן את זה. שני הנתונים נכונים, ושניהם יופיעו בכותרת.',

    options: [
      {
        label: 'לתמוך ברפורמה',
        certainText: 'המרכז החילוני עובר אליך · הפריפריה עוזבת',
        stance: { axis: 'economy', direction: +1 },
        axes: { economy: +0.09 },
        capital: { popularity: +5, party_standing: -3 },
        segments: { secular_center: +1.2, periphery_general: -1.3 },
      },
      {
        label: 'להתנות תמיכה בשמירת סעיף הרווחה',
        stance: { axis: 'economy', direction: -1 },
        branches: [
          {
            chance: 45,
            text: 'הסעיף נשמר — הפריפריה זוקפת לך את זה',
            capital: { popularity: +5, party_standing: -2 },
            segments: { periphery_general: +1.6 },
          },
          {
            chance: 55,
            text: 'המהלך נתקע וכולם מאשימים אותך',
            capital: { party_standing: -8, popularity: -3 },
          },
        ],
      },
    ],
  },

  {
    id: 'periphery_development_grant',
    act: 2,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    title: 'מענק פיתוח לרשויות',
    text: 'יש מענק אחד. יש שתים־עשרה רשויות שביקשו אותו. אתה יכול לדחוף אחת.',

    options: [
      {
        label: 'לדחוף את הרשות שבה בנית את הבסיס שלך',
        integrity: 'dirty',
        certainText: 'הפריפריה זוקפת לך את זה · עולה כסף וטובות',
        capital: { resources: -5, credibility: -3 },
        segments: { periphery_general: +1.6 },
      },
      {
        label: 'לדרוש שהמענק יחולק לפי קריטריון קבוע',
        certainText: 'יצאת נקי · לא הרווחת אף חבר במפלגה',
        capital: { credibility: +6, party_standing: -5 },
      },
    ],
  },
];
