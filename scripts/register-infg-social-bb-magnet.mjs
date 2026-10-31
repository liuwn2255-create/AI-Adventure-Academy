import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const stage = '第二學習階段（官方課綱所列三、四年級；未指定個別年級或學期）';
const scienceUrl = 'https://stv.naer.edu.tw/data/course_outline/pta_18538_240851_60502.pdf';
const socialUrl = 'https://stv.naer.edu.tw/data/course_outline/pta_18535_6408773_60398.pdf';

const scienceRows = [
  ['INf-Ⅱ-1', '日常生活中常見的科技產品。'],
  ['INf-Ⅱ-2', '不同的環境影響人類食物的種類、來源與飲食習慣。'],
  ['INf-Ⅱ-3', '自然的規律與變化對人類生活應用與美感的啟發。'],
  ['INf-Ⅱ-4', '季節的變化與人類生活的關係。'],
  ['INf-Ⅱ-5', '人類活動對環境造成影響。'],
  ['INf-Ⅱ-6', '地震會造成嚴重的災害，平時的準備與防震能降低損害。'],
  ['INf-Ⅱ-7', '水與空氣污染會對生物產生影響。'],
  ['INg-Ⅱ-1', '自然環境中有許多資源。人類生存與生活需依賴自然環境中的各種資源，但自然資源都是有限的，需要珍惜使用。'],
  ['INg-Ⅱ-2', '地球資源永續可結合日常生活中低碳與節水方法做起。'],
  ['INg-Ⅱ-3', '可利用垃圾減量、資源回收、節約能源等方法來保護環境。'],
];
const scienceActivityEvidence = {
  'INf-Ⅱ-1': { ids: [], status: 'uncovered', limit: '本次檢視的自然科學活動沒有讓學生操作、比較日常科技產品的功能或使用情境。' },
  'INf-Ⅱ-2': { ids: [], status: 'uncovered', limit: '未找到操作環境條件、食物來源與飲食習慣關係的直接活動。' },
  'INf-Ⅱ-3': { ids: [], status: 'uncovered', limit: '未找到以自然規律或變化作為生活應用／美感設計依據的自然科學互動。' },
  'INf-Ⅱ-4': { ids: [], status: 'uncovered', limit: '未找到比較季節變化及其生活關係的自然科學活動。' },
  'INf-Ⅱ-5': { ids: ['ACT-G6-INTEGRATIVE-RESOURCE-PLANNER-CANDIDATE'], status: 'relation_only', limit: '該活動規劃虛構班級展覽可用資源，未操作人類活動對自然環境影響的證據。' },
  'INf-Ⅱ-6': { ids: [], status: 'uncovered', limit: '未找到地震防災準備與防震操作／決策活動；現有運動安全情境不是地震防災。' },
  'INf-Ⅱ-7': { ids: [], status: 'uncovered', limit: '未找到水或空氣污染影響生物的證據判讀或變因模擬活動。' },
  'INg-Ⅱ-1': { ids: ['ACT-G6-INTEGRATIVE-RESOURCE-PLANNER-CANDIDATE'], status: 'relation_only', limit: '該活動整理學校／班級服務資源，未比較自然資源的有限性與依賴關係。' },
  'INg-Ⅱ-2': { ids: ['ACT-G6-INTEGRATIVE-RESOURCE-PLANNER-CANDIDATE'], status: 'relation_only', limit: '該活動沒有操作低碳或節水方法，也未比較其資源效果。' },
  'INg-Ⅱ-3': { ids: ['ACT-G6-INTEGRATIVE-RESOURCE-PLANNER-CANDIDATE'], status: 'relation_only', limit: '該活動規劃展覽用品，沒有垃圾減量、回收或節能決策操作。' },
};
const scienceBatch = {
  schemaVersion: 1,
  batchId: 'natural-science-stage2-inf-ing-content-slice-pdf-page-24',
  status: 'verified_bounded_official_content_subsection_not_full_document_inventory',
  sourceId: 'natural-science',
  documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－自然科學領域',
  publicationInfo: '教育部107年11月2日以臺教授國部字第1070119882B號令發布。',
  documentVersion: '官方 PDF 封面標示中華民國107年11月；未確認獨立版本標籤，不推定修訂版號。',
  sourceUrl: scienceUrl,
  sourceLocation: '伍／二／國民小學學習內容／課題3「自然界的永續發展」／跨科概念「科學與生活（INf）」及「資源與永續性（INg）」第二學習階段欄，PDF頁序24、文件印刷頁碼20。',
  applicability: { learningStage: stage, grade: null, semester: null, gradeApplicabilityStatus: 'official_stage_only_not_individual_grade' },
  reviewMethod: '逐頁檢視官方 PDF 原始頁面影像（PDF頁序24／印刷頁20），確認課題3表頭、INf與INg列、第二學習階段欄及該頁表尾；另以官方 PDF 文字層交叉核對10筆原文。該範圍同頁結束，無跨頁續文。',
  relatedPerformanceCodes: [],
  performanceLinkStatus: '此學習內容表未逐列明示學習表現代碼；不自行推定關聯。',
  clauses: scienceRows.map(([code, officialText]) => {
    const evidence = scienceActivityEvidence[code];
    return {
      code, officialText, itemType: 'learning_content', learningStage: stage,
      pdfPageSequence: 24, printedPage: 20,
      sourceLocator: `伍／二／課題3「自然界的永續發展」／${code.startsWith('INf') ? '科學與生活（INf）' : '資源與永續性（INg）'}／第二學習階段欄／${code}`,
      reviewStatus: 'verified_against_official_pdf_rendered_page_and_text_layer_2026-10-26',
      relatedPerformanceCodes: [],
      activityIds: evidence.ids,
      activityEvidenceStatus: evidence.status,
      activityEvidence: evidence.ids.map((activityId) => ({ activityId, evidenceKind: 'reviewed_registered_activity_content', limit: evidence.limit })),
      limitations: [evidence.limit, '官方只列第二學習階段；本批不指定三年級、四年級或學期。', '活動資料中的對應狀態不代表教師審查或學生學習成效。'],
    };
  }),
  boundary: '本批只含 PDF 頁序24／印刷頁20課題3 INf、INg 的第二學習階段10條學習內容；不含課題3第三學習階段、課題4、學習表現或自然科學整份文件清冊。',
  nextWorkPosition: '同一自然科學官方 PDF，接續課題3第三學習階段欄，再核對該表標題、邊界及續頁；不得推定頁碼或代碼。',
};

const socialBatch = {
  schemaVersion: 1,
  batchId: 'social-studies-stage2-bb-environment-difference-pdf-page-100',
  status: 'verified_bounded_official_content_subsection_not_full_document_inventory',
  sourceId: 'social-studies',
  documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－社會領域',
  publicationInfo: '教育部107年9月發布；官方 PDF 封面標示中華民國107年10月。',
  documentVersion: '官方 PDF 封面日期為107年10月；未確認獨立版本標籤，不推定修訂版號。',
  sourceUrl: socialUrl,
  sourceLocation: '伍／二／國民小學學習內容表／B.差異與多元／b.環境差異／第二學習階段欄，PDF頁序100、文件印刷頁碼96。',
  applicability: { learningStage: stage, grade: null, semester: null, gradeApplicabilityStatus: 'official_stage_only_not_individual_grade' },
  reviewMethod: '核對官方 PDF 學習內容表頁序100（印刷頁96）B.差異與多元／b.環境差異／第二學習階段欄 Bb-Ⅱ-1 原文及表格列；未將相鄰階段內容併入。',
  clauses: [{
    code: 'Bb-Ⅱ-1', officialText: '居民的生活空間與生活方式具有地區性的差異。', itemType: 'learning_content', learningStage: stage,
    pdfPageSequence: 100, printedPage: 96,
    sourceLocator: '伍／二／國民小學學習內容表／B.差異與多元／b.環境差異／第二學習階段欄／Bb-Ⅱ-1',
    reviewStatus: 'verified_against_official_pdf_text_and_registered_page_evidence_2026-10-26',
    relatedPerformanceCodes: [], activityIds: [], activityEvidenceStatus: 'uncovered', activityEvidence: [],
    limitations: ['檢視現有社會領域活動未找到直接比較居民生活空間與生活方式之地區差異的任務；不以 Ba-Ⅱ-1 個體觀點活動代替。', '官方只列第二學習階段，不指定個別年級或學期。'],
  }],
  boundary: '本批只登錄 B.差異與多元／b.環境差異中第二學習階段 Bb-Ⅱ-1 一條學習內容；Ba-Ⅱ-1 保留於既有獨立批次，本批不含其他階段或社會領域完整枚舉。',
  nextWorkPosition: '社會領域接續 B.差異與多元／b.環境差異表格下一條，先回查官方 PDF 頁面與列界再擷取。',
};

for (const [file, batch] of [
  ['curriculum/natural-science-stage2-inf-ing-official-content-batch.json', scienceBatch],
  ['curriculum/social-studies-stage2-bb-official-content-batch.json', socialBatch],
]) {
  const existing = fs.existsSync(path.join(root, file)) ? read(file) : null;
  if (existing && existing.batchId !== batch.batchId) throw new Error(`refusing to overwrite unrelated batch ${file}`);
  write(file, batch);
}

const sources = read('curriculum/sources.json');
for (const [sourceId, file, batch] of [
  ['natural-science', 'curriculum/natural-science-stage2-inf-ing-official-content-batch.json', scienceBatch],
  ['social-studies', 'curriculum/social-studies-stage2-bb-official-content-batch.json', socialBatch],
]) {
  const source = sources.sources.find(({ id }) => id === sourceId);
  if (!source) throw new Error(`missing source ${sourceId}`);
  source.verifiedContentBatches ??= [];
  const reference = { batchId: batch.batchId, batchFile: file, status: batch.status, itemType: 'learning_content', learningStage: stage, officialContentRowCount: batch.clauses.length, sourceLocation: batch.sourceLocation, boundary: batch.boundary };
  const index = source.verifiedContentBatches.findIndex(({ batchId }) => batchId === batch.batchId);
  if (index < 0) source.verifiedContentBatches.push(reference); else source.verifiedContentBatches[index] = reference;
  source.verifiedClauses = [...new Set([...(source.verifiedClauses ?? []), ...batch.clauses.map(({ code }) => code)])];
}
write('curriculum/sources.json', sources);

const subitems = read('curriculum/learning-subitem-definitions.json');
const curriculum = read('curriculum/curriculum-map.json');
const ineBatch = read('curriculum/natural-science-stage2-ine-official-content-batch.json');
const definitions = [
  ['SUB-SCIENCE-STAGE2-INe-II-7-MAGNET-POLES', 'INe-Ⅱ-7', '辨認並操作兩磁鐵相對磁極，觀察同極相斥、異極相吸。', 'magnet-poles-and-forces'],
  ['SUB-SCIENCE-STAGE2-INe-II-7-IRON-MATERIALS', 'INe-Ⅱ-7', '將磁鐵移近不同材料，先觀察吸引結果，再依結果分類含鐵物與未受吸引物。', 'test-magnetic-materials'],
  ['SUB-SCIENCE-STAGE2-INe-II-7-STRENGTH-COUNTS', 'INe-Ⅱ-7', '在固定數位情境下比較兩磁鐵可吸起的含鐵物件數量，作為磁力強弱的模擬比較。', 'compare-magnet-strength-counts'],
].map(([subitemId, officialCode, projectSubitem, evidenceStageId]) => ({
  subitemId, focusId: 'science-stage2-ine-ii-7-concepts', subject: 'natural_science', officialCode, officialCodes: [officialCode], officialPerformanceCode: null,
  sourceText: officialCode.startsWith('INe-')
    ? ineBatch.clauses.find(({ code }) => code === officialCode)?.officialText
    : scienceRows.find(([code]) => code === officialCode)?.[1],
  sourceNotes: '完整官方原文保留於 INe 批次；本列為專案拆解，並非官方另列子條文。',
  sourceTextKind: 'verbatim_official_pdf_clause_checked_2026-10-25', sourceRef: { sourceId: 'natural-science', pageOrSection: 'INe-Ⅱ-7，PDF頁序23、印刷頁19。' },
  projectSubitem, decompositionKind: 'project_decomposition_from_verified_official_stage_clause_not_official_subclause',
  activityIds: ['ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE'], evidenceStageIds: [evidenceStageId],
  notCovered: ['真實磁鐵及含鐵材料的操作與觀察。', '實物中磁力強弱的量測、控制變因與教師觀察。'], status: 'candidate_partial_interaction',
}));
for (const definition of definitions) {
  const index = subitems.definitions.findIndex(({ subitemId }) => subitemId === definition.subitemId);
  if (index < 0) subitems.definitions.push(definition); else subitems.definitions[index] = definition;
}
const ensureFocus = ({ code, text, page, batch, sourceId, sourceUrl, subject }) => {
  const id = sourceId === 'natural-science' ? `science-stage2-${code.toLowerCase().replaceAll('Ⅱ', 'ii')}-concepts` : 'social-stage2-bb-ii-1-environment-difference';
  const record = {
    id, subject, focus: `官方條目 ${code} 逐字核對及專案子項追蹤；只記錄官方第二學習階段，不指定年級或學期。`, gradeRange: null, stagePerformanceRange: null,
    learningStage: stage, sourceId, status: 'verified_in_official_guideline_stage_scope', performanceCodes: [], performanceTexts: [], contentCodes: [code], contentTexts: [text],
    contentTextKind: 'verbatim_official_pdf_clause_checked_2026-10-26', sourceUrl, documentTitle: batch.documentTitle, pageOrSection: `${batch.sourceLocation}；PDF頁序${page.sequence}、印刷頁${page.printed}`,
    verifiedClauses: [code], reviewer: '官方 PDF 原始頁面核讀（非教師課程審查）', reviewDate: '2026-10-26', officialTextReviewStatus: 'verified_against_official_text',
    gradeApplicabilityStatus: 'official_stage_only_not_individual_grade', localScheduleStatus: 'not_applicable_without_grade_assignment', teacherProfessionalReviewStatus: 'pending_review',
    notes: '官方表未逐列建立表現代碼關聯；本批不自行推定。官方條目、專案拆解及活動證據分開計數。',
  };
  const allSections = ['verifiedLearningFocuses', 'supplementalVerifiedLearningFocuses', 'pendingLearningFocuses'];
  for (const section of allSections) curriculum[section] ??= [];
  const targetSection = curriculum.verifiedLearningFocuses;
  const found = allSections.flatMap((section) => curriculum[section]).find(({ id: existingId }) => existingId === id);
  if (found) Object.assign(found, record); else targetSection.push(record);
};
for (const [code, text] of scienceRows) {
  ensureFocus({ code, text, page: { sequence: 24, printed: 20 }, batch: scienceBatch, sourceId: 'natural-science', sourceUrl: scienceUrl, subject: 'natural_science' });
}
const socialText = socialBatch.clauses[0].officialText;
ensureFocus({ code: 'Bb-Ⅱ-1', text: socialText, page: { sequence: 100, printed: 96 }, batch: socialBatch, sourceId: 'social-studies', sourceUrl: socialUrl, subject: 'social_studies' });
write('curriculum/learning-subitem-definitions.json', subitems);
write('curriculum/curriculum-map.json', curriculum);
console.log(JSON.stringify({ naturalScience: { batchId: scienceBatch.batchId, rows: scienceRows.length, codes: scienceRows.map(([code]) => code), evidence: Object.fromEntries([...new Set(Object.values(scienceActivityEvidence).map(({ status }) => status))].map((status) => [status, Object.values(scienceActivityEvidence).filter((row) => row.status === status).length])) }, socialStudies: { batchId: socialBatch.batchId, rows: 1, code: 'Bb-Ⅱ-1', activityEvidence: 'uncovered' }, magneticProjectSubitems: definitions.length, repeatSafe: true }, null, 2));
