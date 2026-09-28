import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dnsBaselineSchema } from "../../../scripts/setup-check/schemas.ts";

const baselinePath = fileURLToPath(new URL("../../../setup/dns-baseline.json", import.meta.url));

function readBaseline(): unknown {
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

describe("setup/dns-baseline.json", () => {
  it("exists and matches the { originalNameservers, records } schema", () => {
    const baseline = readBaseline();
    const result = dnsBaselineSchema.safeParse(baseline);
    expect(result.success, result.success ? "" : result.error?.message).toBe(true);
  });

  it("is schema-valid starting empty (Don fills it in during the walkthrough)", () => {
    const baseline = readBaseline() as { originalNameservers: unknown[]; records: unknown[] };
    expect(Array.isArray(baseline.originalNameservers)).toBe(true);
    expect(Array.isArray(baseline.records)).toBe(true);
  });
});

describe("dnsBaselineSchema record-level rules", () => {
  const base = {
    type: "A",
    name: "doncoleman.ca",
    content: "192.0.2.1",
    priority: null,
    ttl: 3600,
    source: "squarespace",
    decision: "keep",
    reason: null,
  };

  it("rejects a record missing a field", () => {
    const withoutName: Record<string, unknown> = { ...base };
    delete withoutName.name;
    const result = dnsBaselineSchema.safeParse({ originalNameservers: [], records: [withoutName] });
    expect(result.success).toBe(false);
  });

  it("rejects an MX record without a priority", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [{ ...base, type: "MX", priority: null }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a drop decision without a reason", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [{ ...base, decision: "drop", reason: null }],
    });
    expect(result.success).toBe(false);
  });
});
