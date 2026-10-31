/**
 * Candidate-only multi-digit vertical addition/subtraction practice.
 * Original prototype examples; not copied from a textbook or approved assessment.
 */
const option = (optionId, text, errorType = null) => Object.freeze({ optionId, text, errorType });

function question({ id, prompt, operands, operator, options, answerId, answerValue, explanation, capability, prerequisiteNote, hints, wrongGuidance, errorTypes, responseDimension = 'calculation_result' }) {
  return Object.freeze({
    id,
    prompt,
    operands: Object.freeze([...operands]),
    operator,
    options: Object.freeze(options.map(([optionId, text, errorType]) => option(optionId, text, errorType))),
    answerId,
    answerValue,
    explanation,
    capability,
    prerequisiteNote,
    hints: Object.freeze(hints),
    wrongGuidance,
    errorTypes: Object.freeze(errorTypes),
    responseDimension,
  });
}

export const ADDITION_SUBTRACTION_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:chapter-scope-m3-math-addition-subtraction',
  revision: 1,
  activityId: 'ACT-M3-ADD-SUB-VERTICAL-CANDIDATE',
  levelId: 'math-addition-subtraction-vertical-candidate',
  title: '加減法大挑戰：多位數加減探險',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選範圍：練習多位數加、減直式中逐位對齊與多次進位／退位。',
    '包含算式中有 0 的題型；數值範圍、教材順序與班級先備仍待教師確認。',
    '選擇答案只顯示計算結果，不能單獨證明學生能說明位值策略。',
  ]),
  introduction: '檢查直式每一位的計算與進位／退位記號，再選出結果。這是本專案撰寫的候選練習，不是正式題庫或正式評量。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-grade3-n-3-2-add-sub',
    learningContentCode: 'N-3-2',
    stagePerformanceCode: 'n-II-2',
    officialSourceUrl: 'https://www.naer.edu.tw/upload/1/16/doc/815/%E5%8D%81%E4%BA%8C%E5%B9%B4%E5%9C%8B%E6%B0%91%E5%9F%BA%E6%9C%AC%E6%95%99%E8%82%B2%E8%AA%B2%E7%A8%8B%E7%B6%B1%E8%A6%81%E5%9C%8B%E6%B0%91%E4%B8%AD%E5%B0%8F%E5%AD%B8%E6%9A%A8%E6%99%AE%E9%80%9A%E5%9E%8B%E9%AB%98%E7%B4%9A%E4%B8%AD%E7%AD%89%E5%AD%B8%E6%A0%A1-%E6%95%B8%E5%AD%B8%E9%A0%98%E5%9F%9F.pdf',
    officialSourceLocation: '伍／二／三年級學習內容表 N-3-2，PDF 頁序 P25；對應欄 n-II-2。n-II-2 原文位於伍／一／第二學習階段表現表，PDF 頁序 P11。',
    verifiedOfficialScope: 'N-3-2：「加減直式計算：含加、減法多次進、退位。須處理數字中有0的題型。教學可先在有位值的表格中學習計算。」n-II-2：「熟練較大位數之加、減、乘計算或估算，並能應用於日常解題。」',
    alignmentBoundary: '本候選僅練習選擇式多位數直式加減、多次進退位及含 0 算式；不含估算或生活應用題，也不能由選項作答確認計算策略。N-3-2 列於三年級內容表；n-II-2 是第二學習階段表現，不代表三年級特定學期進度。',
    gradeAndScheduleStatus: 'grade_content_listed_annual_and_class_schedule_pending_teacher_review',
  }),
  questions: Object.freeze([
    question({
      id: 'ADD-SUB-DRAFT-M3-N32-01',
      prompt: '探險隊把 2,468 枚石片和 1,756 枚石片合在一起。依直式逐位計算，總數是多少？',
      operands: [2468, 1756], operator: '+',
      options: [['add-01-4214', '4,214', 'carry_not_propagated'], ['add-01-4224', '4,224'], ['add-01-4234', '4,234', 'place_alignment_or_carry_error']],
      answerId: 'add-01-4224', answerValue: 4224,
      explanation: '由個位起算：8+6 得 14，個位寫 4、向十位進 1；6+5+1 得 12，十位寫 2、再進 1；4+7+1 得 12，百位寫 2、再進 1；千位為 2+1+1=4，所以是 4,224。',
      capability: '執行含多次進位的直式加法；單選結果不能證明學生理解每次進位的位值理由。',
      prerequisiteNote: '需確認兩數直式對齊、基本加法事實及進位記號已教；實際位數與進位難度須教師依教材和班級進度確認。',
      hints: ['先把相同位值上下對齊，並從個位開始逐欄檢查。', '每欄相加後，若結果滿十，保留個位數並把多出的十個一換成下一欄的一個單位；逐欄延續。'],
      wrongGuidance: '可把各欄的和與進位記號分開核對，尤其留意進位是否帶到下一欄。錯誤選項只作待觀察線索，並不能確診原因。',
      errorTypes: { 'add-01-4214': 'carry_not_propagated', 'add-01-4234': 'possible_place_or_carry_tracking_error' },
    }),
    question({
      id: 'ADD-SUB-DRAFT-M3-N32-02',
      prompt: '倉庫原有 3,086 顆星砂，又收到 1,759 顆。算式 3,086 + 1,759 的結果是多少？',
      operands: [3086, 1759], operator: '+',
      options: [['add-02-4745', '4,745', 'zero_place_or_carry_error'], ['add-02-4845', '4,845'], ['add-02-4855', '4,855', 'carry_recording_error']],
      answerId: 'add-02-4845', answerValue: 4845,
      explanation: '個位 6+9=15，寫 5 進 1；十位 8+5+1=14，寫 4 進 1；百位 0+7+1=8；千位 3+1=4，結果為 4,845。算式含 0，百位仍須按位值計算。',
      capability: '處理含 0 且有多次進位的直式加法；無法僅由答案分辨零位值理解或進位紀錄原因。',
      prerequisiteNote: '除直式對齊與進位先備外，需確認學生理解數字 0 在空位上仍保留位序；班級是否已教此題型待教師確認。',
      hints: ['先看每個數字所在的欄位，0 也佔有一個位值位置。', '從個位往左逐欄計算；把前一欄留下的進位一併放入下一欄。'],
      wrongGuidance: '回到位值欄核對，確認 0 沒有讓後面的數字移欄，並檢查前一欄的進位是否帶入。此錯答可能由多種因素造成。',
      errorTypes: { 'add-02-4745': 'possible_zero_place_or_carry_error', 'add-02-4855': 'possible_carry_recording_error' },
    }),
    question({
      id: 'ADD-SUB-DRAFT-M3-N32-03',
      prompt: '探險隊有 5,234 枚徽章，拿出 1,786 枚作展示。還剩多少枚？',
      operands: [5234, 1786], operator: '−',
      options: [['sub-03-3448', '3,448'], ['sub-03-3458', '3,458', 'borrow_not_recorded'], ['sub-03-3548', '3,548', 'placewise_subtraction_error']],
      answerId: 'sub-03-3448', answerValue: 3448,
      explanation: '由個位向左逐欄退位：個位借後 14−6=8；十位借後 12−8=4；百位借後 11−7=4；千位剩 3。結果為 3,448。',
      capability: '執行含多次退位的直式減法；僅選結果不能確認學生能解釋跨欄退位。',
      prerequisiteNote: '需確認直式對齊、基本減法及退位時位值單位轉換的教學先備；先備與此多次退位難度須教師確認。',
      hints: ['先對齊相同位值，從個位開始，逐欄檢查上方數字是否足夠減。', '某欄不夠減時，查看是否需要向左邊相鄰欄借一個較大的位值單位，再檢查被借欄的數值變化。'],
      wrongGuidance: '逐欄追蹤借位後兩欄的變化，避免只改目前一欄而忘記左側被借欄也要調整。選項不是已確診迷思。',
      errorTypes: { 'sub-03-3458': 'possible_borrow_not_recorded', 'sub-03-3548': 'possible_placewise_or_borrow_error' },
    }),
    question({
      id: 'ADD-SUB-DRAFT-M3-N32-04',
      prompt: '石碑記錄原有 5,002 個光點，熄滅 1,768 個。依直式計算還剩多少個？',
      operands: [5002, 1768], operator: '−',
      options: [['sub-04-3234', '3,234'], ['sub-04-3324', '3,324', 'borrow_across_zero_error'], ['sub-04-4234', '4,234', 'zero_place_error']],
      answerId: 'sub-04-3234', answerValue: 3234,
      explanation: '個位需退位，須從左側跨過十位與百位的 0 依序重新分解；完成後個位 12−8=4、十位 9−6=3、百位 9−7=2、千位 4−1=3，得 3,234。',
      capability: '處理減法算式中有 0、且需跨欄多次退位的候選題型。',
      prerequisiteNote: '需確認學生已學過跨越連續 0 的退位與中間位值重新分解；這項具體先備及難度安排必須由教師確認。',
      hints: ['觀察個位需要退位時，左側相鄰欄的值是否足夠；留意中間的 0。', '沿著位值欄由左向右追蹤重新分解：借出的欄位會改變，經過的 0 也須依位值關係調整。'],
      wrongGuidance: '把千、百、十、個欄的借位變化逐欄寫下，再重新計算；特別檢查跨過 0 時中間欄如何取得一個較小位值單位。單次錯答無法指出具體原因。',
      errorTypes: { 'sub-04-3324': 'possible_borrow_across_zero_tracking_error', 'sub-04-4234': 'possible_zero_place_or_regrouping_error' },
    }),
    question({
      id: 'ADD-SUB-DRAFT-M3-N32-05-STRATEGY',
      prompt: '個位相加得到 14 個一，若個位保留 4，下面哪個說法能解釋其餘數量的重新分組？',
      operands: [14], operator: 'strategy',
      options: [
        ['str-05-ten', '把 10 個一換成 1 個十，記在十位。'],
        ['str-05-ones', '把 10 個一仍記在個位，不改變十位。', 'possible_regrouping_not_completed'],
        ['str-05-hundreds', '把 10 個一換成 1 個百，記在百位。', 'possible_place_unit_confusion'],
      ],
      answerId: 'str-05-ten', answerValue: null,
      explanation: '10 個一可以重新分組成 1 個十；個位留下 4 個一，這 1 個十要記到十位。這題只檢視對已給定情境的策略說明選擇，不測量自行完成整道計算。',
      capability: '候選策略說明：辨認 10 個一可重新分組為 1 個十；選擇式作答不能單獨證明穩定理解或實際計算策略。',
      prerequisiteNote: '需確認學生已學個位、十位及十進位重新分組；教材、授課順序與用語適切性待教師確認。',
      hints: [
        '把 14 個一分成一組十個一和剩下的個，想想這組十個一可以怎麼表示。',
        '回想 10 個一與相鄰較大位值單位的關係，再判斷應記在哪個欄位。',
      ],
      wrongGuidance: '請將 14 個一重新分成十個一與剩下的個，並確認十個一等值於哪一個相鄰位值單位。選項只提供待觀察線索，不能單次診斷錯誤原因。',
      errorTypes: { 'str-05-ones': 'possible_regrouping_not_completed', 'str-05-hundreds': 'possible_place_unit_confusion' },
      responseDimension: 'strategy_explanation',
    }),
  ]),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
  reinforcementActivities: Object.freeze([]),
  missingCoverage: Object.freeze([
    '學生自行書寫／口述並在新算式中運用進退位策略的證據；第五題只檢視一個已給定的策略說明選擇。',
    '估算與計算結果合理性檢驗、日常應用解題（n-II-2 的階段表現範圍較廣，本活動未涵蓋）。',
    '教師確認的先備、數值範圍、題目順序、獨立檢核規準及真正連結的補強活動。',
  ]),
});

export function validateAdditionSubtractionLearningUnit(unit = ADDITION_SUBTRACTION_LEARNING_UNIT) {
  const errors = [];
  if (unit.status !== 'candidate_pending_teacher_review' || unit.formalAssessment !== false) errors.push('addition_subtraction_unit_must_remain_candidate');
  if (unit.curriculumReferences?.learningContentCode !== 'N-3-2' || unit.curriculumReferences?.stagePerformanceCode !== 'n-II-2') errors.push('addition_subtraction_curriculum_reference_mismatch');
  const ids = unit.questions.map(({ id }) => id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !id.startsWith('ADD-SUB-DRAFT-M3-N32-'))) errors.push('addition_subtraction_question_ids_invalid_or_duplicate');
  for (const q of unit.questions) {
    const optionIds = q.options.map(({ optionId }) => optionId);
    if (new Set(optionIds).size !== optionIds.length || q.options.filter(({ optionId }) => optionId === q.answerId).length !== 1) errors.push(`addition_subtraction_options_or_answer_invalid:${q.id}`);
    if (!q.explanation || !q.capability || !q.prerequisiteNote || !q.wrongGuidance || q.hints?.length !== 2) errors.push(`addition_subtraction_required_data_missing:${q.id}`);
    if (!['calculation_result', 'strategy_explanation'].includes(q.responseDimension)) errors.push(`addition_subtraction_response_dimension_invalid:${q.id}`);
    if (q.responseDimension === 'strategy_explanation' && q.operator !== 'strategy') errors.push(`addition_subtraction_strategy_item_operator_invalid:${q.id}`);
    if (q.responseDimension === 'calculation_result') {
      if (q.operator === '+' && q.operands[0] + q.operands[1] !== q.answerValue) errors.push(`addition_subtraction_arithmetic_mismatch:${q.id}`);
      if (q.operator === '−' && q.operands[0] - q.operands[1] !== q.answerValue) errors.push(`addition_subtraction_arithmetic_mismatch:${q.id}`);
      if (!['+', '−'].includes(q.operator) || !q.options.some(({ optionId, text }) => optionId === q.answerId && text.replaceAll(',', '') === String(q.answerValue))) errors.push(`addition_subtraction_answer_option_mismatch:${q.id}`);
    } else if (q.answerValue !== null || q.options.filter(({ optionId }) => optionId === q.answerId).length !== 1) {
      errors.push(`addition_subtraction_strategy_answer_invalid:${q.id}`);
    }
  }
  if (unit.reinforcementActivities?.length || unit.remediationPolicy !== 'not_provided') errors.push('addition_subtraction_remediation_must_not_be_claimed');
  return errors;
}
