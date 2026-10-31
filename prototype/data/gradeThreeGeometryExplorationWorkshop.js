const freeze = (value) => Object.freeze(value);
const freezeRows = (value) => Object.freeze(value.map((row) => Object.freeze(row)));
const cubeFaces = (positions) => freezeRows(positions.map(([id, row, column]) => ({ id, row, column })));
const crossNet = cubeFaces([['A', 1, 0], ['B', 1, 1], ['C', 1, 2], ['D', 1, 3], ['E', 0, 1], ['F', 2, 1]]);
const offsetNet = cubeFaces([['A', 1, 0], ['B', 1, 1], ['C', 1, 2], ['D', 1, 3], ['E', 0, 0], ['F', 2, 2]]);
const packedSix = cubeFaces([['A', 0, 0], ['B', 0, 1], ['C', 0, 2], ['D', 1, 0], ['E', 1, 1], ['F', 1, 2]]);

const netCandidates = freeze([
  freeze({ id: 'cross-net', label: '展開圖甲：十字展開', faces: crossNet, expectedFoldable: true }),
  freeze({ id: 'offset-net', label: '展開圖乙：錯開的展開圖', faces: offsetNet, expectedFoldable: true }),
  freeze({ id: 'packed-six', label: '展開圖丙：六格緊靠', faces: packedSix, expectedFoldable: false }),
]);

export const GRADE3_GEOMETRY_EXPLORATION_WORKSHOP = freeze({
  activityId: 'ACT-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-FOLD-CANDIDATE',
  revision: 1,
  title: '幾何探險工坊：圖形拼組與立體展開',
  gradeId: 'grade-3',
  subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_game_content_not_from_textbook',
  curriculumMapId: 'math-grade3-s-3-4-geometry-operations',
  sourceId: 'mathematics',
  curriculumCodes: ['S-3-4', 's-II-4'],
  curriculumAlignment: 'partial',
  curriculumScope: '官方 S-3-4（PDF頁序27–28）要求以操作活動分割與重組平面圖形，初步體驗展開圖黏合成立體，並知道不同展開圖可黏成同形立體；同表對應第二學習階段表現 s-II-4。參考教具欄列「多種展開圖」。本關提供螢幕上的方格片移動／旋轉與立方體展開圖摺合模擬，符合初步操作體驗方向；不作操作以外紙筆評量，不主張取代實體剪拼或教師觀察，也不做複雜幾何歸納。年級表列三年級不代表已確認校本學期或教材順序。',
  learningObjective: {
    objectiveId: 'LO-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-CANDIDATE-01',
    statement: '移動與旋轉平面拼片完成目標外形，並操作不同展開圖的摺合模擬，觀察立體各面的相鄰關係。',
    status: 'candidate_pending_teacher_review',
  },
  instructions: '在工坊先把平面拼片移到目標圖形，再試著摺合不同的立方體展開圖。每次操作都能重新調整；這是螢幕模擬，不能取代紙片剪拼。',
  coverage: freeze({
    subitemId: 'SUB-MATH-G3-S3-4-PLANAR-RECOMPOSITION-AND-CUBE-NET-OPERATION',
    coveredByInteraction: freeze(['geometry_exploration']),
    coveredStages: freeze(['recompose-square-from-two-dominoes', 'recompose-rectangle-from-two-l-pieces', 'fold-two-cube-nets-and-observe-adjacency', 'compare-another-cube-net-and-face-neighbors']),
    notCovered: freeze(['實體剪裁、黏貼及手動摺紙的操作表現', '完整教學範圍內所有平面分割與重組方式', '對多種展開圖作複雜推理或數學性質歸納', '教師觀察下的口語說明與紙筆以外的實作紀錄']),
  }),
  learningSubitemClaims: freeze(['SUB-MATH-G3-S3-4-PLANAR-RECOMPOSITION-AND-CUBE-NET-OPERATION']),
  completionReward: '幾何摺拼探險章（候選）',
  stages: freeze([
    freeze({
      stageId: 'recompose-square-from-two-dominoes',
      interaction: 'geometry_exploration',
      geometryMode: 'split_recompose',
      prompt: '一個 2×2 正方形沿著中間切成兩條長方形片。選一片，用方向鍵移動；需要時旋轉，把兩片拼回目標正方形。',
      board: freeze({ rows: 4, columns: 4 }),
      targetCells: freezeRows([[1, 1], [1, 2], [2, 1], [2, 2]].map(([row, column]) => ({ row, column }))),
      pieces: freeze([
        freeze({ id: 'domino-top', label: '上方長方形片', cells: freezeRows([[0, 0], [0, 1]]), initialPosition: freeze({ row: 0, column: 1 }), initialRotation: 0 }),
        freeze({ id: 'domino-bottom', label: '下方長方形片', cells: freezeRows([[0, 0], [0, 1]]), initialPosition: freeze({ row: 2, column: 1 }), initialRotation: 3 }),
      ]),
      hints: freeze(['先看目標正方形共有四格；兩片長方形各有兩格，應合起來剛好蓋住四格。', '選取一片後可按上、下、左、右移動；按「旋轉」改變方向，避免重疊並完整覆蓋目標。']),
      incorrectFeedback: '兩片需要剛好填滿目標四格，不能重疊或留空。選取其中一片，移動或旋轉後再檢查。',
      correctFeedback: '你把兩條長方形片移動並旋轉後拼回 2×2 正方形。這是平面分割與重組的一種螢幕操作。',
    }),
    freeze({
      stageId: 'recompose-rectangle-from-two-l-pieces',
      interaction: 'geometry_exploration',
      geometryMode: 'split_recompose',
      prompt: '換成兩片 L 形拼片，將它們移動或旋轉，拼成 2 排、每排 3 格的長方形。',
      board: freeze({ rows: 4, columns: 5 }),
      targetCells: freezeRows([[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]].map(([row, column]) => ({ row, column }))),
      pieces: freeze([
        freeze({ id: 'l-piece-a', label: 'L 形拼片甲', cells: freezeRows([[0, 0], [1, 0], [1, 1]]), initialPosition: freeze({ row: 0, column: 0 }), initialRotation: 0 }),
        freeze({ id: 'l-piece-b', label: 'L 形拼片乙', cells: freezeRows([[0, 0], [1, 0], [1, 1]]), initialPosition: freeze({ row: 2, column: 3 }), initialRotation: 2 }),
      ]),
      hints: freeze(['每片 L 形拼片各占三格，目標長方形有六格；先把兩片移到目標附近。', '觀察 L 形凹口方向；選取拼片後可旋轉，再微調位置讓六格不重疊、沒有空格。']),
      incorrectFeedback: '檢查六個目標格是否每格只被一片覆蓋。若凹口方向不合，先選取拼片旋轉，再移動位置。',
      correctFeedback: '你用兩片 L 形拼片重組成 2×3 長方形。更換拼片形狀後，你仍能靠觀察位置與方向完成拼組。',
    }),
    freeze({
      stageId: 'fold-two-cube-nets-and-observe-adjacency',
      interaction: 'geometry_exploration',
      geometryMode: 'fold_net',
      prompt: '選一種展開圖按「模擬摺合」，觀察立方體。再判斷 A 面和 E 面摺合後是否共用一條邊。',
      netCandidates,
      queriedFaceIds: freeze(['A', 'E']),
      hints: freeze(['先看六個方形面是否連成一片；按下摺合模擬，看看各面方向有沒有重疊。', '摺合成功後，找出 A 面與 E 面在立方體上是否貼著同一條邊；若展開圖無法摺成形體，就不能用它判斷立方體面鄰接。']),
      incorrectFeedback: '先確認選取的展開圖能否摺成立方體，再沿立方體的邊觀察 A 面和 E 面是否相鄰。可換另一種展開圖重試。',
      correctFeedback: '你先操作展開圖摺合，再用立體上的面邊關係判斷。不同展開圖可以組成同一形狀的立方體；本活動只是初步螢幕體驗。',
    }),
    freeze({
      stageId: 'compare-another-cube-net-and-face-neighbors',
      interaction: 'geometry_exploration',
      geometryMode: 'fold_net',
      prompt: '換一個觀察問題：摺合展開圖後，C 面和 F 面是否共用一條邊？可以選不同展開圖再試。',
      netCandidates,
      queriedFaceIds: freeze(['C', 'F']),
      hints: freeze(['先按摺合，從展開平面想像面片沿相連邊往上立起。', '立方體若能摺合，找 C 面與 F 面是否相接；不要只用展開圖上的平面距離判斷。']),
      incorrectFeedback: '展開圖上相隔較遠的面摺起後仍可能相鄰。觀察立方體的面方向和共用邊，再選「相鄰」或「不相鄰」。',
      correctFeedback: '你在另一種展開排列中重新觀察面與面的鄰接。此活動不要求推導立方體展開圖的一般規則。',
    }),
  ]),
  reinforcementActivityIds: freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: freeze(['需教師確認學生是否已具備方格操作、平移與旋轉的先備經驗。', '螢幕摺合模型不是實體展開圖黏貼或摺紙的觀察證據；教師可搭配官方參考教具「多種展開圖」安排實物操作。', '不同展開圖及面鄰接活動須由教師確認適齡呈現；不應解讀成完整幾何性質或紙筆評量。']),
});
