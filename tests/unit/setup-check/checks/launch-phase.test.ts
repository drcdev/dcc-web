import { describe, expect, it, vi } from "vitest";
import { detectLaunchPhase } from "../../../../scripts/setup-check/checks/launch-phase.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { CloudflareWorkerDomain } from "../../../../scripts/setup-check/types.ts";
import { envFrom, expectRedacted, fakeProviderContext, loadFixture } from "./test-helpers.ts";

const TOKEN = "cf-token-0123456789abcdefghij";
const ACCOUNT = "acct0123456789abcdef0123456789ab";
const config = { workerName: "dcc-web", zone: "doncoleman.ca", reviewHost: "new.doncoleman.ca" };

function ctxWith(
  domains: () => Promise<CloudflareWorkerDomain[]>,
  env: Record<string, string | undefined> = { CLOUDFLARE_API_TOKEN: TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT },
) {
  return fakeProviderContext({
    env: envFrom(env),
    fs: { readJson: vi.fn(() => config) as never },
    cloudflare: { listWorkerDomains: vi.fn(domains) },
  });
}

const fixtureDomains = (name: string) => async () => loadFixture<CloudflareWorkerDomain[]>("cloudflare", name);

describe("detectLaunchPhase (T006)", () => {
  it("is switched when the apex is a Custom Domain on the Worker", async () => {
    const ctx = ctxWith(fixtureDomains("worker-domains-apex-switched"));
    await expect(detectLaunchPhase(ctx)).resolves.toBe("switched");
    expect(ctx.cloudflare.listWorkerDomains).toHaveBeenCalledWith(ACCOUNT, "doncoleman.ca");
  });

  it("is before-switch when only the review host is a Custom Domain", async () => {
    await expect(detectLaunchPhase(ctxWith(fixtureDomains("worker-domains-review-host")))).resolves.toBe("before-switch");
  });

  it("is before-switch when there are no Custom Domains", async () => {
    await expect(detectLaunchPhase(ctxWith(fixtureDomains("worker-domains-empty")))).resolves.toBe("before-switch");
  });

  it("is before-switch when the apex belongs to a different Worker", async () => {
    await expect(detectLaunchPhase(ctxWith(fixtureDomains("worker-domains-apex-other-worker")))).resolves.toBe("before-switch");
  });

  it("throws ProviderAccessError naming CLOUDFLARE_API_TOKEN when the token is missing, and never reads", async () => {
    const ctx = ctxWith(async () => [], { CLOUDFLARE_ACCOUNT_ID: ACCOUNT });
    const error = await detectLaunchPhase(ctx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderAccessError);
    expect((error as ProviderAccessError).reason).toContain("CLOUDFLARE_API_TOKEN");
    expect(ctx.cloudflare.listWorkerDomains).not.toHaveBeenCalled();
  });

  it("throws ProviderAccessError naming CLOUDFLARE_ACCOUNT_ID when the account id is missing", async () => {
    const ctx = ctxWith(async () => [], { CLOUDFLARE_API_TOKEN: TOKEN });
    const error = await detectLaunchPhase(ctx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderAccessError);
    expect((error as ProviderAccessError).reason).toContain("CLOUDFLARE_ACCOUNT_ID");
    expectRedacted(error, [TOKEN, ACCOUNT]);
  });

  it("throws ProviderAccessError, never a guess, when the read fails, with no token or account id in it", async () => {
    const ctx = ctxWith(async () => {
      throw new ProviderAccessError(`Cloudflare rejected ${TOKEN} for account ${ACCOUNT}`);
    });
    const error = await detectLaunchPhase(ctx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderAccessError);
    expectRedacted(error, [TOKEN, ACCOUNT]);
  });

  it("wraps an unexpected error from the read as ProviderAccessError", async () => {
    const ctx = ctxWith(async () => {
      throw new Error(`boom ${ACCOUNT}`);
    });
    const error = await detectLaunchPhase(ctx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderAccessError);
    expectRedacted(error, [TOKEN, ACCOUNT]);
  });
});
