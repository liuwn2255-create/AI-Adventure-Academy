import { validateQuestionPublication, validateLevelPublication } from './publication-guard.mjs';

const copy = (value) => structuredClone(value);
const keyOf = (item) => `${item.id}@${item.revision}`;
export class PublicationError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * PUB-01 is an isolated, non-production publication service core.
 * Storage and authoritative registry must be supplied by the trusted host.
 * The caller identity is never read from the submitted payload.
 */
export function createPublicationService({ registryBundle, store, authorize, clock = () => new Date(),
  validators = { question: validateQuestionPublication, level: validateLevelPublication } }) {
  if (!registryBundle || !store || typeof authorize !== 'function'
      || typeof store.transact !== 'function' || typeof store.read !== 'function') {
    throw new TypeError('trusted registry, transactional store and authorization are required');
  }
  const trustedRegistry = copy(registryBundle);
  async function publish(kind, payload, principal) {
    if (!authorize(principal, 'publisher')) throw new PublicationError(403, 'forbidden', '發布權限不足');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new PublicationError(400, 'invalid_payload', '發布資料格式錯誤');
    }
    const entity = copy(payload);
    if (typeof entity.id !== 'string' || !entity.id.trim()
        || !Number.isInteger(entity.revision) || entity.revision < 1) {
      throw new PublicationError(400, 'invalid_identity', '必須提供有效的 id 與 revision');
    }
    if (kind === 'question' && entity.publicationStatus !== 'approved') {
      throw new PublicationError(422, 'invalid_status', '題目必須先經核准');
    }
    if (kind === 'level' && entity.status !== 'approved') {
      throw new PublicationError(422, 'invalid_status', '關卡必須先經核准');
    }
    const publishedAt = clock().toISOString();
    return store.transact(async (tx) => {
      const id = keyOf(entity);
      if (tx.has(kind, id)) throw new PublicationError(409, 'duplicate_revision', '該版本已存在，不可覆寫');
      const existing = tx.list(kind);
      if (existing.some((item) => item.id === entity.id && item.revision >= entity.revision)) {
        throw new PublicationError(409, 'revision_conflict', '新發布版本必須高於既有版本');
      }
      let errors;
      if (kind === 'question') {
        errors = validators.question({ question: entity, registryBundle: trustedRegistry });
      } else {
        errors = validators.level({ level: entity, questions: tx.list('question'), registryBundle: trustedRegistry });
      }
      if (errors.length) throw new PublicationError(422, 'publication_rejected', '發布驗證未通過', errors);
      const result = kind === 'question'
        ? { ...entity, publicationStatus: 'published' }
        : { ...entity, status: 'published' };
      tx.put(kind, id, result);
      tx.audit({ event: 'published', kind, id, actorId: principal.id, publishedAt });
      return copy(result);
    });
  }
  return {
    publishQuestion: (question, principal) => publish('question', question, principal),
    publishLevel: (level, principal) => publish('level', level, principal),
    listPublished: (kind) => {
      if (!['question', 'level'].includes(kind)) throw new TypeError('invalid kind');
      return store.read(kind);
    },
  };
}

/** In-memory transactional adapter for tests and local prototypes only. */
export function createMemoryPublicationStore() {
  let state = { question: new Map(), level: new Map(), audit: [] };
  let queue = Promise.resolve();
  return {
    read(kind) { return [...state[kind].values()].map(copy); },
    auditLog() { return copy(state.audit); },
    transact(callback) {
      const run = async () => {
        const draft = {
          question: new Map([...state.question].map(([k, v]) => [k, copy(v)])),
          level: new Map([...state.level].map(([k, v]) => [k, copy(v)])),
          audit: copy(state.audit),
        };
        const tx = {
          has: (kind, key) => draft[kind].has(key),
          list: (kind) => [...draft[kind].values()].map(copy),
          put: (kind, key, item) => draft[kind].set(key, copy(item)),
          audit: (entry) => draft.audit.push(copy(entry)),
        };
        const result = await callback(tx);
        state = draft;
        return result;
      };
      const task = queue.then(run);
      queue = task.catch(() => {});
      return task;
    },
  };
}
