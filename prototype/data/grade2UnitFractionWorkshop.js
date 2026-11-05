import { reviewedTitlePronunciationTokens } from './reviewedTitlePronunciation.js';

const candidate = 'candidate_pending_teacher_review';
const review = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });
const evidencePolicy = Object.freeze({
  persistence: 'memory_only_no_student_records_no_localStorage',
  completionIsMastery: false,
  hintAssistedResponseIsIndependentEvidence: false,
});
const pieces = (count) => Array.from({ length: count }, (_, index) => ({ id: `unit-piece-${index + 1}`, initialGroupId: 'piece-pool' }));
const groups = (denominator) => [
  { id: 'piece-pool', label: '紙帶分數片', kind: 'pool', capacity: denominator },
  { id: 'unit-strip', label: '一條完整紙帶', kind: 'fraction', capacity: denominator, acceptsPieces: true },
];
const stage = ({ stageId, prompt, denominator, wholeLabel, answerWords }) => Object.freeze({
  stageId,
  interaction: 'manipulate_fraction_model',
  prompt,
  hints: Object.freeze([
    `先把一整條連續的紙帶平均分成 ${denominator} 份；每份都一樣大。`,
    `把 1 片放到完整紙帶模型上。這一片是全部平均分成 ${denominator} 份中的一份。`,
  ]),
  correctFeedback: `你把一整條紙帶平均分成 ${denominator} 份，取其中 1 份；${answerWords}。`,
  incorrectFeedback: `先檢查整體和等分份數，再確認完整紙帶上剛好放了 1 片。`,
  fractionRules: {
    mode: 'build',
    denominator,
    denominatorOptions: denominator === 2 ? [2, 4] : denominator === 4 ? [2, 4, 8] : [4, 8],
    sourceGroupId: 'piece-pool',
    targetWholeId: 'whole-paper-strip',
    targetGroupId: 'unit-strip',
    targetNumerator: 1,
    wholeOptions: [{ id: 'whole-paper-strip', label: wholeLabel }, { id: 'half-paper-strip', label: '只拿半條紙帶' }],
    groups: groups(denominator),
    pieces: pieces(denominator),
  },
});

/** Digital continuous-quantity paper-strip model for the first-stage unit-fraction clause. */
export const GRADE2_UNIT_FRACTION_WORKSHOP = Object.freeze({
  activityId: 'ACT-G2-MATH-UNIT-FRACTION-PAPER-FOLD-MODEL-CANDIDATE',
  revision: 1,
  title: '紙帶折分工作坊：認識幾分之一',
  titlePronunciationTokens: reviewedTitlePronunciationTokens('紙帶折分工作坊：認識幾分之一', 'ㄓˇ ㄉㄞˋ ㄓㄜˊ ㄈㄣ ㄍㄨㄥ ㄗㄨㄛˋ ㄈㄤ ㄖㄣˋ ㄕˋ ㄐㄧˇ ㄈㄣ ㄓ ㄧˋ'),
  gradeId: 'grade-2',
  subjectId: 'mathematics',
  status: candidate,
  reinforcementStatus: '尚無連結的補強活動',
  teacherReview: review,
  sourceKind: 'official_focus_interactive_candidate_not_textbook',
  runtimeModule: 'prototype/data/grade2UnitFractionWorkshop.js',
  curriculumMapId: 'math-grade2-unit-fraction-continuous-quantity',
  sourceId: 'mathematics',
  curriculumCodes: ['N-2-10', 'n-I-6'],
  learningSubitemClaims: ['SUB-MATH-G2-N2-10-UNIT-FRACTION-CONTINUOUS-STRIP'],
  curriculumScope: '依既有官方核對批次 N-2-10 與第一學習階段表現 n-I-6，使用連續量紙帶模型，把一整條等分為 2、4、8 份並取其中一份，連結「一半／二分之一／四分之一」等語意。限數位長條模型的單位分數認識；不處理離散量、分數運算、圓形摺分、實體摺紙、完整格圖說明或教師觀察。官方文件本輪未重新取得。',
  learningObjective: {
    objectiveId: 'LO-G2-MATH-UNIT-FRACTION-STRIP-01',
    statement: '操作連續量紙帶模型，先選整體並設定等分份數，再取其中一份，理解單位分數的幾分之一。',
    status: candidate,
  },
  instructions: '選一整條紙帶，設定平均分成幾份，再把一片分數片放進完整紙帶。操作完成後，觀察一份代表全部的幾分之一。這是螢幕模型，不會記錄正式成績。',
  evidencePolicy,
  sourceLocation: '教育部107年7月26日發布之數學領綱；N-2-10 PDF頁序23–24（備註及教具欄跨頁），對應 n-I-6 PDF頁序11。',
  curriculumEvidence: {
    officialText: '單位分數的認識：從等分配的活動（如摺紙）認識單部分為全部的「幾分之一」。知道日常語言「的一半」、「的二分之一」、「的四分之一」的溝通意義。在已等分割之格圖中，能說明一格為全部的「幾分之一」。',
    officialNotes: '二年級分數教學限連續量；長方形摺紙可示範分母2、4、8，圓形分母2、4。',
    performanceCode: 'n-I-6',
    performanceStage: '第一學習階段（一、二年級）；不指定學期。',
    reviewStatus: 'existing_project_official_pdf_review_record_not_rechecked_this_turn',
  },
  coverage: {
    subitemId: 'SUB-MATH-G2-N2-10-UNIT-FRACTION-CONTINUOUS-STRIP',
    coveredByInteraction: ['manipulate_fraction_model', 'set_fraction_denominator', 'select_fraction_whole', 'select_fraction_model', 'move_fraction_piece'],
    notCovered: ['實體摺紙及圓形摺分', '已等分格圖中的自主口語說明', '離散量、分數加減比較或「幾分之一」乘法情境', '教師觀察與學習成效證據'],
  },
  openQuestions: Object.freeze([
    '此活動只模擬長方形紙帶的等分和取一份，不能取代學生實際摺紙。',
    '官方備註亦提及圓形分母2或4及已等分割格圖；本關尚未呈現這兩種表徵。',
    '來源沿用現存已核對批次，官方 PDF 本輪不可取得，未重新核讀原頁。',
  ]),
  stages: Object.freeze([
    stage({ stageId: 'build-one-half-paper-strip', prompt: '把一整條長方形紙帶平均分成兩份，再取其中一份，做出「一半」。', denominator: 2, wholeLabel: '一整條長方形紙帶', answerWords: '這一份是二分之一，也可以說一半' }),
    stage({ stageId: 'build-one-fourth-paper-strip', prompt: '換一條完整紙帶，平均分成四份，取其中一份並讀出它代表全部的幾分之一。', denominator: 4, wholeLabel: '另一整條長方形紙帶', answerWords: '這一份是四分之一' }),
    stage({ stageId: 'build-one-eighth-paper-strip', prompt: '最後把整條紙帶平均分成八份，取一份，觀察等分份數增加時每份如何改變。', denominator: 8, wholeLabel: '一整條長方形紙帶', answerWords: '這一份是八分之一' }),
  ]),
});
