import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE5_CANDIDATE_TASKS } from '../prototype/data/grade5CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const focusById = new Map([
  ...curriculum.verifiedLearningFocuses,
  ...curriculum.supplementalVerifiedLearningFocuses,
  ...curriculum.pendingLearningFocuses,
].map((focus) => [focus.id, focus]));

function perform(session, task, stage, correct) {
  const wrongCalculationValues = Object.fromEntries(stage.calculationSteps?.map(({ id, choices, expectedValue }) => [id, choices.find(({ value }) => value !== expectedValue).value]) ?? []);
  if (stage.interaction === 'build_array') {
    const targetRows = stage.arrayRules.targetRows;
    const targetColumns = correct ? stage.arrayRules.targetColumns : stage.arrayRules.targetColumns - 1;
    for (const [dimension, target, key] of [['rows', targetRows, 'arrayRows'], ['columns', targetColumns, 'arrayColumns']]) {
      while (session[key] < target) session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension, delta: 1 }).session;
      while (session[key] > target) session = dispatchLearningTask(session, task, 'adjust_array_dimension', { dimension, delta: -1 }).session;
    }
  } else if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
    for (const observation of stage.observations) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = correct ? expected : stage.categories.find(({ id }) => id !== expected).id;
      session = dispatchLearningTask(session, task, 'assign_category', { observationId: observation.id, categoryId }).session;
    }
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: correct ? step.expectedValue : wrongCalculationValues[step.id] }).session;
  } else if (stage.interaction === 'compose_shape') {
    const expected = [...stage.shapeRules.correctPieceIds];
    const selected = correct ? expected : [...expected.slice(1), stage.pieces.find(({ id }) => !expected.includes(id)).id];
    for (const pieceId of selected) session = dispatchLearningTask(session, task, 'toggle_shape_piece', { pieceId }).session;
  } else if (stage.interaction === 'order_items') {
    const ids = correct ? [...stage.correctItemIds] : [...stage.correctItemIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (let targetIndex = 0; targetIndex < ids.length; targetIndex += 1) {
      const fromIndex = session.orderedItems.indexOf(ids[targetIndex]);
      if (fromIndex !== targetIndex) session = dispatchLearningTask(session, task, 'move_ordered_item', { itemId: ids[targetIndex], toIndex: targetIndex }).session;
    }
  } else if (stage.interaction === 'assemble_response') {
    const ids = [...stage.correctOptionIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (const tokenId of ids) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const optionId of ids) session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId }).session;
  } else if (stage.interaction === 'choose_response') {
    const optionId = correct ? stage.correctOptionIds[0] : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = dispatchLearningTask(session, task, 'select_option', { optionId }).session;
  } else assert.fail(`unhandled interaction ${stage.interaction}`);
  return session;
}

function submit(session, task, stage, correct, suffix) {
  session = perform(session, task, stage, correct);
  return dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:${suffix}` }).session;
}

test('十項五年級候選活動有唯一資料、官方對照與正確目錄／學習目標關聯', () => {
  assert.equal(GRADE5_CANDIDATE_TASKS.length, 10);
  assert.deepEqual(Object.fromEntries(['mathematics', 'chinese-language', 'natural-science', 'english-language'].map((subjectId) => [subjectId, GRADE5_CANDIDATE_TASKS.filter((task) => task.subjectId === subjectId).length])), {
    mathematics: 4, 'chinese-language': 2, 'natural-science': 2, 'english-language': 1,
  });
  assert.equal(GRADE5_CANDIDATE_TASKS.filter((task) => task.subjectId === 'social-studies').length, 1);
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const grade5 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-5');
  assert.equal(grade5.developmentStatus, 'in_development_partial');
  assert.equal(grade5.curriculumApplicabilityStatus, 'partial_official_scope_recorded_local_schedule_pending');

  for (const task of GRADE5_CANDIDATE_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    const focus = focusById.get(task.curriculumMapId);
    assert.ok(focus, `${task.activityId} has a curriculum map record`);
    assert.equal(focus.sourceId, task.sourceId);
    assert.ok(['verified_against_official_text', 'verified_against_official_text_this_run', 'verified_against_official_pdf_this_run'].includes(focus.officialTextReviewStatus));
    assert.ok(task.curriculumCodes.every((code) => [...focus.contentCodes, ...focus.performanceCodes].includes(code)), task.activityId);
    const subject = grade5.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(subject.existingYearLevelContent.some((entry) => entry.activityId === task.activityId && entry.status === 'candidate_pending_teacher_review' && entry.entryRoute.targetScreen === 'catalog-task'));
    assert.ok(getCatalogCandidateTasksForSubject('grade-5', task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const relation = getLearningTaskRelation('grade-5', task.subjectId);
    assert.ok(relation?.curriculumMapIds.includes(task.curriculumMapId));
    assert.ok(relation?.learningObjectiveTaskLinks.some(({ learningObjectiveId, taskIds }) => learningObjectiveId === task.learningObjective.objectiveId && taskIds.includes(task.activityId)));
    assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
  }
});

test('十項五年級活動逐階段可提示、錯答、重試、正答、完成與重玩且紀錄留在記憶體', () => {
  for (const task of GRADE5_CANDIDATE_TASKS) {
    let session = createLearningTaskSession(task, `grade5-flow-${task.activityId}`);
    session = dispatchLearningTask(session, task, 'start').session;
    for (const [index, stage] of task.stages.entries()) {
      if (index) session = dispatchLearningTask(session, task, 'next').session;
      for (let layer = 0; layer < 2; layer += 1) {
        const hinted = dispatchLearningTask(session, task, 'hint');
        assert.equal(hinted.changed, true, `${task.activityId}/${stage.stageId}/hint-${layer + 1}`);
        assert.ok(hinted.hint);
        session = hinted.session;
      }
      session = submit(session, task, stage, false, 'wrong');
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId} wrong`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.equal(session.attempts.at(-1).hintUsed, true);
      assert.ok(session.lastFeedback.text);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = submit(session, task, stage, true, 'right');
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId} correct`);
      assert.equal(session.attempts.at(-1).result, 'correct');
      assert.equal(session.attempts.at(-1).attemptNumber, 2);
      assert.equal(new Set(session.attempts.map(({ eventId }) => eventId)).size, session.attempts.length);
    }
    session = dispatchLearningTask(session, task, 'next').session;
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
    assert.equal(dispatchLearningTask(session, task, 'restart').session.attempts.length, 0);
  }
});

test('多步補給算式可獨立核算，科目覆蓋不冒稱完整且正式狀態保護不變', () => {
  const supply = GRADE5_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G5-MATH-MULTI-STEP-SUPPLY-PLANNER-CANDIDATE').stages[0].calculationSteps;
  assert.deepEqual(supply.map(({ expectedValue }) => expectedValue), [18 * 4, 12 * 3, (18 * 4) + (12 * 3), ((18 * 4) + (12 * 3)) - 20]);
  for (const task of GRADE5_CANDIDATE_TASKS) {
    assert.match(task.curriculumScope, /部分(?:對應|參照)/);
    assert.ok(task.openQuestions.length > 0);
  }
  const registry = JSON.parse(fs.readFileSync(new URL('../curriculum/unit-registry.json', import.meta.url), 'utf8'));
  const learningMap = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
  assert.equal(registry.units.find(({ unitId }) => unitId === 'M3-NUM-01')?.status, 'candidate');
  assert.equal(learningMap.designBoundary.stage0Status, 'not_passed');
});
