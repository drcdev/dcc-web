import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRows,
  ipHashFor,
  mockSiteverify,
  ORIGIN,
  post,
  rows,
  run,
  seedMessage,
  SITEVERIFY,
  validBody,
} from "./helpers";

beforeEach(async () => {
  await clearRows();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/contact: project", () => {
  it("stores the project as plain text with control characters removed", async () => {
    mockSiteverify();
    const response = await run(post(validBody({ project: "  <b>Ca\u0000den\u0007ce</b>\n " })));
    expect(response.status).toBe(200);
    expect((await rows())[0].project).toBe("<b>Cadence</b>");
  });

  it("stores null for an absent, blank or control-only project", async () => {
    let n = 0;
    for (const project of [undefined, "", "   ", "\u0000\u0001"]) {
      mockSiteverify();
      await run(post(validBody({ project }), { "CF-Connecting-IP": `203.0.113.${100 + n++}` }));
      vi.restoreAllMocks();
    }
    const stored = await rows();
    expect(stored).toHaveLength(4);
    expect(stored.every((row) => row.project === null)).toBe(true);
  });

  it("refuses a project over 100 characters after cleaning, and accepts exactly 100", async () => {
    mockSiteverify();
    const tooLong = await run(post(validBody({ project: "p".repeat(101) })));
    expect(tooLong.status).toBe(400);
    expect(await tooLong.json()).toMatchObject({ error: "validation", fields: { project: "too_long" } });
    const padded = await run(post(validBody({ project: `\u0000${"p".repeat(100)}\u0000` })));
    expect(padded.status).toBe(200);
    expect((await rows())[0].project).toBe("p".repeat(100));
  });
});

describe("POST /api/contact: accepted", () => {
  it("stores one row with a hashed IP and no raw IP", async () => {
    mockSiteverify();
    const body = validBody();
    const response = await run(post(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const stored = await rows();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: body.submission_id,
      name: "Ada Lovelace",
      email: "ada@example.com",
      organization: null,
      project: null,
      message: "Hello there",
      status: "new",
    });
    expect(String(stored[0].ip_hash)).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored[0])).not.toContain("203.0.113.7");
    expect(typeof stored[0].received_at).toBe("number");
  });

  it("accepts http on 127.0.0.1 and localhost", async () => {
    for (const host of ["127.0.0.1", "localhost"]) {
      mockSiteverify({ success: true, action: "contact", hostname: host });
      const response = await run(post(validBody(), {}, `http://${host}:8787/api/contact`));
      expect(response.status).toBe(200);
      vi.restoreAllMocks();
    }
  });

  it("answers a repeated submission id with 200 and stores one row", async () => {
    const { spy } = mockSiteverify();
    const body = validBody();
    await run(post(body));
    const again = await run(post(body));
    expect(again.status).toBe(200);
    expect(await rows()).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("honeypot returns 200 with no Turnstile call and no row", async () => {
    const { spy } = mockSiteverify();
    const response = await run(post(validBody({ website: "http://spam.example" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(spy).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
  });
});

describe("POST /api/contact: refused at the edge", () => {
  it("405 with Allow: POST for other methods", async () => {
    const response = await run(new Request(`${ORIGIN}/api/contact`, { method: "GET" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(await response.json()).toEqual({ ok: false, error: "method_not_allowed" });
  });

  it("403 for a missing, foreign or cross-site origin", async () => {
    mockSiteverify();
    const missing = post();
    missing.headers.delete("Origin");
    expect((await run(missing)).status).toBe(403);
    expect((await run(post(validBody(), { Origin: "https://evil.example" }))).status).toBe(403);
    expect((await run(post(validBody(), { "Sec-Fetch-Site": "cross-site" }))).status).toBe(403);
    const response = await run(post(validBody(), { Origin: "https://evil.example" }));
    expect(await response.json()).toEqual({ ok: false, error: "forbidden" });
    expect(await rows()).toHaveLength(0);
  });

  it("403 for http on a non-local host", async () => {
    mockSiteverify();
    const response = await run(post(validBody(), {}, "http://example.com/api/contact"));
    expect(response.status).toBe(403);
    expect(await rows()).toHaveLength(0);
  });

  it("415 for a wrong content type, accepting parameters on the right one", async () => {
    mockSiteverify();
    const wrong = await run(post(validBody(), { "Content-Type": "text/plain" }));
    expect(wrong.status).toBe(415);
    expect(await wrong.json()).toEqual({ ok: false, error: "unsupported_media_type" });
    const ok = await run(post(validBody(), { "Content-Type": "application/json; charset=utf-8" }));
    expect(ok.status).toBe(200);
  });

  it("413 when Content-Length is over 10,240", async () => {
    const { spy } = mockSiteverify();
    const response = await run(post(validBody({ message: "x".repeat(11_000) }), { "Content-Length": "11000" }));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ ok: false, error: "too_large" });
    expect(spy).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
  });

  it("413 when a streamed body without Content-Length grows past 10,240 bytes", async () => {
    const { spy } = mockSiteverify();
    const chunk = new TextEncoder().encode("x".repeat(4096));
    const stream = new ReadableStream({
      start(controller) {
        for (let i = 0; i < 4; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    const request = new Request(`${ORIGIN}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN, "Sec-Fetch-Site": "same-origin" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    const response = await run(request);
    expect(response.status).toBe(413);
    expect(spy).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
  });

  it("400 invalid_json for a body that is not a JSON object", async () => {
    mockSiteverify();
    for (const raw of ["{not json", "[1,2]", "null", '"text"']) {
      const response = await run(post(raw));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, error: "invalid_json" });
    }
  });

  it("400 validation with fields, and no Turnstile call", async () => {
    const { spy } = mockSiteverify();
    const response = await run(post(validBody({ email: "nope", consent: false })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "validation",
      fields: { email: "invalid", consent: "required" },
    });
    expect(spy).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
  });
});

describe("POST /api/contact: Turnstile", () => {
  it("422 unless success, action contact and hostname match", async () => {
    const verdicts = [
      { success: false },
      { success: true, action: "other", hostname: "example.com" },
      { success: true, action: "contact", hostname: "evil.example" },
      { success: true, hostname: "example.com" },
    ];
    for (const verdict of verdicts) {
      mockSiteverify(verdict);
      const response = await run(post());
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ ok: false, error: "turnstile_failed" });
      vi.restoreAllMocks();
    }
    expect(await rows()).toHaveLength(0);
  });

  it("accepts Cloudflare's documented testing-key answer (no action, hostname example.com) and nothing else lacking them", async () => {
    // The always-pass test secret used by the E2E run answers like this (research R6).
    mockSiteverify({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } });
    expect((await run(post(validBody(), {}, "http://127.0.0.1:4321/api/contact"))).status).toBe(200);
    vi.restoreAllMocks();
    mockSiteverify({ success: false, metadata: { result_with_testing_key: true } });
    expect((await run(post())).status).toBe(422);
  });

  it("422 when the token is missing, without calling siteverify", async () => {
    const { spy } = mockSiteverify();
    const response = await run(post(validBody({ turnstile_token: undefined })));
    expect(response.status).toBe(422);
    expect(spy).not.toHaveBeenCalled();
  });

  it("503 when siteverify is unreachable or answers non-200, storing nothing", async () => {
    for (const verdict of ["network-error", { status: 500 }] as const) {
      mockSiteverify(verdict);
      const response = await run(post());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
      vi.restoreAllMocks();
    }
    expect(await rows()).toHaveLength(0);
  });

  it("sends the secret, token, remoteip and idempotency_key, and no form field", async () => {
    const { calls } = mockSiteverify();
    const body = validBody({ turnstile_token: "tok-abc" });
    await run(post(body));
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SITEVERIFY);
    const sent = calls[0].body;
    expect([...sent.keys()].sort()).toEqual(["idempotency_key", "remoteip", "response", "secret"]);
    expect(sent.get("secret")).toBe(env.TURNSTILE_SECRET_KEY);
    expect(sent.get("response")).toBe("tok-abc");
    expect(sent.get("remoteip")).toBe("203.0.113.7");
    expect(sent.get("idempotency_key")).toBe(body.submission_id);
  });
});

describe("POST /api/contact: D1 failure", () => {
  it("503 with nothing stored when the insert fails", async () => {
    mockSiteverify();
    const real = env.DB.prepare.bind(env.DB);
    vi.spyOn(env.DB, "prepare").mockImplementation((sql: string) => {
      if (sql.trim().toUpperCase().startsWith("INSERT")) throw new Error("d1 down");
      return real(sql);
    });
    const response = await run(post());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
    vi.restoreAllMocks();
    expect(await rows()).toHaveLength(0);
  });
});

describe("POST /api/contact: validation rows (FR-008e, FR-012a)", () => {
  async function fieldsFor(overrides: Record<string, unknown>) {
    const { spy } = mockSiteverify();
    const response = await run(post(validBody(overrides)));
    expect(response.status).toBe(400);
    const json = (await response.json()) as { ok: boolean; error: string; fields: Record<string, string> };
    expect(json.ok).toBe(false);
    expect(json.error).toBe("validation");
    expect(spy).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
    vi.restoreAllMocks();
    return json.fields;
  }

  it("returns several field errors together", async () => {
    expect(await fieldsFor({ name: "", email: "nope", message: "", consent: false })).toEqual({
      name: "required",
      email: "invalid",
      message: "required",
      consent: "required",
    });
  });

  it("treats whitespace-only values as empty", async () => {
    expect(await fieldsFor({ name: "   \t", email: "  ", message: "\n\n" })).toEqual({
      name: "required",
      email: "required",
      message: "required",
    });
  });

  it("requires consent to be exactly true", async () => {
    expect(await fieldsFor({ consent: false })).toEqual({ consent: "required" });
    expect(await fieldsFor({ consent: "yes" })).toEqual({ consent: "required" });
    expect(await fieldsFor({ consent: undefined })).toEqual({ consent: "required" });
  });

  it("flags an invalid submission id", async () => {
    expect(await fieldsFor({ submission_id: "not-a-uuid" })).toEqual({ submission_id: "invalid" });
  });

  it("accepts values at the limits and refuses one character more", async () => {
    mockSiteverify();
    const atLimit = validBody({
      name: "n".repeat(100),
      email: `${"e".repeat(242)}@example.com`,
      organization: "o".repeat(100),
      project: "p".repeat(100),
      message: "m".repeat(5000),
    });
    // The body is over the 10 KiB cap only past ~10,240 bytes; this one is about 5.6 KB.
    expect((await run(post(atLimit))).status).toBe(200);
    vi.restoreAllMocks();
    await clearRows();

    expect(
      await fieldsFor({
        name: "n".repeat(101),
        email: `${"e".repeat(243)}@example.com`,
        organization: "o".repeat(101),
        project: "p".repeat(101),
        message: "m".repeat(5001),
      }),
    ).toEqual({
      name: "too_long",
      email: "too_long",
      organization: "too_long",
      project: "too_long",
      message: "too_long",
    });
  });

  it("checks the email format after the length", async () => {
    for (const email of ["plain", "a@b", "a b@c.d", "@c.d"]) {
      expect(await fieldsFor({ email }), email).toEqual({ email: "invalid" });
    }
  });

  it("400 invalid_json also for an empty body", async () => {
    mockSiteverify();
    const response = await run(post(""));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_json" });
  });

  it("503 with nothing stored when the duplicate check fails", async () => {
    const { spy } = mockSiteverify();
    const real = env.DB.prepare.bind(env.DB);
    vi.spyOn(env.DB, "prepare").mockImplementation((sql: string) => {
      if (sql.trim().toUpperCase().startsWith("SELECT")) throw new Error("d1 down");
      return real(sql);
    });
    const response = await run(post());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    expect(await rows()).toHaveLength(0);
  });

  it("503 with nothing stored when the insert rejects at run time", async () => {
    mockSiteverify();
    const real = env.DB.prepare.bind(env.DB);
    vi.spyOn(env.DB, "prepare").mockImplementation((sql: string) => {
      const statement = real(sql);
      if (sql.trim().toUpperCase().startsWith("INSERT")) {
        vi.spyOn(statement, "bind").mockReturnValue({ run: () => Promise.reject(new Error("d1 down")) } as never);
      }
      return statement;
    });
    const response = await run(post());
    expect(response.status).toBe(503);
    vi.restoreAllMocks();
    expect(await rows()).toHaveLength(0);
  });
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

async function seedFor(ip: string, ages: number[]) {
  const hash = await ipHashFor(ip);
  for (const age of ages) await seedMessage({ ip_hash: hash, received_at: Date.now() - age });
}

describe("POST /api/contact: honeypot leaves no trace", () => {
  it("makes no D1 access at all for a filled website field", async () => {
    const { spy } = mockSiteverify();
    const prepare = vi.spyOn(env.DB, "prepare");
    const response = await run(post(validBody({ website: "x" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(prepare).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact: rate limit", () => {
  it("accepts three in an hour and refuses the fourth with 429 and Retry-After", async () => {
    mockSiteverify();
    for (let i = 0; i < 3; i += 1) expect((await run(post())).status).toBe(200);
    const response = await run(post());
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, error: "rate_limited" });
    const retry = Number(response.headers.get("Retry-After"));
    expect(retry).toBeGreaterThan(3500);
    expect(retry).toBeLessThanOrEqual(3600);
    expect(await rows()).toHaveLength(3);
  });

  it("refuses the sixth in a day once the hour has cleared", async () => {
    mockSiteverify();
    await seedFor("203.0.113.7", [2 * HOUR, 3 * HOUR, 4 * HOUR, 5 * HOUR, 6 * HOUR]);
    const response = await run(post());
    expect(response.status).toBe(429);
    const retry = Number(response.headers.get("Retry-After"));
    expect(retry).toBeGreaterThan(17 * 3600);
    expect(retry).toBeLessThanOrEqual(18 * 3600);
  });

  it("window edges: a row just inside the hour counts, just outside does not", async () => {
    mockSiteverify();
    await seedFor("203.0.113.7", [HOUR - 5000, 30 * MINUTE, 10 * MINUTE]);
    expect((await run(post())).status).toBe(429);
    await clearRows();
    await seedFor("203.0.113.7", [HOUR + 5000, 30 * MINUTE, 10 * MINUTE]);
    expect((await run(post())).status).toBe(200);
  });

  it("window edges: a row just inside the day counts, just outside does not", async () => {
    mockSiteverify();
    await seedFor("203.0.113.7", [DAY - 5000, 5 * HOUR, 4 * HOUR, 3 * HOUR, 2 * HOUR]);
    expect((await run(post())).status).toBe(429);
    await clearRows();
    await seedFor("203.0.113.7", [DAY + 5000, 5 * HOUR, 4 * HOUR, 3 * HOUR, 2 * HOUR]);
    expect((await run(post())).status).toBe(200);
  });

  it("refused submissions do not count", async () => {
    mockSiteverify({ success: false });
    for (let i = 0; i < 6; i += 1) expect((await run(post())).status).toBe(422);
    vi.restoreAllMocks();
    mockSiteverify();
    expect((await run(post())).status).toBe(200);
    expect(await rows()).toHaveLength(1);
  });

  it("keeps different senders independent", async () => {
    mockSiteverify();
    await seedFor("203.0.113.7", [MINUTE, 2 * MINUTE, 3 * MINUTE]);
    expect((await run(post())).status).toBe(429);
    expect((await run(post(validBody(), { "CF-Connecting-IP": "198.51.100.9" }))).status).toBe(200);
  });

  it("ignores X-Forwarded-For", async () => {
    mockSiteverify();
    await seedFor("203.0.113.7", [MINUTE, 2 * MINUTE, 3 * MINUTE]);
    const spoofed = await run(post(validBody(), { "X-Forwarded-For": "198.51.100.77" }));
    expect(spoofed.status).toBe(429);
    const other = await run(post(validBody(), { "CF-Connecting-IP": "198.51.100.9", "X-Forwarded-For": "203.0.113.7" }));
    expect(other.status).toBe(200);
  });

  it("counts every request without CF-Connecting-IP against one shared unknown sender", async () => {
    mockSiteverify();
    const noIp = () => {
      const request = post();
      request.headers.delete("CF-Connecting-IP");
      return request;
    };
    for (let i = 0; i < 3; i += 1) expect((await run(noIp())).status).toBe(200);
    expect((await run(noIp())).status).toBe(429);
    const stored = await rows();
    expect(new Set(stored.map((row) => row.ip_hash)).size).toBe(1);
    expect(stored[0].ip_hash).toBe(await ipHashFor("unknown"));
  });

  it("fails closed with 503 and stores nothing when the count query fails", async () => {
    mockSiteverify();
    const real = env.DB.prepare.bind(env.DB);
    vi.spyOn(env.DB, "prepare").mockImplementation((sql: string) => {
      if (sql.includes("ip_hash = ?1")) throw new Error("d1 down");
      return real(sql);
    });
    const response = await run(post());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
    vi.restoreAllMocks();
    expect(await rows()).toHaveLength(0);
  });
});
