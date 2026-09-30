# Implementation Plan: The blog ("Drift & Convergence")

**Branch**: `008-blog` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-blog/spec.md`

## Summary

Build the blog to Direction A ("Front page", `docs/design/blog.md` § Decision). Posts are a new
`posts` content collection (one `.mdx` file each, strict Zod schema, topics from a controlled
enum so a typo fails the build). Four routes under `src/pages/writing/` render the landing page
(lead story, topic pill row, Featured bento grid, Latest grid), the all-posts listing and topic
pages with Astro's built-in `paginate()`, and the post page (hero, overlapping title card, body,
"views are my own" note, share, related posts). The official `@astrojs/rss` package builds
`/writing/rss.xml`. A Sätteri mdast plugin (Astro's reading-time recipe) computes reading time
at build time. Code uses Astro's built-in Shiki highlighting with a custom semantic theme and a
transformer that turns every inline colour into a class, so the site's strict content security
policy stays unchanged; a `CodeBlock` component (MDX `pre` override) adds the caption and a copy
button, the only script in a post body. Tables scroll inside a focusable region through an MDX
`table` override (no script). Drafts are left out only of the production build, detected from
the Cloudflare Workers Builds variables the site already uses (`WORKERS_CI=1` and
`WORKERS_CI_BRANCH=main`); a Workers Builds build whose branch is missing counts as production
(fail-safe, spec FR-046), and draft pages always carry `noindex` (FR-045). The home page gains a `RecentWriting` section; "Writing" in the header
is marked current across the section. Four sample posts ship as drafts. Details and doc
citations: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 6.0 (strict), Node 24 (`.nvmrc`), Astro 7.3.5, static output.

**Primary Dependencies**: existing `astro`, `@astrojs/mdx`, `@astrojs/markdown-satteri`,
`@astrojs/sitemap`, Tailwind 4 + typography. **New**: `@astrojs/rss` (official, feed) and
`satteri` (pinned to 0.10.5, the version `@astrojs/markdown-satteri` already installs; needed to
define the reading-time mdast plugin, R6). Shiki is Astro's built-in highlighter (no new
package).

**Storage**: files only: `src/content/posts/*.mdx`, `src/content/posts/images/`. No database.

**Testing**: Vitest (`tests/unit/` unit and schema, `tests/component/` via the Astro Container
API, `tests/build/` fixture-site builds); Playwright against `wrangler dev` serving `dist/`
(`e2e`, `a11y` with axe WCAG 2.2 AA tags, `budget`, `visual`) and the fixture site on port 4322
(`sections`, plus the pagination tests) (R16).

**Target Platform**: Cloudflare Workers static assets via Workers Builds (unchanged);
evergreen browsers; every page readable without JavaScript.

**Project Type**: static website, single Astro project at the repository root.

**Performance Goals**: the existing per-page budget on simulated mobile (LCP ≤ 2.5 s, CLS <
0.1, long tasks ≤ 200 ms, JS ≤ 10 KB, total ≤ 100 KB) for every blog template.

**Constraints**: WCAG 2.2 AA in both themes; no sideways scroll at 320 px; CSP unchanged (spec
FR-053: no edit to `security.csp` or the `_headers` policy, no `'unsafe-inline'`, zero
violations and no `style` attribute in highlighted code); only existing colours and fonts; post addresses without topic or date; no
redirects; $0 added running cost.

**Scale/Scope**: 4 page routes + 1 feed endpoint; ~16 new components; 1 new collection; 4 sample
posts; 22 build-error fixtures; 16 new visual baselines per platform plus 4 changed (home).

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 design (no change).*

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | Every layer is planned before code (R16): schema/unit tests for the post schema, topics, ordering and selection, reading time, build mode, Shiki transformer, share links and feed items; component tests for every new component; build tests for all 22 build-error rows, one-file publishing and production draft exclusion; E2E, axe and visual tests for each template. Tasks will order tests before implementation and require them to fail first. |
| **II. Automated Release Gate** | No gate is weakened. New templates join the existing `a11y`, `budget` and `visual` projects; the existing `verify` script is reused (no new script). A budget failure is fixed with smaller images, not a looser budget. |
| **III. Human Review for Major Changes** | **Major change: yes.** It changes the site navigation (section-wide current marker) and the Home page, adds two dependencies (`@astrojs/rss`, `satteri`), adds build configuration (`markdown.processor`, `shikiConfig`, `env.schema` in `astro.config.mjs`) and changes visual baselines. The PR carries the major-change label, auto-merge stays off, and Don approves after checking the preview. |
| **IV. First-Party Before Custom** | Per capability, first-party option → decision: collections + Zod → used (R1); topics → Zod enum in config (data collection considered, R2); drafts → `getCollection` filter + typed `astro:env` (`import.meta.env.PROD` falls short: true on preview and test builds, R3); pagination → `paginate()` (R4); reading time → Astro's documented Sätteri recipe, without its third-party `reading-time` package (R6); highlighting → built-in Shiki with `shikiConfig.theme`/`transformers` (the first-party CSP option `'unsafe-inline'` for style attributes falls short: it loosens the policy site-wide; Prism named as fallback, R7); copy button → Astro component script and a custom element, no framework island (R8); tables → MDX `components` override (R9); share → Web Share API + plain links, no third-party widget (R10); feed → `@astrojs/rss` (R11); images → `astro:assets` (R14); Cloudflare → static assets and Workers Builds variables, nothing new. Astro Docs MCP was available and each choice cites its page. |
| **V. Static by Default** | Every blog page and the feed are prerendered. The only client scripts are the copy button (post body) and the share button (post furniture), both bundled modules loaded after parse; everything reads without JS. No `/api/` code. |
| **VI. Content as Files** | One `.mdx` file per post; topics in one config file; invalid content fails the build naming the file (contracts/build-errors.md). |
| **VII. Private Data** | No personal data collected; share links carry only the post title and address. |
| **VIII. Cloudflare Best Practices** | Only static assets change; no Worker code, bindings or dashboard settings. Draft detection reads variables Workers Builds already sets. |
| **IX. Cost Ceiling** | Expected added monthly cost: **$0** (build-time packages only; static assets on the free plan, R17). |
| **X. Accessible, Fast and Private** | Axe (WCAG 2.2 AA) on every template in both themes at phone and desktop widths, without JS and with the menu open, including the states the default build cannot show (listing page N ≥ 2 on the fixture site; empty landing, all posts and topic pages from a production-mode build); topic colours chosen for AA and verified; no sideways scroll at 320 px; budget measured per template; no third-party scripts (share links are plain navigations). |
| **XI. Spec Kit Workflow** | Spec Kit branch `008-blog` and directory; shared files with the parallel portfolio and contact branches are listed below with the conflict plan. |

Development workflow: every Astro decision in research.md names its documentation page; site
copy is plain language.

## Project Structure

### Documentation (this feature)

```text
specs/008-blog/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── post-file.md     # what a post file contains
│   ├── build-errors.md  # every build failure for post files
│   ├── blog-pages.md    # addresses and page structure
│   └── feed.md          # the RSS feed
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source code (repository root)

```text
src/
├── config/
│   ├── blog.ts                      # NEW section name, counts, views note, feed text
│   ├── topics.ts                    # NEW controlled topic list
│   └── navigation.ts                # SHARED: drop "/writing/" from futureDestinations
├── content.config.ts                # SHARED: add `posts` collection
├── content/
│   ├── schemas/post.ts              # NEW postSchema({ image })
│   ├── posts/                       # NEW sample-*.mdx (drafts) + images/
│   └── pages/index.mdx              # SHARED: add <RecentWriting />
├── lib/
│   ├── build-mode.ts                # NEW includeDrafts(env)
│   ├── posts.ts                     # NEW getPosts(), getPostSummaries() (render cache)
│   ├── share.ts                     # NEW shareLinks()
│   ├── nav.ts                       # SHARED: add isInSection()
│   ├── markdown/
│   │   ├── reading-time.ts          # NEW Sätteri mdast plugin + readingMinutes()
│   │   ├── shiki-theme.ts           # NEW semantic placeholder theme
│   │   └── shiki-classes.ts         # NEW transformer: colours → classes, caption, no style
│   └── content/
│       ├── post-address.ts          # NEW slugFromPostPath(), assertPostFiles()
│       ├── post-order.ts            # NEW sort, selectLanding/Related/Recent
│       ├── body.ts                  # SHARED: optional error-label parameter
│       └── errors.ts                # SHARED: postFileError(), postFilesError()
├── components/
│   ├── post/                        # NEW PostCard, LeadStory, FeaturedGrid, CardGrid,
│   │                                #     TopicPill, TopicPillRow, TopicBanner, Pagination,
│   │                                #     PostMeta, PostHero, CodeBlock, ScrollTable, Share,
│   │                                #     ViewsNote, RelatedPosts, topic-styles.ts
│   ├── sections/RecentWriting.astro # NEW
│   ├── sections/index.ts, schemas.ts# SHARED: register RecentWriting
│   ├── page/DraftNotice.astro       # SHARED: optional `message` prop (post wording)
│   ├── SiteHeader.astro             # SHARED: section current marker
│   └── Seo.astro                    # SHARED: article published/modified times
├── layouts/
│   ├── PostLayout.astro             # NEW
│   └── BaseLayout.astro             # SHARED: named `head` slot (feed link)
├── pages/writing/
│   ├── index.astro                  # NEW landing
│   ├── all/[...page].astro          # NEW all posts
│   ├── topics/[topic]/[...page].astro # NEW topic pages
│   ├── [slug].astro                 # NEW post
│   └── rss.xml.ts                   # NEW feed
└── styles/global.css                # SHARED: appended code-card + hl-* block
astro.config.mjs                     # SHARED: markdown.processor, shikiConfig, env.schema
package.json, pnpm-lock.yaml         # SHARED: @astrojs/rss, satteri
docs/posts.md                        # NEW authoring guide (FR-034)
docs/design-source.md                # SHARED: mark Shiki, table-wrapper, ui-share rows done
tests/
├── unit/{content,markdown,site,…}/  # NEW + updated (navigation, csp, astro-config, build-env)
├── component/post/                  # NEW
├── build/                           # NEW post-validation, one-file-post, blog-listing; harness extended for posts
├── fixtures/posts/{valid,broken}/   # NEW
└── e2e/                             # NEW blog.spec.ts; SHARED templates.ts, visual.spec.ts
scripts/build-fixture-site.ts        # SHARED: add generated fixture posts for pagination
```

**Structure Decision**: follows the content structure fixed by feature 003 and recorded in
`docs/design-source.md` (`src/content/posts/`, `post.ts` beside `page.ts`,
`src/components/post/`, `PostLayout`, `src/pages/writing/`, checks in `src/lib/content/`, a posts
guide beside `docs/pages.md`).

## Shared files and parallel work

The portfolio (`projects`) and contact features are built in sibling worktrees and may reach
`main` first. Every change to a shared file is additive and local, so a rebase resolves by
keeping both sides:

| File | This feature's change | Likely overlap | Resolution |
|---|---|---|---|
| `src/content.config.ts` | add `posts` collection and its key in `collections` | portfolio adds `projects` | keep both collections and both keys |
| `src/config/navigation.ts` | remove `"/writing/"` from `futureDestinations` only | portfolio removes `"/projects/"`, contact `"/contact/"` | keep every removal |
| `src/lib/nav.ts`, `SiteHeader.astro` | `isInSection()`; `aria-current="true"` inside a section | portfolio needs the same for `/projects/` | whichever lands second reuses the first's function; one test covers both |
| `src/components/sections/index.ts`, `schemas.ts` | register `RecentWriting` | portfolio may register a projects section | keep both entries |
| `src/content/pages/index.mdx` | one line `<RecentWriting />` after the body | portfolio may add its own line | keep both lines; Don orders them |
| `src/components/Seo.astro`, `BaseLayout.astro` | optional props / named slot only | portfolio may add similar | merge props |
| `src/lib/content/body.ts`, `errors.ts` | optional parameter; new helpers | portfolio may add project helpers | keep both |
| `astro.config.mjs` | new `markdown` and `env` blocks; CSP untouched | contact adds Worker/API config, possibly CSP `connect-src`/`form-action` and Turnstile hosts | keep both; this plan does not touch `security.csp` |
| `package.json`, `pnpm-lock.yaml` | add `@astrojs/rss`, `satteri` | others add their packages | re-apply dependency lines, then regenerate the lockfile with `corepack pnpm install` (never hand-merge it) |
| `src/styles/global.css` | one appended block (code card, `hl-*`) at the end | others append their blocks | keep both blocks |
| `src/components/page/DraftNotice.astro` | optional `message` prop; default wording unchanged | portfolio may reuse it for projects | keep both props |
| `tests/e2e/templates.ts`, `visual.spec.ts`, `budget.spec.ts` | new template rows, snapshot loop, fixture-site listing budget case | others add theirs | keep all rows and cases; regenerate baselines after the rebase |
| `playwright.config.ts` | at most a `sections` `testMatch` extension and a fixture-backed budget entry (new blog a11y specs match the existing `a11y` project by name) | others may add projects or servers | keep both sides; never change existing servers or thresholds |
| `scripts/build-fixture-site.ts`, `tests/build/fixture-site.ts` | generated fixture posts; harness options for post files, env variables and text replacement | portfolio may add project fixtures | keep both; each feature's options stay independent |
| `tests/unit/site/astro-config.test.ts`, `csp.test.ts`, `headers.test.ts`, `tests/component/BaseLayout.test.ts`, `DraftNotice.test.ts` | added cases only | contact may change the CSP assertions for its hosts | keep both; if `main` changes the CSP, this feature's "unchanged" guard compares against `main`'s policy after the rebase |
| `docs/design-source.md` | mark three Blog rows done | portfolio marks its rows | keep both |

Before the PR, the branch is rebased onto the latest `main`, the full gate is rerun, and the
visual baselines are regenerated if `main` changed any shared page.

## Visual baselines

Snapshots taken from a non-production build, so the sample drafts appear.

- **Changes appearance**: `home` (phone and desktop, dark and light: 4 per platform), because
  "Recent writing" is added.
- **New**: `writing-landing`, `writing-all`, `writing-topic` (one topic page) and `writing-post`
  (the richest sample post), each full page at phone and desktop in dark and light: 16 per
  platform. Code blocks show the Copy button (scripts on); dates and reading time are fixed by
  the sample files, so the images are stable.
- **Unchanged (must not diff)**: `header` and `menu-open` (taken on `/`, where "Writing" is not
  current), `footer`, `not-found`, `about`, `sections`. The only header change is on blog pages,
  which the new full-page snapshots cover.

The tasks phase must include a baseline task that refreshes both macOS
(`test:visual:update`) and Linux (`test:visual:update:linux`, Docker; CI label fallback) images
for exactly these 20 snapshots per platform, after the pages match Direction A.

## Risks and open questions

- **Shiki transformer and Sätteri**: the plan relies on `shikiConfig.transformers` running in
  the Sätteri pipeline (seen in `@astrojs/markdown-satteri` 0.4.2) and on MDX `components.pre`
  receiving the highlighted `<pre>` (documented in its source). Both are proven by the first
  component and build tests; the documented fallbacks are Prism (class-based) or the attribute
  `'unsafe-inline'` CSP source, either needing a plan amendment.
- **Empty topic pages with `paginate()`**: if `paginate([])` returns no path, the route adds the
  empty first page itself (R4); covered by a build test.
- **Budget on the landing page**: several card images; mitigated by small sample images, lazy
  loading and responsive sizes (R16).
- **Budget on a full listing page** (spec FR-041): the four sample posts cannot fill a
  12-card page, so the budget check also measures `/writing/all/` on the fixture site, whose
  generated posts carry small feature images; the tasks phase must add that measurement.
- **Drafts outside Workers Builds**: a production build made elsewhere would include drafts;
  production only deploys from Workers Builds on `main` (R3). Inside Workers Builds a missing
  branch variable fails safe to production (FR-046).
- **Impossible dates** (`2026-02-30`): whether the YAML parser rejects or rolls them over is
  proven by the first schema test; R1 names the fallback check.
- **"Views are my own" wording** is placeholder copy until Don provides his own (spec
  Assumptions).

## Complexity Tracking

No constitution violations. Custom code where a first-party option exists is limited to the
Shiki class transformer (the first-party CSP option loosens the policy site-wide) and the
reading-time word count (replacing a third-party package the recipe suggests); both are
explained in research R6 and R7.
