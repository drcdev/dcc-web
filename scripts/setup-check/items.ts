// The 25-item setup registry (data-model.md "SetupItem"). This is the single
// source of truth the setup check, the `/setup-walkthrough` skill and
// `docs/setup.md` (drift-tested) all derive from. Each item's `check` field is
// wired to its real implementation under `scripts/setup-check/checks/`
// (Phase 3, User Story 1).
import type { ConstitutionPrinciple, ItemPhase, ProviderContext, SetupItem } from "./types.ts";
import { check as checkLocalTools } from "./checks/local-tools.ts";
import { check as checkLocalCredentials } from "./checks/local-credentials.ts";
import { check as checkCloudflareZone } from "./checks/cloudflare-zone.ts";
import { check as checkDnsRecordsParity } from "./checks/dns-records-parity.ts";
import { check as checkDnsNameservers } from "./checks/dns-nameservers.ts";
import { check as checkLiveDomainGhost } from "./checks/live-domain-ghost.ts";
import { check as checkCloudflareWorker } from "./checks/cloudflare-worker.ts";
import { check as checkGithubMachineAccount } from "./checks/github-machine-account.ts";
import { check as checkGithubSecretScanning } from "./checks/github-secret-scanning.ts";
import { check as checkWorkersBuilds } from "./checks/workers-builds.ts";
import { check as checkGithubCiWorkflow } from "./checks/github-ci-workflow.ts";
import { check as checkGithubCodeowners } from "./checks/github-codeowners.ts";
import { check as checkGithubMajorLabel } from "./checks/github-major-label.ts";
import { check as checkGithubMainProtection } from "./checks/github-main-protection.ts";
import { check as checkPipelineSecrets } from "./checks/pipeline-secrets.ts";
import { check as checkReviewAddress } from "./checks/review-address.ts";
import { check as checkReviewAddressNoindex } from "./checks/review-address-noindex.ts";
import { check as checkWebAnalytics } from "./checks/web-analytics.ts";
import { check as checkContactD1Databases } from "./checks/contact-d1-databases.ts";
import { check as checkContactTurnstileWidget } from "./checks/contact-turnstile-widget.ts";
import { check as checkContactWorkerSecrets } from "./checks/contact-worker-secrets.ts";
import { check as checkContactPreviewBuilds } from "./checks/contact-preview-builds.ts";
import { check as checkContactTurnstileSiteKey } from "./checks/contact-turnstile-site-key.ts";
import { check as checkContactPreviewDeploy } from "./checks/contact-preview-deploy.ts";
import { check as checkContactProductionDeploy } from "./checks/contact-production-deploy.ts";

const checksById: Record<string, (ctx: ProviderContext) => ReturnType<SetupItem["check"]>> = {
  "local-tools": checkLocalTools,
  "local-credentials": checkLocalCredentials,
  "cloudflare-zone": checkCloudflareZone,
  "dns-records-parity": checkDnsRecordsParity,
  "dns-nameservers": checkDnsNameservers,
  "live-domain-ghost": checkLiveDomainGhost,
  "cloudflare-worker": checkCloudflareWorker,
  "github-machine-account": checkGithubMachineAccount,
  "github-secret-scanning": checkGithubSecretScanning,
  "workers-builds": checkWorkersBuilds,
  "github-ci-workflow": checkGithubCiWorkflow,
  "github-codeowners": checkGithubCodeowners,
  "github-major-label": checkGithubMajorLabel,
  "github-main-protection": checkGithubMainProtection,
  "pipeline-secrets": checkPipelineSecrets,
  "review-address": checkReviewAddress,
  "review-address-noindex": checkReviewAddressNoindex,
  "web-analytics": checkWebAnalytics,
  "contact-d1-databases": checkContactD1Databases,
  "contact-turnstile-widget": checkContactTurnstileWidget,
  "contact-worker-secrets": checkContactWorkerSecrets,
  "contact-preview-builds": checkContactPreviewBuilds,
  "contact-turnstile-site-key": checkContactTurnstileSiteKey,
  "contact-preview-deploy": checkContactPreviewDeploy,
  "contact-production-deploy": checkContactProductionDeploy,
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
  deferredUntilMerge?: boolean;
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
      "Every DNS record Squarespace serves today (the Ghost site, mail records, verification records) must exist in Cloudflare with identical values before the nameservers move.",
    where:
      "List every record from Squarespace's DNS screen into setup/dns-baseline.json (with its Squarespace TTL, for the audit trail) with a keep/drop decision, then create or import the keep records in Cloudflare as DNS only, leaving TTL on Cloudflare's Auto preset (the dashboard has no custom TTL option).",
    confirmedBy:
      "Every keep record in setup/dns-baseline.json exists in the Cloudflare zone with identical type/name/content/priority and proxied: false (TTL is informational only); every record without a decision keeps the item missing",
    needsDon: true,
    principles: ["VI", "X"],
    requirements: ["FR-019", "FR-034", "FR-035", "FR-036", "FR-037"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "dns-nameservers",
    order: 5,
    title: "DNS nameservers",
    purpose:
      "Moving the domain's nameservers from Squarespace to Cloudflare is what puts Cloudflare in charge of DNS; the one step with real risk to the live site and email.",
    where:
      "At Squarespace's domain settings for doncoleman.ca, change the nameservers to the two Cloudflare assigns, only after DNS parity is complete and the rollback procedure has been read.",
    confirmedBy:
      "Public NS for doncoleman.ca equal the zone's assigned nameservers and zone status is active; pending while delegation propagates",
    needsDon: true,
    principles: ["II", "VII"],
    requirements: ["FR-019"],
    secrets: [],
    dependsOn: ["dns-records-parity"],
    phase: "before-merge",
  },
  {
    id: "live-domain-ghost",
    order: 6,
    title: "Live domain still Ghost",
    purpose:
      "Throughout this setup, doncoleman.ca must keep serving the current Ghost site and mail unchanged; this item is the safety check that confirms that.",
    where: "Nothing to do here directly; read-only confirmation. On a problem, follow the DNS nameservers rollback procedure.",
    confirmedBy:
      "Public A/AAAA/CNAME answers for the apex and www equal the Ghost target records in the baseline; every keep MX and email TXT record resolves as in the baseline",
    needsDon: false,
    principles: ["X"],
    requirements: ["FR-019", "FR-038", "SC-005"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "cloudflare-worker",
    order: 7,
    title: "Cloudflare Worker",
    purpose: "The new site is hosted as a Cloudflare Worker serving static assets.",
    where:
      "Cloudflare dashboard -> Workers & Pages -> Create -> Import a repository -> drcdev/dcc-web, then turn on workers.dev and preview URLs.",
    confirmedBy: "Worker dcc-web exists; workers.dev and preview URLs enabled",
    needsDon: true,
    principles: ["II"],
    requirements: ["FR-017"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "github-machine-account",
    order: 8,
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
    order: 9,
    title: "GitHub secret scanning",
    purpose: "GitHub's own secret scanning and push protection are an always-on backstop alongside local secretlint.",
    where: "Repository Settings -> Code security -> turn on Secret scanning and Push protection.",
    confirmedBy: "security_and_analysis.secret_scanning and …secret_scanning_push_protection are both enabled",
    needsDon: true,
    principles: ["VII"],
    requirements: ["FR-024"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
  },
  {
    id: "workers-builds",
    order: 10,
    title: "Workers Builds",
    purpose: "Confirms Workers Builds is building and deploying this repository once this slice's files are on main.",
    where:
      "Nothing new beyond step 7 for the dcc-web Worker (production deploys from main; non-production branch builds are turned off there). Branch previews are built by the separate dcc-web-preview Worker, connected in step 22; this step confirms the pipeline once this slice's pull request has merged.",
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
    order: 11,
    title: "GitHub CI workflow",
    purpose: "Confirms the automated verify gate is actually running in GitHub Actions, not just locally.",
    where: "Nothing new to do here; ci.yml and major-change.yml are part of this slice's pull request.",
    confirmedBy: ".github/workflows/ci.yml and major-change.yml exist on main; latest verify run on main succeeded",
    needsDon: false,
    principles: ["II"],
    requirements: ["FR-015", "FR-016"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "github-codeowners",
    order: 12,
    title: "GitHub CODEOWNERS",
    purpose: "Confirms GitHub recognises .github/CODEOWNERS correctly, so major paths require Don's review.",
    where: "Nothing new to do here; CODEOWNERS is part of this slice's pull request.",
    confirmedBy: ".github/CODEOWNERS on main lists @drcdev for every major path; GitHub reports no errors in it",
    needsDon: false,
    principles: ["III"],
    requirements: ["FR-014"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "github-major-label",
    order: 13,
    title: "GitHub major-change label",
    purpose: "The major-change label is the second way of marking a pull request as needing Don's review.",
    where: "Repository -> Labels -> create major-change. Repository Settings -> General -> turn on Allow auto-merge.",
    confirmedBy: "Label major-change exists; repository allow_auto_merge is true",
    needsDon: true,
    principles: ["III"],
    requirements: ["FR-014"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "github-main-protection",
    order: 14,
    title: "GitHub main branch protection",
    purpose: "What actually stops an unreviewed or failing change from reaching main.",
    where: "Import setup/github-ruleset.json as a repository ruleset on main.",
    confirmedBy:
      "Active ruleset on main matches setup/github-ruleset.json: PR required, code-owner review, required checks verify + major-change-approval (strict; a commit status posted by the Major change workflow's gate job), no force-push, no deletion, no bypass actors",
    needsDon: true,
    principles: ["II", "III"],
    requirements: ["FR-013", "FR-014"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
  },
  {
    id: "pipeline-secrets",
    order: 15,
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
    id: "review-address",
    order: 16,
    title: "Review address",
    purpose: "Gives Don a stable HTTPS address to view this slice's deployment before the real domain switches over.",
    where: "Cloudflare dashboard -> Workers & Pages -> dcc-web -> Settings -> Domains & Routes -> Add Custom Domain -> new.doncoleman.ca.",
    confirmedBy: "new.doncoleman.ca is a Custom Domain on dcc-web; https://new.doncoleman.ca/ returns 200 over HTTPS",
    needsDon: true,
    principles: ["X"],
    requirements: ["FR-020"],
    secrets: [],
    dependsOn: ["dns-nameservers", "workers-builds"],
    phase: "after-merge",
  },
  {
    id: "review-address-noindex",
    order: 17,
    title: "Review address no-index",
    purpose: "The review address must never be indexed by search engines while the real site is still doncoleman.ca.",
    where: "Nothing new to do here; public/_headers sends X-Robots-Tag: noindex on every path.",
    confirmedBy: "Response from https://new.doncoleman.ca/ has an X-Robots-Tag header containing noindex",
    needsDon: false,
    principles: ["X"],
    requirements: ["FR-020"],
    secrets: [],
    dependsOn: ["review-address"],
    phase: "after-merge",
  },
  {
    id: "web-analytics",
    order: 18,
    title: "Web Analytics",
    purpose: "Gives Don basic, privacy-focused visitor statistics for the review address, with no cookies and no personal data.",
    where: "Cloudflare dashboard -> Analytics & Logs -> Web Analytics -> Add a site -> select doncoleman.ca (the dashboard offers the zone, not a hostname) -> Enable (automatic setup).",
    confirmedBy: "Web Analytics site for new.doncoleman.ca or the doncoleman.ca zone exists with automatic setup on; served HTML references the Cloudflare beacon",
    needsDon: true,
    principles: ["X"],
    requirements: ["FR-022"],
    secrets: [],
    dependsOn: ["review-address"],
    phase: "after-merge",
  },
  {
    id: "contact-d1-databases",
    order: 19,
    title: "Contact databases",
    purpose: "Contact messages are stored in Cloudflare D1, with production and preview kept in separate databases.",
    where:
      "Both databases will be created in Western North America (wnam). D1 cannot keep data only in Canada, and the location cannot be changed after the databases are created. In a terminal in the repository run: pnpm exec wrangler login (if needed), pnpm exec wrangler d1 create contact --location wnam, then pnpm exec wrangler d1 create contact-preview --location wnam. Choose no if Wrangler offers to add the binding to the config. The agent then reads the two IDs with pnpm exec wrangler d1 list --json and records them in wrangler.jsonc.",
    confirmedBy:
      "Both databases exist by name, each reports region WNAM, and their IDs equal the database_id values in wrangler.jsonc",
    needsDon: true,
    principles: ["VII", "VIII", "IX"],
    requirements: ["FR-017", "FR-027a", "FR-028"],
    secrets: [],
    dependsOn: ["local-credentials", "cloudflare-worker"],
    phase: "before-merge",
  },
  {
    id: "contact-turnstile-widget",
    order: 20,
    title: "Spam-protection widget",
    purpose: "A Cloudflare Turnstile widget protects the contact form from bots without a visible puzzle.",
    where:
      "Cloudflare dashboard -> Turnstile -> Add widget. Name dcc-web contact; hostnames doncoleman.ca and drc-dev.workers.dev; mode Managed; no pre-clearance. Keep the page open for steps 21 and 23.",
    confirmedBy:
      "A widget named dcc-web contact exists in managed mode, its domains include doncoleman.ca, and either include drc-dev.workers.dev or the preview fallback is in use",
    needsDon: true,
    principles: ["VIII", "X"],
    requirements: ["FR-012"],
    secrets: [],
    dependsOn: ["local-credentials"],
    phase: "before-merge",
  },
  {
    id: "contact-worker-secrets",
    order: 21,
    title: "Contact secrets",
    purpose: "The contact Workers need a Turnstile secret, a read token and a salt, stored as Worker secrets and never in the repository.",
    where:
      "In a terminal in the repository, run wrangler secret put for TURNSTILE_SECRET_KEY, CONTACT_READ_TOKEN and IP_HASH_SALT on dcc-web, then the same with --env preview on dcc-web-preview (different read token and salt). Type or pipe the values yourself; never paste them into the chat.",
    confirmedBy: "The three secret names exist on both dcc-web and dcc-web-preview (names only; values are never read)",
    needsDon: true,
    principles: ["VII", "VIII"],
    requirements: ["FR-023", "FR-024", "FR-028"],
    secrets: ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"],
    dependsOn: ["cloudflare-worker", "contact-turnstile-widget"],
    phase: "before-merge",
  },
  {
    id: "contact-preview-builds",
    order: 22,
    title: "Preview Worker builds",
    purpose: "Branch previews are built and deployed by their own Worker, dcc-web-preview, so they use the preview database and secrets.",
    where:
      "Cloudflare dashboard -> Workers & Pages -> dcc-web-preview -> Settings -> Build -> Connect drcdev/dcc-web; build command pnpm run build; deploy command pnpm run deploy:preview for production and non-production branches; then turn on the workers.dev address and preview URLs. On dcc-web turn non-production branch builds off.",
    confirmedBy:
      "dcc-web-preview exists and its Workers Builds triggers use pnpm run deploy:preview; dcc-web has no non-production trigger",
    needsDon: true,
    principles: ["II", "VII", "VIII"],
    requirements: ["FR-017", "FR-024"],
    secrets: [],
    dependsOn: ["contact-worker-secrets"],
    phase: "before-merge",
  },
  {
    id: "contact-turnstile-site-key",
    order: 23,
    title: "Site key build variable",
    purpose: "The public Turnstile site key reaches the built page through a build variable on each Worker.",
    where:
      "For dcc-web and dcc-web-preview: Settings -> Build -> Variables and secrets -> add the build variable PUBLIC_TURNSTILE_SITE_KEY (plain text) with the widget's site key.",
    confirmedBy: "The variable name PUBLIC_TURNSTILE_SITE_KEY exists on every build trigger of both Workers (names only)",
    needsDon: true,
    principles: ["VIII", "X"],
    requirements: ["FR-012", "FR-028"],
    secrets: ["PUBLIC_TURNSTILE_SITE_KEY"],
    dependsOn: ["contact-preview-builds"],
    phase: "before-merge",
  },
  {
    id: "contact-preview-deploy",
    order: 24,
    title: "Preview migrations and clean-up schedule",
    purpose: "The preview deployment applies the database migrations and registers the daily clean-up schedule.",
    where:
      "Cloudflare dashboard -> My Profile -> API Tokens -> the token Workers Builds uses -> Edit -> add Account -> D1: Edit. Then push the branch or choose Retry build on dcc-web-preview.",
    confirmedBy:
      "contact-preview has every migration in migrations/ applied and dcc-web-preview has the cron 17 3 * * *; pending while a build is running",
    needsDon: true,
    principles: ["II", "VII", "VIII"],
    requirements: ["FR-018", "FR-028"],
    secrets: [],
    dependsOn: ["contact-d1-databases", "contact-worker-secrets", "contact-preview-builds", "contact-turnstile-site-key"],
    phase: "before-merge",
  },
  {
    id: "contact-production-deploy",
    order: 25,
    title: "Production migrations and clean-up schedule",
    purpose: "After the merge, production applies the migrations and registers the clean-up schedule so the contact form works.",
    where:
      "Right after the pull request merges: dcc-web -> Settings -> Build -> production deploy command pnpm run deploy:production, then Retry the latest main build.",
    confirmedBy:
      "dcc-web's production trigger uses pnpm run deploy:production, contact has every migration applied, and dcc-web has the cron 17 3 * * *",
    needsDon: true,
    principles: ["II", "VII", "VIII"],
    requirements: ["FR-018", "FR-028"],
    secrets: [],
    dependsOn: ["contact-preview-deploy"],
    phase: "after-merge",
    deferredUntilMerge: true,
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
