# Quickstart: validating the Now and Start here home page

## Prerequisites

- Follow CLAUDE.md "Local toolchain". Check `node -v` first. If it is not the `.nvmrc` version, put
  `source ~/.nvm/nvm.sh && nvm use` in the **same** Bash command as each `pnpm` call. Bound long runs with
  `perl -e 'alarm N; exec @ARGV' …`.
- Before Playwright, check that ports 4321/4322 are free (`lsof -i :4321`). Sibling worktrees share them.
- Linux visual baselines need Docker Desktop (`docker info`). See `.claude/skills/_shared/visual-baselines.md`.

## 1. Fast checks

```bash
pnpm run test:unit -- tests/unit/content/now-schema.test.ts tests/unit/content/reading-path-schema.test.ts tests/unit/content/reading-paths.test.ts tests/unit/content/dates.test.ts
pnpm exec vitest run tests/component/sections/Now.test.ts tests/component/sections/StartHere.test.ts
```

Expected: the build-errors rows N02–N06, N08, R01–R08 and R10 each have a passing test, and both
components match contracts/home-sections.md.

## 2. Build-level checks

```bash
pnpm exec vitest run --project build tests/build/home-sections.test.ts
```

Expected:

- A fixture path that names a missing post fails with R04, naming the file and the item.
- A Now `updated` in the future fails with N03.
- A production build (`WORKERS_CI=1`, `WORKERS_CI_BRANCH=main`) with a path whose only item is a
  draft fixture post has no `data-reading-path` for that path. With no visible path left, the build has no `data-start-here`.
- With no reading-path files, the home page builds and has no "Start here".
- A fixture project item shows a whole-number "min read".
- The existing build tests still pass. This proves the fixture harness drops the real path files (R8).

## 3. See it

```bash
pnpm run build && pnpm run preview
```

Open `/`. The order is intro, **Now** ("Updated …", four labelled topics, the open-to line linking
to `/contact/`), **Start here** (two paths: "Leading change in healthcare" with 2 items, and
"Building with AI agents" with 4 items, three of them marked "Project", each with "N min read"),
then **Recent writing** with the "All writing" link. "What I do", "advice", "workshops" and
"Cloud Architect" do not appear anywhere on the page.

Then:

- Turn JavaScript off and reload: everything is still readable.
- Narrow the window to 320 px: there is no horizontal scroll.
- Edit `src/content/now/now.md` (text and `updated`) and rebuild: only the Now section changes (SC-002).

## 4. Browser gate

```bash
pnpm exec playwright test tests/e2e/home.spec.ts
pnpm run test:a11y
pnpm run test:budget
pnpm run test:visual
```

Expected: home journey green, axe clean on `/`, and the budget passes. The visual run fails only on
the new `home-now-start-here-*` shots until they are created
(`pnpm run test:visual:update`, then `pnpm run test:visual:update:linux` with Docker). No existing
baseline should change. If `menu-open-phone-*` does change, refresh it and say so in the PR.

## 5. Full gate

Ask Don before running the full `pnpm run verify` (see memory: parallel gates). Run it in the background
through the wrapper and read the `VERIFY_EXIT=` line.

## Preview checks for Don (`[PREVIEW-CHECK]` in the PR body)

- The Now wording (FR-021), the date style ("October 1, 2026"), and the path descriptions (FR-022).
