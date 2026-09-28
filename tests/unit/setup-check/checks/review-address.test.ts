import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/review-address.ts";
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

function githubApi(routes: { mainRuns?: unknown; prs?: unknown } = {}) {
  return vi.fn(async (path: string) => {
    if (path.includes("/commits/main/check-runs")) {
      return routes.mainRuns ?? loadFixture("github", "check-runs-workers-builds-success");
    }
    if (path.startsWith("repos/drcdev/dcc-web/pulls")) return routes.prs ?? [];
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

async function dependenciesSatisfiedContext(overrides: Parameters<typeof fakeProviderContext>[0] = {}) {
  const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
  const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-cloudflare-delegated");
  return fakeProviderContext({
    env: overrides.env ?? envFrom(ENV),
    fs: overrides.fs ?? { readJson: fsWith() },
    dns: { resolveNameservers: async () => answers, ...overrides.dns },
    cloudflare: {
      getZone: async () => toCloudflareZone(zoneRaw),
      listDnsRecords: async () => [
        { type: "A", name: "doncoleman.ca", content: "192.0.2.10", priority: null, ttl: 3600, proxied: false },
      ],
      listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-review-host"),
      ...overrides.cloudflare,
    },
    http: overrides.http ?? { get: async () => loadFixture("http", "review-host-200-noindex") },
    github: overrides.github ?? { api: githubApi() },
  });
}

describe("checks/review-address", () => {
  it("is missing naming DNS nameservers when that prerequisite is not complete", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: fsWith({ baseline: { originalNameservers: [], records: [] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction?.toLowerCase()).toContain("dns nameservers");
  });

  it("is missing naming Workers Builds when DNS nameservers is complete but Workers Builds is not", async () => {
    const ctx = await dependenciesSatisfiedContext({
      github: { api: githubApi({ mainRuns: { check_runs: [] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction?.toLowerCase()).toContain("workers builds");
  });

  it("is missing when new.doncoleman.ca is not a Custom Domain on dcc-web yet", async () => {
    const ctx = await dependenciesSatisfiedContext({
      cloudflare: { listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-empty") },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/custom domain/i);
  });

  it("is missing when the review address does not return 200", async () => {
    const ctx = await dependenciesSatisfiedContext({
      http: { get: async () => ({ status: 503, headers: {}, body: "" }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toContain("503");
  });

  it("is complete when the Custom Domain exists and returns 200 over HTTPS", async () => {
    const ctx = await dependenciesSatisfiedContext();

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 16 of 18");
    expect(result.docs).toBe("docs/setup.md#review-address");
  });

  it("is could-not-check when CLOUDFLARE_ACCOUNT_ID is not set (prerequisites need only the token and zone)", async () => {
    const ctx = await dependenciesSatisfiedContext({
      env: envFrom({ CLOUDFLARE_API_TOKEN: ENV.CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID: ENV.CLOUDFLARE_ZONE_ID }),
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("is could-not-check when the Cloudflare provider fails", async () => {
    const ctx = await dependenciesSatisfiedContext({
      cloudflare: {
        listWorkerDomains: async () => {
          throw new ProviderAccessError("Cloudflare rejected the API token (401)");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
  });
});
