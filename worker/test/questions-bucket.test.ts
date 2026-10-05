import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { refundToken, takeToken } from "../src/questions/bucket";

const NOW = Date.parse("2026-10-04T12:00:00.000Z");
const DAY = 86_400_000;
const LIMITS = { capacity: 5, perDay: 86_400 }; // one token per second

async function setBucket(tokens: number, updatedAt: number) {
  await env.DB.prepare("UPDATE usage_bucket SET tokens = ?, updated_at = ? WHERE id = 1").bind(tokens, updatedAt).run();
}

async function tokens() {
  const row = await env.DB.prepare("SELECT tokens FROM usage_bucket WHERE id = 1").first<{ tokens: number }>();
  return row!.tokens;
}

beforeEach(async () => {
  await setBucket(0, 0);
});

describe("takeToken", () => {
  it("starts full on the seed row", async () => {
    const result = await takeToken(env.DB, NOW, LIMITS);
    expect(result).toEqual({ ok: true });
    expect(await tokens()).toBe(LIMITS.capacity - 1);
  });

  it("grants `capacity` takes and then refuses with the wait for the next token", async () => {
    for (let i = 0; i < LIMITS.capacity; i++) {
      expect((await takeToken(env.DB, NOW, LIMITS)).ok).toBe(true);
    }
    expect(await takeToken(env.DB, NOW, LIMITS)).toEqual({ ok: false, retryAfter: 1 });
    expect(await tokens()).toBeCloseTo(0);
  });

  it("reports the whole seconds until one token is available, at least 1", async () => {
    const slow = { capacity: 2, perDay: 2 }; // one token per 12 hours
    await setBucket(0.5, NOW);
    expect(await takeToken(env.DB, NOW, slow)).toEqual({ ok: false, retryAfter: 21_600 });
    await setBucket(0.99999, NOW);
    expect(await takeToken(env.DB, NOW, LIMITS)).toEqual({ ok: false, retryAfter: 1 });
  });

  it("refills with time and never beyond capacity", async () => {
    await setBucket(0, NOW);
    expect((await takeToken(env.DB, NOW, LIMITS)).ok).toBe(false);
    expect((await takeToken(env.DB, NOW + 2_000, LIMITS)).ok).toBe(true);
    expect(await tokens()).toBeCloseTo(1);
    await setBucket(0, NOW);
    await takeToken(env.DB, NOW + DAY, LIMITS);
    expect(await tokens()).toBe(LIMITS.capacity - 1);
  });

  it("does not count a clock that runs backwards as refill", async () => {
    await setBucket(1, NOW);
    expect((await takeToken(env.DB, NOW - 10_000, LIMITS)).ok).toBe(true);
    expect(await tokens()).toBeCloseTo(0);
  });

  it("lets only one of two concurrent takes have the last token", async () => {
    await setBucket(1, NOW);
    const results = await Promise.all([takeToken(env.DB, NOW, LIMITS), takeToken(env.DB, NOW, LIMITS)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("with a reserve, takes only while the refilled bucket holds one more than the reserve", async () => {
    await setBucket(3, NOW);
    expect((await takeToken(env.DB, NOW, LIMITS, 2)).ok).toBe(true);
    expect(await tokens()).toBe(2);
    expect(await takeToken(env.DB, NOW, LIMITS, 2)).toEqual({ ok: false, retryAfter: 1 });
    expect(await tokens()).toBe(2);
  });

  it("with a reserve, retryAfter is the time to reach reserve + 1", async () => {
    const slow = { capacity: 10, perDay: 10 }; // one token per 8640 s
    await setBucket(1, NOW);
    expect(await takeToken(env.DB, NOW, slow, 2)).toEqual({ ok: false, retryAfter: 17_280 });
  });

  it("without a reserve still spends down to zero", async () => {
    await setBucket(1, NOW);
    expect((await takeToken(env.DB, NOW, LIMITS)).ok).toBe(true);
    expect(await tokens()).toBeCloseTo(0);
  });

  it("reads a stored value above capacity as capacity", async () => {
    await setBucket(LIMITS.capacity + 100, NOW);
    expect((await takeToken(env.DB, NOW, LIMITS)).ok).toBe(true);
    expect(await tokens()).toBe(LIMITS.capacity - 1);
  });

  it.each([
    ["zero capacity", { capacity: 0, perDay: 100 }],
    ["negative capacity", { capacity: -1, perDay: 100 }],
    ["NaN capacity", { capacity: Number.NaN, perDay: 100 }],
    ["infinite capacity", { capacity: Infinity, perDay: 100 }],
    ["zero rate", { capacity: 5, perDay: 0 }],
    ["negative rate", { capacity: 5, perDay: -1 }],
    ["infinite rate", { capacity: 5, perDay: Infinity }],
  ])("treats %s as an empty bucket", async (_label, limits) => {
    const result = await takeToken(env.DB, NOW, limits);
    expect(result.ok).toBe(false);
    expect(await tokens()).toBe(0);
  });
});

describe("refundToken", () => {
  it("adds one token", async () => {
    await setBucket(2, NOW);
    await refundToken(env.DB, LIMITS.capacity);
    expect(await tokens()).toBe(3);
  });

  it("never exceeds capacity", async () => {
    await setBucket(LIMITS.capacity, NOW);
    await refundToken(env.DB, LIMITS.capacity);
    expect(await tokens()).toBe(LIMITS.capacity);
  });

  it("does not throw when the statement fails, and the token stays spent", async () => {
    await setBucket(2, NOW);
    const broken = {
      prepare: () => {
        throw new Error("D1 down");
      },
    } as unknown as D1Database;
    await expect(refundToken(broken, LIMITS.capacity)).resolves.toBeUndefined();
    expect(await tokens()).toBe(2);
  });
});
