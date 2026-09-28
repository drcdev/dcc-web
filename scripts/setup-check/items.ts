// The 18-item setup registry (data-model.md "SetupItem"). This is the single
// source of truth the setup check, the `/setup-walkthrough` skill and
// `docs/setup.md` (drift-tested) all derive from. Each item's `check` field is
// wired to a placeholder function until Phase 3 (User Story 1) implements the
// real per-item checks under `scripts/setup-check/checks/`.
import type { CheckResult, ConstitutionPrinciple, ItemPhase, ProviderContext, SetupItem } from "./types.ts";

const TOTAL_ITEMS = 18;

function stepLabel(order: number): string {
  return `Step ${order} of ${TOTAL_ITEMS}`;
}

/** Placeholder check, replaced per item in Phase 3 (US1). Always reports could-not-check. */
function notImplemented(id: string, order: number): (ctx: ProviderContext) => Promise<CheckResult> {
  return async (): Promise<CheckResult> => ({
    id,
    status: "could-not-check",
    summary: `The "${id}" check is not implemented yet.`,
    details: [],
    nextAction: "No action needed from Don yet; this check will be implemented in a later task.",
    step: stepLabel(order),
    docs: `docs/setup.md#${id}`,
    reason: "check not implemented yet",
  });
}

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
      "Create a read-only Cloudflare API token (Zone Read, DNS Read, Workers Scripts Read, Web Analytics Read), then copy .env.example to .env and fill in the values.",
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
      "List every record from Squarespace's DNS screen into setup/dns-baseline.json with a keep/drop decision, then create or import the keep records in Cloudflare as DNS only, with the exact Squarespace TTL.",
    confirmedBy:
      "Every keep record in setup/dns-baseline.json exists in the Cloudflare zone with identical type/name/content/TTL/priority and proxied: false; every record without a decision keeps the item missing",
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
      "Create GitHub account dcc-bot, add it as a drcdev/dcc-web collaborator with write permission, sign it into the local gh keyring, then switch back to Don's account.",
    confirmedBy: "dcc-bot collaborator permission is write (or maintain), not admin",
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
    where: "Nothing new beyond step 7; confirms the pipeline it connected, once this slice's pull request has merged.",
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
      "Active ruleset on main matches setup/github-ruleset.json: PR required, code-owner review, required checks verify + major-change-approval (strict), no force-push, no deletion, no bypass actors",
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
    where: "Cloudflare dashboard -> Analytics & Logs -> Web Analytics -> Add a site -> new.doncoleman.ca -> Enable (automatic setup).",
    confirmedBy: "Web Analytics site for new.doncoleman.ca exists with automatic setup on; served HTML references the Cloudflare beacon",
    needsDon: true,
    principles: ["X"],
    requirements: ["FR-022"],
    secrets: [],
    dependsOn: ["review-address"],
    phase: "after-merge",
  },
];

export const setupItems: SetupItem[] = seeds.map((seed) => ({
  ...seed,
  check: notImplemented(seed.id, seed.order),
}));

export function getSetupItem(id: string): SetupItem | undefined {
  return setupItems.find((item) => item.id === id);
}
