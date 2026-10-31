import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLearningMap, validateLearningMap } from '../scripts/learning-map.mjs';
import { GRADE_CATALOG, SUBJECT_DEFINITIONS, validateGradeCatalog } from '../prototype/data/gradeCatalog.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';

const loadJson = (filePath) => JSON.parse(fs.readFileSync(new URL(filePath, import.meta.url), 'utf8'));
const learningMap = loadJson('../curriculum/learning-map.json');

test('learning map and existing references validate without errors', () => {
  assert.deepEqual(validateLearningMap(learningMap), []);
});

test('all six grades expose two terms and the elementary curriculum subject/course index', () => {
  assert.equal(learningMap.grades.length, 6);
  assert.deepEqual(learningMap.grades.map(({ gradeId }) => gradeId), ['grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6']);
  for (const grade of learningMap.grades) {
    assert.equal(grade.semesters.length, 2);
    assert.deepEqual(grade.semesters.map(({ semesterNumber }) => semesterNumber), [1, 2]);
    for (const semester of grade.semesters) {
      assert.deepEqual(semester.subjects.map(({ subjectId }) => subjectId).sort(), SUBJECT_DEFINITIONS.map(({ learningMapSubjectId }) => learningMapSubjectId).sort());
      assert.ok(semester.subjects.every(({ chapterRefs }) => chapterRefs.length === 0));
      assert.ok(semester.subjects.every(({ placementStatus }) => placementStatus === 'pending_school_and_textbook_evidence'));
    }
  }
  assert.deepEqual(validateGradeCatalog(GRADE_CATALOG), []);
  assert.equal(GRADE_CATALOG.length, 6);
  assert.equal(SUBJECT_DEFINITIONS.length, 11);
  assert.equal(learningMap.sourceReviewBoundary.officialFrameworkSource.verifiedLocations.length, 2);
  assert.deepEqual(learningMap.designBoundary.formalCurriculumDomainIds, SUBJECT_DEFINITIONS.map(({ learningMapSubjectId }) => learningMapSubjectId));
});

test('learning task crosswalk retains many-to-many links and does not claim mastery', () => {
  const relation = learningMap.learningObjectiveTaskCrosswalk.find(({ gradeId, subjectId }) => gradeId === 'grade-3' && subjectId === 'mathematics');
  assert.equal(relation.gradeId, 'grade-3');
  assert.equal(relation.subjectId, 'mathematics');
  assert.ok(relation.learningObjectiveTaskLinks.some(({ taskIds }) => taskIds.length > 1), 'at least one objective links to multiple tasks');
  assert.ok(relation.learningObjectiveTaskLinks.every(({ taskIds }) => taskIds.length > 0));
  assert.ok(relation.tasks.every(({ learningObjectiveIds, evidenceType }) => learningObjectiveIds.length > 0 && !/mastery|formal_score/i.test(evidenceType)));
  assert.ok(relation.tasks.every(({ status }) => status.includes('candidate') || status.includes('pending_teacher_review')));
});

test('candidate Chinese reading quest links its stage-level curriculum reference without claiming grade schedule or mastery', () => {
  const relation = learningMap.learningObjectiveTaskCrosswalk.find(({ gradeId, subjectId }) => gradeId === 'grade-3' && subjectId === 'chinese_language');
  assert.equal(relation.gradeId, 'grade-3');
  assert.equal(relation.objectiveDefinitions[0].status, 'candidate_pending_teacher_review');
  assert.equal(relation.tasks[0].taskKind, 'interactive_reading_quest');
  assert.equal(relation.tasks[0].evidenceType, 'candidate_practice_response_only_memory_only');
  assert.equal(relation.tasks[0].status, 'playable_candidate_pending_teacher_review');
  assert.equal(relation.relationshipStatus, 'candidate_activity_linked_to_verified_stage_level_curriculum_reference_not_grade_schedule_or_mastery');
});

test('grade three scope chapters resolve to existing scope and curriculum map records', () => {
  const scope = loadJson('../curriculum/grade3-year-scope.json');
  const scopeIds = new Set(scope.items.filter(({ scopeItemId }) => scopeItemId !== 'scope-m3-math-broad-scope').map(({ scopeItemId }) => scopeItemId));
  const grade3 = learningMap.grades.find(({ gradeId }) => gradeId === 'grade-3');
  const chapters = grade3.annualChapterInventory.chapterCatalog;
  assert.equal(chapters.length, 26);
  assert.equal(new Set(chapters.map(({ chapterId }) => chapterId)).size, chapters.length);
  assert.deepEqual(new Set(chapters.map(({ sourceRefs }) => sourceRefs.scopeItemId)), scopeIds);
  assert.equal(grade3.annualGoals.length, chapters.length);
  assert.equal(grade3.annualGoalStatus, 'partial_scope_objectives_only_full_year_synthesis_pending');
  assert.ok(chapters.every(({ expectedLearningOutcomes }) => expectedLearningOutcomes.status === 'criteria_not_yet_defined'));
});

test('curriculum evidence, grade applicability, materials, teaching and teacher review stay separate', () => {
  const grade3 = learningMap.grades.find(({ gradeId }) => gradeId === 'grade-3');
  for (const chapter of grade3.annualChapterInventory.chapterCatalog) {
    assert.ok(chapter.evidence.officialCurriculum.officialTextReviewStatus);
    assert.ok(chapter.evidence.officialCurriculum.gradeApplicabilityStatus);
    assert.equal(chapter.evidence.textbook.status, 'pending_review');
    assert.equal(chapter.evidence.teacherProfessionalReviewStatus, 'pending_review');
    assert.equal(chapter.evidence.classroomTeaching.status, 'not_recorded');
    assert.equal(chapter.evidence.reviewerSignoff, null);
    assert.equal(chapter.semesterPlacement.semesterId, null);
    assert.equal(chapter.formalUnitRef, null);
    assert.deepEqual(chapter.formalQuestionRefs, []);
  }
  assert.equal(learningMap.designBoundary.stage0Status, 'not_passed');
  assert.ok(learningMap.unitRegistryReferences.every(({ status }) => status !== 'approved'));
});

test('prototype directory is referenced without changing level unlock, review or publication state', () => {
  const refs = learningMap.grades[2].existingPrototypeReferences;
  assert.equal(refs.length, MATH_LEVEL_DIRECTORY.length);
  for (const directoryEntry of MATH_LEVEL_DIRECTORY) {
    const reference = refs.find(({ levelId }) => levelId === directoryEntry.levelId);
    assert.ok(reference);
    assert.equal(reference.publicationStatus, directoryEntry.publicationStatus);
    assert.equal(reference.teacherReviewStatus, directoryEntry.teacherReviewStatus);
    assert.deepEqual(reference.unlockCondition, directoryEntry.runtime.unlockCondition);
    assert.deepEqual(reference.curriculumMapIds, directoryEntry.curriculumReferences.curriculumMapIds);
  }
  const comparison = refs.find(({ levelId }) => levelId === 'math-number-comparison-candidate');
  assert.deepEqual(comparison.chapterRefs, []);
  assert.equal(comparison.traceabilityStatus, 'curriculum_mapping_pending');
  assert.deepEqual(refs.map(({ levelId }) => levelId), MATH_LEVEL_DIRECTORY.map(({ levelId }) => levelId));
  const placeValue = refs.find(({ levelId }) => levelId === 'math-place-value-demo');
  assert.deepEqual(placeValue.questionData, { datasetStatus: 'prototype_demo_only', dataKind: 'question_set', count: 5 });
  const capacity = refs.find(({ levelId }) => levelId === 'math-capacity-candidate');
  assert.deepEqual(capacity.questionData, { datasetStatus: 'prototype_pending_teacher_review', dataKind: 'interaction_scenarios', count: 3 });
  assert.ok(refs.every(({ publicationStatus }) => publicationStatus !== 'approved' && publicationStatus !== 'published'));
});

test('student progress distinguishes completion, review, checks and objective achievement', () => {
  const states = learningMap.progressModel.states.map(({ id }) => id);
  assert.deepEqual(states, ['not_started', 'in_progress', 'activity_completed', 'needs_review', 'check_passed', 'objective_achieved']);
  assert.equal(learningMap.progressModel.implementationStatus, 'specification_only_not_implemented');
  assert.equal(learningMap.progressModel.masteryPolicy.mayInferFromSingleQuestion, false);
  assert.equal(learningMap.progressModel.masteryPolicy.mayInferFromGameCompletionOrStars, false);
});

test('validator rejects broken curriculum links and duplicate grade identifiers', () => {
  const brokenMap = structuredClone(learningMap);
  brokenMap.grades[2].annualChapterInventory.chapterCatalog[0].sourceRefs.curriculumMapId = 'missing-map-id';
  assert.ok(validateLearningMap(brokenMap).includes('curriculum_map_id_missing:chapter-scope-m3-math-number-place-value:missing-map-id'));

  const duplicateGrade = structuredClone(learningMap);
  duplicateGrade.grades[5].gradeId = duplicateGrade.grades[0].gradeId;
  assert.ok(validateLearningMap(duplicateGrade).includes('duplicate_grade_id'));
});

test('building the map is deterministic and retains the existing six-grade structure', () => {
  assert.deepEqual(buildLearningMap(), learningMap);
});
