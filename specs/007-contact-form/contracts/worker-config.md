# Contract: Worker configuration, deploy scripts and retention cron

## `wrangler.jsonc` (target shape)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "dcc-web",
  "main": "worker/src/index.ts",
  "compatibility_date": "2026-09-28",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*"]
  },
  "workers_dev": true,
  "preview_urls": true,
  "observability": { "enabled": true, "head_sampling_rate": 1 },
  "triggers": { "crons": ["17 3 * * *"] },
  "secrets": { "required": ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"] },
  "d1_databases": [
    { "binding": "DB", "database_name": "contact", "database_id": "<id from Don's create>", "migrations_dir": "migrations" }
  ],
  "env": {
    "preview": {
      "triggers": { "crons": ["17 3 * * *"] },
      "secrets": { "required": ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"] },
      "d1_databases": [
        { "binding": "DB", "database_name": "contact-preview", "database_id": "<id from Don's create>", "migrations_dir": "migrations" }
      ]
    }
  }
}
```

Rules enforced by `tests/unit/site/config-files.test.ts` (extended):

- `run_worker_first` is exactly `["/api/*"]`. Nothing else runs Worker code (Principle VIII).
- Production binds `contact` only and preview binds `contact-preview` only. Both bindings are
  named `DB`. Neither environment names the other's database anywhere.
- Both `database_id` values are present, are 36-character UUIDs and differ. A placeholder fails
  the test once setup item 19 is complete. Until then, the test for the real IDs is written
  first and seen to fail (Principle I), and it passes when the agent commits the IDs during the
  walkthrough.
- `secrets.required` lists the same three names in both environments. That is how Wrangler
  refuses to deploy a Worker whose secrets are missing: in the installed source,
  `addRequiredSecretsInheritBindings` throws "The following required secrets have not been set".
- Both environments carry one cron with the same schedule.
- No `vars` holds a secret-looking name, and no route or custom-domain change is made here
  (`new.doncoleman.ca` stays a dashboard Custom Domain, setup item 16).

`$schema` points at the installed Wrangler schema, so editors and `wrangler` validate the file.

## Generated types

- `pnpm run types:worker` → `wrangler types worker/worker-configuration.d.ts`. The output is
  committed.
- `verify` runs `wrangler types worker/worker-configuration.d.ts --check`. Any drift between
  `wrangler.jsonc` and the committed types fails the gate.

## Deploy scripts

| Script | Runs in | Steps |
|---|---|---|
| `pnpm run deploy:production` → `scripts/deploy/production.ts` | `dcc-web` Workers Builds, production branch `main` | refuse unless `WORKERS_CI_BRANCH === "main"` and `WRANGLER_CI_OVERRIDE_NAME` is unset or `dcc-web`; `wrangler d1 migrations apply contact --remote`; `wrangler deploy` |
| `pnpm run deploy:preview` → `scripts/deploy/preview.ts` (rewritten) | `dcc-web-preview` Workers Builds, every branch | refuse unless `WRANGLER_CI_OVERRIDE_NAME` is unset or `dcc-web-preview`; `wrangler d1 migrations apply contact-preview --remote --env preview`; `wrangler deploy --env preview`; if the branch is not `main`: `wrangler versions upload --env preview --preview-alias <previewAlias(branch)>` |

Both scripts stop at the first failing step with a plain-language message. They never print an
environment value, and they pass `stdio: "inherit"` only to Wrangler itself. Unit tests
(`tests/unit/site/deploy-preview.test.ts`, new `deploy-production.test.ts`) test the pure
"which commands for this environment" functions without spawning anything.

### Workers Builds settings (dashboard; set by Don, confirmed by `setup:check`)

| Worker | Build command | Production branch / deploy command | Non-production branches | Build variables |
|---|---|---|---|---|
| `dcc-web` | `pnpm run build` (unchanged) | `main` / `pnpm run deploy:production` | **disabled** | `PUBLIC_TURNSTILE_SITE_KEY` |
| `dcc-web-preview` | `pnpm run build` | `main` / `pnpm run deploy:preview` | enabled / `pnpm run deploy:preview` | `PUBLIC_TURNSTILE_SITE_KEY` |

## Site origin changes (`src/lib/site-origin.ts`, `setup/config.json`)

- `setup/config.json` gains `"previewWorkerName": "dcc-web-preview"`.
- `resolveSiteOrigin`: when `WORKERS_CI === "1"` and the branch is not `main`, the origin is
  `https://<alias>-<previewWorkerName>.<workersSubdomain>.workers.dev`. On `main` it is still
  `https://<reviewHost>`, for both Workers. The preview Worker's `main` build therefore declares
  the review host as canonical. That is harmless: it is served only at
  `dcc-web-preview.drc-dev.workers.dev` with `noindex`.
- `previewAlias` truncates to `63 - ("-" + previewWorkerName).length` characters (47).
- `specs/002-site-foundation/contracts/site-origin.md` is **not** edited (it belongs to the
  finished feature). The change is recorded here, and `tests/unit/site/site-origin.test.ts` is
  updated test-first.

## Retention cron (`scheduled` handler)

- Schedule: `17 3 * * *` (UTC), both environments.
- `cutoff = scheduledTime` minus 12 calendar months (UTC; 29 Feb → 28 Feb or 1 Mar per
  `Date.setUTCMonth` semantics, pinned by a unit test).
- Loop: `DELETE FROM messages WHERE id IN (SELECT id FROM messages WHERE received_at < ?1 LIMIT 500)`
  until `meta.changes < 500`, with at most 40 iterations per run (inside the 50-query Free limit).
- Deletes whatever the status (FR-018).
- Log: one line, `{"event":"retention","deleted":<n>}`.
- Test (`worker/test/retention.test.ts`): seed messages at 13, 12 (± 1 minute) and 11 months
  old, some `new` and some `read`; call the Worker's default export's `scheduled(controller, env, ctx)` with
  `createScheduledController({ scheduledTime, cron: "17 3 * * *" })` and
  `createExecutionContext()` / `waitOnExecutionContext()` from `cloudflare:test`;
  assert only the rows older than the cutoff are gone (User Story 7, SC-007). Also a batch test
  with 1,200 expired rows.
