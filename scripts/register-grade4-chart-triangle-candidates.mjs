import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, data) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
const map = read('curriculum/curriculum-map.json');
const batch = read('curriculum/math-grade4-official-content-batch.json');
const audit = read('curriculum/math-focused-clause-audit.json');
const source = read('curriculum/sources.json').sources.find(({ id }) => id === 'mathematics');
const definitions = read('curriculum/learning-subitem-definitions.json');
if (!source) throw new Error('mathematics_source_missing');
const focusCollections = [map.verifiedLearningFocuses, map.supplementalVerifiedLearningFocuses, map.pendingLearningFocuses].filter(Array.isArray);
const findFocus = (id) => focusCollections.flat().find((focus) => focus.id === id);
const upsertFocus = (record) => {
  const prior = findFocus(record.id);
  if (prior) Object.assign(prior, record);
  else map.pendingLearningFocuses.push(record);
};
const upsertDefinition = (record) => {
  const prior = definitions.definitions.find(({ subitemId }) => subitemId === record.subitemId);
  if (prior) Object.assign(prior, record);
  else definitions.definitions.push(record);
};

const records = [
  {
    code: 'D-4-1', performanceCode: 'd-II-1', focusId: 'math-grade4-data-bar-chart-builder',
    activityId: 'ACT-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE',
    subitemId: 'SUB-MATH-G4-D4-1-BUILD-AND-READ-BAR-CHART-CANDIDATE',
    objective: '將分類資料的各類數量轉成長條高度，並從圖表比較資料。',
    projectSubitem: '在提供的兩組分類資料中，逐類調整長條高度並以新資料重建；再讀取提供的有序折線資料，辨識變化方向。此拆解是專案分析，不是官方新增條文。',
    evidenceStageIds: ['build-favorite-fruit-bars', 'transfer-library-survey-bars', 'read-ordered-weather-change'],
    limitation: '未涵蓋學生自行蒐集資料、正式標題與座標軸刻度設計、真實生活圖表報讀及分類資料與有序變化資料的完整辨析。',
    page: '四年級學習內容表 D-4-1，PDF頁序31；第二學習階段表現 d-II-1，PDF頁序11。',
    status: 'partial',
    reason: '兩組分類資料均需逐類調整長條高度，並另讀折線資料；資料為提供的教學情境，未實地調查。',
  },
  {
    code: 'S-4-7', performanceCode: 's-II-3', focusId: 'math-grade4-special-triangle-construction',
    activityId: 'ACT-G4-MATH-SPECIAL-TRIANGLE-CONSTRUCTION-CANDIDATE',
    subitemId: 'SUB-MATH-G4-S4-7-CLASSIFY-AND-CONSTRUCT-TRIANGLES-CANDIDATE',
    objective: '透過選取格點頂點建構三角形，並依邊或角的性質檢查圖形類別。',
    projectSubitem: '在格點上選三個不共線頂點，建構等腰、直角、銳角與鈍角三角形；以座標向量／平方距離驗證邊長或角分類。此拆解是專案分析，不是官方新增條文。',
    evidenceStageIds: ['construct-isosceles-triangle', 'construct-right-triangle', 'construct-acute-triangle', 'construct-obtuse-triangle'],
    limitation: '未涵蓋正三角形作圖、尺規／量角器實物作圖、自由畫圖與完整性質說明；螢幕格點不等同實物作圖。',
    page: '四年級學習內容表 S-4-7，PDF頁序30；第二學習階段表現 s-II-3，PDF頁序11。',
    status: 'partial',
    reason: '四個階段需選三個格點形成可見三角形，並分別依邊長或角性質分類；未評量實物尺規作圖。',
  },
];

for (const item of records) {
  const clause = batch.clauses.find(({ code }) => code === item.code);
  const performance = audit.learningPerformanceClauses.find(({ code }) => code === item.performanceCode);
  if (!clause || !performance || !clause.officialPerformanceLinks.includes(item.performanceCode)) throw new Error(`official_clause_link_missing:${item.code}`);
  upsertFocus({
    id: item.focusId, subject: 'mathematics', focus: `${item.code}：${clause.officialText} 專案候選活動僅涵蓋所列互動子項。`,
    gradeRange: [4, 4], stagePerformanceRange: [3, 4], sourceId: 'mathematics', status: 'pending_review',
    officialTextReviewStatus: 'verified_against_official_text',
    gradeApplicabilityStatus: 'official_grade_table_4_stage2; semester_and_local_schedule_pending',
    performanceCodes: [item.performanceCode], performanceTexts: [performance.officialText],
    contentCodes: [item.code], contentTexts: [clause.officialText], sourceUrl: source.url,
    documentTitle: batch.documentTitle, pageOrSection: item.page,
    verifiedClauses: [item.code, item.performanceCode], reviewer: 'existing official grade-4 batch and performance record cross-check (not teacher review)',
    reviewDate: '2026-10-24', localScheduleStatus: 'pending_school_and_textbook_evidence',
    teacherProfessionalReviewStatus: 'pending_review', candidateActivityId: item.activityId,
    coverageStatus: 'partial', coverageLimitations: [item.limitation],
  });
  upsertDefinition({
    subitemId: item.subitemId, focusId: item.focusId, subject: 'mathematics', officialCode: item.code,
    officialPerformanceCode: item.performanceCode, sourceText: clause.officialText, officialNotes: clause.officialNotes,
    sourceTextKind: 'verbatim_official_pdf_clause_from_existing_verified_grade4_batch; project subitem is analysis',
    sourceRef: { sourceId: 'mathematics', pageOrSection: item.page }, projectSubitem: item.projectSubitem,
    decompositionKind: 'project_decomposition_from_existing_verified_official_grade4_clause',
    activityIds: [item.activityId], evidenceStageIds: item.evidenceStageIds,
    notCovered: [item.limitation], status: 'candidate_partial_interaction',
  });
  const activityRow = batch.activityAudit.find(({ code }) => code === item.code);
  if (!activityRow) throw new Error(`activity_audit_row_missing:${item.code}`);
  Object.assign(activityRow, { status: item.status, activityIds: [item.activityId], evidenceStageIds: item.evidenceStageIds, reason: item.reason });
}

write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
write('curriculum/math-grade4-official-content-batch.json', batch);
console.log(JSON.stringify({ upsertedFocuses: records.map(({ focusId }) => focusId), upsertedSubitems: records.map(({ subitemId }) => subitemId), auditedCodes: records.map(({ code }) => code) }, null, 2));
