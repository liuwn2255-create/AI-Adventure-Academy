import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { INTEGER_NUMBER_LINE_LEARNING_UNIT as unit } from '../prototype/data/integerNumberLineLearningUnit.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';
import { PLAYABLE_LEVELS, PROGRESS_LEVELS } from '../prototype/data/levelCatalog.js';
import {
  createCandidateUnitSession,
  dispatchCandidateUnit,
  summarizeCandidateUnit,
  validateCandidateUnit,
} from '../prototype/learningUnitEngine.js';

function apply(session, action, payload = {}) {
  const result = dispatchCandidateUnit(session, unit, action, payload);
  assert.equal(result.changed, true);
  assert.equal(result.error, undefined);
  return result.session;
}

test('整數數線候選單元資料與課綱追溯有效，且所有題目都是唯一草案識別', async () => {
  assert.deepEqual(validateCandidateUnit(unit), []);
  assert.equal(unit.status, 'candidate_pending_teacher_review');
  assert.equal(unit.formalAssessment, false);
  assert.equal(unit.hintPolicy, 'per_question');
  assert.equal(unit.remediationPolicy, 'not_provided');
  assert.equal(unit.questions.length, 3);
  assert.equal(new Set(unit.questions.map(({ id }) => id)).size, 3);
  assert.ok(unit.questions.every(({ id }) => id.startsWith('INTEGER-NUMBER-LINE-DRAFT-')));
  assert.deepEqual(unit.questions.map(({ visualization }) => visualization.points[0].value), [300, 700, 200]);
  const map = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
  const source = JSON.parse(await readFile(new URL('../curriculum/sources.json', import.meta.url), 'utf8'));
  const focus = [...map.verifiedLearningFocuses, ...map.pendingLearningFocuses]
    .find(({ id }) => id === unit.curriculumReferences.curriculumMapId);
  assert.ok(focus);
  assert.equal(focus.sourceId, unit.curriculumReferences.sourceId);
  assert.ok(focus.contentCodes.includes(unit.curriculumReferences.learningContentCode));
  assert.ok(focus.performanceCodes.includes(unit.curriculumReferences.stagePerformanceCode));
  const sourceEntry = source.sources.find(({ id }) => id === unit.curriculumReferences.sourceId);
  assert.ok(sourceEntry);
  assert.ok(sourceEntry.verifiedClauses.includes(unit.curriculumReferences.learningContentCode));
  assert.ok(sourceEntry.verifiedClauses.includes(unit.curriculumReferences.stagePerformanceCode));
  assert.match(unit.curriculumReferences.evidenceBoundary, /第二學習階段表現/);
});

test('candidate number-line unit answers, feedback, result and replay use the shared engine', () => {
  let session = createCandidateUnitSession(unit, 'number-line-candidate-flow');
  session = apply(session, 'start');
  const first = unit.questions[0];
  session = apply(session, 'answer', { optionId: 'inl-01-a', submissionId: 'nl-q1-wrong' });
  assert.equal(session.attempts.at(-1).result, 'incorrect');
  assert.equal(session.attempts.at(-1).questionId, first.id);
  session = apply(session, 'next');
  for (const question of unit.questions.slice(1)) {
    session = apply(session, 'answer', { optionId: question.answerId, submissionId: `answer-${question.id}` });
    assert.equal(session.attempts.at(-1).result, 'correct');
    session = apply(session, 'next');
  }
  assert.equal(session.phase, 'result');
  assert.deepEqual(summarizeCandidateUnit(session), {
    learningUnitId: unit.learningUnitId,
    unitRevision: 1,
    activityId: unit.activityId,
    attemptCount: 3,
    correctCount: 2,
    incorrectCount: 1,
    resultStatus: 'candidate_result_only_not_formal_assessment',
    formalLearningCheck: 'not_assessed',
    objectiveAchievement: 'not_assessed',
  });
  session = apply(session, 'restart', { sessionId: 'number-line-candidate-replay' });
  assert.equal(session.phase, 'intro');
  assert.equal(session.attempts.length, 0);
});

test('候選數線不進正式關卡或進度目錄，面板只經地圖候選入口呼叫共用引擎', async () => {
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === unit.levelId), false);
  assert.equal(PROGRESS_LEVELS.some(({ id }) => id === unit.levelId), false);
  const directory = MATH_LEVEL_DIRECTORY.find(({ levelId }) => levelId === unit.levelId);
  assert.ok(directory);
  assert.equal(directory.runtime.availability, 'catalog_only');
  assert.equal(directory.questionCount, 0);
  assert.equal(directory.teacherReviewStatus, 'pending_teacher_review');
  assert.equal(directory.publicationStatus, 'not_approved');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const engine = await readFile(new URL('../prototype/learningUnitEngine.js', import.meta.url), 'utf8');
  assert.match(app, /dispatchCandidateUnit\(integerNumberLineLearningSession, INTEGER_NUMBER_LINE_LEARNING_UNIT, action, payload\)/);
  assert.match(app, /候選互動試作・待教師審查/);
  assert.match(html, /integer-number-line-learning-unit-panel/);
  assert.doesNotMatch(engine, /localStorage|sessionStorage|writeProgress|recordLevelCompletion|recordNumberSecretCompletion/);
});

test('數線範圍、刻度及標記位置合法，方向從 0 向右增加', () => {
  for (const question of unit.questions) {
    const { start, end, minorStep, points } = question.visualization;
    assert.equal(start, 0);
    assert.ok(end > start);
    assert.ok(minorStep > 0);
    for (const { value } of points) {
      assert.ok(value >= start && value <= end);
      assert.equal((value - start) % minorStep, 0);
    }
  }
});
