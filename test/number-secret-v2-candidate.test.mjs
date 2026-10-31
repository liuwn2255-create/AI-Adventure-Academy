import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NUMBER_SECRET_LEARNING_UNIT, NUMBER_SECRET_V2_CANDIDATE_SET } from '../prototype/data/numberSecretLearningUnit.js';
import {
  createNumberSecretV2CandidateSession,
  createNumberSecretV2TeacherExport,
  dispatchNumberSecretV2Candidate,
  summarizeNumberSecretV2CandidateSession,
  validateNumberSecretV2CandidateSet,
} from '../prototype/numberSecretV2CandidateFlow.js';

function dispatch(session, action, payload) {
  const result = dispatchNumberSecretV2Candidate(session, action, payload);
  assert.equal(result.error, undefined);
  assert.equal(result.changed, true);
  return result.session;
}

test('V2 candidate set has an isolated draft identity and contains only draft questions 1 and 2', () => {
  assert.deepEqual(validateNumberSecretV2CandidateSet(), []);
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.checkSetId, 'CHECKSET-DRAFT-M3-NUM-01-V2-PILOT');
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.revision, 2);
  assert.deepEqual(NUMBER_SECRET_V2_CANDIDATE_SET.questions.map((question) => question.draftId), [
    'V2-DRAFT-M3-NUM-01-01',
    'V2-DRAFT-M3-NUM-01-02',
  ]);
  assert.ok(NUMBER_SECRET_V2_CANDIDATE_SET.questions.every((question) => question.status === 'candidate_pending_teacher_review'));
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.formalAssessment, false);
});

test('V2 draft questions exactly match the design prompts, choices, answer IDs, and explanations', () => {
  const [placeName, valueAmount] = NUMBER_SECRET_V2_CANDIDATE_SET.questions;
  assert.equal(placeName.prompt, '在 4,372 中，數字 7 在哪一位？');
  assert.deepEqual(placeName.options.map((option) => option.text), ['個位', '十位', '百位', '千位']);
  assert.equal(placeName.options.find((option) => option.optionId === placeName.answerId)?.text, '十位');
  assert.match(placeName.explanation, /個位、十位、百位、千位/);
  assert.equal(valueAmount.prompt, '在 5,284 中，數字 8 代表多少？');
  assert.deepEqual(valueAmount.options.map((option) => option.text), ['8', '80', '800', '8,000']);
  assert.equal(valueAmount.options.find((option) => option.optionId === valueAmount.answerId)?.text, '80');
  assert.match(valueAmount.explanation, /8 個十是 80/);
});

test('Q3 has a complete structured place-value-table preview but is not answerable or active', () => {
  const q3 = NUMBER_SECRET_V2_CANDIDATE_SET.deferredQuestions[0];
  assert.equal(q3.draftId, 'V2-DRAFT-M3-NUM-01-03');
  assert.equal(q3.enabled, false);
  assert.equal(q3.status, 'disabled_pending_teacher_confirmation');
  assert.deepEqual(q3.table.columns, ['千位', '百位', '十位', '個位']);
  assert.deepEqual(q3.table.digits, [3, 1, 4, 2]);
  assert.deepEqual(q3.options.map((option) => option.text), ['3,124', '3,142', '3,412', '1,342']);
  assert.equal(q3.options.find((option) => option.optionId === q3.answerId)?.text, '3,142');
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.questions.some((question) => question.draftId === q3.draftId), false);
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.questions.length, 2);
});

test('Q4 remains blocked until the teacher evidence and review gate is resolved', () => {
  const q4 = NUMBER_SECRET_V2_CANDIDATE_SET.disabledConditionalQuestions[0];
  assert.equal(q4.draftId, 'V2-DRAFT-M3-NUM-01-04');
  assert.equal(q4.enabled, false);
  assert.equal(q4.status, 'disabled_pending_teacher_approval');
  assert.ok(q4.requiredTeacherEvidence.some((item) => item.includes('加法')));
  assert.ok(q4.requiredTeacherEvidence.some((item) => item.includes('審查者')));
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.questions.some((question) => question.draftId === q4.draftId), false);
});

test('validation rejects activating Q3 without teacher confirmation or Q4 without approval gate', () => {
  const q3Enabled = structuredClone(NUMBER_SECRET_V2_CANDIDATE_SET);
  q3Enabled.deferredQuestions[0].enabled = true;
  assert.ok(validateNumberSecretV2CandidateSet(q3Enabled).includes('v2_deferred_question_must_remain_disabled:V2-DRAFT-M3-NUM-01-03'));
  const q4Enabled = structuredClone(NUMBER_SECRET_V2_CANDIDATE_SET);
  q4Enabled.disabledConditionalQuestions[0].enabled = true;
  assert.ok(validateNumberSecretV2CandidateSet(q4Enabled).includes('v2_question_04_must_remain_disabled_until_teacher_approval'));
});

test('existing practice and three-question candidate check are retained unchanged and separate from V2', () => {
  assert.deepEqual(NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.slice(0, 3).map((question) => question.id), [
    'secret-thousands-01', 'secret-thousands-02', 'secret-thousands-03',
  ]);
  assert.equal(NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.some((question) => question.id === 'DRAFT-M3-NUM-01-01'), true);
  assert.deepEqual(NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.map((question) => question.id), [
    'CAND-CHECK-M3-NUM-01-01', 'CAND-CHECK-M3-NUM-01-02', 'CAND-CHECK-M3-NUM-01-03',
  ]);
  assert.equal(NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.some((question) => question.id.startsWith('V2-DRAFT-')), false);
});

test('candidate flow records correct and incorrect responses under its own activity, set, and draft IDs', () => {
  const [first, second] = NUMBER_SECRET_V2_CANDIDATE_SET.questions;
  let session = createNumberSecretV2CandidateSession('v2-flow-test');
  const wrongOption = first.options.find((option) => option.optionId !== first.answerId);
  session = dispatch(session, 'answer', { optionId: wrongOption.optionId, submissionId: 'v2-submit-1' });
  assert.deepEqual(session.attempts[0], {
    eventSequence: 1,
    occurredAt: session.attempts[0].occurredAt,
    submissionId: 'v2-submit-1',
      learningUnitId: NUMBER_SECRET_V2_CANDIDATE_SET.checkSetId,
      unitRevision: 2,
    activityId: NUMBER_SECRET_V2_CANDIDATE_SET.activityId,
    checkSetId: NUMBER_SECRET_V2_CANDIDATE_SET.checkSetId,
    setRevision: 2,
    questionId: first.draftId,
    draftId: first.draftId,
    selectedOptionId: wrongOption.optionId,
    result: 'incorrect',
    attemptNumber: 1,
    attemptStage: 'first_independent',
    hintUse: 'none',
    hintViewed: false,
    hintLevelAtSubmission: 0,
    remediationCompleted: false,
    errorType: first.errorTypes[wrongOption.optionId],
    evidenceType: 'candidate_v2_trial_response_only',
  });
  assert.ok(Number.isFinite(Date.parse(session.attempts[0].occurredAt)));
  session = dispatch(session, 'next');
  assert.equal(session.phase, 'question');
  session = dispatch(session, 'answer', { optionId: second.answerId, submissionId: 'v2-submit-2' });
  assert.equal(session.attempts[1].questionId, second.draftId);
  assert.equal(session.attempts[1].result, 'correct');
  session = dispatch(session, 'next');
  assert.equal(session.phase, 'result');
  assert.deepEqual(summarizeNumberSecretV2CandidateSession(session), {
    checkSetId: NUMBER_SECRET_V2_CANDIDATE_SET.checkSetId,
    setRevision: 2,
    attemptCount: 2,
    correctCount: 1,
    incorrectCount: 1,
    status: 'candidate_result_only_not_formal_assessment',
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  });
});

test('duplicate submission cannot be counted twice and the candidate module has no persistence calls', async () => {
  const first = NUMBER_SECRET_V2_CANDIDATE_SET.questions[0];
  let session = createNumberSecretV2CandidateSession('v2-dedupe-test');
  session = dispatch(session, 'answer', { optionId: first.answerId, submissionId: 'same-v2-submission' });
  const duplicate = dispatchNumberSecretV2Candidate(session, 'answer', { optionId: first.answerId, submissionId: 'same-v2-submission' });
  assert.equal(duplicate.changed, false);
  assert.equal(session.attempts.length, 1);
  const flowSource = await readFile(new URL('../prototype/numberSecretV2CandidateFlow.js', import.meta.url), 'utf8');
  assert.doesNotMatch(flowSource, /localStorage|writeProgress|recordLevelCompletion|recordNumberSecretCompletion/);
});

test('candidate trial record includes an anonymous session code, ordered response evidence, and no direct identifiers', () => {
  const [first, second] = NUMBER_SECRET_V2_CANDIDATE_SET.questions;
  let session = createNumberSecretV2CandidateSession('candidate-trial-test');
  const observationCode = session.observationCode;
  session = dispatch(session, 'technical_issue', { issueCode: 'touch_input' });
  session = dispatch(session, 'answer', { optionId: first.answerId, submissionId: 'trial-submit-1' });
  session = dispatch(session, 'next');
  session = dispatch(session, 'answer', { optionId: second.answerId, submissionId: 'trial-submit-2' });
  session = dispatch(session, 'next');

  const result = createNumberSecretV2TeacherExport(session);
  assert.equal(result.ok, true);
  const { record } = result;
  assert.equal(record.observationCode, observationCode);
  assert.equal(record.useStatus, 'development_test_only_student_pilot_requires_teacher_authorization');
  assert.equal(record.directStudentIdentifiersCollected, false);
  assert.equal(record.persistentStorageUsed, false);
  assert.match(record.hintAndRemediationObservation, /hint_viewed_and_level/);
  assert.match(record.hintAndRemediationObservation, /remediation_not_provided/);
  assert.deepEqual(record.events.map((event) => event.eventSequence), [1, 2, 3]);
  assert.deepEqual(record.events.map((event) => event.eventType), ['technical_issue', 'response', 'response']);
  assert.equal(record.events[1].attemptStage, 'first_independent');
  assert.equal(record.events[1].hintViewed, false);
  assert.equal(record.events[1].remediationCompleted, false);
  assert.ok(Number.isFinite(Date.parse(record.createdAt)));
  assert.ok(Number.isFinite(Date.parse(record.completedAt)));
  assert.equal(Object.hasOwn(record, 'studentName'), false);
  assert.equal(Object.hasOwn(record, 'studentId'), false);
});

test('teacher export is unavailable before completion and rejects unrecognized operation issue codes', () => {
  const session = createNumberSecretV2CandidateSession('unfinished-candidate-trial');
  assert.deepEqual(createNumberSecretV2TeacherExport(session), {
    ok: false,
    error: 'candidate_trial_must_be_completed_before_export',
  });
  const invalid = dispatchNumberSecretV2Candidate(session, 'technical_issue', { issueCode: 'student_name' });
  assert.equal(invalid.changed, false);
  assert.equal(invalid.error, 'invalid_technical_issue_code');
});

test('candidate actions cannot alter the existing learning unit or formal achievement state', () => {
  const before = structuredClone(NUMBER_SECRET_LEARNING_UNIT);
  let session = createNumberSecretV2CandidateSession('v2-no-formal-side-effects');
  for (const question of NUMBER_SECRET_V2_CANDIDATE_SET.questions) {
    session = dispatch(session, 'answer', { optionId: question.answerId });
    session = dispatch(session, 'next');
  }
  assert.deepEqual(NUMBER_SECRET_LEARNING_UNIT, before);
  assert.equal(summarizeNumberSecretV2CandidateSession(session).formalLearningCheck, 'not_assessed');
  assert.equal(summarizeNumberSecretV2CandidateSession(session).objectiveAchievement, 'not_assessed');
});

test('the candidate preview is reachable only through an explicit, visibly labelled prototype action', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(app, /開啟第二版候選試作（僅開發測試）/);
  assert.match(app, /候選試作，尚未經教師核准/);
  assert.match(app, /createNumberSecretV2CandidateSession/);
  assert.match(app, /題 3 候選預覽・尚未啟用，不能作答/);
  assert.match(app, /renderNumberSecretV2DeferredQuestionPreview/);
  const previewRenderer = app.slice(app.indexOf('function renderNumberSecretV2DeferredQuestionPreview'), app.indexOf('function dispatchNumberSecretV2CandidateAction'));
  assert.doesNotMatch(previewRenderer, /learningButton\(|data-learning-action/);
  assert.match(previewRenderer, /v2-place-value-table/);
  assert.match(app, /教師匯出本次匿名候選測試紀錄/);
  assert.match(app, /v2_candidate_log_issue/);
  assert.match(app, /createObjectURL/);
});
