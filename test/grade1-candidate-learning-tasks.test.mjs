import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const curriculum = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const learningMap = JSON.parse(await readFile(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
const expected = new Map([
  ['ACT-G1-MATH-QUANTITY-GARDEN-CANDIDATE', ['mathematics', 'math-grade1-count-place-value']],
  ['ACT-G1-MATH-COUNTER-STORY-CANDIDATE', ['mathematics', 'math-grade1-add-sub-meaning']],
  ['ACT-G1-CHINESE-SENTENCE-TRAIN-CANDIDATE', ['chinese-language', 'chinese-stage1-word-sentence-story']],
  ['ACT-G1-CHINESE-STORY-CARDS-CANDIDATE', ['chinese-language', 'chinese-stage1-word-sentence-story']],
  ['ACT-G1-LIVING-OBJECT-SORT-CANDIDATE', ['living-curriculum', 'living-curriculum-stage1-observation-inquiry']],
  ['ACT-G1-LIVING-CHANGE-DETECTIVE-CANDIDATE', ['living-curriculum', 'living-curriculum-stage1-change-inquiry']],
]);

function setResponse(task, stage, session, correct) {
  const choose = (action, payload) => { session = dispatchLearningTask(session, task, action, payload).session; };
  switch (stage.interaction) {
    case 'choose_response': {
      const id = correct ? stage.correctOptionIds[0] : stage.options.find(({ id: optionId }) => !stage.correctOptionIds.includes(optionId)).id;
      choose('select_option', { optionId: id });
      break;
    }
    case 'assemble_response': {
      const ids = [...stage.correctOptionIds];
      if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
      for (const tokenId of ids) choose('add_phrase_token', { tokenId });
      break;
    }
    case 'build_array': {
      const rows = correct ? stage.arrayRules.targetRows : 1;
      const columns = correct ? stage.arrayRules.targetColumns : 1;
      for (let i = 0; i < rows; i += 1) choose('adjust_array_dimension', { dimension: 'rows', delta: 1 });
      for (let i = 0; i < columns; i += 1) choose('adjust_array_dimension', { dimension: 'columns', delta: 1 });
      break;
    }
    case 'order_items': {
      if (correct) {
        session = { ...session, orderedItems: [...stage.correctItemIds] };
      } else {
        const wrong = [...stage.correctItemIds];
        [wrong[0], wrong[1]] = [wrong[1], wrong[0]];
        session = { ...session, orderedItems: wrong };
      }
      break;
    }
    case 'classify_observations': {
      for (const observation of stage.observations) {
        const expectedCategory = stage.correctAssignments[observation.id];
        const categoryId = correct ? expectedCategory : stage.categories.find(({ id }) => id !== expectedCategory).id;
        choose('assign_category', { observationId: observation.id, categoryId });
      }
      break;
    }
    case 'collect_evidence': {
      const requiredCount = stage.requiredSelectionCount ?? stage.correctOptionIds.length;
      const ids = stage.correctOptionIds.slice(0, requiredCount);
      if (!correct) ids[requiredCount - 1] = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
      for (const optionId of ids) choose('toggle_evidence', { optionId });
      break;
    }
    default: assert.fail(`Uncovered interaction ${stage.interaction}`);
  }
  return dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:${correct ? 'correct' : 'wrong'}:${session.attempts.length}` }).session;
}

test('一年級六個候選活動具有唯一 ID、正確年級入口、科目關聯及已核對課綱參照', () => {
  const tasks = CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => expected.has(activityId));
  assert.equal(tasks.length, 6);
  assert.equal(new Set(tasks.map(({ activityId }) => activityId)).size, 6);
  assert.deepEqual(Object.fromEntries(['mathematics', 'chinese-language', 'living-curriculum'].map((subjectId) => [subjectId, tasks.filter((task) => task.subjectId === subjectId).length])), {
    mathematics: 2, 'chinese-language': 2, 'living-curriculum': 2,
  });
  const official = new Map([...curriculum.verifiedLearningFocuses, ...curriculum.supplementalVerifiedLearningFocuses, ...curriculum.pendingLearningFocuses].map((item) => [item.id, item]));
  for (const task of tasks) {
    const [subjectId, mapId] = expected.get(task.activityId);
    assert.equal(task.gradeId, 'grade-1');
    assert.equal(task.subjectId, subjectId);
    assert.equal(task.curriculumMapId, mapId);
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    assert.ok(official.get(mapId)?.officialTextReviewStatus === 'verified_against_official_text');
    const subject = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-1').subjects.find(({ subjectId: id }) => id === subjectId);
    assert.ok(subject.existingYearLevelContent.some(({ activityId, status, progressPersistence }) => activityId === task.activityId && status === task.status && progressPersistence === task.evidencePolicy.persistence));
    assert.ok(getLearningTaskRelation('grade-1', subjectId).tasks.some(({ taskId }) => taskId === task.activityId));
    assert.ok(learningMap.grades.find(({ gradeId }) => gradeId === 'grade-1'));
  }
  assert.ok(new Set(tasks.flatMap(({ stages }) => stages.map(({ interaction }) => interaction))).size >= 5);
});

test('一年級六個活動逐階段可提示、錯答重試、正確完成及重玩且不持久化', () => {
  const tasks = CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => expected.has(activityId));
  for (const task of tasks) {
    let session = dispatchLearningTask(createLearningTaskSession(task, `${task.activityId}-acceptance`), task, 'start').session;
    for (const [index, stage] of task.stages.entries()) {
      if (index > 0) session = dispatchLearningTask(session, task, 'next').session;
      assert.equal(session.phase, 'active');
      assert.equal(dispatchLearningTask(session, task, 'hint').changed, true);
      session = setResponse(task, stage, session, false);
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId} incorrect`);
      assert.ok(session.lastFeedback.text);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      session = dispatchLearningTask(session, task, 'retry').session;
      session = setResponse(task, stage, session, true);
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId} correct`);
      assert.equal(session.attempts.at(-1).result, 'correct');
    }
    session = dispatchLearningTask(session, task, 'next').session;
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  }
});

test('一年級句子列車遮雨題保留純文字答案資料並以人工注音原型顯示', () => {
  const activity = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G1-CHINESE-SENTENCE-TRAIN-CANDIDATE');
  const assembleStage = activity.stages.find(({ stageId }) => stageId === 'assemble-rain-sentence');
  const stage = activity.stages.find(({ stageId }) => stageId === 'choose-context-word');
  const assertFullyAnnotated = (text, tokens) => {
    assert.deepEqual(tokens.map(({ text: character }) => character).join(''), text);
    const hanziCount = [...text].filter((character) => /\p{Script=Han}/u.test(character)).length;
    assert.equal(tokens.filter(({ text: character, reading }) => /\p{Script=Han}/u.test(character) && reading).length, hanziCount);
    assert.equal((renderStudentText(text, tokens).match(/class="zhuyin-pair"/g) ?? []).length, hanziCount);
  };

  assert.equal(assembleStage.prompt, '依照情境排句：小雨要收拾書包，水壺不能留在桌上。');
  assertFullyAnnotated(assembleStage.prompt, assembleStage.promptPronunciationTokens);
  for (const token of assembleStage.tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assertFullyAnnotated(token.text, token.pronunciationTokens);
  }
  assert.deepEqual(assembleStage.tokens.map(({ id, text }) => [id, text]), [
    ['s1-subject', '小雨'], ['s1-action', '把水壺放進'], ['s1-object', '書包'], ['s1-ending', '。'],
  ]);
  assert.deepEqual(assembleStage.correctOptionIds, ['s1-subject', 's1-action', 's1-object', 's1-ending']);
  for (const hint of assembleStage.hints) assertFullyAnnotated(hint.text, hint.pronunciationTokens);
  assertFullyAnnotated(assembleStage.incorrectFeedback, assembleStage.incorrectFeedbackPronunciationTokens);
  assertFullyAnnotated(assembleStage.correctFeedback, assembleStage.correctFeedbackPronunciationTokens);

  const prompt = '天空下雨了，小安要拿什麼來遮雨？';
  assert.equal(stage.prompt, prompt);
  assert.deepEqual(stage.promptPronunciationTokens.map(({ text }) => text).join(''), prompt);
  assert.ok(stage.promptPronunciationTokens.filter(({ text }) => /\p{Script=Han}/u.test(text)).every(({ reading }) => Boolean(reading)));
  assert.deepEqual(stage.promptPronunciationTokens.filter(({ reading }) => reading).map(({ text, reading }) => [text, reading]), [
    ['天', 'ㄊㄧㄢ'], ['空', 'ㄎㄨㄥ'], ['下', 'ㄒㄧㄚˋ'], ['雨', 'ㄩˇ'], ['了', '˙ㄌㄜ'],
    ['小', 'ㄒㄧㄠˇ'], ['安', 'ㄢ'], ['要', 'ㄧㄠˋ'], ['拿', 'ㄋㄚˊ'], ['什', 'ㄕㄣˊ'], ['麼', '˙ㄇㄜ'], ['來', 'ㄌㄞˊ'], ['遮', 'ㄓㄜ'], ['雨', 'ㄩˇ'],
  ]);
  assert.deepEqual(stage.options.map(({ id, text }) => [id, text]), [
    ['word-umbrella', '雨傘'], ['word-spoon', '湯匙'], ['word-pillow', '枕頭'],
  ]);
  assert.deepEqual(stage.options.map(({ pronunciationTokens }) => pronunciationTokens.map(({ text, reading }) => [text, reading])), [
    [['雨', 'ㄩˇ'], ['傘', 'ㄙㄢˇ']],
    [['湯', 'ㄊㄤ'], ['匙', 'ㄔˊ']],
    [['枕', 'ㄓㄣˇ'], ['頭', '˙ㄊㄡ']],
  ]);
  assert.deepEqual(stage.correctOptionIds, ['word-umbrella']);
  for (const hint of stage.hints) assertFullyAnnotated(hint.text, hint.pronunciationTokens);
  for (const option of stage.options) assertFullyAnnotated(option.feedback, option.feedbackPronunciationTokens);
  assertFullyAnnotated(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
  assertFullyAnnotated(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
  const renderedPrompt = renderStudentText(stage.prompt, stage.promptPronunciationTokens);
  assert.match(renderedPrompt, /class="zhuyin-pair"/);
  assert.match(renderedPrompt, /<span class="zhuyin-hanzi">天<\/span>/);
  assert.match(renderedPrompt, /class="zhuyin-pair"><span class="zhuyin-hanzi">天<\/span><span class="zhuyin-reading" aria-hidden="true"><span class="zhuyin-glyph-column"><span class="zhuyin-glyph">ㄊ<\/span><span class="zhuyin-glyph">ㄧ<\/span><span class="zhuyin-glyph">ㄢ<\/span><\/span><\/span><\/span>/);

  const wrongPromptStage = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G2-CHINESE-STORY-CLUE-CANDIDATE')
    .stages.find(({ stageId }) => stageId === 'collect-rain-shelter-clues');
  assert.equal(wrongPromptStage.promptPronunciationTokens, undefined);
  assert.equal(renderStudentText(wrongPromptStage.prompt, wrongPromptStage.promptPronunciationTokens), wrongPromptStage.prompt);

  let session = dispatchLearningTask(createLearningTaskSession(activity, 'grade1-zhuyin-score-check'), activity, 'start').session;
  session = setResponse(activity, activity.stages[0], session, true);
  session = dispatchLearningTask(session, activity, 'next').session;
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: 'word-umbrella' }).session;
  const submitted = dispatchLearningTask(session, activity, 'submit', { submissionId: 'grade1-zhuyin-score-check' });
  assert.equal(submitted.session.phase, 'success');
  assert.equal(submitted.attempt.result, 'correct');
});

test('句子列車組句詞卡沿用既有 student text renderer，沒有 metadata 時保持純文字', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(app, /appendStudentText\(tile, token\.text, token\.pronunciationTokens\)/);
  assert.match(app, /appendStudentText\(answerText, tokenText, token\?\.pronunciationTokens\)/);
  assert.equal(renderStudentText('桌上。', undefined), '桌上。');
});
