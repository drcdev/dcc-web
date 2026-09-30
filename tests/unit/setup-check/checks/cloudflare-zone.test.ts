import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/cloudflare-zone.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture, toCloudflareZone } from "./test-helpers.ts";

const ENV = {
  CLOUDFLARE_API_TOKEN: "cf-token-value",
  CLOUDFLARE_ACCOUNT_ID: "acct-123",
  CLOUDFLARE_ZONE_ID: "023e105f4ecef8ad9ca31a8372d0c353",
};
const CONFIG = { zone: "doncoleman.ca" };

describe("checks/cloudflare-zone", () => {
  it("is complete when the zone exists on the Free plan with the configured id", async () => {
    const raw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: { getZone: async (zoneId: string) => (zoneId === ENV.CLOUDFLARE_ZONE_ID ? toCloudflareZone(raw) : (() => { throw new Error("wrong id"); })()) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 3 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#cloudflare-zone");
  });

  it("is could-not-check when CLOUDFLARE_API_TOKEN is not set", async () => {
    const ctx = fakeProviderContext({ env: envFrom({ CLOUDFLARE_ZONE_ID: ENV.CLOUDFLARE_ZONE_ID }) });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_API_TOKEN/);
  });

  it("is could-not-check when CLOUDFLARE_ZONE_ID is not set", async () => {
    const ctx = fakeProviderContext({ env: envFrom({ CLOUDFLARE_API_TOKEN: "x" }) });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_ZONE_ID/);
  });

  it("is missing when the zone is not found", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: {
        getZone: async () => {
          throw new ProviderAccessError("Cloudflare request failed: The specified zone was not found (1049)");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/add|create/i);
  });

  it("is missing when the zone is not on the Free plan", async () => {
    const raw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
    const paidZone = { ...toCloudflareZone(raw), plan: "Business" };
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: { getZone: async () => paidZone },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/free/i);
  });

  it("is could-not-check when the Cloudflare call fails for another reason", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: {
        getZone: async () => {
          throw new ProviderAccessError("Cloudflare token lacks Zone: Read read access (403): x");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/403/);
  });
});
