import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE3_GEOMETRY_EXPLORATION_WORKSHOP as task } from '../prototype/data/gradeThreeGeometryExplorationWorkshop.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { areFoldedFacesAdjacent, createLearningTaskSession, dispatchLearningTask, foldCubeNet, validateLearningTask } from '../prototype/learningTaskEngine.js';

const dispatch = (session, action, payload) => dispatchLearningTask(session, task, action, payload);
const stageNet = (stage, id) => stage.netCandidates.find((net) => net.id === id);

function move(session, pieceId, direction) {
  const result = dispatch(session, 'move_geometry_piece', { pieceId, direction });
  assert.equal(result.changed, true, `${pieceId} ${direction}: ${result.error ?? ''}`);
  return result.session;
}
function rotate(session, pieceId) {
  const result = dispatch(session, 'rotate_geometry_piece', { pieceId });
  assert.equal(result.changed, true, `${pieceId} rotate: ${result.error ?? ''}`);
  return result.session;
}
function submit(session, stage, suffix) {
  const result = dispatch(session, 'submit', { submissionId: `${stage.stageId}-${suffix}` });
  assert.equal(result.changed, true, `${stage.stageId} submit: ${result.error ?? ''}`);
  return result.session;
}

test('S-3-4 candidate is registered as a Grade 3 math activity with traceable partial scope', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(task.curriculumCodes, ['S-3-4', 's-II-4']);
  assert.equal(task.curriculumAlignment, 'partial');
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => activityId === task.activityId).length, 1);
  assert.ok(getCatalogCandidateTasksForSubject('grade-3', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  const grade3Math = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3').subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.ok(grade3Math.existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  assert.ok(getLearningTaskRelation('grade-3', 'mathematics').tasks.some(({ taskId }) => taskId === task.activityId));
  assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
});

test('net folding validates topology and face adjacency, not just selection controls', () => {
  const [first, second, invalid] = task.stages[2].netCandidates.map(({ faces }) => foldCubeNet(faces));
  assert.equal(first.valid, true);
  assert.equal(second.valid, true);
  assert.equal(invalid.valid, false);
  assert.equal(areFoldedFacesAdjacent(first, 'A', 'E'), true);
  assert.equal(areFoldedFacesAdjacent(second, 'C', 'F'), true);
  assert.equal(areFoldedFacesAdjacent(first, 'A', 'C'), false);
});

test('planar split/recompose stages provide wrong feedback, retry and successful transfer tasks', () => {
  let session = createLearningTaskSession(task, 'geometry-planar-test');
  session = dispatch(session, 'start').session;
  for (let index = 0; index < 2; index += 1) {
    const stage = task.stages[index];
    if (index === 0) session = move(session, 'domino-top', 'down');
    else session = move(session, 'l-piece-a', 'right');
    session = submit(session, stage, 'wrong');
    assert.equal(session.phase, 'feedback');
    assert.equal(session.lastFeedback.correct, false);
    session = dispatch(session, 'retry').session;
    assert.equal(session.phase, 'active');
    if (index === 0) {
      session = move(session, 'domino-top', 'down');
      session = rotate(session, 'domino-bottom');
    } else {
      session = move(session, 'l-piece-a', 'down');
      session = move(session, 'l-piece-a', 'right');
      session = move(session, 'l-piece-b', 'up');
      session = move(session, 'l-piece-b', 'left');
    }
    session = submit(session, stage, 'correct');
    assert.equal(session.phase, 'success');
    assert.equal(session.lastFeedback.correct, true);
    session = dispatch(session, 'next').session;
  }
});

test('net tasks require a simulated fold and a reasoned adjacency response; retry, completion and replay work', () => {
  let session = createLearningTaskSession(task, 'geometry-net-test');
  session = dispatch(session, 'start').session;
  session = move(session, 'domino-top', 'down');
  session = rotate(session, 'domino-bottom');
  session = submit(session, task.stages[0], 'warmup');
  session = dispatch(session, 'next').session;
  session = move(session, 'l-piece-a', 'down');
  session = move(session, 'l-piece-a', 'right');
  session = move(session, 'l-piece-b', 'up');
  session = move(session, 'l-piece-b', 'left');
  session = submit(session, task.stages[1], 'warmup');
  session = dispatch(session, 'next').session;
  for (let index = 2; index < 4; index += 1) {
    const stage = task.stages[index];
    const wrongNet = index === 2 ? 'packed-six' : 'cross-net';
    session = dispatch(session, 'select_geometry_net', { netId: wrongNet }).session;
    session = dispatch(session, 'simulate_geometry_fold').session;
    session = dispatch(session, 'set_geometry_adjacency_answer', { adjacent: false }).session;
    session = submit(session, stage, 'wrong');
    assert.equal(session.phase, 'feedback');
    session = dispatch(session, 'retry').session;
    const correctNet = index === 2 ? 'cross-net' : 'offset-net';
    session = dispatch(session, 'hint').session;
    session = dispatch(session, 'hint').session;
    session = dispatch(session, 'select_geometry_net', { netId: correctNet }).session;
    session = dispatch(session, 'simulate_geometry_fold').session;
    session = dispatch(session, 'set_geometry_adjacency_answer', { adjacent: true }).session;
    session = submit(session, stage, 'correct');
    assert.equal(session.phase, 'success');
    session = dispatch(session, 'next').session;
  }
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 6);
  assert.equal(session.attempts.filter(({ result }) => result === 'correct').length, 4);
  const replay = dispatch(session, 'restart').session;
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.attempts.length, 0);
  assert.equal(replay.activityId, task.activityId);
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
});
