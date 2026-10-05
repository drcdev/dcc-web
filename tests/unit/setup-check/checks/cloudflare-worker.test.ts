import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/cloudflare-worker.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture } from "./test-helpers.ts";
import type { CloudflareWorkerScript, CloudflareWorkersSubdomain } from "../../../../scripts/setup-check/types.ts";

const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-value", CLOUDFLARE_ACCOUNT_ID: "acct-123" };
const CONFIG = { workerName: "dcc-web" };

describe("checks/cloudflare-worker", () => {
  it("is complete when the Worker exists and the account workers.dev subdomain is on", async () => {
    const script = loadFixture<CloudflareWorkerScript>("cloudflare", "worker-script-dcc-web");
    const subdomain = loadFixture<CloudflareWorkersSubdomain>("cloudflare", "worker-subdomain-enabled");
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: {
        getWorkerScript: async () => script,
        getWorkersSubdomain: async () => subdomain,
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.summary).toBe(
      "Worker dcc-web exists and the account's workers.dev subdomain is on (used by the preview Worker).",
    );
    expect(result.step).toBe(`Step 7 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#cloudflare-worker");
  });

  it("is missing when the Worker does not exist yet", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: { getWorkerScript: async () => null },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toContain("dcc-web");
    expect(result.nextAction).toMatch(/create|import/i);
  });

  it("is missing when the Worker exists but the account workers.dev subdomain is off", async () => {
    const script = loadFixture<CloudflareWorkerScript>("cloudflare", "worker-script-dcc-web");
    const subdomain = loadFixture<CloudflareWorkersSubdomain>("cloudflare", "worker-subdomain-disabled");
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: {
        getWorkerScript: async () => script,
        getWorkersSubdomain: async () => subdomain,
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/account/i);
    expect(result.nextAction).not.toMatch(/preview URLs/i);
  });

  it("is could-not-check when CLOUDFLARE_ACCOUNT_ID is not set", async () => {
    const ctx = fakeProviderContext({ env: envFrom({ CLOUDFLARE_API_TOKEN: "x" }) });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("is could-not-check when the Cloudflare call fails", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => CONFIG) as never },
      cloudflare: {
        getWorkerScript: async () => {
          throw new ProviderAccessError("Cloudflare token lacks Workers Scripts: Read read access (403): x");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/403/);
  });
});
