import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
for p in ['migrations/0001_publication.sql','migrations/0002_publication_approvals.sql','migrations/0003_reviewed_questions.sql']:
    db.executescript(Path(p).read_text(encoding='utf-8'))
db.execute("INSERT INTO reviewed_questions VALUES (?,?,?,?,?)",('q',1,'{}','teacher','2026-11-10T00:00:00Z'))
for sql in ["UPDATE reviewed_questions SET payload='fake' WHERE entity_id='q'","DELETE FROM reviewed_questions WHERE entity_id='q'","INSERT INTO reviewed_questions VALUES ('q',1,'{}','other','2026-11-10T00:00:00Z')"]:
    try: db.execute(sql)
    except sqlite3.IntegrityError: pass
    else: raise AssertionError('immutable or unique constraint missing')
print('SEC-03 SQLite schema checks PASS (not real Cloudflare D1)')
