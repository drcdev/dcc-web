import { json } from "../http";
import { isAuthorized } from "./auth";
import { handleListNew } from "./list-new";
import { log } from "./log";
import { handleMarkRead } from "./mark-read";

const READ_PATH = /^\/api\/messages\/([^/]+)\/read$/;

/** Owns `/api/messages` and everything under it. Authorization comes first, for every method. */
export async function handleMessages(request: Request, env: Env, pathname: string): Promise<Response> {
  if (!(await isAuthorized(request, env))) {
    log("unauthorized");
    return json({ error: "unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
  }

  if (pathname === "/api/messages/new") {
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
    return handleListNew(request, env);
  }

  const match = READ_PATH.exec(pathname);
  if (match) {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
    let id: string;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      return json({ error: "not_found" }, 404);
    }
    return handleMarkRead(id, env);
  }

  return json({ error: "not_found" }, 404);
}
