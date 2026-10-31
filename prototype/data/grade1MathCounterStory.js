export const GRADE1_MATH_COUNTER_STORY = Object.freeze({
  activityId: 'ACT-G1-MATH-COUNTER-STORY-CANDIDATE', revision: 1,
  title: '花片故事劇場：合起來與拿走', gradeId: 'grade-1', subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade1-add-sub-meaning', sourceId: 'mathematics', curriculumCodes: ['N-1-2', 'N-1-3', 'R-1-1', 'n-I-2'],
  curriculumScope: '官方一年級加減意義與基本加減法候選局部參照；情境數量小於 10。只練習合起來與拿走的模型，並不代表涵蓋所有加減應用類型或達到熟練標準。',
  learningObjective: { objectiveId: 'LO-G1-MATH-COUNTER-STORY-01', statement: '操作花片故事並依情境排列簡單加法或減法算式。', status: 'candidate_pending_teacher_review' },
  instructions: '看故事裡花片怎麼變化，將數字和符號卡排成記錄故事的算式。數學情境為原創候選內容。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'join-two-groups', interaction: 'assemble_response', prompt: '桌上有 3 片紅花片，又放上 2 片藍花片。排出表示「合起來」的算式。', tokens: Object.freeze([
      Object.freeze({ id: 'add-3', text: '3' }), Object.freeze({ id: 'add-sign', text: '+' }), Object.freeze({ id: 'add-2', text: '2' }), Object.freeze({ id: 'add-equals', text: '=' }), Object.freeze({ id: 'add-5', text: '5' }),
    ]), correctOptionIds: Object.freeze(['add-3', 'add-sign', 'add-2', 'add-equals', 'add-5']), hints: Object.freeze(['先想故事中的兩群花片是合在一起，還是拿走一部分。', '先排兩群原有數量和表示合起來的符號，再排結果。']), incorrectFeedback: '把故事畫成兩群花片：沒有拿走，兩群要合成一群；再核對算式中的數量。', correctFeedback: '算式記錄了兩群花片合起來的情況。接著看一個拿走花片的故事。' }),
    Object.freeze({ stageId: 'take-away-petals', interaction: 'assemble_response', prompt: '花籃有 7 片花瓣，拿走 3 片做卡片。排出表示剩下花瓣的算式。', tokens: Object.freeze([
      Object.freeze({ id: 'take-7', text: '7' }), Object.freeze({ id: 'take-minus', text: '−' }), Object.freeze({ id: 'take-3', text: '3' }), Object.freeze({ id: 'take-equals', text: '=' }), Object.freeze({ id: 'take-4', text: '4' }),
    ]), correctOptionIds: Object.freeze(['take-7', 'take-minus', 'take-3', 'take-equals', 'take-4']), hints: Object.freeze(['先找原來有幾片，以及故事中發生了什麼改變。', '拿走的數量要從原來的數量中減去；可用花片逐片移開檢查結果。']), incorrectFeedback: '請先擺出七片，再移走三片並數一數留下幾片；算式要記錄「移走後剩下」。', correctFeedback: '你把拿走情境記成算式並核對剩餘數量。此候選活動不是正式計算熟練度評量。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['適用的加減學習進度及學生對 +、−、= 的先備需教師確認。', '遊戲以文字模擬花片，並非實物操作；需評估文字閱讀是否干擾數學作答。']),
});
