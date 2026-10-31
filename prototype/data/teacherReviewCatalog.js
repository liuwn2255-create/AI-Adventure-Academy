import { MATH_LEVEL_DIRECTORY } from './mathLevelDirectory.js';
import { NUMBER_SECRET_LEARNING_UNIT, NUMBER_SECRET_V2_CANDIDATE_SET } from './numberSecretLearningUnit.js';
import { NUMBER_COMPARISON_LEARNING_UNIT } from './numberComparisonLearningUnit.js';
import { CAPACITY_READING_LEARNING_UNIT } from './capacityReadingLearningUnit.js';
import { INTEGER_NUMBER_LINE_LEARNING_UNIT } from './integerNumberLineLearningUnit.js';
import { MILLIMETER_RULER_LEARNING_UNIT } from './millimeterRulerLearningUnit.js';
import { WEIGHT_KG_G_LEARNING_UNIT } from './weightKgGLearningUnit.js';
import { SQUARE_CENTIMETER_AREA_LEARNING_UNIT } from './squareCentimeterAreaLearningUnit.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from './fractionTreasureLearningUnit.js';
import { ADDITION_SUBTRACTION_LEARNING_UNIT } from './additionSubtractionLearningUnit.js';

const entriesByLevel = new Map(MATH_LEVEL_DIRECTORY.map((entry) => [entry.levelId, entry]));
const asReviewQuestion = (question, group, profile = {}, options = {}) => Object.freeze({
  questionId: question.id ?? question.draftId,
  prompt: question.prompt ?? options.prompt ?? '尚未提供可作答題幹。',
  options: Object.freeze((question.options ?? []).map((option) => Object.freeze({
    optionId: option.optionId,
    text: option.text,
    errorType: option.errorType ?? question.errorTypes?.[option.optionId] ?? null,
  }))),
  answerId: question.answerId ?? null,
  explanation: question.explanation ?? null,
  group,
  status: options.status ?? question.status ?? 'candidate_pending_teacher_review',
  reviewable: options.reviewable ?? true,
  visualization: question.visualization ?? question.table ?? null,
  hint: question.hint ?? null,
  hints: Object.freeze([...(question.hints ?? (question.hint ? [question.hint] : []))]),
  wrongGuidance: question.wrongGuidance ?? null,
  errorGuidance: Object.freeze({ ...(question.errorExplanations ?? {}) }),
  remediation: question.remediation ?? options.remediation ?? null,
  capability: profile.capability ?? '題目資料未明確標示；請教師依題幹確認。',
  mixedConcern: profile.mixedConcern ?? '可能同時受到讀題、表徵理解或操作影響；僅憑一次選項無法診斷原因。',
  prerequisiteNote: question.prerequisiteNote ?? profile.prerequisiteNote ?? '須由教師依實際教材及班級授課確認。',
  diagnosticBoundary: '選項只提供待驗證線索，不是已確診的學生迷思。',
});

function linkedRemediation(unit, question) {
  const errorTypes = new Set([
    ...Object.values(question.errorTypes ?? {}),
    ...(question.options ?? []).map((option) => option.errorType).filter(Boolean),
  ]);
  const matches = (unit.reinforcementActivities ?? []).filter((activity) => errorTypes.has(activity.errorType));
  if (matches.length === 0) return null;
  return matches.map((activity) => [
    activity.title,
    activity.prompt,
    activity.hint ? `提示：${activity.hint}` : null,
    activity.explanation ? `說明：${activity.explanation}` : null,
  ].filter(Boolean).join('；')).join('／');
}

const mapUnitQuestion = (unit, question, group, profile = {}, options = {}) => asReviewQuestion(
  question,
  group,
  profile,
  { ...options, remediation: options.remediation ?? linkedRemediation(unit, question) },
);

const numberSecretQuestionProfiles = {
  'secret-thousands-01': { capability: '辨認千位上的數字所表示的千數量。', mixedConcern: '需要讀懂「表示幾個千」；題目不要求計算。' },
  'secret-thousands-02': { capability: '把千的組數連結到數字表示。', mixedConcern: '可能同時涉及重複加總或千的單位意義。' },
  'secret-thousands-03': { capability: '將 2,000 與 500 組合為一個數。', mixedConcern: '混合位值組成與加法／數量合成；不能當作單純位值辨識。' },
  'DRAFT-M3-NUM-01-01': { capability: '從千、百、十、個積木組數轉成數字；位值表是顯示答案的教學支架。', mixedConcern: '包含圖像辨識、數量點數及位值欄位對應。', prerequisiteNote: '需確認學生已學位名順序，且能辨認各種積木分組。' },
  'CAND-CHECK-M3-NUM-01-01': { capability: '在新數值中說明千位數字所代表的數量。' },
  'CAND-CHECK-M3-NUM-01-02': { capability: '把千的組數連結到數字表示。' },
  'CAND-CHECK-M3-NUM-01-03': { capability: '將千與百的數量合成。', mixedConcern: '明確涉及加法／數量合成，能力與位值辨識須分開審查。' },
  'V2-DRAFT-M3-NUM-01-01': { capability: '辨認指定數字所在的位名。', mixedConcern: '主要是位序定位；須確認學生理解「哪一位」用語。' },
  'V2-DRAFT-M3-NUM-01-02': { capability: '由位名連結到數字代表的實際數量。', mixedConcern: '位值理解與讀取四位數位序均可能影響作答。' },
  'V2-DRAFT-M3-NUM-01-03': { capability: '由位值表轉寫成數字（唯讀預覽，未啟用）。', mixedConcern: '另要求讀表及按位序轉寫，先備尚待教師確認。' },
  'V2-DRAFT-M3-NUM-01-04': { capability: '展開表示（停用設計，尚無可作答題面）。', mixedConcern: '可能混合展開表示、加法與數量合成；不得作答或計分。' },
};

const activityProfiles = [
  {
    unit: NUMBER_SECRET_LEARNING_UNIT,
    levelIds: ['math-place-value-demo', 'number-secret-challenge'],
    questions: [
      ...NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.map((q) => mapUnitQuestion(NUMBER_SECRET_LEARNING_UNIT, q, q.evidenceType === 'candidate_guided_practice_only' ? '候選引導練習' : '既有循序練習', numberSecretQuestionProfiles[q.id])),
      ...NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.map((q) => mapUnitQuestion(NUMBER_SECRET_LEARNING_UNIT, q, '既有候選檢核', numberSecretQuestionProfiles[q.id])),
      ...NUMBER_SECRET_V2_CANDIDATE_SET.questions.map((q) => mapUnitQuestion(NUMBER_SECRET_LEARNING_UNIT, q, `V2 候選題組（第 ${q.draftId.slice(-2)} 題）`, numberSecretQuestionProfiles[q.draftId])),
      ...NUMBER_SECRET_V2_CANDIDATE_SET.deferredQuestions.map((q) => mapUnitQuestion(NUMBER_SECRET_LEARNING_UNIT, q, 'V2 唯讀預覽・不可作答', numberSecretQuestionProfiles[q.draftId], { status: q.status, reviewable: true })),
      ...NUMBER_SECRET_V2_CANDIDATE_SET.disabledConditionalQuestions.map((q) => mapUnitQuestion(NUMBER_SECRET_LEARNING_UNIT, q, 'V2 停用設計・不可作答', numberSecretQuestionProfiles[q.draftId], { status: q.status, reviewable: false, prompt: q.note })),
    ],
    prerequisites: [
      { id: 'place-value-name-order', label: '班級是否已教千、百、十、個位的名稱與排列？' },
      { id: 'base-ten-representation', label: '班級是否已接觸千／百／十／個積木及其分組表徵？' },
      { id: 'place-value-table-reading', label: '若審查 V2 第 3 題，班級是否已學讀取位值表並依欄轉寫？' },
      { id: 'expanded-form-addition', label: '若審查 V2 第 4 題，展開表示及所需加法／數量合成是否已教？' },
    ],
  },
  {
    unit: NUMBER_COMPARISON_LEARNING_UNIT,
    levelIds: [NUMBER_COMPARISON_LEARNING_UNIT.levelId],
    questions: NUMBER_COMPARISON_LEARNING_UNIT.questions.map((q, i) => asReviewQuestion(q, '候選比較練習', {
      capability: '比較兩個數字表示的整數大小。',
      mixedConcern: i === 2 ? '跨越千位的比較可能依賴位值及數序理解；需教師確認先備。' : '須確認採用的比較策略與符號要求；目前題目僅選答案。',
    })),
    prerequisites: [{ id: 'compare-number-place-values', label: '班級是否已教比較相同位數整數的位值／數序策略？' }],
  },
  {
    unit: CAPACITY_READING_LEARNING_UNIT,
    levelIds: [CAPACITY_READING_LEARNING_UNIT.levelId],
    questions: CAPACITY_READING_LEARNING_UNIT.questions.map((q) => asReviewQuestion(q, '候選刻度判讀情境', {
      capability: '讀取量杯水面對齊的毫升刻度。',
      mixedConcern: '可能受刻度方向、間隔、數字標籤與量感影響；題目資料有兩層提示與答錯引導，但沒有已連接補強。',
    })),
    prerequisites: [
      { id: 'capacity-unit-labels', label: '班級是否已認識公升、毫升及量杯刻度標籤？' },
      { id: 'capacity-scale-reading', label: '班級是否已練習依刻度間距讀取水位？' },
    ],
  },
  {
    unit: INTEGER_NUMBER_LINE_LEARNING_UNIT,
    levelIds: [INTEGER_NUMBER_LINE_LEARNING_UNIT.levelId],
    questions: INTEGER_NUMBER_LINE_LEARNING_UNIT.questions.map((q, i) => asReviewQuestion(q, '候選數線練習', {
      capability: i === 2 ? '比較數線標記與 0 的距離。' : '依數線刻度判讀標記所代表的數。',
      mixedConcern: i === 2 ? '除讀取位置外，還要求理解距離／接近程度。' : '可能受起點、刻度間隔或方向判讀影響。',
    })),
    prerequisites: [
      { id: 'number-line-zero-and-interval', label: '班級是否已理解數線起點 0、方向與刻度間隔？' },
      { id: 'number-line-distance', label: '若審查第 3 題，班級是否已用數線比較距離？' },
    ],
  },
  {
    unit: MILLIMETER_RULER_LEARNING_UNIT,
    levelIds: [MILLIMETER_RULER_LEARNING_UNIT.levelId],
    questions: MILLIMETER_RULER_LEARNING_UNIT.questions.map((q) => asReviewQuestion(q, '候選毫米刻度題', {
      capability: '由 0 起點及終點刻度讀取毫米長度。',
      mixedConcern: '同時涉及尺刻度辨讀、起點對齊與毫米單位理解；題目資料有兩層提示與答錯引導，但沒有已連接補強。',
    })),
    prerequisites: [
      { id: 'ruler-zero-alignment', label: '班級是否已學會以 0 刻度對齊起點量長？' },
      { id: 'millimeter-scale', label: '班級是否已認識毫米刻度與尺上小格？' },
    ],
  },
  {
    unit: WEIGHT_KG_G_LEARNING_UNIT,
    levelIds: [WEIGHT_KG_G_LEARNING_UNIT.levelId],
    questions: WEIGHT_KG_G_LEARNING_UNIT.questions.map((q, i) => asReviewQuestion(q, '候選公克／公斤題', {
      capability: ['讀取電子秤上的公克數值與單位', '理解 1 公斤與公克的單位關係', '比較同一單位表示的兩個重量'][i],
      mixedConcern: ['可能涉及辨讀單位符號 g 與數字', '要求公斤與公克的單位換算', '只比較相同單位數值；仍需確認數序先備'][i],
    })),
    prerequisites: [
      { id: 'weight-unit-language', label: '班級是否已認識重量、g（公克）與 kg（公斤）的表記？' },
      { id: 'kg-gram-relation', label: '若審查第 2 題，班級是否已教 1 公斤與公克的關係？' },
      { id: 'same-unit-comparison', label: '若審查第 3 題，班級是否已能比較同一單位表示的數值？' },
    ],
  },
  {
    unit: SQUARE_CENTIMETER_AREA_LEARNING_UNIT,
    levelIds: [SQUARE_CENTIMETER_AREA_LEARNING_UNIT.levelId],
    questions: SQUARE_CENTIMETER_AREA_LEARNING_UNIT.questions.map((q) => asReviewQuestion(q, '平方公分候選方格題', {
      capability: q.capability,
      mixedConcern: '方格點數題可能受圖像辨識、點數策略及面積單位理解影響；比較題不以外框長度代替方格面積。一次錯答不足以判定原因。',
      prerequisiteNote: q.prerequisiteNote,
    })),
    prerequisites: [
      { id: 'area-square-centimeter-unit', label: '班級是否已認識平方公分與 1 平方公分單位方格？' },
      { id: 'area-grid-cover-and-count', label: '班級是否已用相同單位方格覆蓋或點數簡單圖形？' },
      { id: 'area-length-unit-centimeter', label: '若審查第 4 題，班級是否已學公分及長度／面積單位的區別？' },
    ],
  },
  {
    unit: FRACTION_TREASURE_LEARNING_UNIT,
    levelIds: [FRACTION_TREASURE_LEARNING_UNIT.levelId],
    questions: FRACTION_TREASURE_LEARNING_UNIT.questions.map((q) => asReviewQuestion(q, '同分母分數候選題', {
      capability: q.capability,
      mixedConcern: q.id.endsWith('-05') ? '生活情境需同時讀取人物敘述與同分母分數；須觀察是否為語意或數學理解造成作答差異。' : '一次錯答可能受圖像辨識、分數記號或比較策略影響；不能直接視為已診斷迷思。',
      prerequisiteNote: q.prerequisiteNote,
    })),
    prerequisites: [
      { id: 'fraction-equal-whole-and-parts', label: '班級是否已學「一個整體平均分成等大的部分」？依據為何？' },
      { id: 'fraction-symbol-reading', label: '班級是否已學分數記號的上下位置及其意義？' },
      { id: 'same-denominator-comparison', label: '班級是否已用操作或圖像比較相同整體、相同分母的分數？' },
      { id: 'fraction-language-and-symbols', label: '班級是否已學本題使用的「分子、分母」名稱及 <、=、> 符號？' },
    ],
  },
  {
    unit: ADDITION_SUBTRACTION_LEARNING_UNIT,
    levelIds: [ADDITION_SUBTRACTION_LEARNING_UNIT.levelId],
    questions: ADDITION_SUBTRACTION_LEARNING_UNIT.questions.map((q) => asReviewQuestion(q, '多位數加減候選題', {
      capability: q.capability,
      mixedConcern: '選擇正確結果不能證明學生會說明進位／退位策略；作答差異也可能受位值、基本運算或記號追蹤影響。',
      prerequisiteNote: q.prerequisiteNote,
    })),
    prerequisites: [
      { id: 'add-sub-vertical-alignment', label: '班級是否已學直式按相同位值對齊？請附教材／教學紀錄。' },
      { id: 'add-sub-carry-borrow', label: '班級是否已學多次進位與退位？' },
      { id: 'add-sub-zero-operands', label: '班級是否已學算式中含 0 的進位／跨 0 退位題型？' },
      { id: 'add-sub-basic-facts', label: '相關加減基本事實及位值重新分解是否已教？' },
    ],
  },
];

export const TEACHER_REVIEW_ACTIVITIES = Object.freeze(activityProfiles.map(({ unit, levelIds, questions, prerequisites }) => {
  const primaryLevel = entriesByLevel.get(levelIds.at(-1));
  const first = entriesByLevel.get(levelIds[0]);
  const refs = unit.curriculumReferences ?? unit.curriculum ?? first?.curriculumReferences ?? {};
  const curriculumCodes = refs.learningContentCode
    ? [refs.learningContentCode, ...(refs.stagePerformanceCode ? [refs.stagePerformanceCode] : [])]
    : [...(refs.codes ?? [])];
  const mapIds = refs.curriculumMapId ? [refs.curriculumMapId] : [...(refs.curriculumMapIds ?? first?.curriculumReferences?.curriculumMapIds ?? [])];
  const sourceId = refs.sourceId ?? first?.curriculumReferences?.sourceId ?? null;
  const directory = primaryLevel ?? first;
  return Object.freeze({
    activityId: unit.activityId,
    learningUnitId: unit.learningUnitId,
    levelIds: Object.freeze(levelIds),
    title: unit.title ?? primaryLevel?.title ?? first?.title,
    gradeLabel: '三年級（建議範圍；年級適切性待教師確認）',
    subjectLabel: '數學',
    topic: directory?.learningTheme ?? unit.title,
    curriculumCodes: Object.freeze(curriculumCodes),
    curriculumMapIds: Object.freeze(mapIds),
    sourceId,
    sourceStatus: directory?.curriculumEvidenceStatus ?? unit.curriculumReviewStatus ?? 'pending_verification',
    gradeStatus: directory?.gradeApplicabilityStatus ?? refs.gradeAndScheduleStatus ?? 'pending_review',
    semesterStatus: directory?.semesterProgressStatus ?? 'pending_review',
    textbookEvidence: directory?.textbookEvidence ?? null,
    reviewStatus: directory?.teacherReviewStatus ?? unit.curriculumReviewStatus ?? 'pending_teacher_review',
    developmentStatus: directory?.runtime?.availability ?? 'candidate_activity',
    learningGoals: Object.freeze([...(unit.learningGoals ?? [])]),
    prerequisites: Object.freeze(prerequisites),
    hintPolicy: unit.hintPolicy ?? 'per_question',
    remediationPolicy: unit.remediationPolicy ?? 'per_question',
    status: unit.status ?? 'candidate_pending_teacher_review',
    questions: Object.freeze(questions),
  });
}));

// These are bounded descriptions of the current prototype data, not claims of
// full curriculum coverage. The pilot report reads them alongside live review
// records so review progress is never copied into course approval state.
const ACTIVITY_SCOPE_NOTES = Object.freeze({
  'ACT-M3-NUM-PLACE-VALUE-LEARNING-UNIT-PROTOTYPE': ['零的佔位、未教過情境遷移與完整單元精熟未由目前題組充分檢核。'],
  'ACT-M3-NUMBER-COMPARISON-CANDIDATE-PRACTICE': ['估算、不同表徵解釋及未見情境遷移未由目前三題充分檢核。'],
  'ACT-M3-CAPACITY-SCALE-READING-CANDIDATE': ['容量估測、單位換算與實際量測未由刻度讀值題充分檢核。'],
  'ACT-M3-INTEGER-NUMBER-LINE-CANDIDATE': ['數線加減、不同刻度系統與更廣泛數序能力未由目前題組充分檢核。'],
  'ACT-M3-MILLIMETER-RULER-CANDIDATE': ['實物測量、非零起點、估測及單位換算未由目前圖示讀值題充分檢核。'],
  'ACT-M3-WEIGHT-KG-G-CANDIDATE': ['實際秤重與重量估測未由目前圖示、換算及同單位比較題檢核。'],
  'ACT-M3-AREA-SQUARE-CENTIMETER-CANDIDATE': ['周長區辨、不規則部分方格處理與更廣泛面積量感未由目前四題充分檢核。'],
  'ACT-M3-FRACTION-TREASURE-SAME-DENOMINATOR-CANDIDATE': ['異分母比較、等值分數及非連續量模型未由目前題組檢核。'],
  'ACT-M3-ADD-SUB-VERTICAL-CANDIDATE': ['文字應用、估算、其他策略說明及未見情境遷移未由目前五題充分檢核。'],
});

const ACTIVITY_TEST_FILES = Object.freeze({
  'ACT-M3-NUM-PLACE-VALUE-LEARNING-UNIT-PROTOTYPE': ['test/number-secret.test.mjs', 'test/number-secret-v2-candidate.test.mjs'],
  'ACT-M3-NUMBER-COMPARISON-CANDIDATE-PRACTICE': ['test/learning-unit-engine.test.mjs', 'test/math-level-directory.test.mjs'],
  'ACT-M3-CAPACITY-SCALE-READING-CANDIDATE': ['test/capacity-reading-learning-unit.test.mjs', 'test/capacity-mission.test.mjs'],
  'ACT-M3-INTEGER-NUMBER-LINE-CANDIDATE': ['test/integer-number-line-learning-unit.test.mjs'],
  'ACT-M3-MILLIMETER-RULER-CANDIDATE': ['test/millimeter-ruler-learning-unit.test.mjs'],
  'ACT-M3-WEIGHT-KG-G-CANDIDATE': ['test/weight-kg-g-learning-unit.test.mjs'],
  'ACT-M3-AREA-SQUARE-CENTIMETER-CANDIDATE': ['test/square-centimeter-area-learning-unit.test.mjs'],
  'ACT-M3-FRACTION-TREASURE-SAME-DENOMINATOR-CANDIDATE': ['test/fraction-treasure-learning-unit.test.mjs'],
  'ACT-M3-ADD-SUB-VERTICAL-CANDIDATE': ['test/addition-subtraction-learning-unit.test.mjs'],
});

// This is an authoring-time quality audit, separate from editable teacher
// decisions and from engineering acceptance evidence. Source text status below
// refers to the recorded official PDF check; item-to-clause fit remains open.
const OFFICIAL_CLAUSE_AUDIT = Object.freeze({
  'N-3-1': { location: '伍／二／三年級學習內容表，PDF 頁序 P25；對應 n-II-1（第二學習階段）', scope: '一萬以內的數，含位值積木操作、點數、位值表徵與位值單位「千」及位值單位換算。' },
  'N-3-2': { location: '伍／二／三年級學習內容表，PDF 頁序 P25；對應 n-II-2（第二學習階段）', scope: '加減直式計算，含多次進、退位；須處理數字中有 0 的題型；可先在有位值的表格中學習。' },
  'N-3-9': { location: '伍／二／三年級學習內容表，PDF 頁序 P26；對應 n-II-6（第二學習階段）', scope: '簡單同分母分數，結合操作與整數經驗；比較、加、減及應用範圍受條目備註限制，所涉分數及結果不超過 2。' },
  'N-3-11': { location: '伍／二／三年級學習內容表，PDF 頁序 P26；對應 n-II-8（第二學習階段）', scope: '整數數線的認識、報讀與標示，連結數序、長度、尺經驗，理解比較、加、減意義；數線從 0 開始。' },
  'N-3-12': { location: '伍／二／三年級學習內容表，PDF 頁序 P26–P27；對應 n-II-9（第二學習階段）', scope: '長度「毫米」的實測、量感、估測、計算及單位換算；部分換算數值限制見條目備註。' },
  'N-3-14': { location: '伍／二／三年級學習內容表，PDF 頁序 P27；對應 n-II-9（第二學習階段）', scope: '面積「平方公分」的實測、量感、估測與計算；用平方公分板點數簡單圖形，不發展一般公式。' },
  'N-3-15': { location: '伍／二／三年級學習內容表，PDF 頁序 P27；對應 n-II-9（第二學習階段）', scope: '容量「公升」、「毫升」的實測、量感、估測與計算及單位換算；換算限制見條目備註。' },
  'N-3-16': { location: '伍／二／三年級學習內容表，PDF 頁序 P27；對應 n-II-9（第二學習階段）', scope: '重量「公斤」、「公克」的實測、量感、估測與計算及單位換算；換算限制見條目備註。' },
});

const QUESTION_AUDIT_NOTES = Object.freeze({
  'secret-thousands-01': '在 3,000 的千位辨識；不涉及位值表或 0 佔位。單一選答不能證明跨數值遷移。',
  'secret-thousands-02': '4 個千換成 4,000；說明採重複加法，除位值外也動用加法表述。',
  'secret-thousands-03': '2,000 與 500 合成為 2,500；包含數量合成／加法，不是純位名辨識。',
  'DRAFT-M3-NUM-01-01': '2,468 積木題屬引導練習；位值表把 2、4、6、8 直接列出，支架會呈現答案，不能計作獨立檢核。',
  'CAND-CHECK-M3-NUM-01-01': '概念與既有 3,000／3 個千練習高度相似，只更換數值；不宜單題作為新情境遷移證據。',
  'CAND-CHECK-M3-NUM-01-02': '與「4 個千合起來」練習同一任務結構，僅更換組數；不構成表徵多樣化。',
  'CAND-CHECK-M3-NUM-01-03': '3,000+200 合成題與 2,000+500 練習同屬位值合成且混入加法先備。',
  'V2-DRAFT-M3-NUM-01-01': '位名定位；文字提示提供定位步驟但未直接給位名。錯誤選項應當觀察線索，不可診斷。',
  'V2-DRAFT-M3-NUM-01-02': '十位數量意義；與 Q1 的位名概念相鄰但不相同。需確認「代表多少」措辭與位值先備。',
  'V2-DRAFT-M3-NUM-01-03': '位值表轉寫預覽；正解數字可由表格直接讀出，且題目狀態為唯讀，不得提交／計分。',
  'V2-DRAFT-M3-NUM-01-04': '停用條件說明，尚無題幹、選項、答案或可審題面；不得呈現作答入口。',
  'comparison-demo-01': '千位相同後比較百位，判斷清楚；與第 2 題比較方向不同但同為逐位整數比較。',
  'comparison-demo-02': '含十位 0 的比較；需保留位序並比較十位。官方代碼／地圖連結目前空缺。',
  'comparison-demo-03': '跨 2,999／3,001 千位邊界，難度明顯高於前兩題；年級、先備與順序待教師確認。',
  'CAPACITY-DRAFT-M3-READ-01': '資料水位 300 mL 與正解選項一致；此題只讀已標刻度，不評估量感或實際量測。',
  'CAPACITY-DRAFT-M3-READ-02': '資料水位 600 mL 與正解一致；題型沿用第 1 題，僅位置／數值不同。',
  'CAPACITY-DRAFT-M3-READ-03': '資料水位 900 mL 與正解一致；接近容量上限，仍是相同已標刻度讀取型態。',
  'INTEGER-NUMBER-LINE-DRAFT-01': '從 0 起每小格 100，A=300；題目測讀值，不測學生自行標點。',
  'INTEGER-NUMBER-LINE-DRAFT-02': '從已標 500 往右兩小格得 700；需能讀已標刻度與等距小格。',
  'INTEGER-NUMBER-LINE-DRAFT-03': '比較 A/B/C 與 0 的距離，能力不同於前兩題讀值，且引入距離／大小語意。',
  'MILLIMETER-RULER-DRAFT-01': '0 起點至 23 mm；尺圖刻度判讀不等同實物測量。',
  'MILLIMETER-RULER-DRAFT-02': '0 起點至 46 mm；題幹稱木片但呈現為圖示尺讀值，非實物操作。',
  'MILLIMETER-RULER-DRAFT-03': '0 起點至 58 mm；同樣是 0 起點讀值，未涵蓋非零起點／估測／換算。',
  'WEIGHT-KG-G-DRAFT-01': '文字給出電子秤 750 g，答案 750 公克；未附實際秤面圖，偏向單位辨讀而非圖像讀秤。',
  'WEIGHT-KG-G-DRAFT-02': '1 kg=1000 g 的單位關係題；若未教換算，錯答不能歸因於重量量感。',
  'WEIGHT-KG-G-DRAFT-03': '950 g 與 850 g 同單位比較；測量重量比較與整數大小比較的交界。',
  'AREA-DRAFT-M3-N314-01': '3×4 單位方格共 12；核對圖格數及答案一致。只測圖上點數，不是實測或估測。',
  'AREA-DRAFT-M3-N314-02': '圖示完整格數為 5；不規則排列但沒有部分格，不能泛化到不完整方格處理。',
  'AREA-DRAFT-M3-N314-03': '甲 6 格、乙 7 格，乙面積較大；同大小單位方格可比較，不能由外框形狀判面積。',
  'AREA-DRAFT-M3-N314-04': '邊長 1 cm 的正方形對應 1 cm²；評量單位名稱區分，先備與措辭待教師確認。',
  'FRACTION-DRAFT-M3-N39-01': '單一連續整體 5 等分、3 格塗色，記為 3/5；圖像等份與分割模型需教師檢視。',
  'FRACTION-DRAFT-M3-N39-02': '問分母 6 的意義；圖示和題幹已明示 2/6，較偏術語／記號理解。',
  'FRACTION-DRAFT-M3-N39-03': '兩條長度相同、各 6 等分；甲 2 格、乙 4 格，乙較多。',
  'FRACTION-DRAFT-M3-N39-04': '3/8<5/8 計算正確；純符號且無圖像，除同分母比較外還要求比較符號方向。',
  'FRACTION-DRAFT-M3-N39-05': '同分母生活語句比較；兩個同整體分割的模型一致，但閱讀人物／吃下份量帶來語文負荷。',
  'ADD-SUB-DRAFT-M3-N32-01': '2,468+1,756=4,224；多次進位，選結果不能證明進位位值理由。',
  'ADD-SUB-DRAFT-M3-N32-02': '3,086+1,759=4,845；含 0 並多次進位，錯因可能混合佔位與進位紀錄。',
  'ADD-SUB-DRAFT-M3-N32-03': '5,234−1,786=3,448；多次退位。須觀察逐欄過程，選項不足以確診錯誤類型。',
  'ADD-SUB-DRAFT-M3-N32-04': '5,002−1,768=3,234；跨連續 0 退位，先備及難度風險高，須教師確認授課證據。',
  'ADD-SUB-DRAFT-M3-N32-05-STRATEGY': '14 個一重組為 1 個十的說明選擇；情境已提供，不能推論可自行計算或穩定解釋。',
});

function buildQuestionQualityAudit(activity, question) {
  const codes = activity.curriculumCodes ?? [];
  const contentCode = codes.find((code) => /^N-3-/.test(code)) ?? null;
  const clause = contentCode ? OFFICIAL_CLAUSE_AUDIT[contentCode] : null;
  const optionIds = question.options.map((option) => option.optionId);
  const optionTexts = question.options.map((option) => option.text);
  const linked = Boolean(question.remediation);
  const questionNote = QUESTION_AUDIT_NOTES[question.questionId] ?? '本題的作答過程、表徵可讀性與先備適切性須由教師實際審閱；一次選答不能支持穩定精熟判斷。';
  const qStatus = question.status;
  const questionRole = !question.reviewable
    ? '暫緩使用：目前停用，不可作答或計分。'
    : /preview|唯讀/.test(question.group)
      ? '教師示範／唯讀預覽：不計分、不作獨立檢核。'
      : /引導練習/.test(question.group)
        ? '引導練習：依目前資料有教學支架，不作獨立檢核。'
        : /候選檢核/.test(question.group)
          ? '候選檢核設計：尚未核准，需教師審查其獨立性與效度。'
          : '候選練習：實際教學時機及是否適合作獨立檢核待教師決定。';
  const proposedChange = !question.reviewable
    ? '維持停用，不建立作答入口；若要改為可作答題，須先取得先備與教學目標的教師決定。'
    : /preview|唯讀/.test(question.group)
      ? '維持唯讀預覽；先由教師確認讀表先備與使用目的，未完成前不得加入計分。'
      : /重複|高度相似|同構/.test(questionNote)
        ? '若教師仍需此能力證據，改用不同表徵、情境或要求解釋理由；不要只更換數字。'
        : /混合|另涉|同時|先備/.test(questionNote)
          ? '先由教師確認是否拆分先備能力／目標；在決定前保留候選題及原狀，不擅自降低或擴大要求。'
          : question.hints.length === 0
            ? '不虛構提示或補強；教師確認題目用途後，再決定是否需要新增不洩漏答案的支架。'
            : '目前沒有足以支持直接改寫的確定缺陷；先請教師核對題幹、圖表、答案及班級先備，再決定是否修訂。';
  return Object.freeze({
    analysisKind: 'candidate_quality_audit_not_teacher_review',
    curriculum: Object.freeze({
      codes: Object.freeze([...codes]),
      officialSourceId: activity.sourceId,
      officialSourceUrl: activity.sourceId === 'mathematics' ? 'https://www.naer.edu.tw/upload/1/16/doc/815/%E5%8D%81%E4%BA%8C%E5%B9%B4%E5%9C%8B%E6%B0%91%E5%9F%BA%E6%9C%AC%E6%95%99%E8%82%B2%E8%AA%B2%E7%B6%B1%E8%A6%81%E5%9C%8B%E6%B0%91%E4%B8%AD%E5%B0%8F%E5%AD%B8%E6%9A%A8%E6%99%AE%E9%80%9A%E5%9E%8B%E9%AB%98%E7%B4%9A%E4%B8%AD%E7%AD%89%E5%AD%B8%E6%A0%A1-%E6%95%B8%E5%AD%B8%E9%A0%98%E5%9F%9F.pdf' : null,
      officialSourceStatus: clause ? 'official_code_and_table_location_verified_in_project_and_checked_against_pdf' : 'pending_verification',
      officialTextChecked: Boolean(clause),
      officialLocation: clause?.location ?? '目前沒有可追溯的逐題官方條文位置；待課程專業人員核對。',
      officialContentSummary: clause?.scope ?? '尚無可用的官方條文摘要；不得由活動名稱推定代碼。',
      relatedPerformanceCodes: Object.freeze(codes.filter((code) => /^[a-z]-II-/.test(code))),
      itemAlignmentStatus: clause ? 'candidate_item_alignment_pending_teacher_review' : 'no_direct_code_pending_verification',
      gradeApplicability: clause ? 'N-3 內容代碼列於官方三年級學習內容表；目標班適切性仍待教師依教材與授課證據確認。' : '年級適切性待教師提供依據。',
      semesterAndTextbook: '出版社、版本、冊別、頁碼、學期／週次及班級進度：待教師提供／確認。Stage II performance codes are not Grade 3 semester schedules.',
    }),
    role: Object.freeze({ dataStatus: qStatus, usage: questionRole }),
    dataChecks: Object.freeze({
      answerReference: question.answerId === null ? 'no_answer_for_nonplayable_item' : optionIds.filter((id) => id === question.answerId).length === 1 ? 'answer_id_matches_exactly_one_option' : 'answer_id_mismatch',
      optionIdUniqueness: new Set(optionIds).size === optionIds.length,
      optionTextUniqueness: new Set(optionTexts).size === optionTexts.length,
      explanationPresent: Boolean(question.explanation?.trim()),
      mathematicalAndRepresentationReview: '工作台資料欄位已逐題核對答案參照、選項唯一性與解析存在；資料檢查不驗證實際視覺渲染或課堂詮釋。',
      questionSpecificFinding: questionNote,
    }),
    learningScope: Object.freeze({ measuredConcept: question.capability, prerequisite: question.prerequisiteNote, cognitiveLoadConcern: question.mixedConcern, uncoveredCapabilities: Object.freeze([...(ACTIVITY_SCOPE_NOTES[activity.activityId] ?? ['尚未整理；待教師與課程資料核對。'])]), judgmentLimit: 'One selected response, with or without a hint, does not establish stable mastery or cover the full curriculum clause.' }),
    supports: Object.freeze({
      hints: Object.freeze({ count: question.hints.length, status: question.hints.length ? 'present_data_requires_teacher_check_for_answer_leakage' : 'not_provided', teacherCheck: '提示是否引導思考、是否過早指向答案仍須逐題教師判斷。' }),
      wrongFeedback: Object.freeze({ status: question.wrongGuidance || Object.keys(question.errorGuidance ?? {}).length ? 'present_as_candidate_guidance' : 'not_provided', text: question.wrongGuidance ?? Object.values(question.errorGuidance ?? {}).join('；') ?? null, boundary: 'Choice labels and wrong answers are hypotheses only, not diagnosed misconceptions.' }),
      remediation: Object.freeze({ status: linked ? 'linked_candidate_activity_in_source_data' : 'not_provided', description: question.remediation ?? '尚無連結的補救活動。', executionBoundary: linked ? 'Catalog maps a candidate reinforcement activity by error type; teacher should verify its fit. No activity is claimed beyond that route.' : 'No connected remediation route is present.' }),
    }),
    recommendations: Object.freeze([
      proposedChange,
      '修改理由：' + questionNote,
      '修改後驗證：原 draft ID 與候選狀態保留；答案須仍唯一指向選項，解析須支持答案，圖表／單位與題幹一致，提示不洩漏；重跑該活動專項測試並由教師複核教學對齊。',
    ]),
    teacherReview: Object.freeze({ status: 'unreviewed', decision: null, reviewer: null, date: null, comment: '' }),
  });
}

export const TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE = Object.freeze(TEACHER_REVIEW_ACTIVITIES.map((activity) => Object.freeze({
  ...activity,
  questions: Object.freeze(activity.questions.map((question) => Object.freeze({
    ...question,
    qualityAudit: buildQuestionQualityAudit(activity, question),
  }))),
  uncoveredCapabilities: Object.freeze(ACTIVITY_SCOPE_NOTES[activity.activityId] ?? ['尚未整理；待教師與課程資料核對。']),
  engineeringTestFiles: Object.freeze(ACTIVITY_TEST_FILES[activity.activityId] ?? []),
})));

export const TEACHER_REVIEW_ACTIVITY_IDS = Object.freeze(TEACHER_REVIEW_ACTIVITIES.map((activity) => activity.activityId));
export const TEACHER_REVIEW_QUESTION_IDS = Object.freeze(Object.fromEntries(TEACHER_REVIEW_ACTIVITIES.map((activity) => [
  activity.activityId,
  Object.freeze(activity.questions.map((question) => question.questionId)),
])));
export const TEACHER_REVIEW_PREREQUISITE_IDS = Object.freeze(Object.fromEntries(TEACHER_REVIEW_ACTIVITIES.map((activity) => [
  activity.activityId,
  Object.freeze(activity.prerequisites.map((prerequisite) => prerequisite.id)),
])));

