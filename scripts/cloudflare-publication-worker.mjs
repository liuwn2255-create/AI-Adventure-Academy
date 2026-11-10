import { authenticatePublisher } from './cloudflare-access-auth.mjs';
import { validateQuestionPublication, validateLevelPublication } from './publication-guard.mjs';

const reply = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const validId = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
const validRev = (v) => Number.isSafeInteger(v) && v > 0;
async function list(db, kind) {
  const result = await db.prepare('SELECT payload FROM publication_records WHERE kind = ?').bind(kind).all();
  return result.results.map((row) => JSON.parse(row.payload));
}
async function publish(kind, entity, principal, env, validators, clock) {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity) || !validId(entity.id) || !validRev(entity.revision)) {
    return reply(400, { error: 'invalid_payload' });
  }
  if ((kind === 'question' && entity.publicationStatus !== 'approved')
      || (kind === 'level' && entity.status !== 'approved')) return reply(422, { error: 'not_approved' });
  // Resolve the entire approved payload from the server-controlled review store.
  // The request supplies only the identity of the approved revision.
  let approved;
  try {
    const result = await env.PUBLICATION_DB.prepare(
      'SELECT payload FROM publication_approvals WHERE kind = ? AND entity_id = ? AND revision = ?'
    ).bind(kind, entity.id, entity.revision).first();
    if (!result?.payload) return reply(422, { error: 'trusted_approval_required' });
    approved = JSON.parse(result.payload);
  } catch { return reply(503, { error: 'approval_store_unavailable' }); }
  if (!approved || approved.id !== entity.id || approved.revision !== entity.revision
    || (kind === 'question' ? approved.publicationStatus !== 'approved' : approved.status !== 'approved')) {
    return reply(422, { error: 'trusted_approval_invalid' });
  }
  const existing = await list(env.PUBLICATION_DB, kind);
  if (existing.some((x) => x.id === entity.id && x.revision >= entity.revision)) {
    return reply(409, { error: 'revision_conflict' });
  }
  const registryBundle = JSON.parse(env.REGISTRY_BUNDLE_JSON || 'null');
  if (!registryBundle) return reply(503, { error: 'registry_unavailable' });
  // Use only the server-stored approved entity; client-supplied review fields are ignored.
  const at = clock().toISOString();
  const published = kind === 'question'
    ? { ...approved, publicationStatus: 'published',
        publicationRecord: { publisher: principal.id, publishedAt: at, revision: entity.revision } }
    : { ...approved, status: 'published' };
  const errors = kind === 'question'
    ? validators.question({ question: { ...approved, publicationRecord: published.publicationRecord }, registryBundle })
    : validators.level({ level: approved, questions: await list(env.PUBLICATION_DB, 'question'), registryBundle });
  if (errors.length) return reply(422, { error: 'publication_rejected', details: errors });
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
export function createCloudflarePublicationWorker({
  authenticate = authenticatePublisher,
  validators = { question: validateQuestionPublication, level: validateLevelPublication },
  clock = () => new Date(),
} = {}) {
  return {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.PUBLICATION_DB) return reply(503, { error: 'database_unavailable' });
    const routes = { '/api/questions/publish': 'question', '/api/levels/publish': 'level' };
    const kind = routes[url.pathname];
    if (request.method !== 'POST' || !kind) return reply(404, { error: 'not_found' });
    let principal;
    try { principal = await authenticate(request, env); }
    catch { return reply(401, { error: 'unauthorized' }); }
    if (!principal || principal.role !== 'publisher' || typeof principal.id !== 'string' || !principal.id) return reply(401, { error: 'unauthorized' });
    if (Number(request.headers.get('content-length') || 0) > 1048576) return reply(413, { error: 'too_large' });
    let entity;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 1048576) return reply(413, { error: 'too_large' });
      entity = JSON.parse(raw);
    } catch { return reply(400, { error: 'invalid_json' }); }
    try { return await publish(kind, entity, principal, env, validators, clock); }
    catch { return reply(503, { error: 'publication_unavailable' }); }
  },
  };
}
export default createCloudflarePublicationWorker();
