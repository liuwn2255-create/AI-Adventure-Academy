import { NUMBER_SECRET_V2_CANDIDATE_SET as candidateSet } from './data/numberSecretLearningUnit.js';
import { createCandidateUnitSession, dispatchCandidateUnit, summarizeCandidateUnit } from './learningUnitEngine.js';

const clone = (value) => structuredClone(value);

export function validateNumberSecretV2CandidateSet(data = candidateSet) {
  const errors = [];
  if (data?.checkSetId !== 'CHECKSET-DRAFT-M3-NUM-01-V2-PILOT'
    || !Number.isInteger(data?.revision)
    || !data?.activityId
    || data?.status !== 'candidate_pending_teacher_review'
    || data?.formalAssessment !== false) errors.push('v2_candidate_set_identity_or_status_invalid');
  if (data?.hintPolicy !== 'per_question' || data?.remediationPolicy !== 'not_provided') errors.push('v2_candidate_support_policy_invalid');
  if (!Array.isArray(data?.questions) || data.questions.length !== 2) errors.push('v2_candidate_set_must_contain_only_questions_01_and_02');
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const ids = questions.map((question) => question?.draftId);
  if (new Set(ids).size !== ids.length || ids.some((id) => !id?.startsWith('V2-DRAFT-M3-NUM-01-'))) errors.push('v2_draft_question_ids_invalid_or_duplicate');
  for (const question of questions) {
    if (question?.status !== 'candidate_pending_teacher_review') errors.push(`v2_question_not_candidate:${question?.draftId ?? 'unknown'}`);
    if (!question?.prompt || !question?.explanation) errors.push(`v2_question_prompt_or_explanation_missing:${question?.draftId ?? 'unknown'}`);
    const options = Array.isArray(question?.options) ? question.options : [];
    const optionIds = options.map((option) => option?.optionId);
    if (options.length !== 4 || optionIds.some((id) => !id) || new Set(optionIds).size !== optionIds.length) errors.push(`v2_question_options_invalid:${question?.draftId ?? 'unknown'}`);
    if (options.filter((option) => option.optionId === question?.answerId).length !== 1) errors.push(`v2_question_answer_reference_invalid:${question?.draftId ?? 'unknown'}`);
    if (options.some((option) => option.optionId !== question.answerId && !question.errorTypes?.[option.optionId])) errors.push(`v2_question_error_hypothesis_missing:${question?.draftId ?? 'unknown'}`);
    if (!Array.isArray(question?.hints) || question.hints.length !== 2 || !question?.wrongGuidance) errors.push(`v2_question_guidance_missing:${question?.draftId ?? 'unknown'}`);
  }
  if (JSON.stringify(ids) !== JSON.stringify(['V2-DRAFT-M3-NUM-01-01', 'V2-DRAFT-M3-NUM-01-02'])) errors.push('v2_candidate_set_contains_unexpected_draft_ids');
  const deferred = Array.isArray(data?.deferredQuestions) ? data.deferredQuestions : [];
  if (deferred.length !== 1) errors.push('v2_candidate_set_must_have_one_disabled_question_03_preview');
  for (const question of deferred) {
    if (question?.draftId !== 'V2-DRAFT-M3-NUM-01-03'
      || question?.status !== 'disabled_pending_teacher_confirmation'
      || question?.enabled !== false
      || question?.prerequisiteStatus !== 'pending_teacher_confirmation') {
      errors.push(`v2_deferred_question_must_remain_disabled:${question?.draftId ?? 'unknown'}`);
    }
    if (!question?.prompt || !question?.explanation || !question?.prerequisiteNote) errors.push(`v2_deferred_question_content_missing:${question?.draftId ?? 'unknown'}`);
    const columns = question?.table?.columns ?? [];
    const digits = question?.table?.digits ?? [];
    if (JSON.stringify(columns) !== JSON.stringify(['千位', '百位', '十位', '個位'])
      || JSON.stringify(digits) !== JSON.stringify([3, 1, 4, 2])) errors.push('v2_deferred_question_table_invalid');
    const options = Array.isArray(question?.options) ? question.options : [];
    const optionIds = options.map((option) => option?.optionId);
    if (options.length !== 4 || optionIds.some((id) => !id) || new Set(optionIds).size !== optionIds.length) errors.push('v2_deferred_question_options_invalid');
    if (options.filter((option) => option.optionId === question?.answerId).length !== 1) errors.push('v2_deferred_question_answer_reference_invalid');
    if (ids.includes(question?.draftId)) errors.push('v2_deferred_question_must_not_be_active');
  }
  const disabledConditional = Array.isArray(data?.disabledConditionalQuestions) ? data.disabledConditionalQuestions : [];
  const q4 = disabledConditional.find((question) => question?.draftId === 'V2-DRAFT-M3-NUM-01-04');
  if (!q4 || q4.enabled !== false || q4.status !== 'disabled_pending_teacher_approval'
    || q4.prerequisiteStatus !== 'pending_teacher_confirmation'
    || !Array.isArray(q4.requiredTeacherEvidence) || q4.requiredTeacherEvidence.length < 4) {
    errors.push('v2_question_04_must_remain_disabled_until_teacher_approval');
  }
  return errors;
}

export function createNumberSecretV2CandidateSession(sessionId = `v2-candidate-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`) {
  const shared = createCandidateUnitSession({
    learningUnitId: candidateSet.checkSetId,
    revision: candidateSet.revision,
    activityId: candidateSet.activityId,
    status: candidateSet.status,
    formalAssessment: candidateSet.formalAssessment,
    questions: candidateSet.questions,
    startAtQuestion: true,
    hintPolicy: candidateSet.hintPolicy,
    remediationPolicy: candidateSet.remediationPolicy,
  }, sessionId);
  return {
    ...shared,
    checkSetId: candidateSet.checkSetId,
    setRevision: candidateSet.revision,
    observationCode: `OBS-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    technicalIssues: [],
  };
}

export function dispatchNumberSecretV2Candidate(session, action, payload = {}) {
  if (!session || !['answer', 'next', 'restart', 'technical_issue', 'hint', 'retry'].includes(action)) return { session, changed: false, error: 'invalid_session_or_action' };
  if (action === 'restart') return { session: createNumberSecretV2CandidateSession(payload.sessionId ?? `${session.sessionId}:restart`), changed: true };
  if (action === 'technical_issue') {
    const state = clone(session);
    const allowedCodes = new Set(['display', 'touch_input', 'keyboard_input', 'navigation', 'other']);
    if (!allowedCodes.has(payload.issueCode)) return { session, changed: false, error: 'invalid_technical_issue_code' };
    const question = state.phase === 'question' || state.phase === 'feedback'
      ? candidateSet.questions[state.questionIndex]
      : null;
    state.eventSequence += 1;
    state.technicalIssues.push({
      eventSequence: state.eventSequence,
      occurredAt: new Date().toISOString(),
      issueCode: payload.issueCode,
      questionId: question?.draftId ?? null,
      activityId: state.activityId,
    });
    return { session: state, changed: true };
  }
  const unit = {
    learningUnitId: candidateSet.checkSetId,
    revision: candidateSet.revision,
    activityId: candidateSet.activityId,
    status: candidateSet.status,
    formalAssessment: candidateSet.formalAssessment,
    questions: candidateSet.questions,
    startAtQuestion: true,
    hintPolicy: candidateSet.hintPolicy,
    remediationPolicy: candidateSet.remediationPolicy,
  };
  const result = dispatchCandidateUnit(session, unit, action, payload);
  if (!result.changed) return result;
  if (result.event) {
    const event = {
      ...result.event,
      checkSetId: session.checkSetId,
      setRevision: session.setRevision,
      evidenceType: 'candidate_v2_trial_response_only',
    };
    result.session.attempts[result.session.attempts.length - 1] = event;
    result.event = event;
  }
  return result;
}

export function summarizeNumberSecretV2CandidateSession(session) {
  const summary = summarizeCandidateUnit(session);
  return {
    checkSetId: session.checkSetId,
    setRevision: session.setRevision,
    attemptCount: summary.attemptCount,
    correctCount: summary.correctCount,
    incorrectCount: summary.incorrectCount,
    status: 'candidate_result_only_not_formal_assessment',
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  };
}

export function createNumberSecretV2TeacherExport(session) {
  if (!session || session.phase !== 'result' || !session.completedAt) {
    return { ok: false, error: 'candidate_trial_must_be_completed_before_export' };
  }
  const events = [
    ...session.attempts.map((attempt) => ({ eventType: 'response', ...attempt })),
    ...session.technicalIssues.map((issue) => ({ eventType: 'technical_issue', ...issue })),
  ].sort((a, b) => a.eventSequence - b.eventSequence);
  return {
    ok: true,
    record: {
      schemaVersion: 1,
      recordType: 'candidate_teacher_observation_export',
      useStatus: 'development_test_only_student_pilot_requires_teacher_authorization',
      observationCode: session.observationCode,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      checkSetId: session.checkSetId,
      setRevision: session.setRevision,
      activityId: session.activityId,
      events,
      summary: summarizeNumberSecretV2CandidateSession(session),
      directStudentIdentifiersCollected: false,
      persistentStorageUsed: false,
      hintAndRemediationObservation: 'answer_events_record_hint_viewed_and_level_but_not_hint_event_time_or_text; remediation_not_provided; use the paper observation protocol if authorized',
      teacherNotes: 'Record separately on the approved paper form; do not add student names or direct identifiers.',
    },
  };
}
