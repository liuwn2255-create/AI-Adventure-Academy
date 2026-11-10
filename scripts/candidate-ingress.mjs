// SEC-06: privileged candidate creation. No HTTP endpoint or client-owned audit.
const validId=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=200;
const validRev=x=>Number.isSafeInteger(x)&&x>0;
export function createCandidateIngress({database,authorize}) {
  if(!database?.prepare||!database?.batch||typeof authorize!=='function') throw new TypeError('D1 and authorization required');
  return {
    async seed({id,revision},actor) {
      if(!authorize(actor,'curriculum_editor')||!validId(actor?.id)) return {ok:false,error:'forbidden'};
      if(!validId(id)||!validRev(revision)) return {ok:false,error:'invalid_request'};
      // Only the server-managed content registry can provide the candidate.
      // The caller supplies an identity only; never a prompt, answer, or review.
      let row;
      try {
        row=await database.prepare('SELECT payload FROM candidate_source WHERE entity_id = ? AND revision = ?')
          .bind(id,revision).first();
      } catch {return {ok:false,error:'source_unavailable'};}
      if(!row?.payload) return {ok:false,error:'source_not_found'};
      let source;
      try {source=JSON.parse(row.payload);} catch {return {ok:false,error:'invalid_source'};}
      if(!source||source.id!==id||source.revision!==revision
        ||source.publicationStatus!=='draft'||!validId(source.prompt)
        ||source.review!==undefined||source.publicationRecord!==undefined) return {ok:false,error:'invalid_source'};
      const candidate={...source,publicationStatus:'pending_review',version:1,review:{}};
      try {
        await database.batch([
          database.prepare('INSERT INTO review_candidates (entity_id, revision, version, payload) VALUES (?, ?, ?, ?)')
            .bind(id,revision,1,JSON.stringify(candidate)),
        ]);
      } catch {return {ok:false,error:'candidate_conflict'};}
      return {ok:true,id,revision};
    },
  };
}
