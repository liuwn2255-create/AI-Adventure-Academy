import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
for name in ('0001_publication.sql','0002_publication_approvals.sql','0003_reviewed_questions.sql','0004_review_decisions.sql'):
 db.executescript(Path('migrations',name).read_text(encoding='utf-8'))
db.execute("INSERT INTO review_candidates VALUES ('q',3,1,'{}')")
def blocked(sql):
 try: db.execute(sql)
 except sqlite3.IntegrityError: return
 raise AssertionError('expected blocked: '+sql)
blocked("INSERT INTO review_decision_audit (entity_id,revision,area,action,actor_id,version,decided_at) VALUES ('q',3,'answer','approve','teacher',2,'2026-11-10T00:00:00Z')")
blocked("UPDATE review_candidates SET version=3 WHERE entity_id='q'")
db.execute("UPDATE review_candidates SET version=2 WHERE entity_id='q'")
db.execute("INSERT INTO review_decision_audit (entity_id,revision,area,action,actor_id,version,decided_at) VALUES ('q',3,'answer','approve','teacher',2,'2026-11-10T00:00:00Z')")
blocked("UPDATE review_decision_audit SET actor_id='attacker' WHERE entity_id='q'")
blocked("DELETE FROM review_decision_audit WHERE entity_id='q'")
blocked("DELETE FROM review_candidates WHERE entity_id='q'")
print('SEC-04 SQLite constraints PASS; no Cloudflare D1 involved')
