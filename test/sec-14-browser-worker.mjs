// Local test harness only; never deploy. Test identities are injected here only.
import {createCloudflareIntegratedWorker} from '../scripts/cloudflare-integrated-worker.mjs';
import {createCloudflareReviewWorker} from '../scripts/cloudflare-review-worker.mjs';
import {createCloudflarePublicationWorker} from '../scripts/cloudflare-publication-worker.mjs';
import {createReviewWorkspace} from '../scripts/review-workspace.mjs';
import {createCandidateIngress} from '../scripts/candidate-ingress.mjs';
import {createLevelReviewService} from '../scripts/level-review-service.mjs';
let bundle;
export default {async fetch(request,env){
const url=new URL(request.url);
if(url.pathname==='/__fixture'&&request.method==='POST'){
const f=await request.json();bundle=f.bundle;const q={...f.question,publicationStatus:'draft'};delete q.review;delete q.publicationRecord;
await env.PUBLICATION_DB.prepare('INSERT INTO candidate_source (entity_id,revision,payload) VALUES (?,?,?)').bind(q.id,q.revision,JSON.stringify(q)).run();
const result=await createCandidateIngress({database:env.PUBLICATION_DB,authorize:(a,r)=>a.role===r}).seed({id:q.id,revision:q.revision},{id:'editor',role:'curriculum_editor'});
return Response.json(result);
}
if(url.pathname==='/__level_fixture'&&request.method==='POST'){
const level=await request.json();await env.PUBLICATION_DB.prepare('INSERT INTO level_candidate_source (entity_id,revision,payload) VALUES (?,?,?)').bind(level.id,level.revision,JSON.stringify(level)).run();
return Response.json(await createLevelReviewService({database:env.PUBLICATION_DB,authorize:(a,r)=>a.role===r,registryBundle:bundle}).seed({id:level.id,revision:level.revision},{id:'editor',role:'curriculum_editor'}));
}
if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
const role=request.headers.get('x-test-role');const actor={id:'browser-test-'+role,role};
const auth=async()=>actor;
return createCloudflareIntegratedWorker({workspace:createReviewWorkspace({reviewer:auth,publisher:auth}),reviewWorker:createCloudflareReviewWorker({authenticate:auth}),publicationWorker:createCloudflarePublicationWorker({authenticate:auth})}).fetch(request,{...env,REGISTRY_BUNDLE_JSON:JSON.stringify(bundle)});
}};
