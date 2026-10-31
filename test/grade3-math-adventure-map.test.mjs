import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE3_MATH_ADVENTURE_MAP, GRADE3_MATH_LEGACY_ENTRY_REFERENCES, buildGrade3MathAdventureMap } from '../prototype/data/grade3MathAdventureMap.js';
import { createLearningTaskSession, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { MATH_DATA_TABLE_WORKSHOP } from '../prototype/data/mathDataTableWorkshop.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';

const appSource = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');

test('三年級數學冒險地圖完整列出已註冊的數學候選活動且每項只出現一次', () => {
  const expected = [...CATALOG_CANDIDATE_TASKS.filter((task) => task.gradeId === 'grade-3' && task.subjectId === 'mathematics'), MATH_DATA_TABLE_WORKSHOP];
  const actual = GRADE3_MATH_ADVENTURE_MAP.regions.flatMap(({ activities }) => activities);
  assert.equal(GRADE3_MATH_ADVENTURE_MAP.registeredActivityCount, expected.length);
  assert.deepEqual(GRADE3_MATH_ADVENTURE_MAP.unassignedActivityIds, []);
  assert.equal(actual.length, expected.length);
  assert.equal(new Set(actual.map(({ activityId }) => activityId)).size, actual.length);
  assert.deepEqual(new Set(actual.map(({ activityId }) => activityId)), new Set(expected.map(({ activityId }) => activityId)));
});

test('每個可遊玩地圖節點都有目錄註冊、可驗證任務與實際啟動入口', () => {
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const subject = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  const directoryIds = new Set(subject.existingYearLevelContent.map(({ activityId }) => activityId));
  for (const region of GRADE3_MATH_ADVENTURE_MAP.regions) {
    for (const activity of region.activities) {
      assert.ok(CATALOG_CANDIDATE_TASK_BY_ID.has(activity.activityId) || activity.activityId === MATH_DATA_TABLE_WORKSHOP.activityId, activity.activityId);
      assert.ok(directoryIds.has(activity.activityId), `目錄未連結：${activity.activityId}`);
      assert.deepEqual(validateLearningTask(activity), [], activity.activityId);
      assert.ok(createLearningTaskSession(activity).phase === 'intro');
      assert.ok(activity.learningObjective?.statement, activity.activityId);
    }
  }
  assert.match(appSource, /startCatalogCandidateTask\(activity\.activityId, \{ kind: 'grade3-math-adventure-map' \}\)/);
  assert.match(appSource, /返回三年級數學冒險地圖/);
  assert.match(html, /id="grade3-math-adventure-regions"/);
  assert.match(appSource, /activity\.activityId === MATH_DATA_TABLE_WORKSHOP\.activityId/);
});

test('區域數量由註冊活動動態計算，並保留六個指定區域', () => {
  const rebuilt = buildGrade3MathAdventureMap([...CATALOG_CANDIDATE_TASKS, { ...CATALOG_CANDIDATE_TASKS.find((task) => task.gradeId === 'grade-3' && task.subjectId === 'mathematics'), activityId: 'ACT-TEST-G3-MATH-DYNAMIC' }]);
  assert.equal(rebuilt.registeredActivityCount, GRADE3_MATH_ADVENTURE_MAP.registeredActivityCount + 1);
  assert.equal(rebuilt.regions.reduce((sum, region) => sum + region.activityCount, 0), rebuilt.registeredActivityCount);
  assert.deepEqual(rebuilt.regions.map(({ id }) => id), ['number-operations', 'fractions-decimals', 'geometry', 'measurement', 'time', 'data-reasoning']);
});

test('三年級數學學習關聯的舊數字島任務有明確舊入口說明，未冒充直接候選關卡', () => {
  const relation = getLearningTaskRelation('grade-3', 'mathematics');
  const mappedIds = new Set(GRADE3_MATH_ADVENTURE_MAP.regions.flatMap(({ activities }) => activities.map(({ activityId }) => activityId)));
  const legacyIds = new Set(GRADE3_MATH_LEGACY_ENTRY_REFERENCES.map(({ activityId }) => activityId));
  const allDeclared = new Set([...mappedIds, ...legacyIds]);
  assert.equal(allDeclared.size, mappedIds.size + legacyIds.size);
  for (const task of relation.tasks) assert.ok(allDeclared.has(task.taskId), `學習關聯未在冒險地圖或舊入口說明：${task.taskId}`);
  assert.deepEqual(GRADE3_MATH_LEGACY_ENTRY_REFERENCES.map(({ status }) => status), [
    'existing_playable_prototype_pending_teacher_review',
    'candidate_pending_teacher_review',
  ]);
});

test('地圖流程只設定候選記憶體返回路徑，不連接正式學生進度或解鎖寫入', () => {
  assert.match(appSource, /kind: 'grade3-math-adventure-map'/);
  assert.match(appSource, /function returnToGrade3MathAdventureMap\(\)/);
  assert.match(appSource, /renderGradeSelection\(\);\s*showScreen\('select'\)/);
  assert.match(html, /完成狀態只在本次記憶體流程中使用/);
});
