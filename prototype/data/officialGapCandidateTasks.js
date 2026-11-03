const freeze = (value) => Object.freeze(value);

const reviewedStudentText = (text, readings) => {
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

const candidate = (task) => freeze({
  ...task,
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'official_clause_linked_candidate_game_not_official_teaching_material',
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: freeze(task.openQuestions ?? []),
  stages: freeze(task.stages.map(freeze)),
});

export const OFFICIAL_GAP_CANDIDATE_TASKS = Object.freeze([
  candidate({
    activityId: 'ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE', gradeId: 'grade-1', subjectId: 'mathematics',
    title: '數字郵局：把信送到數線', curriculumMapId: 'math-grade1-count-place-value', sourceId: 'mathematics',
    curriculumCodes: freeze(['N-1-1']),
    curriculumScope: '部分對應官方一年級 N-1-1「一百以內的數」：在有限刻度的示意數線定位數字，並辨識數字前後的鄰數。未涵蓋完整點數、位值單位、百數表徵或實物操作。',
    learningObjective: freeze({ objectiveId: 'LO-G1-MATH-NUMBER-LINE-POST-CANDIDATE-01', statement: '依數線等距刻度定位兩位數，並用相鄰刻度檢查位置。', status: 'candidate_pending_teacher_review' }),
    instructions: '讀取數線上的數字標記，將郵件送到指定位置；這是螢幕示意操作，不代表實物操作能力。',
    openQuestions: ['N-1-1明列一年級內容；實際班級何時學到此數域與數線表徵仍由教師確認。'],
    stages: [
      {
        stageId: 'deliver-number-42', interaction: 'place_number_line_marker',
        prompt: '把信送到數線上的 42。',
        promptPronunciationTokens: reviewedStudentText('把信送到數線上的 42。', 'ㄅㄚˇ ㄒㄧㄣˋ ㄙㄨㄥˋ ㄉㄠˋ ㄕㄨˋ ㄒㄧㄢˋ ㄕㄤˋ ˙ㄉㄜ').pronunciationTokens,
        studentOperationGuidance: '怎麼玩：① 移動滑桿 → ② 找到數字的位置 → ③ 放好後檢查答案',
        studentOperationGuidancePronunciationTokens: reviewedStudentText('怎麼玩：① 移動滑桿 → ② 找到數字的位置 → ③ 放好後檢查答案', 'ㄗㄣˇ ㄇㄜ˙ ㄨㄢˊ ㄧˊ ㄉㄨㄥˋ ㄏㄨㄚˊ ㄍㄢˇ ㄓㄠˇ ㄉㄠˋ ㄕㄨˋ ㄗˋ ˙ㄉㄜ ㄨㄟˋ ㄓˋ ㄈㄤˋ ㄏㄠˇ ㄏㄡˋ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ').pronunciationTokens,
        hints: [
          reviewedStudentText('先找到 40，再往右數。', 'ㄒㄧㄢ ㄓㄠˇ ㄉㄠˋ ㄗㄞˋ ㄨㄤˇ ㄧㄡˋ ㄕㄨˇ'),
          reviewedStudentText('從 40 往右數 2 格，就是 42。', 'ㄘㄨㄥˊ ㄨㄤˇ ㄧㄡˋ ㄕㄨˇ ㄍㄜˊ ㄐㄧㄡˋ ㄕˋ'),
        ],
        numberLine: {
          start: 0, end: 50, tickCount: 50, targetTick: 42,
          valueFormat: 'integer', majorTickInterval: 10,
          studentInstruction: '移動滑桿，把信放到正確的數字。',
          studentInstructionPronunciationTokens: reviewedStudentText('移動滑桿，把信放到正確的數字。', 'ㄧˊ ㄉㄨㄥˋ ㄏㄨㄚˊ ㄍㄢˇ ㄅㄚˇ ㄒㄧㄣˋ ㄈㄤˋ ㄉㄠˋ ㄓㄥˋ ㄑㄩㄝˋ ˙ㄉㄜ ㄕㄨˋ ㄗˋ').pronunciationTokens,
        },
        incorrectFeedback: '再找一次 40，從 40 往右數 2 格。',
        incorrectFeedbackPronunciationTokens: reviewedStudentText('再找一次 40，從 40 往右數 2 格。', 'ㄗㄞˋ ㄓㄠˇ ㄧˊ ㄘˋ ㄘㄨㄥˊ ㄨㄤˇ ㄧㄡˋ ㄕㄨˇ ㄍㄜˊ').pronunciationTokens,
        correctFeedback: '答對了！你把信送到 42 了。',
        correctFeedbackPronunciationTokens: reviewedStudentText('答對了！你把信送到 42 了。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ㄋㄧˇ ㄅㄚˇ ㄒㄧㄣˋ ㄙㄨㄥˋ ㄉㄠˋ ˙ㄌㄜ').pronunciationTokens,
        teacherLimitationNote: '單次數線定位不代表學生已完整掌握一百以內的數。',
      },
      {
        stageId: 'choose-neighbor-check', interaction: 'choose_response',
        prompt: '信在 42。右邊下一格是哪個數？',
        promptPronunciationTokens: reviewedStudentText('信在 42。右邊下一格是哪個數？', 'ㄒㄧㄣˋ ㄗㄞˋ ㄧㄡˋ ㄅㄧㄢ ㄒㄧㄚˋ ㄧˋ ㄍㄜˊ ㄕˋ ㄋㄚˇ ㄍㄜ˙ ㄕㄨˋ').pronunciationTokens,
        hints: [
          reviewedStudentText('往右一格，數字會多 1。', 'ㄨㄤˇ ㄧㄡˋ ㄧˋ ㄍㄜˊ ㄕㄨˋ ㄗˋ ㄏㄨㄟˋ ㄉㄨㄛ'),
          reviewedStudentText('42 再往後數一個數。', 'ㄗㄞˋ ㄨㄤˇ ㄏㄡˋ ㄕㄨˇ ㄧˊ ㄍㄜˋ ㄕㄨˋ'),
        ],
        options: [{ id: '43', text: '43' }, { id: '41', text: '41' }, { id: '52', text: '52' }],
        correctOptionIds: ['43'],
        incorrectFeedback: '再想一想：往右一格，數字會多 1。',
        incorrectFeedbackPronunciationTokens: reviewedStudentText('再想一想：往右一格，數字會多 1。', 'ㄗㄞˋ ㄒㄧㄤˇ ㄧˊ ㄒㄧㄤˇ ㄨㄤˇ ㄧㄡˋ ㄧˋ ㄍㄜˊ ㄕㄨˋ ㄗˋ ㄏㄨㄟˋ ㄉㄨㄛ').pronunciationTokens,
        correctFeedback: '答對了！42 的右邊下一格是 43。',
        correctFeedbackPronunciationTokens: reviewedStudentText('答對了！42 的右邊下一格是 43。', 'ㄉㄚˊ ㄉㄨㄟˋ ˙ㄌㄜ ˙ㄉㄜ ㄧㄡˋ ㄅㄧㄢ ㄒㄧㄚˋ ㄧˋ ㄍㄜˊ ㄕˋ').pronunciationTokens,
        teacherLimitationNote: '本活動不代表已完整評量學生的數序與位值能力。',
      },
    ],
  }),
  candidate({
    activityId: 'ACT-G3-CHINESE-REASON-EVIDENCE-TRAIL-CANDIDATE', gradeId: 'grade-3', subjectId: 'chinese-language',
    title: '故事偵查隊：理由證據足跡', curriculumMapId: 'chinese-reading-supporting-reasons-5-ii-7', sourceId: 'chinese-language',
    curriculumCodes: freeze(['5-Ⅱ-7']),
    curriculumScope: '部分對應第二學習階段閱讀表現 5-Ⅱ-7：以原創短文練習從文本找支持理由的句子。未評量多文本閱讀、完整推論策略、書面表達或三年級特定學期進度。',
    learningObjective: freeze({ objectiveId: 'LO-G3-CHINESE-REASON-EVIDENCE-CANDIDATE-01', statement: '從短文中選取能支持角色判斷的明示線索，並依線索排序推理步驟。', status: 'candidate_pending_teacher_review' }),
    instructions: '讀取虛構短文，收集能支持判斷的句子，再排列推理步驟。',
    openQuestions: ['第二學習階段涵蓋三、四年級；教師需確認閱讀詞彙與推論教學先備。', '選取文本證據不等於學生能獨立產生完整理由。'],
    stages: [
      { stageId: 'collect-text-clues', interaction: 'collect_evidence', prompt: '小禾帶了雨衣嗎？選出支持判斷的句子。', context: [{ speaker: '短文', text: '早上天空烏雲很多。小禾把雨衣放進書包，出門前又看了一眼天氣預報。' }], hints: ['找出直接提到雨衣放在哪裡的句子。', '只收集能回答「小禾帶了什麼」的句子，天色是背景線索。'], options: [{ id: 'raincoat', text: '小禾把雨衣放進書包。' }, { id: 'clouds', text: '早上天空烏雲很多。' }, { id: 'forecast', text: '出門前又看了一眼天氣預報。' }], correctOptionIds: ['raincoat'], incorrectFeedback: '判斷要由直接說明雨衣的句子支持；背景線索不足以證明她帶了雨衣。', correctFeedback: '你找到了直接證據；這次選取不代表能對所有文本獨立推論。' },
      { stageId: 'order-reasoning-trail', interaction: 'order_items', prompt: '依序整理「提出判斷、找證據、說明關係」的閱讀步驟。', hints: ['先想自己要回答的問題，再回到原文。', '證據找到後，說明它如何支持判斷。'], items: [{ id: 'explain', text: '說明證據如何支持判斷。' }, { id: 'question', text: '先確認要回答的問題。' }, { id: 'evidence', text: '回到原文找相關句子。' }], initialOrder: ['evidence', 'explain', 'question'], correctItemIds: ['question', 'evidence', 'explain'], incorrectFeedback: '先確定問題，再找原文證據，最後說明兩者的關係。', correctFeedback: '你整理了證據推理步驟；排序活動不能取代口頭或書面理由評量。' },
    ],
  }),
  candidate({
    activityId: 'ACT-G4-SOCIAL-LOCAL-HISTORY-CHANGE-EVIDENCE-CANDIDATE', gradeId: 'grade-4', subjectId: 'social-studies',
    title: '地方記憶館：前後紀錄比對', curriculumMapId: 'social-grade4-local-history-evidence', sourceId: 'social-studies',
    curriculumCodes: freeze(['Cb-Ⅱ-1']),
    curriculumScope: '部分對應第二學習階段 Cb-Ⅱ-1：比較虛構地方檔案中的前後紀錄，找出可支持「地方出現變化」的資料。未使用真實地方史料，也未探究變遷原因、人物及文物古蹟的完整脈絡；不指定四年級學期。',
    learningObjective: freeze({ objectiveId: 'LO-G4-SOCIAL-LOCAL-HISTORY-CHANGE-EVIDENCE-CANDIDATE-01', statement: '比較同一地點前後兩筆有來源的紀錄，指出能支持地方變化的證據並區分未獲支持的原因說法。', status: 'candidate_pending_teacher_review' }),
    instructions: '在虛構「河岸小鎮」檔案室比對兩張有日期的紀錄卡，選出能證明地點前後不同的資料，再判斷哪個說法超出證據。',
    openQuestions: ['需教師確認閱讀日期與比較紀錄的先備；資料皆為虛構，不能替代真實地方史料探究。', '本任務練習辨認變化線索，不足以說明歷史變遷的原因或完整背景。'],
    stages: [
      { stageId: 'collect-before-after-evidence', interaction: 'collect_evidence', requiredSelectionCount: 2, prompt: '哪兩張檔案卡能直接支持「河岸旁的通行方式前後有變化」？', context: [{ speaker: '1998 年照片說明', text: '河岸旁只有一條窄土徑，照片由地方圖書館提供。' }, { speaker: '2010 年工程紀錄', text: '河岸旁完成鋪面步道，紀錄標有施工日期與地點。' }, { speaker: '匿名留言', text: '有人說大家都更喜歡新步道。' }], hints: ['比較同一地點較早與較晚的可查資料。', '需要一張較早的紀錄和一張較晚的紀錄；喜不喜歡不是地景變化證據。'], options: [{ id: 'older-path', text: '1998 年照片說明：河岸旁只有一條窄土徑。' }, { id: 'newer-walkway', text: '2010 年工程紀錄：河岸旁完成鋪面步道。' }, { id: 'preference-rumor', text: '匿名留言：大家都更喜歡新步道。' }], correctOptionIds: ['older-path', 'newer-walkway'], incorrectFeedback: '要用同一地點不同時間的可追溯紀錄比較；匿名喜好說法不能證明地點如何改變。', correctFeedback: '你用前後資料指出通行空間的變化；這組虛構紀錄不說明變化原因或地方歷史全貌。' },
      { stageId: 'check-change-claim', interaction: 'choose_response', prompt: '根據兩張有來源的卡片，哪個說法最符合證據？', hints: ['先指出兩個時間都有紀錄的同一地點。', '證據顯示通行空間從窄土徑變成鋪面步道；它沒有說明居民是否都喜歡。'], options: [{ id: 'path-changed', text: '紀錄顯示河岸旁的通行空間前後不同。' }, { id: 'everyone-prefers', text: '所有居民都喜歡新步道。' }, { id: 'reason-known', text: '步道一定是因為觀光客增加才興建。' }], correctOptionIds: ['path-changed'], incorrectFeedback: '把說法限制在卡片確實記錄的變化，不要把喜好或原因補成已知事實。', correctFeedback: '你讓結論保持在證據支持的範圍；活動沒有評量真實地方史料探究。' },
    ],
  }),
  candidate({
    activityId: 'ACT-G4-SCIENCE-WEATHER-RECORD-BOARD-CANDIDATE', gradeId: 'grade-4', subjectId: 'natural-science',
    title: '天氣觀測站：資料板配對', curriculumMapId: 'science-grade4-weather-observation-data', sourceId: 'natural-science',
    curriculumCodes: freeze(['INd-Ⅱ-7', 'pa-Ⅱ-1']),
    curriculumScope: '部分對應第二學習階段 INd-Ⅱ-7 與 pa-Ⅱ-1：依虛構的雨量、溫度、風向資料分類並選擇資料支持的敘述。沒有真實氣象儀器操作或實地觀測，不宣稱完成天氣觀測。',
    learningObjective: freeze({ objectiveId: 'LO-G4-SCIENCE-WEATHER-RECORD-BOARD-CANDIDATE-01', statement: '依資料欄位整理天氣紀錄，並從數據選出可支持的有限描述。', status: 'candidate_pending_teacher_review' }),
    instructions: '整理虛構三日觀測卡；先將數據放入正確欄位，再選出資料實際支持的描述。',
    openQuestions: ['校本是否已教讀取溫度、雨量與風向符號待教師確認。', '本活動以文字模擬資料，不評量儀器操作或實地觀察。'],
    stages: [
      { stageId: 'classify-weather-records', interaction: 'classify_observations', prompt: '將觀測卡依主要資料欄位分類。', hints: ['找每張卡上的單位或方向詞。', '毫米是雨量、攝氏度是溫度，東北風是風向。'], observations: [{ id: 'rain', text: '降雨量 12 毫米。' }, { id: 'temp', text: '氣溫 24°C。' }, { id: 'wind', text: '風向：東北。' }], categories: [{ id: 'rainfall', label: '雨量' }, { id: 'temperature', label: '溫度' }, { id: 'wind-direction', label: '風向' }], correctAssignments: { rain: 'rainfall', temp: 'temperature', wind: 'wind-direction' }, incorrectFeedback: '回看單位與方向詞；分類不同資料前先確認它記錄的是什麼。', correctFeedback: '你依欄位整理了虛構紀錄；沒有實際操作氣象儀器。' },
      { stageId: 'choose-supported-weather-claim', interaction: 'choose_response', prompt: '這三張卡中，哪一句最能被資料直接支持？', hints: ['只選資料明確寫出的內容，不推測明天的天氣。', '資料記錄有降雨量 12 毫米；它不能單獨證明未來會下雨。'], options: [{ id: 'rain-recorded', text: '這次紀錄中有 12 毫米降雨。' }, { id: 'tomorrow-rain', text: '明天一定會下雨。' }, { id: 'wind-fast', text: '風速很快。' }], correctOptionIds: ['rain-recorded'], incorrectFeedback: '觀測資料可支持已記錄的數值，不能單憑這些卡預測明天或未提供的風速。', correctFeedback: '你選擇了資料直接支持的描述；這不等於完整天氣預報判讀。' },
    ],
  }),
  candidate({
    activityId: 'ACT-G4-ARTS-COLOR-SHAPE-SPACE-STUDIO-CANDIDATE', gradeId: 'grade-4', subjectId: 'arts',
    title: '色彩與空間工作室：視覺拼貼', curriculumMapId: 'arts-grade4-visual-elements-composition', sourceId: 'arts',
    curriculumCodes: freeze(['視E-Ⅱ-1']),
    curriculumScope: '部分對應第二學習階段視E-Ⅱ-1「色彩感知、造形與空間的探索」：以螢幕色塊與圖形卡進行簡單拼貼和比較。不是實體媒材探索，也不能完整評量學生創作表達。',
    learningObjective: freeze({ objectiveId: 'LO-G4-ARTS-VISUAL-ELEMENTS-STUDIO-CANDIDATE-01', statement: '操作色彩與幾何形片安排前後空間，並比較作品構成差異。', status: 'candidate_pending_teacher_review' }),
    instructions: '在虛構展窗中用色塊與圖形卡組出一幅「明亮的公園」拼貼，再觀察構成。',
    openQuestions: ['需教師確認數位拼貼是否符合預定課程目標；實體媒材、觸覺與自主創作歷程未評量。'],
    stages: [
      { stageId: 'compose-window-scene', interaction: 'compose_shape', prompt: '選出四張形片，拼出有大面積背景與一個焦點圖形的展窗。', hints: ['先安排背景，再放置明顯的焦點。', '四格都要放滿；焦點圖形應與背景的形狀不同。'], pieces: [{ id: 'blue-square', label: '藍色背景方片', shape: 'square' }, { id: 'yellow-square', label: '黃色背景方片', shape: 'square' }, { id: 'green-square', label: '綠色背景方片', shape: 'square' }, { id: 'red-triangle', label: '紅色焦點三角片', shape: 'triangle' }, { id: 'gray-triangle', label: '灰色小三角片', shape: 'triangle' }], shapeRules: { rows: 2, columns: 2, correctPieceIds: ['blue-square', 'yellow-square', 'green-square', 'red-triangle'] }, incorrectFeedback: '重新檢查背景和焦點是否有不同造形；這是受限拼貼條件，不是唯一的藝術作品答案。', correctFeedback: '你依任務條件安排了色彩與造形；開放式創作仍需教師看作品與聽學生說明。' },
      { stageId: 'notice-visual-element', interaction: 'choose_response', prompt: '在剛才的拼貼條件中，哪一項是視覺元素？', hints: ['想想你剛才實際改變了哪些畫面特徵。', '顏色和造形都可被看見；選出題目要求的其中一種。'], options: [{ id: 'color', text: '色彩' }, { id: 'sound', text: '聲音大小' }, { id: 'temperature', text: '氣溫' }], correctOptionIds: ['color'], incorrectFeedback: '回想畫面中可直接改變的視覺特徵；聲音與氣溫不是這幅拼貼的視覺元素。', correctFeedback: '你辨認出畫面使用的色彩元素；這不是完整的藝術鑑賞或創作能力評量。' },
    ],
  }),
  candidate({
    activityId: 'ACT-G5-SCIENCE-REPEAT-MEASURE-RELIABILITY-CANDIDATE', gradeId: 'grade-5', subjectId: 'natural-science',
    title: '測量資料偵探：找出不穩定讀值', curriculumMapId: 'science-grade5-measurement-methods', sourceId: 'natural-science',
    curriculumCodes: freeze(['INc-Ⅲ-4']),
    curriculumScope: '部分對應第三學習階段 INc-Ⅲ-4：比較同一虛構物件的重複量測差異，辨識資料較不精確的組別。未實際測量，也不要求平均值計算；不指定五年級單學期。',
    learningObjective: freeze({ objectiveId: 'LO-G5-SCIENCE-MEASUREMENT-RELIABILITY-CANDIDATE-01', statement: '比較同一物件的重複測量結果，依數值差異判斷哪組讀值較不一致。', status: 'candidate_pending_teacher_review' }),
    instructions: '兩組都是對同一虛構紙帶量三次；整理讀值，再選出差異較大的紀錄組。',
    openQuestions: ['教師需確認小數量測先備與「精確」用語。', '本活動是虛構數據模擬，不能取代實物操作或多次測量。'],
    stages: [
      { stageId: 'classify-repeat-measures', interaction: 'classify_observations', prompt: '將每筆記錄放入 A 組或 B 組。', hints: ['看每筆資料前面的組別標記。', '同一組的三個讀值要放在一起，才能比較差異。'], observations: [{ id: 'a1', text: 'A 組：10.0 公分' }, { id: 'a2', text: 'A 組：10.1 公分' }, { id: 'b1', text: 'B 組：9.2 公分' }, { id: 'b2', text: 'B 組：10.8 公分' }], categories: [{ id: 'group-a', label: 'A 組' }, { id: 'group-b', label: 'B 組' }], correctAssignments: { a1: 'group-a', a2: 'group-a', b1: 'group-b', b2: 'group-b' }, incorrectFeedback: '依資料標記分組；先整理正確，再比較同一物件的重複讀值。', correctFeedback: '你整理了讀值；這些數據是虛構的，不是實際測量結果。' },
      { stageId: 'compare-measurement-spread', interaction: 'choose_response', prompt: '哪一組的讀值差異較大，因此重複結果較不一致？', hints: ['先找出每一組的最大值和最小值。', '分別找出兩組的最大值和最小值，比一比哪一組的差距比較大。'], options: [{ id: 'group-b', text: 'B 組' }, { id: 'group-a', text: 'A 組' }, { id: 'same', text: '兩組完全一樣' }], correctOptionIds: ['group-b'], incorrectFeedback: '把每組最大與最小讀值相比；差距越大，重複測量越不一致。', correctFeedback: '你根據讀值差距判斷一致性；這不表示已能操作工具或分析所有實驗數據。' },
    ],
  }),
]);
