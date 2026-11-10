CREATE TABLE IF NOT EXISTS publication_records (
  kind TEXT NOT NULL CHECK (kind IN ('question','level')),
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  payload TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  published_at TEXT NOT NULL,
  PRIMARY KEY (kind, entity_id, revision)
);
CREATE TABLE IF NOT EXISTS publication_audit (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  kind TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  published_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS publication_revision_monotonic
BEFORE INSERT ON publication_records
WHEN EXISTS (
  SELECT 1 FROM publication_records
  WHERE kind = NEW.kind AND entity_id = NEW.entity_id AND revision >= NEW.revision
)
BEGIN SELECT RAISE(ABORT, 'revision conflict'); END;
CREATE TRIGGER IF NOT EXISTS publication_immutable_update
BEFORE UPDATE ON publication_records
BEGIN SELECT RAISE(ABORT, 'immutable publication'); END;
CREATE TRIGGER IF NOT EXISTS publication_immutable_delete
BEFORE DELETE ON publication_records
BEGIN SELECT RAISE(ABORT, 'immutable publication'); END;
CREATE TRIGGER IF NOT EXISTS publication_audit_immutable_update
BEFORE UPDATE ON publication_audit
BEGIN SELECT RAISE(ABORT, 'immutable audit'); END;
CREATE TRIGGER IF NOT EXISTS publication_audit_immutable_delete
BEFORE DELETE ON publication_audit
BEGIN SELECT RAISE(ABORT, 'immutable audit'); END;
