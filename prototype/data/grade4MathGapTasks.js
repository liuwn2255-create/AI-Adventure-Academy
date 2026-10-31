const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, freeze(entry)])));
  return value;
};

const candidate = (task) => freeze({
  ...task,
  gradeId: 'grade-4',
  sourceId: 'mathematics',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_learning_activity_not_textbook',
  evidencePolicy: { persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false },
  teacherReview: { status: 'not_reviewed', reviewer: null, reviewedAt: null },
  reinforcementActivityIds: [],
  reinforcementStatus: '尚無連結的補強活動',
});

export const GRADE4_MATH_ROUNDING_ESTIMATION = candidate({
  activityId: 'ACT-G4-MATH-ROUNDING-ESTIMATION-CANDIDATE',
  subjectId: 'mathematics',
  title: '估算補給站：取概數再估一估',
  curriculumMapId: 'math-grade4-rounding-estimation',
  curriculumCodes: ['N-4-4', 'n-II-4'],
  curriculumScope: '部分對應 N-4-4：三個情境以指定位數取近似後估算總量／乘積，學生用數值滑桿提交合理估算範圍。未涵蓋無條件進入與無條件捨去的完整操作、近似符號「≈」書寫、四則估算全類型及完整生活問題解決。官方內容列於四年級學習內容表；n-II-4 為第二學習階段表現，未推定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-4-ROUND-AND-ESTIMATE-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-N4-4-ROUND-AND-ESTIMATE-CANDIDATE'], limitation: '只練習四捨五入到指定單位後估算；沒有把合理估算當精確答案，亦未教無條件進入／捨去、≈符號及四則估算完整範圍。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-ROUNDING-ESTIMATION-CANDIDATE-01', statement: '在大數生活情境中依指定位數取概數，再以估算值判斷總量或乘積是否合理。', status: 'candidate_pending_teacher_review' },
  instructions: '先看題目要求的取概數單位，心算或口算各數的近似值，再用滑桿提交合理的估算範圍。活動接受合理估算區間，不要求把估算寫成精確計算結果。',
  completionReward: '估算探險家候選徽章',
  openQuestions: ['需教師確認取概數位數、數值範圍與先備運算是否適合目標班級。', '螢幕滑桿只記錄一個估算值；未評量學生口頭說明取概數策略，也未證明獨立掌握。'],
  stages: [
    {
      stageId: 'estimate-festival-supplies', interaction: 'set_estimate_range',
      prompt: '園遊會兩批物資各有 18,640 件和 32,520 件。先把每個數四捨五入到千位，再估一估合計大約多少件。',
      hints: ['先分別看百位：18,640 的百位是 6，32,520 的百位是 5；依千位四捨五入。', '把 18,640 約看成 19,000、32,520 約看成 33,000，再合併估算；答案不必是精確總數。'],
      estimateRules: { inputRange: { min: 48000, max: 56000, step: 1000 }, acceptableRange: { min: 51000, max: 54000 } },
      incorrectFeedback: '這是估算任務，先確認兩個數都已依百位四捨五入到千位，再把近似數合併；不要把精確總數當唯一答案。',
      correctFeedback: '你的估算落在合理範圍。依千位四捨五入約為 19,000 + 33,000 = 52,000 件；精確合計是另一種計算結果。',
    },
    {
      stageId: 'estimate-school-trip-distance', interaction: 'set_estimate_range',
      prompt: '六個班各準備 1,970 公尺的步道資料。把每班距離四捨五入到千位，再估一估六班合計距離。',
      hints: ['1,970 的百位是 9；想想千位四捨五入時應往哪個千位靠近。', '先把 1,970 約看成 2,000，再用六個 2,000 估總量。'],
      estimateRules: { inputRange: { min: 8000, max: 16000, step: 1000 }, acceptableRange: { min: 11000, max: 13000 } },
      incorrectFeedback: '先取每一班的近似距離，再用相同的六份估總量；不要把一班的數值直接當作六班總和。',
      correctFeedback: '估算約為六個 2,000，也就是約 12,000 公尺。新情境仍只檢查一種四捨五入估算方法。',
    },
    {
      stageId: 'estimate-boxes-for-four-teams', interaction: 'set_estimate_range',
      prompt: '四隊各需要 2,430 張活動卡。把每隊張數四捨五入到百位，再估一估四隊共需要多少張。',
      hints: ['看十位數，判斷 2,430 取到百位時要保留在 2,400 還是進到 2,500。', '用每隊約 2,400 張乘以四隊，選一個接近的總量。'],
      estimateRules: { inputRange: { min: 8000, max: 12000, step: 100 }, acceptableRange: { min: 9400, max: 9800 } },
      incorrectFeedback: '核對取概數的單位是百位，再把近似的每隊數量乘以四；接受合理近似值，不要求精確乘積。',
      correctFeedback: '每隊約 2,400 張，四隊約 9,600 張。估算結果和精確乘法不同，仍可用來快速判斷數量級。',
    },
  ],
});

const point = (row, column) => ({ row, column });
const candidateLineStage = (stage) => ({ ...stage, interaction: 'construct_lines' });

export const GRADE4_MATH_PARALLEL_PERPENDICULAR_LINES = candidate({
  activityId: 'ACT-G4-MATH-PARALLEL-PERPENDICULAR-LINE-BUILDER-CANDIDATE',
  subjectId: 'mathematics',
  title: '平行垂直線路建造場',
  curriculumMapId: 'math-grade4-parallel-perpendicular-lines',
  curriculumCodes: ['S-4-5', 's-II-3'],
  curriculumScope: '部分對應 S-4-5：以方格點實際建構垂直線及平行線，並從兩條平行線間相同的格距觀察距離關係。未涵蓋三角板／直尺實物作圖、所有方向與位置、正式證明或教師對實物操作的觀察。課綱說明平行線距離處處相等屬操作觀察，非數學證明。',
  learningSubitemClaims: ['SUB-MATH-G4-S4-5-CONSTRUCT-PARALLEL-PERPENDICULAR-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-S4-5-CONSTRUCT-PARALLEL-PERPENDICULAR-CANDIDATE'], limitation: '螢幕格點上的線段建構與等距觀察；不取代使用三角板、直尺在紙面作圖，也不要求或評量數學證明。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-PARALLEL-PERPENDICULAR-CANDIDATE-01', statement: '在方格上建構通過指定點的垂直線或平行線，並以格點觀察平行線間的固定距離。', status: 'candidate_pending_teacher_review' },
  instructions: '先看參考線與紅色指定點，再依任務要求點選兩個格點畫出新線段。檢查直角關係或平行方向；平行間距以方格觀察，不是形式證明。',
  completionReward: '幾何路線規劃員候選徽章',
  openQuestions: ['需教師確認直角、平行及垂直用語與三角板、直尺先備。', '方格點作圖屬螢幕模擬，不等同實物工具的作圖精確度。'],
  stages: [
    candidateLineStage({
      stageId: 'construct-perpendicular-through-crossing',
      prompt: '參考線橫向通過紅點。請用兩個格點畫一條通過紅點、與參考線垂直的新線。',
      hints: ['垂直相交會形成直角；先想哪個方向和橫向線形成 90°。', '紅點在第 3 列、第 3 欄。從紅點上下延伸，選同一欄的兩個端點。'],
      lineRules: { rows: 7, columns: 7, relation: 'perpendicular', referenceSegments: [{ start: point(3, 1), end: point(3, 5) }], requiredPoint: point(3, 3) },
      incorrectFeedback: '檢查新線是否通過紅點，以及它與橫向參考線是否形成直角。端點不必和參考線端點相同。',
      correctFeedback: '新線通過指定點並與參考線垂直。這次是螢幕格點建構，實物三角板作圖仍需另行操作。',
    }),
    candidateLineStage({
      stageId: 'construct-parallel-and-compare-spacing',
      prompt: '參考線斜向右上。請通過紅點畫一條與它平行的新線，再觀察兩線之間的格距。',
      hints: ['平行線方向相同、不相交；先比較參考線每向右一格會向上或向下幾格。', '紅點位於第 2 列、第 5 欄。新線也要每向右一格就向上移一格，並通過紅點。'],
      lineRules: { rows: 7, columns: 7, relation: 'parallel', referenceSegments: [{ start: point(0, 0), end: point(3, 3) }], requiredPoint: point(2, 5) },
      incorrectFeedback: '檢查斜率方向是否和參考線相同，並確認新線穿過紅點。兩條平行線的間距要用垂直方向比較。',
      correctFeedback: '新線與參考線方向相同且通過紅點；沿垂直方向觀察，格距保持相同。這是操作觀察，不是形式證明。',
    }),
    candidateLineStage({
      stageId: 'construct-perpendicular-to-diagonal',
      prompt: '換成斜線：參考線從左下往右上，紅點在它上面。畫一條通過紅點並與參考線垂直的新線。',
      hints: ['垂直不一定是畫面上的直上直下；要看兩條線是否形成直角。', '參考線每向右一格就向下（畫面座標）一格；垂直方向需左右、上下都改變，形成相反斜向。'],
      lineRules: { rows: 7, columns: 7, relation: 'perpendicular', referenceSegments: [{ start: point(1, 1), end: point(5, 5) }], requiredPoint: point(3, 3) },
      incorrectFeedback: '不要只看線在畫面上的方向名稱；請用格點位移比較兩線，確認通過紅點且方向互相垂直。',
      correctFeedback: '你在不同方向的參考線上再次建構垂直線。螢幕格點只提供概念練習，不能取代紙上工具作圖。',
    }),
  ],
});

export const GRADE4_MATH_DECIMAL_PLACE_OPERATIONS = candidate({
  activityId: 'ACT-G4-MATH-DECIMAL-HUNDREDTHS-OPERATIONS-CANDIDATE',
  subjectId: 'mathematics',
  title: '小數位值工坊：十分位與百分位',
  curriculumMapId: 'math-grade4-decimal-hundredths-operations',
  curriculumCodes: ['N-4-7', 'n-II-7'],
  curriculumScope: '部分對應 N-4-7：用個位、十分位、百分位操作位值，練習二位小數加、減及整數倍各一種情境。未涵蓋完整直式算法、廣泛比較與生活問題；介面位值操作是數位模型，不等同紙筆直式教學。官方學習內容表 PDF 頁序29；同表連結第二學習階段表現 n-II-7，不推定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-7-DECIMAL-PLACE-OPERATIONS-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-N4-7-DECIMAL-PLACE-OPERATIONS-CANDIDATE'], limitation: '數位位值增減器呈現小數加減與整數倍的局部操作；不評量紙筆直式步驟、全部數值範圍及連續量情境遷移。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-DECIMAL-HUNDREDTHS-CANDIDATE-01', statement: '操作個位、十分位與百分位的數值增減，解釋二位小數加減及整數倍中的位值變化。', status: 'candidate_pending_teacher_review' },
  instructions: '依題目用位值操作板增減 1、0.1 或 0.01。留意百分位累積成十分位、十分位累積成個位；作答後可以看提示並重試。',
  completionReward: '小數位值建造師候選徽章',
  openQuestions: ['需教師確認小數運算先備與操作步數對四年級學生是否合宜。', '數位增減器不是紙筆直式演算評量；沒有學生口頭策略或真實生活量測證據。'],
  stages: [
    {
      stageId: 'add-decimals-regroup-hundredths', interaction: 'adjust_decimal_place_value',
      prompt: '材料站有 1.26 公尺色帶，又送來 2.35 公尺。用位值板合併，找出總長度。',
      hints: ['先把 2.35 拆成 2 個一、3 個 0.1 和 5 個 0.01，再逐位加入 1.26。', '百分位 6 個加 5 個會超過 10 個百分位；先留 1 個百分位，再把 10 個百分位換成 1 個十分位。'],
      decimalRules: { initialHundredths: 126, minHundredths: 0, maxHundredths: 999, targetHundredths: 361 },
      incorrectFeedback: '請核對每個位值按鈕代表的數量；百分位滿十要換成一個十分位，並保留小數點位置。',
      correctFeedback: '位值操作得到 3.61 公尺。百分位的進位會改變十分位，數位模型讓你看見二位小數加法中的位值關係。',
    },
    {
      stageId: 'subtract-across-tenths-and-hundredths', interaction: 'adjust_decimal_place_value',
      prompt: '工具箱有 5.02 公尺繩，使用 1.38 公尺後，操作位值板算出剩下多少公尺。',
      hints: ['把要減的 1.38 拆成 1 個一、3 個十分位、8 個百分位。', '5.02 的百分位不夠減 8 個百分位，要從十分位再向個位借位；檢查每次減少後的顯示值。'],
      decimalRules: { initialHundredths: 502, minHundredths: 0, maxHundredths: 999, targetHundredths: 364 },
      incorrectFeedback: '檢查百分位不夠減時的借位，再確認減少 1 個、0.1 或 0.01 的次數是否和題目一致。',
      correctFeedback: '位值操作得到 3.64 公尺。從十分位借位後再減百分位，能把小數點兩側的位值對齊理解。',
    },
    {
      stageId: 'double-decimal-quantity-transfer', interaction: 'adjust_decimal_place_value',
      prompt: '一段裝飾帶長 2.35 公尺，另一段長度相同。從第一段開始，再加上一段，找出兩段總長。',
      hints: ['這是 2.35 的兩倍，也就是把第二個 2.35 加到起始的 2.35。', '再增加 2 個一、3 個十分位和 5 個百分位，注意百分位累積的換位。'],
      decimalRules: { initialHundredths: 235, minHundredths: 0, maxHundredths: 999, targetHundredths: 470 },
      incorrectFeedback: '整數倍可看成相同數量重複合併；再依個位、十分位、百分位分別增加第二份。',
      correctFeedback: '兩段共 4.70 公尺，也可寫成 4.7 公尺。新情境再次檢查位值操作，但不代表涵蓋 N-4-7 全部內容。',
    },
  ],
});

const transformedCellsForTask = (cells, { row, column, rotation = 0, flipped = false }) => {
  let points = cells.map(([r, c]) => [r, c]);
  if (flipped) {
    const maxColumn = Math.max(...points.map(([, c]) => c));
    points = points.map(([r, c]) => [r, maxColumn - c]);
  }
  for (let turn = 0; turn < rotation; turn += 1) {
    const maxRow = Math.max(...points.map(([r]) => r));
    points = points.map(([r, c]) => [c, maxRow - r]);
    const minRow = Math.min(...points.map(([r]) => r)); const minColumn = Math.min(...points.map(([, c]) => c));
    points = points.map(([r, c]) => [r - minRow, c - minColumn]);
  }
  return points.map(([r, c]) => ({ row: r + row, column: c + column }));
};

const congruenceStage = ({ stageId, prompt, hints, targetTransform, incorrectFeedback, correctFeedback }) => {
  const cells = [[0, 0], [1, 0], [1, 1], [2, 1]];
  const piece = { id: 'kite-tile', label: '四格風箏拼片', cells, initialPosition: { row: 1, column: 1 }, initialRotation: 0, initialFlipped: false };
  return {
    stageId, interaction: 'geometry_exploration', geometryMode: 'split_recompose',
    prompt, hints, incorrectFeedback, correctFeedback,
    board: { rows: 7, columns: 7 }, pieces: [piece], targetCells: transformedCellsForTask(cells, targetTransform),
  };
};

export const GRADE4_MATH_CONGRUENCE_TRANSFORM = candidate({
  activityId: 'ACT-G4-MATH-CONGRUENT-FIGURE-TRANSFORM-CANDIDATE',
  subjectId: 'mathematics',
  title: '全等圖形拼合站：移動、轉一轉、翻一翻',
  curriculumMapId: 'math-grade4-congruent-figure-transform',
  curriculumCodes: ['S-4-6', 's-II-2'],
  curriculumScope: '部分對應 S-4-6：以相同四格拼片實際平移、旋轉、翻轉並與目標疊合，操作中保持圖形格數與形狀不變。只涵蓋格點模型；未評量任意連續平面圖形、對應角／邊量測比較與實體裁剪疊合，不代表完整涵蓋；格點拼片是數位模型。官方四年級內容表 PDF 頁序30，明列第二學習階段表現 s-II-2；年級為官方年級表內容定位，不推定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-S4-6-CONGRUENCE-TRANSFORM-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-S4-6-CONGRUENCE-TRANSFORM-CANDIDATE'], limitation: '只操作四格拼片的平移、90°旋轉及左右翻轉來疊合；沒有一般圖形對應邊角的量測、命名或實體剪拼評量。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-CONGRUENCE-TRANSFORM-CANDIDATE-01', statement: '操作同一塊拼片，搬動位置、轉向或左右翻面後與目標疊合，觀察形狀與大小是否保持。', status: 'candidate_pending_teacher_review' },
  instructions: '選取拼片，用方向鍵搬動；需要時按「轉四分之一圈」或「左右翻面」，讓整片拼圖覆蓋藍綠色目標格。觀察每一格是否重合，以及形狀和大小是否保持。',
  completionReward: '圖形變換探險家候選徽章',
  openQuestions: ['需教師確認拼片單位格模型是否適合本班的全等概念引入。', '本活動不測量對應角與邊，也不取代紙片剪拼、透明片疊合等實物操作。'],
  stages: [
    congruenceStage({
      stageId: 'translate-congruent-tile', targetTransform: { row: 2, column: 4 },
      prompt: '風箏拼片要搬到右側的同形目標。只做平移，保持方向不變，讓每一格都重合。',
      hints: ['只搬動位置，不轉也不翻面。先選取拼片，再用方向鍵移動。', '拼片起點在第 2 列第 2 欄，目標起點在第 3 列第 5 欄；向下 1 格、向右 3 格。'],
      incorrectFeedback: '目標需要整片重合。每一格都要往同一方向移動相同距離，形狀與朝向要保持。',
      correctFeedback: '整片搬到目標後完全疊合。位置改變，但拼片的形狀與大小保持不變。',
    }),
    congruenceStage({
      stageId: 'rotate-congruent-tile', targetTransform: { row: 2, column: 2, rotation: 1 },
      prompt: '第二張目標轉了方向。先轉動拼片，再移到目標格，確認每一格都能疊合。',
      hints: ['轉過後方向會改變，但不拉長、不縮小。選取拼片後按「轉四分之一圈」。', '轉一次後觀察短臂和長臂位置，再用方向鍵移到藍綠格。'],
      incorrectFeedback: '若有格子沒有重合，檢查轉動方向和搬動位置；拼片格數仍須相同。',
      correctFeedback: '轉過方向並搬到目標後疊合成功。這個操作示範形狀大小保持，不是測量所有對應角邊。',
    }),
    congruenceStage({
      stageId: 'flip-congruent-tile-transfer', targetTransform: { row: 2, column: 4, flipped: true },
      prompt: '最後一張目標像鏡子中的拼片。左右翻轉後移到目標，檢查能否完全重合。',
      hints: ['左右翻面會交換左右位置，不會改變拼片格數或單格大小。', '先選取拼片按「左右翻面」，再向下 1 格、向右 3 格。'],
      incorrectFeedback: '檢查是否真的左右翻面，以及翻面後整片是否移到目標；不能只移動部分格子。',
      correctFeedback: '左右翻面後也能與目標疊合。活動只操作格點拼片；對應角相等、對應邊相等仍需另外學習與檢查。',
    }),
  ],
});

const expressionStage = (stage) => ({ ...stage, interaction: 'assemble_response' });
const calculationStage = (stage) => ({ ...stage, interaction: 'complete_calculation_steps' });

export const GRADE4_MATH_COMPOUND_EXPRESSION_ORDER = candidate({
  activityId: 'ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE',
  subjectId: 'mathematics',
  title: '運算順序調度站：列式、逐步計算',
  curriculumMapId: 'math-grade4-compound-expression-order',
  curriculumCodes: ['R-4-1', 'r-II-3'],
  curriculumScope: '部分對應 R-4-1、r-II-3：以整數情境組出含乘除、加減、括號或連續同級運算的併式，再逐步選擇中間值計算。未涵蓋所有四則混合題型、學生自行口頭說明、廣泛應用問題或紙筆評量；選項是計算步驟支架，不代表已掌握運算約定。官方 R-4-1 位於四年級學習內容表 PDF頁序30–31（跨頁備註），r-II-3 位於第二學習階段學習表現 PDF頁序11；不推定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-R4-1-COMPOUND-EXPRESSION-ORDER-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-R4-1-COMPOUND-EXPRESSION-ORDER-CANDIDATE'], limitation: '練習併式順序：先乘除後加減、括號先算、乘除及減法同級由左往右；未涵蓋完整題型、策略說明與獨立紙筆遷移。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE-01', statement: '從整數情境組合兩步驟算式，依括號與四則混合計算約定排出計算步驟，再用中間結果檢查答案。', status: 'candidate_pending_teacher_review' },
  instructions: '讀懂情境後，按順序組出算式；再逐格完成中間計算。留意先乘除後加減、括號先算，以及同級運算由左往右。',
  completionReward: '運算順序調度員候選徽章',
  openQuestions: ['需教師確認乘除與括號的先備知識及例題難度。', '以按鈕排列算式片段和選取中間值為數位支架，未評量自由書寫或口頭理由。', '只涵蓋本關列出的整數例子，不代表 R-4-1 全部內容。'],
  stages: [
    expressionStage({
      stageId: 'assemble-multiply-before-add',
      prompt: '三個補給箱每箱 4 瓶，再多找到 5 瓶。依「箱數、每箱瓶數、另外找到的瓶數」組出算式。',
      hints: ['先表示 3 箱、每箱 4 瓶，再把另外 5 瓶加上。', '算式是 3 × 4 + 5；先乘出箱內總數，再加額外瓶數。'],
      tokens: [{ id: 'n3', text: '3' }, { id: 'mul1', text: '×' }, { id: 'n4a', text: '4' }, { id: 'add1', text: '+' }, { id: 'n5', text: '5' }, { id: 'sub1', text: '−' }],
      correctOptionIds: ['n3', 'mul1', 'n4a', 'add1', 'n5'],
      incorrectFeedback: '先用乘法表示相同箱數，再把額外 5 瓶加上；不要把「每箱」誤當成再加一次。',
      correctFeedback: '你組出 3 × 4 + 5，將情境轉成併式。下一步再依約定計算。',
    }),
    calculationStage({
      stageId: 'calculate-multiply-before-add',
      prompt: '逐步計算 3 × 4 + 5：先完成乘法，再把結果加上 5。',
      hints: ['沒有括號時，乘法先於加法。', '先算 3 × 4 = 12，再算 12 + 5。'],
      calculationTitle: '先乘除後加減',
      calculationSteps: [
        { id: 'product', label: '第一步：3 × 4 = ?', expectedValue: 12, choices: [{ value: 7 }, { value: 12 }, { value: 20 }] },
        { id: 'sum', label: '第二步：第一步結果 + 5 = ?', expectedValue: 17, choices: [{ value: 15 }, { value: 17 }, { value: 20 }] },
      ],
      incorrectFeedback: '檢查第一步是否先乘，再用第一步的中間結果加 5；錯在中間值時先修正該步。',
      correctFeedback: '3 × 4 + 5 = 12 + 5 = 17。你用中間結果完成計算。',
    }),
    expressionStage({
      stageId: 'assemble-parentheses-first',
      prompt: '營地先把 8 箱與 4 箱合併，再把這樣的隊伍數準備 3 份。用括號標出先合併的部分。',
      hints: ['「先合併 8 和 4」表示加法要放在括號中。', '依情境組成 (8 + 4) × 3。'],
      tokens: [{ id: 'lp', text: '(' }, { id: 'n8', text: '8' }, { id: 'plus2', text: '+' }, { id: 'n4b', text: '4' }, { id: 'rp', text: ')' }, { id: 'mul2', text: '×' }, { id: 'n3b', text: '3' }, { id: 'minus2', text: '−' }],
      correctOptionIds: ['lp', 'n8', 'plus2', 'n4b', 'rp', 'mul2', 'n3b'],
      incorrectFeedback: '情境說明先合併 8 和 4，所以括號必須包住加法，再乘以 3 份。',
      correctFeedback: '你把先做的加法放進括號，表示 (8 + 4) × 3。',
    }),
    calculationStage({
      stageId: 'calculate-parentheses-first',
      prompt: '逐步計算 (8 + 4) × 3：先完成括號內，再乘以 3。',
      hints: ['括號先算，即使外面是乘法也要先處理括號。', '先算 8 + 4 = 12，再算 12 × 3。'],
      calculationTitle: '括號先算',
      calculationSteps: [
        { id: 'bracket', label: '第一步：8 + 4 = ?', expectedValue: 12, choices: [{ value: 4 }, { value: 12 }, { value: 24 }] },
        { id: 'times', label: '第二步：第一步結果 × 3 = ?', expectedValue: 36, choices: [{ value: 15 }, { value: 24 }, { value: 36 }] },
      ],
      incorrectFeedback: '先檢查括號內的和，再將該中間結果乘 3；不要跳過括號。',
      correctFeedback: '(8 + 4) × 3 = 12 × 3 = 36。括號改變了先計算的部分。',
    }),
    expressionStage({
      stageId: 'assemble-left-to-right-division',
      prompt: '36 個標記先平均放進 6 盒，再把每盒的標記分成 2 份。依次組出連除算式。',
      hints: ['第一步是 36 ÷ 6；第二步再把每盒的結果 ÷ 2。', '乘除同級由左往右，組成 36 ÷ 6 ÷ 2。'],
      tokens: [{ id: 'n36', text: '36' }, { id: 'div1', text: '÷' }, { id: 'n6', text: '6' }, { id: 'div2', text: '÷' }, { id: 'n2', text: '2' }, { id: 'times3', text: '×' }],
      correctOptionIds: ['n36', 'div1', 'n6', 'div2', 'n2'],
      incorrectFeedback: '保留兩次分裝的先後關係：先除以盒數 6，再把每盒結果除以 2。',
      correctFeedback: '你依情境組出 36 ÷ 6 ÷ 2，兩次除法按問題順序列出。',
    }),
    calculationStage({
      stageId: 'calculate-left-to-right-division',
      prompt: '逐步計算 36 ÷ 6 ÷ 2；兩個除法由左往右逐次減項。',
      hints: ['乘除在同一級，依算式由左往右。', '先算 36 ÷ 6 = 6，再算 6 ÷ 2。'],
      calculationTitle: '同級運算由左往右',
      calculationSteps: [
        { id: 'firstDivide', label: '第一步：36 ÷ 6 = ?', expectedValue: 6, choices: [{ value: 3 }, { value: 6 }, { value: 12 }] },
        { id: 'secondDivide', label: '第二步：第一步結果 ÷ 2 = ?', expectedValue: 3, choices: [{ value: 2 }, { value: 3 }, { value: 6 }] },
      ],
      incorrectFeedback: '逐格檢查：先用 36 除以 6，再用第一步結果除以 2。',
      correctFeedback: '36 ÷ 6 ÷ 2 = 6 ÷ 2 = 3。你依左往右的順序保留了中間結果。',
    }),
  ],
});

export const GRADE4_MATH_BAR_CHART_BUILDER = candidate({
  activityId: 'ACT-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE',
  subjectId: 'mathematics',
  title: '資料港口：親手建造長條圖',
  curriculumMapId: 'math-grade4-data-bar-chart-builder',
  curriculumCodes: ['D-4-1', 'd-II-1'],
  curriculumScope: '部分對應 D-4-1、d-II-1：學生依提供的分類資料逐類調整長條高度，從圖表讀取及比較分類筆數；另以提供的折線資料判讀變化。未涵蓋學生自行蒐集資料、正式圖表標題／座標軸完整製作、真實生活長條圖報讀及分類資料與有序變化資料的完整辨析。數字是教學用提供資料，不是實地調查。',
  learningSubitemClaims: ['SUB-MATH-G4-D4-1-BUILD-AND-READ-BAR-CHART-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-D4-1-BUILD-AND-READ-BAR-CHART-CANDIDATE'], limitation: '提供資料下的長條高度建構與簡單圖表判讀；未涵蓋自主蒐集、正式座標軸刻度設計及資料類型完整比較。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE-01', statement: '將分類資料的各類數量轉成長條高度，並從圖表比較資料。', status: 'candidate_pending_teacher_review' },
  instructions: '依各類資料調整柱高，讓圖表忠實呈現數量；再用新情境和折線資料檢查讀圖。',
  completionReward: '圖表建造員候選徽章',
  openQuestions: ['數據為提供的教學情境，未讓學生進行真實資料蒐集。', '須由教師確認圖表術語、刻度及題目難度適合實際班級。'],
  stages: [
    { stageId: 'build-favorite-fruit-bars', interaction: 'build_bar_chart', prompt: '探險隊調查 4 種水果喜好。依資料卡調整每一根柱子的高度，完成分類長條圖。', hints: ['每一種水果是一個類別，柱高要表示這一類的人數。', '逐類對照資料卡，柱高和數字要一樣；不同類別不可互相加減。'], barChartRules: { chartTitle: '探險隊水果喜好（提供的調查資料）', yAxisTitle: '人數', maxValue: 6, categories: [{ id: 'apple', label: '蘋果', value: 4 }, { id: 'banana', label: '香蕉', value: 2 }, { id: 'orange', label: '柳橙', value: 5 }, { id: 'grape', label: '葡萄', value: 3 }] }, incorrectFeedback: '檢查每根柱子是否對應自己的類別和資料數；圖形高低要忠實表示各類數量。', correctFeedback: '長條圖已依分類資料建好；柱子的高度可直接比較各類人數。' },
    { stageId: 'transfer-library-survey-bars', interaction: 'build_bar_chart', prompt: '換一份圖書館借閱調查資料，重新建造長條圖，不能沿用上一題的柱高。', hints: ['先清空前一題想法，按新的類別資料逐根調整。', '資料為故事書 3 本、科普書 5 本、漫畫 2 本；請逐一對應類別。'], barChartRules: { chartTitle: '圖書館借閱（提供的分類資料）', yAxisTitle: '借閱本數', maxValue: 6, categories: [{ id: 'story', label: '故事書', value: 3 }, { id: 'science', label: '科普書', value: 5 }, { id: 'comic', label: '漫畫', value: 2 }] }, incorrectFeedback: '第二份資料和上一題不同，請依現在顯示的每類數量重新調整柱高。', correctFeedback: '新資料也已正確表示；科普書柱最高，漫畫柱最低。' },
    { stageId: 'read-ordered-weather-change', interaction: 'choose_response', prompt: '另一張提供的折線圖記錄連續 4 天氣溫：22、25、24、28 度。哪一句符合圖上的有序變化？', hints: ['折線資料依日期排列，查看相鄰日期的數值如何改變。', '第 1 到第 2 天上升，第 2 到第 3 天下跌，最後再上升。'], options: [{ id: 'rise-fall-rise', text: '氣溫先上升、再下降、最後上升。' }, { id: 'always-rise', text: '每天都比前一天低。' }, { id: 'category-count', text: '這是不同類別的票數，順序可以任意交換。' }], correctOptionIds: ['rise-fall-rise'], incorrectFeedback: '折線圖資料有時間順序，請依日期比較相鄰兩天，不要把它當成可任意排序的分類資料。', correctFeedback: '你根據有序資料讀出變化。折線圖情境是提供資料的判讀，不是實際天氣觀測。' },
  ],
});

const triangleStage = (stage) => ({ ...stage, interaction: 'construct_triangle', triangleRules: { rows: 5, columns: 5, ...stage.triangleRules } });

export const GRADE4_MATH_TRIANGLE_CONSTRUCTION = candidate({
  activityId: 'ACT-G4-MATH-SPECIAL-TRIANGLE-CONSTRUCTION-CANDIDATE',
  subjectId: 'mathematics',
  title: '三角形測繪隊：依邊角特徵動手作圖',
  curriculumMapId: 'math-grade4-special-triangle-construction',
  curriculumCodes: ['S-4-7', 's-II-3'],
  curriculumScope: '部分對應 S-4-7、s-II-3：在格點板選取三個不共線頂點，形成可見三角形，依邊長或角的性質檢查等腰、直角、銳角與鈍角三角形。未涵蓋正三角形作圖、量角器／尺規實物作圖、自由畫圖、完整三角形性質說明及所有作圖方法。格點座標計算是螢幕模型。',
  learningSubitemClaims: ['SUB-MATH-G4-S4-7-CLASSIFY-AND-CONSTRUCT-TRIANGLES-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-S4-7-CLASSIFY-AND-CONSTRUCT-TRIANGLES-CANDIDATE'], limitation: '只以格點三點建構並用邊長平方／角分類條件自動檢查等腰、直角、銳角、鈍角；不等同尺規實作，未涵蓋正三角形及完整性質解釋。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-SPECIAL-TRIANGLE-CONSTRUCTION-CANDIDATE-01', statement: '透過選取格點頂點建構三角形，並依邊或角的性質檢查圖形類別。', status: 'candidate_pending_teacher_review' },
  instructions: '每關在格點選出三個頂點，畫出三角形，再依任務要求檢查它的邊或角特徵。',
  completionReward: '三角形測繪員候選徽章',
  openQuestions: ['螢幕格點構圖不取代紙筆、尺規、三角板等實物作圖練習。', '需教師確認等腰、角分類用語與學生先備經驗。'],
  stages: [
    triangleStage({ stageId: 'construct-isosceles-triangle', prompt: '在格點選三個頂點，讓至少兩邊一樣長，完成等腰三角形。', promptLabel: '等腰三角形', triangleRules: { targetKind: 'isosceles' }, hints: ['先選一條底邊，再找一個到兩端距離相同的頂點。', '可以先試格點 (第1列第1欄)、(第1列第5欄)、(第3列第3欄)，再比較兩腰。'], incorrectFeedback: '三點要不在同一直線上，且至少兩邊長度相同；重新移動其中一個頂點。', correctFeedback: '你建構的三角形有兩邊相等，符合等腰三角形的邊長特徵。' }),
    triangleStage({ stageId: 'construct-right-triangle', prompt: '選三個頂點，讓其中一個角是直角，完成直角三角形。', promptLabel: '直角三角形', triangleRules: { targetKind: 'right' }, hints: ['可先在同一個格點選一段水平邊和一段垂直邊。', '先試三個點 (第1列第1欄)、(第1列第5欄)、(第5列第1欄)，再看兩邊是否垂直。'], incorrectFeedback: '檢查是否有兩邊在同一頂點互相垂直；如果三點共線，就不是三角形。', correctFeedback: '其中一個角由互相垂直的邊形成直角，圖形符合直角三角形。' }),
    triangleStage({ stageId: 'construct-acute-triangle', prompt: '換一個構圖，選三個頂點，讓三個角都小於直角。', promptLabel: '銳角三角形', triangleRules: { targetKind: 'acute' }, hints: ['銳角三角形的三個角都比直角小。', '避免把第三個頂點放得太低或太偏；用三個角都小於直角的格點形狀試畫。'], incorrectFeedback: '至少有一角達到或超過直角；調整一個頂點後再檢查三個角。', correctFeedback: '三個內角都小於直角，符合銳角三角形。' }),
    triangleStage({ stageId: 'construct-obtuse-triangle', prompt: '最後一關，選三個頂點，讓其中一個角大於直角。', promptLabel: '鈍角三角形', triangleRules: { targetKind: 'obtuse' }, hints: ['鈍角比直角大，但一個三角形最多只有一個鈍角。', '讓其中一個頂點形成較寬的角，再確認三點不共線。'], incorrectFeedback: '圖形目前沒有角大於直角，或三點共線；重新調整頂點。', correctFeedback: '你建構出一個大於直角的角，符合鈍角三角形。' }),
  ],
});

export const GRADE4_MATH_QUADRILATERAL_BUILDER = candidate({
  activityId: 'ACT-G4-MATH-QUADRILATERAL-FEATURE-CONSTRUCTION-CANDIDATE',
  subjectId: 'mathematics',
  title: '四邊形測繪基地：看特徵、上格點作圖',
  curriculumMapId: 'math-grade4-special-quadrilateral-construction',
  curriculumCodes: ['S-4-8', 's-II-3'],
  curriculumScope: '部分對應 S-4-8、s-II-3：在 5×5 格點依序建構正方形、長方形、平行四邊形，系統以頂點順序檢查四邊形、直角與對邊平行。官方備註指定作圖包含正方形、長方形、平行四邊形；官方條文另列菱形、梯形辨認，本活動未提供這兩者的特徵辨認任務。格點作圖為螢幕模型，不替代尺規或紙筆操作，也不完整涵蓋無支架辨認與性質說明。',
  learningSubitemClaims: ['SUB-MATH-G4-S4-8-CONSTRUCT-SPECIAL-QUADRILATERALS-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-S4-8-CONSTRUCT-SPECIAL-QUADRILATERALS-CANDIDATE'], limitation: '只用螢幕格點建構正方形、長方形、平行四邊形；未教菱形與梯形辨認、完整邊角特徵說明或實體作圖。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-SPECIAL-QUADRILATERAL-CONSTRUCTION-CANDIDATE-01', statement: '依邊長、直角與對邊平行特徵，在格點建構正方形、長方形和平行四邊形。', status: 'candidate_pending_teacher_review' },
  instructions: '依序點選四個格點作為頂點，點選順序會連成四條邊；檢查圖形特徵後提交。錯誤時可重試並重新選點。',
  completionReward: '四邊形測繪員候選徽章',
  openQuestions: ['需教師確認四邊形名稱、平行與直角概念的先備教學。', '畫面只模擬格點作圖；未評量紙筆、尺規或學生口頭說明。', '本活動未涵蓋 S-4-8 條文列出的菱形、梯形辨認。'],
  stages: [
    { stageId: 'construct-square-on-grid', interaction: 'construct_quadrilateral', prompt: '在格點依序選四個頂點，建構一個正方形。', hints: ['先選四個角點，沿外框依序連起來，不要交叉。', '四邊一樣長、四個角都是直角；可試 r0c0、r0c2、r2c2、r2c0。'], quadrilateralRules: { rows: 5, columns: 5, targetKind: 'square', promptLabel: '正方形' }, incorrectFeedback: '檢查頂點是否依外框順序連接；正方形要四邊等長且四角為直角。可取消選點後重畫。', correctFeedback: '格點圖形符合四邊等長與四個直角的條件。這次是螢幕格點建構。' },
    { stageId: 'construct-rectangle-on-grid', interaction: 'construct_quadrilateral', prompt: '換一個大小，在格點建構長方形。', hints: ['長方形四個角都是直角，對邊相等。', '可試 r0c0、r0c3、r2c3、r2c0；四個頂點沿外框依序選。'], quadrilateralRules: { rows: 5, columns: 5, targetKind: 'rectangle', promptLabel: '長方形' }, incorrectFeedback: '請檢查四個角是否為直角，並讓邊依外框順序連接；重新選點再試。', correctFeedback: '你建構了四角為直角、對邊等長的長方形。依這些性質，正方形也符合長方形的條件；本題用較長的長方形作比較範例。' },
    { stageId: 'construct-parallelogram-on-grid', interaction: 'construct_quadrilateral', prompt: '最後建構一個斜放的平行四邊形，讓兩組對邊分別平行。', hints: ['兩組對邊要朝相同方向，頂點仍依外框順序連起。', '可試 r0c1、r1c3、r3c2、r2c0。'], quadrilateralRules: { rows: 5, columns: 5, targetKind: 'parallelogram', promptLabel: '平行四邊形' }, incorrectFeedback: '檢查兩組對邊是否分別平行，也確認邊沒有交叉或三點落在同一直線。', correctFeedback: '你建構的圖形兩組對邊分別平行。這只涵蓋格點作圖中的一部分特徵。' },
  ],
});

export const GRADE4_MATH_AREA_PERIMETER_MODEL = candidate({
  activityId: 'ACT-G4-MATH-AREA-PERIMETER-ARRAY-MODEL-CANDIDATE',
  subjectId: 'mathematics',
  title: '方格工地：建面積、算周長',
  curriculumMapId: 'math-grade4-rectangle-area-perimeter-model',
  curriculumCodes: ['S-4-3', 's-II-1'],
  curriculumScope: '部分對應 S-4-3：以可操作方格陣列建構長方形，讀出長、寬並逐步計算面積及周長。未涵蓋正方形獨立情境、不同邊長整數組合的廣泛應用、兩圖形複合圖形、實物量測，也不評量 R-4-3 所要求的文字與運算符號聯合表示公式。',
  learningSubitemClaims: ['SUB-MATH-G4-S4-3-RECTANGLE-AREA-PERIMETER-ARRAY-MODEL-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-S4-3-RECTANGLE-AREA-PERIMETER-ARRAY-MODEL-CANDIDATE'], limitation: '使用方格陣列練習長方形面積與周長公式的一組數位情境；未涵蓋正方形、兩形複合圖形、廣泛應用與實物量測。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-RECTANGLE-AREA-PERIMETER-CANDIDATE-01', statement: '用方格陣列表示長方形，區分面積的列×欄與周長的邊長合計，並逐步計算。', status: 'candidate_pending_teacher_review' },
  instructions: '調整方格陣列建成任務尺寸，再依陣列列數和欄數計算面積與周長。',
  completionReward: '方格工地主任候選徽章',
  openQuestions: ['需教師確認面積、周長公式是否已在班級進度中教學。', '方格是螢幕模型，未包含學生用尺實測周長或面積。', '只涵蓋長方形數位例題，不涵蓋兩圖形複合圖形及正方形獨立任務。'],
  stages: [
    { stageId: 'build-3-by-4-array', interaction: 'build_array', prompt: '工地要鋪一塊長 4 格、寬 3 格的長方形地板。調整方格陣列，讓每個單位方格都看得見。', hints: ['陣列的排數表示寬，每排個數表示長。', '調整成 3 排、每排 4 格，再數全部方格；面積用列數乘每列格數。'], arrayRules: { maxRows: 6, maxColumns: 6, targetRows: 3, targetColumns: 4 }, incorrectFeedback: '核對陣列是否 3 排、每排 4 格；面積計算的是全部單位方格數。', correctFeedback: '3 排×每排4格共有12格，表示這個模型的面積是12平方單位。' },
    { stageId: 'calculate-rectangle-perimeter', interaction: 'complete_calculation_steps', prompt: '沿著剛才 3×4 方格地板外圍裝邊條。依長方形對邊相等，逐步算周長。', hints: ['周長是繞外框一圈的長度，不是內部方格總數。', '兩條長 4、兩條寬 3：先算 4+3，再把結果乘 2。'], calculationTitle: '長方形周長', calculationSteps: [{ id: 'side-sum', label: '第一步：長 + 寬 = ?', expectedValue: 7, choices: [{ value: 6 }, { value: 7 }, { value: 12 }] }, { id: 'double-side-sum', label: '第二步：2 × 第一步結果 = ?', expectedValue: 14, choices: [{ value: 10 }, { value: 14 }, { value: 24 }] }], incorrectFeedback: '面積數方格；周長只沿外框。先把一長一寬相加，再乘 2。', correctFeedback: '周長為 2×(4+3)=14 個長度單位，與12個內部方格所表示的面積不同。' },
    { stageId: 'transfer-2-by-5-area-perimeter', interaction: 'build_array', prompt: '新工地換成長 5 格、寬 2 格。重新建陣列，不要沿用上一題的排數。', hints: ['先看新尺寸：2 排、每排 5 格。', '調整到 2×5；這次內部方格數是面積模型，外框邊長仍要另算。'], arrayRules: { maxRows: 6, maxColumns: 6, targetRows: 2, targetColumns: 5 }, incorrectFeedback: '依新尺寸重新調整陣列；相同面積不代表周長也相同。', correctFeedback: '新陣列有10個單位方格。這個活動以兩個長方形情境練習面積模型，尚未比較不同形狀的周長。' },
  ],
});

export const GRADE4_MATH_KILOMETER_ROUTE = candidate({
  activityId: 'ACT-G4-MATH-KILOMETER-ROUTE-AND-CONVERSION-CANDIDATE',
  subjectId: 'mathematics',
  title: '公里探險路線：估一估、定位、換算',
  curriculumMapId: 'math-grade4-kilometer-route-and-conversion',
  curriculumCodes: ['N-4-9', 'n-II-9'],
  curriculumScope: '部分對應 N-4-9、n-II-9：在提供的路線情境估計公里距離、於公里數線定位，並逐步將整數公里換成公尺後合併計算。未涵蓋實地步行測距、真實地圖比例尺判讀、其他長度單位全套換算及學生口頭量感說明。距離與資料是螢幕教學情境，不是實測。官方內容表 PDF 頁序29，第二學習階段表現 n-II-9 PDF 頁序12；未指定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-9-KILOMETER-SENSE-AND-CONVERSION-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-N4-9-KILOMETER-SENSE-AND-CONVERSION-CANDIDATE'], limitation: '數位路線距離估計、公里數線定位與整數公里換算公尺；未評量真實距離感、實地測量或其他長度單位完整換算。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-KILOMETER-ROUTE-CANDIDATE-01', statement: '在生活路線情境中估計公里距離、定位公里數，並以 1 公里 = 1000 公尺進行簡單換算與計算。', status: 'candidate_pending_teacher_review' },
  instructions: '跟著探險路線先估距離，再把里程標記放到公里數線上，最後用逐步算式換算公尺。每一關都要依新的路線資料操作。',
  completionReward: '公里路線規劃員候選徽章',
  openQuestions: ['距離為螢幕提供情境，不能代替戶外步行或地圖比例尺實測。', '教師需確認公里量感、1000 公尺換算與此年級課程進度。'],
  stages: [
    { stageId: 'estimate-park-route-kilometers', interaction: 'set_estimate_range', prompt: '公園到自然中心的探險路線約在 1 到 6 公里之間。依路線線索選一個合理的公里估計值。', hints: ['公里適合描述較長的路程；先排除太短或超出線索範圍的數字。', '路線線索顯示約 3 公里，滑桿選 2 到 4 公里都可接受；不要求精確測量。'], estimateRules: { inputRange: { min: 0, max: 6, step: 1 }, acceptableRange: { min: 2, max: 4 } }, incorrectFeedback: '回看題目給的路程範圍與公里線索；這題是在建立公里量感，估計要落在合理範圍。', correctFeedback: '估計落在題目線索支持的範圍。這是提供情境中的估計，不代表實地量得的距離。' },
    { stageId: 'place-five-kilometer-waypoint', interaction: 'place_number_line_marker', prompt: '補給站位在起點後 5 公里。把里程標記放到 0 到 8 公里的數線上。', hints: ['數線每一格增加 1 公里，從 0 開始往右數。', '標記應在第 5 個刻度；注意起點的 0 不算第一公里。'], numberLine: { start: 0, end: 8, tickCount: 8, targetTick: 5, valueFormat: 'integer' }, incorrectFeedback: '沿著每格 1 公里的刻度，從 0 數到第 5 格，再重新放置標記。', correctFeedback: '你把 5 公里定位在數線的第 5 格。數線是距離模型，並非實際地圖比例尺。' },
    { stageId: 'convert-and-combine-route-length', interaction: 'complete_calculation_steps', prompt: '另一段路長 3 公里，接上 2 公里路段。先把兩段都換成公尺，再算全長。', hints: ['1 公里 = 1000 公尺；先分別換算每一段。', '3 公里是 3000 公尺，2 公里是 2000 公尺；最後把兩段相加。'], calculationTitle: '公里換成公尺，再合併路段', calculationSteps: [{ id: 'three-km-to-m', label: '3 × 1000 = ? 公尺', expectedValue: 3000, choices: [{ value: 300 }, { value: 3000 }, { value: 30000 }] }, { id: 'route-total-m', label: '3000 + 2000 = ? 公尺', expectedValue: 5000, choices: [{ value: 3200 }, { value: 5000 }, { value: 5300 }] }], incorrectFeedback: '逐步檢查單位：先用 1 公里 = 1000 公尺換算，再把同為公尺的兩段相加。', correctFeedback: '3 公里換成 3000 公尺，接上 2 公里共 5000 公尺。新路段的數字不同，換算關係保持不變。' },
  ],
});

export const GRADE4_MATH_SQUARE_METER_FLOOR_PLANNER = candidate({
  activityId: 'ACT-G4-MATH-SQUARE-METER-FLOOR-PLANNER-CANDIDATE',
  subjectId: 'mathematics',
  title: '平方公尺鋪面工坊：估量與鋪出面積',
  curriculumMapId: 'math-grade4-square-meter-floor-planner',
  curriculumCodes: ['N-4-11', 'n-II-9'],
  curriculumScope: '部分對應 N-4-11、n-II-9：先估計給定矩形區域的平方公尺面積，再以每格代表 1 平方公尺的數位單位板鋪出不同大小的矩形並計數。未涵蓋真實一平方公尺板的實測與量感操作、邊長實測、複名數計算及平方公分換平方公尺（官方備註明確不做該換算）。數位方格是模型，不等同實物測量。官方內容表 PDF 頁序29，第二學習階段表現 n-II-9 PDF 頁序12；未指定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-N4-11-SQUARE-METER-ESTIMATE-AND-AREA-MODEL-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-N4-11-SQUARE-METER-ESTIMATE-AND-AREA-MODEL-CANDIDATE'], limitation: '估計與數位單位板陣列計算平方公尺面積；不替代平方公尺板實測、身體量感活動或其他真實測量。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-SQUARE-METER-FLOOR-CANDIDATE-01', statement: '以平方公尺作為面積單位，對矩形鋪面估量，並透過每格代表 1 平方公尺的陣列計數面積。', status: 'candidate_pending_teacher_review' },
  instructions: '先估計鋪面需要多少平方公尺，再調整單位板的列數與欄數完成鋪面，並將新尺寸的鋪面重新建構。',
  completionReward: '平方公尺鋪面設計員候選徽章',
  openQuestions: ['數位單位板不能取代實際平方公尺板、教室地面估量及教師觀察的量感操作。', '教師需確認平方公尺概念與估測數值範圍適合班級進度。'],
  stages: [
    { stageId: 'estimate-rectangular-floor-area', interaction: 'set_estimate_range', prompt: '工坊要鋪一塊長 4 公尺、寬 3 公尺的矩形區域。先估計面積大約幾平方公尺。', hints: ['每一平方公尺板蓋住一個 1 公尺乘 1 公尺的方塊區域。', '可用 4 × 3 想一想，合理估計會接近 12 平方公尺。'], estimateRules: { inputRange: { min: 4, max: 20, step: 1 }, acceptableRange: { min: 10, max: 14 } }, incorrectFeedback: '重新把長度和寬度想成每邊有幾個 1 平方公尺單位；面積估計要接近整個鋪面所需的單位板數。', correctFeedback: '估計接近 12 平方公尺。此為螢幕情境的合理範圍，真實鋪面仍須實地量測。' },
    { stageId: 'tile-six-square-meter-floor', interaction: 'build_array', prompt: '小休息區長 3 公尺、寬 2 公尺。每個方格代表 1 平方公尺，調整單位板陣列鋪滿區域。', hints: ['列數表示一個方向有幾排，欄數表示另一個方向每排幾格。', '建成 2 排、每排 3 格；總面積是單位板數量。'], arrayRules: { maxRows: 5, maxColumns: 5, targetRows: 2, targetColumns: 3, objectLabel: '1㎡', unitLabel: '平方公尺' }, incorrectFeedback: '檢查是否有 2 排、每排 3 格；每格是 1 平方公尺，數格子而不是量外框。', correctFeedback: '6 塊每塊 1 平方公尺的單位板，共鋪出 6 平方公尺。這是數位陣列模型。' },
    { stageId: 'transfer-twelve-square-meter-floor', interaction: 'build_array', prompt: '換到另一塊長 4 公尺、寬 3 公尺的展區。重新調整單位板陣列，不要沿用前一題。', hints: ['新區域每邊的公尺數已改變，先重新設定排數與每排格數。', '建成 3 排、每排 4 格；每格仍代表 1 平方公尺。'], arrayRules: { maxRows: 5, maxColumns: 5, targetRows: 3, targetColumns: 4, objectLabel: '1㎡', unitLabel: '平方公尺' }, incorrectFeedback: '依照新尺寸重新鋪板；一格代表一平方公尺，總面積看完整陣列有幾格。', correctFeedback: '新陣列有 12 塊單位板，表示模型面積為 12 平方公尺。活動不包含真實地面測量。' },
  ],
});

const token = (id, text) => ({ id, text });
const formulaStage = (stage) => ({ ...stage, interaction: 'assemble_response' });
const propertyExpressionStage = (stage) => ({ ...stage, interaction: 'assemble_response' });
const gridPatternStage = (stage) => ({ ...stage, interaction: 'compose_pattern' });

export const GRADE4_MATH_COMPUTATION_PROPERTIES = candidate({
  activityId: 'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE',
  subjectId: 'mathematics',
  title: '運算性質補給所：把算式變得好計算',
  curriculumMapId: 'math-grade4-computation-properties',
  curriculumCodes: ['R-4-2', 'r-II-4'],
  curriculumScope: '部分對應 R-4-2：把生活情境列成算式後，重排三數乘法因數或改寫乘除先後，再計算；另練加減混合的等值重排。未涵蓋所有四則混合規律、a−(b−c) 去括號（官方明示不做），也未涵蓋廣泛自由列式。調整後算式不再解釋原情境的要求以情境提示呈現。對應 r-II-4（第二學習階段），不推定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-R4-2-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-R4-2-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE'], limitation: '以算式片段組合、排序及中間計算操作乘法換序、乘除等值改寫及一種加減重排；不是 R-4-2 全部規律的完整教學或自由書寫評量。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-01', statement: '把情境整理成算式，運用已學的計算規律改寫成較方便的算式，再用步驟計算核對結果。', status: 'candidate_pending_teacher_review' },
  instructions: '先用算式片段呈現補給情境，再依任務調整算式，最後逐步計算。改寫後的算式是計算工具，不一定能逐項對回原故事中的物件。',
  completionReward: '算式調度員候選徽章',
  openQuestions: ['需教師確認「計算規律」及改寫等值算式的教學用語與先備知識。', '組合片段與選中間值是支架操作，未評量學生自行書寫完整推理。'],
  stages: [
    propertyExpressionStage({
      stageId: 'translate-supply-story-to-product',
      prompt: '四個隊伍各有 25 箱，每箱 6 張地圖。先依故事組成表示總張數的算式。',
      tokens: [token('a4','4'), token('x1','×'), token('b25','25'), token('x2','×'), token('c6','6'), token('plus','+')],
      correctOptionIds: ['a4','x1','b25','x2','c6'],
      hints: ['找出「隊伍數、每隊箱數、每箱張數」三個相乘的數量。', '依故事先組成 4 × 25 × 6；這一步是在翻譯情境。'],
      incorrectFeedback: '逐一對照故事中的三種數量；三個量都要乘在一起，不能漏掉每箱張數。',
      correctFeedback: '算式 4 × 25 × 6 對應故事的三個數量。接著會把算式改成較容易計算的形式。',
    }),
    {
      stageId: 'reorder-factors-for-easy-product', interaction: 'order_items',
      prompt: '算式已從故事建立。重新排列因數，讓 4 先和 6 相乘，再乘 25；這是計算改寫，不必再把每個位置解釋成原故事。',
      items: [{id:'f4',text:'4'},{id:'op1',text:'×'},{id:'f25',text:'25'},{id:'op2',text:'×'},{id:'f6',text:'6'}],
      initialOrder: ['f4','op1','f25','op2','f6'],
      correctItemIds: ['f4','op1','f6','op2','f25'],
      hints: ['三數相乘可以調整因數順序，乘積不變。', '先把 4 和 6 放在一起，再把 25 放最後：4 × 6 × 25。'],
      incorrectFeedback: '檢查有沒有保留三個因數和兩個乘號；把 4 與 6 相鄰可先算成 24。',
      correctFeedback: '4 × 6 × 25 與 4 × 25 × 6 的乘積相同；改寫後的因數次序是計算策略。',
    },
    calculationStage({
      stageId: 'calculate-regrouped-product',
      prompt: '完成改寫後，逐步計算 4 × 6 × 25。',
      calculationTitle: '先算容易的一組',
      calculationSteps: [
        {id:'four-times-six',label:'4 × 6 = ?',expectedValue:24,choices:[{value:20,label:'20'},{value:24,label:'24'},{value:30,label:'30'}],incorrectFeedback:'先算 4 組 6，檢查乘法結果。'},
        {id:'times-twenty-five',label:'24 × 25 = ?',expectedValue:600,choices:[{value:500,label:'500'},{value:600,label:'600'},{value:625,label:'625'}],incorrectFeedback:'把 24 看成 6×4，可先用 25×4，再乘 6。'},
      ],
      hints: ['先算 4 × 6，把中間結果記下。', '24 × 25 可看成 25 × 4 × 6；25×4=100，再乘 6。'],
      incorrectFeedback: '檢查每一步的中間值；因數順序調整不會改變乘積。',
      correctFeedback: '先算 4×6=24，再算 24×25=600。這是數的運算性質用來簡化計算的例子。',
    }),
    propertyExpressionStage({
      stageId: 'translate-multiply-then-divide-story',
      prompt: '倉庫有 60 個補給包，平均分到 3 組後，每組要乘上 5 張識別卡。先依「總數 × 5 ÷ 3」的計算情境組成算式，再比較等值改寫。',
      tokens: [token('n60','60'),token('m','×'),token('n5','5'),token('d','÷'),token('n3','3'),token('add','+')],
      correctOptionIds: ['n60','m','n5','d','n3'],
      hints: ['先找總數 60、乘數 5、除數 3，依題目給的計算關係組式。', '先組成 60 × 5 ÷ 3；再看是否可先用 60 ÷ 3。'],
      incorrectFeedback: '確認算式同時包含 60、5、3，並依「乘以5，再除以3」組成。',
      correctFeedback: '原計算式是 60 × 5 ÷ 3。下一步會把較容易先算的部分調整到前面。',
    }),
    {
      stageId: 'reorder-multiply-divide-equivalently', interaction: 'order_items',
      prompt: '把 60 × 5 ÷ 3 改寫為先除後乘，結果保持相同。',
      items: [{id:'n60',text:'60'},{id:'mul',text:'×'},{id:'n5',text:'5'},{id:'div',text:'÷'},{id:'n3',text:'3'}],
      initialOrder: ['n60','mul','n5','div','n3'],
      correctItemIds: ['n60','div','n3','mul','n5'],
      hints: ['官方本列允許練習先乘後除與先除後乘結果相同的情形。', '把 60 ÷ 3 放在一起，排列為 60 ÷ 3 × 5。'],
      incorrectFeedback: '只調整計算順序，數字、乘號、除號都不能增減；先讓 60 除以 3。',
      correctFeedback: '60 ÷ 3 × 5 = 20 × 5，與 60 × 5 ÷ 3 的結果一致。',
    },
    calculationStage({
      stageId: 'calculate-equivalent-multiply-divide',
      prompt: '使用改寫後的 60 ÷ 3 × 5，完成兩步計算。',
      calculationTitle: '先除再乘',
      calculationSteps: [
        {id:'sixty-divided-three',label:'60 ÷ 3 = ?',expectedValue:20,choices:[{value:15,label:'15'},{value:20,label:'20'},{value:30,label:'30'}],incorrectFeedback:'把60平均分成3組，每組是多少？'},
        {id:'twenty-times-five',label:'20 × 5 = ?',expectedValue:100,choices:[{value:80,label:'80'},{value:100,label:'100'},{value:120,label:'120'}],incorrectFeedback:'用第一步的商20，再乘5。'},
      ],
      hints: ['先求 60 ÷ 3 的結果。', '把得到的 20 再乘 5，並與原算式想像的結果核對。'],
      incorrectFeedback: '依改寫後的順序逐步計算；等值改寫不改變最後結果。',
      correctFeedback: '先算 60÷3=20，再算 20×5=100。活動只練此類乘除等值變換。',
    }),
    {
      stageId: 'reorder-add-subtract-mixed-expression', interaction: 'order_items',
      prompt: '整理物資記錄：原有 140 份，增加 20 份，再扣除 60 份。將加法先算的等值算式排好。',
      items: [{id:'a140',text:'140'},{id:'minus',text:'−'},{id:'b60',text:'60'},{id:'plus',text:'+'},{id:'c20',text:'20'}],
      initialOrder: ['a140','minus','b60','plus','c20'],
      correctItemIds: ['a140','plus','c20','minus','b60'],
      hints: ['原式是 140 − 60 + 20；加上的 20 可以與 140 先合併。', '改排成 140 + 20 − 60；不要把減號後的括號改成減去負數。'],
      incorrectFeedback: '保留數量關係：140 增加 20，最後扣除 60；不能改成 140−(20−60)。',
      correctFeedback: '140 + 20 − 60 與 140 − 60 + 20 結果相同。沒有使用官方明示不教的 a−(b−c) 去括號。',
    },
    calculationStage({
      stageId: 'calculate-reordered-add-subtract',
      prompt: '依 140 + 20 − 60 的順序完成計算。',
      calculationTitle: '加減混合計算',
      calculationSteps: [
        {id:'add-twenty',label:'140 + 20 = ?',expectedValue:160,choices:[{value:150,label:'150'},{value:160,label:'160'},{value:170,label:'170'}],incorrectFeedback:'先把原有數量和增加的數量合併。'},
        {id:'subtract-sixty',label:'160 − 60 = ?',expectedValue:100,choices:[{value:90,label:'90'},{value:100,label:'100'},{value:120,label:'120'}],incorrectFeedback:'再從中間結果扣除60。'},
      ],
      hints: ['先算 140+20。', '用第一步的 160 再減 60；和原情境的總量關係相符。'],
      incorrectFeedback: '依照排好的等值算式逐步計算，並確認減去的是 60。',
      correctFeedback: '改寫後計算為 140+20−60=100。此活動只示範一種加減重排情境。',
    }),
  ],
});

export const GRADE4_MATH_TEXT_FORMULA_WORKSHOP = candidate({
  activityId: 'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE',
  subjectId: 'mathematics',
  title: '公式工坊：文字和符號一起用',
  curriculumMapId: 'math-grade4-text-formula-application',
  curriculumCodes: ['R-4-3', 'r-II-5'],
  curriculumScope: '部分對應 R-4-3：操作文字與運算符號組成「長方形面積＝長×寬」及「正方形周長＝邊長×4」，再將新尺寸代入公式計算。S-4-3 僅作官方示例脈絡，不宣稱由本活動完整涵蓋；未涵蓋其他公式、自由表述、兩圖形複合圖形及實物測量。第二學習階段表現 r-II-5 不代表特定學期。',
  learningSubitemClaims: ['SUB-MATH-G4-R4-3-TEXT-AND-SYMBOL-FORMULA-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-R4-3-TEXT-AND-SYMBOL-FORMULA-CANDIDATE'], limitation: '只組合並應用兩個官方示例公式；不涵蓋其他數學公式、口頭／自由書寫表達，也不因公式示例而宣稱 S-4-3 全面覆蓋。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-TEXT-FORMULA-APPLICATION-01', statement: '把表示量的文字和運算符號組成公式，並將新的邊長資料代入公式計算。', status: 'candidate_pending_teacher_review' },
  instructions: '先把公式中的名稱與運算符號排成完整句式，再把題目給的新數值代入，逐步完成計算。',
  completionReward: '公式建造師候選徽章',
  openQuestions: ['需教師確認「公式」及「長、寬、邊長」文字符號搭配方式與學生先備。', '以按鈕組合表示公式，不是自由書寫評量；面積／周長數字模型不能取代紙筆或實物量測。'],
  stages: [
    formulaStage({
      stageId: 'assemble-rectangle-area-formula',
      prompt: '長方形地板要鋪滿內部。把「面積」與長、寬的運算關係組成公式。',
      tokens: [token('area','長方形面積'),token('eq','＝'),token('length','長'),token('times','×'),token('width','寬'),token('plus','＋')],
      correctOptionIds: ['area','eq','length','times','width'],
      hints: ['公式要同時看見量的名稱和運算符號。', '依官方示例排成：長方形面積 ＝ 長 × 寬。'],
      incorrectFeedback: '檢查名稱和符號順序：左邊是面積，右邊用長乘寬。',
      correctFeedback: '你組成「長方形面積＝長×寬」。這是文字和運算符號聯合表示的公式。',
    }),
    calculationStage({
      stageId: 'apply-rectangle-area-formula',
      prompt: '另一塊長方形地板長 9 格、寬 4 格。依剛才的公式計算面積。',
      calculationTitle: '代入長與寬',
      calculationSteps: [
        {id:'substitute-area',label:'面積 = 9 × 4 = ?',expectedValue:36,choices:[{value:13,label:'13'},{value:36,label:'36'},{value:94,label:'94'}],incorrectFeedback:'把長9和寬4代入長×寬，不是把兩個數字接在一起。'},
      ],
      hints: ['先辨認哪個數是長、哪個數是寬。', '將 9 與 4 代入「長×寬」，再計算乘積。'],
      incorrectFeedback: '公式中的兩個量都要代入；長方形面積用長乘寬。',
      correctFeedback: '9×4=36，這個長方形模型的面積是36平方格。',
    }),
    formulaStage({
      stageId: 'assemble-square-perimeter-formula',
      prompt: '正方形圍欄四邊一樣長。把正方形周長的文字和運算符號組成公式。',
      tokens: [token('perimeter','正方形周長'),token('eq','＝'),token('side','邊長'),token('times','×'),token('four','4'),token('plus','＋')],
      correctOptionIds: ['perimeter','eq','side','times','four'],
      hints: ['正方形周長要把四條相同邊長合起來。', '用乘法表示四條相同的邊：正方形周長＝邊長×4。'],
      incorrectFeedback: '確認要表達四條相同邊長的總和，使用「邊長×4」。',
      correctFeedback: '公式「正方形周長＝邊長×4」將文字與運算符號放在同一表示式中。',
    }),
    calculationStage({
      stageId: 'apply-square-perimeter-formula',
      prompt: '正方形花圃每邊 7 公尺。把邊長代入公式，求外圍一圈長度。',
      calculationTitle: '代入正方形邊長',
      calculationSteps: [
        {id:'substitute-perimeter',label:'周長 = 7 × 4 = ?',expectedValue:28,choices:[{value:11,label:'11'},{value:28,label:'28'},{value:49,label:'49'}],incorrectFeedback:'周長沿四邊計算；不是求 7×7 的面積。'},
      ],
      hints: ['邊長是7，正方形有4條一樣長的邊。', '代入公式算 7×4，答案的單位是公尺。'],
      incorrectFeedback: '這題問圍欄外框一圈，代入周長公式，不要使用面積公式。',
      correctFeedback: '7×4=28，正方形周長為28公尺。活動只涵蓋此公式示例及代入。',
    }),
  ],
});

const patternTokens = [
  token('v22','22'), token('v33','33'), token('v5','5'), token('v11','11'),
  token('v19','19'), token('v24','24'), token('odd','奇數'), token('even','偶數'),
];
export const GRADE4_MATH_TWO_DIMENSIONAL_PATTERN_WORKSHOP = candidate({
  activityId: 'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE',
  subjectId: 'mathematics',
  title: '數字圖樣研究站：找規律、補空格',
  curriculumMapId: 'math-grade4-two-dimensional-number-patterns',
  curriculumCodes: ['R-4-4', 'r-II-2'],
  curriculumScope: '部分對應 R-4-4：以可操作二維數字格觀察橫向／縱向變化並補缺，再以奇偶數加、減、乘例子判斷結果奇偶並選擇理由。未涵蓋百數表與月曆的完整多類模式、所有奇偶運算情境或正式公式（本活動不提供公式）；不推定教學學期。',
  learningSubitemClaims: ['SUB-MATH-G4-R4-4-TWO-DIMENSIONAL-PATTERN-REASONING-CANDIDATE'],
  coverage: { status: 'partial', subitemIds: ['SUB-MATH-G4-R4-4-TWO-DIMENSIONAL-PATTERN-REASONING-CANDIDATE'], limitation: '補填兩組小型二維數字格及奇偶加減乘三個例子；未涵蓋整百數表、月曆、所有變化模式及學生自由說明推理。格中數值為遊戲設計情境。' },
  learningObjective: { objectiveId: 'LO-G4-MATH-TWO-DIMENSIONAL-PATTERN-REASONING-01', statement: '觀察數字格的橫向與縱向變化來補空格，並以例子推理奇偶數加減乘的結果類型。', status: 'candidate_pending_teacher_review' },
  instructions: '依格子的行、列變化找到規律，點選數字補入空格；再觀察奇數與偶數運算例子，判斷結果類型並選出符合例子的理由。這些是簡化的數字模型，不使用公式。',
  completionReward: '規律觀察員候選徽章',
  openQuestions: ['需教師確認數字圖大小、奇偶術語與實際先備活動。', '格子呈現數位模型，不取代紙本百數表、月曆觀察或學生口頭推理。'],
  stages: [
    gridPatternStage({
      stageId: 'fill-row-and-column-number-pattern',
      prompt: '研究數字圖：往右每格增加 1，往下每列增加 10。點選兩個數字，依序補上空格。',
      tokens: patternTokens,
      patternRules: { beatCount: 2, minDistinctTokens: 2, minRepeatedTokenCount: 1, targetPattern: ['v22','v33'], grid: [['11','12','13'],['21',null,'23'],['31','32',null]] },
      hints: ['先比較同一列往右的數字，再比較同一欄往下的數字。', '第二列中間是22；第三列最後一格是33。'],
      incorrectFeedback: '每次只補一格，先看橫向是否每次加1，再看縱向是否每次加10。',
      correctFeedback: '兩個空格依序是22和33；橫向每格加1、縱向每列加10，兩個方向都符合。',
    }),
    gridPatternStage({
      stageId: 'transfer-calendar-like-grid-pattern',
      prompt: '換一張日期數字圖：往右每格加 1，往下每列加 7。依空格位置補入數字。',
      tokens: [token('v5','5'),token('v11','11'),token('v19','19'),token('v12','12'),token('v18','18'),token('v24','24'),token('v22','22'),token('v33','33')],
      patternRules: { beatCount: 3, minDistinctTokens: 3, minRepeatedTokenCount: 1, targetPattern: ['v5','v11','v19'], grid: [['3','4',null],['10',null,'12'],['17','18',null]] },
      hints: ['這次每往下一列增加7，不是增加10；同一列仍往右加1。', '由10往下到第三列是17；第二列中間介於10與12之間。'],
      incorrectFeedback: '重新檢查兩種方向的差：橫向是1，縱向是7，不能把第一題的縱向差照搬過來。',
      correctFeedback: '依序補成5、11、19；變化規則與第一張數字圖不同，需重新比較行與列。',
    }),
    gridPatternStage({
      stageId: 'observe-odd-even-operation-patterns',
      prompt: '用三個數字例子觀察奇偶運算：3+5、8−3、3×5。把每個結果分類成奇數或偶數。',
      tokens: [token('odd','奇數'),token('even','偶數')],
      patternRules: { beatCount: 3, minDistinctTokens: 2, minRepeatedTokenCount: 1, targetPattern: ['even','odd','odd'], grid: [['運算例子','結果'],['3 + 5',null],['8 − 3',null],['3 × 5',null]] },
      hints: ['先算每個例子的結果，再判斷能否兩個一組分完。', '8−3=5、3×5=15 都是奇數；3+5=8 是偶數。'],
      incorrectFeedback: '不要只背「奇偶」名稱，先計算每一列，再看結果能否兩個一組分完。',
      correctFeedback: '例子依序為偶數、奇數、奇數。這三個例子用來觀察模式，未取代所有奇偶運算情境。',
    }),
    {
      stageId: 'choose-evidence-based-parity-reason',
      interaction: 'choose_response',
      prompt: '你觀察到 3+5 是偶數、8−3 和 3×5 是奇數。選出最符合這些例子的說明。',
      options: [
        {id:'reason-pairs',text:'偶數可以兩個一組分完；奇數會多出一個。這些例子符合結果的分類。'},
        {id:'reason-larger',text:'只要計算結果比較大就是偶數。'},
        {id:'reason-symbol',text:'只看算式中有沒有加號就能判斷結果。'},
      ],
      correctOptionIds: ['reason-pairs'],
      hints: ['回想奇數與偶數可以怎樣分組。', '判斷結果奇偶要看計算後能否兩個一組分完，不是看結果大小或運算符號。'],
      incorrectFeedback: '請回到三個算例檢查：5、8、15 的奇偶不是由大小或只看符號決定。',
      correctFeedback: '你用能否兩個一組分完來說明奇偶，並以例子檢查推理。這只是有限例子的說明練習。',
    },
  ],
});

export const GRADE4_MATH_GAP_TASKS = freeze([
  GRADE4_MATH_ROUNDING_ESTIMATION,
  GRADE4_MATH_PARALLEL_PERPENDICULAR_LINES,
  GRADE4_MATH_DECIMAL_PLACE_OPERATIONS,
  GRADE4_MATH_CONGRUENCE_TRANSFORM,
  GRADE4_MATH_COMPOUND_EXPRESSION_ORDER,
  GRADE4_MATH_BAR_CHART_BUILDER,
  GRADE4_MATH_TRIANGLE_CONSTRUCTION,
  GRADE4_MATH_QUADRILATERAL_BUILDER,
  GRADE4_MATH_AREA_PERIMETER_MODEL,
  GRADE4_MATH_KILOMETER_ROUTE,
  GRADE4_MATH_SQUARE_METER_FLOOR_PLANNER,
  GRADE4_MATH_COMPUTATION_PROPERTIES,
  GRADE4_MATH_TEXT_FORMULA_WORKSHOP,
  GRADE4_MATH_TWO_DIMENSIONAL_PATTERN_WORKSHOP,
]);
