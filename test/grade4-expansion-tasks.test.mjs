import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE4_EXPANSION_TASKS } from '../prototype/data/grade4ExpansionTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const map = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const mapIds = new Set([
  ...(map.verifiedLearningFocuses ?? []),
  ...(map.supplementalVerifiedLearningFocuses ?? []),
  ...(map.pendingLearningFocuses ?? []),
].map(({ id }) => id));
const stageCodes = (stage) => {
  if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
    return Object.fromEntries(stage.observations.map(({ id }, index) => [id, stage.categories[index % stage.categories.length].id]));
  }
  if (stage.interaction === 'order_items') return [...stage.initialOrder];
  if (stage.interaction === 'complete_calculation_steps') return Object.fromEntries(stage.calculationSteps.map(({ id, choices, expectedValue }) => [id, choices.find(({ value }) => value !== expectedValue).value]));
  if (stage.interaction === 'place_number_line_marker') return (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1);
  if (stage.interaction === 'compose_shape') {
    const correctPieces = [...stage.shapeRules.correctPieceIds];
    const distractor = stage.pieces.find(({ id }) => !correctPieces.includes(id));
    return [...correctPieces.slice(0, -1), distractor.id];
  }
  if (stage.interaction === 'assemble_response') return [...stage.correctOptionIds].reverse();
  return stage.options.filter(({ id }) => !stage.correctOptionIds.includes(id)).slice(0, 1).map(({ id }) => id);
};
function respond(session, task, stage, correct) {
  let current = session;
  const operationTrace = [];
  const snapshot = (state) => ({ phase: state.phase, stageIndex: state.stageIndex, selection: state.selection, assignments: state.assignments, orderedItems: state.orderedItems, calculationValues: state.calculationValues, numberLineTick: state.numberLineTick });
  const send = (action, payload) => {
    const before = snapshot(current);
    const result = dispatchLearningTask(current, task, action, payload);
    current = result.session;
    operationTrace.push({ before, action, payload, changed: result.changed, error: result.error ?? null, after: snapshot(current) });
    assert.equal(result.changed, true, `${task.activityId}/${stage.stageId}/${action}; trace=${JSON.stringify(operationTrace)}`);
  };
  const value = correct ? null : stageCodes(stage);
  if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const category = correct ? expected : stage.categories.find(({ id }) => id !== expected).id;
      send('assign_category', { observationId: observation.id, categoryId: category });
    }
  } else if (stage.interaction === 'order_items') {
    let order = [...current.orderedItems];
    const target = correct ? stage.correctItemIds : value;
    if (!correct && JSON.stringify(order) === JSON.stringify(stage.correctItemIds)) [order[0], order[1]] = [order[1], order[0]];
    else if (!correct) order = target;
    for (let i = 0; i < target.length; i += 1) {
      const at = current.orderedItems.indexOf(target[i]);
      if (at !== i) send('move_ordered_item', { itemId: target[i], toIndex: i });
    }
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) send('select_calculation_value', { stepId: step.id, value: correct ? step.expectedValue : value[step.id] });
  } else if (stage.interaction === 'place_number_line_marker') {
    send('set_number_line_tick', { tick: correct ? stage.numberLine.targetTick : value });
  } else if (stage.interaction === 'compose_shape') {
    const pieces = correct ? stage.shapeRules.correctPieceIds : value;
    for (const pieceId of pieces) send('toggle_shape_piece', { pieceId });
  } else {
    const ids = correct ? stage.correctOptionIds : value;
    const action = stage.interaction === 'assemble_response' ? 'add_phrase_token' : stage.interaction === 'choose_response' ? 'select_option' : 'toggle_evidence';
    for (const id of ids) send(action, stage.interaction === 'assemble_response' ? { tokenId: id } : { optionId: id });
  }
  const beforeSubmit = snapshot(current);
  const submitPayload = { submissionId: `${task.activityId}-${stage.stageId}-${correct ? 'correct' : 'wrong'}` };
  const submitted = dispatchLearningTask(current, task, 'submit', submitPayload);
  operationTrace.push({ before: beforeSubmit, action: 'submit', payload: submitPayload, changed: submitted.changed, error: submitted.error ?? null, after: snapshot(submitted.session) });
  assert.equal(submitted.changed, true, `${task.activityId}/${stage.stageId}/submit; trace=${JSON.stringify(operationTrace)}`);
  return submitted.session;
}

test('Grade 4 expansion provides eight distinct candidate activities across five subjects', () => {
  assert.equal(GRADE4_EXPANSION_TASKS.length, 8);
  assert.deepEqual(Object.fromEntries(['mathematics', 'chinese-language', 'natural-science', 'social-studies', 'arts'].map((subject) => [subject, GRADE4_EXPANSION_TASKS.filter((task) => task.subjectId === subject).length])), {
    mathematics: 2, 'chinese-language': 2, 'natural-science': 2, 'social-studies': 1, arts: 1,
  });
  assert.equal(new Set([...CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)]).size, CATALOG_CANDIDATE_TASKS.length);
  for (const task of GRADE4_EXPANSION_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.ok(mapIds.has(task.curriculumMapId), `${task.activityId} curriculum map`);
    assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
    assert.ok(getCatalogCandidateTasksForSubject('grade-4', task.subjectId).some(({ activityId }) => activityId === task.activityId));
    assert.ok(getLearningTaskRelation('grade-4', task.subjectId)?.tasks.some(({ taskId }) => taskId === task.activityId));
  }
  const grade4 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  for (const subject of ['mathematics', 'chinese-language', 'natural-science', 'social-studies', 'arts']) {
    const subjectEntry = grade4.subjects.find(({ subjectId }) => subjectId === subject);
    const registeredItems = subjectEntry?.existingYearLevelContent ?? [];
    for (const task of GRADE4_EXPANSION_TASKS.filter(({ subjectId }) => subjectId === subject)) {
      const directoryItem = registeredItems.find(({ activityId }) => activityId === task.activityId);
      assert.ok(directoryItem, `${subject}/${task.activityId} must be registered in existingYearLevelContent`);
      assert.equal(CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === directoryItem.activityId)?.subjectId, subject, `${task.activityId} catalog subject must match Grade 4 directory subject`);
    }
  }
});

test('all eight Grade 4 candidates execute hint, incorrect feedback, retry, completion and restart in memory', () => {
  for (const task of GRADE4_EXPANSION_TASKS) {
    let session = createLearningTaskSession(task, `test-${task.activityId}`);
    session = dispatchLearningTask(session, task, 'start').session;
    for (const stage of task.stages) {
      assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
      session = dispatchLearningTask(session, task, 'hint').session;
      assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
      session = dispatchLearningTask(session, task, 'hint').session;
      session = respond(session, task, stage, false);
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId} wrong feedback`);
      assert.ok(session.lastFeedback.text);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = respond(session, task, stage, true);
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId} correct`);
      session = dispatchLearningTask(session, task, 'next').session;
    }
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(session.attempts.some(({ hintUsed }) => hintUsed), true);
    const restarted = dispatchLearningTask(session, task, 'restart').session;
    assert.equal(restarted.phase, 'intro');
    assert.equal(restarted.attempts.length, 0);
  }
});

test('candidate calculation data independently agrees with its displayed values', () => {
  const multiply = GRADE4_EXPANSION_TASKS[1].stages[0].calculationSteps;
  assert.equal(326 * 20, multiply[0].expectedValue);
  assert.equal(326 * 4, multiply[1].expectedValue);
  assert.equal(multiply[0].expectedValue + multiply[1].expectedValue, multiply[2].expectedValue);
  for (const step of multiply) assert.equal(step.choices.find(({ value }) => value === step.expectedValue).label.replaceAll(',', ''), String(step.expectedValue));
  const divide = GRADE4_EXPANSION_TASKS[1].stages[1].calculationSteps;
  assert.equal(24 * 50, divide[0].expectedValue);
  assert.equal(1248 - divide[0].expectedValue, divide[1].expectedValue);
  assert.equal(divide[1].expectedValue / 24, divide[2].expectedValue);
});
