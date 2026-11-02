import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const cases = [
  {
    activityId: 'ACT-G3-MATH-TIMEKEEPER-CANDIDATE', stageId: 'match-analog-clock-to-digital-time',
    prompt: '觀察鐘面，找出相同的數位時刻。', options: ['4:45', '4:15', '9:45'], correctOptionIds: ['digital-445'],
    forbidden: ['4:45'], methodTerms: ['分針', '時針', '分鐘'],
  },
  {
    activityId: 'ACT-G3-MATH-TIMEKEEPER-CANDIDATE', stageId: 'integrated-read-clock-and-elapsed-time',
    prompt: '綜合任務：鐘面是開始時刻，若任務在 2:40 結束，經過幾分鐘？', options: ['30 分鐘', '20 分鐘', '50 分鐘'], correctOptionIds: ['integrated-30'],
    forbidden: ['30 分鐘', '2:10 數到 2:40'], methodTerms: ['開始時刻', '結束時刻', '相差'],
  },
  {
    activityId: 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE', stageId: 'identify-circle-center',
    prompt: '觀察圖中的紅色標示，這個點叫什麼？', options: ['圓心', '半徑', '圓周'], correctOptionIds: ['circle-center'],
    forbidden: ['圓心'], methodTerms: ['紅點', '正中央'],
  },
  {
    activityId: 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE', stageId: 'identify-circle-radius',
    prompt: '觀察圖中的紅色標示，這段線叫什麼？', options: ['半徑', '直徑', '圓周'], correctOptionIds: ['circle-radius'],
    forbidden: ['半徑'], methodTerms: ['線段', '端', '圓周'],
  },
  {
    activityId: 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE', stageId: 'identify-circle-diameter',
    prompt: '觀察圖中的紅色標示，這段穿過圓心、連到圓周兩側的線叫什麼？', options: ['直徑', '半徑', '圓周'], correctOptionIds: ['circle-diameter'],
    forbidden: ['直徑'], methodTerms: ['穿過中間的點', '兩端', '圓周'],
  },
  {
    activityId: 'ACT-G3-MATH-DIVISION-GROUPS-MULTIPLICATION-CHECK-CANDIDATE', stageId: 'write-exact-division-equation',
    prompt: '依剛才的模型，哪個算式表示「18 份，每袋 3 份，可以裝幾袋」？', options: ['18÷3=6', '3÷18=6', '18×3=6'], correctOptionIds: ['equation-18-div-3'],
    forbidden: ['18÷3=6', '18 ÷ 3 = 6'], methodTerms: ['總共有多少份', '每袋放幾份', '哪一種運算'],
  },
  {
    activityId: 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE', stageId: 'pay-market-basket-one-hundred',
    prompt: '野餐籃要付 100 元。選取一種錢幣組合，讓付款剛好是 100 元。',
    options: ['100 元紙鈔', '50 元硬幣 A', '50 元硬幣 B', '10 元硬幣 A', '10 元硬幣 B', '10 元硬幣 C', '10 元硬幣 D', '10 元硬幣 E', '5 元硬幣', '1 元硬幣'],
    correctOptionIds: ['g2-100-note-a'], forbidden: ['100 元紙鈔', '兩枚 50 元', '50 元硬幣，都能組成'],
    methodTerms: ['每種錢幣', '加起來', '剛好 100 元'],
  },
  {
    activityId: 'ACT-G4-MATH-INTEGER-FRACTION-DECIMAL-NUMBER-LINE-CANDIDATE', stageId: 'connect-six-tenths-five-thirds',
    prompt: '哪個分數和數線上的 0.6 表示同一個位置？', options: ['3/5', '2/5', '3/10'], correctOptionIds: ['three-fifths'],
    forbidden: ['3/5', '6/10'], methodTerms: ['十分之幾', '同一個位置'],
  },
  {
    activityId: 'ACT-G4-MATH-ELAPSED-TIME-TRANSIT-CANDIDATE', stageId: 'select-noon-crossing-arrival',
    prompt: '10:35 出發，經過 1 小時 40 分，哪個是 24 小時制到達時間？', options: ['12:15', '11:15', '13:15'], correctOptionIds: ['1215'],
    forbidden: ['12:15', '11:00'], methodTerms: ['40 分鐘', '跨過中午'],
  },
  {
    activityId: 'ACT-G4-MATH-ELAPSED-TIME-TRANSIT-CANDIDATE', stageId: 'select-next-day-arrival',
    prompt: '23:20 出發，經過 2 小時 15 分，到達時間是哪一個？', options: ['隔天 01:35', '當天 01:35', '隔天 00:35'], correctOptionIds: ['next-day-0135'],
    forbidden: ['01:35', '1 小時 35 分', '95 分'], methodTerms: ['午夜', '剩下的時間', '日期'],
  },
  {
    activityId: 'ACT-G5-SCIENCE-REPEAT-MEASURE-RELIABILITY-CANDIDATE', stageId: 'compare-measurement-spread',
    prompt: '哪一組的讀值差異較大，因此重複結果較不一致？', options: ['B 組', 'A 組', '兩組完全一樣'], correctOptionIds: ['group-b'],
    forbidden: ['B 組', '9.2', '10.8'], methodTerms: ['最大值', '最小值', '差距'],
  },
];

test('specified answer-leak stages keep their prompts, options and answers while hints teach a method', () => {
  assert.equal(cases.length, 11);

  for (const item of cases) {
    const activity = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === item.activityId);
    const stage = activity?.stages.find(({ stageId }) => stageId === item.stageId);
    assert.ok(stage, `${item.activityId}/${item.stageId} exists`);
    assert.equal(stage.prompt, item.prompt, `${item.stageId} prompt is unchanged`);
    assert.deepEqual(stage.options.map(({ text }) => text), item.options, `${item.stageId} options are unchanged`);
    assert.deepEqual(stage.correctOptionIds, item.correctOptionIds, `${item.stageId} correct answer is unchanged`);
    assert.equal(stage.hints.length, 2, `${item.stageId} keeps two hint levels`);
    const hints = stage.hints.join(' ');
    for (const answerLeak of item.forbidden) assert.equal(hints.includes(answerLeak), false, `${item.stageId} hint leaks ${answerLeak}`);
    for (const term of item.methodTerms) assert.ok(hints.includes(term), `${item.stageId} hints retain method cue: ${term}`);
  }
});
