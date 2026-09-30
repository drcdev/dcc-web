# Implementation Plan: The portfolio

**Branch**: `009-portfolio` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-portfolio/spec.md`, plus the "Technical
direction" of the feature prompt (followed as given; it guides the plan and is not a spec
requirement).

## Summary

Build the projects index at `/projects/` and one story page per project at
`/projects/<slug>/`, to the chosen design: Direction C (Chapters) for stories, and Direction C's
ruled rows with Direction A's two-column split for the index (`docs/design/portfolio.md`
"Decision"). The Direction C prototype at commit `1f35eae` (`src/prototypes/portfolio/c/*`,
`shared/*`, `filter.ts`, `contact-link.ts`) is the visual and behavioural reference and is
ported by hand into production components; the prototype's hard-coded sample data becomes a
real project file.

A project is **one MDX file** in a new `projects` content collection
(`src/content/projects/<slug>.mdx`) plus its images in `src/content/projects/images/<slug>/`.
Its settings (title, one-line problem, themes, status, index visual, sharing description,
optional order, date, demo, stand-in, source code, draft, the option comparison and a named set
of visuals) are validated by a strict Zod schema. Its story body is written with **story building
blocks**, MDX components handed to `<Content components={...} />` so no imports are needed:
`Chapter` (one of the seven fixed stages, with an optional visual beside it), `Visual`,
`OptionComparison`, `Demo` and `Invitation`. The existing page sections (`Figure`, `TextBlock`
and the rest) are usable inside chapters. A build-time body check (the same pattern as
`validatePageBody`) enforces the seven chapters in order, known block names, visual references
and block placement, and names the file in every error.

Motion is CSS only: the reading-progress bar and chapter-heading uncover use CSS scroll-driven
animations, the visual panel uses `position: sticky`, and the index-to-story transition is the
browser's native cross-document view transition (`@view-transition`). Every effect sits behind
`prefers-reduced-motion: no-preference` and `@supports`, and the resting state is the fully
visible one. A story page ships **no JavaScript** beyond the site shell. The index has one small
island, `<project-filter>`, that filters by theme and writes `?theme=<theme>`; without JavaScript
its controls are hidden and every project is listed. Embedded demos are lazy `<iframe>`s from
`drc.dev`; the story route adds `frame-src https://drc.dev https://*.drc.dev` to that page's CSP
only when the page embeds a demo.

Focus Pocus becomes the first project, with its draft story and placeholder visuals visibly
marked. Drafts show (marked "Draft") in local, test and preview builds and are left out of
production builds. The Projects navigation entry becomes live, marked current on the index and
on every story page. No dependency, service or cost is added (**$0/month**).

This is a **major change** under Principle III (navigation, a new site-wide page type and page
transitions, and a per-page CSP relaxation for `drc.dev` frames).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) on Node 24 (`.nvmrc`). MDX for project files.

**Primary Dependencies**: Astro 7.3.5 (static, no adapter), `@astrojs/mdx` 8.0.2,
`@astrojs/sitemap` 3.7.4, Tailwind 4.3.3 (+ `@tailwindcss/typography`), Zod 4 through
`astro/zod`, `astro:assets` for images. **No new dependency.** The prompt says "Astro 5"; the
repository is on Astro 7.3.5, and every API used here was checked against the current docs
through the Astro Docs MCP (research R0).

**Storage**: Files only: `src/content/projects/*.mdx` and `src/content/projects/images/<slug>/*`
(images, SVG diagrams, short WebM/MP4 clips). No database.

**Testing**: Vitest 5 (unit and schema tests; Astro component tests through the Container API
and the `tests/component/html.ts` helper; build-level tests through the fixture-site harness in
`tests/build/`). Playwright 1.63 against `wrangler dev` serving the built site (E2E, reduced
motion, JavaScript off, forced colours), axe-core 4.13 (a11y project), the budget project, and
the visual project with per-platform baselines. Multi-project and every-block scenarios run on
the existing fixture site (port 4322), extended with fixture project files.

**Target Platform**: Cloudflare Workers static assets (no Worker code for these pages). Modern
evergreen browsers; browsers without scroll-driven animations or view transitions get the static
final state.

**Project Type**: static website (Astro), content-collection driven.

**Performance Goals**: `/projects/` and each story page within the existing mobile budget
(`tests/e2e/budget.spec.ts`: LCP ≤ 2.5 s, CLS ≤ 0.1, long tasks ≤ 200 ms, ≤ 10 KB JS and
≤ 100 KB total transferred before interaction) and Core Web Vitals "good" on mobile. Images go
through `astro:assets` with explicit widths; only the first visual is eager, the rest are
`loading="lazy"`; clips use `preload="none"` with a poster; embeds use `loading="lazy"`.

**Constraints**: every public page prerendered; story pages need no script; content readable
with JavaScript off and with reduced motion; WCAG 2.2 AA in both themes at 320 px and up;
existing design tokens only (no new colour or typeface); no third-party script; no new
dependency; $0 added cost.

**Scale/Scope**: a handful of projects (1 at launch, fixtures for tests). Two routes, one
collection, five story building blocks, a pill component, one island, one authoring guide.

No NEEDS CLARIFICATION remains; every open point is resolved in [research.md](./research.md).

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1 design (below). Result: **PASS**, no
unjustified violations; nothing in Complexity Tracking.*

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | Tests are written, checked against the spec and seen to fail before each piece is built. Layers (detail in "Test strategy" below): unit and schema tests for the project schema, theme normalising, ordering, build mode, contact link and body validation; Container API component tests for every building block, the pill, the index row and the filter markup; build-level tests that add fixture project files (valid, draft, and one broken file per error in FR-073) and assert the build result and the message; Playwright E2E for the index, filter, story, contact hand-off, reduced motion, JavaScript off, no scroll-driven support and forced colours; axe on both new templates in both themes at both widths; budget runs on both templates; visual baselines for the index and the Focus Pocus story (macOS and Linux). Tasks order each test before the code it covers. |
| **II. Automated Release Gate** | No change to CI. `pnpm run verify` already runs secrets lint, ESLint, `astro check` + `tsc` + `wrangler types --check`, Vitest (unit, component, build), the build and all Playwright projects (e2e, a11y, budget, visual, sections), so it covers the whole local gate and is **not duplicated**. New tests join the existing projects; the new fixture E2E spec joins the fixture-site project in `playwright.config.ts`. An invalid project file fails `astro build`, so CI fails and nothing deploys (US7 AS9). New visual baselines are committed for both platforms; nothing is skipped or loosened. |
| **III. Human Review for Major Changes** | **Major change.** It (1) changes site navigation (the Projects entry goes live and gains section-level "current" marking, `src/lib/nav.ts`); (2) adds a new site-wide page type with its own layout, visual treatment and page transitions (design system surface, although only existing tokens are used); (3) changes the security headers: story pages that embed a demo get a per-page `frame-src` for `drc.dev` in the Astro CSP `<meta>`. It adds no dependency or service, no cost, and no CI or infrastructure change, and does not touch contact data (it only builds a link the contact form already reads). The PR carries the `major-change` label; auto-merge stays **off**; Don checks the index and Focus Pocus on the preview deployment in both themes (SC-010) before approving. |
| **IV. First-Party Before Custom** | See "First-party choices" below: content collections with the `glob()` loader and a Zod schema; the schema `image()` helper and `astro:assets` `<Image>`/`getImage()`; `@astrojs/mdx` with components passed to `<Content />`; native cross-document view transitions (Astro docs recommend them over `<ClientRouter />` when only animation is wanted); CSS scroll-driven animations; `Astro.csp.insertDirective()` for per-page CSP; processed `<script>` custom element for the island; `@astrojs/sitemap`. Astro Docs MCP was available and used (research R0). Custom code only where no first-party feature exists: the seven-chapter body check, theme normalising and ordering, the filter logic and the draft rule. |
| **V. Static by Default** | Both routes use `getStaticPaths()` and are prerendered; no Worker code runs for them. Story pages ship no page script. The index filter is one island (processed module script, deferred), with every project in the HTML. Everything reads fully with JavaScript off (US5, FR-061). |
| **VI. Content as Files** | A project is one MDX file plus images in the repository, validated by a strict collection schema and a body check. Invalid content fails the build with a message naming the file and the problem (FR-073). No CMS, no database. |
| **VII. Private Data** | No personal data is collected. The invitation link carries only the project slug (`/contact/?project=<slug>`); the contact form's handling of it is unchanged. |
| **VIII. Cloudflare Best Practices** | Pages are static assets; only `/api/*` invokes the Worker, unchanged. No Worker, D1, Cron or `wrangler.jsonc` change. `public/_headers` is unchanged (it still sends `frame-ancestors 'none'` and `X-Frame-Options: DENY` for our own pages). |
| **IX. Cost Ceiling** | **Expected added monthly cost: $0.** Static assets on the Workers Free plan; images and short clips are served as static assets (Workers static asset requests are free and unmetered); demos are hosted by Don on drc.dev, outside this site. Clip sizes are bounded by the build (research R9) to keep the asset count and size well inside the free limits (20,000 files, 25 MiB per file). |
| **X. Accessible, Fast and Private** | axe gate in both themes at 390 and 1280 px, plus forced colours, reflow at 320 px, keyboard reach of the comparison region, focus never hidden under the sticky panel or progress bar, reduced-motion final state, text alternatives for every visual, descriptions for diagrams and clips. Budget test on both templates. No third-party script: a `drc.dev` demo is an opt-in `<iframe>` that loads lazily, sandboxed, never autoplays sound. |
| **XI. Spec Kit Workflow** | Spec Kit branch `009-portfolio` and `specs/009-portfolio/`. The blog feature runs in parallel in a sibling worktree; files both features touch and how to merge them are listed in "Parallel work and shared files" below, as the principle requires. |

**Development workflow**: every Astro decision in [research.md](./research.md) names the Astro
docs page that supports it. Out-of-scope items stay in the spec's follow-up list (the contact
form showing the project's title instead of its slug; RSS; multi-select filtering).

## First-party choices (Principle IV)

| Capability | First-party option used | Notes / why custom where custom |
|---|---|---|
| Project files and validation | Astro content collection, `glob()` loader, `schema: ({ image }) => …` (docs.astro.build/en/guides/content-collections/) | Strict object so unknown settings fail. `generateId` names bad file names and missing images, as `pages` does. |
| Images | Schema `image()` helper + `astro:assets` `<Image>` / `getImage()` (docs.astro.build/en/guides/images/#images-in-content-collections) | Widths, formats and lazy loading from Astro; sharing image resized with `getImage()` as pages do. |
| Short clips | Vite static asset import (`import.meta.glob(..., { query: "?url", import: "default", eager: true })`), native `<video>` | Astro has no video pipeline; Vite emits hashed files. Custom: existence and size check. |
| Story building blocks | `@astrojs/mdx`, components passed to `<Content components={...} />` (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content) | Same registry pattern as `src/components/sections/`. Custom: the seven-chapter body check (no first-party structural validation of MDX bodies). |
| Page transition | Browser-native cross-document view transitions (`@view-transition { navigation: auto }`), per the Astro view transitions guide's recommendation when only animation is needed (docs.astro.build/en/guides/view-transitions/) | `<ClientRouter />` rejected: it turns the site into client-side routing, adds JavaScript to every page and changes script lifecycles for the shell's menu, theme and contact scripts. Title pairing through `transition:name` if it is emitted without the router, else a CSP-hashed rule (research R4). |
| Scroll reveal and progress bar | CSS scroll-driven animations (`animation-timeline: view()` / `scroll(root)`) and `position: sticky` | No animation library; nothing to load; `@supports` fallback is the final state. |
| Index filter | Astro processed `<script>` defining a custom element (docs.astro.build/en/guides/client-side-scripts/#web-components-with-custom-elements) | No UI framework. Custom: filter logic (tiny, unit-tested). |
| Demo embed | Native `<iframe loading="lazy">` + `Astro.csp.insertDirective()` (docs.astro.build/en/reference/api-reference/#csp) | Per-page `frame-src`, like `allowTurnstile()` on `/contact/`. |
| Sitemap | `@astrojs/sitemap` (already configured) | Drafts are not built in production, so they are never listed. |
| Hosting | Cloudflare Workers static assets (unchanged) | Nothing Cloudflare-side changes. |

## Test strategy (Principle I)

Order for the tasks phase: each block of tests below is written and seen to fail before the code
it names. Test file names are indicative.

1. **Unit and schema** (`tests/unit/content/`):
   `project-schema.test.ts` (required, optional, unknown and wrongly typed settings; status set;
   problem one sentence ≤ 140 characters; 1–4 themes; demo on `drc.dev` over HTTPS; stand-in
   and source HTTPS; demo and stand-in not both; comparison rules: at least one option and one
   constraint, exactly one chosen, chosen has a reason, a fit for every constraint, optional
   pros/cons; visual kinds and required alt/description), `project-body.test.ts` (seven chapters
   in order, missing/repeated/out-of-order, unknown block, unknown visual name, comparison only in
   the options chapter, invitation block in the invitation chapter, no `#`/`##` headings in the
   body, code fences ignored), `themes.test.ts` (normalise, dedupe variants, label choice, stable
   order, `?theme=` parse including unknown), `project-order.test.ts`, `build-mode.test.ts`
   (production only for Workers Builds on `main`), `project-address.test.ts` (slug from file
   name, duplicates, `.md`/`.mdx` clash, nested files), `contact-link.test.ts`,
   `tests/unit/site/navigation.test.ts` (updated: `/projects/` no longer reserved; section-level
   current for `/projects/<slug>/`).
2. **Component** (`tests/component/project/`, Container API): `Pill`, `StatusPill`,
   `ThemePills`, `Chapter` (heading level and id, chapter number, visual/no-visual grid,
   `data-reveal`), `Visual` (image, diagram with reachable description, clip with controls,
   `muted`, no `autoplay`, `preload="none"`, description; placeholder mark), `OptionComparison`
   (table, `scope` headers, caption, region with `tabindex="0"` and accessible name, chosen in
   text, reason paragraph, pros/cons rows present only when any option has them), `Demo` (open
   link text, embed `<iframe>` with `title`, `loading="lazy"`, `sandbox`, no `allow="autoplay"`;
   stand-in note; source-code link), `Invitation` (href, accessible name with title),
   `ProjectRow` (two columns, single story link named by the title, no other links),
   `ProjectFilter` (controls hidden without `js`, all projects in HTML, status region),
   `StoryHeader` (title, problem, pills, "In this story" list, draft mark), progress bar
   `aria-hidden`.
3. **Build** (`tests/build/`, fixture-site harness extended to copy fixture project files into
   `src/content/projects/`): `project-validation.test.ts` runs one broken fixture per FR-073 row
   (`tests/fixtures/projects/broken/NN-*.mdx`) and asserts the build fails with the file name
   and the expected phrase; `one-file-project.test.ts` (adding one file plus images publishes the
   project on the index and at `/projects/<slug>/`, SC-004); `project-drafts.test.ts` (draft
   absent from index, routes and sitemap with the production environment; present and marked
   with a preview environment); `project-csp.test.ts` (embed page gets `frame-src
   https://drc.dev https://*.drc.dev`, other pages do not).
4. **E2E** (`tests/e2e/`, against `wrangler dev`): `projects.spec.ts` (index status 200 and nav
   current; row layout at 1280 and 390 px; no horizontal scroll from 320 px; story chapters in
   order; "In this story" links; comparison region keyboard scroll; invitation to
   `/contact/?project=focus-pocus` and the contact form shows the project; back to the index keeps
   `?theme=`; `@view-transition` present only under no-preference); `projects-motion.spec.ts`
   (reduced motion: no progress bar, no animation on headings, visual not sticky, clip not
   playing; default motion: progress bar and sticky at ≥ 80rem); `projects-no-js.spec.ts`
   (JavaScript off: every chapter, alt text, full comparison, links, filter controls absent);
   forced-colours checks for chosen mark, status and progress bar. On the fixture site (port
   4322) `projects-fixtures.spec.ts`: multi-row index, filter by theme, clear, announced count,
   `?theme=` reload and share, unknown theme message, theme variants as one choice, an every-block
   project, embed and link-only demos, clip. The shared page lists `tests/e2e/templates.ts`
   (used by the shell, no-JS, a11y and budget specs) gain `/projects/` and
   `/projects/focus-pocus/`; the not-found and pages link checks now require `/projects/`.
5. **Accessibility**: `a11y.spec.ts` picks the two new templates up through `TEMPLATES` (both
   themes, both widths, JS off, reduced motion, reflow, text spacing); plus an axe run on the
   fixture every-block story.
6. **Visual baselines**: `visual.spec.ts` gains `projects-{phone,desktop}-{light,dark}` and
   `project-story-{phone,desktop}-{light,dark}` (full page, reduced motion emulated so every
   chapter is final). Eight new images per platform: macOS with `pnpm run test:visual:update`,
   Linux with `pnpm run test:visual:update:linux` (Docker) or the `visual-baselines` label
   fallback. Existing baselines (header, footer, home, about, contact, sections, not-found,
   menu) must not change: the header baselines are taken on `/`, where Projects is not current.

## Parallel work and shared files (Principle XI)

The blog feature (`008-blog`, sibling worktree, not on `main`) touches some of the same files.
Whichever branch merges second re-merges `main` and resolves as below. **Rule for every
conflict: keep both sides.**

| File | This feature's change | Blog's likely change | Resolution |
|---|---|---|---|
| `src/content.config.ts` | Adds `projects` collection and its imports | Adds `posts` collection | Keep both definitions and imports; `export const collections = { pages, posts, projects };` |
| `src/config/navigation.ts` | Removes `"/projects/"` from `futureDestinations` | Removes `"/writing/"` | Keep both removals: `futureDestinations` becomes `[]` (keep the export and its comment). |
| `src/lib/nav.ts` | `isCurrent` marks a section entry current for pages under it (`/projects/<slug>/`) | Likely the same for `/writing/<slug>/` | Keep one implementation; both features' tests must pass. |
| `src/lib/build-mode.ts` (new) | `isProductionBuild(env)` for drafts | Blog drafts need the same rule | If both add it, keep one file and one function name; merge tests. |
| `src/components/Pill.astro` (new) | Plain label pill with a tone; optional `href` | Colour-coded topic pills that link | FR-017: one pill. If the blog lands first with a pill, this branch switches `StatusPill`/`ThemePills` to it and deletes its own; if this lands first, the blog reuses this one (it already accepts `href` and a tone). |
| `tests/e2e/templates.ts`, `tests/e2e/visual.spec.ts` | New rows / new test block | Same | Keep both. |
| `tests/build/fixture-site.ts`, `scripts/build-fixture-site.ts`, `playwright.config.ts` | Copy fixture projects; add the fixture spec to the 4322 project's `testMatch` | Probably fixture posts | Keep both copies; `testMatch` becomes one alternation listing both specs. |
| `docs/pages.md`, `docs/design-source.md` | Link to `docs/projects.md`; content-structure table rows | Link to a posts guide | Keep both. |
| `src/pages/[...slug].astro` | Only if the address check needs the project route in `routeFiles` (it already globs `src/pages/**`) | Same | Keep both. |

Visual baselines: each branch adds only its own new images; if either branch changes a shared
baseline unexpectedly, that is a regression to fix, not to refresh.

## Contact hand-off (feature 007, on main)

`src/components/sections/ContactForm.astro` already reads `?project=` as plain text, puts it in
the hidden `project` field and shows "About: <slug>" (JavaScript on). The invitation link is a
plain `<a href="/contact/?project=<slug>">`, so it works without JavaScript (the contact page
opens; the form itself needs JavaScript, as today). **Nothing is missing for this feature.**
Showing the project's title instead of its slug stays contact follow-up work (spec). One E2E test
asserts the round trip.

## Project Structure

### Documentation (this feature)

```text
specs/009-portfolio/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── project-file.md      # settings + building blocks (the authoring contract)
│   ├── build-errors.md      # every FR-073 error and its message
│   ├── pages-dom.md         # index and story DOM, motion, no-JS, CSP
│   └── filter-island.md     # <project-filter> behaviour and URL contract
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── content.config.ts                    # + projects collection            [shared with blog]
├── content/
│   ├── schemas/project.ts               # projectSchema({ image })
│   └── projects/
│       ├── focus-pocus.mdx              # first project (draft copy, marked)
│       └── images/focus-pocus/          # index visual, screenshots/diagrams (SVG), placeholders
├── components/
│   ├── Pill.astro                       # shared label pill                [overlap with blog]
│   └── project/
│       ├── StatusPill.astro  ThemePills.astro
│       ├── ProjectRow.astro  ProjectFilter.astro (island)  EmptyProjects.astro
│       ├── StoryHeader.astro  ReadingProgress.astro  DraftMark.astro
│       ├── blocks/                      # MDX building blocks (registry, like sections/)
│       │   ├── index.ts                 # storyBlockNames + storyBlockComponents
│       │   ├── schemas.ts               # prop schemas (validated at render)
│       │   ├── Chapter.astro  Visual.astro  OptionComparison.astro
│       │   └── Demo.astro  Invitation.astro
│       └── portfolio.css                # Direction C port (story + index), tokens only
├── layouts/ProjectLayout.astro          # story page inside BaseLayout
├── lib/
│   ├── build-mode.ts                    # isProductionBuild(env)           [overlap with blog]
│   ├── nav.ts                           # section-level current            [shared with blog]
│   ├── projects.ts                      # getPublishedProjects(), order, file names
│   └── content/
│       ├── project-body.ts              # validateProjectBody()
│       ├── project-address.ts           # slug rules, duplicates
│       ├── themes.ts                    # normalise, list, parse ?theme=
│       ├── stages.ts                    # the seven stages, ids and headings
│       ├── contact-link.ts              # contactHref(slug)
│       └── errors.ts                    # + projectFileError()
├── config/navigation.ts                 # futureDestinations − "/projects/" [shared with blog]
└── pages/projects/
    ├── index.astro                      # /projects/
    └── [slug].astro                     # /projects/<slug>/

docs/projects.md                         # authoring guide (FR-075), linked from docs/pages.md

tests/
├── unit/content/ …                      # schema, body, themes, order, address, build mode
├── component/project/ …                 # blocks, pills, row, filter, header
├── build/ project-*.test.ts             # fixture builds + error messages
├── fixtures/projects/                   # valid fixtures, drafts, broken/NN-*.mdx, images, tiny clip
└── e2e/ projects*.spec.ts, templates.ts, visual.spec.ts (+ 8 baselines × 2 platforms)
```

**Structure Decision**: single Astro project, following the content structure recorded in
`docs/design-source.md` ("Later features add … `projects` collections … `src/pages/projects/`
routes … `ProjectLayout`"). Project furniture lives in `src/components/project/`, story blocks in
`src/components/project/blocks/` with their own closed registry, mirroring
`src/components/sections/`.

## Post-design Constitution re-check

Re-checked after writing [data-model.md](./data-model.md) and [contracts/](./contracts/): still
**PASS**. The design adds no dependency, no server code and no cost; the only security-header
change is the per-page `frame-src` for `drc.dev` on stories that embed a demo (major-change
review, above). Story pages remain script-free; the filter island is the only new script.

## Risks and open questions

- **Performance budget (100 KB total)** on a story with several visuals: mitigated by lazy
  images below the fold, `astro:assets` widths, SVG diagrams, `preload="none"` clips and lazy
  embeds; the budget test decides. If a real story cannot fit, the fix is image sizing, not a
  looser budget.
- **Title pairing in the view transition** depends on whether Astro emits `transition:name`
  styles without `<ClientRouter />` under the site's CSP; the fallback (a hashed inline rule via
  `Astro.csp.insertStyleHash()`) is planned (research R4).
- **Embedding needs drc.dev's consent**: drc.dev must allow framing from doncoleman.ca (its own
  `frame-ancestors`). That is on Don's side (spec assumption); the link always works.
- **Clip fixture**: a tiny committed WebM is needed for the clip tests (research R9).
- **Blog overlap** (pill, build mode, nav, content config): planned above; FR-017's reuse rule is
  re-checked at merge time.
- **Focus Pocus copy** is Claude's draft from public sources; every chapter and placeholder visual
  is marked for Don's review (FR-082), and the chapter headings follow the spec's wording ("What I
  built", "What I'd do differently"), not the prototype's.

## Complexity Tracking

No violations; nothing to justify.
