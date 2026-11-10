import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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


export { approvedTestBundle, approvedTestQuestion };
