import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { DEDICATED_GRADE_ACTIVITY_IDS, getGradeAdventureSummary, getSubjectDirectorySummary, getSubjectLaunchableActivities } from '../prototype/data/gradeActivityDirectory.js';
import { GRADE3_MATH_ADVENTURE_MAP } from '../prototype/data/grade3MathAdventureMap.js';
import { GRADE3_MATH_REPAIR_MAINLINE } from '../prototype/data/grade3MathRepairMainline.js';
import { validateLearningTask } from '../prototype/learningTaskEngine.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');

test('一至六年級入口活動數由共用註冊資料和明確的專用啟動器計算', () => {
  assert.deepEqual(GRADE_CATALOG.map(({ gradeNumber }) => gradeNumber), [1, 2, 3, 4, 5, 6]);
  const summaries = GRADE_CATALOG.map(getGradeAdventureSummary);
  const total = summaries.reduce((sum, summary) => sum + summary.activityCount, 0);
  assert.equal(total, CATALOG_CANDIDATE_TASKS.length + DEDICATED_GRADE_ACTIVITY_IDS.length);
  assert.equal(total, new Set(summaries.flatMap(({ subjects }) => subjects.flatMap(({ activities }) => activities.map(({ activityId }) => activityId)))).size);
  assert.deepEqual(summaries.map(({ activityCount }) => activityCount), [14, 20, 38, 45, 14, 21]);
  assert.ok(summaries.every(({ candidatePendingTeacherReviewCount, activityCount }) => candidatePendingTeacherReviewCount === activityCount));
});

test('每個可玩共用候選活動均有相符年級科目註冊與可啟動任務資料', () => {
  for (const task of CATALOG_CANDIDATE_TASKS) {
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId);
    const subject = grade?.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(subject?.existingYearLevelContent.some(({ activityId }) => activityId === task.activityId), `目錄未註冊 ${task.activityId}`);
    assert.ok(CATALOG_CANDIDATE_TASK_BY_ID.has(task.activityId));
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
  }
});

test('六個專用年級三活動都有目錄記錄、明確頁面入口及唯一資料屬性', () => {
  const declaredIds = GRADE_CATALOG.flatMap(({ subjects }) => subjects.flatMap(({ existingYearLevelContent }) => existingYearLevelContent.map(({ activityId }) => activityId).filter(Boolean)));
  const htmlIds = [...html.matchAll(/data-activity-id="(ACT-G3-(?:CHINESE-READING-GARDEN|ENGLISH-CLASSROOM-CONVERSATION|MATH-DATA-TABLE-WORKSHOP|SOCIAL-NEIGHBORHOOD-CHANGE|SCIENCE-ANIMAL-FORM-OBSERVATION|ARTS-RHYTHM-WORKSHOP)-CANDIDATE)"/g)].map((match) => match[1]);
  assert.equal(new Set(DEDICATED_GRADE_ACTIVITY_IDS).size, DEDICATED_GRADE_ACTIVITY_IDS.length);
  assert.deepEqual(new Set(htmlIds), new Set(DEDICATED_GRADE_ACTIVITY_IDS));
  for (const activityId of DEDICATED_GRADE_ACTIVITY_IDS) assert.ok(declaredIds.includes(activityId), activityId);
  assert.match(app, /grade-subject-open-reading/);
  assert.match(app, /grade-subject-open-english/);
  assert.match(app, /grade-subject-open-science/);
  assert.match(app, /grade-subject-open-social/);
  assert.match(app, /grade-subject-open-math-data/);
  assert.match(app, /grade-subject-open-arts/);
});

test('各學科目錄摘要與可啟動按鈕一致，沒有活動的領域不會標成可玩', () => {
  for (const grade of GRADE_CATALOG) {
    for (const subject of grade.subjects) {
      const activities = getSubjectLaunchableActivities(grade, subject);
      assert.equal(new Set(activities.map(({ activityId }) => activityId)).size, activities.length);
      if (activities.length) assert.ok(activities.every(({ status }) => status === 'candidate_pending_teacher_review'));
    }
  }
  assert.match(app, /getSubjectLaunchableActivities\(grade, subject\)/);
  assert.match(app, /候選待審/);
  assert.match(app, /尚無可玩活動/);
});

test('學生入口依序提示年級、科目與遊戲，並以動態卡片啟動四年級磁力活動', () => {
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  const subject = grade.subjects.find(({ subjectId }) => subjectId === 'natural-science');
  const activities = getSubjectLaunchableActivities(grade, subject);
  const magnet = activities.find(({ activityId }) => activityId === 'ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE');

  assert.ok(magnet, '四年級自然科學目錄必須列出磁力活動');
  assert.equal(magnet.status, 'candidate_pending_teacher_review');
  assert.equal(magnet.stages.length, 3);
  assert.match(app, /① 選年級 → ② 選科目 → ③ 選遊戲/);
  assert.match(app, /第 1 步｜選擇你的年級/);
  assert.match(app, /第 2 步｜選擇科目/);
  assert.match(app, /第 3 步｜選一個遊戲開始探險/);
  assert.match(app, /找到 \$\{subjectActivities\.length\} 個可以挑戰的遊戲/);
  assert.match(app, /\$\{activity\.stages\?\.length \?\? 0\} 個挑戰/);
  assert.match(app, /launch\.textContent = '開始挑戰'/);
  assert.match(app, /launch\.dataset\.activityId = activity\.activityId/);
  assert.match(app, /startCatalogCandidateTask\(activity\.activityId\)/);
});

test('三年級數學舊原型、受條件限制及未開放目錄參照與 25 個候選入口分開統計', () => {
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const subject = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  const summary = getSubjectDirectorySummary(grade, subject);
  assert.equal(summary.activityCount, 25);
  assert.equal(summary.candidatePendingTeacherReviewCount, 25);
  assert.equal(summary.legacyPlayableReferenceCount, 2);
  assert.equal(summary.gatedReferenceCount, 1);
  assert.equal(summary.underDevelopmentReferenceCount, 5);
  assert.equal(summary.directoryOnlyReferenceCount, 2);
});

test('三年級數學冒險地圖與十站主線仍保留原有註冊和入口', () => {
  assert.equal(GRADE3_MATH_ADVENTURE_MAP.regions.flatMap(({ activities }) => activities).length, GRADE3_MATH_ADVENTURE_MAP.registeredActivityCount);
  assert.equal(GRADE3_MATH_REPAIR_MAINLINE.stops.length, 10);
  assert.match(app, /renderGrade3MathAdventureMap\(\)/);
  assert.match(app, /startGrade3MathRepairMainline/);
  assert.match(app, /返回三年級數學冒險地圖/);
  assert.match(html, /grade3-math-adventure-regions/);
});

test('冒險入口只讀取候選任務資料，不連接正式進度或解鎖寫入', () => {
  assert.match(app, /getGradeAdventureSummary\(grade\)/);
  assert.match(html, /完成狀態只在本次記憶體流程中使用/);
  assert.match(html, /不改變正式解鎖/);
  assert.doesNotMatch(app, /localStorage\.setItem\([^)]*(?:candidate-route|candidate-mainline)/);
});
