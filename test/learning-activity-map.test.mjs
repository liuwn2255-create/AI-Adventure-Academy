import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from '../prototype/data/fractionTreasureLearningUnit.js';
import { validateLearningActivityMap, validateQuestionAttemptEvents, summarizePracticeEvidence } from '../scripts/learning-activity-map.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
const learningObjectives = read('curriculum/learning-objectives.json');
const progressModel = read('curriculum/student-progress-model.json');
const activityMap = read('curriculum/learning-activity-map.json');
const challengeActivity = activityMap.activities.find((item) => item.runtimeReference.kind === 'prototype_level');
const questionIds = new Set(challengeActivity.runtimeReference.questionIds);
const inputs = { learningObjectives, progressModel, playableLevels: PLAYABLE_LEVELS };

const makeEvent = (overrides = {}) => ({
  submissionId: 'submission-1',
  attemptId: 'attempt-1',
  activityId: 'ACT-TEST-PRACTICE',
  questionId: 'secret-thousands-01',
  attemptNumber: 1,
  result: 'correct',
  hintUse: 'none',
  hintViewed: false,
  attemptStage: 'first_independent',
  responseClass: 'first_try_independent',
  occurredAt: '2026-10-21T10:00:00+08:00',
  ...overrides,
});

test('activity identifiers are unique and learning unit/objective references resolve', () => {
  assert.deepEqual(validateLearningActivityMap(activityMap, inputs), []);
  assert.equal(new Set(activityMap.activities.map((activity) => activity.activityId)).size, activityMap.activities.length);
  assert.ok(activityMap.activities.every(({ learningUnitId, learningObjectiveIds }) => {
    const unit = learningObjectives.learningUnits.find((item) => item.learningUnitId === learningUnitId);
    const ids = new Set(unit?.observableOutcomes.candidateObjectives.map((goal) => goal.objectiveId));
    return learningObjectiveIds.every((id) => ids.has(id));
  }));
});

test('thousands-secret links only to the existing level, its real questions, and existing obelisk unlock', () => {
  const level = PLAYABLE_LEVELS.find((item) => item.id === 'number-secret-challenge');
  assert.ok(level);
  assert.deepEqual(challengeActivity.runtimeReference.questionIds, level.questionSet.questions.map((question) => question.id));
  assert.deepEqual(challengeActivity.runtimeReference.unlockCondition, { type: 'completed_mission', missionId: 'task-find-number-obelisk' });
  assert.equal(challengeActivity.runtimeReference.levelAvailability, 'existing_playable_prototype_pending_teacher_review');
});

test('activity completion is separate from check pass and objective achievement', () => {
  assert.ok(challengeActivity.activityCompletion.doesNotImply.includes('learning_check_passed'));
  assert.equal(challengeActivity.learningCheck.status, 'not_designed_pending_teacher_review');
  assert.equal(challengeActivity.learningCheck.passCondition, null);
  assert.equal(activityMap.boundaries.starsScoresBadgesAreMasteryEvidence, false);
});

test('practice evidence distinguishes independent, hint-assisted, retry-correct, and incorrect answers', () => {
  const events = [
    makeEvent(),
    makeEvent({ submissionId: 'submission-2', attemptId: 'attempt-2', attemptNumber: 2, hintUse: 'hint_used', hintViewed: true, attemptStage: 'after_hint', responseClass: 'correct_after_hint' }),
    makeEvent({ submissionId: 'submission-3', attemptId: 'attempt-3', attemptNumber: 2, hintViewed: true, attemptStage: 'retry', responseClass: 'correct_after_retry' }),
    makeEvent({ submissionId: 'submission-4', attemptId: 'attempt-4', questionId: 'secret-thousands-02', result: 'incorrect', responseClass: 'incorrect' }),
  ];
  assert.deepEqual(validateQuestionAttemptEvents(events, questionIds), []);
  assert.deepEqual(summarizePracticeEvidence(events, questionIds), {
    attemptCount: 4,
    uniqueQuestionCount: 2,
    firstTryIndependentCorrect: 1,
    correctAfterHint: 1,
    correctAfterRetry: 1,
    correctAfterRemediation: 0,
    incorrect: 1,
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  });
});

test('duplicate submission or attempt identifiers are rejected instead of double-counted', () => {
  const events = [makeEvent(), makeEvent({ attemptId: 'attempt-2' })];
  const errors = validateQuestionAttemptEvents(events, questionIds);
  assert.ok(errors.some((message) => message.includes('duplicate or missing submissionId')));
  assert.throws(() => summarizePracticeEvidence(events, questionIds), /duplicate or missing submissionId/);
});

test('attempt validator rejects unknown question IDs and misclassified hint evidence', () => {
  const errors = validateQuestionAttemptEvents([
    makeEvent({ questionId: 'not-a-question' }),
    makeEvent({ submissionId: 'submission-2', attemptId: 'attempt-2', hintUse: 'hint_used', hintViewed: true, attemptStage: 'after_hint', responseClass: 'first_try_independent' }),
  ], questionIds);
  assert.ok(errors.some((message) => message.includes('unknown questionId')));
  assert.ok(errors.some((message) => message.includes('responseClass does not match')));
});

test('attempt validation checks attemptStage, cumulative hintViewed and remediation precedence', () => {
  const afterRemediation = makeEvent({
    submissionId: 'submission-2', attemptId: 'attempt-2', attemptNumber: 2,
    hintUse: 'hint_used', hintViewed: true, attemptStage: 'after_remediation',
    responseClass: 'correct_after_remediation',
  });
  assert.deepEqual(validateQuestionAttemptEvents([makeEvent(), afterRemediation], questionIds), []);
  const invalidStage = validateQuestionAttemptEvents([makeEvent({ attemptStage: 'after_magic' })], questionIds);
  assert.ok(invalidStage.some((message) => message.includes('invalid attemptStage')));
  const revertedHint = validateQuestionAttemptEvents([
    makeEvent({ hintUse: 'hint_used', hintViewed: true, attemptStage: 'after_hint', responseClass: 'correct_after_hint' }),
    makeEvent({ submissionId: 'submission-2', attemptId: 'attempt-2', attemptNumber: 2, hintViewed: false, attemptStage: 'retry', responseClass: 'correct_after_retry' }),
  ], questionIds);
  assert.ok(revertedHint.some((message) => message.includes('hintViewed cannot revert')));
});

test('validator rejects nonexistent level and invalid remediation reference', () => {
  const bad = structuredClone(activityMap);
  const target = bad.activities.find((item) => item.runtimeReference.kind === 'prototype_level');
  target.runtimeReference.levelId = 'missing-level';
  target.reinforcementActivityIds.push('missing-reinforcement');
  const errors = validateLearningActivityMap(bad, inputs);
  assert.ok(errors.some((message) => message.includes('referenced prototype level does not exist')));
  assert.ok(errors.some((message) => message.includes('invalid reinforcement activity')));
});

test('unreviewed activity data cannot be marked published or converted into formal learning records', () => {
  const bad = structuredClone(activityMap);
  bad.activities.find((item) => item.runtimeReference.kind === 'prototype_level').reviewStatus = 'published';
  bad.boundaries.studentRecordsCreated = true;
  const errors = validateLearningActivityMap(bad, inputs);
  assert.ok(errors.some((message) => message.includes('cannot be approved or published')));
  assert.ok(errors.some((message) => message.includes('must not create student records')));
});

test('reinforcement routes are explicit learning-unit runtime activities, not separate levels', () => {
  const planned = activityMap.activities.filter((item) => item.activityType === 'reinforcement');
  assert.equal(planned.length, 4);
  assert.ok(planned.every((item) => item.runtimeReference.kind === 'learning_unit_runtime' && item.runtimeReference.levelId === null));
  assert.ok(planned.every((item) => item.reviewStatus === 'candidate_pending_teacher_review'));
  assert.ok(planned.every((item) => activityMap.runtimeLearningUnitPrototype.reinforcementActivityIds.includes(item.runtimeReference.learningUnitActivityId)));
});

test('full learning-unit prototype maps lesson, candidate check and coverage gaps without promoting them', () => {
  const runtime = activityMap.runtimeLearningUnitPrototype;
  assert.equal(runtime.status, 'implemented_prototype_candidate_pending_teacher_review');
  assert.equal(runtime.formalUnitRef.status, 'candidate');
  assert.equal(runtime.learningCheck.passCondition, null);
  assert.equal(runtime.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(runtime.candidateCheckCoverage.length, runtime.candidateCheckQuestionIds.length);
  assert.ok(runtime.candidateCheckCoverage.every((item) => item.status.includes('candidate')));
  assert.equal(activityMap.boundaries.stage0Status, 'not_passed');
});

test('2,468 block candidate is mapped only as guided practice with explicit scaffold and non-formal evidence', () => {
  const runtime = activityMap.runtimeLearningUnitPrototype;
  const draftId = 'DRAFT-M3-NUM-01-01';
  const mapping = runtime.candidatePracticeQuestionCoverage.find((item) => item.questionId === draftId);
  assert.ok(runtime.practiceQuestionIds.includes(draftId));
  assert.ok(mapping);
  assert.equal(mapping.status, 'candidate_guided_practice_pending_teacher_review');
  assert.equal(mapping.learningCheckStatus, 'not_a_formal_check');
  assert.equal(mapping.responseEvidenceType, 'candidate_practice_response_only');
  assert.match(mapping.capability, /教學支架/);
  assert.equal(PLAYABLE_LEVELS.some((level) => level.questionSet.questions.some((question) => question.id === draftId)), false);
  const invalid = structuredClone(activityMap);
  invalid.runtimeLearningUnitPrototype.candidatePracticeQuestionCoverage[0].learningCheckStatus = 'passed';
  assert.ok(validateLearningActivityMap(invalid, inputs).some((message) => message.includes('must remain non-formal')));
});

test('平方公分活動映射至既有候選目標，所有方格題皆為非正式練習證據', () => {
  const area = activityMap.activities.find(({ activityId }) => activityId === 'ACT-M3-AREA-SQUARE-CENTIMETER-CANDIDATE');
  assert.ok(area);
  assert.equal(area.learningUnitId, 'learning-unit:chapter-scope-m3-math-area-square-centimeter');
  assert.equal(area.reviewStatus, 'candidate_pending_teacher_review');
  assert.equal(area.runtimeReference.kind, 'candidate_learning_unit_runtime');
  assert.equal(area.learningCheck.passCondition, null);
  assert.ok(area.questionObjectiveCoverage.every(({ responseEvidenceType, learningCheckStatus }) => responseEvidenceType === 'practice_response_only' && learningCheckStatus === 'not_a_formal_check'));
  assert.deepEqual(area.reinforcementActivityIds, []);
  const invalid = structuredClone(activityMap);
  invalid.activities.find(({ activityId }) => activityId === area.activityId).reviewStatus = 'approved';
  assert.ok(validateLearningActivityMap(invalid, inputs).some((message) => message.includes('unreviewed activity')));
});

test('同分母分數活動追溯候選學習目標與 N-3-9，題目僅為非正式練習證據', () => {
  const fraction = activityMap.activities.find(({ activityId }) => activityId === FRACTION_TREASURE_LEARNING_UNIT.activityId);
  assert.ok(fraction);
  assert.equal(fraction.learningUnitId, FRACTION_TREASURE_LEARNING_UNIT.learningUnitId);
  assert.equal(fraction.reviewStatus, 'candidate_pending_teacher_review');
  assert.equal(fraction.runtimeReference.kind, 'candidate_learning_unit_runtime');
  assert.equal(fraction.learningCheck.passCondition, null);
  assert.deepEqual(fraction.reinforcementActivityIds, []);
  assert.deepEqual(fraction.runtimeReference.questionIds, FRACTION_TREASURE_LEARNING_UNIT.questions.map(({ id }) => id));
  assert.ok(fraction.evidenceSources.some(({ type, codes }) => type === 'official_curriculum_registry_reference' && codes.includes('N-3-9') && codes.includes('n-II-6')));
  assert.ok(fraction.questionObjectiveCoverage.every(({ responseEvidenceType, learningCheckStatus }) => responseEvidenceType === 'practice_response_only' && learningCheckStatus === 'not_a_formal_check'));

  const invalid = structuredClone(activityMap);
  invalid.activities.find(({ activityId }) => activityId === fraction.activityId).questionObjectiveCoverage[0].learningCheckStatus = 'passed';
  assert.ok(validateLearningActivityMap(invalid, inputs).some((message) => message.includes('candidate responses must remain non-formal practice evidence')));
});

test('a failed check can route to reinforcement and a separate approved re-check', () => {
  const transitions = new Map(progressModel.transitions.map((item) => [`${item.from}>${item.to}`, item]));
  assert.ok(challengeActivity.reinforcementActivityIds.length > 0);
  assert.deepEqual(transitions.get('needs_review>in_progress').requires, ['reinforcement_activity_started']);
  assert.deepEqual(transitions.get('needs_review>check_passed').requires, ['approved_learning_check_result']);
  assert.equal(challengeActivity.learningCheck.passCondition, null);
});
