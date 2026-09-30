// SQL for the retrieval path, in one place so the query-plan test checks the exact statements.
// Both list statements are served by idx_messages_status_received (status, received_at, id).

export const LIST_NEW_SQL =
  "SELECT id, name, email, organization, project, message, received_at FROM messages " +
  "WHERE status = 'new' ORDER BY received_at, id LIMIT ?";

export const LIST_NEW_AFTER_SQL =
  "SELECT id, name, email, organization, project, message, received_at FROM messages " +
  "WHERE status = 'new' AND (received_at, id) > (?, ?) ORDER BY received_at, id LIMIT ?";

export const MARK_READ_SQL = "UPDATE messages SET status = 'read' WHERE id = ? AND status = 'new'";

export const READ_EXISTS_SQL = "SELECT 1 FROM messages WHERE id = ?";
