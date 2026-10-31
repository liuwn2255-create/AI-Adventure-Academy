import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG, validateGradeCatalog } from '../prototype/data/gradeCatalog.js';
import {
  CURRICULUM_FRAMEWORK_SOURCE,
  ELEMENTARY_CURRICULUM_AREAS,
  LEARNING_TASK_RELATIONS,
  SUBJECT_DEFINITIONS,
} from '../prototype/data/elementaryLearningCatalog.js';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('國小課程目錄有正式總綱來源、八大領域索引及六年級別入口', () => {
  assert.equal(CURRICULUM_FRAMEWORK_SOURCE.sourceId, 'core-general');
  assert.equal(CURRICULUM_FRAMEWORK_SOURCE.officialStatus, 'official_general_guidelines');
  assert.match(CURRICULUM_FRAMEWORK_SOURCE.sourceUrl, /^https:\/\/www\.naer\.edu\.tw\//);
  assert.deepEqual(CURRICULUM_FRAMEWORK_SOURCE.verifiedLocations.map(({ printedPage }) => printedPage), [11, 12]);
  assert.equal(ELEMENTARY_CURRICULUM_AREAS.length, 8);
  assert.ok(SUBJECT_DEFINITIONS.some(({ subjectId }) => subjectId === 'living-curriculum'));
  assert.ok(SUBJECT_DEFINITIONS.some(({ subjectId }) => subjectId === 'national-and-new-resident-languages'));
  assert.deepEqual(validateGradeCatalog(), []);

  for (const grade of GRADE_CATALOG) {
    assert.equal(grade.subjects.length, SUBJECT_DEFINITIONS.length);
    assert.deepEqual(grade.semesters.map(({ status }) => status), ['schedule_not_confirmed', 'schedule_not_confirmed']);
    for (const course of grade.subjects) {
      assert.ok(course.curriculumSourceRef.locations.length > 0);
      assert.ok(course.curriculumApplicabilityStatus.includes('pending') || course.subjectId === 'mathematics' && grade.gradeNumber === 3);
      assert.ok(['not_built', 'scope_inventory_only_no_playable_task', 'prototype_content_exists', 'playable_candidate_prototype'].includes(course.developmentStatus));
      assert.equal(course.semesterSlots.length, 2);
    }
  }
});

test('學習目標與遊戲任務支援多對多關聯，三年級示範連結可追溯活動地圖', async () => {
  const map = await readJson('../curriculum/learning-activity-map.json');
  const registry = await readJson('../curriculum/unit-registry.json');
  const relation = LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-3' && subjectId === 'mathematics');
  assert.ok(relation);
  assert.ok(relation.learningObjectiveTaskLinks.some(({ taskIds }) => taskIds.length > 1));
  assert.ok(relation.learningObjectiveTaskLinks.every(({ taskIds }) => taskIds.length > 0));
  assert.ok(relation.tasks.some(({ learningObjectiveIds }) => learningObjectiveIds.length > 1));
  assert.ok(relation.tasks.every(({ learningObjectiveIds }) => learningObjectiveIds.length > 0));
  const mapped = map.activities.find(({ activityId }) => activityId === 'ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET');
  assert.ok(mapped);
  assert.deepEqual(relation.tasks[0].learningObjectiveIds, mapped.learningObjectiveIds);
  assert.deepEqual(relation.tasks[0].learningObjectiveIds, map.runtimeLearningUnitPrototype.learningObjectiveIds);
  assert.equal(map.runtimeLearningUnitPrototype.formalUnitRef.status, 'candidate');
  assert.equal(registry.units.find(({ unitId }) => unitId === 'M3-NUM-01')?.status, 'candidate');
  assert.equal(map.boundaries.stage0Status, 'not_passed');
  assert.equal(map.boundaries.studentRecordsCreated, false);
  assert.equal(map.runtimeLearningUnitPrototype.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
});

test('可操作的舊地圖任務有入口參照，未建置內容不會偽裝成可玩', () => {
  const grade3 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const math = grade3.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.ok(math.existingYearLevelContent.some(({ levelId, runtimeAvailability }) => levelId === 'number-secret-challenge' && runtimeAvailability === 'playable_prototype'));
  assert.equal(grade3.subjects.find(({ subjectId }) => subjectId === 'arts')?.developmentStatus, 'playable_candidate_prototype');
  const grade1Math = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-1').subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.equal(grade1Math?.developmentStatus, 'playable_candidate_prototype');
  assert.equal(grade1Math?.existingYearLevelContent.length, 9);
  assert.ok(grade1Math.existingYearLevelContent.some(({ activityId, status }) => activityId === 'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE' && status === 'candidate_pending_teacher_review'));
  assert.ok(grade1Math.existingYearLevelContent.some(({ activityId }) => activityId === 'ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE'));
  assert.ok(grade1Math.existingYearLevelContent.some(({ activityId }) => activityId === 'ACT-G1-MATH-ZERO-PLACEHOLDER-EXPLORER-CANDIDATE'));
  assert.ok(grade1Math.existingYearLevelContent.some(({ activityId }) => activityId === 'ACT-G1-MATH-COMPARISON-DIFFERENCE-NUMBER-LINE-CANDIDATE'));
  assert.ok(grade1Math.existingYearLevelContent.some(({ activityId }) => activityId === 'ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE'));
  assert.ok(grade1Math.existingYearLevelContent.some(({ activityId }) => activityId === 'ACT-G1-MATH-LENGTH-COMPARE-ROPE-CANDIDATE'));
  const chinese = grade3.subjects.find(({ subjectId }) => subjectId === 'chinese-language');
  assert.equal(chinese.developmentStatus, 'playable_candidate_prototype');
  assert.equal(chinese.existingYearLevelContent[0]?.entryRoute.targetScreen, 'reading-quest');
  const readingRelation = LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === 'grade-3' && subjectId === 'chinese-language');
  assert.equal(readingRelation.curriculumMapIds[0], 'chinese-reading-comprehension');
  assert.equal(readingRelation.tasks[0].status, 'playable_candidate_pending_teacher_review');
});

test('二年級數學、國語文、生活課程候選任務由正確科目目錄連結且仍待教師審查', () => {
  const grade2 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-2');
  assert.equal(grade2.developmentStatus, 'in_development_partial');
  const expected = {
    mathematics: ['ACT-G2-MATH-TWO-STEP-MARKET-CANDIDATE', 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE', 'ACT-G2-MATH-THOUSAND-NUMBER-LINE-CANDIDATE', 'ACT-G2-MATH-PLACE-VALUE-CALCULATION-CANDIDATE', 'ACT-G2-MATH-CAPACITY-WEIGHT-AREA-COMPARISON-CANDIDATE', 'ACT-G2-MATH-DATA-CLASSIFICATION-NESTED-GROUPS-CANDIDATE', 'ACT-G2-MATH-UNKNOWN-QUANTITY-MODEL-CANDIDATE', 'ACT-G2-MATH-UNIT-FRACTION-PAPER-FOLD-MODEL-CANDIDATE', 'ACT-G2-MATH-LIFE-ESTIMATION-HUNDREDS-CANDIDATE', 'ACT-G2-MATH-LENGTH-MEASURE-CONVERT-CANDIDATE', 'ACT-G2-MATH-ZERO-TENS-ADDITION-CANDIDATE', 'ACT-G2-MATH-TWO-CARRY-ADDITION-CANDIDATE', 'ACT-G2-MATH-CLOCK-HANDS-CANDIDATE', 'ACT-G2-MATH-SHARE-AND-PACK-PORT-CANDIDATE'],
    'chinese-language': ['ACT-G2-CHINESE-STORY-CLUE-CANDIDATE', 'ACT-G2-CHINESE-CONTEXT-WORDS-CANDIDATE'],
    'living-curriculum': ['ACT-G2-LIVING-CAMPUS-OBSERVATION-CANDIDATE', 'ACT-G2-LIVING-RULES-REASON-QUEST-CANDIDATE', 'ACT-G2-LIVING-CHANGE-CLUE-CANDIDATE', 'ACT-G2-LIVING-INQUIRY-PLAN-CANDIDATE'],
  };
  for (const [subjectId, ids] of Object.entries(expected)) {
    const subject = grade2.subjects.find((entry) => entry.subjectId === subjectId);
    assert.equal(subject.developmentStatus, 'playable_candidate_prototype');
    assert.deepEqual(subject.existingYearLevelContent.map(({ activityId }) => activityId), ids);
    assert.ok(subject.existingYearLevelContent.every(({ status, runtimeAvailability, entryRoute, progressPersistence }) => status === 'candidate_pending_teacher_review' && runtimeAvailability === 'playable_candidate_prototype' && entryRoute.targetScreen === 'catalog-task' && progressPersistence === 'memory_only_no_student_records_no_localStorage'));
  }
});
