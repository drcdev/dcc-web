import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRows,
  fakeEmail,
  mockSiteverify,
  ORIGIN,
  post,
  rows,
  run,
  SITEVERIFY,
  validBody,
} from "./helpers";

beforeEach(async () => {
  await clearRows();
});
afterEach(() => {
  vi.restoreAllMocks();
});

type SentEmail = { to: string; text: string; subject: string; replyTo?: string };

describe("POST /api/contact: project", () => {
  it("puts the project in the subject and body as plain text with control characters removed", async () => {
    mockSiteverify();
    const email = fakeEmail();
    const response = await run(post(validBody({ project: "  <b>Ca\u0000den\u0007ce</b>\n " })), { CONTACT_EMAIL: email });
    expect(response.status).toBe(200);
    const sent = email.sent[0] as SentEmail;
    expect(sent.subject).toBe("Contact form: Ada Lovelace (about <b>Cadence</b>)");
    expect(sent.text).toContain("Project: <b>Cadence</b>\n");
  });

  it("says 'not given' for an absent, blank or control-only project", async () => {
    for (const project of [undefined, "", "   ", "\u0000\u0001"]) {
      mockSiteverify();
      const email = fakeEmail();
      await run(post(validBody({ project })), { CONTACT_EMAIL: email });
      const sent = email.sent[0] as SentEmail;
      expect(sent.text).toContain("Project: not given\n");
      expect(sent.subject).not.toContain("about");
      vi.restoreAllMocks();
    }
  });

  it("refuses a project over 100 characters after cleaning, and accepts exactly 100", async () => {
    mockSiteverify();
    const email = fakeEmail();
    const tooLong = await run(post(validBody({ project: "p".repeat(101) })), { CONTACT_EMAIL: email });
    expect(tooLong.status).toBe(400);
    expect(await tooLong.json()).toMatchObject({ error: "validation", fields: { project: "too_long" } });
    expect(email.sent).toHaveLength(0);
    const padded = await run(post(validBody({ project: `\u0000${"p".repeat(100)}\u0000` })), { CONTACT_EMAIL: email });
    expect(padded.status).toBe(200);
    expect((email.sent[0] as SentEmail).text).toContain(`Project: ${"p".repeat(100)}\n`);
  });
});

describe("POST /api/contact: accepted", () => {
  it("makes exactly one send to the constant destination and answers 200", async () => {
    mockSiteverify();
    const email = fakeEmail();
    const body = validBody();
    const response = await run(post(body), { CONTACT_EMAIL: email });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(email.sent).toHaveLength(1);
    const sent = email.sent[0] as SentEmail;
    expect(sent.to).toBe("contact@doncoleman.ca");
    expect(sent.replyTo).toBe("ada@example.com");
    expect(sent.text).toContain("Name: Ada Lovelace\n");
    expect(sent.text).toContain("Email: ada@example.com\n");
    expect(sent.text).toContain("Organization: not given\n");
    expect(sent.text).toContain("Message:\nHello there\n");
  });

  it("includes organization and project when given", async () => {
    mockSiteverify();
    const email = fakeEmail();
    const response = await run(post(validBody({ organization: "Analytical Engines", project: "Flux" })), {
      CONTACT_EMAIL: email,
    });
    expect(response.status).toBe(200);
    expect(email.sent).toHaveLength(1);
    const sent = email.sent[0] as SentEmail;
    expect(sent.text).toContain("Organization: Analytical Engines\n");
    expect(sent.text).toContain("Project: Flux\n");
  });

  it("ignores any recipient or header a caller puts in the body", async () => {
    mockSiteverify();
    const email = fakeEmail();
    const response = await run(
      post(validBody({ to: "evil@example.com", cc: "evil@example.com", bcc: "evil@example.com", headers: { Bcc: "x@y.z" } })),
      { CONTACT_EMAIL: email },
    );
    expect(response.status).toBe(200);
    expect(email.sent).toHaveLength(1);
    const sent = email.sent[0] as Record<string, unknown>;
    expect(sent.to).toBe("contact@doncoleman.ca");
    for (const key of ["cc", "bcc", "headers"]) expect(sent, key).not.toHaveProperty(key);
    expect(JSON.stringify(sent)).not.toContain("evil@example.com");
  });

  it("writes nothing to D1", async () => {
    mockSiteverify();
    await run(post(), { CONTACT_EMAIL: fakeEmail() });
    expect(await rows()).toHaveLength(0);
  });

  it("accepts http on 127.0.0.1 and localhost", async () => {
    for (const host of ["127.0.0.1", "localhost"]) {
      mockSiteverify({ success: true, action: "contact", hostname: host });
      const response = await run(post(validBody(), {}, `http://${host}:8787/api/contact`));
      expect(response.status).toBe(200);
      vi.restoreAllMocks();
    }
  });

  it("honeypot returns 200 with no Turnstile call and no send", async () => {
    const { spy } = mockSiteverify();
    const email = fakeEmail();
    const response = await run(post(validBody({ website: "http://spam.example" })), { CONTACT_EMAIL: email });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(spy).not.toHaveBeenCalled();
    expect(email.sent).toHaveLength(0);
  });
});

describe("POST /api/contact: sending fails", () => {
  const failures = [
    "E_SENDER_NOT_VERIFIED",
    "E_RECIPIENT_NOT_ALLOWED",
    "E_RATE_LIMIT_EXCEEDED",
    "E_DELIVERY_FAILED",
    "E_INTERNAL_SERVER_ERROR",
    "",
  ];
  for (const code of failures) {
    it(`503 unavailable with one send and no retry when send() rejects with ${code || "a plain Error"}`, async () => {
      mockSiteverify();
      const email = fakeEmail({ rejectsWith: code });
      const response = await run(post(), { CONTACT_EMAIL: email });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
      expect(email.sent).toHaveLength(1);
    });
  }

  it("503 with zero sends when Turnstile has a network error", async () => {
    mockSiteverify("network-error");
    const email = fakeEmail();
    const response = await run(post(), { CONTACT_EMAIL: email });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
    expect(email.sent).toHaveLength(0);
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

  it("accepts Cloudflare's documented testing-key answer only when ALLOW_TURNSTILE_TESTING is \"true\"", async () => {
    // The always-pass test secret used by the E2E run answers like this (research R6).
    const allow = { ALLOW_TURNSTILE_TESTING: "true" } as const;
    mockSiteverify({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } });
    expect((await run(post(validBody(), {}, "http://127.0.0.1:4321/api/contact"), allow)).status).toBe(200);
    vi.restoreAllMocks();
    mockSiteverify({ success: false, metadata: { result_with_testing_key: true } });
    expect((await run(post(), allow)).status).toBe(422);
  });

  it("422 for a testing-key success when the flag is unset (production config), storing nothing", async () => {
    mockSiteverify({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } });
    const response = await run(post(validBody(), {}, "http://127.0.0.1:4321/api/contact"));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ ok: false, error: "turnstile_failed" });
    expect(await rows()).toHaveLength(0);
  });

  it("422 for a testing-key success unless the flag is exactly \"true\"", async () => {
    for (const value of ["false", "1"]) {
      mockSiteverify({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } });
      const response = await run(post(), { ALLOW_TURNSTILE_TESTING: value } as unknown as Partial<Env>);
      expect(response.status).toBe(422);
      vi.restoreAllMocks();
    }
    expect(await rows()).toHaveLength(0);
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

});

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
