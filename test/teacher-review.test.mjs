import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeacherReviewService, createMemoryTeacherReviewStore } from '../scripts/teacher-review-service.mjs';
const initial = () => ({ id: 'q1', version: 1, publicationStatus: 'pending_review', review: {} });
const setup = () => {
  const store = createMemoryTeacherReviewStore([initial()]);
  const service = createTeacherReviewService({ store, authorize: (actor, role) => actor?.role === role,
    clock: () => new Date('2026-11-10T00:00:00Z') });
  return { store, service };
};
const teacher = { id: 'teacher-1', role: 'reviewer' };
test('拒絕未授權人員與不合法審查要求', async () => {
  const { service, store } = setup();
  assert.equal((await service.decide({ id:'q1', area:'answer', action:'approve', expectedVersion:1 }, { id:'x', role:'student' })).error, 'forbidden');
  assert.equal((await service.decide({ id:'q1', area:'answer', action:'return', expectedVersion:1 }, teacher)).error, 'invalid_request');
  assert.equal(store.getAudits().length, 0);
});
test('四項核准才標記 approved，並記錄真實審查者與時間', async () => {
  const { service, store } = setup();
  let version=1;
  for(const area of ['curriculum','gradeLevelFit','answer','explanation']){
    const r=await service.decide({ id:'q1', area, action:'approve', expectedVersion:version },teacher);
    assert.equal(r.ok,true);
    version=r.record.version;
    assert.equal(r.record.review[area].reviewer,'teacher-1');
    assert.equal(r.record.publicationStatus, version===5?'approved':'pending_review');
  }
  assert.equal(store.getAudits().length,4);
});
test('退回阻止核准；版本衝突不得覆寫', async () => {
  const { service, store }=setup();
  const first=await service.decide({id:'q1',area:'answer',action:'return',notes:'答案需修正',expectedVersion:1},teacher);
  assert.equal(first.record.publicationStatus,'returned');
  const stale=await service.decide({id:'q1',area:'curriculum',action:'approve',expectedVersion:1},teacher);
  assert.equal(stale.error,'version_conflict');
  assert.equal(store.getAudits().length,1);
});
test('並行相同版本只有一次成功', async () => {
  const { service,store }=setup();
  const [a,b]=await Promise.all(['answer','curriculum'].map(area=>service.decide({id:'q1',area,action:'approve',expectedVersion:1},teacher)));
  assert.equal([a.ok,b.ok].filter(Boolean).length,1);
  assert.equal(store.getAudits().length,1);
});
test('已核准題目不得重新審查', async () => {
  const store=createMemoryTeacherReviewStore([{...initial(),publicationStatus:'approved'}]);
  const service=createTeacherReviewService({store,authorize:(a,r)=>a?.role===r});
  assert.equal((await service.decide({id:'q1',area:'answer',action:'approve',expectedVersion:1},teacher)).error,'invalid_state');
});
