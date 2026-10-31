import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`);
const batch = read('curriculum/math-grade2-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const sources = read('curriculum/sources.json');
const map = read('curriculum/curriculum-map.json');
const definitions = read('curriculum/learning-subitem-definitions.json');
const source = sources.sources.find(({ id }) => id === batch.sourceId);
if (!source) throw new Error('mathematics_source_missing');

const codes = batch.clauses.map(({ code }) => code);
if (codes.length !== 24 || new Set(codes).size !== codes.length) throw new Error('grade2_batch_must_contain_24_unique_official_codes');
for (const row of batch.clauses) {
  if (!row.officialText || !row.sourceLocation || !row.officialPerformanceLinks?.length
    || row.relationshipKind !== 'explicit_same_table_corresponding_performance') throw new Error(`incomplete_official_clause:${row.code}`);
  for (const performanceCode of row.officialPerformanceLinks) {
    if (!audit.learningPerformanceClauses.some(({ code }) => code === performanceCode)) throw new Error(`unresolved_performance_link:${row.code}:${performanceCode}`);
  }
  if (row.equivalentOfficialCode && !codes.includes(row.equivalentOfficialCode)) throw new Error(`unresolved_equivalent_code:${row.code}`);
}

const merged = new Map(audit.clauses.map((row) => [row.code, row]));
for (const row of batch.clauses) {
  const prior = merged.get(row.code);
  if (prior?.officialText && prior.officialText !== row.officialText) throw new Error(`official_text_conflict:${row.code}`);
  merged.set(row.code, {
    ...(prior ?? {}), code: row.code, clauseType: 'learning_content', officialText: row.officialText,
    officialNotes: row.officialNotes, referenceTools: row.referenceTools ?? '',
    officialPerformanceLinks: row.officialPerformanceLinks, relationshipKind: row.relationshipKind,
    equivalentOfficialCode: row.equivalentOfficialCode ?? null, relatedOfficialCodes: row.relatedOfficialCodes ?? [],
    sourceLocation: row.sourceLocation, applicability: { ...batch.applicability },
    reviewStatus: 'verified_against_official_pdf_this_run', auditBatchId: batch.batchId,
  });
}
audit.clauses = [...merged.values()];
audit.officialContentClauseCount = audit.clauses.filter(({ clauseType }) => clauseType === 'learning_content').length;
audit.contentInventoryBatches ??= [];
audit.contentInventoryBatches = audit.contentInventoryBatches.filter(({ batchId }) => batchId !== batch.batchId);
audit.contentInventoryBatches.push({
  batchId: batch.batchId, status: batch.status, sourceId: batch.sourceId, documentTitle: batch.documentTitle,
  sourceUrl: batch.sourceUrl, publicationInfo: batch.publicationInfo, sourceLocation: batch.sourceLocation,
  applicability: batch.applicability, reviewMethod: batch.reviewMethod, verifiedCodeCount: batch.clauses.length,
  codes, duplicateConceptAliases: batch.clauses.filter(({ equivalentOfficialCode }) => equivalentOfficialCode).map(({ code, equivalentOfficialCode }) => ({ code, equivalentOfficialCode })),
  partialConceptRelationships: batch.clauses.flatMap(({ code, relatedOfficialCodes, officialNotes }) => (relatedOfficialCodes ?? []).map((relatedCode) => ({ code, relatedCode, note: officialNotes }))),
  nextWorkPosition: batch.nextWorkPosition,
});
audit.auditStatus = 'verified_grade1_grade2_and_grade3_contiguous_content_table_batches_full_inventory_incomplete';
const auditNote = '另逐列核對二年級學習內容表PDF頁序22–25，24個官方代碼列，讀取原文、備註、參考教具、同表表現欄及跨頁續文；N-2-12/S-2-5為部分內容關係，保留兩代碼且不當作別名。官方完整數學清冊仍未完成。';
if (!audit.reviewMethod.includes(auditNote)) audit.reviewMethod = `${audit.reviewMethod} ${auditNote}`;
const refs = new Set(source.verifiedClauses ?? []);
for (const code of codes) refs.add(code);
source.verifiedClauses = [...refs];
source.reviewStatus = 'partial_math_learning_content_inventory_grade1_grade2_grade3_tables_verified_full_inventory_incomplete';
const sourceNote = '二年級學習內容表PDF頁序22–25逐列核對24個代碼列；官方完整數學條目總數仍未知。';
if (!source.pageOrSection.includes(sourceNote)) source.pageOrSection = `${source.pageOrSection} ${sourceNote}`;

const focusId = 'math-grade2-capacity-weight-area-compare';
if (!map.pendingLearningFocuses.some(({ id }) => id === focusId) && !map.verifiedLearningFocuses.some(({ id }) => id === focusId)) {
  map.pendingLearningFocuses.push({
    id: focusId, subject: 'mathematics',
    focus: '官方N-2-12要求容量、重量、面積分開學習並以操作活動進行初步認識、直接與間接比較（含個別單位）；本候選用提供的模擬單位數據操作比較關係，不代表實物量感與實際測量。',
    gradeRange: [2, 2], stagePerformanceRange: [1, 2], sourceId: 'mathematics', status: 'pending_review',
    officialTextReviewStatus: 'verified_against_official_pdf_this_run', gradeApplicabilityStatus: 'grade_2_content_table_local_entry_first_stage_official_no_semester',
    performanceCodes: ['n-I-8'], performanceTexts: audit.learningPerformanceClauses.find(({ code }) => code === 'n-I-8')?.officialText ? [audit.learningPerformanceClauses.find(({ code }) => code === 'n-I-8').officialText] : [],
    contentCodes: ['N-2-12'], contentTexts: [batch.clauses.find(({ code }) => code === 'N-2-12').officialText],
    sourceUrl: batch.sourceUrl, documentTitle: batch.documentTitle,
    pageOrSection: '伍／二／二年級學習內容表 N-2-12，官方 PDF 頁序24；同表對應第一學習階段表現 n-I-8，PDF頁序15。S-2-5僅是其面積部分，不是別名。',
    reviewer: '官方 PDF 條文核對（非教師課程審查）', reviewDate: '2026-10-24', verifiedClauses: ['N-2-12', 'n-I-8'],
    notes: '畫面資料模擬間接比較，不等於容量倒水、天平秤重、實物面積操作或重量量感。',
    candidateActivityId: 'ACT-G2-MATH-CAPACITY-WEIGHT-AREA-COMPARISON-CANDIDATE', coverageStatus: 'partial',
    coverageLimitations: ['只用預先給定的模擬比較資料，未讓學生自行測量或蒐集量值。', '不提供實物容器、天平、砝碼、百格圖，不能評量重量量感。', '目前三種比較皆以畫面分類操作，尚須教師確認是否足以作為實物操作的先備練習。'],
  });
}
const subitemId = 'SUB-MATH-G2-N2-12-COMPARE-CAPACITY-WEIGHT-AREA';
if (!definitions.definitions.some(({ subitemId: id }) => id === subitemId)) definitions.definitions.push({
  subitemId, focusId, subject: 'mathematics', officialCode: 'N-2-12',
  sourceText: batch.clauses.find(({ code }) => code === 'N-2-12').officialText,
  sourceTextKind: 'official_pdf_clause_checked_this_run; project subitem is analysis',
  sourceRef: { sourceId: 'mathematics', pageOrSection: '官方數學領綱二年級學習內容表 N-2-12，PDF頁序24；對應表現 n-I-8，PDF頁序15。' },
  projectSubitem: '在容量、重量、面積三個分開情境中，根據相同非標準單位的模擬量值，操作分類比較關係；不把讀取模擬資料宣稱為實物直接測量或量感。',
  decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24',
  activityIds: ['ACT-G2-MATH-CAPACITY-WEIGHT-AREA-COMPARISON-CANDIDATE'],
  evidenceStageIds: ['compare-area-unit-squares', 'compare-capacity-cup-units', 'compare-weight-balance-units'],
  status: 'candidate_partial_interaction',
});

const grade3Batch = read('curriculum/math-grade3-official-content-batch.json');
grade3Batch.nextWorkPosition = '已完成二年級學習內容表PDF頁序22–25；下一步為四年級表，官方PDF頁序28從「4年級」表頭與N-4-1開始，續至五年級表頭前，逐列核對跨頁續文。';
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', sources);
write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
write('curriculum/math-grade3-official-content-batch.json', grade3Batch);
console.log(JSON.stringify({ batchId: batch.batchId, rows: codes.length, uniqueCodes: new Set(codes).size, inventoryRows: audit.officialContentClauseCount, focusId, subitemId, nextPosition: grade3Batch.nextWorkPosition }, null, 2));
