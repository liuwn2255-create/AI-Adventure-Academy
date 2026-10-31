export const CAPACITY_MISSION_CONFIG = Object.freeze({
  id: 'capacity-canteen-prototype',
  title: '探險隊水壺補給站',
  status: 'prototype_pending_teacher_review',
  capacityMl: 1000,
  targetMl: 500,
  adjustmentStepMl: 100,
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-capacity-measurement',
    learningContentCode: 'N-3-15',
    stagePerformanceCode: 'n-II-9',
    note: '僅沿用專案已登錄的課綱參照；年級教學時序、教材範圍及教師審查仍待確認。',
  }),
});

export const CAPACITY_OBSERVATION_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'observe-300ml',
    waterMl: 300,
    options: Object.freeze([
      Object.freeze({ optionId: 'observe-300ml-200', text: '200 毫升' }),
      Object.freeze({ optionId: 'observe-300ml-300', text: '300 毫升' }),
      Object.freeze({ optionId: 'observe-300ml-400', text: '400 毫升' }),
    ]),
    answerOptionId: 'observe-300ml-300',
    explanation: '水面和 300 毫升刻度對齊，所以量杯裡有 300 毫升。',
    hint: '看看水面旁邊的刻度線，再比較選項。',
    hints: Object.freeze(['從杯底往上找刻度，看看水面碰到哪一條線。', '每個小刻度是 100 毫升，試著數到水面的位置。']),
  }),
  Object.freeze({
    id: 'observe-600ml',
    waterMl: 600,
    options: Object.freeze([
      Object.freeze({ optionId: 'observe-600ml-500', text: '500 毫升' }),
      Object.freeze({ optionId: 'observe-600ml-600', text: '600 毫升' }),
      Object.freeze({ optionId: 'observe-600ml-700', text: '700 毫升' }),
    ]),
    answerOptionId: 'observe-600ml-600',
    explanation: '水面對齊 600 毫升刻度，答案是 600 毫升。',
    hint: '水面在 500 毫升上方一格，試著再看一次刻度。',
    hints: Object.freeze(['先找到 500 毫升標籤，再觀察水面在哪一側。', '從 500 毫升往上數小刻度，每一格增加 100 毫升。']),
  }),
  Object.freeze({
    id: 'observe-900ml',
    waterMl: 900,
    options: Object.freeze([
      Object.freeze({ optionId: 'observe-900ml-800', text: '800 毫升' }),
      Object.freeze({ optionId: 'observe-900ml-900', text: '900 毫升' }),
      Object.freeze({ optionId: 'observe-900ml-1000', text: '1000 毫升' }),
    ]),
    answerOptionId: 'observe-900ml-900',
    explanation: '水面在 800 毫升上方一格，對齊 900 毫升刻度。',
    hint: '容器最上方是 1000 毫升，往下每一小格少 100 毫升。',
    hints: Object.freeze(['先看最上方 1000 毫升，再找到下方的 800 毫升標籤。', '水面位於 800 毫升和 1000 毫升之間，數一格看看。']),
  }),
]);

/** In-memory first-entry guide state; it intentionally does not use storage. */
export function createCapacityOnboarding() {
  let guideSeen = false;
  return Object.freeze({
    enter() { return guideSeen ? 'mode_select' : 'guide'; },
    startPractice() { guideSeen = true; return 'practice'; },
    skip() { guideSeen = true; return 'mode_select'; },
    hasSeenGuide() { return guideSeen; },
  });
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** In-memory prototype session. It never reads or writes browser storage. */
export function createCapacityMission() {
  let waterMl = 0;
  let completed = false;
  let rewardClaimed = false;

  const getState = () => Object.freeze({
    waterMl,
    capacityMl: CAPACITY_MISSION_CONFIG.capacityMl,
    targetMl: CAPACITY_MISSION_CONFIG.targetMl,
    fillPercent: (waterMl / CAPACITY_MISSION_CONFIG.capacityMl) * 100,
    completed,
    rewardClaimed,
    displayAmount: `${waterMl} 毫升`,
    displayCapacity: '1 公升（1000 毫升）',
  });

  return Object.freeze({
    getState,
    setWaterMl(value) {
      if (!Number.isFinite(value)) return getState();
      waterMl = clamp(Math.round(value), 0, CAPACITY_MISSION_CONFIG.capacityMl);
      return getState();
    },
    adjustWaterMl(delta) {
      if (!Number.isFinite(delta)) return getState();
      waterMl = clamp(waterMl + Math.round(delta), 0, CAPACITY_MISSION_CONFIG.capacityMl);
      return getState();
    },
    confirm() {
      if (completed) return Object.freeze({ correct: true, changed: false, rewardGranted: false, state: getState() });
      if (waterMl !== CAPACITY_MISSION_CONFIG.targetMl) {
        return Object.freeze({ correct: false, changed: false, rewardGranted: false, state: getState() });
      }
      completed = true;
      const rewardGranted = !rewardClaimed;
      rewardClaimed = true;
      return Object.freeze({ correct: true, changed: true, rewardGranted, state: getState() });
    },
    restart() {
      waterMl = 0;
      completed = false;
      return getState();
    },
  });
}

/** Independent read-the-scale practice; all feedback is deterministic and local. */
export function createCapacityObservationSession(scenarios = CAPACITY_OBSERVATION_SCENARIOS) {
  let scenarioIndex = 0;
  let mode = 'challenge';
  let amountHidden = true;
  let selectedOptionId = null;
  let solved = false;
  let lastResult = null;
  let attempts = scenarios.map(() => 0);
  let records = [];

  const createReview = () => Object.freeze({
    completedScenarioCount: records.length,
    correctReadingCount: records.length,
    firstTryCorrectCount: records.filter(({ firstTryCorrect }) => firstTryCorrect).length,
    afterHintCorrectCount: records.filter(({ firstTryCorrect }) => !firstTryCorrect).length,
    needsPractice: records.filter(({ firstTryCorrect }) => !firstTryCorrect).map(({ scenarioId }) => scenarioId),
    scenarioDetails: Object.freeze(records.map((record) => Object.freeze({ ...record }))),
  });

  const getState = () => {
    const scenario = scenarios[scenarioIndex];
    const wrongCount = attempts[scenarioIndex];
    const hintIndex = Math.min(Math.max(wrongCount - 1, 0), (scenario.hints?.length ?? 1) - 1);
    return Object.freeze({
      scenarioIndex,
      scenarioCount: scenarios.length,
      scenarioId: scenario.id,
      mode,
      attempts: wrongCount,
      waterMl: scenario.waterMl,
      capacityMl: CAPACITY_MISSION_CONFIG.capacityMl,
      fillPercent: (scenario.waterMl / CAPACITY_MISSION_CONFIG.capacityMl) * 100,
      amountHidden,
      displayAmount: amountHidden ? '先觀察刻度再判斷' : `${scenario.waterMl} 毫升`,
      options: scenario.options,
      selectedOptionId,
      solved,
      lastResult,
      answerOptionId: scenario.answerOptionId,
      explanation: scenario.explanation,
      hint: scenario.hints?.[hintIndex] ?? scenario.hint,
      roundComplete: records.length === scenarios.length,
      review: records.length === scenarios.length ? createReview() : null,
    });
  };

  return Object.freeze({
    getState,
    setMode(nextMode) {
      if (!['practice', 'challenge'].includes(nextMode)) return getState();
      mode = nextMode;
      return this.restart();
    },
    setAmountHidden(hidden) {
      if (mode === 'practice') return getState();
      amountHidden = Boolean(hidden);
      return getState();
    },
    selectOption(optionId) {
      const scenario = scenarios[scenarioIndex];
      if (solved || !scenario.options.some(({ optionId: candidate }) => candidate === optionId)) return getState();
      selectedOptionId = optionId;
      return getState();
    },
    submitAnswer() {
      if (solved || !selectedOptionId) return Object.freeze({ changed: false, correct: null, state: getState() });
      const scenario = scenarios[scenarioIndex];
      attempts[scenarioIndex] += 1;
      const correct = selectedOptionId === scenario.answerOptionId;
      solved = correct;
      lastResult = correct ? 'correct' : 'retry';
      if (correct) {
        records = [...records, {
          scenarioId: scenario.id,
          correctWaterMl: scenario.waterMl,
          explanation: scenario.explanation,
          attempts: attempts[scenarioIndex],
          firstTryCorrect: attempts[scenarioIndex] === 1,
        }];
      }
      return Object.freeze({ changed: true, correct, state: getState() });
    },
    nextScenario() {
      if (!solved || scenarioIndex >= scenarios.length - 1) return getState();
      scenarioIndex += 1;
      selectedOptionId = null;
      solved = false;
      lastResult = null;
      amountHidden = mode === 'challenge';
      return getState();
    },
    restart() {
      scenarioIndex = 0;
      amountHidden = mode === 'challenge';
      selectedOptionId = null;
      solved = false;
      lastResult = null;
      attempts = scenarios.map(() => 0);
      records = [];
      return getState();
    },
  });
}
