// Read-only DNS discovery helper (FR-037): resolves the baseline's own names
// plus a fixed list of common names against public DNS and reports any answer
// not already recorded in setup/dns-baseline.json, so a record Squarespace
// serves is less likely to be missed before the nameserver switch. It changes
// nothing at any provider and writes only the gitignored
// setup/dns-snapshot.local.json.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createDnsReader } from "./providers/dns.ts";
import type { DnsAnswer, DnsBaseline, DnsReader, DnsRecordType } from "./types.ts";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DEFAULT_SNAPSHOT_PATH = `${REPO_ROOT}setup/dns-snapshot.local.json`;

export const COMMON_SUBDOMAIN_NAMES = ["", "www", "mail", "_dmarc"];
export const COMMON_DKIM_SELECTORS = [
  "default",
  "selector1",
  "selector2",
  "google",
  "s1",
  "s2",
  "k1",
  "k2",
];
export const SCAN_RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT"];

/** Every name the snapshot resolves: fixed common names plus every name already in the baseline. */
export function buildCandidateNames(zone: string, baseline: DnsBaseline): string[] {
  const names = new Set<string>();
  for (const suffix of COMMON_SUBDOMAIN_NAMES) {
    names.add(suffix ? `${suffix}.${zone}` : zone);
  }
  for (const selector of COMMON_DKIM_SELECTORS) {
    names.add(`${selector}._domainkey.${zone}`);
  }
  for (const record of baseline.records) {
    names.add(record.name.toLowerCase().replace(/\.$/, ""));
  }
  return [...names].sort();
}

function normaliseContent(type: DnsRecordType, content: string): string {
  let value = content.trim();
  if (type === "CNAME" || type === "NS" || type === "MX") {
    value = value.replace(/\.$/, "").toLowerCase();
  }
  if (type === "TXT") {
    value = value.replace(/^"|"$/g, "");
  }
  return value;
}

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

function isInBaseline(baseline: DnsBaseline, answer: DnsAnswer): boolean {
  const name = normaliseName(answer.name);
  return baseline.records.some((record) => {
    if (record.type !== answer.type) return false;
    if (normaliseName(record.name) !== name) return false;
    if (normaliseContent(record.type, record.content) !== normaliseContent(answer.type, answer.value)) {
      return false;
    }
    if ((record.type === "MX" || record.type === "SRV") && (record.priority ?? null) !== (answer.priority ?? null)) {
      return false;
    }
    return true;
  });
}

export interface SnapshotUnknownAnswer {
  type: DnsRecordType;
  name: string;
  value: string;
  priority?: number;
}

export interface SnapshotResult {
  generatedAt: string;
  zone: string;
  unknown: SnapshotUnknownAnswer[];
}

export interface TakeDnsSnapshotOptions {
  zone: string;
  baseline: DnsBaseline;
  resolver: DnsReader;
}

/** Resolves every candidate name and returns the answers not already in the baseline. */
export async function takeDnsSnapshot(options: TakeDnsSnapshotOptions): Promise<SnapshotResult> {
  const candidates = buildCandidateNames(options.zone, options.baseline);
  const unknown: SnapshotUnknownAnswer[] = [];
  for (const name of candidates) {
    for (const type of SCAN_RECORD_TYPES) {
      const answers = await options.resolver.resolve(name, type);
      for (const answer of answers) {
        if (!isInBaseline(options.baseline, answer)) {
          unknown.push({ type: answer.type, name: answer.name, value: answer.value, priority: answer.priority });
        }
      }
    }
  }
  return { generatedAt: new Date().toISOString(), zone: options.zone, unknown };
}

/** Writes the snapshot to the gitignored local file only; `write` is injectable for tests. */
export function writeSnapshotFile(
  result: SnapshotResult,
  targetPath: string = DEFAULT_SNAPSHOT_PATH,
  write: (path: string, content: string) => void = (path, content) => writeFileSync(path, content, "utf-8"),
): void {
  write(targetPath, `${JSON.stringify(result, null, 2)}\n`);
}

export async function main(): Promise<void> {
  const config = JSON.parse(readFileSync(`${REPO_ROOT}setup/config.json`, "utf-8")) as { zone: string };
  const baseline = JSON.parse(readFileSync(`${REPO_ROOT}setup/dns-baseline.json`, "utf-8")) as DnsBaseline;
  const resolver = createDnsReader();
  const result = await takeDnsSnapshot({ zone: config.zone, baseline, resolver });
  writeSnapshotFile(result);
  const count = result.unknown.length;
  console.log(
    count === 0
      ? "setup/dns-snapshot.local.json written — no answers outside the baseline."
      : `setup/dns-snapshot.local.json written — ${count} answer(s) not in the baseline. Add each to setup/dns-baseline.json with a decision.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
}
