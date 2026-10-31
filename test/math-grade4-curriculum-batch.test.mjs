import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE4_MATH_FRACTION_EQUIVALENCE as task } from '../prototype/data/grade4CandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const batch = read('../curriculum/math-grade4-official-content-batch.json');
const audit = read('../curriculum/math-focused-clause-audit.json');
const source = read('../curriculum/sources.json').sources.find(({ id }) => id === 'mathematics');
const map = read('../curriculum/curriculum-map.json');
const definitions = read('../curriculum/learning-subitem-definitions.json');

test('grade-4 official content batch records all 26 code rows across PDF pages 28–31 and separates 25 distinct concepts', () => {
  const codes = batch.clauses.map(({ code }) => code);
  assert.equal(batch.applicability.officialGradeTable, 4);
  assert.equal(batch.applicability.learningStage, '第二學習階段（三、四年級）');
  assert.equal(batch.applicability.semester, null);
  assert.equal(codes.length, 26);
  assert.equal(new Set(codes).size, 26);
  assert.equal(batch.conceptRelationships.length, 2);
  const aliases = batch.conceptRelationships.filter(({ kind }) => kind === 'official_same_content_alias');
  assert.equal(codes.length - aliases.reduce((sum, relationship) => sum + relationship.codes.length - 1, 0), 25);
  assert.equal(batch.conceptRelationships.find(({ codes: related }) => related.includes('N-4-12'))?.kind, 'officially_related_but_distinct_learning_contents');
  assert.equal(batch.activityAudit.length, 26);
  assert.deepEqual(new Set(batch.activityAudit.map(({ code }) => code)), new Set(codes));
  for (const row of batch.activityAudit) {
    for (const activityId of row.activityIds) {
      const activity = CATALOG_CANDIDATE_TASKS.find(({ activityId: id }) => id === activityId);
      assert.ok(activity, `${row.code}: mapped activity ${activityId} exists`);
      for (const stageId of row.evidenceStageIds) {
        assert.ok(activity.stages.some(({ stageId: id }) => id === stageId), `${row.code}: mapped interaction stage ${stageId} exists`);
      }
    }
  }
  const twoStepAudit = batch.activityAudit.find(({ code }) => code === 'N-4-3');
  assert.equal(twoStepAudit.status, 'partial');
  assert.ok(twoStepAudit.evidenceStageIds.includes('model-six-cartons-four-packs'));
  const expressionOrderAudit = batch.activityAudit.find(({ code }) => code === 'R-4-1');
  assert.equal(expressionOrderAudit.status, 'partial');
  assert.ok(expressionOrderAudit.activityIds.includes('ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE'));
  assert.ok(expressionOrderAudit.evidenceStageIds.includes('calculate-parentheses-first'));
  const equivalentAudit = batch.activityAudit.find(({ code }) => code === 'N-4-6');
  assert.deepEqual(equivalentAudit.activityIds, [task.activityId]);
  assert.deepEqual(equivalentAudit.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.match(batch.sourceLocation, /PDF頁序28–31/);
  assert.match(batch.nextWorkPosition, /五年級學習內容表/);
  for (const row of batch.clauses) {
    assert.ok(row.officialText, `${row.code}: official text`);
    assert.ok(row.officialNotes !== undefined, `${row.code}: notes retained`);
    assert.ok(row.sourceLocation.includes('PDF頁序'), `${row.code}: source position`);
    assert.equal(row.relationshipKind, 'explicit_same_table_corresponding_performance');
    assert.ok(row.officialPerformanceLinks.length > 0);
    assert.ok(audit.clauses.some((entry) => entry.code === row.code && entry.officialText === row.officialText));
    assert.ok(source.verifiedClauses.includes(row.code));
  }
  assert.equal(batch.clauses.find(({ code }) => code === 'N-4-10').equivalentOfficialCode, 'S-4-1');
  assert.equal(batch.clauses.find(({ code }) => code === 'S-4-1').equivalentOfficialCode, 'N-4-10');
  assert.equal(audit.officialInventoryTotal, null);
  assert.equal(audit.auditStatus, 'verified_grade1_to_grade6_contiguous_content_table_batches_full_math_inventory_incomplete');
});

test('grade-4 equivalent-fraction candidate is registered at the grade-four mathematics entry with traceable, partial evidence', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.ok(getCatalogCandidateTasksForSubject('grade-4', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  const focus = map.pendingLearningFocuses.find(({ id }) => id === task.curriculumMapId);
  assert.equal(focus?.candidateActivityId, task.activityId);
  assert.deepEqual(focus.contentCodes, ['N-4-6']);
  assert.equal(focus.gradeApplicabilityStatus, 'official_grade_table_4; semester_and_local_schedule_pending');
  const definition = definitions.definitions.find(({ subitemId }) => subitemId === 'SUB-MATH-G4-N4-6-EQUIVALENT-FRACTIONS-MODEL-TRANSFER');
  assert.ok(definition);
  assert.deepEqual(definition.activityIds, [task.activityId]);
  assert.deepEqual(definition.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.equal(definition.status, 'candidate_partial_interaction');
  assert.equal(task.stages.length, 3);
  assert.ok(task.stages.every(({ interaction, hints }) => interaction === 'compose_shape' && hints.length >= 2));
  assert.match(task.curriculumScope, /未涵蓋簡單異分母分數加減及簡單分數與小數互換/);
  assert.ok(CATALOG_CANDIDATE_TASKS.filter(({ gradeId, subjectId }) => gradeId === 'grade-4' && subjectId === 'mathematics').length >= 6);
});

function act(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${task.activityId}: ${action} ${JSON.stringify(payload)} -> ${result.error ?? 'unchanged'}`);
  return result.session;
}

function compose(session, stage, wrong) {
  const correct = new Set(stage.shapeRules.correctPieceIds);
  const selected = wrong
    ? stage.pieces.filter(({ id }) => !correct.has(id)).slice(0, stage.shapeRules.selectionCount)
    : stage.pieces.filter(({ id }) => correct.has(id));
  for (const piece of selected) session = act(session, 'toggle_shape_piece', { pieceId: piece.id });
  return session;
}

test('equivalence activity accepts valid tile actions, explains errors, retries, transfers, completes and restarts', () => {
  let session = act(createLearningTaskSession(task, 'g4-equivalent-fractions'), 'start');
  for (let index = 0; index < task.stages.length; index += 1) {
    const stage = task.stages[index];
    session = act(session, 'hint');
    session = act(session, 'hint');
    session = compose(session, stage, true);
    let result = dispatchLearningTask(session, task, 'submit', { submissionId: `g4-frac-wrong-${index}` });
    assert.equal(result.changed, true);
    assert.equal(result.session.lastFeedback.correct, false);
    assert.match(result.session.lastFeedback.text, /相同|比較|檢查/);
    session = act(result.session, 'retry');
    session = compose(session, stage, false);
    result = dispatchLearningTask(session, task, 'submit', { submissionId: `g4-frac-correct-${index}` });
    assert.equal(result.session.lastFeedback.correct, true);
    session = act(result.session, 'next');
    if (index < task.stages.length - 1) assert.equal(session.stageIndex, index + 1);
  }
  assert.equal(session.phase, 'completed');
  session = act(session, 'restart', { sessionId: 'g4-equivalent-fractions-replay' });
  assert.equal(session.phase, 'intro');
  assert.equal(session.attempts.length, 0);
});
