// פוליטיקה פנים־מפלגתית — מרכז המפלגה, פריימריז, משמעת סיעתית.
//
// PLACEHOLDER CONTENT — see the schema note at the top of security.js.
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
        unlocks: ['list_reserved_slot_demand'],
        branches: [
          {
            chance: 75,
            text: 'קפיצה גדולה במעמד בסיעה · החוב נרשם',
            capital: { party_standing: +10, credibility: -8 },
          },
          {
            chance: 25,
            text: 'שליש מהטפסים נפסלו',
            capital: { credibility: -8 },
          },
        ],
      },
      {
        label: 'לסרב בנימוס ולבנות רשימה משלך',
        branches: [
          {
            chance: 60,
            text: 'בנייה איטית · אף אחד לא מחזיק בך',
            capital: { credibility: +6, party_standing: -7 },
          },
          {
            chance: 40,
            text: '',
            capital: { party_standing: -7 },
          },
        ],
      },
      {
        label: 'לקחת, ולספר על זה בעצמך לפני שמישהו אחר יספר',
        unlocks: ['list_reserved_slot_demand'],
        branches: [
          {
            chance: 55,
            text: 'הכנות עבדה — מעמד בסיעה ופופולריות עולים יחד',
            capital: { party_standing: +8, popularity: +6 },
          },
          {
            chance: 45,
            text: 'מצטטים אותך כמי שסיפר, לא כמי שסירב',
            capital: { party_standing: +3, popularity: -7 },
            segments: { secular_center: -1.2 },
            flags: ['known_as_dealmaker'],
          },
        ],
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
    text: 'שלושה שבועות להרשמה. כל מתפקד דורש טלפון אישי וכל מתפקד שווה קול, וההפרש בין השניים הוא כל המקצוע.',

    options: [
      {
        label: 'לרתום כל מי שחייב לך טובה',
        branches: [
          {
            chance: 60,
            text: 'הקמפיין הביא — קפיצה גדולה במעמד בסיעה',
            capital: { party_standing: +12, credibility: -10 },
          },
          {
            chance: 40,
            text: 'רוב הטפסים לא הוגשו בזמן',
            capital: { party_standing: +2, credibility: -10 },
          },
        ],
      },
      {
        label: 'לרתום רק את מי שבטוח מגיע',
        branches: [
          {
            chance: 75,
            text: 'עלייה קטנה במעמד · בלי לשרוף אף אחד',
            capital: { party_standing: +3, credibility: -3 },
          },
          {
            chance: 25,
            text: '',
            capital: { credibility: -3 },
          },
        ],
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
        branches: [
          {
            chance: 80,
            text: 'עלייה במעמד בסיעה',
            capital: { party_standing: +6, credibility: -5 },
          },
          {
            chance: 20,
            text: '',
            capital: { credibility: -5 },
          },
        ],
      },
      {
        label: 'לא להגיע לאולם',
        abstainText: 'אף אחד לא מרוצה',
        capital: { party_standing: -3, credibility: -1 },
      },
      {
        label: 'להצביע נגד ולהודיע על כך מראש',
        branches: [
          {
            chance: 80,
            text: 'יצאת כמי שיש לו עמוד שדרה — עלייה בפופולריות',
            capital: { popularity: +9, party_standing: -7 },
            segments: { secular_center: +1.1 },
          },
          {
            chance: 20,
            text: 'הוצאת מהסיעה — הריצה שלך נגמרת כאן',
            endsRun: true,
            capital: { party_standing: -20 },
            flags: ['expelled_from_faction'],
          },
        ],
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
        branches: [
          {
            chance: 65,
            text: 'שקט פנימי · ירדת ברשימה',
            capital: { party_standing: +4, popularity: -3 },
          },
          {
            chance: 35,
            text: 'לקחו את המקום ולא נתנו אחר',
            capital: { popularity: -3 },
          },
        ],
      },
      {
        label: 'להתעמת ולדרוש הכרעה של היו״ר',
        branches: [
          {
            chance: 45,
            text: 'היו״ר פסק לטובתך — המקום שלך מובטח',
            capital: { party_standing: +8, popularity: +3 },
          },
          {
            chance: 55,
            text: 'היו״ר פסק נגדך, וכולם ראו',
            capital: { party_standing: -9 },
            segments: { religious_zionist: -0.8 },
          },
        ],
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
    text: 'שותפה בקואליציה מאיימת לפרוש אם סעיף מסוים לא יוסר מהצעת החוק. הסעיף הזה הוא בדיוק מה שהבטחת לבוחרים שלך.',

    options: [
      {
        label: 'להסיר את הסעיף ולשמור על הקואליציה',
        branches: [
          {
            chance: 70,
            text: 'הקואליציה שרדה · הבוחרים שלך ראו',
            capital: { credibility: -8, party_standing: +5 },
            segments: { periphery_general: -1.1 },
          },
          {
            chance: 30,
            text: '',
            capital: { credibility: -8 },
            segments: { periphery_general: -1.1 },
          },
        ],
      },
      {
        label: 'לעמוד על הסעיף',
        branches: [
          {
            chance: 55,
            text: 'האיום התפוגג — הפריפריה זוקפת לך את זה',
            capital: { credibility: +7, popularity: +5 },
            segments: { periphery_general: +1.6 },
          },
          {
            chance: 45,
            text: 'הקואליציה נפלה, והאצבע מופנית אליך',
            capital: { party_standing: -12, popularity: -4 },
          },
        ],
      },
    ],
  },
];
