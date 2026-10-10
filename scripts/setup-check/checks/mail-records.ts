// checks/mail-records.ts (setup item 5, 011-launch contracts/setup-items.md; FR-016, SC-004): the
// mail records recorded in the baseline still answer unchanged at both public resolvers. A group is every baseline record with `decision: "keep"` of one name and type
// (MX, TXT, and CNAMEs under `._domainkey.`); MX is compared as `priority:host`, TXT joined and
// normalised, CNAME lower-case without a trailing dot. Order and TTL are ignored. A baseline record
// marked `drop` that still answers is information only, so the item keeps passing for the retired
// Mailgun records, which the baseline marks `drop`.
import type { CheckResult, DnsAnswer, DnsBaseline, DnsBaselineRecord, DnsRecordType, ProviderContext } from "../types.ts";
import { complete, fromProviderError, missing, pending } from "./shared.ts";
import { normalizeTxtContent } from "./shared.ts";

const ITEM = { id: "mail-records", order: 5 };
const ROLLBACK_NEXT = "Restore the record in Cloudflare → DNS exactly as listed.";

function normName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

function isMailRecord(record: DnsBaselineRecord): boolean {
  return record.type === "MX" || record.type === "TXT" || (record.type === "CNAME" && normName(record.name).includes("._domainkey."));
}

function normalise(type: DnsRecordType, value: string, priority: number | null | undefined): string {
  if (type === "MX") return `${priority ?? 0}:${normName(value.trim())}`;
  if (type === "TXT") return normalizeTxtContent(value);
  return normName(value.trim());
}

function expectedValue(record: DnsBaselineRecord): string {
  return normalise(record.type, record.content, record.priority);
}

function actualValues(answers: DnsAnswer[]): Set<string> {
  return new Set(answers.map((a) => normalise(a.type, a.value, a.priority)));
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((v) => b.has(v));
}

function shorten(value: string): string {
  return value.length > 60 ? `${value.slice(0, 57)}...` : value;
}

function listing(values: Iterable<string>): string {
  const list = [...values].map(shorten);
  return list.length > 0 ? list.join(", ") : "(none)";
}

interface Group {
  type: DnsRecordType;
  name: string;
  records: DnsBaselineRecord[];
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const baseline = ctx.fs.readJson<DnsBaseline>("setup/dns-baseline.json");
  const mailRecords = (baseline?.records ?? []).filter(isMailRecord);
  const kept = mailRecords.filter((r) => r.decision === "keep");
  if (kept.length === 0) {
    return missing(
      ITEM,
      "No mail records are recorded in the baseline.",
      "Record the Squarespace baseline first (step 4), including the MX, TXT and DKIM CNAME records.",
    );
  }

  const groupsOf = (records: DnsBaselineRecord[]): Group[] => {
    const map = new Map<string, Group>();
    for (const record of records) {
      const key = `${record.type}|${normName(record.name)}`;
      const group = map.get(key) ?? { type: record.type, name: record.name, records: [] };
      group.records.push(record);
      map.set(key, group);
    }
    return [...map.values()];
  };

  const problems: string[] = [];
  const settling: string[] = [];
  const information: string[] = [];

  try {
    for (const group of groupsOf(kept)) {
      const expected = new Set(group.records.map(expectedValue));
      const answers = await ctx.dns.resolveEach(group.name, group.type);
      const results = answers.map(({ resolver, answers: list }) => ({ resolver, values: actualValues(list) }));
      const matching = results.filter((r) => sameSet(r.values, expected));
      if (matching.length === results.length) continue;
      const label = `${group.type} ${group.name}`;
      const found = results
        .filter((r) => !sameSet(r.values, expected))
        .map((r) => `${r.resolver} returns ${listing(r.values)}`)
        .join("; ");
      const line = `${label}: expected ${listing(expected)}; ${found}`;
      if (matching.length > 0) settling.push(line);
      else problems.push(line);
    }

    for (const group of groupsOf(mailRecords.filter((r) => r.decision === "drop"))) {
      const dropped = new Set(group.records.map(expectedValue));
      const answers = await ctx.dns.resolveEach(group.name, group.type);
      const stillAnswering = answers.some((a) => [...actualValues(a.answers)].some((v) => dropped.has(v)));
      if (stillAnswering) information.push(`${group.type} ${group.name}: dropped from the baseline but still answers (information only)`);
    }
  } catch (err) {
    return fromProviderError(ITEM, "Could not read public DNS for the mail records.", err, "Check public DNS is reachable, then try again.");
  }

  if (problems.length > 0) {
    return missing(ITEM, "Problem: mail records differ from the baseline.", ROLLBACK_NEXT, [...problems, ...settling]);
  }
  if (settling.length > 0) {
    return pending(
      ITEM,
      "Mail records are still settling: the public resolvers disagree.",
      "Wait for DNS to finish updating, then run this check again.",
      settling,
    );
  }
  return complete(ITEM, "Every recorded mail record still answers unchanged at both public resolvers.", information);
}
