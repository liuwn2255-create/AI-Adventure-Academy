// SEC-03: D1-backed immutable approved review snapshots, server-side only.
import { REVIEW_AREAS } from './teacher-review-service.mjs';
const idOk = v => typeof v === 'string' && v.trim() === v && v.length > 0 && v.length <= 200;
const revOk = v => Number.isSafeInteger(v) && v > 0;
const timeOk = v => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && /(?:Z|[+-]\d\d:\d\d)$/.test(v);
function isApproved(question) {
  return question && idOk(question.id) && revOk(question.revision)
    && question.publicationStatus === 'approved'
    && REVIEW_AREAS.every(area => {
      const review = question.review?.[area];
      return review?.status === 'approved' && idOk(review.reviewer)
        && review.reviewerRole === 'reviewer' && timeOk(review.reviewedAt);
    });
}
export function createD1ReviewedQuestionStore({ database, authorize, clock = () => new Date() }) {
  if (!database?.prepare || !database?.batch || typeof authorize !== 'function') throw new TypeError('D1 and authorization required');
  return {
    async saveApproved(question, actor) {
      // SEC-06: legacy direct-approved snapshot path is permanently disabled.
      // Use the audited SEC-04/05 decision chain instead.
      return {ok:false,error:'direct_approval_disabled'};
    },
    async loadReviewedQuestion(id,revision) {
      if (!idOk(id) || !revOk(revision)) return null;
      const row=await database.prepare('SELECT payload FROM reviewed_questions WHERE entity_id = ? AND revision = ?')
        .bind(id,revision).first();
      if (!row?.payload) return null;
      const question=JSON.parse(row.payload);
      return isApproved(question) && question.id === id && question.revision === revision ? question : null;
    },
  };
}
