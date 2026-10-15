# Research: Interactive career timeline

Feature: `041-career-timeline` (issue #163). The Astro Docs MCP (`astro-docs`) was available and
was used for every Astro choice below; each decision names the page it rests on. Astro is 7.3.5.

## R1. Career content: one YAML file per step, `glob()` loader

- **Decision**: A new `career` content collection loaded with `glob({ pattern: "*.{yaml,yml}", base:
  "./src/content/career" })`, one YAML file per step. The entry id is the file name. A strict Zod
  schema from `astro/zod` validates each file.
- **Rationale**: Content collections are Astro's first-party way to hold structured content with a
  schema ([Content collections](https://docs.astro.build/en/guides/content-collections/), "The
  `glob()` loader"; [Defining the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema)).
  One file per step keeps Don's later edits small (adding a reflection part touches one file), and
  every schema error names the file, so FR-005's "error naming the step" comes free.
- **Alternatives considered**:
  - `file()` loader over one `career.yaml` ([The `file()` loader](https://docs.astro.build/en/guides/content-collections/#the-file-loader)).
    Rejected for the reason feature 040 recorded (040 research R1): in Astro 7.3.5 `file()` logs a
    missing file or a YAML parse error and carries on with no entries, so a broken file would build
    an empty timeline silently, against FR-005.
  - Markdown in `about.mdx` (a hand-written list of `<details>`). Rejected: no schema, so a missing
    scope or a broken post link would not fail the build (FR-005).
  - A TypeScript data module. Rejected: Principle VI (content is files Don edits, validated by a
    collection schema).

## R2. Related posts: `reference("posts")` plus a file-naming check

- **Decision**: `posts` is `z.array(reference("posts"))`. A pure check in
  `src/lib/content/career.ts` confirms each named post exists and is not a draft, and names the step
  file when it fails. It runs when the About page is built.
- **Rationale**: `reference()` is the first-party way to point one collection at another
  ([Defining collection references](https://docs.astro.build/en/guides/content-collections/#defining-collection-references)),
  but Astro validates a reference only when `getEntry()` reads it, and its error does not name the
  referring file ([`reference()`](https://docs.astro.build/en/reference/modules/astro-content/#reference)).
  This is the same split feature 040 used for reading paths and 015 for `replacedBy`.
- **Draft rule**: the spec makes a draft post a build error (FR-005, US2 scenario 4) in every build
  mode, not only production, so the timeline never links to a post that a production build would
  drop. This is stricter than reading paths (which hide drafts in production only); the spec asks
  for it.

## R3. Categories are fixed keys, not a free list

- **Decision**: A step holds `achievements: string[]`, `leadership: string[]` and
  `awards: { name, year, href? }[]`. The three keys are the three categories (FR-009). The filter
  offers "All" plus each category that at least one step uses (US3 scenario 7).
- **Rationale**: The strict object schema rejects any other key, which is how "a category not in
  the allowed list fails the build" is met (FR-005) without a second category registry. Awards count
  as items of the Awards category (Key Entities), so they need no separate tag.
- **Alternatives considered**: a generic `items: { category, text }[]` list with an enum. Rejected:
  more to type for Don, and awards would need a second shape anyway.

## R4. Periods as `YYYY-MM` strings

- **Decision**: `start: "2014-10"`, `end: "2016-09"` or `end: present`. Shown as
  "Oct 2014 – Sep 2016" or "Sep 2022 – present" inside `<time datetime="2014-10">`. Formatting uses
  `Intl.DateTimeFormat("en-CA", { month: "short", year: "numeric", timeZone: "UTC" })`, with the
  output pinned by a unit test.
- **Rationale**: The spec gives month precision only. A month string avoids YAML's date coercion
  (a bare `2014-10-01` becomes a `Date`), and `YYYY-MM` is a valid `datetime` value.
- **Rules**: start must be a real month, end must not be before start. Steps sort by start, then by
  file id for a tie (deterministic).

## R5. Which step is the "current role"

- **Decision**: The current role is the step with the latest start. It must have `end: present`
  and must not have `nextMove` (FR-003, edge case). Other steps may end `present` (the CCHL board
  role does).
- **Rationale**: The spec defines the timeline as ending with the current role (FR-001) and orders
  by start date. A separate `current: true` flag would be a second source of truth that can
  disagree with the order.
- **Open point for Don**: when Don leaves the CCHL board, he changes its `end`; nothing else moves.

## R6. Open and close: native `<details>`/`<summary>`

- **Decision**: Each step is an `<li>` holding a `<details>` whose `<summary>` is the summary line
  (role, organization, period). No script is needed to open or close a step.
- **Rationale**: Native disclosure works with JavaScript off (FR-007, Principle V), is keyboard
  operable, and exposes expanded/collapsed state to assistive technology. The site already uses
  this pattern for the self-assessment (`SelfAssessment.astro`, feature 037), including its print
  rule `print:details-content:block`, which FR-018 reuses. Astro has no disclosure component; the
  first-party option is the HTML element itself.
- **Alternatives considered**: a framework island (React/Preact) or a button with `aria-expanded`.
  Rejected: needs JavaScript for core content.

## R7. Filter: a custom element, revealed only once it runs

- **Decision**: `<career-timeline>` custom element defined in the component's processed `<script>`,
  following `ProjectFilter.astro`: the server renders the controls and the status line `hidden`; the
  element un-hides them in `connectedCallback`, so without JavaScript the filter is absent
  (FR-014). Buttons use `aria-pressed` (single choice, "All" pressed by default). A
  `role="status"` `aria-live="polite"` line announces the count after each change (FR-013). The
  choice is not written to the address (Assumptions).
- **Rationale**: Astro's documented pattern for interactivity without a UI framework is a processed
  `<script>` with a custom element, data passed through `data-*` attributes
  ([Scripts and event handling](https://docs.astro.build/en/guides/client-side-scripts/), "Web
  components with custom elements" and "Pass frontmatter variables to scripts"). Astro bundles and
  deduplicates the script and inlines it when small. No `client:*` island and no framework package.
- **Behaviour**: choosing a category sets `open` on each matching step's `<details>`, marks its
  matching list items `data-match`, and sets `data-muted` plus `open = false` on every other
  step. "All" clears both and closes every step (FR-012). The visitor can still open a muted
  step; it stays muted until the filter changes. (The attribute was `data-dithered` before the
  2026-10-15 review; it is renamed with the treatment, R8.)
- **Pure logic** (`src/lib/content/career-filter.ts`): which categories are used, which steps match,
  and the status sentence. Unit-tested; the client script imports it.

## R8. Muted steps: two CSS-only candidates, no pattern (revised 2026-10-15)

- **Superseded decision**: the first build gave a non-matching step's summary row a CSS
  `radial-gradient` dot pattern ("dither") behind solid-backed text. Don reviewed it on the
  preview on 2026-10-15 and found it visually awkward; it is dropped (spec Clarifications,
  session 2026-10-15).
- **Decision**: A non-matching step is collapsed and **muted** (spec FR-011): visibly
  de-emphasised with plain CSS from the Tailwind theme tokens, no background image, no pattern,
  no `opacity`, text at WCAG AA contrast against the solid colour behind it. The state attribute
  is `data-muted` (renamed from `data-dithered`). Two candidates are built and shown to Don, each
  as its own commit so Cloudflare's per-commit preview URL shows it alone; there is no runtime
  switch (spec FR-011a). After the pick, the other candidate is reverted.
  - **Variant A, "Muted + side rule"**: the muted step's row gets a soft solid muted tint and a
    faint dashed left timeline rule; text keeps its normal colour and weight. A matching step
    gets a solid accent left rule. Non-colour cue: dashed against solid rule. Text contrast is
    measured against the tint (a solid colour, so axe measures it). The rule's dashes keep at
    least 3:1 against the page background (WCAG 1.4.11). Forced colours: the dashed rule stays,
    drawn in `CanvasText`; the tint drops.
  - **Variant B, "Compact one-line rows"**: the muted step's summary shows marker, role,
    organization and period on a single line, in a smaller size and a muted text token that
    still meets 4.5:1 in each theme; no background treatment. Matching steps stay full size.
    Non-colour cue: the size and layout change, which survives forced colours. The line wraps
    rather than clips at 320 px and 200% text zoom (FR-017). Opened, the step's content shows at
    full size.
  - Both: print removes the muting (FR-018); the focus ring is never covered (FR-017); the
    disclosure marker stays inline with the role title (FR-007b).
- **Rationale**: The site's Tailwind theme is its design system (Technology Constraints); borders,
  solid tints and font sizes come from existing tokens with no image file and no new package.
  Solid colours keep contrast measurable by axe, which a patterned background did not allow
  without a solid text backing. Showing the two candidates on separate commit previews lets Don
  compare the real page without shipping switch code.
- **Alternatives considered**: keep the dot pattern. Rejected by Don on the preview. `opacity` or
  a grey text colour below AA. Rejected: lowers text contrast (FR-011 forbids it). An SVG or PNG
  halftone. Rejected: an asset request, and the pattern itself was the problem. A query-string or
  cookie switch between A and B. Rejected: runtime code that would ship only to be removed.

## R9. Highlight of matching items

- **Decision**: A matching list item gets `data-match`, styled with a 3 px rust left border, a
  bold weight and a light tint, so the highlight is not colour alone. Each highlighted item sits
  inside its opened step, directly under that step's summary line (role, organization, period), so
  the item's role and organization are shown with it (FR-010, SC-003) without repeating them on
  each item. For assistive technology the list heading names the chosen category and the item
  sits inside the disclosure named by its role and organization, so no hidden text is added
  (spec FR-010).
- **Settled**: spec FR-010 (checklist pass) confirms the summary line is the item's role and
  organization context; no per-item line is added.

## R10. Labels and headings

- **Decision**: The section heading is an `h3`, "Career", because it sits inside "About me" (an
  `h2`) beside "Recognition" (an `h3`). Detail parts render as a `<dl>`: "Scope", "Key decision",
  "What changed in how I worked", "What I wish I'd known", "The skill that led to the next move".
  Lists render under `h4` headings: "Achievements", "Leadership", "Writing", "Awards". First person
  matches the About page's voice. All labels are listed as a `[PREVIEW-CHECK]` for Don (FR-020).
- **Rationale**: Headings may not go inside `<summary>` (its role overrides them), so the steps are
  list items, not headings, and the parts use a description list.

## R11. Placement on the About page

- **Decision**: A new body section, `<CareerTimeline />`, joins the closed section registry
  (`src/components/sections/index.ts`, `schemas.ts`). `about.mdx` places it after the "About me"
  list and before "### Recognition", and loses the "Leadership" list line (FR-016).
- **Rationale**: The same pattern as `<Now />` and `<StartHere />` (feature 040): components passed
  to MDX content ([MDX: passing components to MDX content](https://docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content)).

## R12. Fixture builds

- **Decision**: The real step files name real posts, which every fixture build removes. So both
  harnesses (`tests/build/fixture-site.ts` and `scripts/build-fixture-site.ts`) delete the copied
  `src/content/career/` files (`tests/build/fixture-site.ts` keeps them only with `realPosts`, as
  it does for reading paths). The Playwright fixture site installs fixture step files from
  `tests/fixtures/career/` that name fixture posts (`every-part`, `text-only`). Its `/about/` page is
  the real `about.mdx` with that fixture timeline. With no step files the section renders nothing.
- **Rationale**: Same approach as 040 R8 (reading paths). This is the main implementation risk;
  land it with the collection, before the component.

## R13. Cost and platform

- **Decision**: No Cloudflare or Fly.io feature is involved: the timeline is prerendered HTML served
  as Workers static assets. Expected new monthly cost: **$0**.
