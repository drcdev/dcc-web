# Bug Assessment: D1 databases lack the project prefix

- **Slug**: d1-database-names
- **Created**: 2026-09-30
- **Source**: pasted text (from Don, the maintainer; no URL)
- **Verdict**: valid
- **Severity**: low

## Report (verbatim or summarized)

> "I think we need to rename the two D1 databases (contact and contact-preview) to dcc-web-contact
> and dcc-web-contact-preview to ensure they are traceable back to the project."

Follow-up fact from Don (relayed by the orchestrator): there is no live data in either D1
database. The new databases can be created fresh and the old ones deleted without any data export
or import.

## Symptom

The contact form's D1 databases are named `contact` (production) and `contact-preview` (preview),
both in the repository and in the live Cloudflare account. Nothing ties them to the `dcc-web`
project by name, unlike the Workers (`dcc-web`, `dcc-web-preview`) and the Turnstile widget
(`dcc-web contact`). Expected: `dcc-web-contact` and `dcc-web-contact-preview`.

This is a naming and traceability change request, not a runtime failure. No test fails today.

## Reproduction

1. Open `wrangler.jsonc`: `d1_databases[0].database_name` is `"contact"` (line 23) and
   `env.preview.d1_databases[0].database_name` is `"contact-preview"` (line 37).
2. Run `pnpm exec wrangler d1 list --json` (Don's login): the live databases are listed as
   `contact` and `contact-preview`, with no project prefix.
3. Evidence from exploration: the config-files, contact-d1-databases and docs-structure unit tests
   pass (84 pass, 1 unrelated timeout flake), confirming the current names are asserted by tests
   rather than broken.

## Suspected Code Paths

Runtime and deploy configuration:

- `wrangler.jsonc:23` and `:37` — the only two `database_name` values. The `DB` binding and the
  `database_id` UUIDs (`5b29b0c1-…` production, `3e160f9c-…` preview) sit beside them. The
  "Placeholder until setup item 19 … T074" comments at `:24` and `:38` are stale.
- `scripts/deploy/production.ts:21` — `["d1", "migrations", "apply", "contact", "--remote"]`.
- `scripts/deploy/preview.ts:32` — `["d1", "migrations", "apply", "contact-preview", "--remote", "--env", "preview"]`.
- `playwright.config.ts:17` — `wrangler d1 migrations apply contact --local ...` for the e2e server.
- `worker/vitest.config.ts:9-14,40-41` — reads `database_name` from the resolved wrangler config
  (no literal; follows `wrangler.jsonc` automatically).

Setup check (item 19 and friends):

- `scripts/setup-check/checks/contact-shared.ts:6-7` — `PRODUCTION_DB_NAME` / `PREVIEW_DB_NAME`.
  These are only fallbacks: `readContactConfig` takes the names from `wrangler.jsonc`, and
  `checks/contact-d1-databases.ts:31` finds the live database by that name and compares its UUID.
- `scripts/setup-check/items.ts:351` — item 19 "where" text with both `d1 create` commands;
  `:431` — item 24 text naming `contact-preview`.
- `scripts/setup-check/checks/contact-d1-databases.ts:52` — generic `<name>` text, no change needed.

Docs and skill:

- `docs/setup.md:508-509, 522-523, 528, 533, 676, 685, 710` — database names, the `d1 create`
  commands, the `d1 delete contact` example, items 24 and 25 text.
- `.claude/skills/setup-walkthrough/SKILL.md:146-147, 154, 159` — the same commands and names.

Tests asserting the names:

- `tests/unit/site/config-files.test.ts:80-94` (database_name), `:211` (playwright command).
- `tests/unit/site/deploy-preview.test.ts:12,20,27` and `deploy-production.test.ts:10,18`.
  `deploy-preview.test.ts:27` asserts the flattened steps do not contain `"contact"` and
  `deploy-production.test.ts:18` asserts they do not contain `"contact-preview"`; both must be
  rewritten to the new names so the separation guarantee (Principle VII) is kept.
- `tests/unit/setup/docs-structure.test.ts:149-150` and `tests/unit/setup/items.test.ts:48-49`
  (exact `wrangler d1 create contact… --location wnam` strings).
- `tests/unit/setup-check/checks/contact-helpers.ts:19,27` (wrangler.jsonc fixture),
  `contact-d1-databases.test.ts:10-11,26,40`, `contact-preview-deploy.test.ts:8-9,59`,
  `contact-production-deploy.test.ts:12-13`, `providers/contact-readers.test.ts:29-47`
  (fixtures; the reader is name-agnostic, but aligning the fixture is cheap).
- `worker/test/environments.test.ts:20-21` — expected names from the resolved config.

Not related and must not change: the `DB` binding, item ids `contact-*`, Turnstile
`action: "contact"`, the `dcc-web contact` widget name, the `/contact/` page, log event `contact`.

## Root Cause Hypothesis

The names were chosen in feature 007 without the project prefix and then written into the
configuration, deploy scripts, setup-check text, docs, skill and tests; Don created the live
databases under those names (T069/T074). Confidence: high.

Verified constraints that shape the fix:

- **D1 has no rename.** Wrangler 4.144.0 offers `d1 create | delete | execute | export | info |
  insights | list | migrations | time-travel` and nothing that renames. The Cloudflare API's
  `DatabaseUpdateParams` / `DatabaseEditParams` (cloudflare SDK 7.2.0) accept only
  `read_replication`, so PUT/PATCH cannot change the name. The dashboard was not checked
  (no access); assume no rename. New databases therefore mean **new UUIDs**.
- **Wrangler resolves `d1 migrations apply <name>` through the config**: `getDatabaseInfoFromConfig`
  matches `database_name` (or binding) in `wrangler.jsonc` and uses that entry's `database_id`.
  The deploy scripts work with whatever name `wrangler.jsonc` carries, as long as the name in the
  script and the name in the config agree. The live database's name does not matter to deploys or
  to the running Worker (the binding is by `database_id`).
- **The setup check is the only thing that matches by live name**: item 19 (and items 24/25, which
  look up applied migrations) find the database in the account by the `wrangler.jsonc` name and
  compare its UUID. A repo rename that keeps the old UUIDs keeps deploys and the Worker working but
  turns items 19, 24 and 25 red until the new databases exist and their UUIDs are recorded.
- **No data to move**: Don confirms neither database holds live data, so the new databases are
  created empty, the deploy scripts apply the migrations, and the old ones are deleted. No export
  or import.

## Proposed Remediation

**Preferred**: rename everything on the repository side, record the new databases' UUIDs on the
same branch once Don has created them, and delete the old databases after both environments deploy
against the new UUIDs. Doing it before item 25 (T079, still open) means production migrations are
applied only once, to the new database.

Repository change (the `/speckit-bug-fix` phase, tests first):

1. Update the tests listed above to the new names (`dcc-web-contact`, `dcc-web-contact-preview`),
   including the mutual-exclusion assertions in the two deploy tests, and see them fail.
2. `wrangler.jsonc`: `database_name` → `dcc-web-contact` / `dcc-web-contact-preview`. Keep the
   current `database_id` values until Don has created the new databases (config and deploys stay
   working; see Risks). Drop the stale placeholder comments.
3. `scripts/deploy/production.ts`, `scripts/deploy/preview.ts`, `playwright.config.ts`: the new
   names, in the same commit as step 2.
4. `scripts/setup-check/checks/contact-shared.ts` constants and `scripts/setup-check/items.ts`
   item 19/24 text: the new names.
5. `docs/setup.md` items 19, 24 and 25 and `.claude/skills/setup-walkthrough/SKILL.md`: the new
   names in prose and in the shown-only `d1 create` / `d1 delete` commands.
6. Leave `specs/007-contact-form/**` untouched as history (no test reads them).
   `worker/test/env.d.ts` comments are generic and need no change.

Manual steps for Don (a `[PREVIEW-CHECK]` task in the fix; Don runs them with the dashboard login,
as docs/setup.md already requires):

```sh
pnpm exec wrangler d1 create dcc-web-contact --location wnam --env-file /dev/null
pnpm exec wrangler d1 create dcc-web-contact-preview --location wnam --env-file /dev/null
```

Choose **no** if Wrangler offers to add the binding. Then the agent runs
`pnpm exec wrangler d1 list --json` (the one non-check command the setup skill allows), writes the
two new UUIDs into `wrangler.jsonc` as the `database_id` beside the new names, runs the
config-files test, commits and pushes. The branch's preview build (`deploy:preview`) applies the
migrations to `dcc-web-contact-preview`; Don sends a test message on the preview address, and
`setup:check` items 19 and 24 report complete again.

After the PR merges, item 25 (T079) runs `deploy:production`, which applies the migrations to
`dcc-web-contact` and deploys the production Worker bound to its UUID. Once `setup:check` shows
items 19 to 25 complete, Don deletes the old databases:

```sh
pnpm exec wrangler d1 delete contact --env-file /dev/null
pnpm exec wrangler d1 delete contact-preview --env-file /dev/null
```

**Safe order**: repo rename (names only, old UUIDs kept) → Don creates the two new databases in
`wnam` → agent records the new UUIDs on the same branch → preview check → merge → item 25 →
Don deletes the old databases. The old preview database can go as soon as the branch's preview
deploy is bound to the new UUID; the old production database only after the production Worker is.

**Alternatives**:
- *Two PRs* (names now with old UUIDs, UUIDs later): deploys keep working in between, but items
  19/24/25 are red on `main` and the committed names point at databases that do not exist. Only
  worth it if Don cannot create the databases before this PR merges.
- *Keep the old databases and change only the docs*: does not give traceable names; rejected.

**Files likely to change**:
- `wrangler.jsonc`
- `scripts/deploy/production.ts`, `scripts/deploy/preview.ts`
- `playwright.config.ts`
- `scripts/setup-check/checks/contact-shared.ts`, `scripts/setup-check/items.ts`
- `docs/setup.md`, `.claude/skills/setup-walkthrough/SKILL.md`
- `tests/unit/site/config-files.test.ts`, `tests/unit/site/deploy-preview.test.ts`,
  `tests/unit/site/deploy-production.test.ts`
- `tests/unit/setup/docs-structure.test.ts`, `tests/unit/setup/items.test.ts`
- `tests/unit/setup-check/checks/contact-helpers.ts`, `contact-d1-databases.test.ts`,
  `contact-preview-deploy.test.ts`, `contact-production-deploy.test.ts`
  (optionally `tests/unit/setup-check/providers/contact-readers.test.ts`)
- `worker/test/environments.test.ts`

**Tests to add or update**:
- config-files: `database_name` equals `dcc-web-contact` (top level) and `dcc-web-contact-preview`
  (`env.preview`), still exactly two, both bound as `DB`, UUIDs real and different; the playwright
  command applies migrations to `dcc-web-contact`.
- deploy tests: production applies to `dcc-web-contact` and never names `dcc-web-contact-preview`;
  preview applies to `dcc-web-contact-preview` with `--env preview` and never names
  `dcc-web-contact` as a step argument.
- A guard that every `d1 migrations apply <name>` in the deploy scripts and playwright config names
  a `database_name` present in `wrangler.jsonc` for the right environment, so a future rename
  cannot leave a script pointing at a missing config entry.
- docs-structure / items: item 19 text and docs contain
  `wrangler d1 create dcc-web-contact --location wnam` and
  `wrangler d1 create dcc-web-contact-preview --location wnam`.
- setup-check fixtures and the worker environments test use the new names.

## Risks & Considerations

- **Major change under Constitution Principle III**: it touches how contact data is stored
  (new D1 databases) and changes deployment and infrastructure configuration (`wrangler.jsonc`,
  deploy scripts). Auto-merge stays off; Don approves after the preview check.
- **Name/script mismatch breaks deploys**: `d1 migrations apply <name>` fails with "could not find
  database" if a script's name is not in `wrangler.jsonc`. Config and scripts change in one commit.
- **Stale UUIDs**: until the new UUIDs are recorded, the renamed config still binds the old
  databases. That is safe (the Worker and deploys work) but setup-check items 19/24/25 report
  `dcc-web-contact…: does not exist`. Do not merge in that state unless the two-PR alternative is
  chosen deliberately.
- **Deleting too early** breaks the live binding of whichever Worker still points at the old UUID.
  Delete each old database only after its environment deploys against the new UUID.
- **Location**: the new databases must use `--location wnam`; location cannot change after creation
  and item 19 checks for `WNAM`.
- **Workers Builds token**: its D1: Edit permission is account-wide, so it covers the new databases
  with no change (item 24).

## Open Questions

- [NEEDS CLARIFICATION: Can Don create `dcc-web-contact` and `dcc-web-contact-preview` before this
  PR merges, so the new UUIDs land in the same PR (preferred), or should the PR merge with the old
  UUIDs and a follow-up swap them (two-PR alternative)?]
