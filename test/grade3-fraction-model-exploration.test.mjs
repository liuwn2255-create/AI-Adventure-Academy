import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE3_FRACTION_MODEL_EXPLORATION as activity } from '../prototype/data/fractionModelExplorationWorkshop.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../curriculum/${name}`, import.meta.url), 'utf8'));
const act = (session, action, payload = {}) => {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.changed, true, `${action}: ${result.error ?? 'no state change'}`);
  return result.session;
};

function place(session, stage, wrong = false) {
  const rules = stage.fractionRules;
  session = act(session, 'set_fraction_denominator', { denominator: rules.denominator });
  session = act(session, 'select_fraction_whole', { wholeId: rules.targetWholeId });
  const move = (groupId, ids) => {
    session = act(session, 'select_fraction_model', { groupId });
    for (const pieceId of ids) session = act(session, 'move_fraction_piece', { pieceId, targetGroupId: groupId });
  };
  const pieces = (groupId) => rules.pieces.filter((piece) => piece.initialGroupId === groupId).map((piece) => piece.id);
  if (rules.mode === 'build') move(rules.targetGroupId, pieces(rules.sourceGroupId).slice(0, rules.targetNumerator - Number(wrong)));
  if (rules.mode === 'compare') {
    const source = pieces(rules.sourceGroupId);
    move(rules.leftGroupId, source.slice(0, rules.leftNumerator));
    move(rules.rightGroupId, source.slice(rules.leftNumerator, rules.leftNumerator + rules.rightNumerator));
    session = act(session, 'set_fraction_relation', { relation: wrong ? (rules.correctRelation === '<' ? '>' : '<') : rules.correctRelation });
  }
  if (rules.mode === 'add') {
    const all = [...pieces(rules.firstOperandGroupId), ...pieces(rules.secondOperandGroupId)];
    move(rules.resultGroupId, wrong ? all.slice(0, -1) : all);
  }
  if (rules.mode === 'subtract') move(rules.removedGroupId, pieces(rules.startGroupId).slice(0, rules.removedNumerator - Number(wrong)));
  if (rules.mode === 'make_one') {
    const all = [...pieces(rules.firstOperandGroupId), ...pieces(rules.secondOperandGroupId)];
    move(rules.wholeGroupId, wrong ? all.slice(0, -1) : all);
  }
  return session;
}

test('N-3-9 fraction model task is routed as a partial candidate with stage evidence', () => {
  assert.deepEqual(validateLearningTask(activity), []);
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => activityId === activity.activityId).length, 1);
  assert.equal(activity.status, 'candidate_pending_teacher_review');
  assert.equal(activity.curriculumAlignment, 'partial');
  assert.equal(activity.stages.length, 5);
  assert.deepEqual(activity.stages.map(({ fractionRules }) => fractionRules.mode), ['build', 'compare', 'add', 'subtract', 'make_one']);
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const math = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.ok(math.existingYearLevelContent.some(({ activityId }) => activityId === activity.activityId));
  const definition = read('learning-subitem-definitions.json').definitions.find(({ subitemId }) => subitemId === activity.learningSubitemClaims[0]);
  assert.equal(definition.status, 'candidate_partial_interaction');
  assert.deepEqual(definition.evidenceStageIds, activity.stages.map(({ stageId }) => stageId));
  assert.equal(read('math-grade3-official-content-batch.json').activityAudit.find(({ code }) => code === 'N-3-9').status, 'partial');
});

test('each fraction model mode diagnoses a valid wrong attempt, retries, and accepts the manipulated model', () => {
  let session = createLearningTaskSession(activity, 'fraction-interaction-e2e');
  session = act(session, 'start');
  for (let index = 0; index < activity.stages.length; index += 1) {
    const stage = activity.stages[index];
    session = act(session, 'hint');
    session = act(session, 'hint');
    session = place(session, stage, true);
    let result = dispatchLearningTask(session, activity, 'submit', { submissionId: `wrong-${index}` });
    assert.equal(result.changed, true);
    assert.equal(result.session.phase, 'feedback', `${stage.stageId} should reject a valid but incorrect model`);
    assert.ok(result.session.lastFeedback.text.length > 0);
    assert.notEqual(result.session.lastFeedback.text, stage.correctFeedback);
    session = act(result.session, 'retry');
    session = place(session, stage, false);
    result = dispatchLearningTask(session, activity, 'submit', { submissionId: `correct-${index}` });
    assert.equal(result.changed, true);
    assert.equal(result.session.phase, 'success', `${stage.stageId} correct model should pass`);
    session = result.session;
    session = act(session, 'next');
  }
  assert.equal(session.phase, 'completed');
  const restarted = act(session, 'restart', { sessionId: 'fraction-replay' });
  assert.equal(restarted.phase, 'intro');
  assert.equal(restarted.activityId, activity.activityId);
});

test('changing denominator resets moved pieces and invalid denominator is rejected', () => {
  let session = createLearningTaskSession(activity, 'fraction-reset');
  session = act(session, 'start');
  const stage = activity.stages[0];
  session = act(session, 'set_fraction_denominator', { denominator: 6 });
  session = act(session, 'select_fraction_model', { groupId: 'fraction-model' });
  session = act(session, 'move_fraction_piece', { pieceId: 'piece-1', targetGroupId: 'fraction-model' });
  const rejected = dispatchLearningTask(session, activity, 'set_fraction_denominator', { denominator: 5 });
  assert.equal(rejected.changed, false);
  session = act(session, 'set_fraction_denominator', { denominator: 3 });
  assert.deepEqual(session.fractionPieceLocations, Object.fromEntries(stage.fractionRules.pieces.map(({ id, initialGroupId }) => [id, initialGroupId])));
});
