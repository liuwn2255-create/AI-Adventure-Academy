import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const batch = read('curriculum/math-grade4-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const sources = read('curriculum/sources.json');
const map = read('curriculum/curriculum-map.json');
const definitions = read('curriculum/learning-subitem-definitions.json');
const mathSource = sources.sources.find(({ id }) => id === 'mathematics');
if (!mathSource) throw new Error('mathematics_source_missing');
// Keep every grade batch and mapped focus on the canonical source-registry URL.
batch.sourceUrl = mathSource.url;

const codes = batch.clauses.map(({ code }) => code);
if (batch.applicability.officialGradeTable !== 4 || codes.length !== 26 || new Set(codes).size !== codes.length) {
  throw new Error('grade4_batch_must_contain_26_unique_official_code_rows');
}
for (const row of batch.clauses) {
  if (!row.officialText || row.officialNotes === undefined || !row.sourceLocation
    || row.officialPerformanceLinks?.length === 0 || row.relationshipKind !== 'explicit_same_table_corresponding_performance') {
    throw new Error(`incomplete_official_clause:${row.code}`);
  }
  for (const performanceCode of row.officialPerformanceLinks) {
    if (!audit.learningPerformanceClauses.some(({ code }) => code === performanceCode)) {
      throw new Error(`unresolved_performance_link:${row.code}:${performanceCode}`);
    }
  }
  const prior = audit.clauses.find(({ code }) => code === row.code);
  if (prior && prior.officialText !== row.officialText) throw new Error(`official_text_conflict:${row.code}`);
}

const clauseByCode = new Map(audit.clauses.map((row) => [row.code, row]));
for (const row of batch.clauses) {
  const prior = clauseByCode.get(row.code);
  clauseByCode.set(row.code, {
    ...(prior ?? {}), code: row.code, clauseType: 'learning_content', officialText: row.officialText,
    officialNotes: row.officialNotes, officialPerformanceLinks: row.officialPerformanceLinks,
    relationshipKind: row.relationshipKind, equivalentOfficialCode: row.equivalentOfficialCode ?? null,
    relatedOfficialCodes: row.relatedOfficialCodes ?? row.relatedOfficialCode ? (row.relatedOfficialCodes ?? [row.relatedOfficialCode]) : (prior?.relatedOfficialCodes ?? []),
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
  batchId: batch.batchId, status: batch.status, sourceId: batch.sourceId,
  documentTitle: batch.documentTitle, sourceUrl: batch.sourceUrl, publicationInfo: batch.publicationInfo,
  sourceLocation: batch.sourceLocation, applicability: batch.applicability,
  reviewMethod: batch.reviewMethod, verifiedCodeCount: batch.clauses.length, codes,
  uniqueConceptCount: batch.clauses.length - batch.conceptRelationships.length,
  conceptRelationships: batch.conceptRelationships,
  nextWorkPosition: batch.nextWorkPosition,
});
audit.auditStatus = 'verified_grade1_grade2_grade3_and_grade4_contiguous_content_table_batches_full_inventory_incomplete';
const note = '另逐列核對四年級學習內容表 PDF 頁序28–31，共26個唯一官方代碼列、24個概念（N-4-10/S-4-1同內容；N-4-12/S-4-4為相關體積列）；本表完成不代表數學領綱全清冊完成。';
if (!audit.reviewMethod.includes(note)) audit.reviewMethod = `${audit.reviewMethod} ${note}`;
const verified = new Set(mathSource.verifiedClauses ?? []);
for (const code of codes) verified.add(code);
mathSource.verifiedClauses = [...verified];
mathSource.reviewStatus = 'partial_math_learning_content_inventory_grade1_to_grade4_tables_verified_full_inventory_incomplete';
const sourceNote = '四年級學習內容表 PDF 頁序28–31逐列核對26個代碼列、24個概念；五年級表格為下一待核對位置。官方完整數學清冊仍未完成。';
if (!mathSource.pageOrSection.includes(sourceNote)) mathSource.pageOrSection = `${mathSource.pageOrSection} ${sourceNote}`;

const focusId = 'math-grade4-equivalent-fractions';
const focus = {
  id: focusId, subject: 'mathematics',
  focus: '四年級學習內容 N-4-6：由操作活動理解等值分數的意義。本候選活動只操作同一大小分數帶上的 1/2＝2/4、2/5＝4/10 與 1/2＝3/6。',
  gradeRange: [4, 4], stagePerformanceRange: [3, 4], sourceId: 'mathematics',
  status: 'pending_review', officialTextReviewStatus: 'verified_against_official_pdf_this_run',
  gradeApplicabilityStatus: 'official_grade_table_4; semester_and_local_schedule_pending',
  performanceCodes: ['n-II-6'],
  performanceTexts: ['理解同分母分數的加、減、整數倍的意義、計算與應用；認識等值分數的意義，並應用於認識簡單異分母分數之比較與加減的意義。'],
  contentCodes: ['N-4-6'], contentTexts: [batch.clauses.find(({ code }) => code === 'N-4-6').officialText],
  sourceUrl: batch.sourceUrl, documentTitle: batch.documentTitle,
  pageOrSection: '四年級學習內容表 N-4-6，PDF頁序29；同表對應表現 n-II-6，PDF頁序12（印刷頁10）。PDF頁序以1起算；不代表學期或教材順序。',
  reviewer: '官方 PDF 條文核對（非教師課程審查）', reviewDate: '2026-10-24',
  verifiedClauses: ['N-4-6', 'n-II-6'], notes: '候選互動為螢幕分數帶，教師仍需確認先備、年級實際進度與實體分數片配套。',
  candidateActivityId: 'ACT-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE', coverageStatus: 'partial',
  coverageLimitations: ['僅建構三組簡單等值分數，未涵蓋簡單異分母分數加減及簡單分數與小數互換。', '程式互動不構成教師認可或學生掌握證據。'],
};
const focusRows = [...map.verifiedLearningFocuses, ...(map.supplementalVerifiedLearningFocuses ?? []), ...map.pendingLearningFocuses];
const existingFocus = focusRows.find(({ id }) => id === focusId);
if (existingFocus) {
  if (existingFocus.candidateActivityId !== focus.candidateActivityId) throw new Error(`focus_id_conflict:${focusId}`);
  Object.assign(existingFocus, focus);
} else map.pendingLearningFocuses.push(focus);

const subitemId = 'SUB-MATH-G4-N4-6-EQUIVALENT-FRACTIONS-MODEL-TRANSFER';
const subitem = {
  subitemId, focusId, subject: 'mathematics', officialCode: 'N-4-6',
  sourceText: batch.clauses.find(({ code }) => code === 'N-4-6').officialText,
  sourceTextKind: 'official_pdf_clause_checked_2026-10-24; project subitem is analysis',
  sourceRef: { sourceId: 'mathematics', pageOrSection: '四年級學習內容表 N-4-6，PDF頁序29；對應 n-II-6，PDF頁序12（印刷頁10）。' },
  projectSubitem: '以相同大小的整體操作兩種等分表示，先配對 1/2 與 2/4，再將 2/5 遷移到 4/10，最後在新分割的 6 格帶上重建一半。這是專案分析，不是另造官方細目。',
  decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24',
  activityIds: ['ACT-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE'],
  evidenceStageIds: ['match-half-with-two-fourths', 'match-two-fifths-with-four-tenths', 'transfer-half-to-sixths'],
  status: 'candidate_partial_interaction',
};
const priorSubitem = definitions.definitions.find(({ subitemId: id }) => id === subitemId);
if (priorSubitem) Object.assign(priorSubitem, subitem);
else definitions.definitions.push(subitem);

const additionalInteractiveEvidence = [
  {
    subitemId: 'SUB-MATH-G4-N4-1-LARGE-NUMBER-PLACE-VALUE-REPRESENTATION', focusId: 'math-grade4-large-number-place-value', officialCode: 'N-4-1',
    activityId: 'ACT-G4-MATH-LARGE-NUMBER-PLACE-VALUE-CANDIDATE', evidenceStageIds: ['decompose-large-number', 'order-cargo'],
    projectSubitem: '從位值部分卡拆解一個一億以內的大數，並依數值排列不同數字；此專案子項不涵蓋大數應用加減。',
    sourceLocation: '四年級學習內容表 N-4-1，PDF頁序28；同表表現 n-II-1，PDF頁序12。',
  },
  {
    subitemId: 'SUB-MATH-G4-N4-2-PLACE-VALUE-CALCULATION-STEPS', focusId: 'math-grade4-multi-digit-multiply-divide', officialCode: 'N-4-2',
    activityId: 'ACT-G4-MATH-MULTI-DIGIT-MULTIPLY-DIVIDE-CANDIDATE', evidenceStageIds: ['multiply-by-place', 'divide-by-place'],
    projectSubitem: '選取多位數乘法及除法中的分步中間值，以位值與乘除關係檢查結果；此為螢幕步驟選取，不等於完整直式計算或估商能力。',
    sourceLocation: '四年級學習內容表 N-4-2，PDF頁序28；同表表現 n-II-2、n-II-3，PDF頁序12。',
  },
  {
    subitemId: 'SUB-MATH-G4-N4-5-FRACTION-BAR-REPRESENT-COMPARE', focusId: 'math-grade4-common-denominator-fractions', officialCode: 'N-4-5',
    activityId: 'ACT-G4-MATH-FRACTION-TILES-CANDIDATE', evidenceStageIds: ['shade-three-sixths', 'compare-fifths', 'build-four-fifths-transfer'],
    projectSubitem: '以等大分數帶選取拼片表示真分數、比較同分母分數，並在不同分母的新帶上表示一個分數；未涵蓋假／帶分數、加減與整數倍。',
    sourceLocation: '四年級學習內容表 N-4-5，PDF頁序28–29；同表表現 n-II-6，PDF頁序12。',
  },
];
for (const evidence of additionalInteractiveEvidence) {
  const row = batch.clauses.find(({ code }) => code === evidence.officialCode);
  const entry = {
    subitemId: evidence.subitemId, focusId: evidence.focusId, subject: 'mathematics', officialCode: evidence.officialCode,
    sourceText: row.officialText,
    sourceTextKind: 'official_pdf_clause_checked_2026-10-24; project subitem is analysis',
    sourceRef: { sourceId: 'mathematics', pageOrSection: evidence.sourceLocation },
    projectSubitem: evidence.projectSubitem,
    decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24',
    activityIds: [evidence.activityId], evidenceStageIds: evidence.evidenceStageIds,
    status: 'candidate_partial_interaction',
  };
  const existing = definitions.definitions.find(({ subitemId: id }) => id === evidence.subitemId);
  if (existing) Object.assign(existing, entry);
  else definitions.definitions.push(entry);
}

batch.nextWorkPosition = '同一官方 PDF 五年級學習內容表：從四年級表末 PDF 頁序31之後的「5年級」表頭開始，逐列記錄至六年級表頭前；確認跨頁附註與同表學習表現。';
write('curriculum/math-grade4-official-content-batch.json', batch);
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', sources);
write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
console.log(JSON.stringify({ batchId: batch.batchId, registeredRows: batch.clauses.length, uniqueCodes: new Set(codes).size, uniqueConcepts: batch.clauses.length - batch.conceptRelationships.length, inventoryRows: audit.officialContentClauseCount, nextWorkPosition: batch.nextWorkPosition }, null, 2));
