# Bug Assessment: Draft pages are listed in the sitemap

- **Slug**: draft-pages-sitemap
- **Created**: 2026-10-07
- **Source**: pasted text (GitHub issue #119, "Leave draft pages out of the sitemap"; no URL supplied, nothing fetched)
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> A draft page stays on the live site with its draft notice and a request that search engines
> not index it, but it is left out of the sitemap, so the site no longer points search engines at
> pages it asks them to skip. Published pages, posts and projects stay in the sitemap as they are
> today.
>
> The page authoring guide says what a draft page does: it is still published, shows the draft
> notice, is not indexed by search engines and is not in the sitemap.

## Symptom

A standalone page with `draft: true` is built with the draft notice and `<meta name="robots"
content="noindex">`, yet its address is listed in `sitemap-0.xml` in every build, production
included. Expected: the page is still built with notice and noindex, but is not in the sitemap.

## Reproduction

1. Note the five draft pages today: `src/content/pages/index.mdx`, `work-with-me.mdx`,
   `technology.mdx`, `privacy-policy.mdx`, `terms-of-use.mdx` (all `draft: true`).
2. Build the site with the production environment (`WORKERS_CI=1`, `WORKERS_CI_BRANCH=main`), as
   `tests/build/indexing.test.ts` does.
3. Read `dist/sitemap-0.xml`: it lists `https://doncoleman.ca/`, `/work-with-me/`,
   `/technology/`, `/privacy-policy/` and `/terms-of-use/`, while each of those pages carries
   `noindex` (asserted by the same test file at `indexing.test.ts:89`).

Verified from code; the build was not run in this phase.

## Suspected Code Paths

- `astro.config.mjs:161-167` — the `@astrojs/sitemap` `filter` drops only `/404*` and
  `*/question-source.json`; it has no knowledge of draft pages.
- `src/pages/[...slug].astro:65` → `src/layouts/PageLayout.astro:37,60` — draft pages are always
  built (noindex + `DraftNotice`), so the sitemap integration sees them as ordinary routes.
  Correct per the issue; no change.
- `src/lib/posts.ts:45-50`, `src/lib/content/project-order.ts:23` — draft posts and projects are
  not built in production, which is why they never reach the sitemap there. No change.
- `tests/helpers/content.ts:106-121` — `inBuild` keeps every page (correct: draft pages are built)
  but `sitemapPaths` lists every page, so the helper encodes the bug.
- `tests/unit/content/content-helper.test.ts:91-106` — asserts every page address is in
  `sitemapPaths`; encodes the bug.
- `tests/build/indexing.test.ts:142-153` — sitemap must equal `sitemapPaths`; follows the helper.
- `tests/build/indexing.test.ts:155-164` — comment "drafts included" and the assertion that
  `/work-with-me/` (a draft page today) is listed exactly once; conflicts with the fix.
- `tests/build/indexing.test.ts:203-211` — main-branch build: every `launch.expectedPaths` entry
  (`setup/config.json`) must be in the production sitemap; five of those paths are draft pages
  today, so this test turns red after the fix.
- `tests/e2e/seo.spec.ts:67-79` — sitemap equals `sitemapPaths({ production: false })`; corrected
  by the helper change, no own edit needed.
- `docs/pages.md:41` — the `draft` row says "It does not hide the page from search or the
  sitemap", which is stale on both counts (the page is already noindex).

## Root Cause Hypothesis

The sitemap integration includes every prerendered route, and its `filter` callback receives only
the page URL (Astro docs, @astrojs/sitemap "filter()":
https://docs.astro.build/en/guides/integrations-guide/sitemap/#filter — "you can filter included
pages by URL"). Drafts were kept out of the sitemap only indirectly, by not building draft posts
and projects in production. Draft pages are built on purpose (with noindex), and nothing tells the
filter which addresses are draft pages, so they stay listed. Confidence: high.

## Proposed Remediation

**Preferred**: Give the sitemap `filter` the set of draft page addresses, computed at config time.
Add a small helper in `src/lib/content/` (e.g. `draft-pages.ts`) that reads every Markdown/MDX file
under `src/content/pages/` (resolved from the config file's own URL, so fixture sites built from a
copied root read their own pages), parses the front matter with the same
`@astrojs/internal-helpers/frontmatter` parser `tests/helpers/content.ts` uses, and maps each
`draft: true` file to its address with the existing `addressFromPath` from
`src/lib/content/addresses.ts`. In `astro.config.mjs`, extend the filter to drop any URL whose
pathname is in that set. This applies to every build (draft pages are noindex in every build).
Docs basis: @astrojs/sitemap `filter()` (link above) is the first-party mechanism for leaving pages
out (Principle IV).

**Alternatives**:
- `serialize()` returning `undefined` (https://docs.astro.build/en/guides/integrations-guide/sitemap/#serialize)
  — also URL-only, so it needs the same draft set; no advantage over `filter`.
- Decide by build output (drop pages whose HTML has `noindex`) in a custom `astro:build:done`
  integration that rewrites the sitemap — couples to output HTML, would also drop every page on a
  preview build (all noindex there), and is custom code where the first-party filter suffices.
- Hard-code draft addresses in the config — drifts from content; rejected.

**Files likely to change**:
- `astro.config.mjs` (filter)
- `src/lib/content/draft-pages.ts` (new helper; name at fix time)
- `tests/helpers/content.ts` (`sitemapPaths` lists published pages only; `inBuild` unchanged)
- `tests/unit/content/content-helper.test.ts` (draft pages not in `sitemapPaths`)
- `tests/build/indexing.test.ts` (comment/assertion at :155-164; launch-paths test at :203-211)
- `tests/build/drafts.test.ts` and a new fixture `tests/fixtures/pages/<draft>.mdx` (reproducing test)
- `docs/pages.md:41`

**Tests to add or update**:
- **Reproducing test — build layer** (`tests/build/drafts.test.ts`, fixture site): build a fixture
  site with one draft fixture page and one published fixture page; the draft page's
  `index.html` exists with the draft notice and `noindex`, its address is absent from
  `sitemap-0.xml`, and the published page's address is present. Build layer because the
  behaviour is config wiring observed in the real build's sitemap output across pages
  (docs/testing.md "Where a test goes"). A fixture is used rather than the real draft pages so
  the test stays meaningful after Don publishes those pages.
- `tests/build/indexing.test.ts`: the exact-equality sitemap test follows the corrected helper;
  the `/work-with-me/` test asserts it is listed once only when the page is published (or
  asserts absent while draft) and keeps the `/services/`, `/speaking/` absence checks; the
  launch-paths test checks only `expectedPaths` that are not draft pages.
- `tests/unit/content/content-helper.test.ts`: `sitemapPaths` excludes draft page addresses —
  this is a test of the test helper, not a second layer for the behaviour.
- A config unit test in `tests/unit/site/sitemap.test.ts` is not needed: the build test observes
  the same behaviour and a second layer would need a written reason.

## Risks & Considerations

- **The home page is a draft today** (`index.mdx` `draft: true`), as are four launch pages. After
  the fix the production sitemap lists none of `/`, `/work-with-me/`, `/technology/`,
  `/privacy-policy/`, `/terms-of-use/` until Don flips those flags. This is the behaviour the
  issue asks for, and it is consistent with the pages already being noindex.
- **Launch checks**: the build test at `indexing.test.ts:203-211` requires every
  `launch.expectedPaths` entry in the production sitemap. Resolved here (not escalated): exclude
  draft pages from that check, because setup item 26 ("Every page in launch.expectedPages ... is
  not a draft", `scripts/setup-check/items.ts:465-467`) already gates launch on publishing those
  pages, and the live sitemap check (item 29, `scripts/setup-check/checks/live-sitemap.ts`) runs
  only after the switch, by which point item 26 is green. Neither setup check needs a change.
- The site-check crawler (`scripts/site-check/crawl.ts`) walks the sitemap, so the crawl gate will
  no longer visit draft pages. They are still reachable by links; acceptable, and the crawl's
  link checking still covers links into them.
- The filter reads files at config load; a malformed page front matter must not crash the config
  in a way that hides the content layer's clearer schema error — the helper should treat an
  unparsable file as not-draft and let the content collection fail the build with its own error.
- No dependency, cost, CI or design change; not a major change under Principle III.

## Open Questions

None. The launch-paths test conflict is resolved above (exclude draft pages from that build check;
setup item 26 already gates launch on publishing them).
