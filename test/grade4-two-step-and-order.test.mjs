import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE4_MATH_TWO_STEP_SUPPLY } from '../prototype/data/grade4CandidateTasks.js';
import { GRADE4_MATH_COMPOUND_EXPRESSION_ORDER } from '../prototype/data/grade4MathGapTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { dispatchLearningTask, createLearningTaskSession, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';

const cases = [
  { task: GRADE4_MATH_TWO_STEP_SUPPLY, wrongChoice: () => '6' },
  { task: GRADE4_MATH_COMPOUND_EXPRESSION_ORDER, wrongChoice: () => 'wrong' },
];

function act(session, task, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${task.activityId}/${task.stages[session.stageIndex]?.stageId}/${action}/${JSON.stringify(payload)}: ${result.error ?? 'unchanged'}`);
  return result.session;
}

function answerStage(session, task, stage, correct) {
  if (stage.interaction === 'build_array') {
    const rows = correct ? stage.arrayRules.targetRows : stage.arrayRules.targetRows;
    const columns = correct ? stage.arrayRules.targetColumns : stage.arrayRules.targetColumns - 1;
    for (let i = 0; i < rows; i++) session = act(session, task, 'adjust_array_dimension', { dimension: 'rows', delta: 1 });
    for (let i = 0; i < columns; i++) session = act(session, task, 'adjust_array_dimension', { dimension: 'columns', delta: 1 });
  } else if (stage.interaction === 'assemble_response') {
    const ids = correct ? stage.correctOptionIds : [stage.tokens.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const tokenId of ids) session = act(session, task, 'add_phrase_token', { tokenId });
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) {
      const value = correct ? step.expectedValue : step.choices.find(({ value }) => value !== step.expectedValue).value;
      session = act(session, task, 'select_calculation_value', { stepId: step.id, value });
    }
  } else {
    const id = correct ? stage.correctOptionIds[0] : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = act(session, task, 'select_option', { optionId: id });
  }
  return session;
}

test('N-4-3 two-step supply task is registered and models distinct division unknowns with interactive arrays', () => {
  const task = GRADE4_MATH_TWO_STEP_SUPPLY;
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(task.curriculumCodes, ['N-4-3', 'n-II-5']);
  assert.ok(getCatalogCandidateTasksForSubject('grade-4', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  assert.ok(getLearningTaskRelation('grade-4', 'mathematics').tasks.some(({ taskId }) => taskId === task.activityId));
  assert.ok(GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  assert.ok(task.stages.some(({ interaction }) => interaction === 'build_array'));
  assert.ok(task.stages.some(({ interaction }) => interaction === 'assemble_response'));
});

test('R-4-1 compound expression task is registered and applies precedence, parentheses, and left-to-right steps', () => {
  const task = GRADE4_MATH_COMPOUND_EXPRESSION_ORDER;
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(task.curriculumCodes, ['R-4-1', 'r-II-3']);
  assert.ok(getCatalogCandidateTasksForSubject('grade-4', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  assert.ok(getLearningTaskRelation('grade-4', 'mathematics').tasks.some(({ taskId }) => taskId === task.activityId));
  assert.ok(GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  assert.deepEqual(task.stages.filter(({ interaction }) => interaction === 'assemble_response').map(({ correctOptionIds, tokens }) => correctOptionIds.map((id) => tokens.find((token) => token.id === id).text).join(' ')), ['3 × 4 + 5', '( 8 + 4 ) × 3', '36 ÷ 6 ÷ 2']);
  assert.deepEqual(task.stages.filter(({ interaction }) => interaction === 'complete_calculation_steps').map(({ calculationSteps }) => calculationSteps.map(({ expectedValue }) => expectedValue)), [[12, 17], [12, 36], [6, 3]]);
});

test('both tasks support two hints, meaningful incorrect feedback, retry, correct completion and replay', () => {
  for (const { task } of cases) {
    let session = act(createLearningTaskSession(task, `test-${task.activityId}`), task, 'start');
    for (const [index, stage] of task.stages.entries()) {
      session = act(session, task, 'hint');
      session = act(session, task, 'hint');
      session = answerStage(session, task, stage, false);
      session = act(session, task, 'submit', { submissionId: `${task.activityId}-${index}-wrong` });
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId}`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.ok(session.lastFeedback.text);
      session = act(session, task, 'retry');
      session = answerStage(session, task, stage, true);
      session = act(session, task, 'submit', { submissionId: `${task.activityId}-${index}-correct` });
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId}`);
      assert.equal(session.attempts.at(-1).result, 'correct');
      if (index < task.stages.length - 1) session = act(session, task, 'next');
    }
    session = act(session, task, 'next');
    assert.equal(session.phase, 'completed', task.activityId);
    assert.equal(session.status, 'candidate_pending_teacher_review');
    assert.equal(act(session, task, 'restart').phase, 'intro');
  }
});
