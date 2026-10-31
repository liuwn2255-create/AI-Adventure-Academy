import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG, SUBJECT_DEFINITIONS } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';
import { ADDITION_SUBTRACTION_LEARNING_UNIT } from '../prototype/data/additionSubtractionLearningUnit.js';
import { CAPACITY_READING_LEARNING_UNIT } from '../prototype/data/capacityReadingLearningUnit.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from '../prototype/data/fractionTreasureLearningUnit.js';
import { INTEGER_NUMBER_LINE_LEARNING_UNIT } from '../prototype/data/integerNumberLineLearningUnit.js';
import { MILLIMETER_RULER_LEARNING_UNIT } from '../prototype/data/millimeterRulerLearningUnit.js';
import { NUMBER_SECRET_LEARNING_UNIT } from '../prototype/data/numberSecretLearningUnit.js';
import { NUMBER_COMPARISON_LEARNING_UNIT } from '../prototype/data/numberComparisonLearningUnit.js';
import { SQUARE_CENTIMETER_AREA_LEARNING_UNIT } from '../prototype/data/squareCentimeterAreaLearningUnit.js';
import { WEIGHT_KG_G_LEARNING_UNIT } from '../prototype/data/weightKgGLearningUnit.js';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from '../prototype/data/learningSubitemExpansionTasks.js';
import { LEARNING_SUBITEM_GAP_TASKS } from '../prototype/data/learningSubitemGapTasks.js';
import { buildOfficialLearningItemCrosswalk, validateOfficialLearningItemCrosswalk } from './official-learning-item-activity-crosswalk.mjs';
import { GRADE3_MATH_DATA_EXPANSION_TASKS } from '../prototype/data/grade3MathDataExpansionTasks.js';
import { EARLY_GRADE_CURRICULUM_GAP_TASKS } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';
import { validateLearningTask } from '../prototype/learningTaskEngine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(root, 'curriculum/curriculum-map.json');
const sourcePath = path.join(root, 'curriculum/sources.json');
const subitemDefinitionPath = path.join(root, 'curriculum/learning-subitem-definitions.json');
const officialLanguageCodeIndexPath = path.join(root, 'curriculum/official-language-code-index.json');
const browserAcceptancePath = path.join(root, 'artifacts/learning-subitems-browser-acceptance/report.json');
const grade6CandidateBrowserAcceptancePath = path.join(root, 'artifacts/grade6-candidate-browser-acceptance/acceptance-report.json');
const outputPath = path.join(root, 'curriculum/coverage-inventory.json');
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8'));

function browserReportFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return browserReportFiles(filename);
    return entry.isFile() && entry.name.endsWith('.json') ? [filename] : [];
  });
}

function defaultBrowserAcceptance() {
  const reportFiles = [browserAcceptancePath, grade6CandidateBrowserAcceptancePath,
    ...browserReportFiles(path.join(path.dirname(browserAcceptancePath), 'history')),
    ...browserReportFiles(path.join(path.dirname(browserAcceptancePath), 'runs')),
  ].filter((filename) => fs.existsSync(filename));
  if (!reportFiles.length) return null;
  const reportsById = new Map();
  for (const filename of reportFiles) {
    const report = readJson(filename);
    report.evidenceSourcePath = path.relative(root, filename).replaceAll('\\', '/');
    const reportId = report.reportId ?? report.evidenceSourcePath;
    if (!reportsById.has(reportId)) reportsById.set(reportId, report);
  }
  return [...reportsById.values()].sort((a, b) => String(a.executedAt ?? '').localeCompare(String(b.executedAt ?? '')));
}

function verifiedBrowserAcceptanceByActivity(reportOrReports) {
  const verified = new Map();
  const requiredViewports = ['1366x768', '390x844', '340x740'];
  const reports = (Array.isArray(reportOrReports) ? reportOrReports : [reportOrReports]).filter(Boolean);
  for (const report of reports) {
    if (report?.status !== 'passed' || report?.evidenceType !== 'isolated_browser_acceptance' || !report.browser || !report.executedAt) continue;
    if (!/^https?:\/\/127\.0\.0\.1:(?!4175(?:\/|$)|4176(?:\/|$))\d+\//u.test(report.source ?? '')) continue;
    if (!Array.isArray(report.viewports) || !requiredViewports.every((viewport) => report.viewports.some((row) => row.viewport === viewport && row.status === 'passed'))) continue;
    const invalidViewport = report.viewports.some((viewport) => viewport.status !== 'passed' || viewport.localStorageUnchanged !== true || viewport.horizontalOverflowAny !== false
      || viewport.consoleErrors?.length || viewport.requestFailures?.length || viewport.httpErrors?.length);
    if (invalidViewport) continue;
    const taskIds = new Set(report.viewports.flatMap((viewport) => viewport.tasks?.map((task) => task.activityId) ?? []));
    for (const activityId of taskIds) {
      const perViewport = report.viewports.map((viewport) => viewport.tasks?.find((task) => task.activityId === activityId));
      const validTask = perViewport.every((task) => task?.status === 'passed'
        && task.stageCount > 0 && task.stages?.length === task.stageCount
        && task.stages.every((stage) => stage.hintLevels?.length === 2
          && stage.hintLevels[0].startsWith('提示 1：') && stage.hintLevels[1].startsWith('提示 2：')
          && Boolean(stage.wrongAnswer) && Boolean(stage.retry) && Boolean(stage.correctAnswer))
        && task.completion?.includes('候選任務完成！')
        && task.replay?.startsWith('passed') && task.returnToCatalog === 'passed');
      if (!validTask) continue;
      verified.set(activityId, {
        evidenceId: report.reportId,
        source: report.evidenceSourcePath ?? path.relative(root, browserAcceptancePath).replaceAll('\\', '/'),
        browser: report.browser,
        origin: report.source,
        executedAt: report.executedAt,
        viewports: requiredViewports,
        result: '通過實際提示、錯答、重試、正答、完成、重玩與返回目錄操作；不代表教師審查或學習成效。',
      });
    }
  }
  return verified;
}

const STANDALONE_MATH_UNITS = Object.freeze([
  ADDITION_SUBTRACTION_LEARNING_UNIT,
  CAPACITY_READING_LEARNING_UNIT,
  FRACTION_TREASURE_LEARNING_UNIT,
  INTEGER_NUMBER_LINE_LEARNING_UNIT,
  MILLIMETER_RULER_LEARNING_UNIT,
  NUMBER_SECRET_LEARNING_UNIT,
  NUMBER_COMPARISON_LEARNING_UNIT,
  SQUARE_CENTIMETER_AREA_LEARNING_UNIT,
  WEIGHT_KG_G_LEARNING_UNIT,
]);
const STANDALONE_UNIT_MODULES = Object.freeze({
  'math-addition-subtraction-vertical-candidate': 'prototype/data/additionSubtractionLearningUnit.js',
  'math-capacity-candidate': 'prototype/data/capacityReadingLearningUnit.js',
  'math-fraction-treasure-same-denominator-candidate': 'prototype/data/fractionTreasureLearningUnit.js',
  'math-integer-number-line-candidate': 'prototype/data/integerNumberLineLearningUnit.js',
  'math-length-millimeter-candidate': 'prototype/data/millimeterRulerLearningUnit.js',
  'math-place-value-demo': 'prototype/data/numberSecretLearningUnit.js',
  'number-secret-challenge': 'prototype/data/numberSecretLearningUnit.js',
  'math-number-comparison-candidate': 'prototype/data/numberComparisonLearningUnit.js',
  'math-area-square-centimeter-candidate': 'prototype/data/squareCentimeterAreaLearningUnit.js',
  'math-weight-kg-g-candidate': 'prototype/data/weightKgGLearningUnit.js',
});
const STANDALONE_UNIT_BY_LEVEL = new Map([
  ...STANDALONE_MATH_UNITS.filter((unit) => unit.levelId).map((unit) => [unit.levelId, unit]),
  ['math-place-value-demo', NUMBER_SECRET_LEARNING_UNIT],
  ['number-secret-challenge', NUMBER_SECRET_LEARNING_UNIT],
]);

const NON_ELEMENTARY_SUBJECT_GUIDELINE_FAMILIES = new Set([
  'technology-formal-guideline',
  'national-defense-education-scope',
]);
const NON_GUIDELINE_FAMILIES = new Set([
  'general-guidelines',
  'elementary-technology-reference',
  'cross-cutting-issues',
]);

function buildSourceInventorySummary(sources) {
  const inventory = sources.sourceInventory;
  const families = inventory?.documentFamilies ?? [];
  const sourceById = new Map((sources.sources ?? []).map((source) => [source.id, source]));
  let officialLanguageCodeIndex = null;
  try { officialLanguageCodeIndex = readJson(officialLanguageCodeIndexPath); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (officialLanguageCodeIndex) {
    if (!Array.isArray(officialLanguageCodeIndex.documents)) throw new Error('Official language code index must contain document records');
    const seenSources = new Set();
    for (const document of officialLanguageCodeIndex.documents) {
      const source = sourceById.get(document.sourceId);
      if (!source || seenSources.has(document.sourceId)) throw new Error(`Official language code index has missing/duplicate source ${document.sourceId}`);
      seenSources.add(document.sourceId);
      if (source.codeIndexFile !== 'curriculum/official-language-code-index.json'
        || !Array.isArray(document.elementaryCodeReferences)
        || document.elementaryStageCodeReferenceCount !== document.elementaryCodeReferences.length) {
        throw new Error(`Official language code index is inconsistent with source ${document.sourceId}`);
      }
      const seenCodes = new Set();
      for (const reference of document.elementaryCodeReferences) {
        if (seenCodes.has(reference.code)) throw new Error(`Duplicate extracted code ${reference.code} in ${document.sourceId}`);
        seenCodes.add(reference.code);
        if (!['first', 'second', 'third'].includes(reference.learningStage)
          || !Array.isArray(reference.pdfPages) || reference.pdfPages.length === 0
          || reference.pdfPages.some((page) => !Number.isInteger(page) || page < 1 || page > document.pdfPageCount)
          || !Array.isArray(reference.sections) || reference.sections.some((section) => !['learning_performance', 'learning_content'].includes(section))) {
          throw new Error(`Invalid extracted code locator ${reference.code} in ${document.sourceId}`);
        }
      }
    }
  }
  const extractedCodeCountsBySource = new Map((officialLanguageCodeIndex?.documents ?? []).map((document) => [
    document.sourceId,
    document.elementaryStageCodeReferenceCount ?? document.elementaryCodeReferences?.length ?? 0,
  ]));
  const familyRows = families.map((family) => {
    const sourceRows = (family.sourceIds ?? []).map((id) => sourceById.get(id)).filter(Boolean);
    const missingSourceIds = (family.sourceIds ?? []).filter((id) => !sourceById.has(id));
    const isGuideline = !NON_GUIDELINE_FAMILIES.has(family.id);
    const elementaryDenominatorEligible = isGuideline && !NON_ELEMENTARY_SUBJECT_GUIDELINE_FAMILIES.has(family.id);
    const verifiedClauseCount = sourceRows.reduce((sum, source) => sum + (source.verifiedClauses?.length ?? 0), 0);
    return {
      familyId: family.id,
      domain: family.domain,
      inventoryCategory: !isGuideline ? 'framework_or_reference_not_clause_denominator'
        : elementaryDenominatorEligible ? 'elementary_formal_guideline'
          : 'formal_document_not_elementary_standalone_denominator',
      elementaryDenominatorEligible,
      expected: family.expected === true,
      documentStatus: family.documentStatus ?? 'status_not_recorded',
      clauseEnumerationStatus: family.clauseEnumerationStatus ?? 'status_not_recorded',
      verifiedLocation: family.verifiedLocation ?? null,
      elementaryApplicability: family.elementaryApplicability ?? '待核實',
      sourceIds: family.sourceIds ?? [],
      sourceRecordCount: sourceRows.length,
      missingSourceIds,
      registeredVerifiedClauseReferences: verifiedClauseCount,
      notes: family.notes ?? '',
    };
  });
  const applicableFamilies = familyRows.filter((row) => row.expected && row.elementaryDenominatorEligible);
  const familyStatusCounts = (rows, key) => Object.fromEntries([...new Set(rows.map((row) => row[key]))].sort().map((status) => [status, rows.filter((row) => row[key] === status).length]));
  const sourceClauseRows = (sources.sources ?? []).map((source) => ({
    sourceId: source.id,
    documentTitle: source.documentTitle,
    url: source.url,
    reviewStatus: source.reviewStatus ?? 'status_not_recorded',
    publicationInfo: source.publicationInfo ?? null,
    pageOrSection: source.pageOrSection ?? null,
    verifiedClauseCount: source.verifiedClauses?.length ?? 0,
      extractedElementaryCodeIndexCount: extractedCodeCountsBySource.get(source.id) ?? 0,
      extractedCodeIndexStatus: source.codeIndexStatus ?? null,
    enumerationStatus: familyRows.filter((family) => family.sourceIds.includes(source.id)).map((family) => family.clauseEnumerationStatus),
    fullClauseEnumeration: familyRows.some((family) => family.sourceIds.includes(source.id) && family.clauseEnumerationStatus === 'fully_enumerated'),
  }));
  return {
    status: inventory?.status ?? 'source_inventory_not_recorded',
    lastReviewed: inventory?.lastReviewed ?? null,
    expectedElementaryFormalDocumentFamilyCount: applicableFamilies.length,
    expectedElementaryFormalDocumentFamiliesLocated: applicableFamilies.filter((row) => ['verified_document', 'official_reference_located'].includes(row.documentStatus)).length,
    expectedElementaryFormalDocumentFamiliesNotRetrieved: applicableFamilies.filter((row) => /not_retrieved|fetch_failed|unresolved/i.test(row.documentStatus)).map(({ familyId, domain, documentStatus, sourceIds, notes }) => ({ familyId, domain, documentStatus, sourceIds, notes })),
    documentStatusCounts: familyStatusCounts(familyRows.filter((row) => row.expected), 'documentStatus'),
    clauseEnumerationStatusCounts: familyStatusCounts(applicableFamilies, 'clauseEnumerationStatus'),
    sourceRecords: sourceClauseRows,
    documentFamilies: familyRows,
    clauseEnumeration: {
      completeElementaryFormalDocuments: sourceClauseRows.filter((row) => row.fullClauseEnumeration).length,
      partialOrUnenumeratedElementaryDocuments: applicableFamilies.filter((family) => family.clauseEnumerationStatus !== 'fully_enumerated').length,
      registeredVerifiedClauseReferences: sourceClauseRows.reduce((sum, row) => sum + row.verifiedClauseCount, 0),
      registeredUniqueVerifiedCodeCount: [...new Set((sources.sources ?? []).flatMap((source) => source.verifiedClauses ?? []))].length,
      extractedElementaryCodeIndexReferenceCount: [...extractedCodeCountsBySource.values()].reduce((sum, count) => sum + count, 0),
      extractedElementaryCodeIndexDocuments: (officialLanguageCodeIndex?.documents ?? []).map((document) => ({
        sourceId: document.sourceId,
        pdfPageCount: document.pdfPageCount,
        learningPerformancePageRange: document.learningPerformancePageRange,
        learningContentPageRange: document.learningContentPageRange,
        elementaryStageCodeReferenceCount: document.elementaryStageCodeReferenceCount,
        status: officialLanguageCodeIndex.extractionStatus,
      })),
      codeIndexWarning: officialLanguageCodeIndex?.method ?? '未建立官方PDF文字擷取代碼索引；不得推估代碼或條目總數。',
      unenumeratedDocuments: applicableFamilies.filter((family) => family.clauseEnumerationStatus !== 'fully_enumerated').map(({ familyId, domain, sourceIds, clauseEnumerationStatus, notes }) => ({ familyId, domain, sourceIds, clauseEnumerationStatus, notes })),
      warning: '已核對代碼數是抽樣／已登錄代碼數；官方文件未逐條枚舉前，不存在全國小官方細目分母。',
    },
    exclusions: {
      nonElementaryStandaloneFormalDocuments: familyRows.filter((row) => row.expected && NON_ELEMENTARY_SUBJECT_GUIDELINE_FAMILIES.has(row.familyId)).map(({ familyId, domain, elementaryApplicability, verifiedLocation }) => ({ familyId, domain, elementaryApplicability, verifiedLocation })),
      frameworkOrReferenceOnly: familyRows.filter((row) => row.expected && NON_GUIDELINE_FAMILIES.has(row.familyId)).map(({ familyId, domain, elementaryApplicability, verifiedLocation }) => ({ familyId, domain, elementaryApplicability, verifiedLocation })),
      rule: '排除科技領域正式課綱作為國小獨立領域分母、全民國防（總綱表4不列國小部定科目）、總綱框架、跨領域議題及科技教育參考文件；生活課程列第一學習階段一次，跨域課程不另加一份科目分母。',
    },
  };
}

function assessCatalogTaskPlayability(task, browserEvidenceByActivity = new Map()) {
  const schemaErrors = validateLearningTask(task);
  const stages = task.stages ?? [];
  const stageFlowComplete = stages.length > 0 && stages.every((stage) =>
    Array.isArray(stage.hints) && stage.hints.length >= 2
    && Boolean(stage.incorrectFeedback?.text ?? stage.incorrectFeedback)
    && Boolean(stage.correctFeedback?.text ?? stage.correctFeedback));
  return {
    activityId: task.activityId,
    gradeId: task.gradeId,
    subjectId: task.subjectId,
    status: task.status,
    taskStageCount: stages.length,
    supportedBySharedEngine: schemaErrors.length === 0,
    schemaErrors,
    hasTwoLayerHintsAndFeedback: stageFlowComplete,
    interactionTypes: [...new Set(stages.map((stage) => stage.interaction))],
    browserVerification: browserEvidenceByActivity.get(task.activityId) ?? null,
    browserVerified: browserEvidenceByActivity.has(task.activityId),
    runtimeEvidenceStatus: schemaErrors.length === 0 && stageFlowComplete
      ? browserEvidenceByActivity.has(task.activityId) ? 'shared_engine_schema_and_flow_data_and_browser_verified'
        : 'shared_engine_schema_and_flow_data_valid_browser_not_verified'
      : 'not_confirmed_playable',
    limitation: '靜態引擎 schema／任務資料驗證不是瀏覽器操作驗收、教師審查或學習成效證據。',
  };
}

function relationActivitiesByMapId() {
  const index = new Map();
  for (const relation of LEARNING_TASK_RELATIONS) {
    for (const objective of relation.objectiveDefinitions ?? []) {
      const links = relation.learningObjectiveTaskLinks?.find((entry) => entry.learningObjectiveId === objective.objectiveId)?.taskIds ?? [];
      for (const mapId of objective.curriculumMapIds ?? []) {
        const activities = index.get(mapId) ?? [];
        activities.push(...links.map((activityId) => ({ activityId, gradeId: relation.gradeId, subjectId: relation.subjectId, status: 'candidate_relation' })));
        index.set(mapId, activities);
      }
    }
    for (const task of relation.tasks ?? []) {
      const ids = [task.curriculumMapId, ...(task.relatedCurriculumMapIds ?? [])].filter(Boolean);
      for (const mapId of ids) {
        const activities = index.get(mapId) ?? [];
        activities.push({ activityId: task.taskId, gradeId: relation.gradeId, subjectId: relation.subjectId, status: task.status ?? 'linked_task' });
        index.set(mapId, activities);
      }
    }
  }
  for (const task of CATALOG_CANDIDATE_TASKS) {
    for (const mapId of [task.curriculumMapId, ...(task.relatedCurriculumMapIds ?? [])].filter(Boolean)) {
      const activities = index.get(mapId) ?? [];
      activities.push({ activityId: task.activityId, gradeId: task.gradeId, subjectId: task.subjectId, status: task.status });
      index.set(mapId, activities);
    }
  }
  const levelById = new Map(MATH_LEVEL_DIRECTORY.map((level) => [level.levelId, level]));
  for (const unit of STANDALONE_MATH_UNITS) {
    const level = levelById.get(unit.levelId);
    const mapIds = unit.curriculum?.curriculumMapIds ?? level?.curriculumReferences?.curriculumMapIds ?? [];
    for (const mapId of mapIds) {
      const activities = index.get(mapId) ?? [];
      activities.push({
        activityId: unit.activityId,
        gradeId: 'grade-3',
        subjectId: 'mathematics',
        status: unit.status ?? 'candidate_pending_teacher_review',
        activityKind: 'standalone_candidate_learning_unit',
        runtimeModule: STANDALONE_UNIT_MODULES[unit.levelId] ?? null,
        runtimeAvailability: level?.runtime?.availability ?? 'module_only',
        hasExecutableQuestionData: Array.isArray(unit.questions) && unit.questions.length > 0,
      });
      index.set(mapId, activities);
    }
  }
  return new Map([...index].map(([id, items]) => [id, [...new Map(items.map((item) => [`${item.gradeId}|${item.activityId}`, item])).values()]]));
}

function splitRegisteredLearningText(text) {
  return String(text ?? '').split(/[；;。]/u).map((part) => part.trim()).filter(Boolean);
}

function buildLearningSubitemAudit(focuses, sources, activitiesByMapId, catalogPlayabilityRows) {
  const definitions = readJson(subitemDefinitionPath);
  const sourceById = new Map((sources.sources ?? []).map((source) => [source.id, source]));
  const focusById = new Map(focuses.map((focus) => [focus.id, focus]));
  const taskById = new Map(CATALOG_CANDIDATE_TASKS.map((task) => [task.activityId, task]));
  const playabilityById = new Map(catalogPlayabilityRows.map((task) => [task.activityId, task]));
  const subitemIds = new Set();
  for (const definition of definitions.definitions ?? []) {
    if (!definition.subitemId || subitemIds.has(definition.subitemId)) throw new Error(`Missing or duplicate learning subitem ID: ${definition.subitemId}`);
    subitemIds.add(definition.subitemId);
    const focus = focusById.get(definition.focusId);
    if (!focus) throw new Error(`${definition.subitemId}: unknown focus ${definition.focusId}`);
    const registeredCodes = [...(focus.contentCodes ?? []), ...(focus.performanceCodes ?? [])];
    if (!registeredCodes.includes(definition.officialCode)) throw new Error(`${definition.subitemId}: official code is not registered on ${definition.focusId}`);
    if (!definition.sourceRef?.sourceId || !definition.sourceRef?.pageOrSection || !definition.projectSubitem || !definition.decompositionKind) throw new Error(`${definition.subitemId}: traceable source and project decomposition are required`);
    for (const activityId of definition.activityIds ?? []) {
      const task = taskById.get(activityId);
      if (!task || !(task.learningSubitemClaims ?? []).includes(definition.subitemId)) throw new Error(`${definition.subitemId}: task claim missing for ${activityId}`);
      if (task.curriculumMapId !== definition.focusId && !(task.relatedCurriculumMapIds ?? []).includes(definition.focusId)) throw new Error(`${definition.subitemId}: task ${activityId} does not link curriculum focus ${definition.focusId}`);
      const evidenceStageIds = definition.evidenceStageIds ?? [];
      const taskStageIds = new Set(task.stages.map(({ stageId }) => stageId));
      if (!evidenceStageIds.length || evidenceStageIds.some((stageId) => !taskStageIds.has(stageId))) throw new Error(`${definition.subitemId}: explicit activity evidence stages missing or unknown for ${activityId}`);
    }
  }

  const rows = focuses.map((focus) => {
    const source = sourceById.get(focus.sourceId);
    const officialVerified = /^verified_against_official_(?:text|pdf)/.test(focus.officialTextReviewStatus ?? '')
      && Boolean(source?.verifiedClauses)
      && [...(focus.contentCodes ?? []), ...(focus.performanceCodes ?? [])].every((code) => source.verifiedClauses.includes(code));
    const curated = (definitions.definitions ?? []).filter((item) => item.focusId === focus.id);
    const contentTexts = focus.contentTexts ?? [];
    const contentPieces = contentTexts.flatMap((text, textIndex) => splitRegisteredLearningText(text).map((piece, pieceIndex) => ({
      subitemId: `DERIVED:${focus.id}:content:${textIndex + 1}:${pieceIndex + 1}`,
      text: piece,
      sourceCodes: focus.contentCodes ?? [],
      sourceTextKind: focus.contentTextKind ?? 'registered_text_kind_not_recorded',
      decompositionKind: 'project_decomposition_from_registered_content_text_not_official_subclause',
      directlyQuotedOfficialText: false,
      reviewStatus: officialVerified ? 'derived_from_verified_focus_text_not_independently_verified_as_official_subclause' : 'needs_verification',
    })));
    const performancePieces = (focus.performanceTexts ?? []).flatMap((text, textIndex) => splitRegisteredLearningText(text).map((piece, pieceIndex) => ({
      subitemId: `DERIVED:${focus.id}:performance:${textIndex + 1}:${pieceIndex + 1}`,
      text: piece,
      sourceCodes: focus.performanceCodes ?? [],
      sourceTextKind: 'registered_learning_performance_text_kind_not_independently_classified',
      decompositionKind: 'project_decomposition_from_registered_performance_text_not_official_subclause',
      directlyQuotedOfficialText: false,
      reviewStatus: officialVerified ? 'derived_from_verified_focus_text_not_independently_verified_as_official_subclause' : 'needs_verification',
    })));
    const linkedActivities = activitiesByMapId.get(focus.id) ?? [];
    const scopedLinkedActivities = linkedActivities.filter((task) => !focus.gradeRange
      || (Number(task.gradeId.slice(-1)) >= focus.gradeRange[0]
        && Number(task.gradeId.slice(-1)) <= focus.gradeRange[1]));
    const activityAudit = [...new Map(scopedLinkedActivities.map((link) => [link.activityId, link])).values()].map((link) => {
      const task = taskById.get(link.activityId);
      const playability = playabilityById.get(link.activityId);
      return {
        activityId: link.activityId,
        status: link.status,
        gradeId: link.gradeId,
        subjectId: link.subjectId,
        interactionTypes: task ? [...new Set(task.stages.map((stage) => stage.interaction))] : [],
        stageEvidence: task ? task.stages.map(({ stageId, interaction, prompt }) => ({ stageId, interaction, learnerAction: prompt })) : [],
        objective: task?.learningObjective?.statement ?? null,
        hasExplicitSubitemClaims: Boolean(task?.learningSubitemClaims?.length),
        explicitSubitemClaims: task?.learningSubitemClaims ?? [],
        staticEngineValidation: playability?.runtimeEvidenceStatus ?? 'activity_reference_only_runtime_detail_unavailable',
        browserVerified: playability?.browserVerified ?? false,
        browserVerificationEvidence: playability?.browserVerification ?? null,
        limitation: task ? '任務步驟與引擎互動型態是靜態程式證據；不代表瀏覽器驗收、教師審查或學習成效。' : '目錄關聯存在，但目前未取得可映射至共用引擎各步驟的資料。',
      };
    });
    const evidenceStageIdsBySubitem = new Map();
    for (const item of curated) {
      const validActivities = (item.activityIds ?? []).filter((activityId) => {
        const task = taskById.get(activityId);
        const referencedStages = item.evidenceStageIds ?? [];
        const stages = task?.stages?.filter(({ stageId }) => referencedStages.includes(stageId)) ?? [];
        return task?.learningSubitemClaims?.includes(item.subitemId)
          && stages.length === referencedStages.length
          && stages.some(({ interaction }) => interaction !== 'choose_response');
      });
      evidenceStageIdsBySubitem.set(item.subitemId, validActivities);
    }
    const matchingCuratedSubitems = curated.filter((item) => evidenceStageIdsBySubitem.get(item.subitemId)?.length);
    const linked = activityAudit.length > 0;
    let evidenceStatus;
    if (!officialVerified) evidenceStatus = 'needs_verification';
    else if (!linked) evidenceStatus = 'uncovered';
    else if (matchingCuratedSubitems.length) evidenceStatus = 'interactive_candidate_subitem_coverage';
    else evidenceStatus = 'associated_only_no_explicit_subitem_evidence';
    const originTextKind = focus.contentTextKind ?? 'registered_text_kind_not_recorded';
    return {
      focusId: focus.id,
      subject: focus.subject,
      gradeRange: focus.gradeRange ?? null,
      learningStage: focus.learningStage ?? focus.stagePerformanceRange ?? null,
      officialSource: {
        sourceId: focus.sourceId ?? null,
        documentTitle: focus.documentTitle ?? source?.documentTitle ?? null,
        url: focus.sourceUrl ?? source?.url ?? null,
        pageOrSection: focus.pageOrSection ?? null,
        codeVerificationStatus: officialVerified ? 'registered_codes_and_text_kind_checked_in_existing_curriculum_registry' : 'needs_verification',
        contentCodes: focus.contentCodes ?? [],
        performanceCodes: focus.performanceCodes ?? [],
        contentTexts: contentTexts.map((text) => ({ text, textKind: originTextKind, verbatimStatus: originTextKind.includes('quoted') || originTextKind === 'official_clause' ? 'source_registry_labels_as_clause_check_source_pdf_before_quoting' : 'not_claimed_as_verbatim' })),
        performanceTexts: focus.performanceTexts ?? [],
      },
      registeredFocus: focus.focus,
      projectDerivedSubitems: [...contentPieces, ...performancePieces],
      curatedProjectSubitems: curated.map((item) => {
        const itemSource = sourceById.get(item.sourceRef?.sourceId);
        const officialClauseVerified = Boolean(itemSource?.verifiedClauses?.includes(item.officialCode) && item.sourceRef?.pageOrSection);
        const evidenceActivities = evidenceStageIdsBySubitem.get(item.subitemId) ?? [];
        return {
          ...item,
          officialClauseEvidenceStatus: officialClauseVerified ? 'verified_code_and_source_location' : 'needs_verification',
          explicitActivityLinkStatus: evidenceActivities.length ? 'task_claim_and_interaction_stages_present' : 'claim_without_valid_interaction_evidence',
          evidenceActivityIds: evidenceActivities,
          evidenceStageIds: item.evidenceStageIds ?? [],
        };
      }),
      activityAudit,
      decompositionStatus: curated.length ? 'curated_project_decomposition_for_selected_gap' : (contentPieces.length + performancePieces.length) ? 'text_split_for_review_not_curated_or_official_subclauses' : 'focus_not_decomposed_missing_registered_text',
      evidenceStatus,
      coveredProjectSubitemIds: matchingCuratedSubitems.map((item) => item.subitemId),
      notYetCovered: curated.filter((item) => !matchingCuratedSubitems.some(({ subitemId }) => subitemId === item.subitemId)).map((item) => item.subitemId),
      unknownOfficialSubitems: !officialVerified || !curated.length,
      remainingLimitations: [
        ...(focus.coverageLimitations ?? focus.missingEvidence ?? []),
        ...(curated.length ? ['本輪專案子項是候選教學操作範圍，不代表官方條文已完整拆解或教師確認。'] : ['此焦點目前只有登錄文字的機械切分／整體摘要，尚未完成逐子項人工核對與可驗證活動目標對照。']),
      ],
    };
  });
  const counts = Object.fromEntries(['interactive_candidate_subitem_coverage', 'associated_only_no_explicit_subitem_evidence', 'uncovered', 'needs_verification'].map((status) => [status, rows.filter((row) => row.evidenceStatus === status).length]));
  return {
    schemaVersion: definitions.schemaVersion,
    status: definitions.status,
    evidenceBoundary: definitions.boundary,
    registeredFocusCount: rows.length,
    explicitlyCuratedSubitemCount: definitions.definitions.length,
    focusCountByEvidenceStatus: counts,
    focusWithActivityAssociationButNoExplicitSubitemEvidenceCount: rows.filter((row) => row.evidenceStatus === 'associated_only_no_explicit_subitem_evidence').length,
    generatedTextSplitIsOfficialSubclause: false,
    allFocuses: rows,
    method: 'Every focus is retained. Existing activity IDs are audited by actual declared stage interactions where catalog data exists; only an explicit task learningSubitemClaims declaration can link a curated project subitem. Generated text splits are review aids, not official clauses or coverage claims.',
  };
}

export function buildCoverageInventory({ curriculumMap = readJson(mapPath), sources = readJson(sourcePath), browserAcceptance = defaultBrowserAcceptance() } = {}) {
  const focusSections = ['verifiedLearningFocuses', 'supplementalVerifiedLearningFocuses', 'pendingLearningFocuses'];
  const focuses = focusSections.flatMap((section) => (curriculumMap[section] ?? []).map((focus) => ({ ...focus, registrySection: section })));
  const ids = focuses.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) throw new Error('Curriculum focus IDs are not unique');
  const sourceById = new Map((sources.sources ?? []).map((source) => [source.id, source]));
  const activitiesByMapId = relationActivitiesByMapId();
  const browserReports = (Array.isArray(browserAcceptance) ? browserAcceptance : [browserAcceptance]).filter(Boolean);
  const latestBrowserReport = [...browserReports].sort((a, b) => String(a.executedAt ?? '').localeCompare(String(b.executedAt ?? ''))).at(-1) ?? null;
  const browserEvidenceByActivity = verifiedBrowserAcceptanceByActivity(browserAcceptance);
  const catalogPlayabilityRows = CATALOG_CANDIDATE_TASKS.map((task) => assessCatalogTaskPlayability(task, browserEvidenceByActivity));
  const learningSubitemAudit = buildLearningSubitemAudit(focuses, sources, activitiesByMapId, catalogPlayabilityRows);
  const relationTaskRows = LEARNING_TASK_RELATIONS.flatMap((relation) => (relation.tasks ?? []).map((task) => {
    const modulePath = task.runtimeModule ?? null;
    const moduleExists = Boolean(modulePath && fs.existsSync(path.join(root, modulePath)));
    const hasTaskData = Array.isArray(task.stages) && task.stages.length > 0;
    return {
      activityId: task.taskId,
      gradeId: relation.gradeId,
      subjectId: relation.subjectId,
      status: task.status ?? 'status_not_recorded',
      runtimeModule: modulePath,
      runtimeModuleExists: moduleExists,
      taskStageCount: task.stages?.length ?? 0,
      taskDataPresent: hasTaskData,
      browserVerification: browserEvidenceByActivity.get(task.taskId) ?? null,
      browserVerified: browserEvidenceByActivity.has(task.taskId),
      runtimeEvidenceStatus: hasTaskData && moduleExists
        ? browserEvidenceByActivity.has(task.taskId) ? 'relation_task_data_module_and_browser_verified'
          : 'relation_task_data_and_module_present_browser_not_verified'
        : moduleExists ? 'runtime_module_only_browser_not_verified' : 'runtime_not_confirmed',
    };
  }));
  const standaloneUnitRows = STANDALONE_MATH_UNITS.map((unit) => {
    const modulePath = STANDALONE_UNIT_MODULES[unit.levelId] ?? null;
    const moduleExists = Boolean(modulePath && fs.existsSync(path.join(root, modulePath)));
    const hasTaskData = ['questions', 'lessonSteps', 'practiceQuestions'].some((key) => Array.isArray(unit[key]) && unit[key].length > 0);
    return {
      activityId: unit.activityId,
      gradeId: 'grade-3',
      subjectId: 'mathematics',
      status: unit.status ?? 'status_not_recorded',
      runtimeModule: modulePath,
      runtimeModuleExists: moduleExists,
      taskDataPresent: hasTaskData,
      runtimeEvidenceStatus: hasTaskData && moduleExists
        ? 'standalone_data_and_module_present_browser_not_verified'
        : moduleExists ? 'runtime_module_only_browser_not_verified' : 'runtime_not_confirmed',
    };
  });
  const playabilityInventory = {
    evidenceBoundary: '入口、模組、任務資料與共用引擎 schema/流程資料分層呈現；靜態證據不代表瀏覽器驗收或教學效度。',
    catalogCandidateTasks: {
      count: catalogPlayabilityRows.length,
      sharedEngineSchemaAndFlowDataValid: catalogPlayabilityRows.filter((row) => ['shared_engine_schema_and_flow_data_valid_browser_not_verified', 'shared_engine_schema_and_flow_data_and_browser_verified'].includes(row.runtimeEvidenceStatus)).length,
      notConfirmed: catalogPlayabilityRows.filter((row) => !['shared_engine_schema_and_flow_data_valid_browser_not_verified', 'shared_engine_schema_and_flow_data_and_browser_verified'].includes(row.runtimeEvidenceStatus)).length,
      browserVerified: catalogPlayabilityRows.filter((row) => row.browserVerified).length,
      activities: catalogPlayabilityRows,
    },
    relationActivities: {
      count: relationTaskRows.length,
      taskDataAndModulePresent: relationTaskRows.filter((row) => ['relation_task_data_and_module_present_browser_not_verified', 'relation_task_data_module_and_browser_verified'].includes(row.runtimeEvidenceStatus)).length,
      moduleOnly: relationTaskRows.filter((row) => row.runtimeEvidenceStatus === 'runtime_module_only_browser_not_verified').length,
      runtimeNotConfirmed: relationTaskRows.filter((row) => row.runtimeEvidenceStatus === 'runtime_not_confirmed').length,
      browserVerified: relationTaskRows.filter((row) => row.browserVerified).length,
      activities: relationTaskRows,
    },
    standaloneMathUnits: {
      count: standaloneUnitRows.length,
      dataAndModulePresent: standaloneUnitRows.filter((row) => row.runtimeEvidenceStatus === 'standalone_data_and_module_present_browser_not_verified').length,
      moduleOnly: standaloneUnitRows.filter((row) => row.runtimeEvidenceStatus === 'runtime_module_only_browser_not_verified').length,
      runtimeNotConfirmed: standaloneUnitRows.filter((row) => row.runtimeEvidenceStatus === 'runtime_not_confirmed').length,
      browserVerified: 0,
      activities: standaloneUnitRows,
    },
    browserVerification: {
      verifiedActivityCount: browserEvidenceByActivity.size,
      status: browserEvidenceByActivity.size ? '只彙整附具成功逐項操作及指定 viewport 報告的候選活動；不等於教學審查。' : '沒有符合驗證規則的成功瀏覽器報告。',
      evidenceId: latestBrowserReport?.reportId ?? null,
      evidenceReportCount: browserReports.length,
      sources: [...new Set([...browserEvidenceByActivity.values()].map(({ source }) => source))],
      browser: [...new Set([...browserEvidenceByActivity.values()].map(({ browser }) => browser))].join(', ') || latestBrowserReport?.browser || null,
      executedAt: latestBrowserReport?.executedAt ?? null,
      requiredViewports: ['1366x768', '390x844', '340x740'],
      verifiedActivityIds: [...browserEvidenceByActivity.keys()],
    },
  };
  const detailRows = focuses.map((focus) => {
    const source = sourceById.get(focus.sourceId);
    const candidates = activitiesByMapId.get(focus.id) ?? [];
    const linked = candidates.filter((task) => !focus.gradeRange
      || (Number(task.gradeId.slice(-1)) >= focus.gradeRange[0]
        && Number(task.gradeId.slice(-1)) <= focus.gradeRange[1]));
    const officialVerified = ['verified_against_official_text', 'verified_against_official_text_this_run', 'verified_against_official_pdf_this_run'].includes(focus.officialTextReviewStatus)
      && Boolean(source?.verifiedClauses)
      && [...(focus.contentCodes ?? []), ...(focus.performanceCodes ?? [])].every((code) => source.verifiedClauses.includes(code));
    const status = !officialVerified ? '待核實' : linked.length ? '部分對應' : '尚未對應';
    return {
      focusId: focus.id,
      subject: focus.subject,
      gradeRange: focus.gradeRange ?? null,
      learningStage: focus.learningStage ?? null,
      stagePerformanceRange: focus.stagePerformanceRange ?? null,
      contentCodes: focus.contentCodes ?? [],
      performanceCodes: focus.performanceCodes ?? [],
      officialSourceId: focus.sourceId ?? null,
      officialSourceUrl: focus.sourceUrl ?? source?.url ?? null,
      officialSourceReviewStatus: source?.reviewStatus ?? 'source_not_registered',
      officialClauseStatus: officialVerified ? '已核對代碼與所登錄原文' : '待核實；不以代碼存在推定核對完成',
      applicabilityStatus: focus.gradeApplicabilityStatus ?? '待核對年級或課程適用範圍',
      coverageStatus: status,
      linkedActivityIds: [...new Set(linked.map(({ activityId }) => activityId))],
      determination: linked.length
        ? '僅表示有候選任務關聯；活動宣告為局部/部分練習，不能推論完整涵蓋或學習成效。'
        : officialVerified ? '已有官方焦點登錄，但目前沒有可追溯的實際活動關聯。' : '官方原文/代碼來源核對證據不足，且不推定完整對應。',
      registeredFocusSummary: focus.focus,
      limitations: focus.coverageLimitations ?? focus.missingEvidence ?? [],
    };
  });

  const directoryRows = GRADE_CATALOG.flatMap((grade) => grade.subjects.map((subject) => {
    const catalogTasks = CATALOG_CANDIDATE_TASKS.filter((task) => task.gradeId === grade.gradeId && task.subjectId === subject.subjectId);
    const relationTasks = LEARNING_TASK_RELATIONS
      .filter((relation) => relation.gradeId === grade.gradeId && relation.subjectId === subject.subjectId)
      .flatMap((relation) => relation.tasks ?? []);
    const items = subject.existingYearLevelContent ?? [];
    const visibleTaskIds = items.filter((item) => item.activityId).map((item) => item.activityId);
    const directoryActivityDetails = items.map((item) => {
      const unit = STANDALONE_UNIT_BY_LEVEL.get(item.levelId) ?? null;
      const activityId = item.activityId ?? unit?.activityId ?? null;
      const catalogTask = catalogTasks.find((task) => task.activityId === activityId);
      const relationTask = relationTasks.find((task) => task.taskId === activityId);
      const runtimeModule = STANDALONE_UNIT_MODULES[item.levelId] ?? item.runtimeModule ?? catalogTask?.runtimeModule ?? relationTask?.runtimeModule ?? null;
      const hasExecutableData = Boolean(unit && (unit.questions?.length || unit.lessonSteps?.length || unit.practiceQuestions?.length))
        || Boolean(catalogTask?.stages?.length);
      const runtimeAvailability = item.runtimeAvailability ?? item.directoryStatus ?? 'not_recorded';
      const activityModuleExists = Boolean(runtimeModule && fs.existsSync(path.join(root, runtimeModule)));
      const hasPlayableRuntimeDeclaration = runtimeAvailability === 'playable_candidate_prototype'
        || ['playable_candidate_pending_teacher_review', 'playable_candidate_prototype'].includes(relationTask?.status);
      const browserVerification = catalogTask?.browserVerification ?? browserEvidenceByActivity.get(activityId) ?? null;
      return {
        levelId: item.levelId ?? null,
        activityId,
        title: item.title,
        directoryRuntimeAvailability: runtimeAvailability,
        activityModulePath: runtimeModule,
        activityModuleExists,
        executableLearningDataPresent: hasExecutableData,
        hasPlayableRuntimeDeclaration,
        interactiveStatus: browserVerification
          ? '已於報告列出的 viewport 實際操作提示、錯答、重試、完成與重玩；不代表教學審查'
          : hasExecutableData && activityModuleExists
          ? '活動資料與模組存在；此靜態報表不宣稱瀏覽器流程已驗收'
          : hasPlayableRuntimeDeclaration && activityModuleExists
            ? '僅有可玩宣告與模組檔；互動資料／實際操作未由此確認'
            : activityModuleExists ? '有模組檔，但互動流程未確認'
              : '尚無可確認的活動模組檔或可玩入口',
        status: item.status ?? unit?.status ?? catalogTask?.status ?? relationTask?.status ?? null,
        browserVerified: Boolean(browserVerification),
        browserVerification,
      };
    });
    const linkedUnitIds = directoryActivityDetails.map(({ activityId }) => activityId).filter(Boolean);
    const registeredActivityIds = [...new Set([...visibleTaskIds, ...linkedUnitIds])];
    const interactiveActivityIds = directoryActivityDetails.filter(({ executableLearningDataPresent, hasPlayableRuntimeDeclaration, activityModuleExists }) => activityModuleExists && (executableLearningDataPresent || hasPlayableRuntimeDeclaration)).map(({ activityId }) => activityId);
    const gradeNo = grade.gradeNumber;
    const focusCount = detailRows.filter((row) => row.subject === subject.learningMapSubjectId
      && row.gradeRange && gradeNo >= row.gradeRange[0] && gradeNo <= row.gradeRange[1]).length;
    return {
      gradeId: grade.gradeId,
      gradeNumber: gradeNo,
      subjectId: subject.subjectId,
      learningMapSubjectId: subject.learningMapSubjectId,
      subjectName: subject.name,
      frameworkGradeScope: subject.frameworkGradeScope,
      directoryEntryStatus: '已建立科目入口',
      directoryActivityIds: [...new Set(visibleTaskIds)],
      catalogTaskIds: catalogTasks.map(({ activityId }) => activityId),
      registeredActivityIds,
      directoryActivityDetails,
      interactiveActivityIds: [...new Set(interactiveActivityIds)],
      runtimeProgramModuleIds: [...new Set(directoryActivityDetails.filter(({ activityModuleExists }) => activityModuleExists).map(({ activityModulePath }) => activityModulePath))],
      candidateTaskCount: catalogTasks.length,
      catalogTaskPlayability: catalogPlayabilityRows.filter((task) => task.gradeId === grade.gradeId && task.subjectId === subject.subjectId),
      catalogTaskPlayabilityCounts: {
        schemaAndFlowDataValid: catalogPlayabilityRows.filter((task) => task.gradeId === grade.gradeId && task.subjectId === subject.subjectId && ['shared_engine_schema_and_flow_data_valid_browser_not_verified', 'shared_engine_schema_and_flow_data_and_browser_verified'].includes(task.runtimeEvidenceStatus)).length,
        notConfirmed: catalogPlayabilityRows.filter((task) => task.gradeId === grade.gradeId && task.subjectId === subject.subjectId && !['shared_engine_schema_and_flow_data_valid_browser_not_verified', 'shared_engine_schema_and_flow_data_and_browser_verified'].includes(task.runtimeEvidenceStatus)).length,
        browserVerified: catalogPlayabilityRows.filter((task) => task.gradeId === grade.gradeId && task.subjectId === subject.subjectId && task.browserVerified).length,
      },
      registeredFocusCount: focusCount,
      distinction: '科目入口只證明目錄存在；活動資料與實際互動另行計數；不代表整科課綱覆蓋。',
    };
  }));

  const focusCounts = Object.fromEntries(['已對應', '部分對應', '尚未對應', '待核實'].map((status) => [status, detailRows.filter((row) => row.coverageStatus === status).length]));
  const directlyVerifiedUnlinkedFocusCount = detailRows.filter((row) => row.coverageStatus === '尚未對應').length;
  const verifiedPartialLinkedFocusCount = detailRows.filter((row) => row.coverageStatus === '部分對應').length;
  const needsVerificationFocusCount = detailRows.filter((row) => row.coverageStatus === '待核實').length;
  const codeReferenceCount = detailRows.reduce((sum, row) => sum + row.contentCodes.length + row.performanceCodes.length, 0);
  const subjectCounts = Object.fromEntries([...new Set(detailRows.map((row) => row.subject))].sort().map((subject) => [subject, {
    registeredFocusCount: detailRows.filter((row) => row.subject === subject).length,
    partialCount: detailRows.filter((row) => row.subject === subject && row.coverageStatus === '部分對應').length,
    unmappedCount: detailRows.filter((row) => row.subject === subject && row.coverageStatus === '尚未對應').length,
    needsVerificationCount: detailRows.filter((row) => row.subject === subject && row.coverageStatus === '待核實').length,
  }]));
  const registeredBySubjectStage = new Map();
  for (const row of detailRows) {
    const stageRange = row.stagePerformanceRange;
    const stage = Array.isArray(stageRange) && stageRange.length === 2 ? `${stageRange[0]}–${stageRange[1]}` : '未指定／年級內容表';
    const key = `${row.subject}|${stage}`;
    const entry = registeredBySubjectStage.get(key) ?? { subject: row.subject, learningStage: stage, registeredFocusCount: 0, statusCounts: { 已對應: 0, 部分對應: 0, 尚未對應: 0, 待核實: 0 } };
    entry.registeredFocusCount += 1;
    entry.statusCounts[row.coverageStatus] += 1;
    registeredBySubjectStage.set(key, entry);
  }
  const verifiedOfficialCodes = [...new Set((sources.sources ?? []).flatMap((source) => source.verifiedClauses ?? []))].sort();
  const taskStats = (tasks) => ({ taskCount: new Set(tasks.map(({ activityId }) => activityId)).size, activityIds: [...new Set(tasks.map(({ activityId }) => activityId))].sort() });
  const taskDistributionByGrade = Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
    const gradeId = `grade-${index + 1}`;
    const tasks = CATALOG_CANDIDATE_TASKS.filter((task) => task.gradeId === gradeId && task.status === 'candidate_pending_teacher_review' && task.stages?.length);
    return [gradeId, taskStats(tasks)];
  }));
  const taskDistributionBySubject = Object.fromEntries([...new Set(CATALOG_CANDIDATE_TASKS.map(({ subjectId }) => subjectId))].sort().map((subjectId) => [
    subjectId,
    taskStats(CATALOG_CANDIDATE_TASKS.filter((task) => task.subjectId === subjectId && task.status === 'candidate_pending_teacher_review' && task.stages?.length)),
  ]));
  const curatedDefinitions = readJson(subitemDefinitionPath).definitions ?? [];
  const interactiveSubitemIds = [...new Set(learningSubitemAudit.allFocuses.flatMap(({ curatedProjectSubitems }) => curatedProjectSubitems
    .filter(({ explicitActivityLinkStatus }) => explicitActivityLinkStatus === 'task_claim_and_interaction_stages_present')
    .map(({ subitemId }) => subitemId)))];
  const associatedOnlyFocusCount = learningSubitemAudit.focusCountByEvidenceStatus.associated_only_no_explicit_subitem_evidence;
  const unmappedVerifiedFocusCount = learningSubitemAudit.allFocuses.filter((focus) => focus.evidenceStatus === 'uncovered').length;
  const focusWithoutAnyActivityAssociationCount = learningSubitemAudit.allFocuses.filter(({ activityAudit }) => activityAudit.length === 0).length;
  const curriculumCoverageDistribution = {
    completeness: '清冊未完成',
    taskCountsByGrade: taskDistributionByGrade,
    taskCountsBySubject: taskDistributionBySubject,
    distinctCatalogCandidateTaskCount: new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size,
    registeredProjectSubitemCount: new Set(curatedDefinitions.map(({ subitemId }) => subitemId)).size,
    projectSubitemsWithClaimedInteractiveStagesCount: interactiveSubitemIds.length,
    projectSubitemIdsWithClaimedInteractiveStages: interactiveSubitemIds,
    registeredFocusCount: learningSubitemAudit.registeredFocusCount,
    registeredFocusCountsByEvidenceStatus: learningSubitemAudit.focusCountByEvidenceStatus,
    associatedFocusWithoutExplicitSubitemClaimCount: associatedOnlyFocusCount,
    verifiedRegisteredFocusWithoutActivityAssociationCount: unmappedVerifiedFocusCount,
    registeredFocusWithoutAnyActivityAssociationCount: focusWithoutAnyActivityAssociationCount,
    officialDocumentFamiliesNotRetrievedCount: buildSourceInventorySummary(sources).expectedElementaryFormalDocumentFamiliesNotRetrieved.length,
    officialClauseEnumerationIncompleteFamilyCount: buildSourceInventorySummary(sources).clauseEnumeration.unenumeratedDocuments.length,
    officialElementaryItemTotal: null,
    unregisteredOfficialItemTotal: null,
    nationalCoverageRate: null,
    method: '任務數以 CATALOG_CANDIDATE_TASKS 的唯一 activityId 計；領域按活動 subjectId、年級按活動 gradeId 分組。子項數以唯一專案 subitemId 計，互動證據需有任務宣告且稽核確認實際非選擇互動階段。焦點數與狀態以 curriculum-map.json 已登錄且去重的 focusId 計；學習階段跨年級焦點不拆複製成多筆。未登錄官方條目數與全國總量因領綱未逐條枚舉而維持 null。這是專案登錄分布，不是全國課綱覆蓋率。',
    limitations: [
      'associatedFocusWithoutExplicitSubitemClaimCount 表示焦點有活動 ID 關聯，但沒有可追溯的專案子項 claim 與互動階段證據；不表示沒有活動入口。',
      'verifiedRegisteredFocusWithoutActivityAssociationCount 僅統計目前登錄且官方代碼已核對的焦點中沒有活動關聯者；不能代表尚未登錄的官方內容缺口。',
      '課綱清冊及來源枚舉未完成，任務數與子項數不能當成官方條目數或學習成效。',
    ],
  };
  return {
    schemaVersion: 1,
    inventoryId: 'elementary-curriculum-to-game-coverage',
    generatedAt: new Date().toISOString(),
    completeness: 'partial_project_registry_not_complete_official_curriculum',
    officialCatalogCompleteness: {
      status: '清冊未完成',
      officialElementaryLearningItemCount: null,
      unregisteredOfficialLearningItemCount: null,
      nationalCoverageRate: null,
      reason: '尚未逐條盤點並核實各官方領域／科目 PDF 的國小學習內容與學習表現；不可從目前專案焦點列推算未登錄總量或全國課綱覆蓋率。',
      registeredOfficialCodeCount: verifiedOfficialCodes.length,
      registeredOfficialCodes: verifiedOfficialCodes,
      officialSourceRecordCount: (sources.sources ?? []).filter(({ id }) => id !== 'core-general').length,
      sourceClauseEnumerationStatus: 'official sources and verified clauses are a partial register, not complete clause enumeration',
      sourceInventoryStatus: sources.sourceInventory?.status ?? 'source_inventory_not_recorded',
      elementaryOfficialDocumentFamilyCount: buildSourceInventorySummary(sources).expectedElementaryFormalDocumentFamilyCount,
      elementaryOfficialDocumentFamiliesWithLocatedDocuments: buildSourceInventorySummary(sources).expectedElementaryFormalDocumentFamiliesLocated,
      elementaryOfficialDocumentFamiliesNotRetrieved: buildSourceInventorySummary(sources).expectedElementaryFormalDocumentFamiliesNotRetrieved,
    },
    sourceInventory: buildSourceInventorySummary(sources),
    activityPlayabilityInventory: playabilityInventory,
    learningSubitemAudit,
    curriculumCoverageDistribution,
    candidateActivityDevelopmentReadiness: {
      activityAddedThisRun: LEARNING_SUBITEM_GAP_TASKS.length > 0 || GRADE3_MATH_DATA_EXPANSION_TASKS.length > 0 || EARLY_GRADE_CURRICULUM_GAP_TASKS.length > 0 || MATH_CURRICULUM_GAP_TASKS.length > 0,
      directlyVerifiedUnlinkedFocusCount,
      verifiedPartialLinkedFocusCount,
      needsVerificationFocusCount,
      decision: '依已核實且現有操作只局部涵蓋的焦點，已登錄既有及本輪明確子項候選互動；活動資料／引擎 schema 驗證不等同教師審查、完整課綱涵蓋或學習成效。其餘焦點即使已有活動關聯，未聲明子項證據者仍視為關聯而非教學覆蓋。',
      learningSubitemExpansionActivityIds: LEARNING_SUBITEM_EXPANSION_TASKS.map(({ activityId }) => activityId),
      learningSubitemGapExpansionActivityIds: LEARNING_SUBITEM_GAP_TASKS.map(({ activityId }) => activityId),
      grade3MathDataExpansionActivityIds: GRADE3_MATH_DATA_EXPANSION_TASKS.map(({ activityId }) => activityId),
      earlyGradeCurriculumGapActivityIds: EARLY_GRADE_CURRICULUM_GAP_TASKS.map(({ activityId }) => activityId),
      mathCurriculumGapActivityIds: MATH_CURRICULUM_GAP_TASKS.map(({ activityId }) => activityId),
      sourceLimitations: [
        '15份國小正式領綱文件家族均未完成逐條枚舉。',
        '閩南、客家、原住民族語文111版PDF已取得並建立國小階段代碼定位索引；代碼文字擷取尚未逐條人工校核語意，不能當成完整條文登錄或國語料審查。',
        '已登錄的局部活動關聯不等同核心條文完整教學；須進一步拆解活動未涵蓋的條文子項，才可判定非重複的遊戲擴充。',
      ],
    },
    denominator: {
      kind: 'currently_registered_focus_records_only',
      count: detailRows.length,
      codeReferenceCount,
      directoryGradeSubjectSlots: directoryRows.length,
      officialElementaryLearningItemCount: null,
      unregisteredOfficialLearningItemCount: null,
      nationalCoverageRate: null,
      excluded: ['總綱領域索引本身不是細目分母', '未逐條登錄的官方課綱內容不計入分母，也不得視為已覆蓋', '教材學期與出版社／冊次／頁碼不是官方細目覆蓋率'],
    },
    statusCounts: focusCounts,
    registeredFocusPartialMappingRate: detailRows.length ? Number((focusCounts['部分對應'] / detailRows.length).toFixed(4)) : 0,
    officialScopeLimit: '只有課綱資料列與來源記錄可核實的已登錄細目；不宣稱完整盤點全國各領域所有學習內容。學習階段不推定到單一年級或學期。',
    perSubject: subjectCounts,
    perSubjectStage: [...registeredBySubjectStage.values()].sort((a, b) => `${a.subject}|${a.learningStage}`.localeCompare(`${b.subject}|${b.learningStage}`)),
    statisticsMethod: {
      registeredFocusStatuses: '分母僅為 curriculum-map.json 已登錄的焦點紀錄；一列不是必然等於一個官方條目，重複代碼可出現在不同焦點。',
      learningSubitemEvidence: '分母為 curriculum-map.json 目前登錄焦點且全部保留。文本切分僅是專案審查輔助，並非官方子條目；僅有明確 learningSubitemClaims 且可對照實際任務階段者，才列為候選子項互動證據。',
      officialCodeCount: '去重後 sources.json 各來源 verifiedClauses 的代碼數；僅計已逐項核對者，不代表全部國小官方條目。',
      directorySlots: 'GRADE_CATALOG 中六年級 × 科目定義的目錄槽位；入口存在不計為課綱覆蓋。',
      coverageRules: { covered: '只有焦點列明確保存核心條文涵蓋證據、活動互動實測證據且校核已完成時才能使用；目錄、模組或候選活動存在不會自動推得 covered。', partial: '官方焦點核對完成且有活動關聯，但目前沒有可核實的完整核心內容證據，保守標記 partial。', uncovered: '官方焦點核對完成且沒有活動關聯。', needsVerification: '官方條文／代碼、適用範圍或活動關聯尚有任一項證據不足。' },
      sourceInventory: '來源文件定位、條目枚舉、活動對應及可玩性是分開統計；官方文件沒有逐條枚舉時，不推估其條目數。',
      playability: '目錄存在只算入口；模組與活動資料存在只算靜態可玩性證據；共用引擎 schema 通過不是瀏覽器操作驗收。',
      exclusions: ['未逐條登錄的官方學習重點不在目前分母，也不能視為已覆蓋。', '教材版本、學期順序、冊次、頁碼和教師核准不推定。'],
    },
    gradeSubjectDirectory: directoryRows,
    registeredCurriculumFocuses: detailRows,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inventory = buildCoverageInventory();
  const crosswalkPath = path.join(root, 'artifacts/official-learning-item-activity-crosswalk.json');
  const buildCrosswalk = () => {
    const crosswalk = buildOfficialLearningItemCrosswalk();
    const validation = validateOfficialLearningItemCrosswalk(crosswalk);
    if (validation.errors.length) throw new Error(`Official learning-item crosswalk validation failed: ${validation.errors.join(', ')}`);
    return crosswalk;
  };
  if (process.argv.includes('--build')) {
    fs.writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
    const crosswalk = buildCrosswalk();
    fs.writeFileSync(crosswalkPath, `${JSON.stringify(crosswalk, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({
      wrote: [path.relative(root, outputPath), path.relative(root, crosswalkPath)],
      registeredFocuses: inventory.denominator.count,
      directorySlots: inventory.denominator.directoryGradeSubjectSlots,
      mathOfficialContentRows: crosswalk.mathOfficialLearningContentItems.length,
      mathCoverageCounts: crosswalk.mathCoverageCountsWithinRegisteredRows,
      officialDocumentFamilies: crosswalk.scope.officialDocumentFamilyCount,
      fullyEnumeratedOfficialDocumentFamilies: crosswalk.scope.fullyEnumeratedOfficialDocumentFamilyCount,
      crosswalkWarnings: crosswalk.validation.warnings,
    }, null, 2));
  } else {
    const current = readJson(outputPath);
    const expected = JSON.stringify({ ...inventory, generatedAt: current.generatedAt });
    if (JSON.stringify(current) !== expected) throw new Error('Coverage inventory is stale; run node scripts/curriculum-coverage.mjs --build');
    const crosswalk = buildCrosswalk();
    if (!fs.existsSync(crosswalkPath) || fs.readFileSync(crosswalkPath, 'utf8') !== `${JSON.stringify(crosswalk, null, 2)}\n`) throw new Error('Official learning-item activity crosswalk is stale; run node scripts/curriculum-coverage.mjs --build');
    console.log(JSON.stringify({
      completeness: inventory.officialCatalogCompleteness.status,
      sourceInventoryStatus: inventory.sourceInventory.status,
      expectedElementaryFormalDocumentFamilies: inventory.sourceInventory.expectedElementaryFormalDocumentFamilyCount,
      locatedElementaryFormalDocumentFamilies: inventory.sourceInventory.expectedElementaryFormalDocumentFamiliesLocated,
      documentStatusCounts: inventory.sourceInventory.documentStatusCounts,
      clauseEnumerationStatusCounts: inventory.sourceInventory.clauseEnumerationStatusCounts,
      currentDocumentsNotRetrieved: inventory.sourceInventory.expectedElementaryFormalDocumentFamiliesNotRetrieved.map(({ familyId, documentStatus }) => ({ familyId, documentStatus })),
      fullyEnumeratedElementaryFormalDocuments: inventory.sourceInventory.clauseEnumeration.completeElementaryFormalDocuments,
      partialOrUnenumeratedElementaryFormalDocuments: inventory.sourceInventory.clauseEnumeration.partialOrUnenumeratedElementaryDocuments,
      registeredVerifiedClauseReferences: inventory.sourceInventory.clauseEnumeration.registeredVerifiedClauseReferences,
      verifiedUniqueCodeCount: inventory.sourceInventory.clauseEnumeration.registeredUniqueVerifiedCodeCount,
      registeredFocusCount: inventory.denominator.count,
      registeredFocusStatusCounts: inventory.statusCounts,
      registeredFocusPartialMappingRate: inventory.registeredFocusPartialMappingRate,
      registeredFocusCountsBySubject: inventory.perSubject,
      registeredFocusCountsBySubjectAndLearningStage: inventory.perSubjectStage,
      curriculumCoverageDistribution: inventory.curriculumCoverageDistribution,
      playabilityCounts: {
        candidateCatalogTasks: inventory.activityPlayabilityInventory.catalogCandidateTasks.count,
        catalogTasksWithSchemaAndFlowData: inventory.activityPlayabilityInventory.catalogCandidateTasks.sharedEngineSchemaAndFlowDataValid,
        relationActivities: inventory.activityPlayabilityInventory.relationActivities.count,
        relationTasksWithDataAndModule: inventory.activityPlayabilityInventory.relationActivities.taskDataAndModulePresent,
        standaloneMathUnits: inventory.activityPlayabilityInventory.standaloneMathUnits.count,
        standaloneUnitsWithDataAndModule: inventory.activityPlayabilityInventory.standaloneMathUnits.dataAndModulePresent,
        browserVerified: inventory.activityPlayabilityInventory.browserVerification.verifiedActivityCount,
      },
      candidateActivityDevelopmentReadiness: inventory.candidateActivityDevelopmentReadiness,
      officialElementaryLearningItemCount: inventory.denominator.officialElementaryLearningItemCount,
      unregisteredOfficialLearningItemCount: inventory.denominator.unregisteredOfficialLearningItemCount,
      nationalCoverageRate: inventory.denominator.nationalCoverageRate,
      directorySlots: inventory.denominator.directoryGradeSubjectSlots,
      exclusions: inventory.sourceInventory.exclusions.rule,
      playability: 'Static shared-engine/schema data checks do not constitute browser verification.',
      officialLearningItemCrosswalk: {
        status: crosswalk.status,
        officialElementaryDocumentFamilies: crosswalk.scope.officialDocumentFamilyCount,
        fullyEnumeratedDocumentFamilies: crosswalk.scope.fullyEnumeratedOfficialDocumentFamilyCount,
        verifiedMathContentRows: crosswalk.mathOfficialLearningContentItems.length,
        mathCoverageWithinRegisteredRows: crosswalk.mathCoverageCountsWithinRegisteredRows,
        registeredCandidateActivities: crosswalk.actualRegisteredActivities.length,
        projectFocusRowsNotEquivalentToOfficialClauseCount: crosswalk.registeredProjectFocusCrosswalk.length,
        nationalCoverageRate: crosswalk.scope.nationalCoverageRate,
        warnings: crosswalk.validation.warnings.length,
      },
    }, null, 2));
  }
}
