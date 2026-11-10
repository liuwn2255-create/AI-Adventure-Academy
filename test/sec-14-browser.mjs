import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {approvedTestBundle,approvedTestQuestion} from './sec-12-fixture.mjs';
const base='http://127.0.0.1:8791';
const q=approvedTestQuestion();
const seed=await fetch(base+'/__fixture',{method:'POST',body:JSON.stringify({bundle:approvedTestBundle(),question:q})});
assert.equal((await seed.json()).ok,true);
const browser=await chromium.launch({headless:true});
try{
const teacher=await browser.newContext({extraHTTPHeaders:{'x-test-role':'reviewer'}});
const page=await teacher.newPage();await page.goto(base+'/review-workspace.html');
await page.getByText('目前角色：reviewer').waitFor();
const section=page.locator('section').filter({hasText:'question '+q.id+' /'});
await section.getByRole('button',{name:'核准',exact:true}).waitFor();
const stale=await teacher.newPage();await stale.goto(base+'/review-workspace.html');await stale.getByText('目前角色：reviewer').waitFor();
await section.locator('textarea').fill('Synthetic review evidence');await section.getByRole('button',{name:'核准',exact:true}).click();await page.getByText('操作成功',{exact:true}).waitFor();
await stale.getByRole('button',{name:'核准',exact:true}).first().click();await stale.getByText('版本已變更，已重新整理；請重新確認內容。').waitFor();
for(const area of ['gradeLevelFit','answer','explanation']){await section.locator('select').selectOption(area);await section.locator('textarea').fill('Synthetic review evidence');await section.getByRole('button',{name:'核准',exact:true}).click();await page.getByText('操作成功',{exact:true}).waitFor();}
const approvalResponse=page.waitForResponse(r=>r.url().endsWith('/api/review/approvals')&&r.request().method()==='POST');await section.getByRole('button',{name:'建立核准快照'}).click();const ar=await approvalResponse;assert.equal(ar.status(),200,await ar.text());await page.getByText('操作成功',{exact:true}).waitFor();
await page.getByText('稽核歷史').waitFor();
const pub=await browser.newContext({extraHTTPHeaders:{'x-test-role':'publisher'}});const p=await pub.newPage();await p.goto(base+'/review-workspace.html');await p.getByText('目前角色：publisher').waitFor();assert.equal(await p.getByRole('button',{name:'核准',exact:true}).count(),0);await p.getByRole('button',{name:'發布',exact:true}).click();await p.getByText('已發布或已有更新版本').waitFor();
const anon=await browser.newPage();await anon.goto(base+'/review-workspace.html');await anon.getByText('無法載入：unauthorized').waitFor();
console.log('SEC-14 browser: teacher review, stale version, approval, audit, publisher publication, anonymous denial PASS');
}finally{await browser.close();}
