import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeEmail, mockSiteverify, post, run, validBody } from "./helpers";

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submit logging", () => {
  const cases: [string, () => Request, () => void, string][] = [
    ["sent", () => post(validBody({ name: "Zed Secretname" })), () => mockSiteverify(), "sent"],
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

  it("logs exactly one line for a sent submission", async () => {
    mockSiteverify();
    capture();
    await run(post());
    expect(lines).toHaveLength(1);
  });

  it("logs the error name and E_* code, and nothing else, when send() fails", async () => {
    mockSiteverify();
    capture();
    const email = fakeEmail({ rejectsWith: "E_DELIVERY_FAILED" });
    await run(post(validBody({ name: "Zed Secretname" })), { CONTACT_EMAIL: email });
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(parsed).toEqual({
      event: "contact",
      outcome: "unavailable",
      name: "Error",
      code: "E_DELIVERY_FAILED",
    });
  });
});
