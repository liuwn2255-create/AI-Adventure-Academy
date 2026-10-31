import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { GRADE4_ANGLE_EXPLORATION_WORKSHOP as task } from '../prototype/data/grade4AngleExplorationWorkshop.js';

const targetUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:44671/';
const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:44672';
const outDir = path.resolve('artifacts/grade4-angle-exploration-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });

let socket;
let nextCommandId = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };

async function waitFor(check, message, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const value = await check(); if (value) return value; } catch { /* wait for process startup */ }
    await delay(100);
  }
  throw new Error(message);
}

async function send(method, params = {}) {
  const id = ++nextCommandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}

const pause = (ms = 100) => delay(ms);

async function waitText(text, timeout = 8000) {
  await waitFor(async () => (await evaluate('document.body?.innerText ?? ""')).includes(text), `Timed out waiting for text: ${text}`, timeout);
}

async function clickText(text) {
  const clicked = await evaluate(`(()=>{const visible=[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&!b.disabled&&!b.closest('[hidden]'));const normalized=b=>b.innerText.replace(/\\s+/g,' ').trim();const b=visible.find(x=>normalized(x)===${JSON.stringify(text)})??visible.find(x=>normalized(x).includes(${JSON.stringify(text)}));if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
  if (!clicked) throw new Error(`Button missing or disabled: ${text}`);
  await pause();
}

async function clickSelector(selector) {
  const clicked = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!clicked) throw new Error(`Control missing or disabled: ${selector}`);
  await pause();
}

async function setRange(label, value) {
  const changed = await evaluate(`(()=>{const e=document.querySelector('input[aria-label="${label}"]');if(!e||e.disabled)return false;e.value=${Number(value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return Number(e.value)===${Number(value)}})()`);
  if (!changed) throw new Error(`Range control did not accept ${label}=${value}`);
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
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}

async function navigateApp(viewport) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  await send('Page.navigate', { url: targetUrl });
  await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'Prototype did not load.');
  await waitText('開始探險');
  const layouts = [await layout()];
  await clickText('開始探險'); await waitText('選擇年級');
  await clickText('四年級'); await waitText('學習領域與科目');
  await clickText('數學'); await waitText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`); await waitText(task.title);
  layouts.push(await layout());
  const introScreenshot = await screenshot(`${viewport.name}-intro`);
  const beforeStorage = await storage();
  await clickText('開始數學挑戰');
  return { layouts, introScreenshot, beforeStorage };
}

async function alignProtractor(stage) {
  if (stage.angleRules.initialCenterOffset < 0) {
    for (let i = 0; i < Math.abs(stage.angleRules.initialCenterOffset); i += 1) await clickText('中心向右一格');
  } else {
    for (let i = 0; i < stage.angleRules.initialCenterOffset; i += 1) await clickText('中心向左一格');
  }
  if (stage.angleRules.initialBaselineOffset > 0) {
    for (let i = 0; i < stage.angleRules.initialBaselineOffset / stage.angleRules.baselineStep; i += 1) await clickText('基準線逆轉 5°');
  } else {
    for (let i = 0; i < Math.abs(stage.angleRules.initialBaselineOffset) / stage.angleRules.baselineStep; i += 1) await clickText('基準線順轉 5°');
  }
}

async function answer(stage, correct) {
  const rules = stage.angleRules;
  if (rules.mode === 'estimate') {
    await setRange('設定角度估測值', correct ? rules.targetDegrees : rules.targetDegrees + rules.tolerance + 10);
  } else if (rules.mode === 'measure') {
    await alignProtractor(stage);
    const side = correct ? rules.expectedSide : (rules.expectedSide === 'left' ? 'right' : 'left');
    await clickText(side === 'left' ? '從左側 0° 開始' : '從右側 0° 開始');
    await setRange('選擇量角器讀值', rules.targetDegrees);
  } else if (rules.mode === 'draw') {
    await setRange('旋轉射線調整作圖角度', correct ? rules.targetDegrees : rules.targetDegrees + 10);
  } else {
    const direction = correct ? rules.expectedDirection : (rules.expectedDirection === 'clockwise' ? 'counterclockwise' : 'clockwise');
    await clickText(direction === 'clockwise' ? '順時針' : '逆時針');
    await setRange('調整鐘面旋轉角度', rules.targetDegrees);
  }
  await layout();
  await clickText('檢查數學解法');
}

async function runViewport(viewport) {
  const { layouts, introScreenshot, beforeStorage } = await navigateApp(viewport);
  const interactions = [];
  for (const [index, stage] of task.stages.entries()) {
    if (index > 0) await waitText(stage.prompt);
    layouts.push(await layout());
    await clickText('查看提示'); await waitText('提示 1：');
    await clickText('查看提示'); await waitText('提示 2：');
    await answer(stage, false);
    await waitText('重新觀察並重試');
    const wrongFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    if (!wrongFeedback || wrongFeedback.includes('response_required')) throw new Error(`${stage.stageId}: wrong interaction did not reach meaningful feedback.`);
    await clickText('重新觀察並重試');
    await answer(stage, true);
    await waitText('繼續下一個挑戰');
    const successFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    if (!successFeedback) throw new Error(`${stage.stageId}: success feedback is missing.`);
    interactions.push({ stageId: stage.stageId, mode: stage.angleRules.mode, wrongFeedback: 'PASS', retry: 'PASS', correctFeedback: 'PASS' });
    await clickText('繼續下一個挑戰');
  }
  await waitText('候選任務完成！');
  layouts.push(await layout());
  const completeScreenshot = await screenshot(`${viewport.name}-complete`);
  if (await storage() !== beforeStorage) throw new Error(`${viewport.name}: localStorage changed during the candidate task.`);
  await clickText('再玩一次'); await waitText('開始數學挑戰');
  await clickText('開始數學挑戰'); await waitText(task.stages[0].prompt);
  await clickSelector('#catalog-task-screen [data-go="select"]'); await waitText('學習領域與科目');
  return { viewport: [viewport.width, viewport.height], result: 'PASS', stageCount: interactions.length, interactions, replay: 'PASS', returnedToSubjectCatalog: 'PASS', localStorageUnchanged: true, layoutsChecked: layouts.length, introScreenshot, completeScreenshot };
}

try {
  const sourceResponse = await fetch(targetUrl);
  if (!sourceResponse.ok) throw new Error(`Isolated prototype returned HTTP ${sourceResponse.status} at ${targetUrl}`);
  await waitFor(async () => (await fetch(`${cdpUrl}/json/version`).catch(() => null))?.ok, `No isolated browser CDP endpoint is available at ${cdpUrl}.`);
  const targets = await waitFor(async () => {
    const response = await fetch(`${cdpUrl}/json/list`).catch(() => null);
    if (!response?.ok) return null;
    return (await response.json()).find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
  }, 'No isolated browser page opened at the dedicated prototype origin.');
  socket = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const resolver = pending.get(message.id);
      if (resolver) {
        pending.delete(message.id);
        message.error ? resolver.reject(new Error(message.error.message)) : resolver.resolve(message.result);
      }
    } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      diagnostics[message.params.type === 'error' ? 'consoleErrors' : 'consoleWarnings'].push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
    } else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewportRuns = [];
  for (const viewport of [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ]) viewportRuns.push(await runViewport(viewport));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics reported failures: ${JSON.stringify(diagnostics)}`);
  const report = { activityId: task.activityId, curriculumCodes: task.curriculumCodes, status: task.status, targetUrl, executedAt: new Date().toISOString(), viewportRuns, diagnostics };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, activityId: task.activityId, viewportRuns, diagnostics }, null, 2));
} finally {
  socket?.close();
}
