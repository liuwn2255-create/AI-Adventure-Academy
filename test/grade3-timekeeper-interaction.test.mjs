import test from 'node:test';
import assert from 'node:assert/strict';
import { TIMEKEEPER_WORKSHOP } from '../prototype/data/timekeeperWorkshop.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const run = (session, action, payload = {}) => dispatchLearningTask(session, TIMEKEEPER_WORKSHOP, action, payload);
const act = (session, action, payload = {}) => {
  const result = run(session, action, payload);
  assert.equal(result.changed, true, `${action} should change state: ${result.error ?? ''}`);
  return result.session;
};
const submit = (session, id) => act(session, 'submit', { submissionId: id });

test('時間守門員規則有效且時間操作有對應明確學習子項', () => {
  assert.deepEqual(validateLearningTask(TIMEKEEPER_WORKSHOP), []);
  assert.equal(TIMEKEEPER_WORKSHOP.activityId, 'ACT-G3-MATH-TIMEKEEPER-CANDIDATE');
  assert.equal(TIMEKEEPER_WORKSHOP.status, 'candidate_pending_teacher_review');
  assert.equal(TIMEKEEPER_WORKSHOP.teacherReview.status, 'not_reviewed');
  assert.equal(TIMEKEEPER_WORKSHOP.stages.length, 7);
});

test('時針及分針會更新，分針跨過 12 時時時針同步進退', () => {
  let session = act(createLearningTaskSession(TIMEKEEPER_WORKSHOP, 'clock-rollover'), 'start');
  assert.deepEqual([session.clockHour, session.clockMinute], [1, 0]);
  session = act(session, 'set_clock_hand', { hand: 'minute', value: 55 });
  assert.deepEqual([session.clockHour, session.clockMinute], [12, 55]);
  session = act(session, 'set_clock_hand', { hand: 'minute', value: 0 });
  assert.deepEqual([session.clockHour, session.clockMinute], [1, 0]);
  session = act(session, 'set_clock_hand', { hand: 'minute', value: 55 });
  assert.deepEqual([session.clockHour, session.clockMinute], [12, 55]);
  assert.equal(run(session, 'set_clock_hand', { hand: 'minute', value: 57 }).changed, false);
});

test('指定讀時錯答有回饋，可修正重試後完成並重玩', () => {
  let session = act(createLearningTaskSession(TIMEKEEPER_WORKSHOP, 'clock-target'), 'start');
  session = act(session, 'set_clock_hand', { hand: 'hour', value: 3 });
  session = act(session, 'set_clock_hand', { hand: 'minute', value: 15 });
  session = submit(session, 'clock-wrong');
  assert.equal(session.phase, 'feedback');
  assert.equal(session.lastFeedback.correct, false);
  session = act(session, 'retry');
  session = act(session, 'set_clock_hand', { hand: 'hour', value: 3 });
  session = act(session, 'set_clock_hand', { hand: 'minute', value: 20 });
  session = submit(session, 'clock-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.lastFeedback.correct, true);
  assert.equal(session.attempts[1].response.minute, 20);
  session = act(session, 'next');
  assert.equal(session.stageIndex, 1);
  session = act(session, 'select_option', { optionId: 'digital-445' });
  session = submit(session, 'digital-time-match');
  assert.equal(session.phase, 'success');
  assert.equal(act(session, 'restart').phase, 'intro');
});

test('估計題接受合理範圍而不要求唯一精確值', () => {
  for (const [value, expected] of [[2, 'incorrect'], [3, 'correct'], [10, 'correct'], [11, 'incorrect']]) {
    const estimateOnly = { ...TIMEKEEPER_WORKSHOP, stages: [TIMEKEEPER_WORKSHOP.stages[2]] };
    let session = dispatchLearningTask(createLearningTaskSession(estimateOnly, `estimate-range-${value}`), estimateOnly, 'start').session;
    session = dispatchLearningTask(session, estimateOnly, 'set_estimate_value', { value }).session;
    session = dispatchLearningTask(session, estimateOnly, 'submit', { submissionId: `estimate-${value}` }).session;
    assert.equal(session.lastFeedback.correct, expected === 'correct', `${value} minutes`);
  }
});

test('同小時時間線需要操作到目標分鐘，錯答後可修正並完成整條任務', () => {
  let session = act(createLearningTaskSession(TIMEKEEPER_WORKSHOP, 'elapsed-flow'), 'start');
  for (let index = 0; index < 3; index += 1) {
    if (index > 0) session = act(session, 'next');
    const stage = TIMEKEEPER_WORKSHOP.stages[index];
    if (stage.interaction === 'set_clock_time') {
      session = act(session, 'set_clock_hand', { hand: 'hour', value: 3 });
      session = act(session, 'set_clock_hand', { hand: 'minute', value: 20 });
    } else if (stage.interaction === 'choose_response') session = act(session, 'select_option', { optionId: 'digital-445' });
    else session = act(session, 'set_estimate_value', { value: 7 });
    session = submit(session, `prefix-${index}`);
    assert.equal(session.phase, 'success');
  }
  for (let index = 3; index < TIMEKEEPER_WORKSHOP.stages.length; index += 1) {
    session = act(session, 'next');
    const stage = TIMEKEEPER_WORKSHOP.stages[index];
    if (stage.interaction === 'elapsed_time_model') {
      session = act(session, 'set_elapsed_minutes', { value: stage.elapsedRules.targetMinutes - stage.elapsedRules.stepMinutes });
      session = submit(session, `elapsed-wrong-${index}`);
      assert.equal(session.phase, 'feedback');
      assert.match(session.lastFeedback.text, /時間線|分鐘|標記/u);
      session = act(session, 'retry');
      session = act(session, 'set_elapsed_minutes', { value: stage.elapsedRules.targetMinutes });
      session = submit(session, `elapsed-correct-${index}`);
    } else if (stage.interaction === 'choose_response') {
      session = act(session, 'select_option', { optionId: 'integrated-30' });
      session = submit(session, `integrated-${index}`);
    } else {
      for (const tokenId of stage.correctOptionIds) session = act(session, 'add_phrase_token', { tokenId });
      session = submit(session, `order-${index}`);
    }
    assert.equal(session.phase, 'success', stage.stageId);
  }
  session = act(session, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, TIMEKEEPER_WORKSHOP.stages.length + 2);
  assert.equal(act(session, 'restart').phase, 'intro');
});
