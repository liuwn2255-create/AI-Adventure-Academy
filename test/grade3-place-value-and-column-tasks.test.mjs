import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { GRADE3_PLACE_VALUE_AND_COLUMN_TASKS } from '../prototype/data/grade3PlaceValueAndColumnTasks.js';

const [placeValue, columnCalc] = GRADE3_PLACE_VALUE_AND_COLUMN_TASKS;
const submit = (session, activity, id) => dispatchLearningTask(session, activity, 'submit', { submissionId: id });

function setBlocks(session, stage, activity, counts) {
  for (const place of ['thousands', 'hundreds', 'tens', 'ones']) {
    const current = session.placeValueBlocks[place] ?? 0;
    const target = counts[place];
    for (let i = current; i < target; i += 1) session = dispatchLearningTask(session, activity, 'adjust_place_value_block', { place, delta: 1 }).session;
  }
  return session;
}

function setVertical(session, stage, activity, wrongFirst = false) {
  for (const [index, step] of stage.calculationSteps.entries()) {
    const target = step.expectedValue - (wrongFirst && index === 0 ? 1 : 0);
    for (let value = step.initialValue ?? 0; value < target; value += 1) {
      session = dispatchLearningTask(session, activity, 'adjust_vertical_calculation_step', { stepId: step.id, delta: 1 }).session;
    }
  }
  return session;
}

test('N-3-1/N-3-2 tasks are uniquely registered in grade 3 math, candidate only', () => {
  const ids = [placeValue.activityId, columnCalc.activityId];
  assert.deepEqual(ids, ['ACT-G3-MATH-PLACE-VALUE-EXCHANGE-CANDIDATE', 'ACT-G3-MATH-VERTICAL-REGROUPING-CANDIDATE']);
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const mathEntry = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent;
  const relation = getLearningTaskRelation('grade-3', 'mathematics');
  for (const task of GRADE3_PLACE_VALUE_AND_COLUMN_TASKS) {
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.ok(mathEntry.some(({ activityId }) => activityId === task.activityId));
    assert.ok(relation.tasks.some(({ taskId }) => taskId === task.activityId));
    assert.ok(task.stages.every(({ hints, incorrectFeedback, correctFeedback }) => hints.length >= 2 && incorrectFeedback && correctFeedback));
  }
  assert.deepEqual(placeValue.curriculumCodes, ['N-3-1', 'n-II-1']);
  assert.deepEqual(columnCalc.curriculumCodes, ['N-3-2', 'n-II-2']);
});

test('位值積木可組數、交換相鄰位值且驗證等值；錯誤可重試並完成重玩', () => {
  let session = dispatchLearningTask(createLearningTaskSession(placeValue, 'place-value-steps'), placeValue, 'start').session;
  let first = placeValue.stages[0];
  session = setBlocks(session, first, placeValue, { ...first.placeValueRules.targetCounts, ones: 7 });
  let result = submit(session, placeValue, 'pv-wrong');
  assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, placeValue, 'retry').session;
  session = setBlocks(session, first, placeValue, first.placeValueRules.targetCounts);
  result = submit(session, placeValue, 'pv-compose-right');
  assert.equal(result.session.phase, 'success');
  session = dispatchLearningTask(result.session, placeValue, 'next').session;
  const exchange100 = placeValue.stages[1];
  session = dispatchLearningTask(session, placeValue, 'exchange_place_value_block', { from: 'hundreds', to: 'tens' }).session;
  assert.equal(exchange100.placeValueRules.targetValue, 2430);
  session = dispatchLearningTask(session, placeValue, 'adjust_place_value_block', { place: 'ones', delta: 1 }).session;
  result = submit(session, placeValue, 'pv-exchange-wrong');
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /交換|總值/u);
  session = dispatchLearningTask(result.session, placeValue, 'retry').session;
  session = dispatchLearningTask(session, placeValue, 'exchange_place_value_block', { from: 'hundreds', to: 'tens' }).session;
  result = submit(session, placeValue, 'pv-exchange-right');
  assert.equal(result.session.phase, 'success');
  assert.equal(result.attempt.response.representedValue, 2430);
  session = dispatchLearningTask(result.session, placeValue, 'next').session;
  session = dispatchLearningTask(session, placeValue, 'exchange_place_value_block', { from: 'thousands', to: 'hundreds' }).session;
  result = submit(session, placeValue, 'pv-thousand-exchange');
  assert.equal(result.session.phase, 'success');
  session = dispatchLearningTask(result.session, placeValue, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, placeValue, 'restart').session.phase, 'intro');
});

test('直式每一步可調整答案數字及進退位；錯誤指出步驟，重試後完成三種情境', () => {
  let session = dispatchLearningTask(createLearningTaskSession(columnCalc, 'vertical-steps'), columnCalc, 'start').session;
  for (const [index, stage] of columnCalc.stages.entries()) {
    session = dispatchLearningTask(session, columnCalc, 'hint').session;
    session = dispatchLearningTask(session, columnCalc, 'hint').session;
    assert.equal(session.hintLevel, 2);
    if (index === 0) {
      session = setVertical(session, stage, columnCalc, true);
      let wrong = submit(session, columnCalc, 'vertical-wrong');
      assert.equal(wrong.session.phase, 'feedback');
      assert.match(wrong.session.lastFeedback.text, /個位|進/u);
      session = dispatchLearningTask(wrong.session, columnCalc, 'retry').session;
    }
    session = setVertical(session, stage, columnCalc);
    const result = submit(session, columnCalc, `vertical-correct-${index}`);
    assert.equal(result.session.phase, 'success');
    session = dispatchLearningTask(result.session, columnCalc, 'next').session;
  }
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.filter(({ result }) => result === 'correct').length, 3);
  assert.equal(dispatchLearningTask(session, columnCalc, 'restart').session.attempts.length, 0);
});
