import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const newActivities = [
  'ACT-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE',
  'ACT-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE',
  'ACT-G3-MATH-GEOMETRY-TILE-CANDIDATE',
].map((id) => CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === id));
const grade3Scope = JSON.parse(await readFile(new URL('../curriculum/grade3-year-scope.json', import.meta.url), 'utf8'));

function start(activity, id) {
  return dispatchLearningTask(createLearningTaskSession(activity, id), activity, 'start').session;
}

function submit(session, activity, id) {
  return dispatchLearningTask(session, activity, 'submit', { submissionId: id });
}

function setArray(session, activity, rows, columns) {
  while (session.arrayRows < rows) session = dispatchLearningTask(session, activity, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
  while (session.arrayColumns < columns) session = dispatchLearningTask(session, activity, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
  return session;
}

function selectPieces(session, activity, ids) {
  for (const pieceId of ids) session = dispatchLearningTask(session, activity, 'toggle_shape_piece', { pieceId }).session;
  return session;
}

test('三個新工坊在課程目錄、學習目標與課綱地圖中維持候選連結', () => {
  assert.equal(newActivities.filter(Boolean).length, 3);
  assert.equal(new Set(newActivities.map(({ activityId }) => activityId)).size, 3);
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const math = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  const relation = getLearningTaskRelation('grade-3', 'mathematics');
  for (const activity of newActivities) {
    assert.deepEqual(validateLearningTask(activity), []);
    assert.equal(activity.status, 'candidate_pending_teacher_review');
    assert.equal(activity.teacherReview.status, 'not_reviewed');
    assert.equal(activity.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(activity.evidencePolicy.completionIsMastery, false);
    assert.equal(activity.reinforcementStatus, '尚無連結的補強活動');
    assert.ok(math.existingYearLevelContent.some(({ activityId, runtimeAvailability, entryRoute }) => activityId === activity.activityId && runtimeAvailability === 'playable_candidate_prototype' && entryRoute?.targetScreen === 'catalog-task'));
    assert.ok(relation.tasks.some(({ taskId, status, evidenceType }) => taskId === activity.activityId && status === 'playable_candidate_pending_teacher_review' && evidenceType.includes('memory_only')));
  }
  assert.ok(newActivities[0].curriculumMapId === 'math-grade3-n-3-6-mult-div-application');
  assert.ok(newActivities[0].relatedCurriculumMapIds.includes('math-grade3-r-3-1-mult-div-inverse'));
  assert.ok(!newActivities[0].curriculumCodes.includes('N-3-3'), 'array task does not claim vertical multiplication coverage');
  assert.equal(newActivities[1].curriculumMapId, 'math-grade3-n-3-10-one-decimal');
  assert.equal(newActivities[2].curriculumMapId, 'math-grade3-s-3-4-geometry-operations');
});

test('年級範圍登錄完整列出各細目狀態，三項新活動只標成候選程式及瀏覽器驗收', () => {
  const validStatuses = new Set([
    'not_built',
    'requires_decomposition',
    'candidate_activity_exists_not_retested_this_round',
    'candidate_activity_program_and_browser_verified',
  ]);
  assert.ok(grade3Scope.items.filter(({ subject }) => subject === 'mathematics').every(({ activityCoverage }) => validStatuses.has(activityCoverage?.status)));
  const expected = [
    ['scope-m3-math-multiplication-division-application', newActivities[0].activityId],
    ['scope-m3-math-decimals-tenths', newActivities[1].activityId],
    ['scope-m3-math-geometry-compose-decompose', newActivities[2].activityId],
    ['scope-m3-math-multiplication-division-inverse', newActivities[0].activityId],
  ];
  for (const [scopeItemId, activityId] of expected) {
    const item = grade3Scope.items.find(({ scopeItemId: id }) => id === scopeItemId);
    assert.ok(item);
    assert.equal(item.activityCoverage.status, 'candidate_activity_program_and_browser_verified');
    assert.ok(item.activityCoverage.activityRefs.some(({ id, alignment }) => id === activityId && alignment === 'partial_candidate'));
  }
});

test('乘法陣列任務獨立核算、錯誤重試、未知組數與重玩都留在記憶體', () => {
  const activity = newActivities[0];
  assert.equal(3 * 4, 12);
  assert.equal(24 / 4, 6);
  let session = start(activity, 'array-task-test');
  assert.equal(session.phase, 'active');
  session = setArray(session, activity, 2, 4);
  let result = submit(session, activity, 'array-wrong-1');
  assert.equal(result.session.phase, 'feedback');
  assert.equal(result.attempt.result, 'incorrect');
  session = dispatchLearningTask(result.session, activity, 'retry').session;
  session = setArray(session, activity, 3, 4);
  result = submit(session, activity, 'array-right-1');
  assert.equal(result.session.phase, 'success');
  session = dispatchLearningTask(result.session, activity, 'next').session;
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: 'array-equation-3x4' }).session;
  result = submit(session, activity, 'array-right-2');
  assert.equal(result.session.phase, 'success');
  session = result.session;
  session = dispatchLearningTask(session, activity, 'next').session;
  for (const tokenId of [...activity.stages[2].correctOptionIds].reverse()) session = dispatchLearningTask(session, activity, 'add_phrase_token', { tokenId }).session;
  result = submit(session, activity, 'array-equation-model-wrong');
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /等量分組|組數/u);
  session = dispatchLearningTask(result.session, activity, 'retry').session;
  for (const tokenId of activity.stages[2].correctOptionIds) session = dispatchLearningTask(session, activity, 'add_phrase_token', { tokenId }).session;
  result = submit(session, activity, 'array-equation-model-right');
  assert.equal(result.session.phase, 'success');
  session = dispatchLearningTask(result.session, activity, 'next').session;
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: 'unknown-groups-6' }).session;
  result = submit(session, activity, 'array-right-3');
  assert.equal(result.session.phase, 'success');
  session = result.session;
  session = dispatchLearningTask(session, activity, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 6);
  assert.equal(dispatchLearningTask(session, activity, 'restart').session.attempts.length, 0);
});

test('十分位數線定位校驗刻度與小數位置，錯誤後可重試並完成重玩', () => {
  const activity = newActivities[1];
  assert.equal(0 + (1 - 0) * 4 / 10, 0.4);
  assert.equal(1 + (2 - 1) * 6 / 10, 1.6);
  let session = start(activity, 'decimal-task-test');
  session = dispatchLearningTask(session, activity, 'hint').session;
  session = dispatchLearningTask(session, activity, 'hint').session;
  assert.equal(session.hintLevel, 2);
  let result = dispatchLearningTask(session, activity, 'set_number_line_tick', { tick: 3 });
  assert.equal(result.session.numberLineTick, 3);
  result = submit(result.session, activity, 'decimal-wrong-1');
  assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, activity, 'retry').session;
  assert.equal(session.numberLineTick, null);
  session = dispatchLearningTask(session, activity, 'set_number_line_tick', { tick: 4 }).session;
  result = submit(session, activity, 'decimal-right-1');
  assert.equal(result.session.phase, 'success');
  session = result.session;
  session = dispatchLearningTask(session, activity, 'next').session;
  session = dispatchLearningTask(session, activity, 'set_number_line_tick', { tick: 6 }).session;
  result = submit(session, activity, 'decimal-right-2');
  assert.equal(result.session.phase, 'success');
  session = result.session;
  session = dispatchLearningTask(session, activity, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, activity, 'restart').session.phase, 'intro');
});

test('幾何方格拼組按圖形片操作，拒絕非答案組合並支援重試及重玩', () => {
  const activity = newActivities[2];
  for (const stage of activity.stages) {
    assert.equal(stage.shapeRules.correctPieceIds.length, stage.shapeRules.rows * stage.shapeRules.columns);
    assert.ok(stage.shapeRules.correctPieceIds.every((id) => stage.pieces.find(({ id: pieceId }) => pieceId === id)?.shape === 'square'));
    assert.ok(stage.pieces.some(({ shape }) => shape === 'triangle'));
  }
  let session = start(activity, 'geometry-task-test');
  const first = activity.stages[0];
  session = selectPieces(session, activity, [...first.shapeRules.correctPieceIds.slice(0, 5), first.pieces.find(({ shape }) => shape === 'triangle').id]);
  let result = submit(session, activity, 'geometry-wrong-1');
  assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, activity, 'retry').session;
  session = selectPieces(session, activity, first.shapeRules.correctPieceIds);
  result = submit(session, activity, 'geometry-right-1');
  assert.equal(result.session.phase, 'success');
  session = result.session;
  session = dispatchLearningTask(session, activity, 'next').session;
  session = selectPieces(session, activity, activity.stages[1].shapeRules.correctPieceIds);
  result = submit(session, activity, 'geometry-right-2');
  assert.equal(result.session.phase, 'success');
  session = result.session;
  session = dispatchLearningTask(session, activity, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, activity, 'restart').session.attempts.length, 0);
});

test('新互動可記錄提示作答、提交防重，並不連接正式進度', () => {
  for (const [activityIndex, stage] of newActivities.entries()) {
    assert.ok(stage.stages.every(({ hints, incorrectFeedback, correctFeedback }) => hints.length >= 2 && incorrectFeedback && correctFeedback));
    const activity = newActivities[activityIndex];
    let session = start(activity, `hint-event-${activityIndex}`);
    if (stage.stages[0].interaction === 'build_array') session = setArray(session, activity, 1, 1);
    else if (stage.stages[0].interaction === 'place_number_line_marker') session = dispatchLearningTask(session, activity, 'set_number_line_tick', { tick: 3 }).session;
    else session = selectPieces(session, activity, [...activity.stages[0].shapeRules.correctPieceIds.slice(0, 5), activity.stages[0].pieces.find(({ shape }) => shape === 'triangle').id]);
    session = dispatchLearningTask(session, activity, 'hint').session;
    const submissionId = `duplicate-id-${activityIndex}`;
    const first = submit(session, activity, submissionId);
    assert.equal(first.session.attempts[0].hintUsed, true);
    session = dispatchLearningTask(first.session, activity, 'retry').session;
    if (stage.stages[0].interaction === 'build_array') session = setArray(session, activity, 3, 4);
    else if (stage.stages[0].interaction === 'place_number_line_marker') session = dispatchLearningTask(session, activity, 'set_number_line_tick', { tick: 4 }).session;
    else session = selectPieces(session, activity, activity.stages[0].shapeRules.correctPieceIds);
    const duplicate = submit(session, activity, submissionId);
    assert.equal(duplicate.error, 'duplicate_submission');
    assert.equal(first.session.attempts.length, 1);
    assert.equal(JSON.stringify(first.session).includes('localStorage'), false);
  }
});
