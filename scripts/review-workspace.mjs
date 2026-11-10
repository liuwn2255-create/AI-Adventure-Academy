import {authenticateReviewer} from './cloudflare-reviewer-auth.mjs';
import {authenticatePublisher} from './cloudflare-access-auth.mjs';
const reply=(status,body)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
export function createReviewWorkspace({reviewer=authenticateReviewer,publisher=authenticatePublisher}={}){
return {async fetch(request,env){
if(request.method!=='GET')return reply(404,{error:'not_found'});
let actor;try{actor=await reviewer(request,env);}catch{}
if(actor?.role!=='reviewer'){try{actor=await publisher(request,env);}catch{actor=null;}}
if(!actor?.id||!['reviewer','publisher'].includes(actor.role))return reply(401,{error:'unauthorized'});
try{
const db=env.PUBLICATION_DB;
const rows=async sql=>(await db.prepare(sql).all()).results;
const approvals=await rows("SELECT kind,entity_id,revision FROM publication_approvals ORDER BY kind,entity_id,revision LIMIT 500");
const published=await rows("SELECT kind,entity_id,revision FROM publication_records ORDER BY kind,entity_id,revision LIMIT 500");
if(actor.role==='publisher')return reply(200,{role:actor.role,approvals,published});
const questions=await rows("SELECT entity_id,revision,version,payload FROM review_candidates ORDER BY entity_id,revision LIMIT 500");
const levels=await rows("SELECT entity_id,revision,version,payload FROM level_review_candidates ORDER BY entity_id,revision LIMIT 500");
const questionAudit=await rows("SELECT entity_id,revision,version,area,action,actor_id,decided_at FROM review_decision_audit ORDER BY audit_id DESC LIMIT 500");
const levelAudit=await rows("SELECT entity_id,revision,version,action,actor_id,decided_at,notes FROM level_review_audit ORDER BY decided_at DESC LIMIT 500");
return reply(200,{role:actor.role,questions,levels,questionAudit,levelAudit,approvals,published});
}catch{return reply(503,{error:'workspace_unavailable'});}
}};
}
export default createReviewWorkspace();
