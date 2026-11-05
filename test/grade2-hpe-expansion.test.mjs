import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE2_HPE_EXPANSION_ACTIVITIES } from '../prototype/data/grade2HpeExpansionActivities.js';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const curriculumMap = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const focusRows = [...curriculumMap.verifiedLearningFocuses, ...curriculumMap.supplementalVerifiedLearningFocuses, ...curriculumMap.pendingLearningFocuses];
const byId = new Map(GRADE2_HPE_EXPANSION_ACTIVITIES.map((activity) => [activity.activityId, activity]));
const expected = [
  ['ACT-G2-HPE-WARMUP-SEQUENCE-CANDIDATE', ['order-teacher-warmup-sequence', 'choose-wait-for-start-signal'], 'health-pe-stage1-safe-warmup-and-movement'],
  ['ACT-G2-HPE-SCHOOL-ACTIVITY-MAP-CANDIDATE', ['locate-jump-rope-activity-space', 'locate-passing-activity-space'], 'health-pe-stage1-school-activity-space-resources'],
];

function apply(session, activity, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${activity.activityId}: ${action}`);
  return result.session;
}

function submit(session, activity, submissionId) {
  const result = dispatchLearningTask(session, activity, 'submit', { submissionId });
  assert.equal(result.error, undefined, `${activity.activityId}: submit`);
  return result.session;
}

function arrange(session, activity, targetOrder) {
  let state = session;
  for (let index = 0; index < targetOrder.length; index += 1) {
    const fromIndex = state.orderedItems.indexOf(targetOrder[index]);
    if (fromIndex !== index) state = apply(state, activity, 'move_ordered_item', { itemId: targetOrder[index], toIndex: index });
  }
  return state;
}

test('兩個二年級 HPE 候選活動 ID、課綱 mapping 與學生目錄入口有效且唯一', () => {
  const ids = GRADE2_HPE_EXPANSION_ACTIVITIES.map(({ activityId }) => activityId);
  assert.equal(new Set(ids).size, 2);
  const stageIds = GRADE2_HPE_EXPANSION_ACTIVITIES.flatMap(({ stages }) => stages.map(({ stageId }) => stageId));
  assert.equal(new Set(stageIds).size, 4);
  assert.ok(ids.every((id) => CATALOG_CANDIDATE_TASKS.filter((task) => task.activityId === id).length === 1));
  assert.ok(ids.every((id) => CATALOG_CANDIDATE_TASK_BY_ID.has(id)));
  const grade2Hpe = getCatalogCandidateTasksForSubject('grade-2', 'health-physical-education');
  assert.deepEqual(grade2Hpe.map(({ activityId }) => activityId).sort(), [...ids].sort());
  const entries = getGradeById('grade-2').subjects.find(({ subjectId }) => subjectId === 'health-physical-education').existingYearLevelContent;
  assert.equal(entries.length, 2);
  for (const [activityId, expectedStageIds, mapId] of expected) {
    const activity = byId.get(activityId);
    assert.ok(activity, activityId);
    assert.equal(activity.gradeId, 'grade-2');
    assert.equal(activity.subjectId, 'health-physical-education');
    assert.equal(activity.status, 'candidate_pending_teacher_review');
    assert.equal(activity.teacherReview.status, 'pending_teacher_review');
    assert.equal(activity.teacherReview.evidenceStatus, 'partial');
    assert.equal(activity.curriculumMapId, mapId);
    assert.ok(focusRows.some(({ id }) => id === mapId), mapId);
    assert.deepEqual(activity.stages.map(({ stageId }) => stageId), expectedStageIds);
    assert.equal(entries.filter(({ activityId: entryId }) => entryId === activityId).length, 1);
    assert.equal(entries.find(({ activityId: entryId }) => entryId === activityId).entryRoute.directLaunch, true);
    assert.match(entries.find(({ activityId: entryId }) => entryId === activityId).runtimeModule, /grade2HpeExpansionActivities\.js$/);
    assert.deepEqual(validateLearningTask(activity), [], activityId);
  }
  assert.deepEqual(byId.get(expected[0][0]).curriculumCodes, ['Bc-Ⅰ-1', '3c-Ⅰ-2']);
  assert.deepEqual(byId.get(expected[1][0]).curriculumCodes, ['Cb-Ⅰ-3', '4c-Ⅰ-1']);
});

test('暖身順序關卡可提交完整排序、錯序判錯、重試清空並可正確完成', () => {
  const activity = byId.get(expected[0][0]);
  const stage = activity.stages[0];
  let session = apply(createLearningTaskSession(activity), activity, 'start');
  assert.equal(stage.interaction, 'order_items');
  assert.equal(stage.items.length, 4);
  assert.equal(session.orderedItems.length, 4);
  assert.deepEqual(stage.correctItemIds, ['listen-to-rules', 'check-activity-space', 'do-warmup-with-teacher', 'start-after-signal']);
  assert.notDeepEqual(stage.initialOrder, stage.correctItemIds);
  session = submit(session, activity, 'warmup-wrong');
  assert.equal(session.phase, 'feedback');
  assert.equal(session.lastFeedback.correct, false);
  session = apply(session, activity, 'retry');
  assert.deepEqual(session.orderedItems, stage.initialOrder);
  session = arrange(session, activity, stage.correctItemIds);
  assert.deepEqual(session.orderedItems, stage.correctItemIds);
  session = submit(session, activity, 'warmup-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.lastFeedback.correct, true);
  assert.match(activity.curriculumScope, /不代表所有運動都使用同一套流程/);

  const confirmStage = activity.stages[1];
  assert.equal(confirmStage.interaction, 'choose_response');
  session = apply(session, activity, 'next');
  session = apply(session, activity, 'select_option', { optionId: 'start-immediately' });
  session = submit(session, activity, 'warmup-confirm-wrong');
  assert.equal(session.phase, 'feedback');
  assert.equal(session.lastFeedback.correct, false);
  session = apply(session, activity, 'retry');
  assert.deepEqual(session.selection, []);
  session = apply(session, activity, 'select_option', { optionId: 'wait-and-confirm' });
  session = submit(session, activity, 'warmup-confirm-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.lastFeedback.correct, true);
  session = apply(session, activity, 'next');
  assert.equal(session.phase, 'completed');
  session = apply(session, activity, 'restart', { sessionId: 'warmup-reentered' });
  assert.equal(session.phase, 'intro');
  session = apply(session, activity, 'start');
  assert.equal(session.phase, 'active');
});

test('校園示意地圖單選要求選答、錯答判錯、重試清空並接受圖例正解', () => {
  const activity = byId.get(expected[1][0]);
  const stage = activity.stages[0];
  let session = apply(createLearningTaskSession(activity), activity, 'start');
  assert.equal(stage.interaction, 'choose_response');
  const emptySubmit = dispatchLearningTask(session, activity, 'submit', { submissionId: 'map-empty' });
  assert.equal(emptySubmit.error, 'response_required');
  assert.equal(emptySubmit.session.phase, 'active');
  session = apply(session, activity, 'select_option', { optionId: 'passing-zone' });
  session = submit(session, activity, 'map-wrong');
  assert.equal(session.phase, 'feedback');
  assert.equal(session.lastFeedback.correct, false);
  session = apply(session, activity, 'retry');
  assert.deepEqual(session.selection, []);
  session = apply(session, activity, 'select_option', { optionId: 'jump-rope-zone' });
  session = submit(session, activity, 'map-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.lastFeedback.correct, true);
  assert.equal(stage.tableView, undefined);
  assert.match(stage.context.find(({ speaker }) => speaker === '圖例').text, /◎：跳繩區；●：傳球區；→：通行道/);
  assert.match(stage.context.find(({ speaker }) => speaker === '示意地圖').text, /左到右是 ◎、●、→/);
  assert.match(stage.context.find(({ speaker }) => speaker === '提醒').text, /示意地圖，不是真實學校場地/);
  assert.deepEqual(stage.correctOptionIds, ['jump-rope-zone']);

  session = apply(session, activity, 'next');
  const passingStage = activity.stages[1];
  assert.equal(passingStage.interaction, 'choose_response');
  assert.deepEqual(passingStage.correctOptionIds, ['north-middle']);
  assert.equal(passingStage.tableView, undefined);
  assert.match(passingStage.context.find(({ speaker }) => speaker === '圖例').text, /●：傳球區/);
  assert.match(passingStage.context.find(({ speaker }) => speaker === '示意地圖').text, /北側由左到右是 ◎、●、→/);
  assert.match(passingStage.context.find(({ speaker }) => speaker === '提醒').text, /示意地圖，不是真實學校場地/);
  const emptyPassingSubmit = dispatchLearningTask(session, activity, 'submit', { submissionId: 'map-passing-empty' });
  assert.equal(emptyPassingSubmit.error, 'response_required');
  session = apply(session, activity, 'select_option', { optionId: 'north-right' });
  session = submit(session, activity, 'map-passing-wrong');
  assert.equal(session.lastFeedback.correct, false);
  session = apply(session, activity, 'retry');
  assert.deepEqual(session.selection, []);
  session = apply(session, activity, 'select_option', { optionId: 'north-middle' });
  session = submit(session, activity, 'map-passing-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.lastFeedback.correct, true);
  session = apply(session, activity, 'next');
  assert.equal(session.phase, 'completed');
  session = apply(session, activity, 'restart', { sessionId: 'map-reentered' });
  assert.equal(session.phase, 'intro');
  session = apply(session, activity, 'start');
  assert.equal(session.phase, 'active');
});

test('兩關均有繁體中文提示與正誤回饋，且只描述模擬練習', () => {
  for (const activity of GRADE2_HPE_EXPANSION_ACTIVITIES) {
    for (const stage of activity.stages) {
      assert.equal(stage.hints.length, 2);
      assert.ok(stage.hints.every((hint) => /[\u4e00-\u9fff]/u.test(hint)));
      assert.ok(/[\u4e00-\u9fff]/u.test(stage.correctFeedback));
      assert.ok(/[\u4e00-\u9fff]/u.test(stage.incorrectFeedback));
      assert.ok(stage.teacherLimitationNote);
    }
    assert.equal(activity.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(activity.evidencePolicy.completionIsMastery, false);
  }
});
