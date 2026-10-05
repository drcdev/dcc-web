// SQL for the questions cache, in one place so the query-plan test checks the exact statements.
// Every statement uses the (slug, content_hash) primary key.

export const GET_SET_SQL = "SELECT questions FROM question_sets WHERE slug = ? AND content_hash = ?";

export const INSERT_SET_SQL =
  "INSERT OR IGNORE INTO question_sets (slug, content_hash, questions, model, created_at) VALUES (?, ?, ?, ?, ?)";

/** Keeps at most one row per slug: removes the slug's sets for every other hash. */
export const DELETE_OTHER_HASHES_SQL = "DELETE FROM question_sets WHERE slug = ? AND content_hash <> ?";
