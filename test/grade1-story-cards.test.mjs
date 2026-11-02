import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

function assertFullyAnnotated(text, tokens) {
  assert.ok(Array.isArray(tokens));
  assert.deepEqual(tokens.map(({ text: character }) => character).join(''), text);
  const hanziCount = [...text].filter((character) => /\p{Script=Han}/u.test(character)).length;
  assert.equal(tokens.filter(({ text: character, reading }) => /\p{Script=Han}/u.test(character) && reading).length, hanziCount);
  assert.equal((renderStudentText(text, tokens).match(/class="zhuyin-pair"/g) ?? []).length, hanziCount);
}

test('故事卡排排隊兩關使用人工注音、保留既有答案與純文字 fallback', () => {
  const activity = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G1-CHINESE-STORY-CARDS-CANDIDATE');
  assert.ok(activity);
  const [orderStage, recallStage] = activity.stages;

  assert.equal(orderStage.stageId, 'order-ball-story');
  assert.equal(orderStage.interaction, 'order_items');
  assert.equal(orderStage.prompt, '小樂的球不見了。請把 3 張故事卡排成正確的順序。');
  assert.doesNotMatch(orderStage.prompt, /小樂先找球|在樹下看到球|把球拿回遊戲區/u);
  assertFullyAnnotated(orderStage.prompt, orderStage.promptPronunciationTokens);
  assert.deepEqual(orderStage.items.map(({ id, text }) => [id, text]), [
    ['ball-return', '小樂把球拿回遊戲區。'],
    ['ball-find', '小樂在樹下看到球。'],
    ['ball-search', '小樂發現球不見了，開始找球。'],
  ]);
  for (const item of orderStage.items) assertFullyAnnotated(item.text, item.pronunciationTokens);
  assert.deepEqual(orderStage.initialOrder, ['ball-return', 'ball-find', 'ball-search']);
  assert.deepEqual(orderStage.correctItemIds, ['ball-search', 'ball-find', 'ball-return']);
  assert.deepEqual(orderStage.hints.map(({ text }) => text), [
    '先找一找，故事一開始發生了什麼事。',
    '想一想：事情要先發生，還是結果要先發生？',
  ]);
  for (const hint of orderStage.hints) assertFullyAnnotated(hint.text, hint.pronunciationTokens);
  assert.doesNotMatch(orderStage.hints[1].text, /看到球.*必須先發生/u);
  assert.equal(orderStage.correctFeedback, '答對了！故事卡已經排成正確的順序。');
  assert.equal(orderStage.incorrectFeedback, '再想一想：哪件事最先發生？再看看後面的事情能不能接得起來。');
  assertFullyAnnotated(orderStage.correctFeedback, orderStage.correctFeedbackPronunciationTokens);
  assertFullyAnnotated(orderStage.incorrectFeedback, orderStage.incorrectFeedbackPronunciationTokens);

  assert.equal(recallStage.stageId, 'recall-ball-action');
  assert.equal(recallStage.prompt, '小樂看到球後，接著做了什麼？');
  assertFullyAnnotated(recallStage.prompt, recallStage.promptPronunciationTokens);
  assert.deepEqual(recallStage.options.map(({ id, text }) => [id, text]), [
    ['ball-action-return', '把球拿回遊戲區。'],
    ['ball-action-sleep', '躺下來睡覺。'],
    ['ball-action-buy', '去商店買新球。'],
  ]);
  for (const option of recallStage.options) {
    assertFullyAnnotated(option.text, option.pronunciationTokens);
    assertFullyAnnotated(option.feedback, option.feedbackPronunciationTokens);
  }
  assert.deepEqual(recallStage.correctOptionIds, ['ball-action-return']);
  assert.deepEqual(recallStage.hints.map(({ text }) => text), [
    '回頭看看剛才排好的故事卡。',
    '找到「看到球」那張卡，再看看下一張發生什麼事。',
  ]);
  for (const hint of recallStage.hints) assertFullyAnnotated(hint.text, hint.pronunciationTokens);
  assert.equal(recallStage.correctFeedback, '答對了！小樂找到球後，把球拿回遊戲區。');
  assert.doesNotMatch(recallStage.correctFeedback, /候選練習|閱讀程度仍待教師審閱/u);
  assert.equal(recallStage.teacherLimitationNote, '原創短文及排序活動只提供局部候選練習，閱讀程度仍待教師審閱。');
  assert.match(app, /addInfo\('本關研究限制', stage\.teacherLimitationNote\)/);
  assertFullyAnnotated(recallStage.correctFeedback, recallStage.correctFeedbackPronunciationTokens);
  assertFullyAnnotated(recallStage.incorrectFeedback, recallStage.incorrectFeedbackPronunciationTokens);

  assert.match(app, /appendStudentText\(itemTextNode, itemText, item\?\.pronunciationTokens\)/);
  assert.match(app, /appendStudentText\(summary, introStage\?\.prompt \?\? activity\.instructions/);
  assert.match(app, /addEventListener\('click', \(\) => speak\(stage\.prompt\)\)/);
  assert.match(app, /stage\.interaction === 'order_items'[\s\S]*?isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)[\s\S]*?'怎麼玩：① 看故事卡 → ② 用「上移／下移」排順序 → ③ 檢查答案'/);
  assert.equal(activity.instructionsPronunciationTokens, undefined, 'intro uses the first stage prompt and its tokens; activity instructions are not student intro copy');
  assert.deepEqual(validateLearningTask(activity), []);

  const grade3Stage = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G3-CHINESE-STORY-SEQUENCE-TIMELINE-CANDIDATE')
    .stages.find(({ interaction }) => interaction === 'order_items');
  assert.ok(grade3Stage.items.every(({ pronunciationTokens }) => pronunciationTokens === undefined));
  for (const item of grade3Stage.items) assert.equal(renderStudentText(item.text, item.pronunciationTokens), item.text);

  let session = dispatchLearningTask(createLearningTaskSession(activity, 'grade1-story-cards-regression'), activity, 'start').session;
  session = dispatchLearningTask(session, activity, 'move_ordered_item', { itemId: 'ball-search', toIndex: 0 }).session;
  session = dispatchLearningTask(session, activity, 'move_ordered_item', { itemId: 'ball-find', toIndex: 1 }).session;
  const ordered = dispatchLearningTask(session, activity, 'submit', { submissionId: 'grade1-story-order-correct' });
  assert.equal(ordered.attempt.result, 'correct');
  session = dispatchLearningTask(ordered.session, activity, 'next').session;
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: 'ball-action-return' }).session;
  const recalled = dispatchLearningTask(session, activity, 'submit', { submissionId: 'grade1-story-recall-correct' });
  assert.equal(recalled.attempt.result, 'correct');
});
