import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE, TEACHER_REVIEW_ACTIVITY_IDS } from '../prototype/data/teacherReviewCatalog.js';
import { validateAcceptanceEvidenceReport } from '../prototype/acceptanceEvidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(root, 'prototype/data/acceptance-evidence.json');
const artifactsRoot = path.join(root, 'artifacts/teacher-review-acceptance');
const runId = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-') + `-${randomUUID().slice(0, 8)}`;
const screenshotRunRoot = path.join(artifactsRoot, runId);
const debugPort = Number(process.env.TEACHER_REVIEW_CDP_PORT);
const baseUrl = process.env.TEACHER_REVIEW_BASE_URL ?? 'http://127.0.0.1:49361';
const viewports = [
  { name: '1366x768', width: 1366, height: 768, mobile: false },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '340x740', width: 340, height: 740, mobile: true },
];
if (!Number.isInteger(debugPort) || debugPort < 1 || debugPort > 65535) throw new Error('請設定本輪獨立 Edge DevTools 埠 TEACHER_REVIEW_CDP_PORT。');

const versionResponse = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
if (!versionResponse.ok) throw new Error(`無法連接本輪 DevTools：HTTP ${versionResponse.status}`);
const browserVersion = (await versionResponse.json()).Browser;
const targetsResponse = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
const targets = await targetsResponse.json();
const target = targets.find((entry) => entry.type === 'page' && entry.url.includes('/teacher-review.html'));
if (!target?.webSocketDebuggerUrl) throw new Error('獨立 Edge 中找不到教師工作台頁面 target。');

const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const listeners = new Map();
let nextId = 0;
ws.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id && pending.has(message.id)) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  } else if (message.method) {
    for (const listener of listeners.get(message.method) ?? []) listener(message.params);
  }
});
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', () => reject(new Error('CDP WebSocket 無法開啟。')), { once: true });
});
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); } }, 15000).unref?.();
  });
}
function on(method, listener) {
  const entries = listeners.get(method) ?? new Set();
  entries.add(listener);
  listeners.set(method, entries);
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Browser evaluation failed');
  return result.result?.value;
}
const waitFor = async (predicate, label, timeoutMs = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(predicate)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`等待逾時：${label}`);
};
await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
const runtimeErrors = [];
const runtimeWarnings = [];
const networkFailures = [];
on('Runtime.exceptionThrown', (params) => {
  const detail = params.exceptionDetails;
  runtimeErrors.push(detail?.exception?.description ?? detail?.text ?? 'JavaScript exception');
});
on('Runtime.consoleAPICalled', (params) => {
  const text = (params.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' ');
  if (params.type === 'error') runtimeErrors.push(text);
  if (params.type === 'warning' || params.type === 'warn') runtimeWarnings.push(text);
});
on('Network.loadingFailed', (params) => networkFailures.push(`${params.errorText} ${params.requestId}`));
const records = [];
const coverage = [...TEACHER_REVIEW_ACTIVITY_IDS];
const allSteps = [];
const reviewStorageKey = 'taiwan-ai-academy:teacher-review-workbench:v1';
const revisionsStorageKey = 'taiwan-ai-academy:teacher-review-candidate-revisions:v1';
let testNoteMarker = `ISOLATED-BROWSER-TEST-${randomUUID()}`;
let storageCleanupVerified = false;
let storageBeforeSnapshot = null;

function browserRecord(viewport, startedAt, status, details, screenshotPath = '') {
  const finishedAt = new Date().toISOString();
  return {
    evidenceId: `BROWSER-TEACHER-REVIEW-${Date.now()}-${viewport.name}-${randomUUID()}`,
    evidenceType: 'browser_acceptance',
    command: `獨立 Edge ${browserVersion} via CDP；viewport ${viewport.name}；${baseUrl}/teacher-review.html`,
    status,
    exitCode: status === 'passed' ? 0 : status === 'failed' ? 1 : null,
    startedAt,
    finishedAt,
    durationMs: Date.now() - Date.parse(startedAt),
    summary: details.summary,
    parsedTest: null,
    coverage,
    source: 'scripts/teacher-review-browser-acceptance.mjs；獨立 Edge CDP 實際操作',
    limitations: details.limitations ?? '工程介面操作證據；不代表官方課綱核實、教師審查、教學效度或學生精熟。Network 僅記錄失敗請求，未逐項人工檢視 DevTools Network 面板。',
    viewport: viewport.name,
    browserVersion,
    steps: details.steps,
    screenshotPath: screenshotPath || null,
    consoleErrors: details.consoleErrors,
    consoleWarnings: details.consoleWarnings,
    networkFailures: details.networkFailures,
    storageCleanupVerified: details.storageCleanupVerified ?? false,
  };
}

try {
  const response = await fetch(`${baseUrl}/teacher-review.html`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`測試伺服器無法提供工作台：HTTP ${response.status}`);
  await waitFor(`document.readyState === 'complete' && !!document.querySelector('.teacher-review-nav-item')`, '工作台載入');
  storageBeforeSnapshot = await evaluate(`({reviewKeyPresent: localStorage.getItem(${JSON.stringify(reviewStorageKey)}) !== null, revisionsKeyPresent: localStorage.getItem(${JSON.stringify(revisionsStorageKey)}) !== null, progressKeyPresent: localStorage.getItem('taiwan-ai-adventure.prototype-progress.v1') !== null, keys: Object.keys(localStorage)})`);
  if (storageBeforeSnapshot.reviewKeyPresent || storageBeforeSnapshot.revisionsKeyPresent || storageBeforeSnapshot.progressKeyPresent) throw new Error('隔離設定檔在驗收開始前已有工作台、候選修訂或遊戲進度資料；為保護資料，本次停止寫入。');

  for (const viewport of viewports) {
    const startedAt = new Date().toISOString();
    testNoteMarker = `ISOLATED-BROWSER-TEST-${viewport.name}-${randomUUID()}`;
    const steps = [];
    let screenshotPath = '';
    try {
      await send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
        screenWidth: viewport.width, screenHeight: viewport.height,
      });
      await send('Page.navigate', { url: `${baseUrl}/teacher-review.html` });
      await waitFor(`document.readyState === 'complete' && document.querySelectorAll('.teacher-review-nav-item').length === 9`, `viewport ${viewport.name} 工作台載入`);
      const dimensions = await evaluate('({width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth})');
      if (dimensions.width !== viewport.width || dimensions.height !== viewport.height) throw new Error(`viewport 尺寸不符：${JSON.stringify(dimensions)}`);
      if (dimensions.documentWidth > dimensions.width + 1 || dimensions.bodyWidth > dimensions.width + 1) throw new Error(`初始頁面水平溢位：${JSON.stringify(dimensions)}`);
      steps.push(`工作台首頁載入；viewport ${dimensions.width}×${dimensions.height}；九類活動導覽顯示。`);

      const expectedActivityData = TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE.map((activity) => ({
        activityId: activity.activityId,
        questionIds: activity.questions.map((question) => question.questionId),
        questions: activity.questions.map((question) => ({
          questionId: question.questionId,
          prompt: question.prompt,
          optionTexts: question.options.map((option) => option.text),
          answerId: question.answerId,
          answerText: question.options.find((option) => option.optionId === question.answerId)?.text ?? null,
          reviewable: question.reviewable,
          visualization: question.visualization ? Object.keys(question.visualization) : [],
          visualSelector: question.visualization?.type === 'fraction_strips' ? '.review-fraction-model'
            : Array.isArray(question.visualization?.groups) ? '.review-block-groups'
              : Array.isArray(question.visualization?.columns) ? '.review-place-table'
                : Number.isFinite(question.visualization?.waterMl) ? '.review-capacity-scale'
                  : Array.isArray(question.visualization?.points) ? '.review-number-line'
                    : Number.isFinite(question.visualization?.markMm) ? '.review-ruler-model'
                      : Array.isArray(question.visualization?.rows) ? '.review-area-grid' : null,
        })),
      }));
      const activityResults = await evaluate(`(async()=>{
        const expectedData=${JSON.stringify(expectedActivityData)};
        const expected=[...document.querySelectorAll('.teacher-review-nav-item')].map(button=>button.dataset.activityId); const results=[];
        for(let i=0;i<expected.length;i++){
          const button=document.querySelectorAll('.teacher-review-nav-item')[i]; button.click(); await new Promise(r=>setTimeout(r,0));
          const active=document.querySelector('.teacher-review-nav-item[aria-current="true"]'); const main=document.querySelector('.teacher-review-main');
          const cards=[...main.querySelectorAll('.teacher-review-question')];
          const actualQuestions=cards.map(card=>({
            questionId:card.dataset.questionId,
            prompt:card.querySelector('h3')?.textContent?.trim() ?? '',
            optionTexts:[...card.querySelectorAll('.review-option-list li')].map(option=>{const clone=option.cloneNode(true);clone.querySelectorAll('small').forEach(node=>node.remove());return clone.textContent.replace('　｜資料所列正解','').trim()}),
            answerLabel:card.querySelector('.review-answer-id')?.textContent?.trim() ?? '',
            answerText:card.querySelector('.review-option-list li.is-answer')?.textContent?.replace('　｜資料所列正解','').replace(/可能錯答分類（待驗證）：.*$/,'').trim() ?? null,
            disabled:card.classList.contains('is-disabled'),
            hasVisualization:!!card.querySelector('.review-visual'),
            visualKinds:[...card.querySelectorAll('.review-visual table,.review-visual .review-capacity-scale,.review-visual .review-fraction-model,.review-visual .review-visual-data,.review-visual .review-block-groups,.review-visual .review-number-line,.review-visual .review-ruler-model,.review-visual .review-area-grid')].map(node=>node.className||node.tagName.toLowerCase()),
            form:!!card.querySelector('form.question-review-form'),
            teacherDecision:card.querySelector('select[name="teacherDecision"]')?.value ?? null,
            revisionWorkspace:!!card.querySelector('.candidate-revision-workspace')
          }));
          results.push({id:expected[i],activeId:active?.dataset.activityId,title:main.querySelector('h1')?.textContent,questions:actualQuestions.length,forms:main.querySelectorAll('.question-review-form').length,disabled:[...main.querySelectorAll('.teacher-review-question.is-disabled')].length,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,innerWidth,actualQuestions,expectedQuestions:expectedData.find(item=>item.activityId===expected[i])?.questions});
        }
        return results;
      })()`);
      if (activityResults.length !== 9 || activityResults.some((item) => !item.title || item.questions < 1 || item.id !== item.activeId) || new Set(activityResults.map((item) => item.activeId)).size !== 9) throw new Error(`活動切換或題目內容不完整：${JSON.stringify(activityResults)}`);
      const mismatches = activityResults.flatMap((activity) => activity.actualQuestions.flatMap((actual, index) => {
        const expected = activity.expectedQuestions?.[index];
        if (!expected) return [`${activity.id}/${actual.questionId}: unexpected item`];
        const errors = [];
        if (actual.questionId !== expected.questionId) errors.push('questionId');
        if (actual.prompt !== expected.prompt) errors.push('prompt');
        if (JSON.stringify(actual.optionTexts) !== JSON.stringify(expected.optionTexts)) errors.push('options');
        const expectedAnswerLabel = expected.answerId ? `正解識別碼：${expected.answerId}` : '正解：尚未提供可作答題面。';
        if (actual.answerLabel !== expectedAnswerLabel || actual.answerText !== expected.answerText) errors.push('answer');
        if (actual.disabled === expected.reviewable) errors.push('preview/disabled state');
        if (actual.teacherDecision !== 'unreviewed') errors.push('teacher review default is not unreviewed');
        if (!actual.revisionWorkspace) errors.push('candidate revision workspace missing');
        if (expected.visualization.length && (!actual.hasVisualization || (expected.visualSelector && !actual.visualKinds.includes(expected.visualSelector.slice(1))))) errors.push('visualization missing');
        if (!expected.reviewable && !actual.disabled) errors.push('non-answerable item lost disabled visual state');
        return errors.length ? [`${activity.id}/${actual.questionId}: ${errors.join(',')}`] : [];
      }));
      for (const activity of activityResults) if (activity.docWidth > viewport.width + 1 || activity.bodyWidth > viewport.width + 1 || activity.innerWidth !== viewport.width) mismatches.push(`${activity.id}: horizontal overflow at activity view`);
      if (mismatches.length) throw new Error(`工作台實際顯示與題庫資料不一致：${mismatches.join('；')}`);
      const reviewedItemCount = activityResults.reduce((sum, activity) => sum + activity.questions, 0);
      if (reviewedItemCount !== 40) throw new Error(`工作台題目／預覽總數應為 40，實際 ${reviewedItemCount}。`);
      steps.push(`逐一點選九類活動；核對 ${reviewedItemCount} 個項目的 ID、題幹、選項、正解文字及可作答／預覽／停用狀態，並核對每筆圖像資料對應的視覺元件（${activityResults.map((item) => `${item.title}:${item.questions}`).join('；')}）。`);

      await evaluate(`document.querySelector('[data-action="pilot-report"]').click()`);
      await waitFor(`document.querySelectorAll('.pilot-report-activity').length === 9`, '試用前報告九類活動');
      await waitFor(`document.querySelector('.evidence-registry')?.textContent.includes('已讀取並驗證')`, '工程報告載入');
      const evidenceView = await evaluate(`({cards:document.querySelectorAll('.pilot-report-activity').length, autoRecords:document.querySelectorAll('.automated-evidence-list li').length, text:document.querySelector('.evidence-registry')?.innerText.slice(0,1200)})`);
      if (evidenceView.cards !== 9 || evidenceView.autoRecords < 3 || !evidenceView.text.includes('node --test')) throw new Error(`驗收報告證據未完整顯示：${JSON.stringify(evidenceView)}`);
      steps.push(`試用前報告顯示九類活動、${evidenceView.autoRecords} 筆自動工程證據及來源／限制。`);

      const reviewFormExists = await evaluate(`!!document.querySelector('.question-review-form')`);
      if (!reviewFormExists) throw new Error('找不到可審查題目的表單。');
      await evaluate(`(()=>{const button=[...document.querySelectorAll('.teacher-review-nav-item')][0];button.click();const form=document.querySelector('.question-review-form');form.elements.namedItem('teacherReason').value=${JSON.stringify(testNoteMarker)};form.elements.namedItem('teacherDecision').value='request_changes';form.requestSubmit();})()`);
      await waitFor(`document.querySelector('.teacher-review-message')?.textContent.includes('已儲存')`, '隔離審查草稿儲存');
      const saved = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(reviewStorageKey)}))`);
      const firstActivityId = activityResults[0].id;
      const firstQuestionId = await evaluate(`document.querySelector('.question-review-form')?.dataset.questionId`);
      const hasMarker = JSON.stringify(saved).includes(testNoteMarker);
      if (!hasMarker || !saved.questionReviews?.[firstActivityId]?.[firstQuestionId]) throw new Error('審查備註未保存在指定活動／題目紀錄。');
      steps.push(`在隔離設定檔對 ${firstQuestionId} 輸入唯一測試備註並儲存；確認工作台專用鍵包含該筆資料。`);
      await send('Page.navigate', { url: `${baseUrl}/teacher-review.html` });
      await waitFor(`document.querySelector('.question-review-form textarea[name="teacherReason"]')?.value === ${JSON.stringify(testNoteMarker)} && document.querySelector('.question-review-form select[name="teacherDecision"]')?.value === 'request_changes'`, '隔離審查草稿重新載入');
      steps.push('重新載入後確認同一題的測試備註保留。');

      const firstCard = await evaluate(`document.querySelector('.teacher-review-question:not(.is-disabled)')?.dataset.questionId`);
      await evaluate(`(()=>{const button=document.querySelector('.teacher-review-question:not(.is-disabled) [data-action="new-revision"]');button.click();const form=document.querySelector('form[data-action="create-revision"]');form.elements.namedItem('revision-prompt').value='${testNoteMarker} candidate prompt';form.elements.namedItem('revision-reason').value='${testNoteMarker} reason';form.requestSubmit();})()`);
      await waitFor(`document.querySelector('.teacher-review-message')?.textContent.includes('候選修訂已儲存')`, '候選修訂建立');
      let revisionSnapshot = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(revisionsStorageKey)}))`);
      if (revisionSnapshot.revisions.length !== 1 || revisionSnapshot.revisions[0].questionId !== firstCard || !revisionSnapshot.revisions[0].revisionId.startsWith('REV-')) throw new Error('候選修訂建立後資料識別或題目關聯錯誤。');
      const savedRevisionId = revisionSnapshot.revisions[0].revisionId;
      const originalPrompt = activityResults[0].expectedQuestions.find((item) => item.questionId === firstCard)?.prompt;
      const originalStillUnchanged = await evaluate(`(()=>{const form=document.querySelector('form[data-action="update-revision"]');const raw=form?.querySelector('.revision-original pre')?.textContent??'';form?.querySelector('.revision-comparison summary')?.click();const diff=form?.querySelectorAll('.revision-diff-list dt').length??0;return {raw,diff,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,width:innerWidth,formRight:Math.round(form?.getBoundingClientRect().right??0)}})()`);
      if (!originalStillUnchanged.raw.includes(JSON.stringify(originalPrompt)) || originalStillUnchanged.diff !== 7 || originalStillUnchanged.scrollWidth > originalStillUnchanged.width + 1 || originalStillUnchanged.bodyWidth > originalStillUnchanged.width + 1 || originalStillUnchanged.formRight > originalStillUnchanged.width + 1) throw new Error(`原題／修訂比較或表單版面驗收失敗：${JSON.stringify(originalStillUnchanged)}`);
      await evaluate(`(()=>{const form=document.querySelector('form[data-action="update-revision"]');form.elements.namedItem('revision-prompt').value='${testNoteMarker} edited prompt';form.elements.namedItem('revision-reason').value='${testNoteMarker} edited reason';form.requestSubmit();})()`);
      await waitFor(`document.querySelector('.teacher-review-message')?.textContent.includes('候選修訂已儲存')`, '候選修訂編輯');
      revisionSnapshot = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(revisionsStorageKey)}))`);
      if (revisionSnapshot.revisions[0].revisionId !== savedRevisionId || revisionSnapshot.revisions[0].fields.prompt !== `${testNoteMarker} edited prompt`) throw new Error('編輯候選版本時 ID 不穩定或新內容未保存。');
      await evaluate(`document.querySelector('form[data-action="update-revision"] [data-action="cancel-revision"]').click()`);
      revisionSnapshot = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(revisionsStorageKey)}))`);
      if (revisionSnapshot.revisions.length !== 0) throw new Error('取消候選修訂沒有移除該測試草稿。');
      steps.push('建立、編輯並取消一個候選修訂；原始題目仍未變更，修訂 ID 在編輯時保持穩定。');

      await evaluate(`(()=>{const button=document.querySelector('.teacher-review-question:not(.is-disabled) [data-action="new-revision"]');button.click();const form=document.querySelector('form[data-action="create-revision"]');form.elements.namedItem('revision-reason').value='${testNoteMarker} export reason';form.requestSubmit();})()`);
      await waitFor(`document.querySelector('.teacher-review-message')?.textContent.includes('候選修訂已儲存')`, '第二候選修訂建立');
      await evaluate(`(()=>{window.__candidateExportBlob=null;window.__candidateExportName='';URL.createObjectURL=(blob)=>{window.__candidateExportBlob=blob;return 'blob:test';};HTMLAnchorElement.prototype.click=function(){window.__candidateExportName=this.download;};document.querySelector('[data-action="export-revisions"]').click()})()`);
      const exportedRevision = await evaluate(`(async()=>({name:window.__candidateExportName, data:JSON.parse(await window.__candidateExportBlob.text())}))()`);
      if (!exportedRevision.name.endsWith('.json') || exportedRevision.data.schemaVersion !== 1 || exportedRevision.data.revisions.length !== 1) throw new Error('候選修訂匯出 Blob JSON 不完整。');
      steps.push('攔截匯出控制項產生的 Blob，解析並確認修訂 schema v1、ID 與內容。');

      const badRevisionImport = await evaluate(`(async()=>{const input=document.querySelector('[data-action="import-revisions"]');const file=new File(['{bad'], 'bad-revisions.json',{type:'application/json'});Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));return document.querySelector('.teacher-review-message')?.textContent})()`);
      if (!badRevisionImport?.includes('遭拒')) throw new Error(`錯誤候選修訂 JSON 未遭拒絕：${badRevisionImport}`);
      const collisionRevisionImport = await evaluate(`(async()=>{const current=JSON.parse(localStorage.getItem(${JSON.stringify(revisionsStorageKey)}));const incoming=structuredClone(current);incoming.revisions[0].reason+=' conflict';const input=document.querySelector('[data-action="import-revisions"]');const file=new File([JSON.stringify(incoming)],'collision.json',{type:'application/json'});Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));return document.querySelector('.teacher-review-message')?.textContent})()`);
      if (!collisionRevisionImport?.includes('整份匯入已拒絕')) throw new Error(`候選修訂 ID 衝突未整份拒絕：${collisionRevisionImport}`);
      const validRevisionImport = await evaluate(`(async()=>{const current=JSON.parse(localStorage.getItem(${JSON.stringify(revisionsStorageKey)}));const incoming=structuredClone(current);incoming.revisions[0].revisionId='REV-IMPORT-${viewport.name}-12345678';incoming.revisions[0].createdAt=new Date().toISOString();incoming.revisions[0].updatedAt=new Date().toISOString();const input=document.querySelector('[data-action="import-revisions"]');const file=new File([JSON.stringify(incoming)],'valid-revisions.json',{type:'application/json'});Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));return document.querySelector('.teacher-review-message')?.textContent})()`);
      if (!validRevisionImport?.includes('已完整驗證並匯入')) throw new Error(`有效候選修訂 JSON 未匯入：${validRevisionImport}`);
      steps.push('候選修訂 JSON 匯出、格式錯誤拒絕、ID 衝突整份拒絕及有效匯入均已實際操作。');
      await evaluate(`document.querySelector('[data-action="pilot-report"]').click()`);
      await waitFor(`document.querySelectorAll('.pilot-report-activity').length === 9`, '審查改動後報告更新');
      const changedReport = await evaluate(`document.querySelector('.pilot-report-activity')?.innerText`);
      if (!changedReport.includes('可作答題目檢核完成')) throw new Error('審查草稿改變後沒有重新產生報告。');
      steps.push('儲存後重新開啟試用前報告，確認報告依審查草稿重新計算。');

      const malformedMessage = await evaluate(`(async()=>{const input=document.querySelector('[data-action="import-acceptance"]');const file=new File(['{bad json'], 'malformed.json',{type:'application/json'});Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,100));return document.querySelector('.teacher-review-message')?.textContent;})()`);
      if (!malformedMessage?.includes('未載入')) throw new Error(`錯誤 JSON 未被拒絕：${malformedMessage}`);
      steps.push('實際操作工程證據匯入控制項，格式錯誤 JSON 被拒絕且資料未變更。');

      const validImportMessage = await evaluate(`(async()=>{
        const base=await (await fetch('./data/acceptance-evidence.json',{cache:'no-store'})).json();
        const incoming={schemaVersion:base.schemaVersion,reportId:'SYNTHETIC-VALID-IMPORT-${viewport.name}',generatedAt:new Date().toISOString(),coveredActivities:base.coveredActivities,limitations:['synthetic browser import test only'],records:[{
          evidenceId:'SYNTHETIC-VALID-${viewport.name}', evidenceType:'browser_acceptance', command:'synthetic in-memory import validation', status:'not_run', exitCode:null,
          startedAt:new Date().toISOString(),finishedAt:new Date().toISOString(),durationMs:0,summary:'synthetic import test only',parsedTest:null,
          coverage:base.coveredActivities,source:'scripts/teacher-review-browser-acceptance.mjs test fixture',limitations:'not a real acceptance result',viewport:'${viewport.name}',browserVersion:'',steps:[],screenshotPath:null
        }]};
        const input=document.querySelector('[data-action="import-acceptance"]');
        const file=new File([JSON.stringify(incoming)],'synthetic-valid.json',{type:'application/json'});
        Object.defineProperty(input,'files',{configurable:true,value:[file]}); input.dispatchEvent(new Event('change',{bubbles:true}));
        await new Promise(r=>setTimeout(r,120));return document.querySelector('.teacher-review-message')?.textContent;
      })()`);
      if (!validImportMessage?.includes('已驗證並載入')) throw new Error(`有效 JSON 匯入未成功：${validImportMessage}`);
      steps.push('有效、明確標示 not_run 的合成工程證據只載入頁面記憶體，並未形成通過或審查結果。');

      const conflictMessage = await evaluate(`(async()=>{
          const current=await (await fetch('./data/acceptance-evidence.json',{cache:'no-store'})).json();
          const incoming=structuredClone(current); incoming.reportId='SYNTHETIC-CONFLICT-REPORT';
          incoming.records[0]={...incoming.records[0],summary:'synthetic conflict only'};
          const input=document.querySelector('[data-action="import-acceptance"]');
          const file=new File([JSON.stringify(incoming)],'synthetic-conflict.json',{type:'application/json'});
          Object.defineProperty(input,'files',{configurable:true,value:[file]}); input.dispatchEvent(new Event('change',{bubbles:true}));
          await new Promise(r=>setTimeout(r,120)); return document.querySelector('.teacher-review-message')?.textContent;
      })()`);
      if (!conflictMessage?.includes('內容衝突')) throw new Error(`重複證據 ID 衝突沒有整份拒絕：${conflictMessage}`);
      steps.push('實際匯入含重複 evidenceId、不同摘要的合成 JSON；整份衝突匯入遭拒。');

      const storageBeforeCleanup = await evaluate(`({review:localStorage.getItem(${JSON.stringify(reviewStorageKey)}),revisions:localStorage.getItem(${JSON.stringify(revisionsStorageKey)}),progress:localStorage.getItem('taiwan-ai-adventure.prototype-progress.v1')})`);
      if (!storageBeforeCleanup.review?.includes(testNoteMarker) || !storageBeforeCleanup.revisions?.includes(testNoteMarker)) throw new Error('清理前工作台／候選修訂資料不符合本輪唯一測試標記。');
      await evaluate(`localStorage.removeItem(${JSON.stringify(reviewStorageKey)})`);
      await evaluate(`localStorage.removeItem(${JSON.stringify(revisionsStorageKey)})`);
      const cleanState = await evaluate(`({review:localStorage.getItem(${JSON.stringify(reviewStorageKey)}),revisions:localStorage.getItem(${JSON.stringify(revisionsStorageKey)}),progress:localStorage.getItem('taiwan-ai-adventure.prototype-progress.v1')})`);
      if (cleanState.review !== null || cleanState.revisions !== null || cleanState.progress !== storageBeforeCleanup.progress) throw new Error('隔離測試資料清理確認失敗，或遊戲進度鍵發生變化。');
      storageCleanupVerified = true;
      steps.push('只移除新建隔離設定檔內含本輪唯一標記的工作台與修訂測試鍵；遊戲進度鍵未變。');
      await send('Page.navigate', { url: `${baseUrl}/teacher-review.html` });
      await waitFor(`document.querySelectorAll('.teacher-review-nav-item').length===9`, '清理後重新載入');
      await evaluate(`document.querySelector('[data-action="pilot-report"]').click()`);
      await waitFor(`document.querySelectorAll('.pilot-report-activity').length===9`, '清理後報告畫面');

      const layout = await evaluate(`(()=>{const w=innerWidth; const wide=[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return !el.closest('.sky-scene')&&r.width>0&&r.right>w+1;}).slice(0,8).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,80),right:Math.round(el.getBoundingClientRect().right)})); const tinyButtons=[...document.querySelectorAll('button,.review-import-label')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.height<36||r.width<36)}).length;return {width:w,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,wide,tinyButtons,active:document.querySelector('.teacher-review-main h1')?.textContent,reportVisible:!!document.querySelector('.pilot-readiness-report:not([hidden])')}})()`);
      if (layout.docWidth > viewport.width + 1 || layout.bodyWidth > viewport.width + 1 || layout.wide.length) throw new Error(`版面水平溢位／元素超出視窗：${JSON.stringify(layout)}`);
      if (layout.tinyButtons) throw new Error(`發現過小控制項：${layout.tinyButtons}`);
      steps.push(`檢查表單、報告及控制項；無水平溢位／超出視窗，最小按鈕尺寸符合檢查。`);

      await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }).then(async (shot) => {
        screenshotPath = path.join('artifacts/teacher-review-acceptance', runId, `${viewport.name}.png`).replaceAll('\\', '/');
        const fullPath = path.join(root, screenshotPath);
        await mkdir(path.dirname(fullPath), { recursive: true });
        await writeFile(fullPath, Buffer.from(shot.data, 'base64'));
      });
      const consoleSlice = { errors: [...runtimeErrors], warnings: [...runtimeWarnings], networkFailures: [...networkFailures] };
      if (consoleSlice.errors.length || consoleSlice.warnings.length || consoleSlice.networkFailures.length) throw new Error(`Console／請求問題：${JSON.stringify(consoleSlice)}`);
      steps.push(`Console error=0、warn=0；CDP 網路請求失敗=0（未逐筆人工檢查 Network 面板狀態碼）。`);
      allSteps.push(`${viewport.name}: ${steps.join(' ')}`);
      records.push(browserRecord(viewport, startedAt, 'passed', { summary: `工作台實際操作通過：${steps.length} 項步驟。`, steps, consoleErrors: 0, consoleWarnings: 0, networkFailures: 0, storageCleanupVerified }, screenshotPath));
    } catch (error) {
      const detail = runtimeErrors.at(-1);
      const failure = detail ? `${error.message}；Console: ${detail}` : error.message;
      steps.push(`失敗：${failure}`);
      try {
        const storage = await evaluate(`({review:localStorage.getItem(${JSON.stringify(reviewStorageKey)}),revisions:localStorage.getItem(${JSON.stringify(revisionsStorageKey)})})`);
        if (storage.review?.includes(testNoteMarker)) await evaluate(`localStorage.removeItem(${JSON.stringify(reviewStorageKey)})`);
        if (storage.revisions?.includes(testNoteMarker)) await evaluate(`localStorage.removeItem(${JSON.stringify(revisionsStorageKey)})`);
        const clean = await evaluate(`localStorage.getItem(${JSON.stringify(reviewStorageKey)}) === null && localStorage.getItem(${JSON.stringify(revisionsStorageKey)}) === null`);
        storageCleanupVerified = clean;
      } catch { /* The run evidence below records unsuccessful cleanup as false. */ }
      allSteps.push(`${viewport.name}: ${steps.join(' ')}`);
      records.push(browserRecord(viewport, startedAt, 'failed', { summary: failure, steps, consoleErrors: runtimeErrors.length, consoleWarnings: runtimeWarnings.length, networkFailures: networkFailures.length, storageCleanupVerified }, screenshotPath));
    }
  }
} finally {
  try {
    const currentStorage = await evaluate(`({review:localStorage.getItem(${JSON.stringify(reviewStorageKey)}),revisions:localStorage.getItem(${JSON.stringify(revisionsStorageKey)}),progress:localStorage.getItem('taiwan-ai-adventure.prototype-progress.v1')})`);
    if (currentStorage.review?.includes(testNoteMarker)) {
      await evaluate(`localStorage.removeItem(${JSON.stringify(reviewStorageKey)})`);
    }
    if (currentStorage.revisions?.includes(testNoteMarker)) {
      await evaluate(`localStorage.removeItem(${JSON.stringify(revisionsStorageKey)})`);
      storageCleanupVerified = true;
    }
  } catch { /* Browser may have exited; report remains evidence of incomplete cleanup. */ }
  ws.close();
}

const report = JSON.parse(await readFile(reportPath, 'utf8'));
const validationBefore = validateAcceptanceEvidenceReport(report);
if (!validationBefore.ok) throw new Error(`既有驗收報告無效，拒絕更新：${validationBefore.errors.join(' ')}`);
report.records.push(...records);
report.generatedAt = new Date().toISOString();
report.limitations = [...new Set([...report.limitations, '瀏覽器驗收僅代表獨立 Edge 測試設定檔中的介面工程操作；不代表課綱核實、教師審查、教學效度或學生精熟。Network 狀態碼未逐項人工檢查。'])];
const validation = validateAcceptanceEvidenceReport(report);
if (!validation.ok) throw new Error(`新增瀏覽器證據無效：${validation.errors.join(' ')}`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
for (const record of records) console.log(`${record.status.toUpperCase()} ${record.viewport} ${record.browserVersion} | ${record.summary} | errors=${record.consoleErrors} warnings=${record.consoleWarnings} networkFailures=${record.networkFailures} | ${record.screenshotPath ?? 'no screenshot'}`);
console.log(`Browser acceptance evidence saved to ${reportPath}`);
console.log(`Isolated review storage cleanup verified: ${storageCleanupVerified}`);
if (records.some((record) => record.status !== 'passed')) process.exitCode = 1;
