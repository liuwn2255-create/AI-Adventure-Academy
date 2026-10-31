import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`);
const sourceUrl = read('curriculum/sources.json').sources.find(({ id }) => id === 'mathematics').url;
const stage = (grade) => grade <= 2 ? [1, 2] : grade <= 4 ? [3, 4] : [5, 6];

const foci = [
  { id: 'math-grade1-money-count-exchange', grade: 1, codes: ['N-1-4'], performanceCodes: ['n-I-3'], title: '一年級 N-1-4 數錢、換錢與找錢', text: '解題：1 元、5 元、10 元、50 元、100 元。以操作活動為主。數錢、換錢、找錢。容許多元策略，以利建立數感，教師不應視為單純的加減單元。', page: '伍／二／一年級學習內容表 N-1-4，PDF頁序21；對應學習表現 n-I-3 同表。', activity: 'ACT-G1-MATH-MONEY-COUNT-EXCHANGE-CANDIDATE', subitem: 'SUB-MATH-G1-N1-4-MONEY-COUNT-CHANGE', scope: '畫面錢幣選取及一個找零情境；不含實體錢幣操作、所有等值換錢策略或真實購物。' },
  { id: 'math-grade2-clock-time-read', grade: 2, codes: ['N-2-13'], performanceCodes: ['n-I-9'], title: '二年級 N-2-13 鐘面時針分針與整時點數', text: '鐘面的時刻：以操作活動為主。以鐘面時針與分針之位置認識「幾時幾分」。含兩整時時刻之間的整時點數（時間加減的前置經驗）。同時加強「五個一數」、「十個一數」。本活動不含秒針教學。整時的點數教學須配合鐘面進行。', page: '伍／二／二年級學習內容表 N-2-13，PDF頁序24；對應第一學習階段表現 n-I-9 同表。', activity: 'ACT-G2-MATH-CLOCK-HANDS-CANDIDATE', subitem: 'SUB-MATH-G2-N2-13-CLOCK-HOUR-MINUTE-HANDS', scope: '螢幕鐘面手動調整與整時點數；不含秒、經過時間計算及實體鐘面操作。' },
  { id: 'math-grade4-cube-volume-operation', grade: 4, codes: ['N-4-12', 'S-4-4'], performanceCodes: ['n-II-9'], title: '四年級 N-4-12／S-4-4 體積與立方公分單位方塊', text: 'N-4-12：體積與「立方公分」：以具體操作為主。體積認識基於1立方公分之正方體。S-4-4：體積：以具體操作為主。在活動中認識體積的意義與比較。認識1立方公分之正方體，能理解並計數正方體堆疊的體積。', page: '伍／二／四年級學習內容表 N-4-12，PDF頁序29；S-4-4，頁序30；對應第二學習階段表現 n-II-9。', activity: 'ACT-G4-MATH-UNIT-CUBE-VOLUME-BUILDER-CANDIDATE', subitem: 'SUB-MATH-G4-S4-4-UNIT-CUBE-STACKED-VOLUME', scope: '螢幕模型調整列、欄、層並計算規則方塊數；不含實物堆疊、實體量感、非規則形體比較或公式推導。' },
  { id: 'math-grade6-base-comparison-ratio', grade: 6, codes: ['N-6-8'], performanceCodes: ['n-III-9'], title: '六年級 N-6-8 基準量交換與比值', text: '解題：基準量與比較量。比和比值的應用。含交換基準時之關係。所謂交換基準如以哥哥身高為1，弟弟身高為4/5，則以弟弟身高為1，哥哥身高為5/4。', page: '伍／二／六年級學習內容表 N-6-8，PDF頁序35–36；對應第三學習階段表現 n-III-9 同表。', activity: 'ACT-G6-MATH-BASE-COMPARISON-RATIO-CANDIDATE', subitem: 'SUB-MATH-G6-N6-8-EXCHANGE-REFERENCE-QUANTITIES', scope: '使用一組官方例示數據練習交換基準的比值關係；不涵蓋多樣生活應用或完整比例推理。' },
  { id: 'math-grade1-length-compare', grade: 1, codes: ['N-1-5', 'S-1-1'], performanceCodes: ['n-I-7'], title: '一年級 N-1-5／S-1-1 直線與曲線長度比較', text: '長度（同 S-1-1）：以操作活動為主。初步認識、直接比較、間接比較（含個別單位）。活動內容含直線與曲線。本條目教學無常用單位（N-2-11）。', page: '伍／二／一年級學習內容 N-1-5、S-1-1，PDF頁序21–22；對應第一學習階段表現 n-I-7，PDF頁序11。', activity: 'ACT-G1-MATH-LENGTH-COMPARE-ROPE-CANDIDATE', subitem: 'SUB-MATH-G1-N1-5-COMPARE-STRAIGHT-CURVED-LENGTH', scope: '以螢幕路徑圖直接比較及用相同小段單位核對；不含實際繩測、常用單位、尺測或估測。' },
  { id: 'math-grade5-line-symmetry', grade: 5, codes: ['S-5-4'], performanceCodes: ['s-III-6'], title: '五年級 S-5-4 線對稱圖形操作', text: '線對稱：線對稱的意義。「對稱軸」、「對稱點」、「對稱邊」、「對稱角」。由操作活動知道特殊平面圖形的線對稱性質。利用線對稱做簡單幾何推理。製作或繪製線對稱圖形。', page: '伍／二／五年級學習內容表 S-5-4，PDF頁序33–34；對應第三學習階段表現 s-III-6，PDF頁序12。', activity: 'ACT-G5-MATH-LINE-SYMMETRY-MIRROR-GRID-CANDIDATE', subitem: 'SUB-MATH-G5-S5-4-COMPLETE-AXIAL-MIRROR-GRID', scope: '在方格上補齊垂直軸鏡射圖形；不含對稱邊角性質、多種圖形辨識及實體折紙。' },
  { id: 'math-grade5-line-chart', grade: 5, codes: ['D-5-1'], performanceCodes: ['d-III-1'], title: '五年級 D-5-1 製作與讀取折線圖', text: '製作折線圖：製作生活中的折線圖。分辨折線圖之使用時機。', page: '伍／二／五年級學習內容表 D-5-1，PDF頁序34；對應第三學習階段表現 d-III-1，PDF頁序12。', activity: 'ACT-G5-MATH-LINE-CHART-PLOT-CANDIDATE', subitem: 'SUB-MATH-G5-D5-1-PLOT-AND-READ-LINE-CHART', scope: '以兩組標示為模擬的時間序列資料建點並觀察升降；不含實際調查、圖表使用時機比較與圓形圖。' },
];
const performanceTexts = {
  'n-I-3': '應用加法和減法的計算或估算於日常應用解題。',
  'n-I-9': '認識時刻與時間常用單位。',
  'n-II-9': '理解長度、角度、面積、容量、重量的常用單位與換算，培養量感與估測能力，並能做計算和應用解題。認識體積。',
  'n-III-9': '理解比例關係的意義，並能據以觀察、表述、計算與解題，如比率、比例尺、速度、基準量等。',
  'n-I-7': '理解長度及其常用單位，並做實測、估測與計算。',
  's-III-6': '理解線對稱的意義與其推論。',
  'd-III-1': '報讀圓形圖，製作折線圖與圓形圖，並據以做簡單推論。',
};

const curriculum = read('curriculum/curriculum-map.json');
const subitems = read('curriculum/learning-subitem-definitions.json');
const sources = read('curriculum/sources.json');
const mathSource = sources.sources.find(({ id }) => id === 'mathematics');
for (const focus of foci) {
  const found = curriculum.pendingLearningFocuses.find(({ id }) => id === focus.id)
    ?? curriculum.verifiedLearningFocuses.find(({ id }) => id === focus.id)
    ?? curriculum.supplementalVerifiedLearningFocuses?.find(({ id }) => id === focus.id);
  if (!found) curriculum.pendingLearningFocuses.push({
    id: focus.id,
    subject: 'mathematics',
    gradeRange: [focus.grade, focus.grade],
    stagePerformanceRange: stage(focus.grade),
    sourceId: 'mathematics',
    performanceCodes: focus.performanceCodes,
    contentCodes: focus.codes,
    performanceTexts: focus.performanceCodes.map((code) => ({ code, text: performanceTexts[code] })),
    contentTexts: [focus.text],
    focus: focus.scope,
    page: focus.page,
    app: `stage_${stage(focus.grade)[0]}_grade_${focus.grade}_local_schedule_pending`,
    status: 'pending_review',
    officialTextReviewStatus: 'verified_against_official_text',
    gradeApplicabilityStatus: `grade_${focus.grade}_content_code_local_schedule_pending`,
    sourceUrl,
    documentTitle: mathSource.documentTitle,
    pageOrSection: focus.page,
    reviewer: '官方 PDF 條文核對（非教師審查）',
    reviewDate: '2026-10-23',
    verifiedClauses: [...focus.codes, ...focus.performanceCodes],
    candidateActivityId: focus.activity,
    coverageStatus: 'partial',
    coverageLimitations: [focus.scope],
    missingEvidence: ['教師確認先備知識、教材進度及候選活動的教學適切性。'],
  });
  const registeredFocus = curriculum.pendingLearningFocuses.find(({ id }) => id === focus.id)
    ?? curriculum.verifiedLearningFocuses.find(({ id }) => id === focus.id)
    ?? curriculum.supplementalVerifiedLearningFocuses?.find(({ id }) => id === focus.id);
  if (registeredFocus) registeredFocus.performanceTexts = focus.performanceCodes.map((code) => performanceTexts[code]);

  if (!subitems.definitions.some(({ subitemId }) => subitemId === focus.subitem)) subitems.definitions.push({
    subitemId: focus.subitem,
    focusId: focus.id,
    subject: 'mathematics',
    officialCode: focus.codes[0],
    officialCodes: focus.codes,
    sourceText: focus.text,
    sourceTextKind: 'official_pdf_clause_checked_2026-10-23; project decomposition is not official subclause',
    sourceRef: { sourceId: 'mathematics', pageOrSection: focus.page },
    projectSubitem: focus.scope,
    decompositionKind: 'project_decomposition_from_official_clause_checked_2026_10_23',
    activityIds: [focus.activity],
    evidenceStageIds: focus.id === 'math-grade1-money-count-exchange' ? ['pay-seventeen-with-coins', 'choose-change-for-twenty']
      : focus.id === 'math-grade2-clock-time-read' ? ['set-three-twenty-clock', 'set-four-forty-five-clock', 'count-full-hours-between']
        : focus.id === 'math-grade4-cube-volume-operation' ? ['build-eight-cube-solid', 'build-twelve-cube-solid']
          : focus.id === 'math-grade1-length-compare' ? ['compare-straight-and-curved-paths', 'verify-with-common-units']
            : focus.id === 'math-grade5-line-symmetry' ? ['mirror-three-marker-cells', 'mirror-new-pattern']
              : focus.id === 'math-grade5-line-chart' ? ['plot-plant-growth-week', 'plot-daylight-hours']
                : ['younger-relative-to-older', 'older-relative-to-younger'],
    status: 'candidate_partial_interaction',
  });
}

for (const code of [...new Set(foci.flatMap(({ codes, performanceCodes }) => [...codes, ...performanceCodes]))]) {
  if (!mathSource.verifiedClauses.includes(code)) mathSource.verifiedClauses.push(code);
}
mathSource.reviewStatus = 'partial_clause_audit_updated_2026_10_23_full_inventory_incomplete';
mathSource.pageOrSection += ' 本輪直接回查並逐條核對 N-1-4（PDF頁序21）、N-2-13（頁序24）、N-4-12（頁序29）、S-4-4（頁序30）、N-6-8（頁序35–36）及其同表對應學習表現代碼；各代碼仍非完整全領綱清冊。';
mathSource.reviewDate = '2026-10-23';

write('curriculum/curriculum-map.json', curriculum);
write('curriculum/learning-subitem-definitions.json', subitems);
write('curriculum/sources.json', sources);
console.log(JSON.stringify({ insertedFocusIds: foci.map(({ id }) => id), totalMathOfficialCodeReferences: new Set(mathSource.verifiedClauses).size, mathFocusRecords: [...curriculum.verifiedLearningFocuses, ...(curriculum.supplementalVerifiedLearningFocuses ?? []), ...curriculum.pendingLearningFocuses].filter(({ subject }) => subject === 'mathematics').length, totalSubitemDefinitions: subitems.definitions.length }, null, 2));
