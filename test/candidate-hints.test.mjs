import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPACITY_READING_LEARNING_UNIT,
} from '../prototype/data/capacityReadingLearningUnit.js';
import { INTEGER_NUMBER_LINE_LEARNING_UNIT } from '../prototype/data/integerNumberLineLearningUnit.js';
import { MILLIMETER_RULER_LEARNING_UNIT } from '../prototype/data/millimeterRulerLearningUnit.js';
import { NUMBER_COMPARISON_LEARNING_UNIT } from '../prototype/data/numberComparisonLearningUnit.js';
import { NUMBER_SECRET_V2_CANDIDATE_SET } from '../prototype/data/numberSecretLearningUnit.js';
import { WEIGHT_KG_G_LEARNING_UNIT } from '../prototype/data/weightKgGLearningUnit.js';
import { createCandidateUnitSession, dispatchCandidateUnit, validateCandidateUnit } from '../prototype/learningUnitEngine.js';
import { dispatchNumberSecretV2Candidate, createNumberSecretV2CandidateSession } from '../prototype/numberSecretV2CandidateFlow.js';
import { TEACHER_REVIEW_ACTIVITIES } from '../prototype/data/teacherReviewCatalog.js';

const units = [
  NUMBER_COMPARISON_LEARNING_UNIT,
  CAPACITY_READING_LEARNING_UNIT,
  INTEGER_NUMBER_LINE_LEARNING_UNIT,
  MILLIMETER_RULER_LEARNING_UNIT,
  WEIGHT_KG_G_LEARNING_UNIT,
];

test('五類候選單元每題都有兩層安全提示與對應錯答引導，補強未提供狀態清楚', () => {
  for (const unit of units) {
    assert.equal(unit.hintPolicy, 'per_question', unit.activityId);
    assert.equal(unit.remediationPolicy, 'not_provided', unit.activityId);
    assert.deepEqual(validateCandidateUnit(unit), [], unit.activityId);
    for (const question of unit.questions) {
      assert.equal(question.hints.length, 2, question.id);
      assert.ok(question.wrongGuidance?.length, question.id);
      const answerText = question.options.find((option) => option.optionId === question.answerId)?.text;
      assert.ok(answerText, question.id);
      for (const hint of question.hints) assert.notEqual(hint.trim(), answerText, `${question.id} hint reveals complete answer`);
    }
  }
});

test('V2 Q1/Q2 expose two hints, preserve candidate state, and keep Q3 preview and Q4 disabled', () => {
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.questions.length, 2);
  for (const question of NUMBER_SECRET_V2_CANDIDATE_SET.questions) {
    assert.equal(question.hints.length, 2);
    assert.ok(question.wrongGuidance);
    assert.equal(question.status, 'candidate_pending_teacher_review');
  }
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.deferredQuestions[0].enabled, false);
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.disabledConditionalQuestions[0].enabled, false);
});

test('shared candidate engine records viewed hint level, gives question-specific wrong guidance, allows retry and deduplicates', () => {
  const unit = NUMBER_COMPARISON_LEARNING_UNIT;
  let session = createCandidateUnitSession(unit, 'hint-retry-test');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  const q = unit.questions[0];
  const wrong = q.options.find((option) => option.optionId !== q.answerId);
  let result = dispatchCandidateUnit(session, unit, 'answer', { optionId: wrong.optionId, submissionId: 'answer-1' });
  session = result.session;
  assert.equal(result.event.attemptStage, 'first_independent');
  assert.equal(result.event.hintViewed, false);
  assert.equal(session.lastFeedback.text, q.wrongGuidance);

  session = dispatchCandidateUnit(session, unit, 'retry').session;
  result = dispatchCandidateUnit(session, unit, 'hint');
  session = result.session;
  assert.equal(result.hint.level, 1);
  result = dispatchCandidateUnit(session, unit, 'hint');
  session = result.session;
  assert.equal(result.hint.level, 2);
  assert.equal(dispatchCandidateUnit(session, unit, 'hint').error, 'no_more_hints');

  result = dispatchCandidateUnit(session, unit, 'answer', { optionId: q.answerId, submissionId: 'answer-2' });
  session = result.session;
  assert.equal(result.event.attemptStage, 'retry');
  assert.equal(result.event.hintViewed, true);
  assert.equal(result.event.hintUse, 'level_2');
  const duplicate = dispatchCandidateUnit(session, unit, 'answer', { optionId: q.answerId, submissionId: 'answer-2' });
  assert.equal(duplicate.changed, false);
  assert.equal(session.attempts.length, 2);
});

test('V2 candidate wrapper supports hints and retry without writing formal progress', () => {
  let session = createNumberSecretV2CandidateSession('v2-hints-test');
  const question = NUMBER_SECRET_V2_CANDIDATE_SET.questions[0];
  let result = dispatchNumberSecretV2Candidate(session, 'hint');
  session = result.session;
  assert.equal(result.hint.questionId, question.draftId);
  const wrong = question.options.find((option) => option.optionId !== question.answerId);
  result = dispatchNumberSecretV2Candidate(session, 'answer', { optionId: wrong.optionId, submissionId: 'v2-wrong' });
  session = result.session;
  assert.equal(result.event.attemptStage, 'after_hint');
  assert.equal(result.event.hintViewed, true);
  assert.equal(result.session.lastFeedback.text, question.wrongGuidance);
  session = dispatchNumberSecretV2Candidate(session, 'retry').session;
  result = dispatchNumberSecretV2Candidate(session, 'answer', { optionId: question.answerId, submissionId: 'v2-retry' });
  session = result.session;
  assert.equal(result.event.attemptStage, 'retry');
  assert.equal(session.formalLearningCheck, 'not_assessed');
  assert.equal(session.objectiveAchievement, 'not_assessed');
  assert.equal(session.attempts.length, 2);
});

test('V2 Q1/Q2 explicitly have no remediation route and reject remediation actions', () => {
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.remediationPolicy, 'not_provided');
  let session = createNumberSecretV2CandidateSession('v2-no-remediation-route');
  const result = dispatchNumberSecretV2Candidate(session, 'remediation_start');
  assert.equal(result.changed, false);
  assert.equal(result.error, 'invalid_session_or_action');
  assert.deepEqual(session.attempts, []);
});

test('UI exposes hints and retry only as candidate practice; no automatic remediation is claimed', async () => {
  const { readFile } = await import('node:fs/promises');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const workbench = await readFile(new URL('../prototype/teacherReviewWorkbench.js', import.meta.url), 'utf8');
  assert.match(app, /appendCandidateHint\(content, session, question, addAction\)/);
  assert.match(app, /再想一次/);
  assert.match(app, /候選作答線索/);
  assert.match(workbench, /分層提示/);
  assert.match(workbench, /尚未提供題目層級引導/);
  for (const activity of TEACHER_REVIEW_ACTIVITIES) {
    for (const question of activity.questions) {
      if (!question.reviewable || !question.hints.length) continue;
      assert.ok(question.wrongGuidance || Object.keys(question.errorGuidance ?? {}).length, `${question.questionId} review guidance`);
      assert.match(workbench, /分層提示/);
    }
  }
  assert.match(app, /圖中顯示水面位置，請對照刻度判讀/);
  assert.match(app, /請依刻度判讀位置/);
  assert.match(app, /本次作答 \$\{summary\.attemptCount\} 次：答對/);
  assert.doesNotMatch(app, /\$\{summary\.attemptCount\} 個情境/);
  assert.doesNotMatch(app, /\$\{summary\.attemptCount\} 題/);
});
