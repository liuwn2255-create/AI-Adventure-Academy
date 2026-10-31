import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TEACHER_REVIEW_ACTIVITIES, TEACHER_REVIEW_QUESTION_IDS } from '../prototype/data/teacherReviewCatalog.js';

const artifacts = new URL('../artifacts/', import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, artifacts), 'utf8'));

test('R4 題目與補救稿是獨立 schema v1 候選資料，識別碼唯一且沒有接入工作台', async () => {
  const [r1, r2, r2Rem, r3, r3Rem, r4, r4Rem] = await Promise.all([
    readJson('number-secret-round1-candidate-revisions.json'),
    readJson('number-secret-round2-candidate-items.json'),
    readJson('number-secret-round2-remediation-candidates.json'),
    readJson('number-secret-round3-candidate-items.json'),
    readJson('number-secret-round3-remediation-candidates.json'),
    readJson('number-secret-round4-candidate-items.json'),
    readJson('number-secret-round4-remediation-candidates.json'),
  ]);
  assert.equal(r4.schemaVersion, 1);
  assert.equal(r4.status, 'candidate_revision_proposal_not_applied');
  assert.equal(r4Rem.schemaVersion, 1);
  assert.equal(r4Rem.status, 'candidate_design_not_implemented_or_linked');
  assert.equal(r4.revisions.length, 4);
  assert.equal(r4Rem.revisions.length, 4);
  const r4Ids = r4.revisions.flatMap((x) => [x.revisionId, x.questionId, ...x.sourceQuestionIds]);
  const remIds = r4Rem.revisions.map((x) => x.revisionId);
  assert.equal(new Set(r4.revisions.map((x) => x.revisionId)).size, 4);
  assert.equal(new Set(r4.revisions.map((x) => x.questionId)).size, 4);
  assert.equal(new Set(remIds).size, 4);
  for (const revision of r4.revisions) {
    assert.equal(revision.status, revision.questionId === 'NS-R4-DRAFT-Q04' ? 'candidate_wording_proposal_not_applied' : 'candidate_pending_teacher_review');
    assert.ok(revision.changeReason && revision.answerKey && revision.independentDerivation);
    assert.ok(revision.teacherQuestions.length && revision.prerequisites.length);
    assert.ok(!Object.values(TEACHER_REVIEW_QUESTION_IDS).flat().includes(revision.questionId));
    assert.equal(TEACHER_REVIEW_ACTIVITIES.some((a) => a.questions.some((q) => q.questionId === revision.questionId)), false);
  }
  const allPriorIds = [
    ...r1.revisions.flatMap((x) => [x.revisionId, x.questionId]),
    ...r2.items.flatMap((x) => [x.questionId, ...x.options.map((o) => o.optionId)]),
    ...r2Rem.remediations.map((x) => x.remediationId),
    ...r3.revisions.flatMap((x) => [x.revisionId, x.questionId, ...x.options.map((o) => o.optionId)]),
    ...r3Rem.revisions.flatMap((x) => [x.revisionId, x.remediationId]),
  ];
  for (const id of [...r4.revisions.map((x) => x.revisionId), ...r4.revisions.map((x) => x.questionId), ...remIds]) {
    assert.equal(allPriorIds.includes(id), false, `新識別碼不得與既有候選資料衝突：${id}`);
  }
  assert.deepEqual(r4.revisions.map((x) => x.questionId), ['NS-R4-DRAFT-Q01', 'NS-R4-DRAFT-Q02', 'NS-R4-DRAFT-Q03', 'NS-R4-DRAFT-Q04']);
  assert.deepEqual(r4Rem.revisions.map((x) => x.sourceRemediationId), ['NS-R2-REMED-Q1', 'NS-R3-REMED-Q1', 'NS-R2-REMED-Q2', 'NS-R3-REMED-Q2']);
  assert.ok(r4Ids.length > 0);
});

test('R4 四題答案可由題目條件獨立推導，且各題答案與理由相符', async () => {
  const { revisions } = await readJson('number-secret-round4-candidate-items.json');
  const [q1, q2, q3, q4] = revisions;
  assert.equal(q1.independentDerivation.targetDigit * q1.independentDerivation.unitValue, q1.answerKey.quantity);
  assert.equal(q1.answerKey.placeName, '十位');
  assert.equal(q1.answerKey.quantity, 80);
  assert.equal(q1.transferCheck.independentDerivation.targetDigit * q1.transferCheck.independentDerivation.unitValue, q1.transferCheck.answerKey.quantity);
  assert.equal(q1.transferCheck.answerKey.quantity, 500);

  const z = q2.independentDerivation.digitsByPlace;
  const rebuilt = z.thousands * 1000 + z.hundreds * 100 + z.tens * 10 + z.ones;
  assert.equal(rebuilt, q2.independentDerivation.number);
  assert.equal(rebuilt, 4056);
  assert.equal(q2.independentDerivation.withoutMiddleZero, 456);
  assert.notEqual(rebuilt, q2.independentDerivation.withoutMiddleZero);
  assert.match(q2.answerKey.reason, /5.*十位.*6.*個位/);
  const zt = q2.transferCheck.independentDerivation;
  assert.equal(zt.placeValues.reduce((sum, x) => sum + x, 0), zt.number);
  assert.equal(zt.withoutMiddleZero, 732);

  const c = q3.independentDerivation;
  assert.equal(Math.max(c.left, c.right), q3.answerKey.greaterNumber);
  const diff = [...String(c.left), ...[]].findIndex((digit, i) => digit !== String(c.right)[i]);
  assert.equal(diff, c.firstDifferentIndexFromLeft);
  assert.equal(c.placeNames[diff], q3.answerKey.firstDifferentPlace);
  assert.equal(q3.answerKey.greaterNumber, 3402);
  assert.equal(q3.transferCheck.answerKey.greaterNumber, Math.max(q3.transferCheck.independentDerivation.left, q3.transferCheck.independentDerivation.right));
  assert.equal(q3.transferCheck.answerKey.greaterNumber, 5180);
  assert.equal(q3.transferCheck.answerKey.firstDifferentPlace, '十位');

  const counts = q4.independentDerivation.counts;
  assert.equal(counts.thousands * 1000 + counts.hundreds * 100 + counts.tens * 10 + counts.ones, q4.answerKey.number);
  assert.equal(q4.independentDerivation.expandedAddends.reduce((sum, value) => sum + value, 0), q4.answerKey.number);
  assert.equal(q4.answerKey.number, 6032);
  assert.match(q4.prompt, /0 個百/);
});

test('答案理由、提示、評分維度及遷移限制均分開，四份補救仍未實作或連結', async () => {
  const [items, remediations] = await Promise.all([
    readJson('number-secret-round4-candidate-items.json'),
    readJson('number-secret-round4-remediation-candidates.json'),
  ]);
  for (const item of items.revisions) {
    assert.ok(item.hints.length >= 2);
    assert.ok(item.scoringDimensions?.length || item.questionId === 'NS-R4-DRAFT-Q04');
    assert.equal(item.prerequisiteStatus, 'pending_teacher_confirmation');
    assert.equal(item.reinforcementStatus, '尚無連結補強活動');
    assert.ok(item.assessmentLimitations.length);
    for (const hint of item.hints) {
      assert.ok(!hint.includes('80'), `${item.questionId}: 提示不可直接給 Q1 正解`);
      assert.ok(!hint.includes('500'), `${item.questionId}: 提示不可直接給遷移答案`);
      assert.ok(!hint.includes('3,402') && !hint.includes('5,180'), `${item.questionId}: 比較題提示不得透露答案`);
    }
    if (item.transferCheck) assert.ok(item.transferCheck.interpretationLimit.includes('不足') || item.transferCheck.interpretationLimit.includes('不等同'));
  }
  assert.equal(remediations.revisions.length, 4);
  for (const remedy of remediations.revisions) {
    assert.equal(remedy.status, 'candidate_design_not_implemented_or_linked');
    assert.ok(remedy.studentAction.length >= 2);
    assert.equal(remedy.hints.length, 2);
    assert.ok(remedy.wrongFeedback && remedy.differentRepresentationExercise.prompt);
    assert.ok(remedy.differentRepresentationExercise.successEvidence);
    assert.ok(remedy.prerequisitesToConfirm.length && remedy.teacherDecisionQuestions.length);
    assert.match(remedy.differentRepresentationExercise.prompt, /新數字|新數字/);
    assert.match(remedy.returnPathSuggestion, /未|沒有|不存在/);
  }
});
