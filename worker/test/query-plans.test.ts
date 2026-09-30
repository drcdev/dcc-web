import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { DUPLICATE_CHECK_SQL, INSERT_MESSAGE_SQL } from "../src/contact/queries";

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
