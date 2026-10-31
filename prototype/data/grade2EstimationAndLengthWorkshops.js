const candidate = 'candidate_pending_teacher_review';
const review = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });
const evidencePolicy = Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false });

export const GRADE2_ESTIMATION_WORKSHOP = Object.freeze({
  activityId: 'ACT-G2-MATH-LIFE-ESTIMATION-HUNDREDS-CANDIDATE',
  revision: 1,
  title: '百數估算補給站：先想大約多少',
  gradeId: 'grade-2', subjectId: 'mathematics', status: candidate,
  sourceKind: 'official_content_interactive_candidate_not_textbook',
  reinforcementStatus: '尚無連結的補強活動',
  runtimeModule: 'prototype/data/grade2EstimationAndLengthWorkshops.js',
  curriculumMapId: 'math-grade2-life-add-sub-estimation', sourceId: 'mathematics',
  curriculumCodes: ['N-2-4', 'n-I-3'],
  learningSubitemClaims: ['SUB-MATH-G2-N2-4-ROUND-HUNDREDS-LIFE-ESTIMATION'],
  sourceLocation: '教育部107年7月26日發布數學領綱：二年級學習內容表 N-2-4，PDF頁序23；同表對應表現 n-I-3。',
  curriculumScope: '依 N-2-4「簡單加減估算、具體生活情境、以百位數估算為主」設計三個生活情境滑桿任務。畫面先列出將數量估到整百的參考，再由學生調整估計值；接受範圍為本專案依各題估算策略設定的合理區間，不是官方容許誤差。未涵蓋學生自選估算策略、廣泛生活情境與口頭解釋；不代表特定學期進度。',
  learningObjective: { objectiveId: 'LO-G2-MATH-LIFE-ESTIMATION-01', statement: '在日常加減情境中，把數量約估到百位，調整估算結果並檢查是否落在情境可支持的範圍。', status: candidate },
  instructions: '每站先看情境給的百位估算線索，再移動滑桿提出自己的估計。估算不是精確答案；完成後會比較你的估計和線索支持的範圍。',
  evidencePolicy, teacherReview: review,
  coverage: { status: 'partial', subitemId: 'SUB-MATH-G2-N2-4-ROUND-HUNDREDS-LIFE-ESTIMATION', coveredByInteraction: ['set_estimate_range', 'life_context_estimate', 'hundreds_estimation'], notCovered: ['學生自行選擇並說明估算策略', '多樣化個人生活情境及教師口頭觀察'] },
  openQuestions: ['每題可接受範圍是專案設定的估算合理度，不是官方規定的精度或容許誤差。', '滑桿提供螢幕估算練習，需教師確認情境、數值和學生先備。'],
  stages: Object.freeze([
    Object.freeze({ stageId: 'estimate-class-library-books', interaction: 'set_estimate_range', prompt: '班級整理兩箱圖書：一箱有 238 本，另一箱有 351 本。依百位估算線索，估一估總數大約多少本。', hints: ['先看百位附近的數：238 約 200，351 約 400。', '把約 200 本和約 400 本合起來，再調整滑桿；合理估計接近 600 本。'], incorrectFeedback: '回看兩個數量的百位估算線索，再把估算後的數量合起來；不必追求精確總數。', correctFeedback: '你用百位估算整理兩箱書的總量。合理範圍是依本題線索設定，並非官方規定的誤差。', estimateRules: { contextText: '估算線索：238 約 200；351 約 400。以下合理區間由這組數字推得。', inputRange: { min: 300, max: 900, step: 50 }, acceptableRange: { min: 500, max: 700 }, unitLabel: '本' } }),
    Object.freeze({ stageId: 'estimate-school-fair-change', interaction: 'set_estimate_range', prompt: '園遊會準備 684 張票，已使用 271 張。用百位附近的數估一估，大約還剩多少張？', hints: ['684 約 700，271 約 300。', '用約 700 減去約 300，估一估剩下的票數。'], incorrectFeedback: '先估兩個數到百位，再用估算後的數量相減。這題要估計剩下的票，不是精確計算。', correctFeedback: '你的估計符合百位估算線索。情境只檢查估算是否合理，不表示精確剩餘量。', estimateRules: { contextText: '估算線索：684 約 700；271 約 300；估算差約 400。', inputRange: { min: 100, max: 700, step: 50 }, acceptableRange: { min: 300, max: 500 }, unitLabel: '張' } }),
    Object.freeze({ stageId: 'estimate-sports-day-supplies', interaction: 'set_estimate_range', prompt: '運動會兩個班分別準備 446 個號碼貼和 249 個號碼貼。估一估合起來大約多少個。', hints: ['446 約 400；249 約 200。', '把兩個百位估計相加，檢查滑桿是否接近 600。'], incorrectFeedback: '重新比較 446、249 各自最接近哪個百位，再把估算的兩部分合起來。', correctFeedback: '你把百位估算策略用在新的加法情境；仍需在真實問題中自行判斷估算方式。', estimateRules: { contextText: '估算線索：446 約 400；249 約 200；合計估約 600。', inputRange: { min: 300, max: 900, step: 50 }, acceptableRange: { min: 500, max: 700 }, unitLabel: '個' } }),
  ]),
});

const lengthStage = (stage) => Object.freeze({ ...stage, interaction: 'measure_length_model' });
const calcStage = (stage) => Object.freeze({ ...stage, interaction: 'complete_calculation_steps', calculationSteps: Object.freeze(stage.calculationSteps.map((step) => Object.freeze({ ...step, choices: Object.freeze(step.choices.map((choice) => Object.freeze(choice))) }))) });

export const GRADE2_LENGTH_WORKSHOP = Object.freeze({
  activityId: 'ACT-G2-MATH-LENGTH-MEASURE-CONVERT-CANDIDATE',
  revision: 1,
  title: '公分公尺測量碼頭：估一估、對一對、換一換',
  gradeId: 'grade-2', subjectId: 'mathematics', status: candidate,
  sourceKind: 'official_content_interactive_candidate_not_textbook',
  reinforcementStatus: '尚無連結的補強活動',
  runtimeModule: 'prototype/data/grade2EstimationAndLengthWorkshops.js',
  curriculumMapId: 'math-grade2-length-measure-estimate-calculate-convert', sourceId: 'mathematics',
  curriculumCodes: ['N-2-11', 'n-I-7'],
  learningSubitemClaims: ['SUB-MATH-G2-N2-11-CM-MEASURE-ESTIMATE-CONVERT'],
  sourceLocation: '教育部107年7月26日發布數學領綱：二年級學習內容表 N-2-11，PDF頁序24；同表對應表現 n-I-7。',
  curriculumScope: '依 N-2-11 練習公分與公尺的螢幕尺模型估測、零刻度對齊、讀值、比較、簡單加減及單位換算。換算示例使用個位數公尺，符合官方備註限制；畫面刻度以公分作單位並採本活動情境數值。未取代學生用直尺、三角板或捲尺測量真實物件，也未涵蓋完整測量量感、曲線測量或教師觀察。三年級毫米活動不作為本二年級條目的替代證據。',
  learningObjective: { objectiveId: 'LO-G2-MATH-LENGTH-MEASURE-CONVERT-01', statement: '先估測公分長度，再將尺的零刻度與物件起點對齊、讀取長度並比較；使用個位數公尺範圍練習公尺與公分換算。', status: candidate },
  instructions: '操作螢幕直尺：先估測，再移動尺讓 0 對準物件起點，讀取公分刻度並比較。最後用公尺和公分的關係完成換算。畫面是模擬，請在課堂用真實尺量身邊物件。',
  evidencePolicy, teacherReview: review,
  coverage: { status: 'partial', subitemId: 'SUB-MATH-G2-N2-11-CM-MEASURE-ESTIMATE-CONVERT', coveredByInteraction: ['measure_length_model', 'estimate_cm', 'align_zero_and_read_cm', 'compare_cm_lengths', 'cm_m_conversion_calculation'], notCovered: ['真實物件實測、個別單位與曲線測量', '實體尺規使用習慣及教師觀察量感'] },
  openQuestions: ['螢幕尺與數位物件是可操作模型，不等同實物直尺、三角板或捲尺測量。', '換算練習限制公尺數為個位數；未推定任何學期或教材順序。'],
  stages: Object.freeze([
    lengthStage({ stageId: 'estimate-ribbon-centimeters', prompt: '碼頭要裁一段緞帶。先估一估畫面緞帶長度，再提交估測。', objectLabel: '螢幕緞帶', lengthRules: { mode: 'estimate', unitLabel: '公分', objectLabel: '螢幕緞帶', targetLength: 18, tolerance: 2, estimateRange: { min: 5, max: 30 } }, hints: ['先用畫面上提供的公分刻度作參考，不要只看圖形外觀。', '估測落在 16 到 20 公分都符合本題模型的合理範圍。'], incorrectFeedback: '把視線對照公分尺的間距，再調整估測值；估測接近即可，不是量得精確答案。', correctFeedback: '估測完成。這是畫面長度模型，還要透過對齊尺規並讀刻度練習測量。' }),
    lengthStage({ stageId: 'align-ruler-zero-and-read-bookmark', prompt: '書籤的左端在尺旁邊。移動尺，讓 0 刻度對準起點，再讀取書籤長度。', objectLabel: '螢幕書籤', lengthRules: { mode: 'align_read', unitLabel: '公分', initialRulerZero: 0, rulerZeroRange: { min: 0, max: 6 }, maxReading: 20, object: { id: 'bookmark', label: '書籤', start: 3, length: 12 } }, hints: ['物件起點標在 3 公分位置，先移動尺讓 0 對到起點。', '起點在 3 公分、終點在 15 公分；用終點減起點讀出長度。'], incorrectFeedback: '先確認尺的 0 是否對準物件起點；若物件從非零刻度開始，要用末端刻度減起點刻度。', correctFeedback: '你先對齊零刻度，再讀出 12 公分。模擬操作不代替真實尺規測量。' }),
    lengthStage({ stageId: 'compare-and-find-centimeter-difference', prompt: '比較兩段模擬繩帶：甲長 7 公分，乙長 11 公分。逐一讀值，再找出相差多少。', lengthRules: { mode: 'compare', unitLabel: '公分', maxReading: 20, objects: [{ id: 'left', label: '甲繩帶', length: 7 }, { id: 'right', label: '乙繩帶', length: 11 }] }, hints: ['讀出兩條繩帶的公分數，不要只比較圖示長短。', '用較長的 11 公分減較短的 7 公分，找出差值。'], incorrectFeedback: '核對兩個讀值後，以較長長度減較短長度；比較數值與差值都要完成。', correctFeedback: '你用相同的公分單位比較長度並求出差值。這些物件數值是預設模型，不是真實測量。' }),
    calcStage({ stageId: 'convert-two-meters-to-centimeters', prompt: '補給繩長 2 公尺。把它換成幾公分？先填入每 1 公尺對應的公分數，再求總長。', hints: ['1 公尺等於 100 公分。', '2 個 100 公分合起來是 200 公分。'], incorrectFeedback: '先建立 1 公尺和 100 公分的關係，再依 2 公尺求總公分數。', correctFeedback: '2 公尺等於 200 公分。這裡使用個位數公尺，符合本條目的官方備註範圍。', calculationSteps: [{ id: 'meter-to-centimeter-unit', label: '1 公尺等於幾公分？', expectedValue: 100, choices: [{ value: 10, label: '10 公分' }, { value: 100, label: '100 公分' }, { value: 1000, label: '1000 公分' }] }, { id: 'two-meter-total', label: '2 個 100 公分合起來是多少？', expectedValue: 200, choices: [{ value: 20, label: '20 公分' }, { value: 200, label: '200 公分' }, { value: 300, label: '300 公分' }] }] }),
    calcStage({ stageId: 'combine-meters-and-centimeters', prompt: '地圖標記距離是 2 公尺又 35 公分。換算成幾公分？', hints: ['先把 2 公尺換成公分，再加上 35 公分。', '200 公分加 35 公分，結果是 235 公分。'], incorrectFeedback: '分開處理：公尺先換成公分，再把原有的 35 公分加上去。', correctFeedback: '2 公尺 35 公分等於 235 公分。這個個位數公尺示例是局部換算練習。', calculationSteps: [{ id: 'two-meters', label: '2 公尺是多少公分？', expectedValue: 200, choices: [{ value: 20, label: '20 公分' }, { value: 200, label: '200 公分' }, { value: 300, label: '300 公分' }] }, { id: 'add-centimeters', label: '200 公分再加 35 公分是多少？', expectedValue: 235, choices: [{ value: 225, label: '225 公分' }, { value: 235, label: '235 公分' }, { value: 255, label: '255 公分' }] }] }),
  ]),
});
