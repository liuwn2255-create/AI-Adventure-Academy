import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE1_MATH_QUANTITY_GARDEN as activity } from '../prototype/data/grade1MathQuantityGarden.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled, renderStudentText } from '../prototype/studentTextRenderer.js';

function assertAnnotated(text, tokens) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `missing pronunciation tokens: ${text}`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading: ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han character should not have a reading: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/);
}

function submit(session, submissionId) {
  return dispatchLearningTask(session, activity, 'submit', { submissionId });
}

test('數字果園保留活動、stage、目標數量與答案 ID', () => {
  assert.equal(activity.activityId, 'ACT-G1-MATH-QUANTITY-GARDEN-CANDIDATE');
  assert.deepEqual(activity.stages.map(({ stageId }) => stageId), ['arrange-eight-fruits', 'match-fruit-count']);
  assert.deepEqual(activity.stages[0].arrayRules, { targetRows: 2, targetColumns: 4, maxRows: 4, maxColumns: 5 });
  assert.deepEqual(activity.stages[1].correctOptionIds, ['fruit-count-8']);
  assert.deepEqual(activity.stages[1].options.map(({ id }) => id), ['fruit-count-6', 'fruit-count-8', 'fruit-count-9']);
});

test('兩關主要學生文字與選項回饋都有逐字人工注音，數字保持原樣', () => {
  const [arrayStage, countStage] = activity.stages;
  assertAnnotated(arrayStage.prompt, arrayStage.promptPronunciationTokens);
  for (const hint of arrayStage.hints) assertAnnotated(hint.text, hint.pronunciationTokens);
  assertAnnotated(arrayStage.correctFeedback, arrayStage.correctFeedbackPronunciationTokens);
  assertAnnotated(arrayStage.incorrectFeedback, arrayStage.incorrectFeedbackPronunciationTokens);
  assert.equal(arrayStage.incorrectFeedback, '再看一看：有 2 排嗎？每排都有 4 個嗎？');
  const maTokens = arrayStage.incorrectFeedbackPronunciationTokens.filter(({ text }) => text === '嗎');
  assert.equal(maTokens.length, 2);
  assert.deepEqual(maTokens[1], { text: '嗎', reading: 'ㄇㄚ˙' });
  assert.deepEqual(arrayStage.incorrectFeedbackPronunciationTokens.at(-1), { text: '？' });

  assertAnnotated(countStage.prompt, countStage.promptPronunciationTokens);
  for (const option of countStage.options) {
    assertAnnotated(option.text, option.pronunciationTokens);
    assertAnnotated(option.feedback, option.feedbackPronunciationTokens);
  }
  for (const hint of countStage.hints) assertAnnotated(hint.text, hint.pronunciationTokens);
  assertAnnotated(countStage.correctFeedback, countStage.correctFeedbackPronunciationTokens);
  assertAnnotated(countStage.incorrectFeedback, countStage.incorrectFeedbackPronunciationTokens);

  for (const stage of [arrayStage, countStage]) {
    for (const text of [stage.prompt, stage.correctFeedback, stage.incorrectFeedback]) {
      for (const digit of text.matchAll(/[0-9]/gu)) {
        const token = (stage.prompt === text ? stage.promptPronunciationTokens : stage.correctFeedback === text ? stage.correctFeedbackPronunciationTokens : stage.incorrectFeedbackPronunciationTokens)
          .find(({ text: tokenText }) => tokenText === digit[0]);
        assert.equal(token?.reading, undefined);
      }
    }
  }
  assert.equal(arrayStage.hints[1].text.includes('×'), false);
  assert.doesNotMatch(arrayStage.hints[1].text, /乘法|排數\s*[×x]\s*每排/u);
});

test('Grade 1–2 build_array 操作說明具體，Grade 3–6 保留原說明', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const branch = app.match(/stage\.interaction === 'build_array'[\s\S]{0,260}?stage\.interaction === 'choose_response'/u)?.[0];
  assert.ok(branch, 'build_array guidance branch should exist');
  assert.match(branch, /isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/u);
  assert.match(branch, /怎麼玩：① 按按鈕排果子 → ② 看排數和每排幾個 → ③ 排好後檢查答案/u);
  assert.match(branch, /操作方式：① 操作 → ② 觀察 → ③ 作答/u);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-1'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-2'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-3'), false);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-6'), false);
});

test('低年級 build_array 固定操作與狀態文字使用人工注音，數字和運算符號保持原樣', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const mapSource = app.match(/const BUILD_ARRAY_UI_PRONUNCIATION = Object\.freeze\(\{([\s\S]*?)\n\}\);/u)?.[1];
  assert.ok(mapSource, 'manual build_array pronunciation map should exist');
  const pronunciationMap = new Map([...mapSource.matchAll(/^\s*'([^']+)': '([^']+)',?$/gmu)].map(([, text, readings]) => [text, readings]));
  const expected = [
    ['少一排', 'ㄕㄠˇ ㄧˋ ㄆㄞˊ'],
    ['增加一排', 'ㄗㄥ ㄐㄧㄚ ㄧˋ ㄆㄞˊ'],
    ['每排少一個', 'ㄇㄟˇ ㄆㄞˊ ㄕㄠˇ ㄧˊ ㄍㄜˋ'],
    ['每排多一個', 'ㄇㄟˇ ㄆㄞˊ ㄉㄨㄛ ㄧˊ ㄍㄜˋ'],
    ['目前陣列：', 'ㄇㄨˋ ㄑㄧㄢˊ ㄓㄣˋ ㄌㄧㄝˋ'],
    [' 排 × 每排 ', 'ㄆㄞˊ ㄇㄟˇ ㄆㄞˊ'],
    [' 個；總數 = ', 'ㄍㄜˋ ㄗㄨㄥˇ ㄕㄨˋ'],
    [' 個', 'ㄍㄜˋ'],
    ['調整排數與每排數量，建立物件陣列。', 'ㄊㄧㄠˊ ㄓㄥˇ ㄆㄞˊ ㄕㄨˋ ㄩˇ ㄇㄟˇ ㄆㄞˊ ㄕㄨˋ ㄌㄧㄤˋ ㄐㄧㄢˋ ㄌㄧˋ ㄨˋ ㄐㄧㄢˋ ㄓㄣˋ ㄌㄧㄝˋ'],
  ];
  for (const [text, readings] of expected) assert.equal(pronunciationMap.get(text), readings, `manual readings for ${text}`);
  assert.equal(pronunciationMap.has('怎麼玩：① 按按鈕排果子 → ② 看排數和每排幾個 → ③ 排好後檢查答案'), true);
  assert.match(app, /appendStudentText\(parent, text, buildArrayUiPronunciationTokens\(text\)\)/u);
  assert.match(app, /if \(!\/\\p\{Script=Han\}\/u\.test\(character\)\) return \{ text: character \}/u);
  assert.match(app, /const lowGradeBuildArray = stage\.interaction === 'build_array' && isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/u);
  assert.match(app, /if \(lowGradeBuildArray\) appendBuildArrayUiText\(control, label, appendStudentText\)/u);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-1'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-2'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-3'), false);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-6'), false);
});

test('build_array 四個按鈕保留原 action，僅在 state 實際改變後播放單次操作音', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const controls = app.match(/for \(const \[label, dimension, delta\] of \[\['少一排'[\s\S]*?controls\.append\(control\);\n    \}/u)?.[0];
  assert.ok(controls, 'the four build_array buttons should be rendered together');
  assert.match(controls, /control\.type = 'button'/u);
  assert.match(controls, /control\.addEventListener\('click'/u);
  assert.match(controls, /dispatch\('adjust_array_dimension', \{ dimension, delta \}\)/u);
  assert.match(controls, /if \(result\.session\[key\] !== previousValue\) playBuildArrayFeedbackTone\(delta\)/u);
  assert.equal((controls.match(/playBuildArrayFeedbackTone\(delta\)/gu) ?? []).length, 1);

  const toneHelper = app.match(/function playBuildArrayFeedbackTone\(delta\) \{([\s\S]*?)\n\}/u)?.[1];
  assert.ok(toneHelper, 'short feedback tone helper should exist');
  assert.match(toneHelper, /globalThis\.AudioContext \?\? globalThis\.webkitAudioContext/u);
  assert.match(toneHelper, /const rising = delta > 0/u);
  assert.match(toneHelper, /linearRampToValueAtTime\(rising \? 620 : 390, startAt \+ 0\.085\)/u);
  assert.match(toneHelper, /gain\.gain\.linearRampToValueAtTime\(0\.025, startAt \+ 0\.008\)/u);
  assert.match(toneHelper, /oscillator\.stop\(startAt \+ 0\.1\)/u);
  assert.doesNotMatch(toneHelper, /isSpeechEnabled|speak\(/u);
  assert.doesNotMatch(app.slice(app.indexOf('function playBuildArrayFeedbackTone'), app.indexOf('const screens')), /setInterval|\.loop\s*=/u);
});

test('兩關仍沿用既有 build_array 與 choose_response scoring', () => {
  let session = dispatchLearningTask(createLearningTaskSession(activity, 'quantity-garden-score'), activity, 'start').session;
  for (let index = 0; index < 2; index += 1) session = dispatchLearningTask(session, activity, 'adjust_array_dimension', { dimension: 'rows', delta: 1 }).session;
  for (let index = 0; index < 4; index += 1) session = dispatchLearningTask(session, activity, 'adjust_array_dimension', { dimension: 'columns', delta: 1 }).session;
  const arrayResult = submit(session, 'quantity-garden-array-correct');
  assert.equal(arrayResult.attempt.result, 'correct');
  session = dispatchLearningTask(arrayResult.session, activity, 'next').session;
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: 'fruit-count-8' }).session;
  const countResult = submit(session, 'quantity-garden-count-correct');
  assert.equal(countResult.attempt.result, 'correct');
  assert.equal(countResult.session.phase, 'success');
});

test('評量限制留在教師資訊，不混入學生正答回饋', async () => {
  const countStage = activity.stages[1];
  assert.equal(countStage.correctFeedback, '答對了！一共有 8 個果子。');
  assert.doesNotMatch(countStage.correctFeedback, /不能據此判定|已掌握一百以內數|位值/u);
  assert.equal(countStage.teacherLimitationNote, '本活動只練習此小數量，不能據此判定已掌握一百以內數或位值。');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(app, /addInfo\('本關研究限制', stage\?\.teacherLimitationNote\)/u);
});
