# Contract: setup items 19–25 and `setup:check` extensions

The contact steps extend the single registry in `scripts/setup-check/items.ts`, the runbook
`docs/setup.md` (new part "Contact form", sections 19–25, anchors equal to the item IDs) and
the `/setup-walkthrough` skill (research R13). The walkthrough order below is the order Don
follows. Each step is written with **What it is for / Where to do it / How it will be confirmed
/ Constitution principle / Secrets**, like items 1–18.

Global rules (unchanged, restated because they now involve Worker secrets):

- Don never pastes a secret into the chat or into a repository file. He types or pipes secrets
  straight into `wrangler secret put`, or pastes them into a Cloudflare dashboard field.
- The skill and the agent never run a command that prints a secret value.
  `setup:check` reads **names only**. Every new reader method drops value fields before
  returning, and `tests/unit/setup-check/providers/read-only.test.ts` is extended to prove it.
- Every new check is read-only (`GET`, plus one read-only `SELECT` through the D1 query
  endpoint).

Recovery and rotation rules (FR-027b, FR-027c, FR-024a, FR-028a):

- Every step can be repeated safely. Each check names the missing part per database, per
  Worker or per trigger, so a half-done step shows exactly what is left.
- If Don does not confirm the region at item 19, the walkthrough stops before any
  `wrangler d1 create`. A new region needs a reviewed change to the spec, plan and privacy
  policy first.
- A database created with the wrong name or location (still empty) is removed with
  `pnpm exec wrangler d1 delete <name>` (shown for Don to run) and created again.
- Replacing a secret (a leaked read token, salt or Turnstile secret): Don runs the same
  `wrangler secret put` command with a new value (plus `--env preview` for preview). It takes
  effect on the next request with no redeploy. The runbook's item 21 section documents this.
- A check that cannot reach Cloudflare, or whose token lacks a permission, reports
  `could-not-check` with the cause and the permission to add. It is never shown as complete.

## Changed existing items

| Item | Change |
|---|---|
| 2 `local-credentials` | The token's permission list gains **Account → D1: Read**, **Account → Workers Builds Configuration: Read** and **Account → Turnstile Sites: Read**. Same text change in `.env.example` and in `secrets.ts` (`permissions`, `usedBy`). |
| 10 `workers-builds` | "Where" text: the non-production branch deploy command now lives on `dcc-web-preview` (item 22), not `dcc-web`. The check logic is unchanged: it matches check runs by the "Workers Builds" prefix, which covers both Workers. |
| Intro, skill step 6, tests | "18 items" becomes the registry length (25). |

## New items

### 19. `contact-d1-databases` — Contact databases (before merge)

- **Purpose**: store contact messages in Cloudflare D1, with production and preview kept apart.
- **Where**: first the restatement (FR-027a, inside the skill's `AskUserQuestion` text):
  "Both databases will be created in Western North America (`wnam`). D1 cannot keep data only in
  Canada, and the location **cannot be changed** after the databases are created." Then, in a
  terminal in the repository, Don runs:
  `pnpm exec wrangler login` (if needed),
  `pnpm exec wrangler d1 create contact --location wnam`,
  `pnpm exec wrangler d1 create contact-preview --location wnam`.
  He chooses **no** if Wrangler offers to add the binding to the config. The agent then runs
  `pnpm exec wrangler d1 list --json`, copies the two IDs (not secret) into `wrangler.jsonc`,
  commits and pushes.
- **Confirmed by**: both databases exist by name. Their UUIDs equal the `database_id` values in
  `wrangler.jsonc` for `contact` (top level) and `contact-preview` (`env.preview`). Each reports
  region `WNAM`. If the region field is absent, the check reports **missing** with "region could
  not be confirmed", never complete (research R2).
- **Principles**: VII, VIII, IX. **Requirements**: FR-017, FR-027a, FR-028. **Secrets**: none.
  **Depends on**: `local-credentials`, `cloudflare-worker`.

### 20. `contact-turnstile-widget` — Spam-protection widget (before merge)

- **Where**: Cloudflare dashboard → Turnstile → Add widget. Name `dcc-web contact`; hostnames
  `doncoleman.ca` (covers `new.doncoleman.ca`) and `drc-dev.workers.dev` (covers preview
  addresses); mode **Managed**; no pre-clearance. Keep the page open for steps 21 and 23. If the
  dashboard refuses `drc-dev.workers.dev`, follow the fallback in research R6: use the
  always-pass test keys for **preview only**.
- **Confirmed by**: a widget named `dcc-web contact` exists in managed mode, its domains include
  `doncoleman.ca`, and either its domains include `drc-dev.workers.dev` or the preview fallback
  is in use. The fallback is detected in item 23, where the preview site-key variable exists.
  The reader keeps only `name`, `domains` and `mode`; it drops `sitekey` and `secret`.
- **Principles**: VIII, X. **Requirements**: FR-012. **Secrets**: none read.
  **Depends on**: `local-credentials`.

### 21. `contact-worker-secrets` — Contact secrets (before merge)

- **Where**: in a terminal in the repository. Production:
  `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY` (paste the widget's secret at the prompt),
  `pnpm exec wrangler secret put CONTACT_READ_TOKEN` (generate a new random value in your
  password manager first, then paste it at the prompt),
  `openssl rand -hex 32 | pnpm exec wrangler secret put IP_HASH_SALT` (the value is never shown).
  Preview: the same three commands with `--env preview`. Use a **different** read token and salt.
  The first preview command offers to create Worker `dcc-web-preview`; answer yes. Give each
  read token only to the scheduled assistant for that environment.
- **Confirmed by**: the secret names `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN` and
  `IP_HASH_SALT` exist on both `dcc-web` and `dcc-web-preview`
  (`GET …/workers/scripts/{name}/secrets`, names only). Missing names are listed per Worker.
- **Principles**: VII, VIII. **Requirements**: FR-023, FR-024, FR-028.
  **Secrets**: `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN`, `IP_HASH_SALT`.
  **Depends on**: `cloudflare-worker`, `contact-turnstile-widget`.

### 22. `contact-preview-builds` — Preview Worker builds (before merge)

- **Where**: Cloudflare dashboard → Workers & Pages → `dcc-web-preview` → Settings → Build →
  Connect → `drcdev/dcc-web`. Build command `pnpm run build`. Production branch `main` with
  deploy command `pnpm run deploy:preview`. Non-production branch builds **on**, with deploy
  command `pnpm run deploy:preview`. Then Settings → Domains & Routes: turn on the `workers.dev`
  address and preview URLs. Then `dcc-web` → Settings → Build → Branch control: turn **off**
  non-production branch builds. The first build of `main` on `dcc-web-preview` fails until this
  feature merges; that failure is expected.
- **Confirmed by**: Worker `dcc-web-preview` exists. Its Workers Builds triggers use
  `pnpm run deploy:preview` for both production and non-production branches. `dcc-web` has no
  non-production trigger. (`GET …/builds/workers/{tag}/triggers`; only the fields
  `trigger_name`, `branch_includes`, `branch_excludes`, `deploy_command` and `build_command` are
  kept.)
- **Principles**: II, VII, VIII. **Requirements**: FR-017, FR-024. **Secrets**: none.
  **Depends on**: `contact-worker-secrets`.

### 23. `contact-turnstile-site-key` — Site key build variable (before merge)

- **Where**: for each of `dcc-web` and `dcc-web-preview`: Settings → Build → Variables and
  secrets → add **build** variable `PUBLIC_TURNSTILE_SITE_KEY` (plain text) with the widget's
  site key. It is public, but it is still set here rather than committed, so preview and
  production can differ under the fallback.
- **Confirmed by**: the key name `PUBLIC_TURNSTILE_SITE_KEY` exists on every trigger of both
  Workers (`GET …/builds/triggers/{uuid}/environment_variables`, keys only).
- **Principles**: VIII, X. **Requirements**: FR-012, FR-028.
  **Secrets**: `PUBLIC_TURNSTILE_SITE_KEY` (variable). **Depends on**: `contact-preview-builds`.

### 24. `contact-preview-deploy` — Preview migrations and clean-up schedule (before merge)

- **Where**: Cloudflare dashboard → My Profile → API Tokens → the token used by Workers Builds
  (named in each Worker's Settings → Build → API token) → Edit → add **Account → D1: Edit**.
  Then push the branch (the agent does this) or choose Retry build on `dcc-web-preview`.
- **Confirmed by**: `contact-preview`'s `d1_migrations` names equal the files in `migrations/`
  (read-only `SELECT name FROM d1_migrations ORDER BY id`), **and** `dcc-web-preview` has the
  cron `17 3 * * *` (`GET …/workers/scripts/dcc-web-preview/schedules`). This is how the Workers
  Builds token's D1 permission is confirmed indirectly (research R13). `pending` while a
  `dcc-web-preview` build is running.
- **Principles**: II, VII, VIII. **Requirements**: FR-018, FR-028. **Secrets**: none.
  **Depends on**: `contact-d1-databases`, `contact-worker-secrets`, `contact-preview-builds`,
  `contact-turnstile-site-key`.

### 25. `contact-production-deploy` — Production migrations and clean-up schedule (after merge)

- **Where**: right after this feature's pull request merges: `dcc-web` → Settings → Build →
  production deploy command → `pnpm run deploy:production` → then Retry the latest `main`
  build. Until this is done, production's contact form answers "service unavailable" (no table
  yet). Production traffic is still only the review address.
- **Confirmed by**: `dcc-web`'s production trigger uses `pnpm run deploy:production`;
  `contact`'s `d1_migrations` names equal the files in `migrations/`; and `dcc-web` has the cron
  `17 3 * * *`.
- **Principles**: II, VII, VIII. **Requirements**: FR-018, FR-028. **Secrets**: none.
  **Depends on**: `contact-preview-deploy`. **Phase**: after-merge.

## New `CloudflareReader` methods (`scripts/setup-check/types.ts`, `providers/cloudflare.ts`)

| Method | API | Permission hint on 403 | Returns (only) |
|---|---|---|---|
| `listD1Databases(accountId, name?)` | `GET /accounts/{a}/d1/database` | D1: Read | `{ uuid, name, runningInRegion? }[]` |
| `listD1AppliedMigrations(accountId, uuid)` | `POST /accounts/{a}/d1/database/{uuid}/query` with the fixed `SELECT` | D1: Read | `string[]` |
| `listWorkerSecretNames(accountId, script)` | `GET /accounts/{a}/workers/scripts/{s}/secrets` | Workers Scripts: Read | `string[]` |
| `listWorkerCrons(accountId, script)` | `GET /accounts/{a}/workers/scripts/{s}/schedules` | Workers Scripts: Read | `string[]` |
| `listBuildTriggers(accountId, script)` | `GET …/workers/scripts/{s}` for the tag (existing read), then `GET /accounts/{a}/builds/workers/{tag}/triggers` | Workers Builds Configuration: Read | `{ uuid, name, branchIncludes, branchExcludes, buildCommand, deployCommand }[]` |
| `listBuildVariableNames(accountId, triggerUuid)` | `GET /accounts/{a}/builds/triggers/{uuid}/environment_variables` | Workers Builds Configuration: Read | `string[]` (keys only) |
| `listTurnstileWidgets(accountId)` | `GET /accounts/{a}/challenges/widgets` | Turnstile Sites: Read | `{ name, domains, mode }[]` |

`listD1AppliedMigrations` sends only the one constant `SELECT` string. The method has no
parameter that could carry SQL, and a unit test asserts the request body is exactly that
constant. Each check gets unit tests in `tests/unit/setup-check/checks/<id>.test.ts` with fake
readers, covering complete, missing, pending and could-not-check. Fixture responses include
`secret`/`value` fields to prove they are dropped.

## `/setup-walkthrough` skill changes

- Step 6's count becomes the registry length.
- New "Allowed commands" block for commands **shown for Don to run himself** at items 19 and 21
  (as above). New rule: after Don confirms item 19, the agent may run
  `pnpm exec wrangler d1 list --json` (no secrets in its output) to read the IDs, edit
  `wrangler.jsonc`, commit and push. That is the only non-check command the agent runs during
  the walkthrough.
- The FR-027a restatement is inside the item 19 `AskUserQuestion` question text.
- Before item 25, the existing rule for `phase: after-merge` applies (give the PR link and wait
  for the merge).
- `tests/unit/setup/skill-behaviour.test.ts` gains assertions for the restatement text and the
  new shown-only commands.
