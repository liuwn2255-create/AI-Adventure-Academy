import test from 'node:test';
import assert from 'node:assert/strict';
import { NUMBER_SECRET_V2_CANDIDATE_SET } from '../prototype/data/numberSecretLearningUnit.js';
import { NUMBER_COMPARISON_LEARNING_UNIT } from '../prototype/data/numberComparisonLearningUnit.js';
import {
  createCandidateUnitSession,
  dispatchCandidateUnit,
  getCandidateQuestionId,
  summarizeCandidateUnit,
  validateCandidateUnit,
} from '../prototype/learningUnitEngine.js';
import { readFile } from 'node:fs/promises';

function run(session, unit, action, payload = {}) {
  const result = dispatchCandidateUnit(session, unit, action, payload);
  assert.equal(result.error, undefined);
  assert.equal(result.changed, true);
  return result.session;
}

const comparisonAsUnit = NUMBER_COMPARISON_LEARNING_UNIT;
const secretV2AsUnit = {
  learningUnitId: NUMBER_SECRET_V2_CANDIDATE_SET.checkSetId,
  revision: NUMBER_SECRET_V2_CANDIDATE_SET.revision,
  activityId: NUMBER_SECRET_V2_CANDIDATE_SET.activityId,
  status: NUMBER_SECRET_V2_CANDIDATE_SET.status,
  formalAssessment: NUMBER_SECRET_V2_CANDIDATE_SET.formalAssessment,
  questions: NUMBER_SECRET_V2_CANDIDATE_SET.questions,
  startAtQuestion: true,
  hintPolicy: 'not_provided',
  remediationPolicy: 'not_provided',
};

test('shared candidate engine validates both units and keeps unit and question identifiers separate', () => {
  assert.deepEqual(validateCandidateUnit(comparisonAsUnit), []);
  assert.deepEqual(validateCandidateUnit(secretV2AsUnit), []);
  assert.equal(getCandidateQuestionId(comparisonAsUnit.questions[0]), 'comparison-demo-01');
  assert.equal(getCandidateQuestionId(secretV2AsUnit.questions[0]), 'V2-DRAFT-M3-NUM-01-01');
  assert.notEqual(comparisonAsUnit.learningUnitId, secretV2AsUnit.learningUnitId);
});

test('comparison unit completes intro, answer, feedback, result, summary, and replay through the shared engine', () => {
  let session = createCandidateUnitSession(comparisonAsUnit, 'comparison-shared-flow');
  assert.equal(session.phase, 'intro');
  session = run(session, comparisonAsUnit, 'start');
  for (const question of comparisonAsUnit.questions) {
    const wrong = question.options.find((option) => option.optionId !== question.answerId);
    session = run(session, comparisonAsUnit, 'answer', { optionId: wrong.optionId, submissionId: `${question.id}:answer` });
    assert.equal(session.phase, 'feedback');
    assert.equal(session.attempts.at(-1).result, 'incorrect');
    assert.equal(session.attempts.at(-1).questionId, question.id);
    session = run(session, comparisonAsUnit, 'next');
  }
  assert.equal(session.phase, 'result');
  assert.equal(session.attempts.length, 3);
  assert.deepEqual(summarizeCandidateUnit(session), {
    learningUnitId: comparisonAsUnit.learningUnitId,
    unitRevision: 1,
    activityId: comparisonAsUnit.activityId,
    attemptCount: 3,
    correctCount: 0,
    incorrectCount: 3,
    resultStatus: 'candidate_result_only_not_formal_assessment',
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  });
  session = run(session, comparisonAsUnit, 'restart', { sessionId: 'comparison-replay' });
  assert.equal(session.phase, 'intro');
  assert.equal(session.attempts.length, 0);
  assert.equal(session.objectiveAchievement, 'not_assessed');
});

test('comparison draft answers and explanations match the three distinct comparison cases', () => {
  const [sameThousands, zeroTens, thousandBoundary] = comparisonAsUnit.questions;
  assert.equal(sameThousands.id, 'comparison-demo-01');
  assert.equal(sameThousands.options.find(({ optionId }) => optionId === sameThousands.answerId)?.text, '3,425');
  assert.match(sameThousands.explanation, /百位.*4 個百.*2 個百/);

  assert.equal(zeroTens.id, 'comparison-demo-02');
  assert.equal(zeroTens.options.find(({ optionId }) => optionId === zeroTens.answerId)?.text, '5,206');
  assert.match(zeroTens.explanation, /十位的 0 比 6 小/);

  assert.equal(thousandBoundary.id, 'comparison-demo-03');
  assert.equal(thousandBoundary.options.find(({ optionId }) => optionId === thousandBoundary.answerId)?.text, '3,001');
  assert.match(thousandBoundary.explanation, /還不到 3 個千/);

  assert.equal(comparisonAsUnit.status, 'candidate_pending_teacher_review');
  assert.deepEqual(comparisonAsUnit.curriculumReviewStatus, 'pending_verification');
  assert.deepEqual(comparisonAsUnit.questions.map(({ hint, remediation }) => [hint ?? null, remediation ?? null]), [
    [null, null], [null, null], [null, null],
  ]);
});

test('shared engine rejects invalid answers and duplicate submissions without double-counting', () => {
  let session = createCandidateUnitSession(comparisonAsUnit, 'comparison-dedupe');
  session = run(session, comparisonAsUnit, 'start');
  const question = comparisonAsUnit.questions[0];
  assert.equal(dispatchCandidateUnit(session, comparisonAsUnit, 'answer', { optionId: 'missing' }).error, 'invalid_option');
  session = run(session, comparisonAsUnit, 'answer', { optionId: question.answerId, submissionId: 'one-only' });
  const duplicate = dispatchCandidateUnit(session, comparisonAsUnit, 'answer', { optionId: question.answerId, submissionId: 'one-only' });
  assert.equal(duplicate.changed, false);
  assert.equal(session.attempts.length, 1);
  assert.equal(dispatchCandidateUnit(session, comparisonAsUnit, 'next').changed, true);
});

test('the shared candidate engine has no persistence or formal progress side effects', async () => {
  const source = await readFile(new URL('../prototype/learningUnitEngine.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|writeProgress|recordLevelCompletion|recordNumberSecretCompletion/);
  let session = createCandidateUnitSession(comparisonAsUnit, 'comparison-isolation');
  session = run(session, comparisonAsUnit, 'start');
  session = run(session, comparisonAsUnit, 'answer', { optionId: comparisonAsUnit.questions[0].answerId });
  assert.equal(session.formalLearningCheck, 'not_assessed');
  assert.equal(session.objectiveAchievement, 'not_assessed');
  assert.equal(session.attempts[0].evidenceType, 'candidate_learning_unit_response_only');
});

test('comparison learning flow stays gated by the existing level unlock and reuses existing question data', async () => {
  const data = await readFile(new URL('../prototype/data/numberComparisonLearningUnit.js', import.meta.url), 'utf8');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  assert.match(data, /numberComparisonQuestionSet\.questions/);
  assert.match(app, /if \(!isLevelUnlocked\(NUMBER_COMPARISON_LEVEL, mapProgress\)\) return;/);
  assert.match(app, /試玩共用學習單元流程/);
  assert.match(html, /comparison-learning-unit-panel/);
  assert.match(app, /comparison_unit_answer/);
  assert.match(app, /不是正式檢核或學習目標達成證據/);
  const v2Flow = await readFile(new URL('../prototype/numberSecretV2CandidateFlow.js', import.meta.url), 'utf8');
  assert.match(v2Flow, /dispatchCandidateUnit\(session, unit, action, payload\)/);
});

