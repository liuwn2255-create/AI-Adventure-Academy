import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE6_GCD_LCM_SHORT_DIVISION } from '../prototype/data/grade6CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const batch = read('curriculum/math-grade6-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const sources = read('curriculum/sources.json');
const curriculumMap = read('curriculum/curriculum-map.json');
const definitions = read('curriculum/learning-subitem-definitions.json');
const mathSource = sources.sources.find(({ id }) => id === 'mathematics');
if (!mathSource) throw new Error('mathematics_source_missing');
batch.sourceUrl = mathSource.url;

const expectedCodes = [
  ...Array.from({ length: 9 }, (_, index) => `N-6-${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `S-6-${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `R-6-${index + 1}`), 'D-6-1', 'D-6-2',
];
const codes = batch.clauses.map(({ code }) => code);
if (batch.schemaVersion !== 1 || batch.applicability.officialGradeTable !== 6 || batch.clauses.length !== 19
  || new Set(codes).size !== codes.length || expectedCodes.some((code) => !codes.includes(code)) || codes.some((code) => !expectedCodes.includes(code))) {
  throw new Error('grade6_batch_must_contain_19_unique_official_code_rows');
}
if (!batch.sourceLocation.includes('PDF頁序35–37') || !batch.sourceLocation.includes('頁序38開始「7年級」')) throw new Error('grade6_table_boundary_evidence_missing');
for (const row of batch.clauses) {
  if (!row.officialText || row.officialNotes === undefined || !row.sourceLocation?.includes('PDF頁序')
    || !row.officialPerformanceLinks?.length || row.relationshipKind !== 'explicit_same_table_corresponding_performance') {
    throw new Error(`incomplete_official_clause:${row.code}`);
  }
  for (const performanceCode of row.officialPerformanceLinks) {
    if (!audit.learningPerformanceClauses.some(({ code }) => code === performanceCode)) throw new Error(`unresolved_performance_link:${row.code}:${performanceCode}`);
  }
  const prior = audit.clauses.find(({ code, clauseType }) => code === row.code && clauseType === 'learning_content');
  if (prior && prior.officialText !== row.officialText) throw new Error(`official_text_conflict:${row.code}`);
}
const relationships = batch.conceptRelationships ?? [];
const duplicateConceptPairs = relationships.filter(({ kind }) => kind === 'same_official_learning_content_explicitly_cross_referenced');
if (duplicateConceptPairs.length !== 1 || JSON.stringify(duplicateConceptPairs[0].codes) !== JSON.stringify(['N-6-9', 'R-6-4'])) {
  throw new Error('grade6_explicit_duplicate_concept_relationship_missing');
}

// The official table was compared against the actual registered catalog activities, not subject-map labels.
const taskById = new Map(CATALOG_CANDIDATE_TASKS.map((task) => [task.activityId, task]));
const activityAudit = [
  { code: 'N-6-1', status: 'partial', activityIds: ['ACT-G6-MATH-PRIME-FACTOR-EXPLORER-CANDIDATE'], evidenceStageIds: ['classify-small-numbers', 'assemble-eighteen-prime-factors'], reason: '有小於20數字分類與18質因數乘積組合；未操作短除法完整程序，亦未包含官方備註所列判別範圍。' },
  { code: 'N-6-2', status: 'partial', activityIds: [GRADE6_GCD_LCM_SHORT_DIVISION.activityId], evidenceStageIds: GRADE6_GCD_LCM_SHORT_DIVISION.stages.map(({ stageId }) => stageId), reason: '新增逐步短除商數選取、GCD/LCM與分數約分互動，並以另一組數字做情境遷移；未評量自行排寫短除法、完整通分或三數情況。' },
  { code: 'N-6-3', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '在六年級數學活動中未找到整數除分數及分數除分數意義的操作任務。' },
  { code: 'N-6-4', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到小數除法位值直式及「商不一定小於被除數」的互動任務。' },
  { code: 'N-6-5', status: 'partial', activityIds: ['ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE'], evidenceStageIds: ['calculate-expedition-supplies', 'order-reasoning-steps'], reason: '以整數情境計算與排序中間步驟；未涵蓋分數／小數混合乘除、概數及多種應用情境。' },
  { code: 'N-6-6', status: 'relation_only', activityIds: ['ACT-G6-MATH-BASE-COMPARISON-RATIO-CANDIDATE'], evidenceStageIds: [], reason: '比值活動與比／比例概念相關，但其操作只處理交換基準，沒有異類量與同類量比值及相等比倍數關係的證據。' },
  { code: 'N-6-7', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到速度、距離＝速度×時間、平均速度區段或大單位到小單位換算的數學互動。' },
  { code: 'N-6-8', status: 'partial', activityIds: ['ACT-G6-MATH-BASE-COMPARISON-RATIO-CANDIDATE'], evidenceStageIds: ['younger-relative-to-older', 'older-relative-to-younger'], reason: '以150與120的基準交換完成兩次比值運算；未涵蓋其他生活情境或完整比值應用。' },
  { code: 'N-6-9', status: 'relation_only', activityIds: ['ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE'], evidenceStageIds: [], reason: '多步驟任務有問題分解關聯，但未提供排列計數、加法／乘法原理或官方列舉的複雜情境操作。' },
  { code: 'S-6-1', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到六年級數學任務操作幾倍放大／縮小、對應角與對應邊比例。' },
  { code: 'S-6-2', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到地圖比例尺、地圖與實際距離或不同比例尺地圖比較任務。' },
  { code: 'S-6-3', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到以圓分割模型理解圓面積或依圓心角求扇形弧長／面積的六年級數學活動。' },
  { code: 'S-6-4', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到角柱／圓柱體積、表面積或兩個形體組合的互動；相關內容仍需模型及實體操作。' },
  { code: 'R-6-1', status: 'relation_only', activityIds: ['ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE'], evidenceStageIds: [], reason: '整數多步驟計算只有廣義計算關聯，未呈現整數、小數、分數共通運算規律及乘除互逆的互動證據。' },
  { code: 'R-6-2', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到由具體數量情境或模式出發，觀察、推理並說明規律的六年級數學活動。' },
  { code: 'R-6-3', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到將六年級情境數量關係以文字或符號表示成關係式的互動。' },
  { code: 'R-6-4', status: 'relation_only', activityIds: ['ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE'], evidenceStageIds: [], reason: '與N-6-9為官方同內容，但現有多步驟整數任務沒有模式、計數原理或複雜情境解題證據。' },
  { code: 'D-6-1', status: 'uncovered', activityIds: [], evidenceStageIds: [], reason: '未找到報讀、說明、製作百分率圓形圖及辨別統計圖使用時機的六年級數學互動。' },
  { code: 'D-6-2', status: 'partial', activityIds: ['ACT-G6-MATH-DATA-LIKELIHOOD-READER-CANDIDATE'], evidenceStageIds: ['classify-sample-count-evidence', 'compare-new-likelihood-record'], reason: '依標為虛構的統計次數資料比較可能程度；不是古典機率、實際隨機試驗或未來結果保證。' },
];
batch.activityAudit = activityAudit;
for (const row of activityAudit) {
  if (!codes.includes(row.code)) throw new Error(`activity_audit_unknown_code:${row.code}`);
  for (const activityId of row.activityIds) {
    if (!taskById.has(activityId)) throw new Error(`activity_id_not_registered_by_audit_script:${row.code}:${activityId}`);
  }
}

const clauseByCode = new Map(audit.clauses.map((row) => [row.code, row]));
for (const row of batch.clauses) {
  const prior = clauseByCode.get(row.code);
  clauseByCode.set(row.code, {
    ...(prior ?? {}), code: row.code, clauseType: 'learning_content', officialText: row.officialText,
    officialNotes: row.officialNotes, referenceTools: row.referenceTools ?? null,
    officialPerformanceLinks: row.officialPerformanceLinks, relationshipKind: row.relationshipKind,
    equivalentOfficialCode: row.equivalentOfficialCode ?? prior?.equivalentOfficialCode ?? null,
    relatedOfficialCodes: row.relatedOfficialCodes ?? prior?.relatedOfficialCodes ?? [],
    sourceLocation: row.sourceLocation, applicability: { ...batch.applicability },
    projectInterpretation: prior?.projectInterpretation ?? null,
    reviewStatus: 'verified_against_official_pdf_this_run', auditBatchId: batch.batchId,
  });
}
audit.clauses = [...clauseByCode.values()];
audit.officialContentClauseCount = audit.clauses.filter(({ clauseType }) => clauseType === 'learning_content').length;
audit.contentInventoryBatches ??= [];
audit.contentInventoryBatches = audit.contentInventoryBatches.filter(({ batchId }) => batchId !== batch.batchId);
audit.contentInventoryBatches.push({
  batchId: batch.batchId, status: batch.status, sourceId: batch.sourceId, documentTitle: batch.documentTitle,
  sourceUrl: batch.sourceUrl, publicationInfo: batch.publicationInfo, sourceLocation: batch.sourceLocation,
  applicability: batch.applicability, reviewMethod: batch.reviewMethod, verifiedCodeCount: codes.length,
  codes, uniqueConceptCount: 18, conceptRelationships: relationships, activityAuditCounts: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, activityAudit.filter((row) => row.status === status).length])),
  nextWorkPosition: batch.nextWorkPosition,
});
audit.auditStatus = 'verified_grade1_to_grade6_contiguous_content_table_batches_full_math_inventory_incomplete';
const note = '另逐列核對六年級學習內容表 PDF頁序35–37，共19個官方代碼列、18個不同概念（N-6-9/R-6-4由官方明示同內容）；逐表追至頁序38七年級表頭確認終點。六個年級學習內容表批次均已登錄，但數學領綱完整清冊仍未完成。';
if (!audit.reviewMethod.includes(note)) audit.reviewMethod = `${audit.reviewMethod} ${note}`;

const verifiedCodes = new Set(mathSource.verifiedClauses ?? []);
for (const code of codes) verifiedCodes.add(code);
mathSource.verifiedClauses = [...verifiedCodes];
mathSource.reviewStatus = 'partial_math_learning_content_inventory_grade1_to_grade6_tables_verified_full_inventory_incomplete';
const sourceNote = '六年級學習內容表PDF頁序35–37逐列核對19個代碼列、18個概念；六個年級表格批次已核對。數學領綱完整盤點（學習表現／跨年級整合等）仍未完成。';
if (!mathSource.pageOrSection.includes(sourceNote)) mathSource.pageOrSection = `${mathSource.pageOrSection} ${sourceNote}`;

const focusId = 'math-grade6-gcd-lcm-short-division-candidate';
const official = batch.clauses.find(({ code }) => code === 'N-6-2');
const focus = {
  id: focusId, subject: 'mathematics',
  focus: '六年級表格內容 N-6-2：用質因數分解或短除法理解兩數最大公因數與最小公倍數，並運用於分數約分／通分。本候選逐步選商練習一組GCD/LCM、一個最簡分數及一組新數字情境。',
  gradeRange: [6, 6], stagePerformanceRange: [5, 6], sourceId: 'mathematics', status: 'pending_review',
  officialTextReviewStatus: 'verified_against_official_pdf_this_run', gradeApplicabilityStatus: 'official_grade_table_6_and_stage_3; semester_and_local_schedule_pending',
  performanceCodes: official.officialPerformanceLinks,
  performanceTexts: official.officialPerformanceLinks.map((code) => audit.learningPerformanceClauses.find((clause) => clause.code === code)?.officialText).filter(Boolean),
  contentCodes: ['N-6-2'], contentTexts: [official.officialText], sourceUrl: batch.sourceUrl, documentTitle: batch.documentTitle,
  pageOrSection: '六年級學習內容表 N-6-2，PDF頁序35；同表對應 n-III-3，學習表現表 PDF頁序12（印刷頁10）。第三學習階段含五、六年級，不表示單一學期順序。',
  reviewer: '官方 PDF 條文核對（非教師課程審查）', reviewDate: '2026-10-24', verifiedClauses: ['N-6-2', 'n-III-3'],
  notes: '候選畫面逐步選取短除結果，未要求學生自行寫出完整短除法；需教師確認先備與是否搭配紙筆／實物分數材料。',
  candidateActivityId: GRADE6_GCD_LCM_SHORT_DIVISION.activityId, coverageStatus: 'partial',
  coverageLimitations: ['只處理兩組正整數與一個分數約分案例，未含三數、完整通分或互質多樣情境。', '工程互動不構成教師審查或學習成效證據。'],
};
const focusRows = [...curriculumMap.verifiedLearningFocuses, ...(curriculumMap.supplementalVerifiedLearningFocuses ?? []), ...curriculumMap.pendingLearningFocuses];
const existingFocus = focusRows.find(({ id }) => id === focusId);
if (existingFocus && existingFocus.candidateActivityId !== focus.candidateActivityId) throw new Error(`focus_id_conflict:${focusId}`);
if (existingFocus) Object.assign(existingFocus, focus);
else curriculumMap.pendingLearningFocuses.push(focus);

const subitem = {
  subitemId: 'SUB-MATH-G6-N6-2-SHORT-DIVISION-AND-FRACTION-SIMPLIFICATION', focusId, subject: 'mathematics', officialCode: 'N-6-2',
  sourceText: official.officialText,
  sourceTextKind: 'official_pdf_clause_checked_2026-10-24; project subitem is analysis',
  sourceRef: { sourceId: 'mathematics', pageOrSection: '六年級學習內容表 N-6-2，PDF頁序35；同表對應 n-III-3。' },
  projectSubitem: '在螢幕步驟中逐列選取兩數共同除以質因數後的商，從共同除數與最後兩商組成GCD/LCM；再以共同因數化簡分數，並把方法轉移到12與30的週期情境。此為專案分析，不是額外官方條文。',
  decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24', activityIds: [GRADE6_GCD_LCM_SHORT_DIVISION.activityId],
  evidenceStageIds: GRADE6_GCD_LCM_SHORT_DIVISION.stages.map(({ stageId }) => stageId), status: 'candidate_partial_interaction',
};
const auditedSubitems = [
  subitem,
  {
    subitemId: 'SUB-MATH-G6-N6-1-PRIME-CLASSIFICATION-AND-FACTORS', focusId: 'math-grade6-prime-factor-candidate', subject: 'mathematics', officialCode: 'N-6-1',
    sourceText: batch.clauses.find(({ code }) => code === 'N-6-1').officialText,
    sourceTextKind: 'official_pdf_clause_checked_2026-10-24; project subitem is analysis',
    sourceRef: { sourceId: 'mathematics', pageOrSection: '六年級學習內容表 N-6-1，PDF頁序35；同表對應 n-III-3。第三學習階段含五、六年級。' },
    projectSubitem: '依正因數個數分類部分小於20的質數與合數，並將18組成質數乘積。未操作完整短除法或官方備註列出的完整判別範圍。此為專案分析，不是額外官方條文。',
    decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24', activityIds: ['ACT-G6-MATH-PRIME-FACTOR-EXPLORER-CANDIDATE'],
    evidenceStageIds: ['classify-small-numbers', 'assemble-eighteen-prime-factors'], status: 'candidate_partial_interaction',
  },
  {
    subitemId: 'SUB-MATH-G6-N6-5-INTEGER-MULTI-STEP-AND-SEQUENCING', focusId: 'math-grade6-multistep-applications-candidate', subject: 'mathematics', officialCode: 'N-6-5',
    sourceText: batch.clauses.find(({ code }) => code === 'N-6-5').officialText,
    sourceTextKind: 'official_pdf_clause_checked_2026-10-24; project subitem is analysis',
    sourceRef: { sourceId: 'mathematics', pageOrSection: '六年級學習內容表 N-6-5，PDF頁序35；同表對應 n-III-2、r-III-2。第三學習階段含五、六年級。' },
    projectSubitem: '以一個整數補給情境逐步計算兩批數量、合併、扣除使用量，並排列依賴中間結果的步驟。未涵蓋官方要求的分數、小數、概數及多種情境。此為專案分析，不是額外官方條文。',
    decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24', activityIds: ['ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE'],
    evidenceStageIds: ['calculate-expedition-supplies', 'order-reasoning-steps'], status: 'candidate_partial_interaction',
  },
];
for (const item of auditedSubitems) {
  const priorSubitem = definitions.definitions.find(({ subitemId }) => subitemId === item.subitemId);
  if (priorSubitem) Object.assign(priorSubitem, item);
  else definitions.definitions.push(item);
}

batch.nextWorkPosition = '六年級學習內容表 PDF頁序35–37已逐列核對；一至六年級內容表批次均在。下一步為跨年級數學內容與學習表現整合、重複概念／活動證據稽核及尚未逐條盤點的其他領綱範圍；勿宣稱完整數學領綱或全國課綱已完成。';
write('curriculum/math-grade6-official-content-batch.json', batch);
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', sources);
write('curriculum/curriculum-map.json', curriculumMap);
write('curriculum/learning-subitem-definitions.json', definitions);
console.log(JSON.stringify({ batchId: batch.batchId, registeredRows: codes.length, uniqueConcepts: 18, activityAuditCounts: Object.fromEntries(['partial', 'relation_only', 'uncovered', 'needs_verification'].map((status) => [status, activityAudit.filter((row) => row.status === status).length])), registeredMathLearningContentRows: audit.officialContentClauseCount, nextWorkPosition: batch.nextWorkPosition }, null, 2));
