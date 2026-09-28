// checks/live-domain-ghost.ts (setup item 6, data-model.md "live-domain-ghost"):
// the one deciding signal (FR-038) is public A/AAAA/CNAME answers for the
// apex and www equalling the Ghost target records recorded in the baseline
// (only names present in the baseline are compared), plus every kept MX and
// TXT (email) record resolving in public DNS exactly as in the baseline. Any
// difference is `missing` with a summary starting "Problem:", never
// `complete`. The Ghost generator marker is an informational detail only and
// never decides the status.
import type { CheckResult, DnsAnswer, DnsBaseline, DnsBaselineRecord, DnsRecordType, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "live-domain-ghost", order: 6 };
const APEX_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME"];

function normName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

function normContent(type: DnsRecordType, content: string): string {
  let value = content.trim();
  if (type === "CNAME" || type === "MX" || type === "NS") {
    value = value.replace(/\.$/, "").toLowerCase();
  }
  if (type === "TXT") {
    value = value.replace(/^"|"$/g, "");
  }
  return value;
}

interface RecordGroup {
  name: string;
  type: DnsRecordType;
  records: DnsBaselineRecord[];
}

function groupByNameAndType(records: DnsBaselineRecord[]): RecordGroup[] {
  const map = new Map<string, RecordGroup>();
  for (const record of records) {
    const key = `${record.type}:${normName(record.name)}`;
    const group = map.get(key) ?? { name: record.name, type: record.type, records: [] };
    group.records.push(record);
    map.set(key, group);
  }
  return [...map.values()];
}

function expectedSet(group: RecordGroup): Set<string> {
  return new Set(
    group.records.map((r) => (group.type === "MX" ? `${r.priority}:${normContent(r.type, r.content)}` : normContent(r.type, r.content))),
  );
}

function actualSet(type: DnsRecordType, answers: DnsAnswer[]): Set<string> {
  return new Set(
    answers.map((a) => (type === "MX" ? `${a.priority ?? "none"}:${normContent(type, a.value)}` : normContent(type, a.value))),
  );
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const baseline = ctx.fs.readJson<DnsBaseline>("setup/dns-baseline.json") ?? { originalNameservers: [], records: [] };
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const zone = config?.zone ?? "doncoleman.ca";
  const wwwName = `www.${zone}`;

  const ghostRecords = baseline.records.filter(
    (r) => r.decision === "keep" && APEX_TYPES.includes(r.type) && [normName(zone), normName(wwwName)].includes(normName(r.name)),
  );

  if (ghostRecords.length === 0) {
    return missing(
      ITEM,
      "No Ghost baseline records are recorded yet for the apex or www.",
      "Record the Squarespace baseline first (step 4), including the current A/AAAA/CNAME records for the apex and www.",
    );
  }

  const emailRecords = baseline.records.filter((r) => r.decision === "keep" && (r.type === "MX" || r.type === "TXT"));
  const groups = [...groupByNameAndType(ghostRecords), ...groupByNameAndType(emailRecords)];
  const problems: string[] = [];

  try {
    for (const group of groups) {
      const answers = await ctx.dns.resolve(group.name, group.type);
      const expected = expectedSet(group);
      const actual = actualSet(group.type, answers);
      if (!setsEqual(expected, actual)) {
        problems.push(
          `${group.type} ${group.name}: expected ${[...expected].join(", ") || "(none)"}, found ${[...actual].join(", ") || "(none)"}`,
        );
      }
    }
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not resolve public DNS for the live domain.",
      err,
      "Check public DNS is reachable, then try again.",
    );
  }

  if (problems.length > 0) {
    return missing(
      ITEM,
      "Problem: the live domain does not match the recorded Ghost baseline.",
      "Restore the Ghost DNS records from the recorded baseline in Cloudflare straight away; if it cannot be fixed within minutes, follow the nameserver rollback procedure.",
      problems,
    );
  }

  const details: string[] = [];
  const marker = config?.ghostMarker;
  if (marker) {
    try {
      const response = await ctx.http.get(`https://${zone}/`);
      if (response.body.includes(marker)) {
        details.push(`The served page includes the Ghost marker "${marker}" (informational only).`);
      }
    } catch {
      // Informational only (FR-038): a failed probe never affects status.
    }
  }

  return complete(ITEM, "The live domain still resolves to the recorded Ghost targets.", details);
}
