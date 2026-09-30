# Research: Design directions for the portfolio

Phase 0 of the plan. Each entry records a decision, why it was made, and what else was
considered. Astro choices cite the page found through the Astro Docs MCP server (`astro-docs`),
which was available for this plan. No NEEDS CLARIFICATION items remain.

## R1. Where the prototypes live and how they are addressed

- **Decision**: Seven prerendered `.astro` route files under `src/pages/design/portfolio/`:
  a hub at `/design/portfolio/`, and for each direction `x` in `a`, `b`, `c` an index at
  `/design/portfolio/x/` and the Focus Pocus story at `/design/portfolio/x/focus-pocus/`.
  Their components, sample data and styles live in `src/prototypes/portfolio/`. Nothing is
  added to `src/components/`, `src/layouts/` or `src/content/`.
- **Rationale**: File-based routing is Astro's own way to add a static page
  (docs.astro.build/en/guides/routing/). `/x/focus-pocus/` mirrors the address the real
  story will probably have (`/projects/focus-pocus/`), so each direction reads like the real
  thing. Keeping every prototype file in two directory trees means removal deletes two
  folders whole, and keeps this feature disjoint from the parallel blog feature (expected
  at `src/pages/design/blog/` and, if it follows suit, `src/prototypes/blog/`). The existing
  address check (`src/lib/content/address.ts`) compares route files with page files only,
  and no page file uses `design/`, so the new routes need no change there.
- **Alternatives considered**: Pages as MDX in `src/content/pages/` (rejected: they would
  pass through the pages route, its section registry and `PageLayout`'s prose wrapper, and
  would add files to shared content); one dynamic `[direction]` route (rejected: three
  hand-built directions share little markup, and a dynamic route hides which file owns
  which direction).

## R2. Page shell: existing layout, tokens and components

- **Decision**: Every prototype page renders inside the existing `BaseLayout`
  (`src/layouts/BaseLayout.astro`) with `navigation={await getNavigation()}` and `noindex`,
  so the real header, footer, skip link, theme toggle and theme-init script are used
  unchanged. Prototype markup uses only the Tailwind tokens already in
  `src/styles/global.css` (dusk, rust, sage, lavender, mist, sand, mauve, accent) and the
  system font stack. `DraftNotice` (`src/components/page/DraftNotice.astro`) is reused at the
  top of each story. `PageLayout` is not used, because its single prose column is exactly
  what the directions vary.
- **Rationale**: FR-005 and the technical direction require the site's existing layout,
  palettes and fonts. `BaseLayout` already passes every `Seo` prop through, including
  `noindex`, so no shared file needs editing to keep the pages out of search (FR-007).
- **Alternatives considered**: A prototype-only layout (rejected: it would not show the
  direction inside the real site chrome and would duplicate the shell's accessibility work).

## R3. Keeping prototypes out of navigation, search and the sitemap (FR-007)

- **Decision**: Nothing is added to `src/config/navigation.ts`. Each page passes `noindex`
  to `BaseLayout`; the site already sends `X-Robots-Tag: noindex` from `public/_headers`.
  The sitemap integration's existing `filter` in `astro.config.mjs` gains one condition that
  drops any page whose path starts with `/design/`. The edit is reverted with the
  prototypes before merge.
- **Rationale**: `@astrojs/sitemap` lists every static page unless its `filter` excludes it
  (docs.astro.build/en/guides/integrations-guide/sitemap/#filter), and three existing tests
  (`tests/e2e/seo.spec.ts`, `tests/e2e/pages.spec.ts`, `tests/unit/site/build-env.test.ts`)
  assert the exact sitemap list. Filtering the `/design/` prefix, rather than
  `/design/portfolio/`, makes this edit byte-identical to the one the blog directions
  feature needs, so the two branches merge it cleanly.
- **Alternatives considered**: Changing the three tests' expected lists (rejected: that
  would put the prototypes in the sitemap, against FR-007); a `robots.txt` Disallow
  (rejected: the existing robots route explains that a Disallow hides the noindex signal).

## R4. Scroll reveals

- **Decision**: CSS scroll-driven animations: `animation-timeline: view()` for a stage
  entering the viewport and `scroll()` for a reading-progress rail, declared only inside
  `@media (prefers-reduced-motion: no-preference)` and `@supports (animation-timeline:
  view())`. The resting state is the fully visible one: keyframes run *from* a lower
  opacity and small offset *to* the normal state, and the animation range ends by the time
  the element is 30% into view, so a stage already on screen (including one reached from a
  `#stage` link) is fully shown. No JavaScript is involved. Direction C also uses
  `timeline-scope` so a sticky visual panel follows the stage being read; without support
  its visuals sit inline beside each stage.
- **Rationale**: The technical direction puts CSS scroll-driven animations ahead of any
  library. They need no script, so the story is identical with JavaScript off (FR-017), and
  the reduced-motion media query satisfies FR-016. Browsers without support get the static
  layout, which is also the no-JS and reduced-motion layout.
- **Alternatives considered**: `IntersectionObserver` in an island (rejected: JavaScript for
  something CSS does, and content would start hidden until the script ran); an animation
  library such as GSAP (rejected: new dependency under Principles III/IV, and weight against
  the 10 KB JavaScript budget).

## R5. Transitions between the index and the story

- **Decision**: Browser-native cross-document view transitions, opted into with
  `@view-transition { navigation: auto; }` in the prototype stylesheets of directions B and
  C only, inside `@media (prefers-reduced-motion: no-preference)`, with a CSS
  `view-transition-name` on the Focus Pocus entry title and the story title so the title
  carries across. Direction A uses none, as the baseline. Astro's `<ClientRouter />` is not
  used.
- **Rationale**: Astro's view transitions guide
  (docs.astro.build/en/guides/view-transitions/#differences-between-browser-native-view-transitions-and-astros-clientrouter)
  describes browser-native cross-document transitions as adding animation without extra
  JavaScript and without altering multi-page behaviour. `<ClientRouter />` would ship router
  JavaScript on every prototype page (pressure on the 10 KB budget), turn navigation into a
  single-page app, and require the theme-init and menu scripts to re-run on
  `astro:after-swap`, which is a shared-layout change this feature must avoid.
- **Alternatives considered**: `<ClientRouter />` with `transition:name`
  (docs.astro.build/en/reference/modules/astro-transitions/; rejected for the reasons above,
  and recorded in the decision document as the option if Don wants animated navigation in
  browsers without native support).

## R6. Interactive pieces as small islands

- **Decision**: Two islands, each a custom element defined in a processed `<script>` inside
  its `.astro` component, with all content present in the server-rendered HTML:
  1. **Theme filter** (all three directions): `<portfolio-filter>` wraps the index. Its
     controls use the `hidden js:…` pattern the site header already uses, so without
     JavaScript no control shows and every entry is visible (FR-023). With JavaScript it
     filters on each entry's `data-themes`, reads and writes `?theme=` so a filtered view is
     linkable, announces the number shown in a polite status region, and shows "No projects
     match this theme." with a button to clear the filter when nothing matches (FR-022). The
     matching rule is a pure function in `src/prototypes/portfolio/filter.ts`, unit-tested.
  2. **Option tabs** (direction B only): `<option-tabs>` upgrades a stacked list of option
     cards into an ARIA tablist whose buttons exist only under `.js`. Without JavaScript
     every option is stacked and visible (FR-017).
  Direction A shows options with native `<details>`/`<summary>` (the chosen option open by
  default); direction C with a static comparison table inside a focusable, labelled
  horizontal-scroll region. Neither needs script.
- **Rationale**: Astro's scripts guide recommends custom elements for interactive
  components without a UI framework; processed scripts are bundled, deduplicated and hashed
  into the CSP automatically
  (docs.astro.build/en/guides/client-side-scripts/#web-components-with-custom-elements and
  #script-processing). No framework integration is added. `tests/e2e/no-js.spec.ts` asserts
  that no `<button>` is visible without JavaScript and that the only classic inline script
  is theme-init; this pattern satisfies both.
- **Alternatives considered**: A framework island (`client:visible` with Preact or similar;
  rejected: new dependency and more JavaScript); a CSS-only radio + `:has()` filter
  (rejected: puts form controls in the no-JS page, and cannot announce results or reliably
  say that none match).

## R7. Content Security Policy constraints

- **Decision**: No change to the CSP in `astro.config.mjs`. Prototype styling uses classes
  and component `<style>` blocks only, never `style="…"` attributes or `define:vars`: the
  policy's `style-src` has `'self'` and hashes but no `'unsafe-inline'` or `style-src-attr`.
  Accent colour-coding uses per-stage classes that set a `--stage-accent` custom property in
  the stylesheet. No `<iframe>` is rendered.
- **Rationale**: The policy is shared site configuration; editing it is a major change and a
  merge risk with the blog feature. Focus Pocus has no live demo (R9), so nothing needs
  framing. The decision document records that a real embedded demo would add
  `frame-src https://drc.dev` to that page only, with Astro's CSP runtime API
  (`Astro.csp.insertDirective()`,
  docs.astro.build/en/reference/api-reference/#cspinsertdirective), and that drc.dev would
  have to allow being framed.
- **Alternatives considered**: `frame-src https://drc.dev` site-wide (rejected: shared config
  edit for a demo that does not exist).

## R8. Diagrams, placeholder media and demo clips

- **Decision**: The architecture diagram (Claude Desktop → MCP over stdio → Focus Pocus
  server → JXA scripts → OmniFocus) and the option-comparison diagram are hand-written inline
  SVG Astro components with `role="img"`, an accessible name and a text description, coloured
  through classes so they follow the theme. Screenshots and demo clips are placeholder frames
  built from HTML and CSS: a bordered box with a visible "Placeholder" label and a sentence
  describing what the real media will show (FR-012). No `<video>` or raster image is added.
  The decision document describes how real clips would work (`<video controls
  preload="none">` with a poster, never `autoplay`, a still frame and description under
  reduced motion).
- **Rationale**: Inline SVG and CSS frames cost a few kilobytes, keep the pages inside the
  100 KB transfer budget, stay sharp in both themes and need no image pipeline. Astro's SVG
  component import (docs.astro.build/en/guides/images/#svg-components) was considered; it
  suits static icon files, whereas these diagrams need theme classes on individual shapes and
  an accessible description, which is simpler as markup in a component.
- **Alternatives considered**: Raster screenshots through `astro:assets` (rejected: no real
  screenshots exist yet, and placeholders are the clarified choice); Mermaid (rejected: new
  dependency and client JavaScript).

## R9. Sample content: Focus Pocus and the other entries

- **Decision**: Typed sample data in `src/prototypes/portfolio/sample.ts` (data-model.md),
  drafted from https://drc.dev/projects/focus-pocus (fetched while planning) and
  https://github.com/drcdev/focus-pocus: an MCP server bridging Claude Desktop and OmniFocus
  with 35+ tools and 39 JXA scripts, natural-language dates, bulk operations, perspectives
  (Inbox, Forecast, Flagged, Projects), caching and health checks; stack TypeScript, Node.js,
  MCP, JXA, Jest. There is **no live demo**: the demo target is the drc.dev project page,
  with the repository as a second link, and every direction says that it stands in for a
  demo (FR-014). The other entries are Tempo (rhythmic routine timer), Flux (Ghost theme with
  AI reader engagement), drc.dev (the portfolio site itself) and Plunge Buddy (real-time
  conditions for cold plunging), each linking only to its drc.dev project page. Themes and
  statuses are Claude's reading, marked for Don's review; the set covers shipped, experiment
  and in progress and at least four themes. Every story stage carries a "Draft for review"
  mark.
- **Rationale**: Clarifications fixed Focus Pocus, Claude-drafted content and the real
  drc.dev entries. A TypeScript module is the smallest typed source for throwaway sample
  content; content collections are out of scope and the prototypes are removed before merge
  (see the plan's Complexity Tracking for Principle VI).
- **Alternatives considered**: A temporary content collection (rejected: out of scope, and
  it would edit the shared `src/content.config.ts`).

## R10. The "Have a problem like this?" hand-off to the contact form

- **Decision**: The invitation is a plain link to `/contact/?project=focus-pocus`: the
  contact address the navigation already reserves, plus one query parameter, `project`, whose
  value is the project's slug (lower-case letters, digits and hyphens). The link is built by
  `contactHref(slug)` in `src/prototypes/portfolio/contact-link.ts` and specified in
  contracts/contact-handoff.md for the contact feature to adopt.
- **Rationale**: A query parameter works from a static page and without JavaScript, and
  carries no personal data (Principle VII). A slug rather than a title is stable, URL-safe
  and easy to check against the list of projects. It does not depend on the contact
  feature's internals: if that feature ignores the parameter, the link still reaches the
  form. On the preview deployment `/contact/` currently serves the not-found page, which the
  spec accepts.
- **Alternatives considered**: A URL fragment (rejected: never sent to the server, harder to
  validate); `?subject=Focus%20Pocus` free text (rejected: invites arbitrary text into the
  form); `sessionStorage` (rejected: needs JavaScript).

## R11. How the prototypes fit the existing checks

- **Decision**:
  - **Accessibility, no-JS and budget**: the seven prototype routes are appended to
    `TEMPLATES` in `tests/e2e/templates.ts` through one imported constant
    (`PORTFOLIO_PROTOTYPES` from the new `tests/e2e/portfolio-prototypes.ts`). That runs the
    whole existing a11y suite (axe at two widths in two themes, menu open, JavaScript off,
    forced colours, reduced motion, reflow at 320 px and 200% zoom, text spacing, one h1,
    skip link, no load-time transitions), the no-JS shell suite and the performance budget
    (LCP ≤ 2.5 s, CLS < 0.1, ≤ 200 ms long-task time, ≤ 10 KB JavaScript, ≤ 100 KB
    transferred, noindex) on every prototype page with no new test machinery.
  - **Feature behaviour**: a new `tests/e2e/portfolio-directions.spec.ts`, matched by the
    existing `e2e` project (so `tests/unit/site/config-files.test.ts` still finds exactly one
    project per spec file). It covers stage order, every option reachable, draft marks,
    visuals beside their stage, index fields, the filter (apply, clear, `?theme=` with no
    match), index → story links, the invitation link, reduced motion (reveal elements run no
    animation and are fully opaque), JavaScript off (every stage, option, visual text and the
    invitation visible), a `#stage` deep link being visible at once, and a theme switch
    mid-story keeping the scroll position.
  - **Unit and component**: Vitest tests under `tests/unit/prototypes/portfolio/` (sample
    data invariants, filter rule, contact link) and `tests/component/prototypes/portfolio/`
    (Astro Container API renders of the stages, option presentations, diagrams, placeholder
    frames and filter markup), following the existing `tests/component/*.test.ts` pattern
    (docs.astro.build/en/guides/testing/#container-api). Both folders are already inside
    `vitest.config.ts`'s include globs.
  - **Visual project**: unchanged. Prototype routes get no `toHaveScreenshot` baselines:
    they are removed before merge, baselines would need both platforms refreshed twice, and
    no shared component changes, so existing baselines stay valid and no Docker run is
    needed.
  - **Decision-document screenshots**: a standalone Playwright config and spec in
    `tests/design/portfolio/` (`capture.config.ts`, `capture.spec.ts`), following
    `tests/reference/playwright.config.ts`: not part of `verify` or of any project in
    `playwright.config.ts`, run on demand with `pnpm exec playwright test --config …` against
    the same `wrangler dev` build the E2E suite uses. It captures the 24 full-page images
    with reduced motion requested (so every stage is in its final state), then writes them as
    WebP with `sharp` (already a dependency) to `docs/design/portfolio/`.
- **Rationale**: Reusing `TEMPLATES` holds the prototypes to the same bar as every real page
  with one shared-line edit. Keeping the capture command out of `package.json` avoids a
  second shared-file conflict with the blog feature.
- **Alternatives considered**: A copy of the a11y suite for prototypes (rejected: duplication
  that drifts); a `package.json` script for capture (rejected: shared-file conflict; the
  command is written in quickstart.md instead); PNG screenshots (rejected: 24 full-page PNGs
  would add many megabytes to history for good).

## R12. Commit-pinned preview addresses (FR-046)

- **Decision**: Cloudflare Workers Builds uploads every branch push with
  `wrangler versions upload --preview-alias …` (`scripts/deploy/preview.ts`), and
  `wrangler.jsonc` sets `preview_urls: true`, so each uploaded version has its own version
  preview URL (`https://<version-prefix>-dcc-web.<subdomain>.workers.dev`) that does not move
  when the branch changes. The decision document uses the version URL of the last commit
  that contains the prototypes. Sequence: (1) push the finished prototypes and the document
  with its 24 screenshots; (2) read that commit's version preview URL from the Workers
  Builds check on the commit (or `wrangler versions list`); (3) in one commit, write the URLs
  into the document and delete the prototypes. The commit from step 1 is then the last with
  prototypes, and its pinned URL is the one in the document.
- **Rationale**: Cloudflare's versioned preview URLs are the first-party way to reach a
  specific upload (Principle IV); the branch alias URL would serve the build after removal.
- **Alternatives considered**: The branch alias URL (rejected: moves with every push); a
  separate long-lived deployment (rejected: infrastructure change and cost risk).
- **Risk**: Cloudflare keeps a bounded number of Worker versions; a pinned version preview
  URL can stop working once enough newer versions are uploaded. The committed screenshots
  remain the lasting record (FR-042); the document says so.

## R13. The three directions

- **Decision**:
  - **A. Timeline** (from Flux `content-post-list.hbs`): the story is one vertical timeline
    with a rail and a coloured marker per stage (accent colour-coding by stage); visuals sit
    in a second column on desktop and below their text on phone. Options: one `<details>`
    per option, the chosen one open and badged "Chosen". Demo: link out, with a placeholder
    still. Reveals: each stage fades up as it enters; the rail fills with a `scroll()`
    progress timeline. Index: a single-column list of rows with status badge and theme pills.
    No view transitions.
  - **B. Cards** (from Flux `content-post-list-featured.hbs` bento grid and
    `layout-author-hero.hbs` gradient border): the index is a bento grid with Focus Pocus as
    the large tile; the story is a sequence of gradient-bordered cards, one per stage.
    Options: the tabs island over stacked cards. Demo: a demo panel in its own card with a
    placeholder frame and the link, saying there is no live demo. Reveals: cards scale and
    fade in. Cross-document view transition on the title.
  - **C. Chapters** (long-form scroll story): full-width chapters with a stage progress bar,
    and on desktop a sticky visual panel that follows the chapter being read
    (`timeline-scope`), falling back to inline visuals. Options: a comparison table of the
    options against the constraints, chosen column highlighted. Demo: an inline "demo
    window" placeholder beside the build chapter with the open link. Index: a compact list
    with status colour-coding. Cross-document view transition on the title.
- **Rationale**: The three differ on each behaviour the decision document compares (story
  stages, option comparison, demo embeds, scroll reveals) and on JavaScript cost (A: filter
  only; B: filter and tabs; C: filter only, most CSS), which gives Don real trade-offs. All
  use only existing palettes and the system fonts, so none needs a new visual resource; any
  that turns out to will say so (FR-005).
- **Alternatives considered**: A slide-per-stage "deck" (rejected: horizontal paging fights
  phone reading and 320 px reflow); two directions (rejected by clarification: three).
