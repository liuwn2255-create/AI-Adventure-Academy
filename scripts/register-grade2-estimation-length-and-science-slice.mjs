import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const map = read('curriculum/curriculum-map.json');
const definitions = read('curriculum/learning-subitem-definitions.json');
const mathBatch = read('curriculum/math-grade2-official-content-batch.json');
const mathAudit = read('curriculum/math-focused-clause-audit.json');
const scienceBatch = read('curriculum/natural-science-stage2-ina-official-content-batch.json');
const scienceInbBatch = read('curriculum/natural-science-stage2-inb-official-content-batch.json');
const sources = read('curriculum/sources.json');
const mathSource = sources.sources.find((source) => source.id === 'mathematics');
const performanceTextByCode = new Map(mathAudit.learningPerformanceClauses.map((row) => [row.code, row.officialText]));

const additions = [
  { code: 'N-2-5', id: 'math-grade2-money-combination-problem-solving', title: '百元至千元幣值組合解題', activityId: 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE', objectiveId: 'LO-G2-MATH-MONEY-COMBINATION-01', subitemId: 'SUB-MATH-G2-N2-5-OPERATE-DENOMINATION-COMBINATIONS', stageIds: ['pay-market-basket-one-hundred', 'pay-market-basket-five-hundred', 'pay-market-basket-one-thousand'], projectSubitem: '在模擬市集用可多選面額卡組成100、500、1000元付款，查看即時加總，並以不同面額組合表示相同總額；接受組合是專案選例，不是官方策略清單。', notCovered: ['實體錢幣/紙鈔操作與真實購物', '找零、所有可能的等值組合與自主策略說明', '教師觀察與實際數感'], note: '官方 N-2-5：100元、500元、1000元，以操作活動為主兼及計算，容許多元策略，包含已學習之更小幣值；備註可與N-2-4估算連結。官方數學批次PDF頁序23；同表對應表現 n-I-3。' },
  { code: 'N-2-4', id: 'math-grade2-life-add-sub-estimation', title: '生活情境加減估算', activityId: 'ACT-G2-MATH-LIFE-ESTIMATION-HUNDREDS-CANDIDATE', objectiveId: 'LO-G2-MATH-LIFE-ESTIMATION-01', subitemId: 'SUB-MATH-G2-N2-4-ROUND-HUNDREDS-LIFE-ESTIMATION', stageIds: ['estimate-class-library-books', 'estimate-school-fair-change', 'estimate-sports-day-supplies'], projectSubitem: '在三個生活情境中依百位估算線索調整估值滑桿，判斷估算是否落在情境可支持的範圍；此為專案拆解，合理範圍非官方誤差標準。', notCovered: ['學生自主選擇並口頭說明估算策略', '更廣泛的生活情境及教師觀察'], note: '官方 N-2-4：解題：簡單加減估算。具體生活情境。以百位數估算為主。官方 PDF 頁序23；同表學習表現 n-I-3。' },
  { code: 'N-2-11', id: 'math-grade2-length-measure-estimate-calculate-convert', title: '公分公尺長度測量', activityId: 'ACT-G2-MATH-LENGTH-MEASURE-CONVERT-CANDIDATE', objectiveId: 'LO-G2-MATH-LENGTH-MEASURE-CONVERT-01', subitemId: 'SUB-MATH-G2-N2-11-CM-MEASURE-ESTIMATE-CONVERT', stageIds: ['estimate-ribbon-centimeters', 'align-ruler-zero-and-read-bookmark', 'compare-and-find-centimeter-difference', 'convert-two-meters-to-centimeters', 'combine-meters-and-centimeters'], projectSubitem: '以螢幕尺模型估測公分、將尺零刻度對齊非零起點並讀值、比較兩長度與差值，並使用個位數公尺練習公尺公分換算。', notCovered: ['真實物件實測與實體尺規操作', '曲線量測、個人量感及教師觀察'], note: '官方 N-2-11：長度：「公分」、「公尺」。實測、量感、估測與計算。單位換算。官方 PDF 頁序24；官方備註限公尺數換算至個位數，且長度加減宜連結數線。' },
];
for (const item of additions) {
  const clause = mathBatch.clauses.find((row) => row.code === item.code);
  if (!clause) throw new Error(`missing_official_math_clause:${item.code}`);
  const performanceCode = clause.officialPerformanceLinks[0];
  const performanceText = performanceTextByCode.get(performanceCode);
  if (!performanceText) throw new Error(`missing_performance_text:${performanceCode}`);
  if (!map.verifiedLearningFocuses.some((focus) => focus.id === item.id)) map.verifiedLearningFocuses.push({
    id: item.id, subject: 'mathematics', focus: `${item.title}（${item.code}）：${clause.officialText} 本活動為部分候選互動，限制：${item.notCovered.join('；')}。`,
    gradeRange: [2, 2], stagePerformanceRange: [1, 2], learningStage: '第一學習階段（一、二年級）', sourceId: 'mathematics', status: 'verified_in_official_guideline_grade_content',
    officialTextReviewStatus: 'verified_against_official_text', gradeApplicabilityStatus: 'grade_2_content_code_local_schedule_pending', performanceCodes: [performanceCode], performanceTexts: [performanceText], contentCodes: [item.code], contentTexts: [clause.officialText],
    sourceUrl: mathBatch.sourceUrl, documentTitle: mathBatch.documentTitle, pageOrSection: clause.sourceLocation, reviewer: '官方 PDF 條文核對（非教師課程審查）', reviewDate: '2026-10-25', verifiedClauses: [item.code, performanceCode], coverageStatus: 'partial', coverageLimitations: item.notCovered, localScheduleStatus: 'pending_school_and_textbook_evidence', teacherProfessionalReviewStatus: 'pending_review', candidateActivityId: item.activityId,
  });
  if (!definitions.definitions.some((definition) => definition.subitemId === item.subitemId)) definitions.definitions.push({
    subitemId: item.subitemId, focusId: item.id, subject: 'mathematics', officialCode: item.code, officialPerformanceCode: performanceCode, sourceText: clause.officialText,
    sourceTextKind: 'verbatim_official_pdf_clause_checked_in_existing_grade2_batch', sourceNotes: clause.officialNotes ?? '', sourceRef: { sourceId: 'mathematics', pageOrSection: `${clause.sourceLocation}；對應表現 ${performanceCode}` },
    projectSubitem: item.projectSubitem, decompositionKind: 'project_decomposition_from_verified_official_grade2_clause', activityIds: [item.activityId], evidenceStageIds: item.stageIds,
    notCovered: item.notCovered, status: 'candidate_partial_interaction',
  });
}
const scienceSource = sources.sources.find((source) => source.id === 'natural-science');
if (!scienceSource) throw new Error('missing_natural_science_source');
scienceSource.verifiedContentBatches ??= [];
const scienceRef = { batchId: scienceBatch.batchId, batchFile: 'curriculum/natural-science-stage2-ina-official-content-batch.json', status: scienceBatch.status, officialContentRowCount: scienceBatch.clauses.length, itemType: 'learning_content', learningStage: scienceBatch.applicability.learningStage, sourceLocation: scienceBatch.sourceLocation, sourceUrl: scienceBatch.sourceUrl, boundary: scienceBatch.boundary };
if (!scienceSource.verifiedContentBatches.some((row) => row.batchId === scienceBatch.batchId)) scienceSource.verifiedContentBatches.push(scienceRef);
const scienceInbRef = { batchId: scienceInbBatch.batchId, batchFile: 'curriculum/natural-science-stage2-inb-official-content-batch.json', status: scienceInbBatch.status, officialContentRowCount: scienceInbBatch.clauses.length, itemType: 'learning_content', learningStage: scienceInbBatch.applicability.learningStage, sourceLocation: scienceInbBatch.sourceLocation, sourceUrl: scienceInbBatch.sourceUrl, boundary: scienceInbBatch.boundary };
if (!scienceSource.verifiedContentBatches.some((row) => row.batchId === scienceInbBatch.batchId)) scienceSource.verifiedContentBatches.push(scienceInbRef);
const scienceNote = '本輪新增直接核讀之INa第二學習階段小節批次：8條學習內容，PDF頁序19；僅此小節，不代表自然科學領綱完成逐條枚舉。';
if (!scienceSource.notes.includes(scienceNote)) scienceSource.notes = `${scienceSource.notes} ${scienceNote}`;
const scienceInbNote = '另核讀官方自然科學領綱「構造與功能（INb）」第二學習階段小節七條（PDF頁序20，文件印刷頁碼17）；只完成此小節，不代表完整領綱清冊。';
if (!scienceSource.notes.includes(scienceInbNote)) scienceSource.notes = `${scienceSource.notes} ${scienceInbNote}`;
write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
write('curriculum/sources.json', sources);
console.log(JSON.stringify({ registeredMathFoci: additions.map((item) => item.id), scienceBatches: [scienceRef, scienceInbRef], repeatSafe: true }));
