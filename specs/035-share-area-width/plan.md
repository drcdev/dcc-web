# Implementation Plan: Share area and views note match the post width

**Branch**: `035-share-area-width` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/035-share-area-width/spec.md`

## Summary

The views note and the Share area at the end of a post are capped at the reading column
(`max-w-3xl`, 48rem) and centred, while the title card spans the article (`max-w-screen-lg`,
64rem). Both end-of-post pieces are already direct children of the `<article>`, outside the
questions-panel grid, so removing the cap is enough to give them the title card's edges at every
width, including under the panel row at `xl`. The Share area then gets a responsive row: from
the `md` breakpoint (768 px) the heading sits left and the links right, vertically centred;
below it the links stack under the heading and everything is centred. The views note is
left-aligned from `md` and centred below it. Only Tailwind utility classes change, in three
files; no markup order, content, script or test helper changes.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, per `package.json`)

**Primary Dependencies**: Astro, Tailwind CSS (the site's design system); no additions

**Storage**: N/A

**Testing**: Playwright E2E (existing `tests/e2e/blog.spec.ts`), Playwright visual project
(existing post-template baselines), Vitest component tests (existing, unchanged)

**Target Platform**: Static pages served by Cloudflare Workers static assets

**Project Type**: Static web site (Astro)

**Performance Goals**: Unchanged; CSS-only change, no new JavaScript, budget unaffected

**Constraints**: WCAG 2.2 AA (reflow at 320 px and 200% zoom, focus order unchanged); no
client-side JS added; no sideways scroll

**Scale/Scope**: One layout (`PostLayout.astro`) and two post components (`Share.astro`,
`ViewsNote.astro`); blog posts only

## Design

### Files changed

| File | Change |
|------|--------|
| `src/layouts/PostLayout.astro` | The ViewsNote wrapper `<div class="mx-auto mt-8 max-w-3xl">` becomes `<div class="mt-8">` (keeps the spacing, drops the cap). The comment above the article is updated if it describes the width. |
| `src/components/post/ViewsNote.astro` | Add `text-center md:text-left` to the `<p data-views-note>`. Wording, border, size, italic and colours unchanged. |
| `src/components/post/Share.astro` | `<section>`: drop `mx-auto max-w-3xl`; add `text-center md:flex md:items-center md:justify-between md:gap-x-6 md:text-left`. `<h2>`: `mb-3` becomes `mb-3 md:mb-0 md:shrink-0`. Links `<div>`: add `justify-center md:justify-end` (keeps `flex flex-wrap items-center gap-3`). Header comment updated: the hidden button still sits at the end of the same row and moves nothing vertically, but with the links right-aligned (or centred) showing it shifts the other links sideways, not the heading. |

Result per breakpoint (Tailwind's default `md` = 48rem = 768 px):

- **Below 768 px**: section is a block; heading centred, links wrap as centred lines below it;
  views note centred. Width already equals the title card (page narrower than 48rem).
- **768 px and up**: section is a flex row, heading left, link group right, vertically centred;
  views note left-aligned. From 1024 px both pieces now reach the 64rem article edges instead of
  the 48rem column.
- **1280 px and up with the questions panel**: the pieces are siblings of the grid `<div>`, not
  inside it, so they already span text plus panel with the title card's edges. No grid change.

DOM order is unchanged (views note, `h2`, LinkedIn, email, Share button), so reading and focus
order is unchanged (FR-005). Under 200% zoom at a 768 CSS px layout the link group wraps inside
its flex item (`flex-wrap`), and `md:shrink-0` keeps the heading on one line.

### Decisions and rejected alternatives

1. **Change Share.astro's own classes, not the caller.** Rejected: giving Share a `class` prop
   and setting width/arrangement from `PostLayout` (the pattern in Astro's
   [Styles and CSS, "Passing a class to a child component"](https://docs.astro.build/en/guides/styling/#passing-a-class-to-a-child-component)).
   Share is used only in `PostLayout`, and its arrangement (heading left, links right) is the
   component's own look, so it belongs with the component. A prop would add an API for one caller.
2. **Keep the elements where they are; do not move them.** Rejected: moving the views note and
   Share area into, or around, the questions-panel grid (for example as a `xl:col-span-2` row).
   They are already outside the grid and full-width children of the `<article>`, which is exactly
   the title card's box; the only thing narrowing them is `max-w-3xl`. Moving them into the grid
   would add `col-span` rules for no gain and risk the sticky panel's row (the panel stays inside
   the body's row, per the existing comment).
3. **Alignment on ViewsNote itself, not on the PostLayout wrapper.** The note's look already lives
   in its component; the wrapper keeps only spacing.
4. **Flex row with `justify-between`, not a CSS grid.** Two items, one row, wrap-safe; matches
   the existing flex link group. Utility classes per Astro's
   [Styles and CSS, "Tailwind"](https://docs.astro.build/en/guides/styling/#tailwind) guide, which
   is how the site already styles components.
5. **No new breakpoint.** `md` is Tailwind's default 768 px, chosen in Clarifications.

### Astro documentation consulted (Principle IV)

Astro Docs MCP (`astro-docs`) was used:

- [Styles and CSS → Tailwind](https://docs.astro.build/en/guides/styling/#tailwind): Tailwind
  utility classes in `.astro` components (the approach taken).
- [Styles and CSS → Passing a class to a child component](https://docs.astro.build/en/guides/styling/#passing-a-class-to-a-child-component):
  the considered and rejected `class`-prop alternative.
- [Styles and CSS → Combining classes with `class:list`](https://docs.astro.build/en/guides/styling/#combining-classes-with-classlist):
  `PostLayout` keeps its existing `class:list` usage; no new conditional classes are needed.

## Tests (written first, seen to fail)

Layer choice per `docs/testing.md` "Where a test goes": edges, row versus stack and centring
are geometry only a browser can show, so the primary layer is **E2E**, added to the existing
`share` describe block in `tests/e2e/blog.spec.ts` (no new spec file, no helper or config edit).
`POST` there renders the questions panel (every built post gets a question hash), so the 1440 px
case covers the panel row.

1. **Edges (FR-001, SC-001)**, at 375, 768, 1024 and 1440 px: the `[data-views-note]` and
   `[data-share]` boxes' left and right edges are within 1 px of `[data-title-card]`'s. Fails today
   at 1024 and 1440.
2. **Wide arrangement (FR-002, SC-002)**, at 768 and 1440 px: the `h2` is left of the first link,
   their vertical centres are within 1 px, the last visible link's right edge is at the section's
   content-box right (within 1 px), and the views note's computed `text-align` is `left`. Fails
   today (heading above links).
3. **Narrow arrangement (FR-003, SC-002)**, at 320 and 375 px: every link's top is below the
   `h2`'s bottom; the `h2` and views note compute `text-align: center`; the links group's
   horizontal centre is within 1 px of the section's content-box centre. Fails today (left-aligned).

Kept as they are, and expected to stay green: the existing "showing the Share button moves no
content vertically" check (FR-002 scenario 3, heading does not move), the no-JS share test, the
order test (`data-views-note` before `data-share` before related), `geometry.spec.ts` sideways-scroll
at 320/390/1280 and `a11y.spec.ts` / `blog.a11y.spec.ts` (FR-005, SC-003). Component tests
(`Share.test.ts`, `ViewsNote.test.ts`, `PostLayout.test.ts`) assert structure, not classes, and are
not changed (invariants, not mirrors).

**Visual (SC-004)**: the fixture-site `post-template-*` element shots (`#main > article`) change
on purpose. Refresh them on macOS (`pnpm run test:visual:update`) and Linux
(`pnpm run test:visual:update:linux`, Docker) per `.claude/skills/_shared/visual-baselines.md`.
Only `post-template-*` images may change; any other diff is a regression.

## Constitution Check

*GATE: passed before design; re-checked after design: still passes.*

| Principle | Status |
|-----------|--------|
| I. Test-First | Pass. Three E2E tests in an existing spec, written and seen to fail before the class changes; each names its layer and reason. |
| II. Automated Release Gate | Pass. No check skipped or weakened; visual baselines refreshed as an intended change. |
| III. Human Review | Pass. Normal PR from `drc-agents`, auto-merge armed, Don approves. |
| IV. First-Party Before Custom | Pass. Tailwind utilities in Astro components, cited above via the Astro Docs MCP; no custom CSS, no new package. |
| V. Static by Default | Pass. Prerendered page; no new client-side JS; the existing Share script is untouched. Readable without JS. |
| VI. Content as Files | Pass. No content or schema change. |
| VII. Private Data | Pass. No contact-data change. |
| VIII. Cloudflare Best Practices | Pass. No Worker, binding or config change. |
| IX. Cost Ceiling | Pass. No cost change. |
| X. Accessible, Fast and Private | Pass. Order, contrast, targets unchanged; reflow covered by existing geometry and a11y checks; CSS-only, budget unaffected. |
| XI. Spec Kit Workflow | Pass. Spec Kit branch and directory; files touched are listed above for any parallel worktree. |
| Development Workflow | Pass. Scope held to the spec; out-of-scope items stay in the spec's follow-up list. |

### Triage condition 1 (small-change pipeline)

Still holds. This change has no dependency, integration or service change; no contact-data
change; no design-system, site-wide layout, navigation or visual-identity change (it rearranges
the end of one page template using existing tokens and the existing `md` breakpoint; the shell and
other templates are untouched); no cost increase; no CI, deploy or infrastructure config change;
no constitution amendment.

Also confirmed: no new route, no schema change, no new E2E spec file, no edit to shared test
helpers (`tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`, `tests/component/html.ts`,
`tests/fixtures/`) or to Playwright/Vitest config, and no new client-side JS.

## Project Structure

### Documentation (this feature)

```text
specs/035-share-area-width/
├── spec.md
├── plan.md              # this file
├── quickstart.md        # manual validation
├── checklists/requirements.md
└── tasks.md             # next phase (/speckit-tasks)
```

research.md, data-model.md and contracts/ are not produced: there are no unknowns, no data and no
interface.

### Source Code (repository root)

```text
src/
├── layouts/PostLayout.astro          # ViewsNote wrapper loses max-w-3xl
└── components/post/
    ├── Share.astro                   # full width, md row / centred stack
    └── ViewsNote.astro               # centred below md, left from md
tests/
└── e2e/
    ├── blog.spec.ts                  # three new tests in the share describe
    └── visual.spec.ts-snapshots/     # post-template-* refreshed (macOS + Linux)
```

**Structure Decision**: Existing single Astro project; changes stay in the post layout, two post
components, one existing E2E spec and the post-template visual baselines.

## Complexity Tracking

No constitution violations; nothing to justify.
