import { sanitizeCompletedMissionIds } from './missions.js';
import { PROGRESS_LEVELS } from './data/levelCatalog.js';

export const DEMO_PROGRESS_KEY = 'taiwan-ai-adventure.prototype-progress.v1';
export const DEMO_LEVEL_ID = 'math-place-value-demo';
export const DEMO_LEVEL_MAX_STARS = 5;
export const DEMO_COLLECTIBLE_STAR_IDS = Object.freeze(['island-star-1']);
const progressLevelLimits = new Map(PROGRESS_LEVELS.map(({ id, questionCount }) => [id, questionCount]));

export function createEmptyProgress() {
  return { version: 4, completedLevels: {}, completedMissionIds: [], collectedStarIds: [], challengeRecords: {} };
}

function isValidLevelRecord(record, maxStars) {
  return record
    && record.completed === true
    && Number.isInteger(record.bestStars)
    && record.bestStars >= 0
    && record.bestStars <= maxStars;
}

export function sanitizeProgress(value) {
  const empty = createEmptyProgress();
  if (!value || ![1, 2, 3, 4].includes(value.version) || typeof value.completedLevels !== 'object' || value.completedLevels === null || Array.isArray(value.completedLevels)) {
    return empty;
  }

  const completedLevels = Object.fromEntries(Object.entries(value.completedLevels)
    .filter(([id, record]) => progressLevelLimits.has(id) && isValidLevelRecord(record, progressLevelLimits.get(id)))
    .map(([id, record]) => [id, { completed: true, bestStars: record.bestStars }]));
  return {
    version: 4,
    completedLevels,
    completedMissionIds: value.version >= 2 ? sanitizeCompletedMissionIds(value.completedMissionIds) : [],
    collectedStarIds: value.version >= 3 && Array.isArray(value.collectedStarIds)
      ? [...new Set(value.collectedStarIds.filter((id) => DEMO_COLLECTIBLE_STAR_IDS.includes(id)))]
      : [],
    challengeRecords: sanitizeChallengeRecords(value.version >= 4 ? value.challengeRecords : null),
  };
}

function sanitizeChallengeRecords(records) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) return {};
  const record = records['thousands-secret'];
  if (!record || record.completed !== true || !Number.isInteger(record.bestScore) || record.bestScore < 0 || record.bestScore > 3) return {};
  return { 'thousands-secret': { completed: true, bestScore: record.bestScore } };
}

export function recordNumberSecretCompletion(progress, score) {
  const safeProgress = sanitizeProgress(progress);
  const boundedScore = Number.isFinite(score) ? Math.max(0, Math.min(3, Math.floor(score))) : 0;
  const previousBest = safeProgress.challengeRecords['thousands-secret']?.bestScore ?? 0;
  return {
    ...safeProgress,
    challengeRecords: {
      ...safeProgress.challengeRecords,
      'thousands-secret': { completed: true, bestScore: Math.max(previousBest, boundedScore) },
    },
  };
}

export function collectDemoStar(progress, starId) {
  const safeProgress = sanitizeProgress(progress);
  if (!DEMO_COLLECTIBLE_STAR_IDS.includes(starId) || safeProgress.collectedStarIds.includes(starId)) {
    return { progress: safeProgress, collected: false };
  }
  return {
    progress: { ...safeProgress, collectedStarIds: [...safeProgress.collectedStarIds, starId] },
    collected: true,
  };
}

export function readProgress(storage) {
  try {
    const serialized = storage?.getItem(DEMO_PROGRESS_KEY);
    if (!serialized) return createEmptyProgress();
    return sanitizeProgress(JSON.parse(serialized));
  } catch {
    return createEmptyProgress();
  }
}

export function isProgressStorageReadable(storage) {
  try {
    if (!storage) return false;
    storage.getItem(DEMO_PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}

export function recordDemoCompletion(progress, stars) {
  return recordLevelCompletion(progress, DEMO_LEVEL_ID, stars);
}

export function recordLevelCompletion(progress, levelId, stars) {
  const maxStars = progressLevelLimits.get(levelId);
  if (!maxStars) return sanitizeProgress(progress);
  const safeProgress = sanitizeProgress(progress);
  const boundedStars = Number.isFinite(stars)
    ? Math.max(0, Math.min(maxStars, Math.floor(stars)))
    : 0;
  const previousBest = safeProgress.completedLevels[levelId]?.bestStars ?? 0;
  return {
    ...safeProgress,
    completedLevels: {
      ...safeProgress.completedLevels,
      [levelId]: {
        completed: true,
        bestStars: Math.max(previousBest, boundedStars),
      },
    },
  };
}

export function writeProgress(storage, progress) {
  try {
    if (!storage) return false;
    storage.setItem(DEMO_PROGRESS_KEY, JSON.stringify(sanitizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}
