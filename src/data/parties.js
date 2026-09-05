// The party roster — 2026 field, 17 lists.
//
// This file is designed to be thrown away and rewritten in early September,
// when the real candidate lists are submitted, WITHOUT touching any other file
// (CLAUDE.md §8.2). That is why each party carries its own `baseSupport` — its
// raw pull inside each segment. data/segments.js normalizes those into per-
// segment distributions at load, so adding, removing or renaming a party here
// is a complete edit. Nothing else in the codebase enumerates party ids.
//
// NEUTRALITY (CLAUDE.md §6.4 / SPEC §11.5): real parties, fictional leaders.
// Every `leader` below is invented and deliberately does not match the person
// currently holding the job. No party or leader is attached to a criminal act,
// to corruption, or to any specific real scandal. Negative content in this game
// is structural — coalition demands, internal rebellion, primaries pressure.
//
// `tier`, `prestige` and `baseSupport` are GAME-BALANCE STARTING VALUES. They
// are not predictions and not a claim about any party's real standing. They
// exist so the opening poll has somewhere to start, and they are expected to be
// rewritten wholesale once real polling exists.
//
// `tier` D means a new or small list. Some Tier D lists are real; the last four
// entries in this file are invented outright and carry `real: false`. That flag
// is what makes a party DISPLACEABLE: a player who founds their own party
// pushes the closest FICTIONAL list off the ballot and inherits part of its
// base (engine/party.js). A real party is never displaced — it has a machine,
// and a new list does not take a machine's place.
//
// `baseSupport` values are relative pull, not percentages. They get normalized.
// `offerAffinity` and `slotAffinity` both receive the whole run state.
//
// `stream` — which declared identity this list belongs to, used for patron and
// party eligibility. Distinct from `posture`, which is coalition arithmetic.
// M8 deleted the two cross-stream punishment fields that used to sit beside it;
// the only ideological punishment left is contradicting your own declared stance.

import { OWN_PARTY_ID } from './tuning.js';

export default {
  // -------------------------------------------------------------------------
  // Tier A — ruling scale
  // -------------------------------------------------------------------------

  halikud: {
    id: 'halikud',
    name: 'הליכוד',
    real: true,
    tier: 'A',
    axes: { security: 0.7, religion: 0.3, economy: 0.5, rule_of_law: 0.6 },
    posture: 'right_religious',
    stream: 'right',
    baseSegments: ['traditional_mizrahi', 'periphery_general', 'religious_zionist'],
    selection: 'primaries',
    leader: { name: 'בן-ציון מעשיהו', traits: ['dominant', 'reserved_slots'] },
    openSlots: [11, 14, 18, 22, 27],
    prestige: 95,
    baseSupport: {
      secular_center: 0.05,
      traditional_mizrahi: 0.33,
      arab: 0.03,
      haredi: 0.04,
      religious_zionist: 0.15,
      russian_speaking: 0.16,
      periphery_general: 0.25,
      young_reservists: 0.09,
    },
    // A machine party. It notices you when the מרכז notices you.
    offerAffinity: (state) => (state.capital.party_standing >= 40 ? 1.3 : 1),
    slotAffinity: (state) => (state.axes.security > 0.5 ? 1.1 : 1),
  },

  beyachad: {
    id: 'beyachad',
    name: 'ביחד',
    real: true,
    tier: 'A',
    axes: { security: 0.5, religion: 0.0, economy: 0.4, rule_of_law: 0.1 },
    posture: 'anyone',
    stream: 'left',
    baseSegments: ['secular_center', 'traditional_mizrahi', 'young_reservists'],
    selection: 'chairman_appointed',
    leader: { name: 'ליאור בן־שחר', traits: ['dominant', 'consensus_builder'] },
    openSlots: [9, 12, 16, 20],
    prestige: 82,
    baseSupport: {
      secular_center: 0.21,
      traditional_mizrahi: 0.10,
      arab: 0.04,
      religious_zionist: 0.05,
      russian_speaking: 0.13,
      periphery_general: 0.12,
      young_reservists: 0.14,
    },
    offerAffinity: (state) => (state.capital.popularity >= 40 ? 1.4 : 1),
    slotAffinity: (state) => (state.capital.credibility >= 55 ? 1.2 : 1),
  },

  // -------------------------------------------------------------------------
  // Tier B — 7–12 seats, the realistic mid-career target
  // -------------------------------------------------------------------------

  shas: {
    id: 'shas',
    name: 'ש"ס',
    real: true,
    tier: 'B',
    axes: { security: 0.4, religion: 0.8, economy: -0.3, rule_of_law: 0.4 },
    posture: 'right_religious',
    stream: 'right_religious',
    baseSegments: ['haredi', 'traditional_mizrahi', 'periphery_general'],
    selection: 'rabbinical_council',
    leader: { name: 'הרב שלום אזולאי', traits: ['institutional', 'reserved_slots'] },
    openSlots: [6, 8, 10],
    prestige: 72,
    baseSupport: {
      traditional_mizrahi: 0.16,
      haredi: 0.37,
      periphery_general: 0.10,
    },
    // The council does not read polls. It reads credentials.
    offerAffinity: (state) => (state.axes.religion > 0.6 ? 1.5 : 0.3),
    slotAffinity: (state) => (state.affinity.haredi >= 0.5 ? 1.2 : 1),
  },

  yisrael_beiteinu: {
    id: 'yisrael_beiteinu',
    name: 'ישראל ביתנו',
    real: true,
    tier: 'B',
    axes: { security: 0.6, religion: -0.7, economy: 0.4, rule_of_law: 0.1 },
    posture: 'anti_incumbent_only',
    stream: 'right',
    baseSegments: ['russian_speaking', 'secular_center'],
    selection: 'chairman_appointed',
    leader: { name: 'מיכאל גורביץ׳', traits: ['dominant', 'volatile'] },
    openSlots: [5, 7, 9, 11],
    prestige: 60,
    baseSupport: {
      secular_center: 0.10,
      traditional_mizrahi: 0.03,
      russian_speaking: 0.32,
      periphery_general: 0.05,
      young_reservists: 0.08,
    },
    offerAffinity: (state) => (state.affinity.russian_speaking >= 0.4 ? 1.4 : 1),
    slotAffinity: (state) => (state.axes.religion < -0.3 ? 1.15 : 1),
  },

  // -------------------------------------------------------------------------
  // Tier C — 4–6 seats, easy entry, threshold risk
  // -------------------------------------------------------------------------

  yahadut_hatorah: {
    id: 'yahadut_hatorah',
    name: 'יהדות התורה',
    real: true,
    tier: 'C',
    axes: { security: 0.2, religion: 0.9, economy: -0.2, rule_of_law: 0.5 },
    posture: 'right_religious',
    stream: 'right_religious',
    baseSegments: ['haredi'],
    selection: 'rabbinical_council',
    leader: { name: 'הרב יעקב פרידמן', traits: ['institutional', 'reserved_slots'] },
    openSlots: [5, 6, 7],
    prestige: 65,
    baseSupport: {
      haredi: 0.44,
      religious_zionist: 0.04,
    },
    offerAffinity: (state) => (state.axes.religion > 0.75 ? 1.6 : 0.15),
    slotAffinity: (state) => (state.affinity.haredi >= 0.7 ? 1.25 : 1),
  },

  otzma_yehudit: {
    id: 'otzma_yehudit',
    name: 'עוצמה יהודית',
    real: true,
    tier: 'C',
    axes: { security: 1.0, religion: 0.6, economy: 0.2, rule_of_law: 0.9 },
    posture: 'right_religious',
    stream: 'right_religious',
    baseSegments: ['religious_zionist', 'traditional_mizrahi'],
    selection: 'chairman_appointed',
    leader: { name: 'דוד מזרחי', traits: ['dominant', 'volatile'] },
    openSlots: [4, 6, 9],
    prestige: 52,
    baseSupport: {
      traditional_mizrahi: 0.08,
      religious_zionist: 0.26,
      russian_speaking: 0.03,
      periphery_general: 0.06,
      young_reservists: 0.06,
    },
    offerAffinity: (state) => (state.axes.security > 0.7 ? 1.55 : 0.5),
    slotAffinity: (state) => (state.capital.popularity >= 50 ? 1.2 : 1),
  },

  hatzionut_hadatit: {
    id: 'hatzionut_hadatit',
    name: 'הציונות הדתית',
    real: true,
    tier: 'C',
    axes: { security: 0.9, religion: 0.7, economy: 0.4, rule_of_law: 0.8 },
    posture: 'right_religious',
    stream: 'right_religious',
    baseSegments: ['religious_zionist'],
    selection: 'chairman_appointed',
    leader: { name: 'אביתר רוזן', traits: ['first_time_leader', 'institutional'] },
    openSlots: [4, 6, 8],
    prestige: 55,
    baseSupport: {
      traditional_mizrahi: 0.04,
      haredi: 0.02,
      religious_zionist: 0.24,
      periphery_general: 0.03,
      young_reservists: 0.04,
    },
    offerAffinity: (state) => (state.axes.religion > 0.4 && state.axes.security > 0.5 ? 1.5 : 0.6),
    slotAffinity: (state) => (state.affinity.religious_zionist >= 0.5 ? 1.2 : 1),
  },

  hademokratim: {
    id: 'hademokratim',
    name: 'הדמוקרטים',
    real: true,
    tier: 'C',
    axes: { security: -0.5, religion: -0.8, economy: -0.6, rule_of_law: -0.9 },
    posture: 'center',
    stream: 'left',
    baseSegments: ['secular_center'],
    selection: 'primaries',
    leader: { name: 'תמר וייס־להב', traits: ['collegial', 'consensus_builder'] },
    openSlots: [4, 6, 8, 10],
    prestige: 52,
    baseSupport: {
      secular_center: 0.16,
      traditional_mizrahi: 0.02,
      arab: 0.08,
      russian_speaking: 0.04,
      periphery_general: 0.05,
      young_reservists: 0.07,
    },
    offerAffinity: (state) => (state.capital.party_standing >= 35 ? 1.35 : 1),
    slotAffinity: (state) => (state.axes.rule_of_law < -0.4 ? 1.15 : 1),
  },

  hareshima_hameshutefet: {
    id: 'hareshima_hameshutefet',
    name: 'הרשימה המשותפת',
    real: true,
    tier: 'C',
    axes: { security: -0.9, religion: -0.4, economy: -0.9, rule_of_law: -0.7 },
    posture: 'arab_parties',
    stream: 'arab_parties',
    baseSegments: ['arab'],
    selection: 'sectoral_quota',
    leader: { name: 'סאמר חטיב', traits: ['collegial', 'institutional'] },
    openSlots: [3, 4, 5],
    prestige: 46,
    baseSupport: {
      secular_center: 0.01,
      arab: 0.42,
    },
    offerAffinity: (state) => (state.affinity.arab >= 0.5 ? 1.6 : 0.25),
    slotAffinity: (state) => (state.affinity.arab >= 0.7 ? 1.3 : 1),
  },

  raam: {
    id: 'raam',
    name: 'רע"ם',
    real: true,
    tier: 'C',
    axes: { security: -0.3, religion: 0.5, economy: -0.4, rule_of_law: -0.2 },
    posture: 'anyone',
    stream: 'arab_parties',
    baseSegments: ['arab'],
    selection: 'sectoral_quota',
    leader: { name: 'ראאד אבו־סאלח', traits: ['technocratic', 'consensus_builder'] },
    openSlots: [3, 4, 5],
    prestige: 44,
    baseSupport: {
      arab: 0.36,
    },
    offerAffinity: (state) => (state.affinity.arab >= 0.5 ? 1.55 : 0.25),
    slotAffinity: (state) => (state.axes.religion > 0.2 ? 1.15 : 1),
  },

  yashar: {
    id: 'yashar',
    name: 'ישר!',
    real: true,
    tier: 'C',
    axes: { security: 0.3, religion: -0.3, economy: 0.4, rule_of_law: -0.2 },
    posture: 'center',
    stream: 'center',
    baseSegments: ['secular_center', 'periphery_general'],
    selection: 'chairman_appointed',
    leader: { name: 'שירה אנגלמן', traits: ['first_time_leader', 'technocratic'] },
    openSlots: [3, 5, 7],
    prestige: 40,
    baseSupport: {
      secular_center: 0.09,
      traditional_mizrahi: 0.03,
      arab: 0.02,
      russian_speaking: 0.08,
      periphery_general: 0.08,
      young_reservists: 0.10,
    },
    offerAffinity: (state) => (state.capital.popularity >= 35 ? 1.45 : 1),
    slotAffinity: (state) => (state.capital.popularity >= 50 ? 1.25 : 1),
  },

  // -------------------------------------------------------------------------
  // Tier D, real — new and small lists. High variance, real threshold risk.
  // These are NOT displaceable: a player-founded list never pushes a real
  // party off the ballot.
  // -------------------------------------------------------------------------

  bayit_tzioni_miluimnikim: {
    id: 'bayit_tzioni_miluimnikim',
    name: 'בית ציוני — המילואימניקים',
    real: true,
    tier: 'D',
    axes: { security: 0.7, religion: 0.3, economy: 0.2, rule_of_law: 0.2 },
    posture: 'anyone',
    stream: 'center',
    baseSegments: ['young_reservists', 'religious_zionist'],
    selection: 'chairman_appointed',
    leader: { name: 'אלון קידר', traits: ['first_time_leader', 'collegial'] },
    openSlots: [2, 3, 5, 7],
    prestige: 24,
    baseSupport: {
      secular_center: 0.05,
      religious_zionist: 0.10,
      russian_speaking: 0.03,
      young_reservists: 0.20,
    },
    offerAffinity: (state) => (state.affinity.young_reservists >= 0.4 ? 1.6 : 1),
    slotAffinity: (state) => (state.axes.security > 0.3 ? 1.25 : 1),
  },

  hamahane_hamamlachti: {
    id: 'hamahane_hamamlachti',
    name: 'המחנה הממלכתי (כחול לבן)',
    real: true,
    tier: 'D',
    axes: { security: 0.3, religion: -0.2, economy: 0.2, rule_of_law: -0.4 },
    posture: 'center',
    stream: 'center',
    baseSegments: ['secular_center'],
    selection: 'chairman_appointed',
    leader: { name: 'עמית הראל', traits: ['institutional', 'reserved_slots'] },
    openSlots: [2, 4, 6],
    prestige: 34,
    baseSupport: {
      secular_center: 0.10,
      traditional_mizrahi: 0.03,
      russian_speaking: 0.06,
      periphery_general: 0.05,
      young_reservists: 0.06,
    },
    offerAffinity: (state) => (state.capital.credibility >= 50 ? 1.35 : 1),
    slotAffinity: (state) => (state.capital.party_standing >= 30 ? 1.2 : 1),
  },

  tikva_hadasha: {
    id: 'tikva_hadasha',
    name: 'תקווה חדשה',
    real: true,
    tier: 'D',
    axes: { security: 0.4, religion: -0.1, economy: 0.5, rule_of_law: 0.2 },
    posture: 'anti_incumbent_only',
    stream: 'right',
    baseSegments: ['secular_center'],
    selection: 'chairman_appointed',
    leader: { name: 'דורון אלקיים', traits: ['volatile', 'first_time_leader'] },
    openSlots: [2, 4, 6],
    prestige: 26,
    baseSupport: {
      secular_center: 0.05,
      traditional_mizrahi: 0.01,
      russian_speaking: 0.04,
      periphery_general: 0.03,
      young_reservists: 0.03,
    },
    offerAffinity: (state) => (state.capital.popularity >= 25 ? 1.5 : 1),
    slotAffinity: (state) => (state.capital.popularity >= 45 ? 1.3 : 1),
  },

  yisrael_rishona: {
    id: 'yisrael_rishona',
    name: 'ישראל ראשונה',
    real: true,
    tier: 'D',
    axes: { security: 0.8, religion: 0.1, economy: 0.3, rule_of_law: 0.4 },
    posture: 'right_religious',
    stream: 'right',
    baseSegments: ['traditional_mizrahi', 'russian_speaking'],
    selection: 'chairman_appointed',
    leader: { name: 'נטע פרץ', traits: ['volatile', 'dominant'] },
    openSlots: [2, 3, 5],
    prestige: 22,
    baseSupport: {
      secular_center: 0.04,
      traditional_mizrahi: 0.07,
      religious_zionist: 0.03,
      russian_speaking: 0.08,
      periphery_general: 0.06,
      young_reservists: 0.06,
    },
    offerAffinity: (state) => (state.axes.security > 0.5 ? 1.5 : 1),
    slotAffinity: (state) => (state.capital.popularity >= 40 ? 1.25 : 1),
  },

  amcha_yisrael: {
    id: 'amcha_yisrael',
    name: 'עמך ישראל',
    real: true,
    tier: 'D',
    axes: { security: 0.5, religion: 0.7, economy: -0.5, rule_of_law: 0.3 },
    posture: 'right_religious',
    stream: 'right_religious',
    baseSegments: ['traditional_mizrahi', 'haredi', 'periphery_general'],
    selection: 'sectoral_quota',
    leader: { name: 'הרב מאיר בוזגלו', traits: ['institutional', 'collegial'] },
    openSlots: [2, 3, 5],
    prestige: 20,
    baseSupport: {
      traditional_mizrahi: 0.08,
      haredi: 0.07,
      religious_zionist: 0.04,
      periphery_general: 0.08,
    },
    offerAffinity: (state) => (state.affinity.traditional_mizrahi >= 0.4 ? 1.55 : 1),
    slotAffinity: (state) => (state.axes.economy < -0.2 ? 1.25 : 1),
  },

  noam: {
    id: 'noam',
    name: 'נעם',
    real: true,
    tier: 'D',
    axes: { security: 0.7, religion: 1.0, economy: 0.1, rule_of_law: 0.8 },
    posture: 'right_religious',
    stream: 'right_religious',
    baseSegments: ['religious_zionist', 'haredi'],
    selection: 'rabbinical_council',
    leader: { name: 'הרב אליהו נבון', traits: ['institutional', 'reserved_slots'] },
    openSlots: [1, 2, 3],
    prestige: 18,
    baseSupport: {
      haredi: 0.04,
      religious_zionist: 0.07,
    },
    offerAffinity: (state) => (state.axes.religion > 0.85 ? 1.7 : 0.1),
    slotAffinity: (state) => (state.affinity.religious_zionist >= 0.6 ? 1.3 : 1),
  },

  // -------------------------------------------------------------------------
  // Tier D, fictional — invented lists, `real: false`. Names, leaders and
  // platforms are entirely made up.
  //
  // These four exist so that founding your own party has somewhere to land: a
  // founded list displaces whichever of them sits closest to it in axis space
  // and inherits part of its base. Keep at least one of them on the roster, or
  // founding starts from nothing.
  // -------------------------------------------------------------------------

  ezrahim: {
    id: 'ezrahim',
    name: 'אזרחים',
    real: false,
    tier: 'D',
    axes: { security: 0.0, religion: -0.6, economy: 0.2, rule_of_law: -0.5 },
    posture: 'center',
    stream: 'center',
    baseSegments: ['secular_center'],
    selection: 'chairman_appointed',
    leader: { name: 'רונית שגב', traits: ['first_time_leader', 'technocratic'] },
    openSlots: [2, 3, 5, 7],
    prestige: 25,
    baseSupport: {
      secular_center: 0.13,
      arab: 0.05,
      russian_speaking: 0.06,
      periphery_general: 0.05,
      young_reservists: 0.05,
    },
    offerAffinity: (state) => (state.capital.popularity >= 30 ? 1.4 : 1),
    slotAffinity: (state) => (state.capital.credibility >= 55 ? 1.2 : 1),
  },

  derech_hadasha: {
    id: 'derech_hadasha',
    name: 'דרך חדשה',
    real: false,
    tier: 'D',
    axes: { security: 0.3, religion: -0.2, economy: 0.3, rule_of_law: -0.2 },
    posture: 'anti_incumbent_only',
    stream: 'center',
    baseSegments: ['young_reservists', 'secular_center'],
    selection: 'chairman_appointed',
    leader: { name: 'איתי ברנע', traits: ['volatile', 'first_time_leader'] },
    openSlots: [2, 4, 6, 8],
    prestige: 22,
    baseSupport: {
      secular_center: 0.09,
      traditional_mizrahi: 0.05,
      arab: 0.01,
      religious_zionist: 0.01,
      russian_speaking: 0.08,
      periphery_general: 0.05,
      young_reservists: 0.12,
    },
    offerAffinity: (state) => (state.capital.popularity >= 25 ? 1.5 : 1),
    slotAffinity: (state) => (state.capital.popularity >= 45 ? 1.3 : 1),
  },

  miluim: {
    id: 'miluim',
    name: 'מילואים',
    real: false,
    tier: 'D',
    axes: { security: 0.6, religion: 0.0, economy: 0.1, rule_of_law: 0.0 },
    posture: 'anyone',
    stream: 'center',
    baseSegments: ['young_reservists'],
    selection: 'chairman_appointed',
    leader: { name: 'נדב שטרן', traits: ['first_time_leader', 'collegial'] },
    openSlots: [2, 3, 5, 7],
    prestige: 20,
    baseSupport: {
      secular_center: 0.06,
      traditional_mizrahi: 0.03,
      religious_zionist: 0.07,
      russian_speaking: 0.07,
      periphery_general: 0.04,
      young_reservists: 0.16,
    },
    offerAffinity: (state) => (state.affinity.young_reservists >= 0.4 ? 1.6 : 1),
    slotAffinity: (state) => (state.axes.security > 0.3 ? 1.25 : 1),
  },

  hamerkaz_hahevrati: {
    id: 'hamerkaz_hahevrati',
    name: 'המרכז החברתי',
    real: false,
    tier: 'D',
    axes: { security: 0.0, religion: -0.1, economy: -0.8, rule_of_law: -0.3 },
    posture: 'center',
    stream: 'left',
    baseSegments: ['periphery_general', 'traditional_mizrahi'],
    selection: 'primaries',
    leader: { name: 'סיגלית אוחיון', traits: ['collegial', 'institutional'] },
    openSlots: [2, 4, 6],
    prestige: 18,
    baseSupport: {
      secular_center: 0.07,
      traditional_mizrahi: 0.05,
      arab: 0.05,
      periphery_general: 0.13,
      young_reservists: 0.03,
    },
    offerAffinity: (state) => (state.affinity.periphery_general >= 0.4 ? 1.5 : 1),
    slotAffinity: (state) => (state.axes.economy < -0.3 ? 1.25 : 1),
  },
};

/**
 * Standing surplus agreements (הסכם עודפים) between roster parties. Two lists
 * with an agreement are allocated as one and then split internally, which is
 * where the extra seat comes from.
 *
 * The player's own agreement is signed at runtime and does not live here.
 * `OWN_PARTY_ID` is imported only so that this file remains the single place
 * that knows anything about party identity.
 */
export const SURPLUS_AGREEMENTS = [
  ['shas', 'yahadut_hatorah'],
  ['hatzionut_hadatit', 'otzma_yehudit'],
  ['hareshima_hameshutefet', 'raam'],
  ['beyachad', 'yashar'],
];

/** The id reserved for a player-founded list. Exported for tools. */
export const PLAYER_LIST_ID = OWN_PARTY_ID;
