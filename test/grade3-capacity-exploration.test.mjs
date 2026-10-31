import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { LEARNING_SUBITEM_GAP_TASKS } from '../prototype/data/learningSubitemGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const activityId = 'ACT-G3-MATH-CAPACITY-ESTIMATION-CANDIDATE';
const activity = LEARNING_SUBITEM_GAP_TASKS.find(({ activityId: id }) => id === activityId);
const act = (session, action, payload = {}) => dispatchLearningTask(session, activity, action, payload);
const submit = (session, id) => act(session, 'submit', { submissionId: id });

test('capacity adventure remains the single catalog-connected N-3-15 candidate with six evidence stages', () => {
  assert.ok(activity);
  assert.ok(CATALOG_CANDIDATE_TASKS.some(({ activityId: id }) => id === activityId));
  assert.equal(activity.status, 'candidate_pending_teacher_review');
  assert.equal(activity.teacherReview.status, 'not_reviewed');
  assert.deepEqual(validateLearningTask(activity), []);
  assert.equal(activity.curriculumCodes.includes('N-3-15'), true);
  assert.equal(activity.stages.length, 6);
  assert.deepEqual(activity.stages.map(({ stageId }) => stageId), [
    'estimate-two-bottles', 'fill-to-mark-600-ml', 'read-offset-meniscus-450-ml',
    'compare-short-wide-and-tall-vessels', 'find-remaining-capacity', 'build-rescue-water-supply',
  ]);
});

test('each capacity stage supports hints, a valid wrong attempt, retry, correct response, and next stage', () => {
  let session = act(createLearningTaskSession(activity, 'capacity-flow'), 'start').session;
  for (const [index, stage] of activity.stages.entries()) {
    assert.equal(session.stageIndex, index);
    for (let hintLevel = 1; hintLevel <= 2; hintLevel += 1) {
      const hint = act(session, 'hint'); session = hint.session;
      assert.equal(hint.changed, true); assert.ok(hint.hint);
    }
    const rules = stage.capacityRules;
    if (rules.mode === 'estimate') session = act(session, 'set_capacity_estimate', { value: rules.input.min }).session;
    if (rules.mode === 'fill') {
      const wrong = rules.targetMl - rules.stepMl;
      for (let value = rules.initialMl; value < wrong; value += rules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: 1 }).session;
    }
    if (rules.mode === 'read') {
      const fill = act(session, 'set_capacity_reading', { value: rules.targetMl });
      assert.equal(fill.changed, false, 'cannot record a reading before adjusting liquid to its target');
      for (let value = rules.initialMl; value < rules.targetMl; value += rules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: 1 }).session;
      session = act(session, 'set_capacity_reading', { value: rules.targetMl - rules.readingStepMl }).session;
    }
    if (rules.mode === 'compare') {
      for (const container of rules.containers) for (let value = 0; value < container.capacityMl; value += rules.stepMl) {
        session = act(session, 'adjust_capacity_container', { containerId: container.id, delta: 1 }).session;
      }
      session = act(session, 'set_capacity_relation', { relation: '<' }).session;
    }
    if (rules.mode === 'difference') {
      for (let value = rules.initialMl; value > rules.targetMl; value -= rules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: -1 }).session;
      session = act(session, 'set_capacity_difference', { value: rules.expectedDifferenceMl - rules.answerStepMl }).session;
    }
    if (rules.mode === 'supply') session = act(session, 'toggle_capacity_supply_item', { itemId: rules.items[0].id }).session;
    const wrong = submit(session, `capacity-wrong-${index}`);
    assert.equal(wrong.changed, true);
    assert.equal(wrong.session.phase, 'feedback', `${stage.stageId} should show an incorrect response`);
    assert.match(wrong.session.lastFeedback.text, /容量|液量|估量|液面|容器|毫升/);
    session = act(wrong.session, 'retry').session;
    assert.equal(session.phase, 'active');

    if (rules.mode === 'estimate') session = act(session, 'set_capacity_estimate', { value: rules.acceptable.min }).session;
    if (rules.mode === 'fill') for (let value = rules.initialMl; value < rules.targetMl; value += rules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: 1 }).session;
    if (rules.mode === 'read') {
      for (let value = rules.initialMl; value < rules.targetMl; value += rules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: 1 }).session;
      session = act(session, 'set_capacity_reading', { value: rules.targetMl }).session;
    }
    if (rules.mode === 'compare') {
      for (const container of rules.containers) for (let value = 0; value < container.capacityMl; value += rules.stepMl) {
        session = act(session, 'adjust_capacity_container', { containerId: container.id, delta: 1 }).session;
      }
      session = act(session, 'set_capacity_relation', { relation: rules.relation }).session;
    }
    if (rules.mode === 'difference') {
      for (let value = rules.initialMl; value > rules.targetMl; value -= rules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: -1 }).session;
      session = act(session, 'set_capacity_difference', { value: rules.expectedDifferenceMl }).session;
    }
    if (rules.mode === 'supply') {
      const combo = [rules.items[0], rules.items[1], rules.items.find(({ volumeMl }) => volumeMl + rules.items[0].volumeMl + rules.items[1].volumeMl === rules.targetMl)].filter(Boolean);
      assert.equal(combo.reduce((sum, item) => sum + item.volumeMl, 0), rules.targetMl);
      for (const item of combo) session = act(session, 'toggle_capacity_supply_item', { itemId: item.id }).session;
    }
    const correct = submit(session, `capacity-correct-${index}`);
    assert.equal(correct.session.phase, 'success', `${stage.stageId} should complete with the model and recorded response`);
    assert.equal(correct.attempt.result, 'correct');
    session = act(correct.session, 'next').session;
  }
  assert.equal(session.phase, 'completed');
  const replay = act(session, 'restart', { sessionId: 'capacity-replay' }).session;
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.stageIndex, 0);
  assert.deepEqual(replay.attempts, []);
});

test('capacity model enforces empty/full boundaries, consistent mL math, equal container capacities, and blocks overflow', () => {
  const boundaryTask = { ...activity, stages: [{ ...activity.stages[1], stageId: 'test-empty-full-boundaries', capacityRules: { mode: 'fill', containerCapacityMl: 200, initialMl: 0, targetMl: 200, stepMl: 100 } }] };
  let session = dispatchLearningTask(createLearningTaskSession(boundaryTask, 'capacity-boundaries'), boundaryTask, 'start').session;
  session = dispatchLearningTask(session, boundaryTask, 'adjust_capacity_volume', { delta: 1 }).session;
  session = dispatchLearningTask(session, boundaryTask, 'adjust_capacity_volume', { delta: 1 }).session;
  assert.equal(session.capacityModel.volumeMl, 200);
  const over = dispatchLearningTask(session, boundaryTask, 'adjust_capacity_volume', { delta: 1 });
  assert.equal(over.changed, false);
  assert.equal(over.error, 'capacity_volume_out_of_range');
  assert.equal(over.session.capacityModel.volumeMl, 200);
  session = dispatchLearningTask(session, boundaryTask, 'adjust_capacity_volume', { delta: -1 }).session;
  session = dispatchLearningTask(session, boundaryTask, 'adjust_capacity_volume', { delta: -1 }).session;
  assert.equal(session.capacityModel.volumeMl, 0);
  const under = dispatchLearningTask(session, boundaryTask, 'adjust_capacity_volume', { delta: -1 });
  assert.equal(under.changed, false);
  assert.equal(under.error, 'capacity_volume_out_of_range');

  session = act(createLearningTaskSession(activity, 'capacity-reading-boundary'), 'start').session;
  session = act(session, 'set_capacity_estimate', { value: activity.stages[0].capacityRules.acceptable.min }).session;
  session = act(submit(session, 'reading-estimate').session, 'next').session;
  const fill = activity.stages[1].capacityRules;
  for (let value = fill.initialMl; value < fill.targetMl; value += fill.stepMl) session = act(session, 'adjust_capacity_volume', { delta: 1 }).session;
  session = act(submit(session, 'reading-fill').session, 'next').session;
  const readStage = activity.stages[2];
  const cannotReadEarly = act(session, 'set_capacity_reading', { value: readStage.capacityRules.targetMl });
  assert.equal(cannotReadEarly.changed, false);
  assert.equal(cannotReadEarly.error, 'invalid_capacity_reading');
  for (let value = readStage.capacityRules.initialMl; value < readStage.capacityRules.targetMl; value += readStage.capacityRules.stepMl) session = act(session, 'adjust_capacity_volume', { delta: 1 }).session;
  const impossibleRead = act(session, 'set_capacity_reading', { value: 475 });
  assert.equal(impossibleRead.changed, false);
  assert.equal(impossibleRead.error, 'invalid_capacity_reading');

  const supplyTask = { ...activity, stages: [activity.stages[5]] };
  session = dispatchLearningTask(createLearningTaskSession(supplyTask, 'capacity-overflow'), supplyTask, 'start').session;
  session = dispatchLearningTask(session, supplyTask, 'toggle_capacity_supply_item', { itemId: 'bottle-500' }).session;
  session = dispatchLearningTask(session, supplyTask, 'toggle_capacity_supply_item', { itemId: 'bottle-300' }).session;
  const overflow = dispatchLearningTask(session, supplyTask, 'toggle_capacity_supply_item', { itemId: 'bottle-250-a' });
  assert.equal(overflow.changed, false);
  assert.equal(overflow.error, 'capacity_supply_overflow');
  assert.equal(overflow.session.capacityModel.selectedItems.length, 2);
  assert.equal(overflow.session.capacityModel.selectedItems.reduce((sum, id) => sum + activity.stages[5].capacityRules.items.find((item) => item.id === id).volumeMl, 0), 800);
});
