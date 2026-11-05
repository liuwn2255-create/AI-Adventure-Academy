import { reviewedTitlePronunciationTokens } from './reviewedTitlePronunciation.js';

const candidateStatus = 'candidate_pending_teacher_review';
const teacherLimitation = '本活動只練習螢幕上的排序或圖例辨識，不代表已實際完成暖身、使用校園場地或具備運動能力；需由教師依校本情境審查。';

const warmupSequence = Object.freeze({
  activityId: 'ACT-G2-HPE-WARMUP-SEQUENCE-CANDIDATE',
  revision: 1,
  title: '暖身順序小隊：準備好再開始',
  titlePronunciationTokens: reviewedTitlePronunciationTokens('暖身順序小隊：準備好再開始', 'ㄋㄨㄢˇ ㄕㄣ ㄕㄨㄣˋ ㄒㄩˋ ㄒㄧㄠˇ ㄉㄨㄟˋ ㄓㄨㄣˇ ㄅㄟˋ ㄏㄠˇ ㄗㄞˋ ㄎㄞ ㄕˇ'),
  gradeId: 'grade-2',
  subjectId: 'health-physical-education',
  status: candidateStatus,
  sourceKind: 'curriculum_aligned_simulated_candidate',
  curriculumMapId: 'health-pe-stage1-safe-warmup-and-movement',
  sourceId: 'health-physical-education',
  curriculumCodes: Object.freeze(['Bc-Ⅰ-1', '3c-Ⅰ-2']),
  curriculumScope: '第一學習階段局部參照；未指定二年級學期或校本進度。本題只依教師提供的活動安排排序，不代表所有運動都使用同一套流程；螢幕排序不評量實際暖身動作。',
  learningObjective: Object.freeze({
    objectiveId: 'LO-G2-HPE-WARMUP-SEQUENCE-01',
    statement: '依題目情境中的教師安排，整理活動前的步驟順序。',
    status: candidateStatus,
  }),
  instructions: '依照這題的活動安排，把四個步驟排好。這不是所有運動的固定標準。',
  learningSubitemClaims: Object.freeze([]),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'order-teacher-warmup-sequence',
      interaction: 'order_items',
      prompt: '依照教師指定的活動安排，排列四個步驟。',
      context: Object.freeze([
        Object.freeze({ speaker: '今天的安排', text: '老師先說明規則，再和大家查看活動空間；查看後跟老師做暖身，聽到開始訊號才開始遊戲。這是本題情境的流程。' }),
      ]),
      studentOperationGuidance: '怎麼玩：看四張卡，用上移、下移排順序；排好後檢查答案。',
      studentSubmitLabel: '檢查順序',
      items: Object.freeze([
        Object.freeze({ id: 'listen-to-rules', text: '聽老師說明遊戲規則。' }),
        Object.freeze({ id: 'check-activity-space', text: '和老師查看活動空間。' }),
        Object.freeze({ id: 'do-warmup-with-teacher', text: '跟老師一起做暖身。' }),
        Object.freeze({ id: 'start-after-signal', text: '聽到開始訊號後進行遊戲。' }),
      ]),
      initialOrder: Object.freeze(['do-warmup-with-teacher', 'start-after-signal', 'listen-to-rules', 'check-activity-space']),
      correctItemIds: Object.freeze(['listen-to-rules', 'check-activity-space', 'do-warmup-with-teacher', 'start-after-signal']),
      hints: Object.freeze([
        '找找題目裡表示先後的線索。',
        '想想哪些步驟要在開始訊號之前完成。',
      ]),
      incorrectFeedback: '再依題目中的教師安排檢查先後順序。',
      correctFeedback: '你依照本題的活動安排排好順序了。實際活動請聽老師指示。',
      teacherLimitationNote: teacherLimitation,
    }),
    Object.freeze({
      stageId: 'choose-wait-for-start-signal',
      interaction: 'choose_response',
      prompt: '老師正在說明活動規則，小安還沒有聽清楚開始訊號，應該怎麼做？',
      context: Object.freeze([
        Object.freeze({ speaker: '活動情境', text: '大家準備玩活動，小安還沒聽清楚規則和開始訊號。' }),
      ]),
      studentOperationGuidance: '怎麼玩：看情境，選一個做法，再檢查答案。',
      options: Object.freeze([
        Object.freeze({ id: 'wait-and-confirm', text: '先等候，向老師確認規則和開始訊號。' }),
        Object.freeze({ id: 'start-immediately', text: '還沒聽清楚，就直接開始活動。' }),
        Object.freeze({ id: 'follow-without-checking', text: '跟著同學跑出去，不確認規則。' }),
      ]),
      correctOptionIds: Object.freeze(['wait-and-confirm']),
      hints: Object.freeze([
        '開始前，先想想自己是否聽清楚規則。',
        '留意小安還沒聽清楚哪兩件事。',
      ]),
      incorrectFeedback: '先停下來聽清楚規則和開始訊號，再依老師指示行動。',
      correctFeedback: '先確認規則和開始訊號，再依老師指示開始，活動會更安全。',
      teacherLimitationNote: teacherLimitation,
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'pending_teacher_review', evidenceStatus: 'partial', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze([
    '教師需確認此情境的暖身與場地檢視順序符合班級實際教學安排。',
    '第一學習階段涵蓋一、二年級；二年級教材與授課進度尚待確認。',
    '螢幕排序不能代替教師帶領的暖身實作與安全行為觀察。',
  ]),
});

const schoolActivityMap = Object.freeze({
  activityId: 'ACT-G2-HPE-SCHOOL-ACTIVITY-MAP-CANDIDATE',
  revision: 1,
  title: '校園活動地圖：找對活動空間',
  titlePronunciationTokens: reviewedTitlePronunciationTokens('校園活動地圖：找對活動空間', 'ㄒㄧㄠˋ ㄩㄢˊ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄉㄧˋ ㄊㄨˊ ㄓㄠˇ ㄉㄨㄟˋ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄎㄨㄥ ㄐㄧㄢ'),
  gradeId: 'grade-2',
  subjectId: 'health-physical-education',
  status: candidateStatus,
  sourceKind: 'curriculum_aligned_simulated_candidate',
  curriculumMapId: 'health-pe-stage1-school-activity-space-resources',
  sourceId: 'health-physical-education',
  curriculumCodes: Object.freeze(['Cb-Ⅰ-3', '4c-Ⅰ-1']),
  curriculumScope: '第一學習階段局部參照；閱讀示意圖例是候選教學設計，不是官方指定方法，也未指定二年級學期。數位辨識不代表學生能辨認或使用真實校園場地。',
  learningObjective: Object.freeze({
    objectiveId: 'LO-G2-HPE-SCHOOL-ACTIVITY-MAP-01',
    statement: '依簡化示意圖與圖例，辨認不同活動對應的區域。',
    status: candidateStatus,
  }),
  instructions: '看示意地圖和圖例，找出活動對應的區域。',
  learningSubitemClaims: Object.freeze([]),
  stages: Object.freeze([
    Object.freeze({
      stageId: 'locate-jump-rope-activity-space',
      interaction: 'choose_response',
      prompt: '小安要找跳繩區。依圖例，北側左邊是哪一個活動區？',
      context: Object.freeze([
        Object.freeze({ speaker: '圖例', text: '◎：跳繩區；●：傳球區；→：通行道。' }),
        Object.freeze({ speaker: '示意地圖', text: '北側由左到右是 ◎、●、→。' }),
        Object.freeze({ speaker: '提醒', text: '這是示意地圖，不是真實學校場地。' }),
      ]),
      studentOperationGuidance: '怎麼玩：看地圖上的符號，選一個答案，再檢查答案。',
      options: Object.freeze([
        Object.freeze({ id: 'jump-rope-zone', text: '跳繩區' }),
        Object.freeze({ id: 'passing-zone', text: '傳球區' }),
        Object.freeze({ id: 'walkway', text: '通行道' }),
      ]),
      correctOptionIds: Object.freeze(['jump-rope-zone']),
      hints: Object.freeze([
        '先看北側左邊的符號，再對照圖例。',
        '找找圖例中哪個符號代表跳繩區。',
      ]),
      incorrectFeedback: '再把北側左邊的符號和圖例逐一對照。',
      correctFeedback: '你用圖例找到跳繩區了。真實場地要依學校標示和老師指引。',
      teacherLimitationNote: teacherLimitation,
    }),
    Object.freeze({
      stageId: 'locate-passing-activity-space',
      interaction: 'choose_response',
      prompt: '小安要找傳球區。依圖例，傳球區在哪一個位置？',
      context: Object.freeze([
        Object.freeze({ speaker: '圖例', text: '◎：跳繩區；●：傳球區；→：通行道。' }),
        Object.freeze({ speaker: '示意地圖', text: '北側由左到右是 ◎、●、→。' }),
        Object.freeze({ speaker: '提醒', text: '這是示意地圖，不是真實學校場地。' }),
      ]),
      studentOperationGuidance: '怎麼玩：看地圖上的符號，選一個答案，再檢查答案。',
      options: Object.freeze([
        Object.freeze({ id: 'north-left', text: '北側左邊' }),
        Object.freeze({ id: 'north-middle', text: '北側中間' }),
        Object.freeze({ id: 'north-right', text: '北側右邊' }),
      ]),
      correctOptionIds: Object.freeze(['north-middle']),
      hints: Object.freeze([
        '先找出代表傳球區的符號。',
        '在地圖上找出這個符號，再看它的位置。',
      ]),
      incorrectFeedback: '再找一次代表傳球區的符號，看看它在地圖哪個位置。',
      correctFeedback: '你用圖例找到傳球區了。真實場地要依學校標示和老師指引。',
      teacherLimitationNote: teacherLimitation,
    }),
  ]),
  reinforcementActivityIds: Object.freeze([]),
  reinforcementStatus: '尚無連結的補強活動',
  evidencePolicy: Object.freeze({ persistence: 'memory_only_no_student_records_no_localStorage', completionIsMastery: false, hintAssistedResponseIsIndependentEvidence: false }),
  teacherReview: Object.freeze({ status: 'pending_teacher_review', evidenceStatus: 'partial', reviewer: null, reviewedAt: null }),
  openQuestions: Object.freeze([
    '教師需確認校園活動空間名稱與示意圖例符合班級理解；示意圖不代表本校真實配置。',
    '第一學習階段涵蓋一、二年級；二年級教材與授課進度尚待確認。',
    '螢幕選答不能代替學生在真實校園辨認或使用活動空間。',
  ]),
});

export const GRADE2_HPE_EXPANSION_ACTIVITIES = Object.freeze([warmupSequence, schoolActivityMap]);
