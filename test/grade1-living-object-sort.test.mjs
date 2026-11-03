import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE1_LIVING_OBJECT_SORT as task } from '../prototype/data/grade1LivingObjectSort.js';
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
  for (const observation of stage.observations ?? []) assertAnnotated(observation.text, observation.pronunciationTokens);
  for (const category of stage.categories ?? []) assertAnnotated(category.label, category.pronunciationTokens);
  for (const option of stage.options ?? []) {
    assertAnnotated(option.text, option.pronunciationTokens);
    assertAnnotated(option.feedback, option.feedbackPronunciationTokens);
  }
  for (const hint of stage.hints ?? []) assertAnnotated(hint.text, hint.pronunciationTokens);
  assertAnnotated(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
  assertAnnotated(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
}

function act(session, stage, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.error, undefined, `${action} should be valid`);
  return result.session;
}

test('生活探索隊保留活動、課綱、階段與分類答案契約，並提供完整人工注音', async () => {
  assert.equal(task.activityId, 'ACT-G1-LIVING-OBJECT-SORT-CANDIDATE');
  assert.equal(task.gradeId, 'grade-1');
  assert.equal(task.subjectId, 'living-curriculum');
  assert.equal(task.curriculumMapId, 'living-curriculum-stage1-observation-inquiry');
  assert.deepEqual(task.curriculumCodes, ['2-I-1', '2-I-5']);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(validateLearningTask(task), []);
  assert.deepEqual(task.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['sort-observed-things', 'classify_observations'],
    ['explain-object-rule', 'choose_response'],
  ]);

  const [sort, explain] = task.stages;
  assert.deepEqual(sort.observations.map(({ id }) => id), ['thing-leaf', 'thing-stone', 'thing-cup', 'thing-book']);
  assert.deepEqual(sort.categories.map(({ id, label }) => [id, label]), [['natural', '自然物'], ['made', '人造物']]);
  assert.deepEqual(sort.correctAssignments, {
    'thing-leaf': 'natural', 'thing-stone': 'natural', 'thing-cup': 'made', 'thing-book': 'made',
  });
  assert.deepEqual(explain.options.map(({ id }) => id), ['rule-origin', 'rule-colour', 'rule-size']);
  assert.deepEqual(explain.correctOptionIds, ['rule-origin']);
  assert.match(sort.prompt, /看每張卡/u);
  assert.match(sort.studentOperationGuidance, /選一類/u);
  assert.equal(explain.studentOperationGuidance, undefined);
  assert.ok(!Object.hasOwn(explain, 'studentOperationGuidancePronunciationTokens'));
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(app, /stage\.interaction === 'choose_response'[\s\S]*?lowGradeChooseResponse[\s\S]*?stage\.studentOperationGuidance \?\? \(stage\.selectionMode === 'multiple' \? '怎麼玩：① 看題目 → ② 選答案 → ③ 檢查答案' : '怎麼玩：① 看題目 → ② 選一個答案 → ③ 檢查答案'\)/u);
  assert.match(app, /'怎麼玩：① 看題目 → ② 選一個答案 → ③ 檢查答案': 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄊㄧˊ ㄇㄨˋ ㄒㄩㄢˇ ㄧˊ ㄍㄜˋ ㄉㄚˊ ㄢˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'/u);
  assert.match(sort.hints[0].text, /怎麼來/u);
  assert.match(sort.hints[1].text, /人做的/u);
  assert.equal(sort.correctFeedback, '你看卡片，把東西分好了。');
  assert.match(explain.prompt, /剛才分東西時/u);
  assert.deepEqual(explain.options.slice(1).map(({ text }) => text), ['看它的顏色。', '看它的大小。']);
  assert.ok(explain.hints.every(({ text }) => !/自然出現|人做出來/u.test(text)));
  assert.equal(explain.teacherLimitationNote, '本模擬不能證明學生能在真實環境自行觀察或安全操作。');
  assert.ok(!explain.correctFeedback.includes('本模擬'));
  assert.ok(!sort.correctFeedback.includes('本模擬'));
  for (const stage of task.stages) assertStagePronunciation(stage);
});

test('分類須完成四張觀察卡，正誤分類與第二關單選評分維持既有行為', () => {
  const [sort, explain] = task.stages;
  let session = act(createLearningTaskSession(task, 'living-object-sort-score'), sort, 'start');
  for (const observation of sort.observations.slice(0, 3)) {
    session = act(session, sort, 'assign_category', {
      observationId: observation.id,
      categoryId: sort.correctAssignments[observation.id],
    });
  }
  const incomplete = dispatchLearningTask(session, task, 'submit');
  assert.equal(incomplete.error, 'response_required');
  session = act(session, sort, 'assign_category', {
    observationId: 'thing-book', categoryId: 'natural',
  });
  const wrong = dispatchLearningTask(session, task, 'submit', { submissionId: 'living-sort-wrong' });
  assert.equal(wrong.session.phase, 'feedback');
  assert.equal(wrong.attempt.result, 'incorrect');
  session = act(wrong.session, sort, 'retry');
  for (const [observationId, categoryId] of Object.entries(sort.correctAssignments)) {
    session = act(session, sort, 'assign_category', { observationId, categoryId });
  }
  const correct = dispatchLearningTask(session, task, 'submit', { submissionId: 'living-sort-correct' });
  assert.equal(correct.session.phase, 'success');
  assert.equal(correct.attempt.result, 'correct');

  session = act(correct.session, explain, 'next');
  session = act(session, explain, 'select_option', { optionId: 'rule-colour' });
  const explainWrong = dispatchLearningTask(session, task, 'submit', { submissionId: 'living-rule-wrong' });
  assert.equal(explainWrong.attempt.result, 'incorrect');
  session = act(explainWrong.session, explain, 'retry');
  session = act(session, explain, 'select_option', { optionId: 'rule-origin' });
  const explainCorrect = dispatchLearningTask(session, task, 'submit', { submissionId: 'living-rule-correct' });
  assert.equal(explainCorrect.attempt.result, 'correct');
});
