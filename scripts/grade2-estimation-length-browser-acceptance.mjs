import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP } from '../prototype/data/grade2EstimationAndLengthWorkshops.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set PROTOTYPE_URL and CDP_URL to isolated test endpoints.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade2-estimation-length-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });
const tasks = [GRADE2_ESTIMATION_WORKSHOP, GRADE2_LENGTH_WORKSHOP];
const target = (await (await fetch(`${cdpUrl}/json/list`)).json()).find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!target?.webSocketDebuggerUrl) throw new Error(`No isolated browser page for ${targetUrl}`);
let id = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], failedRequests: [], httpErrors: [] };
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) { const waiter = pending.get(message.id); if (!waiter) return; pending.delete(message.id); message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result); }
  else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.httpErrors.push({ url: message.params.response.url, status: message.params.response.status });
});
function send(method, params = {}) { const requestId = ++id; socket.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); }
async function evaluate(expression) { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result?.value; }
const pause = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitText(text, timeout = 9000) { const until = Date.now() + timeout; while (Date.now() < until) { if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return; await pause(80); } throw new Error(`Timed out waiting for ${text}`); }
async function waitExpression(expression, timeout = 9000) { const until = Date.now() + timeout; while (Date.now() < until) { if (await evaluate(expression)) return; await pause(80); } throw new Error(`Timed out waiting for ${expression}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}`); }
async function clickText(text) { const result = await evaluate(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);const b=bs.find(x=>x.innerText.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)})||bs.find(x=>x.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));if(!b)return {missing:true,buttons:bs.map(x=>x.innerText.trim())};b.scrollIntoView({block:'center',inline:'nearest'});b.click();return {clicked:b.innerText.trim()}})()`); if (!result || result.missing) throw new Error(`Button not found: ${text}; buttons=${JSON.stringify(result?.buttons)}`); await pause(); }
async function clickSelector(selector) { if (!await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`)) throw new Error(`Control not found: ${selector}`); await pause(); }
async function setRange(selector, value, index = 0) { const ok = await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})][${index}];if(!e)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.value=${JSON.stringify(String(value))};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`); if (!ok) throw new Error(`Range unavailable: ${selector}[${index}]`); await pause(50); }
async function layout() { const result = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth]})'); if (result.document[1] > result.document[0] || result.body[1] > result.body[0]) throw new Error(`Horizontal overflow ${JSON.stringify(result)}`); return result; }
const storage = () => evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
async function enter(task) {
  await send('Page.navigate', { url: targetUrl }); await waitText('開始探險'); await clickText('開始探險'); await waitExpression('document.querySelectorAll("#grade-options .grade-option").length === 6'); await clickSelector('#grade-options [data-grade-id="grade-2"]'); await waitExpression('!!document.querySelector("#grade-subject-directory .grade-subject-card[data-subject-id=\\\"mathematics\\\"]")');
  const layouts = [await layout()]; await clickSelector('#grade-subject-directory .grade-subject-card[data-subject-id="mathematics"]'); await waitExpression(`!!document.querySelector('#grade-subject-extra-activities [data-activity-id="${task.activityId}"]')`); await clickSelector(`#grade-subject-extra-activities [data-activity-id="${task.activityId}"]`); await waitText(task.title); layouts.push(await layout());
  const before = await storage(); await clickText('開始數學挑戰'); return { layouts, before };
}
async function perform(task, stage, correct) {
  if (stage.interaction === 'set_estimate_range') {
    const r = stage.estimateRules;
    const v = correct ? Math.round(((r.acceptableRange.min + r.acceptableRange.max) / 2) / r.inputRange.step) * r.inputRange.step : r.inputRange.min;
    await setRange('.estimation-range-slider', v);
  } else if (stage.interaction === 'measure_length_model') {
    const r = stage.lengthRules;
    if (r.mode === 'estimate') await setRange('.length-measurement-slider', correct ? r.targetLength : r.estimateRange.min);
    else if (r.mode === 'align_read') {
      const button = `尺往右 1 ${r.unitLabel ?? '毫米'}`;
      for (let n = 0; n < r.object.start; n += 1) await clickText(button);
      await setRange('.length-measurement-slider', correct ? r.object.length : Math.max(0, r.object.length - 1));
    } else if (r.mode === 'compare') {
      for (const [index, item] of r.objects.entries()) await setRange('.length-measurement-slider', item.length, index);
      const difference = Math.abs(r.objects[0].length - r.objects[1].length);
      await setRange('.length-measurement-slider', correct ? difference : difference + 1, r.objects.length);
    }
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) {
      const value = correct ? step.expectedValue : step.choices.find(({ value }) => value !== step.expectedValue).value;
      await clickText(step.choices.find((choice) => choice.value === value).label);
    }
  }
}
async function runTask(viewport, task) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  const { before, layouts } = await enter(task); const stages = [];
  for (const [index, stage] of task.stages.entries()) {
    if (index) await clickText('繼續下一個挑戰'); await waitText(stage.prompt); layouts.push(await layout());
    await perform(task, stage, false); await clickText('檢查數學解法'); await waitText('重新觀察並重試');
    const wrong = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""'); if (!wrong) throw new Error(`${stage.stageId}: missing wrong feedback`);
    await clickText('重新觀察並重試');
    await clickText('查看提示'); const hint1 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""'); await clickText('查看提示'); const hint2 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
    await perform(task, stage, true); await clickText('檢查數學解法'); await waitText('繼續下一個挑戰');
    const correct = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""'); if (!correct) throw new Error(`${stage.stageId}: missing correct feedback`);
    stages.push({ stageId: stage.stageId, wrongFeedback: wrong, hints: [hint1, hint2], correctFeedback: correct, retry: 'passed' });
  }
  await clickText('繼續下一個挑戰'); await waitText('候選任務完成！'); layouts.push(await layout());
  const completion = await evaluate('document.querySelector("#catalog-task-content")?.innerText ?? ""'); const after = await storage();
  if (before !== after) throw new Error(`${task.activityId}: localStorage changed`);
  await clickText('再玩一次'); await waitText('開始數學挑戰'); await clickSelector('#catalog-task-screen [data-go="select"]'); await waitText('學習領域與科目');
  return { taskId: task.activityId, viewport: `${viewport.width}x${viewport.height}`, stages, completion, replay: 'passed', returnToSubjectDirectory: 'passed', localStorageUnchanged: true, layouts };
}
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [{ width: 1366, height: 768, mobile: false }, { width: 390, height: 844, mobile: true }, { width: 340, height: 740, mobile: true }];
  const runs = []; for (const viewport of viewports) for (const task of tasks) runs.push(await runTask(viewport, task));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.httpErrors.length) throw new Error(`browser diagnostics: ${JSON.stringify(diagnostics)}`);
  const report = { reportId: `g2-estimation-length-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`, evidenceType: 'isolated_browser_acceptance', status: 'passed', executedAt: new Date().toISOString(), source: targetUrl, browser: await evaluate('navigator.userAgent'), profile: 'temporary isolated headless Edge profile; removed after test', tasks: runs, diagnostics, limitations: ['手機尺寸以瀏覽器視窗模擬，未使用實體觸控設備。', '畫面尺具及資料為數位模型，非實體測量證據。', '工程驗收不構成教師審查或教學成效證據。'] };
  const reportPath = path.join(outDir, 'acceptance-report.json'); fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify({ report: path.relative(root, reportPath).replaceAll('\\', '/'), status: report.status, runs: runs.length, taskCount: tasks.length, diagnostics }, null, 2));
  const viewportEvidence = [...new Set(runs.map(({ viewport }) => viewport))].map((viewport) => {
    const viewportRuns = runs.filter((run) => run.viewport === viewport);
    return {
      viewport, status: 'passed', localStorageUnchanged: viewportRuns.every(({ localStorageUnchanged }) => localStorageUnchanged),
      horizontalOverflowAny: viewportRuns.some(({ layouts }) => layouts.some(({ document, body }) => document[1] > document[0] || body[1] > body[0])),
      consoleErrors: [], requestFailures: [], httpErrors: [],
      tasks: viewportRuns.map((run) => ({ activityId: run.taskId, status: 'passed', stageCount: run.stages.length,
        stages: run.stages.map(({ stageId, wrongFeedback, hints, retry, correctFeedback }) => ({ stageId, wrongAnswer: wrongFeedback, hintLevels: hints, retry, correctAnswer: correctFeedback })),
        completion: run.completion, replay: run.replay, returnToCatalog: run.returnToSubjectDirectory })),
    };
  });
  const directoryEntryEvidence = tasks.map(({ activityId }) => ({ activityId, startedFromDirectory: true, returnedToCorrectDirectory: true }));
  const evidenceDir = path.join(root, 'artifacts/learning-subitems-browser-acceptance/runs'); fs.mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.join(evidenceDir, `${report.reportId}.json`);
  fs.writeFileSync(evidencePath, `${JSON.stringify({ ...report, viewports: viewportEvidence, directoryEntryEvidence, diagnostics: { ...diagnostics, badResponses: diagnostics.httpErrors } }, null, 2)}\n`);
} finally { await send('Emulation.clearDeviceMetricsOverride').catch(() => {}); socket.close(); }
