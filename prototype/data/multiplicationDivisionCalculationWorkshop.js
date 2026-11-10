const choices = (values) => Object.freeze(values.map((value) => Object.freeze({ value, label: String(value) })));
const step = (id, label, expectedValue, incorrectFeedback) => Object.freeze({ id, label, expectedValue, choices: choices([expectedValue, expectedValue + 1, expectedValue > 0 ? expectedValue - 1 : 2]), incorrectFeedback });

export const MULTIPLICATION_DIVISION_CALCULATION_WORKSHOP = Object.freeze({
  activityId: 'ACT-G3-MATH-MULTIPLICATION-DIVISION-CALCULATION-CANDIDATE', revision: 2,
  title: '乘除計算工坊：位值步驟修復', gradeId: 'grade-3', subjectId: 'mathematics', status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_game_content_not_from_textbook', curriculumMapId: 'math-grade3-n-3-3-one-digit-multiplication',
  relatedCurriculumMapIds: ['math-grade3-n-3-5-one-digit-division'], sourceId: 'mathematics', curriculumCodes: ['N-3-3', 'N-3-5', 'n-II-2', 'n-II-3'], curriculumAlignment: 'partial',
  coverage: Object.freeze({ subitemId: 'SUB-MATH-G3-N3-3-AND-N3-5-PLACE-VALUE-ALGORITHM', coveredByInteraction: ['complete_calculation_steps'], notCovered: ['所有乘除算法情境', '完整非整除直式算法', '學生自行書寫直式與口頭說明'] }),
  learningSubitemClaims: Object.freeze(['SUB-MATH-G3-N3-3-PLACE-VALUE-MULTIPLICATION', 'SUB-MATH-G3-N3-5-PLACE-VALUE-DIVISION']),
  curriculumScope: '候選練習以位值步驟呈現一位數乘二／三位數直式與二／三位數除以一位數直式，包含 0 的位置處理。乘法各步驟使用分位後的部分積及進位；除法包含整除例及兩個商與餘數計算候選例。未涵蓋完整非整除直式算法或所有乘除應用。官方數學領綱 PDF 伍／二：N-3-3 PDF 頁序 25、N-3-5 PDF 頁序 26；對應 n-II-2、n-II-3 為第二學習階段表現，學期進度待教師確認。',
  learningObjective: { objectiveId: 'LO-G3-MATH-CALCULATION-CANDIDATE-01', statement: '依位值逐步選擇一位數乘法與整除除法直式中的中間數字，留意 0 的位置，並用分組數量計算商、餘數和驗算。', status: 'candidate_pending_teacher_review' },
  instructions: '逐步修復計算板上的中間步驟。每個欄位都要選一個數字；檢查錯誤時會指出第一個需要回看的步驟。這是候選練習，不記錄正式成績。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'multiply-236-by-3', interaction: 'complete_calculation_steps', calculationTitle: '236 × 3：依個位、十位、百位往上計算', prompt: '完成每一步的部分積、寫下的數字與進位。', calculationSteps: Object.freeze([
      step('ones-product', '個位：6 × 3 的乘積', 18, '先只算個位的 6 × 3，再判斷哪些寫在個位、哪些要進到十位。'), step('ones-write', '個位寫下', 8, '個位只寫乘積的個位數；另一部分要記作進位。'), step('carry-to-tens', '進到十位的數', 1, '18 個一可重新組成 1 個十和 8 個一。'), step('tens-product', '十位：3 × 3，再加進位', 10, '十位要把 3 個十乘 3，再加上前一步進來的十。'), step('tens-write', '十位寫下', 0, '把十位計算結果分成寫下的十位數字和要進位的數。'), step('carry-to-hundreds', '進到百位的數', 1, '十位結果滿十個十時，要換成百位。'), step('hundreds-result', '百位：2 × 3，再加進位', 7, '最後處理百位數字並加上十位進來的百。'),
    ]) , hints: ['從個位欄開始，不要一次跳到整個答案。', '每個乘積都拆成「本位寫下」與「進到左邊一位」；十位也要加上前一步的進位。'], incorrectFeedback: '先從目前第一個不一致的計算步驟重算，確認寫下的位數與進位沒有混在一起。', correctFeedback: '你依序處理了各位與進位。結果 708；完成這個例子不代表所有乘法直式已熟練。', resultValue: 708 }),
    Object.freeze({ stageId: 'multiply-304-by-2-transfer', interaction: 'complete_calculation_steps', calculationTitle: '304 × 2：檢查中間的 0', prompt: '換一個有中間 0 的被乘數，逐位完成計算，確認 0 仍留在正確位值。', calculationSteps: Object.freeze([
      step('ones-product', '個位：4 × 2', 8, '先算個位的 4 × 2，結果留在個位。'),
      step('tens-product', '十位：0 × 2', 0, '被乘數有 0 個十，乘完仍是 0 個十；不能略去這個位值位置。'),
      step('hundreds-product', '百位：3 × 2', 6, '3 個百乘 2，結果是 6 個百。'),
      step('product', '組合個、十、百位', 608, '依位值把 8 個一、0 個十與 6 個百組合成數。'),
    ]), hints: ['先依個、十、百位分開處理，不要把 304 看成 34。', '十位的 0 代表沒有十，但組合答案時仍要保留十位。'], incorrectFeedback: '檢查是否把被乘數中間的 0 位值略掉；依序確認個位、十位、百位，再組合結果。', correctFeedback: '304 × 2 = 608；中間的 0 保留十位位置。這是候選遷移題，未涵蓋所有乘法直式。', resultValue: 608 }),
    Object.freeze({ stageId: 'divide-408-by-2', interaction: 'complete_calculation_steps', calculationTitle: '408 ÷ 2：保留十位的 0', prompt: '完成整除除法的位值步驟，注意十位沒有分到數量時仍要保留位置。', calculationSteps: Object.freeze([
      step('hundreds-share', '4 個百平均分給 2 組，每組幾個百？', 2, '先把百位的 4 個百平均分成 2 組。'), step('tens-placeholder', '十位沒有十可分，商的十位要寫', 0, '這一位沒有十可分，但商仍要保留十位的位置。'), step('ones-share', '8 個一平均分給 2 組，每組幾個一？', 4, '最後將 8 個一平均分成 2 組。'), step('quotient-ones', '商是', 204, '把百位、十位佔位 0 和個位依序組成商。'),
    ]), hints: ['除法依百、十、個的位值順序處理。', '某一位沒有可分配的十時，商仍需要該位的 0 作為佔位。'], incorrectFeedback: '檢查每一位的分配，尤其十位沒有數量可分時，不要把後面的個位向左移。', correctFeedback: '4 個百各分 2 個百、0 個十仍佔住十位、8 個一各分 4 個一，所以商為 204。只驗證這個整除例，不含餘數處理。' }),
    Object.freeze({ stageId: 'divide-636-by-3-transfer', interaction: 'complete_calculation_steps', calculationTitle: '636 ÷ 3：逐位分配再組合商', prompt: '換一個三位數整除情境，依位值完成百、十、個位的分配。', calculationSteps: Object.freeze([
      step('hundreds-share', '6 個百平均分給 3 組', 2, '先平均分百位的 6 個百。'),
      step('tens-share', '3 個十平均分給 3 組', 1, '再把 3 個十平均分給 3 組。'),
      step('ones-share', '6 個一平均分給 3 組', 2, '最後平均分配個位的 6 個一。'),
      step('quotient', '依百、十、個位組成商', 212, '把每組的 2 個百、1 個十、2 個一依位值組成商。'),
    ]), hints: ['每一位都要平均分給 3 組，依序處理百、十、個。', '把各位「每組分到多少」放回相同位值，再組合成商。'], incorrectFeedback: '回到出錯的位值步驟，確認每一位都分給 3 組，並依序組成商。', correctFeedback: '636 ÷ 3 = 212。這是位值分配的整除練習，不涵蓋餘數算法或所有除法直式。' }),
    Object.freeze({ stageId: 'divide-23-by-4-remainder', interaction: 'complete_calculation_steps', calculationTitle: '23 ÷ 4：商與餘數', prompt: '23 顆積木每 4 顆一組，選出完整組數、剩餘顆數，再驗算原有的數量。', calculationSteps: Object.freeze([step('quotient','最多完整組數',5,'4×5＝20，4×6超過23。'),step('used','完整組共使用幾顆',20,'用4乘以5。'),step('remainder', '剩下幾顆', 3, '23 減去 20。'), step('check-total', '完整組用掉的數量加餘數', 23, '把 20 和餘數 3 合起來。')]), hints: ['找不超過23的最大4的倍數。','餘數必須小於4。'], incorrectFeedback: '檢查4×商＋餘數是否等於23。', correctFeedback: '23÷4＝5餘3；4×5＋3＝23。' }),
    Object.freeze({ stageId: 'divide-29-by-6-remainder-transfer', interaction: 'complete_calculation_steps', calculationTitle: '29 ÷ 6：遷移練習', prompt: '29顆積木每6顆一組，求商與餘數。', calculationSteps: Object.freeze([step('quotient','完整組數',4,'6×4＝24，6×5超過29。'),step('used','已分組數量',24,'6乘以4。'),step('remainder','餘數',5,'29減24。')]), hints: ['找不超過29的最大6的倍數。','餘數小於6。'], incorrectFeedback: '用乘法和加法驗算。', correctFeedback: '29÷6＝4餘5；6×4＋5＝29。' }),
  ]),
  reinforcementActivityIds: [], reinforcementStatus: '尚無連結的補強活動', evidencePolicy: { persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false },
  teacherReview: { status: 'not_reviewed', reviewer: null, reviewedAt: null }, openQuestions: ['教師確認乘法進位及除法含 0 直式先備、教材安排與以數字格操作的適切性。', '新增兩個商與餘數候選例，完整非整除直式及分組實物操作仍待補強。'],
});
