import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
for name in ['0001_publication.sql','0002_publication_approvals.sql','0003_reviewed_questions.sql','0004_review_decisions.sql','0005_candidate_source.sql']:
 db.executescript(Path('migrations',name).read_text(encoding='utf-8'))
db.execute("INSERT INTO candidate_source VALUES ('q',1,'{}')")
for sql in ["UPDATE candidate_source SET payload='fake' WHERE entity_id='q'","DELETE FROM candidate_source WHERE entity_id='q'","INSERT INTO candidate_source VALUES ('q',1,'{}')"]:
 try: db.execute(sql)
 except sqlite3.IntegrityError: pass
 else: raise AssertionError('source immutability failed')
print('SEC-06 SQLite schema PASS; no Cloudflare D1 involved')
