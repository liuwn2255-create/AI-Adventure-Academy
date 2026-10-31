import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { GRADE4_MATH_GAP_TASKS } from '../prototype/data/grade4MathGapTasks.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set isolated PROTOTYPE_URL and CDP_URL before acceptance.');
const taskIds = [
  'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE',
  'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE',
  'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE',
];
const tasks = taskIds.map((id) => GRADE4_MATH_GAP_TASKS.find(({ activityId }) => activityId === id));
if (tasks.some((task) => !task)) throw new Error('A requested R-4-2/R-4-3/R-4-4 task is missing.');
const outputRoot = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade4-r42-r43-r44-browser-acceptance');
fs.mkdirSync(outputRoot, { recursive: true });
const diagnostics = { exceptions: [], consoleErrors: [], failedRequests: [], badResponses: [] };
let socket;
let sequence = 0;
const pending = new Map();

async function waitFor(check, message, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const value = await check(); if (value) return value; } catch { /* wait for a screen transition */ }
    await delay(100);
  }
  throw new Error(message);
}
function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result?.value;
}
const pause = () => delay(90);
async function pageText() { return evaluate('document.body?.innerText ?? ""'); }
async function waitText(value) { await waitFor(async () => (await pageText()).includes(value), `Timed out waiting for ${value}`); }
async function clickText(value) {
  const clicked = await evaluate(`(()=>{const n=e=>(e.innerText||e.textContent||'').replace(/\\s+/g,' ').trim();const b=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(n(e)===${JSON.stringify(value)}||n(e).includes(${JSON.stringify(value)})));if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
  if (!clicked) throw new Error(`Button unavailable: ${value}`);
  await pause();
}
async function clickUnselectedToken(value) {
  const clicked = await evaluate(`(()=>{const n=e=>(e.innerText||e.textContent||'').replace(/\\s+/g,' ').trim();const b=[...document.querySelectorAll('.candidate-token-list button[aria-pressed="false"]')].find(e=>e.getClientRects().length&&!e.disabled&&n(e)===${JSON.stringify(value)});if(!b)return false;b.click();return true})()`);
  if (!clicked) throw new Error(`Unselected answer token unavailable: ${value}`);
  await pause();
}
async function clickPatternToken(value) {
  const clicked = await evaluate(`(()=>{const n=e=>(e.innerText||e.textContent||'').replace(/\\s+/g,' ').trim();const b=[...document.querySelectorAll('.candidate-token-list .candidate-token')].find(e=>e.getClientRects().length&&!e.disabled&&n(e)===${JSON.stringify(value)});if(!b)return false;b.click();return true})()`);
  if (!clicked) throw new Error(`Pattern token unavailable: ${value}`);
  await pause();
}
async function clickActivity(task) {
  const ok = await evaluate(`(()=>{const b=document.querySelector('.catalog-task-launch[data-activity-id="${task.activityId}"]');if(!b)return false;b.click();return true})()`);
  if (!ok) throw new Error(`Activity is not reachable from grade 4 mathematics: ${task.activityId}`);
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
  const file = path.join(outputRoot, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}
async function answerAssembly(stage, correct) {
  let ids;
  if (correct) ids = stage.correctOptionIds;
  else {
    const distractor = stage.tokens.find(({ id }) => !stage.correctOptionIds.includes(id));
    ids = [distractor?.id, ...stage.correctOptionIds.filter((id) => id !== distractor?.id)].filter(Boolean).slice(0, stage.correctOptionIds.length);
    if (ids.every((id, index) => id === stage.correctOptionIds[index])) ids = [...stage.correctOptionIds].reverse();
  }
  for (const id of ids) await clickUnselectedToken(stage.tokens.find((token) => token.id === id).text);
}
async function answerOrder(stage, correct) {
  if (!correct) {
    await clickText('下移');
    return;
  }
  for (let targetIndex = 0; targetIndex < stage.correctItemIds.length; targetIndex += 1) {
    const targetId = stage.correctItemIds[targetIndex];
    const targetPosition = stage.items.findIndex(({ id }) => id === targetId);
    const target = stage.items[targetPosition];
    const sameTextOccurrence = stage.items.slice(0, targetPosition + 1).filter(({ text }) => text === target.text).length - 1;
    await evaluate(`(()=>{const desired=${JSON.stringify(target.text)}, occurrence=${sameTextOccurrence}, destination=${targetIndex};for(let guard=0;guard<20;guard++){const rows=[...document.querySelectorAll('.candidate-order-row')];const matches=rows.map((row,index)=>({row,index})).filter(({row})=>row.querySelector('.candidate-order-text')?.textContent.trim()===desired);const found=matches[occurrence];if(!found)return false;if(found.index===destination)return true;const direction=found.index>destination?'往前移':'往後移';const button=found.row.querySelector('button[aria-label^="將第 "][aria-label$="'+direction+'"]');if(!button||button.disabled)return false;button.click()}return false})()`);
    await pause();
  }
}
async function answerPattern(stage, correct) {
  let ids = stage.patternRules.targetPattern;
  if (!correct) {
    const distractor = stage.tokens.find(({ id }) => !ids.includes(id));
    ids = [distractor?.id ?? [...ids].reverse()[0], ...ids.filter((id) => id !== distractor?.id)].slice(0, stage.patternRules.beatCount);
  }
  for (const id of ids) await clickPatternToken(stage.tokens.find((token) => token.id === id).text);
}
async function answerCalculation(stage, correct) {
  for (const step of stage.calculationSteps) {
    const choice = correct ? step.choices.find(({ value }) => value === step.expectedValue) : step.choices.find(({ value }) => value !== step.expectedValue);
    const clicked = await evaluate(`(()=>{const rows=[...document.querySelectorAll('.calculation-step-row')];const row=rows.find(e=>e.querySelector('legend')?.textContent.trim()===${JSON.stringify(step.label)});const b=row&&[...row.querySelectorAll('button')].find(e=>(e.textContent||'').trim()===${JSON.stringify(String(choice.label ?? choice.value))});if(!b)return false;b.click();return true})()`);
    if (!clicked) throw new Error(`Calculation choice unavailable: ${stage.stageId}/${step.id}`);
    await pause();
  }
}
async function respond(stage, correct) {
  if (stage.interaction === 'choose_response') {
    const id = correct ? stage.correctOptionIds[0] : stage.options.find(({ id: optionId }) => !stage.correctOptionIds.includes(optionId)).id;
    return clickText(stage.options.find(({ id: optionId }) => optionId === id).text);
  }
  if (stage.interaction === 'assemble_response') return answerAssembly(stage, correct);
  if (stage.interaction === 'order_items') return answerOrder(stage, correct);
  if (stage.interaction === 'compose_pattern') return answerPattern(stage, correct);
  if (stage.interaction === 'complete_calculation_steps') return answerCalculation(stage, correct);
  throw new Error(`Unsupported stage interaction in acceptance: ${stage.interaction}`);
}
async function runStage(task, stage) {
  await waitText(stage.prompt);
  await clickText('查看提示'); await waitText('提示 1：');
  const hint1 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await clickText('查看提示'); await waitText('提示 2：');
  const hint2 = await evaluate('document.querySelector(".reading-hint")?.innerText ?? ""');
  await respond(stage, false);
  await clickText('檢查數學解法');
  await waitText('重新觀察並重試');
  const wrong = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
  const specificCalculationFeedback = stage.calculationSteps?.some(({ incorrectFeedback }) => incorrectFeedback && wrong.includes(incorrectFeedback));
  if (!wrong || wrong.includes('response_required') || (!wrong.includes(stage.incorrectFeedback) && !specificCalculationFeedback)) throw new Error(`${task.activityId}/${stage.stageId}: wrong-answer feedback mismatch: ${wrong}`);
  await clickText('重新觀察並重試');
  await waitText(stage.prompt);
  await respond(stage, true);
  await clickText('檢查數學解法');
  await waitText('繼續下一個挑戰');
  const right = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
  if (!right || !right.includes(stage.correctFeedback)) throw new Error(`${task.activityId}/${stage.stageId}: success feedback mismatch: ${right}`);
  return { stageId: stage.stageId, interaction: stage.interaction, hintLevels: [hint1, hint2], wrongFeedback: wrong, retry: 'passed; returned to the same stage and reset response', correctFeedback: right };
}
async function runTask(viewport, task) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  await send('Page.navigate', { url: targetUrl });
  await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'Prototype did not load.');
  await waitText('開始探險');
  const baseline = await storage();
  const layouts = [await layout()];
  await clickText('開始探險'); await waitText('選擇年級');
  await clickText('四年級'); await waitText('學習領域與科目');
  await clickText('數學'); await waitText('數學');
  await clickActivity(task); await waitText(task.title); await waitText('候選目標：');
  layouts.push(await layout());
  const introScreenshot = await screenshot(`${viewport.name}-${task.activityId}-intro`);
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed at intro.`);
  await clickText('開始數學挑戰');
  const stages = [];
  for (const stage of task.stages) {
    layouts.push(await layout());
    stages.push(await runStage(task, stage));
    await clickText('繼續下一個挑戰');
  }
  await waitText('候選任務完成！');
  layouts.push(await layout());
  const completionScreenshot = await screenshot(`${viewport.name}-${task.activityId}-completed`);
  const completionText = await pageText();
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed while playing.`);
  await clickText('再玩一次'); await waitText('開始數學挑戰');
  await clickText('開始數學挑戰'); await waitText(task.stages[0].prompt);
  await evaluate('document.querySelector("#catalog-task-screen [data-go=select]")?.click()');
  await waitText('學習領域與科目');
  if (!(await pageText()).includes('數學')) throw new Error(`${task.activityId}: return-to-directory failed.`);
  if (await storage() !== baseline) throw new Error(`${task.activityId}: localStorage changed after replay/return.`);
  return { viewport: `${viewport.width}x${viewport.height}`, activityId: task.activityId, status: 'passed', stages, completionText, replay: 'passed', returnToDirectory: 'passed', localStorageUnchanged: true, horizontalOverflowAny: false, layoutsChecked: layouts.length, introScreenshot, completionScreenshot };
}

try {
  const version = await fetch(`${cdpUrl}/json/version`);
  if (!version.ok) throw new Error(`CDP endpoint unavailable: HTTP ${version.status}`);
  const target = await waitFor(async () => {
    const response = await fetch(`${cdpUrl}/json/list`).catch(() => null);
    return response?.ok ? (await response.json()).find(({ type, url }) => type === 'page' && url.startsWith(targetUrl)) : null;
  }, `No isolated Chrome page at ${targetUrl}`);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const resolver = pending.get(message.id);
      if (resolver) { pending.delete(message.id); message.error ? resolver.reject(new Error(message.error.message)) : resolver.resolve(message.result); }
    } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
    else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const runs = [];
  for (const viewport of viewports) for (const task of tasks) runs.push(await runTask(viewport, task));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics failed: ${JSON.stringify(diagnostics)}`);
  const executedAt = new Date().toISOString();
  const reportId = `grade4-r42-r43-r44-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const report = { reportId, executedAt, targetUrl, browser: await evaluate('navigator.userAgent'), status: 'passed', activityCount: tasks.length, viewportCount: viewports.length, flowCount: runs.length, runs, diagnostics, limitations: ['此隔離瀏覽器驗收僅驗證工程操作流程，不代表教師審查、正式課綱完整涵蓋或學生學習成效。'] };
  fs.writeFileSync(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const evidenceDirectory = path.resolve('artifacts/learning-subitems-browser-acceptance/runs', `${reportId}-${randomUUID().slice(0, 8)}`);
  fs.mkdirSync(evidenceDirectory, { recursive: false });
  const evidence = {
    reportId, evidenceType: 'isolated_browser_acceptance', executedAt,
    browser: report.browser, source: targetUrl,
    profile: process.env.BROWSER_PROFILE ?? 'isolated profile path not supplied', status: 'passed',
    viewports: viewports.map((viewport) => ({
      viewport: `${viewport.width}x${viewport.height}`, status: 'passed',
      localStorageUnchanged: true, horizontalOverflowAny: false, consoleErrors: diagnostics.consoleErrors,
      requestFailures: diagnostics.failedRequests, httpErrors: diagnostics.badResponses,
      tasks: runs.filter(({ viewport: name }) => name === `${viewport.width}x${viewport.height}`).map(({ activityId, stages, completionText, replay, returnToDirectory, layoutsChecked }) => ({
        activityId, gradeId: 'grade-4', subjectId: 'mathematics', status: 'passed', stageCount: stages.length,
        stages: stages.map(({ stageId, interaction, hintLevels, wrongFeedback, retry, correctFeedback }) => ({ stageId, interaction, hintLevels, wrongAnswer: wrongFeedback, retry, correctAnswer: correctFeedback })),
        completion: completionText, replay: 'passed; replayed from a fresh in-memory session', returnToCatalog: returnToDirectory,
        layout: { layoutsChecked, horizontal: false },
      })),
    })),
    screenshots: runs.flatMap(({ introScreenshot, completionScreenshot }) => [path.relative(process.cwd(), introScreenshot), path.relative(process.cwd(), completionScreenshot)]),
  };
  fs.writeFileSync(path.join(evidenceDirectory, 'report.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ report: path.relative(process.cwd(), path.join(outputRoot, 'report.json')), evidenceReport: path.relative(process.cwd(), path.join(evidenceDirectory, 'report.json')), reportId, flowCount: runs.length, diagnostics }, null, 2));
} finally { socket?.close(); }
