# Implementation Plan: Setup Walkthrough and Setup Check

**Branch**: `001-setup-walkthrough` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-setup-walkthrough/spec.md`

## Summary

Bootstrap the repository so the site can be built, checked and deployed, and give Don a guided,
repeatable way to set up and confirm every account-side piece. The slice adds: a pnpm-managed
Astro 7 project with one static, no-JavaScript placeholder page; a local `pnpm run verify` gate
(secret scan, lint, `astro check`, Vitest, build, Playwright accessibility and page-budget tests)
that GitHub Actions runs as the required `verify` check; a read-only TypeScript **setup check**
(`pnpm setup:check`) that inspects GitHub (via `gh api`), Cloudflare (official SDK with a
read-only token), public DNS and HTTPS responses and reports each of 18 items as complete,
missing, pending or could-not-check; a **`/setup-walkthrough` Claude Code skill** that walks Don
through the same items in a safe order, pausing with AskUserQuestion and confirming each step with
the check; and a `docs/setup.md` runbook. Hosting is a static-assets Worker deployed by Workers
Builds with per-branch preview URLs; `new.doncoleman.ca` is its Custom Domain with `noindex`;
DNS moves to Cloudflare after a committed baseline of the Squarespace records is matched; Web
Analytics uses automatic setup. Major PRs are gated by CODEOWNERS paths (native) plus a
`major-change` label check. Added running cost: **$0/month**.

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict, `astro/tsconfigs/strict`), Node.js 24 LTS (`.nvmrc`); scripts run via Node's built-in type stripping.

**Primary Dependencies**: `astro` 7.x (site + `astro/zod`); dev: `wrangler` 4.x, `@astrojs/check`, `typescript` ~6.0, `vitest`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `typescript-eslint`, `eslint-plugin-astro`, `secretlint` + `@secretlint/secretlint-rule-preset-recommend`, `cloudflare` (official Cloudflare TypeScript SDK, read-only use). Exact versions fixed by `pnpm-lock.yaml`.

**Package manager**: **pnpm** (v11, `packageManager` field; `pnpm-lock.yaml` committed; CI uses `--frozen-lockfile`).

**Storage**: None. Committed JSON under `setup/` (config, DNS baseline, ruleset); gitignored `.env` for local credentials.

**Testing**: Vitest (unit/schema tests for check logic, registry, manifests, gate script, `_headers`; configured with Astro's `getViteConfig()`); Playwright + axe-core (accessibility and page-budget on the built placeholder). Provider calls are faked from recorded fixtures.

**Target Platform**: Cloudflare Workers static assets (site); developer macOS / GitHub Actions `ubuntu-latest` (scripts, CI).

**Project Type**: Static web site (Astro) plus repository tooling (CLI script, CI workflows, Claude Code skill, runbook).

**Performance Goals**: Setup check completes in < 30 s (SC-002); placeholder ships 0 JS, CLS 0, < 30 KB transfer.

**Constraints**: Check is strictly read-only (FR-004); no secret value in repo, output, logs or chat (FR-005, FR-024); live domain keeps serving Ghost (SC-005); $0 added cost (SC-007).

**Scale/Scope**: 18 setup items; 1 placeholder page; 2 workflows; 1 skill; 1 runbook.

No `NEEDS CLARIFICATION` remain; all resolved in [research.md](./research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Astro Docs MCP was available and used for every Astro choice (citations in research.md R2, R3,
R5, R8, R11). Cloudflare choices were checked against the `cloudflare` skill references and the
Astro Cloudflare deploy guide.

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | Test-First | PASS | Test layers defined below; tasks must write and see fail: setup-check unit tests (per item, with recorded fixtures), report-schema tests, registry/docs/secret-manifest drift tests, read-only and redaction guard tests, major-change gate tests, `_headers`/config tests, and Playwright a11y + budget tests — before the code they cover. No contact API or content collections exist yet, so their layers do not apply in this slice. Component tests (Astro Container API) are not needed for a single page with no components; the page is covered by E2E + a11y. |
| II | Automated Release Gate | PASS | `pnpm run verify` runs secret scan, lint, type check, unit tests, build, and E2E/a11y/page-budget; CI job `verify` runs exactly that and is a required check. Production deploys only from `main` (Workers Builds), and `main` accepts only PRs with green required checks, no bypass. Every branch gets a Workers Builds preview URL. Full Lighthouse/CWV budget is added by the first feature with real templates (spec out-of-scope), and the page-budget test is the gate until then. |
| III | Human Review for Major Changes | PASS — **this slice is a MAJOR change** | It adds dependencies, a new integration/service connection (Workers Builds, Web Analytics), and CI, deployment and infrastructure configuration (workflows, ruleset, `wrangler.jsonc`, DNS move). Don must approve the PR after viewing the Workers Builds preview. The plan also implements the Principle III mechanism: CODEOWNERS (native) for path-defined majors + a required `major-change-approval` check for the `major-change` label; PRs come from `drc-agents` so Don's approval counts. Bootstrap exception: this PR predates `drc-agents` and the ruleset, so Don merges it by hand after review, and only when `verify` on the PR's latest commit is green (see Complexity Tracking). |
| IV | First-Party Before Custom | PASS | See the first-party table below; every capability uses the Astro, Cloudflare, GitHub or Node first-party option, and each custom piece names the first-party option and why it falls short. |
| V | Static by Default | PASS | `output: 'static'` (default), no adapter, placeholder has no client JS and works with JS disabled (E2E test). The edge-injected Web Analytics beacon is the constitution-permitted analytics exception (Principle X). |
| VI | Content as Files | PASS (n/a in depth) | No content collections yet; the placeholder copy lives in the `.astro` file. No CMS or database. Setup data is committed JSON validated by `astro/zod` schemas that fail loudly. |
| VII | Private Data | PASS | Slice collects no personal data. Secrets live in `.env` (gitignored), `gh` keyring and provider screens only; committed `.env.example` has names only; check reports names only and redacts known secret values as defence in depth; secretlint + GitHub push protection block commits of secret-like values. Web Analytics is cookie-free with no personal data. |
| VIII | Fly.io Best Practices | N/A | No Fly.io resources in this slice (contact service is its own feature). The check's registry is designed so that feature can add Fly items. |
| IX | Cost Ceiling | PASS | Added cost **$0/month** (research R15): GitHub free (public repo), Cloudflare Free plan (DNS, Workers static assets, Workers Builds, Custom Domain, Web Analytics), `drc-agents` free. Total remains within $13. |
| X | Accessible, Fast and Private | PASS | axe WCAG 2.0/2.1/2.2 A+AA scan with zero violations on the placeholder; page-budget test (0 JS, CLS 0, < 30 KB); no cookies or third-party scripts beyond Cloudflare Web Analytics. |
| XI | Spec Kit Workflow | PASS | Spec Kit branch/dir naming (`001-setup-walkthrough`); one feature per branch; changes limited to scope; out-of-scope items stay in the spec's follow-up list. |
| — | Technology Constraints | PASS with deferral | Astro (current stable 7.x), TypeScript strict, Cloudflare hosting with per-branch previews, GitHub Actions CI, one package manager with committed lockfile, Cloudflare Web Analytics. **Tailwind** is deferred to the design-system feature (placeholder needs no styling) — not a deviation. New tools outside the listed stack (Vitest, Playwright, axe-core, ESLint, secretlint, Cloudflare SDK, Wrangler) are reviewed as part of this major change. |
| — | Development Workflow | PASS | Constitution Check covers each principle; Astro choices cite docs pages; tasks will order tests first; placeholder copy is plain language. |

**Gate result (pre-research)**: PASS. **Re-check after Phase 1 design**: PASS — the data model,
contracts and quickstart introduce no new services, costs or data flows beyond those above.

### First-party options per capability (Principle IV)

| Capability | First-party option | Used? | Notes / why custom where custom |
|---|---|---|---|
| Project skeleton | Astro manual install ([Install Astro](https://docs.astro.build/en/install-and-setup/#manual-setup)) | Yes | |
| Type checking | `astro check` ([CLI](https://docs.astro.build/en/reference/cli-reference/#astro-check)) | Yes | |
| Unit tests | Vitest via Astro `getViteConfig()` ([Testing](https://docs.astro.build/en/guides/testing/#vitest)) | Yes | Astro has no own test runner; docs recommend this. |
| E2E | Playwright ([Testing](https://docs.astro.build/en/guides/testing/#playwright)) | Yes | Constitution names Playwright. |
| Accessibility check | Astro dev-toolbar audit | No | Dev-server only, not scriptable in CI; `@axe-core/playwright` used. |
| Linting | none in Astro | — | Docs point to community `eslint-plugin-astro`. |
| Schemas | `astro/zod` ([Zod API](https://docs.astro.build/en/reference/modules/astro-zod/)) | Yes | No separate Zod dependency. |
| Hosting + previews | Cloudflare Workers static assets + Workers Builds ([Astro deploy guide](https://docs.astro.build/en/guides/deploy/cloudflare/)) | Yes | No deploy token in GitHub. |
| No-index header | Cloudflare `_headers` in `public/` ([@astrojs/cloudflare — Headers](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-platform)) | Yes | |
| Review address | Worker Custom Domain | Yes | Cloudflare manages DNS + certificate. |
| DNS | Cloudflare zone (Free) + quick-scan import | Yes | Plus committed baseline, because Squarespace has no export API and DNS cannot be enumerated. |
| Analytics | Cloudflare Web Analytics automatic setup | Yes | |
| Cloudflare reads | Cloudflare API via official `cloudflare` SDK | Yes | Wrangler lacks zone/DNS/custom-domain/RUM read commands (R8). |
| GitHub reads | `gh api` (GitHub's CLI) | Yes | Uses `gh` sign-in; no token handling. |
| Branch protection | GitHub repository rulesets | Yes | |
| Major-change marking | CODEOWNERS + required code-owner review | Yes (paths) | GitHub has no "require review when labelled"; a ~50-line tested gate script covers the label case (R9). |
| Secret scanning | GitHub secret scanning + push protection (free, public repo) | Yes | Cannot run locally, so `secretlint` is added to the verify gate (FR-024). |
| Running `.ts` scripts | Node 24 type stripping | Yes | No `tsx`. |
| Env loading | Node `process.loadEnvFile` | Yes | No `dotenv`. |
| Walkthrough | Claude Code skill + AskUserQuestion | Yes | Matches the spec assumption; runbook is the no-agent fallback. |

### Test layers (for the tasks phase — tests before implementation)

| Layer | Tool | Location | Covers |
|---|---|---|---|
| Unit — check logic | Vitest | `tests/unit/setup-check/checks/*.test.ts` | Each of the 18 items: complete / missing / pending / could-not-check from recorded fixtures in `tests/fixtures/providers/` (FR-001, FR-002, FR-006, edge cases: partial protection, DNS-only-at-Squarespace, delegation pending, live domain switched, indexable review host, PR from Don's account). |
| Unit — report & CLI | Vitest | `tests/unit/setup-check/report.test.ts`, `cli.test.ts` | Summary counts, exit codes 0/1/2, `--item`, `--json` validates against `contracts/check-report.schema.json`, `nextAction` present when not complete. |
| Unit — safety guards | Vitest | `tests/unit/setup-check/providers/read-only.test.ts`, `providers/behaviour.test.ts`, `report.test.ts` | No mutating `gh api` flags, SDK write methods or non-GET/HEAD HTTP (FR-004); timeouts and auth failures map to `could-not-check`; no verbose/debug modes; provider error text redacted; runtime canary secret never appears in output or errors (FR-005, FR-024, FR-030). |
| Unit — DNS helper | Vitest | `tests/unit/setup-check/dns-snapshot.test.ts` | Read-only snapshot resolves baseline + common names and reports unknown answers (FR-037). |
| Schema | Vitest | `tests/unit/setup/schemas.test.ts` | `setup/config.json`, `setup/dns-baseline.json`, `setup/github-ruleset.json` valid; invalid samples rejected with clear errors. |
| Drift | Vitest | `tests/unit/setup/drift.test.ts`, `docs-structure.test.ts`, `docs-dns.test.ts`, `skill-behaviour.test.ts` | Registry ↔ `docs/setup.md` sections one-to-one with labelled parts; secret names in workflows / `wrangler.jsonc` / `.env.example` ↔ manifest; ruleset contexts ↔ workflow job names; CODEOWNERS covers the major-path list; skill confirms only via `pnpm setup:check` and runs no mutating command; DNS rollback content. |
| Unit — gate | Vitest | `tests/unit/ci/major-change-gate.test.ts` | Label/no label, approval on stale commit, approval by non-owner, owner-authored PR. |
| Config | Vitest | `tests/unit/site/headers.test.ts`, `tests/unit/site/config-files.test.ts`, `tests/unit/ci/workflows.test.ts` | `public/_headers` sets `X-Robots-Tag: noindex` on `/*` and never `no-transform`; `wrangler.jsonc` and `.env.example` shape; workflow jobs, triggers, read-only permissions, SHA-pinned actions, no `continue-on-error`; CODEOWNERS paths. |
| E2E + a11y | Playwright + axe | `tests/e2e/placeholder.a11y.spec.ts` | Zero WCAG 2.2 AA violations on `/`; landmark/heading structure, reflow at 320 px and 200% zoom, keyboard focus on the link (FR-031–FR-033). |
| E2E + budget | Playwright | `tests/e2e/placeholder.budget.spec.ts` | 0 scripts, CLS 0, < 30 KB, readable with JS disabled, `noindex` meta, `lang="en"`. |
| Secret scan | secretlint | `pnpm run lint:secrets` | Fails on committed secret-like values (FR-024). |
| Live / preview | manual `[PREVIEW-CHECK]` | quickstart §7–8 | Branch-protection test PRs (SC-006), preview URL, review host, Ghost + email unchanged, keyboard pass on the review address (SC-008). |

### `package.json` scripts (contract for the tasks phase)

```json
{
  "packageManager": "pnpm@11.x",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "lint:secrets": "secretlint \"**/*\"",
    "lint": "eslint .",
    "typecheck": "astro check",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "verify": "pnpm run lint:secrets && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build && pnpm run test:e2e",
    "setup:check": "node scripts/setup-check/cli.ts",
    "setup:dns-snapshot": "node scripts/setup-check/dns-snapshot.ts"
  }
}
```

(`pnpm@11.x` is resolved to the exact installed version when the file is created.)

## Project Structure

### Documentation (this feature)

```text
specs/001-setup-walkthrough/
├── plan.md              # This file
├── research.md          # Phase 0 decisions (R1–R15)
├── data-model.md        # Setup item registry, results, secret manifest, DNS baseline
├── quickstart.md        # Validation scenarios
├── contracts/
│   ├── setup-check-cli.md
│   ├── check-report.schema.json
│   ├── walkthrough-skill.md
│   └── ci-and-gates.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
.nvmrc                         # 24
package.json                   # pnpm, scripts above
pnpm-lock.yaml
astro.config.mjs               # defineConfig({}) — static output
tsconfig.json                  # extends astro/tsconfigs/strict; erasableSyntaxOnly, allowImportingTsExtensions
wrangler.jsonc                 # name dcc-web, assets ./dist, workers_dev + preview_urls
eslint.config.js
vitest.config.ts               # getViteConfig({ test: { environment: 'node', include: ['tests/unit/**'] } })
playwright.config.ts           # webServer: pnpm run preview, baseURL http://localhost:4321
.secretlintrc.json
.secretlintignore
.env.example                   # names only
src/pages/index.astro          # placeholder page
public/_headers                # X-Robots-Tag: noindex
scripts/
├── setup-check/
│   ├── cli.ts                 # arg parsing, prerequisite gating, exit codes
│   ├── types.ts               # shared types (data-model.md)
│   ├── items.ts               # setup item registry (single source of truth)
│   ├── secrets.ts             # secret/variable manifest (names only)
│   ├── schemas.ts             # astro/zod schemas for setup/*.json and the report
│   ├── report.ts              # human + JSON output, redaction
│   ├── dns-snapshot.ts        # read-only public DNS snapshot helper
│   ├── checks/                # one file per item group: local, github, cloudflare, dns, site
│   └── providers/             # github (gh api), cloudflare (SDK), dns, http, env, fs — read-only
└── ci/
    └── major-change-gate.ts   # pure decision function + thin CLI
setup/
├── config.json                # owner, repo, machineAccount, workerName, zone, reviewHost
├── dns-baseline.json          # { originalNameservers, records } — starts empty; Don fills it during walkthrough step 4
└── github-ruleset.json        # main-protection ruleset to import
docs/setup.md                  # runbook, one section per item (anchor = item id)
.claude/skills/setup-walkthrough/SKILL.md
.github/
├── CODEOWNERS
└── workflows/
    ├── ci.yml                 # job: verify
    └── major-change.yml       # job: major-change-approval
tests/
├── fixtures/providers/        # recorded GitHub/Cloudflare/DNS/HTTP responses (no secrets)
├── unit/
│   ├── setup-check/
│   ├── setup/
│   ├── ci/
│   └── site/
└── e2e/
```

**Structure Decision**: single Astro project at the repository root (the site), with repository
tooling under `scripts/`, committed setup expectations under `setup/`, and tests split into
`tests/unit` (Vitest) and `tests/e2e` (Playwright). The later contact API will live in its own
directory (decided by that feature).

### Walkthrough order (safe order, FR-007)

Before this slice's PR merges: 1 local tools → 2 local credentials → 3 Cloudflare zone →
4 DNS parity (baseline matches) → 5 nameservers at Squarespace (pending until delegated) →
6 live domain still Ghost + email → 7 Worker via Workers Builds (a branch preview proves it) →
8 `drc-agents` collaborator → 9 secret scanning + push protection → **merge this PR (Don approves
after viewing the preview)** → 10 Workers Builds production build on `main` → 11 CI workflow green
on `main` → 12 CODEOWNERS recognised → 13 `major-change` label + auto-merge → 14 import ruleset →
15 pipeline secret names → 16 Custom Domain `new.doncoleman.ca` → 17 no-index header → 18 Web
Analytics. Numbers are the registry `order` in [data-model.md](./data-model.md).

## Risks and open points

- **Workers Builds evidence**: the check relies on the Workers Builds GitHub check run (name
  matched by prefix `Workers Builds`) and the Workers script/subdomain API; if Cloudflare changes
  the check-run name, the item reports `could-not-check` rather than a false pass. Validated on
  the first preview.
- **Code-owner review with 0 required approvals**: rulesets allow `require_code_owner_review`
  with `required_approving_review_count: 0`; SC-006's test PRs confirm GitHub enforces it this way.
  If not, set the count to 1 and rely on CODEOWNERS for every major path (non-major PRs from
  `drc-agents` would then need an approval, so the gate would be revisited as its own change).
- **Cloudflare API permission names** for the read-only token may be labelled differently in the
  dashboard; the check maps any 403 to `could-not-check` naming the missing read access.
- **TypeScript 7** is current but unsupported by `@astrojs/check` and `typescript-eslint`;
  pinned to ~6.0 until they support it.
- **Node 24** is required locally (Don is on 22.17); the first walkthrough step covers it.
- **Nameserver switch** is the one step with real risk to the live site and email; it is gated
  on the parity item and on Don's explicit confirmation of every undecided record.

## Complexity Tracking

No constitution violations. Two custom pieces are justified in the Principle IV table (the
~50-line major-change label gate; the setup check itself, which the spec requires and no provider
offers). Tailwind is deferred, not dropped.

| Exception | Why it is needed | Simpler alternative rejected because |
|---|---|---|
| Principle I bootstrap: the tool configuration that tests need to run at all (`package.json`, `.nvmrc`, `tsconfig.json`, ESLint, secretlint, Vitest and Playwright configs, `.gitignore`, `astro.config.mjs`) is created before the first failing test | A test cannot be written, run and seen to fail until the test runner, TypeScript config and package manifest exist | Writing tests first is impossible for the runner's own configuration. The exception is limited to these files; every other file in the slice (including `wrangler.jsonc`, `.env.example`, workflows, CODEOWNERS, runbook and skill) has a failing test first, and these configuration files are exercised by every `pnpm run verify` run afterwards |
| Principle II bootstrap: this slice's own PR merges before the `main` ruleset exists (it adds the files the ruleset requires) | GitHub cannot require checks and code-owner review that do not yet exist on `main` | Don merges by hand only when `verify` on the PR's latest commit is green, after viewing the preview; the exception covers enforcement, never a failing check |
