import { reviewedTitlePronunciationTokens } from './reviewedTitlePronunciation.js';

const candidate = 'candidate_pending_teacher_review';
const review = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });
const evidencePolicy = Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false });

/** Candidate practice for the four unknown positions explicitly named by N-2-3. */
export const GRADE2_UNKNOWN_QUANTITY_WORKSHOP = Object.freeze({
  activityId: 'ACT-G2-MATH-UNKNOWN-QUANTITY-MODEL-CANDIDATE',
  revision: 1,
  title: '補給方程港：找出藏起來的數',
  titlePronunciationTokens: reviewedTitlePronunciationTokens('補給方程港：找出藏起來的數', 'ㄅㄨˇ ㄐㄧˇ ㄈㄤ ㄔㄥˊ ㄍㄤˇ ㄓㄠˇ ㄔㄨ ㄘㄤˊ ㄑㄧˇ ㄌㄞˊ ㄉㄜ˙ ㄕㄨˋ'),
  gradeId: 'grade-2',
  subjectId: 'mathematics',
  status: candidate,
  reinforcementStatus: '尚無連結的補強活動',
  sourceKind: 'official_focus_interactive_candidate_not_textbook',
  runtimeModule: 'prototype/data/grade2UnknownQuantityWorkshop.js',
  curriculumMapId: 'math-grade2-unknown-quantity-applications',
  sourceId: 'mathematics',
  curriculumCodes: ['N-2-3', 'n-I-3', 'R-2-4', 'r-I-3'],
  learningSubitemClaims: [
    'SUB-MATH-G2-N2-3-UNKNOWN-ADDEND-AND-SUBTRACTION-QUANTITIES',
    'SUB-MATH-G2-R2-4-INVERSE-ADDITION-CHECK',
  ],
  curriculumScope: '依已登錄的官方二年級 N-2-3 原文，操作加數、被加數、減數、被減數未知的加減情境，並連結 R-2-4 加減關係。限本遊戲的整數 counters 情境；未涵蓋所有生活脈絡、學生自主列式、口頭解釋或課綱其他應用題。這是畫面模型，不代表教師觀察或課程審查。年級表不代表學期進度。',
  learningObjective: { objectiveId: 'LO-G2-MATH-UNKNOWN-QUANTITY-MODEL-01', statement: '用可增減的補給物件建模未知數量，分辨未知的是一部分、原有總量或取走量，並以加減關係檢查。', status: candidate },
  instructions: '每關用 +／− 一個一個調整藏起來的補給數。看著兩部分與總數的模型，完成後系統會說明如何用加減關係檢查。操作與進度只保留在本頁記憶體。',
  evidencePolicy,
  teacherReview: review,
  openQuestions: Object.freeze([
    '官方 N-2-3 要求多種未知量的加減應用解題，四個微型螢幕模型只提供部分操作證據，尚需教師確認情境與教學順序。',
    '官方建議可用花片、線段圖、空格算式或加減互逆，且不發展成固定答題格式；本關用螢幕 counters，不是實物花片。',
    '操作正確不證明學生能自行轉化新情境、寫出完整算式或口頭解釋；不保存正式學習紀錄。',
  ]),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'find-missing-addend', interaction: 'build_unknown_quantity_model',
      prompt: '探險隊有 8 枚已裝補給，還要補上幾枚才會有 15 枚？逐一增加藏起來的那一組。',
      equation: { display: '8 枚已知 + {{value}} 枚補上 = 15 枚總數' },
      unknownQuantityRules: { mode: 'missing_addend', knownValue: 8, total: 15, min: 0, max: 15, initialValue: 4, targetValue: 7 },
      hints: Object.freeze(['總數由已知的 8 枚和藏起來的補給合成。', '從 15 枚總數中先想像拿走已知的 8 枚，看看還剩幾枚。']),
      incorrectFeedback: '再看一次兩部分合起來是否剛好等於總數。',
      correctFeedback: '兩組合起來是 15 枚。你找出未知的加數，並能用總數減已知部分回看。',
    }),
    Object.freeze({
      stageId: 'find-missing-minuend', interaction: 'build_unknown_quantity_model',
      prompt: '倉庫拿走 5 箱後，還有 8 箱。原來有幾箱？調整代表原有箱數的模型。',
      equation: { display: '{{value}} 箱原有 − 5 箱拿走 = 8 箱剩下' },
      unknownQuantityRules: { mode: 'missing_minuend', knownValue: 5, result: 8, min: 5, max: 20, initialValue: 10, targetValue: 13 },
      hints: Object.freeze(['原有箱數要包含拿走的 5 箱，也包含剩下的 8 箱。', '把「拿走」和「剩下」兩部分合起來，求開始前的整體。']),
      incorrectFeedback: '被減數是減法開始前的整體；請把拿走量和剩餘量合起來。',
      correctFeedback: '原有 13 箱，拿走 5 箱後剩 8 箱。',
    }),
    Object.freeze({
      stageId: 'find-missing-subtrahend', interaction: 'build_unknown_quantity_model',
      prompt: '補給台原有 16 罐，整理後剩 9 罐。調整拿走的罐數，讓模型顯示剩下 9 罐。',
      equation: { display: '16 罐原有 − {{value}} 罐拿走 = 9 罐剩下' },
      unknownQuantityRules: { mode: 'missing_subtrahend', knownValue: 16, total: 16, result: 9, min: 0, max: 16, initialValue: 4, targetValue: 7 },
      hints: Object.freeze(['藏起來的是拿走的數，不是整理後剩下的數。', '從 16 罐逐一移出，直到剩下 9 罐；再數移出的罐數。']),
      incorrectFeedback: '請分清拿走多少與剩下多少；調整拿走量後，模型中的剩餘量要是 9。',
      correctFeedback: '16 罐拿走 7 罐會剩 9 罐。',
    }),
    Object.freeze({
      stageId: 'verify-subtraction-with-addition', interaction: 'build_unknown_quantity_model',
      prompt: '最後驗算：拿走 7 罐、剩下 9 罐，合起來要回到原有 16 罐。調整加回的罐數。',
      equation: { display: '9 罐剩下 + {{value}} 罐拿走 = 16 罐原有' },
      unknownQuantityRules: { mode: 'inverse_check', knownValue: 9, total: 16, min: 0, max: 16, initialValue: 5, targetValue: 7 },
      hints: Object.freeze(['用加法把剩下的和拿走的合起來，檢查是否回到原有數量。', '已知剩下 9 罐；從 16 罐總數扣掉 9，找回拿走的數。']),
      incorrectFeedback: '驗算要讓「剩下＋拿走」回到原有 16 罐，檢查兩部分總和。',
      correctFeedback: '9 + 7 = 16，這個加法關係可以檢查 16 − 7 = 9。',
    }),
  ]),
});
