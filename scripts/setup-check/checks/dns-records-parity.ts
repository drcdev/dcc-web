// checks/dns-records-parity.ts (setup item 4, data-model.md "dns-records-parity"):
// every `keep` record in setup/dns-baseline.json matches the Cloudflare zone
// exactly (type, name, content, TTL and — for MX/SRV — priority, with the
// proxy off), and no record is left without a decision (FR-035, FR-036,
// FR-037). Stays `missing` while the baseline has no records or no original
// nameservers, so parity can never pass vacuously before the nameserver
// switch. Cloudflare-only records not in the baseline are reported in
// `details` for Don to add or delete, without blocking completion.
import type { CheckResult, CloudflareDnsRecord, DnsBaseline, DnsBaselineRecord, ProviderContext } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "dns-records-parity", order: 4 };

function normName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

function normContent(type: string, content: string): string {
  let value = content.trim();
  if (type === "CNAME" || type === "MX" || type === "NS") {
    value = value.replace(/\.$/, "").toLowerCase();
  }
  if (type === "TXT") {
    value = value.replace(/^"|"$/g, "");
  }
  return value;
}

function recordLabel(record: Pick<DnsBaselineRecord, "type" | "name" | "content">): string {
  return `${record.type} ${record.name} ${record.content}`;
}

function sameNameAndType(baseline: DnsBaselineRecord, cf: CloudflareDnsRecord): boolean {
  return baseline.type === cf.type && normName(baseline.name) === normName(cf.name);
}

function describeMismatch(baseline: DnsBaselineRecord, cf: CloudflareDnsRecord): string | null {
  const problems: string[] = [];
  if (normContent(baseline.type, baseline.content) !== normContent(cf.type, cf.content)) {
    problems.push(`content is "${cf.content}", expected "${baseline.content}"`);
  }
  if (baseline.ttl !== cf.ttl) {
    problems.push(`TTL is ${cf.ttl}${cf.ttl === 1 ? " (automatic)" : ""}, expected ${baseline.ttl}`);
  }
  if ((baseline.type === "MX" || baseline.type === "SRV") && (baseline.priority ?? null) !== (cf.priority ?? null)) {
    problems.push(`priority is ${cf.priority ?? "none"}, expected ${baseline.priority ?? "none"}`);
  }
  if (cf.proxied !== false) {
    problems.push("proxied is on, expected DNS only (grey cloud)");
  }
  return problems.length > 0 ? problems.join("; ") : null;
}

export interface DnsParityEvaluation {
  ok: boolean;
  missingBaseline: boolean;
  undecided: DnsBaselineRecord[];
  problems: string[];
  cloudflareOnly: string[];
}

/** Pure comparison, exported for direct testing of the matching rules. */
export function evaluateDnsParity(baseline: DnsBaseline, cfRecords: CloudflareDnsRecord[]): DnsParityEvaluation {
  if (baseline.records.length === 0 || baseline.originalNameservers.length === 0) {
    return { ok: false, missingBaseline: true, undecided: [], problems: [], cloudflareOnly: [] };
  }

  const undecided = baseline.records.filter((r) => r.decision === null);
  const keepRecords = baseline.records.filter((r) => r.decision === "keep");

  const problems: string[] = [];
  const matchedCf = new Set<CloudflareDnsRecord>();

  for (const record of keepRecords) {
    const candidates = cfRecords.filter((cf) => sameNameAndType(record, cf));
    let matched: CloudflareDnsRecord | null = null;
    let bestMismatch: string | null = null;
    for (const candidate of candidates) {
      const mismatch = describeMismatch(record, candidate);
      if (mismatch === null) {
        matched = candidate;
        break;
      }
      bestMismatch ??= mismatch;
    }
    if (matched) {
      matchedCf.add(matched);
    } else if (candidates.length > 0) {
      problems.push(`${recordLabel(record)}: ${bestMismatch}`);
    } else {
      problems.push(`${recordLabel(record)}: not found in Cloudflare`);
    }
  }

  const cloudflareOnly = cfRecords
    .filter((cf) => !baseline.records.some((r) => sameNameAndType(r, cf)))
    .map((cf) => `${cf.type} ${cf.name} ${cf.content}`);

  return {
    ok: undecided.length === 0 && problems.length === 0,
    missingBaseline: false,
    undecided,
    problems,
    cloudflareOnly,
  };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return couldNotCheck(
      ITEM,
      "Could not read the Cloudflare DNS records.",
      "CLOUDFLARE_API_TOKEN is not set in .env.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env.",
    );
  }
  const zoneId = ctx.env.get("CLOUDFLARE_ZONE_ID");
  if (!zoneId) {
    return couldNotCheck(
      ITEM,
      "Could not read the Cloudflare DNS records.",
      "CLOUDFLARE_ZONE_ID is not set in .env.",
      "Add CLOUDFLARE_ZONE_ID to .env (docs/setup.md#local-credentials).",
    );
  }

  const baseline = ctx.fs.readJson<DnsBaseline>("setup/dns-baseline.json") ?? { originalNameservers: [], records: [] };

  let cfRecords: CloudflareDnsRecord[];
  try {
    cfRecords = await ctx.cloudflare.listDnsRecords(zoneId);
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the Cloudflare DNS records.",
      err,
      "Check the Cloudflare API token in .env is valid and has DNS: Read access, then try again.",
    );
  }

  const evaluation = evaluateDnsParity(baseline, cfRecords);

  if (evaluation.missingBaseline) {
    return missing(
      ITEM,
      "The DNS baseline has no records yet.",
      "Record the Squarespace baseline first: list every DNS record from Squarespace's DNS screen into setup/dns-baseline.json, with the original nameservers.",
    );
  }

  if (evaluation.undecided.length > 0) {
    const names = evaluation.undecided.map((r) => recordLabel(r));
    return missing(
      ITEM,
      `${evaluation.undecided.length} baseline record(s) have no keep/drop decision.`,
      "Decide keep or drop (with a reason for drop) for every record in setup/dns-baseline.json.",
      names,
    );
  }

  if (evaluation.problems.length > 0) {
    return missing(
      ITEM,
      `${evaluation.problems.length} keep record(s) do not match the Cloudflare zone.`,
      "Add or fix these records in Cloudflare → DNS → Records (DNS only, exact Squarespace TTL), or mark them \"drop\" in setup/dns-baseline.json with a reason.",
      [...evaluation.problems, ...evaluation.cloudflareOnly.map((r) => `Cloudflare-only, not in baseline: ${r}`)],
    );
  }

  return complete(
    ITEM,
    "Every keep record in the baseline matches the Cloudflare zone.",
    evaluation.cloudflareOnly.map((r) => `Cloudflare-only, not in baseline: ${r}`),
  );
}
