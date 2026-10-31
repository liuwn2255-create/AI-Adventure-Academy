import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ENGLISH_SCENARIO_ADVENTURE } from '../prototype/data/englishScenarioAdventure.js';
import { ANIMAL_OBSERVATION_EXPLORATION } from '../prototype/data/animalObservationExploration.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';

function submitCorrect(session, activity) {
  const stage = activity.stages[session.stageIndex];
  let state = session;
  if (state.phase === 'intro') state = dispatchLearningTask(state, activity, 'start').session;
  if (stage.interaction === 'assemble_response') {
    for (const tokenId of stage.correctOptionIds) state = dispatchLearningTask(state, activity, 'add_phrase_token', { tokenId }).session;
  } else {
    for (const [observationId, categoryId] of Object.entries(stage.correctAssignments)) state = dispatchLearningTask(state, activity, 'assign_category', { observationId, categoryId }).session;
  }
  return dispatchLearningTask(state, activity, 'submit').session;
}

test('英語情境活動 ID、候選課綱關聯及語塊答案資料有效', () => {
  assert.deepEqual(validateLearningTask(ENGLISH_SCENARIO_ADVENTURE), []);
  assert.equal(ENGLISH_SCENARIO_ADVENTURE.status, 'candidate_pending_teacher_review');
  assert.deepEqual(ENGLISH_SCENARIO_ADVENTURE.curriculumCodes, ['2-Ⅱ-5', 'B-Ⅱ-1']);
  for (const stage of ENGLISH_SCENARIO_ADVENTURE.stages) {
    const tokenIds = stage.tokens.map(({ id }) => id);
    assert.equal(new Set(tokenIds).size, tokenIds.length);
    assert.ok(stage.correctOptionIds.every((id) => tokenIds.includes(id)));
    assert.equal(stage.correctOptionIds.map((id) => stage.tokens.find((token) => token.id === id).text).join(' '), {
      'greeting-response': "I'm fine, thank you.",
      'borrow-request': 'May I borrow your pencil, please?',
      'transfer-classroom': 'Can I have a blue crayon, please?',
    }[stage.stageId]);
  }
  assert.equal(ENGLISH_SCENARIO_ADVENTURE.reinforcementActivityIds.length, 0);
});

test('英語語塊組句可錯誤回饋、重試、提示後完成並記錄候選事件', () => {
  const activity = ENGLISH_SCENARIO_ADVENTURE;
  let state = dispatchLearningTask(createLearningTaskSession(activity, 'english-test'), activity, 'start').session;
  state = dispatchLearningTask(state, activity, 'add_phrase_token', { tokenId: 'greet-blue' }).session;
  state = dispatchLearningTask(state, activity, 'submit').session;
  assert.equal(state.phase, 'feedback');
  assert.equal(state.attempts[0].result, 'incorrect');
  state = dispatchLearningTask(state, activity, 'retry').session;
  state = dispatchLearningTask(state, activity, 'hint').session;
  for (const tokenId of activity.stages[0].correctOptionIds) state = dispatchLearningTask(state, activity, 'add_phrase_token', { tokenId }).session;
  const success = dispatchLearningTask(state, activity, 'submit');
  assert.equal(success.session.phase, 'success');
  assert.equal(success.attempt.hintUsed, true);
  assert.equal(dispatchLearningTask(success.session, activity, 'submit').changed, false);
  state = success.session;
  state = dispatchLearningTask(state, activity, 'next').session;
  assert.equal(state.stageIndex, 1);
});

test('自然科學觀察紀錄分類按證據互動，分類答案與課綱來源一致', () => {
  assert.deepEqual(validateLearningTask(ANIMAL_OBSERVATION_EXPLORATION), []);
  assert.equal(ANIMAL_OBSERVATION_EXPLORATION.status, 'candidate_pending_teacher_review');
  assert.deepEqual(ANIMAL_OBSERVATION_EXPLORATION.curriculumCodes, ['po-Ⅱ-1', 'INb-Ⅱ-5']);
  const stage = ANIMAL_OBSERVATION_EXPLORATION.stages[0];
  const byId = Object.fromEntries(stage.observations.map(({ id }) => [id, id]));
  assert.deepEqual(Object.keys(stage.correctAssignments).sort(), Object.keys(byId).sort());
  assert.equal(stage.correctAssignments['part-head'], 'shared');
  assert.equal(stage.correctAssignments['part-trunk'], 'varies');
  assert.equal(ANIMAL_OBSERVATION_EXPLORATION.reinforcementActivityIds.length, 0);
});

test('自然分類錯答後可重試、完成不同階段並重玩；不建立正式學習進度', () => {
  const activity = ANIMAL_OBSERVATION_EXPLORATION;
  let state = dispatchLearningTask(createLearningTaskSession(activity, 'science-test'), activity, 'start').session;
  state = dispatchLearningTask(state, activity, 'assign_category', { observationId: 'part-head', categoryId: 'varies' }).session;
  const incomplete = dispatchLearningTask(state, activity, 'submit');
  assert.equal(incomplete.error, 'response_required');
  for (const [observationId, categoryId] of Object.entries(activity.stages[0].correctAssignments)) state = dispatchLearningTask(state, activity, 'assign_category', { observationId, categoryId }).session;
  state = dispatchLearningTask(state, activity, 'submit').session;
  assert.equal(state.phase, 'success');
  for (let index = 1; index < activity.stages.length; index += 1) {
    state = dispatchLearningTask(state, activity, 'next').session;
    state = submitCorrect(state, activity);
  }
  state = dispatchLearningTask(state, activity, 'next').session;
  assert.equal(state.phase, 'completed');
  const restarted = dispatchLearningTask(state, activity, 'restart');
  assert.equal(restarted.session.phase, 'intro');
  assert.equal(restarted.session.attempts.length, 0);
  assert.equal(ANIMAL_OBSERVATION_EXPLORATION.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
});

test('課程目錄能從三年級英語與自然科學科目進入兩個獨立候選任務', () => {
  const subjects = GRADE_CATALOG[2].subjects;
  for (const [subjectId, activityId, targetScreen] of [
    ['english-language', ENGLISH_SCENARIO_ADVENTURE.activityId, 'english-quest'],
    ['natural-science', ANIMAL_OBSERVATION_EXPLORATION.activityId, 'science-quest'],
  ]) {
    const subject = subjects.find((entry) => entry.subjectId === subjectId);
    assert.equal(subject.developmentStatus, 'playable_candidate_prototype');
    assert.equal(subject.existingYearLevelContent[0].activityId, activityId);
    assert.equal(subject.existingYearLevelContent[0].entryRoute.targetScreen, targetScreen);
    assert.equal(subject.existingYearLevelContent[0].progressPersistence, 'memory_only_no_student_records_no_localStorage');
  }
});

test('首頁課程目錄有英語與自然活動入口、獨立畫面及重用互動引擎的操作呈現', async () => {
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const map = JSON.parse(await readFile(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
  assert.match(html, /id="grade-subject-open-english"/);
  assert.match(html, /id="grade-subject-open-science"/);
  assert.match(html, /id="english-quest-screen"/);
  assert.match(html, /id="science-quest-screen"/);
  assert.match(app, /renderReusableCandidateTask\(ENGLISH_SCENARIO_ADVENTURE/);
  assert.match(app, /renderReusableCandidateTask\(ANIMAL_OBSERVATION_EXPLORATION/);
  for (const activity of [ENGLISH_SCENARIO_ADVENTURE, ANIMAL_OBSERVATION_EXPLORATION]) {
    const relation = map.learningObjectiveTaskCrosswalk.find(({ gradeId, tasks }) => gradeId === 'grade-3' && tasks.some(({ taskId }) => taskId === activity.activityId));
    assert.ok(relation);
    assert.ok(relation.tasks.some(({ taskId, status, evidenceType }) => taskId === activity.activityId
      && status === 'playable_candidate_pending_teacher_review'
      && evidenceType === 'candidate_practice_response_only_memory_only'));
  }
});
