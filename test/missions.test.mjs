import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, submitAnswer, advanceQuestion } from '../prototype/gameFlow.js';
import { demoQuestionSet } from '../prototype/data/demoQuestions.js';
import { createEmptyProgress, recordDemoCompletion, sanitizeProgress } from '../prototype/mapProgress.js';
import { awardMissionsForEvent, getMissionBadgeTotal, MISSION_EVENTS } from '../prototype/missions.js';

test('只打開頁面不會完成任務或取得獎勵', () => {
  const result = awardMissionsForEvent([], 'open_page', { entered: false, levelComplete: false, starsEarned: 0 });
  assert.deepEqual(result.newlyCompleted, []);
  assert.deepEqual(result.completedMissionIds, []);
  assert.equal(result.awardedBadges, 0);
});

test('第一次進入數字島只完成進島任務', () => {
  const result = awardMissionsForEvent([], MISSION_EVENTS.ENTER_NUMBER_ISLAND, { entered: true });
  assert.deepEqual(result.newlyCompleted.map((mission) => mission.id), ['task-enter-number-island']);
  assert.deepEqual(result.completedMissionIds, ['task-enter-number-island']);
  assert.equal(getMissionBadgeTotal(result.completedMissionIds), 1);
});

test('只有實際答對的遊戲事件會完成第一顆星任務', () => {
  const question = demoQuestionSet.questions[0];
  const initial = createGameState(demoQuestionSet.questions.length);
  const wrong = submitAnswer(initial, question, question.options[1].optionId);
  const wrongMissions = awardMissionsForEvent([], MISSION_EVENTS.EARN_STAR, { starsEarned: wrong.isCorrect ? 1 : 0 });
  assert.deepEqual(wrongMissions.completedMissionIds, []);

  const correct = submitAnswer(initial, question, question.answerId);
  assert.equal(correct.isCorrect, true);
  const starMission = awardMissionsForEvent([], MISSION_EVENTS.EARN_STAR, { starsEarned: correct.isCorrect ? 1 : 0 });
  assert.deepEqual(starMission.newlyCompleted.map((mission) => mission.id), ['task-earn-first-star']);
  assert.equal(starMission.awardedBadges, 1);
});

test('完成事件只在五題流程真正結束後成立', () => {
  let state = createGameState(demoQuestionSet.questions.length);
  assert.equal(state.complete, false);
  assert.deepEqual(awardMissionsForEvent([], MISSION_EVENTS.COMPLETE_PLACE_VALUE, { levelComplete: state.complete }).newlyCompleted, []);
  for (const question of demoQuestionSet.questions) {
    state = submitAnswer(state, question, question.answerId).state;
    state = advanceQuestion(state, demoQuestionSet.questions.length);
  }
  assert.equal(state.complete, true);
  assert.deepEqual(awardMissionsForEvent([], MISSION_EVENTS.COMPLETE_PLACE_VALUE, { levelComplete: state.complete }).newlyCompleted.map((mission) => mission.id), ['task-finish-place-value']);
});

test('同一任務獎勵只發放一次，重玩不累加徽章', () => {
  const first = awardMissionsForEvent([], MISSION_EVENTS.ENTER_NUMBER_ISLAND, { entered: true });
  const replay = awardMissionsForEvent(first.completedMissionIds, MISSION_EVENTS.ENTER_NUMBER_ISLAND, { entered: true });
  assert.equal(first.awardedBadges, 1);
  assert.equal(replay.awardedBadges, 0);
  assert.deepEqual(replay.newlyCompleted, []);
  assert.equal(getMissionBadgeTotal(replay.completedMissionIds), 1);

  const all = [
    [MISSION_EVENTS.ENTER_NUMBER_ISLAND, { entered: true }],
    [MISSION_EVENTS.EARN_STAR, { starsEarned: 1 }],
    [MISSION_EVENTS.COMPLETE_PLACE_VALUE, { levelComplete: true }],
  ].reduce((ids, [event, evidence]) => awardMissionsForEvent(ids, event, evidence).completedMissionIds, []);
  assert.equal(getMissionBadgeTotal(all), 3);
  assert.equal(getMissionBadgeTotal(all), 3);
});

test('v1 本機進度可升級至 v4，保留最佳星數並初始化任務、收藏及挑戰集合', () => {
  const migrated = sanitizeProgress({
    version: 1,
    completedLevels: { 'math-place-value-demo': { completed: true, bestStars: 4 } },
  });
  assert.deepEqual(migrated, {
    version: 4,
    completedLevels: { 'math-place-value-demo': { completed: true, bestStars: 4 } },
    completedMissionIds: [],
    collectedStarIds: [],
    challengeRecords: {},
  });

  const afterReplay = recordDemoCompletion(migrated, 2);
  assert.equal(afterReplay.completedLevels['math-place-value-demo'].bestStars, 4);
  assert.deepEqual(afterReplay.completedMissionIds, []);
  assert.deepEqual(afterReplay.collectedStarIds, []);
  assert.deepEqual(sanitizeProgress({ bad: true }), createEmptyProgress());
});

test('v2 本機進度升級至 v4 時保留已領徽章及最佳星數', () => {
  const migrated = sanitizeProgress({
    version: 2,
    completedLevels: { 'math-place-value-demo': { completed: true, bestStars: 3 } },
    completedMissionIds: ['task-enter-number-island'],
  });
  assert.equal(migrated.version, 4);
  assert.equal(migrated.completedLevels['math-place-value-demo'].bestStars, 3);
  assert.deepEqual(migrated.completedMissionIds, ['task-enter-number-island']);
  assert.deepEqual(migrated.collectedStarIds, []);
  assert.deepEqual(migrated.challengeRecords, {});
});

test('找到石碑任務必須有靠近石碑的實際互動證據', () => {
  const before = awardMissionsForEvent([], MISSION_EVENTS.FIND_NUMBER_OBELISK, { objectId: 'number-obelisk', nearby: false });
  assert.deepEqual(before.newlyCompleted, []);
  const after = awardMissionsForEvent([], MISSION_EVENTS.FIND_NUMBER_OBELISK, { objectId: 'number-obelisk', nearby: true });
  assert.deepEqual(after.newlyCompleted.map((mission) => mission.id), ['task-find-number-obelisk']);
  assert.equal(after.awardedBadges, 1);
});
