# Bug Fix: Draft pages are listed in the sitemap

- **Slug**: draft-pages-sitemap
- **Fixed**: 2026-10-07
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

The `@astrojs/sitemap` `filter` in `astro.config.mjs` now drops every address in a set of draft page addresses read from `src/content/pages/` at config load. Draft pages are still built with the notice and noindex; published pages, posts and projects stay listed. Issue #119.

Docs basis (Principle IV): the `filter` option of `@astrojs/sitemap`, https://docs.astro.build/en/guides/integrations-guide/sitemap/#filter.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `src/lib/content/draft-pages.ts` | added | `draftPageAddresses(pagesDir)`: parses front matter (Astro's parser), maps `draft: true` files through `addressFromPath`; an unparsable file counts as not a draft |
| `astro.config.mjs` | modified | filter also drops `draftPages.has(pathname)` |
| `tests/build/drafts.test.ts` | added test | reproducing test, production fixture build with `tests/fixtures/pages/draft-page.mdx` |
| `tests/fixtures/pages/draft-page.mdx` | added | draft fixture page |
| `tests/helpers/content.ts` | modified | `sitemapPaths` lists published pages only |
| `tests/unit/content/content-helper.test.ts` | modified | draft pages absent, published present |
| `tests/build/indexing.test.ts` | modified | `/work-with-me/` listed once only when published; launch expectedPaths check skips draft pages |
| `tests/unit/site/sitemap.test.ts` | modified | used `""` (the home page, a draft today) as a sample path; now `contact/` |
| `docs/pages.md` | modified | `draft` row corrected |

## Tests Added or Updated

- `tests/build/drafts.test.ts` "builds a draft page with its notice and noindex but leaves it out of the sitemap" (build layer; failed before the fix, passes after).
- Updated tests listed above encoded the bug or depended on the home page being listed.

## Local Verification

- `vitest run tests/build/drafts.test.ts tests/unit/content/content-helper.test.ts tests/build/indexing.test.ts` → 69 passed, 1 skipped (the main-branch-only launch paths test).
- `pnpm run verify:quick` → passed.

## Deviations from Assessment

- `tests/unit/site/sitemap.test.ts` was not listed: it fed `""` (the draft home page) through the real config, so it broke. Changed to `contact/`; the order of entries is sorted by the sitemap.

## Follow-ups

- The launch-paths test only runs on a main-branch build, so the skipped path was not exercised locally.
- The crawl gate (`scripts/site-check`) walks the sitemap and no longer visits draft pages.
