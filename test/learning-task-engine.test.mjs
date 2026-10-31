import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { STORY_FOREST_READING_QUEST } from '../prototype/data/storyForestReadingQuest.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';

const pass = (session) => {
  let state = dispatchLearningTask(session, STORY_FOREST_READING_QUEST, 'start').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'toggle_evidence', { optionId: 'garden-clue-action' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'toggle_evidence', { optionId: 'garden-clue-routine' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'submit').session;
  return state;
};

test('閱讀任務有唯一階段與選項 ID，課綱關聯保持候選且教材來源明確', async () => {
  assert.deepEqual(validateLearningTask(STORY_FOREST_READING_QUEST), []);
  assert.equal(STORY_FOREST_READING_QUEST.status, 'candidate_pending_teacher_review');
  assert.equal(STORY_FOREST_READING_QUEST.sourceKind, 'original_prototype_text_not_from_textbook');
  assert.equal(STORY_FOREST_READING_QUEST.curriculumMapId, 'chinese-reading-comprehension');
  assert.equal(STORY_FOREST_READING_QUEST.reinforcementActivityIds.length, 0);
  const objectiveMap = JSON.parse(await readFile(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
  assert.ok(objectiveMap.learningObjectiveTaskCrosswalk.some((relation) => relation.tasks.some((task) => task.taskId === STORY_FOREST_READING_QUEST.activityId)));
});

test('線索蒐集與篇章理解支援錯答、提示、重試及不同情境遷移', () => {
  let state = dispatchLearningTask(createLearningTaskSession(STORY_FOREST_READING_QUEST, 'read-test'), STORY_FOREST_READING_QUEST, 'start').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'toggle_evidence', { optionId: 'garden-clue-weather' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'toggle_evidence', { optionId: 'garden-clue-appearance' }).session;
  const wrong = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'submit');
  assert.equal(wrong.session.phase, 'feedback');
  assert.equal(wrong.session.attempts[0].result, 'incorrect');
  assert.match(wrong.session.lastFeedback.text, /情況|結果/);
  assert.equal(dispatchLearningTask(wrong.session, STORY_FOREST_READING_QUEST, 'hint').session.phase, 'feedback');
  state = dispatchLearningTask(wrong.session, STORY_FOREST_READING_QUEST, 'retry').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'hint').session;
  assert.equal(state.hintLevel, 1);
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'toggle_evidence', { optionId: 'garden-clue-action' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'toggle_evidence', { optionId: 'garden-clue-routine' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'submit').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'next').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'select_option', { optionId: 'garden-main-care' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'submit').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'next').session;
  assert.equal(STORY_FOREST_READING_QUEST.stages[state.stageIndex].passageId, 'hallway');
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'select_option', { optionId: 'hallway-safe' }).session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'submit').session;
  state = dispatchLearningTask(state, STORY_FOREST_READING_QUEST, 'next').session;
  assert.equal(state.phase, 'completed');
  assert.equal(state.attempts.length, 4);
  assert.ok(state.attempts.every((event) => event.activityId === STORY_FOREST_READING_QUEST.activityId && event.eventId));
  assert.equal(state.status, 'candidate_pending_teacher_review');
});

test('閱讀任務候選作答僅保留在記憶體，數學正式單元與正式進度規則不變', async () => {
  const activity = GRADE_CATALOG[2].subjects.find(({ subjectId }) => subjectId === 'chinese-language');
  assert.equal(activity.developmentStatus, 'playable_candidate_prototype');
  const objectives = JSON.parse(await readFile(new URL('../curriculum/learning-objectives.json', import.meta.url), 'utf8'));
  const progress = JSON.parse(await readFile(new URL('../curriculum/student-progress-model.json', import.meta.url), 'utf8'));
  const registry = JSON.parse(await readFile(new URL('../curriculum/unit-registry.json', import.meta.url), 'utf8'));
  assert.equal(progress.records.length, 0);
  assert.equal(progress.implementationStatus, 'specification_only_not_implemented');
  assert.equal(objectives.boundaries.stage0Status, 'not_passed');
  assert.equal(registry.units.find(({ unitId }) => unitId === 'M3-NUM-01')?.status, 'candidate');
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  assert.match(html, /grade-subject-open-reading/);
  assert.match(html, /reading-quest-screen/);
});
