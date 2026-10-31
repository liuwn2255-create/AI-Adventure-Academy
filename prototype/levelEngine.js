const ALLOWED_REVIEW_STATUSES = new Set([
  'prototype_demo_only',
  'pending_teacher_review',
]);

export function validateQuestionSet(questionSet) {
  const errors = [];
  if (!questionSet || !Array.isArray(questionSet.questions) || questionSet.questions.length === 0) {
    return ['question_set_empty_or_missing'];
  }

  const questionIds = new Set();
  for (const [index, question] of questionSet.questions.entries()) {
    if (!question || typeof question.prompt !== 'string' || question.prompt.trim() === '') errors.push(`question_${index + 1}_prompt_missing`);
    const id = question?.id ?? question?.prototypeQuestionId;
    if (typeof id !== 'string' || id.trim() === '' || questionIds.has(id)) errors.push(`question_${index + 1}_id_missing_or_duplicate`);
    else questionIds.add(id);
    if (!Array.isArray(question?.options) || question.options.length < 2) {
      errors.push(`question_${index + 1}_options_invalid`);
      continue;
    }
    const optionIds = question.options.map((option) => option?.optionId);
    if (optionIds.some((optionId) => typeof optionId !== 'string' || optionId.trim() === '')
      || new Set(optionIds).size !== optionIds.length
      || question.options.some((option) => typeof option.text !== 'string' || option.text.trim() === '')) {
      errors.push(`question_${index + 1}_option_invalid_or_duplicate`);
    }
    if (typeof question.answerId !== 'string' || optionIds.filter((optionId) => optionId === question.answerId).length !== 1) {
      errors.push(`question_${index + 1}_answer_reference_invalid`);
    }
    if (typeof question.explanation !== 'string' || question.explanation.trim() === '') errors.push(`question_${index + 1}_explanation_missing`);
  }
  return errors;
}

export function validateLevel(level) {
  const errors = [];
  if (!level || typeof level.id !== 'string' || !level.id.trim()) errors.push('level_id_missing');
  if (typeof level?.title !== 'string' || !level.title.trim()) errors.push('level_title_missing');
  if (typeof level?.description !== 'string' || !level.description.trim()) errors.push('level_description_missing');
  if (!ALLOWED_REVIEW_STATUSES.has(level?.reviewStatus)) errors.push('level_review_status_invalid');
  if (!level?.questionSet) errors.push('level_question_set_missing');
  else errors.push(...validateQuestionSet(level.questionSet));
  const unlock = level?.unlockCondition;
  if (!unlock || !['always', 'completed_level', 'completed_mission'].includes(unlock.type)) errors.push('level_unlock_condition_invalid');
  if (unlock?.type === 'completed_level' && !unlock.levelId) errors.push('unlock_level_id_missing');
  if (unlock?.type === 'completed_mission' && !unlock.missionId) errors.push('unlock_mission_id_missing');
  return errors;
}

export function isLevelUnlocked(level, progress) {
  if (validateLevel(level).length > 0) return false;
  const condition = level.unlockCondition;
  if (condition.type === 'always') return true;
  if (condition.type === 'completed_level') return progress?.completedLevels?.[condition.levelId]?.completed === true;
  if (condition.type === 'completed_mission') return progress?.completedMissionIds?.includes(condition.missionId) === true;
  return false;
}

export function createLevelSession(questionCount) {
  return { questionIndex: 0, score: 0, answered: false, lastAnswerCorrect: null, complete: questionCount === 0 };
}

export function submitLevelAnswer(state, question, optionId) {
  if (state.complete || state.answered) return { state, isCorrect: null, changed: false };
  const isCorrect = optionId === question.answerId;
  return {
    state: { ...state, score: state.score + (isCorrect ? 1 : 0), answered: true, lastAnswerCorrect: isCorrect },
    isCorrect,
    changed: true,
  };
}

export function retryLevelQuestion(state) {
  if (state.complete || !state.answered || state.lastAnswerCorrect !== false) return state;
  return { ...state, answered: false, lastAnswerCorrect: null };
}

export function advanceLevelQuestion(state, questionCount) {
  if (!state.answered || state.complete) return state;
  const nextIndex = state.questionIndex + 1;
  if (nextIndex >= questionCount) return { ...state, complete: true };
  return { ...state, questionIndex: nextIndex, answered: false, lastAnswerCorrect: null };
}
