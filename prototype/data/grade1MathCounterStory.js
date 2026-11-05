const isHanCharacter = (character) => /\p{Script=Han}/u.test(character);

// Pronunciations are supplied and reviewed manually in text order.
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

const operationGuidance = '怎麼玩：① 點數字卡和符號卡 → ② 排成完整算式 → ③ 檢查答案';
const operationGuidancePronunciationTokens = reviewedPronunciationTokens(
  operationGuidance,
  'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄉㄧㄢˇ ㄕㄨˋ ㄗˋ ㄎㄚˇ ㄏㄜˊ ㄈㄨˊ ㄏㄠˋ ㄎㄚˇ ㄆㄞˊ ㄔㄥˊ ㄨㄢˊ ㄓㄥˇ ㄙㄨㄢˋ ㄕˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ',
);

export const GRADE1_MATH_COUNTER_STORY = Object.freeze({
  activityId: 'ACT-G1-MATH-COUNTER-STORY-CANDIDATE', revision: 1,
  title: '花片故事劇場：合起來與拿走', gradeId: 'grade-1', subjectId: 'mathematics',
  titlePronunciationTokens: reviewedPronunciationTokens('花片故事劇場：合起來與拿走', 'ㄏㄨㄚ ㄆㄧㄢˋ ㄍㄨˋ ㄕˋ ㄐㄩˋ ㄔㄤˇ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄩˇ ㄋㄚˊ ㄗㄡˇ'),
  status: 'candidate_pending_teacher_review', sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade1-add-sub-meaning', sourceId: 'mathematics', curriculumCodes: ['N-1-2', 'N-1-3', 'R-1-1', 'n-I-2'],
  curriculumScope: '官方一年級加減意義與基本加減法候選局部參照；情境數量小於 10。只練習合起來與拿走的模型，並不代表涵蓋所有加減應用類型或達到熟練標準。',
  learningObjective: { objectiveId: 'LO-G1-MATH-COUNTER-STORY-01', statement: '操作花片故事並依情境排列簡單加法或減法算式。', status: 'candidate_pending_teacher_review' },
  instructions: '看故事裡花片怎麼變化，將數字和符號卡排成記錄故事的算式。數學情境為原創候選內容。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'join-two-groups',
      interaction: 'assemble_response',
      requiredSelectionCount: 5,
      studentOperationGuidance: operationGuidance,
      studentOperationGuidancePronunciationTokens: operationGuidancePronunciationTokens,
      prompt: '桌上有 3 片紅花片，又放上 2 片藍花片。排出表示「合起來」的算式。',
      promptPronunciationTokens: reviewedPronunciationTokens('桌上有 3 片紅花片，又放上 2 片藍花片。排出表示「合起來」的算式。', 'ㄓㄨㄛ ㄕㄤˋ ㄧㄡˇ ㄆㄧㄢˋ ㄏㄨㄥˊ ㄏㄨㄚ ㄆㄧㄢˋ ㄧㄡˋ ㄈㄤˋ ㄕㄤˋ ㄆㄧㄢˋ ㄌㄢˊ ㄏㄨㄚ ㄆㄧㄢˋ ㄆㄞˊ ㄔㄨ ㄅㄧㄠˇ ㄕˋ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄉㄜ˙ ㄙㄨㄢˋ ㄕˋ'),
      tokens: Object.freeze([
        Object.freeze({ id: 'add-3', text: '3' }),
        Object.freeze({ id: 'add-sign', text: '+' }),
        Object.freeze({ id: 'add-2', text: '2' }),
        Object.freeze({ id: 'add-equals', text: '=' }),
        Object.freeze({ id: 'add-5', text: '5' }),
      ]),
      correctOptionIds: Object.freeze(['add-3', 'add-sign', 'add-2', 'add-equals', 'add-5']),
      hints: Object.freeze([
        reviewedHint('想一想：紅花片和藍花片是合起來，還是拿走？', 'ㄒㄧㄤˇ ㄧˋ ㄒㄧㄤˇ ㄏㄨㄥˊ ㄏㄨㄚ ㄆㄧㄢˋ ㄏㄜˊ ㄌㄢˊ ㄏㄨㄚ ㄆㄧㄢˋ ㄕˋ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄏㄞˊ ㄕˋ ㄋㄚˊ ㄗㄡˇ'),
        reviewedHint('先找兩個數字，再找表示合起來的符號，排成完整算式。', 'ㄒㄧㄢ ㄓㄠˇ ㄌㄧㄤˇ ㄍㄜˋ ㄕㄨˋ ㄗˋ ㄗㄞˋ ㄓㄠˇ ㄅㄧㄠˇ ㄕˋ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄉㄜ˙ ㄈㄨˊ ㄏㄠˋ ㄆㄞˊ ㄔㄥˊ ㄨㄢˊ ㄓㄥˇ ㄙㄨㄢˋ ㄕˋ'),
      ]),
      incorrectFeedback: '再看一次故事：3 片和 2 片是合起來。重新排一排數字卡和符號卡。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看一次故事：3 片和 2 片是合起來。重新排一排數字卡和符號卡。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄍㄨˋ ㄕˋ ㄆㄧㄢˋ ㄏㄜˊ ㄆㄧㄢˋ ㄕˋ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄔㄨㄥˊ ㄒㄧㄣ ㄆㄞˊ ㄧˋ ㄆㄞˊ ㄕㄨˋ ㄗˋ ㄎㄚˇ ㄏㄜˊ ㄈㄨˊ ㄏㄠˋ ㄎㄚˇ'),
      correctFeedback: '答對了！你排出了表示合起來的算式。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('答對了！你排出了表示合起來的算式。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄋㄧˇ ㄆㄞˊ ㄔㄨ ㄌㄜ˙ ㄅㄧㄠˇ ㄕˋ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄉㄜ˙ ㄙㄨㄢˋ ㄕˋ'),
    }),
    Object.freeze({
      stageId: 'take-away-petals',
      interaction: 'assemble_response',
      requiredSelectionCount: 5,
      studentOperationGuidance: operationGuidance,
      studentOperationGuidancePronunciationTokens: operationGuidancePronunciationTokens,
      prompt: '花籃有 7 片花瓣，拿走 3 片做卡片。排出表示剩下花瓣的算式。',
      promptPronunciationTokens: reviewedPronunciationTokens('花籃有 7 片花瓣，拿走 3 片做卡片。排出表示剩下花瓣的算式。', 'ㄏㄨㄚ ㄌㄢˊ ㄧㄡˇ ㄆㄧㄢˋ ㄏㄨㄚ ㄅㄢˋ ㄋㄚˊ ㄗㄡˇ ㄆㄧㄢˋ ㄗㄨㄛˋ ㄎㄚˇ ㄆㄧㄢˋ ㄆㄞˊ ㄔㄨ ㄅㄧㄠˇ ㄕˋ ㄕㄥˋ ㄒㄧㄚˋ ㄉㄜ˙ ㄏㄨㄚ ㄅㄢˋ ㄙㄨㄢˋ ㄕˋ'),
      tokens: Object.freeze([
        Object.freeze({ id: 'take-7', text: '7' }),
        Object.freeze({ id: 'take-minus', text: '−' }),
        Object.freeze({ id: 'take-3', text: '3' }),
        Object.freeze({ id: 'take-equals', text: '=' }),
        Object.freeze({ id: 'take-4', text: '4' }),
      ]),
      correctOptionIds: Object.freeze(['take-7', 'take-minus', 'take-3', 'take-equals', 'take-4']),
      hints: Object.freeze([
        reviewedHint('想一想：原來有 7 片，拿走 3 片，花瓣是變多還是變少？', 'ㄒㄧㄤˇ ㄧˋ ㄒㄧㄤˇ ㄩㄢˊ ㄌㄞˊ ㄧㄡˇ ㄆㄧㄢˋ ㄋㄚˊ ㄗㄡˇ ㄆㄧㄢˋ ㄏㄨㄚ ㄅㄢˋ ㄕˋ ㄅㄧㄢˋ ㄉㄨㄛ ㄏㄞˊ ㄕˋ ㄅㄧㄢˋ ㄕㄠˇ'),
        reviewedHint('先找原來的數字，再找表示拿走的符號，排成完整算式。', 'ㄒㄧㄢ ㄓㄠˇ ㄩㄢˊ ㄌㄞˊ ㄉㄜ˙ ㄕㄨˋ ㄗˋ ㄗㄞˋ ㄓㄠˇ ㄅㄧㄠˇ ㄕˋ ㄋㄚˊ ㄗㄡˇ ㄉㄜ˙ ㄈㄨˊ ㄏㄠˋ ㄆㄞˊ ㄔㄥˊ ㄨㄢˊ ㄓㄥˇ ㄙㄨㄢˋ ㄕˋ'),
      ]),
      incorrectFeedback: '再看一次故事：原來有 7 片，拿走 3 片。重新排一排數字卡和符號卡。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看一次故事：原來有 7 片，拿走 3 片。重新排一排數字卡和符號卡。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄍㄨˋ ㄕˋ ㄩㄢˊ ㄌㄞˊ ㄧㄡˇ ㄆㄧㄢˋ ㄋㄚˊ ㄗㄡˇ ㄆㄧㄢˋ ㄔㄨㄥˊ ㄒㄧㄣ ㄆㄞˊ ㄧˋ ㄆㄞˊ ㄕㄨˋ ㄗˋ ㄎㄚˇ ㄏㄜˊ ㄈㄨˊ ㄏㄠˋ ㄎㄚˇ'),
      correctFeedback: '答對了！你排出了表示拿走後剩下多少的算式。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('答對了！你排出了表示拿走後剩下多少的算式。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄋㄧˇ ㄆㄞˊ ㄔㄨ ㄌㄜ˙ ㄅㄧㄠˇ ㄕˋ ㄋㄚˊ ㄗㄡˇ ㄏㄡˋ ㄕㄥˋ ㄒㄧㄚˋ ㄉㄨㄛ ㄕㄠˇ ㄉㄜ˙ ㄙㄨㄢˋ ㄕˋ'),
      teacherLimitationNote: '本活動不是正式計算熟練度評量。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['適用的加減學習進度及學生對 +、−、= 的先備需教師確認。', '遊戲以文字模擬花片，並非實物操作；需評估文字閱讀是否干擾數學作答。']),
});
