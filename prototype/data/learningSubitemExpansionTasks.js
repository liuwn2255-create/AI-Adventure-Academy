import { reviewedTitlePronunciationTokens } from './reviewedTitlePronunciation.js';

const candidate = 'candidate_pending_teacher_review';
const noReinforcement = Object.freeze({ reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動' });
const evidencePolicy = Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false });
const review = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });

const annotated = (text, readings) => {
  const readingList = readings.trim() ? readings.trim().split(/\s+/u) : [];
  let index = 0;
  const pronunciationTokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = readingList[index++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (index !== readingList.length) throw new Error(`Extra reviewed pronunciation for ${text}`);
  return Object.freeze({ text, pronunciationTokens: Object.freeze(pronunciationTokens) });
};

const category = (id, label, readings) => Object.freeze({ id, label, pronunciationTokens: annotated(label, readings).pronunciationTokens });

const makeTask = (task) => Object.freeze({
  revision: 1,
  status: candidate,
  sourceKind: 'official_focus_subitem_candidate_interaction_not_textbook',
  runtimeModule: 'prototype/data/learningSubitemExpansionTasks.js',
  sourceId: 'mathematics',
  ...noReinforcement,
  evidencePolicy,
  teacherReview: review,
  ...task,
});

export const LEARNING_SUBITEM_EXPANSION_TASKS = Object.freeze([
  makeTask({
    activityId: 'ACT-G1-MATH-ZERO-PLACEHOLDER-EXPLORER-CANDIDATE',
    title: '數字小工坊：看看個位的 0', gradeId: 'grade-1', subjectId: 'mathematics',
    titlePronunciationTokens: annotated('數字小工坊：看看個位的 0', 'ㄕㄨˋ ㄗˋ ㄒㄧㄠˇ ㄍㄨㄥ ㄈㄤ ㄎㄢˋ ˙ㄎㄢ ㄍㄜˋ ㄨㄟˋ ㄉㄜ˙').pronunciationTokens,
    curriculumMapId: 'math-grade1-count-place-value', curriculumCodes: ['N-1-1', 'n-I-1'],
    learningSubitemClaims: ['SUB-MATH-G1-N1-1-ZERO-PLACEHOLDER'],
    curriculumScope: '對照官方一年級學習內容 N-1-1 的位值單位「個」「十」與 0 的位值意義；僅作兩位數個位為0的有限候選練習，不代表完整涵蓋一百以內數。教材與課程順序待教師確認。',
    learningObjective: { objectiveId: 'LO-G1-MATH-ZERO-PLACEHOLDER-01', statement: '比較數字卡上的位值表示，理解個位寫0表示該數沒有個位單位。', status: candidate },
    instructions: '先把數字卡依個位是否有「個」分類，再比較兩個數字卡的十與個。這是畫面上的符號操作，沒有實體積木。',
    stages: Object.freeze([
      Object.freeze({ stageId: 'sort-zero-ones-cards', interaction: 'classify_observations',
        prompt: '看卡片，把個位是 0 的放一類，個位不是 0 的放另一類。',
        promptPronunciationTokens: annotated('看卡片，把個位是 0 的放一類，個位不是 0 的放另一類。', 'ㄎㄢˋ ㄎㄚˇ ㄆㄧㄢˋ ㄅㄚˇ ㄍㄜˋ ㄨㄟˋ ㄕˋ ㄉㄜ˙ ㄈㄤˋ ㄧˋ ㄌㄟˋ ㄍㄜˋ ㄨㄟˋ ㄅㄨˋ ㄕˋ ㄉㄜ˙ ㄈㄤˋ ㄌㄧㄥˋ ㄧˋ ㄌㄟˋ').pronunciationTokens,
        studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案',
        studentOperationGuidancePronunciationTokens: annotated('怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄅㄤ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄩㄢˇ ㄧˊ ㄌㄟˋ ㄑㄩㄢˊ ㄅㄨˋ ㄈㄣ ㄏㄠˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ').pronunciationTokens,
        observations: Object.freeze([
          { id: 'n10', ...annotated('10：1 個十，0 個一', 'ㄍㄜˋ ㄕˊ ㄍㄜˋ ㄧ') }, { id: 'n12', ...annotated('12：1 個十，2 個一', 'ㄍㄜˋ ㄕˊ ㄍㄜˋ ㄧ') }, { id: 'n20', ...annotated('20：2 個十，0 個一', 'ㄍㄜˋ ㄕˊ ㄍㄜˋ ㄧ') }, { id: 'n21', ...annotated('21：2 個十，1 個一', 'ㄍㄜˋ ㄕˊ ㄍㄜˋ ㄧ') },
        ]), categories: Object.freeze([category('no-ones', '個位是 0', 'ㄍㄜˋ ㄨㄟˋ ㄕˋ'), category('has-ones', '個位不是 0', 'ㄍㄜˋ ㄨㄟˋ ㄅㄨˋ ㄕˋ')]), correctAssignments: Object.freeze({ n10: 'no-ones', n12: 'has-ones', n20: 'no-ones', n21: 'has-ones' }),
        hints: Object.freeze([
          annotated('先看每張卡上的個位數字。', 'ㄒㄧㄢ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄕㄤˋ ㄉㄜ˙ ㄍㄜˋ ㄨㄟˋ ㄕㄨˋ ㄗˋ'),
          annotated('個位是 0 的卡放一起。', 'ㄍㄜˋ ㄨㄟˋ ㄕˋ ㄉㄜ˙ ㄎㄚˇ ㄈㄤˋ ㄧˋ ㄑㄧˇ'),
        ]),
        incorrectFeedback: '再看一次每張卡的個位。', incorrectFeedbackPronunciationTokens: annotated('再看一次每張卡的個位。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄉㄜ˙ ㄍㄜˋ ㄨㄟˋ').pronunciationTokens,
        correctFeedback: '答對了！你把個位是 0 的卡分在一起。', correctFeedbackPronunciationTokens: annotated('答對了！你把個位是 0 的卡分在一起。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄋㄧˇ ㄅㄚˇ ㄍㄜˋ ㄨㄟˋ ㄕˋ ㄉㄜ˙ ㄎㄚˇ ㄈㄣ ㄗㄞˋ ㄧˋ ㄑㄧˇ').pronunciationTokens,
      }),
      Object.freeze({ stageId: 'explain-twenty-versus-two', interaction: 'choose_response', prompt: '20 和 2 有什麼不同？選出正確說法。',
        promptPronunciationTokens: annotated('20 和 2 有什麼不同？選出正確說法。', 'ㄏㄜˊ ㄧㄡˇ ㄕㄣˊ ㄇㄜ˙ ㄅㄨˋ ㄊㄨㄥˊ ㄒㄩㄢˇ ㄔㄨ ㄓㄥˋ ㄑㄩㄝˋ ㄕㄨㄛ ㄈㄚˇ').pronunciationTokens,
        options: Object.freeze([
          { id: 'two-tens', ...annotated('20 有 2 個十、0 個一；2 有 0 個十、2 個一。', 'ㄧㄡˇ ㄍㄜˋ ㄕˊ ㄍㄜˋ ㄧ ㄧㄡˇ ㄍㄜˋ ㄕˊ ㄍㄜˋ ㄧ'), feedback: '20 有 2 個十，2 有 2 個一。', feedbackPronunciationTokens: annotated('20 有 2 個十，2 有 2 個一。', 'ㄧㄡˇ ㄍㄜˋ ㄕˊ ㄧㄡˇ ㄍㄜˋ ㄧ').pronunciationTokens },
          { id: 'same-number', ...annotated('20 和 2 一樣，因為都有數字 2。', 'ㄏㄜˊ ㄧˊ ㄧㄤˋ ㄧㄣ ㄨㄟˋ ㄉㄡ ㄧㄡˇ ㄕㄨˋ ㄗˋ'), feedback: '數字相同，位置不同，表示的數量也可能不同。', feedbackPronunciationTokens: annotated('數字相同，位置不同，表示的數量也可能不同。', 'ㄕㄨˋ ㄗˋ ㄒㄧㄤ ㄊㄨㄥˊ ㄨㄟˋ ㄓˋ ㄅㄨˋ ㄊㄨㄥˊ ㄅㄧㄠˇ ㄕˋ ㄉㄜ˙ ㄕㄨˋ ㄌㄧㄤˋ ㄧㄝˇ ㄎㄜˇ ㄋㄥˊ ㄅㄨˋ ㄊㄨㄥˊ').pronunciationTokens },
          { id: 'zero-adds-one', ...annotated('0 表示再加一個一。', 'ㄅㄧㄠˇ ㄕˋ ㄗㄞˋ ㄐㄧㄚ ㄧˊ ㄍㄜˋ ㄧ'), feedback: '個位是 0，表示沒有個位的一。', feedbackPronunciationTokens: annotated('個位是 0，表示沒有個位的一。', 'ㄍㄜˋ ㄨㄟˋ ㄕˋ ㄅㄧㄠˇ ㄕˋ ㄇㄟˊ ㄧㄡˇ ㄍㄜˋ ㄨㄟˋ ㄉㄜ˙ ㄧ').pronunciationTokens },
        ]), correctOptionIds: Object.freeze(['two-tens']),
        hints: Object.freeze([annotated('先看 20 有幾個十，再看個位。', 'ㄒㄧㄢ ㄎㄢˋ ㄧㄡˇ ㄐㄧˇ ㄍㄜˋ ㄕˊ ㄗㄞˋ ㄎㄢˋ ㄍㄜˋ ㄨㄟˋ'), annotated('再看 2 有幾個十、幾個一。', 'ㄗㄞˋ ㄎㄢˋ ㄧㄡˇ ㄐㄧˇ ㄍㄜˋ ㄕˊ ㄐㄧˇ ㄍㄜˋ ㄧ')]),
        incorrectFeedback: '請分開看十和一；位置不同，表示的數量也不同。', incorrectFeedbackPronunciationTokens: annotated('請分開看十和一；位置不同，表示的數量也不同。', 'ㄑㄧㄥˇ ㄈㄣ ㄎㄞ ㄎㄢˋ ㄕˊ ㄏㄜˊ ㄧ ㄨㄟˋ ㄓˋ ㄅㄨˋ ㄊㄨㄥˊ ㄅㄧㄠˇ ㄕˋ ㄉㄜ˙ ㄕㄨˋ ㄌㄧㄤˋ ㄧㄝˇ ㄅㄨˋ ㄊㄨㄥˊ').pronunciationTokens,
        correctFeedback: '答對了！20 有 2 個十，2 有 2 個一。', correctFeedbackPronunciationTokens: annotated('答對了！20 有 2 個十，2 有 2 個一。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄧㄡˇ ㄍㄜˋ ㄕˊ ㄧㄡˇ ㄍㄜˋ ㄧ').pronunciationTokens,
        teacherLimitationNote: '這次選擇題不足以證明能自行解釋其他數字。',
      }),
    ]),
    openQuestions: Object.freeze(['需教師確認學生是否已使用「個」「十」作位值單位。', '分類和選擇只觀察有限符號判讀，不替代實體積木操作或學生自行說明。']),
  }),
  makeTask({
    activityId: 'ACT-G1-MATH-COMPARISON-DIFFERENCE-NUMBER-LINE-CANDIDATE',
    title: '小小數線探險：多幾張', gradeId: 'grade-1', subjectId: 'mathematics',
    titlePronunciationTokens: annotated('小小數線探險：多幾張', 'ㄒㄧㄠˇ ㄒㄧㄠˇ ㄕㄨˋ ㄒㄧㄢˋ ㄊㄢˋ ㄒㄧㄢˇ ㄉㄨㄛ ㄐㄧˇ ㄓㄤ').pronunciationTokens,
    curriculumMapId: 'math-grade1-add-sub-meaning', curriculumCodes: ['N-1-2', 'R-1-1', 'n-I-2'],
    learningSubitemClaims: ['SUB-MATH-G1-N1-2-COMPARISON-DIFFERENCE'],
    curriculumScope: '只對照 N-1-2 的比較型差量情境。本活動詢問8張比5張多幾張，未知的是比較結果（差量），不設未知加數、被加數、減數或被減數題型；亦不涵蓋全部比較情境或自主列式。',
    learningObjective: { objectiveId: 'LO-G1-MATH-COMPARISON-DIFFERENCE-01', statement: '在數線上操作兩個數量的差，並把差量連回比較型算式。', status: candidate },
    instructions: '情境：小米有8張貼紙，小安有5張。先在數線上找出兩人的數量差，再選出能記錄比較關係的算式。',
    stages: Object.freeze([
      Object.freeze({ stageId: 'place-sticker-difference', interaction: 'place_number_line_marker',
        prompt: '8 張比 5 張多幾張？把標記放到答案。每格是 1。',
        promptPronunciationTokens: annotated('8 張比 5 張多幾張？把標記放到答案。每格是 1。', 'ㄓㄤ ㄅㄧˇ ㄓㄤ ㄉㄨㄛ ㄐㄧˇ ㄓㄤ ㄅㄚˇ ㄅㄧㄠ ㄐㄧˋ ㄈㄤˋ ㄉㄠˋ ㄉㄚˊ ㄢˋ ㄇㄟˇ ㄍㄜˊ ㄕˋ').pronunciationTokens,
        numberLine: Object.freeze({
          start: 0, end: 10, tickCount: 10, targetTick: 3, valueFormat: 'integer', referenceTicks: Object.freeze([5, 8]),
          studentInstruction: '移動滑桿，把標記放到「多幾張」的答案。',
          studentInstructionPronunciationTokens: annotated('移動滑桿，把標記放到「多幾張」的答案。', 'ㄧˊ ㄉㄨㄥˋ ㄏㄨㄚˊ ㄍㄢˇ ㄅㄚˇ ㄅㄧㄠ ㄐㄧˋ ㄈㄤˋ ㄉㄠˋ ㄉㄨㄛ ㄐㄧˇ ㄓㄤ ㄉㄜ˙ ㄉㄚˊ ㄢˋ').pronunciationTokens,
        }),
        hints: Object.freeze([
          annotated('數線上的差，可以從較少的數走到較多的數。', 'ㄕㄨˋ ㄒㄧㄢˋ ㄕㄤˋ ㄉㄜ˙ ㄔㄚ ㄎㄜˇ ㄧˇ ㄘㄨㄥˊ ㄐㄧㄠˋ ㄕㄠˇ ㄉㄜ˙ ㄕㄨˋ ㄗㄡˇ ㄉㄠˋ ㄐㄧㄠˋ ㄉㄨㄛ ㄉㄜ˙ ㄕㄨˋ'),
          annotated('從 5 開始往右數到 8，每走一格就是多 1 張。', 'ㄘㄨㄥˊ ㄎㄞ ㄕˇ ㄨㄤˇ ㄧㄡˋ ㄕㄨˇ ㄉㄠˋ ㄇㄟˇ ㄗㄡˇ ㄧˋ ㄍㄜˊ ㄐㄧㄡˋ ㄕˋ ㄉㄨㄛ ㄓㄤ'),
        ]),
        incorrectFeedback: '請從 5 往 8 數，看看走了幾格。', incorrectFeedbackPronunciationTokens: annotated('請從 5 往 8 數，看看走了幾格。', 'ㄑㄧㄥˇ ㄘㄨㄥˊ ㄨㄤˇ ㄕㄨˇ ㄎㄢˋ ㄎㄢˋ ㄗㄡˇ ㄌㄜ˙ ㄐㄧˇ ㄍㄜˊ').pronunciationTokens,
        correctFeedback: '答對了！你找到多出的張數。', correctFeedbackPronunciationTokens: annotated('答對了！你找到多出的張數。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄋㄧˇ ㄓㄠˇ ㄉㄠˋ ㄉㄨㄛ ㄔㄨ ㄉㄜ˙ ㄓㄤ ㄕㄨˋ').pronunciationTokens,
      }),
      Object.freeze({ stageId: 'choose-comparison-equation', interaction: 'choose_response', prompt: '哪個算式表示「8 張比 5 張多 3 張」？',
        promptPronunciationTokens: annotated('哪個算式表示「8 張比 5 張多 3 張」？', 'ㄋㄚˇ ㄍㄜˋ ㄙㄨㄢˋ ㄕˋ ㄅㄧㄠˇ ㄕˋ ㄓㄤ ㄅㄧˇ ㄓㄤ ㄉㄨㄛ ㄓㄤ').pronunciationTokens,
        options: Object.freeze([
          { id: 'difference-8-5', ...annotated('8 − 5 = 3', '') },
          { id: 'sum-8-5', ...annotated('8 + 5 = 13', '') },
          { id: 'reverse-5-8', ...annotated('5 − 8 = 3', '') },
        ]), correctOptionIds: Object.freeze(['difference-8-5']),
        hints: Object.freeze([
          annotated('先想「多幾張」是在比兩個數量。', 'ㄒㄧㄢ ㄒㄧㄤˇ ㄉㄨㄛ ㄐㄧˇ ㄓㄤ ㄕˋ ㄗㄞˋ ㄅㄧˇ ㄌㄧㄤˇ ㄍㄜˋ ㄕㄨˋ ㄌㄧㄤˋ'),
          annotated('再看算式的答案是不是 3。', 'ㄗㄞˋ ㄎㄢˋ ㄙㄨㄢˋ ㄕˋ ㄉㄜ˙ ㄉㄚˊ ㄢˋ ㄕˋ ㄅㄨˋ ㄕˋ'),
        ]),
        incorrectFeedback: '請重新比較兩個數量，再選算式。', incorrectFeedbackPronunciationTokens: annotated('請重新比較兩個數量，再選算式。', 'ㄑㄧㄥˇ ㄔㄨㄥˊ ㄒㄧㄣ ㄅㄧˇ ㄐㄧㄠˋ ㄌㄧㄤˇ ㄍㄜˋ ㄕㄨˋ ㄌㄧㄤˋ ㄗㄞˋ ㄒㄩㄢˇ ㄙㄨㄢˋ ㄕˋ').pronunciationTokens,
        correctFeedback: '答對了！算式和數線上的結果一樣。', correctFeedbackPronunciationTokens: annotated('答對了！算式和數線上的結果一樣。', 'ㄉㄚˊ ㄉㄨㄟˋ ㄌㄜ˙ ㄙㄨㄢˋ ㄕˋ ㄏㄜˊ ㄕㄨˋ ㄒㄧㄢˋ ㄕㄤˋ ㄉㄜ˙ ㄐㄧㄝˊ ㄍㄨㄛˇ ㄧˊ ㄧㄤˋ').pronunciationTokens,
      }),
    ]),
    openQuestions: Object.freeze(['需教師確認「相差」語句與數線操作的先備是否適合目標班級。', '官方 N-1-2 附註排除一年級未知加數、被加數、減數、被減數題型；本活動只問比較差量。數線為畫面模擬，且第二階段為選擇題；未測量學生自行列式或口頭解釋。']),
  }),
  makeTask({
    activityId: 'ACT-G2-MATH-ZERO-TENS-ADDITION-CANDIDATE',
    title: '位值修理站：加法裡的0十', titlePronunciationTokens: reviewedTitlePronunciationTokens('位值修理站：加法裡的0十', 'ㄨㄟˋ ㄓˊ ㄒㄧㄡ ㄌㄧˇ ㄓㄢˋ ㄐㄧㄚ ㄈㄚˇ ㄌㄧˇ ㄉㄜ˙ ㄕˊ'), gradeId: 'grade-2', subjectId: 'mathematics',
    curriculumMapId: 'math-grade2-place-value-add-sub', curriculumCodes: ['N-2-2', 'n-I-2'],
    learningSubitemClaims: ['SUB-MATH-G2-N2-2-ZERO-PLACEHOLDER-CALCULATION'],
    curriculumScope: '對照 N-2-2 多位數加減以位值理解計算原理及含0題型；活動只操作兩個加法例子的分位步驟，不涵蓋所有含0型態、減法退位或完整自主直式。',
    learningObjective: { objectiveId: 'LO-G2-MATH-ZERO-TENS-ADDITION-01', statement: '在加法中逐位整理含0十位的數，並追蹤個位進來的十如何改變十位總量。', status: candidate },
    instructions: '逐步選出各位的計算結果。注意十位原來是0時，個位進位仍要放進十位一起整理。',
    stages: Object.freeze([
      Object.freeze({ stageId: 'add-305-127', interaction: 'complete_calculation_steps', calculationTitle: '305 + 127：整理個、十、百位', prompt: '依位值完成中間步驟。', calculationSteps: Object.freeze([
        { id: 'ones', label: '個位：5 + 7 合起來是幾個一？', expectedValue: 12, choices: [{ value: 11, label: '11個一' }, { value: 12, label: '12個一' }, { value: 13, label: '13個一' }], incorrectFeedback: '重新合併個位上的5個一和7個一。' },
        { id: 'ones-left', label: '12個一換成1個十後，個位還剩幾個一？', expectedValue: 2, choices: [{ value: 1, label: '1個一' }, { value: 2, label: '2個一' }, { value: 3, label: '3個一' }], incorrectFeedback: '十個一換成一個十，從12個一中移走十個一。' },
        { id: 'tens', label: '十位：0個十 + 2個十 + 進來的1個十，共幾個十？', expectedValue: 3, choices: [{ value: 2, label: '2個十' }, { value: 3, label: '3個十' }, { value: 4, label: '4個十' }], incorrectFeedback: '十位雖然原來是0，仍要把另一個加數的十和進位的十相加。' },
        { id: 'hundreds', label: '百位：3個百 + 1個百，共幾個百？', expectedValue: 4, choices: [{ value: 3, label: '3個百' }, { value: 4, label: '4個百' }, { value: 5, label: '5個百' }], incorrectFeedback: '最後再整理百位原有的3個百和1個百。' },
      ]), hints: Object.freeze(['先把同一位的數放在一起，從個位開始。', '十個一換一個十；十位原有0個十時，仍要加入另一個加數的十與進位。']), incorrectFeedback: '檢查出錯的位：不要漏掉個位進位，也不要把0十當成整個十位可以跳過。', correctFeedback: '你完成了含0十位的加法步驟。選擇中間步驟仍不等同獨立寫出完整計算。' }),
      Object.freeze({ stageId: 'add-402-36', interaction: 'complete_calculation_steps', calculationTitle: '402 + 36：再檢查0十位', prompt: '換一組數，重新整理個位與十位。', calculationSteps: Object.freeze([
        { id: 'ones', label: '個位：2 + 6 是幾個一？', expectedValue: 8, choices: [{ value: 7, label: '7個一' }, { value: 8, label: '8個一' }, { value: 9, label: '9個一' }], incorrectFeedback: '只合併個位上的2和6。' },
        { id: 'tens', label: '十位：0個十 + 3個十是幾個十？', expectedValue: 3, choices: [{ value: 2, label: '2個十' }, { value: 3, label: '3個十' }, { value: 4, label: '4個十' }], incorrectFeedback: '0個十表示這一項沒有十，但另一個加數仍有3個十。' },
        { id: 'hundreds', label: '百位仍有幾個百？', expectedValue: 4, choices: [{ value: 3, label: '3個百' }, { value: 4, label: '4個百' }, { value: 5, label: '5個百' }], incorrectFeedback: '402中的4在百位，沒有其他百位數要合併。' },
      ]), hints: Object.freeze(['依序查看個位、十位、百位，不要把空位漏掉。', '402有4個百、0個十、2個一；再加入36的3個十和6個一。']), incorrectFeedback: '重新按位值整理兩個加數；0十不會讓其他位數改變位置。', correctFeedback: '你在第二個數例中也追蹤了0十位。這只檢查兩個候選例子，不能代表所有含0計算。' }),
    ]),
    openQuestions: Object.freeze(['需教師確認二年級實際進度是否涵蓋三位數位值計算及此類題型。', '活動用選擇中間步驟，未要求學生獨立列式、寫出答案或解釋策略；沒有連結補強活動。']),
  }),
  makeTask({
    activityId: 'ACT-G2-MATH-TWO-CARRY-ADDITION-CANDIDATE',
    title: '進位接力：兩次整理位值', titlePronunciationTokens: reviewedTitlePronunciationTokens('進位接力：兩次整理位值', 'ㄐㄧㄣˋ ㄨㄟˋ ㄐㄧㄝ ㄌㄧˋ ㄌㄧㄤˇ ㄘˋ ㄓㄥˇ ㄌㄧˇ ㄨㄟˋ ㄓˊ'), gradeId: 'grade-2', subjectId: 'mathematics',
    curriculumMapId: 'math-grade2-place-value-add-sub', curriculumCodes: ['N-2-2', 'n-I-2'],
    learningSubitemClaims: ['SUB-MATH-G2-N2-2-UP-TO-TWO-CARRIES'],
    curriculumScope: '對照 N-2-2 加法最多二次進位的官方學習內容；僅操作兩個三位數例子中的兩次進位步驟，不代表已涵蓋減法、各數位組合或完整自主計算。年級學期與教材安排待教師確認。',
    learningObjective: { objectiveId: 'LO-G2-MATH-TWO-CARRY-ADDITION-01', statement: '逐位整理個位與十位的進位，追蹤進位進入下一位後的數量。', status: candidate },
    instructions: '完成每個數位的中間步驟，依序處理個位、十位，再檢查百位。',
    stages: Object.freeze([
      Object.freeze({ stageId: 'relay-178-146', interaction: 'complete_calculation_steps', calculationTitle: '178 + 146：個位與十位接力進位', prompt: '找出兩次進位各自如何改變下一位。', calculationSteps: Object.freeze([
        { id: 'ones', label: '8 + 6 合起來是幾個一？', expectedValue: 14, choices: [{ value: 13, label: '13個一' }, { value: 14, label: '14個一' }, { value: 15, label: '15個一' }], incorrectFeedback: '把個位的8個一和6個一合起來。' },
        { id: 'ones-remainder', label: '14個一換成1個十後，個位剩幾個一？', expectedValue: 4, choices: [{ value: 3, label: '3個一' }, { value: 4, label: '4個一' }, { value: 5, label: '5個一' }], incorrectFeedback: '十個一換成十後，還要看個位剩下幾個一。' },
        { id: 'tens', label: '十位：7 + 4 + 進來的1，共幾個十？', expectedValue: 12, choices: [{ value: 11, label: '11個十' }, { value: 12, label: '12個十' }, { value: 13, label: '13個十' }], incorrectFeedback: '十位需把兩個原有十和個位進來的1個十一起整理。' },
        { id: 'tens-remainder', label: '12個十換成1個百後，十位剩幾個十？', expectedValue: 2, choices: [{ value: 1, label: '1個十' }, { value: 2, label: '2個十' }, { value: 3, label: '3個十' }], incorrectFeedback: '十個十換成一個百，再保留十位剩餘的數量。' },
        { id: 'hundreds', label: '百位：1 + 1 + 進來的1，共幾個百？', expectedValue: 3, choices: [{ value: 2, label: '2個百' }, { value: 3, label: '3個百' }, { value: 4, label: '4個百' }], incorrectFeedback: '百位要包含兩個加數原有的百和十位進來的百。' },
      ]), hints: Object.freeze(['每一位先相加，達到10個該位單位時再換到左邊一位。', '個位14個一留下4並進1十；十位12個十留下2並進1百。']), incorrectFeedback: '回到第一個出錯的位值，檢查「換到左位」與「本位留下」兩件事。', correctFeedback: '你完成個位、十位兩次進位的中間步驟。這是有限例題，不代表所有加法策略均已掌握。' }),
      Object.freeze({ stageId: 'relay-286-157', interaction: 'complete_calculation_steps', calculationTitle: '286 + 157：換數字再試一次', prompt: '用新數字檢查兩次進位的步驟。', calculationSteps: Object.freeze([
        { id: 'ones', label: '6 + 7 合起來是幾個一？', expectedValue: 13, choices: [{ value: 12, label: '12個一' }, { value: 13, label: '13個一' }, { value: 14, label: '14個一' }], incorrectFeedback: '重新計算個位6加7。' },
        { id: 'ones-remainder', label: '換出1個十後個位剩幾個一？', expectedValue: 3, choices: [{ value: 2, label: '2個一' }, { value: 3, label: '3個一' }, { value: 4, label: '4個一' }], incorrectFeedback: '從13個一換出十個一後，留下的仍是個位單位。' },
        { id: 'tens', label: '十位：8 + 5 + 1進位，共幾個十？', expectedValue: 14, choices: [{ value: 13, label: '13個十' }, { value: 14, label: '14個十' }, { value: 15, label: '15個十' }], incorrectFeedback: '十位相加時不要忘記個位送來的1個十。' },
        { id: 'tens-remainder', label: '換出1個百後十位剩幾個十？', expectedValue: 4, choices: [{ value: 3, label: '3個十' }, { value: 4, label: '4個十' }, { value: 5, label: '5個十' }], incorrectFeedback: '14個十換成1個百後，十位留下4個十。' },
        { id: 'hundreds', label: '百位：2 + 1 + 1進位，共幾個百？', expectedValue: 4, choices: [{ value: 3, label: '3個百' }, { value: 4, label: '4個百' }, { value: 5, label: '5個百' }], incorrectFeedback: '把百位兩個數字與十位進來的1個百合起來。' },
      ]), hints: Object.freeze(['這次每一位都要把前一位送來的進位一起加入。', '分別核對個位換十、十位換百；留下的數仍屬於原位。']), incorrectFeedback: '檢查第一次進位有沒有帶進十位，以及第二次進位是否放到百位。', correctFeedback: '你在另一組數字上完成相同步驟。一次新例題只提供有限遷移線索，不構成穩定掌握證據。' }),
    ]),
    openQuestions: Object.freeze(['需教師確認二年級班級是否已具備三位數加法及進位表徵先備。', '活動只呈現加法最多兩次進位的中間選擇步驟，未涵蓋減法和學生自行書寫計算。']),
  }),
]);
