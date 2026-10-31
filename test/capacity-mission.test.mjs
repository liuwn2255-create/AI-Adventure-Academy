import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPACITY_MISSION_CONFIG, CAPACITY_OBSERVATION_SCENARIOS, createCapacityMission, createCapacityObservationSession, createCapacityOnboarding } from '../prototype/capacityMission.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';
import { PLAYABLE_LEVELS, PROGRESS_LEVELS } from '../prototype/data/levelCatalog.js';
import { createEmptyProgress, DEMO_PROGRESS_KEY } from '../prototype/mapProgress.js';

test('水量限制在 0 至 1000 毫升，顯示數字與水位比例同步', () => {
  const mission = createCapacityMission();
  assert.equal(mission.adjustWaterMl(-100).waterMl, 0);
  const half = mission.setWaterMl(500);
  assert.equal(half.fillPercent, 50);
  assert.equal(half.displayAmount, '500 毫升');
  assert.equal(half.displayCapacity, '1 公升（1000 毫升）');
  assert.equal(mission.setWaterMl(1500).waterMl, 1000);
});

test('只有設定到目標水量才能完成任務並領取一次性回饋', () => {
  const mission = createCapacityMission();
  assert.equal(mission.confirm().correct, false);
  mission.setWaterMl(CAPACITY_MISSION_CONFIG.targetMl);
  const first = mission.confirm();
  assert.equal(first.correct, true);
  assert.equal(first.rewardGranted, true);
  assert.equal(mission.confirm().rewardGranted, false);
});

test('答錯後可以繼續調整並再次確認', () => {
  const mission = createCapacityMission();
  mission.setWaterMl(400);
  assert.equal(mission.confirm().correct, false);
  assert.equal(mission.getState().completed, false);
  mission.adjustWaterMl(100);
  assert.equal(mission.confirm().correct, true);
});

test('重新開始重設水量與完成狀態，但不重複發放已領獎勵', () => {
  const mission = createCapacityMission();
  mission.setWaterMl(500);
  assert.equal(mission.confirm().rewardGranted, true);
  const restarted = mission.restart();
  assert.equal(restarted.waterMl, 0);
  assert.equal(restarted.completed, false);
  mission.setWaterMl(500);
  assert.equal(mission.confirm().rewardGranted, false);
});

test('容量原型不寫入既有關卡進度，也不加入正式可玩或進度清單', () => {
  const preservedProgress = { ...createEmptyProgress(), completedLevels: { 'math-place-value-demo': { completed: true, bestStars: 4 } } };
  const storage = new Map([[DEMO_PROGRESS_KEY, JSON.stringify(preservedProgress)]]);
  const storageBefore = storage.get(DEMO_PROGRESS_KEY);
  const mission = createCapacityMission();
  mission.setWaterMl(500);
  mission.confirm();
  mission.restart();
  assert.equal(storage.get(DEMO_PROGRESS_KEY), storageBefore);
  assert.deepEqual(PLAYABLE_LEVELS.map(({ id }) => id), [
    'math-place-value-demo', 'number-secret-challenge', 'math-number-comparison-candidate',
  ]);
  assert.deepEqual(PROGRESS_LEVELS.map(({ id }) => id), PLAYABLE_LEVELS.map(({ id }) => id));
  const entry = MATH_LEVEL_DIRECTORY.find(({ levelId }) => levelId === 'math-capacity-candidate');
  assert.equal(entry.runtime.availability, 'catalog_only');
  assert.equal(entry.publicationStatus, 'not_approved');
  assert.equal(entry.questionCount, 0);
});

test('容量單位資料沿用已登錄來源，且仍明確標示待審', () => {
  assert.equal(CAPACITY_MISSION_CONFIG.status, 'prototype_pending_teacher_review');
  assert.equal(CAPACITY_MISSION_CONFIG.capacityMl, 1000);
  assert.equal(CAPACITY_MISSION_CONFIG.curriculumReferences.learningContentCode, 'N-3-15');
  assert.equal(CAPACITY_MISSION_CONFIG.curriculumReferences.stagePerformanceCode, 'n-II-9');
  assert.match(CAPACITY_MISSION_CONFIG.curriculumReferences.note, /仍待確認/);
});

test('刻度觀察提供至少三個整百毫升情境，水位比例、刻度位置及答案資料一致', () => {
  assert.ok(CAPACITY_OBSERVATION_SCENARIOS.length >= 3);
  for (const [index, scenario] of CAPACITY_OBSERVATION_SCENARIOS.entries()) {
    assert.equal(scenario.waterMl % 100, 0);
    assert.equal(scenario.waterMl / 10, (scenario.waterMl / 1000) * 100);
    assert.equal(100 - (scenario.waterMl / 1000) * 100, 100 - scenario.waterMl / 10);
    const correctOption = scenario.options.find(({ optionId }) => optionId === scenario.answerOptionId);
    assert.ok(correctOption, `情境 ${index + 1} 的答案 ID 存在`);
    assert.equal(correctOption.text, `${scenario.waterMl} 毫升`);
  }
});

test('刻度判讀可隱藏數字、顯示刻度答案並提供判斷解析', () => {
  const session = createCapacityObservationSession();
  let state = session.getState();
  assert.equal(state.amountHidden, true);
  assert.equal(state.displayAmount, '先觀察刻度再判斷');
  assert.equal(state.fillPercent, 30);
  session.setAmountHidden(false);
  state = session.getState();
  assert.equal(state.displayAmount, '300 毫升');
  session.setAmountHidden(true);
  assert.equal(session.getState().amountHidden, true);
  session.selectOption(state.answerOptionId);
  const result = session.submitAnswer();
  assert.equal(result.correct, true);
  assert.match(result.state.explanation, /300 毫升刻度/);
});

test('錯誤判讀只提供提示並可再次選答，不直接揭露答案', () => {
  const session = createCapacityObservationSession();
  const initial = session.getState();
  const wrong = initial.options.find(({ optionId }) => optionId !== initial.answerOptionId);
  session.selectOption(wrong.optionId);
  const result = session.submitAnswer();
  assert.equal(result.correct, false);
  assert.equal(result.state.solved, false);
  assert.equal(result.state.lastResult, 'retry');
  assert.ok(result.state.hint);
  assert.equal(result.state.answerOptionId, initial.answerOptionId);
  session.selectOption(initial.answerOptionId);
  assert.equal(session.submitAnswer().correct, true);
});

test('切換刻度情境會同步更新水位、選項與答案；未答對前不能前進', () => {
  const session = createCapacityObservationSession();
  assert.equal(session.nextScenario().scenarioIndex, 0);
  let state = session.getState();
  session.selectOption(state.answerOptionId);
  session.submitAnswer();
  state = session.nextScenario();
  assert.equal(state.scenarioIndex, 1);
  assert.equal(state.waterMl, 600);
  assert.equal(state.fillPercent, 60);
  assert.equal(state.displayAmount, '先觀察刻度再判斷');
  assert.ok(state.options.some(({ optionId }) => optionId === state.answerOptionId && optionId.includes('600')));
  assert.equal(state.selectedOptionId, null);
  assert.equal(state.solved, false);
});

test('刻度觀察重玩回到第一情境，且不改動既有關卡 localStorage 資料', () => {
  const progress = { ...createEmptyProgress(), completedLevels: { 'math-place-value-demo': { completed: true, bestStars: 5 } } };
  const storage = new Map([[DEMO_PROGRESS_KEY, JSON.stringify(progress)]]);
  const before = storage.get(DEMO_PROGRESS_KEY);
  const session = createCapacityObservationSession();
  const first = session.getState();
  session.selectOption(first.answerOptionId);
  session.submitAnswer();
  session.nextScenario();
  const restarted = session.restart();
  assert.equal(restarted.scenarioIndex, 0);
  assert.equal(restarted.solved, false);
  assert.equal(restarted.amountHidden, true);
  assert.equal(storage.get(DEMO_PROGRESS_KEY), before);
  assert.deepEqual(PLAYABLE_LEVELS.map(({ id }) => id), [
    'math-place-value-demo', 'number-secret-challenge', 'math-number-comparison-candidate',
  ]);
});

test('首次進入顯示引導；開始練習與略過都能前往模式選擇或練習', () => {
  const started = createCapacityOnboarding();
  assert.equal(started.enter(), 'guide');
  assert.equal(started.startPractice(), 'practice');
  assert.equal(started.hasSeenGuide(), true);
  assert.equal(started.enter(), 'mode_select');

  const skipped = createCapacityOnboarding();
  assert.equal(skipped.enter(), 'guide');
  assert.equal(skipped.skip(), 'mode_select');
  assert.equal(skipped.enter(), 'mode_select');
});

test('練習模式顯示水量且不能隱藏；挑戰模式可以隱藏水量', () => {
  const session = createCapacityObservationSession();
  let state = session.setMode('practice');
  assert.equal(state.mode, 'practice');
  assert.equal(state.amountHidden, false);
  assert.equal(state.displayAmount, '300 毫升');
  assert.equal(session.setAmountHidden(true).amountHidden, false);

  state = session.setMode('challenge');
  assert.equal(state.mode, 'challenge');
  assert.equal(state.amountHidden, true);
  assert.equal(state.displayAmount, '先觀察刻度再判斷');
});

test('錯答逐步提供提示，再答對後標記為經提示成功', () => {
  const session = createCapacityObservationSession();
  const state = session.getState();
  const wrong = state.options.find(({ optionId }) => optionId !== state.answerOptionId);
  session.selectOption(wrong.optionId);
  const firstWrong = session.submitAnswer().state;
  assert.equal(firstWrong.attempts, 1);
  const firstHint = firstWrong.hint;

  session.selectOption(wrong.optionId);
  const secondWrong = session.submitAnswer().state;
  assert.equal(secondWrong.attempts, 2);
  assert.notEqual(secondWrong.hint, firstHint);

  session.selectOption(state.answerOptionId);
  const correct = session.submitAnswer().state;
  assert.equal(correct.solved, true);
  assert.equal(correct.review, null);
  assert.equal(correct.attempts, 3);
});

test('完成一輪後回顧分開計算首次答對與提示後答對，並列出每個情境', () => {
  const session = createCapacityObservationSession();
  const answerCurrent = (correct) => {
    const state = session.getState();
    if (!correct) {
      const wrong = state.options.find(({ optionId }) => optionId !== state.answerOptionId);
      session.selectOption(wrong.optionId);
      session.submitAnswer();
    }
    const current = session.getState();
    session.selectOption(current.answerOptionId);
    session.submitAnswer();
  };

  answerCurrent(true);
  session.nextScenario();
  answerCurrent(false);
  session.nextScenario();
  answerCurrent(true);

  const review = session.getState().review;
  assert.equal(review.completedScenarioCount, 3);
  assert.equal(review.correctReadingCount, 3);
  assert.equal(review.firstTryCorrectCount, 2);
  assert.equal(review.afterHintCorrectCount, 1);
  assert.deepEqual(review.needsPractice, ['observe-600ml']);
  assert.deepEqual(review.scenarioDetails.map(({ correctWaterMl }) => correctWaterMl), [300, 600, 900]);
  assert.ok(review.scenarioDetails.every(({ explanation }) => explanation.length > 0));
});

test('重玩清除當輪回顧統計，不寫入 localStorage 或改動正式關卡進度', () => {
  const progress = { ...createEmptyProgress(), completedLevels: { 'math-place-value-demo': { completed: true, bestStars: 4 } } };
  const storage = new Map([[DEMO_PROGRESS_KEY, JSON.stringify(progress)]]);
  const before = storage.get(DEMO_PROGRESS_KEY);
  const session = createCapacityObservationSession();
  for (let index = 0; index < CAPACITY_OBSERVATION_SCENARIOS.length; index += 1) {
    const state = session.getState();
    session.selectOption(state.answerOptionId);
    session.submitAnswer();
    if (index < CAPACITY_OBSERVATION_SCENARIOS.length - 1) session.nextScenario();
  }
  assert.equal(session.getState().review.firstTryCorrectCount, 3);
  const restarted = session.restart();
  assert.equal(restarted.review, null);
  assert.equal(restarted.attempts, 0);
  assert.equal(storage.get(DEMO_PROGRESS_KEY), before);
});
