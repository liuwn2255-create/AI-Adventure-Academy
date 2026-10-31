import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const batch = read('curriculum/math-grade3-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const sources = read('curriculum/sources.json');
const mathSource = sources.sources.find(({ id }) => id === 'mathematics');
if (!mathSource) throw new Error('mathematics_source_missing');
batch.sourceUrl = mathSource.url;
const merged = new Map(audit.clauses.map((clause) => [clause.code, clause]));
for (const clause of batch.clauses) {
  if (!clause.code || !clause.officialText || !clause.sourceLocation || clause.officialPerformanceLinks.length === 0) {
    throw new Error(`incomplete_official_clause:${clause.code ?? 'unknown'}`);
  }
  merged.set(clause.code, {
    code: clause.code,
    clauseType: 'learning_content',
    officialText: clause.officialText,
    officialNotes: clause.officialNotes,
    officialPerformanceLinks: clause.officialPerformanceLinks,
    relationshipKind: clause.relationshipKind,
    sourceLocation: clause.sourceLocation,
    applicability: { ...batch.applicability },
    projectInterpretation: audit.clauses.find((existing) => existing.code === clause.code)?.projectInterpretation ?? null,
    reviewStatus: 'verified_against_official_pdf_this_run',
    auditBatchId: batch.batchId,
  });
}
audit.clauses = [...merged.values()];
audit.officialContentClauseCount = audit.clauses.filter(({ clauseType }) => clauseType === 'learning_content').length;
audit.contentInventoryBatches ??= [];
audit.contentInventoryBatches = audit.contentInventoryBatches.filter(({ batchId }) => batchId !== batch.batchId);
audit.contentInventoryBatches.push({
  batchId: batch.batchId,
  status: batch.status,
  sourceId: batch.sourceId,
  documentTitle: batch.documentTitle,
  sourceUrl: batch.sourceUrl,
  publicationInfo: batch.publicationInfo,
  sourceLocation: batch.sourceLocation,
  applicability: batch.applicability,
  reviewMethod: batch.reviewMethod,
  verifiedCodeCount: batch.clauses.length,
  codes: batch.clauses.map(({ code }) => code),
  nextWorkPosition: '同一官方 PDF 的一年級學習內容表（PDF頁序21起），逐列核對代碼、原文、附註、對應表現及跨頁內容；目前仍非全國小數學完整清冊。',
});
audit.auditStatus = 'verified_grade3_content_table_batch_and_verified_subset_not_full_elementary_math_inventory';
audit.reviewMethod = `${audit.reviewMethod} 本輪另逐列核對三年級學習內容表PDF頁序25–28，共24個唯一代碼；只表示該連續表格範圍已逐列核查，不表示全數學內容清冊已完成。`;
const existingRefs = new Set(mathSource.verifiedClauses ?? []);
for (const clause of batch.clauses) existingRefs.add(clause.code);
mathSource.verifiedClauses = [...existingRefs];
mathSource.reviewStatus = 'partial_math_learning_content_inventory_grade3_table_verified_full_inventory_incomplete';
mathSource.pageOrSection = `${mathSource.pageOrSection} 本輪直接逐列核對三年級學習內容表，PDF頁序25–28，24個條目；其餘年級學習內容表仍待逐條核實。`;
write('curriculum/math-grade3-official-content-batch.json', batch);
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', sources);
console.log(JSON.stringify({ batchId: batch.batchId, batchCount: batch.clauses.length, uniqueContentClauseCount: audit.officialContentClauseCount, verifiedPerformanceCount: audit.learningPerformanceClauses.length, officialTotal: audit.officialInventoryTotal }, null, 2));
