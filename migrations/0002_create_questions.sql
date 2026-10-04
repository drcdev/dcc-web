-- Critical thinking questions (specs/022-critical-thinking-questions/data-model.md).
-- Additive: two new tables, no change to `messages`. The CHECK bounds on `questions` mirror
-- QUESTIONS_MIN and QUESTIONS_MAX in worker/src/questions/config.ts.

-- One cached question set per post version; at most one row per slug (the Worker deletes the
-- slug's other hashes when it inserts a set for a new hash).
CREATE TABLE question_sets (
  slug TEXT NOT NULL CHECK (length(slug) BETWEEN 1 AND 200),
  content_hash TEXT NOT NULL CHECK (length(content_hash) = 64),
  questions TEXT NOT NULL CHECK (json_valid(questions) AND json_array_length(questions) BETWEEN 2 AND 4),
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (slug, content_hash)
) WITHOUT ROWID;

-- The site-wide token bucket for this environment: exactly one row. The seed row (0 tokens,
-- last updated at 0) refills to full capacity on the first take.
CREATE TABLE usage_bucket (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tokens REAL NOT NULL CHECK (tokens >= 0),
  updated_at INTEGER NOT NULL
);

INSERT INTO usage_bucket VALUES (1, 0, 0);
