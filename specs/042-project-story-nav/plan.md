# Implementation Plan: Previous, next and index links on project stories

**Branch**: `042-project-story-nav` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/042-project-story-nav/spec.md` (GitHub issue #186)

## Summary

Every project story gets a small navigation block after the closing
invitation, outside the story article: "← Previous: <title>", "All projects" and "Next: <title> →". The neighbours are read
from the same ordered list the projects index renders, so the sequence matches the index in every
build (drafts only where the index lists them; retired projects included). The route already
holds that list in `getStaticPaths()`, so it passes each story its two neighbours as props; a new
prerendered component in `src/components/project/` draws the block. No client JavaScript, no new
route, no schema change.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, as pinned in `package.json`)

**Primary Dependencies**: Astro content collections, Tailwind CSS (site theme). No new dependency.

**Storage**: N/A (content files only; no new front matter fields)

**Testing**: Vitest (unit, component via the Astro Container API, build via `tests/build/fixture-site.ts`), Playwright (E2E, axe, visual)

**Target Platform**: Static pages served from Cloudflare Workers static assets

**Project Type**: Static website (Astro)

**Performance Goals**: Within the existing CI performance budget; the block adds a few bytes of HTML and CSS and no script

**Constraints**: WCAG 2.2 AA; works without JavaScript; prerendered; 44 x 44 CSS px targets; no horizontal scroll at 320 px

**Scale/Scope**: One new component, one new pure helper, edits to one route, one layout and one stylesheet; five real projects today

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Test-First | Unit, component, build and E2E cases below are written and seen to fail before the component and helper exist. Each behaviour has one primary layer (see Test plan). | Pass |
| II. Automated Release Gate | No check is skipped or weakened. The story-template visual baselines are refreshed (macOS and Linux via Docker), as the spec's Appearance section requires; that is an expected pixel change, not a loosened threshold. | Pass |
| III. Human Review of Every Change | Normal PR flow from `drc-agents`, Don approves, auto-merge armed after the final push. | Pass |
| IV. First-Party Before Custom | Neighbours are passed through Astro's `getStaticPaths()` props (docs cited below); markup is a plain Astro component styled with the existing Tailwind theme. No library. The "custom" part is a three-line neighbour lookup over the existing ordered list; Astro has no first-party previous/next helper for collections (its `paginate()` pages a listing, it does not link sibling entries). Astro Docs MCP was available and used. | Pass |
| V. Static by Default | Block is prerendered HTML with plain `<a>` links; no island, no script; readable with JavaScript off. | Pass |
| VI. Content as Files | No content or schema change; the sequence is derived from existing front matter (`date`, `title`, `draft`). | Pass |
| VII. Private Data | No personal data touched; the contact link in the invitation is unchanged. | Pass |
| VIII. Cloudflare Best Practices | No Worker, binding, route or config change; the pages stay static assets. | Pass |
| IX. Cost Ceiling | No running-cost change ($0). | Pass |
| X. Accessible, Fast and Private | Labelled `<nav>` landmark, visible focus, 44 px targets, stacked full-width below `sm`, forced-colours borders; axe already runs on three fixture stories and the real story template. No script, no tracker. | Pass |
| XI. Spec Kit Workflow | Spec Kit branch and directory; `/tweak` pipeline. Files touched are not shared with a sibling feature's plan (the visual baseline for `story-template` is the only shared artefact; regenerate it after merging `origin/main` if a sibling changed it). | Pass |

Post-design re-check: unchanged, all pass. No Complexity Tracking entries.

### Triage condition 1 (stays a `/tweak`)

Confirmed it still holds: no dependency, integration or service change; no contact-data change; no
design-system change (existing theme tokens and the existing link, border and focus styles only);
no site-wide layout change and no change to site navigation (the header menu, footer and
`src/config/navigation.ts` are untouched; the new block lives inside the project story article
only); no visual-identity change; no running-cost increase; no CI, deploy or infrastructure config
change; no constitution amendment.

### Scope confirmations

- No new route (`src/pages/projects/[slug].astro` keeps its paths; only its props grow).
- No schema change (`src/content.config.ts` untouched).
- No new E2E spec file; cases go into existing specs.
- No edits to shared test helpers: `tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`,
  `tests/component/html.ts`, `tests/fixtures/`, `playwright.config.ts`, `vitest` config are all
  untouched.
- No client JavaScript.
- Ordering is reused, not duplicated: `getPublishedProjects()` (`src/lib/projects.ts`, which
  calls `selectPublishedProjects()` in `src/lib/content/project-order.ts`) is the same call the
  index makes.

## Astro documentation cited (Principle IV)

- Passing neighbours as route props from the ordered collection list:
  [Routing reference, `getStaticPaths()` → Data passing with `props`](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths)
  and [Content collections → Generating routes from content](https://docs.astro.build/en/guides/content-collections/#generating-routes-from-content).
- Component tests render the new component with props:
  [Container API → `renderToString()` and the `props` rendering option](https://docs.astro.build/en/reference/container-reference/#rendering-options).
- Styles go in the existing imported stylesheet `src/components/project/portfolio.css` with Tailwind
  utilities, as the other story blocks do:
  [Styles and CSS → Tailwind](https://docs.astro.build/en/guides/styling/#tailwind) and
  [External styles → Import a local stylesheet](https://docs.astro.build/en/guides/styling/#external-styles).

## Design

### Data flow

1. `src/lib/content/project-order.ts` gains a pure `neighbours(ordered, id)` that returns
   `{ previous?, next? }` from an already ordered list: `previous` is the entry at `index - 1`
   (newer, listed above), `next` is at `index + 1` (older, listed below), no wrap-around, and both
   absent for a single entry. It does not sort; it reads the order `selectPublishedProjects()`
   produced.
2. `src/pages/projects/[slug].astro` `getStaticPaths()` already holds `projects` from
   `getPublishedProjects(process.env)`. Each path's props gain `previous` and `next` as
   `{ slug, title }` (only what the block shows). Because the list is the production-filtered one,
   a draft can never be a neighbour in production (FR-004) and is one in preview/local builds
   exactly where the index lists it (FR-002).
3. The route hands them to `ProjectLayout`, which renders `<StoryNav previous next />` after
   `<slot />` and before `<ProjectInvitation />`. The two layout props are optional so any other
   caller is unaffected.

### Component: `src/components/project/StoryNav.astro`

- `<nav aria-label="Projects" data-story-nav>` containing a `<ul>` of up to three `<li>`, in DOM
  order previous, all projects, next (focus order follows).
- Previous: `<a href="/projects/<slug>/" rel="prev"><span aria-hidden="true">←</span> Previous: <title></a>`.
  Next: `<a href="/projects/<slug>/" rel="next">Next: <title> <span aria-hidden="true">→</span></a>`.
  All projects: `<a href="/projects/">All projects</a>`. A missing neighbour's `<li>` is not
  rendered at all (FR-003). No status, date or other metadata (FR-001).
- Styles in `portfolio.css` under a new `/* Story navigation */` block, using `[data-story-nav]`
  selectors like the other story blocks: a small top margin below the invitation and a bottom margin above the site footer; `flex flex-col`
  below `sm` with each link `flex w-full min-h-11` and padding so the target is at least 44 x 44;
  `sm:flex-row` from 640 px; link colours, underline and `:focus-visible` outline copied from the
  existing story link styles (`[data-invitation]` focus outline, accent tokens); `break-words`
  so a long title wraps inside its link. Forced-colours: add `[data-story-nav] a:focus-visible`
  to the existing `outline-color: CanvasText` rule.

### Decisions and rejected alternatives

- **Neighbours computed in `getStaticPaths()` from the index list** (chosen) vs. calling
  `getPublishedProjects()` again inside the component or layout and finding the current slug.
  Rejected: it repeats the collection read per page and splits the ordering source between two
  call sites; the route already has the exact list and Astro's documented way to hand per-page
  data over is props.
- **Plain visible text as the accessible name** ("Previous: Flux") vs. an `aria-label` such as
  "Previous project: Flux" (the spec's US2 example, given as "for example"). Rejected the
  `aria-label`: the visible text "Previous: Flux" is not contained in "Previous project: Flux", which
  would fail WCAG 2.5.3 Label in Name. The visible text already carries direction and title, which is
  what FR-005 requires; the arrows are `aria-hidden`.
- **Landmark label "Projects"** (the spec's example) is distinct from the site menu's "Main" and from
  any existing landmark on the story page.
- **A pure `neighbours()` helper** (chosen) vs. inline `projects[i - 1]` in the route. Chosen so the
  first/last/single/no-wrap rules have a unit test at the cheapest layer instead of needing a build
  per case.
- **New component file** vs. adding the markup to `ProjectInvitation.astro`. Rejected: the invitation
  is a `<footer>` with its own contract and tests; a separate `<nav>` keeps both simple.
- **Real-content neighbour check in `projects.spec.ts`** rejected as a second layer for the same
  rule: the real stories use the same helper and list as the fixtures; the fixture journey and the
  unit test are the primary layers.

## Test plan (each behaviour has one primary layer)

| Behaviour | Layer | Where |
|---|---|---|
| Neighbour rules: middle has both, first has no previous, last has no next, single has neither, no wrap-around, uses the given order | unit | `tests/unit/content/project-order.test.ts` (existing file, new `describe("neighbours")`) |
| Block markup: `nav` labelled "Projects", order previous / all / next, hrefs, visible text "Previous: <title>" / "All projects" / "Next: <title>", arrows `aria-hidden`, a missing side renders no `li`/`a`, no status text, no script or button | component | new `tests/component/project/StoryNav.test.ts` (one test file per component is the repo norm; uses the existing helpers unchanged) |
| Production build never links a draft; preview build includes it where the index does (minimal's previous is draft in preview, absent in production) and the block sits after the invitation, outside the article | build | `tests/build/drafts.test.ts` (existing builds; new `it` cases; reason for build layer: only the real build applies the production draft filter to routes) |
| Journey on the fixture site: from the first project follow Next to the last, each step lands on the next index row; first has no Previous, last has no Next; All projects lands on `/projects/`; at 390 px the links stack full width, each at least 44 x 44, no horizontal scroll; keyboard focus order previous, all, next with a visible outline | E2E | `tests/e2e/projects-fixtures.spec.ts` (existing, port 4322) |
| No new axe violations on the story template | a11y | existing `tests/e2e/a11y.spec.ts` cases (no edit) |
| Pixels of the story template | visual | existing `story-template` shot in `tests/e2e/visual.spec.ts` (no spec edit; baselines refreshed, macOS and Linux via Docker) |

### Fixture site and which cases can observe the nav

The Playwright fixture site (port 4322) holds only the five fixture projects and is not a production
build, so the draft is listed. Its index order is: `draft` (2026-01-02), `minimal` (2026-01-01),
`every-part` (2025-12-01), `every-setting` (2025-06-01), `retired` (2025-01-01). Consequences:

- `draft` is first (no Previous) and `retired` is last (no Next), so both ends and a retired project
  in the sequence are observable in `projects-fixtures.spec.ts`.
- The visual `story-template` shot is `/projects/every-part/`, a middle project, so the baseline
  shows all three links (previous "Minimal project", next "Every setting"). Its locator is
  `article[data-story]`, which contains the new block, so the baseline must be refreshed.
- The a11y fixture stories (`every-part`, `every-setting`, `retired`) cover a both-sides page and a
  last page; the real `project-story` template (port 4321, production build) covers a real story.
- The production-build draft exclusion cannot be seen on the fixture site (drafts are listed there);
  it is covered by `tests/build/drafts.test.ts`, whose production build has `minimal`, a draft and
  `retired`.
- Existing assertions that the invitation follows the last part (`projects.spec.ts`,
  `drafts.test.ts`) stay true: the block sits after both, outside the article, and contains no `data-part`.

## Project Structure

### Documentation (this feature)

```text
specs/042-project-story-nav/
├── spec.md
├── plan.md          # this file
├── quickstart.md    # validation guide
└── checklists/
```

`research.md`, `data-model.md` and `contracts/` are not produced: there are no open unknowns, no
new entity or field, and no external interface.

### Source Code (repository root)

```text
src/
├── components/project/
│   ├── StoryNav.astro          # new: the previous / all projects / next block
│   └── portfolio.css           # edit: story-nav styles + forced-colours focus rule
├── layouts/ProjectLayout.astro # edit: optional previous/next props, render StoryNav after the invitation, after the article
├── lib/content/project-order.ts# edit: add pure neighbours()
└── pages/projects/[slug].astro # edit: pass previous/next props from the ordered list

tests/
├── unit/content/project-order.test.ts      # edit
├── component/project/StoryNav.test.ts      # new
├── build/drafts.test.ts                    # edit
├── e2e/projects-fixtures.spec.ts           # edit
└── e2e/visual.spec.ts-snapshots/story-template-*  # refreshed baselines (macOS + Linux)
```

**Structure Decision**: Existing Astro single-project layout; the component sits with the other
project-story components in `src/components/project/`.

## Risks

- Visual baselines: the Linux baseline needs Docker Desktop (CLAUDE.md); if a sibling PR changes the
  `story-template` baseline first, regenerate after merging `origin/main`.
- Budget: negligible HTML/CSS growth; no script, so no long-task risk.

## Complexity Tracking

None.
