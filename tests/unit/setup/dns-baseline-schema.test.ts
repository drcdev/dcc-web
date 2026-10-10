// Layer: unit. setup/dns-baseline.json is the must-exist list of the zone's records.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dnsBaselineSchema } from "../../../scripts/setup-check/schemas.ts";

const baselinePath = fileURLToPath(new URL("../../../setup/dns-baseline.json", import.meta.url));

function readBaseline(): unknown {
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

describe("setup/dns-baseline.json", () => {
  it("exists and matches the strict { records } schema", () => {
    const result = dnsBaselineSchema.safeParse(readBaseline());
    expect(result.success, result.success ? "" : result.error?.message).toBe(true);
  });
});

describe("dnsBaselineSchema record-level rules", () => {
  const base = {
    type: "A",
    name: "doncoleman.ca",
    content: "192.0.2.1",
    priority: null,
    ttl: 3600,
  };

  it("accepts a record with only type, name, content, priority and ttl", () => {
    expect(dnsBaselineSchema.safeParse({ records: [base] }).success).toBe(true);
  });

  it("rejects a record missing a field", () => {
    const withoutName: Record<string, unknown> = { ...base };
    delete withoutName.name;
    expect(dnsBaselineSchema.safeParse({ records: [withoutName] }).success).toBe(false);
  });

  it("rejects an MX record without a priority", () => {
    expect(dnsBaselineSchema.safeParse({ records: [{ ...base, type: "MX", priority: null }] }).success).toBe(false);
  });

  it("rejects a record carrying a decision", () => {
    expect(dnsBaselineSchema.safeParse({ records: [{ ...base, decision: "keep" }] }).success).toBe(false);
  });

  it("rejects a record carrying a source or a reason", () => {
    expect(dnsBaselineSchema.safeParse({ records: [{ ...base, source: "squarespace" }] }).success).toBe(false);
    expect(dnsBaselineSchema.safeParse({ records: [{ ...base, reason: null }] }).success).toBe(false);
  });

  it("rejects a top-level originalNameservers", () => {
    expect(dnsBaselineSchema.safeParse({ originalNameservers: ["ns1.example.net"], records: [base] }).success).toBe(false);
  });
});

describe("setup/dns-baseline.json: must-exist records", () => {
  type Record_ = { type: string; name: string; content: string };
  const records = (readBaseline() as { records: Record_[] }).records;
  const zone = "doncoleman.ca";
  const apexTxt = records.filter((r) => r.type === "TXT" && r.name === zone);

  it("has an MX to each iCloud mail host", () => {
    for (const host of ["mx01.mail.icloud.com", "mx02.mail.icloud.com"]) {
      expect(records.some((r) => r.type === "MX" && r.name === zone && r.content === host)).toBe(true);
    }
  });

  it("has the apex SPF, apple-domain and Google verification TXT records", () => {
    expect(apexTxt.some((r) => r.content.startsWith("v=spf1") && r.content.includes("include:icloud.com"))).toBe(true);
    expect(apexTxt.some((r) => r.content.startsWith("apple-domain="))).toBe(true);
    expect(apexTxt.some((r) => r.content.startsWith("google-site-verification="))).toBe(true);
  });

  it("has the iCloud DKIM CNAME", () => {
    expect(records.some((r) => r.type === "CNAME" && r.name === `sig1._domainkey.${zone}`)).toBe(true);
  });

  it("has the DMARC and CAA records, so dns-records-parity guards them (#93)", () => {
    expect(records.some((r) => r.type === "TXT" && r.name === `_dmarc.${zone}` && r.content.startsWith("v=DMARC1"))).toBe(true);
    expect(records.some((r) => r.type === "CAA" && r.name === zone && /^\d+ issue "/.test(r.content))).toBe(true);
  });

  it("names no retired Ghost, Mailgun or Squarespace record", () => {
    for (const r of records) {
      expect(r.content.toLowerCase()).not.toMatch(/mailgun|mymagic\.page|squarespace/);
    }
  });
});
