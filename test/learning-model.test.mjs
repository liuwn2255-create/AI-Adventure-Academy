import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createLearningObjectives,
  createStudentProgressModel,
  validateCurrentModels,
  validateLearningObjectives,
  validateStudentProgressModel,
} from '../scripts/learning-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
const inputs = {
  learningMap: read('curriculum/learning-map.json'),
  gradeScope: read('curriculum/grade3-year-scope.json'),
  curriculumMap: read('curriculum/curriculum-map.json'),
  sources: read('curriculum/sources.json'),
  unitRegistry: read('curriculum/unit-registry.json'),
};
const objectives = read('curriculum/learning-objectives.json');
const progressModel = read('curriculum/student-progress-model.json');

test('learning objectives cover every existing grade 3 chapter exactly once', () => {
  const chapters = inputs.learningMap.grades.find((grade) => grade.gradeNumber === 3).annualChapterInventory.chapterCatalog;
  assert.equal(objectives.learningUnits.length, chapters.length);
  assert.equal(new Set(objectives.learningUnits.map((item) => item.learningUnitId)).size, chapters.length);
  assert.deepEqual(new Set(objectives.learningUnits.map((item) => item.chapterId)), new Set(chapters.map((item) => item.chapterId)));
});

test('learning unit refs and identifiers remain separate from formal unit registry IDs', () => {
  const placeValue = objectives.learningUnits.find((item) => item.formalUnitRef?.unitId === 'M3-NUM-01');
  assert.ok(placeValue);
  assert.match(placeValue.learningUnitId, /^learning-unit:/);
  assert.equal(placeValue.formalUnitRef.unitStatus, 'candidate');
  assert.notEqual(placeValue.learningUnitId, placeValue.formalUnitRef.unitId);
});

test('curriculum, grade applicability, semester, textbook, teaching, and teacher review remain distinct', () => {
  const items = objectives.learningUnits;
  assert.ok(items.some((item) => item.officialCurriculum.officialTextReviewStatus.startsWith('verified')));
  assert.ok(items.some((item) => item.officialCurriculum.gradeApplicabilityStatus.startsWith('stage_scope_only')));
  assert.ok(items.every((item) => item.semesterId === null));
  assert.ok(items.every((item) => item.evidence.textbook.records.length === 0));
  assert.ok(items.every((item) => item.evidence.classroomTeaching.records.length === 0));
  assert.ok(items.every((item) => item.review.teacherReviewStatus === 'pending_review'));
});

test('candidate objectives do not claim approved outcomes, checks, or mastery', () => {
  for (const item of objectives.learningUnits) {
    assert.equal(item.review.dataStatus, 'draft');
    assert.deepEqual(item.observableOutcomes.measurableCriteria, []);
    assert.equal(item.learningCheck.status, 'not_designed');
    assert.equal(item.learningCheck.passCriteria, null);
    assert.equal(item.learningActivities.status, 'design_suggestion_only');
  }
});

test('the current objective dataset passes source, map, registry, and completeness validation', () => {
  assert.deepEqual(validateLearningObjectives(objectives, inputs), []);
  assert.deepEqual(validateCurrentModels(), []);
});

test('validator rejects unknown curriculum refs and attempts to mark an objective approved', () => {
  const bad = structuredClone(objectives);
  bad.learningUnits[0].sourceRefs.curriculumMapIds = ['missing-map-id'];
  bad.learningUnits[1].review.dataStatus = 'approved';
  const errors = validateLearningObjectives(bad, inputs);
  assert.ok(errors.some((message) => message.includes('invalid curriculumMapId')));
  assert.ok(errors.some((message) => message.includes('must remain draft')));
});

test('validator rejects invented assessment, classroom evidence, or assigned semester', () => {
  const bad = structuredClone(objectives);
  bad.learningUnits[0].observableOutcomes.measurableCriteria = ['自行猜定的一項指標'];
  bad.learningUnits[1].evidence.classroomTeaching.records.push({ recordId: 'fake' });
  bad.learningUnits[2].semesterId = 'grade-3-semester-1';
  const errors = validateLearningObjectives(bad, inputs);
  assert.ok(errors.some((message) => message.includes('outcome/check criteria')));
  assert.ok(errors.some((message) => message.includes('teaching or teacher-review records')));
  assert.ok(errors.some((message) => message.includes('semester placement')));
});

test('progress model defines six distinct states and starts with no learner records', () => {
  assert.deepEqual(validateStudentProgressModel(progressModel), []);
  assert.equal(progressModel.implementationStatus, 'specification_only_not_implemented');
  assert.deepEqual(progressModel.records, []);
  assert.equal(new Set(progressModel.states.map((state) => state.id)).size, 6);
});

test('objective achievement requires approved criteria, multiple evidence, and educator review', () => {
  const transition = progressModel.transitions.find((item) => item.to === 'objective_achieved');
  assert.deepEqual(transition.requires, ['approved_objective_criteria', 'multiple_learning_evidence', 'educator_review']);
  assert.equal(progressModel.evidencePolicy.checkPassedIsNotObjectiveAchieved, true);
  assert.deepEqual(progressModel.evidencePolicy.gameSignalsAloneAreInsufficient, ['score', 'stars', 'badge', 'level_completion']);
});

test('progress validator rejects shortcuts from not_started and mastery inferred from stars', () => {
  const bad = structuredClone(progressModel);
  bad.transitions.push({ from: 'not_started', to: 'objective_achieved', requires: ['stars'] });
  bad.evidencePolicy.gameSignalsAloneAreInsufficient = ['level_completion'];
  const errors = validateStudentProgressModel(bad);
  assert.ok(errors.some((message) => message.includes('not_started may only transition')));
  assert.ok(errors.some((message) => message.includes('score, stars, and badges')));
});

test('builder uses existing map summaries only and does not mutate source curriculum data', () => {
  const originalMap = JSON.stringify(inputs.learningMap);
  const built = createLearningObjectives({ ...inputs, asOfDate: '2026-10-21' });
  assert.equal(built.learningUnits.length, 26);
  assert.equal(JSON.stringify(inputs.learningMap), originalMap);
  assert.equal(built.boundaries.stage0Status, 'not_passed');
});
