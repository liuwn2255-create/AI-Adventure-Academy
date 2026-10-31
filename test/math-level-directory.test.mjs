import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MATH_LEVEL_DIRECTORY, getMathLevelDirectoryEntry } from '../prototype/data/mathLevelDirectory.js';
import { PLAYABLE_LEVELS, PROGRESS_LEVELS } from '../prototype/data/levelCatalog.js';
import { NUMBER_COMPARISON_LEVEL, NUMBER_SECRET_LEVEL, PLACE_VALUE_LEVEL } from '../prototype/data/levelCatalog.js';
import { isLevelUnlocked } from '../prototype/levelEngine.js';
import { createEmptyProgress, recordLevelCompletion } from '../prototype/mapProgress.js';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('數學關卡目錄 ID 唯一，狀態欄位分開且沒有候選被標成正式發布', () => {
  const ids = MATH_LEVEL_DIRECTORY.map(({ levelId }) => levelId);
  assert.equal(new Set(ids).size, ids.length);

  for (const entry of MATH_LEVEL_DIRECTORY) {
    assert.ok(entry.title);
    assert.ok(entry.learningTheme);
    assert.deepEqual(entry.proposedTargetGradeRange, [3, 3]);
    assert.ok(entry.gradeApplicabilityStatus);
    assert.ok(entry.curriculumEvidenceStatus);
    assert.ok(entry.semesterProgressStatus);
    assert.ok(entry.teacherReviewStatus);
    assert.equal(entry.publicationStatus, 'not_approved');
    assert.equal(entry.topicStatus, 'candidate_topic');
    assert.equal(entry.textbookEvidence.status, 'not_provided');
    assert.deepEqual(entry.textbookEvidence.pages, []);
  }
  assert.equal(getMathLevelDirectoryEntry('missing-level'), null);
});

test('目錄中的課綱來源與地圖 ID 存在，且代碼只引用該地圖項目記載的條目', async () => {
  const sourcesData = await readJson('../curriculum/sources.json');
  const mapData = await readJson('../curriculum/curriculum-map.json');
  const sourceById = new Map(sourcesData.sources.map((source) => [source.id, source]));
  const mapFocuses = [...mapData.verifiedLearningFocuses, ...mapData.pendingLearningFocuses];
  const mapById = new Map(mapFocuses.map((focus) => [focus.id, focus]));

  for (const entry of MATH_LEVEL_DIRECTORY) {
    const refs = entry.curriculumReferences;
    if (!refs.sourceId) {
      assert.deepEqual(refs.curriculumMapIds, []);
      assert.deepEqual(refs.learningContentCodes, []);
      assert.deepEqual(refs.stagePerformanceCodes, []);
      assert.equal(entry.curriculumEvidenceStatus, 'pending_verification');
      continue;
    }

    const source = sourceById.get(refs.sourceId);
    assert.ok(source, `${entry.levelId} sourceId exists`);
    assert.equal(refs.sourceId, 'mathematics');
    assert.ok(refs.curriculumMapIds.length > 0);

    const mappedContentCodes = new Set();
    const mappedPerformanceCodes = new Set();
    for (const mapId of refs.curriculumMapIds) {
      const focus = mapById.get(mapId);
      assert.ok(focus, `${entry.levelId} map ID ${mapId} exists`);
      assert.equal(focus.sourceId, refs.sourceId);
      focus.contentCodes.forEach((code) => mappedContentCodes.add(code));
      focus.performanceCodes.forEach((code) => mappedPerformanceCodes.add(code));
    }
    for (const code of refs.learningContentCodes) {
      assert.ok(mappedContentCodes.has(code), `${entry.levelId} content code ${code} belongs to mapped focus`);
      assert.ok(source.verifiedClauses.includes(code), `${code} is in source verifiedClauses`);
    }
    for (const code of refs.stagePerformanceCodes) {
      assert.ok(mappedPerformanceCodes.has(code), `${entry.levelId} performance code ${code} belongs to mapped focus`);
      assert.ok(source.verifiedClauses.includes(code), `${code} is in source verifiedClauses`);
    }
  }
});

test('只有既有三個可玩原型進度項目進入引擎；目錄候選不會自行開放', () => {
  assert.deepEqual(PLAYABLE_LEVELS.map(({ id }) => id), [
    'math-place-value-demo',
    'number-secret-challenge',
    'math-number-comparison-candidate',
  ]);
  assert.deepEqual(PROGRESS_LEVELS.map(({ id }) => id), PLAYABLE_LEVELS.map(({ id }) => id));
  assert.equal(getMathLevelDirectoryEntry('math-capacity-candidate').runtime.availability, 'catalog_only');
  assert.equal(getMathLevelDirectoryEntry('math-integer-number-line-candidate').runtime.availability, 'catalog_only');
  assert.equal(getMathLevelDirectoryEntry('math-number-comparison-candidate').runtime.availability, 'gated_prototype');
  assert.equal(getMathLevelDirectoryEntry('math-capacity-candidate').questionCount, 0);
  const area = getMathLevelDirectoryEntry('math-area-square-centimeter-candidate');
  assert.equal(area.runtime.availability, 'catalog_candidate');
  assert.equal(area.questionCount, 4);
  assert.equal(area.publicationStatus, 'not_approved');
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === area.levelId), false);

  const fraction = getMathLevelDirectoryEntry('math-fraction-treasure-same-denominator-candidate');
  assert.ok(fraction);
  assert.equal(fraction.runtime.availability, 'catalog_candidate');
  assert.equal(fraction.questionCount, 5);
  assert.equal(fraction.curriculumReferences.learningContentCodes[0], 'N-3-9');
  assert.equal(fraction.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(fraction.publicationStatus, 'not_approved');
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === fraction.levelId), false);

  assert.equal(isLevelUnlocked(NUMBER_COMPARISON_LEVEL, createEmptyProgress()), false);
  const completedFirstLevel = recordLevelCompletion(createEmptyProgress(), PLACE_VALUE_LEVEL.id, 1);
  assert.equal(isLevelUnlocked(NUMBER_COMPARISON_LEVEL, completedFirstLevel), true);
  assert.equal(isLevelUnlocked(NUMBER_SECRET_LEVEL, createEmptyProgress()), false);
});

test('目錄題數與現有題組一致，且原型資料保持非正式狀態', () => {
  for (const level of PLAYABLE_LEVELS) {
    const entry = getMathLevelDirectoryEntry(level.id);
    assert.ok(entry);
    assert.equal(level.questionSet.questions.length, entry.questionCount);
    assert.equal(entry.publicationStatus, 'not_approved');
  }
  assert.equal(PLACE_VALUE_LEVEL.reviewStatus, 'prototype_demo_only');
  assert.equal(NUMBER_SECRET_LEVEL.reviewStatus, 'pending_teacher_review');
  assert.equal(NUMBER_COMPARISON_LEVEL.reviewStatus, 'pending_teacher_review');
  const additionSubtraction = getMathLevelDirectoryEntry('math-addition-subtraction-vertical-candidate');
  assert.ok(additionSubtraction);
  assert.equal(additionSubtraction.questionCount, 5);
  assert.equal(additionSubtraction.publicationStatus, 'not_approved');
});
