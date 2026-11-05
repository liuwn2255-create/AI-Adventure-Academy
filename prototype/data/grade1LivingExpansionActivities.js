// Manually reviewed readings for the student-facing language in this batch.
// Non-Han characters (digits, punctuation, arrows and circled step marks) are
// retained as plain text tokens and are never assigned a pronunciation.
const READINGS = Object.freeze({
  大: 'ㄉㄚˋ', 家: 'ㄐㄧㄚ', 一: 'ㄧ', 起: 'ㄑㄧˇ', 讀: 'ㄉㄨˊ', 故: 'ㄍㄨˋ', 事: 'ㄕˋ',
  輪: 'ㄌㄨㄣˊ', 流: 'ㄌㄧㄡˊ', 小: 'ㄒㄧㄠˇ', 隊: 'ㄉㄨㄟˋ', 怎: 'ㄗㄣˇ', 麼: 'ㄇㄜ˙', 玩: 'ㄨㄢˊ',
  看: 'ㄎㄢˋ', 卡: 'ㄎㄚˇ', 選: 'ㄒㄩㄢˇ', 每: 'ㄇㄟˇ', 張: 'ㄓㄤ', 都: 'ㄉㄡ', 分: 'ㄈㄣ', 好: 'ㄏㄠˇ',
  後: 'ㄏㄡˋ', 檢: 'ㄐㄧㄢˇ', 查: 'ㄔㄚˊ', 答: 'ㄉㄚˊ', 案: 'ㄢˋ', 等: 'ㄉㄥˇ', 到: 'ㄉㄠˋ',
  同: 'ㄊㄨㄥˊ', 學: 'ㄒㄩㄝˊ', 說: 'ㄕㄨㄛ', 完: 'ㄨㄢˊ', 再: 'ㄗㄞˋ', 想: 'ㄒㄧㄤˇ', 想: 'ㄒㄧㄤˇ',
  請: 'ㄑㄧㄥˇ', 聽: 'ㄊㄧㄥ', 對: 'ㄉㄨㄟˋ', 方: 'ㄈㄤ', 法: 'ㄈㄚˇ', 輪流: undefined,
  閱: 'ㄩㄝˋ', 頁: 'ㄧㄝˋ', 換: 'ㄏㄨㄢˋ', 人: 'ㄖㄣˊ', 的: 'ㄉㄜ˙', 先: 'ㄒㄧㄢ', 讓: 'ㄖㄤˋ',
  每: 'ㄇㄟˇ', 位: 'ㄨㄟˋ', 讀: 'ㄉㄨˊ', 者: 'ㄓㄜˇ', 讀完: undefined, 下: 'ㄒㄧㄚˋ', 個: 'ㄍㄜˋ',
  打: 'ㄉㄚˇ', 斷: 'ㄉㄨㄢˋ', 搶: 'ㄑㄧㄤˇ', 書: 'ㄕㄨ', 自: 'ㄗˋ', 己: 'ㄐㄧˇ', 接: 'ㄐㄧㄝ',
  著: 'ㄓㄜ˙', 借: 'ㄐㄧㄝˋ', 別: 'ㄅㄧㄝˊ', 與: 'ㄩˇ', 安: 'ㄢ', 靜: 'ㄐㄧㄥˋ', 說: 'ㄕㄨㄛ',
  把: 'ㄅㄚˇ', 書: 'ㄕㄨ', 放: 'ㄈㄤˋ', 回: 'ㄏㄨㄟˊ', 桌: 'ㄓㄨㄛ', 上: 'ㄕㄤˋ',
  新: 'ㄒㄧㄣ', 來: 'ㄌㄞˊ', 朋: 'ㄆㄥˊ', 友: 'ㄧㄡˇ', 還: 'ㄏㄞˊ', 沒: 'ㄇㄟˊ', 輪: 'ㄌㄨㄣˊ',
  校: 'ㄒㄧㄠˋ', 園: 'ㄩㄢˊ', 觀: 'ㄍㄨㄢ', 察: 'ㄔㄚˊ', 找: 'ㄓㄠˇ', 出: 'ㄔㄨ', 角: 'ㄐㄧㄠˇ',
  落: 'ㄌㄨㄛˋ', 線: 'ㄒㄧㄢˋ', 索: 'ㄙㄨㄛˇ', 同: 'ㄊㄨㄥˊ', 時: 'ㄕˊ', 點: 'ㄉㄧㄢˇ', 記: 'ㄐㄧˋ',
  錄: 'ㄌㄨˋ', 植: 'ㄓˊ', 物: 'ㄨˋ', 有: 'ㄧㄡˇ', 沒: 'ㄇㄟˊ', 花: 'ㄏㄨㄚ', 圃: 'ㄆㄨˇ', 旁: 'ㄆㄤˊ',
  兩: 'ㄌㄧㄤˇ', 盆: 'ㄆㄣˊ', 走: 'ㄗㄡˇ', 廊: 'ㄌㄤˊ', 窗: 'ㄔㄨㄤ', 邊: 'ㄅㄧㄢ', 教: 'ㄐㄧㄠˋ',
  室: 'ㄕˋ', 門: 'ㄇㄣˊ', 操: 'ㄘㄠ', 場: 'ㄔㄤˇ', 角落: undefined, 哪: 'ㄋㄚˇ', 裡: 'ㄌㄧˇ',
  依: 'ㄧ', 卡: 'ㄎㄚˇ', 上: 'ㄕㄤˋ', 寫: 'ㄒㄧㄝˇ', 只: 'ㄓˇ', 判: 'ㄆㄢˋ', 斷: 'ㄉㄨㄢˋ',
  不: 'ㄅㄨˋ', 猜: 'ㄘㄞ', 植物: undefined, 紀: 'ㄐㄧˋ', 這: 'ㄓㄜˋ', 是: 'ㄕˋ', 數: 'ㄕㄨˋ',
  位: 'ㄨㄟˋ', 紀: 'ㄐㄧˋ', 同: 'ㄊㄨㄥˊ', 看: 'ㄎㄢˋ', 完: 'ㄨㄢˊ', 成: 'ㄔㄥˊ', 全: 'ㄑㄩㄢˊ',
  再: 'ㄗㄞˋ', 分: 'ㄈㄣ', 觀察: undefined, 記錄: undefined, 小隊: undefined, 答: 'ㄉㄚˊ', 錯: 'ㄘㄨㄛˋ',
  線: 'ㄒㄧㄢˋ', 幫: 'ㄅㄤ', 助: 'ㄓㄨˋ', 校園: undefined, 卡片: undefined, 片: 'ㄆㄧㄢˋ', 地: 'ㄉㄧˋ', 方: 'ㄈㄤ',
  看見: undefined, 植: 'ㄓˊ', 物: 'ㄨˋ', 兩: 'ㄌㄧㄤˇ', 個: 'ㄍㄜˋ', 同: 'ㄊㄨㄥˊ', 一: 'ㄧ', 天: 'ㄊㄧㄢ',
  下: 'ㄒㄧㄚˋ', 午: 'ㄨˇ', 時: 'ㄕˊ', 比: 'ㄅㄧˇ', 較: 'ㄐㄧㄠˋ', 兩地: undefined,
  先: 'ㄒㄧㄢ', 用: 'ㄩㄥˋ', 再: 'ㄗㄞˋ', 把: 'ㄅㄚˇ', 句: 'ㄐㄩˋ', 問: 'ㄨㄣˋ', 題: 'ㄊㄧˊ',
  同樣: undefined, 樣: 'ㄧㄤˋ', 記下: undefined, 對照: undefined, 張: 'ㄓㄤ', 紀: 'ㄐㄧˋ', 錄: 'ㄌㄨˋ',
  請: 'ㄑㄧㄥˇ', 照: 'ㄓㄠˋ', 步: 'ㄅㄨˋ', 驟: 'ㄗㄡˋ', 排: 'ㄆㄞˊ', 順: 'ㄕㄨㄣˋ', 序: 'ㄒㄩˋ',
  線索: undefined, 尋: 'ㄒㄩㄣˊ', 問: 'ㄨㄣˋ', 題: 'ㄊㄧˊ', 用: 'ㄩㄥˋ', 先: 'ㄒㄧㄢ', 找: 'ㄓㄠˇ',
  清: 'ㄑㄧㄥ', 楚: 'ㄔㄨˇ', 再: 'ㄗㄞˋ', 依: 'ㄧ', 卡: 'ㄎㄚˇ', 去: 'ㄑㄩˋ', 最: 'ㄗㄨㄟˋ',
  後: 'ㄏㄡˋ', 檢: 'ㄐㄧㄢˇ', 查: 'ㄔㄚˊ', 幫: 'ㄅㄤ', 忙: 'ㄇㄤˊ', 解: 'ㄐㄧㄝˇ', 決: 'ㄐㄩㄝˊ',
  小: 'ㄒㄧㄠˇ', 禾: 'ㄏㄜˊ', 找: 'ㄓㄠˇ', 不: 'ㄅㄨˋ', 到: 'ㄉㄠˋ', 自: 'ㄗˋ', 己: 'ㄐㄧˇ',
  畫: 'ㄏㄨㄚˋ', 紙: 'ㄓˇ', 放: 'ㄈㄤˋ', 進: 'ㄐㄧㄣˋ', 資: 'ㄗ', 料: 'ㄌㄧㄠˋ', 夾: 'ㄐㄧㄚˊ',
  藍: 'ㄌㄢˊ', 色: 'ㄙㄜˋ', 書: 'ㄕㄨ', 架: 'ㄐㄧㄚˋ', 第: 'ㄉㄧˋ', 二: 'ㄦˋ', 格: 'ㄍㄜˊ',
  看: 'ㄎㄢˋ', 名: 'ㄇㄧㄥˊ', 字: 'ㄗˋ', 是: 'ㄕˋ', 否: 'ㄈㄡˇ', 從: 'ㄘㄨㄥˊ', 中: 'ㄓㄨㄥ',
  找: 'ㄓㄠˇ', 到: 'ㄉㄠˋ', 再: 'ㄗㄞˋ', 打: 'ㄉㄚˇ', 開: 'ㄎㄞ', 看: 'ㄎㄢˋ', 取: 'ㄑㄩˇ', 回: 'ㄏㄨㄟˊ',
  紙: 'ㄓˇ', 先: 'ㄒㄧㄢ', 找: 'ㄓㄠˇ', 畫: 'ㄏㄨㄚˋ', 畫: 'ㄏㄨㄚˋ', 者: 'ㄓㄜˇ', 不: 'ㄅㄨˋ', 同: 'ㄊㄨㄥˊ',
  顏: 'ㄧㄢˊ', 料: 'ㄌㄧㄠˋ', 看: 'ㄎㄢˋ', 員: 'ㄩㄢˊ', 的: 'ㄉㄜ˙', 誰: 'ㄕㄟˊ', 別: 'ㄅㄧㄝˊ',
  拿: 'ㄋㄚˊ', 取: 'ㄑㄩˇ', 他: 'ㄊㄚ', 們: 'ㄇㄣ˙', 分: 'ㄈㄣ', 類: 'ㄌㄟˋ', 不: 'ㄅㄨˋ',
  是: 'ㄕˋ', 自: 'ㄗˋ', 然: 'ㄖㄢˊ', 前: 'ㄑㄧㄢˊ', 後: 'ㄏㄡˋ', 代: 'ㄉㄞˋ', 表: 'ㄅㄧㄠˇ', 真: 'ㄓㄣ',
  實: 'ㄕˊ', 探: 'ㄊㄢˋ', 究: 'ㄐㄧㄡˋ', 能: 'ㄋㄥˊ', 力: 'ㄌㄧˋ', 評: 'ㄆㄧㄥˊ', 量: 'ㄌㄧㄤˋ',
  仍: 'ㄖㄥˊ', 需: 'ㄒㄩ', 教: 'ㄐㄧㄠˋ', 師: 'ㄕ', 確: 'ㄑㄩㄝˋ', 認: 'ㄖㄣˋ', 數位: undefined,
  模: 'ㄇㄛˊ', 擬: 'ㄋㄧˇ', 情: 'ㄑㄧㄥˊ', 境: 'ㄐㄧㄥˋ', 行: 'ㄒㄧㄥˊ', 為: 'ㄨㄟˊ',
  本: 'ㄅㄣˇ', 活: 'ㄏㄨㄛˊ', 動: 'ㄉㄨㄥˋ', 生: 'ㄕㄥ', 習: 'ㄒㄧˊ', 階: 'ㄐㄧㄝ', 段: 'ㄉㄨㄢˋ',
  涵: 'ㄏㄢˊ', 及: 'ㄐㄧˊ', 年: 'ㄋㄧㄢˊ', 尚: 'ㄕㄤˋ', 期: 'ㄑㄧˊ', 進: 'ㄐㄧㄣˋ', 度: 'ㄉㄨˋ',
  課: 'ㄎㄜˋ', 綱: 'ㄍㄤ', 作: 'ㄗㄨㄛˋ', 部: 'ㄅㄨˋ', 應: 'ㄧㄥ', 待: 'ㄉㄞˋ', 審: 'ㄕㄣˇ',
  候: 'ㄏㄡˋ', 僅: 'ㄐㄧㄣˇ', 供: 'ㄍㄨㄥ', 練: 'ㄌㄧㄢˋ', 無: 'ㄨˊ', 連: 'ㄌㄧㄢˊ', 結: 'ㄐㄧㄝˊ',
  補: 'ㄅㄨˇ', 強: 'ㄑㄧㄤˊ', 內: 'ㄋㄟˋ', 意: 'ㄧˋ', 在: 'ㄗㄞˋ', 適: 'ㄕˋ', 齡: 'ㄌㄧㄥˊ',
  和: 'ㄏㄜˊ', 會: 'ㄏㄨㄟˋ', 過: 'ㄍㄨㄛˋ', 正: 'ㄓㄥˋ', 我: 'ㄨㄛˇ', 直: 'ㄓˊ', 聲: 'ㄕㄥ',
  話: 'ㄏㄨㄚˋ', 種: 'ㄓㄨㄥˇ', 續: 'ㄒㄩˋ', 約: 'ㄩㄝ', 定: 'ㄉㄧㄥˋ', 口: 'ㄎㄡˇ', 明: 'ㄇㄧㄥˊ',
  你: 'ㄋㄧˇ', 置: 'ㄓˋ', 紅: 'ㄏㄨㄥˊ', 黃: 'ㄏㄨㄤˊ', 關: 'ㄍㄨㄢ', 移: 'ㄧˊ', 形: 'ㄒㄧㄥˊ',
  始: 'ㄕˇ', 另: 'ㄌㄧㄥˋ', 目: 'ㄇㄨˋ', 指: 'ㄓˇ', 各: 'ㄍㄜˋ', 辨: 'ㄅㄧㄢˋ', 並: 'ㄅㄧㄥˋ',
  擇: 'ㄗㄜˊ', 符: 'ㄈㄨˊ', 間: 'ㄐㄧㄢ', 做: 'ㄗㄨㄛˋ', 就: 'ㄐㄧㄡˋ', 才: 'ㄘㄞˊ',
  或: 'ㄏㄨㄛˋ', 蓋: 'ㄍㄞˋ', 容: 'ㄖㄨㄥˊ', 際: 'ㄐㄧˋ', 唯: 'ㄨㄟˊ', 性: 'ㄒㄧㄥˋ', 文: 'ㄨㄣˊ',
  了: 'ㄌㄜ˙', 要: 'ㄧㄠˋ', 繼: 'ㄐㄧˋ', 它: 'ㄊㄚ', 合: 'ㄏㄜˊ',
  級: 'ㄐㄧˊ', 未: 'ㄨㄟˋ',
});

// Context-reviewed tone changes for the polyphonic-in-context character 一.
const YI_CONTEXT_READINGS = Object.freeze({
  起: 'ㄧˋ', 本: 'ㄧˋ', 位: 'ㄧˊ', 頁: 'ㄧˊ', 個: 'ㄧˊ', 類: 'ㄧˊ',
  盆: 'ㄧˋ', 張: 'ㄧˋ', 天: 'ㄧˋ', 種: 'ㄧˋ', 直: 'ㄧˋ', 樣: 'ㄧˊ', 次: 'ㄧˊ',
});

function reviewed(text) {
  const characters = Array.from(text);
  const tokens = characters.map((character, index) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = character === '一'
      ? characters[index - 1] === '第' ? 'ㄧ' : YI_CONTEXT_READINGS[characters[index + 1]] ?? READINGS[character]
      : READINGS[character];
    if (!reading) throw new Error(`Missing manually reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  return Object.freeze(tokens);
}

const withText = (text) => Object.freeze({ text, pronunciationTokens: reviewed(text) });
const hint = (text) => withText(text);
const option = (id, text, feedback) => Object.freeze({ id, ...withText(text), feedback, feedbackPronunciationTokens: reviewed(feedback) });
const observation = (id, text) => Object.freeze({ id, ...withText(text) });
const category = (id, label) => Object.freeze({ id, label, pronunciationTokens: reviewed(label) });
const orderItem = (id, text) => Object.freeze({ id, ...withText(text) });

const commonReviewLimitation = '本活動是數位模擬，不代表完成實地觀察或真實生活行為評量。第一學習階段涵蓋一、二年級，尚未確認一年級學期進度；課綱只作部分對應，仍待教師審查。';
const candidate = (activity) => Object.freeze({
  revision: 1,
  gradeId: 'grade-1',
  subjectId: 'living-curriculum',
  status: 'candidate_pending_teacher_review',
  sourceKind: 'original_simulated_living_candidate_not_textbook',
  sourceId: 'living-curriculum',
  runtimeModule: 'prototype/data/grade1LivingExpansionActivities.js',
  curriculumScope: '第一學習階段候選課綱的部分對應；一、二年級學期進度未確認。數位情境僅供練習，不代表實地觀察、真實探究或真實生活行為評量。',
  teacherLimitationNote: commonReviewLimitation,
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'not_reviewed', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze(['第一學習階段內容在一年級的實際教學時序待教師確認。', '模擬情境、答案唯一性與文字適齡性待教師審查。']),
  ...activity,
  titlePronunciationTokens: reviewed(activity.title),
  instructionsPronunciationTokens: reviewed(activity.instructions),
  stages: Object.freeze(activity.stages.map((stage) => Object.freeze({ teacherLimitationNote: commonReviewLimitation, ...stage }))),
});

const rulesStage1 = Object.freeze({
  stageId: 'sort-turn-taking-actions', interaction: 'classify_observations',
  prompt: '一起讀同一本故事書。看每張卡，分出幫助大家輪流讀和會打斷輪流讀的做法。',
  promptPronunciationTokens: reviewed('一起讀同一本故事書。看每張卡，分出幫助大家輪流讀和會打斷輪流讀的做法。'),
  studentOperationGuidance: '怎麼玩：① 看每張卡 → ② 選一類 → ③ 全部分好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看每張卡 → ② 選一類 → ③ 全部分好後檢查答案'),
  observations: Object.freeze([
    observation('wait-for-turn', '等前一位讀完，再接著讀。'), observation('listen-to-reader', '先聽同學讀完，再輪到自己。'),
    observation('grab-book', '不等同學讀完，就把書拿過來。'), observation('talk-over-reader', '同學正在讀，我一直大聲說話。'),
  ]),
  categories: Object.freeze([category('helps-taking-turns', '幫助輪流讀'), category('interrupts-turns', '打斷輪流讀')]),
  correctAssignments: Object.freeze({ 'wait-for-turn': 'helps-taking-turns', 'listen-to-reader': 'helps-taking-turns', 'grab-book': 'interrupts-turns', 'talk-over-reader': 'interrupts-turns' }),
  hints: Object.freeze([hint('想想看，這個做法有沒有等前一位讀完？'), hint('每張卡只選一種做法。')]),
  incorrectFeedback: '再看卡片：大家有沒有等前一位讀完？', correctFeedback: '答對了！輪流讀要等前一位讀完。',
  incorrectFeedbackPronunciationTokens: reviewed('再看卡片：大家有沒有等前一位讀完？'),
  correctFeedbackPronunciationTokens: reviewed('答對了！輪流讀要等前一位讀完。'),
});
const rulesStage2 = Object.freeze({
  stageId: 'choose-restart-shared-reading', interaction: 'choose_response',
  prompt: '小安還沒有讀到。下一步怎麼做，大家才能繼續一起讀？',
  promptPronunciationTokens: reviewed('小安還沒有讀到。下一步怎麼做，大家才能繼續一起讀？'),
  options: Object.freeze([
    option('give-an-the-next-turn', '讓小安接著讀下一頁。', '大家照約定輪流讀。'),
    option('keep-own-turn', '自己再讀一頁，不讓小安讀。', '想想看，大家約好要輪流讀。'),
    option('take-book-now', '把書拿走，換自己讀。', '想想看，大家約好要輪流讀。'),
  ]),
  correctOptionIds: Object.freeze(['give-an-the-next-turn']),
  hints: Object.freeze([hint('回想大家一起讀書的約定。'), hint('想想看，誰還沒有輪到？')]),
  incorrectFeedback: '再想想讀書約定：還沒讀到的人有沒有輪到？', correctFeedback: '答對了！讓還沒讀的人接著讀。',
  incorrectFeedbackPronunciationTokens: reviewed('再想想讀書約定：還沒讀到的人有沒有輪到？'),
  correctFeedbackPronunciationTokens: reviewed('答對了！讓還沒讀的人接著讀。'),
});

const campusCards = Object.freeze([
  observation('garden-plant-record', '花圃旁：記錄有一盆植物。'), observation('hall-window-no-plant', '走廊窗邊：記錄沒有植物。'),
  observation('classroom-door-no-plant', '教室門口：記錄沒有植物。'), observation('playground-corner-no-plant', '操場角落：記錄沒有植物。'),
]);
const campusStage1 = Object.freeze({
  stageId: 'collect-campus-feature-clues', interaction: 'collect_evidence', requiredSelectionCount: 2, selectionUnitLabel: '張',
  prompt: '看校園紀錄卡，選出兩張明確寫著「有植物」的地點卡。',
  promptPronunciationTokens: reviewed('看校園紀錄卡，選出兩張明確寫著「有植物」的地點卡。'),
  studentOperationGuidance: '怎麼玩：① 看地點紀錄 → ② 選 2 張 → ③ 選好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看地點紀錄 → ② 選 2 張 → ③ 選好後檢查答案'),
  options: Object.freeze([
    option('garden-plant-record', '花圃旁：記錄有一盆植物。', '卡片明確記錄花圃旁有植物。'),
    option('hall-window-no-plant', '走廊窗邊：記錄沒有植物。', '這張卡記錄沒有植物。'),
    option('classroom-door-plant-record', '教室門口：記錄有一盆植物。', '卡片明確記錄教室門口有植物。'),
    option('playground-corner-no-plant', '操場角落：記錄沒有植物。', '這張卡記錄沒有植物。'),
  ]),
  correctOptionIds: Object.freeze(['garden-plant-record', 'classroom-door-plant-record']),
  hints: Object.freeze([hint('只看卡片上寫的地點和植物紀錄。'), hint('找明確寫著「有植物」的卡。')]),
  incorrectFeedback: '再看紀錄卡：哪兩個地點明確寫著有植物？', correctFeedback: '答對了！你找到兩張有植物的紀錄。',
  incorrectFeedbackPronunciationTokens: reviewed('再看紀錄卡：哪兩個地點明確寫著有植物？'),
  correctFeedbackPronunciationTokens: reviewed('答對了！你找到兩張有植物的紀錄。'),
});
const campusStage2 = Object.freeze({
  stageId: 'sort-campus-feature-records', interaction: 'classify_observations',
  prompt: '同一天下午的紀錄，分出有植物和沒有植物的地點。',
  promptPronunciationTokens: reviewed('同一天下午的紀錄，分出有植物和沒有植物的地點。'),
  studentOperationGuidance: '怎麼玩：① 看每張紀錄 → ② 選一類 → ③ 全部分好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看每張紀錄 → ② 選一類 → ③ 全部分好後檢查答案'),
  observations: campusCards,
  categories: Object.freeze([category('record-says-plant', '記錄有植物'), category('record-says-no-plant', '記錄沒有植物')]),
  correctAssignments: Object.freeze({ 'garden-plant-record': 'record-says-plant', 'hall-window-no-plant': 'record-says-no-plant', 'classroom-door-no-plant': 'record-says-no-plant', 'playground-corner-no-plant': 'record-says-no-plant' }),
  hints: Object.freeze([hint('看每張卡的「有」或「沒有」。'), hint('依紀錄分類，不用猜沒有寫的事。')]),
  incorrectFeedback: '再讀每張卡：它寫有植物，還是沒有植物？', correctFeedback: '答對了！你照著紀錄分好了。',
  incorrectFeedbackPronunciationTokens: reviewed('再讀每張卡：它寫有植物，還是沒有植物？'),
  correctFeedbackPronunciationTokens: reviewed('答對了！你照著紀錄分好了。'),
});

const problemStage1 = Object.freeze({
  stageId: 'gather-useful-problem-clues', interaction: 'collect_evidence', requiredSelectionCount: 2, selectionUnitLabel: '張',
  prompt: '小禾找不到畫紙。選出兩張能幫忙找畫紙的線索卡。',
  promptPronunciationTokens: reviewed('小禾找不到畫紙。選出兩張能幫忙找畫紙的線索卡。'),
  studentOperationGuidance: '怎麼玩：① 看線索卡 → ② 選 2 張 → ③ 選好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看線索卡 → ② 選 2 張 → ③ 選好後檢查答案'),
  options: Object.freeze([
    option('paper-in-own-folder', '畫紙放進寫著小禾名字的資料夾。', '這張卡寫了畫紙放在哪裡。'),
    option('folder-blue-shelf', '小禾的資料夾放在藍色書架第二格。', '這張卡寫了資料夾的位置。'),
    option('classmate-folder', '小明的資料夾放在紅色書架第一格。', '這張卡寫的是小明的資料夾。'),
    option('paper-color', '小禾畫了一張黃色的畫。', '這張卡沒有寫畫紙放在哪裡。'),
  ]),
  correctOptionIds: Object.freeze(['paper-in-own-folder', 'folder-blue-shelf']),
  hints: Object.freeze([hint('找和畫紙、資料夾位置有關的卡。'), hint('看看哪張卡寫了小禾的名字和資料夾位置。')]),
  incorrectFeedback: '再看線索：哪兩張卡寫了畫紙和小禾資料夾的位置？', correctFeedback: '答對了！你找到畫紙和資料夾的線索。',
  incorrectFeedbackPronunciationTokens: reviewed('再看線索：哪兩張卡寫了畫紙和小禾資料夾的位置？'),
  correctFeedbackPronunciationTokens: reviewed('答對了！你找到畫紙和資料夾的線索。'),
});
const problemStage2 = Object.freeze({
  stageId: 'order-helpful-solution-steps', interaction: 'order_items',
  prompt: '照線索排一排，幫小禾找回畫紙。',
  promptPronunciationTokens: reviewed('照線索排一排，幫小禾找回畫紙。'),
  studentOperationGuidance: '怎麼玩：① 看每個步驟 → ② 用「上移／下移」排先後 → ③ 排好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看每個步驟 → ② 用「上移／下移」排先後 → ③ 排好後檢查答案'),
  items: Object.freeze([
    orderItem('check-folder-name', '先看資料卡，確認資料夾放在哪裡。'),
    orderItem('go-to-blue-shelf', '再到資料卡寫的藍色書架第二格。'),
    orderItem('find-own-paper', '最後找寫著小禾名字的資料夾，拿回畫紙。'),
  ]),
  initialOrder: Object.freeze(['find-own-paper', 'go-to-blue-shelf', 'check-folder-name']),
  correctItemIds: Object.freeze(['check-folder-name', 'go-to-blue-shelf', 'find-own-paper']),
  hints: Object.freeze([hint('先讀線索卡，再照卡上的位置去找。'), hint('先確認位置，接著去找，最後拿回畫紙。')]),
  incorrectFeedback: '再看資料卡：先確認位置，再去找，最後拿回畫紙。', correctFeedback: '答對了！你照線索排出找畫紙的步驟。',
  incorrectFeedbackPronunciationTokens: reviewed('再看資料卡：先確認位置，再去找，最後拿回畫紙。'),
  correctFeedbackPronunciationTokens: reviewed('答對了！你照線索排出找畫紙的步驟。'),
});

const inquiryStage1 = Object.freeze({
  stageId: 'order-observation-steps', interaction: 'order_items',
  prompt: '觀察同一天下午的兩個地方。把觀察步驟排好。',
  promptPronunciationTokens: reviewed('觀察同一天下午的兩個地方。把觀察步驟排好。'),
  studentOperationGuidance: '怎麼玩：① 看每個步驟 → ② 用「上移／下移」排先後 → ③ 排好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看每個步驟 → ② 用「上移／下移」排先後 → ③ 排好後檢查答案'),
  items: Object.freeze([
    orderItem('choose-question', '先想好要比較的問題。'),
    orderItem('observe-both-places', '用同一種方法看兩個地方。'),
    orderItem('record-what-seen', '把看到的情形記下來。'),
    orderItem('compare-records', '最後把兩張紀錄放在一起看。'),
  ]),
  initialOrder: Object.freeze(['compare-records', 'record-what-seen', 'observe-both-places', 'choose-question']),
  correctItemIds: Object.freeze(['choose-question', 'observe-both-places', 'record-what-seen', 'compare-records']),
  hints: Object.freeze([hint('先決定要找答案的問題，再開始觀察。'), hint('看完兩個地方後，記下來再比較。')]),
  incorrectFeedback: '再想步驟：先有問題，再觀察、記錄，最後比較。', correctFeedback: '答對了！你依照觀察步驟完成比較。',
  incorrectFeedbackPronunciationTokens: reviewed('再想步驟：先有問題，再觀察、記錄，最後比較。'),
  correctFeedbackPronunciationTokens: reviewed('答對了！你依照觀察步驟完成比較。'),
});
const inquiryStage2 = Object.freeze({
  stageId: 'select-records-for-question', interaction: 'collect_evidence', requiredSelectionCount: 2, selectionUnitLabel: '張',
  prompt: '同一天下午比較花圃旁和走廊窗邊。選出這兩個地方的紀錄卡。',
  promptPronunciationTokens: reviewed('同一天下午比較花圃旁和走廊窗邊。選出這兩個地方的紀錄卡。'),
  studentOperationGuidance: '怎麼玩：① 看地點紀錄 → ② 選 2 張 → ③ 選好後檢查答案',
  studentOperationGuidancePronunciationTokens: reviewed('怎麼玩：① 看地點紀錄 → ② 選 2 張 → ③ 選好後檢查答案'),
  options: Object.freeze([
    option('compare-garden', '花圃旁：記錄有一盆植物。', '這張卡是花圃旁的紀錄。'),
    option('compare-hall', '走廊窗邊：記錄沒有植物。', '這張卡是走廊窗邊的紀錄。'),
    option('compare-door', '教室門口：記錄沒有植物。', '這張卡是另一個地點的紀錄。'),
    option('compare-playground', '操場角落：記錄沒有植物。', '這張卡是另一個地點的紀錄。'),
  ]),
  correctOptionIds: Object.freeze(['compare-garden', 'compare-hall']),
  hints: Object.freeze([hint('題目說要比較哪兩個地方？'), hint('每個指定的地方各找一張紀錄。')]),
  incorrectFeedback: '再看題目：找花圃旁和走廊窗邊各一張紀錄。', correctFeedback: '答對了！你找到同一天下午兩個地方的紀錄。',
  incorrectFeedbackPronunciationTokens: reviewed('再看題目：找花圃旁和走廊窗邊各一張紀錄。'),
  correctFeedbackPronunciationTokens: reviewed('答對了！你找到同一天下午兩個地方的紀錄。'),
});

export const GRADE1_LIVING_EXPANSION_ACTIVITIES = Object.freeze([
  candidate({
    activityId: 'ACT-G1-LIVING-SHARED-PLAY-RULES-CANDIDATE', title: '輪流小隊：大家一起讀故事', curriculumMapId: 'living-curriculum-stage1-shared-rules', curriculumCodes: Object.freeze(['6-I-3', 'E-I-2']),
    learningObjective: Object.freeze({ objectiveId: 'LO-G1-LIVING-SHARED-PLAY-RULES-01', statement: '辨認一起閱讀時能幫助大家輪流的做法，並選擇符合約定的下一步。', status: 'candidate_pending_teacher_review' }),
    instructions: '看一起讀書的情境，分辨輪流做法，再選下一步。', stages: Object.freeze([rulesStage1, rulesStage2]),
  }),
  candidate({
    activityId: 'ACT-G1-LIVING-CAMPUS-CLUE-HUNT-CANDIDATE', title: '校園觀察隊：找出角落線索', curriculumMapId: 'living-curriculum-stage1-observation-inquiry', curriculumCodes: Object.freeze(['2-I-1', '2-I-5', 'C-I-3']),
    learningObjective: Object.freeze({ objectiveId: 'LO-G1-LIVING-CAMPUS-CLUE-HUNT-01', statement: '依校園地點卡的明確文字，找出並分類有植物與沒有植物的紀錄。', status: 'candidate_pending_teacher_review' }),
    instructions: '只依卡片明確寫下的觀察找線索。', stages: Object.freeze([campusStage1, campusStage2]),
  }),
  candidate({
    activityId: 'ACT-G1-LIVING-SMALL-PROBLEM-SOLVER-CANDIDATE', title: '小小解決隊：照線索排步驟', curriculumMapId: 'living-curriculum-stage1-observation-inquiry', curriculumCodes: Object.freeze(['2-I-4', '2-I-5', 'C-I-3']),
    learningObjective: Object.freeze({ objectiveId: 'LO-G1-LIVING-SMALL-PROBLEM-SOLVER-01', statement: '從明確線索找出畫紙與資料夾的位置，再依線索順序排出找回步驟。', status: 'candidate_pending_teacher_review' }),
    instructions: '先找線索，再照線索排出找回畫紙的步驟。', stages: Object.freeze([problemStage1, problemStage2]),
  }),
  candidate({
    activityId: 'ACT-G1-LIVING-OBSERVATION-MINI-INQUIRY-CANDIDATE', title: '觀察記錄小隊：比較兩個地方', curriculumMapId: 'living-curriculum-stage1-observation-inquiry', curriculumCodes: Object.freeze(['2-I-1', '2-I-4', '2-I-5', 'C-I-3']),
    learningObjective: Object.freeze({ objectiveId: 'LO-G1-LIVING-OBSERVATION-MINI-INQUIRY-01', statement: '依同一天下午兩個地點的紀錄，練習安排觀察步驟並找出指定紀錄。', status: 'candidate_pending_teacher_review' }),
    instructions: '依兩個地方同一時間的紀錄練習觀察和比較。', stages: Object.freeze([inquiryStage1, inquiryStage2]),
  }),
]);
