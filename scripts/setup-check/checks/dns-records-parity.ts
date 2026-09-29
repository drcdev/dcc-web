// checks/dns-records-parity.ts (setup item 4, data-model.md "dns-records-parity"):
// every `keep` record in setup/dns-baseline.json matches the Cloudflare zone
// (type, name, content and — for MX/SRV — priority, with the proxy off), and
// no record is left without a decision (FR-035, FR-036, FR-037). TTL is not
// part of the match: Cloudflare's dashboard only offers TTL presets (no
// custom value), so Cloudflare records stay on "Auto" and a TTL difference
// is reported as an informational detail only, never a mismatch. Stays
// `missing` while the baseline has no records or no original nameservers, so
// parity can never pass vacuously before the nameserver switch.
// Cloudflare-only records not in the baseline are reported in `details` for
// Don to add or delete, without blocking completion.
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
  undecided: DnsBaselineRecord[];
  problems: string[];
  ttlInformational: string[];
  cloudflareOnly: string[];
}

/** Pure comparison, exported for direct testing of the matching rules. */
export function evaluateDnsParity(baseline: DnsBaseline, cfRecords: CloudflareDnsRecord[]): DnsParityEvaluation {
  if (baseline.records.length === 0 || baseline.originalNameservers.length === 0) {
    return { ok: false, missingBaseline: true, undecided: [], problems: [], ttlInformational: [], cloudflareOnly: [] };
  }

  const undecided = baseline.records.filter((r) => r.decision === null);
  const keepRecords = baseline.records.filter((r) => r.decision === "keep");
  const otherRecords = baseline.records.filter((r) => r.decision !== "keep");

  const problems: string[] = [];
  const ttlInformational: string[] = [];
  const matchedCf = new Set<CloudflareDnsRecord>();

  for (const record of keepRecords) {
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

  // Records covered by a "drop" (or undecided) baseline entry aren't content-verified, but a
  // matching type+name record is still accounted for in the baseline, so it shouldn't also be
  // reported as Cloudflare-only.
  for (const record of otherRecords) {
    const candidate = cfRecords.find((cf) => sameNameAndType(record, cf) && !matchedCf.has(cf));
    if (candidate) {
      matchedCf.add(candidate);
    }
  }

  const cloudflareOnly = cfRecords
    .filter((cf) => !matchedCf.has(cf))
    .map((cf) => `${cf.type} ${cf.name} ${cf.content}`);

  return {
    ok: undecided.length === 0 && problems.length === 0,
    missingBaseline: false,
    undecided,
    problems,
    ttlInformational,
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
      "Add or fix these records in Cloudflare → DNS → Records (DNS only), or mark them \"drop\" in setup/dns-baseline.json with a reason.",
      [
        ...evaluation.problems,
        ...evaluation.ttlInformational,
        ...evaluation.cloudflareOnly.map((r) => `Cloudflare-only, not in baseline: ${r}`),
      ],
    );
  }

  return complete(
    ITEM,
    "Every keep record in the baseline matches the Cloudflare zone.",
    [...evaluation.ttlInformational, ...evaluation.cloudflareOnly.map((r) => `Cloudflare-only, not in baseline: ${r}`)],
  );
}
