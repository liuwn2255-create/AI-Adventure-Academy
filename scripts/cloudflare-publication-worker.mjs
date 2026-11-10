import { authenticatePublisher } from './cloudflare-access-auth.mjs';
import { validateQuestionPublication, validateLevelPublication } from './publication-guard.mjs';

const reply = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const validId = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
const validRev = (v) => Number.isSafeInteger(v) && v > 0;
async function list(db, kind) {
  const result = await db.prepare('SELECT payload FROM publication_records WHERE kind = ?').bind(kind).all();
  return result.results.map((row) => JSON.parse(row.payload));
}
async function publish(kind, entity, principal, env) {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity) || !validId(entity.id) || !validRev(entity.revision)) {
    return reply(400, { error: 'invalid_payload' });
  }
  if ((kind === 'question' && entity.publicationStatus !== 'approved')
      || (kind === 'level' && entity.status !== 'approved')) return reply(422, { error: 'not_approved' });
  const existing = await list(env.PUBLICATION_DB, kind);
  if (existing.some((x) => x.id === entity.id && x.revision >= entity.revision)) {
    return reply(409, { error: 'revision_conflict' });
  }
  const registryBundle = JSON.parse(env.REGISTRY_BUNDLE_JSON || 'null');
  if (!registryBundle) return reply(503, { error: 'registry_unavailable' });
  const errors = kind === 'question'
    ? validateQuestionPublication({ question: entity, registryBundle })
    : validateLevelPublication({ level: entity, questions: await list(env.PUBLICATION_DB, 'question'), registryBundle });
  if (errors.length) return reply(422, { error: 'publication_rejected', details: errors });
  const published = kind === 'question'
    ? { ...entity, publicationStatus: 'published' }
    : { ...entity, status: 'published' };
  const at = new Date().toISOString();
  const db = env.PUBLICATION_DB;
  try {
    await db.batch([
      db.prepare('INSERT INTO publication_records (kind, entity_id, revision, payload, actor_id, published_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(kind, entity.id, entity.revision, JSON.stringify(published), principal.id, at),
      db.prepare('INSERT INTO publication_audit (event, kind, entity_id, revision, actor_id, published_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind('published', kind, entity.id, entity.revision, principal.id, at),
    ]);
  } catch {
    // Unique constraint or revision trigger rejects conflicting concurrent writes.
    return reply(409, { error: 'write_conflict' });
  }
  return reply(201, { result: published });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.PUBLICATION_DB) return reply(503, { error: 'database_unavailable' });
    const routes = { '/api/questions/publish': 'question', '/api/levels/publish': 'level' };
    const kind = routes[url.pathname];
    if (request.method !== 'POST' || !kind) return reply(404, { error: 'not_found' });
    const principal = await authenticatePublisher(request, env);
    if (!principal) return reply(401, { error: 'unauthorized' });
    if (Number(request.headers.get('content-length') || 0) > 1048576) return reply(413, { error: 'too_large' });
    let entity;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 1048576) return reply(413, { error: 'too_large' });
      entity = JSON.parse(raw);
    } catch { return reply(400, { error: 'invalid_json' }); }
    try { return await publish(kind, entity, principal, env); }
    catch { return reply(503, { error: 'publication_unavailable' }); }
  },
};
