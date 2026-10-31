import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADE2_MATH_MEASURE_COMPARE as task } from '../prototype/data/grade2CandidateTasks.js';
import { getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { validateLearningTask, createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const batch = read('../curriculum/math-grade2-official-content-batch.json');
const audit = read('../curriculum/math-focused-clause-audit.json');
const source = read('../curriculum/sources.json').sources.find(({ id }) => id === 'mathematics');
const map = read('../curriculum/curriculum-map.json');
const definitions = read('../curriculum/learning-subitem-definitions.json');

test('grade-2 official table batch contains every unique row from its contiguous pages and preserves partial cross-code relation', () => {
  assert.equal(batch.clauses.length, 24);
  assert.equal(new Set(batch.clauses.map(({ code }) => code)).size, 24);
  assert.deepEqual(batch.clauses.map(({ code }) => code), [
    'N-2-1','N-2-2','N-2-3','N-2-4','N-2-5','N-2-6','N-2-7','N-2-8','N-2-9','N-2-10','N-2-11','N-2-12','N-2-13','N-2-14',
    'S-2-1','S-2-2','S-2-3','S-2-4','S-2-5','R-2-1','R-2-2','R-2-3','R-2-4','D-2-1',
  ]);
  assert.equal(batch.sourceLocation.includes('PDF頁序22–25'), true);
  assert.equal(batch.applicability.officialGradeTable, 2);
  assert.equal(batch.applicability.learningStage, '第一學習階段（一、二年級）');
  assert.equal(batch.applicability.semester, null);
  assert.equal(batch.clauses.find(({ code }) => code === 'N-2-12').officialNotes.includes('無常用單位'), true);
  assert.equal(batch.clauses.find(({ code }) => code === 'S-2-5').relatedOfficialCodes.includes('N-2-12'), true);
  assert.equal(batch.clauses.find(({ code }) => code === 'S-2-5').equivalentOfficialCode, null);
  for (const row of batch.clauses) {
    assert.ok(row.officialText, `${row.code} official text missing`);
    assert.ok(row.officialNotes !== undefined, `${row.code} notes field missing`);
    assert.ok(row.sourceLocation.includes('PDF頁序'), `${row.code} source position missing`);
    assert.equal(row.relationshipKind, 'explicit_same_table_corresponding_performance');
    assert.ok(audit.clauses.some((entry) => entry.code === row.code && entry.officialText === row.officialText), `${row.code} not registered idempotently`);
    assert.ok(source.verifiedClauses.includes(row.code), `${row.code} missing source registry ref`);
  }
  assert.equal(audit.officialInventoryTotal, null);
  assert.equal(batch.nextWorkPosition.includes('PDF頁序28'), true);
});

test('grade-2 measurement comparison candidate is catalog-integrated, stage-specific, and explicitly partial', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.ok(getCatalogCandidateTasksForSubject('grade-2', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  assert.ok(map.pendingLearningFocuses.some(({ id, candidateActivityId }) => id === task.curriculumMapId && candidateActivityId === task.activityId));
  const definition = definitions.definitions.find(({ subitemId }) => subitemId === 'SUB-MATH-G2-N2-12-COMPARE-CAPACITY-WEIGHT-AREA');
  assert.ok(definition);
  assert.deepEqual(definition.activityIds, [task.activityId]);
  assert.deepEqual(definition.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.match(task.curriculumScope, /不取代實物/);
  assert.match(task.openQuestions.join(' '), /實物容器/);
});

function act(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} ${JSON.stringify(payload)} failed: ${result.error}`);
  return result.session;
}

function assignAll(session, stage, wrong = false) {
  for (const observation of stage.observations) {
    const expected = stage.correctAssignments[observation.id];
    const categoryId = wrong && observation.id === stage.observations[0].id
      ? stage.categories.find(({ id }) => id !== expected).id
      : expected;
    session = act(session, 'assign_category', { observationId: observation.id, categoryId });
  }
  return session;
}

test('learners compare each modeled quantity, receive error feedback, retry, and complete all three stations', () => {
  let session = act(createLearningTaskSession(task, 'g2-measure-compare-test'), 'start');
  for (let index = 0; index < task.stages.length; index += 1) {
    const stage = task.stages[index];
    session = act(session, 'hint');
    session = act(session, 'hint');
    session = assignAll(session, stage, true);
    let result = dispatchLearningTask(session, task, 'submit', { submissionId: `g2-measure-wrong-${index}` });
    assert.equal(result.changed, true);
    assert.equal(result.session.lastFeedback.correct, false);
    assert.match(result.session.lastFeedback.text, /共同|比較|單位|檢查/);
    session = act(result.session, 'retry');
    session = assignAll(session, stage);
    result = dispatchLearningTask(session, task, 'submit', { submissionId: `g2-measure-correct-${index}` });
    assert.equal(result.session.lastFeedback.correct, true);
    session = act(result.session, 'next');
  }
  assert.equal(session.phase, 'completed');
  assert.equal(act(session, 'restart', { sessionId: 'g2-measure-compare-replay' }).phase, 'intro');
});
