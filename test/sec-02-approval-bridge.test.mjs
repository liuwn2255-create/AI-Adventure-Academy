import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrustedApprovalBridge } from '../scripts/trusted-approval-bridge.mjs';
import { createCloudflarePublicationWorker } from '../scripts/cloudflare-publication-worker.mjs';

const areas=['curriculum','gradeLevelFit','answer','explanation'];
const approved={id:'q1',revision:2,publicationStatus:'approved',prompt:'server-only',
  review:Object.fromEntries(areas.map(area=>[area,{status:'approved',reviewer:'teacher-1',reviewerRole:'reviewer',reviewedAt:'2026-11-10T00:00:00Z'}]))};
const actor={id:'teacher-1',role:'reviewer'};
function database() {
  const approvals=new Map(), publications=[];
  const key=(kind,id,rev)=>kind+':'+id+':'+rev;
  return {
    approvals, publications,
    prepare(sql) {
      return {bind(...args) {return {
        async first() {
          const [kind,id,rev]=args;
          return approvals.get(key(kind,id,rev)) ?? null;
        },
        async all() {
          return {results:publications.filter(x=>x.kind===args[0]).map(x=>({payload:JSON.stringify(x.payload)}))};
        },
        sql,args,
      };}};
    },
    async batch(statements) {
      for(const s of statements) {
        if(s.sql.startsWith('INSERT INTO publication_approvals')) {
          const [kind,id,rev,payload]=s.args;
          const k=key(kind,id,rev);
          if(approvals.has(k)) throw new Error('duplicate');
          approvals.set(k,{payload});
        } else if(s.sql.startsWith('INSERT INTO publication_records')) {
          const [kind,id,rev,payload]=s.args;
          publications.push({kind,id,rev,payload:JSON.parse(payload)});
        }
      }
    },
  };
}
function bridge(db, reviewed=approved) {
  return createTrustedApprovalBridge({database:db,loadReviewedQuestion:async()=>reviewed,
    authorize:(person,role)=>person?.role===role,clock:()=>new Date('2026-11-10T01:00:00Z')});
}
test('教師審核快照經伺服器載入並寫入不可變核准資料表',async()=>{
  const db=database();
  const result=await bridge(db).promote({id:'q1',revision:2,review:{answer:{reviewer:'attacker'}}},actor);
  assert.equal(result.ok,true);
  assert.equal(JSON.parse(db.approvals.get('question:q1:2').payload).review.answer.reviewer,'teacher-1');
  assert.equal((await bridge(db).promote({id:'q1',revision:2},actor)).error,'approval_write_conflict');
});
test('缺審查、未核准、身分不符均不寫入',async()=>{
  const db=database();
  assert.equal((await bridge(db).promote({id:'q1',revision:2},{id:'student',role:'student'})).error,'forbidden');
  assert.equal((await bridge(db,{...approved,review:{}}).promote({id:'q1',revision:2},actor)).error,'approval_incomplete');
  assert.equal((await bridge(db,{...approved,publicationStatus:'pending_review'}).promote({id:'q1',revision:2},actor)).error,'approval_incomplete');
  assert.equal((await bridge(db,{...approved,revision:3}).promote({id:'q1',revision:2},actor)).error,'approval_incomplete');
  assert.equal(db.approvals.size,0);
});
test('SEC-01 發布服務僅從核准快照取得內容，與審核橋接相容',async()=>{
  const db=database();
  const worker=createCloudflarePublicationWorker({
    authenticate:async()=>({id:'publisher-2',role:'publisher'}),
    validators:{question:({question})=>question.publicationStatus==='approved'?[]:[{code:'wrong_state'}],level:()=>[]},
    clock:()=>new Date('2026-11-10T02:00:00Z'),
  });
  const env={PUBLICATION_DB:db,REGISTRY_BUNDLE_JSON:'{}'};
  const request=()=>new Request('https://example.org/api/questions/publish',{method:'POST',
    body:JSON.stringify({id:'q1',revision:2,publicationStatus:'approved',prompt:'forged'})});
  assert.equal((await worker.fetch(request(),env)).status,422);
  assert.equal((await bridge(db).promote({id:'q1',revision:2},actor)).ok,true);
  const response=await worker.fetch(request(),env);
  assert.equal(response.status,201);
  const result=(await response.json()).result;
  assert.equal(result.prompt,'server-only');
  assert.equal(result.publicationRecord.publisher,'publisher-2');
  assert.equal(db.publications.length,1);
});
