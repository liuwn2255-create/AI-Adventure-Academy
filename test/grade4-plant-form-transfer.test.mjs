import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { LEARNING_SUBITEM_GAP_TASKS } from '../prototype/data/learningSubitemGapTasks.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const activityId = 'ACT-G4-SCIENCE-PLANT-EXTERNAL-FORMS-TRANSFER-CANDIDATE';
const subitemId = 'SUB-SCIENCE-STAGE2-PLANT-FLOWER-FRUIT-SEED-AND-STEM-FORMS';
const activity = LEARNING_SUBITEM_GAP_TASKS.find((task) => task.activityId === activityId);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));

function act(session, action, payload) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.changed, true, `${action} must change the game state: ${result.error ?? ''}`);
  return result.session;
}

function assignStage(session, stage, wrong = false) {
  const observations = stage.observations;
  for (const observation of observations) {
    const expected = stage.correctAssignments[observation.id];
    const categoryId = wrong && observation.id === observations[0].id
      ? stage.categories.find(({ id }) => id !== expected).id
      : expected;
    session = act(session, 'assign_category', { observationId: observation.id, categoryId });
  }
  return session;
}

test('plant external-form task has traceable scope and appears in the grade-four science entry', () => {
  assert.ok(activity);
  assert.deepEqual(validateLearningTask(activity), []);
  assert.equal(activity.status, 'candidate_pending_teacher_review');
  assert.equal(activity.teacherReview.status, 'not_reviewed');
  assert.equal(activity.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(activity.evidencePolicy.completionIsMastery, false);
  assert.equal(activity.learningSubitemClaims.includes(subitemId), true);
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId: id }) => id === activityId).length, 1);

  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  const science = grade.subjects.find(({ subjectId }) => subjectId === 'natural-science');
  const directoryEntry = science.existingYearLevelContent.find(({ activityId: id }) => id === activityId);
  assert.ok(directoryEntry, 'the grade-four science directory must expose the task');
  assert.equal(directoryEntry.status, 'candidate_pending_teacher_review');
  assert.equal(directoryEntry.entryRoute.targetScreen, 'catalog-task');
  assert.equal(directoryEntry.progressPersistence, 'memory_only_no_student_records_no_localStorage');

  const relation = getLearningTaskRelation('grade-4', 'natural-science');
  assert.ok(relation.tasks.some(({ taskId }) => taskId === activityId));
  const definition = readJson('curriculum/learning-subitem-definitions.json').definitions.find(({ subitemId: id }) => id === subitemId);
  assert.ok(definition);
  assert.equal(definition.officialCode, 'INb-Ⅱ-6');
  assert.equal(definition.status, 'candidate_partial_interaction');
  assert.deepEqual(definition.activityIds, [activityId]);
  assert.deepEqual(definition.evidenceStageIds, activity.stages.map(({ stageId }) => stageId));

  const focus = readJson('curriculum/curriculum-map.json').verifiedLearningFocuses.find(({ id }) => id === activity.curriculumMapId);
  assert.ok(focus.verifiedClauses.includes('INb-Ⅱ-6'));
  assert.equal(focus.officialTextReviewStatus, 'verified_against_official_text');
});

test('plant external-form task gives useful retry feedback and completes using staged classification and evidence collection', () => {
  let session = createLearningTaskSession(activity, 'plant-form-review-test');
  session = act(session, 'start');

  // Flower / fruit / seed / leaf classification: an incorrect full response must be accepted and diagnosed.
  session = act(session, 'hint');
  session = act(session, 'hint');
  session = assignStage(session, activity.stages[0], true);
  let submitted = dispatchLearningTask(session, activity, 'submit');
  assert.equal(submitted.changed, true);
  assert.equal(submitted.session.phase, 'feedback');
  assert.equal(submitted.session.lastFeedback.correct, false);
  assert.match(submitted.session.lastFeedback.text, /豆莢/);
  session = act(submitted.session, 'retry');
  session = assignStage(session, activity.stages[0]);
  submitted = dispatchLearningTask(session, activity, 'submit');
  assert.equal(submitted.session.phase, 'success');
  session = act(submitted.session, 'next');

  // Stem-form classification is independently attempted and retried.
  session = act(session, 'hint');
  session = assignStage(session, activity.stages[1], true);
  submitted = dispatchLearningTask(session, activity, 'submit');
  assert.equal(submitted.session.phase, 'feedback');
  assert.match(submitted.session.lastFeedback.text, /莖部描述/);
  session = act(submitted.session, 'retry');
  session = assignStage(session, activity.stages[1]);
  submitted = dispatchLearningTask(session, activity, 'submit');
  assert.equal(submitted.session.phase, 'success');
  session = act(submitted.session, 'next');

  // A new description requires choosing both direct stem clues, not merely recognizing a plant-part label.
  session = act(session, 'hint');
  const evidenceStage = activity.stages[2];
  session = act(session, 'toggle_evidence', { optionId: 'leaf-vein' });
  session = act(session, 'toggle_evidence', { optionId: 'petal-color' });
  submitted = dispatchLearningTask(session, activity, 'submit');
  assert.equal(submitted.session.phase, 'feedback');
  assert.equal(submitted.session.lastFeedback.correct, false);
  assert.match(submitted.session.lastFeedback.text, /葉脈/);
  session = act(submitted.session, 'retry');
  session = act(session, 'toggle_evidence', { optionId: 'long-stem' });
  session = act(session, 'toggle_evidence', { optionId: 'clings-support' });
  submitted = dispatchLearningTask(session, activity, 'submit');
  assert.equal(submitted.session.phase, 'success');
  session = act(submitted.session, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(session.status, 'candidate_pending_teacher_review');
  assert.equal(session.attempts.filter(({ result }) => result === 'correct').length, 3);
  assert.equal(session.attempts.filter(({ result }) => result === 'incorrect').length, 3);

  const restarted = dispatchLearningTask(session, activity, 'restart', { sessionId: 'plant-form-review-replay' });
  assert.equal(restarted.changed, true);
  assert.equal(restarted.session.phase, 'intro');
  assert.equal(restarted.session.attempts.length, 0);
  assert.equal(restarted.session.status, 'candidate_pending_teacher_review');
});
