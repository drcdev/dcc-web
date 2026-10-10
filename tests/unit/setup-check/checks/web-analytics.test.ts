import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/web-analytics.ts";
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
};
const BASELINE = {
  records: [
    {
      type: "A",
      name: "doncoleman.ca",
      content: "192.0.2.10",
      priority: null,
      ttl: 3600,
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

// CloudflareReader.listWebAnalyticsSites returns the already-mapped
// CloudflareWebAnalyticsSite shape (camelCase); the fixture records the raw
// SDK response (snake_case), so tests map it the same way the real provider does.
function toWebAnalyticsSites(
  raw: Array<{ site_tag?: string; host?: string; auto_install?: boolean; ruleset?: { zone_name?: string } }>,
) {
  return raw.map((s) => ({
    siteTag: s.site_tag ?? "",
    host: s.host ?? null,
    autoInstall: Boolean(s.auto_install),
    zoneName: s.ruleset?.zone_name ?? null,
  }));
}

async function siteCompleteContext(overrides: Parameters<typeof fakeProviderContext>[0] = {}) {
  const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
  return fakeProviderContext({
    env: overrides.env ?? envFrom(ENV),
    fs: overrides.fs ?? { readJson: fsWith() },
    cloudflare: {
      getZone: async () => toCloudflareZone(zoneRaw),
      listDnsRecords: async () => [
        { type: "A", name: "doncoleman.ca", content: "192.0.2.10", priority: null, ttl: 3600, proxied: false },
      ],
      listWebAnalyticsSites: async () =>
        toWebAnalyticsSites(loadFixture("cloudflare", "web-analytics-site-present")),
      ...overrides.cloudflare,
    },
    http: overrides.http ?? { get: async () => loadFixture("http", "analytics-beacon-referenced") },
    github: overrides.github ?? {
      api: vi.fn(async (path: string) => {
        if (path.includes("/commits/main/check-runs")) return loadFixture("github", "check-runs-workers-builds-success");
        if (path.startsWith("repos/drcdev/dcc-web/pulls")) return [];
        throw new Error(`unexpected path: ${path}`);
      }) as never,
    },
  });
}

describe("checks/web-analytics", () => {
  it("does not gate on any other item (dependsOn is empty)", () => {
    expect(setupItems.find((i) => i.id === "web-analytics")!.dependsOn).toEqual([]);
  });

  it("checks https://doncoleman.ca/ without reading the Worker's Custom Domains", async () => {
    const urls: string[] = [];
    const get = async (url: string) => {
      urls.push(url);
      return loadFixture("http", "analytics-beacon-referenced") as never;
    };
    const ctx = await siteCompleteContext({
      http: { get },
      cloudflare: {
        listWebAnalyticsSites: async () => [
          { siteTag: "abc123", host: "doncoleman.ca", autoInstall: true, zoneName: null },
        ],
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(urls).toEqual(["https://doncoleman.ca/"]);
  });

  it("is missing when no Web Analytics site exists for doncoleman.ca", async () => {
    const ctx = await siteCompleteContext({
      cloudflare: { listWebAnalyticsSites: async () => loadFixture("cloudflare", "web-analytics-site-absent") },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/no web analytics site/i);
  });

  it("is missing when the only site belongs to another zone", async () => {
    const ctx = await siteCompleteContext({
      cloudflare: {
        listWebAnalyticsSites: async () => [{ siteTag: "other", host: null, autoInstall: true, zoneName: "example.com" }],
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/no web analytics site/i);
  });

  it("is missing when the zone-level site has automatic setup off", async () => {
    const ctx = await siteCompleteContext({
      cloudflare: {
        listWebAnalyticsSites: async () => [{ siteTag: "zone456", host: null, autoInstall: false, zoneName: "doncoleman.ca" }],
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/automatic setup is off/i);
  });

  it("is complete when a zone-level automatic-setup site covers the apex", async () => {
    const ctx = await siteCompleteContext({
      cloudflare: {
        listWebAnalyticsSites: async () =>
          toWebAnalyticsSites(loadFixture("cloudflare", "web-analytics-site-zone-automatic")),
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
  });

  it("is missing when the served page does not reference the Cloudflare beacon", async () => {
    const ctx = await siteCompleteContext({
      http: { get: async () => ({ status: 200, headers: {}, body: "<!doctype html><html><head></head><body></body></html>" }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/beacon/i);
  });

  it("is complete when Web Analytics is on and the beacon is referenced", async () => {
    const ctx = await siteCompleteContext();

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 15 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#web-analytics");
  });

  it("is could-not-check when the Cloudflare provider fails", async () => {
    const ctx = await siteCompleteContext({
      cloudflare: {
        listWebAnalyticsSites: async () => {
          throw new ProviderAccessError("Cloudflare token lacks Account Settings Read access (403)");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
  });
});
