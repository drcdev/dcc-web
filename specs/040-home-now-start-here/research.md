# Research: Home page with a Now section and Start here reading paths

The Astro Docs MCP (`astro-docs`) was available and was used for every Astro decision. Each decision cites the
page it rests on. The project runs Astro 7.3.5.

## R1. Where the Now entry lives: a `glob()` collection of one Markdown file

- **Decision**: New collection `now`, `glob({ pattern: "*.md", base: "./src/content/now" })`, one
  file `now.md`. Strict Zod schema for the front matter. The body is the "open to" line.
  `getNow()` fails the build unless there is exactly one entry.
- **Rationale**: Content collections are Astro's first-party way to keep validated content as
  files (docs: *Content collections*, https://docs.astro.build/en/guides/content-collections/).
  The `glob()` loader gives Astro's own front matter errors. Its `generateId` hook lets us check the
  raw `updated:` text, because js-yaml rolls an impossible date such as 2026-02-30 over to a valid one.
  `assertPostDates` already handles that for posts.
- **Alternatives considered**: the `file()` loader with `now.yaml`
  (https://docs.astro.build/en/reference/content-loader-reference/#file-loader). Rejected. In
  `astro/dist/content/loaders/file.js` (7.3.5), a missing file or a parse error is only
  `logger.error`'d and the collection stays empty, and an array item with no `id` is skipped. A
  broken Now file would build silently, which FR-006 forbids. Front matter in `index.mdx` was also
  rejected: it would mix the Now entry into the page schema and make "update Now" an edit to the page settings.

## R2. Reading paths: one YAML file per path, `glob()` loader, `reference()` items

- **Decision**: New collection `readingPaths`,
  `glob({ pattern: "*.{yaml,yml}", base: "./src/content/reading-paths" })`. File name = id. Fields:
  `title`, `description`, `position` (1–4), and `items`, a list of 1–5 entries, each either
  `{ post: reference("posts") }` or `{ project: reference("projects") }`.
- **Rationale**: `glob()` loads YAML data files
  (https://docs.astro.build/en/guides/content-collections/#the-glob-loader). One file per path means
  adding or removing a path is adding or removing a file (FR-011). `reference()`
  (https://docs.astro.build/en/guides/content-collections/#defining-collection-references) is the
  first-party way to point at another collection's entry, and it types the item.
- **Order**: Astro does not promise any order for `getCollection()` results, so a required `position`
  sets the path order, the same rule as `nav.position` on pages. Items keep the order they have in the file (a YAML list).
- **Alternatives considered**: one `reading-paths.yaml` through `file()` was rejected for the reasons
  in R1. A TypeScript config module such as `src/config/reading-paths.ts` was rejected: editing it is
  a code change, against FR-011.

## R3. Missing and duplicate items: own check over `getCollection()`

- **Decision**: `checkReadingPaths()` in `src/lib/content/reading-paths.ts` is pure. It takes every
  path and the ids of **all** posts and projects, drafts included. It fails on a missing target, the
  same item twice in one path, more than four paths, or two paths with one `position`. Each message
  names the path file and the item.
- **Rationale**: the docs say reference validation "happens at runtime when using `getEntry()` or
  `getEntries()`" (https://docs.astro.build/en/reference/modules/astro-content/#reference). That
  error does not name the referencing file. `src/lib/content/project-replacement.ts` already works
  around the same gap the same way. The check runs against all entries, drafts included, so a path
  that points at a draft fails nowhere. The draft is only hidden in production (FR-013).

## R4. Reading time for posts and projects: reuse the existing plugin

- **Decision**: posts use `minutesRead` from `getPostSummaries()`, which is already cached per build.
  Projects use `(await render(entry)).remarkPluginFrontmatter.minutesRead`, kept per build in
  `getReadingPaths()`. A missing value throws with the same message style as `src/lib/posts.ts`.
- **Rationale**: `src/lib/markdown/reading-time.ts` follows Astro's recipe
  (https://docs.astro.build/en/recipes/reading-time/). It is registered globally in
  `astro.config.mjs` (`markdown.processor` mdast plugins), so it already runs for project MDX. The
  rule is the same 225 words a minute, rounded up, at least 1, which satisfies FR-010 and the "1 min read" edge case.
  A build test asserts that a fixture project gets a number.
- **Note**: a project's count covers its whole MDX body, the "story text" in the spec's assumption.
  Front matter is not counted.

## R5. Dates: real-day check and not-in-future check

- **Decision**: reuse the raw-text date check from `src/lib/content/post-dates.ts`. Extract a
  shared `assertRawDates(kind, file, source, keys)` or call it with the key `updated`. Add
  `assertNotFuture(kind, file, key, date, today)`, where `today` is the build's UTC date (injected
  for tests). Both run in the `now` collection's `generateId` / `getNow()`.
- **Rationale**: the site has no future-date rule for posts today, even though the spec's edge case
  implies one. This feature adds the rule for the Now entry only. Comparing in UTC is lenient for a
  build run from Pacific time, which is the safe direction.
- **Alternative**: `z.date().max(new Date())` in the schema. Rejected: the schema runs at sync,
  where "now" is harder to inject in tests, and the message would not name the file. The schema
  still validates the type.

## R6. Date format shown

- **Decision**: "Updated October 1, 2026", using the site's existing `formatDate()` (en-US, UTC)
  inside `<time datetime="2026-10-01">`.
- **Rationale**: consistency with every post date on the site. The checklist pass fixed spec FR-002
  and US1-AS1 to this form (they first gave "1 October 2026" as an example). Listed as a `[PREVIEW-CHECK]` so Don can ask for the day-month form if he prefers it.

## R7. Composing the page: two new registered sections

- **Decision**: `Now.astro` and `StartHere.astro` in `src/components/sections/`, registered in
  `sectionNames`, `sectionComponents` and `sectionSchemas` (no props). The home body is
  `<Now />`, `<StartHere />` and `<RecentWriting />`. Each component accepts an optional data prop
  (`now`, `paths`) that replaces the lookup, so component tests can feed it, as `RecentWriting` takes `posts`.
- **Rationale**: Passing components to MDX content
  (https://docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content) is
  how the page route already supplies sections. Keeping the order in `index.mdx` lets Don move a
  section without a code change.
- **Alternative**: rendering them from `PageLayout` when `home` is true. Rejected: it hides page
  structure in code, and the layout already has one home special case (the intro).

## R8. Fixture builds and real reading paths

- **Finding**: `tests/build/fixture-site.ts` removes the real posts by default, and
  `scripts/build-fixture-site.ts` (the Playwright site on port 4322) removes real posts and projects.
  The real path files point at real posts and projects, so every fixture build would fail with R04.
- **Decision**: `fixture-site.ts` deletes the copied `src/content/reading-paths/*.yaml` unless the
  test keeps the real posts and real projects. A new `readingPaths` option copies files from
  `tests/fixtures/reading-paths/`. `scripts/build-fixture-site.ts` replaces both the Now file and the
  path files with fixtures that point at fixture posts and projects, which gives the new visual shots
  stable input.

## R9. Markup and accessibility

- **Decision**: `<section aria-labelledby>` with an `h2` per section, an `h3` per path, `<ol>` for
  items, and `<dl>` for the Now topics. Each item shows its title link, "Project" (projects only)
  and "N min read". Colours and link styles come from the existing tokens used in `RecentWriting`,
  so contrast is already checked in both themes. No fixed widths, so 320 px does not overflow.
- **Rationale**: Principle X and FR-018. The heading order is h1 (intro), h2, h3, as required.

## R10. Testing layers (docs/testing.md "Where a test goes")

| Behaviour | Primary layer | Why that layer |
|-----------|---------------|----------------|
| Schema rules (required parts, 1–5 items, item shape, one-sentence description) | Unit | Pure Zod |
| Raw date / future date | Unit | Pure function with injected today |
| Missing / duplicate item, >4 paths, duplicate position | Unit | Pure check |
| Draft filter, empty path dropped, ordering | Unit | Pure resolver |
| Markup, labels, `<time>`, heading levels, "Project" label | Component | Container API |
| Error names the file through the real loader; parse error fails; production drops drafts; no files means no section; project gets minutes | Build | Only the real `astro build` shows these |
| Section order on the real home page, links resolve, no JS, 320 px | E2E | Journey and layout in a browser |
| axe / budget | Existing template lists (home already listed) | Template-level |
| Look in both themes and sizes | Visual (fixture site) | Template-level |
