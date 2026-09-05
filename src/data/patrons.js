// Patrons — who put you where you are, and what they hold over you.
//
// Two kinds. Neither charges rent; both bind you.
//
//   gatekeeper — puts you straight onto an existing party's list. In exchange
//                you are held to that party's line on `bindingAxes`. The
//                direction comes from the party's own position, so a gatekeeper
//                never needs to restate it.
//
//   sponsor    — no party. Gives a head start in voters or capital, and a fixed
//                public agenda (`agendaAxes`) you are held to just as tightly.
//                A sponsor must state its own directions; there is no party to
//                read them from.
//
// Binding is enforced entirely by the M3 stance/defection machinery: taking a
// patron declares a stance on each binding axis, and contradicting one later is
// an ordinary flip. There is no separate patron punishment anywhere.
//
// `streams` lists the declared identities this patron will deal with. Nobody
// crosses the map to back a stranger, so a gatekeeper never appears to a player
// from an incompatible stream — the door is simply not there.
//
// All patron names are fictional.

import {
  STARTING_PATRON,
  BRANCH_BOSS_MIN_PARTY_STANDING,
  COUNCIL_AIDE_MIN_RELIGION_AXIS,
  CHIEF_OF_STAFF_MIN_POPULARITY,
  ORGANISER_MIN_CREDIBILITY,
  DONOR_MIN_POPULARITY,
  FEDERATION_MIN_PARTY_STANDING,
  BROADCAST_MIN_POPULARITY,
} from './tuning.js';

export default {
  // -------------------------------------------------------------------------
  // No patron. A real strategic option, not an absence: nobody opens a door for
  // you, and nobody owns a single one of your positions either.
  // -------------------------------------------------------------------------
  none: {
    id: STARTING_PATRON,
    kind: 'none',
    displayName: 'בלי פטרון',
    shortName: 'עצמאי',
    pitch: 'אף אחד לא הכניס אותך לכאן, ולכן אף אחד לא יכול להוציא אותך. גם אף אחד לא ירים לך טלפון.',
    agendaText: 'אתה לא מחויב לאף עמדה מלבד שלך.',
    streams: ['right_religious', 'right', 'center', 'left', 'arab_parties'],
    eligible: () => true,
    party: null,
    bindingAxes: [],
    headStart: null,
  },

  // -------------------------------------------------------------------------
  // Gatekeepers — a seat on a list, and a line you may not cross.
  // -------------------------------------------------------------------------

  halikud_branch_boss: {
    id: 'halikud_branch_boss',
    kind: 'gatekeeper',
    displayName: 'ראש סניף בליכוד — יוסי דרעי־לוין',
    shortName: 'ראש הסניף',
    pitch: 'הוא מכיר כל מתפקד בעיר בשמו הפרטי. הוא יכניס אותך לרשימה השבוע, ויזכיר לך את זה בכל שבוע אחרי.',
    agendaText: 'קו ביטחוני נוקשה ושמירה על הסטטוס קוו הדתי — בלי סטיות.',
    streams: ['right', 'right_religious'],
    eligible: (player) => player.capital.party_standing >= BRANCH_BOSS_MIN_PARTY_STANDING,
    party: 'halikud',
    bindingAxes: ['security', 'religion'],
    headStart: null,
  },

  shas_council_aide: {
    id: 'shas_council_aide',
    kind: 'gatekeeper',
    displayName: 'מקורב למועצת חכמי התורה — הרב מנשה טולדנו',
    shortName: 'המקורב',
    pitch: 'הוא לא מתרשם מסקרים ולא מאולפנים. הוא ראה אותך מגיע לכל אירוע במשך שנתיים, וזה מה שסופרים אצלו.',
    agendaText: 'עמדה דתית מובהקת, בכל הצבעה, בלי יוצא מן הכלל.',
    streams: ['right_religious'],
    eligible: (player) => player.axes.religion >= COUNCIL_AIDE_MIN_RELIGION_AXIS,
    party: 'shas',
    bindingAxes: ['religion'],
    headStart: null,
  },

  beyachad_chief_of_staff: {
    id: 'beyachad_chief_of_staff',
    kind: 'gatekeeper',
    displayName: 'ראש מטה בביחד — ליאור בן־שחר',
    shortName: 'ראש המטה',
    pitch: 'הוא ראה אותך באולפן והחליט שאתה שלו. מהיום העמדות שלך הן העמדות של המפלגה, וזה קורה לאט מספיק כדי שלא תשים לב.',
    agendaText: 'קו ביטחוני מוצק ושוק חופשי — בדיוק כמו המפלגה.',
    streams: ['left', 'center'],
    eligible: (player) => player.capital.popularity >= CHIEF_OF_STAFF_MIN_POPULARITY,
    party: 'beyachad',
    bindingAxes: ['security', 'economy'],
    headStart: null,
  },

  hademokratim_organiser: {
    id: 'hademokratim_organiser',
    kind: 'gatekeeper',
    displayName: 'מנהלת מטה בדמוקרטים — תמר וייס־להב',
    shortName: 'מנהלת המטה',
    pitch: 'היא בנתה שלוש קמפייניות מנצחות ואף אחת מהן לא הייתה שלה. את שלך היא מוכנה לבנות, בתנאי אחד.',
    agendaText: 'הגנה על ביקורת שיפוטית — בלי לרכך ובלי להתחמק.',
    streams: ['left', 'center'],
    eligible: (player) => player.capital.credibility >= ORGANISER_MIN_CREDIBILITY,
    party: 'hademokratim',
    bindingAxes: ['rule_of_law'],
    headStart: null,
  },

  // -------------------------------------------------------------------------
  // Sponsors — no seat, but a running start and an agenda in public.
  // -------------------------------------------------------------------------

  business_donor: {
    id: 'business_donor',
    kind: 'sponsor',
    displayName: 'תורם — אבישי קלנר',
    shortName: 'התורם',
    pitch: 'הוא לא מבקש ג׳וב ולא מבקש תפקיד. הוא רק רוצה שתזכור מי מימן לך את הסיבוב הראשון.',
    agendaText: 'צמיחה, שוק חופשי, פחות רגולציה — ואתה אומר את זה בקול.',
    streams: ['right', 'right_religious', 'center'],
    eligible: (player) => player.capital.popularity >= DONOR_MIN_POPULARITY,
    party: null,
    bindingAxes: ['economy'],
    agendaAxes: { economy: +1 },
    headStart: {
      capital: { popularity: +20, party_standing: +6 },
      segments: { secular_center: +1.0 },
    },
  },

  labour_federation: {
    id: 'labour_federation',
    kind: 'sponsor',
    displayName: 'ועד עובדים ארצי — סיגלית אוחיון',
    shortName: 'הוועד',
    pitch: 'היא הוציאה שלושה מפעלים לשביתה וסגרה הסכם שאיש לא האמין בו. היא יודעת לספור קולות באולם, ותספור גם את שלך.',
    agendaText: 'הגנה על העובדים ועל הפריפריה — לפני כל שיקול אחר.',
    streams: ['left', 'arab_parties', 'center'],
    eligible: (player) => player.capital.party_standing >= FEDERATION_MIN_PARTY_STANDING,
    party: null,
    bindingAxes: ['economy'],
    agendaAxes: { economy: -1 },
    headStart: {
      capital: { party_standing: +10 },
      segments: { periphery_general: +2.2, traditional_mizrahi: +1.4 },
    },
  },

  broadcast_backer: {
    id: 'broadcast_backer',
    kind: 'sponsor',
    displayName: 'גורם תקשורתי — שיר אבידן',
    shortName: 'התקשורת',
    pitch: 'היא לא תבקש ממך כלום. היא פשוט תדאג שכל מה שתעשה יגיע למהדורה — כולל מה שלא רצית שיגיע.',
    agendaText: 'עמידה על ביקורת שיפוטית ועל חופש העיתונות, בכל ראיון.',
    streams: ['left', 'center', 'arab_parties'],
    eligible: (player) => player.capital.popularity >= BROADCAST_MIN_POPULARITY,
    party: null,
    bindingAxes: ['rule_of_law'],
    agendaAxes: { rule_of_law: -1 },
    headStart: {
      capital: { popularity: +18 },
      segments: { secular_center: +1.8, young_reservists: +1.0 },
    },
  },
};
