import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { DELETE_OTHER_HASHES_SQL, GET_SET_SQL } from "../src/questions/queries";

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
