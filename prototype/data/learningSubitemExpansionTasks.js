const candidate = 'candidate_pending_teacher_review';
const noReinforcement = Object.freeze({ reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動' });
const evidencePolicy = Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false });
const review = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });

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
    title: '數字小工坊：0 的位置線索', gradeId: 'grade-1', subjectId: 'mathematics',
    curriculumMapId: 'math-grade1-count-place-value', curriculumCodes: ['N-1-1', 'n-I-1'],
    learningSubitemClaims: ['SUB-MATH-G1-N1-1-ZERO-PLACEHOLDER'],
    curriculumScope: '對照官方一年級學習內容 N-1-1 的位值單位「個」「十」與 0 的位值意義；僅作兩位數個位為0的有限候選練習，不代表完整涵蓋一百以內數。教材與課程順序待教師確認。',
    learningObjective: { objectiveId: 'LO-G1-MATH-ZERO-PLACEHOLDER-01', statement: '比較數字卡上的位值表示，理解個位寫0表示該數沒有個位單位。', status: candidate },
    instructions: '先把數字卡依個位是否有「個」分類，再比較兩個數字卡的十與個。這是畫面上的符號操作，沒有實體積木。',
    stages: Object.freeze([
      Object.freeze({ stageId: 'sort-zero-ones-cards', interaction: 'classify_observations', prompt: '依卡片表示，把個位是0的數字放在「沒有個位單位」一類，其餘放在另一類。', observations: Object.freeze([
        { id: 'n10', text: '10：1個十，0個一' }, { id: 'n12', text: '12：1個十，2個一' }, { id: 'n20', text: '20：2個十，0個一' }, { id: 'n21', text: '21：2個十，1個一' },
      ]), categories: Object.freeze([{ id: 'no-ones', label: '個位沒有個' }, { id: 'has-ones', label: '個位有個' }]), correctAssignments: Object.freeze({ n10: 'no-ones', n12: 'has-ones', n20: 'no-ones', n21: 'has-ones' }),
      hints: Object.freeze(['看每張卡「個」前面的數字，不要只看十位。', '個位寫0時，表示個位單位有幾個？逐張找出個位為0的卡。']), incorrectFeedback: '請逐張讀「幾個十、幾個一」；分類要看個位單位，不是數字大小。', correctFeedback: '你依個位單位的數量完成分類。再想想20和2代表的十與個有什麼不同。' }),
      Object.freeze({ stageId: 'explain-twenty-versus-two', interaction: 'choose_response', prompt: '20 和 2 的十位與個位表示不同。哪句話最符合數字卡？', options: Object.freeze([
        { id: 'two-tens', text: '20 有2個十、0個一；2 有0個十、2個一。', feedback: '把十位和個位分開讀，才能看出兩個數的數量不同。' },
        { id: 'same-number', text: '20 和2一樣，因為都有數字2。', feedback: '同一個數字寫在不同位置，代表的數量可能不同。' },
        { id: 'zero-adds-one', text: '0表示再加一個一。', feedback: '個位的0不是多一個；它記錄個位沒有個。' },
      ]), correctOptionIds: Object.freeze(['two-tens']), hints: Object.freeze(['先說出20有幾個十，再看個位。', '再把2讀成幾個十和幾個一，逐位比較。']), incorrectFeedback: '請分開讀十位和個位；數字相同不代表位置與數量相同。', correctFeedback: '你用位值說明了兩個數的差別。這次選擇題不足以證明能自行解釋其他數字。' }),
    ]),
    openQuestions: Object.freeze(['需教師確認學生是否已使用「個」「十」作位值單位。', '分類和選擇只觀察有限符號判讀，不替代實體積木操作或學生自行說明。']),
  }),
  makeTask({
    activityId: 'ACT-G1-MATH-COMPARISON-DIFFERENCE-NUMBER-LINE-CANDIDATE',
    title: '小小數線探險：找出相差幾個', gradeId: 'grade-1', subjectId: 'mathematics',
    curriculumMapId: 'math-grade1-add-sub-meaning', curriculumCodes: ['N-1-2', 'R-1-1', 'n-I-2'],
    learningSubitemClaims: ['SUB-MATH-G1-N1-2-COMPARISON-DIFFERENCE'],
    curriculumScope: '只對照 N-1-2 的比較型差量情境。本活動詢問8張比5張多幾張，未知的是比較結果（差量），不設未知加數、被加數、減數或被減數題型；亦不涵蓋全部比較情境或自主列式。',
    learningObjective: { objectiveId: 'LO-G1-MATH-COMPARISON-DIFFERENCE-01', statement: '在數線上操作兩個數量的差，並把差量連回比較型算式。', status: candidate },
    instructions: '情境：小米有8張貼紙，小安有5張。先在數線上找出兩人的數量差，再選出能記錄比較關係的算式。',
    stages: Object.freeze([
      Object.freeze({ stageId: 'place-sticker-difference', interaction: 'place_number_line_marker', prompt: '把標記放到代表「8張比5張多幾張」的差量位置。數線每格是1。', numberLine: Object.freeze({ start: 0, end: 10, tickCount: 10, targetTick: 3, valueFormat: 'integer' }), hints: Object.freeze(['數線上的差可以從較少的數走到較多的數。', '從5開始往右數到8，每走一格代表多1張；記錄走了幾格。']), incorrectFeedback: '請從較少的5開始往8走，數經過的格數；不要把8張當成差量。', correctFeedback: '你在數線上找到兩個數量之間的差。接著選出比較關係的算式。' }),
      Object.freeze({ stageId: 'choose-comparison-equation', interaction: 'choose_response', prompt: '哪個算式記錄「8張比5張多幾張」？', options: Object.freeze([
        { id: 'difference-8-5', text: '8 − 5 = 3', feedback: '比較差量可從較多的數量中減去較少的數量。' },
        { id: 'sum-8-5', text: '8 + 5 = 13', feedback: '題目問兩人的貼紙合起來，不是問兩者相差多少。' },
        { id: 'reverse-5-8', text: '5 − 8 = 3', feedback: '依目前情境，從較多的8張扣掉較少的5張。' },
      ]), correctOptionIds: Object.freeze(['difference-8-5']), hints: Object.freeze(['問題中的「多幾張」是在問兩個數量的差。', '對照你在數線上量到的格數，選能得到同一差量的算式。']), incorrectFeedback: '先分清楚「合起來」與「相差」；再用數線上的差檢查算式。', correctFeedback: '算式和數線上的差一致。單一情境不能代表已掌握各種比較型或未知量問題。' }),
    ]),
    openQuestions: Object.freeze(['需教師確認「相差」語句與數線操作的先備是否適合目標班級。', '官方 N-1-2 附註排除一年級未知加數、被加數、減數、被減數題型；本活動只問比較差量。數線為畫面模擬，且第二階段為選擇題；未測量學生自行列式或口頭解釋。']),
  }),
  makeTask({
    activityId: 'ACT-G2-MATH-ZERO-TENS-ADDITION-CANDIDATE',
    title: '位值修理站：加法裡的0十', gradeId: 'grade-2', subjectId: 'mathematics',
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
    title: '進位接力：兩次整理位值', gradeId: 'grade-2', subjectId: 'mathematics',
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
