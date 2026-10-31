const clone = (value) => structuredClone(value);

export function getCandidateQuestionId(question) {
  return question?.draftId ?? question?.id ?? null;
}

/** In-memory, candidate-only quiz lifecycle shared by independent learning units. */
export function createCandidateUnitSession(unit, sessionId = `${unit?.learningUnitId ?? 'candidate-unit'}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`) {
  return {
    sessionId,
    learningUnitId: unit.learningUnitId,
    unitRevision: unit.revision,
    activityId: unit.activityId,
    status: unit.status,
    phase: unit.startAtQuestion ? 'question' : 'intro',
    questionIndex: 0,
    attempts: [],
    usedSubmissionIds: [],
    attemptSequence: 0,
    eventSequence: 0,
    createdAt: new Date().toISOString(),
    completedAt: null,
    lastFeedback: null,
    currentHintLevel: 0,
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  };
}

export function dispatchCandidateUnit(session, unit, action, payload = {}) {
  if (!session || !unit || typeof action !== 'string') return { session, changed: false, error: 'invalid_session_or_unit' };
  if (action === 'restart') return { session: createCandidateUnitSession(unit, payload.sessionId ?? `${session.sessionId}:restart`), changed: true };
  const state = clone(session);
  if (action === 'start') {
    if (state.phase !== 'intro') return { session, changed: false };
    state.phase = 'question';
    return { session: state, changed: true };
  }
  if (action === 'hint') {
    if (state.phase !== 'question') return { session, changed: false };
    const question = unit.questions[state.questionIndex];
    const hints = Array.isArray(question?.hints) ? question.hints : [];
    if (hints.length === 0) return { session, changed: false, error: 'hint_not_provided' };
    if (state.currentHintLevel >= hints.length) return { session, changed: false, error: 'no_more_hints' };
    state.currentHintLevel += 1;
    return {
      session: state,
      changed: true,
      hint: { questionId: getCandidateQuestionId(question), level: state.currentHintLevel, text: hints[state.currentHintLevel - 1] },
    };
  }
  if (action === 'retry') {
    if (state.phase !== 'feedback' || state.lastFeedback?.correct !== false) return { session, changed: false };
    state.phase = 'question';
    state.lastFeedback = null;
    return { session: state, changed: true };
  }
  if (action === 'answer') {
    if (state.phase !== 'question') return { session, changed: false };
    const question = unit.questions[state.questionIndex];
    const option = question?.options.find((item) => item.optionId === payload.optionId);
    if (!option) return { session, changed: false, error: 'invalid_option' };
    const submissionId = payload.submissionId ?? `${state.sessionId}:submission:${state.attemptSequence + 1}`;
    if (state.usedSubmissionIds.includes(submissionId)) return { session, changed: false, error: 'duplicate_submission' };
    const questionId = getCandidateQuestionId(question);
    const priorQuestionAttempts = state.attempts.filter((attempt) => attempt.questionId === questionId).length;
    const hintViewed = state.currentHintLevel > 0;
    const isCorrect = option.optionId === question.answerId;
    state.eventSequence += 1;
    const event = {
      eventSequence: state.eventSequence,
      occurredAt: new Date().toISOString(),
      submissionId,
      learningUnitId: unit.learningUnitId,
      unitRevision: unit.revision,
      activityId: unit.activityId,
      questionId,
      ...(question.draftId ? { draftId: question.draftId } : {}),
      selectedOptionId: option.optionId,
      result: isCorrect ? 'correct' : 'incorrect',
      attemptNumber: priorQuestionAttempts + 1,
      attemptStage: priorQuestionAttempts === 0
        ? (hintViewed ? 'after_hint' : 'first_independent')
        : 'retry',
      hintUse: hintViewed ? `level_${state.currentHintLevel}` : 'none',
      hintViewed,
      hintLevelAtSubmission: state.currentHintLevel,
      remediationCompleted: false,
      errorType: isCorrect ? null : question.errorTypes?.[option.optionId] ?? 'unclassified_candidate_response',
      evidenceType: 'candidate_learning_unit_response_only',
      ...(question.responseDimension ? { responseDimension: question.responseDimension } : {}),
    };
    state.attempts.push(event);
    state.usedSubmissionIds.push(submissionId);
    state.attemptSequence += 1;
    state.phase = 'feedback';
    state.lastFeedback = {
      correct: isCorrect,
      text: isCorrect
        ? question.explanation
        : question.wrongGuidance ?? '這是候選作答線索，不能單次判定錯誤原因。請回看題目提供的表徵，再決定是否重試。',
    };
    return { session: state, changed: true, event };
  }
  if (action === 'next') {
    if (state.phase !== 'feedback') return { session, changed: false };
    state.questionIndex += 1;
    state.lastFeedback = null;
    state.currentHintLevel = 0;
    state.phase = state.questionIndex >= unit.questions.length ? 'result' : 'question';
    if (state.phase === 'result') state.completedAt = new Date().toISOString();
    return { session: state, changed: true };
  }
  return { session, changed: false, error: 'unknown_action' };
}

export function summarizeCandidateUnit(session) {
  const summary = {
    learningUnitId: session.learningUnitId,
    unitRevision: session.unitRevision,
    activityId: session.activityId,
    attemptCount: session.attempts.length,
    correctCount: session.attempts.filter((event) => event.result === 'correct').length,
    incorrectCount: session.attempts.filter((event) => event.result === 'incorrect').length,
    resultStatus: 'candidate_result_only_not_formal_assessment',
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  };
  const dimensions = [...new Set((session.attempts ?? []).map((event) => event.responseDimension).filter(Boolean))];
  if (dimensions.length) {
    summary.responseDimensionSummaries = Object.fromEntries(dimensions.map((dimension) => {
      const events = session.attempts.filter((event) => event.responseDimension === dimension);
      return [dimension, {
        attemptCount: events.length,
        correctCount: events.filter((event) => event.result === 'correct').length,
        incorrectCount: events.filter((event) => event.result === 'incorrect').length,
        meaning: dimension === 'strategy_explanation'
          ? 'candidate_selected_explanation_only_not_evidence_of_stable_strategy_mastery'
          : 'candidate_calculation_result_response_only',
      }];
    }));
  }
  return summary;
}

export function getCandidateQuestionAttempts(session, questionId) {
  return (session?.attempts ?? []).filter((event) => event.questionId === questionId);
}

export function validateCandidateUnit(unit) {
  const errors = [];
  if (!unit?.learningUnitId || !Number.isInteger(unit?.revision) || !unit?.activityId) errors.push('candidate_unit_identity_invalid');
  if (unit?.status !== 'candidate_pending_teacher_review' || unit?.formalAssessment !== false) errors.push('candidate_unit_must_remain_unapproved');
  if (!Array.isArray(unit?.questions) || unit.questions.length === 0) errors.push('candidate_unit_questions_missing');
  const questions = Array.isArray(unit?.questions) ? unit.questions : [];
  const ids = questions.map(getCandidateQuestionId);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) errors.push('candidate_question_ids_missing_or_duplicate');
  for (const question of questions) {
    const options = Array.isArray(question?.options) ? question.options : [];
    const optionIds = options.map((option) => option?.optionId);
    if (!question?.prompt || !question?.explanation || options.length < 2 || optionIds.some((id) => !id) || new Set(optionIds).size !== optionIds.length) errors.push(`candidate_question_invalid:${getCandidateQuestionId(question) ?? 'unknown'}`);
    if (options.filter((option) => option.optionId === question?.answerId).length !== 1) errors.push(`candidate_answer_invalid:${getCandidateQuestionId(question) ?? 'unknown'}`);
  }
  if (!['not_provided', 'per_question'].includes(unit?.hintPolicy)
    || !['not_provided', 'per_question'].includes(unit?.remediationPolicy)) errors.push('candidate_optional_support_must_be_explicit');
  if (unit?.hintPolicy === 'per_question') {
    for (const question of questions) {
      if (!Array.isArray(question?.hints) || question.hints.length !== 2
        || question.hints.some((hint) => typeof hint !== 'string' || !hint.trim())
        || typeof question?.wrongGuidance !== 'string' || !question.wrongGuidance.trim()) {
        errors.push(`candidate_question_hint_or_guidance_invalid:${getCandidateQuestionId(question) ?? 'unknown'}`);
      }
    }
  }
  if (unit?.remediationPolicy === 'per_question') {
    for (const question of questions) {
      if (!Array.isArray(question?.remediationActivities) || question.remediationActivities.length === 0) {
        errors.push(`candidate_question_remediation_missing:${getCandidateQuestionId(question) ?? 'unknown'}`);
      }
    }
  }
  return errors;
}
