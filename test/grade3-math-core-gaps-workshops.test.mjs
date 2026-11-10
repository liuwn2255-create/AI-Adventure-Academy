import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import scope from '../curriculum/grade3-year-scope.json' with { type: 'json' };

const ids = [
  'ACT-G3-MATH-MULTIPLICATION-DIVISION-CALCULATION-CANDIDATE',
  'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE',
  'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE',
];
const tasks = ids.map((id) => CATALOG_CANDIDATE_TASKS.find((task) => task.activityId === id));
const advance = (session, task) => dispatchLearningTask(session, task, 'next').session;
const submit = (session, task, id) => dispatchLearningTask(session, task, 'submit', { submissionId: id });
function fillCalculation(session, task, stageIndex, wrong = false, wrongStepId = null) {
  const stage = task.stages[stageIndex];
  const targetWrongId = wrongStepId ?? stage.calculationSteps[0].id;
  for (const step of stage.calculationSteps) session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value: wrong && step.id === targetWrongId ? step.expectedValue + 1 : step.expectedValue }).session;
  return session;
}

test('七項官方數學內容原文已核對；新活動只局部連結候選並保持待審', () => {
  const map = getLearningTaskRelation('grade-3', 'mathematics');
  assert.equal(tasks.filter(Boolean).length, 3);
  for (const task of tasks) {
    assert.deepEqual(validateLearningTask(task), []);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  }
  const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const math = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.ok(ids.every((id) => math.existingYearLevelContent.some((activity) => activity.activityId === id && activity.runtimeAvailability === 'playable_candidate_prototype')));
  assert.ok(map.candidateLearningPath.some(({ status }) => status === 'candidate_partial_coverage'));
  assert.ok(map.candidateLearningPath.every(({ status }) => !['approved', 'published', 'formal_playable'].includes(status)));
  assert.ok(scope.items.some(({ subject, activityCoverage }) => subject === 'mathematics' && activityCoverage.status === 'requires_decomposition'));
  for (const code of ['N-3-3', 'N-3-5', 'N-3-7', 'N-3-8', 'S-3-3', 'S-3-2', 'R-3-2']) {
    const item = scope.items.find(({ officialCurriculum }) => officialCurriculum.learningContentCodes.some((entry) => entry.code === code));
    assert.equal(item.officialCurriculum.officialTextReview.status, 'verified_against_official_text_this_round');
    assert.equal(item.teacherProfessionalReviewStatus, 'pending_review');
  }
  for (const scopeId of ['scope-m3-math-one-digit-multiplication', 'scope-m3-math-one-digit-division', 'scope-m3-math-two-step-problems', 'scope-m3-math-circle-elements', 'scope-m3-math-pattern-reasoning']) {
    const item = scope.items.find(({ scopeItemId }) => scopeItemId === scopeId);
    assert.equal(item.activityCoverage.status, 'candidate_activity_program_and_browser_verified');
    assert.ok(item.activityCoverage.activityRefs.every(({ alignment }) => alignment === 'partial_candidate'));
    assert.equal(item.teacherProfessionalReviewStatus, 'pending_review');
  }
});

test('乘除計算互動核算位值步驟，錯誤定位、重試、含0題及完成重玩', () => {
  const task = tasks[0];
  assert.equal(236 * 3, 708);
  assert.equal(304 * 2, 608);
  assert.equal(408 / 2, 204);
  assert.equal(636 / 3, 212);
  let session = dispatchLearningTask(createLearningTaskSession(task, 'calc-test'), task, 'start').session;
  session = fillCalculation(session, task, 0, true);
  let result = submit(session, task, 'calc-wrong');
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /個位/);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = fillCalculation(session, task, 0);
  result = submit(session, task, 'calc-right-1'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  session = fillCalculation(session, task, 1, true, 'tens-product');
  result = submit(session, task, 'calc-transfer-wrong'); assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /十位|0/u);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = fillCalculation(session, task, 1);
  result = submit(session, task, 'calc-right-2'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  session = fillCalculation(session, task, 2);
  result = submit(session, task, 'calc-right-3'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  session = fillCalculation(session, task, 3, true);
  result = submit(session, task, 'calc-transfer-division-wrong'); assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = fillCalculation(session, task, 3);
  result = submit(session, task, 'calc-right-4'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  for (const [index, dividend, divisor] of [[4, 23, 4], [5, 29, 6]]) {
    const stage = task.stages[index];
    const values = Object.fromEntries(stage.calculationSteps.map(step => [step.id, step.expectedValue]));
    assert.equal(values.quotient, Math.floor(dividend / divisor));
    assert.equal(values.used, values.quotient * divisor);
    assert.equal(values.remainder, dividend % divisor);
    if ('check-total' in values) assert.equal(values['check-total'], dividend);
    session = fillCalculation(session, task, index, true, 'remainder');
    result = submit(session, task, `remainder-${index}-wrong`);
    assert.equal(result.session.phase, 'feedback');
    session = dispatchLearningTask(result.session, task, 'retry').session;
    session = fillCalculation(session, task, index);
    result = submit(session, task, `remainder-${index}-right`);
    assert.equal(result.session.phase, 'success');
    session = advance(result.session, task);
  }
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.attempts.length, 0);
});

test('兩步驟第二步須先完成並使用中間結果，逐步重試及結果隔離', () => {
  const task = tasks[1];
  assert.equal(18 + 6, 24); assert.equal(24 / 4, 6);
  assert.deepEqual(validateLearningTask(task), []);
  assert.deepEqual(task.learningSubitemClaims, ['SUB-MATH-G3-N3-7-ADD-THEN-EQUAL-SHARE-STEPS']);
  assert.equal(task.stages[0].interaction, 'complete_calculation_steps');
  assert.equal(task.stages[0].calculationSteps.length, 3);
  let session = dispatchLearningTask(createLearningTaskSession(task, 'two-step-test'), task, 'start').session;
  assert.equal(dispatchLearningTask(session, task, 'next').session.stageIndex, 0);
  session = fillCalculation(session, task, 0, true);
  let result = submit(session, task, 'step1-wrong'); assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /湊成整十|湊到20/u);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = fillCalculation(session, task, 0);
  result = submit(session, task, 'step1-right'); session = advance(result.session, task);
  assert.equal(session.previousStepResult, 24);
  session = dispatchLearningTask(session, task, 'select_option', { optionId: 'share-24' }).session;
  result = submit(session, task, 'step2-wrong'); assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = dispatchLearningTask(session, task, 'select_option', { optionId: 'share-6' }).session;
  result = submit(session, task, 'step2-right'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task); assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 4);
});

test('S-3-4 與 N-1-5 維持部分互動證據，並明示螢幕模擬的實作限制', () => {
  const audit = JSON.parse(readFileSync(new URL('../artifacts/math-curriculum-audit-report.json', import.meta.url), 'utf8'));
  const rows = audit.clauseBatch.verifiedOfficialLearningContentClauses;
  const geometry = rows.find(({ code }) => code === 'S-3-4');
  const length = rows.find(({ code }) => code === 'N-1-5');
  const twoStep = rows.find(({ code }) => code === 'N-3-7');
  assert.equal(geometry.coverageStatus, 'partial');
  assert.deepEqual(geometry.interactionEvidence.find(({ activityId }) => activityId === 'ACT-G3-MATH-GEOMETRY-SPLIT-RECOMPOSE-NET-FOLD-CANDIDATE').stageIds, [
    'recompose-square-from-two-dominoes', 'recompose-rectangle-from-two-l-pieces',
    'fold-two-cube-nets-and-observe-adjacency', 'compare-another-cube-net-and-face-neighbors',
  ]);
  assert.match(geometry.limitations, /實體剪裁、黏貼與摺合/u);
  assert.equal(length.coverageStatus, 'partial');
  assert.deepEqual(length.interactionEvidence[0].stageIds, ['compare-straight-and-curved-paths', 'verify-with-common-units']);
  assert.match(length.limitations, /實際繩測|實物|實測/u);
  assert.equal(twoStep.coverageStatus, 'partial');
  assert.deepEqual(twoStep.interactionEvidence[0].stageIds, ['add-arriving-supplies', 'share-supplies-equally']);
  assert.deepEqual(twoStep.interactionEvidence[0].interactions, ['complete_calculation_steps', 'choose_response']);
});

test('圓形元素示意及圖形模式均可操作錯答重試與完成', () => {
  const task = tasks[2];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'circle-pattern-test'), task, 'start').session;
  session = dispatchLearningTask(session, task, 'set_circle_radius', { radius: 2 }).session;
  let result = submit(session, task, 'radius-wrong'); assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = dispatchLearningTask(session, task, 'set_circle_radius', { radius: 3 }).session;
  result = submit(session, task, 'radius-right'); session = advance(result.session, task);
  for (const [index, answer] of ['circle-center', 'circle-radius', 'circle-diameter'].entries()) {
    session = dispatchLearningTask(session, task, 'select_option', { optionId: answer }).session;
    result = submit(session, task, `circle-${index}`); assert.equal(result.session.phase, 'success');
    session = advance(result.session, task);
  }
  for (const tokenId of ['circle', 'circle', 'circle', 'circle']) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId }).session;
  result = submit(session, task, 'pattern-wrong'); assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, task, 'retry').session;
  for (const tokenId of ['circle', 'square', 'circle', 'square']) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId }).session;
  result = submit(session, task, 'pattern-right'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: 'shape-rule-one-long-string' }).session;
  result = submit(session, task, 'shape-rule-wrong'); assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /排列順序/u);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: 'shape-rule-circle-square' }).session;
  result = submit(session, task, 'shape-rule-right'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  for (const tokenId of ['ten', 'ten', 'fourteen', 'sixteen']) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId }).session;
  result = submit(session, task, 'number-pattern-wrong'); assert.equal(result.session.phase, 'feedback');
  session = dispatchLearningTask(result.session, task, 'retry').session;
  for (const tokenId of ['ten', 'twelve', 'fourteen', 'sixteen']) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId }).session;
  result = submit(session, task, 'number-pattern-right'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: 'number-rule-double' }).session;
  result = submit(session, task, 'number-rule-wrong'); assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /相鄰數字/u);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId: 'number-rule-add-two' }).session;
  result = submit(session, task, 'number-rule-right'); assert.equal(result.session.phase, 'success');
  session = advance(result.session, task);
  for (let stageIndex = session.stageIndex; stageIndex < task.stages.length; stageIndex += 1) {
    const stage = task.stages[stageIndex]; const rules = stage.patternRules;
    session = dispatchLearningTask(session, task, 'hint').session;
    session = dispatchLearningTask(session, task, 'hint').session;
    if (rules.mode === 'repeat_unit_builder') for (let index = 0; index < rules.beatCount; index += 1) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId: index % 2 ? 'circle' : 'circle' }).session;
    else if (rules.mode === 'number_builder') {
      session = dispatchLearningTask(session, task, 'set_pattern_rule_value', { field: 'start', value: rules.targetStart }).session;
      session = dispatchLearningTask(session, task, 'set_pattern_rule_value', { field: 'increment', value: rules.targetIncrement }).session;
      for (let index = 0; index < rules.termCount; index += 1) session = dispatchLearningTask(session, task, 'append_pattern_sequence_term', { value: rules.targetStart + rules.targetIncrement * index + (index === 1 ? 1 : 0) }).session;
    } else {
      session = dispatchLearningTask(session, task, 'select_pattern_repair_cell', { index: (rules.errorIndex + 1) % rules.beatCount }).session;
      session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId: rules.targetPattern[rules.errorIndex] }).session;
    }
    result = submit(session, task, `new-stage-wrong-${stageIndex}`);
    assert.equal(result.session.phase, 'feedback', stage.stageId);
    session = dispatchLearningTask(result.session, task, 'retry').session;
    if (rules.mode === 'repeat_unit_builder') for (let index = 0; index < rules.beatCount; index += 1) session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId: index % 2 ? 'square' : 'circle' }).session;
    else if (rules.mode === 'number_builder') {
      session = dispatchLearningTask(session, task, 'set_pattern_rule_value', { field: 'start', value: rules.targetStart }).session;
      session = dispatchLearningTask(session, task, 'set_pattern_rule_value', { field: 'increment', value: rules.targetIncrement }).session;
      for (let index = 0; index < rules.termCount; index += 1) session = dispatchLearningTask(session, task, 'append_pattern_sequence_term', { value: rules.targetStart + rules.targetIncrement * index }).session;
    } else {
      session = dispatchLearningTask(session, task, 'select_pattern_repair_cell', { index: rules.errorIndex }).session;
      session = dispatchLearningTask(session, task, 'add_pattern_beat', { tokenId: rules.targetPattern[rules.errorIndex] }).session;
    }
    result = submit(session, task, `new-stage-right-${stageIndex}`);
    assert.equal(result.session.phase, 'success', stage.stageId);
    if (rules.mode === 'number_builder') assert.match(result.session.lastFeedback.text, /逐項核對/u);
    session = advance(result.session, task);
  }
  assert.equal(session.phase, 'completed');
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
  assert.equal(JSON.stringify(session).includes('localStorage'), false);
});

test('數學稽核不以共用學習表現代碼跨連結不同學習內容活動', () => {
  const audit = JSON.parse(readFileSync(new URL('../artifacts/math-curriculum-audit-report.json', import.meta.url), 'utf8'));
  const capacity = audit.focusAudit.rows.find(({ officialContentCodes }) => officialContentCodes.includes('N-3-15'));
  const angle = audit.focusAudit.rows.find(({ officialContentCodes }) => officialContentCodes.includes('N-3-13'));
  const area = audit.focusAudit.rows.find(({ officialContentCodes }) => officialContentCodes.includes('N-3-14'));
  const pattern = audit.focusAudit.rows.find(({ officialContentCodes }) => officialContentCodes.includes('R-3-2'));
  assert.deepEqual(capacity.mappedActivityIds, ['ACT-G3-MATH-CAPACITY-ESTIMATION-CANDIDATE']);
  assert.ok(!capacity.mappedActivityIds.includes('ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE'));
  assert.ok(!capacity.mappedActivityIds.includes('ACT-G3-MATH-LENGTH-MEASUREMENT-ADVENTURE-CANDIDATE'));
  assert.ok(angle.mappedActivityIds.includes('ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE'));
  assert.ok(!angle.mappedActivityIds.includes('ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE'));
  assert.ok(!area.mappedActivityIds.includes('ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE'));
  assert.ok(pattern.interactionEvidenceActivityIds.includes('ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE'));
  const learningMap = JSON.parse(readFileSync(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
  const findTask = (value) => {
    if (!value || typeof value !== 'object') return null;
    if (value.taskId === 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE') return value;
    for (const child of Object.values(value)) { const match = findTask(child); if (match) return match; }
    return null;
  };
  assert.equal(findTask(learningMap)?.taskKind, 'interactive_circle_elements_pattern_composition_and_rule_evidence');
});
