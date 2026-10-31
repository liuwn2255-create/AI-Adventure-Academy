import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getGradeAdventureSummary } from '../prototype/data/gradeActivityDirectory.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const outputPath = path.join(ROOT, 'artifacts/official-learning-item-activity-crosswalk.json');

function loadLatestSuccessfulDirectoryEntryReport() {
  const artifactsRoot = path.join(ROOT, 'artifacts');
  const directories = fs.readdirSync(artifactsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('cross-grade-adventure-entry-browser-acceptance-'))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const directory of directories) {
    const reportPath = path.join(artifactsRoot, directory, 'acceptance-report.json');
    if (!fs.existsSync(reportPath)) continue;
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      if (report.status === 'passed' && Array.isArray(report.entries) && report.entries.length === 145) {
        return { report, relativePath: path.relative(ROOT, reportPath).replaceAll('\\', '/') };
      }
    } catch {
      // An incomplete or malformed browser report must not be counted as evidence.
    }
  }
  return null;
}

function loadSupplementalDirectoryEntryEvidence() {
  const artifactsRoot = path.join(ROOT, 'artifacts');
  const reports = new Map();
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const report = JSON.parse(fs.readFileSync(filename, 'utf8'));
          const requiredViewports = ['1366x768', '390x844', '340x740'];
          const directoryEntries = report.directoryEntryEvidence ?? [];
          const hasViewportEvidence = requiredViewports.every((viewport) => report.viewports?.some((row) => row.viewport === viewport && row.status === 'passed'));
          const hasCleanDiagnostics = report.diagnostics
            && !report.diagnostics.exceptions?.length && !report.diagnostics.consoleErrors?.length
            && !report.diagnostics.failedRequests?.length && !report.diagnostics.badResponses?.length;
          const entriesHaveRealFlows = directoryEntries.length > 0 && directoryEntries.every((entry) => entry.startedFromDirectory === true
            && entry.returnedToCorrectDirectory === true
            && requiredViewports.every((viewport) => {
              const row = report.viewports?.find((item) => item.viewport === viewport);
              const task = row?.tasks?.find((item) => item.activityId === entry.activityId);
              return row?.localStorageUnchanged === true && row.horizontalOverflowAny === false
                && !row.consoleErrors?.length && !row.requestFailures?.length && !row.httpErrors?.length
                && task?.status === 'passed' && task.stageCount > 0 && task.stages?.length === task.stageCount
                && task.stages.every((stage) => stage.hintLevels?.length === 2 && stage.hintLevels.every((hint, index) => hint.startsWith(`提示 ${index + 1}：`))
                  && Boolean(stage.wrongAnswer) && Boolean(stage.retry) && Boolean(stage.correctAnswer))
                && task.completion?.includes('候選任務完成！') && task.replay?.startsWith('passed') && task.returnToCatalog === 'passed';
            }));
          if (report.status === 'passed' && report.evidenceType === 'isolated_browser_acceptance' && report.browser && report.executedAt
            && /^https?:\/\/127\.0\.0\.1:(?!4175(?:\/|$)|4176(?:\/|$))\d+\//u.test(report.source ?? '')
            && hasViewportEvidence && hasCleanDiagnostics && entriesHaveRealFlows) {
            const reportPath = path.relative(ROOT, filename).replaceAll('\\', '/');
            reports.set(report.reportId ?? reportPath, { report, relativePath: reportPath });
          }
        } catch {
          // Ignore non-report artifacts; malformed evidence is never counted.
        }
      }
    }
  };
  visit(artifactsRoot);
  return [...reports.values()];
}

export function buildOfficialLearningItemCrosswalk() {
  const sources = read('curriculum/sources.json');
  const coverage = read('curriculum/coverage-inventory.json');
  const mathAudit = read('artifacts/math-curriculum-audit-report.json');
  const activityMap = read('curriculum/learning-activity-map.json');
  const boundedNonMathBatches = sources.sources
    .filter((source) => source.id !== 'mathematics')
    .flatMap((source) => (source.verifiedContentBatches ?? []).map((reference) => ({ sourceId: source.id, ...read(reference.batchFile) })));
  const latestBrowserEntryReport = loadLatestSuccessfulDirectoryEntryReport();
  const browserEntryByActivityId = new Map((latestBrowserEntryReport?.report.entries ?? []).map((entry) => [entry.activityId, {
    ...entry,
    executedAt: latestBrowserEntryReport.report.executedAt,
    reportPath: latestBrowserEntryReport.relativePath,
  }]));
  const supplementalBrowserEntryEvidence = loadSupplementalDirectoryEntryEvidence();
  for (const evidenceReport of supplementalBrowserEntryEvidence) {
    for (const entry of evidenceReport.report.directoryEntryEvidence) {
      if (entry.startedFromDirectory === true && entry.returnedToCorrectDirectory === true) {
        browserEntryByActivityId.set(entry.activityId, {
          ...entry,
          executedAt: evidenceReport.report.executedAt,
          reportPath: evidenceReport.relativePath,
        });
      }
    }
  }
  const mathRowsByCode = new Map(mathAudit.clauseBatch.rows.map((row) => [row.code, row]));
  const sourceById = new Map(sources.sources.map((source) => [source.id, source]));
  const coverageFamilyById = new Map(coverage.sourceInventory.documentFamilies.map((family) => [family.familyId, family]));
  const focusRows = coverage.learningSubitemAudit.allFocuses;
  const focusById = new Map(focusRows.map((focus) => [focus.focusId, focus]));
  const mathTaskByStageId = new Map((mathAudit.activityAudit.taskRows ?? []).flatMap((task) => (task.stageIds ?? []).map((stageId) => [stageId, task])));
  const actualActivityAuditById = new Map();
  for (const focus of focusRows) {
    for (const audit of focus.activityAudit ?? []) {
      const stored = actualActivityAuditById.get(audit.activityId) ?? [];
      stored.push({ focusId: focus.focusId, evidenceStatus: focus.evidenceStatus, ...audit });
      actualActivityAuditById.set(audit.activityId, stored);
    }
  }

  const mathOfficialItems = mathAudit.clauseBatch.crossGradeIntegration.rows.map((auditRow) => {
    const official = mathRowsByCode.get(auditRow.code);
    const focusMatches = mathAudit.focusAudit.rows.filter((focus) => focus.officialContentCodes.includes(auditRow.code));
    const activityIds = [...new Set(auditRow.mappedActivityIds ?? [])];
    const evidenceStageIds = [...new Set(auditRow.interactionEvidenceStageIds ?? [])];
    const evidencedActivities = [...new Set(evidenceStageIds.map((stageId) => mathTaskByStageId.get(stageId)?.activityId).filter(Boolean))];
    return {
      officialItemId: `MOE-MATH-CONTENT-${auditRow.code}`,
      subject: 'mathematics',
      itemType: 'learning_content',
      officialCode: auditRow.code,
      officialText: official?.officialText ?? auditRow.officialText,
      officialNotes: official?.officialNotes ?? auditRow.officialNotes ?? '',
      source: {
        sourceId: 'mathematics',
        documentTitle: mathAudit.source.documentTitle,
        publicationInfo: mathAudit.source.publicationInfo,
        url: mathAudit.source.url,
        sourceLocation: auditRow.sourceLocation,
        auditBatchId: official?.auditBatchId ?? null,
        reviewStatus: auditRow.reviewStatus,
      },
      applicability: {
        officialGradeTable: auditRow.gradeTable,
        learningStage: auditRow.learningStage,
        semester: official?.applicability?.semester ?? null,
        gradeAssignmentBasis: '官方表格以年級標題分列；學習階段保留官方標記，不推定學期或教材冊次。',
      },
      relatedPerformanceCodes: official?.officialPerformanceLinks ?? [],
      activityIds: activityIds.sort(),
      activityEvidence: evidenceStageIds.map((stageId) => ({
        activityId: mathTaskByStageId.get(stageId)?.activityId ?? null,
        stageId,
        evidenceKind: 'clause_specific_audited_interaction_stage',
      })),
      relationOnlyActivityIds: activityIds.filter((activityId) => !evidencedActivities.includes(activityId)),
      coverageStatus: auditRow.coverageStatus,
      coverageReason: auditRow.reason,
      coverageBoundary: '候選互動證據不等於整條文完整教學或學生精熟；須另由教師審查。',
      officialCodeRelationship: official?.relationshipKind ?? null,
    };
  });

  const projectFocuses = coverage.registeredCurriculumFocuses.map((focus) => {
    const detailed = focusById.get(focus.focusId);
    const source = sourceById.get(focus.officialSourceId);
    return {
      focusId: focus.focusId,
      subject: focus.subject,
      gradeRange: focus.gradeRange,
      learningStage: detailed?.learningStage ?? focus.stagePerformanceRange ?? null,
      officialCodes: [...(focus.contentCodes ?? []), ...(focus.performanceCodes ?? [])],
      officialSource: {
        sourceId: focus.officialSourceId,
        documentTitle: source?.documentTitle ?? null,
        url: focus.officialSourceUrl ?? source?.url ?? null,
        location: detailed?.officialSource?.pageOrSection ?? source?.pageOrSection ?? null,
        sourceReviewStatus: focus.officialSourceReviewStatus,
        clauseEnumerationStatus: sources.sourceInventory.documentFamilies
          .filter((family) => family.sourceIds.includes(focus.officialSourceId))
          .map((family) => family.clauseEnumerationStatus),
      },
      applicabilityBasis: '此為現有專案焦點的範圍描述，不代表官方學習階段條文已指定此焦點落在某一特定年級。',
      officialItemInventoryStatus: focus.subject === 'mathematics'
        ? 'see_math_official_item_rows'
        : 'registered_project_focus_only_official_document_not_fully_enumerated',
      linkedActivityIds: focus.linkedActivityIds,
      projectSubitemEvidenceStatus: detailed?.evidenceStatus ?? 'needs_verification',
      coveredProjectSubitemIds: detailed?.coveredProjectSubitemIds ?? [],
      remainingProjectSubitems: detailed?.notYetCovered ?? [],
      unknownOfficialSubitems: detailed?.unknownOfficialSubitems ?? [],
      activityEvidence: (detailed?.activityAudit ?? []).map((activity) => ({
        activityId: activity.activityId,
        status: activity.status,
        interactionTypes: activity.interactionTypes,
        stageEvidence: activity.stageEvidence,
        browserEntryEvidence: activity.browserVerified ? activity.browserVerificationEvidence : null,
        limitation: activity.limitation,
      })),
      registeredCoverageStatus: focus.coverageStatus,
      determination: focus.determination,
      limitations: [...new Set([...(focus.limitations ?? []), ...(detailed?.remainingLimitations ?? [])])],
    };
  });

  const activities = GRADE_CATALOG.flatMap((grade) => getGradeAdventureSummary(grade).subjects.flatMap((subject) => subject.activities.map((activity) => {
    const evidence = actualActivityAuditById.get(activity.activityId) ?? [];
    const exactFocusIds = projectFocuses.filter((focus) => focus.linkedActivityIds.includes(activity.activityId)).map((focus) => focus.focusId);
    const task = CATALOG_CANDIDATE_TASKS.find((candidate) => candidate.activityId === activity.activityId);
    const mappedActivity = activityMap.activities.find((candidate) => candidate.activityId === activity.activityId);
    return {
      activityId: activity.activityId,
      title: activity.title,
      gradeId: grade.gradeId,
      subjectId: subject.subjectId,
      status: activity.status,
      launchRoute: activity.entryRoute ?? null,
      runtimeReference: activity.runtimeModule ?? mappedActivity?.runtimeReference ?? null,
      declaredOfficialCodes: activity.curriculumCodes ?? task?.curriculumCodes ?? [],
      linkedProjectFocusIds: exactFocusIds,
      interactionTypes: [...new Set(evidence.flatMap((row) => row.interactionTypes ?? []))],
      interactionStages: [...new Map(evidence.flatMap((row) => (row.stageEvidence ?? []).map((stage) => [`${row.activityId}::${stage.stageId}`, { stageId: stage.stageId, interaction: stage.interaction, learnerAction: stage.learnerAction }]))).values()],
      browserEntryVerification: browserEntryByActivityId.has(activity.activityId)
        ? {
          status: 'directory_launch_and_return_verified',
          executedAt: browserEntryByActivityId.get(activity.activityId).executedAt,
          reportPath: browserEntryByActivityId.get(activity.activityId).reportPath,
          startedFromDirectory: browserEntryByActivityId.get(activity.activityId).startedFromDirectory,
          returnedToCorrectDirectory: browserEntryByActivityId.get(activity.activityId).returnedToCorrectDirectory,
          limitation: '驗證入口啟動、正確活動畫面與返回；未代表逐題完成所有活動內容或教學審查。',
        }
        : { status: 'not_verified', limitation: '目前未找到涵蓋此活動的成功目錄入口瀏覽器報告。' },
      coverageInterpretation: evidence.some((row) => row.evidenceStatus === 'interactive_candidate_subitem_coverage')
        ? '有候選互動子項證據；僅按該焦點所列子項判定部分證據'
        : exactFocusIds.length ? '僅有焦點關聯，沒有此活動的具體互動子項證據' : '尚無已登錄焦點對照；代碼宣告不等於課綱涵蓋',
      teacherReviewStatus: activity.status === 'candidate_pending_teacher_review' ? 'not_reviewed' : 'verify_from_source_record',
    };
  })));

  const registeredActivityIds = new Set(activities.map((activity) => activity.activityId));
  const supplementaryActivityReferences = [
    ...(coverage.activityPlayabilityInventory.relationActivities.activities ?? []),
    ...(coverage.activityPlayabilityInventory.standaloneMathUnits.activities ?? []),
  ].filter((activity, index, all) => !registeredActivityIds.has(activity.activityId)
    && all.findIndex((candidate) => candidate.activityId === activity.activityId) === index)
    .map((activity) => ({
      activityId: activity.activityId,
      gradeId: activity.gradeId ?? null,
      subjectId: activity.subjectId ?? null,
      sourceInventory: activity.runtimeModule ? 'relation_activity_or_standalone_module' : 'legacy_project_reference',
      runtimeModule: activity.runtimeModule ?? null,
      runtimeModuleExists: activity.runtimeModuleExists ?? null,
      taskDataPresent: activity.taskDataPresent ?? null,
      runtimeEvidenceStatus: activity.runtimeEvidenceStatus ?? activity.status ?? 'reference_only',
      launchableInCrossGradeDirectory: false,
      limitation: '此項是既有活動／模組對照參照，不屬於本輪145個年級目錄已註冊入口；不得僅因參照存在宣稱可從新入口啟動。',
    }));
  const knownActivityIds = new Set([...registeredActivityIds, ...supplementaryActivityReferences.map((activity) => activity.activityId)]);
  const verifiedNonMathOfficialContentSlices = boundedNonMathBatches.map((batch) => ({
    batchId: batch.batchId,
    sourceId: batch.sourceId,
    documentTitle: batch.documentTitle,
    publicationInfo: batch.publicationInfo,
    documentVersion: batch.documentVersion ?? 'not_recorded_in_source_batch',
    sourceUrl: batch.sourceUrl,
    applicability: batch.applicability,
    reviewStatus: batch.status,
    officialContentRowCount: batch.clauses.length,
    boundary: batch.boundary,
    items: batch.clauses.map((clause) => ({
      officialCode: clause.code,
      officialText: clause.officialText,
      itemType: clause.itemType,
      learningStage: clause.learningStage,
      sourceLocation: `${batch.sourceLocation}；${clause.sourceLocator}`,
      pdfPageSequence: clause.pdfPageSequence,
      printedPage: clause.printedPage,
      sourceReviewStatus: clause.reviewStatus,
      activityIds: clause.activityIds,
      activityEvidenceStatus: clause.activityEvidenceStatus,
      activityEvidence: clause.activityIds.map((activityId) => {
        const activity = activities.find((row) => row.activityId === activityId);
        const declaredEvidence = (clause.activityEvidence ?? []).find((evidence) => evidence.activityId === activityId);
        const declaredStageIds = declaredEvidence?.stageIds;
        return {
          activityId,
          registered: knownActivityIds.has(activityId),
          evidenceKind: declaredEvidence?.evidenceKind ?? null,
          browserFlowAcceptance: declaredEvidence?.browserAcceptanceReport ? {
            status: declaredEvidence.browserAcceptanceStatus ?? 'reported_without_status',
            reportPath: declaredEvidence.browserAcceptanceReport,
          } : null,
          interactionStages: declaredStageIds
            ? (activity?.interactionStages ?? []).filter((stage) => declaredStageIds.includes(stage.stageId))
            : activity?.interactionStages ?? [],
          limitation: [declaredEvidence?.limit, ...clause.limitations].filter(Boolean).join('；'),
        };
      }),
      limitations: clause.limitations,
    })),
  }));

  const families = sources.sourceInventory.documentFamilies.map((family) => ({
    familyId: family.id,
    domain: family.domain,
    expected: family.expected,
    sourceIds: family.sourceIds,
    documents: family.sourceIds.map((id) => {
      const source = sourceById.get(id);
      return source ? { sourceId: id, title: source.documentTitle, url: source.url, publicationInfo: source.publicationInfo, gradeScope: source.gradeScope, pageOrSection: source.pageOrSection, reviewStatus: source.reviewStatus } : { sourceId: id, missingSourceRecord: true };
    }),
    documentStatus: family.documentStatus,
    clauseEnumerationStatus: family.clauseEnumerationStatus,
    elementaryApplicability: family.elementaryApplicability,
    elementaryDenominatorEligible: coverageFamilyById.get(family.id)?.elementaryDenominatorEligible ?? false,
    verifiedLocation: family.verifiedLocation,
    remainingReason: family.notes,
  }));

  const mathCounts = Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, mathOfficialItems.filter((item) => item.coverageStatus === status).length]));
  const nonMathSliceRows = verifiedNonMathOfficialContentSlices.flatMap((slice) => slice.items);
  const nonMathBoundedSliceCounts = Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, nonMathSliceRows.filter((item) => item.activityEvidenceStatus === status).length]));
  const domainFocusSummary = Object.values(projectFocuses.reduce((groups, focus) => {
    const key = `${focus.subject}::${Array.isArray(focus.learningStage) ? focus.learningStage.join('-') : focus.learningStage ?? 'stage_unassigned'}`;
    const group = groups[key] ??= { subject: focus.subject, learningStage: focus.learningStage, registeredProjectFocusCount: 0, withLinkedActivities: 0, interactiveEvidenceFocuses: 0, relationOnlyOrNoSubitemEvidence: 0, uncovered: 0, needsVerification: 0 };
    group.registeredProjectFocusCount += 1;
    if (focus.linkedActivityIds.length) group.withLinkedActivities += 1;
    if (focus.projectSubitemEvidenceStatus === 'interactive_candidate_subitem_coverage') group.interactiveEvidenceFocuses += 1;
    else if (focus.projectSubitemEvidenceStatus === 'associated_only_no_explicit_subitem_evidence') group.relationOnlyOrNoSubitemEvidence += 1;
    else if (focus.projectSubitemEvidenceStatus === 'uncovered') group.uncovered += 1;
    else if (focus.projectSubitemEvidenceStatus === 'needs_verification') group.needsVerification += 1;
    return groups;
  }, {})).sort((a, b) => a.subject.localeCompare(b.subject) || String(a.learningStage).localeCompare(String(b.learningStage)));

  return {
    schemaVersion: 1,
    reportId: 'official-learning-item-activity-crosswalk',
    generatedAt: mathAudit.generatedAt,
    status: 'partial_inventory_not_complete_official_elementary_curriculum',
    scope: {
      officialDocumentFamilyCount: coverage.sourceInventory.expectedElementaryFormalDocumentFamilyCount,
      locatedOfficialDocumentFamilyCount: coverage.sourceInventory.expectedElementaryFormalDocumentFamiliesLocated,
      trackedDocumentFamilyRecordCount: sources.sourceInventory.documentFamilies.length,
      fullyEnumeratedOfficialDocumentFamilyCount: families.filter((family) => family.elementaryDenominatorEligible && family.clauseEnumerationStatus === 'fully_enumerated').length,
      mathRegisteredOfficialLearningContentRows: mathOfficialItems.length,
      mathUniqueOfficialContentCodes: new Set(mathOfficialItems.map((item) => item.officialCode)).size,
      mathOfficialLearningPerformanceRows: mathAudit.clauseBatch.learningPerformanceClauseCount,
      allRegisteredCandidateActivityEntries: activities.length,
      browserVerifiedActivityEntries: activities.filter((activity) => activity.browserEntryVerification.status === 'directory_launch_and_return_verified').length,
      latestBrowserEntryReport: latestBrowserEntryReport?.relativePath ?? null,
      supplementalBrowserEntryEvidenceReports: supplementalBrowserEntryEvidence.map(({ relativePath }) => relativePath),
      registeredProjectFocusRows: projectFocuses.length,
      officialElementaryItemTotal: null,
      nationalCoverageRate: null,
      denominatorExplanation: '數學分母僅為目前六份逐表批次所登錄的131個唯一官方學習內容代碼；不是經官方宣告的總數。其他領域只呈現專案已登錄焦點，未以焦點列當成官方條目總數。',
    },
    sourceFamilies: families,
    mathOfficialLearningContentItems: mathOfficialItems,
    verifiedNonMathOfficialContentSlices,
    verifiedNonMathBoundedSliceCounts: {
      registeredOfficialContentRows: nonMathSliceRows.length,
      bySource: Object.fromEntries([...new Set(verifiedNonMathOfficialContentSlices.map((slice) => slice.sourceId))].map((sourceId) => [sourceId, verifiedNonMathOfficialContentSlices.filter((slice) => slice.sourceId === sourceId).flatMap((slice) => slice.items).length])),
      byCoverageStatus: nonMathBoundedSliceCounts,
      denominatorBoundary: '只計入已登錄的有界官方來源切片；不代表該領域完整官方條目數。',
    },
    mathCoverageCountsWithinRegisteredRows: mathCounts,
    mathCoverageSummaryByGradeTable: [1, 2, 3, 4, 5, 6].map((grade) => {
      const rows = mathOfficialItems.filter((item) => item.applicability.officialGradeTable === grade);
      return {
        officialGradeTable: grade,
        learningStage: rows[0]?.applicability.learningStage ?? null,
        registeredOfficialCodeRows: rows.length,
        uniqueCodeCount: new Set(rows.map((item) => item.officialCode)).size,
        ...Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, rows.filter((item) => item.coverageStatus === status).length])),
      };
    }),
    registeredProjectFocusCrosswalk: projectFocuses,
    registeredProjectFocusSummaryBySubjectAndStage: domainFocusSummary,
    actualRegisteredActivities: activities,
    supplementaryActivityReferences,
    limitations: [
      '全國15個預期文件家族均有來源位置，但現行來源清冊仍將條文枚舉標為部分或待核；0份文件家族完成全量逐條枚舉。',
      '131筆數學學習內容為目前批次逐條核對的範圍；不能推算為官方數學領綱總數，也不能計算全國課綱涵蓋率。',
      '非數學領域所列的是專案焦點與活動關聯，不能替代官方文件逐條清冊；其未列官方條目數不是零，而是尚未枚舉。',
      '候選活動與其工程互動證據仍未經教師審查；工程／瀏覽器驗收不代表教學有效性或學生精熟。',
    ],
    validation: { errors: [], warnings: [] },
  };
}

export function validateOfficialLearningItemCrosswalk(report) {
  const errors = [];
  const codes = report.mathOfficialLearningContentItems.map((item) => item.officialCode);
  if (new Set(codes).size !== codes.length) errors.push('duplicate_mathematics_official_code');
  if (report.mathOfficialLearningContentItems.some((item) => !item.officialText || !item.source.sourceLocation || !item.relatedPerformanceCodes.length)) errors.push('math_item_missing_official_text_source_or_performance_link');
  if (report.mathOfficialLearningContentItems.length !== report.scope.mathRegisteredOfficialLearningContentRows) errors.push('math_official_item_denominator_mismatch');
  if (report.actualRegisteredActivities.length !== new Set(report.actualRegisteredActivities.map((item) => item.activityId)).size) errors.push('duplicate_registered_activity_id');
  const activityIds = new Set([
    ...report.actualRegisteredActivities.map((item) => item.activityId),
    ...report.supplementaryActivityReferences.map((item) => item.activityId),
  ]);
  for (const item of report.mathOfficialLearningContentItems) {
    for (const id of item.activityIds) if (!activityIds.has(id)) errors.push(`math_clause_maps_to_unknown_activity:${item.officialCode}:${id}`);
  }
  for (const focus of report.registeredProjectFocusCrosswalk) {
    for (const id of focus.linkedActivityIds) if (!activityIds.has(id)) errors.push(`focus_maps_to_unknown_activity:${focus.focusId}:${id}`);
  }
  for (const slice of report.verifiedNonMathOfficialContentSlices ?? []) {
    if (!slice.sourceUrl || !slice.applicability?.learningStage) errors.push(`nonmath_slice_missing_source_or_stage:${slice.batchId}`);
    if (!slice.reviewStatus?.startsWith('verified_bounded_official_content_subsection_')) errors.push(`nonmath_slice_not_marked_bounded_and_verified:${slice.batchId}`);
    const ids = slice.items.map((item) => item.officialCode);
    if (new Set(ids).size !== ids.length || ids.length !== slice.officialContentRowCount) errors.push(`nonmath_slice_row_or_code_mismatch:${slice.batchId}`);
    for (const item of slice.items) {
      if (!item.officialText || !item.sourceLocation || !item.sourceReviewStatus || item.itemType !== 'learning_content'
        || !item.learningStage || !Number.isInteger(item.pdfPageSequence) || !Number.isInteger(item.printedPage)) errors.push(`nonmath_item_missing_traceability:${item.officialCode}`);
      if (!['partial', 'relation_only', 'uncovered', 'needs_verification'].includes(item.activityEvidenceStatus)) errors.push(`nonmath_item_invalid_activity_evidence_status:${item.officialCode}`);
      for (const activityId of item.activityIds) if (!activityIds.has(activityId)) errors.push(`nonmath_item_maps_to_unknown_activity:${item.officialCode}:${activityId}`);
    }
  }
  if (report.scope.officialElementaryItemTotal !== null || report.scope.nationalCoverageRate !== null) errors.push('national_coverage_must_remain_unknown_until_complete_enumeration');
  report.validation.errors = [...new Set(errors)];
  report.validation.warnings = report.sourceFamilies.filter((family) => family.elementaryDenominatorEligible && family.clauseEnumerationStatus !== 'fully_enumerated').map((family) => `clause_enumeration_incomplete:${family.familyId}`);
  return report.validation;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = buildOfficialLearningItemCrosswalk();
  const validation = validateOfficialLearningItemCrosswalk(report);
  if (process.argv.includes('--build')) {
    if (validation.errors.length) {
      console.error(JSON.stringify(validation, null, 2));
      process.exitCode = 1;
    } else {
      fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), status: report.status, scope: report.scope, mathCoverageCountsWithinRegisteredRows: report.mathCoverageCountsWithinRegisteredRows, sourceFamilyCount: report.sourceFamilies.length, incompleteSourceFamilyCount: validation.warnings.length, validation }, null, 2));
    }
  } else {
    const saved = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    const expected = `${JSON.stringify(report, null, 2)}\n`;
    if (validation.errors.length || saved !== expected) {
      console.error(JSON.stringify({ validation, artifactMatchesGeneratedData: saved === expected }, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ validation: 'passed', output: path.relative(ROOT, outputPath), mathRows: report.mathOfficialLearningContentItems.length, activityEntries: report.actualRegisteredActivities.length, projectFocusRows: report.registeredProjectFocusCrosswalk.length, incompleteSourceFamilies: validation.warnings.length }, null, 2));
    }
  }
}
