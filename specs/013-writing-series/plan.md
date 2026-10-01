# Implementation Plan: Frame the Writing pages around Drift & Convergence

**Branch**: `013-writing-series` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-writing-series/spec.md`

**Stacks on**: `012-content-cleanup` (PR #25, open). The About page section FR-015 changes is
`src/content/pages/about.mdx` as it is on this branch ("About the writing", lines 28 to 36).

**Major change (Constitution Principle III): YES.** The series marker, series banner, framing
lead and the Agentic AI / Technology teams recolour change the design system and visual
identity; free-form topics change the content model; a new `public/_redirects` file changes
deployment configuration. Auto-merge stays off. `tasks.md` must carry a `[PREVIEW-CHECK]` task
for Don to review the preview deployment before he approves the PR, and the PR body must say
why auto-merge is off.

## Summary

Make Drift and Convergence the organising idea of the Writing pages without a new post setting.
The two series join the controlled topic list in `src/config/topics.ts`, marked `series: true`
with flux's colours (Drift `lavender`, Convergence `sage`); Agentic AI moves to `mauve` and
Technology teams to `sand` so every controlled colour stays unique. The post schema accepts
free-form topic ids beside controlled ones and, in its existing `superRefine`, fails a post
that names both series or a free-form id within edit distance two of a controlled id. The
existing post-file check rejects the slugs `drift` and `convergence`.

Each series gets a canonical static route, `src/pages/writing/drift/[...page].astro` and
`src/pages/writing/convergence/[...page].astro`, rendering a shared series page with a richer
`SeriesBanner`. The topic route stops building pages for series ids and starts building plain
pages for free-form ids. `public/_redirects` (Cloudflare Workers static assets) sends
`/writing/topics/{drift,convergence}/…` to the short address with a real 301. A `SeriesMarker`
("Series: Drift") replaces the plain pill for series tags everywhere pills appear, always
first; text-only cards take their border from the series. The landing gains a `SeriesIntro`
framing lead; the feed description, home "Recent writing" line and About section are rewritten.
No new dependency, no client JavaScript, no new colour token.

## Technical Context

**Language/Version**: TypeScript 6.0 (strict), Node 24 (`.nvmrc`)

**Primary Dependencies**: Astro 7.3.5 (content collections, `astro/zod`, static routing,
`paginate()`), `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, Tailwind CSS 4.3. No
additions.

**Storage**: Files only. Posts in `src/content/posts/*.mdx`; controlled topics in
`src/config/topics.ts`; blog copy in `src/config/blog.ts`. No database change (D1 untouched).

**Testing**: Vitest 5 (unit, schema, build-fixture and Astro Container component tests),
Playwright 1.63 (E2E, `a11y` project with `@axe-core/playwright`, `budget`, `visual`).

**Target Platform**: Static build served by Cloudflare Workers static assets; E2E runs against
`wrangler dev`, which serves `dist/` and its `_redirects`.

**Project Type**: Static website (Astro) with one Worker for `/api/*` (not touched).

**Performance Goals**: Existing budget unchanged (SC-006); Core Web Vitals "good" on mobile.

**Constraints**: No client JavaScript added; every page readable with JavaScript off; WCAG 2.2
AA with 4.5:1 text contrast in both themes; no new colour tokens; plain-language copy
(`VOICE.md`); tests never reference `specs/` paths (changed-paths drift guard).

**Scale/Scope**: 5 posts (4 visible), 6 controlled topics (2 of them series), ~12 components
and routes touched, 2 new routes, 1 new public config file.

No `NEEDS CLARIFICATION` remains; research.md records each decision.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | PASS | Every change starts with a failing test (layers listed under "Test layers"). The topic list, schema guards, slug guard, redirects file, components, routes, a11y and visuals each get tests before code. |
| II. Automated Release Gate | PASS | No gate is skipped or weakened. Changes go through `pnpm run verify` and CI `verify`. Existing tests whose expectations the spec changes (topic colours, feed description, P21) are updated in the same reviewed change, with the reason stated (research R9). |
| III. Human Review for Major Changes | PASS (flagged major) | Major: design system / visual identity (marker, banners, recolour), content model (free-form topics, series), deployment config (`public/_redirects`). Auto-merge off; `[PREVIEW-CHECK]` task required. |
| IV. First-Party Before Custom | PASS | Astro Docs MCP consulted. Routing, pagination, schema validation and RSS use Astro first-party features; redirects use Cloudflare's first-party `_redirects` because Astro's `redirects` without an adapter emits 200 meta-refresh pages (research R3). See "First-party choices". |
| V. Static by Default | PASS | All new pages are prerendered (`getStaticPaths` + `paginate()`). No SSR, no new island, no client JS. Redirects are served by the asset layer; no Worker code runs for them. |
| VI. Content as Files | PASS | Series membership is a topic id in post front matter; series metadata lives in `src/config/topics.ts`. Invalid content (both series, near-miss id, reserved slug, bad id) fails the build with a plain message naming the post. |
| VII. Private Data | PASS (not touched) | No contact form, D1 or personal-data change. |
| VIII. Cloudflare Best Practices | PASS | `_redirects` is the documented Workers static-assets redirect mechanism; it is committed and deployed with the build, never set in the dashboard. Two static + two splat rules, far below the 2,000/100 limits. `run_worker_first` stays `/api/*` only. |
| IX. Cost Ceiling | PASS | Expected new monthly cost: **$0**. No new service, binding, dependency or plan feature; `_redirects` and static pages are included in the Workers free plan. |
| X. Accessible, Fast and Private | PASS | Marker distinguished by text ("Series: …"), weight and outline, not colour alone; forced-colours keeps the outline. Contrast of every new pair is computed by the token-contrast unit test (pre-computed in research R6, all ≥ 4.99:1). axe runs on landing, both series pages, a free-form topic page, all posts, a post, home and About. Budget thresholds unchanged. No third-party scripts. |
| XI. Spec Kit Workflow | PASS | Spec Kit branch `013-writing-series`, stacked on 012 as recorded in the spec. Only this worktree edits these files; if 012 changes `about.mdx` before merge, this branch re-merges and FR-015 applies to the landed text. |

**Development Workflow**: each Astro choice cites the docs page found through the Astro Docs
MCP (research.md). All site copy follows `VOICE.md`.

### First-party choices (Principle IV)

| Capability | First-party option | Used? |
|---|---|---|
| Canonical series pages `/writing/drift/[n/]`, `/writing/convergence/[n/]` | Astro file-based routing with static segments + `paginate()` (docs.astro.build/en/guides/routing/#route-priority-order, #nested-pagination) | Yes. Static folders outrank `src/pages/writing/[slug].astro`, so no route collision. |
| Redirect `/writing/topics/{drift,convergence}/` and paginated pages | Astro `redirects` config (docs.astro.build/en/reference/configuration-reference/#redirects) | **No**: with no adapter Astro writes `<meta http-equiv="refresh">` HTML pages served as 200 with no status code. Used instead: **Cloudflare Workers static assets `public/_redirects`** (developers.cloudflare.com/workers/static-assets/redirects/), a real 301 at the asset layer, also first-party. |
| Build-time guards (both series, near-miss id, free-form id format) | Content collection schema (`astro/zod`, `superRefine`) (docs.astro.build/en/guides/content-collections/#defining-the-collection-schema) | Yes, extending `postSchema`'s existing `superRefine`. Astro reports the failing entry's file. |
| Post slug `drift` / `convergence` guard | Glob loader `generateId` + existing `assertPostFiles()` reserved-slug check (docs.astro.build/en/reference/content-loader-reference/#glob-loader) | Yes, extend the existing `RESERVED` set from the series ids. |
| Feed title/description | `@astrojs/rss` (docs.astro.build/en/recipes/rss/) | Yes, copy change only in `src/config/blog.ts`. |
| Sentence-case label, edit distance | none (pure string logic) | Small pure functions in `src/lib/content/topic-ids.ts`, unit-tested. Zod has no edit-distance check; no dependency is added for ~15 lines. |

### Test layers

| Layer | Tool | What it covers here |
|---|---|---|
| Unit / schema | Vitest | `topics.ts` (6 entries, series flag, unique colours incl. mauve/sand, contrast of pill/banner/marker/dusk pill in both themes); `topic-ids.ts` (edit distance, near-miss, sentence-case label, ordering series first, main topic); `postSchema` (free-form accepted, both series rejected, near-miss rejected naming the intended id, bad free-form id rejected); `assertPostFiles` (reserved `drift`/`convergence`); `public/_redirects` rules; `blog.ts` feed copy. |
| Build (fixture site) | Vitest + `buildFixtureSite` | New rows P23 to P26 of contracts/build-errors.md; P6 and P21 revised; a free-form-only post builds; series and free-form pages exist, `/writing/topics/drift/` is not built. |
| Component | Vitest + Astro Container API | `SeriesMarker`, `TopicPill` (free-form neutral pill), `SeriesBanner`, `SeriesIntro`, `TopicPillRow` (no series), `PostCard`/`LeadStory` (series first, series border), `PostMeta`, `RecentWriting` line and links, plain free-form `TopicBanner`. |
| E2E | Playwright (`e2e`) | Landing → each series page; series page lists only its posts and links to the other series and to `/writing/`; 301 + `Location` for `/writing/topics/drift/`, `/writing/topics/drift/2/`, `/writing/topics/convergence/`; marker on every page type (SC-002); home and About links; feed title/description; no-JS readability. |
| Accessibility | Playwright `a11y` + axe | Landing, `/writing/drift/`, `/writing/convergence/`, a free-form topic page (fixture), a controlled topic page, `/writing/all/`, a post, home, About; forced-colours check (emulated) that the marker keeps its outline and text; reflow at 320 px. Screen-reader wording is a manual `[PREVIEW-CHECK]` item (spec FR-016e). |
| Performance | Playwright `budget` | Unchanged thresholds pass. |
| Visual baselines | Playwright `visual` | Snapshotted: `writing-landing`, `writing-all`, `writing-topic` (`/writing/topics/technology-teams/`, now sand), `writing-post`, `home`, and `about` (the About section is rewritten), each at both sizes and both themes. Add `writing-series` (`/writing/drift/`). Refresh **macOS** (`pnpm run test:visual:update`) and **Linux** (`pnpm run test:visual:update:linux`, or the `visual-baselines` label fallback) after implementation; any unpredicted diff is a regression. |

## Project Structure

### Documentation (this feature)

```text
specs/013-writing-series/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── writing-pages.md # Addresses, redirects, components, copy (extends 008 blog-pages.md)
│   └── build-errors.md  # New and revised post build errors (extends 008 build-errors.md)
├── checklists/
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── config/
│   ├── topics.ts              # + drift, convergence (series: true); agentic-ai → mauve; technology-teams → sand; helpers
│   └── blog.ts                # feedDescription, series intro copy
├── content/
│   ├── schemas/post.ts        # free-form ids; both-series and near-miss guards
│   ├── posts/*.mdx            # FR-005 tagging (4 posts)
│   └── pages/about.mdx        # "About the writing" shortened, links to series pages
├── lib/content/
│   ├── topic-ids.ts           # NEW: editDistance, nearMiss, topicLabel, orderTopics, mainTopic, topicHref
│   └── post-address.ts        # RESERVED gains series ids
├── components/post/
│   ├── topic-styles.ts        # + sand, mauve, dusk entries; series marker classes
│   ├── TopicPill.astro        # controlled or free-form; delegates series ids to SeriesMarker
│   ├── SeriesMarker.astro     # NEW: "Series: Drift" pill with outline
│   ├── SeriesBanner.astro     # NEW: series name, description, other-series and Writing links
│   ├── SeriesIntro.astro      # NEW: landing framing lead with a link into each series
│   ├── SeriesPage.astro       # NEW: shared body of the two series routes
│   ├── TopicBanner.astro      # plain dusk banner for free-form topics
│   ├── TopicPillRow.astro     # non-series controlled topics only
│   ├── PostCard.astro, LeadStory.astro, PostMeta.astro  # orderTopics + mainTopic
├── components/sections/RecentWriting.astro  # one line naming D&C with series links
└── pages/writing/
    ├── index.astro                         # SeriesIntro between header and lead story
    ├── drift/[...page].astro               # NEW
    ├── convergence/[...page].astro         # NEW
    └── topics/[topic]/[...page].astro      # excludes series; adds free-form ids
public/_redirects                           # NEW: 301s from topic addresses of the series

tests/
├── unit/content/{topics,topic-ids,post-schema,post-address,blog-config}.test.ts
├── unit/site/redirects.test.ts             # NEW
├── build/{post-validation,blog-listing}.test.ts + tests/fixtures/posts/{broken,valid}/…
├── component/post/{SeriesMarker,SeriesBanner,SeriesIntro,TopicPill,TopicPillRow,PostCard,LeadStory,PostMeta}.test.ts
├── component/sections/RecentWriting.test.ts
└── e2e/{blog,blog-fixtures,blog.a11y,no-js,site-links,visual}.spec.ts
```

**Structure Decision**: Single Astro project; the feature extends the spec 008 blog modules in
place. The only new route files are the two static series folders; the only new public file is
`public/_redirects`.

## Post-design Constitution Check

Re-checked after research.md, data-model.md and contracts: all eleven principles still PASS.
The one behaviour that loosens an earlier guarantee, P21 (a removed topic id no longer fails
the build but becomes a free-form topic), follows directly from FR-011 and is recorded as a
reviewed contract change in contracts/build-errors.md and research R9, not a weakened check.
Cost remains $0/month.

## Complexity Tracking

No constitution violations. Custom code is limited to pure topic-id helpers (research R4),
justified under Principle IV in the table above.
