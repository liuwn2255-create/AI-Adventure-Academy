import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CAPACITY_OBSERVATION_SCENARIOS } from '../prototype/capacityMission.js';
import { CAPACITY_READING_LEARNING_UNIT } from '../prototype/data/capacityReadingLearningUnit.js';
import {
  createCandidateUnitSession,
  dispatchCandidateUnit,
  summarizeCandidateUnit,
  validateCandidateUnit,
} from '../prototype/learningUnitEngine.js';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';

function apply(session, action, payload = {}) {
  const result = dispatchCandidateUnit(session, CAPACITY_READING_LEARNING_UNIT, action, payload);
  assert.equal(result.changed, true);
  assert.equal(result.error, undefined);
  return result.session;
}

test('capacity reading unit is a valid candidate and reuses all three existing observation scenarios', () => {
  assert.deepEqual(validateCandidateUnit(CAPACITY_READING_LEARNING_UNIT), []);
  assert.equal(CAPACITY_READING_LEARNING_UNIT.status, 'candidate_pending_teacher_review');
  assert.equal(CAPACITY_READING_LEARNING_UNIT.formalAssessment, false);
  assert.equal(CAPACITY_READING_LEARNING_UNIT.questions.length, 3);
  assert.deepEqual(CAPACITY_READING_LEARNING_UNIT.questions.map(({ sourceScenarioId }) => sourceScenarioId), CAPACITY_OBSERVATION_SCENARIOS.map(({ id }) => id));
  for (const [index, question] of CAPACITY_READING_LEARNING_UNIT.questions.entries()) {
    const source = CAPACITY_OBSERVATION_SCENARIOS[index];
    assert.equal(question.visualization.waterMl, source.waterMl);
    assert.equal(question.answerId, source.answerOptionId);
    assert.deepEqual(question.options, source.options);
    assert.equal(question.explanation, source.explanation);
  }
});

test('capacity learning unit uses shared candidate lifecycle, records answers, results, and replay in memory only', () => {
  let session = createCandidateUnitSession(CAPACITY_READING_LEARNING_UNIT, 'capacity-candidate-session');
  assert.equal(session.phase, 'intro');
  session = apply(session, 'start');
  const first = CAPACITY_READING_LEARNING_UNIT.questions[0];
  const wrong = first.options.find(({ optionId }) => optionId !== first.answerId);
  session = apply(session, 'answer', { optionId: wrong.optionId, submissionId: 'capacity-wrong' });
  assert.equal(session.attempts[0].questionId, first.id);
  assert.equal(session.attempts[0].result, 'incorrect');
  assert.equal(session.attempts[0].evidenceType, 'candidate_learning_unit_response_only');
  assert.equal(session.formalLearningCheck, 'not_assessed');
  session = apply(session, 'next');
  for (let index = 1; index < CAPACITY_READING_LEARNING_UNIT.questions.length; index += 1) {
    const question = CAPACITY_READING_LEARNING_UNIT.questions[index];
    session = apply(session, 'answer', { optionId: question.answerId, submissionId: `capacity-${index}` });
    session = apply(session, 'next');
  }
  assert.equal(session.phase, 'result');
  assert.deepEqual(summarizeCandidateUnit(session), {
    learningUnitId: CAPACITY_READING_LEARNING_UNIT.learningUnitId,
    unitRevision: 1,
    activityId: CAPACITY_READING_LEARNING_UNIT.activityId,
    attemptCount: 3,
    correctCount: 2,
    incorrectCount: 1,
    resultStatus: 'candidate_result_only_not_formal_assessment',
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  });
  session = apply(session, 'restart', { sessionId: 'capacity-candidate-replay' });
  assert.equal(session.phase, 'intro');
  assert.equal(session.attempts.length, 0);
});

test('capacity candidate is not added as a formal playable level and cannot write formal progress', async () => {
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === CAPACITY_READING_LEARNING_UNIT.levelId), false);
  const engine = await readFile(new URL('../prototype/learningUnitEngine.js', import.meta.url), 'utf8');
  assert.doesNotMatch(engine, /localStorage|sessionStorage|writeProgress|recordLevelCompletion/);
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  assert.match(app, /試玩共用單元：刻度判讀/);
  assert.match(app, /createCandidateUnitSession\(CAPACITY_READING_LEARNING_UNIT\)/);
  assert.match(app, /dispatchCandidateUnit\(capacityLearningSession, CAPACITY_READING_LEARNING_UNIT, action, payload\)/);
  assert.match(html, /capacity-learning-unit-panel/);
  assert.match(CAPACITY_READING_LEARNING_UNIT.curriculumReferences.learningContentCode, /^N-3-15$/);
  assert.equal(CAPACITY_READING_LEARNING_UNIT.curriculumReviewStatus, 'pending_teacher_review');
});
