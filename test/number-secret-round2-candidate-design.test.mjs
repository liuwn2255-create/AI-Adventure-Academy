import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  TEACHER_REVIEW_ACTIVITIES,
  TEACHER_REVIEW_QUESTION_IDS,
} from '../prototype/data/teacherReviewCatalog.js';

const itemUrl = new URL('../artifacts/number-secret-round2-candidate-items.json', import.meta.url);
const remediationUrl = new URL('../artifacts/number-secret-round2-remediation-candidates.json', import.meta.url);
const priorRevisionUrl = new URL('../artifacts/number-secret-round1-candidate-revisions.json', import.meta.url);

async function loadJson(url) {
  return JSON.parse(await readFile(url, 'utf8'));
}

function optionFor(item, optionId) {
  return item.options.find((option) => option.optionId === optionId);
}

function uniqueness(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} 必須唯一`);
}

test('第二輪候選資料與補強資料均為完整 JSON v1，ID 唯一且不與既有題目／修訂衝突', async () => {
  const items = await loadJson(itemUrl);
  const remediations = await loadJson(remediationUrl);
  const prior = await loadJson(priorRevisionUrl);
  assert.equal(items.schemaVersion, 1);
  assert.equal(items.datasetId, 'number-secret-round2-candidate-items');
  assert.equal(items.status, 'candidate_pending_teacher_review');
  assert.equal(remediations.schemaVersion, 1);
  assert.equal(remediations.datasetId, 'number-secret-round2-remediation-candidates');
  assert.equal(remediations.status, 'candidate_design_not_implemented_or_linked');
  assert.equal(items.items.length, 4);
  const ids = items.items.map((item) => item.questionId);
  uniqueness(ids, '候選題目 ID');
  const existingQuestionIds = Object.values(TEACHER_REVIEW_QUESTION_IDS).flat();
  for (const id of ids) {
    assert.equal(existingQuestionIds.includes(id), false, `與工作台既有項目衝突：${id}`);
    assert.equal(prior.revisions.some((revision) => revision.questionId === id || revision.revisionId === id), false);
  }
  uniqueness(items.items.flatMap((item) => item.options.map((option) => option.optionId)), '選項 ID');
  uniqueness(remediations.remediations.map((item) => item.remediationId), '補強候選 ID');
  assert.equal(TEACHER_REVIEW_ACTIVITIES.some((activity) => activity.questions.some((question) => ids.includes(question.questionId))), false,
    '候選設計不得意外接入教師工作台目錄');
});

test('題目必要欄位、答案參照、錯答回饋對應及兩層提示均完整', async () => {
  const dataset = await loadJson(itemUrl);
  for (const item of dataset.items) {
    assert.ok(item.questionId && item.prompt && item.learningObjective);
    assert.equal(item.status, 'candidate_pending_teacher_review');
    assert.ok(item.curriculumEvidence?.status);
    assert.ok(item.prerequisites?.length);
    assert.equal(item.prerequisiteStatus, 'pending_teacher_confirmation');
    assert.equal(item.hints.length, 2);
    assert.ok(item.wrongFeedback && item.reinforcement);
    assert.equal(item.reinforcement.status, 'candidate_proposal_only_not_implemented_or_linked');
    assert.ok(item.transferEvidence && item.notAssessed.length && item.teacherQuestions.length);
    assert.equal(item.options.filter((option) => option.optionId === item.answerId).length, 1,
      `${item.questionId} 正解必須唯一且存在於選項`);
    const errorTypes = item.options.map((option) => option.errorType).filter(Boolean);
    assert.deepEqual(Object.keys(item.wrongFeedback).sort(), [...new Set(errorTypes)].sort(),
      `${item.questionId} 的每一種錯答線索都須有相應回饋，且不能多造錯誤類型`);
    const correctText = optionFor(item, item.answerId).text;
    for (const hint of item.hints) {
      assert.notEqual(hint, correctText, `${item.questionId} 提示不可直接複製正解選項`);
    }
  }
});

test('四題答案由題目條件獨立導出並與選項、解析相符', async () => {
  const { items } = await loadJson(itemUrl);
  const [tableItem, zeroItem, comparisonItem, quantityItem] = items;

  const table = tableItem.visual;
  const tableDigits = Object.fromEntries(table.columns.map((column, index) => [column, table.digits[index]]));
  const tableExpected = tableDigits['百位'] * 100;
  assert.equal(tableExpected, 200);
  assert.equal(optionFor(tableItem, tableItem.answerId).text, String(tableExpected));
  assert.match(tableItem.explanation, /百位/);
  assert.match(tableItem.explanation, /200/);
  assert.ok(tableItem.hints.every((hint) => !hint.includes(String(tableExpected))));

  const zeroDigits = zeroItem.independentDerivation.digitsByPlace;
  const independentlyRebuilt = zeroDigits.thousands * 1000 + zeroDigits.hundreds * 100 + zeroDigits.tens * 10 + zeroDigits.ones;
  const withMiddleZeroRemoved = Number(`${zeroDigits.thousands}${zeroDigits.tens}${zeroDigits.ones}`);
  assert.equal(independentlyRebuilt, 4056);
  assert.equal(withMiddleZeroRemoved, 456);
  assert.notEqual(independentlyRebuilt, withMiddleZeroRemoved);
  const zeroAnswer = optionFor(zeroItem, zeroItem.answerId).text;
  assert.match(zeroAnswer, /百位沒有百/);
  assert.match(zeroAnswer, /5 仍在十位/);
  assert.match(zeroAnswer, /6 仍在個位/);
  assert.match(zeroItem.explanation, /改變各數字的位值/);

  const comparison = comparisonItem.independentDerivation;
  const expectedGreater = Math.max(comparison.left, comparison.right);
  assert.equal(expectedGreater, 3402);
  assert.equal(optionFor(comparisonItem, comparisonItem.answerId).text, '3,402');
  assert.match(comparisonItem.explanation, /千位都是 3/);
  assert.match(comparisonItem.explanation, /百位/);
  assert.ok(comparisonItem.hints.every((hint) => !hint.includes('3,402')));

  const counts = quantityItem.independentDerivation.counts;
  const groupedTotal = counts.thousands * 1000 + counts.hundreds * 100 + counts.tens * 10 + counts.ones;
  assert.equal(groupedTotal, 6032);
  assert.equal(optionFor(quantityItem, quantityItem.answerId).text, '6,032');
  assert.match(quantityItem.explanation, /百位寫 0/);
  assert.match(quantityItem.explanation, /6,032/);
  assert.ok(quantityItem.hints.every((hint) => !hint.includes('6,032')));
});

test('Q1/Q2 補強只是候選草案，連結來源明確且具有操作、提示、回饋與轉移觀察', async () => {
  const dataset = await loadJson(remediationUrl);
  assert.equal(dataset.remediations.length, 2);
  assert.deepEqual(dataset.remediations.map((item) => item.sourceQuestionId), [
    'V2-DRAFT-M3-NUM-01-01', 'V2-DRAFT-M3-NUM-01-02',
  ]);
  for (const remediation of dataset.remediations) {
    assert.equal(remediation.status, 'candidate_design_not_implemented_or_linked');
    assert.equal(remediation.hints.length, 2);
    assert.ok(remediation.teachingPurpose);
    assert.ok(remediation.studentAction.length >= 2);
    assert.ok(remediation.wrongFeedback);
    assert.ok(remediation.differentRepresentationExercise.prompt);
    assert.ok(remediation.differentRepresentationExercise.successEvidence);
    assert.ok(remediation.returnPathSuggestion.includes('尚未') || remediation.returnPathSuggestion.includes('未由') || remediation.returnPathSuggestion.includes('尚無'));
    assert.ok(remediation.prerequisitesToConfirm.length);
    assert.ok(remediation.teacherDecisionQuestions.length);
  }
});
