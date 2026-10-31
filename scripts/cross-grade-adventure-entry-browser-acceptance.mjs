import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { DEDICATED_GRADE_ACTIVITY_IDS, getGradeAdventureSummary, getSubjectDirectorySummary } from '../prototype/data/gradeActivityDirectory.js';
import { GRADE3_MATH_REPAIR_MAINLINE } from '../prototype/data/grade3MathRepairMainline.js';
import { MATH_DATA_TABLE_WORKSHOP } from '../prototype/data/mathDataTableWorkshop.js';

const targetUrl = process.env.PROTOTYPE_URL;
const cdpUrl = process.env.CDP_URL;
if (!targetUrl || !cdpUrl) throw new Error('Set PROTOTYPE_URL and CDP_URL to this run’s isolated ports.');
const outputRoot = path.resolve(process.env.ACCEPTANCE_OUTPUT ?? 'artifacts/cross-grade-adventure-entry-browser-acceptance');
fs.mkdirSync(outputRoot, { recursive: true });
const dedicatedScreen = new Map([
  ['ACT-G3-CHINESE-READING-GARDEN-CANDIDATE', 'reading-quest-screen'],
  ['ACT-G3-ENGLISH-CLASSROOM-CONVERSATION-CANDIDATE', 'english-quest-screen'],
  ['ACT-G3-SCIENCE-ANIMAL-FORM-OBSERVATION-CANDIDATE', 'science-quest-screen'],
  ['ACT-G3-SOCIAL-NEIGHBORHOOD-CHANGE-CANDIDATE', 'social-quest-screen'],
  ['ACT-G3-MATH-DATA-TABLE-WORKSHOP-CANDIDATE', 'math-data-quest-screen'],
  ['ACT-G3-ARTS-RHYTHM-WORKSHOP-CANDIDATE', 'arts-quest-screen'],
]);
const specialTitles = new Map(GRADE_CATALOG.flatMap(({ subjects }) => subjects.flatMap(({ existingYearLevelContent }) => existingYearLevelContent
  .filter(({ activityId }) => DEDICATED_GRADE_ACTIVITY_IDS.includes(activityId)).map(({ activityId, title }) => [activityId, title]))));
const tasksByGrade = new Map(GRADE_CATALOG.map((grade) => [grade.gradeId, grade.subjects.flatMap((subject) => {
  const summary = getSubjectDirectorySummary(grade, subject);
  return summary.activities.map((activity) => ({ ...activity, gradeId: grade.gradeId, subjectId: subject.subjectId }));
})]));
const expectedEntries = [...tasksByGrade.values()].flat();
if (new Set(expectedEntries.map(({ activityId }) => activityId)).size !== expectedEntries.length) throw new Error('Duplicate activity IDs exist in the cross-grade entry index.');
if (expectedEntries.length !== CATALOG_CANDIDATE_TASKS.length + DEDICATED_GRADE_ACTIVITY_IDS.length) throw new Error('Cross-grade entry index count does not match the real registrations.');

const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const pageTarget = targets.find(({ type, url }) => type === 'page' && url.startsWith(targetUrl));
if (!pageTarget?.webSocketDebuggerUrl) throw new Error(`No isolated page target found for ${targetUrl}`);
let nextId = 0;
const pending = new Map();
const diagnostics = { exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] };
const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') diagnostics.exceptions.push(message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    const text = message.params.args.map(({ value, description }) => value ?? description).join(' ');
    diagnostics[message.params.type === 'error' ? 'consoleErrors' : 'consoleWarnings'].push(text);
  } else if (message.method === 'Network.loadingFailed') diagnostics.failedRequests.push({ error: message.params.errorText });
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
const pause = (ms = 45) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(predicate, message, timeout = 9000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await predicate()) return;
    await pause(50);
  }
  const currentScreen = await activeScreen().catch(() => null);
  const currentText = await text().catch(() => '');
  throw new Error(`${message} Active screen: ${currentScreen}; visible text: ${currentText.slice(0, 650)}; browser errors: ${JSON.stringify({ exceptions: diagnostics.exceptions, consoleErrors: diagnostics.consoleErrors })}`);
}
async function click(selector) {
  const done = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)return false;e.scrollIntoView({block:'center',inline:'nearest'});e.click();return true})()`);
  if (!done) throw new Error(`Cannot click visible enabled control: ${selector}`);
  await pause();
}
async function activeScreen() { return evaluate('document.querySelector(".screen:not([hidden])")?.id ?? null'); }
async function text() { return evaluate('document.body?.innerText ?? ""'); }
async function storage() { return evaluate('JSON.stringify(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))'); }
async function checkNoOverflow(label) {
  const metrics = await evaluate('({viewport:[innerWidth,innerHeight],document:[document.documentElement.clientWidth,document.documentElement.scrollWidth],body:[document.body.clientWidth,document.body.scrollWidth]})');
  if (metrics.document[1] > metrics.document[0] || metrics.body[1] > metrics.body[0]) throw new Error(`${label} horizontal overflow: ${JSON.stringify(metrics)}`);
  return { label, ...metrics };
}
async function screenshot(filename) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const fullPath = path.join(outputRoot, filename);
  fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
  return path.relative(process.cwd(), fullPath).replaceAll('\\', '/');
}
async function openDirectory() {
  await send('Page.navigate', { url: targetUrl });
  await waitFor(async () => (await activeScreen()) === 'home-screen', 'Home screen did not load.');
  await waitFor(async () => evaluate('document.querySelectorAll("#grade-options .grade-option").length===6'), 'Application did not finish rendering the grade picker.');
  await click('#start-button');
  await waitFor(async () => (await activeScreen()) === 'select-screen', 'Grade directory did not open.');
}
async function chooseGradeSubject(gradeId, subjectId) {
  await click(`#grade-options [data-grade-id="${gradeId}"]`);
  await click(`#grade-subject-directory [data-subject-id="${subjectId}"]`);
}
function subjectFirstTask(gradeId) {
  const grade = GRADE_CATALOG.find(({ gradeId: id }) => id === gradeId);
  const subject = grade.subjects.find((entry) => getSubjectDirectorySummary(grade, entry).activityCount > 0);
  return tasksByGrade.get(gradeId).find(({ subjectId }) => subjectId === subject.subjectId);
}
async function verifyActivityEntry(activity, viewportName = 'desktop') {
  await chooseGradeSubject(activity.gradeId, activity.subjectId);
  const selector = `#grade-subject-detail [data-activity-id="${activity.activityId}"]`;
  await click(selector);
  const expectedScreen = dedicatedScreen.get(activity.activityId) ?? 'catalog-task-screen';
  await waitFor(async () => (await activeScreen()) === expectedScreen, `${activity.activityId} opened the wrong activity screen.`);
  const expectedTitle = CATALOG_CANDIDATE_TASK_BY_ID.get(activity.activityId)?.title ?? specialTitles.get(activity.activityId);
  if (!expectedTitle || !(await text()).includes(expectedTitle)) throw new Error(`${activity.activityId} screen did not show its registered title.`);
  if (activity.status !== 'candidate_pending_teacher_review') throw new Error(`${activity.activityId} has unexpected review state ${activity.status}`);
  const hasStartControl = await evaluate(`(()=>{const s=document.getElementById(${JSON.stringify(expectedScreen)});return !!s&&[...s.querySelectorAll('button')].some(b=>b.getClientRects().length&&!b.disabled&&/^開始|^進入/.test(b.innerText.trim())&&!b.hasAttribute('data-go'))})()`);
  if (!hasStartControl) throw new Error(`${activity.activityId} opened but has no real activity start control.`);
  const layout = await checkNoOverflow(`${activity.activityId}-${viewportName}`);
  const returned = await evaluate(`(()=>{const s=document.getElementById(${JSON.stringify(expectedScreen)});const b=s?.querySelector('button[data-go="select"]');if(!b||!b.getClientRects().length)return false;b.click();return true})()`);
  if (!returned) throw new Error(`${activity.activityId} has no visible return-to-directory control.`);
  await waitFor(async () => (await activeScreen()) === 'select-screen', `${activity.activityId} did not return to the directory.`);
  const retained = await evaluate(`document.querySelector('#grade-options [data-grade-id="${activity.gradeId}"]')?.getAttribute('aria-pressed')==='true' && document.querySelector('#grade-subject-directory [data-subject-id="${activity.subjectId}"]')?.getAttribute('aria-pressed')==='true'`);
  if (!retained) throw new Error(`${activity.activityId} returned to the wrong grade or subject directory.`);
  return { activityId: activity.activityId, gradeId: activity.gradeId, subjectId: activity.subjectId, screen: expectedScreen, title: expectedTitle, status: activity.status, startedFromDirectory: true, returnToCorrectDirectory: true, layout };
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await openDirectory();
  const initialStorage = await storage();
  const viewportResults = [];
  const allActivityLaunchResults = [];
  let grade3MainlineEntryCheck = null;

  // Launch and return every registered candidate entry through its actual grade/subject UI.
  for (const activity of expectedEntries) allActivityLaunchResults.push(await verifyActivityEntry(activity));

  // Check grade overview, subject counts, responsive layout and a real activity on each viewport.
  for (const viewport of [
    { name: 'desktop', width: 1366, height: 768 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'narrow', width: 340, height: 740 },
  ]) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 600 });
    await openDirectory();
    const layouts = [await checkNoOverflow(`${viewport.name}-grade-picker`)];
    const gradeChecks = [];
    for (const grade of GRADE_CATALOG) {
      const expectedSummary = getGradeAdventureSummary(grade);
      await click(`#grade-options [data-grade-id="${grade.gradeId}"]`);
      const title = await evaluate('document.querySelector("#grade-preparation-title")?.innerText ?? ""');
      const badge = await evaluate('document.querySelector("#grade-preparation-badge")?.innerText ?? ""');
      if (!title.includes(grade.name) || (expectedSummary.activityCount && !badge.includes(`${expectedSummary.activityCount} 個活動入口`))) throw new Error(`${grade.name} dashboard does not show live activity counts.`);
      const subjects = await evaluate('[...document.querySelectorAll("#grade-subject-directory .grade-subject-card")].map(b=>({id:b.dataset.subjectId,pressed:b.getAttribute("aria-pressed"),text:b.innerText}))');
      if (subjects.length !== grade.subjects.length) throw new Error(`${grade.name} subject directory omitted curriculum subjects.`);
      for (const subject of grade.subjects) {
        const live = subjects.find(({ id }) => id === subject.subjectId);
        const count = getSubjectDirectorySummary(grade, subject).activityCount;
        if (!live || (count && !live.text.includes(`${count} 個可進入活動`)) || (!count && live.text.includes('可進入活動'))) throw new Error(`${grade.name}・${subject.name} has an inaccurate activity status.`);
      }
      layouts.push(await checkNoOverflow(`${viewport.name}-${grade.gradeId}-directory`));
      gradeChecks.push({ gradeId: grade.gradeId, activityCount: expectedSummary.activityCount, subjectCount: subjects.length, clickableSubjectCount: expectedSummary.subjectCount });
      if (grade.gradeId === 'grade-3') await screenshot(`grade-picker-${viewport.name}.png`);
    }
    const sample = subjectFirstTask('grade-3');
    const sampleResult = await verifyActivityEntry(sample, viewport.name);
    layouts.push(sampleResult.layout);
    if (viewport.name === 'desktop') {
      await chooseGradeSubject('grade-3', 'mathematics');
      const routeStops = await evaluate('document.querySelectorAll("#grade3-math-repair-mainline .grade3-math-mainline-stops li").length');
      if (routeStops !== GRADE3_MATH_REPAIR_MAINLINE.stops.length) throw new Error(`Grade 3 math mainline has ${routeStops} visible stops.`);
      const routeStart = await evaluate('document.querySelector("#grade3-math-mainline-start")?.innerText ?? ""');
      if (!routeStart.includes('開始數字島修復任務')) throw new Error('Existing Grade 3 mainline entry is not available.');
      await screenshot('grade3-math-route-desktop.png');
      const firstStop = GRADE3_MATH_REPAIR_MAINLINE.stops[0];
      const firstActivity = CATALOG_CANDIDATE_TASK_BY_ID.get(firstStop.activityId);
      await click('#grade3-math-mainline-start');
      await waitFor(async () => (await activeScreen()) === 'catalog-task-screen', 'Grade 3 mainline did not enter its first registered activity.');
      if (!(await text()).includes(firstActivity.title)) throw new Error('Grade 3 mainline started a different activity than its first registered stop.');
      await click('#catalog-task-screen button[data-go="select"]');
      await waitFor(async () => (await activeScreen()) === 'select-screen', 'Grade 3 mainline did not return to the directory/map.');
      const mapRetained = await evaluate('document.querySelector("#grade3-math-adventure-map")?.getClientRects().length>0 && document.querySelector("#grade3-math-mainline-start")?.getClientRects().length>0');
      if (!mapRetained) throw new Error('Grade 3 math adventure map/mainline did not remain available after return.');
      grade3MainlineEntryCheck = { stopCount: routeStops, firstStopActivityId: firstStop.activityId, enteredCorrectFirstActivity: true, returnedToMap: true };
    }
    viewportResults.push({ viewport: `${viewport.width}x${viewport.height}`, status: 'passed', grades: gradeChecks, sampleActivity: sampleResult, layouts, screenshots: viewport.name === 'desktop' ? ['grade-picker-desktop.png', 'grade3-math-route-desktop.png'] : [`grade-picker-${viewport.name}.png`] });
    await send('Emulation.clearDeviceMetricsOverride');
  }

  const finalStorage = await storage();
  if (initialStorage !== finalStorage) throw new Error('localStorage changed during browsing the cross-grade directory and activity entries.');
  if (allActivityLaunchResults.length !== expectedEntries.length) throw new Error(`Only verified ${allActivityLaunchResults.length}/${expectedEntries.length} entries.`);
  if (diagnostics.exceptions.length || diagnostics.consoleErrors.length || diagnostics.failedRequests.length || diagnostics.badResponses.length) throw new Error(`Browser diagnostics contain failures: ${JSON.stringify(diagnostics)}`);
  const executedAt = new Date().toISOString();
  const report = {
    reportId: `cross-grade-adventure-entry-${executedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    executedAt,
    status: 'passed',
    targetUrl,
    browser: await evaluate('navigator.userAgent'),
    registeredActivityEntries: expectedEntries.length,
    entriesStartedAndReturned: allActivityLaunchResults.length,
    entries: allActivityLaunchResults,
    gradeCounts: GRADE_CATALOG.map((grade) => ({ gradeId: grade.gradeId, gradeName: grade.name, ...getGradeAdventureSummary(grade) , subjects: getGradeAdventureSummary(grade).subjects.map(({ subjectId, name, activityCount }) => ({ subjectId, name, activityCount })) })),
    viewports: viewportResults,
    grade3MathMainlineStopCount: GRADE3_MATH_REPAIR_MAINLINE.stops.length,
    grade3MathMainlineEntryCheck: grade3MainlineEntryCheck,
    localStorageUnchanged: true,
    diagnostics,
    limitations: [
      '逐一驗證每個入口可由年級／科目目錄啟動到其實際活動畫面，確認標題、候選待審狀態、開始控制與返回；未逐關完成 145 個活動的所有教學題目。',
      '桌面、390×844 與 340×740 使用隔離 Edge 的 CDP 視窗尺寸模擬，並以 DOM 點擊操作；未使用實體觸控裝置。',
      '舊數字島原型、條件式原型及未開放的課程目錄參照與 145 個已註冊候選活動分開計數；三年級數學主線入口及十站數量做了非侵入式回歸檢查。',
    ],
  };
  const reportPath = path.join(outputRoot, 'acceptance-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ report: path.relative(process.cwd(), reportPath).replaceAll('\\', '/'), registeredActivityEntries: report.registeredActivityEntries, viewports: report.viewports.map(({ viewport }) => viewport), gradeCounts: report.gradeCounts.map(({ gradeId, activityCount, subjectCount }) => ({ gradeId, activityCount, subjectCount })), diagnostics }, null, 2));
} finally {
  await send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  socket.close();
}
