// The setup registry (data-model.md "SetupItem"). This is the single
// source of truth the setup check, the `/setup-walkthrough` skill and
// `docs/setup.md` (drift-tested) all derive from. Each item's `check` field is
// wired to its real implementation under `scripts/setup-check/checks/`
// (Phase 3, User Story 1).
import type { ConstitutionPrinciple, ItemPhase, ProviderContext, SetupItem } from "./types.ts";
import { check as checkLocalTools } from "./checks/local-tools.ts";
import { check as checkLocalCredentials } from "./checks/local-credentials.ts";
import { check as checkCloudflareZone } from "./checks/cloudflare-zone.ts";
import { check as checkDnsRecordsParity } from "./checks/dns-records-parity.ts";
import { check as checkCloudflareWorker } from "./checks/cloudflare-worker.ts";
import { check as checkGithubMachineAccount } from "./checks/github-machine-account.ts";
import { check as checkGithubSecretScanning } from "./checks/github-secret-scanning.ts";
import { check as checkWorkersBuilds } from "./checks/workers-builds.ts";
import { check as checkGithubCiWorkflow } from "./checks/github-ci-workflow.ts";
import { check as checkGithubCodeowners } from "./checks/github-codeowners.ts";
import { check as checkGithubMainProtection } from "./checks/github-main-protection.ts";
import { check as checkPipelineSecrets } from "./checks/pipeline-secrets.ts";
import { check as checkPreviewNoindex } from "./checks/preview-noindex.ts";
import { check as checkWebAnalytics } from "./checks/web-analytics.ts";
import { check as checkContactBindings } from "./checks/contact-bindings.ts";
import { check as checkMailRecords } from "./checks/mail-records.ts";

const checksById: Record<string, (ctx: ProviderContext) => ReturnType<SetupItem["check"]>> = {
  "local-tools": checkLocalTools,
  "local-credentials": checkLocalCredentials,
  "cloudflare-zone": checkCloudflareZone,
  "dns-records-parity": checkDnsRecordsParity,
  "cloudflare-worker": checkCloudflareWorker,
  "github-machine-account": checkGithubMachineAccount,
  "github-secret-scanning": checkGithubSecretScanning,
  "workers-builds": checkWorkersBuilds,
  "github-ci-workflow": checkGithubCiWorkflow,
  "github-codeowners": checkGithubCodeowners,
  "github-main-protection": checkGithubMainProtection,
  "pipeline-secrets": checkPipelineSecrets,
  "preview-noindex": checkPreviewNoindex,
  "web-analytics": checkWebAnalytics,
  "contact-bindings": checkContactBindings,
  "mail-records": checkMailRecords,
};

interface ItemSeed {
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
}

const seeds: ItemSeed[] = [
  {
    id: "local-tools",
    order: 1,
    title: "Local tools",
    purpose:
      "Everything else in this setup depends on Node 24 and pnpm being installed correctly, and on Don's own GitHub sign-in.",
    where: "On Don's machine: nvm install 24 && nvm use 24, then gh auth login if not already signed in.",
    confirmedBy: "Node >= 24, pnpm version matches packageManager, gh signed in as Don",
    needsDon: true,
    principles: ["II"],
    requirements: ["FR-025"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "local-credentials",
    order: 2,
    title: "Local credentials",
    purpose: "The setup check reads Cloudflare state with a token that only Don holds, never committed.",
    where:
      "Create a read-only Cloudflare API token (Zone Read, DNS Read, Workers Scripts Read, Account Settings Read, D1 Read, Workers Builds Configuration Read, Turnstile Sites Read), then copy .env.example to .env and fill in the values.",
    confirmedBy: ".env has every required name non-empty; Cloudflare token-verify says active",
    needsDon: true,
    principles: ["VII"],
    requirements: ["FR-025"],
    secrets: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID"],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "cloudflare-zone",
    order: 3,
    title: "Cloudflare zone",
    purpose: "The site's DNS and hosting live in a Cloudflare zone for doncoleman.ca.",
    where: "Cloudflare dashboard -> Add a site -> doncoleman.ca -> choose the Free plan.",
    confirmedBy: "Zone doncoleman.ca exists on the Free plan (id matches CLOUDFLARE_ZONE_ID)",
    needsDon: true,
    principles: ["IX"],
    requirements: ["FR-019"],
    secrets: ["CLOUDFLARE_ZONE_ID"],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "dns-records-parity",
    order: 4,
    title: "DNS records parity",
    purpose:
      "Every DNS record the baseline lists (mail, verification, DMARC and CAA records) must exist in the Cloudflare zone with identical values, and the zone must hold nothing else off the apex and www.",
    where:
      "Cloudflare dashboard -> the zone -> DNS: keep each record in setup/dns-baseline.json present as DNS only, leaving TTL on Cloudflare's Auto preset (the dashboard has no custom TTL option).",
    confirmedBy:
      "Every record in setup/dns-baseline.json exists in the Cloudflare zone with identical type/name/content/priority and proxied: false (TTL is informational only); an empty baseline keeps the item missing; any record outside the apex and www that is not in the baseline is a problem",
    needsDon: true,
    principles: ["VI", "X"],
    requirements: ["FR-019", "FR-034", "FR-035", "FR-036", "FR-037"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "mail-records",
    order: 5,
    title: "Mail records unchanged",
    purpose: "The domain's mail keeps working: every mail record recorded in the baseline still answers unchanged.",
    where:
      "Cloudflare dashboard -> the zone -> DNS: restore any MX, TXT or DKIM CNAME record the details list, exactly as recorded in setup/dns-baseline.json.",
    confirmedBy:
      "Both public resolvers (1.1.1.1 and 8.8.8.8) return the baseline MX, TXT and DKIM CNAME records for every baseline mail group; pending when only one resolver matches",
    needsDon: false,
    principles: ["VII"],
    requirements: ["FR-016", "SC-004"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "cloudflare-worker",
    order: 6,
    title: "Cloudflare Worker",
    purpose: "The new site is hosted as a Cloudflare Worker serving static assets.",
    where:
      "Cloudflare dashboard -> Workers & Pages -> Create -> Import a repository -> drcdev/dcc-web. Leave workers.dev and Preview URLs off for dcc-web; wrangler.jsonc sets both to false and production is served only on the Custom Domain. The account workers.dev subdomain must be on (the preview Worker uses it).",
    confirmedBy: "Worker dcc-web exists and the account workers.dev subdomain is on (used by the preview Worker)",
    needsDon: true,
    principles: ["VIII"],
    requirements: ["FR-017"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "github-machine-account",
    order: 7,
    title: "GitHub machine account",
    purpose: "Agents open pull requests as a dedicated machine account, separate from Don's own account.",
    where:
      "Create GitHub account drc-agents, add it as a drcdev/dcc-web collaborator with write permission, sign it into the local gh keyring, then switch back to Don's account.",
    confirmedBy: "drc-agents collaborator permission is write (or maintain), not admin",
    needsDon: true,
    principles: ["III", "VII"],
    requirements: ["FR-013"],
    secrets: ["DCC_BOT_GITHUB_CREDENTIAL"],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "github-secret-scanning",
    order: 8,
    title: "GitHub secret scanning and Dependabot",
    purpose: "GitHub's own secret scanning and push protection are an always-on backstop alongside local secretlint, and Dependabot security updates open fix PRs for vulnerable dependencies.",
    where: "Repository Settings -> Code security -> turn on Secret scanning, Push protection and Dependabot security updates (Dependabot alerts must be on first).",
    confirmedBy: "security_and_analysis.secret_scanning, …secret_scanning_push_protection and …dependabot_security_updates are all enabled",
    needsDon: true,
    principles: ["VII"],
    requirements: ["FR-024"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "workers-builds",
    order: 9,
    title: "Workers Builds",
    purpose: "Confirms Workers Builds is building and deploying this repository once this slice's files are on main.",
    where:
      "Nothing new beyond step 6 for the dcc-web Worker (production deploys from main; non-production branch builds are turned off there). Branch previews are built by the separate dcc-web-preview Worker, connected under its own Settings → Build; this step confirms the pipeline once this slice's pull request has merged.",
    confirmedBy:
      "Latest commit on main has a successful Workers Builds check run; latest open PR head has one with a preview URL",
    needsDon: false,
    principles: ["II"],
    requirements: ["FR-017", "FR-018"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "github-ci-workflow",
    order: 10,
    title: "GitHub CI workflow",
    purpose: "Confirms the automated verify gate is actually running in GitHub Actions, not just locally.",
    where: "Nothing new to do here; ci.yml is part of this slice's pull request.",
    confirmedBy: ".github/workflows/ci.yml exists on main; latest verify run on main succeeded",
    needsDon: false,
    principles: ["II"],
    requirements: ["FR-015", "FR-016"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "github-codeowners",
    order: 11,
    title: "GitHub CODEOWNERS",
    purpose: "Confirms GitHub recognises .github/CODEOWNERS correctly, so every approval that counts is Don's.",
    where: "Nothing new to do here; CODEOWNERS is part of this slice's pull request.",
    confirmedBy: ".github/CODEOWNERS on main has the catch-all line `* @drcdev`; GitHub reports no errors in it",
    needsDon: false,
    principles: ["III"],
    requirements: ["FR-014"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "github-main-protection",
    order: 12,
    title: "GitHub main branch protection",
    purpose: "What actually stops an unreviewed or failing change from reaching main.",
    where: "Import setup/github-ruleset.json as a repository ruleset on main.",
    confirmedBy:
      "Active ruleset on main matches setup/github-ruleset.json: PR required with one approving review, code-owner review, stale approvals dismissed, required check verify (strict), no force-push, no deletion, no bypass actors",
    needsDon: true,
    principles: ["II", "III"],
    requirements: ["FR-013", "FR-014"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "pipeline-secrets",
    order: 13,
    title: "Pipeline secrets",
    purpose: "Confirms the pipeline has exactly the secrets and variables this slice documents, none more, none fewer.",
    where: "Nothing to add; this slice needs no GitHub Actions secrets or variables.",
    confirmedBy: "GitHub Actions secret and variable names equal the manifest's GitHub entries (currently none)",
    needsDon: false,
    principles: ["VII"],
    requirements: ["FR-021"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "preview-noindex",
    order: 14,
    title: "Preview no-index",
    purpose: "Preview addresses on workers.dev must never be indexed by search engines.",
    where: "Nothing new to do here; public/_headers sends X-Robots-Tag: noindex for the preview workers.dev host (production is not on workers.dev).",
    confirmedBy:
      "Responses for / and /projects/ from the dcc-web-preview workers.dev host have an X-Robots-Tag header containing noindex",
    needsDon: false,
    principles: ["X"],
    requirements: ["FR-012"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "web-analytics",
    order: 15,
    title: "Web Analytics",
    purpose: "Gives Don basic, privacy-focused visitor statistics for the site, with no cookies and no personal data.",
    where: "Cloudflare dashboard -> Analytics & Logs -> Web Analytics -> Add a site -> select doncoleman.ca (the dashboard offers the zone, not a hostname) -> Enable (automatic setup).",
    confirmedBy: "Web Analytics site for the doncoleman.ca zone exists with automatic setup on; the served HTML of doncoleman.ca references the Cloudflare beacon",
    needsDon: true,
    principles: ["X"],
    requirements: ["FR-022"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "contact-bindings",
    order: 16,
    title: "Contact bindings present",
    purpose:
      "The contact form needs its Cloudflare pieces in place: the two D1 databases, the Turnstile widget, the Worker secrets, the site key build variable and the production deploy that applies migrations.",
    where:
      "Five parts, each described in docs/setup.md: the D1 databases (created in Western North America, wnam), the Turnstile widget, three Worker secrets on each Worker, the PUBLIC_TURNSTILE_SITE_KEY build variable, and the production deploy command pnpm run deploy:production.",
    confirmedBy:
      "Both databases exist in WNAM and match wrangler.jsonc; the dcc-web contact widget is managed and covers the site hostnames; the three secret names exist on both Workers (names only); PUBLIC_TURNSTILE_SITE_KEY exists on every build trigger; dcc-web deploys with pnpm run deploy:production, has every migration applied and has its cron",
    needsDon: true,
    principles: ["VII", "VIII", "IX"],
    requirements: ["FR-012", "FR-017", "FR-018", "FR-023", "FR-024", "FR-027a", "FR-028"],
    secrets: ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT", "PUBLIC_TURNSTILE_SITE_KEY"],
    dependsOn: ["local-credentials", "cloudflare-worker"],
    phase: "after-merge",
  },
];

export const setupItems: SetupItem[] = seeds.map((seed) => {
  const check = checksById[seed.id];
  if (!check) {
    throw new Error(`No check implementation wired for setup item "${seed.id}"`);
  }
  return { ...seed, check };
});

export function getSetupItem(id: string): SetupItem | undefined {
  return setupItems.find((item) => item.id === id);
}
