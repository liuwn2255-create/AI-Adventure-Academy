const freeze = (value) => Object.freeze(value);

const stage = (definition) => freeze({
  interaction: 'build_area_grid',
  ...definition,
  areaGridRules: freeze({
    ...definition.areaGridRules,
    boards: freeze(definition.areaGridRules.boards.map((board) => freeze({
      ...board,
      initialCells: freeze([...(board.initialCells ?? [])]),
      targetCells: freeze([...(board.targetCells ?? [])]),
      referenceCells: freeze([...(board.referenceCells ?? [])]),
    }))),
    requiredColumns: definition.areaGridRules.requiredColumns ? freeze([...definition.areaGridRules.requiredColumns]) : undefined,
  }),
  hints: freeze(definition.hints),
});

const cells = (...ids) => ids;

export const AREA_GRID_CONSTRUCTION_WORKSHOP = freeze({
  activityId: 'ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE',
  title: '方格面積建造工坊：鋪設、點數與比較',
  revision: 1,
  status: 'candidate_pending_teacher_review',
  sourceKind: 'official_math_clause_candidate_interaction_not_textbook',
  sourceId: 'mathematics',
  runtimeModule: 'prototype/data/areaGridConstructionWorkshop.js',
  gradeId: 'grade-3',
  subjectId: 'mathematics',
  curriculumMapId: 'math-grade3-n-3-14-area',
  curriculumCodes: freeze(['N-3-14', 'n-II-9']),
  curriculumScope: '依官方 N-3-14：以平方公分單位方格模型進行簡單圖形的面積估測、點數、計算與比較；不發展一般公式。所有圖形均為本活動設計的完整 1 平方公分方格，螢幕建造只屬數位模型，不能替代實物平方公分板、紙片操作、真實量測或教師觀察。',
  learningSubitemClaims: ['SUB-MATH-G3-N3-14-UNIT-SQUARE-AREA-CONSTRUCTION'],
  learningObjective: {
    objectiveId: 'LO:chapter-scope-m3-math-area-square-centimeter:01',
    statement: '用相同大小的 1 平方公分方格建造簡單區域，依實際方格數估測、計數、比較並檢查面積。',
    status: 'candidate_pending_teacher_review',
  },
  instructions: '在每個方格中點一下，就能放入或取下 1 平方公分拼片。畫面即時點數已鋪設的方格；任務會要求你照輪廓鋪設、建造同面積的另一種形狀，或比較兩個區域。這是螢幕模擬，不是實物測量。',
  openQuestions: ['學生能否用相同大小的單位方格說明面積，而非只看外框？', '學生能否在不同形狀中以完整單位方格數量判斷並比較面積？'],
  curriculumAlignment: 'partial',
  coverage: {
    subitemId: 'SUB-MATH-G3-N3-14-UNIT-SQUARE-AREA-CONSTRUCTION',
    coveredByInteraction: ['estimate_cover', 'count_unit_squares', 'same_area_new_shape', 'complete_missing_cells', 'compare_built_regions', 'constrained_area_build'],
    notCovered: ['以實體平方公分板、紙片或真實物件進行實測', '教師觀察學生的實物操作與量感', '部分方格的估測', '三角形等未在本關操作的圖形', '一般面積公式', '周長辨別與面積公式推導'],
  },
  completionReward: '方格建造候選徽章',
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  stages: freeze([
    stage({
      stageId: 'estimate-and-cover-rectangle',
      title: '鋪設方格：先估一估，再把地板鋪滿',
      prompt: '先估一估這片地板大約有幾平方公分，再照輪廓放入單位方格。每一小格代表 1 平方公分。',
      areaGridRules: {
        mode: 'estimate_cover',
        estimate: { min: 1, max: 12, initial: 4, tolerance: 1 },
        boards: [{ id: 'floor', title: '地板輪廓', rows: 4, columns: 4, initialCells: [], targetCells: cells('r0c0','r0c1','r0c2','r1c0','r1c1','r1c2') }],
      },
      hints: ['先看輪廓中有幾排、每排幾格，但先用估計值表示你的預測。', '鋪好後可按列點數；每一格是 1 平方公分，不要把格線當成一格。'],
      incorrectFeedback: '先檢查估測值和鋪設後的方格數，再逐格比對輪廓；估測接近不代表鋪設已完成。',
      correctFeedback: '你先留下估測，再用 6 個完整單位方格鋪滿輪廓，並用方格數確認這個矩形區域是 6 平方公分。',
    }),
    stage({
      stageId: 'count-irregular-unit-square-region',
      title: '數一數：轉彎的花圃有幾平方公分？',
      prompt: '照著 L 形花圃輪廓鋪設方格，再從操作結果說出面積。',
      areaGridRules: {
        mode: 'cover_outline',
        boards: [{ id: 'garden', title: 'L 形花圃', rows: 4, columns: 4, initialCells: [], targetCells: cells('r0c0','r0c1','r0c2','r1c0','r2c0') }],
      },
      hints: ['從最上面一排開始逐格鋪設，轉彎後再沿左側往下。', '完成後把每一排的格數加起來；不要重複計算轉彎處。'],
      incorrectFeedback: '輪廓有轉彎，請逐排核對：有格子的地方都要放一片，空白處不要放。',
      correctFeedback: '你以 5 個完整單位方格覆蓋輪廓，所以這個簡單圖形是 5 平方公分。',
    }),
    stage({
      stageId: 'build-different-shape-same-area',
      title: '同面積不同形狀：建造另一座六格花圃',
      prompt: '參考圖是 6 個單位方格。請在右側建造一個連在一起、形狀不同，但方格數同樣是 6 的花圃。',
      areaGridRules: {
        mode: 'same_area_different_shape',
        targetArea: 6,
        boards: [{ id: 'new-garden', title: '新花圃（可點格子新增或移除）', rows: 4, columns: 4, initialCells: [], referenceCells: cells('r0c0','r0c1','r0c2','r1c0','r1c1','r1c2') }],
      },
      hints: ['不同形狀可以有相同面積；重點是每格大小相同且總數相同。', '先放 6 格，再檢查它們是否連在一起，也要和參考圖的形狀不一樣。'],
      incorrectFeedback: '請同時檢查三件事：方格總數是否為 6、拼片是否連在一起、形狀是否不同於參考圖。',
      correctFeedback: '新花圃和參考圖形狀不同，但都由 6 個相同單位方格組成，因此面積相同。',
    }),
    stage({
      stageId: 'fill-missing-area-grid-cells',
      title: '補齊缺格：完成五格小徑',
      prompt: '小徑輪廓中已有三片方格，請找出缺少的位置並補齊完整輪廓。',
      areaGridRules: {
        mode: 'complete_missing_cells',
        boards: [{ id: 'path', title: '小徑輪廓', rows: 4, columns: 4, initialCells: cells('r0c0','r1c0','r2c0'), targetCells: cells('r0c0','r0c1','r0c2','r1c0','r2c0') }],
      },
      hints: ['先找出輪廓中亮起但還沒有拼片的位置。', '完整小徑有 5 格，目前有 3 格；找出其餘 2 個位置後再檢查。'],
      incorrectFeedback: '請依輪廓逐格檢查：缺格要補上，輪廓外的格子則要取下。',
      correctFeedback: '你補上了輪廓缺少的兩格，完成 5 個單位方格的小徑。',
    }),
    stage({
      stageId: 'compare-built-area-regions',
      title: '面積比較任務：鋪出兩塊花圃再比較',
      prompt: '分別照甲、乙的輪廓鋪設方格，觀察兩邊實際鋪了幾格，再選擇面積關係。',
      areaGridRules: {
        mode: 'compare_regions',
        correctRelation: '<',
        boards: [
          { id: 'region-a', title: '甲花圃', rows: 4, columns: 4, initialCells: [], targetCells: cells('r0c0','r0c1','r1c0','r1c1','r2c0') },
          { id: 'region-b', title: '乙花圃', rows: 4, columns: 4, initialCells: [], targetCells: cells('r0c0','r0c1','r0c2','r1c0','r1c1','r1c2') },
        ],
      },
      hints: ['每塊花圃都要用相同大小的單位方格完整覆蓋。', '甲有 5 格、乙有 6 格；先比較方格總數，再選甲與乙的面積關係。'],
      incorrectFeedback: '請先完成兩張方格板，再依各自的方格總數比較；不要只看外框形狀。',
      correctFeedback: '甲有 5 平方公分，乙有 6 平方公分，所以甲的面積小於乙。',
    }),
    stage({
      stageId: 'integrated-build-area-constrained-garden',
      title: '綜合建造：規劃八平方公分探險營地',
      prompt: '建造一座 8 平方公分的營地：每一欄至少要有一格，每一排最多放三格。請自己安排方格位置並檢查條件。',
      areaGridRules: {
        mode: 'constrained_build',
        targetArea: 8,
        maxCellsPerRow: 3,
        requiredColumns: [0, 1, 2, 3],
        boards: [{ id: 'camp', title: '營地設計板', rows: 4, columns: 4, initialCells: [], targetCells: [] }],
      },
      hints: ['先想想如何把 8 片分散到 4 欄，同時不讓任何一排超過 3 片。', '完成後檢查方格總數、每欄是否至少一格，以及每排格數上限。'],
      incorrectFeedback: '營地條件尚未全符合；請檢查是否剛好 8 格、每欄都有格，且每排不超過 3 格。',
      correctFeedback: '你用 8 個單位方格完成了符合限制的營地。不同的安排也可能符合條件；這個數位模型沒有使用面積公式。',
    }),
  ]),
});
