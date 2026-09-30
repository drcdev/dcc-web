import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, clearRows, mockSiteverify, post, run, seedMessage, validBody } from "./helpers";

const METHODS = ["log", "info", "warn", "error", "debug"] as const;

let lines: string[];

function capture() {
  lines = [];
  for (const method of METHODS) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      lines.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    });
  }
}

beforeEach(async () => {
  await clearRows();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("submit logging", () => {
  const cases: [string, () => Request, () => void, string][] = [
    ["stored", () => post(validBody({ name: "Zed Secretname" })), () => mockSiteverify(), "stored"],
    ["honeypot", () => post(validBody({ website: "spam" })), () => mockSiteverify(), "honeypot"],
    ["invalid", () => post(validBody({ email: "Zed@secret.example x" })), () => mockSiteverify(), "invalid"],
    [
      "turnstile_failed",
      () => post(validBody({ turnstile_token: "secret-token-value" })),
      () => mockSiteverify({ success: false }),
      "turnstile_failed",
    ],
    ["unavailable", () => post(validBody()), () => mockSiteverify("network-error"), "unavailable"],
    ["forbidden", () => post(validBody(), { Origin: "https://evil.example" }), () => mockSiteverify(), "forbidden"],
    [
      "too_large",
      () => post(validBody({ message: "x".repeat(11_000) }), { "Content-Length": "11000" }),
      () => mockSiteverify(),
      "too_large",
    ],
  ];

  for (const [label, request, setup, outcome] of cases) {
    it(`logs at most one outcome-only line for ${label}`, async () => {
      setup();
      capture();
      await run(request());
      expect(lines.length).toBeLessThanOrEqual(1);
      for (const line of lines) {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        expect(parsed.event).toBe("contact");
        expect(parsed.outcome).toBe(outcome);
        const allowed = outcome === "unavailable" ? ["event", "outcome", "name"] : ["event", "outcome"];
        expect(Object.keys(parsed).sort()).toEqual([...allowed].sort());
        if (outcome === "unavailable") expect(typeof parsed.name).toBe("string");
        for (const secret of ["203.0.113.7", "Zed", "secret", "ada@example.com", "Hello there", "network down"]) {
          expect(line).not.toContain(secret);
        }
        expect(line).not.toMatch(/[0-9a-f]{64}/);
      }
    });
  }

  it("logs exactly one line for a stored submission", async () => {
    mockSiteverify();
    capture();
    await run(post());
    expect(lines).toHaveLength(1);
  });
});

describe("retrieval logging", () => {
  it("logs nothing that identifies a message, token or caller", async () => {
    const id = await seedMessage({ name: "Zed Secretname" });
    const requests = [
      () => api("/api/messages/new", { token: null }),
      () => api("/api/messages/new", { token: "wrong-secret-token" }),
      () => api("/api/messages/new"),
      () => api(`/api/messages/${id}/read`, { method: "POST" }),
      () => api(`/api/messages/${id}/read`, { method: "POST" }),
      () => api(`/api/messages/${crypto.randomUUID()}/read`, { method: "POST" }),
      () => api("/api/messages/new?limit=0"),
    ];
    for (const request of requests) {
      capture();
      await run(request());
      expect(lines.length).toBeLessThanOrEqual(1);
      for (const line of lines) {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        expect(parsed.event).toBe("messages");
        expect(Object.keys(parsed).sort()).toEqual(["event", "outcome"]);
        for (const secret of [id, "Zed", "Secretname", "test-read-token", "wrong-secret-token", "ada@example.com", "Hello"]) {
          expect(line).not.toContain(secret);
        }
      }
      vi.restoreAllMocks();
    }
  });
});
