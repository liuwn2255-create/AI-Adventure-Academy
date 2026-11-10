const isHanCharacter = (character) => /\p{Script=Han}/u.test(character);

// Readings are supplied and reviewed by hand in visible-text order.
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

const hint = (text, readings) => Object.freeze({
  text,
  pronunciationTokens: reviewedPronunciationTokens(text, readings),
});

const teacherLimitationNote = '本活動依第一學習階段候選 mapping 設計，不代表一年級指定學期或官方詞表；Ab-I-5 與 Ab-I-6 在 repo evidence 中合併描述。本活動為原創局部練習，不代表完整識字或閱讀能力。';
const common = (activityId, title, titleReadings, curriculumCodes, objectiveId, objective) => Object.freeze({
  activityId,
  revision: 1,
  title,
  titlePronunciationTokens: reviewedPronunciationTokens(title, titleReadings),
  gradeId: 'grade-1',
  subjectId: 'chinese-language',
  status: 'candidate_pending_teacher_review',
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  sourceKind: 'original_language_candidate_not_textbook',
  runtimeModule: 'prototype/data/grade1ChineseExpansionActivities.js',
  curriculumMapId: 'chinese-stage1-word-sentence-story',
  sourceId: 'chinese-language',
  curriculumCodes: Object.freeze(curriculumCodes),
  curriculumScope: '對照國語文第一學習階段候選局部 mapping；不推定一年級學期進度，不代表官方指定詞表或完整能力。',
  learningObjective: Object.freeze({ objectiveId, statement: objective, status: 'candidate_pending_teacher_review' }),
  teacherLimitationNote,
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['原創詞語、短句與短文是否符合預定一年級班級的閱讀先備，待教師審閱。', '本活動是文字互動候選練習，不代表完整識字、書寫、朗讀或閱讀能力。']),
});

const wordMeaningSort = Object.freeze({
  ...common(
    'ACT-G1-CHINESE-WORD-MEANING-SORT-CANDIDATE',
    '詞語找家：常用詞分類站',
    'ㄘˊ ㄩˇ ㄓㄠˇ ㄐㄧㄚ ㄔㄤˊ ㄩㄥˋ ㄘˊ ㄈㄣ ㄌㄟˋ ㄓㄢˋ',
    ['Ab-I-5', 'Ab-I-6'],
    'LO-G1-CHINESE-WORD-MEANING-SORT-01',
    '認讀生活中常見的詞語，並依詞語明確的意思分類。',
  ),
  instructions: '看懂詞卡的意思，再把詞卡分到合適的分類。',
  instructionsPronunciationTokens: reviewedPronunciationTokens('看懂詞卡的意思，再把詞卡分到合適的分類。', 'ㄎㄢˋ ㄉㄨㄥˇ ㄘˊ ㄎㄚˇ ㄉㄜ˙ ㄧˋ ㄙ˙ ㄗㄞˋ ㄅㄚˇ ㄘˊ ㄎㄚˇ ㄈㄣ ㄉㄠˋ ㄏㄜˊ ㄕˋ ㄉㄜ˙ ㄈㄣ ㄌㄟˋ'),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'sort-food-and-everyday-items',
      interaction: 'classify_observations',
      prompt: '把詞卡分到合適的家。',
      promptPronunciationTokens: reviewedPronunciationTokens('把詞卡分到合適的家。', 'ㄅㄚˇ ㄘˊ ㄎㄚˇ ㄈㄣ ㄉㄠˋ ㄏㄜˊ ㄕˋ ㄉㄜ˙ ㄐㄧㄚ'),
      studentOperationGuidance: '怎麼玩：① 看詞卡 → ② 點一個分類 → ③ 分完檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 看詞卡 → ② 點一個分類 → ③ 分完檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄘˊ ㄎㄚˇ ㄉㄧㄢˇ ㄧˊ ㄍㄜ˙ ㄈㄣ ㄌㄟˋ ㄈㄣ ㄨㄢˊ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      observations: Object.freeze([
        Object.freeze({ id: 'apple', text: '蘋果', pronunciationTokens: reviewedPronunciationTokens('蘋果', 'ㄆㄧㄥˊ ㄍㄨㄛˇ') }),
        Object.freeze({ id: 'banana', text: '香蕉', pronunciationTokens: reviewedPronunciationTokens('香蕉', 'ㄒㄧㄤ ㄐㄧㄠ') }),
        Object.freeze({ id: 'bread', text: '麵包', pronunciationTokens: reviewedPronunciationTokens('麵包', 'ㄇㄧㄢˋ ㄅㄠ') }),
        Object.freeze({ id: 'cup', text: '杯子', pronunciationTokens: reviewedPronunciationTokens('杯子', 'ㄅㄟ ㄗ˙') }),
        Object.freeze({ id: 'pencil', text: '鉛筆', pronunciationTokens: reviewedPronunciationTokens('鉛筆', 'ㄑㄧㄢ ㄅㄧˇ') }),
        Object.freeze({ id: 'water-bottle', text: '水壺', pronunciationTokens: reviewedPronunciationTokens('水壺', 'ㄕㄨㄟˇ ㄏㄨˊ') }),
      ]),
      categories: Object.freeze([
        Object.freeze({ id: 'food', label: '吃的', pronunciationTokens: reviewedPronunciationTokens('吃的', 'ㄔ ㄉㄜ˙') }),
        Object.freeze({ id: 'everyday-item', label: '用的', pronunciationTokens: reviewedPronunciationTokens('用的', 'ㄩㄥˋ ㄉㄜ˙') }),
      ]),
      correctAssignments: Object.freeze({ apple: 'food', banana: 'food', bread: 'food', cup: 'everyday-item', pencil: 'everyday-item', 'water-bottle': 'everyday-item' }),
      hints: Object.freeze([
        hint('先讀詞卡，想想它是吃的，還是用的。', 'ㄒㄧㄢ ㄉㄨˊ ㄘˊ ㄎㄚˇ ㄒㄧㄤˇ ㄒㄧㄤˇ ㄊㄚ ㄕˋ ㄔ ㄉㄜ˙ ㄏㄞˊ ㄕˋ ㄩㄥˋ ㄉㄜ˙'),
        hint('每張詞卡只放進一個合適的分類。', 'ㄇㄟˇ ㄓㄤ ㄘˊ ㄎㄚˇ ㄓˇ ㄈㄤˋ ㄐㄧㄣˋ ㄧˊ ㄍㄜ˙ ㄏㄜˊ ㄕˋ ㄉㄜ˙ ㄈㄣ ㄌㄟˋ'),
      ]),
      correctFeedback: '你用詞語的意思分好了。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你用詞語的意思分好了。', 'ㄋㄧˇ ㄩㄥˋ ㄘˊ ㄩˇ ㄉㄜ˙ ㄧˋ ㄙ˙ ㄈㄣ ㄏㄠˇ ㄌㄜ˙'),
      incorrectFeedback: '再讀一次詞卡，想想它能不能吃。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再讀一次詞卡，想想它能不能吃。', 'ㄗㄞˋ ㄉㄨˊ ㄧˊ ㄘˋ ㄘˊ ㄎㄚˇ ㄒㄧㄤˇ ㄒㄧㄤˇ ㄊㄚ ㄋㄥˊ ㄅㄨˋ ㄋㄥˊ ㄔ'),
    }),
    Object.freeze({
      stageId: 'sort-animals-and-objects',
      interaction: 'classify_observations',
      prompt: '再看一組詞卡，把動物和物品分開。',
      promptPronunciationTokens: reviewedPronunciationTokens('再看一組詞卡，把動物和物品分開。', 'ㄗㄞˋ ㄎㄢˋ ㄧˋ ㄗㄨˇ ㄘˊ ㄎㄚˇ ㄅㄚˇ ㄉㄨㄥˋ ㄨˋ ㄏㄜˊ ㄨˋ ㄆㄧㄣˇ ㄈㄣ ㄎㄞ'),
      studentOperationGuidance: '怎麼玩：① 看詞卡 → ② 點一個分類 → ③ 分完檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 看詞卡 → ② 點一個分類 → ③ 分完檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄘˊ ㄎㄚˇ ㄉㄧㄢˇ ㄧˊ ㄍㄜ˙ ㄈㄣ ㄌㄟˋ ㄈㄣ ㄨㄢˊ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      observations: Object.freeze([
        Object.freeze({ id: 'puppy', text: '小狗', pronunciationTokens: reviewedPronunciationTokens('小狗', 'ㄒㄧㄠˇ ㄍㄡˇ') }),
        Object.freeze({ id: 'bird', text: '小鳥', pronunciationTokens: reviewedPronunciationTokens('小鳥', 'ㄒㄧㄠˇ ㄋㄧㄠˇ') }),
        Object.freeze({ id: 'chair', text: '椅子', pronunciationTokens: reviewedPronunciationTokens('椅子', 'ㄧˇ ㄗ˙') }),
        Object.freeze({ id: 'schoolbag', text: '書包', pronunciationTokens: reviewedPronunciationTokens('書包', 'ㄕㄨ ㄅㄠ') }),
      ]),
      categories: Object.freeze([
        Object.freeze({ id: 'animal', label: '動物', pronunciationTokens: reviewedPronunciationTokens('動物', 'ㄉㄨㄥˋ ㄨˋ') }),
        Object.freeze({ id: 'object', label: '物品', pronunciationTokens: reviewedPronunciationTokens('物品', 'ㄨˋ ㄆㄧㄣˇ') }),
      ]),
      correctAssignments: Object.freeze({ puppy: 'animal', bird: 'animal', chair: 'object', schoolbag: 'object' }),
      hints: Object.freeze([
        hint('先看詞語說的是動物，還是物品。', 'ㄒㄧㄢ ㄎㄢˋ ㄘˊ ㄩˇ ㄕㄨㄛ ㄉㄜ˙ ㄕˋ ㄉㄨㄥˋ ㄨˋ ㄏㄞˊ ㄕˋ ㄨˋ ㄆㄧㄣˇ'),
        hint('每張詞卡只選一個分類。', 'ㄇㄟˇ ㄓㄤ ㄘˊ ㄎㄚˇ ㄓˇ ㄒㄩㄢˇ ㄧˊ ㄍㄜ˙ ㄈㄣ ㄌㄟˋ'),
      ]),
      correctFeedback: '你把詞語按意思分好了。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你把詞語按意思分好了。', 'ㄋㄧˇ ㄅㄚˇ ㄘˊ ㄩˇ ㄢˋ ㄧˋ ㄙ˙ ㄈㄣ ㄏㄠˇ ㄌㄜ˙'),
      incorrectFeedback: '再看詞卡，想想它是動物，還是生活用品。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看詞卡，想想它是動物，還是生活用品。', 'ㄗㄞˋ ㄎㄢˋ ㄘˊ ㄎㄚˇ ㄒㄧㄤˇ ㄒㄧㄤˇ ㄊㄚ ㄕˋ ㄉㄨㄥˋ ㄨˋ ㄏㄞˊ ㄕˋ ㄕㄥ ㄏㄨㄛˊ ㄩㄥˋ ㄆㄧㄣˇ'),
    }),
  ]),
});

const wordHunt = Object.freeze({
  ...common(
    'ACT-G1-CHINESE-WORD-HUNT-CANDIDATE',
    '詞語尋寶：從短句找指定詞',
    'ㄘˊ ㄩˇ ㄒㄩㄣˊ ㄅㄠˇ ㄘㄨㄥˊ ㄉㄨㄢˇ ㄐㄩˋ ㄓㄠˇ ㄓˇ ㄉㄧㄥˋ ㄘˊ',
    ['Ab-I-5'],
    'LO-G1-CHINESE-WORD-HUNT-01',
    '在短句中辨認指定的常用詞語。',
  ),
  instructions: '看清目標詞，再從短句卡找出一樣的詞。',
  instructionsPronunciationTokens: reviewedPronunciationTokens('看清目標詞，再從短句卡找出一樣的詞。', 'ㄎㄢˋ ㄑㄧㄥ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄗㄞˋ ㄘㄨㄥˊ ㄉㄨㄢˇ ㄐㄩˋ ㄎㄚˇ ㄓㄠˇ ㄔㄨ ㄧˊ ㄧㄤˋ ㄉㄜ˙ ㄘˊ'),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'find-word-in-short-lines',
      interaction: 'collect_evidence',
      requiredSelectionCount: 1,
      prompt: '找一找：哪張短句卡有「雨傘」？',
      promptPronunciationTokens: reviewedPronunciationTokens('找一找：哪張短句卡有「雨傘」？', 'ㄓㄠˇ ㄧˊ ㄓㄠˇ ㄋㄚˇ ㄓㄤ ㄉㄨㄢˇ ㄐㄩˋ ㄎㄚˇ ㄧㄡˇ ㄩˇ ㄙㄢˇ'),
      studentOperationGuidance: '怎麼玩：① 看目標詞 → ② 找有一樣詞的卡 → ③ 選一張檢查',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 看目標詞 → ② 找有一樣詞的卡 → ③ 選一張檢查', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄓㄠˇ ㄧㄡˇ ㄧˊ ㄧㄤˋ ㄘˊ ㄉㄜ˙ ㄎㄚˇ ㄒㄩㄢˇ ㄧˋ ㄓㄤ ㄐㄧㄢˇ ㄔㄚˊ'),
      options: Object.freeze([
        Object.freeze({ id: 'line-umbrella', text: '下雨時，我帶雨傘出門。', pronunciationTokens: reviewedPronunciationTokens('下雨時，我帶雨傘出門。', 'ㄒㄧㄚˋ ㄩˇ ㄕˊ ㄨㄛˇ ㄉㄞˋ ㄩˇ ㄙㄢˇ ㄔㄨ ㄇㄣˊ'), feedback: '這張短句卡有目標詞。', feedbackPronunciationTokens: reviewedPronunciationTokens('這張短句卡有目標詞。', 'ㄓㄜˋ ㄓㄤ ㄉㄨㄢˇ ㄐㄩˋ ㄎㄚˇ ㄧㄡˇ ㄇㄨˋ ㄅㄧㄠ ㄘˊ') }),
        Object.freeze({ id: 'line-window', text: '我在家裡看書。', pronunciationTokens: reviewedPronunciationTokens('我在家裡看書。', 'ㄨㄛˇ ㄗㄞˋ ㄐㄧㄚ ㄌㄧˇ ㄎㄢˋ ㄕㄨ'), feedback: '這張短句卡沒有目標詞，再逐字看看。', feedbackPronunciationTokens: reviewedPronunciationTokens('這張短句卡沒有目標詞，再逐字看看。', 'ㄓㄜˋ ㄓㄤ ㄉㄨㄢˇ ㄐㄩˋ ㄎㄚˇ ㄇㄟˊ ㄧㄡˇ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄗㄞˋ ㄓㄨˊ ㄗˋ ㄎㄢˋ ㄎㄢˋ') }),
        Object.freeze({ id: 'line-shoes', text: '小安把鞋子放好。', pronunciationTokens: reviewedPronunciationTokens('小安把鞋子放好。', 'ㄒㄧㄠˇ ㄢ ㄅㄚˇ ㄒㄧㄝˊ ㄗ˙ ㄈㄤˋ ㄏㄠˇ'), feedback: '這張短句卡沒有目標詞，再逐字看看。', feedbackPronunciationTokens: reviewedPronunciationTokens('這張短句卡沒有目標詞，再逐字看看。', 'ㄓㄜˋ ㄓㄤ ㄉㄨㄢˇ ㄐㄩˋ ㄎㄚˇ ㄇㄟˊ ㄧㄡˇ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄗㄞˋ ㄓㄨˊ ㄗˋ ㄎㄢˋ ㄎㄢˋ') }),
      ]),
      correctOptionIds: Object.freeze(['line-umbrella']),
      hints: Object.freeze([
        hint('先看目標詞的每個字。', 'ㄒㄧㄢ ㄎㄢˋ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄉㄜ˙ ㄇㄟˇ ㄍㄜ˙ ㄗˋ'),
        hint('逐張讀短句，找字完全一樣的一張。', 'ㄓㄨˊ ㄓㄤ ㄉㄨˊ ㄉㄨㄢˇ ㄐㄩˋ ㄓㄠˇ ㄗˋ ㄨㄢˊ ㄑㄩㄢˊ ㄧˊ ㄧㄤˋ ㄉㄜ˙ ㄧˋ ㄓㄤ'),
      ]),
      correctFeedback: '你找到短句裡一樣的詞了。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你找到短句裡一樣的詞了。', 'ㄋㄧˇ ㄓㄠˇ ㄉㄠˋ ㄉㄨㄢˇ ㄐㄩˋ ㄌㄧˇ ㄧˊ ㄧㄤˋ ㄉㄜ˙ ㄘˊ ㄌㄜ˙'),
      incorrectFeedback: '再看每張卡，找字完全相同的短句。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看每張卡，找字完全相同的短句。', 'ㄗㄞˋ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄓㄠˇ ㄗˋ ㄨㄢˊ ㄑㄩㄢˊ ㄒㄧㄤ ㄊㄨㄥˊ ㄉㄜ˙ ㄉㄨㄢˇ ㄐㄩˋ'),
    }),
    Object.freeze({
      stageId: 'check-word-card-match',
      interaction: 'choose_response',
      prompt: '目標詞是「雨傘」。哪張詞卡和它一模一樣？',
      promptPronunciationTokens: reviewedPronunciationTokens('目標詞是「雨傘」。哪張詞卡和它一模一樣？', 'ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄕˋ ㄩˇ ㄙㄢˇ ㄋㄚˇ ㄓㄤ ㄘˊ ㄎㄚˇ ㄏㄜˊ ㄊㄚ ㄧˊ ㄇㄛˊ ㄧˊ ㄧㄤˋ'),
      studentOperationGuidance: '怎麼玩：① 看目標詞 → ② 選一張一樣的詞卡 → ③ 檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 看目標詞 → ② 選一張一樣的詞卡 → ③ 檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄒㄩㄢˇ ㄧˋ ㄓㄤ ㄧˊ ㄧㄤˋ ㄉㄜ˙ ㄘˊ ㄎㄚˇ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      options: Object.freeze([
        Object.freeze({ id: 'match-umbrella', text: '雨傘', pronunciationTokens: reviewedPronunciationTokens('雨傘', 'ㄩˇ ㄙㄢˇ'), feedback: '這張詞卡和目標詞一樣。', feedbackPronunciationTokens: reviewedPronunciationTokens('這張詞卡和目標詞一樣。', 'ㄓㄜˋ ㄓㄤ ㄘˊ ㄎㄚˇ ㄏㄜˊ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄧˊ ㄧㄤˋ') }),
        Object.freeze({ id: 'match-rain-shoes', text: '雨鞋', pronunciationTokens: reviewedPronunciationTokens('雨鞋', 'ㄩˇ ㄒㄧㄝˊ'), feedback: '有一個字不同，再逐字對照。', feedbackPronunciationTokens: reviewedPronunciationTokens('有一個字不同，再逐字對照。', 'ㄧㄡˇ ㄧˊ ㄍㄜ˙ ㄗˋ ㄅㄨˋ ㄊㄨㄥˊ ㄗㄞˋ ㄓㄨˊ ㄗˋ ㄉㄨㄟˋ ㄓㄠˋ') }),
        Object.freeze({ id: 'match-raincoat', text: '雨衣', pronunciationTokens: reviewedPronunciationTokens('雨衣', 'ㄩˇ ㄧ'), feedback: '有一個字不同，再逐字對照。', feedbackPronunciationTokens: reviewedPronunciationTokens('有一個字不同，再逐字對照。', 'ㄧㄡˇ ㄧˊ ㄍㄜ˙ ㄗˋ ㄅㄨˋ ㄊㄨㄥˊ ㄗㄞˋ ㄓㄨˊ ㄗˋ ㄉㄨㄟˋ ㄓㄠˋ') }),
      ]),
      correctOptionIds: Object.freeze(['match-umbrella']),
      hints: Object.freeze([
        hint('看清目標詞的兩個字。', 'ㄎㄢˋ ㄑㄧㄥ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄉㄜ˙ ㄌㄧㄤˇ ㄍㄜ˙ ㄗˋ'),
        hint('一個字一個字對照，不要只看相同的字。', 'ㄧˊ ㄍㄜ˙ ㄗˋ ㄧˊ ㄍㄜ˙ ㄗˋ ㄉㄨㄟˋ ㄓㄠˋ ㄅㄨˊ ㄧㄠˋ ㄓˇ ㄎㄢˋ ㄒㄧㄤ ㄊㄨㄥˊ ㄉㄜ˙ ㄗˋ'),
      ]),
      correctFeedback: '你逐字比對，找到相同的詞卡。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你逐字比對，找到相同的詞卡。', 'ㄋㄧˇ ㄓㄨˊ ㄗˋ ㄅㄧˇ ㄉㄨㄟˋ ㄓㄠˇ ㄉㄠˋ ㄒㄧㄤ ㄊㄨㄥˊ ㄉㄜ˙ ㄘˊ ㄎㄚˇ'),
      incorrectFeedback: '再逐字看目標詞和詞卡，找出不同的字。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再逐字看目標詞和詞卡，找出不同的字。', 'ㄗㄞˋ ㄓㄨˊ ㄗˋ ㄎㄢˋ ㄇㄨˋ ㄅㄧㄠ ㄘˊ ㄏㄜˊ ㄘˊ ㄎㄚˇ ㄓㄠˇ ㄔㄨ ㄅㄨˋ ㄊㄨㄥˊ ㄉㄜ˙ ㄗˋ'),
    }),
  ]),
});

const sentenceMeaning = Object.freeze({
  ...common(
    'ACT-G1-CHINESE-SENTENCE-MEANING-CANDIDATE',
    '一句話讀懂了：句子意思配對',
    'ㄧˊ ㄐㄩˋ ㄏㄨㄚˋ ㄉㄨˊ ㄉㄨㄥˇ ㄌㄜ˙ ㄐㄩˋ ㄗˇ ㄧˋ ㄙ˙ ㄆㄟˋ ㄉㄨㄟˋ',
    ['Ac-I-2', '5-I-4'],
    'LO-G1-CHINESE-SENTENCE-MEANING-01',
    '讀懂短句明確說出的事情，辨認人物、動作或地點。',
  ),
  instructions: '讀短句，選出句子明確說的事情。',
  instructionsPronunciationTokens: reviewedPronunciationTokens('讀短句，選出句子明確說的事情。', 'ㄉㄨˊ ㄉㄨㄢˇ ㄐㄩˋ ㄒㄩㄢˇ ㄔㄨ ㄐㄩˋ ㄗˇ ㄇㄧㄥˊ ㄑㄩㄝˋ ㄕㄨㄛ ㄉㄜ˙ ㄕˋ ㄑㄧㄥˊ'),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'read-one-action-sentence',
      interaction: 'choose_response',
      prompt: '讀一讀：「小安把書放進書包。」小安做了什麼？',
      promptPronunciationTokens: reviewedPronunciationTokens('讀一讀：「小安把書放進書包。」小安做了什麼？', 'ㄉㄨˊ ㄧˊ ㄉㄨˊ ㄒㄧㄠˇ ㄢ ㄅㄚˇ ㄕㄨ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ ㄒㄧㄠˇ ㄢ ㄗㄨㄛˋ ㄌㄜ˙ ㄕㄣˊ ㄇㄜ˙'),
      studentOperationGuidance: '怎麼玩：① 看短句 → ② 選出句子說的事 → ③ 檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 看短句 → ② 選出句子說的事 → ③ 檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄉㄨㄢˇ ㄐㄩˋ ㄒㄩㄢˇ ㄔㄨ ㄐㄩˋ ㄗˇ ㄕㄨㄛ ㄉㄜ˙ ㄕˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      options: Object.freeze([
        Object.freeze({ id: 'action-put-book-away', text: '把書放進書包。', pronunciationTokens: reviewedPronunciationTokens('把書放進書包。', 'ㄅㄚˇ ㄕㄨ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ'), feedback: '短句說小安把書放進書包。', feedbackPronunciationTokens: reviewedPronunciationTokens('短句說小安把書放進書包。', 'ㄉㄨㄢˇ ㄐㄩˋ ㄕㄨㄛ ㄒㄧㄠˇ ㄢ ㄅㄚˇ ㄕㄨ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ') }),
        Object.freeze({ id: 'action-put-bottle-away', text: '把水壺放進書包。', pronunciationTokens: reviewedPronunciationTokens('把水壺放進書包。', 'ㄅㄚˇ ㄕㄨㄟˇ ㄏㄨˊ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ'), feedback: '再看短句裡小安拿的是哪一樣東西。', feedbackPronunciationTokens: reviewedPronunciationTokens('再看短句裡小安拿的是哪一樣東西。', 'ㄗㄞˋ ㄎㄢˋ ㄉㄨㄢˇ ㄐㄩˋ ㄌㄧˇ ㄒㄧㄠˇ ㄢ ㄋㄚˊ ㄉㄜ˙ ㄕˋ ㄋㄚˇ ㄧˊ ㄧㄤˋ ㄉㄨㄥ ㄒㄧ') }),
        Object.freeze({ id: 'action-take-book-out', text: '把書拿出書包。', pronunciationTokens: reviewedPronunciationTokens('把書拿出書包。', 'ㄅㄚˇ ㄕㄨ ㄋㄚˊ ㄔㄨ ㄕㄨ ㄅㄠ'), feedback: '再看短句裡的動作，是放進還是拿出。', feedbackPronunciationTokens: reviewedPronunciationTokens('再看短句裡的動作，是放進還是拿出。', 'ㄗㄞˋ ㄎㄢˋ ㄉㄨㄢˇ ㄐㄩˋ ㄌㄧˇ ㄉㄜ˙ ㄉㄨㄥˋ ㄗㄨㄛˋ ㄕˋ ㄈㄤˋ ㄐㄧㄣˋ ㄏㄞˊ ㄕˋ ㄋㄚˊ ㄔㄨ') }),
      ]),
      correctOptionIds: Object.freeze(['action-put-book-away']),
      hints: Object.freeze([
        hint('找句子裡「小安」後面做的動作。', 'ㄓㄠˇ ㄐㄩˋ ㄗˇ ㄌㄧˇ ㄒㄧㄠˇ ㄢ ㄏㄡˋ ㄇㄧㄢˋ ㄗㄨㄛˋ ㄉㄜ˙ ㄉㄨㄥˋ ㄗㄨㄛˋ'),
        hint('再看清楚句子裡的東西和動作。', 'ㄗㄞˋ ㄎㄢˋ ㄑㄧㄥ ㄔㄨˇ ㄐㄩˋ ㄗˇ ㄌㄧˇ ㄉㄜ˙ ㄉㄨㄥ ㄒㄧ ㄏㄜˊ ㄉㄨㄥˋ ㄗㄨㄛˋ'),
      ]),
      correctFeedback: '你照著短句找到人物做的事。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你照著短句找到人物做的事。', 'ㄋㄧˇ ㄓㄠˋ ㄓㄜ˙ ㄉㄨㄢˇ ㄐㄩˋ ㄓㄠˇ ㄉㄠˋ ㄖㄣˊ ㄨˋ ㄗㄨㄛˋ ㄉㄜ˙ ㄕˋ'),
      incorrectFeedback: '再看動作和東西，選短句真的說的事。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看動作和東西，選短句真的說的事。', 'ㄗㄞˋ ㄎㄢˋ ㄉㄨㄥˋ ㄗㄨㄛˋ ㄏㄜˊ ㄉㄨㄥ ㄒㄧ ㄒㄩㄢˇ ㄉㄨㄢˇ ㄐㄩˋ ㄓㄣ ㄉㄜ˙ ㄕㄨㄛ ㄉㄜ˙ ㄕˋ'),
    }),
    Object.freeze({
      stageId: 'read-one-description-sentence',
      interaction: 'choose_response',
      prompt: '讀一讀：「小兔在草地上吃青菜。」小兔在哪裡？',
      promptPronunciationTokens: reviewedPronunciationTokens('讀一讀：「小兔在草地上吃青菜。」小兔在哪裡？', 'ㄉㄨˊ ㄧˊ ㄉㄨˊ ㄒㄧㄠˇ ㄊㄨˋ ㄗㄞˋ ㄘㄠˇ ㄉㄧˋ ㄕㄤˋ ㄔ ㄑㄧㄥ ㄘㄞˋ ㄒㄧㄠˇ ㄊㄨˋ ㄗㄞˋ ㄋㄚˇ ㄌㄧˇ'),
      studentOperationGuidance: '怎麼玩：① 看短句 → ② 選出句子說的地方 → ③ 檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 看短句 → ② 選出句子說的地方 → ③ 檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄉㄨㄢˇ ㄐㄩˋ ㄒㄩㄢˇ ㄔㄨ ㄐㄩˋ ㄗˇ ㄕㄨㄛ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      options: Object.freeze([
        Object.freeze({ id: 'place-grass', text: '草地上', pronunciationTokens: reviewedPronunciationTokens('草地上', 'ㄘㄠˇ ㄉㄧˋ ㄕㄤˋ'), feedback: '短句寫小兔在草地上。', feedbackPronunciationTokens: reviewedPronunciationTokens('短句寫小兔在草地上。', 'ㄉㄨㄢˇ ㄐㄩˋ ㄒㄧㄝˇ ㄒㄧㄠˇ ㄊㄨˋ ㄗㄞˋ ㄘㄠˇ ㄉㄧˋ ㄕㄤˋ') }),
        Object.freeze({ id: 'place-water', text: '水裡', pronunciationTokens: reviewedPronunciationTokens('水裡', 'ㄕㄨㄟˇ ㄌㄧˇ'), feedback: '再找找句子裡表示地方的詞。', feedbackPronunciationTokens: reviewedPronunciationTokens('再找找句子裡表示地方的詞。', 'ㄗㄞˋ ㄓㄠˇ ㄓㄠˇ ㄐㄩˋ ㄗˇ ㄌㄧˇ ㄅㄧㄠˇ ㄕˋ ㄉㄧˋ ㄈㄤ ㄉㄜ˙ ㄘˊ') }),
        Object.freeze({ id: 'place-tree', text: '樹上', pronunciationTokens: reviewedPronunciationTokens('樹上', 'ㄕㄨˋ ㄕㄤˋ'), feedback: '再找找句子裡表示地方的詞。', feedbackPronunciationTokens: reviewedPronunciationTokens('再找找句子裡表示地方的詞。', 'ㄗㄞˋ ㄓㄠˇ ㄓㄠˇ ㄐㄩˋ ㄗˇ ㄌㄧˇ ㄅㄧㄠˇ ㄕˋ ㄉㄧˋ ㄈㄤ ㄉㄜ˙ ㄘˊ') }),
      ]),
      correctOptionIds: Object.freeze(['place-grass']),
      hints: Object.freeze([
        hint('先找句子裡表示地方的詞。', 'ㄒㄧㄢ ㄓㄠˇ ㄐㄩˋ ㄗˇ ㄌㄧˇ ㄅㄧㄠˇ ㄕˋ ㄉㄧˋ ㄈㄤ ㄉㄜ˙ ㄘˊ'),
        hint('看看小兔在哪裡吃青菜。', 'ㄎㄢˋ ㄎㄢˋ ㄒㄧㄠˇ ㄊㄨˋ ㄗㄞˋ ㄋㄚˇ ㄌㄧˇ ㄔ ㄑㄧㄥ ㄘㄞˋ'),
      ]),
      correctFeedback: '你從短句找到地點了。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你從短句找到地點了。', 'ㄋㄧˇ ㄘㄨㄥˊ ㄉㄨㄢˇ ㄐㄩˋ ㄓㄠˇ ㄉㄠˋ ㄉㄧˋ ㄉㄧㄢˇ ㄌㄜ˙'),
      incorrectFeedback: '回到短句，找小兔所在的地方。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('回到短句，找小兔所在的地方。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄐㄩˋ ㄓㄠˇ ㄒㄧㄠˇ ㄊㄨˋ ㄙㄨㄛˇ ㄗㄞˋ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ'),
    }),
  ]),
});

const readingClue = Object.freeze({
  ...common(
    'ACT-G1-CHINESE-READING-CLUE-CANDIDATE',
    '短文線索小偵探：找到重要訊息',
    'ㄉㄨㄢˇ ㄨㄣˊ ㄒㄧㄢˋ ㄙㄨㄛˇ ㄒㄧㄠˇ ㄓㄣ ㄊㄢˋ ㄓㄠˇ ㄉㄠˋ ㄓㄨㄥˋ ㄧㄠˋ ㄒㄧㄣˋ ㄒㄧˊ',
    ['5-I-4', '5-I-6', 'Ad-I-3'],
    'LO-G1-CHINESE-READING-CLUE-01',
    '回到極短短文，找出問題明確詢問的重要訊息。',
  ),
  instructions: '先讀短文，再找題目問的線索。',
  instructionsPronunciationTokens: reviewedPronunciationTokens('先讀短文，再找題目問的線索。', 'ㄒㄧㄢ ㄉㄨˊ ㄉㄨㄢˇ ㄨㄣˊ ㄗㄞˋ ㄓㄠˇ ㄊㄧˊ ㄇㄨˋ ㄨㄣˋ ㄉㄜ˙ ㄒㄧㄢˋ ㄙㄨㄛˇ'),
  passages: Object.freeze({
    'after-school': Object.freeze({
      title: '下課後',
      titlePronunciationTokens: reviewedPronunciationTokens('下課後', 'ㄒㄧㄚˋ ㄎㄜˋ ㄏㄡˋ'),
      lines: Object.freeze([
        Object.freeze({ text: '小文把畫紙放進書包。', pronunciationTokens: reviewedPronunciationTokens('小文把畫紙放進書包。', 'ㄒㄧㄠˇ ㄨㄣˊ ㄅㄚˇ ㄏㄨㄚˋ ㄓˇ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ') }),
        Object.freeze({ text: '他走到門口，和媽媽一起回家。', pronunciationTokens: reviewedPronunciationTokens('他走到門口，和媽媽一起回家。', 'ㄊㄚ ㄗㄡˇ ㄉㄠˋ ㄇㄣˊ ㄎㄡˇ ㄏㄜˊ ㄇㄚ ㄇㄚ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ') }),
      ]),
    }),
  }),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'collect-explicit-reading-clue',
      interaction: 'collect_evidence',
      requiredSelectionCount: 1,
      passageId: 'after-school',
      prompt: '小文把什麼放進書包？找一張線索卡。',
      promptPronunciationTokens: reviewedPronunciationTokens('小文把什麼放進書包？找一張線索卡。', 'ㄒㄧㄠˇ ㄨㄣˊ ㄅㄚˇ ㄕㄣˊ ㄇㄜ˙ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ ㄓㄠˇ ㄧˋ ㄓㄤ ㄒㄧㄢˋ ㄙㄨㄛˇ ㄎㄚˇ'),
      studentOperationGuidance: '怎麼玩：① 讀短文 → ② 找回答案的線索 → ③ 選一張檢查',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 讀短文 → ② 找回答案的線索 → ③ 選一張檢查', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄉㄨˊ ㄉㄨㄢˇ ㄨㄣˊ ㄓㄠˇ ㄏㄨㄟˊ ㄉㄚˊ ㄢˋ ㄉㄜ˙ ㄒㄧㄢˋ ㄙㄨㄛˇ ㄒㄩㄢˇ ㄧˋ ㄓㄤ ㄐㄧㄢˇ ㄔㄚˊ'),
      options: Object.freeze([
        Object.freeze({ id: 'clue-art-paper', text: '畫紙', pronunciationTokens: reviewedPronunciationTokens('畫紙', 'ㄏㄨㄚˋ ㄓˇ'), feedback: '這張線索卡和短文裡放進書包的東西相同。', feedbackPronunciationTokens: reviewedPronunciationTokens('這張線索卡和短文裡放進書包的東西相同。', 'ㄓㄜˋ ㄓㄤ ㄒㄧㄢˋ ㄙㄨㄛˇ ㄎㄚˇ ㄏㄜˊ ㄉㄨㄢˇ ㄨㄣˊ ㄌㄧˇ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ ㄉㄜ˙ ㄉㄨㄥ ㄒㄧ ㄒㄧㄤ ㄊㄨㄥˊ') }),
        Object.freeze({ id: 'clue-water-bottle', text: '水壺', pronunciationTokens: reviewedPronunciationTokens('水壺', 'ㄕㄨㄟˇ ㄏㄨˊ'), feedback: '回到短文第一句，再看小文放進書包的是什麼。', feedbackPronunciationTokens: reviewedPronunciationTokens('回到短文第一句，再看小文放進書包的是什麼。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄨㄣˊ ㄉㄧˋ ㄧˊ ㄐㄩˋ ㄗㄞˋ ㄎㄢˋ ㄒㄧㄠˇ ㄨㄣˊ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ ㄉㄜ˙ ㄕˋ ㄕㄣˊ ㄇㄜ˙') }),
        Object.freeze({ id: 'clue-ball', text: '球', pronunciationTokens: reviewedPronunciationTokens('球', 'ㄑㄧㄡˊ'), feedback: '回到短文第一句，再看小文放進書包的是什麼。', feedbackPronunciationTokens: reviewedPronunciationTokens('回到短文第一句，再看小文放進書包的是什麼。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄨㄣˊ ㄉㄧˋ ㄧˊ ㄐㄩˋ ㄗㄞˋ ㄎㄢˋ ㄒㄧㄠˇ ㄨㄣˊ ㄈㄤˋ ㄐㄧㄣˋ ㄕㄨ ㄅㄠ ㄉㄜ˙ ㄕˋ ㄕㄣˊ ㄇㄜ˙') }),
      ]),
      correctOptionIds: Object.freeze(['clue-art-paper']),
      hints: Object.freeze([
        hint('回到短文，找到題目問的那一句。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄨㄣˊ ㄓㄠˇ ㄉㄠˋ ㄊㄧˊ ㄇㄨˋ ㄨㄣˋ ㄉㄜ˙ ㄋㄚˋ ㄧˊ ㄐㄩˋ'),
        hint('先看題目問的是哪一樣東西，再對照短文。', 'ㄒㄧㄢ ㄎㄢˋ ㄊㄧˊ ㄇㄨˋ ㄨㄣˋ ㄉㄜ˙ ㄕˋ ㄋㄚˇ ㄧˊ ㄧㄤˋ ㄉㄨㄥ ㄒㄧ ㄗㄞˋ ㄉㄨㄟˋ ㄓㄠˋ ㄉㄨㄢˇ ㄨㄣˊ'),
      ]),
      correctFeedback: '你回到短文，找到重要訊息了。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你回到短文，找到重要訊息了。', 'ㄋㄧˇ ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄨㄣˊ ㄓㄠˇ ㄉㄠˋ ㄓㄨㄥˋ ㄧㄠˋ ㄒㄧㄣˋ ㄒㄧˊ ㄌㄜ˙'),
      incorrectFeedback: '再讀題目，回到短文找相同的詞。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再讀題目，回到短文找相同的詞。', 'ㄗㄞˋ ㄉㄨˊ ㄊㄧˊ ㄇㄨˋ ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄨㄣˊ ㄓㄠˇ ㄒㄧㄤ ㄊㄨㄥˊ ㄉㄜ˙ ㄘˊ'),
    }),
    Object.freeze({
      stageId: 'answer-from-text-clue',
      interaction: 'choose_response',
      passageId: 'after-school',
      prompt: '小文和誰一起回家？',
      promptPronunciationTokens: reviewedPronunciationTokens('小文和誰一起回家？', 'ㄒㄧㄠˇ ㄨㄣˊ ㄏㄜˊ ㄕㄟˊ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ'),
      studentOperationGuidance: '怎麼玩：① 讀短文 → ② 選出答案 → ③ 檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPronunciationTokens('怎麼玩：① 讀短文 → ② 選出答案 → ③ 檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄉㄨˊ ㄉㄨㄢˇ ㄨㄣˊ ㄒㄩㄢˇ ㄔㄨ ㄉㄚˊ ㄢˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      options: Object.freeze([
        Object.freeze({ id: 'answer-mother', text: '媽媽', pronunciationTokens: reviewedPronunciationTokens('媽媽', 'ㄇㄚ ㄇㄚ'), feedback: '短文寫小文和媽媽一起回家。', feedbackPronunciationTokens: reviewedPronunciationTokens('短文寫小文和媽媽一起回家。', 'ㄉㄨㄢˇ ㄨㄣˊ ㄒㄧㄝˇ ㄒㄧㄠˇ ㄨㄣˊ ㄏㄜˊ ㄇㄚ ㄇㄚ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ') }),
        Object.freeze({ id: 'answer-classmate', text: '同學', pronunciationTokens: reviewedPronunciationTokens('同學', 'ㄊㄨㄥˊ ㄒㄩㄝˊ'), feedback: '再看短文裡和小文一起回家的人。', feedbackPronunciationTokens: reviewedPronunciationTokens('再看短文裡和小文一起回家的人。', 'ㄗㄞˋ ㄎㄢˋ ㄉㄨㄢˇ ㄨㄣˊ ㄌㄧˇ ㄏㄜˊ ㄒㄧㄠˇ ㄨㄣˊ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ ㄉㄜ˙ ㄖㄣˊ') }),
        Object.freeze({ id: 'answer-teacher', text: '老師', pronunciationTokens: reviewedPronunciationTokens('老師', 'ㄌㄠˇ ㄕ'), feedback: '再看短文裡和小文一起回家的人。', feedbackPronunciationTokens: reviewedPronunciationTokens('再看短文裡和小文一起回家的人。', 'ㄗㄞˋ ㄎㄢˋ ㄉㄨㄢˇ ㄨㄣˊ ㄌㄧˇ ㄏㄜˊ ㄒㄧㄠˇ ㄨㄣˊ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ ㄉㄜ˙ ㄖㄣˊ') }),
      ]),
      correctOptionIds: Object.freeze(['answer-mother']),
      hints: Object.freeze([
        hint('找一找，句子裡和「誰」有關的詞。', 'ㄓㄠˇ ㄧˋ ㄓㄠˇ ㄐㄩˋ ㄗˇ ㄌㄧˇ ㄏㄜˊ ㄕㄟˊ ㄧㄡˇ ㄍㄨㄢ ㄉㄜ˙ ㄘˊ'),
        hint('回到短文第二句，看看誰和小文一起回家。', 'ㄏㄨㄟˊ ㄉㄠˋ ㄉㄨㄢˇ ㄨㄣˊ ㄉㄧˋ ㄦˋ ㄐㄩˋ ㄎㄢˋ ㄎㄢˋ ㄕㄟˊ ㄏㄜˊ ㄒㄧㄠˇ ㄨㄣˊ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ'),
      ]),
      correctFeedback: '你從短文找到一起回家的人了。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('你從短文找到一起回家的人了。', 'ㄋㄧˇ ㄘㄨㄥˊ ㄉㄨㄢˇ ㄨㄣˊ ㄓㄠˇ ㄉㄠˋ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ ㄉㄜ˙ ㄖㄣˊ ㄌㄜ˙'),
      incorrectFeedback: '再看短文第二句，找出和小文一起回家的人。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再看短文第二句，找出和小文一起回家的人。', 'ㄗㄞˋ ㄎㄢˋ ㄉㄨㄢˇ ㄨㄣˊ ㄉㄧˋ ㄦˋ ㄐㄩˋ ㄓㄠˇ ㄔㄨ ㄏㄜˊ ㄒㄧㄠˇ ㄨㄣˊ ㄧˋ ㄑㄧˇ ㄏㄨㄟˊ ㄐㄧㄚ ㄉㄜ˙ ㄖㄣˊ'),
    }),
  ]),
});

export const GRADE1_CHINESE_EXPANSION_ACTIVITIES = Object.freeze([
  wordMeaningSort,
  wordHunt,
  sentenceMeaning,
  readingClue,
]);
