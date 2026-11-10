export const REVIEW_AREAS = Object.freeze(['curriculum', 'gradeLevelFit', 'answer', 'explanation']);
const ACTIONS = new Set(['approve', 'return']);
const copy = (value) => structuredClone(value);
const valid = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
export function createTeacherReviewService({ store, authorize, clock = () => new Date() }) {
  if (!store || typeof store.transact !== 'function' || typeof store.read !== 'function' || typeof authorize !== 'function') {
    throw new TypeError('transactional store and trusted authorization required');
  }
  return {
    async get(id, actor) {
      if (!valid(id) || !authorize(actor, 'reviewer')) return { ok: false, error: 'forbidden' };
      const record = await store.read(id);
      return record ? { ok: true, record: copy(record) } : { ok: false, error: 'not_found' };
    },
    async decide({ id, area, action, notes, expectedVersion }, actor) {
      if (!authorize(actor, 'reviewer') || !valid(actor?.id)) return { ok: false, error: 'forbidden' };
      if (!valid(id) || !REVIEW_AREAS.includes(area) || !ACTIONS.has(action)
        || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1
        || (action === 'return' && !valid(notes)) || (notes !== undefined && typeof notes !== 'string')) {
        return { ok: false, error: 'invalid_request' };
      }
      return store.transact(async (tx) => {
        const current = await tx.get(id);
        if (!current) return { ok: false, error: 'not_found' };
        if (current.version !== expectedVersion) return { ok: false, error: 'version_conflict' };
        if (!['pending_review', 'returned'].includes(current.publicationStatus)) return { ok: false, error: 'invalid_state' };
        const next = copy(current);
        next.review ??= {};
        next.review[area] = {
          status: action === 'approve' ? 'approved' : 'returned',
          reviewer: actor.id,
          reviewerRole: actor.role,
          reviewedAt: clock().toISOString(),
          notes: notes?.trim() || '',
        };
        next.publicationStatus = action === 'return' ? 'returned'
          : REVIEW_AREAS.every((key) => next.review[key]?.status === 'approved') ? 'approved' : 'pending_review';
        next.version += 1;
        await tx.put(id, next);
        await tx.audit({ event: action, id, area, actorId: actor.id, version: next.version, at: clock().toISOString() });
        return { ok: true, record: copy(next) };
      });
    },
  };
}
export function createMemoryTeacherReviewStore(initial = []) {
  const records = new Map(initial.map((x) => [x.id, copy(x)]));
  const audits = [];
  let queue = Promise.resolve();
  return {
    async read(id) { return copy(records.get(id) ?? null); },
    getAudits() { return copy(audits); },
    transact(fn) {
      const operation = queue.then(async () => {
        const working = new Map([...records].map(([key, value]) => [key, copy(value)]));
        const events = [];
        const result = await fn({
          get: async (id) => copy(working.get(id) ?? null),
          put: async (id, value) => working.set(id, copy(value)),
          audit: async (event) => events.push(copy(event)),
        });
        if (result.ok) {
          records.clear();
          for (const [key, value] of working) records.set(key, value);
          audits.push(...events);
        }
        return result;
      });
      queue = operation.then(() => {}, () => {});
      return operation;
    },
  };
}
