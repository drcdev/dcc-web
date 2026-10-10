// checks/dns-records-parity.ts (setup item 4, data-model.md "dns-records-parity"):
// every record in setup/dns-baseline.json (the must-exist list) matches the Cloudflare zone
// (type, name, content and — for MX/SRV — priority, with the proxy off). TTL is not
// part of the match: Cloudflare's dashboard only offers TTL presets (no
// custom value), so Cloudflare records stay on "Auto" and a TTL difference
// is reported as an informational detail only, never a mismatch. Stays
// `missing` while the baseline has no records, so parity can never pass vacuously.
// Cloudflare-only records not in the baseline are reported in `details` for
// Don to add or delete, without blocking completion.
// A Cloudflare record matched by no baseline entry is informational on the apex and www, where the
// Worker Custom Domain adds its own records; on any other name it is a difference (FR-010).
import type { CheckResult, CloudflareDnsRecord, DnsBaseline, DnsBaselineRecord, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing, normalizeTxtContent } from "./shared.ts";

const ITEM = { id: "dns-records-parity", order: 4 };
const ROLLBACK_NEXT_ACTION =
  "Restore the record in Cloudflare → DNS exactly as in setup/dns-baseline.json, or delete the unexpected record (or add it to the baseline in a reviewed change).";

function normName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

function normContent(type: string, content: string): string {
  let value = content.trim();
  if (type === "CNAME" || type === "MX" || type === "NS") {
    value = value.replace(/\.$/, "").toLowerCase();
  }
  if (type === "TXT") {
    value = normalizeTxtContent(value);
  }
  return value;
}

function recordLabel(record: Pick<DnsBaselineRecord, "type" | "name" | "content">): string {
  return `${record.type} ${record.name} ${record.content}`;
}

function sameNameAndType(baseline: DnsBaselineRecord, cf: CloudflareDnsRecord): boolean {
  return baseline.type === cf.type && normName(baseline.name) === normName(cf.name);
}

/**
 * Compares everything except content and TTL: content is used to select the candidate before
 * this runs, and TTL is informational only (Cloudflare's dashboard offers presets, not a custom
 * value, so records stay on "Auto" — see `describeTtlInformational`).
 */
function describeNonContentMismatch(baseline: DnsBaselineRecord, cf: CloudflareDnsRecord): string | null {
  const problems: string[] = [];
  if ((baseline.type === "MX" || baseline.type === "SRV") && (baseline.priority ?? null) !== (cf.priority ?? null)) {
    problems.push(`priority is ${cf.priority ?? "none"}, expected ${baseline.priority ?? "none"}`);
  }
  if (cf.proxied !== false) {
    problems.push("proxied is on, expected DNS only (grey cloud)");
  }
  return problems.length > 0 ? problems.join("; ") : null;
}

/** Informational only (never a mismatch): Cloudflare's dashboard has TTL presets, not a custom value. */
function describeTtlInformational(baseline: DnsBaselineRecord, cf: CloudflareDnsRecord): string | null {
  if (baseline.ttl === cf.ttl) return null;
  const cfTtl = cf.ttl === 1 ? "auto" : String(cf.ttl);
  return `TTL differs (informational): Cloudflare ${cfTtl}, baseline ${baseline.ttl}`;
}

export interface DnsParityEvaluation {
  ok: boolean;
  missingBaseline: boolean;
  problems: string[];
  ttlInformational: string[];
  cloudflareOnly: string[];
  /** Cloudflare records on a name other than the apex and www that are not in the baseline. */
  unexpected: string[];
}

/** Pure comparison, exported for direct testing of the matching rules. */
export function evaluateDnsParity(
  baseline: DnsBaseline,
  cfRecords: CloudflareDnsRecord[],
  zone = "doncoleman.ca",
): DnsParityEvaluation {
  if (baseline.records.length === 0) {
    return {
      ok: false,
      missingBaseline: true,
      problems: [],
      ttlInformational: [],
      cloudflareOnly: [],
      unexpected: [],
    };
  }

  const switchNames = [normName(zone), normName(`www.${zone}`)];

  const problems: string[] = [];
  const ttlInformational: string[] = [];
  const matchedCf = new Set<CloudflareDnsRecord>();

  for (const record of baseline.records) {
    const sameTypeName = cfRecords.filter((cf) => sameNameAndType(record, cf));
    const available = sameTypeName.filter((cf) => !matchedCf.has(cf));
    const contentMatch = available.find(
      (cf) => normContent(record.type, record.content) === normContent(cf.type, cf.content),
    );
    if (contentMatch) {
      matchedCf.add(contentMatch);
      const ttlNote = describeTtlInformational(record, contentMatch);
      if (ttlNote) {
        ttlInformational.push(`${recordLabel(record)}: ${ttlNote}`);
      }
      const mismatch = describeNonContentMismatch(record, contentMatch);
      if (mismatch) {
        problems.push(`${recordLabel(record)}: ${mismatch}`);
      }
    } else if (sameTypeName.length > 0) {
      const found = sameTypeName.map((cf) => cf.content).join(", ");
      problems.push(`${recordLabel(record)}: no Cloudflare record with this content (found: ${found})`);
    } else {
      problems.push(`${recordLabel(record)}: not found in Cloudflare`);
    }
  }

  const unmatched = cfRecords.filter((cf) => !matchedCf.has(cf));
  const unexpectedRecords = unmatched.filter((cf) => !switchNames.includes(normName(cf.name)));
  const cloudflareOnly = unmatched.filter((cf) => !unexpectedRecords.includes(cf)).map((cf) => `${cf.type} ${cf.name} ${cf.content}`);
  const unexpected = unexpectedRecords.map((cf) => `${cf.type} ${cf.name} ${cf.content}: not in the baseline`);

  return {
    ok: problems.length === 0 && unexpected.length === 0,
    missingBaseline: false,
    problems,
    ttlInformational,
    cloudflareOnly,
    unexpected,
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

  const baseline = ctx.fs.readJson<DnsBaseline>("setup/dns-baseline.json") ?? { records: [] };

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

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const evaluation = evaluateDnsParity(baseline, cfRecords, config?.zone ?? "doncoleman.ca");

  if (evaluation.missingBaseline) {
    return missing(
      ITEM,
      "The DNS baseline has no records.",
      "Add the zone's records that must exist to setup/dns-baseline.json (docs/setup.md#dns-records-parity).",
    );
  }

  if (evaluation.problems.length > 0 || evaluation.unexpected.length > 0) {
    const count = evaluation.problems.length + evaluation.unexpected.length;
    return missing(ITEM, `Problem: ${count} difference(s) between the Cloudflare zone and the baseline.`, ROLLBACK_NEXT_ACTION, [
      ...evaluation.problems,
      ...evaluation.unexpected,
      ...evaluation.ttlInformational,
      ...evaluation.cloudflareOnly.map((r) => `Cloudflare-only, not in baseline: ${r}`),
    ]);
  }

  return complete(ITEM, "Every record in the baseline matches the Cloudflare zone.", [
    ...evaluation.ttlInformational,
    ...evaluation.cloudflareOnly.map((r) => `Cloudflare-only, not in baseline: ${r}`),
  ]);
}
