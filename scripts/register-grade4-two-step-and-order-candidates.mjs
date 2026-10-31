import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const map = read('curriculum/curriculum-map.json');
const batch = read('curriculum/math-grade4-official-content-batch.json');
const definitions = read('curriculum/learning-subitem-definitions.json');

const focusCollections = [map.verifiedLearningFocuses, map.supplementalVerifiedLearningFocuses, map.pendingLearningFocuses].filter(Array.isArray);
const n4Focus = focusCollections.flat().find(({ id }) => id === 'math-grade4-multiplicative-two-step');
if (!n4Focus) throw new Error('n4_3_focus_missing');
n4Focus.focus = '四年級學習內容 N-4-3：乘除或連除的兩步驟應用問題；本候選活動以陣列、算式組合及等分除／包含除中間結果操作，仍未涵蓋餘數與完整題型。';
n4Focus.notes = '保留 n-II-5 對應；活動未評量併式及運算約定，不掛 r-II-3。官方內容頁序28，第二學習階段表現頁序12；不推定學期。';
n4Focus.coverageStatus = 'partial';
n4Focus.coverageLimitations = ['目前以螢幕陣列、算式片段與整除情境呈現有限子項；未涵蓋餘數或廣泛策略。', '遊戲互動不構成教師認可或學生掌握證據。'];

const r4Focus = {
  id: 'math-grade4-compound-expression-order',
  subject: 'mathematics',
  focus: '四年級學習內容 R-4-1：兩步驟問題併式，含由左往右、先乘除後加減及括號先算；本候選活動以整數情境組式和逐步計算練習局部運算順序。',
  gradeRange: [4, 4],
  stagePerformanceRange: [3, 4],
  sourceId: 'mathematics',
  status: 'pending_review',
  officialTextReviewStatus: 'verified_against_official_pdf_this_run',
  gradeApplicabilityStatus: 'official_grade_table_4; semester_and_local_schedule_pending',
  performanceCodes: ['r-II-3'],
  performanceTexts: ['理解兩步驟問題的併式計算與四則混合計算之約定。'],
  contentCodes: ['R-4-1'],
  contentTexts: ['兩步驟問題併式：併式是代數學習的重要基礎。含四則混合計算的約定（由左往右算、先乘除後加減、括號先算）。學習逐次減項計算。'],
  sourceUrl: n4Focus.sourceUrl,
  documentTitle: n4Focus.documentTitle,
  pageOrSection: '伍／一／第二學習階段學習表現 r-II-3：PDF頁序11；伍／二／四年級學習內容表 R-4-1：PDF頁序30–31（備註跨頁）。',
  verifiedClauses: ['R-4-1', 'r-II-3'],
  reviewer: '官方 PDF 條文核對（非教師課程審查）',
  reviewDate: '2026-10-24',
  localScheduleStatus: 'pending_school_and_textbook_evidence',
  teacherProfessionalReviewStatus: 'pending_review',
  candidateActivityId: 'ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE',
  coverageStatus: 'partial',
  coverageLimitations: ['涵蓋三種整數情境：先乘後加、括號先算、連續除法左往右；尚未涵蓋所有四則組合及完整逐次減項題型。', '算式片段與中間值選擇是遊戲支架，未評量自由書寫或口頭說明。'],
};
const existingR4 = focusCollections.flat().find(({ id }) => id === r4Focus.id);
if (existingR4) Object.assign(existingR4, r4Focus);
else map.pendingLearningFocuses.push(r4Focus);

const upsertDefinition = (record) => {
  const existing = definitions.definitions.find(({ subitemId }) => subitemId === record.subitemId);
  if (existing) Object.assign(existing, record);
  else definitions.definitions.push(record);
};
upsertDefinition({
  subitemId: 'SUB-MATH-G4-N4-3-TWO-STEP-MULTIPLICATION-DIVISION-MODEL',
  focusId: 'math-grade4-multiplicative-two-step', subject: 'mathematics', officialCode: 'N-4-3',
  sourceText: '解題：兩步驟應用問題（乘除，連除）。乘與除、連除之應用解題。',
  sourceTextKind: 'verbatim_official_pdf_clause_checked_2026-10-24; project subitem is analysis',
  sourceRef: { sourceId: 'mathematics', pageOrSection: '四年級學習內容表 N-4-3，PDF頁序28；同表 n-II-5，表現表 PDF頁序12。' },
  projectSubitem: '先以陣列表示相同組數與每組量並組成乘法算式，再把中間結果用於等分除；新情境以每包量已知求組數，並將所得組數再次分裝，呈現等分除與包含除兩種未知量。情境均為整除。本拆解是專案分析，不是官方子條文。',
  decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24',
  activityIds: ['ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE'],
  evidenceStageIds: ['model-six-cartons-four-packs', 'record-carton-multiplication', 'share-twenty-four-packs', 'model-five-crates-six-packs', 'count-five-pack-bundles', 'chain-divide-packets-into-trays'],
  status: 'candidate_partial_interaction',
});
upsertDefinition({
  subitemId: 'SUB-MATH-G4-R4-1-COMPOUND-EXPRESSION-ORDER-CANDIDATE',
  focusId: 'math-grade4-compound-expression-order', subject: 'mathematics', officialCode: 'R-4-1',
  sourceText: '兩步驟問題併式：併式是代數學習的重要基礎。含四則混合計算的約定（由左往右算、先乘除後加減、括號先算）。學習逐次減項計算。',
  sourceTextKind: 'verbatim_official_pdf_clause_checked_2026-10-24; project subitem is analysis',
  sourceRef: { sourceId: 'mathematics', pageOrSection: '四年級學習內容表 R-4-1，PDF頁序30–31（跨頁備註）；同表 r-II-3，PDF頁序11。' },
  projectSubitem: '從三種整數情境依順序組出 3×4+5、(8+4)×3、36÷6÷2，再分別完成中間值計算，操作先乘除後加減、括號先算與同級左往右。尚未涵蓋全套四則組合與完整逐次減項練習。本拆解是專案分析，不是官方子條文。',
  decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_24',
  activityIds: ['ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE'],
  evidenceStageIds: ['assemble-multiply-before-add', 'calculate-multiply-before-add', 'assemble-parentheses-first', 'calculate-parentheses-first', 'assemble-left-to-right-division', 'calculate-left-to-right-division'],
  status: 'candidate_partial_interaction',
});

for (const [code, record] of Object.entries({
  'N-4-3': {
    status: 'partial', activityIds: ['ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE'],
    evidenceStageIds: ['model-six-cartons-four-packs', 'record-carton-multiplication', 'share-twenty-four-packs', 'model-five-crates-six-packs', 'count-five-pack-bundles', 'chain-divide-packets-into-trays'],
    reason: '陣列實作乘法總量、按順序組算式，並用中間值處理等分除與連除；只有整除情境，尚未涵蓋餘數或所有乘除問題。',
  },
  'R-4-1': {
    status: 'partial', activityIds: ['ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE'],
    evidenceStageIds: ['assemble-multiply-before-add', 'calculate-multiply-before-add', 'assemble-parentheses-first', 'calculate-parentheses-first', 'assemble-left-to-right-division', 'calculate-left-to-right-division'],
    reason: '三種情境實際組合算式並逐步選取中間值，練習先乘後加、括號先算及連除左往右；仍非 R-4-1 全範圍或自由書寫證據。',
  },
})) {
  const row = batch.activityAudit.find((entry) => entry.code === code);
  if (!row) throw new Error(`grade4_activity_audit_row_missing:${code}`);
  Object.assign(row, record);
}

write('curriculum/curriculum-map.json', map);
write('curriculum/learning-subitem-definitions.json', definitions);
write('curriculum/math-grade4-official-content-batch.json', batch);
console.log(JSON.stringify({ updatedFocusIds: [n4Focus.id, r4Focus.id], subitemCount: 2, activityAuditCodes: ['N-4-3', 'R-4-1'] }, null, 2));
