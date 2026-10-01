import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/live-domain-ghost.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { DnsAnswer, DnsBaselineRecord, DnsRecordType } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom, loadFixture } from "./test-helpers.ts";

type NameTypeMap = Record<string, Record<string, Array<string | { priority: number; value: string }>>>;

const CONFIG = { zone: "doncoleman.ca", workerName: "dcc-web", ghostMarker: "Ghost" };
const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-value", CLOUDFLARE_ACCOUNT_ID: "account-123" };
type Phase = "before-switch" | "switched" | "unreadable";

function toBaselineRecords(map: NameTypeMap): DnsBaselineRecord[] {
  const records: DnsBaselineRecord[] = [];
  for (const [name, byType] of Object.entries(map)) {
    for (const [type, values] of Object.entries(byType)) {
      for (const value of values) {
        records.push({
          type: type as DnsBaselineRecord["type"],
          name,
          content: value as string,
          priority: null,
          ttl: 14400,
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
  return async (name: string, type: DnsRecordType): Promise<DnsAnswer[]> =>
    (map[name]?.[type] ?? []).map((value) => ({ type, name, value: value as string }));
}

function contextWith(baselineRecords: DnsBaselineRecord[], liveMap: NameTypeMap, phase: Phase, env: Record<string, string> = ENV) {
  return fakeProviderContext({
    env: envFrom(env),
    fs: {
      readJson: ((path: string) => {
        if (path === "setup/config.json") return CONFIG;
        if (path === "setup/dns-baseline.json") return { originalNameservers: ["ns1.squarespacedns.com"], records: baselineRecords };
        return null;
      }) as never,
    },
    cloudflare: {
      listWorkerDomains: async () => {
        if (phase === "unreadable") throw new ProviderAccessError("Cloudflare rejected the API token (401)");
        return loadFixture("cloudflare", phase === "switched" ? "worker-domains-apex-switched" : "worker-domains-review-host");
      },
    },
    dns: { resolve: toResolver(liveMap) },
    http: { get: async () => ({ status: 200, headers: {}, body: "generator: Ghost" }) },
  });
}

const ghost = loadFixture<NameTypeMap>("dns", "ghost-a-records-baseline");
const stillGhost = loadFixture<NameTypeMap>("dns", "ghost-a-records-still-matching");
const switchedAway = loadFixture<NameTypeMap>("dns", "live-domain-switched-away-from-ghost");
const apexOnlySwitched: NameTypeMap = { ...stillGhost, "doncoleman.ca": switchedAway["doncoleman.ca"]! };
const wwwOnlySwitched: NameTypeMap = { ...stillGhost, "www.doncoleman.ca": switchedAway["www.doncoleman.ca"]! };

describe("checks/live-domain-ghost", () => {
  it("is complete before the switch when apex and www still equal the Ghost baseline", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), stillGhost, "before-switch"));

    expect(result.status).toBe("complete");
    expect(result.summary).toBe("The live domain still resolves to the recorded Ghost targets.");
    expect(result.step).toBe(`Step 6 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#live-domain-ghost");
  });

  it("does not look at MX or TXT records", async () => {
    const mail: NameTypeMap = { "doncoleman.ca": { MX: ["mx.example.net"], TXT: ["v=spf1 -all"] } };
    const result = await check(contextWith([...toBaselineRecords(ghost), ...toBaselineRecords(mail)], stillGhost, "before-switch"));

    expect(result.status).toBe("complete");
  });

  it("is complete once switched on purpose, whatever public DNS answers", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), switchedAway, "switched"));

    expect(result.status).toBe("complete");
    expect(result.summary).toBe(
      "Switched to the new site on purpose (Custom Domain doncoleman.ca on dcc-web); the Ghost comparison applies again only during a rollback.",
    );
  });

  it("is missing with a Problem and the rollback next action when the domain differs before the switch", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), switchedAway, "before-switch"));

    expect(result.status).toBe("missing");
    expect(result.summary).toBe("Problem: the live domain does not match the recorded Ghost baseline.");
    expect(result.nextAction).toContain("docs/launch.md#rollback");
    expect(result.details.join(" ")).toContain("doncoleman.ca");
  });

  it("recognises a deliberate switch only from the Cloudflare domain list, never from DNS answers", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), switchedAway, "before-switch"));

    expect(result.status).toBe("missing");
  });

  it("after a rollback (Custom Domain removed, DNS back on Ghost) confirms Ghost again", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), stillGhost, "before-switch"));

    expect(result.status).toBe("complete");
  });

  it("reports the apex and www separately when only the apex has switched (FR-010b)", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), apexOnlySwitched, "before-switch"));

    expect(result.status).toBe("missing");
    const details = result.details.join("\n");
    expect(details).toMatch(/apex: .*differs/);
    expect(details).toMatch(/www: .*Ghost baseline/);
    expect(details).not.toMatch(/www: .*differs/);
  });

  it("reports the apex and www separately when only www has switched, before and after the switch", async () => {
    const before = await check(contextWith(toBaselineRecords(ghost), wwwOnlySwitched, "before-switch"));
    expect(before.status).toBe("missing");
    expect(before.details.join("\n")).toMatch(/www: .*differs/);

    const after = await check(contextWith(toBaselineRecords(ghost), wwwOnlySwitched, "switched"));
    expect(after.status).toBe("complete");
    const details = after.details.join("\n");
    expect(details).toMatch(/apex: .*Ghost baseline/);
    expect(details).toMatch(/www: .*differs/);
  });

  it("stays missing before the switch when the baseline has no Ghost apex/www records yet", async () => {
    const result = await check(contextWith([], {}, "before-switch"));

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/baseline/i);
  });

  it("is could-not-check when the launch phase cannot be read", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), stillGhost, "unreadable"));

    expect(result.status).toBe("could-not-check");
    expect(result.nextAction).toBeTruthy();
  });

  it("is could-not-check when CLOUDFLARE_ACCOUNT_ID is not set", async () => {
    const result = await check(contextWith(toBaselineRecords(ghost), stillGhost, "before-switch", { CLOUDFLARE_API_TOKEN: "x" }));

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
  });
});
