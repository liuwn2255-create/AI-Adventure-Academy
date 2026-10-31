import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADE1_MATH_CLASSIFICATION_WORKSHOP as task } from '../prototype/data/grade1MathClassificationWorkshop.js';
import { getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const batch = read('../curriculum/math-grade1-official-content-batch.json');
const audit = read('../curriculum/math-focused-clause-audit.json');
const map = read('../curriculum/curriculum-map.json');
const definitions = read('../curriculum/learning-subitem-definitions.json');

test('grade-1 official content table batch stores every row from PDF pages 21–22 with explicit performance links', () => {
  assert.equal(batch.clauses.length, 11);
  assert.equal(new Set(batch.clauses.map(({ code }) => code)).size, 11);
  assert.deepEqual(batch.clauses.map(({ code }) => code), ['N-1-1','N-1-2','N-1-3','N-1-4','N-1-5','N-1-6','S-1-1','S-1-2','R-1-1','R-1-2','D-1-1']);
  assert.equal(batch.applicability.officialGradeTable, 1);
  assert.equal(batch.applicability.learningStage, '第一學習階段（一、二年級）');
  assert.equal(batch.applicability.semester, null);
  assert.equal(batch.clauses.find(({ code }) => code === 'N-1-5').equivalentOfficialCode, 'S-1-1');
  assert.equal(batch.clauses.find(({ code }) => code === 'S-1-1').equivalentOfficialCode, 'N-1-5');
  assert.equal(batch.nextWorkPosition.includes('二年級學習內容表'), true);
  for (const row of batch.clauses) {
    assert.match(row.sourceLocation, /PDF頁序2[12]/);
    assert.ok(row.officialText);
    assert.ok(row.officialPerformanceLinks.length);
    assert.equal(row.relationshipKind, 'explicit_same_table_corresponding_performance');
    assert.ok(audit.clauses.some((entry) => entry.code === row.code && entry.officialText === row.officialText));
  }
  assert.equal(audit.officialInventoryTotal, null);
});

test('grade-1 classification workshop is linked to D-1-1 with real two-way classification operation and scope limits', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.ok(getCatalogCandidateTasksForSubject('grade-1', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  assert.ok(map.pendingLearningFocuses.some(({ id, candidateActivityId }) => id === task.curriculumMapId && candidateActivityId === task.activityId));
  const subitem = definitions.definitions.find(({ subitemId }) => subitemId === 'SUB-MATH-G1-D1-1-SAME-DATA-TWO-CLASSIFICATIONS');
  assert.ok(subitem);
  assert.deepEqual(subitem.activityIds, [task.activityId]);
  assert.deepEqual(subitem.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.match(task.curriculumScope, /部分候選/);
  assert.match(task.curriculumScope, /未實作學生自行蒐集實物/);
});

function act(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} ${JSON.stringify(payload)} failed: ${result.error}`);
  return result.session;
}
function classify(session, stage, wrong = false) {
  for (const observation of stage.observations) {
    const expected = stage.correctAssignments[observation.id];
    const categoryId = wrong && observation.id === stage.observations[0].id
      ? stage.categories.find(({ id }) => id !== expected).id
      : expected;
    session = act(session, 'assign_category', { observationId: observation.id, categoryId });
  }
  return session;
}

test('students can classify the same set by a different feature, receive wrong feedback, retry, and complete', () => {
  let session = act(createLearningTaskSession(task, 'g1-classification-test'), 'start');
  for (let index = 0; index < task.stages.length; index += 1) {
    const stage = task.stages[index];
    session = act(session, 'hint');
    session = act(session, 'hint');
    if (stage.interaction === 'classify_observations') session = classify(session, stage, true);
    else session = act(session, 'select_option', { optionId: stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id });
    let submitted = dispatchLearningTask(session, task, 'submit', { submissionId: `g1-wrong-${index}` });
    assert.equal(submitted.changed, true);
    assert.equal(submitted.session.lastFeedback.correct, false);
    session = act(submitted.session, 'retry');
    if (stage.interaction === 'classify_observations') session = classify(session, stage, false);
    else session = act(session, 'select_option', { optionId: stage.correctOptionIds[0] });
    submitted = dispatchLearningTask(session, task, 'submit', { submissionId: `g1-correct-${index}` });
    assert.equal(submitted.session.lastFeedback.correct, true);
    session = act(submitted.session, 'next');
  }
  assert.equal(session.phase, 'completed');
  assert.equal(act(session, 'restart', { sessionId: 'g1-classification-replay' }).phase, 'intro');
});
