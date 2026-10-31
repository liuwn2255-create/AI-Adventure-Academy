import { demoQuestionSet } from './demoQuestions.js';
import { numberSecretChallenge } from './numberSecretQuestions.js';
import { numberComparisonQuestionSet } from './numberComparisonQuestions.js';
import { getMathLevelDirectoryEntry } from './mathLevelDirectory.js';

export const PLACE_VALUE_LEVEL_ID = 'math-place-value-demo';
export const NUMBER_COMPARISON_LEVEL_ID = 'math-number-comparison-candidate';

const placeValueDirectoryEntry = getMathLevelDirectoryEntry(PLACE_VALUE_LEVEL_ID);
const numberSecretDirectoryEntry = getMathLevelDirectoryEntry('number-secret-challenge');
const numberComparisonDirectoryEntry = getMathLevelDirectoryEntry(NUMBER_COMPARISON_LEVEL_ID);

export const PLACE_VALUE_LEVEL = Object.freeze({
  id: PLACE_VALUE_LEVEL_ID,
  title: placeValueDirectoryEntry.title,
  description: '五題本機原型示範關卡。',
  reviewStatus: 'prototype_demo_only',
  unlockCondition: placeValueDirectoryEntry.runtime.unlockCondition,
  questionSet: demoQuestionSet,
  completionReward: Object.freeze({ type: 'mission_event', event: 'complete_place_value', evidence: Object.freeze({ levelComplete: true }) }),
  correctAnswerReward: Object.freeze({ type: 'mission_event', event: 'earn_star', evidence: Object.freeze({ starsEarned: 1 }) }),
});

export const NUMBER_SECRET_LEVEL = Object.freeze({
  id: 'number-secret-challenge',
  title: numberSecretChallenge.title,
  description: numberSecretChallenge.intro,
  reviewStatus: 'pending_teacher_review',
  unlockCondition: numberSecretDirectoryEntry.runtime.unlockCondition,
  questionSet: numberSecretChallenge,
  completionReward: Object.freeze({
    type: 'mission_event',
    event: 'complete_number_secret',
    evidence: Object.freeze({ questId: numberSecretChallenge.questId, challengeComplete: true }),
  }),
});

export const NUMBER_COMPARISON_LEVEL = Object.freeze({
  id: NUMBER_COMPARISON_LEVEL_ID,
  title: numberComparisonDirectoryEntry.title,
  description: '比較數字大小的獨立示範關卡；內容與年級進度待查證及教師審核。',
  reviewStatus: 'pending_teacher_review',
  curriculumReviewStatus: 'pending_verification',
  unlockCondition: numberComparisonDirectoryEntry.runtime.unlockCondition,
  questionSet: numberComparisonQuestionSet,
  completionReward: null,
});

export const PLAYABLE_LEVELS = Object.freeze([
  PLACE_VALUE_LEVEL,
  NUMBER_SECRET_LEVEL,
  NUMBER_COMPARISON_LEVEL,
]);

export const PROGRESS_LEVELS = Object.freeze(
  PLAYABLE_LEVELS.map(({ id, questionSet }) => Object.freeze({ id, questionCount: questionSet.questions.length })),
);
