import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuditedReviewSource,createAuditedApprovalBridge} from '../scripts/audited-review-pipeline.mjs';
const areas=['curriculum','gradeLevelFit','answer','explanation'];
const at='2026-11-10T00:00:00Z';
function fixture() {
 const audits=areas.map((area,i)=>({area,action:'approve',actor_id:'teacher',version:i+2,decided_at:at}));
 const question={id:'q',revision:1,version:5,publicationStatus:'approved',
  review:Object.fromEntries(areas.map(area=>[area,{status:'approved',reviewer:'teacher',reviewerRole:'reviewer',reviewedAt:at}]))};
 const approvals=[];
 const database={prepare(sql){return {bind(...args){return {
   async first(){return {version:question.version,payload:JSON.stringify(question)};},
   async all(){return {results:audits};},
   sql,args,
 };}};},async batch(items){approvals.push(items);}};
 return {database,question,audits,approvals};
}
test('四項審核與逐次稽核完全吻合才可產生發布快照',async()=>{
 const f=fixture(),load=createAuditedReviewSource({database:f.database});
 assert.equal((await load('q',1)).publicationStatus,'approved');
 const bridge=createAuditedApprovalBridge({database:f.database,authorize:(a,r)=>a?.role===r});
 assert.equal((await bridge.promote({id:'q',revision:1},{id:'teacher',role:'reviewer'})).ok,true);
 assert.equal(f.approvals.length,1);
});
test('缺漏稽核、冒用審核者、錯誤版本均 fail closed',async()=>{
 for(const mutate of [
  f=>f.audits.pop(),
  f=>{f.question.review.answer.reviewer='forged';},
  f=>{f.question.version=6;},
  f=>{f.audits[0].action='return';},
  f=>{f.audits[0].version=3;},
 ]) {
  const f=fixture();mutate(f);
  assert.equal(await createAuditedReviewSource({database:f.database})('q',1),null);
  const bridge=createAuditedApprovalBridge({database:f.database,authorize:(a,r)=>a?.role===r});
  assert.equal((await bridge.promote({id:'q',revision:1},{id:'teacher',role:'reviewer'})).error,'approval_incomplete');
  assert.equal(f.approvals.length,0);
 }
});
test('未授權的操作者不能提升已核准快照',async()=>{
 const f=fixture(),bridge=createAuditedApprovalBridge({database:f.database,authorize:(a,r)=>a?.role===r});
 assert.equal((await bridge.promote({id:'q',revision:1},{id:'publisher',role:'publisher'})).error,'forbidden');
 assert.equal(f.approvals.length,0);
});
