# Testing: layers, placement and where each rule is proven

`pnpm run verify` is the gate for every PR and every push to `main`. This page says what each
layer of the gate is for, where a new test goes, where every build-error row of the content
contracts is asserted today, and how many Astro builds the `build` Vitest project may run.
It came out of [issue #26](https://github.com/drcdev/dcc-web/issues/26) (phases 1 and 2); the
numbers are the budget that the build project is held to. CI runs the same scripts split
across parallel jobs (see "CI jobs"); phase 3 of #26 added that. Phase 4 added a content-only
tier for changes that touch nothing but content files, and `pnpm run verify:quick` for the
inner loop (see "Change tiers" and "Inner loop: `verify:quick`"). Phase 6 recorded the final
gate times (see "Measured gate times").

## Layers

| Layer | Tool and command | What only it can show | Depth | Verdict |
|---|---|---|---|---|
| secretlint, lint, typecheck | `pnpm run lint:secrets`, `pnpm run lint`, `pnpm run typecheck` | Leaked secrets, lint errors, type drift | Whole repository | Keep. Cheap. |
| Unit and schema | `pnpm run test:unit`, Vitest `unit` project, `tests/unit/**` | Logic and content schemas in isolation: does this input produce this message | Rule by rule, milliseconds per case | Keep. This is where rule-by-rule depth belongs. |
| Component | `pnpm run test:unit`, Vitest `unit` project, `tests/component/**` | One Astro component rendered through the container API | One component per file | Keep. |
| Build, `sync` | `pnpm run test:build`, Vitest `build` project, `buildFixtureSite(..., { mode: "sync" })` | That Astro runs a `src/content.config.ts` call site (collection schema, glob loader `generateId`) on real files and names the file in the error. About a second per run. | One broken file per run | Keep. Preferred over `build` wherever no HTML is read. |
| Build, `build` | `pnpm run test:build`, Vitest `build` project, `buildFixtureSite(...)` (default mode) | What the real build does: route generation, `getStaticPaths()` checks, render-time component checks, Astro's own errors (body image import), draft exclusion per environment, CSP and indexing output, code highlighting, cross-page output. Tens of seconds per run. | One build per fixture set, many assertions read from it | Thin to what only a build can show. |
| Worker integration | `pnpm run test:worker`, `vitest-pool-workers` | The contact API against local D1 | Per endpoint | Keep. |
| Real `astro build` | `tests/build/indexing.test.ts`, which runs `astro build` on the repository's own content in the main-branch and preview environments, plus `pnpm run build`, which runs in the `e2e` job in CI and in the local `verify` script. `indexing.test.ts` also runs on content-only changes, through `pnpm run test:build:content`. | That the real site builds and that its sitemap, robots and headers match the environment | Two environments | Keep. |
| E2E | Playwright `e2e` and sibling projects, `pnpm run test:e2e` locally and `pnpm run test:e2e:parallel` in CI | Journeys in a real browser: navigation, theme, menu, contact submission, not-found, behaviour without JavaScript, layout geometry per template at 320, 390 and 1280 px (no sideways scroll, no element wider than the viewport, header and footer clear of the main content), the theme token each key component resolves to in both themes (`theme-tokens.spec.ts`) | Journeys, plus the template matrix | Keep journeys; review matrices (#40). |
| Accessibility | Playwright `a11y` projects (axe), `pnpm run test:e2e` locally and `pnpm run test:e2e:parallel` in CI | WCAG 2.2 AA per template, both widths, both themes | Full template matrix | Keep (Principle X). |
| Visual | Playwright `visual` project, `pnpm run test:e2e` locally and `pnpm run test:e2e:parallel` in CI | Pixel baselines of the design system: the shell (header, footer, open mobile menu), the not-found page, and on the fixture site the sections page, the post and story templates, the listing cards, the lead story, a series banner, four projects index rows (shipped, experiment, draft and in progress) and the contact form. Never real content. | Per platform | Keep, blocking. A diff is a design-system change (Principle III). Real-content shots removed in #40 phase 1; fixture template shots added in phase 2; see "Visual coverage". |
| Budget | Playwright `budget` project, `pnpm run test:budget` | LCP, CLS, long tasks and bytes under throttling | Per template, own invocation with one worker (`pnpm run test:budget`) | Keep. Slow by design. |
| Preview site-check | `scripts/site-check`, run against the preview deployment | Sitemap and links on the deployed preview | Once per PR; the crawl runs in the `e2e` job on pull requests | Keep. |

## CI jobs

`.github/workflows/ci.yml` runs the layers above as parallel jobs. Each job installs its own
dependencies, and the `verify` job is the one check that branch protection requires.

| Job | Scripts | When it runs |
|---|---|---|
| `changes` | `node scripts/ci/changed-paths.ts` | Always. Decides the tier: skip-safe, content-only or full, and writes the outputs `full` and `content_only`. |
| `static` | `pnpm run lint:secrets`, then `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit`, `pnpm run test:worker` | Always. On a skip-safe change only secretlint runs. |
| `build-tests` | `pnpm run test:build`; on a content-only change `pnpm run test:build:content` instead | Unless the change is skip-safe. |
| `e2e` | `pnpm run build`, `pnpm run test:e2e:parallel`, `pnpm run test:budget`, and on pull requests `node scripts/site-check/preview.ts` | Unless the change is skip-safe. |
| `verify` | `node scripts/ci/verify-needs.ts` | Always, after the others finish. |

- A new script, or a new Playwright or Vitest project, must be added to one of these jobs. The
  config tests (the per-layer script and project-coverage guards and the workflow tests) fail
  when a project runs in no job.
- Playwright runs at 4 workers in CI (`playwright.config.ts`). The budget project runs on its
  own, after the parallel projects, at one worker (`test:budget` passes `--workers=1`),
  because it measures timing and would be skewed by sibling tests competing for the CPU.
- The `verify` job passes when every job succeeded, or when `build-tests` and `e2e` were
  skipped on a skip-safe change. A failed, cancelled or unexpectedly skipped job fails it. On a
  content-only change `build-tests` runs and must succeed; only the skip-safe tier skips jobs.

### Change tiers

`scripts/ci/changed-paths.ts` sorts each pull request into one of three tiers and writes two
outputs, `full` and `content_only`. A push to `main` and a missing or empty diff are full; otherwise the first matching row wins.

| Tier | What counts | What runs | What is skipped |
|---|---|---|---|
| Skip-safe | Every changed file is on the skip-safe allowlist: `.md`, `.yml`, `.yaml`, `.json`, `.sh`, `.py` and `.ps1` files under `.claude/`, `.specify/` and `specs/`, except the files a test or check reads (the four pipeline `SKILL.md` files, `setup-walkthrough`'s `SKILL.md`, `CLAUDE.md` and the constitution). `full=false`. | secretlint only (`static`) and `verify` | `build-tests` and `e2e`, and the lint, type-check and unit steps of `static` |
| Content-only | Every changed file is either skip-safe or an `.mdx` file or an image or video file under `src/content/pages`, `src/content/posts` or `src/content/projects`. `.md` files, schemas, `src/content.config.ts` and `public/` are not content-only. `full=true`, `content_only=true`. | The whole gate, except that `build-tests` runs `pnpm run test:build:content` (`indexing.test.ts`, `local-site.test.ts` and `project-template.test.ts`, the build files that read real content by name) | The other build files (listed below) |
| Full | Everything else, every push to `main`, an empty diff, and any failure to compute the diff. `full=true`, `content_only=false`. | Every job and the whole `test:build` project | Nothing |

The rule fails closed: a path that is not positively recognised runs the full gate, and an
unset `content_only` runs the full `test:build`.

**Coverage on a content-only change.** Each skipped file, and where its guarantee lives:

| Skipped on content-only | Why the guarantee holds |
|---|---|
| `drafts.test.ts`, `blog-listing.test.ts`, `page-validation.test.ts`, `post-validation.test.ts`, `project-validation.test.ts` | They test the schema, loader, route and render machinery with fixture files. That machinery lives in `src/content/schemas/**`, `src/content.config.ts`, `src/lib/**`, components and pages. None of those is content-only, so a change to them runs the full gate. That the real content still builds is proven by `pnpm run build` in `e2e`, and the unit tests that read the real content files still run in `test:unit`. |
| `fixture-site.test.ts` | Harness tests (`tests/build/fixture-site.ts`, not content-only). Its sync of the real posts is covered by the real `pnpm run build` in `e2e`. |

`focus-pocus.test.ts` moved from `tests/build/` to `tests/unit/content/` in phase 4. It never
ran a build, so it runs in `test:unit` on every non-skip-safe change.

The build tests that read real content by name are the ones listed in `test:build:content`.
`tests/unit/ci/content-tier.test.ts` fails when `test:build:content` names a missing file, or
when a build test outside that list names a real content entry. A dynamic read, such as
`realPostNames` in `fixture-site.test.ts`, escapes the guard; it is harness-only. A real-content
build assertion belongs in a file listed in `test:build:content`.

Residual risk: fixture builds copy the real `src/`, so the real pages and projects are present
in them. A content edit whose text collides with a fixture assertion's string would show only
on the push run on `main`, which always runs the full gate. That is a test-isolation flaw to
fix, not a gap in the gate. One known case: `drafts.test.ts` reads the home page built from the
real `src/content/pages/index.mdx` (its `<RecentWriting />` assertions, "mentions no draft ... home
page" and "leaves the Recent writing section off the home page"), so a literal collision in that
file would show only on the `main` push run.

## Inner loop: `verify:quick`

`pnpm run verify:quick` is the check to run after a change while working. It runs
`lint:secrets`, `lint`, `typecheck`, `test:unit`, `test:worker` and `build`, and takes about
33 s locally. It leaves out the `build` Vitest project and every Playwright project (E2E,
accessibility, visual and budget). The implement and fix subagents of the pipelines run it
after a change. It never replaces the gate: only the full `pnpm run verify` counts before a PR.

## Where a test goes

Every behaviour gets **one primary layer**: the cheapest layer that can observe it.

- E2E is for journeys and for anything only a browser can show.
- Build tests are for what only the real build shows: call-site wiring, Astro's own errors
  and output that spans pages.
- Accessibility and visual tests cover templates, not stories.
- A second layer needs a reason, written in the test's comment.

The constitution's Development Workflow makes this rule binding: every test task in the pipelines
names its layer and gives the reason for any second layer.

The test title or a comment carries the contract row id (`row 7`, `P13`), so a search for the
id finds the test.

### Real content in tests

Tests never name a real post or project. They read `src/content/**` through
`tests/helpers/content.ts`, so publishing a story, flipping a `draft` flag or rewriting a title
never needs a test edit.

- An expectation is computed from the frontmatter and the build mode (for example the sitemap
  and the listings), or written as a rule that runs over every entry of a kind (for example
  "every draft shows the review notice").
- A fixed literal is allowed only for content the test owns: the fixture site and fixture
  projects under `tests/fixtures/`, inline strings in a unit test (use neutral example data),
  and the FR-035 sample post, which is a draft by contract.
- `tests/unit/content/no-real-content-in-tests.test.ts` enforces this. It builds its needles from
  the content (every real post and project address, entry file name and quoted title) and fails
  when a file under `tests/e2e/`, `tests/build/` or `tests/unit/content/` contains one. It needs
  no upkeep when the content changes.
- A build test that imports the helper reads real content, so it belongs in
  `test:build:content` (the content-only CI tier). `tests/unit/ci/content-tier.test.ts` checks
  this.

### Visual coverage

The `visual` project snapshots the design system only: the shell (header, footer and the open
mobile menu), the not-found page and fixture subjects on the fixture site. The real-content
shots were removed in #40 phase 1, so a content edit cannot fail it. The geometry smoke test in
`tests/e2e/geometry.spec.ts`, the shell snapshots, the sections fixture snapshot, the `a11y`
contrast checks and the existing e2e and build content tests took over what each one guarded.
Phase 2 added element shots of the fixture post and story templates, the listing cards, the
lead story, the Drift series banner, two projects index rows and the contact form. Each is an
element on fixture content, so a content edit still cannot fail the project. #48 added the draft
and in-progress projects index rows, making four. The retired status (feature 015) added two
more fixture subjects, `project-row-retired` (the retired index row, making five) and
`retired-story-header` (the story header with the retired pill and note), on the fixture
project `retired`.
The project also sets the footer year to 2026 before every shot (`tests/e2e/footer-year.ts`), so
a new calendar year cannot fail it; the real year is checked by `SiteFooter.test.ts` and
`shell.spec.ts`.

| Removed subject (4 images per platform) | Where its coverage lives now |
|---|---|
| `home` | Header, footer and menu: the kept shell snapshots, taken on `/`. Layout breakage: the geometry test. Contrast in both themes: `a11y` (axe on every template, both widths and themes). Introduction card and copy: `pages.spec.ts` and the build tests. Home intro card pixels: review-only by decision (#40 phase 2): it is site copy, not a template. |
| `about` | Shell snapshots; geometry test; `a11y`; About sections and Recognition links: `pages.spec.ts`. |
| `contact` | Shell snapshots; geometry test; `a11y`; the form and its states: `contact.spec.ts`. The contact form's pixels: the `contact-form` snapshot of the fixture page `/contact-form/` (#40 phase 2). |
| `writing-landing` | Shell snapshots; geometry test; `a11y`; listing behaviour: `blog.spec.ts` and the `sections` project's `blog-fixtures.spec.ts` and `blog-pagination.spec.ts`. Listing card pixels: `listing-cards`, the three fixture cards on `/writing/topics/fixture-cards/`. Lead-story pixels: `lead-story` on the fixture `/writing/`, whose lead is the fixture post `every-part` (dated 2099 so no real post can take the lead). |
| `writing-all` | As `writing-landing`, including the card snapshot. Pagination: `blog-pagination.spec.ts`. |
| `writing-topic` | As `writing-landing`, including the card snapshot. |
| `writing-post` | Shell snapshots; geometry test (includes the code block and table scroll containers); `a11y` (`blog.a11y.spec.ts`, `blog-fixture.a11y.spec.ts`); Copy button and table region: `blog.spec.ts`; forced colours: `blog-forced-colors.spec.ts`. Post template pixels: `post-template`, the article of the fixture post `/writing/every-part/`. Related posts are left out because they are chosen from all posts; their cards are the `listing-cards` component. |
| `writing-series` | Shell snapshots; geometry test; `a11y`; series intro and links: `blog.spec.ts`. Series banner pixels: `series-banner` on the fixture `/writing/drift/` (banner element only). |
| `projects` | Shell snapshots; geometry test; `a11y`; two-column and one-column rows: `projects.spec.ts`; fixture listings: `projects-fixtures.spec.ts`. Projects index row pixels: `project-row-minimal`, `project-row-every-setting`, `project-row-draft` and `project-row-in-progress` (row elements only; the fixture index also lists the real rows, which the test removes). |
| `project-story` | Shell snapshots; geometry test (reduced motion, final state); `a11y`; part layout at 390 and 1280, comparison region and invitation: `projects.spec.ts`; motion: `projects-motion.spec.ts`; forced colours: `projects-forced-colors.spec.ts`; no-JS: `projects-no-js.spec.ts`. Story template pixels: `story-template`, the article of the fixture story `/projects/every-part/`, with reduced motion. |

Every phase-1 gap now has a fixture snapshot, except the home intro card, which is review-only
by decision. The fixture site also holds real content, so every phase-2 subject is an element
shot, and the post's Related posts are left out. `blog-fixtures.spec.ts` pins the lead, so a
fixture change that moves it fails there with a named reason.

`tests/e2e/theme-tokens.spec.ts` adds the token check that pixels cannot name. On three fixture
pages (`/sections/`, `/writing/every-part/`, `/projects/every-part/`) it reads the computed
colour of the key components (header, footer, pills, buttons, code block, table, quote, links
and focus rings), compares each with the theme's token in both themes, and flips the `dark`
class without a reload to prove the class alone drives the value. The site has no callout
component, so the prose blockquote stands in for "callouts". The CTA button is theme-invariant
by design (`bg-rust-600 text-white`, no `dark:` variant), so the test pins it equal in both
themes.

The focus-ring probes also check that the ring is the site's own rule (solid, 2px, offset 2px,
and no outline before focus) and that it keeps its token colour when the text colour is
overridden in place. That matters in dark mode, where the prose link and its ring share
`accent-400`, so a ring that fell back to `currentColor` would otherwise pass. The specs that
need a colour theme before first paint share one helper, `tests/e2e/color-theme.ts`
(`setTheme`, `expectThemeClass`), instead of each carrying a copy.

### Check functions and call sites

A validation rule has two parts, and each is proven once.

1. **Logic**: does this input produce this message? That belongs in the unit test of the plain
   function or schema that decides it (`src/lib/content/`, `src/content/schemas/`,
   `src/components/sections/validate.ts`), or a component test when the check lives in a
   component. Astro's `errorMap` is not a public export, so schema unit tests format zod's issues
   like Astro does (`<path>: <message>`) and assert the row's phrase against that text.
2. **Wiring**: does Astro actually run that function on real files, and does its message reach
   the build output with the file name? One failing run per distinct call site:
   - **`sync`** for call sites in `src/content.config.ts`: the collection schema and the glob
     loader's `generateId`. `sync` runs `generateId`.
   - **`build`** for call sites in route `getStaticPaths()` (`src/pages/[...slug].astro`,
     `src/pages/projects/[slug].astro`, `getCheckedPosts` in `src/lib/posts.ts`), in render-time
     component checks, and for errors raised by Astro itself (an MDX body image that does not
     exist). Some checks pass `sync` and fail only a build (post P13, project row 09), so
     they need a build.

A row whose function is wired at a call site that another row's run already proves maps to that
run: the run proves the call site, the unit test proves the row. The build stops at the first
error, so each failing run holds exactly one broken file.

## Contract-row mapping

Where each row of the four `build-errors.md` contracts is asserted. Paths are relative to
`tests/`. "Unit" is `tests/unit/content/`. A row with "build only" is proven by a build run and
by no cheaper layer, because only a build can show it.

### Page files: `specs/003-standalone-pages/contracts/build-errors.md`

Call-site runs, all in `build/page-validation.test.ts`:

- **sync**: "rows 1 to 5: the pages schema is wired and Astro names the file";
  "row 6: generateId runs assertFrontmatterImagesExist"; "row 17: generateId runs idFromPath".
- **build**: "row 7: Astro rejects a body image that does not exist"; "row 13: the route checks
  addresses over the file-system page list"; "rows 8 to 10 and 16: the route runs
  validatePageBody"; "rows 11 and 12: a section check names the section and the page file".

| Row | Rule | Primary assertion | Call-site run |
|---|---|---|---|
| 1 | No `title` | `unit/page-schema.test.ts` "row 1: a missing title names title" | sync, rows 1 to 5 |
| 2 | No `description` | `unit/page-schema.test.ts` "row 2: a missing description names description" | sync, rows 1 to 5 |
| 3 | Wrong type | `unit/page-schema.test.ts` "row 3: a wrong type for nav.position names position" | sync, rows 1 to 5 |
| 4 | Misspelled key | `unit/page-schema.test.ts` "row 4: a misspelled key is named in the issue text" | sync, rows 1 to 5 |
| 5 | Image without alt | `unit/page-schema.test.ts` "row 5: image and featureImage without alt name alt" | sync, rows 1 to 5 |
| 6 | Missing frontmatter image | `unit/images.test.ts` "names the page file and the image path when a file is missing" | sync, row 6 |
| 7 | Missing body image | `build/page-validation.test.ts` "row 7" (build only: Astro's own message, which may not name the page file) | build, row 7 |
| 8 | Empty alt in the body | `unit/body.test.ts` "rejects an image with empty alt text" | build, rows 8 to 10 and 16 |
| 9 | Empty body | `unit/body.test.ts` "rejects an empty body" | build, rows 8 to 10 and 16 |
| 10 | Unknown section | `unit/body.test.ts` "rejects an unknown capitalised tag, naming the file, the tag and the valid sections" | build, rows 8 to 10 and 16 |
| 11 | Section missing a prop | `component/sections/CallToAction.test.ts` "throws naming the section and the missing or invalid prop" | build, rows 11 and 12 (names the page file) |
| 12 | Image section without image | `component/sections/Images.test.ts` "throws naming the section when there is no image", and `unit/section-schemas.test.ts` "says an image is needed" | build, rows 11 and 12 (same `checkSection` path) |
| 13 | Two files, one address | `unit/address.test.ts` "fails for two page files with the same address, naming both and the address" and "fails for x.mdx together with x/index.mdx" | build, row 13 (`x.mdx` with `x/index.mdx`) |
| 14 | Address used by a route, or reserved | `unit/address.test.ts` "fails for a page against a route file in src/pages", "fails for a page against a generated route file such as robots.txt.ts", "fails for the home page against src/pages/index.astro", "fails for a page under the fixed prefix of a route with a variable part", "fails for reserved address %s", and "row 14: page addresses against the real route files (/projects/ prefix)"; the route-file list at the call site: `build/page-validation.test.ts` "row 14" (a page at `404.mdx` against `src/pages/404.astro`) | build, row 13 (the page-file list) and build, row 14 (the route-file list, same `assertUniqueAddresses` call) |
| 15 | Same navigation position | `unit/navigation.test.ts` "fails when two pages use the same position, naming both files and the position" and "fails when a page asks for fixed position %i, naming the page and the fixed entry" | `build/local-site.test.ts` "lists the page-sourced About entry in the header, between Projects and Contact" (the page-sourced entry reaches the real header) |
| 16 | Level-1 heading | `unit/body.test.ts` "rejects a level-1 Markdown heading and an <h1>, saying to use ##" | build, rows 8 to 10 and 16 |
| 17 | Bad file or folder name | `unit/address.test.ts` "rejects %s with the file name and the naming rule" | sync, row 17 |

### Post files: `specs/008-blog/contracts/build-errors.md`

Call-site runs, all in `build/post-validation.test.ts`:

- **sync**: "validates drafts too: the posts schema is wired and Astro names the file (P23,
  FR-012a)"; "P4: generateId runs assertPostDates"; "P9: generateId runs
  assertFrontmatterImagesExist with the post wording"; "P21 (changed): a removed controlled
  topic id is accepted as a free-form topic".
- **build**: "P22: Astro rejects a body image that does not exist"; "P13: getCheckedPosts runs
  assertPostFiles"; "P20: getCheckedPosts runs validatePageBody with the post wording".

"Schema sync" below means the first sync run (the posts schema wired, file named).

| Row | Rule | Primary assertion | Call-site run |
|---|---|---|---|
| P1 | No or blank `title` | `unit/post-schema.test.ts` "rejects a missing, empty or blank %s, naming the key (P1, P2)" | schema sync |
| P2 | No or blank `summary` | same `it.each` as P1 | schema sync |
| P3 | No `date` | `unit/post-schema.test.ts` "rejects a missing date, naming date (P3)" | schema sync |
| P4 | Unreadable date | `unit/post-schema.test.ts` "rejects date: %s, naming the file, date and the value found (P4)" (the four contract inputs), and "rejects date: %j, naming the file and date" | sync, P4 |
| P5 | No or empty `topics` | `unit/post-schema.test.ts` "rejects a missing or empty topics list, naming topics (P5)" | schema sync |
| P6 | Unknown topic | `unit/post-schema.test.ts` "rejects a near-miss of a controlled id, naming it, the intended id and every controlled id in list order (P6)" | schema sync |
| P7 | Same topic twice | `unit/post-schema.test.ts` "rejects the same topic twice, naming topics (P7)" | schema sync |
| P8 | `featureImage` without alt | `unit/post-schema.test.ts` "rejects a feature image without alt or with empty alt, saying alt and alt text (P8)" | schema sync |
| P9 | Missing feature image | `unit/images.test.ts` "names the post file, with the post wording, when a post's feature image is missing (P9)" | sync, P9 |
| P10 | `updated` before `date` | `unit/post-schema.test.ts` "rejects updated earlier than date, naming updated (P10)" | schema sync |
| P11 | Unknown setting | `unit/post-schema.test.ts` "rejects an unknown or misspelled setting, naming it (P11)" | schema sync |
| P12 | Body image, empty alt | `unit/body.test.ts` "keeps the same rules: use ##, unknown section with the list, alt text" and "starts every message with Post file and names the file" | build, P20 |
| P13 | `.md` file | `unit/post-address.test.ts` "rejects a .md file, naming the file and saying to rename it to .mdx (P13)" | build, P13 |
| P14 | Sub-folder | `unit/post-address.test.ts` "rejects a post in a sub-folder, naming the file and the sub-folder (P14)" | build, P13 (same `assertPostFiles` call) |
| P15 | Bad file name | `unit/post-address.test.ts` "rejects %s ... (P15)" (the `it.each` over bad names) | build, P13 |
| P16 | Reserved slug | `unit/post-address.test.ts` "rejects the reserved slug %s, naming the address (P16)" | build, P13 |
| P17 | Two files, one slug | `unit/post-address.test.ts` "rejects two files with one slug, naming both files and the address (P17)" | build, P13 |
| P18 | Level-1 heading | `unit/body.test.ts` "keeps the same rules: use ##, unknown section with the list, alt text" (post kind) | build, P20 |
| P19 | Unknown section tag | same case, `Callout` and the section list | build, P20 |
| P20 | Empty body | `unit/body.test.ts` "says the post has no content, not the page" | build, P20 |
| P21 | Removed topic id (changed in 013) | sync "P21 (changed)": the id is accepted as free-form. Rendering a free-form topic page is proven by `build/blog-listing.test.ts` "builds a plain banner and listing for a free-form id named by a visible post" | sync, P21 |
| P22 | Missing body image | `build/post-validation.test.ts` "P22" (build only: Astro's own import error) | build, P22 |

Not rows, but kept: an unknown code-fence language builds as plain text
(`build/local-site.test.ts` "things that are not errors"); a Shiki colour with no class fails the
build (`build/local-site.test.ts` "fails the build, naming the colour, when a token colour has
no class", with the transformer logic in `unit/markdown/shiki-classes.test.ts`).

### Project files: `specs/014-project-four-part-story/contracts/build-errors.md`

Every run in `build/project-validation.test.ts` sets `env: { PROJECT_VALIDATION_CANARY }` and
asserts that the message does not contain it (no environment value or secret in a message).
Call-site runs:

- **sync**: "validates drafts too: the projects schema is wired and Astro names the file (row 03,
  FR-073)" (production environment); "row 17: generateId runs assertProjectImagesExist";
  "row 27: generateId runs slugFromPath (and rejects a nested file the same way)"; "R01: a
  removed setting in a draft fails at sync under production".
- **build**: "row 26: the route runs assertUniqueProjectFiles"; "a malformed options table in a
  draft fails a production build" (T06) and "an MDX element in a draft fails a production
  build" (R05): `validateProjectStory` runs on every entry, drafts included.
- **template**: `build/project-template.test.ts` "X01: _template.mdx is excluded" and "X02: a renamed copy
  of the template builds with four parts, links and the invitation" (in `test:build:content`).

Schema rows are asserted in `unit/project-schema.test.ts` (the row id is in each title). Body
rows are asserted in `unit/project-story.test.ts`, one `it` per row id. The template itself
is checked by `unit/project-template.test.ts`, and the guide by `unit/projects-guide.test.ts`.

| Rows (contract ids) | Rule | Primary assertion | Call-site run |
|---|---|---|---|
| S01 to S08 | Required settings, status, themes, pictures, unknown setting, problem length, addresses, picture name. S02 changed in `specs/015-project-retired-status/contracts/build-errors.md`: its message now lists `retired` too | `unit/project-schema.test.ts` "S01" to "S08" | schema sync (row 03 run) |
| S09 | Missing picture file | `build/project-validation.test.ts` "row 17" (the check has no unit test of its own) | sync, row 17 |
| S10 | Bad file name, nested file | `unit/project-address.test.ts` "rejects %s with the file name and the naming rule" | sync, row 27 |
| S11 | Two files, one slug | `unit/project-address.test.ts` "names both files when .md and .mdx share a slug" | build, row 26 |
| R01 to R04 | Removed settings: `order`, `demo.embed`, a clip picture, `comparison` | `unit/project-schema.test.ts` "R01" to "R04" | sync, "R01" run |
| R05, R06 | MDX element, import or export in the body | `unit/project-story.test.ts` "R05", "R06" | build, "an MDX element in a draft" |
| N01 to N03 | `part` value, one picture per part, `invitation` text | `unit/project-schema.test.ts` "N01" to "N03" | schema sync |
| P01 to P07 | The four parts, heading level, body images, text before the first part | `unit/project-story.test.ts` "P01" to "P07" | build, "a malformed options table in a draft" run (same call) |
| T01 to T13 | The Options constraint list, table, bold option and "Why" line | `unit/project-story.test.ts` "T01" to "T13" | build, "a malformed options table in a draft" |
| X01, X02 | The template is excluded; a renamed copy builds | `unit/project-template.test.ts`; `build/project-template.test.ts` "X01", "X02" | build |
| RP01 to RP03 | Retired status and `replacedBy` (`specs/015-project-retired-status/contracts/build-errors.md`): replacement on a non-retired project, `project` and `name` both or neither or `href` beside `project`, bad `href`, unknown key, empty `name`, null | `unit/project-schema.test.ts` "RP01" to "RP03" | schema sync (row 03 run) |
| RP04, RP05 | `replacedBy.project` names no project file, or the project itself | `unit/project-replacement.test.ts` "RP04", "RP05" | build, "RP04: a retired draft naming a missing project fails a production build" (RP05 shares the `checkReplacements` call) |

A page file under `/projects/...` fails through the page address check:
`unit/address.test.ts` "fails for a page file under the projects story route's prefix" and
"row 14: page addresses against the real route files (/projects/ prefix)", with the call site
proven by the page build run for row 13.

### Writing series: `specs/013-writing-series/contracts/build-errors.md`

| Row | Rule | Primary assertion | Call-site run |
|---|---|---|---|
| P23 | Both series on one post | `unit/post-schema.test.ts` "rejects both series, naming both ids and one series (P23)" | `build/post-validation.test.ts` sync "validates drafts too" (a draft with both series) |
| P24 | Free-form id near a controlled id | `unit/post-schema.test.ts` "rejects the near-miss %s, naming %s (P24)" | schema sync |
| P25 | Post file named for a series | `unit/post-address.test.ts` "rejects the series slug %s, naming the address (P25)" | build, P13 |
| P26 | Free-form id breaking the id rules | `unit/post-schema.test.ts` "rejects ids that break the id rules (P26)" | schema sync |
| P6 (changed) | Near-miss message names the intended id | `unit/post-schema.test.ts` P6 case (see the post table) | schema sync |
| P21 (changed) | Removed topic id builds | `build/post-validation.test.ts` sync "P21 (changed)" | the same run |
| Must build: no series tag | Builds, no warning | `build/local-site.test.ts` "builds a post that is untagged, with a silent build" | the L1 build |
| Must build: only a free-form topic | Builds; the pill links to an existing topic page | `build/local-site.test.ts` "builds a post that is free-form only, with a silent build"; the topic page: `build/blog-listing.test.ts` "builds a plain banner and listing for a free-form id named by a visible post" | the L1 build |
| Must build: one series plus others | Builds | `build/local-site.test.ts` "builds a post that is series plus others, with a silent build" | the L1 build |

## Build budget

The `build` Vitest project (`tests/build/**`) runs real Astro work, so it is capped. The target
is **20 full builds or fewer**, and `sync` runs are listed separately because a `sync` takes
about a second where a build takes tens of seconds.

**Counting rule.** Count each `buildFixtureSite(` call that runs in `mode: "build"` (the
default), each real `astro build` in `indexing.test.ts`, and each call in `mode: "sync"`
separately. Expand `beforeAll` (one run per call, not per `it`), `describe.each` and
`it.each` (one run per row when the run is inside the callback), and helpers such as
`expectRejected(mode, ...)` (one run per call). Shared builds read many assertions from one
run. Adding a build means updating this table.

Counted on 2026-10-01 after phase 2:

| File | Builds | Syncs |
|---|---|---|
| `local-site.test.ts` | 5 (L1, L2, L3, code baseline, code with a broken colour) | 0 |
| `drafts.test.ts` | 2 (production, preview) | 0 |
| `blog-listing.test.ts` | 1 | 0 |
| `indexing.test.ts` | 2 (real `astro build`, main-branch and preview environments) | 0 |
| `page-validation.test.ts` | 5 | 3 |
| `post-validation.test.ts` | 3 | 4 |
| `project-validation.test.ts` | 2 | 3 |
| `fixture-site.test.ts` | 0 | 2 |
| **Total** | **20** | **12** |

Before phase 2 the project ran 144 runs: 132 full builds and 12 syncs.

On a content-only change the project runs only `indexing.test.ts` (2), `local-site.test.ts`
(5) and `project-template.test.ts` (2): 9 builds and 0 syncs. `focus-pocus.test.ts` (0 and 0) moved to `tests/unit/content/` in
phase 4.

## Measured gate times

Measured on 2026-10-02, after phase 5 (#36), at commit 75e73fc.

| Gate | Before (2026-10-01) | Final | Target |
|---|---|---|---|
| CI `verify` on `main` | 31 min (run 36814114154) | 6 min 15 s (run 37090465334); range 6:15 to 7:59 across the `main` runs since #31 | 10 min or less, met |
| Local `pnpm run verify`, Mac | 8 to 10 min | 5 min 39 s (339 s) | 4 min or less, not met; revised to 6 min or less, met; the 4 min target moved to #37, now replaced by #40 |

Per-job time in run 37090465334, the push of the #36 merge to `main` (full tier, every job
succeeded):

| Job | Time |
|---|---|
| `changes` | 15 s |
| `static` | 93 s |
| `build-tests` | 338 s |
| `e2e` | 341 s |
| `verify` | 13 s |

`e2e` is the long pole in every `main` run (341 to 451 s). `build-tests` is next (245 to 393 s).
`e2e` is longer than `build-tests` in every run. The a11y and no-js matrices were left alone
under D8.

Local stages, one `pnpm run verify` on commit 75e73fc:

| Stage | Result | Time |
|---|---|---|
| Vitest (unit and build projects) | 180 files, 2570 passed, 1 skipped | 156.45 s |
| Worker tests | 12 files, 132 passed | 3.47 s |
| Playwright (all projects, including `budget`) | 1388 passed | 144 s (2.4 min) |
| Total | VERIFY_EXIT=0 | 339 s |

Locally, Vitest (mostly the `build` project) is slightly longer than Playwright, while in CI
`e2e` is the long pole.

Method:

- CI wall time is the earliest job `startedAt` to the `verify` job's `completedAt`, from
  `gh run view <id> --json jobs`, on a push to `main`. A push to `main` is always the full tier;
  PR runs add the preview site-check.
- Local time is `date +%s` around one `pnpm run verify` on the Mac, under `perl -e 'alarm N'`,
  with the agent-shell setup and nothing else running.
- Re-measure when a layer or job changes, and add a dated row rather than overwrite.

### Visual refocus, #40 phase 1 (2026-10-03)

| Measure | Before (run 37136029981, `main` push of #39) | After |
|---|---|---|
| `e2e` job | 473 s | 353 s (5 min 53 s), run 37140329856 (PR #41, first run) |
| `test:e2e:parallel` step | 335 s | 241 s (4 min 1 s), same run |
| Visual tests | 58 | 18 |
| E2E tests | 583 | 619 |

After figures are from this PR's CI run, which adds the preview site-check; the
`test:e2e:parallel` step is the comparable number.

### Visual refocus, #40 phase 2 (2026-10-03)

| Measure | Before (run 37141574364, `main` push of #41) | After |
|---|---|---|
| `e2e` job | 305 s | 447 s (7 min 27 s), run 37146856024 (`main` push of #43) |
| `test:e2e:parallel` step | 208 s | 318 s (5 min 18 s), same run |
| Visual tests | 18 | 50 |
| Visual PNGs | 36 | 100 |
| E2E tests | 619 | 625 |

Before and after are both `main` push runs, so they compare directly. The PR's own run
(37146278538) had 437 s for the job and 311 s for the step. Across the whole of #40, the `e2e` job
went from 473 s to 447 s and the run (first job start to `verify` end) from 500 s to 465 s.
Each figure is a single run.

### Playwright theme and layout tidy, #49 (2026-10-03)

| Measure | Before (run 37168636278, `main` push of #58) | After |
|---|---|---|
| `e2e` job | 449 s | 394 s (6 min 34 s), run 37169411244 (PR #59, first run) |
| `test:e2e:parallel` step | 320 s | 269 s (4 min 29 s), same run |
| E2E tests | 617 | 611 |
| Accessibility tests | 626 | 608 |
| All Playwright tests (`--list`, five local projects) | 1429 | 1405 |

The tidy moved the colour-theme helper into one file and folded the sideways-scroll checks into
the geometry test, which now runs at 320, 390 and 1280 px. The a11y 320 px reflow check went
with it. Counts are from `playwright test --list` on the branch after merging `main` at #58;
the visual (58), sections (55) and budget (73) projects are unchanged.
