import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
const rendererStart = app.indexOf('function renderReusableCandidateTask(');
const rendererEnd = app.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
const renderer = app.slice(rendererStart, rendererEnd);

test('候選活動介紹先顯示學生任務、挑戰數與開始按鈕，教師資訊預設收合且資料仍保留', () => {
  const intro = renderer.match(/if \(session\.phase === 'intro'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(intro, /activity\.stages\[0\]\?\.prompt/);
  assert.match(intro, /\$\{activity\.stages\.length\} 個挑戰/);
  assert.match(intro, /button\('開始挑戰'/);
  assert.doesNotMatch(intro, /curriculumCodes|curriculumMapId|curriculumScope|openQuestions/);
  assert.match(renderer, /element\('details', 'candidate-teacher-info'\)/);
  assert.match(renderer, /👩‍🏫 教師／課綱資訊/);
  assert.match(renderer, /activity\.status/);
  assert.match(renderer, /activity\.learningObjective\?\.objectiveId/);
  assert.match(renderer, /activity\.curriculumCodes/);
  assert.match(renderer, /activity\.curriculumMapId/);
  assert.match(renderer, /activity\.curriculumScope/);
  assert.match(renderer, /activity\.coverage/);
  assert.match(renderer, /activity\.openQuestions/);
  assert.match(html, /<details class="reading-quest-note candidate-teacher-info-static"><summary>👩‍🏫 候選流程資訊/);
});

test('挑戰畫面以任務提示和互動方式為主，材料分類進度取自觀察數與 assignments', () => {
  const materialActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE');
  const materialStage = materialActivity.stages.find(({ stageId }) => stageId === 'sort-absorption');
  assert.equal(materialStage.interaction, 'classify_observations');
  assert.equal(materialStage.observations.length, 3);
  assert.deepEqual(materialStage.correctAssignments, { cloth: 'absorbs', plastic: 'stays', paper: 'absorbs' });
  assert.match(renderer, /這一關要做什麼：\$\{stage\.prompt\}/);
  assert.match(renderer, /這是單選題，請選 1 個答案/);
  assert.match(renderer, /這是複選題，請選 \$\{answerCount\} 個答案/);
  assert.match(renderer, /操作方式：① 看觀察紀錄 → ② 選擇分類/);
  assert.match(renderer, /作答進度：\$\{completedCount\} \/ \$\{stage\.observations\.length\}/);
  assert.match(renderer, /stage\.observations\.filter\(\(\{ id \}\) => Boolean\(session\.assignments\?\.\[id\]\)\)/);
});

test('完成畫面顯示簡短成果並可回遊戲選單，磁力活動仍使用共用互動 renderer', () => {
  const completion = renderer.match(/if \(session\.phase === 'completed'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(completion, /'挑戰完成！'/);
  assert.match(completion, /你完成了「\$\{studentActivityTitle\}」的 \$\{activity\.stages\.length\} 個挑戰/);
  assert.match(completion, /button\('回到遊戲選單'/);
  assert.match(completion, /selectedGradeId = activity\.gradeId/);
  assert.match(completion, /selectedSubjectId = activity\.subjectId/);
  assert.match(completion, /teacherInfo\.append\(list\)/);
  const magnet = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE');
  assert.equal(magnet.stages.length, 3);
  assert.ok(magnet.stages.every(({ interaction }) => interaction === 'magnet_interaction'));
  assert.match(renderer, /stage\.interaction === 'magnet_interaction'/);
  assert.match(renderer, /dispatchLearningTask\(session, activity, action, payload\)/);
});
