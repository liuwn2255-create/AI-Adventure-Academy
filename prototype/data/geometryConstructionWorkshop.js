const squareTiles = (prefix, count) => Array.from({ length: count }, (_, index) => Object.freeze({ id: `${prefix}-tile-${index + 1}`, label: `等大正方形方格片 ${index + 1}`, shape: 'square' }));
const triangleTiles = (prefix, count) => Array.from({ length: count }, (_, index) => Object.freeze({ id: `${prefix}-triangle-${index + 1}`, label: `三角形片 ${index + 1}`, shape: 'triangle' }));

const figure = (id, label, type, rotation = 0) => Object.freeze({ id, text: `圖形 ${label}`, figure: Object.freeze({ label: `圖形 ${label}`, type, rotation }) });
const fourRightAngleOptions = Object.freeze([
  figure('right-square-a', 'A', 'square'), figure('right-rectangle-b', 'B', 'rectangle'),
  figure('right-square-c', 'C', 'square', 45), figure('right-rectangle-d', 'D', 'rectangle', -35),
  figure('right-parallelogram-e', 'E', 'parallelogram'), figure('right-trapezoid-f', 'F', 'trapezoid'),
]);

export const GEOMETRY_CONSTRUCTION_WORKSHOP = Object.freeze({
  activityId: 'ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE',
  revision: 1,
  title: '幾何建造工坊：邊角偵查與拼圖施工',
  gradeId: 'grade-3',
  subjectId: 'mathematics',
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_candidate_game_content_not_from_textbook',
  curriculumMapId: 'math-grade3-s-3-2-square-rectangle',
  sourceId: 'mathematics',
  curriculumCodes: ['S-3-2', 's-II-1'],
  learningSubitemClaims: Object.freeze(['SUB-MATH-G3-S3-2-SHAPE-SIDE-ANGLE-FEATURE-MODEL']),
  curriculumAlignment: 'partial',
  curriculumScope: '官方領綱 S-3-2（三年級學習內容表，PDF 解析頁序 P27）要求以邊與角的特徵定義正方形和長方形，並知道斜擺仍為原形；s-II-1 為第二學習階段表現。活動提供有直角符號標記的圖形分類，以及等大方格片組成正方形與長方形的螢幕拼組。分類屬視覺支援的候選練習，拼組本身不能充分證明學生會用邊與角定義圖形；不含實體操作，亦不代表完整課綱涵蓋。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G3-MATH-SQUARE-RECTANGLE-CANDIDATE-01', statement: '透過斜擺與正擺圖形辨認直角與邊長特徵，並用方格片建造正方形和長方形。', status: 'candidate_pending_teacher_review' }),
  instructions: '先在圖形卡上觀察邊與角並選出符合條件的圖形，再用等大的方格片鋪滿拼圖板。選取或取消選取都會即時更新圖形板；這是候選螢幕活動，不取代實體拼圖操作。',
  stages: Object.freeze([
    Object.freeze({ stageId: 'identify-four-right-angles', interaction: 'collect_evidence', prompt: '依圖上的直角記號，選出四個角都是直角的圖形。圖形有不同方向，請看角，不要只看擺放方向。', options: fourRightAngleOptions, correctOptionIds: Object.freeze(['right-square-a', 'right-rectangle-b', 'right-square-c', 'right-rectangle-d']), hints: Object.freeze(['每個小方角記號都表示一個直角；逐個查看圖形的角。', '正方形和長方形都有四個直角，即使斜著擺也不會改變角的大小。']), incorrectFeedback: '請逐一檢查每個圖形的四個角記號。斜擺不會改變角；平行四邊形或梯形不一定有四個直角。', correctFeedback: '你依直角特徵辨認出正方形與長方形。圖示有視覺標記支援，不能單獨證明學生能在無標記圖形中自行判斷。' }),
    Object.freeze({ stageId: 'identify-square-properties', interaction: 'collect_evidence', prompt: '找出同時「四邊一樣長」而且「四個角都是直角」的圖形。', options: Object.freeze([figure('square-upright', 'A', 'square'), figure('square-tilted', 'B', 'square', 45), figure('rectangle-wide', 'C', 'rectangle'), figure('rhombus-tilted', 'D', 'rhombus', 45)]), correctOptionIds: Object.freeze(['square-upright', 'square-tilted']), hints: Object.freeze(['這次要同時檢查邊和角，不是只看其中一項。', '四邊等長但角不是直角的圖形不符合；四角直角但邊長不全相等的長方形也不符合。']), incorrectFeedback: '重新分別檢查四邊是否等長，以及四個角是否都是直角。必須兩項條件同時成立。', correctFeedback: '你同時使用邊與角的特徵辨認正方形，斜擺的正方形仍符合條件。圖形標記仍提供支架。' }),
    Object.freeze({ stageId: 'build-square-on-grid', interaction: 'compose_shape', prompt: '用 4 塊等大的正方形方格片，鋪滿 2 排、每排 2 格的正方形拼圖板。', pieces: Object.freeze([...squareTiles('square-build', 4), ...triangleTiles('square-build', 2)]), shapeRules: Object.freeze({ rows: 2, columns: 2, correctPieceIds: Object.freeze(squareTiles('square-build', 4).map(({ id }) => id)) }), hints: Object.freeze(['先看拼圖板有幾排、每排幾格。', '每一格都要用一塊完整正方形片填滿，不留空格也不放三角形片。']), incorrectFeedback: '拼圖板要完全鋪滿。檢查方格片數量、空格及是否誤選三角形片，再重試。', correctFeedback: '你用 4 塊等大的方格片鋪成 2×2 正方形。拼組操作是形狀建造練習，仍需教師確認是否符合班級先備。' }),
    Object.freeze({ stageId: 'build-rectangle-on-grid', interaction: 'compose_shape', prompt: '換一塊拼圖板：用 6 塊等大的正方形方格片，鋪滿 2 排、每排 3 格的長方形。', pieces: Object.freeze([...squareTiles('rectangle-build', 6), ...triangleTiles('rectangle-build', 2)]), shapeRules: Object.freeze({ rows: 2, columns: 3, correctPieceIds: Object.freeze(squareTiles('rectangle-build', 6).map(({ id }) => id)) }), hints: Object.freeze(['比較拼圖板的排數和每排格數，確認它和正方形拼圖板有何不同。', '每一格都要放一塊完整方格片；拼好後觀察圖形的邊與角。']), incorrectFeedback: '檢查是否選足 6 塊完整方格片，並確認 2 排、每排 3 格都鋪滿。', correctFeedback: '你把方格片排成 2×3 長方形。這種螢幕拼組不等同於學生已能獨立說明長方形定義。' }),
  ]),
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['需教師確認學生是否已接觸直角、邊長與等長判斷語詞。', '圖形卡提供直角符號及形狀視覺支架；需教師判斷是否另需無標記辨識或口頭說明。', '螢幕方格拼組未測實體剪拼、旋轉操作或獨立定義能力。', '教材版本、冊次、頁碼、學期及班級進度尚未確認。']),
});
