# Quickstart: Projects Filter Threshold

How to check the change works. Use the `.nvmrc` Node (see CLAUDE.md "Local toolchain").

## Fast checks

```sh
pnpm exec vitest run tests/unit/content/filter-logic.test.ts tests/unit/site/fixture-site-content.test.ts
pnpm exec vitest run tests/component/project/ProjectList.test.ts tests/component/project/ProjectFilter.test.ts
pnpm exec vitest run tests/build/local-site.test.ts
```

Expected: the rule is `count > 10` by default; the fixture copy holds threshold 0 and the
repository file still holds 10; `ProjectList` renders a plain list at 10 and the filter at 11;
the L1 build's `projects/index.html` has every row, no `project-filter`, no `data-filter-*` and
the same script count as `about/index.html`.

## Production default by hand

```sh
pnpm run build
grep -c "<project-filter" dist/projects/index.html   # 0 with today's five projects
```

## Fixture site (filter still present)

```sh
pnpm run build:fixtures
grep -c "<project-filter" .cache/fixture-site/dist/projects/index.html   # 1
pnpm exec playwright test --project=sections tests/e2e/projects-fixtures.spec.ts
pnpm exec playwright test --project=visual
```

Expected: every filter case passes on port 4322, including the added no-JavaScript case; no
visual baseline changes.

## Full gate

`pnpm run verify` (ask Don first; see memory notes on running it from an agent shell).
