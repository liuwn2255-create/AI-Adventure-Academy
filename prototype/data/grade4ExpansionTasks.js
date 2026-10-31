const freeze = (value) => Object.freeze(value);

const candidate = (task) => freeze({
  ...task,
  gradeId: 'grade-4',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: freeze(task.openQuestions ?? []),
  stages: freeze(task.stages.map(freeze)),
});

export const G4_LARGE_NUMBER_PLACE_VALUE = candidate({
  activityId: 'ACT-G4-MATH-LARGE-NUMBER-PLACE-VALUE-CANDIDATE', subjectId: 'mathematics',
  title: '大數位值運輸隊', curriculumMapId: 'math-grade4-large-number-place-value', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-4-1', 'n-II-1']),
  curriculumScope: '部分對應：操作萬、十萬等位值表徵並排列不超過一億的數；未涵蓋 N-4-1 全部大數應用與加減計算。第二學習階段表現不等於四年級特定進度。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-1-LARGE-NUMBER-PLACE-VALUE-REPRESENTATION'],
  coverage: Object.freeze({ subitemId: 'SUB-MATH-G4-N4-1-LARGE-NUMBER-PLACE-VALUE-REPRESENTATION', status: 'partial', limitation: '涵蓋位值拆解與排序，不含大數加減應用或完整一億範圍練習。' }),
  learningObjective: freeze({ objectiveId: 'LO-G4-MATH-LARGE-NUMBER-PLACE-VALUE-CANDIDATE-01', statement: '拆解一個一億以內的數，並依數值大小排列大數。', status: 'candidate_pending_teacher_review' }),
  instructions: '把貨運標籤上的大數拆成位值貨箱，再把運輸牌按數值由小到大排好。這是螢幕操作，不是正式評量。',
  openQuestions: ['需教師確認學生已學習萬、十萬及更高位值名稱。', '未確認教材、冊次、學期與班級進度。'],
  stages: [
    { stageId: 'decompose-large-number', interaction: 'collect_evidence', prompt: '數字 2,340,000 中，選出構成這個數的正確位值貨箱。', hints: ['從最左側的非零數字開始，逐位看它所在的位置。', '每個選項代表一個位值部分；選出合起來等於題目數字的部分。'], options: [{ id: 'two-million', text: '2,000,000' }, { id: 'three-hundred-thousand', text: '300,000' }, { id: 'four-ten-thousand', text: '40,000' }, { id: 'four-thousand', text: '4,000' }, { id: 'two-hundred-thousand', text: '200,000' }], correctOptionIds: ['two-million','three-hundred-thousand','four-ten-thousand'], incorrectFeedback: '把每一位數字和它的位置配對，再檢查各部分相加是否回到原數。', correctFeedback: '你選出的位值部分合計為 2,340,000；這只檢查本題的位值拆解。' },
    { stageId: 'order-cargo', interaction: 'order_items', prompt: '把三張運輸牌由小到大排列。', hints: ['先比較最高位，再往右找第一個不同的位。', '每張牌的最高位可能不同；確認數字位數後再逐位比較。'], items: [{ id: 'number-a', text: '450,000' }, { id: 'number-b', text: '405,000' }, { id: 'number-c', text: '540,000' }], initialOrder: ['number-c','number-a','number-b'], correctItemIds: ['number-b','number-a','number-c'], incorrectFeedback: '從最高位開始逐位比，不要只看數字中某一個較大的數字。', correctFeedback: '運輸牌已依數值由小到大排列；單題排序不能代表大數概念已完整掌握。' },
  ],
});

export const G4_MULTI_DIGIT_MULTIPLY_DIVIDE = candidate({
  activityId: 'ACT-G4-MATH-MULTI-DIGIT-MULTIPLY-DIVIDE-CANDIDATE', subjectId: 'mathematics',
  title: '位值計算控制台', curriculumMapId: 'math-grade4-multi-digit-multiply-divide', sourceId: 'mathematics',
  curriculumCodes: freeze(['N-4-2', 'n-II-2', 'n-II-3']),
  curriculumScope: '部分對應：以位值分解處理一題多位數乘法及一題二位數除法；除數／乘數不超過三位。未涵蓋 N-4-2 的所有直式型態與估商策略。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-2-PLACE-VALUE-CALCULATION-STEPS'],
  coverage: Object.freeze({ subitemId: 'SUB-MATH-G4-N4-2-PLACE-VALUE-CALCULATION-STEPS', status: 'partial', limitation: '用選取中間值模擬位值分步，不涵蓋所有直式型態、含0情境及大數除法估商策略。' }),
  learningObjective: freeze({ objectiveId: 'LO-G4-MATH-MULTI-DIGIT-MULTIPLY-DIVIDE-CANDIDATE-01', statement: '依位值分步計算多位數乘法與除法，檢查中間結果。', status: 'candidate_pending_teacher_review' }),
  instructions: '在控制台選擇每一步的中間數值。請把位值拆解及乘除關係用來檢查計算。',
  openQuestions: ['教師需確認學生已學過多位數直式乘除與估商。', '練習除法為整除，不代表已涵蓋有餘數情況。'],
  stages: [
    { stageId: 'multiply-by-place', interaction: 'complete_calculation_steps', calculationTitle: '326 × 24 的分步計算', prompt: '選出兩個部分積與最後的和。', hints: ['把 24 看成 20 和 4，分別計算再合併。', '先算 326×20，再算 326×4；最後將兩個部分積相加。'], calculationSteps: [{ id: 'times-twenty', label: '326 × 20', expectedValue: 6520, choices: [{ value: 6520, label: '6,520' }, { value: 652, label: '652' }, { value: 65200, label: '65,200' }], incorrectFeedback: '注意 20 是 2 個十，乘以 20 後需保留十位價值。' }, { id: 'times-four', label: '326 × 4', expectedValue: 1304, choices: [{ value: 1304, label: '1,304' }, { value: 1204, label: '1,204' }, { value: 130, label: '130' }], incorrectFeedback: '重新按位值計算 4 個 326。' }, { id: 'sum-parts', label: '部分積相加', expectedValue: 7824, choices: [{ value: 7824, label: '7,824' }, { value: 78240, label: '78,240' }, { value: 6520, label: '6,520' }], incorrectFeedback: '把兩個部分積相加，並逐位檢查。' }], incorrectFeedback: '查看控制台標出的錯誤步驟，重新核對位值及部分積。', correctFeedback: '分步結果相加為 7,824；本活動未要求口頭解釋所有直式策略。' },
    { stageId: 'divide-by-place', interaction: 'complete_calculation_steps', calculationTitle: '1,248 ÷ 24 的商', prompt: '依位值分步估商並填入商的十位、剩餘量與個位。', hints: ['先用 24×幾十接近 1,248，再處理剩餘部分。', '24×50=1,200，剩下的量再用 24 的整數倍檢查。'], calculationSteps: [{ id: 'tens-quotient', label: '先取商的十位（24 × 50）', expectedValue: 1200, choices: [{ value: 1200, label: '1,200' }, { value: 120, label: '120' }, { value: 1240, label: '1,240' }], incorrectFeedback: '先用 24×50 檢查是否接近被除數。' }, { id: 'remainder', label: '1,248 − 1,200', expectedValue: 48, choices: [{ value: 48, label: '48' }, { value: 408, label: '408' }, { value: 58, label: '58' }], incorrectFeedback: '逐位對齊相減，確認剩下的數量。' }, { id: 'ones-quotient', label: '剩下 48 還可分成幾個 24？', expectedValue: 2, choices: [{ value: 2, label: '2' }, { value: 1, label: '1' }, { value: 3, label: '3' }], incorrectFeedback: '用 24 的倍數檢查剩下的 48。' }], incorrectFeedback: '把被除數拆成已分配部分和剩餘部分，檢查每一步。', correctFeedback: '商為 52，因為 24×52=1,248；只表示本題計算流程正確。' },
  ],
});

export const G4_CHINESE_POLYSEMOUS_WORDS = candidate({
  activityId: 'ACT-G4-CHINESE-POLYSEMOUS-WORDS-CANDIDATE', subjectId: 'chinese-language',
  title: '多義字語境偵探', curriculumMapId: 'chinese-grade4-polysemous-word-context', sourceId: 'chinese-language', curriculumCodes: freeze(['Ab-Ⅱ-4','4-Ⅱ-5']),
  curriculumScope: '部分對應第二學習階段多義字及依字義推論詞義；僅練習「重」在兩種語境的意思，不代表常用字詞完整涵蓋。',
  learningObjective: freeze({ objectiveId: 'LO-G4-CHINESE-POLYSEMOUS-CANDIDATE-01', statement: '依句子語境判斷多義字「重」的詞義。', status: 'candidate_pending_teacher_review' }),
  instructions: '檢視句子線索，把含有「重」的語句放進符合語意的線索箱。',
  openQuestions: ['原創語句需教師確認詞彙難度、語境自然度及字音教學範圍。'],
  stages: [
    { stageId: 'sort-word-senses', interaction: 'classify_observations', prompt: '依句子意思，將「重」分成「重量大」或「再一次」兩類。', hints: ['先讀「重」前後的動作和物品，不要只看同一個字。', '能拿起來比較重量的是一類；表示再做一次的是另一類。'], observations: [{ id: 'box', text: '這個箱子很重，我需要兩手搬。' }, { id: 'read-again', text: '這段讀錯了，請重讀一次。' }, { id: 'bag', text: '背包裝滿書後變得很重。' }, { id: 'start-again', text: '遊戲沒成功，我們重來一次。' }], categories: [{ id: 'weight', label: '重量大' }, { id: 'again', label: '再一次' }], correctAssignments: { box: 'weight', 'read-again': 'again', bag: 'weight', 'start-again': 'again' }, incorrectFeedback: '用完整句子的語意判斷「重」描述重量，還是表示再次進行。', correctFeedback: '分類依據來自語境；本題只涵蓋這兩種常見用法。' },
    { stageId: 'choose-context-clue', interaction: 'collect_evidence', prompt: '選出最能支持「重」表示再一次的句子線索。', hints: ['找出句中表示重新做某件事的動作。', '留意「讀」或「來」後面是否出現「一次」。'], options: [{ id: 'read-once-more', text: '請重讀一次。' }, { id: 'heavy-box', text: '箱子很重。' }, { id: 'carry-with-two-hands', text: '我需要兩手搬。' }], correctOptionIds: ['read-once-more'], incorrectFeedback: '回看句中表示動作重做的詞語，再確認不是描述重量。', correctFeedback: '你用語境線索支持詞義判斷；未測量字典查詢或所有多義字。' },
  ],
});

export const G4_CHINESE_CAUSE_SENTENCE_BUILDER = candidate({
  activityId: 'ACT-G4-CHINESE-CAUSE-SENTENCE-BUILDER-CANDIDATE', subjectId: 'chinese-language',
  title: '句子連接工坊', curriculumMapId: 'chinese-grade4-causal-sentence-assembly', sourceId: 'chinese-language', curriculumCodes: freeze(['Ac-Ⅱ-3','6-Ⅱ-3']),
  curriculumScope: '部分對應第二學習階段基礎複句及寫作組織步驟：以語塊組合一個因果句；不等同於獨立寫作或完整寫作歷程。',
  learningObjective: freeze({ objectiveId: 'LO-G4-CHINESE-CAUSE-SENTENCE-CANDIDATE-01', statement: '組合語句，表達原因與結果的關係。', status: 'candidate_pending_teacher_review' }),
  instructions: '把語句拼片按語意關係排成完整句子，檢查原因和結果是否連得起來。',
  openQuestions: ['須教師確認複句先備及語塊選擇是否適齡。', '選擇語塊不等於學生能獨立寫作。'],
  stages: [
    { stageId: 'assemble-cause-result', interaction: 'assemble_response', prompt: '用語塊組成一個清楚的因果句。', hints: ['先找出原因，再找出結果。', '用「因為」引出原因，並以「所以」連到結果。'], tokens: [{ id: 'because', text: '因為' }, { id: 'rain', text: '下了一場大雨，' }, { id: 'so', text: '所以' }, { id: 'field-wet', text: '操場變得濕滑。' }, { id: 'but', text: '但是' }], correctOptionIds: ['because','rain','so','field-wet'], incorrectFeedback: '檢查連接詞與前後語意：原因應在前，結果在後。', correctFeedback: '句子表達出原因與結果；仍需其他情境確認能否自行造句。' },
    { stageId: 'repair-sentence', interaction: 'assemble_response', prompt: '重新組合語塊，讓「先準備、後出發」的順序清楚。', hints: ['留意題目要表達的是時間先後，不是原因結果。', '先放準備動作，再放出發動作，選擇能連接兩者的詞。'], tokens: [{ id: 'first', text: '先把水壺裝滿，' }, { id: 'then', text: '再' }, { id: 'go', text: '和同伴一起出發。' }, { id: 'because', text: '因為' }], correctOptionIds: ['first','then','go'], incorrectFeedback: '檢查句子是否依「先做什麼、再做什麼」連接。', correctFeedback: '語句次序與時間關係相符；單次拼句不能證明寫作能力。' },
  ],
});

export const G4_SCIENCE_WEATHER_DATA_STATION = candidate({
  activityId: 'ACT-G4-SCIENCE-WEATHER-DATA-STATION-CANDIDATE', subjectId: 'natural-science',
  title: '天氣資料觀測站', curriculumMapId: 'science-grade4-weather-observation-data', sourceId: 'natural-science', curriculumCodes: freeze(['INd-Ⅱ-7','pa-Ⅱ-1']),
  curriculumScope: '部分對應第二學習階段氣象資料表達與整理：使用預先提供的模擬觀測卡製作分類表；不評量儀器操作或實際天氣觀察。',
  learningObjective: freeze({ objectiveId: 'LO-G4-SCIENCE-WEATHER-DATA-CANDIDATE-01', statement: '依模擬觀測卡整理天氣現象資料，並提出受資料支持的描述。', status: 'candidate_pending_teacher_review' }),
  instructions: '這是虛構觀測站的文字模擬。先按紀錄中的天氣現象分類，再用分類結果回答問題。',
  openQuestions: ['需教師確認天氣詞彙與資料表閱讀先備。', '目前沒有真實儀器、天氣資料或戶外觀察。'],
  stages: [
    { stageId: 'sort-weather-records', interaction: 'build_frequency_table', tableTitle: '四天降雨紀錄分類表', tableMeasure: '雨量是否大於 0 毫米', prompt: '依觀測卡記錄，把每一天分類為「有降雨」或「未記錄降雨」。', hints: ['只根據紀錄的雨量欄，不要依雲量猜測。', '雨量大於 0 的卡片放進有降雨；雨量為 0 的放另一類。'], observations: [{ id: 'day1', text: '週一：雨量 0 毫米，陰天。' }, { id: 'day2', text: '週二：雨量 4 毫米，小雨。' }, { id: 'day3', text: '週三：雨量 0 毫米，多雲。' }, { id: 'day4', text: '週四：雨量 2 毫米，短暫降雨。' }], categories: [{ id: 'rain', label: '有降雨' }, { id: 'no-rain', label: '未記錄降雨' }], correctAssignments: { day1: 'no-rain', day2: 'rain', day3: 'no-rain', day4: 'rain' }, incorrectFeedback: '逐張查看雨量數值，再分類；「陰天」不能單獨取代雨量紀錄。', correctFeedback: '資料表按雨量紀錄完成分類；數據是虛構示例。' },
    { stageId: 'state-data-boundary', interaction: 'choose_response', prompt: '根據這四張卡，哪個描述最符合資料？', hints: ['把分類結果數一遍，並限制描述在這四天。', '不要從短短四筆資料推論整個季節或地區的天氣。'], options: [{ id: 'two-days', text: '這四天中，有兩天記錄到降雨。' }, { id: 'always-rain', text: '這個地區每天都會下雨。' }, { id: 'season-climate', text: '這個季節一定比其他季節潮濕。' }], correctOptionIds: ['two-days'], incorrectFeedback: '讓描述的範圍和資料筆數相符，避免把少量紀錄擴大成氣候結論。', correctFeedback: '你依四筆紀錄作了有限描述；這不是氣象預報或氣候推論。' },
  ],
});

export const G4_SCIENCE_PLANT_GROWTH_MEASUREMENTS = candidate({
  activityId: 'ACT-G4-SCIENCE-PLANT-GROWTH-MEASUREMENTS-CANDIDATE', subjectId: 'natural-science',
  title: '豆苗成長觀察記錄', curriculumMapId: 'science-grade4-measured-change-records', sourceId: 'natural-science', curriculumCodes: freeze(['INd-Ⅱ-2','pa-Ⅱ-1']),
  curriculumScope: '部分對應第二學習階段以工具與方法得知改變：學生操作模擬數線整理已提供的豆苗高度紀錄；不代表真實種植、尺具量測或探究變因控制。',
  learningObjective: freeze({ objectiveId: 'LO-G4-SCIENCE-PLANT-GROWTH-CANDIDATE-01', statement: '依時間順序整理植物高度的模擬測量紀錄，並讀取指定紀錄值。', status: 'candidate_pending_teacher_review' }),
  instructions: '查看虛構豆苗的高度紀錄，排列測量日期，再把標記放到指定日期的讀數。',
  openQuestions: ['需教師確認測量單位與資料讀取先備。', '螢幕模擬沒有真實植物、尺具或學生測量行為。'],
  stages: [
    { stageId: 'order-growth-records', interaction: 'order_items', prompt: '依測量日期由早到晚排列豆苗紀錄。', hints: ['先找出紀錄上的第幾天，再看高度變化。', '日期先後決定排列順序，不能只按高度猜。'], items: [{ id: 'd1', text: '第 1 天：2 公分' }, { id: 'd2', text: '第 2 天：3 公分' }, { id: 'd3', text: '第 3 天：5 公分' }], initialOrder: ['d3','d1','d2'], correctItemIds: ['d1','d2','d3'], incorrectFeedback: '依日期排序，並確認每筆高度仍和原紀錄配對。', correctFeedback: '紀錄按時間排列完成；高度數字是模擬資料。' },
    { stageId: 'read-height', interaction: 'place_number_line_marker', prompt: '在 0 到 10 公分的數線上，標出第 3 天的高度。', hints: ['先讀取第 3 天紀錄，再找數線上相同的刻度。', '每一格代表 1 公分，從 0 開始逐格數。'], numberLine: { start: 0, end: 10, tickCount: 10, targetTick: 5, valueFormat: 'integer' }, incorrectFeedback: '回到第 3 天的紀錄，確認數值後再沿著等距刻度定位。', correctFeedback: '標記和模擬紀錄一致；未測量學生實際使用尺具的能力。' },
  ],
});

export const G4_SOCIAL_LOCAL_HISTORY_TIMELINE = candidate({
  activityId: 'ACT-G4-SOCIAL-LOCAL-HISTORY-TIMELINE-CANDIDATE', subjectId: 'social-studies',
  title: '地方記憶時間線', curriculumMapId: 'social-grade4-local-history-evidence', sourceId: 'social-studies', curriculumCodes: freeze(['Cb-Ⅱ-1','3b-Ⅱ-2']),
  curriculumScope: '部分對應第二學習階段 Cb-Ⅱ-1 與 3b-Ⅱ-2 的局部資料摘取：排列虛構年代卡、選擇交通變化證據，並區分記錄的變化與未提供的原因。情境全為虛構資料，不提供真實地方史，也不代表完整歷史探究。',
  learningObjective: freeze({ objectiveId: 'LO-G4-SOCIAL-HISTORY-TIMELINE-CANDIDATE-01', statement: '依虛構資料卡排序年代、選取變化證據，並限制結論在資料明確記錄的範圍內。', status: 'candidate_pending_teacher_review' }),
  instructions: '比較明確標示為虛構的社區資料卡：先排年代、找交通設施變化的證據，再判斷資料沒有說明哪些原因。',
  openQuestions: ['需教師確認年代標示的理解先備與本地教材安排。', '資料情境是虛構示例，不可作為真實社區歷史內容。'],
  stages: [
    { stageId: 'order-local-records', interaction: 'order_items', prompt: '依卡片上的年代由早到晚排列虛構社區紀錄。', hints: ['先看每張卡的年份，不要先依事件內容猜先後。', '把較早的年份放前面，再逐年向後排列。'], items: [{ id: 'photo', text: '1990 年：老照片記錄一條土路。' }, { id: 'bridge', text: '2005 年：資料卡記錄新橋完工。' }, { id: 'today', text: '2020 年：資料卡記錄道路旁增加公車站。' }], initialOrder: ['today','photo','bridge'], correctItemIds: ['photo','bridge','today'], incorrectFeedback: '以卡片年代作為排序證據，不要把虛構事件當成真實地方史。', correctFeedback: '時間線符合卡片上的年代順序。' },
    { stageId: 'select-history-evidence', interaction: 'collect_evidence', prompt: '選出能直接支持「虛構社區交通設施有變化」的資料卡。', hints: ['找出不同年代、內容與交通設施相關的記錄。', '只有卡片明確記下道路或公車站的資料才算直接證據。'], options: [{ id: 'road', text: '1990 年土路照片。' }, { id: 'bus-stop', text: '2020 年道路旁增加公車站的紀錄。' }, { id: 'weather', text: '資料卡未提到的天氣推測。' }], correctOptionIds: ['road','bus-stop'], incorrectFeedback: '區分資料卡明確記載的資訊和沒有來源的推測。', correctFeedback: '你選到兩筆直接相關的虛構交通資料；仍需真實地方資料才能做地方史探究。' },
    { stageId: 'limit-history-conclusion', interaction: 'choose_response', prompt: '只看這三張虛構資料卡，哪個說法最符合證據範圍？', hints: ['把時間線上看得到的改變，和資料沒有說明的原因分開。', '能說明「記錄到哪些不同」，但不能從卡片猜測為什麼發生。'], options: [{ id: 'change-only', text: '資料卡記錄了土路、橋和公車站的不同時期情形，但沒有說明改變原因。' }, { id: 'cause-claimed', text: '新橋一定是因為居民增加才興建。' }, { id: 'universal-claim', text: '所有地方都會依照相同順序修路、建橋、設公車站。' }], correctOptionIds: ['change-only'], incorrectFeedback: '先指出資料直接記錄的差異；成因和普遍規律未出現在這組虛構資料中。', correctFeedback: '你把觀察到的時間差異和尚無證據的原因分開。這不等於真實地方歷史調查。' },
  ],
});

export const G4_ARTS_VISUAL_COMPOSITION = candidate({
  activityId: 'ACT-G4-ARTS-VISUAL-COMPOSITION-CANDIDATE', subjectId: 'arts',
  title: '色彩與造形拼貼工坊', curriculumMapId: 'arts-grade4-visual-elements-composition', sourceId: 'arts', curriculumCodes: freeze(['視 E-Ⅱ-1','視 E-Ⅱ-3','1-Ⅱ-2','1-Ⅱ-6']),
  curriculumScope: '部分對應第二學習階段視 E-Ⅱ-1 的色彩、造形與空間探索：選擇素材、排列拼片並在一關比較圖形種類與位置規則。未評量實體媒材技巧、學生自主創作意圖表達或教師美感判斷。',
  learningObjective: freeze({ objectiveId: 'LO-G4-ARTS-VISUAL-COMPOSITION-CANDIDATE-01', statement: '操作色彩與造形拼片，依素材條件及空間位置規則完成並檢查視覺構成。', status: 'candidate_pending_teacher_review' }),
  instructions: '在螢幕拼貼板選取圖形片並依序放入位置，完成素材構成及位置交替挑戰，觀察位置如何改變圖案。',
  openQuestions: ['需教師確認是否應允許多種合理構成，以及美感回饋方式。', '此數位拼貼不能取代實體媒材探索。'],
  stages: [
    { stageId: 'compose-window-mosaic', interaction: 'compose_shape', prompt: '在 2×2 拼貼板放入兩個三角片和兩個圓片，完成「窗花」構成。', hints: ['先數拼貼板共有幾格，再確認兩種造形的數量要求。', '只選兩個三角片與兩個圓片；拼片選取後會依序顯示在板上。'], pieces: [{ id: 'triangle-red', label: '紅色三角片', shape: 'triangle' }, { id: 'triangle-blue', label: '藍色三角片', shape: 'triangle' }, { id: 'circle-yellow', label: '黃色圓片', shape: 'circle' }, { id: 'circle-green', label: '綠色圓片', shape: 'circle' }, { id: 'square-purple', label: '紫色方片', shape: 'square' }], shapeRules: { rows: 2, columns: 2, correctPieceIds: ['triangle-red','triangle-blue','circle-yellow','circle-green'] }, incorrectFeedback: '檢查拼貼板是否剛好放滿四格，並符合兩個三角片、兩個圓片的條件。', correctFeedback: '指定造形數量已完成；拼片順序沒有被評分，也不代表唯一的美術創作方式。' },
    { stageId: 'compose-color-balance', interaction: 'compose_shape', prompt: '用一個紅色圓片和一個藍色方片，組成雙色小圖案。', hints: ['先看清楚要求的兩種顏色與造形。', '挑選名稱同時符合顏色和造形的拼片。'], pieces: [{ id: 'red-circle', label: '紅色圓片', shape: 'circle' }, { id: 'blue-square', label: '藍色方片', shape: 'square' }, { id: 'red-square', label: '紅色方片', shape: 'square' }], shapeRules: { rows: 1, columns: 2, correctPieceIds: ['red-circle','blue-square'] }, incorrectFeedback: '逐片核對顏色與造形，不需要推測哪種排列比較漂亮。', correctFeedback: '你完成了指定的雙色構成；活動未評分審美偏好或自主創作意圖。' },
    { stageId: 'compose-alternating-window', interaction: 'compose_shape', prompt: '在 2×2 拼貼板依序安排圖形，讓每一列都呈現「三角片、圓片」的交替節奏。比較位置會改變圖案，不只要選對圖形。', hints: ['先想像四個位置：左上、右上、左下、右下。', '兩列都要由三角片開始、接著放圓片；看拼貼板上的順序是否符合。'], pieces: [{ id: 'pattern-triangle-red', label: '紅色三角片', shape: 'triangle' }, { id: 'pattern-circle-yellow', label: '黃色圓片', shape: 'circle' }, { id: 'pattern-triangle-blue', label: '藍色三角片', shape: 'triangle' }, { id: 'pattern-circle-green', label: '綠色圓片', shape: 'circle' }, { id: 'pattern-square', label: '紫色方片', shape: 'square' }], shapeRules: { rows: 2, columns: 2, correctPieceIds: ['pattern-triangle-red','pattern-circle-yellow','pattern-triangle-blue','pattern-circle-green'], correctPieceOrder: ['pattern-triangle-red','pattern-circle-yellow','pattern-triangle-blue','pattern-circle-green'] }, incorrectFeedback: '先檢查每一列的兩個位置：三角片應在左側，圓片在右側。被選中的圖形即使種類正確，放錯位置也不符合這個構成規則。', correctFeedback: '你依位置規則完成兩列交替構成；這是受規則引導的數位拼貼，不代表自由創作或美感判斷。' },
  ],
});

export const GRADE4_EXPANSION_TASKS = freeze([
  G4_LARGE_NUMBER_PLACE_VALUE, G4_MULTI_DIGIT_MULTIPLY_DIVIDE,
  G4_CHINESE_POLYSEMOUS_WORDS, G4_CHINESE_CAUSE_SENTENCE_BUILDER,
  G4_SCIENCE_WEATHER_DATA_STATION, G4_SCIENCE_PLANT_GROWTH_MEASUREMENTS,
  G4_SOCIAL_LOCAL_HISTORY_TIMELINE, G4_ARTS_VISUAL_COMPOSITION,
]);
