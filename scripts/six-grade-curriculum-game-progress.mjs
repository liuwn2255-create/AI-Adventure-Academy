import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const outputPath = path.join(ROOT, 'artifacts/six-grade-curriculum-game-progress.json');
const CURRENT_TURN_MATH_G1_CODES = new Set(['N-1-1', 'N-1-2', 'N-1-3', 'N-1-4', 'N-1-5', 'N-1-6', 'S-1-1', 'S-1-2', 'R-1-1', 'R-1-2', 'D-1-1']);
const CURRENT_TURN_MATH_G2_CODES = new Set(['N-2-1', 'N-2-2', 'N-2-3', 'N-2-4', 'N-2-5', 'N-2-6', 'N-2-7', 'N-2-8', 'N-2-9', 'N-2-10', 'N-2-11', 'N-2-12', 'N-2-13', 'N-2-14', 'S-2-1', 'S-2-2', 'S-2-3', 'S-2-4', 'S-2-5', 'R-2-1', 'R-2-2', 'R-2-3', 'R-2-4', 'D-2-1']);
const CURRENT_TURN_MATH_G3_CODES = new Set(['N-3-1', 'N-3-2', 'N-3-3', 'N-3-4', 'N-3-5', 'N-3-6', 'N-3-7', 'N-3-8', 'N-3-9', 'N-3-10', 'N-3-11', 'N-3-12', 'N-3-13', 'N-3-14', 'N-3-15', 'N-3-16', 'N-3-17', 'S-3-1', 'S-3-2', 'S-3-3', 'S-3-4', 'R-3-1', 'R-3-2', 'D-3-1']);

function countBy(values, selector) {
  return values.reduce((counts, value) => {
    const key = selector(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function buildSixGradeProgress() {
  const sources = read('curriculum/sources.json');
  const coverage = read('curriculum/coverage-inventory.json');
  const subitemDefinitions = read('curriculum/learning-subitem-definitions.json');
  const crosswalk = read('artifacts/official-learning-item-activity-crosswalk.json');
  const sourceById = new Map(sources.sources.map((source) => [source.id, source]));
  const focusRows = crosswalk.registeredProjectFocusCrosswalk;
  const activities = crosswalk.actualRegisteredActivities;
  const expectedFamilies = crosswalk.sourceFamilies.filter((family) => family.expected && family.elementaryDenominatorEligible);

  const documentFamilies = crosswalk.sourceFamilies.map((family) => {
    const documents = family.documents.map((document) => {
      const source = sourceById.get(document.sourceId);
      const isMath = document.sourceId === 'mathematics';
      const mathContentRows = isMath ? crosswalk.mathOfficialLearningContentItems.length : null;
      const mathPerformanceRows = isMath ? crosswalk.scope.mathOfficialLearningPerformanceRows : null;
      return {
        sourceId: document.sourceId,
        title: document.title,
        organization: source?.organization ?? null,
        publicationInfo: document.publicationInfo,
        version: source?.version ?? null,
        url: document.url,
        localFile: source?.localFile ?? null,
        documentStatus: family.documentStatus,
        clauseEnumerationStatus: family.clauseEnumerationStatus,
        gradeScope: document.gradeScope,
        pageOrSection: document.pageOrSection,
        sourceRegisteredCodeReferenceCount: Array.isArray(source?.verifiedClauses) ? source.verifiedClauses.length : null,
        sourceRegisteredCodeReferences: source?.verifiedClauses ?? [],
        sourceReferenceInterpretation: '來源登錄的代碼參照數；不代表本輪逐頁重讀、不保證完整枚舉，也不等同條目數。',
        registeredMathLearningContentRowCount: mathContentRows,
        registeredMathPerformanceRowCount: mathPerformanceRows,
        inventoryComplete: family.clauseEnumerationStatus === 'fully_enumerated',
        officialTextInventoryStatus: document.sourceId === 'mathematics'
          ? 'math_official_text_and_locations_available_for_131_registered_grade_table_rows; full_official_inventory_not_certified'
          : 'not_enumerated_in_current_crosswalk; source metadata and registered references only',
        remainingReason: family.remainingReason,
        notes: source?.notes ?? family.remainingReason ?? '',
      };
    });
    return {
      familyId: family.familyId,
      domain: family.domain,
      expected: family.expected,
      elementaryDenominatorEligible: family.elementaryDenominatorEligible,
      documentStatus: family.documentStatus,
      clauseEnumerationStatus: family.clauseEnumerationStatus,
      elementaryApplicability: family.elementaryApplicability,
      verifiedLocation: family.verifiedLocation,
      remainingReason: family.remainingReason,
      documents,
    };
  });

  const subjectRows = coverage.gradeSubjectDirectory.map((slot) => {
    const grade = slot.gradeNumber;
    const slotActivities = activities.filter((activity) => activity.gradeId === slot.gradeId && activity.subjectId === slot.subjectId);
    const slotFocuses = focusRows.filter((focus) => focus.subject === slot.learningMapSubjectId
      && Array.isArray(focus.gradeRange) && focus.gradeRange.includes(grade));
    return {
      grade,
      gradeId: slot.gradeId,
      subjectId: slot.subjectId,
      learningMapSubjectId: slot.learningMapSubjectId,
      subjectName: slot.subjectName,
      frameworkGradeScope: slot.frameworkGradeScope,
      directoryEntryStatus: slot.directoryEntryStatus,
      directoryActivityIds: slot.directoryActivityIds,
      registeredActivityCount: slotActivities.length,
      activities: slotActivities.map((activity) => ({
        activityId: activity.activityId,
        title: activity.title,
        status: activity.status,
        launchRoute: activity.launchRoute,
        runtimeReference: activity.runtimeReference,
        browserEntryVerification: activity.browserEntryVerification.status,
        coverageInterpretation: activity.coverageInterpretation,
      })),
      registeredProjectFocusCount: slotFocuses.length,
      focusEvidenceCounts: countBy(slotFocuses, (focus) => focus.projectSubitemEvidenceStatus),
      focusIds: slotFocuses.map((focus) => focus.focusId),
      caution: '年級為專案目錄/焦點配置；若官方只列學習階段，不代表官方指定單一年級或學期。空目錄不表示官方無課程要求。',
    };
  });

  const mathItems = crosswalk.mathOfficialLearningContentItems.map((item) => ({
    officialItemId: item.officialItemId,
    officialCode: item.officialCode,
    officialText: item.officialText,
    learningStage: item.applicability.learningStage,
    officialGradeTable: item.applicability.officialGradeTable,
    sourceId: item.source.sourceId,
    sourceUrl: item.source.url,
    sourceLocation: item.source.sourceLocation,
    officialReviewStatus: item.source.reviewStatus,
    currentTurnSourceCrossCheck: CURRENT_TURN_MATH_G1_CODES.has(item.officialCode)
      ? 'official_pdf_P21_P22_checked_against_batch_and_crosswalk_this_turn'
      : CURRENT_TURN_MATH_G2_CODES.has(item.officialCode)
        ? 'official_pdf_P22_P25_checked_against_batch_and_crosswalk_this_turn'
        : CURRENT_TURN_MATH_G3_CODES.has(item.officialCode)
          ? 'official_pdf_P25_P28_checked_against_batch_and_crosswalk_this_turn'
      : 'no_new_pdf_cross_check_this_turn',
    relatedPerformanceCodes: item.relatedPerformanceCodes,
    activityIds: item.activityIds,
    interactionEvidence: item.activityEvidence,
    coverageStatus: item.coverageStatus,
    coverageReason: item.coverageReason,
    boundary: item.coverageBoundary,
  }));

  const mathStatusCounts = countBy(mathItems, (item) => item.coverageStatus);
  const focusStatusCounts = countBy(focusRows, (focus) => focus.projectSubitemEvidenceStatus);
  const activityStatusCounts = countBy(activities, (activity) => activity.status);
  const nonMathSlices = crosswalk.verifiedNonMathOfficialContentSlices ?? [];
  const nonMathRowsBySource = Object.fromEntries([...new Set(nonMathSlices.map((slice) => slice.sourceId))]
    .map((sourceId) => [sourceId, nonMathSlices.filter((slice) => slice.sourceId === sourceId).flatMap((slice) => slice.items)]));
  const naturalScienceSlices = nonMathSlices.filter((slice) => slice.sourceId === 'natural-science');
  const socialStudiesSlices = nonMathSlices.filter((slice) => slice.sourceId === 'social-studies');
  const officialFamiliesIncomplete = expectedFamilies.filter((family) => family.clauseEnumerationStatus !== 'fully_enumerated');

  return {
    schemaVersion: 1,
    progressId: 'six-grade-curriculum-game-progress',
    generatedAt: new Date().toISOString(),
    overallStatus: 'in_progress_official_inventory_incomplete',
    repositoryState: {
      gitMetadataAvailable: fs.existsSync(path.join(ROOT, '.git')),
      note: '本工作目錄沒有可讀取的 .git 資料夾；無法以 Git 查詢工作區修改或最近提交。未執行還原、提交、推送或部署。',
    },
    totals: {
      officialElementaryDocumentFamilyCount: expectedFamilies.length,
      locatedOfficialDocumentFamilyCount: expectedFamilies.filter((family) => ['verified_document', 'official_reference_located'].includes(family.documentStatus)).length,
      fullyEnumeratedOfficialDocumentFamilyCount: expectedFamilies.filter((family) => family.clauseEnumerationStatus === 'fully_enumerated').length,
      incompleteOfficialDocumentFamilies: officialFamiliesIncomplete.map((family) => family.familyId),
      registeredMathLearningContentRows: mathItems.length,
      registeredMathRowsByCoverageStatus: mathStatusCounts,
      registeredMathPerformanceRowCount: crosswalk.scope.mathOfficialLearningPerformanceRows,
      registeredProjectFocusCount: focusRows.length,
      projectFocusEvidenceCounts: focusStatusCounts,
      registeredProjectSubitemDefinitionCount: subitemDefinitions.definitions?.length ?? 0,
      registeredNaturalScienceProjectSubitemDefinitionCount: subitemDefinitions.definitions?.filter((item) => item.subject === 'natural_science' && item.decompositionKind === 'project_decomposition_from_verified_official_stage_clause_not_official_subclause').length ?? 0,
      registeredNaturalScienceOfficialLearningContentRows: (nonMathRowsBySource['natural-science'] ?? []).length,
      registeredSocialStudiesOfficialLearningContentRows: (nonMathRowsBySource['social-studies'] ?? []).length,
      registeredNonMathBoundedOfficialContentSliceRows: crosswalk.verifiedNonMathBoundedSliceCounts?.registeredOfficialContentRows ?? (crosswalk.verifiedNonMathOfficialContentSlices ?? []).reduce((sum, slice) => sum + slice.officialContentRowCount, 0),
      nonMathBoundedSliceCoverageCounts: crosswalk.verifiedNonMathBoundedSliceCounts?.byCoverageStatus ?? {},
      naturalScienceBoundedSliceCountsByBatch: naturalScienceSlices.map((slice) => ({ batchId: slice.batchId, officialContentRowCount: slice.officialContentRowCount, statusCounts: countBy(slice.items, (item) => item.activityEvidenceStatus) })),
      socialStudiesBoundedSliceCountsByBatch: socialStudiesSlices.map((slice) => ({ batchId: slice.batchId, officialContentRowCount: slice.officialContentRowCount, statusCounts: countBy(slice.items, (item) => item.activityEvidenceStatus) })),
      registeredActivityCount: activities.length,
      registeredActivityStatusCounts: activityStatusCounts,
      officialElementaryLearningItemTotal: null,
      nationalCoverageRate: null,
      denominatorRule: '官方總量未知。數學計數僅為目前交叉表所登錄的官方代碼列；學習表現、專案焦點與活動入口分開計數。其他領域登錄代碼參照不是逐條完整清冊。',
    },
    sources: {
      catalogSource: sources.catalogSource,
      sourceInventoryStatus: sources.sourceInventory.status,
      documentFamilies,
      verifiedBoundedContentBatches: sources.sources.flatMap((source) => (source.verifiedContentBatches ?? []).map((batch) => ({
        sourceId: source.id,
        batchId: batch.batchId,
        batchFile: batch.batchFile,
        status: batch.status,
        officialContentRowCount: batch.officialContentRowCount,
        itemType: batch.itemType,
        learningStage: batch.learningStage,
        sourceLocation: batch.sourceLocation,
        boundary: batch.boundary,
        batchCompleteness: 'bounded_subsection_complete; document_family_incomplete_unless_separately_verified',
      }))),
    },
    naturalScienceReviewThisTurn: {
      status: 'partial_bounded_official_subsections_verified_not_full_document',
      sourceId: 'natural-science',
      sourceUrl: crosswalk.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId.includes('inc'))?.sourceUrl ?? null,
      documentTitle: crosswalk.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId.includes('inc'))?.documentTitle ?? null,
      publicationInfo: crosswalk.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId.includes('inc'))?.publicationInfo ?? null,
      documentVersion: crosswalk.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId.includes('inc'))?.documentVersion ?? 'official PDF did not establish a separate version label',
      batches: naturalScienceSlices.map((slice) => ({
        batchId: slice.batchId,
        officialContentRowCount: slice.officialContentRowCount,
        reviewStatus: slice.reviewStatus,
        pdfPageSequenceRange: [Math.min(...slice.items.map((item) => item.pdfPageSequence)), Math.max(...slice.items.map((item) => item.pdfPageSequence))],
        printedPageRange: [Math.min(...slice.items.map((item) => item.printedPage)), Math.max(...slice.items.map((item) => item.printedPage))],
        coverageStatusCounts: countBy(slice.items, (item) => item.activityEvidenceStatus),
        completeOfficialTextRows: slice.items.filter((item) => item.officialText && item.sourceLocation && item.sourceReviewStatus).length,
      })),
      fullyEnumeratedDocumentFamilyCount: 0,
      nextPosition: '依最新自然科學清冊與交叉表，從尚未逐條核讀的官方小節接續；先核實原始 PDF 的標題、表格範圍與頁碼，不預設下一個代碼。',
      limitation: '本次核讀 INe-II 第二學習階段11列學習內容；總進度同時保留既有 INa、INb、INc、INd 有界批次。各批皆不代表自然科學整份文件完整枚舉，也未把第二學習階段拆指派至三或四年級。',
    },
    socialStudiesReviewThisTurn: {
      status: 'partial_bounded_official_subsection_verified_not_full_document',
      sourceId: 'social-studies',
      batchId: 'social-studies-stage2-ba-a-individual-difference-pdf-page-100',
      documentTitle: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')?.documentTitle ?? null,
      sourceUrl: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')?.sourceUrl ?? null,
      publicationInfo: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')?.publicationInfo ?? null,
      documentVersion: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')?.documentVersion ?? '官方 PDF 封面資訊未確認獨立版本標籤',
      officialContentRowCount: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')?.officialContentRowCount ?? 0,
      pdfPageSequenceRange: [100, 100],
      printedPageRange: [96, 96],
      coverageStatusCounts: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')
        ? countBy(socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100').items, (item) => item.activityEvidenceStatus) : {},
      browserAcceptance: socialStudiesSlices.find((slice) => slice.batchId === 'social-studies-stage2-ba-a-individual-difference-pdf-page-100')?.items[0]?.activityEvidence[0]?.browserFlowAcceptance ?? null,
      fullyEnumeratedDocumentFamilyCount: 0,
      nextPosition: '依最新社會領域清冊與交叉表，從尚未逐條核讀的官方範圍接續；先核實原始 PDF 的條目、表格位置與頁碼，不預設下一個代碼。',
      limitation: '只核對一條有界學習內容；不代表社會領域文件或階段條目完整枚舉。官方適用範圍仍為第二學習階段，未推定單一年級/學期。',
    },
    moneyTaskAuditThisTurn: {
      activityId: 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE',
      status: 'audited_existing_interaction_no_game_code_change_this_turn',
      candidateStatus: 'candidate_pending_teacher_review',
      teacherReviewStatus: 'not_reviewed',
      officialCode: 'N-2-5',
      officialText: '解題：100元、500元、1000元。以操作活動為主兼及計算。容許多元策略，協助建立數感。包含已學習之更小幣值。',
      officialPerformanceCode: 'n-I-3',
      officialSourceLocation: '數學二年級官方學習內容表 N-2-5 PDF頁序23；學習表現 n-I-3 PDF頁序11。官方備註表示本單元可與N-2-4估算連結。',
      evidence: [
        '學生可切換模擬面額卡，系統即時計算已選卡片總額並以精確金額判定。',
        '100、500、1000元各有至少兩種預先列出的有效等值組合；測試驗證每組面額加總等於目標。',
        '錯誤付款會說明不足／超出／須剛好，提供兩層提示、重試、逐站完成、摘要及重玩；單元測試與既有隔離瀏覽器報告有相應流程證據。',
        'N-2-4估算僅可作為官方備註所允許的關聯；不把估算任務計為N-2-5付款互動證據。',
      ],
      coverage: 'partial',
      uncovered: ['只有預設的一組等值方案，尚不能證明學生自主提出多元付款策略或完整比較策略。', '不含找零（官方N-2-5原文未明列找零為必要要求）、真實交易或實體錢幣／紙鈔操作。', '教師對先備幣值、年齡適切性與學生口頭策略說明的觀察尚未進行。'],
      reasonNoChange: '既有程式已提供實際面額操作、不同等值組合、即時合計、錯誤診斷、雙層提示、重試、完成與重玩；未發現需要重做遊戲的缺陷，故保留 partial 並記錄剩餘範圍。',
    },
    gameChangesThisTurn: [{
      activityId: 'ACT-G2-MATH-DATA-CLASSIFICATION-NESTED-GROUPS-CANDIDATE',
      title: '幾何物件分類工坊：先分組，再細分',
      gradeId: 'grade-2',
      subjectId: 'mathematics',
      candidateStatus: 'candidate_pending_teacher_review',
      teacherReviewStatus: 'not_reviewed',
      officialCodes: ['D-2-1', 'd-I-1'],
      officialContentSource: 'mathematics',
      officialContentLocation: '官方數學領綱 PDF 頁序25（D-2-1）；頁序11（d-I-1）',
      interactions: [
        { stageId: 'collect-geometric-object-cards', learnerOperation: '在預設混合物件卡中蒐集平面形體資料', evidenceLimit: '模擬樣本，非學生實地蒐集' },
        { stageId: 'classify-geometric-cards-by-color', learnerOperation: '逐卡按顏色放入分類盤並提交檢查' },
        { stageId: 'refine-red-group-by-shape', learnerOperation: '將顏色類別中的紅色組再依形狀細分' },
      ],
      coverage: 'partial',
      uncovered: ['沒有正式表格或統計圖表教學；官方備註排除正式表格/圖表教學。', '沒有真實環境自主蒐集、口頭完整說明或教師觀察。'],
      browserAcceptanceReport: 'artifacts/grade2-data-classification-browser-acceptance/acceptance-report.json',
      browserAcceptanceStatus: 'passed_1366x768_390x844_340x740',
    }, {
      activityId: 'ACT-G2-MATH-UNKNOWN-QUANTITY-MODEL-CANDIDATE',
      title: '補給方程港：找出藏起來的數',
      gradeId: 'grade-2',
      subjectId: 'mathematics',
      candidateStatus: 'candidate_pending_teacher_review',
      teacherReviewStatus: 'not_reviewed',
      officialCodes: ['N-2-3', 'n-I-3', 'R-2-4', 'r-I-3'],
      officialContentSource: 'mathematics',
      officialContentLocation: '沿用既有核對批次：N-2-3 PDF頁序22–23；R-2-4 PDF頁序25；對應表現 n-I-3 PDF頁序10、r-I-3 PDF頁序11。本輪未重新取得或核讀PDF。',
      interactions: [
        { stageId: 'find-missing-addend', learnerOperation: '逐一調整未知加數並檢查兩部分是否合成總數', evidenceLimit: '螢幕數量模型，只支持部分互動證據' },
        { stageId: 'find-missing-minuend', learnerOperation: '以拿走量和剩餘量重建原有總數', evidenceLimit: '未涵蓋多元生活情境與學生自主列式' },
        { stageId: 'find-missing-subtrahend', learnerOperation: '調整取走數並觀察減後的剩餘量', evidenceLimit: '候選微型任務，不等於完整課程' },
        { stageId: 'verify-subtraction-with-addition', learnerOperation: '把剩餘量與取走量相加以驗證原數', evidenceLimit: '僅一種加減互逆檢查策略' },
      ],
      coverage: 'partial',
      uncovered: ['未涵蓋完整生活情境、學生自主列式及口頭完整解釋。', '數位 counters 不替代實物操作、教師觀察或正式評量。'],
      browserAcceptanceReport: 'artifacts/grade2-unknown-quantity-browser-acceptance/acceptance-report.json',
      browserAcceptanceStatus: 'passed_1366x768_390x844_340x740',
    }, {
      activityId: 'ACT-G2-MATH-UNIT-FRACTION-PAPER-FOLD-MODEL-CANDIDATE',
      title: '紙帶折分工作坊：認識幾分之一',
      gradeId: 'grade-2',
      subjectId: 'mathematics',
      candidateStatus: 'candidate_pending_teacher_review',
      teacherReviewStatus: 'not_reviewed',
      officialCodes: ['N-2-10', 'n-I-6'],
      officialContentSource: 'mathematics',
      officialContentLocation: '沿用既有批次核對：N-2-10 PDF頁序23–24；n-I-6 PDF頁序11。本輪未重新取得或核讀PDF。',
      interactions: [
        { stageId: 'build-one-half-paper-strip', learnerOperation: '選擇完整紙帶、設定二等分並將一片移入整體模型', evidenceLimit: '螢幕連續量長條模型，部分互動證據' },
        { stageId: 'build-one-fourth-paper-strip', learnerOperation: '設定四等分並操作一片以表示四分之一', evidenceLimit: '尚未有圓形模型或實體摺紙' },
        { stageId: 'build-one-eighth-paper-strip', learnerOperation: '設定八等分後取一片並觀察單位分數', evidenceLimit: '未包含格圖自主說明及教師觀察' },
      ],
      coverage: 'partial',
      uncovered: ['實體摺紙、圓形分數模型及已等分格圖的自主說明。', '不處理離散量或分數運算；教師審查與教學成效待確認。'],
      browserAcceptanceReport: 'artifacts/grade2-math-workshops-browser-acceptance/acceptance-report.json',
      browserAcceptanceStatus: 'passed_1366x768_390x844_340x740',
    }, {
      activityId: 'ACT-G2-MATH-LIFE-ESTIMATION-HUNDREDS-CANDIDATE', title: '百數估算補給站：先想大約多少', gradeId: 'grade-2', subjectId: 'mathematics', candidateStatus: 'candidate_pending_teacher_review', teacherReviewStatus: 'not_reviewed', officialCodes: ['N-2-4', 'n-I-3'], officialContentSource: 'mathematics', officialContentLocation: '二年級官方學習內容表 N-2-4，PDF頁序23；第一學習階段表現 n-I-3，PDF頁序11。', interactions: [{ stageId: 'estimate-class-library-books', learnerOperation: '依百位估算線索調整生活情境總量估值', evidenceLimit: '滑桿及接受區間是專案模型，非官方誤差標準' }, { stageId: 'estimate-school-fair-change', learnerOperation: '估算使用後剩餘票數並比較情境線索', evidenceLimit: '未要求學生自選策略或口頭說明' }, { stageId: 'estimate-sports-day-supplies', learnerOperation: '將百位估算策略遷移至新加法情境', evidenceLimit: '模擬任務不證明真實生活中獨立估算能力' }], coverage: 'partial', uncovered: ['自選與表達估算策略、多樣個人情境及教師觀察。'], browserAcceptanceReport: 'artifacts/grade2-estimation-length-browser-acceptance/acceptance-report.json', browserAcceptanceStatus: 'passed_1366x768_390x844_340x740'
    }, {
      activityId: 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE',
      title: '幣值組合市集：選幣付款任務',
      gradeId: 'grade-2',
      subjectId: 'mathematics',
      candidateStatus: 'candidate_pending_teacher_review',
      teacherReviewStatus: 'not_reviewed',
      officialCodes: ['N-2-5', 'n-I-3'],
      officialContentSource: 'mathematics',
      officialContentLocation: '二年級官方批次 N-2-5，PDF頁序23；同表學習表現 n-I-3。',
      interactions: [
        { stageId: 'pay-market-basket-one-hundred', learnerOperation: '多選面額卡組成100元並查看即時總額', evidenceLimit: '數位面額模型，不替代實體錢幣與紙鈔操作' },
        { stageId: 'pay-market-basket-five-hundred', learnerOperation: '以面額卡組成500元，接受多種事先列出的等值組合', evidenceLimit: '樣例組合不是全部策略；未要求學生自行說明策略' },
        { stageId: 'pay-market-basket-one-thousand', learnerOperation: '操作面額組成1000元並核對付款總額', evidenceLimit: '未包含找零與完整生活購物決策' },
      ],
      coverage: 'partial',
      uncovered: ['沒有找零情境、完整生活購物解題及自主策略說明；未涵蓋實物操作或教師觀察。'],
      browserAcceptanceReport: 'artifacts/grade2-money-market-browser-acceptance/acceptance-report.json',
      browserAcceptanceStatus: 'passed_1366x768_390x844_340x740',
    }, {
      activityId: 'ACT-G2-MATH-LENGTH-MEASURE-CONVERT-CANDIDATE', title: '公分公尺測量碼頭：估一估、對一對、換一換', gradeId: 'grade-2', subjectId: 'mathematics', candidateStatus: 'candidate_pending_teacher_review', teacherReviewStatus: 'not_reviewed', officialCodes: ['N-2-11', 'n-I-7'], officialContentSource: '二年級官方學習內容表 N-2-11，PDF頁序24；第一學習階段表現 n-I-7，PDF頁序11。', interactions: [{ stageId: 'estimate-ribbon-centimeters', learnerOperation: '用公分刻度模型估測長度', evidenceLimit: '畫面估測不等同真實量感' }, { stageId: 'align-ruler-zero-and-read-bookmark', learnerOperation: '移動尺對齊零刻度並讀取非零起點物件長度', evidenceLimit: '模擬尺不取代實體量測' }, { stageId: 'compare-and-find-centimeter-difference', learnerOperation: '讀取兩個長度並操作差值', evidenceLimit: '預設螢幕物件不是實際測量' }, { stageId: 'convert-two-meters-to-centimeters', learnerOperation: '以計算步驟連結公尺及公分', evidenceLimit: '示例限制個位數公尺；不證明完整換算精熟' }, { stageId: 'combine-meters-and-centimeters', learnerOperation: '分解公尺換算後再組合複名數', evidenceLimit: '無曲線或真實物件測量' }], coverage: 'partial', uncovered: ['實物尺規操作、真實估測與曲線量測、教師觀察量感。'], browserAcceptanceReport: 'artifacts/grade2-estimation-length-browser-acceptance/acceptance-report.json', browserAcceptanceStatus: 'passed_1366x768_390x844_340x740'
    }],
    gradeSubjectProgress: subjectRows,
    mathOfficialLearningContentItems: mathItems,
    verifiedNonMathOfficialContentSlices: crosswalk.verifiedNonMathOfficialContentSlices ?? [],
    priorMathTableReviews: {
      status: 'historical_verified_batches',
      batchesReviewed: [{
        sourceId: 'mathematics',
        officialGradeTable: 1,
        documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－數學領域',
        version: '教育部107年7月26日發布；官方PDF封面標示中華民國107年6月',
        url: sourceById.get('mathematics')?.url,
        pdfPageSequence: 'P21–P22：一年級學習內容表，自N-1-1起至D-1-1止；P22後接二年級表頭。頁序為PDF頁序。',
        officialCodeRowsReviewed: 11,
        distinctConceptsUnderExplicitEquivalentCodeRule: 10,
        retainedEquivalentCodes: ['N-1-5', 'S-1-1'],
        conceptRelationship: '官方明示S-1-1「長度（同N-1-5）」；保留兩列官方代碼，概念層只計一次。',
        batchCrosswalkComparison: '本機 math-grade1-official-content-batch.json 的11列與交叉表11列逐碼比對，官方原文欄完全一致；未發現代碼缺列或原文差異。',
        limitation: '本輪僅核讀一年級表；未核讀其餘五年級表與其他領域PDF。官方總課綱條目總量仍未知。',
      }, {
        sourceId: 'mathematics',
        officialGradeTable: 2,
        documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－數學領域',
        version: '教育部107年7月26日發布；官方PDF封面標示中華民國107年6月',
        url: sourceById.get('mathematics')?.url,
        pdfPageSequence: 'P22–P25：二年級表頭至D-2-1列及表尾；跨頁續文與備註追至P25，頁序為PDF頁序。',
        officialCodeRowsReviewed: 24,
        distinctConceptsUnderExplicitEquivalentCodeRule: 24,
        explicitEquivalentCodeAliases: [],
        crossCodeRelationshipNotes: ['N-2-12 與 S-2-5：官方備註指出 S-2-5 為 N-2-12 的部分內容；保留兩個條目，不合併。'],
        batchCrosswalkComparison: '本機 math-grade2-official-content-batch.json 的24列與交叉表24列逐碼比對，官方原文欄完全一致；未發現代碼缺列或原文差異。',
        limitation: '僅核讀二年級數學學習內容表；不代表二年級表現清單、全數學領綱或其他領域完整。',
      }, {
        sourceId: 'mathematics',
        officialGradeTable: 3,
        documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－數學領域',
        version: '教育部107年7月26日發布；官方PDF封面標示中華民國107年6月',
        url: sourceById.get('mathematics')?.url,
        pdfPageSequence: 'P25–P28：三年級學習內容表完整起訖，含跨頁的 S-3-4 續文、備註及表尾 D-3-1；頁序為PDF頁序。',
        officialCodeRowsReviewed: 24,
        distinctConceptsUnderExplicitEquivalentCodeRule: 23,
        explicitEquivalentCodeAliases: ['N-3-13', 'S-3-1'],
        crossCodeRelationshipNotes: ['官方文字明示 N-3-13（同 S-3-1）及 S-3-1（同 N-3-13）；保留24個代碼列，該同內容概念層計一次。'],
        batchCrosswalkComparison: '本機 math-grade3-official-content-batch.json 的24列與交叉表24列逐碼比較，代碼與官方原文一致，未發現缺列或文字差異。',
        limitation: '僅完成三年級學習內容表 P25–P28；其他年級表格部分已核對但六年級整體數學領綱及全國總條目數仍未核實。',
      }],
      reason: '歷史核對紀錄：曾核讀國教院官方數學PDF的一至三年級學習內容表並逐列比對批次與交叉表。這些不是本輪重新取得或核讀的證據，且不表示其他年級表、整份數學領綱或全部官方文件已完成逐條核讀。',
      localPdfFilesFound: 0,
    },
    officialPDFReviewThisTurn: {
      status: 'partial_verified_grade_table',
      sourceId: 'mathematics',
      requestedNextPosition: '跨年級整合：保留G1–G6逐表批次，核查先備概念、活動映射與證據缺口；之後接續其他領域官方文件逐條盤點。',
      officialUrl: sourceById.get('mathematics')?.url ?? null,
      localPdfFilesFound: 0,
      retrievalAttempt: '本輪透過國教院官方來源直接讀取數學領綱PDF（83頁），核對四年級頁序28–31及五、六年級表格；PDF未下載至工作區。表格列與批次/交叉表逐碼、逐原文比較。',
      batchesReviewed: [{
        sourceId: 'mathematics',
        officialGradeTable: 4,
        documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－數學領域',
        version: 'PDF封面中華民國107年6月；教育部107年7月26日發布',
        url: sourceById.get('mathematics')?.url,
        pdfPageSequence: 'P28–P31：四年級表頭/N-4-1 至 D-4-1；P31緊接五年級表頭。跨頁核對N-4-5、N-4-10/S-4-1、S-4-6及R-4-1等續文/備註。',
        officialCodeRowsReviewed: 26,
        distinctConceptsUnderExplicitEquivalentCodeRule: 25,
        retainedEquivalentCodes: ['N-4-10', 'S-4-1'],
        crossCodeRelationshipNotes: ['N-4-10與S-4-1由官方明示同一角度內容，保留兩個代碼，概念層計一次。N-4-12與S-4-4互相關聯但非同一完整條目，仍分列。'],
        batchCrosswalkComparison: '官方PDF頁序28–31表格代碼/條文定位與math-grade4-official-content-batch.json逐列核對；批次26列，交叉表26列，原文一致。學習階段記為第二學習階段，不推定學期。',
        limitation: '本批只完成四年級學習內容表；不代表第二學習階段全部學習內容、58項學習表現完整核對或數學領綱完整。',
      }, {
        sourceId: 'mathematics',
        officialGradeTable: 5,
        documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－數學領域',
        version: 'PDF封面中華民國107年6月；教育部107年7月26日發布',
        url: sourceById.get('mathematics')?.url,
        pdfPageSequence: 'P31–P34：五年級表頭/N-5-1至D-5-1；P35緊接六年級表頭。跨頁核對N-5-4（P31–P32）、N-5-11（P32–P33）、S-5-4（P33–P34）續文及備註。',
        officialCodeRowsReviewed: 27,
        distinctConceptsUnderExplicitEquivalentCodeRule: 27,
        retainedEquivalentCodes: [],
        crossCodeRelationshipNotes: ['本批未發現官方明示同一內容的代碼別名；N-5-3等條文對其他代碼的教學關聯保留為關聯，不合併概念列。'],
        batchCrosswalkComparison: '國教院官方PDF頁序31–34逐列核對，與math-grade5-official-content-batch.json及交叉表逐碼比較：27列，未缺列且原文一致；包含N-5-4、N-5-11、S-5-4跨頁續文。學習階段為第三學習階段，不推定學期。',
        limitation: '只完成五年級學習內容表；不表示第三學習階段其他年級內容或58項表現全數核對，不代表數學領綱完整。',
      }, {
        sourceId: 'mathematics',
        officialGradeTable: 6,
        documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－數學領域',
        version: 'PDF封面中華民國107年6月；教育部107年7月26日發布',
        url: sourceById.get('mathematics')?.url,
        pdfPageSequence: 'P35–P37：六年級表頭/N-6-1至D-6-2；P38開始七年級表頭。跨頁核對N-6-9（P36）與R-6-4（P37）同內容關係及兩列備註。',
        officialCodeRowsReviewed: 19,
        distinctConceptsUnderExplicitEquivalentCodeRule: 18,
        retainedEquivalentCodes: ['N-6-9', 'R-6-4'],
        crossCodeRelationshipNotes: ['官方在N-6-9明示「同R-6-4」，故保留兩個官方代碼列，概念層只計一次；相關的R-6-2、R-6-3仍保留獨立條目。'],
        batchCrosswalkComparison: '國教院官方PDF頁序35–37逐列核對，與math-grade6-official-content-batch.json及交叉表逐碼比較：19列，未缺列且原文一致；P37的D-6-2為六年級表尾，P38轉入七年級。學習階段為第三學習階段，不推定學期。',
        limitation: '只完成六年級學習內容表；不表示第三學習階段全部學習表現或數學領綱完整。官方完整總數仍未知。',
      }],
      fullyEnumeratedFamilyCount: 0,
      nextAction: '一至六年級數學學習內容表均已有逐表批次；下一步跨年級整合各批次與學習表現、檢查先備關係及活動證據，並開始其他領域逐條核對（不代表完整數學領綱或15份文件家族已完成）。',
    },
    projectFocuses: focusRows.map((focus) => ({
      focusId: focus.focusId,
      subject: focus.subject,
      gradeRange: focus.gradeRange,
      learningStage: focus.learningStage,
      officialCodes: focus.officialCodes,
      officialSource: focus.officialSource,
      linkedActivityIds: focus.linkedActivityIds,
      evidenceStatus: focus.projectSubitemEvidenceStatus,
      coveredProjectSubitemIds: focus.coveredProjectSubitemIds,
      remainingProjectSubitems: focus.remainingProjectSubitems,
      limitations: focus.limitations,
    })),
    workQueue: [
      { priority: 1, scope: 'all applicable subjects', task: '取得官方 PDF 並建立學習內容與學習表現的分型逐條清冊；目前 15/15 文件家族有來源位置但 0/15 完成完整條目枚舉。', status: 'in_progress', nextAction: '逐份抽取/目視核對官方條文，記錄原文、階段、頁碼、條目類型及核對證據；不得以 code-index 代替。' },
      { priority: 2, scope: 'math', task: '六份年級學習內容表已登錄131列，另有58列學習表現；年級表批次逐表範圍已核對，但全數學領綱條目總量及學習表現的完整逐條清冊仍未知。', status: 'in_progress', nextAction: '整合G1–G6各表學習內容與官方對應表現，核驗跨年級概念關係、未覆蓋活動證據與重複概念；保留官方階段，不推定學期。' },
      { priority: 3, scope: 'local-language and sign-language', task: '閩南、客語、原住民族語等 code-index 不是語義核對；臺灣手語和新住民語文只有樣本條目。', status: 'pending_specialist_material', nextAction: '先逐條核對文本；涉及語言活動時需可靠語料、影音及語言專業審查。' },
      { priority: 4, scope: 'grade and subject game gaps', task: '以每份已完整核對的條目為依據，逐條審查實際活動的交互行為、回饋、遷移、入口與教師審查狀態。', status: 'pending', nextAction: '優先將已核實且無互動活動的條目排入遊戲缺口佇列。' },
      { priority: 5, scope: 'crosswalk and curriculum map consistency', task: '抽查交叉表列為 uncovered 的項目與年級目錄／焦點映射，辨識未連結、無互動證據與實際無活動的差異。', status: 'in_progress', nextAction: '依最新官方清冊與交叉表，優先核對仍待處理的條目及其活動證據；區分未連結、只有關聯、缺少互動證據與實際無活動，不預設下一個代碼。' },
    ],
    testHistory: [
      { command: 'official NAER mathematics curriculum PDF, pages P21–P25; compare grade 1 and grade 2 batches to crosswalk', status: 'partial_official_pdf_review_this_turn', result: 'Grade 1: 11 code rows / 10 concepts with official N-1-5 = S-1-1 relation preserved. Grade 2: 24 code rows; N-2-12 and S-2-5 retained as separate entries with partial-content relation. Both batches match crosswalk wording code-by-code. Does not complete the other four math grade tables or remaining official document families.' },
      { command: 'node scripts/official-learning-item-activity-crosswalk.mjs --build', status: 'passed_this_turn', result: 'crosswalk regenerated from source data: 131 registered math learning-content rows, 148 registered activity entries, 119 project focus rows; 15/15 expected official source families remain incompletely enumerated; official total and national rate remain null.' },
      { command: 'node scripts/curriculum-coverage.mjs --build', status: 'passed_this_turn_with_incomplete_inventory', result: '119 project focuses; math official registered-row statuses are partial 76, relation_only 8, uncovered 47, needs_verification 0; official total remains null and 0/15 source families fully enumerated.' },
      { command: 'node scripts/math-curriculum-audit.mjs --write', status: 'passed_this_turn', result: '78 unique catalog math tasks audited; focus evidence counts: 69 interactive partial, 3 associated-only, 0 uncovered verified focus, 1 needs verification. This is not a national curriculum denominator.' },
      { command: 'node scripts/learning-map.mjs --build', status: 'passed_this_turn', result: '6 grades, 66 grade-subject slots and 12 semester slots rebuilt and validated.' },
      { command: 'node scripts/learning-activity-map.mjs', status: 'passed_this_turn', result: 'activity mapping validated; unit prototype responses explicitly remain non-formal evidence, not mastery decisions.' },
      { command: 'node --test test/grade2-data-classification-workshop.test.mjs test/official-learning-item-activity-crosswalk.test.mjs test/six-grade-curriculum-game-progress.test.mjs test/learning-subitem-expansion.test.mjs test/curriculum-source-inventory.test.mjs', status: 'passed_this_turn', passed: 25, failed: 0 },
      { command: 'node --test', status: 'passed_this_turn', passed: 481, failed: 0 },
      { command: 'browser acceptance: scripts/grade2-data-classification-browser-acceptance.mjs', status: 'passed_this_turn', passed: 3, failed: 0, viewports: ['1366x768', '390x844', '340x740'], report: 'artifacts/grade2-data-classification-browser-acceptance/acceptance-report.json', result: '三階段皆實際經過錯答回饋、兩層提示、重試、答對完成、重玩及返回年級/科目目錄；Console 例外/錯誤、失敗請求/HTTP錯誤均為0；無水平溢位；localStorage unchanged。手機以模擬視窗點擊操作，未使用實體觸控設備。' },
      { command: 'node --test test/grade2-unknown-quantity-workshop.test.mjs test/grade2-unit-fraction-workshop.test.mjs', status: 'passed_this_turn', passed: 6, failed: 0, result: 'N-2-3未知數量模型及N-2-10連續量單位分數模型之引擎操作、錯答、提示、修正重試、完成與候選映射測試。' },
      { command: 'browser acceptance: scripts/grade2-math-workshops-browser-acceptance.mjs', status: 'passed_this_turn', passed: 6, failed: 0, viewports: ['1366x768', '390x844', '340x740'], report: 'artifacts/grade2-math-workshops-browser-acceptance/acceptance-report.json', result: '兩活動皆由二年級數學目錄進入；N-2-3四階段、N-2-10三階段均逐站完成兩層提示、錯答、修正重試、正答、完成、重玩及返回目錄。無水平溢位、Console錯誤、失敗請求或HTTP錯誤；localStorage前後不變。手機採模擬視窗，未用實體觸控設備。' },
      { command: 'node scripts/register-grade2-estimation-length-and-science-slice.mjs (run twice)', status: 'passed_this_turn_idempotent', passed: 2, failed: 0, result: '兩次登錄維持兩筆G2數學焦點、兩筆子項定義及一筆自然科學8條INa切片來源紀錄，無重複ID。' },
      { command: 'node scripts/grade2-estimation-length-browser-acceptance.mjs', status: 'passed_this_turn', passed: 6, failed: 0, viewports: ['1366x768', '390x844', '340x740'], report: 'artifacts/grade2-estimation-length-browser-acceptance/acceptance-report.json', result: '兩項活動各三種視窗皆由年級／數學目錄進入，逐階段完成錯答、錯誤解釋、重試、兩層提示、正答、完成及重玩返回；無水平溢位、Console錯誤、失敗請求或HTTP錯誤；localStorage不變。行動尺寸為視窗模擬，未在實體觸控裝置測試。' },
      { command: 'node --test test/grade2-estimation-length-workshops.test.mjs', status: 'passed_this_turn', passed: 4, failed: 0, result: '驗證目錄註冊、估算滑桿、多站尺規/讀值/差值/公尺公分計算、錯答、雙層提示、重試、完成、重玩及自然科學條目邊界。' },
      { command: 'node scripts/math-curriculum-audit.mjs --write; node scripts/curriculum-coverage.mjs --build; node scripts/official-learning-item-activity-crosswalk.mjs; node scripts/learning-map.mjs --build; node scripts/learning-activity-map.mjs', status: 'passed_this_turn', passed: 5, failed: 0, result: 'G2 N-2-4與N-2-11由uncovered轉為partial；數學登錄列131，partial 78、relation_only 8、uncovered 45、needs_verification 0。交叉表註冊活動150；自然科學INa官方切片8列（INa-II-3部分互動，其餘7列無活動）。15/15來源文件家族仍未完整枚舉。' },
      { command: 'official NAER natural-science curriculum PDF, bounded INa second-stage subsection, PDF sequence 19', status: 'passed_this_turn_bounded_slice', passed: 8, failed: 0, result: '直接核讀「伍／二、學習內容／課題1 自然界的組成與特性／物質與能量（INa）」表內INa-II-1至INa-II-8。適用第二學習階段（三、四年級），不拆分年級/學期；不是自然科學完整清冊。' },
      { command: 'official math PDF: official NAER PDF reader, grade 4–6 learning-content tables P28–P37', status: 'passed_this_turn_partial_batch', result: '本輪逐表核對G4 P28–P31（26列/25概念）、G5 P31–P34（27列/27概念）、G6 P35–P37（19列/18概念）；與官方批次和交叉表逐碼、逐原文一致。保留官方明示同內容關係：G4 N-4-10/S-4-1，G6 N-6-9/R-6-4。PDF頁序與跨頁備註均核讀；官方完整數學總數及15個文件家族完整枚舉仍未知。' },
      { command: 'official NAER natural-science PDF, bounded INb second-stage subsection, PDF sequence 20 / printed page 16 (footer locator corrected this turn)', status: 'passed_this_turn_bounded_slice_with_locator_correction', result: '直接核讀課題1構造與功能（INb）第二學習階段欄7列INb-II-1至INb-II-7。回查官方頁尾影像後將舊批次誤記的印刷頁17修正為16；同一PDF頁序20的INc亦印刷頁16。3列partial、1列relation_only、3列uncovered；不代表自然科學完整清冊。' },
      { command: 'node scripts/register-grade2-estimation-length-and-science-slice.mjs (run twice)', status: 'passed_this_turn_idempotent', passed: 2, failed: 0, result: '重複登錄N-2-5焦點/子項與INb來源引用兩次，識別碼與批次未重複新增。' },
      { command: 'browser acceptance: scripts/early-grade-and-prior-activities-browser-acceptance.mjs (ACCEPTANCE_ACTIVITY_IDS=ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE)', status: 'passed_this_turn', passed: 3, failed: 0, viewports: ['1366x768', '390x844', '340x740'], report: 'artifacts/grade2-money-market-browser-acceptance/acceptance-report.json', result: '由二年級數學目錄啟動；三個付款情境均經錯答、兩層提示、修正重試、正確完成、重玩及返回目錄；無水平溢位、Console錯誤、例外、失敗請求或HTTP錯誤；localStorage前後不變。手機為瀏覽器視窗模擬，非實體觸控測試。' },
      { command: 'node --test test/grade2-money-combination-market.test.mjs', status: 'passed_this_turn', passed: 3, failed: 0, result: '涵蓋候選目錄註冊、三個面額情境、有效與無效金額組合、即時合計、兩層提示、錯答、重試、完成及重玩。' },
      { command: 'node --test', status: 'passed_this_turn', passed: 489, failed: 0, result: '本輪完整測試套件實際執行；涵蓋新增 N-2-5 組幣市集、自然科學 INb 批次映射及既有回歸測試。' },
      { command: 'official NAER natural-science curriculum PDF download + pdftoppm page-image verification, INc-II and INd-II', status: 'passed_this_turn_bounded_sections', passed: 19, failed: 0, result: '原始官方PDF核對INc-II-1至10與INd-II-1至9；INc PDF頁序20–21/印刷頁16–17；INd PDF頁序21–22/印刷頁17–18。逐條對照欄位及跨頁續文；不是自然科學完整清冊。' },
      { command: 'node scripts/register-natural-science-stage2-inc-ind-slices.mjs (run twice)', status: 'passed_this_turn_idempotent', passed: 2, failed: 0, result: '兩次重跑均維持INc 10列、INd 9列；首次新增的14筆專案概念拆解與2個父焦點未重複建立，第二次新增數為0；未建立遊戲互動或教師審查證據。' },
      { command: 'audit ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE source and tests', status: 'passed_this_turn_audit_no_code_change', result: '檢查活動資料與專項測試：100/500/1000模擬面額卡操作、即時總額、多組預定等值組合、錯答說明、兩層提示、重試、完成及重玩皆有程式證據；N-2-5維持partial。找零、實體錢幣及學生自創所有策略仍未涵蓋。本輪未改遊戲程式。' },
      { command: 'official NAER natural science PDF direct download and rendered page inspection, INc-II and INd-II bounded subsections', status: 'passed_this_turn_bounded_subsections', passed: 19, failed: 0, result: '已核對INc-II-1至10（PDF頁序20–21、印刷頁16–17）與INd-II-1至9（PDF頁序21–22、印刷頁17–18）；逐列保存原文、類型、階段、頁序/印刷頁、保守活動證據。發布資訊為教育部107年11月2日臺教授國部字第1070119882B號令；獨立版本標籤未確認。' },
      { command: 'node scripts/math-curriculum-audit.mjs --write; node scripts/learning-map.mjs --build; node scripts/learning-activity-map.mjs; node scripts/curriculum-coverage.mjs --build; node scripts/official-learning-item-activity-crosswalk.mjs; node scripts/six-grade-curriculum-game-progress.mjs', status: 'passed_this_turn', passed: 6, failed: 0, result: '各檢查與產生器均回傳成功；數學仍131列（partial79/relation_only8/uncovered44）；自然科學四個已核讀有界小節合計34列；總進度更新後仍0/15文件家族完整枚舉。' },
      { command: 'node --test test/official-learning-item-activity-crosswalk.test.mjs test/six-grade-curriculum-game-progress.test.mjs test/grade2-money-combination-market.test.mjs test/curriculum-source-inventory.test.mjs test/grade2-estimation-length-workshops.test.mjs', status: 'passed_this_turn', passed: 24, failed: 0, result: '覆蓋官方切片頁碼/代碼/狀態、進度統計、N-2-5交易互動與舊INa/INb定位。' },
      { command: 'node --test test/learning-subitem-expansion.test.mjs', status: 'passed_this_turn', passed: 7, failed: 0, result: '驗證已連結的互動子項與14筆 inventory-only 概念拆解分開統計，不將專案拆解當作官方條目或已遊戲化證據。' },
      { command: 'node --test', status: 'passed_this_turn', passed: 490, failed: 0, result: '完整測試套件通過；包含官方交叉表新欄位、頁碼修正、N-2-5既有遊戲及子項清冊計數分層。' },
      { command: 'official NAER natural-science curriculum PDF, rendered visual inspection of INe second-stage table and continuation', status: 'passed_this_turn_bounded_subsection', passed: 11, failed: 0, result: '逐列核對INe-Ⅱ-1至INe-Ⅱ-11完整官方原文；PDF頁序23–24、印刷頁19–20。INe-Ⅱ-11跨頁續文在頁序24頁首核完；7列relation_only、4列uncovered。仍只代表INe第二學習階段小節，不代表文件完整枚舉。' },
      { command: 'official NAER social-studies curriculum PDF, rendered visual inspection of section B.a individual difference, second-stage row Ba-Ⅱ-1', status: 'passed_this_turn_bounded_subsection', passed: 1, failed: 0, result: '核對官方原文「人們對社會事物的認識、感受與意見有相同之處，亦有差異性。」PDF頁序100／印刷頁96；只保留第二學習階段，不拆指定年級。既有ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS候選互動只支持虛構觀點配對的共同／差異分類，判partial。' },
      { command: 'node scripts/register-natural-science-ine-and-social-ba2-slices.mjs (run twice)', status: 'passed_this_turn_idempotent', passed: 2, failed: 0, result: '連續兩次登錄均維持INe 11列、Ba-Ⅱ-1 1列；現有自然科學概念拆解18筆與社會子項1筆重跑不重複，腳本回報repeatSafe=true。' },
      { command: 'node scripts/official-learning-item-activity-crosswalk.mjs; node scripts/curriculum-coverage.mjs; node scripts/learning-map.mjs; node scripts/learning-activity-map.mjs; node scripts/six-grade-curriculum-game-progress.mjs', status: 'passed_this_turn', passed: 5, failed: 0, result: '交叉表、清冊、學習地圖、活動映射與進度帳皆成功重建；數學仍131登錄列，非數學有界官方內容列46（自然45、社會1）；15/15文件家族仍0份完整枚舉。' },
      { command: 'node --test test/natural-science-ine-social-ba2-slices.test.mjs test/official-learning-item-activity-crosswalk.test.mjs test/six-grade-curriculum-game-progress.test.mjs test/cross-grade-coverage-and-gap-fill.test.mjs', status: 'passed_this_turn', passed: 13, failed: 0, result: '通過本輪INe原文、跨頁定位、階段、INe/Social活動證據、狀態及清冊統計專項驗證。' },
      { command: 'node --test', status: 'passed_this_turn', passed: 492, failed: 0, result: '全套Node測試實際執行；首次發現4個既有清冊測試仍固定斷言舊的127焦點、118子項與14筆自然概念拆解。依目前來源產生的有效數值更新斷言後重跑，492通過、0失敗。' },
      { command: 'browser acceptance: node scripts/cross-grade-gapfill-browser-acceptance.mjs (ACCEPTANCE_ACTIVITY_IDS=ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS-CANDIDATE)', status: 'passed_this_turn', passed: 3, failed: 0, viewports: ['1366x768', '390x844', '340x740'], report: 'artifacts/social-ba2-browser-acceptance-20261025/acceptance-report.json', result: '實際從活動入口經錯答、提示、重試、正答、完成、重玩與返回；三種模擬視窗無Console錯誤/警告/未處理例外/失敗請求/錯誤HTTP回應，localStorage前後不變。屬瀏覽器視窗模擬，非實體手機觸控驗收。' },
    ],
    unresolvedIssues: [
      '官方數學PDF本輪以官方文件閱讀器核讀G4–G6表格；PDF未下載成本機副本。數學各年級表批次共131列已逐表記錄，但官方領綱完整學習內容總量、58列學習表現的完整逐條清冊及跨類型關聯仍未全部核定。',
      'Git metadata is unavailable in this workspace; pre-existing edits cannot be enumerated with Git status, so files were inspected before writing and no cleanup/revert was performed.',
      '其他領域 official learning content full inventories and stage-to-grade mapping remain incomplete; no full-curriculum denominator or coverage rate can be calculated.',
    ],
  };
}

export function validateSixGradeProgress(progress) {
  const errors = [];
  const ids = progress.sources.documentFamilies.flatMap((family) => family.documents.map((document) => `${family.familyId}::${document.sourceId}`));
  if (new Set(ids).size !== ids.length) errors.push('duplicate_source_document_record_within_family');
  if (progress.totals.officialElementaryLearningItemTotal !== null || progress.totals.nationalCoverageRate !== null) errors.push('national_denominator_must_remain_unknown');
  if (progress.totals.fullyEnumeratedOfficialDocumentFamilyCount !== 0) errors.push('no_family_is_fully_enumerated_in_source_inventory');
  if (progress.gradeSubjectProgress.length !== 66) errors.push(`expected_66_grade_subject_slots:${progress.gradeSubjectProgress.length}`);
  if (progress.mathOfficialLearningContentItems.length !== progress.totals.registeredMathLearningContentRows) errors.push('math_row_total_mismatch');
  const activityIds = new Set(progress.gradeSubjectProgress.flatMap((slot) => slot.activities.map((activity) => activity.activityId)));
  if (activityIds.size !== progress.totals.registeredActivityCount) errors.push('activity_entries_not_unique_across_grade_subjects');
  if (progress.totals.registeredActivityCount !== activityIds.size) errors.push('registered_activity_total_mismatch');
  if (progress.projectFocuses.length !== progress.totals.registeredProjectFocusCount) errors.push('project_focus_total_mismatch');
  return errors;
}

export function writeSixGradeProgress() {
  const progress = buildSixGradeProgress();
  const errors = validateSixGradeProgress(progress);
  progress.validation = { status: errors.length ? 'failed' : 'passed', errors };
  fs.writeFileSync(outputPath, `${JSON.stringify(progress, null, 2)}\n`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Six-grade progress generated: ${progress.totals.registeredActivityCount} activities; ${progress.gradeSubjectProgress.length} grade-subject slots; ${progress.totals.fullyEnumeratedOfficialDocumentFamilyCount}/${progress.totals.officialElementaryDocumentFamilyCount} official families fully enumerated.`);
  console.log(outputPath);
  return progress;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) writeSixGradeProgress();
