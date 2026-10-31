import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE3_MATH_ADVENTURE_MAP } from '../prototype/data/grade3MathAdventureMap.js';
import { GRADE3_MATH_REPAIR_MAINLINE, validateGrade3MathRepairMainline } from '../prototype/data/grade3MathRepairMainline.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');

test('數字島主線按候選先備關係串接既有三年級數學活動，並以兩步驟補給作結', () => {
  assert.deepEqual(validateGrade3MathRepairMainline(), []);
  assert.equal(GRADE3_MATH_REPAIR_MAINLINE.stops.length, 10);
  const mapIds = new Set(GRADE3_MATH_ADVENTURE_MAP.regions.flatMap(({ activities }) => activities.map(({ activityId }) => activityId)));
  for (const stop of GRADE3_MATH_REPAIR_MAINLINE.stops) {
    const task = CATALOG_CANDIDATE_TASK_BY_ID.get(stop.activityId);
    assert.ok(task, `missing task ${stop.activityId}`);
    assert.ok(mapIds.has(stop.activityId), `activity absent from adventure map: ${stop.activityId}`);
    assert.equal(task.gradeId, 'grade-3');
    assert.equal(task.subjectId, 'mathematics');
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.ok(task.stages.length > 0);
    assert.ok(stop.storyAfterCompletion);
  }
  assert.equal(GRADE3_MATH_REPAIR_MAINLINE.stops.at(-1).activityId, 'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE');
  assert.equal(GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3').candidateRoutes[0].routeId, GRADE3_MATH_REPAIR_MAINLINE.routeId);
});

test('地圖主線直接啟動第一站，完成後由共用任務完成畫面串接下一站', () => {
  assert.match(html, /id="grade3-math-repair-mainline"/);
  assert.match(app, /function startGrade3MathRepairMainline\(restart = false\)/);
  assert.match(app, /startCatalogCandidateTask\(stop\.activityId, \{ routeId: route\.routeId, stopIndex \}\)/);
  assert.match(app, /前往下一站：/);
  assert.match(app, /currentStop\.storyAfterCompletion/);
  assert.match(app, /route\.stops\[activeCandidateRouteContext\.stopIndex \+ 1\]/);
});

test('最後一站完成時顯示數字島主線結尾與有限範圍的綜合任務摘要', () => {
  const finale = GRADE3_MATH_REPAIR_MAINLINE.stops.at(-1);
  const finaleTask = CATALOG_CANDIDATE_TASK_BY_ID.get(finale.activityId);
  assert.equal(finaleTask.activityId, 'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE');
  assert.match(finaleTask.stages[0].prompt, /18 個水壺.*6 個/u);
  assert.equal(finaleTask.stages[0].resultValue, 24);
  assert.equal(finaleTask.stages[1].deriveFromPrevious.operation, 'divide');
  assert.ok(finaleTask.stages[1].options.some(({ value, id }) => value === 6 && id === 'share-6'));
  assert.match(app, /數字島修復完成！/u);
  assert.match(app, /第十站把 18 個水壺與新送來的 6 個先合成 24 個，再平均分裝到 4 箱，每箱 6 個/u);
});

test('主線完成及重玩只用頁面記憶體，不寫入正式進度或解鎖', () => {
  assert.equal(GRADE3_MATH_REPAIR_MAINLINE.progressPersistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(GRADE3_MATH_REPAIR_MAINLINE.unlockPolicy, 'candidate_route_sequence_only_no_formal_unlock_changes');
  assert.match(app, /completedCandidateRouteStops\.add\(activity\.activityId\)/);
  assert.match(app, /completedCandidateRouteStops\.delete\(stop\.activityId\)/);
  assert.equal(GRADE3_MATH_REPAIR_MAINLINE.unlockPolicy, 'candidate_route_sequence_only_no_formal_unlock_changes');
  assert.match(app, /candidate-memory-reward/);
});
