import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from '../prototype/data/learningSubitemExpansionTasks.js';
import { LEARNING_SUBITEM_GAP_TASKS } from '../prototype/data/learningSubitemGapTasks.js';
import { GRADE3_MATH_DATA_EXPANSION_TASKS } from '../prototype/data/grade3MathDataExpansionTasks.js';
import { CURRICULUM_GAP_BATCH_TASKS } from '../prototype/data/curriculumGapBatchTasks.js';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';
import { TWO_STEP_SUPPLY_ADVENTURE } from '../prototype/data/twoStepSupplyAdventure.js';
import { MULTIPLICATION_ARRAY_WORKSHOP } from '../prototype/data/multiplicationArrayWorkshop.js';
import { MULTIPLICATION_DIVISION_CALCULATION_WORKSHOP } from '../prototype/data/multiplicationDivisionCalculationWorkshop.js';
import { CIRCLE_AND_PATTERN_WORKSHOP } from '../prototype/data/circleAndPatternWorkshop.js';
import { GRADE3_PLACE_VALUE_AND_COLUMN_TASKS } from '../prototype/data/grade3PlaceValueAndColumnTasks.js';
import { GRADE3_FRACTION_MODEL_EXPLORATION } from '../prototype/data/fractionModelExplorationWorkshop.js';
import { LENGTH_MEASUREMENT_ADVENTURE } from '../prototype/data/lengthMeasurementAdventure.js';
import { AREA_GRID_CONSTRUCTION_WORKSHOP } from '../prototype/data/areaGridConstructionWorkshop.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'learning-subitems-browser-acceptance');
const allTasksToVerify = [...new Map([
  ...LEARNING_SUBITEM_EXPANSION_TASKS,
  ...LEARNING_SUBITEM_GAP_TASKS,
  ...GRADE3_MATH_DATA_EXPANSION_TASKS,
  ...CURRICULUM_GAP_BATCH_TASKS,
  ...MATH_CURRICULUM_GAP_TASKS,
  TWO_STEP_SUPPLY_ADVENTURE,
  MULTIPLICATION_ARRAY_WORKSHOP,
  MULTIPLICATION_DIVISION_CALCULATION_WORKSHOP,
  CIRCLE_AND_PATTERN_WORKSHOP,
  ...GRADE3_PLACE_VALUE_AND_COLUMN_TASKS,
  GRADE3_FRACTION_MODEL_EXPLORATION,
  LENGTH_MEASUREMENT_ADVENTURE,
  AREA_GRID_CONSTRUCTION_WORKSHOP,
].map((task) => [task.activityId, task])).values()];
const requestedActivityIds = new Set((process.env.ACCEPTANCE_ACTIVITY_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean));
const tasksToVerify = requestedActivityIds.size ? allTasksToVerify.filter(({ activityId }) => requestedActivityIds.has(activityId)) : allTasksToVerify;
const runDir = path.join(outputDir, 'runs', `learning-subitems-${new Date().toISOString().replaceAll(/[^0-9]/g, '').slice(0, 14)}`);
const cdpBase = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:49388';
const origin = process.env.TEST_ORIGIN ?? 'http://127.0.0.1:49387/';
const viewports = [
  { width: 1366, height: 768, mobile: false },
  { width: 390, height: 844, mobile: true },
  { width: 340, height: 740, mobile: true },
];
const timestamp = new Date().toISOString();
const report = {
  reportId: `learning-subitems-browser-${timestamp.replaceAll(/[^0-9]/g, '').slice(0, 14)}`,
  evidenceType: 'isolated_browser_acceptance',
  executedAt: timestamp,
  browser: null,
  source: origin,
  profile: process.env.BROWSER_PROFILE ?? 'profile path not supplied; isolation not verified',
  viewports: [],
  limitations: ['工程互動驗收不代表教師審查、課綱完整覆蓋或學生學習成效。'],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJsonFile(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${options?.method ?? 'GET'} ${url} failed: HTTP ${response.status}`);
  return response.json();
}

class CdpPage {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 0;
    this.pending = new Map();
    this.events = { consoleErrors: [], consoleWarnings: [], requestFailures: [], httpErrors: [] };
    this.ws.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result ?? {});
        return;
      }
      if (message.method === 'Runtime.consoleAPICalled') {
        const text = (message.params.args ?? []).map(({ value, description }) => value ?? description ?? '').join(' ');
        if (message.params.type === 'error') this.events.consoleErrors.push(text);
        if (message.params.type === 'warning' || message.params.type === 'warn') this.events.consoleWarnings.push(text);
      }
      if (message.method === 'Runtime.exceptionThrown') this.events.consoleErrors.push(message.params.exceptionDetails?.text ?? 'Runtime exception');
      if (message.method === 'Network.loadingFailed') this.events.requestFailures.push({ requestId: message.params.requestId, errorText: message.params.errorText, canceled: message.params.canceled });
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) this.events.httpErrors.push({ url: message.params.response.url, status: message.params.response.status });
    });
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.nextId;
    const promise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return promise;
  }
  async evaluate(expression, { awaitPromise = true } = {}) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    return response.result?.value;
  }
  async click(selector, text) {
    const expression = `(() => { const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})]; const node=${text === undefined ? 'nodes[0]' : `nodes.find(n => n.textContent.trim() === ${JSON.stringify(text)})`}; if (!node) return {ok:false, selector:${JSON.stringify(selector)}, text:${JSON.stringify(text)}}; if (node.disabled) return {ok:false, disabled:true, selector:${JSON.stringify(selector)}}; node.click(); return {ok:true}; })()`;
    const result = await this.evaluate(expression);
    assert(result?.ok, `Cannot click ${selector}${text ? ` (${text})` : ''}: ${JSON.stringify(result)}`);
    await this.wait(90);
  }
  async waitFor(expression, description, timeoutMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.evaluate(expression)) return;
      await this.wait(80);
    }
    throw new Error(`Timed out waiting for ${description}`);
  }
  wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  async screenshot(filePath) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  }
  close() { this.ws.close(); }
}

async function chooseAnswer(page, stage, wrong) {
  if (stage.interaction === 'build_capacity_model') {
    const rules = stage.capacityRules;
    const setRange = async (label, value) => page.evaluate(`(() => { const input=[...document.querySelectorAll('#catalog-task-content .capacity-model-slider')].find(el=>el.getAttribute('aria-label')===${JSON.stringify(label)}); if(!input) throw Error('capacity range missing: '+${JSON.stringify(label)}); input.value=${value}; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
    const clickByLabel = async (fragment) => page.evaluate(`(() => { const button=[...document.querySelectorAll('#catalog-task-content button[aria-label]')].find(el=>el.getAttribute('aria-label').includes(${JSON.stringify(fragment)})); if(!button) throw Error('capacity action missing: '+${JSON.stringify(fragment)}); button.click(); return true; })()`);
    if (rules.mode === 'estimate') await setRange('你的估量', wrong ? rules.input.min : Math.ceil(rules.acceptable.min / rules.input.step) * rules.input.step);
    else if (rules.mode === 'fill') {
      const target = wrong ? rules.targetMl - rules.stepMl : rules.targetMl;
      for (let value = rules.initialMl; value < target; value += rules.stepMl) await clickByLabel('液量控制：倒入');
    } else if (rules.mode === 'read') {
      for (let value = rules.initialMl; value < rules.targetMl; value += rules.stepMl) await clickByLabel('液量控制：倒入');
      await setRange('液面讀值標記', wrong ? rules.targetMl - rules.readingStepMl : rules.targetMl);
    } else if (rules.mode === 'compare') {
      for (const container of rules.containers) {
        for (let value = 0; value < container.capacityMl; value += rules.stepMl) {
          await page.evaluate(`(() => { const card=[...document.querySelectorAll('#catalog-task-content .capacity-compare-item')].find(el=>el.innerText.includes(${JSON.stringify(container.label)})); const button=[...(card?.querySelectorAll('button[aria-label]')??[])].find(el=>el.getAttribute('aria-label').includes('倒入')); if(!button) throw Error('capacity comparison pour missing'); button.click(); return true; })()`);
        }
      }
      const relation = wrong ? (rules.relation === '=' ? '<' : '=') : rules.relation;
      await page.click('#catalog-task-content .capacity-relation-controls button', `甲 ${relation} 乙`);
    } else if (rules.mode === 'difference') {
      const target = wrong ? rules.targetMl - rules.stepMl : rules.targetMl;
      for (let value = rules.initialMl; value > target; value -= rules.stepMl) await clickByLabel('液量控制：取出');
      await setRange('記錄取出的容量差', wrong ? rules.expectedDifferenceMl - rules.answerStepMl : rules.expectedDifferenceMl);
    } else if (rules.mode === 'supply') {
      let selected = wrong ? [rules.items[0]] : null;
      if (!wrong) {
        for (let i = 0; i < rules.items.length && !selected; i += 1) for (let j = i + 1; j < rules.items.length && !selected; j += 1) for (let k = j + 1; k < rules.items.length && !selected; k += 1) {
          const candidate = [rules.items[i], rules.items[j], rules.items[k]];
          if (candidate.reduce((sum, item) => sum + item.volumeMl, 0) === rules.targetMl) selected = candidate;
        }
      }
      for (const item of selected ?? []) await page.click('#catalog-task-content .capacity-supply-options button', `${item.label}｜${item.volumeMl} 毫升`);
    }
  } else if (stage.interaction === 'build_weight_scale') {
    const rules = stage.weightRules;
    const setRange = async (label, value) => page.evaluate(`(() => { const input=[...document.querySelectorAll('#catalog-task-content .weight-scale-slider')].find(el=>el.getAttribute('aria-label')===${JSON.stringify(label)}); if(!input) throw Error('weight control missing: '+${JSON.stringify(label)}); input.value=${value}; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
    const clickItem = async (label) => page.evaluate(`(() => { const button=[...document.querySelectorAll('#catalog-task-content .weight-supply-options button')].find(el=>el.textContent.includes(${JSON.stringify(label)})); if(!button) throw Error('weight item missing: '+${JSON.stringify(label)}); button.click(); return true; })()`);
    if (rules.mode === 'estimate') await setRange('先估測重量（公克）', wrong ? rules.input.min : rules.targetGrams);
    else if (rules.mode === 'balance') {
      const count = wrong ? Math.max(0, rules.targetCounterweights - 1) : rules.targetCounterweights;
      for (let i = 0; i < count; i += 1) await page.evaluate("(() => { const b=document.querySelector('#catalog-task-content button[aria-label=\\\"右盤加上一個50公克砝碼\\\"]'); if(!b || b.disabled) throw Error('balance weight button unavailable'); b.click(); })()");
    } else if (rules.mode === 'read') await setRange('秤面指針讀值（公克）', wrong ? rules.targetGrams - rules.input.step : rules.targetGrams);
    else if (rules.mode === 'compare') {
      for (const item of rules.items) await setRange(`${item.label}秤面讀值（公克）`, item.actualGrams);
      const incorrectDifference = rules.targetDifference === 0 ? 50 : rules.targetDifference - 50;
      await setRange('重量差（公克）', wrong ? incorrectDifference : rules.targetDifference);
      const relation = wrong ? (rules.targetRelation === '<' ? '>' : '<') : rules.targetRelation;
      await page.click('#catalog-task-content .weight-relation-controls button', `甲 ${relation} 乙`);
    } else if (rules.mode === 'convert') {
      await setRange('公斤數', wrong ? 0 : Math.floor(rules.targetGrams / 1000));
      await setRange('剩餘公克數', wrong ? 200 : rules.targetGrams % 1000);
    } else {
      if (wrong) await clickItem(rules.items[0].label);
      else {
        const pair = rules.items.find((item, index) => rules.items.slice(index + 1).some((other) => item.grams + other.grams === rules.targetGrams));
        const other = rules.items.find((item) => item.id !== pair.id && item.grams + pair.grams === rules.targetGrams);
        await clickItem(pair.label); await clickItem(other.label);
      }
    }
    return;
  }
  if (stage.interaction === 'build_area_grid') {
    const rules = stage.areaGridRules;
    const clickCell = async (boardId, cellId) => page.evaluate(`(() => { const button=document.querySelector('#catalog-task-content .area-grid-tile[data-area-board-id="${boardId}"][data-area-cell="${cellId}"]'); if(!button || button.disabled) throw Error('area grid cell unavailable: ${boardId}/${cellId}'); button.click(); return button.getAttribute('aria-pressed')==='true'; })()`);
    const fill = async (board, cells) => { for (const id of cells) await clickCell(board.id, id); };
    if (rules.mode === 'estimate_cover') {
      const value = wrong ? rules.estimate.max : rules.boards[0].targetCells.length;
      await page.evaluate(`(() => { const input=document.querySelector('#catalog-task-content .area-estimate-slider'); if(!input) throw Error('area estimate slider missing'); input.value=${value}; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); })()`);
      await fill(rules.boards[0], rules.boards[0].targetCells);
    } else if (rules.mode === 'cover_outline') {
      await fill(rules.boards[0], wrong ? [...rules.boards[0].targetCells, 'r3c3'] : rules.boards[0].targetCells);
    } else if (rules.mode === 'same_area_different_shape') {
      await fill(rules.boards[0], wrong ? rules.boards[0].referenceCells : ['r0c0','r0c1','r0c2','r1c2','r2c2','r2c1']);
    } else if (rules.mode === 'complete_missing_cells') {
      const board = rules.boards[0];
      const missing = board.targetCells.filter((id) => !board.initialCells.includes(id));
      await fill(board, wrong ? missing.slice(0, 1) : missing);
    } else if (rules.mode === 'compare_regions') {
      for (const board of rules.boards) await fill(board, board.targetCells);
      await page.click('#catalog-task-content .area-relation-controls button', wrong ? '甲 > 乙' : `甲 ${rules.correctRelation} 乙`);
    } else if (rules.mode === 'constrained_build') {
      await fill(rules.boards[0], wrong ? ['r0c0','r0c1','r1c0','r1c1','r2c0'] : ['r0c0','r0c1','r0c2','r1c0','r1c1','r1c2','r2c2','r2c3']);
    }
    return;
  }
  if (stage.interaction === 'manipulate_fraction_model') {
    const rules = stage.fractionRules;
    await page.click('#catalog-task-content .fraction-whole-choices button', rules.wholeOptions.find(({ id }) => id === rules.targetWholeId).label);
    await page.click('#catalog-task-content .fraction-denominator-choices button', `平均分成 ${rules.denominator} 份`);
    const chooseModel = async (groupId, pieceIds) => {
      await page.evaluate(`(() => { const group=document.querySelector('#catalog-task-content [data-fraction-group-id="${groupId}"]'); const button=group?.querySelector('button.fraction-model-select'); if(!button) throw Error('fraction model selector missing: ${groupId}'); button.click(); return true; })()`);
      for (const pieceId of pieceIds) await page.evaluate(`(() => { const button=document.querySelector('#catalog-task-content [data-fraction-piece-id="${pieceId}"]'); if(!button || button.disabled) throw Error('fraction piece unavailable: ${pieceId}'); button.click(); return true; })()`);
    };
    const sourcePieces = (groupId) => rules.pieces.filter(({ initialGroupId }) => initialGroupId === groupId).map(({ id }) => id);
    if (rules.mode === 'build') await chooseModel(rules.targetGroupId, sourcePieces(rules.sourceGroupId).slice(0, rules.targetNumerator - (wrong ? 1 : 0)));
    else if (rules.mode === 'compare') {
      const pieces = sourcePieces(rules.sourceGroupId);
      await chooseModel(rules.leftGroupId, pieces.slice(0, rules.leftNumerator));
      await chooseModel(rules.rightGroupId, pieces.slice(rules.leftNumerator, rules.leftNumerator + rules.rightNumerator));
      await page.click('#catalog-task-content .fraction-relation-choices button', wrong ? (rules.correctRelation === '<' ? '>' : '<') : rules.correctRelation);
    } else if (rules.mode === 'add') {
      const pieces = [...sourcePieces(rules.firstOperandGroupId), ...sourcePieces(rules.secondOperandGroupId)];
      await chooseModel(rules.resultGroupId, wrong ? pieces.slice(0, -1) : pieces);
    } else if (rules.mode === 'subtract') await chooseModel(rules.removedGroupId, sourcePieces(rules.startGroupId).slice(0, rules.removedNumerator - (wrong ? 1 : 0)));
    else if (rules.mode === 'make_one') {
      const pieces = [...sourcePieces(rules.firstOperandGroupId), ...sourcePieces(rules.secondOperandGroupId)];
      await chooseModel(rules.wholeGroupId, wrong ? pieces.slice(0, -1) : pieces);
    }
    return;
  }
  if (stage.interaction === 'measure_length_model') {
    const rules = stage.lengthRules;
    const setRange = async (label, value) => page.evaluate(`(() => { const input=[...document.querySelectorAll('#catalog-task-content .length-measurement-slider')].find(el=>el.getAttribute('aria-label')===${JSON.stringify(label)}); if(!input) throw Error('length control missing: '+${JSON.stringify(label)}); input.value=${value}; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
    if (rules.mode === 'estimate') await setRange('估測長度（毫米）', wrong ? rules.estimateRange.min : rules.targetLength);
    else if (rules.mode === 'align_read') {
      const requiredDelta = rules.object.start - rules.initialRulerZero;
      const moveCount = wrong ? Math.max(1, requiredDelta - 1) : requiredDelta;
      for (let i = 0; i < Math.abs(moveCount); i += 1) await page.click('#catalog-task-content .candidate-token-list button.candidate-token', moveCount < 0 ? '尺往左 1 毫米' : '尺往右 1 毫米');
      await setRange('讀取物件末端刻度（毫米）', wrong ? rules.object.length - 1 : rules.object.length);
    } else if (rules.mode === 'compare') {
      for (const [index, object] of rules.objects.entries()) await setRange(`${object.label}刻度讀值（毫米）`, wrong && index === 0 ? object.length - 1 : object.length);
      const difference = Math.abs(rules.objects[0].length - rules.objects[1].length);
      await setRange('你測得兩者相差（毫米）', wrong ? Math.max(0, difference - 1) : difference);
      if (Number.isInteger(rules.conversionTargetMillimeters)) {
        await setRange('合計的公分數', wrong ? 0 : Math.floor(rules.conversionTargetMillimeters / 10));
        await setRange('合計剩餘毫米數', wrong ? 0 : rules.conversionTargetMillimeters % 10);
      }
    } else if (rules.mode === 'convert') {
      await setRange('公分數', wrong ? 0 : Math.floor(rules.targetMillimeters / 10));
      await setRange('剩餘毫米數', wrong ? 0 : rules.targetMillimeters % 10);
    }
    return;
  }
  if (stage.interaction === 'place_number_line_marker') {
    const tick = wrong ? (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1) : stage.numberLine.targetTick;
    await page.evaluate(`(() => { const el=document.querySelector('.decimal-number-line-slider'); if(!el) throw Error('number-line slider missing'); el.value=${tick}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  } else if (stage.interaction === 'adjust_circle_radius') {
    const radius = wrong ? stage.circleRules.allowedRadii.find((value) => value !== stage.circleRules.targetRadius) : stage.circleRules.targetRadius;
    await page.evaluate(`(() => { const el=document.querySelector('.circle-radius-slider'); if(!el) throw Error('circle radius slider missing'); el.value=${radius}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  } else if (stage.interaction === 'choose_response') {
    const optionId = wrong ? stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id : stage.correctOptionIds[0];
    const option = stage.options.find(({ id }) => id === optionId);
    await page.click('.candidate-category', option.text);
  } else if (stage.interaction === 'classify_observations') {
    for (const observation of stage.observations) {
      let categoryId = stage.correctAssignments[observation.id];
      if (wrong && observation === stage.observations[0]) categoryId = stage.categories.find(({ id }) => id !== categoryId).id;
      const category = stage.categories.find(({ id }) => id === categoryId);
      await page.evaluate(`(() => { const card=document.querySelector('.candidate-classification-card[data-observation-id="${observation.id}"]'); const button=[...(card?.querySelectorAll('button.candidate-category')??[])].find(el=>el.textContent.trim()===${JSON.stringify(category.label)}); if(!button) throw Error('classification control missing'); button.click(); return true; })()`);
    }
  } else if (stage.interaction === 'build_frequency_table') {
    for (const observation of stage.observations) {
      let categoryId = stage.correctAssignments[observation.id];
      if (wrong && observation === stage.observations[0]) categoryId = stage.categories.find(({ id }) => id !== categoryId).id;
      const category = stage.categories.find(({ id }) => id === categoryId);
      await page.evaluate(`(() => { const card=document.querySelector('.candidate-classification-card[data-observation-id="${observation.id}"]'); const button=[...(card?.querySelectorAll('button.candidate-category')??[])].find(el=>el.textContent.trim()===${JSON.stringify(category.label)}); if(!button) throw Error('frequency-table assignment control missing'); button.click(); return true; })()`);
      await page.wait(50);
      const pressed = await page.evaluate(`(() => { const card=document.querySelector('.candidate-classification-card[data-observation-id="${observation.id}"]'); return [...(card?.querySelectorAll('button.candidate-category')??[])].some(el=>el.textContent.trim()===${JSON.stringify(category.label)} && el.getAttribute('aria-pressed')==='true'); })()`);
      assert(pressed, `frequency-table assignment was not retained for ${observation.text} -> ${category.label}`);
      if (process.env.DEBUG_ACCEPTANCE === '1') console.log(`assignment ${observation.id}: ${pressed}; assigned=${await page.evaluate("document.querySelectorAll('.candidate-classification-card button.candidate-category[aria-pressed=\\\"true\\\"]').length")}`);
    }
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) {
      const value = wrong && step === stage.calculationSteps[0]
        ? step.choices.find(({ value: choiceValue }) => choiceValue !== step.expectedValue).value
        : step.expectedValue;
      const choice = step.choices.find(({ value: choiceValue }) => choiceValue === value);
      await page.evaluate(`(() => { const rows=[...document.querySelectorAll('.calculation-step-row')]; const row=rows.find(el=>el.querySelector('legend')?.textContent.trim()===${JSON.stringify(step.label)}); const button=[...(row?.querySelectorAll('button.candidate-token')??[])].find(el=>el.textContent.trim()===${JSON.stringify(String(choice.label ?? choice.value))}); if(!button) throw Error('calculation control missing'); button.click(); return true; })()`);
    }
  } else if (stage.interaction === 'build_place_value_blocks') {
    const rules = stage.placeValueRules;
    const labels = { thousands: '千位', hundreds: '百位', tens: '十位', ones: '個位' };
    if (rules.allowedExchanges.length) {
      const { from, to } = rules.allowedExchanges[0];
      const exchangeLabel = `1 個${labels[from]} → 10 個${labels[to]}`;
      await page.click('#catalog-task-content .place-value-exchange-controls button', exchangeLabel);
      if (wrong) await page.click(`#catalog-task-content button[aria-label="增加一個${labels.ones}積木"]`);
    } else {
      for (const place of Object.keys(labels)) {
        const target = rules.targetCounts[place] - (wrong && place === 'ones' ? 1 : 0);
        for (let i = 0; i < target; i += 1) await page.click(`#catalog-task-content button[aria-label="增加一個${labels[place]}積木"]`);
      }
    }
  } else if (stage.interaction === 'operate_vertical_calculation') {
    for (const [index, step] of stage.calculationSteps.entries()) {
      const target = wrong && index === 0 ? Math.max(step.minValue, step.expectedValue - 1) : step.expectedValue;
      const controlLabel = step.kind === 'digit' ? `${step.placeLabel}結果增加一` : `${step.label}數值增加一`;
      for (let value = step.initialValue ?? 0; value < target; value += 1) {
        await page.click(`#catalog-task-content button[aria-label="${controlLabel}"]`);
      }
    }
  } else if (stage.interaction === 'build_array') {
    const { targetRows, targetColumns } = stage.arrayRules;
    const rows = wrong ? Math.max(1, targetRows - 1) : targetRows;
    for (const [count, label] of [[rows, '增加一排'], [targetColumns, '每排多一個']]) {
      for (let index = 0; index < count; index += 1) await page.click('#catalog-task-content button.candidate-token', label);
    }
  } else if (stage.interaction === 'compose_pattern') {
    const sequence = [...stage.patternRules.targetPattern];
    if (wrong) sequence[0] = stage.tokens.find(({ id }) => id !== sequence[0]).id;
    for (const tokenId of sequence) {
      const token = stage.tokens.find(({ id }) => id === tokenId);
      await page.click('#catalog-task-content .candidate-token-list button.candidate-token', token.text);
    }
  } else if (stage.interaction === 'set_estimate_range') {
    const { inputRange, acceptableRange } = stage.estimateRules;
    const value = wrong ? inputRange.min : Math.ceil(acceptableRange.min / inputRange.step) * inputRange.step;
    await page.evaluate(`(() => { const el=document.querySelector('.estimation-range-slider'); if(!el) throw Error('estimate slider missing'); el.value=${value}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  } else if (stage.interaction === 'set_clock_time') {
    const rules = stage.clockRules;
    const targetHour = wrong ? (rules.targetHour % 12) + 1 : rules.targetHour;
    const targetMinute = wrong ? (rules.targetMinute + rules.minuteStep) % 60 : rules.targetMinute;
    const hourSteps = (targetHour - rules.initialHour + 12) % 12;
    const minuteSteps = ((targetMinute - rules.initialMinute + 60) % 60) / rules.minuteStep;
    for (let i = 0; i < hourSteps; i += 1) await page.click('#catalog-task-content button.candidate-token', '時針向前一小時');
    for (let i = 0; i < minuteSteps; i += 1) await page.click('#catalog-task-content button.candidate-token', '分針向前五分鐘');
  } else if (stage.interaction === 'build_volume') {
    const { target } = stage.volumeRules;
    const dimensions = wrong ? { ...target, rows: target.rows === 1 ? 2 : target.rows - 1 } : target;
    const controls = [
      ['rows', '增加一排'], ['columns', '每排多一個'], ['layers', '增加一層'],
    ];
    for (const [dimension, label] of controls) {
      for (let i = 0; i < dimensions[dimension]; i += 1) await page.click('#catalog-task-content button.candidate-token', label);
    }
  } else if (stage.interaction === 'complete_symmetry_grid') {
    const rules = stage.symmetryRules;
    const cells = wrong ? [rules.fillableCellIds.find((id) => !rules.targetCellIds.includes(id)), ...rules.targetCellIds.slice(1)] : rules.targetCellIds;
    for (const cellId of cells) {
      const clicked = await page.evaluate(`(() => { const selector='#catalog-task-content .symmetry-grid-cell[data-cell-id="${cellId}"]'; const cell=document.querySelector(selector); if(!cell || cell.disabled) throw Error('symmetry cell control missing or disabled: ${cellId}'); cell.click(); return document.querySelector(selector)?.getAttribute('aria-pressed')==='true'; })()`);
      assert(clicked, `symmetry grid did not retain ${cellId}`);
    }
  } else if (stage.interaction === 'plot_line_chart') {
    for (const [index, point] of stage.plotRules.points.entries()) {
      const value = wrong && index === 0 ? stage.plotRules.valueOptions.find((candidate) => candidate !== point.value) : point.value;
      const clicked = await page.evaluate(`(() => { const findRow=()=>[...document.querySelectorAll('#catalog-task-content .line-chart-point-row')].find(el=>el.querySelector('legend')?.textContent.startsWith(${JSON.stringify(point.label)})); const row=findRow(); const button=[...(row?.querySelectorAll('button.candidate-token')??[])].find(el=>el.textContent.trim()===${JSON.stringify(String(value))}); if(!button) throw Error('line chart point control missing: ${point.id}=${value}'); button.click(); const updatedRow=findRow(); const updated=[...(updatedRow?.querySelectorAll('button.candidate-token')??[])].find(el=>el.textContent.trim()===${JSON.stringify(String(value))}); return updated?.getAttribute('aria-pressed')==='true'; })()`);
      assert(clicked, `line chart value was not retained for ${point.id}`);
    }
  } else if (stage.interaction === 'assemble_response') {
    for (const tokenId of (wrong ? [...stage.correctOptionIds].reverse() : stage.correctOptionIds)) {
      const token = stage.tokens.find(({ id }) => id === tokenId);
      await page.evaluate(`(() => { const button=[...document.querySelectorAll('#catalog-task-content button.candidate-token')].find(el=>el.textContent.trim()===${JSON.stringify(token.text)}); if(!button) throw Error('phrase token control missing'); button.click(); return true; })()`);
    }
  } else if (stage.interaction === 'collect_evidence') {
    const optionIds = wrong ? [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id] : stage.correctOptionIds;
    for (const optionId of optionIds) {
      const option = stage.options.find(({ id }) => id === optionId);
      await page.evaluate(`(() => { const button=[...document.querySelectorAll('#catalog-task-content button.candidate-category')].find(el=>el.textContent.trim()===${JSON.stringify(option.text)}); if(!button) throw Error('evidence control missing'); button.click(); return true; })()`);
    }
  } else if (stage.interaction === 'order_items') {
    const target = wrong ? [...stage.correctItemIds].reverse() : stage.correctItemIds;
    for (let targetIndex = 0; targetIndex < target.length; targetIndex += 1) {
      const itemText = stage.items.find(({ id }) => id === target[targetIndex]).text;
      let currentIndex = await page.evaluate(`(() => [...document.querySelectorAll('#catalog-task-content .candidate-order-row')].findIndex(el=>el.querySelector('.candidate-order-text')?.textContent.trim()===${JSON.stringify(itemText)}))()`);
      while (currentIndex > targetIndex) {
        await page.evaluate(`(() => { const rows=[...document.querySelectorAll('#catalog-task-content .candidate-order-row')]; const row=rows[${currentIndex}]; const button=row?.querySelector('button[aria-label$="往前移"]'); if(!button) throw Error('order up control missing'); button.click(); return true; })()`);
        await page.wait(35); currentIndex -= 1;
      }
      while (currentIndex < targetIndex) {
        await page.evaluate(`(() => { const rows=[...document.querySelectorAll('#catalog-task-content .candidate-order-row')]; const row=rows[${currentIndex}]; const button=row?.querySelector('button[aria-label$="往後移"]'); if(!button) throw Error('order down control missing'); button.click(); return true; })()`);
        await page.wait(35); currentIndex += 1;
      }
    }
  }
  await page.wait(70);
}

async function navigateToTask(page, task) {
  await page.click('#start-button');
  await page.click(`.grade-option[data-grade-id="${task.gradeId}"]`);
  await page.click(`.grade-subject-card[data-subject-id="${task.subjectId}"]`);
  await page.waitFor(`!!document.querySelector('.catalog-task-launch[data-activity-id="${task.activityId}"]')`, `catalog entry for ${task.activityId}`);
  await page.click(`.catalog-task-launch[data-activity-id="${task.activityId}"]`);
  await page.waitFor(`!document.querySelector('#catalog-task-screen').hidden && document.querySelector('#catalog-task-title').textContent===${JSON.stringify(task.title)}`, `task ${task.title}`);
  await page.click('#catalog-task-content button.button-primary');
}

async function testTask(page, task, viewport, captureError) {
  const taskResult = { activityId: task.activityId, gradeId: task.gradeId, subjectId: task.subjectId, status: 'passed', stageCount: task.stages.length, stages: [] };
  for (const [stageIndex, stage] of task.stages.entries()) {
    const stageResult = { stageId: stage.stageId, interaction: stage.interaction, hintLevels: [], wrongAnswer: null, retry: null, correctAnswer: null };
    await page.waitFor(`document.querySelector('#catalog-task-content .reading-stage-heading')?.textContent.includes('挑戰 ${stageIndex + 1}')`, `stage ${stage.stageId}`);
    await page.click('#catalog-task-content .reading-task-controls button.button-secondary', '查看提示');
    stageResult.hintLevels.push(await page.evaluate("document.querySelector('#catalog-task-content .reading-hint')?.textContent.trim()"));
    await page.click('#catalog-task-content .reading-task-controls button.button-secondary', '查看提示');
    stageResult.hintLevels.push(await page.evaluate("document.querySelector('#catalog-task-content .reading-hint')?.textContent.trim()"));
    assert(stageResult.hintLevels[0]?.startsWith('提示 1：') && stageResult.hintLevels[1]?.startsWith('提示 2：'), `${task.activityId}/${stage.stageId}: both hints did not display`);
    await chooseAnswer(page, stage, true);
    await page.waitFor("!document.querySelector('#catalog-task-content .reading-task-controls button.button-primary')?.disabled", `complete wrong response ${stage.stageId}`);
    await page.click('#catalog-task-content .reading-task-controls button.button-primary');
    await page.waitFor("document.querySelector('#catalog-task-content .reading-task-feedback.is-incorrect')", `incorrect feedback ${stage.stageId}`);
    stageResult.wrongAnswer = await page.evaluate("document.querySelector('#catalog-task-content .reading-task-feedback')?.textContent.trim()");
    assert(stageResult.wrongAnswer?.length > 0, `${stage.stageId}: empty incorrect feedback`);
    if (stageIndex === 0) await page.screenshot(path.join(runDir, `${viewport.width}x${viewport.height}-${task.activityId}-incorrect.png`));
    await page.click('#catalog-task-content button.button-primary', '重新觀察並重試');
    stageResult.retry = await page.evaluate("document.querySelector('#catalog-task-content .reading-stage-heading')?.textContent.trim()");
    await chooseAnswer(page, stage, false);
    await page.waitFor("!document.querySelector('#catalog-task-content .reading-task-controls button.button-primary')?.disabled", `complete correct response ${stage.stageId}`);
    await page.click('#catalog-task-content .reading-task-controls button.button-primary');
    await page.waitFor("document.querySelector('#catalog-task-content .reading-task-feedback.is-correct')", `correct feedback ${stage.stageId}`);
    stageResult.correctAnswer = await page.evaluate("document.querySelector('#catalog-task-content .reading-task-feedback')?.textContent.trim()");
    assert(stageResult.correctAnswer?.length > 0, `${stage.stageId}: empty correct feedback`);
    taskResult.stages.push(stageResult);
    await page.click('#catalog-task-content button.button-primary', '繼續下一個挑戰');
  }
  await page.waitFor("document.querySelector('#catalog-task-content h2')?.textContent.includes('候選任務完成')", `completion ${task.activityId}`);
  taskResult.completion = await page.evaluate("document.querySelector('#catalog-task-content').innerText");
  assert(taskResult.completion.includes(`完成 ${task.stages.length} 個階段，共 ${task.stages.length * 2} 次作答嘗試`), `${task.activityId}: completion did not retain wrong and retry attempts`);
  await page.screenshot(path.join(runDir, `${viewport.width}x${viewport.height}-${task.activityId}-completed.png`));
  await page.click('#catalog-task-content button.button-primary', '再玩一次');
  await page.waitFor("document.querySelector('#catalog-task-content button.button-primary')?.textContent.includes('開始')", `restart ${task.activityId}`);
  taskResult.replay = 'passed; returned to intro with fresh memory session';
  await page.click('#catalog-task-screen [data-go="select"]');
  await page.waitFor("!document.querySelector('#select-screen').hidden", 'return to curriculum catalog');
  taskResult.returnToCatalog = 'passed';
  const overflow = await page.evaluate('({innerWidth, documentWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth, horizontal:document.documentElement.scrollWidth>innerWidth || document.body.scrollWidth>innerWidth})');
  taskResult.layout = overflow;
  assert(!overflow.horizontal, `${viewport.width}x${viewport.height}: horizontal overflow after ${task.activityId}: ${JSON.stringify(overflow)}`);
  return taskResult;
}

async function runViewport(viewport) {
  const reuseHeadlessTarget = process.env.HEADLESS_REUSE_TARGET === '1';
  const target = reuseHeadlessTarget
    ? (await requestJson(`${cdpBase}/json/list`)).find(({ type }) => type === 'page')
    : await requestJson(`${cdpBase}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  assert(target?.webSocketDebuggerUrl, 'No isolated browser page target is available');
  const page = new CdpPage(target.webSocketDebuggerUrl);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Log.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    await page.send('Page.navigate', { url: origin });
    await page.waitFor("document.readyState==='complete' && !!document.querySelector('#start-button')", 'home screen load');
    const storageBefore = await page.evaluate('JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])))');
    const result = { viewport: `${viewport.width}x${viewport.height}`, startedAt: new Date().toISOString(), tasks: [], storageBefore: JSON.parse(storageBefore), consoleErrors: page.events.consoleErrors, consoleWarnings: page.events.consoleWarnings, requestFailures: page.events.requestFailures, httpErrors: page.events.httpErrors };
    for (const [i, task] of tasksToVerify.entries()) {
      await navigateToTask(page, task);
      result.tasks.push(await testTask(page, task, viewport, i === 0));
    }
    const storageAfter = await page.evaluate('JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])))');
    result.storageAfter = JSON.parse(storageAfter);
    result.localStorageUnchanged = JSON.stringify(result.storageBefore) === JSON.stringify(result.storageAfter);
    result.horizontalOverflowAny = result.tasks.some(({ layout }) => layout.horizontal);
    result.finishedAt = new Date().toISOString();
    result.status = result.tasks.length === tasksToVerify.length && result.localStorageUnchanged && !result.horizontalOverflowAny ? 'passed' : 'failed';
    assert(result.localStorageUnchanged, `localStorage changed at ${result.viewport}`);
    assert(!result.consoleErrors.length && !result.requestFailures.length && !result.httpErrors.length, `Browser errors at ${result.viewport}`);
    return result;
  } catch (error) {
    await page.screenshot(path.join(runDir, `${viewport.width}x${viewport.height}-failure.png`)).catch(() => {});
    throw Object.assign(error, { browserEvents: page.events });
  } finally {
    page.close();
    if (!reuseHeadlessTarget) await fetch(`${cdpBase}/json/close/${target.id}`).catch(() => {});
  }
}

fs.mkdirSync(runDir, { recursive: true });
try {
  const metadata = await requestJson(`${cdpBase}/json/version`);
  report.browser = metadata.Browser;
  for (const viewport of viewports) {
    const result = await runViewport(viewport);
    report.viewports.push(result);
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = { message: error.message, browserEvents: error.browserEvents ?? null, stack: error.stack };
} finally {
  report.completedAt = new Date().toISOString();
  const currentReportPath = path.join(outputDir, 'report.json');
  fs.mkdirSync(path.join(outputDir, 'history'), { recursive: true });
  if (fs.existsSync(currentReportPath)) {
    const prior = readJsonFile(currentReportPath);
    const priorId = prior.reportId ?? `prior-${Date.now()}`;
    const historyPath = path.join(outputDir, 'history', `${priorId}.json`);
    if (!fs.existsSync(historyPath)) fs.copyFileSync(currentReportPath, historyPath);
  }
  fs.writeFileSync(path.join(runDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(currentReportPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify({ status: report.status, browser: report.browser, source: report.source, outputDir: runDir, viewports: report.viewports.map(({ viewport, status, tasks, localStorageUnchanged, horizontalOverflowAny, consoleErrors, requestFailures, httpErrors }) => ({ viewport, status, taskCount: tasks.length, localStorageUnchanged, horizontalOverflowAny, consoleErrors: consoleErrors.length, requestFailures: requestFailures.length, httpErrors: httpErrors.length })), failure: report.failure?.message }, null, 2));
if (report.status !== 'passed') process.exitCode = 1;
