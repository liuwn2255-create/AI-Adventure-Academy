import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE6_CANDIDATE_TASKS, GRADE6_GCD_LCM_SHORT_DIVISION } from '../prototype/data/grade6CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));
const expectedCodes = [
  ...Array.from({ length: 9 }, (_, index) => `N-6-${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `S-6-${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `R-6-${index + 1}`), 'D-6-1', 'D-6-2',
];

test('六年級官方內容表 19 個代碼列逐列有原文、頁序、階段與官方對應', () => {
  const batch = read('curriculum/math-grade6-official-content-batch.json');
  const audit = read('curriculum/math-focused-clause-audit.json');
  assert.equal(batch.status, 'verified_contiguous_grade_table_batch_not_full_math_inventory');
  assert.equal(batch.applicability.officialGradeTable, 6);
  assert.equal(batch.applicability.learningStage, '第三學習階段（五、六年級）');
  assert.equal(batch.applicability.semester, null);
  assert.match(batch.sourceLocation, /PDF頁序35–37/u);
  assert.match(batch.sourceLocation, /頁序38開始「7年級」/u);
  assert.deepEqual(batch.clauses.map(({ code }) => code), expectedCodes);
  assert.equal(new Set(batch.clauses.map(({ code }) => code)).size, 19);
  assert.ok(batch.clauses.every(({ officialText, officialNotes, sourceLocation, officialPerformanceLinks }) => officialText && officialNotes !== undefined && /PDF頁序/u.test(sourceLocation) && officialPerformanceLinks.length));
  assert.deepEqual(batch.activityAudit.map(({ code }) => code), expectedCodes);
  assert.deepEqual(Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, batch.activityAudit.filter((row) => row.status === status).length])), {
    partial: 5, relation_only: 4, uncovered: 10, needs_verification: 0,
  });
  for (const row of batch.clauses) {
    const registered = audit.clauses.filter(({ code, clauseType }) => code === row.code && clauseType === 'learning_content');
    assert.equal(registered.length, 1, `${row.code} must have one registered official content row`);
    assert.equal(registered[0].officialText, row.officialText, `${row.code} original-text drift`);
    assert.equal(registered[0].sourceLocation, row.sourceLocation, `${row.code} location drift`);
    for (const performanceCode of row.officialPerformanceLinks) {
      assert.ok(audit.learningPerformanceClauses.some(({ code }) => code === performanceCode), `${row.code} unresolved performance ${performanceCode}`);
    }
  }
  const alias = batch.conceptRelationships.find(({ kind }) => kind === 'same_official_learning_content_explicitly_cross_referenced');
  assert.deepEqual(alias.codes, ['N-6-9', 'R-6-4']);
  assert.equal(alias.uniqueConceptCount, 1);
  assert.equal(batch.clauses.length - 1, 18);
  assert.match(batch.nextWorkPosition, /跨年級數學內容與學習表現整合/u);
});

test('六年級活動稽核只把有具體互動階段的項目列為部分涵蓋', () => {
  const batch = read('curriculum/math-grade6-official-content-batch.json');
  const definitions = read('curriculum/learning-subitem-definitions.json');
  const catalogIds = new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId));
  const catalogTaskById = new Map(CATALOG_CANDIDATE_TASKS.map((task) => [task.activityId, task]));
  const definitionById = new Map(definitions.definitions.map((item) => [item.subitemId, item]));
  for (const row of batch.activityAudit) {
    assert.ok(row.activityIds.every((id) => catalogIds.has(id)), `${row.code} activity absent from catalog`);
    const tasks = row.activityIds.map((id) => catalogTaskById.get(id));
    for (const stageId of row.evidenceStageIds) assert.ok(tasks.some((task) => task?.stages.some((stage) => stage.stageId === stageId)), `${row.code}/${stageId} missing stage`);
    if (row.status === 'partial') {
      assert.ok(row.evidenceStageIds.length, `${row.code} partial classification needs stage evidence`);
      for (const task of tasks) {
        if (task?.learningSubitemClaims) {
          for (const subitemId of task.learningSubitemClaims) {
            const definition = definitionById.get(subitemId);
            assert.ok(definition, `${subitemId} missing project subitem definition`);
            assert.deepEqual(definition.activityIds, [task.activityId]);
            assert.ok(definition.evidenceStageIds.every((stageId) => task.stages.some((stage) => stage.stageId === stageId)));
            assert.equal(definition.status, 'candidate_partial_interaction');
          }
        }
      }
    }
  }
  for (const id of [
    'SUB-MATH-G6-N6-1-PRIME-CLASSIFICATION-AND-FACTORS',
    'SUB-MATH-G6-N6-2-SHORT-DIVISION-AND-FRACTION-SIMPLIFICATION',
    'SUB-MATH-G6-N6-5-INTEGER-MULTI-STEP-AND-SEQUENCING',
  ]) assert.ok(definitionById.has(id), `${id} is missing`);
  assert.ok(GRADE6_CANDIDATE_TASKS.every((task) => validateLearningTask(task).length === 0));
});

test('N-6-2 candidate short-division task gives wrong-step feedback, retry, transfer and replay', () => {
  const task = GRADE6_GCD_LCM_SHORT_DIVISION;
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(task.curriculumCodes, ['N-6-2', 'n-III-3']);
  assert.equal(task.stages.length, 3);
  assert.ok(task.stages.every(({ interaction, hints, incorrectFeedback }) => interaction === 'complete_calculation_steps' && hints.length >= 2 && incorrectFeedback));
  let session = dispatchLearningTask(createLearningTaskSession(task, 'grade6-n62-audit'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    if (index) session = dispatchLearningTask(session, task, 'next').session;
    for (let level = 0; level < 2; level += 1) {
      const hint = dispatchLearningTask(session, task, 'hint');
      assert.equal(hint.changed, true);
      assert.ok(hint.hint);
      session = hint.session;
    }
    const [firstStep, ...otherSteps] = stage.calculationSteps;
    const wrongValue = firstStep.choices.find(({ value }) => value !== firstStep.expectedValue).value;
    session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: firstStep.id, value: wrongValue }).session;
    for (const step of otherSteps) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.expectedValue }).session;
    const wrong = dispatchLearningTask(session, task, 'submit', { submissionId: `wrong-${index}` });
    assert.equal(wrong.changed, true);
    assert.equal(wrong.session.phase, 'feedback');
    assert.equal(wrong.session.attempts.at(-1).result, 'incorrect');
    assert.equal(wrong.session.lastFeedback.text, stage.incorrectFeedback);
    session = dispatchLearningTask(wrong.session, task, 'retry').session;
    assert.equal(session.phase, 'active');
    for (const step of stage.calculationSteps) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.expectedValue }).session;
    const correct = dispatchLearningTask(session, task, 'submit', { submissionId: `correct-${index}` });
    assert.equal(correct.session.phase, 'success');
    assert.equal(correct.session.attempts.at(-1).result, 'correct');
    session = correct.session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, task.stages.length * 2);
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
  assert.deepEqual(task.stages.map((stage) => stage.calculationSteps.map(({ expectedValue }) => expectedValue)), [
    [9, 12, 3, 4, 6, 72], [9, 12, 3, 4], [6, 15, 2, 5, 60],
  ]);
});
