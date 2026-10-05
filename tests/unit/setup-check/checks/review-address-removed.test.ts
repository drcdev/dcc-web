import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/review-address-removed.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { CloudflareWorkerDomain, DnsResolverAnswers } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, expectRedacted, loadFixture } from "./test-helpers.ts";

const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-0123456789", CLOUDFLARE_ACCOUNT_ID: "acct-0123456789abcdef" };
const CONFIG = { zone: "doncoleman.ca", workerName: "dcc-web", reviewHost: "new.doncoleman.ca" };

const noAnswers: DnsResolverAnswers[] = [
  { resolver: "1.1.1.1", answers: [] },
  { resolver: "8.8.8.8", answers: [] },
];
const oneAnswers: DnsResolverAnswers[] = [
  { resolver: "1.1.1.1", answers: [{ type: "A", name: "new.doncoleman.ca", value: "192.0.2.1" }] },
  { resolver: "8.8.8.8", answers: [] },
];

const apexOnly: CloudflareWorkerDomain[] = [{ hostname: "doncoleman.ca", service: "dcc-web" }];

function ctxWith(domains: string | CloudflareWorkerDomain[] | (() => Promise<CloudflareWorkerDomain[]>), answers: DnsResolverAnswers[] = noAnswers) {
  const load = async (): Promise<CloudflareWorkerDomain[]> => {
    if (typeof domains === "string") return loadFixture<CloudflareWorkerDomain[]>("cloudflare", domains);
    if (typeof domains === "function") return domains();
    return domains;
  };
  return fakeProviderContext({
    env: envFrom(ENV),
    fs: { readJson: (() => CONFIG) as never },
    cloudflare: {
      listWorkerDomains: async (_account: string, hostname?: string) =>
        (await load()).filter((d) => hostname === undefined || d.hostname === hostname),
    },
    dns: { resolveEach: async () => answers },
  });
}

describe("checks/review-address-removed (T046)", () => {
  it("is waiting before the switch", async () => {
    const result = await check(ctxWith("worker-domains-review-host"));

    expect(result.status).toBe("waiting");
    expect(result.summary).toBe("Waiting for the switch: new.doncoleman.ca stays until the bare domain is live.");
    expect(result.nextAction).toBe("Nothing to do yet. Follow docs/launch.md Part C when the readiness checklist is complete.");
    expect(result.step).toBe(`Step 15 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#review-address-removed");
  });

  it("is missing while a Custom Domain for the review host still exists, with the dashboard path", async () => {
    const result = await check(ctxWith("worker-domains-apex-switched"));

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/^Remove/);
    expect(result.nextAction).toMatch(/Workers & Pages/);
  });

  it("is pending while a resolver still answers for the review host", async () => {
    const result = await check(ctxWith(apexOnly, oneAnswers));

    expect(result.status).toBe("pending");
    expect(result.nextAction).toMatch(/TTL/);
  });

  it("is complete when no Custom Domain exists and both resolvers are empty", async () => {
    const result = await check(ctxWith(apexOnly));

    expect(result.status).toBe("complete");
  });

  it("is could-not-check when the phase cannot be read, and never prints credentials", async () => {
    const result = await check(
      ctxWith(async () => {
        throw new ProviderAccessError(`Cloudflare rejected ${ENV.CLOUDFLARE_API_TOKEN}`);
      }),
    );

    expect(result.status).toBe("could-not-check");
    expectRedacted(result, [ENV.CLOUDFLARE_API_TOKEN, ENV.CLOUDFLARE_ACCOUNT_ID]);
  });
});
