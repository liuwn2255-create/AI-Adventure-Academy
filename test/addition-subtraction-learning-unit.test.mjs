import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ADDITION_SUBTRACTION_LEARNING_UNIT as unit, validateAdditionSubtractionLearningUnit } from '../prototype/data/additionSubtractionLearningUnit.js';
import { createCandidateUnitSession, dispatchCandidateUnit, summarizeCandidateUnit, validateCandidateUnit } from '../prototype/learningUnitEngine.js';
import { MATH_LEVEL_DIRECTORY, getMathLevelDirectoryEntry } from '../prototype/data/mathLevelDirectory.js';
import { PLAYABLE_LEVELS } from '../prototype/data/levelCatalog.js';
import { TEACHER_REVIEW_ACTIVITIES, TEACHER_REVIEW_QUESTION_IDS } from '../prototype/data/teacherReviewCatalog.js';
import activityMap from '../curriculum/learning-activity-map.json' with { type: 'json' };

test('N-3-2 候選題識別、選項、算式結果、提示與補強狀態完整', () => {
  assert.deepEqual(validateAdditionSubtractionLearningUnit(unit), []);
  assert.deepEqual(validateCandidateUnit(unit), []);
  assert.equal(unit.status, 'candidate_pending_teacher_review');
  assert.equal(unit.formalAssessment, false);
  assert.equal(unit.curriculumReferences.learningContentCode, 'N-3-2');
  assert.equal(unit.curriculumReferences.stagePerformanceCode, 'n-II-2');
  assert.equal(unit.questions.length, 5);
  const ids = unit.questions.map(({ id }) => id);
  assert.equal(new Set(ids).size, 5);
  assert.equal(new Set([...TEACHER_REVIEW_ACTIVITIES.flatMap(({ questions }) => questions.map(({ questionId }) => questionId))]).size,
    TEACHER_REVIEW_ACTIVITIES.reduce((n, activity) => n + activity.questions.length, 0));

  for (const q of unit.questions) {
    const optionTexts = q.options.map(({ text }) => text);
    assert.equal(new Set(optionTexts).size, optionTexts.length, q.id);
    assert.equal(q.options.filter(({ optionId }) => optionId === q.answerId).length, 1, q.id);
    const answer = q.options.find(({ optionId }) => optionId === q.answerId);
    if (q.responseDimension === 'calculation_result') {
      assert.equal(Number(answer.text.replaceAll(',', '')), q.answerValue, q.id);
      assert.equal(q.operator === '+' ? q.operands[0] + q.operands[1] : q.operands[0] - q.operands[1], q.answerValue, q.id);
    } else {
      assert.equal(q.answerValue, null, q.id);
      assert.ok(answer.text.includes('10 個一換成 1 個十'), q.id);
    }
    assert.equal(q.hints.length, 2);
    assert.ok(q.hints.every((hint) => !hint.includes(String(q.answerValue)) && !hint.includes(answer.text)), `${q.id} hint leaks answer`);
    assert.ok(q.explanation && q.wrongGuidance && q.capability && q.prerequisiteNote);
  }
  assert.equal(unit.questions[0].answerValue, 4224);
  assert.equal(unit.questions[1].answerValue, 4845);
  assert.equal(unit.questions[2].answerValue, 3448);
  assert.equal(unit.questions[3].answerValue, 3234);
  const strategy = unit.questions[4];
  assert.equal(strategy.id, 'ADD-SUB-DRAFT-M3-N32-05-STRATEGY');
  assert.equal(strategy.responseDimension, 'strategy_explanation');
  assert.equal(strategy.answerId, 'str-05-ten');
  assert.equal(strategy.options.find(({ optionId }) => optionId === strategy.answerId)?.text, '把 10 個一換成 1 個十，記在十位。');
  assert.equal(strategy.operator, 'strategy');
  assert.ok(strategy.explanation.includes('10 個一可以重新分組成 1 個十'));
  assert.equal(unit.questions.slice(0, 4).every(({ responseDimension }) => responseDimension === 'calculation_result'), true);
  assert.deepEqual(unit.questions.slice(0, 4).map(({ operands }) => operands.some((n) => String(n).includes('0'))), [false, true, false, true]);
  assert.equal(unit.remediationPolicy, 'not_provided');
  assert.deepEqual(unit.reinforcementActivities, []);
});

test('候選加減法用共用引擎作答、防止重複提交並保持非正式結果', () => {
  let session = createCandidateUnitSession(unit, 'add-sub-test-session');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  const wrong = dispatchCandidateUnit(session, unit, 'answer', { optionId: 'add-01-4214', submissionId: 'add-sub-test-1' });
  assert.equal(wrong.event.result, 'incorrect');
  const duplicate = dispatchCandidateUnit(wrong.session, unit, 'answer', { optionId: 'add-01-4224', submissionId: 'add-sub-test-1' });
  assert.equal(duplicate.changed, false);
  session = dispatchCandidateUnit(wrong.session, unit, 'retry').session;
  const retry = dispatchCandidateUnit(session, unit, 'answer', { optionId: 'add-01-4224', submissionId: 'add-sub-test-2' });
  assert.equal(retry.event.result, 'correct');
  assert.equal(retry.session.attempts.length, 2);
  assert.equal(retry.event.attemptStage, 'retry');
  assert.equal(retry.event.evidenceType, 'candidate_learning_unit_response_only');
  const summary = summarizeCandidateUnit(retry.session);
  assert.equal(summary.formalLearningCheck, 'not_assessed');
  assert.equal(summary.objectiveAchievement, 'not_assessed');
});

test('活動只在候選目錄與教師工作台出現，不進正式可玩關卡且沒有假補強', async () => {
  const strategy = unit.questions[4];
  const entry = getMathLevelDirectoryEntry(unit.levelId);
  assert.ok(entry);
  assert.equal(entry.entryKind, 'catalog_candidate');
  assert.equal(entry.publicationStatus, 'not_approved');
  assert.equal(entry.questionCount, unit.questions.length);
  assert.equal(PLAYABLE_LEVELS.some(({ id }) => id === unit.levelId), false);
  assert.ok(MATH_LEVEL_DIRECTORY.some(({ levelId }) => levelId === unit.levelId));
  const review = TEACHER_REVIEW_ACTIVITIES.find(({ activityId }) => activityId === unit.activityId);
  assert.ok(review);
  assert.equal(review.status, 'candidate_pending_teacher_review');
  assert.deepEqual(review.questions.map(({ questionId }) => questionId), unit.questions.map(({ id }) => id));
  assert.deepEqual(TEACHER_REVIEW_QUESTION_IDS[unit.activityId], unit.questions.map(({ id }) => id));
  assert.ok(review.questions.every(({ remediation }) => remediation === null));
  assert.ok(review.questions.every(({ hints }) => hints.length === 2));
  const mapped = activityMap.activities.find(({ activityId }) => activityId === unit.activityId);
  assert.ok(mapped);
  assert.equal(mapped.reviewStatus, 'candidate_pending_teacher_review');
  assert.equal(mapped.learningCheck.passCondition, null);
  assert.deepEqual(mapped.reinforcementActivityIds, []);
  assert.ok(mapped.questionObjectiveCoverage.every(({ responseEvidenceType, learningCheckStatus }) => responseEvidenceType === 'practice_response_only' && learningCheckStatus === 'not_a_formal_check'));
  assert.equal(mapped.questionObjectiveCoverage.length, 5);
  assert.equal(mapped.questionObjectiveCoverage.find(({ questionId }) => questionId === strategy.id)?.responseDimension, 'strategy_explanation');
  assert.equal(mapped.learningCheck.passCondition, null);
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(app, /function renderAdditionSubtractionLearningUnit/);
  assert.match(app, /尚無連結的補強活動/);
  assert.match(app, /本結果只描述候選作答，不是正式檢核、正式成績或學習目標達成證據/);
  assert.match(app, /策略說明選擇題/);
  assert.match(app, /與計算結果題分開記錄/);
});

test('策略說明與計算結果分開累計，事件只代表候選選擇而非策略精熟', () => {
  const strategy = unit.questions[4];
  let session = createCandidateUnitSession(unit, 'add-sub-dimensions');
  session = dispatchCandidateUnit(session, unit, 'start').session;
  for (const q of unit.questions.slice(0, 4)) {
    const result = dispatchCandidateUnit(session, unit, 'answer', { optionId: q.answerId, submissionId: `answer-${q.id}` });
    session = dispatchCandidateUnit(result.session, unit, 'next').session;
  }
  const wrong = dispatchCandidateUnit(session, unit, 'answer', {
    optionId: 'str-05-ones', submissionId: 'strategy-wrong',
  });
  assert.equal(wrong.event.responseDimension, 'strategy_explanation');
  assert.equal(wrong.event.evidenceType, 'candidate_learning_unit_response_only');
  const strategyResult = dispatchCandidateUnit(wrong.session, unit, 'retry').session;
  const correct = dispatchCandidateUnit(strategyResult, unit, 'answer', {
    optionId: strategy.answerId, submissionId: 'strategy-correct',
  });
  assert.equal(correct.event.responseDimension, 'strategy_explanation');
  const summary = summarizeCandidateUnit(correct.session);
  assert.deepEqual(summary.responseDimensionSummaries, {
    calculation_result: {
      attemptCount: 4, correctCount: 4, incorrectCount: 0,
      meaning: 'candidate_calculation_result_response_only',
    },
    strategy_explanation: {
      attemptCount: 2, correctCount: 1, incorrectCount: 1,
      meaning: 'candidate_selected_explanation_only_not_evidence_of_stable_strategy_mastery',
    },
  });
  assert.equal(summary.formalLearningCheck, 'not_assessed');
  assert.equal(summary.objectiveAchievement, 'not_assessed');
});
