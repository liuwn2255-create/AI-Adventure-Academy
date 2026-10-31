const freeze = (value) => Object.freeze(value);

const candidate = (task) => freeze({
  ...task,
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

export const G4_ENGLISH_LOST_AND_FOUND = candidate({
  activityId: 'ACT-G4-ENGLISH-LOST-AND-FOUND-CANDIDATE', gradeId: 'grade-4', subjectId: 'english-language',
  title: '失物招領英語任務', curriculumMapId: 'english-daily-communication-stage2', sourceId: 'english-language',
  curriculumCodes: freeze(['B-Ⅱ-1', '2-Ⅱ-5']),
  curriculumScope: '部分對應第二學習階段 B-Ⅱ-1 與 2-Ⅱ-5：組合求助句、辨認顏色回應，再根據新位置問題和線索組合地點回應。全程為螢幕文字語塊，沒有音訊、錄音、發音或口語即時互動。',
  learningObjective: freeze({ objectiveId: 'LO-G4-ENGLISH-LOST-FOUND-CANDIDATE-01', statement: '依校園失物情境組合求助句，並在顏色與位置兩種後續問題中選擇或組合合宜回應。', status: 'candidate_pending_teacher_review' }),
  instructions: '幫虛構學生 Sam 完成失物招領對話：組合求助句、回應顏色問題，再依線索組合地點回應。這是文字互動，不錄音也不評量聽力或口說。',
  openQuestions: ['第二學習階段涵蓋三、四年級；需教師確認本班已教的字詞、句型和課程順序。', '語塊排序與回應辨認不等於獨立口說或聽力證據。'],
  stages: [
    { stageId: 'assemble-lost-item-request', interaction: 'assemble_response', prompt: '依順序組合 Sam 尋找水壺的求助句。', context: [{ speaker: '角色卡', text: 'Sam 找不到自己的水壺，想向辦公室人員求助。' }], hints: ['先用禮貌開場，再說明遺失的物品。', '把 Excuse me 放在前面，接著用 I lost... 說明情況。'], tokens: [{ id: 'polite', text: 'Excuse me.' }, { id: 'lost', text: 'I lost my blue water bottle.' }, { id: 'help', text: 'Could you help me?' }, { id: 'wrong', text: 'I am the water bottle.' }], correctOptionIds: ['polite', 'lost', 'help'], incorrectFeedback: '檢查句子是否符合角色卡：先禮貌求助，再說明遺失物品並提出請求。', correctFeedback: '語塊與情境相符；有支架的拼句不證明能自行口說。' },
    { stageId: 'choose-clerk-response', interaction: 'choose_response', prompt: '辦公室人員問：「What color is it?」選擇能繼續提供線索的回應。', context: [{ speaker: 'Office staff', text: 'What color is it?' }], hints: ['回應要提供物品外觀線索。', '檢查句子是否回答顏色，而不是改談地點或無關主題。'], options: [{ id: 'blue', text: 'It is blue.' }, { id: 'hungry', text: 'I am hungry.' }, { id: 'yesterday', text: 'It is yesterday.' }], correctOptionIds: ['blue'], incorrectFeedback: '回到問題中的 color，選擇描述顏色的句子。', correctFeedback: '你選出與問題相符的文字回應；未測到聽說互動。' },
    { stageId: 'assemble-location-detail', interaction: 'assemble_response', prompt: '接著說明 Sam 最後一次看見水壺的位置。', context: [{ speaker: 'Office staff', text: 'Where did you last see it?' }, { speaker: 'Sam 的線索卡', text: '他記得水壺在圖書館的桌上。' }], hints: ['這次要回答位置問題，找出地點詞語。', '把地點放在 I last saw it... 之後，組成完整回應。'], tokens: [{ id: 'location-start', text: 'I last saw it' }, { id: 'location-at', text: 'on the table' }, { id: 'location-library', text: 'in the library.' }, { id: 'location-color', text: 'It is blue.' }, { id: 'location-wrong', text: 'I last saw it yesterday blue.' }], correctOptionIds: ['location-start','location-at','location-library'], incorrectFeedback: '再看問題問的是 where；依線索卡組合表示地點的語塊，不要只重複顏色。', correctFeedback: '你用新問題與線索組合出地點回應。這仍是文字拼句，不是聽力或口說評量。' },
  ],
});

export const G4_SOCIAL_DIFFERENT_VIEWPOINTS = candidate({
  activityId: 'ACT-G4-SOCIAL-DIFFERENT-VIEWPOINTS-CANDIDATE', gradeId: 'grade-4', subjectId: 'social-studies',
  title: '社區提案：聽見不同需要', curriculumMapId: 'social-grade4-perspective-compare', sourceId: 'social-studies',
  curriculumCodes: freeze(['Ba-Ⅱ-1']),
  learningSubitemClaims: freeze(['SUB-SOCIAL-STAGE2-BA2-1-COMMONALITY-DIFFERENCE-CANDIDATE']),
  curriculumScope: '部分對應第二學習階段 Ba-Ⅱ-1：先分類虛構公共空間需要，再比較兩人陳述中相同的核心需要與不同的主要請求。未涵蓋真實居民訪談、觀點成因或完整公共決策；第二學習階段不等於四年級特定學期。',
  learningObjective: freeze({ objectiveId: 'LO-G4-SOCIAL-VIEWPOINTS-CANDIDATE-01', statement: '從人物說明中辨認相同與不同的生活需要，並以聆聽與比較作為討論起點。', status: 'candidate_pending_teacher_review' }),
  instructions: '閱讀虛構社區廣場的提案卡，整理人們相同與不同的需要，再安排公平的討論步驟。',
  openQuestions: ['需教師確認學生理解「需要」與「偏好」的差別。', '虛構卡片不能代表真實居民觀點，也不評量實際協商行為。'],
  stages: [
    { stageId: 'sort-community-needs', interaction: 'classify_observations', prompt: '把提案卡按主要需要分類：保持通行，或增加休息空間。', context: [{ speaker: '提案情境', text: '廣場要改善；角色都能提出意見，沒有哪一種需要天生比較重要。' }], hints: ['先讀每張卡說明想改善什麼。', '推車通行與輪椅通行都需要寬路；座椅則提供休息空間。'], observations: [{ id: 'cart-route', text: '照顧者希望推車能順利通過。' }, { id: 'wheelchair-route', text: '居民希望保留輪椅可通行的寬路。' }, { id: 'bench-rest', text: '長者希望有座椅可以休息。' }, { id: 'shade-rest', text: '孩子希望座椅附近有遮蔭。' }], categories: [{ id: 'access', label: '保持通行' }, { id: 'rest', label: '增加休息空間' }], correctAssignments: { 'cart-route': 'access', 'wheelchair-route': 'access', 'bench-rest': 'rest', 'shade-rest': 'rest' }, incorrectFeedback: '依卡片明說的使用需要分類，不要猜測人物身分以外的想法。', correctFeedback: '你整理了不同需要；分類不能取代真實溝通或公共決策。' },
    { stageId: 'compare-shared-and-different-viewpoints', interaction: 'classify_observations', prompt: '逐組比較兩位居民自己說出的需要：把「核心需要相同」和「主要請求不同」分開。', context: [{ speaker: '比較提醒', text: '找兩句話共同在意的事情；若一人要休息座椅、另一人要活動空地，主要請求就不同。' }], hints: ['先圈出每組兩人各自明說的用途，再比較共同點。', '推車與輪椅都要順利通行，核心需要相同；休息座椅和活動空地是不同請求。'], observations: [{ id: 'viewpoint-pair-access', text: '小欣：需要留寬路讓輪椅通過。小凱：需要留寬路讓推車通過。' }, { id: 'viewpoint-pair-rest-play', text: '小安：希望加座椅讓長者休息。小禾：希望留空地讓孩子活動。' }, { id: 'viewpoint-pair-shared-shade', text: '小米：希望有遮蔭處，避免等候時曬太陽。小文：希望有遮蔭處，避免陪家人休息時曬太陽。' }, { id: 'viewpoint-pair-garden-route', text: '小青：希望花圃多一些。小柏：希望保留寬路方便通行。' }], categories: [{ id: 'shared-core-need', label: '核心需要相同' }, { id: 'different-main-request', label: '主要請求不同' }], correctAssignments: { 'viewpoint-pair-access': 'shared-core-need', 'viewpoint-pair-rest-play': 'different-main-request', 'viewpoint-pair-shared-shade': 'shared-core-need', 'viewpoint-pair-garden-route': 'different-main-request' }, incorrectFeedback: '回到兩位居民說出的用途，不要只看物件名稱；請分辨他們是否在意同一個核心需要。', correctFeedback: '你比較了明說的共同需要與不同請求。這是虛構卡片練習，不代表已理解真實居民觀點成因或完成協商。' },
    { stageId: 'order-fair-discussion', interaction: 'order_items', prompt: '安排廣場小組討論的步驟，先聽取需要，再比較方案。', hints: ['討論開始前先讓每種需要都有被聽見的機會。', '比較方案時要回頭檢查通行與休息兩種需要是否都被考慮。'], items: [{ id: 'choose-plan', text: '選一個同時檢查兩種需要的方案。' }, { id: 'listen', text: '先聽每張提案卡的說明。' }, { id: 'compare', text: '比較方案是否兼顧通行與休息。' }], initialOrder: ['choose-plan', 'compare', 'listen'], correctItemIds: ['listen', 'compare', 'choose-plan'], incorrectFeedback: '先了解不同意見，再依共同條件比較方案；不能未聽取就替居民決定。', correctFeedback: '排序呈現了一種公平討論程序，但不代表實際協商能力已被評量。' },
  ],
});

export const G6_SOCIAL_GLOBAL_ISSUE_EVIDENCE = candidate({
  activityId: 'ACT-G6-SOCIAL-GLOBAL-ISSUE-EVIDENCE-CANDIDATE', gradeId: 'grade-6', subjectId: 'social-studies',
  title: '全球議題資料拼圖', curriculumMapId: 'social-grade6-global-issue-evidence', sourceId: 'social-studies',
  curriculumCodes: freeze(['Af-Ⅲ-1']),
  curriculumScope: '部分對應第三學習階段 Af-Ⅲ-1：以明確標示為虛構的食物浪費資料辨識全球共同關注議題及不同尺度線索。未使用真實統計、未評量國際政策或實際公民行動；第三學習階段不等於六年級單學期進度。',
  learningObjective: freeze({ objectiveId: 'LO-G6-SOCIAL-GLOBAL-ISSUE-CANDIDATE-01', statement: '依不同地點的虛構資料找出共同環境議題線索，並依證據安排後續探究步驟。', status: 'candidate_pending_teacher_review' }),
  instructions: '整理一組虛構的校園與社區資料，找出可共同討論的環境議題。資料是教學情境，不是真實統計。',
  openQuestions: ['需教師確認議題敏感度、全球尺度概念與閱讀負荷。', '虛構資料只能練習資料判讀，不能支持真實全球現況結論。'],
  stages: [
    { stageId: 'collect-shared-issue-clues', interaction: 'collect_evidence', prompt: '選出資料中直接提到食物被丟棄的紀錄，作為討論食物浪費的線索。', context: [{ speaker: '虛構資料板', text: '甲地：午餐後有未食用餐點。乙地：市場收攤後有未售蔬果。丙地：回收站收到用完的紙盒。丁地：操場旁有積水。' }], hints: ['只找與食物剩餘或未售出直接相關的紀錄。', '紙盒、積水不是食物紀錄；不要加入資料板沒有說的數量。'], options: [{ id: 'school-meal', text: '甲地有未食用的午餐。' }, { id: 'market-produce', text: '乙地有未售出的蔬果。' }, { id: 'paper-box', text: '丙地收到用完的紙盒。' }, { id: 'puddle', text: '丁地操場旁有積水。' }], correctOptionIds: ['school-meal', 'market-produce'], incorrectFeedback: '回到資料板，只選直接與食物剩餘有關的項目。', correctFeedback: '所選線索涉及食物剩餘；虛構卡片不代表真實各地狀況。' },
    { stageId: 'order-inquiry-steps', interaction: 'order_items', prompt: '安排下一步探究流程：先釐清資料，再提出可查證問題。', hints: ['先檢查資料寫了什麼與沒寫什麼。', '有了資料限制，再提出問題並規劃如何蒐集更多證據。'], items: [{ id: 'check-limits', text: '確認資料範圍與缺少的資訊。' }, { id: 'ask-question', text: '提出一個可查證的問題。' }, { id: 'plan-evidence', text: '規劃需要蒐集的資料。' }], initialOrder: ['plan-evidence', 'ask-question', 'check-limits'], correctItemIds: ['check-limits', 'ask-question', 'plan-evidence'], incorrectFeedback: '先辨認資料限制，再提問和規劃蒐證，避免把少量例子當成完整結論。', correctFeedback: '探究順序尊重資料範圍；活動不提供真實全球問題的答案。' },
  ],
});

export const G6_ARTS_PUBLIC_SPACE_DESIGN = candidate({
  activityId: 'ACT-G6-ARTS-PUBLIC-SPACE-DESIGN-CANDIDATE', gradeId: 'grade-6', subjectId: 'arts',
  title: '公共空間視覺設計室', curriculumMapId: 'arts-grade6-public-space-design', sourceId: 'arts',
  curriculumCodes: freeze(['視E-Ⅲ-3', '視P-Ⅲ-2']),
  curriculumScope: '部分對應第三學習階段設計思考與實作、生活設計／公共藝術：以畫面拼片選擇符合需求的視覺元素並排列設計步驟。螢幕拼片不等於實體媒材創作、完整設計歷程或公共藝術作品。',
  learningObjective: freeze({ objectiveId: 'LO-G6-ARTS-PUBLIC-SPACE-CANDIDATE-01', statement: '依公共空間設計需求選取視覺元素，並安排從需求檢視到方案分享的基本步驟。', status: 'candidate_pending_teacher_review' }),
  instructions: '為虛構校園閱讀角設計視覺方案。先選符合需求的四張圖形拼片，再安排設計與檢視步驟。',
  openQuestions: ['需教師確認拼片設計是否能支持設計思考目標，以及學生是否需使用實體媒材補充。', '介面只做圖形選取，不能評量繪畫技法、美感偏好或真實空間設計。'],
  stages: [
    { stageId: 'compose-reading-corner', interaction: 'compose_shape', prompt: '閱讀角方案需要「閱讀、方向、安靜、共享」四種視覺線索。選滿 2×2 的四塊拼片。', hints: ['逐一對照設計需求，選取能傳達四種用途的拼片。', '書本代表閱讀、箭頭代表方向、葉片代表安靜休憩、多人圖示代表共享。'], pieces: [{ id: 'book', label: '書本圖形：閱讀', shape: 'square' }, { id: 'arrow', label: '方向箭頭：指引', shape: 'triangle' }, { id: 'leaf', label: '葉片：安靜休憩', shape: 'triangle' }, { id: 'people', label: '多人圖示：共享', shape: 'square' }, { id: 'flame', label: '火焰：危險警示', shape: 'triangle' }, { id: 'trophy', label: '獎盃：競賽', shape: 'square' }], shapeRules: { rows: 2, columns: 2, correctPieceIds: ['book', 'arrow', 'leaf', 'people'] }, incorrectFeedback: '重新對照閱讀角的四項需求；只選自己喜歡的圖案還不夠，需能說明設計用途。', correctFeedback: '你選出對應四項需求的圖形；螢幕選片不是完整視覺創作。' },
    { stageId: 'order-design-review', interaction: 'order_items', prompt: '排列設計檢視流程。', hints: ['設計前先理解使用者需要。', '方案完成後再請使用者回饋，然後修整。'], items: [{ id: 'revise', text: '依回饋修整方案。' }, { id: 'needs', text: '整理使用者的閱讀角需要。' }, { id: 'share', text: '分享方案並聽取回饋。' }, { id: 'draft', text: '組合視覺元素成為初稿。' }], initialOrder: ['share', 'draft', 'needs', 'revise'], correctItemIds: ['needs', 'draft', 'share', 'revise'], incorrectFeedback: '先整理需要，再作初稿、聽取回饋，最後修整；此流程只是設計思考的簡化示意。', correctFeedback: '你安排了基本的設計檢視循環；實際創作與美感判斷仍需教師觀察。' },
  ],
});

export const G6_INTEGRATIVE_RESOURCE_PLANNER = candidate({
  activityId: 'ACT-G6-INTEGRATIVE-RESOURCE-PLANNER-CANDIDATE', gradeId: 'grade-6', subjectId: 'integrative-activities',
  title: '資源偵查隊：規劃解決方法', curriculumMapId: 'integrative-grade6-resource-planning', sourceId: 'integrative-activities',
  curriculumCodes: freeze(['2c-III-1', 'Bc-III-1', 'Bc-III-3']),
  curriculumScope: '部分對應第三學習階段資源分析判讀與規劃策略：在虛構的班級展覽情境中比較可用資源並安排方案。文字模擬不證明學生已實際蒐集、運用社會資源或反思執行結果。',
  learningObjective: freeze({ objectiveId: 'LO-G6-INTEGRATIVE-RESOURCE-PLANNING-CANDIDATE-01', statement: '依問題需要分析虛構資源卡的用途與限制，再規劃解決步驟。', status: 'candidate_pending_teacher_review' }),
  instructions: '班級要準備小型成果展，但不知道如何查詢場地和整理借用用品。分析資源卡，再排出計畫。',
  openQuestions: ['需教師確認任務是否貼近學生生活、資源資訊閱讀負荷與實際校內資源流程。', '活動資料全為虛構，沒有實際聯絡機構或執行計畫。'],
  stages: [
    { stageId: 'classify-useful-resources', interaction: 'classify_observations', prompt: '把資源卡依主要用途分類：取得場地資訊、整理展覽用品，或需要先查證。', hints: ['先看卡片能提供哪一種直接幫助。', '場地開放公告可供查詢；未署名傳聞要先查證，不能當成核准。'], observations: [{ id: 'library-hours', text: '學校圖書室公告：週三下午可預約討論區。' }, { id: 'equipment-list', text: '班級清單：展示架、標籤紙與膠帶的可借數量。' }, { id: 'old-rumor', text: '未署名留言：聽說體育館永遠都能使用。' }, { id: 'poster-template', text: '學校提供的海報版型。' }], categories: [{ id: 'space', label: '取得場地資訊' }, { id: 'supplies', label: '整理展覽用品' }, { id: 'verify', label: '需要先查證' }], correctAssignments: { 'library-hours': 'space', 'equipment-list': 'supplies', 'old-rumor': 'verify', 'poster-template': 'supplies' }, incorrectFeedback: '查看資訊來源是否明確且內容與用途相符；未署名傳聞不能當成場地已核准。', correctFeedback: '你依用途整理資源並標出待查證資訊；虛構卡片不能替代實際校務確認。' },
    { stageId: 'plan-resource-use', interaction: 'order_items', prompt: '安排使用資源的計畫，避免先假設場地已經借到。', hints: ['先確認問題和現有資料，再找負責人確認。', '取得確認後才安排用品與布置，活動後回看計畫是否合用。'], items: [{ id: 'review', text: '活動後回看計畫是否合用。' }, { id: 'confirm', text: '向負責人確認場地能否預約。' }, { id: 'define', text: '整理需要場地與用品的問題。' }, { id: 'prepare', text: '場地確認後再整理用品。' }], initialOrder: ['prepare', 'confirm', 'review', 'define'], correctItemIds: ['define', 'confirm', 'prepare', 'review'], incorrectFeedback: '先釐清需求，再確認資源可用性，之後才準備；最後保留檢討。', correctFeedback: '流程包含需求、確認、行動與回看；排序不等於學生已在生活中實踐。' },
  ],
});

export const G6_HPE_MEDICATION_SAFETY = candidate({
  activityId: 'ACT-G6-HPE-MEDICATION-SAFETY-CANDIDATE', gradeId: 'grade-6', subjectId: 'health-physical-education',
  title: '用藥安全求助路線', curriculumMapId: 'health-pe-grade6-medication-safety', sourceId: 'health-physical-education',
  curriculumCodes: freeze(['Bb-Ⅲ-1']),
  curriculumScope: '部分對應第三學習階段 Bb-Ⅲ-1：以虛構情境辨認需停止自行判斷並尋求成人／專業諮詢的安全行動。沒有藥品種類教學、劑量或醫療建議，也不替代家長、教師或醫療專業人員指導。',
  learningObjective: freeze({ objectiveId: 'LO-G6-HPE-MEDICATION-SAFETY-CANDIDATE-01', statement: '在資訊不清楚或遇到非本人藥品的情境中，辨認應先停止並向可信任成人或醫療專業人員求助。', status: 'candidate_pending_teacher_review' }),
  instructions: '跟著虛構角色小安走安全求助路線。本活動不提供藥品或劑量建議；遇到真實用藥問題應詢問家長、教師或醫療專業人員。',
  openQuestions: ['需健康教育教師／醫療專業人員檢視用語與安全邊界。', '未涵蓋藥物種類、標示解讀、劑量或真實諮詢操作；只練習求助決策。'],
  stages: [
    { stageId: 'sort-medication-actions', interaction: 'classify_observations', prompt: '把情境行動分類：安全求助，或不安全的自行處理。', context: [{ speaker: '角色情境', text: '小安發現桌上有不熟悉的藥品，沒有清楚知道它是誰的或如何使用。' }], hints: ['資訊不清楚時，先不要自行使用。', '向家長、教師或醫療專業人員詢問，比猜測藥品用途安全。'], observations: [{ id: 'ask-adult', text: '先不碰，告訴家長或教師並請對方協助確認。' }, { id: 'take-friend', text: '拿同學的藥來試試看。' }, { id: 'ask-professional', text: '請成人陪同詢問藥師或醫療人員。' }, { id: 'guess-pill', text: '看顏色猜它的用途後自行使用。' }], categories: [{ id: 'safe-help', label: '安全求助' }, { id: 'unsafe-self-action', label: '不安全自行處理' }], correctAssignments: { 'ask-adult': 'safe-help', 'take-friend': 'unsafe-self-action', 'ask-professional': 'safe-help', 'guess-pill': 'unsafe-self-action' }, incorrectFeedback: '藥品不能靠外觀猜，也不能使用他人的藥；先停止並尋求可信任成人或專業協助。', correctFeedback: '你辨認出安全求助方向；活動沒有給任何藥品使用或劑量指示。' },
    { stageId: 'choose-safe-next-step', interaction: 'choose_response', prompt: '角色仍不確定藥品資訊，下一步應怎麼做？', hints: ['不要自行決定，也不要依網路留言或同伴猜測。', '選擇停止使用並找可信任成人協助確認。'], options: [{ id: 'ask-trusted-adult', text: '先不使用，告訴家長或教師並請成人協助詢問專業人員。' }, { id: 'borrow', text: '借用同學的藥。' }, { id: 'guess', text: '依顏色猜用途。' }], correctOptionIds: ['ask-trusted-adult'], incorrectFeedback: '用藥資訊不確定時不要自行嘗試；安全下一步是停止並尋求成人／專業協助。', correctFeedback: '你選擇了求助路線；單一情境作答不等於已具備完整用藥能力。' },
  ],
});

export const G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS = Object.freeze([
  G4_ENGLISH_LOST_AND_FOUND,
  G4_SOCIAL_DIFFERENT_VIEWPOINTS,
  G6_SOCIAL_GLOBAL_ISSUE_EVIDENCE,
  G6_ARTS_PUBLIC_SPACE_DESIGN,
  G6_INTEGRATIVE_RESOURCE_PLANNER,
  G6_HPE_MEDICATION_SAFETY,
]);

export const CROSS_GRADE_GAP_FILL_TASKS = G6_SOCIAL_AND_ARTS_INTEGRATIVE_TASKS;
