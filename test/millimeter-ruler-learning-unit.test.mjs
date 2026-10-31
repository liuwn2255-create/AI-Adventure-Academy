import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MILLIMETER_RULER_LEARNING_UNIT as unit } from '../prototype/data/millimeterRulerLearningUnit.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';
import { createCandidateUnitSession, dispatchCandidateUnit, summarizeCandidateUnit, validateCandidateUnit } from '../prototype/learningUnitEngine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('millimeter ruler candidate has unique items and traceable candidate-only references', () => {
  assert.deepEqual(validateCandidateUnit(unit), []);
  assert.equal(unit.status, 'candidate_pending_teacher_review');
  assert.equal(unit.formalAssessment, false);
  assert.equal(unit.hintPolicy, 'per_question');
  assert.equal(unit.remediationPolicy, 'not_provided');
  assert.deepEqual(unit.questions.map(({ visualization }) => visualization.markMm), [23, 46, 58]);
  for (const question of unit.questions) {
    assert.doesNotMatch(question.prompt, new RegExp(`${question.visualization.markMm}\\s*毫米`), `${question.id} 題幹不可直接洩漏尺圖終點值`);
    assert.match(question.prompt, /圖中|尺上|尺的/);
  }
  assert.equal(new Set(unit.questions.map(({ id }) => id)).size, unit.questions.length);
  const directoryEntry = MATH_LEVEL_DIRECTORY.find(({ levelId }) => levelId === unit.levelId);
  assert.equal(directoryEntry?.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(directoryEntry?.publicationStatus, 'not_approved');
  assert.equal(directoryEntry?.curriculumReferences.curriculumMapIds[0], unit.curriculumReferences.curriculumMapId);
  const curriculumMap = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/curriculum-map.json'), 'utf8'));
  const mapFocuses = [...curriculumMap.verifiedLearningFocuses, ...curriculumMap.pendingLearningFocuses];
  const mapFocus = mapFocuses.find(({ id }) => id === unit.curriculumReferences.curriculumMapId);
  assert.ok(mapFocus);
  assert.deepEqual(mapFocus.contentCodes, ['N-3-12']);
  assert.deepEqual(mapFocus.performanceCodes, ['n-II-9']);
  const sourceRegistry = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/sources.json'), 'utf8'));
  const mathSource = sourceRegistry.sources.find(({ id }) => id === unit.curriculumReferences.sourceId);
  assert.ok(mathSource.verifiedClauses.includes('N-3-12'));
  assert.ok(mathSource.verifiedClauses.includes('n-II-9'));
});

test('millimeter candidate shares answer, feedback, result, restart engine and keeps responses in memory', () => {
  let session = createCandidateUnitSession(unit, 'mm-ruler-test');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  for (const question of unit.questions) {
    const answer = dispatchCandidateUnit(session, unit, 'answer', {
      optionId: question.answerId,
      submissionId: `${session.sessionId}:${question.id}`,
    });
    assert.equal(answer.event.result, 'correct');
    session = dispatchCandidateUnit(answer.session, unit, 'next').session;
  }
  assert.equal(session.phase, 'result');
  assert.equal(summarizeCandidateUnit(session).correctCount, 3);
  assert.equal(summarizeCandidateUnit(session).formalLearningCheck, 'not_assessed');
  const replay = dispatchCandidateUnit(session, unit, 'restart', { sessionId: 'mm-ruler-replay' });
  assert.equal(replay.session.phase, 'intro');
  assert.equal(replay.session.attempts.length, 0);
  assert.equal(replay.session.objectiveAchievement, 'not_assessed');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'prototype/app.js'), 'utf8'), /millimeterRulerLearningSession[^\n]*localStorage/);
});

test('millimeter candidate is a directory-only prototype, not a formal playable or saved level', () => {
  const entry = MATH_LEVEL_DIRECTORY.find(({ levelId }) => levelId === unit.levelId);
  assert.equal(entry.runtime.availability, 'catalog_candidate');
  assert.equal(entry.runtime.unlockCondition, null);
  const levelCatalog = fs.readFileSync(path.join(root, 'prototype/data/levelCatalog.js'), 'utf8');
  assert.doesNotMatch(levelCatalog, /math-length-millimeter-candidate/);
  const progress = fs.readFileSync(path.join(root, 'prototype/mapProgress.js'), 'utf8');
  assert.doesNotMatch(progress, /math-length-millimeter-candidate/);
});

test('millimeter candidate UI and accessible panel are connected to the shared engine', () => {
  const app = fs.readFileSync(path.join(root, 'prototype/app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');
  assert.match(app, /createCandidateUnitSession\(MILLIMETER_RULER_LEARNING_UNIT\)/);
  assert.match(app, /dispatchCandidateUnit\(millimeterRulerLearningSession, MILLIMETER_RULER_LEARNING_UNIT/);
  assert.match(app, /candidate-millimeter-ruler-track/);
  assert.match(html, /millimeter-ruler-learning-unit-panel/);
  assert.match(html, /長度候選互動試作・待教師審查/);
});
