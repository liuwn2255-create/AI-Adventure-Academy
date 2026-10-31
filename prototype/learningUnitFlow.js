import { NUMBER_SECRET_LEARNING_UNIT as unit } from './data/numberSecretLearningUnit.js';

const nowIso = () => new Date().toISOString();
const clone = (value) => structuredClone(value);
const LESSON_ACTIVITY_ID = 'ACT-M3-NUM-PLACE-VALUE-CONCEPT-LESSON';
const PRACTICE_ACTIVITY_ID = 'ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET';
const CHECK_ACTIVITY_ID = 'ACT-M3-NUM-PLACE-VALUE-CANDIDATE-LEARNING-CHECK';
const questionStateKey = (activityId, questionId) => `${activityId}::${questionId}`;

function getQuestionState(state, activityId, questionId) {
  const key = questionStateKey(activityId, questionId);
  state.questionEvidence ??= {};
  state.questionEvidence[key] ??= { activityId, questionId, hintViewed: false, attemptCount: 0, afterRemediationPending: false };
  return state.questionEvidence[key];
}

function resolveAttemptStage(questionState, hintUsed) {
  // Remediation context has priority; hintUse still records an immediately used hint.
  if (questionState.afterRemediationPending) return 'after_remediation';
  if (hintUsed) return 'after_hint';
  if (questionState.attemptCount > 0) return 'retry';
  return 'first_independent';
}

function responseClassFor(isCorrect, attemptStage) {
  if (!isCorrect) return 'incorrect';
  return ({
    first_independent: 'first_try_independent',
    after_hint: 'correct_after_hint',
    retry: 'correct_after_retry',
    after_remediation: 'correct_after_remediation',
  })[attemptStage];
}

function currentQuestionContext(state) {
  if (['practice', 'practice_retry', 'practice_feedback', 'practice_answered'].includes(state.phase)) {
    const question = currentPracticeQuestion(state);
    return question ? { activityId: unit.activityId, questionId: question.id } : null;
  }
  if (['remediation', 'remediation_retry', 'remediation_feedback', 'remediation_complete'].includes(state.phase)) {
    const activity = currentRemediation(state);
    return activity ? { activityId: activity.activityId, questionId: activity.questionId } : null;
  }
  return null;
}

function completeActivity(state, activityId) {
  if (state.completedActivityIds.includes(activityId)) return;
  state.completedActivityIds.push(activityId);
  state.activityCompletionEvents.push({
    completionId: `${state.sessionId}:completion:${activityId}`,
    activityId,
    completedAt: nowIso(),
    evidenceType: 'prototype_activity_completion_only',
  });
}

export function createNumberSecretLearningSession(sessionId = `learning-session-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`) {
  return {
    sessionId,
    learningUnitId: unit.learningUnitId,
    unitRevision: unit.revision,
    phase: 'intro',
    lessonIndex: 0,
    practiceIndex: 0,
    practiceAttempts: [],
    questionEvidence: {},
    checkRun: 0,
    checkIndex: 0,
    checkAttempts: [],
    checkAnswered: false,
    remediationActivityId: null,
    remediationReturn: null,
    remediationAttempt: 0,
    remediationSource: null,
    currentHintVisible: false,
    lastErrorType: null,
    lastFeedback: null,
    completedActivityIds: [],
    completionRecorded: false,
    usedSubmissionIds: [],
    attemptSequence: 0,
    checkResults: [],
    activityCompletionEvents: [],
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  };
}

function addAttempt(state, { activityId, questionId, optionId, isCorrect, hintUsed, hintViewed, attemptStage, errorType, kind, attemptNumber }) {
  if (state.usedSubmissionIds.includes(optionId?.submissionId)) return false;
  const sequence = state.attemptSequence + 1;
  const submissionId = optionId?.submissionId ?? `${state.sessionId}:submission:${sequence}`;
  if (state.usedSubmissionIds.includes(submissionId)) return false;
  const attemptId = `${state.sessionId}:attempt:${sequence}`;
  const responseClass = responseClassFor(isCorrect, attemptStage);
  const event = {
    submissionId,
    attemptId,
    activityId,
    questionId,
    attemptNumber,
    result: isCorrect ? 'correct' : 'incorrect',
    hintUse: hintUsed ? 'hint_used' : 'none',
    hintViewed,
    attemptStage,
    responseClass,
    errorType: isCorrect ? null : errorType,
    evidenceType: kind === 'check' ? 'candidate_check_response_only' : 'candidate_practice_response_only',
    occurredAt: nowIso(),
  };
  if (kind === 'check') state.checkAttempts.push(event);
  else state.practiceAttempts.push(event);
  state.usedSubmissionIds.push(submissionId);
  state.attemptSequence = sequence;
  return true;
}

function currentPracticeQuestion(state) { return unit.practiceQuestions[state.practiceIndex]; }
function currentCheckQuestion(state) { return unit.candidateCheckQuestions[state.checkIndex]; }
function currentRemediation(state) { return unit.reinforcementActivities.find((item) => item.activityId === state.remediationActivityId); }
function result(session, changed = true) { return { session, changed }; }

/** In-memory prototype flow. It never reads or writes localStorage or formal game progress. */
export function dispatchLearningUnit(session, action, payload = {}) {
  if (!session || typeof action !== 'string') return { session, changed: false, error: 'invalid_session_or_action' };
  const state = clone(session);
  switch (action) {
    case 'start':
      if (state.phase !== 'intro') return result(session, false);
      state.phase = 'lesson';
      return result(state);
    case 'lesson_next':
      if (state.phase !== 'lesson') return result(session, false);
      if (state.lessonIndex < unit.lessonSteps.length - 1) state.lessonIndex += 1;
      else {
        state.phase = 'practice';
        completeActivity(state, LESSON_ACTIVITY_ID);
      }
      return result(state);
    case 'practice_answer': {
      if (!['practice', 'practice_retry'].includes(state.phase)) return result(session, false);
      const question = currentPracticeQuestion(state);
      const option = question.options.find((item) => item.optionId === payload.optionId);
      if (!option) return { session, changed: false, error: 'invalid_option' };
      const questionState = getQuestionState(state, unit.activityId, question.id);
      const attemptNumber = questionState.attemptCount + 1;
      const hintUsed = state.currentHintVisible;
      const attemptStage = resolveAttemptStage(questionState, hintUsed);
      if (!addAttempt(state, { activityId: unit.activityId, questionId: question.id, optionId: payload, isCorrect: option.optionId === question.answerId, hintUsed, hintViewed: questionState.hintViewed || hintUsed, attemptStage, errorType: question.errorTypes[option.optionId] ?? null, kind: 'practice', attemptNumber })) return result(session, false);
      questionState.attemptCount = attemptNumber;
      questionState.afterRemediationPending = false;
      state.currentHintVisible = false;
      const last = state.practiceAttempts.at(-1);
      state.lastFeedback = { correct: last.result === 'correct', responseClass: last.responseClass, text: last.result === 'correct' ? question.explanation : question.errorExplanations[last.errorType] ?? '這次的選擇和題目線索還不一致。可以看提示、再試一次，或進入對應補強。', explanation: last.result === 'correct' ? question.explanation : null };
      state.lastErrorType = last.errorType;
      state.phase = last.result === 'correct' ? 'practice_answered' : 'practice_feedback';
      return result(state);
    }
    case 'practice_next':
      if (state.phase !== 'practice_answered') return result(session, false);
      if (state.practiceIndex < unit.practiceQuestions.length - 1) {
        state.practiceIndex += 1;
        state.phase = 'practice';
      } else {
        state.phase = 'check_intro';
        completeActivity(state, PRACTICE_ACTIVITY_ID);
      }
      state.lastFeedback = null;
      state.lastErrorType = null;
      return result(state);
    case 'hint':
      if (!['practice', 'practice_feedback', 'remediation', 'remediation_feedback'].includes(state.phase)) return result(session, false);
      {
        const context = currentQuestionContext(state);
        if (context) getQuestionState(state, context.activityId, context.questionId).hintViewed = true;
      }
      state.currentHintVisible = true;
      state.phase = ['practice', 'practice_feedback'].includes(state.phase) ? 'practice_retry' : 'remediation_retry';
      return result(state);
    case 'retry':
      if (state.phase === 'practice_feedback') {
        state.phase = 'practice_retry';
        state.currentHintVisible = false;
        return result(state);
      }
      if (state.phase === 'remediation_feedback') {
        state.phase = 'remediation_retry';
        state.currentHintVisible = false;
        return result(state);
      }
      return result(session, false);
    case 'remediation_start': {
      if (!['practice_feedback', 'check_result'].includes(state.phase) || !state.lastErrorType && state.phase !== 'check_result') return result(session, false);
      const errorType = payload.errorType ?? state.lastErrorType;
      const remediation = unit.reinforcementActivities.find((item) => item.errorType === errorType);
      if (!remediation) return { session, changed: false, error: 'reinforcement_not_found' };
      state.remediationActivityId = remediation.activityId;
      state.remediationReturn = state.phase === 'check_result' ? 'check_intro' : 'practice';
      if (state.phase === 'practice_feedback') {
        const question = currentPracticeQuestion(state);
        state.remediationSource = { activityId: unit.activityId, questionId: question.id };
      } else {
        const failed = [...state.checkAttempts].reverse().find((event) => event.checkRun === state.checkRun && event.result === 'incorrect' && event.errorType === errorType);
        state.remediationSource = failed ? { activityId: CHECK_ACTIVITY_ID, questionId: failed.questionId } : null;
      }
      state.remediationAttempt = 0;
      state.phase = 'remediation';
      state.currentHintVisible = false;
      state.lastFeedback = null;
      return result(state);
    }
    case 'remediation_answer': {
      if (!['remediation', 'remediation_retry'].includes(state.phase)) return result(session, false);
      const activity = currentRemediation(state);
      const option = activity?.options.find((item) => item.optionId === payload.optionId);
      if (!option) return { session, changed: false, error: 'invalid_option' };
      const questionState = getQuestionState(state, activity.activityId, activity.questionId);
      state.remediationAttempt = questionState.attemptCount + 1;
      const hintUsed = state.currentHintVisible;
      const attemptStage = resolveAttemptStage(questionState, hintUsed);
      if (!addAttempt(state, { activityId: activity.activityId, questionId: activity.questionId, optionId: payload, isCorrect: option.optionId === activity.answerId, hintUsed, hintViewed: questionState.hintViewed || hintUsed, attemptStage, errorType: option.errorType, kind: 'practice', attemptNumber: state.remediationAttempt })) return result(session, false);
      questionState.attemptCount = state.remediationAttempt;
      questionState.afterRemediationPending = false;
      state.currentHintVisible = false;
      const last = state.practiceAttempts.at(-1);
      state.lastErrorType = last.errorType;
      state.lastFeedback = last.result === 'correct'
        ? { correct: true, text: activity.explanation, explanation: activity.explanation }
        : { correct: false, text: '還沒對上，再讀提示後試一次。', explanation: null };
      state.phase = last.result === 'correct' ? 'remediation_complete' : 'remediation_feedback';
      return result(state);
    }
    case 'remediation_continue':
      if (state.phase !== 'remediation_complete') return result(session, false);
      completeActivity(state, state.remediationActivityId);
      if (state.remediationSource) getQuestionState(state, state.remediationSource.activityId, state.remediationSource.questionId).afterRemediationPending = true;
      state.phase = state.remediationReturn === 'check_intro' ? 'check_intro' : 'practice';
      state.remediationActivityId = null;
      state.remediationReturn = null;
      state.remediationSource = null;
      state.lastFeedback = null;
      state.lastErrorType = null;
      return result(state);
    case 'check_start':
      if (state.phase !== 'check_intro') return result(session, false);
      state.checkRun += 1;
      state.checkIndex = 0;
      state.checkAnswered = false;
      state.phase = 'check';
      return result(state);
    case 'check_answer': {
      if (state.phase !== 'check' || state.checkAnswered) return result(session, false);
      const question = currentCheckQuestion(state);
      const option = question.options.find((item) => item.optionId === payload.optionId);
      if (!option) return { session, changed: false, error: 'invalid_option' };
      const questionState = getQuestionState(state, CHECK_ACTIVITY_ID, question.id);
      const attemptNumber = questionState.attemptCount + 1;
      const attemptStage = resolveAttemptStage(questionState, false);
      if (!addAttempt(state, { activityId: CHECK_ACTIVITY_ID, questionId: question.id, optionId: payload, isCorrect: option.optionId === question.answerId, hintUsed: false, hintViewed: questionState.hintViewed, attemptStage, errorType: option.errorType, kind: 'check', attemptNumber })) return result(session, false);
      questionState.attemptCount = attemptNumber;
      questionState.afterRemediationPending = false;
      state.checkAttempts.at(-1).checkRun = state.checkRun;
      state.checkAnswered = true;
      state.lastFeedback = option.optionId === question.answerId
        ? { correct: true, text: question.explanation, explanation: question.explanation }
        : { correct: false, text: '這題先記為待補強；完成本輪後可練習相同概念。', explanation: null };
      state.lastErrorType = option.errorType;
      return result(state);
    }
    case 'check_next':
      if (state.phase !== 'check' || !state.checkAnswered) return result(session, false);
      state.checkIndex += 1;
      state.checkAnswered = false;
      state.lastFeedback = null;
      if (state.checkIndex >= unit.candidateCheckQuestions.length) {
        const runAttempts = state.checkAttempts.filter((item) => item.checkRun === state.checkRun);
        const correct = runAttempts.filter((item) => item.result === 'correct').length;
        const responseCounts = {
          firstTryIndependentCorrect: runAttempts.filter((item) => item.responseClass === 'first_try_independent').length,
          correctAfterHint: runAttempts.filter((item) => item.responseClass === 'correct_after_hint').length,
          correctAfterRetry: runAttempts.filter((item) => item.responseClass === 'correct_after_retry').length,
          correctAfterRemediation: runAttempts.filter((item) => item.responseClass === 'correct_after_remediation').length,
          incorrect: runAttempts.filter((item) => item.result === 'incorrect').length,
        };
        const resultRecord = { checkRun: state.checkRun, correctCount: correct, total: unit.candidateCheckQuestions.length, status: 'candidate_check_result_only', failedErrorTypes: [...new Set(runAttempts.filter((item) => item.result === 'incorrect').map((item) => item.errorType).filter(Boolean))], responseCounts };
        state.checkResults.push(resultRecord);
        completeActivity(state, CHECK_ACTIVITY_ID);
        state.phase = 'check_result';
        state.lastFeedback = { correct: correct === resultRecord.total, text: `本輪候選檢核：${correct} / ${resultRecord.total}。這不是正式學習檢核結果。`, explanation: null };
        state.lastErrorType = resultRecord.failedErrorTypes[0] ?? null;
      }
      return result(state);
    case 'check_retry':
      if (state.phase !== 'check_result') return result(session, false);
      state.phase = 'check_intro';
      state.lastFeedback = null;
      state.lastErrorType = null;
      return result(state);
    case 'review':
      if (!['check_result', 'check_intro'].includes(state.phase)) return result(session, false);
      state.phase = 'review';
      if (!state.completionRecorded) {
        completeActivity(state, unit.activityId);
        state.completionRecorded = true;
      }
      return result(state);
    case 'restart':
      return result(createNumberSecretLearningSession(payload.sessionId ?? `${session.sessionId}:replay:${Date.now()}`));
    default:
      return { session, changed: false, error: 'unknown_action' };
  }
}

export function summarizeNumberSecretLearningSession(session) {
  const checkResult = session.checkResults.at(-1) ?? null;
  const originalPractice = session.practiceAttempts.filter((event) => event.activityId === unit.activityId);
  const reinforcement = session.practiceAttempts.filter((event) => event.activityId !== unit.activityId);
  const summarizeAttempts = (events) => ({
    attemptCount: events.length,
    firstTryIndependentCorrect: events.filter((event) => event.responseClass === 'first_try_independent').length,
    correctAfterHint: events.filter((event) => event.responseClass === 'correct_after_hint').length,
    correctAfterRetry: events.filter((event) => event.responseClass === 'correct_after_retry').length,
    correctAfterRemediation: events.filter((event) => event.responseClass === 'correct_after_remediation').length,
    incorrectAttempts: events.filter((event) => event.result === 'incorrect').length,
  });
  const practiceSummary = summarizeAttempts(originalPractice);
  const reinforcementSummary = summarizeAttempts(reinforcement);
  const summarizeByQuestion = (events) => Object.fromEntries([...new Set(events.map((event) => event.questionId))].map((questionId) => [
    questionId,
    summarizeAttempts(events.filter((event) => event.questionId === questionId)),
  ]));
  return {
    activityCompleted: session.completionRecorded,
    completedActivities: [...session.completedActivityIds],
    activityCompletionEventCount: session.activityCompletionEvents.length,
    practiceAttemptCount: practiceSummary.attemptCount,
    firstTryIndependentCorrect: practiceSummary.firstTryIndependentCorrect,
    correctAfterHint: practiceSummary.correctAfterHint,
    correctAfterRetry: practiceSummary.correctAfterRetry,
    correctAfterRemediation: practiceSummary.correctAfterRemediation,
    incorrectAttempts: practiceSummary.incorrectAttempts,
    practiceSummary,
    reinforcementSummary,
    practiceByQuestion: summarizeByQuestion(originalPractice),
    reinforcementByQuestion: summarizeByQuestion(reinforcement),
    practiceAndReinforcementTotal: practiceSummary.attemptCount + reinforcementSummary.attemptCount,
    candidateCheckAttemptCount: session.checkAttempts.length,
    candidateCheckIncorrect: session.checkAttempts.filter((event) => event.result === 'incorrect').length,
    checkResult,
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
    coverageGaps: unit.learningDirections.map((item) => ({ id: item.id, title: item.title, status: item.status })),
  };
}

export function validateNumberSecretLearningUnit(data = unit) {
  const errors = [];
  if (!data?.learningUnitId || !data?.activityId || !Number.isInteger(data?.revision)) errors.push('learning_unit_identity_incomplete');
  const idSets = [data?.practiceQuestions, data?.candidateCheckQuestions, data?.reinforcementActivities];
  if (idSets.some((items) => !Array.isArray(items) || items.length === 0)) errors.push('learning_unit_activity_set_missing');
  const allIds = idSets.flatMap((items) => Array.isArray(items) ? items.map((item) => item?.id ?? item?.activityId) : []);
  if (allIds.some((id) => !id) || new Set(allIds).size !== allIds.length) errors.push('activity_or_question_ids_missing_or_duplicate');
  const questionIds = [...(data?.practiceQuestions ?? []).map((item) => item?.id), ...(data?.candidateCheckQuestions ?? []).map((item) => item?.id), ...(data?.reinforcementActivities ?? []).map((item) => item?.questionId)];
  if (questionIds.some((id) => !id) || new Set(questionIds).size !== questionIds.length) errors.push('question_ids_missing_or_duplicate');
  for (const question of [...(data?.practiceQuestions ?? []), ...(data?.candidateCheckQuestions ?? []), ...(data?.reinforcementActivities ?? [])]) {
    if (!question || typeof question !== 'object') {
      errors.push('invalid_question_or_activity_record');
      continue;
    }
    const id = question.id ?? question.activityId ?? '(missing-id)';
    const options = Array.isArray(question.options) ? question.options : [];
    if (options.length < 2 || new Set(options.map((option) => option?.optionId)).size !== options.length || options.some((option) => !option?.optionId || !option?.text)) errors.push(`invalid_options:${id}`);
    if (options.filter((option) => option?.optionId === question.answerId).length !== 1) errors.push(`invalid_answer_reference:${id}`);
    if (!question.explanation || !question.prompt) errors.push(`missing_prompt_or_explanation:${question.id ?? question.activityId}`);
    for (const option of options.filter((item) => item.optionId !== question.answerId)) {
      if (!(question.errorTypes?.[option.optionId] ?? option.errorType)) errors.push(`missing_error_diagnostic:${id}:${option.optionId}`);
    }
  }
  if (data?.formalUnitRef?.status !== 'candidate') errors.push('formal_unit_must_remain_candidate');
  const blockPractice = data?.practiceQuestions?.find((question) => question?.id === 'DRAFT-M3-NUM-01-01');
  if (!blockPractice || blockPractice.status !== 'candidate_pending_teacher_review' || blockPractice.isIndependentCheck !== false) errors.push('block_visual_question_must_remain_candidate_guided_practice');
  if (data?.candidateCheckQuestions?.some((question) => question?.id === 'DRAFT-M3-NUM-01-01')) errors.push('block_guided_practice_must_not_enter_candidate_check');
  if (blockPractice) {
    const groups = blockPractice.visualization?.groups ?? [];
    const places = groups.map((group) => group.place);
    if (groups.length !== 4 || new Set(places).size !== 4
      || groups.some((group) => !Number.isInteger(group.quantity) || group.quantity < 1 || !group.label || !group.shape || !group.unitLabel)) errors.push('block_visual_groups_must_define_four_unique_place_values');
    const placeValues = new Map([['thousands', 1000], ['hundreds', 100], ['tens', 10], ['ones', 1]]);
    const representedValue = groups.reduce((sum, group) => sum + group.quantity * (placeValues.get(group.place) ?? 0), 0);
    if (representedValue !== 2468 || JSON.stringify(groups.map((group) => group.quantity)) !== JSON.stringify([2, 4, 6, 8])) errors.push('block_visual_groups_do_not_represent_2468');
    if (blockPractice.visualization?.table?.status !== 'teaching_scaffold_not_independent_check'
      || blockPractice.visualization?.table?.providesAnswerDigits !== true
      || JSON.stringify(blockPractice.visualization?.table?.digits) !== JSON.stringify([2, 4, 6, 8])) errors.push('place_value_table_scaffold_boundary_is_invalid');
    if (!blockPractice.errorExplanations?.possible_place_value_block_mapping?.includes('不能判定原因')) errors.push('block_distractors_must_remain_unconfirmed_hypotheses');
  }
  if (data?.boundaries?.studentRecordsCreated !== false || data?.boundaries?.formalLearningCheckApproved !== false) errors.push('learning_unit_boundaries_invalid');
  if (data?.scheduleAndEvidence?.semesterId !== null
    || data?.scheduleAndEvidence?.semesterStatus !== 'pending_school_and_textbook_evidence'
    || data?.scheduleAndEvidence?.teacherReview?.status !== 'pending_review'
    || data?.scheduleAndEvidence?.teacherReview?.records?.length !== 0
    || data?.scheduleAndEvidence?.classroomTeachingRecords?.length !== 0) errors.push('unverified_schedule_or_teacher_evidence_must_remain_pending');
  return errors;
}
