import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateReviewer } from '../scripts/cloudflare-reviewer-auth.mjs';
import { createD1ReviewedQuestionStore } from '../scripts/d1-reviewed-question-store.mjs';
import { createTrustedApprovalBridge } from '../scripts/trusted-approval-bridge.mjs';
const teacher={id:'teacher-1',role:'reviewer'};
const areas=['curriculum','gradeLevelFit','answer','explanation'];
const q={id:'q1',revision:1,publicationStatus:'approved',review:Object.fromEntries(areas.map(area=>[area,{
  status:'approved',reviewer:'teacher-1',reviewerRole:'reviewer',reviewedAt:'2026-11-10T00:00:00Z'}]))};
function fakeD1() {
  const reviews=new Map(), approvals=new Map();
  return {reviews,approvals,
    prepare(sql){return {bind(...args){return {
      sql,args,
      async first(){
        if(sql.includes('FROM reviewed_questions')) return reviews.get(args[0]+'@'+args[1])??null;
        if(sql.includes('FROM publication_approvals')) return approvals.get(args.join('@'))??null;
        throw Error('unexpected query');
      },
    };}};},
    async batch(statements){
      for(const {sql,args} of statements){
        if(sql.includes('INTO reviewed_questions')){
          const key=args[0]+'@'+args[1];
          if(reviews.has(key)) throw Error('duplicate');
          reviews.set(key,{payload:args[2]});
        } else if(sql.includes('INTO publication_approvals')){
          const key=args.slice(0,3).join('@');
          if(approvals.has(key)) throw Error('duplicate');
          approvals.set(key,{payload:args[3]});
        } else throw Error('unexpected insert');
      }
    },
  };
}
const authorize=(person,role)=>person?.role===role;
test('無教師 allowlist 拒絕驗證，即使發布者 allowlist 存在',async()=>{
  const request=new Request('https://example.org',{headers:{'Cf-Access-Jwt-Assertion':'bad.token'}});
  assert.equal(await authenticateReviewer(request,{PUBLISHER_EMAILS:'publisher@example.org'}),null);
});
test('未授權、偽造其他教師、審核未完成一律不寫入',async()=>{
  const db=fakeD1(), store=createD1ReviewedQuestionStore({database:db,authorize});
  assert.equal((await store.saveApproved(q,{id:'x',role:'publisher'})).error,'direct_approval_disabled');
  assert.equal((await store.saveApproved({...q,review:{...q.review,answer:{...q.review.answer,reviewer:'other'}}},teacher)).error,'direct_approval_disabled');
  assert.equal((await store.saveApproved({...q,review:{...q.review,answer:{...q.review.answer,status:'pending_review'}}},teacher)).error,'direct_approval_disabled');
  assert.equal(db.reviews.size,0);
});
test('D1 已審核快照可被 SEC-02 橋接讀取；重複版本不可覆寫',async()=>{
  const db=fakeD1(), store=createD1ReviewedQuestionStore({database:db,authorize});
  assert.equal((await store.saveApproved(q,teacher)).error,'direct_approval_disabled');
  assert.equal(db.reviews.size,0);
  const bridge=createTrustedApprovalBridge({database:db,loadReviewedQuestion:store.loadReviewedQuestion,authorize});
  assert.equal((await bridge.promote({id:'q1',revision:1},teacher)).error,'approval_incomplete');
  assert.equal(db.approvals.size,0);
});
