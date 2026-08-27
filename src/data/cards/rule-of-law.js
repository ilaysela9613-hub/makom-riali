// שלטון חוק ומערכת המשפט.
//
// One example card. Add the rest below it — the schema is documented in
// CLAUDE.md §3 and demonstrated end to end in security.js.
//
// NEUTRALITY (CLAUDE.md §6.4): keep this deck structural — appointments,
// procedure, committee composition. No card here attributes a criminal act or
// a specific real scandal to a real party or a real person.

export default [
  {
    id: 'judicial_appointments_committee',
    act: 3,
    weight: 1.0,
    camp: 'right',

    requires: {
      capital: { credibility: { min: 25 } },
      ownParty: false,
    },

    title: 'הרכב הוועדה לבחירת שופטים',
    text: 'נפתח דיון על הרכב הוועדה לבחירת שופטים. בסיעה יש עמדה ברורה, ובוועדה שבה אתה יושב יש רוב של קול אחד.',

    options: [
      {
        label: 'לתמוך בהרחבת המשקל של הדרג הנבחר',
        pill: 'מחזק בציוני־דתי ובמעמד המפלגתי · פוגע במרכז החילוני',
        axes: { rule_of_law: +0.10 },
        capital: { party_standing: +6 },
        segments: { religious_zionist: +1.5, secular_center: -1.4 },
      },
      {
        label: 'להתנגד ולשמור על ההרכב הקיים',
        pill: 'מחזק באמינות ובמרכז החילוני · מחיר במעמד המפלגתי',
        axes: { rule_of_law: -0.10 },
        capital: { credibility: +6, party_standing: -6 },
        segments: { secular_center: +1.6 },
      },
      {
        label: 'להציע פשרה על מנגנון הסכמה רחבה',
        pill: 'רווח קטן באמינות · שני הצדדים יזכרו שלא היית איתם',
        capital: { credibility: +3, party_standing: -2 },
        segments: { secular_center: +0.4, religious_zionist: -0.4 },
      },
    ],
  },
];
