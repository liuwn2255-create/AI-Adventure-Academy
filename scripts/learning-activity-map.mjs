import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';
import { NUMBER_SECRET_LEARNING_UNIT } from '../prototype/data/numberSecretLearningUnit.js';
import { SQUARE_CENTIMETER_AREA_LEARNING_UNIT } from '../prototype/data/squareCentimeterAreaLearningUnit.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from '../prototype/data/fractionTreasureLearningUnit.js';
import { ADDITION_SUBTRACTION_LEARNING_UNIT } from '../prototype/data/additionSubtractionLearningUnit.js';
import { AREA_GRID_CONSTRUCTION_WORKSHOP } from '../prototype/data/areaGridConstructionWorkshop.js';
import { WEIGHT_MEASUREMENT_ADVENTURE } from '../prototype/data/weightMeasurementAdventure.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const ACTIVITY_TYPES = new Set(['exploration', 'manipulation', 'practice', 'challenge', 'review', 'reinforcement']);
const CANDIDATE_RUNTIME_UNITS = new Map([
  [SQUARE_CENTIMETER_AREA_LEARNING_UNIT.learningUnitId, { unit: SQUARE_CENTIMETER_AREA_LEARNING_UNIT, module: 'prototype/data/squareCentimeterAreaLearningUnit.js' }],
  [FRACTION_TREASURE_LEARNING_UNIT.learningUnitId, { unit: FRACTION_TREASURE_LEARNING_UNIT, module: 'prototype/data/fractionTreasureLearningUnit.js' }],
  [ADDITION_SUBTRACTION_LEARNING_UNIT.learningUnitId, { unit: ADDITION_SUBTRACTION_LEARNING_UNIT, module: 'prototype/data/additionSubtractionLearningUnit.js' }],
]);
const CATALOG_TASKS = new Map([
  [AREA_GRID_CONSTRUCTION_WORKSHOP.activityId, AREA_GRID_CONSTRUCTION_WORKSHOP],
  [WEIGHT_MEASUREMENT_ADVENTURE.activityId, WEIGHT_MEASUREMENT_ADVENTURE],
]);

export function validateQuestionAttemptEvents(events, knownQuestionIds) {
  const errors = [];
  const submissions = new Set();
  const attempts = new Set();
  const priorHintViewed = new Map();
  for (const event of events) {
    const prefix = event.submissionId ?? '(missing submissionId)';
    if (!event.submissionId || submissions.has(event.submissionId)) errors.push(`${prefix}: duplicate or missing submissionId`);
    submissions.add(event.submissionId);
    if (!event.attemptId || attempts.has(event.attemptId)) errors.push(`${prefix}: duplicate or missing attemptId`);
    attempts.add(event.attemptId);
    if (typeof event.activityId !== 'string' || !event.activityId) errors.push(`${prefix}: activityId is required`);
    if (!knownQuestionIds.has(event.questionId)) errors.push(`${prefix}: unknown questionId`);
    if (!Number.isInteger(event.attemptNumber) || event.attemptNumber < 1) errors.push(`${prefix}: attemptNumber must be a positive integer`);
    if (!['correct', 'incorrect'].includes(event.result)) errors.push(`${prefix}: invalid result`);
    if (!['none', 'hint_used'].includes(event.hintUse)) errors.push(`${prefix}: invalid hintUse`);
    if (typeof event.hintViewed !== 'boolean') errors.push(`${prefix}: hintViewed must be boolean`);
    if (!['first_independent', 'after_hint', 'retry', 'after_remediation'].includes(event.attemptStage)) errors.push(`${prefix}: invalid attemptStage`);
    if (event.hintUse === 'hint_used' && event.hintViewed !== true) errors.push(`${prefix}: hintUse requires hintViewed=true`);
    if (event.attemptStage === 'after_hint' && event.hintUse !== 'hint_used') errors.push(`${prefix}: after_hint requires hintUse=hint_used`);
    if (event.attemptStage === 'first_independent' && (event.attemptNumber !== 1 || event.hintViewed || event.hintUse !== 'none')) errors.push(`${prefix}: first_independent conflicts with attempt history`);
    if (event.attemptStage === 'retry' && event.attemptNumber < 2) errors.push(`${prefix}: retry requires a prior attempt`);
    if (event.attemptStage === 'after_remediation' && event.attemptNumber < 2) errors.push(`${prefix}: after_remediation requires a prior attempt`);
    const itemKey = `${event.activityId}::${event.questionId}`;
    if (priorHintViewed.get(itemKey) === true && event.hintViewed !== true) errors.push(`${prefix}: hintViewed cannot revert within an activity item`);
    if (event.hintViewed === true) priorHintViewed.set(itemKey, true);
    const expectedClass = event.result === 'incorrect' ? 'incorrect' : ({
      first_independent: 'first_try_independent',
      after_hint: 'correct_after_hint',
      retry: 'correct_after_retry',
      after_remediation: 'correct_after_remediation',
    })[event.attemptStage];
    if (event.responseClass !== expectedClass) errors.push(`${prefix}: responseClass does not match result, hintUse, and attemptNumber`);
    if (typeof event.occurredAt !== 'string' || !event.occurredAt) errors.push(`${prefix}: occurredAt is required`);
  }
  return errors;
}

/** Summarizes practice events only; it never promotes them to a check or mastery decision. */
export function summarizePracticeEvidence(events, knownQuestionIds) {
  const errors = validateQuestionAttemptEvents(events, knownQuestionIds);
  if (errors.length) throw new Error(errors.join('; '));
  return Object.freeze({
    attemptCount: events.length,
    uniqueQuestionCount: new Set(events.map(({ questionId }) => questionId)).size,
    firstTryIndependentCorrect: events.filter(({ responseClass }) => responseClass === 'first_try_independent').length,
    correctAfterHint: events.filter(({ responseClass }) => responseClass === 'correct_after_hint').length,
    correctAfterRetry: events.filter(({ responseClass }) => responseClass === 'correct_after_retry').length,
    correctAfterRemediation: events.filter(({ responseClass }) => responseClass === 'correct_after_remediation').length,
    incorrect: events.filter(({ responseClass }) => responseClass === 'incorrect').length,
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  });
}

export function validateLearningActivityMap(dataset, { learningObjectives, progressModel, playableLevels = PLAYABLE_LEVELS }) {
  const errors = [];
  const unitById = new Map(learningObjectives.learningUnits.map((unit) => [unit.learningUnitId, unit]));
  const sourceIds = new Set(learningObjectives.learningUnits.map((unit) => unit.officialCurriculum.sourceId).filter(Boolean));
  const curriculumMapIds = new Set(learningObjectives.learningUnits.flatMap((unit) => unit.sourceRefs.curriculumMapIds));
  const levelById = new Map(playableLevels.map((level) => [level.id, level]));
  const activityById = new Map();
  const questionIds = new Set();

  for (const activity of dataset.activities ?? []) {
    const id = activity.activityId ?? '(missing activityId)';
    if (!activity.activityId || activityById.has(activity.activityId)) errors.push(`${id}: missing or duplicate activityId`);
    activityById.set(activity.activityId, activity);
    const unit = unitById.get(activity.learningUnitId);
    if (!unit) {
      errors.push(`${id}: unknown learningUnitId`);
    } else {
      const goalIds = new Set((unit.observableOutcomes?.candidateObjectives ?? []).map((goal) => goal.objectiveId));
      for (const goalId of activity.learningObjectiveIds ?? []) if (!goalIds.has(goalId)) errors.push(`${id}: unknown learningObjectiveId ${goalId}`);
    }
    if (!Array.isArray(activity.learningObjectiveIds) || activity.learningObjectiveIds.length === 0) errors.push(`${id}: at least one learning objective reference is required`);
    if (!ACTIVITY_TYPES.has(activity.activityType)) errors.push(`${id}: unsupported activityType`);
    if (!activity.purpose || !Array.isArray(activity.learnerActions)) errors.push(`${id}: purpose and learnerActions are required`);
    if (!['candidate_pending_teacher_review', 'design_candidate_not_implemented'].includes(activity.reviewStatus)) errors.push(`${id}: unreviewed activity cannot be approved or published`);
    if (activity.learningCheck?.status !== 'not_designed' && activity.learningCheck?.status !== 'not_designed_pending_teacher_review') errors.push(`${id}: pilot learning check must remain not designed`);
    if (activity.learningCheck?.passCondition !== null) errors.push(`${id}: no unapproved learning-check pass condition may be asserted`);
    if (activity.activityCompletion?.doesNotImply && !activity.activityCompletion.doesNotImply.includes('learning_check_passed')) errors.push(`${id}: activity completion must not imply learning-check success`);

    const runtime = activity.runtimeReference;
    if (runtime?.kind === 'prototype_level') {
      const level = levelById.get(runtime.levelId);
      if (!level) {
        errors.push(`${id}: referenced prototype level does not exist`);
        continue;
      }
      const validQuestions = new Set(level.questionSet.questions.map((question) => question.id));
      if (JSON.stringify(runtime.unlockCondition) !== JSON.stringify(level.unlockCondition)) errors.push(`${id}: unlock condition differs from the existing level catalog`);
      if (level.reviewStatus === 'approved' || level.publicationStatus === 'published') errors.push(`${id}: prototype must not imply formal approval or publication`);
      for (const questionId of runtime.questionIds ?? []) {
        if (!validQuestions.has(questionId)) errors.push(`${id}: questionId ${questionId} is not in level ${runtime.levelId}`);
        questionIds.add(questionId);
      }
      if (activity.questionObjectiveCoverage?.length !== (runtime.questionIds ?? []).length) errors.push(`${id}: each linked question needs one objective coverage record`);
      for (const coverage of activity.questionObjectiveCoverage ?? []) {
        if (!runtime.questionIds?.includes(coverage.questionId)) errors.push(`${id}: objective coverage references an unlinked question`);
        if (!activity.learningObjectiveIds.includes(coverage.learningObjectiveId)) errors.push(`${id}: question coverage points to an unlinked learning objective`);
        if (coverage.learningCheckStatus !== 'not_a_formal_check' || coverage.responseEvidenceType !== 'practice_response_only') errors.push(`${id}: prototype question responses must remain practice evidence`);
      }
    } else if (runtime?.kind === 'planned_activity') {
      if (runtime.levelId !== null || runtime.prototypeEntry !== null) errors.push(`${id}: planned activity must not claim an existing runtime entry`);
    } else if (runtime?.kind === 'learning_unit_runtime') {
      if (runtime.levelId !== null || !runtime.module || !runtime.prototypeEntry) errors.push(`${id}: learning-unit runtime reference is incomplete`);
      if (!dataset.runtimeLearningUnitPrototype?.reinforcementActivityIds?.includes(runtime.learningUnitActivityId)) errors.push(`${id}: learning-unit runtime activity is not registered by the prototype map`);
    } else if (runtime?.kind === 'candidate_learning_unit_runtime') {
      const candidateRuntime = CANDIDATE_RUNTIME_UNITS.get(runtime.learningUnitId);
      if (runtime.levelId !== null || !runtime.module || !runtime.prototypeEntry || runtime.learningUnitId !== activity.learningUnitId) errors.push(`${id}: candidate learning-unit runtime reference is incomplete`);
      if (!candidateRuntime || runtime.module !== candidateRuntime?.module) errors.push(`${id}: candidate learning-unit runtime does not resolve to a registered candidate prototype`);
      if (candidateRuntime && JSON.stringify(runtime.questionIds) !== JSON.stringify(candidateRuntime.unit.questions.map((question) => question.id))) errors.push(`${id}: candidate learning-unit question references do not match the module`);
      if (activity.questionObjectiveCoverage?.length !== (runtime.questionIds ?? []).length) errors.push(`${id}: each candidate question needs one objective coverage record`);
      for (const coverage of activity.questionObjectiveCoverage ?? []) {
        if (!runtime.questionIds?.includes(coverage.questionId)) errors.push(`${id}: candidate coverage references an unlinked question`);
        if (!activity.learningObjectiveIds?.includes(coverage.learningObjectiveId)) errors.push(`${id}: candidate question coverage points to an unlinked objective`);
        if (coverage.learningCheckStatus !== 'not_a_formal_check' || coverage.responseEvidenceType !== 'practice_response_only') errors.push(`${id}: candidate responses must remain non-formal practice evidence`);
      }
      if (activity.reviewStatus !== 'candidate_pending_teacher_review' || activity.learningCheck?.passCondition !== null) errors.push(`${id}: candidate activity must remain unapproved and without a pass condition`);
    } else if (runtime?.kind === 'catalog_task_runtime') {
      const task = CATALOG_TASKS.get(runtime.activityId);
      if (!task || runtime.module !== task.runtimeModule || runtime.activityId !== activity.activityId) errors.push(`${id}: catalog task runtime does not resolve to the registered task`);
      if (task && JSON.stringify(runtime.stageIds) !== JSON.stringify(task.stages.map(({ stageId }) => stageId))) errors.push(`${id}: catalog task stage references do not match runtime data`);
      if (task && (task.status !== 'candidate_pending_teacher_review' || task.teacherReview?.status !== 'not_reviewed')) errors.push(`${id}: catalog task must remain unreviewed candidate content`);
      if (activity.reviewStatus !== 'candidate_pending_teacher_review' || activity.learningCheck?.passCondition !== null) errors.push(`${id}: catalog task must remain unapproved and without a pass condition`);
    } else {
      errors.push(`${id}: runtimeReference kind is required`);
    }

    if (!Array.isArray(activity.reinforcementActivityIds)) errors.push(`${id}: reinforcementActivityIds must be an array`);
    if ((activity.evidenceSources ?? []).length === 0) errors.push(`${id}: evidenceSources are required`);
    for (const source of activity.evidenceSources ?? []) {
      if (source.type === 'official_curriculum_registry_reference') {
        if (!sourceIds.has(source.sourceId)) errors.push(`${id}: invalid curriculum sourceId`);
        if (!curriculumMapIds.has(source.curriculumMapId)) errors.push(`${id}: invalid curriculumMapId in evidence source`);
      }
    }
  }

  for (const activity of dataset.activities ?? []) {
    for (const targetId of activity.reinforcementActivityIds ?? []) {
      const target = activityById.get(targetId);
      if (!target || target.activityType !== 'reinforcement') errors.push(`${activity.activityId}: invalid reinforcement activity ${targetId}`);
    }
  }

  if (dataset.boundaries?.studentRecordsCreated !== false) errors.push('activity map must not create student records');
  if (dataset.boundaries?.formalCurriculumApproved !== false || dataset.boundaries?.formalQuestionSet !== false) errors.push('pilot must remain unapproved prototype content');
  if (dataset.boundaries?.stage0Status !== 'not_passed') errors.push('stage0Status must remain not_passed');
  if (dataset.evidenceModel?.implementationStatus !== 'prototype_flow_memory_only_no_student_records') errors.push('prototype flow status must reflect memory-only implementation without student records');
  if (dataset.evidenceModel?.progressStatesRef !== 'student-progress-model.json#states') errors.push('progress states must reference the shared progress model');
  if (!dataset.evidenceModel?.questionAttemptRecordShape?.submissionId?.includes('unique')) errors.push('question attempts need a unique idempotency key');
  if (!dataset.evidenceModel?.deduplication?.includes('cannot create a second evidence event')) errors.push('duplicate submissions must not be counted twice');
  if (!dataset.evidenceModel?.evidenceBoundaries?.some((note) => note.includes('首次獨立答對'))) errors.push('first-try and hint-assisted evidence must remain distinct');
  if ((progressModel.records ?? []).length !== 0) errors.push('student progress model unexpectedly contains learner records');

  const runtimeUnit = dataset.runtimeLearningUnitPrototype;
  if (!runtimeUnit || runtimeUnit.status !== 'implemented_prototype_candidate_pending_teacher_review') errors.push('runtime learning-unit prototype must remain explicitly unapproved');
  if (runtimeUnit?.learningUnitId !== 'learning-unit:chapter-scope-m3-math-number-place-value'
    || runtimeUnit?.formalUnitRef?.unitId !== 'M3-NUM-01'
    || runtimeUnit?.formalUnitRef?.status !== 'candidate') errors.push('runtime learning-unit references must resolve to the existing candidate unit');
  const referencedUnit = unitById.get(runtimeUnit?.learningUnitId);
  const knownGoals = new Set((referencedUnit?.observableOutcomes?.candidateObjectives ?? []).map((goal) => goal.objectiveId));
  for (const goalId of runtimeUnit?.learningObjectiveIds ?? []) if (!knownGoals.has(goalId)) errors.push(`runtime learning-unit has unknown objective ${goalId}`);
  if (runtimeUnit?.candidateCheckCoverage?.length !== NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.length) errors.push('each candidate check question needs an objective coverage entry');
  for (const coverage of runtimeUnit?.candidateCheckCoverage ?? []) {
    if (!runtimeUnit.candidateCheckQuestionIds?.includes(coverage.questionId)) errors.push(`candidate check coverage references unknown question ${coverage.questionId}`);
    if (!coverage.learningObjectiveIds?.length || coverage.learningObjectiveIds.some((goalId) => !knownGoals.has(goalId))) errors.push(`candidate check coverage has invalid objective reference for ${coverage.questionId}`);
    if (!coverage.status?.includes('candidate')) errors.push(`candidate check coverage must remain a candidate for ${coverage.questionId}`);
  }
  if (JSON.stringify(runtimeUnit?.practiceQuestionIds) !== JSON.stringify(NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.map((question) => question.id))) errors.push('runtime practice question references do not match the learning-unit practice module');
  const candidatePracticeMappings = runtimeUnit?.candidatePracticeQuestionCoverage ?? [];
  const candidatePracticeIds = new Set();
  for (const mapping of candidatePracticeMappings) {
    if (!mapping?.questionId || candidatePracticeIds.has(mapping.questionId)) errors.push('candidate practice mapping has a missing or duplicate questionId');
    candidatePracticeIds.add(mapping?.questionId);
    if (!runtimeUnit?.practiceQuestionIds?.includes(mapping.questionId)) errors.push(`candidate practice mapping references an unregistered practice question ${mapping.questionId}`);
    if (!mapping.status?.includes('candidate') || mapping.learningCheckStatus !== 'not_a_formal_check'
      || !mapping.responseEvidenceType?.includes('practice_response_only')) errors.push(`candidate practice mapping must remain non-formal for ${mapping.questionId}`);
    if (!Array.isArray(mapping.learningObjectiveIds) || mapping.learningObjectiveIds.length === 0
      || mapping.learningObjectiveIds.some((goalId) => !knownGoals.has(goalId))) errors.push(`candidate practice mapping has invalid learning objectives for ${mapping.questionId}`);
  }
  const blockPractice = NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.find((question) => question.id === 'DRAFT-M3-NUM-01-01');
  if (!blockPractice || !candidatePracticeIds.has(blockPractice.id)) errors.push('block guided-practice candidate must have a traceable candidate-only mapping');
  if (JSON.stringify(runtimeUnit?.candidateCheckQuestionIds) !== JSON.stringify(NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.map((question) => question.id))) errors.push('candidate check question references do not match the learning-unit module');
  if (JSON.stringify(runtimeUnit?.reinforcementActivityIds) !== JSON.stringify(NUMBER_SECRET_LEARNING_UNIT.reinforcementActivities.map((activity) => activity.activityId))) errors.push('reinforcement activity references do not match the learning-unit module');
  if (JSON.stringify(runtimeUnit?.coverageDirections) !== JSON.stringify(NUMBER_SECRET_LEARNING_UNIT.learningDirections.map(({ id, status }) => ({ id, status })))) errors.push('learning scope coverage statuses do not match the learning-unit module');
  if (runtimeUnit?.learningCheck?.passCondition !== null || runtimeUnit?.evidencePolicy?.candidateCheck !== 'result_only_not_formal_check_pass') errors.push('candidate check must not be promoted to a formal learning check');
  if (runtimeUnit?.evidencePolicy?.objectiveAchievement !== 'not_assessed_without_teacher_approved_criteria_and_review') errors.push('objective achievement must remain unassessed');
  if (runtimeUnit?.evidencePolicy?.persistence !== 'memory_only_no_student_records_no_localStorage' || runtimeUnit?.studentRecordsCreated !== false) errors.push('learning-unit prototype must not persist student records');
  return errors;
}

function validateCurrentData() {
  const learningObjectives = readJson(path.join(ROOT, 'curriculum', 'learning-objectives.json'));
  const progressModel = readJson(path.join(ROOT, 'curriculum', 'student-progress-model.json'));
  const activityMap = readJson(path.join(ROOT, 'curriculum', 'learning-activity-map.json'));
  return validateLearningActivityMap(activityMap, { learningObjectives, progressModel });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const errors = validateCurrentData();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Learning activity mapping is valid; full-unit prototype responses remain non-formal evidence, not mastery decisions.');
  }
}
