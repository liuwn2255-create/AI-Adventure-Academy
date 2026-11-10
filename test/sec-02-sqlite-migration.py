import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
for path in ('migrations/0001_publication.sql','migrations/0002_publication_approvals.sql'):
    db.executescript(Path(path).read_text(encoding='utf-8'))
db.execute("INSERT INTO publication_approvals VALUES (?,?,?,?,?,?)",('question','q1',2,'{"id":"q1"}','teacher','2026-11-10T00:00:00Z'))
def blocked(statement, params):
    try:
        db.execute(statement,params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError('expected immutable/unique trigger to block operation')
blocked('UPDATE publication_approvals SET reviewer_id=? WHERE entity_id=?',('fake','q1'))
blocked('DELETE FROM publication_approvals WHERE entity_id=?',('q1',))
blocked('INSERT INTO publication_approvals VALUES (?,?,?,?,?,?)',('question','q1',2,'{}','fake','2026-11-10T00:00:00Z'))
print('SQLite migration/immutability checks PASS (not Cloudflare D1)')
