import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE4_MATH_GAP_TASKS } from '../prototype/data/grade4MathGapTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const readJson = (file) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const curriculumMap = readJson('../curriculum/curriculum-map.json');
const definitions = readJson('../curriculum/learning-subitem-definitions.json');
const grade4Batch = readJson('../curriculum/math-grade4-official-content-batch.json');

function point(session, task, pointId) {
  const result = dispatchLearningTask(session, task, 'select_line_construction_point', { pointId });
  assert.equal(result.changed, true, `${task.activityId}/${task.stages[session.stageIndex].stageId}/${pointId}`);
  return result.session;
}

test('Grade 4 gap activities are unique candidate tasks registered in mathematics directory and learning map', () => {
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const grade4 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  for (const task of GRADE4_MATH_GAP_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.ok(getCatalogCandidateTasksForSubject('grade-4', 'mathematics').some(({ activityId }) => activityId === task.activityId));
    assert.ok(getLearningTaskRelation('grade-4', 'mathematics')?.tasks.some(({ taskId }) => taskId === task.activityId));
    assert.ok(grade4.subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
    assert.ok([...(curriculumMap.pendingLearningFocuses ?? [])].some(({ id }) => id === task.curriculumMapId));
    assert.ok(definitions.definitions.some(({ activityIds }) => activityIds?.includes(task.activityId)));
    assert.ok(grade4Batch.activityAudit.some(({ activityIds }) => activityIds.includes(task.activityId)));
  }
});

test('rounding estimation accepts reasonable estimates and supports wrong feedback, retry, transfer and completion', () => {
  const task = GRADE4_MATH_GAP_TASKS[0];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'estimate-test'), task, 'start').session;
  const answers = [52000, 12000, 9600];
  for (const [index, stage] of task.stages.entries()) {
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
    session = dispatchLearningTask(session, task, 'hint').session;
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'set_estimate_value', { value: stage.estimateRules.inputRange.min }).session;
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `estimate-wrong-${index}` }).session;
    assert.equal(session.phase, 'feedback');
    assert.match(session.lastFeedback.text, /估算|取概數|近似/);
    session = dispatchLearningTask(session, task, 'retry').session;
    session = dispatchLearningTask(session, task, 'set_estimate_value', { value: answers[index] }).session;
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `estimate-right-${index}` }).session;
    assert.equal(session.phase, 'success');
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('line construction validates perpendicularity, parallelism and the required point before accepting a response', () => {
  const task = GRADE4_MATH_GAP_TASKS[1];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'lines-test'), task, 'start').session;
  const answers = [
    [['r3c1', 'r3c5'], ['r0c3', 'r6c3']],
    [['r0c0', 'r3c3'], ['r0c3', 'r3c6']],
    [['r1c1', 'r5c5'], ['r0c6', 'r6c0']],
  ];
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    for (const id of answers[index][0]) session = point(session, task, id);
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `line-wrong-${index}` }).session;
    assert.equal(session.phase, 'feedback', stage.stageId);
    assert.match(session.lastFeedback.text, /檢查|通過|方向/);
    session = dispatchLearningTask(session, task, 'retry').session;
    for (const id of answers[index][1]) session = point(session, task, id);
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `line-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('decimal hundredths operation uses place-value controls, diagnoses errors, supports transfer and completion', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-DECIMAL-HUNDREDTHS-OPERATIONS-CANDIDATE');
  const plans = [
    [['ones', 1], ['ones', 1], ...Array(3).fill(['tenths', 1]), ...Array(5).fill(['hundredths', 1])],
    [['ones', -1], ...Array(3).fill(['tenths', -1]), ...Array(8).fill(['hundredths', -1])],
    [['ones', 1], ['ones', 1], ...Array(3).fill(['tenths', 1]), ...Array(5).fill(['hundredths', 1])],
  ];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'decimal-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
    session = dispatchLearningTask(session, task, 'hint').session;
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'adjust_decimal_place', { place: 'ones', delta: 1 }).session;
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `decimal-wrong-${index}` }).session;
    assert.equal(session.phase, 'feedback');
    assert.match(session.lastFeedback.text, /位值|百分位|借位|小數/);
    session = dispatchLearningTask(session, task, 'retry').session;
    for (const [place, delta] of plans[index]) session = dispatchLearningTask(session, task, 'adjust_decimal_place', { place, delta }).session;
    assert.equal(session.decimalHundredths, stage.decimalRules.targetHundredths);
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `decimal-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('congruence challenge performs translation, rotation and reflection and rejects incorrect overlap', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-CONGRUENT-FIGURE-TRANSFORM-CANDIDATE');
  const solutions = [
    [{ action: 'move_geometry_piece', payload: { direction: 'down' } }, ...Array(3).fill({ action: 'move_geometry_piece', payload: { direction: 'right' } })],
    [{ action: 'rotate_geometry_piece' }, { action: 'move_geometry_piece', payload: { direction: 'down' } }, { action: 'move_geometry_piece', payload: { direction: 'right' } }],
    [{ action: 'flip_geometry_piece' }, { action: 'move_geometry_piece', payload: { direction: 'down' } }, ...Array(3).fill({ action: 'move_geometry_piece', payload: { direction: 'right' } })],
  ];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'congruence-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'move_geometry_piece', { pieceId: 'kite-tile', direction: 'down' }).session;
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `congruence-wrong-${index}` }).session;
    assert.equal(session.phase, 'feedback', stage.stageId);
    assert.match(session.lastFeedback.text, /目標|重合|方向|疊合/);
    session = dispatchLearningTask(session, task, 'retry').session;
    for (const { action, payload = {} } of solutions[index]) {
      session = dispatchLearningTask(session, task, action, { pieceId: 'kite-tile', ...payload }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `congruence-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('S-4-8 quadrilateral builder validates ordered grid construction and supports retry across shapes', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-QUADRILATERAL-FEATURE-CONSTRUCTION-CANDIDATE');
  const solutions = [
    ['r0c0', 'r0c2', 'r2c2', 'r2c0'],
    ['r0c0', 'r0c3', 'r2c3', 'r2c0'],
    ['r0c1', 'r1c3', 'r3c2', 'r2c0'],
  ];
  const alternateWrong = [
    ['r0c0', 'r0c3', 'r2c2', 'r3c0'],
    ['r0c0', 'r0c3', 'r2c2', 'r3c0'],
    ['r0c0', 'r0c3', 'r2c2', 'r3c0'],
  ];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'quadrilateral-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    for (const pointId of alternateWrong[index]) session = dispatchLearningTask(session, task, 'toggle_quadrilateral_vertex', { pointId }).session;
    const wrong = dispatchLearningTask(session, task, 'submit', { submissionId: `quad-wrong-${index}` });
    assert.equal(wrong.changed, true);
    assert.equal(wrong.session.phase, 'feedback', stage.stageId);
    assert.match(wrong.session.lastFeedback.text, /檢查|特徵|順序/);
    session = dispatchLearningTask(wrong.session, task, 'retry').session;
    for (const pointId of solutions[index]) session = dispatchLearningTask(session, task, 'toggle_quadrilateral_vertex', { pointId }).session;
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `quad-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('S-4-3 rectangle model builds area arrays and diagnoses perimeter calculation steps', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-AREA-PERIMETER-ARRAY-MODEL-CANDIDATE');
  let session = dispatchLearningTask(createLearningTaskSession(task, 'area-perimeter-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (stage.interaction === 'build_array') {
      session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
      session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `array-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      session = dispatchLearningTask(session, task, 'retry').session;
      for (let row = 0; row < stage.arrayRules.targetRows; row += 1) session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
      for (let column = 0; column < stage.arrayRules.targetColumns; column += 1) session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
    } else {
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: 'side-sum', value: 12 }).session;
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: 'double-side-sum', value: 24 }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: 'perimeter-wrong' }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      assert.match(session.lastFeedback.text, /周長|外框|方格/);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: 'side-sum', value: 7 }).session;
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: 'double-side-sum', value: 14 }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `area-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('N-4-9 kilometer route uses estimate, number-line and conversion operations with feedback and transfer', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-KILOMETER-ROUTE-AND-CONVERSION-CANDIDATE');
  assert.equal(task.status, 'candidate_pending_teacher_review');
  let session = dispatchLearningTask(createLearningTaskSession(task, 'km-route-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (stage.interaction === 'set_estimate_range') {
      session = dispatchLearningTask(session, task, 'set_estimate_value', { value: stage.estimateRules.inputRange.min }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `km-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      assert.match(session.lastFeedback.text, /估計|公里|路線/);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = dispatchLearningTask(session, task, 'set_estimate_value', { value: 3 }).session;
    } else if (stage.interaction === 'place_number_line_marker') {
      session = dispatchLearningTask(session, task, 'set_number_line_tick', { tick: 2 }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `km-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      session = dispatchLearningTask(session, task, 'retry').session;
      session = dispatchLearningTask(session, task, 'set_number_line_tick', { tick: 5 }).session;
    } else {
      for (const [stepIndex, step] of stage.calculationSteps.entries()) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.choices[0].value }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `km-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      session = dispatchLearningTask(session, task, 'retry').session;
      for (const step of stage.calculationSteps) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.expectedValue }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `km-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('N-4-11 square-meter activity builds differently sized unit-square arrays after estimating', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-SQUARE-METER-FLOOR-PLANNER-CANDIDATE');
  assert.equal(task.status, 'candidate_pending_teacher_review');
  let session = dispatchLearningTask(createLearningTaskSession(task, 'sqm-floor-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (stage.interaction === 'set_estimate_range') {
      session = dispatchLearningTask(session, task, 'set_estimate_value', { value: stage.estimateRules.inputRange.min }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `sqm-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      session = dispatchLearningTask(session, task, 'retry').session;
      session = dispatchLearningTask(session, task, 'set_estimate_value', { value: 12 }).session;
    } else {
      session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
      session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `sqm-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      session = dispatchLearningTask(session, task, 'retry').session;
      for (let row = 0; row < stage.arrayRules.targetRows; row += 1) session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
      for (let column = 0; column < stage.arrayRules.targetColumns; column += 1) session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `sqm-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('R-4-2 computation-property workshop translates, rewrites and calculates equivalent expressions', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE');
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.curriculumMapId, 'math-grade4-computation-properties');
  let session = dispatchLearningTask(createLearningTaskSession(task, 'r42-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (stage.interaction === 'assemble_response') {
      const ids = [...stage.correctOptionIds].reverse();
      for (const tokenId of ids) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r42-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      assert.match(session.lastFeedback.text, /算式|數量/);
      session = dispatchLearningTask(session, task, 'retry').session;
      for (const tokenId of stage.correctOptionIds) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
    } else if (stage.interaction === 'order_items') {
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r42-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      session = dispatchLearningTask(session, task, 'retry').session;
      for (let targetIndex = 0; targetIndex < stage.correctItemIds.length; targetIndex += 1) {
        let current = session.orderedItems.indexOf(stage.correctItemIds[targetIndex]);
        while (current > targetIndex) {
          session = dispatchLearningTask(session, task, 'move_ordered_item', { itemId: stage.correctItemIds[targetIndex], toIndex: current - 1 }).session;
          current -= 1;
        }
      }
    } else {
      for (const step of stage.calculationSteps) {
        const wrong = step.choices.find(({ value }) => value !== step.expectedValue);
        session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: wrong.value }).session;
      }
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r42-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      session = dispatchLearningTask(session, task, 'retry').session;
      for (const step of stage.calculationSteps) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.expectedValue }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `r42-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('R-4-3 formula workshop composes word-and-symbol formulas and applies them to transfer values', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE');
  assert.equal(task.status, 'candidate_pending_teacher_review');
  let session = dispatchLearningTask(createLearningTaskSession(task, 'r43-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (stage.interaction === 'assemble_response') {
      for (const tokenId of [...stage.correctOptionIds].reverse()) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r43-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      session = dispatchLearningTask(session, task, 'retry').session;
      for (const tokenId of stage.correctOptionIds) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
    } else {
      const step = stage.calculationSteps[0];
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.choices.find(({ value }) => value !== step.expectedValue).value }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r43-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback');
      session = dispatchLearningTask(session, task, 'retry').session;
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: step.expectedValue }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `r43-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});

test('R-4-4 pattern workshop fills two-dimensional number grids and reasons from odd/even examples', () => {
  const task = GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE');
  assert.equal(task.status, 'candidate_pending_teacher_review');
  const gridStages = task.stages.filter(({ interaction }) => interaction === 'compose_pattern');
  assert.equal(gridStages.length, 3);
  assert.ok(gridStages.every(({ patternRules }) => patternRules.grid));
  let session = dispatchLearningTask(createLearningTaskSession(task, 'r44-test'), task, 'start').session;
  for (const [index, stage] of task.stages.entries()) {
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (stage.interaction === 'compose_pattern') {
      const correct = stage.patternRules.targetPattern;
      const wrongToken = stage.tokens.find(({ id }) => !correct.includes(id))?.id ?? correct[0];
      const wrongPattern = stage.tokens.every(({ id }) => correct.includes(id))
        ? [correct[1], correct[0], ...correct.slice(2)]
        : [wrongToken, ...correct.slice(1)];
      for (const tokenId of wrongPattern) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r44-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      session = dispatchLearningTask(session, task, 'retry').session;
      for (const tokenId of correct) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId }).session;
    } else {
      session = dispatchLearningTask(session, task, 'select_option', { optionId: stage.options.find(({ id }) => id !== stage.correctOptionIds[0]).id }).session;
      session = dispatchLearningTask(session, task, 'submit', { submissionId: `r44-wrong-${index}` }).session;
      assert.equal(session.phase, 'feedback', stage.stageId);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = dispatchLearningTask(session, task, 'select_option', { optionId: stage.correctOptionIds[0] }).session;
    }
    session = dispatchLearningTask(session, task, 'submit', { submissionId: `r44-right-${index}` }).session;
    assert.equal(session.phase, 'success', stage.stageId);
    if (index < task.stages.length - 1) session = dispatchLearningTask(session, task, 'next').session;
  }
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
});
