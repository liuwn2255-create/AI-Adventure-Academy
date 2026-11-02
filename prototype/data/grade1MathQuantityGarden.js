const isHanCharacter = (character) => /\p{Script=Han}/u.test(character);

// Pronunciations below are supplied and reviewed manually in text order.
const reviewedPronunciationTokens = (text, readings) => {
  const readingList = readings.trim() ? readings.trim().split(/\s+/u) : [];
  let readingIndex = 0;
  const tokens = Array.from(text, (character) => {
    if (!isHanCharacter(character)) return Object.freeze({ text: character });
    const reading = readingList[readingIndex++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (readingIndex !== readingList.length) throw new Error(`Extra reviewed pronunciation in ${text}`);
  return Object.freeze(tokens);
};

const reviewedHint = (text, readings) => Object.freeze({
  text,
  pronunciationTokens: reviewedPronunciationTokens(text, readings),
});

export const GRADE1_MATH_QUANTITY_GARDEN = Object.freeze({
  activityId: 'ACT-G1-MATH-QUANTITY-GARDEN-CANDIDATE', revision: 1,
  title: '數字果園：數量裝箱', gradeId: 'grade-1', subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade1-count-place-value', sourceId: 'mathematics', curriculumCodes: ['N-1-1', 'n-I-1'],
  curriculumScope: '官方一年級內容 N-1-1：一百以內的數及操作、多少與順序、個與十位值；本活動只局部練習少量物件陣列點數與數量符號連結，不代表完整涵蓋 N-1-1。',
  learningObjective: { objectiveId: 'LO-G1-MATH-QUANTITY-GARDEN-01', statement: '以排列物件的方式建立小數量，逐一點數並選出對應的數字。', status: 'candidate_pending_teacher_review' },
  instructions: '把果子排進籃格，數一數有幾個，再找出相同數量的數字卡。操作只在本次遊戲記憶體中進行。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'arrange-eight-fruits',
      interaction: 'build_array',
      prompt: '請把果子排成 2 排，每排 4 個。',
      promptPronunciationTokens: reviewedPronunciationTokens('請把果子排成 2 排，每排 4 個。', 'ㄑㄧㄥˇ ㄅㄚˇ ㄍㄨㄛˇ ㄗ˙ ㄆㄞˊ ㄔㄥˊ ㄆㄞˊ ㄇㄟˇ ㄆㄞˊ ㄍㄜˋ'),
      arrayRules: Object.freeze({ targetRows: 2, targetColumns: 4, maxRows: 4, maxColumns: 5 }),
      hints: Object.freeze([
        reviewedHint('先看任務要幾排，再看每排要幾個。', 'ㄒㄧㄢ ㄎㄢˋ ㄖㄣˋ ㄨˋ ㄧㄠˋ ㄐㄧˇ ㄆㄞˊ ㄗㄞˋ ㄎㄢˋ ㄇㄟˇ ㄆㄞˊ ㄧㄠˋ ㄐㄧˇ ㄍㄜˋ'),
        reviewedHint('一排一排數一數，再看看每排的果子一樣多嗎？', 'ㄧˋ ㄆㄞˊ ㄧˋ ㄆㄞˊ ㄕㄨˇ ㄧ ㄕㄨˇ ㄗㄞˋ ㄎㄢˋ ㄎㄢˋ ㄇㄟˇ ㄆㄞˊ ㄉㄜ˙ ㄍㄨㄛˇ ㄗ˙ ㄧˊ ㄧㄤˋ ㄉㄨㄛ ㄇㄚ˙'),
      ]),
      incorrectFeedback: '再看一看：有 2 排嗎？每排都有 4 個嗎？',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看一看：有 2 排嗎？每排都有 4 個嗎？', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄎㄢˋ ㄧㄡˇ ㄆㄞˊ ㄇㄚ˙ ㄇㄟˇ ㄆㄞˊ ㄉㄡ ㄧㄡˇ ㄍㄜˋ ㄇㄚ˙'),
      correctFeedback: '答對了！你排出了 2 排，每排 4 個。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('答對了！你排出了 2 排，每排 4 個。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄋㄧˇ ㄆㄞˊ ㄔㄨ ㄌㄜ˙ ㄆㄞˊ ㄇㄟˇ ㄆㄞˊ ㄍㄜˋ'),
    }),
    Object.freeze({
      stageId: 'match-fruit-count',
      interaction: 'choose_response',
      prompt: '剛才的果子一共有幾個？選一張數字卡。',
      promptPronunciationTokens: reviewedPronunciationTokens('剛才的果子一共有幾個？選一張數字卡。', 'ㄍㄤ ㄘㄞˊ ㄉㄜ˙ ㄍㄨㄛˇ ㄗ˙ ㄧˊ ㄍㄨㄥˋ ㄧㄡˇ ㄐㄧˇ ㄍㄜˋ ㄒㄩㄢˇ ㄧˋ ㄓㄤ ㄕㄨˋ ㄗˋ ㄎㄚˇ'),
      options: Object.freeze([
        Object.freeze({
          id: 'fruit-count-6', text: '6 個',
          pronunciationTokens: reviewedPronunciationTokens('6 個', 'ㄍㄜˋ'),
          feedback: '請重新逐排點數，避免漏掉其中一排。',
          feedbackPronunciationTokens: reviewedPronunciationTokens('請重新逐排點數，避免漏掉其中一排。', 'ㄑㄧㄥˇ ㄔㄨㄥˊ ㄒㄧㄣ ㄓㄨˊ ㄆㄞˊ ㄉㄧㄢˇ ㄕㄨˇ ㄅㄧˋ ㄇㄧㄢˇ ㄌㄡˋ ㄉㄧㄠˋ ㄑㄧˊ ㄓㄨㄥ ㄧ ㄆㄞˊ'),
        }),
        Object.freeze({
          id: 'fruit-count-8', text: '8 個',
          pronunciationTokens: reviewedPronunciationTokens('8 個', 'ㄍㄜˋ'),
          feedback: '兩排各四個，逐一點數後可核對總量。',
          feedbackPronunciationTokens: reviewedPronunciationTokens('兩排各四個，逐一點數後可核對總量。', 'ㄌㄧㄤˇ ㄆㄞˊ ㄍㄜˋ ㄙˋ ㄍㄜˋ ㄓㄨˊ ㄧ ㄉㄧㄢˇ ㄕㄨˇ ㄏㄡˋ ㄎㄜˇ ㄏㄜˊ ㄉㄨㄟˋ ㄗㄨㄥˇ ㄌㄧㄤˋ'),
        }),
        Object.freeze({
          id: 'fruit-count-9', text: '9 個',
          pronunciationTokens: reviewedPronunciationTokens('9 個', 'ㄍㄜˋ'),
          feedback: '請檢查是否把空格也算成果子。',
          feedbackPronunciationTokens: reviewedPronunciationTokens('請檢查是否把空格也算成果子。', 'ㄑㄧㄥˇ ㄐㄧㄢˇ ㄔㄚˊ ㄕˋ ㄈㄡˇ ㄅㄚˇ ㄎㄨㄥ ㄍㄜˊ ㄧㄝˇ ㄙㄨㄢˋ ㄔㄥˊ ㄍㄨㄛˇ ㄗ˙'),
        }),
      ]),
      correctOptionIds: Object.freeze(['fruit-count-8']),
      hints: Object.freeze([
        reviewedHint('可以每排分開數，再把兩排合起來。', 'ㄎㄜˇ ㄧˇ ㄇㄟˇ ㄆㄞˊ ㄈㄣ ㄎㄞ ㄕㄨˇ ㄗㄞˋ ㄅㄚˇ ㄌㄧㄤˇ ㄆㄞˊ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ'),
        reviewedHint('重新看操作板上的果子，不要把空格算進去。', 'ㄔㄨㄥˊ ㄒㄧㄣ ㄎㄢˋ ㄘㄠ ㄗㄨㄛˋ ㄅㄢˇ ㄕㄤˋ ㄉㄜ˙ ㄍㄨㄛˇ ㄗ˙ ㄅㄨˊ ㄧㄠˋ ㄅㄚˇ ㄎㄨㄥ ㄍㄜˊ ㄙㄨㄢˋ ㄐㄧㄣˋ ㄑㄩˋ'),
      ]),
      incorrectFeedback: '再數一次果子，再選一張一樣多的數字卡。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再數一次果子，再選一張一樣多的數字卡。', 'ㄗㄞˋ ㄕㄨˇ ㄧˊ ㄘˋ ㄍㄨㄛˇ ㄗ˙ ㄗㄞˋ ㄒㄩㄢˇ ㄧˋ ㄓㄤ ㄧˊ ㄧㄤˋ ㄉㄨㄛ ㄉㄜ˙ ㄕㄨˋ ㄗˋ ㄎㄚˇ'),
      correctFeedback: '答對了！一共有 8 個果子。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('答對了！一共有 8 個果子。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄧˊ ㄍㄨㄥˋ ㄧㄡˇ ㄍㄜˋ ㄍㄨㄛˇ ㄗ˙'),
      teacherLimitationNote: '本活動只練習此小數量，不能據此判定已掌握一百以內數或位值。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['一年級實際進度與此小數量活動的適用時機待教師確認。', '陣列排列是否有助目標學生逐一點數，需教師檢視；此處不教乘法。']),
});
