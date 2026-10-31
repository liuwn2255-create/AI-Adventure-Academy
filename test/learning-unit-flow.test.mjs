import test from 'node:test';
import assert from 'node:assert/strict';
import { NUMBER_SECRET_LEARNING_UNIT as unit } from '../prototype/data/numberSecretLearningUnit.js';
import { createNumberSecretLearningSession, dispatchLearningUnit, summarizeNumberSecretLearningSession, validateNumberSecretLearningUnit } from '../prototype/learningUnitFlow.js';
import { validateQuestionAttemptEvents } from '../scripts/learning-activity-map.mjs';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';

function run(session, action, payload) {
  const result = dispatchLearningUnit(session, action, payload);
  assert.equal(result.error, undefined);
  return result.session;
}

function reachPractice(session = createNumberSecretLearningSession('test-session')) {
  session = run(session, 'start');
  for (let index = 0; index < unit.lessonSteps.length; index += 1) session = run(session, 'lesson_next');
  return session;
}

function reachBlockPractice(session = reachPractice()) {
  for (const question of unit.practiceQuestions.slice(0, 3)) {
    session = run(session, 'practice_answer', { optionId: question.answerId });
    session = run(session, 'practice_next');
  }
  return session;
}

function reachCandidateCheckIntro(session) {
  for (let index = 0; index < unit.practiceQuestions.length; index += 1) {
    const question = unit.practiceQuestions[index];
    session = run(session, 'practice_answer', { optionId: question.answerId });
    session = run(session, 'practice_next');
  }
  return session;
}

function finishCheck(session, choices = unit.candidateCheckQuestions.map((question) => question.answerId)) {
  session = run(session, 'check_start');
  for (const answerId of choices) {
    session = run(session, 'check_answer', { optionId: answerId });
    session = run(session, 'check_next');
  }
  return session;
}

test('candidate learning-unit content has unique IDs, valid answer references, and stays unapproved', () => {
  assert.deepEqual(validateNumberSecretLearningUnit(), []);
  assert.equal(unit.formalUnitRef.status, 'candidate');
  assert.equal(unit.boundaries.formalLearningCheckApproved, false);
  assert.equal(unit.candidateCheckQuestions.length, 3);
  assert.ok(unit.learningDirections.some((item) => item.id === 'zero-placeholder' && item.status === 'pending_teacher_scope_review'));
});

test('content validator fails closed for missing activity data and missing error diagnosis', () => {
  assert.ok(validateNumberSecretLearningUnit({}).includes('learning_unit_activity_set_missing'));
  assert.ok(validateNumberSecretLearningUnit({ practiceQuestions: [null], candidateCheckQuestions: [], reinforcementActivities: [] }).includes('invalid_question_or_activity_record'));
  const malformed = structuredClone(unit);
  delete malformed.candidateCheckQuestions[0].options[1].errorType;
  assert.ok(validateNumberSecretLearningUnit(malformed).some((error) => error.startsWith('missing_error_diagnostic:')));
});

test('2,468 block visual is a guided-practice scaffold, not a candidate check or formal level question', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  assert.ok(question);
  assert.equal(question.status, 'candidate_pending_teacher_review');
  assert.equal(question.isIndependentCheck, false);
  assert.equal(question.evidenceType, 'candidate_guided_practice_only');
  assert.deepEqual(question.visualization.groups.map(({ place, quantity }) => [place, quantity]), [
    ['thousands', 2], ['hundreds', 4], ['tens', 6], ['ones', 8],
  ]);
  assert.deepEqual(question.visualization.groups.map(({ unitLabel }) => unitLabel), ['個千積木', '個百積木', '根十積木', '個小方塊']);
  const placeValues = new Map([['thousands', 1000], ['hundreds', 100], ['tens', 10], ['ones', 1]]);
  assert.equal(question.visualization.groups.reduce((sum, group) => sum + group.quantity * placeValues.get(group.place), 0), 2468);
  assert.deepEqual(question.visualization.table.digits, [2, 4, 6, 8]);
  assert.equal(question.visualization.table.status, 'teaching_scaffold_not_independent_check');
  assert.equal(unit.candidateCheckQuestions.some((item) => item.id === question.id), false);
  assert.equal(PLAYABLE_LEVELS.some((level) => level.questionSet.questions.some((item) => item.id === question.id)), false);
});

test('2,468 candidate records neutral error clues, routes to block reinforcement, and counts response classes once', () => {
  let session = reachBlockPractice();
  const question = unit.practiceQuestions[3];
  assert.equal(question.id, 'DRAFT-M3-NUM-01-01');
  const wrongId = question.options.find((item) => item.optionId !== question.answerId).optionId;
  session = run(session, 'practice_answer', { optionId: wrongId, submissionId: 'blocks-wrong-once' });
  assert.equal(session.practiceAttempts.at(-1).responseClass, 'incorrect');
  assert.match(session.lastFeedback.text, /不能判定原因/);
  const repeated = dispatchLearningUnit(session, 'practice_answer', { optionId: wrongId, submissionId: 'blocks-wrong-once' });
  assert.equal(repeated.changed, false);
  assert.equal(session.practiceAttempts.filter((event) => event.questionId === question.id).length, 1);
  session = run(session, 'remediation_start');
  const remediation = unit.reinforcementActivities.find((item) => item.activityId === session.remediationActivityId);
  assert.equal(remediation.errorType, 'possible_place_value_block_mapping');
  session = run(session, 'remediation_answer', { optionId: remediation.answerId });
  session = run(session, 'remediation_continue');
  session = run(session, 'practice_answer', { optionId: question.answerId, submissionId: 'blocks-correct-after-remediation' });
  assert.equal(session.practiceAttempts.at(-1).responseClass, 'correct_after_remediation');
  assert.equal(session.practiceAttempts.at(-1).attemptStage, 'after_remediation');
  assert.equal(unit.candidateCheckQuestions.length, 3);
  assert.equal(session.formalLearningCheck, 'not_assessed');
  assert.equal(session.objectiveAchievement, 'not_assessed');
});

test('2,468 candidate distinguishes first independent and hint-assisted correct responses', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  let independent = run(reachBlockPractice(), 'practice_answer', { optionId: question.answerId });
  assert.equal(independent.practiceAttempts.at(-1).responseClass, 'first_try_independent');
  assert.equal(independent.practiceAttempts.at(-1).attemptStage, 'first_independent');
  assert.equal(independent.practiceAttempts.at(-1).hintViewed, false);
  let assisted = run(reachBlockPractice(), 'practice_answer', { optionId: question.options[1].optionId });
  assisted = run(assisted, 'hint');
  assisted = run(assisted, 'practice_answer', { optionId: question.answerId });
  assert.equal(assisted.practiceAttempts.at(-1).responseClass, 'correct_after_hint');
  assert.equal(assisted.formalLearningCheck, 'not_assessed');
  assert.equal(assisted.objectiveAchievement, 'not_assessed');
});

test('candidate hint history persists after a hinted wrong answer and an unhinted retry', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  let session = run(reachBlockPractice(), 'hint');
  session = run(session, 'practice_answer', { optionId: question.options[1].optionId });
  const hintedWrong = session.practiceAttempts.at(-1);
  assert.equal(hintedWrong.attemptStage, 'after_hint');
  assert.equal(hintedWrong.hintViewed, true);
  assert.equal(hintedWrong.hintUse, 'hint_used');
  session = run(session, 'retry');
  session = run(session, 'practice_answer', { optionId: question.answerId });
  const retryCorrect = session.practiceAttempts.at(-1);
  assert.equal(retryCorrect.attemptStage, 'retry');
  assert.equal(retryCorrect.hintViewed, true);
  assert.equal(retryCorrect.hintUse, 'none');
});

test('original item and reinforcement attempts remain separately classified and summarized', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  let session = run(reachBlockPractice(), 'practice_answer', { optionId: question.options[1].optionId });
  const originalWrong = session.practiceAttempts.at(-1);
  session = run(session, 'remediation_start');
  const remediation = unit.reinforcementActivities.find((item) => item.activityId === session.remediationActivityId);
  session = run(session, 'remediation_answer', { optionId: remediation.answerId });
  const reinforcementCorrect = session.practiceAttempts.at(-1);
  session = run(session, 'remediation_continue');
  session = run(session, 'practice_answer', { optionId: question.answerId });
  const originalAfterRemediation = session.practiceAttempts.at(-1);

  assert.equal(originalWrong.activityId, unit.activityId);
  assert.equal(originalWrong.questionId, question.id);
  assert.equal(reinforcementCorrect.activityId, remediation.activityId);
  assert.equal(reinforcementCorrect.questionId, remediation.questionId);
  assert.equal(reinforcementCorrect.attemptStage, 'first_independent');
  assert.equal(originalAfterRemediation.activityId, unit.activityId);
  assert.equal(originalAfterRemediation.questionId, question.id);
  assert.equal(originalAfterRemediation.attemptStage, 'after_remediation');
  assert.equal(originalAfterRemediation.responseClass, 'correct_after_remediation');
  assert.equal(originalAfterRemediation.hintViewed, false);

  const summary = summarizeNumberSecretLearningSession(session);
  assert.equal(summary.practiceSummary.attemptCount, 5);
  assert.equal(summary.practiceSummary.firstTryIndependentCorrect, 3);
  assert.equal(summary.practiceSummary.correctAfterRemediation, 1);
  assert.equal(summary.practiceByQuestion[question.id].attemptCount, 2);
  assert.equal(summary.practiceByQuestion[question.id].firstTryIndependentCorrect, 0);
  assert.equal(summary.practiceByQuestion[question.id].correctAfterRemediation, 1);
  assert.equal(summary.reinforcementSummary.attemptCount, 1);
  assert.equal(summary.reinforcementSummary.firstTryIndependentCorrect, 1);
  assert.equal(summary.practiceAndReinforcementTotal, 6);
  assert.equal(summary.formalLearningCheck, 'not_assessed');
  assert.equal(summary.objectiveAchievement, 'not_assessed');
});

test('after-remediation stage takes precedence while immediate and cumulative hint use remain recorded', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  let session = run(reachBlockPractice(), 'practice_answer', { optionId: question.options[1].optionId });
  session = run(session, 'remediation_start');
  const remediation = unit.reinforcementActivities.find((item) => item.activityId === session.remediationActivityId);
  session = run(session, 'remediation_answer', { optionId: remediation.answerId });
  session = run(session, 'remediation_continue');
  session = run(session, 'hint');
  session = run(session, 'practice_answer', { optionId: question.answerId });
  const event = session.practiceAttempts.at(-1);
  assert.equal(event.attemptStage, 'after_remediation');
  assert.equal(event.hintViewed, true);
  assert.equal(event.hintUse, 'hint_used');
  assert.equal(event.responseClass, 'correct_after_remediation');
});

test('hint state is isolated per original and reinforcement question identity', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  let session = run(reachBlockPractice(), 'hint');
  session = run(session, 'practice_answer', { optionId: question.options[1].optionId });
  session = run(session, 'remediation_start');
  const remediation = unit.reinforcementActivities.find((item) => item.activityId === session.remediationActivityId);
  session = run(session, 'remediation_answer', { optionId: remediation.answerId });
  assert.equal(session.questionEvidence[`${unit.activityId}::${question.id}`].hintViewed, true);
  assert.equal(session.questionEvidence[`${remediation.activityId}::${remediation.questionId}`].hintViewed, false);
});

test('visible hint actions work before an answer and inside reinforcement without changing formal status', () => {
  const question = unit.practiceQuestions.find((item) => item.id === 'DRAFT-M3-NUM-01-01');
  let practice = run(reachBlockPractice(), 'hint');
  assert.equal(practice.phase, 'practice_retry');
  assert.equal(practice.currentHintVisible, true);
  practice = run(practice, 'practice_answer', { optionId: question.answerId });
  assert.equal(practice.practiceAttempts.at(-1).responseClass, 'correct_after_hint');

  let reinforcement = run(reachBlockPractice(), 'practice_answer', { optionId: question.options[1].optionId });
  reinforcement = run(reinforcement, 'remediation_start');
  reinforcement = run(reinforcement, 'hint');
  assert.equal(reinforcement.phase, 'remediation_retry');
  assert.equal(reinforcement.currentHintVisible, true);
  const activity = unit.reinforcementActivities.find((item) => item.activityId === reinforcement.remediationActivityId);
  reinforcement = run(reinforcement, 'remediation_answer', { optionId: activity.answerId });
  assert.equal(reinforcement.practiceAttempts.at(-1).responseClass, 'correct_after_hint');
  assert.equal(reinforcement.formalLearningCheck, 'not_assessed');
});

test('flow leads from goal introduction through visual lesson into scaffolded practice', () => {
  let session = createNumberSecretLearningSession('lesson-flow');
  assert.equal(session.phase, 'intro');
  session = run(session, 'start');
  assert.equal(session.phase, 'lesson');
  for (let index = 0; index < unit.lessonSteps.length; index += 1) session = run(session, 'lesson_next');
  assert.equal(session.phase, 'practice');
  assert.equal(session.practiceIndex, 0);
  assert.deepEqual(session.completedActivityIds, ['ACT-M3-NUM-PLACE-VALUE-CONCEPT-LESSON']);
});

test('wrong answer records a diagnostic, then hint-assisted correct remains distinct', () => {
  let session = reachPractice();
  const question = unit.practiceQuestions[0];
  const wrongId = question.options.find((option) => option.optionId !== question.answerId).optionId;
  session = run(session, 'practice_answer', { optionId: wrongId });
  assert.equal(session.phase, 'practice_feedback');
  assert.ok(session.lastErrorType);
  assert.equal(session.practiceAttempts[0].responseClass, 'incorrect');
  session = run(session, 'hint');
  assert.equal(session.phase, 'practice_retry');
  session = run(session, 'practice_answer', { optionId: question.answerId });
  assert.equal(session.phase, 'practice_answered');
  assert.equal(session.practiceAttempts[1].responseClass, 'correct_after_hint');
  const summary = summarizeNumberSecretLearningSession(session);
  assert.equal(summary.firstTryIndependentCorrect, 0);
  assert.equal(summary.correctAfterHint, 1);
  const knownIds = new Set([
    ...unit.practiceQuestions.map((item) => item.id),
    ...unit.candidateCheckQuestions.map((item) => item.id),
    ...unit.reinforcementActivities.map((item) => item.questionId),
  ]);
  assert.deepEqual(validateQuestionAttemptEvents(session.practiceAttempts, knownIds), []);
  assert.equal(session.objectiveAchievement, 'not_assessed');
});

test('first independent correct and retry correct are separately counted; duplicate submission is ignored', () => {
  let session = reachPractice();
  const first = unit.practiceQuestions[0];
  const wrong = first.options.find((item) => item.optionId !== first.answerId).optionId;
  session = run(session, 'practice_answer', { optionId: wrong, submissionId: 'same-submit' });
  const retry = dispatchLearningUnit(session, 'retry');
  session = retry.session;
  const repeated = dispatchLearningUnit(session, 'practice_answer', { optionId: first.answerId, submissionId: 'same-submit' });
  assert.equal(repeated.changed, false);
  session = run(session, 'practice_answer', { optionId: first.answerId, submissionId: 'new-submit' });
  session = run(session, 'practice_next');
  const second = unit.practiceQuestions[1];
  session = run(session, 'practice_answer', { optionId: second.answerId });
  const summary = summarizeNumberSecretLearningSession(session);
  assert.equal(summary.incorrectAttempts, 1);
  assert.equal(summary.correctAfterRetry, 1);
  assert.equal(summary.firstTryIndependentCorrect, 1);
  assert.equal(summary.activityCompleted, false);
});

test('practice can route by error type to reinforcement, then return to practice', () => {
  let session = reachPractice();
  for (const question of unit.practiceQuestions.slice(0, 2)) {
    session = run(session, 'practice_answer', { optionId: question.answerId });
    session = run(session, 'practice_next');
  }
  const question = unit.practiceQuestions[2];
  const wrongId = question.options.find((item) => item.optionId !== question.answerId).optionId;
  session = run(session, 'practice_answer', { optionId: wrongId });
  const errorType = session.lastErrorType;
  session = run(session, 'remediation_start');
  const activity = unit.reinforcementActivities.find((item) => item.errorType === errorType);
  assert.equal(session.remediationActivityId, activity.activityId);
  session = run(session, 'remediation_answer', { optionId: activity.answerId });
  assert.equal(session.phase, 'remediation_complete');
  session = run(session, 'remediation_continue');
  assert.equal(session.phase, 'practice');
  assert.equal(session.practiceIndex, 2);
  assert.ok(session.completedActivityIds.includes(activity.activityId));
});

test('all four number-secret remediation routes are executable, targeted by the source error type, and return to the original question', () => {
  assert.equal(unit.reinforcementActivities.length, 4);
  for (let targetIndex = 0; targetIndex < unit.practiceQuestions.length; targetIndex += 1) {
    let session = targetIndex >= 3 ? reachBlockPractice() : reachPractice();
    for (let index = targetIndex >= 3 ? 3 : 0; index < targetIndex; index += 1) {
      session = run(session, 'practice_answer', { optionId: unit.practiceQuestions[index].answerId });
      session = run(session, 'practice_next');
    }
    const source = unit.practiceQuestions[targetIndex];
    const wrongOption = source.options.find((option) => option.optionId !== source.answerId);
    const expectedErrorType = source.errorTypes[wrongOption.optionId];
    session = run(session, 'practice_answer', { optionId: wrongOption.optionId, submissionId: `remediation-route-${source.id}-wrong` });
    assert.equal(session.lastErrorType, expectedErrorType, source.id);
    session = run(session, 'remediation_start');
    const activity = unit.reinforcementActivities.find((item) => item.errorType === expectedErrorType);
    assert.ok(activity, `${source.id} must have a matching reinforcement activity`);
    assert.equal(session.remediationActivityId, activity.activityId, source.id);
    assert.equal(session.phase, 'remediation');
    assert.equal(session.lastFeedback, null, 'the correct answer is not shown before the learner responds');
    session = run(session, 'remediation_answer', { optionId: activity.answerId, submissionId: `remediation-route-${source.id}-support` });
    assert.equal(session.phase, 'remediation_complete');
    assert.equal(session.practiceAttempts.at(-1).activityId, activity.activityId);
    assert.equal(session.practiceAttempts.at(-1).questionId, activity.questionId);
    session = run(session, 'remediation_continue');
    assert.equal(session.phase, 'practice');
    assert.equal(session.practiceIndex, targetIndex);
    session = run(session, 'practice_answer', { optionId: source.answerId, submissionId: `remediation-route-${source.id}-return` });
    assert.equal(session.practiceAttempts.at(-1).activityId, unit.activityId);
    assert.equal(session.practiceAttempts.at(-1).questionId, source.id);
    assert.equal(session.practiceAttempts.at(-1).attemptStage, 'after_remediation');
    assert.equal(session.formalLearningCheck, 'not_assessed');
    assert.equal(session.objectiveAchievement, 'not_assessed');
  }
});

test('independent candidate check is separate from practice and duplicate answer submits cannot count twice', () => {
  let session = reachCandidateCheckIntro(reachPractice());
  session = run(session, 'check_start');
  const question = unit.candidateCheckQuestions[0];
  session = run(session, 'check_answer', { optionId: question.answerId, submissionId: 'check-unique' });
  const duplicate = dispatchLearningUnit(session, 'check_answer', { optionId: question.answerId, submissionId: 'check-unique' });
  assert.equal(duplicate.changed, false);
  assert.equal(summarizeNumberSecretLearningSession(session).candidateCheckAttemptCount, 1);
  session = run(session, 'check_next');
  assert.equal(session.checkIndex, 1);
  assert.equal(session.formalLearningCheck, 'not_assessed');
});

test('failed candidate check can use targeted remediation and start a separately numbered recheck', () => {
  let session = finishCheck(reachCandidateCheckIntro(reachPractice()), [
    unit.candidateCheckQuestions[0].answerId,
    unit.candidateCheckQuestions[1].options[0].optionId,
    unit.candidateCheckQuestions[2].answerId,
  ]);
  assert.equal(session.phase, 'check_result');
  assert.equal(session.checkResults[0].correctCount, 2);
  assert.equal(session.checkResults[0].status, 'candidate_check_result_only');
  assert.deepEqual(session.checkResults[0].responseCounts, {
    firstTryIndependentCorrect: 2,
    correctAfterHint: 0,
    correctAfterRetry: 0,
    correctAfterRemediation: 0,
    incorrect: 1,
  });
  assert.equal(session.objectiveAchievement, 'not_assessed');
  const errorType = session.checkResults[0].failedErrorTypes[0];
  session = run(session, 'remediation_start', { errorType });
  const activity = unit.reinforcementActivities.find((item) => item.errorType === errorType);
  session = run(session, 'remediation_answer', { optionId: activity.answerId });
  session = run(session, 'remediation_continue');
  assert.equal(session.phase, 'check_intro');
  assert.ok(session.completedActivityIds.includes('ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET'));
  session = finishCheck(session);
  assert.equal(session.checkResults.length, 2);
  assert.equal(session.checkResults[1].checkRun, 2);
  assert.equal(session.checkResults[1].correctCount, 3);
  assert.deepEqual(session.checkResults[1].responseCounts, {
    firstTryIndependentCorrect: 0,
    correctAfterHint: 0,
    correctAfterRetry: 2,
    correctAfterRemediation: 1,
    incorrect: 0,
  });
  assert.equal(session.formalLearningCheck, 'not_assessed');
});

test('insufficient or candidate-only evidence never marks formal check, objective, or chapter progress passed', () => {
  let session = finishCheck(reachCandidateCheckIntro(reachPractice()));
  session = run(session, 'review');
  const summary = summarizeNumberSecretLearningSession(session);
  assert.equal(summary.activityCompleted, true);
  assert.equal(summary.formalLearningCheck, 'not_assessed');
  assert.equal(summary.objectiveAchievement, 'not_assessed');
  assert.equal(session.activityCompletionEvents.length, new Set(session.activityCompletionEvents.map((event) => event.completionId)).size);
  assert.ok(summary.coverageGaps.some((gap) => gap.id === 'equivalent-representations'));
  assert.ok(summary.coverageGaps.some((gap) => gap.id === 'zero-placeholder'));
});

test('restart resets only the in-memory session; module has no persistence side effect', () => {
  let session = run(createNumberSecretLearningSession('restart-test'), 'start');
  session = dispatchLearningUnit(session, 'restart', { sessionId: 'restart-again' }).session;
  assert.equal(session.phase, 'intro');
  assert.equal(session.practiceAttempts.length, 0);
  assert.equal(session.checkAttempts.length, 0);
  assert.equal(session.objectiveAchievement, 'not_assessed');
  session = run(session, 'start');
  assert.equal(session.phase, 'lesson');
  assert.equal(session.lessonIndex, 0);
  assert.equal(session.practiceAttempts.length, 0);
  assert.equal(session.activityCompletionEvents.length, 0);
});
