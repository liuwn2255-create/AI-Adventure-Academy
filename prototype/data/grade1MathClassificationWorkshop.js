const annotated = (text, readings) => {
  const readingList = readings ? readings.trim().split(/\s+/u) : [];
  let index = 0;
  const pronunciationTokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = readingList[index++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (index !== readingList.length) throw new Error(`Extra reviewed pronunciation for ${text}`);
  return Object.freeze({ text, pronunciationTokens: Object.freeze(pronunciationTokens) });
};

const observations = Object.freeze([
  annotated('紅色圓形鈕扣', 'ㄏㄨㄥˊ ㄙㄜˋ ㄩㄢˊ ㄒㄧㄥˊ ㄋㄧㄡˇ ㄎㄡˋ'),
  annotated('藍色圓形鈕扣', 'ㄌㄢˊ ㄙㄜˋ ㄩㄢˊ ㄒㄧㄥˊ ㄋㄧㄡˇ ㄎㄡˋ'),
  annotated('紅色方形紙片', 'ㄏㄨㄥˊ ㄙㄜˋ ㄈㄤ ㄒㄧㄥˊ ㄓˇ ㄆㄧㄢˋ'),
  annotated('藍色方形紙片', 'ㄌㄢˊ ㄙㄜˋ ㄈㄤ ㄒㄧㄥˊ ㄓˇ ㄆㄧㄢˋ'),
].map((item, index) => Object.freeze({ id: ['tile-red-round', 'tile-blue-round', 'tile-red-square', 'tile-blue-square'][index], ...item })));

const category = (id, label, readings) => Object.freeze({ id, label, pronunciationTokens: annotated(label, readings).pronunciationTokens });
const hint = (text, readings) => annotated(text, readings);
const option = (id, text, readings, feedback, feedbackReadings) => Object.freeze({
  id,
  ...annotated(text, readings),
  feedback,
  feedbackPronunciationTokens: annotated(feedback, feedbackReadings).pronunciationTokens,
});

export const GRADE1_MATH_CLASSIFICATION_WORKSHOP = Object.freeze({
  activityId: 'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE', revision: 1,
  title: '分類小小研究站：同一組物品，兩種分法', gradeId: 'grade-1', subjectId: 'mathematics',
  titlePronunciationTokens: annotated('分類小小研究站：同一組物品，兩種分法', 'ㄈㄣ ㄌㄟˋ ㄒㄧㄠˇ ㄒㄧㄠˇ ㄧㄢˊ ㄐㄧㄡˋ ㄓㄢˋ ㄊㄨㄥˊ ㄧˋ ㄗㄨˇ ㄨˋ ㄆㄧㄣˇ ㄌㄧㄤˇ ㄓㄨㄥˇ ㄈㄣ ㄈㄚˇ').pronunciationTokens,
  status: 'candidate_pending_teacher_review', sourceKind: 'original_simulated_classification_candidate_not_textbook',
  curriculumMapId: 'math-grade1-simple-classification', sourceId: 'mathematics', curriculumCodes: ['D-1-1', 'd-I-1'],
  learningSubitemClaims: Object.freeze(['SUB-MATH-G1-D1-1-SAME-DATA-TWO-CLASSIFICATIONS']),
  curriculumScope: '對照官方 D-1-1 的日常物品蒐集、分類、記錄／呈現及同一組資料可用不同方式分類。本螢幕任務讓學生對同四張物品卡先按顏色、再按形狀分類並辨認分類依據；未實作學生自行蒐集實物、自由創作記錄圖或完整口頭說明。這是部分候選練習，不代表涵蓋完整條目。',
  learningObjective: { objectiveId: 'LO-G1-MATH-D1-1-CLASSIFY-TWO-WAYS-01', statement: '依選定特徵分類一組日常物品，並觀察同一組物品可用不同特徵重新分類。', status: 'candidate_pending_teacher_review' },
  instructions: '讀取物品卡上已提供的特徵，先依顏色分類，再用同一組卡片改依形狀分類。分類與提交都只影響本次記憶體遊戲狀態。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'sort-same-set-by-colour', interaction: 'classify_observations',
      prompt: '看卡片的顏色，把 4 張卡分成紅色和藍色。',
      promptPronunciationTokens: annotated('看卡片的顏色，把 4 張卡分成紅色和藍色。', 'ㄎㄢˋ ㄎㄚˇ ㄆㄧㄢˋ ㄉㄜ˙ ㄧㄢˊ ㄙㄜˋ ㄅㄚˇ ㄓㄤ ㄎㄚˇ ㄈㄣ ㄔㄥˊ ㄏㄨㄥˊ ㄙㄜˋ ㄏㄜˊ ㄌㄢˊ ㄙㄜˋ').pronunciationTokens,
      studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案',
      studentOperationGuidancePronunciationTokens: annotated('怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄅㄤ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄩㄢˇ ㄧˊ ㄌㄟˋ ㄑㄩㄢˊ ㄅㄨˋ ㄈㄣ ㄏㄠˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ').pronunciationTokens,
      observations,
      categories: Object.freeze([category('red', '紅色', 'ㄏㄨㄥˊ ㄙㄜˋ'), category('blue', '藍色', 'ㄌㄢˊ ㄙㄜˋ')]),
      correctAssignments: Object.freeze({ 'tile-red-round': 'red', 'tile-blue-round': 'blue', 'tile-red-square': 'red', 'tile-blue-square': 'blue' }),
      hints: Object.freeze([
        hint('這一關只看顏色。', 'ㄓㄜˋ ㄧˋ ㄍㄨㄢ ㄓˇ ㄎㄢˋ ㄧㄢˊ ㄙㄜˋ'),
        hint('紅色卡放紅色，藍色卡放藍色。', 'ㄏㄨㄥˊ ㄙㄜˋ ㄎㄚˇ ㄈㄤˋ ㄏㄨㄥˊ ㄙㄜˋ ㄌㄢˊ ㄙㄜˋ ㄎㄚˇ ㄈㄤˋ ㄌㄢˊ ㄙㄜˋ'),
      ]),
      incorrectFeedback: '再看一次每張卡的顏色，紅色放紅色，藍色放藍色。',
      incorrectFeedbackPronunciationTokens: annotated('再看一次每張卡的顏色，紅色放紅色，藍色放藍色。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄉㄜ˙ ㄧㄢˊ ㄙㄜˋ ㄏㄨㄥˊ ㄙㄜˋ ㄈㄤˋ ㄏㄨㄥˊ ㄙㄜˋ ㄌㄢˊ ㄙㄜˋ ㄈㄤˋ ㄌㄢˊ ㄙㄜˋ').pronunciationTokens,
      correctFeedback: '答對了！你用顏色把同一組卡片分成兩類。下一關要改看形狀。',
      correctFeedbackPronunciationTokens: annotated('答對了！你用顏色把同一組卡片分成兩類。下一關要改看形狀。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄋㄧˇ ㄩㄥˋ ㄧㄢˊ ㄙㄜˋ ㄅㄚˇ ㄊㄨㄥˊ ㄧˊ ㄗㄨˇ ㄎㄚˇ ㄆㄧㄢˋ ㄈㄣ ㄔㄥˊ ㄌㄧㄤˇ ㄌㄟˋ ㄒㄧㄚˋ ㄧˋ ㄍㄨㄢ ㄧㄠˋ ㄍㄞˇ ㄎㄢˋ ㄒㄧㄥˊ ㄓㄨㄤˋ').pronunciationTokens,
    }),
    Object.freeze({
      stageId: 're-sort-same-set-by-shape', interaction: 'classify_observations',
      prompt: '還是這 4 張卡。這次看形狀，分成圓形和方形。',
      promptPronunciationTokens: annotated('還是這 4 張卡。這次看形狀，分成圓形和方形。', 'ㄏㄞˊ ㄕˋ ㄓㄜˋ ㄓㄤ ㄎㄚˇ ㄓㄜˋ ㄘˋ ㄎㄢˋ ㄒㄧㄥˊ ㄓㄨㄤˋ ㄈㄣ ㄔㄥˊ ㄩㄢˊ ㄒㄧㄥˊ ㄏㄜˊ ㄈㄤ ㄒㄧㄥˊ').pronunciationTokens,
      studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案',
      studentOperationGuidancePronunciationTokens: annotated('怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄅㄤ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄩㄢˇ ㄧˊ ㄌㄟˋ ㄑㄩㄢˊ ㄅㄨˋ ㄈㄣ ㄏㄠˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ').pronunciationTokens,
      observations,
      categories: Object.freeze([category('round', '圓形', 'ㄩㄢˊ ㄒㄧㄥˊ'), category('square', '方形', 'ㄈㄤ ㄒㄧㄥˊ')]),
      correctAssignments: Object.freeze({ 'tile-red-round': 'round', 'tile-blue-round': 'round', 'tile-red-square': 'square', 'tile-blue-square': 'square' }),
      hints: Object.freeze([
        hint('這一關只看形狀。', 'ㄓㄜˋ ㄧˋ ㄍㄨㄢ ㄓˇ ㄎㄢˋ ㄒㄧㄥˊ ㄓㄨㄤˋ'),
        hint('圓形放圓形，方形放方形。', 'ㄩㄢˊ ㄒㄧㄥˊ ㄈㄤˋ ㄩㄢˊ ㄒㄧㄥˊ ㄈㄤ ㄒㄧㄥˊ ㄈㄤˋ ㄈㄤ ㄒㄧㄥˊ'),
      ]),
      incorrectFeedback: '再看一次每張卡的形狀，圓形放圓形，方形放方形。',
      incorrectFeedbackPronunciationTokens: annotated('再看一次每張卡的形狀，圓形放圓形，方形放方形。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄉㄜ˙ ㄒㄧㄥˊ ㄓㄨㄤˋ ㄩㄢˊ ㄒㄧㄥˊ ㄈㄤˋ ㄩㄢˊ ㄒㄧㄥˊ ㄈㄤ ㄒㄧㄥˊ ㄈㄤˋ ㄈㄤ ㄒㄧㄥˊ').pronunciationTokens,
      correctFeedback: '答對了！同一組卡片，也可以改用形狀分成兩類。',
      correctFeedbackPronunciationTokens: annotated('答對了！同一組卡片，也可以改用形狀分成兩類。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄊㄨㄥˊ ㄧˋ ㄗㄨˇ ㄎㄚˇ ㄆㄧㄢˋ ㄧㄝˇ ㄎㄜˇ ㄧˇ ㄍㄞˇ ㄩㄥˋ ㄒㄧㄥˊ ㄓㄨㄤˋ ㄈㄣ ㄔㄥˊ ㄌㄧㄤˇ ㄌㄟˋ').pronunciationTokens,
    }),
    Object.freeze({
      stageId: 'identify-classification-rule', interaction: 'choose_response',
      prompt: '同樣的 4 張卡，為什麼兩次分得不一樣？',
      promptPronunciationTokens: annotated('同樣的 4 張卡，為什麼兩次分得不一樣？', 'ㄊㄨㄥˊ ㄧㄤˋ ㄉㄜ˙ ㄓㄤ ㄎㄚˇ ㄨㄟˋ ㄕㄣˊ ㄇㄜ˙ ㄌㄧㄤˇ ㄘˋ ㄈㄣ ㄉㄜ˙ ㄅㄨˋ ㄧˊ ㄧㄤˋ').pronunciationTokens,
      options: Object.freeze([
        option('rule-selected-feature', '第一次看顏色，第二次看形狀。', 'ㄉㄧˋ ㄧ ㄘˋ ㄎㄢˋ ㄧㄢˊ ㄙㄜˋ ㄉㄧˋ ㄦˋ ㄘˋ ㄎㄢˋ ㄒㄧㄥˊ ㄓㄨㄤˋ', '對！第一次看顏色，第二次看形狀。', 'ㄉㄨㄟˋ ㄉㄧˋ ㄧ ㄘˋ ㄎㄢˋ ㄧㄢˊ ㄙㄜˋ ㄉㄧˋ ㄦˋ ㄘˋ ㄎㄢˋ ㄒㄧㄥˊ ㄓㄨㄤˋ'),
        option('rule-card-changed', '第二次換了別的卡片。', 'ㄉㄧˋ ㄦˋ ㄘˋ ㄏㄨㄢˋ ㄌㄜ˙ ㄅㄧㄝˊ ㄉㄜ˙ ㄎㄚˇ ㄆㄧㄢˋ', '卡片沒有換，兩次都是同一組卡片。', 'ㄎㄚˇ ㄆㄧㄢˋ ㄇㄟˊ ㄧㄡˇ ㄏㄨㄢˋ ㄌㄧㄤˇ ㄘˋ ㄉㄡ ㄕˋ ㄊㄨㄥˊ ㄧˊ ㄗㄨˇ ㄎㄚˇ ㄆㄧㄢˋ'),
        option('rule-random', '卡片想放哪裡都可以。', 'ㄎㄚˇ ㄆㄧㄢˋ ㄒㄧㄤˇ ㄈㄤˋ ㄋㄚˇ ㄌㄧˇ ㄉㄡ ㄎㄜˇ ㄧˇ', '分類要先決定看哪一個特徵。', 'ㄈㄣ ㄌㄟˋ ㄧㄠˋ ㄒㄧㄢ ㄐㄩㄝˊ ㄉㄧㄥˋ ㄎㄢˋ ㄋㄚˇ ㄧˊ ㄍㄜ˙ ㄊㄜˋ ㄓㄥ'),
      ]),
      correctOptionIds: Object.freeze(['rule-selected-feature']),
      hints: Object.freeze([
        hint('想一想：兩次看的地方一樣嗎？', 'ㄒㄧㄤˇ ㄧ˙ ㄒㄧㄤˇ ㄌㄧㄤˇ ㄘˋ ㄎㄢˋ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ ㄧˊ ㄧㄤˋ ㄇㄚ˙'),
        hint('第一次看顏色，第二次看什麼？', 'ㄉㄧˋ ㄧ ㄘˋ ㄎㄢˋ ㄧㄢˊ ㄙㄜˋ ㄉㄧˋ ㄦˋ ㄘˋ ㄎㄢˋ ㄕㄣˊ ㄇㄜ˙'),
      ]),
      incorrectFeedback: '卡片沒有換，是看的特徵改變了。',
      incorrectFeedbackPronunciationTokens: annotated('卡片沒有換，是看的特徵改變了。', 'ㄎㄚˇ ㄆㄧㄢˋ ㄇㄟˊ ㄧㄡˇ ㄏㄨㄢˋ ㄕˋ ㄎㄢˋ ㄉㄜ˙ ㄊㄜˋ ㄓㄥ ㄍㄞˇ ㄅㄧㄢˋ ㄌㄜ˙').pronunciationTokens,
      correctFeedback: '答對了！同一組卡片，看的特徵不同，就可以有不同的分法。',
      correctFeedbackPronunciationTokens: annotated('答對了！同一組卡片，看的特徵不同，就可以有不同的分法。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄊㄨㄥˊ ㄧˋ ㄗㄨˇ ㄎㄚˇ ㄆㄧㄢˋ ㄎㄢˋ ㄉㄜ˙ ㄊㄜˋ ㄓㄥ ㄅㄨˋ ㄊㄨㄥˊ ㄐㄧㄡˋ ㄎㄜˇ ㄧˇ ㄧㄡˇ ㄅㄨˋ ㄊㄨㄥˊ ㄉㄜ˙ ㄈㄣ ㄈㄚˇ').pronunciationTokens,
      teacherLimitationNote: '螢幕卡片是模擬資料，仍需教師安排實物蒐集和學生自製呈現活動。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['物品卡文字與分類語彙是否符合實際一年級學生識讀程度，待教師確認。', '本活動提供預先整理的模擬資料；學生蒐集、自由記錄與呈現實物資料仍需教師安排。']),
});
