# Quickstart: validating the launch feature

These are the scenarios that show the feature works. Commands run from the repository root, with
Node from `.nvmrc`. In an agent shell, use `source ~/.nvm/nvm.sh && nvm use` in the same command.

## Prerequisites

- `pnpm install --frozen-lockfile`
- Setup checks that read Cloudflare need the read-only token, account ID and zone ID in `.env`
  (`docs/setup.md#local-credentials`). Never print `.env`.
- Docker is not needed. No visual baseline changes: only meta tags and headers change, so any
  visual diff is a regression.

## 1. The gate, locally (US1 scenarios 1–2)

```sh
ASTRO_PREVIEW_BACKGROUND=1 pnpm run verify
```

Expected: passes. This run includes `tests/e2e/site-links.spec.ts`, which crawls the production
build served by `wrangler dev` and finds no failures.

Negative check: add a link to `/does-not-exist/` in any page, then rebuild and run
`pnpm exec playwright test --project=e2e tests/e2e/site-links.spec.ts`.
Expected: it fails and names `/does-not-exist/` and the page that links to it. Revert the link
afterwards.

## 2. The crawler by hand

```sh
pnpm run build
pnpm exec wrangler dev --ip 127.0.0.1 --port 4321 &   # or reuse the Playwright server
pnpm run site:check -- --base http://127.0.0.1:4321
```

Expected: `Checked <p> pages and <l> links on http://127.0.0.1:4321` and exit code 0.

## 3. The CI preview crawl (US1 scenario 1; FR-018, preview side)

Push the branch and open the pull request. In the `verify` job, the step
`Check the preview's sitemap and links`:

- waits for `Workers Builds: dcc-web-preview` on the head SHA;
- crawls `https://br-011-launch-dcc-web-preview.drc-dev.workers.dev`, expecting the sitemap
  origin to be that address and every page to send `X-Robots-Tag: noindex`;
- passes, with a job summary line `Preview site check passed: …`.

A broken link fails the step, shows annotations and a summary table, and blocks the merge.

## 4. Indexing and origin (FR-010a, FR-018)

```sh
pnpm exec vitest run tests/unit/site tests/component/Seo.test.ts tests/build
```

Expected:

- A main-build environment (`WORKERS_CI=1 WORKERS_CI_BRANCH=main`) gives `https://doncoleman.ca`
  in the canonical link, `og:url`, the sitemap and robots.txt, and no robots meta on public
  pages.
- A branch build gives the alias origin and noindex.
- `_headers` has the two host rules and no `/*` noindex.

On the preview: `curl -sI https://br-011-launch-dcc-web-preview.drc-dev.workers.dev/ | grep -i x-robots-tag`
prints `noindex`.

## 5. The setup check before the switch (US4 scenario 3)

```sh
pnpm setup:check
```

Expected, before the switch:

- items 16 and 28–31 show `waiting` ("Waiting for the switch: …");
- item 6 is complete ("still resolves to the recorded Ghost targets");
- item 26 is missing, naming services, speaking and focus-pocus, until Don replaces the
  placeholders;
- item 32 is complete;
- the summary counts `waiting` separately, and the waiting items alone do not make `ok` false.

Unit coverage of every state:
`pnpm exec vitest run tests/unit/setup-check tests/unit/setup tests/unit/site-check`.

## 6. Docs

```sh
pnpm exec vitest run tests/unit/setup/docs-structure.test.ts tests/unit/setup/launch-doc.test.ts tests/unit/setup/drift.test.ts
```

Expected:

- `docs/setup.md` has 32 item sections, including the Launch part;
- `docs/launch.md` has parts A to F, with steps L1–L18, R1–R5 and T1–T9, each with what, where
  and how to confirm, and pause markers;
- the Ghost records table equals the baseline;
- the ordering rules hold.

## 7. After the merge: the switch with Don (US2–US5; SC-002, SC-003, SC-007)

Run `/setup-walkthrough`. At item 26 it hands over to `docs/launch.md`, from Part A onwards. At
the end of Part D:

- `pnpm setup:check` shows items 6, 16, 17, 18 and 26–32 complete;
- `curl -sI https://doncoleman.ca/` returns 200 with no `x-robots-tag`;
- `curl -sI https://www.doncoleman.ca/about/` returns 301 with
  `location: https://doncoleman.ca/about/`;
- `curl -s https://doncoleman.ca/robots.txt` names `https://doncoleman.ca/sitemap-index.xml`;
- `dig +short new.doncoleman.ca` returns nothing.

## 8. Rollback drill (US3, SC-005). Optional, done only if needed

Follow Part E. Expected: `pnpm setup:check --item live-domain-ghost` reports Ghost again,
`--item mail-records` is complete, and the post-launch items show `waiting` again. Don's own
work takes under 15 minutes.
