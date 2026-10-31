const candidate = 'candidate_pending_teacher_review';
const evidencePolicy = Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false });
const noReinforcement = Object.freeze({ reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動' });
const review = Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null });

export const GRADE2_MATH_NUMBER_LINE = Object.freeze({
  activityId: 'ACT-G2-MATH-THOUSAND-NUMBER-LINE-CANDIDATE', revision: 1,
  title: '百數定位站：千數探路', gradeId: 'grade-2', subjectId: 'mathematics', status: candidate,
  sourceKind: 'original_interactive_candidate_not_textbook', curriculumMapId: 'math-grade2-count-place-value', sourceId: 'mathematics', curriculumCodes: ['N-2-1', 'n-I-1'],
  curriculumScope: 'N-2-1明列於官方二年級學習內容表，含一千以內數、位值積木、點數與位值表徵。本活動只練習整百刻度間定位和百／十組成，不超過1000，不代表完整涵蓋N-2-1；校本學期進度待確認。',
  learningObjective: { objectiveId: 'LO-G2-MATH-THOUSAND-NUMBER-LINE-01', statement: '在0至1000的整百刻度數線上定位數值，並連結百、十位表示。', status: candidate },
  instructions: '先用滑桿把標記放到指定整百刻度，再把百和十的數量連到數字卡。作答只保留在本次頁面記憶體。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'place-six-hundreds', interaction: 'place_number_line_marker', prompt: '把標記放在 600 的位置。數線從 0 到 1000，每一小段代表 100。', numberLine: Object.freeze({ start: 0, end: 1000, tickCount: 10, targetTick: 6, valueFormat: 'integer' }), hints: Object.freeze(['先從0開始，沿著刻度往右數。', '每一小段增加100；確認已經數過六個等大的區間。']), incorrectFeedback: '數線每格代表100。請從0逐格數到標記的位置，再試一次。', correctFeedback: '標記落在六個百的刻度。接著用百和十表示一個數。' }),
    Object.freeze({ stageId: 'match-hundreds-and-tens', interaction: 'choose_response', prompt: '哪張卡表示「6個百和8個十」？', options: Object.freeze([{ id: 'six-hundred-eighty', text: '680', feedback: '把6個百和8個十分開想，再合成數字。' }, { id: 'six-hundred-eight', text: '608', feedback: '608表示6個百和8個一；題目說的是8個十。' }, { id: 'eighty-six', text: '860', feedback: '860表示8個百和6個十，百與十的數量對調了。' }]), correctOptionIds: Object.freeze(['six-hundred-eighty']), hints: Object.freeze(['先把6個百和8個十分別換成數量。', '百位放6，十位放8，個位沒有單位時留在0。']), incorrectFeedback: '檢查每個數字的位置：6個百在百位，8個十在十位。', correctFeedback: '你把百和十的位置連結起來了。這只檢查一組數，不足以代表掌握所有一千以內數。' }),
  ]), ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['整百刻度與百、十表徵的教學先備及班級進度待教師確認。', '數線為畫面模擬，不等同實體位值積木操作。']),
});

export const GRADE2_MATH_COLUMN_CALCULATION = Object.freeze({
  activityId: 'ACT-G2-MATH-PLACE-VALUE-CALCULATION-CANDIDATE', revision: 1,
  title: '位值修理工：進退位工作臺', gradeId: 'grade-2', subjectId: 'mathematics', status: candidate,
  sourceKind: 'original_interactive_candidate_not_textbook', curriculumMapId: 'math-grade2-place-value-add-sub', sourceId: 'mathematics', curriculumCodes: ['N-2-2', 'n-I-2'],
  curriculumScope: 'N-2-2明列二年級多位數加減以位值理解計算原理，含加法最多二次進位、減法一次退位及含0題型。本活動僅提供一個兩位數進位與一個一次退位示例，未涵蓋含0、二次進位、應用解題或全部策略。',
  learningObjective: { objectiveId: 'LO-G2-MATH-PLACE-VALUE-CALCULATION-01', statement: '操作選擇加減計算中的位值中間步驟，說明進位與退位後各位數量如何改變。', status: candidate },
  instructions: '依序完成每一步的位值變化。每個步驟可重新選擇；答錯會指出需檢查的位置。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'addition-regroup-26-17', interaction: 'complete_calculation_steps', calculationTitle: '26 + 17：先看個位，再整理十位', prompt: '完成加法的位值中間步驟。', calculationSteps: Object.freeze([
      Object.freeze({ id: 'ones-sum', label: '個位 6 + 7 合起來是幾個一？', expectedValue: 13, choices: Object.freeze([{ value: 11, label: '11個一' }, { value: 13, label: '13個一' }, { value: 14, label: '14個一' }]), incorrectFeedback: '先把個位上的6和7合起來，逐一點數或用已知加法核對。' }),
      Object.freeze({ id: 'carry-tens', label: '13個一可以換成幾個十和幾個一？剩下幾個一？', expectedValue: 3, choices: Object.freeze([{ value: 2, label: '剩2個一' }, { value: 3, label: '剩3個一' }, { value: 4, label: '剩4個一' }]), incorrectFeedback: '十個一可以換成一個十；再看13個一還剩多少個一。' }),
      Object.freeze({ id: 'tens-total', label: '原來的2個十、1個十和進來的1個十，合計幾個十？', expectedValue: 4, choices: Object.freeze([{ value: 3, label: '3個十' }, { value: 4, label: '4個十' }, { value: 5, label: '5個十' }]), incorrectFeedback: '把十位原有的十、另一個加數的十，以及進位的十一起計算。' }),
    ]), hints: Object.freeze(['先處理同一位上的數，再檢查是否湊成十個一。', '十個一換成一個十；換完後的十要和原本十位一起整理。']), incorrectFeedback: '回到出錯的位值步驟，分清「幾個一」與「幾個十」後再試。', correctFeedback: '這組加法中間步驟完成。下一關改用減法，注意退位後的單位數量。' }),
    Object.freeze({ stageId: 'subtraction-borrow-52-28', interaction: 'complete_calculation_steps', calculationTitle: '52 − 28：把一個十換成十個一', prompt: '完成一次退位的中間步驟。', calculationSteps: Object.freeze([
      Object.freeze({ id: 'borrowed-ones', label: '把1個十換成10個一後，原有2個一共有幾個一？', expectedValue: 12, choices: Object.freeze([{ value: 11, label: '11個一' }, { value: 12, label: '12個一' }, { value: 13, label: '13個一' }]), incorrectFeedback: '原有2個一，再加上從十位換來的10個一。' }),
      Object.freeze({ id: 'remaining-tens', label: '十位原有5個十，換出1個十後剩幾個十？', expectedValue: 4, choices: Object.freeze([{ value: 3, label: '3個十' }, { value: 4, label: '4個十' }, { value: 5, label: '5個十' }]), incorrectFeedback: '退位是從十位拿出1個十換成10個一，十位要少一個十。' }),
      Object.freeze({ id: 'ones-difference', label: '12個一減去8個一，剩幾個一？', expectedValue: 4, choices: Object.freeze([{ value: 3, label: '3個一' }, { value: 4, label: '4個一' }, { value: 5, label: '5個一' }]), incorrectFeedback: '使用退位後的12個一，計算扣掉8個一還剩多少。' }),
      Object.freeze({ id: 'tens-difference', label: '4個十減去2個十，剩幾個十？', expectedValue: 2, choices: Object.freeze([{ value: 1, label: '1個十' }, { value: 2, label: '2個十' }, { value: 3, label: '3個十' }]), incorrectFeedback: '十位已剩4個十，從中減去被減數的2個十。' }),
    ]), hints: Object.freeze(['想想十位能否拆成十個一來處理個位。', '拆出一個十後，個位增加十個一，十位同時少一個十。']), incorrectFeedback: '逐步檢查退位前後的十與一，不要把位值改變只記成符號。', correctFeedback: '你完成了這個一次退位例子。本活動未涵蓋含0或更複雜進位題。' }),
  ]), ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['學生是否已能以位值表徵十與一、基本加減法先備待教師確認。', '此互動是選擇中間步驟，未要求學生自行寫出完整直式或口頭解釋。']),
});

export const GRADE2_MATH_MEASURE_COMPARE = Object.freeze({
  activityId: 'ACT-G2-MATH-CAPACITY-WEIGHT-AREA-COMPARISON-CANDIDATE', revision: 1,
  title: '量一量比較研究站：面積、容量與重量', gradeId: 'grade-2', subjectId: 'mathematics', status: candidate,
  sourceKind: 'original_simulated_measure_comparison_candidate_not_textbook',
  curriculumMapId: 'math-grade2-capacity-weight-area-compare', sourceId: 'mathematics', curriculumCodes: ['N-2-12', 'n-I-8'],
  curriculumScope: '官方N-2-12要求容量、重量、面積分開學習，含初步認識、直接及間接比較（含個別單位）。本活動分三站讓學生分類比較預先提供的同單位模擬紀錄；不取代實物容器比較、天平秤重、重量量感、百格圖操作或學生自行測量。',
  learningSubitemClaims: ['SUB-MATH-G2-N2-12-COMPARE-CAPACITY-WEIGHT-AREA'],
  learningObjective: { objectiveId: 'LO-G2-MATH-MEASURE-COMPARE-01', statement: '在面積、容量與重量三種分開情境中，使用共同的非標準單位比較兩個量，並辨認較多、相同或較少。', status: candidate },
  instructions: '每一站都先看相同單位記錄，再把比較卡分到「左邊較多」、「一樣多」或「右邊較多」。畫面是測量資料模擬，完成後仍建議用實物操作。',
  stages: Object.freeze([
    Object.freeze({
      stageId: 'compare-area-unit-squares', interaction: 'classify_observations',
      prompt: '面積站：兩張圖都用同樣大小的方格片覆蓋。比較左圖和右圖各用了幾片。',
      observations: Object.freeze([
        { id: 'area-six-vs-eight', text: '左圖用了 6 片方格，右圖用了 8 片方格。' },
        { id: 'area-five-vs-five', text: '左圖用了 5 片方格，右圖用了 5 片方格。' },
        { id: 'area-nine-vs-seven', text: '左圖用了 9 片方格，右圖用了 7 片方格。' },
      ]),
      categories: Object.freeze([{ id: 'left-more', label: '左邊較多' }, { id: 'same-amount', label: '一樣多' }, { id: 'right-more', label: '右邊較多' }]),
      correctAssignments: Object.freeze({ 'area-six-vs-eight': 'right-more', 'area-five-vs-five': 'same-amount', 'area-nine-vs-seven': 'left-more' }),
      hints: Object.freeze(['先確認兩邊使用的方格片一樣大，再比片數。', '比較每一組左右的數量；相同單位片較多的一邊，覆蓋的面積較大。']),
      incorrectFeedback: '先核對兩邊是不是用同樣大小的單位方格，再依單位片數比較；本題不是比較圖形邊長。',
      correctFeedback: '你用同一種面積單位比較了覆蓋量。畫面只提供方格數據，沒有讓你實際鋪排方格片。',
    }),
    Object.freeze({
      stageId: 'compare-capacity-cup-units', interaction: 'classify_observations',
      prompt: '容量站：兩個容器都用同一個小杯裝水，記下裝滿各需要幾杯。比較容量。',
      observations: Object.freeze([
        { id: 'capacity-four-vs-six', text: '左容器裝滿需要 4 杯，右容器需要 6 杯。' },
        { id: 'capacity-three-vs-three', text: '左容器裝滿需要 3 杯，右容器也需要 3 杯。' },
        { id: 'capacity-seven-vs-five', text: '左容器裝滿需要 7 杯，右容器需要 5 杯。' },
      ]),
      categories: Object.freeze([{ id: 'left-more', label: '左邊容量較大' }, { id: 'same-amount', label: '容量相同' }, { id: 'right-more', label: '右邊容量較大' }]),
      correctAssignments: Object.freeze({ 'capacity-four-vs-six': 'right-more', 'capacity-three-vs-three': 'same-amount', 'capacity-seven-vs-five': 'left-more' }),
      hints: Object.freeze(['比較前要用同一個小杯，不能把不同大小的杯數直接相比。', '單位杯相同時，裝滿所需杯數較多的一個容器容量較大。']),
      incorrectFeedback: '再確認比較的單位都是同一個小杯。相同單位杯數較多，表示能裝下的量較大。',
      correctFeedback: '你依共同容量單位比較了容器。此站是模擬紀錄，未實際倒水或比較不同形狀的容器。',
    }),
    Object.freeze({
      stageId: 'compare-weight-balance-units', interaction: 'classify_observations',
      prompt: '重量站：紀錄使用同一種小砝碼或同一架天平得到的比較結果，判斷哪邊較重。',
      observations: Object.freeze([
        { id: 'weight-three-vs-two', text: '左物體平衡需要 3 個相同小砝碼，右物體需要 2 個。' },
        { id: 'weight-four-vs-four', text: '左物體和右物體都需要 4 個相同小砝碼才平衡。' },
        { id: 'weight-two-vs-five', text: '左物體需要 2 個相同小砝碼，右物體需要 5 個。' },
      ]),
      categories: Object.freeze([{ id: 'left-more', label: '左邊較重' }, { id: 'same-amount', label: '一樣重' }, { id: 'right-more', label: '右邊較重' }]),
      correctAssignments: Object.freeze({ 'weight-three-vs-two': 'left-more', 'weight-four-vs-four': 'same-amount', 'weight-two-vs-five': 'right-more' }),
      hints: Object.freeze(['先確認兩邊紀錄使用的砝碼相同。', '比較平衡所需的相同砝碼數；數量多的一邊較重。']),
      incorrectFeedback: '請依同樣砝碼的數量判斷，不能用物體看起來大不大來代替重量比較。',
      correctFeedback: '你根據共同單位紀錄判斷了重量關係。這不是實際使用天平，也沒有建立重量量感。',
    }),
  ]),
  ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['教師須確認使用學生熟悉的非標準單位及比較語詞。', '官方要求實際操作；畫面分類只作為模擬與前置練習，需另安排實物容器、天平／砝碼及面積單位操作。']),
});

export const GRADE2_CHINESE_TEXT_CLUE = Object.freeze({
  activityId: 'ACT-G2-CHINESE-STORY-CLUE-CANDIDATE', revision: 1,
  title: '故事線索搜查隊：找出支持答案的句子', gradeId: 'grade-2', subjectId: 'chinese-language', status: candidate,
  sourceKind: 'original_text_candidate_not_textbook', curriculumMapId: 'chinese-stage1-word-sentence-story', sourceId: 'chinese-language', curriculumCodes: ['5-I-4', '5-I-6', 'Ad-I-3'],
  curriculumScope: '國語文第一學習階段（一、二年級）閱讀與故事文本參照；原創短文只練習重要訊息與文本線索，不代表二年級學期安排或整體閱讀能力。',
  learningObjective: { objectiveId: 'LO-G2-CHINESE-TEXT-CLUE-01', statement: '從短篇故事中蒐集支持人物行動理解的文字線索，並依線索選擇解釋。', status: candidate },
  instructions: '閱讀原創短文，先收集能回答問題的句子，再用線索判斷人物為什麼採取行動。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'collect-rain-shelter-clues', interaction: 'collect_evidence', prompt: '小晴走到校門口時，為什麼回教室拿雨傘？請收集能支持答案的句子。短文：放學時，天空飄起雨絲。小晴看見同學沒有帶傘，便回教室拿了兩把雨傘。她把一把借給同學，兩人一起走到等候區。', options: Object.freeze([{ id: 'rain-started', text: '放學時，天空飄起雨絲。' }, { id: 'two-umbrellas', text: '小晴回教室拿了兩把雨傘。' }, { id: 'waiting-area', text: '兩人一起走到等候區。' }, { id: 'school-gate', text: '小晴走到校門口。' }]), correctOptionIds: Object.freeze(['rain-started', 'two-umbrellas']), hints: Object.freeze(['找出事情發生時的情況，以及小晴接著做的動作。', '選能支持「為什麼拿雨傘」的句子，不要只選故事最後發生的事。']), incorrectFeedback: '把線索和問題「為什麼拿雨傘」連起來；只描述地點或後來行程的句子不一定能說明原因。', correctFeedback: '你收集到雨勢和拿傘這兩個相關線索。接著判斷線索支持哪個說法。' }),
    Object.freeze({ stageId: 'infer-helping-classmate', interaction: 'choose_response', prompt: '根據短文，哪個說法最能解釋小晴拿兩把雨傘的原因？', options: Object.freeze([{ id: 'help-classmate', text: '她看到同學沒帶傘，想借一把給同學。', feedback: '短文直接寫到同學沒帶傘，以及小晴把一把傘借給同學。' }, { id: 'take-home-two', text: '她想把兩把傘都帶回家。', feedback: '短文沒有說她要把兩把傘都帶回家。' }, { id: 'avoid-waiting', text: '她想提早離開等候區。', feedback: '短文沒有提到她想提早離開。' }]), correctOptionIds: Object.freeze(['help-classmate']), hints: Object.freeze(['回看誰沒有帶傘，以及小晴後來怎麼做。', '選擇能同時符合「同學沒帶傘」和「借出一把」兩個線索的說法。']), incorrectFeedback: '請用故事中明確寫出的行動支持解釋；不要加入文本沒有說的想法。', correctFeedback: '這次判斷有短文線索支持，但選對解釋不等於能獨立口頭重述或理解其他文本。' }),
  ]), ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['原創短文詞彙、篇幅與二年級讀者適切性待教師確認。', '活動為文字閱讀，沒有朗讀、注音、聆聽或書寫評量。']),
});

export const GRADE2_CHINESE_CONTEXT_WORDS = Object.freeze({
  activityId: 'ACT-G2-CHINESE-CONTEXT-WORDS-CANDIDATE', revision: 1,
  title: '語境偵探：同一個詞看前後句', gradeId: 'grade-2', subjectId: 'chinese-language', status: candidate,
  sourceKind: 'original_language_candidate_not_textbook', curriculumMapId: 'chinese-stage1-word-sentence-story', sourceId: 'chinese-language', curriculumCodes: ['Ab-I-5', 'Ab-I-6', 'Ac-I-2'],
  curriculumScope: '國語文第一學習階段語詞認念／使用與簡易句型的局部候選參照。本活動使用少量常見詞語情境，不代表識字、詞彙或句型整體能力，也不確認二年級學期進度。',
  learningObjective: { objectiveId: 'LO-G2-CHINESE-CONTEXT-WORDS-01', statement: '利用前後文線索辨認同一詞語在句中的意思，並將詞卡放入合適語境。', status: candidate },
  instructions: '讀每張句子卡，找出「輕」表示的意思，再把卡片分類；第二關把理解到的意思用新句子檢查。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'sort-light-contexts', interaction: 'classify_observations', prompt: '把句子依「重量輕」或「聲音輕」分類。', observations: Object.freeze([{ id: 'light-bag', text: '這個書包很輕，拿起來不費力。' }, { id: 'light-voice', text: '妹妹輕輕地說話，怕吵醒弟弟。' }, { id: 'light-box', text: '空盒子很輕，可以單手拿起。' }, { id: 'light-step', text: '他放輕腳步，走過正在睡覺的小狗。' }]), categories: Object.freeze([{ id: 'weight-light', label: '重量輕' }, { id: 'sound-or-action-soft', label: '聲音或動作輕' }]), correctAssignments: Object.freeze({ 'light-bag': 'weight-light', 'light-voice': 'sound-or-action-soft', 'light-box': 'weight-light', 'light-step': 'sound-or-action-soft' }), hints: Object.freeze(['看「輕」附近的詞：拿起來、說話或腳步。', '重量會和拿取感受相連；聲音或動作則會和說、走等動作相連。']), incorrectFeedback: '請讀完整句子再判斷，不要只看到「輕」就選同一類。', correctFeedback: '你利用句子線索區分了詞語用法。下一關用新句子確認理解。' }),
    Object.freeze({ stageId: 'apply-context-meaning', interaction: 'choose_response', prompt: '「小心拿，這只杯子很輕。」這裡的「輕」最接近哪個意思？', options: Object.freeze([{ id: 'low-weight', text: '重量不重。', feedback: '「小心拿杯子」的句子談的是拿取物品的重量。' }, { id: 'quiet-sound', text: '聲音很小。', feedback: '句子沒有提到說話或聲音。' }, { id: 'slow-speed', text: '移動得很慢。', feedback: '句子沒有描述移動速度。' }]), correctOptionIds: Object.freeze(['low-weight']), hints: Object.freeze(['看句子中「拿」和「杯子」提供什麼線索。', '選能描述物品重量、且符合拿取情境的意思。']), incorrectFeedback: '用句子中的動作和物品來檢查詞義，不要只靠單一字詞猜。', correctFeedback: '你用新語境判斷詞義。本活動只檢查少量用法，不代表能理解所有多義詞。' }),
  ]), ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['詞語是否為目標班級已學詞、分類標籤閱讀負擔待教師確認。', '分類與選擇題不能替代學生自行造句或口頭解釋詞義。']),
});

export const GRADE2_LIVING_CHANGE_INQUIRY = Object.freeze({
  activityId: 'ACT-G2-LIVING-CHANGE-CLUE-CANDIDATE', revision: 1,
  title: '生活觀察隊：找出前後變化', gradeId: 'grade-2', subjectId: 'living-curriculum', status: candidate,
  sourceKind: 'original_simulated_observation_candidate_not_textbook', curriculumMapId: 'living-curriculum-stage1-change-inquiry', sourceId: 'living-curriculum', curriculumCodes: ['2-I-2', '2-I-4', 'A-I-2'],
  curriculumScope: '生活課程第一學習階段（一、二年級）觀察變化與探究參照。本任務只讀取虛構的前後紀錄，無法證明實地觀察、因果判斷或實際生活探究能力。',
  learningObjective: { objectiveId: 'LO-G2-LIVING-CHANGE-INQUIRY-01', statement: '比較同一情境的前後觀察紀錄，指出可直接觀察到的變化並區分未被紀錄證明的原因。', status: candidate },
  instructions: '閱讀同一盆植物兩次的文字紀錄，先收集前後不同的證據，再判斷哪些話有紀錄支持。資料是模擬案例。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'collect-plant-change', interaction: 'collect_evidence', prompt: '收集能直接顯示植物前後變化的紀錄。前一次：盆土表面乾，葉片向下。隔天：盆土表面濕，葉片較挺。', options: Object.freeze([{ id: 'soil-dry', text: '前一次盆土表面乾。' }, { id: 'leaf-down', text: '前一次葉片向下。' }, { id: 'soil-wet', text: '隔天盆土表面濕。' }, { id: 'leaf-upright', text: '隔天葉片較挺。' }]), correctOptionIds: Object.freeze(['soil-dry', 'leaf-down', 'soil-wet', 'leaf-upright']), hints: Object.freeze(['同一項目要比較兩個時間的紀錄。', '找出土壤狀態和葉片狀態前後不同的文字；不要加入沒記錄的原因。']), incorrectFeedback: '請逐項比對前一次和隔天的紀錄；只選其中一次的描述不完整。', correctFeedback: '你整理出前後紀錄，看到土壤和葉片狀態不同。接著區分觀察和原因猜測。' }),
    Object.freeze({ stageId: 'separate-change-and-cause', interaction: 'choose_response', prompt: '哪一句是紀錄直接支持的觀察，而不是尚未確認的原因？', options: Object.freeze([{ id: 'observed-leaf', text: '隔天葉片比前一次挺。', feedback: '兩次紀錄直接描述了葉片姿態。' }, { id: 'certain-cause', text: '植物一定因為有人說話才變挺。', feedback: '紀錄沒有談到說話，也不能由這些文字確定原因。' }, { id: 'always-rule', text: '所有植物只要土壤濕就會立刻變挺。', feedback: '單一模擬案例不能支持所有植物都遵守這個規則。' }]), correctOptionIds: Object.freeze(['observed-leaf']), hints: Object.freeze(['觀察句描述看見的狀態；原因句需要另外的證據。', '選能直接在前後紀錄找到的描述。']), incorrectFeedback: '把每個說法和紀錄逐字比對；紀錄沒有的原因不能當成已證明。', correctFeedback: '你區分了觀察與未驗證原因。文字模擬不等於實際植物觀察或因果實驗。' }),
  ]), ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['應由教師確認真實植物觀察活動的安全安排與學生先備。', '本任務是文字模擬，不提供實際觀察材料、照片或操作。']),
});

export const GRADE2_LIVING_INQUIRY_PLAN = Object.freeze({
  activityId: 'ACT-G2-LIVING-INQUIRY-PLAN-CANDIDATE', revision: 1,
  title: '小小探究家：安排觀察步驟', gradeId: 'grade-2', subjectId: 'living-curriculum', status: candidate,
  sourceKind: 'original_simulated_inquiry_candidate_not_textbook', curriculumMapId: 'living-curriculum-stage1-observation-inquiry', sourceId: 'living-curriculum', curriculumCodes: ['2-I-1', '2-I-4', '2-I-5', 'C-I-3'],
  curriculumScope: '生活課程第一學習階段的感官探索、發現問題與運用探究方法之局部參照。本活動只排序模擬的觀察程序並分類可用紀錄工具；不等同實際動手探究或完成真實問題解決。',
  learningObjective: { objectiveId: 'LO-G2-LIVING-INQUIRY-PLAN-01', statement: '依探究目標排列簡單的觀察流程，並為觀察項目選擇合適的紀錄工具。', status: candidate },
  instructions: '幫探索隊安排一個可執行的觀察流程，再為觀察內容挑選適合的記錄工具。這是模擬規劃，不會真的收集校園資料。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'order-inquiry-steps', interaction: 'order_items', prompt: '調查「哪種紙飛機滑行得較遠」時，排列一個公平的觀察流程。', items: Object.freeze([{ id: 'question', text: '先說清楚要比較什麼問題。' }, { id: 'same-start', text: '從相同起點放飛紙飛機。' }, { id: 'observe', text: '觀察並記錄每次滑行距離。' }, { id: 'compare', text: '比較記錄，再說出看到的結果。' }]), initialOrder: Object.freeze(['observe', 'compare', 'question', 'same-start']), correctItemIds: Object.freeze(['question', 'same-start', 'observe', 'compare']), hints: Object.freeze(['先決定要回答的問題，再安排可以公平比較的做法。', '先固定起點，再觀察記錄，最後才比較資料。']), incorrectFeedback: '檢查流程是否先有問題、再用一致方式觀察記錄，最後根據紀錄比較。', correctFeedback: '流程順序能先定問題並保持起點一致。下一步為不同觀察選合適記錄方法。' }),
    Object.freeze({ stageId: 'classify-recording-tools', interaction: 'classify_observations', prompt: '把觀察紀錄配到較合適的工具。', observations: Object.freeze([{ id: 'distance', text: '記下每次滑行到哪個刻度。' }, { id: 'colour', text: '記錄紙飛機主要顏色。' }, { id: 'voice', text: '保留小隊分享觀察的口頭內容。' }, { id: 'sequence', text: '記下每次試飛的先後順序。' }]), categories: Object.freeze([{ id: 'table', label: '表格或刻度記錄' }, { id: 'audio', label: '錄音或口頭分享' }]), correctAssignments: Object.freeze({ distance: 'table', colour: 'table', voice: 'audio', sequence: 'table' }), hints: Object.freeze(['想想需要保留的是可比較的數字／項目，還是說話內容。', '刻度、顏色和順序可逐項記錄；口頭分享可用錄音或分享紀錄。']), incorrectFeedback: '工具要能保留要觀察的資訊；距離與順序需可回看比較，說話內容則要保留聲音或分享紀錄。', correctFeedback: '你依資訊種類選擇記錄方式。畫面只模擬規劃，沒有實際操作紙飛機或合作觀察。' }),
  ]), ...noReinforcement, reinforcementActivityIds: noReinforcement.reinforcementActivityIds,
  evidencePolicy, teacherReview: review,
  openQuestions: Object.freeze(['紙飛機實際操作需教師確認場地、安全、材料及公平比較方法。', '活動沒有多人即時合作或真實觀察資料。']),
});
