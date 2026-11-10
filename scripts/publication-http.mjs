import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { createPublicationService, createMemoryPublicationStore, PublicationError } from './publication-service.mjs';

const sameToken = (received, expected) => {
  if (typeof received !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};
/** Local-only HTTP adapter. Never expose this server publicly or use as production persistence. */
export function createLocalPublicationApi({ registryBundle, token, actorId, store = createMemoryPublicationStore() }) {
  if (typeof token !== 'string' || token.length < 32 || !actorId) {
    throw new TypeError('local API requires a long token and trusted actor identity');
  }
  const service = createPublicationService({
    registryBundle, store,
    authorize: (principal, role) => role === 'publisher' && principal?.id === actorId,
  });
  const server = createServer(async (req, res) => {
    const respond = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST' || !['/questions/publish', '/levels/publish'].includes(req.url)) {
      return respond(404, { error: 'not_found' });
    }
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ') || !sameToken(authorization.slice(7), token)) {
      return respond(401, { error: 'unauthorized' });
    }
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk.toString('utf8');
        if (Buffer.byteLength(raw) > 1024 * 1024) throw new PublicationError(413, 'too_large', '資料過大');
      }
      let payload;
      try { payload = JSON.parse(raw); }
      catch { throw new PublicationError(400, 'invalid_json', 'JSON 格式錯誤'); }
      const result = req.url === '/questions/publish'
        ? await service.publishQuestion(payload, { id: actorId })
        : await service.publishLevel(payload, { id: actorId });
      return respond(201, { result });
    } catch (error) {
      if (error instanceof PublicationError) {
        return respond(error.status, { error: error.code, details: error.details });
      }
      return respond(500, { error: 'internal_error' });
    }
  });
  return { server, service, store };
}
