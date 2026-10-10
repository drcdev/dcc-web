import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/dns-records-parity.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { CloudflareDnsRecord, DnsBaseline, DnsBaselineRecord } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture } from "./test-helpers.ts";

const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-value", CLOUDFLARE_ZONE_ID: "zone-123", CLOUDFLARE_ACCOUNT_ID: "account-123" };

function keepRecord(partial: Partial<DnsBaselineRecord>): DnsBaselineRecord {
  return {
    type: "A",
    name: "doncoleman.ca",
    content: "192.0.2.10",
    priority: null,
    ttl: 3600,
    ...partial,
  };
}

function baseline(records: DnsBaselineRecord[]): DnsBaseline {
  return { records };
}

function contextWith(
  baselineValue: DnsBaseline | null,
  cfRecords: CloudflareDnsRecord[] | (() => Promise<CloudflareDnsRecord[]>),
) {
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
    expect(result.step).toBe(`Step 4 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#dns-records-parity");
  });

  it("stays missing, so it never passes vacuously, when the baseline has no records", async () => {
    const ctx = contextWith({ records: [] }, []);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toBe("The DNS baseline has no records.");
  });

  it("is complete, with an informational TTL note, when a keep record differs from Cloudflare only by TTL (Cloudflare auto vs. baseline value)", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-automatic-ttl-mismatch");
    const records = [keepRecord({ ttl: 3600 })];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    const details = result.details.join(" ");
    expect(details).toMatch(/ttl/i);
    expect(details).toContain("TTL differs (informational): Cloudflare auto, baseline 3600");
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
    const baselineRecord = keepRecord({ type: "TXT", content: "v=spf1 include:_spf.example.net -all" });
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-none");
    const ctx = contextWith(baseline([baselineRecord]), cf);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("doncoleman.ca");
  });

  it("is missing, naming the record, when Cloudflare holds a record on another name that is not in the baseline", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-cloudflare-only-extra");
    const matching = cf.find((r) => r.type === "A")!;
    const records = [keepRecord({ content: matching.content, ttl: matching.ttl })];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("unexpected.doncoleman.ca");
  });

  it("is could-not-check when CLOUDFLARE_API_TOKEN is not set", async () => {
    const ctx = fakeProviderContext({ env: envFrom({ CLOUDFLARE_ZONE_ID: "zone-123" }) });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_API_TOKEN/);
  });

  it("compares the whole zone", async () => {
    const mx = keepRecord({ type: "MX", content: "mx01.mail.icloud.com", priority: 10 });
    const cfMx: CloudflareDnsRecord = { type: "MX", name: "doncoleman.ca", content: "mx01.mail.icloud.com", priority: 10, ttl: 1, proxied: false };
    const wwwAdded: CloudflareDnsRecord = { type: "AAAA", name: "www.doncoleman.ca", content: "100::", priority: null, ttl: 1, proxied: true };
    const stray: CloudflareDnsRecord = { type: "A", name: "mail.doncoleman.ca", content: "192.0.2.9", priority: null, ttl: 1, proxied: false };

    const informational = await check(contextWith(baseline([mx]), [cfMx, wwwAdded]));
    expect(informational.status).toBe("complete");
    expect(informational.details.join("\n")).toContain("Cloudflare-only, not in baseline: AAAA www.doncoleman.ca 100::");

    const result = await check(contextWith(baseline([mx]), [cfMx, stray]));
    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/^Problem:/);
    expect(result.details.join("\n")).toContain("A mail.doncoleman.ca 192.0.2.9: not in the baseline");
  });

  it("matches two MX records with the same name by content instead of comparing both against the first candidate", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-duplicate-mx-apex");
    const records = [
      keepRecord({ type: "MX", name: "doncoleman.ca", content: "mx01.mail.icloud.com", priority: 10, ttl: 3600 }),
      keepRecord({ type: "MX", name: "doncoleman.ca", content: "mx02.mail.icloud.com", priority: 10, ttl: 3600 }),
    ];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.details).toEqual([]);
  });

  it("matches two TXT records with the same name by content instead of comparing both against the first candidate", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-duplicate-txt-apex");
    const records = [
      keepRecord({
        type: "TXT",
        name: "doncoleman.ca",
        content: "v=spf1 include:_spf.mail.icloud.com include:_spf.example.net -all",
        priority: null,
        ttl: 3600,
      }),
      keepRecord({ type: "TXT", name: "doncoleman.ca", content: "apple-domain=abcdefghijklmnop", priority: null, ttl: 3600 }),
    ];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.details).toEqual([]);
  });

  it("reports 'no Cloudflare record with this content' when one of two same-name records is missing from Cloudflare", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-duplicate-mx-subdomain-one-missing");
    const records = [
      keepRecord({ type: "MX", name: "mail.doncoleman.ca", content: "mx01.mail.icloud.com", priority: 10, ttl: 3600 }),
      keepRecord({ type: "MX", name: "mail.doncoleman.ca", content: "mx02.mail.icloud.com", priority: 20, ttl: 3600 }),
    ];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    const details = result.details.join(" ");
    expect(details).toContain("mx02.mail.icloud.com: no Cloudflare record with this content (found: mx01.mail.icloud.com)");
    expect(details).not.toContain('content is "mx01.mail.icloud.com", expected "mx02.mail.icloud.com"');
  });

  it("excludes a Cloudflare record already claimed by a baseline record from the Cloudflare-only list", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-duplicate-mx-apex");
    const records = [keepRecord({ type: "MX", name: "doncoleman.ca", content: "mx01.mail.icloud.com", priority: 10, ttl: 3600 })];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    const details = result.details.join(" ");
    expect(details).toContain("Cloudflare-only, not in baseline: MX doncoleman.ca mx02.mail.icloud.com");
    expect(details).not.toContain("mx01.mail.icloud.com");
  });

  it("matches a TXT record when Cloudflare returns space-separated quoted chunks and the baseline holds the joined content", async () => {
    const cf = loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-chunked-txt-dkim");
    const records = [
      keepRecord({
        type: "TXT",
        name: "mta._domainkey.mail.doncoleman.ca",
        content: "k=rsa; p=AAAABBBBCCCCDDDDEEEE",
        priority: null,
        ttl: 14400,
      }),
    ];
    const ctx = contextWith(baseline(records), cf);

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.details).toEqual([]);
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

  describe("steady state (FR-010)", () => {
    const mx = keepRecord({ type: "MX", name: "doncoleman.ca", content: "mx01.mail.icloud.com", priority: 10 });
    const cfMx: CloudflareDnsRecord = { type: "MX", name: "doncoleman.ca", content: "mx01.mail.icloud.com", priority: 10, ttl: 1, proxied: false };
    const workerAdded: CloudflareDnsRecord[] = [
      { type: "A", name: "doncoleman.ca", content: "192.0.2.1", priority: null, ttl: 1, proxied: true },
      { type: "AAAA", name: "www.doncoleman.ca", content: "100::", priority: null, ttl: 1, proxied: true },
    ];

    it("is missing with a Problem and the restore-or-delete next action when a record appears on any other name", async () => {
      const stray: CloudflareDnsRecord = { type: "A", name: "stray.doncoleman.ca", content: "192.0.2.9", priority: null, ttl: 1, proxied: false };
      const result = await check(contextWith(baseline([mx]), [cfMx, ...workerAdded, stray]));

      expect(result.status).toBe("missing");
      expect(result.summary).toMatch(/^Problem:/);
      expect(result.details.join("\n")).toContain("stray.doncoleman.ca");
      expect(result.nextAction).toContain("delete the unexpected record");
    });

    it("is missing with a Problem when a kept mail record was removed or changed", async () => {
      const result = await check(contextWith(baseline([mx]), [...workerAdded]));

      expect(result.status).toBe("missing");
      expect(result.summary).toMatch(/^Problem:/);
      expect(result.details.join("\n")).toContain("MX doncoleman.ca mx01.mail.icloud.com");
    });
  });
});
