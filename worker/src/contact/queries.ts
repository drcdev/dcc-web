// SQL for the submit path, in one place so the query-plan test checks the exact statements.

export const DUPLICATE_CHECK_SQL = "SELECT 1 FROM messages WHERE id = ?";

export const INSERT_MESSAGE_SQL =
  "INSERT INTO messages (id, name, email, organization, project, message, ip_hash, status, received_at) " +
  "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'new', ?8) ON CONFLICT(id) DO NOTHING";

// Rate limit (R7): one indexed read over the sender's rows in the last 24 hours.
// ?1 ip_hash, ?2 start of the hour window, ?3 start of the day window. NULL hashes never match.
export const RATE_LIMIT_SQL =
  "SELECT COUNT(*) AS day, COALESCE(SUM(received_at >= ?2), 0) AS hour, " +
  "MIN(received_at) AS oldest_day, MIN(CASE WHEN received_at >= ?2 THEN received_at END) AS oldest_hour " +
  "FROM messages WHERE ip_hash = ?1 AND received_at >= ?3";

// Retention cron (FR-015, FR-018). Both statements are served by idx_messages_received.
// Expired rows go in batches of 500 by id so a run stays inside D1's per-query limits.
export const DELETE_BATCH = 500;
export const DELETE_EXPIRED_SQL =
  "DELETE FROM messages WHERE id IN (SELECT id FROM messages WHERE received_at < ?1 LIMIT 500)";
export const CLEAR_FINGERPRINTS_SQL =
  "UPDATE messages SET ip_hash = NULL WHERE received_at < ?1 AND ip_hash IS NOT NULL";
