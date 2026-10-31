import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE5_CANDIDATE_TASKS } from '../prototype/data/grade5CandidateTasks.js';
import { GRADE6_CANDIDATE_TASKS } from '../prototype/data/grade6CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const tasks = [
  ...GRADE5_CANDIDATE_TASKS.filter(({ activityId }) => activityId === 'ACT-G5-MATH-FRACTION-EQUIVALENCE-PIECES-CANDIDATE'
    || activityId === 'ACT-G5-SOCIAL-PERSPECTIVE-EVIDENCE-CANDIDATE'
    || activityId === 'ACT-G5-SCIENCE-FAIR-TEST-PLANNER-CANDIDATE'),
  ...GRADE6_CANDIDATE_TASKS.filter(({ activityId }) => activityId === 'ACT-G6-MATH-DATA-LIKELIHOOD-READER-CANDIDATE'),
];
const curriculum = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const definitions = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8')).definitions;
const sources = JSON.parse(fs.readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8')).sources;
const mapEntries = [...curriculum.verifiedLearningFocuses, ...curriculum.supplementalVerifiedLearningFocuses, ...curriculum.pendingLearningFocuses];

function action(session, task, name, payload = {}) {
  const result = dispatchLearningTask(session, task, name, payload);
  assert.equal(result.changed, true, `${task.activityId}/${task.stages[session.stageIndex]?.stageId}/${name} ${JSON.stringify(payload)} (phase=${session.phase}, stage=${session.stageIndex}): ${result.error ?? 'unchanged'}`);
  return result.session;
}

function submit(session, task, label) {
  const result = dispatchLearningTask(session, task, 'submit', { submissionId: `${task.activityId}-${task.stages[session.stageIndex].stageId}-${label}` });
  assert.equal(result.changed, true, `${task.activityId}/${task.stages[session.stageIndex].stageId}/submit: ${result.error ?? 'unchanged'}`);
  return result.session;
}

function fill(session, task, stage, correct) {
  if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
    for (const { id } of stage.observations) {
      const expected = stage.correctAssignments[id];
      const categoryId = correct ? expected : stage.categories.find(({ id: category }) => category !== expected).id;
      session = action(session, task, 'assign_category', { observationId: id, categoryId });
    }
  } else if (stage.interaction === 'compose_shape') {
    const ids = correct ? stage.shapeRules.correctPieceIds : stage.pieces.filter(({ id }) => !stage.shapeRules.correctPieceIds.includes(id)).slice(0, stage.shapeRules.selectionCount).map(({ id }) => id);
    for (const pieceId of ids) session = action(session, task, 'toggle_shape_piece', { pieceId });
  } else if (stage.interaction === 'order_items') {
    const wanted = correct ? stage.correctItemIds : [...stage.initialOrder];
    if (correct && JSON.stringify(session.orderedItems) !== JSON.stringify(wanted)) {
      for (let index = 0; index < wanted.length; index += 1) {
        const fromIndex = session.orderedItems.indexOf(wanted[index]);
        if (fromIndex !== index) session = action(session, task, 'move_ordered_item', { itemId: wanted[index], toIndex: index });
      }
    } else if (!correct && JSON.stringify(wanted) === JSON.stringify(stage.correctItemIds)) {
      session = action(session, task, 'move_ordered_item', { itemId: wanted[0], toIndex: 1 });
    }
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const optionId of ids) session = action(session, task, 'toggle_evidence', { optionId });
  } else if (stage.interaction === 'choose_response') {
    const optionId = correct ? stage.correctOptionIds[0] : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = action(session, task, 'select_option', { optionId });
  } else {
    assert.fail(`Test helper does not support ${stage.interaction}`);
  }
  return session;
}

test('four upper-grade candidate tasks are unique, mapped to verified sources, and present in grade/subject directories', () => {
  assert.equal(tasks.length, 4);
  assert.equal(new Set(tasks.map(({ activityId }) => activityId)).size, 4);
  const subitemIds = new Set(definitions.map(({ subitemId }) => subitemId));
  for (const task of tasks) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
    assert.ok(mapEntries.some(({ id }) => id === task.curriculumMapId), `${task.activityId} map entry`);
    assert.ok(CATALOG_CANDIDATE_TASKS.some(({ activityId }) => activityId === task.activityId));
    assert.ok(getCatalogCandidateTasksForSubject(task.gradeId, task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId);
    const directorySubject = grade.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(directorySubject.existingYearLevelContent.some(({ activityId, curriculumMapId }) => activityId === task.activityId && curriculumMapId === task.curriculumMapId));
    const subitemId = task.coverage?.subitemId;
    assert.ok(subitemIds.has(subitemId), `${task.activityId} subitem definition`);
    const subitem = definitions.find(({ subitemId: id }) => id === subitemId);
    assert.deepEqual(subitem.activityIds, [task.activityId]);
    assert.deepEqual(subitem.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
    assert.equal(subitem.status, 'candidate_partial_interaction');
    assert.ok(task.learningSubitemClaims.includes(subitemId), `${task.activityId} explicitly claims its mapped subitem`);
    const source = sources.find(({ id }) => id === task.sourceId);
    assert.ok(source, `${task.activityId} source record`);
    for (const code of task.curriculumCodes) {
      assert.ok(source.verifiedClauses.includes(code), `${task.activityId} official source verified clause ${code}`);
    }
    assert.ok(subitem.sourceRef && subitem.sourceText, `${task.activityId} traceable official clause reference`);
  }
});

test('four upper-grade candidates run incorrect feedback, two hints, retry, correct completion, and restart in memory', () => {
  for (const task of tasks) {
    let session = createLearningTaskSession(task, `upper-grade-test-${task.activityId}`);
    session = action(session, task, 'start');
    for (const stage of task.stages) {
      session = action(session, task, 'hint');
      session = action(session, task, 'hint');
      session = fill(session, task, stage, false);
      session = submit(session, task, 'incorrect');
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId} incorrect response`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.ok(session.lastFeedback?.text);
      session = action(session, task, 'retry');
      session = fill(session, task, stage, true);
      session = submit(session, task, 'correct');
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId} correct response`);
      assert.equal(session.attempts.at(-1).result, 'correct');
      session = action(session, task, 'next');
    }
    assert.equal(session.phase, 'completed', task.activityId);
    assert.equal(session.attempts.length, task.stages.length * 2);
    const restarted = dispatchLearningTask(session, task, 'restart', { sessionId: `restart-${task.activityId}` }).session;
    assert.equal(restarted.phase, 'intro');
    assert.equal(restarted.attempts.length, 0);
  }
});

test('independent arithmetic checks support the fraction and likelihood task data', () => {
  assert.equal(1 / 4 + 1 / 4, 1 / 2);
  assert.equal(1 / 2, 3 / 6);
  assert.equal(2 / 3, 4 / 6);
  assert.ok(2 / 3 > 1 / 2);
  const likelihood = tasks.find(({ activityId }) => activityId.includes('DATA-LIKELIHOOD'));
  const observations = likelihood.stages[0].observations;
  assert.deepEqual(observations.map(({ id }) => likelihood.stages[0].correctAssignments[id]), ['green-more', 'yellow-more', 'same-count']);
});
