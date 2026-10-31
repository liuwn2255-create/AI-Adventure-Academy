import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WEIGHT_KG_G_LEARNING_UNIT as unit } from '../prototype/data/weightKgGLearningUnit.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';
import { createCandidateUnitSession, dispatchCandidateUnit, summarizeCandidateUnit, validateCandidateUnit } from '../prototype/learningUnitEngine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('weight candidate has unique questions, valid answers and explicit review boundaries', () => {
  assert.deepEqual(validateCandidateUnit(unit), []);
  assert.equal(unit.status, 'candidate_pending_teacher_review');
  assert.equal(unit.formalAssessment, false);
  assert.equal(unit.hintPolicy, 'per_question');
  assert.equal(unit.remediationPolicy, 'not_provided');
  assert.equal(unit.questions.length, 3);
  assert.equal(new Set(unit.questions.map(({ id }) => id)).size, 3);
  for (const question of unit.questions) {
    assert.equal(question.options.filter(({ optionId }) => optionId === question.answerId).length, 1);
    assert.equal(new Set(question.options.map(({ optionId }) => optionId)).size, question.options.length);
  }
});

test('weight questions separate unit conversion from same-unit comparison', () => {
  const conversion = unit.questions.find(({ id }) => id === 'WEIGHT-KG-G-DRAFT-02');
  const comparison = unit.questions.find(({ id }) => id === 'WEIGHT-KG-G-DRAFT-03');
  assert.equal(conversion.answerId, 'wkg-02-b');
  assert.match(conversion.explanation, /1 公斤等於 1000 公克/);
  assert.match(comparison.prompt, /950 公克.*850 公克/);
  assert.equal(comparison.answerId, 'wkg-03-a');
  assert.match(comparison.explanation, /950 比 850 大/);
  assert.doesNotMatch(comparison.prompt, /公斤|換算/);
  assert.doesNotMatch(comparison.explanation, /公斤|換算/);
  assert.equal(unit.status, 'candidate_pending_teacher_review');
});

test('weight candidate traces to existing N-3-16 map and source records without claiming schedule approval', () => {
  const entry = MATH_LEVEL_DIRECTORY.find(({ levelId }) => levelId === unit.levelId);
  assert.equal(entry?.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(entry?.publicationStatus, 'not_approved');
  assert.equal(entry?.runtime.availability, 'catalog_candidate');
  assert.deepEqual(entry?.curriculumReferences.curriculumMapIds, [unit.curriculumReferences.curriculumMapId]);
  const map = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/curriculum-map.json'), 'utf8'));
  const focus = [...map.verifiedLearningFocuses, ...map.pendingLearningFocuses].find(({ id }) => id === unit.curriculumReferences.curriculumMapId);
  assert.ok(focus);
  assert.deepEqual(focus.contentCodes, ['N-3-16']);
  assert.deepEqual(focus.performanceCodes, ['n-II-9']);
  assert.equal(focus.gradeApplicabilityStatus, 'pending_review');
  const sources = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/sources.json'), 'utf8'));
  const source = sources.sources.find(({ id }) => id === unit.curriculumReferences.sourceId);
  assert.ok(source?.verifiedClauses.includes('N-3-16'));
  assert.ok(source?.verifiedClauses.includes('n-II-9'));
  assert.equal(entry.textbookEvidence.status, 'not_provided');
  const learningMap = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/learning-map.json'), 'utf8'));
  const gradeThree = learningMap.grades.find(({ gradeNumber }) => gradeNumber === 3);
  const prototypeRef = gradeThree.existingPrototypeReferences.find(({ levelId }) => levelId === unit.levelId);
  assert.equal(prototypeRef?.runtimeAvailability, 'catalog_candidate');
  assert.equal(prototypeRef?.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(prototypeRef?.publicationStatus, 'not_approved');
  assert.equal(prototypeRef?.questionData.datasetStatus, 'candidate_pending_teacher_review');
  assert.equal(prototypeRef?.questionData.count, unit.questions.length);
  assert.deepEqual(prototypeRef?.chapterRefs, ['chapter-scope-m3-math-weight-kg-g']);
});

test('weight candidate shares in-memory answer, result and replay flow and cannot become a formal level', () => {
  let session = createCandidateUnitSession(unit, 'weight-test-session');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  let firstQuestionDuplicate;
  for (const question of unit.questions) {
    const isFirst = question === unit.questions[0];
    const selectedOptionId = isFirst
      ? question.options.find(({ optionId }) => optionId !== question.answerId).optionId
      : question.answerId;
    const answer = dispatchCandidateUnit(session, unit, 'answer', {
      optionId: selectedOptionId,
      submissionId: `${question.id}:submission`,
    });
    assert.equal(answer.event.result, isFirst ? 'incorrect' : 'correct');
    const duplicate = dispatchCandidateUnit(answer.session, unit, 'answer', {
      optionId: selectedOptionId,
      submissionId: `${question.id}:submission`,
    });
    assert.equal(duplicate.changed, false);
    assert.equal(duplicate.session.attempts.length, answer.session.attempts.length);
    if (isFirst) firstQuestionDuplicate = duplicate;
    session = dispatchCandidateUnit(answer.session, unit, 'next').session;
  }
  assert.equal(firstQuestionDuplicate.session.attempts.length, 1);
  assert.equal(session.phase, 'result');
  assert.equal(summarizeCandidateUnit(session).correctCount, 2);
  assert.equal(summarizeCandidateUnit(session).incorrectCount, 1);
  assert.equal(summarizeCandidateUnit(session).formalLearningCheck, 'not_assessed');
  const restarted = dispatchCandidateUnit(session, unit, 'restart', { sessionId: 'weight-replay' }).session;
  assert.equal(restarted.phase, 'intro');
  assert.deepEqual(restarted.attempts, []);
  assert.equal(restarted.objectiveAchievement, 'not_assessed');
  const levels = fs.readFileSync(path.join(root, 'prototype/data/levelCatalog.js'), 'utf8');
  assert.doesNotMatch(levels, /math-weight-kg-g-candidate/);
  const progress = fs.readFileSync(path.join(root, 'prototype/mapProgress.js'), 'utf8');
  assert.doesNotMatch(progress, /math-weight-kg-g-candidate/);
});

test('weight candidate card and panel are reachable only as a catalog prototype and show review status', () => {
  const app = fs.readFileSync(path.join(root, 'prototype/app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');
  assert.match(app, /createCandidateUnitSession\(WEIGHT_KG_G_LEARNING_UNIT\)/);
  assert.match(app, /dispatchCandidateUnit\(weightKgGLearningSession, WEIGHT_KG_G_LEARNING_UNIT/);
  assert.match(app, /開發試玩：公克與公斤/);
  assert.match(html, /weight-kg-g-learning-unit-panel/);
  assert.match(html, /重量候選互動試作・待教師審查/);
  const startHandler = app.match(/function startWeightKgGLearningUnit\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const actionHandler = app.match(/function handleWeightKgGLearningAction\(event\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.ok(startHandler);
  assert.ok(actionHandler);
  assert.doesNotMatch(`${startHandler}\n${actionHandler}`, /localStorage|sessionStorage|recordLevelCompletion|recordDemoCompletion|mapProgress/);
});
