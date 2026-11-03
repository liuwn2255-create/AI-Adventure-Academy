const candidateStatus = 'candidate_pending_teacher_review';
const evidencePolicy = Object.freeze({
  persistence: 'memory_only_no_student_records_no_localStorage',
  completionIsMastery: false,
  hintAssistedResponseIsIndependentEvidence: false,
});
const noReinforcement = Object.freeze({ reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動' });
const notReviewed = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });

const grade1ShapeCopyText = (text, readings) => {
  const readingList = readings.trim().split(/\s+/u);
  let readingIndex = 0;
  const pronunciationTokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = readingList[readingIndex++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (readingIndex !== readingList.length) throw new Error(`Extra reviewed pronunciation for ${text}`);
  return Object.freeze({ text, pronunciationTokens: Object.freeze(pronunciationTokens) });
};

const grade1ShapeCopyPiece = (id, label, shape, readings) => Object.freeze({
  id,
  label,
  shape,
  pronunciationTokens: grade1ShapeCopyText(label, readings).pronunciationTokens,
});

export const GRADE1_SHAPE_COPY_STUDIO = Object.freeze({
  activityId: 'ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE', revision: 1,
  title: '格子拼拼板：用正方形填滿格子', gradeId: 'grade-1', subjectId: 'mathematics',
  status: candidateStatus, sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade1-shape-operation', sourceId: 'mathematics',
  curriculumCodes: ['S-1-2'],
  curriculumScope: 'S-1-2要求以操作活動描繪、複製、拼貼、堆疊平面或立體形體。本活動以螢幕圖形片複製兩個平面格形，只是局部候選練習；不評量實體拼貼、堆疊、描繪或立體形體操作。',
  learningObjective: { objectiveId: 'LO-G1-MATH-SHAPE-COPY-01', statement: '選取並排列圖形片，依格形提示複製一個簡單平面圖案。', status: candidateStatus },
  instructions: '看格形提示，用圖形片把拼圖板補完整。點選圖形片可放入或取回；送出後會說明需要檢查的位置。',
  learningSubitemClaims: ['SUB-MATH-G1-S1-2-COPY-PLANE-TILE-PATTERN'],
  stages: Object.freeze([
    Object.freeze({
      stageId: 'copy-two-by-two-square', interaction: 'compose_shape',
      prompt: '拼圖板有 2 排，每排 2 格。選 4 片正方形，把格子填滿。',
      promptPronunciationTokens: grade1ShapeCopyText('拼圖板有 2 排，每排 2 格。選 4 片正方形，把格子填滿。', 'ㄆㄧㄣ ㄊㄨˊ ㄅㄢˇ ㄧㄡˇ ㄆㄞˊ ㄇㄟˇ ㄆㄞˊ ㄍㄜˊ ㄒㄩㄢˇ ㄆㄧㄢˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄚˇ ㄍㄜˊ ˙ㄗ ㄊㄧㄢˊ ㄇㄢˇ').pronunciationTokens,
      studentOperationGuidance: '怎麼玩：① 點圖形片放進格子 → ② 點已放的圖形片可以取回 → ③ 填滿後檢查答案',
      studentOperationGuidancePronunciationTokens: grade1ShapeCopyText('怎麼玩：① 點圖形片放進格子 → ② 點已放的圖形片可以取回 → ③ 填滿後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄉㄧㄢˇ ㄊㄨˊ ㄒㄧㄥˊ ㄆㄧㄢˋ ㄈㄤˋ ㄐㄧㄣˋ ㄍㄜˊ ˙ㄗ ㄉㄧㄢˇ ㄧˇ ㄈㄤˋ ˙ㄉㄜ ㄊㄨˊ ㄒㄧㄥˊ ㄆㄧㄢˋ ㄎㄜˇ ㄧˇ ㄑㄩˇ ㄏㄨㄟˊ ㄊㄧㄢˊ ㄇㄢˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ').pronunciationTokens,
      pieces: Object.freeze([
        grade1ShapeCopyPiece('square-a', '正方形片 A', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('square-b', '正方形片 B', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('square-c', '正方形片 C', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('square-d', '正方形片 D', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('triangle-a', '三角形片', 'triangle', 'ㄙㄢ ㄐㄧㄠˇ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
      ]),
      shapeRules: Object.freeze({ rows: 2, columns: 2, correctPieceIds: ['square-a', 'square-b', 'square-c', 'square-d'] }),
      hints: Object.freeze([
        grade1ShapeCopyText('先數一數，一共有幾格。', 'ㄒㄧㄢ ㄕㄨˇ ㄧ˙ ㄕㄨˇ ㄧˊ ㄍㄨㄥˋ ㄧㄡˇ ㄐㄧˇ ㄍㄜˊ'),
        grade1ShapeCopyText('每一格都要放正方形，不要放三角形。', 'ㄇㄟˇ ㄧˋ ㄍㄜˊ ㄉㄡ ㄧㄠˋ ㄈㄤˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄨˊ ㄧㄠˋ ㄈㄤˋ ㄙㄢ ㄐㄧㄠˇ ㄒㄧㄥˊ'),
      ]),
      incorrectFeedback: '再看一次。每一格都要放正方形，不要放三角形。',
      incorrectFeedbackPronunciationTokens: grade1ShapeCopyText('再看一次。每一格都要放正方形，不要放三角形。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄇㄟˇ ㄧˋ ㄍㄜˊ ㄉㄡ ㄧㄠˋ ㄈㄤˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄨˊ ㄧㄠˋ ㄈㄤˋ ㄙㄢ ㄐㄧㄠˇ ㄒㄧㄥˊ').pronunciationTokens,
      correctFeedback: '答對了！你用 4 片正方形把格子填滿了。',
      correctFeedbackPronunciationTokens: grade1ShapeCopyText('答對了！你用 4 片正方形把格子填滿了。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄋㄧˇ ㄩㄥˋ ㄆㄧㄢˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄚˇ ㄍㄜˊ ˙ㄗ ㄊㄧㄢˊ ㄇㄢˇ ˙ㄌㄜ').pronunciationTokens,
    }),
    Object.freeze({
      stageId: 'copy-three-by-two-rectangle', interaction: 'compose_shape',
      prompt: '拼圖板有 3 排，每排 2 格。選 6 片正方形，把格子填滿。',
      promptPronunciationTokens: grade1ShapeCopyText('拼圖板有 3 排，每排 2 格。選 6 片正方形，把格子填滿。', 'ㄆㄧㄣ ㄊㄨˊ ㄅㄢˇ ㄧㄡˇ ㄆㄞˊ ㄇㄟˇ ㄆㄞˊ ㄍㄜˊ ㄒㄩㄢˇ ㄆㄧㄢˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄚˇ ㄍㄜˊ ˙ㄗ ㄊㄧㄢˊ ㄇㄢˇ').pronunciationTokens,
      studentOperationGuidance: '怎麼玩：① 點圖形片放進格子 → ② 點已放的圖形片可以取回 → ③ 填滿後檢查答案',
      studentOperationGuidancePronunciationTokens: grade1ShapeCopyText('怎麼玩：① 點圖形片放進格子 → ② 點已放的圖形片可以取回 → ③ 填滿後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄉㄧㄢˇ ㄊㄨˊ ㄒㄧㄥˊ ㄆㄧㄢˋ ㄈㄤˋ ㄐㄧㄣˋ ㄍㄜˊ ˙ㄗ ㄉㄧㄢˇ ㄧˇ ㄈㄤˋ ˙ㄉㄜ ㄊㄨˊ ㄒㄧㄥˊ ㄆㄧㄢˋ ㄎㄜˇ ㄧˇ ㄑㄩˇ ㄏㄨㄟˊ ㄊㄧㄢˊ ㄇㄢˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ').pronunciationTokens,
      pieces: Object.freeze([
        grade1ShapeCopyPiece('tile-a', '正方形片 A', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('tile-b', '正方形片 B', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('tile-c', '正方形片 C', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('tile-d', '正方形片 D', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('tile-e', '正方形片 E', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('tile-f', '正方形片 F', 'square', 'ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
        grade1ShapeCopyPiece('triangle-b', '三角形片', 'triangle', 'ㄙㄢ ㄐㄧㄠˇ ㄒㄧㄥˊ ㄆㄧㄢˋ'),
      ]),
      shapeRules: Object.freeze({ rows: 3, columns: 2, correctPieceIds: ['tile-a', 'tile-b', 'tile-c', 'tile-d', 'tile-e', 'tile-f'] }),
      hints: Object.freeze([
        grade1ShapeCopyText('先數一數，一共有幾格。', 'ㄒㄧㄢ ㄕㄨˇ ㄧ˙ ㄕㄨˇ ㄧˊ ㄍㄨㄥˋ ㄧㄡˇ ㄐㄧˇ ㄍㄜˊ'),
        grade1ShapeCopyText('每一格都要放正方形，不要放三角形。', 'ㄇㄟˇ ㄧˋ ㄍㄜˊ ㄉㄡ ㄧㄠˋ ㄈㄤˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄨˊ ㄧㄠˋ ㄈㄤˋ ㄙㄢ ㄐㄧㄠˇ ㄒㄧㄥˊ'),
      ]),
      incorrectFeedback: '再看一次。每一格都要放正方形，不要放三角形。',
      incorrectFeedbackPronunciationTokens: grade1ShapeCopyText('再看一次。每一格都要放正方形，不要放三角形。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄇㄟˇ ㄧˋ ㄍㄜˊ ㄉㄡ ㄧㄠˋ ㄈㄤˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄨˊ ㄧㄠˋ ㄈㄤˋ ㄙㄢ ㄐㄧㄠˇ ㄒㄧㄥˊ').pronunciationTokens,
      correctFeedback: '答對了！你用 6 片正方形把格子填滿了。',
      correctFeedbackPronunciationTokens: grade1ShapeCopyText('答對了！你用 6 片正方形把格子填滿了。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄋㄧˇ ㄩㄥˋ ㄆㄧㄢˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄅㄚˇ ㄍㄜˊ ˙ㄗ ㄊㄧㄢˊ ㄇㄢˇ ˙ㄌㄜ').pronunciationTokens,
      teacherLimitationNote: '本活動為螢幕模擬，不代表實體拼貼或立體堆疊能力已確認。',
    }),
  ]),
  ...noReinforcement, evidencePolicy, teacherReview: notReviewed,
  openQuestions: Object.freeze(['圖形片操作是否符合班級已學的形體詞彙與精細操作需求，待教師確認。', '螢幕選取不等同實際描繪、拼貼、堆疊或立體圖形操作。']),
});

export const GRADE2_TWO_STEP_MARKET_QUEST = Object.freeze({
  activityId: 'ACT-G2-MATH-TWO-STEP-MARKET-CANDIDATE', revision: 1,
  title: '市集補給任務：先算一站，再走下一站', gradeId: 'grade-2', subjectId: 'mathematics',
  status: candidateStatus, sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade2-two-step-applications', sourceId: 'mathematics',
  curriculumCodes: ['N-2-8'],
  curriculumScope: 'N-2-8為二年級學習內容：加、減、乘的兩步驟應用問題，含加減混合、加與乘、減與乘；不含併式、不含連乘。本活動只操作「先乘後加」及「先加後減」兩個原創情境，不代表完整涵蓋 N-2-8。',
  learningObjective: { objectiveId: 'LO-G2-MATH-TWO-STEP-MARKET-01', statement: '從生活情境找出先後兩個運算，完成第一步後再用中間結果處理第二步。', status: candidateStatus },
  instructions: '讀每一站的故事，依序組出第一步與第二步算式。第二站會明示上一站的中間結果，請先完成前一步再繼續。',
  learningSubitemClaims: ['SUB-MATH-G2-N2-8-ORDERED-TWO-STEP-OPERATIONS'],
  stages: Object.freeze([
    Object.freeze({
      stageId: 'calculate-boxes-then-extras', interaction: 'assemble_response',
      prompt: '補給站有 3 盒貼紙，每盒 4 張，另外又找到 2 張。第一步先算 3 盒共有幾張，請排出第一步算式。',
      tokens: Object.freeze([
        Object.freeze({ id: 's1-three', text: '3' }), Object.freeze({ id: 's1-times', text: '×' }), Object.freeze({ id: 's1-four', text: '4' }),
        Object.freeze({ id: 's1-equals', text: '=' }), Object.freeze({ id: 's1-twelve', text: '12' }), Object.freeze({ id: 's1-plus', text: '+' }),
        Object.freeze({ id: 's1-two', text: '2' }), Object.freeze({ id: 's1-fourteen', text: '14' }),
      ]),
      correctOptionIds: Object.freeze(['s1-three', 's1-times', 's1-four', 's1-equals', 's1-twelve']),
      hints: Object.freeze(['先處理「每盒一樣多」的三盒貼紙，還沒加上另外找到的貼紙。', '第一步要算 3 組、每組 4 張；先完成這個中間數量。']),
      incorrectFeedback: '第一步先只算盒子裡的貼紙，不要把另外找到的 2 張提前算進去；再核對三組各四張。',
      correctFeedback: '三盒共有 12 張。記住這個中間結果，再把另外找到的貼紙加入。',
    }),
    Object.freeze({
      stageId: 'add-found-stickers-to-intermediate-total', interaction: 'assemble_response',
      prompt: '上一站算出 12 張貼紙，另外又找到 2 張。排出第二步，算出現在共有幾張。',
      tokens: Object.freeze([
        Object.freeze({ id: 's2-twelve', text: '12' }), Object.freeze({ id: 's2-plus', text: '+' }), Object.freeze({ id: 's2-two', text: '2' }),
        Object.freeze({ id: 's2-equals', text: '=' }), Object.freeze({ id: 's2-fourteen', text: '14' }), Object.freeze({ id: 's2-times', text: '×' }),
        Object.freeze({ id: 's2-three', text: '3' }), Object.freeze({ id: 's2-four', text: '4' }),
      ]),
      correctOptionIds: Object.freeze(['s2-twelve', 's2-plus', 's2-two', 's2-equals', 's2-fourteen']),
      hints: Object.freeze(['第二步使用第一步留下的 12 張，再處理新找到的 2 張。', '把中間結果和新增數量合起來；不要再重算盒數。']),
      incorrectFeedback: '檢查第二步是否使用中間結果 12 和新增的 2；題目問合起來的總數。',
      correctFeedback: '你先算盒裝數量，再把新增貼紙加上，完成兩步驟情境。這兩例只提供局部練習，不代表能獨立解決所有兩步驟問題。',
    }),
    Object.freeze({
      stageId: 'add-and-then-give-away', interaction: 'assemble_response',
      prompt: '另一站原有 7 顆蘋果，收到 5 顆後，送出 3 顆。先排第一步「收到後有幾顆」，再排第二步「送出後剩幾顆」。',
      tokens: Object.freeze([
        Object.freeze({ id: 's3-seven', text: '7' }), Object.freeze({ id: 's3-plus', text: '+' }), Object.freeze({ id: 's3-five', text: '5' }),
        Object.freeze({ id: 's3-eq-one', text: '=' }), Object.freeze({ id: 's3-twelve', text: '12' }), Object.freeze({ id: 's3-minus', text: '−' }),
        Object.freeze({ id: 's3-three', text: '3' }), Object.freeze({ id: 's3-eq-two', text: '=' }), Object.freeze({ id: 's3-nine', text: '9' }),
      ]),
      correctOptionIds: Object.freeze(['s3-seven', 's3-plus', 's3-five', 's3-eq-one', 's3-twelve', 's3-minus', 's3-three', 's3-eq-two', 's3-nine']),
      hints: Object.freeze(['先處理收到蘋果，然後才處理送出；中間結果要留著。', '第一步得到 12 顆；第二步從 12 顆拿走 3 顆。']),
      incorrectFeedback: '請把「收到」和「送出」分開：先增加得到中間數，再從中間數減去送出的數量。',
      correctFeedback: '你在新情境中連續安排加法和減法步驟。這是另一道遷移檢查，不是穩定掌握證據。',
    }),
  ]),
  ...noReinforcement, evidencePolicy, teacherReview: notReviewed,
  openQuestions: Object.freeze(['學生的乘法與加減先備、情境閱讀負擔及接受算式卡排列方式待教師確認。', '本候選不含併式、連乘、所有運算組合或自主文字列式評量。']),
});

export const GRADE2_MONEY_COMBINATION_MARKET = Object.freeze({
  activityId: 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE', revision: 1,
  title: '幣值組合市集：選幣付款任務', gradeId: 'grade-2', subjectId: 'mathematics',
  status: candidateStatus, sourceKind: 'original_interactive_candidate_not_textbook',
  curriculumMapId: 'math-grade2-money-combination-problem-solving', sourceId: 'mathematics', curriculumCodes: ['N-2-5', 'n-I-3'],
  curriculumScope: 'N-2-5官方內容為100元、500元、1000元，以操作活動為主兼及計算，容許多元策略並包含已學習的更小幣值；官方備註可與N-2-4估算連結。本活動透過螢幕面額卡多選組合及付款總額核對，提供100、500、1000元三個模擬購物情境。沒有實作找零、實體錢幣操作、學生自主提出所有等值策略或真實交易，故僅部分候選練習。',
  learningObjective: { objectiveId: 'LO-G2-MATH-MONEY-COMBINATION-01', statement: '操作不同面額的模擬紙鈔與硬幣，組出指定購物付款金額，並核對組合總值。', status: candidateStatus },
  instructions: '市集使用模擬錢幣卡。點選或再點一次取消，畫面會即時計算已選金額；組出剛好付款金額後檢查。此為數位練習，不是實體交易或找零評量。',
  learningSubitemClaims: ['SUB-MATH-G2-N2-5-OPERATE-DENOMINATION-COMBINATIONS'],
  stages: Object.freeze([
    Object.freeze({
      stageId: 'pay-market-basket-one-hundred', interaction: 'collect_evidence',
      prompt: '野餐籃要付 100 元。選取一種錢幣組合，讓付款剛好是 100 元。', targetAmount: 100,
      options: Object.freeze([
        Object.freeze({ id: 'g2-100-note-a', text: '100 元紙鈔', valueAmount: 100 }),
        Object.freeze({ id: 'g2-50-coin-a', text: '50 元硬幣 A', valueAmount: 50 }),
        Object.freeze({ id: 'g2-50-coin-b', text: '50 元硬幣 B', valueAmount: 50 }),
        Object.freeze({ id: 'g2-10-coin-a', text: '10 元硬幣 A', valueAmount: 10 }),
        Object.freeze({ id: 'g2-10-coin-b', text: '10 元硬幣 B', valueAmount: 10 }),
        Object.freeze({ id: 'g2-10-coin-c', text: '10 元硬幣 C', valueAmount: 10 }),
        Object.freeze({ id: 'g2-10-coin-d', text: '10 元硬幣 D', valueAmount: 10 }),
        Object.freeze({ id: 'g2-10-coin-e', text: '10 元硬幣 E', valueAmount: 10 }),
        Object.freeze({ id: 'g2-5-coin-a', text: '5 元硬幣', valueAmount: 5 }),
        Object.freeze({ id: 'g2-1-coin-a', text: '1 元硬幣', valueAmount: 1 }),
      ]),
      acceptedOptionSets: Object.freeze([
        Object.freeze(['g2-100-note-a']), Object.freeze(['g2-50-coin-a', 'g2-50-coin-b']),
        Object.freeze(['g2-10-coin-a', 'g2-10-coin-b', 'g2-10-coin-c', 'g2-10-coin-d', 'g2-10-coin-e', 'g2-50-coin-a']),
      ]),
      correctOptionIds: Object.freeze(['g2-100-note-a']),
      hints: Object.freeze(['先選一張或幾枚錢幣；留意畫面會加總你選的面額。', '先看看每種錢幣代表多少元，再把你選的金額加起來，看看是不是剛好 100 元。']),
      incorrectFeedback: '看即時總額：少於商品價格還不夠付款，多於價格則不是本題要求的「剛好」組合。',
      correctFeedback: '你用一種面額組合付出 100 元。接著換一個較大的購物金額。',
    }),
    Object.freeze({
      stageId: 'pay-market-basket-five-hundred', interaction: 'collect_evidence',
      prompt: '露營補給要付 500 元。可用一張 500 元紙鈔，或組合已學的小面額；請選一組剛好付款。', targetAmount: 500,
      options: Object.freeze([
        Object.freeze({ id: 'g2-500-note-a', text: '500 元紙鈔', valueAmount: 500 }),
        Object.freeze({ id: 'g2-100-note-a', text: '100 元紙鈔 A', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-b', text: '100 元紙鈔 B', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-c', text: '100 元紙鈔 C', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-d', text: '100 元紙鈔 D', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-e', text: '100 元紙鈔 E', valueAmount: 100 }),
        Object.freeze({ id: 'g2-50-coin-a', text: '50 元硬幣 A', valueAmount: 50 }),
        Object.freeze({ id: 'g2-50-coin-b', text: '50 元硬幣 B', valueAmount: 50 }),
      ]),
      acceptedOptionSets: Object.freeze([
        Object.freeze(['g2-500-note-a']),
        Object.freeze(['g2-100-note-a', 'g2-100-note-b', 'g2-100-note-c', 'g2-100-note-d', 'g2-100-note-e']),
        Object.freeze(['g2-100-note-a', 'g2-100-note-b', 'g2-100-note-c', 'g2-100-note-d', 'g2-50-coin-a', 'g2-50-coin-b']),
      ]),
      correctOptionIds: Object.freeze(['g2-500-note-a']),
      hints: Object.freeze(['可以用一張大面額，也可以用多張小面額；逐張加總。', '五張 100 元紙鈔合起來是 500 元；一張 500 元也可以。']),
      incorrectFeedback: '依面額逐張累加，檢查總額是否剛好 500 元；本題沒有要求找零。',
      correctFeedback: '你用一種組合湊成 500 元。注意不同組合可以表示同一金額。',
    }),
    Object.freeze({
      stageId: 'pay-market-basket-one-thousand', interaction: 'collect_evidence',
      prompt: '探險工具組要付 1000 元。用一張 1000 元紙鈔，或用較小面額組合付款。', targetAmount: 1000,
      options: Object.freeze([
        Object.freeze({ id: 'g2-1000-note-a', text: '1000 元紙鈔', valueAmount: 1000 }),
        Object.freeze({ id: 'g2-500-note-a', text: '500 元紙鈔 A', valueAmount: 500 }),
        Object.freeze({ id: 'g2-500-note-b', text: '500 元紙鈔 B', valueAmount: 500 }),
        Object.freeze({ id: 'g2-100-note-a', text: '100 元紙鈔 A', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-b', text: '100 元紙鈔 B', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-c', text: '100 元紙鈔 C', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-d', text: '100 元紙鈔 D', valueAmount: 100 }),
        Object.freeze({ id: 'g2-100-note-e', text: '100 元紙鈔 E', valueAmount: 100 }),
      ]),
      acceptedOptionSets: Object.freeze([
        Object.freeze(['g2-1000-note-a']),
        Object.freeze(['g2-500-note-a', 'g2-500-note-b']),
        Object.freeze(['g2-500-note-a', 'g2-100-note-a', 'g2-100-note-b', 'g2-100-note-c', 'g2-100-note-d', 'g2-100-note-e']),
      ]),
      correctOptionIds: Object.freeze(['g2-1000-note-a']),
      hints: Object.freeze(['先決定用大面額還是小面額；選取後確認總額。', '兩張 500 元紙鈔，或十張 100 元紙鈔，合起來都是 1000 元。']),
      incorrectFeedback: '付款總額要剛好 1000 元。試著把選取的面額分組後再加總。',
      correctFeedback: '你完成 1000 元付款組合。這些面額卡是模擬材料，不代表實體數錢熟練度。',
    }),
  ]),
  ...noReinforcement, evidencePolicy, teacherReview: notReviewed,
  openQuestions: Object.freeze(['本活動僅用多選面額卡練習指定金額的組合及加總；不含找零、學生自創組合、真實購物與實體錢幣操作。', '金額情境及允許策略由專案設計；教師仍需確認與班級已學幣值相符。']),
});

export const GRADE2_LIVING_RULES_REASON_QUEST = Object.freeze({
  activityId: 'ACT-G2-LIVING-RULES-REASON-QUEST-CANDIDATE', revision: 1,
  title: '一起生活研究所：規則幫了誰？', gradeId: 'grade-2', subjectId: 'living-curriculum',
  status: candidateStatus, sourceKind: 'original_simulated_social_situation_candidate_not_textbook',
  curriculumMapId: 'living-curriculum-stage1-shared-rules', sourceId: 'living-curriculum',
  curriculumCodes: ['6-I-3', 'E-I-2'],
  curriculumScope: '生活課程第一學習階段部分對應：6-I-3探究生活規範與禮儀意義；E-I-2為生活規範的實踐。本活動用虛構教室情境辨認共同規則的功能並選擇合宜行動；不判斷學生真實行為，也不代表理解不同場合的所有禮儀。',
  learningObjective: { objectiveId: 'LO-G2-LIVING-RULES-REASON-01', statement: '從模擬共同活動情境中分類規則影響，並為一種情況選擇能照顧共同參與的行動。', status: candidateStatus },
  instructions: '讀模擬情境，將行為卡依對共同活動的影響分類，再選出能兼顧大家參與的做法。',
  learningSubitemClaims: ['SUB-LIVING-STAGE1-6-I-3-RULE-PURPOSE-AND-ACTION'],
  stages: Object.freeze([
    Object.freeze({
      stageId: 'classify-shared-reading-actions', interaction: 'classify_observations',
      prompt: '模擬情境：小組輪流讀同一本故事。把行為卡放到「幫助大家輪流參與」或「讓輪流變困難」。',
      context: Object.freeze([{ speaker: '模擬故事情境', text: '四位同學共讀一本書，大家約好輪流選一頁朗讀，並聽完同伴再接著讀。' }]),
      observations: Object.freeze([
        Object.freeze({ id: 'wait-turn', text: '等同伴讀完，再輪到自己。' }),
        Object.freeze({ id: 'take-book', text: '不等輪到自己，就把書拿走。' }),
        Object.freeze({ id: 'listen', text: '聽同伴讀完，接著讀下一頁。' }),
        Object.freeze({ id: 'skip-friend', text: '跳過一位同伴，直接再讀一次。' }),
      ]),
      categories: Object.freeze([Object.freeze({ id: 'supports-turns', label: '幫助大家輪流參與' }), Object.freeze({ id: 'makes-turns-hard', label: '讓輪流變困難' })]),
      correctAssignments: Object.freeze({ 'wait-turn': 'supports-turns', 'take-book': 'makes-turns-hard', listen: 'supports-turns', 'skip-friend': 'makes-turns-hard' }),
      hints: Object.freeze(['想想每個人是否有等到約定的朗讀機會。', '等候和聽完同伴能保留輪流機會；拿走書或跳過同伴會打亂約定。']),
      incorrectFeedback: '回到情境中的「輪流」約定，逐張檢查行為會讓每位同學更容易或更難參與。',
      correctFeedback: '你依行為對共同活動的影響分類。下一步想一想：為什麼小組需要這項約定？',
    }),
    Object.freeze({
      stageId: 'choose-rule-purpose-and-repair', interaction: 'choose_response',
      prompt: '如果小組有人一直拿著書、不讓同伴讀，哪個做法最能恢復大家輪流參與？',
      options: Object.freeze([
        Object.freeze({ id: 'restore-turn', text: '停下來確認輪到誰，再把書交給那位同伴。', feedback: '這個做法回到輪流約定，讓其他人也有參與機會。' }),
        Object.freeze({ id: 'end-reading', text: '把書收起來，讓任何人都不能再讀。', feedback: '停止整個活動沒有恢復輪流參與的機會。' }),
        Object.freeze({ id: 'keep-book', text: '讓拿著書的人一直讀，其他人繼續等待。', feedback: '這沒有處理同伴沒有輪到的情況。' }),
      ]),
      correctOptionIds: Object.freeze(['restore-turn']),
      hints: Object.freeze(['先想規則要照顧的共同目標，而不只是阻止一個人。', '選一個能讓約定重新運作、也讓同伴有機會參與的行動。']),
      incorrectFeedback: '檢查做法是否讓輪流約定重新開始，並讓還沒參與的同伴有機會加入。',
      correctFeedback: '你把規則目的連到具體修復行動。這是模擬判斷，仍需教師依班級生活經驗討論規則與禮儀。',
    }),
  ]),
  ...noReinforcement, evidencePolicy, teacherReview: notReviewed,
  openQuestions: Object.freeze(['模擬輪流情境是否符合學生生活經驗及語言理解，待教師確認。', '本任務不評量學生是否在真實情境中自我調整，也未涵蓋不同場合禮儀。']),
});

function reviewedPlaygroundText(text, readingSequence) {
  const readings = readingSequence.trim() ? readingSequence.trim().split(/\s+/u) : [];
  let readingIndex = 0;
  const tokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = readings[readingIndex++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (readingIndex !== readings.length) throw new Error(`Extra reviewed pronunciation for ${text}`);
  return Object.freeze(tokens);
}

const playgroundHint = (text, readings) => Object.freeze({ text, pronunciationTokens: reviewedPlaygroundText(text, readings) });
const playgroundObservation = (id, text, readings) => Object.freeze({ id, text, pronunciationTokens: reviewedPlaygroundText(text, readings) });
const playgroundToken = (id, text, readings) => Object.freeze({ id, text, pronunciationTokens: reviewedPlaygroundText(text, readings) });
const playgroundOption = (id, text, readings, feedback, feedbackReadings) => Object.freeze({
  id,
  text,
  pronunciationTokens: reviewedPlaygroundText(text, readings),
  feedback,
  feedbackPronunciationTokens: reviewedPlaygroundText(feedback, feedbackReadings),
});

const playgroundTeacherLimitation = '本活動只提供虛構螢幕情境練習，不代表學生已具備真實環境觀察、風險辨認或安全移動能力。情境與求助方式需依學校所在地實際安全規範調整；本活動不是當地交通路線指引，也不評量實地移動、身體技能或真實情境中的持續安全行為。';

export const GRADE1_PLAYGROUND_SAFETY_ROUTE = Object.freeze({
  activityId: 'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE', revision: 1,
  title: '安全路線小隊：遊戲場與上下學任務', gradeId: 'grade-1', subjectId: 'health-physical-education',
  status: candidateStatus, sourceKind: 'original_simulated_safety_scenario_candidate_not_textbook',
  curriculumMapId: 'health-pe-stage1-playground-and-school-route-safety', sourceId: 'health-physical-education',
  curriculumCodes: ['Ba-Ⅰ-1'],
  curriculumScope: '健康與體育第一學習階段 Ba-Ⅰ-1：「遊戲場所與上下學情境的安全須知。」本活動只讓學生在螢幕上的虛構情境分類風險、排序求助步驟並檢查新情境；不評量真實移動技能、現場辨識、個人路線安全或完整安全能力。第一學習階段涵蓋一、二年級；本活動出現在一年級入口是專案配置，不是官方授課順序。',
  learningObjective: { objectiveId: 'LO-G1-HPE-PLAYGROUND-SAFETY-01', statement: '在虛構遊戲場所與上下學情境中，辨認需要停下避開的風險，並選擇向可信任成人求助的步驟。', status: candidateStatus },
  instructions: '這是安全情境模擬，不是實際走路或體能測驗。先分類情境卡，再排出遇到路線受阻時的處理步驟，最後在新情境檢查你的做法。',
  learningSubitemClaims: ['SUB-HPE-STAGE1-BA-I-1-PLAYGROUND-SCHOOL-ROUTE-SAFETY'],
  stages: Object.freeze([
    Object.freeze({
      stageId: 'inspect-playground-and-school-route-scenes', interaction: 'classify_observations',
      prompt: '看每張卡：可以照原來做，還是要停下找大人？',
      promptPronunciationTokens: reviewedPlaygroundText('看每張卡：可以照原來做，還是要停下找大人？', 'ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄎㄜˇ ㄧˇ ㄓㄠˋ ㄩㄢˊ ㄌㄞˊ ㄗㄨㄛˋ ㄏㄞˊ ㄕˋ ㄧㄠˋ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄓㄠˇ ㄉㄚˋ ㄖㄣˊ'),
      studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 選「可以照原來做」或「要停下找大人」 → ③ 全部分好後檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPlaygroundText('怎麼玩：① 看每張卡 → ② 選「可以照原來做」或「要停下找大人」 → ③ 全部分好後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄩㄢˇ ㄎㄜˇ ㄧˇ ㄓㄠˋ ㄩㄢˊ ㄌㄞˊ ㄗㄨㄛˋ ㄏㄨㄛˋ ㄧㄠˋ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄓㄠˇ ㄉㄚˋ ㄖㄣˊ ㄑㄩㄢˊ ㄅㄨˋ ㄈㄣ ㄏㄠˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      context: Object.freeze([{ speaker: '安全情境', speakerPronunciationTokens: reviewedPlaygroundText('安全情境', 'ㄢ ㄑㄩㄢˊ ㄑㄧㄥˊ ㄐㄧㄥˋ'), text: '小隊跟著大人走原來的路。一路看看前面。', pronunciationTokens: reviewedPlaygroundText('小隊跟著大人走原來的路。一路看看前面。', 'ㄒㄧㄠˇ ㄉㄨㄟˋ ㄍㄣ ㄓㄜ˙ ㄉㄚˋ ㄖㄣˊ ㄗㄡˇ ㄩㄢˊ ㄌㄞˊ ㄉㄜ˙ ㄌㄨˋ ㄧˊ ㄌㄨˋ ㄎㄢˋ ㄎㄢˋ ㄑㄧㄢˊ ㄇㄧㄢˋ') }]),
      observations: Object.freeze([
        playgroundObservation('use-marked-route', '跟著大人走原來的路。', 'ㄍㄣ ㄓㄜ˙ ㄉㄚˋ ㄖㄣˊ ㄗㄡˇ ㄩㄢˊ ㄌㄞˊ ㄉㄜ˙ ㄌㄨˋ'),
        playgroundObservation('wait-at-gate', '原來的路不能走，停在安全的地方告訴大人。', 'ㄩㄢˊ ㄌㄞˊ ㄉㄜ˙ ㄌㄨˋ ㄅㄨˋ ㄋㄥˊ ㄗㄡˇ ㄊㄧㄥˊ ㄗㄞˋ ㄢ ㄑㄩㄢˊ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ'),
        playgroundObservation('run-between-play', '在器材旁追跑，沒有看前面。', 'ㄗㄞˋ ㄑㄧˋ ㄘㄞˊ ㄆㄤˊ ㄓㄨㄟ ㄆㄠˇ ㄇㄟˊ ㄧㄡˇ ㄎㄢˋ ㄑㄧㄢˊ ㄇㄧㄢˋ'),
        playgroundObservation('leave-adult', '找不到同伴，自己離開等大人的地方去找路。', 'ㄓㄠˇ ㄅㄨˋ ㄉㄠˋ ㄊㄨㄥˊ ㄅㄢˋ ㄗˋ ㄐㄧˇ ㄌㄧˊ ㄎㄞ ㄉㄥˇ ㄉㄚˋ ㄖㄣˊ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ ㄑㄩˋ ㄓㄠˇ ㄌㄨˋ'),
      ]),
      categories: Object.freeze([
        Object.freeze({ id: 'safer-choice', label: '可以照原來做', pronunciationTokens: reviewedPlaygroundText('可以照原來做', 'ㄎㄜˇ ㄧˇ ㄓㄠˋ ㄩㄢˊ ㄌㄞˊ ㄗㄨㄛˋ') }),
        Object.freeze({ id: 'stop-and-get-adult', label: '要停下找大人', pronunciationTokens: reviewedPlaygroundText('要停下找大人', 'ㄧㄠˋ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄓㄠˇ ㄉㄚˋ ㄖㄣˊ') }),
      ]),
      correctAssignments: Object.freeze({ 'use-marked-route': 'safer-choice', 'wait-at-gate': 'stop-and-get-adult', 'run-between-play': 'stop-and-get-adult', 'leave-adult': 'stop-and-get-adult' }),
      hints: Object.freeze([
        playgroundHint('先看卡片裡的人在做什麼。', 'ㄒㄧㄢ ㄎㄢˋ ㄎㄚˇ ㄆㄧㄢˋ ㄌㄧˇ ㄉㄜ˙ ㄖㄣˊ ㄗㄞˋ ㄗㄨㄛˋ ㄕㄣˊ ㄇㄜ˙'),
        playgroundHint('如果前面的路或地方不安全，就先停下來找大人。', 'ㄖㄨˊ ㄍㄨㄛˇ ㄑㄧㄢˊ ㄇㄧㄢˋ ㄉㄜ˙ ㄌㄨˋ ㄏㄨㄛˋ ㄉㄧˋ ㄈㄤ ㄅㄨˋ ㄢ ㄑㄩㄢˊ ㄐㄧㄡˋ ㄒㄧㄢ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄌㄞˊ ㄓㄠˇ ㄉㄚˋ ㄖㄣˊ'),
      ]),
      incorrectFeedback: '再看一次卡片。想想這樣做安不安全，要不要先停下找大人。',
      incorrectFeedbackPronunciationTokens: reviewedPlaygroundText('再看一次卡片。想想這樣做安不安全，要不要先停下找大人。', 'ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ ㄎㄚˇ ㄆㄧㄢˋ ㄒㄧㄤˇ ㄒㄧㄤˇ ㄓㄜˋ ㄧㄤˋ ㄗㄨㄛˋ ㄢ ㄅㄨˋ ㄢ ㄑㄩㄢˊ ㄧㄠˋ ㄅㄨˋ ㄧㄠˋ ㄒㄧㄢ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄓㄠˇ ㄉㄚˋ ㄖㄣˊ'),
      correctFeedback: '你有看情況，分出可以照原來做和要停下找大人的情況。',
      correctFeedbackPronunciationTokens: reviewedPlaygroundText('你有看情況，分出可以照原來做和要停下找大人的情況。', 'ㄋㄧˇ ㄧㄡˇ ㄎㄢˋ ㄑㄧㄥˊ ㄎㄨㄤˋ ㄈㄣ ㄔㄨ ㄎㄜˇ ㄧˇ ㄓㄠˋ ㄩㄢˊ ㄌㄞˊ ㄗㄨㄛˋ ㄏㄢˋ ㄧㄠˋ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄓㄠˇ ㄉㄚˋ ㄖㄣˊ ㄉㄜ˙ ㄑㄧㄥˊ ㄎㄨㄤˋ'),
      teacherLimitationNote: playgroundTeacherLimitation,
    }),
    Object.freeze({
      stageId: 'order-response-to-blocked-route', interaction: 'assemble_response',
      prompt: '原來的路不能走。選 4 個做法，照順序排好。',
      promptPronunciationTokens: reviewedPlaygroundText('原來的路不能走。選 4 個做法，照順序排好。', 'ㄩㄢˊ ㄌㄞˊ ㄉㄜ˙ ㄌㄨˋ ㄅㄨˋ ㄋㄥˊ ㄗㄡˇ ㄒㄩㄢˇ ㄍㄜˋ ㄗㄨㄛˋ ㄈㄚˇ ㄓㄠˋ ㄕㄨㄣˋ ㄒㄩˋ ㄆㄞˊ ㄏㄠˇ'),
      studentOperationGuidance: '怎麼玩：① 看 6 張卡 → ② 選 4 個做法 → ③ 照順序排好 → ④ 檢查答案',
      studentOperationGuidancePronunciationTokens: reviewedPlaygroundText('怎麼玩：① 看 6 張卡 → ② 選 4 個做法 → ③ 照順序排好 → ④ 檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄎㄢˋ ㄓㄤ ㄎㄚˇ ㄒㄩㄢˇ ㄍㄜˋ ㄗㄨㄛˋ ㄈㄚˇ ㄓㄠˋ ㄕㄨㄣˋ ㄒㄩˋ ㄆㄞˊ ㄏㄠˇ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ'),
      studentSubmitLabel: '檢查順序',
      studentSubmitLabelPronunciationTokens: reviewedPlaygroundText('檢查順序', 'ㄐㄧㄢˇ ㄔㄚˊ ㄕㄨㄣˋ ㄒㄩˋ'),
      requiredSelectionCount: 4,
      teacherLimitationNote: playgroundTeacherLimitation,
      tokens: Object.freeze([
        playgroundToken('step-stop', '先停在安全的地方', 'ㄒㄧㄢ ㄊㄧㄥˊ ㄗㄞˋ ㄢ ㄑㄩㄢˊ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ'),
        playgroundToken('step-stay', '留在大人身旁', 'ㄌㄧㄡˊ ㄗㄞˋ ㄉㄚˋ ㄖㄣˊ ㄕㄣ ㄆㄤˊ'),
        playgroundToken('step-tell', '告訴大人前面的路不能走', 'ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ ㄑㄧㄢˊ ㄇㄧㄢˋ ㄉㄜ˙ ㄌㄨˋ ㄅㄨˋ ㄋㄥˊ ㄗㄡˇ'),
        playgroundToken('step-follow', '跟著大人走安全的路', 'ㄍㄣ ㄓㄜ˙ ㄉㄚˋ ㄖㄣˊ ㄗㄡˇ ㄢ ㄑㄩㄢˊ ㄉㄜ˙ ㄌㄨˋ'),
        playgroundToken('step-run', '自己跑去找路', 'ㄗˋ ㄐㄧˇ ㄆㄠˇ ㄑㄩˋ ㄓㄠˇ ㄌㄨˋ'),
        playgroundToken('step-hide', '躲起來，不告訴大人', 'ㄉㄨㄛˇ ㄑㄧˇ ㄌㄞˊ ㄅㄨˋ ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ'),
      ]),
      correctOptionIds: Object.freeze(['step-stop', 'step-stay', 'step-tell', 'step-follow']),
      hints: Object.freeze([
        playgroundHint('先停下來。', 'ㄒㄧㄢ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄌㄞˊ'),
        playgroundHint('不要自己找路，要讓大人知道。', 'ㄅㄨˋ ㄧㄠˋ ㄗˋ ㄐㄧˇ ㄓㄠˇ ㄌㄨˋ ㄧㄠˋ ㄖㄤˋ ㄉㄚˋ ㄖㄣˊ ㄓ ㄉㄠˋ'),
      ]),
      incorrectFeedback: '再看每張卡。先停下來，告訴大人，不要自己找路。',
      incorrectFeedbackPronunciationTokens: reviewedPlaygroundText('再看每張卡。先停下來，告訴大人，不要自己找路。', 'ㄗㄞˋ ㄎㄢˋ ㄇㄟˇ ㄓㄤ ㄎㄚˇ ㄒㄧㄢ ㄊㄧㄥˊ ㄒㄧㄚˋ ㄌㄞˊ ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ ㄅㄨˋ ㄧㄠˋ ㄗˋ ㄐㄧˇ ㄓㄠˇ ㄌㄨˋ'),
      correctFeedback: '你選好四個步驟，也排對順序了。',
      correctFeedbackPronunciationTokens: reviewedPlaygroundText('你選好四個步驟，也排對順序了。', 'ㄋㄧˇ ㄒㄩㄢˇ ㄏㄠˇ ㄙˋ ㄍㄜˋ ㄅㄨˋ ㄗㄡˋ ㄧㄝˇ ㄆㄞˊ ㄉㄨㄟˋ ㄕㄨㄣˋ ㄒㄩˋ ㄌㄜ˙'),
    }),
    Object.freeze({
      stageId: 'transfer-to-unfamiliar-playground-scene', interaction: 'choose_response',
      prompt: '地上很滑，同伴叫你走過去。怎麼做比較安全？',
      promptPronunciationTokens: reviewedPlaygroundText('地上很滑，同伴叫你走過去。怎麼做比較安全？', 'ㄉㄧˋ ㄕㄤˋ ㄏㄣˇ ㄏㄨㄚˊ ㄊㄨㄥˊ ㄅㄢˋ ㄐㄧㄠˋ ㄋㄧˇ ㄗㄡˇ ㄍㄨㄛˋ ㄑㄩˋ ㄗㄣˇ ㄇㄜ˙ ㄗㄨㄛˋ ㄅㄧˇ ㄐㄧㄠˋ ㄢ ㄑㄩㄢˊ'),
      teacherLimitationNote: playgroundTeacherLimitation,
      options: Object.freeze([
        playgroundOption('transfer-stop-tell', '先不要走過去，停在安全的地方告訴大人。', 'ㄒㄧㄢ ㄅㄨˋ ㄧㄠˋ ㄗㄡˇ ㄍㄨㄛˋ ㄑㄩˋ ㄊㄧㄥˊ ㄗㄞˋ ㄢ ㄑㄩㄢˊ ㄉㄜ˙ ㄉㄧˋ ㄈㄤ ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ', '你先避開危險，也記得告訴大人。', 'ㄋㄧˇ ㄒㄧㄢ ㄅㄧˋ ㄎㄞ ㄨㄟˊ ㄒㄧㄢˇ ㄧㄝˇ ㄐㄧˋ ㄉㄜ˙ ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ'),
        playgroundOption('transfer-run', '跑快一點穿過去。', 'ㄆㄠˇ ㄎㄨㄞˋ ㄧˋ ㄉㄧㄢˇ ㄔㄨㄢ ㄍㄨㄛˋ ㄑㄩˋ', '地上很滑，跑過去容易跌倒。', 'ㄉㄧˋ ㄕㄤˋ ㄏㄣˇ ㄏㄨㄚˊ ㄆㄠˇ ㄍㄨㄛˋ ㄑㄩˋ ㄖㄨㄥˊ ㄧˋ ㄉㄧㄝˊ ㄉㄠˇ'),
        playgroundOption('transfer-copy', '不看路，跟著同伴走。', 'ㄅㄨˋ ㄎㄢˋ ㄌㄨˋ ㄍㄣ ㄓㄜ˙ ㄊㄨㄥˊ ㄅㄢˋ ㄗㄡˇ', '同伴怎麼做，也要先看地上安不安全。', 'ㄊㄨㄥˊ ㄅㄢˋ ㄗㄣˇ ㄇㄜ˙ ㄗㄨㄛˋ ㄧㄝˇ ㄧㄠˋ ㄒㄧㄢ ㄎㄢˋ ㄉㄧˋ ㄕㄤˋ ㄢ ㄅㄨˋ ㄢ ㄑㄩㄢˊ'),
      ]),
      correctOptionIds: Object.freeze(['transfer-stop-tell']),
      hints: Object.freeze([
        playgroundHint('先看看地上有什麼。', 'ㄒㄧㄢ ㄎㄢˋ ㄎㄢˋ ㄉㄧˋ ㄕㄤˋ ㄧㄡˇ ㄕㄣˊ ㄇㄜ˙'),
        playgroundHint('遇到危險時，不要急著跟著別人做。', 'ㄩˋ ㄉㄠˋ ㄨㄟˊ ㄒㄧㄢˇ ㄕˊ ㄅㄨˋ ㄧㄠˋ ㄐㄧˊ ㄓㄜ˙ ㄍㄣ ㄓㄜ˙ ㄅㄧㄝˊ ㄖㄣˊ ㄗㄨㄛˋ'),
      ]),
      incorrectFeedback: '再看看地面。地上很滑時，想想怎麼做才安全。',
      incorrectFeedbackPronunciationTokens: reviewedPlaygroundText('再看看地面。地上很滑時，想想怎麼做才安全。', 'ㄗㄞˋ ㄎㄢˋ ㄎㄢˋ ㄉㄧˋ ㄇㄧㄢˋ ㄉㄧˋ ㄕㄤˋ ㄏㄣˇ ㄏㄨㄚˊ ㄕˊ ㄒㄧㄤˇ ㄒㄧㄤˇ ㄗㄣˇ ㄇㄜ˙ ㄗㄨㄛˋ ㄘㄞˊ ㄢ ㄑㄩㄢˊ'),
      correctFeedback: '你有先避開危險，也知道要告訴大人。',
      correctFeedbackPronunciationTokens: reviewedPlaygroundText('你有先避開危險，也知道要告訴大人。', 'ㄋㄧˇ ㄧㄡˇ ㄒㄧㄢ ㄅㄧˋ ㄎㄞ ㄨㄟˊ ㄒㄧㄢˇ ㄧㄝˇ ㄓ ㄉㄠˋ ㄧㄠˋ ㄍㄠˋ ㄙㄨˋ ㄉㄚˋ ㄖㄣˊ'),
    }),
  ]),
  ...noReinforcement, evidencePolicy, teacherReview: notReviewed,
  openQuestions: Object.freeze(['需由教師依學生理解確認「約定路線、陪同成人、集合處」等詞語是否合適。', '情境與求助方式需由學校依所在地實際安全規範調整；本任務不是當地交通路線指引。', '不評量實地移動、身體技能或真實情境中的安全行為。']),
});

export const EARLY_GRADE_CURRICULUM_GAP_TASKS = Object.freeze([
  GRADE1_SHAPE_COPY_STUDIO,
  GRADE2_TWO_STEP_MARKET_QUEST,
  GRADE2_MONEY_COMBINATION_MARKET,
  GRADE2_LIVING_RULES_REASON_QUEST,
  GRADE1_PLAYGROUND_SAFETY_ROUTE,
]);
