import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NUMBER_SECRET_V2_CANDIDATE_SET } from '../prototype/data/numberSecretLearningUnit.js';
import { validateRevisionDataset } from '../prototype/teacherReviewRevisions.js';

const revisionUrl = new URL('../artifacts/number-secret-round1-candidate-revisions.json', import.meta.url);

test('第一輪 Q1/Q2 修訂草案符合既有 schema，保持候選資料與題目來源分離', async () => {
  const raw = await readFile(revisionUrl, 'utf8');
  const dataset = JSON.parse(raw);
  const validation = validateRevisionDataset(dataset);
  assert.equal(validation.ok, true, validation.errors?.join('\n'));
  assert.equal(dataset.schemaVersion, 1);
  assert.deepEqual(dataset.revisions.map((revision) => revision.questionId), [
    'V2-DRAFT-M3-NUM-01-01',
    'V2-DRAFT-M3-NUM-01-02',
  ]);
  assert.equal(new Set(dataset.revisions.map((revision) => revision.revisionId)).size, 2);
  assert.ok(dataset.revisions.every((revision) => revision.fields.remediation.includes('尚未實作或連結')));
  assert.ok(dataset.revisions.every((revision) => !Object.hasOwn(revision, 'teacherDecision')));
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.questions[0].wrongGuidance, '請從最右邊開始逐位對照位名，再找出 7 所在的位置。錯答只作為待驗證線索，不能單次判定原因。');
  assert.equal(NUMBER_SECRET_V2_CANDIDATE_SET.questions[1].wrongGuidance, '請先定位 8 的位名，再把「8 個該位單位」連到數量。單次錯答不代表已確診理解困難。');
});
