import test from 'node:test';
import assert from 'node:assert/strict';
import { createD1ReviewDecisionService } from '../scripts/d1-review-decision-service.mjs';
const candidate=()=>({id:'q',revision:3,version:1,publicationStatus:'pending_review',prompt:'immutable content',review:{}});
function db() {
 let value=candidate();const audits=[];
 return {audits,get:()=>structuredClone(value),
  prepare(sql){return {bind(...args){return {
   first:async()=>({version:value.version,payload:JSON.stringify(value)}),
   sql,args,
  };}};},
  async batch(statements) {
   const [update,audit]=statements;
   const [version,payload,id,revision,expected]=update.args;
   if(value.id!==id||value.revision!==revision||value.version!==expected) throw Error('stale');
   if(audits.some(x=>x.version===version)) throw Error('duplicate');
   value=JSON.parse(payload);
   audits.push({version,area:audit.args[2],actor:audit.args[4]});
  },
 };
}
const actor={id:'teacher-1',role:'reviewer'};
const service=database=>createD1ReviewDecisionService({database,authorize:(a,r)=>a?.role===r,
 clock:()=>new Date('2026-11-10T00:00:00Z')});
test('四項審核逐次簽名、版本遞增，才可核准',async()=>{
 const database=db(),s=service(database);let version=1;
 for(const area of ['curriculum','gradeLevelFit','answer','explanation']){
  const result=await s.decide({id:'q',revision:3,area,action:'approve',expectedVersion:version,prompt:'forged'},actor);
  assert.equal(result.ok,true);version=result.record.version;
  assert.equal(result.record.prompt,'immutable content');
  assert.equal(result.record.publicationStatus,version===5?'approved':'pending_review');
 }
 assert.equal(database.audits.length,4);
 assert.equal(database.get().review.answer.reviewer,'teacher-1');
});
test('未授權、缺退回理由、過期版本不寫入',async()=>{
 const database=db(),s=service(database);
 assert.equal((await s.decide({id:'q',revision:3,area:'answer',action:'approve',expectedVersion:1},{id:'x',role:'student'})).error,'forbidden');
 assert.equal((await s.decide({id:'q',revision:3,area:'answer',action:'return',expectedVersion:1},actor)).error,'invalid_request');
 assert.equal((await s.decide({id:'q',revision:3,area:'answer',action:'approve',expectedVersion:2},actor)).error,'version_conflict');
 assert.equal(database.audits.length,0);
});
test('同一版本競爭只有一次寫入成功',async()=>{
 const database=db(),s=service(database);
 const [a,b]=await Promise.all(['answer','curriculum'].map(area=>s.decide({id:'q',revision:3,area,action:'approve',expectedVersion:1},actor)));
 assert.equal([a.ok,b.ok].filter(Boolean).length,1);
 assert.equal(database.audits.length,1);
});
