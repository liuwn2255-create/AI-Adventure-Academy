import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { CONTEXT_WORD_SENTENCE_WORKSHOP } from '../prototype/data/contextWordSentenceWorkshop.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled, renderStudentText } from '../prototype/studentTextRenderer.js';
import { isSpeechEnabled, setSpeechEnabled, speak } from '../prototype/speechService.js';

const appSource = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

test('低年級語音與注音政策只涵蓋一年級和二年級', () => {
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-1'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-2'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-3'), false);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-6'), false);
});

test('注音 metadata 使用 pair markup，沒有 metadata 時仍是安全純文字', () => {
  const rendered = renderStudentText('雨傘', [
    { text: '雨', reading: 'ㄩˇ' }, { text: '傘', reading: 'ㄙㄢˇ' },
  ]);
  assert.match(rendered, /class="zhuyin-pair"><span class="zhuyin-hanzi">雨<\/span><span class="zhuyin-reading" aria-hidden="true"><span class="zhuyin-glyph-column"><span class="zhuyin-glyph">ㄩ<\/span><\/span><span class="zhuyin-tone">ˇ<\/span><\/span><\/span>/);
  assert.equal((rendered.match(/class="zhuyin-pair"/g) ?? []).length, 2);
  assert.doesNotMatch(rendered, /<ruby|<rb|<rt/);
  assert.equal(renderStudentText('雨傘', undefined), '雨傘');
  assert.equal(renderStudentText('<script>題目</script>', undefined), '&lt;script&gt;題目&lt;/script&gt;');
});

test('二年級沒有注音 metadata 時可回退純文字，三年級既有題目與 scoring 正常', () => {
  const grade2 = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G2-CHINESE-STORY-CLUE-CANDIDATE');
  const grade2Stage = grade2.stages.find(({ stageId }) => stageId === 'collect-rain-shelter-clues');
  assert.equal(isLowGradeReadingAssistanceEnabled(grade2.gradeId), true);
  assert.equal(grade2Stage.promptPronunciationTokens, undefined);
  assert.equal(renderStudentText(grade2Stage.prompt, grade2Stage.promptPronunciationTokens), grade2Stage.prompt);

  const grade3 = CONTEXT_WORD_SENTENCE_WORKSHOP;
  const stage = grade3.stages[0];
  assert.equal(isLowGradeReadingAssistanceEnabled(grade3.gradeId), false);
  assert.equal(renderStudentText(stage.prompt, stage.promptPronunciationTokens), stage.prompt);
  let session = dispatchLearningTask(createLearningTaskSession(grade3, 'g3-reading-assistance-regression'), grade3, 'start').session;
  session = dispatchLearningTask(session, grade3, 'select_option', { optionId: 'lost-found-return' }).session;
  const submitted = dispatchLearningTask(session, grade3, 'submit', { submissionId: 'g3-reading-assistance-regression:stage-1' });
  assert.equal(submitted.session.phase, 'success');
  assert.equal(submitted.attempt.result, 'correct');
});

test('挑戰畫面只在 G1–2 顯示聽題目按鈕，點擊只傳入純文字 prompt', () => {
  const rendererStart = appSource.indexOf('function renderReusableCandidateTask(');
  const rendererEnd = appSource.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
  const renderer = appSource.slice(rendererStart, rendererEnd);
  assert.match(renderer, /isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/);
  assert.match(renderer, /candidate-prompt-speech/);
  assert.match(renderer, /'🔊 聽題目'/);
  assert.match(renderer, /addEventListener\('click', \(\) => speak\(stage\.prompt\)\)/);
  assert.match(renderer, /listen\.disabled = !isSpeechEnabled\(\)/);
  assert.doesNotMatch(renderer, /speak\(stage\.promptPronunciationTokens/);
  assert.match(appSource, /querySelectorAll\('\.candidate-prompt-speech'\).*button\.disabled = !enabled/s);
});

test('shared speech service 朗讀 plain text 並遵守全站開關', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance');
  const spoken = [];
  let cancelled = 0;
  class MockUtterance {
    constructor(text) { this.text = text; }
  }
  globalThis.window = { speechSynthesis: {
    cancel() { cancelled += 1; },
    speak(utterance) { spoken.push(utterance); },
    getVoices() { return []; },
  } };
  globalThis.SpeechSynthesisUtterance = MockUtterance;
  try {
    setSpeechEnabled(true);
    assert.equal(isSpeechEnabled(), true);
    const prompt = '天空下雨了，小安要拿什麼來遮雨？';
    assert.equal(speak(prompt), true);
    assert.equal(spoken.at(-1).text, prompt);
    assert.equal(spoken.at(-1).lang, 'zh-TW');
    const spokenCount = spoken.length;
    setSpeechEnabled(false);
    assert.equal(speak(prompt), false);
    assert.equal(spoken.length, spokenCount);
    assert.ok(cancelled >= 2);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
    if (previousUtterance) Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', previousUtterance);
    else delete globalThis.SpeechSynthesisUtterance;
  }
});

test('注音樣式把國字與右側直排注音保留為緊鄰的行內單位', async () => {
  const css = await readFile(new URL('../prototype/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.zhuyin-pair\{[^}]*display:inline-grid[^}]*white-space:nowrap/);
  assert.match(css, /\.zhuyin-hanzi\{[^}]*grid-column:1[^}]*writing-mode:horizontal-tb/);
  assert.match(css, /\.zhuyin-reading\{[^}]*position:relative[^}]*grid-column:2[^}]*display:flex[^}]*flex-direction:column[^}]*align-items:center[^}]*justify-content:center/);
  assert.match(css, /\.zhuyin-glyph-column\{[^}]*display:flex[^}]*flex-direction:column/);
  assert.match(css, /\.zhuyin-tone\{[^}]*position:absolute/);
  assert.match(css, /\.zhuyin-tone-neutral\{/);
  assert.doesNotMatch(css, /\.zhuyin-reading\{[^}]*writing-mode/);
  assert.match(css, /\.candidate-zhuyin-text\{[^}]*letter-spacing:normal[^}]*word-spacing:normal/);
  assert.doesNotMatch(css, /\.candidate-zhuyin-text\{[^}]*writing-mode:vertical/);
  assert.doesNotMatch(css, /\.candidate-zhuyin-text (?:ruby|rb|rt)\{/);
  assert.match(css, /\.candidate-answer-option\{white-space:normal/);
});
