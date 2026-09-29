import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/live-domain-ghost.ts";
import type { DnsAnswer, DnsBaselineRecord, DnsRecordType } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture } from "./test-helpers.ts";

type NameTypeMap = Record<string, Record<string, Array<string | { priority: number; value: string }>>>;

const CONFIG = { zone: "doncoleman.ca", ghostMarker: "Ghost" };

function toBaselineRecords(map: NameTypeMap): DnsBaselineRecord[] {
  const records: DnsBaselineRecord[] = [];
  for (const [name, byType] of Object.entries(map)) {
    for (const [type, values] of Object.entries(byType)) {
      for (const value of values) {
        const isMx = typeof value === "object";
        records.push({
          type: type as DnsBaselineRecord["type"],
          name,
          content: isMx ? (value as { value: string }).value : (value as string),
          priority: isMx ? (value as { priority: number }).priority : null,
          ttl: 3600,
          source: "squarespace",
          decision: "keep",
          reason: null,
        });
      }
    }
  }
  return records;
}

function toResolver(map: NameTypeMap) {
  return async (name: string, type: DnsRecordType): Promise<DnsAnswer[]> => {
    const values = map[name]?.[type] ?? [];
    return values.map((value) =>
      typeof value === "object"
        ? { type, name, value: value.value, priority: value.priority }
        : { type, name, value: value as string },
    );
  };
}

function fsWith(baselineRecords: DnsBaselineRecord[]) {
  return {
    readJson: ((path: string) => {
      if (path === "setup/config.json") return CONFIG;
      if (path === "setup/dns-baseline.json") {
        return { originalNameservers: ["ns1.squarespacedns.com"], records: baselineRecords };
      }
      return null;
    }) as never,
  };
}

describe("checks/live-domain-ghost", () => {
  it("is complete when apex/www A/AAAA/CNAME answers equal the Ghost baseline and MX/TXT still resolve as recorded", async () => {
    const baselineMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-baseline");
    const liveMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-still-matching");
    const emailMap = loadFixture<NameTypeMap>("dns", "mx-txt-match");
    const baselineRecords = [...toBaselineRecords(baselineMap), ...toBaselineRecords(emailMap)];
    const resolveGhost = toResolver(liveMap);
    const resolveEmail = toResolver(emailMap);

    const ctx = fakeProviderContext({
      env: envFrom({}),
      fs: fsWith(baselineRecords),
      dns: {
        resolve: async (name, type) => {
          const ghostAnswers = await resolveGhost(name, type);
          if (ghostAnswers.length > 0) return ghostAnswers;
          return resolveEmail(name, type);
        },
      },
      http: { get: async () => ({ status: 200, headers: {}, body: "generator: Ghost" }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 6 of 18");
    expect(result.docs).toBe("docs/setup.md#live-domain-ghost");
  });

  it("is complete when a baseline TXT record holds Cloudflare's quoted chunked form and public DNS returns the joined value", async () => {
    const baselineMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-baseline");
    const liveMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-still-matching");
    const emailBaselineMap = loadFixture<NameTypeMap>("dns", "mx-txt-match-baseline-chunked");
    const emailLiveMap = loadFixture<NameTypeMap>("dns", "mx-txt-match-live-joined");
    const baselineRecords = [...toBaselineRecords(baselineMap), ...toBaselineRecords(emailBaselineMap)];
    const resolveGhost = toResolver(liveMap);
    const resolveEmail = toResolver(emailLiveMap);

    const ctx = fakeProviderContext({
      env: envFrom({}),
      fs: fsWith(baselineRecords),
      dns: {
        resolve: async (name, type) => {
          const ghostAnswers = await resolveGhost(name, type);
          if (ghostAnswers.length > 0) return ghostAnswers;
          return resolveEmail(name, type);
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
  });

  it("is missing with a 'Problem:' summary when the live domain no longer points at the Ghost baseline", async () => {
    const baselineMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-baseline");
    const liveMap = loadFixture<NameTypeMap>("dns", "live-domain-switched-away-from-ghost");
    const baselineRecords = toBaselineRecords(baselineMap);

    const ctx = fakeProviderContext({
      env: envFrom({}),
      fs: fsWith(baselineRecords),
      dns: { resolve: toResolver(liveMap) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/^Problem:/);
    expect(result.details.join(" ")).toContain("doncoleman.ca");
  });

  it("is missing with a 'Problem:' summary when a kept MX or email TXT record no longer resolves as in the baseline", async () => {
    const baselineMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-baseline");
    const liveMap = loadFixture<NameTypeMap>("dns", "ghost-a-records-still-matching");
    const emailBaseline = loadFixture<NameTypeMap>("dns", "mx-txt-match");
    const emailLive = loadFixture<NameTypeMap>("dns", "mx-txt-mismatch");
    const baselineRecords = [...toBaselineRecords(baselineMap), ...toBaselineRecords(emailBaseline)];
    const resolveGhost = toResolver(liveMap);
    const resolveEmail = toResolver(emailLive);

    const ctx = fakeProviderContext({
      env: envFrom({}),
      fs: fsWith(baselineRecords),
      dns: {
        resolve: async (name, type) => {
          if (type === "MX" || type === "TXT") return resolveEmail(name, type);
          return resolveGhost(name, type);
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/^Problem:/);
  });

  it("stays missing when the baseline has no Ghost apex/www records yet", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({}),
      fs: fsWith([]),
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/baseline/i);
  });
});
