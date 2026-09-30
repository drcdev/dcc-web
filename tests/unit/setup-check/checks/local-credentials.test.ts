import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/local-credentials.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom } from "./test-helpers.ts";

const ALL_SET = {
  CLOUDFLARE_API_TOKEN: "cf-token-value",
  CLOUDFLARE_ACCOUNT_ID: "acct-123",
  CLOUDFLARE_ZONE_ID: "zone-123",
};

describe("checks/local-credentials", () => {
  it("is complete when every required .env name is set and Cloudflare reports the token active", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ALL_SET),
      cloudflare: { verifyToken: async () => ({ status: "active" }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.nextAction).toBeNull();
    expect(result.step).toBe(`Step 2 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#local-credentials");
  });

  it("is missing when a required .env name is absent, and names it", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({ CLOUDFLARE_ACCOUNT_ID: "acct-123" }),
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toContain("CLOUDFLARE_API_TOKEN");
    expect(result.summary).toContain("CLOUDFLARE_ZONE_ID");
    expect(result.nextAction).toMatch(/\.env/);
  });

  it("is missing when every name is set but Cloudflare does not report the token active", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ALL_SET),
      cloudflare: { verifyToken: async () => ({ status: "disabled" }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/disabled/);
    expect(result.nextAction).toMatch(/token/i);
  });

  it("is could-not-check when the Cloudflare token-verify call fails", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ALL_SET),
      cloudflare: {
        verifyToken: async () => {
          throw new ProviderAccessError("Cloudflare rejected the API token (401).");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/401/);
    expect(result.nextAction).toBeTruthy();
  });
});
