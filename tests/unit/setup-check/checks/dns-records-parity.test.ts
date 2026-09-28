import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/dns-records-parity.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { CloudflareDnsRecord, DnsBaseline, DnsBaselineRecord } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture } from "./test-helpers.ts";

const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-value", CLOUDFLARE_ZONE_ID: "zone-123" };

function keepRecord(partial: Partial<DnsBaselineRecord>): DnsBaselineRecord {
  return {
    type: "A",
    name: "doncoleman.ca",
    content: "192.0.2.10",
    priority: null,
    ttl: 3600,
    source: "squarespace",
    decision: "keep",
    reason: null,
    ...partial,
  };
}

function baseline(records: DnsBaselineRecord[]): DnsBaseline {
  return { originalNameservers: ["ns1.squarespacedns.com", "ns2.squarespacedns.com"], records };
}

function contextWith(baselineValue: DnsBaseline | null, cfRecords: CloudflareDnsRecord[] | (() => Promise<CloudflareDnsRecord[]>)) {
  return fakeProviderContext({
    env: envFrom(ENV),
    fs: { readJson: ((path: string) => (path === "setup/dns-baseline.json" ? baselineValue : null)) as never },
    cloudflare: {
      listDnsRecords: typeof cfRecords === "function" ? cfRecords : async () => cfRecords,
    },
  });
}

describe("checks/dns-records-parity", () => {
  it("is complete when every keep record matches the Cloudflare zone exactly", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-matching-baseline");
    const records = cf.map((r) =>
      keepRecord({ type: r.type as DnsBaselineRecord["type"], name: r.name, content: r.content, priority: r.priority, ttl: r.ttl }),
    );
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 4 of 18");
    expect(result.docs).toBe("docs/setup.md#dns-records-parity");
  });

  it("stays missing with 'record the Squarespace baseline first' when the baseline has no records", async () => {
    const ctx = contextWith({ originalNameservers: [], records: [] }, []);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction?.toLowerCase()).toContain("record the squarespace baseline first");
  });

  it("stays missing with 'record the Squarespace baseline first' when originalNameservers is empty even if records exist", async () => {
    const records = [keepRecord({})];
    const ctx = contextWith({ originalNameservers: [], records }, []);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction?.toLowerCase()).toContain("record the squarespace baseline first");
  });

  it("is missing when a baseline record has no keep/drop decision", async () => {
    const records = [keepRecord({ decision: null })];
    const ctx = contextWith(baseline(records), []);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("doncoleman.ca");
  });

  it("is missing when a keep record's TTL is automatic (1) instead of the exact baseline value", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-automatic-ttl-mismatch");
    const records = [keepRecord({ ttl: 3600 })];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toMatch(/ttl/i);
  });

  it("is missing when a keep record is proxied on instead of DNS only", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-proxied-on");
    const records = [keepRecord({})];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toMatch(/prox/i);
  });

  it("is missing when a keep record has no matching Cloudflare record at all", async () => {
    const { baselineRecord } = loadFixture<{ baselineRecord: DnsBaselineRecord }>(
      "dns",
      "squarespace-only-record-not-in-cloudflare",
    );
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-none");
    const ctx = contextWith(baseline([baselineRecord]), cf);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("doncoleman.ca");
  });

  it("lists Cloudflare-only records in details without blocking completion", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-cloudflare-only-extra");
    const matching = cf.find((r) => r.type === "A")!;
    const records = [keepRecord({ content: matching.content, ttl: matching.ttl })];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.details.join(" ")).toContain("unexpected.doncoleman.ca");
  });

  it("is could-not-check when CLOUDFLARE_API_TOKEN is not set", async () => {
    const ctx = fakeProviderContext({ env: envFrom({ CLOUDFLARE_ZONE_ID: "zone-123" }) });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_API_TOKEN/);
  });

  it("is could-not-check when the Cloudflare DNS records call fails", async () => {
    const records = [keepRecord({})];
    const ctx = contextWith(baseline(records), () => {
      throw new ProviderAccessError("Cloudflare token lacks DNS: Read read access (403): x");
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/403/);
  });
});
