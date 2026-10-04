# Chore plan: content-derived-tests (issue #55)

Branch: `chore/content-derived-tests`, at `main` (fb9dd8e, after #54 merged).
Issue: https://github.com/drcdev/dcc-web/issues/55. The PR body says `Closes #55`.

## Goal

[#55](https://github.com/drcdev/dcc-web/issues/55): tests hard-code which real posts and
projects exist, which are published and what a story says. Publishing Flux, Tempo and Focus
Pocus in #54 meant editing six test files. This chore makes the tests read `src/content/**`
through one small shared helper. They apply the expectation that fits each entry: draft or
published, its title, its address, its topics, its stand-in link. Rules about content
("exactly four Options constraints", "a draft has a review comment", "every draft shows the
notice") stay, applied to whatever the content is. Fixture content (tests/fixtures/**, the
fixture-only posts and projects on the fixture site, inline strings in a test) keeps fixed
expectations. Publishing a project or post, or rewriting its copy, must never need a test
change. No page, component, style, script, schema or config of the site changes.

## Acceptance

Mechanical criteria, each checked by the review phase:

1. **No real-content literals in scope.** In the 22 in-scope files (list under Scope), this
   regex matches no line:
   `focus-pocus|drcdev-github-io|/projects/flux|"flux"|/projects/tempo|"tempo"|privacy/tempo|wayfinder|ghost-themes|starting-something-new|"Focus Pocus"|"Flux"|"Tempo"`
   (run with `grep -cE`). **Before: 88 matching lines in 21 of the 22 files** (blog.spec.ts holds 4
   constants that are used about 48 times; blog-pagination.spec.ts has 0 literals but
   hard-codes counts that include real posts). **After: 0.** The sample post
   `sample-everything` is test-owned (see Scope, category 4) and is not in the regex.
2. **Guard.** A new unit test, `tests/unit/content/no-real-content-in-tests.test.ts` (W13),
   computes needles from the content helper and fails if any file under `tests/e2e/`,
   `tests/build/` or `tests/unit/content/` names one. The needles are every real post and project
   address (`/writing/<slug>/`, `/projects/<slug>/`), `<slug>.mdx`, and every real post and
   project title as a quoted string literal. The sample post and fixture content are left out.
   **Why a guard:** the litmus is about future edits. Without a guard, the next story-specific
   assertion brings the #54 problem back unnoticed. The needles come from the content, so the
   guard needs no upkeep when content changes. Its pure matcher is unit-tested with a known-bad
   snippet, so it is seen to fail.
3. **Content-edit proof** (W14, scratch, never committed). On a scratch copy:
   - flip `draft` on one real project (`false` → `true`) and on one real post;
   - change one real project's `title` and `standIn.label`, and add a theme to it;
   - change one real post's `featured` flag.
   Then run `pnpm vitest run --project unit`, `pnpm run test:build:content`,
   `pnpm run build` and `playwright test --project=e2e --project=sections` against the touched
   pages' spec files (`seo`, `pages`, `projects*`, `blog*`, `not-found`, `headers`). Everything
   passes with no test edit. Revert, and check that `git status --porcelain src/` is empty. The
   implement summary records the commands and the results.
4. **Rules still checked** (the projects content unit test): exactly four Options constraints,
   at least three options, exactly one chosen, one fit per constraint for each option, at
   least two pictures with `problem` and `build` parts, an invitation that ends "tell me about
   it.", and a review comment if and only if the story is a draft. Each runs for every
   real project, from the content.
5. **Test counts.** `playwright test --list` may change only by the per-entry loops W4 to W7 add
   or the duplicates they remove. The implement summary records the before and after totals
   for each Playwright project, and `vitest run --project unit` / `--project build` file and
   test counts.
6. **Gates.** `pnpm run verify:quick` is green after every work item. The targeted vitest and
   Playwright files of each item are green. The full `pnpm run verify` is green before the PR
   (the orchestrator asks Don first, per the memory note).
7. **Scope of the diff.** `git diff --name-only main` lists only `tests/**`, `docs/testing.md`
   and `.specify/chores/content-derived-tests/**`. There is nothing under `src/`, `public/`,
   `scripts/`, `.github/` or `.claude/`, and `package.json`, `playwright.config.ts`,
   `vitest.config.ts` and `CLAUDE.md` are unchanged. No snapshot PNG changes.

## Scope

### The four ways an assertion is handled

1. **Computed from content.** The expectation is computed from `src/content/**` frontmatter
   through `tests/helpers/content.ts`.
2. **Rule over every entry.** The test checks the rule for each entry of a kind, for example
   "every draft shows the review notice".
3. **Moved to the fixture site.** The check moves to fixture content, which the test owns.
4. **Legitimately fixed.** The test owns the content (fixtures, inline strings), or the value
   is site configuration and not content.

### In scope (strict list, 22 files plus the helper and the guard)

| File | What changes | Category |
|---|---|---|
| `tests/unit/content/projects-content.test.ts` | `slugs` and `published` come from the helper; the Focus Pocus and Flux blocks become rules; the FR-082 check covers every project slug | 1, 2 |
| `tests/build/indexing.test.ts` | the sitemap list, the draft-sample case, the listing link and `isDraftPage` come from the helper and the build mode | 1, 2 |
| `tests/unit/ci/content-tier.test.ts` | the tier guard also flags any build test that imports the helper, and the `"/about/"` probe becomes "a listed file reads the helper" | coupled to W3 |
| `tests/e2e/seo.spec.ts` | the sitemap list and the post list come from the helper; the Focus Pocus SEO test becomes a rule for every story | 1, 2 |
| `tests/e2e/pages.spec.ts` | `PAGES` comes from the helper; the old-address redirect slugs come from the privacy pages; the story-200 check runs for every story; the duplicate sitemap test is removed (mapping in W4) | 1, 2 |
| `tests/e2e/projects.spec.ts` | the template checks run on a story the helper picks; the stand-in, draft-notice, invitation, title and transition checks become rules; the index and `?theme=` checks come from the helper | 1, 2 |
| `tests/e2e/projects-no-js.spec.ts` | picked story; link names come from its frontmatter | 1 |
| `tests/e2e/projects-motion.spec.ts` | picked story; transition name `project-<slug>` | 1 |
| `tests/e2e/projects-forced-colors.spec.ts` | picked story | 1 |
| `tests/e2e/a11y.spec.ts` (L466 only) | picked story | 1 |
| `tests/e2e/headers.spec.ts` (L35 only) | picked story | 1 |
| `tests/e2e/templates.ts` | `project-story` path comes from the helper's picked story (the `writing-post` row stays on the sample post) | 1 |
| `tests/e2e/blog.spec.ts` | the real-post constants are removed; landing, all-posts, topic, series, related, home, feed and marker expectations are computed from helper post summaries | 1, 2 |
| `tests/e2e/blog-forced-colors.spec.ts` | the series-tagged post the helper picks | 1 |
| `tests/e2e/blog.a11y.spec.ts` (L313, L330) | the series-tagged post the helper picks | 1 |
| `tests/e2e/not-found.spec.ts` (`BUILT_ADDRESSES`) | page addresses come from the helper | 1 |
| `tests/e2e/blog-fixtures.spec.ts` | the real posts' share of the fixture site's landing and topic lists is computed from the helper | 1 (fixture items stay fixed) |
| `tests/e2e/blog-pagination.spec.ts` | the page counts are computed from the helper (real posts) plus the fixture and generated posts | 1 |
| `tests/e2e/projects-fixtures.spec.ts` | `ALL` and the theme counts come from the helper (real plus fixture projects); the Focus Pocus stand-in test moves to `every-part` | 1, 3 |
| `tests/unit/content/sample-posts.test.ts` (L120 to L141) | real-post series tagging becomes a rule over every post | 2 |
| `tests/unit/content/project-address.test.ts`, `contact-link.test.ts`, `project-schema.test.ts` | inline example slugs and titles that happen to be real are renamed to neutral ones (`example-project`, "Example project"), so the guard needs no allowlist | 4 (test-owned, renamed) |
| new `tests/helpers/content.ts`, `tests/unit/content/content-helper.test.ts`, `tests/unit/content/no-real-content-in-tests.test.ts` | the helper, its unit test and the guard | — |
| `docs/testing.md` | a new "Real content in tests" subsection after "Where a test goes" | — |

### Out of scope (with the reason for each)

- `tests/component/**` (helpers.ts, ProjectRow, StoryHeader, ProjectPart, ProjectInvitation,
  OptionsTable, PartPicture, TitleTransition, HomeIntro): the props are inline strings the test
  owns (category 4). "Flux" in HomeIntro is the design theme, not the project.
- `tests/unit/site/redirects.test.ts` (tempo, focus-pocus privacy): it tests `public/_redirects`,
  which is site configuration and the source of truth for redirects (category 4).
- `tests/unit/site/nav.test.ts`: `/projects/focus-pocus/` is an example address for the pure
  `isCurrent` and `isInSection` functions, inline and test-owned (category 4).
- `tests/unit/site/design-source.test.ts`, `theme.test.ts`, `tests/reference/capture-ghost.spec.ts`,
  `tests/unit/setup/launch-doc.test.ts`: "Flux" here is the design theme and repository, not the
  project story.
- `tests/unit/ci/changed-paths.test.ts`: path literals used as examples for the CI path
  classifier (category 4). It is also not a content expectation.
- `tests/unit/setup-check/checks/launch-content-ready.test.ts`, `live-apex.test.ts`,
  `tests/unit/setup/docs-structure.test.ts`: inline fixtures or unrelated words.
- `tests/build/local-site.test.ts` L395 to L400: names only the sample post and fixture posts. The
  sample post is test-owned (next bullet).
- **The sample post `src/content/posts/sample-everything.mdx`**: the contract (FR-035,
  `sample-posts.test.ts`, docs/posts.md) keeps exactly one `sample-*.mdx` draft in the
  repository as the kitchen-sink post that the tests check. It is test-owned content (category 4).
  Checks of its body (code block, caption, table, wide images, update date) stay fixed. It is
  never "published" and its copy is not Don's writing. Every other place it is listed (sitemaps,
  listings) is computed, because it is a draft.
- Topic and series addresses and names (`src/config/topics.ts`, `blog.ts`), the `PRIMARY` nav and
  the `TEMPLATES` rows other than `project-story`: site configuration, not content. Tests that
  need them import the config, as they already do.
- `tests/build/{drafts,fixture-site,project-validation,blog-listing,post-validation,page-validation}.test.ts`,
  `tests/fixtures/**`, `blog-fixture.a11y.spec.ts`, `visual.spec.ts` and the fixture-only
  assertions in the fixture specs: the fixture content is owned by the tests.
- `tests/unit/content/post-schema.test.ts`: it imports `parseFrontmatter` the same way, but on
  fixture files. It could switch to the helper; that is left out to keep the diff small.

### Follow-ups for the PR body (not done here)

- **F1.** Build the fixture site from fixture content only (no copy of the real posts and
  projects). The fixture specs would then need no helper at all. This touches
  `scripts/build-fixture-site.ts`, the visual baselines and the budget, so it is a separate chore.
- **F2.** Move the projects story-template checks (layout, focus, progress bar) from the real
  story to the fixture `every-part` story in the `sections` project. That would cut e2e time on
  real content (issue #37).
- **F3.** `post-schema.test.ts` and other `parseFrontmatter` callers can use the helper.

## Design: the shared helper `tests/helpers/content.ts`

**First-party option considered:** Astro's `getCollection()` with a `draft` filter
(docs.astro.build/en/guides/content-collections/#filtering-collection-queries). It is the
right tool inside the site, and the site uses it (`src/lib/posts.ts`, `src/lib/projects.ts`).
Tests cannot use it, though: `astro:content` exists only in Astro's runtime, and neither the
Vitest `unit` project nor Playwright's collection step runs one. The next-best first-party
piece is Astro's own front matter parser, `parseFrontmatter` from
`@astrojs/internal-helpers/frontmatter`. The helper reuses it, resolved through Astro's
package exactly as `projects-content.test.ts` does today. No dependency is added (no
gray-matter, no yaml).

**Shape** (one module, no Vitest or Playwright imports, so both runners load it):

```ts
export interface Entry<D = Record<string, unknown>> {
  collection: "pages" | "posts" | "projects";
  slug: string;          // posts: slugFromPostPath; projects: slugFromPath; pages: idFromPath
  address: string;       // "/writing/<slug>/", "/projects/<slug>/", addressFromPath(...)
  draft: boolean;        // frontmatter.draft === true (schema default false)
  title: string;
  data: D;               // the parsed frontmatter, dates as Date
  body: string;          // the MDX after the front matter
  file: string;          // repository-relative path
}
export function readEntries(collection, dir?): Entry[]  // dir defaults to src/content/<collection>;
                                                         // fixture dirs can be passed (projects-fixtures)
export const pages: Entry[]; export const posts: Entry[]; export const projects: Entry[];
export const isSample = (post: Entry) => post.slug.startsWith("sample-");   // FR-035 sample
export const realPosts: Entry[];                         // posts without the sample
export function inBuild(entries, { production }): Entry[] // drafts out only when production;
                                                         // pages are always built (draft = noindex + notice)
export function sitemapPaths({ production }): string[]   // pages + /writing/, /writing/all/, /projects/
                                                         // + topicHref(each topic) + visible posts and projects
export function postSummary(entry)                       // { slug, title, date, updated, topics, featured, draft, href }
                                                         // in the shape src/lib/content/post-order.ts takes
export const pickedStory: Entry;                         // see below
export const seriesPost: Entry;                          // the newest real post whose topics include a series id
```

- **Reusing the site's own path rules.** `slugFromPostPath`, `slugFromPath`, `addressFromPath`
  and `idFromPath` (src/lib/content/) map files to addresses. The helper reuses them so the tests
  and the site cannot disagree on that mapping. Each has its own unit test
  (`post-address`, `project-address`, `address`). Files starting with `_` are skipped
  (`_template.mdx`, matching the loader's `!**/_*`), and so are `images/` folders.
- **Build modes.** `inBuild` and `sitemapPaths` take `{ production }`. The e2e server and the
  fixture site are local builds, so they include drafts (`includeDrafts` in
  `src/lib/build-mode.ts`, which the helper calls with the environment the test names).
  `tests/build/indexing.test.ts` builds both modes. It passes
  `production: isProductionBuild(env)` for each environment, so one function gives both
  expectations.
- **Loading synchronously.** Playwright's `test.describe` and `for` loops run at collection
  time, so the lists must exist when the module loads. The helper reads the files with
  `readFileSync` and loads `parseFrontmatter` with `createRequire(...)(path)`. Node 24 can
  `require()` an ES module that has no top-level await (Node docs, "Loading ECMAScript modules
  using require()"). If that fails under Playwright's loader, a top-level `await import(...)`
  also works, because `package.json` has `"type": "module"`. The W1 implementer records which
  one is used.
- **Imports.** Vitest files use `../../helpers/content.ts` and Playwright specs use
  `../helpers/content.ts`. The e2e specs already import `src/config/*` and `scripts/*` this way
  (`not-found.spec.ts`, `site-links.spec.ts`). `tsconfig.json` includes `**/*`, so the helper is
  type-checked and linted. No Vitest `include` glob matches it, so it is not run as a test.
- **Iterating at collection time (Playwright).** `for (const story of projects) test(...)`
  creates one test per entry with a unique title (Playwright "Parameterize tests"). Vitest
  keeps using `describe.each` and `it.each`.
- **The picked story.** `pickedStory` is the newest project in the e2e build (drafts included)
  that has a Build link (`source`, `demo` or `standIn`). It falls back to the newest project.
  If there is no project, it throws with a clear message rather than letting tests skip.
  Today it resolves to `drcdev-github-io` (2025-12-17). The template-level checks (layout,
  focus, progress bar, forced colours, headers, a11y, budget) need *a* story, not a
  particular one.

## Constitution Check

- **I. Test-First:** tests only. The helper gets its own unit test first (W1), and the guard is
  seen to fail on a known-bad snippet (W13). Every rewritten assertion keeps or widens its
  guarantee (the coverage mappings below).
- **II. Automated Release Gate:** no check is skipped, disabled or weakened. The sitemap test
  removed from `pages.spec.ts` is an exact duplicate of `seo.spec.ts` and `indexing.test.ts`,
  and its guarantee is mapped. The CI workflow is unchanged.
- **III. Human Review for Major Changes:** **none fire.**
  - No dependency is added, removed or replaced: `parseFrontmatter` ships with Astro and is
    already used by two tests.
  - Contact data is untouched.
  - No design, layout, navigation or visual change, and no baseline PNG change.
  - No cost.
  - CI, deployment and infrastructure configuration are unchanged: `.github/` and the
    `package.json` scripts stay as they are. `content-tier.test.ts` is a unit test of the
    content-only tier, not its configuration, and `test:build:content` still lists the same
    three files.
  - The constitution is not amended.
- **IV. First-Party Before Custom:** Astro's `getCollection` was considered and does not work
  outside Astro's runtime. The helper reuses Astro's own front matter parser and the site's
  path functions. Playwright's documented parameterised-test pattern and Vitest's `each`
  replace any custom test generation.
- **V. Static by Default:** no site change.
- **VI. Content as Files:** strengthened. Tests now read the files as the source of truth.
- **VII. Private Data:** no change.
- **VIII. Cloudflare Best Practices:** no change.
- **IX. Cost Ceiling:** no change. CI time changes slightly with per-entry loops (4 projects, 5
  posts); W14 records it.
- **X. Accessible, Fast and Private:** the a11y, budget and forced-colours checks stay. The
  picked story changes from Focus Pocus to the newest project with a Build link. W6 runs the
  `a11y` and `budget` projects to confirm that the new target passes. If it fails, that is a
  real finding on real content, so the implementer stops and reports it rather than tuning
  the test.
- **XI. Spec Kit Workflow:** a chore branch from `/chore`. The plan lives in
  `.specify/chores/content-derived-tests/`.
- **Development Workflow, test placement:** each item names its layer below. No behaviour
  gains a second layer. One duplicate (the sitemap in `pages.spec.ts`) is removed.

## Work items

Order: the helper first, then the six #54 files, then the sweep, the guard and the docs. Each
item leaves `verify:quick` green, along with its targeted files:
`run.sh 300 pnpm vitest run <files>` for unit tests,
`run.sh 900 pnpm run test:build:content` for build tests, and
`run.sh 900 pnpm exec playwright test <files> --project=<p>` after `pnpm run build` for e2e.

### W1. The content helper and its unit test (Done: `require()` of the ES module works under both Vitest and Playwright)

- **Files:** new `tests/helpers/content.ts`, new `tests/unit/content/content-helper.test.ts`.
- **Test:** new-first, **unit layer** (it reads files and builds nothing). The test is written
  before the helper and seen to fail on the missing module. It checks:
  - every `.mdx` under `src/content/{pages,posts,projects}` (not `_*`, not `images/`) appears
    exactly once;
  - `draft` matches the file's `draft:` line for each entry;
  - addresses: `/writing/<slug>/`, `/projects/<slug>/`, and `/privacy/<x>/` for nested pages;
  - `inBuild({ production: true })` leaves out exactly the draft posts and projects and keeps
    every page;
  - `sitemapPaths` holds every topic page from `topicHref`;
  - `isSample` matches only `sample-*`;
  - `readEntries("projects", "tests/fixtures/projects")` reads the four fixtures and skips
    `broken/`;
  - `pickedStory` has a Build link;
  - `seriesPost` has a series id among its topics.
  The test asserts the helper's behaviour against the files, never against today's slugs.
- **Coverage mapping:** none removed.

### W2. Projects content unit test (Done: no false positives on any slug; FR-082 and fit rules run per project)

- **Files:** `tests/unit/content/projects-content.test.ts`.
- **Test:** existing, rewritten, **unit layer**. Seen to pass before and after; the proof that
  it is content-independent is W14.
- **Changes:** `describe.each(projects)` (from the helper) replaces `slugs`. `published`
  is removed, and the draft test reads `entry.draft`. The local `parseFrontmatter` import moves
  to the helper. The "keeps the template beside" test stays (the template is the writer's file;
  the helper skips it).

| Removed or rewritten assertion | Where the guarantee lives now |
|---|---|
| `published` list equals the four slugs | Draft test: `frontmatter.draft === entry.draft`, and the review comment is present if and only if `draft` (rule, every project) |
| Focus Pocus chooses "JXA behind an MCP server" | Rule "exactly one chosen option" (already in `describe.each`). Which option is chosen is copy, so it is not asserted. |
| Focus Pocus `packing-list` picture has no part | A picture with no part is valid: `project-schema.test.ts` (schema rule) and `PartPicture` component tests. The real-file check is dropped as copy. |
| Focus Pocus `standIn.href` is `https://drc.dev/projects/focus-pocus` | Schema (`standIn.href` is https, `project-schema.test.ts`). The link's rendering uses whatever href each story has: W5 rule in `projects.spec.ts` |
| Flux constraint labels and option fits | New rule for every project: each option has exactly one fit per constraint, each fit is `yes`, `partly` or `no`, and constraint labels are non-empty and distinct. The existing rule (4 constraints, at least 3 options, exactly 1 chosen) stays. |
| FR-082: no site code names `focus-pocus` | Rule for every project slug: no file under `src/{components,layouts,pages,lib,styles}` or `astro.config.mjs` contains the slug as a quoted literal (`["'\`]<slug>["'\`]`) or as `/projects/<slug>`. The implementer checks for false positives on `flux` (the design theme appears in comments, not as a quoted slug) and records the result. |

### W3. Indexing build test and the content-tier guard (Done: local-site names about/index.html and indexing imports the helper, so the probe is "reads the helper or names an entry file", project-template exempt)

- **Files:** `tests/build/indexing.test.ts`, `tests/unit/ci/content-tier.test.ts`.
- **Test:** existing, rewritten, **build layer** (the sitemap and listing are cross-page output
  that only the real build shows). `content-tier.test.ts` is a **unit test over config**.
- **Changes:**
  - The `expected` sitemap list becomes `sitemapPaths({ production: isProductionBuild(env) })`.
    The fixed `pages`, `realPosts`, `samplePosts` and `realProjects` lists go.
  - The draft case becomes a rule `it.each` over `inBuild(posts ∪ projects)` drafts. In
    production, no file exists under the draft's address and no listing links to it. Elsewhere,
    the page has the draft notice and noindex, and its listing has `data-draft-label`. If the
    content has no drafts, the case asserts that `posts.filter(isSample)` still exists. The
    sample post is a draft by contract, so the rule always has at least one subject.
  - In production, the listing must link to every published post (`realPosts` filtered to
    `!draft`), not to the Wayfinder post by name.
  - `isDraftPage` uses `pages` from the helper instead of a regex on the file.
  - **content-tier:** the tier exists because the content-only CI tier runs only the build tests
    that read real content. A build test that reads content through the helper names no slug, so
    the literal scan would miss it. Changes:
    - the "no build test outside `test:build:content` names a real content entry" check also
      fails when such a file imports `helpers/content`;
    - the `"/about/"` probe becomes "every listed file except `project-template` imports the
      helper or names `/about/`". The implementer picks the form that stays true for the three
      listed files and records it.
  - `package.json` is unchanged.
- **Coverage mapping:**

| Removed or rewritten | Now |
|---|---|
| `realPosts`, `realProjects`, `samplePosts` lists and the per-env switch | `sitemapPaths` per env, computed from `draft` and the build mode. The same exact-equality assertion. |
| `listing` contains the Wayfinder href | `listing` contains every published post's href (stronger) |
| `writing/sample-everything/index.html` handling | Rule over every draft post and project (stronger: projects too) |

### W4. SEO and pages e2e specs (Done: every page, contact included, passes the h1-is-title rule; the pages sitemap duplicate is removed after the cookie-policy assertion landed in seo.spec)

- **Files:** `tests/e2e/seo.spec.ts`, `tests/e2e/pages.spec.ts`.
- **Test:** existing, rewritten, **e2e layer** (served responses, head metadata and the DOM
  through `wrangler dev`).
- **seo.spec:**
  - the sitemap list becomes `sitemapPaths({ production: false })`;
  - `POSTS`, `TOPIC_PAGES` and `SERIES_PAGES` are removed (the helper gives them);
  - the Focus Pocus story test becomes a loop over `projects`. For each story: the title contains
    `entry.title`; the canonical is `${origin}${entry.address}`; the description equals
    `entry.data.description` (the implementer checks the exact source the template uses and
    asserts that); it is in the sitemap; `expectSharedMetadata` passes; `og:image` is `og-default`
    when `entry.data.image` is unset and is not when it is set.
- **pages.spec:**
  - `PAGES` becomes `pages.map((p) => [p.address, p.title, p.draft])`. The implementer confirms
    that the h1 is the page title for every page, `contact` included. If one page differs by
    design, it is excluded with a comment naming why, not by its slug.
  - The redirect loop iterates the pages under `privacy/` (each app privacy page keeps its
    first-drc.dev address as a 301; `public/_redirects`).
  - `"/projects/focus-pocus/"` 200 becomes every project address.
  - The sitemap test is **removed**.
- **Coverage mapping:**

| Removed or rewritten | Now |
|---|---|
| seo.spec hard-coded sitemap list | Computed list, same exact equality |
| seo.spec Focus Pocus title, canonical, description and og-default | The same checks for every story (stronger) |
| pages.spec sitemap exact list | **Duplicate** of seo.spec "the sitemap lists exactly the built public pages" (same server, same exact equality) and of indexing.test.ts "preview branch". The not-found and cookie-policy exclusions live in seo.spec (`/404`) and pages.spec `NOT_BUILT` (404 status). The implementer adds a `/cookie-policy/` not-in-sitemap assertion to seo.spec so nothing is lost. |
| `PAGES` draft flags | Computed from frontmatter, with the same notice assertion |
| redirect slugs `["tempo"]` | Every page under `privacy/` |

### W5. Projects e2e spec (Done: stand-in and draft-notice rules run per project in loops; the contact click-through stays on pickedStory)

- **Files:** `tests/e2e/projects.spec.ts`.
- **Test:** existing, rewritten, **e2e layer** (browser layout, focus, scrolling and the DOM).
- **Changes:**
  - `STORY` becomes `pickedStory.address`. The template tests (four parts, FR-004, FR-003,
    FR-005, table region, invitation order, progress bar, FR-027 focus) run on it unchanged
    except for titles: "the Focus Pocus story" becomes "a project story (template)".
  - The h1 is `pickedStory.title`.
  - **Rule loop over `projects`**, one test each, cheap. For each story:
    - the h1 is `title`;
    - a draft notice appears if and only if `draft`;
    - the invitation href is `/contact/?project=<slug>`;
    - the `h1` has view-transition name `project-<slug>`.
    The rule tests read the DOM through `page.goto`. The click-through to the contact form stays
    on `pickedStory` only. It is a journey.
  - **Stand-in rule loop** over projects with `standIn`: a link named
    `standIn.label ?? \`${title} on drc.dev\`` (the default in `BuildLinks.astro`) with
    `href = standIn.href`, the text "This is not a live demo.", and no iframe.
  - **Index:** every project in the build has exactly one row whose `h2 a` links to its address.
    Clicking `pickedStory`'s row opens it.
  - **`?theme=`:** use the first theme of `pickedStory`, keyed with `themeKey` from
    `src/lib/content/themes.ts`. The expected number of rows is the count of projects whose themes
    include that key. The comment "Only Focus Pocus has the macOS theme" goes.
  - The comment at the old L222 goes.
- **Coverage mapping:**

| Removed or rewritten | Now |
|---|---|
| "has a stand-in link, no draft notice" on Focus Pocus | Stand-in rule for every project with `standIn`, and draft-notice rule for every project |
| Invitation href and "About: focus-pocus" | The rule loop gives the href for every story. The contact click-through stays on `pickedStory`. |
| `?theme=macos` shows 1 row | Computed count for `pickedStory`'s first theme |
| Index has a Focus Pocus row | Every project in the build has a row |

### W6. Picked story and post: no-JS, motion, forced colours, a11y, headers, templates (Done: a11y and budget pass on the picked story, drcdev-github-io; no-JS stand-in and source links are asserted only when the front matter declares them)

- **Files:**
  - `tests/e2e/templates.ts` (the `project-story` row);
  - `projects-no-js.spec.ts` and `projects-motion.spec.ts`;
  - `projects-forced-colors.spec.ts`;
  - `a11y.spec.ts` L466 and `headers.spec.ts` L35 (one-line swaps).
- **Test:** existing, **e2e layer**. The `a11y`, `budget` and `e2e` projects are unchanged in
  kind; only the target address is computed.
- **Changes:**
  - Every `/projects/focus-pocus/` becomes `pickedStory.address`.
  - The link names in no-JS become `standIn` label, `Source code for ${title}` and
    `Tell me about a problem like ${title}`. Each is asserted only when the picked story has that
    field. `pickedStory` is chosen to have a Build link, and the implementer makes the test
    require whichever links that story's frontmatter declares.
  - The row click-through in no-JS uses `pickedStory.title`.
  - motion: `project-${pickedStory.slug}` and `[data-project="${slug}"]`.
- **Run:** `--project=e2e` on the changed specs, `--project=a11y`, and `test:budget`. Record
  whether the budget passes on the new picked story. If it fails, stop and report per
  Principle X (do not loosen the budget).
- **Coverage mapping:** the same checks on a computed story. Nothing is removed.

### W7. Blog e2e spec, part 1: post page, landing, all posts, topic page (Done: the four real-post constants stay declared until W8 rewrites the blocks that still use them)

- **Files:** `tests/e2e/blog.spec.ts`. Only the describe blocks "post page", "landing page",
  "all posts page" and "topic page" change.
- **Test:** existing, rewritten, **e2e layer**.
- **Changes:**
  - Remove `WAYFINDER`, `FOCUS_POCUS`, `GHOST_THEMES` and `STARTING`. `POST` (the sample) stays.
  - `PLAIN_POST` is the newest post without `updated`. If none exists, it throws.
  - Landing: `expect(lead)` and the `featured` and `latest` lists equal
    `selectLanding(inBuild(posts).map(postSummary))`, mapped to hrefs. The "no post twice" rule
    assertions stay.
  - All posts: `sortNewestFirst` over every post. The "no pagination" assertion becomes
    conditional on `posts.length <= blog.pageSize`, which is config. Pagination itself is
    tested on the fixture site.
  - Topic page `TOPIC`: posts whose `topics` include the topic id, newest first.
- **Why the site's pure functions compute expectations:** `post-order.ts` is pure and has its
  own unit test (`tests/unit/content/post-order.test.ts`). The e2e's job is to show that the
  page renders the selection for the real content, not to re-derive the rule a second way. That
  is the "one primary layer" rule. The fixture-site spec keeps fixed expectations for the
  selection rule on owned content.
- **Coverage mapping:**

| Removed or rewritten | Now |
|---|---|
| `featured == [WAYFINDER, FOCUS_POCUS, STARTING]`, `latest == [GHOST_THEMES]` | Equals `selectLanding` over the build's posts. The rule is unit-tested in `post-order.test.ts` and fixed-data tested in blog-fixtures. |
| All posts list order | `sortNewestFirst`, same exact equality |
| Topic list `[WAYFINDER, STARTING]` | Computed per topic, same exact equality |

### W8. Blog e2e spec, part 2: related, feed, home, series, markers (Done: the four real-post constants are deleted; the topic-page marker case picks a non-series topic that a series post shares)

- **Files:** `tests/e2e/blog.spec.ts` (the remaining blocks).
- **Test:** existing, rewritten, **e2e layer**.
- **Changes:**
  - Related: `selectRelated(postSummary(POST), all)`.
  - Feed head check: the `seriesPost` address in place of `WAYFINDER`.
  - Home recent: `selectRecent`.
  - Series pages table: `posts` for each `seriesIds` entry are the posts tagged with it, newest
    first. `other` and `otherPath` stay (config).
  - Markers: `seriesPost` for the "tagged post" cases. The tagged set in the related-posts check
    is computed from topics.
- **Coverage mapping:** the same exact-equality assertions with computed lists. Nothing
  removed.

### W9. Fixture-site blog specs

- **Files:** `tests/e2e/blog-fixtures.spec.ts`, `tests/e2e/blog-pagination.spec.ts`.
- **Test:** existing, rewritten, **e2e layer** (`sections` project, port 4322).
- **Changes:** the fixture site's posts are the real posts (from the helper, drafts included),
  plus `FIXTURE_POSTS` (`readEntries("posts", "tests/fixtures/posts/valid")` filtered to the
  three names exported by `scripts/build-fixture-site.ts`), plus `generateFixturePosts()`
  (already exported).
  - The landing featured and latest lists come from `selectLanding` over that union. The fixed
    assertions on fixture items stay: the lead is `every-part`, `fixture-post-01` is featured,
    and `LONG_TITLE` and `TEXT_ONLY` lead Latest. The `main a[href=STARTING|FOCUS_POCUS]` absence
    becomes "no post outside lead, featured and latest is linked in those grids".
  - The technology-teams topic list is computed.
  - Pagination: the page-1 count stays 12 (`blog.pageSize`). The page-2 count is `total - 12`,
    and the test asserts `total > 12` so that page 2 exists. The header comment drops the "21"
    and "15" counts.
- **Coverage mapping:** the fixed fixture-item assertions are kept. The real-post contributions
  are computed. Nothing removed.

### W10. Fixture-site projects spec

- **Files:** `tests/e2e/projects-fixtures.spec.ts`.
- **Test:** existing, rewritten, **e2e layer** (`sections`).
- **Changes:**
  - `ALL = projects.length + readEntries("projects", "tests/fixtures/projects").length`. The
    fixture site is not a production build, so drafts count.
  - The Tooling counts (`2`) become the count of projects in that union whose themes key to
    `tooling`. The status text is built from that count.
  - "Theme variants collapse to one button" stays as is (count 1 per key).
  - "A stand-in story (Focus Pocus)" moves to `/projects/every-part/` (a fixture with
    `standIn`), with the link named "Every part stand-in" (category 3).
- **Coverage mapping:**

| Removed or rewritten | Now |
|---|---|
| `ALL = 8` | Computed |
| Tooling count 2 | Computed |
| Focus Pocus stand-in on the fixture site | `every-part` stand-in on the fixture site, plus W5's stand-in rule on every real story |

### W11. Sample posts series rule and not-found built addresses

- **Files:** `tests/unit/content/sample-posts.test.ts` (L120 to L141), `tests/e2e/not-found.spec.ts`.
- **Test:** existing, rewritten. sample-posts is **unit layer**; not-found is **e2e layer**
  (status codes from the server).
- **Changes:**
  - The `it.each` of four real slugs becomes a rule over every non-sample post: if its topics
    include a series id, that id comes first and the post has only one series (FR-005). The
    implementer checks the FR-005 wording in the topic config comments and matches it.
  - "Leaves sample-everything out of both series" stays (test-owned sample).
  - `BUILT_ADDRESSES` becomes `[...pages.map((p) => p.address), "/robots.txt"]`. `/contact/` is a
    page.
- **Coverage mapping:** the per-post series ids for the four real posts are replaced by the
  FR-005 rule for every post. Which series a post is in is copy. Correct series listings are
  still checked by W8's series-page test.

### W12. Neutral inline examples in unit content tests

- **Files:** `tests/unit/content/project-address.test.ts`, `contact-link.test.ts`,
  `project-schema.test.ts`.
- **Test:** existing, **unit layer**. `no behaviour: n/a (renaming test-owned example strings)`.
- **Changes:** use `example-project` and "Example project" (and `https://github.com/drcdev/example-project`)
  where these files use a real slug or title as an example. The invalid-name cases
  (`focus pocus.mdx`, `focus_pocus.mdx`, `Focus.mdx`) become `example project.mdx`,
  `example_project.mdx` and `Example.mdx`.
- **Coverage mapping:** identical assertions, different example strings.

### W13. The guard

- **Files:** new `tests/unit/content/no-real-content-in-tests.test.ts`.
- **Test:** new, **unit layer** (it reads files and builds nothing). It exports or defines a
  pure `realContentNeedles()` (from the helper: `realPosts` and `projects`) and
  `findNeedles(text, needles)`. Two cases:
  - **(a)** `findNeedles` flags a known-bad snippet built at runtime from the needles (for
    example `` `"/projects/${projects[0].slug}/"` ``), so the guard is seen to fail without
    hard-coding a slug;
  - **(b)** no file under `tests/e2e/`, `tests/build/` or `tests/unit/content/` matches. The
    guard file and the helper are excluded, because they build needles.
  The message names the file, the needle, and the fix (use `tests/helpers/content.ts`). It
  contains no `.claude/`, `.specify/`, `specs/` or `CLAUDE.md` literal (the changed-paths drift
  guard).
- **Coverage mapping:** none removed.

### W14. Docs and the content-edit proof

- **Files:** `docs/testing.md`.
- **Test:** `no behaviour: n/a (docs)`. The existing docs tests (`docs-structure`,
  `pipeline-test-placement`) stay green. The "Where a test goes" bullets stay byte-identical.
- **Changes:** a new `### Real content in tests` subsection directly after "Where a test goes".
  It says:
  - tests read `src/content/**` through `tests/helpers/content.ts`;
  - expectations are computed from the frontmatter and build mode, or written as rules over
    every entry;
  - only fixture content and the FR-035 sample post may be named;
  - the guard enforces this;
  - a build test that imports the helper belongs in `test:build:content`.
- **Proof:** run Acceptance 3 (scratch edits, run, revert) and the count in Acceptance 1, and
  record both in the implement summary.

## Docs citations (Principle IV)

- Astro, filtering collection queries by `draft` (the site's rule, which the helper mirrors
  because `astro:content` is not available outside Astro):
  https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries and
  https://docs.astro.build/en/reference/modules/astro-content/#getcollection (found through the
  Astro Docs MCP, 2026-10-03).
- Playwright, parameterised tests (a `for` loop over data at collection time, one titled test
  per item): https://playwright.dev/docs/test-parameterize.
- Vitest, `describe.each` and `it.each` (already used in this repository):
  https://vitest.dev/api/#describe-each.
- Node.js, `require()` of an ES module without top-level await (Node 24):
  https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require.

## Risks

- **`@astrojs/internal-helpers/frontmatter` is internal.** An Astro upgrade could move it.
  Two tests already depend on it. Keeping it in one helper makes the upgrade fix one line.
- **Playwright loading the helper.** If `require(esm)` or the internal-helpers import fails
  under Playwright's transform, use top-level `await import`. W1 runs one Playwright spec that
  imports the helper (`--list` is enough) before any other item depends on it.
- **The picked story changes the a11y and budget target** (Focus Pocus becomes
  drcdev-github-io). A failure there is a real-content finding. Stop and report it, and do not
  tune the test. Fallback, if Don prefers: keep the pick stable by choosing the project with the
  most pictures. The implementer notes this in the summary only if it is needed.
- **Computing expectations with the site's pure functions** (`selectLanding`, path helpers)
  could hide a bug in those functions from the e2e. They have their own unit tests, and the
  fixture-site specs keep fixed-data checks of the selection rules, so a bug is still caught
  once.
- **content-tier coupling.** If W3 forgets the content-tier update, the content-only CI tier
  silently stops running indexing for content PRs. W3 bundles both files, and the guard's
  import check covers it.
- **Parallel worktrees on port 4321** (memory). Rerun e2e when idle before treating a mass
  ECONNREFUSED as a failure.
- **No `[PREVIEW-CHECK]` items.** Everything is verifiable locally.
