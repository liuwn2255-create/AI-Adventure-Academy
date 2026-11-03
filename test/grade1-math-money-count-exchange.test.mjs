import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const activity = MATH_CURRICULUM_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G1-MATH-MONEY-COUNT-EXCHANGE-CANDIDATE');
const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

function dispatchOk(session, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} should work`);
  return result.session;
}

function reviewed(text, tokens) {
  assert.ok(Array.isArray(tokens), `missing pronunciation: ${text}`);
  assert.equal(tokens.map(({ text: glyph }) => glyph).join(''), text);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `digits/symbols stay unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/u);
}

function submitCoinSet(optionIds, suffix) {
  let session = dispatchOk(createLearningTaskSession(activity, `money-${suffix}`), 'start');
  for (const optionId of optionIds) session = dispatchOk(session, 'toggle_evidence', { optionId });
  return dispatchLearningTask(session, activity, 'submit', { submissionId: `money-${suffix}-submit` });
}

test('兩種 10 元硬幣組合都可依 acceptedOptionSets 得分，50 元組合仍錯', () => {
  const stage = activity.stages[0];
  assert.equal(stage.stageId, 'pay-seventeen-with-coins');
  assert.equal(stage.requiredSelectionCount, 4);
  assert.deepEqual(stage.correctOptionIds, ['coin-10-a', 'coin-5', 'coin-1-a', 'coin-1-b']);
  assert.deepEqual(stage.acceptedOptionSets, [['coin-10-b', 'coin-5', 'coin-1-a', 'coin-1-b']]);
  const values = Object.fromEntries(stage.options.map(({ id, valueAmount }) => [id, valueAmount]));
  assert.deepEqual(values, { 'coin-10-a': 10, 'coin-5': 5, 'coin-1-a': 1, 'coin-1-b': 1, 'coin-10-b': 10, 'coin-50': 50 });
  const setA = submitCoinSet(['coin-10-a', 'coin-5', 'coin-1-a', 'coin-1-b'], 'set-a');
  const setB = submitCoinSet(['coin-10-b', 'coin-5', 'coin-1-a', 'coin-1-b'], 'set-b');
  const fifty = submitCoinSet(['coin-50', 'coin-5', 'coin-1-a', 'coin-1-b'], 'fifty');
  assert.equal(setA.attempt.result, 'correct');
  assert.equal(setB.attempt.result, 'correct');
  assert.equal(fifty.attempt.result, 'incorrect');
});

test('錢幣呈現依 valueAmount 顯示所選總額，選取數不代替金額 scoring', () => {
  const stage = activity.stages[0];
  assert.equal(stage.options.every(({ valueAmount }) => Number.isFinite(valueAmount)), true);
  assert.equal(stage.options.reduce((sum, option) => sum + (['coin-10-b', 'coin-5', 'coin-1-a'].includes(option.id) ? option.valueAmount : 0), 0), 16);
  assert.match(app, /const isMoneySelection = stage\.options\.every\(\(option\) => Number\.isFinite\(option\.valueAmount\)\)/u);
  assert.match(app, /reduce\(\(sum, option\) => sum \+ option\.valueAmount, 0\)/u);
  assert.match(app, /lowGradeMoney[\s\S]*?appendMoneyUiText\(selectionSummaryNode/u);
  assert.equal(stage.correctOptionIds.length, stage.requiredSelectionCount);
  const values = Object.fromEntries(stage.options.map(({ id, valueAmount }) => [id, valueAmount]));
  assert.equal(stage.correctOptionIds.reduce((sum, id) => sum + values[id], 0), 17);
  assert.ok(stage.options.some(({ id, valueAmount }) => id === 'coin-50' && valueAmount === 50));
  assert.match(stage.studentOperationGuidance, /剛好 17 元/u);
});

test('兩關保留找零答案，主要文字有注音且評量限制只在教師欄位', () => {
  const [pay, change] = activity.stages;
  assert.equal(activity.title, '小小錢幣市集：數錢與找錢');
  assert.doesNotMatch(activity.title, /換錢/u);
  assert.equal(activity.learningObjective.statement, '選出指定金額的錢幣，再找出找回的金額。');
  assert.deepEqual(change.correctOptionIds, ['change-3']);
  assert.equal(change.options.find(({ id }) => id === 'change-3').text, '3 元');
  assert.equal(pay.teacherLimitationNote, '畫面錢幣是模擬素材，不能替代實體數錢。');
  assert.equal(change.teacherLimitationNote, '本情境只練一個找零問題，不代表熟練全部數錢與換錢。');
  assert.doesNotMatch(pay.correctFeedback, /不能替代/u);
  assert.doesNotMatch(change.correctFeedback, /不代表|全部數錢/u);
  for (const stage of [pay, change]) {
    reviewed(stage.prompt, stage.promptPronunciationTokens);
    for (const hint of stage.hints) reviewed(hint.text, hint.pronunciationTokens);
    reviewed(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    reviewed(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    if (stage.studentOperationGuidance) reviewed(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
    for (const option of stage.options) {
      reviewed(option.text, option.pronunciationTokens);
      if (option.feedback) reviewed(option.feedback, option.feedbackPronunciationTokens);
    }
  }
});
