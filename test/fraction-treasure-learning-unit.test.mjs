import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FRACTION_TREASURE_LEARNING_UNIT as unit, validateFractionTreasureLearningUnit } from '../prototype/data/fractionTreasureLearningUnit.js';
import { createCandidateUnitSession, dispatchCandidateUnit, getCandidateQuestionAttempts, summarizeCandidateUnit, validateCandidateUnit } from '../prototype/learningUnitEngine.js';
import { MATH_LEVEL_DIRECTORY, getMathLevelDirectoryEntry } from '../prototype/data/mathLevelDirectory.js';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';
import { TEACHER_REVIEW_ACTIVITIES } from '../prototype/data/teacherReviewCatalog.js';
import activityMap from '../curriculum/learning-activity-map.json' with { type: 'json' };

test('分數候選題 ID、答案選項、分割模型與提示資料均一致', () => {
  assert.deepEqual(validateFractionTreasureLearningUnit(unit), []);
  assert.deepEqual(validateCandidateUnit(unit), []);
  assert.equal(unit.questions.length, 5);
  assert.equal(new Set(unit.questions.map(({ id }) => id)).size, 5);

  for (const question of unit.questions) {
    assert.equal(new Set(question.options.map(({ optionId }) => optionId)).size, question.options.length);
    assert.equal(new Set(question.options.map(({ text }) => text)).size, question.options.length);
    const answer = question.options.find(({ optionId }) => optionId === question.answerId);
    assert.ok(answer, question.id);
    assert.ok(question.explanation.includes('。'));
    assert.equal(question.hints.length, 2);
    assert.ok(question.wrongGuidance);
    assert.equal(question.remediationActivities, undefined);
    assert.ok(question.hints.every((hint) => !hint.includes(answer.text)), `${question.id} hint must not repeat correct option`);
    for (const model of question.visualization?.models ?? []) {
      assert.equal(model.parts.length, model.denominator);
      assert.equal(model.parts.filter(Boolean).length, model.numerator);
      assert.equal(model.partLengthUnits, model.wholeLengthUnits / model.denominator);
    }
    if (question.visualization?.models?.length > 1) {
      assert.equal(new Set(question.visualization.models.map(({ wholeId }) => wholeId)).size, 1);
      assert.equal(new Set(question.visualization.models.map(({ wholeLengthUnits }) => wholeLengthUnits)).size, 1);
    }
  }
});

test('五題預定答案與分數模型的分子、分母語意相符', () => {
  const [readFraction, denominatorMeaning, visualCompare, symbolicCompare, storyCompare] = unit.questions;
  assert.deepEqual(readFraction.answerValue, { numerator: 3, denominator: 5 });
  assert.deepEqual(readFraction.visualization.models[0].parts, [true, true, true, false, false]);
  assert.equal(denominatorMeaning.answerValue, 6);
  assert.match(denominatorMeaning.prompt, /2\/6/);
  assert.match(denominatorMeaning.prompt, /下面的 6/);
  assert.equal(denominatorMeaning.visualization.models[0].denominator, 6);
  assert.deepEqual(visualCompare.visualization.models.map(({ numerator, denominator }) => [numerator, denominator]), [[2, 6], [4, 6]]);
  assert.equal(visualCompare.answerValue, '乙');
  assert.equal(symbolicCompare.answerValue, '<');
  assert.deepEqual(storyCompare.visualization.models.map(({ numerator, denominator }) => [numerator, denominator]), [[2, 7], [5, 7]]);
  assert.equal(storyCompare.answerValue, '小安');
  assert.ok(unit.missingCoverage.some((item) => item.includes('加法')));
  assert.ok(unit.missingCoverage.some((item) => item.includes('和等於 1')));
});

test('候選作答使用共用引擎，重複提交受阻且結果不形成正式檢核', () => {
  let session = createCandidateUnitSession(unit, 'fraction-test-session');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  const first = dispatchCandidateUnit(session, unit, 'answer', { optionId: 'fraction-01-2-5', submissionId: 'fraction-submit-1' });
  assert.equal(first.event.result, 'incorrect');
  const duplicate = dispatchCandidateUnit(first.session, unit, 'answer', { optionId: 'fraction-01-3-5', submissionId: 'fraction-submit-1' });
  assert.equal(duplicate.changed, false);
  const retry = dispatchCandidateUnit(first.session, unit, 'retry').session;
  const correct = dispatchCandidateUnit(retry, unit, 'answer', { optionId: 'fraction-01-3-5', submissionId: 'fraction-submit-2' });
  assert.equal(correct.event.result, 'correct');
  assert.equal(correct.session.attempts.length, 2);
  assert.deepEqual(getCandidateQuestionAttempts(correct.session, unit.questions[0].id).map(({ selectedOptionId, result, attemptStage }) => ({ selectedOptionId, result, attemptStage })), [
    { selectedOptionId: 'fraction-01-2-5', result: 'incorrect', attemptStage: 'first_independent' },
    { selectedOptionId: 'fraction-01-3-5', result: 'correct', attemptStage: 'retry' },
  ]);
  assert.equal(correct.event.evidenceType, 'candidate_learning_unit_response_only');
  assert.deepEqual(summarizeCandidateUnit(correct.session).formalLearningCheck, 'not_assessed');
  assert.equal(summarizeCandidateUnit(correct.session).objectiveAchievement, 'not_assessed');
});

test('分數候選結果頁逐次呈現同題的重試作答階段與正誤', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const fractionRenderer = app.slice(app.indexOf('function renderFractionTreasureLearningUnit'), app.indexOf('function handleFractionTreasureLearningAction'));
  assert.match(fractionRenderer, /getCandidateQuestionAttempts\(session, question\.id\)/);
  assert.match(fractionRenderer, /attempt\.attemptStage/);
  assert.match(fractionRenderer, /attempt\.result === 'correct'/);
  assert.match(fractionRenderer, /作答歷程：\$\{history \|\| '未作答'\}/);
});

test('分數活動只列目錄候選入口，工作台題目 ID 與資料模組一致，沒有假補強', () => {
  const entry = getMathLevelDirectoryEntry(unit.levelId);
  assert.ok(entry);
  assert.equal(entry.runtime.availability, 'catalog_candidate');
  assert.equal(entry.publicationStatus, 'not_approved');
  assert.equal(entry.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(entry.questionCount, 5);
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === unit.levelId), false);
  assert.equal(MATH_LEVEL_DIRECTORY.some(({ levelId }) => levelId === unit.levelId), true);

  const reviewActivity = TEACHER_REVIEW_ACTIVITIES.find(({ activityId }) => activityId === unit.activityId);
  assert.ok(reviewActivity);
  assert.equal(reviewActivity.status, 'candidate_pending_teacher_review');
  assert.deepEqual(reviewActivity.questions.map(({ questionId }) => questionId), unit.questions.map(({ id }) => id));
  assert.ok(reviewActivity.questions.every(({ remediation }) => remediation === null));
  assert.ok(reviewActivity.questions.every(({ hints }) => hints.length === 2));

  const mapped = activityMap.activities.find(({ activityId }) => activityId === unit.activityId);
  assert.ok(mapped);
  assert.equal(mapped.reviewStatus, 'candidate_pending_teacher_review');
  assert.equal(mapped.learningCheck.passCondition, null);
  assert.equal(mapped.runtimeReference.kind, 'candidate_learning_unit_runtime');
});
