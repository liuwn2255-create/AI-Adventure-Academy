export const GRADE1_MATH_CLASSIFICATION_WORKSHOP = Object.freeze({
  activityId: 'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE', revision: 1,
  title: '分類小小研究站：同一組物品，兩種分法', gradeId: 'grade-1', subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_simulated_classification_candidate_not_textbook',
  curriculumMapId: 'math-grade1-simple-classification', sourceId: 'mathematics', curriculumCodes: ['D-1-1', 'd-I-1'],
  learningSubitemClaims: Object.freeze(['SUB-MATH-G1-D1-1-SAME-DATA-TWO-CLASSIFICATIONS']),
  curriculumScope: '對照官方 D-1-1 的日常物品蒐集、分類、記錄／呈現及同一組資料可用不同方式分類。本螢幕任務讓學生對同四張物品卡先按顏色、再按形狀分類並辨認分類依據；未實作學生自行蒐集實物、自由創作記錄圖或完整口頭說明。這是部分候選練習，不代表涵蓋完整條目。',
  learningObjective: { objectiveId: 'LO-G1-MATH-D1-1-CLASSIFY-TWO-WAYS-01', statement: '依選定特徵分類一組日常物品，並觀察同一組物品可用不同特徵重新分類。', status: 'candidate_pending_teacher_review' },
  instructions: '讀取物品卡上已提供的特徵，先依顏色分類，再用同一組卡片改依形狀分類。分類與提交都只影響本次記憶體遊戲狀態。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'sort-same-set-by-colour', interaction: 'classify_observations', prompt: '先依卡片上的顏色，把四張物品卡分類。', observations: Object.freeze([
      Object.freeze({ id: 'tile-red-round', text: '紅色圓形鈕扣' }), Object.freeze({ id: 'tile-blue-round', text: '藍色圓形鈕扣' }), Object.freeze({ id: 'tile-red-square', text: '紅色方形紙片' }), Object.freeze({ id: 'tile-blue-square', text: '藍色方形紙片' }),
    ]), categories: Object.freeze([Object.freeze({ id: 'red', label: '紅色' }), Object.freeze({ id: 'blue', label: '藍色' })]), correctAssignments: Object.freeze({ 'tile-red-round': 'red', 'tile-blue-round': 'blue', 'tile-red-square': 'red', 'tile-blue-square': 'blue' }), hints: Object.freeze(['每張卡都有顏色和形狀；這一輪只看顏色。', '逐張讀第一個特徵詞，紅色放一類、藍色放另一類。']), incorrectFeedback: '請逐張核對顏色詞；同一張卡只能放進符合它顏色的那一類。', correctFeedback: '完成第一種分類。記住這四張卡，下一步會使用同一組物品改看另一個特徵。' }),
    Object.freeze({ stageId: 're-sort-same-set-by-shape', interaction: 'classify_observations', prompt: '物品沒有改變。這次忽略顏色，改依形狀分類。', observations: Object.freeze([
      Object.freeze({ id: 'tile-red-round', text: '紅色圓形鈕扣' }), Object.freeze({ id: 'tile-blue-round', text: '藍色圓形鈕扣' }), Object.freeze({ id: 'tile-red-square', text: '紅色方形紙片' }), Object.freeze({ id: 'tile-blue-square', text: '藍色方形紙片' }),
    ]), categories: Object.freeze([Object.freeze({ id: 'round', label: '圓形' }), Object.freeze({ id: 'square', label: '方形' })]), correctAssignments: Object.freeze({ 'tile-red-round': 'round', 'tile-blue-round': 'round', 'tile-red-square': 'square', 'tile-blue-square': 'square' }), hints: Object.freeze(['同一張卡同時有顏色和形狀，分類時先選一個特徵。', '找「圓形」或「方形」字樣，這一輪不要依顏色放置。']), incorrectFeedback: '請按形狀詞重新檢查，不要沿用上一輪的顏色分類。', correctFeedback: '同一組物品可以依不同特徵重新整理。接著確認你注意到的分類原則。' }),
    Object.freeze({ stageId: 'identify-classification-rule', interaction: 'choose_response', prompt: '為什麼同一組卡片在兩輪會有不同的分類結果？', options: Object.freeze([
      Object.freeze({ id: 'rule-selected-feature', text: '因為第一輪看顏色，第二輪改看形狀。', feedback: '分類依據改變，同一張卡的特徵組合仍不變。' }),
      Object.freeze({ id: 'rule-card-changed', text: '因為第二輪換成了另一組物品。', feedback: '兩輪卡片文字相同；請比較每輪指定看的特徵。' }),
      Object.freeze({ id: 'rule-random', text: '分類沒有依據，放哪裡都可以。', feedback: '分類應依選定且一致的特徵。' }),
    ]), correctOptionIds: Object.freeze(['rule-selected-feature']), hints: Object.freeze(['回想兩輪指定的分類特徵。', '比較「顏色」與「形狀」哪一個變了，物品卡本身有沒有變。']), incorrectFeedback: '分類結果會依你選擇的共同特徵而不同；卡片仍是同一組。', correctFeedback: '你辨認出分類依據改變會形成不同整理方式。螢幕卡片是模擬資料，仍需教師安排實物蒐集和學生自製呈現活動。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['物品卡文字與分類語彙是否符合實際一年級學生識讀程度，待教師確認。', '本活動提供預先整理的模擬資料；學生蒐集、自由記錄與呈現實物資料仍需教師安排。']),
});
