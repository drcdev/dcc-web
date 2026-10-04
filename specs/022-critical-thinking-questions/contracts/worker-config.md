# Contract: Worker configuration, D1 rename and deploy scripts

Changes to `wrangler.jsonc` and the files that name the databases (FR-013, FR-021, FR-025).
Row ids (W01…) are for test titles.

## `wrangler.jsonc` (target shape, changed keys only)

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

- W01: production binds `DB` to `dcc-web` only and preview to `dcc-web-preview` only; neither
  names the other; both `database_id` values are real UUIDs and differ, and differ from the old
  ids `9b51b0c4-…` and `53cef28f-…`. This is the named check that keeps the interim branch state
  (new names, old ids) from merging: `config-files.test.ts` fails in `verify` until the new ids
  land.
- W03a: the preview environment does not override `assets` (so `ASSETS` is inherited), and
  separation of the environments is visible from `wrangler.jsonc` alone (W01, W02, W03a).
- W02: both environments have `ai.binding === "AI"`; no `remote` key (wrangler throws on
  `remote: false` for AI, and `remote: true` would make local dev and tests call Cloudflare).
- W03: `assets.binding === "ASSETS"` and `run_worker_first` is still exactly `["/api/*"]`.
- W04: every `d1 migrations apply <name>` in `scripts/deploy/*.ts` and `playwright.config.ts`
  names a `database_name` of the right environment (the existing guard in
  `config-files.test.ts`, now with the new names).
- W05: `worker/worker-configuration.d.ts` is regenerated (`pnpm run types:worker`) so `Env`
  has `AI: Ai` and `ASSETS: Fetcher`; `pnpm run typecheck` (`wrangler types --check`) fails if not.

## Files that change with the rename (research R13)

| File | Change |
|---|---|
| `wrangler.jsonc` | names and ids above |
| `scripts/deploy/production.ts` | `d1 migrations apply dcc-web --remote` |
| `scripts/deploy/preview.ts` | `d1 migrations apply dcc-web-preview --remote --env preview` |
| `playwright.config.ts` | local `d1 migrations apply dcc-web --local --persist-to .cache/e2e-state` |
| `scripts/setup-check/checks/contact-shared.ts` | `PRODUCTION_DB_NAME = "dcc-web"`, `PREVIEW_DB_NAME = "dcc-web-preview"` |
| `scripts/setup-check/items.ts` | items 19 and 24 text: new names; item 19 title "Site databases" (id `contact-d1-databases` kept, so links and tests that use the id do not move). Item 19 fails naming each missing new database ("`dcc-web` not found in the account"); an old `dcc-web-contact*` database still present is reported as a separate note ("old database `dcc-web-contact` still present: delete it after the production deploy"), not a failure, so the two cases read differently |
| `docs/setup.md` | items 19, 24, 25: new names in prose and in the `d1 create` / `d1 delete` commands; item 19 says the databases hold contact messages and the questions cache and bucket |
| `.claude/skills/setup-walkthrough/SKILL.md` | same commands and names |
| `worker/test/environments.test.ts` | expected names; plus each environment has its own bucket row |
| unit tests listed in research R13 | new names and ids |

`.github/workflows/*.yml` name no database: no change. `specs/007-*` and `.specify/bugs/*` are
history: no change. Stragglers: after the rename, a repository search for `dcc-web-contact`
(for example `git grep -n dcc-web-contact`) MUST return matches only under `specs/` and
`.specify/bugs/`, plus the setup-check note text for the old databases; the review step runs it.
Tests that named the old databases are updated to the new names; no assertion is removed or
loosened (Principle II).

## Deploy order (safe sequence; commands in quickstart.md)

1. Branch: everything above except the two ids (old ids stay, so the branch's preview deploy
   keeps working while names change).
2. Don creates `dcc-web` and `dcc-web-preview` in `wnam` (live Cloudflare access).
3. The agent reads the ids (`wrangler d1 list --json`), writes them into `wrangler.jsonc`, runs
   the config tests, commits and pushes.
4. The branch's preview build runs `deploy:preview`, which applies `0001` and `0002` to
   `dcc-web-preview` and deploys the preview Worker bound to it with the `AI` binding.
   `[PREVIEW-CHECK]`: the panel works on a preview post.
5. Merge. The production build runs `deploy:production`, which applies both migrations to
   `dcc-web` and deploys.
6. After `setup:check` items 19, 24 and 25 pass against the new databases and
   `wrangler d1 migrations list <name> --remote` shows no pending migration for each new
   database, Don deletes `dcc-web-contact-preview` and then `dcc-web-contact` (live). Before
   deleting `dcc-web-contact`, Don runs
   `wrangler d1 execute dcc-web-contact --remote --command "SELECT count(*) FROM messages"`; if
   it is not 0, stop and export the rows first (the spec assumes the contact feature never went
   live). Deleting the old databases is a tracked task in `tasks.md`, not left implied.

Deleting an old database before its environment's Worker is bound to the new id breaks that
Worker's `DB` binding; step 6 must wait for step 5.

**Rollback**: until step 6, both old databases still exist. If the preview deploy (step 4) or
the production deploy (step 5) fails against the new ids, revert the commit that swapped the
ids and let CI redeploy, so the environment binds its old database again (never
`wrangler versions deploy` or `rollback` by hand on this Worker), fix the cause, and repeat
from step 3. The new databases can be left in
place or deleted; they hold nothing that is not rebuilt by the migrations.
