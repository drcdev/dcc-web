# Quickstart: Critical Thinking Questions on Writing Posts

How to set up, run and validate the feature. Contracts:
[questions-api.md](./contracts/questions-api.md), [questions-panel.md](./contracts/questions-panel.md),
[worker-config.md](./contracts/worker-config.md). Data: [data-model.md](./data-model.md).

## Prerequisites

- Node from `.nvmrc`: run `node -v`; if it differs, `source ~/.nvm/nvm.sh && nvm use` in the same
  shell command as any `pnpm`/`wrangler` call (CLAUDE.md "Local toolchain").
- The repository `.env` token takes precedence over `wrangler login`; Wrangler calls that use
  the dashboard login pass `--env-file /dev/null` when that gets in the way.
- **Never** run `wrangler versions secret put` or `wrangler versions deploy` on this Worker (it
  once wiped every secret).

## 1. Cloudflare steps (live access; all remote database work is Don's)

Until step 4, `wrangler.jsonc` keeps the current databases (`dcc-web-contact`,
`dcc-web-contact-preview`) and their ids, so the branch's previews, deploys and tests stay green
throughout implementation. The new migration `0002` only adds tables, so it applies to whichever
database `DB` is bound to. Deploy scripts and the Playwright command apply migrations by the
binding name `DB`, and the setup check reads the names from `wrangler.jsonc`, so the swap in step
4 changes `wrangler.jsonc` only. Every test is green before and after it.

| # | Who | Command / action | Live? |
|---|---|---|---|
| 1 | Don | `pnpm exec wrangler login` (if not signed in) | LIVE |
| 2 | Don | `pnpm exec wrangler d1 create dcc-web --location wnam --env-file /dev/null` (answer **no** if Wrangler offers to add the binding) | LIVE |
| 3 | Don | `pnpm exec wrangler d1 create dcc-web-preview --location wnam --env-file /dev/null` (answer **no**) | LIVE |
| 4 | Don | `pnpm exec wrangler d1 list --json --env-file /dev/null`; in **one commit on the feature branch**, set `database_name` and `database_id` in `wrangler.jsonc` for both environments (`dcc-web` top level, `dcc-web-preview` under `env.preview`); `pnpm exec vitest run --project unit tests/unit/site/config-files.test.ts` stays green and `git grep -n dcc-web-contact` matches only under `specs/`, `.specify/bugs/` and the setup-check retired-name list and note; push | LIVE (read) + commit |
| 5 | CI | The branch's preview build runs `pnpm run deploy:preview`: `d1 migrations apply DB --remote --env preview` applies `0001` and `0002` to `dcc-web-preview`, then it deploys the preview Worker with `DB`, `AI` and `ASSETS`. The PR's `verify` check is green on the swap commit | automatic |
| 6 | Don | `pnpm setup:check --item contact-d1-databases` and `--item contact-preview-deploy` report complete; `pnpm exec wrangler d1 migrations list dcc-web-preview --remote --env preview --env-file /dev/null` shows none pending | LIVE (read) |
| 7 | CI | After merge, `pnpm run deploy:production` runs `d1 migrations apply DB --remote` (both migrations to `dcc-web`) and deploys | automatic |
| 8 | Don | `pnpm setup:check --item contact-production-deploy` reports complete; `pnpm exec wrangler d1 migrations list dcc-web --remote --env-file /dev/null` shows none pending | LIVE (read) |
| 9a | Don | Confirm no open branch still builds a preview against the old preview id (open PRs have merged `main`), then `pnpm exec wrangler d1 execute dcc-web-contact-preview --remote --env-file /dev/null --command "SELECT count(*) FROM messages"` prints 0 | LIVE (read) |
| 9 | Don | `pnpm exec wrangler d1 delete dcc-web-contact-preview --env-file /dev/null` (only after steps 6, 8 and 9a) | LIVE |
| 10a | Don | `pnpm exec wrangler d1 execute dcc-web-contact --remote --env-file /dev/null --command "SELECT count(*) FROM messages"` must print 0; if not, stop and export the rows before step 10 | LIVE (read) |
| 10 | Don | `pnpm exec wrangler d1 delete dcc-web-contact --env-file /dev/null` (only after step 8 and step 10a printed 0) | LIVE |

If step 5 or step 7 fails against the new ids, do not delete anything: revert the swap commit
(on the branch, or by a PR on `main` after the merge) so CI redeploys against the old databases,
fix the cause, and repeat from step 4 (rollback in `contracts/worker-config.md`). Never use
`wrangler versions deploy`, `rollback` or `versions secret put` on this Worker.

No Workers AI setup is needed: the `ai` binding uses the account's Workers AI with no key or
dashboard step. If the preview deploy (step 5) fails with an authorisation error that names
Workers AI, the Workers Builds API token needs the Workers AI permission added in the dashboard
(Don, LIVE); record that in `docs/setup.md` item 24 if it happens.

## 2. Local validation

```sh
pnpm run verify:quick          # lint, typecheck (incl. wrangler types --check), unit, worker, build
pnpm run test:worker           # questions API against local D1 with fake AI and ASSETS
pnpm run test:build            # question-source.json per post, drafts, sitemap exclusion
```

Full gate before the PR (ask Don first; run in the background under `perl -e 'alarm N; exec @ARGV'`
with `ASTRO_PREVIEW_BACKGROUND=1`): `pnpm run verify`.

Expected:

- Worker tests: rows Q01–Q12 and guarantees Q20–Q29 in `contracts/questions-api.md` pass in the
  `production` project; `environments.test.ts` passes in both projects with whatever names `wrangler.jsonc` binds
  (before and after the swap).
- Nothing is red by design: `verify:quick` and the full gate exit zero.
- `dist/writing/<slug>/question-source.json` exists for every visible post and not for drafts
  in a production build; `dist/sitemap-*.xml` lists none of them.

## 3. Journeys to check by hand (local `wrangler dev` or the preview deployment)

Local: `pnpm run build && pnpm exec wrangler dev --port 4321 --env-file /dev/null`. Local dev
calls the real Workers AI (the binding is remote-only), so it uses the account allowance; the
local bucket is in the local D1.

1. Open any post. The "Think before you read" panel shows a sentence and "Get questions"; the
   Network panel shows no `/api/questions` request (FR-002).
2. Press "Get questions": the button is marked unavailable (`aria-disabled`), "Getting questions..." (three ASCII dots) is announced, then 2–4
   numbered questions, the AI note and "New questions" appear (US1).
3. Reload and press again: the same questions return at once (`source: "cached"` in the
   response) and the bucket row is unchanged (`wrangler d1 execute DB --local --command
   "SELECT * FROM usage_bucket"`; the binding name works before and after the swap).
4. Press "New questions": a different set appears (`source: "fresh"`); the bucket drops by one.
5. Set `BUCKET_CAPACITY = 1` in `worker/src/questions/config.ts` locally, reset the row
   (`UPDATE usage_bucket SET tokens = 0, updated_at = <now ms>`), press "New questions": the panel
   says questions are unavailable for now and when to try again; a post with a cached set still
   shows it (US3). Revert the config.
6. At 390 px the panel is a block between the title card and the body; at 1280 px it sits to the
   right of the body and stays in view while scrolling, never covering text (US2).
7. Turn JavaScript off: no panel, the post reads normally.
8. From another origin (for example `curl -X POST -H "Origin: https://example.org" …`) the API
   answers 403.

On the preview deployment (`br-<branch>-dcc-web-preview.drc-dev.workers.dev`), steps 1, 2, 4 and
6 are the `[PREVIEW-CHECK]` for Don: question quality from the chosen model, panel placement and
both themes. Pass criteria:

- **Question quality** (spec FR-004): on every published post, the cached set and one "new
  questions" set each have 2–4 questions that refer to something specific in that post, none
  summarises, answers or quotes it, and none would fit any post unchanged. If more than one post
  fails, switch to the fallback model (research R1) and recheck.
- **Placement**: at 390 px a block between title card and body; at 1280 px a sidebar that stays
  beside the body while scrolling and never covers text, header, footer or a focused link.
- **Themes**: panel text and buttons readable in light and dark.
- **Live database steps**: steps 4 to 6 of section 1 pass.
- **Speed** (SC-001): a first-generation press shows questions within about 5 seconds.

## 4. Visual baselines

The post template changes, so the `post-template` element shot of the fixture post (and any
other shot that includes the post article) changes on both platforms. Refresh both sets
(CLAUDE.md "Visual baselines"): `pnpm run test:visual:update` on macOS and
`pnpm run test:visual:update:linux` (Docker Desktop) or the `visual-baselines` label fallback,
copying only `*-linux.png` from the artifact. Any diff outside the post article is a regression,
not a baseline to refresh.
