# Quickstart: validating the portfolio design directions

Run everything from the worktree root. Details of what is checked live in
contracts/prototype-routes.md, contracts/islands.md, contracts/contact-handoff.md and
contracts/decision-document.md.

## 0. Toolchain

```sh
node -v                               # must be v24.x (.nvmrc)
source ~/.nvm/nvm.sh && nvm use       # in the same command as any pnpm call, if it is not
```

In a worktree call pnpm as `corepack pnpm <args>`. macOS has no `timeout`; bound long runs
with `perl -e 'alarm 1800; exec @ARGV' <cmd>`. Every Playwright or verify run from an agent
shell needs `ASTRO_PREVIEW_BACKGROUND=1`.

## 1. Unit and component tests

```sh
corepack pnpm exec vitest run tests/unit/prototypes/portfolio tests/component/prototypes/portfolio
```

Expected: sample-data invariants (data-model.md), filter rule, contact link and component
renders all pass.

## 2. Build and look at the directions

```sh
corepack pnpm run build
corepack pnpm exec wrangler dev --ip 127.0.0.1 --port 4321
```

Open `http://127.0.0.1:4321/design/portfolio/` and follow each direction's index and story.
Check with the footer theme switch in both themes and at 390 px and 1280 px. Expected: seven
stages in order, every option visible or reachable, the chosen one labelled with its reason,
visuals beside their stage, "Draft for review" on every stage, the demo stand-in note and
links, and "Have a problem like this?" linking to `/contact/?project=focus-pocus`.

Also confirm `/sitemap-0.xml` lists no `/design/` address and each prototype page has
`<meta name="robots" content="noindex">`.

## 3. Feature E2E, accessibility, no-JS and budget

```sh
ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm exec playwright test \
  tests/e2e/portfolio-directions.spec.ts
ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm exec playwright test \
  --project=a11y --project=budget --project=e2e --grep portfolio
```

Expected: all pass. The a11y, no-JS and budget suites cover the seven prototype routes
because they are in `TEMPLATES` (via `tests/e2e/portfolio-prototypes.ts`).

## 4. Full gate

```sh
ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 3600; exec @ARGV' corepack pnpm run verify
```

Expected: lint:secrets, lint, typecheck, unit/component/build tests, build and every
Playwright project pass, with the existing visual baselines unchanged.

## 5. Capture the 24 screenshots

With the build from step 2 served on port 4321:

```sh
ASTRO_PREVIEW_BACKGROUND=1 corepack pnpm exec playwright test \
  --config tests/design/portfolio/capture.config.ts
ls docs/design/portfolio/*.webp | wc -l      # 24
```

Expected: 24 WebP files named `<a|b|c>-<index|story>-<phone|desktop>-<light|dark>.webp`, each
under 600 KB.

## 6. Pin the preview addresses

1. Commit and push the finished prototypes, the document and its 24 screenshots.
2. From the Cloudflare Workers Builds check on that commit (or `corepack pnpm exec wrangler
   versions list`), take the version preview URL for that upload. Open
   `<url>/design/portfolio/` and confirm the hub and all six pages load.

## 7. Fill in the addresses and remove the prototypes (one commit)

1. Write the pinned URLs and the commit SHA from step 6 into `docs/design/portfolio.md`.
2. Run `corepack pnpm exec vitest run tests/unit/prototypes/portfolio/decision-doc.test.ts`;
   it must pass.
3. Delete `src/pages/design/portfolio/`, `src/prototypes/portfolio/`,
   `tests/unit/prototypes/portfolio/`, `tests/component/prototypes/portfolio/`,
   `tests/e2e/portfolio-prototypes.ts`, `tests/e2e/portfolio-directions.spec.ts` and
   `tests/design/portfolio/`; revert the one-line additions to `tests/e2e/templates.ts` and
   the `/design/` sitemap filter in `astro.config.mjs` (unless another open feature still
   needs the filter on main, which it will not, because its prototypes are also removed).
4. Confirm the branch diff against `origin/main` outside `specs/` and `.specify/` is only
   `docs/design/portfolio.md` and `docs/design/portfolio/*.webp`:

   ```sh
   git fetch origin main
   git diff --stat origin/main...HEAD -- . ':!specs' ':!.specify'
   ```

5. Run the full gate (step 4) again, commit, push.

## 8. After merge

`/design/portfolio/` returns the not-found page on production; `docs/design/portfolio.md`
shows all 24 images on GitHub, and its Decision section is empty.
