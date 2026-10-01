// Shared types for the setup check (see specs/001-setup-walkthrough/data-model.md).
// Nothing here stores state; the registry and manifest are committed source and
// results are computed fresh on every run.

export type CheckStatus = "complete" | "missing" | "pending" | "could-not-check" | "waiting";

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
  /** Post-launch items that cannot be checked until the switch (011-launch research R3). */
  waiting: number;
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
  /** True for an after-merge item that is reported but must not fail the check before the merge (FR-028a). */
  deferredUntilMerge?: boolean;
  /** True for an item whose check returns `waiting` before the switch (011-launch data-model.md). */
  postLaunch?: boolean;
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
  /** The preview Worker (`dcc-web-preview`) that serves non-main branch builds. */
  previewWorkerName?: string;
  zone: string;
  reviewHost: string;
  ghostMarker: string;
  /** The account's public workers.dev subdomain, used to compute preview
   * origins (002-site-foundation contracts/site-origin.md). Public, never a
   * secret. Absent until it is read from the account (T023); previews then
   * fall back to the production origin. */
  workersSubdomain?: string;
  /** What must be live at launch (011-launch data-model.md). */
  launch?: {
    /** Page content ids (file names in `src/content/pages/` without `.mdx`). */
    expectedPages: string[];
    /** Site paths that must appear in the sitemap. */
    expectedPaths: string[];
  };
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
  /** The dedicated GitHub machine account name, read from setup/config.json's `machineAccount`. */
  machineAccount: string;
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
export type ProviderAccessErrorKind = "tls" | "timeout" | "network";

export class ProviderAccessError extends Error {
  readonly reason: string;
  /** Set by the HTTP reader so a post-launch check can tell a certificate not yet issued (`tls`) from other failures. */
  readonly kind?: ProviderAccessErrorKind;

  constructor(reason: string, kind?: ProviderAccessErrorKind) {
    super(reason);
    this.name = "ProviderAccessError";
    this.reason = reason;
    this.kind = kind;
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
  /** Hostname for a site added by JS snippet; null for a zone-level automatic-setup site. */
  host: string | null;
  autoInstall: boolean;
  /** Zone an automatic-setup site injects the beacon into (ruleset.zone_name); null when absent. */
  zoneName: string | null;
}

export interface CloudflareD1Database {
  uuid: string;
  name: string;
  /** The `running_in_region` value (e.g. "WNAM"). Undocumented in the API schema, so it is
   * `undefined` when Cloudflare does not return it (research R2); checks then fail closed. */
  runningInRegion?: string;
}

export interface CloudflareBuildTrigger {
  uuid: string;
  name: string;
  branchIncludes: string[];
  branchExcludes: string[];
  buildCommand: string | null;
  deployCommand: string | null;
}

export interface CloudflareTurnstileWidget {
  name: string;
  domains: string[];
  mode: string;
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
  /** D1 databases, optionally filtered by name. Drops everything except uuid, name and region. */
  listD1Databases(accountId: string, name?: string): Promise<CloudflareD1Database[]>;
  /** File names recorded in the database's `d1_migrations` table (`[]` when the table does not exist yet). Runs one fixed read-only SELECT. */
  listD1AppliedMigrations(accountId: string, databaseUuid: string): Promise<string[]>;
  /** Secret NAMES bound to a Worker (`[]` when the Worker does not exist). Values are never read. */
  listWorkerSecretNames(accountId: string, scriptName: string): Promise<string[]>;
  /** Cron expressions registered on a Worker (`[]` when the Worker does not exist). */
  listWorkerCrons(accountId: string, scriptName: string): Promise<string[]>;
  /** Workers Builds triggers of a Worker (`[]` when the Worker does not exist). */
  listBuildTriggers(accountId: string, scriptName: string): Promise<CloudflareBuildTrigger[]>;
  /** Build variable NAMES on one Workers Builds trigger. Values are never returned. */
  listBuildVariableNames(accountId: string, triggerUuid: string): Promise<string[]>;
  /** Turnstile widgets by name, domains and mode. `sitekey` and `secret` are dropped. */
  listTurnstileWidgets(accountId: string): Promise<CloudflareTurnstileWidget[]>;
}

export interface DnsAnswer {
  type: DnsRecordType;
  name: string;
  value: string;
  priority?: number;
}

/** The answers one public resolver gave. */
export interface DnsResolverAnswers {
  /** The resolver's address, e.g. "1.1.1.1". */
  resolver: string;
  answers: DnsAnswer[];
}

export interface DnsReader {
  /** Resolves every record type the setup check needs for one name (empty array when NXDOMAIN/no data). */
  resolve(name: string, type: DnsRecordType): Promise<DnsAnswer[]>;
  /** Like `resolve`, but asks each public resolver (1.1.1.1, then 8.8.8.8) separately so a caller can tell a settling answer from a settled one. */
  resolveEach(name: string, type: DnsRecordType): Promise<DnsResolverAnswers[]>;
  /** Public nameservers for a domain, from an NS lookup at the root/TLD resolvers. */
  resolveNameservers(name: string): Promise<string[]>;
}

export interface HttpResponseSummary {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpGetOptions {
  /** `manual` returns a redirect response as it is (status and raw `Location` header) instead of following it. Default `follow`. */
  redirect?: "follow" | "manual";
}

export interface HttpReader {
  get(url: string, options?: HttpGetOptions): Promise<HttpResponseSummary>;
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
  /** File names (not paths) directly inside a directory; `[]` when it does not exist. */
  listFiles(relativeDir: string): string[];
}
