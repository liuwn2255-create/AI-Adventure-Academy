import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { dispatchLearningTask, createLearningTaskSession, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildCoverageInventory } from '../scripts/curriculum-coverage.mjs';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';

const tasks = CATALOG_CANDIDATE_TASKS.filter((task) => task.learningSubitemClaims?.length);
const definitions = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));
const map = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const sources = JSON.parse(fs.readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8'));

function act(session, activity, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.changed, true, `${activity.activityId}/${activity.stages[session.stageIndex]?.stageId}/${action} should change state (error: ${result.error ?? 'none'})`);
  return result.session;
}

function setFractionModelResponse(session, activity, stage, wrong = false) {
  const rules = stage.fractionRules;
  session = act(session, activity, 'set_fraction_denominator', { denominator: rules.denominator });
  const alternateWhole = rules.wholeOptions?.find(({ id }) => id !== rules.targetWholeId);
  const useWrongWhole = wrong && rules.mode === 'build' && Boolean(alternateWhole);
  session = act(session, activity, 'select_fraction_whole', { wholeId: useWrongWhole ? alternateWhole.id : rules.targetWholeId });
  const move = (groupId, pieceIds) => {
    session = act(session, activity, 'select_fraction_model', { groupId });
    for (const pieceId of pieceIds) session = act(session, activity, 'move_fraction_piece', { pieceId, targetGroupId: groupId });
  };
  const from = (groupId) => rules.pieces.filter(({ initialGroupId }) => initialGroupId === groupId).map(({ id }) => id);
  if (rules.mode === 'build') move(rules.targetGroupId, from(rules.sourceGroupId).slice(0, rules.targetNumerator - (wrong && !useWrongWhole ? 1 : 0)));
  else if (rules.mode === 'compare') {
    const pieces = from(rules.sourceGroupId);
    move(rules.leftGroupId, pieces.slice(0, rules.leftNumerator));
    move(rules.rightGroupId, pieces.slice(rules.leftNumerator, rules.leftNumerator + rules.rightNumerator));
    session = act(session, activity, 'set_fraction_relation', { relation: wrong ? (rules.correctRelation === '<' ? '>' : '<') : rules.correctRelation });
  } else if (rules.mode === 'add') {
    const all = [...from(rules.firstOperandGroupId), ...from(rules.secondOperandGroupId)];
    move(rules.resultGroupId, wrong ? all.slice(0, -1) : all);
  } else if (rules.mode === 'subtract') {
    move(rules.removedGroupId, from(rules.startGroupId).slice(0, rules.removedNumerator - (wrong ? 1 : 0)));
  } else if (rules.mode === 'make_one') {
    const all = [...from(rules.firstOperandGroupId), ...from(rules.secondOperandGroupId)];
    move(rules.wholeGroupId, wrong ? all.slice(0, -1) : all);
  }
  return session;
}

function setCorrectResponse(session, activity, stage) {
  switch (stage.interaction) {
    case 'build_unknown_quantity_model': {
      const rules = stage.unknownQuantityRules;
      while (session.unknownQuantityValue < rules.targetValue) session = act(session, activity, 'adjust_unknown_quantity', { delta: 1 });
      while (session.unknownQuantityValue > rules.targetValue) session = act(session, activity, 'adjust_unknown_quantity', { delta: -1 });
      return session;
    }
    case 'build_area_grid': {
      const rules = stage.areaGridRules;
      const toggle = (boardId, cellId) => {
        const [, row, column] = /^r(\d+)c(\d+)$/.exec(cellId);
        session = act(session, activity, 'toggle_area_cell', { boardId, row: Number(row), column: Number(column) });
      };
      const fill = (board, cells) => { for (const cell of cells) toggle(board.id, cell); };
      if (rules.mode === 'estimate_cover') {
        session = act(session, activity, 'set_area_estimate', { value: rules.boards[0].targetCells.length });
        fill(rules.boards[0], rules.boards[0].targetCells);
      } else if (rules.mode === 'cover_outline') fill(rules.boards[0], rules.boards[0].targetCells);
      else if (rules.mode === 'same_area_different_shape') fill(rules.boards[0], ['r0c0','r0c1','r0c2','r1c2','r2c2','r2c1']);
      else if (rules.mode === 'complete_missing_cells') {
        const board = rules.boards[0];
        fill(board, board.targetCells.filter((cell) => !board.initialCells.includes(cell)));
      } else if (rules.mode === 'compare_regions') {
        for (const board of rules.boards) fill(board, board.targetCells);
        session = act(session, activity, 'set_area_relation', { relation: rules.correctRelation });
      } else if (rules.mode === 'constrained_build') fill(rules.boards[0], ['r0c0','r0c1','r0c2','r1c0','r1c1','r1c2','r2c2','r2c3']);
      return session;
    }
    case 'choose_response':
      return act(session, activity, 'select_option', { optionId: stage.correctOptionIds[0] });
    case 'place_number_line_marker':
      return act(session, activity, 'set_number_line_tick', { tick: stage.numberLine.targetTick });
    case 'classify_observations':
    case 'build_frequency_table':
      if (stage.collectionRules) for (const observationId of stage.collectionRules.requiredObservationIds) session = act(session, activity, 'toggle_table_observation', { observationId });
      for (const observation of stage.observations) session = act(session, activity, 'assign_category', { observationId: observation.id, categoryId: stage.correctAssignments[observation.id] });
      return session;
    case 'complete_calculation_steps':
      for (const step of stage.calculationSteps) session = act(session, activity, 'select_calculation_value', { stepId: step.id, value: step.expectedValue });
      return session;
    case 'build_place_value_blocks': {
      const rules = stage.placeValueRules;
      for (const { from, to } of rules.allowedExchanges) session = act(session, activity, 'exchange_place_value_block', { from, to });
      for (const place of ['thousands', 'hundreds', 'tens', 'ones']) {
        while (session.placeValueBlocks[place] < rules.targetCounts[place]) session = act(session, activity, 'adjust_place_value_block', { place, delta: 1 });
        while (session.placeValueBlocks[place] > rules.targetCounts[place]) session = act(session, activity, 'adjust_place_value_block', { place, delta: -1 });
      }
      return session;
    }
    case 'operate_vertical_calculation':
      for (const step of stage.calculationSteps) {
        while (session.verticalCalculationValues[step.id] < step.expectedValue) session = act(session, activity, 'adjust_vertical_calculation_step', { stepId: step.id, delta: 1 });
        while (session.verticalCalculationValues[step.id] > step.expectedValue) session = act(session, activity, 'adjust_vertical_calculation_step', { stepId: step.id, delta: -1 });
      }
      return session;
    case 'set_estimate_range':
      return act(session, activity, 'set_estimate_value', { value: Math.ceil(stage.estimateRules.acceptableRange.min / stage.estimateRules.inputRange.step) * stage.estimateRules.inputRange.step });
    case 'adjust_decimal_place_value': {
      let remaining = stage.decimalRules.targetHundredths - session.decimalHundredths;
      for (const [place, unit] of [['ones', 100], ['tenths', 10], ['hundredths', 1]]) {
        const count = Math.floor(Math.abs(remaining) / unit);
        const delta = Math.sign(remaining);
        for (let index = 0; index < count; index += 1) session = act(session, activity, 'adjust_decimal_place', { place, delta });
        remaining -= count * unit * delta;
      }
      assert.equal(remaining, 0, `${activity.activityId}/${stage.stageId} target must be reachable by place-value operations`);
      return session;
    }
    case 'adjust_circle_radius':
      return act(session, activity, 'set_circle_radius', { radius: stage.circleRules.targetRadius });
    case 'set_clock_time': {
      const { targetHour, targetMinute } = stage.clockRules;
      session = act(session, activity, 'set_clock_hand', { hand: 'hour', value: targetHour });
      return act(session, activity, 'set_clock_hand', { hand: 'minute', value: targetMinute });
    }
    case 'elapsed_time_model':
      return act(session, activity, 'set_elapsed_minutes', { value: stage.elapsedRules.targetMinutes });
    case 'build_volume': {
      for (const [dimension, count] of Object.entries(stage.volumeRules.target)) {
        for (let index = 0; index < count; index += 1) session = act(session, activity, 'adjust_volume_dimension', { dimension, delta: 1 });
      }
      return session;
    }
    case 'complete_symmetry_grid':
      for (const cellId of stage.symmetryRules.targetCellIds) session = act(session, activity, 'toggle_symmetry_cell', { cellId });
      return session;
    case 'plot_line_chart':
      for (const point of stage.plotRules.points) session = act(session, activity, 'set_line_chart_point', { pointId: point.id, value: point.value });
      return session;
    case 'assemble_response':
      for (const tokenId of stage.correctOptionIds) session = act(session, activity, 'add_phrase_token', { tokenId });
      return session;
    case 'compose_pattern': {
      const rules = stage.patternRules;
      if (rules.mode === 'number_builder') {
        session = act(session, activity, 'set_pattern_rule_value', { field: 'start', value: rules.targetStart });
        session = act(session, activity, 'set_pattern_rule_value', { field: 'increment', value: rules.targetIncrement });
        for (let index = 0; index < rules.termCount; index += 1) session = act(session, activity, 'append_pattern_sequence_term', { value: rules.targetStart + rules.targetIncrement * index });
      } else if (rules.mode === 'repair') {
        session = act(session, activity, 'select_pattern_repair_cell', { index: rules.errorIndex });
        session = act(session, activity, 'add_pattern_beat', { tokenId: rules.targetPattern[rules.errorIndex] });
      } else {
        const target = rules.targetPattern ?? Array.from({ length: rules.beatCount }, (_, index) => ['circle', 'square'][index % 2]);
        for (const tokenId of target) session = act(session, activity, 'add_pattern_beat', { tokenId });
      }
      return session;
    }
    case 'collect_evidence':
      for (const optionId of stage.correctOptionIds) session = act(session, activity, 'toggle_evidence', { optionId });
      return session;
    case 'compose_shape':
      for (const pieceId of stage.shapeRules.correctPieceIds) session = act(session, activity, 'toggle_shape_piece', { pieceId });
      return session;
    case 'order_items':
      return setOrder(session, activity, stage.correctItemIds);
    case 'geometry_exploration':
      return setGeometryResponse(session, activity, stage, true);
    case 'angle_exploration':
      return setAngleResponse(session, activity, stage, true);
    case 'construct_lines':
      return setLineResponse(session, activity, stage, true);
    case 'build_array': {
      for (let index = 0; index < stage.arrayRules.targetRows; index += 1) session = act(session, activity, 'adjust_array_dimension', { dimension: 'rows', delta: 1 });
      for (let index = 0; index < stage.arrayRules.targetColumns; index += 1) session = act(session, activity, 'adjust_array_dimension', { dimension: 'columns', delta: 1 });
      return session;
    }
    case 'build_bar_chart':
      for (const category of stage.barChartRules.categories) {
        for (let index = 0; index < category.value; index += 1) session = act(session, activity, 'adjust_bar_chart_bar', { categoryId: category.id, delta: 1 });
      }
      return session;
    case 'construct_triangle': {
      const solutions = {
        'construct-isosceles-triangle': ['r0c0', 'r0c4', 'r2c2'],
        'construct-right-triangle': ['r0c0', 'r0c4', 'r4c0'],
        'construct-acute-triangle': ['r0c0', 'r0c4', 'r3c2'],
        'construct-obtuse-triangle': ['r0c0', 'r0c4', 'r1c1'],
      };
      for (const pointId of solutions[stage.stageId]) session = act(session, activity, 'toggle_triangle_vertex', { pointId });
      return session;
    }
    case 'construct_quadrilateral': {
      const solutions = {
        'construct-square-on-grid': ['r0c0', 'r0c2', 'r2c2', 'r2c0'],
        'construct-rectangle-on-grid': ['r0c0', 'r0c3', 'r2c3', 'r2c0'],
        'construct-parallelogram-on-grid': ['r0c1', 'r1c3', 'r3c2', 'r2c0'],
      };
      for (const pointId of solutions[stage.stageId]) session = act(session, activity, 'toggle_quadrilateral_vertex', { pointId });
      return session;
    }
    case 'manipulate_fraction_model':
      return setFractionModelResponse(session, activity, stage);
    case 'measure_length_model': {
      const rules = stage.lengthRules;
      if (rules.mode === 'estimate') return act(session, activity, 'set_length_estimate', { value: rules.targetLength });
      if (rules.mode === 'align_read') {
        const delta = rules.object.start - rules.initialRulerZero;
        for (let index = 0; index < Math.abs(delta); index += 1) session = act(session, activity, 'move_length_ruler', { delta: Math.sign(delta) });
        return act(session, activity, 'set_length_reading', { objectId: rules.object.id, value: rules.object.length });
      }
      if (rules.mode === 'compare') {
        for (const object of rules.objects) session = act(session, activity, 'set_length_reading', { objectId: object.id, value: object.length });
        session = act(session, activity, 'set_length_difference', { value: Math.abs(rules.objects[0].length - rules.objects[1].length) });
        if (Number.isInteger(rules.conversionTargetMillimeters)) session = act(session, activity, 'set_length_conversion', { centimeters: Math.floor(rules.conversionTargetMillimeters / 10), millimeters: rules.conversionTargetMillimeters % 10 });
        return session;
      }
      if (rules.mode === 'convert') return act(session, activity, 'set_length_conversion', { centimeters: Math.floor(rules.targetMillimeters / 10), millimeters: rules.targetMillimeters % 10 });
      assert.fail(`Unsupported length mode ${rules.mode}`);
      break;
    }
    case 'build_weight_scale': {
      const rules = stage.weightRules;
      if (rules.mode === 'estimate') return act(session, activity, 'set_weight_estimate', { value: rules.targetGrams });
      if (rules.mode === 'balance') {
        for (let index = 0; index < rules.targetCounterweights; index += 1) session = act(session, activity, 'adjust_weight_pan', { side: 'right', delta: 1 });
        return session;
      }
      if (rules.mode === 'read') return act(session, activity, 'set_weight_scale_reading', { value: rules.targetGrams });
      if (rules.mode === 'compare') {
        for (const item of rules.items) session = act(session, activity, 'set_weight_scale_reading', { itemId: item.id, value: item.actualGrams });
        session = act(session, activity, 'set_weight_relation', { relation: rules.targetRelation });
        return act(session, activity, 'set_weight_difference', { value: rules.targetDifference });
      }
      if (rules.mode === 'convert') return act(session, activity, 'set_weight_conversion', { kilograms: Math.floor(rules.targetGrams / 1000), grams: rules.targetGrams % 1000 });
      const pair = rules.items.flatMap((item, index) => rules.items.slice(index + 1).map((other) => [item, other]))
        .find(([first, second]) => first.grams + second.grams === rules.targetGrams);
      assert.ok(pair, `${activity.activityId}/${stage.stageId} needs a valid supply combination`);
      for (const item of pair) session = act(session, activity, 'toggle_weight_supply_item', { itemId: item.id });
      return session;
    }
    case 'magnet_interaction': {
      const rules = stage.magnetRules;
      if (rules.mode === 'poles') return act(session, activity, 'flip_magnet');
      if (rules.mode === 'materials') {
        for (const material of rules.materials) {
          session = act(session, activity, 'test_magnet_material', { materialId: material.id });
          session = act(session, activity, 'assign_magnet_material', {
            materialId: material.id,
            categoryId: material.attracted ? 'attracted' : 'not-attracted',
          });
        }
        return session;
      }
      for (const magnet of rules.magnets) session = act(session, activity, 'test_magnet_strength', { magnetId: magnet.id });
      return act(session, activity, 'select_stronger_magnet', { magnetId: rules.targetStrongerMagnetId });
    }
    case 'build_capacity_model': {
      const rules = stage.capacityRules;
      if (rules.mode === 'estimate') return act(session, activity, 'set_capacity_estimate', { value: rules.acceptable.min });
      if (rules.mode === 'fill' || rules.mode === 'read') {
        for (let value = rules.initialMl; value < rules.targetMl; value += rules.stepMl) session = act(session, activity, 'adjust_capacity_volume', { delta: 1 });
        if (rules.mode === 'read') return act(session, activity, 'set_capacity_reading', { value: rules.targetMl });
        return session;
      }
      if (rules.mode === 'difference') {
        for (let value = rules.initialMl; value > rules.targetMl; value -= rules.stepMl) session = act(session, activity, 'adjust_capacity_volume', { delta: -1 });
        return act(session, activity, 'set_capacity_difference', { value: rules.expectedDifferenceMl });
      }
      if (rules.mode === 'compare') {
        for (const { id, capacityMl } of rules.containers) for (let value = 0; value < capacityMl; value += rules.stepMl) session = act(session, activity, 'adjust_capacity_container', { containerId: id, delta: 1 });
        return act(session, activity, 'set_capacity_relation', { relation: rules.relation });
      }
      const combination = [rules.items[0], rules.items[1], rules.items.find(({ volumeMl }) => volumeMl + rules.items[0].volumeMl + rules.items[1].volumeMl === rules.targetMl)].filter(Boolean);
      for (const item of combination) session = act(session, activity, 'toggle_capacity_supply_item', { itemId: item.id });
      return session;
    }
    default:
      assert.fail(`Unexpected interaction ${stage.interaction}`);
  }
}

function setValidWrongResponse(session, activity, stage) {
  switch (stage.interaction) {
    case 'build_unknown_quantity_model': {
      const rules = stage.unknownQuantityRules;
      const wrong = session.unknownQuantityValue < rules.max ? session.unknownQuantityValue + 1 : session.unknownQuantityValue - 1;
      return act(session, activity, 'adjust_unknown_quantity', { delta: wrong > session.unknownQuantityValue ? 1 : -1 });
    }
    case 'build_area_grid': {
      const rules = stage.areaGridRules;
      const toggle = (boardId, cellId) => {
        const [, row, column] = /^r(\d+)c(\d+)$/.exec(cellId);
        session = act(session, activity, 'toggle_area_cell', { boardId, row: Number(row), column: Number(column) });
      };
      const fill = (board, cells) => { for (const cell of cells) toggle(board.id, cell); };
      if (rules.mode === 'estimate_cover') {
        session = act(session, activity, 'set_area_estimate', { value: rules.estimate.max });
        fill(rules.boards[0], rules.boards[0].targetCells);
      } else if (rules.mode === 'cover_outline') fill(rules.boards[0], [...rules.boards[0].targetCells, 'r3c3']);
      else if (rules.mode === 'same_area_different_shape') fill(rules.boards[0], rules.boards[0].referenceCells);
      else if (rules.mode === 'complete_missing_cells') {
        const board = rules.boards[0];
        fill(board, board.targetCells.filter((cell) => !board.initialCells.includes(cell)).slice(0, 1));
      } else if (rules.mode === 'compare_regions') {
        for (const board of rules.boards) fill(board, board.targetCells);
        session = act(session, activity, 'set_area_relation', { relation: '>' });
      } else if (rules.mode === 'constrained_build') fill(rules.boards[0], ['r0c0','r0c1','r0c2','r0c3','r1c0','r1c1','r1c2','r1c3']);
      return session;
    }
    case 'choose_response':
      return act(session, activity, 'select_option', { optionId: stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id });
    case 'place_number_line_marker':
      return act(session, activity, 'set_number_line_tick', { tick: (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1) });
    case 'classify_observations':
    case 'build_frequency_table': {
      if (stage.collectionRules) for (const observationId of stage.collectionRules.requiredObservationIds) session = act(session, activity, 'toggle_table_observation', { observationId });
      if (stage.initialAssignments) return session;
      for (const observation of stage.observations) {
        const expected = stage.correctAssignments[observation.id];
        const wrong = stage.categories.find(({ id }) => id !== expected);
        session = act(session, activity, 'assign_category', { observationId: observation.id, categoryId: observation.id === stage.observations[0].id ? wrong.id : expected });
      }
      return session;
    }
    case 'complete_calculation_steps':
      for (const [index, step] of stage.calculationSteps.entries()) {
        const wrong = step.choices.find(({ value }) => value !== step.expectedValue);
        session = act(session, activity, 'select_calculation_value', { stepId: step.id, value: index === 0 ? wrong.value : step.expectedValue });
      }
      return session;
    case 'build_place_value_blocks': {
      const rules = stage.placeValueRules;
      for (const { from, to } of rules.allowedExchanges) session = act(session, activity, 'exchange_place_value_block', { from, to });
      const place = rules.maxCounts.ones > rules.targetCounts.ones ? 'ones' : 'tens';
      const delta = session.placeValueBlocks[place] < rules.maxCounts[place] ? 1 : -1;
      return act(session, activity, 'adjust_place_value_block', { place, delta });
    }
    case 'operate_vertical_calculation': {
      const first = stage.calculationSteps[0];
      const wrongValue = first.expectedValue > first.minValue ? first.expectedValue - 1 : first.expectedValue + 1;
      for (const [index, step] of stage.calculationSteps.entries()) {
        const target = index === 0 ? wrongValue : step.expectedValue;
        while (session.verticalCalculationValues[step.id] < target) session = act(session, activity, 'adjust_vertical_calculation_step', { stepId: step.id, delta: 1 });
        while (session.verticalCalculationValues[step.id] > target) session = act(session, activity, 'adjust_vertical_calculation_step', { stepId: step.id, delta: -1 });
      }
      return session;
    }
    case 'set_estimate_range': {
      const { inputRange, acceptableRange } = stage.estimateRules;
      let value = inputRange.min;
      while (value <= inputRange.max && value >= acceptableRange.min && value <= acceptableRange.max) value += inputRange.step;
      return act(session, activity, 'set_estimate_value', { value: value <= inputRange.max ? value : inputRange.min });
    }
    case 'adjust_decimal_place_value': {
      const rules = stage.decimalRules;
      const step = session.decimalHundredths < rules.maxHundredths ? 1 : -1;
      return act(session, activity, 'adjust_decimal_place', { place: 'hundredths', delta: step });
    }
    case 'adjust_circle_radius':
      return act(session, activity, 'set_circle_radius', { radius: stage.circleRules.allowedRadii.find((radius) => radius !== stage.circleRules.targetRadius) });
    case 'set_clock_time': {
      const { targetHour, targetMinute, minuteStep } = stage.clockRules;
      session = act(session, activity, 'set_clock_hand', { hand: 'hour', value: targetHour === 12 ? 11 : targetHour + 1 });
      return act(session, activity, 'set_clock_hand', { hand: 'minute', value: (targetMinute + minuteStep) % 60 });
    }
    case 'elapsed_time_model':
      return act(session, activity, 'set_elapsed_minutes', { value: stage.elapsedRules.targetMinutes - stage.elapsedRules.stepMinutes });
    case 'build_volume': {
      const target = stage.volumeRules.target;
      const wrong = { ...target, rows: target.rows === 1 ? 2 : target.rows - 1 };
      for (const [dimension, count] of Object.entries(wrong)) {
        for (let index = 0; index < count; index += 1) session = act(session, activity, 'adjust_volume_dimension', { dimension, delta: 1 });
      }
      return session;
    }
    case 'complete_symmetry_grid': {
      const rules = stage.symmetryRules;
      const wrongCells = [rules.fillableCellIds.find((id) => !rules.targetCellIds.includes(id)), ...rules.targetCellIds.slice(1)];
      for (const cellId of wrongCells) session = act(session, activity, 'toggle_symmetry_cell', { cellId });
      return session;
    }
    case 'assemble_response': {
      const distractor = stage.tokens.find(({ id }) => !stage.correctOptionIds.includes(id));
      const wrong = distractor
        ? [distractor.id, ...stage.correctOptionIds.slice(0, stage.correctOptionIds.length - 1)]
        : [...stage.correctOptionIds].reverse();
      for (const tokenId of wrong) session = act(session, activity, 'add_phrase_token', { tokenId });
      return session;
    }
    case 'compose_pattern': {
      const rules = stage.patternRules;
      if (rules.mode === 'number_builder') {
        session = act(session, activity, 'set_pattern_rule_value', { field: 'start', value: rules.targetStart });
        session = act(session, activity, 'set_pattern_rule_value', { field: 'increment', value: rules.targetIncrement });
        for (let index = 0; index < rules.termCount; index += 1) session = act(session, activity, 'append_pattern_sequence_term', { value: rules.targetStart + rules.targetIncrement * index + (index === 0 ? 1 : 0) });
        return session;
      }
      if (rules.mode === 'repair') {
        session = act(session, activity, 'select_pattern_repair_cell', { index: Math.max(0, rules.errorIndex - 1) });
        session = act(session, activity, 'add_pattern_beat', { tokenId: rules.targetPattern[rules.errorIndex] });
        return session;
      }
      const target = rules.targetPattern ?? Array.from({ length: rules.beatCount }, (_, index) => ['circle', 'circle'][index % 2]);
      const distractor = stage.tokens.find(({ id }) => !target.includes(id));
      const wrong = distractor
        ? [distractor.id, ...target.slice(0, stage.patternRules.beatCount - 1)]
        : [...target].reverse();
      for (const tokenId of wrong) session = act(session, activity, 'add_pattern_beat', { tokenId });
      return session;
    }
    case 'order_items':
      return setOrder(session, activity, [...stage.correctItemIds].reverse());
    case 'plot_line_chart':
      for (const [index, point] of stage.plotRules.points.entries()) {
        const value = index === 0 ? stage.plotRules.valueOptions.find((candidate) => candidate !== point.value) : point.value;
        session = act(session, activity, 'set_line_chart_point', { pointId: point.id, value });
      }
      return session;
    case 'assemble_response':
      for (const tokenId of [...stage.correctOptionIds].reverse()) session = act(session, activity, 'add_phrase_token', { tokenId });
      return session;
    case 'collect_evidence':
      return act(session, activity, 'toggle_evidence', { optionId: stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id });
    case 'compose_shape': {
      const correct = [...stage.shapeRules.correctPieceIds];
      const wrong = [...correct.slice(1), stage.pieces.find(({ id }) => !correct.includes(id)).id];
      for (const pieceId of wrong) session = act(session, activity, 'toggle_shape_piece', { pieceId });
      return session;
    }
    case 'order_items':
      return setOrder(session, activity, [...stage.correctItemIds].reverse());
    case 'geometry_exploration':
      return setGeometryResponse(session, activity, stage, false);
    case 'angle_exploration':
      return setAngleResponse(session, activity, stage, false);
    case 'construct_lines':
      return setLineResponse(session, activity, stage, false);
    case 'build_array': {
      for (let index = 0; index < stage.arrayRules.targetRows; index += 1) session = act(session, activity, 'adjust_array_dimension', { dimension: 'rows', delta: 1 });
      for (let index = 0; index < stage.arrayRules.targetColumns - 1; index += 1) session = act(session, activity, 'adjust_array_dimension', { dimension: 'columns', delta: 1 });
      return session;
    }
    case 'build_bar_chart': {
      for (const category of stage.barChartRules.categories) {
        for (let index = 0; index < category.value; index += 1) session = act(session, activity, 'adjust_bar_chart_bar', { categoryId: category.id, delta: 1 });
      }
      const first = stage.barChartRules.categories[0];
      session = act(session, activity, 'adjust_bar_chart_bar', { categoryId: first.id, delta: 1 });
      return session;
    }
    case 'construct_triangle':
      for (const pointId of ['r0c0', 'r0c1', 'r0c2']) session = act(session, activity, 'toggle_triangle_vertex', { pointId });
      return session;
    case 'construct_quadrilateral':
      for (const pointId of ['r0c0', 'r0c2', 'r3c3', 'r2c0']) session = act(session, activity, 'toggle_quadrilateral_vertex', { pointId });
      return session;
    case 'manipulate_fraction_model':
      return setFractionModelResponse(session, activity, stage, true);
    case 'measure_length_model': {
      const rules = stage.lengthRules;
      if (rules.mode === 'estimate') return act(session, activity, 'set_length_estimate', { value: rules.estimateRange.min });
      if (rules.mode === 'align_read') {
        const wrongZero = rules.object.start === rules.rulerZeroRange.max ? rules.object.start - 1 : rules.object.start + 1;
        session = act(session, activity, 'move_length_ruler', { delta: wrongZero > rules.initialRulerZero ? 1 : -1 });
        return act(session, activity, 'set_length_reading', { objectId: rules.object.id, value: rules.object.length });
      }
      if (rules.mode === 'compare') {
        for (const [index, object] of rules.objects.entries()) session = act(session, activity, 'set_length_reading', { objectId: object.id, value: object.length + (index === 0 ? 1 : 0) });
        session = act(session, activity, 'set_length_difference', { value: Math.abs(rules.objects[0].length - rules.objects[1].length) });
        if (Number.isInteger(rules.conversionTargetMillimeters)) session = act(session, activity, 'set_length_conversion', { centimeters: Math.floor(rules.conversionTargetMillimeters / 10), millimeters: rules.conversionTargetMillimeters % 10 });
        return session;
      }
      if (rules.mode === 'convert') return act(session, activity, 'set_length_conversion', { centimeters: 0, millimeters: 0 });
      assert.fail(`Unsupported length mode ${rules.mode}`);
      break;
    }
    case 'build_weight_scale': {
      const rules = stage.weightRules;
      if (rules.mode === 'estimate') return act(session, activity, 'set_weight_estimate', { value: rules.input.min });
      if (rules.mode === 'balance') {
        for (let index = 0; index < Math.max(0, rules.targetCounterweights - 1); index += 1) session = act(session, activity, 'adjust_weight_pan', { side: 'right', delta: 1 });
        return session;
      }
      if (rules.mode === 'read') return act(session, activity, 'set_weight_scale_reading', { value: rules.targetGrams - rules.input.step });
      if (rules.mode === 'compare') {
        for (const item of rules.items) session = act(session, activity, 'set_weight_scale_reading', { itemId: item.id, value: item.actualGrams });
        session = act(session, activity, 'set_weight_relation', { relation: rules.targetRelation });
        return act(session, activity, 'set_weight_difference', { value: rules.targetDifference === 0 ? 50 : rules.targetDifference - 50 });
      }
      if (rules.mode === 'convert') return act(session, activity, 'set_weight_conversion', { kilograms: Math.floor(rules.targetGrams / 1000), grams: (rules.targetGrams + 50) % 1000 });
      return act(session, activity, 'toggle_weight_supply_item', { itemId: rules.items[0].id });
    }
    case 'magnet_interaction': {
      const rules = stage.magnetRules;
      if (rules.mode === 'poles') {
        session = act(session, activity, 'flip_magnet');
        return act(session, activity, 'flip_magnet');
      }
      if (rules.mode === 'materials') {
        for (const material of rules.materials) {
          session = act(session, activity, 'test_magnet_material', { materialId: material.id });
          session = act(session, activity, 'assign_magnet_material', {
            materialId: material.id,
            categoryId: material.attracted ? 'not-attracted' : 'attracted',
          });
        }
        return session;
      }
      for (const magnet of rules.magnets) session = act(session, activity, 'test_magnet_strength', { magnetId: magnet.id });
      const wrong = rules.magnets.find(({ id }) => id !== rules.targetStrongerMagnetId);
      return act(session, activity, 'select_stronger_magnet', { magnetId: wrong.id });
    }
    case 'build_capacity_model': {
      const rules = stage.capacityRules;
      if (rules.mode === 'estimate') return act(session, activity, 'set_capacity_estimate', { value: rules.input.min });
      if (rules.mode === 'fill') {
        for (let value = rules.initialMl; value < rules.targetMl - rules.stepMl; value += rules.stepMl) session = act(session, activity, 'adjust_capacity_volume', { delta: 1 });
        return session;
      }
      if (rules.mode === 'read') {
        for (let value = rules.initialMl; value < rules.targetMl; value += rules.stepMl) session = act(session, activity, 'adjust_capacity_volume', { delta: 1 });
        return act(session, activity, 'set_capacity_reading', { value: rules.targetMl - rules.readingStepMl });
      }
      if (rules.mode === 'compare') {
        for (const { id, capacityMl } of rules.containers) for (let value = 0; value < capacityMl; value += rules.stepMl) session = act(session, activity, 'adjust_capacity_container', { containerId: id, delta: 1 });
        return act(session, activity, 'set_capacity_relation', { relation: rules.relation === '=' ? '<' : '=' });
      }
      if (rules.mode === 'difference') {
        for (let value = rules.initialMl; value > rules.targetMl; value -= rules.stepMl) session = act(session, activity, 'adjust_capacity_volume', { delta: -1 });
        return act(session, activity, 'set_capacity_difference', { value: rules.expectedDifferenceMl - rules.answerStepMl });
      }
      return act(session, activity, 'toggle_capacity_supply_item', { itemId: rules.items[0].id });
    }
    default:
      assert.fail(`Unexpected interaction ${stage.interaction}`);
  }
}

function setOrder(session, activity, target) {
  for (let targetIndex = 0; targetIndex < target.length; targetIndex += 1) {
    const currentIndex = session.orderedItems.indexOf(target[targetIndex]);
    if (currentIndex !== targetIndex) session = act(session, activity, 'move_ordered_item', { itemId: target[targetIndex], toIndex: targetIndex });
  }
  return session;
}

function setGeometryResponse(session, activity, stage, correct) {
  const send = (action, payload = {}) => act(session, activity, action, payload);
  if (stage.geometryMode === 'split_recompose') {
    if (activity.activityId === 'ACT-G4-MATH-CONGRUENT-FIGURE-TRANSFORM-CANDIDATE') {
      const pieceId = stage.pieces[0].id;
      if (!correct) return send('move_geometry_piece', { pieceId, direction: 'right' });
      if (stage.stageId === 'translate-congruent-tile') {
        session = send('move_geometry_piece', { pieceId, direction: 'down' });
        for (let index = 0; index < 3; index += 1) session = act(session, activity, 'move_geometry_piece', { pieceId, direction: 'right' });
        return session;
      }
      if (stage.stageId === 'rotate-congruent-tile') {
        session = send('rotate_geometry_piece', { pieceId });
        session = act(session, activity, 'move_geometry_piece', { pieceId, direction: 'down' });
        return act(session, activity, 'move_geometry_piece', { pieceId, direction: 'right' });
      }
      session = send('flip_geometry_piece', { pieceId });
      session = act(session, activity, 'move_geometry_piece', { pieceId, direction: 'down' });
      for (let index = 0; index < 3; index += 1) session = act(session, activity, 'move_geometry_piece', { pieceId, direction: 'right' });
      return session;
    }
    if (!correct) return send('move_geometry_piece', { pieceId: stage.pieces[0].id, direction: 'right' });
    if (stage.stageId === 'recompose-square-from-two-dominoes') {
      session = send('move_geometry_piece', { pieceId: 'domino-top', direction: 'down' });
      return act(session, activity, 'rotate_geometry_piece', { pieceId: 'domino-bottom' });
    }
    session = send('move_geometry_piece', { pieceId: 'l-piece-a', direction: 'down' });
    session = act(session, activity, 'move_geometry_piece', { pieceId: 'l-piece-a', direction: 'right' });
    session = act(session, activity, 'move_geometry_piece', { pieceId: 'l-piece-b', direction: 'up' });
    return act(session, activity, 'move_geometry_piece', { pieceId: 'l-piece-b', direction: 'left' });
  }
  session = send('select_geometry_net', { netId: correct ? (stage.stageId.includes('another') ? 'offset-net' : 'cross-net') : 'cross-net' });
  session = act(session, activity, 'simulate_geometry_fold');
  return act(session, activity, 'set_geometry_adjacency_answer', { adjacent: correct });
}

function setAngleResponse(session, activity, stage, correct) {
  const send = (action, payload = {}) => act(session, activity, action, payload);
  const rules = stage.angleRules;
  if (rules.mode === 'identify') {
    const optionId = correct ? rules.correctOptionId : rules.options.find(({ id }) => id !== rules.correctOptionId).id;
    return send('select_angle_option', { optionId });
  }
  if (rules.mode === 'compare') {
    session = send('set_angle_comparison', { angleId: 'A', degrees: correct ? rules.targetAngleA : rules.targetAngleA + 5 });
    session = act(session, activity, 'set_angle_comparison', { angleId: 'B', degrees: rules.targetAngleB });
    const wrongRelation = rules.expectedRelation === 'greater' ? 'less' : 'greater';
    return act(session, activity, 'set_angle_comparison_answer', { relation: correct ? rules.expectedRelation : wrongRelation });
  }
  if (rules.mode === 'right_angle') {
    session = send('set_angle_value', { degrees: correct ? rules.targetDegrees : rules.initialDegrees });
    const wrongRelation = rules.expectedRelation === 'greater' ? 'less' : 'greater';
    return act(session, activity, 'set_angle_comparison_answer', { relation: correct ? rules.expectedRelation : wrongRelation });
  }
  if (rules.mode === 'align') return send('set_angle_value', { degrees: correct ? rules.targetDegrees : Math.min(160, rules.targetDegrees + 20) });
  if (rules.mode === 'estimate' || rules.mode === 'draw') {
    const wrongStepCount = Math.floor(rules.tolerance / rules.valueRange.step) + 1;
    const degrees = correct ? rules.targetDegrees : Math.min(rules.valueRange.max, rules.targetDegrees + wrongStepCount * rules.valueRange.step);
    return send('set_angle_value', { degrees });
  }
  if (rules.mode === 'measure') {
    while (session.angleCenterOffset !== 0) session = send('adjust_angle_alignment', { part: 'center', delta: session.angleCenterOffset < 0 ? 1 : -1 });
    while (session.angleBaselineOffset !== 0) session = send('adjust_angle_alignment', { part: 'baseline', delta: session.angleBaselineOffset < 0 ? 1 : -1 });
    session = act(session, activity, 'set_angle_baseline_side', { side: correct ? rules.expectedSide : (rules.expectedSide === 'left' ? 'right' : 'left') });
    return act(session, activity, 'set_angle_reading', { degrees: rules.targetDegrees });
  }
  return send('set_angle_rotation', { direction: correct ? rules.expectedDirection : (rules.expectedDirection === 'clockwise' ? 'counterclockwise' : 'clockwise'), degrees: rules.targetDegrees });
}

function setLineResponse(session, activity, stage, correct) {
  const responses = {
    'construct-perpendicular-through-crossing': {
      correct: ['r0c3', 'r6c3'], wrong: ['r3c1', 'r3c5'],
    },
    'construct-parallel-and-compare-spacing': {
      correct: ['r0c3', 'r3c6'], wrong: ['r0c0', 'r3c3'],
    },
    'construct-perpendicular-to-diagonal': {
      correct: ['r0c6', 'r6c0'], wrong: ['r1c1', 'r5c5'],
    },
  };
  for (const pointId of responses[stage.stageId][correct ? 'correct' : 'wrong']) {
    session = act(session, activity, 'select_line_construction_point', { pointId });
  }
  return session;
}

test('all explicitly targeted subitems resolve to unique candidate tasks in the proper grade and subject directories', () => {
  const claimedDefinitionCount = definitions.definitions.filter(({ activityIds }) => activityIds.length > 0).length;
  assert.equal(tasks.reduce((count, task) => count + task.learningSubitemClaims.length, 0), claimedDefinitionCount);
  assert.equal(definitions.definitions.filter(({ decompositionKind }) => decompositionKind === 'project_decomposition_from_verified_official_stage_clause_not_official_subclause').length, 35);
  assert.ok(tasks.some(({ activityId }) => activityId === 'ACT-G1-MATH-MONEY-COUNT-EXCHANGE-CANDIDATE'));
  assert.ok(tasks.some(({ activityId }) => activityId === 'ACT-G2-MATH-CLOCK-HANDS-CANDIDATE'));
  assert.ok(tasks.some(({ activityId }) => activityId === 'ACT-G4-MATH-UNIT-CUBE-VOLUME-BUILDER-CANDIDATE'));
  assert.ok(tasks.some(({ activityId }) => activityId === 'ACT-G6-MATH-BASE-COMPARISON-RATIO-CANDIDATE'));
  assert.equal(tasks.reduce((count, task) => count + task.learningSubitemClaims.length, 0), claimedDefinitionCount);
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  assert.equal(new Set(definitions.definitions.map(({ subitemId }) => subitemId)).size, definitions.definitions.length);
  for (const task of tasks) {
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.ok(task.learningObjective.statement && task.curriculumScope && task.openQuestions.length >= 1);
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.ok(getCatalogCandidateTasksForSubject(task.gradeId, task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const focus = [...map.verifiedLearningFocuses, ...map.supplementalVerifiedLearningFocuses, ...map.pendingLearningFocuses].find(({ id }) => id === task.curriculumMapId);
    assert.ok(focus, `${task.activityId} must point to a registered focus`);
    const linkedFocusIds = [task.curriculumMapId, ...(task.relatedCurriculumMapIds ?? [])];
    const linkedFocuses = [...map.verifiedLearningFocuses, ...map.supplementalVerifiedLearningFocuses, ...map.pendingLearningFocuses].filter(({ id }) => linkedFocusIds.includes(id));
    assert.ok(task.curriculumCodes.every((code) => linkedFocuses.some((linkedFocus) => [...(linkedFocus.contentCodes ?? []), ...(linkedFocus.performanceCodes ?? [])].includes(code))));
    for (const claim of task.learningSubitemClaims) assert.ok(definitions.definitions.some(({ subitemId, activityIds }) => subitemId === claim && activityIds.includes(task.activityId)));
    for (const claim of task.learningSubitemClaims) {
      const definition = definitions.definitions.find(({ subitemId }) => subitemId === claim);
      const stageIds = new Set(task.stages.map(({ stageId }) => stageId));
      assert.ok(definition.evidenceStageIds.length > 0);
      assert.ok(definition.evidenceStageIds.every((stageId) => stageIds.has(stageId)), `${claim} references actual activity stages`);
    }
  }
  assert.equal(sources.sources.find(({ id }) => id === 'mathematics').verifiedClauses.includes('N-1-1'), true);
  assert.equal(sources.sources.find(({ id }) => id === 'mathematics').verifiedClauses.includes('N-1-2'), true);
  assert.equal(sources.sources.find(({ id }) => id === 'mathematics').verifiedClauses.includes('N-2-2'), true);
});

test('each new activity provides incorrect feedback, hint-assisted retries, stage progression, completion and replay in the shared engine', () => {
  for (const activity of tasks) {
    let session = createLearningTaskSession(activity, `subitem-test:${activity.activityId}`);
    session = act(session, activity, 'start');
    for (const stage of activity.stages) {
      assert.equal(session.phase, 'active');
      session = act(session, activity, 'hint');
      session = act(session, activity, 'hint');
      assert.equal(session.hintLevel, 2);
      session = setValidWrongResponse(session, activity, stage);
      if (activity.activityId === 'ACT-G3-MATH-WEIGHT-MEASUREMENT-ADVENTURE-CANDIDATE' && stage.weightRules.mode === 'estimate') {
        assert.equal(session.weightScale.estimate, stage.weightRules.input.min, 'wrong estimate test response must be outside the accepted estimate range');
      }
      let result = dispatchLearningTask(session, activity, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:wrong` });
      assert.equal(result.changed, true, `${activity.activityId}/${stage.stageId} wrong submission should be valid`);
      assert.equal(result.session.phase, 'feedback', `${activity.activityId}/${stage.stageId} expected an incorrect response, got ${JSON.stringify({ feedback: result.session.lastFeedback, attempt: result.session.attempts.at(-1) })}`);
      assert.equal(result.session.lastFeedback.correct, false);
      assert.ok(result.session.lastFeedback.text.length > 0);
      session = act(result.session, activity, 'retry');
      session = setCorrectResponse(session, activity, stage);
      result = dispatchLearningTask(session, activity, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:correct` });
      assert.equal(result.changed, true);
      assert.equal(result.session.phase, 'success', `${activity.activityId}/${stage.stageId} expected correct completion, got ${JSON.stringify({ feedback: result.session.lastFeedback, attempt: result.session.attempts.at(-1) })}`);
      assert.equal(result.session.attempts.at(-1).result, 'correct');
      session = act(result.session, activity, 'next');
    }
    assert.equal(session.phase, 'completed', activity.activityId);
    assert.equal(session.attempts.length, activity.stages.length * 2);
    const replay = dispatchLearningTask(session, activity, 'restart', { sessionId: `${session.sessionId}:replay` });
    assert.equal(replay.changed, true);
    assert.equal(replay.session.phase, 'intro');
    assert.equal(replay.session.attempts.length, 0);
  }
});

test('coverage distinguishes declared subitem evidence from activity association alone across all registered foci', () => {
  const coverage = buildCoverageInventory({ curriculumMap: map, sources });
  const audit = coverage.learningSubitemAudit;
  assert.equal(audit.registeredFocusCount, 149);
  assert.equal(audit.allFocuses.length, 149);
  assert.equal(audit.generatedTextSplitIsOfficialSubclause, false);
  assert.equal(audit.explicitlyCuratedSubitemCount, 140);
  assert.equal(audit.allFocuses.flatMap(({ curatedProjectSubitems }) => curatedProjectSubitems).filter(({ status }) => status === 'inventory_only_not_implemented').length, 32);
  assert.equal(audit.focusWithActivityAssociationButNoExplicitSubitemEvidenceCount, audit.focusCountByEvidenceStatus.associated_only_no_explicit_subitem_evidence);
  assert.equal(audit.focusCountByEvidenceStatus.interactive_candidate_subitem_coverage, 94);
  assert.equal(Object.values(audit.focusCountByEvidenceStatus).reduce((sum, count) => sum + count, 0), 149);
  assert.ok(audit.allFocuses.some(({ focusId }) => focusId === 'math-grade4-special-quadrilateral-construction'));
  assert.ok(audit.allFocuses.some(({ focusId }) => focusId === 'math-grade4-rectangle-area-perimeter-model'));
  const targeted = audit.allFocuses.filter(({ curatedProjectSubitems }) => curatedProjectSubitems.some(({ activityIds }) => activityIds.length > 0));
  assert.equal(targeted.length, 94);
  const areaFocus = targeted.find(({ focusId }) => focusId === 'math-grade3-n-3-14-area');
  assert.ok(areaFocus?.curatedProjectSubitems.some(({ subitemId, activityIds }) => subitemId === 'SUB-MATH-G3-N3-14-UNIT-SQUARE-AREA-CONSTRUCTION' && activityIds.includes('ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE')));
  for (const focus of targeted) {
    assert.ok(focus.activityAudit.some((activity) => activity.hasExplicitSubitemClaims));
    assert.ok(focus.curatedProjectSubitems.every((item) => item.sourceRef.sourceId && item.sourceRef.pageOrSection));
    assert.ok(focus.curatedProjectSubitems
      .filter((item) => item.activityIds.length > 0)
      .every((item) => item.explicitActivityLinkStatus === 'task_claim_and_interaction_stages_present'));
    assert.ok(focus.curatedProjectSubitems.every((item) => item.officialClauseEvidenceStatus === 'verified_code_and_source_location'));
    assert.ok(focus.remainingLimitations.some((limitation) => limitation.includes('不代表')));
  }
  const gradeOneComparisonFocus = targeted.find(({ focusId }) => focusId === 'math-grade1-add-sub-meaning');
  assert.equal(gradeOneComparisonFocus.evidenceStatus, 'interactive_candidate_subitem_coverage', 'verified grade-one source rows do not turn the linked add/sub focus into full coverage; only its declared subitem has interactive evidence');
  for (const focusId of ['science-animal-observation', 'health-pe-stage2-sport-safety', 'integrative-stage2-learning-methods']) {
    const focus = targeted.find(({ focusId: id }) => id === focusId);
    assert.equal(focus.evidenceStatus, 'interactive_candidate_subitem_coverage', `${focusId} must remain partial candidate subitem evidence`);
    assert.equal(focus.curatedProjectSubitems.every(({ explicitActivityLinkStatus }) => explicitActivityLinkStatus === 'task_claim_and_interaction_stages_present'), true);
  }
  for (const [focusId, subitemId] of [
    ['social-neighborhood-change-stage2', 'SUB-SOCIAL-STAGE2-NEIGHBORHOOD-CHANGE-CAUSE-EVIDENCE'],
    ['science-grade4-plant-structure-observation', 'SUB-SCIENCE-STAGE2-PLANT-PARTS-AND-EXTERNAL-FORM'],
    ['science-grade5-measurement-methods', 'SUB-SCIENCE-STAGE3-MEASUREMENT-CONSISTENT-METHOD'],
  ]) {
    const focus = targeted.find(({ focusId: id }) => id === focusId);
    assert.ok(focus.curatedProjectSubitems.some(({ subitemId: id, explicitActivityLinkStatus }) => id === subitemId && explicitActivityLinkStatus === 'task_claim_and_interaction_stages_present'));
  }
  for (const [focusId, subitemId] of [
    ['science-grade6-animal-structure-behavior', 'SUB-SCIENCE-STAGE3-ANIMAL-STRUCTURE-MOVEMENT-RELATION'],
    ['science-grade6-plant-structure-function', 'SUB-SCIENCE-STAGE3-INB3-7-STRUCTURE-FUNCTION'],
    ['social-grade6-global-issue-evidence', 'SUB-SOCIAL-STAGE3-AF3-1-ISSUE-SCALE-EVIDENCE'],
    ['health-pe-grade6-medication-safety', 'SUB-HPE-STAGE3-BB3-1-STOP-CHECK-CONSULT'],
  ]) {
    const focus = targeted.find(({ focusId: id }) => id === focusId);
    assert.ok(focus?.curatedProjectSubitems.some(({ subitemId: id, explicitActivityLinkStatus }) => id === subitemId && explicitActivityLinkStatus === 'task_claim_and_interaction_stages_present'));
  }
  for (const focus of audit.allFocuses.filter(({ evidenceStatus }) => evidenceStatus === 'associated_only_no_explicit_subitem_evidence')) {
    assert.ok(focus.activityAudit.length > 0);
    const linkedSubitemIds = new Set(focus.curatedProjectSubitems
      .filter(({ activityIds = [] }) => activityIds.length)
      .map(({ subitemId }) => subitemId));
    assert.ok(focus.activityAudit.every((activity) => !activity.explicitSubitemClaims.some((subitemId) => linkedSubitemIds.has(subitemId))));
  }
});

test('new candidate mathematics examples have independently checkable arithmetic and scoped claims', () => {
  assert.equal(305 + 127, 432);
  assert.equal(402 + 36, 438);
  assert.equal(178 + 146, 324);
  assert.equal(286 + 157, 443);
  for (const task of tasks) assert.match(task.curriculumScope, /只|僅|不代表|未涵蓋|未練習|未代表|不取代|不替代|不等同|未提供|不是|非|不處理/u);
  assert.equal(300 + 200, 500);
  assert.equal(800 - 300, 500);
  assert.equal(350 + 420, 770);
  assert.equal(1000 + 250, 1250);
});

test('new gap tasks add three distinct learning actions without upgrading official or teacher status', () => {
  const ids = [
    'ACT-G3-SOCIAL-CHANGE-CAUSE-EVIDENCE-CANDIDATE',
    'ACT-G4-SCIENCE-PLANT-PARTS-OBSERVATION-CANDIDATE',
    'ACT-G5-SCIENCE-FAIR-RULER-METHOD-CANDIDATE',
  ];
  const added = tasks.filter(({ activityId }) => ids.includes(activityId));
  assert.equal(added.length, 3);
  assert.deepEqual(added.map(({ gradeId, subjectId }) => `${gradeId}:${subjectId}`), [
    'grade-3:social-studies', 'grade-4:natural-science', 'grade-5:natural-science',
  ]);
  for (const task of added) {
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.ok(task.stages.length >= 3);
    assert.ok(task.stages.every(({ hints, incorrectFeedback, correctFeedback }) => hints.length === 2 && incorrectFeedback && correctFeedback));
  }
  assert.equal(added[0].stages[0].correctOptionIds.includes('before-after'), true);
  assert.equal(added[0].stages[1].correctAssignments['all-like-market'], 'not-described');
  assert.deepEqual(added[1].stages[0].correctAssignments, { 'roots-below-soil': 'root', 'stem-between-parts': 'stem', 'leaves-on-stem': 'leaf' });
  assert.deepEqual(added[2].stages[0].correctItemIds, ['align-zero', 'check-endpoint', 'record-unit']);
});

test('current curriculum gap batch is reachable from grade and subject catalogs with shared-module references', () => {
  const ids = [
    'ACT-G6-SCIENCE-ANIMAL-STRUCTURE-MOVEMENT-EVIDENCE-CANDIDATE',
    'ACT-G6-SCIENCE-PLANT-STRUCTURE-FUNCTION-EVIDENCE-CANDIDATE',
    'ACT-G6-SOCIAL-GLOBAL-ISSUE-SCALE-COMPARISON-CANDIDATE',
    'ACT-G6-HPE-MEDICATION-INFORMATION-CONSULT-CANDIDATE',
  ];
  for (const activityId of ids) {
    const task = tasks.find(({ activityId: id }) => id === activityId);
    assert.ok(task, `${activityId} is present in the candidate task catalog`);
    const grade = GRADE_CATALOG.find(({ gradeId }) => gradeId === task.gradeId);
    const subject = grade?.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    const entry = subject?.existingYearLevelContent.find(({ activityId: id }) => id === activityId);
    assert.equal(entry?.status, 'candidate_pending_teacher_review', `${activityId} stays a candidate`);
    assert.equal(entry?.runtimeModule, 'prototype/data/curriculumGapBatchTasks.js');
    assert.equal(entry?.entryRoute?.targetScreen, 'catalog-task');
  }
});

test('newly verified science batch has explicit partial interactive claims and stage-based evidence', () => {
  const ids = [
    'ACT-G6-SCIENCE-ENERGY-TRANSFER-MODEL-CANDIDATE',
    'ACT-G6-SCIENCE-STABLE-STATE-CHANGE-MODEL-CANDIDATE',
    'ACT-G6-SCIENCE-TECHNOLOGY-IMPACT-EVIDENCE-CANDIDATE',
    'ACT-G6-SCIENCE-BEAK-FEEDING-STRUCTURE-EVIDENCE-CANDIDATE',
  ];
  const added = ids.map((id) => tasks.find(({ activityId }) => activityId === id));
  assert.equal(added.every(Boolean), true);
  for (const activity of added) {
    assert.equal(activity.gradeId, 'grade-6');
    assert.equal(activity.subjectId, 'natural-science');
    assert.equal(activity.status, 'candidate_pending_teacher_review');
    assert.equal(activity.teacherReview.status, 'not_reviewed');
    assert.equal(activity.stages.length, 3);
    assert.ok(activity.curriculumScope.includes('不'));
    assert.ok(activity.openQuestions.length > 0);
    const focus = map.supplementalVerifiedLearningFocuses.find(({ id }) => id === activity.curriculumMapId);
    assert.equal(focus?.officialTextReviewStatus, 'verified_against_official_text');
    assert.equal(focus?.coverageStatus, 'partial');
    const definition = definitions.definitions.find(({ subitemId }) => activity.learningSubitemClaims.includes(subitemId));
    assert.ok(definition);
    assert.equal(definition.status, 'candidate_partial_interaction');
    assert.ok(definition.evidenceStageIds.every((stageId) => activity.stages.some(({ stageId: actual }) => actual === stageId)));
    const subjectEntry = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-6')?.subjects.find(({ subjectId }) => subjectId === 'natural-science');
    assert.ok(subjectEntry?.existingYearLevelContent?.some(({ activityId }) => activityId === activity.activityId));
  }
  assert.deepEqual(added.map(({ curriculumCodes }) => curriculumCodes[0]), ['INa-Ⅲ-5', 'INd-Ⅲ-1', 'INf-Ⅲ-2', 'INb-Ⅲ-6']);
  assert.equal(sources.sources.find(({ id }) => id === 'natural-science').verifiedClauses.includes('INa-Ⅲ-5'), true);
  assert.equal(sources.sources.find(({ id }) => id === 'natural-science').verifiedClauses.includes('INd-Ⅲ-1'), true);
  assert.equal(sources.sources.find(({ id }) => id === 'natural-science').verifiedClauses.includes('INf-Ⅲ-2'), true);
});
