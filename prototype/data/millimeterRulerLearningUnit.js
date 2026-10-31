/**
 * Candidate-only ruler-reading activity based on the existing grade-three
 * millimeter map entry. It is not an approved lesson or formal assessment.
 */
const option = (optionId, text) => Object.freeze({ optionId, text });
const question = (id, prompt, markMm, options, answerId, explanation) => Object.freeze({
  id,
  prompt,
  visualization: Object.freeze({ startMm: 0, endMm: 60, markMm, minorStepMm: 1, majorStepMm: 10 }),
  options: Object.freeze(options),
  answerId,
  explanation,
  hints: Object.freeze([
    '先找線段起點對齊的 0 刻度，再看另一端的位置。',
    markMm >= 50
      ? '先找到較大的十毫米刻度，再數到端點還多幾個一毫米小格。'
      : '由 0 沿著尺上的小格數到終點；每個小格代表 1 毫米。',
  ]),
  wrongGuidance: '請重新確認線段起點是否在 0，再沿著尺的刻度讀到終點。這是圖示讀值，不是實物測量；錯答不能單獨說明原因。',
});

export const MILLIMETER_RULER_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:m3-millimeter-ruler-candidate',
  revision: 1,
  activityId: 'ACT-M3-MILLIMETER-RULER-CANDIDATE',
  levelId: 'math-length-millimeter-candidate',
  title: '長度：毫米刻度',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選活動方向：讀取尺上以毫米表示的刻度位置。',
    '從 0 刻度開始測量、毫米刻度間距及先備能力，仍待教師依教材與班級進度確認。',
  ]),
  introduction: '觀察線段在毫米尺上的位置，選出它的長度。這是本機候選示範活動，不代表正式課程、教材順序或學習目標已核准。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-grade3-n-3-12-millimeter',
    learningContentCode: 'N-3-12',
    stagePerformanceCode: 'n-II-9',
    gradeAndScheduleStatus: 'grade_content_reference_recorded_annual_allocation_and_class_progress_pending',
    evidenceBoundary: '專案來源登錄將 N-3-12 記為三年級學習內容、n-II-9 記為第二學習階段學習表現；不據此推定冊次、學期或班級授課進度。',
  }),
  questions: Object.freeze([
    question(
      'MILLIMETER-RULER-DRAFT-01',
      '圖中的線段起點對齊 0 刻度。請看尺上的終點，線段長幾毫米？',
      23,
      [option('mmr-01-a', '13 毫米'), option('mmr-01-b', '23 毫米'), option('mmr-01-c', '32 毫米')],
      'mmr-01-b',
      '起點在 0，沿尺向右到終點的刻度是 23 毫米，所以線段長 23 毫米。',
    ),
    question(
      'MILLIMETER-RULER-DRAFT-02',
      '圖中的木片一端對齊 0 刻度。請看另一端的位置，木片長多少毫米？',
      46,
      [option('mmr-02-a', '40 毫米'), option('mmr-02-b', '46 毫米'), option('mmr-02-c', '64 毫米')],
      'mmr-02-b',
      '木片從 0 開始，終點落在 46 毫米刻度；從 0 到終點的長度是 46 毫米。',
    ),
    question(
      'MILLIMETER-RULER-DRAFT-03',
      '圖中的紙條起點對齊 0 刻度。請讀出尺上的終點位置，紙條長幾毫米？',
      58,
      [option('mmr-03-a', '50 毫米'), option('mmr-03-b', '58 毫米'), option('mmr-03-c', '60 毫米')],
      'mmr-03-b',
      '終點在 50 毫米後面 8 個一毫米小格，因此位置是 58 毫米。',
    ),
  ]),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
});
