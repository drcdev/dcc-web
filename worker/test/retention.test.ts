import { createExecutionContext, createScheduledController, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { CLEAR_FINGERPRINTS_SQL, DELETE_EXPIRED_SQL } from "../src/contact/queries";
import { retentionCutoff } from "../src/retention";
import { RETENTION_MONTHS } from "../src/contact/rules";
import { clearRows, rows, seedMessage } from "./helpers";

const HOUR = 3_600_000;
const NOW = Date.parse("2026-09-29T03:17:00.000Z");
const CUTOFF = Date.parse("2025-09-29T03:17:00.000Z");
const MINUTE = 60_000;

async function runCron(scheduledTime = NOW, testEnv: Env = env) {
  const controller = createScheduledController({ scheduledTime, cron: "17 3 * * *" });
  const ctx = createExecutionContext();
  const handler = worker as unknown as Required<ExportedHandler<Env>>;
  await handler.scheduled(controller, testEnv, ctx);
  await waitOnExecutionContext(ctx);
}

async function ids() {
  return new Set((await rows()).map((row) => row.id as string));
}

let logs: unknown[][];
beforeEach(async () => {
  await clearRows();
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args) => void logs.push(args));
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("retentionCutoff", () => {
  it("is RETENTION_MONTHS calendar months earlier in UTC", () => {
    expect(RETENTION_MONTHS).toBe(12);
    expect(retentionCutoff(NOW)).toBe(CUTOFF);
  });

  it("maps 29 February to 1 March (setUTCMonth semantics)", () => {
    expect(retentionCutoff(Date.parse("2028-02-29T03:17:00.000Z"))).toBe(Date.parse("2027-03-01T03:17:00.000Z"));
  });
});

describe("retention cron: deletion", () => {
  it("deletes only rows older than the cutoff, whatever their status", async () => {
    const old13New = await seedMessage({ received_at: Date.parse("2025-08-29T00:00:00.000Z"), status: "new" });
    const old13Read = await seedMessage({ received_at: Date.parse("2025-08-29T00:00:00.000Z"), status: "read" });
    const justOverNew = await seedMessage({ received_at: CUTOFF - MINUTE, status: "new" });
    const justOverRead = await seedMessage({ received_at: CUTOFF - MINUTE, status: "read" });
    const justUnder = await seedMessage({ received_at: CUTOFF + MINUTE, status: "new" });
    const eleven = await seedMessage({ received_at: Date.parse("2025-10-29T00:00:00.000Z"), status: "read" });
    const exactly = await seedMessage({ received_at: CUTOFF, status: "new" });

    await runCron();

    const left = await ids();
    for (const gone of [old13New, old13Read, justOverNew, justOverRead]) expect(left.has(gone)).toBe(false);
    for (const kept of [justUnder, eleven, exactly]) expect(left.has(kept)).toBe(true);
  });

  it("deletes a batch of 1,200 expired rows in one run", async () => {
    const old = CUTOFF - 30 * 24 * HOUR;
    const statements = Array.from({ length: 1200 }, (_, i) =>
      env.DB.prepare(
        "INSERT INTO messages (id, name, email, message, status, received_at) VALUES (?1, 'n', 'e@x.co', 'm', 'new', ?2)",
      ).bind(crypto.randomUUID(), old + i),
    );
    for (let i = 0; i < statements.length; i += 100) await env.DB.batch(statements.slice(i, i + 100));
    const keep = await seedMessage({ received_at: NOW - HOUR });
    expect((await rows()).length).toBe(1201);

    await runCron();

    expect(await ids()).toEqual(new Set([keep]));
    expect(logs).toEqual([[JSON.stringify({ event: "retention", deleted: 1200 })]]);
  });
});

describe("retention cron: fingerprints", () => {
  it("clears ip_hash on rows over 24 hours old and keeps the message; younger rows keep it", async () => {
    const older = await seedMessage({ received_at: NOW - 25 * HOUR, ip_hash: "b".repeat(64) });
    const younger = await seedMessage({ received_at: NOW - 23 * HOUR, ip_hash: "c".repeat(64) });

    await runCron();

    const byId = new Map((await rows()).map((row) => [row.id as string, row]));
    expect(byId.get(older)?.ip_hash).toBeNull();
    expect(byId.get(older)?.message).toBe("Hello");
    expect(byId.get(younger)?.ip_hash).toBe("c".repeat(64));
  });
});

describe("retention cron: statements and logging", () => {
  it("uses an index for both statements", async () => {
    const statements: [string, unknown[]][] = [
      [DELETE_EXPIRED_SQL, [CUTOFF]],
      [CLEAR_FINGERPRINTS_SQL, [NOW - 24 * HOUR]],
    ];
    for (const [sql, params] of statements) {
      const plan = await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`)
        .bind(...params)
        .all<{ detail: string }>();
      const details = plan.results.map((row) => row.detail).join("\n");
      expect(details).not.toMatch(/SCAN messages/);
      expect(details).toMatch(/USING (COVERING )?INDEX idx_messages_received|USING INTEGER PRIMARY KEY/);
    }
  });

  it("logs exactly one line with only the event and the deleted count, and no personal data", async () => {
    await seedMessage({ received_at: CUTOFF - HOUR, name: "Grace Hopper", ip_hash: "d".repeat(64) });
    await seedMessage({ received_at: CUTOFF - 2 * HOUR });

    await runCron();

    expect(logs).toHaveLength(1);
    const line = String(logs[0][0]);
    expect(JSON.parse(line)).toEqual({ event: "retention", deleted: 2 });
    expect(line).not.toContain("Grace");
    expect(line).not.toContain("ada@example.com");
    expect(line).not.toContain("d".repeat(64));
  });

  it("logs zero when nothing is overdue", async () => {
    await runCron();
    expect(logs).toEqual([[JSON.stringify({ event: "retention", deleted: 0 })]]);
  });
});

describe("retention cron: failure", () => {
  // Wraps the database so statements matching `fail` reject.
  function failing(fail: (sql: string) => boolean): Env {
    const db = new Proxy(env.DB, {
      get(target, property) {
        if (property === "prepare") {
          return (sql: string) => {
            if (fail(sql)) throw new Error("D1 unavailable");
            return target.prepare(sql);
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    return { ...env, DB: db } as Env;
  }

  it("a failing delete leaves the rows, still throws, and the next run catches up", async () => {
    const overdue = await seedMessage({ received_at: CUTOFF - HOUR });

    await expect(runCron(NOW, failing((sql) => sql === DELETE_EXPIRED_SQL))).rejects.toThrow();
    expect((await ids()).has(overdue)).toBe(true);
    expect(logs).toHaveLength(1);
    expect(JSON.parse(String(logs[0][0]))).toEqual({ event: "retention", deleted: 0 });

    logs = [];
    await runCron(NOW + 24 * HOUR);
    expect((await ids()).has(overdue)).toBe(false);
  });

  it("a failing fingerprint step still throws after the deletes have happened", async () => {
    const overdue = await seedMessage({ received_at: CUTOFF - HOUR });
    const stale = await seedMessage({ received_at: NOW - 25 * HOUR, ip_hash: "e".repeat(64) });

    await expect(runCron(NOW, failing((sql) => sql === CLEAR_FINGERPRINTS_SQL))).rejects.toThrow();

    const left = await ids();
    expect(left.has(overdue)).toBe(false);
    expect((await rows()).find((row) => row.id === stale)?.ip_hash).toBe("e".repeat(64));
    expect(logs).toHaveLength(1);
    expect(JSON.parse(String(logs[0][0]))).toEqual({ event: "retention", deleted: 1 });
  });
});
