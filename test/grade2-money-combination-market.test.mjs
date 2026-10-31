import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE2_MONEY_COMBINATION_MARKET } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';

test('N-2-5 money market is registered as a candidate and uses the shared interactive task engine', async () => {
  const task = GRADE2_MONEY_COMBINATION_MARKET;
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => activityId === task.activityId).length, 1);
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-2');
  assert.ok(grade.subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  assert.ok(LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-2' && subjectId === 'mathematics').tasks.some(({ taskId }) => taskId === task.activityId));
  const map = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
  const focus = map.verifiedLearningFocuses.find(({ id }) => id === task.curriculumMapId);
  assert.equal(focus.coverageStatus, 'partial');
  assert.deepEqual(focus.contentCodes, ['N-2-5']);
  assert.deepEqual(focus.performanceCodes, ['n-I-3']);
  assert.ok(focus.coverageLimitations.includes('找零、所有可能的等值組合與自主策略說明'));
});

test('money cards update an exact total, support multiple equivalent sets, and reject incorrect payment', () => {
  const task = GRADE2_MONEY_COMBINATION_MARKET;
  assert.deepEqual(task.stages.map(({ targetAmount }) => targetAmount), [100, 500, 1000]);
  for (const stage of task.stages) {
    const value = (ids) => ids.reduce((sum, id) => sum + stage.options.find(({ id: optionId }) => optionId === id).valueAmount, 0);
    assert.ok(stage.acceptedOptionSets.every((ids) => value(ids) === stage.targetAmount), stage.stageId);
    assert.ok(stage.acceptedOptionSets.length >= 2, stage.stageId);
    assert.ok(stage.options.every(({ valueAmount }) => Number.isInteger(valueAmount) && valueAmount > 0));
  }
  const stage = task.stages[0];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'money-wrong-total'), task, 'start').session;
  session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: stage.options[0].id }).session;
  session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: stage.options[1].id }).session;
  assert.equal(stage.options.filter(({ id }) => session.selection.includes(id)).reduce((sum, option) => sum + option.valueAmount, 0), 150);
  session = dispatchLearningTask(session, task, 'submit').session;
  assert.equal(session.phase, 'feedback');
  assert.equal(session.attempts.at(-1).result, 'incorrect');
  assert.match(session.lastFeedback.text, /剛好|總額/);
});

test('all official-target combinations can be retried after feedback, receive two hints, and finish the route', () => {
  const task = GRADE2_MONEY_COMBINATION_MARKET;
  let session = dispatchLearningTask(createLearningTaskSession(task, 'money-market-route'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    if (index) session = dispatchLearningTask(session, task, 'next').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    assert.equal(session.hintLevel, 2);
    const wrongOption = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: wrongOption.id }).session;
    session = dispatchLearningTask(session, task, 'submit').session;
    assert.equal(session.phase, 'feedback');
    session = dispatchLearningTask(session, task, 'retry').session;
    for (const id of stage.acceptedOptionSets[1]) session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: id }).session;
    session = dispatchLearningTask(session, task, 'submit').session;
    assert.equal(session.phase, 'success', stage.stageId);
    assert.equal(session.attempts.at(-1).result, 'correct');
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(session.status, 'candidate_pending_teacher_review');
  const replay = dispatchLearningTask(session, task, 'restart', { sessionId: 'money-market-replay' }).session;
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.attempts.length, 0);
});
