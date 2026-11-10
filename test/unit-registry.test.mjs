import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateRegistryBundle,
  validateNewQuestionReference,
  validateNewLevelReferences,
} from '../scripts/unit-registry-validator.mjs';
import {
  validateQuestionPublication,
  validateLevelPublication,
} from '../scripts/publication-guard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const base = {
  registry: read('curriculum/unit-registry.json'),
  idHistory: read('curriculum/unit-id-history.json'),
  sources: read('curriculum/sources.json'),
  curriculumMap: read('curriculum/curriculum-map.json'),
};
const clone = (value) => structuredClone(value);
const codes = (errors) => errors.map((error) => error.code);

function approvedTestBundle() {
  const bundle = clone(base);
  // Synthetic proof exists only in this test fixture, never in official curriculum data.
  bundle.curriculumMap.verifiedLearningFocuses[0].sourceId = 'mathematics';
  bundle.curriculumMap.verifiedLearningFocuses[0].officialTextReviewStatus = 'verified_against_official_text';
  bundle.curriculumMap.verifiedLearningFocuses[0].verifiedClauses = [
    ...(bundle.curriculumMap.verifiedLearningFocuses[0].verifiedClauses ?? []), 'N-3-1'];
  const unit = bundle.registry.units[0];
  const scopeRef = `scope:${unit.unitId}@${unit.revision}`;
  const mapRef = `curriculum-map:${unit.curriculumMapIds[0]}`;
  unit.exceptions = [
    {
      exceptionId: 'EX-TEXTBOOK-TEST', ruleId: 'textbook_evidence_not_claimed',
      reason: '測試 fixture 不主張特定教材', approver: 'Test textbook reviewer',
      approverRole: '教材審查者', approvedAt: '2026-10-20T12:00:00+08:00',
      unitRevision: 1, evidenceRefs: [scopeRef],
    },
    {
      exceptionId: 'EX-PREREQ-TEST', ruleId: 'no_prerequisites_required',
      reason: '測試 fixture 假定教師已確認無先備', approver: 'Test subject teacher',
      approverRole: '領域教師', approvedAt: '2026-10-20T12:00:00+08:00',
      unitRevision: 1, evidenceRefs: [scopeRef],
    },
  ];
  unit.reviewRecords = [
    ['R-CURRICULUM', 'curriculum_alignment', 'Test curriculum reviewer', '課程專業人員', [mapRef]],
    ['R-TEXTBOOK', 'textbook_scope_version', 'Test textbook reviewer', '教材審查者', ['exception:EX-TEXTBOOK-TEST']],
    ['R-GRADE', 'grade_scope_prerequisites', 'Test grade teacher', '目標年級領域教師', ['exception:EX-PREREQ-TEST']],
    ['R-SCOPE-COURSE', 'scope_and_exclusions', 'Test scope professional', '課程專業人員', [mapRef]],
    ['R-SCOPE-TEACHER', 'scope_and_exclusions', 'Test scope teacher', '領域教師', [mapRef]],
  ].map(([reviewId, reviewType, reviewer, reviewerRole, evidenceRefs]) => ({
    reviewId, reviewType, decision: 'approved', reviewer, reviewerRole,
    reviewDate: '2026-10-20', unitRevision: 1, evidenceRefs, notes: '僅供自動化測試的合成審查資料。',
  }));
  unit.status = 'approved';
  unit.statusHistory.push({
    unitRevision: 1, fromStatus: 'candidate', toStatus: 'in_review',
    changedAt: '2026-10-20T12:01:00+08:00', actor: 'Test', actorRole: '測試 fixture',
    reason: '合成測試資料', reviewRecordIds: unit.reviewRecords.map((r) => r.reviewId),
  });
  unit.statusHistory.push({
    unitRevision: 1, fromStatus: 'in_review', toStatus: 'approved',
    changedAt: '2026-10-20T12:02:00+08:00', actor: 'Test', actorRole: '測試 fixture',
    reason: '合成測試資料；不是實際核准', reviewRecordIds: unit.reviewRecords.map((r) => r.reviewId),
  });
  unit.updatedAt = '2026-10-20T19:00:00+08:00';
  bundle.idHistory.reservedUnitIds[0].lastKnownStatus = 'approved';
  return bundle;
}

function approvedTestQuestion(overrides = {}) {
  const unit = base.registry.units[0];
  const source = base.sources.sources.find(({ id }) => id === 'mathematics');
  const review = Object.fromEntries(['curriculum', 'gradeLevelFit', 'answer', 'explanation'].map((key) => [key, {
    status: 'approved', reviewer: `Synthetic ${key} reviewer`, reviewerRole: '測試 fixture',
    reviewDate: '2026-10-20', revision: 4, unitRevision: unit.revision,
    notes: '未附教材證據；此合成測試題不主張特定教材。',
  }]));
  return {
    schemaVersion: 2, id: 'q-test', revision: 4, unitId: unit.unitId, unitRevision: unit.revision,
    subject: unit.subject, grade: 3, language: 'zh-Hant-TW', prompt: '測試題幹',
    interaction: { type: 'single_choice', options: [
      { optionId: 'option-a', text: '選項甲' }, { optionId: 'option-b', text: '選項乙' },
    ], answerId: 'option-a' },
    explanation: '測試解釋', difficulty: 'introductory', prerequisites: [],
    curriculumMappings: [{
      sourceId: source.id, sourceUrl: source.url, documentTitle: source.documentTitle,
      publicationInfo: source.publicationInfo,
      locations: [{ kind: 'content', code: 'N-3-1', pageOrSection: 'PDF頁序25', gradeScope: 'grade_level_content' }],
      verificationStatus: 'verified', verifiedBy: 'Synthetic curriculum reviewer', verifiedAt: '2026-10-20', notes: null,
    }],
    textbookEvidence: [], review, publicationStatus: 'approved',
    publicationRecord: { publisher: 'Synthetic independent publisher', publishedAt: '2026-10-20T12:00:00Z', revision: 4 },
    ...overrides,
  };
}

test('現有候選登錄及外鍵有效，且不虛構班級授課紀錄', () => {
  assert.deepEqual(validateRegistryBundle(clone(base)), []);
  const unit = base.registry.units[0];
  assert.equal(unit.status, 'candidate');
  assert.deepEqual(unit.textbookEvidence, []);
  assert.deepEqual(base.registry.classroomUseRecords, []);
  assert.deepEqual(unit.reviewRecords, []);
});

test('拒絕重複 unitId 及缺少 ID 歷史', () => {
  const data = clone(base);
  data.registry.units.push(clone(data.registry.units[0]));
  assert.ok(codes(validateRegistryBundle(data)).includes('duplicate'));
  const missingHistory = clone(base);
  missingHistory.idHistory = null;
  assert.ok(codes(validateRegistryBundle(missingHistory)).includes('schema'));
});

test('退休或其他已保留 ID 不可從單元歷史中刪除', () => {
  const data = clone(base);
  data.idHistory.reservedUnitIds[0].lastKnownStatus = 'retired';
  data.idHistory.reservedUnitIds[0].retiredAt = '2026-10-20T19:00:00+08:00';
  data.registry.units = [];
  assert.ok(codes(validateRegistryBundle(data)).includes('history'));
});

test('拒絕無效來源與課程地圖外鍵', () => {
  const data = clone(base);
  data.registry.units[0].curriculumMapIds = ['missing-map-id'];
  assert.ok(codes(validateRegistryBundle(data)).includes('foreign_key'));
  const sourceMismatch = clone(base);
  sourceMismatch.curriculumMap.verifiedLearningFocuses[0].sourceId = 'missing-source';
  assert.ok(codes(validateRegistryBundle(sourceMismatch)).includes('foreign_key'));
});

test('candidate 可保留明確空集合；重複／不存在的引用會失敗', () => {
  const emptyCandidate = clone(base);
  emptyCandidate.registry.units[0].curriculumMapIds = [];
  assert.deepEqual(validateRegistryBundle(emptyCandidate), []);
  const duplicateMapRef = clone(base);
  duplicateMapRef.registry.units[0].curriculumMapIds.push(duplicateMapRef.registry.units[0].curriculumMapIds[0]);
  assert.ok(codes(validateRegistryBundle(duplicateMapRef)).includes('duplicate'));
  const badEvidence = clone(base);
  badEvidence.registry.units[0].reviewRecords.push({
    reviewId: 'review-test', reviewType: 'curriculum_alignment', decision: 'pending_review',
    reviewer: 'unassigned', reviewerRole: '待指派', reviewDate: '2026-10-20', unitRevision: 1,
    evidenceRefs: ['curriculum-map:not-a-real-id'], notes: '測試失效引用',
  });
  assert.ok(codes(validateRegistryBundle(badEvidence)).includes('foreign_key'));
});

test('拒絕未允許的單元狀態及登錄／歷史狀態不一致', () => {
  const invalid = clone(base);
  invalid.registry.units[0].status = 'published';
  assert.ok(codes(validateRegistryBundle(invalid)).includes('enum'));
  const mismatch = clone(base);
  mismatch.idHistory.reservedUnitIds[0].lastKnownStatus = 'in_review';
  assert.ok(codes(validateRegistryBundle(mismatch)).includes('state'));
});

test('approved 單元缺少任一必要專業審查即失敗', () => {
  const data = clone(base);
  data.registry.units[0].status = 'approved';
  data.idHistory.reservedUnitIds[0].lastKnownStatus = 'approved';
  data.registry.units[0].statusHistory.push({
    unitRevision: 1, fromStatus: 'candidate', toStatus: 'approved',
    changedAt: '2026-10-20T19:00:00+08:00', actor: 'test fixture', actorRole: 'test',
    reason: '僅供負向驗證案例', reviewRecordIds: [],
  });
  const errors = validateRegistryBundle(data);
  assert.ok(codes(errors).includes('approval_gate'));
  assert.equal(errors.filter((error) => error.code === 'approval_gate').length >= 4, true);
});

test('新題發布拒絕 candidate、in_review、retired、缺失單元及錯誤版本', () => {
  const question = { id: 'test-q', revision: 8, unitId: 'M3-NUM-01', unitRevision: 1, subject: 'mathematics' };
  assert.ok(codes(validateNewQuestionReference(question, base.registry)).includes('approval_gate'));
  for (const status of ['in_review', 'retired']) {
    const registry = clone(base.registry);
    registry.units[0].status = status;
    assert.ok(codes(validateNewQuestionReference(question, registry)).includes('approval_gate'));
  }
  assert.ok(codes(validateNewQuestionReference({ ...question, unitId: 'NO-SUCH-UNIT' }, base.registry)).includes('foreign_key'));
  assert.ok(codes(validateNewQuestionReference({ ...question, unitRevision: 99 }, base.registry)).includes('revision_mismatch'));
  assert.ok(codes(validateNewQuestionReference({ ...question, revision: 0 }, base.registry)).includes('type'));
});

test('題目 revision 與 unitRevision 獨立；驗證不會改寫歷史引用', () => {
  const historicalQuestion = { id: 'old-q', revision: 12, unitId: 'M3-NUM-01', unitRevision: 1 };
  const before = clone(historicalQuestion);
  const registry = clone(base.registry);
  registry.units[0].revision = 2;
  registry.units[0].supersedesRevision = 1;
  registry.units[0].changeSummary = '測試用版本';
  const snapshot = clone(base.registry.units[0]);
  delete snapshot.revisionHistory;
  registry.units[0].revisionHistory = [{ revision: 1, snapshot }];
  const errors = validateNewQuestionReference(historicalQuestion, registry);
  assert.ok(codes(errors).includes('stale_unit_revision'));
  assert.equal(historicalQuestion.revision, 12);
  assert.equal(historicalQuestion.unitRevision, 1);
  assert.deepEqual(historicalQuestion, before);
});

test('新關卡拒絕未發布題目或不存在的精確題目 revision', () => {
  const question = { id: 'q', revision: 1, unitId: 'M3-NUM-01', unitRevision: 1, publicationStatus: 'draft' };
  const level = { interactions: [{ questionRefs: [{ questionId: 'q', revision: 1 }] }] };
  const errors = validateNewLevelReferences(level, [question], base.registry);
  assert.ok(codes(errors).includes('approval_gate'));
  assert.ok(codes(validateNewLevelReferences(level, [], base.registry)).includes('foreign_key'));
});

test('新關卡對 candidate、in_review、retired 或不存在單元的題目均 fail closed', () => {
  const question = { id: 'q', revision: 1, unitId: 'M3-NUM-01', unitRevision: 1, publicationStatus: 'published' };
  const level = { interactions: [{ questionRefs: [{ questionId: 'q', revision: 1 }] }] };
  for (const status of ['candidate', 'in_review', 'retired']) {
    const registry = clone(base.registry);
    registry.units[0].status = status;
    assert.ok(codes(validateNewLevelReferences(level, [question], registry)).includes('approval_gate'));
  }
  assert.ok(codes(validateNewLevelReferences(level, [question], { units: [] })).includes('foreign_key'));
});

test('班級 ready_for_class 缺少授課／先備確認證據時失敗', () => {
  const data = clone(base);
  data.registry.classroomUseRecords.push({
    classroomUseRecordId: 'class-record-test', unitId: 'M3-NUM-01', unitRevision: 1,
    cohortId: 'test-cohort', schoolYear: 'test', status: 'ready_for_class',
    teachingRecords: [], prerequisiteChecks: [],
    teacherConfirmation: { teacherName: '', teacherRole: '', confirmedAt: null, decision: 'ready_for_class' },
  });
  const errors = validateRegistryBundle(data);
  assert.ok(codes(errors).includes('approval_gate'));
});

test('共用發布入口接受僅存在於測試中的核准完整單元', () => {
  const registryBundle = approvedTestBundle();
  assert.deepEqual(validateRegistryBundle(clone(registryBundle)), []);
  const question = approvedTestQuestion();
  assert.deepEqual(validateQuestionPublication({ question, registryBundle }), []);
  const publishedQuestion = { ...question, publicationStatus: 'published' };
  const level = { interactions: [{ questionRefs: [{ questionId: 'q-test', revision: 4 }] }] };
  assert.deepEqual(validateLevelPublication({ level, questions: [publishedQuestion], registryBundle }), []);
});

test('題目發布檢查完整驗證 schema v2、題型、課綱證據、四項審查及發布紀錄', () => {
  const registryBundle = approvedTestBundle();
  const valid = approvedTestQuestion();
  assert.deepEqual(validateQuestionPublication({ question: valid, registryBundle }), []);

  const badSchema = { ...valid, schemaVersion: 1 };
  assert.ok(codes(validateQuestionPublication({ question: badSchema, registryBundle })).includes('schema'));
  const badInteraction = { ...valid, interaction: { ...valid.interaction, type: 'free_text' } };
  assert.ok(codes(validateQuestionPublication({ question: badInteraction, registryBundle })).includes('enum'));
  const badAnswer = { ...valid, interaction: { ...valid.interaction, answerId: 'missing-option' } };
  assert.ok(codes(validateQuestionPublication({ question: badAnswer, registryBundle })).includes('foreign_key'));

  const badMapping = structuredClone(valid);
  badMapping.curriculumMappings[0].verificationStatus = 'pending_verification';
  assert.ok(codes(validateQuestionPublication({ question: badMapping, registryBundle })).includes('approval_gate'));
  const missingSource = structuredClone(valid);
  missingSource.curriculumMappings[0].sourceId = 'missing-source';
  assert.ok(codes(validateQuestionPublication({ question: missingSource, registryBundle })).includes('foreign_key'));

  const badReview = structuredClone(valid);
  badReview.review.answer.revision += 1;
  assert.ok(codes(validateQuestionPublication({ question: badReview, registryBundle })).includes('revision_mismatch'));
  const unapprovedReview = structuredClone(valid);
  unapprovedReview.review.explanation.status = 'pending_review';
  assert.ok(codes(validateQuestionPublication({ question: unapprovedReview, registryBundle })).includes('approval_gate'));

  const missingPublicationRecord = { ...valid, publicationRecord: null };
  assert.ok(codes(validateQuestionPublication({ question: missingPublicationRecord, registryBundle })).includes('required'));
  const wrongPublicationRevision = { ...valid, publicationRecord: { ...valid.publicationRecord, revision: 3 } };
  assert.ok(codes(validateQuestionPublication({ question: wrongPublicationRevision, registryBundle })).includes('revision_mismatch'));
  const reviewerPublishes = { ...valid, publicationRecord: { ...valid.publicationRecord, publisher: valid.review.answer.reviewer } };
  assert.ok(codes(validateQuestionPublication({ question: reviewerPublishes, registryBundle })).includes('reviewer_conflict'));

  const unexplainedEmptyEvidence = structuredClone(valid);
  for (const item of Object.values(unexplainedEmptyEvidence.review)) item.notes = null;
  assert.ok(codes(validateQuestionPublication({ question: unexplainedEmptyEvidence, registryBundle })).includes('required'));
  assert.deepEqual(validateQuestionPublication({ question: valid, registryBundle }), []);
});

test('題目發布要求 language 與非空 difficulty，但不推定未定義的 difficulty enum', () => {
  const registryBundle = approvedTestBundle();
  const valid = approvedTestQuestion();
  assert.deepEqual(validateQuestionPublication({ question: valid, registryBundle }), []);

  const missingLanguage = structuredClone(valid);
  delete missingLanguage.language;
  assert.ok(validateQuestionPublication({ question: missingLanguage, registryBundle })
    .some((error) => error.path === 'question.language' && error.code === 'required'));

  const missingDifficulty = structuredClone(valid);
  delete missingDifficulty.difficulty;
  assert.ok(validateQuestionPublication({ question: missingDifficulty, registryBundle })
    .some((error) => error.path === 'question.difficulty' && error.code === 'required'));

  const emptyDifficulty = { ...valid, difficulty: '  ' };
  assert.ok(validateQuestionPublication({ question: emptyDifficulty, registryBundle })
    .some((error) => error.path === 'question.difficulty' && error.code === 'required'));
});

test('課綱 sourceUrl 必須與 sourceId 的正式登錄來源一致', () => {
  const registryBundle = approvedTestBundle();
  const valid = approvedTestQuestion();
  assert.deepEqual(validateQuestionPublication({ question: valid, registryBundle }), []);

  const mismatchedUrl = structuredClone(valid);
  mismatchedUrl.curriculumMappings[0].sourceUrl = 'https://example.org/different-official-guideline.pdf';
  assert.ok(validateQuestionPublication({ question: mismatchedUrl, registryBundle })
    .some((error) => error.path === 'question.curriculumMappings[0].sourceUrl'
      && error.code === 'source_mismatch'));
});

test('題目核對、審查及發布日期拒絕不存在的日曆日期並接受有效日期', () => {
  const registryBundle = approvedTestBundle();
  const valid = approvedTestQuestion();
  const leapDay = structuredClone(valid);
  leapDay.curriculumMappings[0].verifiedAt = '2024-02-29';
  for (const review of Object.values(leapDay.review)) review.reviewDate = '2024-02-29';
  leapDay.publicationRecord.publishedAt = '2024-02-29T23:59:59.123+08:00';
  assert.deepEqual(validateQuestionPublication({ question: leapDay, registryBundle }), []);

  const invalidVerifiedAt = structuredClone(valid);
  invalidVerifiedAt.curriculumMappings[0].verifiedAt = '2026-02-30';
  assert.ok(validateQuestionPublication({ question: invalidVerifiedAt, registryBundle })
    .some((error) => error.path === 'question.curriculumMappings[0].verifiedAt' && error.code === 'format'));

  const invalidReviewDate = structuredClone(valid);
  invalidReviewDate.review.answer.reviewDate = '2026-02-30';
  assert.ok(validateQuestionPublication({ question: invalidReviewDate, registryBundle })
    .some((error) => error.path === 'question.review.answer.reviewDate' && error.code === 'format'));

  const invalidPublishedAt = structuredClone(valid);
  invalidPublishedAt.publicationRecord.publishedAt = '2026-02-30T12:00:00Z';
  assert.ok(validateQuestionPublication({ question: invalidPublishedAt, registryBundle })
    .some((error) => error.path === 'question.publicationRecord.publishedAt' && error.code === 'format'));
});

test('共用發布入口拒絕缺少核准證據或無效課綱來源／地圖引用', () => {
  const question = { id: 'q-test', revision: 4, unitId: 'M3-NUM-01', unitRevision: 1 };
  const incomplete = approvedTestBundle();
  incomplete.registry.units[0].reviewRecords = [];
  assert.ok(codes(validateQuestionPublication({ question, registryBundle: incomplete })).includes('approval_gate'));
  const badMap = approvedTestBundle();
  badMap.registry.units[0].curriculumMapIds = ['not-a-map-id'];
  assert.ok(codes(validateQuestionPublication({ question, registryBundle: badMap })).includes('foreign_key'));
  const badSource = approvedTestBundle();
  badSource.curriculumMap.verifiedLearningFocuses[0].sourceId = 'not-a-source-id';
  assert.ok(codes(validateLevelPublication({ level: { interactions: [] }, questions: [], registryBundle: badSource })).includes('foreign_key'));
});

test('共用發布檢查不修改輸入，舊單元版題目／關卡不會被自動改綁', () => {
  const registryBundle = approvedTestBundle();
  const question = approvedTestQuestion({ id: 'old-q', revision: 9, publicationRecord: {
    publisher: 'Synthetic independent publisher', publishedAt: '2026-10-20T12:00:00Z', revision: 9,
  } });
  const level = { interactions: [{ questionRefs: [{ questionId: 'old-q', revision: 9 }] }] };
  const questions = [{ ...question, publicationStatus: 'published' }];
  const before = JSON.stringify({ registryBundle, question, level, questions });
  registryBundle.registry.units[0].revision = 2;
  registryBundle.registry.units[0].supersedesRevision = 1;
  registryBundle.registry.units[0].changeSummary = '合成測試版本更新';
  const oldSnapshot = clone(registryBundle.registry.units[0]);
  oldSnapshot.revision = 1;
  oldSnapshot.status = 'approved';
  delete oldSnapshot.revisionHistory;
  oldSnapshot.statusHistory = oldSnapshot.statusHistory.filter((event) => event.toStatus === 'candidate' || event.toStatus === 'in_review' || event.toStatus === 'approved');
  registryBundle.registry.units[0].revisionHistory = [{ revision: 1, snapshot: oldSnapshot }];
  registryBundle.registry.units[0].status = 'candidate';
  registryBundle.registry.units[0].statusHistory = [{
    unitRevision: 2, fromStatus: null, toStatus: 'candidate', changedAt: '2026-10-20T12:03:00+08:00',
    actor: 'Test', actorRole: '測試 fixture', reason: '合成新版', reviewRecordIds: [],
  }];
  registryBundle.idHistory.reservedUnitIds[0].lastKnownStatus = 'candidate';
  const beforeCall = JSON.stringify({ registryBundle, question, level, questions });
  const errors = validateLevelPublication({ level, questions, registryBundle });
  assert.ok(codes(errors).includes('stale_unit_revision'));
  assert.equal(question.unitRevision, 1);
  assert.equal(level.interactions[0].questionRefs[0].revision, 9);
  assert.equal(JSON.stringify({ registryBundle, question, level, questions }), beforeCall);
  assert.notEqual(before, beforeCall);
});

test('關卡發布拒絕重複 questionId@revision 並重驗引用題目的完整發布條件', () => {
  const registryBundle = approvedTestBundle();
  const question = { ...approvedTestQuestion(), publicationStatus: 'published' };
  const level = { interactions: [{ questionRefs: [
    { questionId: question.id, revision: question.revision },
    { questionId: question.id, revision: question.revision },
  ] }] };
  const duplicateReference = validateLevelPublication({ level, questions: [question], registryBundle });
  assert.ok(codes(duplicateReference).includes('duplicate'));

  const duplicateQuestionData = validateLevelPublication({
    level: { interactions: [{ questionRefs: [{ questionId: question.id, revision: question.revision }] }] },
    questions: [question, structuredClone(question)], registryBundle,
  });
  assert.ok(codes(duplicateQuestionData).includes('duplicate'));

  const incompletePublishedQuestion = structuredClone(question);
  incompletePublishedQuestion.review.curriculum.status = 'returned';
  const fullPublicationErrors = validateLevelPublication({
    level: { interactions: [{ questionRefs: [{ questionId: question.id, revision: question.revision }] }] },
    questions: [incompletePublishedQuestion], registryBundle,
  });
  assert.ok(codes(fullPublicationErrors).includes('approval_gate'));

  const staleUnitQuestion = structuredClone(question);
  staleUnitQuestion.unitRevision = 99;
  const staleUnitErrors = validateLevelPublication({
    level: { interactions: [{ questionRefs: [{ questionId: question.id, revision: question.revision }] }] },
    questions: [staleUnitQuestion], registryBundle,
  });
  assert.equal(codes(staleUnitErrors).filter((code) => code === 'stale_unit_revision').length, 1);
});


test('AUTO-02 拒絕來源未核實的課綱條文', () => {
  const registryBundle = approvedTestBundle();
  const question = approvedTestQuestion();
  question.curriculumMappings[0].locations[0].code = 'NOT-VERIFIED';
  assert.ok(codes(validateQuestionPublication({ question, registryBundle })).includes('unverified_mapping'));
});

test('AUTO-02 拒絕非法時鐘與時區值', () => {
  const registryBundle = approvedTestBundle();
  for (const publishedAt of ['2026-10-20T24:00:00Z', '2026-10-20T12:60:00Z', '2026-10-20T12:00:60Z', '2026-10-20T12:00:00+24:00', '2026-10-20T12:00:00+08:60']) {
    const question = approvedTestQuestion();
    question.publicationRecord.publishedAt = publishedAt;
    assert.ok(codes(validateQuestionPublication({ question, registryBundle })).includes('format'), publishedAt);
  }
});
