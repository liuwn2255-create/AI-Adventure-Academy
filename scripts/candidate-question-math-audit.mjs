import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE } from '../prototype/data/teacherReviewCatalog.js';
import { ACCEPTANCE_EVIDENCE_OUTPUT } from './acceptance-evidence.mjs';
import { validateAcceptanceEvidenceReport } from '../prototype/acceptanceEvidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACTIVITY_FILES = Object.freeze({
  'ACT-M3-NUM-PLACE-VALUE-LEARNING-UNIT-PROTOTYPE': 'prototype/data/numberSecretLearningUnit.js',
  'ACT-M3-NUMBER-COMPARISON-CANDIDATE-PRACTICE': 'prototype/data/numberComparisonLearningUnit.js',
  'ACT-M3-CAPACITY-SCALE-READING-CANDIDATE': 'prototype/data/capacityReadingLearningUnit.js',
  'ACT-M3-INTEGER-NUMBER-LINE-CANDIDATE': 'prototype/data/integerNumberLineLearningUnit.js',
  'ACT-M3-MILLIMETER-RULER-CANDIDATE': 'prototype/data/millimeterRulerLearningUnit.js',
  'ACT-M3-WEIGHT-KG-G-CANDIDATE': 'prototype/data/weightKgGLearningUnit.js',
  'ACT-M3-AREA-SQUARE-CENTIMETER-CANDIDATE': 'prototype/data/squareCentimeterAreaLearningUnit.js',
  'ACT-M3-FRACTION-TREASURE-SAME-DENOMINATOR-CANDIDATE': 'prototype/data/fractionTreasureLearningUnit.js',
  'ACT-M3-ADD-SUB-VERTICAL-CANDIDATE': 'prototype/data/additionSubtractionLearningUnit.js',
});
const NO_TEACHER_REVIEW = '自動資料檢查不代替教師審查。';
const LIMITATION = '只驗證可由結構化題目資料獨立計算／推導的答案及表示一致性；不證明題意無歧義、實際圖像可讀、課綱適切、教學有效或學生精熟。圖像呈現、語句唯一性及先備仍待人工核驗。';

const normalize = (value) => String(value ?? '').replaceAll(',', '').replaceAll('，', '').replaceAll(/\s+/g, '').toLowerCase();
const parseNumericOption = (option) => {
  const match = String(option?.text ?? '').match(/(-?\d[\d,]*(?:\.\d+)?)\s*(平方公分|公分|毫米|公克|公斤|毫升)?/);
  return match ? { value: Number(match[1].replaceAll(',', '')), unit: match[2] ?? '' } : null;
};
const answerOption = (question) => question.options.find((option) => option.optionId === question.answerId) ?? null;

function optionMatching(question, expected, unit = '') {
  const wanted = normalize(`${expected}${unit}`);
  return question.options.find((option) => normalize(option.text) === wanted) ?? null;
}

function deriveNumberSecret(question) {
  const id = question.questionId;
  if (id === 'DRAFT-M3-NUM-01-01') {
    const visual = question.visualization;
    const places = { thousands: 1000, hundreds: 100, tens: 10, ones: 1 };
    const issues = [];
    if (!visual || visual.groups?.length !== 4) issues.push('須有千百十個四組積木資料。');
    const digits = {};
    for (const group of visual?.groups ?? []) {
      if (!places[group.place] || !Number.isInteger(group.quantity) || group.quantity < 0 || digits[group.place] !== undefined) issues.push(`位值積木組資料無效：${group.place}`);
      else digits[group.place] = group.quantity;
    }
    const value = Object.entries(places).reduce((sum, [place, factor]) => sum + (digits[place] ?? 0) * factor, 0);
    const table = visual?.table;
    if (table?.status !== 'teaching_scaffold_not_independent_check' || table?.providesAnswerDigits !== true) issues.push('位值表教學支架狀態不明。');
    if (JSON.stringify(table?.digits) !== JSON.stringify([digits.thousands, digits.hundreds, digits.tens, digits.ones])) issues.push('積木與位值表數字不一致。');
    return { expectedText: value.toLocaleString('en-US'), derivation: `各組数量按位值相乘後相加：${digits.thousands ?? '?'}×1000 + ${digits.hundreds ?? '?'}×100 + ${digits.tens ?? '?'}×10 + ${digits.ones ?? '?'} = ${value}。`, issues, answerable: true };
  }
  if (id === 'V2-DRAFT-M3-NUM-01-03') {
    const digits = question.visualization?.digits;
    const columns = question.visualization?.columns;
    const value = Array.isArray(digits) && digits.length === 4 ? Number(digits.join('')) : NaN;
    const issues = question.status === 'read_only_preview' || /預覽/.test(question.group) ? [] : ['位值表題未維持唯讀預覽。'];
    if (!Array.isArray(columns) || columns.join(',') !== '千位,百位,十位,個位') issues.push('位值表欄位次序缺失或錯誤。');
    return { expectedText: Number.isFinite(value) ? value.toLocaleString('en-US') : '', derivation: `按表格欄位次序拼接數字 ${Array.isArray(digits) ? digits.join('、') : '（缺資料）'}。`, issues, answerable: false, preview: true };
  }
  if (id === 'V2-DRAFT-M3-NUM-01-04') return { expectedText: '', derivation: '此設計標為停用；不作答案或得分核驗。', issues: question.options.length || question.answerId ? ['停用題不應有可作答選項或正解。'] : [], answerable: false, disabled: true };
  const thousandDigits = question.prompt.match(/(?:數字\s*)?(\d[\d,]*)/);
  const value = thousandDigits ? Number(thousandDigits[1].replaceAll(',', '')) : NaN;
  const normalizedPrompt = question.prompt.replaceAll(',', '');
  let expected;
  let derivation;
  if (/幾個千/.test(normalizedPrompt) && /在/.test(normalizedPrompt)) {
    const thousandsDigit = Math.floor(value / 1000) % 10;
    expected = `${thousandsDigit} 個千`;
    derivation = `${value} 的千位數字為 ${thousandsDigit}，因此表示 ${expected}。`;
  } else if (/個千合起來/.test(normalizedPrompt)) {
    const count = Number(question.prompt.match(/(\d+)\s*個千/)?.[1]);
    expected = (count * 1000).toLocaleString('en-US');
    derivation = `${count} 組 × 1,000/組 = ${count * 1000}。`;
  } else if (/合起來是多少/.test(normalizedPrompt)) {
    const nums = [...normalizedPrompt.matchAll(/\d+/g)].map((match) => Number(match[0]));
    expected = (nums[0] + nums[1]).toLocaleString('en-US');
    derivation = `${nums[0]} + ${nums[1]} = ${nums[0] + nums[1]}。`;
  } else if (/代表多少/.test(normalizedPrompt)) {
    const numberMatch = normalizedPrompt.match(/\d{4}/);
    const target = Number(normalizedPrompt.match(/數字\s*(\d)/)?.[1]);
    const n = Number(numberMatch?.[0]);
    const position = String(n).length - 1 - String(n).indexOf(String(target));
    const amount = target * (10 ** position);
    expected = amount.toLocaleString('en-US');
    derivation = `${n} 中數字 ${target} 位於 10^${position} 位，代表 ${target}×10^${position}=${amount}。`;
  } else if (/在哪一位/.test(normalizedPrompt)) {
    const n = Number(normalizedPrompt.match(/\d{4}/)?.[0]);
    const target = String(Number(normalizedPrompt.match(/數字\s*(\d)/)?.[1]));
    const position = String(n).length - 1 - String(n).indexOf(target);
    expected = ['個位', '十位', '百位', '千位'][position] ?? '';
    derivation = `${n} 從右數位序為個、十、百、千；數字 ${target} 位於 ${expected}。`;
  } else if (/加上/.test(normalizedPrompt)) {
    const nums = [...normalizedPrompt.matchAll(/\d[\d,]*/g)].map((match) => Number(match[0].replaceAll(',', '')));
    expected = (nums[0] + nums[1]).toLocaleString('en-US');
    derivation = `${nums[0]} + ${nums[1]} = ${nums[0] + nums[1]}。`;
  }
  return { expectedText: expected ?? '', derivation: derivation ?? '無法從題幹獨立推導。', issues: Number.isFinite(value) || expected ? [] : ['題幹未匹配可核驗的數值規則。'], answerable: true };
}

function deriveQuestion(activity, question) {
  const id = question.questionId;
  if (question.status === 'disabled' || /停用設計/.test(question.group)) return deriveNumberSecret(question);
  if (question.visualization?.type === 'base_ten_place_value_blocks' || id.startsWith('V2-DRAFT-M3-NUM-01-')) return deriveNumberSecret(question);
  if (activity.title === '千位數的秘密') return deriveNumberSecret(question);
  if (activity.title === '數的大小比較') {
    const numeric = question.options.map((option) => ({ option, parsed: parseNumericOption(option) })).filter((item) => item.parsed);
    const isSmaller = question.prompt.includes('比較小');
    numeric.sort((a, b) => isSmaller ? a.parsed.value - b.parsed.value : b.parsed.value - a.parsed.value);
    const expected = numeric[0]?.option;
    return { expectedText: expected?.text ?? '', derivation: `由選項數值獨立排序；選出${isSmaller ? '最小' : '最大'}值 ${numeric[0]?.parsed.value}。`, issues: numeric.length < 2 ? ['少於兩個可比較的數值選項。'] : [], answerable: true };
  }
  if (activity.title === '容量刻度判讀') {
    const visual = question.visualization;
    const issues = [];
    if (!visual || visual.waterMl < 0 || visual.waterMl > visual.capacityMl || visual.waterMl % visual.stepMl !== 0) issues.push('水量、容量或刻度間距資料不相容。');
    return { expectedText: `${visual?.waterMl ?? ''} 毫升`, derivation: `視覺化資料的水量 ${visual?.waterMl} mL；以刻度步長 ${visual?.stepMl} mL 驗證可對齊。`, issues, answerable: true };
  }
  if (activity.title === '整數數線定位') {
    const visual = question.visualization;
    const issues = [];
    if (!visual || visual.minorStep <= 0 || visual.end <= visual.start) issues.push('數線範圍或刻度間距無效。');
    for (const point of visual?.points ?? []) if (point.value < visual.start || point.value > visual.end || (point.value - visual.start) % visual.minorStep !== 0) issues.push(`標記 ${point.label} 未落在有效刻度。`);
    let expected;
    if (question.prompt.includes('最靠近 0')) {
      const point = [...visual.points].sort((a, b) => Math.abs(a.value) - Math.abs(b.value))[0];
      expected = question.options.find((option) => normalize(option.text) === normalize(point.label));
      return { expectedText: expected?.text ?? '', derivation: `依各標記到 0 的絕對距離排序，最近者為 ${point?.label}（${point?.value}）。`, issues, answerable: true };
    }
    const label = question.prompt.match(/標記\s*([A-Z])/i)?.[1]?.toUpperCase();
    const point = visual?.points.find((item) => item.label === label);
    expected = optionMatching(question, point?.value);
    return { expectedText: expected?.text ?? '', derivation: `起點 ${visual?.start} + ${((point?.value - visual?.start) / visual?.minorStep)} 格 × 每格 ${visual?.minorStep} = ${point?.value}。`, issues, answerable: true };
  }
  if (activity.title === '長度：毫米刻度') {
    const v = question.visualization;
    const length = v?.markMm - v?.startMm;
    const issues = [];
    if (!v || v.minorStepMm <= 0 || length < 0 || v.markMm > v.endMm || Math.abs(length / v.minorStepMm - Math.round(length / v.minorStepMm)) > 1e-8) issues.push('尺的範圍、起點、終點或小刻度設定無效。');
    return { expectedText: `${length} 毫米`, derivation: `端點位置 ${v?.markMm} mm − 起點 ${v?.startMm} mm = ${length} mm。`, issues, answerable: true };
  }
  if (activity.title === '重量：公克與公斤') {
    const nums = [...question.prompt.matchAll(/\d[\d,]*/g)].map((m) => Number(m[0].replaceAll(',', '')));
    if (id.endsWith('-01')) return { expectedText: `${nums[0]} 公克`, derivation: `題示 ${nums[0]} g；g 是公克，因此記錄數值為 ${nums[0]} 公克。`, issues: [], answerable: true };
    if (id.endsWith('-02')) return { expectedText: '1000 公克', derivation: `以公制質量單位關係 1 kg = 1,000 g 獨立換算。`, issues: [], answerable: true };
    const expected = nums[0] > nums[1] ? '甲袋米' : nums[0] < nums[1] ? '乙袋米' : '兩袋一樣重';
    return { expectedText: expected, derivation: `${nums[0]} g ${nums[0] > nums[1] ? '>' : nums[0] < nums[1] ? '<' : '='} ${nums[1]} g，單位相同，故 ${expected}。`, issues: nums.length < 2 ? ['比較題數值不足。'] : [], answerable: true };
  }
  if (activity.title === '面積建造師：平方公分探險') {
    const v = question.visualization;
    if (v?.type === 'comparison') {
      const counts = v.figures.map((rows) => rows.reduce((sum, row) => sum + row.filter((cell) => cell === 1).length, 0));
      const expectedText = counts[0] > counts[1] ? '甲花圃' : counts[0] < counts[1] ? '乙花圃' : '一樣大';
      const issues = counts.some((count) => !Number.isInteger(count)) || v.unitSideCm !== 1 ? ['面積圖形或單位方格資料無效。'] : [];
      return { expectedText, derivation: `逐列點數單位方格：甲 ${counts[0]} 格、乙 ${counts[1]} 格；每格 1 cm²。`, issues, answerable: true };
    }
    if (v?.rows) {
      const count = v.rows.reduce((sum, row) => sum + row.filter((cell) => cell === 1).length, 0);
      const isUnitQuestion = id.endsWith('-04');
      const issues = v.unitSideCm !== 1 ? ['圖形單位邊長與 1 cm 不符。'] : [];
      const countQuestion = /幾個完整小方格/.test(question.prompt);
      return { expectedText: isUnitQuestion ? '1 平方公分' : countQuestion ? `${count} 個` : `${count} 平方公分`, derivation: isUnitQuestion ? '邊長 1 cm 的正方形面積為 1 cm × 1 cm = 1 cm²。' : `逐列計完整方格，共 ${count} 格；每格 1 cm²，因此面積 ${count} cm²。`, issues, answerable: true };
    }
  }
  if (activity.title === '分數寶藏島：同分母分數探險') {
    const models = question.visualization?.models ?? [];
    const issues = [];
    for (const model of models) {
      if (model.parts?.length !== model.denominator || model.parts.filter(Boolean).length !== model.numerator) issues.push(`${model.label}分割數、選取份數與分子分母不一致。`);
      if (Math.abs(model.partLengthUnits * model.denominator - model.wholeLengthUnits) > 1e-8) issues.push(`${model.label}未等分成相同大小的份。`);
    }
    let expectedText = '';
    let derivation = '';
    if (id.endsWith('-01')) {
      const model = models[0]; expectedText = `${model?.numerator}/${model?.denominator}`;
      derivation = `整體分 ${model?.denominator} 等份，選取 ${model?.parts.filter(Boolean).length} 份，記為 ${expectedText}。`;
    } else if (id.endsWith('-02')) {
      expectedText = '整體平均分成幾個相等部分';
      derivation = '分數 2/6 的分母 6 表示整體被平均分成 6 個相等部分。';
      const model = models[0]; if (model?.denominator !== 6 || model?.numerator !== 2) issues.push('題幹分數與分割模型不一致。');
    } else if (id.endsWith('-03')) {
      const [a, b] = models; const av = a?.parts.filter(Boolean).length; const bv = b?.parts.filter(Boolean).length;
      expectedText = av > bv ? '甲比較多' : av < bv ? '乙比較多' : '一樣多';
      derivation = `兩模型整體／分母相同（${a?.wholeId}），比較選取等份數 ${av} 與 ${bv}。`;
      if (!a || !b || a.wholeId !== b.wholeId || a.wholeLengthUnits !== b.wholeLengthUnits || a.denominator !== b.denominator) issues.push('分數比較模型的整體或分割單位不一致。');
    } else if (id.endsWith('-04')) {
      const [, a, b] = question.prompt.match(/(\d+)\/(\d+).*?(\d+)\/(\d+)/) ?? [];
      const parsed = [...question.prompt.matchAll(/(\d+)\/(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      const left = parsed[0]; const right = parsed[1];
      expectedText = left?.[1] === right?.[1] ? (left[0] < right[0] ? '<' : left[0] > right[0] ? '>' : '=') : '';
      derivation = `同分母 ${left?.[1]}/${right?.[1]} 條件下比較分子 ${left?.[0]} 與 ${right?.[0]}，得到 ${expectedText}。`;
      if (!a || !b || !expectedText) issues.push('題幹的分數比較結構無法獨立核驗。');
    } else {
      const parsed = [...question.prompt.matchAll(/(\d+)\/(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      const [left, right] = parsed;
      const modelsMatch = models.length === 2 && models.every((model, index) => model.numerator === parsed[index]?.[0] && model.denominator === parsed[index]?.[1]);
      if (!modelsMatch) issues.push('情境分數與圖示模型不一致。');
      expectedText = left?.[1] === right?.[1] ? (left[0] > right[0] ? '小芸' : left[0] < right[0] ? '小安' : '一樣多') : '';
      derivation = `相同整體、分母 ${left?.[1]}；比較 ${left?.[0]} 份與 ${right?.[0]} 份，較多者為 ${expectedText}。`;
      if (!expectedText) issues.push('情境不是可直接比較的同分母題型。');
    }
    return { expectedText, derivation, issues, answerable: true };
  }
  if (activity.title === '加減法大挑戰：多位數加減探險') {
    if (id.endsWith('-05-STRATEGY')) {
      return { expectedText: '把 10 個一換成 1 個十，記在十位。', derivation: '14 個一 = 10 個一 + 4 個一；10 個一等於 1 個十，十位記 1 個十、個位留 4 個一。', issues: [], answerable: true };
    }
    const expression = question.prompt.split('算式').at(-1);
    const numberText = [...(expression?.matchAll(/\d[\d,]*/g) ?? question.prompt.matchAll(/\d[\d,]*/g))].map((m) => m[0]);
    const numbers = [...new Set(numberText.map((value) => Number(value.replaceAll(',', ''))))];
    const operator = id.includes('ADD-SUB-DRAFT-M3-N32-01') || id.includes('ADD-SUB-DRAFT-M3-N32-02') ? '+' : '−';
    const value = operator === '+' ? numbers[0] + numbers[1] : numbers[0] - numbers[1];
    return { expectedText: value.toLocaleString('en-US'), derivation: `${numbers[0]} ${operator} ${numbers[1]} = ${value}（獨立算術計算）。`, issues: numbers.length === 2 ? [] : ['無法從題幹擷取兩個計算數。'], answerable: true };
  }
  return { expectedText: '', derivation: '沒有對應的獨立推導規則。', issues: ['未支援此題型的獨立答案核驗。'], answerable: true };
}

export function verifyCandidateQuestion(activity, question) {
  const result = deriveQuestion(activity, question);
  const disabled = Boolean(result.disabled);
  const preview = Boolean(result.preview);
  const expected = result.expectedText;
  const expectedOption = result.answerable || preview ? optionMatching(question, expected) : null;
  const answer = answerOption(question);
  const structuralIssues = [...result.issues];
  const optionIds = question.options.map((option) => option.optionId);
  const optionTexts = question.options.map((option) => normalize(option.text));
  if (new Set(optionIds).size !== optionIds.length || optionIds.some((id) => !id)) structuralIssues.push('選項 ID 缺漏或重複。');
  if (new Set(optionTexts).size !== optionTexts.length) structuralIssues.push('選項文字重複。');
  if (result.answerable && (!answer || !expectedOption || answer.optionId !== expectedOption.optionId)) structuralIssues.push(`獨立推導結果「${expected}」與設定正解／選項不一致。`);
  if (preview && (question.reviewable !== true || answer?.optionId !== expectedOption?.optionId)) structuralIssues.push('唯讀預覽資料或答案展示不一致。');
  if (disabled && (question.reviewable !== false || question.options.length !== 0 || question.answerId !== null)) structuralIssues.push('停用題意外具備作答資料或可審查入口。');
  const directAnswerLeak = question.hints.some((hint) => {
    if (!answer) return false;
    const answerText = normalize(answer.text);
    const normalizedHint = normalize(hint);
    if (/^-?\d[\d,.]*$/.test(answerText)) return new RegExp(`(?:^|\\D)${answerText.replaceAll(',', '')}(?:\\D|$)`).test(normalizedHint.replaceAll(',', ''));
    return normalizedHint === answerText || new RegExp(`答案(?:是|為)${answerText}`).test(normalizedHint);
  });
  const remediationRoute = question.remediation
    ? (activity.activityId === 'ACT-M3-NUM-PLACE-VALUE-LEARNING-UNIT-PROTOTYPE' ? 'candidate_route_check_required' : 'description_only_not_connected')
    : 'not_provided';
  const feedbackStatus = question.wrongGuidance || Object.keys(question.errorGuidance ?? {}).length ? 'present_candidate_only' : 'not_provided';
  const hintStatus = question.hints.length ? (directAnswerLeak ? 'answer_leak_detected' : 'data_present_semantic_review_required') : 'not_provided';
  const curriculumStatus = question.qualityAudit?.curriculum?.officialTextChecked ? 'official_content_text_checked_item_alignment_pending' : 'not_checked';
  const answerStatus = disabled ? 'not_applicable' : structuralIssues.length ? 'failed' : 'passed';
  const limitations = [LIMITATION, NO_TEACHER_REVIEW];
  const status = disabled ? 'not_applicable' : structuralIssues.length || directAnswerLeak ? 'failed' : 'passed';
  return {
    status,
    answerStatus,
    expectedText: expected || null,
    derivation: result.derivation,
    declaredAnswer: answer?.text ?? null,
    answerOptionId: question.answerId,
    derivedOptionId: expectedOption?.optionId ?? null,
    issues: [...structuralIssues, ...(directAnswerLeak ? ['提示直接包含完整正解文字。'] : [])],
    manualChecks: {
      stemUniqueness: 'manual_review_required',
      renderedVisualReadability: question.visualization ? 'manual_review_required' : 'not_applicable',
      pedagogicalAlignment: 'manual_review_required',
      prerequisiteAndGradeSchedule: 'teacher_confirmation_required',
    },
    support: { hints: hintStatus, wrongFeedback: feedbackStatus, remediation: remediationRoute },
    curriculumStatus,
    itemKind: disabled ? 'disabled' : preview ? 'read_only_preview' : 'answerable_candidate',
    answerDerivationMethod: 'question_condition_or_visual_data_independently_calculated_then_compared_to_answer_option',
    limitations,
  };
}

export function buildCandidateQuestionMathAudit({ activities = TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE, now = new Date().toISOString() } = {}) {
  const records = [];
  for (const activity of activities) for (const question of activity.questions) {
    const verification = verifyCandidateQuestion(activity, question);
    const source = ACTIVITY_FILES[activity.activityId];
    records.push({
      evidenceId: `MATH-AUDIT-${question.questionId}`,
      evidenceType: 'question_data_audit',
      activityId: activity.activityId,
      questionId: question.questionId,
      itemKind: verification.itemKind,
      command: 'node scripts/candidate-question-math-audit.mjs',
      status: verification.status,
      exitCode: verification.status === 'failed' ? 1 : 0,
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      summary: verification.status === 'failed' ? verification.issues.join('；') : verification.status === 'not_applicable' ? '停用項目：狀態與不可作答邊界一致，不計算答案。' : `獨立推導 ${verification.expectedText}；設定正解 ${verification.declaredAnswer}；結構化計算／表示檢查通過。`,
      parsedTest: null,
      coverage: [activity.activityId],
      source: source ?? 'prototype/data/teacherReviewCatalog.js',
      limitations: verification.limitations.join(' '),
      answerAudit: verification,
      teacherReviewStatus: 'unreviewed',
    });
  }
  return records;
}

export async function writeCandidateQuestionMathAudit({ outputPath = ACCEPTANCE_EVIDENCE_OUTPUT, now = new Date().toISOString() } = {}) {
  const current = JSON.parse(await readFile(outputPath, 'utf8'));
  const checked = validateAcceptanceEvidenceReport(current);
  if (!checked.ok) throw new TypeError(`既有驗收證據格式錯誤，拒絕更新：${checked.errors.join(' ')}`);
  const start = performance.now();
  const startedAt = now;
  const audits = buildCandidateQuestionMathAudit({ now });
  const finishedAt = new Date().toISOString();
  const durationMs = Math.round(performance.now() - start);
  for (const record of audits) {
    record.startedAt = startedAt;
    record.finishedAt = finishedAt;
    record.durationMs = durationMs;
  }
  const auditIds = new Set(audits.map((record) => record.evidenceId));
  const preserved = checked.value.records.filter((record) => !auditIds.has(record.evidenceId));
  const report = { ...checked.value, records: [...preserved, ...audits], generatedAt: now };
  const validation = validateAcceptanceEvidenceReport(report);
  if (!validation.ok) throw new TypeError(`新增逐題核驗結果無效，拒絕更新：${validation.errors.join(' ')}`);
  await writeFile(outputPath, `${JSON.stringify(validation.value, null, 2)}\n`, 'utf8');
  return audits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const records = await writeCandidateQuestionMathAudit();
  const counts = records.reduce((result, record) => { result[record.status] = (result[record.status] ?? 0) + 1; return result; }, {});
  for (const record of records) if (record.status === 'failed') console.error(`FAIL ${record.questionId}: ${record.summary}`);
  console.log(`Candidate question audit: ${records.length} items; ${counts.passed ?? 0} data checks passed, ${counts.failed ?? 0} failed, ${counts.not_applicable ?? 0} not applicable; ${records.filter((record) => record.answerAudit.manualChecks.renderedVisualReadability === 'manual_review_required').length} require visual review.`);
  console.log(`Evidence report updated: ${ACCEPTANCE_EVIDENCE_OUTPUT}`);
  if (records.some((record) => record.status === 'failed')) process.exitCode = 1;
}
