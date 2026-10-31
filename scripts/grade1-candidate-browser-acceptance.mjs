import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:43972';
const targetUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:43971/';
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade1-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });
const grade1Tasks = CATALOG_CANDIDATE_TASKS.filter((task) => task.gradeId === 'grade-1');
if (grade1Tasks.length !== 6) throw new Error(`Expected six Grade 1 tasks, found ${grade1Tasks.length}`);
const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const target = targets.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
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
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) events.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
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
const pause = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForText(text, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await pause(50);
  }
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}`);
}
async function clickText(text, occurrence = 0) {
  const literal = JSON.stringify(text);
  const clicked = await evaluate(`(() => {
    const visible=[...document.querySelectorAll('button')].filter((b)=>{const s=getComputedStyle(b);return s.display!=='none'&&s.visibility!=='hidden'&&!b.disabled;});
    const exact=visible.filter((b)=>b.innerText.replace(/\\s+/g,' ').trim()===${literal});
    const candidates=exact.length?exact:visible.filter((b)=>b.innerText.replace(/\\s+/g,' ').trim().includes(${literal}));
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

async function enterTask(task) {
  await send('Page.navigate', { url: targetUrl });
  const began = Date.now();
  while (Date.now() - began < 5000 && await evaluate('document.readyState') !== 'complete') await pause(40);
  await waitForText('開始探險');
  await clickText('開始探險');
  await waitForText('選擇年級');
  await clickText('一年級');
  await waitForText('學習領域與科目');
  const subjectLabel = { mathematics: '數學', 'chinese-language': '國語文', 'living-curriculum': '生活課程' }[task.subjectId];
  await clickText(subjectLabel);
  await waitForText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`);
  await waitForText(task.title);
  const layout = await inspectLayout();
  await screenshot(`${task.activityId}-intro`);
  const before = await storage();
  const startLabel = { mathematics: '開始數學挑戰', 'chinese-language': '開始國語閱讀冒險', 'living-curriculum': '開始物品探索' }[task.subjectId];
  await clickText(startLabel);
  return { before, layout };
}

async function provideResponse(task, stage, mode) {
  const correct = mode === 'correct';
  if (stage.interaction === 'choose_response') {
    const option = correct ? stage.options.find(({ id }) => stage.correctOptionIds.includes(id)) : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    await clickText(option.text);
  } else if (stage.interaction === 'assemble_response') {
    const ids = [...stage.correctOptionIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (const id of ids) await clickText(stage.tokens.find((token) => token.id === id).text);
  } else if (stage.interaction === 'build_array') {
    const rows = correct ? stage.arrayRules.targetRows : 1;
    const columns = correct ? stage.arrayRules.targetColumns : 1;
    for (let i = 0; i < rows; i += 1) await clickText('增加一排');
    for (let i = 0; i < columns; i += 1) await clickText('每排多一個');
  } else if (stage.interaction === 'classify_observations') {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const choiceIndex = correct ? stage.categories.findIndex(({ id }) => id === expected) : stage.categories.findIndex(({ id }) => id !== expected);
      await clickSelector(`.candidate-classification-card:nth-of-type(${index + 1}) .candidate-category:nth-of-type(${choiceIndex + 1})`);
    }
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const id of ids) await clickText(stage.options.find(({ id: optionId }) => optionId === id).text);
  } else if (stage.interaction === 'order_items') {
    if (!correct) {
      const order = await evaluate(`([...document.querySelectorAll('.candidate-order-row')].map(r=>r.querySelector('.candidate-order-text').textContent))`);
      const currentIds = order.map((text) => stage.items.find(({ text: itemText }) => itemText === text).id);
      if (JSON.stringify(currentIds) === JSON.stringify(stage.correctItemIds)) await clickSelector('.candidate-order-row:nth-of-type(2) button[aria-label^="將第 2 件往後移"]');
    } else {
      for (let targetIndex = 0; targetIndex < stage.correctItemIds.length; targetIndex += 1) {
        const order = await evaluate(`([...document.querySelectorAll('.candidate-order-row')].map(r=>r.querySelector('.candidate-order-text').textContent))`);
        const currentIds = order.map((text) => stage.items.find(({ text: itemText }) => itemText === text).id);
        let currentIndex = currentIds.indexOf(stage.correctItemIds[targetIndex]);
        while (currentIndex > targetIndex) {
          await clickSelector(`.candidate-order-row:nth-of-type(${currentIndex + 1}) button[aria-label^="將第 ${currentIndex + 1} 件往前移"]`);
          currentIndex -= 1;
        }
      }
    }
  } else throw new Error(`Browser driver missing interaction: ${stage.interaction}`);
  await clickSelector('.reading-task-controls button:last-child');
  await pause(80);
}

async function runTask(task, viewportName) {
  const { before, layout: introLayout } = await enterTask(task);
  const layouts = [introLayout];
  for (const [index, stage] of task.stages.entries()) {
    if (index > 0) await clickText('繼續下一個挑戰');
    await waitForText(stage.prompt);
    await inspectLayout().then((value) => layouts.push(value));
    await clickText('查看提示');
    await waitForText('提示 1：');
    await clickText('查看提示');
    await waitForText('提示 2：');
    await provideResponse(task, stage, 'wrong');
    await waitForText('重新觀察並重試');
    const feedback = await evaluate("document.querySelector('.reading-task-feedback')?.innerText ?? ''");
    if (!feedback) throw new Error(`${task.activityId}/${stage.stageId}: empty incorrect feedback`);
    await clickText('重新觀察並重試');
    await provideResponse(task, stage, 'correct');
    await waitForText('繼續下一個挑戰');
  }
  await clickText('繼續下一個挑戰');
  await waitForText('候選任務完成！');
  await waitForText(`共 ${task.stages.length * 2} 次作答嘗試`);
  await waitForText('本次活動紀念章');
  await inspectLayout().then((value) => layouts.push(value));
  const completedScreenshot = await screenshot(`${task.activityId}-${viewportName}-complete`);
  const after = await storage();
  if (before !== after) throw new Error(`${task.activityId}: localStorage changed during candidate task`);
  await clickText('再玩一次');
  const startLabel = { mathematics: '開始數學挑戰', 'chinese-language': '開始國語閱讀冒險', 'living-curriculum': '開始物品探索' }[task.subjectId];
  await waitForText(startLabel);
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
    for (const task of grade1Tasks) activities.push(await runTask(task, viewport.name));
    reports.push({ requestedViewport: [viewport.width, viewport.height], actualViewport: await evaluate('[innerWidth,innerHeight]'), activities });
  }
  const output = { browser: await evaluate('navigator.userAgent'), source: targetUrl, executedAt: new Date().toISOString(), viewports: reports, consoleErrors: events.consoleErrors, consoleWarnings: events.consoleWarnings, exceptions: events.exceptions, failedRequests: events.failedRequests, badResponses: events.badResponses, candidateStorage: 'localStorage snapshot unchanged across each activity; task attempts remain in page memory' };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({ ...output, reportPath }, null, 2));
  if (events.exceptions.length || events.consoleErrors.length || events.failedRequests.length || events.badResponses.length) process.exitCode = 1;
} finally {
  socket.close();
}
