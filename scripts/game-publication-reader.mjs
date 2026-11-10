// PUB-05: read-only game data boundary. No authoring or publication endpoints.
const isId = x => typeof x === 'string' && x.trim() === x && x.length > 0 && x.length <= 200;
const isRev = x => Number.isSafeInteger(x) && x > 0;
const json = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const isPublished = (kind, item) => item && typeof item === 'object'
  && isId(item.id) && isRev(item.revision)
  && (kind === 'question' ? item.publicationStatus === 'published' : item.status === 'published');
function refs(level) {
  if (!Array.isArray(level.interactions) || !level.interactions.length) return null;
  const references = [];
  for (const interaction of level.interactions) {
    if (!Array.isArray(interaction?.questionRefs) || !interaction.questionRefs.length) return null;
    for (const ref of interaction.questionRefs) references.push({ id: ref?.questionId, revision: ref?.revision });
  }
  return references;
}
export function createGamePublicationReader({ database }) {
  if (!database || typeof database.prepare !== 'function') throw new TypeError('D1 database required');
  async function read(kind) {
    const result = await database.prepare('SELECT entity_id, revision, payload FROM publication_records WHERE kind = ?').bind(kind).all();
    if (!Array.isArray(result?.results)) throw new Error('invalid database response');
    const items = [];
    for (const row of result.results) {
      const item = JSON.parse(row.payload);
      if (!isPublished(kind, item) || row.entity_id !== item.id || row.revision !== item.revision) {
        throw new Error('publication record integrity failure');
      }
      items.push(item);
    }
    return items;
  }
  return {
    async snapshot() {
      const questions = await read('question');
      const levels = await read('level');
      const questionIndex = new Map(questions.map(q => [q.id + '@' + q.revision, q]));
      const visibleLevels = [];
      for (const level of levels) {
        const references = refs(level);
        if (!references || !references.length || references.some(ref => !isId(ref.id) || !isRev(ref.revision) || !questionIndex.has(ref.id + '@' + ref.revision))) continue;
        visibleLevels.push(level);
      }
      return { questions, levels: visibleLevels };
    },
  };
}
export function createGamePublicationHttp({ database }) {
  const reader = createGamePublicationReader({ database });
  return async function fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/api/game/publications') return json(404, { error: 'not_found' });
    try { return json(200, await reader.snapshot()); }
    catch { return json(503, { error: 'publication_data_unavailable' }); }
  };
}
