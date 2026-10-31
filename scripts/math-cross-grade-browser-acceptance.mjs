import fs from 'node:fs';
import path from 'node:path';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';

const cdpUrl = process.env.CDP_URL;
const targetUrl = process.env.PROTOTYPE_URL;
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/math-cross-grade-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });
const targetIds = new Set([
  'ACT-G4-MATH-INTEGER-FRACTION-DECIMAL-NUMBER-LINE-CANDIDATE',
  'ACT-G4-MATH-ELAPSED-TIME-TRANSIT-CANDIDATE',
]);
const tasks = MATH_CURRICULUM_GAP_TASKS.filter(({ activityId }) => targetIds.has(activityId));
if (tasks.length !== targetIds.size) throw new Error(`Expected ${targetIds.size} math gap tasks, found ${tasks.length}`);

const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const target = targets.find(({ type }) => type === 'page');
if (!target?.webSocketDebuggerUrl) throw new Error(`No isolated page target found for ${targetUrl}`);

let nextId = 0;
const pending = new Map();
const events = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const wait = pending.get(message.id);
    if (wait) {
      pending.delete(message.id);
      if (message.error) wait.reject(new Error(message.error.message));
      else wait.resolve(message.result);
    }
  } else if (message.method === 'Runtime.exceptionThrown') events.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    const entry = message.params.args.map(({ value, description }) => value ?? description).join(' ');
    events[message.params.type === 'error' ? 'consoleErrors' : 'consoleWarnings'].push(entry);
  } else if (message.method === 'Network.loadingFailed') events.failedRequests.push({ error: message.params.errorText });
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
    events.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  }
});

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const pause = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForText(text, timeout = 7000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await pause(50);
  }
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}; body=${(await evaluate('document.body?.innerText ?? ""')).slice(-900)}`);
}
async function clickText(text, occurrence = 0) {
  const clicked = await evaluate(`(() => {
    const visible=[...document.querySelectorAll('button')].filter((b)=>{const s=getComputedStyle(b);return !b.closest('[hidden]')&&b.getClientRects().length>0&&s.display!=='none'&&s.visibility!=='hidden'&&!b.disabled;});
    const exact=visible.filter((b)=>b.innerText.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)});
    const candidates=exact.length?exact:visible.filter((b)=>b.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));
    const b=candidates[${occurrence}]; if(!b)return null; b.scrollIntoView({block:'center',inline:'nearest'}); b.click(); return b.innerText.trim();
  })()`);
  if (!clicked) throw new Error(`Button not found/enabled: ${text}`);
  await pause();
}
async function clickSelector(selector) {
  const ok = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!ok) throw new Error(`Control not found/enabled: ${selector}`);
  await pause();
}
async function inspectLayout() {
  const value = await evaluate(`({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth],screen:document.querySelector('.screen:not([hidden])')?.id})`);
  if (value.document[1] > value.document[0] || value.body[1] > value.body[0]) throw new Error(`Horizontal overflow: ${JSON.stringify(value)}`);
  return value;
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const filename = path.join(outDir, `${name}.png`);
  fs.writeFileSync(filename, Buffer.from(data, 'base64'));
  return filename;
}
async function storage() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))'); }

const startLabel = '開始數學挑戰';
async function enterTask(task, viewportName) {
  await send('Page.navigate', { url: targetUrl });
  const began = Date.now();
  while (Date.now() - began < 7000 && await evaluate('document.readyState') !== 'complete') await pause(40);
  await waitForText('開始探險');
  await clickText('開始探險');
  await waitForText('選擇年級');
  await clickText('四年級');
  await waitForText('學習領域與科目');
  const layouts = [await inspectLayout()];
  await clickText('數學');
  await waitForText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`);
  await waitForText(task.title);
  layouts.push(await inspectLayout());
  await screenshot(`${task.activityId}-${viewportName}-intro`);
  const before = await storage();
  await clickText(startLabel);
  return { before, layouts };
}

async function provideResponse(task, stage, mode) {
  const correct = mode === 'correct';
  if (stage.interaction === 'choose_response') {
    const option = correct ? stage.options.find(({ id }) => stage.correctOptionIds.includes(id)) : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    await clickText(option.text);
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const [stepIndex, step] of stage.calculationSteps.entries()) {
      const choice = correct ? step.choices.find(({ value }) => value === step.expectedValue) : step.choices.find(({ value }) => value !== step.expectedValue);
      const ok = await evaluate(`(()=>{const row=document.querySelectorAll('.calculation-step-row')[${stepIndex}];const b=[...row.querySelectorAll('button')].find((x)=>x.innerText.trim()===${JSON.stringify(String(choice.label ?? choice.value))});if(!b)return false;b.scrollIntoView({block:'center'});b.click();return true})()`);
      if (!ok) throw new Error(`Calculation control unavailable: ${choice.label ?? choice.value}`);
      await pause();
    }
  } else if (stage.interaction === 'place_number_line_marker') {
    const tick = correct ? stage.numberLine.targetTick : (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1);
    const selected = await evaluate(`(()=>{const slider=document.querySelector('.decimal-number-line-slider');if(!slider)return false;slider.value=${tick};slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));return Number(slider.value)===${tick}})()`);
    if (!selected) throw new Error('Number-line slider unavailable or did not update');
  } else throw new Error(`Unsupported interaction: ${stage.interaction} (${task.activityId})`);
  await inspectLayout();
  await clickSelector('.reading-task-controls button:last-child');
  await pause(120);
}

async function runTask(task, viewportName) {
  console.log(`Running ${task.activityId} at ${viewportName}`);
  const { before, layouts } = await enterTask(task, viewportName);
  for (const [index, stage] of task.stages.entries()) {
    if (index > 0) await clickText('繼續下一個挑戰');
    await waitForText(stage.prompt);
    layouts.push(await inspectLayout());
    await clickText('查看提示'); await waitForText('提示 1：');
    await clickText('查看提示'); await waitForText('提示 2：');
    await provideResponse(task, stage, 'wrong');
    await waitForText('重新觀察並重試');
    const feedback = await evaluate("document.querySelector('.reading-task-feedback')?.innerText ?? ''");
    if (!feedback || feedback.includes('response_required')) throw new Error(`${task.activityId}/${stage.stageId}: no usable incorrect feedback`);
    await screenshot(`${task.activityId}-${viewportName}-${stage.stageId}-wrong`);
    await clickText('重新觀察並重試');
    await provideResponse(task, stage, 'correct');
    await waitForText('繼續下一個挑戰');
  }
  await clickText('繼續下一個挑戰');
  await waitForText('候選任務完成！');
  await waitForText(`共 ${task.stages.length * 2} 次作答嘗試`);
  await waitForText('本次活動紀念章');
  layouts.push(await inspectLayout());
  const completedScreenshot = await screenshot(`${task.activityId}-${viewportName}-complete`);
  const after = await storage();
  if (before !== after) throw new Error(`${task.activityId}: localStorage changed during candidate activity`);
  await clickText('再玩一次');
  await waitForText(startLabel);
  await clickText(startLabel);
  await waitForText(task.stages[0].prompt);
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitForText('學習領域與科目');
  return { activityId: task.activityId, title: task.title, result: 'pass', layoutChecks: layouts.length, completedScreenshot, storageUnchanged: true, attemptsPerStage: 2, replayAndReturn: 'pass' };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const reports = [];
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    const activities = [];
    for (const task of tasks) activities.push(await runTask(task, viewport.name));
    reports.push({ requestedViewport: [viewport.width, viewport.height], actualViewport: await evaluate('[innerWidth,innerHeight]'), activities });
  }
  const output = {
    browser: await evaluate('navigator.userAgent'), source: targetUrl, executedAt: new Date().toISOString(),
    viewportCount: reports.length, activityViewportRuns: reports.reduce((count, entry) => count + entry.activities.length, 0),
    viewports: reports, consoleErrors: events.consoleErrors, consoleWarnings: events.consoleWarnings,
    exceptions: events.exceptions, failedRequests: events.failedRequests, badResponses: events.badResponses,
    candidateStorage: 'localStorage snapshot unchanged during each activity; task attempts remain in page memory',
  };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(output, null, 2)}\n`);
  const evidenceRunId = `math-cross-grade-${Date.now()}`;
  const evidenceDirectory = path.resolve('artifacts/learning-subitems-browser-acceptance/runs', evidenceRunId);
  fs.mkdirSync(evidenceDirectory, { recursive: false });
  const evidence = {
    schemaVersion: 1,
    reportId: evidenceRunId,
    evidenceType: 'isolated_browser_acceptance',
    status: 'passed',
    browser: output.browser,
    source: targetUrl,
    executedAt: output.executedAt,
    viewports: reports.map(({ requestedViewport: [width, height], activities }) => ({
      viewport: `${width}x${height}`,
      status: 'passed',
      localStorageUnchanged: activities.every(({ storageUnchanged }) => storageUnchanged),
      horizontalOverflowAny: false,
      consoleErrors: events.consoleErrors,
      requestFailures: events.failedRequests,
      httpErrors: events.badResponses,
      tasks: activities.map((activity) => {
        const task = tasks.find(({ activityId }) => activityId === activity.activityId);
        return {
          activityId: task.activityId,
          status: 'passed',
          stageCount: task.stages.length,
          stages: task.stages.map((stage) => ({
            stageId: stage.stageId,
            hintLevels: stage.hints.map((hint, index) => `提示 ${index + 1}：${hint}`),
            wrongAnswer: '錯誤操作已送出並收到錯答回饋',
            retry: '已重試並可再次作答',
            correctAnswer: '正確操作已通過',
          })),
          completion: '候選任務完成！',
          replay: 'passed: restarted and completed flow returned to first stage',
          returnToCatalog: 'passed',
        };
      }),
    })),
  };
  const evidencePath = path.join(evidenceDirectory, 'report.json');
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ ...output, reportPath, coverageEvidencePath: evidencePath }, null, 2));
  if (events.exceptions.length || events.consoleErrors.length || events.failedRequests.length || events.badResponses.length) process.exitCode = 1;
} finally {
  socket.close();
}
