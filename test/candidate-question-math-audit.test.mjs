import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidateQuestionMathAudit, verifyCandidateQuestion } from '../scripts/candidate-question-math-audit.mjs';
import { mergeAcceptanceEvidenceReports, preserveBrowserAcceptanceEvidence } from '../scripts/acceptance-evidence.mjs';
import { validateAcceptanceEvidenceReport } from '../prototype/acceptanceEvidence.js';
import { TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE, TEACHER_REVIEW_ACTIVITY_IDS } from '../prototype/data/teacherReviewCatalog.js';

const records = buildCandidateQuestionMathAudit({ now: '2026-10-22T00:00:00.000Z' });
const items = TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE.flatMap((activity) => activity.questions.map((question) => ({ activity, question })));
const byQuestionId = new Map(records.map((record) => [record.questionId, record]));

test('九類候選工作台 40 項均有獨立推導核驗及穩定唯一識別碼', () => {
  assert.equal(records.length, 40);
  assert.equal(new Set(records.map((record) => record.evidenceId)).size, 40);
  assert.equal(new Set(records.map((record) => record.questionId)).size, 40);
  assert.deepEqual(records.filter((record) => record.status === 'failed').map((record) => record.questionId), []);
  assert.equal(records.filter((record) => record.status === 'passed').length, 39);
  assert.equal(records.filter((record) => record.status === 'not_applicable').length, 1);
  for (const record of records) {
    assert.ok(record.source);
    assert.ok(record.answerAudit.derivation);
    assert.equal(record.teacherReviewStatus, 'unreviewed');
    assert.equal(record.answerAudit.manualChecks.stemUniqueness, 'manual_review_required');
    assert.equal(record.coverage.length, 1);
  }
});

test('每個可作答項目的獨立計算／推導與設定答案相符，唯讀與停用題分開處理', () => {
  for (const { question } of items) {
    const result = byQuestionId.get(question.questionId);
    assert.ok(result, question.questionId);
    if (!question.reviewable) {
      assert.equal(result.status, 'not_applicable', question.questionId);
      assert.equal(result.answerAudit.answerStatus, 'not_applicable');
    } else {
      assert.equal(result.answerAudit.answerStatus, 'passed', question.questionId);
      assert.equal(result.answerAudit.derivedOptionId, question.answerId, question.questionId);
    }
  }
  const preview = byQuestionId.get('V2-DRAFT-M3-NUM-01-03');
  assert.equal(preview.itemKind, 'read_only_preview');
  assert.equal(preview.answerAudit.expectedText, '3,142');
  const disabled = byQuestionId.get('V2-DRAFT-M3-NUM-01-04');
  assert.equal(disabled.itemKind, 'disabled');
  assert.equal(disabled.answerAudit.answerStatus, 'not_applicable');
});

test('核驗器會攔截錯置答案、重複選項及直接洩漏正解的提示', () => {
  const comparison = items.find(({ question }) => question.questionId === 'comparison-demo-01');
  const badAnswer = verifyCandidateQuestion(comparison.activity, { ...comparison.question, answerId: 'cmp-01-b' });
  assert.equal(badAnswer.status, 'failed');
  assert.ok(badAnswer.issues.some((issue) => issue.includes('獨立推導結果')));

  const duplicateChoice = verifyCandidateQuestion(comparison.activity, {
    ...comparison.question,
    options: comparison.question.options.map((option, index) => index === 2 ? { ...option, text: '3,425' } : option),
  });
  assert.equal(duplicateChoice.status, 'failed');
  assert.ok(duplicateChoice.issues.some((issue) => issue.includes('文字重複')));

  const placeValue = items.find(({ question }) => question.questionId === 'V2-DRAFT-M3-NUM-01-01');
  const leakingHint = verifyCandidateQuestion(placeValue.activity, { ...placeValue.question, hints: ['答案是十位。', ...placeValue.question.hints.slice(1)] });
  assert.equal(leakingHint.status, 'failed');
  assert.equal(leakingHint.support.hints, 'answer_leak_detected');
});

test('核驗明確保留圖像可讀性、題意唯一性和教學適切性的人工確認邊界', () => {
  const visual = records.find((record) => record.questionId === 'FRACTION-DRAFT-M3-N39-05');
  assert.equal(visual.answerAudit.manualChecks.renderedVisualReadability, 'manual_review_required');
  assert.equal(visual.answerAudit.manualChecks.pedagogicalAlignment, 'manual_review_required');
  assert.match(visual.limitations, /不證明題意無歧義/);
  const textOnly = records.find((record) => record.questionId === 'ADD-SUB-DRAFT-M3-N32-01');
  assert.equal(textOnly.answerAudit.manualChecks.renderedVisualReadability, 'not_applicable');
  assert.equal(textOnly.answerAudit.manualChecks.stemUniqueness, 'manual_review_required');
});

test('提示、錯答回饋與補救連結狀態按現有資料分類，不虛構補救路由', () => {
  const linked = records.filter((record) => record.answerAudit.support.remediation === 'candidate_route_check_required');
  assert.ok(linked.length > 0);
  const absent = records.filter((record) => record.answerAudit.support.remediation === 'not_provided');
  assert.ok(absent.length > 0);
  assert.ok(absent.every((record) => record.answerAudit.support.remediation === 'not_provided'));
  assert.ok(records.every((record) => ['present_candidate_only', 'not_provided'].includes(record.answerAudit.support.wrongFeedback)));
});

test('逐題答案核驗證據符合既有 schema v1，能防止重複 ID 靜默衝突且不升級候選', () => {
  const now = '2026-10-22T00:00:00.000Z';
  const base = { schemaVersion: 1, reportId: 'R-1', generatedAt: now, coveredActivities: [...TEACHER_REVIEW_ACTIVITY_IDS], records, limitations: ['工程資料不證明教學效度。'] };
  assert.equal(validateAcceptanceEvidenceReport(base).ok, true);
  const duplicate = structuredClone(base);
  duplicate.reportId = 'R-2';
  duplicate.records[0] = { ...duplicate.records[0], summary: 'conflicting record' };
  assert.equal(mergeAcceptanceEvidenceReports(base, duplicate).ok, false);

  const preserved = preserveBrowserAcceptanceEvidence({ ...base, records: [] }, base);
  assert.equal(preserved.records.length, 40);
  assert.ok(preserved.records.every((record) => record.teacherReviewStatus === 'unreviewed'));
  assert.ok(records.every((record) => record.activityId && record.itemKind));
  const fakeApproval = structuredClone(base);
  fakeApproval.records[0].teacherReviewStatus = 'approved';
  assert.equal(validateAcceptanceEvidenceReport(fakeApproval).ok, false, '工程核驗不得代填教師審查結果');
  const movedTeacherState = structuredClone(base);
  movedTeacherState.records[0].answerAudit.teacherReviewStatus = 'approved';
  assert.equal(validateAcceptanceEvidenceReport(movedTeacherState).ok, false, '教師狀態不得藏在答案核驗資料中');
});
