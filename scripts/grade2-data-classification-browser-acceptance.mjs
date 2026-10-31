import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE2_DATA_CLASSIFICATION_WORKSHOP as task } from '../prototype/data/grade2DataClassificationWorkshop.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set PROTOTYPE_URL and CDP_URL to this run’s isolated ports.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade2-data-classification-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });
const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const page = targets.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!page?.webSocketDebuggerUrl) throw new Error(`No isolated page target for ${targetUrl}`);

let id = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'warning') diagnostics.consoleWarnings.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
});

function send(method, params = {}) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const pause = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForText(text, timeout = 7000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await pause(60);
  }
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}`);
}
async function waitForExpression(expression, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await pause(80);
  }
  throw new Error(`Timed out waiting for app readiness: ${expression}`);
}
async function clickText(text, occurrence = 0) {
  const clicked = await evaluate(`(() => {
    const visible = [...document.querySelectorAll('button')].filter((button) => { const style = getComputedStyle(button); return style.display !== 'none' && style.visibility !== 'hidden' && !button.disabled; });
    const exact = visible.filter((button) => button.innerText.replace(/\\s+/g, ' ').trim() === ${JSON.stringify(text)});
    const matches = exact.length ? exact : visible.filter((button) => button.innerText.replace(/\\s+/g, ' ').trim().includes(${JSON.stringify(text)}));
    const button = matches[${occurrence}]; if (!button) return null; button.scrollIntoView({ block: 'center', inline: 'nearest' }); button.click(); return button.innerText.trim();
  })()`);
  if (!clicked) throw new Error(`Button not found/enabled: ${text}`);
  await pause();
}
async function clickSelector(selector) {
  const clicked = await evaluate(`(() => { const button = document.querySelector(${JSON.stringify(selector)}); if (!button || button.disabled) return false; button.scrollIntoView({ block: 'center', inline: 'nearest' }); button.click(); return true; })()`);
  if (!clicked) throw new Error(`Control not found/enabled: ${selector}`);
  await pause();
}
async function layout() {
  const data = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth],screen:document.querySelector(".screen:not([hidden])")?.id})');
  if (data.document[1] > data.document[0] || data.body[1] > data.body[0]) throw new Error(`Horizontal overflow: ${JSON.stringify(data)}`);
  return data;
}
async function storage() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b]) => a.localeCompare(b)))'); }
async function submit() { await clickSelector('.reading-task-controls button:last-child'); await pause(); }

async function navigateToTask() {
  await send('Page.navigate', { url: targetUrl });
  await waitForText('開始探險');
  await waitForExpression('document.querySelectorAll("#grade-options .grade-option").length === 6');
  await clickText('開始探險');
  await waitForText('選擇年級');
  await clickText('二年級');
  await waitForText('學習領域與科目');
  const directoryLayout = await layout();
  await clickText('數學');
  await waitForText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`);
  await waitForText(task.title);
  const introLayout = await layout();
  const before = await storage();
  await clickText('開始數學挑戰');
  return { before, layouts: [directoryLayout, introLayout] };
}

async function operateStage(stage, wrong = false) {
  if (stage.interaction === 'collect_evidence') {
    const ids = wrong ? [stage.options.find(({ id: optionId }) => !stage.correctOptionIds.includes(optionId)).id] : stage.correctOptionIds;
    for (const optionId of ids) await clickText(stage.options.find(({ id }) => id === optionId).text);
  } else if (stage.interaction === 'classify_observations') {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const category = wrong && index === 0 ? stage.categories.find(({ id: categoryId }) => categoryId !== expected) : stage.categories.find(({ id }) => id === expected);
      await clickSelector(`.candidate-classification-card:nth-of-type(${index + 1}) .candidate-category:nth-of-type(${stage.categories.indexOf(category) + 1})`);
    }
  }
}

async function runViewport(viewport) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  const { before, layouts } = await navigateToTask();
  const interactions = [];
  const stageEvidence = [];
  for (const [index, stage] of task.stages.entries()) {
    if (index) await clickText('繼續下一個挑戰');
    await waitForText(stage.prompt);
    layouts.push(await layout());
    const hintLevels = [];
    for (const prefix of ['提示 1：', '提示 2：']) {
      await clickText('查看提示'); await waitForText(prefix);
      hintLevels.push(await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""'));
    }
    await operateStage(stage, true);
    await submit();
    await waitForText('重新觀察並重試');
    const feedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    if (!feedback) throw new Error(`${stage.stageId}: missing incorrect feedback`);
    await clickText('重新觀察並重試');
    const retry = '已點擊重試並重新操作本階段';
    await operateStage(stage, false);
    await submit();
    await waitForText('繼續下一個挑戰');
    const correctFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    stageEvidence.push({ stageId: stage.stageId, interaction: stage.interaction, hintLevels, wrongAnswer: feedback, retry, correctAnswer: correctFeedback });
    interactions.push({ stageId: stage.stageId, interaction: stage.interaction, wrongFeedback: true, retried: true, correctCompletion: true });
  }
  await clickText('繼續下一個挑戰');
  await waitForText('候選任務完成！');
  layouts.push(await layout());
  const completion = await evaluate('document.querySelector("#catalog-task-content")?.innerText ?? ""');
  const after = await storage();
  if (before !== after) throw new Error('localStorage changed during the candidate activity.');
  await clickText('再玩一次');
  await waitForText('開始數學挑戰');
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitForText('學習領域與科目');
  const viewportName = `${viewport.width}x${viewport.height}`;
  const noOverflow = layouts.every(({ document: doc, body }) => doc[1] <= doc[0] && body[1] <= body[0]);
  if (!noOverflow) throw new Error(`Horizontal overflow in ${viewportName}`);
  const activityRun = {
    activityId: task.activityId, gradeId: task.gradeId, subjectId: task.subjectId, status: 'passed',
    stageCount: stageEvidence.length, stages: stageEvidence, completion,
    replay: 'passed; restarted intro with a fresh in-memory candidate session', returnToCatalog: 'passed',
  };
  return {
    viewport: viewportName, status: 'passed', activityId: task.activityId, interactions, layouts, tasks: [activityRun],
    storageBefore: JSON.parse(before), storageAfter: JSON.parse(after), localStorageUnchanged: true,
    horizontalOverflowAny: false, consoleErrors: [...diagnostics.consoleErrors], consoleWarnings: [...diagnostics.consoleWarnings],
    requestFailures: [...diagnostics.failedRequests], httpErrors: [...diagnostics.badResponses], completedReplayAndReturned: true,
  };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { width: 1366, height: 768, mobile: false },
    { width: 390, height: 844, mobile: true },
    { width: 340, height: 740, mobile: true },
  ];
  const results = [];
  for (const viewport of viewports) results.push(await runViewport(viewport));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics: ${JSON.stringify(diagnostics)}`);
  const executedAt = new Date().toISOString();
  const browser = await evaluate('navigator.userAgent');
  const report = {
    reportId: `g2-data-classification-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    evidenceType: 'isolated_browser_acceptance', status: 'passed', executedAt,
    activityId: task.activityId, browser, source: targetUrl,
    profile: 'isolated-temp-profile:grade2-data-classification', viewports: results, diagnostics,
    directoryEntryEvidence: [{
      activityId: task.activityId,
      gradeId: task.gradeId,
      subjectId: task.subjectId,
      startedFromDirectory: true,
      returnedToCorrectDirectory: true,
      viewportCount: results.length,
      reportScope: 'the same test navigated home → grade 2 → mathematics → activity, then replayed and returned to the grade/subject directory',
    }],
    limitations: ['以隔離瀏覽器尺寸與點擊事件模擬手機操作，未使用實體觸控設備。', '候選操作狀態僅存在頁面記憶體；此測試未進行教師審查或學習成效評估。'],
  };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const canonicalDir = path.join(root, 'artifacts/learning-subitems-browser-acceptance/runs');
  fs.mkdirSync(canonicalDir, { recursive: true });
  const canonicalReportPath = path.join(canonicalDir, `${report.reportId}.json`);
  fs.writeFileSync(canonicalReportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ report: path.relative(root, reportPath).replaceAll('\\', '/'), crosswalkEvidence: path.relative(root, canonicalReportPath).replaceAll('\\', '/'), status: report.status, viewports: results.map(({ viewport }) => viewport), diagnostics }, null, 2));
} finally {
  await send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  socket.close();
}
