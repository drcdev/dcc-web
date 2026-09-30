import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { RATE_LIMIT_SQL } from "../src/contact/queries";
import { checkRateLimit } from "../src/contact/rate-limit";
import { clearRows, seedMessage } from "./helpers";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.parse("2026-09-29T12:00:00.000Z");
const HASH = "b".repeat(64);

beforeEach(async () => {
  await clearRows();
});

async function seed(ages: number[], ip_hash: string | null = HASH) {
  for (const age of ages) await seedMessage({ ip_hash, received_at: NOW - age });
}

describe("rate-limit query", () => {
  it("counts exact rows per window and only for the given hash", async () => {
    await seed([1000, HOUR - 1, HOUR, HOUR + 1, DAY - 1, DAY, DAY + 1]);
    await seed([1000], "c".repeat(64));
    await seed([1000], null);
    const row = await env.DB.prepare(RATE_LIMIT_SQL)
      .bind(HASH, NOW - HOUR, NOW - DAY)
      .first<{ day: number; hour: number }>();
    expect(row?.hour).toBe(3);
    expect(row?.day).toBe(6);
  });

  it("uses an index and never scans messages", async () => {
    const plan = await env.DB.prepare(`EXPLAIN QUERY PLAN ${RATE_LIMIT_SQL}`)
      .bind(HASH, NOW - HOUR, NOW - DAY)
      .all<{ detail: string }>();
    const details = plan.results.map((row) => row.detail).join("\n");
    expect(details).not.toMatch(/SCAN messages/);
    expect(details).toMatch(/idx_messages_ip_received/);
  });
});

describe("checkRateLimit", () => {
  it("allows below both limits", async () => {
    await seed([1000, 2000]);
    expect(await checkRateLimit(env.DB, HASH, NOW)).toEqual({ limited: false });
  });

  it("limits at 3 per hour with Retry-After until the oldest hourly row leaves", async () => {
    await seed([10 * 60_000, 20 * 60_000, 40 * 60_000]);
    expect(await checkRateLimit(env.DB, HASH, NOW)).toEqual({ limited: true, retryAfter: 20 * 60 });
  });

  it("limits at 5 per day with Retry-After until the oldest daily row leaves", async () => {
    await seed([2 * HOUR, 3 * HOUR, 4 * HOUR, 5 * HOUR, 20 * HOUR]);
    expect(await checkRateLimit(env.DB, HASH, NOW)).toEqual({ limited: true, retryAfter: 4 * 3600 });
  });

  it("waits for the longer window when both are exceeded", async () => {
    await seed([10 * 60_000, 20 * 60_000, 40 * 60_000, 2 * HOUR, 20 * HOUR]);
    expect(await checkRateLimit(env.DB, HASH, NOW)).toEqual({ limited: true, retryAfter: 4 * 3600 });
  });
});
