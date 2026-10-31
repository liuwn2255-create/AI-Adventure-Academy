import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE4_CANDIDATE_LEARNING_ROUTE } from '../prototype/data/grade4CandidateLearningRoute.js';

const cdpUrl = process.env.CDP_URL;
const targetUrl = process.env.PROTOTYPE_URL;
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade4-candidate-learning-route-browser-acceptance');
if (!cdpUrl || !targetUrl) throw new Error('Set CDP_URL and PROTOTYPE_URL to dedicated, isolated ports.');
fs.mkdirSync(outDir, { recursive: true });
const tasks = GRADE4_CANDIDATE_LEARNING_ROUTE.stops.map((stop) => CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === stop.activityId));
if (tasks.some((task) => !task)) throw new Error('Route references a missing task.');

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
    const waiter = pending.get(message.id);
    if (waiter) { pending.delete(message.id); message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result); }
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
const pause = (ms = 90) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(testExpression, label, timeout = 7000) {
  const started = Date.now();
  while (Date.now() - started < timeout) { if (await evaluate(testExpression)) return; await pause(50); }
  throw new Error(`Timed out waiting for ${label}; screen=${await evaluate('document.querySelector(".screen:not([hidden])")?.id')}; text=${(await evaluate('document.body?.innerText ?? ""')).slice(-700)}`);
}
async function clickSelector(selector) {
  const result = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!result) throw new Error(`Button not found, hidden, or disabled: ${selector}`);
  await pause();
}
async function clickText(text, occurrence = 0) {
  const result = await evaluate(`(()=>{const a=[...document.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')&&b.getClientRects().length&&!b.disabled);const exact=a.filter(b=>b.innerText.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)});const found=exact.length?exact:a.filter(b=>b.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));const b=found[${occurrence}];if(!b)return null;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return b.innerText.trim()})()`);
  if (!result) throw new Error(`Button not found/enabled: ${text}`);
  await pause();
}
async function inspectLayout() {
  const layout = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth],screen:document.querySelector(".screen:not([hidden])")?.id})');
  if (layout.document[1] > layout.document[0] || layout.body[1] > layout.body[0]) throw new Error(`Horizontal overflow: ${JSON.stringify(layout)}`);
  return layout;
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const filename = path.join(outDir, `${name}.png`);
  fs.writeFileSync(filename, Buffer.from(data, 'base64'));
  return filename;
}
async function localStorageSnapshot() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))'); }

const subjectNames = { 'chinese-language': '國語文', mathematics: '數學', 'natural-science': '自然科學', 'english-language': '英語文', 'social-studies': '社會', arts: '藝術', 'integrative-activities': '綜合活動', 'health-physical-education': '健康與體育' };
const startLabels = { 'chinese-language': '開始國語閱讀冒險', mathematics: '開始數學挑戰', 'natural-science': '開始整理觀察紀錄', 'english-language': '開始情境對話', 'social-studies': '開始社區資料探險', arts: '開始視覺創作', 'integrative-activities': '開始排學習步驟', 'health-physical-education': '開始安全巡檢' };

async function arrangeOrder(stage, correct) {
  let current = await evaluate('[...document.querySelectorAll(".candidate-order-row")].map(r=>r.querySelector(".candidate-order-text")?.textContent)');
  const idFromText = (text) => stage.items.find(({ text: itemText }) => itemText === text)?.id;
  const target = correct ? [...stage.correctItemIds] : [...stage.correctItemIds];
  if (!correct && target.length > 1) [target[0], target[1]] = [target[1], target[0]];
  for (let i = 0; i < target.length; i += 1) {
    let index = current.map(idFromText).indexOf(target[i]);
    while (index > i) { await clickSelector(`.candidate-order-row:nth-of-type(${index + 1}) button[aria-label^="將第 ${index + 1} 件往前移"]`); index -= 1; }
    while (index < i) { await clickSelector(`.candidate-order-row:nth-of-type(${index + 1}) button[aria-label^="將第 ${index + 1} 件往後移"]`); index += 1; }
    current = await evaluate('[...document.querySelectorAll(".candidate-order-row")].map(r=>r.querySelector(".candidate-order-text")?.textContent)');
  }
}
async function respond(task, stage, mode) {
  const correct = mode === 'correct';
  if (stage.interaction === 'choose_response') {
    const choice = correct ? stage.options.find(({ id }) => stage.correctOptionIds.includes(id)) : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    await clickText(choice.text);
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const id of ids) await clickText(stage.options.find(({ id: optionId }) => optionId === id).text);
  } else if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const category = correct || index > 0 ? expected : stage.categories.find(({ id }) => id !== expected).id;
      const categoryIndex = stage.categories.findIndex(({ id }) => id === category);
      await clickSelector(`.candidate-classification-card:nth-of-type(${index + 1}) .candidate-category:nth-of-type(${categoryIndex + 1})`);
    }
  } else if (stage.interaction === 'order_items') {
    await arrangeOrder(stage, correct);
  } else if (stage.interaction === 'compose_shape') {
    const ids = correct ? stage.shapeRules.correctPieceIds : [...stage.shapeRules.correctPieceIds.slice(0, -1), stage.pieces.find(({ id }) => !stage.shapeRules.correctPieceIds.includes(id)).id];
    for (const id of ids) await clickText(stage.pieces.find(({ id: pieceId }) => pieceId === id).label);
  } else if (stage.interaction === 'assemble_response') {
    let ids = [...stage.correctOptionIds];
    if (!correct && ids.length > 1) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (const id of ids) await clickText(stage.tokens.find(({ id: tokenId }) => tokenId === id).text);
  } else throw new Error(`Unsupported route interaction: ${task.activityId}/${stage.stageId}/${stage.interaction}`);
  await inspectLayout();
  await clickSelector('.reading-task-controls button:last-child');
  await pause(120);
}
async function beginRoute(viewportName) {
  await send('Page.navigate', { url: targetUrl });
  await waitFor('document.readyState === "complete" && document.body?.innerText.includes("開始探險")', 'home screen');
  await clickText('開始探險');
  await waitFor('document.querySelector("#grade-options")?.children.length === 6', 'grade picker');
  await clickSelector('#grade-options [data-grade-id="grade-4"]');
  await waitFor('document.querySelector("#grade-candidate-route-panel")?.hidden === false && document.querySelectorAll(".candidate-route-stop").length === 8', 'grade four route');
  await evaluate('document.querySelector("#grade-candidate-route-panel").scrollIntoView({block:"start"})');
  await pause();
  const routeScreenshot = await screenshot(`grade4-route-${viewportName}`);
  return { routeScreenshot, layout: await inspectLayout() };
}
async function playTask(task, viewportName, replayPass = false) {
  if (await evaluate('document.querySelector("#catalog-task-screen")?.hidden')) {
    await clickSelector(`[data-route-activity-id="${task.activityId}"]`);
  }
  await waitFor('document.querySelector("#catalog-task-screen")?.hidden === false', `task ${task.activityId}`);
  await waitFor(`document.querySelector("#catalog-task-title")?.textContent === ${JSON.stringify(task.title)}`, `${task.title} title`);
  const layouts = [await inspectLayout()];
  const storageBefore = await localStorageSnapshot();
  await screenshot(`${task.activityId}-${viewportName}-intro${replayPass ? '-replay' : ''}`);
  await clickText(startLabels[task.subjectId]);
  await waitFor('document.querySelector(".reading-stage-heading")', `${task.activityId} first stage`);
  for (const [index, stage] of task.stages.entries()) {
    if (index > 0) await clickText('繼續下一個挑戰');
    await waitFor(`document.body.innerText.includes(${JSON.stringify(stage.prompt)})`, `${task.activityId}/${stage.stageId} prompt`);
    layouts.push(await inspectLayout());
    await clickText('查看提示');
    if (!(await evaluate('document.body.innerText.includes("提示 1：")'))) throw new Error(`Hint one missing: ${task.activityId}/${stage.stageId}`);
    await clickText('查看提示');
    if (!(await evaluate('document.body.innerText.includes("提示 2：")'))) throw new Error(`Hint two missing: ${task.activityId}/${stage.stageId}`);
    await respond(task, stage, 'wrong');
    await waitFor('document.body.innerText.includes("重新觀察並重試")', `${task.activityId}/${stage.stageId} wrong feedback`);
    const feedback = await evaluate('document.querySelector(".reading-task-feedback")?.textContent ?? ""');
    if (!feedback || feedback.includes('response_required')) throw new Error(`No usable wrong feedback at ${task.activityId}/${stage.stageId}`);
    await screenshot(`${task.activityId}-${viewportName}-${stage.stageId}-wrong`);
    await clickText('重新觀察並重試');
    await respond(task, stage, 'correct');
    await waitFor('document.body.innerText.includes("繼續下一個挑戰")', `${task.activityId}/${stage.stageId} correct feedback`);
  }
  await clickText('繼續下一個挑戰');
  await waitFor('document.body.innerText.includes("候選任務完成！")', `${task.activityId} completion`);
  await waitFor(`document.body.innerText.includes("完成 ${task.stages.length} 個階段")`, `${task.activityId} attempts summary`);
  if (!replayPass) await waitFor('document.querySelector(".candidate-route-next")', `${task.activityId} route continuity`);
  layouts.push(await inspectLayout());
  const completionScreenshot = await screenshot(`${task.activityId}-${viewportName}-complete${replayPass ? '-replay' : ''}`);
  if (storageBefore !== await localStorageSnapshot()) throw new Error(`${task.activityId}: localStorage changed during candidate route task`);
  return { activityId: task.activityId, stageCount: task.stages.length, perStage: 'two hints, valid wrong response, targeted feedback, retry, correct response', layoutChecks: layouts.length, storageUnchanged: true, completionScreenshot };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const results = [];
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    const routeEntry = await beginRoute(viewport.name);
    const beforeRouteStorage = await localStorageSnapshot();
    await clickSelector(`[data-route-activity-id="${tasks[0].activityId}"]`);
    const activities = [];
    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];
      if (index > 0) await clickSelector('.candidate-route-next');
      activities.push(await playTask(task, viewport.name));
      if (index === 0) {
        await clickText('再玩一次');
        await waitFor(`document.body.innerText.includes(${JSON.stringify(startLabels[task.subjectId])})`, 'replay introduction');
        activities.push(await playTask(task, viewport.name, true));
      }
    }
    await clickText('返回四年級學習路線');
    await waitFor('document.querySelector("#grade-candidate-route-panel")?.hidden === false', 'return to route map');
    const routeState = await evaluate('[...document.querySelectorAll(".candidate-route-state")].map(x=>x.textContent)');
    if (routeState.length !== tasks.length || routeState.some((text) => !text.includes('已完成'))) throw new Error(`Route completion state missing after return: ${JSON.stringify(routeState)}`);
    if (beforeRouteStorage !== await localStorageSnapshot()) throw new Error('localStorage changed during route journey');
    await send('Page.reload');
    await waitFor('document.readyState === "complete" && document.body?.innerText.includes("開始探險")', 'home after reload');
    await clickText('開始探險');
    await waitFor('document.querySelector("#grade-options")?.children.length === 6', 'grade picker after reload');
    await clickSelector('#grade-options [data-grade-id="grade-4"]');
    await waitFor('document.querySelector("#grade-candidate-route-panel")?.hidden === false && document.querySelectorAll(".candidate-route-stop").length === 8', 'route after reload');
    const resetRouteState = await evaluate('[...document.querySelectorAll(".candidate-route-state")].map(x=>x.textContent)');
    if (resetRouteState.length !== tasks.length || resetRouteState.some((text) => !text.includes('尚未完成'))) throw new Error(`Candidate route state unexpectedly persisted beyond the page: ${JSON.stringify(resetRouteState)}`);
    if (beforeRouteStorage !== await localStorageSnapshot()) throw new Error('localStorage changed after route reload');
    results.push({ requestedViewport: [viewport.width, viewport.height], actualViewport: await evaluate('[innerWidth,innerHeight]'), routeEntryScreenshot: routeEntry.routeScreenshot, routeEntryLayout: routeEntry.layout, activityRuns: activities, allStopsCompleted: routeState.length, returnToMap: 'pass', pageReloadResetInMemoryRoute: 'pass', localStorageUnchanged: true });
  }
  const report = {
    runId: 'grade4-candidate-route-browser-acceptance-2026-10-23', browser: await evaluate('navigator.userAgent'), source: targetUrl,
    executedAt: new Date().toISOString(), routeId: GRADE4_CANDIDATE_LEARNING_ROUTE.routeId,
    routeStops: tasks.map(({ activityId, title, subjectId }) => ({ activityId, title, subjectId })),
    viewportRuns: results, consoleErrors: events.consoleErrors, consoleWarnings: events.consoleWarnings,
    exceptions: events.exceptions, failedRequests: events.failedRequests, badResponses: events.badResponses,
    limits: ['Only candidate route behavior was checked; this is not teacher review or student learning evidence.', 'No formal student records were edited; candidate activity state remained in page memory.'],
  };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, browser: report.browser, source: report.source, executedAt: report.executedAt, viewportSummaries: results.map(({ requestedViewport, actualViewport, allStopsCompleted, returnToMap, localStorageUnchanged }) => ({ requestedViewport, actualViewport, allStopsCompleted, returnToMap, localStorageUnchanged })), consoleErrors: events.consoleErrors, consoleWarnings: events.consoleWarnings, exceptions: events.exceptions, failedRequests: events.failedRequests, badResponses: events.badResponses }, null, 2));
  if (events.exceptions.length || events.consoleErrors.length || events.failedRequests.length || events.badResponses.length) process.exitCode = 1;
} finally {
  socket.close();
}
