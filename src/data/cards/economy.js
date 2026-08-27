// כלכלה ותקציב.
//
// One example card. Add the rest below it — the schema is documented in
// CLAUDE.md §3 and demonstrated end to end in security.js.

export default [
  {
    id: 'budget_committee_cuts',
    act: 3,
    weight: 1.0,
    camp: 'left',

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
        pill: 'מחזק במעמד המפלגתי · פוגע בפריפריה ובמסורתיים',
        axes: { economy: +0.07 },
        capital: { party_standing: +7, credibility: -3 },
        segments: { periphery_general: -1.8, traditional_mizrahi: -0.9 },
      },
      {
        label: 'לנהל מו״מ שקט על שני הסעיפים ולתמוך בשאר',
        pill: 'רווח קטן בשני הכיוונים · לא מייצר כותרת',
        capital: { credibility: +4, party_standing: +1 },
        segments: { periphery_general: +0.6 },
      },
    ],
  },
];
