// Imports and concatenates every card file into one deck.
//
// Add a file here the moment you start writing it. The validator, the draw and
// the simulator all read this list and nothing else — there is no directory
// scan, because a browser loading ES modules directly cannot do one.

import security from './security.js';
import religion from './religion.js';
import economy from './economy.js';
import ruleOfLaw from './rule-of-law.js';
import partyInternal from './party-internal.js';
import media from './media.js';
import patronObligations from './patron-obligations.js';
import ownParty from './own-party.js';

export const CARD_FILES = [
  { file: 'security.js', cards: security },
  { file: 'religion.js', cards: religion },
  { file: 'economy.js', cards: economy },
  { file: 'rule-of-law.js', cards: ruleOfLaw },
  { file: 'party-internal.js', cards: partyInternal },
  { file: 'media.js', cards: media },
  { file: 'patron-obligations.js', cards: patronObligations },
  { file: 'own-party.js', cards: ownParty },
];

export default CARD_FILES.flatMap((entry) => entry.cards);
