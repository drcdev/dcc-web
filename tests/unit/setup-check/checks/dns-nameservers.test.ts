import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/dns-nameservers.ts";
import type { CloudflareDnsRecord } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture, toCloudflareZone } from "./test-helpers.ts";

const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-value", CLOUDFLARE_ZONE_ID: "zone-123" };
const CONFIG = { zone: "doncoleman.ca" };

const completeBaselineFs = (extra: Record<string, unknown> = {}) =>
  ((path: string) => {
    if (path === "setup/config.json") return CONFIG;
    if (path === "setup/dns-baseline.json") {
      return {
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
    }
    return extra[path] ?? null;
  }) as never;

function contextWith(opts: {
  nameservers: string[];
  zone: ReturnType<typeof toCloudflareZone>;
  cfRecords?: CloudflareDnsRecord[];
}) {
  return fakeProviderContext({
    env: envFrom(ENV),
    fs: { readJson: completeBaselineFs() },
    dns: { resolveNameservers: async () => opts.nameservers },
    cloudflare: {
      getZone: async () => opts.zone,
      listDnsRecords: async () =>
        opts.cfRecords ?? [{ type: "A", name: "doncoleman.ca", content: "192.0.2.10", priority: null, ttl: 3600, proxied: false }],
    },
  });
}

describe("checks/dns-nameservers", () => {
  it("is missing with 'complete DNS parity first' when dns-records-parity is not complete", async () => {
    const ctx = fakeProviderContext({
      env: envFrom(ENV),
      fs: { readJson: (() => ({ originalNameservers: [], records: [] })) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction?.toLowerCase()).toContain("complete dns parity first");
  });

  it("is complete when public NS equal the zone's assigned nameservers and the zone is active", async () => {
    const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
    const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-cloudflare-delegated");
    const ctx = contextWith({ nameservers: answers, zone: toCloudflareZone(zoneRaw) });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 5 of 18");
    expect(result.docs).toBe("docs/setup.md#dns-nameservers");
  });

  it("is pending while delegation is propagating (mixed answers)", async () => {
    const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
    const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-delegation-pending");
    const ctx = contextWith({ nameservers: answers, zone: toCloudflareZone(zoneRaw) });

    const result = await check(ctx);

    expect(result.status).toBe("pending");
    expect(result.nextAction).toMatch(/no action|wait|propagat/i);
  });

  it("is pending when NS already match but the zone is not yet active", async () => {
    const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-pending-nameservers");
    const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-cloudflare-delegated");
    const ctx = contextWith({ nameservers: answers, zone: toCloudflareZone(zoneRaw) });

    const result = await check(ctx);

    expect(result.status).toBe("pending");
  });

  it("is missing when public NS still point at Squarespace", async () => {
    const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
    const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-squarespace-not-delegated");
    const ctx = contextWith({ nameservers: answers, zone: toCloudflareZone(zoneRaw) });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/squarespace/i);
  });
});
