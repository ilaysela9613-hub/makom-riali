// דת ומדינה.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.

export default [
  {
    id: 'shabbat_transport_vote',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    requires: {
      capital: { party_standing: { min: 20 } },
      ownParty: false,
    },

    title: 'הצבעה על תחבורה ציבורית בשבת',
    text: 'רשות מקומית גדולה אישרה קווי תחבורה בשבת, והנושא עולה להצבעה. בסיעה מבקשים ממך לא להתראיין עד שתתקבל החלטה, ושלושה עיתונאים כבר השאירו לך הודעה.',

    options: [
      {
        label: 'להתנגד ולהישאר בקו הסטטוס קוו',
        certainText: 'החרדים סופרים אותך · המרכז החילוני עוזב',
        stance: { axis: 'religion', direction: +1 },
        axes: { religion: +0.06 },
        capital: { party_standing: +5, popularity: -3 },
        segments: { haredi: +1.6, secular_center: -1.3 },
      },
      {
        label: 'לתמוך בהסדר המקומי ולומר שזו החלטה של הרשות',
        certainText: 'המרכז החילוני עובר אליך · נטישה חדה בחרדים',
        stance: { axis: 'religion', direction: -1 },
        axes: { religion: -0.07 },
        capital: { popularity: +5, party_standing: -4 },
        segments: { secular_center: +1.5, haredi: -2.0 },
      },
      {
        label: 'לומר שזו סוגיה לרשויות המקומיות ולא להצביע',
        certainText: 'לא הרווחת מאף צד',
        capital: { credibility: -3, party_standing: -2 },
        segments: { secular_center: +0.3 },
      },
    ],
  },

  {
    id: 'draft_law_committee',
    act: 3,
    weight: 1.0,
    camp: 'right',
    placeholder: true,

    requires: {
      capital: { party_standing: { min: 18 } },
      ownParty: false,
    },

    title: 'הצבעה בוועדה על חוק הגיוס',
    text: 'ועדת החוץ והביטחון מצביעה מחר. יושב ראש הסיעה מבהיר שהוא מצפה למשמעת קואליציונית, והשאלה הזאת כבר הפילה שתי קואליציות.',

    options: [
      {
        label: 'להצביע בעד, כמו שהתבקשת',
        certainText: 'עלייה במעמד בסיעה · הצעירים עוזבים',
        stance: { axis: 'religion', direction: +1 },
        axes: { religion: +0.08 },
        capital: { party_standing: +6, credibility: -4 },
        segments: { haredi: +1.2, young_reservists: -1.5 },
      },
      {
        label: 'להיעדר מההצבעה',
        certainText: 'מחיר קטן בכל הכיוונים',
        capital: { credibility: -2, party_standing: -3 },
      },
      {
        label: 'להצביע נגד ולהסביר למה',
        stance: { axis: 'religion', direction: -1 },
        branches: [
          {
            chance: 55,
            text: 'הצעירים מאמצים אותך · החרדים מוחקים אותך',
            axes: { religion: -0.07 },
            capital: { popularity: +9, party_standing: -8 },
            segments: { young_reservists: +2.0, haredi: -2.2 },
          },
          {
            chance: 45,
            text: 'הודחת מהוועדה · החרדים מוחקים אותך',
            axes: { religion: -0.07 },
            capital: { party_standing: -14, popularity: -4 },
            segments: { haredi: -2.4 },
            flags: ['removed_from_committee'],
          },
        ],
      },
    ],
  },

  {
    id: 'civil_marriage_bill',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'הצעת חוק נישואים אזרחיים',
    text: 'הצעה פרטית עולה לקריאה טרומית. היא לא תעבור, וכולם יודעים שהיא לא תעבור. ההצבעה עצמה היא כל העניין.',

    options: [
      {
        label: 'לתמוך בהצעה',
        certainText: 'מרכז חילוני ודוברי רוסית עוברים אליך · מחיר בסיעה',
        axes: { religion: -0.08 },
        capital: { popularity: +5, party_standing: -4 },
        segments: { secular_center: +1.3, russian_speaking: +1.1 },
      },
      {
        label: 'להתנגד ולהסביר שזה לא הזמן',
        certainText: 'הקואליציה מרוצה · המרכז החילוני עוזב',
        capital: { party_standing: +5, credibility: -3 },
        segments: { secular_center: -1.2 },
      },
    ],
  },

  {
    id: 'kashrut_supervision_reform',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'רפורמה בפיקוח הכשרות',
    text: 'הרפורמה פותחת את שוק הכשרות לגופים נוספים. בעלי עסקים בעד. הממסד הרבני נגד, ובאופן חריג גם חלק מהמפקחים עצמם.',

    options: [
      {
        label: 'לתמוך ברפורמה',
        certainText: 'המרכז החילוני עובר אליך · החרדים עוזבים',
        axes: { religion: -0.06 },
        capital: { popularity: +4, party_standing: -3 },
        segments: { secular_center: +1.2, haredi: -1.4 },
      },
      {
        label: 'להתנגד ולהגן על מערך הפיקוח הקיים',
        certainText: 'החרדים עוברים אליך · המרכז החילוני עוזב',
        capital: { party_standing: +4, popularity: -3 },
        segments: { haredi: +1.3, secular_center: -1.0 },
      },
    ],
  },

  {
    id: 'religious_council_appointment',
    act: 2,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    title: 'מינוי במועצה הדתית',
    text: 'מבקשים ממך לתמוך במינוי במועצה הדתית של עיר בינונית. אתה לא מכיר את המועמד. אתה כן מכיר היטב את מי שמבקש.',

    options: [
      {
        label: 'לתמוך במינוי',
        integrity: 'dirty',
        branches: [
          {
            chance: 75,
            text: 'החוב נפרע בשקט — עלייה במעמד בסיעה',
            capital: { party_standing: +7 },
          },
          {
            chance: 25,
            text: 'המינוי הגיע לעיתונות עם השם שלך עליו',
            capital: { party_standing: +3, popularity: -6 },
            segments: { secular_center: -1.1 },
          },
        ],
      },
      {
        label: 'לומר שאתה לא מתערב במינויים מקומיים',
        certainText: 'שמרת על עצמך · מישהו יזכור שסירבת',
        capital: { credibility: +4, party_standing: -3 },
      },
    ],
  },
];
