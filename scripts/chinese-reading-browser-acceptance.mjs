import fs from 'node:fs';
import path from 'node:path';

const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:43976';
const targetUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:43975/';
const outputDirectory = process.env.SCREENSHOT_DIR ?? path.resolve('artifacts/browser/chinese-reading-candidates');
fs.mkdirSync(outputDirectory, { recursive: true });
const targetList = await (await fetch(`${cdpUrl}/json/list`)).json();
const target = targetList.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!target?.webSocketDebuggerUrl) throw new Error(`No isolated browser page found at ${targetUrl}`);

let id = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    }
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    const text = message.params.args.map(({ value, description }) => value ?? description).join(' ');
    diagnostics[message.params.type === 'error' ? 'consoleErrors' : 'consoleWarnings'].push(text);
  }
  if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
});

function send(method, params = {}) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
const pause = (ms = 70) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForText(text, timeout = 5000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await pause(50);
  }
  throw new Error(`Timed out waiting for ${text}: ${(await evaluate('document.body.innerText')).slice(-800)}; screen=${await evaluate("document.querySelector('.screen:not([hidden])')?.id")}; diagnostics=${JSON.stringify(diagnostics)}`);
}
async function waitForExpression(expression, timeout = 12000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await evaluate(expression)) return;
    await pause(40);
  }
  throw new Error(`Timed out waiting for page initialization: ${expression}; diagnostics=${JSON.stringify(diagnostics)}`);
}
async function clickButton(text, occurrence = 0) {
  const clicked = await evaluate(`(() => {
    const matches=[...document.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')&&b.getClientRects().length&&b.innerText.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));
    const b=matches[${occurrence}]; if(!b||b.disabled)return null; b.scrollIntoView({block:'center',inline:'nearest'}); b.click(); return b.innerText.trim();
  })()`);
  if (!clicked) throw new Error(`Button missing or disabled: ${text}`);
  await pause();
}
async function clickSelector(selector, occurrence = 0) {
  const clicked = await evaluate(`(() => { const e=[...document.querySelectorAll(${JSON.stringify(selector)})][${occurrence}]; if(!e||e.disabled||!e.getClientRects().length)return false; e.scrollIntoView({block:'center'});e.click();return true;})()`);
  if (!clicked) throw new Error(`Control missing or disabled: ${selector}[${occurrence}]`);
  await pause();
}
async function checkLayout(width, height) {
  const layout = await evaluate(`({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,scrollHeight:document.documentElement.scrollHeight,scrollTop:scrollY,screen:document.querySelector('.screen:not([hidden])')?.id,visibleButtons:[...document.querySelectorAll('.screen:not([hidden]) button')].filter(b=>b.getClientRects().length).length})`);
  if (layout.width !== width || layout.height !== height) throw new Error(`Viewport mismatch ${JSON.stringify(layout)}`);
  if (layout.documentWidth > width || layout.bodyWidth > width) throw new Error(`Horizontal overflow ${JSON.stringify(layout)}`);
  return layout;
}
async function screenshot(filename) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const full = path.join(outputDirectory, filename);
  fs.writeFileSync(full, Buffer.from(data, 'base64'));
  return full;
}
async function enterTask(title, startText) {
  await send('Page.navigate', { url: targetUrl });
  await waitForExpression("document.getElementById('grade-options')?.children.length > 0");
  await waitForText('開始探險');
  await clickButton('開始探險');
  await waitForText('選擇年級');
  await clickButton('三年級');
  await clickButton('國語文');
  await waitForText(`開始候選任務：${title}`);
  await clickButton(`開始候選任務：${title}`);
  await waitForText(startText);
  const storage = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  await clickButton(startText);
  return storage;
}
async function showHints(count = 2) {
  for (let index = 0; index < count; index += 1) {
    const available = await evaluate(`[...document.querySelectorAll('button')].some(b=>b.innerText.trim()==='查看提示'&&b.getClientRects().length&&!b.disabled)`);
    if (!available) break;
    await clickButton('查看提示');
    const hintVisible = await evaluate("Boolean(document.querySelector('.reading-hint')?.textContent.trim())");
    if (!hintVisible) throw new Error('Hint control was clickable but no hint appeared in the game UI.');
  }
}
async function assertFeedback(kind) {
  if (!(await evaluate(`Boolean(document.querySelector('.reading-task-feedback.is-${kind}')?.textContent.trim())`))) throw new Error(`Expected ${kind} feedback did not appear.`);
}
async function finishAndReplay(storageBefore, title, startText, screenshotName, width, height) {
  await clickButton('繼續下一個挑戰');
  await waitForText('候選任務完成');
  await waitForText('探索小隊完成章');
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  await pause();
  const layout = await checkLayout(width, height);
  const completedScreenshot = await screenshot(screenshotName);
  const storageAfter = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  if (storageAfter !== storageBefore) throw new Error('Candidate task changed localStorage');
  await clickButton('再玩一次');
  await waitForText(startText);
  await clickSelector('#catalog-task-screen [data-go="select"]');
  await waitForText('選擇年級');
  return { completedScreenshot, layout, localStorageUnchanged: true, replayAndReturn: 'passed' };
}

async function runClue(width, height, suffix) {
  const title = '故事森林：線索救援隊'; const start = '開始國語閱讀冒險';
  const storage = await enterTask(title, start); await checkLayout(width, height); await showHints();
  await clickButton('花盆土摸起來乾乾的。'); await clickButton('幾天後，葉子慢慢挺起來。'); await clickButton('檢查閱讀線索');
  await waitForText('重新觀察並重試'); await assertFeedback('incorrect'); await clickButton('重新觀察並重試'); await showHints();
  await clickButton('小禾把花盆移到有陽光的桌邊。'); await clickButton('小禾每天查看土，乾了就澆水。'); await clickButton('檢查閱讀線索');
  await waitForText('繼續下一個挑戰'); await assertFeedback('correct'); await clickButton('繼續下一個挑戰'); await showHints();
  await clickButton('她在等窗外下雨來比賽。'); await clickButton('檢查閱讀線索'); await waitForText('重新觀察並重試'); await assertFeedback('incorrect');
  await clickButton('重新觀察並重試'); await clickButton('她想知道土是否乾了，再決定要不要澆水。'); await clickButton('檢查閱讀線索');
  await waitForText('繼續下一個挑戰'); await assertFeedback('correct');
  return { activity: title, ...await finishAndReplay(storage, title, start, `clue-rescue-${suffix}.png`, width, height) };
}
async function runContext(width, height, suffix) {
  const title = '語詞工坊：讀懂語境，拼好句子'; const start = '開始國語閱讀冒險';
  const storage = await enterTask(title, start); await checkLayout(width, height); await showHints();
  await clickButton('替每個人的水壺修理裂縫。'); await clickButton('檢查閱讀線索'); await waitForText('重新觀察並重試'); await assertFeedback('incorrect');
  await clickButton('重新觀察並重試'); await showHints(); await clickButton('把別人遺失的物品交還給主人。'); await clickButton('檢查閱讀線索');
  await waitForText('繼續下一個挑戰'); await assertFeedback('correct'); await clickButton('繼續下一個挑戰'); await showHints();
  await clickButton('把鉛筆交給失主。'); await clickButton('小安'); await clickButton('撿到鉛筆後，'); await clickButton('檢查閱讀線索');
  await waitForText('重新觀察並重試'); await assertFeedback('incorrect'); await clickButton('重新觀察並重試');
  await clickButton('小安'); await clickButton('撿到鉛筆後，'); await clickButton('把鉛筆交給失主。'); await clickButton('檢查閱讀線索');
  await waitForText('繼續下一個挑戰'); await assertFeedback('correct');
  return { activity: title, ...await finishAndReplay(storage, title, start, `context-sentence-${suffix}.png`, width, height) };
}
async function runSequence(width, height, suffix) {
  const title = '故事森林：事件順序時間線'; const start = '開始國語閱讀冒險';
  const storage = await enterTask(title, start); await checkLayout(width, height); await showHints();
  await clickButton('檢查閱讀線索'); await waitForText('重新觀察並重試'); await assertFeedback('incorrect'); await clickButton('重新觀察並重試'); await showHints();
  const desired = ['阿哲發現圖書角的書散在桌上。', '阿哲依書背標籤把書分成兩堆。', '阿哲和同學把書放回架上。', '大家很快找到想看的書。'];
  for (let targetIndex = 0; targetIndex < desired.length; targetIndex += 1) {
    let state = await evaluate(`([...document.querySelectorAll('.candidate-order-row')].map(li=>li.querySelector('.candidate-order-text')?.innerText))`);
    let currentIndex = state.indexOf(desired[targetIndex]);
    while (currentIndex > targetIndex) { await clickSelector(`.candidate-order-row:nth-child(${currentIndex + 1}) .candidate-order-controls button[aria-label*="往前移"]`); currentIndex -= 1; }
    while (currentIndex < targetIndex) { await clickSelector(`.candidate-order-row:nth-child(${currentIndex + 1}) .candidate-order-controls button[aria-label*="往後移"]`); currentIndex += 1; }
  }
  await clickButton('檢查閱讀線索'); await waitForText('繼續下一個挑戰'); await assertFeedback('correct'); await clickButton('繼續下一個挑戰'); await showHints();
  await clickButton('阿哲最喜歡紅色書背標籤。'); await clickButton('檢查閱讀線索'); await waitForText('重新觀察並重試'); await assertFeedback('incorrect');
  await clickButton('重新觀察並重試'); await clickButton('阿哲和同學整理圖書角，讓大家更容易找到書。'); await clickButton('檢查閱讀線索');
  await waitForText('繼續下一個挑戰'); await assertFeedback('correct');
  return { activity: title, ...await finishAndReplay(storage, title, start, `story-sequence-${suffix}.png`, width, height) };
}

try {
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable'); await send('Log.enable');
  const browser = await (await fetch(`${cdpUrl}/json/version`)).json();
  const results = [];
  const viewports = [
    { label: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { label: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { label: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    for (const run of [runClue, runContext, runSequence]) results.push({ viewport: viewport.label, ...(await run(viewport.width, viewport.height, viewport.label)) });
  }
  const report = { executedAt: new Date().toISOString(), browser: browser.Browser, source: targetUrl, viewportCount: viewports.length, taskFlowResults: results, diagnostics, formalDataIsolation: 'candidate response sessions were memory-only; localStorage snapshots unchanged across each task' };
  fs.writeFileSync(path.join(outputDirectory, 'acceptance-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.consoleWarnings.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) process.exitCode = 1;
} finally {
  socket.close();
}
