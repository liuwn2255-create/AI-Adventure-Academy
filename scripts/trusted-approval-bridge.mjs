// SEC-02: privileged, server-side bridge; intentionally no HTTP route.
import { REVIEW_AREAS } from './teacher-review-service.mjs';

const validId = value => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 200;
const validRevision = value => Number.isSafeInteger(value) && value > 0;
const validTimestamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && /(?:Z|[+-]\d\d:\d\d)$/.test(value);

export function createTrustedApprovalBridge({ database, loadReviewedQuestion, authorize, clock = () => new Date() }) {
  if (!database || typeof database.prepare !== 'function' || typeof database.batch !== 'function'
    || typeof loadReviewedQuestion !== 'function' || typeof authorize !== 'function') {
    throw new TypeError('D1 database, trusted review loader and authorization required');
  }
  return {
    async promote({ id, revision }, actor) {
      if (!authorize(actor, 'reviewer') || !validId(actor?.id)) return { ok: false, error: 'forbidden' };
      if (!validId(id) || !validRevision(revision)) return { ok: false, error: 'invalid_request' };
      // Never use client-provided question/review fields.
      let reviewed;
      try { reviewed = await loadReviewedQuestion(id, revision); }
      catch { return { ok: false, error: 'review_store_unavailable' }; }
      if (!reviewed || reviewed.id !== id || reviewed.revision !== revision || reviewed.publicationStatus !== 'approved'
        || !REVIEW_AREAS.every(area => {
          const record = reviewed.review?.[area];
          return record?.status === 'approved' && validId(record.reviewer)
            && typeof record.reviewerRole === 'string' && record.reviewerRole.trim().length > 0
            && validTimestamp(record.reviewedAt);
        })) return { ok: false, error: 'approval_incomplete' };
      const at = clock().toISOString();
      try {
        await database.batch([
          database.prepare('INSERT INTO publication_approvals (kind, entity_id, revision, payload, reviewer_id, approved_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind('question', id, revision, JSON.stringify(reviewed), actor.id, at),
        ]);
      } catch { return { ok: false, error: 'approval_write_conflict' }; }
      return { ok: true, id, revision };
    },
  };
}
