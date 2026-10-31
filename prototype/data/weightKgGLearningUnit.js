/**
 * Candidate-only, author-written weight activity. It is not an approved lesson
 * or formal assessment; grade schedule, prerequisites and textbook alignment
 * remain pending teacher review.
 */
const option = (optionId, text) => Object.freeze({ optionId, text });
const question = (id, prompt, options, answerId, explanation) => Object.freeze({
  id,
  prompt,
  options: Object.freeze(options),
  answerId,
  explanation,
  hints: Object.freeze({
    'WEIGHT-KG-G-DRAFT-01': [
      '先把秤面上的數字和旁邊的單位符號分開讀。',
      '題目要求記錄公克；確認 g 代表的單位，再看是否需要改寫數字。',
    ],
    'WEIGHT-KG-G-DRAFT-02': [
      '這題問的是兩種重量單位之間的關係，不是比較兩個數。',
      '回想課堂中把 1 公斤換成公克時使用的單位關係；若尚未學過，請告訴教師。',
    ],
    'WEIGHT-KG-G-DRAFT-03': [
      '先確認兩袋的重量是否使用相同單位。',
      '兩個數都用公克表示時，可以比較數字大小，再連回重量。',
    ],
  }[id]),
  wrongGuidance: ({
    'WEIGHT-KG-G-DRAFT-01': '請分別核對秤面數值與 g 單位；此題只讀圖示，不代表實際秤重能力。',
    'WEIGHT-KG-G-DRAFT-02': '請確認題目問的是公斤與公克的換算關係。若這個關係尚未教過，不應把作答錯誤解讀為重量概念問題。',
    'WEIGHT-KG-G-DRAFT-03': '兩個重量同用公克表示，可先比較數字；單次錯答不能判定原因。',
  })[id],
});

export const WEIGHT_KG_G_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:m3-weight-kg-g-candidate',
  revision: 1,
  activityId: 'ACT-M3-WEIGHT-KG-G-CANDIDATE',
  levelId: 'math-weight-kg-g-candidate',
  title: '重量：公克與公斤',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選活動方向：辨讀以公克或公斤表示的重量。',
    '候選活動方向：連結公斤與公克的單位關係，並比較簡單重量。',
    '實際年級、學期、先備能力與教學目標範圍仍待教師確認。',
  ]),
  introduction: '這是本專案撰寫的重量主題候選示範活動，不是正式教材題目或已核准課程。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-grade3-n-3-16-weight',
    learningContentCode: 'N-3-16',
    stagePerformanceCode: 'n-II-9',
    gradeAndScheduleStatus: 'grade_content_reference_recorded_annual_allocation_and_class_progress_pending',
    evidenceBoundary: '專案課綱地圖將 N-3-16 記為三年級學習內容，n-II-9 為第二學習階段表現；這不證明特定學期、冊次或班級已授課。',
  }),
  questions: Object.freeze([
    question(
      'WEIGHT-KG-G-DRAFT-01',
      '電子秤顯示 750 g。紀錄單上應寫多少公克？',
      [option('wkg-01-a', '75 公克'), option('wkg-01-b', '750 公克'), option('wkg-01-c', '750 公斤')],
      'wkg-01-b',
      '秤面上的數字是 750，單位符號 g 表示公克，所以紀錄為 750 公克。',
    ),
    question(
      'WEIGHT-KG-G-DRAFT-02',
      '1 公斤等於多少公克？',
      [option('wkg-02-a', '100 公克'), option('wkg-02-b', '1000 公克'), option('wkg-02-c', '10,000 公克')],
      'wkg-02-b',
      '1 公斤等於 1000 公克。這是本題要觀察的單位關係；相關教學進度仍待教師確認。',
    ),
    question(
      'WEIGHT-KG-G-DRAFT-03',
      '甲袋米重 950 公克，乙袋米重 850 公克。哪一袋比較重？',
      [option('wkg-03-a', '甲袋米'), option('wkg-03-b', '乙袋米'), option('wkg-03-c', '兩袋一樣重')],
      'wkg-03-a',
      '兩個重量都用公克表示；950 比 850 大，所以甲袋較重。本題只比較同一單位表示的重量。',
    ),
  ]),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
});
