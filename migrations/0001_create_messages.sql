-- One accepted contact submission. Nothing else is stored (data-model.md).
CREATE TABLE messages (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  email        TEXT    NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  organization TEXT             CHECK (organization IS NULL OR length(organization) BETWEEN 1 AND 100),
  project      TEXT             CHECK (project IS NULL OR length(project) BETWEEN 1 AND 100),
  message      TEXT    NOT NULL CHECK (length(message) BETWEEN 1 AND 5000),
  ip_hash      TEXT             CHECK (ip_hash IS NULL OR length(ip_hash) = 64),
  status       TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
  received_at  INTEGER NOT NULL
);

-- Rate-limit lookups.
CREATE INDEX idx_messages_ip_received ON messages (ip_hash, received_at);
-- List new messages, oldest first, with cursor paging.
CREATE INDEX idx_messages_status_received ON messages (status, received_at, id);
-- Retention cleanup and fingerprint clearing.
CREATE INDEX idx_messages_received ON messages (received_at);
