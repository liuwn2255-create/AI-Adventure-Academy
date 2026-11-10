// SEC-05: load only server-owned, version-locked review decisions.
import { REVIEW_AREAS } from './teacher-review-service.mjs';
import { createTrustedApprovalBridge } from './trusted-approval-bridge.mjs';
const validId=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=200;
const validRev=x=>Number.isSafeInteger(x)&&x>0;
export function createAuditedReviewSource({database}) {
  if(!database?.prepare) throw new TypeError('D1 required');
  return async function loadReviewedQuestion(id,revision) {
    if(!validId(id)||!validRev(revision)) return null;
    const row=await database.prepare('SELECT version, payload FROM review_candidates WHERE entity_id = ? AND revision = ?')
      .bind(id,revision).first();
    if(!row?.payload||!validRev(row.version)) return null;
    const question=JSON.parse(row.payload);
    if(question?.id!==id||question.revision!==revision||question.version!==row.version
      ||question.publicationStatus!=='approved') return null;
    const result=await database.prepare('SELECT area, action, actor_id, version, decided_at FROM review_decision_audit WHERE entity_id = ? AND revision = ?')
      .bind(id,revision).all();
    if(!Array.isArray(result?.results)) return null;
    const audits=result.results;
    if(audits.length!==row.version-1) return null;
    const versions=new Set();
    for(const audit of audits) {
      if(!validRev(audit.version)||audit.version<=1||audit.version>row.version
        ||versions.has(audit.version)||!REVIEW_AREAS.includes(audit.area)
        ||!['approve','return'].includes(audit.action)||!validId(audit.actor_id)
        ||typeof audit.decided_at!=='string') return null;
      versions.add(audit.version);
    }
    for(let v=2;v<=row.version;v++) if(!versions.has(v)) return null;
    for(const area of REVIEW_AREAS) {
      const matching=audits.filter(x=>x.area===area).sort((a,b)=>b.version-a.version);
      const last=matching[0], review=question.review?.[area];
      if(!last||last.action!=='approve'||review?.status!=='approved'
        ||review.reviewer!==last.actor_id||review.reviewedAt!==last.decided_at) return null;
    }
    return question;
  };
}
export function createAuditedApprovalBridge({database,authorize,clock}) {
  return createTrustedApprovalBridge({
    database,authorize,clock,
    loadReviewedQuestion:createAuditedReviewSource({database}),
  });
}
