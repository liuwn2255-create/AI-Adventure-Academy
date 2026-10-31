import { NUMBER_SECRET_LEVEL } from './data/levelCatalog.js';
import { isLevelUnlocked } from './levelEngine.js';

export const NUMBER_SECRET_QUEST_ID = 'thousands-secret';
export const NUMBER_SECRET_UNLOCK_MISSION_ID = 'task-find-number-obelisk';

export function canStartNumberSecret(completedMissionIds) {
  return isLevelUnlocked(NUMBER_SECRET_LEVEL, { completedMissionIds });
}

export function isNumberSecretTreasureUnlocked(progress) {
  return progress?.challengeRecords?.[NUMBER_SECRET_QUEST_ID]?.completed === true;
}
