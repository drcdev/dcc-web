# Contract: Worker configuration, D1 rename and deploy scripts

Changes to `wrangler.jsonc` and the files that name the databases (FR-013, FR-021, FR-025).
Row ids (W01…) are for test titles.

## `wrangler.jsonc` (target shape after Don's swap commit, changed keys only)

During implementation only `ai` and `assets.binding` are added; the `d1_databases` entries keep
today's names (`dcc-web-contact`, `dcc-web-contact-preview`) and ids until Don's swap commit.

```jsonc
{
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",                 // new: the Worker reads question-source.json
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*"]       // unchanged
  },
  "ai": { "binding": "AI" },             // new
  "d1_databases": [
    { "binding": "DB", "database_name": "dcc-web", "database_id": "<new production id>", "migrations_dir": "migrations" }
  ],
  "env": {
    "preview": {
      "ai": { "binding": "AI" },         // new: `ai` is not inherited by environments
      "d1_databases": [
        { "binding": "DB", "database_name": "dcc-web-preview", "database_id": "<new preview id>", "migrations_dir": "migrations" }
      ]
    }
  }
}
```

`secrets.required`, crons, observability (`invocation_logs: false`) and `run_worker_first` are
unchanged. No `vars` are added (config lives in `worker/src/questions/config.ts`). The contact
retention Cron Trigger and the contact API keep using the `DB` binding, now pointing at the
renamed database; their behaviour does not change. `assets` is an inheritable key, so the
preview environment gets `ASSETS` from the top level and does not redeclare `assets`. Binding
names used by the code are stated once here: `DB`, `AI`, `ASSETS`. Everything is committed in
`wrangler.jsonc` and applied by the deploy scripts in CI; no binding or database is configured
in the dashboard.

- W01: each environment has exactly one `d1_databases` entry with `binding: "DB"`,
  `migrations_dir: "migrations"` and a non-empty `database_name`; the preview name is the
  production name plus `-preview` and neither environment names the other's database; both
  `database_id` values are real UUIDs (no placeholder) and differ. W01 checks **shape and
  internal consistency only**, never the live ids or the new names, so it is green with the
  current databases (`dcc-web-contact`, `dcc-web-contact-preview`) during implementation and
  after Don's swap commit. The live ids are checked against the account by setup-check item 19.
- W03a: the preview environment does not override `assets` (so `ASSETS` is inherited), and
  separation of the environments is visible from `wrangler.jsonc` alone (W01, W02, W03a).
- W02: both environments have `ai.binding === "AI"`; no `remote` key (wrangler throws on
  `remote: false` for AI, and `remote: true` would make local dev and tests call Cloudflare).
- W03: `assets.binding === "ASSETS"` and `run_worker_first` is still exactly `["/api/*"]`.
- W04: every `d1 migrations apply <target>` in `scripts/deploy/*.ts` and `playwright.config.ts`
  targets the binding `DB` (Wrangler resolves a binding name to the environment's database),
  the preview script with `--env preview` and the others without. No script names a database,
  so the swap commit touches `wrangler.jsonc` only. The E2E web server follows the same rule through the generated `wrangler.e2e.json` (see the `playwright.config.ts` row).
- W05: `worker/worker-configuration.d.ts` is regenerated (`pnpm run types:worker`) so `Env`
  has `AI: Ai` and `ASSETS: Fetcher`; `pnpm run typecheck` (`wrangler types --check`) fails if not.

## Files that change (research R13)

During implementation (agent), with the current databases still bound:

| File | Change |
|---|---|
| `wrangler.jsonc` | `ai` in both environments and `assets.binding`; `database_name` and `database_id` unchanged |
| `scripts/deploy/production.ts` | `d1 migrations apply DB --remote` |
| `scripts/deploy/preview.ts` | `d1 migrations apply DB --remote --env preview` |
| `playwright.config.ts` | the E2E web server runs `node scripts/e2e-wrangler-config.ts`, which writes the gitignored `wrangler.e2e.json` (`wrangler.jsonc` minus `ai`), then `d1 migrations apply DB --local --persist-to .cache/e2e-state --config wrangler.e2e.json` (binding `DB`), then `wrangler dev --config wrangler.e2e.json`, because the Workers AI remote proxy demands a token in non-interactive shells |
| `scripts/setup-check/checks/contact-shared.ts` | checks use the names read from `wrangler.jsonc`; fallback constants `dcc-web` / `dcc-web-preview`; `RETIRED_DB_NAMES` (`dcc-web-contact`, `dcc-web-contact-preview`) for the old-database note |
| `scripts/setup-check/items.ts` | items 19 and 24 text; item 19 title "Site databases" (id `contact-d1-databases` kept, so links and tests that use the id do not move). Item 19 fails naming each configured database missing from the account ("`dcc-web` not found in the account"); a retired database still present while `wrangler.jsonc` names a different one is reported as a separate note ("old database `dcc-web-contact` still present: delete it after the production deploy"), not a failure |
| `docs/setup.md` | items 19, 24, 25: new names in prose and in the `d1 create` / `d1 delete` commands Don runs; item 19 says the databases hold contact messages and the questions cache and bucket |
| `.claude/skills/setup-walkthrough/SKILL.md` | same commands and names |
| `worker/test/environments.test.ts` | name-independent assertion (names read from the resolved config differ; preview is production plus `-preview`); each environment has its own bucket row |
| unit tests listed in research R13 | shape assertions, binding-name deploy steps, config-read names |

Don's swap commit (Phase 7): `wrangler.jsonc` only, `database_name` and `database_id` in both
environments.

`.github/workflows/*.yml` name no database and apply no migration (Workers Builds runs the
deploy scripts): no change. `specs/007-*` and `.specify/bugs/*` are history: no change.
Stragglers: a repository search for `dcc-web-contact` (`git grep -n dcc-web-contact`) MUST
return matches only under `specs/` and `.specify/bugs/`, in the setup-check retired-name list
and note text, in `docs/setup.md` items 19 and 25 (the retired names Don deletes), in the setup-check unit-test fixtures that use the current names, and (until the swap commit only) the two `database_name` values in
`wrangler.jsonc`; the review step and the swap step run it. Tests that pinned the old names or
ids are rewritten as shape and consistency assertions with the reason stated in `tasks.md`
(T008): the pins would turn red on the planned swap by design; no structural guarantee is
dropped (Principle II).

## Deploy order (safe sequence; commands in quickstart.md)

1. Branch (agent): everything in the first table above. `wrangler.jsonc` keeps the current
   database names and ids, so the branch's preview deploys apply `0002` (additive) to the
   current preview database and every test and the full gate stay green. The PR is opened.
2. Don creates `dcc-web` and `dcc-web-preview` in `wnam` (live Cloudflare access).
3. Don reads the ids (`wrangler d1 list --json --env-file /dev/null`) and makes the swap commit:
   `database_name` and `database_id` for both environments in `wrangler.jsonc`, one commit on
   the branch, nothing else. The config tests stay green; Don pushes.
4. The branch's preview build runs `deploy:preview` (`d1 migrations apply DB --remote --env
   preview`), which applies `0001` and `0002` to `dcc-web-preview` and deploys the preview
   Worker bound to it with the `AI` binding. `[PREVIEW-CHECK]`: the panel works on a preview
   post.
5. Merge. The production build runs `deploy:production` (`d1 migrations apply DB --remote`),
   which applies both migrations to `dcc-web` and deploys.
6. After `setup:check` items 19, 24 and 25 pass against the new databases and
   `wrangler d1 migrations list <name> --remote` shows no pending migration for each new
   database, and no open branch still builds a preview against the old preview id, Don deletes
   `dcc-web-contact-preview` and then `dcc-web-contact` (live). Before deleting each, Don runs
   `wrangler d1 execute <old name> --remote --command "SELECT count(*) FROM messages"`; if it is
   not 0, stop and export the rows first (the spec assumes the contact feature never went live).
   Deleting the old databases is a tracked task in `tasks.md`, not left implied.

Deleting an old database before every Worker using it is bound to the new id breaks that
Worker's `DB` binding; step 6 must wait for step 5, and for open branches to merge `main`.

**Rollback**: until step 6, both old databases still exist. If the preview deploy (step 4) or
the production deploy (step 5) fails against the new ids, revert the commit that swapped the
ids and let CI redeploy, so the environment binds its old database again (never
`wrangler versions deploy` or `rollback` by hand on this Worker), fix the cause, and repeat
from step 3. The new databases can be left in
place or deleted; they hold nothing that is not rebuilt by the migrations.
