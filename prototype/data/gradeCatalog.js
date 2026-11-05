import { DEMO_PROGRESS_KEY } from '../mapProgress.js';
import { CAPACITY_OBSERVATION_SCENARIOS } from '../capacityMission.js';
import { demoQuestionSet } from './demoQuestions.js';
import { MATH_LEVEL_DIRECTORY } from './mathLevelDirectory.js';
import { numberComparisonQuestionSet } from './numberComparisonQuestions.js';
import { numberSecretChallenge } from './numberSecretQuestions.js';
import { CURRICULUM_FRAMEWORK_SOURCE, ELEMENTARY_CURRICULUM_AREAS, SUBJECT_DEFINITIONS } from './elementaryLearningCatalog.js';
import { STORY_FOREST_READING_QUEST } from './storyForestReadingQuest.js';
import { ENGLISH_SCENARIO_ADVENTURE } from './englishScenarioAdventure.js';
import { ANIMAL_OBSERVATION_EXPLORATION } from './animalObservationExploration.js';
import { NEIGHBORHOOD_CHANGE_EXPLORATION } from './neighborhoodChangeExploration.js';
import { MATH_DATA_TABLE_WORKSHOP } from './mathDataTableWorkshop.js';
import { ARTS_RHYTHM_WORKSHOP } from './artsRhythmWorkshop.js';
import { getCatalogCandidateTasksForSubject } from './catalogCandidateTasks.js';
import { GRADE4_CANDIDATE_LEARNING_ROUTE } from './grade4CandidateLearningRoute.js';
import { GRADE3_MATH_REPAIR_MAINLINE } from './grade3MathRepairMainline.js';

export { SUBJECT_DEFINITIONS };

const SUBJECT_BY_ID = new Map(SUBJECT_DEFINITIONS.map((subject) => [subject.subjectId, subject]));
const SUBJECT_NAMES = new Map(SUBJECT_DEFINITIONS.map(({ subjectId, name }) => [subjectId, name]));
const AREA_IDS = new Set(ELEMENTARY_CURRICULUM_AREAS.map(({ areaId }) => areaId));
const assessmentStatusFor = (gradeNumber, subjectId) => {
  if (gradeNumber === 2 && subjectId === 'mathematics') return 'grade2_official_content_codes_verified_local_schedule_pending';
  if (gradeNumber === 2 && ['chinese-language', 'living-curriculum'].includes(subjectId)) return 'stage1_official_reference_grade_schedule_pending';
  if (gradeNumber === 4 && subjectId === 'mathematics') return 'grade4_content_codes_and_stage2_performance_verified_local_schedule_pending';
  if (gradeNumber === 4 && ['chinese-language', 'natural-science'].includes(subjectId)) return 'stage2_official_reference_grade_schedule_pending';
  if (gradeNumber === 5 && subjectId === 'mathematics') return 'grade5_content_code_map_added_local_schedule_pending';
  if (gradeNumber === 5 && ['chinese-language', 'natural-science', 'english-language'].includes(subjectId)) return 'stage3_official_clause_recorded_grade5_schedule_pending';
  if (gradeNumber === 6 && subjectId === 'mathematics') return 'grade6_content_code_reference_local_schedule_pending';
  if (gradeNumber === 6 && ['chinese-language', 'natural-science', 'english-language'].includes(subjectId)) return 'stage3_official_clause_recorded_grade6_schedule_pending';
  if (gradeNumber !== 3) return 'pending_official_grade_scope_verification';
  if (subjectId === 'mathematics') return 'partial_grade3_scope_recorded_schedule_pending';
  if (['chinese-language', 'english-language', 'natural-science', 'social-studies'].includes(subjectId)) return 'stage_indicators_recorded_grade3_scope_pending';
  return 'pending_official_grade_scope_verification';
};

// Explicit elementary framework placement from General Guidelines Table 4.
// This is an area/course structure, not a textbook sequence or a claim that a
// particular class has already taught the content.
export function getFrameworkGradeScope(gradeNumber, subjectId) {
  if (subjectId === 'national-and-new-resident-languages') return { status: 'choice_or_school_offering', label: '語文選修／學校開設依規定與學生選擇' };
  if (subjectId === 'chinese-language' || subjectId === 'mathematics' || subjectId === 'arts' || subjectId === 'integrative-activities' || subjectId === 'health-physical-education') {
    return { status: 'listed_across_elementary_stages', label: '總綱國小課程架構列示；細目另核對' };
  }
  if (subjectId === 'english-language') return gradeNumber <= 2
    ? { status: 'phase_2_and_3_course', label: '總綱列於第二、三學習階段；一年級／二年級未單列' }
    : { status: 'phase_2_and_3_course', label: '總綱列於第二、三學習階段；學校授課安排另確認' };
  if (subjectId === 'living-curriculum') return gradeNumber <= 2
    ? { status: 'primary_integrated_course_phase_1', label: '第一學習階段統整課程' }
    : { status: 'not_separately_listed_for_phase', label: '總綱表 4 未於此學習階段另列生活課程' };
  if (subjectId === 'social-studies' || subjectId === 'natural-science') return gradeNumber <= 2
    ? { status: 'integrated_in_life_course_phase_1', label: '第一學習階段不另列此科；生活課程採統整' }
    : { status: 'phase_2_and_3_subject', label: '總綱列於第二、三學習階段；實際單元順序待確認' };
  if (subjectId === 'technology') return gradeNumber >= 5
    ? { status: 'phase_3_course', label: '總綱於第三學習階段列示科技領域' }
    : { status: 'not_separately_listed_for_phase', label: '總綱表 4 未於此學習階段另列科技領域' };
  return { status: 'pending_official_framework_mapping', label: '年級適用範圍待核對' };
}

const emptyCourseSlot = (gradeNumber, subjectId, semesterId) => Object.freeze({
  semesterId,
  subjectId,
  contentStatus: 'not_assigned',
  curriculumApplicabilityStatus: assessmentStatusFor(gradeNumber, subjectId),
  units: Object.freeze([]),
  levels: Object.freeze([]),
  questionData: Object.freeze([]),
  reviewStatus: 'not_started',
  unlockCondition: Object.freeze({ type: 'not_configured', prerequisites: Object.freeze([]) }),
  progressDataInterface: Object.freeze({
    status: 'specification_only_not_implemented',
    storageKey: null,
    fields: Object.freeze(['unlocked', 'completed', 'bestScore']),
  }),
});

const demoQuestionData = Object.freeze([
  Object.freeze({ levelId: 'math-place-value-demo', source: 'prototype/data/demoQuestions.js', count: demoQuestionSet.questions.length, dataStatus: demoQuestionSet.datasetStatus, reviewStatus: 'prototype_demo_only' }),
  Object.freeze({ levelId: 'number-secret-challenge', source: 'prototype/data/numberSecretQuestions.js', count: numberSecretChallenge.questions.length, dataStatus: numberSecretChallenge.datasetStatus, reviewStatus: 'pending_teacher_review' }),
  Object.freeze({ levelId: 'math-number-comparison-candidate', source: 'prototype/data/numberComparisonQuestions.js', count: numberComparisonQuestionSet.questions.length, dataStatus: numberComparisonQuestionSet.datasetStatus, reviewStatus: 'pending_teacher_review' }),
  Object.freeze({ levelId: 'math-capacity-candidate', source: 'prototype/capacityMission.js', count: CAPACITY_OBSERVATION_SCENARIOS.length, dataStatus: 'prototype_pending_teacher_review', reviewStatus: 'pending_teacher_review', dataKind: 'interaction_scenarios' }),
]);
const questionDataFor = (levelId) => demoQuestionData.find((item) => item.levelId === levelId) ?? null;

const gradeThreeMathLevelReferences = Object.freeze(MATH_LEVEL_DIRECTORY.map((entry) => Object.freeze({
  levelId: entry.levelId,
  title: entry.title,
  semesterId: null,
  semesterAssignmentStatus: 'pending_review',
  directoryStatus: entry.entryKind,
  runtimeAvailability: entry.runtime.availability,
  unlockCondition: entry.runtime.unlockCondition,
  questionCount: entry.questionCount,
  questionData: questionDataFor(entry.levelId),
  questionReviewStatus: entry.teacherReviewStatus,
  curriculumEvidenceStatus: entry.curriculumEvidenceStatus,
  gradeApplicabilityStatus: entry.gradeApplicabilityStatus,
  textbookEvidenceStatus: entry.textbookEvidence.status,
  publicationStatus: entry.publicationStatus,
  progressDataInterface: Object.freeze({
    status: ['math-place-value-demo', 'number-secret-challenge', 'math-number-comparison-candidate'].includes(entry.levelId)
      ? 'existing_prototype_progress_interface'
      : 'not_configured',
    source: 'prototype/mapProgress.js',
    storageKey: ['math-place-value-demo', 'number-secret-challenge', 'math-number-comparison-candidate'].includes(entry.levelId)
      ? DEMO_PROGRESS_KEY
      : null,
    preserveExistingData: true,
  }),
})));

const gradeThreeChineseActivities = Object.freeze([Object.freeze({
  activityId: STORY_FOREST_READING_QUEST.activityId,
  title: STORY_FOREST_READING_QUEST.title,
  status: STORY_FOREST_READING_QUEST.status,
  runtimeAvailability: 'playable_candidate_prototype',
  runtimeModule: 'prototype/data/storyForestReadingQuest.js',
  entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'reading-quest', directLaunch: true }),
  curriculumMapId: STORY_FOREST_READING_QUEST.curriculumMapId,
  curriculumCodes: STORY_FOREST_READING_QUEST.curriculumCodes,
  learningObjectiveId: STORY_FOREST_READING_QUEST.learningObjective.objectiveId,
  semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
})]);
const gradeThreeEnglishActivities = Object.freeze([Object.freeze({
  activityId: ENGLISH_SCENARIO_ADVENTURE.activityId,
  title: ENGLISH_SCENARIO_ADVENTURE.title,
  status: ENGLISH_SCENARIO_ADVENTURE.status,
  runtimeAvailability: 'playable_candidate_prototype',
  runtimeModule: 'prototype/data/englishScenarioAdventure.js',
  entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'english-quest', directLaunch: true }),
  curriculumMapId: ENGLISH_SCENARIO_ADVENTURE.curriculumMapId,
  curriculumCodes: ENGLISH_SCENARIO_ADVENTURE.curriculumCodes,
  learningObjectiveId: ENGLISH_SCENARIO_ADVENTURE.learningObjective.objectiveId,
  semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
})]);
const gradeThreeScienceActivities = Object.freeze([Object.freeze({
  activityId: ANIMAL_OBSERVATION_EXPLORATION.activityId,
  title: ANIMAL_OBSERVATION_EXPLORATION.title,
  status: ANIMAL_OBSERVATION_EXPLORATION.status,
  runtimeAvailability: 'playable_candidate_prototype',
  runtimeModule: 'prototype/data/animalObservationExploration.js',
  entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'science-quest', directLaunch: true }),
  curriculumMapId: ANIMAL_OBSERVATION_EXPLORATION.curriculumMapId,
  curriculumCodes: ANIMAL_OBSERVATION_EXPLORATION.curriculumCodes,
  learningObjectiveId: ANIMAL_OBSERVATION_EXPLORATION.learningObjective.objectiveId,
  semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
})]);
const gradeThreeSocialActivities = Object.freeze([Object.freeze({
  activityId: NEIGHBORHOOD_CHANGE_EXPLORATION.activityId,
  title: NEIGHBORHOOD_CHANGE_EXPLORATION.title,
  status: NEIGHBORHOOD_CHANGE_EXPLORATION.status,
  runtimeAvailability: 'playable_candidate_prototype',
  runtimeModule: 'prototype/data/neighborhoodChangeExploration.js',
  entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'social-quest', directLaunch: true }),
  curriculumMapId: NEIGHBORHOOD_CHANGE_EXPLORATION.curriculumMapId,
  curriculumCodes: NEIGHBORHOOD_CHANGE_EXPLORATION.curriculumCodes,
  learningObjectiveId: NEIGHBORHOOD_CHANGE_EXPLORATION.learningObjective.objectiveId,
  semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
})]);
const gradeThreeMathDataActivity = Object.freeze({
  activityId: MATH_DATA_TABLE_WORKSHOP.activityId, title: MATH_DATA_TABLE_WORKSHOP.title,
  status: MATH_DATA_TABLE_WORKSHOP.status, runtimeAvailability: 'playable_candidate_prototype',
  semesterId: null,
  runtimeModule: 'prototype/data/mathDataTableWorkshop.js',
  entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'math-data-quest', directLaunch: true }),
  curriculumMapId: MATH_DATA_TABLE_WORKSHOP.curriculumMapId, curriculumCodes: MATH_DATA_TABLE_WORKSHOP.curriculumCodes,
  learningObjectiveId: MATH_DATA_TABLE_WORKSHOP.learningObjective.objectiveId,
  semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
});
const gradeThreeArtsActivities = Object.freeze([Object.freeze({
  activityId: ARTS_RHYTHM_WORKSHOP.activityId, title: ARTS_RHYTHM_WORKSHOP.title,
  status: ARTS_RHYTHM_WORKSHOP.status, runtimeAvailability: 'playable_candidate_prototype',
  runtimeModule: 'prototype/data/artsRhythmWorkshop.js',
  entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'arts-quest', directLaunch: true }),
  curriculumMapId: ARTS_RHYTHM_WORKSHOP.curriculumMapId, curriculumCodes: ARTS_RHYTHM_WORKSHOP.curriculumCodes,
  learningObjectiveId: ARTS_RHYTHM_WORKSHOP.learningObjective.objectiveId,
  semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
})]);

const CATALOG_TASK_MODULES = Object.freeze({
  'ACT-G1-HPE-HYGIENE-HABITS-CANDIDATE': 'grade1HpeExpansionActivities.js',
  'ACT-G1-HPE-SAFE-WARMUP-MOVEMENT-CANDIDATE': 'grade1HpeExpansionActivities.js',
  'ACT-G1-HPE-ACTIVITY-CHOICE-BENEFITS-CANDIDATE': 'grade1HpeExpansionActivities.js',
  'ACT-G1-HPE-FOOD-DIET-HABITS-CANDIDATE': 'grade1HpeExpansionActivities.js',
  'ACT-G2-HPE-WARMUP-SEQUENCE-CANDIDATE': 'grade2HpeExpansionActivities.js',
  'ACT-G2-HPE-SCHOOL-ACTIVITY-MAP-CANDIDATE': 'grade2HpeExpansionActivities.js',
  'ACT-G2-MATH-LIFE-ESTIMATION-HUNDREDS-CANDIDATE': 'grade2EstimationAndLengthWorkshops.js',
  'ACT-G2-MATH-LENGTH-MEASURE-CONVERT-CANDIDATE': 'grade2EstimationAndLengthWorkshops.js',
  'ACT-G2-LIVING-CAMPUS-OBSERVATION-CANDIDATE': 'livingCurriculumObservationQuest.js',
  'ACT-G4-HPE-COURT-SAFETY-CANDIDATE': 'healthPeSafetyQuest.js',
  'ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE': 'integrativeStudyPlanQuest.js',
  'ACT-G3-MATH-DIVISION-SHARING-CANDIDATE': 'divisionSharingWorkshop.js',
  'ACT-G3-MATH-TIMEKEEPER-CANDIDATE': 'timekeeperWorkshop.js',
  'ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE': 'angleExplorerWorkshop.js',
  'ACT-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE': 'multiplicationArrayWorkshop.js',
  'ACT-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE': 'decimalNumberLineWorkshop.js',
  'ACT-G3-MATH-GEOMETRY-TILE-CANDIDATE': 'geometryTileWorkshop.js',
  'ACT-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-FOLD-CANDIDATE': 'gradeThreeGeometryExplorationWorkshop.js',
  'ACT-G3-MATH-MULTIPLICATION-DIVISION-CALCULATION-CANDIDATE': 'multiplicationDivisionCalculationWorkshop.js',
  'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE': 'twoStepSupplyAdventure.js',
  'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE': 'circleAndPatternWorkshop.js',
  'ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE': 'estimationAdventureStation.js',
  'ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE': 'geometryConstructionWorkshop.js',
  'ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE': 'fractionModelExplorationWorkshop.js',
  'ACT-G3-MATH-LENGTH-MEASUREMENT-ADVENTURE-CANDIDATE': 'lengthMeasurementAdventure.js',
  'ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE': 'weightMeasurementAdventure.js',
  'ACT-G2-MATH-SHARE-AND-PACK-PORT-CANDIDATE': 'mathCurriculumGapTasks.js',
  'ACT-G3-MATH-DIVISION-GROUPS-MULTIPLICATION-CHECK-CANDIDATE': 'mathCurriculumGapTasks.js',
  'ACT-G3-MATH-CROSS-TABLE-BUILDER-CANDIDATE': 'grade3MathDataExpansionTasks.js',
  'ACT-G3-MATH-CROSS-TABLE-INTERPRETER-CANDIDATE': 'grade3MathDataExpansionTasks.js',
  'ACT-G3-MATH-CROSS-TABLE-PATTERN-INVESTIGATOR-CANDIDATE': 'grade3MathDataExpansionTasks.js',
  'ACT-G3-CHINESE-STORY-CLUE-RESCUE-CANDIDATE': 'storyForestClueRescueQuest.js',
  'ACT-G3-CHINESE-CONTEXT-WORD-SENTENCE-CANDIDATE': 'contextWordSentenceWorkshop.js',
  'ACT-G3-CHINESE-STORY-SEQUENCE-TIMELINE-CANDIDATE': 'storySequenceTimelineQuest.js',
  'ACT-G1-MATH-QUANTITY-GARDEN-CANDIDATE': 'grade1MathQuantityGarden.js',
  'ACT-G1-MATH-COUNTER-STORY-CANDIDATE': 'grade1MathCounterStory.js',
  'ACT-G1-CHINESE-SENTENCE-TRAIN-CANDIDATE': 'grade1ChineseSentenceTrain.js',
  'ACT-G1-CHINESE-STORY-CARDS-CANDIDATE': 'grade1ChineseStoryCards.js',
  'ACT-G1-LIVING-OBJECT-SORT-CANDIDATE': 'grade1LivingObjectSort.js',
  'ACT-G1-LIVING-CHANGE-DETECTIVE-CANDIDATE': 'grade1LivingChangeDetective.js',
  'ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE': 'earlyGradeCurriculumGapTasks.js',
  'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE': 'earlyGradeCurriculumGapTasks.js',
  'ACT-G2-MATH-TWO-STEP-MARKET-CANDIDATE': 'earlyGradeCurriculumGapTasks.js',
  'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE': 'earlyGradeCurriculumGapTasks.js',
  'ACT-G2-LIVING-RULES-REASON-QUEST-CANDIDATE': 'earlyGradeCurriculumGapTasks.js',
  'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE': 'earlyGradeCurriculumGapTasks.js',
  'ACT-G2-MATH-THOUSAND-NUMBER-LINE-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G2-MATH-PLACE-VALUE-CALCULATION-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G2-MATH-CAPACITY-WEIGHT-AREA-COMPARISON-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G2-MATH-DATA-CLASSIFICATION-NESTED-GROUPS-CANDIDATE': 'grade2DataClassificationWorkshop.js',
  'ACT-G2-MATH-UNKNOWN-QUANTITY-MODEL-CANDIDATE': 'grade2UnknownQuantityWorkshop.js',
  'ACT-G2-MATH-UNIT-FRACTION-PAPER-FOLD-MODEL-CANDIDATE': 'grade2UnitFractionWorkshop.js',
  'ACT-G2-CHINESE-STORY-CLUE-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G2-CHINESE-CONTEXT-WORDS-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G2-LIVING-CHANGE-CLUE-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G2-LIVING-INQUIRY-PLAN-CANDIDATE': 'grade2CandidateTasks.js',
  'ACT-G4-MATH-FRACTION-TILES-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G4-MATH-LARGE-NUMBER-PLACE-VALUE-CANDIDATE': 'grade4ExpansionTasks.js',
  'ACT-G4-MATH-MULTI-DIGIT-MULTIPLY-DIVIDE-CANDIDATE': 'grade4ExpansionTasks.js',
  'ACT-G4-MATH-ANGLE-EXPLORATION-CANDIDATE': 'grade4AngleExplorationWorkshop.js',
  'ACT-G4-MATH-ROUNDING-ESTIMATION-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-PARALLEL-PERPENDICULAR-LINE-BUILDER-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-DECIMAL-HUNDREDTHS-OPERATIONS-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-CONGRUENT-FIGURE-TRANSFORM-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-SPECIAL-TRIANGLE-CONSTRUCTION-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-QUADRILATERAL-FEATURE-CONSTRUCTION-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-AREA-PERIMETER-ARRAY-MODEL-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-KILOMETER-ROUTE-AND-CONVERSION-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-SQUARE-METER-FLOOR-PLANNER-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE': 'grade4MathGapTasks.js',
  'ACT-G4-MATH-INTEGER-FRACTION-DECIMAL-NUMBER-LINE-CANDIDATE': 'mathCurriculumGapTasks.js',
  'ACT-G4-MATH-ELAPSED-TIME-TRANSIT-CANDIDATE': 'mathCurriculumGapTasks.js',
  'ACT-G4-CHINESE-TEXT-EVIDENCE-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G4-CHINESE-PARAGRAPH-ARCHITECT-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G4-SCIENCE-PLANT-STRUCTURE-ATLAS-CANDIDATE': 'grade4CandidateTasks.js',
  'ACT-G5-MATH-FACTOR-ARRAY-EXPLORER-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-MATH-MULTI-STEP-SUPPLY-PLANNER-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-CHINESE-FACT-OPINION-ARCHIVE-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-CHINESE-PARAGRAPH-PUZZLE-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-SCIENCE-MEASUREMENT-EVIDENCE-LAB-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-ENGLISH-DIALOGUE-ROUTE-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-MATH-FRACTION-EQUIVALENCE-PIECES-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-MATH-INTEGER-DIVISION-FRACTION-MODEL-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-SOCIAL-PERSPECTIVE-EVIDENCE-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G5-SCIENCE-FAIR-TEST-PLANNER-CANDIDATE': 'grade5CandidateTasks.js',
  'ACT-G6-MATH-PRIME-FACTOR-EXPLORER-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-MATH-GCD-LCM-SHORT-DIVISION-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-CHINESE-CAUSAL-INFERENCE-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-CHINESE-TEXT-STRUCTURE-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-SCIENCE-WEATHER-MAP-READER-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-ENGLISH-INTRODUCTION-CARDS-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G6-MATH-DATA-LIKELIHOOD-READER-CANDIDATE': 'grade6CandidateTasks.js',
  'ACT-G4-ENGLISH-LOST-AND-FOUND-CANDIDATE': 'crossGradeGapFillTasks.js',
  'ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS-CANDIDATE': 'crossGradeGapFillTasks.js',
  'ACT-G6-SOCIAL-GLOBAL-ISSUE-EVIDENCE-CANDIDATE': 'crossGradeGapFillTasks.js',
  'ACT-G6-ARTS-PUBLIC-SPACE-DESIGN-CANDIDATE': 'crossGradeGapFillTasks.js',
  'ACT-G6-INTEGRATIVE-RESOURCE-PLANNER-CANDIDATE': 'crossGradeGapFillTasks.js',
  'ACT-G6-HPE-MEDICATION-SAFETY-CANDIDATE': 'crossGradeGapFillTasks.js',
  'ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE': 'officialGapCandidateTasks.js',
  'ACT-G3-CHINESE-REASON-EVIDENCE-TRAIL-CANDIDATE': 'officialGapCandidateTasks.js',
  'ACT-G4-SOCIAL-LOCAL-HISTORY-TIMELINE-CANDIDATE': 'grade4ExpansionTasks.js',
  'ACT-G4-SOCIAL-LOCAL-HISTORY-CHANGE-EVIDENCE-CANDIDATE': 'officialGapCandidateTasks.js',
  'ACT-G4-SCIENCE-WEATHER-RECORD-BOARD-CANDIDATE': 'officialGapCandidateTasks.js',
  'ACT-G4-ARTS-COLOR-SHAPE-SPACE-STUDIO-CANDIDATE': 'officialGapCandidateTasks.js',
  'ACT-G5-SCIENCE-REPEAT-MEASURE-RELIABILITY-CANDIDATE': 'officialGapCandidateTasks.js',
  'ACT-G3-SCIENCE-ANIMAL-EVIDENCE-ATLAS-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G4-HPE-SPORT-SAFETY-DECISION-ROUTE-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G4-INTEGRATIVE-LEARNING-METHOD-CHOICE-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G3-SOCIAL-CHANGE-CAUSE-EVIDENCE-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G4-SCIENCE-PLANT-PARTS-OBSERVATION-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G4-SCIENCE-PLANT-EXTERNAL-FORMS-TRANSFER-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G5-SCIENCE-FAIR-RULER-METHOD-CANDIDATE': 'learningSubitemGapTasks.js',
  'ACT-G6-SCIENCE-ANIMAL-STRUCTURE-MOVEMENT-EVIDENCE-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-SCIENCE-PLANT-STRUCTURE-FUNCTION-EVIDENCE-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-SOCIAL-GLOBAL-ISSUE-SCALE-COMPARISON-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-HPE-MEDICATION-INFORMATION-CONSULT-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-SCIENCE-ENERGY-TRANSFER-MODEL-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-SCIENCE-STABLE-STATE-CHANGE-MODEL-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-SCIENCE-TECHNOLOGY-IMPACT-EVIDENCE-CANDIDATE': 'curriculumGapBatchTasks.js',
  'ACT-G6-SCIENCE-BEAK-FEEDING-STRUCTURE-EVIDENCE-CANDIDATE': 'curriculumGapBatchTasks.js',
});

function createGrade(gradeNumber) {
  const isGradeThree = gradeNumber === 3;
  const gradeId = `grade-${gradeNumber}`;
  const subjects = SUBJECT_DEFINITIONS.map(({ subjectId, learningMapSubjectId, name, areaId, courseType = 'subject', frameworkEntryStatus }) => {
    const catalogActivities = getCatalogCandidateTasksForSubject(gradeId, subjectId);
    const catalogActivityReferences = catalogActivities.map((activity) => Object.freeze({
      activityId: activity.activityId,
      title: activity.title,
      status: activity.status,
      runtimeAvailability: 'playable_candidate_prototype',
      semesterId: null,
      runtimeModule: activity.runtimeModule ?? `prototype/data/${CATALOG_TASK_MODULES[activity.activityId]}`,
      entryRoute: Object.freeze({ kind: 'learning_task', targetScreen: 'catalog-task', directLaunch: true }),
      curriculumMapId: activity.curriculumMapId,
      curriculumCodes: activity.curriculumCodes,
      curriculumScope: activity.curriculumScope,
      coverage: activity.coverage,
      learningObjectiveId: activity.learningObjective.objectiveId,
      semesterAssignmentStatus: 'pending_school_and_teacher_confirmation',
      progressPersistence: 'memory_only_no_student_records_no_localStorage',
    }));
    return Object.freeze({
    subjectId,
    learningMapSubjectId,
    name,
    areaId,
    courseType,
    curriculumSourceRef: Object.freeze({ sourceId: CURRICULUM_FRAMEWORK_SOURCE.sourceId, locations: CURRICULUM_FRAMEWORK_SOURCE.verifiedLocations }),
    frameworkEntryStatus,
    frameworkGradeScope: Object.freeze(getFrameworkGradeScope(gradeNumber, subjectId)),
    curriculumApplicabilityStatus: assessmentStatusFor(gradeNumber, subjectId),
    developmentStatus: isGradeThree && subjectId === 'mathematics'
      ? 'prototype_content_exists'
        : isGradeThree && ['chinese-language', 'english-language', 'natural-science', 'social-studies', 'arts'].includes(subjectId)
        ? 'playable_candidate_prototype'
        : catalogActivities.length
          ? 'playable_candidate_prototype'
        : 'not_built',
    unitRefs: Object.freeze(isGradeThree && subjectId === 'mathematics' ? Object.freeze([
      Object.freeze({ unitId: 'M3-NUM-01', source: 'curriculum/unit-registry.json', registryStatusMustBeReadFromSource: true }),
    ]) : []),
    existingYearLevelContent: Object.freeze(isGradeThree && subjectId === 'mathematics' ? [...gradeThreeMathLevelReferences, gradeThreeMathDataActivity, ...catalogActivityReferences]
      : isGradeThree && subjectId === 'chinese-language' ? [...gradeThreeChineseActivities, ...catalogActivityReferences]
        : isGradeThree && subjectId === 'english-language' ? [...gradeThreeEnglishActivities, ...catalogActivityReferences]
        : isGradeThree && subjectId === 'natural-science' ? [...gradeThreeScienceActivities, ...catalogActivityReferences]
        : isGradeThree && subjectId === 'social-studies' ? [...gradeThreeSocialActivities, ...catalogActivityReferences]
            : isGradeThree && subjectId === 'arts' ? [...gradeThreeArtsActivities, ...catalogActivityReferences] : catalogActivityReferences),
    semesterSlots: Object.freeze([1, 2].map((semesterNumber) => emptyCourseSlot(
      gradeNumber,
      subjectId,
      `${gradeId}-semester-${semesterNumber}`,
    ))),
  });
  });

  const hasPartialCandidates = subjects.some(({ existingYearLevelContent }) => existingYearLevelContent.length > 0);
  return Object.freeze({
    gradeId,
    gradeNumber,
    name: `${['', '一', '二', '三', '四', '五', '六'][gradeNumber]}年級`,
    developmentStatus: isGradeThree || hasPartialCandidates
      ? 'in_development_partial' : 'preparation',
    curriculumApplicabilityStatus: isGradeThree || hasPartialCandidates
      ? 'partial_official_scope_recorded_local_schedule_pending' : 'pending_official_grade_scope_verification',
    candidateRoutes: gradeNumber === 3 ? Object.freeze([GRADE3_MATH_REPAIR_MAINLINE])
      : gradeNumber === 4 ? Object.freeze([GRADE4_CANDIDATE_LEARNING_ROUTE]) : Object.freeze([]),
    semesters: Object.freeze([1, 2].map((semesterNumber) => Object.freeze({
      semesterId: `${gradeId}-semester-${semesterNumber}`,
      semesterNumber,
      name: semesterNumber === 1 ? '上學期' : '下學期',
      status: 'schedule_not_confirmed',
      subjectIds: Object.freeze(SUBJECT_DEFINITIONS.map(({ subjectId }) => subjectId)),
    }))),
    subjects: Object.freeze(subjects),
  });
}

export const GRADE_CATALOG = Object.freeze(Array.from({ length: 6 }, (_, index) => createGrade(index + 1)));
export const GRADE_SUBJECT_IDS = Object.freeze(SUBJECT_DEFINITIONS.map(({ subjectId }) => subjectId));

export function getGradeById(gradeId) {
  return GRADE_CATALOG.find((grade) => grade.gradeId === gradeId) ?? null;
}

export function validateGradeCatalog(grades = GRADE_CATALOG) {
  const errors = [];
  const gradeIds = grades.map(({ gradeId }) => gradeId);
  if (new Set(gradeIds).size !== gradeIds.length) errors.push('duplicate_grade_id');
  if (grades.length !== 6 || grades.some((grade, index) => grade.gradeId !== `grade-${index + 1}`)) errors.push('grade_range_must_be_1_to_6');

  for (const grade of grades) {
    if (grade.semesters.length !== 2) errors.push(`invalid_semester_count:${grade.gradeId}`);
    if (new Set(grade.subjects.map(({ subjectId }) => subjectId)).size !== SUBJECT_DEFINITIONS.length) errors.push(`invalid_subjects:${grade.gradeId}`);
    for (const subject of grade.subjects) {
      if (subject.name !== SUBJECT_NAMES.get(subject.subjectId)) errors.push(`invalid_subject_name:${grade.gradeId}:${subject.subjectId}`);
      const courseDefinition = SUBJECT_BY_ID.get(subject.subjectId);
      const validLifeCourse = subject.areaId === 'life-course' && subject.courseType === 'primary_integrated_course';
      if ((!AREA_IDS.has(subject.areaId) && !validLifeCourse) || subject.areaId !== courseDefinition?.areaId || subject.courseType !== (courseDefinition?.courseType ?? 'subject')) errors.push(`invalid_curriculum_area:${grade.gradeId}:${subject.subjectId}`);
      if (subject.curriculumSourceRef?.sourceId !== CURRICULUM_FRAMEWORK_SOURCE.sourceId || !Array.isArray(subject.curriculumSourceRef?.locations)) errors.push(`missing_curriculum_source:${grade.gradeId}:${subject.subjectId}`);
      if (subject.semesterSlots.length !== 2) errors.push(`invalid_subject_semester_slots:${grade.gradeId}:${subject.subjectId}`);
      for (const slot of subject.semesterSlots) {
        if (!grade.semesters.some(({ semesterId }) => semesterId === slot.semesterId)) errors.push(`orphan_semester_slot:${grade.gradeId}:${subject.subjectId}`);
        if (!['specification_only_not_implemented'].includes(slot.progressDataInterface.status)) errors.push(`invalid_progress_interface:${grade.gradeId}:${subject.subjectId}`);
      }
    }
  }
  return errors;
}
