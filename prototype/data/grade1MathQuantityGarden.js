export const GRADE1_MATH_QUANTITY_GARDEN = Object.freeze({
  activityId: 'ACT-G1-MATH-QUANTITY-GARDEN-CANDIDATE', revision: 1,
  title: '數字果園：數量裝箱', gradeId: 'grade-1', subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade1-count-place-value', sourceId: 'mathematics', curriculumCodes: ['N-1-1', 'n-I-1'],
  curriculumScope: '官方一年級內容 N-1-1：一百以內的數及操作、多少與順序、個與十位值；本活動只局部練習少量物件陣列點數與數量符號連結，不代表完整涵蓋 N-1-1。',
  learningObjective: { objectiveId: 'LO-G1-MATH-QUANTITY-GARDEN-01', statement: '以排列物件的方式建立小數量，逐一點數並選出對應的數字。', status: 'candidate_pending_teacher_review' },
  instructions: '把果子排進籃格，數一數有幾個，再找出相同數量的數字卡。操作只在本次遊戲記憶體中進行。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'arrange-eight-fruits', interaction: 'build_array', prompt: '請把果子排成 2 排，每排 4 個。', arrayRules: Object.freeze({ targetRows: 2, targetColumns: 4, maxRows: 4, maxColumns: 5 }), hints: Object.freeze(['先看任務要幾排，再看每排要幾個。', '用「排數 × 每排個數」核對排列；不要只看畫面占了幾格。']), incorrectFeedback: '請逐排點數，檢查是否有兩排且每排四個；排數和每排數量要一起符合任務。', correctFeedback: '你完成兩排、每排四個的排列。接著把實際數量連到數字符號。' }),
    Object.freeze({ stageId: 'match-fruit-count', interaction: 'choose_response', prompt: '剛才的果子一共有幾個？選一張數字卡。', options: Object.freeze([
      Object.freeze({ id: 'fruit-count-6', text: '6 個', feedback: '請重新逐排點數，避免漏掉其中一排。' }),
      Object.freeze({ id: 'fruit-count-8', text: '8 個', feedback: '兩排各四個，逐一點數後可核對總量。' }),
      Object.freeze({ id: 'fruit-count-9', text: '9 個', feedback: '請檢查是否把空格也算成果子。' }),
    ]), correctOptionIds: Object.freeze(['fruit-count-8']), hints: Object.freeze(['可以每排分開數，再把兩排合起來。', '重新看操作板上的果子，不要把空格算進去。']), incorrectFeedback: '請用手指或逐格點數畫面中的果子，再把數到的數量和數字卡對照。', correctFeedback: '數字符號和排列數量相符。本活動只練習此小數量，不能據此判定已掌握一百以內數或位值。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['一年級實際進度與此小數量活動的適用時機待教師確認。', '陣列排列是否有助目標學生逐一點數，需教師檢視；此處不教乘法。']),
});
