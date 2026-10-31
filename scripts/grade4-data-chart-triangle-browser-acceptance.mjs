import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { GRADE4_MATH_GAP_TASKS } from '../prototype/data/grade4MathGapTasks.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set isolated PROTOTYPE_URL and CDP_URL before acceptance.');
const out = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade4-data-chart-triangle-browser-acceptance');
fs.mkdirSync(out, { recursive: true });
const diagnostics = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };
const pending = new Map(); let socket; let sequence = 0;
const pause = () => delay(100);
async function waitFor(check, label, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { const value = await check(); if (value) return value; } catch { /* app is rendering */ } await delay(100); }
  throw new Error(`Timeout waiting for ${label}`);
}
function send(method, params = {}) {
  const id = ++sequence; socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const pageText = () => evaluate('document.body?.innerText ?? ""');
async function waitText(value) { await waitFor(async () => (await pageText()).includes(value), value); }
async function click(selector, description = selector) {
  const ok = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!ok) throw new Error(`Could not click ${description}`); await pause();
}
async function clickText(value) {
  const ok = await evaluate(`(()=>{const n=e=>e.innerText.replace(/\\s+/g,' ').trim();const b=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(n(e)===${JSON.stringify(value)}||n(e).includes(${JSON.stringify(value)})));if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
  if (!ok) throw new Error(`Could not click button text: ${value}`); await pause();
}
async function checkLayout() {
  const m = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth]})');
  if (m.document[1] > m.document[0] || m.body[1] > m.body[0]) throw new Error(`Horizontal overflow ${JSON.stringify(m)}`);
  return m;
}
const storage = () => evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
async function screenshot(file) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(out, file), Buffer.from(data, 'base64'));
}
async function enter(viewport, task, baseline) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  await send('Page.navigate', { url: targetUrl }); await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'page load');
  await waitText('開始探險'); await clickText('開始探險'); await waitText('選擇年級');
  await clickText('四年級'); await waitText('學習領域與科目'); await clickText('數學');
  await click(`[data-activity-id="${task.activityId}"]`, 'candidate activity launch'); await waitText(task.title);
  if (await storage() !== baseline) throw new Error('Storage changed before activity began.');
  await checkLayout(); await screenshot(`${viewport.name}-${task.activityId}-intro.png`);
  await clickText('開始數學挑戰');
}
async function submitWrong() { await clickText('檢查數學解法'); await waitText('重新觀察並重試'); return evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""'); }
async function submitRight() { await clickText('檢查數學解法'); await waitText('繼續下一個挑戰'); return evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""'); }
async function runBarStage(stage) {
  await waitText(stage.prompt); await clickText('查看提示'); await waitText('提示 1：'); const hint1 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await clickText('查看提示'); await waitText('提示 2：'); const hint2 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  if (stage.interaction === 'build_bar_chart') {
    for (const c of stage.barChartRules.categories) await click(`[aria-label="${c.label}加 1"]`);
  } else await clickText('每天都比前一天低');
  const wrong = await submitWrong(); if (!wrong) throw new Error(`${stage.stageId}: wrong-answer feedback missing`);
  await clickText('重新觀察並重試');
  if (stage.interaction === 'build_bar_chart') {
    for (const c of stage.barChartRules.categories) for (let i = 0; i < c.value; i += 1) await click(`[aria-label="${c.label}加 1"]`);
  } else await clickText('氣溫先上升、再下降、最後上升。');
  const right = await submitRight(); if (!right) throw new Error(`${stage.stageId}: correct feedback missing`);
  return { stageId: stage.stageId, hintLevels: [hint1, hint2], wrongFeedback: wrong, correctFeedback: right };
}
async function selectGridPoint(pointId) { await click(`[data-point-id="${pointId}"]`, `triangle grid point ${pointId}`); }
async function runTriangleStage(stage, solution) {
  await waitText(stage.prompt); await clickText('查看提示'); await waitText('提示 1：'); const hint1 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await clickText('查看提示'); await waitText('提示 2：'); const hint2 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  for (const id of ['r0c0', 'r0c1', 'r0c2']) await selectGridPoint(id);
  const wrong = await submitWrong(); if (!wrong) throw new Error(`${stage.stageId}: wrong construction feedback missing`);
  await clickText('重新觀察並重試');
  for (const id of solution) await selectGridPoint(id);
  const right = await submitRight(); if (!right) throw new Error(`${stage.stageId}: correct construction feedback missing`);
  return { stageId: stage.stageId, hintLevels: [hint1, hint2], wrongFeedback: wrong, correctFeedback: right, selectedVertices: solution };
}
async function runActivity(viewport, task, baseline) {
  await enter(viewport, task, baseline); const layouts = []; const stages = [];
  for (const [index, stage] of task.stages.entries()) {
    layouts.push(await checkLayout());
    stages.push(task.activityId === 'ACT-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE'
      ? await runBarStage(stage)
      : await runTriangleStage(stage, [
        ['r0c0','r0c4','r2c2'], ['r0c0','r0c4','r4c0'], ['r0c0','r0c4','r3c2'], ['r0c0','r0c4','r1c1'],
      ][index]));
    await clickText('繼續下一個挑戰');
  }
  await waitText('候選任務完成！'); layouts.push(await checkLayout());
  await screenshot(`${viewport.name}-${task.activityId}-completed.png`);
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed during task`);
  await clickText('再玩一次'); await waitText('開始數學挑戰'); await clickText('開始數學挑戰'); await waitText(task.stages[0].prompt);
  await click('#catalog-task-screen [data-go="select"]', 'return to subject catalog'); await waitText('學習領域與科目');
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed after replay/return`);
  return { viewport: `${viewport.width}x${viewport.height}`, activityId: task.activityId, stageCount: stages.length, stages, layoutsChecked: layouts.length, completion: 'passed', replay: 'passed', returnToCatalog: 'passed', localStorageUnchanged: true, horizontalOverflow: false };
}

try {
  const version = await fetch(`${cdpUrl}/json/version`); if (!version.ok) throw new Error(`CDP HTTP ${version.status}`);
  const target = await waitFor(async () => {
    const response = await fetch(`${cdpUrl}/json/list`).catch(() => null);
    return response?.ok ? (await response.json()).find(({ type, url }) => type === 'page' && (url === 'about:blank' || url.startsWith(targetUrl))) : null;
  }, 'isolated browser page');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const item = pending.get(message.id); if (item) { pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); } }
    else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(message.params.type)) diagnostics[message.params.type === 'error' ? 'consoleErrors' : 'consoleWarnings'].push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
    else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const tasks = [GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-DATA-BAR-CHART-BUILDER-CANDIDATE'), GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G4-MATH-SPECIAL-TRIANGLE-CONSTRUCTION-CANDIDATE')];
  if (tasks.some((task) => !task)) throw new Error('Browser acceptance task missing from current catalog module.');
  const runs = [];
  for (const viewport of viewports) for (const task of tasks) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    await send('Page.navigate', { url: targetUrl }); await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'page ready for baseline');
    runs.push(await runActivity(viewport, task, await storage()));
  }
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics failed: ${JSON.stringify(diagnostics)}`);
  const report = { reportId: `g4-chart-triangle-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`, targetUrl, status: 'passed', activities: tasks.map(({ activityId }) => activityId), viewportCount: viewports.length, flowCount: runs.length, runs, diagnostics, limitations: ['隔離 Chromium 實際操作證明遊戲互動流程，不代表教師審查或學生學習成效。', '柱圖使用提供的模擬分類資料，三角形使用螢幕格點；未驗收真實資料蒐集或實物尺規作圖。'] };
  fs.writeFileSync(path.join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, flowCount: report.flowCount, activities: report.activities, diagnostics }, null, 2));
} catch (error) {
  fs.writeFileSync(path.join(out, 'report.json'), `${JSON.stringify({ status: 'failed', error: error.message, diagnostics }, null, 2)}\n`);
  throw error;
} finally { socket?.close(); }
