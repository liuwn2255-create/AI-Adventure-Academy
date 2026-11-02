const clone = (value) => structuredClone(value);

const vectorNegate = (vector) => vector.map((value) => -value);
const vectorDot = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);
const foldOrientation = (orientation, direction) => {
  const { u, v, n } = orientation;
  if (direction === 'right') return { u: vectorNegate(n), v, n: u };
  if (direction === 'left') return { u: n, v, n: vectorNegate(u) };
  if (direction === 'down') return { u, v: vectorNegate(n), n: v };
  return { u, v: n, n: vectorNegate(v) };
};

/** Fold a six-square net by propagating face orientations across shared paper edges. */
export function foldCubeNet(netFaces) {
  const faces = Array.isArray(netFaces) ? netFaces : [];
  if (faces.length !== 6 || new Set(faces.map(({ id }) => id)).size !== 6 || new Set(faces.map(({ row, column }) => `${row},${column}`)).size !== 6) {
    return { valid: false, reason: '需要六個位於不同格子的正方形面。', faces: [], adjacency: [] };
  }
  const byPosition = new Map(faces.map((face) => [`${face.row},${face.column}`, face]));
  const directions = [
    { name: 'right', dr: 0, dc: 1 }, { name: 'left', dr: 0, dc: -1 },
    { name: 'down', dr: 1, dc: 0 }, { name: 'up', dr: -1, dc: 0 },
  ];
  const orientations = new Map([[faces[0].id, { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] }]]);
  const queue = [faces[0]];
  let consistent = true;
  while (queue.length) {
    const face = queue.shift();
    const current = orientations.get(face.id);
    for (const { name, dr, dc } of directions) {
      const neighbor = byPosition.get(`${face.row + dr},${face.column + dc}`);
      if (!neighbor) continue;
      const candidate = foldOrientation(current, name);
      const assigned = orientations.get(neighbor.id);
      if (assigned) {
        if (JSON.stringify(assigned) !== JSON.stringify(candidate)) consistent = false;
      } else {
        orientations.set(neighbor.id, candidate);
        queue.push(neighbor);
      }
    }
  }
  const foldedFaces = faces.map(({ id }) => ({ id, normal: orientations.get(id)?.n ?? null }));
  const normals = foldedFaces.map(({ normal }) => normal?.join(','));
  const valid = consistent && orientations.size === 6 && new Set(normals).size === 6
    && normals.every((normal) => ['1,0,0', '-1,0,0', '0,1,0', '0,-1,0', '0,0,1', '0,0,-1'].includes(normal));
  const adjacency = [];
  if (valid) for (let i = 0; i < foldedFaces.length; i += 1) for (let j = i + 1; j < foldedFaces.length; j += 1) {
    if (vectorDot(foldedFaces[i].normal, foldedFaces[j].normal) === 0) adjacency.push([foldedFaces[i].id, foldedFaces[j].id]);
  }
  return { valid, reason: valid ? '六個面摺合後方向不同，可形成一個立方體。' : '有面重疊、方向不一致，或六個面沒有連成完整形體。', faces: foldedFaces, adjacency };
}

export function areFoldedFacesAdjacent(foldResult, firstFaceId, secondFaceId) {
  if (!foldResult?.valid || !firstFaceId || !secondFaceId || firstFaceId === secondFaceId) return false;
  return foldResult.adjacency.some(([a, b]) => (a === firstFaceId && b === secondFaceId) || (a === secondFaceId && b === firstFaceId));
}

function transformedGeometryCells(piece, transform) {
  let cells = piece.cells.map(([row, column]) => [row, column]);
  if (transform.flipped) {
    const maxColumn = Math.max(...cells.map(([, column]) => column));
    cells = cells.map(([row, column]) => [row, maxColumn - column]);
  }
  for (let turn = 0; turn < transform.rotation; turn += 1) {
    const maxRow = Math.max(...cells.map(([row]) => row));
    cells = cells.map(([row, column]) => [column, maxRow - row]);
    const minRow = Math.min(...cells.map(([row]) => row));
    const minColumn = Math.min(...cells.map(([, column]) => column));
    cells = cells.map(([row, column]) => [row - minRow, column - minColumn]);
  }
  return cells.map(([row, column]) => ({ row: row + transform.row, column: column + transform.column }));
}

function geometryCellsFit(piece, transform, board) {
  return transformedGeometryCells(piece, transform).every(({ row, column }) => row >= 0 && column >= 0 && row < board.rows && column < board.columns);
}

function geometryCompositionMatches(stage, transforms) {
  const expected = new Set(stage.targetCells.map(({ row, column }) => `${row},${column}`));
  const occupied = [];
  for (const piece of stage.pieces) {
    const transform = transforms[piece.id];
    if (!transform || !geometryCellsFit(piece, transform, stage.board)) return false;
    occupied.push(...transformedGeometryCells(piece, transform).map(({ row, column }) => `${row},${column}`));
  }
  return occupied.length === expected.size && new Set(occupied).size === occupied.length && occupied.every((cell) => expected.has(cell));
}

function initializeGeometryStage(state, stage) {
  state.geometryPieces = Object.fromEntries((stage.pieces ?? []).map((piece) => [piece.id, { row: piece.initialPosition.row, column: piece.initialPosition.column, rotation: piece.initialRotation ?? 0, flipped: piece.initialFlipped ?? false }]));
  state.geometrySelectedPieceId = stage.pieces?.[0]?.id ?? null;
  state.selectedNetId = null;
  state.foldedNet = null;
  state.geometryAdjacencyAnswer = null;
}

function initializeAngleStage(state, stage) {
  state.angleEstimate = null;
  state.angleCenterOffset = stage.angleRules.mode === 'measure' ? stage.angleRules.initialCenterOffset : null;
  state.angleBaselineOffset = stage.angleRules.mode === 'measure' ? stage.angleRules.initialBaselineOffset : null;
  state.angleBaselineSide = null;
  state.angleReading = null;
  state.angleDrawValue = stage.angleRules.mode === 'right_angle' ? stage.angleRules.initialDegrees : null;
  state.angleRotationDirection = null;
  state.angleRotationDegrees = stage.angleRules.mode === 'rotation' ? stage.angleRules.initialDegrees : null;
  state.angleSelectedOptionId = null;
  state.angleComparisonAngleA = stage.angleRules.mode === 'compare' ? stage.angleRules.initialAngleA : null;
  state.angleComparisonAngleB = stage.angleRules.mode === 'compare' ? stage.angleRules.initialAngleB : null;
  state.angleComparisonAnswer = null;
}

function initializePatternStage(state, stage) {
  const rules = stage.patternRules ?? {};
  state.selection = rules.mode === 'repair' ? [...rules.starterPattern] : [];
  state.patternStartValue = rules.mode === 'number_builder' ? rules.initialStart : null;
  state.patternIncrement = rules.mode === 'number_builder' ? rules.initialIncrement : null;
  state.patternSequenceEntries = [];
  state.patternRepairIndex = null;
  state.patternRepairTouched = false;
}

function patternRuleVerificationText(stage, state) {
  const rules = stage.patternRules;
  if (rules.mode === 'number_builder') {
    const steps = state.patternSequenceEntries.slice(1).map((value, index) => `${state.patternSequenceEntries[index]}→${value}（+${value - state.patternSequenceEntries[index]}）`);
    return `規律驗證：${state.patternSequenceEntries.join('、')}。逐項核對：${steps.join('；')}。`;
  }
  if (rules.mode === 'repeat_unit_builder') {
    const unitLength = rules.unitLength ?? 2;
    const checks = state.selection.slice(unitLength).map((value, offset) => `第 ${offset + 1} 格和第 ${offset + unitLength + 1} 格${state.selection[offset] === value ? '相同' : '不相同'}`);
    return `規律驗證：${checks.join('；')}。前 ${unitLength} 格構成的重複單位已逐格核對。`;
  }
  return null;
}

const placeValueWeights = Object.freeze({ thousands: 1000, hundreds: 100, tens: 10, ones: 1 });

function initializePlaceValueStage(state, stage) {
  state.placeValueBlocks = { ...stage.placeValueRules.initialCounts };
  state.placeValueExchangeCount = 0;
  state.placeValueTouched = false;
}

function initializeVerticalCalculationStage(state, stage) {
  state.verticalCalculationValues = Object.fromEntries(stage.calculationSteps.map(({ id, initialValue = 0 }) => [id, initialValue]));
}

function initializeLengthMeasurementStage(state, stage) {
  const rules = stage.lengthRules;
  state.lengthRulerZero = rules?.initialRulerZero ?? 0;
  state.lengthEstimate = null;
  state.lengthReadings = Object.fromEntries((rules?.objects ?? []).map(({ id, initialReading = 0 }) => [id, initialReading]));
  state.lengthReadingTouched = [];
  state.lengthRulerTouched = false;
  state.lengthConversionTouched = false;
  state.lengthCentimeters = rules?.initialCentimeters ?? 0;
  state.lengthRemainingMillimeters = rules?.initialRemainingMillimeters ?? 0;
  state.lengthDifference = null;
}

function initializeAreaGridStage(state, stage) {
  state.areaGridCells = Object.fromEntries((stage.areaGridRules?.boards ?? []).map(({ id, initialCells = [] }) => [id, [...initialCells]]));
  state.areaGridTouched = [];
  state.areaEstimate = null;
  state.areaRelation = null;
}

function initializeWeightScaleStage(state) {
  state.weightScale = {
    estimate: null, balanceCounts: { left: 0, right: 0 }, balanceTouched: false,
    reading: null, readingTouched: false, compareReadings: {}, compareTouched: [],
    relation: null, difference: null, differenceTouched: false,
    kilograms: 0, grams: 0, conversionTouched: false, selectedItems: [],
  };
}

function initializeMagnetStage(state, stage) {
  const rules = stage.magnetRules;
  state.magnetModel = {
    facingPole: rules.mode === 'poles' ? rules.initialFacingPole : null,
    testedObjectIds: [],
    assignments: {},
    testedMagnetIds: [],
    selectedStrongerMagnetId: null,
    touched: false,
  };
}

function magnetModelResponse(state, stage) {
  const model = state.magnetModel;
  const rules = stage.magnetRules;
  if (rules.mode === 'poles') {
    const samePole = model.facingPole === rules.fixedPole;
    return { fixedPole: rules.fixedPole, facingPole: model.facingPole, relation: samePole ? 'repel' : 'attract' };
  }
  if (rules.mode === 'materials') return { testedObjectIds: [...model.testedObjectIds], assignments: { ...model.assignments } };
  return { testedMagnetIds: [...model.testedMagnetIds], selectedStrongerMagnetId: model.selectedStrongerMagnetId };
}

function magnetModelError(stage, response) {
  const rules = stage.magnetRules;
  if (rules.mode === 'poles') return `目前是 ${response.fixedPole} 面對 ${response.facingPole}，模型結果為${response.relation === 'repel' ? '排斥' : '吸引'}；任務要設定成異極相吸。`;
  if (rules.mode === 'materials') {
    const untested = rules.materials.filter(({ id }) => !response.testedObjectIds.includes(id)).map(({ label }) => label);
    if (untested.length) return `還有材料沒有逐一測試：${untested.join('、')}。先觀察結果，再分類。`;
    const wrong = rules.materials.filter(({ id, attracted }) => response.assignments[id] !== (attracted ? 'attracted' : 'not-attracted'));
    return `有 ${wrong.map(({ label }) => label).join('、')} 的分類與測試結果不一致；回看材料靠近磁鐵時是否移動。`;
  }
  const missing = rules.magnets.filter(({ id }) => !response.testedMagnetIds.includes(id)).map(({ label }) => label);
  if (missing.length) return `還沒在相同條件下測試：${missing.join('、')}。先記錄兩個磁鐵吸起的圓片數。`;
  return '請依兩個測試結果中的含鐵圓片數比較；外觀不能代替觀察數據。';
}

function initializeCapacityModelStage(state, stage) {
  const rules = stage.capacityRules;
  state.capacityModel = {
    volumeMl: rules.initialMl ?? 0,
    estimateMl: null,
    readingMl: null,
    readingTouched: false,
    touched: false,
    containerVolumes: Object.fromEntries((rules.containers ?? []).map(({ id }) => [id, 0])),
    compareTouched: [],
    selectedItems: [],
    differenceMl: null,
    relation: null,
  };
}

function initializeFrequencyTableStage(state, stage) {
  state.collectedObservationIds = [];
  state.assignments = { ...(stage.initialAssignments ?? {}) };
}

function capacityModelResponse(state, stage) {
  const rules = stage.capacityRules;
  const model = state.capacityModel;
  if (rules.mode === 'estimate') return model.estimateMl;
  if (rules.mode === 'fill') return { volumeMl: model.volumeMl, remainingMl: rules.containerCapacityMl - model.volumeMl };
  if (rules.mode === 'read') return { volumeMl: model.volumeMl, readingMl: model.readingMl };
  if (rules.mode === 'compare') return { volumes: { ...model.containerVolumes }, relation: model.relation };
  if (rules.mode === 'difference') return { volumeMl: model.volumeMl, differenceMl: model.differenceMl };
  const totalMl = rules.items.filter(({ id }) => model.selectedItems.includes(id)).reduce((sum, item) => sum + item.volumeMl, 0);
  return { selectedItemIds: [...model.selectedItems], totalMl, remainingMl: rules.containerCapacityMl - totalMl };
}

function capacityModelError(stage, response) {
  const rules = stage.capacityRules;
  if (rules.mode === 'estimate') return `目前估量 ${response} 毫升；請再依情境中的容量基準判斷合理範圍。`;
  if (rules.mode === 'fill') return `目前液量是 ${response.volumeMl} 毫升，距離目標 ${rules.targetMl} 毫升還有 ${Math.abs(rules.targetMl - response.volumeMl)} 毫升；每次倒入或取出 ${rules.stepMl} 毫升。`;
  if (rules.mode === 'read') return `液面在 ${response.volumeMl} 毫升；你記下 ${response.readingMl} 毫升。請沿刻度逐格讀取。`;
  if (rules.mode === 'compare') return '請分別用相同容量的量杯裝填兩個容器，再比較總量；不要只看容器高矮。';
  if (rules.mode === 'difference') return `目前液量 ${response.volumeMl} 毫升，起始液量 ${rules.initialMl} 毫升；取出量要用起始量減去目前量。`;
  return `目前選取 ${response.totalMl} 毫升，目標 ${rules.targetMl} 毫升，剩餘空間 ${response.remainingMl} 毫升；請增減水瓶後重新加總。`;
}

function weightScaleResponse(state, stage) {
  const rules = stage.weightRules;
  const values = state.weightScale;
  if (rules.mode === 'estimate') return values.estimate;
  if (rules.mode === 'balance') return {
    counts: { ...values.balanceCounts },
    leftGrams: rules.left.fixedGrams + values.balanceCounts.left * rules.counterweightGrams,
    rightGrams: rules.right.fixedGrams + values.balanceCounts.right * rules.counterweightGrams,
  };
  if (rules.mode === 'read') return values.reading;
  if (rules.mode === 'compare') return { readings: { ...values.compareReadings }, relation: values.relation, difference: values.difference };
  if (rules.mode === 'convert') return { kilograms: values.kilograms, grams: values.grams, totalGrams: values.kilograms * 1000 + values.grams };
  return { selectedItemIds: [...values.selectedItems], totalGrams: rules.items.filter(({ id }) => values.selectedItems.includes(id)).reduce((sum, item) => sum + item.grams, 0) };
}

function weightScaleError(stage, response) {
  const rules = stage.weightRules;
  if (rules.mode === 'estimate') return `你的估測是 ${response} 公克，模擬秤重是 ${rules.targetGrams} 公克。比較兩個數值的差距後再調整。`;
  if (rules.mode === 'balance') {
    const difference = response.leftGrams - response.rightGrams;
    return difference > 0 ? `左盤還重 ${difference} 公克；在右盤加砝碼，或從左盤取下砝碼。` : `右盤還重 ${Math.abs(difference)} 公克；在左盤加砝碼，或從右盤取下砝碼。`;
  }
  if (rules.mode === 'read') return `你讀到 ${response} 公克；請沿刻度由 0 數起，每大格 100 公克、小格 50 公克。`;
  if (rules.mode === 'compare') {
    const wrongRead = rules.items.find(({ id, actualGrams }) => response.readings[id] !== actualGrams);
    if (wrongRead) return `${wrongRead.label}的讀值還沒對上刻度。先逐格核對兩個讀值，再比較。`;
    const relation = response.readings.left > response.readings.right ? '>' : response.readings.left < response.readings.right ? '<' : '=';
    if (response.relation !== relation) return `秤面讀值顯示甲 ${relation} 乙；請依兩個數值選擇比較符號。`;
    return `比較符號正確；兩個讀值相差 ${Math.abs(response.readings.left - response.readings.right)} 公克，請調整差值。`;
  }
  if (rules.mode === 'convert') return `${response.kilograms} 公斤又 ${response.grams} 公克表示 ${response.totalGrams} 公克。每 1,000 公克可換成 1 公斤，公克部分要小於 1,000。`;
  return `目前選取合計 ${response.totalGrams} 公克；目標是 ${rules.targetGrams} 公克。加上或取下物品後再核對。`;
}

function areaCellsConnected(cells) {
  if (!cells.length) return false;
  const remaining = new Set(cells);
  const seen = new Set([remaining.values().next().value]);
  const queue = [...seen];
  while (queue.length) {
    const match = /^r(\d+)c(\d+)$/.exec(queue.shift());
    const row = Number(match[1]);
    const column = Number(match[2]);
    for (const neighbor of [`r${row - 1}c${column}`, `r${row + 1}c${column}`, `r${row}c${column - 1}`, `r${row}c${column + 1}`]) {
      if (remaining.has(neighbor) && !seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
    }
  }
  return seen.size === cells.length;
}

function areaGridResponse(state) {
  return {
    grids: Object.fromEntries(Object.entries(state.areaGridCells ?? {}).map(([id, values]) => [id, [...values]])),
    estimate: state.areaEstimate,
    relation: state.areaRelation,
  };
}

function areaGridMatches(stage, response) {
  const rules = stage.areaGridRules;
  const byBoard = new Map(rules.boards.map((board) => [board.id, board]));
  const matchesTarget = (board) => {
    const actual = response.grids[board.id] ?? [];
    return actual.length === board.targetCells.length && board.targetCells.every((cell) => actual.includes(cell));
  };
  if (rules.mode === 'estimate_cover') {
    const board = rules.boards[0];
    return matchesTarget(board) && Number.isInteger(response.estimate)
      && Math.abs(response.estimate - board.targetCells.length) <= rules.estimate.tolerance;
  }
  if (rules.mode === 'cover_outline' || rules.mode === 'complete_missing_cells') return rules.boards.every(matchesTarget);
  if (rules.mode === 'same_area_different_shape') {
    const board = rules.boards[0];
    const actual = response.grids[board.id] ?? [];
    return actual.length === rules.targetArea && actual.length === new Set(actual).size
      && JSON.stringify([...actual].sort()) !== JSON.stringify([...board.referenceCells].sort())
      && areaCellsConnected(actual);
  }
  if (rules.mode === 'compare_regions') return rules.boards.every(matchesTarget) && response.relation === rules.correctRelation;
  if (rules.mode === 'constrained_build') {
    const board = rules.boards[0];
    const actual = response.grids[board.id] ?? [];
    const countsByRow = Array.from({ length: board.rows }, (_, row) => actual.filter((cell) => cell.startsWith(`r${row}c`)).length);
    const columns = new Set(actual.map((cell) => Number(/^r\d+c(\d+)$/.exec(cell)?.[1])));
    return actual.length === rules.targetArea && areaCellsConnected(actual)
      && countsByRow.every((count) => count <= rules.maxCellsPerRow)
      && rules.requiredColumns.every((column) => columns.has(column));
  }
  return false;
}

function areaGridError(stage, response) {
  const rules = stage.areaGridRules;
  if (rules.mode === 'estimate_cover') {
    const board = rules.boards[0];
    if (Math.abs(response.estimate - board.targetCells.length) > rules.estimate.tolerance) return `估測值是 ${response.estimate}，鋪設後有 ${board.targetCells.length} 個單位方格；想想每排和排數的總量，再修正估測。`;
    return '估測已接近，請逐格比對輪廓；所有指定格都要鋪上，輪廓外不要多放。';
  }
  if (rules.mode === 'cover_outline' || rules.mode === 'complete_missing_cells') return '請依照輪廓逐格核對：缺少的格子要補上，輪廓外多出的格子要取下。';
  if (rules.mode === 'same_area_different_shape') {
    const board = rules.boards[0];
    const actual = response.grids[board.id] ?? [];
    if (actual.length !== rules.targetArea) return `目前有 ${actual.length} 格，目標是 ${rules.targetArea} 格；每格代表 1 平方公分。`;
    if (!areaCellsConnected(actual)) return '拼片要上下或左右相連，請把分散的方格移到一起。';
    return '方格數已相同且連在一起；請改變拼法，讓形狀和參考圖不同。';
  }
  if (rules.mode === 'compare_regions') {
    const incomplete = rules.boards.find((board) => !matchesAreaTarget(board, response));
    if (incomplete) return `請先完成${incomplete.title}的輪廓，再比較兩邊的單位方格數。`;
    return '兩邊都已鋪好，請依方格總數選擇正確的面積關係。';
  }
  if (rules.mode === 'constrained_build') {
    const board = rules.boards[0];
    const actual = response.grids[board.id] ?? [];
    if (actual.length !== rules.targetArea) return `目前有 ${actual.length} 格，還需要建成 ${rules.targetArea} 格。`;
    if (!areaCellsConnected(actual)) return '所有方格要組成相連的營地，試著讓新格與已鋪的格子共用一條邊。';
    return '面積和連接都符合，請再檢查每欄至少一格、每排最多三格。';
  }
  return stage.incorrectFeedback;
}

function matchesAreaTarget(board, response) {
  const actual = response.grids[board.id] ?? [];
  return actual.length === board.targetCells.length && board.targetCells.every((cell) => actual.includes(cell));
}

function initializeFractionModelStage(state, stage) {
  const rules = stage.fractionRules;
  state.fractionDenominator = null;
  state.fractionSelectedWholeId = null;
  state.fractionSelectedModelId = rules?.groups?.find(({ acceptsPieces }) => acceptsPieces)?.id ?? null;
  state.fractionPieceLocations = Object.fromEntries((rules?.pieces ?? []).map(({ id, initialGroupId }) => [id, initialGroupId]));
  state.fractionRelation = null;
}

function fractionGroupCount(state, groupId) {
  return Object.values(state.fractionPieceLocations ?? {}).filter((id) => id === groupId).length;
}

function fractionModelResponse(state, stage) {
  return {
    denominator: state.fractionDenominator,
    wholeId: state.fractionSelectedWholeId,
    selectedModelId: state.fractionSelectedModelId,
    relation: state.fractionRelation,
    groupCounts: Object.fromEntries((stage.fractionRules?.groups ?? []).map(({ id }) => [id, fractionGroupCount(state, id)])),
    pieceLocations: { ...state.fractionPieceLocations },
  };
}

function fractionModelMatches(stage, response) {
  const rules = stage.fractionRules;
  if (!rules || response.denominator !== rules.denominator || response.wholeId !== rules.targetWholeId) return false;
  const count = (groupId) => response.groupCounts[groupId] ?? 0;
  if (rules.mode === 'build') return response.wholeId === rules.targetWholeId
    && count(rules.targetGroupId) === rules.targetNumerator;
  if (rules.mode === 'compare') return count(rules.leftGroupId) === rules.leftNumerator
    && count(rules.rightGroupId) === rules.rightNumerator
    && response.relation === rules.correctRelation;
  if (rules.mode === 'add') return count(rules.firstOperandGroupId) === 0
    && count(rules.secondOperandGroupId) === 0
    && count(rules.resultGroupId) === rules.resultNumerator;
  if (rules.mode === 'subtract') return count(rules.startGroupId) === rules.resultNumerator
    && count(rules.removedGroupId) === rules.removedNumerator;
  if (rules.mode === 'make_one') return count(rules.firstOperandGroupId) === 0
    && count(rules.secondOperandGroupId) === 0
    && count(rules.wholeGroupId) === rules.denominator;
  return false;
}

function fractionModelError(stage, response) {
  const rules = stage.fractionRules;
  if (response.denominator !== rules.denominator) return '請先選出題目指定的等分份數，讓每一片代表相同的單位分數。';
  if (response.wholeId !== rules.targetWholeId) return '請先選擇題目指定的完整整體；比較分數時，兩個模型的整體也要一樣大。';
  const count = (groupId) => response.groupCounts[groupId] ?? 0;
  if (rules.mode === 'build') {
    if (response.wholeId !== rules.targetWholeId) return '先確認選的是題目指定的完整整體，再放入分數片。';
    if (count(rules.targetGroupId) !== rules.targetNumerator) return `模型要有 ${rules.targetNumerator} 片；目前放了 ${count(rules.targetGroupId)} 片，請逐片檢查。`;
  } else if (rules.mode === 'compare') {
    if (count(rules.leftGroupId) !== rules.leftNumerator || count(rules.rightGroupId) !== rules.rightNumerator) return '先完成左右兩條分數帶，再比較它們各有幾個同樣大小的單位分數。';
    return '模型已完成，請依模型中單位分數的個數選擇正確的比較符號。';
  } else if (rules.mode === 'add') {
    if (count(rules.firstOperandGroupId) || count(rules.secondOperandGroupId)) return '加法要把兩個分數帶的拼片都移入合併帶，再數合併後的片數。';
    return `合併帶應有 ${rules.resultNumerator} 片；分母相同時，合併的是同樣大小的單位分數。`;
  } else if (rules.mode === 'subtract') {
    return `從起始帶移走 ${rules.removedNumerator} 片，留下的片數才是差；目前留下 ${count(rules.startGroupId)} 片。`;
  } else if (rules.mode === 'make_one') {
    return `把兩條分數帶的拼片合在完整整體中，剛好填滿 ${rules.denominator} 格才是和等於 1。`;
  }
  return stage.incorrectFeedback;
}

function pointsShareLine(first, second, point) {
  return (second.column - first.column) * (point.row - first.row)
    === (second.row - first.row) * (point.column - first.column);
}

function lineConstructionMatches(stage, points) {
  if (!Array.isArray(points) || points.length !== 2 || points[0] === points[1]) return false;
  const parse = (id) => {
    const match = /^r(\d+)c(\d+)$/.exec(id);
    return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
  };
  const [start, end] = points.map(parse);
  const rules = stage.lineRules;
  if (!start || !end || !rules || [start, end].some(({ row, column }) => row < 0 || row >= rules.rows || column < 0 || column >= rules.columns)) return false;
  const { requiredPoint, relation } = rules;
  if (requiredPoint && !pointsShareLine(start, end, requiredPoint)) return false;
  return rules.referenceSegments.some(({ start: refStart, end: refEnd }) => {
    const firstVector = [end.column - start.column, end.row - start.row];
    const referenceVector = [refEnd.column - refStart.column, refEnd.row - refStart.row];
    const cross = firstVector[0] * referenceVector[1] - firstVector[1] * referenceVector[0];
    const dot = firstVector[0] * referenceVector[0] + firstVector[1] * referenceVector[1];
    if (relation === 'parallel') return cross === 0 && !pointsShareLine(start, end, refStart);
    if (relation === 'perpendicular') return dot === 0;
    return false;
  });
}

function quadrilateralConstructionMatches(stage, pointIds) {
  if (!Array.isArray(pointIds) || pointIds.length !== 4 || new Set(pointIds).size !== 4) return false;
  const rules = stage.quadrilateralRules;
  const points = pointIds.map((id) => {
    const match = /^r(\d+)c(\d+)$/.exec(id);
    return match ? { x: Number(match[2]), y: Number(match[1]) } : null;
  });
  if (!rules || points.some((point) => !point || point.x >= rules.columns || point.y >= rules.rows)) return false;
  const vectors = points.map((point, index) => {
    const next = points[(index + 1) % 4];
    return [next.x - point.x, next.y - point.y];
  });
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const lengths = vectors.map(([x, y]) => x * x + y * y);
  const turns = vectors.map((vector, index) => cross(vector, vectors[(index + 1) % 4]));
  if (lengths.some((length) => length === 0) || turns.some((turn) => turn === 0)
    || !(turns.every((turn) => turn > 0) || turns.every((turn) => turn < 0))) return false;
  const isParallelogram = cross(vectors[0], vectors[2]) === 0 && cross(vectors[1], vectors[3]) === 0;
  const isRectangle = vectors.every((vector, index) => dot(vector, vectors[(index + 1) % 4]) === 0);
  const isSquare = isRectangle && lengths.every((length) => length === lengths[0]);
  return rules.targetKind === 'square' ? isSquare
    : rules.targetKind === 'rectangle' ? isRectangle
      : rules.targetKind === 'parallelogram' ? isParallelogram : false;
}

/** Small, data-driven in-memory runner for interactive learning tasks. */
export function createLearningTaskSession(activity, sessionId = `${activity.activityId}-session`) {
  return {
    sessionId,
    activityId: activity.activityId,
    revision: activity.revision,
    status: activity.status,
    phase: 'intro',
    stageIndex: 0,
    selection: [],
    patternStartValue: null,
    patternIncrement: null,
    patternSequenceEntries: [],
    patternRepairIndex: null,
    patternRepairTouched: false,
    assignments: {},
    collectedObservationIds: [],
    arrayRows: 0,
    arrayColumns: 0,
    numberLineTick: null,
    calculationValues: {},
    verticalCalculationValues: {},
    placeValueBlocks: {},
    placeValueExchangeCount: 0,
    placeValueTouched: false,
    circleRadius: null,
    estimateValue: null,
    clockHour: null,
    clockMinute: null,
    elapsedMinutes: null,
    volumeRows: 0,
    volumeColumns: 0,
    volumeLayers: 0,
    symmetryCells: [],
    lineChartValues: {},
    barChartValues: {},
    barChartTouched: [],
    triangleVertices: [],
    quadrilateralVertices: [],
    orderedItems: [],
    geometryPieces: {},
    geometrySelectedPieceId: null,
    selectedNetId: null,
    foldedNet: null,
    geometryAdjacencyAnswer: null,
    angleEstimate: null,
    angleCenterOffset: null,
    angleBaselineOffset: null,
    angleBaselineSide: null,
    angleReading: null,
    angleDrawValue: null,
    angleRotationDirection: null,
    angleRotationDegrees: null,
    angleSelectedOptionId: null,
    angleComparisonAngleA: null,
    angleComparisonAngleB: null,
    angleComparisonAnswer: null,
    decimalHundredths: null,
    fractionDenominator: null,
    fractionSelectedWholeId: null,
    fractionSelectedModelId: null,
    fractionPieceLocations: {},
    fractionRelation: null,
    lengthRulerZero: null,
    lengthEstimate: null,
    lengthReadings: {},
    lengthReadingTouched: [],
    lengthRulerTouched: false,
    lengthConversionTouched: false,
    lengthCentimeters: null,
    lengthRemainingMillimeters: null,
    lengthDifference: null,
    areaGridCells: {},
    areaGridTouched: [],
    areaEstimate: null,
    areaRelation: null,
    weightScale: null,
    capacityModel: null,
    magnetModel: null,
    unknownQuantityValue: null,
    unknownQuantityTouched: false,
    linePoints: [],
    previousStepResult: null,
    hintLevel: 0,
    attempts: [],
    usedSubmissionIds: [],
    lastFeedback: null,
    completedAt: null,
  };
}

export function dispatchLearningTask(session, activity, action, payload = {}) {
  if (!session || session.activityId !== activity?.activityId) return { session, changed: false, error: 'invalid_task_session' };
  if (action === 'restart') return { session: createLearningTaskSession(activity, payload.sessionId ?? `${session.sessionId}:restart`), changed: true };
  const state = clone(session);
  const stage = activity.stages[state.stageIndex];

  if (action === 'start') {
    if (state.phase !== 'intro') return { session, changed: false };
    state.phase = 'active';
    if (stage?.interaction === 'compose_pattern') initializePatternStage(state, stage);
    if (stage?.interaction === 'set_clock_time') {
      state.clockHour = stage.clockRules.initialHour;
      state.clockMinute = stage.clockRules.initialMinute;
    }
    if (stage?.interaction === 'elapsed_time_model') state.elapsedMinutes = stage.elapsedRules.initialMinutes;
    if (stage?.interaction === 'order_items') state.orderedItems = [...stage.initialOrder];
    if (stage?.interaction === 'geometry_exploration') initializeGeometryStage(state, stage);
    if (stage?.interaction === 'angle_exploration') initializeAngleStage(state, stage);
    if (stage?.interaction === 'build_place_value_blocks') initializePlaceValueStage(state, stage);
    if (stage?.interaction === 'operate_vertical_calculation') initializeVerticalCalculationStage(state, stage);
    if (stage?.interaction === 'manipulate_fraction_model') initializeFractionModelStage(state, stage);
    if (stage?.interaction === 'measure_length_model') initializeLengthMeasurementStage(state, stage);
    if (stage?.interaction === 'build_area_grid') initializeAreaGridStage(state, stage);
    if (stage?.interaction === 'build_weight_scale') initializeWeightScaleStage(state);
    if (stage?.interaction === 'build_capacity_model') initializeCapacityModelStage(state, stage);
    if (stage?.interaction === 'magnet_interaction') initializeMagnetStage(state, stage);
    if (stage?.interaction === 'build_unknown_quantity_model') state.unknownQuantityValue = stage.unknownQuantityRules.initialValue;
    if (stage?.interaction === 'build_frequency_table') initializeFrequencyTableStage(state, stage);
    if (stage?.interaction === 'adjust_decimal_place_value') state.decimalHundredths = stage.decimalRules.initialHundredths;
    return { session: state, changed: true };
  }
  if (action === 'hint') {
    if (state.phase !== 'active' || !stage?.hints?.length || state.hintLevel >= stage.hints.length) return { session, changed: false, error: 'hint_unavailable' };
    state.hintLevel += 1;
    return { session: state, changed: true, hint: stage.hints[state.hintLevel - 1] };
  }
  if (action === 'toggle_evidence') {
    if (state.phase !== 'active' || stage?.interaction !== 'collect_evidence' || !stage.options.some(({ id }) => id === payload.optionId)) return { session, changed: false, error: 'invalid_evidence_option' };
    if (!state.selection.includes(payload.optionId) && Number.isInteger(stage.requiredSelectionCount)
      && state.selection.length >= stage.requiredSelectionCount) return { session, changed: false, error: 'required_selection_count_reached' };
    state.selection = state.selection.includes(payload.optionId)
      ? state.selection.filter((id) => id !== payload.optionId)
      : [...state.selection, payload.optionId];
    return { session: state, changed: true };
  }
  if (action === 'select_option') {
    if (state.phase !== 'active' || stage?.interaction !== 'choose_response' || !stage.options.some(({ id }) => id === payload.optionId)) return { session, changed: false, error: 'invalid_response_option' };
    state.selection = [payload.optionId];
    return { session: state, changed: true };
  }
  if (action === 'add_phrase_token') {
    if (state.phase !== 'active' || stage?.interaction !== 'assemble_response' || !stage.tokens.some(({ id }) => id === payload.tokenId) || state.selection.includes(payload.tokenId)) return { session, changed: false, error: 'invalid_phrase_token' };
    state.selection.push(payload.tokenId);
    return { session: state, changed: true };
  }
  if (action === 'remove_phrase_token') {
    if (state.phase !== 'active' || stage?.interaction !== 'assemble_response' || !state.selection.includes(payload.tokenId)) return { session, changed: false, error: 'invalid_phrase_token' };
    state.selection = state.selection.filter((id) => id !== payload.tokenId);
    return { session: state, changed: true };
  }
  if (action === 'move_ordered_item') {
    const fromIndex = state.orderedItems.indexOf(payload.itemId);
    const toIndex = payload.toIndex;
    if (state.phase !== 'active' || stage?.interaction !== 'order_items' || fromIndex < 0 || !Number.isInteger(toIndex) || toIndex < 0 || toIndex >= state.orderedItems.length) return { session, changed: false, error: 'invalid_order_move' };
    const [itemId] = state.orderedItems.splice(fromIndex, 1);
    state.orderedItems.splice(toIndex, 0, itemId);
    return { session: state, changed: true };
  }
  if (action === 'assign_category') {
    const observation = stage?.observations?.find(({ id }) => id === payload.observationId);
    if (state.phase !== 'active' || !['classify_observations', 'build_frequency_table'].includes(stage?.interaction) || !observation || !stage.categories.some(({ id }) => id === payload.categoryId)
      || (stage.collectionRules && !state.collectedObservationIds.includes(payload.observationId))) return { session, changed: false, error: stage?.collectionRules ? 'observation_not_collected' : 'invalid_observation_category' };
    state.assignments[payload.observationId] = payload.categoryId;
    return { session: state, changed: true };
  }
  if (action === 'toggle_table_observation') {
    const required = stage?.collectionRules?.requiredObservationIds ?? [];
    if (state.phase !== 'active' || stage?.interaction !== 'build_frequency_table' || !required.includes(payload.observationId)) return { session, changed: false, error: 'invalid_table_observation' };
    state.collectedObservationIds = state.collectedObservationIds.includes(payload.observationId)
      ? state.collectedObservationIds.filter((id) => id !== payload.observationId)
      : [...state.collectedObservationIds, payload.observationId];
    if (!state.collectedObservationIds.includes(payload.observationId)) delete state.assignments[payload.observationId];
    return { session: state, changed: true };
  }
  if (action === 'adjust_array_dimension') {
    if (state.phase !== 'active' || stage?.interaction !== 'build_array' || !['rows', 'columns'].includes(payload.dimension) || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_array_dimension' };
    const key = payload.dimension === 'rows' ? 'arrayRows' : 'arrayColumns';
    const max = payload.dimension === 'rows' ? stage.arrayRules.maxRows : stage.arrayRules.maxColumns;
    state[key] = Math.max(0, Math.min(max, state[key] + payload.delta));
    return { session: state, changed: true };
  }
  if (action === 'adjust_unknown_quantity') {
    const rules = stage?.unknownQuantityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_unknown_quantity_model'
      || !rules || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_unknown_quantity_adjustment' };
    const next = state.unknownQuantityValue + payload.delta;
    if (next < rules.min || next > rules.max) return { session, changed: false, error: 'unknown_quantity_out_of_range' };
    state.unknownQuantityValue = next;
    state.unknownQuantityTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_number_line_tick') {
    if (state.phase !== 'active' || stage?.interaction !== 'place_number_line_marker' || !Number.isInteger(payload.tick) || payload.tick < 0 || payload.tick > stage.numberLine.tickCount) return { session, changed: false, error: 'invalid_number_line_tick' };
    state.numberLineTick = payload.tick;
    return { session: state, changed: true };
  }
  if (action === 'toggle_area_cell') {
    const board = stage?.areaGridRules?.boards?.find(({ id }) => id === payload.boardId);
    const cellId = `r${payload.row}c${payload.column}`;
    if (state.phase !== 'active' || stage?.interaction !== 'build_area_grid' || !board
      || !Number.isInteger(payload.row) || !Number.isInteger(payload.column)
      || payload.row < 0 || payload.row >= board.rows || payload.column < 0 || payload.column >= board.columns
      || (stage.areaGridRules.mode === 'estimate_cover' && !Number.isInteger(state.areaEstimate))) {
      return { session, changed: false, error: stage?.areaGridRules?.mode === 'estimate_cover' && !Number.isInteger(state.areaEstimate) ? 'estimate_required_before_building' : 'invalid_area_grid_cell' };
    }
    const cells = state.areaGridCells[board.id] ?? [];
    state.areaGridCells[board.id] = cells.includes(cellId) ? cells.filter((id) => id !== cellId) : [...cells, cellId];
    if (!state.areaGridTouched.includes(board.id)) state.areaGridTouched.push(board.id);
    return { session: state, changed: true };
  }
  if (action === 'set_area_estimate') {
    const rules = stage?.areaGridRules?.estimate;
    if (state.phase !== 'active' || stage?.interaction !== 'build_area_grid' || stage.areaGridRules.mode !== 'estimate_cover'
      || !Number.isInteger(payload.value) || payload.value < rules.min || payload.value > rules.max) return { session, changed: false, error: 'invalid_area_estimate' };
    state.areaEstimate = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'set_area_relation') {
    if (state.phase !== 'active' || stage?.interaction !== 'build_area_grid' || stage.areaGridRules.mode !== 'compare_regions'
      || !['<', '=', '>'].includes(payload.relation)) return { session, changed: false, error: 'invalid_area_relation' };
    state.areaRelation = payload.relation;
    return { session: state, changed: true };
  }
  if (action === 'toggle_symmetry_cell') {
    const rules = stage?.symmetryRules;
    const cellId = payload.cellId;
    if (state.phase !== 'active' || stage?.interaction !== 'complete_symmetry_grid' || !rules?.fillableCellIds?.includes(cellId)) return { session, changed: false, error: 'invalid_symmetry_cell' };
    state.symmetryCells = state.symmetryCells.includes(cellId) ? state.symmetryCells.filter((id) => id !== cellId) : [...state.symmetryCells, cellId];
    return { session: state, changed: true };
  }
  if (action === 'set_line_chart_point') {
    const point = stage?.plotRules?.points?.find(({ id }) => id === payload.pointId);
    if (state.phase !== 'active' || stage?.interaction !== 'plot_line_chart' || !point || !stage.plotRules.valueOptions.includes(payload.value)) return { session, changed: false, error: 'invalid_line_chart_point' };
    state.lineChartValues[payload.pointId] = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'adjust_bar_chart_bar') {
    const rules = stage?.barChartRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_bar_chart'
      || !rules?.categories?.some(({ id }) => id === payload.categoryId) || ![-1, 1].includes(payload.delta)) {
      return { session, changed: false, error: 'invalid_bar_chart_adjustment' };
    }
    const next = (state.barChartValues[payload.categoryId] ?? 0) + payload.delta;
    if (next < 0 || next > rules.maxValue) return { session, changed: false, error: 'bar_chart_value_out_of_range' };
    state.barChartValues[payload.categoryId] = next;
    if (!state.barChartTouched.includes(payload.categoryId)) state.barChartTouched.push(payload.categoryId);
    return { session: state, changed: true };
  }
  if (action === 'toggle_triangle_vertex') {
    const rules = stage?.triangleRules;
    const match = typeof payload.pointId === 'string' ? /^r(\d+)c(\d+)$/.exec(payload.pointId) : null;
    if (state.phase !== 'active' || stage?.interaction !== 'construct_triangle' || !rules || !match
      || Number(match[1]) >= rules.rows || Number(match[2]) >= rules.columns) return { session, changed: false, error: 'invalid_triangle_vertex' };
    if (state.triangleVertices.includes(payload.pointId)) state.triangleVertices = state.triangleVertices.filter((id) => id !== payload.pointId);
    else if (state.triangleVertices.length < 3) state.triangleVertices.push(payload.pointId);
    else return { session, changed: false, error: 'triangle_has_three_vertices' };
    return { session: state, changed: true };
  }
  if (action === 'toggle_quadrilateral_vertex') {
    const rules = stage?.quadrilateralRules;
    const match = typeof payload.pointId === 'string' ? /^r(\d+)c(\d+)$/.exec(payload.pointId) : null;
    if (state.phase !== 'active' || stage?.interaction !== 'construct_quadrilateral' || !rules || !match
      || Number(match[1]) >= rules.rows || Number(match[2]) >= rules.columns) return { session, changed: false, error: 'invalid_quadrilateral_vertex' };
    if (state.quadrilateralVertices.includes(payload.pointId)) state.quadrilateralVertices = state.quadrilateralVertices.filter((id) => id !== payload.pointId);
    else if (state.quadrilateralVertices.length < 4) state.quadrilateralVertices.push(payload.pointId);
    else return { session, changed: false, error: 'quadrilateral_has_four_vertices' };
    return { session: state, changed: true };
  }
  if (action === 'select_calculation_value') {
    const calculationStep = stage?.calculationSteps?.find(({ id }) => id === payload.stepId);
    if (state.phase !== 'active' || stage?.interaction !== 'complete_calculation_steps' || !calculationStep?.choices?.some(({ value }) => value === payload.value)) return { session, changed: false, error: 'invalid_calculation_value' };
    state.calculationValues[payload.stepId] = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'adjust_place_value_block') {
    const rules = stage?.placeValueRules;
    const place = payload.place;
    if (state.phase !== 'active' || stage?.interaction !== 'build_place_value_blocks' || !rules
      || !Object.hasOwn(placeValueWeights, place) || ![-1, 1].includes(payload.delta)) {
      return { session, changed: false, error: 'invalid_place_value_block_adjustment' };
    }
    const next = (state.placeValueBlocks[place] ?? 0) + payload.delta;
    if (next < 0 || next > rules.maxCounts[place]) return { session, changed: false, error: 'place_value_block_out_of_range' };
    state.placeValueBlocks[place] = next;
    state.placeValueTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'exchange_place_value_block') {
    const rules = stage?.placeValueRules;
    const allowed = rules?.allowedExchanges?.some(({ from, to }) => from === payload.from && to === payload.to);
    if (state.phase !== 'active' || stage?.interaction !== 'build_place_value_blocks' || !rules || !allowed
      || (state.placeValueBlocks[payload.from] ?? 0) < 1) {
      return { session, changed: false, error: 'invalid_place_value_exchange' };
    }
    state.placeValueBlocks[payload.from] -= 1;
    state.placeValueBlocks[payload.to] += 10;
    state.placeValueExchangeCount += 1;
    state.placeValueTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'adjust_vertical_calculation_step') {
    const step = stage?.calculationSteps?.find(({ id }) => id === payload.stepId);
    if (state.phase !== 'active' || stage?.interaction !== 'operate_vertical_calculation' || !step
      || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_vertical_calculation_step' };
    const next = (state.verticalCalculationValues[step.id] ?? step.initialValue ?? 0) + payload.delta;
    if (next < step.minValue || next > step.maxValue) return { session, changed: false, error: 'vertical_calculation_value_out_of_range' };
    state.verticalCalculationValues[step.id] = next;
    return { session: state, changed: true };
  }
  if (action === 'set_circle_radius') {
    if (state.phase !== 'active' || stage?.interaction !== 'adjust_circle_radius' || !stage.circleRules.allowedRadii.includes(payload.radius)) return { session, changed: false, error: 'invalid_circle_radius' };
    state.circleRadius = payload.radius;
    return { session: state, changed: true };
  }
  if (action === 'set_estimate_value') {
    const range = stage?.estimateRules?.inputRange;
    if (state.phase !== 'active' || stage?.interaction !== 'set_estimate_range' || !range || !Number.isFinite(payload.value) || payload.value < range.min || payload.value > range.max || (payload.value - range.min) % range.step !== 0) return { session, changed: false, error: 'invalid_estimate_value' };
    state.estimateValue = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'set_length_estimate') {
    const range = stage?.lengthRules?.estimateRange;
    if (state.phase !== 'active' || stage?.interaction !== 'measure_length_model' || stage.lengthRules.mode !== 'estimate'
      || !Number.isInteger(payload.value) || payload.value < range?.min || payload.value > range?.max) return { session, changed: false, error: 'invalid_length_estimate' };
    state.lengthEstimate = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'move_length_ruler') {
    const rules = stage?.lengthRules;
    if (state.phase !== 'active' || stage?.interaction !== 'measure_length_model' || rules?.mode !== 'align_read' || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_length_ruler_move' };
    const next = state.lengthRulerZero + payload.delta;
    if (next < rules.rulerZeroRange.min || next > rules.rulerZeroRange.max) return { session, changed: false, error: 'length_ruler_out_of_range' };
    state.lengthRulerZero = next;
    state.lengthReadings[rules.object.id] = null;
    state.lengthReadingTouched = state.lengthReadingTouched.filter((id) => id !== rules.object.id);
    state.lengthRulerTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_length_reading') {
    const rules = stage?.lengthRules;
    const object = rules?.objects?.find(({ id }) => id === payload.objectId) ?? rules?.object;
    if (state.phase !== 'active' || stage?.interaction !== 'measure_length_model' || !['align_read', 'compare'].includes(rules?.mode)
      || !object || !Number.isInteger(payload.value) || payload.value < 0 || payload.value > rules.maxReading) return { session, changed: false, error: 'invalid_length_reading' };
    state.lengthReadings[object.id] = payload.value;
    if (!state.lengthReadingTouched.includes(object.id)) state.lengthReadingTouched.push(object.id);
    return { session: state, changed: true };
  }
  if (action === 'set_length_conversion') {
    const rules = stage?.lengthRules;
    if (state.phase !== 'active' || stage?.interaction !== 'measure_length_model' || !(rules?.mode === 'convert' || (rules?.mode === 'compare' && Number.isInteger(rules.conversionTargetMillimeters)))
      || !Number.isInteger(payload.centimeters) || payload.centimeters < 0 || payload.centimeters > rules.maxCentimeters
      || !Number.isInteger(payload.millimeters) || payload.millimeters < 0 || payload.millimeters > 9) return { session, changed: false, error: 'invalid_length_conversion' };
    state.lengthCentimeters = payload.centimeters;
    state.lengthRemainingMillimeters = payload.millimeters;
    state.lengthConversionTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_length_difference') {
    const rules = stage?.lengthRules;
    if (state.phase !== 'active' || stage?.interaction !== 'measure_length_model' || rules?.mode !== 'compare'
      || !Number.isInteger(payload.value) || payload.value < 0 || payload.value > rules.maxReading) return { session, changed: false, error: 'invalid_length_difference' };
    state.lengthDifference = payload.value;
    state.lengthReadingTouched = [...new Set([...state.lengthReadingTouched, '__difference__'])];
    return { session: state, changed: true };
  }
  if (action === 'set_weight_estimate') {
    const rules = stage?.weightRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || rules?.mode !== 'estimate'
      || !Number.isInteger(payload.value) || payload.value < rules.input.min || payload.value > rules.input.max
      || (payload.value - rules.input.min) % rules.input.step !== 0) return { session, changed: false, error: 'invalid_weight_estimate' };
    state.weightScale.estimate = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'set_capacity_estimate') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || rules?.mode !== 'estimate'
      || !Number.isInteger(payload.value) || payload.value < rules.input.min || payload.value > rules.input.max
      || (payload.value - rules.input.min) % rules.input.step !== 0) return { session, changed: false, error: 'invalid_capacity_estimate' };
    state.capacityModel.estimateMl = payload.value;
    state.capacityModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'adjust_capacity_volume') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || !['fill', 'read', 'difference'].includes(rules?.mode)
      || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_capacity_adjustment' };
    const next = state.capacityModel.volumeMl + payload.delta * rules.stepMl;
    if (next < 0 || next > rules.containerCapacityMl) return { session, changed: false, error: 'capacity_volume_out_of_range' };
    state.capacityModel.volumeMl = next;
    state.capacityModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_capacity_reading') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || rules?.mode !== 'read' || state.capacityModel.volumeMl !== rules.targetMl
      || !Number.isInteger(payload.value) || payload.value < 0 || payload.value > rules.containerCapacityMl
      || payload.value % rules.readingStepMl !== 0) return { session, changed: false, error: 'invalid_capacity_reading' };
    state.capacityModel.readingMl = payload.value;
    state.capacityModel.readingTouched = true;
    state.capacityModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'adjust_capacity_container') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || rules?.mode !== 'compare'
      || !rules.containers.some(({ id }) => id === payload.containerId) || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_capacity_container_adjustment' };
    const container = rules.containers.find(({ id }) => id === payload.containerId);
    const next = state.capacityModel.containerVolumes[container.id] + payload.delta * rules.stepMl;
    if (next < 0 || next > container.capacityMl) return { session, changed: false, error: 'capacity_container_out_of_range' };
    state.capacityModel.containerVolumes[container.id] = next;
    state.capacityModel.touched = true;
    if (!state.capacityModel.compareTouched.includes(container.id)) state.capacityModel.compareTouched.push(container.id);
    return { session: state, changed: true };
  }
  if (action === 'set_capacity_relation') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || rules?.mode !== 'compare'
      || !['<', '=', '>'].includes(payload.relation)) return { session, changed: false, error: 'invalid_capacity_relation' };
    state.capacityModel.relation = payload.relation;
    state.capacityModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_capacity_difference') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || rules?.mode !== 'difference'
      || !Number.isInteger(payload.value) || payload.value < 0 || payload.value > rules.containerCapacityMl
      || payload.value % rules.answerStepMl !== 0) return { session, changed: false, error: 'invalid_capacity_difference' };
    state.capacityModel.differenceMl = payload.value;
    state.capacityModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'toggle_capacity_supply_item') {
    const rules = stage?.capacityRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_capacity_model' || rules?.mode !== 'supply'
      || !rules.items.some(({ id }) => id === payload.itemId)) return { session, changed: false, error: 'invalid_capacity_supply_item' };
    const selected = state.capacityModel.selectedItems.includes(payload.itemId)
      ? state.capacityModel.selectedItems.filter((id) => id !== payload.itemId)
      : [...state.capacityModel.selectedItems, payload.itemId];
    const total = rules.items.filter(({ id }) => selected.includes(id)).reduce((sum, item) => sum + item.volumeMl, 0);
    if (total > rules.containerCapacityMl) return { session, changed: false, error: 'capacity_supply_overflow' };
    state.capacityModel.selectedItems = selected;
    state.capacityModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'adjust_weight_pan') {
    const rules = stage?.weightRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || rules?.mode !== 'balance'
      || !['left', 'right'].includes(payload.side) || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_weight_pan_adjustment' };
    const next = state.weightScale.balanceCounts[payload.side] + payload.delta;
    if (next < 0 || next > rules.maxCounterweights) return { session, changed: false, error: 'weight_counterweight_out_of_range' };
    state.weightScale.balanceCounts[payload.side] = next;
    state.weightScale.balanceTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_weight_scale_reading') {
    const rules = stage?.weightRules;
    const allowed = rules?.mode === 'read' || rules?.mode === 'compare';
    const key = rules?.mode === 'read' ? 'reading' : payload.itemId;
    const validItem = rules?.mode !== 'compare' || rules.items.some(({ id }) => id === key);
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || !allowed || !validItem
      || !Number.isInteger(payload.value) || payload.value < rules.input.min || payload.value > rules.input.max
      || (payload.value - rules.input.min) % rules.input.step !== 0) return { session, changed: false, error: 'invalid_weight_scale_reading' };
    if (rules.mode === 'read') { state.weightScale.reading = payload.value; state.weightScale.readingTouched = true; }
    else { state.weightScale.compareReadings[key] = payload.value; if (!state.weightScale.compareTouched.includes(key)) state.weightScale.compareTouched.push(key); }
    return { session: state, changed: true };
  }
  if (action === 'set_weight_comparison') {
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || stage.weightRules.mode !== 'compare'
      || !['<', '=', '>'].includes(payload.relation) || !Number.isInteger(payload.difference) || payload.difference < 0 || payload.difference > stage.weightRules.input.max) return { session, changed: false, error: 'invalid_weight_comparison' };
    state.weightScale.relation = payload.relation;
    state.weightScale.difference = payload.difference;
    state.weightScale.differenceTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_weight_relation') {
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || stage.weightRules.mode !== 'compare' || !['<', '=', '>'].includes(payload.relation)) return { session, changed: false, error: 'invalid_weight_relation' };
    state.weightScale.relation = payload.relation;
    return { session: state, changed: true };
  }
  if (action === 'set_weight_difference') {
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || stage.weightRules.mode !== 'compare'
      || !Number.isInteger(payload.value) || payload.value < 0 || payload.value > stage.weightRules.input.max) return { session, changed: false, error: 'invalid_weight_difference' };
    state.weightScale.difference = payload.value;
    state.weightScale.differenceTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_weight_conversion') {
    const rules = stage?.weightRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || rules?.mode !== 'convert'
      || !Number.isInteger(payload.kilograms) || payload.kilograms < rules.kilograms.min || payload.kilograms > rules.kilograms.max
      || !Number.isInteger(payload.grams) || payload.grams < rules.grams.min || payload.grams > rules.grams.max) return { session, changed: false, error: 'invalid_weight_conversion' };
    state.weightScale.kilograms = payload.kilograms;
    state.weightScale.grams = payload.grams;
    state.weightScale.conversionTouched = true;
    return { session: state, changed: true };
  }
  if (action === 'toggle_weight_supply_item') {
    const rules = stage?.weightRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_weight_scale' || rules?.mode !== 'supply' || !rules.items.some(({ id }) => id === payload.itemId)) return { session, changed: false, error: 'invalid_weight_supply_item' };
    state.weightScale.selectedItems = state.weightScale.selectedItems.includes(payload.itemId)
      ? state.weightScale.selectedItems.filter((id) => id !== payload.itemId) : [...state.weightScale.selectedItems, payload.itemId];
    return { session: state, changed: true };
  }
  if (action === 'flip_magnet') {
    if (state.phase !== 'active' || stage?.interaction !== 'magnet_interaction' || stage.magnetRules.mode !== 'poles') return { session, changed: false, error: 'invalid_magnet_flip' };
    state.magnetModel.facingPole = state.magnetModel.facingPole === 'N' ? 'S' : 'N';
    state.magnetModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'test_magnet_material') {
    const rules = stage?.magnetRules;
    if (state.phase !== 'active' || stage?.interaction !== 'magnet_interaction' || rules?.mode !== 'materials' || !rules.materials.some(({ id }) => id === payload.materialId)) return { session, changed: false, error: 'invalid_magnet_material' };
    if (!state.magnetModel.testedObjectIds.includes(payload.materialId)) state.magnetModel.testedObjectIds.push(payload.materialId);
    state.magnetModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'assign_magnet_material') {
    const rules = stage?.magnetRules;
    if (state.phase !== 'active' || stage?.interaction !== 'magnet_interaction' || rules?.mode !== 'materials'
      || !state.magnetModel.testedObjectIds.includes(payload.materialId) || !rules.materials.some(({ id }) => id === payload.materialId)
      || !rules.categories.some(({ id }) => id === payload.categoryId)) return { session, changed: false, error: 'invalid_magnet_assignment' };
    state.magnetModel.assignments[payload.materialId] = payload.categoryId;
    state.magnetModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'test_magnet_strength') {
    const rules = stage?.magnetRules;
    if (state.phase !== 'active' || stage?.interaction !== 'magnet_interaction' || rules?.mode !== 'strength' || !rules.magnets.some(({ id }) => id === payload.magnetId)) return { session, changed: false, error: 'invalid_magnet_strength_test' };
    if (!state.magnetModel.testedMagnetIds.includes(payload.magnetId)) state.magnetModel.testedMagnetIds.push(payload.magnetId);
    state.magnetModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'select_stronger_magnet') {
    const rules = stage?.magnetRules;
    if (state.phase !== 'active' || stage?.interaction !== 'magnet_interaction' || rules?.mode !== 'strength'
      || !state.magnetModel.testedMagnetIds.every((id) => rules.magnets.some(({ id: validId }) => validId === id))
      || !rules.magnets.some(({ id }) => id === payload.magnetId)) return { session, changed: false, error: 'invalid_magnet_strength_selection' };
    state.magnetModel.selectedStrongerMagnetId = payload.magnetId;
    state.magnetModel.touched = true;
    return { session: state, changed: true };
  }
  if (action === 'set_fraction_denominator') {
    const rules = stage?.fractionRules;
    if (state.phase !== 'active' || stage?.interaction !== 'manipulate_fraction_model' || !rules?.denominatorOptions?.includes(payload.denominator)) return { session, changed: false, error: 'invalid_fraction_denominator' };
    if (state.fractionDenominator !== payload.denominator) state.fractionPieceLocations = Object.fromEntries(rules.pieces.map(({ id, initialGroupId }) => [id, initialGroupId]));
    state.fractionDenominator = payload.denominator;
    return { session: state, changed: true };
  }
  if (action === 'select_fraction_whole') {
    const rules = stage?.fractionRules;
    if (state.phase !== 'active' || stage?.interaction !== 'manipulate_fraction_model' || !rules?.wholeOptions?.some(({ id }) => id === payload.wholeId)) return { session, changed: false, error: 'invalid_fraction_whole' };
    state.fractionSelectedWholeId = payload.wholeId;
    return { session: state, changed: true };
  }
  if (action === 'select_fraction_model') {
    const group = stage?.fractionRules?.groups?.find(({ id }) => id === payload.groupId);
    if (state.phase !== 'active' || stage?.interaction !== 'manipulate_fraction_model' || !group?.acceptsPieces) return { session, changed: false, error: 'invalid_fraction_model' };
    state.fractionSelectedModelId = group.id;
    return { session: state, changed: true };
  }
  if (action === 'move_fraction_piece') {
    const rules = stage?.fractionRules;
    const piece = rules?.pieces?.find(({ id }) => id === payload.pieceId);
    const target = rules?.groups?.find(({ id }) => id === payload.targetGroupId);
    if (state.phase !== 'active' || stage?.interaction !== 'manipulate_fraction_model' || !piece || !target) return { session, changed: false, error: 'invalid_fraction_piece_move' };
    if (state.fractionDenominator !== rules.denominator) return { session, changed: false, error: 'select_fraction_partition_first' };
    if (target.acceptsPieces && state.fractionSelectedModelId !== target.id && target.id !== rules.sourceGroupId) return { session, changed: false, error: 'select_fraction_model_first' };
    const currentGroupId = state.fractionPieceLocations[piece.id];
    if (currentGroupId === target.id) return { session, changed: false, error: 'fraction_piece_already_in_group' };
    const effectiveCapacity = target.kind === 'fraction' ? Math.min(target.capacity ?? rules.denominator, state.fractionDenominator) : (target.capacity ?? rules.pieces.length);
    if (fractionGroupCount(state, target.id) >= effectiveCapacity) return { session, changed: false, error: 'fraction_group_is_full' };
    state.fractionPieceLocations[piece.id] = target.id;
    return { session: state, changed: true };
  }
  if (action === 'set_fraction_relation') {
    const rules = stage?.fractionRules;
    if (state.phase !== 'active' || stage?.interaction !== 'manipulate_fraction_model' || rules?.mode !== 'compare' || !['<', '=', '>'].includes(payload.relation)) return { session, changed: false, error: 'invalid_fraction_relation' };
    state.fractionRelation = payload.relation;
    return { session: state, changed: true };
  }
  if (action === 'adjust_decimal_place') {
    const rules = stage?.decimalRules;
    if (state.phase !== 'active' || stage?.interaction !== 'adjust_decimal_place_value' || !rules
      || !['ones', 'tenths', 'hundredths'].includes(payload.place) || ![-1, 1].includes(payload.delta)) {
      return { session, changed: false, error: 'invalid_decimal_place_adjustment' };
    }
    const step = { ones: 100, tenths: 10, hundredths: 1 }[payload.place];
    const next = state.decimalHundredths + step * payload.delta;
    if (!Number.isInteger(next) || next < rules.minHundredths || next > rules.maxHundredths) return { session, changed: false, error: 'decimal_value_out_of_range' };
    state.decimalHundredths = next;
    return { session: state, changed: true };
  }
  if (action === 'select_line_construction_point') {
    const rules = stage?.lineRules;
    const match = typeof payload.pointId === 'string' ? /^r(\d+)c(\d+)$/.exec(payload.pointId) : null;
    if (state.phase !== 'active' || stage?.interaction !== 'construct_lines' || !rules || !match
      || Number(match[1]) >= rules.rows || Number(match[2]) >= rules.columns) return { session, changed: false, error: 'invalid_line_construction_point' };
    if (state.linePoints.includes(payload.pointId)) return { session, changed: false, error: 'duplicate_line_construction_point' };
    state.linePoints = state.linePoints.length >= 2 ? [payload.pointId] : [...state.linePoints, payload.pointId];
    return { session: state, changed: true };
  }
  if (action === 'set_clock_hand') {
    const rules = stage?.clockRules;
    if (state.phase !== 'active' || stage?.interaction !== 'set_clock_time' || !rules
      || !['hour', 'minute'].includes(payload.hand)
      || !Number.isInteger(payload.value)
      || (payload.hand === 'hour' && !rules.allowedHours.includes(payload.value))
      || (payload.hand === 'minute' && (payload.value < 0 || payload.value >= 60 || payload.value % rules.minuteStep !== 0))) {
      return { session, changed: false, error: 'invalid_clock_hand_value' };
    }
    if (payload.hand === 'hour') state.clockHour = payload.value;
    else {
      if (state.clockMinute === 55 && payload.value === 0) state.clockHour = state.clockHour % 12 + 1;
      else if (state.clockMinute === 0 && payload.value === 55) state.clockHour = (state.clockHour + 10) % 12 + 1;
      state.clockMinute = payload.value;
    }
    return { session: state, changed: true };
  }
  if (action === 'set_elapsed_minutes') {
    const rules = stage?.elapsedRules;
    if (state.phase !== 'active' || stage?.interaction !== 'elapsed_time_model' || !rules
      || !Number.isInteger(payload.value) || payload.value < rules.minMinutes || payload.value > rules.maxMinutes
      || (payload.value - rules.minMinutes) % rules.stepMinutes !== 0) return { session, changed: false, error: 'invalid_elapsed_time_value' };
    state.elapsedMinutes = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'adjust_volume_dimension') {
    const rules = stage?.volumeRules;
    if (state.phase !== 'active' || stage?.interaction !== 'build_volume' || !rules
      || !['rows', 'columns', 'layers'].includes(payload.dimension) || ![-1, 1].includes(payload.delta)) {
      return { session, changed: false, error: 'invalid_volume_dimension' };
    }
    const key = `volume${payload.dimension[0].toUpperCase()}${payload.dimension.slice(1)}`;
    const max = rules.max[payload.dimension];
    state[key] = Math.max(0, Math.min(max, state[key] + payload.delta));
    return { session: state, changed: true };
  }
  if (action === 'toggle_shape_piece') {
    if (state.phase !== 'active' || stage?.interaction !== 'compose_shape' || !stage.pieces.some(({ id }) => id === payload.pieceId)) return { session, changed: false, error: 'invalid_shape_piece' };
    if (state.selection.includes(payload.pieceId)) state.selection = state.selection.filter((id) => id !== payload.pieceId);
    else if (state.selection.length < (stage.shapeRules.selectionCount ?? stage.shapeRules.rows * stage.shapeRules.columns)) state.selection.push(payload.pieceId);
    else return { session, changed: false, error: 'shape_target_full' };
    return { session: state, changed: true };
  }
  if (action === 'select_geometry_piece') {
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'split_recompose' || !stage.pieces.some(({ id }) => id === payload.pieceId)) return { session, changed: false, error: 'invalid_geometry_piece' };
    state.geometrySelectedPieceId = payload.pieceId;
    return { session: state, changed: true };
  }
  if (action === 'move_geometry_piece') {
    const transform = state.geometryPieces[payload.pieceId];
    const piece = stage?.pieces?.find(({ id }) => id === payload.pieceId);
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'split_recompose' || !piece || !transform || !['up', 'down', 'left', 'right'].includes(payload.direction)) return { session, changed: false, error: 'invalid_geometry_move' };
    const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[payload.direction];
    const moved = { row: transform.row + delta[0], column: transform.column + delta[1] };
    if (!geometryCellsFit(piece, { ...transform, ...moved }, stage.board)) return { session, changed: false, error: 'geometry_piece_out_of_bounds' };
    state.geometryPieces[payload.pieceId] = { ...transform, ...moved };
    state.geometrySelectedPieceId = payload.pieceId;
    return { session: state, changed: true };
  }
  if (action === 'rotate_geometry_piece') {
    const transform = state.geometryPieces[payload.pieceId];
    const piece = stage?.pieces?.find(({ id }) => id === payload.pieceId);
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'split_recompose' || !piece || !transform) return { session, changed: false, error: 'invalid_geometry_rotation' };
    const rotation = (transform.rotation + 1) % 4;
    const rotated = { ...transform, rotation };
    if (!geometryCellsFit(piece, rotated, stage.board)) return { session, changed: false, error: 'geometry_piece_out_of_bounds' };
    state.geometryPieces[payload.pieceId] = rotated;
    state.geometrySelectedPieceId = payload.pieceId;
    return { session: state, changed: true };
  }
  if (action === 'flip_geometry_piece') {
    const transform = state.geometryPieces[payload.pieceId];
    const piece = stage?.pieces?.find(({ id }) => id === payload.pieceId);
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'split_recompose' || !piece || !transform) return { session, changed: false, error: 'invalid_geometry_flip' };
    const flipped = { ...transform, flipped: !transform.flipped };
    if (!geometryCellsFit(piece, flipped, stage.board)) return { session, changed: false, error: 'geometry_piece_out_of_bounds' };
    state.geometryPieces[payload.pieceId] = flipped;
    state.geometrySelectedPieceId = payload.pieceId;
    return { session: state, changed: true };
  }
  if (action === 'select_geometry_net') {
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'fold_net' || !stage.netCandidates.some(({ id }) => id === payload.netId)) return { session, changed: false, error: 'invalid_geometry_net' };
    state.selectedNetId = payload.netId;
    state.foldedNet = null;
    state.geometryAdjacencyAnswer = null;
    return { session: state, changed: true };
  }
  if (action === 'simulate_geometry_fold') {
    const selected = stage?.netCandidates?.find(({ id }) => id === state.selectedNetId);
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'fold_net' || !selected) return { session, changed: false, error: 'select_net_before_folding' };
    state.foldedNet = foldCubeNet(selected.faces);
    state.geometryAdjacencyAnswer = null;
    return { session: state, changed: true };
  }
  if (action === 'set_geometry_adjacency_answer') {
    if (state.phase !== 'active' || stage?.interaction !== 'geometry_exploration' || stage.geometryMode !== 'fold_net' || !state.foldedNet || typeof payload.adjacent !== 'boolean') return { session, changed: false, error: 'fold_net_before_answering' };
    state.geometryAdjacencyAnswer = payload.adjacent;
    return { session: state, changed: true };
  }
  if (action === 'set_angle_value') {
    const rules = stage?.angleRules;
    const field = rules?.mode === 'estimate' ? 'angleEstimate' : ['draw', 'align', 'right_angle'].includes(rules?.mode) ? 'angleDrawValue' : null;
    const range = rules?.valueRange ?? { min: 0, max: 180, step: 1 };
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || !field || !Number.isInteger(payload.degrees)
      || payload.degrees < range.min || payload.degrees > range.max
      || (payload.degrees - range.min) % range.step !== 0) return { session, changed: false, error: 'invalid_angle_value' };
    state[field] = payload.degrees;
    return { session: state, changed: true };
  }
  if (action === 'select_angle_option') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || rules?.mode !== 'identify'
      || !rules.options?.some(({ id }) => id === payload.optionId)) return { session, changed: false, error: 'invalid_angle_option' };
    state.angleSelectedOptionId = payload.optionId;
    return { session: state, changed: true };
  }
  if (action === 'set_angle_comparison') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || rules?.mode !== 'compare'
      || !['A', 'B'].includes(payload.angleId) || !Number.isInteger(payload.degrees)
      || payload.degrees < (rules.valueRange?.min ?? 20) || payload.degrees > (rules.valueRange?.max ?? 160)
      || (payload.degrees - (rules.valueRange?.min ?? 20)) % (rules.valueRange?.step ?? 5) !== 0) return { session, changed: false, error: 'invalid_angle_comparison' };
    state[payload.angleId === 'A' ? 'angleComparisonAngleA' : 'angleComparisonAngleB'] = payload.degrees;
    state.angleComparisonAnswer = null;
    return { session: state, changed: true };
  }
  if (action === 'set_angle_comparison_answer') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || !['compare', 'right_angle'].includes(rules?.mode)
      || !['less', 'equal', 'greater'].includes(payload.relation)) return { session, changed: false, error: 'invalid_angle_relation' };
    state.angleComparisonAnswer = payload.relation;
    return { session: state, changed: true };
  }
  if (action === 'adjust_angle_alignment') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || rules?.mode !== 'measure'
      || !['center', 'baseline'].includes(payload.part) || ![-1, 1].includes(payload.delta)) return { session, changed: false, error: 'invalid_angle_alignment' };
    if (payload.part === 'center') state.angleCenterOffset = Math.max(-rules.centerRange, Math.min(rules.centerRange, state.angleCenterOffset + payload.delta));
    else state.angleBaselineOffset = Math.max(-rules.baselineRange, Math.min(rules.baselineRange, state.angleBaselineOffset + payload.delta * rules.baselineStep));
    state.angleReading = null;
    return { session: state, changed: true };
  }
  if (action === 'set_angle_baseline_side') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || rules?.mode !== 'measure'
      || !['left', 'right'].includes(payload.side)) return { session, changed: false, error: 'invalid_angle_baseline_side' };
    state.angleBaselineSide = payload.side;
    state.angleReading = null;
    return { session: state, changed: true };
  }
  if (action === 'set_angle_reading') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || rules?.mode !== 'measure'
      || state.angleCenterOffset !== 0 || state.angleBaselineOffset !== 0 || !state.angleBaselineSide
      || !Number.isInteger(payload.degrees) || payload.degrees < 0 || payload.degrees > 180 || payload.degrees % rules.readingStep !== 0) {
      return { session, changed: false, error: 'angle_protractor_not_aligned' };
    }
    state.angleReading = payload.degrees;
    return { session: state, changed: true };
  }
  if (action === 'set_angle_rotation') {
    const rules = stage?.angleRules;
    if (state.phase !== 'active' || stage?.interaction !== 'angle_exploration' || rules?.mode !== 'rotation'
      || !['clockwise', 'counterclockwise'].includes(payload.direction) || !Number.isInteger(payload.degrees)
      || payload.degrees < 0 || payload.degrees > 360 || payload.degrees % rules.rotationStep !== 0) {
      return { session, changed: false, error: 'invalid_angle_rotation' };
    }
    state.angleRotationDirection = payload.direction;
    state.angleRotationDegrees = payload.degrees;
    return { session: state, changed: true };
  }
  if (action === 'add_pattern_beat') {
    if (state.phase !== 'active' || stage?.interaction !== 'compose_pattern' || !stage.tokens.some(({ id }) => id === payload.tokenId)) return { session, changed: false, error: 'invalid_pattern_beat' };
    if (stage.patternRules.mode === 'repair') {
      if (!Number.isInteger(state.patternRepairIndex)) return { session, changed: false, error: 'select_pattern_cell_first' };
      state.selection[state.patternRepairIndex] = payload.tokenId;
      state.patternRepairTouched = true;
      return { session: state, changed: true };
    }
    if (state.selection.length >= stage.patternRules.beatCount) return { session, changed: false, error: 'invalid_pattern_beat' };
    state.selection.push(payload.tokenId);
    return { session: state, changed: true };
  }
  if (action === 'remove_pattern_beat') {
    if (state.phase !== 'active' || stage?.interaction !== 'compose_pattern' || !Number.isInteger(payload.index) || payload.index < 0 || payload.index >= state.selection.length) return { session, changed: false, error: 'invalid_pattern_beat' };
    state.selection.splice(payload.index, 1);
    return { session: state, changed: true };
  }
  if (action === 'select_pattern_repair_cell') {
    if (state.phase !== 'active' || stage?.interaction !== 'compose_pattern' || stage.patternRules.mode !== 'repair'
      || !Number.isInteger(payload.index) || payload.index < 0 || payload.index >= stage.patternRules.beatCount) return { session, changed: false, error: 'invalid_pattern_repair_cell' };
    state.patternRepairIndex = payload.index;
    return { session: state, changed: true };
  }
  if (action === 'set_pattern_rule_value') {
    const rules = stage?.patternRules;
    if (state.phase !== 'active' || stage?.interaction !== 'compose_pattern' || rules?.mode !== 'number_builder'
      || !['start', 'increment'].includes(payload.field) || !Number.isInteger(payload.value)) return { session, changed: false, error: 'invalid_pattern_rule_value' };
    const bounds = payload.field === 'start' ? rules.startRange : rules.incrementRange;
    if (!bounds || payload.value < bounds.min || payload.value > bounds.max) return { session, changed: false, error: 'pattern_rule_value_out_of_range' };
    if (payload.field === 'start') state.patternStartValue = payload.value;
    else state.patternIncrement = payload.value;
    return { session: state, changed: true };
  }
  if (action === 'append_pattern_sequence_term') {
    const rules = stage?.patternRules;
    if (state.phase !== 'active' || stage?.interaction !== 'compose_pattern' || rules?.mode !== 'number_builder'
      || !Number.isInteger(payload.value) || payload.value < rules.termRange.min || payload.value > rules.termRange.max
      || state.patternSequenceEntries.length >= rules.termCount) return { session, changed: false, error: 'invalid_pattern_sequence_term' };
    state.patternSequenceEntries.push(payload.value);
    return { session: state, changed: true };
  }
  if (action === 'submit') {
    const hasResponse = ['classify_observations', 'build_frequency_table'].includes(stage?.interaction)
      ? (!stage.collectionRules || stage.collectionRules.requiredObservationIds.every((id) => state.collectedObservationIds.includes(id))) && stage.observations.every(({ id }) => state.assignments[id])
      : stage?.interaction === 'collect_evidence'
        ? Number.isInteger(stage.requiredSelectionCount)
          ? state.selection.length === stage.requiredSelectionCount
          : state.selection.length > 0
      : stage?.interaction === 'complete_symmetry_grid'
        ? state.symmetryCells.length > 0
        : stage?.interaction === 'plot_line_chart'
          ? stage.plotRules.points.every(({ id }) => Number.isFinite(state.lineChartValues[id]))
          : stage?.interaction === 'build_bar_chart'
            ? stage.barChartRules.categories.every(({ id }) => state.barChartTouched.includes(id) && Number.isInteger(state.barChartValues[id]))
            : stage?.interaction === 'construct_triangle'
              ? state.triangleVertices.length === 3
              : stage?.interaction === 'construct_quadrilateral'
                ? state.quadrilateralVertices.length === 4
      : stage?.interaction === 'compose_pattern'
        ? stage.patternRules.mode === 'number_builder'
          ? Number.isInteger(state.patternStartValue) && Number.isInteger(state.patternIncrement) && state.patternSequenceEntries.length === stage.patternRules.termCount
          : stage.patternRules.mode === 'repair' ? state.patternRepairTouched && Number.isInteger(state.patternRepairIndex)
            : state.selection.length === stage.patternRules.beatCount
        : stage?.interaction === 'build_array'
          ? state.arrayRows > 0 && state.arrayColumns > 0
          : stage?.interaction === 'build_unknown_quantity_model'
            ? state.unknownQuantityTouched && Number.isInteger(state.unknownQuantityValue)
          : stage?.interaction === 'place_number_line_marker'
            ? Number.isInteger(state.numberLineTick)
            : stage?.interaction === 'compose_shape'
              ? state.selection.length === (stage.shapeRules.selectionCount ?? stage.shapeRules.rows * stage.shapeRules.columns)
          : stage?.interaction === 'order_items'
            ? state.orderedItems.length === stage.items.length
          : stage?.interaction === 'complete_calculation_steps'
            ? stage.calculationSteps.every(({ id }) => Number.isInteger(state.calculationValues[id]))
            : stage?.interaction === 'operate_vertical_calculation'
              ? stage.calculationSteps.every(({ id }) => Number.isInteger(state.verticalCalculationValues[id]))
              : stage?.interaction === 'build_place_value_blocks'
                ? state.placeValueTouched
            : stage?.interaction === 'adjust_decimal_place_value'
              ? Number.isInteger(state.decimalHundredths)
            : stage?.interaction === 'adjust_circle_radius'
              ? Number.isInteger(state.circleRadius)
              : stage?.interaction === 'set_estimate_range'
                ? Number.isFinite(state.estimateValue)
                : stage?.interaction === 'set_clock_time'
                  ? Number.isInteger(state.clockHour) && Number.isInteger(state.clockMinute)
                  : stage?.interaction === 'elapsed_time_model'
                    ? Number.isInteger(state.elapsedMinutes)
                  : stage?.interaction === 'build_volume'
                    ? state.volumeRows > 0 && state.volumeColumns > 0 && state.volumeLayers > 0
        : stage?.interaction === 'geometry_exploration'
          ? stage.geometryMode === 'split_recompose'
            ? stage.pieces.some((piece) => JSON.stringify(state.geometryPieces[piece.id]) !== JSON.stringify({ row: piece.initialPosition.row, column: piece.initialPosition.column, rotation: piece.initialRotation ?? 0, flipped: piece.initialFlipped ?? false }))
            : Boolean(state.foldedNet && typeof state.geometryAdjacencyAnswer === 'boolean')
        : stage?.interaction === 'angle_exploration'
          ? stage.angleRules.mode === 'estimate' ? Number.isInteger(state.angleEstimate)
            : stage.angleRules.mode === 'measure' ? Number.isInteger(state.angleReading)
              : ['draw', 'align'].includes(stage.angleRules.mode) ? Number.isInteger(state.angleDrawValue)
                : stage.angleRules.mode === 'identify' ? Boolean(state.angleSelectedOptionId)
                  : ['compare', 'right_angle'].includes(stage.angleRules.mode) ? Number.isInteger(stage.angleRules.mode === 'compare' ? state.angleComparisonAngleA : state.angleDrawValue) && Boolean(state.angleComparisonAnswer) && (stage.angleRules.mode !== 'compare' || Number.isInteger(state.angleComparisonAngleB))
                    : Boolean(state.angleRotationDirection && Number.isInteger(state.angleRotationDegrees))
        : stage?.interaction === 'construct_lines'
          ? state.linePoints.length === 2
        : stage?.interaction === 'manipulate_fraction_model'
          ? state.fractionDenominator !== null && Object.entries(state.fractionPieceLocations).some(([pieceId, groupId]) => stage.fractionRules.pieces.find(({ id }) => id === pieceId)?.initialGroupId !== groupId)
        : stage?.interaction === 'measure_length_model'
          ? stage.lengthRules.mode === 'estimate' ? Number.isInteger(state.lengthEstimate)
            : stage.lengthRules.mode === 'align_read' ? state.lengthRulerTouched && state.lengthReadingTouched.includes(stage.lengthRules.object.id) && Number.isInteger(state.lengthReadings[stage.lengthRules.object.id])
              : stage.lengthRules.mode === 'compare' ? stage.lengthRules.objects.every(({ id }) => state.lengthReadingTouched.includes(id) && Number.isInteger(state.lengthReadings[id])) && state.lengthReadingTouched.includes('__difference__') && Number.isInteger(state.lengthDifference) && (!Number.isInteger(stage.lengthRules.conversionTargetMillimeters) || (state.lengthConversionTouched && Number.isInteger(state.lengthCentimeters) && Number.isInteger(state.lengthRemainingMillimeters)))
                : stage.lengthRules.mode === 'convert' ? state.lengthConversionTouched && Number.isInteger(state.lengthCentimeters) && Number.isInteger(state.lengthRemainingMillimeters)
                  : false
        : stage?.interaction === 'build_area_grid'
          ? stage.areaGridRules.mode === 'estimate_cover'
            ? Number.isInteger(state.areaEstimate) && state.areaGridTouched.includes(stage.areaGridRules.boards[0].id)
            : stage.areaGridRules.mode === 'compare_regions'
              ? stage.areaGridRules.boards.every(({ id }) => state.areaGridTouched.includes(id)) && Boolean(state.areaRelation)
              : state.areaGridTouched.includes(stage.areaGridRules.boards[0].id)
        : stage?.interaction === 'build_weight_scale'
          ? stage.weightRules.mode === 'estimate' ? Number.isInteger(state.weightScale?.estimate)
            : stage.weightRules.mode === 'balance' ? state.weightScale?.balanceTouched
              : stage.weightRules.mode === 'read' ? state.weightScale?.readingTouched
                : stage.weightRules.mode === 'compare' ? stage.weightRules.items.every(({ id }) => state.weightScale?.compareTouched.includes(id)) && state.weightScale?.differenceTouched
                  : stage.weightRules.mode === 'convert' ? state.weightScale?.conversionTouched
                    : state.weightScale?.selectedItems.length > 0
        : stage?.interaction === 'build_capacity_model'
          ? stage.capacityRules.mode === 'estimate' ? Number.isInteger(state.capacityModel?.estimateMl)
            : stage.capacityRules.mode === 'fill' ? state.capacityModel?.touched
              : stage.capacityRules.mode === 'read' ? state.capacityModel?.touched && state.capacityModel?.volumeMl === stage.capacityRules.targetMl && state.capacityModel?.readingTouched
                : stage.capacityRules.mode === 'compare' ? stage.capacityRules.containers.every(({ id }) => state.capacityModel?.compareTouched.includes(id)) && Boolean(state.capacityModel?.relation)
                  : stage.capacityRules.mode === 'difference' ? state.capacityModel?.touched && Number.isInteger(state.capacityModel?.differenceMl)
                    : state.capacityModel?.touched && state.capacityModel?.selectedItems.length > 0
        : stage?.interaction === 'magnet_interaction'
          ? stage.magnetRules.mode === 'poles' ? state.magnetModel?.touched
            : stage.magnetRules.mode === 'materials' ? stage.magnetRules.materials.every(({ id }) => state.magnetModel?.testedObjectIds.includes(id) && state.magnetModel.assignments[id])
              : stage.magnetRules.magnets.every(({ id }) => state.magnetModel?.testedMagnetIds.includes(id)) && Boolean(state.magnetModel?.selectedStrongerMagnetId)
        : state.selection.length > 0;
    if (state.phase !== 'active' || !hasResponse) return { session, changed: false, error: 'response_required' };
    const submissionId = payload.submissionId ?? `${state.sessionId}:submission:${state.attempts.length + 1}`;
    if (state.usedSubmissionIds.includes(submissionId)) return { session, changed: false, error: 'duplicate_submission' };
    const interaction = stage.interaction;
    const response = ['classify_observations', 'build_frequency_table'].includes(interaction)
      ? stage.collectionRules
        ? { assignments: { ...state.assignments }, collectedObservationIds: [...state.collectedObservationIds] }
        : { ...state.assignments }
      : interaction === 'complete_symmetry_grid'
        ? [...state.symmetryCells]
        : interaction === 'plot_line_chart'
          ? { ...state.lineChartValues }
          : interaction === 'build_bar_chart'
            ? { ...state.barChartValues }
            : interaction === 'construct_triangle'
              ? [...state.triangleVertices]
              : interaction === 'construct_quadrilateral'
                ? [...state.quadrilateralVertices]
      : interaction === 'build_array'
        ? { rows: state.arrayRows, columns: state.arrayColumns, product: state.arrayRows * state.arrayColumns }
        : interaction === 'build_unknown_quantity_model'
          ? { value: state.unknownQuantityValue, mode: stage.unknownQuantityRules.mode }
        : interaction === 'place_number_line_marker'
          ? state.numberLineTick
          : interaction === 'complete_calculation_steps'
            ? { ...state.calculationValues }
            : interaction === 'operate_vertical_calculation'
              ? { ...state.verticalCalculationValues }
              : interaction === 'build_place_value_blocks'
                ? { blocks: { ...state.placeValueBlocks }, exchangeCount: state.placeValueExchangeCount,
                    representedValue: Object.entries(state.placeValueBlocks).reduce((sum, [place, count]) => sum + placeValueWeights[place] * count, 0) }
            : interaction === 'adjust_decimal_place_value'
              ? state.decimalHundredths
            : interaction === 'adjust_circle_radius'
              ? state.circleRadius
            : interaction === 'set_estimate_range'
              ? state.estimateValue
            : interaction === 'set_clock_time'
              ? { hour: state.clockHour, minute: state.clockMinute }
            : interaction === 'elapsed_time_model'
              ? state.elapsedMinutes
            : interaction === 'build_volume'
              ? { rows: state.volumeRows, columns: state.volumeColumns, layers: state.volumeLayers, cubes: state.volumeRows * state.volumeColumns * state.volumeLayers }
          : interaction === 'order_items'
            ? [...state.orderedItems]
          : interaction === 'geometry_exploration'
            ? stage.geometryMode === 'split_recompose'
              ? { ...state.geometryPieces }
              : { netId: state.selectedNetId, foldValid: state.foldedNet?.valid, queriedFaceIds: stage.queriedFaceIds, adjacent: state.geometryAdjacencyAnswer, foldedFaces: state.foldedNet?.faces ?? [] }
          : interaction === 'angle_exploration'
            ? stage.angleRules.mode === 'estimate' ? state.angleEstimate
              : stage.angleRules.mode === 'measure' ? { centerOffset: state.angleCenterOffset, baselineOffset: state.angleBaselineOffset, baselineSide: state.angleBaselineSide, reading: state.angleReading }
                : ['draw', 'align'].includes(stage.angleRules.mode) ? state.angleDrawValue
                  : stage.angleRules.mode === 'identify' ? state.angleSelectedOptionId
                    : stage.angleRules.mode === 'compare' ? { angleA: state.angleComparisonAngleA, angleB: state.angleComparisonAngleB, relation: state.angleComparisonAnswer }
                      : stage.angleRules.mode === 'right_angle' ? { degrees: state.angleDrawValue, referenceDegrees: stage.angleRules.referenceDegrees ?? 90, relation: state.angleComparisonAnswer }
                  : { direction: state.angleRotationDirection, degrees: state.angleRotationDegrees }
          : interaction === 'construct_lines'
            ? [...state.linePoints]
          : interaction === 'manipulate_fraction_model'
            ? fractionModelResponse(state, stage)
          : interaction === 'measure_length_model'
            ? stage.lengthRules.mode === 'estimate' ? state.lengthEstimate
              : stage.lengthRules.mode === 'align_read' ? { rulerZero: state.lengthRulerZero, reading: state.lengthReadings[stage.lengthRules.object.id] }
                : stage.lengthRules.mode === 'compare' ? { readings: { ...state.lengthReadings }, difference: state.lengthDifference, centimeters: state.lengthCentimeters, millimeters: state.lengthRemainingMillimeters }
                  : { centimeters: state.lengthCentimeters, millimeters: state.lengthRemainingMillimeters }
          : interaction === 'build_area_grid'
            ? areaGridResponse(state)
          : interaction === 'build_weight_scale'
            ? weightScaleResponse(state, stage)
              : interaction === 'build_capacity_model'
            ? capacityModelResponse(state, stage)
          : interaction === 'magnet_interaction'
            ? magnetModelResponse(state, stage)
          : interaction === 'compose_pattern' && stage.patternRules.mode === 'number_builder'
            ? { start: state.patternStartValue, increment: state.patternIncrement, terms: [...state.patternSequenceEntries] }
          : [...state.selection];
    let correct = false;
    if (interaction === 'classify_observations' || interaction === 'build_frequency_table') {
      const expected = stage.correctAssignments;
      const assignments = response.assignments ?? response;
      if (interaction === 'classify_observations' && stage.distributionBoard?.targetCounts) {
        const counts = Object.fromEntries(stage.categories.map(({ id }) => [id, 0]));
        for (const categoryId of Object.values(assignments)) counts[categoryId] += 1;
        correct = stage.categories.every(({ id }) => counts[id] === stage.distributionBoard.targetCounts[id]);
      } else correct = stage.observations.every(({ id }) => assignments[id] === expected[id])
        && (!stage.collectionRules || stage.collectionRules.requiredObservationIds.length === response.collectedObservationIds.length
          && stage.collectionRules.requiredObservationIds.every((id) => response.collectedObservationIds.includes(id)));
    } else if (interaction === 'complete_symmetry_grid') {
      const expected = [...stage.symmetryRules.targetCellIds].sort();
      const actual = [...response].sort();
      correct = expected.length === actual.length && expected.every((id, index) => id === actual[index]);
    } else if (interaction === 'plot_line_chart') {
      correct = stage.plotRules.points.every(({ id, value }) => response[id] === value);
    } else if (interaction === 'build_bar_chart') {
      correct = stage.barChartRules.categories.every(({ id, value }) => response[id] === value);
    } else if (interaction === 'construct_triangle') {
      const points = response.map((id) => { const [, row, column] = /^r(\d+)c(\d+)$/.exec(id) ?? []; return { x: Number(column), y: Number(row) }; });
      const [a, b, c] = points;
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross !== 0) {
        const sides = [
          (a.x-b.x)**2+(a.y-b.y)**2,
          (a.x-c.x)**2+(a.y-c.y)**2,
          (b.x-c.x)**2+(b.y-c.y)**2,
        ].sort((left, right) => left - right);
        const kind = stage.triangleRules.targetKind === 'isosceles'
          ? (sides[0] === sides[1] || sides[1] === sides[2] ? 'isosceles' : 'not-isosceles')
          : sides[2] === sides[0] + sides[1] ? 'right'
            : sides[2] < sides[0] + sides[1] ? 'acute' : 'obtuse';
        correct = kind === stage.triangleRules.targetKind;
      }
    } else if (interaction === 'construct_quadrilateral') {
      correct = quadrilateralConstructionMatches(stage, response);
    } else if (interaction === 'compose_pattern') {
      const rules = stage.patternRules;
      if (rules.mode === 'number_builder') {
        const expectedTerms = Array.from({ length: rules.termCount }, (_, index) => state.patternStartValue + state.patternIncrement * index);
        correct = state.patternStartValue === rules.targetStart && state.patternIncrement === rules.targetIncrement
          && JSON.stringify(state.patternSequenceEntries) === JSON.stringify(expectedTerms);
        if (!correct) {
          const wrongIndex = state.patternSequenceEntries.findIndex((value, index) => value !== expectedTerms[index]);
          state.patternErrorFeedback = state.patternStartValue !== rules.targetStart
            ? '起始數和題目給的數量不一致；先調整第一個數。'
            : state.patternIncrement !== rules.targetIncrement
              ? '固定增加量還不符合已知相鄰數；重新比較相鄰兩項。'
              : `第 ${wrongIndex + 1} 項不符合每次增加 ${state.patternIncrement} 的規則，請由前一項再加一次。`;
        }
      } else if (rules.mode === 'repair') {
        correct = state.patternRepairIndex === rules.errorIndex && JSON.stringify(state.selection) === JSON.stringify(rules.targetPattern);
      } else if (rules.mode === 'repeat_unit_builder') {
        const unitLength = rules.unitLength ?? 2;
        correct = state.selection.length === rules.beatCount
          && state.selection.every((id, index) => index < unitLength || id === state.selection[index % unitLength])
          && new Set(state.selection.slice(0, unitLength)).size >= (rules.minDistinctTokens ?? 2);
      } else {
        const counts = Object.fromEntries(stage.tokens.map(({ id }) => [id, state.selection.filter((entry) => entry === id).length]));
        const used = Object.values(counts).filter((count) => count > 0);
        correct = state.selection.length === rules.beatCount
          && used.length >= rules.minDistinctTokens
          && used.some((count) => count >= rules.minRepeatedTokenCount);
        if (correct && rules.targetPattern) correct = JSON.stringify(state.selection) === JSON.stringify(rules.targetPattern);
        if (correct && rules.mustDifferFromPrevious) {
          const previousPattern = [...state.attempts].reverse().find((attempt) => attempt.interaction === 'compose_pattern' && attempt.result === 'correct')?.response;
          correct = Array.isArray(previousPattern) && JSON.stringify(previousPattern) !== JSON.stringify(state.selection);
        }
      }
    } else if (interaction === 'build_array') {
      correct = response.rows === stage.arrayRules.targetRows
        && response.columns === stage.arrayRules.targetColumns
        && response.product === stage.arrayRules.targetRows * stage.arrayRules.targetColumns;
    } else if (interaction === 'build_unknown_quantity_model') {
      correct = response.value === stage.unknownQuantityRules.targetValue;
    } else if (interaction === 'place_number_line_marker') {
      correct = response === stage.numberLine.targetTick;
    } else if (interaction === 'compose_shape') {
      const expected = new Set(stage.shapeRules.correctPieceIds);
      correct = response.length === expected.size && new Set(response).size === response.length && response.every((id) => expected.has(id));
      if (correct && stage.shapeRules.correctPieceOrder) {
        correct = response.length === stage.shapeRules.correctPieceOrder.length
          && response.every((id, index) => id === stage.shapeRules.correctPieceOrder[index]);
      }
    } else if (interaction === 'complete_calculation_steps') {
      const wrongStep = stage.calculationSteps.find(({ id, expectedValue }) => response[id] !== expectedValue);
      correct = !wrongStep;
      if (wrongStep) state.calculationErrorFeedback = wrongStep.incorrectFeedback;
    } else if (interaction === 'operate_vertical_calculation') {
      const wrongStep = stage.calculationSteps.find(({ id, expectedValue }) => response[id] !== expectedValue);
      correct = !wrongStep;
      if (wrongStep) state.verticalErrorFeedback = wrongStep.incorrectFeedback;
    } else if (interaction === 'build_place_value_blocks') {
      const rules = stage.placeValueRules;
      const representedValue = Object.entries(response.blocks).reduce((sum, [place, count]) => sum + placeValueWeights[place] * count, 0);
      correct = representedValue === rules.targetValue
        && Object.keys(rules.targetCounts).every((place) => response.blocks[place] === rules.targetCounts[place])
        && response.exchangeCount === rules.requiredExchangeCount;
    } else if (interaction === 'adjust_decimal_place_value') {
      correct = response === stage.decimalRules.targetHundredths;
    } else if (interaction === 'adjust_circle_radius') {
      correct = response === stage.circleRules.targetRadius;
    } else if (interaction === 'set_estimate_range') {
      correct = response >= stage.estimateRules.acceptableRange.min && response <= stage.estimateRules.acceptableRange.max;
    } else if (interaction === 'set_clock_time') {
      correct = response.hour === stage.clockRules.targetHour && response.minute === stage.clockRules.targetMinute;
    } else if (interaction === 'elapsed_time_model') {
      correct = response === stage.elapsedRules.targetMinutes;
    } else if (interaction === 'build_volume') {
      correct = response.rows === stage.volumeRules.target.rows
        && response.columns === stage.volumeRules.target.columns
        && response.layers === stage.volumeRules.target.layers;
    } else if (interaction === 'order_items') {
      correct = response.length === stage.correctItemIds.length && response.every((id, index) => id === stage.correctItemIds[index]);
    } else if (interaction === 'geometry_exploration') {
      if (stage.geometryMode === 'split_recompose') correct = geometryCompositionMatches(stage, response);
      else {
        const fold = foldCubeNet(stage.netCandidates.find(({ id }) => id === response.netId)?.faces ?? []);
        const relation = fold.valid && areFoldedFacesAdjacent(fold, ...response.queriedFaceIds);
        correct = fold.valid && response.foldValid && relation === response.adjacent;
      }
    } else if (interaction === 'angle_exploration') {
      const rules = stage.angleRules;
      if (rules.mode === 'estimate') correct = Math.abs(response - rules.targetDegrees) <= rules.tolerance;
      else if (rules.mode === 'measure') correct = response.centerOffset === 0 && response.baselineOffset === 0
        && response.baselineSide === rules.expectedSide && response.reading === rules.targetDegrees;
      else if (rules.mode === 'identify') correct = response === rules.correctOptionId;
      else if (rules.mode === 'compare') {
        const relation = response.angleA > response.angleB ? 'greater' : response.angleA < response.angleB ? 'less' : 'equal';
        correct = relation === response.relation && relation === rules.expectedRelation
          && response.angleA === rules.targetAngleA && response.angleB === rules.targetAngleB;
      } else if (rules.mode === 'right_angle') {
        const angle = response.degrees; const reference = response.referenceDegrees;
        const relation = angle > reference ? 'greater' : angle < reference ? 'less' : 'equal';
        correct = relation === response.relation && relation === rules.expectedRelation && angle === rules.targetDegrees;
      } else if (['draw', 'align'].includes(rules.mode)) correct = Math.abs(response - rules.targetDegrees) <= rules.tolerance;
      else correct = response.direction === rules.expectedDirection && response.degrees === rules.targetDegrees;
    } else if (interaction === 'construct_lines') {
      correct = lineConstructionMatches(stage, response);
    } else if (interaction === 'manipulate_fraction_model') {
      correct = fractionModelMatches(stage, response);
    } else if (interaction === 'measure_length_model') {
      const rules = stage.lengthRules;
      if (rules.mode === 'estimate') correct = Math.abs(response - rules.targetLength) <= rules.tolerance;
      else if (rules.mode === 'align_read') correct = response.rulerZero === rules.object.start && response.reading === rules.object.length;
      else if (rules.mode === 'compare') correct = rules.objects.every(({ id, length }) => response.readings[id] === length)
        && response.difference === Math.abs(rules.objects[0].length - rules.objects[1].length)
        && (!Number.isInteger(rules.conversionTargetMillimeters) || response.centimeters * 10 + response.millimeters === rules.conversionTargetMillimeters);
      else if (rules.mode === 'convert') correct = response.centimeters * 10 + response.millimeters === rules.targetMillimeters;
    } else if (interaction === 'build_area_grid') {
      correct = areaGridMatches(stage, response);
    } else if (interaction === 'build_weight_scale') {
      const rules = stage.weightRules;
      if (rules.mode === 'estimate') correct = response >= rules.acceptable.min && response <= rules.acceptable.max;
      else if (rules.mode === 'balance') correct = response.leftGrams === response.rightGrams;
      else if (rules.mode === 'read') correct = response === rules.targetGrams;
      else if (rules.mode === 'compare') {
        const left = response.readings.left; const right = response.readings.right;
        const relation = left > right ? '>' : left < right ? '<' : '=';
        correct = rules.items.every(({ id, actualGrams }) => response.readings[id] === actualGrams)
          && response.relation === relation && response.relation === rules.targetRelation
          && response.difference === Math.abs(left - right) && response.difference === rules.targetDifference;
      } else if (rules.mode === 'convert') correct = response.totalGrams === rules.targetGrams && response.grams < 1000;
      else correct = response.totalGrams === rules.targetGrams;
    } else if (interaction === 'build_capacity_model') {
      const rules = stage.capacityRules;
      if (rules.mode === 'estimate') correct = response >= rules.acceptable.min && response <= rules.acceptable.max;
      else if (rules.mode === 'fill') correct = response.volumeMl === rules.targetMl && response.remainingMl === rules.containerCapacityMl - rules.targetMl;
      else if (rules.mode === 'read') correct = response.volumeMl === rules.targetMl && response.readingMl === rules.targetMl;
      else if (rules.mode === 'compare') {
        const values = rules.containers.map(({ id }) => response.volumes[id]);
        const relation = values[0] > values[1] ? '>' : values[0] < values[1] ? '<' : '=';
        correct = rules.containers.every(({ id, capacityMl }) => response.volumes[id] === capacityMl) && response.relation === relation && relation === rules.relation;
      } else if (rules.mode === 'difference') correct = response.volumeMl === rules.targetMl && response.differenceMl === rules.expectedDifferenceMl;
      else correct = response.totalMl === rules.targetMl && response.remainingMl >= 0;
    } else if (interaction === 'magnet_interaction') {
      const rules = stage.magnetRules;
      if (rules.mode === 'poles') correct = response.facingPole === rules.targetFacingPole && response.relation === 'attract';
      else if (rules.mode === 'materials') correct = rules.materials.every(({ id, attracted }) => response.testedObjectIds.includes(id)
        && response.assignments[id] === (attracted ? 'attracted' : 'not-attracted'));
      else correct = rules.magnets.every(({ id }) => response.testedMagnetIds.includes(id))
        && response.selectedStrongerMagnetId === rules.targetStrongerMagnetId;
    } else {
      if (stage.deriveFromPrevious) {
        const option = stage.options.find(({ id }) => response.includes(id));
        const operand = stage.deriveFromPrevious.operand;
        const expectedValue = stage.deriveFromPrevious.operation === 'divide'
          ? state.previousStepResult / operand
          : stage.deriveFromPrevious.operation === 'add'
            ? state.previousStepResult + operand
            : stage.deriveFromPrevious.operation === 'subtract'
              ? state.previousStepResult - operand
              : state.previousStepResult * operand;
        correct = option?.value === expectedValue;
      } else if (interaction === 'assemble_response') correct = response.length === stage.correctOptionIds.length && response.every((id, index) => id === stage.correctOptionIds[index]);
      else {
        const expected = [...stage.correctOptionIds];
        const sortedResponse = [...response].sort();
        const sortedExpected = expected.sort();
        correct = sortedResponse.length === sortedExpected.length && sortedResponse.every((id, index) => id === sortedExpected[index]);
        if (!correct && Array.isArray(stage.acceptedOptionSets)) {
          correct = stage.acceptedOptionSets.some((accepted) => {
            const sortedAccepted = [...accepted].sort();
            return sortedResponse.length === sortedAccepted.length && sortedResponse.every((id, index) => id === sortedAccepted[index]);
          });
        }
      }
    }
    const attempt = {
      eventId: `${state.sessionId}:event:${state.attempts.length + 1}`,
      submissionId,
      activityId: state.activityId,
      stageId: stage.stageId,
      attemptNumber: state.attempts.filter(({ stageId }) => stageId === stage.stageId).length + 1,
      response,
      interaction,
      result: correct ? 'correct' : 'incorrect',
      hintUsed: state.hintLevel > 0,
    };
    state.usedSubmissionIds.push(submissionId);
    state.attempts.push(attempt);
    const optionFeedback = ['classify_observations', 'build_frequency_table', 'compose_pattern', 'build_array', 'build_unknown_quantity_model', 'place_number_line_marker', 'compose_shape', 'complete_calculation_steps', 'operate_vertical_calculation', 'build_place_value_blocks', 'adjust_decimal_place_value', 'adjust_circle_radius', 'set_estimate_range', 'set_clock_time', 'elapsed_time_model', 'build_volume', 'order_items', 'complete_symmetry_grid', 'plot_line_chart', 'build_bar_chart', 'construct_triangle', 'construct_quadrilateral', 'geometry_exploration', 'angle_exploration', 'construct_lines', 'manipulate_fraction_model', 'measure_length_model', 'build_area_grid', 'build_weight_scale', 'build_capacity_model', 'magnet_interaction'].includes(interaction)
      ? []
      : response.filter((id) => !(stage.correctOptionIds ?? []).includes(id))
        .map((id) => (stage.options ?? stage.tokens).find((option) => option.id === id)?.feedback)
        .filter(Boolean);
    const unknownRules = stage?.unknownQuantityRules;
    const unknownFeedback = interaction === 'build_unknown_quantity_model' && !correct
      ? unknownRules.mode === 'missing_addend'
        ? '先看總數，再扣掉已知的一組；目前補上的個數還沒有讓兩部分合成題目總數。'
        : unknownRules.mode === 'missing_minuend'
          ? '被減數是減法開始前的整體。把拿走的數和剩下的數合起來檢查整體。'
          : unknownRules.mode === 'missing_subtrahend'
            ? '減數是拿走的數，不是剩下的數。看整體減去目前拿走的數後還剩多少。'
            : '用加法把已知部分和你補上的部分合起來，檢查是否回到原來的總數。'
      : null;
    state.lastFeedback = {
      correct,
      text: correct
        ? interaction === 'compose_pattern' && stage.patternRules.mode === 'number_builder'
          ? patternRuleVerificationText(stage, state)
          : interaction === 'compose_pattern' && stage.patternRules.mode === 'repeat_unit_builder'
            ? patternRuleVerificationText(stage, state)
            : interaction === 'compose_pattern' && stage.patternRules.mode === 'repair'
              ? `你找出第 ${stage.patternRules.errorIndex + 1} 格並修正了它；逐格比對後，排列符合重複規則。`
        : interaction === 'build_capacity_model' && stage.capacityRules.mode === 'estimate'
          ? `你的估量是 ${response} 毫升；模擬情境結果是 ${stage.capacityRules.targetMl} 毫升，差 ${Math.abs(response - stage.capacityRules.targetMl)} 毫升。`
          : stage.correctFeedback
        : (unknownFeedback || (interaction === 'compose_pattern' && state.patternErrorFeedback ? state.patternErrorFeedback : interaction === 'manipulate_fraction_model' ? fractionModelError(stage, response) : interaction === 'measure_length_model' ? (stage.lengthRules.mode === 'align_read' && response.rulerZero !== stage.lengthRules.object.start ? '尺的 0 刻度還沒有和物件起點對齊；先移動尺，再讀終點。' : stage.lengthRules.mode === 'compare' && response.difference !== Math.abs(stage.lengthRules.objects[0].length - stage.lengthRules.objects[1].length) ? '兩個讀值已記下，請再算較長與較短相差幾毫米。' : stage.incorrectFeedback) : interaction === 'build_area_grid' ? areaGridError(stage, response) : interaction === 'build_weight_scale' ? weightScaleError(stage, response) : interaction === 'build_capacity_model' ? capacityModelError(stage, response) : interaction === 'magnet_interaction' ? magnetModelError(stage, response) : state.calculationErrorFeedback || state.verticalErrorFeedback || optionFeedback.join(' ') || stage.incorrectFeedback)),
    };
    delete state.calculationErrorFeedback;
    delete state.verticalErrorFeedback;
    delete state.patternErrorFeedback;
    state.phase = correct ? 'success' : 'feedback';
    if (correct) {
      state.selection = [];
      state.assignments = {};
      state.linePoints = [];
    }
    return { session: state, changed: true, attempt };
  }
  if (action === 'retry') {
    if (state.phase !== 'feedback') return { session, changed: false };
    state.phase = 'active';
    state.lastFeedback = null;
    state.selection = [];
    state.patternStartValue = null;
    state.patternIncrement = null;
    state.patternSequenceEntries = [];
    state.patternRepairIndex = null;
    state.patternRepairTouched = false;
    if (stage?.interaction === 'compose_pattern') initializePatternStage(state, stage);
    state.assignments = {};
    state.collectedObservationIds = [];
    state.arrayRows = 0;
    state.arrayColumns = 0;
    state.numberLineTick = null;
    state.calculationValues = {};
    state.verticalCalculationValues = {};
    state.placeValueBlocks = {};
    state.placeValueExchangeCount = 0;
    state.placeValueTouched = false;
    state.decimalHundredths = stage?.interaction === 'adjust_decimal_place_value' ? stage.decimalRules.initialHundredths : null;
    state.circleRadius = null;
    state.estimateValue = null;
    state.clockHour = null;
    state.clockMinute = null;
    state.volumeRows = 0;
    state.volumeColumns = 0;
    state.volumeLayers = 0;
    state.symmetryCells = [];
    state.lineChartValues = {};
    state.barChartValues = {};
    state.barChartTouched = [];
    state.triangleVertices = [];
    state.quadrilateralVertices = [];
    state.linePoints = [];
    state.fractionDenominator = null;
    state.fractionSelectedWholeId = null;
    state.fractionSelectedModelId = null;
    state.fractionPieceLocations = {};
    state.fractionRelation = null;
    state.areaGridCells = {};
    state.areaGridTouched = [];
    state.areaEstimate = null;
    state.areaRelation = null;
    state.unknownQuantityValue = stage?.interaction === 'build_unknown_quantity_model' ? stage.unknownQuantityRules.initialValue : null;
    state.unknownQuantityTouched = false;
    state.orderedItems = stage?.interaction === 'order_items' ? [...stage.initialOrder] : [];
    if (stage?.interaction === 'geometry_exploration') initializeGeometryStage(state, stage);
    if (stage?.interaction === 'angle_exploration') initializeAngleStage(state, stage);
    if (stage?.interaction === 'build_place_value_blocks') initializePlaceValueStage(state, stage);
    if (stage?.interaction === 'operate_vertical_calculation') initializeVerticalCalculationStage(state, stage);
    if (stage?.interaction === 'manipulate_fraction_model') initializeFractionModelStage(state, stage);
    if (stage?.interaction === 'measure_length_model') initializeLengthMeasurementStage(state, stage);
    if (stage?.interaction === 'build_area_grid') initializeAreaGridStage(state, stage);
    if (stage?.interaction === 'build_weight_scale') initializeWeightScaleStage(state);
    if (stage?.interaction === 'build_capacity_model') initializeCapacityModelStage(state, stage);
    if (stage?.interaction === 'magnet_interaction') initializeMagnetStage(state, stage);
    if (stage?.interaction === 'build_frequency_table') initializeFrequencyTableStage(state, stage);
    if (stage?.interaction === 'set_clock_time') {
      state.clockHour = stage.clockRules.initialHour;
      state.clockMinute = stage.clockRules.initialMinute;
    }
    return { session: state, changed: true };
  }
  if (action === 'next') {
    if (state.phase !== 'success') return { session, changed: false };
    if (state.stageIndex >= activity.stages.length - 1) {
      state.phase = 'completed';
      state.completedAt = new Date().toISOString();
      return { session: state, changed: true };
    }
    state.stageIndex += 1;
    state.selection = [];
    state.assignments = {};
    state.collectedObservationIds = [];
    state.linePoints = [];
    state.arrayRows = 0;
    state.arrayColumns = 0;
    state.numberLineTick = null;
    state.calculationValues = {};
    state.verticalCalculationValues = {};
    state.placeValueBlocks = {};
    state.placeValueExchangeCount = 0;
    state.placeValueTouched = false;
    state.decimalHundredths = null;
    state.circleRadius = null;
    state.estimateValue = null;
    state.clockHour = null;
    state.clockMinute = null;
    state.volumeRows = 0;
    state.volumeColumns = 0;
    state.volumeLayers = 0;
    state.symmetryCells = [];
    state.lineChartValues = {};
    state.barChartValues = {};
    state.barChartTouched = [];
    state.triangleVertices = [];
    state.quadrilateralVertices = [];
    state.fractionDenominator = null;
    state.fractionSelectedWholeId = null;
    state.fractionSelectedModelId = null;
    state.fractionPieceLocations = {};
    state.fractionRelation = null;
    state.areaGridCells = {};
    state.areaGridTouched = [];
    state.areaEstimate = null;
    state.areaRelation = null;
    state.unknownQuantityValue = null;
    state.unknownQuantityTouched = false;
    const completedStage = activity.stages[state.stageIndex - 1];
    if (Number.isInteger(completedStage?.resultValue)) state.previousStepResult = completedStage.resultValue;
    state.hintLevel = 0;
    state.lastFeedback = null;
    const nextStage = activity.stages[state.stageIndex];
    if (nextStage?.interaction === 'compose_pattern') initializePatternStage(state, nextStage);
    if (nextStage?.interaction === 'set_clock_time') {
      state.clockHour = nextStage.clockRules.initialHour;
      state.clockMinute = nextStage.clockRules.initialMinute;
    }
    state.elapsedMinutes = nextStage?.interaction === 'elapsed_time_model' ? nextStage.elapsedRules.initialMinutes : null;
    state.orderedItems = nextStage?.interaction === 'order_items' ? [...nextStage.initialOrder] : [];
    if (nextStage?.interaction === 'geometry_exploration') initializeGeometryStage(state, nextStage);
    if (nextStage?.interaction === 'angle_exploration') initializeAngleStage(state, nextStage);
    if (nextStage?.interaction === 'build_place_value_blocks') initializePlaceValueStage(state, nextStage);
    if (nextStage?.interaction === 'operate_vertical_calculation') initializeVerticalCalculationStage(state, nextStage);
    if (nextStage?.interaction === 'manipulate_fraction_model') initializeFractionModelStage(state, nextStage);
    if (nextStage?.interaction === 'measure_length_model') initializeLengthMeasurementStage(state, nextStage);
    if (nextStage?.interaction === 'build_area_grid') initializeAreaGridStage(state, nextStage);
    if (nextStage?.interaction === 'build_weight_scale') initializeWeightScaleStage(state);
    if (nextStage?.interaction === 'build_capacity_model') initializeCapacityModelStage(state, nextStage);
    if (nextStage?.interaction === 'magnet_interaction') initializeMagnetStage(state, nextStage);
    if (nextStage?.interaction === 'build_frequency_table') initializeFrequencyTableStage(state, nextStage);
    if (nextStage?.interaction === 'build_unknown_quantity_model') state.unknownQuantityValue = nextStage.unknownQuantityRules.initialValue;
    if (nextStage?.interaction === 'adjust_decimal_place_value') state.decimalHundredths = nextStage.decimalRules.initialHundredths;
    state.phase = 'active';
    return { session: state, changed: true };
  }
  return { session, changed: false, error: 'unknown_task_action' };
}

export function validateLearningTask(activity) {
  const errors = [];
  if (!activity?.activityId || !activity?.revision || activity.status !== 'candidate_pending_teacher_review') errors.push('task_identity_or_candidate_status_invalid');
  if (!activity?.gradeId || !activity?.subjectId || !activity?.curriculumMapId || !activity?.sourceId) errors.push('curriculum_crosswalk_incomplete');
  if (!Array.isArray(activity?.stages) || activity.stages.length < 2) errors.push('task_needs_multiple_stages');
  const ids = new Set();
  for (const stage of activity?.stages ?? []) {
    if (!stage.stageId || ids.has(stage.stageId)) errors.push(`missing_or_duplicate_stage_id:${stage.stageId}`);
    ids.add(stage.stageId);
    if (stage.requiredSelectionCount !== undefined
      && (stage.interaction !== 'collect_evidence' || !Number.isInteger(stage.requiredSelectionCount) || stage.requiredSelectionCount < 1)) {
      errors.push(`invalid_required_selection_count:${stage.stageId}`);
    }
    for (const table of [stage.tableView, stage.crossTab].filter(Boolean)) {
      const rows = table.rows ?? [];
      const columns = table.columns ?? [];
      const rowIds = new Set(rows.map(({ id }) => id));
      const columnIds = new Set(columns.map(({ id }) => id));
      if (!table.rowHeader || !table.columnHeader || !rowIds.size || !columnIds.size
        || rowIds.size !== rows.length || columnIds.size !== columns.length) errors.push(`table_view_incomplete:${stage.stageId}`);
      if (stage.tableView && rows.some((row) => columns.some(({ id }) => !Number.isFinite(row.values?.[id])))) errors.push(`table_view_values_incomplete:${stage.stageId}`);
      if (stage.crossTab) {
        const categoryIds = new Set((stage.categories ?? []).map(({ id }) => id));
        for (const row of rows) for (const column of columns) {
          const categoryId = table.cellCategoryIds?.[`${row.id}|${column.id}`];
          if (!categoryId || !categoryIds.has(categoryId)) errors.push(`cross_tab_cell_category_missing:${stage.stageId}:${row.id}:${column.id}`);
        }
      }
    }
    if (!['collect_evidence', 'choose_response', 'assemble_response', 'classify_observations', 'build_frequency_table', 'compose_pattern', 'build_array', 'build_unknown_quantity_model', 'place_number_line_marker', 'compose_shape', 'complete_calculation_steps', 'build_place_value_blocks', 'operate_vertical_calculation', 'adjust_decimal_place_value', 'adjust_circle_radius', 'set_estimate_range', 'set_clock_time', 'elapsed_time_model', 'build_volume', 'order_items', 'complete_symmetry_grid', 'plot_line_chart', 'build_bar_chart', 'construct_triangle', 'construct_quadrilateral', 'geometry_exploration', 'angle_exploration', 'construct_lines', 'manipulate_fraction_model', 'measure_length_model', 'build_area_grid', 'build_weight_scale', 'build_capacity_model', 'magnet_interaction'].includes(stage.interaction)) errors.push(`unsupported_interaction:${stage.stageId}`);
    if (stage.interaction === 'build_unknown_quantity_model') {
      const rules = stage.unknownQuantityRules;
      if (!rules || !['missing_addend', 'missing_minuend', 'missing_subtrahend', 'inverse_check'].includes(rules.mode)
        || ![rules.min, rules.max, rules.initialValue, rules.targetValue].every(Number.isInteger)
        || rules.min < 0 || rules.min > rules.initialValue || rules.initialValue > rules.max || rules.targetValue < rules.min || rules.targetValue > rules.max
        || rules.max > 20 || !Number.isInteger(rules.knownValue) || rules.knownValue < 0 || rules.knownValue > 20
        || (rules.mode === 'missing_addend' && rules.knownValue + rules.targetValue !== rules.total)
        || (rules.mode === 'missing_minuend' && rules.targetValue - rules.knownValue !== rules.result)
        || (rules.mode === 'missing_subtrahend' && rules.total - rules.targetValue !== rules.result)
        || (rules.mode === 'inverse_check' && rules.knownValue + rules.targetValue !== rules.total)) errors.push(`unknown_quantity_rules_incomplete:${stage.stageId}`);
      if (!stage.hints || stage.hints.length < 2) errors.push(`unknown_quantity_hints_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'build_capacity_model') {
      const rules = stage.capacityRules;
      const modes = ['estimate', 'fill', 'read', 'compare', 'difference', 'supply'];
      if (!rules || !modes.includes(rules.mode) || !Number.isInteger(rules.containerCapacityMl) || rules.containerCapacityMl < 1) errors.push(`capacity_model_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'estimate' && (!Number.isInteger(rules.targetMl) || !rules.input || !rules.acceptable || rules.acceptable.min > rules.acceptable.max || rules.acceptable.min < rules.input.min || rules.acceptable.max > rules.input.max || !Number.isInteger(rules.input.step) || rules.input.step < 1)) errors.push(`capacity_estimate_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'fill' && (!Number.isInteger(rules.initialMl) || !Number.isInteger(rules.targetMl) || !Number.isInteger(rules.stepMl) || rules.stepMl < 1 || rules.initialMl < 0 || rules.initialMl > rules.containerCapacityMl || rules.targetMl < 0 || rules.targetMl > rules.containerCapacityMl || (rules.targetMl - rules.initialMl) % rules.stepMl !== 0)) errors.push(`capacity_fill_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'read' && (!Number.isInteger(rules.initialMl) || rules.initialMl < 0 || rules.initialMl > rules.containerCapacityMl || !Number.isInteger(rules.targetMl) || rules.targetMl < 0 || rules.targetMl > rules.containerCapacityMl || !Number.isInteger(rules.stepMl) || rules.stepMl < 1 || (rules.targetMl - rules.initialMl) % rules.stepMl !== 0 || !Number.isInteger(rules.readingStepMl) || rules.readingStepMl < 1 || rules.targetMl % rules.readingStepMl !== 0)) errors.push(`capacity_read_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'compare' && (!Array.isArray(rules.containers) || rules.containers.length !== 2 || rules.containers.some(({ id, capacityMl }) => !id || !Number.isInteger(capacityMl) || capacityMl < 0 || capacityMl > rules.containerCapacityMl) || !['<', '=', '>'].includes(rules.relation) || !Number.isInteger(rules.stepMl) || rules.stepMl < 1 || rules.containers.some(({ capacityMl }) => capacityMl % rules.stepMl !== 0))) errors.push(`capacity_compare_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'difference' && (!Number.isInteger(rules.initialMl) || !Number.isInteger(rules.targetMl) || rules.initialMl < 0 || rules.initialMl > rules.containerCapacityMl || rules.targetMl < 0 || rules.targetMl > rules.containerCapacityMl || !Number.isInteger(rules.stepMl) || rules.stepMl < 1 || !Number.isInteger(rules.answerStepMl) || rules.answerStepMl < 1 || !Number.isInteger(rules.expectedDifferenceMl) || Math.abs(rules.initialMl - rules.targetMl) !== rules.expectedDifferenceMl || rules.expectedDifferenceMl % rules.answerStepMl !== 0)) errors.push(`capacity_difference_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'supply' && (!Number.isInteger(rules.targetMl) || rules.targetMl < 0 || rules.targetMl > rules.containerCapacityMl || !Array.isArray(rules.items) || rules.items.length < 2 || new Set(rules.items.map(({ id }) => id)).size !== rules.items.length || rules.items.some(({ id, volumeMl }) => !id || !Number.isInteger(volumeMl) || volumeMl < 0) || !rules.items.some((item, i) => rules.items.some((other, j) => i < j && item.volumeMl + other.volumeMl === rules.targetMl)))) errors.push(`capacity_supply_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'build_weight_scale') {
      const rules = stage.weightRules;
      const modes = ['estimate', 'balance', 'read', 'compare', 'convert', 'supply'];
      if (!rules || !modes.includes(rules.mode)) errors.push(`weight_scale_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'estimate' && (!Number.isInteger(rules.targetGrams) || !rules.input || !rules.acceptable || rules.acceptable.min > rules.acceptable.max || rules.acceptable.min < rules.input.min || rules.acceptable.max > rules.input.max)) errors.push(`weight_estimate_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'balance' && (!Number.isInteger(rules.left?.fixedGrams) || !Number.isInteger(rules.right?.fixedGrams) || !Number.isInteger(rules.counterweightGrams) || rules.counterweightGrams < 1 || !Number.isInteger(rules.maxCounterweights) || rules.maxCounterweights < 1 || !Number.isInteger(rules.targetCounterweights) || rules.targetCounterweights < 0 || rules.targetCounterweights > rules.maxCounterweights || rules.left.fixedGrams !== rules.right.fixedGrams + rules.targetCounterweights * rules.counterweightGrams)) errors.push(`weight_balance_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'read' && (!Number.isInteger(rules.targetGrams) || !rules.input || rules.targetGrams < rules.input.min || rules.targetGrams > rules.input.max || !Number.isInteger(rules.input.step) || rules.input.step < 1)) errors.push(`weight_read_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'compare' && (!Array.isArray(rules.items) || rules.items.length !== 2 || rules.items.some(({ id, actualGrams }) => !id || !Number.isInteger(actualGrams) || actualGrams < 0) || !['<', '=', '>'].includes(rules.targetRelation) || rules.targetDifference !== Math.abs(rules.items[0]?.actualGrams - rules.items[1]?.actualGrams))) errors.push(`weight_compare_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'convert' && (!Number.isInteger(rules.targetGrams) || !rules.kilograms || !rules.grams || rules.kilograms.max > 9 || rules.grams.min !== 0 || rules.grams.max !== 999)) errors.push(`weight_conversion_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'supply' && (!Number.isInteger(rules.targetGrams) || !Array.isArray(rules.items) || rules.items.length < 2 || new Set(rules.items.map(({ id }) => id)).size !== rules.items.length || rules.items.some(({ id, grams }) => !id || !Number.isInteger(grams) || grams < 0) || !rules.items.some((item, i) => rules.items.some((other, j) => i < j && item.grams + other.grams === rules.targetGrams)))) errors.push(`weight_supply_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'magnet_interaction') {
      const rules = stage.magnetRules;
      if (!rules || !['poles', 'materials', 'strength'].includes(rules.mode) || !Array.isArray(stage.hints) || stage.hints.length < 2) errors.push(`magnet_rules_or_hints_incomplete:${stage.stageId}`);
      else if (rules.mode === 'poles' && (!['N', 'S'].includes(rules.fixedPole) || !['N', 'S'].includes(rules.initialFacingPole) || !['N', 'S'].includes(rules.targetFacingPole) || rules.fixedPole === rules.targetFacingPole || rules.initialFacingPole === rules.targetFacingPole)) errors.push(`magnet_pole_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'materials' && (!Array.isArray(rules.materials) || rules.materials.length < 2 || new Set(rules.materials.map(({ id }) => id)).size !== rules.materials.length || rules.materials.some(({ id, attracted }) => !id || typeof attracted !== 'boolean') || !rules.materials.some(({ attracted }) => attracted) || !rules.materials.some(({ attracted }) => !attracted) || !Array.isArray(rules.categories) || !rules.categories.some(({ id }) => id === 'attracted') || !rules.categories.some(({ id }) => id === 'not-attracted'))) errors.push(`magnet_material_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'strength' && (!Array.isArray(rules.magnets) || rules.magnets.length !== 2 || new Set(rules.magnets.map(({ id }) => id)).size !== 2 || rules.magnets.some(({ id, liftedIronPieces }) => !id || !Number.isInteger(liftedIronPieces) || liftedIronPieces < 0) || new Set(rules.magnets.map(({ liftedIronPieces }) => liftedIronPieces)).size < 2 || !rules.magnets.some(({ id }) => id === rules.targetStrongerMagnetId) || rules.magnets.find(({ id }) => id === rules.targetStrongerMagnetId)?.liftedIronPieces !== Math.max(...rules.magnets.map(({ liftedIronPieces }) => liftedIronPieces)))) errors.push(`magnet_strength_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'measure_length_model') {
      const rules = stage.lengthRules;
      const validLength = (value) => Number.isInteger(value) && value >= 0;
      if (!rules || !['estimate', 'align_read', 'compare', 'convert'].includes(rules.mode)) errors.push(`length_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'estimate' && (!validLength(rules.targetLength) || !Number.isInteger(rules.tolerance) || rules.tolerance < 0 || !Number.isInteger(rules.estimateRange?.min) || !Number.isInteger(rules.estimateRange?.max) || rules.estimateRange.min > rules.targetLength - rules.tolerance || rules.estimateRange.max < rules.targetLength + rules.tolerance)) errors.push(`length_estimate_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'align_read' && (!rules.object?.id || !validLength(rules.object.start) || !validLength(rules.object.length) || !validLength(rules.initialRulerZero) || !Number.isInteger(rules.rulerZeroRange?.min) || !Number.isInteger(rules.rulerZeroRange?.max) || rules.rulerZeroRange.min > rules.object.start || rules.rulerZeroRange.max < rules.object.start || !Number.isInteger(rules.maxReading) || rules.maxReading < rules.object.length)) errors.push(`length_alignment_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'compare' && (!Array.isArray(rules.objects) || rules.objects.length !== 2 || rules.objects.some(({ id, length }) => !id || !validLength(length)) || !Number.isInteger(rules.maxReading) || rules.maxReading < Math.max(...rules.objects.map(({ length }) => length)) || (Number.isInteger(rules.conversionTargetMillimeters) && (!Number.isInteger(rules.maxCentimeters) || rules.maxCentimeters < Math.floor(rules.conversionTargetMillimeters / 10))))) errors.push(`length_comparison_rules_incomplete:${stage.stageId}`);
      else if (rules.mode === 'convert' && (!validLength(rules.targetMillimeters) || !Number.isInteger(rules.maxCentimeters) || rules.maxCentimeters < Math.floor(rules.targetMillimeters / 10))) errors.push(`length_conversion_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'build_area_grid') {
      const rules = stage.areaGridRules;
      const modes = ['estimate_cover', 'cover_outline', 'same_area_different_shape', 'complete_missing_cells', 'compare_regions', 'constrained_build'];
      const cellSetIsValid = (values, board) => Array.isArray(values)
        && new Set(values).size === values.length
        && values.every((id) => {
          const match = /^r(\d+)c(\d+)$/.exec(id);
          return match && Number(match[1]) < board.rows && Number(match[2]) < board.columns;
        });
      const validBoards = Array.isArray(rules?.boards) && rules.boards.length > 0
        && new Set(rules.boards.map(({ id }) => id)).size === rules.boards.length
        && rules.boards.every((board) => board.id && Number.isInteger(board.rows) && board.rows > 0
          && Number.isInteger(board.columns) && board.columns > 0
          && cellSetIsValid(board.initialCells ?? [], board)
          && cellSetIsValid(board.targetCells ?? [], board)
          && cellSetIsValid(board.referenceCells ?? [], board));
      if (!rules || !modes.includes(rules.mode) || !validBoards) errors.push(`area_grid_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'estimate_cover' && (!Number.isInteger(rules.estimate?.min) || !Number.isInteger(rules.estimate?.max)
        || rules.estimate.min < 0 || rules.estimate.max < rules.estimate.min || !Number.isInteger(rules.estimate.tolerance)
        || rules.estimate.tolerance < 0 || rules.boards?.length !== 1 || !rules.boards[0]?.targetCells?.length)) errors.push(`area_estimate_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'same_area_different_shape' && (!Number.isInteger(rules.targetArea) || rules.targetArea < 1
        || rules.boards?.length !== 1 || !rules.boards[0]?.referenceCells?.length)) errors.push(`area_same_shape_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'compare_regions' && (rules.boards?.length !== 2 || !['<', '=', '>'].includes(rules.correctRelation))) errors.push(`area_comparison_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'constrained_build' && (!Number.isInteger(rules.targetArea) || rules.targetArea < 1
        || !Number.isInteger(rules.maxCellsPerRow) || rules.maxCellsPerRow < 1
        || !Array.isArray(rules.requiredColumns) || !rules.requiredColumns.length
        || rules.requiredColumns.some((column) => !Number.isInteger(column) || column < 0 || column >= rules.boards?.[0]?.columns))) errors.push(`area_constraint_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'manipulate_fraction_model') {
      const rules = stage.fractionRules;
      const groups = new Set((rules?.groups ?? []).map(({ id }) => id));
      const pieces = rules?.pieces ?? [];
      const pieceIds = new Set(pieces.map(({ id }) => id));
      const validWholeIds = new Set((rules?.wholeOptions ?? []).map(({ id }) => id));
      const modes = ['build', 'compare', 'add', 'subtract', 'make_one'];
      if (!rules || !modes.includes(rules.mode) || !Number.isInteger(rules.denominator) || rules.denominator < 2 || rules.denominator > 12
        || !rules.denominatorOptions?.includes(rules.denominator) || !groups.size || groups.size !== (rules.groups ?? []).length
        || pieces.length < 1 || pieceIds.size !== pieces.length
        || !validWholeIds.has(rules.targetWholeId)
        || pieces.some(({ id, initialGroupId }) => !id || !groups.has(initialGroupId))
        || rules.groups.some(({ id, capacity, kind }) => !id || !Number.isInteger(capacity) || capacity < 1 || !['pool', 'fraction', 'operand', 'result', 'removed'].includes(kind))) errors.push(`fraction_model_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'build' && (!validWholeIds.has(rules.targetWholeId) || !groups.has(rules.targetGroupId) || !Number.isInteger(rules.targetNumerator) || rules.targetNumerator < 1 || rules.targetNumerator > rules.denominator)) errors.push(`fraction_build_target_incomplete:${stage.stageId}`);
      if (rules?.mode === 'compare' && (![rules.leftGroupId, rules.rightGroupId].every((id) => groups.has(id)) || ![rules.leftNumerator, rules.rightNumerator].every((value) => Number.isInteger(value) && value >= 0 && value <= rules.denominator) || !['<', '=', '>'].includes(rules.correctRelation))) errors.push(`fraction_comparison_target_incomplete:${stage.stageId}`);
      if (rules?.mode === 'add' && (![rules.firstOperandGroupId, rules.secondOperandGroupId, rules.resultGroupId].every((id) => groups.has(id)) || !Number.isInteger(rules.resultNumerator) || rules.resultNumerator < 0 || rules.resultNumerator > 2 * rules.denominator)) errors.push(`fraction_addition_target_incomplete:${stage.stageId}`);
      if (rules?.mode === 'subtract' && (![rules.startGroupId, rules.removedGroupId].every((id) => groups.has(id)) || ![rules.resultNumerator, rules.removedNumerator].every((value) => Number.isInteger(value) && value >= 0 && value <= rules.denominator))) errors.push(`fraction_subtraction_target_incomplete:${stage.stageId}`);
      if (rules?.mode === 'make_one' && (![rules.firstOperandGroupId, rules.secondOperandGroupId, rules.wholeGroupId].every((id) => groups.has(id)))) errors.push(`fraction_make_one_target_incomplete:${stage.stageId}`);
      if (pieces.some(({ initialGroupId }) => !groups.has(initialGroupId))) errors.push(`fraction_piece_group_reference_invalid:${stage.stageId}`);
    }
    if (stage.interaction === 'construct_lines') {
      const rules = stage.lineRules;
      const validPoint = (point) => Number.isInteger(point?.row) && Number.isInteger(point?.column) && point.row >= 0 && point.row < rules.rows && point.column >= 0 && point.column < rules.columns;
      if (!rules || !Number.isInteger(rules.rows) || !Number.isInteger(rules.columns) || rules.rows < 3 || rules.columns < 3
        || !['parallel', 'perpendicular'].includes(rules.relation) || !validPoint(rules.requiredPoint)
        || !Array.isArray(rules.referenceSegments) || !rules.referenceSegments.length
        || rules.referenceSegments.some(({ start, end }) => !validPoint(start) || !validPoint(end) || (start.row === end.row && start.column === end.column))) errors.push(`line_construction_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'angle_exploration') {
      const rules = stage.angleRules;
      const legacyValid = ['estimate', 'measure', 'draw', 'rotation'].includes(rules?.mode)
        && Number.isInteger(rules.targetDegrees) && rules.targetDegrees >= 0 && rules.targetDegrees <= 360
        && (!['estimate', 'measure', 'draw'].includes(rules.mode) || rules.targetDegrees <= 180)
        && (!['estimate', 'draw'].includes(rules.mode) || (Number.isInteger(rules.tolerance) && Number.isInteger(rules.valueRange?.step) && rules.valueRange.step >= 1))
        && (rules.mode !== 'measure' || (['left', 'right'].includes(rules.expectedSide) && Number.isInteger(rules.centerRange) && Number.isInteger(rules.baselineRange) && Number.isInteger(rules.baselineStep) && Number.isInteger(rules.readingStep)))
        && (rules.mode !== 'rotation' || (['clockwise', 'counterclockwise'].includes(rules.expectedDirection) && Number.isInteger(rules.rotationStep)));
      const identifyValid = rules?.mode === 'identify' && rules.displayDegrees === false
        && rules.options?.length >= 2 && rules.options.some(({ id }) => id === rules.correctOptionId)
        && rules.options.every(({ id, degrees, rayLength }) => id && Number.isInteger(degrees) && degrees >= 0 && degrees <= 180 && Number.isInteger(rayLength) && rayLength > 0);
      const compareValid = rules?.mode === 'compare' && rules.displayDegrees === false
        && ['less', 'equal', 'greater'].includes(rules.expectedRelation)
        && [rules.initialAngleA, rules.initialAngleB, rules.targetAngleA, rules.targetAngleB, rules.rayLengthA, rules.rayLengthB].every(Number.isInteger)
        && [rules.initialAngleA, rules.initialAngleB, rules.targetAngleA, rules.targetAngleB].every((degree) => degree >= 20 && degree <= 160)
        && (rules.targetAngleA > rules.targetAngleB ? 'greater' : rules.targetAngleA < rules.targetAngleB ? 'less' : 'equal') === rules.expectedRelation;
      const rightAngleValid = rules?.mode === 'right_angle' && rules.displayDegrees === false
        && Number.isInteger(rules.initialDegrees) && Number.isInteger(rules.targetDegrees) && rules.targetDegrees >= 20 && rules.targetDegrees <= 160
        && Number.isInteger(rules.referenceDegrees ?? 90) && (rules.targetDegrees > (rules.referenceDegrees ?? 90) ? 'greater' : rules.targetDegrees < (rules.referenceDegrees ?? 90) ? 'less' : 'equal') === rules.expectedRelation;
      const alignValid = rules?.mode === 'align' && rules.displayDegrees === false && Number.isInteger(rules.targetDegrees)
        && rules.targetDegrees >= 20 && rules.targetDegrees <= 160 && Number.isInteger(rules.tolerance) && rules.tolerance >= 0;
      if (!(legacyValid || identifyValid || compareValid || rightAngleValid || alignValid)) errors.push(`angle_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'geometry_exploration') {
      if (stage.geometryMode === 'split_recompose') {
        if (!stage.board || !Array.isArray(stage.targetCells) || !stage.pieces?.length || !stage.pieces.every((piece) => piece.id && Array.isArray(piece.cells) && piece.cells.length && Number.isInteger(piece.initialPosition?.row) && Number.isInteger(piece.initialPosition?.column))) errors.push(`geometry_recomposition_incomplete:${stage.stageId}`);
        else if (stage.targetCells.some(({ row, column }) => row < 0 || column < 0 || row >= stage.board.rows || column >= stage.board.columns)) errors.push(`geometry_target_out_of_bounds:${stage.stageId}`);
      } else if (stage.geometryMode === 'fold_net') {
        if (!stage.netCandidates?.length || !Array.isArray(stage.queriedFaceIds) || stage.queriedFaceIds.length !== 2 || !stage.netCandidates.some(({ expectedFoldable }) => expectedFoldable)) errors.push(`geometry_net_incomplete:${stage.stageId}`);
        for (const net of stage.netCandidates ?? []) if (foldCubeNet(net.faces).valid !== net.expectedFoldable) errors.push(`geometry_net_expected_topology_mismatch:${stage.stageId}:${net.id}`);
        if (stage.netCandidates?.filter(({ expectedFoldable }) => expectedFoldable).length < 2) errors.push(`geometry_needs_two_valid_nets:${stage.stageId}`);
      } else errors.push(`geometry_mode_unsupported:${stage.stageId}`);
    }
    if (stage.interaction === 'complete_symmetry_grid') {
      const rules = stage.symmetryRules;
      const validCells = new Set((rules?.fillableCellIds ?? []).filter((id) => Number.isInteger(Number(id.split('-')[0])) && Number.isInteger(Number(id.split('-')[1]))));
      if (!rules || !Number.isInteger(rules.rows) || !Number.isInteger(rules.columns) || !Number.isInteger(rules.axisColumn) || !validCells.size || !Array.isArray(rules.targetCellIds) || !rules.targetCellIds.length || rules.targetCellIds.some((id) => !validCells.has(id)) || rules.targetCellIds.length !== new Set(rules.targetCellIds).size) errors.push(`symmetry_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'plot_line_chart') {
      const rules = stage.plotRules;
      if (!rules?.xAxisTitle || !rules?.yAxisTitle || !Array.isArray(rules.valueOptions) || !rules.valueOptions.length || !Array.isArray(rules.points) || rules.points.length < 3 || rules.points.some(({ id, value }) => !id || !rules.valueOptions.includes(value)) || new Set(rules.points.map(({ id }) => id)).size !== rules.points.length) errors.push(`line_chart_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'build_bar_chart') {
      const rules = stage.barChartRules;
      if (!rules?.chartTitle || !rules?.yAxisTitle || !Number.isInteger(rules.maxValue) || rules.maxValue < 1
        || !Array.isArray(rules.categories) || rules.categories.length < 2
        || new Set(rules.categories.map(({ id }) => id)).size !== rules.categories.length
        || rules.categories.some(({ id, label, value }) => !id || !label || !Number.isInteger(value) || value < 0 || value > rules.maxValue)) errors.push(`bar_chart_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'construct_triangle') {
      const rules = stage.triangleRules;
      if (!rules || !Number.isInteger(rules.rows) || !Number.isInteger(rules.columns) || rules.rows < 3 || rules.columns < 3
        || !['isosceles', 'right', 'acute', 'obtuse'].includes(rules.targetKind)) errors.push(`triangle_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'construct_quadrilateral') {
      const rules = stage.quadrilateralRules;
      if (!rules || !Number.isInteger(rules.rows) || !Number.isInteger(rules.columns) || rules.rows < 3 || rules.columns < 3
        || !['square', 'rectangle', 'parallelogram'].includes(rules.targetKind)) errors.push(`quadrilateral_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'set_clock_time' && (!stage.clockRules || !Array.isArray(stage.clockRules.allowedHours) || stage.clockRules.minuteStep !== 5 || stage.clockRules.targetHour < 1 || stage.clockRules.targetHour > 12 || stage.clockRules.targetMinute < 0 || stage.clockRules.targetMinute >= 60 || stage.clockRules.targetMinute % 5 !== 0)) errors.push(`clock_rules_incomplete:${stage.stageId}`);
    if (stage.interaction === 'elapsed_time_model') {
      const rules = stage.elapsedRules;
      if (!rules || ![rules.startHour, rules.startMinute, rules.endHour, rules.endMinute, rules.initialMinutes, rules.targetMinutes, rules.minMinutes, rules.maxMinutes, rules.stepMinutes].every(Number.isInteger)
        || rules.startHour < 1 || rules.startHour > 12 || rules.endHour !== rules.startHour
        || rules.startMinute < 0 || rules.startMinute >= 60 || rules.endMinute < rules.startMinute || rules.endMinute >= 60
        || rules.targetMinutes !== rules.endMinute - rules.startMinute || rules.minMinutes < 0 || rules.minMinutes > rules.initialMinutes
        || rules.initialMinutes > rules.maxMinutes || rules.targetMinutes < rules.minMinutes || rules.targetMinutes > rules.maxMinutes
        || rules.stepMinutes < 1 || rules.stepMinutes % 5 !== 0 || (rules.targetMinutes - rules.minMinutes) % rules.stepMinutes !== 0) errors.push(`elapsed_time_rules_incomplete:${stage.stageId}`);
    }
    if (stage.interaction === 'build_volume' && (!stage.volumeRules || !['rows', 'columns', 'layers'].every((key) => Number.isInteger(stage.volumeRules.target?.[key]) && stage.volumeRules.target[key] > 0 && Number.isInteger(stage.volumeRules.max?.[key]) && stage.volumeRules.max[key] >= stage.volumeRules.target[key]))) errors.push(`volume_rules_incomplete:${stage.stageId}`);
    const optionList = ['assemble_response', 'compose_pattern'].includes(stage.interaction) ? stage.tokens : stage.options;
    if (stage.interaction === 'order_items') {
      const itemIds = new Set((stage.items ?? []).map(({ id }) => id));
      const validPermutation = (list) => Array.isArray(list) && list.length === itemIds.size && new Set(list).size === list.length && list.every((id) => itemIds.has(id));
      if (itemIds.size < 2 || itemIds.size !== (stage.items ?? []).length || !validPermutation(stage.initialOrder) || !validPermutation(stage.correctItemIds)) errors.push(`ordering_data_incomplete:${stage.stageId}`);
    }
    if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
      const observationIds = new Set((stage.observations ?? []).map(({ id }) => id));
      const categoryIds = new Set((stage.categories ?? []).map(({ id }) => id));
      if (!observationIds.size || !categoryIds.size || Object.keys(stage.correctAssignments ?? {}).length !== observationIds.size) errors.push(`stage_data_incomplete:${stage.stageId}`);
      if (Object.entries(stage.correctAssignments ?? {}).some(([id, category]) => !observationIds.has(id) || !categoryIds.has(category))) errors.push(`invalid_classification_reference:${stage.stageId}`);
      if (stage.distributionBoard) {
        const { mode, expectedGroupSize, targetCounts } = stage.distributionBoard;
        if (!['equal_share', 'equal_groups', 'groups_with_remainder'].includes(mode)
          || !Number.isInteger(expectedGroupSize) || expectedGroupSize < 1
          || !targetCounts || Object.keys(targetCounts).length !== categoryIds.size
          || [...categoryIds].some((id) => !Number.isInteger(targetCounts[id]) || targetCounts[id] < 0)
          || Object.values(targetCounts).reduce((sum, count) => sum + count, 0) !== observationIds.size) errors.push(`invalid_distribution_board:${stage.stageId}`);
      }
      if (stage.interaction === 'build_frequency_table' && (!stage.tableTitle || !stage.tableMeasure)) errors.push(`frequency_table_incomplete:${stage.stageId}`);
      if (stage.collectionRules && (stage.interaction !== 'build_frequency_table'
        || !Array.isArray(stage.collectionRules.requiredObservationIds)
        || !stage.collectionRules.requiredObservationIds.length
        || new Set(stage.collectionRules.requiredObservationIds).size !== stage.collectionRules.requiredObservationIds.length
        || stage.collectionRules.requiredObservationIds.some((id) => !observationIds.has(id)))) errors.push(`invalid_table_collection_rules:${stage.stageId}`);
      if (stage.initialAssignments && Object.entries(stage.initialAssignments).some(([id, category]) => !observationIds.has(id) || !categoryIds.has(category))) errors.push(`invalid_initial_table_assignments:${stage.stageId}`);
      if (stage.crossTab && stage.interaction !== 'build_frequency_table') errors.push(`cross_tab_requires_frequency_table:${stage.stageId}`);
    } else if (stage.interaction === 'compose_pattern') {
      const rules = stage.patternRules;
      const patternLength = rules?.mode === 'number_builder' ? rules.termCount : rules?.beatCount;
      if (!rules || !Number.isInteger(patternLength) || patternLength < 2) errors.push(`pattern_rules_incomplete:${stage.stageId}`);
      if (!['number_builder', 'repair', 'repeat_unit_builder'].includes(rules?.mode)
        && (!Number.isInteger(rules?.minDistinctTokens) || !Number.isInteger(rules?.minRepeatedTokenCount))) errors.push(`pattern_rules_incomplete:${stage.stageId}`);
      if (rules?.targetPattern && (rules.targetPattern.length !== rules.beatCount || rules.targetPattern.some((id) => !(stage.tokens ?? []).some((token) => token.id === id)))) errors.push(`pattern_target_invalid:${stage.stageId}`);
      if (rules?.mode === 'repeat_unit_builder' && (!Number.isInteger(rules.unitLength) || rules.unitLength < 2 || rules.beatCount % rules.unitLength !== 0 || rules.minDistinctTokens < 2 || rules.beatCount < rules.unitLength * 3)) errors.push(`repeat_unit_builder_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'number_builder' && (!Number.isInteger(rules.startRange?.min) || !Number.isInteger(rules.startRange?.max) || rules.startRange.min > rules.targetStart || rules.startRange.max < rules.targetStart
        || !Number.isInteger(rules.incrementRange?.min) || !Number.isInteger(rules.incrementRange?.max) || rules.incrementRange.min > rules.targetIncrement || rules.incrementRange.max < rules.targetIncrement
        || !Number.isInteger(rules.termRange?.min) || !Number.isInteger(rules.termRange?.max) || rules.termRange.min > rules.termRange.max
        || !Number.isInteger(rules.initialStart) || !Number.isInteger(rules.initialIncrement) || !Number.isInteger(rules.termCount) || rules.termCount < 4
        || rules.initialStart < rules.startRange.min || rules.initialStart > rules.startRange.max
        || rules.initialIncrement < rules.incrementRange.min || rules.initialIncrement > rules.incrementRange.max
        || rules.initialStart === rules.targetStart && rules.initialIncrement === rules.targetIncrement
        || rules.targetStart + rules.targetIncrement * (rules.termCount - 1) > rules.termRange.max)) errors.push(`number_pattern_builder_rules_incomplete:${stage.stageId}`);
      if (rules?.mode === 'repair' && (!Array.isArray(rules.starterPattern) || rules.starterPattern.length !== rules.beatCount || !Number.isInteger(rules.errorIndex) || rules.errorIndex < 0 || rules.errorIndex >= rules.beatCount
        || !rules.targetPattern || rules.targetPattern.length !== rules.beatCount || rules.targetPattern.some((id) => !(stage.tokens ?? []).some((token) => token.id === id))
        || rules.starterPattern.some((id) => !(stage.tokens ?? []).some((token) => token.id === id))
        || rules.starterPattern.map((id, index) => id === rules.targetPattern?.[index] ? -1 : index).filter((index) => index >= 0).join(',') !== String(rules.errorIndex))) errors.push(`pattern_repair_rules_incomplete:${stage.stageId}`);
      if (rules?.grid) {
        const rows = rules.grid;
        const blankCount = rows.flat().filter((cell) => cell === null).length;
        if (!rows.length || !rows[0]?.length || rows.some((row) => row.length !== rows[0].length)
          || blankCount !== rules.beatCount || !rules.targetPattern
          || rows.flat().some((cell) => cell !== null && !String(cell).length)) errors.push(`pattern_grid_incomplete:${stage.stageId}`);
      }
    } else if (stage.interaction === 'build_array') {
      const rules = stage.arrayRules;
      if (!rules || !Number.isInteger(rules.targetRows) || !Number.isInteger(rules.targetColumns) || !Number.isInteger(rules.maxRows) || !Number.isInteger(rules.maxColumns) || rules.targetRows < 1 || rules.targetColumns < 1 || rules.targetRows > rules.maxRows || rules.targetColumns > rules.maxColumns) errors.push(`array_rules_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'place_number_line_marker') {
      const line = stage.numberLine;
      if (!line || !Number.isInteger(line.tickCount) || line.tickCount < 1 || !Number.isInteger(line.targetTick) || line.targetTick < 0 || line.targetTick > line.tickCount || typeof line.start !== 'number' || typeof line.end !== 'number' || line.end <= line.start) errors.push(`number_line_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'compose_shape') {
      const rules = stage.shapeRules;
      const pieceIds = new Set((stage.pieces ?? []).map(({ id }) => id));
      const boardSize = (rules?.rows ?? 0) * (rules?.columns ?? 0);
      const selectionCount = rules?.selectionCount ?? boardSize;
      if (!rules || !Number.isInteger(rules.rows) || !Number.isInteger(rules.columns) || rules.rows < 1 || rules.columns < 1 || !Number.isInteger(selectionCount) || selectionCount < 1 || selectionCount > boardSize || rules.correctPieceIds?.length !== selectionCount || new Set(rules.correctPieceIds ?? []).size !== selectionCount || rules.correctPieceIds.some((id) => !pieceIds.has(id)) || pieceIds.size !== (stage.pieces ?? []).length) errors.push(`shape_rules_incomplete:${stage.stageId}`);
      if (rules?.correctPieceOrder && (rules.correctPieceOrder.length !== selectionCount || new Set(rules.correctPieceOrder).size !== rules.correctPieceOrder.length || rules.correctPieceOrder.some((id) => !pieceIds.has(id)) || rules.correctPieceIds?.some((id) => !rules.correctPieceOrder.includes(id)))) errors.push(`shape_order_rules_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'complete_calculation_steps') {
      const stepIds = new Set((stage.calculationSteps ?? []).map(({ id }) => id));
      if (!stepIds.size || stepIds.size !== stage.calculationSteps.length || stage.calculationSteps.some(({ choices, expectedValue }) => !choices?.some(({ value }) => value === expectedValue))) errors.push(`calculation_steps_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'build_place_value_blocks') {
      const rules = stage.placeValueRules;
      const places = Object.keys(placeValueWeights);
      const countRecordValid = (record, max = false) => record && places.every((place) => Number.isInteger(record[place]) && record[place] >= 0 && (!max || record[place] <= rules.maxCounts[place]));
      const valueOf = (record) => places.reduce((sum, place) => sum + record[place] * placeValueWeights[place], 0);
      const exchangesValid = (rules?.allowedExchanges ?? []).every(({ from, to }) => places.indexOf(from) + 1 === places.indexOf(to));
      if (!rules || !Number.isInteger(rules.targetValue) || !Number.isInteger(rules.requiredExchangeCount) || rules.requiredExchangeCount < 0
        || !countRecordValid(rules.maxCounts) || !countRecordValid(rules.initialCounts, true) || !countRecordValid(rules.targetCounts, true)
        || valueOf(rules.initialCounts) > rules.targetValue || valueOf(rules.targetCounts) !== rules.targetValue
        || !Array.isArray(rules.allowedExchanges) || !exchangesValid || rules.requiredExchangeCount > rules.allowedExchanges.length) errors.push(`place_value_rules_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'operate_vertical_calculation') {
      const steps = stage.calculationSteps ?? [];
      const stepIds = new Set(steps.map(({ id }) => id));
      const layout = stage.verticalLayout;
      if (!layout || !Number.isInteger(layout.topNumber) || !Number.isInteger(layout.bottomNumber) || !['+', '−'].includes(layout.operator)
        || !Array.isArray(layout.columns) || layout.columns.length !== 4 || steps.length < 4 || stepIds.size !== steps.length
        || steps.some(({ id, kind, minValue, maxValue, initialValue, expectedValue, incorrectFeedback }) => !id || !['digit', 'carry', 'borrow'].includes(kind)
          || ![minValue, maxValue, initialValue, expectedValue].every(Number.isInteger) || minValue > initialValue || initialValue > maxValue
          || expectedValue < minValue || expectedValue > maxValue || !incorrectFeedback)) errors.push(`vertical_calculation_steps_incomplete:${stage.stageId}`);
      if (layout?.columns?.some(({ place, digitStepId }) => !placeValueWeights[place] || !stepIds.has(digitStepId) || !steps.some((step) => step.id === digitStepId && step.kind === 'digit'))) errors.push(`vertical_calculation_layout_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'adjust_decimal_place_value') {
      const rules = stage.decimalRules;
      if (!rules || ![rules.initialHundredths, rules.targetHundredths, rules.minHundredths, rules.maxHundredths].every(Number.isInteger)
        || rules.minHundredths < 0 || rules.minHundredths > rules.initialHundredths || rules.initialHundredths > rules.maxHundredths
        || rules.targetHundredths < rules.minHundredths || rules.targetHundredths > rules.maxHundredths) errors.push(`decimal_place_rules_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'adjust_circle_radius') {
      if (!stage.circleRules?.allowedRadii?.includes(stage.circleRules.targetRadius)) errors.push(`circle_rules_incomplete:${stage.stageId}`);
    } else if (stage.interaction === 'set_estimate_range') {
      const input = stage.estimateRules?.inputRange;
      const acceptable = stage.estimateRules?.acceptableRange;
      if (!input || !acceptable || ![input.min, input.max, input.step, acceptable.min, acceptable.max].every(Number.isFinite) || input.min >= input.max || input.step <= 0 || acceptable.min > acceptable.max || acceptable.min < input.min || acceptable.max > input.max) errors.push(`estimate_range_incomplete:${stage.stageId}`);
    } else if (!['order_items', 'set_clock_time', 'elapsed_time_model', 'build_volume', 'complete_symmetry_grid', 'plot_line_chart', 'build_bar_chart', 'construct_triangle', 'construct_quadrilateral', 'geometry_exploration', 'angle_exploration', 'construct_lines', 'adjust_decimal_place_value', 'build_place_value_blocks', 'operate_vertical_calculation', 'manipulate_fraction_model', 'measure_length_model', 'build_area_grid', 'build_weight_scale', 'build_capacity_model', 'build_unknown_quantity_model', 'magnet_interaction'].includes(stage.interaction)
      && (!Array.isArray(optionList) || !Array.isArray(stage.correctOptionIds) || !stage.correctOptionIds.length)) errors.push(`stage_data_incomplete:${stage.stageId}`);
    const optionIds = new Set((optionList ?? []).map(({ id }) => id));
    if (optionList && (optionIds.size !== optionList.length || (stage.correctOptionIds ?? []).some((id) => !optionIds.has(id)))) errors.push(`invalid_option_reference:${stage.stageId}`);
    if (Array.isArray(stage.acceptedOptionSets) && stage.acceptedOptionSets.some((set) => !Array.isArray(set) || !set.length || set.some((id) => !optionIds.has(id)))) errors.push(`invalid_accepted_option_set:${stage.stageId}`);
    if (stage.interaction === 'assemble_response' && new Set(stage.correctOptionIds ?? []).size !== (stage.correctOptionIds ?? []).length) errors.push(`invalid_phrase_order:${stage.stageId}`);
    if (!Array.isArray(stage.hints) || stage.hints.length < 2 || !stage.incorrectFeedback || !stage.correctFeedback) errors.push(`feedback_or_hints_missing:${stage.stageId}`);
  }
  return errors;
}
