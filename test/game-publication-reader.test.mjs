import test from 'node:test';
import assert from 'node:assert/strict';
import { createGamePublicationReader, createGamePublicationHttp } from '../scripts/game-publication-reader.mjs';
const q = { id: 'q1', revision: 2, publicationStatus: 'published' };
const l = { id: 'l1', revision: 1, status: 'published', questionRefs: [{ questionId: 'q1', revision: 2 }] };
const db = rows => ({
  prepare(sql) {
    assert.match(sql, /^SELECT entity_id, revision, payload FROM publication_records/);
    return { bind(kind) { return { async all() { return { results: rows.filter(x => x.kind === kind).map(x => ({
      entity_id: x.item.id, revision: x.item.revision, payload: JSON.stringify(x.item),
    })) }; } }; } };
  },
});
const rows = [
  {kind:'question',item:q}, {kind:'level',item:l},
  {kind:'level',item:{...l,id:'missing',questionRefs:[{questionId:'q1',revision:1}]}},
  {kind:'level',item:{...l,id:'malformed',questionRefs:[]}},
];
test('只讀取已發布精確版本，拒絕缺題目引用關卡',async()=>{
  const snapshot=await createGamePublicationReader({database:db(rows)}).snapshot();
  assert.deepEqual(snapshot.questions,[q]);
  assert.deepEqual(snapshot.levels,[l]);
});
test('任何資料完整性錯誤 fail closed',async()=>{
  const broken=db([{kind:'question',item:{...q,publicationStatus:'approved'}}]);
  await assert.rejects(()=>createGamePublicationReader({database:broken}).snapshot(),/integrity/);
  const response=await createGamePublicationHttp({database:broken})(new Request('https://example.org/api/game/publications'));
  assert.equal(response.status,503);
});
test('僅提供 GET 遊戲資料，不提供寫入路由',async()=>{
  const handler=createGamePublicationHttp({database:db(rows)});
  const ok=await handler(new Request('https://example.org/api/game/publications'));
  assert.equal(ok.status,200);
  assert.equal((await ok.json()).levels.length,1);
  assert.equal((await handler(new Request('https://example.org/api/game/publications',{method:'POST'}))).status,404);
});
test('資料庫讀取失敗時不回傳部分結果',async()=>{
  const handler=createGamePublicationHttp({database:{prepare(){throw new Error('db offline');}}});
  assert.equal((await handler(new Request('https://example.org/api/game/publications'))).status,503);
});
