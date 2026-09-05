// שלטון חוק ומערכת המשפט.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.
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
        branches: [
          {
            chance: 70,
            text: 'ציוני־דתי עובר אליך · המרכז החילוני עוזב',
            axes: { rule_of_law: +0.1 },
            capital: { party_standing: +6, credibility: -4 },
            segments: { religious_zionist: +1.5, secular_center: -1.4 },
          },
          {
            chance: 30,
            text: '',
            axes: { rule_of_law: +0.1 },
            capital: { credibility: -4 },
            segments: { secular_center: -1.4 },
          },
        ],
      },
      {
        label: 'להתנגד ולשמור על ההרכב הקיים',
        branches: [
          {
            chance: 70,
            text: 'המרכז החילוני עובר אליך · מחיר במעמד בסיעה',
            axes: { rule_of_law: -0.1 },
            capital: { credibility: +6, party_standing: -6 },
            segments: { secular_center: +1.6 },
          },
          {
            chance: 30,
            text: '',
            axes: { rule_of_law: -0.1 },
            capital: { party_standing: -6 },
          },
        ],
      },
      {
        label: 'להציע מנגנון הסכמה רחבה',
        branches: [
          {
            chance: 35,
            text: 'הפשרה התקבלה — שני הצדדים חייבים לך',
            capital: { popularity: +7, party_standing: +4 },
            segments: { secular_center: +1.0 },
          },
          {
            chance: 65,
            text: 'שני הצדדים דחו אותה, ושניהם זוכרים שניסית',
            capital: { party_standing: -6, popularity: -2 },
            segments: { secular_center: +0.3, religious_zionist: -0.5 },
          },
        ],
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
        branches: [
          {
            chance: 65,
            text: 'המרכז החילוני עובר אליך · הקואליציה תזכור',
            axes: { rule_of_law: -0.08 },
            capital: { credibility: +6, party_standing: -5 },
            segments: { secular_center: +1.1 },
          },
          {
            chance: 35,
            text: '',
            axes: { rule_of_law: -0.08 },
            capital: { party_standing: -5 },
          },
        ],
      },
      {
        label: 'להתנגד ולומר שזה משתק את הממשל',
        branches: [
          {
            chance: 70,
            text: 'עלייה במעמד בסיעה · המרכז החילוני עוזב',
            axes: { rule_of_law: +0.06 },
            capital: { party_standing: +5, credibility: -4 },
            segments: { secular_center: -1 },
          },
          {
            chance: 30,
            text: '',
            axes: { rule_of_law: +0.06 },
            capital: { credibility: -4 },
            segments: { secular_center: -1 },
          },
        ],
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
        branches: [
          {
            chance: 60,
            text: 'החברה הערבית והמרכז החילוני עוברים אליך · מחיר בסיעה',
            axes: { rule_of_law: -0.07 },
            capital: { credibility: +4, party_standing: -3 },
            segments: { arab: +1.4, secular_center: +0.8 },
          },
          {
            chance: 40,
            text: '',
            axes: { rule_of_law: -0.07 },
            capital: { party_standing: -3 },
          },
        ],
      },
      {
        label: 'להתנגד ולתמוך בחיזוק הבקרה הפנימית',
        branches: [
          {
            chance: 70,
            text: 'ציוני־דתי עובר אליך · החברה הערבית עוזבת',
            capital: { party_standing: +4, credibility: -3 },
            segments: { arab: -1.2, religious_zionist: +0.7 },
          },
          {
            chance: 30,
            text: '',
            capital: { credibility: -3 },
            segments: { arab: -1.2 },
          },
        ],
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
        branches: [
          {
            chance: 60,
            text: 'שני הצדדים רואים בך בעיה',
            capital: { credibility: +7, party_standing: -6 },
          },
          {
            chance: 40,
            text: 'שני הצדדים הצביעו נגד',
            capital: { party_standing: -6 },
          },
        ],
      },
      {
        label: 'ללכת עם עמדת הסיעה',
        branches: [
          {
            chance: 80,
            text: 'עלייה במעמד בסיעה · שום דבר אחר לא זז',
            capital: { party_standing: +5, credibility: -4 },
          },
          {
            chance: 20,
            text: '',
            capital: { credibility: -4 },
          },
        ],
      },
      {
        label: 'ליזום ניסוח פשרה ולהוביל אותו בעצמך',
        branches: [
          {
            chance: 40,
            text: 'הניסוח שלך עבר — קפיצה גדולה בפופולריות',
            capital: { popularity: +12, party_standing: +3 },
            segments: { secular_center: +1.2 },
          },
          {
            chance: 60,
            text: 'נדחה משני הכיוונים באותה ישיבה',
            capital: { party_standing: -11, popularity: -5 },
          },
        ],
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
        branches: [
          {
            chance: 55,
            text: 'עולה לך זמן · אף אחד לא ישים לב עד שיהיה מאוחר',
            capital: { credibility: +6, party_standing: -5 },
          },
          {
            chance: 45,
            text: 'ההצעה נתקעה בוועדה',
            capital: { party_standing: -5 },
          },
        ],
      },
      {
        label: 'להשאיר אותה למישהו אחר',
        abstainText: 'ללא השפעה',
        capital: { party_standing: +2, credibility: -2 },
      },
    ],
  },
];
