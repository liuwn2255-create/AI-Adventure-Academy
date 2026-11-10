-- SEC-03: immutable teacher-reviewed source snapshots.
-- Must only be written by an authenticated, privileged backend.
CREATE TABLE IF NOT EXISTS reviewed_questions (
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  payload TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  PRIMARY KEY (entity_id, revision)
);
CREATE TRIGGER IF NOT EXISTS reviewed_questions_no_update
BEFORE UPDATE ON reviewed_questions BEGIN SELECT RAISE(ABORT,'immutable review'); END;
CREATE TRIGGER IF NOT EXISTS reviewed_questions_no_delete
BEFORE DELETE ON reviewed_questions BEGIN SELECT RAISE(ABORT,'immutable review'); END;
