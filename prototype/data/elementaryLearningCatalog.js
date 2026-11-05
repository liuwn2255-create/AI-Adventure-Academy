import { LIVING_CURRICULUM_OBSERVATION_QUEST } from './livingCurriculumObservationQuest.js';
import { HEALTH_PE_SAFETY_QUEST } from './healthPeSafetyQuest.js';
import { INTEGRATIVE_STUDY_PLAN_QUEST } from './integrativeStudyPlanQuest.js';
import { STORY_FOREST_CLUE_RESCUE_QUEST } from './storyForestClueRescueQuest.js';
import { CONTEXT_WORD_SENTENCE_WORKSHOP } from './contextWordSentenceWorkshop.js';
import { STORY_SEQUENCE_TIMELINE_QUEST } from './storySequenceTimelineQuest.js';
import { GRADE1_MATH_QUANTITY_GARDEN } from './grade1MathQuantityGarden.js';
import { GRADE1_MATH_COUNTER_STORY } from './grade1MathCounterStory.js';
import { GRADE1_MATH_CLASSIFICATION_WORKSHOP } from './grade1MathClassificationWorkshop.js';
import { GRADE1_CHINESE_SENTENCE_TRAIN } from './grade1ChineseSentenceTrain.js';
import { GRADE1_CHINESE_STORY_CARDS } from './grade1ChineseStoryCards.js';
import { GRADE1_CHINESE_EXPANSION_ACTIVITIES } from './grade1ChineseExpansionActivities.js';
import { GRADE1_LIVING_OBJECT_SORT } from './grade1LivingObjectSort.js';
import { GRADE1_LIVING_CHANGE_DETECTIVE } from './grade1LivingChangeDetective.js';
import { GRADE1_LIVING_EXPANSION_ACTIVITIES } from './grade1LivingExpansionActivities.js';
import {
  GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION, GRADE2_MATH_MEASURE_COMPARE,
  GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS,
  GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN,
} from './grade2CandidateTasks.js';
import {
  GRADE1_SHAPE_COPY_STUDIO,
  GRADE2_TWO_STEP_MARKET_QUEST,
  GRADE2_MONEY_COMBINATION_MARKET,
  GRADE2_LIVING_RULES_REASON_QUEST,
  GRADE1_PLAYGROUND_SAFETY_ROUTE,
} from './earlyGradeCurriculumGapTasks.js';
import { GRADE1_HPE_EXPANSION_ACTIVITIES } from './grade1HpeExpansionActivities.js';
import { GRADE4_CANDIDATE_TASKS } from './grade4CandidateTasks.js';
import { GRADE4_EXPANSION_TASKS } from './grade4ExpansionTasks.js';
import { GRADE4_ANGLE_EXPLORATION_WORKSHOP } from './grade4AngleExplorationWorkshop.js';
import { GRADE4_MATH_GAP_TASKS } from './grade4MathGapTasks.js';
import { CURRICULUM_GAP_BATCH_TASKS } from './curriculumGapBatchTasks.js';
import { GRADE5_CANDIDATE_TASKS } from './grade5CandidateTasks.js';
import { GRADE6_CANDIDATE_TASKS } from './grade6CandidateTasks.js';
import { G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS } from './crossGradeGapFillTasks.js';
import { OFFICIAL_GAP_CANDIDATE_TASKS } from './officialGapCandidateTasks.js';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from './learningSubitemExpansionTasks.js';
import { LEARNING_SUBITEM_GAP_TASKS } from './learningSubitemGapTasks.js';
import { GRADE3_MATH_DATA_EXPANSION_TASKS } from './grade3MathDataExpansionTasks.js';
import { MATH_CURRICULUM_GAP_TASKS } from './mathCurriculumGapTasks.js';
import { GRADE2_DATA_CLASSIFICATION_WORKSHOP } from './grade2DataClassificationWorkshop.js';
import { GRADE2_UNKNOWN_QUANTITY_WORKSHOP } from './grade2UnknownQuantityWorkshop.js';
import { GRADE2_UNIT_FRACTION_WORKSHOP } from './grade2UnitFractionWorkshop.js';
import { GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP } from './grade2EstimationAndLengthWorkshops.js';

/**
 * National curriculum framework index and learning-world relationships.
 * Framework labels are traceability metadata, not grade-by-grade textbook plans.
 */
export const CURRICULUM_FRAMEWORK_SOURCE = Object.freeze({
  sourceId: 'core-general',
  publisher: '教育部',
  custodian: '國家教育研究院課程綱要資源頁',
  documentTitle: '十二年國民基本教育課程綱要總綱（2022 年 8 月起實施版）',
  sourceUrl: 'https://www.naer.edu.tw/upload/1/16/doc/1325/%28ImplementedfromAug.2022%29GeneralGuidelinesofthe12-yearBasicEducation.pdf',
  officialStatus: 'official_general_guidelines',
  verifiedLocations: Object.freeze([
    Object.freeze({ table: '表 3 各教育階段領域課程架構', pdfPageOrder: 14, printedPage: 11 }),
    Object.freeze({ table: '表 4 國民小學及國民中學課程規劃', pdfPageOrder: 15, printedPage: 12 }),
  ]),
  verificationBoundary: '已核對總綱的領域／課程架構名稱；這不等於已核實各年級的細目、各校教材、學期順序或班級進度。',
});

export const ELEMENTARY_CURRICULUM_AREAS = Object.freeze([
  Object.freeze({ areaId: 'language', name: '語文', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'mathematics', name: '數學', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'social-studies', name: '社會', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'natural-science', name: '自然科學', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'arts', name: '藝術', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'integrative-activities', name: '綜合活動', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'technology', name: '科技', sourceTable: '表 3、表 4' }),
  Object.freeze({ areaId: 'health-physical-education', name: '健康與體育', sourceTable: '表 3、表 4' }),
]);

/** Selectable course/subject entries; language choices are grouped to avoid inventing a student's language choice. */
export const SUBJECT_DEFINITIONS = Object.freeze([
  Object.freeze({ subjectId: 'chinese-language', learningMapSubjectId: 'chinese_language', name: '國語文', areaId: 'language', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'national-and-new-resident-languages', learningMapSubjectId: 'national_and_new_resident_languages', name: '本土語文／臺灣手語／新住民語文', areaId: 'language', frameworkEntryStatus: 'verified_framework_entry_student_choice_and_school_offering_apply' }),
  Object.freeze({ subjectId: 'english-language', learningMapSubjectId: 'english_language', name: '英語文', areaId: 'language', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'mathematics', learningMapSubjectId: 'mathematics', name: '數學', areaId: 'mathematics', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'living-curriculum', learningMapSubjectId: 'living_curriculum', name: '生活課程', areaId: 'life-course', courseType: 'primary_integrated_course', frameworkEntryStatus: 'verified_primary_framework_entry_phase_scope_pending' }),
  Object.freeze({ subjectId: 'social-studies', learningMapSubjectId: 'social_studies', name: '社會', areaId: 'social-studies', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'natural-science', learningMapSubjectId: 'natural_science', name: '自然科學', areaId: 'natural-science', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'arts', learningMapSubjectId: 'arts', name: '藝術', areaId: 'arts', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'integrative-activities', learningMapSubjectId: 'integrative_activities', name: '綜合活動', areaId: 'integrative-activities', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'technology', learningMapSubjectId: 'technology', name: '科技', areaId: 'technology', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
  Object.freeze({ subjectId: 'health-physical-education', learningMapSubjectId: 'health_and_physical_education', name: '健康與體育', areaId: 'health-physical-education', frameworkEntryStatus: 'verified_framework_entry_grade_scope_pending' }),
]);

// Each reading string below was supplied and reviewed for its exact visible text.
// This helper only packages those readings into the renderer's existing token contract.
function reviewedDirectoryTokens(text, readings) {
  const syllables = readings ? readings.split(/\s+/u) : [];
  let index = 0;
  const tokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = syllables[index++];
    if (!reading) throw new Error(`Missing reviewed directory pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (index !== syllables.length) throw new Error(`Extra reviewed directory pronunciation for ${text}`);
  return Object.freeze(tokens);
}

export const GRADE12_DIRECTORY_PRONUNCIATION = Object.freeze(Object.fromEntries([
  ['國語文', 'ㄍㄨㄛˊ ㄩˇ ㄨㄣˊ'],
  ['本土語文／臺灣手語／新住民語文', 'ㄅㄣˇ ㄊㄨˇ ㄩˇ ㄨㄣˊ ㄊㄞˊ ㄨㄢ ㄕㄡˇ ㄩˇ ㄒㄧㄣ ㄓㄨˋ ㄇㄧㄣˊ ㄩˇ ㄨㄣˊ'],
  ['英語文', 'ㄧㄥ ㄩˇ ㄨㄣˊ'],
  ['數學', 'ㄕㄨˋ ㄒㄩㄝˊ'],
  ['生活課程', 'ㄕㄥ ㄏㄨㄛˊ ㄎㄜˋ ㄔㄥˊ'],
  ['社會', 'ㄕㄜˋ ㄏㄨㄟˋ'],
  ['自然科學', 'ㄗˋ ㄖㄢˊ ㄎㄜ ㄒㄩㄝˊ'],
  ['藝術', 'ㄧˋ ㄕㄨˋ'],
  ['綜合活動', 'ㄗㄨㄥ ㄏㄜˊ ㄏㄨㄛˊ ㄉㄨㄥˋ'],
  ['科技', 'ㄎㄜ ㄐㄧˋ'],
  ['健康與體育', 'ㄐㄧㄢˋ ㄎㄤ ㄩˇ ㄊㄧˇ ㄩˋ'],
  ['語文', 'ㄩˇ ㄨㄣˊ'],
  ['國小整合課程', 'ㄍㄨㄛˊ ㄒㄧㄠˇ ㄓㄥˇ ㄏㄜˊ ㄎㄜˋ ㄔㄥˊ'],
  ['課程領域待確認', 'ㄎㄜˋ ㄔㄥˊ ㄌㄧㄥˇ ㄩˋ ㄉㄞˋ ㄑㄩㄝˋ ㄖㄣˋ'],
  ['正式課程', 'ㄓㄥˋ ㄕˋ ㄎㄜˋ ㄔㄥˊ'],
  ['一年級正式課程入口；候選活動仍待教師審查。', 'ㄧˋ ㄋㄧㄢˊ ㄐㄧˊ ㄓㄥˋ ㄕˋ ㄎㄜˋ ㄔㄥˊ ㄖㄨˋ ㄎㄡˇ ㄏㄡˋ ㄒㄩㄢˇ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄖㄥˊ ㄉㄞˋ ㄐㄧㄠˋ ㄕ ㄕㄣˇ ㄔㄚˊ'],
  ['依選習及學校開課', 'ㄧ ㄒㄩㄢˇ ㄒㄧˊ ㄐㄧˊ ㄒㄩㄝˊ ㄒㄧㄠˋ ㄎㄞ ㄎㄜˋ'],
  ['依學生選習及學校開課安排；不代表所有語別均已開課。', 'ㄧ ㄒㄩㄝˊ ㄕㄥ ㄒㄩㄢˇ ㄒㄧˊ ㄐㄧˊ ㄒㄩㄝˊ ㄒㄧㄠˋ ㄎㄞ ㄎㄜˋ ㄢ ㄆㄞˊ ㄅㄨˋ ㄉㄞˋ ㄅㄧㄠˇ ㄙㄨㄛˇ ㄧㄡˇ ㄩˇ ㄅㄧㄝˊ ㄐㄩㄣ ㄧˇ ㄎㄞ ㄎㄜˋ'],
  ['依學生選習及學校開課安排；目前沒有對應活動。', 'ㄧ ㄒㄩㄝˊ ㄕㄥ ㄒㄩㄢˇ ㄒㄧˊ ㄐㄧˊ ㄒㄩㄝˊ ㄒㄧㄠˋ ㄎㄞ ㄎㄜˋ ㄢ ㄆㄞˊ ㄇㄨˋ ㄑㄧㄢˊ ㄇㄟˊ ㄧㄡˇ ㄉㄨㄟˋ ㄧㄥˋ ㄏㄨㄛˊ ㄉㄨㄥˋ'],
  ['生活課程整合範疇', 'ㄕㄥ ㄏㄨㄛˊ ㄎㄜˋ ㄔㄥˊ ㄓㄥˇ ㄏㄜˊ ㄈㄢˋ ㄔㄡˊ'],
  ['第一學習階段的社會、自然科學、藝術與綜合活動相關內容由生活課程統整。', 'ㄉㄧˋ ㄧ ㄒㄩㄝˊ ㄒㄧˊ ㄐㄧㄝ ㄉㄨㄢˋ ㄉㄜ˙ ㄕㄜˋ ㄏㄨㄟˋ ㄗˋ ㄖㄢˊ ㄎㄜ ㄒㄩㄝˊ ㄧˋ ㄕㄨˋ ㄩˇ ㄗㄨㄥ ㄏㄜˊ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄒㄧㄤ ㄍㄨㄢ ㄋㄟˋ ㄖㄨㄥˊ ㄧㄡˊ ㄕㄥ ㄏㄨㄛˊ ㄎㄜˋ ㄔㄥˊ ㄊㄨㄥˇ ㄓㄥˇ'],
  ['第一學習階段相關內容由生活課程統整；此處不代表一年級獨立必修科目。', 'ㄉㄧˋ ㄧ ㄒㄩㄝˊ ㄒㄧˊ ㄐㄧㄝ ㄉㄨㄢˋ ㄒㄧㄤ ㄍㄨㄢ ㄋㄟˋ ㄖㄨㄥˊ ㄧㄡˊ ㄕㄥ ㄏㄨㄛˊ ㄎㄜˋ ㄔㄥˊ ㄊㄨㄥˇ ㄓㄥˇ ㄘˇ ㄔㄨˋ ㄅㄨˋ ㄉㄞˋ ㄅㄧㄠˇ ㄧˋ ㄋㄧㄢˊ ㄐㄧˊ ㄉㄨˊ ㄌㄧˋ ㄅㄧˋ ㄒㄧㄡ ㄎㄜ ㄇㄨˋ'],
  ['延伸學習', 'ㄧㄢˊ ㄕㄣ ㄒㄩㄝˊ ㄒㄧˊ'],
  ['以下入口提供課程架構資訊；是否另有地方或學校安排，依實際課程確認。', 'ㄧˇ ㄒㄧㄚˋ ㄖㄨˋ ㄎㄡˇ ㄊㄧˊ ㄍㄨㄥ ㄎㄜˋ ㄔㄥˊ ㄐㄧㄚˋ ㄍㄡˋ ㄗ ㄒㄩㄣˋ ㄕˋ ㄈㄡˇ ㄌㄧㄥˋ ㄧㄡˇ ㄉㄧˋ ㄈㄤ ㄏㄨㄛˋ ㄒㄩㄝˊ ㄒㄧㄠˋ ㄢ ㄆㄞˊ ㄧ ㄕˊ ㄐㄧˋ ㄎㄜˋ ㄔㄥˊ ㄑㄩㄝˋ ㄖㄣˋ'],
  ['國家課綱正式課程自第二學習階段開始；地方或學校安排可能不同。', 'ㄍㄨㄛˊ ㄐㄧㄚ ㄎㄜˋ ㄍㄤ ㄓㄥˋ ㄕˋ ㄎㄜˋ ㄔㄥˊ ㄗˋ ㄉㄧˋ ㄦˋ ㄒㄩㄝˊ ㄒㄧˊ ㄐㄧㄝ ㄉㄨㄢˋ ㄎㄞ ㄕˇ ㄉㄧˋ ㄈㄤ ㄏㄨㄛˋ ㄒㄩㄝˊ ㄒㄧㄠˋ ㄢ ㄆㄞˊ ㄎㄜˇ ㄋㄥˊ ㄅㄨˋ ㄊㄨㄥˊ'],
  ['不是一年級獨立正式科技領域；可作跨域或延伸學習。', 'ㄅㄨˋ ㄕˋ ㄧˋ ㄋㄧㄢˊ ㄐㄧˊ ㄉㄨˊ ㄌㄧˋ ㄓㄥˋ ㄕˋ ㄎㄜ ㄐㄧˋ ㄌㄧㄥˇ ㄩˋ ㄎㄜˇ ㄗㄨㄛˋ ㄎㄨㄚˋ ㄩˋ ㄏㄨㄛˋ ㄧㄢˊ ㄕㄣ ㄒㄩㄝˊ ㄒㄧˊ'],
  [' 個遊戲', 'ㄍㄜˋ ㄧㄡˊ ㄒㄧˋ'],
  ['目前尚無可開始的遊戲', 'ㄇㄨˋ ㄑㄧㄢˊ ㄕㄤˋ ㄨˊ ㄎㄜˇ ㄎㄞ ㄕˇ ㄉㄜ˙ ㄧㄡˊ ㄒㄧˋ'],
  ['候選活動・待教師審查', 'ㄏㄡˋ ㄒㄩㄢˇ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄉㄞˋ ㄐㄧㄠˋ ㄕ ㄕㄣˇ ㄔㄚˊ'],
  ['開始挑戰', 'ㄎㄞ ㄕˇ ㄊㄧㄠˇ ㄓㄢˋ'],
  [' 個挑戰', 'ㄍㄜˋ ㄊㄧㄠˇ ㄓㄢˋ'],
  ['閱讀任務', 'ㄩㄝˋ ㄉㄨˊ ㄖㄣˋ ㄨˋ'],
  ['開始閱讀任務', 'ㄎㄞ ㄕˇ ㄩㄝˋ ㄉㄨˊ ㄖㄣˋ ㄨˋ'],
].map(([text, readings]) => [text, reviewedDirectoryTokens(text, readings)])));

/** Grade-one directory groups explain first-stage course structure without removing subject entries. */
export const GRADE1_SUBJECT_DIRECTORY_GROUPS = Object.freeze([
  Object.freeze({
    groupId: 'formal-courses',
    title: '正式課程',
    description: '一年級正式課程入口；候選活動仍待教師審查。',
    subjects: Object.freeze([
      Object.freeze({ subjectId: 'chinese-language' }),
      Object.freeze({ subjectId: 'mathematics' }),
      Object.freeze({ subjectId: 'living-curriculum' }),
      Object.freeze({ subjectId: 'health-physical-education' }),
    ]),
  }),
  Object.freeze({
    groupId: 'language-choice',
    title: '依選習及學校開課',
    description: '依學生選習及學校開課安排；不代表所有語別均已開課。',
    subjects: Object.freeze([
      Object.freeze({
        subjectId: 'national-and-new-resident-languages',
        emptyActivityMessage: '依學生選習及學校開課安排；目前沒有對應活動。',
      }),
    ]),
  }),
  Object.freeze({
    groupId: 'living-integrated-scopes',
    title: '生活課程整合範疇',
    description: '第一學習階段的社會、自然科學、藝術與綜合活動相關內容由生活課程統整。',
    subjects: Object.freeze([
      ...['social-studies', 'natural-science', 'arts', 'integrative-activities'].map((subjectId) => Object.freeze({
        subjectId,
        emptyActivityMessage: '第一學習階段相關內容由生活課程統整；此處不代表一年級獨立必修科目。',
      })),
    ]),
  }),
  Object.freeze({
    groupId: 'extension-learning',
    title: '延伸學習',
    description: '以下入口提供課程架構資訊；是否另有地方或學校安排，依實際課程確認。',
    subjects: Object.freeze([
      Object.freeze({
        subjectId: 'english-language',
        emptyActivityMessage: '國家課綱正式課程自第二學習階段開始；地方或學校安排可能不同。',
      }),
      Object.freeze({
        subjectId: 'technology',
        emptyActivityMessage: '不是一年級獨立正式科技領域；可作跨域或延伸學習。',
      }),
    ]),
  }),
]);

export const LEARNING_DATA_BOUNDARIES = Object.freeze({
  officialCurriculum: Object.freeze({ owner: 'curriculum/learning-map.json and curriculum/curriculum-map.json', status: 'source_records_with_per_record_review_status' }),
  designedActivities: Object.freeze({ owner: 'curriculum/learning-activity-map.json and prototype data modules', status: 'separate_from_official_curriculum' }),
  verifiedLearningEvidence: Object.freeze({ owner: 'curriculum/student-progress-model.json', status: 'no learner records; prototype completion is not mastery evidence' }),
  aiGeneratedContent: Object.freeze({ owner: null, status: 'not_connected_no_generated_curriculum_claims' }),
});

/**
 * Existing grade-three place-value activity crosswalk. Relations are arrays in
 * both directions so future curriculum goals and game tasks can be many-to-many.
 * Source links are checked against learning-activity-map.json by tests.
 */
function mergeRelationsByGradeSubject(relations) {
  const grouped = new Map();
  for (const relation of relations) {
    const key = `${relation.gradeId}|${relation.subjectId}`;
    const rows = grouped.get(key) ?? [];
    rows.push(relation);
    grouped.set(key, rows);
  }
  return [...grouped.values()].map((rows) => {
    if (rows.length === 1) return rows[0];
    const links = new Map();
    for (const link of rows.flatMap((row) => row.learningObjectiveTaskLinks ?? [])) {
      const taskIds = links.get(link.learningObjectiveId) ?? [];
      taskIds.push(...link.taskIds);
      links.set(link.learningObjectiveId, taskIds);
    }
    return Object.freeze({
      ...rows[0],
      curriculumMapIds: Object.freeze([...new Set(rows.flatMap((row) => row.curriculumMapIds ?? []))]),
      learningObjectiveIds: Object.freeze([...new Set(rows.flatMap((row) => row.learningObjectiveIds ?? []))]),
      objectiveDefinitions: Object.freeze([...new Map(rows.flatMap((row) => row.objectiveDefinitions ?? []).map((item) => [item.objectiveId, item])).values()]),
      learningObjectiveTaskLinks: Object.freeze([...links].map(([learningObjectiveId, taskIds]) => Object.freeze({ learningObjectiveId, taskIds: Object.freeze([...new Set(taskIds)]) }))),
      tasks: Object.freeze([...new Map(rows.flatMap((row) => row.tasks ?? []).map((item) => [item.taskId, item])).values()]),
      relationshipStatus: rows[0].relationshipStatus ?? 'merged_candidate_links_keep_individual_scope_and_review_status',
    });
  });
}

export const LEARNING_TASK_RELATIONS = Object.freeze(mergeRelationsByGradeSubject([
  Object.freeze({
    gradeId: 'grade-1', subjectId: 'mathematics',
    curriculumMapIds: Object.freeze(['math-grade1-count-place-value', 'math-grade1-add-sub-meaning']),
    learningObjectiveIds: Object.freeze([GRADE1_MATH_QUANTITY_GARDEN.learningObjective.objectiveId, GRADE1_MATH_COUNTER_STORY.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([
      Object.freeze({ objectiveId: GRADE1_MATH_QUANTITY_GARDEN.learningObjective.objectiveId, statement: GRADE1_MATH_QUANTITY_GARDEN.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade1-count-place-value']), gradeApplicabilityStatus: 'grade_1_content_code_local_grade_schedule_pending' }),
      Object.freeze({ objectiveId: GRADE1_MATH_COUNTER_STORY.learningObjective.objectiveId, statement: GRADE1_MATH_COUNTER_STORY.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade1-add-sub-meaning']), gradeApplicabilityStatus: 'grade_1_content_code_local_grade_schedule_pending' }),
    ]),
    learningObjectiveTaskLinks: Object.freeze([
      Object.freeze({ learningObjectiveId: GRADE1_MATH_QUANTITY_GARDEN.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_MATH_QUANTITY_GARDEN.activityId]) }),
      Object.freeze({ learningObjectiveId: GRADE1_MATH_COUNTER_STORY.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_MATH_COUNTER_STORY.activityId]) }),
    ]),
    tasks: Object.freeze([
      Object.freeze({ taskId: GRADE1_MATH_QUANTITY_GARDEN.activityId, taskKind: 'interactive_quantity_array_and_symbol_match', levelId: null, runtimeModule: 'prototype/data/grade1MathQuantityGarden.js', curriculumMapId: 'math-grade1-count-place-value', learningObjectiveIds: Object.freeze([GRADE1_MATH_QUANTITY_GARDEN.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: GRADE1_MATH_COUNTER_STORY.activityId, taskKind: 'interactive_add_sub_story_equation_assembly', levelId: null, runtimeModule: 'prototype/data/grade1MathCounterStory.js', curriculumMapId: 'math-grade1-add-sub-meaning', learningObjectiveIds: Object.freeze([GRADE1_MATH_COUNTER_STORY.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
    ]),
    relationshipStatus: 'candidate_partial_links_official_grade_content_codes_local_schedule_and_teacher_review_pending',
  }),
  Object.freeze({
    gradeId: 'grade-1', subjectId: 'chinese-language',
    curriculumMapIds: Object.freeze(['chinese-stage1-word-sentence-story']),
    learningObjectiveIds: Object.freeze([
      GRADE1_CHINESE_SENTENCE_TRAIN.learningObjective.objectiveId,
      GRADE1_CHINESE_STORY_CARDS.learningObjective.objectiveId,
      ...GRADE1_CHINESE_EXPANSION_ACTIVITIES.map(({ learningObjective }) => learningObjective.objectiveId),
    ]),
    objectiveDefinitions: Object.freeze([
      Object.freeze({ objectiveId: GRADE1_CHINESE_SENTENCE_TRAIN.learningObjective.objectiveId, statement: GRADE1_CHINESE_SENTENCE_TRAIN.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['chinese-stage1-word-sentence-story']), gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending' }),
      Object.freeze({ objectiveId: GRADE1_CHINESE_STORY_CARDS.learningObjective.objectiveId, statement: GRADE1_CHINESE_STORY_CARDS.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['chinese-stage1-word-sentence-story']), gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending' }),
      ...GRADE1_CHINESE_EXPANSION_ACTIVITIES.map(({ learningObjective }) => Object.freeze({ objectiveId: learningObjective.objectiveId, statement: learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['chinese-stage1-word-sentence-story']), gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending' })),
    ]),
    learningObjectiveTaskLinks: Object.freeze([
      Object.freeze({ learningObjectiveId: GRADE1_CHINESE_SENTENCE_TRAIN.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_CHINESE_SENTENCE_TRAIN.activityId]) }),
      Object.freeze({ learningObjectiveId: GRADE1_CHINESE_STORY_CARDS.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_CHINESE_STORY_CARDS.activityId]) }),
      ...GRADE1_CHINESE_EXPANSION_ACTIVITIES.map(({ activityId, learningObjective }) => Object.freeze({ learningObjectiveId: learningObjective.objectiveId, taskIds: Object.freeze([activityId]) })),
    ]),
    tasks: Object.freeze([
      Object.freeze({ taskId: GRADE1_CHINESE_SENTENCE_TRAIN.activityId, taskKind: 'interactive_sentence_card_assembly', levelId: null, runtimeModule: 'prototype/data/grade1ChineseSentenceTrain.js', curriculumMapId: 'chinese-stage1-word-sentence-story', learningObjectiveIds: Object.freeze([GRADE1_CHINESE_SENTENCE_TRAIN.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: GRADE1_CHINESE_STORY_CARDS.activityId, taskKind: 'interactive_story_event_ordering', levelId: null, runtimeModule: 'prototype/data/grade1ChineseStoryCards.js', curriculumMapId: 'chinese-stage1-word-sentence-story', learningObjectiveIds: Object.freeze([GRADE1_CHINESE_STORY_CARDS.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      ...GRADE1_CHINESE_EXPANSION_ACTIVITIES.map((task) => Object.freeze({ taskId: task.activityId, taskKind: 'interactive_grade1_chinese_candidate', levelId: null, runtimeModule: task.runtimeModule, curriculumMapId: task.curriculumMapId, learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })),
    ]),
    relationshipStatus: 'candidate_links_first_stage_refs_not_grade_schedule_or_full_literacy_coverage',
  }),
  Object.freeze({
    gradeId: 'grade-1', subjectId: 'living-curriculum',
    curriculumMapIds: Object.freeze([...new Set(['living-curriculum-stage1-observation-inquiry', 'living-curriculum-stage1-change-inquiry', ...GRADE1_LIVING_EXPANSION_ACTIVITIES.map(({ curriculumMapId }) => curriculumMapId)])]),
    learningObjectiveIds: Object.freeze([GRADE1_LIVING_OBJECT_SORT.learningObjective.objectiveId, GRADE1_LIVING_CHANGE_DETECTIVE.learningObjective.objectiveId, ...GRADE1_LIVING_EXPANSION_ACTIVITIES.map(({ learningObjective }) => learningObjective.objectiveId)]),
    objectiveDefinitions: Object.freeze([
      Object.freeze({ objectiveId: GRADE1_LIVING_OBJECT_SORT.learningObjective.objectiveId, statement: GRADE1_LIVING_OBJECT_SORT.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['living-curriculum-stage1-observation-inquiry']), gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending' }),
      Object.freeze({ objectiveId: GRADE1_LIVING_CHANGE_DETECTIVE.learningObjective.objectiveId, statement: GRADE1_LIVING_CHANGE_DETECTIVE.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['living-curriculum-stage1-change-inquiry']), gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending' }),
      ...GRADE1_LIVING_EXPANSION_ACTIVITIES.map((task) => Object.freeze({ objectiveId: task.learningObjective.objectiveId, statement: task.learningObjective.statement, status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([task.curriculumMapId]), gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending' })),
    ]),
    learningObjectiveTaskLinks: Object.freeze([
      Object.freeze({ learningObjectiveId: GRADE1_LIVING_OBJECT_SORT.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_LIVING_OBJECT_SORT.activityId]) }),
      Object.freeze({ learningObjectiveId: GRADE1_LIVING_CHANGE_DETECTIVE.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_LIVING_CHANGE_DETECTIVE.activityId]) }),
      ...GRADE1_LIVING_EXPANSION_ACTIVITIES.map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) })),
    ]),
    tasks: Object.freeze([
      Object.freeze({ taskId: GRADE1_LIVING_OBJECT_SORT.activityId, taskKind: 'interactive_observation_classification', levelId: null, runtimeModule: 'prototype/data/grade1LivingObjectSort.js', curriculumMapId: 'living-curriculum-stage1-observation-inquiry', learningObjectiveIds: Object.freeze([GRADE1_LIVING_OBJECT_SORT.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: GRADE1_LIVING_CHANGE_DETECTIVE.activityId, taskKind: 'interactive_before_after_evidence_collection', levelId: null, runtimeModule: 'prototype/data/grade1LivingChangeDetective.js', curriculumMapId: 'living-curriculum-stage1-change-inquiry', learningObjectiveIds: Object.freeze([GRADE1_LIVING_CHANGE_DETECTIVE.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      ...GRADE1_LIVING_EXPANSION_ACTIVITIES.map((task) => Object.freeze({ taskId: task.activityId, taskKind: 'interactive_grade1_living_candidate', levelId: null, runtimeModule: task.runtimeModule, curriculumMapId: task.curriculumMapId, learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })),
    ]),
    relationshipStatus: 'candidate_simulated_observation_partial_links_stage_1_refs_real_world_teacher_review_pending',
  }),
  Object.freeze({
    gradeId: 'grade-2', subjectId: 'mathematics',
      curriculumMapIds: Object.freeze(['math-grade2-count-place-value', 'math-grade2-place-value-add-sub', 'math-grade2-capacity-weight-area-compare', GRADE2_DATA_CLASSIFICATION_WORKSHOP.curriculumMapId, GRADE2_UNKNOWN_QUANTITY_WORKSHOP.curriculumMapId, GRADE2_UNIT_FRACTION_WORKSHOP.curriculumMapId, GRADE2_ESTIMATION_WORKSHOP.curriculumMapId, GRADE2_LENGTH_WORKSHOP.curriculumMapId]),
      learningObjectiveIds: Object.freeze([GRADE2_MATH_NUMBER_LINE.learningObjective.objectiveId, GRADE2_MATH_COLUMN_CALCULATION.learningObjective.objectiveId, GRADE2_MATH_MEASURE_COMPARE.learningObjective.objectiveId, GRADE2_DATA_CLASSIFICATION_WORKSHOP.learningObjective.objectiveId, GRADE2_UNKNOWN_QUANTITY_WORKSHOP.learningObjective.objectiveId, GRADE2_UNIT_FRACTION_WORKSHOP.learningObjective.objectiveId, GRADE2_ESTIMATION_WORKSHOP.learningObjective.objectiveId, GRADE2_LENGTH_WORKSHOP.learningObjective.objectiveId]),
      objectiveDefinitions: Object.freeze([GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION, GRADE2_MATH_MEASURE_COMPARE, GRADE2_DATA_CLASSIFICATION_WORKSHOP, GRADE2_UNKNOWN_QUANTITY_WORKSHOP, GRADE2_UNIT_FRACTION_WORKSHOP, GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP].map((task) => Object.freeze({
      objectiveId: task.learningObjective.objectiveId, statement: task.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([task.curriculumMapId]),
      gradeApplicabilityStatus: 'grade_2_content_code_local_schedule_pending',
    }))),
      learningObjectiveTaskLinks: Object.freeze([GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION, GRADE2_MATH_MEASURE_COMPARE, GRADE2_DATA_CLASSIFICATION_WORKSHOP, GRADE2_UNKNOWN_QUANTITY_WORKSHOP, GRADE2_UNIT_FRACTION_WORKSHOP, GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP].map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
      tasks: Object.freeze([GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION, GRADE2_MATH_MEASURE_COMPARE, GRADE2_DATA_CLASSIFICATION_WORKSHOP, GRADE2_UNKNOWN_QUANTITY_WORKSHOP, GRADE2_UNIT_FRACTION_WORKSHOP, GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP].map((task) => Object.freeze({
      taskId: task.activityId, title: task.title, taskKind: task.activityId.includes('UNKNOWN-QUANTITY') ? 'interactive_unknown_addend_minuend_subtrahend_counter_model' : task.activityId.includes('UNIT-FRACTION') ? 'interactive_continuous_quantity_unit_fraction_model' : task.activityId.includes('NUMBER-LINE') ? 'interactive_integer_number_line_placement' : task.activityId.includes('PLACE-VALUE') ? 'interactive_place_value_add_sub_steps' : task.activityId.includes('DATA-CLASSIFICATION') ? 'interactive_collect_classify_nested_classification' : 'interactive_measurement_relation_classification_simulation',
      levelId: null, runtimeModule: task.runtimeModule ?? 'prototype/data/grade2CandidateTasks.js', curriculumMapId: task.curriculumMapId,
      learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review',
    }))),
    relationshipStatus: 'candidate_partial_links_grade2_official_content_codes_local_schedule_and_teacher_review_pending',
  }),
  Object.freeze({
    gradeId: 'grade-2', subjectId: 'chinese-language',
    curriculumMapIds: Object.freeze(['chinese-stage1-word-sentence-story']),
    learningObjectiveIds: Object.freeze([GRADE2_CHINESE_TEXT_CLUE.learningObjective.objectiveId, GRADE2_CHINESE_CONTEXT_WORDS.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS].map((task) => Object.freeze({
      objectiveId: task.learningObjective.objectiveId, statement: task.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([task.curriculumMapId]),
      gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending',
    }))),
    learningObjectiveTaskLinks: Object.freeze([GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS].map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
    tasks: Object.freeze([GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS].map((task) => Object.freeze({
      taskId: task.activityId, title: task.title, taskKind: task.activityId.includes('STORY-CLUE') ? 'interactive_text_evidence_collection_and_inference' : 'interactive_context_word_classification',
      levelId: null, runtimeModule: 'prototype/data/grade2CandidateTasks.js', curriculumMapId: task.curriculumMapId,
      learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review',
    }))),
    relationshipStatus: 'candidate_partial_links_first_stage_refs_not_grade2_schedule_or_full_literacy_coverage',
  }),
  Object.freeze({
    gradeId: 'grade-2', subjectId: 'living-curriculum',
    curriculumMapIds: Object.freeze(['living-curriculum-stage1-observation-inquiry', 'living-curriculum-stage1-change-inquiry']),
    learningObjectiveIds: Object.freeze([LIVING_CURRICULUM_OBSERVATION_QUEST.learningObjective.objectiveId, GRADE2_LIVING_CHANGE_INQUIRY.learningObjective.objectiveId, GRADE2_LIVING_INQUIRY_PLAN.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([
      Object.freeze({
      objectiveId: LIVING_CURRICULUM_OBSERVATION_QUEST.learningObjective.objectiveId,
      statement: LIVING_CURRICULUM_OBSERVATION_QUEST.learningObjective.statement,
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['living-curriculum-stage1-observation-inquiry']),
      gradeApplicabilityStatus: 'stage_1_span_grade_1_to_2_local_grade_schedule_pending',
      }),
      ...[GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN].map((task) => Object.freeze({
        objectiveId: task.learningObjective.objectiveId, statement: task.learningObjective.statement,
        status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([task.curriculumMapId]),
        gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending',
      })),
    ]),
    learningObjectiveTaskLinks: Object.freeze([LIVING_CURRICULUM_OBSERVATION_QUEST, GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN].map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
    tasks: Object.freeze([LIVING_CURRICULUM_OBSERVATION_QUEST, GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN].map((task) => Object.freeze({
      taskId: task.activityId, title: task.title, taskKind: task.activityId.includes('CHANGE-CLUE') ? 'interactive_simulated_before_after_evidence_inquiry' : task.activityId.includes('INQUIRY-PLAN') ? 'interactive_inquiry_step_order_and_tool_selection' : 'interactive_observation_evidence_collection',
      levelId: null, runtimeModule: task === LIVING_CURRICULUM_OBSERVATION_QUEST ? 'prototype/data/livingCurriculumObservationQuest.js' : 'prototype/data/grade2CandidateTasks.js',
      curriculumMapId: task.curriculumMapId, learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
      evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review',
    }))),
    relationshipStatus: 'candidate_partial_links_first_stage_refs_simulated_tasks_are_not_real_world_observation_or_mastery',
  }),
  Object.freeze({
    gradeId: 'grade-1', subjectId: 'mathematics',
    curriculumMapIds: Object.freeze([GRADE1_SHAPE_COPY_STUDIO.curriculumMapId]),
    learningObjectiveIds: Object.freeze([GRADE1_SHAPE_COPY_STUDIO.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: GRADE1_SHAPE_COPY_STUDIO.learningObjective.objectiveId,
      statement: GRADE1_SHAPE_COPY_STUDIO.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([GRADE1_SHAPE_COPY_STUDIO.curriculumMapId]),
      gradeApplicabilityStatus: 'grade_1_content_code_local_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: GRADE1_SHAPE_COPY_STUDIO.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_SHAPE_COPY_STUDIO.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: GRADE1_SHAPE_COPY_STUDIO.activityId, title: GRADE1_SHAPE_COPY_STUDIO.title, taskKind: 'interactive_plane_shape_piece_copy_and_composition', levelId: null, runtimeModule: 'prototype/data/earlyGradeCurriculumGapTasks.js', curriculumMapId: GRADE1_SHAPE_COPY_STUDIO.curriculumMapId, learningObjectiveIds: Object.freeze([GRADE1_SHAPE_COPY_STUDIO.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_partial_screen_shape_copy_maps_to_s1_2_not_physical_manipulation_or_full_shape_scope',
  }),
  Object.freeze({
    gradeId: 'grade-1', subjectId: 'mathematics',
    curriculumMapIds: Object.freeze([GRADE1_MATH_CLASSIFICATION_WORKSHOP.curriculumMapId]),
    learningObjectiveIds: Object.freeze([GRADE1_MATH_CLASSIFICATION_WORKSHOP.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: GRADE1_MATH_CLASSIFICATION_WORKSHOP.learningObjective.objectiveId,
      statement: GRADE1_MATH_CLASSIFICATION_WORKSHOP.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([GRADE1_MATH_CLASSIFICATION_WORKSHOP.curriculumMapId]),
      gradeApplicabilityStatus: 'grade_1_content_code_local_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: GRADE1_MATH_CLASSIFICATION_WORKSHOP.learningObjective.objectiveId, taskIds: Object.freeze([GRADE1_MATH_CLASSIFICATION_WORKSHOP.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: GRADE1_MATH_CLASSIFICATION_WORKSHOP.activityId, title: GRADE1_MATH_CLASSIFICATION_WORKSHOP.title, taskKind: 'interactive_same_set_two_feature_classification', levelId: null, runtimeModule: 'prototype/data/grade1MathClassificationWorkshop.js', curriculumMapId: GRADE1_MATH_CLASSIFICATION_WORKSHOP.curriculumMapId, learningObjectiveIds: Object.freeze([GRADE1_MATH_CLASSIFICATION_WORKSHOP.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_partial_simulated_item_cards_classify_by_two_features_not_student_collected_materials_or_free_data_presentation',
  }),
  Object.freeze({
    gradeId: 'grade-2', subjectId: 'mathematics',
    curriculumMapIds: Object.freeze([GRADE2_TWO_STEP_MARKET_QUEST.curriculumMapId]),
    learningObjectiveIds: Object.freeze([GRADE2_TWO_STEP_MARKET_QUEST.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: GRADE2_TWO_STEP_MARKET_QUEST.learningObjective.objectiveId,
      statement: GRADE2_TWO_STEP_MARKET_QUEST.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([GRADE2_TWO_STEP_MARKET_QUEST.curriculumMapId]),
      gradeApplicabilityStatus: 'grade_2_content_code_local_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: GRADE2_TWO_STEP_MARKET_QUEST.learningObjective.objectiveId, taskIds: Object.freeze([GRADE2_TWO_STEP_MARKET_QUEST.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: GRADE2_TWO_STEP_MARKET_QUEST.activityId, title: GRADE2_TWO_STEP_MARKET_QUEST.title, taskKind: 'interactive_two_step_story_expression_assembly', levelId: null, runtimeModule: 'prototype/data/earlyGradeCurriculumGapTasks.js', curriculumMapId: GRADE2_TWO_STEP_MARKET_QUEST.curriculumMapId, learningObjectiveIds: Object.freeze([GRADE2_TWO_STEP_MARKET_QUEST.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_partial_links_N2_8_only_no_compound_expression_or_repeated_multiplication',
  }),
  Object.freeze({
    gradeId: 'grade-2', subjectId: 'mathematics',
    curriculumMapIds: Object.freeze([GRADE2_MONEY_COMBINATION_MARKET.curriculumMapId]),
    learningObjectiveIds: Object.freeze([GRADE2_MONEY_COMBINATION_MARKET.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: GRADE2_MONEY_COMBINATION_MARKET.learningObjective.objectiveId,
      statement: GRADE2_MONEY_COMBINATION_MARKET.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([GRADE2_MONEY_COMBINATION_MARKET.curriculumMapId]),
      gradeApplicabilityStatus: 'grade_2_content_code_local_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: GRADE2_MONEY_COMBINATION_MARKET.learningObjective.objectiveId, taskIds: Object.freeze([GRADE2_MONEY_COMBINATION_MARKET.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: GRADE2_MONEY_COMBINATION_MARKET.activityId, title: GRADE2_MONEY_COMBINATION_MARKET.title, taskKind: 'interactive_multi_select_currency_combination_with_running_total', levelId: null, runtimeModule: 'prototype/data/earlyGradeCurriculumGapTasks.js', curriculumMapId: GRADE2_MONEY_COMBINATION_MARKET.curriculumMapId, learningObjectiveIds: Object.freeze([GRADE2_MONEY_COMBINATION_MARKET.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_partial_N2_5_screen_currency_combinations_and_payment_totals_no_change_or_physical_money',
  }),
  Object.freeze({
    gradeId: 'grade-2', subjectId: 'living-curriculum',
    curriculumMapIds: Object.freeze([GRADE2_LIVING_RULES_REASON_QUEST.curriculumMapId]),
    learningObjectiveIds: Object.freeze([GRADE2_LIVING_RULES_REASON_QUEST.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: GRADE2_LIVING_RULES_REASON_QUEST.learningObjective.objectiveId,
      statement: GRADE2_LIVING_RULES_REASON_QUEST.learningObjective.statement,
      status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze([GRADE2_LIVING_RULES_REASON_QUEST.curriculumMapId]),
      gradeApplicabilityStatus: 'stage_1_grade_1_to_2_local_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: GRADE2_LIVING_RULES_REASON_QUEST.learningObjective.objectiveId, taskIds: Object.freeze([GRADE2_LIVING_RULES_REASON_QUEST.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: GRADE2_LIVING_RULES_REASON_QUEST.activityId, title: GRADE2_LIVING_RULES_REASON_QUEST.title, taskKind: 'interactive_simulated_shared_rule_effect_classification', levelId: null, runtimeModule: 'prototype/data/earlyGradeCurriculumGapTasks.js', curriculumMapId: GRADE2_LIVING_RULES_REASON_QUEST.curriculumMapId, learningObjectiveIds: Object.freeze([GRADE2_LIVING_RULES_REASON_QUEST.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_partial_simulated_stage1_rule_purpose_case_no_real_behavior_evidence',
  }),
  Object.freeze({
    gradeId: 'grade-1', subjectId: 'health-physical-education',
    curriculumMapIds: Object.freeze([GRADE1_PLAYGROUND_SAFETY_ROUTE, ...GRADE1_HPE_EXPANSION_ACTIVITIES].map(({ curriculumMapId }) => curriculumMapId)),
    learningObjectiveIds: Object.freeze([GRADE1_PLAYGROUND_SAFETY_ROUTE, ...GRADE1_HPE_EXPANSION_ACTIVITIES].map(({ learningObjective }) => learningObjective.objectiveId)),
    objectiveDefinitions: Object.freeze([GRADE1_PLAYGROUND_SAFETY_ROUTE, ...GRADE1_HPE_EXPANSION_ACTIVITIES].map((activity) => Object.freeze({
      objectiveId: activity.learningObjective.objectiveId,
      statement: activity.learningObjective.statement,
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze([activity.curriculumMapId]),
      gradeApplicabilityStatus: 'stage_1_grade_1_to_2_game_directory_grade1_is_not_official_schedule',
    }))),
    learningObjectiveTaskLinks: Object.freeze([GRADE1_PLAYGROUND_SAFETY_ROUTE, ...GRADE1_HPE_EXPANSION_ACTIVITIES].map((activity) => Object.freeze({ learningObjectiveId: activity.learningObjective.objectiveId, taskIds: Object.freeze([activity.activityId]) }))),
    tasks: Object.freeze([GRADE1_PLAYGROUND_SAFETY_ROUTE, ...GRADE1_HPE_EXPANSION_ACTIVITIES].map((activity) => Object.freeze({ taskId: activity.activityId, title: activity.title, taskKind: 'interactive_simulated_health_physical_education_candidate', levelId: null, runtimeModule: activity === GRADE1_PLAYGROUND_SAFETY_ROUTE ? 'prototype/data/earlyGradeCurriculumGapTasks.js' : 'prototype/data/grade1HpeExpansionActivities.js', curriculumMapId: activity.curriculumMapId, learningObjectiveIds: Object.freeze([activity.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }))),
    relationshipStatus: 'candidate_partial_simulated_health_habits_safety_and_activity_choice_not_real_world_or_motor_skill_evidence',
  }),
  Object.freeze({
    gradeId: 'grade-4', subjectId: 'health-physical-education',
    curriculumMapIds: Object.freeze(['health-pe-stage2-sport-safety']),
    learningObjectiveIds: Object.freeze([HEALTH_PE_SAFETY_QUEST.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: HEALTH_PE_SAFETY_QUEST.learningObjective.objectiveId,
      statement: HEALTH_PE_SAFETY_QUEST.learningObjective.statement,
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['health-pe-stage2-sport-safety']),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: HEALTH_PE_SAFETY_QUEST.learningObjective.objectiveId, taskIds: Object.freeze([HEALTH_PE_SAFETY_QUEST.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: HEALTH_PE_SAFETY_QUEST.activityId, title: HEALTH_PE_SAFETY_QUEST.title, taskKind: 'interactive_sport_safety_classification', levelId: null, runtimeModule: 'prototype/data/healthPeSafetyQuest.js', curriculumMapId: HEALTH_PE_SAFETY_QUEST.curriculumMapId, learningObjectiveIds: Object.freeze([HEALTH_PE_SAFETY_QUEST.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_activity_linked_to_verified_stage2_curriculum_reference_not_grade4_schedule_or_physical_skill_evidence',
  }),
  Object.freeze({
    gradeId: 'grade-4', subjectId: 'integrative-activities',
    curriculumMapIds: Object.freeze(['integrative-stage2-learning-methods']),
    learningObjectiveIds: Object.freeze([INTEGRATIVE_STUDY_PLAN_QUEST.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: INTEGRATIVE_STUDY_PLAN_QUEST.learningObjective.objectiveId,
      statement: INTEGRATIVE_STUDY_PLAN_QUEST.learningObjective.statement,
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['integrative-stage2-learning-methods']),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: INTEGRATIVE_STUDY_PLAN_QUEST.learningObjective.objectiveId, taskIds: Object.freeze([INTEGRATIVE_STUDY_PLAN_QUEST.activityId]) })]),
    tasks: Object.freeze([Object.freeze({ taskId: INTEGRATIVE_STUDY_PLAN_QUEST.activityId, title: INTEGRATIVE_STUDY_PLAN_QUEST.title, taskKind: 'interactive_learning_method_sequence', levelId: null, runtimeModule: 'prototype/data/integrativeStudyPlanQuest.js', curriculumMapId: INTEGRATIVE_STUDY_PLAN_QUEST.curriculumMapId, learningObjectiveIds: Object.freeze([INTEGRATIVE_STUDY_PLAN_QUEST.learningObjective.objectiveId]), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_activity_linked_to_verified_stage2_curriculum_reference_not_grade4_schedule_or_self_management_mastery',
  }),
  ...[...new Set([...GRADE4_CANDIDATE_TASKS, ...GRADE4_EXPANSION_TASKS, GRADE4_ANGLE_EXPLORATION_WORKSHOP, ...GRADE4_MATH_GAP_TASKS, ...G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS.filter((task) => task.gradeId === 'grade-4')].map((task) => task.subjectId))].map((subjectId) => {
    const subjectTasks = [...GRADE4_CANDIDATE_TASKS, ...GRADE4_EXPANSION_TASKS, GRADE4_ANGLE_EXPLORATION_WORKSHOP, ...GRADE4_MATH_GAP_TASKS, ...G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS.filter((task) => task.gradeId === 'grade-4')].filter((task) => task.subjectId === subjectId);
    return Object.freeze({
      gradeId: 'grade-4', subjectId,
      curriculumMapIds: Object.freeze(subjectTasks.map((task) => task.curriculumMapId)),
      learningObjectiveIds: Object.freeze(subjectTasks.map((task) => task.learningObjective.objectiveId)),
      objectiveDefinitions: Object.freeze(subjectTasks.map((task) => Object.freeze({
        objectiveId: task.learningObjective.objectiveId,
        statement: task.learningObjective.statement,
        status: 'candidate_pending_teacher_review',
        curriculumMapIds: Object.freeze([task.curriculumMapId]),
        gradeApplicabilityStatus: subjectId === 'mathematics' ? 'grade_4_content_code_stage2_performance_local_schedule_pending' : 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
      }))),
      learningObjectiveTaskLinks: Object.freeze(subjectTasks.map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
      tasks: Object.freeze(subjectTasks.map((task) => Object.freeze({
        taskId: task.activityId,
        taskKind: task.stages.map(({ interaction }) => interaction).join('_then_'),
        levelId: null,
        runtimeModule: G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS.includes(task) ? 'prototype/data/crossGradeGapFillTasks.js' : GRADE4_MATH_GAP_TASKS.includes(task) ? 'prototype/data/grade4MathGapTasks.js' : task === GRADE4_ANGLE_EXPLORATION_WORKSHOP ? 'prototype/data/grade4AngleExplorationWorkshop.js' : GRADE4_EXPANSION_TASKS.includes(task) ? 'prototype/data/grade4ExpansionTasks.js' : 'prototype/data/grade4CandidateTasks.js',
        curriculumMapId: task.curriculumMapId,
        learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
        evidenceType: 'candidate_practice_response_only_memory_only',
        status: 'playable_candidate_pending_teacher_review',
      }))),
      relationshipStatus: 'candidate_partial_link_official_scope_not_textbook_schedule_or_full_coverage',
    });
  }),
  ...[...new Set(GRADE5_CANDIDATE_TASKS.map((task) => task.subjectId))].map((subjectId) => {
    const subjectTasks = GRADE5_CANDIDATE_TASKS.filter((task) => task.subjectId === subjectId);
    return Object.freeze({
      gradeId: 'grade-5', subjectId,
      curriculumMapIds: Object.freeze(subjectTasks.map((task) => task.curriculumMapId)),
      learningObjectiveIds: Object.freeze(subjectTasks.map((task) => task.learningObjective.objectiveId)),
      objectiveDefinitions: Object.freeze(subjectTasks.map((task) => Object.freeze({
        objectiveId: task.learningObjective.objectiveId,
        statement: task.learningObjective.statement,
        status: 'candidate_pending_teacher_review',
        curriculumMapIds: Object.freeze([task.curriculumMapId]),
        gradeApplicabilityStatus: ['mathematics'].includes(subjectId)
          ? 'grade_5_content_code_local_textbook_and_schedule_pending'
          : 'stage_3_grade_5_to_6_local_grade_schedule_pending',
      }))),
      learningObjectiveTaskLinks: Object.freeze(subjectTasks.map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
      tasks: Object.freeze(subjectTasks.map((task) => Object.freeze({
        taskId: task.activityId,
        title: task.title,
        taskKind: task.stages.map(({ interaction }) => interaction).join('_then_'),
        levelId: null,
        runtimeModule: 'prototype/data/grade5CandidateTasks.js',
        curriculumMapId: task.curriculumMapId,
        learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
        evidenceType: 'candidate_practice_response_only_memory_only',
        status: 'playable_candidate_pending_teacher_review',
      }))),
      relationshipStatus: 'candidate_partial_link_official_scope_not_textbook_schedule_or_full_coverage',
    });
  }),
  ...[...new Set(GRADE6_CANDIDATE_TASKS.map((task) => task.subjectId))].map((subjectId) => {
    const subjectTasks = GRADE6_CANDIDATE_TASKS.filter((task) => task.subjectId === subjectId);
    return Object.freeze({
      gradeId: 'grade-6', subjectId,
      curriculumMapIds: Object.freeze(subjectTasks.map((task) => task.curriculumMapId)),
      learningObjectiveIds: Object.freeze(subjectTasks.map((task) => task.learningObjective.objectiveId)),
      objectiveDefinitions: Object.freeze(subjectTasks.map((task) => Object.freeze({
        objectiveId: task.learningObjective.objectiveId,
        statement: task.learningObjective.statement,
        status: 'candidate_pending_teacher_review',
        curriculumMapIds: Object.freeze([task.curriculumMapId]),
        gradeApplicabilityStatus: subjectId === 'mathematics'
          ? 'grade_6_content_code_local_textbook_and_schedule_pending'
          : 'stage_3_grade_5_to_6_local_grade_schedule_pending',
      }))),
      learningObjectiveTaskLinks: Object.freeze(subjectTasks.map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
      tasks: Object.freeze(subjectTasks.map((task) => Object.freeze({
        taskId: task.activityId,
        title: task.title,
        taskKind: task.stages.map(({ interaction }) => interaction).join('_then_'),
        levelId: null,
        runtimeModule: 'prototype/data/grade6CandidateTasks.js',
        curriculumMapId: task.curriculumMapId,
        learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
        evidenceType: 'candidate_practice_response_only_memory_only',
        status: 'playable_candidate_pending_teacher_review',
      }))),
      relationshipStatus: 'candidate_partial_link_official_scope_not_textbook_schedule_or_full_coverage',
    });
  }),
  ...[...new Set(G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS.filter((task) => task.gradeId === 'grade-6').map((task) => task.subjectId))].map((subjectId) => {
    const gradeId = 'grade-6';
    const subjectTasks = G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS.filter((task) => task.gradeId === gradeId && task.subjectId === subjectId);
    const stage = gradeId === 'grade-4' ? 'stage_2_grade_3_to_4_local_grade_schedule_pending' : 'stage_3_grade_5_to_6_local_grade_schedule_pending';
    return Object.freeze({
      gradeId, subjectId,
      curriculumMapIds: Object.freeze(subjectTasks.map((task) => task.curriculumMapId)),
      learningObjectiveIds: Object.freeze(subjectTasks.map((task) => task.learningObjective.objectiveId)),
      objectiveDefinitions: Object.freeze(subjectTasks.map((task) => Object.freeze({
        objectiveId: task.learningObjective.objectiveId,
        statement: task.learningObjective.statement,
        status: 'candidate_pending_teacher_review',
        curriculumMapIds: Object.freeze([task.curriculumMapId]),
        gradeApplicabilityStatus: stage,
      }))),
      learningObjectiveTaskLinks: Object.freeze(subjectTasks.map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
      tasks: Object.freeze(subjectTasks.map((task) => Object.freeze({
        taskId: task.activityId,
        title: task.title,
        taskKind: task.stages.map(({ interaction }) => interaction).join('_then_'),
        levelId: null,
        runtimeModule: 'prototype/data/crossGradeGapFillTasks.js',
        curriculumMapId: task.curriculumMapId,
        learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
        evidenceType: 'candidate_practice_response_only_memory_only',
        status: 'playable_candidate_pending_teacher_review',
      }))),
      relationshipStatus: 'candidate_partial_link_official_stage_reference_not_grade_schedule_or_full_coverage',
    });
  }),
  Object.freeze({
    gradeId: 'grade-3',
    subjectId: 'chinese-language',
    curriculumMapIds: Object.freeze(['chinese-reading-comprehension', 'chinese-contextual-vocabulary-sentence', 'chinese-narrative-sequence-structure']),
    learningObjectiveIds: Object.freeze(['LO-G3-READING-CANDIDATE-01', STORY_FOREST_CLUE_RESCUE_QUEST.learningObjective.objectiveId, CONTEXT_WORD_SENTENCE_WORKSHOP.learningObjective.objectiveId, STORY_SEQUENCE_TIMELINE_QUEST.learningObjective.objectiveId]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: 'LO-G3-READING-CANDIDATE-01',
      statement: '從短文找出支持理解的線索，說明事件重點，並在新情境中根據文字線索作簡單推論。',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['chinese-reading-comprehension']),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    }), ...[
      STORY_FOREST_CLUE_RESCUE_QUEST,
      CONTEXT_WORD_SENTENCE_WORKSHOP,
      STORY_SEQUENCE_TIMELINE_QUEST,
    ].map((task) => Object.freeze({
      objectiveId: task.learningObjective.objectiveId,
      statement: task.learningObjective.statement,
      status: task.status,
      curriculumMapIds: Object.freeze([task.curriculumMapId]),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    }))]),
    learningObjectiveTaskLinks: Object.freeze([
      Object.freeze({ learningObjectiveId: 'LO-G3-READING-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-CHINESE-READING-GARDEN-CANDIDATE']) }),
      ...[
        STORY_FOREST_CLUE_RESCUE_QUEST,
        CONTEXT_WORD_SENTENCE_WORKSHOP,
        STORY_SEQUENCE_TIMELINE_QUEST,
      ].map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) })),
    ]),
    tasks: Object.freeze([
      Object.freeze({ taskId: 'ACT-G3-CHINESE-READING-GARDEN-CANDIDATE', taskKind: 'interactive_reading_quest', levelId: null, runtimeModule: 'prototype/data/storyForestReadingQuest.js', curriculumMapId: 'chinese-reading-comprehension', learningObjectiveIds: Object.freeze(['LO-G3-READING-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      ...[
        STORY_FOREST_CLUE_RESCUE_QUEST,
        CONTEXT_WORD_SENTENCE_WORKSHOP,
        STORY_SEQUENCE_TIMELINE_QUEST,
      ].map((task, index) => Object.freeze({
        taskId: task.activityId,
        title: task.title,
        taskKind: ['interactive_reading_evidence_inference', 'interactive_context_word_sentence_assembly', 'interactive_narrative_event_ordering'][index],
        levelId: null,
        runtimeModule: `prototype/data/${['storyForestClueRescueQuest.js', 'contextWordSentenceWorkshop.js', 'storySequenceTimelineQuest.js'][index]}`,
        curriculumMapId: task.curriculumMapId,
        learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
        evidenceType: 'candidate_practice_response_only_memory_only',
        status: 'playable_candidate_pending_teacher_review',
      })),
    ]),
    relationshipStatus: 'candidate_activity_linked_to_verified_stage_level_curriculum_reference_not_grade_schedule_or_mastery',
  }),
  Object.freeze({
    gradeId: 'grade-3',
    subjectId: 'english-language',
    curriculumMapIds: Object.freeze(['english-daily-communication-stage2']),
    learningObjectiveIds: Object.freeze(['LO-G3-ENGLISH-CANDIDATE-01']),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: 'LO-G3-ENGLISH-CANDIDATE-01',
      statement: '在簡短校園對話情境中理解對方意圖，組合合宜的英語回應；不評量口說發音或聽力。',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['english-daily-communication-stage2']),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: 'LO-G3-ENGLISH-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-ENGLISH-CLASSROOM-CONVERSATION-CANDIDATE']) })]),
    tasks: Object.freeze([Object.freeze({ taskId: 'ACT-G3-ENGLISH-CLASSROOM-CONVERSATION-CANDIDATE', taskKind: 'interactive_scenario_phrase_assembly', levelId: null, runtimeModule: 'prototype/data/englishScenarioAdventure.js', curriculumMapId: 'english-daily-communication-stage2', learningObjectiveIds: Object.freeze(['LO-G3-ENGLISH-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_activity_linked_to_verified_stage_level_curriculum_reference_not_grade_schedule_or_mastery',
  }),
  Object.freeze({
    gradeId: 'grade-3',
    subjectId: 'natural-science',
    curriculumMapIds: Object.freeze(['science-animal-observation']),
    learningObjectiveIds: Object.freeze(['LO-G3-SCIENCE-ANIMAL-OBSERVATION-CANDIDATE-01']),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: 'LO-G3-SCIENCE-ANIMAL-OBSERVATION-CANDIDATE-01',
      statement: '依據提供的動物外部形態觀察紀錄，分類共同出現的部位與不同類別的特徵，並用紀錄作為判斷依據。',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['science-animal-observation']),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: 'LO-G3-SCIENCE-ANIMAL-OBSERVATION-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-SCIENCE-ANIMAL-FORM-OBSERVATION-CANDIDATE']) })]),
    tasks: Object.freeze([Object.freeze({ taskId: 'ACT-G3-SCIENCE-ANIMAL-FORM-OBSERVATION-CANDIDATE', taskKind: 'interactive_observation_classification', levelId: null, runtimeModule: 'prototype/data/animalObservationExploration.js', curriculumMapId: 'science-animal-observation', learningObjectiveIds: Object.freeze(['LO-G3-SCIENCE-ANIMAL-OBSERVATION-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_activity_linked_to_verified_stage_level_curriculum_reference_not_grade_schedule_or_mastery',
  }),
  Object.freeze({
    gradeId: 'grade-3',
    subjectId: 'social-studies',
    curriculumMapIds: Object.freeze(['social-neighborhood-change-stage2']),
    learningObjectiveIds: Object.freeze(['LO-G3-SOCIAL-CANDIDATE-01']),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: 'LO-G3-SOCIAL-CANDIDATE-01',
      statement: '閱讀一組明確標示為虛構的社區觀察紀錄，摘取可直接支持的重點，並區分紀錄中的事實與尚無證據的推論。',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['social-neighborhood-change-stage2']),
      gradeApplicabilityStatus: 'stage_2_span_grade_3_to_4_local_grade_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: 'LO-G3-SOCIAL-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-SOCIAL-NEIGHBORHOOD-CHANGE-CANDIDATE']) })]),
    tasks: Object.freeze([Object.freeze({ taskId: 'ACT-G3-SOCIAL-NEIGHBORHOOD-CHANGE-CANDIDATE', taskKind: 'interactive_social_evidence_classification', levelId: null, runtimeModule: 'prototype/data/neighborhoodChangeExploration.js', curriculumMapId: 'social-neighborhood-change-stage2', learningObjectiveIds: Object.freeze(['LO-G3-SOCIAL-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_partial_link_to_verified_stage_level_reference_not_claiming_causes_of_environmental_change_or_grade_schedule',
  }),
  Object.freeze({
    gradeId: 'grade-3',
    subjectId: 'mathematics',
    curriculumMapIds: Object.freeze(['math-number-place-value-m3-num-01', 'math-grade3-n-3-2-add-sub', 'math-grade3-d-3-1-data-tables', 'math-division-meaning-application-m3-ops-03', 'math-grade3-n-3-17-time', 'math-grade3-n-3-13-s-3-1-angle', 'math-grade3-n-3-6-mult-div-application', 'math-grade3-r-3-1-mult-div-inverse', 'math-grade3-n-3-10-one-decimal', 'math-grade3-s-3-4-geometry-operations', 'math-grade3-n-3-3-one-digit-multiplication', 'math-grade3-n-3-5-one-digit-division', 'math-grade3-n-3-7-two-step-problems', 'math-circle-elements-m3-geo-02', 'math-grade3-r-3-2-pattern', 'math-grade3-n-3-8-estimation', 'math-grade3-s-3-2-square-rectangle', 'math-grade3-n-3-9-common-denominator-fractions', 'math-grade3-n-3-12-millimeter', 'math-grade3-n-3-16-weight']),
    candidateLearningPath: Object.freeze([
      Object.freeze({ order: 1, title: '位值與基本乘除經驗', status: 'existing_candidate_path_reference', note: '沿用既有數字島、乘法陣列及除法情境；不作為正式解鎖條件。' }),
      Object.freeze({ order: 2, activityId: 'ACT-G3-MATH-MULTIPLICATION-DIVISION-CALCULATION-CANDIDATE', title: '乘除計算工坊', curriculumCodes: Object.freeze(['N-3-3', 'N-3-5']), status: 'playable_candidate' }),
      Object.freeze({ order: 3, activityId: 'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE', title: '兩步驟任務探險', curriculumCodes: Object.freeze(['N-3-7']), status: 'playable_candidate', prerequisite: '加法與除法分步求解' }),
      Object.freeze({ order: 4, activityId: 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE', title: '圓形與規律建造區', curriculumCodes: Object.freeze(['S-3-3', 'R-3-2']), status: 'playable_candidate', prerequisite: '圖形名稱與重複次序觀察' }),
      Object.freeze({ order: 5, activityId: 'ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE', title: '估算探險站', curriculumCodes: Object.freeze(['N-3-8']), status: 'candidate_partial_coverage', prerequisite: '加減乘除的生活量感；簡單除法情境先備待教師確認' }),
      Object.freeze({ order: 6, activityId: 'ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE', title: '幾何建造工坊', curriculumCodes: Object.freeze(['S-3-2']), status: 'candidate_partial_coverage', prerequisite: '辨識邊、直角及等長的先備待教師確認' }),
      Object.freeze({ order: 7, activityId: 'ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE', title: '分數拼片探險工坊：比一比、合起來', curriculumCodes: Object.freeze(['N-3-9']), status: 'candidate_partial_coverage', prerequisite: '整數的比較與加減經驗；年級授課先後待教師確認' }),
      Object.freeze({ order: 8, activityId: 'ACT-G3-MATH-LENGTH-MEASUREMENT-ADVENTURE-CANDIDATE', title: '長度測量探險站：估一估、對一對、量一量', curriculumCodes: Object.freeze(['N-3-12']), status: 'candidate_partial_coverage', prerequisite: '毫米刻度辨識與公分、毫米關係；學校授課順序待確認' }),
      Object.freeze({ order: 9, activityId: 'ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE', title: '方格面積建造工坊：鋪設、比較與補格', curriculumCodes: Object.freeze(['N-3-14']), status: 'candidate_partial_coverage', prerequisite: '辨認相同單位方格並逐格計數；實際年級授課順序待教師確認' }),
      Object.freeze({ order: 10, activityId: 'ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE', title: '重量測量與秤重探險站：估一估、秤一秤、比一比', curriculumCodes: Object.freeze(['N-3-16']), status: 'candidate_partial_coverage', prerequisite: '認識公斤、公克及秤面刻度；學校授課順序待確認' }),
    ]),
    learningObjectiveIds: Object.freeze([
      'LO-M3-NUM-PLACE-VALUE-01',
      'LO-M3-NUM-PLACE-VALUE-02',
      'LO-M3-NUM-PLACE-VALUE-03',
      'LO-G3-MATH-DATA-TABLE-CANDIDATE-01',
      'LO-G3-MATH-DIVISION-CANDIDATE-01',
      'LO-G3-MATH-TIME-CANDIDATE-01',
      'LO-G3-MATH-ANGLE-CANDIDATE-01',
      'LO-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE-01',
      'LO-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE-01',
      'LO-G3-MATH-GEOMETRY-TILE-CANDIDATE-01',
      'LO-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-CANDIDATE-01',
      'LO-G3-MATH-CALCULATION-CANDIDATE-01',
      'LO-G3-MATH-TWO-STEP-CANDIDATE-01',
      'LO-G3-MATH-CIRCLE-PATTERN-CANDIDATE-01',
      'LO-G3-MATH-ESTIMATION-CANDIDATE-01',
      'LO-G3-MATH-SQUARE-RECTANGLE-CANDIDATE-01',
      'LO-G3-MATH-PLACE-VALUE-EXCHANGE-01',
      'LO-G3-MATH-VERTICAL-REGROUPING-01',
      'LO-G3-MATH-FRACTION-MODEL-01',
      'LO-G3-MATH-LENGTH-MEASUREMENT-01',
      'LO:chapter-scope-m3-math-weight-kg-g:01',
    ]),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: 'LO-G3-MATH-DATA-TABLE-CANDIDATE-01',
      statement: '將虛構調查卡整理成一維次數表，再依不同資料表比較數量。',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['math-grade3-d-3-1-data-tables']),
      gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending',
    }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-DIVISION-CANDIDATE-01', statement: '從平均分配與每組固定數量的情境辨認除法關係，並用乘法關係檢查整除結果。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-division-meaning-application-m3-ops-03']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-TIME-CANDIDATE-01', statement: '操作 5 分鐘刻度鐘面並配對數位時刻，以合理範圍估計活動分鐘數，再在同一小時內操作時間線計算經過分鐘。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-17-time']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-ANGLE-CANDIDATE-01', statement: '依據兩條邊開口與直角基準的文字觀察，分類小於、等於或大於直角的角。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-13-s-3-1-angle']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE-01', statement: '以等量陣列表示相同數量的組，並用乘法關係處理一個未知組數的簡單情境。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-6-mult-div-application', 'math-grade3-r-3-1-mult-div-inverse']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE-01', statement: '在等距十分位數線上移動標記，將一位小數放到相應位置。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-10-one-decimal']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-GEOMETRY-TILE-CANDIDATE-01', statement: '操作選取等大的方格片，拼成指定列數與欄數的平面矩形或正方形。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-s-3-4-geometry-operations']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-CANDIDATE-01', statement: '移動與旋轉平面拼片完成目標外形，並操作不同展開圖的摺合模擬，觀察立體各面的相鄰關係。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-s-3-4-geometry-operations']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-CALCULATION-CANDIDATE-01', statement: '依位值逐步選擇一位數乘法與整除除法直式中的中間數字，並留意 0 的位置。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-3-one-digit-multiplication', 'math-grade3-n-3-5-one-digit-division']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-TWO-STEP-CANDIDATE-01', statement: '先求補給總數，再用前一步結果平均分裝，能依序解決一種加法後除法的兩步驟問題。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-7-two-step-problems']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-CIRCLE-PATTERN-CANDIDATE-01', statement: '透過可變圓半徑的示意圖辨認圓的構成元素，並操作延伸一維圖形重複模式。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-circle-elements-m3-geo-02', 'math-grade3-r-3-2-pattern']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-ESTIMATION-CANDIDATE-01', statement: '在不同生活情境中提出合理的數量估計，並判斷精確結果是否與估計相稱。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-8-estimation']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-SQUARE-RECTANGLE-CANDIDATE-01', statement: '透過斜擺與正擺圖形辨認直角與邊長特徵，並用方格片建造正方形和長方形。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-s-3-2-square-rectangle']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-PLACE-VALUE-EXCHANGE-01', statement: '以數位千、百、十、個積木組成指定數，操作相鄰位值單位交換並核對總值不變。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-number-place-value-m3-num-01']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-VERTICAL-REGROUPING-01', statement: '逐欄操作加減直式的結果數字與進位／退位紀錄，處理多次進退位及含 0 題型。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-2-add-sub']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-FRACTION-MODEL-01', statement: '以相同整體、等分的連續量分數片建立與比較同分母分數，並操作合併、取走及合成一。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-9-common-denominator-fractions']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO-G3-MATH-LENGTH-MEASUREMENT-01', statement: '以毫米先估測，再在數位尺規模型中移動尺使 0 對齊、讀取端點，比較兩段長度並表示成公分與毫米。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-12-millimeter']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' }),
    Object.freeze({ objectiveId: 'LO:chapter-scope-m3-math-weight-kg-g:01', statement: '在數位秤重模型中先估測，再以砝碼平衡、秤面讀值、重量比較及公斤公克表示完成補給任務。', status: 'candidate_pending_teacher_review', curriculumMapIds: Object.freeze(['math-grade3-n-3-16-weight']), gradeApplicabilityStatus: 'grade3_content_reference_stage2_performance_local_schedule_pending' })]),
    learningObjectiveTaskLinks: Object.freeze([
      Object.freeze({ learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-01', taskIds: Object.freeze(['ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET', 'learning-unit:chapter-scope-m3-math-number-place-value']) }),
      Object.freeze({ learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-02', taskIds: Object.freeze(['ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET', 'learning-unit:chapter-scope-m3-math-number-place-value']) }),
      Object.freeze({ learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-03', taskIds: Object.freeze(['ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET', 'learning-unit:chapter-scope-m3-math-number-place-value']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-DATA-TABLE-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-DATA-TABLE-WORKSHOP-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-DIVISION-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-DIVISION-SHARING-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-TIME-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-TIMEKEEPER-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-ANGLE-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-GEOMETRY-TILE-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-GEOMETRY-TILE-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-FOLD-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-CALCULATION-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-MULTIPLICATION-DIVISION-CALCULATION-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-TWO-STEP-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-CIRCLE-PATTERN-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-ESTIMATION-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-SQUARE-RECTANGLE-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-PLACE-VALUE-EXCHANGE-01', taskIds: Object.freeze(['ACT-G3-MATH-PLACE-VALUE-EXCHANGE-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-VERTICAL-REGROUPING-01', taskIds: Object.freeze(['ACT-G3-MATH-VERTICAL-REGROUPING-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-FRACTION-MODEL-01', taskIds: Object.freeze(['ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO-G3-MATH-LENGTH-MEASUREMENT-01', taskIds: Object.freeze(['ACT-G3-MATH-LENGTH-MEASUREMENT-ADVENTURE-CANDIDATE']) }),
      Object.freeze({ learningObjectiveId: 'LO:chapter-scope-m3-math-weight-kg-g:01', taskIds: Object.freeze(['ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE']) }),
    ]),
    tasks: Object.freeze([
      Object.freeze({ taskId: 'ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET', taskKind: 'map_quest_activity', levelId: 'number-secret-challenge', learningObjectiveIds: Object.freeze(['LO-M3-NUM-PLACE-VALUE-01', 'LO-M3-NUM-PLACE-VALUE-02', 'LO-M3-NUM-PLACE-VALUE-03']), evidenceType: 'prototype_activity_completion_not_learning_outcome', status: 'existing_playable_prototype_pending_teacher_review' }),
      Object.freeze({ taskId: 'learning-unit:chapter-scope-m3-math-number-place-value', taskKind: 'shared_learning_unit', levelId: 'number-secret-challenge', learningObjectiveIds: Object.freeze(['LO-M3-NUM-PLACE-VALUE-01', 'LO-M3-NUM-PLACE-VALUE-02', 'LO-M3-NUM-PLACE-VALUE-03']), evidenceType: 'candidate_learning_unit_response_only_memory_no_student_record', status: 'candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-DATA-TABLE-WORKSHOP-CANDIDATE', taskKind: 'interactive_data_table_construction', levelId: null, runtimeModule: 'prototype/data/mathDataTableWorkshop.js', curriculumMapId: 'math-grade3-d-3-1-data-tables', learningObjectiveIds: Object.freeze(['LO-G3-MATH-DATA-TABLE-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-DIVISION-SHARING-CANDIDATE', taskKind: 'interactive_division_situation_classification', levelId: null, runtimeModule: 'prototype/data/divisionSharingWorkshop.js', curriculumMapId: 'math-division-meaning-application-m3-ops-03', learningObjectiveIds: Object.freeze(['LO-G3-MATH-DIVISION-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-TIMEKEEPER-CANDIDATE', taskKind: 'interactive_analog_clock_time_estimation_and_elapsed_minute_timeline', levelId: null, runtimeModule: 'prototype/data/timekeeperWorkshop.js', curriculumMapId: 'math-grade3-n-3-17-time', learningObjectiveIds: Object.freeze(['LO-G3-MATH-TIME-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE', taskKind: 'interactive_angle_identification_rotation_comparison', levelId: null, runtimeModule: 'prototype/data/angleExplorerWorkshop.js', curriculumMapId: 'math-grade3-n-3-13-s-3-1-angle', learningObjectiveIds: Object.freeze(['LO-G3-MATH-ANGLE-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE', taskKind: 'interactive_multiplication_array_and_unknown_groups', levelId: null, runtimeModule: 'prototype/data/multiplicationArrayWorkshop.js', curriculumMapId: 'math-grade3-n-3-6-mult-div-application', relatedCurriculumMapIds: Object.freeze(['math-grade3-r-3-1-mult-div-inverse']), learningObjectiveIds: Object.freeze(['LO-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE', taskKind: 'interactive_decimal_number_line_marker', levelId: null, runtimeModule: 'prototype/data/decimalNumberLineWorkshop.js', curriculumMapId: 'math-grade3-n-3-10-one-decimal', learningObjectiveIds: Object.freeze(['LO-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-GEOMETRY-TILE-CANDIDATE', taskKind: 'interactive_shape_tile_composition', levelId: null, runtimeModule: 'prototype/data/geometryTileWorkshop.js', curriculumMapId: 'math-grade3-s-3-4-geometry-operations', learningObjectiveIds: Object.freeze(['LO-G3-MATH-GEOMETRY-TILE-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-FOLD-CANDIDATE', taskKind: 'interactive_planar_recomposition_and_cube_net_fold_simulation', levelId: null, runtimeModule: 'prototype/data/gradeThreeGeometryExplorationWorkshop.js', curriculumMapId: 'math-grade3-s-3-4-geometry-operations', learningObjectiveIds: Object.freeze(['LO-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-MULTIPLICATION-DIVISION-CALCULATION-CANDIDATE', taskKind: 'interactive_place_value_calculation_steps', levelId: null, runtimeModule: 'prototype/data/multiplicationDivisionCalculationWorkshop.js', curriculumMapId: 'math-grade3-n-3-3-one-digit-multiplication', relatedCurriculumMapIds: Object.freeze(['math-grade3-n-3-5-one-digit-division']), learningObjectiveIds: Object.freeze(['LO-G3-MATH-CALCULATION-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE', taskKind: 'interactive_dependent_two_step_application', levelId: null, runtimeModule: 'prototype/data/twoStepSupplyAdventure.js', curriculumMapId: 'math-grade3-n-3-7-two-step-problems', learningObjectiveIds: Object.freeze(['LO-G3-MATH-TWO-STEP-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE', taskKind: 'interactive_circle_elements_pattern_composition_and_rule_evidence', levelId: null, runtimeModule: 'prototype/data/circleAndPatternWorkshop.js', curriculumMapId: 'math-circle-elements-m3-geo-02', relatedCurriculumMapIds: Object.freeze(['math-grade3-r-3-2-pattern']), learningObjectiveIds: Object.freeze(['LO-G3-MATH-CIRCLE-PATTERN-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE', taskKind: 'interactive_estimation_range_slider', levelId: null, runtimeModule: 'prototype/data/estimationAdventureStation.js', curriculumMapId: 'math-grade3-n-3-8-estimation', learningObjectiveIds: Object.freeze(['LO-G3-MATH-ESTIMATION-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE', taskKind: 'interactive_shape_property_sort_and_tile_construction', levelId: null, runtimeModule: 'prototype/data/geometryConstructionWorkshop.js', curriculumMapId: 'math-grade3-s-3-2-square-rectangle', learningObjectiveIds: Object.freeze(['LO-G3-MATH-SQUARE-RECTANGLE-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-PLACE-VALUE-EXCHANGE-CANDIDATE', taskKind: 'interactive_place_value_block_build_and_exchange', levelId: null, runtimeModule: 'prototype/data/grade3PlaceValueAndColumnTasks.js', curriculumMapId: 'math-number-place-value-m3-num-01', learningObjectiveIds: Object.freeze(['LO-G3-MATH-PLACE-VALUE-EXCHANGE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-VERTICAL-REGROUPING-CANDIDATE', taskKind: 'interactive_vertical_addition_subtraction_regrouping_steps', levelId: null, runtimeModule: 'prototype/data/grade3PlaceValueAndColumnTasks.js', curriculumMapId: 'math-grade3-n-3-2-add-sub', learningObjectiveIds: Object.freeze(['LO-G3-MATH-VERTICAL-REGROUPING-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE', taskKind: 'interactive_same_denominator_fraction_piece_model', levelId: null, runtimeModule: 'prototype/data/fractionModelExplorationWorkshop.js', curriculumMapId: 'math-grade3-n-3-9-common-denominator-fractions', learningObjectiveIds: Object.freeze(['LO-G3-MATH-FRACTION-MODEL-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-LENGTH-MEASUREMENT-ADVENTURE-CANDIDATE', taskKind: 'interactive_millimeter_estimate_ruler_alignment_reading_comparison_conversion', levelId: null, runtimeModule: 'prototype/data/lengthMeasurementAdventure.js', curriculumMapId: 'math-grade3-n-3-12-millimeter', learningObjectiveIds: Object.freeze(['LO-G3-MATH-LENGTH-MEASUREMENT-01']), evidenceType: 'candidate_practice_response_only_memory_only_simulated_ruler_not_real_measurement', status: 'playable_candidate_pending_teacher_review' }),
      Object.freeze({ taskId: 'ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE', taskKind: 'interactive_weight_estimation_balance_scale_reading_comparison_and_unit_conversion_simulation', levelId: null, runtimeModule: 'prototype/data/weightMeasurementAdventure.js', curriculumMapId: 'math-grade3-n-3-16-weight', learningObjectiveIds: Object.freeze(['LO:chapter-scope-m3-math-weight-kg-g:01']), evidenceType: 'candidate_practice_response_only_memory_only_simulated_scale_not_real_measurement', status: 'playable_candidate_pending_teacher_review' }),
    ]),
    relationshipStatus: 'traceable_candidate_links_not_curriculum_approval_or_mastery_evidence',
  }),
  Object.freeze({
    gradeId: 'grade-3', subjectId: 'arts', curriculumMapIds: Object.freeze(['arts-stage2-rhythm-creation']),
    learningObjectiveIds: Object.freeze(['LO-G3-ARTS-RHYTHM-CANDIDATE-01']),
    objectiveDefinitions: Object.freeze([Object.freeze({
      objectiveId: 'LO-G3-ARTS-RHYTHM-CANDIDATE-01',
      statement: '以視覺節奏卡組成符合指定條件的短節奏，觀察重複與變化。',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: Object.freeze(['arts-stage2-rhythm-creation']),
      gradeApplicabilityStatus: 'stage_2_grade_3_to_4_local_grade_schedule_pending',
    })]),
    learningObjectiveTaskLinks: Object.freeze([Object.freeze({ learningObjectiveId: 'LO-G3-ARTS-RHYTHM-CANDIDATE-01', taskIds: Object.freeze(['ACT-G3-ARTS-RHYTHM-WORKSHOP-CANDIDATE']) })]),
    tasks: Object.freeze([Object.freeze({ taskId: 'ACT-G3-ARTS-RHYTHM-WORKSHOP-CANDIDATE', taskKind: 'interactive_rhythm_pattern_composition', levelId: null, runtimeModule: 'prototype/data/artsRhythmWorkshop.js', curriculumMapId: 'arts-stage2-rhythm-creation', learningObjectiveIds: Object.freeze(['LO-G3-ARTS-RHYTHM-CANDIDATE-01']), evidenceType: 'candidate_practice_response_only_memory_only', status: 'playable_candidate_pending_teacher_review' })]),
    relationshipStatus: 'candidate_visual_pattern_composition_linked_to_stage_2_reference_not_grade_schedule_or_mastery',
  }),
  ...[...new Set([...OFFICIAL_GAP_CANDIDATE_TASKS, ...LEARNING_SUBITEM_EXPANSION_TASKS, ...LEARNING_SUBITEM_GAP_TASKS, ...GRADE3_MATH_DATA_EXPANSION_TASKS, ...CURRICULUM_GAP_BATCH_TASKS, ...MATH_CURRICULUM_GAP_TASKS].map((task) => `${task.gradeId}|${task.subjectId}`))].map((key) => {
    const [gradeId, subjectId] = key.split('|');
    const tasks = [...OFFICIAL_GAP_CANDIDATE_TASKS, ...LEARNING_SUBITEM_EXPANSION_TASKS, ...LEARNING_SUBITEM_GAP_TASKS, ...GRADE3_MATH_DATA_EXPANSION_TASKS, ...CURRICULUM_GAP_BATCH_TASKS, ...MATH_CURRICULUM_GAP_TASKS].filter((task) => task.gradeId === gradeId && task.subjectId === subjectId);
    const gradeNo = Number(gradeId.slice(-1));
    const stage = gradeNo <= 2 ? 'stage_1_grade_entry_is_game_design_not_official_sequence' : gradeNo <= 4 ? 'stage_2_grade_3_to_4_local_schedule_pending' : 'stage_3_grade_5_to_6_local_schedule_pending';
    return Object.freeze({
      gradeId, subjectId,
      curriculumMapIds: Object.freeze([...new Set(tasks.map((task) => task.curriculumMapId))]),
      learningObjectiveIds: Object.freeze(tasks.map((task) => task.learningObjective.objectiveId)),
      objectiveDefinitions: Object.freeze(tasks.map((task) => Object.freeze({
        objectiveId: task.learningObjective.objectiveId,
        statement: task.learningObjective.statement,
        status: 'candidate_pending_teacher_review',
        curriculumMapIds: Object.freeze([task.curriculumMapId]),
        gradeApplicabilityStatus: stage,
      }))),
      learningObjectiveTaskLinks: Object.freeze(tasks.map((task) => Object.freeze({ learningObjectiveId: task.learningObjective.objectiveId, taskIds: Object.freeze([task.activityId]) }))),
      tasks: Object.freeze(tasks.map((task) => Object.freeze({
        taskId: task.activityId,
        title: task.title,
        taskKind: task.stages.map(({ interaction }) => interaction).join('_then_'),
        levelId: null,
        runtimeModule: task.runtimeModule ?? 'prototype/data/officialGapCandidateTasks.js',
        curriculumMapId: task.curriculumMapId,
        learningObjectiveIds: Object.freeze([task.learningObjective.objectiveId]),
        evidenceType: 'candidate_practice_response_only_memory_only',
        status: 'playable_candidate_pending_teacher_review',
      }))),
      relationshipStatus: 'candidate_links_official_focus_partial_coverage_local_grade_schedule_and_teacher_review_pending',
    });
  }),
]));

export function getLearningTaskRelation(gradeId, subjectId) {
  const mapSubjectId = SUBJECT_DEFINITIONS.find((subject) => subject.subjectId === subjectId)?.learningMapSubjectId ?? subjectId;
  return LEARNING_TASK_RELATIONS.find((entry) => entry.gradeId === gradeId && entry.subjectId === subjectId)
    ?? LEARNING_TASK_RELATIONS.find((entry) => entry.gradeId === gradeId && entry.subjectId === mapSubjectId)
    ?? null;
}
