const isHanCharacter = (character) => /\p{Script=Han}/u.test(character);
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

export const GRADE1_CHINESE_STORY_CARDS = Object.freeze({
  activityId: 'ACT-G1-CHINESE-STORY-CARDS-CANDIDATE', revision: 1,
  title: '故事卡排排隊：找回小球', gradeId: 'grade-1', subjectId: 'chinese-language',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_short_story_candidate_not_textbook',
  curriculumMapId: 'chinese-stage1-word-sentence-story', sourceId: 'chinese-language', curriculumCodes: ['5-I-4', '5-I-6', 'Ad-I-3', 'Ba-I-1'],
  curriculumScope: '對照第一學習階段文本重要訊息、圖像／故事結構輔助理解與故事文本；活動只檢視簡短原創故事的事件順序，不代表完整閱讀理解能力或一年級學期進度。',
  learningObjective: { objectiveId: 'LO-G1-CHINESE-STORY-CARDS-01', statement: '依簡短故事線索，將三個事件卡排成故事發生順序。', status: 'candidate_pending_teacher_review' },
  instructions: '讀完三張故事卡，使用上移、下移按鈕排出先後順序，再回答故事中小朋友做了什麼。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'order-ball-story', interaction: 'order_items',
      prompt: '小樂的球不見了。請把 3 張故事卡排成正確的順序。',
      promptPronunciationTokens: reviewedPronunciationTokens('小樂的球不見了。請把 3 張故事卡排成正確的順序。', 'ㄒㄧㄠˇ ㄌㄜˋ ˙ㄉㄜ ㄑㄧㄡˊ ㄅㄨˋ ㄐㄧㄢˋ ˙ㄌㄜ ㄑㄧㄥˇ ㄅㄚˇ ㄓㄤ ㄍㄨˋ ㄕˋ ㄎㄚˇ ㄆㄞˊ ㄔㄥˊ ㄓㄥˋ ㄑㄩㄝˋ ˙ㄉㄜ ㄕㄨㄣˋ ㄒㄩˋ'),
      items: Object.freeze([
        Object.freeze({ id: 'ball-return', text: '小樂把球拿回遊戲區。', pronunciationTokens: reviewedPronunciationTokens('小樂把球拿回遊戲區。', 'ㄒㄧㄠˇ ㄌㄜˋ ㄅㄚˇ ㄑㄧㄡˊ ㄋㄚˊ ㄏㄨㄟˊ ㄧㄡˊ ㄒㄧˋ ㄑㄩ') }),
        Object.freeze({ id: 'ball-find', text: '小樂在樹下看到球。', pronunciationTokens: reviewedPronunciationTokens('小樂在樹下看到球。', 'ㄒㄧㄠˇ ㄌㄜˋ ㄗㄞˋ ㄕㄨˋ ㄒㄧㄚˋ ㄎㄢˋ ㄉㄠˋ ㄑㄧㄡˊ') }),
        Object.freeze({ id: 'ball-search', text: '小樂發現球不見了，開始找球。', pronunciationTokens: reviewedPronunciationTokens('小樂發現球不見了，開始找球。', 'ㄒㄧㄠˇ ㄌㄜˋ ㄈㄚ ㄒㄧㄢˋ ㄑㄧㄡˊ ㄅㄨˋ ㄐㄧㄢˋ ˙ㄌㄜ ㄎㄞ ㄕˇ ㄓㄠˇ ㄑㄧㄡˊ') }),
      ]),
      initialOrder: Object.freeze(['ball-return', 'ball-find', 'ball-search']),
      correctItemIds: Object.freeze(['ball-search', 'ball-find', 'ball-return']),
      hints: Object.freeze([
        reviewedHint('先找一找，故事一開始發生了什麼事。', 'ㄒㄧㄢ ㄓㄠˇ ㄧ˙ ㄓㄠˇ ㄍㄨˋ ㄕˋ ㄧ ㄎㄞ ㄕˇ ㄈㄚ ㄕㄥ ㄌㄜ˙ ㄕㄣˊ ㄇㄜ˙ ㄕˋ'),
        reviewedHint('想一想：事情要先發生，還是結果要先發生？', 'ㄒㄧㄤˇ ㄧ˙ ㄒㄧㄤˇ ㄕˋ ㄑㄧㄥˊ ㄧㄠˋ ㄒㄧㄢ ㄈㄚ ㄕㄥ ㄏㄞˊ ㄕˋ ㄐㄧㄝˊ ㄍㄨㄛˇ ㄧㄠˋ ㄒㄧㄢ ㄈㄚ ㄕㄥ'),
      ]),
      incorrectFeedback: '再想一想：哪件事最先發生？再看看後面的事情能不能接得起來。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('再想一想：哪件事最先發生？再看看後面的事情能不能接得起來。', 'ㄗㄞˋ ㄒㄧㄤˇ ㄧ˙ ㄒㄧㄤˇ ㄋㄚˇ ㄐㄧㄢˋ ㄕˋ ㄗㄨㄟˋ ㄒㄧㄢ ㄈㄚ ㄕㄥ ㄗㄞˋ ㄎㄢˋ ㄎㄢ˙ ㄏㄡˋ ㄇㄧㄢˋ ㄉㄜ˙ ㄕˋ ㄑㄧㄥˊ ㄋㄥˊ ㄅㄨˋ ㄋㄥˊ ㄐㄧㄝ ㄉㄜ˙ ㄑㄧˇ ㄌㄞˊ'),
      correctFeedback: '答對了！故事卡已經排成正確的順序。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('答對了！故事卡已經排成正確的順序。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄍㄨˋ ㄕˋ ㄎㄚˇ ㄧˇ ㄐㄧㄥ ㄆㄞˊ ㄔㄥˊ ㄓㄥˋ ㄑㄩㄝˋ ˙ㄉㄜ ㄕㄨㄣˋ ㄒㄩˋ'),
    }),
    Object.freeze({
      stageId: 'recall-ball-action', interaction: 'choose_response',
      prompt: '小樂看到球後，接著做了什麼？',
      promptPronunciationTokens: reviewedPronunciationTokens('小樂看到球後，接著做了什麼？', 'ㄒㄧㄠˇ ㄌㄜˋ ㄎㄢˋ ㄉㄠˋ ㄑㄧㄡˊ ㄏㄡˋ ㄐㄧㄝ ㄓㄜ˙ ㄗㄨㄛˋ ㄌㄜ˙ ㄕㄣˊ ㄇㄜ˙'),
      options: Object.freeze([
        Object.freeze({ id: 'ball-action-return', text: '把球拿回遊戲區。', pronunciationTokens: reviewedPronunciationTokens('把球拿回遊戲區。', 'ㄅㄚˇ ㄑㄧㄡˊ ㄋㄚˊ ㄏㄨㄟˊ ㄧㄡˊ ㄒㄧˋ ㄑㄩ'), feedback: '回看最後一張事件卡，確認找到球之後的行動。', feedbackPronunciationTokens: reviewedPronunciationTokens('回看最後一張事件卡，確認找到球之後的行動。', 'ㄏㄨㄟˊ ㄎㄢˋ ㄗㄨㄟˋ ㄏㄡˋ ㄧ ㄓㄤ ㄕˋ ㄐㄧㄢˋ ㄎㄚˇ ㄑㄩㄝˋ ㄖㄣˋ ㄓㄠˇ ㄉㄠˋ ㄑㄧㄡˊ ㄓ ㄏㄡˋ ˙ㄉㄜ ㄒㄧㄥˊ ㄉㄨㄥˋ') }),
        Object.freeze({ id: 'ball-action-sleep', text: '躺下來睡覺。', pronunciationTokens: reviewedPronunciationTokens('躺下來睡覺。', 'ㄊㄤˇ ㄒㄧㄚˋ ㄌㄞˊ ㄕㄨㄟˋ ㄐㄧㄠˋ'), feedback: '故事卡沒有出現睡覺；請回想球找到後的事件。', feedbackPronunciationTokens: reviewedPronunciationTokens('故事卡沒有出現睡覺；請回想球找到後的事件。', 'ㄍㄨˋ ㄕˋ ㄎㄚˇ ㄇㄟˊ ㄧㄡˇ ㄔㄨ ㄒㄧㄢˋ ㄕㄨㄟˋ ㄐㄧㄠˋ ㄑㄧㄥˇ ㄏㄨㄟˊ ㄒㄧㄤˇ ㄑㄧㄡˊ ㄓㄠˇ ㄉㄠˋ ㄏㄡˋ ˙ㄉㄜ ㄕˋ ㄐㄧㄢˋ') }),
        Object.freeze({ id: 'ball-action-buy', text: '去商店買新球。', pronunciationTokens: reviewedPronunciationTokens('去商店買新球。', 'ㄑㄩˋ ㄕㄤ ㄉㄧㄢˋ ㄇㄞˇ ㄒㄧㄣ ㄑㄧㄡˊ'), feedback: '故事中沒有去商店；找球後已經看到原來的球。', feedbackPronunciationTokens: reviewedPronunciationTokens('故事中沒有去商店；找球後已經看到原來的球。', 'ㄍㄨˋ ㄕˋ ㄓㄨㄥ ㄇㄟˊ ㄧㄡˇ ㄑㄩˋ ㄕㄤ ㄉㄧㄢˋ ㄓㄠˇ ㄑㄧㄡˊ ㄏㄡˋ ㄧˇ ㄐㄧㄥ ㄎㄢˋ ㄉㄠˋ ㄩㄢˊ ㄌㄞˊ ˙ㄉㄜ ㄑㄧㄡˊ') }),
      ]),
      correctOptionIds: Object.freeze(['ball-action-return']),
      hints: Object.freeze([
        reviewedHint('回頭看看剛才排好的故事卡。', 'ㄏㄨㄟˊ ㄊㄡˊ ㄎㄢˋ ㄎㄢ˙ ㄍㄤ ㄘㄞˊ ㄆㄞˊ ㄏㄠˇ ˙ㄉㄜ ㄍㄨˋ ㄕˋ ㄎㄚˇ'),
        reviewedHint('找到「看到球」那張卡，再看看下一張發生什麼事。', 'ㄓㄠˇ ㄉㄠˋ ㄎㄢˋ ㄉㄠˋ ㄑㄧㄡˊ ㄋㄚˋ ㄓㄤ ㄎㄚˇ ㄗㄞˋ ㄎㄢˋ ㄎㄢ˙ ㄒㄧㄚˋ ㄧ ㄓㄤ ㄈㄚ ㄕㄥ ㄕㄣˊ ㄇㄜ˙ ㄕˋ'),
      ]),
      incorrectFeedback: '請依照剛才排好的故事卡回答，不要加入卡片沒有說的事情。',
      incorrectFeedbackPronunciationTokens: reviewedPronunciationTokens('請依照剛才排好的故事卡回答，不要加入卡片沒有說的事情。', 'ㄑㄧㄥˇ ㄧ ㄓㄠˋ ㄍㄤ ㄘㄞˊ ㄆㄞˊ ㄏㄠˇ ˙ㄉㄜ ㄍㄨˋ ㄕˋ ㄎㄚˇ ㄏㄨㄟˊ ㄉㄚˊ ㄅㄨˊ ㄧㄠˋ ㄐㄧㄚ ㄖㄨˋ ㄎㄚˇ ㄆㄧㄢˋ ㄇㄟˊ ㄧㄡˇ ㄕㄨㄛ ㄉㄜ˙ ㄕˋ ㄑㄧㄥˊ'),
      correctFeedback: '答對了！小樂找到球後，把球拿回遊戲區。',
      correctFeedbackPronunciationTokens: reviewedPronunciationTokens('答對了！小樂找到球後，把球拿回遊戲區。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄒㄧㄠˇ ㄌㄜˋ ㄓㄠˇ ㄉㄠˋ ㄑㄧㄡˊ ㄏㄡˋ ㄅㄚˇ ㄑㄧㄡˊ ㄋㄚˊ ㄏㄨㄟˊ ㄧㄡˊ ㄒㄧˋ ㄑㄩ'),
      teacherLimitationNote: '原創短文及排序活動只提供局部候選練習，閱讀程度仍待教師審閱。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['原創故事的詞語難度、事件卡文字支架及目標班級閱讀先備待教師確認。', '介面沒有圖像或朗讀音訊；不評量圖像解讀、聆聽或流暢朗讀。']),
});
