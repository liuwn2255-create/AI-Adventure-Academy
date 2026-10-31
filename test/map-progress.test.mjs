import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectDemoStar,
  DEMO_COLLECTIBLE_STAR_IDS,
  DEMO_LEVEL_ID,
  DEMO_PROGRESS_KEY,
  createEmptyProgress,
  isProgressStorageReadable,
  readProgress,
  recordDemoCompletion,
  recordLevelCompletion,
  recordNumberSecretCompletion,
  sanitizeProgress,
  writeProgress,
} from '../prototype/mapProgress.js';

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); },
    data,
  };
}

test('新使用者與無效 JSON 都安全回到空白原型進度', () => {
  assert.deepEqual(readProgress(null), createEmptyProgress());
  const storage = createMemoryStorage({ [DEMO_PROGRESS_KEY]: '{broken' });
  assert.deepEqual(readProgress(storage), createEmptyProgress());
});

test('只接受版本正確且範圍有效的示範關卡完成資料', () => {
  assert.deepEqual(sanitizeProgress({
    version: 1,
    completedLevels: {
      [DEMO_LEVEL_ID]: { completed: true, bestStars: 8 },
      'unknown-level': { completed: true, bestStars: 5 },
    },
  }), createEmptyProgress());
  const valid = sanitizeProgress({
    version: 1,
    completedLevels: {
      [DEMO_LEVEL_ID]: { completed: true, bestStars: 3 },
      'unknown-level': { completed: true, bestStars: 5 },
    },
  });
  assert.deepEqual(valid.completedLevels, { [DEMO_LEVEL_ID]: { completed: true, bestStars: 3 } });
});

test('重玩只更新最佳星數，不把完成星數永久累加', () => {
  const first = recordDemoCompletion(createEmptyProgress(), 4);
  const lowerRetry = recordDemoCompletion(first, 2);
  const improvedRetry = recordDemoCompletion(lowerRetry, 5);
  assert.equal(first.completedLevels[DEMO_LEVEL_ID].bestStars, 4);
  assert.equal(lowerRetry.completedLevels[DEMO_LEVEL_ID].bestStars, 4);
  assert.equal(improvedRetry.completedLevels[DEMO_LEVEL_ID].bestStars, 5);
  assert.equal(Object.keys(improvedRetry.completedLevels).length, 1);
});

test('通用關卡進度只更新指定關卡最佳星數，重玩低分不覆蓋且可讀回', () => {
  const storage = createMemoryStorage();
  const levelId = 'math-number-comparison-candidate';
  const first = recordLevelCompletion(createEmptyProgress(), levelId, 3);
  const retry = recordLevelCompletion(first, levelId, 1);
  assert.deepEqual(retry.completedLevels[levelId], { completed: true, bestStars: 3 });
  assert.deepEqual(retry.challengeRecords, {});
  assert.equal(writeProgress(storage, retry), true);
  assert.deepEqual(readProgress(storage).completedLevels[levelId], { completed: true, bestStars: 3 });
});

test('星數被界限在五顆內，缺少 storage 或儲存失敗時不拋出錯誤', () => {
  assert.equal(recordDemoCompletion(createEmptyProgress(), 99).completedLevels[DEMO_LEVEL_ID].bestStars, 5);
  assert.equal(recordDemoCompletion(createEmptyProgress(), -4).completedLevels[DEMO_LEVEL_ID].bestStars, 0);
  const brokenReadStorage = { getItem() { throw new Error('blocked'); } };
  assert.deepEqual(readProgress(brokenReadStorage), createEmptyProgress());
  assert.equal(isProgressStorageReadable(brokenReadStorage), false);
  assert.equal(writeProgress(null, createEmptyProgress()), false);
  const brokenStorage = { setItem() { throw new Error('quota'); } };
  assert.equal(writeProgress(brokenStorage, createEmptyProgress()), false);
});

test('可寫入並讀回原型進度，資料不包含個人識別欄位', () => {
  const storage = createMemoryStorage();
  const progress = recordDemoCompletion(createEmptyProgress(), 4);
  assert.equal(writeProgress(storage, progress), true);
  assert.deepEqual(readProgress(storage), progress);
  assert.deepEqual(Object.keys(progress), ['version', 'completedLevels', 'completedMissionIds', 'collectedStarIds', 'challengeRecords']);
  assert.equal('studentName' in progress, false);
});

test('千位數任務成績獨立保存，重玩低分不會覆蓋最佳紀錄', () => {
  const first = recordNumberSecretCompletion(createEmptyProgress(), 3);
  const retry = recordNumberSecretCompletion(first, 1);
  assert.deepEqual(first.challengeRecords['thousands-secret'], { completed: true, bestScore: 3 });
  assert.deepEqual(retry.challengeRecords['thousands-secret'], { completed: true, bestScore: 3 });
  assert.deepEqual(retry.completedLevels, {});
});

test('v3 進度升級至 v4 時保留既有地圖、徽章及場景星星', () => {
  const migrated = sanitizeProgress({
    version: 3,
    completedLevels: { [DEMO_LEVEL_ID]: { completed: true, bestStars: 2 } },
    completedMissionIds: ['task-enter-number-island'],
    collectedStarIds: [DEMO_COLLECTIBLE_STAR_IDS[0]],
  });
  assert.equal(migrated.version, 4);
  assert.equal(migrated.completedLevels[DEMO_LEVEL_ID].bestStars, 2);
  assert.deepEqual(migrated.completedMissionIds, ['task-enter-number-island']);
  assert.deepEqual(migrated.collectedStarIds, [DEMO_COLLECTIBLE_STAR_IDS[0]]);
  assert.deepEqual(migrated.challengeRecords, {});
});

test('場景星星只收集一次，重新載入後仍與答題最佳星數分開保存', () => {
  const storage = createMemoryStorage();
  let progress = recordDemoCompletion(createEmptyProgress(), 4);
  const first = collectDemoStar(progress, DEMO_COLLECTIBLE_STAR_IDS[0]);
  assert.equal(first.collected, true);
  progress = first.progress;
  const repeated = collectDemoStar(progress, DEMO_COLLECTIBLE_STAR_IDS[0]);
  assert.equal(repeated.collected, false);
  assert.equal(repeated.progress.completedLevels[DEMO_LEVEL_ID].bestStars, 4);
  assert.equal(writeProgress(storage, repeated.progress), true);
  const restored = readProgress(storage);
  assert.deepEqual(restored.collectedStarIds, [DEMO_COLLECTIBLE_STAR_IDS[0]]);
  assert.equal(restored.completedLevels[DEMO_LEVEL_ID].bestStars, 4);
  assert.equal(restored.completedMissionIds.length, 0);
});
