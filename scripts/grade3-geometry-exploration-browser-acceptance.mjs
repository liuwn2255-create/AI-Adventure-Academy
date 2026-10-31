import fs from 'node:fs';
import path from 'node:path';
import { GRADE3_GEOMETRY_EXPLORATION_WORKSHOP as task } from '../prototype/data/gradeThreeGeometryExplorationWorkshop.js';

const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:44562';
const targetUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:44561/';
const outDir = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/grade3-geometry-exploration-browser-acceptance');
fs.mkdirSync(outDir, { recursive: true });
const pages = await (await fetch(`${cdpUrl}/json/list`)).json();
const page = pages.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!page?.webSocketDebuggerUrl) throw new Error(`No isolated browser page for ${targetUrl}`);

let commandId = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], failedRequests: [], badResponses: [] };
const socket = new WebSocket(page.webSocketDebuggerUrl);
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
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') diagnostics.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitText(text) {
  const start = Date.now();
  while (Date.now() - start < 8000) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await wait(40);
  }
  const screen = await evaluate('document.querySelector(".screen:not([hidden])")?.id');
  const buttons = await evaluate('[...document.querySelectorAll("button")].filter(b=>b.getClientRects().length).map(b=>[b.id,b.innerText.trim(),b.disabled])');
  throw new Error(`Timed out waiting for ${text}; screen=${screen}; buttons=${JSON.stringify(buttons)}; diagnostics=${JSON.stringify(diagnostics)}`);
}
async function clickText(text) {
  const clicked = await evaluate(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&!b.disabled&&!b.closest('[hidden]'));const b=bs.find(b=>b.innerText.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)})??bs.find(b=>b.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));if(!b)return false;b.scrollIntoView({block:'center',inline:'nearest'});b.click();return true})()`);
  if (!clicked) throw new Error(`Button not found or disabled: ${text}`);
  await wait();
}
async function clickSelector(selector) {
  const clicked = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!clicked) throw new Error(`Control not found or disabled: ${selector}`);
  await wait();
}
async function clickPiece(label) {
  const clicked = await evaluate(`(()=>{const b=[...document.querySelectorAll('.geometry-recomposition-cell.is-piece')].find(e=>e.getAttribute('aria-label')?.includes(${JSON.stringify(label)}));if(!b)return false;b.click();return true})()`);
  if (!clicked) throw new Error(`Geometry piece unavailable: ${label}`);
  await wait();
}
async function layout() {
  const result = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth]})');
  if (result.document[0] !== result.document[1] || result.body[0] !== result.body[1]) throw new Error(`Horizontal overflow: ${JSON.stringify(result)}`);
  return result;
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}
async function storage() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))'); }

async function solvePlanar(stageIndex, wrong) {
  if (stageIndex === 0) {
    await clickText('↓ 下移');
    if (wrong) return;
    await clickPiece('下方長方形片');
    await clickText('旋轉 90°');
    return;
  }
  await clickText(wrong ? '→ 右移' : '↓ 下移');
  if (wrong) return;
  await clickText('→ 右移');
  await clickPiece('L 形拼片乙');
  await clickText('↑ 上移');
  await clickText('← 左移');
}

async function respond(stage, wrong) {
  if (stage.geometryMode === 'split_recompose') return solvePlanar(task.stages.indexOf(stage), wrong);
  const netId = wrong ? 'cross-net' : stage.stageId.includes('another') ? 'offset-net' : 'cross-net';
  await clickSelector(`.geometry-net-choice[aria-label="${netId === 'cross-net' ? '展開圖甲：十字展開' : '展開圖乙：錯開的展開圖'}"]`);
  await clickText('模擬摺合');
  await waitText('模擬摺合');
  if (wrong) await clickText('沒有共邊'); else await clickText('有共邊');
}

async function runViewport(viewport) {
  await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  await send('Page.navigate', { url: targetUrl });
  const readyStart = Date.now();
  while (Date.now() - readyStart < 8000 && await evaluate('document.readyState') !== 'complete') await wait(40);
  if (await evaluate('document.readyState') !== 'complete') throw new Error(`${viewport.name}: prototype document did not finish loading`);
  await waitText('開始探險');
  const checks = [await layout()];
  await clickSelector('#start-button'); await waitText('選擇年級');
  await clickText('三年級'); await waitText('學習領域與科目');
  await clickText('數學'); await waitText(`開始候選任務：${task.title}`);
  await clickText(`開始候選任務：${task.title}`); await waitText(task.title);
  checks.push(await layout());
  const introScreenshot = await screenshot(`${viewport.name}-intro`);
  const beforeStorage = await storage();
  await clickText('開始數學挑戰');
  for (const [index, stage] of task.stages.entries()) {
    if (index > 0) await clickText('繼續下一個挑戰');
    await waitText(stage.prompt);
    checks.push(await layout());
    await clickText('查看提示'); await waitText('提示 1：');
    await clickText('查看提示'); await waitText('提示 2：');
    await respond(stage, true);
    await clickText('檢查數學解法');
    await waitText('重新觀察並重試');
    const wrongFeedback = await evaluate('document.querySelector(".reading-task-feedback")?.innerText ?? ""');
    if (!wrongFeedback || wrongFeedback.includes('response_required')) throw new Error(`${stage.stageId}: wrong response did not reach feedback`);
    await clickText('重新觀察並重試');
    await respond(stage, false);
    await clickText('檢查數學解法');
    await waitText('繼續下一個挑戰');
  }
  await clickText('繼續下一個挑戰');
  await waitText('候選任務完成！');
  checks.push(await layout());
  const completeScreenshot = await screenshot(`${viewport.name}-complete`);
  if (beforeStorage !== await storage()) throw new Error(`${viewport.name}: localStorage changed during candidate run`);
  await clickText('再玩一次'); await waitText('開始數學挑戰');
  await clickText('開始數學挑戰'); await waitText(task.stages[0].prompt);
  await clickSelector('#catalog-task-screen [data-go="select"]'); await waitText('學習領域與科目');
  return { viewport: [viewport.width, viewport.height], result: 'PASS', stageCount: task.stages.length, wrongRetryCorrectPerStage: true, replay: 'PASS', returnedToSubjectCatalog: 'PASS', localStorageUnchanged: true, layoutsChecked: checks.length, introScreenshot, completeScreenshot };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  const viewportRuns = [];
  for (const viewport of [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ]) viewportRuns.push(await runViewport(viewport));
  const report = { activityId: task.activityId, officialScope: task.curriculumCodes, browser: await evaluate('navigator.userAgent'), source: targetUrl, executedAt: new Date().toISOString(), viewportRuns, diagnostics };
  const reportPath = path.join(outDir, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, activityId: task.activityId, viewportRuns, diagnostics }, null, 2));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) process.exitCode = 1;
} finally {
  socket.close();
}
