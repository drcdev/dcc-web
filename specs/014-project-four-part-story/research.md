# Research: Simplify the project pages to a four-part story

**Feature**: `014-project-four-part-story` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

The Astro Docs MCP server (`astro-docs`) was available and was used for every Astro decision
below; the page each decision rests on is cited. Where the docs are silent, the installed
package source (`node_modules/astro` 7.3.5, `@astrojs/mdx` 8.0.2, `satteri` 0.10.5) was read and
that is said explicitly.

## What exists today (starting point)

- `src/content.config.ts` loads `projects` with `glob({ pattern: "**/*.{md,mdx}", base:
  "./src/content/projects" })`; `generateId` runs `slugFromPath` and `assertProjectImagesExist`.
- `src/content/schemas/project.ts` is strict and carries `order`, `demo` (with `embed`),
  `standIn`, `source`, `visual` (list picture), `visuals` (named image / diagram / clip) and the
  structured `comparison` (constraints, options with `fit`, `pros`, `cons`, `chosen`,
  `reason`).
- `src/pages/projects/[slug].astro` checks every entry (drafts included) with
  `validateProjectBody` (`src/lib/content/project-body.ts`, a string scanner over seven
  `<Chapter>` stages) before filtering drafts, then renders `<Content components={{
  ...sectionComponents, ...storyBlockComponents }} />` inside `ProjectLayout`.
- Story blocks in `src/components/project/blocks/`: `Chapter`, `Visual`, `OptionComparison`,
  `Demo` (links and the embedded frame), `Invitation`, with `context.ts` / `schemas.ts`.
  `src/lib/content/stages.ts` holds the seven stages; `src/lib/content/demo-csp.ts` widens the
  page CSP for an embedded demo.
- `StoryHeader.astro` renders the "In this story" contents list; `portfolio.css` has the
  chapter grid (`min-height: 60svh`, 10px stage rule), the reveal animation and the table
  styles. Post bodies use `prose lg:prose-lg dark:prose-invert prose-accent max-w-3xl`
  (`src/layouts/PostLayout.astro`).
- Five projects: `focus-pocus.mdx` (`draft: false`) and four migrated drafts. None uses
  `order`, `demo.embed`, a clip or a page section; all use `pros`/`cons` and `comparison`.
- **Finding**: today's comparison cells are **not coloured**. `OptionComparison.astro` writes
  `data-fit` plus a ✓ / ~ / ✗ mark and the word, and no CSS rule targets `data-fit`. FR-007's
  "the site's existing comparison colours" therefore has no existing source; see R6.

## R1. Where the options-table and part check runs, and how it reads the body

**Decision**: A pure function `validateProjectStory(file, body)` in
`src/lib/content/project-story.ts` replaces `validateProjectBody`. It parses the MDX body with
`mdxToMdast` from `satteri` (the Markdown processor Astro itself uses here, already a direct
dependency) and walks the real mdast: `heading`, `list` / `listItem`, `table` / `tableRow` /
`tableCell`, `strong`, `paragraph`, `mdxJsx*`, `mdxjsEsm`, `mdxFlowExpression`. It returns the
parsed `OptionsComparison` (see data-model.md) or throws `projectFileError(file, rule)`. The
call site stays where it is: `getStaticPaths()` in `src/pages/projects/[slug].astro`, over
`getCollection("projects")` **before** drafts are filtered, so a broken draft fails the
production build (US3-7, FR-015). The parsed comparison is passed to the page as a prop, so the
body is parsed once per entry and the table is rendered from exactly what was checked.

**Rationale**: The rules (bold cell, partial bold, table count, list item labels) are
structural; the real parser removes the edge cases a line scanner gets wrong (escaped pipes,
inline code, comments). A probe confirmed `mdxToMdast` yields `table` → `tableRow` →
`tableCell` → `strong` for `| **A thing** | yes |` and keeps `{/* … */}` as
`mdxFlowExpression`. Keeping the route call site means the existing build-test wiring pattern
("rows 09 to 11") carries over unchanged.

**Alternatives considered**:
- *Zod schema on the body*: the collection schema sees only frontmatter
  (docs.astro.build/en/guides/content-collections/#defining-the-collection-schema).
- *Check in `generateId`* (as posts do with `readFileSync`): would fail at `sync`, but the
  route still needs the parsed table to render it, so the body would be parsed twice and the
  logic split across two call sites.
- *Keep the regex scanner of `project-body.ts`*: cannot tell a fully bold cell from a
  partially bold one or count list items reliably.

**Rules the check enforces** (contract rows in [contracts/build-errors.md](./contracts/build-errors.md)):
exactly four level-2 headings, text `Problem`, `Options`, `Build`, `Lessons` in that order
(missing / renamed / repeated / out of order each named); no level-1 heading; level-3+
headings allowed; no MDX element, import or export (any `<Tag>` fails naming the tag; MDX
comments allowed, so review notes stay, FR-024); no body image (pictures go in `visuals` with a
`part`, FR-005 / FR-016); in Options exactly one table; first header cell names the option
column (any text, non-empty); remaining header cells are the constraints; every body cell after
the first is `yes` / `partly` / `no`, case-insensitive; exactly one row whose first cell is
**entirely** one `strong` node; the first block after the table is a paragraph whose text
starts with `Why`; a list exists before the table in Options whose every item starts with a
`strong` label followed by `:`, and the labels equal the constraint headers in name and order.
A table in another part is not checked.

## R2. Wrapping plain headed text into parts on the page

**Decision**: A Sätteri mdast plugin, `projectPartsPlugin` in
`src/lib/markdown/project-parts.ts`, registered beside the reading-time plugin in
`astro.config.mjs` (`satteri({ mdastPlugins: [readingTimePlugin, projectPartsPlugin] })`). Its
factory returns `null` unless the compile's `fileURL` lies under `src/content/projects/`, so
posts and pages are untouched. For a project body it (a) groups each level-2 heading and the
siblings up to the next level-2 heading into an `mdxJsxFlowElement` named `ProjectPart` with
`name="problem|options|build|lessons"`, and (b) replaces the first table inside the Options
group with an `mdxJsxFlowElement` named `OptionsTable`. The route passes
`<Content components={{ ProjectPart, OptionsTable }} />`, the same "components to MDX
content" mechanism the `<Chapter>` blocks use today
(docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content). MDX
inherits `markdown.processor` (`@astrojs/mdx` 8 `MdxOptions.processor`: "Defaults to
`config.markdown.processor`"; the docs page for the Sätteri processor is
docs.astro.build/en/guides/markdown-content/ and the plugin pattern follows
docs.astro.build/en/recipes/reading-time/).

`ProjectPart.astro` renders `<section data-part={name} aria-labelledby>` with a text column
(the slot, inside the post prose classes) and, when the project's `visuals` assign a picture to
that part, a picture column; for `build` it appends the links block (R7). `OptionsTable.astro`
renders the checked comparison from `Astro.locals.project.comparison` (R6).

**Rationale**: Placing a picture beside a part on wide screens and below it on phones needs a
container per part; only a tree transform can make one from plain headings. The writer keeps
writing plain Markdown (settled decision) while the page gets real sections.

**Alternatives considered**:
- *MDX element overrides alone* (`h2`, `table`, `td`): an override wraps one element, never a
  heading plus its following siblings, and a `td` override cannot see its row.
- *CSS only* (floats or grid on a flat body): the picture would sit above the text on phones or
  needs to know how many blocks the part spans.
- *Hand-placed wrappers*: rejected by the settled decisions (no `<Chapter>`).

**Risk and fallback**: Sätteri's mdast mutation API (`wrapNode`, `replaceNode`,
`insertChildAt`) is documented in its type definitions but not on docs.astro.build. The first
implementation task is a spike that builds one project with the plugin and checks that
`ProjectPart` and `OptionsTable` resolve through `components`. Fallback if a plugin-created
JSX element is not resolved: a hast plugin (`defineHastPlugin`) wraps parts in
`<section data-part>` and the route overrides `section` and `table` through the same
`components` prop.

## R3. Keeping `_template.mdx` out of the collection

**Decision**: Change the loader pattern to `["**/*.{md,mdx}", "!**/_*"]` and the route's
duplicate-file glob to `["/src/content/projects/**/*.{md,mdx}", "!/src/content/projects/**/_*"]`.

**Rationale**: The settled decision assumes the glob loader ignores underscore files. It does
not in Astro 7.3.5: the docs describe underscore exclusion only for `src/pages/` routes
(docs.astro.build/en/guides/routing/#excluding-pages), and the loader source passes the pattern
straight to `tinyglobby` with no underscore filter. The loader's `pattern` accepts a string or
array in micromatch syntax (docs.astro.build/en/reference/content-loader-reference/#pattern),
and its source splits `!`-prefixed entries into ignore patterns. Without this, `slugFromPath`
would reject `_template` as a bad file name. The decision itself (an underscore template beside
the projects) is honoured; only the mechanism is explicit.

**How the template is still checked** (spec Assumptions, FR-020): a unit test reads
`src/content/projects/_template.mdx`, parses its frontmatter with `projectSchema` (stub image
helper, as the schema tests do) and its body with `validateProjectStory`; a build test copies
the template to a new name in the fixture site and builds it (SC-003). A build test also proves
that a site containing `_template.mdx` builds with no `/projects/_template/` page.

**Alternatives considered**: keep the template in the collection and filter `_` ids out of the
list and routes. Rejected: every consumer (index, route, sitemap, asset pruning, setup check)
would need the special case, and `slugFromPath` would need an exception.

## R4. Settings removed, kept and added

**Decision** (schema stays `strictObject`, so any removed key fails naming the key, FR-017):
- Removed: `order`; `demo.embed` (the embedded form); visual kind `clip` (with `poster`,
  `label`); the whole `comparison` object (with `pros`, `cons`, `fit`, `chosen`, `reason`,
  `caption`).
- Kept: `title`, `problem`, `description`, `themes`, `status`, `visual` (list picture),
  `demo` (`href` on drc.dev, optional `title`), `standIn`, `source`, `image` (sharing image),
  `draft`, `visuals` (image / diagram, with `placeholder`).
- Added: `visuals.<name>.part` (optional enum `problem | options | build | lessons`;
  `superRefine` rejects two pictures on one part, naming both); `invitation` (optional
  string, trimmed; empty means "use the standard sentence").
- Changed: `date` becomes required, because ordering is now date-then-title only (FR-018) and
  every existing project and the template have one.

**Rationale**: Smallest schema change that satisfies FR-012, FR-017 and FR-018, keeps field
names the five projects already use, and gives a clear Astro error (`visuals.x.part`,
`order: Unrecognized key`) through the existing schema call site.

**Alternatives considered**: renaming `visuals` to `pictures` (churn for no reader benefit);
keeping `date` optional (a dateless project would sort by a rule the spec does not state).

## R5. Ordering

**Decision**: `selectPublishedProjects` sorts by `date` descending, then `title`
(`localeCompare`). The `order` branch is deleted. Sorting is done by hand, as the docs require
(docs.astro.build/en/guides/content-collections/#querying-build-time-collections: "The sort
order of generated collections is non-deterministic").

## R6. Rendering the options table

**Decision**: `OptionsTable.astro` renders, inside the existing keyboard-reachable scroll
region (`role="region"`, `tabindex="0"`, `aria-labelledby` the caption): a caption
("How the options compare for {title}"), a header row with the writer's first header text and
each constraint (`th scope="col"`), then one row per option with the option name as
`th scope="row"`; the chosen row carries `data-chosen`, the visible text "Chosen" and a heavier
row edge; each cell carries `data-fit="yes|partly|no"`, a decorative mark (`aria-hidden`) and
the word ("Yes", "Partly", "No"). Rows are options and columns constraints, as the writer
wrote them (FR-013), which is the transpose of today's table.

**Colours**: there are no existing comparison colours (finding above). The cells use existing
palette tokens only, so no design-token is added: `yes` sage, `partly` sand, `no` rust, as a
light tint background with dark text in light mode and a dark tint with light text in dark
mode, each pair at least 4.5:1 (checked by the axe run on the story template). Forced-colours
mode drops the tints and keeps the words and the chosen marker. This is a visual-identity
change and is covered by the major-change review.

**Alternatives considered**: render the Markdown table as written and colour it with a `td`
override (no row context, cannot mark the chosen row as a row); keep the old orientation
(contradicts FR-013's fixed shape).

## R7. Links with the Build part, and the closing invitation

**Decision**: `BuildLinks.astro` (the link half of today's `Demo.astro`) renders the demo link,
the stand-in link with "This is not a live demo." and the source link; `ProjectPart` places it
after the Build text only when at least one is set, so a project with neither has no empty list
(FR-008). `ProjectInvitation.astro`, rendered by `ProjectLayout` after the body, shows
`data.invitation` when it is a non-empty string, else the standard sentence "If you are
working on a similar problem, I would like to hear about it.", then the existing link
"Tell me about a problem like {title}" to `contactHref(slug)` (FR-009). The five projects'
current invitation paragraphs move into `invitation:` (FR-022).

## R8. Typography and spacing

**Decision**: Each part's text column uses the same classes as the post body (`prose
lg:prose-lg dark:prose-invert prose-accent`), shared through one exported constant so the two
cannot drift; the part heading is therefore the post `h2` (FR-003). Parts have no
`min-height`, no stage rule, no chapter number and no reveal animation; the gap between parts
is the prose `h2` top margin (FR-004). The picture column keeps today's `26rem` grid column at
`64rem` and up and drops below the text otherwise (FR-005). The contents list is removed from
`StoryHeader` (FR-003). List rows: `[data-project]` padding drops from `py-8` to `py-5` and the
grid gap from `4rem` to `2.5rem` (FR-021). The reading progress bar and the title view
transition are unchanged (FR-010).

## R9. What goes away with the chapters

Deleted: `src/components/project/blocks/` (all five blocks, `context.ts`, `schemas.ts`,
`index.ts`), `src/lib/content/stages.ts`, `src/lib/content/project-body.ts`,
`src/lib/content/demo-csp.ts` and the `allowDemoFrames` call, the clip size check in
`project-images.ts` (and `MAX_CLIP_BYTES`), the clip `assetsInlineLimit` rule in
`astro.config.mjs`, the clip glob in `Visual.astro` (the image/diagram part becomes
`PartPicture.astro`), chapter / reveal / stage CSS in `portfolio.css`, and the page sections
(`sectionComponents`) in project bodies. Tests that only exercised those go with them
(`Chapter`, `Demo`, `Invitation`, `OptionComparison`, `Visual` component tests;
`project-blocks`, `project-body`, `project-clips`, `stages` unit tests; the reveal cases of
`projects-motion.spec.ts`). Clip fixtures (`clip.webm`, `draft-only.webm`, posters) are removed.

## R10. All five projects as drafts

**Decision**: All five files get `draft: true`. Production then builds no project page and the
index shows `EmptyProjects` (US4-3). Nothing else links to a project page (checked: home page,
navigation, posts, `public/_redirects` only map `/projects/<slug>/privacy` to `/privacy/<slug>/`).
`tests/build/indexing.test.ts` moves `/projects/focus-pocus/` into the draft list.
`pruneDraftAssets` already removes draft-only images from production. The setup check
`launch-content-ready` skips drafts; the setup item that waits on published projects stays red
(spec Out of Scope).

Playwright's servers build in non-production mode (`src/lib/build-mode.ts`), so
`/projects/focus-pocus/` still exists there, with the draft notice, and stays the visual and
accessibility sample for the story template.

## R11. First-party options (Principle IV) at a glance

| Capability | First-party option | Used? |
|---|---|---|
| Project content and validation | Astro content collections, `glob()` loader, Zod schema with `image()` | Yes |
| Rendering MDX bodies with custom components | `@astrojs/mdx`, `render()` and `<Content components>` | Yes |
| Body transform into parts | Astro's Markdown processor plugin hook (Sätteri mdast plugin) | Yes (the code inside the plugin is custom; no first-party plugin wraps sections) |
| Table and part rules | None: Zod sees frontmatter only | Custom pure function over Sätteri's mdast |
| Pictures | `astro:assets` `<Image>` with `widths` / `sizes` | Yes (unchanged) |
| Template exclusion | `glob()` negated pattern | Yes |
| Hosting | Cloudflare Workers static assets | Unchanged; no new Cloudflare feature, no Fly.io |
