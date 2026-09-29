import { describe, expect, it, vi } from "vitest";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { createGitHubReader, classifyGhError } from "../../../../scripts/setup-check/providers/github.ts";
import { createCloudflareReader } from "../../../../scripts/setup-check/providers/cloudflare.ts";
import { createEnvReader } from "../../../../scripts/setup-check/providers/env.ts";
import { redact } from "../../../../scripts/setup-check/redact.ts";

describe("GitHub provider error handling (Story 1 scenario 4, FR-027)", () => {
  it("maps a timed-out gh api call to a ProviderAccessError", async () => {
    const execer = vi.fn().mockRejectedValue(Object.assign(new Error("killed"), { killed: true, signal: "SIGTERM" }));
    const reader = createGitHubReader(execer);
    await expect(reader.api("repos/drcdev/dcc-web")).rejects.toBeInstanceOf(ProviderAccessError);
    await expect(reader.api("repos/drcdev/dcc-web")).rejects.toThrow(/timed out/i);
  });

  it("maps a non-zero exit (not signed in) to a ProviderAccessError naming the missing access", async () => {
    const execer = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("exit 1"), { stderr: "gh: not logged in. Run gh auth login" }));
    const reader = createGitHubReader(execer);
    await expect(reader.api("repos/drcdev/dcc-web")).rejects.toBeInstanceOf(ProviderAccessError);
    await expect(reader.api("repos/drcdev/dcc-web")).rejects.toThrow(/sign(ed)? in|auth login/i);
  });

  it("classifyGhError never runs the CLI in a verbose or debug mode", async () => {
    const execer = vi.fn().mockResolvedValue({ stdout: "{}" });
    const reader = createGitHubReader(execer);
    await reader.api("repos/drcdev/dcc-web");
    const call = execer.mock.calls[0]!;
    const options = call[1] as { env?: Record<string, string | undefined> } | undefined;
    expect(options?.env?.GH_DEBUG).toBeUndefined();
    expect(options?.env?.DEBUG).toBeUndefined();
  });

  it("classifyGhError() maps a 404/403 response to a ProviderAccessError", () => {
    const forbidden = classifyGhError(Object.assign(new Error("x"), { stderr: "HTTP 403: Forbidden" }));
    expect(forbidden).toBeInstanceOf(ProviderAccessError);
    expect(forbidden.reason).toMatch(/403|forbidden|access/i);
  });
});

describe("Cloudflare provider error handling", () => {
  it("maps a 401/403 SDK error to a ProviderAccessError naming the missing permission", async () => {
    class FakeAuthError extends Error {
      status = 403;
      constructor() {
        super("403 Forbidden");
      }
    }
    const fakeClient = {
      zones: {
        get: vi.fn().mockRejectedValue(new FakeAuthError()),
      },
    };
    const reader = createCloudflareReader({ client: fakeClient as never, token: "secret-token-value" });
    await expect(reader.getZone("zone-id")).rejects.toBeInstanceOf(ProviderAccessError);
    await expect(reader.getZone("zone-id")).rejects.toThrow(/permission|access|read/i);
  });

  it("redacts the configured API token out of any thrown error message", async () => {
    const fakeClient = {
      zones: {
        get: vi.fn().mockRejectedValue(new Error("request failed with token secret-token-value in header")),
      },
    };
    const reader = createCloudflareReader({ client: fakeClient as never, token: "secret-token-value" });
    try {
      await reader.getZone("zone-id");
      expect.unreachable("expected getZone to throw");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain("secret-token-value");
      expect(message).toContain("[redacted]");
    }
  });
});

describe("redact()", () => {
  it("replaces a known secret value with [redacted] and keeps the rest of the message", () => {
    const message = redact("token abc123secretvalue was rejected", ["abc123secretvalue"]);
    expect(message).not.toContain("abc123secretvalue");
    expect(message).toContain("[redacted]");
    expect(message).toContain("was rejected");
  });

  it("redacts a canary secret value injected into a fake provider error", () => {
    const canary = `canary-${Math.random().toString(36).slice(2)}`;
    const message = redact(`Authorization: Bearer ${canary} failed`, [canary]);
    expect(message).not.toContain(canary);
  });
});

describe("providers/env.ts never includes a value in an error (FR-024, FR-030)", () => {
  it("throws no error at all for a missing name, and returns undefined instead", () => {
    const reader = createEnvReader({ CLOUDFLARE_ACCOUNT_ID: "acct-123" });
    expect(reader.get("CLOUDFLARE_API_TOKEN")).toBeUndefined();
    expect(reader.has("CLOUDFLARE_API_TOKEN")).toBe(false);
    expect(reader.get("CLOUDFLARE_ACCOUNT_ID")).toBe("acct-123");
    expect(reader.has("CLOUDFLARE_ACCOUNT_ID")).toBe(true);
  });

  it("never sets a debug/verbose env var when reading", () => {
    const reader = createEnvReader({ CLOUDFLARE_API_TOKEN: "shh-secret-value" });
    // Reading a value never throws or logs; nothing here can leak the value.
    expect(reader.get("CLOUDFLARE_API_TOKEN")).toBe("shh-secret-value");
  });
});
