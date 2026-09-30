# Research: The portfolio

Every Astro choice names the Astro docs page that supports it, found through the Astro Docs MCP
(`mcp__astro-docs__search_astro_docs`). Format per item: Decision, Rationale, Alternatives.

## R0. Astro version and docs source

- **Decision**: Plan against the installed Astro 7.3.5 (`package.json`), not Astro 5 as the prompt
  says. The Astro Docs MCP was available and was used for content collections, MDX component
  passing, view transitions, client-side scripts and the CSP runtime API.
- **Rationale**: Constitution IV makes the current docs the source of truth. The APIs used here
  (`glob()` loader, `schema: ({ image })`, `render()`, `<Content components>`, `Astro.csp.*`)
  exist unchanged in Astro 7; the CSP `kind` option is 7.1+ and is not needed.
- **Alternatives**: none.

## R1. Projects collection, file layout and slug

- **Decision**: `defineCollection({ loader: glob({ pattern: "*.mdx", base: "./src/content/projects",
  generateId }), schema: ({ image }) => projectSchema({ image }) })`. One file per project at the
  top of the folder; the slug is the file name (`focus-pocus.mdx` → `focus-pocus`). Images live in
  `src/content/projects/images/<slug>/`. `generateId` checks the file name (lower-case letters,
  digits, hyphens) and that every frontmatter image and clip exists, naming the file, reusing the
  `pages` pattern (`src/lib/content/images.ts`, generalised to take the collection root).
  The route separately globs `src/content/projects/**/*.{md,mdx}` so a `.md` twin, a nested file or
  two files with the same slug fail with both names (the collection would silently keep one).
- **Rationale**: "one text file plus its images" (FR-070); slug from file name (FR-020); same
  conventions as `pages` and `docs/design-source.md`.
- **Docs**: docs.astro.build/en/guides/content-collections/ ("Build-time collection loaders",
  "Defining custom IDs"), docs.astro.build/en/reference/content-loader-reference/#glob-loader.
- **Alternatives**: a folder per project (`focus-pocus/index.mdx` + images): rejected because the
  existing pages collection uses flat files plus an `images/` folder, and a folder per project
  makes "one file" less obvious. A `slug` frontmatter override: rejected (spec: slug comes from the
  file name).

## R2. Where the story's structured data lives

- **Decision**: Structured data that needs validation (the option comparison, the named visuals,
  demo, stand-in, source code) lives in the **frontmatter** and is validated by the Zod schema. The
  story text lives in the MDX **body**, written with building blocks that refer to the frontmatter:
  `<Chapter stage="built" visual="architecture">`, `<OptionComparison />`, `<Demo />`,
  `<Invitation />`, `<Visual name="screenshot" />`.
- **Rationale**: Zod gives exact, file-named errors for every FR-073 rule about options (exactly
  one chosen, reason, fit per constraint) and images (`image()` resolves and fails on a missing
  file). Writing a comparison as nested JSX props in MDX is error-prone for Don and cannot be
  validated before render. Blocks stay reusable in any project because they read the current
  project from `Astro.locals.project`, set by the route (the same pattern as
  `Astro.locals.pageFile` for sections).
- **Alternatives**: comparison as nested MDX components (`<Option chosen reason=...>`): harder to
  write, validation only at render time. Visuals as MDX image imports: needs `import` lines in the
  file, which the pages guide deliberately avoids.

## R3. Validating the body (seven chapters, blocks)

- **Decision**: `validateProjectBody(file, body, data)` in `src/lib/content/project-body.ts`, the
  same approach as `validatePageBody`: strip code fences and inline code; reject `#` and `##`
  headings (chapters render `h2`; the body uses `###` and below); every capitalised tag must be a
  story block or a page section; `<Chapter stage="…">` tags must be exactly the seven stages in
  order, each once; `<OptionComparison />` exactly once, inside the options chapter;
  `<Invitation />` exactly once, inside the invitation chapter; `<Demo />` at most once, inside the
  built chapter, and required there when the project names a demo, stand-in or source; every
  `visual="…"`/`name="…"` must be a key in `visuals` (or `demo` for an embedded demo); images in
  the body need alt text. Components also validate their props with Zod at render (as
  `src/components/sections/validate.ts` does), as a second line of defence.
- **Rationale**: FR-021, FR-073, US7 AS4, US8 AS2 and AS4. There is no first-party structural
  validation for MDX bodies; the regex pass is proven in this repository and names the file.
- **Alternatives**: a remark plugin walking the MDX AST: more robust to odd formatting but a new
  build hook in `astro.config.mjs` (a shared file) for a small gain; revisit if the regex check
  becomes a problem. Auto-generating chapters from frontmatter fields (no body): rejected, it
  would make the story a form, not writing, and could not host page sections inside chapters.

## R4. Page transition between index and story

- **Decision**: Browser-native cross-document view transitions. `portfolio.css` (loaded only on
  the index and story pages) contains `@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; } }`. Both pages opt in, so the transition runs only between
  portfolio pages. The project title pairs across pages with a per-slug name,
  `view-transition-name: project-<slug>`, on the index row title and the story `h1`. First choice:
  Astro's `transition:name` directive; the implementation checks the built output that Astro emits
  its scoped style without `<ClientRouter />` and that the style is covered by the CSP hashes. If
  it is not, the route renders one small `<style>` with the name rules and registers its hash with
  `Astro.csp.insertStyleHash()` before the layout renders (inline `style=""` attributes are not
  used because the CSP does not allow them).
- **Rationale**: the Astro guide says native cross-document transitions "don't … add additional
  JavaScript" and that `<ClientRouter />` is increasingly unnecessary; the story page must ship no
  script (FR-064), and the shell's scripts (menu, theme, contact) would need lifecycle changes
  under the router. Reduced motion and unsupported browsers load pages normally (FR-060, FR-063).
  Back navigation restores the index with its `?theme=` address (edge case).
- **Docs**: docs.astro.build/en/guides/view-transitions/ ("Differences between browser-native view
  transitions and Astro's `<ClientRouter />`", "Naming a transition");
  docs.astro.build/en/reference/api-reference/#csp.
- **Alternatives**: `<ClientRouter />` (rejected above); no transition (spec requires one).

## R5. Scroll reveal, progress bar, sticky visual

- **Decision**: Port the Direction C CSS: heading uncover with `animation-timeline: view()`
  (`clip-path` inset), progress bar with `animation-timeline: scroll(root)` on a fixed,
  `aria-hidden` element, visual panel `position: sticky` at ≥ 80rem. All inside
  `@media (prefers-reduced-motion: no-preference)` and `@supports (animation-timeline: view())`;
  outside them the bar is `display: none` and headings are simply visible. The sticky panel is
  inside the chapter's grid, so it stops at the chapter's end. `scroll-margin-top` keeps focused
  and anchored elements clear of the sticky header and bar. Forced-colours rules keep the chosen
  mark, status, progress bar and focus rings visible. Print styles hide the bar and show every
  chapter.
- **Rationale**: FR-023–FR-025, FR-060, FR-063, edge cases; no animation library (constitution IV,
  V; prompt direction).
- **Alternatives**: IntersectionObserver script (adds JS to the story page, rejected); an
  animation library (new dependency, rejected).

## R6. Theme filter island

- **Decision**: `<project-filter>` custom element defined in a processed `<script>` in
  `ProjectFilter.astro`. The server renders every project row and the controls; the controls stay
  `hidden` until the island has finished setting up and marks itself ready, so they are hidden
  without JavaScript and when the filter script is blocked or fails (FR-062); the site-wide `js:`
  variant alone is not enough, because `theme-init.js` can run while the island fails. Buttons use `aria-pressed`; a `role="status"` line announces "Showing N
  projects about <theme>." (FR-015). The chosen theme is written to `?theme=<key>` with
  `history.replaceState`, and read on load (FR-014, SC-007). An unknown theme shows "No projects
  match this theme." with a "Show all projects" button. The island's logic lives in
  `src/lib/content/themes.ts` (shared with the build) so it is unit-tested.
- **Rationale**: ported from the prototype's `PortfolioFilter`; Astro's documented pattern for
  interactivity without a framework; deferred module script (loaded "as late as possible").
- **Docs**: docs.astro.build/en/guides/client-side-scripts/#web-components-with-custom-elements.
- **Alternatives**: per-theme static pages (spec clarification: not built); a `<form method="get">`
  that works without JS (rejected by the clarification: controls are hidden without JS).

## R7. Theme normalising

- **Decision**: key = `trim → collapse whitespace → lower-case`, then spaces to hyphens for the URL
  (`"AI  integration "` → `ai-integration`). Label = the spelling used by the first project (in
  index order) that has the theme. Filter choices sorted by label with `localeCompare`, so the
  order is stable. A project listing the same theme twice (after normalising) fails the build.
  `?theme=` values are normalised the same way before matching.
- **Rationale**: FR-013 and the "theme spelling variants" edge case; free-text themes keep "one
  file" authoring.
- **Alternatives**: fixed theme list in config (clarification chose free text).

## R8. Drafts and build mode

- **Decision**: `isProductionBuild(env)` in `src/lib/build-mode.ts` returns true only when
  `WORKERS_CI === "1"` and `WORKERS_CI_BRANCH === "main"` (the production Workers Build, matching
  `resolveSiteOrigin`). The project list and `getStaticPaths()` drop drafts when it is true, so a
  draft has no index row, no page and no sitemap entry. Otherwise drafts are built and marked
  "Draft" on the index row and at the top of the story (existing `DraftNotice` wording adjusted
  for projects via a prop, or a project-specific mark).
- **Rationale**: FR-074, clarification; `process.env` is available in `getStaticPaths()` at build
  time; one pure function is unit-testable and shared with the blog.
- **Docs**: docs.astro.build/en/guides/environment-variables/ ("Default environment variables":
  `import.meta.env.PROD` is true for every `astro build`, so it cannot tell preview from
  production; "Setting environment variables" / "Using the CLI": host-set variables reach the
  build through `process.env`) and docs.astro.build/en/reference/modules/astro-env/ (`getSecret()`
  "defaults to `process.env` in dev and build").
- **Alternatives**: a custom `astro:env` variable set per environment (adds a Workers Builds
  setting, i.e. a configuration change); `import.meta.env.PROD` (true for preview builds too).
- **Validation runs before filtering**: the body check runs over every collection entry, drafts
  included, before `getPublishedProjects` drops drafts, so a production build still fails on a
  broken draft (FR-073).

## R9. Visuals: images, diagrams, clips

- **Decision**: `visuals` is a map of named visuals in frontmatter. Kinds:
  `image` (`src` via `image()`, `alt`), `diagram` (`src` via `image()` — usually SVG — `alt` and
  a required `description` rendered as a visible `<figcaption>`/details text linked by
  `aria-describedby`), `clip` (`src` a relative `.webm`/`.mp4` path, `poster` via `image()`,
  `alt`-style `label` and required `description`). Any visual may set `placeholder: true`, which
  shows a visible "Placeholder" mark (FR-082). Clips render `<video controls muted playsinline
  preload="none" poster>` with no `autoplay`, so they never play by themselves under any motion
  setting (FR-044, US5 AS2). Clip files are imported through `import.meta.glob` with `?url` so Vite
  emits hashed assets; the build fails if a clip is missing or larger than 5 MB (keeps the budget
  sane and well inside the 25 MiB static-asset file limit). Tests use a tiny committed WebM fixture
  (< 20 KB) made once with `ffmpeg`.
- **Rationale**: US1 AS6, US8 AS3; the prototype's inline-SVG diagram components cannot be reused by
  Don without code, so diagrams become SVG files with descriptions.
- **Docs**: docs.astro.build/en/guides/images/#images-in-content-collections.
- **Alternatives**: clips in `public/` (breaks "files live with the project" and skips existence
  checks); autoplay-on-view when motion is allowed (adds script and contradicts "never plays by
  itself" simplicity).

## R10. Demo embed and CSP

- **Decision**: `demo: { href, embed?, title? }`; `href` must be `https://drc.dev/…` or
  `https://<sub>.drc.dev/…` (FR-042). `<Demo />` always renders the "Open the <title> demo" link;
  an embedded demo is placed as the visual of the chapter that names `visual="demo"`, as an
  `<iframe src title loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms"
  referrerpolicy="strict-origin-when-cross-origin">` with no `allow="autoplay"`, so it never plays
  sound by itself (browsers block cross-origin autoplay with sound without that permission). The
  story route calls `allowDemoFrames(Astro.csp)` → `insertDirective("frame-src https://drc.dev
  https://*.drc.dev")` only when the project embeds a demo, before the layout renders (same timing
  constraint as `allowTurnstile`). `public/_headers` is unchanged.
- **Rationale**: FR-040–FR-043, US6; the site CSP has `default-src 'self'`, so frames from
  drc.dev are blocked unless allowed per page. Keeping it per page limits the relaxation.
- **Docs**: docs.astro.build/en/reference/api-reference/#csp (`csp.insertDirective()`).
- **Alternatives**: site-wide `frame-src` in `astro.config.mjs` (wider than needed); a
  click-to-load facade script (adds JS; `loading="lazy"` meets "does not load until reached").

## R11. Navigation current state and reserved address

- **Decision**: remove `"/projects/"` from `futureDestinations` (the address check then treats
  `src/pages/projects/*` as the owner of `/projects/…`, so a page file can no longer claim it), and
  reuse the blog's section rule `isInSection(pathname, href)` so a non-home entry is also current
  for addresses under it (`/projects/focus-pocus/` marks Projects with `aria-current="true"`, as
  spec 008 FR-004 does for posts). Link checks then require
  `/projects/` and every story page to answer 200 (FR-081).
- **Rationale**: FR-010, US4 AS1; shared with the blog (plan "Parallel work").
- **Docs**: docs.astro.build/en/reference/api-reference/#url (`Astro.url.pathname`, which the
  header already passes to `isCurrent`).
- **Alternatives**: a `currentSection` prop passed by each layout: more plumbing for the same
  result.

## R12. Pill

- **Decision**: no pill exists on `main` (`git ls-tree -r origin/main --name-only | grep -i pill`
  returns nothing). Build `src/components/Pill.astro`: a text label (`<span>`, or `<a>` when given
  `href`) with a `tone` from a closed list mapped to existing palette pairs that pass AA in both
  themes and a visible border so it is never colour alone; forced-colours border. `StatusPill`
  (shipped / experiment / in progress, text always shown) and `ThemePills` (a `<ul
  aria-label="Themes">`) wrap it.
- **Rationale**: FR-017, FR-011; built general enough for the blog's linked, colour-coded topic
  pills so the second feature to merge reuses it.
- **Alternatives**: wait for the blog (blocks this feature).

## R13. Ordering

- **Decision**: projects with `order` first, ascending; then by `date` descending; then by title.
  Ties on `order` fall back to date then title. Deterministic.
- **Rationale**: FR-016 ("an order Don sets … falling back to most recent first").

## R14. Index and story layouts

- **Decision**: Index row = Direction C ruled row (`border-t-4`, heavy bottom rule on the list)
  with Direction A's two columns inside at ≥ 64rem: left column title (`h2`, with the only link —
  to the story — named by the title), problem, status and theme pills; right column the index
  visual (`<Image>` with alt). Below 64rem one column, visual after text. Story = Direction C:
  `StoryHeader` (h1 title, problem, pills, draft mark), "In this story" `<nav aria-label="In this
  story">` with an ordered list of the seven chapter links (FR-027), then chapters with the heavy
  stage-colour top rule, number, `h2`, text column and optional visual panel, the comparison
  table in a labelled scroll region, and the invitation. Colours are the prototype's
  `stage-accents.css` palette tokens (non-text 3:1) — no new colours or typefaces (FR-003).
- **Rationale**: the design Decision and FR-001/FR-002; the prototype passed axe in both themes.
- **Docs**: docs.astro.build/en/guides/images/ (`<Image />` from `astro:assets` with `alt`,
  widths and lazy loading) and docs.astro.build/en/guides/images/#images-in-content-collections.

## R15. Sharing metadata and sitemap

- **Decision**: `/projects/` has a fixed title and description (in `src/pages/projects/index.astro`,
  plain language). Each story uses the project's `title`, `description` and optional `image`
  (resized to 1200 px PNG with `getImage()`, as pages do), otherwise the site default. The sitemap
  integration lists both automatically.
- **Docs**: docs.astro.build/en/guides/integrations-guide/sitemap/ (already configured).
