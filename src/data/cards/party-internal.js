// פוליטיקה פנים־מפלגתית — מרכז המפלגה, פריימריז, משמעת סיעתית.
//
// PLACEHOLDER CONTENT — see the note at the top of security.js.
//
// This is the deck where the satire lives: the machine, not a camp
// (SPEC §11.4). Everything here should be absurd to everyone.

export default [
  {
    id: 'party_conference_slot_deal',
    act: 2,
    weight: 1.2,
    camp: 'neutral',
    placeholder: true,

    title: 'ועידת המפלגה מתכנסת',
    text: 'שני עסקנים שאתה לא מכיר מציעים לך שלוש מאות מתפקדים בוועידה. הם לא מבקשים כלום עכשיו. הם מדגישים במיוחד שהם לא מבקשים כלום עכשיו.',

    options: [
      {
        label: 'לקחת את המתפקדים ולהודות יפה',
        pill: 'קפיצה במעמד המפלגתי · מחיר כבד באמינות',
        capital: { party_standing: +10, credibility: -8 },
        unlocks: ['list_reserved_slot_demand'],
      },
      {
        label: 'לסרב בנימוס ולבנות רשימה משלך',
        pill: 'מחזק באמינות · המעמד המפלגתי נבנה לאט ובכסף',
        capital: { credibility: +6, party_standing: -3, resources: -4 },
      },
      {
        label: 'לקחת, ולספר על זה בעצמך לפני שמישהו אחר יספר',
        pill: 'הימור · מרוויח בשני הכיוונים אם זה עובר · מפולת אם לא',
        risk: 0.40,
        capital: { party_standing: +7, popularity: +3 },
        onFail: {
          capital: { credibility: -12 },
          flags: ['known_as_dealmaker'],
          text: 'הסיפור התגלגל אחרת ממה שתכננת. עכשיו מצטטים אותך בתור מי שסיפר, לא בתור מי שסירב.',
        },
        unlocks: ['list_reserved_slot_demand'],
      },
    ],
  },

  {
    id: 'primaries_membership_drive',
    act: 2,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    title: 'קמפיין הרשמת מתפקדים',
    text: 'שלושה שבועות להרשמה. כל מתפקד עולה כסף וכל מתפקד שווה קול, וההפרש בין השניים הוא כל המקצוע.',

    options: [
      {
        label: 'להשקיע את כל מה שיש לך',
        pill: 'קפיצה במעמד המפלגתי · מרוקן את הקופה',
        capital: { party_standing: +9, resources: -14 },
      },
      {
        label: 'להשקיע במידה ולשמור מזומן לקמפיין',
        pill: 'עלייה קטנה · שומר על המשאבים',
        capital: { party_standing: +3, resources: -4 },
      },
    ],
  },

  {
    id: 'faction_discipline_vote',
    act: 3,
    weight: 1.0,
    camp: 'neutral',
    placeholder: true,

    requires: {
      capital: { party_standing: { min: 15 } },
      ownParty: false,
    },

    title: 'הצבעת משמעת סיעתית',
    text: 'הצבעה שאתה לא מסכים איתה, ומשמעת סיעתית מלאה. שני חברי סיעה כבר הודיעו בשקט שהם לא מגיעים לאולם.',

    options: [
      {
        label: 'להצביע עם הסיעה',
        pill: 'מחזק במעמד המפלגתי · מחיר באמינות',
        capital: { party_standing: +6, credibility: -5 },
      },
      {
        label: 'לא להגיע לאולם',
        pill: 'מחיר קטן משני הצדדים · אף אחד לא מרוצה',
        capital: { party_standing: -3, credibility: -1 },
      },
    ],
  },

  {
    id: 'list_reserved_slot_demand',
    act: 3,
    weight: 1.2,
    camp: 'right',
    placeholder: true,

    title: 'דרישה למקום שמור',
    text: 'סיעת משנה בתוך המפלגה דורשת מקום שמור ברשימה. המקום שהם מבקשים הוא בערך המקום שלך.',

    options: [
      {
        label: 'להסכים ולהתמקח על מקום אחר',
        pill: 'שומר על שקט פנימי · מוריד אותך ברשימה',
        capital: { party_standing: +4, popularity: -3 },
      },
      {
        label: 'להתעמת ולדרוש הכרעה של היו״ר',
        pill: 'מחזק באמינות · מחיר מיידי במעמד המפלגתי',
        capital: { credibility: +4, party_standing: -5 },
        segments: { religious_zionist: -0.8 },
      },
    ],
  },

  {
    id: 'coalition_partner_ultimatum',
    act: 3,
    weight: 1.0,
    camp: 'left',
    placeholder: true,

    title: 'אולטימטום מהשותף הקואליציוני',
    text: 'שותפה בקואליציה מאיימת לפרוש אם סעיף מסוים לא יוסר מהתקציב. הסעיף הזה הוא בדיוק מה שהבטחת לבוחרים שלך.',

    options: [
      {
        label: 'להסיר את הסעיף ולשמור על הקואליציה',
        pill: 'שומר על היציבות · מחיר כבד באמינות',
        capital: { credibility: -8, party_standing: +5 },
      },
      {
        label: 'לעמוד על הסעיף',
        pill: 'מחזק באמינות ובפריפריה · מסכן את הקואליציה',
        capital: { credibility: +7, party_standing: -6 },
        segments: { periphery_general: +1.0 },
      },
    ],
  },
];
