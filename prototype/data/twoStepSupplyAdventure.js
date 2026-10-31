export const TWO_STEP_SUPPLY_ADVENTURE = Object.freeze({
  activityId: 'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE', revision: 1, title: '兩步驟任務探險：補給分裝站',
  gradeId: 'grade-3', subjectId: 'mathematics', status: 'candidate_pending_teacher_review', sourceKind: 'original_candidate_game_content_not_from_textbook',
  curriculumMapId: 'math-grade3-n-3-7-two-step-problems', sourceId: 'mathematics', curriculumCodes: ['N-3-7', 'n-II-5'], curriculumAlignment: 'partial',
  curriculumScope: '官方 N-3-7 列於三年級學習內容表：兩步驟加減與除、連乘應用，不含併式；乘除混合與連除在 N-4-3。此任務只做「加法後除法」的逐步情境之一，沒有併式，也不涵蓋其他類型。官方 PDF 伍／二，PDF 頁序 26。n-II-5 為第二學習階段表現，不推定三年級學期安排。',
  learningSubitemClaims: ['SUB-MATH-G3-N3-7-ADD-THEN-EQUAL-SHARE-STEPS'],
  coverage: { subitemId: 'SUB-MATH-G3-N3-7-ADD-THEN-EQUAL-SHARE-STEPS', coveredByInteraction: ['complete_calculation_steps', 'choose_response'], notCovered: ['連乘情境', '減法後除法情境', '併式', '不同除法未知量與非整除情境'] },
  learningObjective: { objectiveId: 'LO-G3-MATH-TWO-STEP-CANDIDATE-01', statement: '先求補給總數，再用前一步結果平均分裝，能依序解決一種加法後除法的兩步驟問題。', status: 'candidate_pending_teacher_review' },
  instructions: '先算新收到的補給總數。第一步完成後，遊戲會保留中間結果；第二步再把這個結果平均分裝。兩步分開作答，不需要寫成一個合併算式。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'add-arriving-supplies', interaction: 'complete_calculation_steps', prompt: '倉庫原有 18 個水壺，探險隊又送來 6 個。先把 6 拆成「到 20 還需要的數」和「剩下的數」，完成計算步驟。', resultValue: 24, calculationTitle: '先湊整十，再合併剩下的水壺',
      calculationSteps: Object.freeze([
        Object.freeze({ id: 'bridge-to-twenty', label: '18 還需要幾個到 20？', expectedValue: 2, choices: Object.freeze([{ value: 1, label: '1 個' }, { value: 2, label: '2 個' }, { value: 3, label: '3 個' }]), incorrectFeedback: '18 到 20 還差 2；這一步只找湊成整十所需的數量。' }),
        Object.freeze({ id: 'remaining-from-six', label: '6 拆出 2 個後，還剩幾個？', expectedValue: 4, choices: Object.freeze([{ value: 3, label: '3 個' }, { value: 4, label: '4 個' }, { value: 5, label: '5 個' }]), incorrectFeedback: '把送來的 6 個先拿出 2 個補到 20，剩下 4 個。' }),
        Object.freeze({ id: 'finish-supply-total', label: '20 再加上剩下的 4 個，共有幾個？', expectedValue: 24, choices: Object.freeze([{ value: 22, label: '22 個' }, { value: 24, label: '24 個' }, { value: 26, label: '26 個' }]), incorrectFeedback: '先完成 18+2=20，再把剩下的 4 個加上；不要提前進入分裝。' }),
      ]),
      hints: Object.freeze(['先找「原有」和「又送來」的數量關係；可以把 6 拆開，讓 18 先湊到 20。', '18+2=20，6−2=4，再算 20+4=24；此中間結果會供下一步平均分裝使用。']), incorrectFeedback: '依序檢查湊整十、拆出剩餘數量及合併總數三個位置，再重試第一步。', correctFeedback: '你把加法拆成 18+2=20、6−2=4、20+4=24。遊戲保留 24 作為第二步的中間結果。' }),
    Object.freeze({ stageId: 'share-supplies-equally', interaction: 'choose_response', prompt: '把第一步的全部水壺平均裝進 4 個補給箱，每箱有幾個？', deriveFromPrevious: { operation: 'divide', operand: 4 },
      options: Object.freeze([{ id: 'share-6', value: 6, text: '6 個' }, { id: 'share-24', value: 24, text: '24 個' }, { id: 'share-20', value: 20, text: '20 個' }]), correctOptionIds: Object.freeze(['share-6']),
      hints: Object.freeze(['把第一步留下的總數平均分成 4 組。', '可想成「每箱數量 × 4 箱 = 第一步中間結果」，再檢查。']), incorrectFeedback: '檢查你是否使用第一步保留的總數，並且平均分成 4 箱；不要把總數直接當成每箱數量。', correctFeedback: '你用第一步的總數平均分成 4 箱。這只涵蓋一種加法後除法情境。' }),
  ]),
  reinforcementActivityIds: [], reinforcementStatus: '尚無連結的補強活動', evidencePolicy: { persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false },
  teacherReview: { status: 'not_reviewed', reviewer: null, reviewedAt: null }, openQuestions: ['確認學生已學會此題所需的加法、整除平均分配與兩步驟問題理解。', '本活動不含連乘或減法後除法，不能代表 N-3-7 全部類型。'],
});
