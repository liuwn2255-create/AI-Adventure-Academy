import test from 'node:test';
import assert from 'node:assert/strict';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';
import { getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { buildCoverageInventory } from '../scripts/curriculum-coverage.mjs';
import { readFileSync } from 'node:fs';

const map = JSON.parse(readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const definitions = JSON.parse(readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));
const gapIds = new Set(MATH_CURRICULUM_GAP_TASKS.map(({ activityId }) => activityId));

test('math gap tasks are unique, candidate-only, mapped and launchable from grade/subject catalog', () => {
  assert.equal(MATH_CURRICULUM_GAP_TASKS.length, 13);
  assert.equal(gapIds.size, 13);
  assert.ok(gapIds.has('ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE'));
  assert.ok(gapIds.has('ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE'));
  for (const task of MATH_CURRICULUM_GAP_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.ok(getCatalogCandidateTasksForSubject(task.gradeId, task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const catalogEntry = getGradeById(task.gradeId)?.subjects.find(({ subjectId }) => subjectId === task.subjectId)?.existingYearLevelContent.find(({ activityId }) => activityId === task.activityId);
    assert.ok(catalogEntry, `${task.activityId}: grade catalog launch entry missing`);
    assert.equal(catalogEntry.runtimeModule, task.runtimeModule, `${task.activityId}: grade catalog must preserve its runtime module`);
    const focus = [...map.verifiedLearningFocuses, ...map.supplementalVerifiedLearningFocuses, ...map.pendingLearningFocuses].find(({ id }) => id === task.curriculumMapId);
    assert.ok(focus, `${task.activityId}: curriculum focus missing`);
    if (task.activityId === 'ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE') {
      const audit = buildCoverageInventory({ curriculumMap: map, sources: JSON.parse(readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8')) }).learningSubitemAudit;
      const areaFocus = audit.allFocuses.find(({ focusId }) => focusId === task.curriculumMapId);
      assert.equal(areaFocus?.evidenceStatus, 'interactive_candidate_subitem_coverage');
      assert.ok(areaFocus.curatedProjectSubitems.some(({ subitemId }) => subitemId === task.coverage.subitemId));
    } else {
      assert.equal(focus.candidateActivityId, task.activityId);
      assert.equal(focus.coverageStatus, 'partial');
    }
    const subitem = definitions.definitions.find(({ subitemId }) => subitemId === task.coverage.subitemId);
    assert.ok(subitem, `${task.activityId}: subitem definition missing`);
    assert.deepEqual(subitem.activityIds, [task.activityId]);
  }
});

test('grade 2 sharing/packing and grade 3 division use distinct object models and explicit curriculum limits', () => {
  const sharing = MATH_CURRICULUM_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G2-MATH-SHARE-AND-PACK-PORT-CANDIDATE');
  const division = MATH_CURRICULUM_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G3-MATH-DIVISION-GROUPS-MULTIPLICATION-CHECK-CANDIDATE');
  assert.ok(sharing && division);
  assert.deepEqual(sharing.curriculumCodes, ['N-2-9', 'n-I-4']);
  assert.deepEqual(division.curriculumCodes, ['N-3-4', 'n-II-3']);
  assert.deepEqual(sharing.stages.map(({ distributionBoard }) => distributionBoard.mode), ['equal_share', 'equal_groups']);
  assert.equal(division.stages.filter(({ distributionBoard }) => distributionBoard?.mode === 'groups_with_remainder').length, 1);
  for (const task of [sharing, division]) {
    for (const stage of task.stages.filter(({ distributionBoard }) => distributionBoard)) {
      assert.equal(stage.observations.length, Object.keys(stage.correctAssignments).length);
      assert.equal(new Set(stage.observations.map(({ id }) => id)).size, stage.observations.length);
      assert.ok(stage.categories.length >= 2);
      assert.equal(stage.hints.length, 2);
      assert.ok(stage.distributionBoard.expectedGroupSize > 0);
    }
  }
  assert.match(sharing.curriculumScope, /不寫除式/);
  assert.match(sharing.curriculumScope, /不含餘數/);
  assert.match(division.curriculumScope, /先用等量分組模型處理整除，再處理有餘數/);
});

test('distribution board accepts any balanced allocation instead of a memorized object-to-bin pattern', () => {
  const task = MATH_CURRICULUM_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G2-MATH-SHARE-AND-PACK-PORT-CANDIDATE');
  const stage = task.stages[0];
  let session = act(createLearningTaskSession(task, `${task.activityId}:balanced-alternative`), task, 'start');
  for (const [index, observation] of stage.observations.entries()) {
    const category = stage.categories[(index + 1) % stage.categories.length];
    session = act(session, task, 'assign_category', { observationId: observation.id, categoryId: category.id });
  }
  const submitted = dispatchLearningTask(session, task, 'submit', { submissionId: 'balanced-alternative-allocation' });
  assert.equal(submitted.changed, true);
  assert.equal(submitted.session.lastFeedback.correct, true);
  assert.equal(submitted.session.phase, 'success');
});

function act(session, task, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${task.activityId}: ${action} ${JSON.stringify(payload)} failed: ${result.error}`);
  return result.session;
}

function perform(session, task, stage, wrong) {
  switch (stage.interaction) {
    case 'build_area_grid': {
      const rules = stage.areaGridRules;
      const toggle = (boardId, cellId) => {
        const [, row, column] = /^r(\d+)c(\d+)$/.exec(cellId);
        session = act(session, task, 'toggle_area_cell', { boardId, row: Number(row), column: Number(column) });
      };
      const fill = (board, cells) => { for (const cell of cells) toggle(board.id, cell); };
      if (rules.mode === 'estimate_cover') {
        session = act(session, task, 'set_area_estimate', { value: wrong ? rules.estimate.max : rules.boards[0].targetCells.length });
        fill(rules.boards[0], rules.boards[0].targetCells);
      } else if (rules.mode === 'cover_outline') fill(rules.boards[0], wrong ? [...rules.boards[0].targetCells, 'r3c3'] : rules.boards[0].targetCells);
      else if (rules.mode === 'same_area_different_shape') fill(rules.boards[0], wrong ? rules.boards[0].referenceCells : ['r0c0','r0c1','r0c2','r1c2','r2c2','r2c1']);
      else if (rules.mode === 'complete_missing_cells') {
        const board = rules.boards[0];
        const missing = board.targetCells.filter((cell) => !board.initialCells.includes(cell));
        fill(board, wrong ? missing.slice(0, 1) : missing);
      } else if (rules.mode === 'compare_regions') {
        for (const board of rules.boards) fill(board, board.targetCells);
        session = act(session, task, 'set_area_relation', { relation: wrong ? '>' : rules.correctRelation });
      } else if (rules.mode === 'constrained_build') fill(rules.boards[0], wrong ? ['r0c0','r0c1','r0c2','r0c3','r1c0','r1c1','r1c2','r1c3'] : ['r0c0','r0c1','r0c2','r1c0','r1c1','r1c2','r2c2','r2c3']);
      return session;
    }
    case 'classify_observations': {
      for (const observation of stage.observations) {
        const expected = stage.correctAssignments[observation.id];
        const categoryId = wrong && observation === stage.observations[0]
          ? stage.categories.find(({ id }) => id !== expected).id
          : expected;
        session = act(session, task, 'assign_category', { observationId: observation.id, categoryId });
      }
      return session;
    }
    case 'collect_evidence': {
      const requiredCount = stage.requiredSelectionCount ?? stage.correctOptionIds.length;
      const ids = stage.correctOptionIds.slice(0, requiredCount);
      if (wrong) ids[requiredCount - 1] = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
      for (const optionId of ids) session = act(session, task, 'toggle_evidence', { optionId });
      return session;
    }
    case 'choose_response': {
      const optionId = wrong ? stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id : stage.correctOptionIds[0];
      return act(session, task, 'select_option', { optionId });
    }
    case 'set_clock_time': {
      const { targetHour, targetMinute } = stage.clockRules;
      session = act(session, task, 'set_clock_hand', { hand: 'hour', value: wrong ? (targetHour % 12) + 1 : targetHour });
      return act(session, task, 'set_clock_hand', { hand: 'minute', value: wrong ? (targetMinute + stage.clockRules.minuteStep) % 60 : targetMinute });
    }
    case 'place_number_line_marker':
      return act(session, task, 'set_number_line_tick', { tick: wrong ? (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1) : stage.numberLine.targetTick });
    case 'build_volume': {
      const target = stage.volumeRules.target;
      const dimensions = wrong ? { ...target, rows: target.rows === 1 ? 2 : target.rows - 1 } : target;
      for (const [dimension, count] of Object.entries(dimensions)) for (let i = 0; i < count; i += 1) session = act(session, task, 'adjust_volume_dimension', { dimension, delta: 1 });
      return session;
    }
    case 'complete_symmetry_grid': {
      const rules = stage.symmetryRules;
      const cells = wrong ? [rules.fillableCellIds.find((id) => !rules.targetCellIds.includes(id)), ...rules.targetCellIds.slice(1)] : rules.targetCellIds;
      for (const cellId of cells) session = act(session, task, 'toggle_symmetry_cell', { cellId });
      return session;
    }
    case 'plot_line_chart': {
      for (let index = 0; index < stage.plotRules.points.length; index += 1) {
        const point = stage.plotRules.points[index];
        const value = wrong && index === 0 ? stage.plotRules.valueOptions.find((candidate) => candidate !== point.value) : point.value;
        session = act(session, task, 'set_line_chart_point', { pointId: point.id, value });
      }
      return session;
    }
    case 'complete_calculation_steps':
      for (const step of stage.calculationSteps) {
        const value = wrong && step === stage.calculationSteps[0]
          ? step.choices.find(({ value: choiceValue }) => choiceValue !== step.expectedValue).value
          : step.expectedValue;
        session = act(session, task, 'select_calculation_value', { stepId: step.id, value });
      }
      return session;
    case 'build_weight_scale': {
      const rules = stage.weightRules;
      if (rules.mode === 'estimate') return act(session, task, 'set_weight_estimate', { value: wrong ? rules.input.min : rules.targetGrams });
      if (rules.mode === 'balance') {
        const count = wrong ? Math.max(0, rules.targetCounterweights - 1) : rules.targetCounterweights;
        for (let index = 0; index < count; index += 1) session = act(session, task, 'adjust_weight_pan', { side: 'right', delta: 1 });
        return session;
      }
      if (rules.mode === 'read') return act(session, task, 'set_weight_scale_reading', { value: wrong ? rules.targetGrams - rules.input.step : rules.targetGrams });
      if (rules.mode === 'compare') {
        for (const item of rules.items) session = act(session, task, 'set_weight_scale_reading', { itemId: item.id, value: item.actualGrams });
        session = act(session, task, 'set_weight_relation', { relation: rules.targetRelation });
        const wrongDifference = rules.targetDifference === 0 ? 50 : rules.targetDifference - 50;
        return act(session, task, 'set_weight_difference', { value: wrong ? wrongDifference : rules.targetDifference });
      }
      if (rules.mode === 'convert') return act(session, task, 'set_weight_conversion', {
        kilograms: Math.floor(rules.targetGrams / 1000), grams: wrong ? (rules.targetGrams + 50) % 1000 : rules.targetGrams % 1000,
      });
      let chosen = [rules.items[0].id];
      if (!wrong) {
        const pair = rules.items.flatMap((item, index) => rules.items.slice(index + 1).map((other) => [item, other]))
          .find(([first, second]) => first.grams + second.grams === rules.targetGrams);
        if (!pair) throw new Error(`${task.activityId}/${stage.stageId}: no valid supply pair in test data`);
        chosen = pair.map(({ id }) => id);
      }
      for (const itemId of chosen) session = act(session, task, 'toggle_weight_supply_item', { itemId });
      return session;
    }
    default: throw new Error(`Test response builder does not support ${stage.interaction}`);
  }
}

test('each new task provides two hints, incorrect feedback, retry, correct completion and replay-ready session', () => {
  for (const task of MATH_CURRICULUM_GAP_TASKS) {
    let session = createLearningTaskSession(task, `${task.activityId}:test`);
    session = act(session, task, 'start');
    for (const stage of task.stages) {
      const stageIndex = task.stages.indexOf(stage);
      const hintOne = dispatchLearningTask(session, task, 'hint');
      assert.equal(hintOne.changed, true, `${task.activityId}/${stage.stageId}: hint one`);
      session = hintOne.session;
      const hintTwo = dispatchLearningTask(session, task, 'hint');
      assert.equal(hintTwo.changed, true, `${task.activityId}/${stage.stageId}: hint two`);
      session = hintTwo.session;
      session = perform(session, task, stage, true);
      let submitted = dispatchLearningTask(session, task, 'submit', { submissionId: `${task.activityId}:${stage.stageId}:wrong` });
      assert.equal(submitted.changed, true, `${task.activityId}/${stage.stageId}: invalid response was not evaluated`);
      assert.equal(submitted.session.phase, 'feedback');
      assert.equal(submitted.session.lastFeedback.correct, false);
      assert.ok(submitted.session.lastFeedback.text.length > 0);
      session = act(submitted.session, task, 'retry');
      session = perform(session, task, stage, false);
      submitted = dispatchLearningTask(session, task, 'submit', { submissionId: `${task.activityId}:${stage.stageId}:correct` });
      assert.equal(submitted.changed, true, `${task.activityId}/${stage.stageId}: correct response was not evaluated`);
      assert.equal(submitted.session.phase, 'success', `${task.activityId}/${stage.stageId}: correct response rejected`);
      assert.equal(submitted.session.lastFeedback.correct, true);
      session = act(submitted.session, task, 'next');
      if (stageIndex < task.stages.length - 1) assert.equal(session.stageIndex, stageIndex + 1);
    }
    assert.equal(session.phase, 'completed', `${task.activityId}: completion missing`);
    session = act(session, task, 'restart', { sessionId: `${task.activityId}:replay` });
    assert.equal(session.phase, 'intro');
    assert.equal(session.attempts.length, 0);
  }
});

test('math learning-content inventory includes verbatim-checked contiguous grade 1–6 table batches, without claiming a full national total', () => {
  const audit = JSON.parse(readFileSync(new URL('../curriculum/math-focused-clause-audit.json', import.meta.url), 'utf8'));
  const batch = JSON.parse(readFileSync(new URL('../curriculum/math-grade3-official-content-batch.json', import.meta.url), 'utf8'));
  const grade1Batch = JSON.parse(readFileSync(new URL('../curriculum/math-grade1-official-content-batch.json', import.meta.url), 'utf8'));
  const source = JSON.parse(readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8')).sources.find(({ id }) => id === 'mathematics');
  assert.equal(audit.clauses.length, 131);
  assert.equal(batch.clauses.length, 24);
  assert.equal(new Set(batch.clauses.map(({ code }) => code)).size, 24);
  assert.equal(batch.applicability.officialGradeTable, 3);
  assert.equal(batch.applicability.learningStage, '第二學習階段（三、四年級）');
  assert.equal(batch.applicability.semester, null);
  assert.deepEqual(batch.clauses.map(({ code }) => code), [
    'N-3-1', 'N-3-2', 'N-3-3', 'N-3-4', 'N-3-5', 'N-3-6', 'N-3-7', 'N-3-8', 'N-3-9', 'N-3-10', 'N-3-11', 'N-3-12', 'N-3-13', 'N-3-14', 'N-3-15', 'N-3-16', 'N-3-17',
    'S-3-1', 'S-3-2', 'S-3-3', 'S-3-4', 'R-3-1', 'R-3-2', 'D-3-1',
  ]);
  assert.equal(audit.auditStatus, 'verified_grade1_to_grade6_contiguous_content_table_batches_full_math_inventory_incomplete');
  for (const clause of audit.clauses) {
    assert.ok(source.verifiedClauses.includes(clause.code), `${clause.code} missing source registry`);
    assert.equal(clause.reviewStatus, 'verified_against_official_pdf_this_run');
    assert.ok(clause.sourceLocation && clause.officialText);
  }
  for (const clause of batch.clauses) {
    assert.ok(audit.clauses.some(({ code, officialText }) => code === clause.code && officialText === clause.officialText), `${clause.code} not merged verbatim`);
    assert.ok(clause.officialPerformanceLinks.every((code) => audit.learningPerformanceClauses.some(({ code: performanceCode }) => code === performanceCode)), `${clause.code} performance link unresolved`);
    assert.equal(clause.relationshipKind, 'explicit_same_table_corresponding_performance');
  }
  assert.equal(audit.officialInventoryTotal, null);
  assert.equal(grade1Batch.clauses.length, 11);
  assert.equal(new Set(grade1Batch.clauses.map(({ code }) => code)).size, 11);
  assert.equal(grade1Batch.applicability.officialGradeTable, 1);
  assert.equal(grade1Batch.applicability.learningStage, '第一學習階段（一、二年級）');
  assert.equal(grade1Batch.applicability.semester, null);
  assert.deepEqual(grade1Batch.clauses.map(({ code }) => code), ['N-1-1','N-1-2','N-1-3','N-1-4','N-1-5','N-1-6','S-1-1','S-1-2','R-1-1','R-1-2','D-1-1']);
  assert.equal(grade1Batch.clauses.find(({ code }) => code === 'N-1-5').equivalentOfficialCode, 'S-1-1');
  assert.equal(grade1Batch.clauses.find(({ code }) => code === 'S-1-1').equivalentOfficialCode, 'N-1-5');
  assert.ok(grade1Batch.clauses.every((row) => audit.clauses.some((clause) => clause.code === row.code && clause.officialText === row.officialText)));
  assert.equal(audit.learningPerformanceClauses.length, 58);
  assert.deepEqual(audit.performanceClauseAudit.byStage, { 1: 14, 2: 20, 3: 24 });
  assert.equal(audit.performanceClauseAudit.status, 'all_elementary_stage_learning_performance_rows_enumerated_from_official_pdf');
  for (const clause of audit.learningPerformanceClauses) {
    assert.ok(source.verifiedClauses.includes(clause.code), `${clause.code} missing source registry`);
    assert.equal(clause.reviewStatus, 'verified_against_official_pdf_this_run');
    assert.ok(clause.sourceLocation && clause.officialText);
  }
});

test('math audit inventories every catalog task stage and exposes ranked concrete gaps', () => {
  const report = JSON.parse(readFileSync(new URL('../artifacts/math-curriculum-audit-report.json', import.meta.url), 'utf8'));
  assert.equal(report.activityAudit.uniqueCatalogMathTaskCount, 81);
  assert.equal(report.activityAudit.previouslyExistingCatalogTaskCountAudited, 77);
  assert.equal(report.activityAudit.newlyAddedCatalogTaskCountThisBatch, 4);
  assert.equal(report.activityAudit.taskRows.length, 81);
  assert.ok(report.activityAudit.taskRows.some(({ activityId }) => activityId === 'ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE'));
  assert.ok(report.activityAudit.taskRows.some(({ activityId }) => activityId === 'ACT-G4-MATH-QUADRILATERAL-FEATURE-CONSTRUCTION-CANDIDATE'));
  assert.ok(report.activityAudit.taskRows.some(({ activityId }) => activityId === 'ACT-G4-MATH-AREA-PERIMETER-ARRAY-MODEL-CANDIDATE'));
  assert.ok(report.activityAudit.taskRows.some(({ activityId }) => activityId === 'ACT-G4-MATH-KILOMETER-ROUTE-AND-CONVERSION-CANDIDATE'));
  assert.ok(report.activityAudit.taskRows.some(({ activityId }) => activityId === 'ACT-G4-MATH-SQUARE-METER-FLOOR-PLANNER-CANDIDATE'));
  assert.equal(report.activityAudit.supplementaryStandaloneCandidateModuleCount, 6);
  assert.deepEqual(report.activityAudit.supplementaryStandaloneCandidateModules.map(({ curriculumCode }) => curriculumCode), ['N-3-1', 'N-3-2', 'N-3-9', 'N-3-12', 'N-3-14', 'N-3-16']);
  assert.ok(report.activityAudit.taskRows.every(({ stages }) => stages.length > 0 && stages.every(({ interaction, hints, incorrectFeedback, correctFeedback }) => interaction && hints?.length >= 2 && incorrectFeedback && correctFeedback)));
  assert.ok(report.activityAudit.taskRows.every(({ activityId, catalogLaunch }) => catalogLaunch?.entryRoute?.targetScreen === 'catalog-task' && catalogLaunch.runtimeModule && !catalogLaunch.runtimeModule.endsWith('/undefined')), 'all math tasks must have a resolvable grade-catalog launch route');
  assert.deepEqual(report.priorityGapQueue.rows.map(({ code }) => code), ['S-3-4', 'N-1-5', 'S-5-4', 'D-5-1']);
  assert.equal(report.source.officialElementaryClauseTotal, null);
  assert.equal(report.clauseBatch.officialInventoryRemainingIncomplete, true);
  assert.equal(report.clauseBatch.grade3ContiguousOfficialTableBatch.registeredRows, 24);
  assert.equal(report.clauseBatch.grade3ContiguousOfficialTableBatch.uniqueCodeCount, 24);
  assert.equal(report.clauseBatch.grade3ContiguousOfficialTableBatch.completeOnlyForThisTableBatch, true);
  assert.equal(report.clauseBatch.grade3ContiguousOfficialTableBatch.officialPerformanceLinksChecked, true);
  assert.ok(report.clauseBatch.verifiedOfficialLearningContentClauses.every(({ coverageStatus }) => ['partial', 'relation_only', 'uncovered'].includes(coverageStatus)));
  assert.equal(report.clauseBatch.coverageSummary.trackedOfficialLearningContentClauseDenominator, 131);
  assert.equal(report.clauseBatch.grade1ContiguousOfficialTableBatch.registeredRows, 11);
  assert.equal(report.clauseBatch.grade1ContiguousOfficialTableBatch.uniqueCodeCount, 11);
  assert.equal(report.clauseBatch.grade1ContiguousOfficialTableBatch.uniqueConceptCount, 10);
  assert.equal(report.clauseBatch.grade1ContiguousOfficialTableBatch.completeOnlyForThisTableBatch, true);
  assert.equal(report.clauseBatch.grade1ContiguousOfficialTableBatch.officialPerformanceLinksChecked, true);
  assert.equal(report.activityAudit.uniqueCatalogMathTaskCount, 81);
  assert.ok(report.activityAudit.taskRows.some(({ activityId }) => activityId === 'ACT-G1-MATH-SIMPLE-CLASSIFICATION-CANDIDATE'));
  assert.equal(report.clauseBatch.coverageSummary.officialElementaryMathTotal, null);
  assert.equal(report.clauseBatch.coverageSummary.taskDenominator, 81);
  assert.deepEqual(report.clauseBatch.grade3ContiguousOfficialTableBatch.coverageCountsWithinBatch, { partial: 24, relation_only: 0, uncovered: 0, needs_verification: 0 });
  const n317Focus = report.focusAudit.rows.find(({ focusId }) => focusId === 'math-grade3-n-3-17-time');
  assert.equal(n317Focus.recordedCoverageStatus, 'partial');
  assert.ok(n317Focus.interactionEvidenceActivityIds.includes('ACT-G3-MATH-TIMEKEEPER-CANDIDATE'));
  assert.equal(report.clauseBatch.grade2ContiguousOfficialTableBatch.registeredRows, 24);
  assert.equal(report.clauseBatch.grade2ContiguousOfficialTableBatch.uniqueCodeCount, 24);
  assert.deepEqual(report.clauseBatch.grade2ContiguousOfficialTableBatch.coverageCountsWithinBatch, { partial: 12, relation_only: 1, uncovered: 11, needs_verification: 0 });
  assert.equal(report.clauseBatch.grade4ContiguousOfficialTableBatch.registeredRows, 26);
  assert.equal(report.clauseBatch.grade4ContiguousOfficialTableBatch.uniqueCodeCount, 26);
  assert.equal(report.clauseBatch.grade4ContiguousOfficialTableBatch.uniqueConceptCount, 25);
  assert.deepEqual(report.clauseBatch.grade4ContiguousOfficialTableBatch.coverageCountsWithinBatch, { partial: 26, relation_only: 0, uncovered: 0, needs_verification: 0 });
  assert.equal(report.clauseBatch.grade5ContiguousOfficialTableBatch.registeredRows, 27);
  assert.equal(report.clauseBatch.grade5ContiguousOfficialTableBatch.uniqueCodeCount, 27);
  assert.deepEqual(report.clauseBatch.grade5ContiguousOfficialTableBatch.coverageCountsWithinBatch, { partial: 5, relation_only: 1, uncovered: 21, needs_verification: 0 });
  assert.equal(report.clauseBatch.grade6ContiguousOfficialTableBatch.registeredRows, 19);
  assert.equal(report.clauseBatch.grade6ContiguousOfficialTableBatch.uniqueCodeCount, 19);
  assert.equal(report.clauseBatch.grade6ContiguousOfficialTableBatch.uniqueConceptCount, 18);
  assert.deepEqual(report.clauseBatch.grade6ContiguousOfficialTableBatch.coverageCountsWithinBatch, { partial: 5, relation_only: 4, uncovered: 10, needs_verification: 0 });
  assert.equal(report.clauseBatch.crossGradeIntegration.officialCodeRowCount, 131);
  assert.equal(report.clauseBatch.crossGradeIntegration.uniqueOfficialCodeCount, 131);
  assert.equal(report.clauseBatch.crossGradeIntegration.explicitlyDeduplicatedConceptCount, 128);
  assert.deepEqual(report.clauseBatch.crossGradeIntegration.countByActivityEvidence, { partial: 79, relation_only: 8, uncovered: 44, needs_verification: 0 });
  assert.equal(report.clauseBatch.crossGradeIntegration.fullCurriculumInventoryComplete, false);
  assert.ok(report.clauseBatch.crossGradeIntegration.rows.some(({ code, mappedActivityIds }) => code === 'N-4-8' && mappedActivityIds.includes('ACT-G4-MATH-INTEGER-FRACTION-DECIMAL-NUMBER-LINE-CANDIDATE')));
  for (const [code, activityId, stageId] of [
    ['N-4-3', 'ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE', 'model-six-cartons-four-packs'],
    ['R-4-1', 'ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE', 'assemble-multiply-before-add'],
  ]) {
    const row = report.clauseBatch.verifiedOfficialLearningContentClauses.find((clause) => clause.code === code);
    assert.equal(row.coverageStatus, 'partial');
    assert.ok(row.activityIds.includes(activityId));
    assert.ok(row.interactionEvidence.some(({ stageIds }) => stageIds.includes(stageId)));
  }
});

test('grade 3 official math table has a distinct evidence-and-gap decision for every code row', () => {
  const batch = JSON.parse(readFileSync(new URL('../curriculum/math-grade3-official-content-batch.json', import.meta.url), 'utf8'));
  const report = JSON.parse(readFileSync(new URL('../artifacts/math-curriculum-audit-report.json', import.meta.url), 'utf8'));
  const rows = report.clauseBatch.verifiedOfficialLearningContentClauses.filter(({ gradeTable }) => gradeTable === 3);
  assert.equal(batch.clauses.length, 24, 'denominator is the checked Grade 3 table rows, not all elementary math content');
  assert.equal(rows.length, 24);
  assert.deepEqual(rows.map(({ code }) => code).sort(), batch.clauses.map(({ code }) => code).sort());

  const rowByCode = new Map(rows.map((row) => [row.code, row]));
  for (const clause of batch.clauses) {
    const row = rowByCode.get(clause.code);
    assert.equal(row.officialText, clause.officialText, `${clause.code} preserves official wording`);
    assert.deepEqual(row.officialPerformanceLinks, clause.officialPerformanceLinks);
    assert.ok(['partial', 'relation_only', 'uncovered', 'needs_verification'].includes(row.coverageStatus));
    assert.ok(row.activityIds.every((id) => report.activityAudit.taskRows.some((task) => task.activityId === id)), `${clause.code} activity links resolve`);
    assert.ok(row.limitations, `${clause.code} documents remaining scope or evidence limits`);
    const stageKeys = row.interactionEvidence.flatMap(({ activityId, stageIds }) => stageIds.map((stageId) => `${activityId}::${stageId}`));
    assert.equal(new Set(stageKeys).size, stageKeys.length, `${clause.code} evidence stages are not double-counted`);
  }

  const relationOnly = rows.filter(({ coverageStatus }) => coverageStatus === 'relation_only').map(({ code }) => code).sort();
  assert.deepEqual(relationOnly, []);
  const timeRow = rowByCode.get('N-3-17');
  assert.equal(timeRow.coverageStatus, 'partial', 'interactive time evidence remains bounded and does not establish full clause coverage');
  assert.deepEqual(timeRow.interactionEvidence.flatMap(({ activityId, stageIds }) => stageIds.map((stageId) => `${activityId}::${stageId}`)), [
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::set-analog-clock-to-320',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::match-analog-clock-to-digital-time',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::estimate-map-reading-duration',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::timeline-elapsed-0910-to-0935',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::timeline-elapsed-1005-to-1050',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::integrated-read-clock-and-elapsed-time',
    'ACT-G3-MATH-TIMEKEEPER-CANDIDATE::order-journey-events',
  ]);
  assert.ok(timeRow.limitations.includes('時間單位換算'));
  for (const code of relationOnly) {
    const row = rowByCode.get(code);
    assert.equal(row.interactionEvidence.length, 0, `${code} remains relation-only without a subitem stage claim`);
    assert.ok(row.relationOnlyIds.length > 0);
  }

  for (const [code, activityId, expectedStages] of [
    ['N-3-8', 'ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE', ['estimate-seed-bags', 'estimate-water-left', 'estimate-boxes-total', 'estimate-simple-sharing', 'check-estimate-reasonableness']],
    ['N-3-10', 'ACT-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE', ['place-four-tenths', 'place-six-tenths-after-one']],
    ['S-3-2', 'ACT-G3-MATH-GEOMETRY-CONSTRUCTION-CANDIDATE', ['identify-four-right-angles', 'identify-square-properties', 'build-square-on-grid', 'build-rectangle-on-grid']],
    ['S-3-3', 'ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE', ['adjust-compass-radius', 'identify-circle-center', 'identify-circle-radius', 'identify-circle-diameter']],
  ]) {
    const row = rowByCode.get(code);
    assert.equal(row.coverageStatus, 'partial', `${code} has bounded interactive evidence`);
    assert.ok(row.interactionEvidenceIds.includes(activityId));
    assert.deepEqual(row.interactionEvidence.flatMap(({ stageIds }) => stageIds), expectedStages);
  }
});
