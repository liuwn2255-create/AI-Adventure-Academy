-- SEC-06: trusted, immutable candidate source, populated only by a privileged importer.
CREATE TABLE IF NOT EXISTS candidate_source (
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  payload TEXT NOT NULL,
  PRIMARY KEY (entity_id,revision)
);
CREATE TRIGGER IF NOT EXISTS candidate_source_no_update
BEFORE UPDATE ON candidate_source BEGIN SELECT RAISE(ABORT,'immutable candidate source'); END;
CREATE TRIGGER IF NOT EXISTS candidate_source_no_delete
BEFORE DELETE ON candidate_source BEGIN SELECT RAISE(ABORT,'immutable candidate source'); END;
