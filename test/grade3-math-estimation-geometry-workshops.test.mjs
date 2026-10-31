import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import scope from '../curriculum/grade3-year-scope.json' with { type: 'json' };

const estimation = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE');
const geometry = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE');
const submit = (session, activity, submissionId) => dispatchLearningTask(session, activity, 'submit', { submissionId });

test('估算關卡以合理區間判定四種運算估值與估算結果合理性', () => {
  assert.equal(validateLearningTask(estimation).length, 0);
  assert.equal(estimation.status, 'candidate_pending_teacher_review');
  assert.equal(estimation.teacherReview.status, 'not_reviewed');
  assert.equal(estimation.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.deepEqual([37 + 26, 402 - 187, 19 * 4, 156 / 4], [63, 215, 76, 39]);
  for (let index = 0; index < 4; index += 1) {
    const stage = estimation.stages[index];
    assert.equal(stage.interaction, 'set_estimate_range');
    const { min, max, step } = stage.estimateRules.inputRange;
    const accepted = stage.estimateRules.acceptableRange;
    assert.ok(min <= accepted.min && accepted.max <= max && accepted.min <= accepted.max && step > 0);
    assert.notEqual(accepted.min, accepted.max, 'estimate is a range, not an exact-answer check');
  }

  let session = dispatchLearningTask(createLearningTaskSession(estimation, 'estimate-case'), estimation, 'start').session;
  const set = (value) => dispatchLearningTask(session, estimation, 'set_estimate_value', { value });
  assert.equal(set(20).session.estimateValue, 20);
  let result = submit(set(20).session, estimation, 'estimate-wrong');
  assert.equal(result.session.phase, 'feedback');
  assert.equal(result.attempt.result, 'incorrect');
  session = dispatchLearningTask(result.session, estimation, 'retry').session;
  const estimateAfterRetry = dispatchLearningTask(session, estimation, 'set_estimate_value', { value: 60 }).session;
  assert.equal(submit(estimateAfterRetry, estimation, 'estimate-wrong').error, 'duplicate_submission');
  result = submit(estimateAfterRetry, estimation, 'estimate-right');
  assert.equal(result.session.phase, 'success');
  assert.equal(result.attempt.response, 60);
  session = result.session;
  for (let index = 1; index < estimation.stages.length; index += 1) {
    session = dispatchLearningTask(session, estimation, 'next').session;
    const stage = estimation.stages[index];
    if (stage.interaction === 'set_estimate_range') {
      const value = [210, 80, 40][index - 1];
      session = dispatchLearningTask(session, estimation, 'set_estimate_value', { value }).session;
    } else {
      session = dispatchLearningTask(session, estimation, 'select_option', { optionId: 'estimate-check-reasonable' }).session;
    }
    result = submit(session, estimation, `estimate-stage-${index}`);
    assert.equal(result.session.phase, 'success', `stage ${stage.stageId}`);
    session = result.session;
  }
  session = dispatchLearningTask(session, estimation, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 6, 'wrong first-stage attempt and five completed stages remain visible');
  assert.equal(dispatchLearningTask(session, estimation, 'restart').session.phase, 'intro');
});

test('幾何關卡有圖形性質多選與方格拼組，斜擺圖形保留同一性質', () => {
  assert.equal(validateLearningTask(geometry).length, 0);
  assert.equal(geometry.status, 'candidate_pending_teacher_review');
  assert.equal(geometry.teacherReview.status, 'not_reviewed');
  assert.equal(geometry.evidencePolicy.completionIsMastery, false);
  assert.equal(geometry.stages[0].interaction, 'collect_evidence');
  assert.ok(geometry.stages[0].options.some(({ figure }) => figure?.type === 'square' && figure.rotation !== 0));
  assert.ok(geometry.stages[1].options.some(({ figure }) => figure?.type === 'square' && figure.rotation !== 0));
  assert.deepEqual(geometry.stages.slice(2).map(({ interaction }) => interaction), ['compose_shape', 'compose_shape']);

  let session = dispatchLearningTask(createLearningTaskSession(geometry, 'geometry-case'), geometry, 'start').session;
  session = dispatchLearningTask(session, geometry, 'toggle_evidence', { optionId: 'right-parallelogram-e' }).session;
  let result = submit(session, geometry, 'geometry-sort-wrong');
  assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, geometry, 'retry').session;
  for (const optionId of geometry.stages[0].correctOptionIds) session = dispatchLearningTask(session, geometry, 'toggle_evidence', { optionId }).session;
  result = submit(session, geometry, 'geometry-sort-right'); assert.equal(result.session.phase, 'success');
  session = dispatchLearningTask(result.session, geometry, 'next').session;
  for (const optionId of geometry.stages[1].correctOptionIds) session = dispatchLearningTask(session, geometry, 'toggle_evidence', { optionId }).session;
  result = submit(session, geometry, 'geometry-square-right'); assert.equal(result.session.phase, 'success');

  for (const [index, tileCount] of [4, 6].entries()) {
    session = dispatchLearningTask(result.session, geometry, 'next').session;
    const stage = geometry.stages[index + 2];
    for (const piece of stage.pieces.slice(0, tileCount - 1)) session = dispatchLearningTask(session, geometry, 'toggle_shape_piece', { pieceId: piece.id }).session;
    session = dispatchLearningTask(session, geometry, 'toggle_shape_piece', { pieceId: stage.pieces.find(({ shape }) => shape === 'triangle').id }).session;
    result = submit(session, geometry, `geometry-build-wrong-${index}`); assert.equal(result.session.phase, 'feedback');
    session = dispatchLearningTask(result.session, geometry, 'retry').session;
    for (const pieceId of stage.shapeRules.correctPieceIds) session = dispatchLearningTask(session, geometry, 'toggle_shape_piece', { pieceId }).session;
    result = submit(session, geometry, `geometry-build-right-${index}`); assert.equal(result.session.phase, 'success');
  }
  session = dispatchLearningTask(result.session, geometry, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, geometry, 'restart').session.phase, 'intro');
});

test('估算與幾何活動在三年級數學目錄及候選範圍資料中相互連結但不宣稱完整涵蓋', () => {
  const math = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3').subjects.find(({ subjectId }) => subjectId === 'mathematics');
  const activityIds = [estimation.activityId, geometry.activityId];
  assert.ok(activityIds.every((id) => math.existingYearLevelContent.some(({ activityId, runtimeAvailability }) => activityId === id && runtimeAvailability === 'playable_candidate_prototype')));
  const relation = getLearningTaskRelation('grade-3', 'mathematics');
  for (const task of [estimation, geometry]) {
    const objective = relation.objectiveDefinitions.find(({ objectiveId }) => objectiveId === task.learningObjective.objectiveId);
    assert.ok(objective);
    assert.ok(relation.learningObjectiveTaskLinks.some(({ learningObjectiveId, taskIds }) => learningObjectiveId === objective.objectiveId && taskIds.includes(task.activityId)));
  }
  for (const code of ['N-3-8', 'S-3-2']) {
    const entry = scope.items.find(({ officialCurriculum }) => officialCurriculum.learningContentCodes.some(({ code: entryCode }) => entryCode === code));
    assert.equal(entry.teacherProfessionalReviewStatus, 'pending_review');
    assert.equal(entry.activityCoverage.status, 'candidate_activity_program_and_browser_verified');
    assert.equal(entry.activityCoverage.activityRefs[0].programVerification, 'verified');
    assert.equal(entry.activityCoverage.activityRefs[0].browserVerification, 'verified');
    assert.equal(entry.activityCoverage.activityRefs[0].alignment, 'partial_candidate');
  }
});
