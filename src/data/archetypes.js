// Six starting archetypes, spanning the spectrum.
//
// These are the six runs tools/balance.js measures against each other. If any
// of them reaches the top tier much more often than the others, that is a
// balance bug and it will be read as a political statement (CLAUDE.md §6.1) —
// so they are built to differ in *capital mix* and *which doors open*, not in
// how strong they are.
//
// Each one gets 160 points of capital in total. What differs is where.
// Affinity keys left out default to 0.

export default {
  reserve_officer: {
    id: 'reserve_officer',
    displayName: 'קצין/ת מילואים',
    blurb: 'שלוש שנים של פוסטים על מוכנות הצבא הפכו אותך לכתובת. עכשיו מתקשרים אליך גם מהמפלגות.',
    axes: { security: 0.6, religion: 0.0, economy: 0.1, rule_of_law: 0.2 },
    posture: 'anyone',
    capital: { popularity: 52, party_standing: 18, credibility: 58, resources: 32 },
    affinity: { young_reservists: 0.7, secular_center: 0.3, religious_zionist: 0.2 },
    flags: [],
  },

  yeshiva_administrator: {
    id: 'yeshiva_administrator',
    displayName: 'מנהל/ת מוסדות תורניים',
    blurb: 'ניהלת תקציבים של רשת מוסדות במשך עשור. אתה יודע בדיוק מי חותם על מה, ומי חייב למי טובה.',
    axes: { security: 0.3, religion: 0.8, economy: -0.1, rule_of_law: 0.4 },
    posture: 'right_religious',
    capital: { popularity: 14, party_standing: 56, credibility: 54, resources: 36 },
    affinity: { haredi: 0.8, traditional_mizrahi: 0.3, secular_center: -0.4 },
    flags: [],
  },

  tech_founder: {
    id: 'tech_founder',
    displayName: 'יזם/ית הייטק',
    blurb: 'מכרת את החברה השנייה שלך ומאז אתה מסביר בכל פאנל למה המדינה מנוהלת לא נכון. מישהו סוף סוף הציע לך לנסות בעצמך.',
    axes: { security: 0.1, religion: -0.4, economy: 0.8, rule_of_law: -0.1 },
    posture: 'center',
    capital: { popularity: 30, party_standing: 12, credibility: 46, resources: 72 },
    affinity: { secular_center: 0.5, russian_speaking: 0.3, young_reservists: 0.2 },
    flags: [],
  },

  civil_rights_lawyer: {
    id: 'civil_rights_lawyer',
    displayName: 'עו״ד לזכויות אזרח',
    blurb: 'עשרים שנה בבג״ץ בצד שבדרך כלל מפסיד. הפסדת מספיק פעמים כדי להבין שהשינוי לא מגיע משם.',
    axes: { security: -0.4, religion: -0.6, economy: -0.3, rule_of_law: -0.8 },
    posture: 'center',
    capital: { popularity: 26, party_standing: 20, credibility: 78, resources: 36 },
    affinity: { secular_center: 0.6, arab: 0.4, haredi: -0.5 },
    flags: [],
  },

  union_organizer: {
    id: 'union_organizer',
    displayName: 'פעיל/ת ועד עובדים',
    blurb: 'הוצאת שלושה מפעלים לשביתה וסגרת הסכם קיבוצי שאיש לא האמין בו. אתה יודע לספור קולות באולם.',
    axes: { security: -0.1, religion: -0.2, economy: -0.8, rule_of_law: -0.2 },
    posture: 'anti_incumbent_only',
    capital: { popularity: 22, party_standing: 58, credibility: 56, resources: 24 },
    affinity: { periphery_general: 0.6, traditional_mizrahi: 0.4, secular_center: 0.1 },
    flags: [],
  },

  regional_journalist: {
    id: 'regional_journalist',
    displayName: 'כתב/ת בתחנה אזורית',
    blurb: 'חמש שנים של פינה יומית שאף אחד בתל אביב לא שמע עליה ושכל הצפון מקשיב לה. הקול שלך מוכר יותר מהפנים.',
    axes: { security: 0.0, religion: -0.1, economy: -0.2, rule_of_law: -0.3 },
    posture: 'center',
    capital: { popularity: 58, party_standing: 16, credibility: 62, resources: 24 },
    affinity: { periphery_general: 0.5, secular_center: 0.3, russian_speaking: 0.2 },
    flags: [],
  },
};
