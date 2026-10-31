export const GRADE1_LIVING_OBJECT_SORT = Object.freeze({
  activityId: 'ACT-G1-LIVING-OBJECT-SORT-CANDIDATE', revision: 1,
  title: '生活探索隊：自然物與人造物', gradeId: 'grade-1', subjectId: 'living-curriculum',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_simulated_observation_candidate_not_textbook',
  curriculumMapId: 'living-curriculum-stage1-observation-inquiry', sourceId: 'living-curriculum', curriculumCodes: ['2-I-1', '2-I-5'],
  curriculumScope: '第一學習階段生活課程局部候選參照：以感官／知覺辨認生活事物特徵、適切處理觀察資訊。這是文字模擬分類，不等於實地觀察或涵蓋整體生活課程。',
  learningObjective: { objectiveId: 'LO-G1-LIVING-OBJECT-SORT-01', statement: '根據觀察卡中的特徵，把物品分成自然物與人造物，並說出分類依據。', status: 'candidate_pending_teacher_review' },
  instructions: '觀察卡以文字描述物品。讀出線索後，將每張卡放到「自然物」或「人造物」區；本活動是模擬，不取代實物探索。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'sort-observed-things', interaction: 'classify_observations', prompt: '依照觀察卡，將每個物品分到自然物或人造物。', observations: Object.freeze([
      Object.freeze({ id: 'thing-leaf', text: '葉子：從樹上掉下來，形狀有些不同。' }), Object.freeze({ id: 'thing-stone', text: '石頭：在地面找到，外形不完全一樣。' }), Object.freeze({ id: 'thing-cup', text: '水杯：有人把材料做成裝水的工具。' }), Object.freeze({ id: 'thing-book', text: '課本：有人把紙張印上文字並裝訂。' }),
    ]), categories: Object.freeze([Object.freeze({ id: 'natural', label: '自然物' }), Object.freeze({ id: 'made', label: '人造物' })]), correctAssignments: Object.freeze({ 'thing-leaf': 'natural', 'thing-stone': 'natural', 'thing-cup': 'made', 'thing-book': 'made' }), hints: Object.freeze(['找觀察卡中「自然形成」或「有人製作」的線索。', '逐張說明：有沒有寫到人把材料做成工具或物品？']), incorrectFeedback: '請回到卡片的形成線索重新分類；物品用途不一定能單獨決定它是自然形成或人製作。', correctFeedback: '你依照觀察紀錄分類。下一步要說明分類使用的特徵。' }),
    Object.freeze({ stageId: 'explain-object-rule', interaction: 'choose_response', prompt: '這次分類最主要根據哪一種線索？', options: Object.freeze([
      Object.freeze({ id: 'rule-origin', text: '觀察卡有沒有提到自然形成或人把材料製作成物品。', feedback: '回想卡片中「從樹上掉下來」和「有人製作」等內容。' }), Object.freeze({ id: 'rule-colour', text: '物品看起來的顏色。', feedback: '觀察卡沒有用顏色分類，顏色也不能說明物品如何形成。' }), Object.freeze({ id: 'rule-size', text: '物品的大小。', feedback: '卡片沒有提供大小資料；請依形成或製作的描述回答。' }),
    ]), correctOptionIds: Object.freeze(['rule-origin']), hints: Object.freeze(['比較自然物與人造物的文字描述。', '找兩類卡片在「如何形成」方面的不同線索。']), incorrectFeedback: '只依據卡片實際記錄的形成方式說明分類，不要加入未觀察的顏色或大小。', correctFeedback: '你能指出分類依據。本模擬不能證明學生能在真實環境自行觀察或安全操作。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['第一學習階段班級是否已能閱讀這些觀察句，需教師確認。', '自然物與人造物的分類邊界以簡化例子呈現，需教師檢視案例適切性。', '建議搭配安全實物觀察；目前沒有連結或執行實物活動。']),
});
