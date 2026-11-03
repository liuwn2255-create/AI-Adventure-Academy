import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE1_LIVING_CHANGE_DETECTIVE as task } from '../prototype/data/grade1LivingChangeDetective.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

function assertAnnotated(text, tokens) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `missing pronunciation tokens: ${text}`);
  assert.equal(tokens.map(({ text: character }) => character).join(''), text, `token alignment: ${text}`);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Hanzi must not receive a reading: ${token.text}`);
  }
  const expectedPairs = [...text].filter((character) => /\p{Script=Han}/u.test(character)).length;
  assert.equal((renderStudentText(text, tokens).match(/class="zhuyin-pair"/gu) ?? []).length, expectedPairs);
}

function assertStagePronunciation(stage) {
  assertAnnotated(stage.prompt, stage.promptPronunciationTokens);
  if (stage.studentOperationGuidance !== undefined) {
    assertAnnotated(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
  }
  for (const record of stage.evidenceRecords ?? []) {
    assertAnnotated(record.title, record.titlePronunciationTokens);
    assertAnnotated(record.text, record.pronunciationTokens);
  }
  for (const option of stage.options ?? []) {
    assertAnnotated(option.text, option.pronunciationTokens);
    assertAnnotated(option.feedback, option.feedbackPronunciationTokens);
  }
  for (const hint of stage.hints ?? []) assertAnnotated(hint.text, hint.pronunciationTokens);
  assertAnnotated(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
  assertAnnotated(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
}

function dispatch(session, action, payload = {}) {
  return dispatchLearningTask(session, task, action, payload);
}

test('生活變化偵探保留活動與答案資料，兩關學生文字皆有逐字對齊的人工注音', async () => {
  assert.equal(task.activityId, 'ACT-G1-LIVING-CHANGE-DETECTIVE-CANDIDATE');
  assert.equal(task.gradeId, 'grade-1');
  assert.equal(task.subjectId, 'living-curriculum');
  assert.equal(task.curriculumMapId, 'living-curriculum-stage1-change-inquiry');
  assert.deepEqual(task.curriculumCodes, ['2-I-2', '2-I-4', '2-I-5']);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(validateLearningTask(task), []);

  const [collect, method] = task.stages;
  assert.deepEqual(task.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['collect-change-evidence', 'collect_evidence'],
    ['choose-change-recording-method', 'choose_response'],
  ]);
  assert.equal(collect.requiredSelectionCount, 2);
  assert.equal(collect.selectionUnitLabel, '張');
  assert.deepEqual(collect.evidenceRecords.map(({ title }) => title), ['盆栽紀錄 A', '天空紀錄 B', '積木紀錄 C', '桌面紀錄 D']);
  assert.deepEqual(collect.options.map(({ id, text }) => [id, text]), [
    ['change-plant', '盆栽紀錄'], ['change-blocks', '積木紀錄'], ['same-sky', '天空紀錄'], ['same-book', '桌面紀錄'],
  ]);
  assert.deepEqual(collect.correctOptionIds, ['change-plant', 'change-blocks']);
  assert.ok(collect.options.every(({ text }) => !text.includes('前後不同')));
  assert.ok(collect.hints.every(({ text }) => !/盆栽|積木/u.test(text)));
  assert.deepEqual(method.options.map(({ id }) => id), ['method-date-description', 'method-name-only', 'method-colour-guess']);
  assert.deepEqual(method.correctOptionIds, ['method-date-description']);
  assert.equal(method.studentOperationGuidance, undefined);
  assert.ok(!Object.hasOwn(method, 'studentOperationGuidancePronunciationTokens'));
  assert.ok(!method.correctFeedback.includes('模擬規劃'));
  assert.equal(method.teacherLimitationNote, '這只是模擬規劃，未執行真實觀察或證明因果理解。');
  assert.ok(!collect.correctFeedback.includes('模擬規劃'));
  for (const stage of task.stages) assertStagePronunciation(stage);

  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(app, /stage\.interaction === 'choose_response'[\s\S]*?lowGradeChooseResponse[\s\S]*?stage\.studentOperationGuidance \?\? \(stage\.selectionMode === 'multiple' \? '怎麼玩：① 看題目 → ② 選答案 → ③ 檢查答案' : '怎麼玩：① 看題目 → ② 選一個答案 → ③ 檢查答案'\)/u);
  assert.match(app, /'怎麼玩：① 看題目 → ② 選一個答案 → ③ 檢查答案': 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄊㄧˊ ㄇㄨˋ ㄒㄩㄢˇ ㄧˊ ㄍㄜˋ ㄉㄚˊ ㄢˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'/u);

  const guidanceHan = collect.studentOperationGuidancePronunciationTokens.filter(({ reading }) => reading);
  assert.ok(guidanceHan.some(({ text, reading }) => text === '張' && reading === 'ㄓㄤ'));
  assert.ok(collect.studentOperationGuidancePronunciationTokens.some(({ text }) => text === '2'));
  assert.equal(collect.studentOperationGuidancePronunciationTokens.find(({ text }) => text === '2').reading, undefined);
  assert.deepEqual(collect.options.map(({ id }) => id), ['change-plant', 'change-blocks', 'same-sky', 'same-book']);
});

test('證據選滿明確的兩張才可提交，答案集合與第二關單選評分保持不變', () => {
  const [collect, method] = task.stages;
  let session = dispatch(createLearningTaskSession(task, 'living-change-count'), 'start').session;
  session = dispatch(session, 'toggle_evidence', { optionId: 'change-plant' }).session;
  assert.equal(session.selection.length, 1);
  assert.equal(dispatch(session, 'submit').error, 'response_required');
  const secondSelection = dispatch(session, 'toggle_evidence', { optionId: 'same-sky' });
  assert.equal(secondSelection.error, undefined);
  assert.equal(secondSelection.changed, true);
  session = secondSelection.session;
  assert.deepEqual(session.selection, ['change-plant', 'same-sky']);
  assert.equal(session.selection.length, collect.requiredSelectionCount);
  const wrong = dispatch(session, 'submit', { submissionId: 'living-change-wrong' });
  assert.equal(wrong.session.phase, 'feedback');
  assert.equal(wrong.attempt.result, 'incorrect');
  session = dispatch(wrong.session, 'retry').session;
  assert.deepEqual(session.selection, [], 'retry clears the prior response');
  session = dispatch(session, 'toggle_evidence', { optionId: 'change-plant' }).session;
  session = dispatch(session, 'toggle_evidence', { optionId: 'change-blocks' }).session;
  const thirdSelection = dispatch(session, 'toggle_evidence', { optionId: 'same-book' });
  assert.equal(thirdSelection.changed, false);
  assert.deepEqual(thirdSelection.session.selection, ['change-plant', 'change-blocks']);
  const correct = dispatch(session, 'submit', { submissionId: 'living-change-correct' });
  assert.equal(correct.session.phase, 'success');
  assert.equal(correct.attempt.result, 'correct');
  session = dispatch(correct.session, 'next').session;
  session = dispatch(session, 'select_option', { optionId: 'method-date-description' }).session;
  const stage2Result = dispatch(session, 'submit', { submissionId: 'living-method-correct' });
  assert.equal(stage2Result.attempt.result, 'correct');
  assert.equal(collect.requiredSelectionCount, 2);
  assert.deepEqual(collect.correctOptionIds, ['change-plant', 'change-blocks']);
  assert.deepEqual(method.correctOptionIds, ['method-date-description']);
});
