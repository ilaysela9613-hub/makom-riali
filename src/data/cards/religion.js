// דת ומדינה.
//
// PLACEHOLDER CONTENT — see the note at the top of security.js, including the
// balance rule: an option is a trade, not a gift.

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
        pill: 'מחזק בחרדים ובמעמד המפלגתי · פוגע בפופולריות ובמרכז החילוני',
        axes: { religion: +0.06 },
        capital: { party_standing: +5, popularity: -3 },
        segments: { haredi: +1.6, secular_center: -1.3 },
      },
      {
        label: 'לתמוך בהסדר המקומי ולומר שזו החלטה של הרשות',
        pill: 'מחזק במרכז החילוני · מחיר במעמד המפלגתי · פוגע קשות בחרדים',
        axes: { religion: -0.07 },
        capital: { popularity: +5, party_standing: -4 },
        segments: { secular_center: +1.5, haredi: -2.0 },
      },
      {
        label: 'לומר שזו סוגיה לרשויות המקומיות ולא להצביע',
        pill: 'מחיר נמוך בכל הכיוונים · לא מרוויח מאף צד',
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
        pill: 'מחזק במעמד המפלגתי · מחיר באמינות · פוגע בצעירים',
        axes: { religion: +0.08 },
        capital: { party_standing: +6, credibility: -4 },
        segments: { haredi: +1.2, young_reservists: -1.5 },
      },
      {
        label: 'להיעדר מההצבעה',
        pill: 'מחיר נמוך בכל הכיוונים',
        capital: { credibility: -2, party_standing: -3 },
      },
      {
        label: 'להצביע נגד ולהסביר למה',
        pill: 'מחזק בצעירים · מחיר כבד במעמד המפלגתי',
        axes: { religion: -0.07 },
        capital: { popularity: +7, party_standing: -10 },
        segments: { young_reservists: +2.0, haredi: -2.2 },
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
        pill: 'מחזק במרכז החילוני ובדוברי רוסית · מחיר במעמד המפלגתי',
        axes: { religion: -0.08 },
        capital: { popularity: +5, party_standing: -4 },
        segments: { secular_center: +1.3, russian_speaking: +1.1 },
      },
      {
        label: 'להתנגד ולהסביר שזה לא הזמן',
        pill: 'מחזק במעמד המפלגתי · מחיר באמינות · פוגע במרכז החילוני',
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
        pill: 'מחזק במרכז החילוני · מחיר במעמד המפלגתי · פוגע בחרדים',
        axes: { religion: -0.06 },
        capital: { popularity: +4, party_standing: -3 },
        segments: { secular_center: +1.2, haredi: -1.4 },
      },
      {
        label: 'להתנגד ולהגן על מערך הפיקוח הקיים',
        pill: 'מחזק בחרדים · מחיר בפופולריות · פוגע במרכז החילוני',
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
        pill: 'חוב שנפרע · מחיר באמינות',
        capital: { party_standing: +5, credibility: -3 },
      },
      {
        label: 'לומר שאתה לא מתערב במינויים מקומיים',
        pill: 'שומר על אמינות · מישהו יזכור שסירבת',
        capital: { credibility: +4, party_standing: -3 },
      },
    ],
  },
];
