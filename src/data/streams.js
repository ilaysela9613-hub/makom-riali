// The five streams — the player's declared identity, and the whole of character
// creation.
//
// M8 folded the six old starting roles into these five. Six roles crossed with
// five streams was thirty starting combinations that could not be balanced
// against each other and that the player could not tell apart; a stream is one
// choice that answers both "who am I" and "where do I start".
//
// A stream is not a party and not a posture:
//
//   stream   — who you say you are. Declared once, before the first card, and
//              never changes. Representing a shift is a flip, which costs
//              voters; it is not a change of stream.
//   party    — the list you are currently on. Changes as offers arrive.
//   posture  — the coalition-arithmetic flag.
//
// BALANCE: tools/balance.js now measures top-tier reach across these five, and
// CLAUDE.md §6.1's 20-point spread rule applies to them. They are built to be
// different SHAPES, not different strengths — each starts with 120 points of
// capital and roughly the same weighted reach into the electorate. Do not make
// one easier.
//
//   startingAxes    — where this stream stands, on the four ideology axes.
//   startingBlocs   — per-segment AFFINITY, -1…+1: how hard this stream's
//                     decisions land with each segment. Not vote share; the
//                     opening vote distribution comes from data/parties.js.
//   startingCapital — popularity / party_standing / credibility, summing to 120.
//
// Ordered as the player sees them, right to left across the map.

export const STREAMS = [
  {
    id: 'right_religious',
    label: 'ימין דתי',
    description: 'ארץ ישראל השלמה ושמירה על אופייה היהודי של המדינה.',
    // The institutional start: deep inside a machine, unknown to the public.
    startingAxes: { security: 0.6, religion: 0.7, economy: 0.3, rule_of_law: 0.5 },
    startingBlocs: {
      religious_zionist: 0.6,
      haredi: 0.5,
      traditional_mizrahi: 0.3,
      secular_center: -0.35,
    },
    startingCapital: { popularity: 20, party_standing: 60, credibility: 40 },
  },
  {
    id: 'right',
    label: 'ימין',
    description: 'קו ביטחוני קשוח, שוק חופשי, ומדינה שלא מתנצלת.',
    // Broad and shallow: known everywhere, owned nowhere.
    startingAxes: { security: 0.6, religion: 0.1, economy: 0.6, rule_of_law: 0.4 },
    startingBlocs: {
      traditional_mizrahi: 0.45,
      russian_speaking: 0.45,
      periphery_general: 0.3,
      young_reservists: 0.25,
    },
    startingCapital: { popularity: 45, party_standing: 40, credibility: 35 },
  },
  {
    id: 'center',
    label: 'מרכז',
    description: 'ממלכתיות לפני מחנה. מוכן לשבת כמעט עם כולם.',
    // Visible and clean, with nobody's machine behind you.
    startingAxes: { security: 0.1, religion: -0.1, economy: 0.1, rule_of_law: -0.1 },
    startingBlocs: {
      secular_center: 0.45,
      young_reservists: 0.4,
      russian_speaking: 0.25,
      periphery_general: 0.15,
    },
    startingCapital: { popularity: 45, party_standing: 25, credibility: 50 },
  },
  {
    id: 'left',
    label: 'שמאל',
    description: 'הסדר מדיני, שוויון אזרחי, והגנה על בתי המשפט.',
    // Trusted far more than it is known.
    startingAxes: { security: -0.5, religion: -0.6, economy: -0.5, rule_of_law: -0.6 },
    startingBlocs: {
      secular_center: 0.45,
      arab: 0.3,
      young_reservists: 0.3,
      religious_zionist: -0.3,
    },
    startingCapital: { popularity: 35, party_standing: 25, credibility: 60 },
  },
  {
    id: 'arab_parties',
    label: 'מפלגות ערביות',
    description: 'שוויון אזרחי מלא וייצוג פוליטי לחברה הערבית.',
    // The deepest single-segment anchor on the board, and the narrowest.
    startingAxes: { security: -0.6, religion: 0.0, economy: -0.5, rule_of_law: -0.5 },
    startingBlocs: {
      arab: 0.85,
      periphery_general: 0.25,
      secular_center: 0.1,
    },
    startingCapital: { popularity: 30, party_standing: 45, credibility: 45 },
  },
];

export const STREAM_IDS = STREAMS.map((stream) => stream.id);

export function streamById(streamId) {
  return STREAMS.find((stream) => stream.id === streamId) ?? null;
}

export function streamLabel(streamId) {
  return streamById(streamId)?.label ?? streamId;
}
