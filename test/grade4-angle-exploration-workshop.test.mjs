import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE4_ANGLE_EXPLORATION_WORKSHOP as task } from '../prototype/data/grade4AngleExplorationWorkshop.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import fs from 'node:fs';

const curriculum = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const officialBatch = JSON.parse(fs.readFileSync(new URL('../curriculum/math-grade4-official-content-batch.json', import.meta.url), 'utf8'));
const definitions = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));

function send(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} rejected: ${result.error ?? 'no state change'}`);
  return result.session;
}

function alignMeasure(session, stage) {
  while (session.angleCenterOffset !== 0) session = send(session, 'adjust_angle_alignment', { part: 'center', delta: session.angleCenterOffset < 0 ? 1 : -1 });
  while (session.angleBaselineOffset !== 0) session = send(session, 'adjust_angle_alignment', { part: 'baseline', delta: session.angleBaselineOffset < 0 ? 1 : -1 });
  return session;
}

function answerCorrectly(session, stage) {
  const rules = stage.angleRules;
  if (rules.mode === 'estimate') return send(session, 'set_angle_value', { degrees: rules.targetDegrees });
  if (rules.mode === 'measure') {
    session = alignMeasure(session, stage);
    session = send(session, 'set_angle_baseline_side', { side: rules.expectedSide });
    return send(session, 'set_angle_reading', { degrees: rules.targetDegrees });
  }
  if (rules.mode === 'draw') return send(session, 'set_angle_value', { degrees: rules.targetDegrees });
  return send(session, 'set_angle_rotation', { direction: rules.expectedDirection, degrees: rules.targetDegrees });
}

test('Grade 4 angle candidate is registered in the math catalog, route, and official map', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => activityId === task.activityId).length, 1);
  assert.ok(getCatalogCandidateTasksForSubject('grade-4', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  const math = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  const entry = math.existingYearLevelContent.find(({ activityId }) => activityId === task.activityId);
  assert.equal(entry?.runtimeAvailability, 'playable_candidate_prototype');
  assert.equal(entry?.runtimeModule, 'prototype/data/grade4AngleExplorationWorkshop.js');
  assert.ok(getLearningTaskRelation('grade-4', 'mathematics')?.tasks.some(({ taskId }) => taskId === task.activityId));
  const focus = curriculum.pendingLearningFocuses.find(({ id }) => id === task.curriculumMapId);
  assert.ok(focus);
  assert.deepEqual(task.curriculumCodes, ['N-4-10', 'S-4-1', 'S-4-2', 'n-II-9', 's-II-4']);
  for (const code of ['N-4-10', 'S-4-1', 'S-4-2']) assert.ok(officialBatch.clauses.some(({ code: officialCode }) => officialCode === code));
  assert.equal(officialBatch.clauses.find(({ code }) => code === 'N-4-10').equivalentOfficialCode, 'S-4-1');
  assert.equal(definitions.definitions.filter(({ focusId }) => focusId === task.curriculumMapId).length, 2);
  assert.equal(task.coverage.status, 'partial');
  assert.ok(task.curriculumScope.includes('數位模擬'));
});

test('angle actions enforce alignment, the selected protractor scale, and real angle arithmetic', () => {
  let session = send(createLearningTaskSession(task), 'start');
  let stage = task.stages[0];
  session = send(session, 'set_angle_value', { degrees: 60 });
  let result = dispatchLearningTask(session, task, 'submit', { submissionId: 'estimate-wrong' });
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /直角|開口/);
  session = send(result.session, 'retry');
  session = send(session, 'set_angle_value', { degrees: 35 });
  session = send(session, 'submit', { submissionId: 'estimate-right' });
  assert.equal(session.phase, 'success');

  session = send(session, 'next');
  stage = task.stages[1];
  assert.equal(dispatchLearningTask(session, task, 'set_angle_reading', { degrees: 40 }).changed, false, 'reading must be disabled until center and baseline align');
  session = alignMeasure(session, stage);
  session = send(session, 'set_angle_baseline_side', { side: 'left' });
  session = send(session, 'set_angle_reading', { degrees: 40 });
  result = send(session, 'submit', { submissionId: 'measure-wrong-scale' });
  assert.equal(result.phase, 'feedback');
  assert.match(result.lastFeedback.text, /指定的右側|起始刻度/);
  session = send(result, 'retry');
  session = alignMeasure(session, stage);
  session = send(session, 'set_angle_baseline_side', { side: 'right' });
  session = send(session, 'set_angle_reading', { degrees: 40 });
  session = send(session, 'submit', { submissionId: 'measure-right' });
  assert.equal(session.phase, 'success');

  session = send(session, 'next');
  stage = task.stages[2];
  session = alignMeasure(session, stage);
  session = send(session, 'set_angle_baseline_side', { side: 'left' });
  session = send(session, 'set_angle_reading', { degrees: 65 });
  session = send(session, 'submit', { submissionId: 'measure-left' });
  assert.equal(session.phase, 'success', 'left baseline must use its own zero scale');

  session = send(session, 'next');
  session = send(session, 'set_angle_value', { degrees: 100 });
  result = send(session, 'submit', { submissionId: 'draw-wrong' });
  assert.equal(result.phase, 'feedback');
  session = send(result, 'retry');
  session = send(session, 'set_angle_value', { degrees: 115 });
  session = send(session, 'submit', { submissionId: 'draw-right' });
  assert.equal(session.phase, 'success');
});

test('clock rotations distinguish clockwise 90 degrees from counterclockwise 270 degrees; retry and replay remain in memory', () => {
  let session = send(createLearningTaskSession(task, 'angle-journey'), 'start');
  for (let index = 0; index < task.stages.length; index += 1) {
    const stage = task.stages[index];
    if (index > 0) session = send(session, 'next');
    if (stage.angleRules.mode === 'rotation') {
      const wrongDirection = stage.angleRules.expectedDirection === 'clockwise' ? 'counterclockwise' : 'clockwise';
      session = send(session, 'set_angle_rotation', { direction: wrongDirection, degrees: stage.angleRules.targetDegrees });
      let result = send(session, 'submit', { submissionId: `${stage.stageId}-wrong-direction` });
      assert.equal(result.phase, 'feedback', `${stage.stageId} rejects wrong rotation direction`);
      session = send(result, 'retry');
      assert.equal(session.angleRotationDirection, null);
    }
    session = answerCorrectly(session, stage);
    session = send(session, 'submit', { submissionId: `${stage.stageId}-correct` });
    assert.equal(session.phase, 'success', `${stage.stageId} correct response`);
  }
  session = send(session, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 8);
  assert.equal(session.attempts.every(({ interaction }) => interaction === 'angle_exploration'), true);
  const replay = send(session, 'restart', { sessionId: 'angle-replay' });
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.attempts.length, 0);
  assert.equal(replay.activityId, task.activityId);
});
