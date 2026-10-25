# Chore plan: one-module-per-collection (issue #203)

Branch: `chore/one-module-per-collection`. Closes [#203](https://github.com/drcdev/dcc-web/issues/203)
"One module per content collection". Last of the four content-structure issues (#199 merged in
PR #208).

## Goal

A collection's content rules are spread over three places today: a schema in
`src/content/schemas/`, build-time checks in `src/lib/content/` (or `src/lib/assessment/checks.ts`),
and a reader in `src/lib/` that sometimes holds a rule of its own. Three readers share a file name
with a module in another folder (`career.ts`, `now.ts`, `reading-paths.ts`), and the reading-path
schema imports its limits back from a `src/lib/content/` module. This chore gives each of the eight
collections one rules module under `src/content/collections/` holding its schema, its build-time
checks and its limits. The readers keep loading and assembling, call the rules modules' checks, and
hold no rule. `src/content.config.ts` imports only rules modules and shared helpers. Unit tests
move with the code, and the docs and the `/content` skill name the new files
([#203](https://github.com/drcdev/dcc-web/issues/203)). Every error message, every built page and
every check stays the same: no reader sees a change.

## Acceptance

**Before** (measured 2026-10-25 on `d49aa321`, node v24.4.1):

- `npx vitest run --project unit`: 190 files, 2911 tests, all pass.
- `find src/lib src/content -name "*.ts" | sed 's#.*/##' | sort | uniq -d` prints `career.ts`,
  `now.ts`, `reading-paths.ts`.
- `grep -l "content/errors" $(grep -rl "getCollection(" src/lib)` prints `src/lib/pages.ts`,
  `src/lib/now.ts`, `src/lib/assessment/lookup.ts`. These are readers that hold a rule: the
  missing-landing-file rule V9, the exactly-one-Now-file rule, and the A4 to A7 finders.
- `src/content/schemas/reading-path.ts` imports `MAX_ITEMS` and `MAX_PATHS` from
  `src/lib/content/reading-paths.ts`.
- `src/content/schemas/` holds 8 files. `.claude/skills/content/SKILL.md` "Where the rules live"
  names `src/content/schemas/<x>.ts` and #203.

**After:**

1. `ls src/content/collections/` lists exactly `assessment-rules.ts`, `career-rules.ts`,
   `landing-rules.ts`, `now-rules.ts`, `page-rules.ts`, `post-rules.ts`, `project-rules.ts` and
   `reading-path-rules.ts`. `src/content/schemas/` does not exist.
2. These files are gone: `src/lib/content/{page-flags,post-dates,now-file,options-comparison,project-story,reading-paths,career}.ts`
   and `src/lib/assessment/checks.ts`.
3. The duplicate-basename command above prints nothing.
4. The rule-holding-reader command above prints nothing.
5. `src/content.config.ts` imports only `./content/collections/*-rules.ts`,
   `./lib/content/{addresses,file-format,images}.ts`, `astro:content`, `astro/loaders` and `node:`
   modules. No module it reaches through relative imports lies outside `src/content/collections/`,
   `src/lib/content/` or `src/config/`. The new guard test (W10) checks this.
6. `grep -rn "content/schemas\|lib/content/\(page-flags\|post-dates\|now-file\|options-comparison\|project-story\|reading-paths\|career\)\.ts\|assessment/checks" src tests docs .claude scripts`
   prints nothing. Historical records under `specs/` and `.specify/` are not edited.
7. `pnpm run test:unit` passes with **2925 tests** in **196 files** (before: 190 files, 2911
   tests; +6 files, +14 tests). No moved or split test changes what it asserts. The 14 extra tests:
   - +5 from the generated "no real content named in tests" guard, which emits one test per file
     under `tests/e2e`, `tests/build` and `tests/unit/content`: the splits add
     `draft-pages.test.ts` (W2), `topic-near-miss.test.ts` (W3), `project-replaced-by.test.ts` (W4),
     `career-view.test.ts` (W5) and `reading-path-view.test.ts` (W6).
   - +2 from the same guard: W8 moved two assessment test files into
     `tests/unit/content/collections/`, which brought them into its scope.
   - +1 from W5, which split one career test that used both `checkCareer` and `buildTimeline` into
     a rules test and a view test, keeping every assertion.
   - +2 from W8: two `checkBlockHeading` unit tests for the rule moved out of the post route.
   - +3 from the W10 guard (`boundaries.test.ts`).
   - +1 from the same literal guard, because the W10 file lies in `tests/unit/content/`.
   Files: +5 split files, +1 guard file (the W8 moves add none). `astro check` reports 0 errors,
   `pnpm run lint` passes, and the full verify gate passes in CI.
8. In `.claude/skills/content/SKILL.md`, `grep -n "#203\|src/content/schemas" ` prints nothing, and
   each "Collection guide" row names its `collections/<name>-rules.ts` module.

## Scope

**In:** W1 to W10 below. The decisions this plan takes:

- **Names.** The rules modules end in `-rules.ts` and the readers keep their names, as the issue
  asks (`src/lib/career.ts`, `now.ts`, `reading-paths.ts`, `assessment/lookup.ts`). Pure assembly
  that sits in a `src/lib/content/` module today and must stay importable by unit tests and
  client scripts without the Astro runtime goes to a `-view.ts` helper
  (`src/lib/content/career-view.ts`, `src/lib/content/reading-path-view.ts`). Moving it into the
  reader would pull `astro:content` and `posts.ts` into unit tests and into the CareerTimeline
  client bundle. A view helper holds no rule: it only sorts, formats and resolves.
- **Shared Zod pieces.** `src/content/schemas/shared.ts` becomes `src/lib/content/schema-fields.ts`.
  Four collections and `src/components/sections/schemas.ts` use it, so it is a shared helper, as the
  issue says for helpers used by several collections.
- **Helpers that must stay outside a rules module.** A rules module that uses `reference()` imports
  `astro:content`, so it can never be imported by `astro.config.mjs` or by browser code:
  - `src/lib/content/parts.ts` (`partIds`, `partHeadings`) stays. `astro.config.mjs` loads it
    through `src/lib/markdown/project-parts.ts`. `project-rules.ts` imports it.
  - `themeKey` stays in `src/lib/content/themes.ts`. The ProjectFilter client script imports
    `themes.ts`. `project-rules.ts` imports `themeKey` from there.
  - `categoryIds` and `CategoryId` move from `lib/content/career.ts` to
    `src/lib/content/career-filter.ts`. The CareerTimeline client script imports them, and the
    category list is display and filter data, not a rule.
  - Display helpers stay in `src/lib/content/`: `statusLabel`/`statusTone` (`project-status.ts`),
    `topicLabel`/`orderTopics`/`mainTopic` (`topic-ids.ts`), the theme filter logic (`themes.ts`),
    and `resolveReplacement` (`project-replacement.ts`).
- **`body.ts` stays in `src/lib/content/`.** `validatePageBody` checks both page bodies and post
  bodies, so it is a shared helper. It imports the component registries
  (`components/sections/index.ts`, `components/assessment/index.ts`), and only routes and the posts
  reader call it, never `content.config.ts`. No dependency injection is needed.
- **`project-story.ts` moves into `project-rules.ts`.** It is a projects-only check. Its only
  import is `satteri`, a package that is already a direct dependency and that the Markdown pipeline
  loads during config load, so it brings no component or page into the config graph. W4 runs
  `astro check` (which runs `astro sync`) to prove that the config still loads.
- **Rules held by readers and routes move:** V9 (missing landing file) from `src/lib/pages.ts`
  goes to `landing-rules.ts` as `checkLandingFiles`. "Exactly one Now file" from `src/lib/now.ts`
  goes to `now-rules.ts` as `checkNowFiles`. `findAssessment`, `findShift` and `checkBlockTargets`
  from `lookup.ts`, and the inline "needs a heading `## <title>` just above it" check in
  `src/pages/writing/[slug].astro`, go to `assessment-rules.ts` (the last as
  `checkBlockHeading`). Messages are copied character for character. The plain `Error` thrown when
  no reading time is computed (`posts.ts`, `reading-paths.ts`) is a plugin-registration guard, not a
  content rule, so it stays.
- **Guard test.** W10 adds `tests/unit/content/collections/boundaries.test.ts` with 3 tests:
  config import graph, no duplicate basenames, readers do not import `errors.ts`. It turns the
  done-when into a lasting check, and it accounts for the +3 in the test count.

**Out (follow-ups for the PR body):**

- **Config-versus-lib name pairs.** `src/config/navigation.ts` and `src/lib/content/navigation.ts`,
  and `src/config/projects.ts` and `src/lib/projects.ts`, share basenames. They are site
  configuration next to a menu builder or reader, not a rules module next to its reader.
  `scripts/build-fixture-site.ts` rewrites `src/config/projects.ts` by name. The guard covers
  `src/content/collections/` and `src/lib/` only. Renaming the config pair is a separate chore.
  Framework-convention names (`index.ts`, `[slug].astro`, `index.astro`) are out of scope.
- **Render-time project checks in components.** `ProjectPart.astro` (unknown part) and
  `PartPicture.astro` (picture not in `visuals`) throw `contentError` while rendering. They are
  component prop checks, like `components/sections/validate.ts`, and they stay.
- **Duplicate A4/A5 wording.** `src/lib/assessment/question-text.ts` repeats the unknown-assessment
  and unknown-shift errors with slightly different wording from `findAssessment`/`findShift`. Making
  it call the rules module would change an error message, so it is a follow-up.
- **Untested moved rules.** The "heading just above the block" post check has no test today. V9 and
  "exactly one Now file" have build tests only (`tests/build/page-validation.test.ts`,
  `tests/build/home-sections.test.ts`). Adding unit tests for them is a follow-up.

**Not changed:** any error message, schema rule, loader pattern, `generateId` order, page markup,
component behaviour, visual baseline, `scripts/ci/changed-paths.ts` regexes (a `.ts` file under
`src/content/collections/` is full tier, as `src/content/schemas/` was), `.github/workflows/`,
`package.json`.

## Constitution Check

- I Test-First: a refactor with no new behaviour, so the existing unit, component and build tests
  are the specification and must stay green after every item. The one new test (W10 guard) is seen
  to fail on a deliberately broken tree before it is committed.
- II Release Gate: no check is removed or weakened. Moved tests keep every assertion, and the full
  gate runs in CI (this diff changes `src/**`, so the local tier is full).
- III Human Review: normal PR from `drc-agents`, auto-merge armed, Don approves.
- IV First-Party: still Astro content collections with `defineCollection`, `glob()`, Zod from
  `astro/zod`, `reference()` and the `image` schema helper. Only the module that defines a schema
  changes. Docs cited below.
- V Static: no runtime, endpoint or prerender change.
- VI Content as Files: invalid content still fails the build with the same file-naming message.
- VII Private Data: N/A.
- VIII Cloudflare: N/A.
- IX Cost: none.
- X Accessible/Fast/Private: no page output changes. Client bundles do not grow: the import
  constraints above keep `astro:content` and rules modules out of browser scripts.
- XI Spec Kit: chore flow on `chore/<slug>`, plan in `.specify/chores/<slug>/`.

## Work items

Common to every item:

- Run every toolchain command under the `CLAUDE.md` Local toolchain rules.
- Each item ends green on `pnpm run test:unit` (still **2911 tests**; the file count may rise by
  one per split), `pnpm exec astro check` (0 errors) and `pnpm run lint`.
- Move files with `git mv` where a file keeps most of its body, so history follows the move.
- Keep every exported name and every error message byte-identical. Update relative imports in
  moved tests (a test moved into `tests/unit/content/collections/` gains one `../`, and so do its
  `new URL("../../../…", import.meta.url)` paths and `tests/helpers/` imports).
- A moved or split test keeps its `describe`/`it` titles and assertions. Only its imports change.
- Delete each `src/content/schemas/<x>.ts` in the item that replaces it, and update the comments
  in `src/content.config.ts` that name a moved file.
- A rules module may import only `astro:content`, `astro/zod`, packages, `src/config/` and
  `src/lib/content/` shared helpers. It must never import a reader (`src/lib/*.ts`,
  `src/lib/assessment/lookup.ts`), a component or a page.

### [x] W1 — Shared schema fields move to `src/lib/content/schema-fields.ts`

**Files:** `git mv src/content/schemas/shared.ts src/lib/content/schema-fields.ts`. Update its
importers: `src/content/schemas/{page,post,project}.ts` (they move later and keep this import) and
`src/components/sections/schemas.ts`. Update the header comment ("shared by the page, landing, post
and project rules and the section prop schemas").

**Test:** existing tests must keep passing (`page-schema`, `post-schema`, `project-schema`,
`section-schemas`, `site-pages`). No test imports `shared.ts` directly. No behaviour: n/a (a pure
move of a helper).

### [x] W2 — Pages and landing rules modules

**Files:**

- New `src/content/collections/page-rules.ts`: the body of `schemas/page.ts` (`pageSchema`,
  `PageData`, `callToAction`) plus `assertHomeVisible` from `lib/content/page-flags.ts`.
- New `src/content/collections/landing-rules.ts`: `landingSchema` (from `schemas/page.ts`),
  `assertLandingBody` and `bodyAfterFrontMatter` (from `page-flags.ts`), and a new
  `checkLandingFiles(required: readonly string[], present: readonly string[])` that holds the V9
  loop and message now in `getNavigation()` in `src/lib/pages.ts`.
  `contentError("page", "src/content/pages/<id>.mdx", "missing. Add the landing file with a title and nav.")`
  stays exactly as it is, with the same id derivation (`address.replaceAll("/", "")`).
- `src/lib/pages.ts` calls `checkLandingFiles(landingPages, landing.map((e) => e.id))` and drops its
  `errors.ts` import.
- Delete `src/content/schemas/page.ts` and `src/lib/content/page-flags.ts`. Update
  `src/content.config.ts`.

**Tests (moves, unit layer):**

- `tests/unit/content/page-schema.test.ts` moves to `tests/unit/content/collections/page-schema.test.ts`.
  It tests `pageSchema` and `landingSchema`; imports from both rules modules.
- `tests/unit/content/page-flags.test.ts` is split. "assertHomeVisible (V5)" and
  "assertLandingBody (V8)" go to `tests/unit/content/collections/page-flags.test.ts` (importing
  `page-rules.ts` and `landing-rules.ts`). "unlistedPageAddresses" goes to
  `tests/unit/content/draft-pages.test.ts`, which tests `src/lib/content/draft-pages.ts` (unchanged).
- `tests/unit/content/site-pages.test.ts` stays (it reads real pages); only its import changes.
- Coverage mapping: no assertion is removed. V9 stays covered by
  `tests/build/page-validation.test.ts` "V9", which builds and so runs `getNavigation()` →
  `checkLandingFiles`.

### [x] W3 — Posts rules module

**Files:**

- New `src/content/collections/post-rules.ts`: the body of `schemas/post.ts` (`postSchema`,
  `PostData`), `assertPostDates` with its `frontMatterOf` helper (from `lib/content/post-dates.ts`),
  and `editDistance` and `nearMiss` (from `lib/content/topic-ids.ts`). It imports
  `config/topics.ts`, `lib/content/dates.ts`, `errors.ts` and `schema-fields.ts`.
- `src/lib/content/topic-ids.ts` keeps `topicLabel`, `orderTopics` and `mainTopic`; update its
  header comment.
- Delete `src/content/schemas/post.ts` and `src/lib/content/post-dates.ts`. Update
  `src/content.config.ts`. Fix the `post.ts` comment that names `post-dates.ts`.

**Tests (moves and one split, unit layer):**

- `tests/unit/content/post-schema.test.ts` moves to `tests/unit/content/collections/post-schema.test.ts`.
- `tests/unit/content/topic-ids.test.ts` is split. "editDistance", "nearMiss" and "nearMiss ties"
  go to `tests/unit/content/collections/topic-near-miss.test.ts` (importing `post-rules.ts`).
  "topicLabel", "orderTopics" and "mainTopic" stay in `tests/unit/content/topic-ids.test.ts`.
- `tests/unit/site/fixture-posts.test.ts`: only imports change.

### [x] W4 — Projects rules module

**Files:**

- New `src/content/collections/project-rules.ts`, holding:
  - the body of `schemas/project.ts` (`projectSchema`, `ProjectData`);
  - `projectStatuses` and `ProjectStatus` (from `lib/content/project-status.ts`);
  - `validateProjectStory` and its private helpers (from `lib/content/project-story.ts`);
  - the types `Fit`, `OptionsConstraint`, `OptionsOption`, `OptionsComparison` (from
    `lib/content/options-comparison.ts`);
  - `checkReplacements` and the `Replacement`/`Replaceable` types (from
    `lib/content/project-replacement.ts`), exported so `resolveReplacement` can use them.

  It imports `partIds` and `partHeadings` from `src/lib/content/parts.ts` and `themeKey` from
  `src/lib/content/themes.ts` (both stay, see Scope).
- `src/lib/content/project-status.ts` keeps `statusLabel` and `statusTone` and imports the
  `ProjectStatus` type from the rules module. `src/lib/content/project-replacement.ts` keeps
  `resolveReplacement` and `ResolvedReplacement`.
- Importers to update: `src/components/project/{ProjectRow,StatusPill,StoryHeader}.astro`,
  `src/pages/projects/[slug].astro`, `src/env.d.ts` (`OptionsComparison`),
  `src/lib/markdown/project-parts.ts` (comment only), `tests/component/project/helpers.ts`.
- Delete `src/content/schemas/project.ts`, `src/lib/content/project-story.ts` and
  `src/lib/content/options-comparison.ts`. Update `src/content.config.ts`.

**Tests (moves and one split, unit layer):**

- Move `project-schema.test.ts` and `project-story.test.ts` to `tests/unit/content/collections/`.
- `project-replacement.test.ts` is split. "checkReplacements" goes to
  `tests/unit/content/collections/project-replaced-by.test.ts`. "resolveReplacement" stays in
  `tests/unit/content/project-replacement.test.ts`.
- `project-status.test.ts`, `project-template.test.ts`, `projects-content.test.ts`,
  `projects-guide.test.ts`, `themes.test.ts` and `filter-logic.test.ts` stay (display logic or real
  content). Only their imports change. `tests/e2e/projects.spec.ts` still imports `themeKey` from
  `themes.ts`, so it does not change.
- Extra check for this item: `pnpm exec astro check` must pass. It runs `astro sync`, which loads
  `content.config.ts` with `satteri` now in its graph.

### [x] W5 — Career rules module and view helper

**Files:**

- New `src/content/collections/career-rules.ts`: the body of `schemas/career.ts` (`careerSchema`,
  the `SHORT`/`LONG`/`ITEM` limits), plus from `lib/content/career.ts` the types `Award`,
  `StepFile` and `PostLookup` and the functions `orderSteps` (C1) and `checkCareer` (C2 to C4).
- `git mv src/lib/content/career.ts src/lib/content/career-view.ts`. It keeps `Part`,
  `TimelineStep`, `Timeline`, `formatMonth`, `formatPeriod`, `buildTimeline` and `stepHas`, and
  imports `orderSteps` and the types from `career-rules.ts`.
- `categoryIds` and `CategoryId` move to `src/lib/content/career-filter.ts`, which drops its
  `./career.ts` import. `career-view.ts` imports them from there.
- Importers to update: `src/lib/career.ts` (reader: `checkCareer` from rules, `buildTimeline` from
  the view helper), `src/components/sections/CareerTimeline.astro` (front matter from
  `career-view.ts`; the client `<script>` imports only from `career-filter.ts`, so no
  `astro:content` reaches the browser).
- Delete `src/content/schemas/career.ts`. Update `src/content.config.ts`, including the comment that
  names `src/lib/content/career.ts`.

**Tests (moves and one split, unit layer):**

- Move `career-schema.test.ts` to `tests/unit/content/collections/`.
- `career.test.ts` is split. "C1 ordering", "C2 current role" and "C3 and C4 related posts" go to
  `tests/unit/content/collections/career.test.ts`. "formatPeriod" and "buildTimeline" go to
  `tests/unit/content/career-view.test.ts`. Copy any shared fixture helper into both files.
- `career-filter.test.ts`, `career-launch.test.ts` and
  `tests/component/sections/CareerTimeline.test.ts`: only imports change.
  `job-title-only-on-about.test.ts` does not change (the reader is still `src/lib/career.ts`).

### [x] W6 — Reading-path rules module and view helper

**Files:**

- New `src/content/collections/reading-path-rules.ts`: the body of `schemas/reading-path.ts`
  (`readingPathSchema`, `MAX_DESCRIPTION`), plus from `lib/content/reading-paths.ts` `MAX_PATHS`,
  `MAX_ITEMS`, `ItemKind`, `PathFile`, `checkReadingPaths`, and the `kindOf` item accessor
  (exported). This removes the schema's import of its limits from `src/lib/content/`.
- `git mv src/lib/content/reading-paths.ts src/lib/content/reading-path-view.ts`. It keeps
  `ResolvedItem`, `ResolvedPath` and `resolveReadingPaths`, and imports `kindOf` and the types
  from the rules module.
- Importers: `src/lib/reading-paths.ts` (reader), `src/components/sections/StartHere.astro`
  (`ResolvedPath` type from the view helper).
- Delete `src/content/schemas/reading-path.ts`. Update `src/content.config.ts`, including the
  comment that names `src/lib/reading-paths.ts` as the place of the cross-file rules: they now
  live in the rules module and run from the reader.

**Tests (move and one split, unit layer):**

- Move `reading-path-schema.test.ts` to `tests/unit/content/collections/`.
- `reading-paths.test.ts` is split. "checkReadingPaths" goes to
  `tests/unit/content/collections/reading-paths.test.ts`. "resolveReadingPaths" goes to
  `tests/unit/content/reading-path-view.test.ts`.
- `launch-paths.test.ts` stays (it reads real content).

### [x] W7 — Now rules module

**Files:**

- New `src/content/collections/now-rules.ts`: the body of `schemas/now.ts` (`nowTopics`,
  `MAX_TOPIC`, `nowSchema`, `checkNowBody`), `assertNowDate` (from `lib/content/now-file.ts`), and a
  new `checkNowFiles(count: number)` holding the "exactly one Now file" rule from `src/lib/now.ts`.
  `contentError("now", "src/content/now/", "there must be exactly one Now file, now.mdx.")` stays
  exactly as it is.
- `src/lib/now.ts` calls `checkNowFiles(entries.length)`, keeps a plain non-null guard for the
  type narrowing, and drops its `errors.ts` import.
- `src/components/sections/Now.astro` imports `nowTopics` from the rules module.
- Delete `src/content/schemas/now.ts` and `src/lib/content/now-file.ts`. Update
  `src/content.config.ts`.

**Tests (moves, unit layer):** move `now-schema.test.ts` and `now-body.test.ts` to
`tests/unit/content/collections/`. Any test of `assertNowDate` moves with its file (grep first).
Coverage mapping: "exactly one Now file" stays covered by `tests/build/home-sections.test.ts`
(two cases), which builds and so runs `getNow()` → `checkNowFiles`.

### [x] W8 — Assessments rules module

**Files:**

- New `src/content/collections/assessment-rules.ts`, holding:
  - the body of `schemas/assessment.ts` (`assessmentSchema`, `Assessment`, `AssessmentShift`);
  - all of `src/lib/assessment/checks.ts` (`Heading`, `checkFromToLines`, `checkNoMovedText`,
    `assessmentsNamedIn`);
  - from `lookup.ts`: `Assessments`, `findAssessment`, `findShift`, `checkBlockTargets`;
  - a new `checkBlockHeading({ file, title, slug, headings })` holding the inline check from
    `src/pages/writing/[slug].astro`, with the same message. The route passes
    `slug = headingId(title)`, which it already computes, so `headingId` and `assessmentContentId`
    stay in `lookup.ts` as id helpers for the components and the route. The call stays at the same
    point in the route, after `checkBlockTargets`.
- `src/lib/assessment/lookup.ts` keeps `loadAssessments`, `resolveAssessment` (now calling
  `findAssessment` from the rules module), `headingId` and `assessmentContentId`, and drops its
  `errors.ts` import.
- Importers: `src/components/assessment/{SelfAssessment,PracticalApplication}.astro`,
  `src/lib/assessment/question-text.ts` (type only), `src/pages/writing/[slug].astro` (drops its
  `errors.ts` import), `src/pages/writing/[slug]/question-source.json.ts`, `tests/helpers/assessment.ts`,
  `tests/helpers/content.ts`.
- Delete `src/content/schemas/assessment.ts` and `src/lib/assessment/checks.ts`. Update
  `src/content.config.ts`. `src/content/schemas/` is now empty and gone.

**Tests (moves, unit layer):**

- `tests/unit/assessment/schema.test.ts` and `checks.test.ts` move to
  `tests/unit/content/collections/assessment-schema.test.ts` and `assessment-checks.test.ts`.
- `tests/unit/assessment/lookup.test.ts` (`headingId`) stays.
- `tests/component/assessment/lookup.test.ts` stays in the component layer, because it also renders
  `PracticalApplication`. Its `findAssessment`/`findShift` import points at the rules module.
  `SelfAssessment.test.ts`: only imports change if needed.

### [x] W9 — Docs, comments and the `/content` skill

**Files:**

- `docs/design-source.md` "Content structure": replace the three `src/content/schemas/*` rows with
  a `src/content/collections/` row ("one `<name>-rules.ts` per collection: schema, build-time checks
  and limits") and a `src/lib/content/schema-fields.ts` row. Fix the `src/lib/content/` and
  `src/lib/content/project-*.ts` rows so they name what is there now (shared helpers
  `addresses.ts`, `body.ts`, `errors.ts`, `images.ts`, `file-format.ts`, `dates.ts`, plus the view
  and display helpers).
- `tests/unit/site/docs-content-structure.test.ts`: the path literal `src/content/schemas/` becomes
  `src/content/collections/` (the same check on the renamed path).
- `docs/testing.md`: line 87 machinery list, line 279 (`src/content/collections/`), and the
  coverage tables that name moved test files (V5/V8 rows near line 345, `project-story` and
  `project-replacement` rows near lines 420 to 436, and any assessment, career or reading-path row).
  Use the new test paths.
- `tests/build/project-validation.test.ts` comments (lines 2, 67, 85) and
  `tests/unit/content/project-schema.test.ts` comment: the new test file paths.
- `tests/unit/ci/changed-paths.test.ts`: the synthetic paths `src/content/schemas/{post,career}.ts`
  become `src/content/collections/{post,career}-rules.ts`. They still prove that a rules file runs
  the full tier; the expected tier is unchanged.
- Comments that name moved files anywhere in `src/` (for example `src/config/navigation.ts`,
  `src/components/SiteFooter.astro` and `src/lib/markdown/project-parts.ts`, plus any left from
  W2 to W8). Check with the Acceptance 6 grep.
- `.claude/skills/content/SKILL.md`:
  - "Collection guide": each row names `collections/<name>-rules.ts` for its schema and checks
    (pages: `page-rules.ts` plus the shared `lib/content/addresses.ts` and `navigation.ts`; landing:
    `landing-rules.ts`; posts: `post-rules.ts`; projects: `project-rules.ts`; career:
    `career-rules.ts`; readingPaths: `reading-path-rules.ts`; now: `now-rules.ts`; assessments:
    `assessment-rules.ts`).
  - "Where the rules live": rewrite. Each collection's schema, build-time checks and limits are in
    `src/content/collections/<name>-rules.ts`. Checks used by several collections are in
    `src/lib/content/`. The reader (`src/lib/<x>.ts`, e.g. `now.ts`, `career.ts`,
    `reading-paths.ts`, `assessment/lookup.ts`) loads and assembles and holds no rule. Some checks
    run from `generateId`, others when a reader or route calls them at build time. Delete the
    "#203 will…" sentence and the "State today." prefix. Keep the two test-guard bullets.
  - "Gate": "no file under `src/content/schemas/`" becomes "no file under
    `src/content/collections/`".

**Test:** no behaviour: n/a (documentation, comments and one path literal). Acceptance 6 and 8
are the checks; `docs-content-structure.test.ts` and `changed-paths.test.ts` keep their test
counts.

### [x] W10 — Boundary guard test and final sweep

**Files:** new `tests/unit/content/collections/boundaries.test.ts`. Primary layer: **unit**, the
cheapest layer that can observe it; it reads source files and builds nothing (as
`job-title-only-on-about.test.ts` does). Three `it`s, each deriving its file set from the tree, so
the test needs no upkeep:

1. "content.config.ts reaches only rules modules, shared helpers and config": walk the relative
   `import … from "…"` / `import "…"` specifiers from `src/content.config.ts` (resolve `x`,
   `x.ts`, `x/index.ts`) and fail on any reached file outside `src/content/collections/`,
   `src/lib/content/` or `src/config/`. Non-relative specifiers (`astro:*`, `astro/*`, `node:*`,
   packages) are skipped.
2. "no two modules in src/content/collections and src/lib share a file name": the basenames of
   every `.ts` file under those two trees are unique.
3. "no reader imports the content error helper": every `src/lib/**/*.ts` file that contains
   `getCollection(` has no import specifier ending in `content/errors.ts` or `/errors.ts`. A reader
   that raises a content error is holding a rule.

New-first: before committing, see each `it` fail once. Temporarily add an import of
`../lib/posts.ts` to `content.config.ts`, a scratch `src/lib/content/now.ts` copy, and a
`contentError` import in `src/lib/now.ts`, run the test, see the three failures, then revert all
three.

**Sweep (no file change expected):** run the Acceptance 1 to 6 commands, `pnpm run test:unit`
(2914 tests), `pnpm exec astro check` and `pnpm run lint`. Run `node scripts/ci/changed-paths.ts
--base origin/main` and record the tier, which should be full. Fix any stray path the greps
find. The full verify gate is the pipeline's verify phase (local tier only, with CI as the gate),
not this item's.

**Test count:** +3 (2911 → 2914), from this guard only.

## Docs citations

Astro Docs MCP (`mcp__astro-docs__search_astro_docs`), consulted 2026-10-25:

- Content collections, "Defining build-time content collections" and "Defining the collection
  schema" (docs.astro.build/en/guides/content-collections/#defining-build-time-content-collections,
  #defining-the-collection-schema): collections are defined in `src/content.config.ts` with
  `defineCollection()`; a schema is any Zod type from `astro/zod`. Nothing requires the schema to be
  written inline, so importing it from `src/content/collections/<name>-rules.ts` is plain module
  code, as importing it from `src/content/schemas/` was.
- "Defining collection references" (…/content-collections/#defining-collection-references):
  `reference()` comes from `astro:content`. This is why rules modules that use it must stay out of
  `astro.config.mjs` and browser code (Scope).
- "Images in content collections" (docs.astro.build/en/guides/images/#images-in-content-collections):
  the `image` helper is passed in from the `schema` callback, unchanged (`pageSchema({ image })`,
  `postSchema({ image })`, `projectSchema({ image })`).
- Upgrade to v6, "Removed legacy content collections", and the v5 note that folders in
  `src/content/` used to become collections (docs.astro.build/en/guides/upgrade-to/v5/#breaking-changes-to-legacy-content-and-data-collections):
  on Astro 7 (`astro@7.3.5`) only collections defined in `content.config.ts` exist, so a
  `src/content/collections/` folder of `.ts` files is not a collection, as `src/content/schemas/`
  is not.

First-party option considered: none applies. Astro has no feature for where schema and check code
lives; the change only moves TypeScript modules.

## Risks

- **`astro:content` leaking into a browser bundle or `astro.config.mjs`.** A rules module that
  uses `reference()` must not be value-imported by `parts.ts`, `themes.ts`, `career-filter.ts` or
  anything a `<script>` or `astro.config.mjs` loads. Mitigation: the Scope decisions above, and
  `astro check` plus the CI build (the e2e job runs the real `pnpm run build`). Type-only imports
  (`import type`) are erased and are fine.
- **Config graph growth.** `project-rules.ts` brings `satteri` into the config load. It is an
  existing direct dependency that the Markdown pipeline already loads. If `astro sync` fails, keep
  `validateProjectStory` in a separate `src/lib/content/project-story.ts` shared helper, record the
  reason in the PR body, and do not stop the chore.
- **Relative-path slips in moved tests.** One extra `../` is easy to miss in `new URL()` and
  `fileURLToPath` paths. Each item runs the full unit suite, and a wrong path fails loudly.
- **Test count drift.** Each item must end at 2911 tests; a dropped `describe` in a split would
  show as a lower number. Compare counts after every item.
- **Parallel work.** Sibling worktrees may edit `.claude/skills/content/SKILL.md` or the same
  docs. Conflicts are text only. Sibling Playwright servers do not affect these unit and type
  checks; CI is the gate.
- **Name of the new folder.** `src/content/collections/` sits beside the content folders. No
  collection is named `collections`, and the loader bases name each content folder explicitly, so
  no glob reads it.
