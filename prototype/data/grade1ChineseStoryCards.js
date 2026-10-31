export const GRADE1_CHINESE_STORY_CARDS = Object.freeze({
  activityId: 'ACT-G1-CHINESE-STORY-CARDS-CANDIDATE', revision: 1,
  title: '故事卡排排隊：找回小球', gradeId: 'grade-1', subjectId: 'chinese-language',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_short_story_candidate_not_textbook',
  curriculumMapId: 'chinese-stage1-word-sentence-story', sourceId: 'chinese-language', curriculumCodes: ['5-I-4', '5-I-6', 'Ad-I-3', 'Ba-I-1'],
  curriculumScope: '對照第一學習階段文本重要訊息、圖像／故事結構輔助理解與故事文本；活動只檢視簡短原創故事的事件順序，不代表完整閱讀理解能力或一年級學期進度。',
  learningObjective: { objectiveId: 'LO-G1-CHINESE-STORY-CARDS-01', statement: '依簡短故事線索，將三個事件卡排成故事發生順序。', status: 'candidate_pending_teacher_review' },
  instructions: '讀完三張故事卡，使用上移、下移按鈕排出先後順序，再回答故事中小朋友做了什麼。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'order-ball-story', interaction: 'order_items', prompt: '把故事事件排成先後：小樂先找球、在樹下看到球、把球拿回遊戲區。', items: Object.freeze([
      Object.freeze({ id: 'ball-return', text: '小樂把球拿回遊戲區。' }), Object.freeze({ id: 'ball-find', text: '小樂在樹下看到球。' }), Object.freeze({ id: 'ball-search', text: '小樂發現球不見了，開始找球。' }),
    ]), initialOrder: Object.freeze(['ball-return', 'ball-find', 'ball-search']), correctItemIds: Object.freeze(['ball-search', 'ball-find', 'ball-return']), hints: Object.freeze(['先找故事一開始遇到的問題或人物行動。', '再看「看到球」和「拿回球」哪件事必須先發生。']), incorrectFeedback: '故事順序要符合事情發生的先後；小樂不能先把球拿回去，之後才找到球。', correctFeedback: '事件順序已排好，現在回想故事中小樂做了什麼。' }),
    Object.freeze({ stageId: 'recall-ball-action', interaction: 'choose_response', prompt: '小樂看到球後，接著做了什麼？', options: Object.freeze([
      Object.freeze({ id: 'ball-action-return', text: '把球拿回遊戲區。', feedback: '回看最後一張事件卡，確認找到球之後的行動。' }), Object.freeze({ id: 'ball-action-sleep', text: '躺下來睡覺。', feedback: '故事卡沒有出現睡覺；請回想球找到後的事件。' }), Object.freeze({ id: 'ball-action-buy', text: '去商店買新球。', feedback: '故事中沒有去商店；找球後已經看到原來的球。' }),
    ]), correctOptionIds: Object.freeze(['ball-action-return']), hints: Object.freeze(['回看排好的最後一張卡。', '找出「看到球」之後，小樂把球帶到哪裡。']), incorrectFeedback: '請依照剛才排好的故事卡回答，不要加入卡片沒有說的事情。', correctFeedback: '你依故事內容回答。原創短文及排序活動只提供局部候選練習，閱讀程度仍待教師審閱。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['原創故事的詞語難度、事件卡文字支架及目標班級閱讀先備待教師確認。', '介面沒有圖像或朗讀音訊；不評量圖像解讀、聆聽或流暢朗讀。']),
});
