import test from 'node:test';
import assert from 'node:assert/strict';
import { NUMBER_COMPARISON_LEVEL, NUMBER_SECRET_LEVEL, PLACE_VALUE_LEVEL, PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';
import {
  advanceLevelQuestion,
  createLevelSession,
  isLevelUnlocked,
  retryLevelQuestion,
  submitLevelAnswer,
  validateLevel,
  validateQuestionSet,
} from '../prototype/levelEngine.js';
import { createEmptyProgress, recordLevelCompletion } from '../prototype/mapProgress.js';

test('關卡目錄資料各自具備有效識別、狀態、解鎖條件與題目', () => {
  const ids = PLAYABLE_LEVELS.map((level) => level.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const level of PLAYABLE_LEVELS) assert.deepEqual(validateLevel(level), []);
  assert.equal(NUMBER_SECRET_LEVEL.reviewStatus, 'pending_teacher_review');
  assert.equal(NUMBER_COMPARISON_LEVEL.reviewStatus, 'pending_teacher_review');
  assert.equal(NUMBER_COMPARISON_LEVEL.curriculumReviewStatus, 'pending_verification');
  assert.equal(NUMBER_COMPARISON_LEVEL.questionSet.datasetStatus, 'prototype_demo_pending_teacher_review');
});

test('關卡驗證會拒絕重複識別碼、無效答案參照及未定義題組', () => {
  const duplicateOptionSet = {
    questions: [{ id: 'q', prompt: '題目', options: [{ optionId: 'x', text: '甲' }, { optionId: 'x', text: '乙' }], answerId: 'x', explanation: '說明' }],
  };
  assert.ok(validateQuestionSet(duplicateOptionSet).includes('question_1_option_invalid_or_duplicate'));
  assert.ok(validateQuestionSet({ questions: [{ id: 'q', prompt: '題目', options: [{ optionId: 'x', text: '甲' }, { optionId: 'y', text: '乙' }], answerId: 'z', explanation: '說明' }] }).includes('question_1_answer_reference_invalid'));
  assert.ok(validateLevel({ id: 'broken', title: '缺題目', description: '測試', reviewStatus: 'prototype_demo_only', unlockCondition: { type: 'always' } }).includes('level_question_set_missing'));
});

test('比較關卡在位值關卡完成前鎖定，完成後解鎖；不會因徽章以外條件誤開', () => {
  const empty = createEmptyProgress();
  assert.equal(isLevelUnlocked(NUMBER_COMPARISON_LEVEL, empty), false);
  const completed = recordLevelCompletion(empty, PLACE_VALUE_LEVEL.id, 2);
  assert.equal(isLevelUnlocked(NUMBER_COMPARISON_LEVEL, completed), true);
});

test('共用答題流程支援不同題數、固定判分、解析所需資料及完成條件', () => {
  const [question] = NUMBER_COMPARISON_LEVEL.questionSet.questions;
  const initial = createLevelSession(NUMBER_COMPARISON_LEVEL.questionSet.questions.length);
  const correct = submitLevelAnswer(initial, question, question.answerId);
  assert.equal(correct.isCorrect, true);
  assert.equal(correct.state.score, 1);
  assert.equal(submitLevelAnswer(correct.state, question, question.answerId).changed, false);
  let state = correct.state;
  for (let index = 1; index < NUMBER_COMPARISON_LEVEL.questionSet.questions.length; index += 1) {
    state = advanceLevelQuestion(state, NUMBER_COMPARISON_LEVEL.questionSet.questions.length);
    state = submitLevelAnswer(state, NUMBER_COMPARISON_LEVEL.questionSet.questions[index], 'wrong').state;
  }
  state = advanceLevelQuestion(state, NUMBER_COMPARISON_LEVEL.questionSet.questions.length);
  assert.equal(state.complete, true);
  assert.equal(state.score, 1);
});

test('錯答可在不改變得分與題序下重試；答對題不能以重試重複計分', () => {
  const [question] = PLACE_VALUE_LEVEL.questionSet.questions;
  const initial = createLevelSession(PLACE_VALUE_LEVEL.questionSet.questions.length);
  const wrong = submitLevelAnswer(initial, question, 'incorrect-option');
  const retried = retryLevelQuestion(wrong.state);
  assert.equal(retried.answered, false);
  assert.equal(retried.questionIndex, 0);
  assert.equal(retried.score, 0);
  assert.equal(retryLevelQuestion(retried), retried);
  const correct = submitLevelAnswer(retried, question, question.answerId);
  assert.equal(correct.state.score, 1);
  assert.equal(retryLevelQuestion(correct.state), correct.state);
});
