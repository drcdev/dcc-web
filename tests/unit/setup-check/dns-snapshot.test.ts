import { describe, expect, it, vi } from "vitest";
import type { DnsAnswer, DnsBaseline, DnsReader, DnsRecordType } from "../../../scripts/setup-check/types.ts";
import {
  buildCandidateNames,
  takeDnsSnapshot,
  writeSnapshotFile,
} from "../../../scripts/setup-check/dns-snapshot.ts";

function fakeResolver(answers: Record<string, DnsAnswer[]>): DnsReader {
  return {
    resolve: vi.fn(async (name: string, type: DnsRecordType) => {
      return answers[`${type}:${name}`] ?? [];
    }),
    resolveNameservers: vi.fn(async () => []),
  };
}

const emptyBaseline: DnsBaseline = { originalNameservers: [], records: [] };

describe("buildCandidateNames", () => {
  it("includes the apex, www, mail, _dmarc and common DKIM selectors", () => {
    const names = buildCandidateNames("doncoleman.ca", emptyBaseline);
    expect(names).toContain("doncoleman.ca");
    expect(names).toContain("www.doncoleman.ca");
    expect(names).toContain("mail.doncoleman.ca");
    expect(names).toContain("_dmarc.doncoleman.ca");
    expect(names.some((n) => n.endsWith("._domainkey.doncoleman.ca"))).toBe(true);
  });

  it("also includes every baseline record name", () => {
    const baseline: DnsBaseline = {
      originalNameservers: [],
      records: [
        {
          type: "TXT",
          name: "custom.doncoleman.ca",
          content: "v=spf1 -all",
          priority: null,
          ttl: 3600,
          source: "squarespace",
          decision: "keep",
          reason: null,
        },
      ],
    };
    const names = buildCandidateNames("doncoleman.ca", baseline);
    expect(names).toContain("custom.doncoleman.ca");
  });
});

describe("takeDnsSnapshot", () => {
  it("resolves every candidate name and reports answers not in the baseline", async () => {
    const resolver = fakeResolver({
      "A:doncoleman.ca": [{ type: "A", name: "doncoleman.ca", value: "192.0.2.1" }],
      "TXT:doncoleman.ca": [
        { type: "TXT", name: "doncoleman.ca", value: "google-site-verification=abc123" },
      ],
    });
    const baseline: DnsBaseline = {
      originalNameservers: [],
      records: [
        {
          type: "A",
          name: "doncoleman.ca",
          content: "192.0.2.1",
          priority: null,
          ttl: 3600,
          source: "squarespace",
          decision: "keep",
          reason: null,
        },
      ],
    };

    const result = await takeDnsSnapshot({ zone: "doncoleman.ca", baseline, resolver });

    // The A record matches the baseline, so it is not reported as unknown.
    expect(result.unknown.some((u) => u.type === "A" && u.name === "doncoleman.ca")).toBe(false);
    // The TXT record has no baseline match, so it is reported.
    expect(
      result.unknown.some(
        (u) => u.type === "TXT" && u.name === "doncoleman.ca" && u.value.includes("google-site-verification"),
      ),
    ).toBe(true);
  });

  it("makes no call other than resolver.resolve", async () => {
    const resolver = fakeResolver({});
    await takeDnsSnapshot({ zone: "doncoleman.ca", baseline: emptyBaseline, resolver });
    expect(resolver.resolve).toHaveBeenCalled();
    expect(resolver.resolveNameservers).not.toHaveBeenCalled();
  });
});

describe("writeSnapshotFile", () => {
  it("writes only to a path ending in setup/dns-snapshot.local.json", () => {
    const writes: { path: string; content: string }[] = [];
    const fakeWrite = (path: string, content: string) => {
      writes.push({ path, content });
    };
    writeSnapshotFile(
      { generatedAt: new Date().toISOString(), zone: "doncoleman.ca", unknown: [] },
      "/tmp/does-not-matter/setup/dns-snapshot.local.json",
      fakeWrite,
    );
    expect(writes).toHaveLength(1);
    expect(writes[0]!.path.endsWith("setup/dns-snapshot.local.json")).toBe(true);
    expect(JSON.parse(writes[0]!.content)).toMatchObject({ zone: "doncoleman.ca" });
  });
});
