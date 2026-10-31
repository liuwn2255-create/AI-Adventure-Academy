import { writeFile } from 'node:fs/promises';
import { GRADE3_MATH_REPAIR_MAINLINE } from '../prototype/data/grade3MathRepairMainline.js';

const cdpUrl = process.env.CDP_URL;
const targetUrl = process.env.PROTOTYPE_URL;
if (!cdpUrl || !targetUrl) throw new Error('Set CDP_URL and PROTOTYPE_URL to isolated test endpoints.');
const pages = await (await fetch(`${cdpUrl}/json/list`)).json();
const page = pages.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!page?.webSocketDebuggerUrl) throw new Error(`No isolated browser page at ${targetUrl}`);
const socket = new WebSocket(page.webSocketDebuggerUrl);
let callId = 0;
const pending = new Map();
const diagnostics = { consoleErrors: [], exceptions: [], failedRequests: [], badResponses: [] };
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const promise = pending.get(message.id);
    if (promise) { pending.delete(message.id); message.error ? promise.reject(new Error(message.error.message)) : promise.resolve(message.result); }
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
});
function send(method, params = {}) {
  const id = ++callId; socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const delay = (ms = 70) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(text, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if ((await evaluate('document.body.innerText')).includes(text)) return; await delay(50); }
  throw new Error(`Timed out waiting for ${text}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}`);
}
async function clickButtonText(text) {
  const found = await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>!x.disabled&&x.getClientRects().length&&x.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)})); if(!b)return null;b.click();return b.innerText.trim();})()`);
  if (!found) throw new Error(`Button not found: ${text}`);
  await delay();
  return found;
}
async function clickSelector(selector) {
  const clicked = await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)return false;e.click();return true;})()`);
  if (!clicked) throw new Error(`Control not found: ${selector}`);
  await delay();
}
async function clickAccessible(label) { await clickSelector(`button[aria-label="${label}"]`); }
async function checkViewport(viewport) {
  const metrics = await evaluate('({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth})');
  if (metrics.scroll > metrics.client || metrics.body > metrics.client) throw new Error(`Horizontal overflow at ${viewport.name}: ${JSON.stringify(metrics)}`);
  return metrics;
}
async function enterMap() {
  await send('Page.navigate', { url: targetUrl });
  const start = Date.now(); while (Date.now() - start < 6000 && await evaluate('document.readyState') !== 'complete') await delay(50);
  await clickButtonText('開始探險'); await waitFor('選擇年級'); await clickButtonText('三年級'); await clickButtonText('數學'); await clickButtonText('前往三年級數學冒險地圖');
  await waitFor('數字島修復任務：三年級數學候選主線');
  return evaluate(`({route:document.querySelector('#grade3-math-repair-mainline')?.dataset.routeId,stops:document.querySelectorAll('.grade3-math-mainline-stops li').length,button:document.getElementById('grade3-math-mainline-start')?.innerText})`);
}
async function completePlaceValueFirstMission() {
  const activity = GRADE3_MATH_REPAIR_MAINLINE.stops[0].activityId;
  const before = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  await clickButtonText('開始數字島修復任務');
  await waitFor('位值積木交換工坊：組數、換位與驗值');
  await clickButtonText('開始數學挑戰');
  const first = GRADE3_MATH_REPAIR_MAINLINE.stops[0];
  // Submit one wrong quantity first, observe explanatory feedback, use a hint, then retry.
  await clickAccessible('增加一個千位積木');
  await clickButtonText('檢查數學解法');
  await waitFor('重新觀察並重試');
  const wrongFeedback = await evaluate('document.querySelector(".reading-task-feedback.is-incorrect")?.innerText');
  if (!wrongFeedback?.trim()) throw new Error('Incorrect attempt did not show explanatory feedback.');
  await clickButtonText('重新觀察並重試');
  await clickButtonText('查看提示');
  await waitFor('提示 1：');
  for (const [place, count] of Object.entries({ thousands: 2, hundreds: 4, tens: 0, ones: 8 })) {
    const label = { thousands: '千位', hundreds: '百位', tens: '十位', ones: '個位' }[place];
    for (let i = 0; i < count; i += 1) await clickAccessible(`增加一個${label}積木`);
  }
  await clickButtonText('檢查數學解法'); await waitFor('位值表組成 2,408'); await clickButtonText('繼續下一個挑戰');
  await clickButtonText('1 個百位 → 10 個十位'); await clickButtonText('檢查數學解法'); await waitFor('你把 1 個百換成 10 個十'); await clickButtonText('繼續下一個挑戰');
  await clickButtonText('1 個千位 → 10 個百位'); await clickButtonText('檢查數學解法'); await waitFor('交換後是 0 個千'); await clickButtonText('繼續下一個挑戰');
  await waitFor('候選任務完成！'); await waitFor('修復進度 1/10');
  const story = await evaluate('document.querySelector(".candidate-route-story-progress")?.innerText');
  await clickButtonText('前往下一站：');
  await waitFor('直式進退位修復站：逐欄算、逐欄換');
  const secondTitle = await evaluate('document.getElementById("catalog-task-title")?.innerText');
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitFor('數字島修復任務：三年級數學候選主線');
  const after = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  if (before !== after) throw new Error('Mainline candidate sequence changed localStorage.');
  const progress = await evaluate('document.querySelector(".grade3-math-mainline-progress")?.innerText');
  await clickButtonText('從第一站重新開始'); await waitFor('位值積木交換工坊：組數、換位與驗值');
  await clickSelector('#catalog-task-screen [data-go="select"]'); await waitFor('數字島修復任務：三年級數學候選主線');
  return { firstActivityId: activity, wrongAttemptAndHintRetried: true, wrongFeedback, allFirstMissionStagesCompleted: true, storyProgressShown: Boolean(story?.includes('修復進度 1/10')), nextActivityTitle: secondTitle, returnedToMap: true, memoryProgress: progress, restartFromBeginning: true, localStorageUnchanged: true };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const results = [];
  for (const viewport of [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ]) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    const map = await enterMap();
    if (map.stops !== GRADE3_MATH_REPAIR_MAINLINE.stops.length) throw new Error(`Mainline stop count mismatch: ${JSON.stringify(map)}`);
    const mainline = await completePlaceValueFirstMission();
    const layout = await checkViewport(viewport);
    results.push({ viewport: viewport.name, map, mainline, layout });
  }
  if (diagnostics.consoleErrors.length || diagnostics.exceptions.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics reported errors: ${JSON.stringify(diagnostics)}`);
  const report = { source: targetUrl, browser: await evaluate('navigator.userAgent'), executedAt: new Date().toISOString(), routeId: GRADE3_MATH_REPAIR_MAINLINE.routeId, stops: GRADE3_MATH_REPAIR_MAINLINE.stops.map(({ order, activityId, missionTitle, curriculumCodes }) => ({ order, activityId, missionTitle, curriculumCodes })), results, diagnostics, localStorageCheck: 'candidate mainline/retry/replay flow snapshots unchanged', formalProgressIsolation: 'page-memory candidate route only; no formal progress or unlock writes' };
  await writeFile(new URL('../artifacts/grade3-math-repair-mainline-browser-acceptance.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally { socket.close(); }
