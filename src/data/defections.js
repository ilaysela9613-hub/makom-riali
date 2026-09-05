// Defection narration.
//
// When voters walk out, the run has to say who left and why, in Hebrew. All of
// that lives here: the engine decides THAT a defection happened and which
// segments it moved, then asks this file for the sentence — the same division
// of labour as data/titles.js. Nothing under src/engine/ ever composes Hebrew
// (CLAUDE.md §8.2).

import { DISPLAY_BLOCS } from './segments.js';

/** Hebrew for the axis a stance was taken on, for the "you said X" clause. */
const AXIS_SUBJECT = {
  security: 'בענייני ביטחון',
  religion: 'בענייני דת ומדינה',
  economy: 'בענייני כלכלה',
  rule_of_law: 'בענייני שלטון חוק',
};

const WEEK_WORDS = [
  null,
  'לפני שבוע',
  'לפני שבועיים',
  'לפני שלושה שבועות',
  'לפני ארבעה שבועות',
  'לפני חמישה שבועות',
  'לפני שישה שבועות',
  'לפני שבעה שבועות',
  'לפני שמונה שבועות',
  'לפני תשעה שבועות',
  'לפני עשרה שבועות',
];

function weeksAgoPhrase(turnsAgo) {
  return WEEK_WORDS[turnsAgo] ?? `לפני ${turnsAgo} שבועות`;
}

function blocName(blocId) {
  return DISPLAY_BLOCS.find((bloc) => bloc.id === blocId)?.displayName ?? blocId;
}

/** "חלק מהמצביעים בַּמרכז החילוני" — one bloc, two, or all three. */
function leaversPhrase(blocIds) {
  const names = blocIds.map(blocName);
  if (names.length === 0) return 'חלק מהמצביעים';
  if (names.length === 1) return `חלק מהמצביעים במחנה ה${names[0]}`;
  const last = names.pop();
  return `חלק מהמצביעים במחנות ${names.join(', ')} ו${last}`;
}

/**
 * @param {object} defection
 * @param {'flip'|'dirty'} defection.reason
 * @param {string|null} defection.axis      the axis the stance was taken on
 * @param {number|null} defection.turnsAgo  how long ago it was declared
 * @param {string[]}    defection.blocs     bloc ids that lost voters
 * @returns {{ headline: string, detail: string }} both Hebrew
 */
export function defectionNarration({ axis, turnsAgo, blocs }) {
  return {
    headline: 'סתירה בעמדה',
    detail:
      `הצבעת נגד מה שהצהרת ${weeksAgoPhrase(turnsAgo)} ${AXIS_SUBJECT[axis] ?? ''}. ` +
      `${leaversPhrase(blocs)} עזבו אותך.`,
  };
}
