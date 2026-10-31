const freeze = (value) => Object.freeze(value);

const candidate = (task) => freeze({
  ...task,
  gradeId: 'grade-5',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  completionReward: '五年級探險紀念章',
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: freeze(task.openQuestions ?? []),
  stages: freeze(task.stages.map(freeze)),
});

export const GRADE5_FACTOR_ARRAY_EXPLORER = candidate({
  activityId: 'ACT-G5-MATH-FACTOR-ARRAY-EXPLORER-CANDIDATE', subjectId: 'mathematics',
  title: '因數陣列探險隊', curriculumMapId: 'math-grade5-factors-multiples', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-5-3', 'n-III-3']),
  curriculumScope: '部分對應：以 12 的矩形陣列與因數卡認識因數／倍數概念；未涵蓋公因數、公倍數、最大公因數、最小公倍數的完整概念，也不使用短除法。N-5-3 為五年級學習內容；n-III-3 為第三學習階段表現，不表示特定學期。',
  learningObjective: freeze({ objectiveId: 'LO-G5-MATH-FACTOR-ARRAY-CANDIDATE-01', statement: '用等列等行的陣列表示乘積，並依乘法關係辨認一個數的因數。', status: 'candidate_pending_teacher_review' }),
  instructions: '在倉庫把物資排成整齊的長方陣列，再整理哪些數可以整齊分成相同大小的組。所有操作是候選練習，不是正式評量。',
  openQuestions: ['需教師確認學生已具備乘法陣列與整除的先備能力。', '教材版本、冊次、頁碼及班級授課進度未提供。', '只涵蓋一個小數例，不代表完整因數與倍數能力。'],
  stages: [
    { stageId: 'build-twelve-array', interaction: 'build_array', prompt: '把 12 個補給包排成 3 排，觀察每排有幾個。', hints: ['陣列的每一排要一樣多，排數和每排數量相乘會得到總數。', '先把排數調成 3，再調整每排數量，讓點數總和等於 12。'], arrayRules: { targetRows: 3, targetColumns: 4, maxRows: 6, maxColumns: 6 }, incorrectFeedback: '再核對「排數 × 每排數量」是否等於全部物件數；排成陣列的總數不能改變。', correctFeedback: '三排、每排四個合成 12 個；這只呈現一種陣列表示。' },
    { stageId: 'sort-twelve-factors', interaction: 'classify_observations', prompt: '把數字卡分成「可以把 12 平均分成這麼多組」和「不能平均分」兩類。', hints: ['試想 12 個物品能否分成每組相同數量，且不剩下。', '因數要能整除 12；逐張檢查是否會剩下物品。'], observations: [{ id: 'factor-1', text: '1 組' }, { id: 'factor-2', text: '2 組' }, { id: 'factor-3', text: '3 組' }, { id: 'factor-4', text: '4 組' }, { id: 'not-factor-5', text: '5 組' }, { id: 'factor-6', text: '6 組' }], categories: [{ id: 'factor', label: '可平均分組' }, { id: 'not-factor', label: '會剩下物品' }], correctAssignments: { 'factor-1': 'factor', 'factor-2': 'factor', 'factor-3': 'factor', 'factor-4': 'factor', 'not-factor-5': 'not-factor', 'factor-6': 'factor' }, incorrectFeedback: '把 12 個物品實際想成相同組數；只有每組一樣且沒有剩下，才符合這題的分類條件。', correctFeedback: '分類依據是整除關係；尚未檢查公因數或公倍數。' },
  ],
});

export const GRADE5_MULTI_STEP_SUPPLY_PLANNER = candidate({
  activityId: 'ACT-G5-MATH-MULTI-STEP-SUPPLY-PLANNER-CANDIDATE', subjectId: 'mathematics',
  title: '補給站多步規劃師', curriculumMapId: 'math-grade5-multistep-applications', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-5-2', 'n-III-2']),
  curriculumScope: '部分對應：以兩批不同包裝數量合併並扣除使用量的多步情境，學生需按步驟計算及排列策略；未涵蓋 N-5-2 各類型，亦未涵蓋課綱備註所述分配律情境。',
  learningObjective: freeze({ objectiveId: 'LO-G5-MATH-MULTI-STEP-SUPPLY-CANDIDATE-01', statement: '從情境辨識先合併的兩批數量，再扣除已使用量，保留中間結果完成多步計算。', status: 'candidate_pending_teacher_review' }),
  instructions: '為探險隊規劃補給：計算兩種箱裝材料的總數，再扣除已用掉的材料。每個步驟都要保留中間結果。',
  openQuestions: ['需教師確認多步驟列式與整數乘加減先備。', '此活動要求策略排列與計算結果，不能單憑選項作答證明學生能獨立併式。', '教材版本、冊次、頁碼及班級授課進度未提供。'],
  stages: [
    { stageId: 'calculate-supply-total', interaction: 'complete_calculation_steps', calculationTitle: '兩批補給合併後扣除使用量', prompt: '基地收到 4 箱、每箱 18 個種植杯，以及 3 箱、每箱 12 個種植杯；任務先用掉 20 個。依序完成各步驟。', hints: ['先分別計算兩種箱裝物品，再合併兩批，最後扣除用掉的數量。', '依序計算 18×4、12×3，將兩個結果相加，再減去 20。'], calculationSteps: [{ id: 'first-batch', label: '第一批：18 × 4', expectedValue: 72, choices: [{ value: 72, label: '72' }, { value: 22, label: '22' }, { value: 712, label: '712' }], incorrectFeedback: '第一批有 4 箱，每箱 18 個；確認是相同數量的 4 組。' }, { id: 'second-batch', label: '第二批：12 × 3', expectedValue: 36, choices: [{ value: 36, label: '36' }, { value: 15, label: '15' }, { value: 312, label: '312' }], incorrectFeedback: '第二批有 3 箱，每箱 12 個；先獨立算出這一批。' }, { id: 'combined', label: '兩批合併：72 + 36', expectedValue: 108, choices: [{ value: 108, label: '108' }, { value: 72, label: '72' }, { value: 98, label: '98' }], incorrectFeedback: '此步要合併兩批，不能漏掉其中一批。' }, { id: 'remaining', label: '扣除已用：108 − 20', expectedValue: 88, choices: [{ value: 88, label: '88' }, { value: 128, label: '128' }, { value: 108, label: '108' }], incorrectFeedback: '剩餘數量應比合併後的總數少；用減法檢查已用掉的 20 個。' }], incorrectFeedback: '依錯誤步驟提示重新檢查批次、合併與扣除的順序；答對各算式不等於能自行解釋併式理由。', correctFeedback: '依情境先算兩批、合併再扣除，結果為 88 個；本題只檢查這個情境。' },
    { stageId: 'order-planning-steps', interaction: 'order_items', prompt: '把補給計畫的步驟卡排成符合情境的順序。', hints: ['先分別算每種箱裝物品，再合併，最後才扣除已使用量。', '不能先扣除未合併的總數；使用量要從兩批合計中扣掉。'], items: [{ id: 'multiply-a', text: '計算第一批：18 × 4' }, { id: 'multiply-b', text: '計算第二批：12 × 3' }, { id: 'add-batches', text: '合併兩批數量' }, { id: 'subtract-used', text: '扣除已使用的 20 個' }], initialOrder: ['subtract-used', 'multiply-a', 'add-batches', 'multiply-b'], correctItemIds: ['multiply-a', 'multiply-b', 'add-batches', 'subtract-used'], incorrectFeedback: '先取得兩批各自的數量，才有總數可合併與扣除。', correctFeedback: '步驟順序和情境關係一致；仍需教師觀察學生能否在無步驟卡情況下規劃。' },
  ],
});

export const GRADE5_CHINESE_FACT_OPINION_ARCHIVE = candidate({
  activityId: 'ACT-G5-CHINESE-FACT-OPINION-ARCHIVE-CANDIDATE', subjectId: 'chinese-language',
  title: '文本證據檔案室', curriculumMapId: 'chinese-grade5-fact-opinion-reading', sourceId: 'chinese-language',
  curriculumCodes: freeze(['5-Ⅲ-4']),
  curriculumScope: '部分對應：分類原創短文中可由文本查證的敘述與主觀判斷，對照第三學習階段 5-Ⅲ-4；未涵蓋各類文本閱讀、來源查核或獨立論證。此表現標準屬第三學習階段，不等於五年級特定學期進度。',
  learningObjective: freeze({ objectiveId: 'LO-G5-CHINESE-FACT-OPINION-CANDIDATE-01', statement: '依文本線索區分可查證的客觀敘述與表達感受或判斷的句子。', status: 'candidate_pending_teacher_review' }),
  instructions: '在檔案室整理一段原創校園短文，把可由文字確認的敘述和作者的感受判斷分開，再找出支持分類的句子。',
  openQuestions: ['需教師確認原創文本閱讀難度、事實與判斷分類邊界及學生說明方式。', '活動未評量真實網路資訊查核或完整論證寫作。'],
  stages: [
    { stageId: 'classify-text-statements', interaction: 'classify_observations', prompt: '依短文「園遊會記錄」分類：哪些句子能從文中直接核對，哪些句子表達作者的感受或判斷？', context: [{ speaker: '短文', text: '星期五，五年級在操場舉辦園遊會。上午十點開始下雨，大家把攤位移到走廊。小芸覺得這是最熱鬧的一次園遊會。' }], hints: ['看句子能否用短文中的明確事件或時間核對；感受詞常帶有個人判斷。', '「星期五」「十點下雨」可回到文中核對；「最熱鬧」是作者的感受判斷。'], observations: [{ id: 'fact-day', text: '活動在星期五舉辦。' }, { id: 'fact-rain', text: '上午十點開始下雨。' }, { id: 'opinion-lively', text: '這是最熱鬧的一次。' }, { id: 'opinion-fun', text: '這次一定最好玩。' }], categories: [{ id: 'verifiable', label: '文本可核對的敘述' }, { id: 'judgment', label: '感受或判斷' }], correctAssignments: { 'fact-day': 'verifiable', 'fact-rain': 'verifiable', 'opinion-lively': 'judgment', 'opinion-fun': 'judgment' }, incorrectFeedback: '回到原文確認句子是否記錄了可核對的事件，或加入了作者評價；「有文字寫到」不必然代表外部事實已驗證。', correctFeedback: '分類依據是文字能否核對事件，或呈現感受／判斷；短文內容是原創情境。' },
    { stageId: 'collect-supporting-lines', interaction: 'collect_evidence', prompt: '選出能支持「攤位因下雨移到走廊」的原文線索。', hints: ['找出同時提到下雨和攤位移動的句子。', '只選明確記錄原因與移動結果的那一段，不用作者評價。'], options: [{ id: 'rain-moved', text: '上午十點開始下雨，大家把攤位移到走廊。' }, { id: 'lively', text: '小芸覺得這是最熱鬧的一次園遊會。' }, { id: 'day-only', text: '星期五舉辦園遊會。' }], correctOptionIds: ['rain-moved'], incorrectFeedback: '選擇要直接含有題目所問的事件線索；活動評價不能證明攤位移動原因。', correctFeedback: '你找到了直接相關的原文線索；單次選取不能證明能獨立分析其他文本。' },
  ],
});

export const GRADE5_CHINESE_PARAGRAPH_PUZZLE = candidate({
  activityId: 'ACT-G5-CHINESE-PARAGRAPH-PUZZLE-CANDIDATE', subjectId: 'chinese-language',
  title: '段落拼圖與大意線索', curriculumMapId: 'chinese-grade5-paragraph-structure-summary', sourceId: 'chinese-language',
  curriculumCodes: freeze(['Ad-Ⅲ-1', 'Ad-Ⅲ-2', '5-Ⅲ-6']),
  curriculumScope: '部分對應：用三張原創敘事卡重建事件順序，並由句子線索選出段落大意；與第三學習階段篇章結構／大意及摘要、推論表現相關，但不評量完整摘要寫作或不同文體閱讀。',
  learningObjective: freeze({ objectiveId: 'LO-G5-CHINESE-PARAGRAPH-PUZZLE-CANDIDATE-01', statement: '依時間與因果線索排列短文事件，並以主要事件選出較能概括段意的句子。', status: 'candidate_pending_teacher_review' }),
  instructions: '把探險日記片段排回合理順序，再找出能概括主要事件的線索。所有文本均為原創候選教材。',
  openQuestions: ['需教師確認敘事文本長度、詞彙及摘要策略是否符合預定學生。', '第三學習階段要求不表示五年級單一學期教材安排已確認。'],
  stages: [
    { stageId: 'order-paragraph-events', interaction: 'order_items', prompt: '依事件線索排列日記卡：先準備、再觀察，最後記錄發現。', hints: ['找出表示時間或先後的詞語，以及事件之間的因果。', '「先帶著紀錄本出發」應早於「觀察後畫下發現」。'], items: [{ id: 'record', text: '回到基地後，我把看到的葉片形狀記在紀錄本。' }, { id: 'prepare', text: '出發前，我先帶上紀錄本和鉛筆。' }, { id: 'observe', text: '走到花圃後，我仔細比較兩片葉子的邊緣。' }], initialOrder: ['record', 'observe', 'prepare'], correctItemIds: ['prepare', 'observe', 'record'], incorrectFeedback: '用「出發前」「走到…後」「回到…後」確認事件先後，不只依句子長短排序。', correctFeedback: '順序符合文本時間線；這是短篇敘事排序，不代表完整篇章結構理解。' },
    { stageId: 'select-paragraph-gist', interaction: 'choose_response', prompt: '哪一句最能概括這段日記的主要內容？', context: [{ speaker: '日記線索', text: '我帶著紀錄本到花圃比較兩片葉子，回來後記下葉緣觀察。' }], hints: ['找出貫穿整段的主要行動，不要只挑一個小細節。', '能同時包含到花圃觀察和記錄發現的句子，比只提到鉛筆的句子更完整。'], options: [{ id: 'gist', text: '作者到花圃觀察葉片，並把發現記錄下來。' }, { id: 'detail', text: '作者帶了一支鉛筆。' }, { id: 'unsupported', text: '作者發現所有植物都需要相同的照顧。' }], correctOptionIds: ['gist'], incorrectFeedback: '大意應涵蓋主要事件，不能只抓一個物件，也不能加上文本未支持的結論。', correctFeedback: '所選句包含觀察與記錄兩個主要行動；辨認選項不等於能自行寫出摘要。' },
  ],
});

export const GRADE5_SCIENCE_MEASUREMENT_EVIDENCE_LAB = candidate({
  activityId: 'ACT-G5-SCIENCE-MEASUREMENT-EVIDENCE-LAB-CANDIDATE', subjectId: 'natural-science',
  title: '測量證據實驗室', curriculumMapId: 'science-grade5-measurement-methods', sourceId: 'natural-science',
  curriculumCodes: freeze(['INc-Ⅲ-1', 'INc-Ⅲ-4']),
  curriculumScope: '部分對應第三學習階段測量工具與方法、同一事物多次測量可能有差異及精確度判斷。使用預先提供的虛構紀錄與文字模擬儀器；不是真實器材操作、實驗或實際測量。',
  learningObjective: freeze({ objectiveId: 'LO-G5-SCIENCE-MEASUREMENT-EVIDENCE-CANDIDATE-01', statement: '依測量目的選擇合適工具，並比較同一物體重複測量紀錄的差異。', status: 'candidate_pending_teacher_review' }),
  instructions: '在虛構測量站選擇工具，再檢查同一物體的重複紀錄是否一致。這是資料模擬，不會代替實際操作器材。',
  openQuestions: ['需教師確認學生測量單位、量具刻度與重複測量的先備。', '需教師確認模擬紀錄是否適合連結到實體量測活動。', '未進行真實測量，不可推論學生會安全操作儀器。'],
  stages: [
    { stageId: 'match-measurement-tool', interaction: 'classify_observations', prompt: '依測量目的，將任務卡配到適合的工具。', hints: ['先看要量的是長度還是時間，再選工具。', '長度可用尺量；經過時間可用計時器記錄。'], observations: [{ id: 'measure-leaf', text: '記錄葉片的長度（公分）' }, { id: 'measure-time', text: '記錄紙船從起點到終點的時間（秒）' }, { id: 'measure-table', text: '記錄桌面短邊的長度（公分）' }, { id: 'measure-run', text: '記錄小球滾動的時間（秒）' }], categories: [{ id: 'ruler', label: '尺' }, { id: 'timer', label: '計時器' }], correctAssignments: { 'measure-leaf': 'ruler', 'measure-time': 'timer', 'measure-table': 'ruler', 'measure-run': 'timer' }, incorrectFeedback: '依被測量的量選工具：長度與時間不是同一種量；實際工具操作仍需在教師指導下練習。', correctFeedback: '你依測量目的選了工具；此螢幕分類不代表已實際使用器材。' },
    { stageId: 'compare-repeat-measures', interaction: 'build_frequency_table', tableTitle: '同一物體的三次長度紀錄', tableMeasure: '每個測量讀值出現次數', prompt: '整理三次模擬讀值，觀察是否每次都相同。', hints: ['先逐筆比較數字與單位，再把相同讀值歸在一起。', '兩筆是 12 公分，一筆是 13 公分；比較讀值差異，不要直接刪除不同結果。'], observations: [{ id: 'read-a', text: '第 1 次：12 公分' }, { id: 'read-b', text: '第 2 次：12 公分' }, { id: 'read-c', text: '第 3 次：13 公分' }], categories: [{ id: 'twelve', label: '12 公分' }, { id: 'thirteen', label: '13 公分' }], correctAssignments: { 'read-a': 'twelve', 'read-b': 'twelve', 'read-c': 'thirteen' }, incorrectFeedback: '每次讀值都要保留並按數字分類；不同結果表示紀錄有差異，不能只挑自己喜歡的一筆。', correctFeedback: '表格呈現兩次 12 公分、一次 13 公分；虛構資料只用來練習比較重複測量差異。' },
  ],
});

export const GRADE5_ENGLISH_DIALOGUE_ROUTE = candidate({
  activityId: 'ACT-G5-ENGLISH-DIALOGUE-ROUTE-CANDIDATE', subjectId: 'english-language',
  title: '校園問路對話任務', curriculumMapId: 'english-grade5-stage3-daily-communication', sourceId: 'english-language',
  curriculumCodes: freeze(['B-Ⅲ-2']),
  curriculumScope: '部分對應第三學習階段 B-Ⅲ-2「國小階段所學字詞及句型的生活溝通」：在文字校園問路情境中重組已提供語塊；不評量聽力、口說發音或未學過的字詞。第三學習階段範圍並非五年級特定進度。',
  learningObjective: freeze({ objectiveId: 'LO-G5-ENGLISH-DIALOGUE-ROUTE-CANDIDATE-01', statement: '依校園問路情境排列簡短英文問答語塊，讓請求與方向回覆符合對話目的。', status: 'candidate_pending_teacher_review' }),
  instructions: '校園探險時需要問路。把英文語塊排成自然的請求與回覆，看看對方能否理解你要去的地方。此候選版本為文字互動，沒有音訊或口說辨音。',
  openQuestions: ['需教師確認所用字詞與句型已在該班教學中出現。', '需教師確認學生能閱讀語塊；文字重組不能代替聽說評量。', '教材版本、學期與授課進度未提供。'],
  stages: [
    { stageId: 'assemble-directions-request', interaction: 'assemble_response', prompt: '把語塊排成向同學詢問圖書館位置的禮貌問句。', context: [{ speaker: '任務情境', text: '你在校園中找不到圖書館，向同學問路。' }], hints: ['先找出禮貌請求開頭，再放入要詢問的位置。', '問地點可用「Could you tell me where…is?」的語序。'], tokens: [{ id: 'could', text: 'Could you tell me' }, { id: 'where', text: 'where' }, { id: 'library', text: 'the library is?' }, { id: 'because', text: 'because I am hungry.' }], correctOptionIds: ['could', 'where', 'library'], incorrectFeedback: '檢查問句是否包含禮貌請求、where 與要找的地點；不相關的原因語塊不會完成問路目的。', correctFeedback: '語塊組成符合問路目的的文字問句；本活動不評量口說發音或聽力理解。' },
    { stageId: 'assemble-route-reply', interaction: 'assemble_response', prompt: '同學指向辦公室旁邊，排出清楚的英文回覆。', context: [{ speaker: '同學', text: 'The library is next to the office.' }], hints: ['回覆要先說明地點，再說明它和辦公室的相對位置。', '把「The library is」放前面，再接「next to the office」。'], tokens: [{ id: 'library-is', text: 'The library is' }, { id: 'next-to', text: 'next to' }, { id: 'office', text: 'the office.' }, { id: 'under', text: 'under the ocean.' }], correctOptionIds: ['library-is', 'next-to', 'office'], incorrectFeedback: '方向句要保留地點與相對位置，並依英文語序連接；請回看情境提供的地標。', correctFeedback: '回覆清楚說明圖書館與辦公室的位置關係；選擇語塊仍不等於能自行口說溝通。' },
  ],
});

export const GRADE5_FRACTION_EQUIVALENCE_PIECES = candidate({
  activityId: 'ACT-G5-MATH-FRACTION-EQUIVALENCE-PIECES-CANDIDATE', subjectId: 'mathematics',
  title: '分數拼片轉換工坊', curriculumMapId: 'math-grade5-fraction-equivalence-candidate', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-5-4', 'n-III-4']),
  curriculumScope: '部分對應第三學習階段 N-5-4／n-III-4：用等分拼片呈現 1/2=2/4、1/3=2/6，並以共同分母比較 1/2 與 2/3。未練習異分母加減或完整約分／擴分程序；第三學習階段不等同五年級特定學期。',
  learningObjective: freeze({ objectiveId: 'LO-G5-MATH-FRACTION-EQUIVALENCE-PIECES-01', statement: '用等分拼片建立等值分數，並以同單位比較兩個異分母分數。', status: 'candidate_pending_teacher_review' }),
  instructions: '把分數拼片放進指定的等分板，觀察不同切法如何表示同一個整體。每關先操作，再用新分數檢查理解。',
  coverage: freeze({ subitemId: 'SUB-MATH-STAGE3-N5-4-EQUIVALENT-FRACTIONS-COMPARISON', coveredByInteraction: freeze(['compose_shape', 'classify_observations']), notCovered: freeze(['異分母分數加減', '完整約分與擴分程序', '較複雜通分限制與應用']) }),
  learningSubitemClaims: freeze(['SUB-MATH-STAGE3-N5-4-EQUIVALENT-FRACTIONS-COMPARISON']),
  openQuestions: ['教師需確認學生已具備單位分數、等分與第二學習階段等值分數先備。', '拼片是螢幕表示，需教師確認是否搭配實體分數材料。', '未驗證學生能否無支架自行產生等值分數。'],
  stages: [
    { stageId: 'compose-half-with-fourths', interaction: 'compose_shape', prompt: '左側目標是完整的一半；從四等分拼片中選出剛好蓋住相同面積的拼片。', pieces: [{ id: 'quarter-a', label: '四等分第 1 片：1/4', shape: 'square' }, { id: 'quarter-b', label: '四等分第 2 片：1/4', shape: 'square' }, { id: 'quarter-c', label: '四等分第 3 片：1/4', shape: 'square' }, { id: 'quarter-d', label: '四等分第 4 片：1/4', shape: 'square' }, { id: 'half-piece', label: '半片：1/2', shape: 'triangle' }], shapeRules: { rows: 1, columns: 2, selectionCount: 2, correctPieceIds: ['quarter-a', 'quarter-b'] }, hints: ['先確認目標和拼片都指同一個完整整體，再比較覆蓋的部分。', '兩片四分之一合起來是多少？不要把片數當成分母。'], incorrectFeedback: '重新比較所選拼片覆蓋的總量和目標的一半；只看片數或分母大小會忽略每片大小。', correctFeedback: '兩片四分之一合成二分之一，分割方式不同但整體量相同。螢幕選片不等於完整分數運算能力。' },
    { stageId: 'compare-third-and-half', interaction: 'classify_observations', prompt: '新情境：依六等分分數帶，把每張主張卡分成「比較結果有資料支持」或「結果沒有被資料支持」。', observations: [{ id: 'one-half-larger', text: '主張：1/2 比 2/3 大，因為 1 大於 2。' }, { id: 'two-thirds-larger', text: '主張：2/3 比 1/2 大，因為 4/6 大於 3/6。' }, { id: 'same-size', text: '主張：1/2 和 2/3 一樣大，因為分母都能變成 6。' }], categories: [{ id: 'supported', label: '比較結果有支持' }, { id: 'unsupported', label: '比較結果沒有支持' }], correctAssignments: { 'one-half-larger': 'unsupported', 'two-thirds-larger': 'supported', 'same-size': 'unsupported' }, hints: ['先把兩個分數改用相同大小的分數單位，再比較有幾份。', '1/2 可看成 3/6；2/3 可看成 4/6，4 份比 3 份多。'], incorrectFeedback: '共同分母只讓分數單位相同；請用六等分比較每個主張是否符合數量。', correctFeedback: '六等分中 1/2 是 3/6、2/3 是 4/6，因此只有「2/3 比較大」的主張有資料支持。這只檢查一種比較情境，仍需教師確認先備。' },
  ],
});

export const GRADE5_INTEGER_DIVISION_FRACTION_MODEL = candidate({
  activityId: 'ACT-G5-MATH-INTEGER-DIVISION-FRACTION-MODEL-CANDIDATE', subjectId: 'mathematics',
  title: '整數平分與分裝拼片站', curriculumMapId: 'math-grade5-integer-division-fraction-representation', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-5-6', 'n-III-5']),
  curriculumScope: '部分對應第三學習階段 N-5-6／n-III-5：以螢幕等分拼片呈現 3 個整體平分給 4 人，以及 3 個單位相對於 4 個單位的一部分；兩個情境均以 3÷4=3/4 表示。沒有實體分裝或量測，也未涵蓋其他數量與完整除法應用。第三學習階段不代表五年級特定學期。',
  learningObjective: freeze({ objectiveId: 'LO-G5-MATH-INTEGER-DIVISION-FRACTION-MODEL-01', statement: '以平分及測量觀點操作等分單位，說明整數相除的商可以是分數。', status: 'candidate_pending_teacher_review' }),
  instructions: '在平分情境中，替每位探險隊員組出公平的一份；再用測量觀點比較現有長度和一個完整單位。兩關都要用拼片表示商，不只計算。',
  coverage: freeze({ subitemId: 'SUB-MATH-STAGE3-N5-6-INTEGER-DIVISION-AS-FRACTION', coveredByInteraction: freeze(['compose_shape']), notCovered: freeze(['真實材料的平分與量測', '多種整數除法數值與脈絡', 'N-5-10比率應用']) }),
  learningSubitemClaims: freeze(['SUB-MATH-STAGE3-N5-6-INTEGER-DIVISION-AS-FRACTION']),
  openQuestions: ['教師需確認學生已理解等分、單位分數與分數拼片代表同一整體的先備。', '螢幕拼片是模型，不證明學生能實際切分、分裝或用量具量測。', '需教師確認文字情境中「一份」與「一個測量單位」的表述適合班級用語。'],
  stages: [
    { stageId: 'share-three-wholes-four-people', interaction: 'compose_shape', prompt: '3 個一樣大的餅平均分給甲、乙、丙、丁 4 位隊員。請組出甲隊員分到的份量。', pieces: [{ id: 'a1', label: '第 1 個餅：分給甲的 1/4', shape: 'square' }, { id: 'a2', label: '第 1 個餅：分給乙的 1/4', shape: 'square' }, { id: 'b1', label: '第 2 個餅：分給甲的 1/4', shape: 'square' }, { id: 'b2', label: '第 2 個餅：分給乙的 1/4', shape: 'square' }, { id: 'c1', label: '第 3 個餅：分給甲的 1/4', shape: 'square' }, { id: 'c2', label: '第 3 個餅：分給乙的 1/4', shape: 'square' }, { id: 'whole', label: '一個完整餅', shape: 'triangle' }], shapeRules: { rows: 1, columns: 3, selectionCount: 3, correctPieceIds: ['a1', 'b1', 'c1'] }, hints: ['每個餅要平均分成 4 份；請追蹤甲隊員從每個餅拿到的那一份。', '把甲隊員拿到的三個 1/4 拼片合起來，再想「3 個餅 ÷ 4 人」如何用分數表示。'], incorrectFeedback: '請逐個餅檢查甲隊員拿到哪一片；三片都要屬於甲，而且每片是同一個餅的四等分之一。', correctFeedback: '甲隊員從三個餅各拿到 1/4，合起來是 3/4 個餅，所以 3÷4=3/4。這是螢幕模型。' },
    { stageId: 'measure-three-units-of-four', interaction: 'compose_shape', prompt: '測量情境：把 4 個相同長度的小段合起來當作 1 個完整測量單位；現在有 3 個小段。組出這 3 段占完整測量單位的幾分之幾。', pieces: [{ id: 'unit-a', label: '完整測量單位中的第 1/4 段', shape: 'square' }, { id: 'unit-b', label: '完整測量單位中的第 2/4 段', shape: 'square' }, { id: 'unit-c', label: '完整測量單位中的第 3/4 段', shape: 'square' }, { id: 'unit-d', label: '完整測量單位中的第 4/4 段', shape: 'square' }, { id: 'extra', label: '另一個不同長度的單位片', shape: 'triangle' }], shapeRules: { rows: 1, columns: 3, selectionCount: 3, correctPieceIds: ['unit-a', 'unit-b', 'unit-c'] }, hints: ['完整單位由 4 個一樣大的小段組成；分母表示完整單位分成幾份。', '現有 3 段占 4 段中的 3 段，因此用 3/4 個完整單位表示。'], incorrectFeedback: '先把完整測量單位看成 4 個相等小段，再數現有的 3 段占其中幾段。', correctFeedback: '3 段是完整 4 段單位的 3/4；同一個 3÷4 可從測量觀點表示為 3/4 個單位。畫面不等於真實量測。' }
  ],
});

export const GRADE5_SOCIAL_PERSPECTIVE_EVIDENCE = candidate({
  activityId: 'ACT-G5-SOCIAL-PERSPECTIVE-EVIDENCE-CANDIDATE', subjectId: 'social-studies',
  title: '不同日常，不同看法：觀點線索站', curriculumMapId: 'social-grade5-background-perspectives-candidate', sourceId: 'social-studies',
  curriculumCodes: freeze(['Ba-Ⅲ-1']),
  curriculumScope: '部分對應第三學習階段 Ba-Ⅲ-1：從明示的虛構生活經驗線索比較人物對同一社會安排的觀點差異。未代表真實群體、不推論身分刻板印象，也不評量實際訪談或公共決策。第三學習階段含五、六年級，不是特定年級進度。',
  learningObjective: freeze({ objectiveId: 'LO-G5-SOCIAL-PERSPECTIVE-EVIDENCE-01', statement: '依人物明確說出的生活經驗，整理其對同一安排的不同觀點並指出支持線索。', status: 'candidate_pending_teacher_review' }),
  instructions: '虛構社區圖書室要調整開放時間。閱讀兩位角色親自提供的經驗卡，依線索整理他們的看法；不要用角色身分猜測。',
  coverage: freeze({ subitemId: 'SUB-SOCIAL-STAGE3-BA3-1-EXPERIENCE-AND-PERSPECTIVE', coveredByInteraction: freeze(['classify_observations', 'collect_evidence']), notCovered: freeze(['真實居民訪談', '觀點背後多重脈絡', '協商與公共決策']) }),
  learningSubitemClaims: freeze(['SUB-SOCIAL-STAGE3-BA3-1-EXPERIENCE-AND-PERSPECTIVE']),
  openQuestions: ['所有角色與情境均為教學用虛構素材，教師需檢視是否適齡且避免文化刻板印象。', '第三學習階段不表示五年級校本進度已確認。'],
  stages: [
    { stageId: 'sort-experience-linked-views', interaction: 'classify_observations', prompt: '小晴每天搭 4 點的公車回家，支持圖書室提早開門；阿凱由家人 5 點接送，希望晚一點關門。把線索卡依其明說的時間需求分類。', observations: [{ id: 'qing-experience', text: '小晴的公車 4 點發車，她希望提早開門。' }, { id: 'kai-experience', text: '阿凱 5 點由家人接送，他希望晚一點關門。' }, { id: 'qing-opinion', text: '小晴認為提早開門較方便。' }, { id: 'kai-opinion', text: '阿凱認為晚一點關門較方便。' }], categories: [{ id: 'early', label: '支持提早開門' }, { id: 'late', label: '支持晚一點關門' }], correctAssignments: { 'qing-experience': 'early', 'kai-experience': 'late', 'qing-opinion': 'early', 'kai-opinion': 'late' }, hints: ['先找出每位角色明說的交通／接送時間，再連結其主張。', '不要依名字或角色猜測；小晴連結 4 點公車，阿凱連結 5 點接送。'], incorrectFeedback: '把觀點和人物自己說出的經驗連起來；不能從身分標籤推測，也不要把兩人的需要混在一起。', correctFeedback: '你依明示經驗整理出兩種不同觀點。虛構分類不代表真實訪談或協商能力。' },
    { stageId: 'collect-viewpoint-evidence', interaction: 'collect_evidence', prompt: '選出能直接說明「為什麼兩人對開放時間有不同看法」的線索。', options: [{ id: 'bus-time', text: '小晴的公車 4 點發車。' }, { id: 'pickup-time', text: '阿凱 5 點由家人接送。' }, { id: 'library-color', text: '圖書室門是藍色。' }], correctOptionIds: ['bus-time', 'pickup-time'], hints: ['找出和兩人可使用時間直接相關的資料。', '兩筆交通／接送時間都要保留；門的顏色不能解釋開放時間意見。'], incorrectFeedback: '證據應能連到角色實際可到圖書室的時間；裝飾資訊不是觀點原因。', correctFeedback: '你找出兩筆直接相關經驗；單一虛構案例不能概括所有居民或證明公共方案優劣。' },
  ],
});

export const GRADE5_SCIENCE_FAIR_TEST_PLANNER = candidate({
  activityId: 'ACT-G5-SCIENCE-FAIR-TEST-PLANNER-CANDIDATE', subjectId: 'natural-science',
  title: '公平測試規劃桌：斜坡小車', curriculumMapId: 'science-grade5-fair-test-planning-candidate', sourceId: 'natural-science',
  curriculumCodes: freeze(['pe-Ⅲ-1', 'INc-Ⅲ-1']),
  curriculumScope: '部分參照第三學習階段 pe-Ⅲ-1 與 INc-Ⅲ-1：辨認自變項／應變項、選擇控制條件、安排重複測量的簡單探究計畫。此為畫面中的虛構規劃與紀錄，不是實際器材操作、實驗或測量能力評量；未對應需要實際安全操作與詳實記錄的 pe-Ⅲ-2。',
  learningObjective: freeze({ objectiveId: 'LO-G5-SCIENCE-FAIR-TEST-PLANNING-01', statement: '規劃只改變斜坡表面、測量小車滑行距離並保持起點與斜坡高度一致的模擬公平測試。', status: 'candidate_pending_teacher_review' }),
  instructions: '小隊想知道斜坡表面是否影響小車滑行距離。先整理要改變、要測量及要保持不變的條件，再安排測試流程。所有紀錄都是虛構模擬。',
  coverage: freeze({ subitemId: 'SUB-SCIENCE-STAGE3-PE3-1-FAIR-TEST-PLANNING', coveredByInteraction: freeze(['classify_observations', 'order_items']), notCovered: freeze(['實際安全操作器材', '實地量測與紀錄', '自選探究問題及完整資料分析']) }),
  learningSubitemClaims: freeze(['SUB-SCIENCE-STAGE3-PE3-1-FAIR-TEST-PLANNING']),
  openQuestions: ['教師需確認學生已接觸自變項、應變項與控制條件等用語。', '需搭配教師帶領的真實器材活動才能檢查操作能力。'],
  stages: [
    { stageId: 'identify-test-variables', interaction: 'classify_observations', prompt: '問題是「斜坡表面會不會影響小車滑行距離？」把條件卡分到「改變的條件」、「測量結果」或「保持相同」。', observations: [{ id: 'surface', text: '斜坡表面：光滑板／粗糙布' }, { id: 'distance', text: '從起點滑行到停止的距離' }, { id: 'height', text: '斜坡高度保持相同' }, { id: 'start', text: '小車每次從同一條起點線放開' }, { id: 'push', text: '每次由手用不同力量推車' }], categories: [{ id: 'change', label: '改變的條件' }, { id: 'measure', label: '測量結果' }, { id: 'same', label: '保持相同' }, { id: 'invalid', label: '不符合公平比較' }], correctAssignments: { surface: 'change', distance: 'measure', height: 'same', start: 'same', push: 'invalid' }, hints: ['先找題目主動改變什麼，再找想觀察的結果。', '若每次推車力量也不同，就無法判斷距離變化是否來自表面。'], incorrectFeedback: '一次只改變題目要比較的表面；起點和高度需相同，另加不同推力會混入其他變因。', correctFeedback: '你辨認出改變條件、測量結果與控制條件；這是模擬規劃，不是親自完成實驗。' },
    { stageId: 'order-fair-test-plan', interaction: 'order_items', prompt: '排列公平測試計畫：先固定條件，再比較兩種表面並記錄多次距離。', items: [{ id: 'release', text: '每次都從同一起點放開小車。' }, { id: 'set-height', text: '把斜坡固定在相同高度。' }, { id: 'change-surface', text: '分別使用光滑板與粗糙布。' }, { id: 'measure-repeat', text: '每種表面測量數次並保留每筆距離。' }, { id: 'compare', text: '比較兩種表面的測量紀錄。' }], initialOrder: ['compare', 'change-surface', 'measure-repeat', 'release', 'set-height'], correctItemIds: ['set-height', 'release', 'change-surface', 'measure-repeat', 'compare'], hints: ['先準備需要保持一致的條件，再改變表面。', '各表面都要重複量測並保留紀錄，最後才比較。'], incorrectFeedback: '先控制高度與起點，接著改變表面、重複測量，最後比較；不要先下結論。', correctFeedback: '計畫先控制條件、收集重複紀錄再比較。畫面未實際執行物理實驗。' },
  ],
});

export const GRADE5_CANDIDATE_TASKS = Object.freeze([
  GRADE5_FACTOR_ARRAY_EXPLORER,
  GRADE5_MULTI_STEP_SUPPLY_PLANNER,
  GRADE5_CHINESE_FACT_OPINION_ARCHIVE,
  GRADE5_CHINESE_PARAGRAPH_PUZZLE,
  GRADE5_SCIENCE_MEASUREMENT_EVIDENCE_LAB,
  GRADE5_ENGLISH_DIALOGUE_ROUTE,
  GRADE5_FRACTION_EQUIVALENCE_PIECES,
  GRADE5_INTEGER_DIVISION_FRACTION_MODEL,
  GRADE5_SOCIAL_PERSPECTIVE_EVIDENCE,
  GRADE5_SCIENCE_FAIR_TEST_PLANNER,
]);
