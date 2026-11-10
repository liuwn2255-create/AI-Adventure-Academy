import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudflarePublicationWorker } from '../scripts/cloudflare-publication-worker.mjs';
function db(approved) {
  const writes=[];
  return {writes,prepare(sql){return {bind(){return {
    first:async()=>approved?{payload:JSON.stringify(approved)}:null,
    all:async()=>({results:[]}),
  };}};},batch:async()=>{writes.push(true);}};
}
const q={id:'q',revision:1,publicationStatus:'approved',review:{answer:{reviewer:'teacher'}}};
const worker=createCloudflarePublicationWorker({
  authenticate:async()=>({id:'verified',role:'publisher'}),
  validators:{question:({question})=>question.publicationStatus==='approved'?[]:[{code:'bad'}],level:()=>[]},
});
const send=(database,body)=>worker.fetch(new Request('https://example.org/api/questions/publish',{method:'POST',body:JSON.stringify(body)}),{PUBLICATION_DB:database,REGISTRY_BUNDLE_JSON:'{}'});
test('缺少可信任審核紀錄拒絕寫入',async()=>{const d=db(null);assert.equal((await send(d,q)).status,422);assert.equal(d.writes.length,0);});
test('偽造審核者與內容不得覆寫可信任快照',async()=>{
  const d=db(q);const r=await send(d,{...q,prompt:'forged',review:{answer:{reviewer:'attacker'}}});
  assert.equal(r.status,201);const result=(await r.json()).result;
  assert.equal(result.prompt,undefined);assert.equal(result.review.answer.reviewer,'teacher');
  assert.equal(result.publicationRecord.publisher,'verified');assert.equal(d.writes.length,1);
});
test('快照版本不一致拒絕',async()=>{const d=db({...q,revision:2});assert.equal((await send(d,q)).status,422);assert.equal(d.writes.length,0);});
