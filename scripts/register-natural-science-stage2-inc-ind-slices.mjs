import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const officialUrl = 'https://stv.naer.edu.tw/data/course_outline/pta_18538_240851_60502.pdf';
const title = '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－自然科學領域';
const publicationInfo = '教育部107年11月2日以臺教授國部字第1070119882B號令發布。';
const stage = '第二學習階段（三、四年級）';
const reviewStatus = 'directly_read_from_downloaded_official_pdf_and_rendered_table_this_turn';

function clause(code, text, page, printedPage, status, activityIds, limitations) {
  return {
    code, officialText: text, itemType: 'learning_content', learningStage: stage,
    pdfPageSequence: page, printedPage,
    sourceLocator: `伍／二／課題${code.startsWith('INc') ? '1 自然界的組成與特性' : '2 自然界的現象、規律及作用'}／${code.startsWith('INc') ? '系統與尺度（INc）' : '改變與穩定（INd）'}第二學習階段欄，${code}列`,
    reviewStatus, activityIds, activityEvidenceStatus: status, limitations,
  };
}

// Correct two legacy page locators after checking the footer in the official
// rendered pages: sequence 19 is printed page 15; sequence 20 is printed 16.
// Keep this migration idempotent because crosswalk validation now requires
// both PDF sequence and printed page for every bounded clause.
for (const correction of [
  { file: 'curriculum/natural-science-stage2-ina-official-content-batch.json', expectedId: 'natural-science-stage2-ina-content-slice-pdf-page-19', pdfPage: 19, printedPage: 15, concept: 'INa' },
  { file: 'curriculum/natural-science-stage2-inb-official-content-batch.json', expectedId: 'natural-science-stage2-inb-content-slice-pdf-page-20', pdfPage: 20, printedPage: 16, concept: 'INb' },
]) {
  const legacyBatch = read(correction.file);
  if (legacyBatch.batchId !== correction.expectedId) throw new Error(`legacy_batch_conflict:${correction.file}:${legacyBatch.batchId}`);
  for (const row of legacyBatch.clauses) {
    if (row.pdfPageSequence !== correction.pdfPage) throw new Error(`legacy_page_sequence_conflict:${row.code}:${row.pdfPageSequence}`);
    row.printedPage = correction.printedPage;
    if (!row.sourceLocator.includes(`印刷頁碼${correction.printedPage}`)) row.sourceLocator = `${row.sourceLocator}；文件印刷頁碼${correction.printedPage}`;
  }
  legacyBatch.sourceLocation = `${legacyBatch.sourceLocation.replace(/文件印刷頁碼\d+/gu, '').trim()} 文件印刷頁碼${correction.printedPage}（官方頁尾影像核對）。`;
  legacyBatch.pageImageLocatorCorrection = `${correction.concept} PDF頁序${correction.pdfPage}之官方頁尾為印刷頁碼${correction.printedPage}；修正先前來源定位記錄。`;
  write(correction.file, legacyBatch);
}

const incClauses = [
  clause('INc-Ⅱ-1', '使用工具或自訂參考標準可量度與比較。', 20, 16, 'relation_only', ['ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE'], ['豆苗活動只操作既有模擬讀值與數線標記，沒有讓學生選擇工具或參考標準並實際量度、比較。']),
  clause('INc-Ⅱ-2', '生活中常見的測量單位與度量。', 20, 16, 'relation_only', ['ACT-G4-SCIENCE-WEATHER-RECORD-BOARD-CANDIDATE'], ['天氣資料板只分類預先提供的單位資料，未把常見單位與實際度量作為學習目標；數據為虛構。']),
  clause('INc-Ⅱ-3', '力的表示法，包括大小、方向與作用點等。', 20, 16, 'uncovered', [], ['目前自然科學活動未提供學生操作力的大小、方向及作用點表示。']),
  clause('INc-Ⅱ-4', '方向、距離可用以表示物體位置。', 20, 16, 'uncovered', [], ['目前自然科學活動未提供以方向和距離定位物體的操作。']),
  clause('INc-Ⅱ-5', '水和空氣可以傳送動力讓物體移動。', 20, 16, 'uncovered', [], ['未找到水或空氣傳送動力使物體移動的自然科學互動；其他學科的運算或圖表活動不替代此內容。']),
  clause('INc-Ⅱ-6', '水有三態變化及毛細現象。', 20, 16, 'uncovered', [], ['未找到水三態變化或毛細現象的具體互動證據；數位模型亦不能替代實驗觀察。']),
  clause('INc-Ⅱ-7', '利用適當的工具觀察不同大小、距離位置的物體。', 20, 16, 'relation_only', ['ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE'], ['豆苗活動在數線標記已給定的模擬高度，沒有選用工具觀察不同大小或距離位置的物體。']),
  clause('INc-Ⅱ-8', '不同的環境有不同的生物生存。', 20, 16, 'uncovered', [], ['現有動植物活動未操作環境差異與生物生存關係。']),
  clause('INc-Ⅱ-9', '地表具有岩石、砂、土壤等不同環境，各有特徵，可以分辨。', 21, 17, 'relation_only', ['ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE'], ['材料分類活動只使用模擬吸水資料，沒有辨識岩石、砂與土壤的特徵或實地觀察。']),
  clause('INc-Ⅱ-10', '天空中天體有東升西落的現象，月亮有盈虧的變化，星星則是有些亮有些暗。', 21, 17, 'uncovered', [], ['未找到涵蓋日行現象、月相變化及星星明暗的天文觀察活動；不得以靜態文字題替代長期觀察。']),
];

const indClauses = [
  clause('INd-Ⅱ-1', '當受外在因素作用時，物質或自然現象可能會改變。改變有些較快、有些較慢；有些可以回復，有些則不能。', 21, 17, 'relation_only', ['ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE'], ['豆苗模擬紀錄呈現隨時間改變的高度，但沒有比較外在因素、改變快慢或可逆／不可逆。']),
  clause('INd-Ⅱ-2', '物質或自然現象的改變情形，可以運用測量的工具和方法得知。', 21, 17, 'partial', ['ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE'], ['學生排序預先提供的模擬測量紀錄並把標記放到高度數線；沒有實際操作尺具、種植或自行收集測量資料。']),
  clause('INd-Ⅱ-3', '生物從出生、成長到死亡有一定的壽命，透過生殖繁衍下一代。', 21, 17, 'uncovered', [], ['未找到實際涵蓋生物生命歷程及生殖繁衍關係的互動。']),
  clause('INd-Ⅱ-4', '空氣流動產生風。', 22, 18, 'relation_only', ['ACT-G4-SCIENCE-WEATHER-RECORD-BOARD-CANDIDATE'], ['天氣資料板可分類風向資料，但沒有操作空氣流動如何產生風的因果模型或觀察。']),
  clause('INd-Ⅱ-5', '自然環境中有砂石及土壤，會因水流、風而發生改變。', 22, 18, 'uncovered', [], ['未找到水流或風改變砂石、土壤的觀察或模型活動。']),
  clause('INd-Ⅱ-6', '一年四季氣溫會有所變化，天氣也會有所不同。', 22, 18, 'relation_only', ['ACT-G4-SCIENCE-WEATHER-DATA-STATION-CANDIDATE'], ['活動只有少數虛構日期資料，未比較四季氣溫或天氣差異，不能推作季節結論。']),
  clause('INd-Ⅱ-7', '氣象報告可以讓我們知道天氣的可能變化。', 22, 18, 'relation_only', ['ACT-G4-SCIENCE-WEATHER-DATA-STATION-CANDIDATE'], ['現有活動整理有限的虛構觀測資料，未閱讀氣象報告或推估可能變化。']),
  clause('INd-Ⅱ-8', '天氣預報常用雨量、溫度、風向、風速等資料來表達天氣狀態，這些資料可以使用適當儀器測得。', 22, 18, 'partial', ['ACT-G4-SCIENCE-WEATHER-RECORD-BOARD-CANDIDATE'], ['資料板可分類雨量、溫度及風向紀錄並選取受資料支持的敘述；未涵蓋風速、天氣預報、儀器操作與實測。']),
  clause('INd-Ⅱ-9', '力有各種不同的形式。施力可能會使物體改變運動情形或形狀；當物體受力變形時，有的可恢復原狀，有的不能恢復原狀。', 22, 18, 'uncovered', [], ['未找到學生實際比較不同力的形式、運動／形狀改變及恢復原狀情形的活動。']),
];

function makeBatch(id, concept, start, end, startPrinted, endPrinted, clauses, boundary, next) {
  return {
    schemaVersion: 1,
    batchId: id,
    status: 'verified_bounded_official_content_subsection_not_full_document_inventory',
    sourceId: 'natural-science', documentTitle: title, publicationInfo, sourceUrl: officialUrl,
    documentVersion: '來源 PDF 未確認獨立版本標籤；保留文件標題及教育部發布日期／文號，不推定版本名稱。',
    sourceLocation: `伍／二／${concept === 'INc' ? '課題1 自然界的組成與特性／系統與尺度（INc）' : '課題2 自然界的現象、規律及作用／改變與穩定（INd）'}第二學習階段欄，PDF頁序${start}–${end}，文件印刷頁碼${startPrinted}–${endPrinted}。`,
    applicability: { learningStage: stage, grade: null, semester: null },
    reviewMethod: `下載官方來源 PDF 後，以版面影像直接核對表格標題、第二學習階段欄、跨頁續文及頁尾印刷頁碼；逐列抄錄${concept}-Ⅱ 條文並與 PDF 文字擷取交叉檢視。活動狀態依已註冊任務的互動步驟判定，不以活動名稱推斷；未將階段指定為單一年級或學期。`,
    clauses, boundary, nextWorkPosition: next,
  };
}

const batches = [
  makeBatch('natural-science-stage2-inc-content-slice-pdf-pages-20-21', 'INc', 20, 21, 16, 17, incClauses,
    '本批只涵蓋課題1「系統與尺度（INc）」第二學習階段10條學習內容；不包含第三學習階段欄或自然科學完整清冊。頁序20列INc-II-1至8，頁序21續列INc-II-9至10。',
    'INc第二學習階段已逐列核讀；接續同一官方文件課題2「改變與穩定（INd）」第二學習階段欄，先核定完整跨頁邊界。'),
  makeBatch('natural-science-stage2-ind-content-slice-pdf-pages-21-22', 'INd', 21, 22, 17, 18, indClauses,
    '本批只涵蓋課題2「改變與穩定（INd）」第二學習階段9條學習內容；不包含第三學習階段欄或自然科學完整清冊。頁序21列INd-II-1至3，頁序22續列INd-II-4至9。',
    'INd第二學習階段已逐列核讀；下一個同文件待核工作為課題2下一跨科概念 INe「交互作用」第二學習階段欄，需先檢查其表格起訖、續頁及頁尾定位。'),
];

for (const batch of batches) {
  const canonicalFile = batch.batchId.includes('inc')
    ? 'curriculum/natural-science-stage2-inc-official-content-batch.json'
    : 'curriculum/natural-science-stage2-ind-official-content-batch.json';
  const existing = fs.existsSync(path.join(root, canonicalFile)) ? read(canonicalFile) : null;
  if (existing && existing.batchId !== batch.batchId) throw new Error(`existing_batch_conflict:${canonicalFile}:${existing.batchId}`);
  write(canonicalFile, batch);
}

const sources = read('curriculum/sources.json');
const curriculumMap = read('curriculum/curriculum-map.json');
const subitems = read('curriculum/learning-subitem-definitions.json');
const preexistingSubitemIds = new Set(subitems.definitions.map((definition) => definition.subitemId));
const source = sources.sources.find((item) => item.id === 'natural-science');
if (!source) throw new Error('missing_natural_science_source');
source.verifiedContentBatches ??= [];
source.verifiedClauses ??= [];
for (const batch of batches) {
  const batchFile = batch.batchId.includes('inc')
    ? 'curriculum/natural-science-stage2-inc-official-content-batch.json'
    : 'curriculum/natural-science-stage2-ind-official-content-batch.json';
  const ref = { batchId: batch.batchId, batchFile, status: batch.status, officialContentRowCount: batch.clauses.length, itemType: 'learning_content', learningStage: stage, sourceLocation: batch.sourceLocation, sourceUrl: officialUrl, boundary: batch.boundary };
  if (!source.verifiedContentBatches.some((entry) => entry.batchId === batch.batchId)) source.verifiedContentBatches.push(ref);
  for (const row of batch.clauses) if (!source.verifiedClauses.includes(row.code)) source.verifiedClauses.push(row.code);
}
const note = '2026-10-25以官方 PDF 版面影像逐條核讀課題1「系統與尺度（INc）」第二學習階段10列（PDF頁序20–21，印刷頁16–17）及課題2「改變與穩定（INd）」第二學習階段9列（PDF頁序21–22，印刷頁17–18）；此為兩個明確小節批次，不代表自然科學領綱完整清冊。';
if (!source.notes.includes(note)) source.notes = `${source.notes} ${note}`;
const locatorCorrectionNote = '官方 PDF 頁尾影像重新核對後，將 INa PDF頁序19的印刷頁碼補為15，並將 INb PDF頁序20的錯記印刷頁17修正為16；INb、INc在同一PDF頁序20，印刷頁16。';
if (!source.notes.includes(locatorCorrectionNote)) source.notes = `${source.notes} ${locatorCorrectionNote}`;
write('curriculum/sources.json', sources);

// Only clauses with several distinguishable concepts are decomposed here. These
// project subitems are inventory/planning records, not additional official rows
// and they intentionally carry no activity evidence.
const splitConcepts = [
  { code: 'INc-Ⅱ-3', concepts: [
    ['force-magnitude', '力的大小表示'], ['force-direction', '力的方向表示'], ['force-point', '力的作用點表示'],
  ] },
  { code: 'INc-Ⅱ-10', concepts: [
    ['celestial-daily-motion', '觀察天體東升西落現象'], ['moon-phase-change', '觀察月亮盈虧變化'], ['star-brightness', '比較星星明暗差異'],
  ] },
  { code: 'INd-Ⅱ-1', concepts: [
    ['external-factor-change', '辨認外在因素作用後的改變'], ['change-rate', '比較改變快慢'], ['reversibility', '區分可以回復與不能回復的改變'],
  ] },
  { code: 'INd-Ⅱ-8', concepts: [
    ['forecast-data-fields', '辨識雨量、溫度、風向與風速等天氣資料欄位'], ['instrument-measurement', '理解資料可由適當儀器測得'],
  ] },
  { code: 'INd-Ⅱ-9', concepts: [
    ['force-forms', '辨認不同形式的力'], ['force-motion-shape-effect', '觀察施力對運動或形狀的影響'], ['elasticity-recovery', '比較受力後可恢復與不能恢復原狀'],
  ] },
];
for (const { code, concepts } of splitConcepts) {
  const batch = batches.find((item) => item.clauses.some((row) => row.code === code));
  const row = batch.clauses.find((item) => item.code === code);
  const focusId = `science-stage2-${code.toLowerCase().replaceAll('Ⅱ', 'ii').replaceAll('-', '-')}-concepts`;
  const focusRecord = {
    id: focusId, subject: 'natural_science', focus: `官方條目 ${code} 的專案概念拆解；保留原文及第二學習階段範圍，尚無對應遊戲操作。`,
    gradeRange: null, stagePerformanceRange: null, learningStage: stage,
    sourceId: 'natural-science', status: 'verified_in_official_guideline_stage_scope',
    performanceCodes: [], performanceTexts: [], contentCodes: [code], contentTexts: [row.officialText],
    sourceUrl: officialUrl, documentTitle: `${title}（${publicationInfo}）`,
    pageOrSection: `${row.sourceLocator}；PDF頁序${row.pdfPageSequence}，印刷頁${row.printedPage}`,
    verifiedClauses: [code], reviewer: '官方 PDF 原始頁面核讀（非教師課程審查）', reviewDate: '2026-10-25',
    officialTextReviewStatus: 'verified_against_official_text', gradeApplicabilityStatus: 'official_stage_only_not_individual_grade',
    localScheduleStatus: 'pending_school_and_textbook_evidence', teacherProfessionalReviewStatus: 'pending_review',
    notes: '此為專案拆解焦點，不是新增官方子條文；該官方跨科概念表未在本列明示學習表現關聯，未自行補配表現代碼。無活動互動證據。',
  };
  const existingFocus = curriculumMap.verifiedLearningFocuses.find((focus) => focus.id === focusId);
  if (existingFocus) Object.assign(existingFocus, focusRecord);
  else curriculumMap.verifiedLearningFocuses.push(focusRecord);
  for (const [suffix, projectSubitem] of concepts) {
    const subitemId = `SUB-SCIENCE-STAGE2-${code.replaceAll('Ⅱ', 'II').replaceAll('-', '-')}-${suffix.toUpperCase()}`;
    if (subitems.definitions.some((definition) => definition.subitemId === subitemId)) continue;
    subitems.definitions.push({
      subitemId, focusId, subject: 'natural_science', officialCode: code,
      sourceText: row.officialText, sourceTextKind: 'verbatim_official_pdf_clause_checked_2026-10-25; project decomposition is not an official subclause',
      sourceRef: { sourceId: 'natural-science', pageOrSection: `${row.sourceLocator}；PDF頁序${row.pdfPageSequence}，印刷頁${row.printedPage}` },
      projectSubitem: `${projectSubitem}。此為追蹤用專案拆解，尚未有活動或互動證據。`,
      decompositionKind: 'project_decomposition_from_verified_official_stage_clause_not_official_subclause',
      activityIds: [], evidenceStageIds: [], status: 'inventory_only_not_implemented',
    });
  }
}
write('curriculum/curriculum-map.json', curriculumMap);
write('curriculum/learning-subitem-definitions.json', subitems);

const addedSubitemDefinitionCount = subitems.definitions.filter((definition) => !preexistingSubitemIds.has(definition.subitemId)).length;
console.log(JSON.stringify({ batches: batches.map((batch) => ({ batchId: batch.batchId, rowCount: batch.clauses.length, statusCounts: batch.clauses.reduce((counts, row) => (counts[row.activityEvidenceStatus] = (counts[row.activityEvidenceStatus] ?? 0) + 1, counts), {}) })), projectSubitemDefinitionsAddedThisRun: addedSubitemDefinitionCount, projectSubitemDefinitionsRegisteredInTheseBatches: splitConcepts.reduce((sum, item) => sum + item.concepts.length, 0), repeatSafe: true }, null, 2));
