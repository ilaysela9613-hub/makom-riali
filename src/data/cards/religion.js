// דת ומדינה.
//
// One example card. Add the rest below it — the schema is documented in
// CLAUDE.md §3 and demonstrated end to end in security.js.

export default [
  {
    id: 'shabbat_transport_vote',
    act: 3,
    weight: 1.0,
    camp: 'right',

    requires: {
      capital: { party_standing: { min: 20 } },
      ownParty: false,
    },

    title: 'הצבעה על תחבורה ציבורית בשבת',
    text: 'רשות מקומית גדולה אישרה קווי תחבורה בשבת, והנושא עולה להצבעה. בסיעה מבקשים ממך לא להתראיין עד שתתקבל החלטה, ושלושה עיתונאים כבר השאירו לך הודעה.',

    options: [
      {
        label: 'לתמוך בהסדר המקומי ולומר שזו החלטה של הרשות',
        pill: 'מחזק במרכז החילוני · פוגע קשות בחרדים',
        axes: { religion: -0.07 },
        capital: { popularity: +5 },
        segments: { secular_center: +1.5, haredi: -2.0 },
      },
      {
        label: 'להתנגד ולהישאר בקו הסטטוס קוו',
        pill: 'מחזק בחרדים ובמסורתיים · פוגע במרכז החילוני',
        axes: { religion: +0.06 },
        capital: { party_standing: +5 },
        segments: { haredi: +1.6, secular_center: -1.3 },
      },
      {
        label: 'לומר שזו סוגיה לרשויות המקומיות ולא להצביע',
        pill: 'מחיר נמוך בכל הכיוונים · לא מרוויח מאף צד',
        capital: { credibility: -3, party_standing: -2 },
        segments: { secular_center: +0.3 },
      },
    ],
  },
];
