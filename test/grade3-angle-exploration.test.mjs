import test from 'node:test';
import assert from 'node:assert/strict';
import { ANGLE_EXPLORER_WORKSHOP as task } from '../prototype/data/angleExplorerWorkshop.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { readFileSync } from 'node:fs';

const definitions = JSON.parse(readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));
const maps = JSON.parse(readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));

function act(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} ${JSON.stringify(payload)}: ${result.error}`);
  return result.session;
}

function operate(session, stage, correct) {
  const rules = stage.angleRules;
  if (rules.mode === 'identify') return act(session, 'select_angle_option', { optionId: correct ? rules.correctOptionId : rules.options.find(({ id }) => id !== rules.correctOptionId).id });
  if (rules.mode === 'compare') {
    session = act(session, 'set_angle_comparison', { angleId: 'A', degrees: correct ? rules.targetAngleA : rules.targetAngleA + 5 });
    session = act(session, 'set_angle_comparison', { angleId: 'B', degrees: rules.targetAngleB });
    const wrong = rules.expectedRelation === 'greater' ? 'less' : 'greater';
    return act(session, 'set_angle_comparison_answer', { relation: correct ? rules.expectedRelation : wrong });
  }
  if (rules.mode === 'right_angle') {
    session = act(session, 'set_angle_value', { degrees: correct ? rules.targetDegrees : rules.initialDegrees });
    const wrong = rules.expectedRelation === 'greater' ? 'less' : 'greater';
    return act(session, 'set_angle_comparison_answer', { relation: correct ? rules.expectedRelation : wrong });
  }
  return act(session, 'set_angle_value', { degrees: correct ? rules.targetDegrees : Math.min(160, rules.targetDegrees + 20) });
}

test('angle candidate is catalog-launchable, keeps both official codes, and records six exact operation stages', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.deepEqual(task.curriculumCodes.slice(0, 2), ['N-3-13', 'S-3-1']);
  assert.ok(getCatalogCandidateTasksForSubject('grade-3', 'mathematics').some(({ activityId }) => activityId === task.activityId));
  assert.ok(getGradeById('grade-3').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent.some(({ activityId, runtimeModule }) => activityId === task.activityId && runtimeModule === 'prototype/data/angleExplorerWorkshop.js'));
  assert.deepEqual(task.stages.map(({ stageId }) => stageId), [
    'identify-angle-vertex-and-rays', 'compare-rotatable-angle-openings', 'compare-with-right-angle-card',
    'rotate-ray-to-match-opening', 'find-angle-in-life-picture', 'integrated-match-equal-openings',
  ]);
  const claim = definitions.definitions.find(({ subitemId }) => subitemId === task.learningSubitemClaims[0]);
  assert.ok(claim);
  assert.deepEqual(claim.officialCodes, ['N-3-13', 'S-3-1']);
  assert.deepEqual(claim.activityIds, [task.activityId]);
  assert.deepEqual(claim.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.ok(claim.notCovered.some((item) => item.includes('三角板')));
  const focus = [...maps.verifiedLearningFocuses, ...maps.supplementalVerifiedLearningFocuses, ...maps.pendingLearningFocuses].find(({ id }) => id === task.curriculumMapId);
  assert.ok(focus.contentCodes.includes('N-3-13') && focus.contentCodes.includes('S-3-1'));
});

test('all six angle stages provide hints, meaningful wrong feedback, retry, operation, completion and replay', () => {
  let session = act(createLearningTaskSession(task, 'g3-angle-flow'), 'start');
  for (const [index, stage] of task.stages.entries()) {
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true, `${stage.stageId}: hint 1`);
    session = dispatchLearningTask(session, task, 'hint').session;
    assert.equal(dispatchLearningTask(session, task, 'hint').changed, true, `${stage.stageId}: hint 2`);
    session = dispatchLearningTask(session, task, 'hint').session;
    session = operate(session, stage, false);
    const wrong = dispatchLearningTask(session, task, 'submit', { submissionId: `g3-angle-${index}-wrong` });
    assert.equal(wrong.changed, true, `${stage.stageId}: wrong response evaluated`);
    assert.equal(wrong.session.phase, 'feedback');
    assert.equal(wrong.session.lastFeedback.correct, false);
    assert.ok(wrong.session.lastFeedback.text.length > 0);
    session = act(wrong.session, 'retry');
    session = operate(session, stage, true);
    const right = dispatchLearningTask(session, task, 'submit', { submissionId: `g3-angle-${index}-right` });
    assert.equal(right.changed, true, `${stage.stageId}: valid operation submitted`);
    assert.equal(right.session.phase, 'success', `${stage.stageId}: correct model/relationship accepted`);
    session = right.session;
    if (index < task.stages.length - 1) session = act(session, 'next');
  }
  session = act(session, 'next');
  assert.equal(session.phase, 'completed');
  session = act(session, 'restart', { sessionId: 'g3-angle-replay' });
  assert.equal(session.phase, 'intro');
  assert.equal(session.stageIndex, 0);
  assert.deepEqual(session.attempts, []);
});

test('angle model controls reject invalid values and compare openings independent of ray length', () => {
  let session = act(createLearningTaskSession(task, 'g3-angle-model'), 'start');
  session = operate(session, task.stages[0], true);
  session = act(dispatchLearningTask(session, task, 'submit', { submissionId: 'angle-identify-before-compare' }).session, 'next');
  const compare = task.stages[1];
  assert.equal(dispatchLearningTask(session, task, 'set_angle_comparison', { angleId: 'A', degrees: 22 }).changed, false);
  session = act(session, 'set_angle_comparison', { angleId: 'A', degrees: compare.angleRules.targetAngleA });
  session = act(session, 'set_angle_comparison', { angleId: 'B', degrees: compare.angleRules.targetAngleB });
  session = act(session, 'set_angle_comparison_answer', { relation: 'greater' });
  const result = dispatchLearningTask(session, task, 'submit', { submissionId: 'g3-angle-short-long-rays' });
  assert.equal(result.session.lastFeedback.correct, true);
  assert.notEqual(compare.angleRules.rayLengthA, compare.angleRules.rayLengthB);
});
