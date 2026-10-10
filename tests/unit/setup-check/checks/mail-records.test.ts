import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/mail-records.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { DnsAnswer, DnsBaselineRecord, DnsRecordType, DnsResolverAnswers } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext } from "./test-helpers.ts";

const ROLLBACK_NEXT = "Restore the record in Cloudflare → DNS exactly as listed.";
const LONG_TXT = `k=rsa; p=${"A".repeat(300)}`;

function rec(
  type: DnsRecordType,
  name: string,
  content: string,
  priority: number | null = null,
  decision: "keep" | "drop" = "keep",
): DnsBaselineRecord {
  return { type, name, content, priority, ttl: 14400, source: "squarespace", decision, reason: null };
}

const baseline = (extra: DnsBaselineRecord[] = []): DnsBaselineRecord[] => [
  rec("A", "doncoleman.ca", "49.13.201.194"),
  rec("MX", "doncoleman.ca", "mx01.mail.icloud.com", 0),
  rec("MX", "doncoleman.ca", "mx02.mail.icloud.com", 0),
  rec("TXT", "doncoleman.ca", "v=spf1 include:icloud.com ~all"),
  rec("CNAME", "sig1._domainkey.doncoleman.ca", "sig1.dkim.doncoleman.ca.at.icloudmailadmin.com"),
  rec("TXT", "mta._domainkey.mail.doncoleman.ca", LONG_TXT),
  rec("MX", "mail.doncoleman.ca", "mxa.eu.mailgun.org", 10),
  ...extra,
];

type Live = Record<string, DnsAnswer[]>;

function liveBaseline(): Live {
  const key = (name: string, type: string) => `${name}|${type}`;
  return {
    [key("doncoleman.ca", "MX")]: [
      { type: "MX", name: "doncoleman.ca", value: "mx02.mail.icloud.com.", priority: 0 },
      { type: "MX", name: "doncoleman.ca", value: "MX01.mail.icloud.com", priority: 0 },
    ],
    [key("doncoleman.ca", "TXT")]: [{ type: "TXT", name: "doncoleman.ca", value: "v=spf1 include:icloud.com ~all" }],
    [key("sig1._domainkey.doncoleman.ca", "CNAME")]: [
      { type: "CNAME", name: "sig1._domainkey.doncoleman.ca", value: "SIG1.dkim.doncoleman.ca.at.icloudmailadmin.com." },
    ],
    [key("mta._domainkey.mail.doncoleman.ca", "TXT")]: [
      { type: "TXT", name: "mta._domainkey.mail.doncoleman.ca", value: LONG_TXT },
    ],
    [key("mail.doncoleman.ca", "MX")]: [{ type: "MX", name: "mail.doncoleman.ca", value: "mxa.eu.mailgun.org", priority: 10 }],
  };
}

function ctxFor(
  records: DnsBaselineRecord[],
  perResolver: (resolver: string) => Live,
  failWith?: Error,
) {
  return fakeProviderContext({
    fs: {
      readJson: ((path: string) =>
        path === "setup/dns-baseline.json" ? { originalNameservers: [], records } : { zone: "doncoleman.ca" }) as never,
    },
    dns: {
      resolveEach: async (name: string, type: DnsRecordType): Promise<DnsResolverAnswers[]> => {
        if (failWith) throw failWith;
        return ["1.1.1.1", "8.8.8.8"].map((resolver) => ({ resolver, answers: perResolver(resolver)[`${name}|${type}`] ?? [] }));
      },
    },
  });
}

describe("checks/mail-records (item 31)", () => {
  it("is complete when every group matches at both resolvers; order, TTL, case and trailing dots are ignored", async () => {
    const result = await check(ctxFor(baseline(), liveBaseline));
    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 31 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#mail-records");
  });

  it("is pending when the resolvers disagree and one matches, with a wait-and-rerun next action", async () => {
    const stale = (resolver: string): Live => {
      const live = liveBaseline();
      if (resolver === "8.8.8.8") live["doncoleman.ca|MX"] = [{ type: "MX", name: "doncoleman.ca", value: "mx01.mail.icloud.com", priority: 0 }];
      return live;
    };
    const result = await check(ctxFor(baseline(), stale));
    expect(result.status).toBe("pending");
    expect(result.nextAction).toBe("Wait for DNS to finish updating, then run this check again.");
    expect(result.nextAction).not.toContain("24 hours");
    expect(result.details.join(" ")).toContain("doncoleman.ca");
  });

  it("is a Problem when an iCloud record differs at both resolvers, with the rollback nextAction", async () => {
    const changed = (): Live => ({
      ...liveBaseline(),
      "doncoleman.ca|TXT": [{ type: "TXT", name: "doncoleman.ca", value: "v=spf1 -all" }],
    });
    const result = await check(ctxFor(baseline(), changed));
    expect(result.status).toBe("missing");
    expect(result.summary).toBe("Problem: mail records differ from the baseline.");
    expect(result.nextAction).toBe(ROLLBACK_NEXT);
    expect(result.details).toHaveLength(1);
    expect(result.details[0]).toContain("TXT doncoleman.ca");
  });

  it("is a Problem when a record has gone from both resolvers, and a Problem beats pending", async () => {
    const gone = (resolver: string): Live => {
      const live = liveBaseline();
      delete live["sig1._domainkey.doncoleman.ca|CNAME"];
      if (resolver === "8.8.8.8") live["doncoleman.ca|MX"] = [];
      return live;
    };
    const result = await check(ctxFor(baseline(), gone));
    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("sig1._domainkey.doncoleman.ca");
  });

  it("lists a dropped baseline record that still answers as information only, and still passes after Mailgun moves to drop", async () => {
    const dropped = baseline().map((r) => (r.name === "mail.doncoleman.ca" ? { ...r, decision: "drop" as const } : r));
    const result = await check(ctxFor(dropped, liveBaseline));
    expect(result.status).toBe("complete");
    expect(result.details.join(" ")).toMatch(/mail\.doncoleman\.ca.*dropped.*still answers/);

    const withoutMailgun = (): Live => {
      const live = liveBaseline();
      delete live["mail.doncoleman.ca|MX"];
      return live;
    };
    const after = await check(ctxFor(dropped, withoutMailgun));
    expect(after.status).toBe("complete");
    expect(after.details).toEqual([]);
  });

  it("is could-not-check when DNS cannot be read", async () => {
    const result = await check(ctxFor(baseline(), liveBaseline, new ProviderAccessError("resolver unreachable")));
    expect(result.status).toBe("could-not-check");
  });
});
