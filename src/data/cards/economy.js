// כלכלה ותקציב.
//
// PLACEHOLDER CONTENT — see the note at the top of security.js, including the
// balance rule: an option is a trade, not a gift.

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
        pill: 'מחזק בפריפריה · מחיר כבד במעמד המפלגתי',
        axes: { economy: -0.08 },
        capital: { popularity: +6, party_standing: -8 },
        segments: { periphery_general: +2.0 },
      },
      {
        label: 'לתמוך בקיצוץ ולהסביר שהוא הכרחי',
        pill: 'מחזק במעמד המפלגתי · מחיר באמינות · פוגע בפריפריה ובמסורתיים',
        axes: { economy: +0.07 },
        capital: { party_standing: +7, credibility: -5 },
        segments: { periphery_general: -1.8, traditional_mizrahi: -0.9 },
      },
      {
        label: 'לנהל מו״מ שקט על שני הסעיפים ולתמוך בשאר',
        pill: 'מחזק באמינות · לא מייצר כותרת ולא מזיז את הפופולריות',
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
        pill: 'מחזק בצעירים שממתינים לדיור · מקלקל לך מול הרשויות',
        axes: { economy: +0.08 },
        capital: { popularity: +5, party_standing: -3 },
        segments: { young_reservists: +1.3 },
      },
      {
        label: 'לתמוך רק אחרי שיוסיפו סעיף התייעצות',
        pill: 'מחזק באמינות · מאט את כל המהלך ומעצבן את הסיעה',
        capital: { credibility: +5, party_standing: -4 },
      },
      {
        label: 'להתנגד ולעמוד עם הרשויות',
        pill: 'מחזק בפריפריה · מחיר במעמד המפלגתי',
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
        pill: 'מחזק בפריפריה · מקלקל לך מול המגזר העסקי',
        axes: { economy: -0.08 },
        capital: { popularity: +4, party_standing: -3 },
        segments: { periphery_general: +1.5 },
      },
      {
        label: 'לאשר את המתווה כפי שסוכם',
        pill: 'מחזק באמינות · לא מרגש אף אחד',
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
        pill: 'מחזק במרכז החילוני · מחיר במעמד המפלגתי · פוגע בפריפריה',
        axes: { economy: +0.09 },
        capital: { popularity: +5, party_standing: -3 },
        segments: { secular_center: +1.2, periphery_general: -1.3 },
      },
      {
        label: 'להתנות תמיכה בשמירת סעיף הרווחה',
        pill: 'מחזק בפריפריה ובאמינות · המהלך ייתקע ומישהו יאשים אותך',
        capital: { credibility: +4, party_standing: -3 },
        segments: { periphery_general: +0.9 },
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
        pill: 'מחזק חזק בפריפריה · מחיר באמינות ובמשאבים',
        capital: { resources: -5, credibility: -3 },
        segments: { periphery_general: +1.6 },
      },
      {
        label: 'לדרוש שהמענק יחולק לפי קריטריון קבוע',
        pill: 'מחזק באמינות · לא מייצר לך אף חבר במפלגה',
        capital: { credibility: +6, party_standing: -5 },
      },
    ],
  },
];
