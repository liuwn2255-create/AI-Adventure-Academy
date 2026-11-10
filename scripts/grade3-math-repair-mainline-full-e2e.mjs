import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { GRADE3_MATH_REPAIR_MAINLINE as route } from '../prototype/data/grade3MathRepairMainline.js';
import { CATALOG_CANDIDATE_TASK_BY_ID as tasksById } from '../prototype/data/catalogCandidateTasks.js';

const cdpUrl = process.env.CDP_URL;
const targetUrl = process.env.PROTOTYPE_URL;
const reportPath = process.env.REPORT_PATH ?? fileURLToPath(new URL('../artifacts/grade3-math-repair-mainline-full-e2e.json', import.meta.url));
if (!cdpUrl || !targetUrl) throw new Error('Set CDP_URL and PROTOTYPE_URL to dedicated isolated test endpoints.');
const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const pageTarget = targets.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!pageTarget?.webSocketDebuggerUrl) throw new Error(`No isolated browser page at ${targetUrl}`);

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
let messageId = 0;
const pending = new Map();
const diagnostics = { consoleErrors: [], exceptions: [], failedRequests: [], badResponses: [] };
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
    }
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push({ error: message.params.errorText, canceled: message.params.canceled });
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
});
function send(method, params = {}) {
  const id = ++messageId;
  const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  socket.send(JSON.stringify({ id, method, params }));
  return result;
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  return response.result?.value;
}
const wait = (ms = 45) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression, description, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await wait(50);
  }
  throw new Error(`Timed out: ${description}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}; text=${(await evaluate('document.body.innerText')).slice(-500)}`);
}
async function click(selector, text, { exact = true } = {}) {
  const expression = `(() => {const candidates=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length);const target=candidates.find(e=>{const t=e.innerText.replace(/\\s+/g,' ').trim();return ${exact ? 't===' : 't.includes('}${JSON.stringify(text)}${exact ? '' : ')'}});if(!target)return null;target.scrollIntoView({block:'center',inline:'nearest'});target.click();return target.innerText.trim()})()`;
  const clicked = await evaluate(expression);
  if (clicked === null) throw new Error(`Could not click ${selector}: ${text}`);
  await wait();
  return clicked;
}
async function clickText(text, options = {}) { return click('button', text, options); }
async function clickOne(selector) {
  const result = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!result) throw new Error(`Control unavailable: ${selector}`);
  await wait();
}
async function setRange(selector, value, ariaLabel) {
  const result = await evaluate(`(()=>{const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})];const e=${ariaLabel === undefined ? 'nodes[0]' : `nodes.find(n=>n.getAttribute('aria-label')===${JSON.stringify(ariaLabel)})`};if(!e)return false;e.value=String(${Number(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return Number(e.value)})()`);
  if (result === false) throw new Error(`Range control unavailable: ${selector} (${ariaLabel ?? ''})`);
  await wait(30);
}
async function layout(viewport) {
  const result = await evaluate('({innerWidth,innerHeight,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,screen:document.querySelector(".screen:not([hidden])")?.id})');
  if (result.documentWidth > result.innerWidth || result.bodyWidth > result.innerWidth) throw new Error(`Horizontal overflow at ${viewport.name}: ${JSON.stringify(result)}`);
  return result;
}
async function navigateMap() {
  await send('Page.navigate', { url: targetUrl });
  await waitFor('document.readyState === "complete" && document.querySelector("#home-screen")?.hidden === false && document.querySelector("#start-button")?.getClientRects().length > 0', 'home screen');
  await clickText('開始探險', { exact: false });
  await waitFor('document.body.innerText.includes("選擇年級")', 'grade selection');
  await clickOne('#grade-options [data-grade-id="grade-3"]');
  await clickOne('#grade-subject-directory [data-subject-id="mathematics"]');
  await clickOne('#grade-subject-open-map');
  await waitFor('document.querySelector("#grade3-math-adventure-map")', 'grade three math adventure map');
  await waitFor('document.querySelector("#grade3-math-repair-mainline")', 'number island mainline');
  const found = await evaluate(`(()=>({routeId:document.querySelector('#grade3-math-repair-mainline .grade3-math-mainline-card')?.dataset.routeId,activities:[...document.querySelectorAll('#grade3-math-repair-mainline .grade3-math-mainline-stops li')].map(e=>e.dataset.activityId)}))()`);
  if (found.routeId !== route.routeId || JSON.stringify(found.activities) !== JSON.stringify(route.stops.map(({ activityId }) => activityId))) throw new Error(`Route map activity IDs do not match registered stops: ${JSON.stringify(found)}`);
  return found;
}
const optionButton = (text) => click('#catalog-task-content .candidate-category', text);
async function answerStage(task, stage, wrong) {
  const chooseOption = (correct) => {
    const selected = correct ? stage.options.find(({ id }) => stage.correctOptionIds.includes(id)) : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    if (!selected) throw new Error(`Missing ${correct ? 'correct' : 'incorrect'} option: ${task.activityId}/${stage.stageId}`);
    return optionButton(selected.text);
  };
  if (stage.interaction === 'build_place_value_blocks') {
    const rules = stage.placeValueRules;
    const labels = { thousands: '千位', hundreds: '百位', tens: '十位', ones: '個位' };
    if (rules.allowedExchanges.length) {
      const { from, to } = rules.allowedExchanges[0];
      await click('#catalog-task-content .place-value-exchange-controls button', `1 個${labels[from]} → 10 個${labels[to]}`);
      if (wrong) await clickOne('#catalog-task-content button[aria-label="增加一個個位積木"]');
    } else {
      const target = { ...rules.targetCounts };
      if (wrong) target.ones = Math.max(0, target.ones - 1);
      for (const place of Object.keys(labels)) {
        const difference = target[place] - rules.initialCounts[place];
        const action = difference >= 0 ? '增加' : '減少';
        for (let i = 0; i < Math.abs(difference); i += 1) await clickOne(`#catalog-task-content button[aria-label="${action}一個${labels[place]}積木"]`);
      }
    }
  } else if (stage.interaction === 'operate_vertical_calculation') {
    for (const [index, step] of stage.calculationSteps.entries()) {
      const value = wrong && index === 0 ? (step.expectedValue + 1 <= step.maxValue ? step.expectedValue + 1 : step.expectedValue - 1) : step.expectedValue;
      const label = step.kind === 'digit' ? `${step.placeLabel}結果` : `${step.label}數值`;
      const delta = value >= step.initialValue ? 1 : -1;
      for (let i = 0; i < Math.abs(value - step.initialValue); i += 1) await clickOne(`#catalog-task-content button[aria-label="${label}${delta > 0 ? '增加' : '減少'}一"]`);
    }
  } else if (stage.interaction === 'build_array') {
    const { targetRows, targetColumns } = stage.arrayRules;
    const rows = wrong ? Math.max(1, targetRows - 1) : targetRows;
    for (let i = 0; i < rows; i += 1) await click('#catalog-task-content button.candidate-token', '增加一排');
    for (let i = 0; i < targetColumns; i += 1) await click('#catalog-task-content button.candidate-token', '每排多一個');
  } else if (stage.interaction === 'choose_response') {
    await chooseOption(!wrong);
  } else if (stage.interaction === 'assemble_response') {
    const ids = [...stage.correctOptionIds];
    if (wrong && ids.length > 1) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (const id of ids) await click('#catalog-task-content button.candidate-token', stage.tokens.find(({ id: tokenId }) => tokenId === id).text);
  } else if (stage.interaction === 'classify_observations' || stage.interaction === 'build_frequency_table') {
    if (stage.collectionRules) {
      for (const id of stage.collectionRules.requiredObservationIds) await clickOne(`#catalog-task-content .candidate-data-sample[data-observation-id="${id}"]`);
    }
    for (const [index, observation] of stage.observations.entries()) {
      const correctId = stage.correctAssignments[observation.id];
      const categoryId = wrong && index === 0 ? stage.categories.find(({ id }) => id !== correctId).id : correctId;
      const category = stage.categories.find(({ id }) => id === categoryId);
      await click(`#catalog-task-content .candidate-classification-card[data-observation-id="${observation.id}"] .candidate-category`, category.label);
    }
  } else if (stage.interaction === 'set_estimate_range') {
    const { inputRange, acceptableRange } = stage.estimateRules;
    const correct = Math.ceil(acceptableRange.min / inputRange.step) * inputRange.step;
    await setRange('#catalog-task-content .estimation-range-slider', wrong ? inputRange.min : correct);
  } else if (stage.interaction === 'manipulate_fraction_model') {
    const rules = stage.fractionRules;
    await click('#catalog-task-content .fraction-whole-choices button', rules.wholeOptions.find(({ id }) => id === rules.targetWholeId).label);
    await click('#catalog-task-content .fraction-denominator-choices button', `平均分成 ${rules.denominator} 份`);
    const selectModel = async (id) => clickOne(`#catalog-task-content [data-fraction-group-id="${id}"] button.fraction-model-select`);
    const movePieces = async (fromIds, targetGroup, count = Infinity) => {
      await selectModel(targetGroup);
      for (const piece of rules.pieces.filter(({ initialGroupId }) => fromIds.includes(initialGroupId)).slice(0, count)) await clickOne(`#catalog-task-content [data-fraction-piece-id="${piece.id}"]`);
    };
    const sourcePieces = (group) => rules.pieces.filter(({ initialGroupId }) => initialGroupId === group).map(({ id }) => id);
    if (rules.mode === 'build') await movePieces([rules.sourceGroupId], rules.targetGroupId, rules.targetNumerator - (wrong ? 1 : 0));
    else if (rules.mode === 'compare') {
      const poolPieces = sourcePieces(rules.sourceGroupId);
      await selectModel(rules.leftGroupId);
      for (const id of poolPieces.slice(0, rules.leftNumerator)) await clickOne(`#catalog-task-content [data-fraction-piece-id="${id}"]`);
      await selectModel(rules.rightGroupId);
      for (const id of poolPieces.slice(rules.leftNumerator, rules.leftNumerator + rules.rightNumerator)) await clickOne(`#catalog-task-content [data-fraction-piece-id="${id}"]`);
      await click('#catalog-task-content .fraction-relation-choices button', wrong ? (rules.correctRelation === '<' ? '>' : '<') : rules.correctRelation);
    } else if (rules.mode === 'add') await movePieces([rules.firstOperandGroupId, rules.secondOperandGroupId], rules.resultGroupId, wrong ? rules.pieces.length - 1 : rules.pieces.length);
    else if (rules.mode === 'subtract') await movePieces([rules.startGroupId], rules.removedGroupId, rules.removedNumerator - (wrong ? 1 : 0));
    else if (rules.mode === 'make_one') await movePieces([rules.firstOperandGroupId, rules.secondOperandGroupId], rules.wholeGroupId, wrong ? rules.pieces.length - 1 : rules.pieces.length);
    else throw new Error(`Unknown fraction mode ${rules.mode}`);
  } else if (stage.interaction === 'place_number_line_marker') {
    const line = stage.numberLine;
    await setRange('#catalog-task-content .decimal-number-line-slider', wrong ? (line.targetTick + 1) % (line.tickCount + 1) : line.targetTick);
  } else if (stage.interaction === 'measure_length_model') {
    const rules = stage.lengthRules;
    const range = (label, value) => setRange('#catalog-task-content .length-measurement-slider', value, label);
    if (rules.mode === 'estimate') await range('估測長度（毫米）', wrong ? rules.estimateRange.min : rules.targetLength);
    else if (rules.mode === 'align_read') {
      const delta = rules.object.start - rules.initialRulerZero;
      const moves = wrong ? Math.max(0, delta - 1) : delta;
      for (let i = 0; i < moves; i += 1) await click('#catalog-task-content .candidate-token-list button.candidate-token', '尺往右 1 毫米');
      await range('讀取物件末端刻度（毫米）', wrong ? rules.object.length - 1 : rules.object.length);
    } else if (rules.mode === 'convert') {
      await range('公分數', wrong ? 0 : Math.floor(rules.targetMillimeters / 10));
      await range('剩餘毫米數', wrong ? 0 : rules.targetMillimeters % 10);
    } else if (rules.mode === 'compare') {
      for (const [index, object] of rules.objects.entries()) await range(`${object.label}刻度讀值（毫米）`, wrong && index === 0 ? object.length - 1 : object.length);
      const actualDifference = Math.abs(rules.objects[0].length - rules.objects[1].length);
      await range('你測得兩者相差（毫米）', wrong ? Math.max(0, actualDifference - 1) : actualDifference);
      if (Number.isInteger(rules.conversionTargetMillimeters)) {
        await range('合計的公分數', wrong ? 0 : Math.floor(rules.conversionTargetMillimeters / 10));
        await range('合計剩餘毫米數', wrong ? 0 : rules.conversionTargetMillimeters % 10);
      }
    } else throw new Error(`Unknown length mode ${rules.mode}`);
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const [index, step] of stage.calculationSteps.entries()) {
      const value = wrong && index === 0 ? step.choices.find(({ value: option }) => option !== step.expectedValue).value : step.expectedValue;
      const choice = step.choices.find(({ value: option }) => option === value);
      const row = await evaluate(`(()=>[...document.querySelectorAll('#catalog-task-content .calculation-step-row')].find(e=>e.querySelector('legend')?.textContent.trim()===${JSON.stringify(step.label)}))()`);
      if (!row) throw new Error(`Calculation step row missing: ${step.label}`);
      await click(`#catalog-task-content .calculation-step-row:nth-of-type(${index + 1}) button.candidate-token`, String(choice.label ?? choice.value));
    }
  } else throw new Error(`Unsupported route interaction: ${task.activityId}/${stage.stageId}/${stage.interaction}`);
  const state = await layout({ name: 'task-stage' });
  if (!state.screen.includes('catalog-task')) throw new Error(`Unexpected screen during stage interaction: ${state.screen}`);
}

async function completeStage(task, stage, wrong) {
  await waitFor(`document.body.innerText.includes(${JSON.stringify(stage.prompt)})`, `${task.activityId}/${stage.stageId} prompt`);
  await clickText('查看提示');
  const hint1 = await evaluate('document.querySelector("#catalog-task-content .reading-hint")?.textContent.trim()');
  await clickText('查看提示');
  const hint2 = await evaluate('document.querySelector("#catalog-task-content .reading-hint")?.textContent.trim()');
  if (!hint1?.startsWith('提示 1：') || !hint2?.startsWith('提示 2：')) throw new Error(`Two hint levels missing for ${task.activityId}/${stage.stageId}`);
  await answerStage(task, stage, true);
  const enabled = await evaluate('!document.querySelector("#catalog-task-content .reading-task-controls button.button-primary")?.disabled');
  if (!enabled) throw new Error(`Response did not activate submit: ${task.activityId}/${stage.stageId}`);
  await clickText('檢查數學解法');
  await waitFor('document.querySelector("#catalog-task-content .reading-task-feedback.is-incorrect")', `${task.activityId}/${stage.stageId} incorrect feedback`);
  const wrongFeedback = await evaluate('document.querySelector("#catalog-task-content .reading-task-feedback")?.textContent.trim()');
  if (!wrongFeedback) throw new Error(`Empty wrong-answer feedback for ${task.activityId}/${stage.stageId}`);
  await clickText('重新觀察並重試');
  await waitFor('document.querySelector("#catalog-task-content .reading-stage-heading")', `${task.activityId}/${stage.stageId} retry`);
  await answerStage(task, stage, false);
  const correctEnabled = await evaluate('!document.querySelector("#catalog-task-content .reading-task-controls button.button-primary")?.disabled');
  if (!correctEnabled) throw new Error(`Correct response did not activate submit: ${task.activityId}/${stage.stageId}`);
  await clickText('檢查數學解法');
  await waitFor('document.querySelector("#catalog-task-content .reading-task-feedback.is-correct")', `${task.activityId}/${stage.stageId} correct feedback`);
  const correctFeedback = await evaluate('document.querySelector("#catalog-task-content .reading-task-feedback")?.textContent.trim()');
  if (!correctFeedback) throw new Error(`Empty correct-answer feedback for ${task.activityId}/${stage.stageId}`);
  await clickText('繼續下一個挑戰');
  return { stageId: stage.stageId, interaction: stage.interaction, hint1, hint2, wrongFeedback, retry: 'passed', correctFeedback, completed: true };
}

async function playStop(stop, viewport) {
  const task = tasksById.get(stop.activityId);
  if (!task) throw new Error(`Missing route activity: ${stop.activityId}`);
  await waitFor(`document.querySelector("#catalog-task-screen") && !document.querySelector("#catalog-task-screen").hidden && document.querySelector("#catalog-task-title")?.textContent===${JSON.stringify(task.title.split(/[：:]/,1)[0])}`, `entered ${stop.activityId}`);
  const localBefore = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  await clickText('開始數學挑戰');
  const stages = [];
  for (const stage of task.stages) stages.push(await completeStage(task, stage, true));
  await waitFor('document.body.innerText.includes("候選任務完成！")', `${stop.activityId} completed`);
  const attempts = `完成 ${task.stages.length} 個階段，共 ${task.stages.length * 2} 次作答嘗試`;
  if (!await evaluate(`document.querySelector("#catalog-task-content")?.innerText.includes(${JSON.stringify(attempts)})`)) throw new Error(`${stop.activityId}: wrong/retry attempt count missing`);
  const story = await evaluate('document.querySelector("#catalog-task-content .candidate-route-story-progress")?.innerText');
  if (!story?.includes(`修復進度 ${stop.order}/10`) && stop.order < 10) throw new Error(`Missing route narrative progress after stop ${stop.order}: ${story}`);
  const finalTitle = stop.order === 10 ? await evaluate('document.querySelector("#catalog-task-content .candidate-route-finale-title")?.textContent') : null;
  if (stop.order === 10 && finalTitle !== '數字島修復完成！') throw new Error(`Missing route finale screen at stop ten: ${finalTitle}`);
  if (localBefore !== await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))')) throw new Error(`localStorage changed at stop ${stop.order}`);
  const nextExpected = route.stops[stop.order];
  const result = { order: stop.order, stopId: stop.stopId, activityId: stop.activityId, taskTitle: task.title, missionTitle: stop.missionTitle, stageCount: stages.length, stages, attempts, story: story ?? null, finalTitle, localStorageUnchanged: true };
  if (nextExpected) {
    const nextTask = tasksById.get(nextExpected.activityId);
    await clickText(nextExpected.missionTitle, { exact: false });
    await waitFor(`document.querySelector("#catalog-task-title")?.textContent===${JSON.stringify(nextTask.title.split(/[：:]/,1)[0])}`, `next activity ${nextExpected.activityId}`);
    result.nextActivityId = nextExpected.activityId;
    result.nextActivityTitle = nextTask.title;
  }
  return result;
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewportResults = [];
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    const map = await navigateMap();
    const localBefore = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
    await clickText('開始數字島修復任務');
    await waitFor(`document.querySelector("#catalog-task-title")?.textContent===${JSON.stringify(tasksById.get(route.stops[0].activityId).title.split(/[：:]/,1)[0])}`, 'first route task');
    const stopResults = [];
    for (const stop of route.stops) stopResults.push(await playStop(stop, viewport));
    if (stopResults.length !== 10 || stopResults.some(({ order }, i) => order !== i + 1)) throw new Error(`Route sequence invalid at ${viewport.name}`);
    if (localBefore !== await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))')) throw new Error(`Mainline changed localStorage at ${viewport.name}`);
    const finished = await evaluate('document.querySelector("#catalog-task-content .candidate-route-finale-summary")?.innerText');
    if (!finished?.includes('十站候選主線已依序完成')) throw new Error(`Final route ending missing at ${viewport.name}`);
    await clickText('返回三年級數學冒險地圖');
    await waitFor('document.querySelector("#grade3-math-adventure-map")', 'return to adventure map');
    const completedCount = await evaluate('document.querySelectorAll("#grade3-math-repair-mainline .grade3-math-mainline-stops li.is-complete").length');
    if (completedCount !== 10) throw new Error(`Map did not show ten in-memory completed stops: ${completedCount}`);
    const mapLayout = await layout(viewport);
    await clickText('重新開始主線');
    await waitFor(`document.querySelector("#catalog-task-title")?.textContent===${JSON.stringify(tasksById.get(route.stops[0].activityId).title.split(/[：:]/,1)[0])}`, 'restart from first stop');
    await clickOne('#catalog-task-screen [data-go="select"]');
    await waitFor('document.querySelector("#grade3-math-adventure-map")', 'map after restart intro return');
    const progressAfterRestart = await evaluate('document.querySelector("#grade3-math-repair-mainline .grade3-math-mainline-progress")?.textContent');
    if (!progressAfterRestart?.includes('0/10')) throw new Error(`Restart did not clear candidate in-memory route: ${progressAfterRestart}`);
    const individual = route.stops[3];
    await clickOne(`#grade3-math-adventure-regions button[data-activity-id="${individual.activityId}"]`);
    await waitFor(`document.querySelector("#catalog-task-title")?.textContent===${JSON.stringify(tasksById.get(individual.activityId).title.split(/[：:]/,1)[0])}`, 'individual station entry from map');
    await clickOne('#catalog-task-screen [data-go="select"]');
    await waitFor('document.querySelector("#grade3-math-adventure-map")', 'return from individual activity to map');
    if (localBefore !== await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))')) throw new Error(`localStorage changed after map/restart/individual entry at ${viewport.name}`);
    viewportResults.push({ viewport: viewport.name, requested: [viewport.width, viewport.height], actual: await evaluate('[innerWidth,innerHeight]'), map, allTenStopsSequentiallyCompleted: stopResults.length, stops: stopResults, finale: { title: '數字島修復完成！', summary: finished }, returnedToMap: true, allTenStopsShownComplete: completedCount, restartFromFirstStop: true, individualActivityEntryAndReturn: individual.activityId, candidateRouteResetInMemory: progressAfterRestart, localStorageUnchanged: true, mapLayout });
  }
  const out = {
    runId: 'grade3-math-repair-mainline-full-e2e', executedAt: new Date().toISOString(), source: targetUrl,
    browser: await evaluate('navigator.userAgent'), routeId: route.routeId,
    viewportResults, diagnostics,
    protectedState: { allActivityStatuses: [...new Set(route.stops.map(({ activityId }) => tasksById.get(activityId).status))], routeProgressPersistence: route.progressPersistence, formalStudentDataTouched: false, formalUnlocksChanged: false },
    limitations: ['候選主線工程驗收不代表教師審查、學生精熟或教學成效。', '任務互動透過隔離瀏覽器中的可見 UI 控制操作；部分 range 控制使用 DOM input/change 事件以設定滑桿值。', '活動本身是候選任務，內容與課綱適切性仍待教師審查。'],
  };
  if (diagnostics.consoleErrors.length || diagnostics.exceptions.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics failed: ${JSON.stringify(diagnostics)}`);
  await writeFile(reportPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, browser: out.browser, routeId: out.routeId, viewportResults: viewportResults.map(({ viewport, allTenStopsSequentiallyCompleted, returnedToMap, restartFromFirstStop, individualActivityEntryAndReturn, localStorageUnchanged }) => ({ viewport, allTenStopsSequentiallyCompleted, returnedToMap, restartFromFirstStop, individualActivityEntryAndReturn, localStorageUnchanged })), stagesTotalPerViewport: route.stops.reduce((sum, stop) => sum + tasksById.get(stop.activityId).stages.length, 0), diagnostics }, null, 2));
} finally {
  socket.close();
}
