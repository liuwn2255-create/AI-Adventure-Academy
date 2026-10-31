/**
 * Browser acceptance runner for the three cross-curriculum catalog tasks.
 * Run against an isolated Chrome DevTools Protocol endpoint and local prototype server:
 *   $env:CDP_URL='http://127.0.0.1:43918'; node scripts/catalog-candidate-browser-acceptance.mjs
 */
const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:43918';
const targetUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:43917/';
const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const target = targets.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!target?.webSocketDebuggerUrl) throw new Error(`No isolated page target found for ${targetUrl}`);

let nextId = 0;
const pending = new Map();
const browserEvents = { exceptions: [], consoleErrors: [], failedRequests: [], badResponses: [] };
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
  } else if (message.method === 'Runtime.exceptionThrown') browserEvents.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') browserEvents.consoleErrors.push(message.params.args.map(({ value, description }) => value ?? description).join(' '));
  else if (message.method === 'Network.loadingFailed') browserEvents.failedRequests.push({ url: message.params.requestId, error: message.params.errorText });
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) browserEvents.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
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

async function waitForText(text, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const state = await evaluate(`({screen:document.querySelector('.screen:not([hidden])')?.id, readyState:document.readyState, text:(document.body?.innerText ?? '').slice(0, 900)})`);
  throw new Error(`Timed out waiting for visible text: ${text}; state=${JSON.stringify(state)}; console=${JSON.stringify(browserEvents)}`);
}

async function clickButton(text, occurrence = 0) {
  const literal = JSON.stringify(text);
  const clicked = await evaluate(`(() => {
    const candidates = [...document.querySelectorAll('button')].filter((button) => {
      const style = getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden' && button.innerText.replace(/\\s+/g, ' ').trim().includes(${literal});
    });
    const button = candidates[${occurrence}];
    if (!button || button.disabled) return null;
    button.scrollIntoView({ block: 'center', inline: 'nearest' });
    button.click();
    return button.innerText.trim();
  })()`);
  if (!clicked) throw new Error(`Button unavailable or disabled: ${text} [${occurrence}]`);
  await new Promise((resolve) => setTimeout(resolve, 55));
}

async function clickSelector(selector) {
  const literal = JSON.stringify(selector);
  const clicked = await evaluate(`(() => {
    const element = document.querySelector(${literal});
    if (!element || element.disabled) return false;
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    element.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Control unavailable or disabled: ${selector}`);
  await new Promise((resolve) => setTimeout(resolve, 55));
}

async function bodyText() { return evaluate('document.body.innerText'); }
async function storageSnapshot() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))'); }

async function enterTask({ grade, subject, launch, start }) {
  await send('Page.navigate', { url: targetUrl });
  const loadStart = Date.now();
  while (Date.now() - loadStart < 4000 && await evaluate('document.readyState') !== 'complete') await new Promise((resolve) => setTimeout(resolve, 30));
  await new Promise((resolve) => setTimeout(resolve, 150));
  await waitForText('開始探險');
  await clickButton('開始探險');
  await waitForText('選擇年級');
  await clickButton(grade);
  await waitForText('學習領域與科目');
  await clickButton(subject);
  await waitForText(launch);
  await clickButton(launch);
  await waitForText(start);
  const storageBefore = await storageSnapshot();
  await clickButton(start);
  return storageBefore;
}

async function checkOverflow(name) {
  const layout = await evaluate(`({width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,screen:document.querySelector('.screen:not([hidden])')?.id})`);
  if (layout.scrollWidth > layout.clientWidth || layout.bodyScrollWidth > layout.clientWidth) throw new Error(`${name}: horizontal overflow ${JSON.stringify(layout)}`);
  return layout;
}

async function runLiving() {
  const task = { grade: '二年級', subject: '生活課程', launch: '開始候選任務：校園探索隊', start: '開始物品探索' };
  const storageBefore = await enterTask(task);
  await clickButton('查看提示');
  await waitForText('提示 1：');
  await clickButton('木片：有木紋和凹凸');
  await clickButton('提交觀察線索');
  await waitForText('重新觀察並重試');
  await waitForText('回到每張觀察卡');
  await clickButton('重新觀察並重試');
  await clickButton('木片：有木紋和凹凸');
  await clickButton('小石頭：有小凹凸');
  await clickButton('提交觀察線索');
  await clickButton('繼續下一個挑戰');
  await clickButton('它們的表面都有凹凸或粗糙的描述');
  await clickButton('提交觀察線索');
  await clickButton('繼續下一個挑戰');
  await waitForText('候選任務完成');
  await waitForText('共 3 次作答嘗試');
  await waitForText('本次活動紀念章');
  await waitForText('不寫入正式學生進度');
  const storageAfter = await storageSnapshot();
  if (storageBefore !== storageAfter) throw new Error('Living task changed localStorage');
  await clickButton('再玩一次');
  await waitForText('開始物品探索');
}

async function runHealthPe() {
  const task = { grade: '四年級', subject: '健康與體育', launch: '開始候選任務：安全小隊', start: '開始安全巡檢' };
  const storageBefore = await enterTask(task);
  await clickButton('查看提示');
  await waitForText('提示 1：');
  for (let i = 0; i < 4; i += 1) await clickSelector(`.candidate-classification-card:nth-of-type(${i + 1}) button:nth-of-type(1)`);
  await clickButton('檢查安全分類');
  await waitForText('重新觀察並重試');
  await waitForText('絆倒或滑倒風險');
  await clickButton('重新觀察並重試');
  for (let i = 0; i < 4; i += 1) await clickSelector(`.candidate-classification-card:nth-of-type(${i + 1}) button:nth-of-type(${i === 0 ? 1 : 2})`);
  await clickButton('檢查安全分類');
  await clickButton('繼續下一個挑戰');
  await clickSelector('.candidate-classification-card:nth-of-type(1) button:nth-of-type(2)');
  await clickButton('檢查安全分類');
  await clickButton('繼續下一個挑戰');
  await waitForText('候選任務完成');
  await waitForText('共 3 次作答嘗試');
  await waitForText('本次活動紀念章');
  await waitForText('不寫入正式學生進度');
  const storageAfter = await storageSnapshot();
  if (storageBefore !== storageAfter) throw new Error('Health and PE task changed localStorage');
  await clickButton('再玩一次');
  await waitForText('開始安全巡檢');
}

async function runIntegrative() {
  const task = { grade: '四年級', subject: '綜合活動', launch: '開始候選任務：學習方法工坊', start: '開始排學習步驟' };
  const storageBefore = await enterTask(task);
  await clickButton('查看提示');
  await waitForText('提示 1：');
  for (const token of ['選一張觀察表', '先說清楚要比較', '觀察葉片並把看到的特徵', '回看紀錄']) await clickButton(token);
  await clickButton('檢查步驟順序');
  await waitForText('重新觀察並重試');
  await waitForText('先說明目標');
  await clickButton('重新觀察並重試');
  for (const token of ['先說清楚要比較', '選一張觀察表', '觀察葉片並把看到的特徵', '回看紀錄']) await clickButton(token);
  await clickButton('檢查步驟順序');
  await clickButton('繼續下一個挑戰');
  for (const token of ['先說出要認識', '選擇圖例卡', '看地圖找符號', '遮住圖例']) await clickButton(token);
  await clickButton('檢查步驟順序');
  await clickButton('繼續下一個挑戰');
  await waitForText('候選任務完成');
  await waitForText('共 3 次作答嘗試');
  await waitForText('本次活動紀念章');
  await waitForText('不寫入正式學生進度');
  const storageAfter = await storageSnapshot();
  if (storageBefore !== storageAfter) throw new Error('Integrative task changed localStorage');
  await clickButton('再玩一次');
  await waitForText('開始排學習步驟');
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  const viewports = [
    { name: 'desktop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'narrow-340x740', width: 340, height: 740, mobile: true },
  ];
  const reports = [];
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    const activities = [];
    for (const [activityId, run] of [
      ['ACT-G2-LIVING-CAMPUS-OBSERVATION-CANDIDATE', runLiving],
      ['ACT-G4-HPE-COURT-SAFETY-CANDIDATE', runHealthPe],
      ['ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE', runIntegrative],
    ]) {
      await run();
      activities.push({ activityId, result: 'PASS', layout: await checkOverflow(activityId) });
    }
    reports.push({ viewport: viewport.name, expected: `${viewport.width}x${viewport.height}`, actual: await evaluate('`${innerWidth}x${innerHeight}`'), activities });
  }
  const output = {
    browser: await evaluate('navigator.userAgent'),
    source: targetUrl,
    executedAt: new Date().toISOString(),
    viewports: reports,
    consoleErrors: browserEvents.consoleErrors,
    exceptions: browserEvents.exceptions,
    failedRequests: browserEvents.failedRequests,
    badResponses: browserEvents.badResponses,
    formalProgressIsolation: 'each activity localStorage snapshot unchanged between task intro and completion',
  };
  console.log(JSON.stringify(output, null, 2));
} finally {
  socket.close();
}
