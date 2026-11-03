function reviewed(text, readingSequence) {
  const readings = readingSequence ? readingSequence.split(/\s+/u) : [];
  let readingIndex = 0;
  const tokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return { text: character };
    const reading = readings[readingIndex++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return { text: character, reading };
  });
  if (readingIndex !== readings.length) throw new Error(`Extra reviewed pronunciation for ${text}`);
  return Object.freeze(tokens.map((token) => Object.freeze(token)));
}

const hint = (text, readings) => Object.freeze({ text, pronunciationTokens: reviewed(text, readings) });
const record = (title, titleReadings, text, textReadings) => Object.freeze({
  title,
  titlePronunciationTokens: reviewed(title, titleReadings),
  text,
  pronunciationTokens: reviewed(text, textReadings),
});
const option = (id, text, readings, feedback, feedbackReadings) => Object.freeze({
  id,
  text,
  pronunciationTokens: reviewed(text, readings),
  feedback,
  feedbackPronunciationTokens: reviewed(feedback, feedbackReadings),
});

export const GRADE1_LIVING_CHANGE_DETECTIVE = Object.freeze({
  activityId: 'ACT-G1-LIVING-CHANGE-DETECTIVE-CANDIDATE',
  revision: 1,
  title: '生活變化偵探：找出前後不同',
  gradeId: 'grade-1',
  subjectId: 'living-curriculum',
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_simulated_observation_candidate_not_textbook',
  curriculumMapId: 'living-curriculum-stage1-change-inquiry',
  sourceId: 'living-curriculum',
  curriculumCodes: Object.freeze(['2-I-2', '2-I-4', '2-I-5']),
  curriculumScope: '第一學習階段生活課程局部候選參照：觀察生活事物變化、在探索問題歷程中處理資訊。畫面是模擬紀錄，只練習找前後變化，不判定因果探究或實物操作能力。',
  learningObjective: Object.freeze({
    objectiveId: 'LO-G1-LIVING-CHANGE-DETECTIVE-01',
    statement: '比較同一物品前後的觀察紀錄，找出有變化的線索。',
    status: 'candidate_pending_teacher_review',
  }),
  instructions: '看前後紀錄，找出有變化的卡，再想想怎麼記下觀察。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'collect-change-evidence',
      interaction: 'collect_evidence',
      prompt: '找出前後不一樣的紀錄。',
      promptPronunciationTokens: reviewed('找出前後不一樣的紀錄。', 'ㄓㄠˇ ㄔㄨ ㄑㄧㄢˊ ㄏㄡˋ ㄅㄨˋ ㄧˊ ㄧㄤˋ ㄉㄜ˙ ㄐㄧˋ ㄌㄨˋ'),
      studentOperationGuidance: '怎麼玩：① 看前後記錄 → ② 選 2 張有變化的卡 → ③ 選好再檢查答案',
      studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看前後記錄 → ② 選 2 張有變化的卡 → ③ 選好再檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄑㄧㄢˊ ㄏㄡˋ ㄐㄧˋ ㄌㄨˋ ㄒㄩㄢˇ ㄓㄤ ㄧㄡˇ ㄅㄧㄢˋ ㄏㄨㄚˋ ㄉㄜ˙ ㄎㄚˇ ㄒㄩㄢˇ ㄏㄠˇ ㄗㄞˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      requiredSelectionCount: 2,
      selectionUnitLabel: '張',
      evidenceRecords: Object.freeze([
        record('盆栽紀錄 A', 'ㄆㄣˊ ㄗㄞ ㄐㄧˋ ㄌㄨˋ', '星期一：葉子垂下；星期三：葉子挺起來。', 'ㄒㄧㄥ ㄑㄧˊ ㄧ ㄧㄝˋ ˙ㄗ ㄔㄨㄟˊ ㄒㄧㄚˋ ㄒㄧㄥ ㄑㄧˊ ㄙㄢ ㄧㄝˋ ˙ㄗ ㄊㄧㄥˇ ㄑㄧˇ ㄌㄞˊ'),
        record('天空紀錄 B', 'ㄊㄧㄢ ㄎㄨㄥ ㄐㄧˋ ㄌㄨˋ', '早上有雲；中午還是有雲。', 'ㄗㄠˇ ㄕㄤˋ ㄧㄡˇ ㄩㄣˊ ㄓㄨㄥ ㄨˇ ㄏㄞˊ ㄕˋ ㄧㄡˇ ㄩㄣˊ'),
        record('積木紀錄 C', 'ㄐㄧ ㄇㄨˋ ㄐㄧˋ ㄌㄨˋ', '開始排成一列；後來排成一座小橋。', 'ㄎㄞ ㄕˇ ㄆㄞˊ ㄔㄥˊ ㄧˊ ㄌㄧㄝˋ ㄏㄡˋ ㄌㄞˊ ㄆㄞˊ ㄔㄥˊ ㄧˊ ㄗㄨㄛˋ ㄒㄧㄠˇ ㄑㄧㄠˊ'),
        record('桌面紀錄 D', 'ㄓㄨㄛ ㄇㄧㄢˋ ㄐㄧˋ ㄌㄨˋ', '早上有一本書；中午同一本書還在原位。', 'ㄗㄠˇ ㄕㄤˋ ㄧㄡˇ ㄧˋ ㄅㄣˇ ㄕㄨ ㄓㄨㄥ ㄨˇ ㄊㄨㄥˊ ㄧˋ ㄅㄣˇ ㄕㄨ ㄏㄞˊ ㄗㄞˋ ㄩㄢˊ ㄨㄟˋ'),
      ]),
      options: Object.freeze([
        option('change-plant', '盆栽紀錄', 'ㄆㄣˊ ㄗㄞ ㄐㄧˋ ㄌㄨˋ', '把同一盆栽前後的樣子放在一起看。', 'ㄅㄚˇ ㄊㄨㄥˊ ㄧˋ ㄆㄣˊ ㄗㄞ ㄑㄧㄢˊ ㄏㄡˋ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ ㄈㄤˋ ㄗㄞˋ ㄧˋ ㄑㄧˇ ㄎㄢˋ'),
        option('change-blocks', '積木紀錄', 'ㄐㄧ ㄇㄨˋ ㄐㄧˋ ㄌㄨˋ', '把積木前後的排法放在一起看。', 'ㄅㄚˇ ㄐㄧ ㄇㄨˋ ㄑㄧㄢˊ ㄏㄡˋ ㄉㄜ˙ ㄆㄞˊ ㄈㄚˇ ㄈㄤˋ ㄗㄞˋ ㄧˋ ㄑㄧˇ ㄎㄢˋ'),
        option('same-sky', '天空紀錄', 'ㄊㄧㄢ ㄎㄨㄥ ㄐㄧˋ ㄌㄨˋ', '看看兩次的天空是不是一樣。', 'ㄎㄢˋ ㄎㄢˋ ㄌㄧㄤˇ ㄘˋ ㄉㄜ˙ ㄊㄧㄢ ㄎㄨㄥ ㄕˋ ㄅㄨˋ ㄕˋ ㄧˊ ㄧㄤˋ'),
        option('same-book', '桌面紀錄', 'ㄓㄨㄛ ㄇㄧㄢˋ ㄐㄧˋ ㄌㄨˋ', '看看書的位置前後有沒有改變。', 'ㄎㄢˋ ㄎㄢˋ ㄕㄨ ㄉㄜ˙ ㄨㄟˋ ㄓˋ ㄑㄧㄢˊ ㄏㄡˋ ㄧㄡˇ ㄇㄟˊ ㄧㄡˇ ㄍㄞˇ ㄅㄧㄢˋ'),
      ]),
      correctOptionIds: Object.freeze(['change-plant', 'change-blocks']),
      hints: Object.freeze([
        hint('把前一次和後一次放在一起看。', 'ㄅㄚˇ ㄑㄧㄢˊ ㄧˊ ㄘˋ ㄏㄢˋ ㄏㄡˋ ㄧˊ ㄘˋ ㄈㄤˋ ㄗㄞˋ ㄧˋ ㄑㄧˇ ㄎㄢˋ'),
        hint('看看兩次寫的樣子是不是一樣。', 'ㄎㄢˋ ㄎㄢˋ ㄌㄧㄤˇ ㄘˋ ㄒㄧㄝˇ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ ㄕˋ ㄅㄨˋ ㄕˋ ㄧˊ ㄧㄤˋ'),
      ]),
      incorrectFeedback: '回到同一張卡，比一比前後兩次寫的內容。',
      incorrectFeedbackPronunciationTokens: reviewed('回到同一張卡，比一比前後兩次寫的內容。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄊㄨㄥˊ ㄧˋ ㄓㄤ ㄎㄚˇ ㄅㄧˇ ㄧˋ ㄅㄧˇ ㄑㄧㄢˊ ㄏㄡˋ ㄌㄧㄤˇ ㄘˋ ㄒㄧㄝˇ ㄉㄜ˙ ㄋㄟˋ ㄖㄨㄥˊ'),
      correctFeedback: '你找到了前後有變化的紀錄。',
      correctFeedbackPronunciationTokens: reviewed('你找到了前後有變化的紀錄。', 'ㄋㄧˇ ㄓㄠˇ ㄉㄠˋ ㄌㄜ˙ ㄑㄧㄢˊ ㄏㄡˋ ㄧㄡˇ ㄅㄧㄢˋ ㄏㄨㄚˋ ㄉㄜ˙ ㄐㄧˋ ㄌㄨˋ'),
    }),
    Object.freeze({
      stageId: 'choose-change-recording-method',
      interaction: 'choose_response',
      prompt: '如果想知道葉子後來有沒有變，要怎麼記錄最有幫助？',
      promptPronunciationTokens: reviewed('如果想知道葉子後來有沒有變，要怎麼記錄最有幫助？', 'ㄖㄨˊ ㄍㄨㄛˇ ㄒㄧㄤˇ ㄓ ㄉㄠˋ ㄧㄝˋ ˙ㄗ ㄏㄡˋ ㄌㄞˊ ㄧㄡˇ ㄇㄟˊ ㄧㄡˇ ㄅㄧㄢˋ ㄧㄠˋ ㄗㄣˇ ㄇㄜ˙ ㄐㄧˋ ㄌㄨˋ ㄗㄨㄟˋ ㄧㄡˇ ㄅㄤ ㄓㄨˋ'),
      options: Object.freeze([
        option('method-date-description', '在不同時間，記下看到的葉子。', 'ㄗㄞˋ ㄅㄨˋ ㄊㄨㄥˊ ㄕˊ ㄐㄧㄢ ㄐㄧˋ ㄒㄧㄚˋ ㄎㄢˋ ㄉㄠˋ ㄉㄜ˙ ㄧㄝˋ ˙ㄗ', '每次記下時間和看到的樣子，就能回頭比較。', 'ㄇㄟˇ ㄘˋ ㄐㄧˋ ㄒㄧㄚˋ ㄕˊ ㄐㄧㄢ ㄏㄢˋ ㄎㄢˋ ㄉㄠˋ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ ㄐㄧㄡˋ ㄋㄥˊ ㄏㄨㄟˊ ㄊㄡˊ ㄅㄧˇ ㄐㄧㄠˋ'),
        option('method-name-only', '只寫名字。', 'ㄓˇ ㄒㄧㄝˇ ㄇㄧㄥˊ ㄗ˙', '只有名字，沒有看到的樣子。', 'ㄓˇ ㄧㄡˇ ㄇㄧㄥˊ ㄗ˙ ㄇㄟˊ ㄧㄡˇ ㄎㄢˋ ㄉㄠˋ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ'),
        option('method-colour-guess', '猜葉子明天的顏色。', 'ㄘㄞ ㄧㄝˋ ˙ㄗ ㄇㄧㄥˊ ㄊㄧㄢ ㄉㄜ˙ ㄧㄢˊ ㄙㄜˋ', '猜一猜不等於記下看到的樣子。', 'ㄘㄞ ㄧˋ ㄘㄞ ㄅㄨˋ ㄉㄥˇ ㄩˊ ㄐㄧˋ ㄒㄧㄚˋ ㄎㄢˋ ㄉㄠˋ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ'),
      ]),
      correctOptionIds: Object.freeze(['method-date-description']),
      hints: Object.freeze([
        hint('想想要怎麼記下看到的樣子。', 'ㄒㄧㄤˇ ㄒㄧㄤˇ ㄧㄠˋ ㄗㄣˇ ㄇㄜ˙ ㄐㄧˋ ㄒㄧㄚˋ ㄎㄢˋ ㄉㄠˋ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ'),
        hint('前一次和後一次都要留下紀錄。', 'ㄑㄧㄢˊ ㄧˊ ㄘˋ ㄏㄢˋ ㄏㄡˋ ㄧˊ ㄘˋ ㄉㄡ ㄧㄠˋ ㄌㄧㄡˊ ㄒㄧㄚˋ ㄐㄧˋ ㄌㄨˋ'),
      ]),
      incorrectFeedback: '選能記下不同時間看到的樣子的方法。',
      incorrectFeedbackPronunciationTokens: reviewed('選能記下不同時間看到的樣子的方法。', 'ㄒㄩㄢˇ ㄋㄥˊ ㄐㄧˋ ㄒㄧㄚˋ ㄅㄨˋ ㄊㄨㄥˊ ㄕˊ ㄐㄧㄢ ㄎㄢˋ ㄉㄠˋ ㄉㄜ˙ ㄧㄤˋ ˙ㄗ ㄉㄜ˙ ㄈㄤ ㄈㄚˇ'),
      correctFeedback: '你選了能比較前後的方法。',
      correctFeedbackPronunciationTokens: reviewed('你選了能比較前後的方法。', 'ㄋㄧˇ ㄒㄩㄢˇ ㄌㄜ˙ ㄋㄥˊ ㄅㄧˇ ㄐㄧㄠˋ ㄑㄧㄢˊ ㄏㄡˋ ㄉㄜ˙ ㄈㄤ ㄈㄚˇ'),
      teacherLimitationNote: '這只是模擬規劃，未執行真實觀察或證明因果理解。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['真實觀察對象、期間及安全方式需由教師選擇。', '模擬案例可能未充分涵蓋變化原因與多種探究方法；不可視為完整探究活動。']),
});
