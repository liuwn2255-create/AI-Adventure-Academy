export const GRADE1_CHINESE_SENTENCE_TRAIN = Object.freeze({
  activityId: 'ACT-G1-CHINESE-SENTENCE-TRAIN-CANDIDATE', revision: 1,
  title: '句子列車：詞卡排一排', gradeId: 'grade-1', subjectId: 'chinese-language',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_language_candidate_not_textbook',
  curriculumMapId: 'chinese-stage1-word-sentence-story', sourceId: 'chinese-language', curriculumCodes: ['Ac-I-2', 'Ab-I-6'],
  curriculumScope: '對照國語文第一學習階段基本句型與語詞運用；年級細目按第一學習階段呈現，不推定一年級學期進度。原創例句，不代表官方詞表或教材。',
  learningObjective: { objectiveId: 'LO-G1-CHINESE-SENTENCE-TRAIN-01', statement: '將簡短詞卡排列成語意通順的句子，並依生活語境選用詞語。', status: 'candidate_pending_teacher_review' },
  instructions: '把詞卡排成一句完整的話，再讀讀看句子是否說得通。所有詞句均為原創候選內容。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'assemble-rain-sentence', interaction: 'assemble_response', prompt: '依照情境排句：小雨要收拾書包，水壺不能留在桌上。', tokens: Object.freeze([
      Object.freeze({ id: 's1-subject', text: '小雨' }), Object.freeze({ id: 's1-action', text: '把水壺放進' }), Object.freeze({ id: 's1-object', text: '書包' }), Object.freeze({ id: 's1-ending', text: '。' }),
    ]), correctOptionIds: Object.freeze(['s1-subject', 's1-action', 's1-object', 's1-ending']), hints: Object.freeze(['先找句子裡「誰」和「做了什麼」。', '再把動作的對象放在合適位置，最後看句尾標點。']), incorrectFeedback: '請從「小雨」開始讀，檢查每張詞卡接起來是否能清楚說出誰做了什麼。', correctFeedback: '詞卡排成完整句子了。接下來用語境找出合適的詞。' }),
    Object.freeze({
      stageId: 'choose-context-word', interaction: 'choose_response', prompt: '天空下雨了，小安要拿什麼來遮雨？',
      promptPronunciationTokens: Object.freeze([
        { text: '天', reading: 'ㄊㄧㄢ' }, { text: '空', reading: 'ㄎㄨㄥ' }, { text: '下', reading: 'ㄒㄧㄚˋ' },
        { text: '雨', reading: 'ㄩˇ' }, { text: '了', reading: '˙ㄌㄜ' }, { text: '，' },
        { text: '小', reading: 'ㄒㄧㄠˇ' }, { text: '安', reading: 'ㄢ' }, { text: '要', reading: 'ㄧㄠˋ' },
        { text: '拿', reading: 'ㄋㄚˊ' }, { text: '什', reading: 'ㄕㄣˊ' }, { text: '麼', reading: '˙ㄇㄜ' },
        { text: '來', reading: 'ㄌㄞˊ' }, { text: '遮', reading: 'ㄓㄜ' }, { text: '雨', reading: 'ㄩˇ' }, { text: '？' },
      ]),
      options: Object.freeze([
        Object.freeze({ id: 'word-umbrella', text: '雨傘', pronunciationTokens: Object.freeze([{ text: '雨', reading: 'ㄩˇ' }, { text: '傘', reading: 'ㄙㄢˇ' }]), feedback: '下雨時可以拿來遮雨，和情境相符。' }),
        Object.freeze({ id: 'word-spoon', text: '湯匙', pronunciationTokens: Object.freeze([{ text: '湯', reading: 'ㄊㄤ' }, { text: '匙', reading: 'ㄔˊ' }]), feedback: '湯匙和遮雨的需要沒有關係，請再想想下雨時會用什麼。' }),
        Object.freeze({ id: 'word-pillow', text: '枕頭', pronunciationTokens: Object.freeze([{ text: '枕', reading: 'ㄓㄣˇ' }, { text: '頭', reading: '˙ㄊㄡ' }]), feedback: '枕頭通常用來休息，不能用來遮雨。' }),
      ]),
      correctOptionIds: Object.freeze(['word-umbrella']), hints: Object.freeze(['想想出門遇到雨時，什麼物品可以幫忙。', '選能遮住雨水的物品，不是吃飯或睡覺用品。']), incorrectFeedback: '把詞語放回「開始下雨、出門」的情境，想想哪個物品最能解決遇到雨的需要。', correctFeedback: '你依情境選出合適詞語。這是少量原創詞句練習，不能代表第一學習階段識字或寫作整體表現。',
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['例句詞彙及閱讀量是否符合預定一年級學生需教師確認。', '此活動使用印刷文字，沒有注音、語音或書寫筆畫互動，不評量注音／聆聽／書寫能力。']),
});
