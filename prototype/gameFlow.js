// Backward-compatible adapter retained for the existing five-question flow.
export {
  createLevelSession as createGameState,
  submitLevelAnswer as submitAnswer,
  advanceLevelQuestion as advanceQuestion,
} from './levelEngine.js';
