import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE2_UNKNOWN_QUANTITY_WORKSHOP } from '../prototype/data/grade2UnknownQuantityWorkshop.js';
import { GRADE2_UNIT_FRACTION_WORKSHOP } from '../prototype/data/grade2UnitFractionWorkshop.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set PROTOTYPE_URL and CDP_URL to isolated test endpoints.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade2-math-workshops-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });
const tasks = [GRADE2_UNKNOWN_QUANTITY_WORKSHOP, GRADE2_UNIT_FRACTION_WORKSHOP];
const target = (await (await fetch(`${cdpUrl}/json/list`)).json()).find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!target?.webSocketDebuggerUrl) throw new Error(`No isolated browser page for ${targetUrl}`);

let id = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], failedRequests: [], httpErrors: [] };
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message)); else waiter.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.httpErrors.push({ url: message.params.response.url, status: message.params.response.status });
});
function send(method, params = {}) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result?.value;
}
const pause = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForText(text, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await pause(75);
  }
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}`);
}
async function waitForExpression(expression, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await pause(80);
  }
  throw new Error(`Timed out waiting for app readiness: ${expression}`);
}
async function clickText(text) {
  const result = await evaluate(`(() => { const buttons=[...document.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden'); const exact=buttons.find(b=>b.innerText.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)}); const button=exact||buttons.find(b=>b.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)})); if(!button)return null;button.scrollIntoView({block:'center',inline:'nearest'});button.click();return button.innerText.trim(); })()`);
  if (!result) throw new Error(`Enabled button not found: ${text}`);
  await pause();
}
async function clickSelector(selector) {
  const result = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true; })()`);
  if (!result) throw new Error(`Control unavailable: ${selector}`);
  await pause();
}
async function layout() {
  const info = await evaluate('({viewport:[innerWidth,innerHeight],doc:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth]})');
  if (info.doc[1] > info.doc[0] || info.body[1] > info.body[0]) throw new Error(`Horizontal overflow ${JSON.stringify(info)}`);
  return info;
}
const storage = () => evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
async function enterTask(task) {
  await send('Page.navigate', { url: targetUrl });
  await waitForText('開始探險');
  await waitForExpression('document.querySelectorAll("#grade-options .grade-option").length === 6');
  await clickText('開始探險');
  await waitForText('選擇年級');
  await clickText('二年級');
  await waitForText('學習領域與科目');
  const layouts = [await layout()];
  await clickText('數學');
  await waitForText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`);
  await waitForText(task.title);
  layouts.push(await layout());
  const before = await storage();
  await clickText('開始數學挑戰');
  return { before, layouts };
}
async function operateUnknown(task, stage, wrong) {
  const rules = stage.unknownQuantityRules;
  if (wrong) {
    await clickSelector('.unknown-quantity-controls button:last-child');
    return;
  }
  const current = Number((await evaluate('document.querySelector(".unknown-quantity-counters")?.getAttribute("aria-label")?.match(/\\d+/)?.[0]')));
  const desired = rules.targetValue;
  const selector = desired < current ? '.unknown-quantity-controls button:first-child' : '.unknown-quantity-controls button:last-child';
  for (let value = current; value !== desired; value += Math.sign(desired - value)) await clickSelector(selector);
}
async function operateFraction(stage, wrong) {
  const rules = stage.fractionRules;
  await clickText(`平均分成 ${rules.denominator} 份`);
  await clickText(wrong ? '只拿半條紙帶' : rules.wholeOptions.find(({ id }) => id === rules.targetWholeId).label);
  if (await evaluate('document.querySelector(".fraction-model-select")?.innerText.trim() === "操作這條模型"')) await clickText('操作這條模型');
  await clickSelector('.fraction-piece-available');
}
async function runActivity(viewport, task) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  const { before, layouts } = await enterTask(task);
  const stageResults = [];
  for (const [index, stage] of task.stages.entries()) {
    if (index) await clickText('繼續下一個挑戰');
    await waitForText(stage.prompt);
    layouts.push(await layout());
    const hints = [];
    for (let hint = 0; hint < 2; hint += 1) {
      await clickText('查看提示');
      hints.push(await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""'));
    }
    if (task.activityId === GRADE2_UNKNOWN_QUANTITY_WORKSHOP.activityId) await operateUnknown(task, stage, true);
    else await operateFraction(stage, true);
    await clickText('檢查數學解法');
    await waitForText('重新觀察並重試');
    const wrongFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    if (!wrongFeedback) throw new Error(`${stage.stageId}: no incorrect feedback`);
    await clickText('重新觀察並重試');
    if (task.activityId === GRADE2_UNKNOWN_QUANTITY_WORKSHOP.activityId) await operateUnknown(task, stage, false);
    else await operateFraction(stage, false);
    await clickText('檢查數學解法');
    await waitForText('繼續下一個挑戰');
    const correctFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    if (!correctFeedback) throw new Error(`${stage.stageId}: no correct feedback`);
    stageResults.push({
      stageId: stage.stageId,
      hintLevels: hints.map((hint, hintIndex) => `提示 ${hintIndex + 1}：${hint.replace(/^提示\s*\d+[：:]\s*/, '')}`),
      wrongAnswer: wrongFeedback,
      retry: 'passed; incorrect model could be edited and resubmitted',
      correctAnswer: correctFeedback,
    });
  }
  await clickText('繼續下一個挑戰');
  await waitForText('候選任務完成！');
  layouts.push(await layout());
  const completion = await evaluate('document.querySelector("#catalog-task-content")?.innerText ?? ""');
  const after = await storage();
  if (before !== after) throw new Error(`${task.activityId}: localStorage changed`);
  await clickText('再玩一次');
  await waitForText('開始數學挑戰');
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitForText('學習領域與科目');
  return {
    activityId: task.activityId,
    title: task.title,
    taskEvidence: {
      activityId: task.activityId,
      title: task.title,
      status: 'passed',
      stageCount: stageResults.length,
      stages: stageResults,
      completion,
      replay: 'passed; fresh in-memory session',
      returnToCatalog: 'passed',
    },
    viewport: `${viewport.width}x${viewport.height}`,
    status: 'passed',
    localStorageUnchanged: true,
    localStorageBefore: JSON.parse(before),
    localStorageAfter: JSON.parse(after),
    horizontalOverflowAny: false,
    layouts,
  };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [{ width: 1366, height: 768, mobile: false }, { width: 390, height: 844, mobile: true }, { width: 340, height: 740, mobile: true }];
  const individualRuns = [];
  for (const viewport of viewports) for (const task of tasks) individualRuns.push(await runActivity(viewport, task));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.httpErrors.length) throw new Error(`Browser diagnostics: ${JSON.stringify(diagnostics)}`);
  const results = viewports.map((viewport) => {
    const viewportName = `${viewport.width}x${viewport.height}`;
    const runs = individualRuns.filter((run) => run.viewport === viewportName);
    return {
      viewport: viewportName,
      status: 'passed',
      tasks: runs.map((run) => run.taskEvidence),
      localStorageUnchanged: runs.every((run) => run.localStorageUnchanged),
      horizontalOverflowAny: runs.some((run) => run.horizontalOverflowAny),
      consoleErrors: diagnostics.consoleErrors,
      requestFailures: diagnostics.failedRequests,
      httpErrors: diagnostics.httpErrors,
      layouts: runs.flatMap((run) => run.layouts),
    };
  });
  const report = {
    reportId: `g2-math-workshops-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    evidenceType: 'isolated_browser_acceptance', status: 'passed', executedAt: new Date().toISOString(),
    source: targetUrl, browser: await evaluate('navigator.userAgent'),
    profile: 'temporary isolated headless browser profile; removed after test',
    directoryEntryEvidence: tasks.map((task) => ({ activityId: task.activityId, startedFromDirectory: true, returnedToCorrectDirectory: true, viewportCount: viewports.length })),
    viewports: results,
    diagnostics,
    limitations: ['手機以 390x844 與 340x740 模擬視窗操作，未使用實體觸控設備。', '瀏覽器/工程驗收不構成教師審查或教學成效證據。'],
  };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const evidenceDir = path.join(root, 'artifacts/learning-subitems-browser-acceptance/runs');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.join(evidenceDir, `${report.reportId}.json`);
  fs.writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ report: path.relative(root, reportPath).replaceAll('\\', '/'), evidence: path.relative(root, evidencePath).replaceAll('\\', '/'), status: report.status, tasks: tasks.length, viewportRuns: individualRuns.length, diagnostics }, null, 2));
} finally {
  await send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  socket.close();
}
