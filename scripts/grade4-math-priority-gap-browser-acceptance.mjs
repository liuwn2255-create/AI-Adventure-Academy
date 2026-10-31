import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { GRADE4_MATH_GAP_TASKS } from '../prototype/data/grade4MathGapTasks.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set isolated PROTOTYPE_URL and CDP_URL before browser acceptance.');
const outputRoot = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade4-math-priority-gap-browser-acceptance');
fs.mkdirSync(outputRoot, { recursive: true });
const diagnostics = { exceptions: [], consoleErrors: [], failedRequests: [], badResponses: [] };
let socket;
let nextId = 0;
const pending = new Map();

async function waitFor(check, message, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const result = await check(); if (result) return result; } catch { /* await the next page update */ }
    await delay(100);
  }
  throw new Error(message);
}

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result?.value;
}

async function pageText() { return evaluate('document.body?.innerText ?? ""'); }
async function waitText(value) { await waitFor(async () => (await pageText()).includes(value), `Timed out waiting for page text: ${value}`); }
const pause = () => delay(70);

async function clickText(value) {
  const clicked = await evaluate(`(()=>{const norm=e=>e.innerText.replace(/\\s+/g,' ').trim();const b=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(norm(e)===${JSON.stringify(value)}||norm(e).includes(${JSON.stringify(value)})));if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
  if (!clicked) throw new Error(`Button unavailable: ${value}`);
  await pause();
}

async function layout() {
  const value = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth]})');
  if (value.document[1] > value.document[0] || value.body[1] > value.body[0]) throw new Error(`Horizontal overflow: ${JSON.stringify(value)}`);
  return value;
}

async function storage() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))'); }

async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const file = path.join(outputRoot, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}

async function chooseActivity(activityId) {
  const clicked = await evaluate(`(()=>{const b=document.querySelector('.catalog-task-launch[data-activity-id="${activityId}"]');if(!b)return false;b.click();return true})()`);
  if (!clicked) throw new Error(`Activity is not reachable from Grade 4 mathematics directory: ${activityId}`);
  await pause();
}

async function enterTask(viewport, task, baseline) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  await send('Page.navigate', { url: targetUrl });
  await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'Prototype page did not load.');
  await waitText('開始探險');
  const layouts = [await layout()];
  await clickText('開始探險'); await waitText('選擇年級');
  await clickText('四年級'); await waitText('學習領域與科目');
  await clickText('數學'); await waitText('數學');
  await chooseActivity(task.activityId); await waitText(task.title); await waitText('候選目標：');
  layouts.push(await layout());
  const introScreenshot = await screenshot(`${viewport.name}-${task.activityId}-intro`);
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed before play.`);
  await clickText('開始數學挑戰');
  return { layouts, introScreenshot };
}

async function clickQuadrilateralPoints(pointIds) {
  const clicked = await evaluate(`(()=>{for(const id of ${JSON.stringify(pointIds)}){const b=document.querySelector('[data-quadrilateral-point="'+id+'"]');if(!b)return false;b.click()}return true})()`);
  if (!clicked) throw new Error('Could not select all four grid vertices.');
  await pause();
}

async function clickArrayDimension(label, count) {
  for (let index = 0; index < count; index += 1) await clickText(label);
}

async function setWrongArray(stage) {
  const rows = stage.arrayRules.targetRows === 2 ? 1 : 2;
  const columns = stage.arrayRules.targetColumns === 3 ? 2 : stage.arrayRules.targetColumns - 1;
  await clickArrayDimension('增加一排', rows);
  await clickArrayDimension('每排多一個', columns);
}

async function setCorrectArray(stage) {
  await clickArrayDimension('增加一排', stage.arrayRules.targetRows);
  await clickArrayDimension('每排多一個', stage.arrayRules.targetColumns);
}

async function selectCalculationValue(stepIndex, value) {
  const clicked = await evaluate(`(()=>{const row=document.querySelectorAll('.calculation-step-row')[${stepIndex}];if(!row)return false;const b=[...row.querySelectorAll('button')].find(e=>e.innerText.trim()===${JSON.stringify(String(value))});if(!b)return false;b.click();return true})()`);
  if (!clicked) throw new Error(`Calculation control ${stepIndex}=${value} unavailable.`);
  await pause();
}

function correctQuadrilateral(stageId) {
  return {
    'construct-square-on-grid': ['r0c0', 'r0c2', 'r2c2', 'r2c0'],
    'construct-rectangle-on-grid': ['r0c0', 'r0c3', 'r2c3', 'r2c0'],
    'construct-parallelogram-on-grid': ['r0c1', 'r1c3', 'r3c2', 'r2c0'],
  }[stageId];
}

async function respond(task, stage, correct) {
  if (task.activityId === 'ACT-G4-MATH-QUADRILATERAL-FEATURE-CONSTRUCTION-CANDIDATE') {
    await clickQuadrilateralPoints(correct ? correctQuadrilateral(stage.stageId) : ['r0c0', 'r0c2', 'r3c3', 'r2c0']);
  } else if (stage.interaction === 'build_array') {
    await (correct ? setCorrectArray(stage) : setWrongArray(stage));
  } else if (stage.interaction === 'set_estimate_range') {
    const rules = stage.estimateRules;
    const value = correct
      ? Math.ceil(((rules.acceptableRange.min + rules.acceptableRange.max) / 2 - rules.inputRange.min) / rules.inputRange.step) * rules.inputRange.step + rules.inputRange.min
      : rules.inputRange.min;
    const changed = await evaluate(`(()=>{const input=document.querySelector('.estimation-range-slider');if(!input)return false;input.value=${value};input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    if (!changed) throw new Error('Estimate slider unavailable.');
  } else if (stage.interaction === 'place_number_line_marker') {
    const tick = correct ? stage.numberLine.targetTick : (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1);
    const changed = await evaluate(`(()=>{const input=document.querySelector('.decimal-number-line-slider');if(!input)return false;input.value=${tick};input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    if (!changed) throw new Error('Number-line slider unavailable.');
  } else {
    for (const [index, step] of stage.calculationSteps.entries()) await selectCalculationValue(index, correct ? step.expectedValue : step.choices.find(({ value }) => value !== step.expectedValue).value);
  }
}

async function runStage(task, stage) {
  await waitText(stage.prompt);
  await clickText('查看提示'); await waitText('提示 1：');
  const hintOne = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await clickText('查看提示'); await waitText('提示 2：');
  const hintTwo = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await respond(task, stage, false);
  await clickText('檢查數學解法');
  await waitText('重新觀察並重試');
  const wrongFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
  if (!wrongFeedback || wrongFeedback.includes('response_required')) throw new Error(`${task.activityId}/${stage.stageId}: wrong input did not reach actionable feedback.`);
  await clickText('重新觀察並重試');
  await respond(task, stage, true);
  await clickText('檢查數學解法');
  await waitText('繼續下一個挑戰');
  const successFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
  if (!successFeedback) throw new Error(`${task.activityId}/${stage.stageId}: correct feedback missing.`);
  return { stageId: stage.stageId, hintOne, hintTwo, wrongFeedback, successFeedback };
}

async function runTask(viewport, task) {
  const baseline = await storage();
  const { layouts, introScreenshot } = await enterTask(viewport, task, baseline);
  const stages = [];
  for (const [index, stage] of task.stages.entries()) {
    layouts.push(await layout());
    stages.push(await runStage(task, stage));
    await clickText('繼續下一個挑戰');
    if (index < task.stages.length - 1) await waitText(task.stages[index + 1].prompt);
  }
  await waitText('候選任務完成！');
  layouts.push(await layout());
  const completionScreenshot = await screenshot(`${viewport.name}-${task.activityId}-completed`);
  const completion = await pageText();
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed during play.`);
  await clickText('再玩一次'); await waitText('開始數學挑戰');
  await clickText('開始數學挑戰'); await waitText(task.stages[0].prompt);
  await evaluate('document.querySelector("#catalog-task-screen [data-go=select]")?.click()');
  await waitText('學習領域與科目');
  if (!(await pageText()).includes('數學')) throw new Error(`${task.activityId}: return failed to Grade 4 subject directory.`);
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed after replay or return.`);
  return { viewport: `${viewport.width}x${viewport.height}`, activityId: task.activityId, status: 'passed', stages, completionVisible: completion.includes('候選任務完成！'), replay: 'passed', returnToDirectory: 'passed', localStorageUnchanged: true, layoutsChecked: layouts, introScreenshot, completionScreenshot };
}

try {
  const version = await fetch(`${cdpUrl}/json/version`);
  if (!version.ok) throw new Error(`CDP endpoint unavailable: HTTP ${version.status}`);
  const target = await waitFor(async () => {
    const response = await fetch(`${cdpUrl}/json/list`).catch(() => null);
    return response?.ok ? (await response.json()).find(({ type, url }) => type === 'page' && url.startsWith(targetUrl)) : null;
  }, `No isolated browser page opened at ${targetUrl}`);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const resolver = pending.get(message.id);
      if (resolver) { pending.delete(message.id); message.error ? resolver.reject(new Error(message.error.message)) : resolver.resolve(message.result); }
    } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
    else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const ids = [
    'ACT-G4-MATH-KILOMETER-ROUTE-AND-CONVERSION-CANDIDATE',
    'ACT-G4-MATH-SQUARE-METER-FLOOR-PLANNER-CANDIDATE',
  ];
  const tasks = ids.map((id) => GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === id));
  if (tasks.some((task) => !task)) throw new Error('A requested Grade 4 task is absent from runtime data.');
  const runs = [];
  for (const viewport of viewports) for (const task of tasks) runs.push(await runTask(viewport, task));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics reported failures: ${JSON.stringify(diagnostics)}`);
  const executedAt = new Date().toISOString();
  const browser = await evaluate('navigator.userAgent');
  const reportId = `g4-math-priority-gap-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const report = { reportId, targetUrl, status: 'passed', activityCount: tasks.length, viewportCount: viewports.length, flowCount: runs.length, runs, diagnostics, limitations: ['CDP 於隔離 Chrome profile 的本機原型執行端到端流程與 viewport 模擬；僅為工程驗收，不代表教師審查或學生學習成效。'] };
  fs.writeFileSync(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const viewportsReport = viewports.map((viewport) => ({
    viewport: `${viewport.width}x${viewport.height}`,
    status: 'passed',
    localStorageUnchanged: true,
    horizontalOverflowAny: false,
    consoleErrors: diagnostics.consoleErrors,
    requestFailures: diagnostics.failedRequests,
    httpErrors: diagnostics.badResponses,
    tasks: runs.filter(({ viewport: value }) => value === `${viewport.width}x${viewport.height}`).map(({ activityId, stages, completionVisible, replay, returnToDirectory }) => ({ activityId, gradeId: 'grade-4', subjectId: 'mathematics', status: 'passed', stageCount: stages.length, stages, completionVisible, replay, returnToDirectory })),
  }));
  const evidence = { reportId, evidenceType: 'isolated_browser_acceptance', executedAt, browser, source: targetUrl, profile: process.env.BROWSER_PROFILE ?? 'isolated profile label not provided', status: 'passed', viewports: viewportsReport, evidenceSourcePath: null };
  const runId = `g4-math-priority-gap-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8)}`;
  const evidenceDirectory = path.resolve('artifacts/learning-subitems-browser-acceptance/runs', runId);
  fs.mkdirSync(evidenceDirectory, { recursive: false });
  fs.writeFileSync(path.join(evidenceDirectory, 'report.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ report: path.join(outputRoot, 'report.json'), evidenceReport: path.relative(process.cwd(), path.join(evidenceDirectory, 'report.json')), reportId, flowCount: runs.length, diagnostics }, null, 2));
} finally { socket?.close(); }
