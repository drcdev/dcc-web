import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { DUPLICATE_CHECK_SQL, INSERT_MESSAGE_SQL } from "../src/contact/queries";
import { DELETE_OTHER_HASHES_SQL, GET_SET_SQL } from "../src/questions/queries";
import { LIST_NEW_AFTER_SQL, LIST_NEW_SQL, MARK_READ_SQL, READ_EXISTS_SQL } from "../src/messages/queries";

// FR-025a: no statement on the submit path may scan the messages table.
describe("submit path query plans", () => {
  const statements: [string, string, unknown[]][] = [
    ["duplicate check", DUPLICATE_CHECK_SQL, ["id"]],
    ["insert", INSERT_MESSAGE_SQL, ["id", "n", "e@x.co", null, null, "m", null, 1]],
  ];

  for (const [label, sql, params] of statements) {
    it(`${label} does not scan messages`, async () => {
      const plan = await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`)
        .bind(...params)
        .all<{ detail: string }>();
      const details = plan.results.map((row) => row.detail);
      expect(details.join("\n")).not.toMatch(/SCAN messages/);
    });
  }
});

// FR-025a: the retrieval statements use an index too.
describe("retrieval path query plans", () => {
  const statements: [string, string, unknown[]][] = [
    ["list new (first page)", LIST_NEW_SQL, [51]],
    ["list new (after cursor)", LIST_NEW_AFTER_SQL, [1_800_000_000_000, "id", 51]],
    ["mark read", MARK_READ_SQL, ["id"]],
    ["read existence check", READ_EXISTS_SQL, ["id"]],
  ];

  for (const [label, sql, params] of statements) {
    it(`${label} does not scan messages`, async () => {
      const plan = await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`)
        .bind(...params)
        .all<{ detail: string }>();
      const details = plan.results.map((row) => row.detail).join("\n");
      expect(details).not.toMatch(/SCAN messages/);
      expect(details).toMatch(/USING (COVERING )?INDEX|USING INTEGER PRIMARY KEY/);
    });
  }
});

// Questions cache: the lookup and delete-others statements use the (slug, content_hash) primary key.
describe("questions cache query plans", () => {
  const statements: [string, string, unknown[]][] = [
    ["cache lookup", GET_SET_SQL, ["slug", "hash"]],
    ["delete other hashes", DELETE_OTHER_HASHES_SQL, ["slug", "hash"]],
  ];

  for (const [label, sql, params] of statements) {
    it(`${label} uses the primary key and does not scan question_sets`, async () => {
      const plan = await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`)
        .bind(...params)
        .all<{ detail: string }>();
      const details = plan.results.map((row) => row.detail).join("\n");
      expect(details).not.toMatch(/SCAN question_sets/);
      expect(details).toMatch(/SEARCH question_sets USING PRIMARY KEY/);
    });
  }
});
