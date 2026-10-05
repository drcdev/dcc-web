// tests/unit/setup-check/next-action.test.ts (FR-028, partial): every
// per-item check's `missing` and `could-not-check` next actions must read as
// an instruction Don can act on immediately — starting with an imperative
// verb, never a bare screen path ("Cloudflare dashboard →", "Repository
// Settings →"), never "This slice's…", never "At …". `pending` next actions
// are exempt (they are informational, e.g. "Nothing to do now…").
import { describe, expect, it, vi } from "vitest";
import type { CheckResult, ProviderContext } from "../../../scripts/setup-check/types.ts";
import { ProviderAccessError } from "../../../scripts/setup-check/types.ts";
import { check as checkCloudflareWorker } from "../../../scripts/setup-check/checks/cloudflare-worker.ts";
import { check as checkCloudflareZone } from "../../../scripts/setup-check/checks/cloudflare-zone.ts";
import { check as checkDnsNameservers } from "../../../scripts/setup-check/checks/dns-nameservers.ts";
import { check as checkDnsRecordsParity } from "../../../scripts/setup-check/checks/dns-records-parity.ts";
import { check as checkGithubCiWorkflow } from "../../../scripts/setup-check/checks/github-ci-workflow.ts";
import { check as checkGithubCodeowners } from "../../../scripts/setup-check/checks/github-codeowners.ts";
import { check as checkGithubMachineAccount } from "../../../scripts/setup-check/checks/github-machine-account.ts";
import { check as checkGithubMainProtection } from "../../../scripts/setup-check/checks/github-main-protection.ts";
import { check as checkGithubMajorLabel } from "../../../scripts/setup-check/checks/github-major-label.ts";
import { check as checkGithubSecretScanning } from "../../../scripts/setup-check/checks/github-secret-scanning.ts";
import { check as checkLiveDomainGhost } from "../../../scripts/setup-check/checks/live-domain-ghost.ts";
import { check as checkLocalCredentials } from "../../../scripts/setup-check/checks/local-credentials.ts";
import { check as checkLocalTools } from "../../../scripts/setup-check/checks/local-tools.ts";
import { check as checkPipelineSecrets } from "../../../scripts/setup-check/checks/pipeline-secrets.ts";
import { check as checkReviewAddressRemoved } from "../../../scripts/setup-check/checks/review-address-removed.ts";
import { check as checkPreviewNoindex } from "../../../scripts/setup-check/checks/preview-noindex.ts";
import { check as checkWebAnalytics } from "../../../scripts/setup-check/checks/web-analytics.ts";
import { check as checkWorkersBuilds } from "../../../scripts/setup-check/checks/workers-builds.ts";
import { fakeProviderContext, envFrom, loadFixture, toCloudflareZone } from "./checks/test-helpers.ts";

// The imperative verbs actually used to open a nextAction string across
// scripts/setup-check/checks/*.ts. A screen path ("Cloudflare dashboard →",
// "Repository Settings →"), an ALL_CAPS env var name, "This slice's…" or
// "At …" never appears in this set, by construction.
const IMPERATIVE_VERBS = new Set([
  "Add",
  "Change",
  "Check",
  "Complete",
  "Confirm",
  "Copy",
  "Create",
  "Decide",
  "Fix",
  "Give",
  "Import",
  "Install",
  "Lower",
  "Open",
  "Push",
  "Remove",
  "Record",
  "Restore",
  "Run",
  "Switch",
  "Turn",
  "Wait",
]);

function firstWord(text: string): string {
  return /^[A-Za-z']+/.exec(text)?.[0] ?? "";
}

function isImperativeNextAction(text: string): boolean {
  return IMPERATIVE_VERBS.has(firstWord(text));
}

function fsJson(map: Record<string, unknown>) {
  return ((path: string) => (path in map ? map[path] : null)) as never;
}

function githubApiRoutes(routes: Record<string, unknown>) {
  return vi.fn(async (path: string) => {
    for (const [match, value] of Object.entries(routes)) {
      if (path.includes(match)) return value;
    }
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

const CONFIG = {
  owner: "drcdev",
  repo: "dcc-web",
  zone: "doncoleman.ca",
  workerName: "dcc-web",
  reviewHost: "new.doncoleman.ca",
  machineAccount: "drc-agents",
};

const COMPLETE_BASELINE = {
  originalNameservers: ["ns1.squarespacedns.com", "ns2.squarespacedns.com"],
  records: [
    {
      type: "A",
      name: "doncoleman.ca",
      content: "192.0.2.10",
      priority: null,
      ttl: 3600,
      source: "squarespace",
      decision: "keep",
      reason: null,
    },
  ],
};

const VALID_CODEOWNERS = `
/.github/                              @drcdev
/package.json                          @drcdev
/pnpm-lock.yaml                        @drcdev
/.nvmrc                                @drcdev
/wrangler.jsonc                        @drcdev
/astro.config.mjs                      @drcdev
/public/_headers                       @drcdev
/scripts/ci/                           @drcdev
/setup/                                @drcdev
/.specify/memory/constitution.md       @drcdev
/.github/CODEOWNERS                    @drcdev
`;

const CF_ENV = {
  CLOUDFLARE_API_TOKEN: "cf-token-value",
  CLOUDFLARE_ACCOUNT_ID: "account-123",
  CLOUDFLARE_ZONE_ID: "zone-123",
};

/** A ProviderContext where dns-records-parity, dns-nameservers, review-address
 * and workers-builds all report complete — needed to reach the deeper
 * branches of checks that gate on them (review-address's Custom Domain
 * branch, dns-nameservers' own credential/Squarespace branches). */
async function dependenciesSatisfiedContext(overrides: Parameters<typeof fakeProviderContext>[0] = {}): Promise<ProviderContext> {
  const zoneRaw = loadFixture<Parameters<typeof toCloudflareZone>[0]>("cloudflare", "zone-active-free-plan");
  const { answers } = loadFixture<{ answers: string[] }>("dns", "nameservers-cloudflare-delegated");
  return fakeProviderContext({
    env: overrides.env ?? envFrom(CF_ENV),
    fs: overrides.fs ?? { readJson: fsJson({ "setup/config.json": CONFIG, "setup/dns-baseline.json": COMPLETE_BASELINE }) },
    dns: { resolveNameservers: async () => answers, ...overrides.dns },
    cloudflare: {
      getZone: async () => toCloudflareZone(zoneRaw),
      listDnsRecords: async () => [
        { type: "A", name: "doncoleman.ca", content: "192.0.2.10", priority: null, ttl: 3600, proxied: false },
      ],
      listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-review-host"),
      ...overrides.cloudflare,
    },
    http: overrides.http ?? { get: async () => loadFixture("http", "review-host-200-noindex") },
    github: overrides.github ?? {
      api: githubApiRoutes({
        "/commits/main/check-runs": loadFixture("github", "check-runs-workers-builds-success"),
        "/pulls": [],
      }),
    },
  });
}

interface Scenario {
  name: string;
  missing?: () => Promise<CheckResult>;
  couldNotCheck?: () => Promise<CheckResult>;
}

const scenarios: Scenario[] = [
  {
    name: "local-tools",
    missing: () =>
      checkLocalTools(
        fakeProviderContext({
          env: envFrom({ npm_config_user_agent: "pnpm/11.15.1 npm/? node/v18.0.0 darwin arm64" }),
        }),
      ),
    couldNotCheck: () => checkLocalTools(fakeProviderContext({})),
  },
  {
    name: "local-credentials",
    missing: () => checkLocalCredentials(fakeProviderContext({ env: envFrom({}) })),
    couldNotCheck: () =>
      checkLocalCredentials(
        fakeProviderContext({
          env: envFrom(CF_ENV),
          cloudflare: {
            verifyToken: async () => {
              throw new ProviderAccessError("Cloudflare rejected the API token (401).");
            },
          },
        }),
      ),
  },
  {
    name: "cloudflare-zone",
    missing: () =>
      checkCloudflareZone(
        fakeProviderContext({
          env: envFrom(CF_ENV),
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          cloudflare: {
            getZone: async () => {
              throw new ProviderAccessError("Cloudflare request failed: The specified zone was not found (1049)");
            },
          },
        }),
      ),
    couldNotCheck: () => checkCloudflareZone(fakeProviderContext({ env: envFrom({}) })),
  },
  {
    name: "dns-records-parity",
    missing: () =>
      checkDnsRecordsParity(
        fakeProviderContext({
          env: envFrom(CF_ENV),
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          cloudflare: {
            listDnsRecords: async () => [],
            listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-review-host"),
          },
        }),
      ),
    couldNotCheck: () => checkDnsRecordsParity(fakeProviderContext({ env: envFrom({}) })),
  },
  {
    name: "dns-nameservers (still points at Squarespace)",
    missing: () =>
      dependenciesSatisfiedContext({
        dns: { resolveNameservers: async () => ["ns1.squarespacedns.com", "ns2.squarespacedns.com"] },
      }).then((ctx) => checkDnsNameservers(ctx)),
    couldNotCheck: () =>
      dependenciesSatisfiedContext({
        cloudflare: {
          getZone: async () => {
            throw new ProviderAccessError("Cloudflare token lacks Zone: Read read access (403): x");
          },
        },
      }).then((ctx) => checkDnsNameservers(ctx)),
  },
  {
    name: "live-domain-ghost",
    missing: () =>
      checkLiveDomainGhost(
        fakeProviderContext({
          env: envFrom(CF_ENV),
          fs: { readJson: fsJson({ "setup/config.json": CONFIG, "setup/dns-baseline.json": { originalNameservers: [], records: [] } }) },
          cloudflare: { listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-review-host") },
        }),
      ),
  },
  {
    name: "cloudflare-worker",
    missing: () =>
      checkCloudflareWorker(
        fakeProviderContext({
          env: envFrom({ CLOUDFLARE_API_TOKEN: "x", CLOUDFLARE_ACCOUNT_ID: "acct-123" }),
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          cloudflare: { getWorkerScript: async () => null },
        }),
      ),
    couldNotCheck: () => checkCloudflareWorker(fakeProviderContext({ env: envFrom({ CLOUDFLARE_API_TOKEN: "x" }) })),
  },
  {
    name: "github-machine-account",
    missing: () =>
      checkGithubMachineAccount(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: { api: async () => loadFixture("github", "collaborator-permission-admin") },
        }),
      ),
    couldNotCheck: () =>
      checkGithubMachineAccount(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
            },
          },
        }),
      ),
  },
  {
    name: "github-secret-scanning",
    missing: () =>
      checkGithubSecretScanning(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: { api: async () => loadFixture("github", "repo-settings-secret-scanning-off") },
        }),
      ),
    couldNotCheck: () =>
      checkGithubSecretScanning(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh api access denied (401/403)");
            },
          },
        }),
      ),
  },
  {
    name: "github-ci-workflow",
    missing: () =>
      checkGithubCiWorkflow(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: githubApiRoutes({
              "/actions/workflows": { workflows: [{ path: ".github/workflows/ci.yml", name: "CI" }] },
            }),
          },
        }),
      ),
    couldNotCheck: () =>
      checkGithubCiWorkflow(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh api access denied (401/403)");
            },
          },
        }),
      ),
  },
  {
    name: "github-codeowners",
    missing: () =>
      checkGithubCodeowners(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }), readText: (() => null) as never },
        }),
      ),
    couldNotCheck: () =>
      checkGithubCodeowners(
        fakeProviderContext({
          fs: {
            readJson: fsJson({ "setup/config.json": CONFIG }),
            readText: (() => VALID_CODEOWNERS) as never,
          },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
            },
          },
        }),
      ),
  },
  {
    name: "github-major-label",
    missing: () =>
      checkGithubMajorLabel(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: githubApiRoutes({
              "/labels": loadFixture("github", "labels-without-major-change"),
              "repos/drcdev/dcc-web": loadFixture("github", "repo-settings-no-auto-merge"),
            }),
          },
        }),
      ),
    couldNotCheck: () =>
      checkGithubMajorLabel(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh api access denied (401/403)");
            },
          },
        }),
      ),
  },
  {
    name: "github-main-protection",
    missing: () =>
      checkGithubMainProtection(
        fakeProviderContext({
          fs: {
            readJson: fsJson({
              "setup/config.json": CONFIG,
              "setup/github-ruleset.json": loadFixture("github", "ruleset-full"),
            }),
          },
          github: { api: async () => loadFixture("github", "ruleset-none") },
        }),
      ),
    couldNotCheck: () =>
      checkGithubMainProtection(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
            },
          },
        }),
      ),
  },
  {
    name: "pipeline-secrets",
    missing: () =>
      checkPipelineSecrets(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: githubApiRoutes({
              "/actions/secrets": { total_count: 1, secrets: [{ name: "SOME_UNDOCUMENTED_SECRET" }] },
              "/actions/variables": loadFixture("github", "actions-variables-empty"),
            }),
          },
        }),
      ),
    couldNotCheck: () =>
      checkPipelineSecrets(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
            },
          },
        }),
      ),
  },
  {
    name: "review-address-removed",
    missing: () =>
      dependenciesSatisfiedContext({
        cloudflare: { listWorkerDomains: async () => loadFixture("cloudflare", "worker-domains-apex-switched") },
      }).then((ctx) => checkReviewAddressRemoved(ctx)),
    couldNotCheck: () =>
      dependenciesSatisfiedContext({
        env: envFrom({ CLOUDFLARE_API_TOKEN: CF_ENV.CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID: CF_ENV.CLOUDFLARE_ZONE_ID }),
      }).then((ctx) => checkReviewAddressRemoved(ctx)),
  },
  {
    name: "preview-noindex",
    missing: () =>
      checkPreviewNoindex(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": { ...CONFIG, workersSubdomain: "drc-dev" } }) },
          http: { get: async () => ({ status: 200, headers: {}, body: "" }) },
        }),
      ),
  },
  {
    name: "web-analytics (no site yet)",
    missing: () =>
      dependenciesSatisfiedContext({
        cloudflare: { listWebAnalyticsSites: async () => loadFixture("cloudflare", "web-analytics-site-absent") },
      }).then((ctx) => checkWebAnalytics(ctx)),
  },
  {
    name: "web-analytics (automatic setup off)",
    missing: () =>
      dependenciesSatisfiedContext({
        cloudflare: {
          listWebAnalyticsSites: async () => [{ siteTag: "t1", host: CONFIG.reviewHost, autoInstall: false, zoneName: null }],
        },
      }).then((ctx) => checkWebAnalytics(ctx)),
  },
  {
    name: "workers-builds",
    missing: () =>
      checkWorkersBuilds(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: { api: githubApiRoutes({ "/commits/main/check-runs": { check_runs: [] } }) },
        }),
      ),
    couldNotCheck: () =>
      checkWorkersBuilds(
        fakeProviderContext({
          fs: { readJson: fsJson({ "setup/config.json": CONFIG }) },
          github: {
            api: async () => {
              throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
            },
          },
        }),
      ),
  },
];

describe("setup-check next actions are imperative instructions", () => {
  for (const scenario of scenarios) {
    if (scenario.missing) {
      it(`${scenario.name}: missing nextAction starts with an imperative verb`, async () => {
        const result = await scenario.missing!();
        expect(result.status).toBe("missing");
        expect(result.nextAction).toBeTruthy();
        expect(
          isImperativeNextAction(result.nextAction!),
          `"${result.nextAction}" does not start with an imperative verb`,
        ).toBe(true);
      });
    }
    if (scenario.couldNotCheck) {
      it(`${scenario.name}: could-not-check nextAction starts with an imperative verb`, async () => {
        const result = await scenario.couldNotCheck!();
        expect(result.status).toBe("could-not-check");
        expect(result.nextAction).toBeTruthy();
        expect(
          isImperativeNextAction(result.nextAction!),
          `"${result.nextAction}" does not start with an imperative verb`,
        ).toBe(true);
      });
    }
  }
});
