-- SEC-04: server-seeded candidate revisions and immutable decision audit.
CREATE TABLE IF NOT EXISTS review_candidates (
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  version INTEGER NOT NULL CHECK (version > 0),
  payload TEXT NOT NULL,
  PRIMARY KEY (entity_id, revision)
);
CREATE TABLE IF NOT EXISTS review_decision_audit (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('curriculum','gradeLevelFit','answer','explanation')),
  action TEXT NOT NULL CHECK (action IN ('approve','return')),
  actor_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  decided_at TEXT NOT NULL,
  UNIQUE (entity_id,revision,version)
);
CREATE TRIGGER IF NOT EXISTS review_candidates_no_delete
BEFORE DELETE ON review_candidates BEGIN SELECT RAISE(ABORT,'candidate deletion forbidden'); END;
CREATE TRIGGER IF NOT EXISTS review_candidates_revision_lock
BEFORE UPDATE ON review_candidates
WHEN NEW.entity_id != OLD.entity_id OR NEW.revision != OLD.revision OR NEW.version != OLD.version + 1
BEGIN SELECT RAISE(ABORT,'candidate revision/version lock'); END;
CREATE TRIGGER IF NOT EXISTS review_candidates_stale_update
BEFORE INSERT ON review_decision_audit
WHEN NOT EXISTS (
 SELECT 1 FROM review_candidates
 WHERE entity_id = NEW.entity_id AND revision = NEW.revision AND version = NEW.version
)
BEGIN SELECT RAISE(ABORT,'stale review decision'); END;
CREATE TRIGGER IF NOT EXISTS review_audit_no_update
BEFORE UPDATE ON review_decision_audit BEGIN SELECT RAISE(ABORT,'immutable audit'); END;
CREATE TRIGGER IF NOT EXISTS review_audit_no_delete
BEFORE DELETE ON review_decision_audit BEGIN SELECT RAISE(ABORT,'immutable audit'); END;
