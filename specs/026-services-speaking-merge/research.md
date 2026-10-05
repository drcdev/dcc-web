# Research: One Page for Services and Speaking

**Feature**: `026-services-speaking-merge` | **Date**: 2026-10-05 | **Plan**: [plan.md](./plan.md)

The spec's clarifications settled the name, address, order, grouping and redirects. Nothing in
the Technical Context was left as NEEDS CLARIFICATION; the decisions below are how the plan
carries them out. Astro choices were checked through the Astro Docs MCP (`astro-docs`), which
was available.

## R1. Rename `services.mdx` or write a new file

- **Decision**: `git mv src/content/pages/services.mdx src/content/pages/work-with-me.mdx`, then
  move the speaking sections into it and `git rm src/content/pages/speaking.mdx`. The rename is
  its own commit with no content edits, so Git records it as a rename (100 % similarity) and
  `git log --follow` keeps the Services history. The content merge is the next commit. Both
  commits come after every test change is written and seen failing, and both sit inside one
  implementation task that is done only when the suite is green again (Principle I: the rename
  alone breaks the home link and launch config, so it is never a finished task by itself).
- **Rationale**: The merged page keeps more of Services (note, lead, three blocks, nav position
  2) than of Speaking, so it is the file the page descends from. Doing the rename before the
  content edit stops Git's similarity heuristic from losing the link when the file grows by the
  whole Speaking body.
- **Alternatives considered**: a fresh `work-with-me.mdx` plus deleting both files (loses the
  history on both); `slug:` front matter on `services.mdx` to publish it at `/work-with-me/`
  (Astro supports a custom `slug` per entry, docs: *Content collections → Defining custom IDs*,
  docs.astro.build/en/guides/content-collections/#defining-custom-ids), rejected because
  `docs/pages.md` promises "the file name is the address", the site's address and twin checks
  (`src/lib/content/addresses.ts`) are built on that rule, and the launch check reads pages by
  file id.

## R2. How the photo is shared

Update 2026-10-05: the merged page no longer shows the photo (Don removed the figure and the bio).
The decision below still holds for the file: it stays where it is for the home page.

- **Decision**: No change. The photo is already one file,
  `src/content/pages/images/don-coleman.jpg`. The home page uses it through its `intro.photo`
  front matter and the Speaking page through a relative Markdown image; the merged page keeps the
  same `![…](./images/don-coleman.jpg)` line inside the `<Figure>`. The file stays where it is and
  is not copied or moved.
- **Rationale**: Astro resolves relative image paths in content-collection front matter and in
  MDX against the entry's own folder and optimises both through `astro:assets` (docs: *Images →
  Images in content collections*, docs.astro.build/en/guides/images/#images-in-content-collections,
  and *Images → Images in Markdown files*). `work-with-me.mdx` sits in the same folder as
  `speaking.mdx` did, so the path is unchanged and both pages keep sharing one source file.
- **Alternatives considered**: moving the photo to `src/assets/` and importing it (more churn,
  no benefit); a copy per page (two files to keep in step).

## R3. Removing `/services/` and `/speaking/` with no redirects

- **Decision**: Deleting the page files is the whole removal. Pages are built by
  `src/pages/[...slug].astro` from the pages collection through `getStaticPaths()` (docs:
  *Content collections → Generating routes from content*,
  docs.astro.build/en/guides/content-collections/#generating-routes-from-content), so a removed
  entry produces no route. Cloudflare Workers static assets already serve the built not-found
  page with HTTP 404 for any unmatched address (`wrangler.jsonc` `assets.not_found_handling:
  "404-page"`), so `/services/`, `/speaking/`, their no-slash forms and anything below them get
  the not-found page. `public/_redirects` gains nothing.
- **Rationale**: Spec FR-007 and the Clarifications rule out redirects and stubs. Both platforms'
  first-party behaviour already gives the required result with no code.
- **Alternatives considered**: a 301 in `public/_redirects` (the site's usual convention for a
  moved page; Don decided against it because both pages are drafts and the site is not live
  under them); a stub page (ruled out by FR-007).

## R4. Sitemap

- **Decision**: No configuration change. `@astrojs/sitemap` lists the statically generated routes
  (docs: *@astrojs/sitemap*, docs.astro.build/en/guides/integrations-guide/sitemap/), so the
  removed pages drop out and `/work-with-me/` appears on its own. The existing `filter` in
  `astro.config.mjs` (it excludes the not-found page) is left alone.
- **Alternatives considered**: a `filter()` rule for the old addresses (redundant once the routes
  are gone).

## R5. Menu entry, label and the freed position 3

- **Decision**: `work-with-me.mdx` keeps `nav: { position: 2 }` and sets `title: Work with me`;
  the menu label defaults to the title, so no `nav.label` is needed. Position 3 stays empty.
  `mergeNavigation()` (`src/lib/content/navigation.ts`) sorts by position and only rejects
  duplicates, so a gap needs no code change. No reserved position (4, 5, 7) moves.
- **Fit**: the desktop header list (`max-w-5xl`, `gap-x-8`) loses two labels, "Services" and
  "Speaking", and one 2 rem gap, and gains "Work with me", so the row gets shorter, not longer.
  The phone menu stacks one link per line, so a three-word label fits at 390 px. The existing
  header E2E tests (`tests/e2e/shell.spec.ts`, `menu.spec.ts`, `no-js.spec.ts`) and the header
  and open-menu visual snapshots confirm both.
- **Alternatives considered**: renumbering About and the reserved entries to close the gap
  (moves reserved positions; the spec forbids it).

## R6. Copy that has to change (Don reviews every line)

Update 2026-10-05: Don reviewed and rewrote the page copy. The page file is the source of truth;
the list below records his final choices, not the earlier proposals.

- **Meta description**: "The talks Don Coleman gives and the consulting work he is considering
  taking on."
- **Order**: speaking comes first because Don takes speaking invitations now but is not
  contracting yet: Lead, Speaking topics, Past talks, Consulting, How I work, Kinds of work, What
  I don't do, call to action.
- **One lead**: a short intro that opens with speaking and says the consulting work further down
  is for later.
- **Consulting block**: holds the no-practice note (bold "A note before you read on:", saying he
  has no consulting practice today and the kinds of work are ones he is considering) and the
  healthcare-gaps paragraph (technology change comes apart between teams, not on the technology).
- **One call to action**: label "Get in touch", body "Tell me about your event, its audience and
  the date, or describe a project you're working on, and we can work out the rest." Links to
  `/contact/`.
- **Removed**: the "For event organizers" block, the bio and the photo with its caption and alt
  text. Don does not want a stock bio or his current role on the page; event organizers use the
  contact page. The photo file stays for the home page (R2).
- **Groups**: "Speaking topics" and "Kinds of work"; no `talk-topics` id.
- **What I don't do** has two items.
- Don edited the other copy himself, aiming at plain wording without obvious AI phrasing, so the
  offerings and blocks are no longer word for word from the old pages.
- The home page's "See how I can help" label is unchanged; only its `href` changes.

## R7. Visual baselines

- **Decision**: There are no Services or Speaking page baselines to replace: the visual project
  snapshots only the shell, the not-found page and the fixture site (see
  `.claude/skills/_shared/visual-baselines.md`). The baselines that show the header menu change
  instead, because the menu loses two entries and gains one:
  - `header-desktop-{light,dark}` (the full link row),
  - `menu-open-phone-{light,dark}` (the open phone menu),
  - `not-found-{desktop,phone}-{light,dark}` (full page, header included),
  - `sections-{desktop,phone}-{light,dark}` (fixture site full page; the fixture site builds the
    real pages, so its header has the real menu).
  `header-phone-*` shows the closed menu (site name and button only) and is expected not to
  change; `--update-snapshots` rewrites only images past the threshold, so an unchanged image is
  left alone. Element-scoped shots (post, story, cards, project rows, banners, contact form) do not
  include the header and must not change.
- Both platforms are refreshed: macOS with `pnpm run test:visual:update`, Linux with
  `pnpm run test:visual:update:linux` in Docker (ask Don to start Docker Desktop), CI label
  fallback only if Docker cannot start. Any diff outside the list above is a regression to fix.

## R8. Major-change classification

- **Decision**: Major change under Principle III, criterion *changes … navigation*: the header
  menu loses two entries, gains one with a new label, and the site's structure loses two pages.
  No other criterion applies (no dependency, integration or service; no contact-data handling; no
  cost; no CI, deployment or infrastructure configuration; no constitution amendment). The
  launch check's configuration file `setup/config.json` changes, but that is data for the setup
  checker, not CI or deployment configuration.

## R9. First-party options (Principle IV)

| Capability | First-party option | Used? |
|---|---|---|
| Page content and validation | Astro content collections, `glob()` loader, page schema | Yes, unchanged |
| Page route | `[...slug].astro` + `getStaticPaths()` | Yes, unchanged |
| Photo | `astro:assets` via relative image paths | Yes, unchanged |
| Sitemap | `@astrojs/sitemap` | Yes, unchanged |
| Not-found for removed addresses | Cloudflare Workers static assets `not_found_handling: "404-page"` | Yes, unchanged |
| Redirects | Cloudflare `_redirects` | Deliberately not used (FR-007) |

No custom code is added, so no first-party option is rejected.
