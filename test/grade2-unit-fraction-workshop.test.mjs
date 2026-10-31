import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE2_UNIT_FRACTION_WORKSHOP as task } from '../prototype/data/grade2UnitFractionWorkshop.js';
import { CATALOG_CANDIDATE_TASK_BY_ID, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildOfficialLearningItemCrosswalk } from '../scripts/official-learning-item-activity-crosswalk.mjs';

const run = (session, action, payload) => dispatchLearningTask(session, task, action, payload).session;
const submit = (session, submissionId) => dispatchLearningTask(session, task, 'submit', { submissionId });

test('N-2-10 unit-fraction workshop is a unique candidate and connected to its project-analysis subitem', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.get(task.activityId), task);
  assert.equal(getCatalogCandidateTasksForSubject('grade-2', 'mathematics').filter(({ activityId }) => activityId === task.activityId).length, 1);
  assert.ok(getGradeById('grade-2').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  assert.ok(LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-2' && subjectId === 'mathematics').tasks.some(({ taskId }) => taskId === task.activityId));
  assert.deepEqual(task.curriculumCodes, ['N-2-10', 'n-I-6']);
  assert.match(task.curriculumEvidence.officialText, /單位分數的認識/);
});

test('paper-strip stages require denominator and one-piece construction, with hints, incorrect feedback, retry and completion', () => {
  let session = run(createLearningTaskSession(task, 'isolated-n2-10'), 'start');
  for (const [index, stage] of task.stages.entries()) {
    assert.equal(session.stageIndex, index);
    const rules = stage.fractionRules;
    session = run(session, 'set_fraction_denominator', { denominator: rules.denominator });
    session = run(session, 'select_fraction_whole', { wholeId: 'half-paper-strip' });
    const targetModel = rules.groups.find(({ id }) => id === rules.targetGroupId);
    session = run(session, 'select_fraction_model', { groupId: targetModel.id });
    session = run(session, 'move_fraction_piece', { pieceId: rules.pieces[0].id, targetGroupId: rules.targetGroupId });
    session = submit(session, `wrong-${index}`).session;
    assert.equal(session.phase, 'feedback');
    assert.equal(session.lastFeedback.correct, false);
    assert.match(session.lastFeedback.text, /完整整體/);
    session = run(session, 'retry');
    session = run(session, 'hint');
    session = run(session, 'hint');
    assert.equal(session.hintLevel, 2);
    session = run(session, 'select_fraction_whole', { wholeId: rules.targetWholeId });
    session = run(session, 'set_fraction_denominator', { denominator: rules.denominator });
    session = run(session, 'select_fraction_model', { groupId: targetModel.id });
    session = run(session, 'move_fraction_piece', { pieceId: rules.pieces[0].id, targetGroupId: rules.targetGroupId });
    const result = submit(session, `correct-${index}`);
    assert.equal(result.session.phase, 'success');
    assert.equal(result.attempt.result, 'correct');
    session = run(result.session, 'next');
  }
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.filter(({ result }) => result === 'correct').length, task.stages.length);
  assert.equal(run(session, 'restart', { sessionId: 'replay' }).phase, 'intro');
});

test('crosswalk records N-2-10 partial evidence only for the three paper-strip interactions', () => {
  const row = buildOfficialLearningItemCrosswalk().mathOfficialLearningContentItems.find(({ officialCode }) => officialCode === 'N-2-10');
  assert.equal(row.coverageStatus, 'partial');
  assert.ok(row.activityIds.includes(task.activityId));
  assert.deepEqual(row.activityEvidence.filter(({ activityId }) => activityId === task.activityId).map(({ stageId }) => stageId).sort(), task.stages.map(({ stageId }) => stageId).sort());
  assert.equal(row.coverageStatus, 'partial');
});
