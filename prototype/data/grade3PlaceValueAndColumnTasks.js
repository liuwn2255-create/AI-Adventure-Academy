const freeze = (value) => Object.freeze(value);

const candidate = (task) => freeze({
  ...task,
  gradeId: 'grade-3',
  subjectId: 'mathematics',
  sourceId: 'mathematics',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  runtimeModule: 'prototype/data/grade3PlaceValueAndColumnTasks.js',
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: freeze(task.openQuestions ?? []),
  stages: freeze(task.stages.map((stage) => freeze({
    ...stage,
    hints: freeze(stage.hints),
    ...(stage.placeValueRules ? { placeValueRules: freeze({
      ...stage.placeValueRules,
      initialCounts: freeze({ ...stage.placeValueRules.initialCounts }),
      targetCounts: freeze({ ...stage.placeValueRules.targetCounts }),
      maxCounts: freeze({ ...stage.placeValueRules.maxCounts }),
      allowedExchanges: freeze(stage.placeValueRules.allowedExchanges.map(freeze)),
    }) } : {}),
    ...(stage.calculationSteps ? { calculationSteps: freeze(stage.calculationSteps.map(freeze)) } : {}),
    ...(stage.verticalLayout ? { verticalLayout: freeze({
      ...stage.verticalLayout,
      columns: freeze(stage.verticalLayout.columns.map(freeze)),
    }) } : {}),
  }))),
});

const baseEvidencePolicy = '只記錄本次記憶體操作，不寫入正式學生資料、成績、精熟度或解鎖狀態。';

export const GRADE3_PLACE_VALUE_EXCHANGE_WORKSHOP = candidate({
  activityId: 'ACT-G3-MATH-PLACE-VALUE-EXCHANGE-CANDIDATE',
  title: '位值積木交換工坊：組數、換位與驗值',
  curriculumMapId: 'math-number-place-value-m3-num-01',
  curriculumCodes: ['N-3-1', 'n-II-1'],
  curriculumAlignment: 'partial',
  curriculumScope: '官方 N-3-1 要求一萬以內數、位值積木操作、點數、位值表徵與位值表，包含「千」及位值單位換算；官方備註不得教到超過一萬。本關以數位積木練習組數表示與千／百／十／個等值交換；不代表實體積木操作或完整一萬以內數的教學。n-II-1 是第二學習階段表現，不推定三年級學期。',
  learningSubitemClaims: ['SUB-MATH-G3-N3-1-PLACE-VALUE-BLOCK-EXCHANGE'],
  coverage: {
    subitemId: 'SUB-MATH-G3-N3-1-PLACE-VALUE-BLOCK-EXCHANGE',
    coveredByInteraction: ['build_place_value_blocks', 'adjust_place_value_block', 'exchange_place_value_block'],
    notCovered: ['實際點數與搬動實體積木', '完整一萬以內數的口頭／書寫讀寫與所有位值變化', '教師觀察下的學習表現評量'],
  },
  learningObjective: { objectiveId: 'LO-G3-MATH-PLACE-VALUE-EXCHANGE-01', statement: '以千、百、十、個的數位積木組成數，並操作高位值換成十個低位值，檢查總值保持不變。', status: 'candidate_pending_teacher_review' },
  instructions: '在每個位值欄增加積木，組成指定數；接著真的操作「一個高位值換十個相鄰低位值」，比較交換前後的總值。畫面是數位模型，不是實體積木教具。',
  completionReward: '位值交換候選徽章',
  stages: [
    {
      stageId: 'compose-2408-with-place-value-blocks', interaction: 'build_place_value_blocks', prompt: '為石碑設定 2,408：操作千、百、十、個積木，讓位值表與指定數相同。',
      placeValueRules: { targetValue: 2408, initialCounts: { thousands: 0, hundreds: 0, tens: 0, ones: 0 }, targetCounts: { thousands: 2, hundreds: 4, tens: 0, ones: 8 }, maxCounts: { thousands: 9, hundreds: 9, tens: 9, ones: 9 }, allowedExchanges: [], requiredExchangeCount: 0 },
      hints: ['從千位開始看每種積木代表多少：一個千是 1,000，一個百是 100。', '2,408 的四欄積木數依序是 2、4、0、8；按「檢查位值」會逐欄檢查。'],
      incorrectFeedback: '逐欄比對千、百、十、個的積木數；十位是 0 也要保留位置。',
      correctFeedback: `位值表組成 2,408，${baseEvidencePolicy}`,
    },
    {
      stageId: 'exchange-one-hundred-for-ten-tens', interaction: 'build_place_value_blocks', prompt: '補給箱仍是 2,430。把一個百積木換成十個十積木，確認總數不變。',
      placeValueRules: { targetValue: 2430, initialCounts: { thousands: 2, hundreds: 4, tens: 3, ones: 0 }, targetCounts: { thousands: 2, hundreds: 3, tens: 13, ones: 0 }, maxCounts: { thousands: 9, hundreds: 9, tens: 19, ones: 9 }, allowedExchanges: [{ from: 'hundreds', to: 'tens' }], requiredExchangeCount: 1 },
      hints: ['交換前先算總值：2 個千、4 個百、3 個十是 2,430。', '按「1 個百 → 10 個十」；百位少 1、十位多 10，總值要仍是 2,430。'],
      incorrectFeedback: '檢查是否真的交換了一個百，而不是只改了十位數量；交換前後的位值總和必須相等。',
      correctFeedback: '你把 1 個百換成 10 個十，表示仍是 2,430；高位減一、相鄰低位增加十。',
    },
    {
      stageId: 'exchange-one-thousand-for-ten-hundreds', interaction: 'build_place_value_blocks', prompt: '研究隊要用另一種方式表示 1,246：把一個千換成十個百，並保留其他積木。',
      placeValueRules: { targetValue: 1246, initialCounts: { thousands: 1, hundreds: 2, tens: 4, ones: 6 }, targetCounts: { thousands: 0, hundreds: 12, tens: 4, ones: 6 }, maxCounts: { thousands: 9, hundreds: 19, tens: 9, ones: 9 }, allowedExchanges: [{ from: 'thousands', to: 'hundreds' }], requiredExchangeCount: 1 },
      hints: ['一個千等於幾個百？交換只影響千位和百位。', '千位從 1 變 0，百位從 2 增加 10 成為 12；十位、個位不變。'],
      incorrectFeedback: '這次只允許千換百。檢查千位減少 1、百位增加 10，並確認四欄合起來仍是 1,246。',
      correctFeedback: '交換後是 0 個千、12 個百、4 個十、6 個一；總值仍是 1,246。',
    },
  ],
  openQuestions: ['需教師確認實體積木操作與口頭讀數等課堂證據；數位操作不能替代實物教具。'],
});

const verticalStage = ({ stageId, prompt, topNumber, bottomNumber, operator, calculationSteps, hints, incorrectFeedback, correctFeedback, regroupingNote }) => ({
  stageId,
  interaction: 'operate_vertical_calculation',
  prompt,
  verticalLayout: {
    topNumber,
    bottomNumber,
    operator,
    columns: ['thousands', 'hundreds', 'tens', 'ones'].map((place, index) => ({
      place,
      label: ['千位', '百位', '十位', '個位'][index],
      topDigit: String(topNumber)[index],
      bottomDigit: String(bottomNumber)[index],
      digitStepId: `${place}-digit`,
    })),
  },
  calculationSteps,
  regroupingNote,
  hints,
  incorrectFeedback,
  correctFeedback,
});

const digitStep = (id, placeLabel, expectedValue, incorrectFeedback) => ({ id, kind: 'digit', placeLabel, label: `${placeLabel}：寫下結果的數字`, initialValue: 0, minValue: 0, maxValue: 9, expectedValue, incorrectFeedback });
const transferStep = (id, kind, placeLabel, expectedValue, label, incorrectFeedback) => ({ id, kind, placeLabel, label, initialValue: 0, minValue: 0, maxValue: 1, expectedValue, incorrectFeedback });

export const GRADE3_VERTICAL_CALCULATION_WORKSHOP = candidate({
  activityId: 'ACT-G3-MATH-VERTICAL-REGROUPING-CANDIDATE',
  title: '直式進退位修復站：逐欄算、逐欄換',
  curriculumMapId: 'math-grade3-n-3-2-add-sub',
  curriculumCodes: ['N-3-2', 'n-II-2'],
  curriculumAlignment: 'partial',
  curriculumScope: '官方 N-3-2 明列加減直式及多次進位、退位；備註要求處理數字中有 0，並可先以位值表學習。本關練習三組四位數直式，包含多次進位、含 0 加法與跨 0 退位；是數位步驟練習，非完整範圍教學或正式評量。n-II-2 為第二學習階段表現，不等於指定三年級學期。',
  learningSubitemClaims: ['SUB-MATH-G3-N3-2-VERTICAL-REGROUPING-STEPS'],
  coverage: {
    subitemId: 'SUB-MATH-G3-N3-2-VERTICAL-REGROUPING-STEPS',
    coveredByInteraction: ['operate_vertical_calculation', 'adjust_vertical_calculation_step'],
    notCovered: ['實體位值表或積木操作', '其他位數與不同年級情境的完整遷移', 'n-II-2 所列其他運算、估算及生活解題範圍'],
  },
  learningObjective: { objectiveId: 'LO-G3-MATH-VERTICAL-REGROUPING-01', statement: '逐欄調整直式的結果數字與進位／退位紀錄，檢查多次進退位及含 0 題型。', status: 'candidate_pending_teacher_review' },
  instructions: '每一欄都要操作「寫下的數字」與「進位／退位步驟」。先從個位逐步處理；錯誤會指出需要回查的步驟。數字只作原創候選練習，不是教材題目。',
  completionReward: '直式修復候選徽章',
  stages: [
    verticalStage({
      stageId: 'repair-multiple-carry-addition', prompt: '修復補給帳：2,468 + 1,756。從個位往左，逐欄設定答案數字與進位記錄。', topNumber: 2468, bottomNumber: 1756, operator: '+',
      calculationSteps: [
        digitStep('ones-digit', '個位', 4, '個位 8+6=14，個位寫 4。'), transferStep('ones-carry', 'carry', '個位→十位', 1, '個位的 14 個一，寫 4 並進 1 個十。', '14 個一要留下 4 個一，並向十位進 1。'),
        digitStep('tens-digit', '十位', 2, '十位計算 6+5+1 個進位=12，十位寫 2。'), transferStep('tens-carry', 'carry', '十位→百位', 1, '十位的 12 個十，寫 2 並進 1 個百。', '12 個十需留下 2 個十，向百位進 1。'),
        digitStep('hundreds-digit', '百位', 2, '百位計算 4+7+1 個進位=12，百位寫 2。'), transferStep('hundreds-carry', 'carry', '百位→千位', 1, '百位的 12 個百，寫 2 並進 1 個千。', '12 個百需留下 2 個百，向千位進 1。'),
        digitStep('thousands-digit', '千位', 4, '千位 2+1+1 個進位=4。'),
      ],
      regroupingNote: '進位的意思是把 10 個目前位值單位換成 1 個左邊的較大位值單位。',
      hints: ['直式先對齊個、十、百、千位，從個位開始；每一欄還要帶入右邊進來的數。', '個位 8+6=14，寫 4 進 1；依同一方法檢查十位、百位，再算千位。'],
      incorrectFeedback: '比對最先出錯的欄位：先核對該欄相加，再確認是否把十個低位單位換成一個高位單位。',
      correctFeedback: '逐欄結果為 4、2、2、4，三次進位都有帶到左側欄位；答案是 4,224。',
    }),
    verticalStage({
      stageId: 'repair-addition-with-zero', prompt: '修復星砂帳：3,086 + 1,759。百位有 0，仍須留在百位欄。', topNumber: 3086, bottomNumber: 1759, operator: '+',
      calculationSteps: [
        digitStep('ones-digit', '個位', 5, '個位 6+9=15，個位寫 5。'), transferStep('ones-carry', 'carry', '個位→十位', 1, '個位的 15 個一，寫 5 並進 1 個十。', '15 個一要寫 5，向十位進 1。'),
        digitStep('tens-digit', '十位', 4, '十位計算 8+5+1=14，十位寫 4。'), transferStep('tens-carry', 'carry', '十位→百位', 1, '十位的 14 個十，寫 4 並進 1 個百。', '14 個十要寫 4，向百位進 1。'),
        digitStep('hundreds-digit', '百位', 8, '百位計算 0+7+1=8；0 仍佔百位。'), transferStep('hundreds-carry', 'carry', '百位→千位', 0, '百位結果 8，沒有再進位。', '百位 0+7+1=8，未滿十，不進位。'),
        digitStep('thousands-digit', '千位', 4, '千位 3+1+0=4。'),
      ],
      regroupingNote: '0 代表該位沒有單位，但這一欄仍保留位置；不可把後面的位數移欄。',
      hints: ['確認百位的 0 仍在百位欄；直式位置不能因為 0 而移動。', '由個位起：6+9=15，寫 5 進 1；下一欄把 1 加入 8+5。'],
      incorrectFeedback: '檢查 0 所在的欄位及前一欄的進位；錯誤若在百位，先算 0+7+1。',
      correctFeedback: '含 0 的數仍按欄位計算，逐欄寫出 5、4、8、4，結果為 4,845。',
    }),
    verticalStage({
      stageId: 'repair-subtraction-across-zero', prompt: '修復光點帳：5,002 − 1,768。個位不足減，需跨過兩個 0 作連續退位。', topNumber: 5002, bottomNumber: 1768, operator: '−',
      calculationSteps: [
        transferStep('thousands-to-hundreds', 'borrow', '千位→百位', 1, '先把 1 個千換成 10 個百。', '千位需減少 1 個千，才能提供百位單位。'),
        transferStep('hundreds-to-tens', 'borrow', '百位→十位', 1, '把 10 個百中的 1 個百換成 10 個十；百位留下 9。', '由 10 個百借出 1 個百後，百位剩 9，十位有 10 個十。'),
        transferStep('tens-to-ones', 'borrow', '十位→個位', 1, '把 10 個十中的 1 個十換成 10 個一；十位留下 9。', '十位借出 1 個十後，十位剩 9，個位成為 12 個一。'),
        digitStep('ones-digit', '個位', 4, '個位借後 12−8=4。'), digitStep('tens-digit', '十位', 3, '十位借後 9−6=3。'),
        digitStep('hundreds-digit', '百位', 2, '百位留下 9 個百，9−7=2。'), digitStep('thousands-digit', '千位', 3, '千位借出後剩 4，4−1=3。'),
      ],
      regroupingNote: '連續退位過程：5 個千→4 個千與 10 個百；百位借出後剩 9 個百、形成 10 個十；十位借出後剩 9 個十、形成 12 個一。',
      hints: ['個位 2 不夠減 8；十位是 0，必須往左找到可借的位值，沿途記錄每次交換。', '5 個千先變成 4 個千和 10 個百；再依序借給十位、個位，最後各欄是 12−8、9−6、9−7、4−1。'],
      incorrectFeedback: '退位錯誤會影響相鄰兩欄。回看千→百、百→十、十→個的交換順序，再逐欄修正。',
      correctFeedback: '你完成跨 0 的連續退位，逐欄得到 4、3、2、3，結果是 3,234。',
    }),
  ],
  openQuestions: ['數位操作可呈現每位數字和進退位記錄，但不能替代實體位值積木教學；年級進度由教師確認。'],
});

export const GRADE3_PLACE_VALUE_AND_COLUMN_TASKS = freeze([
  GRADE3_PLACE_VALUE_EXCHANGE_WORKSHOP,
  GRADE3_VERTICAL_CALCULATION_WORKSHOP,
]);
