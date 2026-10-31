import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { numberSecretChallenge } from '../prototype/data/numberSecretQuestions.js';
import { advanceQuestion, createGameState, submitAnswer } from '../prototype/gameFlow.js';
import { createEmptyProgress, DEMO_PROGRESS_KEY, readProgress, recordNumberSecretCompletion, writeProgress } from '../prototype/mapProgress.js';
import { awardMissionsForEvent, MISSION_EVENTS } from '../prototype/missions.js';
import { canStartNumberSecret, isNumberSecretTreasureUnlocked, NUMBER_SECRET_QUEST_ID } from '../prototype/numberSecretFlow.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

test('未實際找到石碑不能開始任務', () => {
  assert.equal(canStartNumberSecret([]), false);
  assert.equal(canStartNumberSecret(['task-find-number-obelisk']), true);
});

test('只有完成任務後寶箱才解鎖', () => {
  assert.equal(isNumberSecretTreasureUnlocked(createEmptyProgress()), false);
  assert.equal(isNumberSecretTreasureUnlocked(recordNumberSecretCompletion(createEmptyProgress(), 0)), true);
});

test('三題示範題的答案與解析一致且資料清楚標示待教師審核', () => {
  assert.equal(numberSecretChallenge.datasetStatus, 'prototype_demo_pending_teacher_review');
  assert.equal(numberSecretChallenge.questions.length, 3);
  for (const question of numberSecretChallenge.questions) {
    assert.equal(question.options.filter((option) => option.optionId === question.answerId).length, 1);
    assert.ok(question.explanation.length > 0);
    assert.equal(question.options.length, 3);
  }
  assert.equal(numberSecretChallenge.questions[0].options.find((option) => option.optionId === numberSecretChallenge.questions[0].answerId).text, '3 個千');
  assert.match(numberSecretChallenge.questions[0].explanation, /3,000/);
  assert.equal(numberSecretChallenge.questions[1].options.find((option) => option.optionId === numberSecretChallenge.questions[1].answerId).text, '4,000');
  assert.match(numberSecretChallenge.questions[1].explanation, /4,000/);
  assert.equal(numberSecretChallenge.questions[2].options.find((option) => option.optionId === numberSecretChallenge.questions[2].answerId).text, '2,500');
  assert.match(numberSecretChallenge.questions[2].explanation, /2,000.*500.*2,500/);
});

test('千位數任務開場提供清楚的作答步驟，不重複任務介紹', async () => {
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  assert.match(html, /每題選一個答案；看完解析，再按「下一題」繼續。/);
  assert.doesNotMatch(html, /完成三題後就能打開寶箱。答錯也沒關係/);
});

test('答錯不增加答對數，仍可完成流程並看到結果狀態', () => {
  let game = createGameState(3);
  const first = numberSecretChallenge.questions[0];
  game = submitAnswer(game, first, first.options.find((option) => option.optionId !== first.answerId).optionId).state;
  assert.equal(game.score, 0);
  assert.equal(game.answered, true);
  game = advanceQuestion(game, 3);
  for (const question of numberSecretChallenge.questions.slice(1)) {
    game = submitAnswer(game, question, question.answerId).state;
    game = advanceQuestion(game, 3);
  }
  assert.equal(game.complete, true);
  assert.equal(game.score, 2);
});

test('完成三題才可取得任務徽章；重玩不重複發放', () => {
  const before = awardMissionsForEvent(['task-find-number-obelisk'], MISSION_EVENTS.COMPLETE_NUMBER_SECRET, {
    questId: NUMBER_SECRET_QUEST_ID,
    challengeComplete: false,
  });
  assert.equal(before.awardedBadges, 0);
  const completed = awardMissionsForEvent(['task-find-number-obelisk'], MISSION_EVENTS.COMPLETE_NUMBER_SECRET, {
    questId: NUMBER_SECRET_QUEST_ID,
    challengeComplete: true,
  });
  assert.deepEqual(completed.newlyCompleted.map((mission) => mission.id), ['task-complete-number-secret']);
  assert.equal(completed.awardedBadges, 1);
  const replay = awardMissionsForEvent(completed.completedMissionIds, MISSION_EVENTS.COMPLETE_NUMBER_SECRET, {
    questId: NUMBER_SECRET_QUEST_ID,
    challengeComplete: true,
  });
  assert.equal(replay.awardedBadges, 0);
});

test('任務完成狀態與最佳成績重新載入後保留', () => {
  const storage = memoryStorage();
  const progress = recordNumberSecretCompletion(createEmptyProgress(), 2);
  assert.equal(writeProgress(storage, progress), true);
  const restored = readProgress(storage);
  assert.deepEqual(restored.challengeRecords[NUMBER_SECRET_QUEST_ID], { completed: true, bestScore: 2 });
  assert.ok(storage.getItem(DEMO_PROGRESS_KEY));
});

test('損壞的本機資料回到安全預設值', () => {
  assert.deepEqual(readProgress({ getItem() { return '{broken'; } }), createEmptyProgress());
});
