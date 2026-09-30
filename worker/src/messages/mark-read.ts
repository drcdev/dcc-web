import { json } from "../http";
import { log } from "./log";
import { MARK_READ_SQL, READ_EXISTS_SQL } from "./queries";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const notFound = () => {
  log("not_found");
  return json({ error: "not_found" }, 404);
};

/** POST /api/messages/{id}/read. No request body is read; only `status` changes. */
export async function handleMarkRead(id: string, env: Env): Promise<Response> {
  if (!UUID_V4.test(id)) return notFound();
  try {
    const result = await env.DB.prepare(MARK_READ_SQL).bind(id).run();
    if (result.meta.changes === 1) {
      log("marked_read");
      return json({ id, status: "read" });
    }
    const existing = await env.DB.prepare(READ_EXISTS_SQL).bind(id).first();
    if (existing) {
      log("already_read");
      return json({ error: "already_read" }, 409);
    }
    return notFound();
  } catch {
    log("unavailable");
    return json({ error: "unavailable" }, 503);
  }
}
