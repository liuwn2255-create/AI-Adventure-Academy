import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { SUBJECT_DEFINITIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE4_CANDIDATE_LEARNING_ROUTE, validateGrade4CandidateLearningRoute } from '../prototype/data/grade4CandidateLearningRoute.js';
import { validateLearningTask } from '../prototype/learningTaskEngine.js';

const curriculum = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const allFocuses = [...(curriculum.verifiedLearningFocuses ?? []), ...(curriculum.supplementalVerifiedLearningFocuses ?? []), ...(curriculum.pendingLearningFocuses ?? [])];

test('四年級候選路線由八個主要科目中既有的可玩候選活動組成', () => {
  assert.deepEqual(validateGrade4CandidateLearningRoute(), []);
  assert.equal(GRADE4_CANDIDATE_LEARNING_ROUTE.status, 'candidate_pending_teacher_review');
  assert.equal(GRADE4_CANDIDATE_LEARNING_ROUTE.sequenceType, 'project_suggested_experience_order_not_official_grade_or_semester_sequence');
  assert.equal(GRADE4_CANDIDATE_LEARNING_ROUTE.progressPersistence, 'memory_only_no_student_records_no_localStorage');
  assert.deepEqual(GRADE4_CANDIDATE_LEARNING_ROUTE.omittedCatalogEntries.map(({ subjectId }) => subjectId), ['national-and-new-resident-languages', 'living-curriculum', 'technology']);
  for (const omitted of GRADE4_CANDIDATE_LEARNING_ROUTE.omittedCatalogEntries) {
    assert.ok(SUBJECT_DEFINITIONS.some(({ subjectId }) => subjectId === omitted.subjectId));
    assert.ok(omitted.reason);
  }
  assert.equal(new Set(GRADE4_CANDIDATE_LEARNING_ROUTE.stops.map(({ subjectId }) => subjectId)).size, 8);
  assert.equal(new Set(GRADE4_CANDIDATE_LEARNING_ROUTE.stops.map(({ activityId }) => activityId)).size, 8);

  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-4');
  assert.deepEqual(grade.candidateRoutes.map(({ routeId }) => routeId), [GRADE4_CANDIDATE_LEARNING_ROUTE.routeId]);
  for (const stop of GRADE4_CANDIDATE_LEARNING_ROUTE.stops) {
    const task = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === stop.activityId);
    assert.ok(task, `${stop.activityId} must resolve to a task`);
    assert.deepEqual(validateLearningTask(task), [], stop.activityId);
    assert.equal(task.gradeId, 'grade-4');
    assert.equal(task.subjectId, stop.subjectId);
    assert.ok(grade.subjects.find(({ subjectId }) => subjectId === stop.subjectId)?.existingYearLevelContent.some(({ activityId }) => activityId === stop.activityId), `${stop.activityId} must be in the matching grade subject directory`);
    assert.ok(stop.interactionTypes.length > 0);
    assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    const focus = allFocuses.find(({ id }) => id === stop.curriculumMapId);
    assert.ok(focus, `${stop.curriculumSourceRef} must resolve`);
    assert.ok(focus.officialTextReviewStatus === 'verified_against_official_text' || focus.status === 'verified_in_official_guideline_stage_scope', `${stop.curriculumMapId} must retain its recorded source verification status`);
  }
});

test('路線入口、完成接續與地圖返回只描述候選體驗，不新增正式解鎖或持久化', async () => {
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="grade-candidate-route-panel"/);
  assert.match(app, /renderCandidateRoutes\(grade\)/);
  assert.match(app, /SUBJECT_DEFINITIONS/);
  assert.match(app, /本路線未納入的目錄項目及原因/);
  assert.match(app, /startCatalogCandidateTask\(stop\.activityId, \{ routeId: route\.routeId, stopIndex: stop\.order - 1 \}\)/);
  assert.match(app, /下一站：/);
  assert.match(app, /返回四年級學習路線/);
  assert.match(app, /completedCandidateRouteStops = new Set\(\)/);
  assert.doesNotMatch(app, /localStorage\.(setItem|removeItem)\([^)]*candidateRoute/i);
});
