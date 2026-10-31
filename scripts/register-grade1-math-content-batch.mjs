import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const batch = read('curriculum/math-grade1-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const sources = read('curriculum/sources.json');
const map = read('curriculum/curriculum-map.json');
const definitions = read('curriculum/learning-subitem-definitions.json');
const source = sources.sources.find(({ id }) => id === 'mathematics');
if (!source) throw new Error('mathematics_source_missing');

const codes = batch.clauses.map(({ code }) => code);
if (codes.length !== 11 || new Set(codes).size !== codes.length) throw new Error('grade1_batch_must_contain_11_unique_official_codes');
for (const row of batch.clauses) {
  if (!row.officialText || !row.sourceLocation || row.officialPerformanceLinks.length === 0
    || row.relationshipKind !== 'explicit_same_table_corresponding_performance') throw new Error(`incomplete_official_clause:${row.code}`);
  for (const performanceCode of row.officialPerformanceLinks) {
    if (!audit.learningPerformanceClauses.some(({ code }) => code === performanceCode)) throw new Error(`unresolved_performance_link:${row.code}:${performanceCode}`);
  }
  const prior = audit.clauses.find(({ code }) => code === row.code);
  if (prior && prior.officialText !== row.officialText) {
    const previouslyCombinedTextAndNotes = row.officialNotes && prior.officialText === `${row.officialText}${row.officialNotes}`;
    if (!previouslyCombinedTextAndNotes) throw new Error(`official_text_conflict:${row.code}`);
  }
}

const existing = new Map(audit.clauses.map((row) => [row.code, row]));
for (const row of batch.clauses) {
  const prior = existing.get(row.code);
  existing.set(row.code, {
    ...(prior ?? {}), code: row.code, clauseType: 'learning_content', officialText: row.officialText,
    officialNotes: row.officialNotes, officialPerformanceLinks: row.officialPerformanceLinks,
    relationshipKind: row.relationshipKind, equivalentOfficialCode: row.equivalentOfficialCode ?? null,
    sourceLocation: row.sourceLocation, applicability: { ...batch.applicability },
    reviewStatus: 'verified_against_official_pdf_this_run', auditBatchId: batch.batchId,
  });
}
audit.clauses = [...existing.values()];
audit.officialContentClauseCount = audit.clauses.filter(({ clauseType }) => clauseType === 'learning_content').length;
audit.contentInventoryBatches ??= [];
audit.contentInventoryBatches = audit.contentInventoryBatches.filter(({ batchId }) => batchId !== batch.batchId);
audit.contentInventoryBatches.push({
  batchId: batch.batchId, status: batch.status, sourceId: batch.sourceId, documentTitle: batch.documentTitle,
  sourceUrl: batch.sourceUrl, publicationInfo: batch.publicationInfo, sourceLocation: batch.sourceLocation,
  applicability: batch.applicability, reviewMethod: batch.reviewMethod,
  verifiedCodeCount: batch.clauses.length, codes,
  duplicateConceptAliases: batch.clauses.filter(({ equivalentOfficialCode }) => equivalentOfficialCode).map(({ code, equivalentOfficialCode }) => ({ code, equivalentOfficialCode })),
  nextWorkPosition: batch.nextWorkPosition,
});
audit.auditStatus = 'verified_grade1_and_grade3_contiguous_content_table_batches_and_verified_subset_not_full_math_inventory';
const reviewNote = '另逐列核對一年級學習內容表PDF頁序21–22，11個官方代碼（其中N-1-5與S-1-1明示同內容，按概念不重複計數）；含跨頁、備註及對應表現欄。官方全數學內容清冊仍未完成。';
if (!audit.reviewMethod.includes(reviewNote)) audit.reviewMethod = `${audit.reviewMethod} ${reviewNote}`;
const verified = new Set(source.verifiedClauses ?? []);
for (const row of batch.clauses) verified.add(row.code);
source.verifiedClauses = [...verified];
source.reviewStatus = 'partial_math_learning_content_inventory_grade1_and_grade3_tables_verified_full_inventory_incomplete';
const sourceNote = '一年級學習內容表PDF頁序21–22逐列核對11個官方代碼（N-1-5/S-1-1為同內容雙代碼）；三年級表頁序25–28逐列核對24個代碼；其他年級表仍待逐條核實。';
if (!source.pageOrSection.includes(sourceNote)) source.pageOrSection = `${source.pageOrSection} ${sourceNote}`;

const focusId = 'math-grade1-simple-classification';
if (!map.pendingLearningFocuses.some(({ id }) => id === focusId)
  && !map.verifiedLearningFocuses.some(({ id }) => id === focusId)) {
  map.pendingLearningFocuses.push({
    id: focusId, subject: 'mathematics',
    focus: '一年級內容 D-1-1：用日常物品進行簡單分類、記錄呈現並觀察同一組資料的不同分類方式。本候選只用同一組模擬物品卡按顏色及形狀分類，部分練習，不涵蓋學生自行蒐集與創作呈現。',
    gradeRange: [1, 1], stagePerformanceRange: [1, 2], sourceId: 'mathematics', status: 'pending_review',
    officialTextReviewStatus: 'verified_against_official_pdf_this_run',
    gradeApplicabilityStatus: 'grade_1_content_code_local_schedule_pending',
    performanceCodes: ['d-I-1'], performanceTexts: ['認識分類的模式，能主動蒐集資料、分類，並做簡單的呈現與說明。'],
    contentCodes: ['D-1-1'], contentTexts: [batch.clauses.find(({ code }) => code === 'D-1-1').officialText],
    sourceUrl: batch.sourceUrl, documentTitle: batch.documentTitle,
    pageOrSection: '伍／學習重點／二、學習內容／一年級表 D-1-1，官方 PDF 頁序22；同表對應表現 d-I-1，PDF頁序15。PDF頁序以1起算，不表示學期或教材順序。',
    reviewer: '官方 PDF 條文核對（非教師課程審查）', reviewDate: '2026-10-23',
    verifiedClauses: ['D-1-1', 'd-I-1'], notes: '螢幕模擬分類互動；教師仍需確認年級授課時機及實物蒐集、學生自製記錄活動。',
    candidateActivityId: 'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE', coverageStatus: 'partial',
    coverageLimitations: ['資料為預先提供的模擬卡片，未評量學生自行蒐集日常物品。', '只有兩種分類與一個分類依據說明，未涵蓋自由記錄及創意呈現。'],
  });
}

const subitemId = 'SUB-MATH-G1-D1-1-SAME-DATA-TWO-CLASSIFICATIONS';
if (!definitions.definitions.some(({ subitemId: id }) => id === subitemId)) {
  definitions.definitions.push({
    subitemId, focusId, subject: 'mathematics', officialCode: 'D-1-1',
    sourceText: batch.clauses.find(({ code }) => code === 'D-1-1').officialText,
    sourceTextKind: 'official_pdf_clause_checked_this_run; project subitem is analysis',
    sourceRef: { sourceId: 'mathematics', pageOrSection: '官方數學領綱一年級學習內容表 D-1-1，PDF頁序22；對應表現 d-I-1，PDF頁序15。' },
    projectSubitem: '使用同一組四張模擬物品卡，先按顏色、再按形狀分類，並辨認分類依據改變；不把模擬卡片當成真實蒐集或自由製作資料呈現。',
    decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_23',
    activityIds: ['ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE'],
    evidenceStageIds: ['sort-same-set-by-colour', 're-sort-same-set-by-shape', 'identify-classification-rule'],
    status: 'candidate_partial_interaction',
  });
}

const grade3Batch = read('curriculum/math-grade3-official-content-batch.json');
grade3Batch.nextWorkPosition = '已完成一年級學習內容表 PDF頁序21–22；下一步為二年級學習內容表 PDF頁序22起，逐列核對所有代碼、備註、參考教具及對應表現。';
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', sources);
write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
write('curriculum/math-grade3-official-content-batch.json', grade3Batch);
console.log(JSON.stringify({ batchId: batch.batchId, rows: batch.clauses.length, uniqueCodes: new Set(codes).size, clauseInventory: audit.officialContentClauseCount, projectFocusId: focusId, subitemId, nextPosition: grade3Batch.nextWorkPosition }, null, 2));
