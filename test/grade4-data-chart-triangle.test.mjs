import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE4_MATH_GAP_TASKS } from '../prototype/data/grade4MathGapTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const readJson = (file) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const map = readJson('../curriculum/curriculum-map.json');
const definitions = readJson('../curriculum/learning-subitem-definitions.json');
const batch = readJson('../curriculum/math-grade4-official-content-batch.json');
const BAR_ID = 'ACT-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE';
const TRIANGLE_ID = 'ACT-G4-MATH-SPECIAL-TRIANGLE-CONSTRUCTION-CANDIDATE';

function act(session, task, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${task.activityId}/${task.stages[session.stageIndex]?.stageId}/${action}/${JSON.stringify(payload)}: ${result.error ?? 'unchanged'}`);
  return result;
}

test('D-4-1 and S-4-7 candidates are integrated as unique Grade 4 math activities with evidence-bound claims', () => {
  const tasks = [GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === BAR_ID), GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === TRIANGLE_ID)];
  assert.ok(tasks.every(Boolean));
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const grade4 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  for (const task of tasks) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.ok(getCatalogCandidateTasksForSubject('grade-4', 'mathematics').some(({ activityId }) => activityId === task.activityId));
    assert.ok(grade4.subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
    assert.ok(getLearningTaskRelation('grade-4', 'mathematics')?.tasks.some(({ taskId }) => taskId === task.activityId));
    assert.ok(map.pendingLearningFocuses.some(({ id, candidateActivityId }) => id === task.curriculumMapId && candidateActivityId === task.activityId));
    assert.ok(definitions.definitions.some(({ activityIds, evidenceStageIds }) => activityIds?.includes(task.activityId) && evidenceStageIds?.length === task.stages.length));
    assert.equal(task.teacherReview.status, 'not_reviewed');
  }
  assert.deepEqual(batch.activityAudit.find(({ code }) => code === 'D-4-1').activityIds, [BAR_ID]);
  assert.deepEqual(batch.activityAudit.find(({ code }) => code === 'S-4-7').activityIds, [TRIANGLE_ID]);
  assert.equal(batch.clauses.find(({ code }) => code === 'D-4-1').officialPerformanceLinks[0], 'd-II-1');
  assert.equal(batch.clauses.find(({ code }) => code === 'S-4-7').officialPerformanceLinks[0], 's-II-3');
});

test('D-4-1 bar chart builder gives interactive wrong feedback, retry, new-data transfer and completion', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === BAR_ID);
  let session = act(createLearningTaskSession(task, 'g4-bar-chart-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = act(session, task, 'hint').session;
    session = act(session, task, 'hint').session;
    if (stage.interaction === 'build_bar_chart') {
      for (const category of stage.barChartRules.categories) session = act(session, task, 'adjust_bar_chart_bar', { categoryId: category.id, delta: 1 }).session;
    } else {
      session = act(session, task, 'select_option', { optionId: 'always-rise' }).session;
    }
    session = act(session, task, 'submit', { submissionId: `bar-wrong-${index}` }).session;
    assert.equal(session.phase, 'feedback');
    assert.match(session.lastFeedback.text, /資料|柱|折線|類別/);
    session = act(session, task, 'retry').session;
    if (stage.interaction === 'build_bar_chart') {
      for (const category of stage.barChartRules.categories) for (let count = 0; count < category.value; count += 1) session = act(session, task, 'adjust_bar_chart_bar', { categoryId: category.id, delta: 1 }).session;
    } else session = act(session, task, 'select_option', { optionId: 'rise-fall-rise' }).session;
    session = act(session, task, 'submit', { submissionId: `bar-right-${index}` }).session;
    assert.equal(session.phase, 'success');
    assert.equal(session.attempts.at(-1).result, 'correct');
    if (index < task.stages.length - 1) session = act(session, task, 'next').session;
  }
  session = act(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('S-4-7 grid construction checks non-collinear vertices and side/angle properties through four transfers', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === TRIANGLE_ID);
  const solutions = [
    ['r0c0', 'r0c4', 'r2c2'],
    ['r0c0', 'r0c4', 'r4c0'],
    ['r0c0', 'r0c4', 'r3c2'],
    ['r0c0', 'r0c4', 'r1c1'],
  ];
  let session = act(createLearningTaskSession(task, 'g4-triangle-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = act(session, task, 'hint').session;
    session = act(session, task, 'hint').session;
    for (const pointId of ['r0c0', 'r0c1', 'r0c2']) session = act(session, task, 'toggle_triangle_vertex', { pointId }).session;
    session = act(session, task, 'submit', { submissionId: `triangle-wrong-${index}` }).session;
    assert.equal(session.phase, 'feedback', stage.stageId);
    assert.match(session.lastFeedback.text, /頂點|三角形|直角|銳角|鈍角|等腰/);
    session = act(session, task, 'retry').session;
    for (const pointId of solutions[index]) session = act(session, task, 'toggle_triangle_vertex', { pointId }).session;
    session = act(session, task, 'submit', { submissionId: `triangle-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    assert.equal(session.attempts.at(-1).result, 'correct');
    if (index < task.stages.length - 1) session = act(session, task, 'next').session;
  }
  session = act(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});
