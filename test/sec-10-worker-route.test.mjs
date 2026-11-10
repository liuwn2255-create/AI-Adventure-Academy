import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloudflareIntegratedWorker} from '../scripts/cloudflare-integrated-worker.mjs';
import {createCloudflareReviewWorker} from '../scripts/cloudflare-review-worker.mjs';
import {createCloudflarePublicationWorker} from '../scripts/cloudflare-publication-worker.mjs';

const env={PUBLICATION_DB:{prepare(){},batch(){}}};
const req=(path,payload={},method='POST')=>new Request('https://example.org'+path,
  method==='POST'?{method,body:JSON.stringify(payload)}:{method});
const teacher={id:'teacher',role:'reviewer'};
const publisher={id:'publisher',role:'publisher'};
function makeApp(actor) {
  let decisions=0,approvals=0,publishes=0;
  const reviewWorker=createCloudflareReviewWorker({
    authenticate:async()=>actor,
    makeDecision:()=>({decide:async()=>{decisions++;return {ok:true};}}),
    makeApproval:()=>({promote:async()=>{approvals++;return {ok:true};}}),
  });
  const publicationWorker=createCloudflarePublicationWorker({
    authenticate:async()=>actor,
    validators:{question:()=>[],level:()=>[]},
  });
  return {app:createCloudflareIntegratedWorker({reviewWorker,publicationWorker}),
    counts:()=>({decisions,approvals,publishes})};
}

test('SEC-10: reviewer can review but cannot publish; no D1 publish access',async()=>{
  const {app,counts}=makeApp(teacher);
  assert.equal((await app.fetch(req('/api/review/decisions',
    {id:'q',revision:1,area:'answer',action:'approve',expectedVersion:1}),env)).status,200);
  assert.equal((await app.fetch(req('/api/review/approvals',{id:'q',revision:1}),env)).status,200);
  const publish=await app.fetch(req('/api/questions/publish',{id:'q',revision:1,publicationStatus:'approved'}),env);
  assert.equal(publish.status,401);
  assert.deepEqual(counts(),{decisions:1,approvals:1,publishes:0});
});
test('SEC-10: publisher cannot review or approve even with forged body role',async()=>{
  const {app,counts}=makeApp(publisher);
  assert.equal((await app.fetch(req('/api/review/decisions',
    {id:'q',revision:1,area:'answer',action:'approve',expectedVersion:1,role:'reviewer'}),env)).status,401);
  assert.equal((await app.fetch(req('/api/review/approvals',{id:'q',revision:1}),env)).status,401);
  assert.deepEqual(counts(),{decisions:0,approvals:0,publishes:0});
});
test('SEC-10: publisher requires server-side approved snapshot before publish',async()=>{
  const {app}=makeApp(publisher);
  const db={prepare(sql){
    assert.match(sql,/FROM publication_approvals/);
    return {bind(){return {async first(){return null;}};}};
  },batch(){throw Error('must not write');}};
  const response=await app.fetch(req('/api/questions/publish',{id:'q',revision:1,publicationStatus:'approved'}),
    {...env,PUBLICATION_DB:db});
  assert.equal(response.status,422);
  assert.deepEqual(await response.json(),{error:'trusted_approval_required'});
});
test('SEC-10: unknown paths and methods never reach privileged handlers',async()=>{
  let invoked=0;
  const handler={fetch:async()=>{invoked++;return new Response('ok');}};
  const app=createCloudflareIntegratedWorker({reviewWorker:handler,publicationWorker:handler});
  for(const path of ['/api/review/candidates','/api/questions/seed','/api/review/approvals/','/api/levels/publish/']) {
    assert.equal((await app.fetch(req(path),env)).status,404);
  }
  assert.equal(invoked,0);
  // Known path is delegated to its handler; each handler owns method validation.
  assert.equal((await app.fetch(req('/api/review/decisions'),env)).status,200);
  assert.equal(invoked,1);
});
test('SEC-10: default integrated worker denies absent D1 and missing auth',async()=>{
  const app=createCloudflareIntegratedWorker();
  assert.equal((await app.fetch(req('/api/review/decisions',{id:'q',revision:1}),{})).status,503);
  assert.equal((await app.fetch(req('/api/questions/publish',{id:'q',revision:1}),{})).status,503);
});
