import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  TEACHER_REVIEW_REVISIONS_STORAGE_KEY,
  createEmptyRevisionDataset,
  loadRevisionDataset,
  mergeRevisionDatasets,
  saveRevisionDataset,
  serializeRevisionDataset,
  validateRevisionDataset,
} from '../prototype/teacherReviewRevisions.js';
import { TEACHER_REVIEW_STORAGE_KEY, createEmptyTeacherReviewDataset, serializeTeacherReviewDataset } from '../prototype/teacherReviewWorkbench.js';

const formalProgressKey = 'taiwan-ai-adventure.prototype-progress.v1';

function isolatedStorage(seed = {}) {
  const values = seed instanceof Map ? new Map(seed) : new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    snapshot: () => new Map(values),
  };
}

test('round 1 Q1/Q2 備份為有效 schema v1 且連結指定的候選題目', async () => {
  const backupText = await readFile(new URL('../artifacts/number-secret-round1-candidate-revisions.json', import.meta.url), 'utf8');
  const backup = JSON.parse(backupText);
  const checked = validateRevisionDataset(backup);
  assert.equal(checked.ok, true, checked.errors?.join(' '));
  assert.equal(backup.schemaVersion, 1);
  assert.deepEqual(backup.revisions.map(({ revisionId, questionId }) => [revisionId, questionId]), [
    ['REV-NSR1-Q1-20261022', 'V2-DRAFT-M3-NUM-01-01'],
    ['REV-NSR1-Q2-20261022', 'V2-DRAFT-M3-NUM-01-02'],
  ]);
  for (const revision of backup.revisions) {
    assert.ok(revision.activityId);
    assert.ok(revision.reason.trim());
    assert.ok(revision.createdAt && revision.updatedAt);
    assert.ok(Object.keys(revision.fields).length > 0);
  }
});

test('兩筆候選修訂可在隔離來源匯出、重載，並恢復至另一個獨立來源', async () => {
  const backup = JSON.parse(await readFile(new URL('../artifacts/number-secret-round1-candidate-revisions.json', import.meta.url), 'utf8'));
  const testDataset = structuredClone(backup);
  testDataset.revisions = testDataset.revisions.map((item) => ({
    ...item,
    revisionId: `${item.revisionId}-TEST-Restore`,
    reason: `[AUTOMATION TEST ONLY] ${item.reason}`,
  }));
  assert.equal(validateRevisionDataset(testDataset).ok, true);

  const progressSnapshot = JSON.stringify({ level: 2, stars: 3, mastery: { 'M3-NUM-01': 0 }, unlocked: ['island-1'] });
  const reviewSnapshot = serializeTeacherReviewDataset(createEmptyTeacherReviewDataset());
  const source = isolatedStorage({
    [formalProgressKey]: progressSnapshot,
    [TEACHER_REVIEW_STORAGE_KEY]: reviewSnapshot,
  });
  const saved = saveRevisionDataset(source, testDataset);
  assert.equal(saved.ok, true);
  const exportText = serializeRevisionDataset(loadRevisionDataset(source).dataset);

  // Reload at the same origin models the exact v1 browser key and serialized payload.
  const reloadedSource = isolatedStorage(source.snapshot());
  const afterReload = loadRevisionDataset(reloadedSource);
  assert.equal(afterReload.error, null);
  assert.deepEqual(afterReload.dataset.revisions.map((item) => item.revisionId), testDataset.revisions.map((item) => item.revisionId));

  // A different origin/profile has an independent storage map until the JSON is imported.
  const destination = isolatedStorage({
    [formalProgressKey]: progressSnapshot,
    [TEACHER_REVIEW_STORAGE_KEY]: reviewSnapshot,
  });
  assert.equal(loadRevisionDataset(destination).dataset.revisions.length, 0);
  const incoming = JSON.parse(exportText);
  const merged = mergeRevisionDatasets(loadRevisionDataset(destination).dataset, incoming);
  assert.equal(merged.ok, true);
  assert.equal(saveRevisionDataset(destination, merged.dataset).ok, true);
  assert.deepEqual(loadRevisionDataset(destination).dataset.revisions, testDataset.revisions);
  assert.equal(destination.getItem(formalProgressKey), progressSnapshot);
  assert.equal(destination.getItem(TEACHER_REVIEW_STORAGE_KEY), reviewSnapshot);
  assert.deepEqual(JSON.parse(source.getItem(TEACHER_REVIEW_REVISIONS_STORAGE_KEY)), testDataset);
});

test('重複匯入與損壞 JSON 均整份拒絕，不部分寫入或改動目的來源', async () => {
  const backup = JSON.parse(await readFile(new URL('../artifacts/number-secret-round1-candidate-revisions.json', import.meta.url), 'utf8'));
  const testDataset = structuredClone(backup);
  testDataset.revisions = testDataset.revisions.map((item) => ({
    ...item,
    revisionId: `${item.revisionId}-TEST-Atomic`,
    reason: `[AUTOMATION TEST ONLY] ${item.reason}`,
  }));
  const destination = isolatedStorage();
  const firstImport = mergeRevisionDatasets(createEmptyRevisionDataset(), testDataset);
  assert.equal(firstImport.ok, true);
  assert.equal(saveRevisionDataset(destination, firstImport.dataset).ok, true);
  const beforeDuplicate = destination.getItem(TEACHER_REVIEW_REVISIONS_STORAGE_KEY);
  const duplicateImport = mergeRevisionDatasets(loadRevisionDataset(destination).dataset, testDataset);
  assert.equal(duplicateImport.ok, false);
  assert.match(duplicateImport.error, /整份匯入已拒絕/);
  assert.equal(destination.getItem(TEACHER_REVIEW_REVISIONS_STORAGE_KEY), beforeDuplicate);
  assert.equal(loadRevisionDataset(destination).dataset.revisions.length, 2);

  const beforeCorrupt = destination.snapshot();
  let malformed;
  assert.throws(() => { malformed = JSON.parse('{"schemaVersion":1,"revisions":['); }, SyntaxError);
  assert.equal(malformed, undefined);
  assert.deepEqual(destination.snapshot(), beforeCorrupt);
  const invalidDataset = { ...testDataset, revisions: [...testDataset.revisions, { ...testDataset.revisions[0], revisionId: 'REV-INVALID-RESTORE-TEST' }] };
  const invalidImport = mergeRevisionDatasets(loadRevisionDataset(destination).dataset, invalidDataset);
  assert.equal(invalidImport.ok, false);
  assert.equal(destination.getItem(TEACHER_REVIEW_REVISIONS_STORAGE_KEY), beforeDuplicate);
});
