import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { GRADE4_CANDIDATE_TASKS } from '../prototype/data/grade4CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

function answer(session, task, stage, correct) {
  let state = session;
  if (stage.interaction === 'choose_response') {
    const option = stage.options.find(({ id }) => correct ? stage.correctOptionIds.includes(id) : !stage.correctOptionIds.includes(id));
    state = dispatchLearningTask(state, task, 'select_option', { optionId: option.id }).session;
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const optionId of ids) state = dispatchLearningTask(state, task, 'toggle_evidence', { optionId }).session;
  } else if (stage.interaction === 'classify_observations') {
    for (const observation of stage.observations) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = correct ? expected : stage.categories.find(({ id }) => id !== expected).id;
      state = dispatchLearningTask(state, task, 'assign_category', { observationId: observation.id, categoryId }).session;
    }
  } else if (stage.interaction === 'order_items') {
    const ids = correct ? stage.correctItemIds : [...stage.correctItemIds].reverse();
    for (let targetIndex = 0; targetIndex < ids.length; targetIndex += 1) {
      const fromIndex = state.orderedItems.indexOf(ids[targetIndex]);
      if (fromIndex !== targetIndex) state = dispatchLearningTask(state, task, 'move_ordered_item', { itemId: ids[targetIndex], toIndex: targetIndex }).session;
    }
  } else if (stage.interaction === 'place_number_line_marker') {
    const tick = stage.numberLine.targetTick + Number(!correct);
    state = dispatchLearningTask(state, task, 'set_number_line_tick', { tick }).session;
  } else if (stage.interaction === 'compose_shape') {
    const count = stage.shapeRules.selectionCount ?? stage.shapeRules.rows * stage.shapeRules.columns;
    let ids = stage.shapeRules.correctPieceIds;
    if (!correct) {
      ids = stage.pieces.map(({ id }) => id).filter((id) => !stage.shapeRules.correctPieceIds.includes(id)).slice(0, count);
      if (ids.length < count) ids = [...stage.shapeRules.correctPieceIds.slice(0, count - 1), stage.pieces.find(({ id }) => !stage.shapeRules.correctPieceIds.includes(id))?.id].filter(Boolean);
    }
    for (const pieceId of ids) state = dispatchLearningTask(state, task, 'toggle_shape_piece', { pieceId }).session;
  } else if (stage.interaction === 'build_array') {
    const rows = correct ? stage.arrayRules.targetRows : stage.arrayRules.targetRows;
    const columns = correct ? stage.arrayRules.targetColumns : stage.arrayRules.targetColumns - 1;
    for (let index = 0; index < rows; index += 1) state = dispatchLearningTask(state, task, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
    for (let index = 0; index < columns; index += 1) state = dispatchLearningTask(state, task, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
  } else if (stage.interaction === 'assemble_response') {
    const tokenIds = correct ? stage.correctOptionIds : [stage.tokens.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const tokenId of tokenIds) state = dispatchLearningTask(state, task, 'add_phrase_token', { tokenId }).session;
  } else assert.fail(`Unsupported interaction ${stage.interaction}`);
  return state;
}

test('四年級七項候選活動已連入科目目錄及課程目標，均保持待審與記憶體隔離', async () => {
  assert.equal(GRADE4_CANDIDATE_TASKS.length, 7);
  assert.equal(new Set(GRADE4_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, 7);
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  assert.deepEqual(GRADE4_CANDIDATE_TASKS.map(({ subjectId }) => subjectId).sort(), ['chinese-language','chinese-language','mathematics','mathematics','mathematics','natural-science','natural-science']);
  const map = await readJson('../curriculum/curriculum-map.json');
  const sources = await readJson('../curriculum/sources.json');
  const grade4 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  for (const task of GRADE4_CANDIDATE_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.evidencePolicy.hintAssistedResponseIsIndependentEvidence, false);
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    assert.ok(task.stages.every(({ hints }) => hints.length === 2));
    assert.ok(task.stages.every(({ incorrectFeedback, correctFeedback }) => incorrectFeedback && correctFeedback));
    const entry = [...map.verifiedLearningFocuses, ...(map.supplementalVerifiedLearningFocuses ?? []), ...map.pendingLearningFocuses]
      .find(({ id }) => id === task.curriculumMapId);
    assert.ok(entry, task.curriculumMapId);
    assert.match(entry.officialTextReviewStatus, /^verified_against_official_/);
    assert.equal(entry.sourceUrl, sources.sources.find(({ id }) => id === task.sourceId).url);
    assert.ok(task.curriculumCodes.every((code) => [...entry.contentCodes, ...entry.performanceCodes].includes(code)));
    const relation = LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-4' && subjectId === task.subjectId);
    assert.ok(relation?.tasks.some(({ taskId, curriculumMapId }) => taskId === task.activityId && curriculumMapId === task.curriculumMapId));
    assert.ok(grade4.subjects.find(({ subjectId }) => subjectId === task.subjectId).existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
    assert.ok(getCatalogCandidateTasksForSubject('grade-4', task.subjectId).some(({ activityId }) => activityId === task.activityId));
  }
});

test('數學候選活動的分數表示與逐步乘除中間結果可獨立核算', () => {
  const fraction = GRADE4_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-FRACTION-TILES-CANDIDATE');
  const shade = fraction.stages[0];
  assert.equal(shade.pieces.length, 6);
  assert.equal(shade.shapeRules.rows * shade.shapeRules.columns, shade.shapeRules.correctPieceIds.length);
  assert.equal(shade.shapeRules.correctPieceIds.length, 3);
  assert.equal(shade.shapeRules.correctPieceIds.length / shade.pieces.length, 3 / 6);
  const twoStep = GRADE4_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE');
  assert.equal(6 * 4, twoStep.stages[0].resultValue);
  assert.deepEqual(twoStep.stages[1].correctOptionIds.map((id) => twoStep.stages[1].tokens.find((token) => token.id === id).text), ['6', '×', '4']);
  assert.equal(twoStep.stages[2].options.find(({ id }) => twoStep.stages[2].correctOptionIds.includes(id)).value, 6 * 4 / 3);
  assert.equal(twoStep.curriculumCodes.includes('r-II-3'), false);
});

test('六項活動皆可由共用引擎提示、錯答、重試、答對、完成與重玩，沒有寫入儲存', () => {
  const originalStorage = JSON.stringify(Object.keys(globalThis).filter((key) => /localStorage|sessionStorage/i.test(key)));
  for (const task of GRADE4_CANDIDATE_TASKS) {
    let session = dispatchLearningTask(createLearningTaskSession(task, `test-${task.activityId}`), task, 'start').session;
    for (const stage of task.stages) {
      session = dispatchLearningTask(session, task, 'hint').session;
      session = dispatchLearningTask(session, task, 'hint').session;
      session = answer(session, task, stage, false);
      const wrong = dispatchLearningTask(session, task, 'submit', { submissionId: `${task.activityId}:${stage.stageId}:wrong` });
      assert.equal(wrong.session.phase, 'feedback', task.activityId);
      assert.equal(wrong.session.attempts.at(-1).result, 'incorrect');
      session = dispatchLearningTask(wrong.session, task, 'retry').session;
      session = answer(session, task, stage, true);
      const ok = dispatchLearningTask(session, task, 'submit', { submissionId: `${task.activityId}:${stage.stageId}:right` });
      assert.equal(ok.session.phase, 'success', task.activityId);
      assert.equal(ok.session.attempts.at(-1).result, 'correct');
      session = dispatchLearningTask(ok.session, task, 'next').session;
    }
    assert.equal(session.phase, 'completed', task.activityId);
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(session.status, 'candidate_pending_teacher_review');
    session = dispatchLearningTask(session, task, 'restart').session;
    assert.equal(session.phase, 'intro');
    assert.equal(session.attempts.length, 0);
  }
  assert.equal(JSON.stringify(Object.keys(globalThis).filter((key) => /localStorage|sessionStorage/i.test(key))), originalStorage);
});

