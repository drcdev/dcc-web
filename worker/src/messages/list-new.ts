import { json } from "../http";
import { LIST_NEW_AFTER_SQL, LIST_NEW_SQL } from "./queries";
import { log } from "./log";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface Cursor {
  receivedAt: number;
  id: string;
}

const invalid = () => {
  log("invalid_request");
  return json({ error: "invalid_request" }, 400);
};

function encodeCursor(receivedAt: number, id: string): string {
  return btoa(`${receivedAt}:${id}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCursor(value: string): Cursor | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  let text: string;
  try {
    text = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
  const match = /^(\d{1,16}):([0-9a-f-]{36})$/.exec(text);
  if (!match || !UUID_V4.test(match[2])) return null;
  return { receivedAt: Number(match[1]), id: match[2] };
}

interface Row {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  project: string | null;
  message: string;
  received_at: number;
}

export async function handleListNew(request: Request, env: Env): Promise<Response> {
  const params = new URL(request.url).searchParams;

  let limit = DEFAULT_LIMIT;
  if (params.has("limit")) {
    const all = params.getAll("limit");
    if (all.length !== 1 || !/^\d{1,3}$/.test(all[0])) return invalid();
    limit = Number(all[0]);
    if (limit < 1 || limit > MAX_LIMIT) return invalid();
  }

  let cursor: Cursor | null = null;
  if (params.has("after")) {
    const all = params.getAll("after");
    cursor = all.length === 1 ? decodeCursor(all[0]) : null;
    if (!cursor) return invalid();
  }

  try {
    // Fetch one extra row to know whether another page may follow.
    const statement = cursor
      ? env.DB.prepare(LIST_NEW_AFTER_SQL).bind(cursor.receivedAt, cursor.id, limit + 1)
      : env.DB.prepare(LIST_NEW_SQL).bind(limit + 1);
    const { results } = await statement.all<Row>();
    const page = results.slice(0, limit);
    const last = page[page.length - 1];
    const nextCursor = results.length > limit && last ? encodeCursor(last.received_at, last.id) : null;
    log("listed");
    return json({
      messages: page.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        organization: row.organization,
        project: row.project,
        message: row.message,
        received_at: new Date(row.received_at).toISOString(),
      })),
      next_cursor: nextCursor,
    });
  } catch {
    log("unavailable");
    return json({ error: "unavailable" }, 503);
  }
}
