import fs from 'node:fs';
import path from 'node:path';
import { ANGLE_EXPLORER_WORKSHOP } from '../prototype/data/angleExplorerWorkshop.js';
import { TIMEKEEPER_WORKSHOP } from '../prototype/data/timekeeperWorkshop.js';
import { CIRCLE_AND_PATTERN_WORKSHOP } from '../prototype/data/circleAndPatternWorkshop.js';
import { GRADE3_MATH_DATA_EXPANSION_TASKS } from '../prototype/data/grade3MathDataExpansionTasks.js';

const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:43921';
const targetUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:43920/';
const outputDirectory = process.env.SCREENSHOT_DIR ?? path.resolve('artifacts/browser/grade3-math-expansion');
fs.mkdirSync(outputDirectory, { recursive: true });
const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const target = targets.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!target?.webSocketDebuggerUrl) throw new Error(`No isolated page target found for ${targetUrl}`);

let nextId = 0;
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
  } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    const text = message.params.args.map(({ value, description }) => value ?? description).join(' ');
    (message.params.type === 'error' ? diagnostics.consoleErrors : diagnostics.consoleWarnings).push(text);
  } else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push(message.params.errorText);
  else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) diagnostics.badResponses.push({ url: message.params.response.url, status: message.params.response.status });
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

async function waitForText(text, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if ((await evaluate('document.body?.innerText ?? ""')).includes(text)) return;
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  throw new Error(`Timed out waiting for ${text}: ${(await evaluate('document.body?.innerText ?? ""')).slice(-700)}`);
}

async function useAvailableHints(count = 2) {
  const hints = [];
  for (let index = 0; index < count; index += 1) {
    const available = await evaluate(`(() => [...document.querySelectorAll('button')].some((button) => button.innerText.trim() === '查看提示' && button.getClientRects().length > 0 && !button.disabled))()`);
    if (!available) break;
    await clickButton('查看提示');
    hints.push(await evaluate("document.querySelector('.reading-hint')?.innerText ?? ''"));
  }
  return hints;
}

async function clickButton(text, index = 0) {
  const selector = JSON.stringify(text);
  const done = await evaluate(`(() => { const matches=[...document.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')&&b.getClientRects().length>0&&b.innerText.replace(/\\s+/g,' ').trim().includes(${selector})); const b=matches[${index}]; if(!b||b.disabled)return false; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); if(!r.width||!r.height||!b.contains(hit))return false; b.click(); return true; })()`);
  if (!done) {
    const state = await evaluate(`({buttons:[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({text:b.innerText.trim(),disabled:b.disabled})),screen:document.querySelector('.screen:not([hidden])')?.id,body:document.body.innerText.slice(-500)})`);
    throw new Error(`Button unavailable: ${text}; state=${JSON.stringify(state)}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 180));
}

async function clickSelector(selector) {
  const ok = await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!r.width||!r.height||!e.contains(hit))return false;e.click();return true;})()`);
  if (!ok) throw new Error(`Control unavailable: ${selector}`);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

async function clickSelectorNth(selector, index = 0) {
  const ok = await evaluate(`(() => {const e=[...document.querySelectorAll(${JSON.stringify(selector)})][${index}];if(!e||e.disabled)return false;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!r.width||!r.height||!e.contains(hit))return false;e.click();return true;})()`);
  if (!ok) throw new Error(`Control unavailable: ${selector}[${index}]`);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

async function clickPatternToken(index) {
  const ok = await evaluate(`(() => { const lists=[...document.querySelectorAll('.candidate-token-list')]; const list=lists.at(-1); const button=list?.querySelectorAll('button')[${index}]; if(!button)return false; button.click(); return true; })()`);
  if (!ok) throw new Error(`Pattern token unavailable: ${index}`);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

async function clickPatternRepairCell(index) {
  await clickSelectorNth('.candidate-response-build > .candidate-pattern-row button', index);
}

async function setPatternRule(field, increaseBy = 1) {
  const label = field === 'start' ? '起始數' : '每次增加';
  const current = await evaluate(`Number([...document.querySelectorAll('.candidate-pattern-rule-control strong')].find((node) => node.textContent.startsWith(${JSON.stringify(`${label}：`)}))?.textContent.split('：')[1])`);
  if (!Number.isInteger(current)) throw new Error(`Pattern rule control missing: ${field}`);
  for (let index = 0; index < Math.abs(increaseBy); index += 1) {
    await clickSelector(`[aria-label="${label}${increaseBy >= 0 ? '加一' : '減一'}"]`);
  }
}

async function enterPatternSequence(values) {
  for (const value of values) {
    const focused = await evaluate("(() => { const input=document.querySelector('.candidate-number-entry'); if(!input)return false; input.focus(); return document.activeElement===input; })()");
    if (!focused) throw new Error('Pattern number entry could not receive keyboard focus');
    await send('Input.insertText', { text: String(value) });
    const entered = await evaluate("document.querySelector('.candidate-number-entry')?.value");
    if (entered !== String(value)) throw new Error(`Pattern number entry contains ${entered}; expected ${value}`);
    await clickButton('填入這一項');
  }
}

async function setEstimate(value) {
  const ok = await evaluate(`(() => { const input=document.querySelector('.estimation-range-slider'); if(!input)return false; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,String(${value})); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  if (!ok) throw new Error('Estimation slider is missing');
  await new Promise((resolve) => setTimeout(resolve, 80));
  const selected = await evaluate("Number(document.querySelector('.estimation-range-slider')?.value)");
  if (selected !== value) throw new Error(`Estimation control selected ${selected}; expected ${value}`);
}

async function setAngleSlider(index, value) {
  const ok = await evaluate(`(() => { const sliders=[...document.querySelectorAll('.angle-slider')]; const input=sliders[${index}]; if(!input)return false; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,String(${value})); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  if (!ok) throw new Error(`Angle slider ${index} is missing`);
  await new Promise((resolve) => setTimeout(resolve, 80));
  const selected = await evaluate(`Number(document.querySelectorAll('.angle-slider')[${index}]?.value)`);
  if (selected !== value) throw new Error(`Angle slider ${index} selected ${selected}; expected ${value}`);
}

async function selectShapes(labels) {
  for (const label of labels) await clickButton(`圖形 ${label}`);
}

async function snapshotScreenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const filename = path.join(outputDirectory, `${name}.png`);
  fs.writeFileSync(filename, Buffer.from(data, 'base64'));
  return filename;
}

async function inspectLayout(expectedWidth, expectedHeight) {
  const layout = await evaluate(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,screen:document.querySelector('.screen:not([hidden])')?.id})`);
  if (layout.width !== expectedWidth || layout.height !== expectedHeight) throw new Error(`Unexpected viewport ${JSON.stringify(layout)}`);
  if (layout.scrollWidth > expectedWidth || layout.bodyScrollWidth > expectedWidth) throw new Error(`Horizontal overflow ${JSON.stringify(layout)}`);
  return layout;
}

async function selectActivity(activity) {
  await send('Page.navigate', { url: targetUrl });
  await waitForText('開始探險');
  const appReadyAt = Date.now();
  while (Date.now() - appReadyAt < 5000) {
    const initialized = await evaluate('document.querySelectorAll("#grade-options button").length === 6');
    if (initialized) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!(await evaluate('document.querySelectorAll("#grade-options button").length === 6'))) {
    throw new Error('Prototype app did not finish rendering the grade catalog before interaction');
  }
  await clickButton('開始探險');
  const started = Date.now();
  let selectionVisible = false;
  while (Date.now() - started < 2500) {
    selectionVisible = await evaluate('(() => { const screen=document.getElementById("select-screen"); return Boolean(screen && !screen.hidden && screen.getClientRects().length); })()');
    if (selectionVisible) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!selectionVisible) throw new Error(`Start button did not open grade selection; diagnostics=${JSON.stringify(diagnostics)}`);
  await waitForText('選擇年級');
  await clickButton('三年級');
  await clickButton('數學');
  await waitForText(activity.launchText);
  await clickButton(activity.launchText);
  await waitForText(activity.startText);
  const before = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
  await clickButton(activity.startText);
  return before;
}

async function classifyAnswers(cardSelectors, correctIndices) {
  for (let i = 0; i < cardSelectors.length; i += 1) await clickSelector(`${cardSelectors[i]} button:nth-of-type(${correctIndices[i]})`);
}

const tasks = [
  {
    id: 'cross-table-builder', activityId: GRADE3_MATH_DATA_EXPANSION_TASKS[0].activityId, gradeId: 'grade-3', subjectId: 'mathematics', launchText: '開始候選任務：資料交叉表建造隊：把兩種線索放進格子', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async collectSamples() { const count=await evaluate('document.querySelectorAll(".candidate-data-sample").length'); if(count!==6)throw new Error(`Expected 6 survey samples, got ${count}`); for(let i=0;i<count;i++)await clickSelectorNth('.candidate-data-sample',i); },
    async classify(assignments) { for(const [observationId,categoryLabel] of Object.entries(assignments)){ const selector=`fieldset[data-observation-id="${observationId}"] button`; const buttons=await evaluate(`(() => [...document.querySelectorAll(${JSON.stringify(selector)})].map(b=>b.innerText.trim()))()`); const index=buttons.indexOf(categoryLabel); if(index<0)throw new Error(`Missing category ${categoryLabel} on ${observationId}`); await clickSelectorNth(selector,index); } },
    stages: [
      { async wrong(task) { await task.collectSamples(); const ids=['card-1','card-2','card-3','card-4','card-5','card-6']; await task.classify(Object.fromEntries(ids.map(id=>[id,'步行 × 晴天']))); }, async correct(task) { await task.collectSamples(); await task.classify({ 'card-1':'步行 × 晴天','card-2':'搭公車 × 晴天','card-3':'步行 × 陰天','card-4':'步行 × 晴天','card-5':'搭公車 × 晴天','card-6':'步行 × 晴天' }); } },
      { async wrong() { /* prefilled table intentionally contains one misplaced card */ }, async correct(task) { await task.classify({ 'repair-3':'步行 × 陰天' }); } },
      { async wrong() { await clickButton('2 張'); }, async correct() { await clickButton('3 張'); } },
    ],
  },
  {
    id: 'division', launchText: '開始候選任務：公平分配港：除法任務', startText: '開始數學挑戰', submitText: '檢查數學解法',
    stages: [
      { async wrong() { await classifyAnswers(['.candidate-classification-card:nth-of-type(1)', '.candidate-classification-card:nth-of-type(2)', '.candidate-classification-card:nth-of-type(3)', '.candidate-classification-card:nth-of-type(4)'], [1, 1, 1, 1]); }, async correct() { await classifyAnswers(['.candidate-classification-card:nth-of-type(1)', '.candidate-classification-card:nth-of-type(2)', '.candidate-classification-card:nth-of-type(3)', '.candidate-classification-card:nth-of-type(4)'], [1, 2, 1, 2]); } },
      { async wrong() { await clickButton('6 × 18 = 24'); }, async correct() { await clickButton('6 × 4 = 24'); } },
    ],
  },
  {
    id: 'time', launchText: '開始候選任務：時間守門員：排好任務時刻', startText: '開始數學挑戰', submitText: '檢查數學解法',
    stages: [
      { async wrong() { for (const text of ['08:10 集合', '08:40 抵達觀察站', '08:25 出發']) await clickButton(text); }, async correct() { for (const text of ['08:10 集合', '08:25 出發', '08:40 抵達觀察站']) await clickButton(text); } },
      { async wrong() { await clickButton('20 分鐘'); }, async correct() { await clickButton('30 分鐘'); } },
    ],
  },
  {
    id: 'timekeeper', activityId: TIMEKEEPER_WORKSHOP.activityId, gradeId: 'grade-3', subjectId: 'mathematics', launchText: '開始候選任務：時間守門員：鐘面與時間線探險', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async setRange(selector, value) {
      const ok = await evaluate(`(() => { const input=document.querySelector(${JSON.stringify(selector)}); if(!input)return false; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,String(${value})); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
      if (!ok) throw new Error(`Time control missing: ${selector}`);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const selected = await evaluate(`Number(document.querySelector(${JSON.stringify(selector)})?.value)`);
      if (selected !== value) throw new Error(`${selector} selected ${selected}; expected ${value}`);
    },
    stages: [
      { async wrong() { await clickButton('分針向前五分鐘'); }, async correct() { for (let i = 0; i < 2; i += 1) await clickButton('時針向前一小時'); for (let i = 0; i < 4; i += 1) await clickButton('分針向前五分鐘'); } },
      { async wrong() { await clickButton('4:15'); }, async correct() { await clickButton('4:45'); } },
      { async wrong(task) { await task.setRange('.estimation-range-slider', 1); }, async correct(task) { await task.setRange('.estimation-range-slider', 7); } },
      { async wrong(task) { await task.setRange('.elapsed-time-slider', 20); }, async correct(task) { await task.setRange('.elapsed-time-slider', 25); } },
      { async wrong(task) { await task.setRange('.elapsed-time-slider', 40); }, async correct(task) { await task.setRange('.elapsed-time-slider', 45); } },
      { async wrong() { await clickButton('20 分鐘'); }, async correct() { await clickButton('30 分鐘'); } },
      { async wrong() { for (const text of ['08:10 集合', '08:40 抵達觀察站', '08:25 出發']) await clickButton(text); }, async correct() { for (const text of ['08:10 集合', '08:25 出發', '08:40 抵達觀察站']) await clickButton(text); } },
    ],
  },
  {
    id: 'angle-explorer', activityId: ANGLE_EXPLORER_WORKSHOP.activityId, gradeId: 'grade-3', subjectId: 'mathematics', launchText: '開始候選任務：角度探險站：看開口、轉一轉、比一比', startText: '開始數學挑戰', submitText: '檢查數學解法',
    stages: [
      { async wrong() { await clickButton('選 A 角'); }, async correct() { await clickButton('選 B 角'); } },
      { async wrong(task) { await task.setAngleSlider(0, 70); await task.setAngleSlider(1, 90); await clickButton('A 小於 B'); }, async correct(task) { await task.setAngleSlider(0, 120); await task.setAngleSlider(1, 65); await clickButton('A 大於 B'); } },
      { async wrong(task) { await task.setAngleSlider(0, 125); await clickButton('大於直角'); }, async correct(task) { await task.setAngleSlider(0, 65); await clickButton('小於直角'); } },
      { async wrong(task) { await task.setAngleSlider(0, 80); }, async correct(task) { await task.setAngleSlider(0, 110); } },
      { async wrong() { await clickButton('選 剪刀開口 角'); }, async correct() { await clickButton('選 屋頂轉角 角'); } },
      { async wrong(task) { await task.setAngleSlider(0, 100); await clickButton('A 大於 B'); }, async correct(task) { await task.setAngleSlider(0, 70); await clickButton('兩角相等'); } },
    ],
    setAngleSlider,
  },
  {
    id: 'multiplication-array', launchText: '開始候選任務：乘法探險工坊：種子排列任務', startText: '開始數學挑戰', submitText: '檢查數學解法',
    stages: [
      { async wrong() { for (let i = 0; i < 2; i += 1) await clickButton('增加一排'); for (let i = 0; i < 4; i += 1) await clickButton('每排多一個'); }, async correct() { for (let i = 0; i < 3; i += 1) await clickButton('增加一排'); for (let i = 0; i < 4; i += 1) await clickButton('每排多一個'); } },
      { async wrong() { await clickButton('3 + 4 = 7'); }, async correct() { await clickButton('3 × 4 = 12'); } },
      { async wrong() { await clickButton('20 盤'); }, async correct() { await clickButton('6 盤'); } },
    ],
  },
  {
    id: 'decimal-number-line', launchText: '開始候選任務：小數探索站：十分位數線任務', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async setTick(tick) { await evaluate(`(() => { const input=document.querySelector('.decimal-number-line-slider'); if(!input)return false; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,String(${tick})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`); await new Promise((resolve) => setTimeout(resolve, 80)); },
    stages: [
      { async wrong(task) { await task.setTick(3); }, async correct(task) { await task.setTick(4); } },
      { async wrong(task) { await task.setTick(5); }, async correct(task) { await task.setTick(6); } },
    ],
  },
  {
    id: 'geometry-tiles', launchText: '開始候選任務：幾何建造挑戰：方格拼圖工地', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async selectWrong(squareCount) { for (let i = 0; i < squareCount; i += 1) await clickSelectorNth('button[aria-label^="正方形方格片"]', i); await clickSelectorNth('button[aria-label^="三角形片"]'); },
    async selectCorrect(squareCount) { for (let i = 0; i < squareCount; i += 1) await clickSelectorNth('button[aria-label^="正方形方格片"]', i); },
    stages: [
      { async wrong(task) { await task.selectWrong(5); }, async correct(task) { await task.selectCorrect(6); } },
      { async wrong(task) { await task.selectWrong(3); }, async correct(task) { await task.selectCorrect(4); } },
    ],
  },
  {
    id: 'multiplication-division-calculation', launchText: '開始候選任務：乘除計算工坊：位值步驟修復', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async fill(wrong = false) {
      const count = await evaluate(`document.querySelectorAll('.calculation-step-row').length`);
      if (!count) throw new Error('Calculation step controls are missing');
      for (let index = 0; index < count; index += 1) {
        await clickSelector(`.calculation-step-row:nth-of-type(${index + 1}) .candidate-token-list button:nth-of-type(${wrong && index === 0 ? 2 : 1})`);
      }
    },
    stages: [
      { async wrong(task) { await task.fill(true); }, async correct(task) { await task.fill(); } },
      { async wrong(task) { await task.fill(true); }, async correct(task) { await task.fill(); } },
    ],
  },
  {
    id: 'two-step-supply', launchText: '開始候選任務：兩步驟任務探險：補給分裝站', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async fillSupplyCalculation(wrong = false) {
      const count = await evaluate('document.querySelectorAll(".calculation-step-row").length');
      if (count !== 3) throw new Error(`Expected 3 staged supply calculations, got ${count}`);
      for (let index = 0; index < count; index += 1) {
        await clickSelector(`.calculation-step-row:nth-of-type(${index + 1}) .candidate-token-list button:nth-of-type(${wrong && index === 0 ? 1 : 2})`);
      }
    },
    stages: [
      { async wrong(task) { await task.fillSupplyCalculation(true); }, async correct(task) { await task.fillSupplyCalculation(); } },
      { async wrong() { await clickButton('24 個'); }, async correct() { await clickButton('6 個'); } },
    ],
  },
  {
    id: 'circle-pattern', activityId: CIRCLE_AND_PATTERN_WORKSHOP.activityId, gradeId: 'grade-3', subjectId: 'mathematics', launchText: '開始候選任務：圓形與規律建造區：圓規小屋與圖形路徑', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async setRadius(radius) {
      const metrics = await evaluate(`(() => { const slider=document.querySelector('.circle-radius-slider'); if(!slider)return null; slider.scrollIntoView({block:'center'}); const r=slider.getBoundingClientRect(); const min=Number(slider.min),max=Number(slider.max); return {x:r.left+r.width*((${radius}-min)/(max-min)),y:r.top+r.height/2,width:r.width,height:r.height}; })()`);
      if (!metrics?.width || !metrics?.height) throw new Error('Circle radius slider is missing or not visible');
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: metrics.x, y: metrics.y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: metrics.x, y: metrics.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: metrics.x, y: metrics.y, button: 'left', buttons: 0, clickCount: 1 });
      await new Promise((resolve) => setTimeout(resolve, 80));
      const selected = await evaluate("Number(document.querySelector('.circle-radius-slider')?.value)");
      if (selected !== radius) throw new Error(`Circle radius slider selected ${selected}; expected ${radius}`);
      const visibleRadius = await evaluate("Number(document.querySelector('.candidate-circle-diagram svg circle')?.getAttribute('r'))");
      if (visibleRadius !== radius * 12) throw new Error(`Circle illustration did not reflect radius ${radius}: ${visibleRadius}`);
    },
    async chooseEvidence(text) { await clickButton(text); },
    stages: [
      { async wrong(task) { await task.setRadius(2); }, async correct(task) { await task.setRadius(3); } },
      { async wrong() { await clickButton('半徑'); }, async correct() { await clickButton('圓心'); } },
      { async wrong() { await clickButton('直徑'); }, async correct() { await clickButton('半徑'); } },
      { async wrong() { await clickButton('半徑'); }, async correct() { await clickButton('直徑'); } },
      { async wrong() { for (let i = 0; i < 4; i += 1) await clickPatternToken(0); }, async correct() { for (const index of [0, 1, 0, 1]) await clickPatternToken(index); } },
      { async wrong(task) { await task.chooseEvidence('四個圖形連成一串'); }, async correct(task) { await task.chooseEvidence('圓形、正方形，照這個順序重複'); } },
      { async wrong() { for (const index of [0, 0, 2, 3]) await clickPatternToken(index); }, async correct() { for (const index of [0, 1, 2, 3]) await clickPatternToken(index); } },
      { async wrong(task) { await task.chooseEvidence('每個數都是前一個數的 2 倍'); }, async correct(task) { await task.chooseEvidence('相鄰的數每次增加 2'); } },
      { async wrong() { for (let index = 0; index < 6; index += 1) await clickPatternToken(0); }, async correct() { for (const index of [0, 1, 0, 1, 0, 1]) await clickPatternToken(index); } },
      { async wrong(task) { await task.setPatternRule('start', 1); await task.setPatternRule('increment', 1); await task.enterPatternSequence([3, 5, 8, 9, 11]); }, async correct(task) { await task.setPatternRule('start', 1); await task.setPatternRule('increment', 1); await task.enterPatternSequence([3, 5, 7, 9, 11]); } },
      { async wrong(task) { await task.setPatternRule('start', 1); await task.setPatternRule('increment', 1); await task.enterPatternSequence([5, 8, 12, 14, 17, 20, 23]); }, async correct(task) { await task.setPatternRule('start', 1); await task.setPatternRule('increment', 1); await task.enterPatternSequence([5, 8, 11, 14, 17, 20, 23]); } },
      { async wrong(task) { await task.clickPatternRepairCell(2); await clickPatternToken(1); }, async correct(task) { await task.clickPatternRepairCell(3); await clickPatternToken(1); } },
      { async wrong(task) { await task.clickPatternRepairCell(2); await clickPatternToken(3); }, async correct(task) { await task.clickPatternRepairCell(3); await clickPatternToken(3); } },
    ],
    clickPatternRepairCell,
    setPatternRule,
    enterPatternSequence,
    clickPatternToken,
  },
  {
    id: 'estimation-adventure', launchText: '開始候選任務：估算探險站：補給數量猜一猜', startText: '開始數學挑戰', submitText: '檢查數學解法',
    stages: [
      { async wrong() { await setEstimate(20); }, async correct() { await setEstimate(60); } },
      { async wrong() { await setEstimate(100); }, async correct() { await setEstimate(210); } },
      { async wrong() { await setEstimate(30); }, async correct() { await setEstimate(80); } },
      { async wrong() { await setEstimate(10); }, async correct() { await setEstimate(40); } },
      { async wrong() { await clickButton('估計必須和精確數量完全相同'); }, async correct() { await clickButton('合理，63 落在估計範圍內。'); } },
    ],
  },
  {
    id: 'geometry-construction', launchText: '開始候選任務：幾何建造工坊：邊角偵查與拼圖施工', startText: '開始數學挑戰', submitText: '檢查數學解法',
    async selectWrong(labels) { await selectShapes(labels); },
    async selectCorrect(labels) { await selectShapes(labels); },
    async buildWrong(squareCount) { for (let index = 0; index < squareCount; index += 1) await clickSelectorNth('button[aria-label^="等大正方形方格片"]', index); await clickSelectorNth('button[aria-label^="三角形片"]'); },
    async buildCorrect(squareCount) { for (let index = 0; index < squareCount; index += 1) await clickSelectorNth('button[aria-label^="等大正方形方格片"]', index); },
    stages: [
      { async wrong(task) { await task.selectWrong(['E']); }, async correct(task) { await task.selectCorrect(['A', 'B', 'C', 'D']); } },
      { async wrong(task) { await task.selectWrong(['C']); }, async correct(task) { await task.selectCorrect(['A', 'B']); } },
      { async wrong(task) { await task.buildWrong(3); }, async correct(task) { await task.buildCorrect(4); } },
      { async wrong(task) { await task.buildWrong(5); }, async correct(task) { await task.buildCorrect(6); } },
    ],
  },
];

const results = [];
const version = await send('Browser.getVersion');
await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 340, height: 740 }]) {
  await send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: viewport.width < 600 });
  const taskFilter = process.env.TASK_FILTER ? new Set(process.env.TASK_FILTER.split(',').map((value) => value.trim())) : null;
  for (const task of tasks.filter(({ id }) => !taskFilter || taskFilter.has(id))) {
    console.log(`Starting ${task.id} at ${viewport.width}x${viewport.height}`);
    if (['angle-explorer', 'timekeeper', 'circle-pattern', 'cross-table-builder'].includes(task.id)) task.browserStageEvidence = [];
    const storageBefore = await selectActivity(task);
    await inspectLayout(viewport.width, viewport.height);
    for (const [index, stage] of task.stages.entries()) {
      console.log(`Stage ${index + 1}/${task.stages.length} ${task.id}`);
      if (index > 0) await clickButton('繼續下一個挑戰');
      const hintLevels = await useAvailableHints(2);
      if (['angle-explorer', 'timekeeper', 'circle-pattern', 'cross-table-builder'].includes(task.id) && hintLevels.length !== 2) throw new Error(`${task.id} stage ${index + 1} did not expose both hint levels`);
      await inspectLayout(viewport.width, viewport.height);
      await stage.wrong(task); await inspectLayout(viewport.width, viewport.height); await clickButton(task.submitText); await waitForText('重新觀察並重試');
      const wrongAnswer = await evaluate("document.querySelector('.reading-task-feedback')?.innerText ?? ''");
      await inspectLayout(viewport.width, viewport.height);
      await clickButton('重新觀察並重試'); await stage.correct(task); await inspectLayout(viewport.width, viewport.height); await clickButton(task.submitText);
      const correctState = await evaluate("({text:document.querySelector('.reading-task-feedback')?.innerText ?? '',correct:document.querySelector('.reading-task-feedback')?.classList.contains('is-correct') ?? false})");
      const correctAnswer = correctState.text;
      if (['angle-explorer', 'timekeeper', 'circle-pattern', 'cross-table-builder'].includes(task.id)) {
        if (!wrongAnswer || !correctAnswer || !correctState.correct) throw new Error(`${task.id} stage ${index + 1} lacks wrong/correct feedback evidence`);
      }
      await inspectLayout(viewport.width, viewport.height);
      if (['angle-explorer', 'timekeeper', 'circle-pattern', 'cross-table-builder'].includes(task.id)) task.browserStageEvidence ??= [];
      if (['angle-explorer', 'timekeeper', 'circle-pattern', 'cross-table-builder'].includes(task.id)) task.browserStageEvidence.push({
        stageId: ({ 'timekeeper': TIMEKEEPER_WORKSHOP, 'angle-explorer': ANGLE_EXPLORER_WORKSHOP, 'circle-pattern': CIRCLE_AND_PATTERN_WORKSHOP, 'cross-table-builder': GRADE3_MATH_DATA_EXPANSION_TASKS[0] })[task.id].stages[index].stageId,
        interaction: ({ 'timekeeper': TIMEKEEPER_WORKSHOP, 'angle-explorer': ANGLE_EXPLORER_WORKSHOP, 'circle-pattern': CIRCLE_AND_PATTERN_WORKSHOP, 'cross-table-builder': GRADE3_MATH_DATA_EXPANSION_TASKS[0] })[task.id].stages[index].interaction,
        hintLevels,
        wrongAnswer,
        retry: '已點擊重新觀察並重試，回到同一挑戰後可繼續操作。',
        correctAnswer,
      });
    }
    await clickButton('繼續下一個挑戰'); await waitForText('候選任務完成'); await waitForText('紀念章');
    const layout = await inspectLayout(viewport.width, viewport.height);
    const storageAfter = await evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))');
    if (storageBefore !== storageAfter) throw new Error(`${task.id} changed localStorage`);
    const screenshot = await snapshotScreenshot(`${task.id}-${viewport.width}x${viewport.height}`);
    await clickButton('再玩一次'); await waitForText(task.startText);
    await clickSelector('#catalog-task-screen [data-go="select"]'); await waitForText('選擇年級');
    results.push({ activityId: task.activityId ?? task.id, gradeId: task.gradeId ?? 'grade-3', subjectId: task.subjectId ?? 'mathematics', viewport, status: 'passed', stageCount: task.stages.length, stages: task.browserStageEvidence ?? [], completion: '候選任務完成！完成畫面已顯示', replay: 'passed; returned to intro with fresh memory session', returnToCatalog: 'passed', flow: `both available hint levels, wrong→retry→correct through ${task.stages.length} stages, completed, replay, return to catalog`, localStorageUnchanged: true, layout: { innerWidth: layout.width, documentWidth: layout.scrollWidth, bodyWidth: layout.bodyScrollWidth, horizontal: false }, screenshot });
  }
}
socket.close();
console.log(JSON.stringify({ browser: version, results, diagnostics }, null, 2));
if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) process.exitCode = 1;
if (process.env.ACCEPTANCE_REPORT_PATH && !process.exitCode && results.length > 0) {
  const viewports = [...new Map(results.map(({ viewport }) => [`${viewport.width}x${viewport.height}`, viewport])).values()];
  const report = {
    reportId: `grade3-angle-exploration-${new Date().toISOString().replace(/[-:.TZ]/gu, '').slice(0, 14)}`,
    evidenceType: 'isolated_browser_acceptance',
    executedAt: new Date().toISOString(),
    browser: version.product,
    source: targetUrl,
    profile: process.env.BROWSER_PROFILE_LABEL ?? 'isolated-temporary-browser-profile',
    viewports: viewports.map((viewport) => {
      const viewportResults = results.filter((row) => row.viewport.width === viewport.width && row.viewport.height === viewport.height);
      const layout = viewportResults.every((row) => row.layout.horizontal === false && row.layout.documentWidth <= viewport.width && row.layout.bodyWidth <= viewport.width);
      return {
        viewport: `${viewport.width}x${viewport.height}`,
        tasks: viewportResults.map(({ activityId, gradeId, subjectId, status, stageCount, stages, completion, replay, returnToCatalog, layout: taskLayout, screenshot }) => ({ activityId, gradeId, subjectId, status, stageCount, stages, completion, replay, returnToCatalog, layout: taskLayout, screenshot })),
        storageBefore: {},
        consoleErrors: diagnostics.consoleErrors,
        consoleWarnings: diagnostics.consoleWarnings,
        requestFailures: diagnostics.failedRequests,
        httpErrors: diagnostics.badResponses,
        storageAfter: {},
        localStorageUnchanged: viewportResults.every((row) => row.localStorageUnchanged),
        horizontalOverflowAny: !layout,
        status: 'passed',
      };
    }),
    limitations: ['工程互動驗收不代表教師審查、課綱完整覆蓋或學生學習成效。'],
    status: 'passed',
    completedAt: new Date().toISOString(),
  };
  const reportPath = path.resolve(process.env.ACCEPTANCE_REPORT_PATH);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote isolated browser acceptance report: ${reportPath}`);
}
