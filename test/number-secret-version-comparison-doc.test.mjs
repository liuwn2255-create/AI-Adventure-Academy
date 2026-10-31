import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (relative) => JSON.parse(await readFile(resolve(root, relative), 'utf8'));
const docPath = resolve(root, 'docs/n3-1-candidate-version-comparison.md');

test('比較表題目與補救 ID 均可回溯到各自來源檔，並清楚保留版本缺項', async () => {
  const [r2, r3, r4, r2r, r3r, r4r] = await Promise.all([
    readJson('artifacts/number-secret-round2-candidate-items.json'),
    readJson('artifacts/number-secret-round3-candidate-items.json'),
    readJson('artifacts/number-secret-round4-candidate-items.json'),
    readJson('artifacts/number-secret-round2-remediation-candidates.json'),
    readJson('artifacts/number-secret-round3-remediation-candidates.json'),
    readJson('artifacts/number-secret-round4-remediation-candidates.json'),
  ]);
  const doc = await readFile(docPath, 'utf8');
  for (const item of r2.items) assert.ok(doc.includes(`\`${item.questionId}\``));
  for (const item of r3.revisions) assert.ok(doc.includes(`\`${item.questionId}\``));
  for (const item of r4.revisions) assert.ok(doc.includes(`\`${item.questionId}\``));
  for (const item of r2r.remediations) assert.ok(doc.includes(`\`${item.remediationId}\``));
  for (const item of r3r.revisions) assert.ok(doc.includes(`\`${item.revisionId}\``));
  for (const item of r4r.revisions) assert.ok(doc.includes(`\`${item.revisionId}\``));
  assert.match(doc, /Q4[\s\S]*?未提供/);
  assert.match(doc, /R2[\s\S]*?R3[\s\S]*?R4/);
  assert.match(doc, /NS-R2-DRAFT-Q01/);
  assert.match(doc, /NS-R3-DRAFT-Q01/);
  assert.match(doc, /NS-R4-DRAFT-Q01/);
  assert.match(doc, /NS-R2-REMED-Q1/);
  assert.match(doc, /NS-R3-REMED-REV-Q1/);
  assert.match(doc, /NS-R4-REMED-REV-Q1-R2/);
  assert.equal(r2.items.length, 4);
  assert.equal(r3.revisions.length, 3);
  assert.equal(r4.revisions.length, 4);
});

test('教師決策欄留白、未勾選且不宣稱候選採用；文件相對連結均有效', async () => {
  const doc = await readFile(docPath, 'utf8');
  assert.match(doc, /□ 暫不採用/);
  assert.match(doc, /□ 可進入教師試閱/);
  assert.match(doc, /□ 需安排小規模試教後再判斷/);
  assert.doesNotMatch(doc, /- \[x\]/i);
  assert.match(doc, /均未採用/);
  const links = [...doc.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    assert.ok(!/^[a-z]+:\/\//i.test(link), `本文件預期使用可驗證相對路徑：${link}`);
    await access(resolve(dirname(docPath), link));
  }
  for (const file of [
    'artifacts/number-secret-round2-candidate-items.json',
    'artifacts/number-secret-round3-candidate-items.json',
    'artifacts/number-secret-round4-candidate-items.json',
    'artifacts/number-secret-round2-remediation-candidates.json',
    'artifacts/number-secret-round3-remediation-candidates.json',
    'artifacts/number-secret-round4-remediation-candidates.json',
  ]) assert.ok(doc.includes(file));
});

test('補救狀態沿用來源資料：所有版本仍未實作、未連結', async () => {
  const [r2, r3, r4] = await Promise.all([
    readJson('artifacts/number-secret-round2-remediation-candidates.json'),
    readJson('artifacts/number-secret-round3-remediation-candidates.json'),
    readJson('artifacts/number-secret-round4-remediation-candidates.json'),
  ]);
  const doc = await readFile(docPath, 'utf8');
  assert.equal(r2.remediations.every((x) => x.status === 'candidate_design_not_implemented_or_linked'), true);
  assert.equal(r3.revisions.every((x) => x.status === 'candidate_design_not_implemented_or_linked'), true);
  assert.equal(r4.revisions.every((x) => x.status === 'candidate_design_not_implemented_or_linked'), true);
  assert.match(doc, /未實作、未連結/);
  assert.match(doc, /沒有遊戲路由/);
  assert.match(doc, /提示後作答/);
  assert.match(doc, /單次遷移/);
});
