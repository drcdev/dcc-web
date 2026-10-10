# Research: Setup Walkthrough and Setup Check

**Feature**: `001-setup-walkthrough` | **Date**: 2026-09-28 | **Plan**: [plan.md](./plan.md)

This note resolves every open technical question for the bootstrap slice. Each entry gives the
decision, the rationale, the first-party option considered (Principle IV) and the alternatives
rejected. Astro choices cite the Astro documentation page found through the Astro Docs MCP
(`mcp__astro-docs__search_astro_docs`), which was available for this plan. Cloudflare choices
were checked against the `cloudflare` skill references (Workers static assets, Web Analytics) and
the Astro Cloudflare deploy guide. Package versions were read from the npm registry on
2026-09-28 and are pinned by the committed lockfile, not by this note.

---

## R1. Package manager

- **Decision**: **pnpm** (v11, pinned with the `packageManager` field in `package.json`), with
  `pnpm-lock.yaml` committed. CI installs with `pnpm install --frozen-lockfile`.
- **Rationale**: The constitution requires exactly one package manager with a committed lockfile
  and names none; pnpm is the default the pipeline (`/deliver`) expects, is installed locally
  (11.15.1), is supported by every Astro install/test page, and is auto-detected by Cloudflare
  Workers Builds from `pnpm-lock.yaml`.
- **Alternatives**: npm (works, but slower installs and no strict dependency isolation); Yarn
  (no advantage here).

## R2. Runtime: Node.js version and how TypeScript scripts run

- **Decision**: **Node.js 24 LTS**, recorded in `.nvmrc` (read by `actions/setup-node` and by
  Workers Builds) and in `package.json` `engines.node: ">=24"`. The setup check CLI is TypeScript
  run directly by Node's built-in type stripping (`node scripts/setup-check/cli.ts`), so no
  transpiler runner is added. `tsconfig.json` sets `erasableSyntaxOnly: true` and
  `allowImportingTsExtensions: true` (with `noEmit`) so every script stays strippable. Scripts
  under `scripts/` import each other with explicit `.ts` extensions (required by Node's type
  stripping); files processed by Astro under `src/` keep Astro's extensionless style
  ([Imports reference — TypeScript](https://docs.astro.build/en/guides/imports/#import-statements)).
- **Rationale**: Astro 7 needs Node >= 22.12 ([Install Astro — Prerequisites](https://docs.astro.build/en/install-and-setup/)).
  Node 24 is the active LTS and runs `.ts` files without flags; Node 22.17 (Don's current local
  version) needs `--experimental-strip-types`. Using Node's own feature avoids adding `tsx`.
- **First-party option**: Node's built-in type stripping (used).
- **Alternatives**: `tsx` / `ts-node` (extra dependency, rejected); compiling scripts with `tsc`
  (extra build step, rejected).
- **Note for Don**: the walkthrough's first step asks him to switch to Node 24 (`nvm install 24`).

## R3. Astro project skeleton (placeholder page)

- **Decision**: Manual minimal install per [Install Astro — Manual Setup](https://docs.astro.build/en/install-and-setup/#manual-setup):
  `astro` (7.x), `src/pages/index.astro`, `astro.config.mjs` with the default `output: 'static'`
  ([Configuration Reference — output](https://docs.astro.build/en/reference/configuration-reference/#output)),
  `tsconfig.json` extending `astro/tsconfigs/strict` ([TypeScript — Setup](https://docs.astro.build/en/guides/typescript/#setup)),
  with `include: [".astro/types.d.ts", "**/*"]` and `exclude: ["dist"]` as that page recommends.
  The placeholder is one plain-language page (site name, "This site is being rebuilt", link to the
  current site) with `<html lang="en">`, a `<title>`, a `<main>` landmark, one `<h1>`, a
  `<meta name="robots" content="noindex">`, no client JavaScript and no web fonts.
- **Rationale**: Principle V (static, no JS); the real site, Tailwind theme and content
  collections are out of scope for this slice. Manual setup produces fewer files than the
  `create astro` wizard and no sample content to delete.
- **Tailwind**: not added in this slice (no styling needed for a placeholder; the design-system
  feature ports Don's theme). This is deferral, not a deviation.
- **No adapter**: the site is fully static, so `@astrojs/cloudflare` is not installed. The Astro
  Cloudflare deploy guide says the adapter is only for on-demand rendering and shows the static
  `wrangler.jsonc` form ([Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)).

## R4. Hosting and deploy: Cloudflare Workers static assets + Workers Builds

- **Decision**: A Worker named **`dcc-web`** with static assets only, configured in a committed
  `wrangler.jsonc`:
  `{ "name": "dcc-web", "compatibility_date": "<deploy date>", "assets": { "directory": "./dist" }, "workers_dev": true, "preview_urls": true }`.
  `wrangler` is a devDependency (locked version). Workers Builds is connected in the dashboard
  (Workers & Pages → Create → Import a repository → `drcdev/dcc-web`) with:
  - production branch `main`; build command `pnpm run build`; deploy command `pnpm exec wrangler deploy`;
  - non-production branch builds **on**, deploy command `pnpm exec wrangler versions upload`
    (each branch gets a version preview URL, posted back to the PR by Workers Builds).
- **Rationale**: Fixed by clarification (FR-017). The Astro deploy guide documents exactly this
  flow ([Deploy your Astro Site to Cloudflare — How to deploy with CI/CD](https://docs.astro.build/en/guides/deploy/cloudflare/));
  Cloudflare recommends Workers over Pages for new projects, and the Astro Cloudflare adapter no
  longer supports Pages. No Cloudflare deploy token is stored in GitHub.
- **First-party option**: Workers Builds (used) instead of a GitHub Actions deploy job with
  `wrangler-action` and an API token.
- **Production gating**: Workers Builds deploys whatever lands on `main`; `main` only accepts
  merges that passed `verify` (R9), which satisfies Principle II without a second pipeline.

## R5. Review address and no-index

- **Decision**: `new.doncoleman.ca` is attached as a **Worker Custom Domain** (Workers → dcc-web →
  Settings → Domains & Routes → Add Custom Domain). Cloudflare creates the DNS record and
  certificate. No-index is sent as an HTTP header from `public/_headers`:
  ```
  /*
    X-Robots-Tag: noindex
  ```
  plus the `<meta name="robots" content="noindex">` in the placeholder page. `robots.txt` is **not**
  used to block crawling, because a crawl block would stop crawlers from seeing the noindex rule.
- **Rationale**: `_headers` is Cloudflare's first-party static-assets header feature and is copied
  from `public/` into the build ([@astrojs/cloudflare — Headers](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-platform)).
  It also covers `*.workers.dev` and preview URLs. At launch the header and meta are removed (out
  of scope; already noted in the spec).
- **Alternatives**: a Cloudflare Transform Rule adding the header for one hostname (works, but
  it is zone configuration outside the repository and invisible to tests); `robots.txt`
  Disallow (does not stop indexing of linked URLs).

## R6. DNS move from Squarespace to Cloudflare

- **Decision**:
  1. Add zone `doncoleman.ca` to Cloudflare (Free plan). Cloudflare's quick scan imports the
     records it can find.
  2. Don lists every record from Squarespace's DNS screen into a committed, reviewed baseline
     file `setup/dns-baseline.json` (type, name, content, priority, TTL, `proxied: false`, and an
     optional `decision: "keep" | "drop"` plus `reason` for Squarespace-managed records). DNS
     records are public data, not secrets.
  3. A read-only helper `pnpm setup:dns-snapshot` resolves the names in the baseline (and a fixed
     list of common names: apex, `www`, `mail`, `_dmarc`, common DKIM selectors) against the
     **current public DNS** and writes a local, gitignored `setup/dns-snapshot.local.json` to help
     Don spot anything he missed. It changes nothing at any provider.
  4. The check compares the baseline with the Cloudflare zone's records via the API; every
     `keep` record must match exactly, and any record present only at Squarespace is reported
     with "decide keep or drop" (spec edge case).
  5. Only then does Don change the nameservers at Squarespace to the two Cloudflare assigns.
  6. All copied Ghost and mail records stay **DNS only (grey cloud)** so the live site and email
     behave exactly as before.
- **Rationale**: Squarespace has no zone-export API and DNS cannot be enumerated remotely, so a
  human-reviewed baseline is the only reliable record of "the originals". Committing it makes the
  comparison repeatable and auditable (Story 3).
- **Pending state**: Cloudflare zone `status: "pending"` or public NS not yet matching the assigned
  nameservers → item reported **pending** with "delegation can take up to 24 hours".
- **Cloudflare Registrar**: not used (does not sell `.ca`); Squarespace stays registrar.

## R7. Visitor statistics

- **Decision**: Cloudflare Web Analytics, **automatic setup** for the proxied hostname
  `new.doncoleman.ca` (Analytics & Logs → Web Analytics → Add a site → select hostname →
  "Enable"). Cloudflare injects its cookie-free beacon at the edge; nothing is added to the
  repository.
- **Confirmation**: the check lists the account's Web Analytics sites through the Cloudflare API
  (RUM site info) and requires a site for `new.doncoleman.ca` with automatic install on. As a
  second signal it fetches `https://new.doncoleman.ca/` and looks for the
  `static.cloudflareinsights.com/beacon.min.js` reference in the served HTML.
- **Rationale**: Fixed by clarification (FR-022) and allowed by Principle X ("privacy-focused
  analytics"). Automatic injection fails if responses carry `Cache-Control: no-transform`; the
  placeholder does not set that header, and a unit test asserts `_headers` never does.
- **Note**: the injected beacon is the only script on the page. Principle V's "no client
  JavaScript" concerns the site's own code; the constitution explicitly allows privacy-focused
  analytics. The Playwright "no JavaScript" test runs against the local build, where no beacon is
  injected.

## R8. Setup check implementation

- **Decision**: A TypeScript CLI at `scripts/setup-check/`, run as `pnpm setup:check`
  (`node scripts/setup-check/cli.ts`). Structure:
  - `items.ts`: the single, typed **setup item registry** (id, title, purpose, where, how
    confirmed, walkthrough step, docs anchor, principle, secret references). Walkthrough, runbook
    and check all derive from it.
  - `checks/*.ts`: one pure async function per item, `(ctx: ProviderContext) => Promise<CheckResult>`.
  - `providers/github.ts`: runs **`gh api`** through `node:child_process.execFile` so it uses
    `gh`'s own sign-in (no token handling in our code).
  - `providers/cloudflare.ts`: the official **`cloudflare`** TypeScript SDK (first-party), created
    with a **read-only** API token from the gitignored `.env` (loaded with Node's built-in
    `process.loadEnvFile`), used only for list/get calls.
  - `providers/dns.ts`: `node:dns/promises` `Resolver` pinned to public resolvers (1.1.1.1, 8.8.8.8).
  - `providers/http.ts`: global `fetch` for HTTPS, header and Ghost-marker probes.
  - `report.ts`: human output and `--json` output (contract in `contracts/`), with a final
    redaction pass that replaces any value of a known secret environment variable with
    `[redacted]` as defence in depth.
- **Exit codes**: `0` only when every item is `complete`; `1` otherwise; `2` for usage errors.
- **Read-only guarantee (FR-004)**: GitHub provider allows only `GET` (`gh api` without `-X`/
  `--method`, `-f`, `-F` or `--input`); a unit test fails if any provider module constructs a
  mutating call. The Cloudflare token is created with read permissions only, and the Cloudflare
  provider wraps only `list`/`get` methods.
- **Why not `wrangler`** for reads: Wrangler has no commands for zones, DNS records, Workers
  custom-domain lists or Web Analytics sites, and it would need Don's OAuth login with write
  scopes. The Cloudflare API via the official SDK is the first-party read path.
- **Schemas**: the report, `setup/config.json` and `setup/dns-baseline.json` are validated with
  Zod imported from **`astro/zod`** (Astro's re-export, so no separate Zod dependency;
  [Zod API Reference](https://docs.astro.build/en/reference/modules/astro-zod/)).
- **Performance (SC-002)**: checks run concurrently with a 10-second per-call timeout; a
  timed-out call yields `could-not-check` with the reason.
- **CI**: the live check is **not** run in CI (it needs Don's credentials; scheduled drift
  detection is listed as follow-up in the spec). Its logic is fully covered by unit tests in CI.

## R9. GitHub branch protection, CI check names, and review on every PR

- **Decision, protection**: a **repository ruleset** named `main-protection`, stored as
  `setup/github-ruleset.json`. Rules on `refs/heads/main`: `deletion`, `non_fast_forward`,
  `pull_request` (`required_approving_review_count: 1`, `require_code_owner_review: true`,
  `dismiss_stale_reviews_on_push: true`, `required_review_thread_resolution: false`),
  `required_status_checks` (`strict_required_status_checks_policy: true`, context **`verify`**,
  pinned to GitHub Actions with `integration_id` 15368), and **no bypass actors**.
  `require_last_push_approval` stays off, because stale-review dismissal already forces a fresh
  approval after every push (#86, 2026-10-04). The live ruleset is updated in the dashboard, or
  by a `PUT` built from the live ruleset, until #86 adds the live-only parameters to the file;
  a `PUT` of the file as it stands would drop them. The `github-main-protection` check names
  each missing or weaker rule (spec edge case).
  - Note (2026-10-10, #149): the file now holds every writable field of the live ruleset (merge
    commits only, extra approval for unattributed changes, `~DEFAULT_BRANCH`), so a `PUT` of the
    file is a no-op and the warning above is superseded.
- **Decision, review (#85, 2026-10-04)**: one approving review on every PR. `.github/CODEOWNERS`
  is the single line `* @drcdev`, so with `require_code_owner_review` the approval that counts is
  always Don's, even on a PR opened as `drcdev` by mistake. The `major-change` label, the
  `major-change-approval` workflow and gate script, the `github-major-label` setup item and the
  pre-PR major-change / merge-mode pause in the pipelines are retired. "Major change" is now a
  classification in the plan and the PR body (constitution 2.3.0, Principle III), not a gate.
- **Decision, deploy only after CI (#86, revised 2026-10-04)**: strict required status checks
  are the accepted mitigation. With `verify` required, `strict_required_status_checks_policy: true`
  and merge commits only, the tree that lands on `main` is the tree `verify` already passed, so
  Principle II's "only after CI passes" is met before the merge. Workers Builds keeps deploying
  on push to `main`: no Deploy Hook, no trigger change and no Cloudflare credential in GitHub.
  Residual risks:
  - ruleset drift (strict or stale-review dismissal turned off silently): a scheduled read-only
    drift check, deferred to #86;
  - a PR weakening `ci.yml` so `verify` passes trivially: the required approval on every PR;
  - a flaky or time-dependent test passing on the PR and failing on `main`: accepted, because
    rollback is one command.
  - **Note, 2026-10-10 (#147):** strict mode is now off (`strict_required_status_checks_policy: false`),
    because a merge queue needs an organization-owned repository. A PR that is behind `main` can
    merge without catching up, so the tree on `main` may not be the tree `verify` passed on the
    PR. Don accepted this as a recorded exception to Principle II (D1, option A). The CI run on
    every push to `main` is the backstop, and the constitution is not changed. The text above is
    kept as written.
- **Deferred to #86**: the scheduled ruleset drift check, `persist-credentials: false` on
  checkouts, and the repository Actions settings (SHA pinning, allowed actions, fork-PR
  approval).
- **Rationale**: native required approval and CODEOWNERS need no custom code, where the earlier
  CODEOWNERS-paths plus label gate needed a workflow and a script (Principle IV).
- **Alternatives**: keep the label gate (rejected: custom code for a native feature);
  CODEOWNERS paths only (rejected: misses majors that are not path-defined); drop CODEOWNERS
  (rejected by Don: the catch-all makes every approval his).
- **Machine account**: `drc-agents` (name confirmed by Don during the walkthrough and stored in
  `setup/config.json` as a non-secret) is a repository collaborator with **write** permission.
  Its credential lives only in the agent's `gh` keyring (`gh auth login` as drc-agents, switched
  with `gh auth switch`). The check confirms access via
  `GET /repos/drcdev/dcc-web/collaborators/drc-agents/permission`. GitHub does not count an
  author's approval on their own PR, so agents open PRs from this account. #87 (stop the agent
  switching back to `drcdev`) is won't-fix: agent sessions keep both `gh` accounts. The
  repository allows auto-merge (`allow_auto_merge: true`), and the pipelines arm it on every PR;
  the merge still waits for Don's approval and a green `verify`.
- **Bootstrap exception (historical)**: this slice's own PR was opened before `drc-agents` and
  the ruleset existed, so Don merged it by hand after viewing the preview.

## R10. CI workflow

- **Decision**: `.github/workflows/ci.yml`, workflow name `CI`, one job with id and name
  **`verify`** (the required check context). Triggers: `pull_request` and `push` to `main`.
  `permissions: contents: read`. Steps: `actions/checkout`, `pnpm/action-setup` (reads
  `packageManager`), `actions/setup-node` with `node-version-file: .nvmrc` and `cache: pnpm`,
  `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps chromium`,
  `pnpm run verify`. Third-party actions are pinned to full commit SHAs. `concurrency` cancels
  superseded runs on the same ref.
- **Rationale**: FR-015/FR-016 — CI runs exactly the local gate, so they cannot drift. GitHub
  Actions is free for public repositories.
- **Secrets**: the workflow uses only the automatic `GITHUB_TOKEN`. No repository secrets or
  variables are needed in this slice. The secret manifest therefore expects **zero** GitHub
  Actions secrets, and the check reports any unexpected or missing name as drift.

## R11. Local verify gate and tooling

- **Decision**: `pnpm run verify` runs, in order and stopping at the first failure:
  1. `lint:secrets` — **secretlint** with `@secretlint/secretlint-rule-preset-recommend` over the
     tracked tree (`.secretlintignore` excludes `node_modules`, `dist`, `.astro`, the lockfile and the gitignored
     local credential files `.env` and `setup/*.local.json`, so a correctly stored local token does
     not fail the gate; a unit test asserts every gitignored credential path is also secretlint-ignored
     and that nothing tracked is ignored beyond the build/lock list).
  2. `lint` — **ESLint** flat config with `typescript-eslint` and `eslint-plugin-astro`.
  3. `typecheck` — **`astro check`** (checks `.astro` and `.ts`; exits 1 on errors, intended for
     CI per [CLI Commands — astro check](https://docs.astro.build/en/reference/cli-reference/#astro-check)
     and [TypeScript — Type checking](https://docs.astro.build/en/guides/typescript/#type-checking)).
  4. `test` — **Vitest** unit/schema tests, configured through Astro's `getViteConfig()` with the
     `node` environment ([Testing — Vitest](https://docs.astro.build/en/guides/testing/#vitest)).
  5. `build` — `astro build`.
  6. `test:e2e` — **Playwright** against `astro preview` via the `webServer` option
     ([Testing — Playwright](https://docs.astro.build/en/guides/testing/#playwright)), running the
     accessibility and page-budget tests on the placeholder.
- **Versions**: TypeScript is pinned to **~6.0** because `@astrojs/check` accepts `^5 || ^6` and
  `typescript-eslint` accepts `<6.1`; TypeScript 7 is not yet supported by either.
- **Secret scanning, first-party layer**: GitHub **secret scanning and push protection** are free
  on public repositories and are turned on in the walkthrough; the check confirms both via
  `GET /repos/drcdev/dcc-web` (`security_and_analysis`). secretlint is still required because
  FR-024 puts a secret check inside the local verify gate; GitHub's scanning cannot run locally.
- **Alternatives**: gitleaks (Go binary, not installable by pnpm, so the local gate would depend
  on a separate install); Biome (experimental `.astro` support); Prettier (formatting is not a
  gate requirement in this slice).
- **Linting note**: ESLint has no first-party Astro equivalent; the Astro docs point to the
  community `eslint-plugin-astro` ([Editor setup — ESLint](https://docs.astro.build/en/editor-setup/#other-tools)).

## R12. Accessibility and performance checks for the placeholder

- **Decision**:
  - **Accessibility**: `@axe-core/playwright` in `tests/e2e/placeholder.a11y.spec.ts`, tags
    `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`, zero violations allowed.
  - **Page budget** (Principle X, scoped to what exists): `tests/e2e/placeholder.budget.spec.ts`
    asserts zero `<script>` elements and zero JS requests, no layout shift (CLS 0 via
    `PerformanceObserver`), total transfer under 30 KB, and the page readable with JavaScript
    disabled (Principle V).
  - Full Lighthouse / Core Web Vitals budgets on mobile are deferred to the feature that builds
    real page templates, as the spec's out-of-scope list says.
- **Rationale**: the placeholder has no images, fonts or scripts, so a Lighthouse run would add a
  heavy dependency to measure nothing new. The budget test keeps the gate honest from day one and
  is extended, not replaced, later.
- **First-party option**: Astro's dev toolbar audit app is dev-server only and not scriptable in
  CI, so it does not meet the requirement.

## R13. Walkthrough delivery

- **Decision**: two forms that share the setup item registry:
  1. **Claude Code skill** `.claude/skills/setup-walkthrough/SKILL.md` (invoked as
     `/setup-walkthrough`). It runs `pnpm setup:check --json`, shows the ordered step list,
     skips `complete` steps with a note, and for the first incomplete step prints what / where /
     how-confirmed from the registry, then pauses with **AskUserQuestion** ("Done — check it",
     "Skip for now", "Stop here"). On "Done" it runs `pnpm setup:check --json --item <id>` and
     either moves on or explains what it found and stays. For secret steps it tells Don to paste
     the value into the provider's screen or into `.env` in his own editor, and it never asks for
     the value. It never runs mutating commands itself; commands that change provider settings
     (for example importing the ruleset) are shown for Don to run.
  2. **Runbook** `docs/setup.md`: one section per setup item, in walkthrough order, with purpose,
     where, how confirmed, principle served, and secret/variable names (never values).
- **Resumability (FR-011)**: state is not stored; each run recomputes from the live check, so it
  always resumes at the first incomplete step.
- **Drift tests (Story 3, FR-010, spec edge cases)**: unit tests assert that (a) every registry
  item has exactly one `docs/setup.md` section with a matching anchor and vice versa; (b) every
  secret or variable name referenced in `.github/workflows/*.yml`, `wrangler.jsonc` and
  `.env.example` is in the secret manifest, and every manifest entry is referenced somewhere
  or marked `local-only`; (c) the skill file references the check command rather than restating
  confirmation logic.

## R14. Local credentials

- **Decision**: `.env.example` (committed, names only) lists `CLOUDFLARE_ACCOUNT_ID` (not
  secret), `CLOUDFLARE_ZONE_ID` (not secret) and `CLOUDFLARE_API_TOKEN` (secret, read-only).
  Don copies it to `.env` (already gitignored by `.env`/`.env.*`) and fills it in his editor.
  GitHub access uses `gh auth login` (Don's account) — no token in files.
- **Cloudflare token scope**: a custom API token with **read** permissions only, restricted to
  Don's account and the `doncoleman.ca` zone: Zone → Zone: Read, Zone → DNS: Read,
  Account → Workers Scripts: Read, Account → Account Analytics / Web Analytics: Read (exact
  permission labels as shown in the dashboard at creation time). The check calls the token-verify
  endpoint first and maps any `403` to `could-not-check: token lacks <permission> read access`.

## R15. Cost

| Item | Plan | Monthly cost |
|---|---|---|
| GitHub repository, Actions (public repo), rulesets, secret scanning, push protection | Free | $0 |
| `drc-agents` machine account | Free (one per person under GitHub terms) | $0 |
| Cloudflare zone + DNS | Free plan | $0 |
| Workers static assets, Workers Builds, preview URLs, Custom Domain + certificate | Workers Free (static asset requests are free; builds within the free build-minute allowance) | $0 |
| Cloudflare Web Analytics | Free | $0 |
| Squarespace domain registration | Existing, unchanged | no new cost |
| **Total added by this slice** | | **$0 / month** |
