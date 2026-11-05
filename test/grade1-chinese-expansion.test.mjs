import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE1_CHINESE_EXPANSION_ACTIVITIES,
} from '../prototype/data/grade1ChineseExpansionActivities.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const ids = [
  'ACT-G1-CHINESE-WORD-MEANING-SORT-CANDIDATE',
  'ACT-G1-CHINESE-WORD-HUNT-CANDIDATE',
  'ACT-G1-CHINESE-SENTENCE-MEANING-CANDIDATE',
  'ACT-G1-CHINESE-READING-CLUE-CANDIDATE',
];
const han = /\p{Script=Han}/u;
const byId = new Map(GRADE1_CHINESE_EXPANSION_ACTIVITIES.map((activity) => [activity.activityId, activity]));

function assertPronunciation(text, tokens, where) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `${where} needs reviewed pronunciation tokens`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text, `${where} token text/order must match visible text`);
  for (const token of tokens) {
    if (han.test(token.text)) assert.ok(typeof token.reading === 'string' && token.reading.trim(), `${where}: ${token.text} needs a reading`);
    else assert.equal(token.reading, undefined, `${where}: non-Han ${token.text} must not receive a fabricated reading`);
  }
}

function assertStudentTextCoverage(activity) {
  assertPronunciation(activity.title, activity.titlePronunciationTokens, `${activity.activityId} title`);
  assertPronunciation(activity.instructions, activity.instructionsPronunciationTokens, `${activity.activityId} instructions`);
  for (const stage of activity.stages) {
    assertPronunciation(stage.prompt, stage.promptPronunciationTokens, `${stage.stageId} prompt`);
    assertPronunciation(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens, `${stage.stageId} guidance`);
    assertPronunciation(stage.correctFeedback, stage.correctFeedbackPronunciationTokens, `${stage.stageId} correct feedback`);
    assertPronunciation(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens, `${stage.stageId} incorrect feedback`);
    for (const [index, value] of (stage.hints ?? []).entries()) assertPronunciation(value.text, value.pronunciationTokens, `${stage.stageId} hint ${index + 1}`);
    for (const observation of stage.observations ?? []) assertPronunciation(observation.text, observation.pronunciationTokens, `${stage.stageId} observation ${observation.id}`);
    for (const category of stage.categories ?? []) assertPronunciation(category.label, category.pronunciationTokens, `${stage.stageId} category ${category.id}`);
    for (const option of stage.options ?? []) {
      assertPronunciation(option.text, option.pronunciationTokens, `${stage.stageId} option ${option.id}`);
      if (option.feedback) assertPronunciation(option.feedback, option.feedbackPronunciationTokens, `${stage.stageId} option feedback ${option.id}`);
    }
    const passage = activity.passages?.[stage.passageId];
    if (passage) {
      assertPronunciation(passage.title, passage.titlePronunciationTokens, `${stage.stageId} passage title`);
      for (const [index, line] of passage.lines.entries()) assertPronunciation(line.text, line.pronunciationTokens, `${stage.stageId} passage line ${index + 1}`);
    }
  }
}

function dispatch(session, activity, action, payload = {}, expectedError = undefined) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, expectedError, `${activity.activityId} ${action} error contract`);
  return expectedError === undefined ? result.session : result;
}

function submit(session, activity, suffix, expectedError = undefined) {
  return dispatch(session, activity, 'submit', { submissionId: `${activity.activityId}-${suffix}` }, expectedError);
}

function assignAll(session, activity, stage, wrong = false) {
  const wrongObservation = stage.observations[0];
  for (const observation of stage.observations) {
    const categoryId = wrong && observation.id === wrongObservation.id
      ? stage.categories.find(({ id }) => id !== stage.correctAssignments[observation.id]).id
      : stage.correctAssignments[observation.id];
    session = dispatch(session, activity, 'assign_category', { observationId: observation.id, categoryId });
  }
  return session;
}

function answerWrongThenRight(session, activity, stage, suffix) {
  if (stage.interaction === 'classify_observations') {
    const empty = submit(session, activity, `${suffix}-empty`, 'response_required');
    assert.equal(empty.error, 'response_required', `${stage.stageId}: every card must be classified`);
    session = assignAll(session, activity, stage, true);
    session = submit(session, activity, `${suffix}-wrong`);
  } else if (stage.interaction === 'collect_evidence') {
    assert.equal(stage.requiredSelectionCount, 1);
    const empty = submit(session, activity, `${suffix}-empty`, 'response_required');
    assert.equal(empty.error, 'response_required', `${stage.stageId}: zero selections must not submit`);
    const wrongId = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = dispatch(session, activity, 'toggle_evidence', { optionId: wrongId });
    assert.equal(session.selection.length, 1);
    const over = dispatchLearningTask(session, activity, 'toggle_evidence', { optionId: stage.options.find(({ id }) => id !== wrongId).id });
    assert.equal(over.error, 'required_selection_count_reached', `${stage.stageId}: count is an explicit cap`);
    session = submit(session, activity, `${suffix}-wrong`);
  } else {
    assert.equal(stage.interaction, 'choose_response');
    const empty = submit(session, activity, `${suffix}-empty`, 'response_required');
    assert.equal(empty.error, 'response_required', `${stage.stageId}: no selection must not submit`);
    const wrongId = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = dispatch(session, activity, 'select_option', { optionId: wrongId });
    session = submit(session, activity, `${suffix}-wrong`);
  }
  assert.equal(session.phase, 'feedback', `${stage.stageId}: wrong valid response remains submittable and is scored wrong`);
  session = dispatch(session, activity, 'retry');
  assert.equal(session.phase, 'active');
  assert.equal(session.selection.length, 0);
  assert.deepEqual(session.assignments, {});
  if (stage.interaction === 'classify_observations') session = assignAll(session, activity, stage);
  else if (stage.interaction === 'collect_evidence') session = dispatch(session, activity, 'toggle_evidence', { optionId: stage.correctOptionIds[0] });
  else session = dispatch(session, activity, 'select_option', { optionId: stage.correctOptionIds[0] });
  session = submit(session, activity, `${suffix}-right`);
  assert.equal(session.phase, 'success', `${stage.stageId}: correct response must succeed`);
  return session;
}

test('四個新活動資料、catalog、課綱關聯與學生文字注音契約完整', () => {
  assert.deepEqual(GRADE1_CHINESE_EXPANSION_ACTIVITIES.map(({ activityId }) => activityId), ids);
  const grade = getGradeById('grade-1');
  const chinese = grade.subjects.find(({ subjectId }) => subjectId === 'chinese-language');
  const launchableIds = chinese.existingYearLevelContent.map(({ activityId }) => activityId);
  assert.equal(launchableIds.length, 6);
  for (const id of ids) {
    const activity = byId.get(id);
    assert.equal(activity.curriculumMapId, 'chinese-stage1-word-sentence-story');
    assert.equal(activity.gradeId, 'grade-1');
    assert.equal(activity.subjectId, 'chinese-language');
    assert.equal(activity.status, 'candidate_pending_teacher_review');
    assert.equal(activity.stages.length, 2);
    assert.ok(CATALOG_CANDIDATE_TASKS.includes(activity));
    assert.ok(launchableIds.includes(id));
    assert.ok(getLearningTaskRelation('grade-1', 'chinese-language').tasks.some(({ taskId }) => taskId === id));
    assert.deepEqual(validateLearningTask(activity), []);
    assert.ok(activity.teacherLimitationNote);
    const studentFeedback = activity.stages.flatMap((stage) => [stage.correctFeedback, stage.incorrectFeedback, ...(stage.options ?? []).map(({ feedback }) => feedback)].filter(Boolean));
    for (const feedback of studentFeedback) assert.doesNotMatch(feedback, /課綱|教師審閱|指定學期|完整識字|完整閱讀|官方詞表/);
    assertStudentTextCoverage(activity);
  }
  assert.equal(chinese.existingYearLevelContent.filter(({ runtimeAvailability }) => runtimeAvailability === 'playable_candidate_prototype').length, 6);
});

test('詞語找家：所有詞卡都要分類，互斥分類與錯答重試可正確判分', () => {
  const activity = byId.get('ACT-G1-CHINESE-WORD-MEANING-SORT-CANDIDATE');
  assert.deepEqual(activity.curriculumCodes, ['Ab-I-5', 'Ab-I-6']);
  assert.deepEqual(activity.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['sort-food-and-everyday-items', 'classify_observations'],
    ['sort-animals-and-objects', 'classify_observations'],
  ]);
  for (const stage of activity.stages) {
    assert.equal(new Set(stage.categories.map(({ id }) => id)).size, stage.categories.length);
    assert.deepEqual(Object.keys(stage.correctAssignments).sort(), stage.observations.map(({ id }) => id).sort());
    assert.ok(stage.observations.every(({ id }) => stage.categories.some(({ id: categoryId }) => categoryId === stage.correctAssignments[id])));
  }
  let session = dispatch(createLearningTaskSession(activity, 'word-sort-direct'), activity, 'start');
  for (const stage of activity.stages) {
    if (stage !== activity.stages[0]) session = dispatch(session, activity, 'next');
    session = answerWrongThenRight(session, activity, stage, stage.stageId);
  }
  assert.equal(dispatch(session, activity, 'next').phase, 'completed');
});

test('詞語尋寶：一張線索才可提交，錯誤線索可提交但判錯，第二關單選可重試', () => {
  const activity = byId.get('ACT-G1-CHINESE-WORD-HUNT-CANDIDATE');
  assert.deepEqual(activity.curriculumCodes, ['Ab-I-5']);
  const [evidence, match] = activity.stages;
  assert.equal(evidence.stageId, 'find-word-in-short-lines');
  assert.equal(evidence.requiredSelectionCount, 1);
  assert.equal(evidence.interaction, 'collect_evidence');
  assert.equal(match.stageId, 'check-word-card-match');
  assert.equal(match.interaction, 'choose_response');
  assert.equal(match.correctOptionIds.length, 1);
  let session = dispatch(createLearningTaskSession(activity, 'word-hunt-direct'), activity, 'start');
  session = answerWrongThenRight(session, activity, evidence, evidence.stageId);
  session = dispatch(session, activity, 'next');
  session = answerWrongThenRight(session, activity, match, match.stageId);
  assert.equal(dispatch(session, activity, 'next').phase, 'completed');
});

test('一句話讀懂了：各關只有唯一正答，理解句意而不組句或排序', () => {
  const activity = byId.get('ACT-G1-CHINESE-SENTENCE-MEANING-CANDIDATE');
  assert.deepEqual(activity.curriculumCodes, ['Ac-I-2', '5-I-4']);
  assert.ok(activity.stages.every(({ interaction, correctOptionIds, options }) => interaction === 'choose_response'
    && correctOptionIds.length === 1 && options.filter(({ id }) => correctOptionIds.includes(id)).length === 1));
  assert.ok(activity.stages.every(({ interaction }) => !['assemble_response', 'order_items'].includes(interaction)));
  let session = dispatch(createLearningTaskSession(activity, 'sentence-meaning-direct'), activity, 'start');
  for (const stage of activity.stages) {
    if (stage !== activity.stages[0]) session = dispatch(session, activity, 'next');
    session = answerWrongThenRight(session, activity, stage, stage.stageId);
  }
  assert.equal(dispatch(session, activity, 'next').phase, 'completed');
});

test('短文線索小偵探：明示訊息可選取作答，不排序故事且錯誤線索仍按內容判錯', () => {
  const activity = byId.get('ACT-G1-CHINESE-READING-CLUE-CANDIDATE');
  assert.deepEqual(activity.curriculumCodes, ['5-I-4', '5-I-6', 'Ad-I-3']);
  const [evidence, response] = activity.stages;
  assert.equal(evidence.requiredSelectionCount, 1);
  assert.deepEqual(activity.stages.map(({ interaction }) => interaction), ['collect_evidence', 'choose_response']);
  assert.ok(activity.stages.every(({ interaction }) => !['order_items', 'assemble_response'].includes(interaction)));
  assert.equal(evidence.passageId, response.passageId);
  let session = dispatch(createLearningTaskSession(activity, 'reading-clue-direct'), activity, 'start');
  session = answerWrongThenRight(session, activity, evidence, evidence.stageId);
  session = dispatch(session, activity, 'next');
  session = answerWrongThenRight(session, activity, response, response.stageId);
  assert.equal(dispatch(session, activity, 'next').phase, 'completed');
});
