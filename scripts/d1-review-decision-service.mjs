// SEC-04: trusted per-area review decisions, revision lock and audit.
import { REVIEW_AREAS } from './teacher-review-service.mjs';
const validId = v => typeof v === 'string' && v.trim() === v && v.length > 0 && v.length <= 200;
const validRevision = v => Number.isSafeInteger(v) && v > 0;
const validVersion = v => Number.isSafeInteger(v) && v > 0;
const copy = v => structuredClone(v);
export function createD1ReviewDecisionService({ database, authorize, clock = () => new Date() }) {
  if (!database?.prepare || !database?.batch || typeof authorize !== 'function') throw new TypeError('D1 and authorization required');
  return {
    async decide({ id, revision, area, action, notes = '', expectedVersion }, actor) {
      if (!authorize(actor, 'reviewer') || !validId(actor?.id)) return {ok:false,error:'forbidden'};
      if (!validId(id) || !validRevision(revision) || !validVersion(expectedVersion)
        || !REVIEW_AREAS.includes(area) || !['approve','return'].includes(action)
        || typeof notes !== 'string' || notes.length > 2000 || (action === 'return' && !notes.trim())) {
        return {ok:false,error:'invalid_request'};
      }
      // The backend owns the candidate content; the request cannot replace it.
      let row;
      try {
        row = await database.prepare('SELECT version, payload FROM review_candidates WHERE entity_id = ? AND revision = ?')
          .bind(id,revision).first();
      } catch { return {ok:false,error:'review_store_unavailable'}; }
      if (!row) return {ok:false,error:'not_found'};
      if (row.version !== expectedVersion) return {ok:false,error:'version_conflict'};
      let current;
      try { current=JSON.parse(row.payload); } catch { return {ok:false,error:'invalid_stored_candidate'}; }
      if (current.id !== id || current.revision !== revision || current.version !== row.version
        || !['pending_review','returned'].includes(current.publicationStatus)) return {ok:false,error:'invalid_state'};
      const next=copy(current);
      next.review ??= {};
      const at=clock().toISOString();
      next.review[area]={status:action==='approve'?'approved':'returned',reviewer:actor.id,
        reviewerRole:'reviewer',reviewedAt:at,reviewDate:at.slice(0,10),revision:current.revision,unitRevision:current.unitRevision,notes:notes.trim()};
      next.publicationStatus=action==='return'?'returned'
        : REVIEW_AREAS.every(key=>next.review[key]?.status==='approved')?'approved':'pending_review';
      next.version=expectedVersion+1;
      const audit={id,revision,area,action,actorId:actor.id,version:next.version,at};
      // D1 batch executes as a transaction; the guarded UPDATE must change one row.
      // The trigger aborts the batch when the expected version is stale.
      try {
        await database.batch([
          database.prepare('UPDATE review_candidates SET version = ?, payload = ? WHERE entity_id = ? AND revision = ? AND version = ?')
            .bind(next.version,JSON.stringify(next),id,revision,expectedVersion),
          database.prepare('INSERT INTO review_decision_audit (entity_id, revision, area, action, actor_id, version, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(id,revision,area,action,actor.id,next.version,at),
        ]);
      } catch { return {ok:false,error:'version_conflict_or_write_failure'}; }
      return {ok:true,record:next,audit};
    },
  };
}
