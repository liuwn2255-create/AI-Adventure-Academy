import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const mapData = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const unitRegistry = JSON.parse(await readFile(new URL('../curriculum/unit-registry.json', import.meta.url), 'utf8'));
const learningMap = JSON.parse(await readFile(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));

function submitStage(task, stage, session, correct) {
  if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const optionId of ids) session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId }).session;
  } else if (stage.interaction === 'choose_response') {
    const optionId = correct ? stage.correctOptionIds[0] : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = dispatchLearningTask(session, task, 'select_option', { optionId }).session;
  } else if (stage.interaction === 'classify_observations') {
    for (const observation of stage.observations) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = correct ? expected : stage.categories.find(({ id }) => id !== expected).id;
      session = dispatchLearningTask(session, task, 'assign_category', { observationId: observation.id, categoryId }).session;
    }
  } else if (stage.interaction === 'assemble_response') {
    const expected = [...stage.correctOptionIds];
    if (!correct) [expected[0], expected[1]] = [expected[1], expected[0]];
    for (const tokenId of expected) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
  } else if (stage.interaction === 'set_clock_time') {
    const rules = stage.clockRules;
    session = dispatchLearningTask(session, task, 'set_clock_hand', { hand: 'hour', value: correct ? rules.targetHour : rules.initialHour }).session;
    session = dispatchLearningTask(session, task, 'set_clock_hand', { hand: 'minute', value: correct ? rules.targetMinute : (rules.targetMinute + 5) % 60 }).session;
  } else if (stage.interaction === 'set_estimate_range') {
    session = dispatchLearningTask(session, task, 'set_estimate_value', { value: correct ? stage.estimateRules.acceptableRange.min : stage.estimateRules.inputRange.min }).session;
  } else if (stage.interaction === 'elapsed_time_model') {
    session = dispatchLearningTask(session, task, 'set_elapsed_minutes', { value: correct ? stage.elapsedRules.targetMinutes : stage.elapsedRules.targetMinutes - stage.elapsedRules.stepMinutes }).session;
  } else if (stage.interaction === 'angle_exploration') {
    const rules = stage.angleRules;
    if (rules.mode === 'identify') session = dispatchLearningTask(session, task, 'select_angle_option', { optionId: correct ? rules.correctOptionId : rules.options.find(({ id }) => id !== rules.correctOptionId).id }).session;
    else if (rules.mode === 'compare') {
      session = dispatchLearningTask(session, task, 'set_angle_comparison', { angleId: 'A', degrees: correct ? rules.targetAngleA : rules.targetAngleA + 5 }).session;
      session = dispatchLearningTask(session, task, 'set_angle_comparison', { angleId: 'B', degrees: rules.targetAngleB }).session;
      const wrong = rules.expectedRelation === 'greater' ? 'less' : 'greater';
      session = dispatchLearningTask(session, task, 'set_angle_comparison_answer', { relation: correct ? rules.expectedRelation : wrong }).session;
    } else if (rules.mode === 'right_angle') {
      session = dispatchLearningTask(session, task, 'set_angle_value', { degrees: correct ? rules.targetDegrees : rules.initialDegrees }).session;
      const wrong = rules.expectedRelation === 'greater' ? 'less' : 'greater';
      session = dispatchLearningTask(session, task, 'set_angle_comparison_answer', { relation: correct ? rules.expectedRelation : wrong }).session;
    } else session = dispatchLearningTask(session, task, 'set_angle_value', { degrees: correct ? rules.targetDegrees : Math.min(160, rules.targetDegrees + 20) }).session;
  }
  return dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:${correct ? 'right' : 'wrong'}` }).session;
}

test('三個跨領域候選活動都有唯一識別、課綱來源和可達的年級科目入口', () => {
  const crossDisciplineIds = [
    'ACT-G2-LIVING-CAMPUS-OBSERVATION-CANDIDATE',
    'ACT-G4-HPE-COURT-SAFETY-CANDIDATE',
    'ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE',
  ];
  const crossDisciplineTasks = CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => crossDisciplineIds.includes(activityId));
  const ids = CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId);
  assert.equal(crossDisciplineTasks.length, 3);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(CATALOG_CANDIDATE_TASKS.every((task) => validateLearningTask(task).length === 0));

  for (const task of CATALOG_CANDIDATE_TASKS) {
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    const curriculumEntries = [...mapData.verifiedLearningFocuses, ...mapData.supplementalVerifiedLearningFocuses, ...mapData.pendingLearningFocuses];
    assert.ok(curriculumEntries.some(({ id, sourceId, officialTextReviewStatus }) => id === task.curriculumMapId && sourceId === task.sourceId && ['verified_against_official_text', 'verified_against_official_text_this_run', 'verified_against_official_pdf_this_run', 'verified_against_official_pdf_existing_grade4_batch_2026-10-24', 'verified_against_official_text_existing_record_not_rechecked_this_turn', 'verified_against_official_text_existing_batch_not_rechecked_this_turn'].includes(officialTextReviewStatus)), `${task.activityId} must link to a focus with documented official-source verification`);
    const subject = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId)?.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(subject?.existingYearLevelContent.some((entry) => entry.activityId === task.activityId && entry.status === 'candidate_pending_teacher_review'));
    assert.ok(getLearningTaskRelation(task.gradeId, task.subjectId)?.tasks.some(({ taskId }) => taskId === task.activityId));
    assert.ok(task.stages.every(({ hints, incorrectFeedback }) => hints.length >= 2 && incorrectFeedback.length > 0));
  }
  assert.equal(new Set(crossDisciplineTasks.map(({ stages }) => stages[0].interaction)).size, 3);
});

test('四年級磁力活動三站：磁極、材料與強弱操作具備提交條件、回饋、重試及站點隔離', () => {
  const activityId = 'ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE';
  const task = CATALOG_CANDIDATE_TASKS.find(({ activityId: id }) => id === activityId);
  assert.ok(task, 'magnet activity is registered');
  assert.deepEqual(validateLearningTask(task), [], 'the existing interaction-rule validator accepts all magnet stages');
  const stages = task.stages.filter(({ interaction }) => interaction === 'magnet_interaction');
  assert.deepEqual(stages.map(({ magnetRules }) => magnetRules.mode), ['poles', 'materials', 'strength']);

  let session = dispatchLearningTask(createLearningTaskSession(task, 'magnet-stations-test'), task, 'start').session;

  const poles = stages[0];
  assert.equal(session.magnetModel.touched, false);
  let blocked = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-poles-unoperated' });
  assert.equal(blocked.error, 'response_required', 'the poles station cannot submit before an operation');
  session = dispatchLearningTask(session, task, 'hint').session;
  session = dispatchLearningTask(session, task, 'hint').session;
  session = dispatchLearningTask(session, task, 'flip_magnet').session;
  session = dispatchLearningTask(session, task, 'flip_magnet').session;
  assert.equal(session.magnetModel.facingPole, poles.magnetRules.initialFacingPole);
  let result = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-poles-wrong' });
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /同極相斥|異極相吸/);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  assert.deepEqual(session.magnetModel, {
    facingPole: poles.magnetRules.initialFacingPole, testedObjectIds: [], assignments: {},
    testedMagnetIds: [], selectedStrongerMagnetId: null, touched: false,
  }, 'retry resets only the active poles station model');
  session = dispatchLearningTask(session, task, 'flip_magnet').session;
  result = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-poles-correct' });
  assert.equal(result.session.phase, 'success');

  session = dispatchLearningTask(result.session, task, 'next').session;
  const materials = stages[1];
  assert.equal(session.stageIndex, task.stages.indexOf(materials));
  assert.deepEqual(session.magnetModel, {
    facingPole: null, testedObjectIds: [], assignments: {}, testedMagnetIds: [],
    selectedStrongerMagnetId: null, touched: false,
  }, 'entering materials initializes a clean station model');
  blocked = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-materials-incomplete' });
  assert.equal(blocked.error, 'response_required', 'materials cannot submit before all materials are tested and assigned');
  for (const material of materials.magnetRules.materials) {
    session = dispatchLearningTask(session, task, 'test_magnet_material', { materialId: material.id }).session;
    const categoryId = material.attracted ? 'attracted' : 'not-attracted';
    session = dispatchLearningTask(session, task, 'assign_magnet_material', { materialId: material.id, categoryId }).session;
  }
  const firstMaterial = materials.magnetRules.materials[0];
  session = dispatchLearningTask(session, task, 'assign_magnet_material', {
    materialId: firstMaterial.id, categoryId: firstMaterial.attracted ? 'not-attracted' : 'attracted',
  }).session;
  result = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-materials-wrong' });
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /分類|測試結果/);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  assert.deepEqual(session.magnetModel, {
    facingPole: null, testedObjectIds: [], assignments: {}, testedMagnetIds: [],
    selectedStrongerMagnetId: null, touched: false,
  }, 'retry clears tested materials and assignments');
  for (const material of materials.magnetRules.materials) {
    session = dispatchLearningTask(session, task, 'test_magnet_material', { materialId: material.id }).session;
    session = dispatchLearningTask(session, task, 'assign_magnet_material', {
      materialId: material.id, categoryId: material.attracted ? 'attracted' : 'not-attracted',
    }).session;
  }
  assert.equal(session.magnetModel.testedObjectIds.length, 5);
  result = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-materials-correct' });
  assert.equal(result.session.phase, 'success');

  session = dispatchLearningTask(result.session, task, 'next').session;
  const strength = stages[2];
  assert.equal(session.stageIndex, task.stages.indexOf(strength));
  assert.deepEqual(session.magnetModel, {
    facingPole: null, testedObjectIds: [], assignments: {}, testedMagnetIds: [],
    selectedStrongerMagnetId: null, touched: false,
  }, 'entering strength initializes a clean station model');
  blocked = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-strength-empty' });
  assert.equal(blocked.error, 'response_required');
  session = dispatchLearningTask(session, task, 'test_magnet_strength', { magnetId: strength.magnetRules.magnets[0].id }).session;
  blocked = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-strength-one-tested' });
  assert.equal(blocked.error, 'response_required', 'both magnets must be tested before selection and submission');
  session = dispatchLearningTask(session, task, 'test_magnet_strength', { magnetId: strength.magnetRules.magnets[1].id }).session;
  const wrongMagnetId = strength.magnetRules.magnets.find(({ id }) => id !== strength.magnetRules.targetStrongerMagnetId).id;
  session = dispatchLearningTask(session, task, 'select_stronger_magnet', { magnetId: wrongMagnetId }).session;
  result = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-strength-wrong' });
  assert.equal(result.session.phase, 'feedback');
  assert.match(result.session.lastFeedback.text, /吸起|觀察/);
  session = dispatchLearningTask(result.session, task, 'retry').session;
  assert.deepEqual(session.magnetModel, {
    facingPole: null, testedObjectIds: [], assignments: {}, testedMagnetIds: [],
    selectedStrongerMagnetId: null, touched: false,
  }, 'retry clears strength tests and selected magnet');
  for (const magnet of strength.magnetRules.magnets) {
    session = dispatchLearningTask(session, task, 'test_magnet_strength', { magnetId: magnet.id }).session;
  }
  session = dispatchLearningTask(session, task, 'select_stronger_magnet', { magnetId: strength.magnetRules.targetStrongerMagnetId }).session;
  result = dispatchLearningTask(session, task, 'submit', { submissionId: 'magnet-strength-correct' });
  assert.equal(result.session.phase, 'success');
  session = dispatchLearningTask(result.session, task, 'next').session;
  assert.equal(session.phase, 'completed');
});

test('三個三年級數學候選工坊可從數學目錄追溯並完成重玩，作答只留在記憶體', () => {
  const originalMathIds = new Set([
    'ACT-G3-MATH-DIVISION-SHARING-CANDIDATE',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE',
    'ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE',
  ]);
  const mathTasks = CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => originalMathIds.has(activityId));
  assert.equal(mathTasks.length, 3);
  assert.deepEqual(new Set(mathTasks.map(({ curriculumCodes }) => curriculumCodes[0])), new Set(['N-3-4', 'N-3-17', 'N-3-13']));
  const division = mathTasks.find(({ activityId }) => activityId === 'ACT-G3-MATH-DIVISION-SHARING-CANDIDATE');
  assert.equal(division.stages[1].correctOptionIds[0], 'division-check-4');
  assert.match(division.stages[1].options.find(({ id }) => id === 'division-check-4').text, /6 × 4 = 24/);
  assert.equal(24 / 6, 4);
  const time = mathTasks.find(({ activityId }) => activityId === 'ACT-G3-MATH-TIMEKEEPER-CANDIDATE');
  assert.equal(time.status, 'candidate_pending_teacher_review');
  assert.deepEqual(time.learningSubitemClaims, [
    'SUB-MATH-G3-N3-17-ORDER-DISPLAYED-TIME-LABELS',
    'SUB-MATH-G3-N3-17-SET-AND-READ-ANALOG-CLOCK',
    'SUB-MATH-G3-N3-17-ESTIMATE-ACTIVITY-DURATION',
    'SUB-MATH-G3-N3-17-ELAPSED-MINUTES-SAME-HOUR',
  ]);
  assert.deepEqual(time.stages.map(({ interaction }) => interaction), ['set_clock_time', 'choose_response', 'set_estimate_range', 'elapsed_time_model', 'elapsed_time_model', 'choose_response', 'assemble_response']);
  assert.equal(time.stages.find(({ stageId }) => stageId === 'order-journey-events').correctOptionIds.map((id) => time.stages.at(-1).tokens.find((token) => token.id === id).text).join('|'), '08:10 集合|08:25 出發|08:40 抵達觀察站');
  assert.equal(time.stages.find(({ stageId }) => stageId === 'timeline-elapsed-0910-to-0935').elapsedRules.targetMinutes, 25);
  assert.deepEqual(time.stages.find(({ interaction }) => interaction === 'set_estimate_range').estimateRules.acceptableRange, { min: 3, max: 10 });
  assert.equal(45 - 15, 30);
  const integratedTime = time.stages.find(({ stageId }) => stageId === 'integrated-read-clock-and-elapsed-time');
  assert.match(integratedTime.options.find(({ id }) => id === integratedTime.correctOptionIds[0]).text, /30 分鐘/);
  const angle = mathTasks.find(({ activityId }) => activityId === 'ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE');
  assert.equal(angle.stages.length, 6);
  assert.deepEqual(angle.stages.map(({ angleRules }) => angleRules.mode), ['identify', 'compare', 'right_angle', 'align', 'identify', 'compare']);
  assert.equal(angle.status, 'candidate_pending_teacher_review');
  assert.deepEqual(angle.learningSubitemClaims, ['SUB-MATH-G3-N3-13-S3-1-ANGLE-OPENING-COMPARISON']);
  for (const task of mathTasks) {
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
    const mathSubject = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
    assert.ok(mathSubject.existingYearLevelContent.some(({ activityId, status }) => activityId === task.activityId && status === 'candidate_pending_teacher_review'));
    assert.ok(getLearningTaskRelation('grade-3', 'mathematics').tasks.some(({ taskId }) => taskId === task.activityId));
    let session = dispatchLearningTask(createLearningTaskSession(task, `${task.activityId}-flow-test`), task, 'start').session;
    for (const [index, stage] of task.stages.entries()) {
      if (index > 0) session = dispatchLearningTask(session, task, 'next').session;
      session = submitStage(task, stage, session, false);
      assert.equal(session.phase, 'feedback');
      assert.ok(session.lastFeedback.text);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = submitStage(task, stage, session, true);
      assert.equal(session.phase, 'success');
    }
    session = dispatchLearningTask(session, task, 'next').session;
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(new Set(session.attempts.map(({ eventId }) => eventId)).size, session.attempts.length);
    assert.equal(dispatchLearningTask(session, task, 'restart').session.attempts.length, 0);
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.teacherReview.status, 'not_reviewed');
  }
});

test('生活課程觀察任務：可收集證據、錯誤重試、兩階段完成及重玩，過程只在記憶體', () => {
  const task = CATALOG_CANDIDATE_TASKS[0];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'living-candidate-test'), task, 'start').session;
  session = dispatchLearningTask(session, task, 'hint').session;
  session = submitStage(task, task.stages[0], session, false);
  assert.equal(session.phase, 'feedback');
  assert.equal(session.attempts[0].result, 'incorrect');
  session = dispatchLearningTask(session, task, 'retry').session;
  session = submitStage(task, task.stages[0], session, true);
  assert.equal(session.phase, 'success');
  assert.equal(session.attempts[1].hintUsed, true);
  session = dispatchLearningTask(session, task, 'next').session;
  session = submitStage(task, task.stages[1], session, true);
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 3);
  assert.equal(dispatchLearningTask(session, task, 'restart').session.phase, 'intro');
  assert.equal(unitRegistry.units.find(({ unitId }) => unitId === 'M3-NUM-01')?.status, 'candidate');
  assert.equal(learningMap.designBoundary.stage0Status, 'not_passed');
});

test('健康與體育安全任務：可完成分類及新情境遷移，完成不寫成精熟', () => {
  const task = CATALOG_CANDIDATE_TASKS[1];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'hpe-candidate-test'), task, 'start').session;
  session = submitStage(task, task.stages[0], session, false);
  assert.equal(session.phase, 'feedback');
  assert.match(session.lastFeedback.text, /安全|風險|停下/);
  session = dispatchLearningTask(session, task, 'retry').session;
  session = submitStage(task, task.stages[0], session, true);
  session = dispatchLearningTask(session, task, 'next').session;
  session = submitStage(task, task.stages[1], session, true);
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 3);
  assert.equal(task.evidencePolicy.completionIsMastery, false);
});

test('綜合活動學習步驟任務：錯誤排序可修正、完成後可重玩', () => {
  const task = CATALOG_CANDIDATE_TASKS[2];
  let session = dispatchLearningTask(createLearningTaskSession(task, 'integrative-candidate-test'), task, 'start').session;
  session = dispatchLearningTask(session, task, 'hint').session;
  session = submitStage(task, task.stages[0], session, false);
  assert.equal(session.phase, 'feedback');
  session = dispatchLearningTask(session, task, 'retry').session;
  session = submitStage(task, task.stages[0], session, true);
  session = dispatchLearningTask(session, task, 'next').session;
  session = submitStage(task, task.stages[1], session, true);
  session = dispatchLearningTask(session, task, 'next').session;
  session = submitStage(task, task.stages[2], session, true);
  session = dispatchLearningTask(session, task, 'next').session;
  assert.equal(session.phase, 'completed');
  assert.equal(new Set(session.attempts.map(({ eventId }) => eventId)).size, session.attempts.length);
  assert.equal(dispatchLearningTask(session, task, 'restart').session.attempts.length, 0);
});
