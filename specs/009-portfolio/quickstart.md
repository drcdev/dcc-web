# Quickstart: validating the portfolio

Run everything from the worktree root. Before any `pnpm`, `astro`, `playwright` or `wrangler`
command, check `node -v` against `.nvmrc`; if it differs, prefix the same command with
`source ~/.nvm/nvm.sh && nvm use &&`. In an agent shell, run the full gate with
`ASTRO_PREVIEW_BACKGROUND=1`, bounded with `perl -e 'alarm N; exec @ARGV'` (macOS has no
`timeout`).

## 1. The whole gate

```sh
pnpm run verify
```

`verify` already runs secrets lint, ESLint, type checks, Vitest (unit, component, build), the
build and every Playwright project (e2e, a11y, budget, visual, sections/fixtures). Expected: all
green, including the new project tests and the eight new visual baselines per platform.

## 2. Focused runs while building

| What | Command | Expect |
|---|---|---|
| Schema, body, themes, order, build mode | `pnpm exec vitest run tests/unit/content` | pass |
| Building blocks and index pieces | `pnpm exec vitest run tests/component/project` | pass |
| Broken-file wiring, one-file project, drafts, CSP | `pnpm exec vitest run --project build tests/build/project-validation.test.ts tests/build/local-site.test.ts tests/build/drafts.test.ts` | each broken fixture fails its build or sync with the message in [contracts/build-errors.md](./contracts/build-errors.md); the row-by-row mapping is in `docs/testing.md` |
| Index, story, hand-off, motion, no-JS | `pnpm run build && pnpm exec playwright test --project=e2e tests/e2e/projects` | pass |
| Filter and every-block fixtures | `pnpm exec playwright test --project=sections` | pass (fixture site on port 4322) |
| Accessibility | `pnpm run test:a11y` | zero violations on `/projects/` and `/projects/focus-pocus/` |
| Budget | `pnpm run test:budget` | both templates within budget |
| Visual | `pnpm run test:visual` | matches baselines |

## 3. New visual baselines (intended appearance change)

```sh
pnpm run test:visual:update          # macOS images
pnpm run test:visual:update:linux    # Linux images (needs Docker Desktop running)
```

Only the `projects-*` and `project-story-*` images may be new; any other changed baseline is a
regression. If Docker is unavailable, ask Don to start it; fallback is the `visual-baselines`
PR label and `gh run download` of the `visual-baselines-linux` artifact.

## 4. Manual checks (preview deployment, SC-010)

1. Follow **Projects** in the header from any page: `/projects/` loads, Projects is marked current.
2. At 1280 px: one ruled row per project, text left, visual right. At 390 px: visual after text.
3. Open Focus Pocus: title carries across (motion allowed, Chromium); progress bar fills; chapter
   headings uncover; visuals stay beside text at ≥ 1280 px; seven chapters in order; "In this
   story" links jump to each chapter; every draft chapter and placeholder visual is marked.
4. Options chapter: every option and constraint, "Chosen" in text, reason below; at 390 px the
   table scrolls inside its region with the keyboard (Tab to it, arrow keys).
5. "What I built": stand-in link to drc.dev with "This is not a live demo."; source-code link.
6. Invitation → `/contact/?project=focus-pocus`; the form shows "About: focus-pocus".
7. Repeat 1–6 in light and dark themes; with reduced motion (no bar, no uncover, no sticky, no
   transition); with JavaScript off (all content, no filter controls).
8. Compare by eye with the Direction C screenshots in `docs/design/portfolio.md` (index uses
   Direction A's two columns inside Direction C's rows).

## 5. Adding a project (SC-004)

1. Add `src/content/projects/<slug>.mdx` and `src/content/projects/images/<slug>/…`, following
   [contracts/project-file.md](./contracts/project-file.md).
2. `git status` shows only those files.
3. `pnpm run build`: the project is on `/projects/` and at `/projects/<slug>/`.
4. Break it (remove the options chapter): the build fails naming the file and the chapter.

## 6. Drafts

With a draft project file present (the build tests use `tests/fixtures/projects/draft-project.mdx`
through the fixture-site harness; Focus Pocus itself is published):

```sh
WORKERS_CI=1 WORKERS_CI_BRANCH=main PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA pnpm run build   # draft absent (index, page, sitemap)
WORKERS_CI=1 WORKERS_CI_BRANCH=009-portfolio PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA pnpm run build  # draft present, marked "Draft"
```
