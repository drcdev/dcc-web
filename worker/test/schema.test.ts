import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

interface Column {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

describe("dropped messages table (FR-009)", () => {
  it("is absent after every migration, with its three indexes", async () => {
    const { results } = await env.DB.prepare(
      "SELECT name, type FROM sqlite_master WHERE name = 'messages' OR tbl_name = 'messages' OR name LIKE 'idx_messages_%'",
    ).all();
    expect(results).toEqual([]);
  });

  it("leaves the questions tables intact and lists migrations 0001 to 0003 as applied", async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",
    ).all<{ name: string }>();
    expect(tables.results.map((r) => r.name)).toEqual(["d1_migrations", "question_sets", "usage_bucket"]);
    const applied = await env.DB.prepare("SELECT name FROM d1_migrations ORDER BY id").all<{ name: string }>();
    expect(applied.results.map((r) => r.name)).toEqual([
      "0001_create_messages.sql",
      "0002_create_questions.sql",
      "0003_drop_messages.sql",
    ]);
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
