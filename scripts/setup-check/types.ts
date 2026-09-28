// Shared types for the setup check (see specs/001-setup-walkthrough/data-model.md).
// Nothing here stores state; the registry and manifest are committed source and
// results are computed fresh on every run.

export type CheckStatus = "complete" | "missing" | "pending" | "could-not-check";

/** The raw result a per-item check function returns. */
export interface CheckResult {
  id: string;
  status: CheckStatus;
  /** One line, plain language. Never contains a secret value. */
  summary: string;
  /** Optional specifics, e.g. each missing ruleset rule or DNS record. */
  details: string[];
  /** Required when status !== 'complete' (FR-002, SC-003). */
  nextAction: string | null;
  /** e.g. "Step 4 of 18". */
  step: string;
  /** e.g. "docs/setup.md#dns-records-parity". */
  docs: string;
  /** For 'could-not-check': the access problem and how to fix it. */
  reason: string | null;
}

/** A CheckResult plus registry fields, as printed by the report (contracts/check-report.schema.json). */
export interface ReportResultEntry extends CheckResult {
  title: string;
  needsDon: boolean;
}

export interface CheckReportCounts {
  complete: number;
  missing: number;
  pending: number;
  couldNotCheck: number;
  total: number;
}

export interface CheckReport {
  generatedAt: string;
  /** true only when counts.complete === counts.total (FR-003). */
  ok: boolean;
  counts: CheckReportCounts;
  /** Registry order. */
  results: ReportResultEntry[];
}

export type ConstitutionPrinciple =
  | "I"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "VII"
  | "VIII"
  | "IX"
  | "X"
  | "XI";

export type ItemPhase = "before-merge" | "after-merge";

/** A provider reader bundle injected into every check function (test seam). */
export interface ProviderContext {
  github: GitHubReader;
  cloudflare: CloudflareReader;
  dns: DnsReader;
  http: HttpReader;
  env: EnvReader;
  fs: RepoReader;
  now: () => Date;
}

/** One entry in the setup item registry (scripts/setup-check/items.ts). */
export interface SetupItem {
  id: string;
  order: number;
  title: string;
  purpose: string;
  where: string;
  confirmedBy: string;
  needsDon: boolean;
  principles: ConstitutionPrinciple[];
  requirements: string[];
  secrets: string[];
  dependsOn: string[];
  phase: ItemPhase;
  check: (ctx: ProviderContext) => Promise<CheckResult>;
}

export type SecretKind = "secret" | "variable";
export type SecretStore = "local-env" | "github-actions" | "cloudflare-worker" | "gh-keyring";

/** An entry in the secret/variable manifest (scripts/setup-check/secrets.ts). Values are never part of the model. */
export interface SecretRef {
  name: string;
  kind: SecretKind;
  store: SecretStore;
  purpose: string;
  permissions: string | null;
  usedBy: string[];
}

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "SRV" | "CAA" | "NS";

export interface DnsBaselineRecord {
  type: DnsRecordType;
  name: string;
  content: string;
  priority: number | null;
  ttl: number;
  source: "squarespace";
  decision: "keep" | "drop" | null;
  reason: string | null;
}

/** setup/dns-baseline.json shape. */
export interface DnsBaseline {
  originalNameservers: string[];
  records: DnsBaselineRecord[];
}

/** setup/config.json shape. */
export interface SetupConfig {
  owner: string;
  repo: string;
  machineAccount: string;
  workerName: string;
  zone: string;
  reviewHost: string;
  ghostMarker: string;
}

export interface MajorGateReview {
  user: string;
  state: string;
  commitId: string;
  submittedAt: string;
}

export interface MajorGateInput {
  labels: string[];
  author: string;
  headSha: string;
  reviews: MajorGateReview[];
  owner: string;
}

export interface MajorGateDecision {
  pass: boolean;
  message: string;
}

/**
 * Thrown by a provider reader when it could not get the information it needs (a
 * provider or resolver is unreachable, a call timed out, or a credential is
 * absent, expired or lacks read access). Checks map this to `could-not-check`
 * with `reason` (never `complete` or silence — spec Story 1 scenario 4).
 */
export class ProviderAccessError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = "ProviderAccessError";
    this.reason = reason;
  }
}

// --- Reader interfaces (implemented in scripts/setup-check/providers/*.ts) ---
//
// Every method is read-only by construction: GitHub reads go through `gh api`
// with no mutating flags, Cloudflare reads use only list/get/verify SDK calls,
// DNS/HTTP readers only resolve names or issue GET/HEAD requests.

export interface GitHubReader {
  /** GET a GitHub REST API path (e.g. "repos/drcdev/dcc-web"). */
  api<T = unknown>(path: string): Promise<T>;
  /** `gh auth status` for the currently signed-in account. */
  authStatus(): Promise<{ signedIn: boolean; login: string | null }>;
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  plan?: string;
  nameServers: string[];
}

export interface CloudflareDnsRecord {
  type: string;
  name: string;
  content: string;
  priority: number | null;
  ttl: number;
  proxied: boolean;
}

export interface CloudflareWorkerScript {
  id: string;
}

export interface CloudflareWorkersSubdomain {
  subdomain: string | null;
  enabled: boolean;
}

export interface CloudflareWorkerDomain {
  hostname: string;
  service: string;
}

export interface CloudflareWebAnalyticsSite {
  siteTag: string;
  host: string | null;
  autoInstall: boolean;
}

export interface CloudflareReader {
  /** Confirms the configured API token is active (does not read its permission list). */
  verifyToken(): Promise<{ status: string }>;
  getZone(zoneId: string): Promise<CloudflareZone>;
  listZones(name: string): Promise<CloudflareZone[]>;
  listDnsRecords(zoneId: string): Promise<CloudflareDnsRecord[]>;
  getWorkerScript(accountId: string, scriptName: string): Promise<CloudflareWorkerScript | null>;
  getWorkersSubdomain(accountId: string): Promise<CloudflareWorkersSubdomain>;
  listWorkerDomains(accountId: string, hostname?: string): Promise<CloudflareWorkerDomain[]>;
  listWebAnalyticsSites(accountId: string): Promise<CloudflareWebAnalyticsSite[]>;
}

export interface DnsAnswer {
  type: DnsRecordType;
  name: string;
  value: string;
  priority?: number;
}

export interface DnsReader {
  /** Resolves every record type the setup check needs for one name (empty array when NXDOMAIN/no data). */
  resolve(name: string, type: DnsRecordType): Promise<DnsAnswer[]>;
  /** Public nameservers for a domain, from an NS lookup at the root/TLD resolvers. */
  resolveNameservers(name: string): Promise<string[]>;
}

export interface HttpResponseSummary {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpReader {
  get(url: string): Promise<HttpResponseSummary>;
  head(url: string): Promise<HttpResponseSummary>;
}

export interface EnvReader {
  /** Reads one variable by name from the gitignored `.env` file; never logs or returns it inside an error. */
  get(name: string): string | undefined;
  has(name: string): boolean;
}

export interface RepoReader {
  readText(relativePath: string): string | null;
  readJson<T = unknown>(relativePath: string): T | null;
  exists(relativePath: string): boolean;
}
