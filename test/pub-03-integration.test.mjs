import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudflarePublicationWorker } from '../scripts/cloudflare-publication-worker.mjs';

function fakeD1() {
  const records = [];
  const audit = [];
  let failNext = false;
  const db = {
    records, audit,
    fail() { failNext = true; },
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() { const [kind,id,revision] = params; return { payload: JSON.stringify(kind === 'question' ? { ...question, id, revision } : { id, revision, status: 'approved', interactions: [{questionRefs:[{questionId:'q',revision:1}]}] }) }; },
            async all() {
              if (!sql.startsWith('SELECT payload')) throw new Error('unexpected query');
              return { results: records.filter(x => x.kind === params[0]).map(x => ({ payload: JSON.stringify(x.payload) })) };
            },
            command: { sql, params },
          };
        },
      };
    },
    async batch(statements) {
      if (failNext) { failNext = false; throw new Error('transaction failure'); }
      const [record, entry] = statements.map(s => s.command);
      assert.match(record.sql, /^INSERT INTO publication_records/);
      assert.match(entry.sql, /^INSERT INTO publication_audit/);
      const [kind, id, revision, payload, actor, at] = record.params;
      if (records.some(x => x.kind === kind && x.id === id && x.revision >= revision)) throw new Error('revision conflict');
      records.push({ kind, id, revision, payload: JSON.parse(payload), actor, at });
      audit.push(entry.params);
    },
  };
  return db;
}
const db = fakeD1();
const env = { PUBLICATION_DB: db, REGISTRY_BUNDLE_JSON: JSON.stringify({ registry: { units: [] } }) };
const principal = { id: 'verified-publisher', role: 'publisher' };
const calls = [];
const worker = createCloudflarePublicationWorker({
  authenticate: async () => principal,
  clock: () => new Date('2026-11-10T02:00:00.000Z'),
  validators: {
    question: ({ question }) => {
      calls.push(question);
      return question.prompt === 'reject' ? [{ code: 'unapproved', path: 'question' }] : [];
    },
    level: ({ level, questions }) => {
      calls.push({ level, questions });
      return questions.length === 0 ? [{ code: 'no_questions' }] : [];
    },
  },
});
function post(path, payload) {
  return worker.fetch(new Request('https://example.org' + path, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  }), env);
}
const question = { id: 'q', revision: 1, publicationStatus: 'approved', prompt: 'ok',
  publicationRecord: { publisher: 'forged', publishedAt: '2000-01-01T00:00:00Z', revision: 1 } };
test('題目驗證使用最終發布狀態及可信任稽核身分', async () => {
  const res = await post('/api/questions/publish', question);
  assert.equal(res.status, 201);
  const { result } = await res.json();
  assert.equal(result.publicationStatus, 'published');
  assert.equal(result.publicationRecord.publisher, principal.id);
  assert.equal(result.publicationRecord.publishedAt, '2026-11-10T02:00:00.000Z');
  assert.equal(calls[0].publicationStatus, 'approved');
  assert.equal(db.audit.length, 1);
  assert.equal(db.records[0].payload.publicationRecord.publisher, principal.id);
});
test('重複版本、較舊版本及未核准資料拒絕且無額外稽核', async () => {
  assert.equal((await post('/api/questions/publish', question)).status, 409);
  assert.equal((await post('/api/questions/publish', { ...question, revision: 0 })).status, 400);
  assert.equal((await post('/api/questions/publish', { ...question, revision: 2, publicationStatus: 'draft' })).status, 422);
  assert.equal(db.audit.length, 1);
});
test('驗證拒絕與交易錯誤不產生成功紀錄', async () => {
  assert.equal((await post('/api/questions/publish', { ...question, revision: 2, prompt: 'reject' })).status, 422);
  db.fail();
  assert.equal((await post('/api/questions/publish', { ...question, revision: 2 })).status, 409);
  assert.equal(db.records.length, 1);
  assert.equal(db.audit.length, 1);
});
test('關卡引用已發布題目並在寫入前驗證', async () => {
  const res = await post('/api/levels/publish', { id: 'l', revision: 1, status: 'approved' });
  assert.equal(res.status, 201);
  assert.equal(calls.at(-1).level.status, 'approved');
  assert.equal(calls.at(-1).questions[0].publicationStatus, 'published');
  assert.equal(db.audit.length, 2);
});
test('未授權與錯誤路徑不得觸發寫入', async () => {
  const denied = createCloudflarePublicationWorker({ authenticate: async () => null });
  assert.equal((await denied.fetch(new Request('https://example.org/api/questions/publish', { method: 'POST' }), env)).status, 401);
  assert.equal((await post('/api/unknown', {})).status, 404);
  assert.equal(db.audit.length, 2);
});
