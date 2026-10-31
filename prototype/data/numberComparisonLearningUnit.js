import { numberComparisonQuestionSet } from './numberComparisonQuestions.js';

/** Candidate learning-unit wrapper around the existing comparison demo questions. */
export const NUMBER_COMPARISON_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:m3-number-comparison-candidate',
  revision: 1,
  activityId: 'ACT-M3-NUMBER-COMPARISON-CANDIDATE-PRACTICE',
  levelId: 'math-number-comparison-candidate',
  title: '數的大小比較',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_verification',
  learningGoals: Object.freeze([
    '候選活動方向：比較兩個以數字表示的整數大小。',
    '年級適切性、正式課綱對應與實際教學進度待確認。',
  ]),
  introduction: '依序觀察兩個數字，選出比較大或比較小的數。這是待教師審查的本機示範活動，不代表正式課程或學習目標已達成。',
  questions: numberComparisonQuestionSet.questions,
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
});
