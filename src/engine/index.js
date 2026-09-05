// Public API barrel. The UI and the Node tools both import from here and from
// nowhere else inside src/engine/.

// ---------------------------------------------------------------------------
// The API named in CLAUDE.md §5
// ---------------------------------------------------------------------------

export { createRun } from './state.js';
export { drawCard, applyOption } from './cards.js';
export { eligiblePatrons } from './patron.js';
export { takePatron as choosePatron, gatekeeperSeat } from './patronage.js';
export { slotTable } from './slots.js';
export { poll, runElection } from './election.js';

// ---------------------------------------------------------------------------
// Turn orchestration
//
// §5 lists the seven functions above, but a caller also needs to be able to
// close a turn and ask whether the run is over. These are the minimum
// additions that make the §5 surface usable on its own.
// ---------------------------------------------------------------------------

export { endTurn } from './cards.js';
export {
  isRunOver,
  earlyEnding,
  cloneRun,
  actForTurn,
  playerPartyId,
  popularityBand,
} from './state.js';

// ---------------------------------------------------------------------------
// Own party — M4 fills these out; the shapes are here now because election.js
// already has to resolve a player-founded list.
// ---------------------------------------------------------------------------

export {
  canFoundParty,
  foundParty,
  createFoundedRun,
  foundingPreview,
  displaceablePartyFor,
  displacedPartyId,
  axisDistance,
  availableRecruits,
  recruit,
  setSurplusPartner,
  joinParty,
  leaveParty,
  activeParties,
  currentParty,
  partyById,
  rosterParties,
} from './party.js';

// ---------------------------------------------------------------------------
// Reads the HUD needs. All derived, none stored.
// ---------------------------------------------------------------------------

export {
  offerChance,
  slotValue,
  bestReachableSlot,
  acceptOffer,
  declineOffers,
  offersForTurn,
  offerRollTurn,
  isListSubmissionClosed,
  hasDeclinedParty,
} from './slots.js';
export {
  currentPatron,
  patronById,
  bindingDirections,
  isBindingAxis,
  acceptBetrayal,
  refuseBetrayal,
  dueBetrayalCardId,
  BETRAYAL_CARD_ID,
  PATRON_KINDS,
} from './patron.js';
export {
  cardById,
  allCards,
  eligibleCards,
  trailingCampStreak,
  isGamble,
  branchValence,
  classifyBranches,
  branchForRoll,
  endsRunCause,
} from './cards.js';
export { createRng } from './rng.js';

// ---------------------------------------------------------------------------
// Stances and defection
// ---------------------------------------------------------------------------

export {
  applyStance,
  applyIntegrityConsequences,
  declaredStance,
  isFlip,
  segmentsPunishing,
  defectionDeltas,
  DEFECTION_REASONS,
} from './credibility.js';

// Display blocs — the three bars that replace eight segment readouts.
export { blocSupport, blocAffinity, blocReadout } from './segments.js';
