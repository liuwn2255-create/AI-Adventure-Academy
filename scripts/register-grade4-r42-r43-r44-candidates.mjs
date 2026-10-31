import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const mapPath = 'curriculum/curriculum-map.json';
const subitemPath = 'curriculum/learning-subitem-definitions.json';
const batchPath = 'curriculum/math-grade4-official-content-batch.json';
const map = read(mapPath);
const subitems = read(subitemPath);
const batch = read(batchPath);
const sourceUrl = batch.sourceUrl;
const records = [
  {
    id: 'math-grade4-computation-properties',
    code: 'R-4-2',
    performanceCode: 'r-II-4',
    performanceText: '認識兩步驟計算中加減與部分乘除計算的規則並能應用。',
    activityId: 'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE',
    subitemId: 'SUB-MATH-G4-R4-2-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE',
    projectSubitem: '以情境算式片段組式，重排三數乘法因數與乘除次序，並逐步計算；另練一種加減等值重排。這是專案分析，不是官方條文。未涵蓋所有運算性質或自由書寫證據。',
    stageIds: ['translate-supply-story-to-product','reorder-factors-for-easy-product','calculate-regrouped-product','translate-multiply-then-divide-story','reorder-multiply-divide-equivalently','calculate-equivalent-multiply-divide','reorder-add-subtract-mixed-expression','calculate-reordered-add-subtract'],
    limitation: '限本活動中的乘法因數換序、先乘後除／先除後乘及一種加減重排。官方備註明示不做 a−(b−c) 去括號；活動不涵蓋其他四則規律與自由列式。',
    reason: '學生先依補給故事組式，再操作重排因數或乘除次序並逐步計算；能留下情境翻譯、等值改寫及中間值的實際互動證據，但僅為局部範圍。',
    officialText: '四則計算規律（I）：兩步驟計算規則。加減混合計算、乘除混合計算。在四則混合計算中運用數的運算性質。',
    officialNotes: '加減部分，不做 a−(b−c) 之去括號。乘除只做「三數相乘，順序改變不影響其積」、「先乘後除與先除後乘的結果相同」。必須呈現將應用問題轉化成算式後，再利用計算規律調整算式進行計算解題的範例，其中調整後的算式已無法以原情境解釋。',
    page: '四年級學習內容表 R-4-2，PDF頁序31；同表 r-II-4，第二學習階段表現表 PDF頁序11。'
  },
  {
    id: 'math-grade4-text-formula-application',
    code: 'R-4-3',
    performanceCode: 'r-II-5',
    performanceText: '理解以文字表示之數學公式。',
    activityId: 'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE',
    subitemId: 'SUB-MATH-G4-R4-3-TEXT-AND-SYMBOL-FORMULA-CANDIDATE',
    projectSubitem: '以文字片段與運算符號組成長方形面積＝長×寬、正方形周長＝邊長×4，再代入不同邊長計算。這是專案分析，不是官方條文。',
    stageIds: ['assemble-rectangle-area-formula','apply-rectangle-area-formula','assemble-square-perimeter-formula','apply-square-perimeter-formula'],
    limitation: '僅練官方列舉的兩個公式示例及數值代入；未涵蓋其他公式、自由書寫／口頭表述或實物量測。S-4-3 只作關聯示例，不宣稱完整涵蓋。',
    reason: '任務要求學生實際組合含文字與符號的公式，並把新情境數值代入計算；只有組合一條公式或只有相關活動名稱不算本列證據。',
    officialText: '以文字表示數學公式：理解以文字和運算符號聯合表示的數學公式，並能應用公式。可併入其他教學活動（如 S-4-3）。',
    officialNotes: '如 S-4-3 的「長方形面積＝長×寬」、「正方形周長＝邊長×4」等。',
    page: '四年級學習內容表 R-4-3，PDF頁序31；同表 r-II-5，第二學習階段表現表 PDF頁序11。S-4-3 為官方列舉的關聯示例。'
  },
  {
    id: 'math-grade4-two-dimensional-number-patterns',
    code: 'R-4-4',
    performanceCode: 'r-II-2',
    performanceText: '認識一維及二維之數量模式，並能說明與簡單推理。',
    activityId: 'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE',
    subitemId: 'SUB-MATH-G4-R4-4-TWO-DIMENSIONAL-PATTERN-REASONING-CANDIDATE',
    projectSubitem: '操作兩張具行列變化的小型數字圖補空格，再以三個奇偶數加、減、乘例子分類並選擇理由。此為專案分析，不是官方條文。',
    stageIds: ['fill-row-and-column-number-pattern','transfer-calendar-like-grid-pattern','observe-odd-even-operation-patterns','choose-evidence-based-parity-reason'],
    limitation: '只涵蓋兩種小型二維數字圖及奇偶數加、減、乘各一例；未覆蓋百數表／月曆的多種模式、全部奇偶運算模式及自由說明。依官方備註不使用公式。',
    reason: '學生在可見格子中按順序填入數值，須同時觀察行與列變化，並用算例選擇推理說明；不是線性數列猜答案。',
    officialText: '數量模式與推理（II）：以操作活動為主。二維變化模式之觀察與推理，如二維數字圖之推理。奇數與偶數，及其加、減、乘模式。',
    officialNotes: '含學生之簡單推理與說明。如百數表模式、月曆模式之數字模式等。不可出現公式，此非本條目之學習目標。',
    page: '四年級學習內容表 R-4-4，PDF頁序31；同表 r-II-2，第二學習階段表現表 PDF頁序11。'
  }
];

const allFocuses = [...map.verifiedLearningFocuses, ...(map.supplementalVerifiedLearningFocuses ?? []), ...map.pendingLearningFocuses];
const allActivities = [
  ['ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE', records[0].id],
  ['ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE', records[1].id],
  ['ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE', records[2].id],
];
for (const [activityId, focusId] of allActivities) {
  const matches = allFocuses.filter(({ candidateActivityId }) => candidateActivityId === activityId);
  if (matches.length > 1) throw new Error(`Duplicate curriculum focus registration for ${activityId}`);
  if (matches.length === 1 && matches[0].id !== focusId) throw new Error(`Activity ${activityId} is registered to unexpected focus ${matches[0].id}`);
}

for (const record of records) {
  const clause = batch.clauses.find(({ code }) => code === record.code);
  if (!clause || clause.officialText !== record.officialText || clause.officialNotes !== record.officialNotes || clause.officialPerformanceLinks?.[0] !== record.performanceCode) {
    throw new Error(`Official clause mismatch for ${record.code}; refusing to register guessed content.`);
  }
  if (!allFocuses.some(({ id }) => id === record.id)) {
    map.pendingLearningFocuses.push({
      id: record.id, subject: 'mathematics',
      focus: `四年級學習內容 ${record.code}：${record.officialText} 本候選活動僅對應已明確描述的部分互動。`,
      gradeRange: [4,4], stagePerformanceRange: [3,4], sourceId: 'mathematics',
      status: 'pending_review', officialTextReviewStatus: 'verified_against_official_pdf_existing_grade4_batch_2026-10-24',
      gradeApplicabilityStatus: 'official_grade_table_4_and_stage_2; semester_and_local_schedule_pending',
      performanceCodes: [record.performanceCode], performanceTexts: [record.performanceText],
      contentCodes: [record.code], contentTexts: [record.officialText],
      sourceUrl, documentTitle: batch.documentTitle,
      pageOrSection: `${record.page} 官方表格只連結第二學習階段（第三、四年級），未指定學期或教材順序。`,
      reviewer: '既有官方 PDF 批次原文核對（非教師課程審查）', reviewDate: '2026-10-24',
      verifiedClauses: [record.code, record.performanceCode],
      candidateActivityId: record.activityId, coverageStatus: 'partial',
      coverageLimitations: [record.limitation], localScheduleStatus: 'pending_school_and_textbook_evidence',
      teacherProfessionalReviewStatus: 'pending_review',
    });
  } else {
    const focus = allFocuses.find(({ id }) => id === record.id);
    focus.officialTextReviewStatus = 'verified_against_official_pdf_existing_grade4_batch_2026-10-24';
  }
  if (!subitems.definitions.some(({ subitemId }) => subitemId === record.subitemId)) {
    subitems.definitions.push({
      subitemId: record.subitemId, focusId: record.id, subject: 'mathematics', officialCode: record.code,
      officialPerformanceCode: record.performanceCode, sourceText: record.officialText,
      sourceTextKind: 'verbatim_official_pdf_clause_from_verified_grade4_batch_2026-10-24; project_subitem_is_analysis',
      sourceRef: { sourceId: 'mathematics', pageOrSection: record.page },
      projectSubitem: record.projectSubitem,
      decompositionKind: 'project_decomposition_from_verified_official_grade4_clause',
      activityIds: [record.activityId], evidenceStageIds: record.stageIds, notCovered: [record.limitation],
      status: 'candidate_partial_interaction',
    });
  }
  const auditRow = batch.activityAudit.find(({ code }) => code === record.code);
  if (!auditRow) throw new Error(`Missing existing activity audit row for ${record.code}`);
  auditRow.status = 'partial';
  auditRow.activityIds = [record.activityId];
  auditRow.evidenceStageIds = record.stageIds;
  auditRow.reason = record.reason;
}
write(mapPath, map);
write(subitemPath, subitems);
write(batchPath, batch);
console.log(JSON.stringify({ registeredFocusIds: records.map(({ id }) => id), subitemIds: records.map(({ subitemId }) => subitemId), updatedAuditCodes: records.map(({ code }) => code), rerunnable: true }, null, 2));
