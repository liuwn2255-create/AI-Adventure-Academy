import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE3_MATH_DATA_EXPANSION_TASKS } from '../prototype/data/grade3MathDataExpansionTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const curriculumMap = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const definitions = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));

function dispatch(session, activity, action, payload) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.changed, true, `${activity.activityId}/${activity.stages[session.stageIndex]?.stageId}: ${action} should change state; got ${result.error}`);
  return result.session;
}

function submit(session, activity) {
  return dispatch(session, activity, 'submit', { submissionId: `${session.sessionId}:${session.stageIndex}:${session.attempts.length}` });
}

function attemptWrong(session, activity, stage) {
  if (stage.interaction === 'build_frequency_table' || stage.interaction === 'classify_observations') {
    if (stage.collectionRules) for (const observationId of stage.collectionRules.requiredObservationIds) session = dispatch(session, activity, 'toggle_table_observation', { observationId });
    if (!stage.initialAssignments) {
    for (const observation of stage.observations) session = dispatch(session, activity, 'assign_category', { observationId: observation.id, categoryId: stage.categories[0].id });
    }
  } else if (stage.interaction === 'choose_response' || stage.interaction === 'collect_evidence') {
    const wrong = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    session = dispatch(session, activity, stage.interaction === 'collect_evidence' ? 'toggle_evidence' : 'select_option', { optionId: wrong.id });
  } else if (stage.interaction === 'order_items') {
    // The task's initialized order is intentionally wrong in each sorting stage.
  } else {
    assert.fail(`No wrong-response test helper for ${stage.interaction}`);
  }
  session = submit(session, activity);
  assert.equal(session.phase, 'feedback', `${stage.stageId} should expose an incorrect-answer state`);
  session = dispatch(session, activity, 'retry');
  assert.equal(session.phase, 'active');
  return session;
}

function answerCorrectly(session, activity, stage) {
  if (stage.interaction === 'build_frequency_table' || stage.interaction === 'classify_observations') {
    if (stage.collectionRules) for (const observationId of stage.collectionRules.requiredObservationIds) session = dispatch(session, activity, 'toggle_table_observation', { observationId });
    for (const [observationId, categoryId] of Object.entries(stage.correctAssignments)) session = dispatch(session, activity, 'assign_category', { observationId, categoryId });
  } else if (stage.interaction === 'choose_response' || stage.interaction === 'collect_evidence') {
    for (const optionId of stage.correctOptionIds) session = dispatch(session, activity, stage.interaction === 'collect_evidence' ? 'toggle_evidence' : 'select_option', { optionId });
  } else if (stage.interaction === 'order_items') {
    for (let targetIndex = 0; targetIndex < stage.correctItemIds.length; targetIndex += 1) {
      const itemId = stage.correctItemIds[targetIndex];
      const fromIndex = session.orderedItems.indexOf(itemId);
      if (fromIndex !== targetIndex) session = dispatch(session, activity, 'move_ordered_item', { itemId, toIndex: targetIndex });
    }
  } else {
    assert.fail(`No correct-response test helper for ${stage.interaction}`);
  }
  session = submit(session, activity);
  assert.equal(session.phase, 'success', `${stage.stageId} should accept the independently specified response`);
  return dispatch(session, activity, 'next');
}

test('three D-3-1 table activities are unique, traceable, playable candidates in the Grade 3 mathematics directory', () => {
  assert.equal(GRADE3_MATH_DATA_EXPANSION_TASKS.length, 3);
  const ids = GRADE3_MATH_DATA_EXPANSION_TASKS.map(({ activityId }) => activityId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const d31Audit = JSON.parse(fs.readFileSync(new URL('../curriculum/math-grade3-official-content-batch.json', import.meta.url), 'utf8')).activityAudit.find(({ code }) => code === 'D-3-1');
  assert.equal(d31Audit.status, 'partial');
  assert.equal(d31Audit.activityIds.length, 3);
  assert.ok(d31Audit.evidenceStageIds.includes('place-survey-cards-in-cross-table'));
  assert.ok(d31Audit.evidenceStageIds.includes('repair-misfiled-survey-card'));
  const focus = curriculumMap.verifiedLearningFocuses.find(({ id }) => id === 'math-grade3-d-3-1-data-tables')
    ?? curriculumMap.supplementalVerifiedLearningFocuses.find(({ id }) => id === 'math-grade3-d-3-1-data-tables')
    ?? curriculumMap.pendingLearningFocuses.find(({ id }) => id === 'math-grade3-d-3-1-data-tables');
  assert.ok(focus, 'D-3-1 curriculum focus must already exist');
  assert.equal(focus.officialTextReviewStatus, 'verified_against_official_text');
  for (const task of GRADE3_MATH_DATA_EXPANSION_TASKS) {
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(task.gradeId, 'grade-3');
    assert.equal(task.subjectId, 'mathematics');
    assert.equal(task.curriculumMapId, focus.id);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.get(task.activityId), task);
    assert.ok(getGradeById('grade-3').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
    assert.ok(task.stages.every(({ hints, incorrectFeedback }) => hints.length >= 2 && incorrectFeedback));
  }
  const relation = getLearningTaskRelation('grade-3', 'mathematics');
  for (const task of GRADE3_MATH_DATA_EXPANSION_TASKS) {
    assert.ok(relation.tasks.some(({ taskId }) => taskId === task.activityId));
    assert.ok(relation.learningObjectiveTaskLinks.some(({ learningObjectiveId, taskIds }) => learningObjectiveId === task.learningObjective.objectiveId && taskIds.includes(task.activityId)));
  }
  for (const task of GRADE3_MATH_DATA_EXPANSION_TASKS) {
    const subitem = definitions.definitions.find(({ subitemId }) => subitemId === task.coverage.subitemId);
    assert.ok(subitem, `subitem ${task.coverage.subitemId} exists`);
    assert.equal(subitem.focusId, task.curriculumMapId);
    assert.deepEqual(subitem.activityIds, [task.activityId]);
    assert.ok(subitem.decompositionKind.startsWith('project_decomposition'));
    for (const claimId of task.learningSubitemClaims) {
      const claimed = definitions.definitions.find(({ subitemId }) => subitemId === claimId);
      assert.ok(claimed, `claimed subitem ${claimId} exists`);
      assert.ok(claimed.activityIds.includes(task.activityId));
      assert.ok(claimed.evidenceStageIds.every((stageId) => task.stages.some((stage) => stage.stageId === stageId)), `all ${claimId} evidence stages exist in the activity`);
    }
  }
});

test('cross-tab construction visibly derives each matrix count from assigned survey cards', () => {
  const task = GRADE3_MATH_DATA_EXPANSION_TASKS[0];
  const stage = task.stages[0];
  const ids = Object.values(stage.crossTab.cellCategoryIds);
  assert.equal(new Set(ids).size, 4);
  assert.deepEqual(Object.keys(stage.correctAssignments).sort(), stage.observations.map(({ id }) => id).sort());
  const counts = Object.fromEntries(ids.map((id) => [id, Object.values(stage.correctAssignments).filter((value) => value === id).length]));
  assert.deepEqual(counts, { 'walk-sunny': 3, 'walk-cloudy': 1, 'bus-sunny': 2, 'bus-cloudy': 0 });
  assert.equal(Object.values(counts).reduce((sum, value) => sum + value, 0), stage.observations.length);
});

test('D-3-1 builder collects simulated records, derives table counts, and repairs a misfiled record', () => {
  const activity = GRADE3_MATH_DATA_EXPANSION_TASKS[0];
  const collectionStage = activity.stages[0];
  let session = createLearningTaskSession(activity, 'd31-collection-proof');
  session = dispatch(session, activity, 'start');
  assert.deepEqual(session.collectedObservationIds, []);
  assert.equal(dispatchLearningTask(session, activity, 'assign_category', { observationId: 'card-1', categoryId: 'walk-sunny' }).error, 'observation_not_collected');
  assert.equal(dispatchLearningTask(session, activity, 'submit').error, 'response_required');
  for (const id of collectionStage.collectionRules.requiredObservationIds) session = dispatch(session, activity, 'toggle_table_observation', { observationId: id });
  assert.equal(session.collectedObservationIds.length, 6);
  for (const [id, categoryId] of Object.entries(collectionStage.correctAssignments)) session = dispatch(session, activity, 'assign_category', { observationId: id, categoryId });
  const counts = Object.fromEntries(collectionStage.categories.map(({ id }) => [id, Object.values(session.assignments).filter((value) => value === id).length]));
  assert.deepEqual(counts, { 'walk-sunny': 3, 'walk-cloudy': 1, 'bus-sunny': 2, 'bus-cloudy': 0 });

  const repair = activity.stages[1];
  session = submit(session, activity);
  assert.equal(session.phase, 'success');
  session = dispatch(session, activity, 'next');
  assert.deepEqual(session.assignments, repair.initialAssignments);
  session = submit(session, activity);
  assert.equal(session.phase, 'feedback', 'the seeded misclassification must be a valid, incorrect attempt');
  session = dispatch(session, activity, 'retry');
  assert.deepEqual(session.assignments, repair.initialAssignments, 'retry restores the inspectable table');
  session = dispatch(session, activity, 'assign_category', { observationId: 'repair-3', categoryId: 'walk-cloudy' });
  session = submit(session, activity);
  assert.equal(session.phase, 'success');
  assert.equal(session.attempts.at(-1).response['repair-3'], 'walk-cloudy');
  assert.deepEqual(validateLearningTask(activity), []);
});

test('new table missions give two hints, a meaningful error retry, correct completion, and replay without persistence', () => {
  for (const [activityIndex, activity] of GRADE3_MATH_DATA_EXPANSION_TASKS.entries()) {
    let session = createLearningTaskSession(activity, `isolated-test:${activity.activityId}`);
    session = dispatch(session, activity, 'start');
    for (const [stageIndex, stage] of activity.stages.entries()) {
      assert.ok(stage.hints.length >= 2);
      session = dispatch(session, activity, 'hint');
      session = dispatch(session, activity, 'hint');
      session = attemptWrong(session, activity, stage);
      session = answerCorrectly(session, activity, stage);
      if (stageIndex < activity.stages.length - 1) assert.equal(session.phase, 'active');
    }
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, activity.stages.length * 2);
    session = dispatch(session, activity, 'restart', { sessionId: `isolated-replay:${activityIndex}` });
    assert.equal(session.phase, 'intro');
    assert.equal(session.attempts.length, 0);
  }
});


