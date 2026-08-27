// SCHEMA FIXTURES — not content.
//
// Three cards demonstrating every key the validator knows about:
//   1. home_front_budget_vote      — a plain card, no gates
//   2. defence_committee_seat_offer — a `requires` gate on five different keys
//   3. reserve_service_op_ed        — `risk` + `onFail` + `unlocks`
//
// They chain: the op-ed gamble is what opens the committee conversation, and
// the committee conversation is closed to anyone who already took the safe
// budget vote. Delete all three when the real security deck goes in.
//
// Option 2 of the committee card deliberately touches three capital meters so
// that `node tools/validate.js` reports a warning on a clean tree — that is
// the warning path working, not a mistake.

export default [
  {
    id: 'home_front_budget_vote',
    act: 2,
    weight: 1.0,
    camp: 'neutral',

    title: 'הצבעה על תקציב ההתגוננות האזרחית',
    text: 'ועדת הכספים מצביעה מחר על העברת תקציב להתגוננות אזרחית ברשויות. שני חברי כנסת מהסיעה שלך כבר הודיעו שהם נמנעים, ואחד מהם התקשר לשאול מה אתה עושה.',

    options: [
      {
        label: 'לתמוך בהעברה ולהסביר בציבור למה',
        pill: 'מחזק בפריפריה · מוציא אותך מהקונצנזוס בסיעה',
        capital: { popularity: +5, party_standing: -3 },
        segments: { periphery_general: +1.2 },
      },
      {
        label: 'ללכת עם עמדת הסיעה',
        pill: 'מחזק במעמד המפלגתי · שום דבר אחר לא זז',
        capital: { party_standing: +4 },
      },
      {
        label: 'לדרוש דיון נוסף ולדחות את ההצבעה',
        pill: 'מחיר נמוך בכל הכיוונים · גם לא מקדם אותך',
        capital: { credibility: +2, party_standing: -1 },
      },
    ],
  },

  {
    id: 'defence_committee_seat_offer',
    act: 3,
    weight: 1.0,
    camp: 'right',

    requires: {
      axes: { security: { min: 0.1 } },
      capital: { party_standing: { min: 25 } },
      partyTier: ['A', 'B'],
      ownParty: false,
      notSeen: ['home_front_budget_vote'],
    },

    title: 'מקום בוועדת החוץ והביטחון',
    text: 'ראש הסיעה מציע לך מקום בוועדת החוץ והביטחון. הוא מזכיר, כבדרך אגב, שהוועדה מצביעה בחודש הבא בדיוק על הנושא שכתבת עליו.',

    options: [
      {
        label: 'לקבל את המקום ולהתיישר עם הסיעה',
        pill: 'קפיצה במעמד המפלגתי · פוגע באמינות ובצעירים',
        axes: { security: +0.06 },
        capital: { party_standing: +9, credibility: -5 },
        segments: { young_reservists: -1.2 },
      },
      {
        label: 'לקבל, ולהבהיר מראש שתצביע לפי עמדתך',
        pill: 'מחזק באמינות · המעמד המפלגתי כמעט לא זז · היו״ר יזכור',
        capital: { credibility: +6, party_standing: +2, popularity: +2 },
      },
      {
        label: 'לסרב ולהישאר בלי מחויבות',
        pill: 'שומר על קו עצמאי · מוותר על במה מרכזית',
        capital: { credibility: +4, party_standing: -6 },
        segments: { secular_center: +0.6 },
      },
    ],
  },

  {
    id: 'reserve_service_op_ed',
    act: 2,
    weight: 1.0,
    camp: 'left',

    title: 'טור דעה על נטל המילואים',
    text: 'עורך המוסף מציע לך טור על חלוקת הנטל. מי שכותב על זה עכשיו מקבל תשומת לב, ומי שמקבל תשומת לב מקבל גם את כל מי שחיכה להזדמנות לענות לו.',

    options: [
      {
        label: 'לכתוב טור מדוד על העלות למעסיקים',
        pill: 'מחזק בצעירים ובמרכז החילוני · מחיר קטן במעמד המפלגתי',
        capital: { popularity: +4, party_standing: -2 },
        segments: { young_reservists: +1.4, secular_center: +0.8 },
      },
      {
        label: 'לוותר על הטור',
        pill: 'לא קורה כלום · גם לא לטובה',
        capital: { credibility: +1 },
      },
      {
        label: 'לכתוב טור חריף ולתקוף את ההסדרים הקיימים',
        pill: 'הימור · מחזק חזק בצעירים · עלול להצית מולך מערכה שלמה',
        risk: 0.35,
        capital: { popularity: +11, credibility: -4 },
        segments: { young_reservists: +2.4, haredi: -2.0 },
        onFail: {
          capital: { party_standing: -12 },
          flags: ['marked_as_rebel'],
          text: 'הטור התגלגל לכותרת שלא כתבת. בסיעה החליטו שאתה בעיה ולא נכס.',
        },
        unlocks: ['defence_committee_seat_offer'],
      },
    ],
  },
];
