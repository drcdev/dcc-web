# Implementation Plan: One Page for Services and Speaking

**Branch**: `026-services-speaking-merge` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-services-speaking-merge/spec.md` (with its
2026-10-05 Clarifications)

**Major change (Constitution Principle III): YES.** Criterion: *changes the … navigation*. The
header menu drops two entries (Services, Speaking) and gains one with a new, longer label ("Work
with me"), and the site loses two addresses with no redirect. No other criterion applies: no
dependency, integration or external service is added, removed or replaced; contact data handling
is untouched; running costs do not change ($0 a month new, below); no CI, deployment, Worker or
infrastructure file changes (`setup/config.json` is setup-check data, not CI or deploy config);
the constitution is not amended. The PR body flags the change with this criterion so Don checks
the preview (menu on desktop and phone, the merged page, the two 404s) before approving.
Because those are `[PREVIEW-CHECK]` items, auto-merge stays off while they are open (CLAUDE.md
"Merging"); the PR body says so.

## Summary

Services and Speaking become one draft page, **Work with me**, at `/work-with-me/`, menu position
2. Once every changed test is written and seen failing, `src/content/pages/services.mdx` is
renamed with `git mv` to `work-with-me.mdx` in a commit of its own (so history follows), then the
Speaking sections are moved into it in the agreed order (revised 2026-10-05, see the spec Clarifications), `speaking.mdx` is deleted and the home
link and launch config follow. The rename commit is an intermediate step inside that one
implementation task, not a task of its own; the task is done only when the suite is green. The photo file needs no change: it stays at
`src/content/pages/images/don-coleman.jpg` for the home page; the merged page no longer shows it
(2026-10-05). Removing the files removes the routes; Cloudflare's existing
`not_found_handling: "404-page"` serves the not-found page for the old addresses, and the
sitemap drops them on its own. Everything else is reference updates: the home intro link, the
launch config and runbook, the pages guide, and the tests and visual baselines that name the old
menu.

## Technical Context

**Language/Version**: TypeScript (strict), Astro current stable, MDX content

**Primary Dependencies**: existing only: `astro`, `@astrojs/mdx`, `@astrojs/sitemap`,
`astro:assets`, Tailwind CSS. None added.

**Storage**: content files in Git (pages collection). No D1 change.

**Testing**: Vitest (`unit` project: unit + component via Astro Container API; `build` project:
real `astro build`), Playwright (`e2e`, `a11y`, `budget`, `visual`, `sections` projects)

**Target Platform**: Cloudflare Workers static assets (prerendered pages)

**Project Type**: static website

**Performance Goals**: existing per-template budget and Core Web Vitals "good" on mobile; the
merged page is the two pages' sections combined, with no image, within today's budget

**Constraints**: no redirects or stub pages (FR-007); page stays a draft (FR-011); copy edits
limited to joins Don reviews (FR-002, FR-005); no reserved menu position moves

**Scale/Scope**: 1 page renamed + merged, 1 page deleted, 1 home-page link, 1 config file, 2 docs,
~17 test files, 8 visual baseline images per platform

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 (bottom of this plan).*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | PASS | Every behaviour below gets a test task that is written and seen failing before the content move (Test placement). All test changes, for all three stories, land before any content file moves, so the red run is against today's files; the rename is the first step of the implementation, and no task is marked done on a red suite except the test tasks whose red is the point. |
| II. Automated Release Gate | PASS | No check is skipped or weakened. Tests naming the old pages are changed to the new structure in reviewed commits as part of the feature; counts drop from seven links to six because the spec changes the menu, not to get a check through. Visual baselines are regenerated on both platforms before the PR. |
| III. Human Review | PASS, **major change** | Navigation change (see banner). Flagged in the PR body; Don approves after the preview. |
| IV. First-Party Before Custom | PASS | Astro content collections + `[...slug].astro`/`getStaticPaths()` for the route, `astro:assets` relative images for the photo, `@astrojs/sitemap` for the sitemap, Cloudflare static assets `not_found_handling` for removed addresses. No custom code; nothing first-party is rejected (research R9). Astro Docs MCP consulted (research R1–R4 cite pages). |
| V. Static by Default | PASS | Prerendered page, no new script, no endpoint. Readable with JS off (no-JS E2E covers it). |
| VI. Content as Files | PASS | The page is an MDX file validated by the page schema; invalid content still fails the build. |
| VII. Private Data | PASS | Contact form and data untouched. The call to action is a plain link to `/contact/`. |
| VIII. Cloudflare Best Practices | PASS | No Worker, D1, Cron or `wrangler.jsonc` change; removed addresses fall to the existing static 404 handling. No dashboard step. |
| IX. Cost Ceiling | PASS | Expected new monthly cost: **$0**. Fewer pages, same hosting; nothing new is billed. |
| X. Accessible, Fast and Private | PASS | The page is added to the per-template a11y and budget lists in place of the two old ones; one `h1`, section `h2`s in order, figure alt text and caption kept. No third-party script. |
| XI. Spec Kit Workflow | PASS | Spec Kit branch and directory. Parallel-worktree note: this branch edits `tests/e2e/templates.ts`, header tests and the shared header/not-found/sections baselines, which any sibling touching the shell also edits; merge `origin/main` before regenerating baselines and regenerate after any conflict. |
| Technology Constraints | PASS | No new tool, service or library. Design baseline unchanged (menu label text only; no style, token or layout change). |
| Security Baseline | PASS | `_headers`, ruleset, Dependabot, rate limits untouched; `_redirects` gains nothing. |
| Development Workflow | PASS | Astro choices cite docs; tests before implementation; one primary layer per behaviour (below); out-of-scope items stay in the spec's follow-up list; copy is plain language. |

No violations, so Complexity Tracking is empty.

## Design

### Files

| File | Change |
|---|---|
| `src/content/pages/services.mdx` → `work-with-me.mdx` | `git mv` (own commit, no edits), then: `title: Work with me`, combined `description`, `nav.position: 2`, `draft: true`; body in FR-004 order (Don's edited copy, research R6), one lead, one call to action; no bio or photo. |
| `src/content/pages/speaking.mdx` | `git rm` after its sections are in the merged file. |
| `src/content/pages/images/don-coleman.jpg` | Unchanged; used by `index.mdx` only, the merged page no longer shows it (research R2). |
| `src/content/pages/index.mdx` | `intro.cta.href: /work-with-me/`. |
| `setup/config.json` | `launch.expectedPages` and `launch.expectedPaths`: replace the two old entries with `work-with-me` and `/work-with-me/`. |
| `docs/launch.md` | L2: "Replace the Work with me placeholder copy …". |
| `docs/pages.md` | Address table and examples use `work-with-me` / `/work-with-me/` (the front-matter example becomes `title: Work with me`, `position: 2`, no label); the menu-positions section says position 3 is free (FR-013). |
| `src/lib/nav.ts`, `src/components/SiteHeader.astro` | Comment-only: the `/services` example becomes `/work-with-me`; "seven primary links" becomes "the primary links". No logic change. |
| `public/_redirects`, `astro.config.mjs`, `wrangler.jsonc`, `src/config/navigation.ts` | **No change** (research R3–R5). |

Left as they are, on purpose: the contact page description and the terms of use (they describe
kinds of enquiry, spec Assumptions); component and schema tests whose `/services/…` hrefs are
synthetic inputs to a component or schema, not claims about the site (`Offerings.test.ts`,
`TextBlock.test.ts`, `PageLayout.test.ts`, `page-schema.test.ts`, `section-schemas.test.ts`,
`navigation.test.ts` under `tests/unit/site/`, `launch-content-ready.test.ts`'s missing-file
case); the fixture `tests/fixtures/pages/sections.mdx` (its `href` is not visible in the sections
snapshot and the fixture site is not crawled); and the `src/services/` example in the
speckit-tasks skill (unrelated).

### Test placement (Development Workflow: one primary layer each)

Tests are changed first and run red against the old content, then the content move turns them
green.

| Behaviour (FR) | Layer | Test file and change |
|---|---|---|
| Launch page files: `work-with-me.mdx` exists, draft, position 2; no `services.mdx`/`speaking.mdx`; uses only registered sections (FR-001, FR-006, FR-011) | Unit | `tests/unit/content/launch-content.test.ts`: LAUNCH list and the "sections in …" block become one entry for `work-with-me.mdx`; add "no `services.mdx` or `speaking.mdx`". |
| Section order, two titled groups with three offerings each, one lead, one call to action to `/contact/`, page opens with the lead, no-practice note inside the Consulting block (FR-002–FR-005) | Unit | Same file, new `describe("Work with me page")`: reads the MDX body and asserts the tag/title sequence. Cheapest layer that sees the order; copy wording is not asserted (Don reviews it). |
| Navigation built from the page files: six entries in order, label "Work with me" (FR-006) | Unit | `tests/unit/content/navigation.test.ts`: fixture pages and expected list. |
| Only Work with me marked current on `/work-with-me/` (US2) | Component | `tests/component/SiteHeader.test.ts`: PRIMARY list and the current-page case. |
| Home intro call to action goes to `/work-with-me/` (FR-009) | Component | `tests/component/HomeIntro.test.ts`: the fixture `cta.href` mirrors `index.mdx`, so it and its assertions move to `/work-with-me/`. The E2E click in `pages.spec.ts` stays as the journey check (it is the existing one; only its target changes). |
| Launch config names the page and the path; every expected page id has a file (FR-010) | Build (existing) | `tests/build/indexing.test.ts` "names a file … for every expected page id" covers it once `setup/config.json` changes; no new test. |
| Launch check reports a draft, not a missing Services/Speaking (FR-010, SC-005) | Build (existing) | `tests/unit/setup-check/checks/launch-content-ready.test.ts` uses synthetic contexts only and stays unchanged; the real config-to-file match is the `indexing.test.ts` case above, and a draft page is reported as a draft by the existing rule. No new test. |
| Draft notice and robots meta on a real draft page (FR-011) | Build | `tests/build/local-site.test.ts`: `services/index.html` → `work-with-me/index.html`. |
| Sitemap lists `/work-with-me/`, not the old addresses (FR-008) | Build | `tests/build/indexing.test.ts` sitemap test: add the three assertions. |
| No internal link to a removed page (FR-009, SC-004) | E2E (existing) | `tests/e2e/site-links.spec.ts` crawl, unchanged; it fails if any link points at a 404. |
| `/services/`, `/speaking/` (with and without slash) return 404 (FR-007, SC-003) | E2E | `tests/e2e/not-found.spec.ts`: add a `REMOVED_PAGES` list to `NOT_FOUND_ADDRESSES`. Only the served build shows the status. |
| No redirect rule names either address (FR-007, SC-003) | Unit | `tests/unit/site/redirects.test.ts`: one assertion that no rule's source starts with `/services` or `/speaking`. |
| Menu on every template: six links in order, desktop row, phone menu, no-JS, tab order (US2, FR-012) | E2E (existing) | `tests/e2e/templates.ts` TEMPLATES (`services`, `speaking` → one `work-with-me`) and PRIMARY; `menu.spec.ts` and `no-js.spec.ts` counts 7 → 6; "seven" wording in titles and comments in `shell.spec.ts`, `no-js.spec.ts`, `pages.spec.ts`, `SiteHeader.test.ts`, `launch-content.test.ts`, `navigation.test.ts`. |
| Current-page marking in the browser; home CTA journey (US2, FR-009) | E2E (existing) | `tests/e2e/pages.spec.ts`: the Services/Speaking current-page case becomes Work with me; the CTA navigates to `/work-with-me/`. |
| Other specs naming the old address | E2E (existing) | `shell.spec.ts` tab-order exception `outside:/services/` → `outside:/work-with-me/`; `analytics.spec.ts` path list `/services/` → `/work-with-me/`; `theme-tokens.spec.ts` selector `a[href="/services/"]` → `/work-with-me/`. |
| WCAG 2.2 AA and performance budget on the merged page (FR-012, SC-006) | E2E a11y / budget (existing) | Driven by TEMPLATES; no new test. |

### Visual baselines

No Services or Speaking page baselines exist (the visual project snapshots only the shell, the
not-found page and the fixture site). Expected to change, both themes, both platforms (8 images
per platform, FR-015): `header-desktop-*`, `menu-open-phone-*`, `not-found-desktop-*`,
`sections-desktop-*`. The phone shots `header-phone-*`, `not-found-phone-*` and `sections-phone-*`
show only the closed phone header (the link list is hidden at phone width with JavaScript on), so
they should not change. Any other diff is a regression. Refresh per `.claude/skills/_shared/visual-baselines.md`: macOS
`pnpm run test:visual:update`, Linux `pnpm run test:visual:update:linux` in Docker (ask Don to
start Docker Desktop), CI label only as fallback. Commit and push before opening the PR.

### Header fit

"Work with me" replaces "Services" + "Speaking" + one 2 rem gap, so the desktop row is shorter
than today's and the phone menu stacks one link per line (research R5). The existing header E2E
geometry checks and the header/menu snapshots are the proof; no new test.

## Project Structure

### Documentation (this feature)

```text
specs/026-services-speaking-merge/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── work-with-me-page.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/content/pages/
├── work-with-me.mdx         # renamed from services.mdx, Speaking merged in
├── index.mdx                # intro.cta.href
└── images/don-coleman.jpg   # unchanged, shared
src/lib/nav.ts               # comment only
src/components/SiteHeader.astro  # comment only
setup/config.json
docs/launch.md
docs/pages.md
tests/unit/content/{launch-content,navigation}.test.ts
tests/unit/site/redirects.test.ts
tests/component/{SiteHeader,HomeIntro}.test.ts
tests/build/{indexing,local-site}.test.ts
tests/e2e/{templates.ts,pages,shell,menu,no-js,not-found,analytics,theme-tokens}.spec.ts
tests/e2e/visual.spec.ts-snapshots/   # 8 images per platform
```

**Structure Decision**: existing single Astro site; no new directories.

## Risks and open points

- **Copy is Don's**: he reviewed and rewrote the page on 2026-10-05 (research R6). The PR lists
  the meta description, lead, Consulting block and call to action (label "Get in touch") for
  his final read.
- **Sibling worktrees** editing the shell or `templates.ts` will conflict on the same baselines
  and lists; merge `origin/main` before regenerating baselines.
- **Docker vs CI drift**: the shell images contain only plain Inter text, which matched CI first
  run after PR #72, so Docker Linux baselines are expected to pass; the CI label is the fallback.

## Follow-up (out of scope, from the spec)

Rewriting offering copy beyond the joins, publishing the page, filling in past talks, and any
contact-form change.

## Post-design Constitution Check

Re-checked after research, data model, contract and quickstart: still PASS on every principle.
The design adds no code, dependency, endpoint or cost; it uses only first-party behaviour already
in place; it remains a major change for navigation alone.

## Complexity Tracking

None. No principle is violated.
