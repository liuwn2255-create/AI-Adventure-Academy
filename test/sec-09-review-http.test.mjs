import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloudflareReviewWorker} from '../scripts/cloudflare-review-worker.mjs';
const env={PUBLICATION_DB:{prepare(){},batch(){}}};
const request=(path,body,headers={})=>new Request('https://example.org'+path,{method:'POST',headers,body:JSON.stringify(body)});
const reviewer={id:'teacher-1',role:'reviewer'};
test('SEC-09: deny unauthenticated publisher and unavailable database before mutation',async()=>{
  let calls=0;
  const worker=createCloudflareReviewWorker({
    authenticate:async()=>({id:'publisher',role:'publisher'}),
    makeDecision:()=>{calls++;return {decide:async()=>({ok:true})};},
  });
  assert.equal((await worker.fetch(request('/api/review/decisions',{id:'q',revision:1}),env)).status,401);
  assert.equal(calls,0);
  const noDb=createCloudflareReviewWorker({authenticate:async()=>reviewer});
  assert.equal((await noDb.fetch(request('/api/review/decisions',{id:'q',revision:1}),{})).status,503);
});
test('SEC-09: reject client-owned review, audit and oversized payload before service call',async()=>{
  let calls=0;
  const worker=createCloudflareReviewWorker({
    authenticate:async()=>reviewer,
    makeDecision:()=>{calls++;return {decide:async()=>({ok:true})};},
    makeApproval:()=>{calls++;return {promote:async()=>({ok:true})};},
  });
  assert.equal((await worker.fetch(request('/api/review/decisions',{id:'q',revision:1,review:{answer:'approved'}}),env)).status,400);
  assert.equal((await worker.fetch(request('/api/review/approvals',{id:'q',revision:1,reviewer_id:'fake'}),env)).status,400);
  assert.equal((await worker.fetch(request('/api/review/decisions',{id:'q',revision:1}),env)).status,200);
  assert.equal(calls,1);
  assert.equal((await worker.fetch(request('/api/review/decisions',{id:'q',revision:1},{'content-length':'1048577'}),env)).status,413);
  assert.equal(calls,1);
});
test('SEC-09: reviewer can decide and promote identity-only; errors fail closed',async()=>{
  const observed=[];
  const worker=createCloudflareReviewWorker({
    authenticate:async()=>reviewer,
    makeDecision:()=>({decide:async(payload,actor)=>{observed.push(['decide',payload,actor.id]);return {ok:true,record:{secret:'private'}};}}),
    makeApproval:()=>({promote:async(payload,actor)=>{observed.push(['promote',payload,actor.id]);return {ok:false,error:'approval_incomplete'};}}),
  });
  const decision={id:'q1',revision:1,area:'answer',action:'approve',expectedVersion:1};
  const a=await worker.fetch(request('/api/review/decisions',decision),env);
  assert.equal(a.status,200);
  assert.deepEqual(await a.json(),{ok:true,id:'q1',revision:1});
  const b=await worker.fetch(request('/api/review/approvals',{id:'q1',revision:1}),env);
  assert.equal(b.status,422);
  assert.deepEqual(await b.json(),{error:'approval_incomplete'});
  assert.deepEqual(observed,[['decide',decision,'teacher-1'],['promote',{id:'q1',revision:1},'teacher-1']]);
});
test('SEC-09: no public candidate-ingress or GET review routes',async()=>{
  const worker=createCloudflareReviewWorker({authenticate:async()=>reviewer});
  assert.equal((await worker.fetch(request('/api/review/candidates',{id:'q',revision:1}),env)).status,404);
  assert.equal((await worker.fetch(new Request('https://example.org/api/review/decisions'),env)).status,404);
});
