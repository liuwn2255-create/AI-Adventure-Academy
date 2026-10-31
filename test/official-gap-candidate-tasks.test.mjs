import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { OFFICIAL_GAP_CANDIDATE_TASKS } from '../prototype/data/officialGapCandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildCoverageInventory } from '../scripts/curriculum-coverage.mjs';

const curriculum = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const focuses = [...curriculum.verifiedLearningFocuses, ...curriculum.supplementalVerifiedLearningFocuses, ...curriculum.pendingLearningFocuses];
const sources = JSON.parse(fs.readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8'));
const sourceById = new Map(sources.sources.map((source) => [source.id, source]));

function action(session, task, name, payload) {
  const result = dispatchLearningTask(session, task, name, payload);
  assert.equal(result.changed, true, `${task.activityId}/${session.stageId ?? session.stageIndex}/${name}: ${result.error ?? 'unchanged'}`);
  return result.session;
}

function answer(session, task, stage, correct) {
  if (stage.interaction === 'place_number_line_marker') {
    session = action(session, task, 'set_number_line_tick', { tick: correct ? stage.numberLine.targetTick : stage.numberLine.targetTick + 1 });
  } else if (stage.interaction === 'choose_response') {
    const id = correct ? stage.correctOptionIds[0] : stage.options.find((option) => !stage.correctOptionIds.includes(option.id)).id;
    session = action(session, task, 'select_option', { optionId: id });
  } else if (stage.interaction === 'collect_evidence') {
    const wrong = stage.options.find((option) => !stage.correctOptionIds.includes(option.id)).id;
    const ids = correct ? stage.correctOptionIds : [...stage.correctOptionIds, wrong];
    for (const optionId of ids) session = action(session, task, 'toggle_evidence', { optionId });
  } else if (stage.interaction === 'order_items') {
    const ids = [...stage.correctItemIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (let index = 0; index < ids.length; index += 1) {
      const from = session.orderedItems.indexOf(ids[index]);
      if (from !== index) session = action(session, task, 'move_ordered_item', { itemId: ids[index], toIndex: index });
    }
  } else if (stage.interaction === 'classify_observations') {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const category = !correct && index === 0 ? stage.categories.find(({ id }) => id !== expected).id : expected;
      session = action(session, task, 'assign_category', { observationId: observation.id, categoryId: category });
    }
  } else if (stage.interaction === 'compose_shape') {
    const ids = [...stage.shapeRules.correctPieceIds];
    if (!correct) ids[ids.length - 1] = stage.pieces.find(({ id }) => !ids.includes(id)).id;
    for (const pieceId of ids) session = action(session, task, 'toggle_shape_piece', { pieceId });
  } else assert.fail(`Unsupported interaction ${stage.interaction}`);
  const submitted = dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:${correct ? 'ok' : 'bad'}` });
  assert.equal(submitted.changed, true, `${task.activityId}/${stage.stageId}/submit: ${submitted.error ?? 'unchanged'}`);
  return submitted.session;
}

test('six gap tasks have unique IDs, official source clauses, grade-subject directory entries, and candidate-only data', () => {
  assert.equal(OFFICIAL_GAP_CANDIDATE_TASKS.length, 6);
  const ids = CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId);
  assert.equal(new Set(ids).size, ids.length);
  for (const task of OFFICIAL_GAP_CANDIDATE_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    const focus = focuses.find(({ id }) => id === task.curriculumMapId);
    assert.ok(focus, `${task.activityId} focus row`);
    assert.equal(focus.officialTextReviewStatus, 'verified_against_official_text');
    assert.ok(task.curriculumCodes.every((code) => [...(focus.contentCodes ?? []), ...(focus.performanceCodes ?? [])].includes(code)));
    assert.ok(task.curriculumCodes.every((code) => sourceById.get(task.sourceId)?.verifiedClauses.includes(code)), `${task.activityId} verified clauses`);
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId);
    assert.ok(grade?.subjects.find(({ subjectId }) => subjectId === task.subjectId)?.existingYearLevelContent.some(({ activityId, entryRoute }) => activityId === task.activityId && entryRoute.targetScreen === 'catalog-task'));
    assert.ok(getCatalogCandidateTasksForSubject(task.gradeId, task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const relation = getLearningTaskRelation(task.gradeId, task.subjectId);
    assert.ok(relation?.learningObjectiveTaskLinks.some(({ learningObjectiveId, taskIds }) => learningObjectiveId === task.learningObjective.objectiveId && taskIds.includes(task.activityId)));
    assert.ok(task.stages.every((stage) => stage.hints.length >= 2 && stage.incorrectFeedback && stage.correctFeedback));
  }
});

test('six gap tasks accept a wrong response, retry, complete correctly, and restart without persisted evidence', () => {
  for (const task of OFFICIAL_GAP_CANDIDATE_TASKS) {
    let session = action(createLearningTaskSession(task, `gap-${task.activityId}`), task, 'start');
    for (let index = 0; index < task.stages.length; index += 1) {
      if (index > 0) session = action(session, task, 'next');
      for (let layer = 0; layer < 2; layer += 1) {
        const result = dispatchLearningTask(session, task, 'hint');
        assert.equal(result.changed, true, `${task.activityId}/${task.stages[index].stageId}/hint-${layer + 1}`);
        session = result.session;
      }
      session = answer(session, task, task.stages[index], false);
      assert.equal(session.phase, 'feedback', `${task.activityId}/${task.stages[index].stageId}/wrong`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.ok(session.lastFeedback.text);
      session = action(session, task, 'retry');
      session = answer(session, task, task.stages[index], true);
      assert.equal(session.phase, 'success');
      assert.equal(session.attempts.at(-1).result, 'correct');
    }
    session = action(session, task, 'next');
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(action(session, task, 'restart').phase, 'intro');
  }
});

test('coverage register explicitly remains incomplete and never infers national coverage from directory slots', () => {
  const inventory = buildCoverageInventory();
  assert.equal(inventory.officialCatalogCompleteness.status, '清冊未完成');
  assert.equal(inventory.denominator.officialElementaryLearningItemCount, null);
  assert.equal(inventory.denominator.unregisteredOfficialLearningItemCount, null);
  assert.equal(inventory.denominator.nationalCoverageRate, null);
  assert.equal(inventory.denominator.directoryGradeSubjectSlots, 66);
  assert.equal(inventory.denominator.count, focuses.length);
  assert.equal(Object.values(inventory.statusCounts).reduce((sum, value) => sum + value, 0), focuses.length);
  for (const task of OFFICIAL_GAP_CANDIDATE_TASKS) {
    const row = inventory.registeredCurriculumFocuses.find(({ focusId }) => focusId === task.curriculumMapId);
    assert.ok(row?.linkedActivityIds.includes(task.activityId));
    assert.notEqual(row.coverageStatus, '已對應', 'a candidate link alone cannot claim full coverage');
  }
});
