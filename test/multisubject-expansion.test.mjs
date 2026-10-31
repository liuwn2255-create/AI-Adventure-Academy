import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { MATH_DATA_TABLE_WORKSHOP } from '../prototype/data/mathDataTableWorkshop.js';
import { ARTS_RHYTHM_WORKSHOP } from '../prototype/data/artsRhythmWorkshop.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

test('資料表建造活動依官方 D-3-1 候選參照載入，票卡分類生成正確次數並可重玩', () => {
  const task = MATH_DATA_TABLE_WORKSHOP;
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
  let state = dispatchLearningTask(createLearningTaskSession(task, 'math-table-test'), task, 'start').session;
  for (const [observationId, categoryId] of Object.entries(task.stages[0].correctAssignments)) state = dispatchLearningTask(state, task, 'assign_category', { observationId, categoryId }).session;
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'success');
  assert.deepEqual(state.attempts[0].response, task.stages[0].correctAssignments);
  state = dispatchLearningTask(state, task, 'next').session;
  state = dispatchLearningTask(state, task, 'select_option', { optionId: 'fruit-max-pear' }).session;
  state = dispatchLearningTask(state, task, 'submit').session;
  state = dispatchLearningTask(state, task, 'next').session;
  assert.equal(state.phase, 'completed');
  assert.equal(dispatchLearningTask(state, task, 'restart').session.attempts.length, 0);
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
});

test('節奏拼組接受多個符合規則的創作，錯誤作品可重試且第二作需不同排列', () => {
  const task = ARTS_RHYTHM_WORKSHOP;
  assert.deepEqual(validateLearningTask(task), []);
  assert.deepEqual(task.curriculumCodes, ['1-Ⅱ-5', '音E-Ⅱ-5']);
  let state = dispatchLearningTask(createLearningTaskSession(task, 'arts-rhythm-test'), task, 'start').session;
  for (const tokenId of ['beat-drum', 'beat-drum', 'beat-clap']) state = dispatchLearningTask(state, task, 'add_pattern_beat', { tokenId }).session;
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'active');
  state = dispatchLearningTask(state, task, 'add_pattern_beat', { tokenId: 'beat-clap' }).session;
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'success');
  const first = [...state.attempts[0].response];
  state = dispatchLearningTask(state, task, 'next').session;
  for (const tokenId of first) state = dispatchLearningTask(state, task, 'add_pattern_beat', { tokenId }).session;
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'feedback');
  state = dispatchLearningTask(state, task, 'retry').session;
  for (const tokenId of ['beat-bell', 'beat-clap', 'beat-bell', 'beat-rest']) state = dispatchLearningTask(state, task, 'add_pattern_beat', { tokenId }).session;
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'success');
  state = dispatchLearningTask(state, task, 'next').session;
  assert.equal(state.phase, 'completed');
  assert.equal(state.attempts.length, 3);
  assert.equal(task.evidencePolicy.completionIsMastery, false);
});

test('兩項候選活動由三年級數學與藝術目錄可達，課程映射維持候選、階段對應保留界線', async () => {
  for (const [subjectId, task, screen] of [['mathematics', MATH_DATA_TABLE_WORKSHOP, 'math-data-quest'], ['arts', ARTS_RHYTHM_WORKSHOP, 'arts-quest']]) {
    const subject = GRADE_CATALOG[2].subjects.find((entry) => entry.subjectId === subjectId);
    assert.ok(subject.existingYearLevelContent.some((entry) => entry.activityId === task.activityId));
    assert.equal(subject.existingYearLevelContent.find((entry) => entry.activityId === task.activityId).entryRoute.targetScreen, screen);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.ok(getLearningTaskRelation('grade-3', subjectId).tasks.some((entry) => entry.taskId === task.activityId));
  }
  const sources = JSON.parse(await readFile(new URL('../curriculum/sources.json', import.meta.url), 'utf8'));
  assert.ok(sources.sources.find(({ id }) => id === 'arts')?.verifiedClauses.includes('音E-Ⅱ-5'));
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  assert.match(html, /grade-subject-open-math-data/);
  assert.match(html, /grade-subject-open-arts/);
});
