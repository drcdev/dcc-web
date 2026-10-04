# Review report: fixture-site-fixture-only (issue #69)

Reviewed `git diff main...HEAD` (9 commits, 11 files) against `plan.md` with fresh eyes.

## Verdict

All eight work items (W1-W8) are done as planned and nothing beyond them. The diff touches only
`scripts/build-fixture-site.ts`, six `tests/e2e/*.spec.ts` files, the new
`tests/unit/site/fixture-site-content.test.ts`, `docs/testing.md`, `docs/design-source.md` and the
chore folder. No `src/`, `public/`, `.github/`, `.claude/`, `playwright.config.ts`, `package.json`,
`wrangler.jsonc`, deploy script or constitution change; no PNG under
`tests/e2e/visual.spec.ts-snapshots/` changed. **Principle III: not major** (confirmed). The
pipeline alignment rule is n/a (no `.claude/skills/` change).

## Findings

CRITICAL: 0. HIGH: 0. LOW: 5.

- **LOW** `scripts/build-fixture-site.ts:177` - stray blank line before the closing brace of
  `prepareFixtureSite` left by the extraction. Cosmetic; lint and `verify:quick` pass.
- **LOW** `docs/testing.md:83` - the harness "Residual risk" paragraph was deliberately left. It is
  still accurate (it sits in the build-test section and `tests/build/fixture-site.ts` still copies
  real pages and projects), but "fixture builds copy the real `src/`" can now be misread as covering
  the Playwright fixture site, which no longer holds real posts or projects. Follow-up: name the
  harness explicitly when that risk is fixed.
- **LOW** `docs/testing.md:26` - pre-existing, outside this diff: the test-inventory row still says
  "four projects index rows (shipped, experiment, draft and in progress)"; the visual spec shoots
  five (retired added by feature 015). Follow-up.
- **LOW** `playwright.config.ts:28-31` - comment "the repository's site plus
  tests/fixtures/pages/sections.mdx" is now incomplete (posts and projects are fixture-only). Left
  by plan to avoid touching test config; follow-up.
- **LOW** `plan.md` W4/W5 - the plan quoted 19 and 24 tests for `blog-fixtures` and
  `projects-fixtures`; the real counts are 11 and 22 on both `main` and HEAD (`grep -cE '\btest\('`),
  so no test was deleted. Plan arithmetic only.

## Checks

- **Tests named in the plan.** `tests/unit/site/fixture-site-content.test.ts` (unit layer, as
  planned) and `no-real-content-in-tests.test.ts` re-run here: 2 files, 79 tests, green. E2E edits
  stay E2E. Playwright not re-run here (orchestrator's full gate).
- **No check weakened.** Test counts main -> HEAD: blog-fixtures 11 -> 11, blog-pagination 4 -> 4,
  projects-fixtures 22 -> 22, visual 6 -> 6. Assertions are stricter: literal totals (16, 13; 5, 2),
  exact project order, literal lead/Featured/Latest/Recent lists also checked against
  `selectLanding`/`selectRecent`, and the conditional text-only and long-title branches removed.
  Fixture dates confirm the literals (long-title 2026-08-20 and text-only 2026-08-10 lead Latest
  ahead of fixture-post-02..05).
- **Coverage mappings true.** `tests/e2e/blog.spec.ts` "landing page" (parts in order; "shows no
  post twice ..." over `selectLanding(BUILT_POSTS)`), "all posts page" ("every post as a card,
  newest first"), "home page recent writing (US7)"; `tests/e2e/projects.spec.ts` "the projects
  index" ("one row for every project and a link to its story"); `tests/unit/content/post-order.test.ts`
  (`selectLanding`, `selectRecent`) and `tests/unit/content/project-order.test.ts` ("orders by date,
  newest first"). The old projects-fixtures order check never asserted real-project order either,
  so nothing is lost.
- **No real content leaked.** Guard green; new comments and docs name only fixture slugs
  (`every-part`, `long-title`, `text-only`, `fixture-post-NN`, fixture project slugs) and real-site
  test titles.
- **Docs.** No stale "real rows" / "real post taking the lead" text remains in `docs/testing.md`
  or the touched specs.

## Measurement

| | Before (`main`) | After (HEAD) |
|---|---|---|
| `.mdx` in `.cache/fixture-site/src/content/posts` | 21 (5 real incl. sample + 16 fixture) | 16 |
| `.mdx` in `.cache/fixture-site/src/content/projects` | 10 (4 real + `_template` + 5 fixture) | 5 |
| Real-content imports (`posts`/`projects`/`realPosts`/`pages` from `helpers/content`) in blog-fixtures, blog-pagination, projects-fixtures | 3 (1 each) | 0 |

After figures from `pnpm run build:fixtures` run in this review (build succeeded). Before figures:
the plan's measurement, consistent with today's `src/content` (5 post files, 5 project files) plus
16 fixture posts and 5 fixture projects; imports counted from `git show main:`.

## Follow-ups for the PR body

- `tests/build/fixture-site.ts` (Vitest build harness) still copies real pages and projects; the
  `docs/testing.md` "Residual risk" paragraph (`drafts.test.ts` home-page case) stays open, and
  should name the harness when fixed.
- `playwright.config.ts` fixture-site comment (lines 28-31) to mention fixture-only posts and
  projects.
- `docs/testing.md:26` says four project-row shots; there are five.
