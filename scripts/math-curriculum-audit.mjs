import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { NUMBER_SECRET_LEARNING_UNIT } from '../prototype/data/numberSecretLearningUnit.js';
import { ADDITION_SUBTRACTION_LEARNING_UNIT } from '../prototype/data/additionSubtractionLearningUnit.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from '../prototype/data/fractionTreasureLearningUnit.js';
import { MILLIMETER_RULER_LEARNING_UNIT } from '../prototype/data/millimeterRulerLearningUnit.js';
import { SQUARE_CENTIMETER_AREA_LEARNING_UNIT } from '../prototype/data/squareCentimeterAreaLearningUnit.js';
import { WEIGHT_KG_G_LEARNING_UNIT } from '../prototype/data/weightKgGLearningUnit.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const sourceRegistry = read('curriculum/sources.json');
const map = read('curriculum/curriculum-map.json');
const focusedAudit = read('curriculum/math-focused-clause-audit.json');
const subitemDefinitions = read('curriculum/learning-subitem-definitions.json');
const grade3Batch = read('curriculum/math-grade3-official-content-batch.json');
const grade1Batch = read('curriculum/math-grade1-official-content-batch.json');
const grade2Batch = read('curriculum/math-grade2-official-content-batch.json');
const grade4Batch = read('curriculum/math-grade4-official-content-batch.json');
const grade5Batch = read('curriculum/math-grade5-official-content-batch.json');
const grade6Batch = read('curriculum/math-grade6-official-content-batch.json');
const mathSource = sourceRegistry.sources.find(({ id }) => id === 'mathematics');
const tasks = CATALOG_CANDIDATE_TASKS.filter(({ subjectId }) => subjectId === 'mathematics');
const foci = [
  ...map.verifiedLearningFocuses,
  ...(map.supplementalVerifiedLearningFocuses ?? []),
  ...map.pendingLearningFocuses,
].filter(({ subject }) => subject === 'mathematics');
const byId = new Map(tasks.map((task) => [task.activityId, task]));
const standaloneMathModules = [
  { unit: NUMBER_SECRET_LEARNING_UNIT, code: 'N-3-1', responseCount: NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.length, responseKind: 'candidate_guided_and_practice_questions', limits: '另有步驟化教學與候選檢核；部分圖像支架會提示或顯示位值，不能只依題目數推論獨立掌握。' },
  { unit: ADDITION_SUBTRACTION_LEARNING_UNIT, code: 'N-3-2', responseCount: ADDITION_SUBTRACTION_LEARNING_UNIT.questions.length, responseKind: 'candidate_question_module', limits: ADDITION_SUBTRACTION_LEARNING_UNIT.missingCoverage?.join('；') ?? '僅屬候選問題模組，需以題目操作檢視涵蓋範圍。' },
  { unit: FRACTION_TREASURE_LEARNING_UNIT, code: 'N-3-9', responseCount: FRACTION_TREASURE_LEARNING_UNIT.questions.length, responseKind: 'candidate_question_module', limits: FRACTION_TREASURE_LEARNING_UNIT.missingCoverage?.join('；') ?? '僅屬候選問題模組，需以題目操作檢視涵蓋範圍。' },
  { unit: MILLIMETER_RULER_LEARNING_UNIT, code: 'N-3-12', responseCount: MILLIMETER_RULER_LEARNING_UNIT.questions.length, responseKind: 'candidate_question_module', limits: '螢幕刻度判讀屬模擬；沒有實物尺測量證據。' },
  { unit: SQUARE_CENTIMETER_AREA_LEARNING_UNIT, code: 'N-3-14', responseCount: SQUARE_CENTIMETER_AREA_LEARNING_UNIT.questions.length, responseKind: 'candidate_question_module', limits: '螢幕單位方格練習；未替代實物估測或實測。' },
  { unit: WEIGHT_KG_G_LEARNING_UNIT, code: 'N-3-16', responseCount: WEIGHT_KG_G_LEARNING_UNIT.questions.length, responseKind: 'candidate_question_module', limits: '圖片／文字秤重情境模擬；未評量實際秤重與量感。' },
].map(({ unit, code, responseCount, responseKind, limits }) => ({
  activityId: unit.activityId,
  learningUnitId: unit.learningUnitId,
  title: unit.title ?? unit.activityId,
  status: unit.status,
  curriculumCode: code,
  responseCount,
  responseKind,
  moduleKeys: Object.keys(unit),
  limitation: limits,
  countedInsideCatalogTaskTotal: false,
}));
const focusRows = foci.map((focus) => {
  const contentCodes = new Set(focus.contentCodes ?? []);
  const codes = new Set([...contentCodes, ...(focus.performanceCodes ?? [])]);
  // Activity curriculumCodes name learning-content clauses. Shared learning-performance
  // codes (for example n-II-9) describe broad capability and must not cross-link every
  // task carrying that performance code to every focus that references it.
  const linkedTasks = tasks.filter((task) => task.activityId === focus.candidateActivityId || task.curriculumMapId === focus.id || (task.curriculumCodes ?? []).some((code) => contentCodes.has(code)));
  const claimedEvidenceByActivity = new Map();
  const focusDefinitions = subitemDefinitions.definitions.filter((entry) => {
    const matchesCode = (entry.officialCode && codes.has(entry.officialCode)) || (entry.officialCodes ?? []).some((code) => codes.has(code));
    return entry.subject === 'mathematics' && entry.focusId === focus.id && matchesCode;
  });
  for (const definition of focusDefinitions) {
    for (const activityId of definition.activityIds) {
      const entries = claimedEvidenceByActivity.get(activityId) ?? [];
      entries.push(definition);
      claimedEvidenceByActivity.set(activityId, entries);
    }
  }
  const evidenceTasks = linkedTasks.filter((task) => {
    if (task.activityId === focus.candidateActivityId) return true;
    if (task.coverage?.subitemId && (task.learningSubitemClaims ?? []).includes(task.coverage.subitemId)) return true;
    const definitions = claimedEvidenceByActivity.get(task.activityId) ?? [];
    return definitions.some((definition) => (task.learningSubitemClaims ?? []).includes(definition.subitemId)
      && definition.evidenceStageIds?.some((stageId) => task.stages.some((stage) => stage.stageId === stageId && stage.interaction !== 'choose_response')));
  });
  const interactiveEvidenceTasks = evidenceTasks.filter((task) => task.stages.some(({ interaction }) => interaction !== 'choose_response'));
  const officialVerified = /^verified_against_official_(?:text|pdf)/.test(focus.officialTextReviewStatus ?? '');
  const explicitPartial = focus.coverageStatus === 'partial' || focus.coverageLimitations?.length > 0;
  const status = !officialVerified ? 'needs_verification'
    : interactiveEvidenceTasks.length ? 'interactive_evidence_partial'
      : linkedTasks.length ? 'activity_relation_only'
        : 'uncovered_verified_focus';
  const hasCuratedSubitemInteractionEvidence = evidenceTasks.some((task) => claimedEvidenceByActivity.has(task.activityId));
  return {
    focusId: focus.id,
    gradeRange: focus.gradeRange ?? null,
    subject: focus.subject,
    officialContentCodes: focus.contentCodes ?? [],
    officialPerformanceCodes: focus.performanceCodes ?? [],
    officialTextReviewStatus: focus.officialTextReviewStatus ?? 'not_recorded',
    mappedActivityIds: linkedTasks.map(({ activityId }) => activityId),
    activityRelationOnlyIds: linkedTasks.filter(({ activityId }) => !evidenceTasks.some((task) => task.activityId === activityId)).map(({ activityId }) => activityId),
    interactionEvidenceActivityIds: interactiveEvidenceTasks.map(({ activityId }) => activityId),
    activityHasNonChoiceInteraction: interactiveEvidenceTasks.length > 0,
    recordedCoverageStatus: explicitPartial || hasCuratedSubitemInteractionEvidence ? 'partial' : (focus.coverageStatus ?? 'not_claimed'),
    auditStatus: status,
    auditLimit: '互動存在只證明程式有操作，不證明完整教學涵蓋、教學有效或學生已精熟。',
  };
});

const taskRows = tasks.map((task) => {
  const catalogEntry = getGradeById(task.gradeId)?.subjects.find(({ subjectId }) => subjectId === task.subjectId)?.existingYearLevelContent.find(({ activityId }) => activityId === task.activityId) ?? null;
  return ({
  activityId: task.activityId,
  gradeId: task.gradeId,
  subjectId: task.subjectId,
  title: task.title,
  status: task.status,
  curriculumMapId: task.curriculumMapId,
  curriculumCodes: task.curriculumCodes ?? [],
  interactionTypes: [...new Set(task.stages.map(({ interaction }) => interaction))],
  scope: task.curriculumScope ?? null,
  claimedSubitems: task.learningSubitemClaims ?? [],
  stages: task.stages.map((stage) => ({
    stageId: stage.stageId,
    interaction: stage.interaction,
    prompt: stage.prompt,
    hints: stage.hints,
    incorrectFeedback: stage.incorrectFeedback,
    correctFeedback: stage.correctFeedback,
    evidenceMechanic: stage.interaction === 'choose_response' ? '選擇回應' : stage.interaction,
  })),
  stageIds: task.stages.map(({ stageId }) => stageId),
  hasTwoHintsPerStage: task.stages.every(({ hints }) => Array.isArray(hints) && hints.length >= 2),
  hasFeedbackPerStage: task.stages.every(({ incorrectFeedback, correctFeedback }) => Boolean(incorrectFeedback && correctFeedback)),
  candidateOnlyMemoryEvidence: task.evidencePolicy?.persistence === 'memory_only_no_student_records_no_localStorage'
    && task.evidencePolicy?.completionIsMastery === false,
  catalogLaunch: catalogEntry ? { runtimeModule: catalogEntry.runtimeModule, entryRoute: catalogEntry.entryRoute, status: catalogEntry.status } : null,
  });
});

const codeRefs = [...new Set(mathSource.verifiedClauses ?? [])];
const contentCodeRefs = codeRefs.filter((code) => /^(N|S|R|A|F|D)-\d-/i.test(code));
const gradeTableBatches = [grade1Batch, grade2Batch, grade3Batch, grade4Batch, grade5Batch, grade6Batch];
const reconciledBatchAuditByCode = new Map(gradeTableBatches.flatMap((batch) => (batch.activityAudit ?? []).map((row) => [row.code, { ...row, officialGradeTable: batch.applicability.officialGradeTable, learningStage: batch.applicability.learningStage }])));
const verifiedClauseRows = (focusedAudit.clauses ?? []).filter(({ clauseType }) => clauseType === 'learning_content').map((clause) => {
  const activities = tasks.filter((task) => (task.curriculumCodes ?? []).includes(clause.code));
  const standaloneActivities = standaloneMathModules.filter(({ curriculumCode }) => curriculumCode === clause.code);
  const persistedAudit = reconciledBatchAuditByCode.get(clause.code);
  const persistedActivityIds = (persistedAudit?.activityIds ?? []).filter((activityId) => byId.has(activityId));
  const persistedStageEvidence = persistedActivityIds.flatMap((activityId) => {
    const task = byId.get(activityId);
    const stageIds = (persistedAudit?.evidenceStageIds ?? []).filter((stageId) => task.stages.some((stage) => stage.stageId === stageId));
    return stageIds.map((stageId) => ({ activityId, stageId, interaction: task.stages.find((stage) => stage.stageId === stageId).interaction }));
  });
  const claims = subitemDefinitions.definitions.filter((definition) => definition.subject === 'mathematics'
    && (definition.officialCode === clause.code || definition.officialCodes?.includes(clause.code))
    && activities.some(({ activityId }) => definition.activityIds?.includes(activityId)));
  const claimEvidence = claims.flatMap((definition) => definition.activityIds
    .filter((activityId) => activities.some((task) => task.activityId === activityId))
    .map((activityId) => {
      const task = byId.get(activityId);
      const stageIds = (definition.evidenceStageIds ?? []).filter((stageId) => task.stages.some((stage) => stage.stageId === stageId));
      return { activityId, subitemId: definition.subitemId, stageIds, interactions: task.stages.filter(({ stageId }) => stageIds.includes(stageId)).map(({ interaction }) => interaction) };
    }).filter(({ stageIds }) => stageIds.length > 0));
  const claimedStageEvidenceKeys = new Set(claimEvidence.flatMap(({ activityId, stageIds }) => stageIds.map((stageId) => `${activityId}::${stageId}`)));
  const unclaimedPersistedStageEvidence = persistedStageEvidence.filter(({ activityId, stageId }) => !claimedStageEvidenceKeys.has(`${activityId}::${stageId}`));
  const claimLimitations = [...new Set(claims.flatMap(({ notCovered = [] }) => notCovered).filter(Boolean))];
  const activityScopeLimitations = activities.map(({ curriculumScope }) => curriculumScope).filter(Boolean).join('；');
  const linkedActivityIds = [...new Set([...activities.map(({ activityId }) => activityId), ...persistedActivityIds])];
  const hasVerifiedOfficialText = /^verified_against_official_pdf/.test(clause.reviewStatus);
  const hasInteractiveEvidence = claimEvidence.length > 0 || persistedStageEvidence.length > 0;
  const reconciledCoverage = !hasVerifiedOfficialText ? 'needs_verification'
    : hasInteractiveEvidence ? 'partial'
      : linkedActivityIds.length || standaloneActivities.length ? 'relation_only' : 'uncovered';
  return {
    code: clause.code,
    stage: clause.applicability?.learningStage ?? persistedAudit?.learningStage ?? null,
    gradeTable: clause.applicability?.officialGradeTable ?? persistedAudit?.officialGradeTable ?? null,
    reviewStatus: clause.reviewStatus,
    sourceLocation: clause.sourceLocation,
    officialText: clause.officialText,
    officialPerformanceLinks: clause.officialPerformanceLinks ?? [],
    activityIds: linkedActivityIds,
    supplementaryStandaloneActivityIds: standaloneActivities.map(({ activityId }) => activityId),
    supplementaryStandaloneEvidence: standaloneActivities,
    interactionEvidence: [...claimEvidence, ...unclaimedPersistedStageEvidence.map(({ activityId, stageId, interaction }) => ({ activityId, subitemId: null, stageIds: [stageId], interactions: [interaction], evidenceOrigin: 'grade_batch_activity_audit_reviewed_stage' }))],
    interactionEvidenceIds: [...new Set([...claimEvidence.map(({ activityId }) => activityId), ...persistedStageEvidence.map(({ activityId }) => activityId)])],
    relationOnlyIds: linkedActivityIds.filter((activityId) => !claimEvidence.some((row) => row.activityId === activityId) && !persistedStageEvidence.some((row) => row.activityId === activityId)),
    coverageStatus: reconciledCoverage,
    declaredBatchAuditStatus: persistedAudit?.status ?? null,
    declaredEvidenceStageIds: persistedAudit?.evidenceStageIds ?? [],
    limitations: clause.projectInterpretation
      ?? (claimLimitations.length ? claimLimitations.join('；') : null)
      ?? persistedAudit?.reason
      ?? (activityScopeLimitations || null),
    coverageRule: 'Only a project subitem definition with matching officialCode, activityId and existing evidenceStageIds counts as traceable subitem interaction evidence. Catalog code links or standalone module references without clause-specific subitem claims are relation_only; even partial evidence is not full coverage.',
  };
});
const grade3BatchCodes = grade3Batch.clauses.map(({ code }) => code);
const grade3BatchSummary = {
  batchId: grade3Batch.batchId,
  status: grade3Batch.status,
  officialGradeTable: 3,
  learningStage: grade3Batch.applicability.learningStage,
  registeredRows: grade3Batch.clauses.length,
  uniqueCodeCount: new Set(grade3BatchCodes).size,
  rowCodes: grade3BatchCodes,
  coverageCountsWithinBatch: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, grade3BatchCodes.filter((code) => (verifiedClauseRows.find((row) => row.code === code)?.coverageStatus ?? 'needs_verification') === status).length])),
  officialPerformanceLinksChecked: grade3Batch.clauses.every((row) => row.officialPerformanceLinks.every((code) => focusedAudit.learningPerformanceClauses.some((performance) => performance.code === code))),
  completeOnlyForThisTableBatch: grade3Batch.clauses.length === 24 && new Set(grade3BatchCodes).size === 24,
  nextWorkPosition: grade3Batch.nextWorkPosition ?? '一年級學習內容表 PDF 頁序21起。',
  note: 'Counts use the 24 unique official rows transcribed and checked in this contiguous grade-3 table batch, not the total elementary-math curriculum. All linked tasks remain candidate activities; activity links and partial interaction do not establish learning effectiveness.',
};
const grade1BatchCodes = grade1Batch.clauses.map(({ code }) => code);
const grade1BatchSummary = {
  batchId: grade1Batch.batchId,
  status: grade1Batch.status,
  officialGradeTable: 1,
  learningStage: grade1Batch.applicability.learningStage,
  registeredRows: grade1Batch.clauses.length,
  uniqueCodeCount: new Set(grade1BatchCodes).size,
  uniqueConceptCount: new Set(grade1Batch.clauses.map(({ equivalentOfficialCode, code }) => equivalentOfficialCode ? [code, equivalentOfficialCode].sort().join('=') : code)).size,
  duplicateConceptAliases: grade1Batch.clauses.filter(({ equivalentOfficialCode }) => equivalentOfficialCode).map(({ code, equivalentOfficialCode }) => ({ code, equivalentOfficialCode })),
  rowCodes: grade1BatchCodes,
  coverageCountsWithinBatch: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, grade1BatchCodes.filter((code) => (verifiedClauseRows.find((row) => row.code === code)?.coverageStatus ?? 'needs_verification') === status).length])),
  officialPerformanceLinksChecked: grade1Batch.clauses.every((row) => row.officialPerformanceLinks.every((code) => focusedAudit.learningPerformanceClauses.some((performance) => performance.code === code))),
  completeOnlyForThisTableBatch: grade1Batch.clauses.length === 11 && new Set(grade1BatchCodes).size === 11,
  nextWorkPosition: grade1Batch.nextWorkPosition,
  note: '11個代碼列，其中N-1-5與S-1-1是官方同內容雙代碼；代碼列數11、概念數10。分項涵蓋只依專案子項和明確階段操作證據計算，不代表年級或全國完整涵蓋。',
};
const grade2BatchCodes = grade2Batch.clauses.map(({ code }) => code);
const grade2BatchSummary = {
  batchId: grade2Batch.batchId,
  status: grade2Batch.status,
  officialGradeTable: 2,
  learningStage: grade2Batch.applicability.learningStage,
  registeredRows: grade2Batch.clauses.length,
  uniqueCodeCount: new Set(grade2BatchCodes).size,
  uniqueConceptCount: new Set(grade2Batch.clauses.map(({ code }) => code)).size,
  rowCodes: grade2BatchCodes,
  relatedButNonAliasCodes: grade2Batch.clauses.filter(({ relatedOfficialCodes }) => relatedOfficialCodes?.length).map(({ code, relatedOfficialCodes, officialNotes }) => ({ code, relatedOfficialCodes, officialNotes })),
  coverageCountsWithinBatch: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, grade2BatchCodes.filter((code) => (verifiedClauseRows.find((row) => row.code === code)?.coverageStatus ?? 'needs_verification') === status).length])),
  officialPerformanceLinksChecked: grade2Batch.clauses.every((row) => row.officialPerformanceLinks.every((code) => focusedAudit.learningPerformanceClauses.some((performance) => performance.code === code))),
  completeOnlyForThisTableBatch: grade2Batch.clauses.length === 24 && new Set(grade2BatchCodes).size === 24,
  nextWorkPosition: grade2Batch.nextWorkPosition,
  note: '24個官方代碼列、24個不同條目；N-2-12與S-2-5僅部分內容關係，不是別名。適用第一學習階段，官方表格以年級表呈現但不指定學期；本批不代表完整數學領綱清冊。',
};
const grade4BatchCodes = grade4Batch.clauses.map(({ code }) => code);
const grade4BatchSummary = {
  batchId: grade4Batch.batchId,
  status: grade4Batch.status,
  officialGradeTable: 4,
  learningStage: grade4Batch.applicability.learningStage,
  registeredRows: grade4Batch.clauses.length,
  uniqueCodeCount: new Set(grade4BatchCodes).size,
  uniqueConceptCount: grade4Batch.clauses.length - grade4Batch.conceptRelationships
    .filter(({ kind }) => kind === 'official_same_content_alias')
    .reduce((sum, relationship) => sum + relationship.codes.length - 1, 0),
  duplicateConceptRelationships: grade4Batch.conceptRelationships,
  rowCodes: grade4BatchCodes,
  coverageCountsWithinBatch: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, grade4BatchCodes.filter((code) => (verifiedClauseRows.find((row) => row.code === code)?.coverageStatus ?? 'needs_verification') === status).length])),
  officialPerformanceLinksChecked: grade4Batch.clauses.every((row) => row.officialPerformanceLinks.every((code) => focusedAudit.learningPerformanceClauses.some((performance) => performance.code === code))),
  completeOnlyForThisTableBatch: grade4Batch.clauses.length === 26 && new Set(grade4BatchCodes).size === 26 && grade4Batch.activityAudit.length === 26,
  nextWorkPosition: grade4Batch.nextWorkPosition,
  note: '26個官方代碼列、25個不同概念；僅N-4-10/S-4-1是同內容別名而去重。N-4-12/S-4-4雖相關但屬分列要求，分開計數。只代表四年級表格批次，不代表完整數學領綱。',
};
const grade5BatchCodes = grade5Batch.clauses.map(({ code }) => code);
const grade5BatchSummary = {
  batchId: grade5Batch.batchId,
  status: grade5Batch.status,
  officialGradeTable: 5,
  learningStage: grade5Batch.applicability.learningStage,
  registeredRows: grade5Batch.clauses.length,
  uniqueCodeCount: new Set(grade5BatchCodes).size,
  uniqueConceptCount: grade5Batch.clauses.length - (grade5Batch.conceptRelationships?.length ?? 0),
  rowCodes: grade5BatchCodes,
  coverageCountsWithinBatch: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, grade5Batch.activityAudit.filter((row) => row.status === status).length])),
  officialPerformanceLinksChecked: grade5Batch.clauses.every((row) => row.officialPerformanceLinks.every((code) => focusedAudit.learningPerformanceClauses.some((performance) => performance.code === code))),
  completeOnlyForThisTableBatch: grade5Batch.clauses.length === 27 && new Set(grade5BatchCodes).size === 27 && grade5Batch.activityAudit.length === 27 && new Set(grade5Batch.activityAudit.map(({ code }) => code)).size === 27,
  nextWorkPosition: grade5Batch.nextWorkPosition,
  note: '27個官方代碼列、27個條目；涵蓋五年級表 N/S/R/D 代碼。頁序31–34為連續表格批次，不代表完整數學領綱，也不指定學期進度。互動僅按對應活動及具體證據階段分類。',
};
const grade6BatchCodes = grade6Batch.clauses.map(({ code }) => code);
const grade6BatchSummary = {
  batchId: grade6Batch.batchId,
  status: grade6Batch.status,
  officialGradeTable: 6,
  learningStage: grade6Batch.applicability.learningStage,
  registeredRows: grade6Batch.clauses.length,
  uniqueCodeCount: new Set(grade6BatchCodes).size,
  uniqueConceptCount: grade6Batch.conceptRelationships.reduce((sum, relationship) => sum - (relationship.kind === 'same_official_learning_content_explicitly_cross_referenced' ? relationship.codes.length - 1 : 0), grade6Batch.clauses.length),
  duplicateConceptRelationships: grade6Batch.conceptRelationships,
  rowCodes: grade6BatchCodes,
  coverageCountsWithinBatch: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, grade6Batch.activityAudit.filter((row) => row.status === status).length])),
  officialPerformanceLinksChecked: grade6Batch.clauses.every((row) => row.officialPerformanceLinks.every((code) => focusedAudit.learningPerformanceClauses.some((performance) => performance.code === code))),
  completeOnlyForThisTableBatch: grade6Batch.clauses.length === 19 && new Set(grade6BatchCodes).size === 19 && grade6Batch.activityAudit.length === 19 && new Set(grade6Batch.activityAudit.map(({ code }) => code)).size === 19,
  nextWorkPosition: grade6Batch.nextWorkPosition,
  note: '19個官方代碼列、18個不同概念；N-6-9/R-6-4是官方交叉註明的同一解題內容。此為六年級內容表批次，不代表完整數學領綱。',
};
const allGradeBatchClauses = gradeTableBatches.flatMap((batch) => batch.clauses.map((clause) => ({ ...clause, officialGradeTable: batch.applicability.officialGradeTable, learningStage: batch.applicability.learningStage, batchId: batch.batchId })));
const explicitAliasGroups = [...new Map(gradeTableBatches.flatMap((batch) => [
  ...(batch.clauses ?? []).filter(({ equivalentOfficialCode }) => equivalentOfficialCode).map(({ code, equivalentOfficialCode }) => ({ codes: [code, equivalentOfficialCode], evidence: 'official_equivalentOfficialCode_field' })),
  ...(batch.conceptRelationships ?? []).filter(({ kind }) => ['official_same_content_alias', 'same_official_learning_content_explicitly_cross_referenced', 'official_same_content_explicit_alias'].includes(kind)).map(({ codes, evidence }) => ({ codes, evidence })),
]).map(({ codes, evidence }) => { const normalizedCodes = [...new Set(codes)].sort(); return [normalizedCodes.join('|'), { codes: normalizedCodes, evidence }]; })).values()];
const aliasMembers = new Set(explicitAliasGroups.flatMap(({ codes }) => codes));
const coveredAliasCanonicalCodes = new Set(explicitAliasGroups.map(({ codes }) => codes.join('=')));
const batchStatusRows = allGradeBatchClauses.map((clause) => {
  const audit = verifiedClauseRows.find(({ code }) => code === clause.code);
  return {
    gradeTable: clause.officialGradeTable,
    learningStage: clause.learningStage,
    code: clause.code,
    officialText: clause.officialText,
    sourceLocation: clause.sourceLocation,
    officialNotes: clause.officialNotes ?? '',
    reviewStatus: audit?.reviewStatus ?? 'needs_verification_no_focused_audit_row',
    mappedActivityIds: audit?.activityIds ?? [],
    interactionEvidenceStageIds: [...new Set((audit?.interactionEvidence ?? []).flatMap(({ stageIds }) => stageIds))],
    coverageStatus: audit?.coverageStatus ?? 'needs_verification',
    reason: (gradeTableBatches.find((batch) => batch.applicability.officialGradeTable === clause.officialGradeTable)?.activityAudit ?? []).find(({ code }) => code === clause.code)?.reason ?? audit?.limitations ?? '需逐項核對現有活動與互動證據。',
  };
});
const crossGradeCoverageCounts = Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, batchStatusRows.filter(({ coverageStatus }) => coverageStatus === status).length]));
const crossGradeCountsByGrade = Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
  const grade = index + 1;
  const rows = batchStatusRows.filter(({ gradeTable }) => gradeTable === grade);
  return [`grade-${grade}`, { officialCodeRows: rows.length, uniqueConcepts: rows.length - explicitAliasGroups.reduce((dedupe, group) => dedupe + (group.codes.filter((code) => rows.some((row) => row.code === code)).length > 1 ? group.codes.filter((code) => rows.some((row) => row.code === code)).length - 1 : 0), 0), ...Object.fromEntries(Object.keys(crossGradeCoverageCounts).map((status) => [status, rows.filter(({ coverageStatus }) => coverageStatus === status).length])) }];
}));
const officialCrossCodeReferences = allGradeBatchClauses.flatMap((clause) => {
  const text = `${clause.officialText ?? ''} ${clause.officialNotes ?? ''} ${(clause.relatedOfficialCodes ?? []).join(' ')} ${clause.equivalentOfficialCode ?? ''}`;
  const refs = [...new Set(text.match(/\b(?:N|S|R|D|A|F)-[1-6]-\d+\b/g) ?? [])].filter((code) => code !== clause.code && allGradeBatchClauses.some((row) => row.code === code));
  return refs.map((relatedCode) => ({ fromCode: clause.code, fromGradeTable: clause.officialGradeTable, relatedCode, relatedGradeTable: allGradeBatchClauses.find(({ code }) => code === relatedCode)?.officialGradeTable, basis: 'code_appears_in_official_text_or_notes; relationship_is_not_automatically_prerequisite' }));
});
const priorityUncoveredCodeOrder = ['N-2-9', 'N-2-12', 'N-3-4', 'N-4-8', 'N-4-10', 'N-4-13', 'N-5-3', 'N-6-2'];
const projectPrerequisiteHypotheses = [
  { earlierCode: 'N-2-9', laterCode: 'N-3-4', rationale: '二年級等分／包含除的概念可作後續除法計算的專案先備檢查；僅屬專案排序假設，非官方年級或學期規定。' },
  { earlierCode: 'N-2-8', laterCode: 'N-3-7', rationale: '兩步驟問題的操作經驗可為後續乘除應用作專案先備；課綱的相互提及另列於官方交叉引用，未推定學期順序。' },
  { earlierCode: 'N-5-3', laterCode: 'N-6-2', rationale: '五年級因數、倍數概念可作六年級最大公因數／最小公倍數的專案先備；是否符合實際教學進度需教師確認。' },
];
const priorityGapList = batchStatusRows.filter(({ coverageStatus }) => ['uncovered', 'relation_only'].includes(coverageStatus)).map((row) => ({
  ...row,
  priority: priorityUncoveredCodeOrder.indexOf(row.code) >= 0 ? priorityUncoveredCodeOrder.indexOf(row.code) + 1 : 100 + row.gradeTable,
  recommendedInteraction: row.code.startsWith('N-') ? '依條文設計可操作的數量／表示／計算或情境遷移任務' : row.code.startsWith('S-') ? '圖形、測量或空間建構操作' : row.code.startsWith('D-') ? '資料建置、判讀與受限推論' : '操作或推理活動，先核對該條文的實際要求',
})).sort((a, b) => a.priority - b.priority || a.gradeTable - b.gradeTable || a.code.localeCompare(b.code));
const crossGradeIntegration = {
  status: 'six_contiguous_grade_tables_registered_full_math_inventory_incomplete',
  scope: '只計六個官方年級學習內容表批次的代碼列，不是完整國小數學領綱總數。',
  officialCodeRowCount: allGradeBatchClauses.length,
  uniqueOfficialCodeCount: new Set(allGradeBatchClauses.map(({ code }) => code)).size,
  explicitlyDeduplicatedConceptCount: allGradeBatchClauses.length - explicitAliasGroups.reduce((sum, group) => sum + group.codes.length - 1, 0),
  conceptDeduplicationRule: '只合併來源資料明示相同內容／等值代碼的官方別名；相關但分列的條目保留為不同概念。',
  officialAliasGroups: explicitAliasGroups,
  countByActivityEvidence: crossGradeCoverageCounts,
  countsByProjectGrade: crossGradeCountsByGrade,
  rows: batchStatusRows,
  officialCrossCodeReferences,
  projectPrerequisiteHypotheses,
  prioritizedGaps: priorityGapList,
  officialElementaryMathTotal: null,
  fullCurriculumInventoryComplete: false,
  caveat: '批次中有年級表與學習階段標示；先備假設是專案設計，並非官方學期進度。技術互動證據只表示活動有該操作，不能證明教學有效或學生精熟。',
};
const contentCoverageSummary = {
  trackedOfficialLearningContentClauseDenominator: verifiedClauseRows.length,
  denominatorDefinition: '目前 math-focused-clause-audit.json 中逐條保存官方原文及來源位置、且 reviewStatus 標為 verified 的唯一學習內容代碼數；不是官方數學領綱總條目數。',
  officialElementaryMathTotal: null,
  countByCoverageStatus: Object.fromEntries(['partial', 'relation_only', 'uncovered'].map((status) => [status, verifiedClauseRows.filter((row) => row.coverageStatus === status).length])),
  countByOfficialGradeTableAndCodeFamily: Object.values(verifiedClauseRows.reduce((groups, row) => {
    const codeFamily = row.code.split('-')[0];
    const key = `grade-${row.gradeTable ?? 'unknown'}:${codeFamily}`;
    const group = groups[key] ??= { officialGradeTable: row.gradeTable ?? null, learningStage: row.stage, officialCodeFamily: codeFamily, trackedClauseCount: 0, partial: 0, relation_only: 0, uncovered: 0, clauseCodes: [] };
    group.trackedClauseCount += 1;
    group[row.coverageStatus] += 1;
    group.clauseCodes.push(row.code);
    return groups;
  }, {})).sort((a, b) => (a.officialGradeTable ?? 99) - (b.officialGradeTable ?? 99) || a.officialCodeFamily.localeCompare(b.officialCodeFamily)),
  taskDenominator: tasks.length,
  taskCountDefinition: '目錄登錄且 subjectId 為 mathematics 的唯一候選任務數；與官方條目分母分開。',
  note: '官方領綱完整項目總數未核實，因此不計算全國數學課綱覆蓋率。代碼族群僅用於分組追蹤，不宣稱它們是官方主題分類名稱。',
};
const priorityGapDefinitions = [
  {
    priority: 1,
    code: 'S-3-4',
    gradeTable: 3,
    learningStage: '第二學習階段（三、四年級）',
    missingLearningContent: '新增螢幕拼片移動／旋轉、兩種平面重組，以及不同六面展開圖的拓樸摺合模擬與面鄰接觀察，對原有方格選片任務形成部分互動證據。仍缺實體剪拼摺紙與教師觀察；活動只作初步操作體驗，不作複雜推理或操作以外紙筆評量。',
    prerequisiteNote: '遊戲分級可先確認圖形辨識與方格操作；這是設計上的先備檢查，不是官方指定年級順序。',
  },
  {
    priority: 2,
    code: 'N-1-5',
    gradeTable: 1,
    learningStage: '第一學習階段（一、二年級）',
    missingLearningContent: '畫面路徑比較只提供模擬；仍需學生以繩、紙條或其他可操作教具直接／間接比較直線與曲線，使用非標準個別單位，並由教師觀察實際操作。此條目不含常用單位。',
    prerequisiteNote: '可先確認學生能對齊起點並沿曲線追蹤；需教師安排真實教具活動。',
  },
  {
    priority: 3,
    code: 'S-5-4',
    gradeTable: 5,
    learningStage: '第三學習階段（五、六年級）',
    missingLearningContent: '已新增方格鏡射，但對稱軸／對稱點以外的對稱邊、對稱角、特殊平面圖形性質與簡單幾何推理尚未驗證；也未有折紙或實體製作。',
    prerequisiteNote: '可先確認學生能描述點到軸的距離；後續邊角性質需教師檢視用語與課程安排。',
  },
  {
    priority: 4,
    code: 'D-5-1',
    gradeTable: 5,
    learningStage: '第三學習階段（五、六年級）',
    missingLearningContent: '折線圖點位建置以模擬資料完成，仍缺學生蒐集生活資料、判斷折線圖使用時機及對資料變化作有根據的推論。',
    prerequisiteNote: '需確認學生能讀取座標軸與資料表；實際資料蒐集建議由教師依課堂資源安排。',
  },
];
const priorityGapQueue = priorityGapDefinitions.map((gap) => {
  const clause = verifiedClauseRows.find(({ code }) => code === gap.code);
  const focus = foci.find((row) => [...(row.contentCodes ?? [])].includes(gap.code));
  return {
    ...gap,
    sourceLocation: clause?.sourceLocation ?? focus?.sourceLocation ?? '目前條目尚無可定位官方原文',
    activityIds: clause?.activityIds ?? focusRows.find(({ focusId }) => focusId === focus?.id)?.mappedActivityIds ?? [],
    evidenceStatus: clause?.coverageStatus ?? (focus ? focusRows.find(({ focusId }) => focusId === focus.id)?.auditStatus : 'needs_verification'),
    evidenceLimit: '活動存在或程式互動通過不等於學習成效；此項為待補教學操作的工程缺口。',
  };
});
const report = {
  schemaVersion: 1,
  reportType: 'math_clause_and_interaction_audit',
  generatedAt: new Date().toISOString(),
  source: {
    sourceId: 'mathematics',
    documentTitle: mathSource.documentTitle,
    url: mathSource.url,
    publicationInfo: mathSource.publicationInfo,
    sourceReviewStatus: mathSource.reviewStatus,
    officialElementaryClauseTotal: null,
    completeInventory: false,
    focusedClausesVerifiedThisRun: focusedAudit.clauses.map(({ code, sourceLocation, reviewStatus }) => ({ code, sourceLocation, reviewStatus })),
    registeredCodeReferences: codeRefs.length,
    registeredLearningContentCodeReferences: contentCodeRefs.length,
    note: '來源中的代碼參照數不是官方條目總數；官方完整數學領綱條目總數尚未逐條核實。',
  },
  activityAudit: {
    uniqueCatalogMathTaskCount: tasks.length,
    previouslyExistingCatalogTaskCountAudited: Math.max(0, tasks.length - 4),
    newlyAddedCatalogTaskCountThisBatch: tasks.filter(({ activityId }) => [
      'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE',
      'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE',
      'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE',
      'ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE',
    ].includes(activityId)).length,
    taskRows,
    supplementaryStandaloneCandidateModuleCount: standaloneMathModules.length,
    supplementaryStandaloneCandidateModules: standaloneMathModules,
    taskCountByProjectGrade: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`grade-${index + 1}`, taskRows.filter(({ gradeId }) => gradeId === `grade-${index + 1}`).length])),
    taskCountByInteractionType: Object.fromEntries([...new Set(taskRows.flatMap(({ interactionTypes }) => interactionTypes))].sort().map((type) => [type, taskRows.filter(({ interactionTypes }) => interactionTypes.includes(type)).length])),
    nonChoiceInteractionTaskCount: taskRows.filter(({ interactionTypes }) => interactionTypes.some((type) => type !== 'choose_response')).length,
    limitation: '逐項檢查任務資料中的學習範圍、實際階段操作、提示與回饋；互動存在只證明程式可操作，不替代教師教學品質判斷或學生學習證據。此任務數只含目錄候選任務，不含獨立舊式學習單元。',
  },
  focusAudit: {
    projectMathFocusCount: foci.length,
    statuses: Object.fromEntries(['interactive_evidence_partial', 'activity_relation_only', 'uncovered_verified_focus', 'needs_verification'].map((status) => [status, focusRows.filter((row) => row.auditStatus === status).length])),
    rows: focusRows,
    limitation: '分母是目前專案登錄的數學焦點，不是官方領綱總條目數。官方總量未核實，不計算全國小數學課綱覆蓋率。',
  },
  clauseBatch: {
    status: focusedAudit.auditStatus,
    exactOfficialClauseCount: focusedAudit.clauses.length,
    rows: focusedAudit.clauses,
    learningPerformanceClauseCount: focusedAudit.learningPerformanceClauses?.length ?? 0,
    learningPerformanceClauses: focusedAudit.learningPerformanceClauses ?? [],
    verifiedOfficialLearningContentClauseCount: verifiedClauseRows.length,
    verifiedLearningContentCount: focusedAudit.clauses.filter(({ clauseType, reviewStatus }) => clauseType === 'learning_content' && /^verified_against_official_pdf/.test(reviewStatus)).length,
    unverifiedLearningContentCount: focusedAudit.clauses.filter(({ clauseType, reviewStatus }) => clauseType === 'learning_content' && !/^verified_against_official_pdf/.test(reviewStatus)).length,
    verifiedOfficialLearningContentClauses: verifiedClauseRows,
    coverageSummary: contentCoverageSummary,
    grade3ContiguousOfficialTableBatch: grade3BatchSummary,
    grade1ContiguousOfficialTableBatch: grade1BatchSummary,
    grade2ContiguousOfficialTableBatch: grade2BatchSummary,
    grade4ContiguousOfficialTableBatch: grade4BatchSummary,
    grade5ContiguousOfficialTableBatch: grade5BatchSummary,
    grade6ContiguousOfficialTableBatch: grade6BatchSummary,
    crossGradeIntegration,
    officialInventoryRemainingIncomplete: focusedAudit.officialInventoryTotal === null,
  },
  priorityGapQueue: {
    basis: '依官方已核實條文與現有活動各階段操作／scope 限制排序；此為專案工程待辦優先順序，不代表官方課程順序。',
    rows: priorityGapQueue,
  },
  activityChecks: {
    candidateStatusViolations: taskRows.filter(({ status }) => status !== 'candidate_pending_teacher_review').map(({ activityId, status }) => ({ activityId, status })),
    brokenMapIds: taskRows.filter(({ curriculumMapId }) => !foci.some(({ id }) => id === curriculumMapId)).map(({ activityId, curriculumMapId }) => ({ activityId, curriculumMapId })),
    missingInteractives: taskRows.filter(({ interactionTypes }) => !interactionTypes.some((type) => type !== 'choose_response')).map(({ activityId }) => activityId),
  },
  officialInventoryTotal: null,
  overallStatus: 'partial_math_clause_audit_full_inventory_incomplete',
};

const errors = [];
if (new Set(tasks.map(({ activityId }) => activityId)).size !== tasks.length) errors.push('duplicate_math_activity_id');
if (new Set(focusedAudit.clauses.map(({ code }) => code)).size !== focusedAudit.clauses.length) errors.push('duplicate_focused_official_code');
if (grade2Batch.clauses.length !== 24 || new Set(grade2BatchCodes).size !== 24) errors.push('grade2_official_table_batch_not_24_unique_rows');
if (!grade2Batch.clauses.every(({ officialText, sourceLocation, officialPerformanceLinks, relationshipKind }) => officialText && sourceLocation && officialPerformanceLinks?.length && relationshipKind === 'explicit_same_table_corresponding_performance')) errors.push('grade2_official_table_row_evidence_incomplete');
if (!grade2BatchSummary.officialPerformanceLinksChecked) errors.push('grade2_official_performance_link_missing');
if (grade3Batch.clauses.length !== 24 || new Set(grade3Batch.clauses.map(({ code }) => code)).size !== 24) errors.push('grade3_official_table_batch_not_24_unique_rows');
if (!grade3Batch.clauses.every(({ officialText, sourceLocation, officialPerformanceLinks, relationshipKind }) => officialText && sourceLocation && officialPerformanceLinks?.length && relationshipKind === 'explicit_same_table_corresponding_performance')) errors.push('grade3_official_table_row_evidence_incomplete');
if (!grade3BatchSummary.officialPerformanceLinksChecked) errors.push('grade3_official_performance_link_missing');
if (grade1Batch.clauses.length !== 11 || new Set(grade1BatchCodes).size !== 11) errors.push('grade1_official_table_batch_not_11_unique_code_rows');
if (!grade1Batch.clauses.every(({ officialText, sourceLocation, officialPerformanceLinks, relationshipKind }) => officialText && sourceLocation && officialPerformanceLinks?.length && relationshipKind === 'explicit_same_table_corresponding_performance')) errors.push('grade1_official_table_row_evidence_incomplete');
if (!grade1BatchSummary.officialPerformanceLinksChecked) errors.push('grade1_official_performance_link_missing');
if (grade4Batch.clauses.length !== 26 || new Set(grade4BatchCodes).size !== 26) errors.push('grade4_official_table_batch_not_26_unique_code_rows');
if (grade4Batch.activityAudit.length !== 26 || new Set(grade4Batch.activityAudit.map(({ code }) => code)).size !== 26 || grade4BatchCodes.some((code) => !grade4Batch.activityAudit.some((row) => row.code === code))) errors.push('grade4_activity_audit_not_one_row_per_official_code');
if (!grade4Batch.clauses.every(({ officialText, officialNotes, sourceLocation, officialPerformanceLinks, relationshipKind }) => officialText && officialNotes !== undefined && sourceLocation && officialPerformanceLinks?.length && relationshipKind === 'explicit_same_table_corresponding_performance')) errors.push('grade4_official_table_row_evidence_incomplete');
if (!grade4BatchSummary.officialPerformanceLinksChecked) errors.push('grade4_official_performance_link_missing');
if (grade5Batch.clauses.length !== 27 || new Set(grade5BatchCodes).size !== 27) errors.push('grade5_official_table_batch_not_27_unique_rows');
if (grade5Batch.activityAudit.length !== 27 || new Set(grade5Batch.activityAudit.map(({ code }) => code)).size !== 27 || grade5BatchCodes.some((code) => !grade5Batch.activityAudit.some((row) => row.code === code))) errors.push('grade5_activity_audit_not_one_row_per_official_code');
if (!grade5Batch.clauses.every(({ officialText, officialNotes, sourceLocation, officialPerformanceLinks, relationshipKind }) => officialText && officialNotes !== undefined && sourceLocation && officialPerformanceLinks?.length && relationshipKind === 'explicit_same_table_corresponding_performance')) errors.push('grade5_official_table_row_evidence_incomplete');
if (!grade5BatchSummary.officialPerformanceLinksChecked) errors.push('grade5_official_performance_link_missing');
for (const row of grade5Batch.activityAudit) {
  if (!grade5BatchCodes.includes(row.code)) errors.push(`grade5_activity_audit_unknown_code:${row.code}`);
  for (const activityId of row.activityIds) {
    if (!tasks.some((task) => task.activityId === activityId)) errors.push(`grade5_activity_audit_missing_task:${row.code}:${activityId}`);
  }
  for (const stageId of row.evidenceStageIds) {
    if (!row.activityIds.some((activityId) => tasks.find((task) => task.activityId === activityId)?.stages.some((stage) => stage.stageId === stageId))) errors.push(`grade5_activity_audit_missing_stage:${row.code}:${stageId}`);
  }
}
if (grade6Batch.clauses.length !== 19 || new Set(grade6BatchCodes).size !== 19 || grade6BatchSummary.uniqueConceptCount !== 18) errors.push('grade6_official_table_batch_not_19_codes_18_concepts');
if (grade6Batch.activityAudit.length !== 19 || new Set(grade6Batch.activityAudit.map(({ code }) => code)).size !== 19 || grade6BatchCodes.some((code) => !grade6Batch.activityAudit.some((row) => row.code === code))) errors.push('grade6_activity_audit_not_one_row_per_official_code');
if (!grade6Batch.clauses.every(({ officialText, officialNotes, sourceLocation, officialPerformanceLinks, relationshipKind }) => officialText && officialNotes !== undefined && sourceLocation?.includes('PDF頁序') && officialPerformanceLinks?.length && relationshipKind === 'explicit_same_table_corresponding_performance')) errors.push('grade6_official_table_row_evidence_incomplete');
if (!grade6BatchSummary.officialPerformanceLinksChecked) errors.push('grade6_official_performance_link_missing');
for (const row of grade6Batch.activityAudit) {
  if (!grade6BatchCodes.includes(row.code)) errors.push(`grade6_activity_audit_unknown_code:${row.code}`);
  for (const activityId of row.activityIds) {
    if (!tasks.some((task) => task.activityId === activityId)) errors.push(`grade6_activity_audit_missing_task:${row.code}:${activityId}`);
  }
  for (const stageId of row.evidenceStageIds) {
    if (!row.activityIds.some((activityId) => tasks.find((task) => task.activityId === activityId)?.stages.some((stage) => stage.stageId === stageId))) errors.push(`grade6_activity_audit_missing_stage:${row.code}:${stageId}`);
  }
}
for (const batch of [grade4Batch, grade5Batch, grade6Batch]) {
  for (const row of batch.activityAudit ?? []) {
    if (!batch.clauses.some(({ code }) => code === row.code)) errors.push(`batch_activity_audit_unknown_code:${batch.batchId}:${row.code}`);
    const validActivityIds = (row.activityIds ?? []).filter((activityId) => byId.has(activityId));
    for (const activityId of row.activityIds ?? []) if (!byId.has(activityId)) errors.push(`batch_activity_audit_missing_task:${batch.batchId}:${row.code}:${activityId}`);
    for (const stageId of row.evidenceStageIds ?? []) if (!validActivityIds.some((activityId) => byId.get(activityId).stages.some((stage) => stage.stageId === stageId))) errors.push(`batch_activity_audit_missing_stage:${batch.batchId}:${row.code}:${stageId}`);
    if (row.status === 'partial' && !(row.evidenceStageIds ?? []).length) errors.push(`batch_partial_without_interaction_stage:${batch.batchId}:${row.code}`);
    const computed = verifiedClauseRows.find(({ code }) => code === row.code)?.coverageStatus;
    if (computed && computed !== row.status) errors.push(`batch_activity_audit_status_disagrees_with_recomputed_evidence:${batch.batchId}:${row.code}:${row.status}:${computed}`);
  }
}
if (grade4BatchSummary.uniqueConceptCount !== 25) errors.push('grade4_concept_count_should_only_deduplicate_official_alias');
if (crossGradeIntegration.officialCodeRowCount !== 131 || crossGradeIntegration.uniqueOfficialCodeCount !== 131 || crossGradeIntegration.explicitlyDeduplicatedConceptCount !== 128) errors.push('cross_grade_batch_row_or_alias_concept_count_mismatch');
if (crossGradeIntegration.countByActivityEvidence.partial + crossGradeIntegration.countByActivityEvidence.relation_only + crossGradeIntegration.countByActivityEvidence.uncovered + crossGradeIntegration.countByActivityEvidence.needs_verification !== crossGradeIntegration.officialCodeRowCount) errors.push('cross_grade_coverage_status_counts_do_not_sum_to_batch_rows');
for (const row of crossGradeIntegration.rows) {
  if (!row.officialText || !row.sourceLocation?.includes('PDF頁序')) errors.push(`cross_grade_row_missing_official_trace:${row.code}`);
  for (const activityId of row.mappedActivityIds) if (!byId.has(activityId)) errors.push(`cross_grade_row_missing_activity:${row.code}:${activityId}`);
}
if (report.activityChecks.candidateStatusViolations.length) errors.push('non_candidate_math_task_found');
if (report.activityChecks.brokenMapIds.length) errors.push('math_task_curriculum_map_id_not_found');
for (const row of taskRows) {
  if (!row.catalogLaunch) errors.push(`math_task_missing_grade_catalog_launch:${row.activityId}`);
  else {
    if (!row.catalogLaunch.runtimeModule || row.catalogLaunch.runtimeModule.endsWith('/undefined')) errors.push(`math_task_invalid_grade_catalog_runtime_module:${row.activityId}`);
    if (row.catalogLaunch.entryRoute?.kind !== 'learning_task' || row.catalogLaunch.entryRoute?.targetScreen !== 'catalog-task') errors.push(`math_task_invalid_grade_catalog_route:${row.activityId}`);
  }
}
for (const clause of focusedAudit.clauses) {
  if (!mathSource.verifiedClauses.includes(clause.code)) errors.push(`clause_missing_from_source_registry:${clause.code}`);
  if (clause.reviewStatus !== 'verified_against_official_pdf_this_run' || !clause.officialText || !clause.sourceLocation) errors.push(`clause_evidence_incomplete:${clause.code}`);
}
for (const clause of focusedAudit.learningPerformanceClauses ?? []) {
  if (!mathSource.verifiedClauses.includes(clause.code)) errors.push(`performance_clause_missing_from_source_registry:${clause.code}`);
  if (clause.reviewStatus !== 'verified_against_official_pdf_this_run' || !clause.officialText || !clause.sourceLocation) errors.push(`performance_clause_evidence_incomplete:${clause.code}`);
}

if (process.argv.includes('--write')) {
  const output = path.join(root, 'artifacts', 'math-curriculum-audit-report.json');
  fs.writeFileSync(output, `${JSON.stringify({ ...report, validation: { status: errors.length ? 'failed' : 'passed', errors } }, null, 2)}\n`);
  console.log(JSON.stringify({ output: path.relative(root, output), validation: errors.length ? 'failed' : 'passed', errors, source: report.source, activityCount: tasks.length, focusStatuses: report.focusAudit.statuses }, null, 2));
} else {
  console.log(JSON.stringify({ validation: errors.length ? 'failed' : 'passed', errors, source: report.source, activityCount: tasks.length, focusStatuses: report.focusAudit.statuses }, null, 2));
}
if (errors.length) process.exitCode = 1;
