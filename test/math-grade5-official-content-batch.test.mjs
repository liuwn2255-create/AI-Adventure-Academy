import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE5_CANDIDATE_TASKS } from '../prototype/data/grade5CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));

test('五年級官方數學學習內容批次逐列完整、可追溯且明確保留學習階段範圍', () => {
  const batch = read('curriculum/math-grade5-official-content-batch.json');
  const audit = read('curriculum/math-focused-clause-audit.json');
  const report = read('artifacts/math-curriculum-audit-report.json');
  const expectedCodes = [
    ...Array.from({ length: 16 }, (_, index) => `N-5-${index + 1}`),
    ...Array.from({ length: 7 }, (_, index) => `S-5-${index + 1}`),
    ...Array.from({ length: 3 }, (_, index) => `R-5-${index + 1}`), 'D-5-1',
  ];
  assert.equal(batch.status, 'verified_contiguous_grade_table_batch_not_full_math_inventory');
  assert.equal(batch.applicability.officialGradeTable, 5);
  assert.equal(batch.applicability.learningStage, '第三學習階段（五、六年級）');
  assert.equal(batch.applicability.semester, null);
  assert.deepEqual(batch.clauses.map(({ code }) => code), expectedCodes);
  assert.equal(new Set(batch.clauses.map(({ code }) => code)).size, 27);
  assert.ok(batch.clauses.every((row) => row.officialText && row.officialNotes !== undefined && row.sourceLocation && row.officialPerformanceLinks.length));
  assert.deepEqual(batch.clauses.map(({ code }) => code), batch.activityAudit.map(({ code }) => code));
  for (const row of batch.clauses) {
    const registered = audit.clauses.filter(({ code, clauseType }) => code === row.code && clauseType === 'learning_content');
    assert.equal(registered.length, 1, `${row.code} should have one registered content row`);
    assert.equal(registered[0].officialText, row.officialText, `${row.code} text drift`);
    assert.equal(registered[0].sourceLocation, row.sourceLocation, `${row.code} source location drift`);
  }
  const n56 = batch.clauses.find(({ code }) => code === 'N-5-6');
  assert.match(n56.officialText, /從分裝（測量）和平分的觀點/u);
  assert.match(n56.officialNotes, /商為分數的合理性/u);
  assert.match(n56.sourceLocation, /頁序32/u);
  assert.equal(report.clauseBatch.grade5ContiguousOfficialTableBatch.registeredRows, 27);
  assert.deepEqual(report.clauseBatch.grade5ContiguousOfficialTableBatch.coverageCountsWithinBatch, { partial: 5, relation_only: 1, uncovered: 21, needs_verification: 0 });
  assert.match(batch.nextWorkPosition, /六年級.*頁序35/u);
});

test('N-5-6 候選遊戲有目錄、地圖、資料模組及兩個可操作階段的對應', () => {
  const task = GRADE5_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G5-MATH-INTEGER-DIVISION-FRACTION-MODEL-CANDIDATE');
  const map = read('curriculum/learning-map.json');
  const relation = map.learningObjectiveTaskCrosswalk.find(({ gradeId, subjectId }) => gradeId === 'grade-5' && subjectId === 'mathematics');
  assert.ok(task);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(task.curriculumCodes, ['N-5-6', 'n-III-5']);
  assert.equal(task.stages.length, 2);
  assert.ok(task.stages.every(({ interaction, hints, incorrectFeedback }) => interaction === 'compose_shape' && hints.length >= 2 && incorrectFeedback));
  assert.ok(CATALOG_CANDIDATE_TASKS.some(({ activityId }) => activityId === task.activityId));
  assert.ok(relation.curriculumMapIds.includes(task.curriculumMapId));
  assert.ok(relation.tasks.some(({ taskId, runtimeModule, status }) => taskId === task.activityId && runtimeModule === 'prototype/data/grade5CandidateTasks.js' && status === 'playable_candidate_pending_teacher_review'));
  assert.ok(relation.learningObjectiveTaskLinks.some(({ taskIds }) => taskIds.includes(task.activityId)));
});
