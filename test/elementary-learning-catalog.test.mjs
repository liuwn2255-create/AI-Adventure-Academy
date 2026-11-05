import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG, validateGradeCatalog } from '../prototype/data/gradeCatalog.js';
import {
  CURRICULUM_FRAMEWORK_SOURCE,
  ELEMENTARY_CURRICULUM_AREAS,
  GRADE1_SUBJECT_DIRECTORY_GROUPS,
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

test('一年級目錄以四組呈現完整十一科並保留二十六個既有活動入口', async () => {
  const grade1 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-1');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const formal = GRADE1_SUBJECT_DIRECTORY_GROUPS.find(({ groupId }) => groupId === 'formal-courses');
  const languageChoice = GRADE1_SUBJECT_DIRECTORY_GROUPS.find(({ groupId }) => groupId === 'language-choice');
  const integrated = GRADE1_SUBJECT_DIRECTORY_GROUPS.find(({ groupId }) => groupId === 'living-integrated-scopes');
  const extension = GRADE1_SUBJECT_DIRECTORY_GROUPS.find(({ groupId }) => groupId === 'extension-learning');

  assert.equal(SUBJECT_DEFINITIONS.length, 11);
  assert.equal(grade1.subjects.length, 11);
  assert.deepEqual(formal.subjects.map(({ subjectId }) => subjectId), [
    'chinese-language', 'mathematics', 'living-curriculum', 'health-physical-education',
  ]);
  assert.deepEqual(languageChoice.subjects.map(({ subjectId }) => subjectId), ['national-and-new-resident-languages']);
  assert.match(languageChoice.description, /依學生選習及學校開課安排/);
  assert.match(languageChoice.subjects[0].emptyActivityMessage, /不|目前沒有對應活動/);
  assert.deepEqual(integrated.subjects.map(({ subjectId }) => subjectId), [
    'social-studies', 'natural-science', 'arts', 'integrative-activities',
  ]);
  assert.match(integrated.description, /第一學習階段.*由生活課程統整/);
  assert.deepEqual(extension.subjects.map(({ subjectId }) => subjectId), ['english-language', 'technology']);
  assert.match(extension.subjects[0].emptyActivityMessage, /第二學習階段.*地方或學校安排可能不同/);
  assert.match(extension.subjects[1].emptyActivityMessage, /不是一年級獨立正式科技領域.*跨域或延伸學習/);

  const groupedSubjectIds = GRADE1_SUBJECT_DIRECTORY_GROUPS.flatMap(({ subjects }) => subjects.map(({ subjectId }) => subjectId));
  assert.equal(new Set(groupedSubjectIds).size, 11);
  assert.deepEqual([...groupedSubjectIds].sort(), grade1.subjects.map(({ subjectId }) => subjectId).sort());

  const activityEntries = grade1.subjects.flatMap(({ existingYearLevelContent }) => existingYearLevelContent.filter(({ entryRoute }) => entryRoute?.directLaunch === true));
  assert.equal(activityEntries.length, 26);
  assert.equal(new Set(activityEntries.map(({ activityId }) => activityId)).size, 26);
  assert.ok(activityEntries.every(({ status }) => status === 'candidate_pending_teacher_review'));
  assert.deepEqual(
    ['chinese-language', 'mathematics', 'living-curriculum', 'health-physical-education'].map((subjectId) => grade1.subjects.find((subject) => subject.subjectId === subjectId).existingYearLevelContent.length),
    [6, 9, 6, 5],
  );

  assert.match(app, /if \(grade\.gradeNumber === 1\)\s*\{[\s\S]*?GRADE1_SUBJECT_DIRECTORY_GROUPS[\s\S]*?\} else \{\s*for \(const subject of grade\.subjects\) renderSubjectCard\(subject\);/);
  for (const grade of GRADE_CATALOG.filter(({ gradeNumber }) => gradeNumber >= 2)) {
    assert.deepEqual(grade.subjects.map(({ subjectId }) => subjectId), SUBJECT_DEFINITIONS.map(({ subjectId }) => subjectId));
  }
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
