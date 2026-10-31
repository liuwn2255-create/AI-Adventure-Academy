import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCEPTANCE_EVIDENCE_SCHEMA_VERSION,
  createEvidenceRecord,
  mergeAcceptanceEvidenceReports,
  preserveBrowserAcceptanceEvidence,
  validateAcceptanceEvidenceReport,
} from '../scripts/acceptance-evidence.mjs';
import {
  TEACHER_REVIEW_ACTIVITIES,
  TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE,
  TEACHER_REVIEW_ACTIVITY_IDS,
  TEACHER_REVIEW_QUESTION_IDS,
} from '../prototype/data/teacherReviewCatalog.js';
import {
  TEACHER_REVIEW_DATASET_ID,
  TEACHER_REVIEW_SCHEMA_VERSION,
  TEACHER_REVIEW_STORAGE_KEY,
  REQUIRED_BROWSER_VIEWPORTS,
  REVIEW_CRITERIA,
  buildPrePilotReviewReport,
  createEmptyTeacherReviewDataset,
  loadTeacherReviewDataset,
  mergeTeacherReviewDatasets,
  resetTeacherReviewDataset,
  saveTeacherReviewDataset,
  serializeTeacherReviewDataset,
  validateTeacherReviewDataset,
} from '../prototype/teacherReviewWorkbench.js';

const now = '2026-10-21T02:00:00.000Z';
const placeActivityId = TEACHER_REVIEW_ACTIVITY_IDS[0];
const firstPlaceQuestionId = TEACHER_REVIEW_QUESTION_IDS[placeActivityId][0];

function activityReview(activityId, overrides = {}) {
  const activity = TEACHER_REVIEW_ACTIVITIES.find((item) => item.activityId === activityId);
  return {
    activityId,
    decision: 'unreviewed',
    textbook: { publisher: '', schoolYear: '', edition: '', grade: '', semester: '', volume: '', unit: '', pages: '' },
    classroomProgress: '',
    prerequisiteChecks: Object.fromEntries(activity.prerequisites.map((item) => [item.id, 'pending'])),
    notes: '',
    updatedAt: now,
    ...overrides,
  };
}

function questionReview(questionId, overrides = {}) {
  return { questionId, decision: 'unreviewed', revisionReason: '', notes: '', updatedAt: now, ...overrides };
}

test('目錄包含候選數學活動與可追溯識別碼', () => {
  assert.equal(TEACHER_REVIEW_ACTIVITIES.length, 9);
  assert.equal(new Set(TEACHER_REVIEW_ACTIVITY_IDS).size, 9);
  assert.deepEqual(TEACHER_REVIEW_ACTIVITIES.map((item) => item.title), [
    '千位數的秘密', '數的大小比較', '容量刻度判讀', '整數數線定位', '長度：毫米刻度', '重量：公克與公斤', '面積建造師：平方公分探險', '分數寶藏島：同分母分數探險', '加減法大挑戰：多位數加減探險',
  ]);
  for (const activity of TEACHER_REVIEW_ACTIVITIES) {
    assert.ok(activity.activityId);
    assert.ok(activity.levelIds.length > 0);
    assert.equal(activity.status.includes('approved'), false);
  }
});

test('教師工作台活動數量標籤由目錄資料決定，避免新增候選活動後顯示舊數量', () => {
  const html = readFileSync(new URL('../prototype/teacher-review.html', import.meta.url), 'utf8');
  const workbench = readFileSync(new URL('../prototype/teacherReviewWorkbench.js', import.meta.url), 'utf8');
  assert.match(html, /檢視數學候選活動的題目/);
  assert.doesNotMatch(html, /六類活動/);
  assert.match(workbench, /sidebar\.setAttribute\('aria-label', `\$\{TEACHER_REVIEW_ACTIVITIES\.length\} 項數學候選活動`\)/);
  assert.doesNotMatch(workbench, /六項數學候選活動/);
});

test('逐題目錄識別碼唯一，所有可審查題目的答案均指向實際選項', () => {
  for (const activity of TEACHER_REVIEW_ACTIVITIES) {
    const ids = activity.questions.map((question) => question.questionId);
    assert.equal(new Set(ids).size, ids.length, `${activity.title} 題目 ID 重複`);
    for (const question of activity.questions) {
      assert.ok(question.questionId);
      if (question.reviewable && question.answerId) {
        assert.ok(question.options.some((option) => option.optionId === question.answerId), `${question.questionId} 的答案未對應選項`);
      }
    }
  }
});

test('候選活動所有可作答題目的答案與選項唯一且解說具備；未提供的提示或補強不會偽造', () => {
  const allQuestionIds = [];
  for (const activity of TEACHER_REVIEW_ACTIVITIES) {
    for (const question of activity.questions) {
      allQuestionIds.push(`${activity.activityId}:${question.questionId}`);
      if (!question.reviewable || !question.answerId) continue;
      const optionIds = question.options.map((option) => option.optionId);
      const optionTexts = question.options.map((option) => option.text);
      assert.ok(question.options.some((option) => option.optionId === question.answerId), `${question.questionId} 正解必須指向選項`);
      assert.equal(new Set(optionIds).size, optionIds.length, `${question.questionId} 選項識別碼不得重複`);
      assert.equal(new Set(optionTexts).size, optionTexts.length, `${question.questionId} 選項文字不得重複`);
      assert.ok(question.explanation?.trim(), `${question.questionId} 應有解說`);
    }
  }
  assert.equal(new Set(allQuestionIds).size, allQuestionIds.length);

  const place = TEACHER_REVIEW_ACTIVITIES.find((activity) => activity.title === '千位數的秘密');
  for (const id of ['secret-thousands-01', 'secret-thousands-02', 'secret-thousands-03', 'DRAFT-M3-NUM-01-01']) {
    const question = place.questions.find((item) => item.questionId === id);
    assert.ok(question.remediation, `${id} 應顯示資料中明確對應的補強活動`);
  }
  const blockPractice = place.questions.find((item) => item.questionId === 'DRAFT-M3-NUM-01-01');
  assert.match(blockPractice.remediation, /逐一觀察位值表各欄/);
  assert.doesNotMatch(blockPractice.remediation, /找和「十積木」名稱相同|答案是十位/);
  for (const id of ['V2-DRAFT-M3-NUM-01-01', 'V2-DRAFT-M3-NUM-01-02']) {
    const question = place.questions.find((item) => item.questionId === id);
    assert.equal(question.remediation, null, `${id} 沒有明確對應補強時不得推測`);
    assert.equal(question.hints.length, 2, `${id} 應顯示題目資料中的兩層提示`);
    assert.ok(question.wrongGuidance, `${id} 應顯示題目資料中的錯答引導`);
  }

  const capacity = TEACHER_REVIEW_ACTIVITIES.find((activity) => activity.title === '容量刻度判讀');
  assert.ok(capacity.questions.every((question) => question.hints.length === 2 && question.wrongGuidance && question.remediation === null), '容量題顯示資料中的兩層提示與答錯引導，但不得虛構補強');
  for (const title of ['數的大小比較', '整數數線定位', '長度：毫米刻度', '重量：公克與公斤']) {
    const activity = TEACHER_REVIEW_ACTIVITIES.find((item) => item.title === title);
    assert.ok(activity.questions.every((question) => question.hints.length === 2 && question.wrongGuidance && question.remediation === null), `${title} 的提示／補強顯示須符合題目資料`);
  }
  const area = TEACHER_REVIEW_ACTIVITIES.find((activity) => activity.title === '面積建造師：平方公分探險');
  assert.equal(area.curriculumCodes.includes('N-3-14'), true);
  assert.equal(area.reviewStatus, 'pending_teacher_review');
  assert.equal(area.questions.length, 4);
  assert.ok(area.questions.every((question) => question.hints.length === 2 && question.wrongGuidance && question.remediation === null));
});

test('九類活動的逐題品質稽核完整、來源狀態與候選教師紀錄分離', () => {
  const expectedCodes = new Map([
    ['千位數的秘密', ['N-3-1', 'n-II-1']],
    ['數的大小比較', []],
    ['容量刻度判讀', ['N-3-15', 'n-II-9']],
    ['整數數線定位', ['N-3-11', 'n-II-8']],
    ['長度：毫米刻度', ['N-3-12', 'n-II-9']],
    ['重量：公克與公斤', ['N-3-16', 'n-II-9']],
    ['面積建造師：平方公分探險', ['N-3-14', 'n-II-9']],
    ['分數寶藏島：同分母分數探險', ['N-3-9', 'n-II-6']],
    ['加減法大挑戰：多位數加減探險', ['N-3-2', 'n-II-2']],
  ]);
  const questions = TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE.flatMap((activity) => activity.questions.map((question) => ({ activity, question })));
  assert.equal(questions.length, 40);
  assert.equal(new Set(questions.map(({ question }) => question.questionId)).size, 40);
  assert.equal(questions.filter(({ question }) => !/唯讀預覽|停用設計/.test(question.group)).length, 38);
  assert.equal(questions.filter(({ question }) => /唯讀預覽/.test(question.group)).length, 1);
  assert.equal(questions.filter(({ question }) => /停用設計/.test(question.group)).length, 1);
  for (const { activity, question } of questions) {
    const audit = question.qualityAudit;
    assert.ok(audit, `${question.questionId} 缺少品質稽核資料`);
    assert.equal(audit.analysisKind, 'candidate_quality_audit_not_teacher_review');
    assert.equal(audit.teacherReview.status, 'unreviewed');
    assert.equal(audit.teacherReview.decision, null);
    assert.equal(audit.curriculum.officialTextChecked, Boolean(audit.curriculum.officialLocation.match(/PDF 頁序/)));
    assert.equal(audit.curriculum.itemAlignmentStatus, audit.curriculum.officialTextChecked
      ? 'candidate_item_alignment_pending_teacher_review'
      : 'no_direct_code_pending_verification');
    assert.match(audit.curriculum.semesterAndTextbook, /待教師提供／確認/);
    assert.ok(audit.curriculum.relatedPerformanceCodes.every((code) => /^[a-z]-II-\d+$/.test(code)));
    assert.deepEqual(audit.curriculum.codes, expectedCodes.get(activity.title));
    assert.ok(audit.learningScope.measuredConcept);
    assert.ok(audit.learningScope.prerequisite);
    assert.ok(audit.learningScope.uncoveredCapabilities.length > 0);
    assert.equal(audit.supports.hints.count, question.hints.length);
    assert.equal(audit.supports.remediation.status, question.remediation
      ? 'linked_candidate_activity_in_source_data'
      : 'not_provided');
    if (!question.reviewable) assert.match(audit.role.usage, /暫緩使用/);
  }
  const comparison = TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE.find((activity) => activity.title === '數的大小比較');
  assert.ok(comparison.questions.every((question) => question.qualityAudit.curriculum.officialTextChecked === false));
  const place = TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE[0];
  assert.match(place.questions.find((question) => question.questionId === 'DRAFT-M3-NUM-01-01').qualityAudit.role.usage, /引導練習/);
  assert.match(place.questions.find((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-03').qualityAudit.role.usage, /唯讀預覽/);
  assert.match(place.questions.find((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-04').qualityAudit.role.usage, /暫緩使用/);
  assert.ok(questions.every(({ activity }) => activity.reviewStatus === 'pending_teacher_review'));
});

test('工作台逐題呈現官方原文查核狀態、學習表現參照及目前教師審查草稿，而不將分析當成審查', () => {
  const source = readFileSync(new URL('../prototype/teacherReviewWorkbench.js', import.meta.url), 'utf8');
  assert.match(source, /audit\.curriculum\.officialTextChecked/);
  assert.match(source, /audit\.curriculum\.officialSourceUrl/);
  assert.match(source, /國家教育研究院數學領域課綱 PDF/);
  assert.match(source, /audit\.curriculum\.relatedPerformanceCodes/);
  assert.match(source, /decisionLabels\[review\.decision\]/);
  assert.match(source, /teacherDecisionLabels\[review\.teacherDecision/);
  assert.match(source, /AI／資料稽核不會代填/);
  assert.match(source, /補強：\$\{question\.remediation \?\? '此題組未提供題目層級補強活動。'\}/);
});

test('千位數預覽與停用題仍不可作答，但可保存獨立的教師內容審查', () => {
  const activity = TEACHER_REVIEW_ACTIVITIES[0];
  assert.ok(activity.questions.some((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-01'));
  assert.ok(activity.questions.some((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-02'));
  const preview = activity.questions.find((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-03');
  const disabled = activity.questions.find((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-04');
  assert.equal(preview.reviewable, true);
  assert.equal(preview.status, 'disabled_pending_teacher_confirmation');
  assert.equal(disabled.reviewable, false);
  assert.equal(disabled.answerId, null);
  const invalid = createEmptyTeacherReviewDataset();
  invalid.questionReviews[activity.activityId] = {
    [disabled.questionId]: questionReview(disabled.questionId, { decision: 'accepted' }),
  };
  assert.equal(validateTeacherReviewDataset(invalid).ok, true);
  assert.equal(disabled.reviewable, false, '教師審查不會開啟學生作答或改變停用狀態');
});

test('空白審查狀態預設尚未審查，且內容審查不會宣稱正式核准', () => {
  const empty = createEmptyTeacherReviewDataset();
  assert.equal(empty.datasetId, TEACHER_REVIEW_DATASET_ID);
  assert.deepEqual(empty.activityReviews, {});
  assert.deepEqual(empty.questionReviews, {});
  const invalidDecision = createEmptyTeacherReviewDataset();
  invalidDecision.questionReviews[placeActivityId] = {
    [firstPlaceQuestionId]: questionReview(firstPlaceQuestionId, { decision: 'approved_for_publication' }),
  };
  assert.equal(validateTeacherReviewDataset(invalidDecision).ok, false);
});

test('千位數 Q1、Q2 顯示的題幹、選項、答案與解析符合候選審查資料', () => {
  const activity = TEACHER_REVIEW_ACTIVITIES[0];
  const q1 = activity.questions.find((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-01');
  const q2 = activity.questions.find((question) => question.questionId === 'V2-DRAFT-M3-NUM-01-02');
  assert.equal(q1.prompt, '在 4,372 中，數字 7 在哪一位？');
  assert.deepEqual(q1.options.map((option) => option.text), ['個位', '十位', '百位', '千位']);
  assert.equal(q1.options.find((option) => option.optionId === q1.answerId)?.text, '十位');
  assert.match(q1.explanation, /十位/);
  assert.equal(q2.prompt, '在 5,284 中，數字 8 代表多少？');
  assert.deepEqual(q2.options.map((option) => option.text), ['8', '80', '800', '8,000']);
  assert.equal(q2.options.find((option) => option.optionId === q2.answerId)?.text, '80');
  assert.match(q2.explanation, /80/);
  assert.equal(q1.status, 'candidate_pending_teacher_review');
  assert.equal(q2.status, 'candidate_pending_teacher_review');
});

test('Q1、Q2 題目審查分開保存，匯出 JSON 保留識別碼、決定與備註', () => {
  const q1Id = 'V2-DRAFT-M3-NUM-01-01';
  const q2Id = 'V2-DRAFT-M3-NUM-01-02';
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  const firstSave = createEmptyTeacherReviewDataset();
  firstSave.questionReviews[placeActivityId] = {
    [q1Id]: questionReview(q1Id, { decision: 'needs_revision', notes: 'Q1 test fixture note' }),
  };
  firstSave.updatedAt = now;
  assert.equal(saveTeacherReviewDataset(storage, firstSave).ok, true);

  const afterFirstSave = loadTeacherReviewDataset(storage).dataset;
  const secondSave = {
    ...afterFirstSave,
    questionReviews: {
      ...afterFirstSave.questionReviews,
      [placeActivityId]: {
        ...afterFirstSave.questionReviews[placeActivityId],
        [q2Id]: questionReview(q2Id, { decision: 'unreviewed', notes: 'Q2 remains unreviewed' }),
      },
    },
    updatedAt: now,
  };
  assert.equal(saveTeacherReviewDataset(storage, secondSave).ok, true);

  const exportedText = serializeTeacherReviewDataset(loadTeacherReviewDataset(storage).dataset);
  const exported = JSON.parse(exportedText);
  assert.equal(validateTeacherReviewDataset(exported).ok, true);
  assert.equal(exported.schemaVersion, TEACHER_REVIEW_SCHEMA_VERSION);
  assert.equal(exported.datasetId, TEACHER_REVIEW_DATASET_ID);
  assert.deepEqual(Object.keys(exported.questionReviews[placeActivityId]).sort(), [q1Id, q2Id].sort());
  assert.equal(exported.questionReviews[placeActivityId][q1Id].decision, 'needs_revision');
  assert.equal(exported.questionReviews[placeActivityId][q1Id].notes, 'Q1 test fixture note');
  assert.equal(exported.questionReviews[placeActivityId][q2Id].decision, 'unreviewed');
  assert.equal(exported.questionReviews[placeActivityId][q2Id].notes, 'Q2 remains unreviewed');
});

test('儲存、重新載入與清除只操作教師審查專用 storage key', () => {
  const values = new Map([['demo-progress-v4', '{"stars":9}']]);
  const touched = [];
  const storage = {
    getItem(key) { touched.push(['get', key]); return values.get(key) ?? null; },
    setItem(key, value) { touched.push(['set', key]); values.set(key, value); },
    removeItem(key) { touched.push(['remove', key]); values.delete(key); },
  };
  let dataset = createEmptyTeacherReviewDataset();
  dataset = { ...dataset, activityReviews: { [placeActivityId]: activityReview(placeActivityId) }, updatedAt: now };
  assert.equal(saveTeacherReviewDataset(storage, dataset).ok, true);
  const loaded = loadTeacherReviewDataset(storage);
  assert.equal(loaded.persistence, 'local');
  assert.deepEqual(loaded.dataset, dataset);
  assert.deepEqual(JSON.parse(values.get('demo-progress-v4')), { stars: 9 });
  assert.ok(touched.every(([, key]) => key === TEACHER_REVIEW_STORAGE_KEY));
  assert.equal(resetTeacherReviewDataset(storage).ok, true);
  assert.equal(values.has(TEACHER_REVIEW_STORAGE_KEY), false);
  assert.deepEqual(JSON.parse(values.get('demo-progress-v4')), { stars: 9 });
});

test('JSON 匯出可重新解析、驗證及合併；匯入相同紀錄不覆蓋', () => {
  const original = createEmptyTeacherReviewDataset();
  original.activityReviews[placeActivityId] = activityReview(placeActivityId, {
    decision: 'needs_revision',
    textbook: { publisher: '教師填寫出版社', schoolYear: '教師填寫學年度', edition: '', grade: '三年級', semester: '', volume: '', unit: '', pages: '' },
    notes: '題幹待修。',
  });
  original.questionReviews[placeActivityId] = {
    [firstPlaceQuestionId]: questionReview(firstPlaceQuestionId, { decision: 'needs_revision', revisionReason: '選項字句待檢視。' }),
  };
  original.updatedAt = now;
  const serialized = serializeTeacherReviewDataset(original);
  const parsed = JSON.parse(serialized);
  assert.equal(validateTeacherReviewDataset(parsed).ok, true);
  assert.ok(parsed.activityReviews[placeActivityId].activityId);
  assert.equal(parsed.questionReviews[placeActivityId][firstPlaceQuestionId].decision, 'needs_revision');
  assert.ok(parsed.questionReviews[placeActivityId][firstPlaceQuestionId].updatedAt);
  const firstMerge = mergeTeacherReviewDatasets(createEmptyTeacherReviewDataset(), parsed);
  assert.equal(firstMerge.ok, true);
  assert.equal(firstMerge.changed, true);
  const duplicateMerge = mergeTeacherReviewDatasets(firstMerge.dataset, parsed);
  assert.equal(duplicateMerge.ok, true);
  assert.equal(duplicateMerge.changed, false);
  assert.match(duplicateMerge.error, /沒有覆蓋/);
});

test('不相同的重複匯入紀錄會整份拒絕且不更改現有資料', () => {
  const current = createEmptyTeacherReviewDataset();
  current.questionReviews[placeActivityId] = {
    [firstPlaceQuestionId]: questionReview(firstPlaceQuestionId, { notes: '目前紀錄' }),
  };
  const imported = createEmptyTeacherReviewDataset();
  imported.questionReviews[placeActivityId] = {
    [firstPlaceQuestionId]: questionReview(firstPlaceQuestionId, { notes: '匯入的不同紀錄' }),
  };
  const before = JSON.stringify(current);
  const result = mergeTeacherReviewDatasets(current, imported);
  assert.equal(result.ok, false);
  assert.equal(result.changed, false);
  assert.equal(JSON.stringify(current), before);
});

test('錯誤 schema、未知活動／題目、無效決定及不合法先備狀態均被拒絕', () => {
  const wrongVersion = createEmptyTeacherReviewDataset();
  wrongVersion.schemaVersion = 99;
  assert.equal(validateTeacherReviewDataset(wrongVersion).ok, false);

  const unknownActivity = createEmptyTeacherReviewDataset();
  unknownActivity.activityReviews['ACT-UNKNOWN'] = {};
  assert.equal(validateTeacherReviewDataset(unknownActivity).ok, false);

  const unknownQuestion = createEmptyTeacherReviewDataset();
  unknownQuestion.questionReviews[placeActivityId] = { 'QUESTION-UNKNOWN': questionReview('QUESTION-UNKNOWN') };
  assert.equal(validateTeacherReviewDataset(unknownQuestion).ok, false);

  const invalidReview = createEmptyTeacherReviewDataset();
  invalidReview.activityReviews[placeActivityId] = activityReview(placeActivityId, { decision: 'approved' });
  assert.equal(validateTeacherReviewDataset(invalidReview).ok, false);

  const invalidPrerequisite = createEmptyTeacherReviewDataset();
  const review = activityReview(placeActivityId);
  review.prerequisiteChecks['place-value-name-order'] = 'yes';
  invalidPrerequisite.activityReviews[placeActivityId] = review;
  assert.equal(validateTeacherReviewDataset(invalidPrerequisite).ok, false);
});

test('資料損壞時不自動覆寫，儲存異常時回報記憶體降級', () => {
  let writes = 0;
  const corruptStorage = { getItem: () => '{bad json', setItem() { writes += 1; } };
  const corrupt = loadTeacherReviewDataset(corruptStorage);
  assert.equal(corrupt.canSave, false);
  assert.match(corrupt.error, /JSON 損壞/);
  assert.equal(writes, 0, '讀取損壞資料時不得自動寫回或覆蓋');

  const failingStorage = { setItem() { throw new Error('quota'); } };
  const fallback = saveTeacherReviewDataset(failingStorage, createEmptyTeacherReviewDataset());
  assert.equal(fallback.ok, true);
  assert.equal(fallback.persistence, 'memory');
  assert.match(fallback.error, /記憶體/);
});

test('逐題檢核狀態和意見可驗證、匯出再匯入，需修改／不適用必須附理由', () => {
  const dataset = createEmptyTeacherReviewDataset();
  const questionId = firstPlaceQuestionId;
  const criteriaReviews = Object.fromEntries(REVIEW_CRITERIA.map(({ id }) => [id, { status: 'unreviewed', comment: '' }]));
  criteriaReviews.answer_and_explanation = { status: 'passed', comment: '已依答案步驟核對' };
  criteriaReviews.prompt_and_options = { status: 'needs_revision', comment: '請縮短第二句題幹' };
  criteriaReviews.curriculum_evidence = { status: 'not_applicable', comment: '此項先等課綱逐題對照資料補齊' };
  dataset.questionReviews[placeActivityId] = {
    [questionId]: questionReview(questionId, { criteriaReviews }),
  };
  dataset.updatedAt = now;
  const serialized = serializeTeacherReviewDataset(dataset);
  const parsed = JSON.parse(serialized);
  assert.equal(validateTeacherReviewDataset(parsed).ok, true);
  const merged = mergeTeacherReviewDatasets(createEmptyTeacherReviewDataset(), parsed);
  assert.equal(merged.ok, true);
  assert.deepEqual(merged.dataset.questionReviews[placeActivityId][questionId].criteriaReviews, criteriaReviews);

  const missingReason = structuredClone(dataset);
  missingReason.questionReviews[placeActivityId][questionId].criteriaReviews.prompt_and_options.comment = '';
  assert.equal(validateTeacherReviewDataset(missingReason).ok, false);
  const unknownStatus = structuredClone(dataset);
  unknownStatus.questionReviews[placeActivityId][questionId].criteriaReviews.answer_and_explanation.status = 'approved';
  assert.equal(validateTeacherReviewDataset(unknownStatus).ok, false);
});

test('九類活動均有動態試用前報告；缺少審查／課綱／先備證據時不得顯示可試用', () => {
  const report = buildPrePilotReviewReport(createEmptyTeacherReviewDataset(), now);
  assert.equal(report.activityCount, 9);
  assert.equal(report.activities.length, 9);
  for (const activity of report.activities) {
    assert.ok(activity.activityId);
    assert.ok(activity.questionIds.length > 0);
    assert.ok(activity.engineering.catalogIntegrity);
    assert.match(activity.engineering.browserAcceptance, /尚未保存|尚未全部有可追溯/);
    assert.notEqual(activity.pilotReadiness, '可進入小規模教學試用');
    assert.ok(activity.blockers.length > 0);
  }
  const place = report.activities.find((item) => item.title === '千位數的秘密');
  assert.equal(place.candidateStatus, 'candidate_pending_teacher_review');
  assert.ok(place.previewOrDisabledCount >= 2);
  const capacity = report.activities.find((item) => item.title === '容量刻度判讀');
  assert.equal(capacity.linkedRemediation.available, 0);
  assert.equal(capacity.linkedRemediation.missing, capacity.questionCount);
});

test('試用前報告隨審查草稿即時更新，但即使教師勾選試用仍不推導課綱核實或工程驗收', () => {
  const dataset = createEmptyTeacherReviewDataset();
  const activity = TEACHER_REVIEW_ACTIVITIES.find((item) => item.title === '千位數的秘密');
  const activityRecord = activityReview(activity.activityId, {
    decision: 'accepted',
    pilotDecision: 'approved_for_pilot',
    prerequisiteChecks: Object.fromEntries(activity.prerequisites.map(({ id }) => [id, 'confirmed'])),
    textbook: Object.fromEntries(['publisher', 'schoolYear', 'edition', 'grade', 'semester', 'volume', 'unit', 'pages'].map((key) => [key, '教師填寫資料'])),
  });
  dataset.activityReviews[activity.activityId] = activityRecord;
  const before = buildPrePilotReviewReport(dataset).activities.find((item) => item.activityId === activity.activityId);
  assert.equal(before.pilotDecision, 'approved_for_pilot');
  assert.equal(before.reviewProgress.activityDecision, 'accepted');
  assert.equal(before.reviewProgress.prerequisitesConfirmed, true);
  assert.equal(before.curriculumVerified, false);
  assert.match(before.pilotReadiness, /尚不建議|待教師判斷/);
  assert.ok(before.blockers.some((blocker) => /課綱/.test(blocker)));
  assert.ok(before.blockers.some((blocker) => /工程驗收/.test(blocker)));

  const question = activity.questions.find((item) => item.answerId && item.reviewable && !/preview|disabled/i.test(item.status ?? ''));
  const fullCriteria = Object.fromEntries(REVIEW_CRITERIA.map(({ id }) => [id, { status: 'passed', comment: '' }]));
  dataset.questionReviews[activity.activityId] = {
    [question.questionId]: questionReview(question.questionId, { decision: 'accepted', criteriaReviews: fullCriteria }),
  };
  const after = buildPrePilotReviewReport(dataset).activities.find((item) => item.activityId === activity.activityId);
  assert.equal(after.reviewProgress.playableQuestionsComplete, '1/9');
  assert.equal(after.reviewProgress.criteriaPassed, REVIEW_CRITERIA.length);
  assert.equal(after.candidateStatus, 'candidate_pending_teacher_review');
  assert.notEqual(after.pilotReadiness, '可進入小規模教學試用');
});

test('預覽與停用題的審查欄位不會計入可作答題目的檢核進度', () => {
  const dataset = createEmptyTeacherReviewDataset();
  const activity = TEACHER_REVIEW_ACTIVITIES.find((item) => item.title === '千位數的秘密');
  const nonPlayable = activity.questions.find((question) => !question.reviewable || /preview|disabled/i.test(question.status ?? ''));
  const passedCriteria = Object.fromEntries(REVIEW_CRITERIA.map(({ id }) => [id, { status: 'passed', comment: '' }]));
  dataset.questionReviews[activity.activityId] = {
    [nonPlayable.questionId]: questionReview(nonPlayable.questionId, { decision: 'accepted', criteriaReviews: passedCriteria }),
  };
  const report = buildPrePilotReviewReport(dataset).activities.find((item) => item.activityId === activity.activityId);
  assert.equal(report.reviewProgress.criteriaPassed, 0);
  assert.equal(report.reviewProgress.questionDecisions.accepted, 0);
  assert.equal(report.reviewProgress.criteriaTotal, report.playableQuestionCount * REVIEW_CRITERIA.length);
});

test('逐題檢核衝突匯入遭拒絕，不會覆蓋原有審查資料', () => {
  const current = createEmptyTeacherReviewDataset();
  const imported = createEmptyTeacherReviewDataset();
  const criteriaReviews = Object.fromEntries(REVIEW_CRITERIA.map(({ id }) => [id, { status: 'unreviewed', comment: '' }]));
  current.questionReviews[placeActivityId] = {
    [firstPlaceQuestionId]: questionReview(firstPlaceQuestionId, { criteriaReviews, notes: '現有意見' }),
  };
  imported.questionReviews[placeActivityId] = {
    [firstPlaceQuestionId]: questionReview(firstPlaceQuestionId, { criteriaReviews: { ...criteriaReviews, answer_and_explanation: { status: 'passed', comment: '' } }, notes: '匯入衝突' }),
  };
  const before = JSON.stringify(current);
  const result = mergeTeacherReviewDatasets(current, imported);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(current), before);
});

function evidence(evidenceId, overrides = {}) {
  return {
    evidenceId, scopeType: 'system', activityId: null, questionId: null,
    evidenceType: 'automated_test', performedItems: '實際執行指定測試', result: 'passed',
    executedAt: now, source: 'node --test test/example.test.mjs', limitations: '', viewport: null,
    ...overrides,
  };
}

test('證據登錄必須有唯一識別碼、有效範圍、實際項目和可追溯來源；未執行不能標通過', () => {
  const data = createEmptyTeacherReviewDataset();
  data.evidenceRecords.push(evidence('EV-1'));
  assert.equal(validateTeacherReviewDataset(data).ok, true);
  const noSource = structuredClone(data);
  noSource.evidenceRecords[0].source = '';
  assert.equal(validateTeacherReviewDataset(noSource).ok, false);
  const unrunPassed = structuredClone(data);
  unrunPassed.evidenceRecords[0].executedAt = null;
  assert.equal(validateTeacherReviewDataset(unrunPassed).ok, false);
  const duplicate = structuredClone(data);
  duplicate.evidenceRecords.push(evidence('EV-1'));
  assert.equal(validateTeacherReviewDataset(duplicate).ok, false);
  const unknownActivity = structuredClone(data);
  unknownActivity.evidenceRecords[0] = evidence('EV-2', { scopeType: 'activity', activityId: 'ACT-UNKNOWN' });
  assert.equal(validateTeacherReviewDataset(unknownActivity).ok, false);
  const browserWithoutViewport = structuredClone(data);
  browserWithoutViewport.evidenceRecords[0] = evidence('EV-BROWSER', { evidenceType: 'browser_acceptance', viewport: null });
  assert.equal(validateTeacherReviewDataset(browserWithoutViewport).ok, false);
});

test('既有 schema v1 的工作台資料可載入並保留既有審查，缺少的新證據欄位視為空清單', () => {
  const legacy = createEmptyTeacherReviewDataset();
  legacy.activityReviews[placeActivityId] = activityReview(placeActivityId, { notes: 'existing review' });
  delete legacy.evidenceRecords;
  const validation = validateTeacherReviewDataset(legacy);
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.value.evidenceRecords, []);
  assert.equal(validation.value.activityReviews[placeActivityId].notes, 'existing review');
});

test('試用報告依登錄證據分開判斷測試、三種 viewport、課綱與教師審查', () => {
  const activity = TEACHER_REVIEW_ACTIVITIES[0];
  const data = createEmptyTeacherReviewDataset();
  data.evidenceRecords.push(evidence('TESTS', { evidenceType: 'automated_test' }));
  for (const viewport of REQUIRED_BROWSER_VIEWPORTS) data.evidenceRecords.push(evidence(`BROWSER-${viewport}`, { evidenceType: 'browser_acceptance', viewport }));
  const report = buildPrePilotReviewReport(data).activities.find((item) => item.activityId === activity.activityId);
  assert.equal(report.engineering.testEvidence.status, '尚未驗證（自動工程報告未載入或無效）', '人工登錄的測試紀錄不能冒充自動執行');
  assert.ok(Object.values(report.engineering.browserEvidence).every((item) => item.status === '通過（已登錄）'));
  assert.equal(report.curriculumEvidence.status, '尚未驗證');
  assert.equal(report.curriculumVerified, false, '代碼／目錄狀態不能代替原文與逐題對照證據');
  assert.equal(report.teacherReviewEvidence.status, '尚未驗證');
  assert.notEqual(report.pilotReadiness, '符合提交教師決定是否試用的條件');
  assert.ok(report.blockers.some((item) => item.includes('課綱')));
  assert.ok(report.blockers.some((item) => item.includes('教師審查')));
});

test('試用前報告會從自動驗收報告顯示瀏覽器尺寸證據，但不轉成教師審查或核准', () => {
  const activity = TEACHER_REVIEW_ACTIVITIES[0];
  const browserRecord = automaticRecord('AUTO-BROWSER-390', {
    evidenceType: 'browser_acceptance', command: 'Independent Edge CDP 390x844', parsedTest: null,
    summary: '工作台操作完成。', viewport: '390x844', browserVersion: 'Edg/test',
    steps: ['九類切換', '草稿重載'], screenshotPath: 'artifacts/390.png',
  });
  const report = automaticReport({ records: [browserRecord] });
  const item = buildPrePilotReviewReport(createEmptyTeacherReviewDataset(), now, report).activities.find((entry) => entry.activityId === activity.activityId);
  assert.equal(item.engineering.browserEvidence['390x844'].status, '通過（已登錄）');
  assert.equal(item.engineering.browserEvidence['390x844'].latest.evidenceId, 'AUTO-BROWSER-390');
  assert.equal(item.engineering.browserEvidence['1366x768'].status, '尚未驗證');
  assert.notEqual(item.pilotReadiness, '符合提交教師決定是否試用的條件');
});

function automaticReport({ records = [], reportId = 'AUTO-REPORT-1' } = {}) {
  return {
    schemaVersion: ACCEPTANCE_EVIDENCE_SCHEMA_VERSION,
    reportId,
    generatedAt: now,
    coveredActivities: [...TEACHER_REVIEW_ACTIVITY_IDS],
    records,
    limitations: ['工程資料不代表教學效度或正式核准。'],
  };
}

function automaticRecord(id, overrides = {}) {
  return {
    evidenceId: id,
    evidenceType: 'automated_test',
    command: 'node --test test/*.test.mjs',
    status: 'passed',
    exitCode: 0,
    startedAt: now,
    finishedAt: now,
    durationMs: 100,
    summary: 'Node 測試 10 項：10 PASS、0 FAIL。',
    parsedTest: { tests: 10, passed: 10, failed: 0 },
    coverage: [...TEACHER_REVIEW_ACTIVITY_IDS],
    source: 'scripts/acceptance-evidence.mjs；Node TAP 測試摘要',
    limitations: '僅工程測試。',
    ...overrides,
  };
}

test('自動工程證據需格式完整、測試摘要可解析且實際零失敗才可標示通過', () => {
  const valid = automaticReport({ records: [automaticRecord('AUTO-TEST-1')] });
  assert.equal(validateAcceptanceEvidenceReport(valid).ok, true);
  const failedButPassed = automaticReport({ records: [automaticRecord('AUTO-BAD', { parsedTest: { tests: 10, passed: 9, failed: 1 } })] });
  assert.equal(validateAcceptanceEvidenceReport(failedButPassed).ok, false);
  const unrun = automaticReport({ records: [automaticRecord('AUTO-UNRUN', { status: 'not_run', exitCode: null, parsedTest: null })] });
  assert.equal(validateAcceptanceEvidenceReport(unrun).ok, true);
  const missingSource = automaticReport({ records: [automaticRecord('AUTO-NOSOURCE', { source: '' })] });
  assert.equal(validateAcceptanceEvidenceReport(missingSource).ok, false);
  const malformedNode = createEvidenceRecord({
    command: 'node --test test/*.test.mjs', kind: 'automated_test', startedAt: now, finishedAt: now,
    durationMs: 1, exitCode: 0, output: 'exit 0 but no TAP summary', coverage: [...TEACHER_REVIEW_ACTIVITY_IDS], source: 'fixture',
  });
  assert.equal(malformedNode.status, 'failed');
  const malformedMap = createEvidenceRecord({
    command: 'node scripts/learning-map.mjs', kind: 'mapping_validation', startedAt: now, finishedAt: now,
    durationMs: 1, exitCode: 0, output: 'not a map report', coverage: [...TEACHER_REVIEW_ACTIVITY_IDS], source: 'fixture',
  });
  assert.equal(malformedMap.status, 'failed');
});

test('通過的瀏覽器證據必須記錄指定 viewport、版本、操作步驟及截圖；未執行不可標通過', () => {
  const base = {
    evidenceId: 'BROWSER-1366', evidenceType: 'browser_acceptance', command: 'Edge CDP browser acceptance',
    status: 'passed', exitCode: 0, startedAt: now, finishedAt: now, durationMs: 10,
    summary: '工作台實際操作完成。', coverage: [...TEACHER_REVIEW_ACTIVITY_IDS], source: 'scripts/teacher-review-browser-acceptance.mjs',
    limitations: '僅為工程 UI 驗收。', viewport: '1366x768', browserVersion: 'Edg/155.0.4283.45',
    steps: ['切換九類活動', '儲存並重新載入隔離審查草稿'], screenshotPath: 'artifacts/teacher-review-acceptance/1366x768.png',
  };
  assert.equal(validateAcceptanceEvidenceReport(automaticReport({ records: [base] })).ok, true);
  assert.equal(validateAcceptanceEvidenceReport(automaticReport({ records: [{ ...base, steps: [] }] })).ok, false);
  assert.equal(validateAcceptanceEvidenceReport(automaticReport({ records: [{ ...base, screenshotPath: '' }] })).ok, false);
  assert.equal(validateAcceptanceEvidenceReport(automaticReport({ records: [{ ...base, status: 'not_run', exitCode: null, browserVersion: '', steps: [], screenshotPath: '' }] })).ok, true);
});

test('重新產生自動工程報告時保留既有瀏覽器驗收紀錄，無效舊報告不被靜默覆寫', () => {
  const browser = automaticRecord('BROWSER-PRESERVE', {
    evidenceType: 'browser_acceptance', command: 'Edge CDP 1366x768', parsedTest: null,
    summary: '實際瀏覽器操作完成。', viewport: '1366x768', browserVersion: 'Edg/test',
    steps: ['活動切換'], screenshotPath: 'artifacts/desktop.png',
  });
  const previous = automaticReport({ records: [browser] });
  const next = automaticReport({ records: [automaticRecord('NEW-TEST')] });
  const merged = preserveBrowserAcceptanceEvidence(next, previous);
  assert.deepEqual(merged.records.map((record) => record.evidenceId), ['NEW-TEST', 'BROWSER-PRESERVE']);
  assert.equal(validateAcceptanceEvidenceReport(merged).ok, true);
  assert.throws(() => preserveBrowserAcceptanceEvidence(next, { schemaVersion: 99 }), /拒絕覆寫/);
});

test('試用報告只用有效自動測試報告作工程證據，映射檢查不會變成官方課綱核對', () => {
  const data = createEmptyTeacherReviewDataset();
  const activity = TEACHER_REVIEW_ACTIVITIES[0];
  const report = automaticReport({ records: [
    automaticRecord('AUTO-TEST-1'),
    automaticRecord('AUTO-MAP-1', { evidenceType: 'mapping_validation', command: 'node scripts/learning-map.mjs', parsedTest: null, summary: 'PASS learning map: 6 grades, 12 semester slots, 3 subjects per term, 26 grade 3 scope entries.', source: 'scripts/learning-map.mjs' }),
  ] });
  const item = buildPrePilotReviewReport(data, now, report).activities.find((entry) => entry.activityId === activity.activityId);
  assert.equal(item.engineering.testEvidence.status, '通過（自動產生）');
  assert.equal(item.engineering.testEvidence.latest.command, 'node --test test/*.test.mjs');
  assert.equal(item.engineering.mappingEvidence.length, 1);
  assert.equal(item.curriculumVerified, false);
  assert.equal(item.teacherReviewEvidence.status, '尚未驗證');
  assert.notEqual(item.pilotReadiness, '符合提交教師決定是否試用的條件');
});

test('工程報告匯入先驗證，證據 ID 衝突時整份拒絕且不覆寫', () => {
  const current = automaticReport({ records: [automaticRecord('AUTO-CONFLICT')] });
  const same = mergeAcceptanceEvidenceReports(current, structuredClone(current));
  assert.equal(same.ok, true);
  assert.equal(same.changed, false);
  const conflicting = automaticReport({ records: [automaticRecord('AUTO-CONFLICT', { summary: 'different evidence' })], reportId: 'AUTO-REPORT-2' });
  const before = JSON.stringify(current);
  const result = mergeAcceptanceEvidenceReports(current, conflicting);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(current), before);
  assert.equal(mergeAcceptanceEvidenceReports(current, { schemaVersion: 99 }).ok, false);
});

test('試用報告即時反映逐題課綱證據及審查草稿，仍不自動核准', () => {
  const activity = TEACHER_REVIEW_ACTIVITIES.find((item) => item.title === '數的大小比較');
  const data = createEmptyTeacherReviewDataset();
  const q = activity.questions.find((item) => item.reviewable && item.answerId && !/preview|disabled/i.test(item.status ?? ''));
  data.evidenceRecords.push(evidence('CURRICULUM-Q', {
    scopeType: 'question', activityId: activity.activityId, questionId: q.questionId,
    evidenceType: 'curriculum_source_check', source: '官方課綱文件第 X 節（測試 fixture；不作真實核對）',
  }));
  const before = buildPrePilotReviewReport(data).activities.find((item) => item.activityId === activity.activityId);
  assert.equal(before.curriculumVerified, false, '其他可作答題仍缺逐題課綱核對');
  const questionReviewRecord = questionReview(q.questionId, { decision: 'needs_revision', notes: 'fixture: review pending' });
  data.questionReviews[activity.activityId] = { [q.questionId]: questionReviewRecord };
  const after = buildPrePilotReviewReport(data).activities.find((item) => item.activityId === activity.activityId);
  assert.equal(after.reviewProgress.questionDecisions.needs_revision, 1);
  assert.equal(after.openRevisionsResolved, false);
  assert.notEqual(after.candidateStatus, 'approved');
  assert.notEqual(after.pilotReadiness, '符合提交教師決定是否試用的條件');
});

test('匯入證據 ID 衝突整份拒絕，教師審查資料與遊戲進度儲存鍵隔離', () => {
  const current = createEmptyTeacherReviewDataset();
  current.evidenceRecords.push(evidence('EV-CONFLICT'));
  const incoming = createEmptyTeacherReviewDataset();
  incoming.evidenceRecords.push(evidence('EV-CONFLICT', { performedItems: '不同執行內容' }));
  const before = JSON.stringify(current);
  const conflict = mergeTeacherReviewDatasets(current, incoming);
  assert.equal(conflict.ok, false);
  assert.equal(JSON.stringify(current), before);

  const values = new Map([['taiwan-ai-adventure.prototype-progress.v1', '{"stars":2}']]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(saveTeacherReviewDataset(storage, current).ok, true);
  assert.equal(values.has('taiwan-ai-adventure.prototype-progress.v1'), true);
  assert.notEqual(TEACHER_REVIEW_STORAGE_KEY, 'taiwan-ai-adventure.prototype-progress.v1');
});

