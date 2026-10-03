# Quickstart: validate the four-part project story

Run everything from the worktree root. Use Node from `.nvmrc` (`source ~/.nvm/nvm.sh && nvm
use` in the same command as the tool). Bound long runs with `perl -e 'alarm N; exec @ARGV'`.

## 0. Before changing anything: record page heights (SC-002)

On the current `main` build, record the full page height at phone width (390 px) of each of
the five project pages, for example with a throwaway Playwright script or the browser's device
toolbar, and note the numbers in the PR body. Repeat after the change; each must be smaller.

## 1. Inner loop

```sh
pnpm run test:unit          # story check rows P/T/R/N/X, schema, order, template, plugin
pnpm vitest run --project unit tests/component/project   # component tests run in the unit project
pnpm run verify:quick       # lint, types, unit, worker, build
```

Expected: all pass; `pnpm run build` writes `dist/projects/<slug>/index.html` for all five
projects (a local build includes drafts) and no `dist/projects/_template/`.

## 2. Build checks (wiring)

```sh
pnpm run test:build -- tests/build/project-validation.test.ts tests/build/drafts.test.ts tests/build/indexing.test.ts
```

Expected: the one-broken-file runs fail with the file name and the rule
([contracts/build-errors.md](./contracts/build-errors.md)); the template runs X01 and X02
succeed; a production-mode build (`WORKERS_CI=1 WORKERS_CI_BRANCH=main`) lists no projects,
builds no project pages and shows the empty state.

## 3. Try a mistake by hand

Copy `src/content/projects/_template.mdx` to `src/content/projects/try-me.mdx`, set
`draft: true`, then in turn: remove the bold from the chosen option; change a cell to `maybe`;
rename `## Build` to `## Built`; swap two constraint labels. Each `pnpm run build` fails naming
`src/content/projects/try-me.mdx` and the rule. Delete the file afterwards.

## 4. Browser checks

```sh
pnpm run test:e2e -- --project=e2e tests/e2e/projects.spec.ts tests/e2e/projects-no-js.spec.ts tests/e2e/projects-forced-colors.spec.ts tests/e2e/projects-motion.spec.ts
pnpm run test:a11y
```

Expected: four parts in order, no contents list or chapter numbers, part `h2` the same computed
size as a post `h2`, picture beside text at 1280 px and below it at 390 px, links with Build,
invitation at the end, all readable with JavaScript off, axe clean in light, dark and forced
colours.

## 5. Visual baselines (intended change)

`/projects/` and `/projects/focus-pocus/` change appearance, so both baseline sets are
refreshed and the new images reviewed before committing:

```sh
pnpm run test:visual:update          # macOS (*-darwin.png)
pnpm run test:visual:update:linux    # Linux (*-linux.png), needs Docker Desktop
```

Fallback without Docker: add the `visual-baselines` label to the PR, download the
`visual-baselines-linux` artifact with `gh run download`, and commit only the `*-linux.png`
files. Any visual diff outside the projects pages is a regression, not a baseline to refresh.

## 6. Preview review (major change)

On the branch preview deployment, Don opens `/projects/` and each of the five project pages on
a wide screen and a phone, in light and dark, and approves the PR (SC-007). The production
deployment after merge lists no projects until he publishes one.
