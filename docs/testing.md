# Testing: layers, placement and where each rule is proven

`pnpm run verify` is the gate for every PR and every push to `main`. This page says what each
layer of the gate is for, where a new test goes, where every build-error row of the content
contracts is asserted today, and how many Astro builds the `build` Vitest project may run.
It came out of [issue #26](https://github.com/drcdev/dcc-web/issues/26) (phases 1 and 2); the
numbers are the budget that the build project is held to.

## Layers

| Layer | Tool and command | What only it can show | Depth | Verdict |
|---|---|---|---|---|
| secretlint, lint, typecheck | `pnpm run lint:secrets`, `pnpm run lint`, `pnpm run typecheck` | Leaked secrets, lint errors, type drift | Whole repository | Keep. Cheap. |
| Unit and schema | Vitest `unit` project, `tests/unit/**` | Logic and content schemas in isolation: does this input produce this message | Rule by rule, milliseconds per case | Keep. This is where rule-by-rule depth belongs. |
| Component | Vitest `unit` project, `tests/component/**` | One Astro component rendered through the container API | One component per file | Keep. |
| Build, `sync` | Vitest `build` project, `buildFixtureSite(..., { mode: "sync" })` | That Astro runs a `src/content.config.ts` call site (collection schema, glob loader `generateId`) on real files and names the file in the error. About a second per run. | One broken file per run | Keep. Preferred over `build` wherever no HTML is read. |
| Build, `build` | Vitest `build` project, `buildFixtureSite(...)` (default mode) | What the real build does: route generation, `getStaticPaths()` checks, render-time component checks, Astro's own errors (body image import), draft exclusion per environment, CSP and indexing output, code highlighting, cross-page output. Tens of seconds per run. | One build per fixture set, many assertions read from it | Thin to what only a build can show. |
| Worker integration | `pnpm run test:worker`, `vitest-pool-workers` | The contact API against local D1 | Per endpoint | Keep. |
| Real `astro build` | `tests/build/indexing.test.ts`, which runs `astro build` on the repository's own content in the main-branch and preview environments, plus `pnpm run build` in `verify` | That the real site builds and that its sitemap, robots and headers match the environment | Two environments | Keep. |
| E2E | Playwright `e2e` and sibling projects, `pnpm run test:e2e` | Journeys in a real browser: navigation, theme, menu, contact submission, not-found, behaviour without JavaScript | Journeys, plus the template matrix | Keep journeys; review matrices (issue #26, D8). |
| Accessibility | Playwright `a11y` projects (axe) | WCAG 2.2 AA per template, both widths, both themes | Full template matrix | Keep (Principle X). |
| Visual | Playwright `visual` project | Pixel baselines of the shell, not-found page and sections fixture | Per platform | Keep. The only guard on design regressions. |
| Budget | Playwright `budget` project | LCP, CLS, long tasks and bytes under throttling | Per template, serial | Keep. Slow by design. |
| Preview site-check | `scripts/site-check`, run against the preview deployment | Sitemap and links on the deployed preview | Once per PR | Keep. |

## Where a test goes

Every behaviour gets **one primary layer**: the cheapest layer that can observe it.

- E2E is for journeys and for anything only a browser can show.
- Build tests are for what only the real build shows: call-site wiring, Astro's own errors
  and output that spans pages.
- Accessibility and visual tests cover templates, not stories.
- A second layer needs a reason, written in the test's comment.

The test title or a comment carries the contract row id (`row 7`, `P13`), so a search for the
id finds the test.

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
| 14 | Address used by a route, or reserved | `unit/address.test.ts` "fails for a page against a route file in src/pages", "fails for a page against a generated route file such as robots.txt.ts", "fails for the home page against src/pages/index.astro", "fails for a page under the fixed prefix of a route with a variable part", "fails for reserved address %s", and "row 14: page addresses against the real route files (/projects/ prefix)" | build, row 13 (same `assertUniqueAddresses` call) |
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

### Project files: `specs/009-portfolio/contracts/build-errors.md`

Every run in `build/project-validation.test.ts` sets `env: { PROJECT_VALIDATION_CANARY }` and
asserts that the message does not contain it (no environment value or secret in a message).
Call-site runs:

- **sync**: "validates drafts too: the projects schema is wired and Astro names the file (row 03,
  FR-073)" (production environment); "row 17: generateId runs assertProjectImagesExist (and
  the clip check of row 19)"; "row 27: generateId runs slugFromPath (and rejects a nested file
  the same way)".
- **build**: "row 26: the route runs assertUniqueProjectFiles"; "rows 09 to 11: the route runs
  validateProjectBody on a draft in a production build".

Schema rows are asserted in `unit/project-schema.test.ts`, describe "projectSchema messages
(contracts/build-errors.md)", with the row id in the title. The body rows are one `it.each`
in `unit/project-body.test.ts`, describe "validateProjectBody messages (contracts/build-errors.md)",
titled "%s names the file and the phrase" (each row asserts the file and the phrase).

| Row | Rule | Primary assertion | Call-site run |
|---|---|---|---|
| 01 | Missing title | `unit/project-schema.test.ts` "row 01" | schema sync (row 03 run) |
| 02 | Missing problem | "row 02" | schema sync |
| 03 | Missing or unknown status | "row 03: an unknown status names status and lists the allowed values" | schema sync |
| 04 | Theme count or duplicate | "row 04: %s themes name themes" | schema sync |
| 05 | Index visual or alt missing | "row 05: an index visual without alt names visual and alt" | schema sync |
| 06 | Wrong-kind or out-of-range `order` | "row 06: order %s names order" | schema sync |
| 07 | Unknown setting | "row 07: a misspelled setting is named" | schema sync |
| 08 | Problem too long | "row 08: a long problem asks for one sentence of at most 140 characters" | schema sync |
| 09 | Missing chapter | `unit/project-body.test.ts` "row 09: a missing chapter names the file and the phrase" | build, rows 09 to 11 |
| 10 | Chapters out of order | "row 10: chapters out of order ..." | build, rows 09 to 11 |
| 11 | Repeated chapter | "row 11: a repeated chapter ..." | build, rows 09 to 11 |
| 12 | Not exactly one chosen option | `unit/project-schema.test.ts` "row 12" | schema sync |
| 13 | Chosen option without reason | "row 13" | schema sync |
| 14 | Option missing a fit | "row 14: an option missing a fit names the option and the constraint" | schema sync |
| 15 | Comparison empty | "row 15: a comparison with %s names comparison" | schema sync |
| 16 | `<OptionComparison />` misplaced | `unit/project-body.test.ts` "row 16: no OptionComparison block ..." | build, rows 09 to 11 |
| 17 | Missing image | `unit/project-clips.test.ts` "row 17: names the project file and the path of a missing image" | sync, row 17. Only the frontmatter case is tested; the body-image half of the row (the same Astro import mechanism as P22) has no test yet. |
| 18 | Visual without alt or description | `unit/project-schema.test.ts` "row 18" | schema sync |
| 19 | Clip problems | description: `unit/project-schema.test.ts` "row 19"; missing clip and clip over 5 MB: `unit/project-clips.test.ts` "names the file and the path of a missing clip" and "names the file, the path and the limit of a clip over 5 MB" | schema sync; sync, row 17 (same function) |
| 20 | Demo address | `unit/project-schema.test.ts` "row 20" | schema sync |
| 21 | Source or stand-in address | "row 21: %s that is not https names the setting and https://" | schema sync |
| 22 | Demo and stand-in both set | "row 22" | schema sync |
| 23 | Unknown building block | `unit/project-body.test.ts` "row 23: an unknown block lists the blocks ..." | build, rows 09 to 11 |
| 24 | Unknown visual name | "row 24" | build, rows 09 to 11 |
| 25 | `visual="demo"` without embed | "row 25" | build, rows 09 to 11 |
| 26 | Duplicate slug, nested file | `unit/project-address.test.ts` "names both files when .md and .mdx share a slug" and "rejects a nested file" | build, row 26 (duplicate); sync, row 27 (nested file, same `slugFromPath`) |
| 27 | Bad file name | `unit/project-address.test.ts` "rejects %s with the file name and the naming rule" | sync, row 27 |
| 28 | Level-1 or level-2 heading | `unit/project-body.test.ts` "row 28" | build, rows 09 to 11 |
| 29 | Body image without alt | "row 29" | build, rows 09 to 11 |
| 30 | Invitation or Demo misplaced | "row 30: the Invitation block missing" and "row 30: the Demo block missing when demo links are set" | build, rows 09 to 11 |
| 31 | Comparison id problems | `unit/project-schema.test.ts` three "row 31" cases (unknown constraint, reason on an unchosen option, duplicate id) | schema sync |
| 32 | Visual name or kind | "row 32: a visual name with %s names visuals and the name" and "row 32: a clip as the index visual names visual" | schema sync |

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
| `page-validation.test.ts` | 4 | 3 |
| `post-validation.test.ts` | 3 | 4 |
| `project-validation.test.ts` | 2 | 3 |
| `fixture-site.test.ts` | 0 | 2 |
| `focus-pocus.test.ts` | 0 | 0 |
| **Total** | **19** | **12** |

Before phase 2 the project ran 144 runs: 132 full builds and 12 syncs.
