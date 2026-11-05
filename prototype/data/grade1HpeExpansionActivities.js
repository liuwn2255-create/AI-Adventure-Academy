// Manually reviewed, Grade 1–2 HPE candidate activities. The per-character
// reading table is authored data (not transliteration); unknown Han characters
// fail module loading so pronunciation gaps cannot silently reach students.
const reviewedReadings = Object.freeze({
  健:'ㄐㄧㄢˋ',康:'ㄎㄤ',小:'ㄒㄧㄠˇ',偵:'ㄓㄣ',探:'ㄊㄢˋ',衛:'ㄨㄟˋ',生:'ㄕㄥ',習:'ㄒㄧˊ',慣:'ㄍㄨㄢˋ',與:'ㄩˇ',洗:'ㄒㄧˇ',手:'ㄕㄡˇ',暖:'ㄋㄨㄢˇ',身:'ㄕㄣ',運:'ㄩㄣˋ',動:'ㄉㄨㄥˋ',前:'ㄑㄧㄢˊ',的:'ㄉㄜ˙',準:'ㄓㄨㄣˇ',備:'ㄅㄟˋ',活:'ㄏㄨㄛˊ',力:'ㄌㄧˋ',家:'ㄐㄧㄚ',益:'ㄧˋ',處:'ㄔㄨˋ',認:'ㄖㄣˋ',識:'ㄕˋ',食:'ㄕˊ',物:'ㄨˋ',飲:'ㄧㄣˇ',玩:'ㄨㄢˊ',看:'ㄎㄢˋ',每:'ㄇㄟˇ',張:'ㄓㄤ',卡:'ㄎㄚˇ',分:'ㄈㄣ',有:'ㄧㄡˇ',用:'ㄩㄥˋ',肥:'ㄈㄟˊ',皂:'ㄗㄠˋ',洗手:'ㄒㄧˇ',和:'ㄏㄜˊ',沒:'ㄇㄟˊ',上:'ㄕㄤˋ',點:'ㄉㄧㄢˇ',心:'ㄒㄧㄣ',後:'ㄏㄡˋ',廁:'ㄘㄜˋ',所:'ㄙㄨㄛˇ',手:'ㄕㄡˇ',很:'ㄏㄣˇ',髒:'ㄗㄤ',只:'ㄓˇ',在:'ㄗㄞˋ',褲:'ㄎㄨˋ',子:'ㄗˇ',清:'ㄑㄧㄥ',水:'ㄕㄨㄟˇ',沖:'ㄔㄨㄥ',先:'ㄒㄧㄢ',搓:'ㄘㄨㄛ',再:'ㄗㄞˋ',乾:'ㄍㄢ',淨:'ㄐㄧㄥˋ',步:'ㄅㄨˋ',驟:'ㄗㄡˋ',排:'ㄆㄞˊ',好:'ㄏㄠˇ',請:'ㄑㄧㄥˇ',按:'ㄢˋ',乳:'ㄖㄨˇ',背:'ㄅㄟˋ',指:'ㄓˇ',縫:'ㄈㄥˊ',泡:'ㄆㄠˋ',毛:'ㄇㄠˊ',巾:'ㄐㄧㄣ',想:'ㄒㄧㄤˇ',要:'ㄧㄠˋ',碰:'ㄆㄥˋ',到:'ㄉㄠˋ',哪:'ㄋㄚˇ',會:'ㄏㄨㄟˋ',把:'ㄅㄚˇ',掉:'ㄉㄧㄠˋ',你:'ㄋㄧˇ',答:'ㄉㄚˊ',對:'ㄉㄨㄟˋ',了:'ㄌㄜ˙',四:'ㄙˋ',個:'ㄍㄜˋ',移:'ㄧˊ',下:'ㄒㄧㄚˋ',檢:'ㄐㄧㄢˇ',查:'ㄔㄚˊ',案:'ㄢˋ',同:'ㄊㄨㄥˊ',學:'ㄒㄩㄝˊ',可:'ㄎㄜˇ',以:'ㄧˇ',慢:'ㄇㄢˋ',體:'ㄊㄧˇ',一:'ㄧ',開:'ㄎㄞ',始:'ㄕˇ',就:'ㄐㄧㄡˋ',力:'ㄌㄧˋ',做:'ㄗㄨㄛˋ',法:'ㄈㄚˇ',走:'ㄗㄡˇ',再:'ㄗㄞˋ',輕:'ㄑㄧㄥ',轉:'ㄓㄨㄢˇ',肩:'ㄐㄧㄢ',膀:'ㄅㄤˇ',腕:'ㄨㄢˋ',腳:'ㄐㄧㄠˇ',踝:'ㄏㄨㄞˊ',全:'ㄑㄩㄢˊ',衝:'ㄔㄨㄥ',刺:'ㄘˋ',立:'ㄌㄧˋ',刻:'ㄎㄜˋ',跳:'ㄊㄧㄠˋ',得:'ㄉㄜ˙',高:'ㄍㄠ',作:'ㄗㄨㄛˋ',是:'ㄕˋ',還:'ㄏㄞˊ',快:'ㄎㄨㄞˋ',逐:'ㄓㄨˊ',漸:'ㄐㄧㄢˋ',起:'ㄑㄧˇ',來:'ㄌㄞˊ',出:'ㄔㄨ',些:'ㄒㄧㄝ',下:'ㄒㄧㄚˋ',育:'ㄩˋ',課:'ㄎㄜˋ',跑:'ㄆㄠˇ',步:'ㄅㄨˋ',遊:'ㄧㄡˊ',戲:'ㄒㄧˋ',老:'ㄌㄠˇ',師:'ㄕ',大:'ㄉㄚˋ',選:'ㄒㄩㄢˇ',合:'ㄏㄜˊ',適:'ㄕˋ',第:'ㄉㄧˋ',圈:'ㄑㄩㄢ',推:'ㄊㄨㄟ',搶:'ㄑㄧㄤˇ',去:'ㄑㄩˋ',怎:'ㄗㄣˇ',麼:'ㄇㄜ˙',熱:'ㄖㄜˋ',太:'ㄊㄞˋ',題:'ㄊㄧˊ',目:'ㄇㄨˋ',正:'ㄓㄥˋ',確:'ㄑㄩㄝˋ',安:'ㄢ',留:'ㄌㄧㄡˊ',意:'ㄧˋ',說:'ㄕㄨㄛ',地:'ㄉㄧˋ',點:'ㄉㄧㄢˇ',符:'ㄈㄨˊ',空:'ㄎㄨㄥ',間:'ㄐㄧㄢ',規:'ㄍㄨㄟ',則:'ㄗㄜˊ',停:'ㄊㄧㄥˊ',卡:'ㄎㄚˇ',操:'ㄘㄠ',場:'ㄔㄤˇ',傳:'ㄔㄨㄢˊ',球:'ㄑㄧㄡˊ',繩:'ㄕㄥˊ',周:'ㄓㄡ',保:'ㄅㄠˇ',持:'ㄔˊ',距:'ㄐㄩˋ',離:'ㄌㄧˊ',廊:'ㄌㄤˊ',旁:'ㄆㄤˊ',人:'ㄖㄣˊ',過:'ㄍㄨㄛˋ',揮:'ㄏㄨㄟ',拍:'ㄆㄞ',時:'ㄕˊ',站:'ㄓㄢˋ',著:'ㄓㄜ˙',裡:'ㄌㄧˇ',附:'ㄈㄨˋ',近:'ㄐㄧㄣˋ',備:'ㄅㄟˋ',清:'ㄑㄧㄥ',楚:'ㄔㄨˇ',決:'ㄐㄩㄝˊ',定:'ㄉㄧㄥˋ',注:'ㄓㄨˋ',邊:'ㄅㄧㄢ',今:'ㄐㄧㄣ',天:'ㄊㄧㄢ',指:'ㄓˇ',教:'ㄐㄧㄠˋ',室:'ㄕˋ',追:'ㄓㄨㄟ',車:'ㄔㄜ',道:'ㄉㄠˋ',踢:'ㄊㄧ',進:'ㄐㄧㄣˋ',行:'ㄒㄧㄥˊ',讓:'ㄖㄤˋ',機:'ㄐㄧ',午:'ㄨˇ',餐:'ㄘㄢ',不:'ㄅㄨˋ',拿:'ㄋㄚˊ',多:'ㄉㄨㄛ',少:'ㄕㄠˇ',比:'ㄅㄧˇ',較:'ㄐㄧㄠˋ',白:'ㄅㄞˊ',飯:'ㄈㄢˋ',蘋:'ㄆㄧㄥˊ',果:'ㄍㄨㄛˇ',雞:'ㄐㄧ',蛋:'ㄉㄢˋ',支:'ㄓ',鉛:'ㄑㄧㄢ',筆:'ㄅㄧˇ',顆:'ㄎㄜ',本:'ㄅㄣˇ',書:'ㄕㄨ',平:'ㄆㄧㄥˊ',常:'ㄔㄤˊ',吃:'ㄔ',嘴:'ㄗㄨㄟˇ',什:'ㄕㄣˊ',它:'ㄊㄚ',其:'ㄑㄧˊ',東:'ㄉㄨㄥ',西:'ㄒㄧ',自:'ㄗˋ',己:'ㄐㄧˇ',完:'ㄨㄢˊ',夠:'ㄍㄡˋ',添:'ㄊㄧㄢ',盤:'ㄆㄢˊ',倒:'ㄉㄠˋ',更:'ㄍㄥˋ',些:'ㄒㄧㄝ',顧:'ㄍㄨˋ',剩:'ㄕㄥˋ',食:'ㄕˊ',量:'ㄌㄧㄤˋ',呢:'ㄋㄜ˙',幫:'ㄅㄤ',類:'ㄌㄟˋ',部:'ㄅㄨˋ',螢:'ㄧㄥˊ',幕:'ㄇㄨˋ',情:'ㄑㄧㄥˊ',境:'ㄐㄧㄥˋ',代:'ㄉㄞˋ',表:'ㄅㄧㄠˇ',實:'ㄕˊ',際:'ㄐㄧˋ',成:'ㄔㄥˊ',或:'ㄏㄨㄛˋ',為:'ㄨㄟˊ',養:'ㄧㄤˇ',具:'ㄐㄩˋ',技:'ㄐㄧˋ',能:'ㄋㄥˊ',內:'ㄋㄟˋ',容:'ㄖㄨㄥˊ',須:'ㄒㄩ',由:'ㄧㄡˊ',需:'ㄒㄩ',及:'ㄐㄧˊ',規:'ㄍㄨㄟ',範:'ㄈㄢˋ',階:'ㄐㄧㄝ',段:'ㄉㄨㄢˋ',局:'ㄐㄩˊ',參:'ㄘㄢ',照:'ㄓㄠˋ',尚:'ㄕㄤˋ',待:'ㄉㄞˋ',審:'ㄕㄣˇ',日:'ㄖˋ',辨:'ㄅㄧㄢˋ',並:'ㄅㄧㄥˋ',列:'ㄌㄧㄝˋ',簡:'ㄐㄧㄢˇ',單:'ㄉㄢ',中:'ㄓㄨㄥ',真:'ㄓㄣ',評:'ㄆㄧㄥˊ',量:'ㄌㄧㄤˋ',擦:'ㄘㄚ',片:'ㄆㄧㄢˋ',找:'ㄓㄠˇ',順:'ㄕㄨㄣˋ',序:'ㄒㄩˋ',濕:'ㄕ',最:'ㄗㄨㄟˋ',變:'ㄅㄧㄢˋ',次:'ㄘˋ',弄:'ㄋㄨㄥˋ',隊:'ㄉㄨㄟˋ',擇:'ㄗㄜˊ',線:'ㄒㄧㄢˋ',索:'ㄙㄨㄛˇ',觀:'ㄍㄨㄢ',察:'ㄔㄚˊ',嗎:'ㄇㄚ˙',況:'ㄎㄨㄤˋ',也:'ㄧㄝˇ',這:'ㄓㄜˋ',跟:'ㄍㄣ',將:'ㄐㄧㄤ',二:'ㄦˋ',壞:'ㄏㄨㄞˋ',醫:'ㄧ',療:'ㄌㄧㄠˊ',營:'ㄧㄥˊ',建:'ㄐㄧㄢˋ',議:'ㄧˋ',見:'ㄐㄧㄢˋ',思:'ㄙ',考:'ㄎㄠˇ',取:'ㄑㄩˇ',碗:'ㄨㄢˇ',畫:'ㄏㄨㄚˋ',他:'ㄊㄚ',尊:'ㄗㄨㄣ',重:'ㄓㄨㄥˋ',庭:'ㄊㄧㄥˊ',文:'ㄨㄣˊ',化:'ㄏㄨㄚˋ',敏:'ㄇㄧㄣˇ',別:'ㄅㄧㄝˊ',
});

const reviewed = (text) => Object.freeze([...text].map((character) => {
  if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
  const reading = reviewedReadings[character];
  if (!reading || reading.includes(' ')) throw new Error(`Missing manually reviewed HPE reading for ${character} in ${text}`);
  return Object.freeze({ text: character, reading });
}));
const item = (id, text) => Object.freeze({ id, text, pronunciationTokens: reviewed(text) });
const option = (id, text) => Object.freeze({ id, text, pronunciationTokens: reviewed(text) });
const hint = (text) => Object.freeze({ text, pronunciationTokens: reviewed(text) });
const classify = (stageId, prompt, observations, categories, correctAssignments, hints, correctFeedback, incorrectFeedback) => Object.freeze({
  stageId, interaction: 'classify_observations', prompt, promptPronunciationTokens: reviewed(prompt),
  studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看每張卡 → ② 幫每張卡選一類 → ③ 全部分好後檢查答案'),
  observations: Object.freeze(observations.map(([id, text]) => item(id, text))),
  categories: Object.freeze(categories.map(([id, label]) => Object.freeze({ id, label, pronunciationTokens: reviewed(label) }))),
  correctAssignments: Object.freeze(correctAssignments), hints: Object.freeze(hints.map(hint)),
  correctFeedback, correctFeedbackPronunciationTokens: reviewed(correctFeedback),
  incorrectFeedback, incorrectFeedbackPronunciationTokens: reviewed(incorrectFeedback),
  teacherLimitationNote: teacherLimitation,
});
const choose = (stageId, prompt, options, correctId, hints, correctFeedback, incorrectFeedback) => Object.freeze({
  stageId, interaction: 'choose_response', prompt, promptPronunciationTokens: reviewed(prompt),
  options: Object.freeze(options.map(([id, text]) => option(id, text))), correctOptionIds: Object.freeze([correctId]),
  hints: Object.freeze(hints.map(hint)), correctFeedback, correctFeedbackPronunciationTokens: reviewed(correctFeedback),
  incorrectFeedback, incorrectFeedbackPronunciationTokens: reviewed(incorrectFeedback), teacherLimitationNote: teacherLimitation,
});
const teacherLimitation = '本活動以螢幕情境練習，不代表學生已實際完成衛生或運動行為、養成習慣或具備身體技能；內容與做法須由教師依學生需要及校園規範審查。';

const hygiene = Object.freeze({
  activityId: 'ACT-G1-HPE-HYGIENE-HABITS-CANDIDATE', revision: 1, title: '健康小偵探：衛生習慣與洗手',
  titlePronunciationTokens: reviewed('健康小偵探：衛生習慣與洗手'),
  gradeId: 'grade-1', subjectId: 'health-physical-education', status: 'candidate_pending_teacher_review',
  sourceKind: 'curriculum_aligned_simulated_candidate', curriculumMapId: 'health-pe-stage1-personal-hygiene-habits',
  sourceId: 'health-physical-education', curriculumCodes: Object.freeze(['Da-Ⅰ-1', '1a-Ⅰ-2', '4a-Ⅰ-2']),
  curriculumScope: '第一學習階段局部參照，尚待教師審查；螢幕作答不代表已養成日常衛生習慣。',
  learningObjective: Object.freeze({ objectiveId: 'LO-G1-HPE-HYGIENE-HABITS-01', statement: '辨認洗手做法，並排列簡單洗手步驟。', status: 'candidate_pending_teacher_review' }),
  instructions: '在螢幕情境中辨認洗手做法並排列步驟，不作為真實衛生習慣評量。', learningSubitemClaims: Object.freeze([]),
  stages: Object.freeze([
    classify('classify-handwashing-habits', '看看每張卡，分出有用肥皂洗手和沒有用肥皂洗手的做法。', [
      ['soap-before-snack', '吃點心前，用肥皂搓手，再沖乾淨。'], ['soap-after-toilet', '上完廁所後，用肥皂洗手。'],
      ['wipe-on-pants', '手很髒時，只在褲子上擦一擦。'], ['water-only', '吃點心前，只用清水沖一下。'],
    ], [['with-soap', '有用肥皂洗手'], ['without-soap', '沒有用肥皂洗手']], {
      'soap-before-snack':'with-soap','soap-after-toilet':'with-soap','wipe-on-pants':'without-soap','water-only':'without-soap',
    }, ['先看做法裡有沒有用肥皂。', '想想卡片裡的人洗手時做了什麼。'], '你有看清楚每個做法，找出有沒有用肥皂。', '再看每張卡，找找看有沒有用肥皂洗手。'),
    Object.freeze({ stageId:'order-handwashing-steps', interaction:'order_items', prompt:'把洗手步驟排好。', promptPronunciationTokens:reviewed('把洗手步驟排好。'),
      studentOperationGuidance:'怎麼玩：① 看 4 個步驟 → ② 用上移、下移排好 → ③ 排好後檢查答案', studentOperationGuidancePronunciationTokens:reviewed('怎麼玩：① 看 4 個步驟 → ② 用上移、下移排好 → ③ 排好後檢查答案'),
      studentSubmitLabel:'檢查順序', studentSubmitLabelPronunciationTokens:reviewed('檢查順序'),
      items:Object.freeze([item('wet-hands','用清水把手沖濕。'),item('soap-and-rub','按洗手乳，搓手心、手背和指縫。'),item('rinse-bubbles','用清水把泡泡沖掉。'),item('dry-hands','用乾淨毛巾擦乾。')]),
      initialOrder:Object.freeze(['rinse-bubbles','dry-hands','wet-hands','soap-and-rub']), correctItemIds:Object.freeze(['wet-hands','soap-and-rub','rinse-bubbles','dry-hands']),
      hints:Object.freeze([hint('想想手先要碰到水，最後要變乾。'),hint('找找哪一步會有泡泡，哪一步會把泡泡沖掉。')]),
      correctFeedback:'你把洗手步驟排好了。',correctFeedbackPronunciationTokens:reviewed('你把洗手步驟排好了。'),incorrectFeedback:'再看一次：先弄濕手，搓洗後要沖乾淨。',incorrectFeedbackPronunciationTokens:reviewed('再看一次：先弄濕手，搓洗後要沖乾淨。'),teacherLimitationNote:teacherLimitation,
    }),
  ]), teacherReview:Object.freeze({status:'pending_teacher_review',evidenceStatus:'partial'}), evidencePolicy:'partial_curriculum_alignment_candidate_only',
});

const warmup = Object.freeze({
  activityId:'ACT-G1-HPE-SAFE-WARMUP-MOVEMENT-CANDIDATE',revision:1,title:'暖身安全小隊：運動前的準備',gradeId:'grade-1',subjectId:'health-physical-education',status:'candidate_pending_teacher_review',sourceKind:'curriculum_aligned_simulated_candidate',curriculumMapId:'health-pe-stage1-safe-warmup-and-movement',sourceId:'health-physical-education',curriculumCodes:Object.freeze(['Bc-Ⅰ-1','3c-Ⅰ-2']),curriculumScope:'第一學習階段局部參照，尚待教師審查；螢幕選答不評量實際暖身技能。',learningObjective:Object.freeze({objectiveId:'LO-G1-HPE-SAFE-WARMUP-01',statement:'辨認運動前慢慢活動身體的做法。',status:'candidate_pending_teacher_review'}),instructions:'在螢幕情境中辨認暖身和安全做法，不作為實際運動能力評量。',learningSubitemClaims:Object.freeze([]),
  titlePronunciationTokens:reviewed('暖身安全小隊：運動前的準備'),
  stages:Object.freeze([
    classify('classify-warmup-actions','看每張卡，分出慢慢活動身體和一開始就很用力的做法。',[
      ['walk-and-shoulders','慢慢走一走，再輕輕轉轉肩膀。'],['move-wrists-ankles','輕輕活動手腕和腳踝。'],['sprint-at-once','一開始就全力衝刺。'],['jump-without-warmup','沒有先活動，就立刻跳得很高。'],
    ],[['gradual-movement','慢慢活動身體'],['too-intense-at-start','一開始就很用力']],{'walk-and-shoulders':'gradual-movement','move-wrists-ankles':'gradual-movement','sprint-at-once':'too-intense-at-start','jump-without-warmup':'too-intense-at-start'},['先看動作是慢慢開始，還是一開始就很快。','想想身體有沒有先逐漸動起來。'],'你有看出哪些做法是慢慢開始。','再看動作是不是一開始就很快、很用力。'),
    choose('choose-safe-warmup-action','體育課要開始跑步遊戲，老師請大家先暖身。選一個合適的做法。',[
      ['warmup-walk-move','先慢慢走一走，再輕輕活動手腳。'],['sprint-at-once','立刻全力跑第一圈。'],['push-and-rush','推開同學，搶先跑出去。'],
    ],'warmup-walk-move',['想想跑步前，身體可以怎麼慢慢準備。','留意哪個做法不會一開始就太快。'],'先慢慢活動身體，再開始跑步。','再看題目：老師要大家先暖身，想想哪個做法是慢慢開始。'),
  ]),teacherReview:Object.freeze({status:'pending_teacher_review',evidenceStatus:'partial'}),evidencePolicy:'partial_curriculum_alignment_candidate_only',
});

const activityChoice = Object.freeze({
  activityId:'ACT-G1-HPE-ACTIVITY-CHOICE-BENEFITS-CANDIDATE',revision:1,title:'活力運動家：運動益處與活動選擇',gradeId:'grade-1',subjectId:'health-physical-education',status:'candidate_pending_teacher_review',sourceKind:'curriculum_aligned_simulated_candidate',curriculumMapId:'health-pe-stage1-activity-choice-and-benefits',sourceId:'health-physical-education',curriculumCodes:Object.freeze(['Cb-Ⅰ-1','4c-Ⅰ-2']),curriculumScope:'第一學習階段局部參照；螢幕分類與選答只練習安全線索及活動選擇，不代表實際運動或運動能力。',learningObjective:Object.freeze({objectiveId:'LO-G1-HPE-ACTIVITY-CHOICE-01',statement:'依活動空間與規則辨認安全線索，並選擇符合情境的身體活動。',status:'candidate_pending_teacher_review'}),instructions:'在螢幕情境中觀察活動線索並作選擇，不評量實際運動能力。',learningSubitemClaims:Object.freeze([]),
  titlePronunciationTokens:reviewed('活力運動家：運動益處與活動選擇'),
  stages:Object.freeze([
    classify('classify-sport-safety-clues','看體育活動卡：有安全空間和規則嗎？分出可以照規則活動和要先停下來看的情況。',[
      ['pass-under-rule','在操場空地，照老師的規則傳球。'],['rope-check-space','跳繩前先看四周，和同學保持距離。'],['chase-in-hallway','在走廊追球，旁邊有人走過。'],['swing-near-classmate','揮球拍時，旁邊站著同學。'],
    ],[['space-and-rules','有安全空間和規則'],['pause-and-check','要先停下來看看']],{'pass-under-rule':'space-and-rules','rope-check-space':'space-and-rules','chase-in-hallway':'pause-and-check','swing-near-classmate':'pause-and-check'},['看活動在哪裡，也看附近有沒有人。','想想開始前有沒有先看空間和規則。'],'你有注意活動空間和旁邊的人。','再看活動空間和旁邊的人，再決定要不要開始。'),
    choose('choose-activity-for-marked-space','小安想和同學一起活動，老師指定在操場空地慢慢跑。哪個做法符合這個活動？',[
      ['run-slowly-open-field','在操場空地跟著老師慢慢跑。'],['chase-ball-hallway','在教室走廊追著球跑。'],['kick-ball-roadside','到車道旁踢球。'],
    ],'run-slowly-open-field',['先看老師說的活動和地點。','選一個能在操場空地安全進行的做法。'],'安全地活動，能讓身體動一動。','再看題目指定的活動和地點，想想哪個做法符合。'),
  ]),teacherReview:Object.freeze({status:'pending_teacher_review',evidenceStatus:'partial'}),evidencePolicy:'partial_curriculum_alignment_candidate_only',
});

const food = Object.freeze({
  activityId:'ACT-G1-HPE-FOOD-DIET-HABITS-CANDIDATE',revision:1,title:'健康生活家：認識食物與飲食習慣',gradeId:'grade-1',subjectId:'health-physical-education',status:'candidate_pending_teacher_review',sourceKind:'curriculum_aligned_simulated_candidate',curriculumMapId:'health-pe-stage1-food-and-diet-habits',sourceId:'health-physical-education',curriculumCodes:Object.freeze(['Ea-Ⅰ-1','Ea-Ⅰ-2','1a-Ⅰ-2','4a-Ⅰ-2']),curriculumScope:'第一學習階段局部參照，尚待教師審查；不將食物二分為好壞，也不作醫療營養建議。',learningObjective:Object.freeze({objectiveId:'LO-G1-HPE-FOOD-HABITS-01',statement:'辨認常見食物，並思考符合自己食量的取餐做法。',status:'candidate_pending_teacher_review'}),instructions:'在螢幕情境中認識常見食物與取餐做法，不評量真實飲食習慣。',learningSubitemClaims:Object.freeze([]),
  titlePronunciationTokens:reviewed('健康生活家：認識食物與飲食習慣'),
  stages:Object.freeze([
    classify('classify-common-foods','看每張卡，把常見食物和不是食物的東西分開。',[
      ['rice-bowl','一碗白飯'],['apple','一顆蘋果'],['egg','一顆雞蛋'],['pencil','一支鉛筆'],['ball','一顆球'],['book','一本書'],
    ],[['common-food','常見食物'],['not-food','不是食物']],{'rice-bowl':'common-food','apple':'common-food','egg':'common-food','pencil':'not-food','ball':'not-food','book':'not-food'},['想想平常吃飯時，哪些東西會吃進嘴裡？','先看卡片上畫的是什麼。'],'你有分清楚常見食物和其他東西。','再看每張卡，想想它是不是平常會吃的食物。'),
    choose('choose-fitting-food-portion','午餐時，小安不確定要拿多少。哪個做法比較合適？',[
      ['take-enough-first','先拿自己吃得完的量，不夠再添。'],['take-large-portion','不看自己要吃多少，先拿一大盤。'],['discard-and-take-more','把不想吃的食物倒掉，再拿更多。'],
    ],'take-enough-first',['想想怎麼拿，能少留下一些吃不完的食物。','也想想怎麼照顧自己的食量。'],'先拿適量，不夠時可以再添。','再想想自己的食量，怎麼做能少剩下食物。'),
  ]),teacherReview:Object.freeze({status:'pending_teacher_review',evidenceStatus:'partial',note:'食物選擇需尊重家庭、文化、過敏與個別健康需要。'}),evidencePolicy:'partial_curriculum_alignment_candidate_only',
});

export const GRADE1_HPE_EXPANSION_ACTIVITIES = Object.freeze([hygiene,warmup,activityChoice,food]);
