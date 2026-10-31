import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADE2_ESTIMATION_WORKSHOP as estimate, GRADE2_LENGTH_WORKSHOP as length } from '../prototype/data/grade2EstimationAndLengthWorkshops.js';
import { CATALOG_CANDIDATE_TASK_BY_ID, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildOfficialLearningItemCrosswalk } from '../scripts/official-learning-item-activity-crosswalk.mjs';

const run = (task, session, action, payload) => dispatchLearningTask(session, task, action, payload).session;
const submit = (task, session, id) => dispatchLearningTask(session, task, 'submit', { submissionId: id });

test('G2 estimation and length workshops are unique, candidate, and registered in the live grade catalog', () => {
  for (const task of [estimate, length]) {
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.get(task.activityId), task);
    assert.equal(getCatalogCandidateTasksForSubject('grade-2', 'mathematics').filter((entry) => entry.activityId === task.activityId).length, 1);
    assert.ok(getGradeById('grade-2').subjects.find((entry) => entry.subjectId === 'mathematics').existingYearLevelContent.some((entry) => entry.activityId === task.activityId));
    assert.ok(LEARNING_TASK_RELATIONS.find((entry) => entry.gradeId === 'grade-2' && entry.subjectId === 'mathematics').tasks.some((entry) => entry.taskId === task.activityId));
  }
});

test('N-2-4 estimates require interaction and support incorrect feedback, hints, retry and completion', () => {
  let session = run(estimate, createLearningTaskSession(estimate, 'isolated-estimate'), 'start');
  for (const [i, stage] of estimate.stages.entries()) {
    session = run(estimate, session, 'set_estimate_value', { value: stage.estimateRules.inputRange.min });
    let result = submit(estimate, session, `estimate-wrong-${i}`);
    assert.equal(result.session.phase, 'feedback');
    assert.equal(result.session.lastFeedback.correct, false);
    session = run(estimate, result.session, 'retry');
    session = run(estimate, session, 'hint');
    session = run(estimate, session, 'hint');
    assert.equal(session.hintLevel, 2);
    const target = Math.round(((stage.estimateRules.acceptableRange.min + stage.estimateRules.acceptableRange.max) / 2) / stage.estimateRules.inputRange.step) * stage.estimateRules.inputRange.step;
    session = run(estimate, session, 'set_estimate_value', { value: target });
    result = submit(estimate, session, `estimate-correct-${i}`);
    assert.equal(result.session.phase, 'success', stage.stageId);
    session = run(estimate, result.session, 'next');
  }
  assert.equal(session.phase, 'completed');
  assert.equal(run(estimate, session, 'restart', { sessionId: 'estimate-replay' }).phase, 'intro');
});

test('N-2-11 length model stages align/read, compare and calculate, and convert with wrong-answer recovery', () => {
  let session = run(length, createLearningTaskSession(length, 'isolated-length'), 'start');
  for (const [i, stage] of length.stages.entries()) {
    if (stage.lengthRules?.mode === 'estimate') {
      session = run(length, session, 'set_length_estimate', { value: stage.lengthRules.estimateRange.min });
    } else if (stage.lengthRules?.mode === 'align_read') {
      while (session.lengthRulerZero !== stage.lengthRules.object.start) session = run(length, session, 'move_length_ruler', { delta: 1 });
      session = run(length, session, 'set_length_reading', { objectId: stage.lengthRules.object.id, value: stage.lengthRules.object.length - 1 });
    } else if (stage.lengthRules?.mode === 'compare') {
      for (const object of stage.lengthRules.objects) session = run(length, session, 'set_length_reading', { objectId: object.id, value: object.length });
      session = run(length, session, 'set_length_difference', { value: Math.abs(stage.lengthRules.objects[0].length - stage.lengthRules.objects[1].length) + 1 });
    } else {
      for (const step of stage.calculationSteps) session = run(length, session, 'select_calculation_value', { stepId: step.id, value: step.choices.find((choice) => choice.value !== step.expectedValue).value });
    }
    let result = submit(length, session, `length-wrong-${i}`);
    assert.equal(result.session.phase, 'feedback');
    assert.equal(result.session.lastFeedback.correct, false);
    session = run(length, result.session, 'retry');
    session = run(length, session, 'hint');
    session = run(length, session, 'hint');
    assert.equal(session.hintLevel, 2);
    if (stage.lengthRules?.mode === 'estimate') session = run(length, session, 'set_length_estimate', { value: stage.lengthRules.length ?? stage.lengthRules.targetLength });
    else if (stage.lengthRules?.mode === 'align_read') {
      while (session.lengthRulerZero !== stage.lengthRules.object.start) session = run(length, session, 'move_length_ruler', { delta: 1 });
      session = run(length, session, 'set_length_reading', { objectId: stage.lengthRules.object.id, value: stage.lengthRules.object.length });
    }
    else if (stage.lengthRules?.mode === 'compare') {
      for (const object of stage.lengthRules.objects) session = run(length, session, 'set_length_reading', { objectId: object.id, value: object.length });
      session = run(length, session, 'set_length_difference', { value: Math.abs(stage.lengthRules.objects[0].length - stage.lengthRules.objects[1].length) });
    } else for (const step of stage.calculationSteps) session = run(length, session, 'select_calculation_value', { stepId: step.id, value: step.expectedValue });
    result = submit(length, session, `length-correct-${i}`);
    assert.equal(result.session.phase, 'success', stage.stageId);
    session = run(length, result.session, 'next');
  }
  assert.equal(session.phase, 'completed');
  assert.equal(run(length, session, 'restart', { sessionId: 'length-replay' }).phase, 'intro');
  assert.deepEqual(Object.keys(session).filter((key) => /student|mastery|grade/.test(key)), []);
});

test('official science INa batch is exactly bounded to eight second-stage clauses and only claims partial material-sort evidence', () => {
  const batch = JSON.parse(readFileSync(new URL('../curriculum/natural-science-stage2-ina-official-content-batch.json', import.meta.url), 'utf8'));
  const source = JSON.parse(readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8')).sources.find((entry) => entry.id === 'natural-science');
  assert.equal(batch.clauses.length, 8);
  assert.equal(batch.applicability.grade, null);
  assert.equal(batch.applicability.semester, null);
  assert.equal(batch.clauses.every((clause) => clause.reviewStatus === 'directly_read_from_official_pdf_this_turn'), true);
  assert.ok(source.verifiedContentBatches.some((entry) => entry.batchId === batch.batchId && entry.officialContentRowCount === 8));
  const slice = buildOfficialLearningItemCrosswalk().verifiedNonMathOfficialContentSlices.find((entry) => entry.batchId === batch.batchId);
  assert.equal(slice.items.length, 8);
  assert.equal(slice.items.find((item) => item.officialCode === 'INa-II-3').activityEvidenceStatus, 'partial');
  assert.equal(slice.items.filter((item) => item.activityEvidenceStatus === 'uncovered').length, 7);
  assert.equal(slice.items.find((item) => item.officialCode === 'INa-II-3').activityEvidence[0].registered, true);
  assert.equal(slice.boundary.includes('不是自然科學完整條目總數'), true);
});
