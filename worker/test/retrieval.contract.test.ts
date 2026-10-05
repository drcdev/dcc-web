import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { api, clearRows, READ_TOKEN, run, seedMessage } from "./helpers";

const UUID = "3f0c7c1e-8a5b-4d7e-9c1a-2b3c4d5e6f70";

beforeEach(async () => {
  await clearRows();
});

function headersOf(response: Response) {
  return [...response.headers].sort(([a], [b]) => a.localeCompare(b));
}

describe("authorization (FR-023, FR-023b)", () => {
  const routes: [string, string][] = [];
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    for (const path of [
      "/api/messages",
      "/api/messages/new",
      `/api/messages/${UUID}`,
      `/api/messages/${UUID}/read`,
      "/api/messages/nope/deeper/still",
    ]) {
      routes.push([method, path]);
    }
  }

  const refusals: [string, Record<string, string>, string | null][] = [
    ["a missing header", {}, null],
    ["another scheme", { Authorization: `Basic ${READ_TOKEN}` }, null],
    ["an empty value", { Authorization: "" }, null],
    ["an empty bearer", { Authorization: "Bearer " }, null],
    ["a wrong token", {}, "wrong-token"],
    ["the other environment's token", {}, "production-token-value-0123456789abcdef"],
  ];

  it("returns one identical 401 for every refusal on every route and method", async () => {
    const reference = await run(api("/api/messages/new", { token: null }));
    expect(reference.status).toBe(401);
    const referenceBody = await reference.text();
    expect(JSON.parse(referenceBody)).toEqual({ error: "unauthorized" });
    expect(reference.headers.get("WWW-Authenticate")).toBe("Bearer");
    const referenceHeaders = headersOf(reference);

    for (const [method, path] of routes) {
      for (const [label, headers, token] of refusals) {
        const response = await run(api(path, { method, token, headers }));
        const where = `${method} ${path} with ${label}`;
        expect(response.status, where).toBe(401);
        expect(await response.text(), where).toBe(referenceBody);
        expect(headersOf(response), where).toEqual(referenceHeaders);
      }
    }
  });

  it("refuses every request when the secret is unset or empty", async () => {
    const holder = env as unknown as Record<string, unknown>;
    const original = holder.CONTACT_READ_TOKEN;
    try {
      for (const value of [undefined, ""]) {
        holder.CONTACT_READ_TOKEN = value;
        for (const token of ["", "undefined", READ_TOKEN]) {
          const response = await run(api("/api/messages/new", { token }));
          expect(response.status).toBe(401);
          expect(await response.json()).toEqual({ error: "unauthorized" });
        }
      }
    } finally {
      holder.CONTACT_READ_TOKEN = original;
    }
  });

  it("reads the token only from Authorization, never a query string or cookie", async () => {
    await seedMessage();
    const viaQuery = await run(api(`/api/messages/new?token=${READ_TOKEN}&access_token=${READ_TOKEN}`, { token: null }));
    expect(viaQuery.status).toBe(401);
    const viaCookie = await run(
      api("/api/messages/new", { token: null, headers: { Cookie: `token=${READ_TOKEN}; Authorization=Bearer ${READ_TOKEN}` } }),
    );
    expect(viaCookie.status).toBe(401);
  });

  it("accepts the correct token", async () => {
    const response = await run(api("/api/messages/new"));
    expect(response.status).toBe(200);
  });

  it("sends no CORS headers on any response", async () => {
    const evil = { Origin: "https://evil.example" };
    const responses = [
      await run(api("/api/messages/new", { token: null, headers: evil })),
      await run(api("/api/messages/new", { headers: evil })),
      await run(api("/api/messages/new", { method: "OPTIONS", headers: evil })),
      await run(api(`/api/messages/${UUID}/read`, { method: "POST", headers: evil })),
    ];
    for (const response of responses) {
      for (const [name] of response.headers) expect(name.toLowerCase().startsWith("access-control-")).toBe(false);
    }
  });
});

describe("HTTPS only (#89)", () => {
  const plain = (path: string, init: { method?: string; token?: string | null } = {}) => {
    const { method = "GET", token = READ_TOKEN } = init;
    return new Request(`http://example.com${path}`, {
      method,
      headers: token === null ? {} : { Authorization: `Bearer ${token}` },
    });
  };

  it("refuses plain http with 403 before authorization, token or not", async () => {
    for (const token of [READ_TOKEN, null, "wrong-token"]) {
      const response = await run(plain("/api/messages/new", { token }));
      expect(response.status, String(token)).toBe(403);
      expect(await response.json()).toEqual({ error: "https_required" });
    }
  });

  it("refuses plain http for every method and leaves the row unread", async () => {
    const id = await seedMessage();
    for (const method of ["GET", "POST", "PUT", "DELETE", "OPTIONS"]) {
      const response = await run(plain(`/api/messages/${id}/read`, { method }));
      expect(response.status, method).toBe(403);
    }
    const row = await env.DB.prepare("SELECT status FROM messages WHERE id = ?").bind(id).first();
    expect(row).toEqual({ status: "new" });
  });

  it("allows plain http on 127.0.0.1 for local development", async () => {
    const request = new Request("http://127.0.0.1:4321/api/messages/new", {
      headers: { Authorization: `Bearer ${READ_TOKEN}` },
    });
    expect((await run(request)).status).toBe(200);
  });
});

describe("GET /api/messages/new", () => {
  it("returns an empty list and null cursor when nothing is new", async () => {
    const response = await run(api("/api/messages/new"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ messages: [], next_cursor: null });
  });

  it("returns only unread messages, oldest first, in the documented shape", async () => {
    const t = Date.parse("2026-09-29T17:04:11.000Z");
    const newer = await seedMessage({ received_at: t + 2000, project: "Cadence", organization: "Acme" });
    const older = await seedMessage({ received_at: t });
    await seedMessage({ received_at: t + 1000, status: "read" });

    const response = await run(api("/api/messages/new"));
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = (await response.json()) as { messages: Record<string, unknown>[]; next_cursor: string | null };
    expect(body.next_cursor).toBeNull();
    expect(body.messages.map((m) => m.id)).toEqual([older, newer]);
    expect(body.messages[0]).toEqual({
      id: older,
      name: "Ada Example",
      email: "ada@example.com",
      organization: null,
      project: null,
      message: "Hello",
      received_at: "2026-09-29T17:04:11.000Z",
    });
    expect(body.messages[1]).toMatchObject({
      organization: "Acme",
      project: "Cadence",
      received_at: "2026-09-29T17:04:13.000Z",
    });
    for (const m of body.messages) {
      expect(Object.keys(m).sort()).toEqual(["email", "id", "message", "name", "organization", "project", "received_at"]);
    }
    expect(JSON.stringify(body)).not.toContain("a".repeat(64));
    expect(JSON.stringify(body)).not.toContain("ip_hash");
    expect(JSON.stringify(body)).not.toContain("status");
  });

  it("breaks received_at ties by id", async () => {
    const t = 1_800_000_000_000;
    const ids = ["00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000001"];
    for (const id of ids) await seedMessage({ id, received_at: t });
    const body = (await (await run(api("/api/messages/new"))).json()) as { messages: { id: string }[] };
    expect(body.messages.map((m) => m.id)).toEqual([...ids].sort());
  });

  it("pages 120 messages with a cursor, each exactly once and in order", async () => {
    const t = 1_800_000_000_000;
    const expected: string[] = [];
    const statements = [];
    for (let i = 0; i < 120; i += 1) {
      // Pairs share a timestamp so the cursor must honour the id tiebreak.
      const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
      expected.push(id);
      statements.push(
        env.DB.prepare(
          "INSERT INTO messages (id, name, email, message, status, received_at) VALUES (?1, 'N', 'n@x.co', 'm', 'new', ?2)",
        ).bind(id, t + Math.floor(i / 2)),
      );
    }
    await env.DB.batch(statements);

    for (const limit of [50, 7, 100]) {
      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const query: string = `/api/messages/new?limit=${limit}${cursor ? `&after=${cursor}` : ""}`;
        const response = await run(api(query));
        expect(response.status).toBe(200);
        const body = (await response.json()) as { messages: { id: string }[]; next_cursor: string | null };
        expect(body.messages.length).toBeLessThanOrEqual(limit);
        seen.push(...body.messages.map((m) => m.id));
        cursor = body.next_cursor;
        pages += 1;
        expect(pages).toBeLessThan(40);
      } while (cursor);
      expect(seen, `limit ${limit}`).toEqual(expected);
    }
  });

  it("defaults to 50 per page", async () => {
    const statements = [];
    for (let i = 0; i < 60; i += 1) {
      statements.push(
        env.DB.prepare(
          "INSERT INTO messages (id, name, email, message, status, received_at) VALUES (?1, 'N', 'n@x.co', 'm', 'new', ?2)",
        ).bind(crypto.randomUUID(), 1_800_000_000_000 + i),
      );
    }
    await env.DB.batch(statements);
    const body = (await (await run(api("/api/messages/new"))).json()) as {
      messages: unknown[];
      next_cursor: string | null;
    };
    expect(body.messages).toHaveLength(50);
    expect(body.next_cursor).not.toBeNull();
  });

  it("rejects an invalid limit or cursor with 400", async () => {
    await seedMessage();
    const bad = [
      "limit=0",
      "limit=101",
      "limit=-1",
      "limit=abc",
      "limit=1.5",
      "limit=",
      "limit=1&limit=2",
      "after=not-a-cursor",
      "after=",
      `after=${btoa("x:y").replace(/=+$/, "")}`,
      "after=%00%00",
    ];
    for (const query of bad) {
      const response = await run(api(`/api/messages/new?${query}`));
      expect(response.status, query).toBe(400);
      expect(await response.json(), query).toEqual({ error: "invalid_request" });
    }
  });
});

describe("POST /api/messages/{id}/read", () => {
  it("marks a new message read (200) and then refuses it (409)", async () => {
    const id = await seedMessage();
    const first = await run(api(`/api/messages/${id}/read`, { method: "POST" }));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ id, status: "read" });

    const second = await run(api(`/api/messages/${id}/read`, { method: "POST" }));
    expect(second.status).toBe(409);
    const text = await second.text();
    expect(JSON.parse(text)).toEqual({ error: "already_read" });
    expect(text).not.toContain("Ada");

    const list = (await (await run(api("/api/messages/new"))).json()) as { messages: unknown[] };
    expect(list.messages).toEqual([]);
  });

  it("changes only the status column", async () => {
    const id = await seedMessage({ project: "Cadence" });
    const before = await env.DB.prepare("SELECT * FROM messages WHERE id = ?").bind(id).first<Record<string, unknown>>();
    await run(api(`/api/messages/${id}/read`, { method: "POST" }));
    const after = await env.DB.prepare("SELECT * FROM messages WHERE id = ?").bind(id).first<Record<string, unknown>>();
    expect(after).toEqual({ ...before, status: "read" });
  });

  it("ignores any request body", async () => {
    const id = await seedMessage();
    const request = new Request(`https://example.com/api/messages/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${READ_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "new", name: "Changed" }),
    });
    expect((await run(request)).status).toBe(200);
    const row = await env.DB.prepare("SELECT name, status FROM messages WHERE id = ?").bind(id).first();
    expect(row).toEqual({ name: "Ada Example", status: "read" });
  });

  it("returns 404 for an unknown id without content", async () => {
    const response = await run(api(`/api/messages/${UUID}/read`, { method: "POST" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("returns 404 for a non-UUID or non-v4 id, even if a row has that id", async () => {
    const odd = "not-a-uuid";
    await env.DB.prepare(
      "INSERT INTO messages (id, name, email, message, status, received_at) VALUES (?1, 'N', 'n@x.co', 'm', 'new', 1)",
    )
      .bind(odd)
      .run();
    for (const id of [odd, "123", "3f0c7c1e-8a5b-1d7e-9c1a-2b3c4d5e6f70", `${UUID}x`, "%20"]) {
      const response = await run(api(`/api/messages/${id}/read`, { method: "POST" }));
      expect(response.status, id).toBe(404);
      expect(await response.json(), id).toEqual({ error: "not_found" });
    }
    const row = await env.DB.prepare("SELECT status FROM messages WHERE id = ?").bind(odd).first();
    expect(row).toEqual({ status: "new" });
  });
});

describe("everything else with a valid key", () => {
  it("returns 404 for other paths, including single-message and delete routes", async () => {
    const id = await seedMessage();
    const cases: [string, string][] = [
      ["GET", "/api/messages"],
      ["GET", "/api/messages/"],
      ["GET", `/api/messages/${id}`],
      ["DELETE", `/api/messages/${id}`],
      ["PUT", `/api/messages/${id}`],
      ["PATCH", `/api/messages/${id}`],
      ["GET", `/api/messages/${id}/other`],
      ["GET", "/api/messages/new/extra"],
      ["POST", `/api/messages/${id}/read/extra`],
    ];
    for (const [method, path] of cases) {
      const response = await run(api(path, { method }));
      expect(response.status, `${method} ${path}`).toBe(404);
      expect(await response.json()).toEqual({ error: "not_found" });
    }
    const row = await env.DB.prepare("SELECT status FROM messages WHERE id = ?").bind(id).first();
    expect(row).toEqual({ status: "new" });
  });

  it("returns 405 with Allow for wrong methods on the two routes", async () => {
    const id = await seedMessage();
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const response = await run(api("/api/messages/new", { method }));
      expect(response.status, method).toBe(405);
      expect(response.headers.get("Allow")).toBe("GET");
    }
    for (const method of ["GET", "PUT", "PATCH", "DELETE"]) {
      const response = await run(api(`/api/messages/${id}/read`, { method }));
      expect(response.status, method).toBe(405);
      expect(response.headers.get("Allow")).toBe("POST");
    }
    const row = await env.DB.prepare("SELECT status FROM messages WHERE id = ?").bind(id).first();
    expect(row).toEqual({ status: "new" });
  });

  it("returns JSON 404 for unknown /api paths", async () => {
    const response = await run(api("/api/other"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
