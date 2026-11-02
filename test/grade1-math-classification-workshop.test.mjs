import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE1_MATH_CLASSIFICATION_WORKSHOP as activity } from '../prototype/data/grade1MathClassificationWorkshop.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled, renderStudentText } from '../prototype/studentTextRenderer.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const rendererStart = app.indexOf('function renderReusableCandidateTask(');
const rendererEnd = app.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
const renderer = app.slice(rendererStart, rendererEnd);
const guidanceStart = renderer.indexOf('const responseGuidance =');
const guidanceEnd = renderer.indexOf('const classificationProgress =', guidanceStart);
const guidancePresentation = renderer.slice(guidanceStart, guidanceEnd);
const progressEnd = renderer.indexOf('if (stage.deriveFromPrevious', renderer.indexOf('const classificationProgress ='));
const progressPresentation = renderer.slice(renderer.indexOf('const classificationProgress ='), progressEnd);
const classifyBoardStart = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'classify_observations')");
const classifyBoardEnd = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'build_frequency_table')", classifyBoardStart);
const classifyBoard = renderer.slice(classifyBoardStart, classifyBoardEnd);
const submitLabelStart = renderer.indexOf('const submitLabel = lowGradeClassifyObservations');
const submitLabelEnd = renderer.indexOf("\n    submit.addEventListener('click'", submitLabelStart);
const submitPresentation = renderer.slice(submitLabelStart, submitLabelEnd);
const classifyUiHelperStart = app.indexOf('const CLASSIFY_OBSERVATIONS_UI_PRONUNCIATION =');
const classifyUiHelperEnd = app.indexOf('\nfunction playBuildArrayFeedbackTone', classifyUiHelperStart);
const classifyUiHelper = app.slice(classifyUiHelperStart, classifyUiHelperEnd);

function assertPronunciation(text, tokens) {
  assert.ok(Array.isArray(tokens), `missing manual pronunciation metadata: ${text}`);
  assert.equal(tokens.map(({ text: character }) => character).join(''), text);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han character should remain unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/u);
}

function dispatchOk(session, action, payload) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} should be accepted`);
  assert.equal(result.changed, true, `${action} should update the session`);
  return result.session;
}

test('分類小小研究站保留三關、兩種分類映射與單選答案', () => {
  assert.equal(activity.activityId, 'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE');
  assert.deepEqual(activity.stages.map(({ stageId }) => stageId), [
    'sort-same-set-by-colour', 're-sort-same-set-by-shape', 'identify-classification-rule',
  ]);
  assert.deepEqual(activity.stages.map(({ interaction }) => interaction), [
    'classify_observations', 'classify_observations', 'choose_response',
  ]);
  assert.deepEqual(activity.stages[0].correctAssignments, {
    'tile-red-round': 'red', 'tile-blue-round': 'blue', 'tile-red-square': 'red', 'tile-blue-square': 'blue',
  });
  assert.deepEqual(activity.stages[1].correctAssignments, {
    'tile-red-round': 'round', 'tile-blue-round': 'round', 'tile-red-square': 'square', 'tile-blue-square': 'square',
  });
  assert.deepEqual(activity.stages[0].observations.map(({ id, text }) => [id, text]), activity.stages[1].observations.map(({ id, text }) => [id, text]));
  assert.deepEqual(activity.stages[2].correctOptionIds, ['rule-selected-feature']);
  assert.deepEqual(validateLearningTask(activity), []);
});

test('三關學生可讀中文皆有人工注音，數字與標點保持原樣', () => {
  for (const stage of activity.stages) {
    assertPronunciation(stage.prompt, stage.promptPronunciationTokens);
    for (const hint of stage.hints) assertPronunciation(hint.text, hint.pronunciationTokens);
    assertPronunciation(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    assertPronunciation(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    if (stage.studentOperationGuidance) assertPronunciation(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
    for (const observation of stage.observations ?? []) assertPronunciation(observation.text, observation.pronunciationTokens);
    for (const category of stage.categories ?? []) assertPronunciation(category.label, category.pronunciationTokens);
    for (const option of stage.options ?? []) {
      assertPronunciation(option.text, option.pronunciationTokens);
      assertPronunciation(option.feedback, option.feedbackPronunciationTokens);
    }
  }
  assert.match(activity.stages[0].prompt, /4/u);
  assert.match(activity.stages[1].prompt, /4/u);
  assert.equal(activity.stages[0].promptPronunciationTokens.find(({ text }) => text === '4').reading, undefined);
  assert.equal(activity.stages[1].promptPronunciationTokens.find(({ text }) => text === '4').reading, undefined);
  assert.equal(activity.stages[2].promptPronunciationTokens.find(({ text }) => text === '4').reading, undefined);
  assert.equal(activity.stages[0].studentOperationGuidance, '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案');
  assert.doesNotMatch(app, /ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE/u);
});

test('學生回饋與教師限制分開，第三關仍教同一組物品可按不同特徵分類', () => {
  const finalStage = activity.stages[2];
  assert.equal(finalStage.options[0].id, 'rule-selected-feature');
  assert.equal(finalStage.options[0].text, '第一次看顏色，第二次看形狀。');
  assert.equal(finalStage.correctFeedback, '答對了！同一組卡片，看的特徵不同，就可以有不同的分法。');
  assert.equal(finalStage.teacherLimitationNote, '螢幕卡片是模擬資料，仍需教師安排實物蒐集和學生自製呈現活動。');
  assert.doesNotMatch(finalStage.correctFeedback, /教師|螢幕卡片|模擬資料/u);
  assert.equal(activity.stages[0].observations, activity.stages[1].observations);
});

test('引導、分類進度、readiness 與送出按鈕只在低年級分類呈現中加注音', () => {
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-1'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-2'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-3'), false);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-6'), false);
  assert.match(renderer, /const lowGradeClassifyObservations = stage\.interaction === 'classify_observations'[\s\S]*?isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/u);
  assert.match(guidancePresentation, /stage\.studentOperationGuidance \?\? '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案'/u);
  assert.match(guidancePresentation, /appendStudentText\(responseGuidanceNode, responseGuidance, stage\.studentOperationGuidancePronunciationTokens\)/u);
  assert.match(guidancePresentation, /操作方式：① 看觀察紀錄 → ② 選擇分類/u, 'Grade 3–6 retains the shared guidance');
  assert.match(progressPresentation, /stage\.observations\.filter\(\(\{ id \}\) => Boolean\(session\.assignments\?\.\[id\]\)\)\.length/u);
  assert.match(progressPresentation, /appendClassifyObservationsUiText\(progressNode, '已分 '/u);
  assert.match(progressPresentation, /String\(classificationProgress\.completedCount\)/u);
  assert.match(progressPresentation, /String\(classificationProgress\.totalCount\)/u);
  assert.match(classifyUiHelper, /'已分 ': 'ㄧˇ ㄈㄣ'/u);
  assert.match(classifyUiHelper, /'還要分 ': 'ㄏㄞˊ ㄧㄠˋ ㄈㄣ'/u);
  assert.match(classifyUiHelper, /'可以檢查答案了。'/u);
  assert.match(classifyBoard, /appendStudentText\(legend, observation\.text, observation\.pronunciationTokens\)/u);
  assert.match(classifyBoard, /appendStudentText\(choice, category\.label, category\.pronunciationTokens\)/u);
  assert.match(classifyBoard, /aria-pressed/u);
  assert.match(submitPresentation, /const submitLabel = lowGradeClassifyObservations \? '檢查分類'/u);
  assert.match(submitPresentation, /stage\.interaction === 'choose_response'.*?'檢查答案'/u);
  assert.doesNotMatch(submitPresentation, /choose_response[^\n]*檢查分類/u, 'choose_response must not receive the classify CTA');
  assert.match(submitPresentation, /taskKind === 'math' \? '檢查數學解法'/u, 'non-low-grade math submit wording remains available');
  assert.match(submitPresentation, /submit\.disabled = !hasResponse/u);
  assert.match(renderer, /listen\.addEventListener\('click', \(\) => speak\(stage\.prompt\)\)/u);
});

test('原分類資料可依正常作答流程完成兩輪並選出分類原則', () => {
  let session = dispatchOk(createLearningTaskSession(activity, 'classification-workshop-regression'), 'start');
  for (const [observationId, categoryId] of Object.entries(activity.stages[0].correctAssignments)) {
    session = dispatchOk(session, 'assign_category', { observationId, categoryId });
  }
  const first = dispatchLearningTask(session, activity, 'submit');
  assert.equal(first.error, undefined);
  assert.equal(first.attempt?.result, 'correct');
  session = dispatchOk(first.session, 'next');
  assert.equal(activity.stages[session.stageIndex].stageId, 're-sort-same-set-by-shape');
  for (const [observationId, categoryId] of Object.entries(activity.stages[1].correctAssignments)) {
    session = dispatchOk(session, 'assign_category', { observationId, categoryId });
  }
  const second = dispatchLearningTask(session, activity, 'submit');
  assert.equal(second.error, undefined);
  assert.equal(second.attempt?.result, 'correct');
  session = dispatchOk(second.session, 'next');
  assert.equal(activity.stages[session.stageIndex].stageId, 'identify-classification-rule');
  session = dispatchOk(session, 'select_option', { optionId: 'rule-selected-feature' });
  const third = dispatchLearningTask(session, activity, 'submit');
  assert.equal(third.error, undefined);
  assert.equal(third.attempt?.result, 'correct');
});
