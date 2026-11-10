import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicationService, createMemoryPublicationStore, PublicationError } from '../scripts/publication-service.mjs';
import { createLocalPublicationApi } from '../scripts/publication-http.mjs';

const fixture = (overrides = {}) => {
  const store = createMemoryPublicationStore();
  const service = createPublicationService({
    registryBundle: { registry: { units: [] } },
    store,
    authorize: (p, role) => p?.role === role,
    clock: () => new Date('2026-11-10T00:00:00Z'),
    validators: { question: () => [], level: () => [] },
    ...overrides,
  });
  return { service, store };
};
const principal = { id: 'publisher-1', role: 'publisher' };
const q = { id: 'q-1', revision: 1, publicationStatus: 'approved' };
const l = { id: 'l-1', revision: 1, status: 'approved', interactions: [] };
test('拒絕未授權、未核准與不合法資料', async () => {
  const { service, store } = fixture();
  await assert.rejects(service.publishQuestion(q, { id: 'guest' }), { status: 403 });
  await assert.rejects(service.publishQuestion({ ...q, publicationStatus: 'draft' }, principal), { status: 422 });
  await assert.rejects(service.publishQuestion(null, principal), { status: 400 });
  assert.equal(store.auditLog().length, 0);
});
test('版本不可覆寫；驗證失敗不得寫入或記錄成功', async () => {
  const { service, store } = fixture();
  const result = await service.publishQuestion(q, principal);
  assert.equal(result.publicationStatus, 'published');
  await assert.rejects(service.publishQuestion(q, principal), { status: 409 });
  await assert.rejects(service.publishQuestion({ ...q, revision: 0 }, principal), { status: 400 });
  await assert.rejects(service.publishQuestion({ ...q, revision: 1 }, principal), { status: 409 });
  assert.equal(store.auditLog().length, 1);
  assert.equal(service.listPublished('question').length, 1);
});
test('同時發布相同版本僅成功一次，資料與稽核一致', async () => {
  const { service, store } = fixture();
  const results = await Promise.allSettled([service.publishQuestion(q, principal), service.publishQuestion(q, principal)]);
  assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(store.auditLog().length, 1);
});
test('關卡發布會呼叫驗證器，失敗則回滾', async () => {
  const { service, store } = fixture({ validators: {
    question: () => [],
    level: () => [{ code: 'approval_gate', path: 'level' }],
  } });
  await assert.rejects(service.publishLevel(l, principal), { status: 422, code: 'publication_rejected' });
  assert.equal(store.auditLog().length, 0);
});
test('發布題目與關卡均保留固定版本及稽核身份', async () => {
  const { service, store } = fixture();
  await service.publishQuestion(q, principal);
  const result = await service.publishLevel(l, principal);
  assert.equal(result.status, 'published');
  assert.equal(store.auditLog()[1].actorId, principal.id);
  result.status = 'draft';
  assert.equal(service.listPublished('level')[0].status, 'published');
});
test('本機 API 拒絕短金鑰及未授權要求', async () => {
  assert.throws(() => createLocalPublicationApi({ registryBundle: {}, token: 'short', actorId: 'a' }));
  const { server } = createLocalPublicationApi({ registryBundle: {}, token: 'a'.repeat(40), actorId: 'a' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/questions/publish`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(q),
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
