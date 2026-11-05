import { LIVING_CURRICULUM_OBSERVATION_QUEST } from './livingCurriculumObservationQuest.js';
import { HEALTH_PE_SAFETY_QUEST } from './healthPeSafetyQuest.js';
import { INTEGRATIVE_STUDY_PLAN_QUEST } from './integrativeStudyPlanQuest.js';
import { DIVISION_SHARING_WORKSHOP } from './divisionSharingWorkshop.js';
import { TIMEKEEPER_WORKSHOP } from './timekeeperWorkshop.js';
import { ANGLE_EXPLORER_WORKSHOP } from './angleExplorerWorkshop.js';
import { MULTIPLICATION_ARRAY_WORKSHOP } from './multiplicationArrayWorkshop.js';
import { DECIMAL_NUMBER_LINE_WORKSHOP } from './decimalNumberLineWorkshop.js';
import { GEOMETRY_TILE_WORKSHOP } from './geometryTileWorkshop.js';
import { MULTIPLICATION_DIVISION_CALCULATION_WORKSHOP } from './multiplicationDivisionCalculationWorkshop.js';
import { TWO_STEP_SUPPLY_ADVENTURE } from './twoStepSupplyAdventure.js';
import { CIRCLE_AND_PATTERN_WORKSHOP } from './circleAndPatternWorkshop.js';
import { ESTIMATION_ADVENTURE_STATION } from './estimationAdventureStation.js';
import { GEOMETRY_CONSTRUCTION_WORKSHOP } from './geometryConstructionWorkshop.js';
import { STORY_FOREST_CLUE_RESCUE_QUEST } from './storyForestClueRescueQuest.js';
import { CONTEXT_WORD_SENTENCE_WORKSHOP } from './contextWordSentenceWorkshop.js';
import { STORY_SEQUENCE_TIMELINE_QUEST } from './storySequenceTimelineQuest.js';
import { GRADE1_MATH_QUANTITY_GARDEN } from './grade1MathQuantityGarden.js';
import { GRADE1_MATH_COUNTER_STORY } from './grade1MathCounterStory.js';
import { GRADE1_CHINESE_SENTENCE_TRAIN } from './grade1ChineseSentenceTrain.js';
import { GRADE1_CHINESE_STORY_CARDS } from './grade1ChineseStoryCards.js';
import { GRADE1_CHINESE_EXPANSION_ACTIVITIES } from './grade1ChineseExpansionActivities.js';
import { GRADE1_LIVING_OBJECT_SORT } from './grade1LivingObjectSort.js';
import { GRADE1_LIVING_CHANGE_DETECTIVE } from './grade1LivingChangeDetective.js';
import { GRADE1_LIVING_EXPANSION_ACTIVITIES } from './grade1LivingExpansionActivities.js';
import { GRADE1_HPE_EXPANSION_ACTIVITIES } from './grade1HpeExpansionActivities.js';
import { GRADE1_MATH_CLASSIFICATION_WORKSHOP } from './grade1MathClassificationWorkshop.js';
import {
  GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION, GRADE2_MATH_MEASURE_COMPARE,
  GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS,
  GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN,
} from './grade2CandidateTasks.js';
import { GRADE2_DATA_CLASSIFICATION_WORKSHOP } from './grade2DataClassificationWorkshop.js';
import { GRADE2_UNKNOWN_QUANTITY_WORKSHOP } from './grade2UnknownQuantityWorkshop.js';
import { GRADE2_UNIT_FRACTION_WORKSHOP } from './grade2UnitFractionWorkshop.js';
import { GRADE4_CANDIDATE_TASKS } from './grade4CandidateTasks.js';
import { GRADE4_EXPANSION_TASKS } from './grade4ExpansionTasks.js';
import { GRADE5_CANDIDATE_TASKS } from './grade5CandidateTasks.js';
import { GRADE6_CANDIDATE_TASKS } from './grade6CandidateTasks.js';
import { G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS } from './crossGradeGapFillTasks.js';
import { OFFICIAL_GAP_CANDIDATE_TASKS } from './officialGapCandidateTasks.js';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from './learningSubitemExpansionTasks.js';
import { LEARNING_SUBITEM_GAP_TASKS } from './learningSubitemGapTasks.js';
import { GRADE3_MATH_DATA_EXPANSION_TASKS } from './grade3MathDataExpansionTasks.js';
import { EARLY_GRADE_CURRICULUM_GAP_TASKS } from './earlyGradeCurriculumGapTasks.js';
import { CURRICULUM_GAP_BATCH_TASKS } from './curriculumGapBatchTasks.js';
import { MATH_CURRICULUM_GAP_TASKS } from './mathCurriculumGapTasks.js';
import { GRADE3_GEOMETRY_EXPLORATION_WORKSHOP } from './gradeThreeGeometryExplorationWorkshop.js';
import { GRADE4_ANGLE_EXPLORATION_WORKSHOP } from './grade4AngleExplorationWorkshop.js';
import { GRADE4_MATH_GAP_TASKS } from './grade4MathGapTasks.js';
import { GRADE3_PLACE_VALUE_AND_COLUMN_TASKS } from './grade3PlaceValueAndColumnTasks.js';
import { GRADE3_FRACTION_MODEL_EXPLORATION } from './fractionModelExplorationWorkshop.js';
import { LENGTH_MEASUREMENT_ADVENTURE } from './lengthMeasurementAdventure.js';
import { GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP } from './grade2EstimationAndLengthWorkshops.js';

export const CATALOG_CANDIDATE_TASKS = Object.freeze([
  LIVING_CURRICULUM_OBSERVATION_QUEST,
  HEALTH_PE_SAFETY_QUEST,
  INTEGRATIVE_STUDY_PLAN_QUEST,
  DIVISION_SHARING_WORKSHOP,
  TIMEKEEPER_WORKSHOP,
  ANGLE_EXPLORER_WORKSHOP,
  MULTIPLICATION_ARRAY_WORKSHOP,
  DECIMAL_NUMBER_LINE_WORKSHOP,
  GEOMETRY_TILE_WORKSHOP,
  GRADE3_GEOMETRY_EXPLORATION_WORKSHOP,
  MULTIPLICATION_DIVISION_CALCULATION_WORKSHOP,
  ...GRADE3_PLACE_VALUE_AND_COLUMN_TASKS,
  GRADE3_FRACTION_MODEL_EXPLORATION,
  LENGTH_MEASUREMENT_ADVENTURE,
  TWO_STEP_SUPPLY_ADVENTURE,
  CIRCLE_AND_PATTERN_WORKSHOP,
  ESTIMATION_ADVENTURE_STATION,
  GEOMETRY_CONSTRUCTION_WORKSHOP,
  STORY_FOREST_CLUE_RESCUE_QUEST,
  CONTEXT_WORD_SENTENCE_WORKSHOP,
  STORY_SEQUENCE_TIMELINE_QUEST,
  GRADE1_MATH_QUANTITY_GARDEN,
  GRADE1_MATH_COUNTER_STORY,
  GRADE1_CHINESE_SENTENCE_TRAIN,
  GRADE1_CHINESE_STORY_CARDS,
  ...GRADE1_CHINESE_EXPANSION_ACTIVITIES,
  GRADE1_LIVING_OBJECT_SORT,
  GRADE1_LIVING_CHANGE_DETECTIVE,
  ...GRADE1_LIVING_EXPANSION_ACTIVITIES,
  ...GRADE1_HPE_EXPANSION_ACTIVITIES,
  GRADE1_MATH_CLASSIFICATION_WORKSHOP,
  ...EARLY_GRADE_CURRICULUM_GAP_TASKS,
  GRADE2_MATH_NUMBER_LINE,
  GRADE2_MATH_COLUMN_CALCULATION,
  GRADE2_MATH_MEASURE_COMPARE,
  GRADE2_DATA_CLASSIFICATION_WORKSHOP,
  GRADE2_UNKNOWN_QUANTITY_WORKSHOP,
  GRADE2_UNIT_FRACTION_WORKSHOP,
  GRADE2_ESTIMATION_WORKSHOP,
  GRADE2_LENGTH_WORKSHOP,
  GRADE2_CHINESE_TEXT_CLUE,
  GRADE2_CHINESE_CONTEXT_WORDS,
  GRADE2_LIVING_CHANGE_INQUIRY,
  GRADE2_LIVING_INQUIRY_PLAN,
  ...GRADE3_MATH_DATA_EXPANSION_TASKS,
  ...GRADE4_CANDIDATE_TASKS,
  GRADE4_ANGLE_EXPLORATION_WORKSHOP,
  ...GRADE4_MATH_GAP_TASKS,
  ...GRADE4_EXPANSION_TASKS,
  ...GRADE5_CANDIDATE_TASKS,
  ...GRADE6_CANDIDATE_TASKS,
  ...G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS,
  ...OFFICIAL_GAP_CANDIDATE_TASKS,
  ...LEARNING_SUBITEM_EXPANSION_TASKS,
  ...LEARNING_SUBITEM_GAP_TASKS,
  ...CURRICULUM_GAP_BATCH_TASKS,
  ...MATH_CURRICULUM_GAP_TASKS,
]);

export const CATALOG_CANDIDATE_TASK_BY_ID = new Map(CATALOG_CANDIDATE_TASKS.map((task) => [task.activityId, task]));

export function getCatalogCandidateTasksForSubject(gradeId, subjectId) {
  return CATALOG_CANDIDATE_TASKS.filter((task) => task.gradeId === gradeId && task.subjectId === subjectId);
}
