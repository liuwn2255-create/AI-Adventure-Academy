export const GRADE1_LIVING_CHANGE_DETECTIVE = Object.freeze({
  activityId: 'ACT-G1-LIVING-CHANGE-DETECTIVE-CANDIDATE', revision: 1,
  title: '生活變化偵探：找出前後不同', gradeId: 'grade-1', subjectId: 'living-curriculum',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_simulated_observation_candidate_not_textbook',
  curriculumMapId: 'living-curriculum-stage1-change-inquiry', sourceId: 'living-curriculum', curriculumCodes: ['2-I-2', '2-I-4', '2-I-5'],
  curriculumScope: '第一學習階段生活課程局部候選參照：觀察生活事物變化、在探索問題歷程中處理資訊。畫面是模擬紀錄，只練習找前後變化，不判定因果探究或實物操作能力。',
  learningObjective: { objectiveId: 'LO-G1-LIVING-CHANGE-DETECTIVE-01', statement: '比較同一物品前後的觀察紀錄，找出有變化的線索。', status: 'candidate_pending_teacher_review' },
  instructions: '比較前後兩次的模擬觀察卡，收集真的顯示變化的紀錄，再選出合適的觀察方法。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'collect-change-evidence', interaction: 'collect_evidence', prompt: '找出「前後看起來不同」的觀察紀錄。', evidenceRecords: Object.freeze([
      Object.freeze({ title: '盆栽紀錄 A', text: '星期一：葉片垂下；星期三：葉片挺起來。' }), Object.freeze({ title: '天空紀錄 B', text: '早上有雲；中午仍有雲。' }), Object.freeze({ title: '積木紀錄 C', text: '開始時排成一列；後來排成一座小橋。' }), Object.freeze({ title: '桌面紀錄 D', text: '早上桌上有一本書；中午同一本書仍在原位。' }),
    ]), options: Object.freeze([
      Object.freeze({ id: 'change-plant', text: '盆栽：葉片前後不同', feedback: '兩次觀察記錄的葉片狀態不同，這是變化線索。' }), Object.freeze({ id: 'change-blocks', text: '積木：排列前後不同', feedback: '積木的排列方式改變了。' }), Object.freeze({ id: 'same-sky', text: '天空：兩次都有雲', feedback: '這兩次記錄都寫有雲，沒有指出前後不同。' }), Object.freeze({ id: 'same-book', text: '桌面：同一本書都在原位', feedback: '兩次記錄相同，沒有顯示位置改變。' }),
    ]), correctOptionIds: Object.freeze(['change-plant', 'change-blocks']), hints: Object.freeze(['比較每張卡的前一次與後一次記錄。', '找兩個描述不同的詞或位置；相同的紀錄不是變化。']), incorrectFeedback: '請逐張對照前後描述，把不同之處指出來；不能只因為物品名稱不同就判斷有變化。', correctFeedback: '你找到了前後不同的觀察記錄。下一步選擇能保留比較資訊的方法。' }),
    Object.freeze({ stageId: 'choose-change-recording-method', interaction: 'choose_response', prompt: '如果想知道盆栽葉片後來有沒有變化，哪一種記錄最有幫助？', options: Object.freeze([
      Object.freeze({ id: 'method-date-description', text: '在不同時間記下葉片看到的樣子。', feedback: '留下時間和觀察特徵，才能比較前後。' }), Object.freeze({ id: 'method-name-only', text: '只寫盆栽的名字。', feedback: '只有物品名字，沒有前後觀察，無法知道有沒有改變。' }), Object.freeze({ id: 'method-colour-guess', text: '猜它明天會變成什麼顏色。', feedback: '猜測不能代替已經觀察到的前後紀錄。' }),
    ]), correctOptionIds: Object.freeze(['method-date-description']), hints: Object.freeze(['要比較前後，就需要保存不只一次的觀察。', '每次記下時間和看見的特徵，不要把猜想當成觀察結果。']), incorrectFeedback: '選擇能讓人回頭比較兩次觀察的記錄方式；只有名字或猜測不足以說明變化。', correctFeedback: '你選擇了可比較的觀察紀錄方式。這只是模擬規劃，未執行真實觀察或證明因果理解。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['真實觀察對象、期間及安全方式需由教師選擇。', '模擬案例可能未充分涵蓋變化原因與多種探究方法；不可視為完整探究活動。']),
});
