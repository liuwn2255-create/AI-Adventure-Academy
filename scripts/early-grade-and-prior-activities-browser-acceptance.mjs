import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const cdpUrl = process.env.CDP_URL;
const targetUrl = process.env.PROTOTYPE_URL;
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/cross-grade-gap-fill-browser-acceptance');
if (!cdpUrl || !targetUrl) throw new Error('Set CDP_URL and PROTOTYPE_URL to this run’s verified dedicated ports; no defaults are used.');
fs.mkdirSync(outDir, { recursive: true });
const acceptanceIds = new Set([
  'ACT-G5-MATH-FRACTION-EQUIVALENCE-PIECES-CANDIDATE',
  'ACT-G5-SOCIAL-PERSPECTIVE-EVIDENCE-CANDIDATE',
  'ACT-G5-SCIENCE-FAIR-TEST-PLANNER-CANDIDATE',
  'ACT-G6-MATH-DATA-LIKELIHOOD-READER-CANDIDATE',
  'ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE',
  'ACT-G2-MATH-TWO-STEP-MARKET-CANDIDATE',
  'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE',
  'ACT-G2-LIVING-RULES-REASON-QUEST-CANDIDATE',
  'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE',
]);
const requestedIds = new Set((process.env.ACCEPTANCE_ACTIVITY_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean));
for (const id of requestedIds) if (!acceptanceIds.has(id)) throw new Error(`Activity is not configured for this browser suite: ${id}`);
const selectedIds = requestedIds.size ? requestedIds : acceptanceIds;
const ACCEPTANCE_TASKS = CATALOG_CANDIDATE_TASKS.filter(({ activityId }) => selectedIds.has(activityId));
if (ACCEPTANCE_TASKS.length !== selectedIds.size) throw new Error(`Expected ${selectedIds.size} selected tasks, found ${ACCEPTANCE_TASKS.length}`);

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

const subjectLabels = { mathematics: '數學', 'chinese-language': '國語文', 'natural-science': '自然科學', 'english-language': '英語文', 'social-studies': '社會', arts: '藝術', 'living-curriculum': '生活課程', 'integrative-activities': '綜合活動', 'health-physical-education': '健康與體育' };
const startLabels = { mathematics: '開始數學挑戰', 'chinese-language': '開始國語閱讀冒險', 'natural-science': '開始整理觀察紀錄', 'english-language': '開始情境對話', 'social-studies': '開始社區資料探險', arts: '開始視覺創作', 'living-curriculum': '開始物品探索', 'integrative-activities': '開始排學習步驟', 'health-physical-education': '開始安全巡檢' };
const gradeLabels = { 'grade-1': '一年級', 'grade-2': '二年級', 'grade-3': '三年級', 'grade-4': '四年級', 'grade-5': '五年級', 'grade-6': '六年級' };

async function enterTask(task, viewportName) {
  await send('Page.navigate', { url: targetUrl });
  const began = Date.now();
  while (Date.now() - began < 7000 && await evaluate('document.readyState') !== 'complete') await pause(40);
  await waitForText('開始探險');
  await clickText('開始探險');
  await waitForText('選擇年級');
  await clickText(gradeLabels[task.gradeId]);
  await waitForText('學習領域與科目');
  const layouts = [await inspectLayout()];
  await clickText(subjectLabels[task.subjectId]);
  await waitForText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`);
  await waitForText(task.title);
  layouts.push(await inspectLayout());
  await screenshot(`${task.activityId}-${viewportName}-intro`);
  const before = await storage();
  await clickText(startLabels[task.subjectId]);
  return { before, layouts };
}

async function sortItems(stage, correct) {
  const targetIds = correct ? stage.correctItemIds : [...stage.correctItemIds];
  if (!correct && targetIds.length > 1) [targetIds[0], targetIds[1]] = [targetIds[1], targetIds[0]];
  for (let targetIndex = 0; targetIndex < targetIds.length; targetIndex += 1) {
    let current = await evaluate(`([...document.querySelectorAll('.candidate-order-row')].map(r=>r.querySelector('.candidate-order-text').textContent))`);
    let currentIds = current.map((text) => stage.items.find(({ text: itemText }) => itemText === text).id);
    let index = currentIds.indexOf(targetIds[targetIndex]);
    while (index > targetIndex) {
      await clickSelector(`.candidate-order-row:nth-of-type(${index + 1}) button[aria-label^="將第 ${index + 1} 件往前移"]`);
      index -= 1;
    }
    while (index < targetIndex) {
      await clickSelector(`.candidate-order-row:nth-of-type(${index + 1}) button[aria-label^="將第 ${index + 1} 件往後移"]`);
      index += 1;
    }
    current = await evaluate(`([...document.querySelectorAll('.candidate-order-row')].map(r=>r.querySelector('.candidate-order-text').textContent))`);
    currentIds = current.map((text) => stage.items.find(({ text: itemText }) => itemText === text).id);
    if (currentIds[targetIndex] !== targetIds[targetIndex]) throw new Error(`Unable to place ordered item ${targetIds[targetIndex]}`);
  }
}

async function provideResponse(task, stage, mode) {
  const correct = mode === 'correct';
  if (stage.interaction === 'choose_response') {
    const option = correct ? stage.options.find(({ id }) => stage.correctOptionIds.includes(id)) : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id));
    await clickText(option.text);
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const id of ids) await clickText(stage.options.find(({ id: optionId }) => optionId === id).text);
  } else if (['classify_observations', 'build_frequency_table'].includes(stage.interaction)) {
    for (const [index, observation] of stage.observations.entries()) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = correct || index > 0 ? expected : stage.categories.find(({ id }) => id !== expected).id;
      const categoryIndex = stage.categories.findIndex(({ id }) => id === categoryId);
      await clickSelector(`.candidate-classification-card:nth-of-type(${index + 1}) .candidate-category:nth-of-type(${categoryIndex + 1})`);
    }
  } else if (stage.interaction === 'order_items') {
    await sortItems(stage, correct);
  } else if (stage.interaction === 'compose_shape') {
    const ids = correct
      ? stage.shapeRules.correctPieceIds
      : [...stage.shapeRules.correctPieceIds.slice(0, -1), stage.pieces.find(({ id }) => !stage.shapeRules.correctPieceIds.includes(id)).id];
    for (const id of ids) await clickText(stage.pieces.find(({ id: pieceId }) => pieceId === id).label);
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
  } else if (stage.interaction === 'build_array') {
    const rows = stage.arrayRules.targetRows;
    const columns = correct ? stage.arrayRules.targetColumns : Math.max(1, stage.arrayRules.targetColumns - 1);
    for (let index = 0; index < rows; index += 1) await clickText('增加一排');
    for (let index = 0; index < columns; index += 1) await clickText('每排多一個');
    const current = await evaluate("document.querySelector('.math-array-builder strong')?.innerText ?? ''");
    if (!current.includes(`目前陣列：${rows} 排 × 每排 ${columns} 個`)) throw new Error(`Array controls did not update: ${current}`);
  } else if (stage.interaction === 'assemble_response') {
    let ids = [...stage.correctOptionIds];
    if (!correct) ids = [ids[1], ids[0], ...ids.slice(2)];
    for (const id of ids) {
      const tokenIndex = stage.tokens.findIndex(({ id: tokenId }) => tokenId === id);
      const selected = await evaluate(`(()=>{const b=document.querySelectorAll('.candidate-response-build + .candidate-token-list .candidate-token')[${tokenIndex}];if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
      if (!selected) throw new Error(`Phrase token control unavailable: ${id}`);
      await pause();
    }
  } else throw new Error(`Browser driver missing interaction: ${stage.interaction} (${task.activityId})`);
  await inspectLayout();
  await clickSelector('.reading-task-controls button:last-child');
  await pause(120);
}

async function runTask(task, viewportName) {
  console.log(`Running ${task.activityId} at ${viewportName}`);
  const { before, layouts } = await enterTask(task, viewportName);
  const stageEvidence = [];
  for (const [index, stage] of task.stages.entries()) {
    if (index > 0) await clickText('繼續下一個挑戰');
    await waitForText(stage.prompt);
    layouts.push(await inspectLayout());
    await clickText('查看提示'); await waitForText('提示 1：');
    const hint1 = await evaluate("document.querySelector('.reading-hint')?.innerText ?? ''");
    await clickText('查看提示'); await waitForText('提示 2：');
    const hint2 = await evaluate("document.querySelector('.reading-hint')?.innerText ?? ''");
    await provideResponse(task, stage, 'wrong');
    await waitForText('重新觀察並重試');
    const feedback = await evaluate("document.querySelector('.reading-task-feedback')?.innerText ?? ''");
    if (!feedback || feedback.includes('response_required')) throw new Error(`${task.activityId}/${stage.stageId}: no usable incorrect feedback`);
    await screenshot(`${task.activityId}-${viewportName}-${stage.stageId}-wrong`);
    await clickText('重新觀察並重試');
    await provideResponse(task, stage, 'correct');
    await waitForText('繼續下一個挑戰');
    const correctFeedback = await evaluate("document.querySelector('.reading-task-feedback')?.innerText ?? ''");
    stageEvidence.push({ stageId: stage.stageId, wrongAnswer: feedback, hintLevels: [hint1, hint2], retry: 'passed', correctAnswer: correctFeedback });
  }
  await clickText('繼續下一個挑戰');
  await waitForText('候選任務完成！');
  await waitForText(`共 ${task.stages.length * 2} 次作答嘗試`);
  await waitForText('本次活動紀念章');
  const completion = await evaluate('document.querySelector("#catalog-task-content")?.innerText ?? ""');
  layouts.push(await inspectLayout());
  const completedScreenshot = await screenshot(`${task.activityId}-${viewportName}-complete`);
  const after = await storage();
  if (before !== after) throw new Error(`${task.activityId}: localStorage changed during candidate activity`);
  await clickText('再玩一次');
  await waitForText(startLabels[task.subjectId]);
  await clickText(startLabels[task.subjectId]);
  await waitForText(task.stages[0].prompt);
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitForText('學習領域與科目');
  return { activityId: task.activityId, title: task.title, result: 'pass', layoutChecks: layouts.length, layouts, stageEvidence, completion, completedScreenshot, storageUnchanged: true, attemptsPerStage: 2, replayAndReturn: 'pass' };
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
    for (const task of ACCEPTANCE_TASKS) activities.push(await runTask(task, viewport.name));
    reports.push({ requestedViewport: [viewport.width, viewport.height], actualViewport: await evaluate('[innerWidth,innerHeight]'), activities });
  }
  const output = {
    browser: await evaluate('navigator.userAgent'), source: targetUrl, executedAt: new Date().toISOString(),
    viewportCount: reports.length, activityViewportRuns: reports.reduce((count, entry) => count + entry.activities.length, 0),
    expectedActivityCount: ACCEPTANCE_TASKS.length,
    viewports: reports, consoleErrors: events.consoleErrors, consoleWarnings: events.consoleWarnings,
    exceptions: events.exceptions, failedRequests: events.failedRequests, badResponses: events.badResponses,
    candidateStorage: 'localStorage snapshot unchanged during each activity; task attempts remain in page memory',
  };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(output, null, 2)}\n`);
  const evidenceViewports = reports.map((viewportReport) => {
    const viewport = `${viewportReport.requestedViewport[0]}x${viewportReport.requestedViewport[1]}`;
    return {
      viewport, status: 'passed', localStorageUnchanged: viewportReport.activities.every((activity) => activity.storageUnchanged), horizontalOverflowAny: false,
      consoleErrors: events.consoleErrors, requestFailures: events.failedRequests, httpErrors: events.badResponses,
      tasks: viewportReport.activities.map((activity) => ({ activityId: activity.activityId, status: 'passed', stageCount: activity.stageEvidence.length, stages: activity.stageEvidence, completion: activity.completion, replay: 'passed', returnToCatalog: 'passed' })),
    };
  });
  const evidenceDir = path.resolve('artifacts/learning-subitems-browser-acceptance/runs');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const evidenceId = `g2-money-market-${new Date(output.executedAt).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const evidencePath = path.join(evidenceDir, `${evidenceId}.json`);
  fs.writeFileSync(evidencePath, `${JSON.stringify({ reportId: evidenceId, evidenceType: 'isolated_browser_acceptance', status: 'passed', browser: output.browser, source: output.source, executedAt: output.executedAt, viewports: evidenceViewports, directoryEntryEvidence: ACCEPTANCE_TASKS.map(({ activityId }) => ({ activityId, startedFromDirectory: true, returnedToCorrectDirectory: true })), diagnostics: { exceptions: events.exceptions, consoleErrors: events.consoleErrors, failedRequests: events.failedRequests, badResponses: events.badResponses } }, null, 2)}\n`);
  console.log(JSON.stringify({ ...output, reportPath }, null, 2));
  if (events.exceptions.length || events.consoleErrors.length || events.failedRequests.length || events.badResponses.length) process.exitCode = 1;
} finally {
  socket.close();
}

