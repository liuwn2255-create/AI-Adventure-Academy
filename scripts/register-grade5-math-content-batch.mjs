import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE5_INTEGER_DIVISION_FRACTION_MODEL } from '../prototype/data/grade5CandidateTasks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const batch = read('curriculum/math-grade5-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const sources = read('curriculum/sources.json');
const map = read('curriculum/curriculum-map.json');
const definitions = read('curriculum/learning-subitem-definitions.json');
const mathSource = sources.sources.find(({ id }) => id === 'mathematics');
if (!mathSource) throw new Error('mathematics_source_missing');
batch.sourceUrl = mathSource.url;

const codes = batch.clauses.map(({ code }) => code);
if (batch.schemaVersion !== 1 || batch.applicability.officialGradeTable !== 5 || codes.length !== 27 || new Set(codes).size !== codes.length) {
  throw new Error('grade5_batch_must_contain_27_unique_official_code_rows');
}
const requiredCodes = [
  ...Array.from({ length: 16 }, (_, index) => `N-5-${index + 1}`),
  ...Array.from({ length: 7 }, (_, index) => `S-5-${index + 1}`),
  'R-5-1', 'R-5-2', 'R-5-3', 'D-5-1',
];
if (requiredCodes.some((code) => !codes.includes(code)) || codes.some((code) => !requiredCodes.includes(code))) throw new Error('grade5_batch_code_sequence_incomplete');
for (const row of batch.clauses) {
  if (!row.officialText || row.officialNotes === undefined || !row.sourceLocation?.includes('PDF頁序')
    || !row.officialPerformanceLinks?.length || row.relationshipKind !== 'explicit_same_table_corresponding_performance') {
    throw new Error(`incomplete_official_clause:${row.code}`);
  }
  for (const performanceCode of row.officialPerformanceLinks) {
    if (!audit.learningPerformanceClauses.some(({ code }) => code === performanceCode)) throw new Error(`unresolved_performance_link:${row.code}:${performanceCode}`);
  }
  const prior = audit.clauses.find(({ code }) => code === row.code);
  if (prior && prior.officialText !== row.officialText) throw new Error(`official_text_conflict:${row.code}`);
}

const mapped = [
  { code: 'N-5-2', activityIds: ['ACT-G5-MATH-MULTI-STEP-SUPPLY-PLANNER-CANDIDATE'], evidenceStageIds: [], status: 'relation_only', reason: '活動有逐步數量計算，但原活動範圍只宣稱兩步驟，沒有學生建立三步驟併式及分配律情境的互動；因此僅記活動關聯。' },
  { code: 'N-5-3', activityIds: ['ACT-G5-MATH-FACTOR-ARRAY-EXPLORER-CANDIDATE'], evidenceStageIds: ['build-twelve-array', 'sort-twelve-factors'], status: 'partial', reason: '操作12的陣列並分類因數；未涵蓋倍數、公因數、公倍數、最大公因數與最小公倍數。' },
  { code: 'N-5-4', activityIds: ['ACT-G5-MATH-FRACTION-EQUIVALENCE-PIECES-CANDIDATE'], evidenceStageIds: ['compose-half-with-fourths', 'compare-third-and-half'], status: 'partial', reason: '拼片呈現簡單等值與共同單位比較；未涵蓋異分母加減及完整約分／擴分程序。' },
  { code: 'N-5-6', activityIds: [GRADE5_INTEGER_DIVISION_FRACTION_MODEL.activityId], evidenceStageIds: GRADE5_INTEGER_DIVISION_FRACTION_MODEL.stages.map(({ stageId }) => stageId), status: 'partial', reason: '兩個螢幕拼片階段分別呈現平分與測量觀點的3÷4=3/4；未涵蓋實體分裝、真實量測與其他除法情境。' },
  { code: 'S-5-4', activityIds: ['ACT-G5-MATH-LINE-SYMMETRY-MIRROR-GRID-CANDIDATE'], evidenceStageIds: ['mirror-three-marker-cells', 'mirror-new-pattern'], status: 'partial', reason: '方格補點操作建立垂直鏡射圖；未涵蓋對稱邊角性質、多種特殊圖形辨識及實體折紙。' },
  { code: 'D-5-1', activityIds: ['ACT-G5-MATH-LINE-CHART-PLOT-CANDIDATE'], evidenceStageIds: ['plot-plant-growth-week', 'plot-daylight-hours'], status: 'partial', reason: '以預設模擬時間序列資料在畫面建點；未涵蓋真實資料蒐集及圖表使用時機的比較判斷。' },
];
const mappingByCode = new Map(mapped.map((row) => [row.code, row]));
batch.activityAudit = batch.clauses.map(({ code }) => mappingByCode.get(code) ?? ({
  code, status: 'uncovered', activityIds: [], evidenceStageIds: [],
  reason: '在五年級數學候選活動中未找到可對應此官方條目的實際互動；此判定只涵蓋本批已檢查的候選活動，不代表其他校本教學。',
}));

const clauseByCode = new Map(audit.clauses.map((row) => [row.code, row]));
for (const row of batch.clauses) {
  const prior = clauseByCode.get(row.code);
  clauseByCode.set(row.code, {
    ...(prior ?? {}), code: row.code, clauseType: 'learning_content', officialText: row.officialText,
    officialNotes: row.officialNotes, officialPerformanceLinks: row.officialPerformanceLinks,
    relationshipKind: row.relationshipKind, equivalentOfficialCode: row.equivalentOfficialCode ?? prior?.equivalentOfficialCode ?? null,
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
audit.contentInventoryBatches.push({ batchId: batch.batchId, status: batch.status, sourceId: batch.sourceId, documentTitle: batch.documentTitle, sourceUrl: batch.sourceUrl, publicationInfo: batch.publicationInfo, sourceLocation: batch.sourceLocation, applicability: batch.applicability, reviewMethod: batch.reviewMethod, verifiedCodeCount: codes.length, codes, uniqueConceptCount: codes.length, nextWorkPosition: batch.nextWorkPosition });
audit.auditStatus = 'verified_grade1_to_grade5_contiguous_content_table_batches_full_inventory_incomplete';
const note = '另逐列核對五年級學習內容表 PDF 頁序31–34，共27個官方代碼列、27個條目；N-5-4、N-5-11、S-5-4跨頁續文已追蹤。本表批次不代表完整數學領綱。';
if (!audit.reviewMethod.includes(note)) audit.reviewMethod = `${audit.reviewMethod} ${note}`;

const verified = new Set(mathSource.verifiedClauses ?? []);
for (const code of codes) verified.add(code);
mathSource.verifiedClauses = [...verified];
mathSource.reviewStatus = 'partial_math_learning_content_inventory_grade1_to_grade5_tables_verified_full_inventory_incomplete';
const sourceNote = '五年級學習內容表 PDF 頁序31–34逐列核對27個代碼列；六年級表 PDF頁序35起待核對。官方完整數學清冊仍未完成。';
if (!mathSource.pageOrSection.includes(sourceNote)) mathSource.pageOrSection = `${mathSource.pageOrSection} ${sourceNote}`;

const focusId = 'math-grade5-integer-division-fraction-representation';
const official = batch.clauses.find(({ code }) => code === 'N-5-6');
const focus = {
  id: focusId, subject: 'mathematics',
  focus: '第三學習階段學習內容 N-5-6：從分裝（測量）和平分觀點理解整數相除以分數表示。本活動用兩個螢幕拼片情境表示3÷4=3/4。',
  gradeRange: [5, 5], stagePerformanceRange: [5, 6], sourceId: 'mathematics', status: 'pending_review',
  officialTextReviewStatus: 'verified_against_official_pdf_this_run', gradeApplicabilityStatus: 'official_grade_table_5_and_stage_3; semester_and_local_schedule_pending',
  performanceCodes: official.officialPerformanceLinks,
  performanceTexts: official.officialPerformanceLinks.map((code) => audit.learningPerformanceClauses.find((clause) => clause.code === code)?.officialText).filter(Boolean),
  contentCodes: ['N-5-6'], contentTexts: [official.officialText], sourceUrl: batch.sourceUrl, documentTitle: batch.documentTitle,
  pageOrSection: '五年級學習內容表 N-5-6，PDF頁序32；同表對應表現 n-III-5，學習表現表 PDF頁序12（印刷頁10）。此為官方表格/學習階段對照，不表示當地五年級學期順序。',
  reviewer: '官方 PDF 條文核對（非教師課程審查）', reviewDate: '2026-10-24', verifiedClauses: ['N-5-6', 'n-III-5'],
  notes: '新活動為螢幕拼片模型，需教師確認平分與測量用語、先備及是否搭配實物教具。',
  candidateActivityId: GRADE5_INTEGER_DIVISION_FRACTION_MODEL.activityId, coverageStatus: 'partial',
  coverageLimitations: ['僅以3÷4示範平分與測量兩種觀點，沒有真實實物操作或量測。', '工程互動不構成教師審查或學生理解證據。'],
};
const focusRows = [...map.verifiedLearningFocuses, ...(map.supplementalVerifiedLearningFocuses ?? []), ...map.pendingLearningFocuses];
const existingFocus = focusRows.find(({ id }) => id === focusId);
if (existingFocus) {
  if (existingFocus.candidateActivityId !== focus.candidateActivityId) throw new Error(`focus_id_conflict:${focusId}`);
  Object.assign(existingFocus, focus);
} else map.pendingLearningFocuses.push(focus);

const subitemId = 'SUB-MATH-STAGE3-N5-6-INTEGER-DIVISION-AS-FRACTION';
const subitem = {
  subitemId, focusId, subject: 'mathematics', officialCode: 'N-5-6', sourceText: official.officialText,
  sourceTextKind: 'official_pdf_clause_checked_2026-10-24; project subitem is analysis',
  sourceRef: { sourceId: 'mathematics', pageOrSection: '五年級學習內容表 N-5-6，PDF頁序32；對應 n-III-5。' },
  projectSubitem: '使用拼片先把3個整體平均分給4人，為一人組合3個四分之一；再將3個等單位片放入由4份構成的一個測量單位，表達3÷4=3/4。這是專案分析，不是額外官方條文。',
  decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24', activityIds: [GRADE5_INTEGER_DIVISION_FRACTION_MODEL.activityId],
  evidenceStageIds: GRADE5_INTEGER_DIVISION_FRACTION_MODEL.stages.map(({ stageId }) => stageId), status: 'candidate_partial_interaction',
};
const priorSubitem = definitions.definitions.find(({ subitemId: id }) => id === subitemId);
if (priorSubitem) Object.assign(priorSubitem, subitem);
else definitions.definitions.push(subitem);

batch.nextWorkPosition = '同一官方數學領綱 PDF 六年級學習內容表：頁序35「6年級」表頭與N-6-1開始，逐列核對至六年級表格結束，追蹤表格跨頁續文及備註。';
write('curriculum/math-grade5-official-content-batch.json', batch);
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', sources);
write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
console.log(JSON.stringify({ batchId: batch.batchId, registeredRows: codes.length, uniqueCodes: new Set(codes).size, uniqueConcepts: batch.clauses.length, inventoryRows: audit.officialContentClauseCount, activityAuditCounts: Object.fromEntries(['partial', 'relation_only', 'uncovered'].map((status) => [status, batch.activityAudit.filter((row) => row.status === status).length])), nextWorkPosition: batch.nextWorkPosition }, null, 2));
