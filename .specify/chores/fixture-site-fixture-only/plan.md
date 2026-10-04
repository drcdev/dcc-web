# Chore plan: fixture-site-fixture-only (issue #69)

Branch: `chore/fixture-site-fixture-only`, at `main` (c3416c0, after #67 merged).
Issue: https://github.com/drcdev/dcc-web/issues/69. The PR body says `Closes #69`.

## Goal

[#69](https://github.com/drcdev/dcc-web/issues/69): the Playwright fixture site (port 4322,
`scripts/build-fixture-site.ts`) copies all of `src/`, so it holds the four real posts, the
FR-035 sample post and the four real projects next to the fixtures. Its specs therefore compute
totals, lead/featured picks and page counts from real content, and `visual.spec.ts` strips real
project rows before shooting. This chore removes the real posts and projects (and the sample
post) from the fixture site, so it is built from fixture content only. The fixture specs then
own every item they assert on and use fixed expectations. Real-content checks stay where they
already live, in the specs that run on the real site (port 4321) and the unit tests that read
`src/content/**`. No page, component, style, schema or config of the site changes.

## Acceptance

1. **Fixture-only build.** After `pnpm run build:fixtures`, `.cache/fixture-site/src/content/posts`
   holds exactly the 13 generated posts plus `FIXTURE_POSTS` (16 `.mdx`). `.../projects` holds
   exactly the five `tests/fixtures/projects/*.mdx` (no `_template.mdx`, nothing from `broken/`).
   **Before:** 21 posts (4 real, the sample, 16 fixture) and 9 projects plus `_template`
   (4 real, 5 fixture). **After:** 16 and 5. Proven by the W1 unit test.
2. **Specs read no real content.** `grep -nE 'import \{[^}]*\b(posts|projects|realPosts|pages)\b' `
   over `blog-fixtures`, `blog-pagination` and `projects-fixtures.spec.ts`.
   **Before:** 3 matching lines (`blog-fixtures:20`, `blog-pagination:9`, `projects-fixtures:7`).
   **After:** 0. The W1 test enforces this for every 4322-only spec.
3. **Fixed expectations.** `blog-pagination.spec.ts` totals are literals: all posts 16 (pages
   12 + 4), `agentic-ai` 13 (12 + 1). `projects-fixtures.spec.ts`: 5 projects, Tooling 2, and
   "lists projects newest first" asserts exact equality with
   `["draft", "minimal", "every-part", "every-setting", "retired"]`. `blog-fixtures.spec.ts` has no
   `if (... includes ...)` branches left. Expected values (to confirm with `selectLanding`): lead
   `every-part`, Featured `[fixture-post-01]`, Latest `[long-title, text-only, fixture-post-02..05]`,
   Recent writing `[every-part, long-title, text-only]`.
4. **Visual baselines byte-identical.** `git diff --stat main -- tests/e2e/visual.spec.ts-snapshots`
   is empty (132 files: 66 per platform) and the full gate's `visual` project is green with no
   update. Any diff is a regression to fix (see Risks for the one named, predicted case).
5. **Test counts.** `playwright test --list` totals per project are unchanged (no e2e test added
   or removed); `vitest run --project unit` gains one file (W1). The implement summary records
   before and after.
6. **Gates.** `pnpm run verify:quick` green after each item; full `pnpm run verify` green before
   the PR (orchestrator asks Don first).
7. **Diff scope.** `git diff --name-only main` lists only `scripts/build-fixture-site.ts`,
   `tests/**`, `docs/testing.md`, `docs/design-source.md` and this chore folder. No `src/`,
   `public/`, `.github/`, `playwright.config.ts`, `package.json` or snapshot change.

## Scope

**In:** `scripts/build-fixture-site.ts`; new `tests/unit/site/fixture-site-content.test.ts`;
`tests/e2e/{blog-fixtures,blog-pagination,projects-fixtures,visual,blog-fixture.a11y,budget}.spec.ts`
(code and header comments); `docs/testing.md`; `docs/design-source.md`.

**Judgment calls (made here):**
- **Real pages stay.** The fixture site keeps `src/content/pages/**` (home with `<RecentWriting />`,
  navigation, footer links, `/contact/`). No fixture test asserts on page copy or counts pages;
  the shell and the sections full-page baseline need them unchanged. A fixture home would change
  nothing a test sees and would add upkeep.
- **The sample post goes too.** No 4322 test visits `/writing/sample-everything/` (its visits in
  `templates.ts` and `projects.spec.ts` are relative to 4321). It is a draft dated 2026-08-27 and
  featured, so today it sits in the fixture Featured grid and Recent writing; removing it makes
  the site truly fixture-owned.
- **Whole folders are replaced**, not filtered file by file: after the `src` copy,
  `src/content/posts` and `src/content/projects` are removed and rebuilt from fixtures, so real
  images and `_template.mdx` go too. Nothing outside those folders references their images.

**Out (follow-ups for the PR body):**
- `tests/build/fixture-site.ts` (the Vitest build harness) still copies real pages and, unless
  `withoutRealProjects`, real projects; `docs/testing.md` "Residual risk" (lines 83-88, the
  `drafts.test.ts` home-page case) is about that harness and stays open.
- `playwright.config.ts` comment at lines 28-31 is left as is (still true; avoids touching test
  config).

## Constitution Check

- **I Test-First:** W1 is a new unit test seen to fail before W2. Spec edits tighten existing
  e2e tests to fixed values; each is run red-free on the fixture site by the gate.
- **II Release gate:** no check skipped or weakened; assertions become stricter (fixed literals,
  unconditional checks).
- **III Major change:** no criterion fires. No dependency, contact data, design system, layout,
  cost, CI/deploy config or constitution change; `scripts/build-fixture-site.ts` is test tooling
  run by Playwright's webServer, not CI or deployment configuration. **Not major; auto-merge.**
- **IV First-party:** the fixture site still relies on Astro's `glob()` loader reading whatever
  files are in the base folder; only Node `fs` copy/remove calls change (citations below).
- **V Static:** unchanged. **VI Content as files:** unchanged; real content is untouched.
- **VII Private data:** unchanged. **VIII Cloudflare:** unchanged. **IX Cost:** no change.
- **X Accessible/fast:** a11y and budget checks still run on the same fixture pages (budget page
  `/writing/all/` still has 12 cards).
- **XI Spec Kit:** chore pipeline, one branch, plan under `.specify/chores/<slug>/`.

## Work items

### W1 Unit test: the fixture site holds fixture content only (new-first)
- Files: `tests/unit/site/fixture-site-content.test.ts` (new); `scripts/build-fixture-site.ts`
  gets an exported `prepareFixtureSite(siteRoot: string)` that does every copy and write of
  today's `buildSite` (no Astro build). For this item only the extraction lands, behaviour as is.
- Test (new-first): call `prepareFixtureSite` into a temp dir under `.cache/fixture-tests/`,
  then assert the `.mdx` names in `src/content/posts` equal the 13 generated slugs plus
  `FIXTURE_POSTS`, and in `src/content/projects` equal the `tests/fixtures/projects/*.mdx` names;
  and that `src/content/pages` still has `index.mdx` plus `FIXTURE_PAGES`. A second case reads
  the 4322-only specs (`blog-fixtures`, `blog-pagination`, `projects-fixtures`) and fails if any
  imports `posts`, `projects`, `realPosts` or `pages` from `tests/helpers/content`. Both fail now.
- Layer: unit, the cheapest layer that sees the copied tree; no Astro build needed. The e2e fixed
  counts (W3-W5) are a second, incidental observation, not a planned second layer.
- [ ] done

### W2 Build the fixture site from fixture content only
- Files: `scripts/build-fixture-site.ts`.
- Change: in `prepareFixtureSite`, after the `src` copy, `rmSync` `src/content/posts` and
  `src/content/projects` (recursive) and recreate them; the existing fixture writes then fill
  them. Keep the `.DS_Store` filter and its Docker bind-mount comment. Rewrite the header comment
  ("a copy of this repository's site" → site code and real pages, with fixture posts and projects
  only). `buildSite` = `prepareFixtureSite` + `build()`.
- Test: existing W1 turns green. `verify:quick` does not build the fixture site, so also run
  `pnpm run build:fixtures` once through the wrapper and check that it succeeds.
- [ ] done

### W3 blog-pagination.spec.ts: fixed totals
- Drop the `posts` import and `SITE_TOPICS`; `TOTALS` = `[ALL, 16]`, `[TOPIC, 13]` with a
  comment naming the 13 generated + 3 fixture posts. Keep the page-2 guard. Update the header.
- Test: existing (4 tests x 2 listings), now fixed.
- Coverage mapping: "pagination counts include the real posts" → real listing of every post is
  `blog.spec.ts` "all posts page … every post as a card, newest first" (4321).
- [ ] done

### W4 blog-fixtures.spec.ts: fixture-only SITE_POSTS, unconditional checks
- `SITE_POSTS = sortNewestFirst([...fixtureOwned, ...generated])`; drop `posts`. Replace the
  conditional branches (text-only in the landing grid; long-title on `/`, landing, `/writing/all/`,
  technology-teams) with unconditional checks; add literal asserts for the lead, Featured and
  Recent values in Acceptance 3. Rewrite the header and the "series lead" comment (drift now has
  only every-part; convergence none).
- Test: existing (19), tightened.
- Coverage mapping: landing/Featured/Latest over real posts → `blog.spec.ts` "landing page"
  (no post twice, parts in order); Recent writing over real posts → `blog.spec.ts`
  "home page recent writing (US7)"; selection rules → `tests/unit/content/post-order.test.ts`.
- [ ] done

### W5 projects-fixtures.spec.ts: fixed counts and exact order
- `ALL = 5`, `TOOLING = 2` from `readEntries("projects", "tests/fixtures/projects")` or literals
  (literals, with the fixture names in a comment); drop `projects`. "lists projects newest first"
  asserts the full row list equals the five fixtures. Fix the "theme variants" comment (Tooling is
  on two fixtures; AI integration now on one). Update the header.
- Test: existing (24), tightened.
- Coverage mapping: "real projects sit among fixtures newest first" → order rule in
  `tests/unit/content/project-order.test.ts`; every real project listed with a link →
  `projects.spec.ts` "the projects index … one row for every project" (4321).
- [ ] done

### W6 visual.spec.ts: drop the real-row workaround, keep the pixels
- Replace `onlyFixtureRows` with a wait that only checks `project-filter[data-ready]` and exactly
  five `li[data-project]` rows (no DOM removal; with no real rows the removal is already a no-op).
  Keep the lead-story wait, reworded ("pins the lead"). Rewrite the header (lines 11-16) and the
  block comments (lines 110-125): every subject is still an element shot, to keep the shell out.
- Test: existing visual project, 66 images per platform, must pass with no update
  (Acceptance 4). Layer: visual, unchanged.
- [ ] done

### W7 Comments that count posts
- `blog-fixture.a11y.spec.ts` header "17 posts" → 16; `budget.spec.ts` line 86-88 "21 posts (the
  real ones, dated 2025, fall on page 2)" → 16 fixture posts, page 1 still 12 cards.
- Test: `no behaviour: n/a (comments only)`.
- [ ] done

### W8 Docs
- `docs/testing.md`: in "Real content in tests", say the fixture site (port 4322) is built from
  fixture posts and projects only (real pages kept for the shell). In "Visual coverage", drop "the
  fixture index also lists the real rows, which the test removes", "dated 2099 so no real post can
  take the lead" (keep 2099 as the reason it is the lead), and reword "The fixture site also
  holds real content, so every phase-2 subject is an element shot" (element shots keep the shell
  out). Leave the harness "Residual risk" paragraph (out of scope).
- `docs/design-source.md` lines 79-80: note the Playwright fixture site has fixture posts and
  projects only.
- Test: `no behaviour: n/a (docs)`; CLAUDE.md is not touched.
- [ ] done

## Docs citations (Principle IV)

- Astro `glob()` loader builds a collection from the files matching `pattern` under `base`, so
  removing the real files removes the entries:
  https://docs.astro.build/en/reference/content-loader-reference/#glob-loader and
  https://docs.astro.build/en/guides/content-collections/#the-glob-loader (Astro Docs MCP).
- Node `fs.rmSync(path, { recursive: true, force: true })`, `fs.cpSync`, `fs.readdirSync`:
  https://nodejs.org/api/fs.html#fsrmsyncpath-options,
  https://nodejs.org/api/fs.html#fscpsyncsrc-dest-options. No new tool or library.

## Risks

- **Project-row shots move.** With real projects gone the theme filter has 6 buttons, not 13, so
  it wraps onto fewer lines and the fixture rows sit higher. Buttons are `min-h-11` (44 px) with
  `gap-2` (8 px), so the shift is a whole number of pixels and an element shot should be
  identical. If the gate still shows diffs confined to `project-row-*`, that is this predicted
  cause: confirm against `-previous.png`, then refresh only those images on both platforms through
  the CLAUDE.md flow and say so in the PR body. Any other diff is a regression.
- **Hidden real-content reliance on 4322.** `a11y.spec.ts` portfolio states, `theme-tokens` and
  `sections` use fixture paths only (checked). The full gate is the proof.
- **Parallel worktrees** share 4321/4322; Playwright runs are for the orchestrator or CI.
- **Docker bind mount:** keep the `cpSync` filter; `rmSync` on a copied tree is unaffected.
