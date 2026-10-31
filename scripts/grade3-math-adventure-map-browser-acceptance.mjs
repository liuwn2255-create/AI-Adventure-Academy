import { writeFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE3_MATH_ADVENTURE_MAP } from '../prototype/data/grade3MathAdventureMap.js';

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
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const promise = pending.get(message.id);
    if (promise) {
      pending.delete(message.id);
      message.error ? promise.reject(new Error(message.error.message)) : promise.resolve(message.result);
    }
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
});
function send(method, params = {}) {
  const id = ++callId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(text, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if ((await evaluate('document.body.innerText')).includes(text)) return;
    await delay(40);
  }
  const state = await evaluate('({screen:document.querySelector(".screen:not([hidden])")?.id,body:(document.body?.innerText??"").slice(0,1200)})');
  throw new Error(`Timed out waiting for text: ${text}; state=${JSON.stringify(state)}; diagnostics=${JSON.stringify(diagnostics)}`);
}
async function clickButtonText(text) {
  const literal = JSON.stringify(text);
  const clicked = await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(b=>!b.disabled&&b.getClientRects().length&&b.innerText.replace(/\\s+/g,' ').trim().includes(${literal})); if(!button)return null; button.click(); return button.id||button.innerText.trim(); })()`);
  if (!clicked) throw new Error(`Button not found: ${text}`);
  await delay();
}
async function clickSelector(selector) {
  const clicked = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e||e.disabled||!e.getClientRects().length)return false; e.click(); return true; })()`);
  if (!clicked) throw new Error(`Control not found: ${selector}`);
  await delay();
}
async function checkLayout(viewport) {
  const metrics = await evaluate('({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,screen:document.querySelector(".screen:not([hidden])")?.id})');
  if (metrics.scroll > metrics.client || metrics.body > metrics.client) throw new Error(`Horizontal overflow at ${viewport.name}: ${JSON.stringify(metrics)}`);
  return metrics;
}
async function enterGrade3Map() {
  await send('Page.navigate', { url: targetUrl });
  const readyStart = Date.now();
  while (Date.now() - readyStart < 5000 && await evaluate('document.readyState') !== 'complete') await delay(40);
  await delay(250);
  await waitFor('開始探險');
  await clickButtonText('開始探險');
  await waitFor('選擇年級');
  await clickButtonText('三年級');
  await clickButtonText('數學');
  await clickButtonText('前往三年級數學冒險地圖');
  await waitFor('三年級數學冒險地圖');
  const map = await evaluate(`({cards:document.querySelectorAll('#grade3-math-adventure-regions .grade3-math-adventure-card').length,regions:[...document.querySelectorAll('.grade3-math-adventure-region')].map(x=>({id:x.dataset.regionId,count:x.querySelectorAll('.grade3-math-adventure-card').length,caption:x.querySelector('.grade3-math-region-count')?.innerText}))})`);
  if (map.cards !== GRADE3_MATH_ADVENTURE_MAP.registeredActivityCount) throw new Error(`Map activity count mismatch: ${JSON.stringify(map)}`);
  for (const region of map.regions) {
    if (region.count !== Number.parseInt(region.caption, 10)) throw new Error(`Region count mismatch: ${JSON.stringify(region)}`);
  }
  return map;
}
async function enterAndReturnFirstPerRegion() {
  const checks = [];
  for (const region of GRADE3_MATH_ADVENTURE_MAP.regions) {
    if (!region.activities.length) continue;
    const activity = region.activities[0];
    await clickSelector(`#grade3-math-adventure-regions [data-region-id="${region.id}"] .grade3-math-adventure-card button[data-activity-id="${activity.activityId}"]`);
    await waitFor(activity.title);
    const actual = await evaluate('document.getElementById("catalog-task-title")?.innerText');
    if (actual !== activity.title) throw new Error(`Wrong launch target for ${activity.activityId}: ${actual}`);
    await clickSelector('#catalog-task-screen [data-go="select"]');
    await waitFor('三年級數學冒險地圖');
    checks.push({ regionId: region.id, activityId: activity.activityId, openedTitle: actual, returned: true });
  }
  return checks;
}
async function enterAndReturnStandaloneDataTask() {
  const activity = GRADE3_MATH_ADVENTURE_MAP.regions.flatMap(({ activities }) => activities).find(({ adventureEntryKind }) => adventureEntryKind === 'dedicated_math_data');
  if (!activity) throw new Error('Standalone data-table task missing from adventure map.');
  await clickSelector(`#grade3-math-adventure-regions .grade3-math-adventure-card button[data-activity-id="${activity.activityId}"]`);
  await waitFor(activity.title);
  const actual = await evaluate('document.getElementById("math-data-quest-title")?.innerText');
  if (actual !== activity.title) throw new Error(`Wrong dedicated-task route: ${actual}`);
  await clickSelector('#math-data-quest-screen [data-go="select"]');
  await waitFor('三年級數學冒險地圖');
  return { activityId: activity.activityId, openedTitle: actual, entryRoute: 'math-data-quest', returned: true };
}
async function exerciseAndCompleteDivision() {
  const activity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G3-MATH-DIVISION-SHARING-CANDIDATE');
  if (!activity) throw new Error('Division sharing task missing from catalog.');
  const before = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  await clickSelector(`#grade3-math-adventure-regions .grade3-math-adventure-card button[data-activity-id="${activity.activityId}"]`);
  await waitFor(activity.title);
  await clickButtonText('開始數學挑戰');
  const first = activity.stages[0];
  for (const observation of first.observations) {
    const wrongIndex = first.categories.findIndex(({ id }) => id !== first.correctAssignments[observation.id]);
    await clickSelector(`#catalog-task-content [data-observation-id="${observation.id}"] button:nth-of-type(${wrongIndex + 1})`);
  }
  await clickButtonText('檢查數學解法');
  await waitFor('重新觀察並重試');
  await clickButtonText('重新觀察並重試');
  for (const observation of first.observations) {
    const correctIndex = first.categories.findIndex(({ id }) => id === first.correctAssignments[observation.id]);
    await clickSelector(`#catalog-task-content [data-observation-id="${observation.id}"] button:nth-of-type(${correctIndex + 1})`);
  }
  await clickButtonText('檢查數學解法');
  await clickButtonText('繼續下一個挑戰');
  const second = activity.stages[1];
  const correctOption = second.options.find(({ id }) => second.correctOptionIds.includes(id));
  await clickButtonText(correctOption.text);
  await clickButtonText('檢查數學解法');
  await waitFor('繼續下一個挑戰');
  await clickButtonText('繼續下一個挑戰');
  await waitFor('候選任務完成');
  const attempts = await evaluate('document.querySelectorAll(".candidate-attempt-list li").length');
  await clickButtonText('再玩一次');
  await waitFor('開始數學挑戰');
  await clickButtonText('開始數學挑戰');
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitFor('三年級數學冒險地圖');
  const after = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  if (before !== after) throw new Error('Map task modified localStorage.');
  return { activityId: activity.activityId, incorrectAttemptRetried: true, attempts, completed: true, replayed: true, returnedToMap: true, localStorageUnchanged: true };
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
    const map = await enterGrade3Map();
    const regionEntries = await enterAndReturnFirstPerRegion();
    const standaloneEntry = await enterAndReturnStandaloneDataTask();
    const workflow = await exerciseAndCompleteDivision();
    const layout = await checkLayout(viewport);
    await clickSelector('#grade3-math-map-return-directory');
    await delay(1100);
    const directoryReturn = await evaluate('({screen:document.querySelector(".screen:not([hidden])")?.id,gradeDirectory:Boolean(document.querySelector("#grade-options [data-grade-id=\\"grade-3\\"]")),focusedGrade:document.activeElement?.dataset?.gradeId??null,subjectDirectory:Boolean(document.getElementById("grade-subject-directory")?.children.length),mapEntryAvailable:Boolean(document.getElementById("grade-subject-open-map")&&!document.getElementById("grade-subject-open-map").hidden)})');
    if (directoryReturn.screen !== 'select-screen' || !directoryReturn.gradeDirectory || directoryReturn.focusedGrade !== 'grade-3' || !directoryReturn.subjectDirectory || !directoryReturn.mapEntryAvailable) throw new Error(`Grade directory return failed: ${JSON.stringify(directoryReturn)}`);
    await clickButtonText('前往三年級數學冒險地圖');
    await waitFor('三年級數學冒險地圖');
    results.push({ viewport: viewport.name, map, regionEntries, standaloneEntry, workflow, layout, directoryReturn });
  }
  const report = { source: targetUrl, browser: await evaluate('navigator.userAgent'), executedAt: new Date().toISOString(), results, diagnostics, localStorageCheck: 'division candidate workflow snapshot unchanged', formalProgressIsolation: 'candidate sessions remain in page memory; no formal progress writes' };
  if (diagnostics.consoleErrors.length || diagnostics.exceptions.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics reported errors: ${JSON.stringify(diagnostics)}`);
  const output = new URL('../artifacts/grade3-math-adventure-map-browser-acceptance.json', import.meta.url);
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  socket.close();
}
