import { CAPACITY_OBSERVATION_SCENARIOS } from '../capacityMission.js';

/**
 * Candidate-only learning unit that reuses the existing capacity scale-reading
 * scenarios. It is intentionally separate from formal levels and saved progress.
 */
export const CAPACITY_READING_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:m3-capacity-reading-candidate',
  revision: 1,
  activityId: 'ACT-M3-CAPACITY-SCALE-READING-CANDIDATE',
  levelId: 'math-capacity-candidate',
  title: '容量刻度判讀',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選活動方向：讀取量杯水面對齊的毫升刻度。',
    '年級適切性、先備能力、教材版本與實際授課進度待教師確認。',
  ]),
  introduction: '觀察量杯水面與刻度，選出對應的水量。這是待教師審查的本機候選活動，不代表正式課程或學習目標已達成。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-capacity-measurement',
    learningContentCode: 'N-3-15',
    stagePerformanceCode: 'n-II-9',
    gradeAndScheduleStatus: 'grade_content_reference_recorded_annual_schedule_and_class_progress_pending',
  }),
  questions: Object.freeze(CAPACITY_OBSERVATION_SCENARIOS.map((scenario, index) => Object.freeze({
    id: `CAPACITY-DRAFT-M3-READ-${String(index + 1).padStart(2, '0')}`,
    sourceScenarioId: scenario.id,
    prompt: `量杯中的水面對齊哪個水量刻度？`,
    options: scenario.options,
    answerId: scenario.answerOptionId,
    explanation: scenario.explanation,
    hints: Object.freeze([
      '先找到量杯上的數字刻度，再觀察水面與哪一條刻度對齊。',
      '從量杯底部往上看刻度位置；依標示和小格間距判讀水面，不需要估算或換算。',
    ]),
    wrongGuidance: '請先從量杯底部確認刻度方向，再觀察水面是否正好對齊標示線。這是讀刻度練習，不代表已確認錯誤原因。',
    visualization: Object.freeze({ waterMl: scenario.waterMl, capacityMl: 1000, stepMl: 100 }),
  }))),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
});
