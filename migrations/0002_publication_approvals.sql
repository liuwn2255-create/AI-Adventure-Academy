-- SEC-01: approved snapshots are written only by a future authenticated teacher-review workflow.
-- No client publication request may create or update an approval.
CREATE TABLE IF NOT EXISTS publication_approvals (
  kind TEXT NOT NULL CHECK (kind IN ('question', 'level')),
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  payload TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  PRIMARY KEY (kind, entity_id, revision)
);
CREATE TRIGGER IF NOT EXISTS publication_approval_immutable_update
BEFORE UPDATE ON publication_approvals
BEGIN SELECT RAISE(ABORT, 'immutable approval'); END;
CREATE TRIGGER IF NOT EXISTS publication_approval_immutable_delete
BEFORE DELETE ON publication_approvals
BEGIN SELECT RAISE(ABORT, 'immutable approval'); END;
