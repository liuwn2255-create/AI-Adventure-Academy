import test from 'node:test';
import assert from 'node:assert/strict';
import { countUnitSquares, SQUARE_CENTIMETER_AREA_LEARNING_UNIT as unit } from '../prototype/data/squareCentimeterAreaLearningUnit.js';
import { createCandidateUnitSession, dispatchCandidateUnit, summarizeCandidateUnit, validateCandidateUnit } from '../prototype/learningUnitEngine.js';
import { getMathLevelDirectoryEntry } from '../prototype/data/mathLevelDirectory.js';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';
import { TEACHER_REVIEW_ACTIVITIES } from '../prototype/data/teacherReviewCatalog.js';

test('面積候選單元資料完整、ID 唯一、選項正解及圖形方格數一致', () => {
  assert.deepEqual(validateCandidateUnit(unit), []);
  const ids = unit.questions.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const question of unit.questions) {
    assert.equal(new Set(question.options.map(({ optionId }) => optionId)).size, question.options.length);
    assert.equal(new Set(question.options.map(({ text }) => text)).size, question.options.length);
    assert.equal(question.options.filter(({ optionId }) => optionId === question.answerId).length, 1);
    assert.equal(question.hints.length, 2);
    assert.ok(question.wrongGuidance);
    assert.equal(question.remediationActivities, undefined);
    assert.doesNotMatch(`${question.hints.join(' ')} ${question.wrongGuidance}`, /12 平方公分|5 平方公分|乙花圃|1 平方公分$/, `${question.id} 提示不可直接洩漏答案`);
  }
  assert.equal(countUnitSquares(unit.questions[0].visualization.rows), 12);
  assert.equal(countUnitSquares(unit.questions[1].visualization.rows), 5);
  assert.equal(countUnitSquares(unit.questions[2].visualization.figures[0]), 6);
  assert.equal(countUnitSquares(unit.questions[2].visualization.figures[1]), 7);
  assert.equal(unit.questions[2].answerId, 'area-03-b');
  assert.equal(unit.questions[3].options.find(({ optionId }) => optionId === unit.questions[3].answerId).text, '1 平方公分');
  assert.equal(unit.questions.every(({ visualization }) => visualization.unitSideCm === 1), true);
  assert.equal(unit.status, 'candidate_pending_teacher_review');
  assert.equal(unit.formalAssessment, false);
});

test('面積單元沿用共用引擎作答、提示、重試、結果及重玩，且只保留記憶體候選證據', () => {
  let session = createCandidateUnitSession(unit, 'area-test-session');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  const hinted = dispatchCandidateUnit(session, unit, 'hint');
  session = hinted.session;
  const wrong = dispatchCandidateUnit(session, unit, 'answer', { optionId: 'area-01-9', submissionId: 'area-submit-1' });
  assert.equal(wrong.event.result, 'incorrect');
  assert.equal(wrong.event.evidenceType, 'candidate_learning_unit_response_only');
  assert.equal(wrong.event.activityId, unit.activityId);
  assert.equal(wrong.session.formalLearningCheck, 'not_assessed');
  const duplicate = dispatchCandidateUnit(wrong.session, unit, 'answer', { optionId: 'area-01-12', submissionId: 'area-submit-1' });
  assert.equal(duplicate.changed, false);
  const retry = dispatchCandidateUnit(wrong.session, unit, 'retry').session;
  const correct = dispatchCandidateUnit(retry, unit, 'answer', { optionId: 'area-01-12', submissionId: 'area-submit-2' });
  assert.equal(correct.event.result, 'correct');
  assert.equal(correct.session.attempts.length, 2);
  assert.equal(summarizeCandidateUnit(correct.session).objectiveAchievement, 'not_assessed');
  const restarted = dispatchCandidateUnit(correct.session, unit, 'restart', { sessionId: 'area-restarted' }).session;
  assert.equal(restarted.attempts.length, 0);
  assert.equal(restarted.phase, 'intro');
});

test('面積活動可供教師工作台檢視，但只在目錄候選入口，不加入正式可玩關卡', () => {
  const entry = getMathLevelDirectoryEntry(unit.levelId);
  assert.equal(entry.runtime.availability, 'catalog_candidate');
  assert.equal(entry.publicationStatus, 'not_approved');
  assert.equal(entry.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === unit.levelId), false);
  const reviewed = TEACHER_REVIEW_ACTIVITIES.find(({ activityId }) => activityId === unit.activityId);
  assert.ok(reviewed);
  assert.deepEqual(reviewed.questions.map(({ questionId }) => questionId), unit.questions.map(({ id }) => id));
  assert.ok(reviewed.questions.every(({ remediation }) => remediation === null));
});
