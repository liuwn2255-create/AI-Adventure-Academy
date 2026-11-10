const freezeStage = (stage) => Object.freeze(stage);
const candidate = (task) => Object.freeze({
  ...task,
  gradeId: 'grade-4',
  sourceId: ({ mathematics: 'mathematics', 'chinese-language': 'chinese-language', 'natural-science': 'natural-science' })[task.subjectId],
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(task.openQuestions ?? []),
  stages: Object.freeze(task.stages.map(freezeStage)),
});

export const GRADE4_MATH_FRACTION_TILES = candidate({
  activityId: 'ACT-G4-MATH-FRACTION-TILES-CANDIDATE', subjectId: 'mathematics',
  title: '分數拼片研究所', curriculumMapId: 'math-grade4-common-denominator-fractions',
  curriculumCodes: Object.freeze(['N-4-5', 'n-II-6']),
  curriculumScope: '部分對應：以等分拼片表示 3/6、比較同分母真分數，並在新分數帶表示 4/5；未涵蓋 N-4-5 的假分數、帶分數轉換、加減與整數倍全範圍。官方內容列於四年級學習內容表；學習表現為第二學習階段，未推定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-5-FRACTION-BAR-REPRESENT-COMPARE'],
  coverage: Object.freeze({ subitemId: 'SUB-MATH-G4-N4-5-FRACTION-BAR-REPRESENT-COMPARE', status: 'partial', limitation: '只練習真分數拼片表示與同分母比較，不含假分數、帶分數轉換、同分母加減或整數倍。' }),
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-MATH-FRACTION-TILES-CANDIDATE-01', statement: '用等大的單位拼片表示分數、比較分母相同的分數，並把表示方法轉用到新分數帶。', status: 'candidate_pending_teacher_review' }),
  instructions: '在螢幕上選取分數帶拼片表示分數，先比較同分母分數，再換一條分數帶完成轉用練習。這是螢幕圖形操作，不代表實體操作證據。',
  openQuestions: ['需教師確認學生已理解整體相同且分割等大的先備。', '未確認教材版本、冊次、學期與班級進度。'],
  stages: [
    { stageId: 'shade-three-sixths', interaction: 'compose_shape', prompt: '分數帶的 6 個等大單位中，選出 3 個拼片放入承載區，表示 3/6。', hints: ['分母表示整條相同大小的分數帶分成幾個等大單位。', '分子表示要取幾個單位；從六個拼片中選取，再數一遍。'], incorrectFeedback: '請檢查分數帶共分成 6 個等大單位，而選取數量是否符合分子。重試時逐格點數。', correctFeedback: '你從六個等大單位中選出指定數量。這只能支持本題的圖像表示，仍需其他題型確認理解。', pieces: [0,1,2,3,4,5].map((n) => ({ id: `sixth-${n+1}`, label: `第 ${n+1} 個等大拼片`, shape: 'square' })), shapeRules: { rows: 1, columns: 3, correctPieceIds: ['sixth-1','sixth-2','sixth-3'] } },
    { stageId: 'compare-fifths', interaction: 'choose_response', prompt: '兩條相同大小的分數帶都分成 5 格。哪一個分數較大：2/5 還是 4/5？', hints: ['比較前先確認兩個分數的整體大小與分割格數相同。', '分母相同時，觀察被選取的等大格子數量。'], options: [{ id: 'two-fifths', text: '2/5', feedback: '請再數兩條分數帶中各有幾格被選取。' }, { id: 'four-fifths', text: '4/5', feedback: '相同大小的整體中，選取格子較多者較大。' }], correctOptionIds: ['four-fifths'], incorrectFeedback: '回到相同大小、同樣分成 5 格的條帶，再比較著色格數。', correctFeedback: '你依同分母的等分單位完成比較。單次選答不證明已掌握同分母分數。' },
    { stageId: 'build-four-fifths-transfer', interaction: 'compose_shape', prompt: '新的分數帶分成 5 個等大單位。選取 4 個單位表示 4/5；留下一格空白。', hints: ['分母 5 是整條分數帶的等分總數；拼圖板有五個位置。', '分子 4 是要選取的單位數；數一數已放入的圖形片，保留一格空白。'], pieces: [0,1,2,3,4].map((n) => ({ id: `fifth-${n+1}`, label: `新的第 ${n+1} 個等大拼片`, shape: 'square' })), shapeRules: { rows: 1, columns: 5, selectionCount: 4, correctPieceIds: ['fifth-1','fifth-2','fifth-3','fifth-4'] }, incorrectFeedback: '分母表示分數帶的等分總數，分子表示選取的單位數；核對五個位置中是否選了四個。', correctFeedback: '你在五個等分位置中選出四個，並保留一格，表示 4/5。單次拼片練習仍不足以證明穩定掌握。' },
    {stageId:'build-seven-fourths',interaction:'compose_shape',prompt:'兩條同樣大的分數帶各分成4片，選7片表示7/4，也就是1又3/4。',pieces:Array.from({length:8},(_,i)=>({id:'quarter-'+(i+1),label:'四分之一片 '+(i+1),shape:'square'})),shapeRules:{rows:2,columns:4,selectionCount:7,correctPieceIds:Array.from({length:7},(_,i)=>'quarter-'+(i+1))},hints:['四片組成一個整體。','再取三片。'],incorrectFeedback:'先組成完整四片，再取三片。',correctFeedback:'7/4＝1又3/4。'},
  ],
});

const fractionPieces = (prefix, count) => Array.from({ length: count }, (_, index) => ({
  id: `${prefix}-${index + 1}`,
  label: `第 ${index + 1} 個等大分數片`,
  shape: 'square',
}));

export const GRADE4_MATH_FRACTION_EQUIVALENCE = candidate({
  activityId: 'ACT-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE', subjectId: 'mathematics',
  title: '等值分數拼片探險', curriculumMapId: 'math-grade4-equivalent-fractions',
  curriculumCodes: Object.freeze(['N-4-6', 'n-II-6']),
  curriculumScope: '部分對應 N-4-6：以相同大小的整體操作不同等分，建構並遷移辨認 1/2＝2/4、2/5＝4/10、1/2＝3/6。未涵蓋簡單異分母分數加減及簡單分數與小數互換；螢幕拼片不等同實體操作。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE-01', statement: '在相同大小的整體上操作不同等分拼片，說明被選取的部分雖然片數不同，仍可表示相同的量。', status: 'candidate_pending_teacher_review' }),
  instructions: '每一關都用同樣長的分數帶。參照帶已表示一個分數，請在另一條分割方式不同的分數帶上選片，讓兩條表示相同的量。',
  openQuestions: ['需教師確認等值分數與相同大小整體的先備是否已教。', '本關為螢幕操作候選活動，未經學生試教；教師可搭配紙條或實體分數片再觀察。'],
  learningSubitemClaims: ['SUB-MATH-G4-N4-6-EQUIVALENT-FRACTIONS-MODEL-TRANSFER'],
  coverage: Object.freeze({ subitemId: 'SUB-MATH-G4-N4-6-EQUIVALENT-FRACTIONS-MODEL-TRANSFER', status: 'partial', limitation: '只涵蓋簡單等值分數模型與新分割遷移，不含異分母運算或分數小數互換。' }),
  stages: [
    { stageId: 'match-half-with-two-fourths', interaction: 'compose_shape', prompt: '參照帶的 2 格中有 1 格塗色（1/2）。在同樣長、分成 4 格的新帶上，選出相同長度的部分。', hints: ['兩條分數帶的整體一樣長；先比較塗色部分佔整條的長度。', '4 格的新帶要選出和參照 1/2 一樣長的部分，再數選了幾格。'], pieces: fractionPieces('fourth', 4), shapeRules: { rows: 1, columns: 4, selectionCount: 2, correctPieceIds: ['fourth-1', 'fourth-2'] }, incorrectFeedback: '不要只比較片數。兩條帶的整體一樣長，請比較新帶選片後是否剛好覆蓋參照帶的一半。', correctFeedback: '你用兩個四分之一拼出和一個二分之一相同的長度。這是一次圖像模型操作，還需新情境檢查遷移。' },
    { stageId: 'match-two-fifths-with-four-tenths', interaction: 'compose_shape', prompt: '參照帶有 5 格中的 2 格塗色（2/5）。在同樣長、分成 10 格的新帶上，拼出相同長度。', hints: ['新帶每一格比參照帶的格子更短，但整條仍一樣長。', '每一個五分之一可由兩個十分之一拼成；用拼片比對長度。'], pieces: fractionPieces('tenth', 10), shapeRules: { rows: 2, columns: 5, selectionCount: 4, correctPieceIds: ['tenth-1', 'tenth-2', 'tenth-3', 'tenth-4'] }, incorrectFeedback: '請比較兩條分數帶的塗色長度，而不是只看選了幾片。每一個五分之一對應兩個十分之一。', correctFeedback: '四個十分之一拼出的長度和兩個五分之一相同；這仍只支持本題模型。' },
    { stageId: 'transfer-half-to-sixths', interaction: 'compose_shape', prompt: '新任務：參照帶的一半塗色。另一條一樣長的帶分成 6 格，選片表示相同的量。', hints: ['先確認兩條帶代表相同大小的整體。', '將 6 格平均分成兩組，選其中一組，並想想這個分數如何寫。'], pieces: fractionPieces('sixth', 6), shapeRules: { rows: 2, columns: 3, selectionCount: 3, correctPieceIds: ['sixth-1', 'sixth-2', 'sixth-3'] }, incorrectFeedback: '回到「相同大小整體」的條件，確認你選出的部分是否覆蓋一半，而非只套用前一題的片數。', correctFeedback: '你在新的等分方式中重建了相同的量。這項遷移證據仍不代表已掌握 N-4-6 全部內容。' },
    {stageId:'add-half-and-quarter',interaction:'compose_shape',prompt:'把1/2換成2/4，再加1/4。在四等分帶上選出總量。',pieces:fractionPieces('sum-quarter',4),shapeRules:{rows:1,columns:4,selectionCount:3,correctPieceIds:['sum-quarter-1','sum-quarter-2','sum-quarter-3']},hints:['1/2等於2/4。','再加一片四分之一。'],incorrectFeedback:'先統一成四分之一，再數總片數。',correctFeedback:'1/2＋1/4＝3/4。'},
  ],
});

export const GRADE4_MATH_TWO_STEP_SUPPLY = candidate({
  activityId: 'ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE', subjectId: 'mathematics',
  title: '補給車隊兩步任務', curriculumMapId: 'math-grade4-multiplicative-two-step',
  curriculumCodes: Object.freeze(['N-4-3', 'n-II-5']),
  curriculumScope: '部分對應 N-4-3：以陣列建模乘法總量、組出算式，再用中間結果處理等分除；另以不同情境操作連除，並呈現等分除與包含除兩種未知量。未涵蓋有餘數除法、完整乘除策略或 R-4-1 併式運算約定。官方四年級表 N-4-3，PDF頁序28；對應 n-II-5，第二學習階段表現。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-3-TWO-STEP-MULTIPLICATION-DIVISION-MODEL'],
  coverage: Object.freeze({ subitemId: 'SUB-MATH-G4-N4-3-TWO-STEP-MULTIPLICATION-DIVISION-MODEL', status: 'partial', limitation: '螢幕陣列建模一種乘法後等分除及一種連除情境，並透過不同問題區分每份量與組數；僅整除，不涵蓋餘數、完整應用題策略或併式約定。' }),
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-MATH-TWO-STEP-CANDIDATE-01', statement: '用陣列表示乘法總量，組出相符算式，再把中間結果用於等分除或連除情境。', status: 'candidate_pending_teacher_review' }),
  instructions: '在補給站先用方陣排出物資，再把模型寫成算式。接著讀清楚問題要找「每隊有幾份」還是「能裝成幾組」，把第一步的結果帶到下一步。',
  openQuestions: ['須由教師確認乘法、整除及等分除／包含除的先備與用語。', '所有數量均整除；本活動不涉及餘數。', '陣列是螢幕模型，不能代替實物分配及學生口頭解釋。'],
  stages: [
    { stageId: 'model-six-cartons-four-packs', interaction: 'build_array', prompt: '第一站有 6 箱補給，每箱 4 包。先排出 6 排、每排 4 包的陣列，看看總量如何形成。', hints: ['排數代表箱數，每排包數代表每箱的數量。', '把排數調成 6、每排數量調成 4；總數會顯示在陣列上方。'], arrayRules: { targetRows: 6, targetColumns: 4, maxRows: 8, maxColumns: 8 }, resultValue: 24, incorrectFeedback: '逐項對照情境：要有 6 排，每排 4 個。調整排數和每排個數後再檢查。', correctFeedback: '陣列呈現 6 組、每組 4 包，共 24 包。這是乘法總量模型，不表示已掌握所有乘除應用。' },
    { stageId: 'record-carton-multiplication', interaction: 'assemble_response', prompt: '把剛才的陣列記成算式：6 箱、每箱 4 包，一共 24 包。依順序組出算式。', hints: ['先放表示箱數的 6，再放乘號和每箱包數 4。', '算式順序是「組數 × 每組量」，不是把 6 和 4 相加。'], tokens: [{ id: 'six', text: '6' }, { id: 'multiply', text: '×' }, { id: 'four', text: '4' }, { id: 'plus', text: '+' }], correctOptionIds: ['six', 'multiply', 'four'], resultValue: 24, incorrectFeedback: '核對陣列代表幾組、每組多少；選出乘法符號並依序排列三個算式片段。', correctFeedback: '6 × 4 對應 6 組、每組 4 包，結果 24。算式已連回數量模型。' },
    { stageId: 'share-twenty-four-packs', interaction: 'choose_response', prompt: '24 包平均分給 3 隊，每隊幾包？這題已知隊數，要找每份量。', hints: ['等分除：把總數分成指定的 3 份。', '用上一站的總數 24 除以 3，再乘回 3 檢查。'], options: [{ id: '6', value: 6, text: '6 包', feedback: '3 隊各 6 包合起來不是 24。' }, { id: '8', value: 8, text: '8 包', feedback: '3 隊各 8 包合起來是 24。' }, { id: '12', value: 12, text: '12 包', feedback: '每隊 12 包會讓總數超過 24。' }], correctOptionIds: ['8'], deriveFromPrevious: { operation: 'divide', operand: 3 }, resultValue: 8, incorrectFeedback: '問題給了隊數，要找每隊份量；檢查「每隊份量 × 3 = 24」。', correctFeedback: '每隊 8 包，三隊合計 24 包。等分除要找的是每份量。' },
    { stageId: 'model-five-crates-six-packs', interaction: 'build_array', prompt: '第二個任務：5 箱種子卡，每箱 6 包。用陣列表示總包數，為後面的分裝做準備。', hints: ['先把 5 箱看成 5 排。', '每排放 6 包；確認模型顯示 30 包。'], arrayRules: { targetRows: 5, targetColumns: 6, maxRows: 8, maxColumns: 8 }, resultValue: 30, incorrectFeedback: '檢查排數是否等於箱數 5，每排數量是否等於 6。', correctFeedback: '5 組各 6 包共 30 包；接下來要用這個總數做連續分裝。' },
    { stageId: 'count-five-pack-bundles', interaction: 'choose_response', prompt: '把 30 包種子卡每 5 包裝成一袋，可以裝成幾袋？這次每袋量已知，要找組數。', hints: ['這是包含除：每組固定 5 包，數一數能有幾組。', '計算 30 ÷ 5，並確認「袋數 × 5 = 30」。'], options: [{ id: '5', value: 5, text: '5 袋', feedback: '5 袋每袋 5 包，合計只有 25 包。' }, { id: '6', value: 6, text: '6 袋', feedback: '6 袋每袋 5 包，合計 30 包。' }, { id: '25', value: 25, text: '25 袋', feedback: '25 袋遠超過可用包數。' }], correctOptionIds: ['6'], deriveFromPrevious: { operation: 'divide', operand: 5 }, resultValue: 6, incorrectFeedback: '每袋固定 5 包，題目問能裝幾袋；用總包數除以每袋量，再乘回檢查。', correctFeedback: '可以裝 6 袋。包含除要找的是組數，和上一題找每份量的未知量不同。' },
    { stageId: 'chain-divide-packets-into-trays', interaction: 'choose_response', prompt: '最後把這 6 袋每 2 袋放一個托盤，可以放滿幾個托盤？把前一步的組數繼續除下去。', hints: ['每個托盤固定放 2 袋，已知每組量，要找托盤組數。', '用 6 ÷ 2，並用「托盤數 × 2 = 6 袋」驗算。'], options: [{ id: '2', value: 2, text: '2 個托盤', feedback: '2 個托盤每個放 2 袋，只放了 4 袋。' }, { id: '3', value: 3, text: '3 個托盤', feedback: '3 個托盤每個放 2 袋，剛好放完 6 袋。' }, { id: '4', value: 4, text: '4 個托盤', feedback: '4 個托盤需要 8 袋，超過現有數量。' }], correctOptionIds: ['3'], deriveFromPrevious: { operation: 'divide', operand: 2 }, incorrectFeedback: '沿用上一題的 6 袋，不是原先的 30 包；再依每盤 2 袋求托盤數。', correctFeedback: '連除得到 3 個托盤。兩步都使用前一步結果；這些是整除情境，未涵蓋有餘數。' },
  ],
});

export const GRADE4_CHINESE_TEXT_EVIDENCE = candidate({
  activityId: 'ACT-G4-CHINESE-TEXT-EVIDENCE-CANDIDATE', subjectId: 'chinese-language',
  title: '故事線索檢察隊', curriculumMapId: 'chinese-grade4-text-evidence-inference', curriculumCodes: Object.freeze(['5-Ⅱ-4', '5-Ⅱ-7', '5-Ⅱ-8', 'Ad-Ⅱ-2']),
  curriculumScope: '部分對應第二學習階段閱讀表現與篇章大意；不代表四年級全學期閱讀能力，也未確認校本進度。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-CHINESE-EVIDENCE-CANDIDATE-01', statement: '從短文摘取支持問題的文字線索，並區分文本證據與推測。', status: 'candidate_pending_teacher_review' }),
  instructions: '讀一段原創短文，先收集能支持問題的線索，再根據線索選擇最穩妥的推論。',
  passages: Object.freeze({ story: Object.freeze({ title: '雨後的紙船', lines: Object.freeze(['放學時雨停了，操場邊留下幾個水窪。', '小安把紙船放進靠近排水溝的水窪，紙船慢慢往前漂。', '他看見紙船停在落葉旁，便撿起落葉，紙船又向前移動。']) }) }),
  openQuestions: ['文本為原創遊戲素材，需教師檢視詞彙與年級適切性。', '選擇推論不能取代學生自行口頭說明理由。'],
  stages: [
    { stageId: 'collect-clues', interaction: 'collect_evidence', passageId: 'story', prompt: '選出能直接支持「小安做了什麼讓紙船繼續前進？」的文字線索。', hints: ['找出紙船停住前後，人物實際做了什麼。', '只選文本明確寫出的動作，不要選沒有出現的想法。'], options: [{ id: 'removed-leaf', text: '他撿起落葉。' }, { id: 'wind-blowed', text: '他用手推紙船。' }, { id: 'boat-moved', text: '紙船又向前移動。' }], correctOptionIds: ['removed-leaf','boat-moved'], incorrectFeedback: '回到故事核對動作和結果，避免加入文本沒有寫的動作。', correctFeedback: '你找到了動作與結果的線索。這是依短文選取證據，不等同於自由表達推論。' },
    { stageId: 'choose-inference', interaction: 'choose_response', prompt: '根據短文，哪個說法最有文字支持？', hints: ['先用上一關找到的線索檢查每個說法。', '選擇能由「撿起落葉」和「紙船又向前移動」共同支持的說法。'], options: [{ id: 'leaf-blocked', text: '落葉可能擋住了紙船，移開後紙船才繼續漂。' }, { id: 'wind-cause', text: '風一定把紙船吹走。' }, { id: 'paper-boat-sank', text: '紙船已經沉到水底。' }], correctOptionIds: ['leaf-blocked'], incorrectFeedback: '區分文本明寫的事實與沒有證據支持的猜測。', correctFeedback: '你的推論與文本線索一致；仍需其他文本和自行說明來判斷遷移。' },
  ],
});

export const GRADE4_CHINESE_PARAGRAPH_ARCHITECT = candidate({
  activityId: 'ACT-G4-CHINESE-PARAGRAPH-ARCHITECT-CANDIDATE', subjectId: 'chinese-language',
  title: '段落拼圖建築師', curriculumMapId: 'chinese-grade4-paragraph-organization', curriculumCodes: Object.freeze(['5-Ⅱ-4', '5-Ⅱ-6', 'Ad-Ⅱ-2', 'Ba-Ⅱ-1']),
  curriculumScope: '部分對應第二學習階段的句段意義、摘要策略與記敘文本結構：排列事件、定位支持結果的原文句，再選擇摘要；未測量獨立寫作、自由摘要或完整篇章理解。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-CHINESE-PARAGRAPH-CANDIDATE-01', statement: '排列短文事件、從文本定位相關證據，再判斷概括主要事件的句子。', status: 'candidate_pending_teacher_review' }),
  instructions: '先排列事件，再回到故事中找支持指定關係的句子，最後判斷哪一句概括主要事件。',
  openQuestions: ['需教師確認學生對時間詞與事件因果順序的熟悉度。', '概括句由選項提供，未評量學生獨立寫作。'],
  stages: [
    { stageId: 'order-paragraph', interaction: 'order_items', prompt: '排列「種下豆子」短文片段，讓事情依發生順序連貫。', hints: ['先找出表示開始、接著、最後的時間線索。', '先放準備材料，再放種下和照顧後的結果。'], items: [{ id: 'water', text: '小晴每天澆水，幾天後看見嫩芽。' }, { id: 'plant', text: '她把豆子放進土裡，輕輕蓋上土。' }, { id: 'prepare', text: '小晴先在盆子裡裝好泥土。' }], initialOrder: ['water','plant','prepare'], correctItemIds: ['prepare','plant','water'], incorrectFeedback: '依照種植的先後想一遍：準備盆土、放入豆子、後續照顧與觀察。', correctFeedback: '片段順序連貫地呈現了事件過程。' },
    { stageId: 'locate-paragraph-evidence', interaction: 'collect_evidence', prompt: '回看故事片段，選出能支持「照顧後出現嫩芽」的文字證據。', context: [{ speaker: '故事片段', text: '小晴先在盆子裡裝好泥土。她把豆子放進土裡，輕輕蓋上土。她每天澆水，幾天後看見嫩芽。' }], hints: ['題目問的是照顧後出現的結果，先找時間和結果線索。', '選出直接提到澆水及看見嫩芽的句子；不要把你的推測當成原文。'], options: [{ id: 'water-and-sprout', text: '她每天澆水，幾天後看見嫩芽。' }, { id: 'plant-seed', text: '她把豆子放進土裡，輕輕蓋上土。' }, { id: 'sunlight-claim', text: '陽光讓豆子在一天內長成大樹。' }], correctOptionIds: ['water-and-sprout'], incorrectFeedback: '逐句核對：只有故事明確寫出的行動與結果能當作文字證據。', correctFeedback: '你定位到直接相關的句子；找到證據不等於已能自行寫出段落摘要。' },
    { stageId: 'select-summary', interaction: 'choose_response', prompt: '哪一句最能概括這段短文？', hints: ['概括句要包含主要事件，不必列出每個小動作。', '想一想，整段主要在說誰做了什麼並觀察到什麼。'], options: [{ id: 'grow-bean', text: '小晴種下豆子並照顧它，後來看到嫩芽。' }, { id: 'soil-only', text: '盆子裡有泥土。' }, { id: 'water-only', text: '小晴拿水澆花。' }], correctOptionIds: ['grow-bean'], incorrectFeedback: '檢查選項是否概括整段主要事件，而非只提到一個細節。', correctFeedback: '你選出涵蓋主要事件的概括句；未測量自行摘要表達。' },
  ],
});

export const GRADE4_SCIENCE_MATERIAL_SORT = candidate({
  activityId: 'ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE', subjectId: 'natural-science',
  title: '材料觀察分類站', curriculumMapId: 'science-grade4-material-properties', curriculumCodes: Object.freeze(['INa-Ⅱ-3', 'pa-Ⅱ-1']),
  curriculumScope: '部分對應 INa-Ⅱ-3 與 pa-Ⅱ-1：先分類給定的吸水現象，再比較第二組模擬的同條件次數紀錄並限制結論範圍。未實際觀察或實驗材料，也未涵蓋材料特性與用途的多面向分類。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-SCIENCE-MATERIAL-SORT-CANDIDATE-01', statement: '依模擬觀察分類材料，並比較另一組觀察次數以判斷資料支持的結論。', status: 'candidate_pending_teacher_review' }),
  instructions: '先依材料觀察卡分類，再比較同方式取得的第二組模擬紀錄。所有卡片都是文字模擬，沒有學生操作材料或實驗。',
  openQuestions: ['這是文字模擬紀錄，沒有學生實際操作材料或控制實驗條件。', '須教師確認材料卡描述與班級實際觀察活動一致。'],
  stages: [
    { stageId: 'sort-absorption', interaction: 'classify_observations', prompt: '依觀察紀錄將材料卡分類：水滴被吸收，或水滴留在表面。', hints: ['只根據卡片上水滴變化的觀察，不要猜材料名稱用途。', '看水滴是否逐漸進入材料；再將卡片放入對應類別。'], observations: [{ id: 'cloth', text: '棉布：滴水後，布面濕了一小塊。' }, { id: 'plastic', text: '塑膠片：水滴仍聚在表面，擦拭後塑膠片下方乾燥。' }, { id: 'paper', text: '紙片：滴水後，水痕擴散到紙面。' }], categories: [{ id: 'absorbs', label: '水滴被吸收／材料變濕' }, { id: 'stays', label: '水滴留在表面' }], correctAssignments: { cloth: 'absorbs', plastic: 'stays', paper: 'absorbs' }, incorrectFeedback: '回看每張卡記錄到的現象，再分類；不要以「我覺得這種材料通常如何」代替證據。', correctFeedback: '你依觀察紀錄完成分類。未進行實物實驗，也不能由此推論材料的所有性質。' },
    { stageId: 'data-conclusion', interaction: 'choose_response', prompt: '依剛才三張觀察卡，哪個結論有資料支持？', hints: ['用分類結果核對每種材料，不要把一次觀察擴大成普遍規則。', '找出能同時符合棉布、紙片及塑膠片紀錄的說法。'], options: [{ id: 'all-materials', text: '所有材料都會吸收水。' }, { id: 'given-cards', text: '在這三張紀錄中，棉布與紙片吸水，塑膠片上的水留在表面。' }, { id: 'all-plastic', text: '任何塑膠製品在所有情況下都不吸水。' }], correctOptionIds: ['given-cards'], incorrectFeedback: '結論要符合紀錄範圍，不要把三張卡擴大成所有材料都如此。', correctFeedback: '你把結論限制在實際提供的紀錄範圍內。' },
    { stageId: 'compare-repeat-observations', interaction: 'collect_evidence', prompt: '研究員用相同滴水方式記下另一組模擬觀察。選出支持「這組紙片紀錄比塑膠片更常看到水痕擴散」的資料。', context: [{ speaker: '模擬觀察紀錄', text: '每種材料各觀察 3 次：紙片有 2 次水痕擴散；塑膠片有 0 次水痕擴散。此為預先提供的模擬資料，不是真實實驗。' }], hints: ['先比較兩種材料各自有幾次出現水痕擴散。', '選出兩筆直接列出紙片和塑膠片觀察次數的紀錄；不要選沒有提供的原因。'], options: [{ id: 'paper-record', text: '紙片：3 次觀察中有 2 次水痕擴散。' }, { id: 'plastic-record', text: '塑膠片：3 次觀察中有 0 次水痕擴散。' }, { id: 'cause-claim', text: '紙片吸水較多是因為它比較便宜。' }], correctOptionIds: ['paper-record','plastic-record'], incorrectFeedback: '比較需要同時查看兩種材料的紀錄；價格或原因沒有出現在觀察資料中。', correctFeedback: '你用同一組模擬觀察的兩筆紀錄進行比較，沒有把資料外的原因當成證據。' },
  ],
});

export const GRADE4_SCIENCE_PLANT_ATLAS = candidate({
  activityId: 'ACT-G4-SCIENCE-PLANT-STRUCTURE-ATLAS-CANDIDATE', subjectId: 'natural-science',
  title: '植物莖形態觀察圖鑑', curriculumMapId: 'science-grade4-plant-structure-observation', curriculumCodes: Object.freeze(['INb-Ⅱ-4', 'INb-Ⅱ-6', 'pa-Ⅱ-1']),
  curriculumScope: '部分對應：使用文字卡辨識常見植物外部形態並依莖的觀察特徵分類；不含真實觀察、植物生長實驗或完整構造功能關係。學習階段為第二階段（3–4年級），不主張特定學期。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G4-SCIENCE-PLANT-ATLAS-CANDIDATE-01', statement: '從文字觀察紀錄摘取植物外部構造線索，並依莖的可見特徵分類。', status: 'candidate_pending_teacher_review' }),
  instructions: '先在植物觀察卡找出可直接看見的莖特徵，再把卡片放入對應分類。這是文字卡模擬，未包含真實植物標本觀察。',
  openQuestions: ['需教師確認木本、草本、藤本等分類詞彙是否符合本班先備。', '應以真實植物或核實照片替換文字卡後再評估觀察能力。'],
  stages: [
    { stageId: 'find-stem-evidence', interaction: 'collect_evidence', prompt: '選出明確記錄「莖柔軟、需要依附支撐」的觀察卡。', hints: ['找莖的外觀與生長方式，不要只看植物用途。', '選出同時提到莖柔軟和依附支撐的紀錄。'], options: [{ id: 'woody', text: '甲：莖硬且木質，能直立支撐枝葉。' }, { id: 'soft', text: '乙：莖柔軟，沿著支架攀爬。' }, { id: 'green', text: '丙：莖呈綠色，直立生長。' }], correctOptionIds: ['soft'], incorrectFeedback: '逐字核對題目要找的兩項特徵：莖柔軟、依附支撐。', correctFeedback: '你找到符合描述的觀察卡；文字卡不是對真實植物的觀察紀錄。' },
    { stageId: 'classify-stems', interaction: 'classify_observations', prompt: '依文字卡把莖分類為木質硬莖、柔軟攀爬莖或綠色直立莖。', hints: ['每張卡只依它記錄的莖特徵分類。', '木質且能支撐、柔軟且攀爬、綠色且直立是三種不同線索。'], observations: [{ id: 'a', text: '甲：莖硬且木質，能直立支撐枝葉。' }, { id: 'b', text: '乙：莖柔軟，沿著支架攀爬。' }, { id: 'c', text: '丙：莖呈綠色，直立生長。' }], categories: [{ id: 'woody', label: '木質硬莖' }, { id: 'vine', label: '柔軟攀爬莖' }, { id: 'green-upright', label: '綠色直立莖' }], correctAssignments: { a: 'woody', b: 'vine', c: 'green-upright' }, incorrectFeedback: '比較卡片中的莖質地、顏色和生長方式，依明確記錄重新分類。', correctFeedback: '你完成了依據文字觀察特徵的分類。尚未評量植物構造與功能的完整關係。' },
  ],
});

export const GRADE4_CANDIDATE_TASKS = Object.freeze([
  GRADE4_MATH_FRACTION_TILES, GRADE4_MATH_FRACTION_EQUIVALENCE, GRADE4_MATH_TWO_STEP_SUPPLY,
  GRADE4_CHINESE_TEXT_EVIDENCE, GRADE4_CHINESE_PARAGRAPH_ARCHITECT,
  GRADE4_SCIENCE_MATERIAL_SORT, GRADE4_SCIENCE_PLANT_ATLAS,
]);
