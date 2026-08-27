// Recruits for a player-founded list — the closest thing this game has to
// Legionnaire's transfer market.
//
// M1 stubs the shape with two entries so engine/party.js has something real to
// resolve. M4 fills out the pool: רמטכ״ל לשעבר, עיתונאי/ת בכיר/ה, ראש עיר
// מהפריפריה, יזם היי-טק, שר/ה לשעבר שפרש/ה בכעס, ראש מועצה מהמגזר,
// אקדמאי/ת מוכר/ת, פעיל/ת מחאה (SPEC §6).
//
// `cost.slots` is how many places above you they take on the list — signing a
// big name pushes your own number down, which is the whole trade.
// `risk` is the chance they walk before the submission deadline.
// `baggage` is inert in M1; M4 turns each tag into a card.
//
// All names are fictional.

export default {
  rec_former_chief_of_staff: {
    id: 'rec_former_chief_of_staff',
    name: 'תא״ל (מיל׳) גיא ארנון — סגן הרמטכ״ל לשעבר',
    pitch: 'הוא לא מבין כלום בפוליטיקה והוא יגיד לך את זה בעצמו. הוא גם מביא איתו חצי מדינה.',
    pillLabel: 'מביא מרכז חילוני וצעירים · יקר · תופס שני מקומות מעליך',
    cost: { resources: 25, slots: 2 },
    brings: { secular_center: +2.5, young_reservists: +3.0, russian_speaking: +1.2 },
    axesPull: { security: +0.2 },
    baggage: ['no_political_experience', 'rival_to_founder'],
    risk: 0.15,
  },

  rec_periphery_mayor: {
    id: 'rec_periphery_mayor',
    name: 'סיגל בן־שושן — ראשת עיר בדרום',
    pitch: 'שלוש קדנציות, אפס פריימריז ארציים. היא מביאה מטה בחירות שלם שכבר יודע לעבוד.',
    pillLabel: 'מביאה פריפריה ומסורתיים · זולה יחסית · תופסת מקום אחד מעליך',
    cost: { resources: 14, slots: 1 },
    brings: { periphery_general: +2.8, traditional_mizrahi: +1.4 },
    axesPull: { economy: -0.1 },
    baggage: ['local_rivalries'],
    risk: 0.10,
  },
};
