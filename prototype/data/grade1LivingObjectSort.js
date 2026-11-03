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
const observation = (id, text, readings) => Object.freeze({ id, text, pronunciationTokens: reviewed(text, readings) });
const option = (id, text, readings, feedback, feedbackReadings) => Object.freeze({
  id,
  text,
  pronunciationTokens: reviewed(text, readings),
  feedback,
  feedbackPronunciationTokens: reviewed(feedback, feedbackReadings),
});

export const GRADE1_LIVING_OBJECT_SORT = Object.freeze({
  activityId: 'ACT-G1-LIVING-OBJECT-SORT-CANDIDATE',
  revision: 1,
  title: '生活探索隊：自然物與人造物',
  gradeId: 'grade-1',
  subjectId: 'living-curriculum',
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_simulated_observation_candidate_not_textbook',
  curriculumMapId: 'living-curriculum-stage1-observation-inquiry',
  sourceId: 'living-curriculum',
  curriculumCodes: Object.freeze(['2-I-1', '2-I-5']),
  curriculumScope: '第一學習階段生活課程局部候選參照：以感官／知覺辨認生活事物特徵、適切處理觀察資訊。這是文字模擬分類，不等於實地觀察或涵蓋整體生活課程。',
  learningObjective: Object.freeze({
    objectiveId: 'LO-G1-LIVING-OBJECT-SORT-01',
    statement: '根據觀察卡中的特徵，把物品分成自然物與人造物，並說出分類依據。',
    status: 'candidate_pending_teacher_review',
  }),
  instructions: '看文字觀察卡，將每張卡放到「自然物」或「人造物」區。這是模擬分類，不取代實物探索。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'sort-observed-things',
      interaction: 'classify_observations',
      prompt: '看每張卡，想一想：它是自然出現的，還是人做出來的？',
      promptPronunciationTokens: reviewed('看每張卡，想一想：它是自然出現的，還是人做出來的？', 'ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄧㄤˇ ㄧˋ ㄒㄧㄤˇ ㄊㄚ ㄕˋ ㄗˋ ㄖㄢˊ ㄔㄨ ㄒㄧㄢˋ ㄉㄜ˙ ㄏㄞˊ ㄕˋ ㄖㄣˊ ㄗㄨㄛˋ ㄔㄨ ㄌㄞˊ ㄉㄜ˙'),
      studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案',
      studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄅㄤ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄩㄢˇ ㄧˋ ㄌㄟˋ ㄑㄩㄢˊ ㄅㄨˋ ㄈㄣ ㄏㄠˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      observations: Object.freeze([
        observation('thing-leaf', '葉子：來自樹上，掉下來，樣子不一樣。', 'ㄧㄝˋ ˙ㄗ ㄌㄞˊ ㄗˋ ㄕㄨˋ ㄕㄤˋ ㄉㄧㄠˋ ㄒㄧㄚˋ ㄌㄞˊ ㄧㄤˋ ˙ㄗ ㄅㄨˋ ㄧˊ ㄧㄤˋ'),
        observation('thing-stone', '石頭：在自然的地方找到，樣子不一樣。', 'ㄕˊ ˙ㄊㄡ ㄗㄞˋ ㄗˋ ㄖㄢˊ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ ㄓㄠˇ ㄉㄠˋ ㄧㄤˋ ˙ㄗ ㄅㄨˋ ㄧˊ ㄧㄤˋ'),
        observation('thing-cup', '水杯：人做來裝水。', 'ㄕㄨㄟˇ ㄅㄟ ㄖㄣˊ ㄗㄨㄛˋ ㄌㄞˊ ㄓㄨㄤ ㄕㄨㄟˇ'),
        observation('thing-book', '課本：人把紙印上字，再訂起來。', 'ㄎㄜˋ ㄅㄣˇ ㄖㄣˊ ㄅㄚˇ ㄓˇ ㄧㄣˋ ㄕㄤˋ ㄗˋ ㄗㄞˋ ㄉㄧㄥˋ ㄑㄧˇ ㄌㄞˊ'),
      ]),
      categories: Object.freeze([
        Object.freeze({ id: 'natural', label: '自然物', pronunciationTokens: reviewed('自然物', 'ㄗˋ ㄖㄢˊ ㄨˋ') }),
        Object.freeze({ id: 'made', label: '人造物', pronunciationTokens: reviewed('人造物', 'ㄖㄣˊ ㄗㄠˋ ㄨˋ') }),
      ]),
      correctAssignments: Object.freeze({ 'thing-leaf': 'natural', 'thing-stone': 'natural', 'thing-cup': 'made', 'thing-book': 'made' }),
      hints: Object.freeze([
        hint('看東西是怎麼來的。', 'ㄎㄢˋ ㄉㄨㄥ ㄒㄧ ㄕˋ ㄗㄣˇ ㄇㄜ˙ ㄌㄞˊ ㄉㄜ˙'),
        hint('卡片有沒有寫到「人做的」？', 'ㄎㄚˇ ㄆㄧㄢˋ ㄧㄡˇ ㄇㄟˊ ㄧㄡˇ ㄒㄧㄝˇ ㄉㄠˋ ㄖㄣˊ ㄗㄨㄛˋ ㄉㄜ˙'),
      ]),
      incorrectFeedback: '再看卡片：東西是自然出現的，還是人做出來的？',
      incorrectFeedbackPronunciationTokens: reviewed('再看卡片：東西是自然出現的，還是人做出來的？', 'ㄗㄞˋ ㄎㄢˋ ㄎㄚˇ ㄆㄧㄢˋ ㄉㄨㄥ ㄒㄧ ㄕˋ ㄗˋ ㄖㄢˊ ㄔㄨ ㄒㄧㄢˋ ㄉㄜ˙ ㄏㄞˊ ㄕˋ ㄖㄣˊ ㄗㄨㄛˋ ㄔㄨ ㄌㄞˊ ㄉㄜ˙'),
      correctFeedback: '你看卡片，把東西分好了。',
      correctFeedbackPronunciationTokens: reviewed('你看卡片，把東西分好了。', 'ㄋㄧˇ ㄎㄢˋ ㄎㄚˇ ㄆㄧㄢˋ ㄅㄚˇ ㄉㄨㄥ ㄒㄧ ㄈㄣ ㄏㄠˇ ˙ㄌㄜ'),
    }),
    Object.freeze({
      stageId: 'explain-object-rule',
      interaction: 'choose_response',
      prompt: '剛才分東西時，我們主要看什麼？',
      promptPronunciationTokens: reviewed('剛才分東西時，我們主要看什麼？', 'ㄍㄤ ㄘㄞˊ ㄈㄣ ㄉㄨㄥ ㄒㄧ ㄕˊ ㄨㄛˇ ㄇㄣ˙ ㄓㄨˇ ㄧㄠˋ ㄎㄢˋ ㄕㄣˊ ㄇㄜ˙'),
      options: Object.freeze([
        option('rule-origin', '看它是自然出現的，還是人做出來的。', 'ㄎㄢˋ ㄊㄚ ㄕˋ ㄗˋ ㄖㄢˊ ㄔㄨ ㄒㄧㄢˋ ㄉㄜ˙ ㄏㄞˊ ㄕˋ ㄖㄣˊ ㄗㄨㄛˋ ㄔㄨ ㄌㄞˊ ㄉㄜ˙', '你記得剛才看的是東西怎麼來的。', 'ㄋㄧˇ ㄐㄧˋ ㄉㄜ˙ ㄍㄤ ㄘㄞˊ ㄎㄢˋ ㄉㄜ˙ ㄕˋ ㄉㄨㄥ ㄒㄧ ㄗㄣˇ ㄇㄜ˙ ㄌㄞˊ ㄉㄜ˙'),
        option('rule-colour', '看它的顏色。', 'ㄎㄢˋ ㄊㄚ ㄉㄜ˙ ㄧㄢˊ ㄙㄜˋ', '卡片沒有用顏色來分。', 'ㄎㄚˇ ㄆㄧㄢˋ ㄇㄟˊ ㄧㄡˇ ㄩㄥˋ ㄧㄢˊ ㄙㄜˋ ㄌㄞˊ ㄈㄣ'),
        option('rule-size', '看它的大小。', 'ㄎㄢˋ ㄊㄚ ㄉㄜ˙ ㄉㄚˋ ㄒㄧㄠˇ', '卡片沒有用大小來分。', 'ㄎㄚˇ ㄆㄧㄢˋ ㄇㄟˊ ㄧㄡˇ ㄩㄥˋ ㄉㄚˋ ㄒㄧㄠˇ ㄌㄞˊ ㄈㄣ'),
      ]),
      correctOptionIds: Object.freeze(['rule-origin']),
      hints: Object.freeze([
        hint('回想剛才的四張卡。', 'ㄏㄨㄟˊ ㄒㄧㄤˇ ㄍㄤ ㄘㄞˊ ㄉㄜ˙ ㄙˋ ㄓㄤ ㄎㄚˇ'),
        hint('回想你剛才怎麼分卡片。', 'ㄏㄨㄟˊ ㄒㄧㄤˇ ㄋㄧˇ ㄍㄤ ㄘㄞˊ ㄗㄣˇ ㄇㄜ˙ ㄈㄣ ㄎㄚˇ ㄆㄧㄢˋ'),
      ]),
      incorrectFeedback: '回到四張卡，看看卡片寫了什麼。',
      incorrectFeedbackPronunciationTokens: reviewed('回到四張卡，看看卡片寫了什麼。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄙˋ ㄓㄤ ㄎㄚˇ ㄎㄢˋ ㄎㄢˋ ㄎㄚˇ ㄆㄧㄢˋ ㄒㄧㄝˇ ㄌㄜ˙ ㄕㄣˊ ㄇㄜ˙'),
      correctFeedback: '你記得剛才看的是東西怎麼來的。',
      correctFeedbackPronunciationTokens: reviewed('你記得剛才看的是東西怎麼來的。', 'ㄋㄧˇ ㄐㄧˋ ㄉㄜ˙ ㄍㄤ ㄘㄞˊ ㄎㄢˋ ㄉㄜ˙ ㄕˋ ㄉㄨㄥ ㄒㄧ ㄗㄣˇ ㄇㄜ˙ ㄌㄞˊ ㄉㄜ˙'),
      teacherLimitationNote: '本模擬不能證明學生能在真實環境自行觀察或安全操作。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['第一學習階段班級是否已能閱讀這些觀察句，需教師確認。', '自然物與人造物的分類邊界以簡化例子呈現，需教師檢視案例適切性。', '建議搭配安全實物觀察；目前沒有連結或執行實物活動。']),
});
