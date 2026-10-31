import test from 'node:test';
import assert from 'node:assert/strict';
import { LENGTH_MEASUREMENT_ADVENTURE as task } from '../prototype/data/lengthMeasurementAdventure.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { readFileSync } from 'node:fs';

function act(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} ${JSON.stringify(payload)} should change state: ${result.error}`);
  return result.session;
}

function submit(session, expected) {
  const result = dispatchLearningTask(session, task, 'submit');
  assert.equal(result.changed, true);
  assert.equal(result.session.lastFeedback.correct, expected);
  return result.session;
}

test('N-3-12 measurement candidate is validated, catalog-linked and remains partial/simulated', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => activityId === task.activityId).length, 1);
  const subject = getGradeById('grade-3').subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.ok(subject.existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.curriculumAlignment, 'partial');
  assert.ok(task.openQuestions.some((line) => line.includes('實物尺規')));
});

test('measurement stages support estimate, actual simulated zero alignment, endpoint reading and wrong-answer retry', () => {
  let session = createLearningTaskSession(task);
  session = act(session, 'start');
  assert.equal(dispatchLearningTask(session, task, 'submit').error, 'response_required');
  session = act(session, 'set_length_estimate', { value: 20 });
  session = submit(session, false);
  assert.match(session.lastFeedback.text, /估測值離模型參考長度/);
  session = act(session, 'retry');
  session = act(session, 'set_length_estimate', { value: 38 });
  session = submit(session, true);
  session = act(session, 'next');
  assert.equal(session.lengthRulerZero, 11);
  session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'set_length_reading', { objectId: 'ribbon', value: 25 });
  session = submit(session, false);
  session = act(session, 'retry');
  session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'set_length_reading', { objectId: 'ribbon', value: 26 });
  session = submit(session, true);
  assert.equal(session.attempts.at(-1).response.rulerZero, 14);
});

test('measurement compare, conversion and integrated transfer calculate exact mm/cm values', () => {
  let session = createLearningTaskSession(task);
  session = act(session, 'start');
  session = act(session, 'set_length_estimate', { value: 37 });
  session = submit(session, true);
  session = act(session, 'next');
  for (let i = 0; i < 3; i += 1) session = act(session, 'move_length_ruler', { delta: 1 });
  session = act(session, 'set_length_reading', { objectId: 'ribbon', value: 26 });
  session = submit(session, true);
  session = act(session, 'next');
  session = act(session, 'set_length_reading', { objectId: 'route-a', value: 42 });
  session = act(session, 'set_length_reading', { objectId: 'route-b', value: 57 });
  session = act(session, 'set_length_difference', { value: 15 });
  session = submit(session, true);
  session = act(session, 'next');
  session = act(session, 'set_length_conversion', { centimeters: 14, millimeters: 6 });
  session = submit(session, true);
  session = act(session, 'next');
  session = act(session, 'set_length_reading', { objectId: 'cord-a', value: 35 });
  session = act(session, 'set_length_reading', { objectId: 'cord-b', value: 48 });
  session = act(session, 'set_length_difference', { value: 13 });
  session = act(session, 'set_length_conversion', { centimeters: 8, millimeters: 3 });
  session = submit(session, true);
  session = act(session, 'next');
  assert.equal(session.phase, 'completed');
  const replay = act(session, 'restart');
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.attempts.length, 0);
});

test('measurement actions reject invalid ranges and mapped N-3-12 evidence is stage-specific', () => {
  let session = createLearningTaskSession(task);
  session = act(session, 'start');
  assert.equal(dispatchLearningTask(session, task, 'set_length_estimate', { value: 51 }).changed, false);
  session = act(session, 'set_length_estimate', { value: 37 });
  session = submit(session, true);
  session = act(session, 'next');
  assert.equal(dispatchLearningTask(session, task, 'set_length_reading', { objectId: 'ribbon', value: 41 }).error, 'invalid_length_reading');
  const batch = JSON.parse(readFileSync(new URL('../curriculum/math-grade3-official-content-batch.json', import.meta.url)));
  const audit = batch.activityAudit.find(({ code }) => code === 'N-3-12');
  assert.deepEqual(audit.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.equal(audit.status, 'partial');
  assert.match(audit.reason, /實物測量/);
});
