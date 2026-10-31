import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { GRADE4_MATH_GAP_TASKS, GRADE4_MATH_COMPOUND_EXPRESSION_ORDER } from '../prototype/data/grade4MathGapTasks.js';
import { GRADE4_MATH_TWO_STEP_SUPPLY } from '../prototype/data/grade4CandidateTasks.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set isolated PROTOTYPE_URL and CDP_URL before browser acceptance.');
const outputRoot = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade4-two-step-order-browser-acceptance');
fs.mkdirSync(outputRoot, { recursive: true });
const diagnostics = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };
let socket;
let nextId = 0;
const pending = new Map();

async function waitFor(check, message, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const result = await check(); if (result) return result; } catch { /* wait for page transition */ }
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

const pause = () => delay(80);
async function text() { return evaluate('document.body?.innerText ?? ""'); }
async function waitText(value) { await waitFor(async () => (await text()).includes(value), `Timed out waiting for text: ${value}`); }
async function clickText(value) {
  const clicked = await evaluate(`(()=>{const norm=e=>e.innerText.replace(/\\s+/g,' ').trim();const b=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(norm(e)===${JSON.stringify(value)}||norm(e).includes(${JSON.stringify(value)})));if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
  if (!clicked) throw new Error(`Button unavailable: ${value}`);
  await pause();
}
async function clickActivity(activityId) {
  const clicked = await evaluate(`(()=>{const b=document.querySelector('.catalog-task-launch[data-activity-id="${activityId}"]');if(!b)return false;b.click();return true})()`);
  if (!clicked) throw new Error(`Activity not reachable from the selected subject directory: ${activityId}`);
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
async function clickStagePiece() {
  const clicked = await evaluate('(()=>{const b=[...document.querySelectorAll(".geometry-recomposition-cell.is-piece")].find(e=>e.getClientRects().length);if(!b)return false;b.click();return true})()');
  if (!clicked) throw new Error('Geometry piece cannot be selected.');
  await pause();
}

async function calculationResponse(stage, correct) {
  for (const step of stage.calculationSteps) {
    const value = correct ? step.expectedValue : step.choices.find(({ value }) => value !== step.expectedValue).value;
    const clicked = await evaluate(`(()=>{const rows=[...document.querySelectorAll('.calculation-step-row')];const row=rows.find(e=>e.querySelector('legend')?.innerText.includes(${JSON.stringify(step.label)}));const button=[...(row?.querySelectorAll('button')??[])].find(e=>e.innerText.trim()===${JSON.stringify(String(value))});if(!button)return false;button.click();return true})()`);
    if (!clicked) throw new Error(`${stage.stageId}: calculation value ${value} unavailable.`);
    await pause();
  }
}

async function taskResponse(task, stage, correct) {
  if (stage.interaction === 'build_array') {
    const columns = correct ? stage.arrayRules.targetColumns : stage.arrayRules.targetColumns - 1;
    for (let index = 0; index < stage.arrayRules.targetRows; index += 1) await clickText('增加一排');
    for (let index = 0; index < columns; index += 1) await clickText('每排多一個');
    return;
  }
  if (stage.interaction === 'assemble_response') {
    const ids = correct ? stage.correctOptionIds : [stage.tokens.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const tokenId of ids) {
      const index = stage.tokens.findIndex(({ id }) => id === tokenId);
      const clicked = await evaluate(`(()=>{const lists=[...document.querySelectorAll('.candidate-token-list')];const buttons=lists.at(-1)?.querySelectorAll('button');const button=buttons?.[${index}];if(!button)return false;button.click();return true})()`);
      if (!clicked) throw new Error(`${stage.stageId}: phrase token ${tokenId} unavailable.`);
      await pause();
    }
    return;
  }
  if (stage.interaction === 'complete_calculation_steps') return calculationResponse(stage, correct);
  const option = correct
    ? stage.options.find(({ id }) => stage.correctOptionIds.includes(id))
    : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
  await clickText(option.text);
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
  await clickActivity(task.activityId); await waitText(task.title);
  await waitText('候選目標：');
  layouts.push(await layout());
  const introImage = await screenshot(`${viewport.name}-${task.activityId}-intro`);
  if (await storage() !== baseline) throw new Error('localStorage changed before activity interaction.');
  await clickText('開始數學挑戰');
  return { layouts, introImage };
}

async function decimalResponse(stage, correct) {
  if (!correct) {
    await clickText('增加 0.01');
    return;
  }
  const output = Number((await evaluate('document.querySelector(".decimal-place-value-display")?.textContent')).replace('.', ''));
  let remaining = stage.decimalRules.targetHundredths - output;
  for (const [place, amount] of [['個位', 100], ['十分位', 10], ['百分位', 1]]) {
    const count = Math.floor(Math.abs(remaining) / amount);
    const delta = Math.sign(remaining);
    for (let index = 0; index < count; index += 1) await clickText(`${delta > 0 ? '增加' : '減少'} ${place === '個位' ? '1' : place === '十分位' ? '0.1' : '0.01'}`);
    remaining -= count * amount * delta;
  }
  if (remaining !== 0) throw new Error(`${stage.stageId}: target is not reachable through place-value controls.`);
}

async function geometryResponse(stage, correct) {
  await clickStagePiece();
  if (!correct) { await clickText('→ 右移'); return; }
  if (stage.stageId === 'rotate-congruent-tile') await clickText('轉四分之一圈');
  if (stage.stageId === 'flip-congruent-tile-transfer') await clickText('左右翻面');
  await clickText('↓ 下移');
  const horizontalMoves = stage.stageId === 'rotate-congruent-tile' ? 1 : 3;
  for (let index = 0; index < horizontalMoves; index += 1) await clickText('→ 右移');
}

async function runStage(task, stage) {
  await waitText(stage.prompt);
  await clickText('查看提示'); await waitText('提示 1：');
  const hintOne = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await clickText('查看提示'); await waitText('提示 2：');
  const hintTwo = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  const respond = (correct) => taskResponse(task, stage, correct);
  await respond(false);
  await clickText('檢查數學解法');
  await waitText('重新觀察並重試');
  const wrongFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
  if (!wrongFeedback || wrongFeedback.includes('response_required')) throw new Error(`${task.activityId}/${stage.stageId}: wrong input did not reach meaningful feedback.`);
  await clickText('重新觀察並重試');
  await respond(true);
  await clickText('檢查數學解法');
  await waitText('繼續下一個挑戰');
  const successFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
  if (!successFeedback) throw new Error(`${task.activityId}/${stage.stageId}: success feedback missing.`);
  return {
    stageId: stage.stageId,
    hintLevels: [hintOne, hintTwo],
    wrongAnswer: wrongFeedback,
    retry: await evaluate('document.querySelector(".reading-stage-heading")?.innerText ?? "retry returned to stage"'),
    correctAnswer: successFeedback,
  };
}

async function runTask(viewport, activity) {
  const task = { ...activity, interactionType: activity.activityId.includes('DECIMAL') ? 'decimal' : 'geometry' };
  const baseline = await storage();
  const { layouts, introImage } = await enterTask(viewport, task, baseline);
  const stages = [];
  for (const stage of task.stages) {
    layouts.push(await layout());
    stages.push(await runStage(task, stage));
    await clickText('繼續下一個挑戰');
  }
  await waitText('候選任務完成！');
  layouts.push(await layout());
  const completionImage = await screenshot(`${viewport.name}-${task.activityId}-completed`);
  const completion = await text();
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed during the activity.`);
  await clickText('再玩一次'); await waitText('開始數學挑戰');
  await clickText('開始數學挑戰'); await waitText(task.stages[0].prompt);
  await evaluate('document.querySelector("#catalog-task-screen [data-go=select]")?.click()');
  await waitText('學習領域與科目');
  const returnedToCatalog = (await text()).includes('數學');
  if (!returnedToCatalog) throw new Error(`${task.activityId}: return did not reach the subject catalog.`);
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed after replay and return.`);
  return { viewport: `${viewport.width}x${viewport.height}`, activityId: task.activityId, status: 'passed', stageCount: stages.length, stages, completion, replay: 'passed; returned to intro with fresh memory session', returnToCatalog: 'passed', localStorageUnchanged: true, horizontalOverflowAny: false, layoutsChecked: layouts.length, introScreenshot: introImage, completionScreenshot: completionImage };
}

try {
  const version = await fetch(`${cdpUrl}/json/version`);
  if (!version.ok) throw new Error(`CDP endpoint unavailable: HTTP ${version.status}`);
  const targets = await waitFor(async () => {
    const response = await fetch(`${cdpUrl}/json/list`).catch(() => null);
    return response?.ok ? (await response.json()).find(({ type, url }) => type === 'page' && (url.startsWith(targetUrl) || url === 'about:blank')) : null;
  }, `No isolated browser page opened at ${targetUrl}`);
  socket = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const resolver = pending.get(message.id);
      if (resolver) { pending.delete(message.id); message.error ? resolver.reject(new Error(message.error.message)) : resolver.resolve(message.result); }
    } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) diagnostics[message.params.type === 'error' ? 'consoleErrors' : 'consoleWarnings'].push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
    else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const runs = [];
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    await send('Page.navigate', { url: targetUrl });
    await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'Prototype did not load before storage baseline.');
    const n43 = await runTask(viewport, GRADE4_MATH_TWO_STEP_SUPPLY);
    const r41 = await runTask(viewport, GRADE4_MATH_COMPOUND_EXPRESSION_ORDER);
    runs.push(n43, r41);
  }
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics reported failures: ${JSON.stringify(diagnostics)}`);
  const executedAt = new Date().toISOString();
  const browser = await evaluate('navigator.userAgent');
  const reportId = `grade4-two-step-order-browser-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const report = { reportId, targetUrl, status: 'passed', activityCount: 2, viewportCount: viewports.length, flowCount: runs.length, runs, diagnostics, limitations: ['以隔離 Edge headless Chromium、真實目錄入口與 DOM 按鈕操作，使用 CDP 模擬桌面／手機尺寸；此工程驗收不代表教師審查或學生學習成效。'] };
  fs.writeFileSync(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const viewportsReport = viewports.map((viewport) => ({
    viewport: `${viewport.width}x${viewport.height}`,
    status: 'passed',
    localStorageUnchanged: true,
    horizontalOverflowAny: false,
    consoleErrors: diagnostics.consoleErrors,
    requestFailures: diagnostics.failedRequests,
    httpErrors: diagnostics.badResponses,
    tasks: runs.filter(({ viewport: value }) => value === `${viewport.width}x${viewport.height}`).map((run) => ({
      activityId: run.activityId,
      gradeId: 'grade-4',
      subjectId: 'mathematics',
      status: run.status,
      stageCount: run.stageCount,
      stages: run.stages,
      completion: run.completion,
      replay: run.replay,
      returnToCatalog: run.returnToCatalog,
    })),
  }));
  const evidence = { reportId, evidenceType: 'isolated_browser_acceptance', executedAt, browser, source: targetUrl, profile: process.env.BROWSER_PROFILE ?? 'isolated test profile path not recorded', status: 'passed', viewports: viewportsReport, evidenceSourcePath: null };
  const runId = `grade4-two-step-order-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8)}`;
  const evidenceDirectory = path.resolve('artifacts/learning-subitems-browser-acceptance/runs', runId);
  fs.mkdirSync(evidenceDirectory, { recursive: false });
  fs.writeFileSync(path.join(evidenceDirectory, 'report.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ report: path.join(outputRoot, 'report.json'), evidenceReport: path.relative(process.cwd(), path.join(evidenceDirectory, 'report.json')), reportId, flowCount: runs.length, diagnostics }, null, 2));
} finally { socket?.close(); }
