import test from 'node:test';
import assert from 'node:assert/strict';
import { createCandidateIngress } from '../scripts/candidate-ingress.mjs';
import { createD1ReviewDecisionService } from '../scripts/d1-review-decision-service.mjs';
import { createAuditedApprovalBridge } from '../scripts/audited-review-pipeline.mjs';

const source={id:'sec07-q',revision:1,prompt:'Server-owned question',publicationStatus:'draft'};
const editor={id:'editor',role:'curriculum_editor'};
const teacher={id:'teacher',role:'reviewer'};
const authorize=(actor,role)=>actor?.role===role;
const areas=['curriculum','gradeLevelFit','answer','explanation'];

function memoryD1() {
  let candidate=null;
  const audit=[],approvals=[];
  const db={
    get candidate(){return candidate;},audit,approvals,
    prepare(sql) {
      return {bind(...args) {
        return {sql,args,
          async first() {
            if(sql.includes('FROM candidate_source')) return {payload:JSON.stringify(source)};
            if(sql.includes('FROM review_candidates')) return candidate && {version:candidate.version,payload:JSON.stringify(candidate)};
            throw Error('unexpected first: '+sql);
          },
          async all() {
            if(sql.includes('FROM review_decision_audit')) return {results:audit.map(x=>({...x}))};
            throw Error('unexpected all: '+sql);
          },
        };
      }};
    },
    async batch(items) {
      // Transactional simulation: validate all writes before applying any.
      let nextCandidate=candidate;
      const nextAudit=[...audit],nextApprovals=[...approvals];
      for(const {sql,args} of items) {
        if(sql.includes('INSERT INTO review_candidates')) {
          if(nextCandidate) throw Error('duplicate candidate');
          nextCandidate=JSON.parse(args[3]);
        } else if(sql.includes('UPDATE review_candidates')) {
          if(!nextCandidate||nextCandidate.version!==args[4]) throw Error('version conflict');
          nextCandidate=JSON.parse(args[1]);
        } else if(sql.includes('INSERT INTO review_decision_audit')) {
          nextAudit.push({area:args[2],action:args[3],actor_id:args[4],version:args[5],decided_at:args[6]});
        } else if(sql.includes('INSERT INTO publication_approvals')) {
          if(nextApprovals.length) throw Error('duplicate approval');
          nextApprovals.push({payload:args[3],reviewer_id:args[4]});
        } else throw Error('unexpected write: '+sql);
      }
      candidate=nextCandidate;
      audit.splice(0,audit.length,...nextAudit);
      approvals.splice(0,approvals.length,...nextApprovals);
    },
  };
  return db;
}

test('SEC-07: trusted candidate -> four audited decisions -> immutable approval',async()=>{
  const database=memoryD1();
  const ingress=createCandidateIngress({database,authorize});
  const review=createD1ReviewDecisionService({database,authorize,clock:()=>new Date('2026-11-10T01:00:00Z')});
  const bridge=createAuditedApprovalBridge({database,authorize,clock:()=>new Date('2026-11-10T02:00:00Z')});
  assert.equal((await ingress.seed({id:source.id,revision:1,prompt:'attacker-controlled'},editor)).ok,true);
  assert.equal(database.candidate.prompt,source.prompt);
  assert.equal((await bridge.promote({id:source.id,revision:1},teacher)).error,'approval_incomplete');
  assert.equal((await review.decide({id:source.id,revision:1,area:'answer',action:'approve',expectedVersion:1},{id:'intruder',role:'publisher'})).error,'forbidden');
  for(let i=0;i<areas.length;i++) {
    const result=await review.decide({id:source.id,revision:1,area:areas[i],action:'approve',expectedVersion:i+1},teacher);
    assert.equal(result.ok,true);
    if(i<areas.length-1) assert.equal((await bridge.promote({id:source.id,revision:1},teacher)).error,'approval_incomplete');
  }
  assert.equal(database.candidate.publicationStatus,'approved');
  assert.equal(database.audit.length,4);
  assert.equal((await bridge.promote({id:source.id,revision:1},{id:'other',role:'publisher'})).error,'forbidden');
  assert.equal(database.approvals.length,0);
  assert.equal((await bridge.promote({id:source.id,revision:1},teacher)).ok,true);
  assert.equal(database.approvals.length,1);
  assert.equal(JSON.parse(database.approvals[0].payload).prompt,source.prompt);
  assert.equal((await bridge.promote({id:source.id,revision:1},teacher)).error,'approval_write_conflict');
});

test('SEC-07: stale review version and altered audit fail closed',async()=>{
  const database=memoryD1();
  const ingress=createCandidateIngress({database,authorize});
  const review=createD1ReviewDecisionService({database,authorize,clock:()=>new Date('2026-11-10T01:00:00Z')});
  const bridge=createAuditedApprovalBridge({database,authorize});
  await ingress.seed({id:source.id,revision:1},editor);
  assert.equal((await review.decide({id:source.id,revision:1,area:'answer',action:'approve',expectedVersion:2},teacher)).error,'version_conflict');
  assert.equal(database.audit.length,0);
  for(let i=0;i<areas.length;i++) assert.equal((await review.decide({id:source.id,revision:1,area:areas[i],action:'approve',expectedVersion:i+1},teacher)).ok,true);
  database.audit[0].actor_id='forged';
  assert.equal((await bridge.promote({id:source.id,revision:1},teacher)).error,'approval_incomplete');
  assert.equal(database.approvals.length,0);
});
