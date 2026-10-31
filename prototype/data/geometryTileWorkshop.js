const squarePieces = (prefix, count) => Array.from({ length: count }, (_, index) => Object.freeze({ id: `${prefix}-square-${index + 1}`, label: `正方形方格片 ${index + 1}`, shape: 'square' }));
const trianglePieces = (prefix, count) => Array.from({ length: count }, (_, index) => Object.freeze({ id: `${prefix}-triangle-${index + 1}`, label: `三角形片 ${index + 1}`, shape: 'triangle' }));

export const GEOMETRY_TILE_WORKSHOP = Object.freeze({
  activityId: 'ACT-G3-MATH-GEOMETRY-TILE-CANDIDATE', revision: 1,
  title: '幾何建造挑戰：方格拼圖工地', gradeId: 'grade-3', subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review', sourceKind: 'original_candidate_game_content_not_from_textbook',
  curriculumMapId: 'math-grade3-s-3-4-geometry-operations', sourceId: 'mathematics', curriculumCodes: ['S-3-4', 's-II-4'], curriculumAlignment: 'partial',
  curriculumScope: '官方三年級 S-3-4 要求以操作活動分割與重組平面圖形，並初步體驗立體展開圖如何黏合；官方備註指出重點為操作體驗，勿擴展為紙筆評量。本活動只提供方格片選取、排列成矩形／正方形的螢幕模擬，未涵蓋實體剪拼或立體展開圖。s-II-4 為第二學習階段範圍。官方數學領綱 PDF 伍／二／S-3-4 P27–P28。',
  learningObjective: { objectiveId: 'LO-G3-MATH-GEOMETRY-TILE-CANDIDATE-01', statement: '操作選取等大的方格片，拼成指定列數與欄數的平面矩形或正方形。', status: 'candidate_pending_teacher_review' },
  instructions: '工地需要用等大的方格片鋪出指定形狀。點選方格片放到拼圖板，再檢查每格是否填滿；三角形片是干擾材料，可能在邊界留下缺口。這是螢幕上的候選拼組模擬。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'compose-two-by-three-rectangle', interaction: 'compose_shape', prompt: '選出 6 塊正方形方格片，拼成 2 排、每排 3 格的長方形。',
      pieces: Object.freeze([...squarePieces('rectangle', 6), ...trianglePieces('rectangle', 2)]),
      shapeRules: Object.freeze({ rows: 2, columns: 3, correctPieceIds: Object.freeze(squarePieces('rectangle', 6).map(({ id }) => id)) }),
      hints: Object.freeze(['先看拼圖板需要幾排、每排幾格，再數出需要的方格片。', '每個空格要用一塊完整正方形片填滿；三角形片不能填滿一個方格。']),
      incorrectFeedback: '檢查拼圖板的每個格子是否都由一塊方格片完整填滿。三角形片會留下缺口；可以取消選取再換片。',
      correctFeedback: '你把 6 塊等大的方格片排成 2×3 長方形。這是螢幕模擬的拼組結果，不等同於能操作實體圖形或理解所有展開圖。' }),
    Object.freeze({ stageId: 'compose-two-by-two-square', interaction: 'compose_shape', prompt: '換一個拼圖板：選出 4 塊正方形方格片，拼成 2 排、每排 2 格的正方形。',
      pieces: Object.freeze([...squarePieces('square', 4), ...trianglePieces('square', 2)]),
      shapeRules: Object.freeze({ rows: 2, columns: 2, correctPieceIds: Object.freeze(squarePieces('square', 4).map(({ id }) => id)) }),
      hints: Object.freeze(['數一數拼圖板的空格總數，選擇同樣數量的完整方格片。', '先確認沒有空格，再確認每一片都是正方形方格片。']),
      incorrectFeedback: '拼圖板有 4 個位置。檢查是否少選、多選或放入三角形片，並用新的拼圖板重新組合。',
      correctFeedback: '你用 4 塊等大的方格片組成 2×2 正方形。任務只練平面圖形重組的一種方式，不代表涵蓋 S-3-4 全部內容。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]), reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['需教師確認學生是否熟悉等大的正方形方格片、列與欄的語詞。', '螢幕拼組不等同於實際剪拼、旋轉操作、空間推理完整表現或立體展開圖體驗。', '需確認介面圖形大小、觸控操作、教材順序與是否適合作為教師試閱候選。']),
});
