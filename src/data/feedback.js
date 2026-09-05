// Hebrew for the post-turn beat.
//
// The UI works out WHAT moved; every sentence describing it is written here,
// because nothing under src/engine/ or src/ui/ may compose Hebrew
// (CLAUDE.md §8.2). Same division of labour as data/titles.js and
// data/defections.js.

/**
 * "הליכוד" -> "בליכוד", "ישראל ביתנו" -> "בישראל ביתנו".
 * The definite article is absorbed by the preposition; everything else just
 * takes the prefix.
 */
export function inParty(partyName) {
  if (!partyName) return '';
  return partyName.startsWith('ה') ? `ב${partyName.slice(1)}` : `ב${partyName}`;
}

/**
 * The one legible score, as a whole line. SPEC §1.
 *
 * A slot on a list you actually hold and a slot you are merely WORTH somewhere
 * are different facts, and the line has to say which it is. Presenting a
 * prospect in the same words as a holding tells the player they are on a list
 * they have never joined.
 */
export function slotLine(slot, partyName, { isHeld }) {
  if (slot === null || !partyName) return 'עדיין אין לך מקום ברשימה';
  if (isHeld) return `${slot} ${inParty(partyName)}`;
  return `${slot} ${inParty(partyName)} · עדיין לא שלך`;
}

/**
 * The slot line with the popularity band hung off it, separated by a middle dot.
 * The slot is the anchor and popularity is the modifier — one element, never a
 * second row.
 *
 * With no list of your own there is no slot to anchor to, so the band stands
 * alone and the dot goes with the thing it was separating.
 */
export function slotWithBand(slotText, bandLabel, { hasParty }) {
  if (!hasParty) return bandLabel;
  return `${slotText} · ${bandLabel}`;
}

export function slotChangeLine(previousSlot, nextSlot, partyName) {
  if (previousSlot === null) return `נכנסת לרשימה במקום ${nextSlot} ${inParty(partyName)}`;
  const direction = nextSlot < previousSlot ? 'עלית' : 'ירדת';
  return `${direction} מהמקום ה־${previousSlot} למקום ה־${nextSlot} ${inParty(partyName)}`;
}

/** A bloc gaining or losing ground. `blocNames` is already Hebrew. */
export function blocMovementLine(blocName, direction) {
  return direction > 0
    ? `התחזקת במחנה ה${blocName}`
    : `איבדת תמיכה במחנה ה${blocName}`;
}

export function seatChangeLine(previousSeats, nextSeats) {
  const difference = nextSeats - previousSeats;
  if (difference === 0) return null;
  return difference > 0
    ? `הרשימה שלך עלתה ל־${nextSeats} מנדטים בסקר`
    : `הרשימה שלך ירדה ל־${nextSeats} מנדטים בסקר`;
}

/**
 * A capital meter moving, said qualitatively.
 *
 * The meters themselves are no longer shown — the player tracks five numbers,
 * not twenty. But a turn that moved standing or money still moved SOMETHING,
 * and saying so in plain Hebrew costs the player no extra number to track.
 *
 * `credibility` is deliberately absent. It went engine-internal in M3, and
 * defection is what the player sees instead of it.
 */
const CAPITAL_LINES = {
  popularity: ['ירדת מהכותרות', 'הפכת מוכר יותר'],
  party_standing: ['נחלשת בתוך הסיעה', 'התחזקת בתוך הסיעה'],
};

export const NARRATABLE_CAPITAL = Object.keys(CAPITAL_LINES);

export function capitalMovementLine(capitalKey, direction) {
  const pair = CAPITAL_LINES[capitalKey];
  if (!pair) return null;
  return direction > 0 ? pair[1] : pair[0];
}

/** Shown when a turn genuinely moved nothing worth naming. */
export const QUIET_BEAT_LINE = 'שום דבר לא זז מספיק כדי שמישהו ישים לב.';

/**
 * The four ideology axes in Hebrew. They live here rather than in the UI because
 * §8.2 keeps every player-facing string in data/ — the drift chart and the
 * patron screen both read from this one place.
 */
export const AXIS_NAMES = {
  security: 'ביטחון',
  religion: 'דת ומדינה',
  economy: 'כלכלה',
  rule_of_law: 'שלטון חוק',
};

/** The two poles of each axis, for the drift chart. */
export const AXIS_POLES = {
  security: ['מדיני / פשרה', 'ביטחוני / נץ'],
  religion: ['הפרדת דת ומדינה', 'סטטוס קוו דתי'],
  economy: ['סוציאל־דמוקרטי', 'שוק חופשי'],
  rule_of_law: ['חיזוק ביקורת שיפוטית', 'חיזוק הרשות המחוקקת'],
};

/** The drift chart's caption, with the band the run finished on. */
export function driftCaption(bandLabel) {
  return `אפור — נקודת הפתיחה · כחול — איפה סיימת · סיימת ${bandLabel}`;
}

export const BEAT_LABELS = {
  whatMoved: 'מה זז',
  yourSlot: 'מקום ריאלי',
  bestProspect: 'מקום ריאלי · הכי טוב שאתה שווה',
  fullTable: 'כל המפלגות',
  blocs: 'מחנות · תמיכה',
  blocsAffinity: 'מחנות · היחס אליך',
  poll: 'הסקר',
  yourList: 'הרשימה שלך',
  noList: 'אין לך רשימה',
};
