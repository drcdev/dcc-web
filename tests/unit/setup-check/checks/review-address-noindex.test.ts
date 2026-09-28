import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/review-address-noindex.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture, toCloudflareZone } from "./test-helpers.ts";

const ENV = {
  CLOUDFLARE_API_TOKEN: "cf-token-value",
  CLOUDFLARE_ZONE_ID: "zone-123",
  CLOUDFLARE_ACCOUNT_ID: "account-123",
};
const CONFIG = {
  owner: "drcdev",
  repo: "dcc-web",
  zone: "doncoleman.ca",
  workerName: "dcc-web",
  reviewHost: "new.doncoleman.ca",
};
const BASELINE = {
  originalNameservers: ["ns1.squarespacedns.com", "ns2.squarespacedns.com"],
  records: [
    {
      type: "A",
      name: "doncoleman.ca",
      content: "192.0.2.10",
      priority: null,
      ttl: 3600,
      source: "squarespace",
      decision: "keep",
      reason: null,
    },
  ],
};

function fsWith(overrides: Record<string, unknown> = {}) {
  return ((path: string) => {
    if (path === "setup/config.json") return CONFIG;
    if (path === "setup/dns-baseline.json") return overrides.baseline ?? BASELINE;
    return null;
  }) as never;
}

async function reviewAddressCompleteContext(httpGet: (url: string) => Promise<unknown>) {
  const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
  const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-cloudflare-delegated");
  return fakeProviderContext({
    env: envFrom(ENV),
    fs: { readJson: fsWith() },
    dns: { resolveNameservers: async () => answers },
    cloudflare: {
      getZone: async () => toCloudflareZone(zoneRaw),
      listDnsRecords: async () => [
        { type: "A", name: "doncoleman.ca", content: "192.0.2.10", priority: null, ttl: 3600, proxied: false },
      ],
      listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-review-host"),
    },
    http: { get: httpGet as never },
    github: {
      api: vi.fn(async (path: string) => {
        if (path.includes("/commits/main/check-runs")) return loadFixture("github", "check-runs-workers-builds-success");
        if (path.startsWith("repos/drcdev/dcc-web/pulls")) return [];
        throw new Error(`unexpected path: ${path}`);
      }) as never,
    },
  });
}

describe("checks/review-address-noindex", () => {
  it("is missing naming the review address when that prerequisite is not complete", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: fsWith({ baseline: { originalNameservers: [], records: [] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction?.toLowerCase()).toContain("review address");
  });

  it("is complete when X-Robots-Tag: noindex is present on every path checked", async () => {
    const ctx = await reviewAddressCompleteContext(async () => loadFixture("http", "review-host-200-noindex"));

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 17 of 18");
    expect(result.docs).toBe("docs/setup.md#review-address-noindex");
  });

  it("is missing when a path other than / is missing the header, confirming the rule is checked site-wide", async () => {
    const ctx = await reviewAddressCompleteContext(async (url: string) =>
      url.endsWith("/")
        ? loadFixture("http", "review-host-200-noindex")
        : loadFixture("http", "review-host-indexable-missing-header"),
    );

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("/preview-check");
  });

  it("is could-not-check when the review host becomes unreachable during this check's own fetches", async () => {
    // The first http.get call is review-address's own prerequisite check
    // (fetching "/"), which must succeed so the prerequisite is complete;
    // this check's own subsequent fetches then fail.
    const unreachable = loadFixture<{ error: string }>("http", "review-host-unreachable");
    let calls = 0;
    const ctx = await reviewAddressCompleteContext(async () => {
      calls += 1;
      if (calls === 1) return loadFixture("http", "review-host-200-noindex");
      throw new ProviderAccessError(unreachable.error);
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
  });
});
