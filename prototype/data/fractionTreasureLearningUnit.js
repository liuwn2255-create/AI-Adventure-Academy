/**
 * Candidate-only same-denominator fraction activity.
 * Original prototype content; not copied from a textbook or approved assessment.
 */
const option = (optionId, text, errorType = null) => Object.freeze({ optionId, text, errorType });

function stripModel(label, numerator, denominator, wholeId) {
  return Object.freeze({
    label,
    wholeId,
    wholeLengthUnits: 12,
    denominator,
    partLengthUnits: 12 / denominator,
    numerator,
    parts: Object.freeze(Array.from({ length: denominator }, (_, index) => index < numerator)),
  });
}

function question({ id, prompt, options, answerId, answerValue, explanation, capability, prerequisiteNote, hints, wrongGuidance, errorTypes, visualization = null }) {
  return Object.freeze({
    id,
    prompt,
    options: Object.freeze(options.map(([optionId, text, errorType]) => option(optionId, text, errorType))),
    answerId,
    answerValue,
    explanation,
    capability,
    prerequisiteNote,
    hints: Object.freeze(hints),
    wrongGuidance,
    errorTypes: Object.freeze(errorTypes),
    ...(visualization ? { visualization: Object.freeze(visualization) } : {}),
  });
}

const q3Models = Object.freeze([
  stripModel('甲', 2, 6, 'same-whole-q3'),
  stripModel('乙', 4, 6, 'same-whole-q3'),
]);
const q5Models = Object.freeze([
  stripModel('小芸吃下的部分', 2, 7, 'same-whole-chocolate-q5'),
  stripModel('小安吃下的部分', 5, 7, 'same-whole-chocolate-q5'),
]);

export const FRACTION_TREASURE_LEARNING_UNIT = Object.freeze({
  learningUnitId: 'learning-unit:chapter-scope-m3-math-common-denominator-fractions',
  revision: 1,
  activityId: 'ACT-M3-FRACTION-TREASURE-SAME-DENOMINATOR-CANDIDATE',
  levelId: 'math-fraction-treasure-same-denominator-candidate',
  title: '分數寶藏島：同分母分數探險',
  status: 'candidate_pending_teacher_review',
  formalAssessment: false,
  curriculumReviewStatus: 'pending_teacher_review',
  learningGoals: Object.freeze([
    '候選方向：以同一個平均分割的連續圖形，辨認分數表示的部分。',
    '候選方向：在分母相同且整體相同的情況下，透過單位分數數量比較大小。',
    '本試作沒有同分母分數加減、結果超過 1、分數應用解題或正式學習檢核。',
  ]),
  introduction: '沿著等分圖形找出分數線索，再比較同樣大小的整體。這是待教師審查的候選互動原型，不是正式題庫或學習成效檢核。',
  curriculumReferences: Object.freeze({
    sourceId: 'mathematics',
    curriculumMapId: 'math-grade3-n-3-9-common-denominator-fractions',
    learningContentCode: 'N-3-9',
    stagePerformanceCode: 'n-II-6',
    officialSourceUrl: 'https://www.naer.edu.tw/upload/1/16/doc/815/%E5%8D%81%E4%BA%8C%E5%B9%B4%E5%9C%8B%E6%B0%91%E5%9F%BA%E6%9C%AC%E6%95%99%E8%82%B2%E8%AA%B2%E7%B6%B1%E8%A6%81%E5%9C%8B%E6%B0%91%E4%B8%AD%E5%B0%8F%E5%AD%B8%E6%9A%A8%E6%99%AE%E9%80%9A%E5%9E%8B%E9%AB%98%E7%B4%9A%E4%B8%AD%E7%AD%89%E5%AD%B8%E6%A0%A1-%E6%95%B8%E5%AD%B8%E9%A0%98%E5%9F%9F.pdf',
    officialSourceLocation: '伍／二／三年級學習內容表，官方 PDF 頁序 P26：N-3-9 對應欄 n-II-6；第二學習階段表現表另列 n-II-6。',
    verifiedOfficialScope: 'N-3-9：簡單同分母分數，結合操作活動與整數經驗；含比較、加、減的意義，所涉分數及結果皆不超過 2，以點數單位分數為基礎並連結整數比較、加減，認識「和等於 1」的意義。官方備註限制分數術語及帶分數教學，初步應用以連續量為主。',
    performanceScopeBoundary: 'n-II-6 是第二學習階段（三、四年級）表現，不可當作三年級學期順序；其表現條文亦含其他年級內容。',
    alignmentBoundary: '本候選活動僅試作分數圖示讀取、分子／分母在模型中的角色及同分母比較；沒有加減或和等於 1 的題目，不代表完整涵蓋 N-3-9。年級適切性、授課順序、教材版本及班級先備待教師確認。',
    gradeAndScheduleStatus: 'grade_content_listed_annual_and_class_schedule_pending_teacher_review',
  }),
  questions: Object.freeze([
    question({
      id: 'FRACTION-DRAFT-M3-N39-01',
      prompt: '這條一樣大小的寶藏帶平均分成幾份，其中有斜線的部分可以記成哪個分數？',
      options: [['fraction-01-3-5', '3/5'], ['fraction-01-2-5', '2/5', 'selected_part_count_confusion'], ['fraction-01-3-4', '3/4', 'total_equal_parts_confusion']],
      answerId: 'fraction-01-3-5',
      answerValue: Object.freeze({ numerator: 3, denominator: 5 }),
      explanation: '整體平均分成 5 個一樣大的部分，斜線部分有 3 個，所以記作 3/5。',
      capability: '從一個等分的連續圖形讀出被選取部分的分數記號。',
      prerequisiteNote: '需教師確認學生已有「一個整體平均分成等大部分」及分數上下位置的初步經驗；本題只描述圖像，不代表分數術語已教。',
      hints: ['先看完整寶藏帶平均分成幾個一樣大的部分，再看有斜線的部分。', '分數的分母記錄整體分成的等份數，分子記錄被選取的等份數。'],
      wrongGuidance: '請先分開數「全部等份」和「有斜線的等份」，再對照分數的上下位置。作答選項只是待觀察線索，不能單次診斷錯誤原因。',
      errorTypes: { 'fraction-01-2-5': 'selected_part_count_confusion', 'fraction-01-3-4': 'total_equal_parts_confusion' },
      visualization: { type: 'fraction_strips', models: Object.freeze([stripModel('寶藏帶', 3, 5, 'single-whole-q1')]) },
    }),
    question({
      id: 'FRACTION-DRAFT-M3-N39-02',
      prompt: '圖中的斜線部分記作 2/6。分數記號下面的 6 表示什麼？',
      options: [['fraction-02-shaded', '有斜線的部分有幾個', 'numerator_denominator_roles_confused'], ['fraction-02-total', '整體平均分成幾個相等部分'], ['fraction-02-unshaded', '沒有斜線的部分有幾個', 'unshaded_count_used']],
      answerId: 'fraction-02-total',
      answerValue: 6,
      explanation: '分母在分數記號的下面，表示一個整體平均分成的相等部分總數。圖中是 6 等份；有斜線的部分數是另一個資訊。',
      capability: '在等分連續模型中辨認分母代表整體的等份總數。',
      prerequisiteNote: '需教師確認學生理解分數記號的上下位置；題面沒有要求分數運算。',
      hints: ['先注意題目問的是整個圖形的分割方式，還是有斜線部分的數量。', '分別數出整條圖形的等份總數和斜線部分數，再判斷題目問的是哪一種數量。'],
      wrongGuidance: '回到整條圖形，分別數總共有幾個等大格，以及其中幾格有斜線；再想分母記錄哪一種數量。單次錯答不足以確認概念困難。',
      errorTypes: { 'fraction-02-shaded': 'numerator_denominator_roles_confused', 'fraction-02-unshaded': 'unshaded_count_used' },
      visualization: { type: 'fraction_strips', models: Object.freeze([stripModel('整體圖形', 2, 6, 'single-whole-q2')]) },
    }),
    question({
      id: 'FRACTION-DRAFT-M3-N39-03',
      prompt: '甲、乙兩條一樣長的寶藏帶都平均分成相同數目的等份。哪一條斜線部分比較多？',
      options: [['fraction-03-a', '甲比較多', 'comparison_selected_parts_uncounted'], ['fraction-03-b', '乙比較多'], ['fraction-03-same', '一樣多', 'comparison_same_count_assumed']],
      answerId: 'fraction-03-b',
      answerValue: '乙',
      explanation: '兩條寶藏帶的整體一樣長，並且都分成 6 個相等部分。甲有 2 個、乙有 4 個同樣大小的部分被選取，因此乙表示的量較多。',
      capability: '以相同整體、相同分母的圖像模型比較分數所表示的量。',
      prerequisiteNote: '需教師確認學生能辨認兩個整體大小相同、分割等大且分母相同；此題同時要求圖像比較。',
      hints: ['先確認兩條寶藏帶的整體大小和分割方式是否相同。', '每一格代表同樣大小的一份；分別數有斜線的格子，再比較數量。'],
      wrongGuidance: '先核對兩條帶子是不是同樣長、每份是不是一樣大，再分別數斜線格。選錯可能與看圖或點數有關，需觀察學生過程再判斷。',
      errorTypes: { 'fraction-03-a': 'comparison_selected_parts_uncounted', 'fraction-03-same': 'comparison_same_count_assumed' },
      visualization: { type: 'fraction_strips', models: q3Models },
    }),
    question({
      id: 'FRACTION-DRAFT-M3-N39-04',
      prompt: '比較 3/8 和 5/8：3/8 □ 5/8，方框裡應放哪個符號？',
      options: [['fraction-04-less', '<'], ['fraction-04-equal', '=', 'numerators_assumed_equal'], ['fraction-04-greater', '>', 'comparison_order_reversed']],
      answerId: 'fraction-04-less',
      answerValue: '<',
      explanation: '兩個分數的分母都是 8，表示每一份大小相同。3/8 有 3 個這樣的部分，5/8 有 5 個，因此 3/8 比 5/8 小。',
      capability: '將等分圖像中同分母比較的想法轉用到分數符號表示。',
      prerequisiteNote: '需確認學生能讀分數記號及理解比較符號；未使用圖像支援，與前題相比支架較少，難度順序待教師確認。',
      hints: ['先看看兩個分數是不是把整體分成相同份數。', '若每份大小相同，再比較各自有幾份；最後確認符號尖端指向較小的一側。'],
      wrongGuidance: '請先比較兩個分數各自的等份數，再確認比較符號的方向。若讀不懂符號或分數記號，也可能影響作答，請教師觀察後再判斷。',
      errorTypes: { 'fraction-04-equal': 'numerators_assumed_equal', 'fraction-04-greater': 'comparison_order_reversed' },
    }),
    question({
      id: 'FRACTION-DRAFT-M3-N39-05',
      prompt: '兩條一樣大的巧克力棒都平均分成 7 份。小芸吃了 2/7，小安吃了 5/7，誰吃下的巧克力比較多？',
      options: [['fraction-05-yun', '小芸', 'comparison_selected_parts_uncounted'], ['fraction-05-an', '小安'], ['fraction-05-same', '一樣多', 'comparison_same_count_assumed']],
      answerId: 'fraction-05-an',
      answerValue: '小安',
      explanation: '兩條巧克力棒一樣大，且都平均分成 7 份，所以每份一樣大。小芸吃 2 份，小安吃 5 份；5 個同樣大小的部分比 2 個多。',
      capability: '在連續量生活情境中，依相同整體、相同分母比較所表示的量。',
      prerequisiteNote: '需確認學生能理解「吃下的部分」對應圖示、兩根巧克力棒大小相同及分數比較；此候選題不要求計算。',
      hints: ['先確認兩條巧克力棒是不是一樣大，而且都平均分成相同份數。', '當每一份一樣大時，可以比較兩人各取了幾份；再回到題目中的兩個名字。'],
      wrongGuidance: '請將分數中的份數和題目人物對照，並確認兩個整體與每一份都相同。作答結果是候選線索，不足以單獨判斷理解原因。',
      errorTypes: { 'fraction-05-yun': 'comparison_selected_parts_uncounted', 'fraction-05-same': 'comparison_same_count_assumed' },
      visualization: { type: 'fraction_strips', models: q5Models },
    }),
  ]),
  hintPolicy: 'per_question',
  remediationPolicy: 'not_provided',
  evidenceType: 'candidate_activity_response_only',
  reinforcementActivities: Object.freeze([]),
  missingCoverage: Object.freeze([
    '同分母分數加法、減法及和／差結果範圍（本候選未設計）。',
    '「和等於 1」的意義（本候選未設計）。',
    '不同分母分數比較、等值分數及分數與小數互換（不在本候選範圍）。',
    '正式獨立學習檢核、教師審定通過條件及學生學習成效證據。',
  ]),
});

export function validateFractionTreasureLearningUnit(unit = FRACTION_TREASURE_LEARNING_UNIT) {
  const errors = [];
  if (unit.status !== 'candidate_pending_teacher_review' || unit.formalAssessment !== false) errors.push('fraction_unit_must_remain_candidate');
  if (unit.curriculumReferences?.learningContentCode !== 'N-3-9' || unit.curriculumReferences?.stagePerformanceCode !== 'n-II-6') errors.push('fraction_curriculum_reference_mismatch');
  if (unit.questions.length < 4 || unit.questions.length > 6) errors.push('fraction_question_count_out_of_range');
  const ids = unit.questions.map(({ id }) => id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !id.startsWith('FRACTION-DRAFT-M3-N39-'))) errors.push('fraction_question_ids_invalid_or_duplicate');
  for (const q of unit.questions) {
    const optionIds = q.options.map(({ optionId }) => optionId);
    if (new Set(optionIds).size !== optionIds.length || q.options.filter(({ optionId }) => optionId === q.answerId).length !== 1) errors.push(`fraction_question_options_or_answer_invalid:${q.id}`);
    if (!q.explanation || !q.capability || !q.prerequisiteNote || !q.wrongGuidance || q.hints?.length !== 2) errors.push(`fraction_question_required_data_missing:${q.id}`);
    if (q.visualization?.type === 'fraction_strips') {
      const models = q.visualization.models ?? [];
      if (!models.length) errors.push(`fraction_visual_models_missing:${q.id}`);
      for (const model of models) {
        if (!Number.isInteger(model.denominator) || model.denominator < 2 || model.parts.length !== model.denominator) errors.push(`fraction_partition_count_invalid:${q.id}`);
        if (model.partLengthUnits !== model.wholeLengthUnits / model.denominator) errors.push(`fraction_partition_sizes_invalid:${q.id}`);
        if (model.parts.filter(Boolean).length !== model.numerator || model.numerator <= 0 || model.numerator > model.denominator) errors.push(`fraction_shading_mismatch:${q.id}`);
        if (!model.wholeId || !Number.isFinite(model.wholeLengthUnits)) errors.push(`fraction_whole_identity_missing:${q.id}`);
      }
      if (models.length > 1 && models.some((model) => model.wholeId !== models[0].wholeId || model.wholeLengthUnits !== models[0].wholeLengthUnits)) errors.push(`fraction_comparison_wholes_not_equal:${q.id}`);
    }
    if (q.id.endsWith('-03') && q.answerValue !== (q.visualization.models[1].numerator > q.visualization.models[0].numerator ? '乙' : '甲')) errors.push('fraction_visual_comparison_answer_mismatch');
  }
  if (unit.reinforcementActivities?.length || unit.remediationPolicy !== 'not_provided') errors.push('fraction_remediation_must_not_be_claimed');
  return errors;
}
