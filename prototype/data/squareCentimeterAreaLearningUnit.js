/**
 * Candidate-only square-centimeter activity. Question content is authored for
 * this prototype, not copied from a textbook or approved assessment.
 */
const option = (optionId, text) => Object.freeze({ optionId, text });

export function countUnitSquares(rows) {
  if (!Array.isArray(rows) || rows.some((row) => !Array.isArray(row))) return 0;
  return rows.flat().filter(Boolean).length;
}

const questionFromGrid = ({ id, prompt, rows, options, answerId, explanation, capability, prerequisiteNote, hints, wrongGuidance, visualizationType = 'grid', comparisonRows = null }) => Object.freeze({
  id,
  prompt,
  options: Object.freeze(options.map(([optionId, text]) => option(optionId, text))),
  answerId,
  explanation,
  capability,
  prerequisiteNote,
  hints: Object.freeze(hints),
  wrongGuidance,
  visualization: Object.freeze({
    type: visualizationType,
    rows: Object.freeze(rows.map((row) => Object.freeze([...row]))),
    ...(comparisonRows ? { figures: Object.freeze([rows, comparisonRows].map((figureRows) => Object.freeze(figureRows.map((row) => Object.freeze([...row]))))) } : {}),
    unitSideCm: 1,
  }),
});

const q1Rows = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
const q2Rows = [[1, 1, 1], [1, 0, 0], [1, 0, 0]];
const q3A = [[1, 1, 1], [1, 1, 1]];
const q3B = [[1, 1, 1], [1, 1, 0], [1, 1, 0]];
const q4Rows = [[1]];

export const SQUARE_CENTIMETER_AREA_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:chapter-scope-m3-math-area-square-centimeter',
  revision: 1,
  activityId: 'ACT-M3-AREA-SQUARE-CENTIMETER-CANDIDATE',
  levelId: 'math-area-square-centimeter-candidate',
  title: '面積建造師：平方公分探險',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選方向：以 1 平方公分單位方格覆蓋或點數簡單圖形。',
    '候選方向：根據完整單位方格比較簡單圖形面積。',
    '適用年級、學期、教材順序及先備能力仍待教師確認。',
  ]),
  introduction: '用相同大小的方格鋪設地板，再觀察覆蓋了多少個單位方格。這是待教師審查的候選互動原型，不是正式題庫或學習成效檢核。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-grade3-n-3-14-area',
    learningContentCode: 'N-3-14',
    stagePerformanceCode: 'n-II-9',
    officialSourceLocation: '專案既有官方課綱登錄：伍／二／三年級學習內容 N-3-14，PDF 頁序 P27；n-II-9 為第二學習階段表現。',
    alignmentBoundary: '課綱對應是候選追溯參照；面積題逐題適切性、班級授課與學期進度未核定。未設計一般面積公式、不規則部分方格估算或周長比較。',
    gradeAndScheduleStatus: 'grade_content_in_official_map_annual_schedule_and_class_progress_pending',
  }),
  questions: Object.freeze([
    questionFromGrid({
      id: 'AREA-DRAFT-M3-N314-01',
      prompt: '建造地板時，每一格都是邊長 1 公分的正方形。圖中一共鋪了幾個完整小方格？',
      rows: q1Rows,
      options: [['area-01-9', '9 個'], ['area-01-12', '12 個'], ['area-01-16', '16 個']],
      answerId: 'area-01-12',
      explanation: '每一個完整小方格代表 1 平方公分；數一數全部完整方格，共 12 個，因此這片地板的面積是 12 平方公分。',
      capability: '由方格圖點數簡單矩形的單位方格數，連結面積單位。',
      prerequisiteNote: '需教師確認學生已理解 1 公分長度、正方形單位方格及逐格點數；方格數量由圖形直接決定。',
      hints: ['先從同一列開始，沿著格線逐格數，不要數外框線。', '可以分列點數，再把各列的格數合起來；每格的面積單位相同。'],
      wrongGuidance: '請檢查自己數的是小方格區域，而不是邊線或外框；也可逐列重新點數。一次錯答不能判定錯誤原因。',
    }),
    questionFromGrid({
      id: 'AREA-DRAFT-M3-N314-02',
      prompt: '這個花園形狀由完整的 1 平方公分小方格組成。它覆蓋幾平方公分？',
      rows: q2Rows,
      options: [['area-02-4', '4 平方公分'], ['area-02-5', '5 平方公分'], ['area-02-6', '6 平方公分']],
      answerId: 'area-02-5',
      explanation: '圖中共有 5 個完整的單位方格。每格是 1 平方公分，合起來是 5 平方公分。',
      capability: '點數不規則排列但由完整單位方格組成的圖形。',
      prerequisiteNote: '需教師確認學生能依形狀逐格點數，並理解每格代表相同面積；此題不涉及部分方格估算。',
      hints: ['形狀轉彎了也可以逐格數；從一個角落開始，避免重複數同一格。', '試著按橫列或直列分組點數，並留意每個有填色的小格都只數一次。'],
      wrongGuidance: '回看轉彎處的小格，按列或直列重新點數；請確認沒有漏數或重複數格。這些只是可能原因，需觀察作答過程才能判斷。',
    }),
    questionFromGrid({
      id: 'AREA-DRAFT-M3-N314-03',
      prompt: '甲、乙兩塊花圃都用同樣大小的 1 平方公分方格表示。哪一塊花圃的面積比較大？',
      rows: q3A,
      options: [['area-03-a', '甲花圃'], ['area-03-b', '乙花圃'], ['area-03-same', '一樣大']],
      answerId: countUnitSquares(q3A) > countUnitSquares(q3B) ? 'area-03-a' : countUnitSquares(q3A) < countUnitSquares(q3B) ? 'area-03-b' : 'area-03-same',
      explanation: `甲有 ${countUnitSquares(q3A)} 個、乙有 ${countUnitSquares(q3B)} 個相同大小的單位方格；比較方格總數即可比較這兩個圖形的面積。`,
      capability: '以相同單位方格的數量比較兩個簡單圖形面積。',
      prerequisiteNote: '需確認學生已能點數不規則排列的單位方格；比較面積是依兩圖共用相同單位方格表示，不涉及長度或周長。',
      hints: ['先分別點數甲、乙圖中的完整小方格。', '只有在兩圖的單位方格大小相同時，才能直接比較方格數；比較兩個總數即可。'],
      wrongGuidance: '請分開記下甲、乙的單位方格數，再比較兩個數；不要只看圖形外框長短。單次選擇不代表已診斷出周長與面積混淆。',
      visualizationType: 'comparison',
      comparisonRows: q3B,
    }),
    questionFromGrid({
      id: 'AREA-DRAFT-M3-N314-04',
      prompt: '圖中的小正方形每一邊都是 1 公分。這一個小正方形的面積單位應怎麼寫？',
      rows: q4Rows,
      options: [['area-04-cm', '1 公分'], ['area-04-cm2', '1 平方公分'], ['area-04-2cm2', '2 平方公分']],
      answerId: 'area-04-cm2',
      explanation: '面積用平方單位表示。這個單位方格是邊長 1 公分的正方形，所以它代表 1 平方公分；本題不要求套用一般面積公式。',
      capability: '辨認單位方格與平方公分面積單位的連結。',
      prerequisiteNote: '需確認學生已學公分作為長度單位，並能區分長度與面積單位；此適切性需教師審查。',
      hints: ['想一想：題目描述的是一條邊的長度，還是整個正方形占的面積？', '面積單位會表達正方形方格覆蓋的大小，注意單位名稱是否包含「平方」。'],
      wrongGuidance: '請先分辨「公分」描述邊長，「平方公分」描述面積；不要把長度單位直接當作面積單位。需由教師確認此先備是否已教。',
    }),
  ]),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
  reinforcementActivities: Object.freeze([]),
});
