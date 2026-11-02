import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { STORY_FOREST_CLUE_RESCUE_QUEST } from '../prototype/data/storyForestClueRescueQuest.js';
import { CONTEXT_WORD_SENTENCE_WORKSHOP } from '../prototype/data/contextWordSentenceWorkshop.js';
import { STORY_SEQUENCE_TIMELINE_QUEST } from '../prototype/data/storySequenceTimelineQuest.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';

const tasks = [STORY_FOREST_CLUE_RESCUE_QUEST, CONTEXT_WORD_SENTENCE_WORKSHOP, STORY_SEQUENCE_TIMELINE_QUEST];
const dispatch = (session, task, action, payload) => dispatchLearningTask(session, task, action, payload).session;
const submit = (session, task, suffix = 'submit') => dispatch(session, task, 'submit', { submissionId: `${session.sessionId}:${suffix}:${session.attempts.length}` });

test('三個國語閱讀候選任務結構完整、識別碼唯一並由三年級國語目錄進入', () => {
  assert.equal(new Set(tasks.map(({ activityId }) => activityId)).size, tasks.length);
  assert.equal(new Set(tasks.map(({ learningObjective }) => learningObjective.objectiveId)).size, tasks.length);
  for (const task of tasks) {
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.gradeId, 'grade-3');
    assert.equal(task.subjectId, 'chinese-language');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.get(task.activityId), task);
  }
  const chinese = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3').subjects.find(({ subjectId }) => subjectId === 'chinese-language');
  assert.ok(tasks.every(({ activityId }) => chinese.existingYearLevelContent.some((entry) => entry.activityId === activityId && entry.runtimeAvailability === 'playable_candidate_prototype')));
  const relation = LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-3' && subjectId === 'chinese-language');
  assert.ok(tasks.every(({ activityId }) => relation.tasks.some(({ taskId }) => taskId === activityId)));
});

test('線索蒐集任務可錯答、提示、重試、完成與重玩，證據只保留於記憶體', () => {
  const task = STORY_FOREST_CLUE_RESCUE_QUEST;
  const careStage = task.stages.find(({ stageId }) => stageId === 'seedling-care-clues');
  const carePassage = task.passages[careStage.passageId];
  assert.equal(careStage.passageId, 'seedlingCare');
  assert.deepEqual(carePassage, {
    title: '窗邊的小苗',
    lines: [
      '小禾發現窗邊的花盆土摸起來乾乾的。',
      '從那天起，小禾每天早上把花盆移到有陽光的桌邊。',
      '她也每天摸一摸土，發現乾了就澆水。',
      '幾天後，原本垂下的葉子慢慢挺起來。',
    ],
  });
  assert.equal(careStage.prompt, '小禾不是只照顧小苗一次。找一找，她每天做了哪些事來照顧小苗？請選 2 個。');
  assert.equal(careStage.requiredSelectionCount, 2);
  assert.deepEqual(careStage.options.map(({ text }) => text), [
    '花盆土摸起來乾乾的。',
    '小禾每天早上把花盆移到有陽光的桌邊。',
    '小禾每天查看土，乾了就澆水。',
    '幾天後，葉子慢慢挺起來。',
  ]);
  assert.deepEqual(careStage.correctOptionIds, ['seedling-clue-move-pot', 'seedling-clue-water']);
  assert.ok(!careStage.correctOptionIds.includes('seedling-clue-dry-soil'));
  assert.ok(!careStage.correctOptionIds.includes('seedling-clue-leaves'));
  assert.match(careStage.correctFeedback, /每天.*不是只做一次.*每天持續照顧/);
  assert.match(careStage.incorrectFeedback, /每天.*做的事情/);

  const inferenceStage = task.stages.find(({ stageId }) => stageId === 'seedling-inference');
  assert.equal(inferenceStage.passageId, 'seedling');
  assert.deepEqual(task.passages.seedling.lines, [
    '小禾發現窗邊的花盆土摸起來乾乾的。',
    '她把花盆移到有陽光的桌邊，又每天摸一摸土，乾了就澆水。',
    '幾天後，原本垂下的葉子慢慢挺起來。',
  ]);
  assert.equal(inferenceStage.prompt, '依照故事，為什麼小禾每天查看土？');

  let session = dispatch(createLearningTaskSession(task, 'clue-test'), task, 'start');
  session = dispatch(session, task, 'toggle_evidence', { optionId: 'seedling-clue-dry-soil' });
  session = dispatch(session, task, 'toggle_evidence', { optionId: 'seedling-clue-leaves' });
  session = submit(session, task, 'wrong');
  assert.equal(session.phase, 'feedback');
  session = dispatch(session, task, 'retry');
  session = dispatch(session, task, 'hint');
  session = dispatch(session, task, 'toggle_evidence', { optionId: 'seedling-clue-move-pot' });
  session = dispatch(session, task, 'toggle_evidence', { optionId: 'seedling-clue-water' });
  session = submit(session, task, 'right');
  assert.equal(session.phase, 'success');
  session = dispatch(session, task, 'next');
  session = dispatch(session, task, 'select_option', { optionId: 'seedling-reason-water' });
  session = submit(session, task, 'reason');
  session = dispatch(session, task, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 3);
  const replay = dispatch(session, task, 'restart');
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.attempts.length, 0);
});

test('語境詞語與句子組裝任務的操作、回饋、重試及完成狀態正常', () => {
  const task = CONTEXT_WORD_SENTENCE_WORKSHOP;
  let session = dispatch(createLearningTaskSession(task, 'context-test'), task, 'start');
  session = dispatch(session, task, 'select_option', { optionId: 'lost-found-repair' });
  session = submit(session, task, 'wrong');
  assert.equal(session.phase, 'feedback');
  session = dispatch(session, task, 'retry');
  session = dispatch(session, task, 'hint');
  session = dispatch(session, task, 'select_option', { optionId: 'lost-found-return' });
  session = submit(session, task, 'right');
  session = dispatch(session, task, 'next');
  for (const tokenId of ['pencil-an', 'pencil-found', 'pencil-owner']) session = dispatch(session, task, 'add_phrase_token', { tokenId });
  session = submit(session, task, 'sentence');
  assert.equal(session.phase, 'success');
  session = dispatch(session, task, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(dispatch(session, task, 'restart').phase, 'intro');
});

test('事件排序可操作上移下移，錯答後重設排序並完成第二階段', () => {
  const task = STORY_SEQUENCE_TIMELINE_QUEST;
  let session = dispatch(createLearningTaskSession(task, 'timeline-test'), task, 'start');
  assert.equal(session.orderedItems[0], 'library-sort');
  assert.equal(dispatchLearningTask(session, task, 'move_ordered_item', { itemId: 'library-sort', toIndex: 99 }).error, 'invalid_order_move');
  session = submit(session, task, 'wrong-order');
  assert.equal(session.phase, 'feedback');
  session = dispatch(session, task, 'retry');
  session = dispatch(session, task, 'hint');
  const stage = task.stages[0];
  for (const [targetIndex, itemId] of stage.correctItemIds.entries()) {
    const currentIndex = session.orderedItems.indexOf(itemId);
    if (currentIndex !== targetIndex) session = dispatch(session, task, 'move_ordered_item', { itemId, toIndex: targetIndex });
  }
  assert.deepEqual(session.orderedItems, stage.correctItemIds);
  session = submit(session, task, 'right-order');
  assert.equal(session.phase, 'success');
  session = dispatch(session, task, 'next');
  session = dispatch(session, task, 'select_option', { optionId: 'library-summary-organize' });
  session = submit(session, task, 'summary');
  session = dispatch(session, task, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 3);
  assert.equal(dispatch(session, task, 'restart').phase, 'intro');
});

test('國語閱讀課綱映射只作第二學習階段參照，學期仍待核對', async () => {
  const map = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
  const context = map.verifiedLearningFocuses.find(({ id }) => id === 'chinese-contextual-vocabulary-sentence');
  const sequence = map.verifiedLearningFocuses.find(({ id }) => id === 'chinese-narrative-sequence-structure');
  assert.deepEqual(context.contentCodes, ['Ab-Ⅱ-6', 'Ac-Ⅱ-2']);
  assert.deepEqual(context.gradeRange, [3, 4]);
  assert.equal(context.localGrade3ScheduleStatus, 'pending_review');
  assert.deepEqual(sequence.contentCodes, ['Ba-Ⅱ-1', 'Ad-Ⅱ-2']);
  assert.deepEqual(sequence.gradeRange, [3, 4]);
  assert.equal(sequence.localGrade3ScheduleStatus, 'pending_review');
  assert.ok(CATALOG_CANDIDATE_TASKS.length >= 3);
});
