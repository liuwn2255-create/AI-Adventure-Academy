const freeze = (value) => Object.freeze(value);

const candidate = (task) => freeze({
  ...task,
  gradeId: 'grade-6',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  completionReward: '六年級探險紀念章',
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: freeze(task.openQuestions ?? []),
  stages: freeze(task.stages.map(freeze)),
});

export const GRADE6_PRIME_FACTOR_EXPLORER = candidate({
  activityId: 'ACT-G6-MATH-PRIME-FACTOR-EXPLORER-CANDIDATE', subjectId: 'mathematics',
  title: '質數與因數分解探險', curriculumMapId: 'math-grade6-prime-factor-candidate', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-6-1', 'n-III-3']),
  curriculumScope: '部分對應 N-6-1 與第三學習階段 n-III-3：分類小範圍質數／合數並組成 18 的質因數乘積。未操作短除法完整程序，也未涵蓋所有指定質數判別情形；第三學習階段不代表六年級特定學期。',
  learningSubitemClaims: freeze(['SUB-MATH-G6-N6-1-PRIME-CLASSIFICATION-AND-FACTORS']),
  learningObjective: freeze({ objectiveId: 'LO-G6-MATH-PRIME-FACTOR-CANDIDATE-01', statement: '依因數結構分類小於 20 的質數與合數，並將 18 表示為質因數乘積。', status: 'candidate_pending_teacher_review' }),
  instructions: '在數字礦坑整理因數線索，再把一個數拆成質因數乘積。這是候選練習，不是正式評量。',
  openQuestions: ['需教師確認學生已學過因數、質數及乘法分解的先備。', '活動不教短除法書寫步驟，不能據此判斷完整 N-6-1 學習。', '教材版本、冊次、頁碼及班級授課進度未提供。'],
  stages: [
    { stageId: 'classify-small-numbers', interaction: 'classify_observations', prompt: '把數字卡分成「質數」和「合數」。質數只有 1 和自己兩個正因數；合數還有其他正因數。', hints: ['逐一想想除了 1 和這個數本身，是否還能整除。', '例如 15 可被 3 和 5 整除；找不到其他因數的數才放入質數區。'], observations: [{ id: 'number-11', text: '11' }, { id: 'number-12', text: '12' }, { id: 'number-13', text: '13' }, { id: 'number-15', text: '15' }, { id: 'number-17', text: '17' }], categories: [{ id: 'prime', label: '質數' }, { id: 'composite', label: '合數' }], correctAssignments: { 'number-11': 'prime', 'number-12': 'composite', 'number-13': 'prime', 'number-15': 'composite', 'number-17': 'prime' }, incorrectFeedback: '檢查每張卡是否還有 1 和自己以外的因數。注意：1 不在本組卡片中，也不是質數。', correctFeedback: '分類依據是正因數個數；這一小組數字不代表已掌握所有質數判別。' },
    { stageId: 'assemble-eighteen-prime-factors', interaction: 'assemble_response', prompt: '把 18 組成「質數相乘」的表示式。', hints: ['先找兩個整數相乘等於 18，再檢查因數是否還能分解。', '選出的每個因數都必須是質數，且相乘要回到 18。'], tokens: [{ id: 'factor-two', text: '2' }, { id: 'times-one', text: '×' }, { id: 'factor-three-a', text: '3' }, { id: 'times-two', text: '×' }, { id: 'factor-three-b', text: '3' }, { id: 'factor-six', text: '6' }], correctOptionIds: ['factor-two', 'times-one', 'factor-three-a', 'times-two', 'factor-three-b'], incorrectFeedback: '檢查乘積是否仍為 18，並確認每個因數都是質數；6 還能繼續分解。', correctFeedback: '2×3×3 的乘積是 18，且每個因數都是質數；沒有要求你使用短除法。' },
  ],
});

export const GRADE6_MULTI_STEP_REASONING = candidate({
  activityId: 'ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE', subjectId: 'mathematics',
  title: '遠征補給多步推理', curriculumMapId: 'math-grade6-multistep-applications-candidate', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-6-5', 'n-III-2', 'r-III-2']),
  curriculumScope: '部分對應 N-6-5：以整數兩步情境保留中間結果並排列解題流程。未涵蓋分數／小數混合運算、概數協助解題及其他應用類型；不推定六年級學期進度。',
  learningSubitemClaims: freeze(['SUB-MATH-G6-N6-5-INTEGER-MULTI-STEP-AND-SEQUENCING']),
  learningObjective: freeze({ objectiveId: 'LO-G6-MATH-MULTI-STEP-REASONING-CANDIDATE-01', statement: '根據情境先計算兩批物資總量，再扣除已使用量，並辨識依賴中間結果的步驟。', status: 'candidate_pending_teacher_review' }),
  instructions: '遠征隊整理兩批物資，再計算使用後剩下多少。每個步驟都要保留中間結果。',
  openQuestions: ['需教師確認整數乘加減及多步驟列式先備。', '目前只有一種整數情境，不足以支持一般多步驟解題能力。', '活動不評量獨立列式書寫或估算策略。', '教材版本、冊次、頁碼及班級授課進度未提供。'],
  stages: [
    { stageId: 'calculate-expedition-supplies', interaction: 'complete_calculation_steps', calculationTitle: '計算剩餘補給', prompt: '探險隊收到 3 箱、每箱 24 個水壺，以及 2 箱、每箱 18 個水壺；途中使用了 15 個。依序完成計算。', hints: ['先求兩批各有多少，再合併，最後扣掉已使用的數量。', '先算 3×24 和 2×18，合併兩個結果，再減 15。'], calculationSteps: [{ id: 'batch-a', label: '第一批：3 × 24', expectedValue: 72, choices: [{ value: 72, label: '72' }, { value: 27, label: '27' }, { value: 3, label: '3' }] }, { id: 'batch-b', label: '第二批：2 × 18', expectedValue: 36, choices: [{ value: 36, label: '36' }, { value: 20, label: '20' }, { value: 18, label: '18' }] }, { id: 'total', label: '兩批合計：72 + 36', expectedValue: 108, choices: [{ value: 108, label: '108' }, { value: 72, label: '72' }, { value: 98, label: '98' }] }, { id: 'remaining', label: '使用後剩下：108 − 15', expectedValue: 93, choices: [{ value: 93, label: '93' }, { value: 123, label: '123' }, { value: 108, label: '108' }] }], incorrectFeedback: '查看出錯的那一步：分批乘算、合併或扣除使用量。只修改該步並再檢查中間結果。', correctFeedback: '計算為 72、36、108，最後剩 93 個。完成這個情境不代表已掌握所有二至三步驟問題。' },
    { stageId: 'order-reasoning-steps', interaction: 'order_items', prompt: '將解題卡排成符合物資情境的順序。', hints: ['先得到每批數量，之後才可以合併。', '使用量必須從兩批合計中扣除，因此扣除放在最後。'], items: [{ id: 'multiply-first', text: '算第一批：3 × 24' }, { id: 'multiply-second', text: '算第二批：2 × 18' }, { id: 'combine', text: '合併兩批物資' }, { id: 'subtract-used', text: '扣除使用的 15 個' }], initialOrder: ['subtract-used', 'combine', 'multiply-first', 'multiply-second'], correctItemIds: ['multiply-first', 'multiply-second', 'combine', 'subtract-used'], incorrectFeedback: '先取得兩批數量才能合併；只有合併後才有可扣除使用量的總數。', correctFeedback: '順序符合情境依賴關係；卡片排序不等於學生能在陌生情境自行規劃。' },
  ],
});

export const GRADE6_CHINESE_CAUSAL_INFERENCE = candidate({
  activityId: 'ACT-G6-CHINESE-CAUSAL-INFERENCE-CANDIDATE', subjectId: 'chinese-language',
  title: '線索偵查局：推論事件原因', curriculumMapId: 'chinese-grade6-causal-inference-candidate', sourceId: 'chinese-language',
  curriculumCodes: freeze(['5-Ⅲ-8']),
  curriculumScope: '部分參照第三學習階段 5-Ⅲ-8：從原創短文線索推論隱含因果。此閱讀表現涵蓋五、六年級整體，不能推定六年級特定學期；活動不是完整閱讀或獨立論證評量。',
  learningObjective: freeze({ objectiveId: 'LO-G6-CHINESE-CAUSAL-INFERENCE-CANDIDATE-01', statement: '連結短文中的前後線索，指出較受文本支持的隱含因果關係。', status: 'candidate_pending_teacher_review' }),
  instructions: '在偵查局閱讀原創紀錄，先找出證據，再推理事件之間可能的因果關係。',
  openQuestions: ['需教師確認短文詞彙、推論難度及替代解釋是否合適。', '所選證據有多段文字支援；選取正確不等於能自行表達完整推論。', '教材版本、學期及班級閱讀進度未提供。'],
  stages: [
    { stageId: 'collect-causal-clues', interaction: 'collect_evidence', prompt: '哪些句子能支持「植物盆土變乾與連日未下雨有關」？可選出相關線索。', context: [{ speaker: '觀察紀錄', text: '花圃旁的雨量筒連續幾天沒有新雨水。值日生發現盆土摸起來乾，葉片也比前幾天下垂。大家先記錄觀察，沒有直接挖掘或傷害植物。' }], hints: ['找同時提供「雨水變化」和「盆土／植物狀況」的句子。', '證據要來自紀錄中的觀察；不要選沒有寫出的照顧方式。'], options: [{ id: 'rain-gauge', text: '雨量筒連續幾天沒有新雨水。' }, { id: 'dry-soil', text: '值日生發現盆土摸起來乾。' }, { id: 'drooping-leaf', text: '葉片比前幾天下垂。' }, { id: 'fertilizer', text: '大家多加了肥料。' }], correctOptionIds: ['rain-gauge', 'dry-soil', 'drooping-leaf'], incorrectFeedback: '回到文本分辨直接觀察與未記載的做法；推論需由紀錄線索支持，不能自行補上事件。', correctFeedback: '你選到雨量與植物狀態的相關紀錄；相關線索能支持推論，但不能單獨證明唯一原因。' },
    { stageId: 'order-causal-explanation', interaction: 'order_items', prompt: '把觀察與推論卡排成「先有線索，再提出較保守解釋」的順序。', hints: ['先放可以直接觀察到的條件，再放植物狀況。', '最後才提出「可能相關」的解釋，避免把推論當成直接觀察。'], items: [{ id: 'no-rain', text: '雨量筒幾天沒有新增雨水。' }, { id: 'soil-dry', text: '盆土摸起來乾，葉片下垂。' }, { id: 'inference', text: '缺少雨水可能與盆土變乾有關，仍需更多觀察確認。' }], initialOrder: ['inference', 'soil-dry', 'no-rain'], correctItemIds: ['no-rain', 'soil-dry', 'inference'], incorrectFeedback: '先列文本中直接記錄的證據，最後才寫有保留語氣的推論；因果仍是待檢查的解釋。', correctFeedback: '排序將觀察與推論分開，並保留不確定性；這不等於科學因果實驗。' },
  ],
});

export const GRADE6_CHINESE_TEXT_STRUCTURE = candidate({
  activityId: 'ACT-G6-CHINESE-TEXT-STRUCTURE-CANDIDATE', subjectId: 'chinese-language',
  title: '故事結構修復工坊', curriculumMapId: 'chinese-grade6-text-structure-candidate', sourceId: 'chinese-language',
  curriculumCodes: freeze(['Ad-Ⅲ-1', 'Ad-Ⅲ-2']),
  curriculumScope: '部分參照第三學習階段篇章結構及大意／主旨／寓意：將原創故事依功能組織，再組合能涵蓋主旨的摘要語塊。未評量完整文本閱讀、獨立寫作或多文體；階段要求不等於六年級單學期進度。',
  learningObjective: freeze({ objectiveId: 'LO-G6-CHINESE-TEXT-STRUCTURE-CANDIDATE-01', statement: '辨認故事中背景、問題、行動與結果的篇章功能，並組成不增加文本外資訊的簡要大意。', status: 'candidate_pending_teacher_review' }),
  instructions: '故事卷軸被打亂了。先修復事件結構，再拼出符合文本的簡短大意。',
  openQuestions: ['需教師確認故事結構術語、文本長度及語詞難度。', '卡片重排與摘要語塊拼組不能證明學生能獨立撰寫摘要。', '未涵蓋其他文體與更完整的寓意詮釋。'],
  stages: [
    { stageId: 'repair-story-structure', interaction: 'order_items', prompt: '依原創故事的事件關係排列：出發、遇到問題、採取行動、結果。', context: [{ speaker: '故事', text: '小安帶著種子走到校園花圃，發現土壤很乾。他先查看紀錄牌，再和同學商量澆水量。幾天後，他們記下新芽出現。' }], hints: ['找出故事開始的背景，再找遇到的問題與後續行動。', '新芽出現是後續結果，放在行動之後。'], items: [{ id: 'result', text: '幾天後，他們記下新芽出現。' }, { id: 'problem', text: '小安發現花圃土壤很乾。' }, { id: 'action', text: '他查看紀錄牌並和同學商量澆水量。' }, { id: 'setting', text: '小安帶著種子走到校園花圃。' }], initialOrder: ['result', 'action', 'setting', 'problem'], correctItemIds: ['setting', 'problem', 'action', 'result'], incorrectFeedback: '用事件發生順序檢查：先有背景，接著問題，之後行動，最後才是觀察到的結果。', correctFeedback: '事件依文本順序排列；這項任務只處理一段原創敘事。' },
    { stageId: 'assemble-story-gist', interaction: 'assemble_response', prompt: '選取語塊組成能涵蓋故事主要事件、又不增加新資訊的大意。', hints: ['摘要要保留主要問題與人物採取的行動。', '選擇能概括花圃觀察、商量照顧與後續記錄的語塊；不要加入文本未說的結論。'], tokens: [{ id: 'setting', text: '小安在花圃發現土壤乾燥，' }, { id: 'action', text: '查看紀錄並和同學討論照顧方式，' }, { id: 'result', text: '之後記錄新芽出現。' }, { id: 'unsupported', text: '因此所有植物都不需要澆水。' }], correctOptionIds: ['setting', 'action', 'result'], incorrectFeedback: '大意應包含故事主要問題、行動與結果，也不能把單一故事擴大成普遍結論。', correctFeedback: '語塊保留了故事主要事件，沒有加入原文未支持的結論；並非完整摘要寫作評量。' },
  ],
});

export const GRADE6_SCIENCE_WEATHER_MAP = candidate({
  activityId: 'ACT-G6-SCIENCE-WEATHER-MAP-READER-CANDIDATE', subjectId: 'natural-science',
  title: '天氣圖符號觀察站', curriculumMapId: 'science-grade6-weather-symbols-candidate', sourceId: 'natural-science',
  curriculumCodes: freeze(['INd-Ⅲ-7', 'pa-Ⅲ-2']),
  curriculumScope: '部分對應第三學習階段 INd-Ⅲ-7 天氣圖符號與天氣變化，並以 pa-Ⅲ-2 的資料整理／比較作候選方法參照。操作的是虛構、文字化符號圖例，不是即時天氣圖判讀，也不涵蓋氣象測量或預報。',
  learningObjective: freeze({ objectiveId: 'LO-G6-SCIENCE-WEATHER-MAP-CANDIDATE-01', statement: '依圖例把簡化天氣符號與現象配對，並比較兩張虛構天氣圖的變化線索。', status: 'candidate_pending_teacher_review' }),
  instructions: '在天氣觀測站查看圖例，整理符號所代表的天氣現象，再根據兩個時點的虛構資料找出變化。',
  openQuestions: ['需教師確認所用符號圖例與現行教材／氣象圖表一致。', '文字化示意不等同讀取真實天氣圖、氣象預報或測量器材。', '需教師確認前置天氣概念與資料判讀負荷。'],
  stages: [
    { stageId: 'match-weather-symbols', interaction: 'classify_observations', prompt: '依本活動圖例把符號紀錄分到相應的天氣現象。圖例：☂＝降雨區；↗＝風向箭頭；⚑＝颱風標記。這是教學用示意圖例，不是正式氣象圖。', hints: ['先對照每張卡上的符號，再查本活動提供的圖例。', '不要只看符號顏色；此圖例只用☂、↗、⚑三個標記。'], observations: [{ id: 'symbol-rain', text: '☂ 北側' }, { id: 'symbol-wind', text: '↗ 東南側' }, { id: 'symbol-typhoon', text: '⚑ 海面' }], categories: [{ id: 'rain', label: '降雨區' }, { id: 'wind', label: '風向箭頭' }, { id: 'typhoon', label: '颱風標記' }], correctAssignments: { 'symbol-rain': 'rain', 'symbol-wind': 'wind', 'symbol-typhoon': 'typhoon' }, incorrectFeedback: '依提供的圖例逐一核對符號，不要用生活印象替代圖例；此為自訂教學符號。', correctFeedback: '配對符合本活動自訂圖例；它不能代表學生已能讀取正式天氣圖符號。' },
    { stageId: 'collect-change-evidence', interaction: 'collect_evidence', prompt: '比較時間 A 與時間 B 的文字化示意圖，選出能支持「降雨區移動且風向標記改變」的資料。', context: [{ speaker: '時間 A', text: '☂ 北側；↗ 東南側。' }, { speaker: '時間 B', text: '☂ 中部；↖ 南側。' }], hints: ['比較兩個時點相同類型的標記位置。', '分別找出降雨符號和風向箭頭在 A、B 的位置記錄。'], options: [{ id: 'rain-a', text: 'A 時間：☂ 在北側。' }, { id: 'rain-b', text: 'B 時間：☂ 在中部。' }, { id: 'wind-a', text: 'A 時間：↗ 在東南側。' }, { id: 'wind-b', text: 'B 時間：↖ 在南側。' }, { id: 'no-data', text: 'B 時間的氣溫一定下降。' }], correctOptionIds: ['rain-a', 'rain-b', 'wind-a', 'wind-b'], incorrectFeedback: '只選資料中直接提供的位置紀錄；沒有溫度數據時，不能推斷氣溫一定下降。', correctFeedback: '你比較了兩時點的符號位置；這是虛構文字資料練習，不是天氣變化預報。' },
  ],
});

export const GRADE6_ENGLISH_INTRODUCTION = candidate({
  activityId: 'ACT-G6-ENGLISH-INTRODUCTION-CARDS-CANDIDATE', subjectId: 'english-language',
  title: '國際交流自我介紹卡', curriculumMapId: 'english-grade6-simple-introduction-candidate', sourceId: 'english-language',
  curriculumCodes: freeze(['B-Ⅲ-1']),
  curriculumScope: '部分對應第三學習階段 B-Ⅲ-1「自己、家人及朋友的簡易介紹」：把提供的英文語塊組成簡短自我介紹，再選擇合適的文字回應。沒有音訊／口說辨音或自行產生語句功能；第三學習階段非六年級單學期進度。',
  learningObjective: freeze({ objectiveId: 'LO-G6-ENGLISH-INTRODUCTION-CARDS-CANDIDATE-01', statement: '依情境重組簡短英文自我介紹語塊，並辨認適切的交流回應。', status: 'candidate_pending_teacher_review' }),
  instructions: '準備一張國際交流介紹卡。排列語塊介紹自己，再選擇一個尊重且相關的文字回應。',
  openQuestions: ['需教師確認字詞、姓名／興趣句型與預定班級實際教學範圍相符。', '活動是文字語塊重組與回應辨認，不評量學生口說、聽力或發音。', '避免輸入真實個人資訊；使用虛構角色資料。教材版本與進度未提供。'],
  stages: [
    { stageId: 'assemble-introduction', interaction: 'assemble_response', prompt: '為虛構角色 Alex 排列介紹語塊，避免輸入自己的個人資料。', context: [{ speaker: '角色卡', text: 'Alex；喜歡畫畫；六年級學生。' }], hints: ['先用姓名開頭，再說明年級或興趣。', '本活動提供 My name is / I am in / I like 語塊；只選與角色卡相符的內容。'], tokens: [{ id: 'name', text: 'My name is Alex.' }, { id: 'grade', text: 'I am in sixth grade.' }, { id: 'hobby', text: 'I like drawing.' }, { id: 'unsupported', text: 'My home address is 1 Main Street.' }], correctOptionIds: ['name', 'grade', 'hobby'], incorrectFeedback: '核對角色卡中的資訊；介紹內容只放角色卡提供的資料，避免加入地址等個人資訊。', correctFeedback: '語塊與虛構角色資料一致；拼組答案不代表能自行口說介紹。' },
    { stageId: 'choose-friendly-response', interaction: 'choose_response', prompt: '同學說「I like drawing, too.」選擇一個與交流情境相關且友善的回應。', context: [{ speaker: '同學', text: 'I like drawing, too.' }], hints: ['回應要接續共同興趣，而不是突然改談無關事情。', '可以接著詢問對方畫畫的喜好；保持簡短並與對話相關。'], options: [{ id: 'ask-picture', text: 'What do you like to draw?' }, { id: 'weather', text: 'It is raining yesterday.' }, { id: 'unrelated', text: 'Where is the blue elephant?' }], correctOptionIds: ['ask-picture'], incorrectFeedback: '看看哪個句子能接續共同興趣、讓對話自然繼續；其他選項和情境不連貫。', correctFeedback: '回應接續了共同興趣；選擇回應不等於已能即時口語互動。' },
  ],
});

export const GRADE6_DATA_LIKELIHOOD_READER = candidate({
  activityId: 'ACT-G6-MATH-DATA-LIKELIHOOD-READER-CANDIDATE', subjectId: 'mathematics',
  title: '資料觀察站：哪種結果比較可能？', curriculumMapId: 'math-grade6-data-likelihood-candidate', sourceId: 'mathematics',
  curriculumCodes: freeze(['D-6-2', 'd-III-2']),
  curriculumScope: '部分對應第三學習階段 D-6-2／d-III-2：依清楚標示為虛構的統計次數資料，判斷「很有可能／很不可能」及差異明顯時 A 比 B 可能。非古典機率計算、非實際隨機試驗，也不推論未記錄的未來結果；第三學習階段不等於六年級特定學期。',
  learningObjective: freeze({ objectiveId: 'LO-G6-MATH-DATA-LIKELIHOOD-01', statement: '根據已提供的資料次數比較結果可能性的相對大小，並避免把資料判斷說成保證。', status: 'candidate_pending_teacher_review' }),
  instructions: '讀取虛構轉盤的試玩紀錄，把數量線索整理成可能性描述，再用另一組新紀錄比較。紀錄不是未來結果的保證。',
  coverage: freeze({ subitemId: 'SUB-MATH-STAGE3-D6-2-COMPARE-LIKELIHOOD-FROM-DATA', coveredByInteraction: freeze(['classify_observations', 'choose_response']), notCovered: freeze(['古典機率與精確機率值', '實際隨機試驗與長期頻率', '差異不明顯時的深入判斷']) }),
  learningSubitemClaims: freeze(['SUB-MATH-STAGE3-D6-2-COMPARE-LIKELIHOOD-FROM-DATA']),
  openQuestions: ['教師需確認學生能讀取次數資料並理解可能性用語。', '試玩紀錄是虛構資料，沒有實際抽樣或隨機裝置。', '此小範圍差異練習不代表完整機率概念。'],
  stages: [
    { stageId: 'classify-sample-count-evidence', interaction: 'classify_observations', prompt: '虛構轉盤試玩紀錄如下。根據每 10 次試玩中兩色出現的次數，分類哪一色在這份紀錄中較常出現或次數相同。', context: [{ speaker: '紀錄 A', text: '綠色 9 次、黃色 1 次。' }, { speaker: '紀錄 B', text: '綠色 2 次、黃色 8 次。' }, { speaker: '紀錄 C', text: '綠色 5 次、黃色 5 次。' }], observations: [{ id: 'record-a', text: '紀錄 A：綠色 9 次、黃色 1 次。' }, { id: 'record-b', text: '紀錄 B：綠色 2 次、黃色 8 次。' }, { id: 'record-c', text: '紀錄 C：綠色 5 次、黃色 5 次。' }], categories: [{ id: 'green-more', label: '紀錄中綠色較多' }, { id: 'yellow-more', label: '紀錄中黃色較多' }, { id: 'same-count', label: '紀錄中次數相同' }], correctAssignments: { 'record-a': 'green-more', 'record-b': 'yellow-more', 'record-c': 'same-count' }, hints: ['逐筆比較同一筆紀錄中的兩個次數，不要跨紀錄相加。', '9 比 1 多、8 比 2 多，5 和 5 相同；這只說明試玩紀錄。'], incorrectFeedback: '只依該筆資料的次數比較；不能把「紀錄較多」說成每次都必然出現。', correctFeedback: '你按紀錄整理出次數相對大小；虛構試玩資料不保證下一次結果。' },
    { stageId: 'compare-new-likelihood-record', interaction: 'choose_response', prompt: '新紀錄 D：藍色 9 次、橘色 1 次。哪句話符合資料且沒有把結果說成必然？', options: [{ id: 'blue-more-likely', text: '在這份紀錄中，藍色出現較多，因此依資料可說藍色比較可能；但下一次不保證是藍色。' }, { id: 'orange-certain', text: '下一次一定會出現橘色，因為它比較少。' }, { id: 'both-equal', text: '藍色和橘色次數相同。' }], correctOptionIds: ['blue-more-likely'], hints: ['把「資料中次數較多」和「下一次必然發生」分開。', '選擇同時反映 9 比 1 多、又沒有聲稱必然的說法。'], incorrectFeedback: '次數資料支持相對可能性的描述，不會保證下一次結果，也不能把 9 與 1 說成相同。', correctFeedback: '你依新數據做相對可能性判斷，並保留不確定性；單次資料題不等於掌握機率。' },
  ],
});

export const GRADE6_GCD_LCM_SHORT_DIVISION = candidate({
  activityId: 'ACT-G6-MATH-GCD-LCM-SHORT-DIVISION-CANDIDATE', subjectId: 'mathematics',
  title: '共同因數機關：短除法與分數化簡', curriculumMapId: 'math-grade6-gcd-lcm-short-division-candidate', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-6-2', 'n-III-3']),
  curriculumScope: '部分對應官方 N-6-2：以逐步選取短除結果求兩數最大公因數與最小公倍數，並用共同因數化簡分數；另以不同數字的同步任務檢查遷移。資料為預設數字情境，沒有學生自行排寫短除法或實物分裝證據；不處理三數GCD/LCM、通分完整程序與所有互質情境。學習階段為第三階段（五、六年級），不是六年級學期進度。',
  learningSubitemClaims: freeze(['SUB-MATH-G6-N6-2-SHORT-DIVISION-AND-FRACTION-SIMPLIFICATION']),
  learningObjective: freeze({ objectiveId: 'LO-G6-MATH-GCD-LCM-SHORT-DIVISION-01', statement: '逐步追蹤兩數共同短除的商，整理共同因數與剩餘因數以求最大公因數、最小公倍數，並將一個分數化為最簡分數。', status: 'candidate_pending_teacher_review' }),
  instructions: '沿著共同除數機關逐步檢查每一列商，再用相同的因數線索化簡分數。畫面是步驟選取練習，不等於學生自行書寫短除法。',
  openQuestions: ['教師需確認質因數、最大公因數與最小公倍數的先備及短除法課程進度。', '選取每步商數可檢查有限的程序理解，但不評量學生自行建構短除法版面或完整書寫。', '只使用兩組正整數與一個分數案例，未涵蓋三數或完整通分程序。'],
  stages: [
    {
      stageId: 'short-divide-eighteen-and-twenty-four', interaction: 'complete_calculation_steps',
      prompt: '同步整理 18 和 24。依序用共同質因數 2、再用 3 除兩數，最後讀出最大公因數與最小公倍數。', calculationTitle: '共同短除：18 與 24',
      calculationSteps: [
        { id: 'a-after-two', label: '第一列：18 ÷ 2 的商', expectedValue: 9, choices: [{ value: 9, label: '9' }, { value: 8, label: '8' }, { value: 6, label: '6' }] },
        { id: 'b-after-two', label: '第一列：24 ÷ 2 的商', expectedValue: 12, choices: [{ value: 12, label: '12' }, { value: 10, label: '10' }, { value: 8, label: '8' }] },
        { id: 'a-after-three', label: '第二列：9 ÷ 3 的商', expectedValue: 3, choices: [{ value: 3, label: '3' }, { value: 6, label: '6' }, { value: 2, label: '2' }] },
        { id: 'b-after-three', label: '第二列：12 ÷ 3 的商', expectedValue: 4, choices: [{ value: 4, label: '4' }, { value: 6, label: '6' }, { value: 3, label: '3' }] },
        { id: 'gcd-18-24', label: '共同因數乘積：2 × 3', expectedValue: 6, choices: [{ value: 6, label: '6' }, { value: 5, label: '5' }, { value: 9, label: '9' }] },
        { id: 'lcm-18-24', label: '共同因數 × 最後兩商：6 × 3 × 4', expectedValue: 72, choices: [{ value: 72, label: '72' }, { value: 48, label: '48' }, { value: 24, label: '24' }] },
      ],
      hints: ['每一列都要讓 18 和 24 同時除以相同的質因數；先追蹤兩個商。', '共同因數是 2 和 3；最大公因數把它們相乘，最小公倍數還要乘上最後的 3 和 4。'],
      incorrectFeedback: '回看第一個出錯的商：共同除數必須同時整除兩數。最大公因數只乘共同除數；最小公倍數再乘最後兩個商。',
      correctFeedback: '18 與 24 的最大公因數是 6，最小公倍數是 72。這是逐步選取商數的螢幕練習，不代表完整書寫技能。',
    },
    {
      stageId: 'simplify-eighteen-twenty-four', interaction: 'complete_calculation_steps',
      prompt: '利用 18 和 24 的共同因數，把 18/24 化成最簡分數。', calculationTitle: '分子與分母同步約分',
      calculationSteps: [
        { id: 'fraction-numerator-after-two', label: '分子：18 ÷ 2', expectedValue: 9, choices: [{ value: 9, label: '9' }, { value: 6, label: '6' }, { value: 18, label: '18' }] },
        { id: 'fraction-denominator-after-two', label: '分母：24 ÷ 2', expectedValue: 12, choices: [{ value: 12, label: '12' }, { value: 10, label: '10' }, { value: 8, label: '8' }] },
        { id: 'fraction-numerator-after-three', label: '再約分：9 ÷ 3', expectedValue: 3, choices: [{ value: 3, label: '3' }, { value: 6, label: '6' }, { value: 2, label: '2' }] },
        { id: 'fraction-denominator-after-three', label: '再約分：12 ÷ 3', expectedValue: 4, choices: [{ value: 4, label: '4' }, { value: 6, label: '6' }, { value: 3, label: '3' }] },
      ],
      hints: ['約分要對分子和分母使用同一個非零因數，分數大小才不變。', '先同除以 2 得到 9/12，再同除以 3；最後檢查 3 和 4 是否還有大於 1 的共同因數。'],
      incorrectFeedback: '分子和分母要同步除以同一因數；若只改其中一個，分數值會改變。完成後還要檢查是否仍可約分。',
      correctFeedback: '18/24 經共同約分成 3/4，分子與分母已沒有大於 1 的共同因數。此例不等於完整通分能力。',
    },
    {
      stageId: 'transfer-twelve-and-thirty', interaction: 'complete_calculation_steps',
      prompt: '換一組數字：兩盞訊號燈每 12 分鐘、每 30 分鐘亮一次。用共同短除追蹤商，求兩燈再次同時亮起所需的最少分鐘數。', calculationTitle: '新情境：12 與 30 的週期',
      calculationSteps: [
        { id: 'transfer-a-after-two', label: '共同除以 2：12 ÷ 2', expectedValue: 6, choices: [{ value: 6, label: '6' }, { value: 8, label: '8' }, { value: 4, label: '4' }] },
        { id: 'transfer-b-after-two', label: '共同除以 2：30 ÷ 2', expectedValue: 15, choices: [{ value: 15, label: '15' }, { value: 12, label: '12' }, { value: 10, label: '10' }] },
        { id: 'transfer-a-after-three', label: '共同除以 3：6 ÷ 3', expectedValue: 2, choices: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 1, label: '1' }] },
        { id: 'transfer-b-after-three', label: '共同除以 3：15 ÷ 3', expectedValue: 5, choices: [{ value: 5, label: '5' }, { value: 3, label: '3' }, { value: 6, label: '6' }] },
        { id: 'transfer-lcm', label: '最小公倍數：2 × 3 × 2 × 5', expectedValue: 60, choices: [{ value: 60, label: '60' }, { value: 30, label: '30' }, { value: 90, label: '90' }] },
      ],
      hints: ['週期再次同時出現，找兩個間隔的共同倍數；短除的共同因數先保留下來。', '最後商為 2 和 5，共同因數為 2、3；把 2×3×2×5 相乘。'],
      incorrectFeedback: '依次檢查兩個週期的商，再把共同除數與最後商相乘；答案必須同時是 12 和 30 的倍數。',
      correctFeedback: '12 與 30 的最小公倍數是 60，兩盞燈在 60 分鐘後再次同時亮起。這個情境只檢查一組新數字的遷移。',
    },
  ],
});

export const GRADE6_CANDIDATE_TASKS = Object.freeze([
  GRADE6_PRIME_FACTOR_EXPLORER,
  GRADE6_MULTI_STEP_REASONING,
  GRADE6_CHINESE_CAUSAL_INFERENCE,
  GRADE6_CHINESE_TEXT_STRUCTURE,
  GRADE6_SCIENCE_WEATHER_MAP,
  GRADE6_ENGLISH_INTRODUCTION,
  GRADE6_DATA_LIKELIHOOD_READER,
  GRADE6_GCD_LCM_SHORT_DIVISION,
]);
