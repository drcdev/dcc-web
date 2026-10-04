# Research: Retired status for projects

Feature: `specs/015-project-retired-status/spec.md` (GitHub issue #50). The Technical Context
had no open NEEDS CLARIFICATION items after the two clarify rounds; this file records the
design decisions, the Astro documentation behind each one, and what was rejected.

Astro Docs MCP (`astro-docs`) was available and was consulted for R2 and R3. Installed
versions: `astro` 7.3.5, `@astrojs/mdx` 8.0.2, Zod 4 through `astro/zod`.

## R1. Status value: add `retired` to the existing enum

- **Decision**: `status: z.enum(["shipped", "experiment", "in-progress", "retired"])` in
  `src/content/schemas/project.ts`. The allowed list, the labels ("Retired") and the pill
  tones move into one small module, `src/lib/content/project-status.ts`
  (`projectStatuses`, `ProjectStatus`, `statusLabel`, `statusTone`), so the schema,
  `StatusPill`, `StoryHeader`, `ProjectRow` and `ProjectLayout` share one type instead of
  four hand-copied unions.
- **Rationale**: FR-001. The collection schema is Astro's first-party validation; an unknown
  status already fails the build naming the file (contract row S02, run row 03).
- **Docs**: docs.astro.build/en/guides/content-collections/#defining-the-collection-schema.
- **Alternatives**: a separate `retired: true` boolean beside `status` (rejected: a retired
  project would also carry "shipped", and the spec says the pill shows "Retired" *instead of*
  "Shipped"); a free-text status (rejected: Principle VI wants invalid content to fail).

## R2. Replacement: one optional `replacedBy` object, project part via `reference()`

- **Decision**:

  ```yaml
  replacedBy:
    project: minimal          # another project on the site, by file name, or
  replacedBy:
    name: Cadence             # anything off the site, with an optional
    href: https://example.com # https address
  ```

  Schema: `replacedBy: z.strictObject({ project: reference("projects").optional(), name:
  text.optional(), href: httpsUrl.optional() }).optional()`, with `superRefine` rules for
  "exactly one of project or name", "href only with name" and "only a retired project".
  `reference` is imported from `astro:content` in `src/content/schemas/project.ts`. A probe
  run during planning confirmed `reference("projects").parse("tempo")` works in the vitest
  `unit` project (`getViteConfig` resolves `astro:content`), so the schema unit tests keep
  calling `projectSchema({ image })` unchanged.
- **Rationale**: FR-006 asks for exactly one of two forms. One strict object with refinements
  gives plain messages that name `replacedBy` ("needs either project or name, not both");
  a Zod union of two strict objects reports only "Invalid input", which fails Principle VI's
  "clear error". `reference()` is Astro's first-party way to point one entry at another and
  types the value as `{ collection, id }`.
- **Docs**: docs.astro.build/en/guides/content-collections/#defining-collection-references;
  docs.astro.build/en/reference/modules/astro-content/#reference.
- **Where reference() falls short (Principle IV)**: the reference page says "Validation of
  referenced entries happens at runtime when using `getEntry()` or `getEntries()`", and
  Astro's implementation (`createReference` in `astro/dist/content/runtime.js`) only reshapes
  the value; a missing or self reference passes the schema. `getEntry()` returns `undefined`
  without naming the file. So a small check, R3, adds the existence and self rules and names
  the file.
- **Alternatives**: a plain slug string with our own lookup (rejected: re-implements
  `reference()`); `replacement:` as a bare string meaning "project if it exists, else a
  name" (rejected: a typo in a project name would silently become plain text, which defeats
  "checked at build time"); a union of two objects (rejected above).
- **Field name**: `replacedBy` reads as the sentence the note prints ("It was replaced by
  ..."), and matches the camelCase of `standIn`.
- **Guide test**: `tests/unit/content/projects-guide.test.ts` walks every key of the schema
  and requires each in `docs/projects.md`. Walking into `reference()` would find its internal
  keys (`id`, `collection`, `slug`), so the walker treats a `reference()` value as a leaf.
  This is a test change made in the same task as the schema change, not a weakened check: the
  real settings (`replacedBy`, `project`, `name`, `href`) are still required.

## R3. Existence and self checks run in the story route, over every entry

- **Decision**: a pure function `checkReplacements(entries)` in
  `src/lib/content/project-replacement.ts` throws `projectFileError(file, ...)` when a
  `replacedBy.project` names no entry (drafts count as entries) or names the entry itself.
  It is called in `src/pages/projects/[slug].astro` `getStaticPaths()`, right after the loop
  that runs `validateProjectStory` on every entry, drafts included. The same module exports
  `resolveReplacement(entry, all, publishedIds)`, which returns `{ name, href? }` for the
  note (R4).
- **Rationale**: FR-008 and SC-003. The route already loads the whole collection to check
  every body, including drafts, so a broken draft fails the production build too (the
  pattern of contract rows T06 and R05). A pure function gets the logic unit test; one build
  run proves the call site (docs/testing.md "Check functions and call sites").
- **Docs**: docs.astro.build/en/guides/content-collections/#generating-routes-from-content
  (`getStaticPaths` over `getCollection`); docs.astro.build/en/guides/content-collections/#accessing-referenced-data
  (looking a reference up by its `id`). The route looks the id up in the collection it has
  already loaded rather than calling `getEntry()` once per project; the result is the same
  and the check stays a pure function.
- **Alternatives**: in the glob loader's `generateId` (rejected: it sees one file at a time,
  not the collection); in `content.config.ts` schema (rejected: a schema cannot see other
  entries).

## R4. Linking rule for the note

- **Decision**: `resolveReplacement` returns:
  - `project` reference: `name` is the target's `title`; `href` is `/projects/<id>/` only
    when the id is in this build's published set (`getPublishedProjects(process.env)`, which
    leaves drafts out of production only). A draft target in production gives a name with no
    link; in every other build it links.
  - `name` with `href`: both, as written.
  - `name` alone: name only.
  - no `replacedBy`: `undefined` (the note mentions no replacement).
- **Rationale**: FR-007 and the clarify answer on drafts in production. The rule is pure, so
  each branch is a unit test; the draft-in-production branch also needs the real build, so
  it is asserted once in `tests/build/drafts.test.ts`, whose production and preview builds
  already exist (no new build).

## R5. Where the note sits and what it says

- **Decision**: `StoryHeader` gets a `replacement?: { name: string; href?: string }` prop and,
  when `status === "retired"`, renders inside `<header data-story-header>`, after
  `data-story-meta`:

  ```html
  <p data-retired-note><strong>Retired.</strong> I no longer use or maintain this project.
  It was replaced by <a href="...">Name</a>.</p>
  ```

  The second sentence appears only with a replacement; the name is a plain same-tab `<a>`
  (the BuildLinks convention) or plain text. The route computes `replacement` and passes it
  through `ProjectLayout` to `StoryHeader`.
- **Rationale**: FR-005 fixes the wording; the spec's Assumptions put the note with the
  header so it is read before the story. Inside the header keeps it in one element shot for
  the visual project (R7). Static HTML, no script: FR-010.
- **Styling**: `[data-retired-note]` in `src/components/project/portfolio.css`, built from the
  existing mauve tokens to echo the pill (`border-l-4 border-mauve-700 pl-4 text-dusk-900`,
  dark `border-mauve-300 text-mist-100`); no new tokens. Contrast checked by `a11y`.
- **Alternatives**: a separate `RetiredNote.astro` (rejected: one paragraph, used once; the
  StoryHeader component test covers it); per-project note text (rejected in clarify).

## R6. The filled mauve pill tone

- **Decision**: `Pill.astro` gains `tone: "mauve"`:
  `border-mauve-800 bg-mauve-50 text-mauve-950 dark:border-mauve-300 dark:bg-mauve-800
  dark:text-mauve-100`. `statusTone.retired = "mauve"`.
- **Rationale**: the clarify answer fixes light (mauve-50 / mauve-800 / mauve-950) and dark
  ("filled mauve-800/900 background with mauve-100 text"). Mauve-800 (20% lightness) is
  chosen over 900 (10%) because the page background `dusk-900` is also 10% lightness, so
  900 would not read as a fill. The dark border follows the other tones' `-300` border.
  Contrast estimate: mauve-950 on mauve-50 and mauve-100 on mauve-800 are both above 10:1
  (palette lightness 5/95 and 90/20 at about 6% saturation), well above AA 4.5:1; the
  `a11y` project confirms it. The tokens already exist (`src/styles/global.css`
  `--color-mauve-*`), so no palette change.
- **Major change**: a new tone in the shared pill changes the design system (Principle III).
- **Alternatives**: the neutral tone (rejected: the theme pills beside it are neutral, so the
  status would not stand out); grey `mist` (rejected in clarify for mauve).

## R7. Fixture coverage and visual baselines

- **Decision**: add one fixture project, `tests/fixtures/projects/retired.mdx` (title
  "Retired project", `status: retired`, `replacedBy: { project: minimal }`, theme
  `Automation`, date `2025-01-01`, four parts copied from `minimal.mdx`, not a draft). The
  fixture site (`scripts/build-fixture-site.ts`, served on port 4322) copies every file in
  `tests/fixtures/projects/` except `broken/`, so it appears there with no script change.
- **Why the fixture site must gain it**: the visual project snapshots only the shell, the
  not-found page and the fixture site, and a template change must be seen there. Without a
  retired fixture no snapshot shows the new tone or the note.
- **Date and theme**: `2025-01-01` is older than every other fixture (oldest now
  `every-setting`, 2025-06-01), so the new row sorts last among the fixtures and the
  `minimal` and `every-setting` row shots keep their position. `Automation` is already on
  `every-setting`, so no new theme button appears and the Tooling filter counts (2) in
  `projects-fixtures.spec.ts` are unchanged.
- **Visual subjects added** to `FIXTURE_SUBJECTS` in `tests/e2e/visual.spec.ts`:
  - `project-row-retired`: `/projects/`, `li[data-project="retired"]`, after
    `onlyFixtureRows` (with `"retired"` appended to `FIXTURE_PROJECTS`);
  - `retired-story-header`: `/projects/retired/`, `header[data-story-header]` (pill and note
    in one element).
- **Predicted baseline changes**: 16 new images, no changed images.
  - New, per platform (`darwin` and `linux`): `project-row-retired-{phone,desktop}-{dark,light}-visual-<platform>.png`
    and `retired-story-header-{phone,desktop}-{dark,light}-visual-<platform>.png`
    (8 per platform). Total committed baselines go from 100 to 116 (58 per platform).
  - Unchanged: shell (`header-*`, `footer-*`, `menu-open-*`), `not-found-*`, `sections-*`,
    `post-template-*`, `story-template-*` (the every-part fixture is not retired),
    `lead-story-*`, `listing-cards-*`, `series-banner-*`, `project-row-minimal-*`,
    `project-row-every-setting-*`, `contact-form-*`. Any diff in these is a regression to
    fix, not a baseline to refresh.
  - Refresh with `pnpm run test:visual:update` (macOS) and `pnpm run test:visual:update:linux`
    (Docker Desktop; fallback: the `visual-baselines` PR label and the
    `visual-baselines-linux` artifact, copying only `*-linux.png`). `--update-snapshots`
    writes only missing images and those past the threshold, so the unchanged set staying
    untouched in `git status` is itself the check.
- **Alternatives**: four retired fixtures, one per replacement form (rejected: the forms are
  props-level differences already proven by component and unit tests; one fixture gives the
  visual, a11y and link journey everything it needs, and each extra fixture row changes
  counts in other specs); making `every-part` retired (rejected: changes the
  `story-template-*` baselines and the meaning of an existing fixture).

## R8. Real content: Tempo

- `src/content/projects/tempo.mdx` is published (`draft: false`, `status: shipped`). It
  becomes `status: retired` with `replacedBy: { name: Cadence }` (no `href`), so the public
  index row shows "Retired" and the story shows "**Retired.** I no longer use or maintain
  this project. It was replaced by Cadence." Its slug, date, order and publication do not
  change, so `/projects/tempo/` stays in every list that enumerates published pages.
- The MDX comment at the top of Tempo's body mentions issue #50; it is updated to say the
  status is set and to point `replacedBy` at Cadence once a Cadence project exists
  (spec follow-up).
- Focus Pocus's comment also says it is retired, but marking any other project retired is
  out of scope (spec "Out of Scope"); it stays `experiment`.

## R9. Hosting, Cloudflare, Fly.io, cost

- No Worker, D1, Turnstile, Cron or configuration change: the pages stay prerendered static
  assets served by Workers static assets (Principles V, VIII). Fly.io is not part of the
  stack (removed in feature 004), so there is nothing to consider there.
- No new dependency. Expected new monthly cost: **$0** (Principle IX).
