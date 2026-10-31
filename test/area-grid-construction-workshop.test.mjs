import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA_GRID_CONSTRUCTION_WORKSHOP as task } from '../prototype/data/areaGridConstructionWorkshop.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const apply = (session, action, payload) => {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} should change the session (${result.error ?? ''})`);
  return result.session;
};
const setCells = (session, boardId, cells) => {
  for (const cell of cells) {
    const [, row, column] = /^r(\d+)c(\d+)$/.exec(cell);
    session = apply(session, 'toggle_area_cell', { boardId, row: Number(row), column: Number(column) });
  }
  return session;
};
const submit = (session) => dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:a${session.attempts.length + 1}` });
const start = () => apply(createLearningTaskSession(task, 'area-test'), 'start');
const next = (session) => apply(session, 'next');

test('area grid task is an unreviewed third-grade math catalog activity with six operation stages', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.deepEqual(task.curriculumCodes, ['N-3-14', 'n-II-9']);
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => activityId === task.activityId).length, 1);
  const entry = getGradeById('grade-3').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.find(({ activityId }) => activityId === task.activityId);
  assert.ok(entry, 'activity should be available from grade 3 math catalog');
  assert.equal(task.stages.length, 6);
  assert.ok(task.stages.every(({ hints, interaction }) => hints.length >= 2 && interaction === 'build_area_grid'));
});

test('students can add/remove cells, estimate, receive wrong feedback, retry, and build the target area', () => {
  let session = start();
  const first = task.stages[0];
  assert.equal(dispatchLearningTask(session, task, 'toggle_area_cell', { boardId: 'floor', row: 0, column: 0 }).changed, false, 'estimate is required before building');
  session = apply(session, 'hint');
  session = apply(session, 'hint');
  session = apply(session, 'set_area_estimate', { value: 12 });
  session = apply(session, 'toggle_area_cell', { boardId: 'floor', row: 0, column: 0 });
  session = apply(session, 'toggle_area_cell', { boardId: 'floor', row: 0, column: 0 });
  assert.deepEqual(session.areaGridCells.floor, [], 'clicking a cell a second time removes it');
  session = setCells(session, 'floor', first.areaGridRules.boards[0].targetCells);
  let result = submit(session);
  assert.equal(result.changed, true);
  assert.equal(result.session.lastFeedback.correct, false);
  assert.match(result.session.lastFeedback.text, /估測值是 12/);
  session = apply(result.session, 'retry');
  session = apply(session, 'set_area_estimate', { value: 6 });
  session = setCells(session, 'floor', first.areaGridRules.boards[0].targetCells);
  result = submit(session);
  assert.equal(result.session.phase, 'success');
  assert.match(result.session.lastFeedback.text, /6 個完整單位方格/);
});

test('cover, same-area construction, missing-cell repair, region comparison, and constrained build are judged from actual cells', () => {
  let session = start();
  session = apply(session, 'set_area_estimate', { value: 6 });
  session = setCells(session, 'floor', task.stages[0].areaGridRules.boards[0].targetCells);
  session = next(submit(session).session);

  const outline = task.stages[1].areaGridRules.boards[0];
  session = setCells(session, outline.id, [...outline.targetCells, 'r3c3']);
  let result = submit(session);
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /逐格核對/);
  session = apply(result.session, 'retry');
  session = setCells(session, outline.id, outline.targetCells);
  session = next(submit(session).session);

  const same = task.stages[2].areaGridRules;
  const reference = new Set(same.boards[0].referenceCells);
  const differentShape = ['r0c0', 'r0c1', 'r0c2', 'r1c2', 'r2c2', 'r2c1'];
  assert.equal(differentShape.length, same.targetArea);
  assert.notDeepEqual(new Set(differentShape), reference);
  session = setCells(session, same.boards[0].id, differentShape);
  assert.equal(submit(session).session.phase, 'success');
  session = next(submit(session).session);

  const missing = task.stages[3].areaGridRules.boards[0];
  session = apply(session, 'toggle_area_cell', { boardId: missing.id, row: 0, column: 0 });
  let initial = submit(session);
  assert.equal(initial.session.phase, 'feedback');
  session = apply(initial.session, 'retry');
  const missingIds = missing.targetCells.filter((cell) => !missing.initialCells.includes(cell));
  session = setCells(session, missing.id, missingIds);
  session = next(submit(session).session);

  const compareBoards = task.stages[4].areaGridRules.boards;
  session = setCells(session, compareBoards[0].id, compareBoards[0].targetCells);
  session = setCells(session, compareBoards[1].id, compareBoards[1].targetCells);
  session = apply(session, 'set_area_relation', { relation: '>' });
  result = submit(session);
  assert.equal(result.session.phase, 'feedback');
  session = apply(result.session, 'retry');
  session = setCells(session, compareBoards[0].id, compareBoards[0].targetCells);
  session = setCells(session, compareBoards[1].id, compareBoards[1].targetCells);
  session = apply(session, 'set_area_relation', { relation: '<' });
  session = next(submit(session).session);

  const constraint = task.stages[5].areaGridRules;
  const valid = ['r0c0','r0c1','r0c2','r1c0','r1c1','r1c2','r2c2','r2c3'];
  session = setCells(session, constraint.boards[0].id, valid);
  assert.equal(submit(session).session.phase, 'success');
});

test('activity completion and replay reset are memory-only and preserve candidate status', () => {
  let session = start();
  for (let index = 0; index < task.stages.length; index += 1) {
    const stage = task.stages[index];
    const rules = stage.areaGridRules;
    if (rules.mode === 'estimate_cover') {
      session = apply(session, 'set_area_estimate', { value: 6 });
      session = setCells(session, rules.boards[0].id, rules.boards[0].targetCells);
    } else if (rules.mode === 'same_area_different_shape') {
      session = setCells(session, rules.boards[0].id, ['r0c0','r0c1','r0c2','r1c2','r2c2','r2c1']);
    } else if (rules.mode === 'compare_regions') {
      for (const board of rules.boards) session = setCells(session, board.id, board.targetCells);
      session = apply(session, 'set_area_relation', { relation: rules.correctRelation });
    } else if (rules.mode === 'constrained_build') {
      session = setCells(session, rules.boards[0].id, ['r0c0','r0c1','r0c2','r1c0','r1c1','r1c2','r2c2','r2c3']);
    } else if (rules.mode === 'complete_missing_cells') {
      session = apply(session, 'toggle_area_cell', { boardId: rules.boards[0].id, row: 0, column: 1 });
      session = apply(session, 'toggle_area_cell', { boardId: rules.boards[0].id, row: 0, column: 2 });
    } else session = setCells(session, rules.boards[0].id, rules.boards[0].targetCells);
    const result = submit(session);
    assert.equal(result.session.phase, 'success', `${stage.stageId}: ${result.session.lastFeedback?.text}`);
    session = result.session;
    if (index < task.stages.length - 1) session = next(session);
  }
  session = apply(session, 'next');
  assert.equal(session.phase, 'completed');
  session = apply(session, 'restart', { sessionId: 'area-replay' });
  assert.equal(session.phase, 'intro');
  assert.equal(session.attempts.length, 0);
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(task.teacherReview.status, 'not_reviewed');
});
