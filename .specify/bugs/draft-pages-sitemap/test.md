# Bug Verification: Draft pages are listed in the sitemap

- **Slug**: draft-pages-sitemap
- **Tested**: 2026-10-07
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

A production build (WORKERS_CI=1, WORKERS_CI_BRANCH=main) no longer lists any of the five draft pages in `sitemap-0.xml`, while each draft page's HTML is still built with noindex and the draft notice. Published pages, posts and projects remain listed. No regressions found.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | production `astro build`, read dist/sitemap-0.xml and draft HTML | pass | 21 URLs, none of /, /work-with-me/, /technology/, /privacy-policy/, /terms-of-use/; those four pages plus home carry noindex; draft notice text present |
| New / updated tests | vitest drafts, indexing, content-helper, sitemap | pass | 73 passed, 1 skipped (main-branch-only launch paths test) |
| Regression suite | vitest tests/unit/content, tests/unit/site, tests/unit/site-check, Seo component, local-site, question-source | pass | 66 files, 1446 tests passed |
| Fast gate | `pnpm run verify:quick` | pass | ended with build complete |
| Fixture leak | inspected scripts/build-fixture-site.ts | pass | Playwright fixture site copies only FIXTURE_PAGES (sections, contact-form); draft-page.mdx is not copied |

## Residual Risks

- Launch-paths test only runs on a main-branch build; skipped locally.
- Crawl gate (scripts/site-check) no longer visits draft pages by design.
- Full Playwright suite not run here (orchestrator's gate).
