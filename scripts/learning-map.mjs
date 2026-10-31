import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';
import { demoQuestionSet } from '../prototype/data/demoQuestions.js';
import { numberSecretChallenge } from '../prototype/data/numberSecretQuestions.js';
import { numberComparisonQuestionSet } from '../prototype/data/numberComparisonQuestions.js';
import { CAPACITY_OBSERVATION_SCENARIOS } from '../prototype/capacityMission.js';
import { MILLIMETER_RULER_LEARNING_UNIT } from '../prototype/data/millimeterRulerLearningUnit.js';
import { WEIGHT_KG_G_LEARNING_UNIT } from '../prototype/data/weightKgGLearningUnit.js';
import { SQUARE_CENTIMETER_AREA_LEARNING_UNIT } from '../prototype/data/squareCentimeterAreaLearningUnit.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from '../prototype/data/fractionTreasureLearningUnit.js';
import { LEARNING_TASK_RELATIONS, SUBJECT_DEFINITIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { STORY_FOREST_READING_QUEST } from '../prototype/data/storyForestReadingQuest.js';
import { ENGLISH_SCENARIO_ADVENTURE } from '../prototype/data/englishScenarioAdventure.js';
import { ANIMAL_OBSERVATION_EXPLORATION } from '../prototype/data/animalObservationExploration.js';
import { NEIGHBORHOOD_CHANGE_EXPLORATION } from '../prototype/data/neighborhoodChangeExploration.js';
import { MATH_DATA_TABLE_WORKSHOP } from '../prototype/data/mathDataTableWorkshop.js';
import { ARTS_RHYTHM_WORKSHOP } from '../prototype/data/artsRhythmWorkshop.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const TASK_DATA_MODULES = new Map([
  [STORY_FOREST_READING_QUEST.activityId, STORY_FOREST_READING_QUEST],
  [ENGLISH_SCENARIO_ADVENTURE.activityId, ENGLISH_SCENARIO_ADVENTURE],
  [ANIMAL_OBSERVATION_EXPLORATION.activityId, ANIMAL_OBSERVATION_EXPLORATION],
  [NEIGHBORHOOD_CHANGE_EXPLORATION.activityId, NEIGHBORHOOD_CHANGE_EXPLORATION],
  [MATH_DATA_TABLE_WORKSHOP.activityId, MATH_DATA_TABLE_WORKSHOP],
  [ARTS_RHYTHM_WORKSHOP.activityId, ARTS_RHYTHM_WORKSHOP],
  ...CATALOG_CANDIDATE_TASKS.map((task) => [task.activityId, task]),
]);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(PROJECT_ROOT, 'curriculum', 'learning-map.json');
const SUBJECTS = SUBJECT_DEFINITIONS.map(({ subjectId, learningMapSubjectId, name }) => ({
  subjectId: learningMapSubjectId,
  label: name,
  runtimeSubjectId: subjectId,
}));
const GRADES = ['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'];
const PROTOTYPE_DATA_STATUS = new Map([
  ['math-place-value-demo', { datasetStatus: demoQuestionSet.datasetStatus, dataKind: 'question_set', count: demoQuestionSet.questions.length }],
  ['number-secret-challenge', { datasetStatus: numberSecretChallenge.datasetStatus, dataKind: 'question_set', count: numberSecretChallenge.questions.length }],
  ['math-number-comparison-candidate', { datasetStatus: numberComparisonQuestionSet.datasetStatus, dataKind: 'question_set', count: numberComparisonQuestionSet.questions.length }],
  ['math-capacity-candidate', { datasetStatus: 'prototype_pending_teacher_review', dataKind: 'interaction_scenarios', count: CAPACITY_OBSERVATION_SCENARIOS.length }],
  [MILLIMETER_RULER_LEARNING_UNIT.levelId, { datasetStatus: 'candidate_pending_teacher_review', dataKind: 'candidate_question_set', count: MILLIMETER_RULER_LEARNING_UNIT.questions.length }],
  [WEIGHT_KG_G_LEARNING_UNIT.levelId, { datasetStatus: 'candidate_pending_teacher_review', dataKind: 'candidate_question_set', count: WEIGHT_KG_G_LEARNING_UNIT.questions.length }],
  [SQUARE_CENTIMETER_AREA_LEARNING_UNIT.levelId, { datasetStatus: 'candidate_pending_teacher_review', dataKind: 'candidate_question_set', count: SQUARE_CENTIMETER_AREA_LEARNING_UNIT.questions.length }],
  [FRACTION_TREASURE_LEARNING_UNIT.levelId, { datasetStatus: 'candidate_pending_teacher_review', dataKind: 'candidate_question_set', count: FRACTION_TREASURE_LEARNING_UNIT.questions.length }],
]);
const ACTIVITY_IDEAS = new Map([
  ['N-3-1', ['representation_matching', 'place_value_puzzle']],
  ['N-3-2', ['operation_path_choice']],
  ['N-3-3', ['array_model_matching']],
  ['N-3-4', ['equal_grouping_model']],
  ['N-3-5', ['division_model_matching']],
  ['N-3-6', ['unknown_box_story']],
  ['N-3-7', ['two_step_route_planning']],
  ['N-3-8', ['estimate_then_check']],
  ['N-3-9', ['fraction_model_matching']],
  ['N-3-10', ['decimal_place_matching']],
  ['N-3-11', ['number_line_placement']],
  ['N-3-12', ['measurement_tool_reading']],
  ['N-3-13', ['angle_observation']],
  ['N-3-14', ['area_unit_covering']],
  ['N-3-15', ['capacity_measurement_simulation', 'graduated_scale_reading']],
  ['N-3-16', ['weight_scale_reading']],
  ['N-3-17', ['clock_and_time_sequence']],
  ['S-3-2', ['shape_feature_sorting']],
  ['S-3-3', ['circle_feature_identification']],
  ['S-3-4', ['shape_composition_and_unfolding']],
  ['R-3-1', ['inverse_operation_matching']],
  ['R-3-2', ['pattern_continuation']],
  ['D-3-1', ['data_table_reading']],
  ['5-Ⅱ-7', ['text_evidence_selection']],
  ['5-Ⅱ-4', ['passage_idea_matching']],
  ['po-Ⅱ-1', ['observation_clue_sorting']],
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8'));
}

function idsForSubject() {
  return SUBJECTS.map(({ subjectId }) => subjectId);
}

function createSemester(gradeNumber, semesterNumber) {
  const gradeId = `grade-${gradeNumber}`;
  return {
    semesterId: `${gradeId}-semester-${semesterNumber}`,
    semesterNumber,
    name: semesterNumber === 1 ? '上學期' : '下學期',
    sequenceStatus: 'pending_school_and_textbook_evidence',
    subjects: SUBJECTS.map(({ subjectId }) => ({
      subjectId,
      chapterRefs: [],
      placementStatus: 'pending_school_and_textbook_evidence',
    })),
  };
}

function createChapter(scopeItem, source, curriculumMap) {
  const mapEntry = [
    ...(curriculumMap.verifiedLearningFocuses ?? []),
    ...(curriculumMap.supplementalVerifiedLearningFocuses ?? []),
    ...(curriculumMap.pendingLearningFocuses ?? []),
    ...(curriculumMap.designLabels ?? []),
  ].find((entry) => entry.id === scopeItem.curriculumMapId) ?? null;
  const contentCodes = (scopeItem.officialCurriculum?.learningContentCodes ?? []).map(({ code }) => code);
  const performanceCodes = (scopeItem.officialCurriculum?.learningPerformanceCodes ?? []).map(({ code }) => code);
  const codeKeys = [...contentCodes, ...performanceCodes];
  const activityTypes = [...new Set(codeKeys.flatMap((code) => ACTIVITY_IDEAS.get(code) ?? []))];
  if (!activityTypes.length && scopeItem.subject === 'chinese_language') activityTypes.push('text_comprehension_activity');
  if (!activityTypes.length && scopeItem.subject === 'natural_science') activityTypes.push('observation_and_evidence_activity');
  const sourceRecord = (source.sources ?? []).find(({ id }) => id === scopeItem.officialCurriculum?.sourceId) ?? null;

  return {
    chapterId: `chapter-${scopeItem.scopeItemId}`,
    gradeId: 'grade-3',
    subjectId: scopeItem.subject,
    title: scopeItem.learningTheme,
    recordStatus: 'candidate_scope_inventory_not_approved_unit',
    sourceRefs: {
      gradeScopeDataset: 'grade3-year-scope.json',
      scopeItemId: scopeItem.scopeItemId,
      curriculumMapId: scopeItem.curriculumMapId,
    },
    learningPurpose: {
      text: scopeItem.learningFocusSummary,
      basis: 'existing_project_scope_summary',
      approvalStatus: 'pending_professional_review',
    },
    coreLearningPoints: {
      curriculumMapRef: scopeItem.curriculumMapId,
      contentCodes,
      performanceCodes,
      mapStatus: mapEntry?.status ?? 'missing_map_entry',
    },
    prerequisiteKnowledge: { status: 'not_assessed', items: [] },
    expectedLearningOutcomes: {
      status: 'criteria_not_yet_defined',
      sourceStatementRef: `${scopeItem.scopeItemId}.learningFocusSummary`,
      measurableCriteria: [],
    },
    gameDesign: {
      status: 'design_suggestion_only',
      candidateActivityTypes: activityTypes,
      formalCurriculumCodesClaimedByActivity: false,
    },
    learningCheck: { status: 'not_designed', checks: [] },
    errorDiagnosis: { status: 'not_designed', diagnosisRules: [] },
    reviewAndRemediation: { status: 'not_designed', reviewActivities: [], reinforcementActivities: [] },
    semesterPlacement: { semesterId: null, status: 'pending_school_and_textbook_evidence', weeks: null },
    evidence: {
      officialCurriculum: {
        sourceId: scopeItem.officialCurriculum?.sourceId ?? null,
        documentTitle: scopeItem.officialCurriculum?.documentTitle ?? null,
        sourceUrl: scopeItem.officialCurriculum?.sourceUrl ?? null,
        sourceRegistryReviewStatus: sourceRecord?.reviewStatus ?? 'source_not_registered',
        officialTextReviewStatus: scopeItem.officialCurriculum?.officialTextReview?.status ?? 'not_recorded',
        officialLocation: scopeItem.officialCurriculum?.location ?? null,
        codeTypes: { learningContent: contentCodes, learningPerformance: performanceCodes },
        mapReviewStatus: mapEntry?.status ?? 'missing_map_entry',
        gradeApplicabilityStatus: scopeItem.gradeApplicability?.status ?? 'not_established',
      },
      textbook: {
        status: scopeItem.textbookMappingStatus ?? 'pending_review',
        mappings: scopeItem.textbookMappings ?? [],
      },
      teacherProfessionalReviewStatus: scopeItem.teacherProfessionalReviewStatus ?? 'pending_review',
      classroomTeaching: { status: 'not_recorded', records: [] },
      missingEvidence: scopeItem.missingEvidence ?? [],
      reviewerSignoff: null,
    },
    formalUnitRef: null,
    formalQuestionRefs: [],
  };
}

function createGrade(gradeNumber, scopeData, source, curriculumMap) {
  const scopeItems = scopeData.items ?? [];
  const gradeId = `grade-${gradeNumber}`;
  const isGradeThree = gradeNumber === 3;
  const chapterItems = isGradeThree
    ? scopeItems.filter((item) => item.scopeItemId !== 'scope-m3-math-broad-scope')
    : [];
  const chapters = chapterItems.map((item) => createChapter(item, source, curriculumMap));
  const scopeGaps = isGradeThree
    ? scopeItems.filter((item) => item.scopeItemId === 'scope-m3-math-broad-scope').map((item) => ({
      scopeItemId: item.scopeItemId,
      subjectId: item.subject,
      status: 'unresolved_not_a_chapter',
      reason: '概括性待拆解項目沒有可核對的正式代碼，不轉成學習章節。',
    }))
    : [];
  return {
    gradeId,
    gradeNumber,
    name: GRADES[gradeNumber - 1],
    developmentStatus: isGradeThree ? 'partial_detailed_scope_skeleton' : 'structure_only_preparation',
    annualGoalStatus: isGradeThree ? 'partial_scope_objectives_only_full_year_synthesis_pending' : 'pending_full_grade_curriculum_review',
    annualGoals: chapters.map((chapter) => ({
      goalId: `goal-${chapter.sourceRefs.scopeItemId}`,
      subjectId: chapter.subjectId,
      statement: chapter.learningPurpose.text,
      scopeItemRef: chapter.sourceRefs.scopeItemId,
      chapterRef: chapter.chapterId,
      status: 'candidate_scope_summary_not_teacher_approved',
    })),
    semesters: [createSemester(gradeNumber, 1), createSemester(gradeNumber, 2)],
    subjects: SUBJECTS.map(({ subjectId }) => ({
      subjectId,
      frameworkStatus: 'national_framework_entry_recorded_grade_scope_not_inferred',
      curriculumApplicabilityStatus: isGradeThree && chapters.some(({ subjectId: chapterSubjectId }) => chapterSubjectId === subjectId)
        ? 'partial_scope_inventory_grade_scope_review_pending'
        : 'pending_grade_specific_official_scope_review',
      courseContentStatus: isGradeThree && chapters.some(({ subjectId: chapterSubjectId }) => chapterSubjectId === subjectId)
        ? 'partial_scope_inventory_no_complete_course_claim'
        : 'not_built',
      annualChapterRefs: chapters.filter((chapter) => chapter.subjectId === subjectId).map(({ chapterId }) => chapterId),
    })),
    annualChapterInventory: {
      status: isGradeThree ? 'partial_inventory_from_existing_grade3_scope' : 'not_started',
      chapterRefs: chapters.map(({ chapterId }) => chapterId),
      chapterCatalog: chapters,
      unresolvedScopeItems: scopeGaps,
      coverageGapRefs: isGradeThree ? (scopeData.coverageGaps ?? []).map(({ id }) => id) : [],
    },
    existingPrototypeReferences: isGradeThree
      ? MATH_LEVEL_DIRECTORY.map((level) => {
        const mapIds = [...(level.curriculumReferences?.curriculumMapIds ?? [])];
        const refs = chapters
          .filter((chapter) => mapIds.includes(chapter.sourceRefs.curriculumMapId))
          .map(({ chapterId }) => chapterId);
        return {
          levelId: level.levelId,
          title: level.title,
          entryKind: level.entryKind,
          runtimeAvailability: level.runtime.availability,
          unlockCondition: level.runtime.unlockCondition,
          curriculumMapIds: mapIds,
          chapterRefs: refs,
          traceabilityStatus: mapIds.length ? 'prototype_reference_not_curriculum_or_teacher_approval' : 'curriculum_mapping_pending',
          curriculumEvidenceStatus: level.curriculumEvidenceStatus,
          teacherReviewStatus: level.teacherReviewStatus,
          publicationStatus: level.publicationStatus,
          questionCount: level.questionCount,
          questionData: PROTOTYPE_DATA_STATUS.get(level.levelId) ?? { datasetStatus: 'no_question_data', dataKind: 'none', count: 0 },
          progressStorage: 'existing prototype progress untouched; no new curriculum progress storage implemented',
        };
      })
      : [],
    sourceRefs: isGradeThree ? {
      gradeScopeDataset: 'grade3-year-scope.json',
      curriculumMap: 'curriculum-map.json',
      sourceRegistry: 'sources.json',
    } : null,
  };
}

export function buildLearningMap({ sources, curriculumMap, grade3YearScope } = {}) {
  const sourceData = sources ?? readJson('curriculum/sources.json');
  const mapData = curriculumMap ?? readJson('curriculum/curriculum-map.json');
  const scopeData = grade3YearScope ?? readJson('curriculum/grade3-year-scope.json');
  return {
    schemaVersion: 1,
    datasetId: 'elementary-grade-learning-map',
    datasetStatus: 'elementary_framework_indexed_grade_specific_scope_partial_other_grades_structure_only',
    publisherStrategy: 'publisher_neutral_core_with_separate_publisher_mappings',
    designBoundary: {
      formalCurriculumDomainIds: idsForSubject(),
      formalCurriculumScopeStatus: 'framework_entries_indexed_grade_specific_content_not_complete',
      thinkingSkillsAreFormalSubject: false,
      officialTextReviewIsTeacherApproval: false,
      curriculumMapVerificationIsClassroomTeachingEvidence: false,
      semesterOrderMayBeAssignedOnlyWithEvidence: true,
      gameCompletionOrStarsProveChapterMastery: false,
      stage0Status: 'not_passed',
    },
    progressModel: {
      implementationStatus: 'specification_only_not_implemented',
      states: [
        { id: 'not_started', meaning: '尚未開始' },
        { id: 'in_progress', meaning: '學習中' },
        { id: 'activity_completed', meaning: '活動已完成；只記錄活動事件' },
        { id: 'needs_review', meaning: '需要複習或補強' },
        { id: 'check_passed', meaning: '已通過已定義的學習檢核' },
        { id: 'objective_achieved', meaning: '依經教師核定的學習目標與證據規準判定達成' },
      ],
      recordShape: {
        gradeId: 'string',
        semesterId: 'string|null',
        subjectId: 'string',
        chapterId: 'string',
        state: 'one of states[].id',
        evidenceRefs: 'array; evidence type and source required',
        updatedAt: 'ISO 8601 timestamp or null before implementation',
      },
      masteryPolicy: {
        status: 'criteria_require_teacher_and_assessment_design_review',
        mayInferFromSingleQuestion: false,
        mayInferFromGameCompletionOrStars: false,
        objectiveAchievedRequires: 'approved learning criteria and multiple documented evidence; exact thresholds remain for educators to define',
      },
      persistenceStatus: 'not_implemented_for_curriculum_progress; existing prototype save data is separate and unchanged',
    },
    publisherMappingModel: {
      status: 'schema_only_no_publisher_mapping_claimed',
      fields: ['publisher', 'schoolYear', 'edition', 'grade', 'semester', 'volume', 'unit', 'pages', 'sourceUrl', 'reviewStatus'],
      distinction: '教材章節順序、教師核准、校本課程與班級實際授課紀錄分開保存。',
    },
    grades: Array.from({ length: 6 }, (_, index) => createGrade(index + 1, scopeData, sourceData, mapData)),
    learningObjectiveTaskCrosswalk: LEARNING_TASK_RELATIONS.map((relation) => ({
      gradeId: relation.gradeId,
      subjectId: SUBJECTS.find(({ runtimeSubjectId }) => runtimeSubjectId === relation.subjectId)?.subjectId ?? relation.subjectId,
      curriculumMapIds: [...relation.curriculumMapIds],
      learningObjectiveIds: [...relation.learningObjectiveIds],
      objectiveDefinitions: (relation.objectiveDefinitions ?? []).map((objective) => ({
        objectiveId: objective.objectiveId,
        statement: objective.statement,
        status: objective.status,
        curriculumMapIds: [...objective.curriculumMapIds],
        gradeApplicabilityStatus: objective.gradeApplicabilityStatus,
      })),
      learningObjectiveTaskLinks: relation.learningObjectiveTaskLinks.map((link) => ({
        learningObjectiveId: link.learningObjectiveId,
        taskIds: [...link.taskIds],
      })),
      tasks: relation.tasks.map((task) => ({
        taskId: task.taskId,
        title: task.title ?? null,
        taskKind: task.taskKind,
        levelId: task.levelId,
        runtimeModule: task.runtimeModule ?? null,
        curriculumMapId: task.curriculumMapId ?? null,
        learningObjectiveIds: [...task.learningObjectiveIds],
        evidenceType: task.evidenceType,
        status: task.status,
      })),
      relationshipStatus: relation.relationshipStatus,
    })),
    unitRegistryReferences: readJson('curriculum/unit-registry.json').units.map((unit) => ({
      unitId: unit.unitId,
      revision: unit.revision,
      status: unit.status,
      curriculumMapIds: unit.curriculumMapIds,
      approvalIsNotInferred: true,
    })),
    sourceReviewBoundary: {
      sourceIdsUsed: ['chinese-language', 'english-language', 'mathematics', 'natural-science', 'social-studies'],
      officialFrameworkSource: {
        publisher: '教育部',
        custodian: '國家教育研究院',
        documentTitle: '十二年國民基本教育課程綱要總綱（2022 年 8 月起實施版）',
        sourceUrl: 'https://www.naer.edu.tw/upload/1/16/doc/1325/%28ImplementedfromAug.2022%29GeneralGuidelinesofthe12-yearBasicEducation.pdf',
        verifiedLocations: [
          { table: '表 3 各教育階段領域課程架構', pdfPageOrder: 14, printedPage: 11 },
          { table: '表 4 國民小學及國民中學課程規劃', pdfPageOrder: 15, printedPage: 12 },
        ],
        claimBoundary: '只核實總綱領域／課程架構名稱；詳細領域綱要原文、個別年級內容、教材及授課順序需另核對。',
      },
      note: '本骨架只整理目前專案資料；既有來源核對日期與狀態照原資料保留，本次不重新宣稱已獨立查閱官方文件。',
    },
  };
}

export function validateLearningMap(data, refs = {}) {
  const sources = refs.sources ?? readJson('curriculum/sources.json');
  const curriculumMap = refs.curriculumMap ?? readJson('curriculum/curriculum-map.json');
  const scope = refs.grade3YearScope ?? readJson('curriculum/grade3-year-scope.json');
  const unitRegistry = refs.unitRegistry ?? readJson('curriculum/unit-registry.json');
  const activityMap = refs.learningActivityMap ?? readJson('curriculum/learning-activity-map.json');
  const errors = [];
  const sourceById = new Map((sources.sources ?? []).map((source) => [source.id, source]));
  const sourceDomainById = new Map([
    ['mathematics', 'mathematics'],
    ['chinese-language', 'chinese_language'],
    ['english-language', 'english_language'],
    ['natural-science', 'natural_science'],
    ['social-studies', 'social_studies'],
    ['arts', 'arts'],
  ]);
  const allMapEntries = [
    ...(curriculumMap.verifiedLearningFocuses ?? []),
    ...(curriculumMap.supplementalVerifiedLearningFocuses ?? []),
    ...(curriculumMap.pendingLearningFocuses ?? []),
    ...(curriculumMap.designLabels ?? []),
  ];
  const mapById = new Map(allMapEntries.map((entry) => [entry.id, entry]));
  const scopeById = new Map((scope.items ?? []).map((item) => [item.scopeItemId, item]));

  if (data.schemaVersion !== 1) errors.push('schema_version_unsupported');
  if (data.grades?.length !== 6) errors.push('grade_count_must_be_six');
  if (JSON.stringify(data.designBoundary?.formalCurriculumDomainIds) !== JSON.stringify(idsForSubject())) errors.push('framework_subject_index_mismatch');
  if (data.sourceReviewBoundary?.officialFrameworkSource?.verifiedLocations?.length !== 2) errors.push('official_framework_locations_missing');
  const gradeIds = (data.grades ?? []).map((grade) => grade.gradeId);
  if (new Set(gradeIds).size !== gradeIds.length) errors.push('duplicate_grade_id');
  const chapterIds = [];
  const chaptersById = new Map();

  for (let index = 0; index < (data.grades ?? []).length; index += 1) {
    const grade = data.grades[index];
    if (grade.gradeId !== `grade-${index + 1}` || grade.gradeNumber !== index + 1) errors.push(`grade_order_invalid:${grade.gradeId}`);
    if (grade.semesters?.length !== 2) errors.push(`semester_count_invalid:${grade.gradeId}`);
    const semesterIds = new Set();
    for (const semester of grade.semesters ?? []) {
      if (semesterIds.has(semester.semesterId)) errors.push(`duplicate_semester_id:${semester.semesterId}`);
      semesterIds.add(semester.semesterId);
      if (![1, 2].includes(semester.semesterNumber)) errors.push(`invalid_semester_number:${semester.semesterId}`);
      const subjects = (semester.subjects ?? []).map(({ subjectId }) => subjectId);
      if (new Set(subjects).size !== SUBJECTS.length || SUBJECTS.some(({ subjectId }) => !subjects.includes(subjectId))) {
        errors.push(`semester_subject_structure_invalid:${semester.semesterId}`);
      }
      for (const subject of semester.subjects ?? []) {
        for (const chapterRef of subject.chapterRefs ?? []) {
          const chapter = chaptersById.get(chapterRef);
          if (!chapter) errors.push(`semester_chapter_missing:${semester.semesterId}:${chapterRef}`);
          else if (chapter.subjectId !== subject.subjectId || chapter.gradeId !== grade.gradeId) errors.push(`semester_chapter_subject_mismatch:${chapterRef}`);
        }
      }
    }
    for (const chapter of grade.annualChapterInventory?.chapterCatalog ?? []) {
      chapterIds.push(chapter.chapterId);
      chaptersById.set(chapter.chapterId, chapter);
      if (chapter.gradeId !== grade.gradeId) errors.push(`chapter_grade_mismatch:${chapter.chapterId}`);
      if (chapter.formalUnitRef !== null) errors.push(`unexpected_formal_unit_reference:${chapter.chapterId}`);
      const item = scopeById.get(chapter.sourceRefs?.scopeItemId);
      if (!item) errors.push(`scope_item_missing:${chapter.chapterId}`);
      else {
        if (item.subject !== chapter.subjectId) errors.push(`scope_subject_mismatch:${chapter.chapterId}`);
        if (item.curriculumMapId !== chapter.sourceRefs.curriculumMapId) errors.push(`scope_map_id_mismatch:${chapter.chapterId}`);
        if (chapter.learningPurpose?.text !== item.learningFocusSummary) errors.push(`scope_summary_drift:${chapter.chapterId}`);
      }
      const sourceId = chapter.evidence?.officialCurriculum?.sourceId;
      if (sourceId && !sourceById.has(sourceId)) errors.push(`source_id_missing:${chapter.chapterId}:${sourceId}`);
      if (sourceId && sourceDomainById.get(sourceId) !== chapter.subjectId) errors.push(`source_subject_mismatch:${chapter.chapterId}`);
      const mapId = chapter.sourceRefs?.curriculumMapId;
      if (mapId && !mapById.has(mapId)) errors.push(`curriculum_map_id_missing:${chapter.chapterId}:${mapId}`);
      if (mapId && mapById.has(mapId) && mapById.get(mapId).subject !== chapter.subjectId) errors.push(`curriculum_map_subject_mismatch:${chapter.chapterId}`);
      if (chapter.coreLearningPoints?.curriculumMapRef !== mapId) errors.push(`chapter_core_map_reference_mismatch:${chapter.chapterId}`);
      if (chapter.evidence?.teacherProfessionalReviewStatus !== 'pending_review') errors.push(`teacher_status_must_remain_pending:${chapter.chapterId}`);
      if (chapter.semesterPlacement?.semesterId !== null || chapter.semesterPlacement?.status !== 'pending_school_and_textbook_evidence') errors.push(`semester_order_must_remain_unassigned:${chapter.chapterId}`);
    }
  }
  if (new Set(chapterIds).size !== chapterIds.length) errors.push('duplicate_chapter_id');
  for (const grade of data.grades ?? []) {
    for (const subject of grade.subjects ?? []) {
      for (const chapterRef of subject.annualChapterRefs ?? []) {
        const chapter = chaptersById.get(chapterRef);
        if (!chapter) errors.push(`annual_chapter_missing:${grade.gradeId}:${chapterRef}`);
        else if (chapter.gradeId !== grade.gradeId || chapter.subjectId !== subject.subjectId) errors.push(`annual_chapter_subject_mismatch:${chapterRef}`);
      }
    }
    const goalIds = (grade.annualGoals ?? []).map(({ goalId }) => goalId);
    if (new Set(goalIds).size !== goalIds.length) errors.push(`duplicate_annual_goal_id:${grade.gradeId}`);
    for (const goal of grade.annualGoals ?? []) {
      const chapter = chaptersById.get(goal.chapterRef);
      if (!chapter || chapter.gradeId !== grade.gradeId || chapter.subjectId !== goal.subjectId) errors.push(`annual_goal_chapter_link_invalid:${goal.goalId}`);
      if (chapter && (goal.scopeItemRef !== chapter.sourceRefs.scopeItemId || goal.statement !== chapter.learningPurpose.text)) errors.push(`annual_goal_scope_link_invalid:${goal.goalId}`);
      if (goal.status === 'approved' || goal.status === 'published') errors.push(`annual_goal_must_not_be_approved:${goal.goalId}`);
    }
  }

  const grade3 = data.grades?.find(({ gradeId }) => gradeId === 'grade-3');
  const expectedGrade3Items = (scope.items ?? []).filter((item) => item.scopeItemId !== 'scope-m3-math-broad-scope');
  const grade3ChapterScopeIds = (grade3?.annualChapterInventory?.chapterCatalog ?? []).map((chapter) => chapter.sourceRefs.scopeItemId);
  for (const item of expectedGrade3Items) if (!grade3ChapterScopeIds.includes(item.scopeItemId)) errors.push(`grade3_scope_item_unrepresented:${item.scopeItemId}`);
  for (const scopeItemId of grade3ChapterScopeIds) if (!expectedGrade3Items.some((item) => item.scopeItemId === scopeItemId)) errors.push(`unexpected_grade3_scope_item:${scopeItemId}`);
  if (grade3?.annualChapterInventory?.unresolvedScopeItems?.some(({ scopeItemId }) => scopeItemId !== 'scope-m3-math-broad-scope')) errors.push('unexpected_unresolved_scope_item');
  const knownGapIds = new Set((scope.coverageGaps ?? []).map(({ id }) => id));
  for (const gapId of grade3?.annualChapterInventory?.coverageGapRefs ?? []) if (!knownGapIds.has(gapId)) errors.push(`coverage_gap_missing:${gapId}`);

  for (const unitRef of data.unitRegistryReferences ?? []) {
    const actual = unitRegistry.units?.find((unit) => unit.unitId === unitRef.unitId);
    if (!actual || actual.revision !== unitRef.revision || actual.status !== unitRef.status) errors.push(`unit_registry_reference_mismatch:${unitRef.unitId}`);
    if (unitRef.status === 'approved') errors.push(`unit_must_not_be_auto_approved:${unitRef.unitId}`);
    for (const mapId of unitRef.curriculumMapIds ?? []) if (!mapById.has(mapId)) errors.push(`unit_curriculum_map_id_missing:${unitRef.unitId}:${mapId}`);
  }
  const taskRelations = data.learningObjectiveTaskCrosswalk ?? [];
  const actualActivityById = new Map((activityMap.activities ?? []).map((activity) => [activity.activityId, activity]));
  const runtimeLearningUnit = activityMap.runtimeLearningUnitPrototype;
  const objectiveIds = new Set((readJson('curriculum/learning-objectives.json').learningUnits ?? [])
    .flatMap((unit) => unit.observableOutcomes?.candidateObjectives ?? [])
    .map(({ objectiveId }) => objectiveId));
  for (const relation of taskRelations) {
    if (!data.grades?.some(({ gradeId }) => gradeId === relation.gradeId)) errors.push(`task_crosswalk_grade_missing:${relation.gradeId}`);
    if (!SUBJECTS.some(({ subjectId }) => subjectId === relation.subjectId)) errors.push(`task_crosswalk_subject_missing:${relation.subjectId}`);
    const relationObjectiveDefinitions = new Map((relation.objectiveDefinitions ?? []).map((objective) => [objective.objectiveId, objective]));
    for (const objectiveId of relation.learningObjectiveIds ?? []) {
      if (!objectiveIds.has(objectiveId) && !relationObjectiveDefinitions.has(objectiveId)) errors.push(`task_crosswalk_objective_missing:${objectiveId}`);
      const definition = relationObjectiveDefinitions.get(objectiveId);
      if (definition && (definition.status !== 'candidate_pending_teacher_review' || !definition.statement || definition.curriculumMapIds?.some((mapId) => !mapById.has(mapId)))) errors.push(`task_crosswalk_candidate_objective_invalid:${objectiveId}`);
      for (const mapId of definition?.curriculumMapIds ?? []) {
        const curriculum = mapById.get(mapId);
        if (!curriculum || curriculum.subject !== relation.subjectId) errors.push(`task_crosswalk_candidate_objective_subject_mismatch:${objectiveId}`);
      }
    }
    const taskIds = new Set((relation.tasks ?? []).map(({ taskId }) => taskId));
    if (taskIds.size !== (relation.tasks ?? []).length) errors.push(`task_crosswalk_duplicate_task:${relation.gradeId}:${relation.subjectId}`);
    for (const link of relation.learningObjectiveTaskLinks ?? []) {
      if (!relation.learningObjectiveIds?.includes(link.learningObjectiveId)) errors.push(`task_crosswalk_link_objective_missing:${link.learningObjectiveId}`);
      if (!link.taskIds?.length || link.taskIds.some((taskId) => !taskIds.has(taskId))) errors.push(`task_crosswalk_link_task_missing:${link.learningObjectiveId}`);
    }
    for (const task of relation.tasks ?? []) {
      const activity = actualActivityById.get(task.taskId);
      const runtimeMatch = runtimeLearningUnit?.learningUnitId === task.taskId;
      const candidateActivity = TASK_DATA_MODULES.get(task.taskId);
      const catalogTaskMatch = Boolean(candidateActivity
        && task.runtimeModule
        && task.curriculumMapId === candidateActivity.curriculumMapId
        && task.status === 'playable_candidate_pending_teacher_review'
        && candidateActivity.status === 'candidate_pending_teacher_review');
      if (!activity && !runtimeMatch && !catalogTaskMatch) errors.push(`task_crosswalk_task_missing:${task.taskId}`);
      const actualObjectives = activity?.learningObjectiveIds ?? (runtimeMatch ? runtimeLearningUnit.learningObjectiveIds : catalogTaskMatch ? [candidateActivity.learningObjective.objectiveId] : []);
      if (JSON.stringify(task.learningObjectiveIds) !== JSON.stringify(actualObjectives)) errors.push(`task_crosswalk_objective_drift:${task.taskId}`);
      if (!task.evidenceType || /mastery|objective_achieved|formal_score/i.test(task.evidenceType)) errors.push(`task_crosswalk_evidence_boundary_invalid:${task.taskId}`);
      if (task.status === 'approved' || task.status === 'published') errors.push(`task_crosswalk_must_remain_candidate:${task.taskId}`);
    }
  }
  for (const activity of grade3?.existingPrototypeReferences ?? []) {
    const directoryEntry = MATH_LEVEL_DIRECTORY.find(({ levelId }) => levelId === activity.levelId);
    if (!directoryEntry) errors.push(`prototype_level_missing:${activity.levelId}`);
    else {
      if (activity.publicationStatus !== directoryEntry.publicationStatus) errors.push(`prototype_publication_status_drift:${activity.levelId}`);
      if (JSON.stringify(activity.unlockCondition) !== JSON.stringify(directoryEntry.runtime.unlockCondition)) errors.push(`prototype_unlock_condition_drift:${activity.levelId}`);
      if (JSON.stringify(activity.curriculumMapIds) !== JSON.stringify(directoryEntry.curriculumReferences.curriculumMapIds)) errors.push(`prototype_map_reference_drift:${activity.levelId}`);
    }
    const expectedQuestionData = PROTOTYPE_DATA_STATUS.get(activity.levelId) ?? { datasetStatus: 'no_question_data', dataKind: 'none', count: 0 };
    if (JSON.stringify(activity.questionData) !== JSON.stringify(expectedQuestionData)) errors.push(`prototype_question_data_status_drift:${activity.levelId}`);
    for (const chapterRef of activity.chapterRefs ?? []) if (!chaptersById.has(chapterRef)) errors.push(`prototype_chapter_missing:${activity.levelId}:${chapterRef}`);
  }
  if (grade3?.existingPrototypeReferences?.length !== MATH_LEVEL_DIRECTORY.length) errors.push('prototype_directory_count_mismatch');
  if (data.designBoundary?.stage0Status !== 'not_passed') errors.push('stage0_status_must_remain_not_passed');
  if (data.progressModel?.implementationStatus !== 'specification_only_not_implemented') errors.push('student_progress_must_remain_unimplemented');
  const progressStates = (data.progressModel?.states ?? []).map(({ id }) => id);
  const requiredProgressStates = ['not_started', 'in_progress', 'activity_completed', 'needs_review', 'check_passed', 'objective_achieved'];
  if (requiredProgressStates.some((state) => !progressStates.includes(state))) errors.push('required_progress_state_missing');
  if (data.progressModel?.masteryPolicy?.mayInferFromSingleQuestion !== false || data.progressModel?.masteryPolicy?.mayInferFromGameCompletionOrStars !== false) {
    errors.push('mastery_must_not_be_inferred_from_game_or_single_question');
  }
  return errors;
}

function main() {
  if (process.argv.includes('--build')) {
    const map = buildLearningMap();
    const errors = validateLearningMap(map);
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(DATA_PATH, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
    console.log(`Built ${path.relative(PROJECT_ROOT, DATA_PATH)} (${map.grades.length} grades).`);
    return;
  }
  const current = readJson('curriculum/learning-map.json');
  const generated = buildLearningMap();
  const errors = validateLearningMap(current);
  if (JSON.stringify(current) !== JSON.stringify(generated)) errors.push('learning_map_is_stale_run_node_scripts_learning_map_mjs_--build');
  if (errors.length) {
    console.error(errors.map((error) => `FAIL ${error}`).join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`PASS learning map: 6 grades, 12 semester slots, ${SUBJECTS.length} subjects per term, ${current.grades[2].annualChapterInventory.chapterCatalog.length} grade 3 scope entries.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
