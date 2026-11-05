import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADE1_HPE_EXPANSION_ACTIVITIES } from '../prototype/data/grade1HpeExpansionActivities.js';
import { GRADE1_PLAYGROUND_SAFETY_ROUTE } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const expected = [
  ['ACT-G1-HPE-HYGIENE-HABITS-CANDIDATE', '健康小偵探：衛生習慣與洗手', 'health-pe-stage1-personal-hygiene-habits', ['classify-handwashing-habits', 'order-handwashing-steps']],
  ['ACT-G1-HPE-SAFE-WARMUP-MOVEMENT-CANDIDATE', '暖身安全小隊：運動前的準備', 'health-pe-stage1-safe-warmup-and-movement', ['classify-warmup-actions', 'choose-safe-warmup-action']],
  ['ACT-G1-HPE-ACTIVITY-CHOICE-BENEFITS-CANDIDATE', '活力運動家：運動益處與活動選擇', 'health-pe-stage1-activity-choice-and-benefits', ['classify-sport-safety-clues', 'choose-activity-for-marked-space']],
  ['ACT-G1-HPE-FOOD-DIET-HABITS-CANDIDATE', '健康生活家：認識食物與飲食習慣', 'health-pe-stage1-food-and-diet-habits', ['classify-common-foods', 'choose-fitting-food-portion']],
];
const curriculum = JSON.parse(readFileSync('curriculum/curriculum-map.json', 'utf8'));
const maps = new Map(curriculum.supplementalVerifiedLearningFocuses.map((focus) => [focus.id, focus]));
const gradeOne = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-1');
const hpeSubject = gradeOne.subjects.find(({ subjectId }) => subjectId === 'health-physical-education');

function act(session, activity, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${activity.activityId}/${activity.stages[session.stageIndex].stageId} ${action}`);
  return result.session;
}
function submit(session, activity, id) {
  return dispatchLearningTask(session, activity, 'submit', { submissionId: id });
}
function start(activity) { return act(createLearningTaskSession(activity, `${activity.activityId}-test`), activity, 'start'); }
function assertAnnotated(text, tokens) {
  assert.ok(typeof text === 'string' && Array.isArray(tokens), `missing pronunciation metadata for ${text}`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text, `token alignment: ${text}`);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing manual reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han token has artificial reading in ${text}`);
  }
}
function applyCorrect(session, activity, stage) {
  if (stage.interaction === 'classify_observations') {
    for (const [observationId, categoryId] of Object.entries(stage.correctAssignments)) session = act(session, activity, 'assign_category', { observationId, categoryId });
  } else if (stage.interaction === 'choose_response') {
    session = act(session, activity, 'select_option', { optionId: stage.correctOptionIds[0] });
  } else if (stage.interaction === 'order_items') {
    for (let index = 0; index < stage.correctItemIds.length; index += 1) {
      const itemId = stage.correctItemIds[index];
      const currentIndex = session.orderedItems.indexOf(itemId);
      if (currentIndex !== index) session = act(session, activity, 'move_ordered_item', { itemId, toIndex: index });
    }
  }
  return session;
}
function enterStage(activity, targetIndex) {
  let session = start(activity);
  for (let index = 0; index < targetIndex; index += 1) {
    session = applyCorrect(session, activity, activity.stages[index]);
    const result = submit(session, activity, `${activity.activityId}-advance-${index}`);
    assert.equal(result.error, undefined);
    assert.equal(result.session.phase, 'success');
    session = act(result.session, activity, 'next');
  }
  assert.equal(session.stageIndex, targetIndex);
  assert.equal(activity.stages[session.stageIndex].stageId, activity.stages[targetIndex].stageId);
  return session;
}

test('四個活動與八個 stage IDs、課綱 mapping、狀態和 catalog entry 正確', () => {
  const activityIds = GRADE1_HPE_EXPANSION_ACTIVITIES.map(({ activityId }) => activityId);
  const stageIds = GRADE1_HPE_EXPANSION_ACTIVITIES.flatMap(({ stages }) => stages.map(({ stageId }) => stageId));
  assert.deepEqual(activityIds, expected.map(([id]) => id));
  assert.equal(new Set(activityIds).size, 4);
  assert.equal(stageIds.length, 8);
  assert.equal(new Set(stageIds).size, 8);
  for (const [activityId, title, mapId, stageIdsForActivity] of expected) {
    const task = CATALOG_CANDIDATE_TASK_BY_ID.get(activityId);
    assert.ok(task);
    assert.equal(task.title, title);
    assert.equal(task.curriculumMapId, mapId);
    assert.equal(task.gradeId, 'grade-1');
    assert.equal(task.subjectId, 'health-physical-education');
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.deepEqual(task.stages.map(({ stageId }) => stageId), stageIdsForActivity);
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(maps.get(mapId)?.status, 'pending_review');
    assert.equal(maps.get(mapId)?.candidateAlignmentStatus, 'partial_reference_pending_teacher_review');
  }
  assert.equal(hpeSubject.existingYearLevelContent.length, 5);
  assert.equal(hpeSubject.existingYearLevelContent.reduce((sum, entry) => sum + CATALOG_CANDIDATE_TASK_BY_ID.get(entry.activityId).stages.length, 0), 11);
  for (const entry of hpeSubject.existingYearLevelContent) {
    assert.equal(entry.entryRoute.directLaunch, true);
    assert.ok(CATALOG_CANDIDATE_TASK_BY_ID.has(entry.activityId));
  }
  assert.equal(GRADE1_PLAYGROUND_SAFETY_ROUTE.activityId, 'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE');
  assert.deepEqual(GRADE1_PLAYGROUND_SAFETY_ROUTE.stages.map(({ stageId }) => stageId), [
    'inspect-playground-and-school-route-scenes', 'order-response-to-blocked-route', 'transfer-to-unfamiliar-playground-scene',
  ]);
});

test('八關學生可見題目、卡片、分類、選項、提示與回饋注音逐字對齊', () => {
  for (const activity of GRADE1_HPE_EXPANSION_ACTIVITIES) {
    assert.equal(activity.teacherReview.status, 'pending_teacher_review');
    for (const stage of activity.stages) {
      assertAnnotated(stage.prompt, stage.promptPronunciationTokens);
      if (stage.studentOperationGuidance) assertAnnotated(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
      if (stage.studentSubmitLabel) assertAnnotated(stage.studentSubmitLabel, stage.studentSubmitLabelPronunciationTokens);
      for (const card of stage.observations ?? []) assertAnnotated(card.text, card.pronunciationTokens);
      for (const category of stage.categories ?? []) assertAnnotated(category.label, category.pronunciationTokens);
      for (const item of stage.items ?? []) assertAnnotated(item.text, item.pronunciationTokens);
      for (const option of stage.options ?? []) {
        assertAnnotated(option.text, option.pronunciationTokens);
        if (option.feedback !== undefined) assertAnnotated(option.feedback, option.feedbackPronunciationTokens);
      }
      for (const item of stage.hints ?? []) assertAnnotated(item.text, item.pronunciationTokens);
      assertAnnotated(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
      assertAnnotated(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
      assert.ok(stage.teacherLimitationNote);
    }
  }
});

test('四個分類關未分完不能提交；錯誤完整分類可提交並判錯，正確分類成功', () => {
  for (const activity of GRADE1_HPE_EXPANSION_ACTIVITIES) {
    const stage = activity.stages.find(({ interaction }) => interaction === 'classify_observations');
    let session = enterStage(activity, activity.stages.indexOf(stage));
    assert.equal(submit(session, activity, `${stage.stageId}-empty`).error, 'response_required');
    const wrongObservation = stage.observations[0];
    const wrongCategoryId = stage.categories.find(({ id }) => id !== stage.correctAssignments[wrongObservation.id])?.id;
    assert.ok(wrongCategoryId);
    for (const observation of stage.observations) {
      const categoryId = observation.id === wrongObservation.id ? wrongCategoryId : stage.correctAssignments[observation.id];
      session = act(session, activity, 'assign_category', { observationId: observation.id, categoryId });
    }
    assert.equal(Object.keys(session.assignments).length, stage.observations.length);
    let result = submit(session, activity, `${stage.stageId}-wrong`);
    assert.equal(result.error, undefined);
    assert.equal(result.session.phase, 'feedback');
    assert.equal(result.attempt.result, 'incorrect');
    session = act(result.session, activity, 'retry');
    assert.deepEqual(session.assignments, {});
    for (const [observationId, categoryId] of Object.entries(stage.correctAssignments)) session = act(session, activity, 'assign_category', { observationId, categoryId });
    result = submit(session, activity, `${stage.stageId}-correct`);
    assert.equal(result.session.phase, 'success');
    assert.equal(result.attempt.result, 'correct');
  }
});

test('三個單選關空白不能提交，錯選判錯，正選判對', () => {
  for (const activity of GRADE1_HPE_EXPANSION_ACTIVITIES) {
    const stageIndex = activity.stages.findIndex(({ interaction }) => interaction === 'choose_response');
    if (stageIndex < 0) continue;
    const stage = activity.stages[stageIndex];
    let session = enterStage(activity, stageIndex);
    assert.equal(submit(session, activity, `${stage.stageId}-empty`).error, 'response_required');
    const wrongId = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = act(session, activity, 'select_option', { optionId: wrongId });
    let result = submit(session, activity, `${stage.stageId}-wrong`);
    assert.equal(result.session.phase, 'feedback');
    assert.equal(result.attempt.result, 'incorrect');
    session = act(result.session, activity, 'retry');
    assert.deepEqual(session.selection, []);
    session = act(session, activity, 'select_option', { optionId: stage.correctOptionIds[0] });
    result = submit(session, activity, `${stage.stageId}-correct`);
    assert.equal(result.session.phase, 'success');
    assert.equal(result.attempt.result, 'correct');
  }
});

test('洗手排序錯序判錯，重試重置後正序成功；Grade 1–2 固定排序 UI 注音且 Grade 3–6 原樣', () => {
  const activity = GRADE1_HPE_EXPANSION_ACTIVITIES[0];
  const stage = activity.stages.find(({ interaction }) => interaction === 'order_items');
  let session = enterStage(activity, activity.stages.indexOf(stage));
  assert.equal(stage.requiredSelectionCount, undefined);
  assert.equal(session.orderedItems.length, stage.items.length, 'the full ordering board is ready from its initial state');
  let result = submit(session, activity, `${stage.stageId}-wrong-order`);
  assert.equal(result.session.phase, 'feedback');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, activity, 'retry');
  assert.deepEqual(session.orderedItems, stage.initialOrder);
  session = applyCorrect(session, activity, stage);
  result = submit(session, activity, `${stage.stageId}-correct-order`);
  assert.equal(result.session.phase, 'success');
  assert.equal(result.attempt.result, 'correct');
  assert.match(stage.studentOperationGuidance, /步驟/u);
  assert.doesNotMatch(stage.studentOperationGuidance, /故事卡|排成一句/u);

  const app = readFileSync('prototype/app.js', 'utf8');
  const uiStart = app.indexOf('const ORDER_ITEMS_UI_PRONUNCIATION');
  const uiEnd = app.indexOf('function buildArrayUiPronunciationTokens', uiStart);
  const uiSource = app.slice(uiStart, uiEnd);
  for (const label of ['目前順序', '上移', '下移', '檢查順序']) assert.ok(uiSource.includes(`'${label}'`));
  assert.match(app, /if \(lowGradeOrderItems\) appendOrderItemsUiText\(orderHeading/u);
  assert.match(app, /if \(lowGradeOrderItems\) appendOrderItemsUiText\(up, '上移'/u);
  assert.match(app, /if \(lowGradeOrderItems\) appendOrderItemsUiText\(down, '下移'/u);
  assert.match(app, /else orderHeading\.textContent = '目前順序'/u);
  assert.match(app, /else up\.textContent = '上移'/u);
  assert.match(app, /else down\.textContent = '下移'/u);
  assert.match(app, /lowGradeOrderItems && index < 20 \? String\.fromCodePoint\(0x2460 \+ index\) : String\(index \+ 1\)/u);
});
