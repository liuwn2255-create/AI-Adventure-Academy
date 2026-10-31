import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TEACHER_REVIEW_QUESTION_IDS } from '../prototype/data/teacherReviewCatalog.js';

const base = new URL('../artifacts/', import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, base), 'utf8'));

test('第三輪候選題修訂是獨立 JSON v1，來源與題目／選項 ID 唯一且未進工作台目錄', async () => {
  const [revisions, round2, round1] = await Promise.all([
    readJson('number-secret-round3-candidate-items.json'),
    readJson('number-secret-round2-candidate-items.json'),
    readJson('number-secret-round1-candidate-revisions.json'),
  ]);
  assert.equal(revisions.schemaVersion, 1);
  assert.equal(revisions.status, 'candidate_revision_proposal_not_applied');
  assert.equal(revisions.revisions.length, 3);
  const ids = revisions.revisions.map((item) => item.questionId);
  assert.equal(new Set(ids).size, ids.length);
  const optionIds = revisions.revisions.flatMap((item) => item.options.map((option) => option.optionId));
  assert.equal(new Set(optionIds).size, optionIds.length);
  const round2OptionIds = round2.items.flatMap((item) => item.options.map((option) => option.optionId));
  for (const id of optionIds) assert.equal(round2OptionIds.includes(id), false, `選項 ID 與第二輪衝突：${id}`);
  const existing = Object.values(TEACHER_REVIEW_QUESTION_IDS).flat();
  for (const revision of revisions.revisions) {
    assert.ok(round2.items.some((item) => item.questionId === revision.sourceQuestionId));
    assert.equal(existing.includes(revision.questionId), false);
    assert.equal(round2.items.some((item) => item.questionId === revision.questionId), false);
    assert.equal(round1.revisions.some((item) => item.revisionId === revision.revisionId), false);
    assert.equal(revision.status, 'candidate_pending_teacher_review');
    assert.equal(revision.options.filter((option) => option.optionId === revision.answerId).length, 1);
    assert.equal(new Set(revision.options.map((option) => option.text)).size, revision.options.length);
    assert.equal(revision.hints.length, 2);
    assert.ok(revision.explanation && revision.learningObjective && revision.prerequisites.length);
    assert.equal(revision.reinforcementStatus, '尚無連結補強活動');
    assert.deepEqual(Object.keys(revision.wrongFeedback).sort(), [...new Set(revision.options.map((option) => option.errorType).filter(Boolean))].sort());
    for (const hint of revision.hints) assert.ok(!hint.includes(revision.options.find((option) => option.optionId === revision.answerId).text));
  }
});

test('第三輪 Q1 至 Q3 正解由題目條件獨立推導，修訂分別對齊可觀察能力', async () => {
  const { revisions } = await readJson('number-secret-round3-candidate-items.json');
  const byId = Object.fromEntries(revisions.map((item) => [item.sourceQuestionId, item]));
  const q1 = byId['NS-R2-DRAFT-Q01'];
  const q1Expected = q1.visual.digits[q1.visual.columns.indexOf('百位')] * 100;
  assert.equal(q1Expected, 200);
  assert.equal(q1.options.find((option) => option.optionId === q1.answerId).text, '200');
  assert.match(q1.learningObjective, /代表的數量/);
  assert.doesNotMatch(q1.learningObjective, /所在的位，以及/);

  const q2 = byId['NS-R2-DRAFT-Q02'];
  const d = q2.independentDerivation.digitsByPlace;
  assert.equal(d.thousands * 1000 + d.hundreds * 100 + d.tens * 10 + d.ones, 4056);
  assert.equal(Number(`${d.thousands}${d.tens}${d.ones}`), 456);
  assert.match(q2.learningObjective, /辨認/);
  assert.ok(q2.assessmentLimitations.some((limitation) => limitation.includes('自行說明')));

  const q3 = byId['NS-R2-DRAFT-Q03'];
  const { left, right, expectedGreater, firstDifferentPlace } = q3.independentDerivation;
  assert.equal(Math.max(left, right), expectedGreater);
  assert.equal(expectedGreater, 3402);
  const placeNames = ['thousands', 'hundreds', 'tens', 'ones'];
  const leftDigits = String(left).padStart(4, '0');
  const rightDigits = String(right).padStart(4, '0');
  const actualDifferenceIndex = [...leftDigits].findIndex((digit, index) => digit !== rightDigits[index]);
  assert.equal(placeNames[actualDifferenceIndex], 'hundreds');
  assert.equal(firstDifferentPlace, placeNames[actualDifferenceIndex]);
  assert.match(q3.options.find((option) => option.optionId === q3.answerId).text, /百位，4 大於 0/);
  assert.ok(q3.options.every((option) => option.text.includes('；因為')));
  assert.deepEqual(q3.curriculumEvidence.candidateCodes, []);
});

test('第三輪補強修訂保留候選、未連結狀態，且含分步操作與無提示遷移觀察', async () => {
  const [remediations, round2] = await Promise.all([
    readJson('number-secret-round3-remediation-candidates.json'),
    readJson('number-secret-round2-remediation-candidates.json'),
  ]);
  assert.equal(remediations.schemaVersion, 1);
  assert.equal(remediations.status, 'candidate_design_not_implemented_or_linked');
  assert.equal(remediations.revisions.length, 2);
  assert.equal(round2.remediations.length, 2);
  for (const revision of remediations.revisions) {
    assert.equal(revision.status, 'candidate_design_not_implemented_or_linked');
    assert.ok(round2.remediations.some((item) => item.remediationId === revision.sourceRemediationId));
    assert.ok(revision.studentAction.length >= 2);
    assert.equal(revision.hints.length, 2);
    assert.ok(revision.wrongFeedback);
    assert.ok(revision.differentRepresentationExercise.prompt);
    assert.ok(revision.differentRepresentationExercise.expectedResponseForTeacher);
    assert.ok(revision.differentRepresentationExercise.successEvidence);
    assert.ok(revision.returnPathSuggestion.includes('尚無') || revision.returnPathSuggestion.includes('尚未'));
    assert.ok(revision.prerequisitesToConfirm.length && revision.teacherDecisionQuestions.length);
  }
});
