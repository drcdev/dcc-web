# Quickstart: Critical Thinking Questions on Writing Posts

How to set up, run and validate the feature. Contracts:
[questions-api.md](./contracts/questions-api.md), [questions-panel.md](./contracts/questions-panel.md),
[worker-config.md](./contracts/worker-config.md). Data: [data-model.md](./data-model.md).

## Prerequisites

- Node from `.nvmrc`: run `node -v`; if it differs, `source ~/.nvm/nvm.sh && nvm use` in the same
  shell command as any `pnpm`/`wrangler` call (CLAUDE.md "Local toolchain").
- Wrangler calls that use the dashboard login pass `--env-file /dev/null`, so the repository
  `.env` token does not replace the OAuth login.
- **Never** run `wrangler versions secret put` or `wrangler versions deploy` on this Worker (it
  once wiped every secret).

## 1. Cloudflare steps (live access; Don runs the ones marked LIVE)

| # | Who | Command / action | Live? |
|---|---|---|---|
| 1 | Don | `pnpm exec wrangler login` (if not signed in) | LIVE |
| 2 | Don | `pnpm exec wrangler d1 create dcc-web --location wnam --env-file /dev/null` (answer **no** if Wrangler offers to add the binding) | LIVE |
| 3 | Don | `pnpm exec wrangler d1 create dcc-web-preview --location wnam --env-file /dev/null` (answer **no**) | LIVE |
| 4 | Agent | `pnpm exec wrangler d1 list --json --env-file /dev/null`, copy the two UUIDs into `wrangler.jsonc` (`dcc-web` top level, `dcc-web-preview` under `env.preview`), run `pnpm exec vitest run --project unit tests/unit/site/config-files.test.ts`, commit, push | reads LIVE |
| 5 | CI | The branch's preview build runs `pnpm run deploy:preview`: applies `0001` and `0002` to `dcc-web-preview`, deploys the preview Worker with `DB`, `AI` and `ASSETS` | automatic |
| 6 | Don | `pnpm setup:check --item contact-d1-databases` and `--item contact-preview-deploy` report complete | LIVE (read) |
| 7 | CI | After merge, `pnpm run deploy:production` applies both migrations to `dcc-web` and deploys | automatic |
| 8 | Don | `pnpm setup:check --item contact-production-deploy` reports complete | LIVE (read) |
| 9 | Don | `pnpm exec wrangler d1 delete dcc-web-contact-preview --env-file /dev/null` (only after step 5 succeeded) | LIVE |
| 10 | Don | `pnpm exec wrangler d1 delete dcc-web-contact --env-file /dev/null` (only after step 7 succeeded) | LIVE |

No Workers AI setup is needed: the `ai` binding uses the account's Workers AI with no key or
dashboard step. If the preview deploy (step 5) fails with an authorisation error that names
Workers AI, the Workers Builds API token needs the Workers AI permission added in the dashboard
(Don, LIVE); record that in `docs/setup.md` item 24 if it happens.

Optional remote check of the new databases (agent may run, read-only):
`pnpm exec wrangler d1 migrations list dcc-web-preview --remote --env preview --env-file /dev/null`
shows no pending migrations after step 5.

## 2. Local validation

```sh
pnpm run verify:quick          # lint, typecheck (incl. wrangler types --check), unit, worker, build
pnpm run test:worker           # questions API against local D1 with fake AI and ASSETS
pnpm run test:build            # question-source.json per post, drafts, sitemap exclusion
```

Full gate before the PR (ask Don first; run in the background under `perl -e 'alarm N; exec @ARGV'`
with `ASTRO_PREVIEW_BACKGROUND=1`): `pnpm run verify`.

Expected:

- Worker tests: rows Q01–Q12 and guarantees Q20–Q27 in `contracts/questions-api.md` pass in the
  `production` project; `environments.test.ts` passes in both projects with the new names.
- `dist/writing/<slug>/question-source.json` exists for every visible post and not for drafts
  in a production build; `dist/sitemap-*.xml` lists none of them.

## 3. Journeys to check by hand (local `wrangler dev` or the preview deployment)

Local: `pnpm run build && pnpm exec wrangler dev --port 4321 --env-file /dev/null`. Local dev
calls the real Workers AI (the binding is remote-only), so it uses the account allowance; the
local bucket is in the local D1.

1. Open any post. The "Think before you read" panel shows a sentence and "Get questions"; the
   Network panel shows no `/api/questions` request (FR-002).
2. Press "Get questions": the button disables, "Getting questions…" is announced, then 2–4
   numbered questions, the AI note and "New questions" appear (US1).
3. Reload and press again: the same questions return at once (`source: "cached"` in the
   response) and the bucket row is unchanged (`wrangler d1 execute dcc-web --local --command
   "SELECT * FROM usage_bucket"`).
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
both themes.

## 4. Visual baselines

The post template changes, so the `post-template` element shot of the fixture post (and any
other shot that includes the post article) changes on both platforms. Refresh both sets
(CLAUDE.md "Visual baselines"): `pnpm run test:visual:update` on macOS and
`pnpm run test:visual:update:linux` (Docker Desktop) or the `visual-baselines` label fallback,
copying only `*-linux.png` from the artifact. Any diff outside the post article is a regression,
not a baseline to refresh.
