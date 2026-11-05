import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { GRADE1_LIVING_EXPANSION_ACTIVITIES } from '../prototype/data/grade1LivingExpansionActivities.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const expectedActivities = [
  ['ACT-G1-LIVING-SHARED-PLAY-RULES-CANDIDATE', '輪流小隊：大家一起讀故事', 'living-curriculum-stage1-shared-rules', ['6-I-3', 'E-I-2'], [
    ['sort-turn-taking-actions', 'classify_observations'], ['choose-restart-shared-reading', 'choose_response'],
  ]],
  ['ACT-G1-LIVING-CAMPUS-CLUE-HUNT-CANDIDATE', '校園觀察隊：找出角落線索', 'living-curriculum-stage1-observation-inquiry', ['2-I-1', '2-I-5', 'C-I-3'], [
    ['collect-campus-feature-clues', 'collect_evidence'], ['sort-campus-feature-records', 'classify_observations'],
  ]],
  ['ACT-G1-LIVING-SMALL-PROBLEM-SOLVER-CANDIDATE', '小小解決隊：照線索排步驟', 'living-curriculum-stage1-observation-inquiry', ['2-I-4', '2-I-5', 'C-I-3'], [
    ['gather-useful-problem-clues', 'collect_evidence'], ['order-helpful-solution-steps', 'order_items'],
  ]],
  ['ACT-G1-LIVING-OBSERVATION-MINI-INQUIRY-CANDIDATE', '觀察記錄小隊：比較兩個地方', 'living-curriculum-stage1-observation-inquiry', ['2-I-1', '2-I-4', '2-I-5', 'C-I-3'], [
    ['order-observation-steps', 'order_items'], ['select-records-for-question', 'collect_evidence'],
  ]],
];

function assertAnnotated(text, tokens) {
  assert.ok(Array.isArray(tokens), `pronunciation metadata missing for: ${text}`);
  assert.equal(tokens.map(({ text: character }) => character).join(''), text, `pronunciation alignment: ${text}`);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `Han character lacks reading: ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han character has an artificial reading: ${token.text} in ${text}`);
  }
}

function assertStagePronunciation(stage) {
  assertAnnotated(stage.prompt, stage.promptPronunciationTokens);
  if (stage.interaction === 'order_items') {
    assert.ok(stage.studentOperationGuidance, `${stage.stageId} needs stage-specific ordering guidance`);
    assertAnnotated(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
    assert.match(stage.studentOperationGuidance, /排先後/u);
    assert.doesNotMatch(stage.studentOperationGuidance, /故事卡|排成一句/u);
  } else if (stage.studentOperationGuidance !== undefined) {
    assertAnnotated(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
  }
  for (const item of stage.items ?? []) assertAnnotated(item.text, item.pronunciationTokens);
  for (const card of stage.observations ?? []) assertAnnotated(card.text, card.pronunciationTokens);
  for (const group of stage.categories ?? []) assertAnnotated(group.label, group.pronunciationTokens);
  for (const option of stage.options ?? []) {
    assertAnnotated(option.text, option.pronunciationTokens);
    assertAnnotated(option.feedback, option.feedbackPronunciationTokens);
  }
  for (const hint of stage.hints ?? []) assertAnnotated(hint.text, hint.pronunciationTokens);
  assertAnnotated(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
  assertAnnotated(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
}

function act(session, activity, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${activity.activityId}/${activity.stages[session.stageIndex].stageId}: ${action}`);
  return result.session;
}

function submit(session, activity, id) {
  const result = dispatchLearningTask(session, activity, 'submit', { submissionId: id });
  assert.equal(result.error, undefined);
  return result;
}

function start(activity, id) {
  return act(createLearningTaskSession(activity, id), activity, 'start');
}

function selectEvidence(session, activity, ids) {
  for (const optionId of ids) session = act(session, activity, 'toggle_evidence', { optionId });
  return session;
}

function assignAll(session, activity, assignments) {
  for (const [observationId, categoryId] of Object.entries(assignments)) {
    session = act(session, activity, 'assign_category', { observationId, categoryId });
  }
  return session;
}

function arrange(session, activity, desiredIds) {
  for (let target = 0; target < desiredIds.length; target += 1) {
    const current = session.orderedItems.indexOf(desiredIds[target]);
    if (current !== target) session = act(session, activity, 'move_ordered_item', { itemId: desiredIds[target], toIndex: target });
  }
  return session;
}

test('四個新活動、八個 stage 已接入 Grade 1 生活課程學生 catalog', () => {
  assert.equal(GRADE1_LIVING_EXPANSION_ACTIVITIES.length, 4);
  for (const [activityId, title, mapId, codes, stages] of expectedActivities) {
    const task = CATALOG_CANDIDATE_TASK_BY_ID.get(activityId);
    assert.ok(task, `catalog registration missing: ${activityId}`);
    assert.equal(task.title, title);
    assert.equal(task.curriculumMapId, mapId);
    assert.deepEqual(task.curriculumCodes, codes);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.gradeId, 'grade-1');
    assert.equal(task.subjectId, 'living-curriculum');
    assert.equal(task.stages.length, 2);
    assert.deepEqual(task.stages.map(({ stageId, interaction }) => [stageId, interaction]), stages);
    assert.deepEqual(validateLearningTask(task), []);
    assert.ok(task.runtimeModule.endsWith('/grade1LivingExpansionActivities.js'));
    assert.equal(task.teacherReview.status, 'not_reviewed');
  }
  const living = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-1').subjects.find(({ subjectId }) => subjectId === 'living-curriculum');
  const launchable = living.existingYearLevelContent;
  assert.equal(launchable.length, 6);
  assert.equal(new Set(launchable.map(({ activityId }) => activityId)).size, launchable.length);
  assert.equal(launchable.reduce((sum, activity) => sum + CATALOG_CANDIDATE_TASK_BY_ID.get(activity.activityId).stages.length, 0), 12);
  for (const [activityId] of expectedActivities) {
    assert.ok(launchable.some((activity) => activity.activityId === activityId && activity.entryRoute.directLaunch));
    assert.ok(CATALOG_CANDIDATE_TASKS.some((activity) => activity.activityId === activityId));
  }
});

test('所有新活動的學生中文均有逐字人工注音，數字與符號保持原樣，限制文字留在教師欄位', () => {
  for (const activity of GRADE1_LIVING_EXPANSION_ACTIVITIES) {
    assertAnnotated(activity.title, activity.titlePronunciationTokens);
    assertAnnotated(activity.instructions, activity.instructionsPronunciationTokens);
    assert.ok(activity.teacherLimitationNote.includes('數位模擬'));
    assert.ok(activity.teacherLimitationNote.includes('教師審查'));
    for (const stage of activity.stages) {
      assertStagePronunciation(stage);
      assert.ok(stage.teacherLimitationNote.includes('實地觀察'));
      for (const feedback of [stage.correctFeedback, stage.incorrectFeedback, ...(stage.options ?? []).flatMap((option) => [option.feedback])]) {
        assert.ok(!/數位模擬|教師審查|課綱只作/u.test(feedback));
      }
    }
  }
  const orderStages = GRADE1_LIVING_EXPANSION_ACTIVITIES.flatMap(({ stages }) => stages).filter(({ interaction }) => interaction === 'order_items');
  assert.equal(orderStages.length, 2);
  for (const stage of orderStages) {
    assert.match(stage.studentOperationGuidance, /排先後/u);
    assert.doesNotMatch(stage.studentOperationGuidance, /故事卡|排成一句/u);
    assertAnnotated(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
  }
});

test('輪流小隊的分類與重新挑戰、情境選擇都依正確答案判分', () => {
  const task = CATALOG_CANDIDATE_TASK_BY_ID.get(expectedActivities[0][0]);
  const [sort, choose] = task.stages;
  assert.equal(new Set(Object.values(sort.correctAssignments)).size, 2);
  assert.equal(Object.keys(sort.correctAssignments).length, sort.observations.length);
  let session = start(task, 'living-rules');
  session = act(session, task, 'assign_category', { observationId: 'wait-for-turn', categoryId: 'helps-taking-turns' });
  let result = dispatchLearningTask(session, task, 'submit');
  assert.equal(result.error, 'response_required');
  const wrongAssignments = { ...sort.correctAssignments, 'wait-for-turn': 'interrupts-turns' };
  session = assignAll(result.session, task, wrongAssignments);
  result = submit(session, task, 'rules-sort-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, task, 'retry');
  session = assignAll(session, task, sort.correctAssignments);
  result = submit(session, task, 'rules-sort-correct');
  assert.equal(result.attempt.result, 'correct');
  session = act(result.session, task, 'next');
  session = act(session, task, 'select_option', { optionId: 'keep-own-turn' });
  result = submit(session, task, 'rules-choice-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, task, 'retry');
  session = act(session, task, 'select_option', { optionId: 'give-an-the-next-turn' });
  assert.equal(submit(session, task, 'rules-choice-correct').attempt.result, 'correct');
});

test('校園線索蒐集須選滿兩張但錯誤線索仍可提交，分類需完成每張卡', () => {
  const task = CATALOG_CANDIDATE_TASK_BY_ID.get(expectedActivities[1][0]);
  const [collect, classify] = task.stages;
  assert.equal(collect.requiredSelectionCount, 2);
  let session = start(task, 'campus-clues');
  assert.equal(dispatchLearningTask(session, task, 'submit').error, 'response_required');
  session = act(session, task, 'toggle_evidence', { optionId: 'garden-plant-record' });
  assert.equal(dispatchLearningTask(session, task, 'submit').error, 'response_required');
  session = act(session, task, 'toggle_evidence', { optionId: 'hall-window-no-plant' });
  const overLimit = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: 'classroom-door-plant-record' });
  assert.equal(overLimit.error, 'required_selection_count_reached');
  let result = submit(session, task, 'campus-evidence-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, task, 'retry');
  session = selectEvidence(session, task, collect.correctOptionIds);
  result = submit(session, task, 'campus-evidence-correct');
  assert.equal(result.attempt.result, 'correct');
  session = act(result.session, task, 'next');
  session = act(session, task, 'assign_category', { observationId: classify.observations[0].id, categoryId: 'record-says-no-plant' });
  assert.equal(dispatchLearningTask(session, task, 'submit').error, 'response_required');
  session = assignAll(session, task, classify.correctAssignments);
  session = act(session, task, 'assign_category', { observationId: classify.observations[0].id, categoryId: 'record-says-no-plant' });
  assert.equal(Object.keys(session.assignments).length, classify.observations.length);
  result = submit(session, task, 'campus-classify-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, task, 'retry');
  result = submit(assignAll(session, task, classify.correctAssignments), task, 'campus-classify-correct');
  assert.equal(result.attempt.result, 'correct');
});

test('解決隊與觀察小隊排序可判正誤，線索蒐集 required count 可重試', () => {
  const problem = CATALOG_CANDIDATE_TASK_BY_ID.get(expectedActivities[2][0]);
  const [clues, steps] = problem.stages;
  assert.equal(clues.requiredSelectionCount, 2);
  let session = start(problem, 'problem-clues');
  session = act(session, problem, 'toggle_evidence', { optionId: 'classmate-folder' });
  session = act(session, problem, 'toggle_evidence', { optionId: 'paper-color' });
  let result = submit(session, problem, 'problem-clues-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, problem, 'retry');
  session = selectEvidence(session, problem, clues.correctOptionIds);
  result = submit(session, problem, 'problem-clues-correct');
  assert.equal(result.attempt.result, 'correct');
  session = act(result.session, problem, 'next');
  assert.deepEqual(session.orderedItems, [...steps.initialOrder]);
  result = submit(session, problem, 'problem-order-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, problem, 'retry');
  session = arrange(session, problem, steps.correctItemIds);
  assert.deepEqual(session.orderedItems, [...steps.correctItemIds]);
  assert.equal(submit(session, problem, 'problem-order-correct').attempt.result, 'correct');

  const inquiry = CATALOG_CANDIDATE_TASK_BY_ID.get(expectedActivities[3][0]);
  const [observe, records] = inquiry.stages;
  session = start(inquiry, 'inquiry-order');
  result = submit(session, inquiry, 'inquiry-order-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, inquiry, 'retry');
  session = arrange(session, inquiry, observe.correctItemIds);
  result = submit(session, inquiry, 'inquiry-order-correct');
  assert.equal(result.attempt.result, 'correct');
  session = act(result.session, inquiry, 'next');
  assert.equal(records.requiredSelectionCount, 2);
  assert.equal(dispatchLearningTask(session, inquiry, 'submit').error, 'response_required');
  session = act(session, inquiry, 'toggle_evidence', { optionId: 'compare-door' });
  session = act(session, inquiry, 'toggle_evidence', { optionId: 'compare-playground' });
  result = submit(session, inquiry, 'inquiry-records-wrong');
  assert.equal(result.attempt.result, 'incorrect');
  session = act(result.session, inquiry, 'retry');
  session = selectEvidence(session, inquiry, records.correctOptionIds);
  assert.equal(submit(session, inquiry, 'inquiry-records-correct').attempt.result, 'correct');
});
