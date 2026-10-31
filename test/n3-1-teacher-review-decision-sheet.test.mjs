import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docPath = resolve(root, 'docs/n3-1-teacher-review-decision-sheet.md');
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

test('決策單的 R2/R3/R4 題目 ID 存在於正確版本，且未補造 R3 Q4', async () => {
  const [r2, r3, r4] = await Promise.all([
    readJson('artifacts/number-secret-round2-candidate-items.json'),
    readJson('artifacts/number-secret-round3-candidate-items.json'),
    readJson('artifacts/number-secret-round4-candidate-items.json'),
  ]);
  const doc = await readFile(docPath, 'utf8');
  for (const x of r2.items) assert.ok(doc.includes(`\`${x.questionId}\``));
  for (const x of r3.revisions) assert.ok(doc.includes(`\`${x.questionId}\``));
  for (const x of r4.revisions) assert.ok(doc.includes(`\`${x.questionId}\``));
  assert.match(doc, /R3 Q4 未提供/);
  assert.equal(r2.items.length, 4);
  assert.equal(r3.revisions.length, 3);
  assert.equal(r4.revisions.length, 4);
});

test('決策單涵蓋八份補救 ID，且狀態沿用來源 JSON 的未實作未連結值', async () => {
  const [r2, r3, r4] = await Promise.all([
    readJson('artifacts/number-secret-round2-remediation-candidates.json'),
    readJson('artifacts/number-secret-round3-remediation-candidates.json'),
    readJson('artifacts/number-secret-round4-remediation-candidates.json'),
  ]);
  const doc = await readFile(docPath, 'utf8');
  const entries = [...r2.remediations, ...r3.revisions, ...r4.revisions];
  assert.equal(entries.length, 8);
  for (const item of entries) {
    assert.equal(item.status, 'candidate_design_not_implemented_or_linked');
    assert.ok(doc.includes(`\`${item.revisionId || item.remediationId}\``));
    if (item.remediationId) assert.ok(doc.includes(`\`${item.remediationId}\``));
  }
  assert.match(doc, /均在其 JSON 中標示 `candidate_design_not_implemented_or_linked`/);
});

test('教師決策表沒有預選決定，並含明確停止條件與有效相對連結', async () => {
  const doc = await readFile(docPath, 'utf8');
  assert.doesNotMatch(doc, /- \[x\]/i);
  assert.match(doc, /停止條件/);
  for (const phrase of ['題意有歧義', '先備知識或課程進度不明', '評分方式無法分辨答對與理由理解', '必要同意及資料保護程序', '教師尚未審閱']) {
    assert.ok(doc.includes(phrase), `缺少停止條件：${phrase}`);
  }
  for (const phrase of ['題目 ID', '審查結果', '先備知識', '課程進度', '建議試教', '尚待處理事項', '下一步行動']) assert.ok(doc.includes(phrase));
  const links = [...doc.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  for (const link of links) await access(resolve(dirname(docPath), link));
});
