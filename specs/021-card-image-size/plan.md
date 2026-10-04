# Implementation Plan: Right-size listing card images

**Branch**: `021-card-image-size` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-card-image-size/spec.md` (GitHub issue #73)

**Major change (Constitution Principle III): NO.** The slice changes one component's image
props. It adds, removes or replaces no dependency, integration or service; touches no contact
data; changes no design-system token, layout, navigation or visual identity (the card is drawn
at the same size and shape; only the downloaded file is smaller); cannot raise running costs
(it lowers bytes served); changes no CI, deployment, Worker or infrastructure file (no edit to
`astro.config.mjs`, `playwright.config.ts`, workflows or `wrangler` config); and does not amend
the constitution. It does change a template's rendered output (the card's `srcset`, `sizes`
and encoding), and the `listing-cards` visual baseline is predicted to change; neither is a
Principle III trigger, because the rendered appearance is unchanged by design and the diff is
predicted in the spec. Auto-merge applies once the gate is green and Don approves.

## Summary

Card images are offered as 320w, 480w and 640w at sharp's default WebP quality (80), and on a
390 px phone the card declares `100vw`, so the browser downloads the 480w file for a card drawn
358 px wide. This feature changes three props on the `<Image>` in
`src/components/post/PostCard.astro`: `widths` becomes `[320, 400, 640]`, the phone value in
`sizes` becomes `calc(100vw - 2rem)` (the card's real width inside `main`'s 1rem padding), and
a new per-image `quality={65}` lowers only the card's encoding. Every phone up to about 430 px
wide at 1x then picks the 400w file. On the convergence series page the two card images drop
from 77,520 to about 41,000 bytes (47%), taking the page from 121,654 to about 85,000 bytes
under the unchanged 150 KB budget. Tests come first: component tests pin the offered versions,
`sizes` and quality, and one fixture-site E2E test proves a 390 px browser picks at most 400w
on every card listing.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, Node 24 from `.nvmrc` via nvm

**Primary Dependencies**: Astro's `<Image>` from `astro:assets` with the default sharp image
service (sharp 0.35.5, already installed). No new dependency.

**Storage**: N/A. No content, schema or source image changes.

**Testing**: Vitest `unit` project (component tests with the Astro container), Playwright
`sections` project (fixture site, port 4322), existing `budget` and `visual` projects unchanged
in code.

**Target Platform**: Static pages on Cloudflare Workers static assets; evergreen browsers.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: Card images on a 390 px 1x phone are the 400w version (SC-001);
convergence card images ≤ 47 KB and page < 100 KB, reported in the PR (SC-002); every budget
template ≤ 150 KB with LCP ≤ 2.5 s, CLS < 0.1, long tasks ≤ 200 ms, JS ≤ 10 KB (SC-003,
unchanged limits).

**Constraints**: Only post-card images change (FR-006); same shape, alt, intrinsic size, lazy
loading and WebP (FR-005); no enlarging of small sources; WCAG 2.2 AA unchanged.

**Scale/Scope**: 1 component (3 props), 3 component test files, 1 E2E spec, up to 8 visual
baseline images (`listing-cards`, 2 themes × 2 widths × 2 platforms), 1 doc note.

No NEEDS CLARIFICATION remains; research.md R1 to R5 resolves every choice.

## First-party options (Principle IV)

| Capability | First-party option | Used? |
|---|---|---|
| Offer a card-sized candidate | `<Image widths sizes>` from `astro:assets` (docs.astro.build/en/reference/modules/astro-assets/#widths, #sizes) | **Yes.** Exact widths and a hand-set `sizes`, as the docs advise when the image is not full width (R1). |
| Automatic responsive set | `layout="constrained"` / `"full-width"` (docs.astro.build/en/guides/images/#responsive-image-behavior) | No: it picks its own widths, so FR-001's exact set cannot be pinned (R1). |
| Lower quality for cards only | `quality` prop on `<Image>` (docs.astro.build/en/reference/modules/astro-assets/#quality) | **Yes**, `quality={65}`. Presets map to 25/50/80/100 in sharp, none in range, so a number (R2). |
| Lower quality site-wide | `image.service.config.webp.quality` (docs.astro.build/en/reference/configuration-reference/#imageservice) | No: it would change hero, lead, project and home images, breaking FR-006 (R2). |
| Encoding | `astro:assets` sharp image service (default) | **Yes**, unchanged. |
| Custom `<img>` from `getImage()` | docs.astro.build/en/guides/images/#generating-images-with-getimage | No: re-implements what `<Image>` gives; custom code is not justified (R2). |
| Cloudflare / Fly.io | Cloudflare Images / Image Resizing | No: images are optimised at build into static assets (Principle V); a paid image product would add cost and an integration (Principles III, IX). Fly.io is not used by this site. |

The Astro Docs MCP was available and consulted; no fallback to memory.

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1. No violation; no stop condition.*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | Pass | Tests first and seen to fail: component tests (C1 to C5) fail on today's 480w, `100vw` and missing `q=`; the E2E test (C6) fails on today's 480w pick. Each test task names its layer (research R5). |
| II. Automated Release Gate | Pass | No check is skipped or weakened; the budget stays at 150 KB; the full `pnpm run verify` gate runs before the PR. |
| III. Human Review for Major Changes | Pass, **not major** | See the statement at the top: no criterion fires. The predicted `listing-cards` baseline refresh is not a design-system change. Auto-merge on. |
| IV. First-Party Before Custom | Pass | `<Image>` `widths`, `sizes`, `quality` from `astro:assets`; alternatives named above with the reason each falls short; docs pages cited. |
| V. Static by Default | Pass | Images are still generated at build and served as static assets; no JavaScript added. |
| VI. Content as Files | Pass | No content, schema or image file changes. |
| VII. Private Data | Pass | Not touched. |
| VIII. Cloudflare Best Practices | Pass | No Worker, D1 or config change; static assets only, and fewer bytes served. |
| IX. Cost Ceiling | Pass | **Expected new monthly cost: $0.** No service, plan or usage increase; transfer per page falls. |
| X. Accessible, Fast and Private | Pass | Same alt text and intrinsic size (no CLS); lighter pages help LCP on slow 4G; budget unchanged and still enforced; no third-party script. |
| XI. Spec Kit Workflow | Pass | Spec Kit branch and directory; one feature; the only shared file with a parallel worktree risk is `PostCard.astro` and its test, none known in flight. |
| Technology Constraints | Pass | No new tool, service or library. |
| Development Workflow | Pass | Astro choices cite docs pages (R1, R2); test placement per R5; scope kept to post cards (other images are spec follow-up); plain language. |

**Post-design re-check (after Phase 1)**: unchanged. The design adds no file outside the
component, its tests, one E2E case and the baselines.

## Test plan (one primary layer per behaviour)

| Behaviour | Layer | Test |
|---|---|---|
| C1 widths 320/400/640 offered (FR-001, FR-004) | Component | `tests/component/post/PostCard.test.ts`: parse `srcset` descriptors of the `withImage` card (1200 px fixture source) and expect exactly `320w, 400w, 640w`. |
| C2 `sizes` exact (FR-002) | Component | Same file: `sizes` equals the contract string. |
| C3 quality 65 and WebP on every candidate (FR-003, FR-005) | Component | Same file: every `srcset` URL and `src` has `q=65` and `f=webp`. |
| C4 alt, size, lazy, shape kept (FR-005) | Component | Existing assertions in the same file stay green; add the `aspect-[16/9]` class check. |
| C5 other images unaffected (FR-006) | Component | `LeadStory.test.ts`, `PostHero.test.ts`: no `q=` in their candidates. |
| C6 phone picks ≤ 400w on every card listing (FR-002, SC-001) | E2E (`sections`, fixture site) | `tests/e2e/blog-fixtures.spec.ts`: new describe "card images at phone width": 390×844, `deviceScaleFactor: 1`, pages `/`, `/writing/`, `/writing/all/`, `/writing/topics/fixture-cards/`, `/writing/drift/`; scroll each card `img` into view, wait for `complete`, map `currentSrc` to its `srcset` descriptor, expect ≤ 400w and at least one image card per page. Only a browser shows the chosen candidate. No real post named. |
| C7 budget (FR-007, SC-003) | Budget | Existing `budget.spec.ts`, unchanged. |
| SC-004 appearance | Visual | Existing `listing-cards` subject; refresh only that subject's baselines if they diff. |

No behaviour is tested at a second layer. The component and E2E tests observe different
behaviours (what is offered versus what is chosen).

## Visual baselines

The `listing-cards` subject (`/writing/topics/fixture-cards/` on the fixture site) is the only
one predicted to change: at phone width the browser now draws the 400w file instead of the 480w
one, and every card candidate is re-encoded at quality 65. The fixture image is flat colour, so
the diff may fall under the comparison threshold and need no refresh; `--update-snapshots`
only rewrites images past the threshold. Planned step after implementation:

- run `pnpm run test:visual`; if `listing-cards-*` fails, refresh both sets:
  - **macOS:** `pnpm run test:visual:update`.
  - **Linux:** `pnpm run test:visual:update:linux` (Docker Desktop; ask Don to start it if
    `docker info` fails), or the `visual-baselines` PR label and its artifact as the fallback
    (copy only `*-linux.png`).
- Commit only `listing-cards-*` images. Any other subject that differs (`lead-story`,
  `post-template`, project rows, shell) is a regression to fix, not a baseline to refresh.

## SC-002 report

Baseline (research R4): `/writing/convergence/` 121,654 bytes total, card images 78,604 bytes
(77,520 bytes of image body: `starting-new-hero` 480w 46,508 + `wayfinder-hero` 480w 31,012).
Expected after: about 41,000 bytes of card image body, about 85,000 bytes total. The after
figures come from the `budget` annotation and `dist/_astro/` file sizes once built, and both go
in the PR body (not an automated check, per the spec).

## Project Structure

### Documentation (this feature)

```text
specs/021-card-image-size/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R5, quality comparison table, baseline
├── data-model.md        # Phase 1: the rendered card image, before and after
├── quickstart.md        # Phase 1: how to validate
├── contracts/
│   └── post-card-image.md   # Phase 1: rows C1–C7
├── checklists/          # from specify/clarify
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/components/post/PostCard.astro            # widths, sizes, quality props (the only source change)
tests/component/post/PostCard.test.ts         # C1–C4
tests/component/post/LeadStory.test.ts        # C5
tests/component/post/PostHero.test.ts         # C5
tests/e2e/blog-fixtures.spec.ts               # C6 (sections project, fixture site)
tests/e2e/visual.spec.ts-snapshots/listing-cards-*.png   # only if they diff
docs/testing.md                               # one line: where the card-image check lives
```

**Structure Decision**: single Astro project; the change is confined to the post card
component and its tests. `CardGrid`, `FeaturedGrid`, `RecentWriting` and `RelatedPosts` all
render `PostCard`, so they inherit the change with no edit.

## Risks and notes

- The saving relies on `sizes` matching the drawn width. Where a card is narrower than
  `calc(100vw - 2rem)` on a phone (for example inside extra padding), the browser can only pick
  an equal or smaller candidate, never a larger one, so SC-001 still holds.
- If the Astro container does not put `q=` in candidate URLs in the component test, the C3 check
  moves to a build test of the fixture site HTML with a written reason; this is checked at the
  red step.
- Incidental: `wayfinder-hero.jpg` shows a river over rocks, while its alt text describes
  willow roots. Out of scope here; noted as possible follow-up content work.

## Complexity Tracking

No constitution violations; nothing to justify.
