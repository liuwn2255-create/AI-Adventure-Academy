// Test-only entrypoint. Never deploy or expose outside localhost.
import {createCandidateIngress} from '../scripts/candidate-ingress.mjs';
import {createCloudflareReviewWorker} from '../scripts/cloudflare-review-worker.mjs';
import {createCloudflarePublicationWorker} from '../scripts/cloudflare-publication-worker.mjs';
import {createCloudflareIntegratedWorker} from '../scripts/cloudflare-integrated-worker.mjs';
import {createGamePublicationHttp} from '../scripts/game-publication-reader.mjs';
import {createLevelReviewService} from '../scripts/level-review-service.mjs';
const check=(ok,label)=>{if(!ok)throw Error(label);};
export default {async fetch(request,env){
  try {
    if(request.method!=='POST')return new Response('ready');
    const {bundle,question}=await request.json();
    const db=env.PUBLICATION_DB;
    const e={...env,REGISTRY_BUNDLE_JSON:JSON.stringify(bundle)};
    const editor={id:'sec12-editor',role:'curriculum_editor'},teacher={id:'sec12-teacher',role:'reviewer'},publisher={id:'sec12-publisher',role:'publisher'};
    const ingress=createCandidateIngress({database:db,authorize:(a,r)=>a?.role===r});
    const app=actor=>createCloudflareIntegratedWorker({reviewWorker:createCloudflareReviewWorker({authenticate:async()=>actor}),publicationWorker:createCloudflarePublicationWorker({authenticate:async()=>actor})});
    const post=async(actor,path,body,status)=>{
      const r=await app(actor).fetch(new Request('https://local.test'+path,{method:'POST',body:JSON.stringify(body)}),e);
      const data=await r.json();check(r.status===status,path+' expected '+status+' got '+r.status+' '+JSON.stringify(data));return data;
    };
    const id=question.id,revision=question.revision,key={id,revision};
    const source={...question,publicationStatus:'draft'};delete source.review;delete source.publicationRecord;
    await db.prepare('INSERT INTO candidate_source (entity_id,revision,payload) VALUES (?,?,?)').bind(id,revision,JSON.stringify(source)).run();
    check(!(await ingress.seed(key,publisher)).ok,'unauthorized ingress');
    check((await ingress.seed({...key,prompt:'forged'},editor)).ok,'seed');
    const decision='/api/review/decisions',approval='/api/review/approvals',publish='/api/questions/publish';
    await post(teacher,approval,key,422);
    await post(publisher,decision,{...key,area:'answer',action:'approve',expectedVersion:1},401);
    await post(teacher,decision,{...key,area:'answer',action:'approve',expectedVersion:2},409);
    for(const [i,area] of ['curriculum','gradeLevelFit','answer','explanation'].entries()){
      await post(teacher,decision,{...key,area,action:'approve',expectedVersion:i+1,notes:'Synthetic fixture; no textbook claim'},200);
    }
    const audit=await db.prepare('SELECT * FROM review_decision_audit WHERE entity_id=?').bind(id).all();
    check(audit.results.length===4,'four audit rows');
    let blocked=false;try{await db.prepare('UPDATE review_decision_audit SET actor_id=? WHERE entity_id=?').bind('forged',id).run();}catch{blocked=true;}check(blocked,'audit immutable');
    await post(teacher,approval,key,200);await post(teacher,approval,key,409);
    await post(teacher,publish,{...key,publicationStatus:'approved'},401);
    const result=await post(publisher,publish,{...key,publicationStatus:'approved',prompt:'forged'},201);
    check(result.result.prompt===source.prompt,'trusted content');check(result.result.publicationRecord.publisher===publisher.id,'trusted publisher');
    await post(publisher,publish,{...key,publicationStatus:'approved'},409);
    const level={id:'sec13-level',revision:1,status:'draft',interactions:[{questionRefs:[{questionId:id,revision}]}]};
    const lk={id:level.id,revision:1};
    const svc=createLevelReviewService({database:db,authorize:(a,r)=>a?.role===r,registryBundle:bundle});
    await db.prepare('INSERT INTO level_candidate_source (entity_id,revision,payload) VALUES (?,?,?)').bind(level.id,1,JSON.stringify(level)).run();
    check(!(await svc.seed(lk,publisher)).ok,'level ingress denied');
    check((await svc.seed({...lk,status:'approved'},editor)).ok,'level seed');
    check(!(await svc.seed(lk,editor)).ok,'duplicate seed');
    const route='/api/review/levels/decisions';
    await post(publisher,'/api/levels/publish',{...lk,status:'approved'},422);
    await post(publisher,route,{...lk,action:'approve',expectedVersion:1},401);
    await post(teacher,route,{...lk,action:'approve',expectedVersion:2},409);
    await post(teacher,route,{...lk,action:'return',expectedVersion:1,notes:'review again'},200);
    await post(teacher,route,{...lk,action:'approve',expectedVersion:2},200);
    await post(teacher,route,{...lk,action:'approve',expectedVersion:3},409);
    const la=await db.prepare('SELECT * FROM level_review_audit WHERE entity_id=?').bind(level.id).all();
    check(la.results.length===2,'level audit count');
    let locked=false;try{await db.prepare('UPDATE level_review_audit SET actor_id=? WHERE entity_id=?').bind('forged',level.id).run();}catch{locked=true;}check(locked,'level audit immutable');
    let forged=false;try{await db.prepare('INSERT INTO publication_approvals (kind,entity_id,revision,payload,reviewer_id,approved_at) VALUES (?,?,?,?,?,?)').bind('level','forged',1,JSON.stringify({...level,id:'forged',status:'approved'}),teacher.id,new Date().toISOString()).run();}catch{forged=true;}check(forged,'direct approval rejected');
    await post(publisher,'/api/levels/publish',{id:level.id,revision:1,status:'approved'},201);
    const response=await createGamePublicationHttp({database:db})(new Request('https://local.test/api/game/publications'));
    const snapshot=await response.json();check(response.status===200&&snapshot.questions.length===1&&snapshot.levels.length===1,'game snapshot');
    const records=await db.prepare('SELECT COUNT(*) AS n FROM publication_audit').first();check(records.n===2,'two publication audits');
    return Response.json({ok:true,checks:'question and level trusted review chains, immutable audits, approval, publication, game read, denial and duplicate'});
  }catch(error){return Response.json({ok:false,error:String(error)},{status:500});}
}};
