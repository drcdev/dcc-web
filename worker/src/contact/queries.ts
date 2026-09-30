// SQL for the submit path, in one place so the query-plan test checks the exact statements.

export const DUPLICATE_CHECK_SQL = "SELECT 1 FROM messages WHERE id = ?";

export const INSERT_MESSAGE_SQL =
  "INSERT INTO messages (id, name, email, organization, project, message, ip_hash, status, received_at) " +
  "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'new', ?8) ON CONFLICT(id) DO NOTHING";
