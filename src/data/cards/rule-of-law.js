// שלטון חוק ומערכת המשפט.
//
// PLACEHOLDER CONTENT — see the note at the top of security.js, including the
// balance rule: an option is a trade, not a gift.
//
// NEUTRALITY (CLAUDE.md §6.4): this deck stays structural — appointments,
// procedure, committee composition, oversight powers. No card here attributes a
// criminal act or a specific real scandal to a real party or a real person.

export default [
  {
    id: 'judicial_appointments_committee',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    requires: {
      capital: { credibility: { min: 25 } },
      ownParty: false,
    },

    title: 'הרכב הוועדה לבחירת שופטים',
    text: 'נפתח דיון על הרכב הוועדה לבחירת שופטים. בסיעה יש עמדה ברורה, ובוועדה שבה אתה יושב יש רוב של קול אחד.',

    options: [
      {
        label: 'לתמוך בהרחבת המשקל של הדרג הנבחר',
        pill: 'מחזק בציוני־דתי ובמעמד המפלגתי · מחיר באמינות ובמרכז החילוני',
        axes: { rule_of_law: +0.10 },
        capital: { party_standing: +6, credibility: -4 },
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
        label: 'להציע מנגנון הסכמה רחבה',
        pill: 'רווח קטן באמינות · שני הצדדים יזכרו שלא היית איתם',
        capital: { credibility: +3, party_standing: -2 },
        segments: { secular_center: +0.4, religious_zionist: -0.4 },
      },
    ],
  },

  {
    id: 'ombudsman_powers_bill',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'הרחבת סמכויות מבקר המדינה',
    text: 'ההצעה מרחיבה את סמכות הביקורת על משרדי הממשלה. בסיעה מסבירים לך שזה נשמע מצוין עד שאתה בקואליציה.',

    options: [
      {
        label: 'לתמוך בהרחבה',
        pill: 'מחזק באמינות ובמרכז החילוני · מסבך אותך בקואליציה',
        axes: { rule_of_law: -0.08 },
        capital: { credibility: +6, party_standing: -5 },
        segments: { secular_center: +1.1 },
      },
      {
        label: 'להתנגד ולומר שזה משתק את הממשל',
        pill: 'מחזק במעמד המפלגתי · מחיר באמינות · פוגע במרכז החילוני',
        axes: { rule_of_law: +0.06 },
        capital: { party_standing: +5, credibility: -4 },
        segments: { secular_center: -1.0 },
      },
    ],
  },

  {
    id: 'enforcement_oversight_body',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'גוף בקרה על נהלי אכיפה',
    text: 'הצעה להקים בקרה חיצונית על נהלי אכיפה. הדרג המקצועי מתנגד. שתי רשויות בפריפריה דווקא בעד, ומסיבות שונות לגמרי זו מזו.',

    options: [
      {
        label: 'לתמוך בהקמת הגוף',
        pill: 'מחזק בחברה הערבית ובמרכז החילוני · מחיר במעמד המפלגתי',
        axes: { rule_of_law: -0.07 },
        capital: { credibility: +4, party_standing: -3 },
        segments: { arab: +1.4, secular_center: +0.8 },
      },
      {
        label: 'להתנגד ולתמוך בחיזוק הבקרה הפנימית',
        pill: 'מחזק בציוני־דתי · מחיר באמינות · פוגע בחברה הערבית',
        capital: { party_standing: +4, credibility: -3 },
        segments: { arab: -1.2, religious_zionist: +0.7 },
      },
    ],
  },

  {
    id: 'basic_law_amendment_procedure',
    act: 3,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    requires: {
      capital: { credibility: { min: 20 } },
    },

    title: 'שינוי הליך תיקון חוקי היסוד',
    text: 'ההצעה קובעת רוב מיוחד לשינוי חוקי יסוד. שני הצדדים החליפו עמדות בעניין הזה פעמיים בעשור, ושניהם יודעים את זה.',

    options: [
      {
        label: 'לתמוך ברוב המיוחד',
        pill: 'מחזק חזק באמינות · שני הצדדים יראו בך בעיה',
        capital: { credibility: +7, party_standing: -6 },
      },
      {
        label: 'ללכת עם עמדת הסיעה',
        pill: 'מחזק במעמד המפלגתי · מחיר באמינות',
        capital: { party_standing: +5, credibility: -4 },
      },
      {
        label: 'ליזום ניסוח פשרה ולהוביל אותו בעצמך',
        pill: 'הימור · קפיצה גדולה בפופולריות אם זה נתפס · שקיעה אם לא',
        risk: 0.40,
        capital: { popularity: +10, party_standing: -5 },
        segments: { secular_center: +1.2 },
        onFail: {
          capital: { party_standing: -11, popularity: -5 },
          text: 'הפשרה שלך נדחתה משני הכיוונים באותה ישיבה. עכשיו מצטטים אותה בתור מה שלא עובד.',
        },
      },
    ],
  },

  {
    id: 'freedom_of_information_bill',
    act: 2,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    title: 'חוק חופש המידע',
    text: 'הצעה להרחיב את חובת הפרסום של משרדי הממשלה. אף אחד לא מתנגד בפומבי. גם אף אחד לא דוחף אותה.',

    options: [
      {
        label: 'לאמץ את ההצעה ולדחוף אותה בעצמך',
        pill: 'מחזק באמינות · צורך זמן ומשאבים',
        capital: { credibility: +6, resources: -5 },
      },
      {
        label: 'להשאיר אותה למישהו אחר',
        pill: 'לא קורה כלום · הזמן רץ',
        capital: { party_standing: +2, credibility: -2 },
      },
    ],
  },
];
