import { numberSecretChallenge } from './numberSecretQuestions.js';

const makeOptions = (prefix, texts, answerIndex, errorTypes) => texts.map((text, index) => Object.freeze({
  optionId: `${prefix}-${String.fromCharCode(97 + index)}`,
  text,
  errorType: index === answerIndex ? null : errorTypes[index],
}));

export const NUMBER_SECRET_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:chapter-scope-m3-math-number-place-value',
  revision: 1,
  formalUnitRef: Object.freeze({ unitId: 'M3-NUM-01', unitRevision: 1, status: 'candidate' }),
  activityId: 'ACT-M3-NUM-PLACE-VALUE-LEARNING-UNIT-PROTOTYPE',
  status: 'candidate_pending_teacher_review',
  curriculum: Object.freeze({
    curriculumMapIds: Object.freeze(['math-number-place-value-m3-num-01']),
    codes: Object.freeze(['N-3-1', 'n-II-1']),
    sourceId: 'mathematics',
    note: '沿用專案既有追溯資料；不是本模組重新核實官方條文、教材進度或教師審查。',
  }),
  scheduleAndEvidence: Object.freeze({
    semesterId: null,
    semesterStatus: 'pending_school_and_textbook_evidence',
    textbookEvidence: Object.freeze([]),
    classroomTeachingRecords: Object.freeze([]),
    prerequisites: Object.freeze({ status: 'not_assessed', items: Object.freeze([]) }),
    teacherReview: Object.freeze({ status: 'pending_review', records: Object.freeze([]) }),
    missingEvidence: Object.freeze(['三年級年級／學期適切性', '教材版次、冊別、單元與頁次', '實際班級授課與先備能力', '課程專業人員對補強及檢核內容的審查']),
  }),
  learningDirections: Object.freeze([
    Object.freeze({ id: 'quantity-number-link', title: '數字與數量的關係', status: 'candidate_practice_coverage_pending_teacher_review' }),
    Object.freeze({ id: 'thousands-place-value', title: '千位數的位值意義', status: 'candidate_practice_coverage_pending_teacher_review' }),
    Object.freeze({ id: 'number-composition', title: '數字的組成與拆解', status: 'partial_candidate_coverage' }),
    Object.freeze({ id: 'equivalent-representations', title: '以不同方式表示同一個數', status: 'not_assessed' }),
    Object.freeze({ id: 'zero-placeholder', title: '0 作為佔位符的理解', status: 'pending_teacher_scope_review' }),
    Object.freeze({ id: 'transfer', title: '將概念應用於新情境', status: 'candidate_check_only_not_validated' }),
  ]),
  lessonSteps: Object.freeze([
    Object.freeze({ title: '一個千', text: '1 個千表示 1,000。', visualThousands: 1 }),
    Object.freeze({ title: '三個千', text: '3 個千合起來是 3,000。', visualThousands: 3 }),
    Object.freeze({ title: '看數字位置', text: '在 3,000 中，3 在千位，表示 3 個千。', visualThousands: 3 }),
  ]),
  practiceQuestions: Object.freeze([...numberSecretChallenge.questions.map((question, index) => Object.freeze({
    ...question,
    evidenceType: 'candidate_practice_only',
    errorTypes: Object.freeze(index === 0
      ? { 'secret-01-b': 'place_value_shift', 'secret-01-c': 'place_value_shift' }
      : index === 1
        ? { 'secret-02-a': 'thousands_quantity_mismatch', 'secret-02-c': 'thousands_quantity_mismatch' }
        : { 'secret-03-a': 'composition_place_value_confusion', 'secret-03-c': 'composition_place_value_confusion' }),
    hint: index === 0
      ? '先找出數字 3 所在的位置，再想這個位置代表幾個千。'
      : index === 1
        ? '把每一個千看成 1,000，再合起來。'
        : '把 2,000 和 500 分開看：500 是幾個百？',
    errorExplanations: Object.freeze(index === 0
      ? { place_value_shift: '這次把千位和其他位值混在一起了。先從數字右邊找個位，再往左找千位。' }
      : index === 1
        ? { thousands_quantity_mismatch: '答案可能少算或多算了一個位值單位。每一個千都是 1,000，請數四組。' }
        : { composition_place_value_confusion: '合成時要把 2,000 和 500 都保留下來；500 是五個百。這個加法範圍仍待教師審查。' }),
  })), Object.freeze({
    id: 'DRAFT-M3-NUM-01-01',
    draftVariant: 'alternative-2468-block-guided-practice',
    status: 'candidate_pending_teacher_review',
    isIndependentCheck: false,
    evidenceType: 'candidate_guided_practice_only',
    prompt: '觀察四組積木，選出它們合起來表示的數。',
    options: makeOptions('pv-blocks-2468', ['2,468', '2,648', '2,486', '2,864'], 0, [null, 'possible_place_value_block_mapping', 'possible_place_value_block_mapping', 'possible_place_value_block_mapping']),
    answerId: 'pv-blocks-2468-a',
    explanation: '依序看千位、百位、十位、個位：各欄積木數是 2、4、6、8，所以數字依序寫成 2,468。',
    hint: '先依序查看「千、百、十、個」四欄，再比較每一欄的積木組數。',
    errorTypes: Object.freeze({
      'pv-blocks-2468-b': 'possible_place_value_block_mapping',
      'pv-blocks-2468-c': 'possible_place_value_block_mapping',
      'pv-blocks-2468-d': 'possible_place_value_block_mapping',
    }),
    errorExplanations: Object.freeze({
      possible_place_value_block_mapping: '這個選擇和積木分組提供的線索不一致。單次選擇不能判定原因；請再依序查看每組形狀、組數和位值欄。',
    }),
    prerequisites: Object.freeze({
      status: 'pending_teacher_confirmation',
      items: Object.freeze(['認識千、百、十、個的名稱與排列順序', '能辨認圖像中的積木分組']),
    }),
    visualization: Object.freeze({
      type: 'base_ten_place_value_blocks',
      status: 'candidate_visualization_pending_teacher_review',
      groups: Object.freeze([
        Object.freeze({ place: 'thousands', label: '千位', unitLabel: '個千積木', quantity: 2, shape: 'thousand-cube' }),
        Object.freeze({ place: 'hundreds', label: '百位', unitLabel: '個百積木', quantity: 4, shape: 'hundred-flat' }),
        Object.freeze({ place: 'tens', label: '十位', unitLabel: '根十積木', quantity: 6, shape: 'ten-rod' }),
        Object.freeze({ place: 'ones', label: '個位', unitLabel: '個小方塊', quantity: 8, shape: 'one-cube' }),
      ]),
      table: Object.freeze({
        status: 'teaching_scaffold_not_independent_check',
        providesAnswerDigits: true,
        columns: Object.freeze(['千位', '百位', '十位', '個位']),
        digits: Object.freeze([2, 4, 6, 8]),
      }),
      note: '位值表會把積木組數放入對應欄位，直接呈現答案數字；僅作引導教學支架，不作獨立檢核或精熟證據。',
    }),
  })]),
  reinforcementActivities: Object.freeze([
    Object.freeze({
      activityId: 'ACT-M3-NUM-PLACE-VALUE-BLOCKS-REINFORCEMENT',
      questionId: 'REMED-M3-NUM-PV-POSITION-01',
      errorType: 'place_value_shift', title: '找出千位', prompt: '在 3,000 中，數字 3 在哪一位？',
      options: makeOptions('rem-position', ['千位', '百位', '十位'], 0, [null, 'place_value_shift', 'place_value_shift']),
      answerId: 'rem-position-a', explanation: '3 在千位，所以表示 3 個千。',
      hint: '從右邊數：個位、十位、百位、千位。',
    }),
    Object.freeze({
      activityId: 'ACT-M3-NUM-PLACE-VALUE-THOUSAND-GROUPS-REINFORCEMENT',
      questionId: 'REMED-M3-NUM-PV-QUANTITY-01',
      errorType: 'thousands_quantity_mismatch', title: '數一數千積木', prompt: '4 組「1,000」合起來是多少？',
      options: makeOptions('rem-quantity', ['400', '4,000', '40,000'], 1, ['thousands_quantity_mismatch', null, 'thousands_quantity_mismatch']),
      answerId: 'rem-quantity-b', explanation: '四組 1,000 合起來是 4,000。',
      hint: '將 1,000 加四次：1,000＋1,000＋1,000＋1,000。',
    }),
    Object.freeze({
      activityId: 'ACT-M3-NUM-PLACE-VALUE-COMPOSITION-REINFORCEMENT',
      questionId: 'REMED-M3-NUM-PV-COMPOSITION-01',
      errorType: 'composition_place_value_confusion', title: '分開再合起來', prompt: '2,000 和 500 合起來是多少？',
      options: makeOptions('rem-composition', ['2,050', '2,500', '7,000'], 1, ['composition_place_value_confusion', null, 'composition_place_value_confusion']),
      answerId: 'rem-composition-b', explanation: '2,000 加上 500，得到 2,500。此補強內容仍待教師確認範圍。',
      hint: '先保留 2 個千，再加上 5 個百。',
    }),
    Object.freeze({
      activityId: 'ACT-M3-NUM-PLACE-VALUE-BLOCK-MAPPING-REINFORCEMENT',
      questionId: 'REMED-M3-NUM-PV-BLOCK-MAPPING-01',
      errorType: 'possible_place_value_block_mapping',
      title: '把積木放回位值欄（候選補強）',
      prompt: '這組有 6 根十積木。要把「十積木的組數」記在哪一欄？',
      options: makeOptions('rem-block-map', ['百位', '十位', '個位'], 1, ['possible_place_value_block_mapping', null, 'possible_place_value_block_mapping']),
      answerId: 'rem-block-map-b',
      explanation: '十積木的組數記在十位欄。這是一次候選補強練習，不能單靠一次作答判定學生的理解。',
      hint: '先想一想這種積木代表的單位，再逐一觀察位值表各欄，找出兩者的對應關係。',
      visualization: Object.freeze({
        type: 'base_ten_place_value_blocks',
        status: 'candidate_visualization_pending_teacher_review',
        groups: Object.freeze([
          Object.freeze({ place: 'tens', label: '待分類積木', unitLabel: '根十積木', quantity: 6, shape: 'ten-rod' }),
        ]),
        note: '這是候選補強視覺，不是正式課程內容。',
      }),
    }),
  ]),
  candidateCheckQuestions: Object.freeze([
    Object.freeze({
      id: 'CAND-CHECK-M3-NUM-01-01', prompt: '在 5,000 中，數字 5 表示幾個千？',
      options: makeOptions('cand-check-01', ['5 個千', '5 個百', '5 個十'], 0, [null, 'place_value_shift', 'place_value_shift']),
      answerId: 'cand-check-01-a', explanation: '5 在千位，表示 5 個千。',
      scopeNote: '新數值範例僅為檢核設計候選，未經教師審查。',
    }),
    Object.freeze({
      id: 'CAND-CHECK-M3-NUM-01-02', prompt: '6 個千合起來是多少？',
      options: makeOptions('cand-check-02', ['600', '6,000', '60,000'], 1, ['thousands_quantity_mismatch', null, 'thousands_quantity_mismatch']),
      answerId: 'cand-check-02-b', explanation: '6 個千是 6,000。',
      scopeNote: '數量連結的獨立情境候選，年級適切性待教師確認。',
    }),
    Object.freeze({
      id: 'CAND-CHECK-M3-NUM-01-03', prompt: '3,000 加上 200 是多少？',
      options: makeOptions('cand-check-03', ['3,020', '3,200', '5,000'], 1, ['composition_place_value_confusion', null, 'composition_place_value_confusion']),
      answerId: 'cand-check-03-b', explanation: '3,000 加上 200，得到 3,200。',
      scopeNote: '涉及數量合成／加法；課綱對應及教材進度待專業審查。',
    }),
  ]),
  boundaries: Object.freeze({
    formalQuestionSet: false,
    formalLearningCheckApproved: false,
    studentRecordsCreated: false,
    objectiveAchievement: 'not_assessed',
    checkPass: 'candidate_check_result_only',
  }),
});

// Isolated v2 candidate set. It is intentionally separate from the existing
// candidateCheckQuestions and is only opened through an explicit prototype entry.
const makeV2Options = (prefix, texts, answerIndex, errorType) => texts.map((text, index) => Object.freeze({
  optionId: `${prefix}-${String.fromCharCode(97 + index)}`,
  text,
  errorType: index === answerIndex ? null : errorType,
}));

export const NUMBER_SECRET_V2_CANDIDATE_SET = Object.freeze({
  checkSetId: 'CHECKSET-DRAFT-M3-NUM-01-V2-PILOT',
  revision: 2,
  activityId: 'ACT-DRAFT-M3-NUM-01-V2-CANDIDATE-CHECK',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  questions: Object.freeze([
    Object.freeze({
      draftId: 'V2-DRAFT-M3-NUM-01-01',
      status: 'candidate_pending_teacher_review',
      prompt: '在 4,372 中，數字 7 在哪一位？',
      options: Object.freeze(makeV2Options('v2-draft-01', ['個位', '十位', '百位', '千位'], 1, 'possible_place_name_confusion')),
      answerId: 'v2-draft-01-b',
      explanation: '從右往左依序是個位、十位、百位、千位，因此 7 在十位。',
      hints: Object.freeze(['從數字最右邊開始找位名，不要只看數字 7 本身。', '從右往左依序對照個位、十位、百位、千位，再定位 7。']),
      wrongGuidance: '請從最右邊開始逐位對照位名，再找出 7 所在的位置。錯答只作為待驗證線索，不能單次判定原因。',
      errorTypes: Object.freeze({
        'v2-draft-01-a': 'possible_place_name_confusion',
        'v2-draft-01-c': 'possible_place_name_confusion',
        'v2-draft-01-d': 'possible_place_name_confusion',
      }),
    }),
    Object.freeze({
      draftId: 'V2-DRAFT-M3-NUM-01-02',
      status: 'candidate_pending_teacher_review',
      prompt: '在 5,284 中，數字 8 代表多少？',
      options: Object.freeze(makeV2Options('v2-draft-02', ['8', '80', '800', '8,000'], 1, 'possible_place_value_quantity_confusion')),
      answerId: 'v2-draft-02-b',
      explanation: '8 位於十位，每個十代表 10，所以 8 個十是 80。',
      hints: Object.freeze(['先找出 8 在數字中的位置，再想該位置每一個數字代表什麼單位。', '8 在千、百、十、個的哪一欄？該欄每一個單位代表多少？']),
      wrongGuidance: '請先定位 8 的位名，再把「8 個該位單位」連到數量。單次錯答不代表已確診理解困難。',
      errorTypes: Object.freeze({
        'v2-draft-02-a': 'possible_place_value_quantity_confusion',
        'v2-draft-02-c': 'possible_place_value_quantity_confusion',
        'v2-draft-02-d': 'possible_place_value_quantity_confusion',
      }),
    }),
  ]),
  // Q3 is shown only as a non-interactive preview until a teacher confirms
  // the class has learned to read this place-value table representation.
  deferredQuestions: Object.freeze([
    Object.freeze({
      draftId: 'V2-DRAFT-M3-NUM-01-03',
      status: 'disabled_pending_teacher_confirmation',
      enabled: false,
      prompt: '看位值表，選出它表示的數。',
      table: Object.freeze({
        caption: '候選題面：位值表（尚未啟用）',
        columns: Object.freeze(['千位', '百位', '十位', '個位']),
        digits: Object.freeze([3, 1, 4, 2]),
      }),
      options: Object.freeze(makeV2Options('v2-draft-03', ['3,124', '3,142', '3,412', '1,342'], 1, 'possible_place_value_table_reading_confusion')),
      answerId: 'v2-draft-03-b',
      explanation: '依千、百、十、個的順序，把 3、1、4、2 寫成 3,142。',
      prerequisiteStatus: 'pending_teacher_confirmation',
      prerequisiteNote: '教師須先確認目標班級已學讀取位值表、四位數書寫順序，並審查此表格形式及題目用語。',
    }),
  ]),
  disabledConditionalQuestions: Object.freeze([
    Object.freeze({
      draftId: 'V2-DRAFT-M3-NUM-01-04',
      status: 'disabled_pending_teacher_approval',
      enabled: false,
      prerequisiteStatus: 'pending_teacher_confirmation',
      requiredTeacherEvidence: Object.freeze([
        '教材或實際教學紀錄證明已教四位數展開表示',
        '教材或實際教學紀錄證明已教本題所需加法／數量合成',
        '教師決定評量等值表示與加法能力的界線及評分方式',
        '教師完成題目審查並留下審查者、日期、結論與依據',
      ]),
      note: '條件未全部完成前，不得呈現為可作答題目或納入試用題組。',
    }),
  ]),
});
