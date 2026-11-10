// SEC-09: authenticated teacher review HTTP boundary; no public candidate seeding.
import { authenticateReviewer } from './cloudflare-reviewer-auth.mjs';
import { createD1ReviewDecisionService } from './d1-review-decision-service.mjs';
import { createAuditedApprovalBridge } from './audited-review-pipeline.mjs';

const respond=(status,body)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const validId=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=200;
const validRev=x=>Number.isSafeInteger(x)&&x>0;
const authorize=(actor,role)=>actor?.role===role&&validId(actor?.id);
const errors={forbidden:403,invalid_request:400,not_found:404,version_conflict:409,
  invalid_state:409,approval_incomplete:422,approval_write_conflict:409,
  review_store_unavailable:503,invalid_stored_candidate:503,version_conflict_or_write_failure:409};
const statusFor=result=>result.ok?200:(errors[result.error]??503);

export function createCloudflareReviewWorker({
  authenticate=authenticateReviewer,
  makeDecision=createD1ReviewDecisionService,
  makeApproval=createAuditedApprovalBridge,
}={}) {
  return {
    async fetch(request,env) {
      const path=new URL(request.url).pathname;
      const isDecision=path==='/api/review/decisions';
      const isApproval=path==='/api/review/approvals';
      if(request.method!=='POST'||(!isDecision&&!isApproval)) return respond(404,{error:'not_found'});
      if(!env?.PUBLICATION_DB?.prepare||!env.PUBLICATION_DB?.batch) return respond(503,{error:'database_unavailable'});
      let actor;
      try {actor=await authenticate(request,env);} catch {return respond(401,{error:'unauthorized'});}
      if(!authorize(actor,'reviewer')) return respond(401,{error:'unauthorized'});
      if(Number(request.headers.get('content-length')||0)>1048576) return respond(413,{error:'too_large'});
      let payload;
      try {
        const raw=await request.text();
        if(new TextEncoder().encode(raw).length>1048576) return respond(413,{error:'too_large'});
        payload=JSON.parse(raw);
      } catch {return respond(400,{error:'invalid_json'});}
      if(!payload||typeof payload!=='object'||Array.isArray(payload)
        ||!validId(payload.id)||!validRev(payload.revision)) return respond(400,{error:'invalid_request'});
      // Strict request shape: clients cannot submit review snapshots or audit metadata.
      const allowed=isDecision?['id','revision','area','action','notes','expectedVersion']:['id','revision'];
      if(Object.keys(payload).some(key=>!allowed.includes(key))) return respond(400,{error:'invalid_request'});
      try {
        const service=isDecision?makeDecision({database:env.PUBLICATION_DB,authorize})
          :makeApproval({database:env.PUBLICATION_DB,authorize});
        const result=isDecision?await service.decide(payload,actor):await service.promote(payload,actor);
        // Never expose server-controlled candidate payload or audit internals via this endpoint.
        return respond(statusFor(result),result.ok?{ok:true,id:payload.id,revision:payload.revision}
          :{error:result.error});
      } catch {return respond(503,{error:'review_unavailable'});}
    },
  };
}
export default createCloudflareReviewWorker();
