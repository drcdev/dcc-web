# Implementation Plan: Design directions for the portfolio

**Branch**: `006-portfolio-design-directions` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-portfolio-design-directions/spec.md`

## Summary

Build three throwaway portfolio design directions, A Timeline, B Cards and C Chapters, as
static prototype pages under `/design/portfolio/`, each with a projects index and a Focus Pocus
story page. They use the site's existing `BaseLayout`, palettes and system fonts, Claude-drafted
content marked "Draft for review", inline SVG diagrams and labelled placeholder frames. Scroll
reveals are CSS scroll-driven animations inside a reduced-motion guard. Index-to-story
transitions use browser-native cross-document view transitions (B and C). The theme filter
(all directions) and option tabs (B) are small custom-element islands over complete HTML. The
invitation links to `/contact/?project=focus-pocus`. The prototypes join the existing
accessibility, no-JS and performance-budget suites through `TEMPLATES`, plus a feature E2E
spec, unit and component tests. A standalone Playwright capture writes 24 WebP screenshots for
`docs/design/portfolio.md`. The document's preview links are pinned to the Cloudflare version
preview URL of the last commit with prototypes. The final commit then deletes every prototype
file and reverts the two shared one-line edits, so only the document, its screenshots and the
spec folder reach main.

## Technical Context

**Language/Version**: TypeScript 6 (strict), Astro 7.3.5, Node 24 (`.nvmrc`)

**Primary Dependencies**: Existing only: Astro, Tailwind CSS 4 (`@tailwindcss/vite`,
`@tailwindcss/typography`), `@astrojs/sitemap`, `sharp` (screenshot conversion, already a
dependency). No additions.

**Storage**: N/A. Sample content is a typed TypeScript module (data-model.md); no D1, no
collections.

**Testing**: Vitest (unit and Astro Container API component tests), Playwright with
`@axe-core/playwright` (e2e, a11y, budget projects) against `wrangler dev` serving the
production build, as today.

**Target Platform**: Static assets on Cloudflare Workers; branch preview deployments via
Workers Builds `versions upload --preview-alias`. Evergreen browsers; scroll-driven animations
and cross-document view transitions are progressive enhancements.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: Existing budget per page on simulated mobile: LCP ≤ 2.5 s, CLS < 0.1,
long-task time ≤ 200 ms, ≤ 10 KB JavaScript, ≤ 100 KB total transfer.

**Constraints**: WCAG 2.2 AA in both themes; readable with JavaScript off and with reduced
motion; CSP unchanged (no `style` attributes, no iframes, no third-party requests); only
existing palettes and fonts; no edits to shared navigation, layout or components; files
disjoint from the blog directions feature (005).

**Scale/Scope**: 7 prototype routes (hub + 3 × index/story), 5 project entries, 7 stages,
3 options, 2 islands, 24 screenshots, 1 decision document.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes. The
design added no dependency, service, CSP change or shared-component edit.*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | Pass | Unit (sample invariants, filter rule, contact link, decision document), component (Container API renders), E2E (feature spec), a11y, no-JS and budget (via `TEMPLATES`) are written and seen failing before each piece is built. The tasks phase orders tests first. |
| II. Automated Release Gate | Pass | Prototypes must pass the full `verify` gate on the branch (FR-031) and the final docs-only diff passes it again. No check is skipped or weakened. The visual project is unchanged and existing baselines stay valid because no shared component changes. Every push gets a preview deployment. |
| III. Human Review for Major Changes | **Major change** | The feature explores the design and visual identity of a whole site section and temporarily changes shared config (`astro.config.mjs` sitemap filter) and the shared test list. The feature prompt also classes it as major. The PR is labelled major, auto-merge stays off, and it waits for Don to review the pinned preview addresses and approve. |
| IV. First-Party Before Custom | Pass | See the capability table below. The Astro Docs MCP was available, and each Astro choice cites its docs page in research.md. |
| V. Static by Default | Pass | All seven routes are prerendered. JavaScript is limited to two custom-element islands over complete HTML. Stories and indexes are fully readable with JavaScript off (tested). |
| VI. Content as Files | Exception (see Complexity Tracking) | The sample content is a typed `.ts` module, not MDX in a collection. It is throwaway review material, noindex, and deleted before merge. Collections are explicitly out of scope. |
| VII. Private Data | Pass | Nothing is collected. The contact hand-off carries only a project slug (`?project=focus-pocus`), no personal data. |
| VIII. Cloudflare Best Practices | Pass | No Worker code, D1, Cron or Turnstile change. Pages are served as static assets. Preview addresses use Workers' own version preview URLs. |
| IX. Cost Ceiling | Pass | Nothing new is paid for. Expected new monthly cost: **$0**. Uses existing Workers Builds and preview URLs within the free plan. |
| X. Accessible, Fast and Private | Pass | Every prototype route runs the full axe/WCAG 2.2 AA suite in both themes at two widths, plus the performance budget. No third-party scripts, iframes or tracking. |
| XI. Spec Kit Workflow | Pass | Spec Kit branch and folder. Separate worktree. Files are disjoint from feature 005 except the shared edits listed under Merge risks, whose resolution is stated. |

### Capability table (Principle IV)

| Capability | First-party option | Used? | Note |
|---|---|---|---|
| Prototype pages | Astro file-based routing, prerendered | Yes | docs.astro.build/en/guides/routing/ |
| Page shell, SEO, noindex | Existing `BaseLayout` + `Seo` | Yes | No shared edit needed |
| Sitemap exclusion | `@astrojs/sitemap` `filter` | Yes | One-line `/design/` condition, reverted before merge |
| Page transitions | Browser-native cross-document view transitions, as described in Astro's view transitions guide | Yes (B, C) | `<ClientRouter />` considered and rejected: router JS, SPA behaviour, would need shared theme/menu scripts to re-run (R5) |
| Scroll reveals | CSS scroll-driven animations (web platform), no library | Yes | Astro has no scroll-animation feature. Library rejected (R4) |
| Islands | Astro processed `<script>` + custom elements | Yes | docs.astro.build/en/guides/client-side-scripts/. Framework integrations rejected (new dependency) |
| Diagrams | Inline SVG in Astro components | Yes | Astro SVG component import considered: suits static icons, not themed labelled diagrams (R8) |
| Images/media | `astro:assets` | Not needed | No raster media: placeholders are HTML/CSS frames |
| Demo embed | Per-page CSP via `Astro.csp.insertDirective()` | Documented, not used | No live demo exists. No iframe, so no CSP change (R7) |
| Component tests | Astro Container API | Yes | docs.astro.build/en/guides/testing/#container-api |
| Preview addresses | Cloudflare Workers version preview URLs | Yes | Pinned per upload (R12) |
| Screenshots | Playwright (existing) + `sharp` (existing) | Yes | Standalone config, not in `verify` |

## Project Structure

### Documentation (this feature)

```text
specs/006-portfolio-design-directions/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R13
├── data-model.md        # Phase 1: sample-data types, invariants, filter rule
├── quickstart.md        # Phase 1: validation and removal steps
├── contracts/
│   ├── prototype-routes.md   # routes and page DOM
│   ├── islands.md            # <portfolio-filter>, <option-tabs>
│   ├── contact-handoff.md    # /contact/?project=<slug>
│   └── decision-document.md  # docs/design/portfolio.md + 24 screenshots
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source code (repository root)

Files marked † exist only on the branch and are deleted in the final commit. Files marked ‡
are shared, get a one-line edit, and are reverted in the final commit.

```text
src/pages/design/portfolio/                 †
├── index.astro                             # hub
├── a/index.astro, a/focus-pocus.astro      # Direction A: Timeline
├── b/index.astro, b/focus-pocus.astro      # Direction B: Cards
└── c/index.astro, c/focus-pocus.astro      # Direction C: Chapters

src/prototypes/portfolio/                   †
├── types.ts  sample.ts  filter.ts  contact-link.ts
├── shared/   # PrototypeNotice, DraftMark, PlaceholderFrame, ArchitectureDiagram,
│             # OptionsDiagram, StatusBadge, ThemePills, PortfolioFilter (island), stage accents CSS
├── a/        # TimelineStory, TimelineStage, OptionDetails, TimelineIndex, a.css
├── b/        # CardStory, StageCard, OptionTabs (island), BentoIndex, DemoPanel, b.css
└── c/        # ChapterStory, Chapter, StickyVisual, OptionTable, ChapterIndex, c.css

tests/unit/prototypes/portfolio/            †  sample, filter, contact-link, decision-doc tests
tests/component/prototypes/portfolio/       †  stage/option/diagram/placeholder/filter renders
tests/e2e/portfolio-prototypes.ts           †  PORTFOLIO_PROTOTYPES route list
tests/e2e/portfolio-directions.spec.ts      †  feature E2E (e2e project)
tests/design/portfolio/                     †  capture.config.ts, capture.spec.ts (not in verify)
tests/e2e/templates.ts                      ‡  `...PORTFOLIO_PROTOTYPES` appended to TEMPLATES
astro.config.mjs                            ‡  sitemap filter also drops paths starting /design/

docs/design/portfolio.md                    # lasting: decision document
docs/design/portfolio/*.webp                # lasting: 24 screenshots
```

**Structure decision**: Single Astro project. Everything the prototypes need sits in two
folders (`src/pages/design/portfolio/`, `src/prototypes/portfolio/`) plus their test folders,
so removal is a folder delete. Nothing is added to `src/components/`, `src/layouts/`,
`src/content/`, `src/styles/global.css`, `src/config/`, `package.json` or the lockfile. The
existing a11y, no-JS and budget specs run on the prototype routes because they iterate
`TEMPLATES`. Story files are `focus-pocus.astro`, which build to `…/focus-pocus/index.html`
under the site's `trailingSlash: "always"`.

## Test plan

| Layer | Where | Covers |
|---|---|---|
| Unit | `tests/unit/prototypes/portfolio/sample.test.ts` | Invariants 1–11 in data-model.md (stage order, draft marks, one chosen option with reason, statuses/themes coverage, slugs, stand-in note) |
| Unit | `…/filter.test.ts` | `themesOf`, `matches`, `parseThemeParam` including unknown theme |
| Unit | `…/contact-link.test.ts` | `/contact/?project=focus-pocus`; bad slug throws |
| Unit | `…/decision-doc.test.ts` | Decision document structure (contracts/decision-document.md). Written when the document is drafted; must pass before the final commit |
| Component | `tests/component/prototypes/portfolio/*.test.ts` | Each direction's story renders 7 stages in order with ids, h2s and draft marks; every option in HTML with chosen marked and reason; diagrams have `role="img"` and names; placeholders say "Placeholder" plus description; no `style=` attributes; filter controls carry `hidden js:` classes; invitation `href` |
| E2E (feature) | `tests/e2e/portfolio-directions.spec.ts` (`e2e` project) | Per direction: order of stages; every option reachable (details open / tab arrows / table cells); visuals inside their stage and beside at 1280 px; index fields for 5 entries; filter apply/clear/`?theme=` known and unknown; Focus Pocus → same-direction story; other entries not story links; invitation `href`; reduced motion → `[data-reveal]` has `animation-name: none` and opacity 1, and no `@view-transition` animation; JS off → all stages, options, visual text, invitation visible, no visible buttons; `#options` deep link visible at once; theme toggle mid-story keeps `scrollY`; noindex meta; not in nav; hub links |
| Accessibility | existing `tests/e2e/a11y.spec.ts` via `TEMPLATES` | axe WCAG 2.2 AA at 390/1280 × dark/light, menu open, no-JS, forced colours, reduced motion, 320 px and 200% reflow, text spacing, headings, skip link, no load-time transitions |
| No-JS shell | existing `tests/e2e/no-js.spec.ts` via `TEMPLATES` | Nav, no visible buttons, only theme-init as classic inline script |
| Performance budget | existing `tests/e2e/budget.spec.ts` via `TEMPLATES` | LCP, CLS, long tasks, ≤ 10 KB JS, ≤ 100 KB total, noindex, per prototype page |
| Sitemap | existing seo/pages/build-env tests | Unchanged expectations still pass because of the `/design/` filter |
| Visual | existing `visual` project | Unchanged: no prototype baselines; existing baselines must still match (proves the shared shell is untouched) |
| Screenshots | `tests/design/portfolio/capture.*` | Not a test gate: produces the 24 images on demand |

## Delivery sequence (for tasks)

1. Tests and types/sample data/filter/contact link (unit first).
2. Shared prototype pieces, then Direction A, B, C. Each has component tests, then pages,
   then E2E for that direction. Add routes to `PORTFOLIO_PROTOTYPES` as each page lands so the
   a11y and budget suites cover it. Add the sitemap filter with the first route.
3. Hub page. Full `verify`.
4. Capture screenshots. Draft `docs/design/portfolio.md` with its test.
5. Push. Take the version preview URL of that commit (R12).
6. One final commit: fill in pinned URLs and SHA, run the document test, delete every †
   file, revert both ‡ edits, confirm the diff is docs-only, run `verify`, push. Open the PR
   from `drc-agents`, labelled major change, auto-merge off (Principle III).

## Merge risks and parallel work

- **`tests/e2e/templates.ts`** (shared): this feature appends `...PORTFOLIO_PROTOTYPES`. The
  blog feature will probably append its own constant on the adjacent line. If they conflict
  in a rebase, keep both lines. Both are reverted before each feature merges.
- **`astro.config.mjs`** sitemap filter (shared): use exactly the `/design/` prefix condition
  so the blog feature's identical edit merges cleanly. Reverted before merge.
- **`.specify/feature.json`**: both branches rewrite it to point at their own feature folder.
  On rebase, keep this branch's value. It is Spec Kit state, not site code.
- **`docs/design/`**: this feature writes only `portfolio.md` and `portfolio/`. The blog
  feature owns `blog.md` and `blog/`. No shared file.
- **No edits** to navigation, `BaseLayout`, `PageLayout`, shared components, `global.css`,
  CSP, `package.json` or the lockfile, so the main shared-file conflicts named in the feature
  prompt do not arise.

## Risks and open questions

- **Removal timing**: the plan removes the prototypes in the last commit, before the PR is
  reviewed. Don reviews them through the pinned version preview URLs. If Don asks for changes
  to a direction after review, revert the removal commit, change it, re-capture, re-pin and
  remove again.
- **Pinned URL lifetime**: Cloudflare keeps a bounded number of Worker versions, so pinned
  URLs may eventually stop working. The committed screenshots are the lasting record, and the
  document says so.
- **Browser support**: scroll-driven animations, `timeline-scope` and cross-document view
  transitions are Chromium-first. Other browsers get the static layout, which is also the
  tested no-JS and reduced-motion layout. The decision document states this per direction.
- **Budget pressure**: the story pages carry the most HTML and inline SVG. If a page nears
  100 KB, shorten the diagrams' markup before anything else. The budget is never raised.
- **Content accuracy**: story text is Claude's draft from drc.dev and the repository, marked
  for Don's review. It is not a merge condition (FR-003).

## Complexity Tracking

| Violation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Principle VI: sample content in a TypeScript module, not MDX in a content collection | The prototypes need one fixed sample story shared by three directions for a few days of review. The spec puts content collections out of scope, and everything is deleted before merge, so nothing public is ever authored this way. | A temporary collection would edit the shared `src/content.config.ts` and pre-empt the real portfolio feature's schema design. MDX per direction would triplicate the content and break like-for-like comparison. |
| Temporary shared edits (`tests/e2e/templates.ts`, `astro.config.mjs`) | They put the prototypes under the existing a11y, no-JS and budget gates (FR-030, FR-031) and keep them out of the sitemap (FR-007). | Copying the a11y suite would drift from the real gate. Changing sitemap test expectations would publish the prototypes in the sitemap. |
