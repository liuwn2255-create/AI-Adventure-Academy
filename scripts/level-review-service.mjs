import {validateLevelPublication} from './publication-guard.mjs';
const idOk=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=200;
const revOk=x=>Number.isSafeInteger(x)&&x>0;
const err=error=>({ok:false,error});
export function createLevelReviewService({database:db,authorize,registryBundle,clock=()=>new Date()}){
 const valid=(id,revision)=>idOk(id)&&revOk(revision);
 const authorized=(actor,role)=>idOk(actor?.id)&&authorize(actor,role);
 async function validate(level){
  const rows=await db.prepare("SELECT payload FROM publication_records WHERE kind = ?").bind('question').all();
  return validateLevelPublication({level:{...level,status:'approved'},questions:rows.results.map(r=>JSON.parse(r.payload)),registryBundle});
 }
 return {
 async seed({id,revision},actor){
  if(!authorized(actor,'curriculum_editor'))return err('forbidden');
  if(!valid(id,revision))return err('invalid_request');
  try{
   const row=await db.prepare('SELECT payload FROM level_candidate_source WHERE entity_id=? AND revision=?').bind(id,revision).first();
   if(!row)return err('not_found');
   const source=JSON.parse(row.payload);
   if(source?.id!==id||source.revision!==revision||source.status!=='draft'||source.review!==undefined||source.version!==undefined||source.publicationRecord!==undefined)return err('invalid_source');
   if((await validate(source)).length)return err('invalid_source');
   const candidate={...source,status:'pending_review',version:1};
   await db.prepare('INSERT INTO level_review_candidates (entity_id,revision,version,payload) VALUES (?,?,?,?)').bind(id,revision,1,JSON.stringify(candidate)).run();
   return {ok:true,id,revision};
  }catch{return err('candidate_conflict');}
 },
 async decide({id,revision,expectedVersion,action,notes=''},actor){
  if(!authorized(actor,'reviewer'))return err('forbidden');
  if(!valid(id,revision)||!revOk(expectedVersion)||!['approve','return'].includes(action)||typeof notes!=='string'||notes.length>2000||(action==='return'&&!notes.trim()))return err('invalid_request');
  try{
   const row=await db.prepare('SELECT version,payload FROM level_review_candidates WHERE entity_id=? AND revision=?').bind(id,revision).first();
   if(!row)return err('not_found');
   if(row.version!==expectedVersion)return err('version_conflict');
   const current=JSON.parse(row.payload);
   if(current.id!==id||current.revision!==revision||current.version!==row.version||!['pending_review','returned'].includes(current.status))return err('invalid_state');
   if(action==='approve'&&(await validate(current)).length)return err('invalid_source');
   const at=clock().toISOString(),version=expectedVersion+1;
   const next={...current,status:action==='approve'?'approved':'returned',version,review:{reviewer:actor.id,reviewedAt:at,revision,notes:notes.trim()}};
   const payload=JSON.stringify(next);
   const statements=[db.prepare('UPDATE level_review_candidates SET version=?,payload=? WHERE entity_id=? AND revision=? AND version=?').bind(version,payload,id,revision,expectedVersion),db.prepare('INSERT INTO level_review_audit (entity_id,revision,version,action,actor_id,decided_at,notes) VALUES (?,?,?,?,?,?,?)').bind(id,revision,version,action,actor.id,at,notes.trim())];
   if(action==='approve')statements.push(db.prepare('INSERT INTO publication_approvals (kind,entity_id,revision,payload,reviewer_id,approved_at) VALUES (?,?,?,?,?,?)').bind('level',id,revision,payload,actor.id,at));
   await db.batch(statements);
   return {ok:true,id,revision,version};
  }catch{return err('version_conflict_or_write_failure');}
 }
 };
}
