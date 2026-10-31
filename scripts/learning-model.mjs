import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL_PATH = path.join(ROOT, 'curriculum', 'learning-objectives.json');
const PROGRESS_PATH = path.join(ROOT, 'curriculum', 'student-progress-model.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const TARGETED_CANDIDATE_OBJECTIVES = new Map([
  ['chapter-scope-m3-math-number-place-value', [
    {
      objectiveId: 'LO-M3-NUM-PLACE-VALUE-01',
      statement: '在 3,000 中辨認數字 3 位於千位，並說出它表示 3 個千。',
      linkedQuestionIds: ['secret-thousands-01'],
      alignmentNote: '與現有 N-3-1 範圍摘要相近；逐題與年級適切性仍待教師審查。',
    },
    {
      objectiveId: 'LO-M3-NUM-PLACE-VALUE-02',
      statement: '將 4 個千的數量表徵連結為數字 4,000。',
      linkedQuestionIds: ['secret-thousands-02'],
      alignmentNote: '概念連結屬候選解讀；教材呈現、先備能力與課綱對應待教師審查。',
    },
    {
      objectiveId: 'LO-M3-NUM-PLACE-VALUE-03',
      statement: '把 2,000 與 500 合成 2,500。',
      linkedQuestionIds: ['secret-thousands-03'],
      alignmentNote: '題目同時涉及數量合成／加法；不能只因位值單元名稱便推定直接受 N-3-1 支持，須另行審查。',
    },
  ]],
]);
const allMapEntries = (map) => [
  ...(map.verifiedLearningFocuses ?? []),
  ...(map.pendingLearningFocuses ?? []),
  ...(map.designLabels ?? []),
];

export function createLearningObjectives({ learningMap, gradeScope, curriculumMap, sources, unitRegistry, asOfDate = new Date().toISOString().slice(0, 10) }) {
  const grade = learningMap.grades.find((item) => item.gradeNumber === 3);
  if (!grade) throw new Error('learning-map.json 缺少三年級資料');
  const mapById = new Map(allMapEntries(curriculumMap).map((item) => [item.id, item]));
  const registryByMapId = new Map((unitRegistry.units ?? []).flatMap((unit) => (unit.curriculumMapIds ?? []).map((id) => [id, unit])));

  const learningUnits = grade.annualChapterInventory.chapterCatalog.map((chapter) => {
    const mapEntry = chapter.sourceRefs.curriculumMapId ? mapById.get(chapter.sourceRefs.curriculumMapId) : null;
    const curriculum = chapter.evidence.officialCurriculum;
    const contentCodes = chapter.coreLearningPoints.contentCodes ?? [];
    const performanceCodes = chapter.coreLearningPoints.performanceCodes ?? [];
    const allCodes = [
      ...contentCodes.map((code) => ({ code, codeType: 'learning_content' })),
      ...performanceCodes.map((code) => ({ code, codeType: 'learning_performance' })),
    ];
    const mappedUnit = chapter.sourceRefs.curriculumMapId ? registryByMapId.get(chapter.sourceRefs.curriculumMapId) : null;
    const targetedObjectives = TARGETED_CANDIDATE_OBJECTIVES.get(chapter.chapterId);
    const candidateObjectives = (targetedObjectives ?? [{
      statement: chapter.learningPurpose.text,
      linkedQuestionIds: [],
      alignmentNote: '沿用既有章節摘要作為候選陳述，沒有教師核定的可觀察規準。',
    }]).map((objective, index) => ({
      objectiveId: objective.objectiveId ?? `LO:${chapter.chapterId}:${String(index + 1).padStart(2, '0')}`,
      statement: objective.statement,
      basis: targetedObjectives ? 'existing_prototype_question_content_analysis' : chapter.learningPurpose.basis,
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: chapter.sourceRefs.curriculumMapId ? [chapter.sourceRefs.curriculumMapId] : [],
      curriculumAlignmentStatus: 'pending_teacher_review',
      linkedQuestionIds: objective.linkedQuestionIds,
      observableCriteria: [],
      alignmentNote: objective.alignmentNote,
    }));

    return {
      learningUnitId: `learning-unit:${chapter.chapterId}`,
      revision: 1,
      gradeId: chapter.gradeId,
      gradeNumber: 3,
      semesterId: chapter.semesterPlacement.semesterId,
      semesterStatus: chapter.semesterPlacement.status,
      subjectId: chapter.subjectId,
      chapterId: chapter.chapterId,
      chapterTitle: chapter.title,
      sourceRefs: {
        learningMapDataset: learningMap.datasetId,
        chapterId: chapter.chapterId,
        gradeScopeDataset: chapter.sourceRefs.gradeScopeDataset,
        scopeItemId: chapter.sourceRefs.scopeItemId,
        curriculumMapIds: chapter.sourceRefs.curriculumMapId ? [chapter.sourceRefs.curriculumMapId] : [],
      },
      formalUnitRef: mappedUnit ? {
        unitId: mappedUnit.unitId,
        unitRevision: mappedUnit.revision,
        unitStatus: mappedUnit.status,
        note: '正式單元登錄參照；不代表此學習目標或題目已核准。',
      } : null,
      officialCurriculum: {
        sourceId: curriculum.sourceId,
        documentTitle: curriculum.documentTitle,
        sourceUrl: curriculum.sourceUrl,
        codeRefs: allCodes.map(({ code, codeType }) => ({
          code,
          codeType,
          location: curriculum.officialLocation,
        })),
        officialTextReviewStatus: curriculum.officialTextReviewStatus,
        mapReviewStatus: curriculum.mapReviewStatus,
        gradeApplicabilityStatus: curriculum.gradeApplicabilityStatus,
        sourceRegistryReviewStatus: curriculum.sourceRegistryReviewStatus,
        claimBoundary: '保留既有專案記錄狀態；階段指標、三年級全年分配及教師核准彼此分開。',
      },
      learningFocus: {
        summary: chapter.learningPurpose.text,
        basis: chapter.learningPurpose.basis,
        approvalStatus: chapter.learningPurpose.approvalStatus,
        curriculumMapStatus: mapEntry?.status ?? chapter.coreLearningPoints.mapStatus,
      },
      learningPurpose: {
        candidatePurpose: chapter.learningPurpose.text,
        status: 'pending_professional_review',
      },
      coreLearningPoints: {
        curriculumMapId: chapter.coreLearningPoints.curriculumMapRef,
        contentCodes,
        performanceCodes,
        status: chapter.coreLearningPoints.mapStatus,
      },
      prerequisites: { status: 'not_assessed', items: [] },
      observableOutcomes: {
        status: 'pending_teacher_review',
        candidateStatement: chapter.expectedLearningOutcomes.sourceStatementRef ? chapter.learningPurpose.text : null,
        sourceStatementRef: chapter.expectedLearningOutcomes.sourceStatementRef,
        candidateObjectives,
        measurableCriteria: [],
        note: '尚無教師核定的可觀察成果與達標門檻。',
      },
      learningActivities: {
        status: chapter.gameDesign.status,
        suggestedActivityTypes: [...chapter.gameDesign.candidateActivityTypes],
        linkedFormalLevelIds: [],
      },
      learningCheck: {
        status: 'not_designed',
        methods: [],
        passCriteria: null,
        evidenceRequirements: [],
      },
      commonErrors: { status: 'not_collected', items: [] },
      errorDiagnosis: { status: 'not_designed', rules: [] },
      reinforcement: { status: 'not_designed', activities: [] },
      evidence: {
        textbook: { status: chapter.evidence.textbook.status, records: [] },
        schoolSchedule: { status: chapter.semesterPlacement.status, semesterId: chapter.semesterPlacement.semesterId, weeks: null },
        classroomTeaching: { status: chapter.evidence.classroomTeaching.status, records: [] },
        teacherProfessionalReview: { status: chapter.evidence.teacherProfessionalReviewStatus, records: [] },
        missingEvidence: [...chapter.evidence.missingEvidence],
      },
      review: {
        dataStatus: 'draft',
        teacherReviewStatus: 'pending_review',
        reviewRecords: [],
      },
      updateHistory: [{
        revision: 1,
        date: asOfDate,
        actorRole: '資料模型建置',
        changeSummary: '依現有三年級學習地圖建立候選目標欄位；未新增課綱主張、學期安排或教師審查。',
      }],
    };
  });

  return {
    schemaVersion: 1,
    datasetId: 'chapter-learning-objectives',
    datasetStatus: 'draft_model_grade3_existing_scope_only',
    generatedAt: asOfDate,
    scope: { grades: [3], chapterCount: learningUnits.length, otherGrades: '未建立目標內容；參照 learning-map.json 架構空槽。' },
    boundaries: {
      learningUnitIdIsNotFormalUnitId: true,
      curriculumDefinitionsAreSeparateFromStudentProgress: true,
      officialSourceReviewDoesNotImplyGradeScheduleOrTeacherApproval: true,
      gameCompletionStarsBadgesAndScoreAreNotMasteryEvidence: true,
      stage0Status: learningMap.designBoundary.stage0Status,
    },
    learningUnits,
  };
}

export function createStudentProgressModel() {
  const states = [
    { id: 'not_started', meaning: '尚未開始；沒有本章學習活動紀錄。', requiredEvidence: [] },
    { id: 'in_progress', meaning: '學習中；已有開始學習或補強活動的紀錄。', requiredEvidence: ['learning_activity_started'] },
    { id: 'activity_completed', meaning: '活動已完成；只表示指定活動完成，不表示檢核通過。', requiredEvidence: ['learning_activity_completed'] },
    { id: 'needs_review', meaning: '需要複習；檢核未通過、表現不穩或教師判定需補強。', requiredEvidence: ['learning_check_result', 'teacher_observation', 'learner_request'] },
    { id: 'check_passed', meaning: '已通過一項已核定的學習檢核；不等同長期掌握或目標達成。', requiredEvidence: ['approved_learning_check_result'] },
    { id: 'objective_achieved', meaning: '依教師核定的成果規準及多次可追溯證據判定已達成學習目標。', requiredEvidence: ['approved_objective_criteria', 'multiple_learning_evidence', 'educator_review'] },
  ];
  const transitions = [
    { from: 'not_started', to: 'in_progress', requires: ['learning_activity_started'] },
    { from: 'in_progress', to: 'activity_completed', requires: ['learning_activity_completed'] },
    { from: 'in_progress', to: 'needs_review', requires: ['learning_check_result', 'teacher_observation', 'learner_request'] },
    { from: 'activity_completed', to: 'in_progress', requires: ['learning_activity_started'] },
    { from: 'activity_completed', to: 'needs_review', requires: ['learning_check_result', 'teacher_observation'] },
    { from: 'activity_completed', to: 'check_passed', requires: ['approved_learning_check_result'] },
    { from: 'needs_review', to: 'in_progress', requires: ['reinforcement_activity_started'] },
    { from: 'needs_review', to: 'check_passed', requires: ['approved_learning_check_result'] },
    { from: 'check_passed', to: 'needs_review', requires: ['later_learning_check_result', 'teacher_observation'] },
    { from: 'check_passed', to: 'objective_achieved', requires: ['approved_objective_criteria', 'multiple_learning_evidence', 'educator_review'] },
    { from: 'objective_achieved', to: 'needs_review', requires: ['later_learning_check_result', 'teacher_observation'] },
  ];
  return {
    schemaVersion: 1,
    modelId: 'student-chapter-learning-progress',
    implementationStatus: 'specification_only_not_implemented',
    records: [],
    recordSchema: {
      recordId: 'string; 每筆紀錄唯一且不可重用',
      learnerRef: 'string; 不透明假名參照，不得存姓名、聯絡方式或其他直接識別資料',
      learningUnitId: 'string; 必須引用 learning-objectives.json 中的學習單元',
      learningUnitRevision: 'positive integer; 固定指向實際存在的學習單元 revision',
      gradeId: 'string',
      semesterId: 'string|null; 無校本證據時為 null',
      subjectId: 'string',
      chapterId: 'string',
      state: 'states[].id',
      stateHistory: 'array of {from,to,changedAt,evidenceRefs}; 每次轉換追加，不覆寫歷史',
      evidenceRefs: 'array of {evidenceId,type,recordedAt,sourceRef}; 每個狀態轉換都須能追溯',
      updatedAt: 'ISO 8601 timestamp',
    },
    states,
    transitions,
    evidencePolicy: {
      permittedTypes: ['learning_activity_started', 'learning_activity_completed', 'learning_check_result', 'approved_learning_check_result', 'reinforcement_activity_started', 'teacher_observation', 'learner_request', 'later_learning_check_result', 'approved_objective_criteria', 'multiple_learning_evidence', 'educator_review'],
      gameSignalsAloneAreInsufficient: ['score', 'stars', 'badge', 'level_completion'],
      checkPassedIsNotObjectiveAchieved: true,
      objectiveAchievedThreshold: '由教育專業人員依核定成果規準決定；本規格不預設題數、比例或間隔。',
      appendOnlyHistory: true,
      noRealStudentRecordsCreated: true,
    },
  };
}

export function validateLearningObjectives(dataset, { learningMap, gradeScope, curriculumMap, sources, unitRegistry }) {
  const errors = [];
  const chapters = learningMap.grades.find((grade) => grade.gradeNumber === 3)?.annualChapterInventory.chapterCatalog ?? [];
  const chapterIds = new Set(chapters.map((chapter) => chapter.chapterId));
  const scopeIds = new Set(gradeScope.items.map((item) => item.scopeItemId));
  const sourceIds = new Set(sources.sources.map((source) => source.id));
  const mapIds = new Set(allMapEntries(curriculumMap).map((item) => item.id));
  const unitRefs = new Map((unitRegistry.units ?? []).map((unit) => [unit.unitId, unit]));
  const objectiveIds = new Set();
  const candidateObjectiveIds = new Set();
  const chapterRefs = new Set();

  if (!Array.isArray(dataset.learningUnits)) return ['learningUnits must be an array'];
  for (const unit of dataset.learningUnits) {
    const label = unit.learningUnitId ?? '(missing learningUnitId)';
    if (!unit.learningUnitId || objectiveIds.has(unit.learningUnitId)) errors.push(`${label}: missing or duplicate learningUnitId`);
    objectiveIds.add(unit.learningUnitId);
    if (!Number.isInteger(unit.revision) || unit.revision < 1) errors.push(`${label}: revision must be a positive integer`);
    if (!chapterIds.has(unit.chapterId) || chapterRefs.has(unit.chapterId)) errors.push(`${label}: chapterId missing, unknown, or duplicated`);
    chapterRefs.add(unit.chapterId);
    if (!scopeIds.has(unit.sourceRefs?.scopeItemId)) errors.push(`${label}: unknown scopeItemId`);
    if (unit.sourceRefs?.curriculumMapIds?.some((id) => !mapIds.has(id))) errors.push(`${label}: invalid curriculumMapId`);
    if (unit.officialCurriculum?.sourceId && !sourceIds.has(unit.officialCurriculum.sourceId)) errors.push(`${label}: invalid sourceId`);
    if (unit.officialCurriculum?.codeRefs?.some((ref) => !sourceIds.has(unit.officialCurriculum.sourceId) || !sources.sources.find((source) => source.id === unit.officialCurriculum.sourceId)?.verifiedClauses?.includes(ref.code))) errors.push(`${label}: code not listed as verified for its source`);
    if (unit.formalUnitRef) {
      const registered = unitRefs.get(unit.formalUnitRef.unitId);
      if (!registered || registered.revision !== unit.formalUnitRef.unitRevision || registered.status !== unit.formalUnitRef.unitStatus) errors.push(`${label}: formalUnitRef does not match registry`);
    }
    if (unit.review?.dataStatus !== 'draft' || unit.review?.teacherReviewStatus !== 'pending_review' || unit.review?.reviewRecords?.length) errors.push(`${label}: generated content must remain draft and unsigned`);
    if (unit.semesterId !== null || unit.evidence?.schoolSchedule?.semesterId !== null) errors.push(`${label}: semester placement must remain unassigned without evidence`);
    if (unit.observableOutcomes?.measurableCriteria?.length || unit.learningCheck?.status !== 'not_designed' || unit.learningCheck?.passCriteria !== null) errors.push(`${label}: unreviewed outcome/check criteria must not be asserted`);
    for (const objective of unit.observableOutcomes?.candidateObjectives ?? []) {
      if (!objective.objectiveId || candidateObjectiveIds.has(objective.objectiveId)) errors.push(`${label}: missing or duplicate candidate objectiveId`);
      candidateObjectiveIds.add(objective.objectiveId);
      if (objective.status !== 'candidate_pending_teacher_review' || objective.curriculumAlignmentStatus !== 'pending_teacher_review' || objective.observableCriteria?.length) errors.push(`${label}: candidate objectives must remain unreviewed and have no approved criteria`);
      if (objective.curriculumMapIds?.some((id) => !mapIds.has(id))) errors.push(`${label}: candidate objective has invalid curriculumMapId`);
    }
    if (unit.evidence?.classroomTeaching?.records?.length || unit.evidence?.teacherProfessionalReview?.records?.length) errors.push(`${label}: no unprovided teaching or teacher-review records may be generated`);
  }
  if (dataset.learningUnits.length !== chapters.length || chapterRefs.size !== chapters.length) errors.push('learningUnits must cover each existing grade 3 chapter exactly once');
  if (dataset.boundaries?.stage0Status !== 'not_passed') errors.push('stage0Status must remain not_passed');
  return errors;
}

export function validateStudentProgressModel(model) {
  const errors = [];
  const requiredStates = ['not_started', 'in_progress', 'activity_completed', 'needs_review', 'check_passed', 'objective_achieved'];
  const states = new Set((model.states ?? []).map((state) => state.id));
  if (model.implementationStatus !== 'specification_only_not_implemented') errors.push('progress model must remain specification-only');
  if ((model.records ?? []).length !== 0) errors.push('no real learner progress records may be generated by this task');
  if (states.size !== requiredStates.length || requiredStates.some((state) => !states.has(state))) errors.push('the six required progress states must be present exactly once');
  for (const state of model.states ?? []) {
    if (!state.meaning || !Array.isArray(state.requiredEvidence)) errors.push(`state ${state.id} needs a meaning and evidence definition`);
  }
  const allowedTransitions = new Set([
    'not_started>in_progress',
    'in_progress>activity_completed', 'in_progress>needs_review',
    'activity_completed>in_progress', 'activity_completed>needs_review', 'activity_completed>check_passed',
    'needs_review>in_progress', 'needs_review>check_passed',
    'check_passed>needs_review', 'check_passed>objective_achieved',
    'objective_achieved>needs_review',
  ]);
  const transitionKeys = new Set();
  for (const transition of model.transitions ?? []) {
    if (!states.has(transition.from) || !states.has(transition.to)) errors.push(`invalid transition: ${transition.from} -> ${transition.to}`);
    if (transition.from === 'not_started' && transition.to !== 'in_progress') errors.push('not_started may only transition to in_progress');
    const key = `${transition.from}>${transition.to}`;
    if (!allowedTransitions.has(key)) errors.push(`transition is not allowed: ${transition.from} -> ${transition.to}`);
    if (transitionKeys.has(key)) errors.push(`duplicate transition: ${transition.from} -> ${transition.to}`);
    transitionKeys.add(key);
    if (!Array.isArray(transition.requires) || transition.requires.length === 0) errors.push(`transition ${transition.from} -> ${transition.to} needs evidence requirements`);
  }
  for (const key of allowedTransitions) if (!transitionKeys.has(key)) errors.push(`missing transition definition: ${key.replace('>', ' -> ')}`);
  if (!model.evidencePolicy?.gameSignalsAloneAreInsufficient?.includes('score') || !model.evidencePolicy?.gameSignalsAloneAreInsufficient?.includes('stars') || !model.evidencePolicy?.gameSignalsAloneAreInsufficient?.includes('badge')) errors.push('score, stars, and badges must not be mastery evidence by themselves');
  const achieved = (model.transitions ?? []).find((item) => item.to === 'objective_achieved');
  if (!achieved || !['approved_objective_criteria', 'multiple_learning_evidence', 'educator_review'].every((item) => achieved.requires.includes(item))) errors.push('objective_achieved requires approved criteria, multiple evidence, and educator review');
  if (model.evidencePolicy?.checkPassedIsNotObjectiveAchieved !== true) errors.push('check_passed must remain distinct from objective_achieved');
  return errors;
}

function loadInputs() {
  return {
    learningMap: readJson(path.join(ROOT, 'curriculum', 'learning-map.json')),
    gradeScope: readJson(path.join(ROOT, 'curriculum', 'grade3-year-scope.json')),
    curriculumMap: readJson(path.join(ROOT, 'curriculum', 'curriculum-map.json')),
    sources: readJson(path.join(ROOT, 'curriculum', 'sources.json')),
    unitRegistry: readJson(path.join(ROOT, 'curriculum', 'unit-registry.json')),
  };
}

export function validateCurrentModels(root = ROOT) {
  const inputs = loadInputs();
  const objectives = readJson(path.join(root, 'curriculum', 'learning-objectives.json'));
  const progress = readJson(path.join(root, 'curriculum', 'student-progress-model.json'));
  return [...validateLearningObjectives(objectives, inputs), ...validateStudentProgressModel(progress)];
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputs = loadInputs();
  if (process.argv.includes('--build')) {
    const objectives = createLearningObjectives(inputs);
    const progress = createStudentProgressModel();
    const objectiveErrors = validateLearningObjectives(objectives, inputs);
    const progressErrors = validateStudentProgressModel(progress);
    const errors = [...objectiveErrors, ...progressErrors];
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      fs.writeFileSync(MODEL_PATH, `${JSON.stringify(objectives, null, 2)}\n`);
      fs.writeFileSync(PROGRESS_PATH, `${JSON.stringify(progress, null, 2)}\n`);
      console.log(`Built ${objectives.learningUnits.length} candidate learning units and progress model (specification only).`);
    }
  } else {
    const errors = validateCurrentModels();
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('Learning objective and student progress models are structurally valid; no student progress implementation is claimed.');
    }
  }
}
