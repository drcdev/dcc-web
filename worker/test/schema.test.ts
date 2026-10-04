import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

interface Column {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

const insert = (row: Record<string, unknown>) => {
  const base = {
    id: "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b",
    name: "Ada",
    email: "ada@example.com",
    organization: null,
    project: null,
    message: "Hello",
    ip_hash: null,
    status: "new",
    received_at: 1,
    ...row,
  };
  return env.DB.prepare(
    "INSERT INTO messages (id, name, email, organization, project, message, ip_hash, status, received_at) VALUES (?,?,?,?,?,?,?,?,?)",
  )
    .bind(
      base.id,
      base.name,
      base.email,
      base.organization,
      base.project,
      base.message,
      base.ip_hash,
      base.status,
      base.received_at,
    )
    .run();
};

describe("messages table", () => {
  it("has the columns from the data model", async () => {
    const { results } = await env.DB.prepare("PRAGMA table_info(messages)").all<Column>();
    const byName = Object.fromEntries(results.map((c) => [c.name, c]));
    expect(Object.keys(byName)).toEqual([
      "id",
      "name",
      "email",
      "organization",
      "project",
      "message",
      "ip_hash",
      "status",
      "received_at",
    ]);
    expect(byName.id?.pk).toBe(1);
    for (const name of ["name", "email", "message", "status", "received_at"]) {
      expect(byName[name]?.notnull, name).toBe(1);
    }
    for (const name of ["organization", "project", "ip_hash"]) {
      expect(byName[name]?.notnull, name).toBe(0);
    }
    expect(byName.received_at?.type).toBe("INTEGER");
    expect(byName.status?.dflt_value).toBe("'new'");
  });

  it("has the three secondary indexes", async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'messages' AND name LIKE 'idx_%' ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual([
      "idx_messages_ip_received",
      "idx_messages_received",
      "idx_messages_status_received",
    ]);
    const cols = async (index: string) =>
      (await env.DB.prepare(`PRAGMA index_info(${index})`).all<{ name: string }>()).results.map((r) => r.name);
    expect(await cols("idx_messages_ip_received")).toEqual(["ip_hash", "received_at"]);
    expect(await cols("idx_messages_status_received")).toEqual(["status", "received_at", "id"]);
    expect(await cols("idx_messages_received")).toEqual(["received_at"]);
  });

  it("accepts values at the limits and defaults status to new", async () => {
    await env.DB.prepare(
      "INSERT INTO messages (id, name, email, message, received_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind("3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b", "n".repeat(100), "ada@example.com", "m".repeat(5000), 1)
      .run();
    const row = await env.DB.prepare("SELECT status FROM messages").first<{ status: string }>();
    expect(row?.status).toBe("new");
    await env.DB.prepare("DELETE FROM messages").run();
  });

  it.each([
    ["empty name", { name: "" }],
    ["name over 100", { name: "n".repeat(101) }],
    ["email under 3", { email: "a@" }],
    ["email over 254", { email: "e".repeat(255) }],
    ["empty organization", { organization: "" }],
    ["organization over 100", { organization: "o".repeat(101) }],
    ["project over 100", { project: "p".repeat(101) }],
    ["empty message", { message: "" }],
    ["message over 5000", { message: "m".repeat(5001) }],
    ["ip_hash of wrong length", { ip_hash: "abc" }],
    ["unknown status", { status: "deleted" }],
  ])("rejects %s", async (_label, row) => {
    await expect(insert(row)).rejects.toThrow(/CHECK constraint/i);
  });

  it("rejects a duplicate id", async () => {
    await insert({});
    await expect(insert({})).rejects.toThrow();
    await env.DB.prepare("DELETE FROM messages").run();
  });
});

describe("question_sets table", () => {
  const HASH = "a".repeat(64);
  const add = (row: Record<string, unknown> = {}) => {
    const base = { slug: "a-post", content_hash: HASH, questions: JSON.stringify(["One?", "Two?"]), model: "m", created_at: 1, ...row };
    return env.DB.prepare(
      "INSERT INTO question_sets (slug, content_hash, questions, model, created_at) VALUES (?,?,?,?,?)",
    )
      .bind(base.slug, base.content_hash, base.questions, base.model, base.created_at)
      .run();
  };

  it("has the columns, primary key and WITHOUT ROWID from the data model", async () => {
    const { results } = await env.DB.prepare("PRAGMA table_info(question_sets)").all<Column>();
    expect(results.map((c) => c.name)).toEqual(["slug", "content_hash", "questions", "model", "created_at"]);
    for (const c of results) expect(c.notnull, c.name).toBe(1);
    const pk = results
      .filter((c) => c.pk > 0)
      .sort((a, b) => a.pk - b.pk)
      .map((c) => c.name);
    expect(pk).toEqual(["slug", "content_hash"]);
    const sql = await env.DB.prepare("SELECT sql FROM sqlite_master WHERE name = 'question_sets'").first<{ sql: string }>();
    expect(sql?.sql).toMatch(/WITHOUT ROWID/i);
  });

  it("accepts a valid set and rejects a second row with the same key", async () => {
    await add();
    await expect(add()).rejects.toThrow();
    await env.DB.prepare("DELETE FROM question_sets").run();
  });

  it.each([
    ["empty slug", { slug: "" }],
    ["slug over 200", { slug: "s".repeat(201) }],
    ["short hash", { content_hash: "abc" }],
    ["invalid JSON", { questions: "not json" }],
    ["one question", { questions: JSON.stringify(["One?"]) }],
    ["five questions", { questions: JSON.stringify(["1?", "2?", "3?", "4?", "5?"]) }],
  ])("rejects %s", async (_label, row) => {
    await expect(add(row)).rejects.toThrow(/CHECK constraint|constraint failed/i);
  });
});

describe("usage_bucket table", () => {
  it("is seeded with exactly (1, 0, 0)", async () => {
    const { results } = await env.DB.prepare("SELECT id, tokens, updated_at FROM usage_bucket").all();
    expect(results).toEqual([{ id: 1, tokens: 0, updated_at: 0 }]);
  });

  it("rejects a second row and negative tokens", async () => {
    await expect(env.DB.prepare("INSERT INTO usage_bucket VALUES (2, 0, 0)").run()).rejects.toThrow(/CHECK constraint/i);
    await expect(env.DB.prepare("UPDATE usage_bucket SET tokens = -1").run()).rejects.toThrow(/CHECK constraint/i);
  });
});
