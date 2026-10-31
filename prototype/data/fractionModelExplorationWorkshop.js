const deepFreeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const sharedDenominatorNotes = '採連續量模型；每一片都代表同一個整體平均分成的等份之一。';
const pieceSet = (count, initialGroupId) => Array.from({ length: count }, (_, index) => ({ id: `piece-${index + 1}`, initialGroupId }));
const group = (id, label, kind, capacity, acceptsPieces = false) => ({ id, label, kind, capacity, acceptsPieces });
const stage = (definition) => ({
  ...definition,
  interaction: 'manipulate_fraction_model',
  hints: definition.hints,
  correctFeedback: definition.correctFeedback,
  incorrectFeedback: definition.incorrectFeedback,
});

export const GRADE3_FRACTION_MODEL_EXPLORATION = deepFreeze({
  activityId: 'ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE',
  title: '分數拼片探險工坊：比一比、合起來',
  gradeId: 'grade-3',
  subjectId: 'mathematics',
  sourceId: 'mathematics',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  teacherReview: { status: 'not_reviewed', reviewer: null, reviewedAt: null },
  curriculumMapId: 'math-grade3-n-3-9-common-denominator-fractions',
  curriculumCodes: ['N-3-9', 'n-II-6'],
  curriculumAlignment: 'partial',
  curriculumScope: '官方 N-3-9（PDF 頁序 26）要求簡單同分母分數比較、加、減的意義，分數與結果皆不超過 2，並認識「和等於 1」。本活動僅涵蓋同一整體的連續分數帶操作、單一分數建立、同分母比較、加減及合成 1；不涵蓋所有分數情境、超過 1 的完整範圍、分數應用解題與整數連結的全部教學。n-II-6 是第二學習階段表現，沒有推定三年級學期順序。',
  learningSubitemClaims: ['SUB-MATH-G3-N3-9-FRACTION-PIECE-MODEL-OPERATIONS'],
  coverage: {
    subitemId: 'SUB-MATH-G3-N3-9-FRACTION-PIECE-MODEL-OPERATIONS',
    coveredByInteraction: ['manipulate_fraction_model', 'set_fraction_denominator', 'select_fraction_whole', 'select_fraction_model', 'move_fraction_piece', 'set_fraction_relation'],
    notCovered: ['不同分母分數比較或運算', '帶分數及真分數／假分數名詞', '分數應用題的完整解題範圍', '實體分數片操作與教師觀察', '正式學習檢核及教學成效證據'],
  },
  learningObjective: {
    objectiveId: 'LO-G3-MATH-FRACTION-MODEL-01',
    statement: '以相同整體、等分的連續量分數片建立、比較同分母分數，並操作合併與取走分數片來理解加減及和等於 1。',
    status: 'candidate_pending_teacher_review',
  },
  instructions: '先選擇整體與等分份數，再把每片移到分數帶。依序完成表示、比較、合併、取走與補成一個整體。這是螢幕上的分數片模型，不會寫入正式成績或學習紀錄。',
  completionReward: '分數拼片候選徽章',
  sourceLocation: '教育部 2018-07-26 數學領綱，三年級學習內容表 N-3-9，PDF 頁序 26；同表對應學習表現 n-II-6。',
  curriculumEvidence: {
    officialText: '簡單同分母分數：結合操作活動與整數經驗。簡單同分母分數比較、加、減的意義。牽涉之分數與運算結果皆不超過2。以單位分數之點數為基礎，連結整數之比較、加、減。知道「和等於1」的意義。',
    officialNotes: '初步認識分數的應用時，情境應以連續量為主；本活動不引入真分數、假分數與帶分數名詞。',
    performanceCode: 'n-II-6',
    performanceStage: '第二學習階段（三、四年級），官方未指定學期。',
  },
  evidencePolicy: { persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false },
  reinforcementActivityIds: [],
  reinforcementStatus: '尚無連結的補強活動',
  openQuestions: ['螢幕點選分數片不能取代實體分數片或其他具體操作教具。', '教師需確認學生先備、數字範圍及關卡順序。'],
  stages: [
    stage({
      stageId: 'build-three-sixths-with-equal-whole',
      prompt: '建造 3/6：選擇同一條完整補給帶，將它平均分成 6 份，再放入 3 片。',
      hints: ['先選對完整整體，再選分母 6；分母表示整體被平均分成幾份。', '每片都是 1/6。把 3 片放在模型帶上，就表示 3/6。'],
      correctFeedback: '你用同一個整體的 6 等份選出 3 片，模型表示 3/6。',
      incorrectFeedback: '檢查整體是否選對、是否平均分成 6 份，以及模型上是否剛好有 3 片。',
      fractionRules: {
        mode: 'build', denominator: 6, denominatorOptions: [3, 6], sourceGroupId: 'piece-pool', targetWholeId: 'same-bar', targetGroupId: 'fraction-model', targetNumerator: 3,
        wholeOptions: [{ id: 'same-bar', label: '同一條完整補給帶' }, { id: 'same-bar-copy', label: '另一條同樣長的補給帶' }],
        groups: [group('piece-pool', '分數片庫', 'pool', 6), group('fraction-model', '完整整體模型', 'fraction', 6, true)],
        pieces: pieceSet(6, 'piece-pool'),
      },
    }),
    stage({
      stageId: 'compare-three-eighths-and-five-eighths',
      prompt: '兩條一樣長的巧克力帶都分成 8 等份。建出左邊 3/8、右邊 5/8，再放入比較符號。',
      hints: ['兩條整體一樣大、分母也相同，所以每一片的大小相同。', '數左右模型各有幾片；片數較多的一邊表示較大的分數。'],
      correctFeedback: '左邊有 3 個 1/8，右邊有 5 個 1/8，因此 3/8 < 5/8。',
      incorrectFeedback: '先完成左右模型的 3 片和 5 片，再依同樣大小的單位分數比較；確認符號方向。',
      fractionRules: {
        mode: 'compare', denominator: 8, denominatorOptions: [4, 8], sourceGroupId: 'piece-pool', targetWholeId: 'same-chocolate-whole', leftGroupId: 'left-model', rightGroupId: 'right-model', leftNumerator: 3, rightNumerator: 5, correctRelation: '<',
        wholeOptions: [{ id: 'same-chocolate-whole', label: '兩條同樣大的巧克力帶' }],
        groups: [group('piece-pool', '分數片庫', 'pool', 8), group('left-model', '左邊模型：3/8', 'fraction', 8, true), group('right-model', '右邊模型：5/8', 'fraction', 8, true)],
        pieces: pieceSet(8, 'piece-pool'),
      },
    }),
    stage({
      stageId: 'combine-two-eighths-and-three-eighths',
      prompt: '把 2/8 和 3/8 的分數片合併到同一條結果帶，並看見對應的加法。',
      hints: ['兩個分數的分母都是 8，每片大小相同，可以直接合併拼片。', '把兩條起始帶上的片都移到結果帶，數一數結果帶的片數。'],
      correctFeedback: '2 片 1/8 加上 3 片 1/8，合併成 5 片 1/8：2/8 + 3/8 = 5/8。',
      incorrectFeedback: '加法要把兩條起始帶的分數片合併；請確認兩條帶都空了，結果帶共有 5 片。',
      fractionRules: {
        mode: 'add', denominator: 8, denominatorOptions: [4, 8], sourceGroupId: 'first-operand', targetWholeId: 'same-juice-whole', firstOperandGroupId: 'first-operand', secondOperandGroupId: 'second-operand', resultGroupId: 'sum-model', resultNumerator: 5,
        wholeOptions: [{ id: 'same-juice-whole', label: '同一個完整果汁量' }],
        groups: [group('first-operand', '第一條：2/8', 'operand', 8), group('second-operand', '第二條：3/8', 'operand', 8), group('sum-model', '合併結果帶', 'fraction', 8, true)],
        pieces: [...pieceSet(2, 'first-operand'), ...Array.from({ length: 3 }, (_, index) => ({ id: `piece-${index + 3}`, initialGroupId: 'second-operand' }))],
      },
    }),
    stage({
      stageId: 'remove-two-sixths-from-five-sixths',
      prompt: '從 5/6 的果汁量中取走 2/6：把兩片移到取走區，觀察留下多少。',
      hints: ['減法表示從原有的分數片中拿走一部分。', '先看起始帶有幾片，再把 2 片移到取走區，剩下的片就是差。'],
      correctFeedback: '從 5 個 1/6 取走 2 個 1/6，留下 3 個 1/6：5/6 − 2/6 = 3/6。',
      incorrectFeedback: '請只從起始帶取走 2 片；剩下的片數才是差，不能把取走的片也算進去。',
      fractionRules: {
        mode: 'subtract', denominator: 6, denominatorOptions: [3, 6], sourceGroupId: 'starting-model', targetWholeId: 'same-juice-whole', startGroupId: 'starting-model', removedGroupId: 'removed-pieces', resultNumerator: 3, removedNumerator: 2,
        wholeOptions: [{ id: 'same-juice-whole', label: '同一個完整果汁量' }],
        groups: [group('starting-model', '起始帶：5/6', 'fraction', 6), group('removed-pieces', '取走區：2/6', 'removed', 6, true)],
        pieces: pieceSet(5, 'starting-model'),
      },
    }),
    stage({
      stageId: 'combine-two-sixths-and-four-sixths-to-one',
      prompt: '把 2/6 與 4/6 的片拼在同一個完整整體中，檢查是否剛好填滿。',
      hints: ['每片都代表同一個整體的 1/6；要拼成 1，需要幾個 1/6？', '將兩條來源帶的片全部移到完整模型，檢查 6 格是否剛好填滿。'],
      correctFeedback: '2 個 1/6 加上 4 個 1/6 正好填滿 6 等份，2/6 + 4/6 = 6/6 = 1。',
      incorrectFeedback: '和等於 1 表示整個模型剛好填滿；請確認兩條來源帶都空了，完整模型有 6 片。',
      fractionRules: {
        mode: 'make_one', denominator: 6, denominatorOptions: [3, 6], sourceGroupId: 'first-operand', targetWholeId: 'one-whole', firstOperandGroupId: 'first-operand', secondOperandGroupId: 'second-operand', wholeGroupId: 'whole-model',
        wholeOptions: [{ id: 'one-whole', label: '一個完整的長條整體' }],
        groups: [group('first-operand', '第一段：2/6', 'operand', 6), group('second-operand', '第二段：4/6', 'operand', 6), group('whole-model', '完整整體模型', 'fraction', 6, true)],
        pieces: [...pieceSet(2, 'first-operand'), ...Array.from({ length: 4 }, (_, index) => ({ id: `piece-${index + 3}`, initialGroupId: 'second-operand' }))],
      },
    }),
  ],
});
