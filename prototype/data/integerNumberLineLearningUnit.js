/**
 * Candidate-only number-line reading activity using the shared learning-unit
 * engine. It is not a formal level, assessment, or grade/semester placement.
 */
const option = (optionId, text) => Object.freeze({ optionId, text });
const question = (id, prompt, point, options, answerId, explanation) => Object.freeze({
  id,
  prompt,
  visualization: Object.freeze({ start: 0, end: 1000, majorTicks: Object.freeze([0, 500, 1000]), minorStep: 100, points: Object.freeze(point) }),
  options: Object.freeze(options),
  answerId,
  explanation,
  hints: Object.freeze([
    '先確認數線從哪裡開始，以及每一小格代表多少。',
    point.length > 1
      ? '比較各標記離 0 的格數；每一格的間距相同，先數格再比較。'
      : '從已標示的刻度開始，沿數線方向逐格數到標記。',
  ]),
  wrongGuidance: point.length > 1
    ? '請回到 0 的位置，先確認每小格代表的數量，再比較標記與 0 之間的距離。'
    : '請先確認起點與每格間距，再沿數線方向逐格找到標記；單次錯答不能判定原因。',
});

export const INTEGER_NUMBER_LINE_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:m3-integer-number-line-candidate',
  revision: 1,
  activityId: 'ACT-M3-INTEGER-NUMBER-LINE-CANDIDATE',
  levelId: 'math-integer-number-line-candidate',
  title: '整數數線定位',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選活動方向：從 0 起始的數線刻度讀取整數位置。',
    '數線刻度間距、年級適切性、先備能力、教材版本與實際授課進度待教師確認。',
  ]),
  introduction: '觀察從 0 開始的數線，依刻度判讀整數位置。這是待教師審查的候選活動，不代表正式課程或學習目標已達成。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-integer-number-line-m3-num-04',
    learningContentCode: 'N-3-11',
    stagePerformanceCode: 'n-II-8',
    gradeAndScheduleStatus: 'grade_content_reference_recorded_annual_schedule_and_class_progress_pending',
    evidenceBoundary: 'N-3-11 為三年級學習內容；n-II-8 為第二學習階段表現，不代表三年級特定學期進度。',
  }),
  questions: Object.freeze([
    question(
      'INTEGER-NUMBER-LINE-DRAFT-01',
      '數線上，標記 A 在哪一個數？',
      Object.freeze([{ label: 'A', value: 300 }]),
      Object.freeze([option('inl-01-a', '200'), option('inl-01-b', '300'), option('inl-01-c', '400')]),
      'inl-01-b',
      '從 0 開始，每一小格往右增加 100。A 在第 3 小格，所以是 300。',
    ),
    question(
      'INTEGER-NUMBER-LINE-DRAFT-02',
      '數線上，標記 B 在哪一個數？',
      Object.freeze([{ label: 'B', value: 700 }]),
      Object.freeze([option('inl-02-a', '600'), option('inl-02-b', '700'), option('inl-02-c', '800')]),
      'inl-02-b',
      '先從標示的 500 往右數兩個 100 刻度：600、700，因此 B 是 700。',
    ),
    question(
      'INTEGER-NUMBER-LINE-DRAFT-03',
      '哪個標記最靠近 0？',
      Object.freeze([{ label: 'A', value: 200 }, { label: 'B', value: 600 }, { label: 'C', value: 900 }]),
      Object.freeze([option('inl-03-a', 'A'), option('inl-03-b', 'B'), option('inl-03-c', 'C')]),
      'inl-03-a',
      '數線從左邊的 0 開始，A 在 200，比 B 的 600 和 C 的 900 更靠近 0。',
    ),
  ]),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
});
