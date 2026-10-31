import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EARLY_GRADE_CURRICULUM_GAP_TASKS } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const byId = new Map(EARLY_GRADE_CURRICULUM_GAP_TASKS.map((task) => [task.activityId, task]));

test('early-grade curriculum gap tasks have unique IDs, claims, valid engine data, and correct subject-directory entry', () => {
  assert.equal(EARLY_GRADE_CURRICULUM_GAP_TASKS.length, 5);
  assert.equal(new Set(EARLY_GRADE_CURRICULUM_GAP_TASKS.map((task) => task.activityId)).size, 5);
  const allIds = CATALOG_CANDIDATE_TASKS.map((task) => task.activityId);
  assert.equal(new Set(allIds).size, allIds.length, 'catalog contains no duplicate activity IDs');

  for (const task of EARLY_GRADE_CURRICULUM_GAP_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.ok(task.learningSubitemClaims.length > 0);
    assert.deepEqual(task.evidencePolicy, {
      persistence: 'memory_only_no_student_records_no_localStorage',
      completionIsMastery: false,
      hintAssistedResponseIsIndependentEvidence: false,
    });
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId);
    const subject = grade?.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(subject, `${task.activityId} subject exists in grade catalog`);
    assert.ok(subject.existingYearLevelContent.some(({ activityId, status, entryRoute }) =>
      activityId === task.activityId && status === task.status && entryRoute?.targetScreen === 'catalog-task'),
    `${task.activityId} is reachable from its grade/subject directory`);
    assert.ok(LEARNING_TASK_RELATIONS.some((relation) => relation.gradeId === task.gradeId
      && relation.subjectId === task.subjectId
      && relation.tasks?.some(({ taskId }) => taskId === task.activityId)),
    `${task.activityId} has an explicit learning-map relation`);
  }
});

test('each task supports hints, a valid wrong response with feedback, retry, correct completion, and replay', () => {
  for (const task of EARLY_GRADE_CURRICULUM_GAP_TASKS) {
    let session = createLearningTaskSession(task, `${task.activityId}-test`);
    session = dispatchLearningTask(session, task, 'start').session;
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true, task.activityId);
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true, task.activityId);

    const fillWrong = (source, stage, { wrong = false } = {}) => {
      let state = source;
      if (stage.interaction === 'compose_shape') {
        const ids = wrong
          ? [...stage.shapeRules.correctPieceIds.slice(0, -1), stage.pieces.find(({ id }) => !stage.shapeRules.correctPieceIds.includes(id)).id]
          : stage.shapeRules.correctPieceIds;
        for (const pieceId of ids) state = dispatchLearningTask(state, task, 'toggle_shape_piece', { pieceId }).session;
      } else if (stage.interaction === 'assemble_response') {
        const ids = wrong ? [...stage.correctOptionIds].reverse() : stage.correctOptionIds;
        for (const tokenId of ids) state = dispatchLearningTask(state, task, 'add_phrase_token', { tokenId }).session;
      } else if (stage.interaction === 'classify_observations') {
        for (const observation of stage.observations) {
          const categoryId = wrong && observation.id === stage.observations[0].id
            ? stage.categories.find(({ id }) => id !== stage.correctAssignments[observation.id]).id
            : stage.correctAssignments[observation.id];
          state = dispatchLearningTask(state, task, 'assign_category', { observationId: observation.id, categoryId }).session;
        }
      } else if (stage.interaction === 'choose_response') {
        const option = stage.options.find(({ id }) => wrong ? !stage.correctOptionIds.includes(id) : stage.correctOptionIds.includes(id));
        state = dispatchLearningTask(state, task, 'select_option', { optionId: option.id }).session;
      } else if (stage.interaction === 'collect_evidence') {
        const optionIds = wrong
          ? [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id]
          : stage.acceptedOptionSets[0];
        for (const optionId of optionIds) state = dispatchLearningTask(state, task, 'toggle_evidence', { optionId }).session;
      } else assert.fail(`test helper does not cover ${stage.interaction}`);
      return state;
    };

    let stage = task.stages[0];
    session = fillWrong(session, stage, { wrong: true });
    let result = dispatchLearningTask(session, task, 'submit');
    assert.equal(result.changed, true, task.activityId);
    assert.equal(result.session.phase, 'feedback', task.activityId);
    assert.equal(result.session.lastFeedback.correct, false, task.activityId);
    assert.ok(result.session.lastFeedback.text, task.activityId);
    session = dispatchLearningTask(result.session, task, 'retry').session;
    assert.equal(session.phase, 'active', task.activityId);
    for (let index = 0; index < task.stages.length; index += 1) {
      stage = task.stages[index];
      session = fillWrong(session, stage);
      result = dispatchLearningTask(session, task, 'submit');
      assert.equal(result.session.phase, 'success', `${task.activityId}:${stage.stageId}`);
      if (index === task.stages.length - 1) session = dispatchLearningTask(result.session, task, 'next').session;
      else session = dispatchLearningTask(result.session, task, 'next').session;
    }
    assert.equal(session.phase, 'completed', task.activityId);
    session = dispatchLearningTask(session, task, 'restart', { sessionId: `${task.activityId}-replay` }).session;
    assert.equal(session.phase, 'intro', task.activityId);
    assert.equal(session.attempts.length, 0, task.activityId);
  }
});

test('curriculum focus and project-subitem records distinguish official scope from partial task claims', () => {
  const map = readJson('../curriculum/curriculum-map.json');
  const sources = readJson('../curriculum/sources.json');
  const subitems = readJson('../curriculum/learning-subitem-definitions.json');
  const focuses = [...map.verifiedLearningFocuses, ...map.supplementalVerifiedLearningFocuses];
  const sourceById = new Map(sources.sources.map((source) => [source.id, source]));
  const required = [
    ['math-grade1-shape-operation', 'S-1-2'],
    ['math-grade2-two-step-applications', 'N-2-8'],
    ['living-curriculum-stage1-shared-rules', '6-I-3'],
    ['health-pe-stage1-playground-and-school-route-safety', 'Ba-Ⅰ-1'],
  ];
  for (const [focusId, code] of required) {
    const focus = focuses.find(({ id }) => id === focusId);
    assert.ok(focus, focusId);
    assert.equal(focus.officialTextReviewStatus, 'verified_against_official_text');
    assert.ok(sourceById.get(focus.sourceId).verifiedClauses.includes(code), `${code} source verification`);
    assert.ok(focus.pageOrSection);
    assert.equal(focus.status === 'fully_covered', false);
  }
  const claimedSubitems = subitems.definitions.filter(({ activityIds = [] }) => activityIds.some((id) => byId.has(id)));
  assert.equal(claimedSubitems.length, 5);
  for (const item of claimedSubitems) assert.equal(item.status, 'candidate_partial_interaction');
  const hpe = byId.get('ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE');
  assert.ok(hpe, 'new task is in the candidate catalog data');
  assert.equal(hpe.status, 'candidate_pending_teacher_review');
  assert.deepEqual(hpe.curriculumCodes, ['Ba-Ⅰ-1']);
  assert.match(hpe.curriculumScope, /不評量真實移動技能/u);
  assert.equal(hpe.stages.length, 3);
  assert.deepEqual(hpe.stages.map(({ interaction }) => interaction), ['classify_observations', 'assemble_response', 'choose_response']);
  assert.ok(hpe.stages.every(({ hints }) => hints.length === 2));
});
