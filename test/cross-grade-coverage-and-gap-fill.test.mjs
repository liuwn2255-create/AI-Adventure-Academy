import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CROSS_GRADE_GAP_FILL_TASKS } from '../prototype/data/crossGradeGapFillTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS, getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildCoverageInventory } from '../scripts/curriculum-coverage.mjs';

const curriculum = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const focusRows = [...curriculum.verifiedLearningFocuses, ...curriculum.supplementalVerifiedLearningFocuses, ...curriculum.pendingLearningFocuses];
const focusById = new Map(focusRows.map((focus) => [focus.id, focus]));

function dispatch(session, task, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${task.activityId}/${session.stageId ?? 'no-stage'}/${action}: ${result.error ?? 'unchanged'}`);
  assert.ok(result.session, `${task.activityId}/${action} must return its updated session`);
  return result.session;
}

function answerStage(session, task, stage, correct, suffix) {
  if (stage.interaction === 'choose_response') {
    const id = correct ? stage.correctOptionIds[0] : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = dispatch(session, task, 'select_option', { optionId: id });
  } else if (stage.interaction === 'assemble_response') {
    let ids = [...stage.correctOptionIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (const tokenId of ids) session = dispatch(session, task, 'add_phrase_token', { tokenId });
  } else if (stage.interaction === 'classify_observations') {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = !correct && index === 0 ? stage.categories.find(({ id }) => id !== expected).id : expected;
      session = dispatch(session, task, 'assign_category', { observationId: observation.id, categoryId });
    }
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.correctOptionIds[0], stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const optionId of ids) session = dispatch(session, task, 'toggle_evidence', { optionId });
  } else if (stage.interaction === 'compose_shape') {
    const ids = correct ? stage.shapeRules.correctPieceIds : [...stage.shapeRules.correctPieceIds.slice(0, -1), stage.pieces.find(({ id }) => !stage.shapeRules.correctPieceIds.includes(id)).id];
    for (const pieceId of ids) session = dispatch(session, task, 'toggle_shape_piece', { pieceId });
  } else if (stage.interaction === 'order_items') {
    const ids = [...stage.correctItemIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (let index = 0; index < ids.length; index += 1) {
      const fromIndex = session.orderedItems.indexOf(ids[index]);
      if (fromIndex !== index) session = dispatch(session, task, 'move_ordered_item', { itemId: ids[index], toIndex: index });
    }
  } else assert.fail(`Unsupported flow test interaction ${stage.interaction}`);
  const submitted = dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:${suffix}` });
  assert.equal(submitted.changed, true, `${task.activityId}/${stage.stageId}/${suffix}/submit: ${submitted.error ?? 'unchanged'}; input=${JSON.stringify(session)}`);
  assert.ok(submitted.session, `${task.activityId}/${stage.stageId}/${suffix}/submit must return a session`);
  return submitted.session;
}

test('six gap-fill tasks have unique IDs, real directory routes, verified clause references, and candidate boundaries', () => {
  assert.equal(CROSS_GRADE_GAP_FILL_TASKS.length, 6);
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const allIds = [...focusById.keys()];
  assert.equal(new Set(allIds).size, allIds.length);
  const sources = JSON.parse(fs.readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8'));
  const sourceById = new Map(sources.sources.map((source) => [source.id, source]));
  for (const task of CROSS_GRADE_GAP_FILL_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
    assert.ok(new Set(task.stages.map(({ interaction }) => interaction)).size >= 2);
    for (const stage of task.stages.filter(({ interaction }) => interaction === 'compose_shape')) {
      assert.ok(stage.pieces.every(({ label, shape }) => label && ['square', 'triangle'].includes(shape)), `${task.activityId}/${stage.stageId} must provide renderable, labeled pieces`);
    }
    assert.ok(focusById.has(task.curriculumMapId), task.curriculumMapId);
    const focus = focusById.get(task.curriculumMapId);
    const source = sourceById.get(task.sourceId);
    assert.equal(focus.officialTextReviewStatus, 'verified_against_official_text');
    assert.ok(task.curriculumCodes.every((code) => [...focus.contentCodes, ...focus.performanceCodes].includes(code)));
    assert.ok(task.curriculumCodes.every((code) => source.verifiedClauses.includes(code)));
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId);
    const subject = grade.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(subject.existingYearLevelContent.some((entry) => entry.activityId === task.activityId && entry.entryRoute?.targetScreen === 'catalog-task'), task.activityId);
    assert.ok(getCatalogCandidateTasksForSubject(task.gradeId, task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const relation = getLearningTaskRelation(task.gradeId, task.subjectId);
    assert.ok(relation.curriculumMapIds.includes(task.curriculumMapId));
    assert.ok(relation.learningObjectiveTaskLinks.some(({ learningObjectiveId, taskIds }) => learningObjectiveId === task.learningObjective.objectiveId && taskIds.includes(task.activityId)));
  }
  assert.ok(CATALOG_CANDIDATE_TASKS.every((task) => GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId)?.subjects.find(({ subjectId }) => subjectId === task.subjectId)?.existingYearLevelContent.some(({ activityId }) => activityId === task.activityId)));
  for (const relation of LEARNING_TASK_RELATIONS) for (const task of relation.tasks ?? []) {
    if (task.runtimeModule?.includes('crossGradeGapFillTasks')) assert.equal(task.evidenceType, 'candidate_practice_response_only_memory_only');
  }
});

test('six gap-fill tasks support hints, valid incorrect retry, correct completion, replay, and memory-only evidence', () => {
  for (const task of CROSS_GRADE_GAP_FILL_TASKS) {
    let session = dispatchLearningTask(createLearningTaskSession(task, `cross-gap-${task.activityId}`), task, 'start').session;
    for (const [index, stage] of task.stages.entries()) {
      if (index) session = dispatch(session, task, 'next');
      for (let layer = 0; layer < 2; layer += 1) {
        const result = dispatchLearningTask(session, task, 'hint');
        assert.equal(result.changed, true, `${task.activityId}/${stage.stageId}/hint-${layer + 1}`);
        assert.ok(result.hint);
        session = result.session;
      }
      session = answerStage(session, task, stage, false, 'wrong');
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId}/wrong`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.ok(session.lastFeedback.text);
      session = dispatch(session, task, 'retry');
      session = answerStage(session, task, stage, true, 'correct');
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId}/correct`);
      assert.equal(session.attempts.at(-1).attemptNumber, 2);
    }
    session = dispatch(session, task, 'next');
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(dispatch(session, task, 'restart').phase, 'intro');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  }
});

test('coverage inventory counts only registered focus records and distinguishes 66 directory slots from curriculum details', () => {
  const inventory = buildCoverageInventory();
  assert.equal(inventory.denominator.count, focusRows.length);
  assert.equal(inventory.denominator.directoryGradeSubjectSlots, 66);
  assert.equal(inventory.registeredCurriculumFocuses.length, focusRows.length);
  assert.equal(Object.values(inventory.statusCounts).reduce((sum, value) => sum + value, 0), focusRows.length);
  assert.equal(inventory.statusCounts['已對應'], 0, 'no focus currently claims complete coverage');
  assert.equal(inventory.completeness, 'partial_project_registry_not_complete_official_curriculum');
  const gradeThreeMath = inventory.gradeSubjectDirectory.find(({ gradeId, subjectId }) => gradeId === 'grade-3' && subjectId === 'mathematics');
  assert.ok(gradeThreeMath, 'grade 3 mathematics directory row exists');
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-NUM-PLACE-VALUE-LEARNING-UNIT-PROTOTYPE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-CAPACITY-SCALE-READING-CANDIDATE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-INTEGER-NUMBER-LINE-CANDIDATE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-ADD-SUB-VERTICAL-CANDIDATE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-FRACTION-TREASURE-SAME-DENOMINATOR-CANDIDATE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-MILLIMETER-RULER-CANDIDATE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-AREA-SQUARE-CENTIMETER-CANDIDATE'));
  assert.ok(gradeThreeMath.interactiveActivityIds.includes('ACT-M3-WEIGHT-KG-G-CANDIDATE'));
  assert.equal(gradeThreeMath.directoryActivityDetails.filter(({ executableLearningDataPresent }) => executableLearningDataPresent).length >= 8, true);
  assert.equal(gradeThreeMath.directoryEntryStatus, '已建立科目入口');
  assert.ok(gradeThreeMath.runtimeProgramModuleIds.length > 0, 'activity modules are counted separately from the subject directory entry');
  for (const task of CROSS_GRADE_GAP_FILL_TASKS) {
    const focus = inventory.registeredCurriculumFocuses.find(({ focusId }) => focusId === task.curriculumMapId);
    assert.ok(focus?.linkedActivityIds.includes(task.activityId));
    assert.equal(focus.coverageStatus, '部分對應');
  }
});
