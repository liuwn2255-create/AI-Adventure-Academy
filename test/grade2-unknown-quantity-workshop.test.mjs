import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADE2_UNKNOWN_QUANTITY_WORKSHOP as task } from '../prototype/data/grade2UnknownQuantityWorkshop.js';
import { CATALOG_CANDIDATE_TASK_BY_ID, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildOfficialLearningItemCrosswalk } from '../scripts/official-learning-item-activity-crosswalk.mjs';

const map = JSON.parse(readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const definitions = JSON.parse(readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));
const run = (session, action, payload) => dispatchLearningTask(session, task, action, payload).session;
const submit = (session, id) => dispatchLearningTask(session, task, 'submit', { submissionId: id });

test('N-2-3/R-2-4 candidate is unique, validated, registered and tied to project subitems', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.get(task.activityId), task);
  assert.equal(getCatalogCandidateTasksForSubject('grade-2', 'mathematics').filter(({ activityId }) => activityId === task.activityId).length, 1);
  const grade = getGradeById('grade-2');
  assert.ok(grade.subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  const relation = LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-2' && subjectId === 'mathematics');
  assert.ok(relation.tasks.some(({ taskId }) => taskId === task.activityId));
  assert.deepEqual(task.curriculumCodes, ['N-2-3', 'n-I-3', 'R-2-4', 'r-I-3']);
  for (const [index, id] of task.learningSubitemClaims.entries()) {
    const definition = definitions.definitions.find(({ subitemId }) => subitemId === id);
    assert.ok(definition);
    assert.match(definition.projectSubitem, /專案分析/);
    const expectedStageIds = index === 0 ? task.stages.slice(0, 3).map(({ stageId }) => stageId) : [task.stages[3].stageId];
    assert.deepEqual(definition.evidenceStageIds, expectedStageIds);
  }
  const focus = map.pendingLearningFocuses.find(({ id }) => id === task.curriculumMapId);
  assert.deepEqual(focus.contentCodes, ['N-2-3', 'R-2-4']);
  assert.equal(focus.coverageStatus, 'partial');
});

test('unknown addend/minuend/subtrahend models support wrong feedback, hints, retry, correct solve and completion', () => {
  let session = run(createLearningTaskSession(task, 'isolated-n2-3'), 'start');
  for (const [index, stage] of task.stages.entries()) {
    assert.equal(session.stageIndex, index);
    assert.equal(session.unknownQuantityValue, stage.unknownQuantityRules.initialValue);
    const noMoveSubmit = submit(session, `empty-${index}`);
    assert.equal(noMoveSubmit.changed, false);
    assert.equal(noMoveSubmit.error, 'response_required');

    session = run(session, 'adjust_unknown_quantity', { delta: 1 });
    session = submit(session, `wrong-${index}`).session;
    assert.equal(session.phase, 'feedback');
    assert.equal(session.lastFeedback.correct, false);
    assert.ok(session.lastFeedback.text.length > 10);
    session = run(session, 'retry');
    session = run(session, 'hint');
    session = run(session, 'hint');
    assert.equal(session.hintLevel, 2);
    const delta = Math.sign(stage.unknownQuantityRules.targetValue - session.unknownQuantityValue);
    for (let count = session.unknownQuantityValue; count !== stage.unknownQuantityRules.targetValue; count += delta) {
      session = run(session, 'adjust_unknown_quantity', { delta });
    }
    const result = submit(session, `correct-${index}`);
    assert.equal(result.session.phase, 'success');
    assert.equal(result.attempt.result, 'correct');
    if (stage.unknownQuantityRules.mode === 'inverse_check') assert.match(result.session.lastFeedback.text, /9 \+ 7 = 16/);
    session = run(result.session, 'next');
  }
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.filter(({ result }) => result === 'correct').length, task.stages.length);
  assert.equal(session.attempts.length, task.stages.length * 2);
  assert.deepEqual(Object.keys(session).filter((key) => /student|mastery|grade/.test(key)), []);
  const replay = run(session, 'restart', { sessionId: 'replay' });
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.attempts.length, 0);
});

test('crosswalk maps N-2-3/R-2-4 as partial with actual interaction evidence, not complete coverage', () => {
  const report = buildOfficialLearningItemCrosswalk();
  for (const code of ['N-2-3', 'R-2-4']) {
    const row = report.mathOfficialLearningContentItems.find(({ officialCode }) => officialCode === code);
    assert.equal(row.coverageStatus, 'partial');
    assert.ok(row.activityIds.includes(task.activityId));
    const expectedStageIds = code === 'N-2-3'
      ? task.stages.slice(0, 3).map(({ stageId }) => stageId)
      : [task.stages[3].stageId];
    assert.deepEqual(
      row.activityEvidence.filter(({ activityId }) => activityId === task.activityId).map(({ stageId }) => stageId).sort(),
      [...expectedStageIds].sort(),
    );
  }
  assert.equal(report.scope.officialElementaryItemTotal, null);
});
