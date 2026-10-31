import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(ROOT, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const stage = '第二學習階段（官方課綱所列三、四年級；未指定個別年級或學期）';
const scienceSourceUrl = 'https://stv.naer.edu.tw/data/course_outline/pta_18538_240851_60502.pdf';
const socialSourceUrl = 'https://stv.naer.edu.tw/data/course_outline/pta_18535_6408773_60398.pdf';
const scienceText = [
  '自然界的物體、生物、環境間常會相互影響。',
  '溫度會影響物質在水中溶解的程度（定性）及物質燃燒、生鏽、發酵等現象。',
  '有些物質溶於水中，有些物質不容易溶於水中。',
  '常見食物的酸鹼性有時可利用氣味、觸覺、味覺簡單區分，花卉、菜葉會因接觸到酸鹼而改變顏色。',
  '生活周遭有各種的聲音；物體振動會產生聲音，聲音可以透過固體、液體、氣體傳播。不同的動物會發出不同的聲音，並且作為溝通的方式。',
  '光線以直線前進，反射時有一定的方向。',
  '磁鐵具有兩極，同極相斥，異極相吸；磁鐵會吸引含鐵的物體。磁力強弱可由吸起含鐵物質數量多寡得知。',
  '物質可分為電的良導體和不良導體，將電池用電線或良導體接成通路，可使燈泡發光、馬達轉動。',
  '電池或燈泡可以有串聯和並聯的接法，不同的接法會產生不同的效果。',
  '動物的感覺器官接受外界刺激會引起生理和行為反應。',
  '環境的變化會影響植物生長。',
];
const scienceActivity = [
  { ids: ['ACT-G3-SCIENCE-ANIMAL-EVIDENCE-ATLAS-CANDIDATE', 'ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE'], status: 'relation_only', limitation: '既有活動整理動植物形態或預先提供的成長紀錄，未操作物體、生物與環境之間的相互影響。' },
  { ids: ['ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE'], status: 'relation_only', limitation: '既有活動比較水滴吸收資料，沒有操控溫度或觀察溶解、燃燒、生鏽、發酵。' },
  { ids: ['ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE'], status: 'relation_only', limitation: '既有材料分類依水滴吸收紀錄，不是比較物質在水中的溶解情形。' },
  { ids: [], status: 'uncovered', limitation: '沒有適當活動支持安全地辨認食物酸鹼，或觀察花葉接觸酸鹼後變色；不得以文字選項冒充感官或實驗操作。' },
  { ids: [], status: 'uncovered', limitation: '沒有操作物體振動、固液氣傳聲或動物聲音溝通的活動；本專案未提供聲音輸入／聽力評量證據。' },
  { ids: [], status: 'uncovered', limitation: '沒有操作光線直線前進或鏡面反射方向的活動；角度遊戲不等同光學探究。' },
  { ids: [], status: 'uncovered', limitation: '沒有實際操作磁極、含鐵物吸引或以吸起物件數量比較磁力的活動。' },
  { ids: ['ACT-G6-SCIENCE-ENERGY-TRANSFER-MODEL-CANDIDATE'], status: 'relation_only', limitation: '既有能量路徑卡只呈現電池至燈泡輸出，未建構導體／不良導體電路，也未接線點亮燈泡或馬達。' },
  { ids: ['ACT-G6-SCIENCE-ENERGY-TRANSFER-MODEL-CANDIDATE'], status: 'relation_only', limitation: '既有能量卡沒有操作或比較電池／燈泡的串聯、並聯接法與效果。' },
  { ids: ['ACT-G6-SCIENCE-ANIMAL-STRUCTURE-MOVEMENT-EVIDENCE-CANDIDATE'], status: 'relation_only', limitation: '既有活動比對動物構造與移動線索，未操作感覺器官接受刺激後的生理或行為反應。' },
  { ids: ['ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE'], status: 'relation_only', limitation: '既有活動排序預先提供的豆苗高度並標記時間，未比較環境條件或證明環境變化造成生長差異。' },
];
const scienceCodes = scienceText.map((_, index) => `INe-Ⅱ-${index + 1}`);
const scienceBatchId = 'natural-science-stage2-ine-content-slice-pdf-pages-23-24';
const scienceBatch = {
  schemaVersion: 1,
  batchId: scienceBatchId,
  status: 'verified_bounded_official_content_subsection_not_full_document_inventory',
  sourceId: 'natural-science',
  documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－自然科學領域',
  publicationInfo: '教育部107年11月2日以臺教授國部字第1070119882B號令發布。',
  documentVersion: '官方 PDF 封面標示中華民國107年11月；未確認獨立版本標籤，不推定修訂版號。',
  sourceUrl: scienceSourceUrl,
  sourceLocation: '伍／二／課題2 自然界的現象、規律及作用／交互作用（INe）第二學習階段欄，PDF頁序23–24、文件印刷頁碼19–20。',
  applicability: { learningStage: stage, grade: null, semester: null, gradeApplicabilityStatus: 'official_stage_only_not_individual_grade' },
  reviewMethod: '下載現行登錄的國教院官方 PDF，逐頁目視核對課題標題、第二學習階段欄、INe-Ⅱ-11 跨頁續文及頁尾印刷頁碼，再與 PDF 文字擷取交叉檢查。未把學習階段拆成指定年級或學期。',
  relatedPerformanceCodes: [],
  performanceLinkStatus: '官方學習內容表未逐列明示學習表現代碼；本批不自行推定關聯。',
  clauses: scienceText.map((officialText, index) => {
    const code = scienceCodes[index];
    const evidence = scienceActivity[index];
    const page = code === 'INe-Ⅱ-11' ? 24 : 23;
    return {
      code, officialText, itemType: 'learning_content', learningStage: stage,
      pdfPageSequence: page, printedPage: page === 23 ? 19 : 20,
      sourceLocator: `伍／二／課題2「自然界的現象、規律及作用」／交互作用（INe）第二學習階段欄，${code}${code === 'INe-Ⅱ-11' ? '；條文跨頁，頁序23起、24頁首續完' : ''}`,
      reviewStatus: 'verified_against_official_pdf_and_rendered_table_2026-10-25',
      relatedPerformanceCodes: [], activityIds: evidence.ids,
      activityEvidenceStatus: evidence.status,
      activityEvidence: evidence.ids.map((activityId) => ({ activityId, evidenceKind: 'reviewed_registered_activity_content', limit: evidence.limitation })),
      limitations: [evidence.limitation],
    };
  }),
  boundary: '本批僅含課題2「交互作用（INe）」第二學習階段11條學習內容；不含第三學習階段欄與其他小節，不代表自然科學文件完整清冊。INe-Ⅱ-11 在頁序23末起句並於頁序24頁首續完。',
  nextWorkPosition: '同一官方 PDF 課題3「自然界的永續發展」之第二學習階段欄；先確認 INf、INg 各表起訖與跨頁邊界，再逐列核讀。',
};

const socialBatchId = 'social-studies-stage2-ba-a-individual-difference-pdf-page-100';
const socialBatch = {
  schemaVersion: 1,
  batchId: socialBatchId,
  status: 'verified_bounded_official_content_subsection_not_full_document_inventory',
  sourceId: 'social-studies',
  documentTitle: '十二年國民基本教育課程綱要國民中小學暨普通型高級中等學校－社會領域',
  publicationInfo: '沿用來源登錄：教育部107年9月發布；官方 PDF 封面標示中華民國107年10月。',
  documentVersion: '官方 PDF 封面日期為107年10月；未確認獨立版本標籤，不推定修訂版號。',
  sourceUrl: socialSourceUrl,
  sourceLocation: '伍／二／國民小學學習內容表／B.差異與多元／a.個體差異／第二學習階段欄，PDF頁序100、文件印刷頁碼96。',
  applicability: { learningStage: '第二學習階段（官方課綱所列三、四年級；未指定個別年級或學期）', grade: null, semester: null, gradeApplicabilityStatus: 'official_stage_only_not_individual_grade' },
  reviewMethod: '下載官方社會領域 PDF，目視核對印刷頁96的 B.差異與多元／a.個體差異表格中第二學習階段的 Ba-Ⅱ-1 原文與條目邊界，並檢查同頁第三學習階段條目以免跨階段混錄。',
  clauses: [{
    code: 'Ba-Ⅱ-1',
    officialText: '人們對社會事物的認識、感受與意見有相同之處，亦有差異性。',
    itemType: 'learning_content',
    learningStage: '第二學習階段（官方課綱所列三、四年級；未指定個別年級或學期）',
    pdfPageSequence: 100,
    printedPage: 96,
    sourceLocator: '伍／二／國民小學學習內容表／B.差異與多元／a.個體差異／第二學習階段欄／Ba-Ⅱ-1。',
    reviewStatus: 'verified_against_official_pdf_and_rendered_table_2026-10-25',
    relatedPerformanceCodes: [],
    activityIds: ['ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS-CANDIDATE'],
    activityEvidenceStatus: 'partial',
    activityEvidence: [{ activityId: 'ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS-CANDIDATE', stageIds: ['compare-shared-and-different-viewpoints'], evidenceKind: 'candidate_interaction_compares_explicitly_stated_viewpoint_pairs', browserAcceptanceReport: 'artifacts/social-ba2-browser-acceptance-20261025/acceptance-report.json', browserAcceptanceStatus: 'passed_three_viewports_this_turn' }],
    limitations: ['僅以虛構角色語句分類相同核心需要與不同請求；未評量真實觀點形成原因、訪談、口語協商或公共決策。', '官方適用範圍是學習階段，未證明四年級特定學期或校本課程順序。', '候選互動尚待教師審查，不是學生學習成效證據。'],
  }],
  boundary: '本批只逐條登錄 B.差異與多元／a.個體差異中第二學習階段的一條官方學習內容 Ba-Ⅱ-1；不含同表第三學習階段，也不代表社會領域文件完整清冊。',
  nextWorkPosition: '社會領域下一個有界範圍：B.差異與多元／b.環境差異／第二學習階段 Bb-Ⅱ-1；重新核對表格及印刷頁碼後再登錄。',
};

const splitRows = [
  ['INe-Ⅱ-1', '自然界物體、生物與環境相互影響'],
  ['INe-Ⅱ-2', '溫度對物質在水中溶解程度的影響', '溫度對燃燒、生鏽、發酵等現象的影響'],
  ['INe-Ⅱ-3', '物質在水中容易溶解與不易溶解的比較'],
  ['INe-Ⅱ-4', '以感官簡單區分常見食物酸鹼性', '花卉或菜葉接觸酸鹼後的顏色變化'],
  ['INe-Ⅱ-5', '物體振動產生聲音', '聲音透過固體、液體、氣體傳播', '不同動物聲音作為溝通方式'],
  ['INe-Ⅱ-6', '光線直線前進', '光反射的方向'],
  ['INe-Ⅱ-7', '磁鐵兩極同極相斥、異極相吸及吸引含鐵物體', '以吸起含鐵物質數量比較磁力強弱'],
  ['INe-Ⅱ-8', '電的良導體與不良導體', '以電池、導線和良導體接通電路，使燈泡發光或馬達轉動'],
  ['INe-Ⅱ-9', '電池或燈泡串聯、並聯接法及不同效果'],
  ['INe-Ⅱ-10', '動物感覺器官接受刺激後的生理與行為反應'],
  ['INe-Ⅱ-11', '環境變化對植物生長的影響'],
];
const scienceSubitems = splitRows.flatMap(([code, ...concepts]) => concepts.map((text, index) => ({
  subitemId: `SUB-SCIENCE-STAGE2-${code.replaceAll('Ⅱ', 'II').replaceAll('-', '-')}-PROJECT-${index + 1}`,
  focusId: `science-stage2-${code.toLowerCase().replaceAll('Ⅱ', 'ii')}-concepts`,
  subject: 'natural_science', officialCode: code, officialCodes: [code], officialPerformanceCode: null,
  sourceText: scienceText[Number(code.split('-').at(-1)) - 1], sourceNotes: '官方條目完整原文保留於 bounded batch；此句是便於追蹤教學範圍的專案拆解，不是官方子條文。',
  sourceTextKind: 'verbatim_official_pdf_clause_checked_2026-10-25',
  sourceRef: { sourceId: 'natural-science', pageOrSection: `INe 第二學習階段 ${code}；PDF頁序${Number(code.split('-').at(-1)) === 11 ? '23–24' : '23'}；印刷頁${Number(code.split('-').at(-1)) === 11 ? '19–20' : '19'}` },
  projectSubitem: text, decompositionKind: 'project_decomposition_from_verified_official_stage_clause_not_official_subclause',
  activityIds: [], evidenceStageIds: [], notCovered: ['尚無此專案拆解的直接互動證據；需要時應使用可靠觀察材料或實體器材。'],
  status: 'inventory_only_not_implemented',
})));
const socialSubitem = {
  subitemId: 'SUB-SOCIAL-STAGE2-BA2-1-COMMONALITY-DIFFERENCE-CANDIDATE',
  focusId: 'social-grade4-perspective-compare', subject: 'social_studies', officialCode: 'Ba-Ⅱ-1', officialCodes: ['Ba-Ⅱ-1'], officialPerformanceCode: null,
  sourceText: '人們對社會事物的認識、感受與意見有相同之處，亦有差異性。',
  sourceNotes: '逐字核對社會領域官方 PDF 印刷頁96、PDF頁序100；此專案拆解不表示官方細分子條文。',
  sourceTextKind: 'verbatim_official_pdf_clause_checked_2026-10-25',
  sourceRef: { sourceId: 'social-studies', pageOrSection: '伍／二／國民小學學習內容表／B.差異與多元／a.個體差異／Ba-Ⅱ-1，PDF頁序100、印刷頁96。' },
  projectSubitem: '依兩位虛構人物明說的需求，分類其中核心需要相同或主要請求不同，並回到文字證據檢查判斷。',
  decompositionKind: 'project_decomposition_from_verified_official_clause_not_official_subclause',
  activityIds: ['ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS-CANDIDATE'],
  evidenceStageIds: ['compare-shared-and-different-viewpoints'],
  notCovered: ['真實居民訪談、觀點成因、口語協商、公共決策與教師觀察。'],
  status: 'candidate_partial_interaction',
};

const sourceInventory = read('curriculum/sources.json');
const existingScienceSource = sourceInventory.sources.find((source) => source.id === 'natural-science');
const existingSocialSource = sourceInventory.sources.find((source) => source.id === 'social-studies');
if (!existingScienceSource || !existingSocialSource) throw new Error('expected existing natural-science and social-studies sources');
for (const [source, batch, filename] of [[existingScienceSource, scienceBatch, 'curriculum/natural-science-stage2-ine-official-content-batch.json'], [existingSocialSource, socialBatch, 'curriculum/social-studies-stage2-ba-official-content-batch.json']]) {
  if (!source.verifiedContentBatches) source.verifiedContentBatches = [];
  const ref = { batchId: batch.batchId, batchFile: filename, status: batch.status, itemType: 'learning_content', learningStage: batch.applicability.learningStage, officialContentRowCount: batch.clauses.length, sourceLocation: batch.sourceLocation, boundary: batch.boundary };
  const index = source.verifiedContentBatches.findIndex((item) => item.batchId === batch.batchId);
  if (index >= 0) source.verifiedContentBatches[index] = ref; else source.verifiedContentBatches.push(ref);
  source.verifiedClauses = [...new Set([...(source.verifiedClauses ?? []), ...batch.clauses.map((clause) => clause.code)])];
}
const subitems = read('curriculum/learning-subitem-definitions.json');
const curriculumMap = read('curriculum/curriculum-map.json');
const scienceFocusIds = [];
for (const [index, code] of scienceCodes.entries()) {
  const focusId = `science-stage2-${code.toLowerCase().replaceAll('Ⅱ', 'ii')}-concepts`;
  scienceFocusIds.push(focusId);
  const focusRecord = {
    id: focusId,
    subject: 'natural_science',
    focus: `官方條目 ${code} 的逐字核對與專案子項追蹤；本條只標示第二學習階段，不指定年級或學期。`,
    gradeRange: null,
    stagePerformanceRange: null,
    learningStage: stage,
    sourceId: 'natural-science',
    status: 'verified_in_official_guideline_stage_scope',
    performanceCodes: [],
    performanceTexts: [],
    contentCodes: [code],
    contentTexts: [scienceText[index]],
    contentTextKind: 'verbatim_official_pdf_clause_checked_2026-10-25',
    sourceUrl: scienceSourceUrl,
    documentTitle: `${scienceBatch.documentTitle}（${scienceBatch.publicationInfo}）`,
    pageOrSection: `${scienceBatch.clauses[index].sourceLocator}；PDF頁序${scienceBatch.clauses[index].pdfPageSequence}，印刷頁${scienceBatch.clauses[index].printedPage}`,
    verifiedClauses: [code],
    reviewer: '官方 PDF 原始頁面核讀（非教師課程審查）',
    reviewDate: '2026-10-25',
    officialTextReviewStatus: 'verified_against_official_text',
    gradeApplicabilityStatus: 'official_stage_only_not_individual_grade',
    localScheduleStatus: 'not_applicable_without_grade_assignment',
    teacherProfessionalReviewStatus: 'pending_review',
    notes: '學習表現關聯未由本表逐列明示，因此不自行補配；專案拆解和官方條目分開計數。',
  };
  const parentSection = curriculumMap.verifiedLearningFocuses;
  const existingFocus = parentSection.find((focus) => focus.id === focusId);
  if (existingFocus) Object.assign(existingFocus, focusRecord); else parentSection.push(focusRecord);
}
for (const definition of [...scienceSubitems, socialSubitem]) {
  const index = subitems.definitions.findIndex((item) => item.subitemId === definition.subitemId);
  if (index >= 0) subitems.definitions[index] = definition; else subitems.definitions.push(definition);
}
const socialFocus = ['verifiedLearningFocuses', 'supplementalVerifiedLearningFocuses', 'pendingLearningFocuses']
  .flatMap((section) => curriculumMap[section] ?? [])
  .find((focus) => focus.id === 'social-grade4-perspective-compare');
if (!socialFocus) throw new Error('missing existing Ba-II-1 project focus');
socialFocus.focus = '第二學習階段 Ba-Ⅱ-1 候選局部對照：新增比較兩組虛構人物語句中相同核心需要與不同請求的操作；不涵蓋真實訪談、觀點成因或公共決策實踐。';
socialFocus.coverageLimitations = ['僅操作虛構角色語句分類；不評量真實居民訪談、觀點形成原因、口語協商或公共決策。', '官方階段範圍未指定四年級特定學期或校本進度。', '候選活動及工程測試不構成教師審查或學生學習成效。'];

const scienceFile = 'curriculum/natural-science-stage2-ine-official-content-batch.json';
const socialFile = 'curriculum/social-studies-stage2-ba-official-content-batch.json';
write(scienceFile, scienceBatch);
write(socialFile, socialBatch);
write('curriculum/sources.json', sourceInventory);
write('curriculum/learning-subitem-definitions.json', subitems);
write('curriculum/curriculum-map.json', curriculumMap);
console.log(JSON.stringify({ ine: { batchId: scienceBatchId, officialRows: scienceBatch.clauses.length, statusCounts: Object.fromEntries([...new Set(scienceBatch.clauses.map(({ activityEvidenceStatus }) => activityEvidenceStatus))].map((status) => [status, scienceBatch.clauses.filter((item) => item.activityEvidenceStatus === status).length])) }, social: { batchId: socialBatchId, officialRows: socialBatch.clauses.length, status: socialBatch.clauses[0].activityEvidenceStatus }, projectSubitemDefinitionsAdded: scienceSubitems.length + 1, repeatSafe: true }, null, 2));
