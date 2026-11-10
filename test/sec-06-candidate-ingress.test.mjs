import test from 'node:test';
import assert from 'node:assert/strict';
import {createCandidateIngress} from '../scripts/candidate-ingress.mjs';
import {createD1ReviewedQuestionStore} from '../scripts/d1-reviewed-question-store.mjs';
const source={id:'q',revision:1,prompt:'server content',publicationStatus:'draft'};
function db(candidate=source) {
 const saved=[];
 return {saved,prepare(sql){return {bind(...args){return {
  async first(){return candidate?{payload:JSON.stringify(candidate)}:null;},
  sql,args,
 };}};},async batch(items){saved.push(items[0].args);}};
}
const authorize=(actor,role)=>actor?.role===role;
test('僅可信任課綱編輯者可建立待審題目',async()=>{
 const database=db(),service=createCandidateIngress({database,authorize});
 assert.equal((await service.seed({id:'q',revision:1,prompt:'forged'},{id:'attacker',role:'reviewer'})).error,'forbidden');
 assert.equal((await service.seed({id:'q',revision:1,prompt:'forged'},{id:'editor',role:'curriculum_editor'})).ok,true);
 const saved=JSON.parse(database.saved[0][3]);
 assert.equal(saved.prompt,'server content');
 assert.equal(saved.publicationStatus,'pending_review');
 assert.deepEqual(saved.review,{});
});
test('來源缺漏、冒用審核紀錄、錯誤版本均 fail closed',async()=>{
 for(const value of [null,{...source,review:{answer:{status:'approved'}}},{...source,revision:2},{...source,publicationStatus:'approved'}]){
  const database=db(value),service=createCandidateIngress({database,authorize});
  assert.equal((await service.seed({id:'q',revision:1},{id:'editor',role:'curriculum_editor'})).ok,false);
  assert.equal(database.saved.length,0);
 }
});
test('SEC-03 直接提交 approved 物件的舊入口已封鎖',async()=>{
 const database=db();
 const service=createD1ReviewedQuestionStore({database,authorize});
 const result=await service.saveApproved({id:'q',revision:1,publicationStatus:'approved'},{id:'teacher',role:'reviewer'});
 assert.equal(result.error,'direct_approval_disabled');
 assert.equal(database.saved.length,0);
});
