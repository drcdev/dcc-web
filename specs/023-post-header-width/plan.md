# Implementation Plan: Post Header Width

**Branch**: `023-post-header-width` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-post-header-width/spec.md`

## Summary

On a writing post the title card (`[data-title-card]` in `src/layouts/PostLayout.astro`) is
capped at `max-w-3xl` (48rem) and centred with `mx-auto`, while the feature image
(`src/components/post/PostHero.astro`) spans the full article (`max-w-screen-lg`). From about
768 px up the card is narrower than the image. The fix removes the card's width cap and centring
so it fills the article, which is exactly the image's width (the image is `w-full` inside the same
article). With no cap on the card, its text already runs the card's full inner width (FR-003): the
card's children carry no measure of their own. One class-list edit in one template; one E2E
geometry test; refreshed post-template visual baselines.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable), Tailwind CSS 4

**Primary Dependencies**: none added

**Storage**: N/A

**Testing**: Playwright E2E (fixture site, project `sections`), Playwright visual project, Vitest
component tests (unchanged)

**Target Platform**: static pages on Cloudflare Workers static assets

**Project Type**: static website

**Performance Goals**: unchanged; no new CSS beyond removing two utilities, no JavaScript

**Constraints**: WCAG 2.2 AA; no sideways scroll at 320 px; every other part of the post page
pixel-identical (SC-004)

**Scale/Scope**: one template (`PostLayout.astro`), one class list

## Design

### The change

In `src/layouts/PostLayout.astro`, the title card's static class string loses `mx-auto max-w-3xl`:

- before: `relative mx-auto max-w-3xl rounded-xl border ... p-6 shadow-sm ...`
- after: `relative rounded-xl border ... p-6 shadow-sm ...`

The card is a block-level `div`, so without a max width it fills its containing block, the
`<article class="mx-auto max-w-screen-lg">`. The hero `<figure>` and its `<img class="w-full">`
fill the same article, so the edges match at every width (FR-001, FR-002), with or without a
feature image (edge case "No feature image"), with or without the questions panel (the panel
sits in a later sibling and does not affect the card). Below 768 px the cap was never reached, so
phone widths are unchanged (SC-002).

Nothing else moves: the vertical offsets (`-mt-12 sm:-mt-16`, `mt-4`, `mt-2`) stay in the
conditional `class:list` entry, the caption keeps its own `mx-auto max-w-3xl` in `PostHero.astro`
(FR-004, edge case "Caption under the image"), and the body, panel, views note and share row keep
their `max-w-3xl` columns (spec Follow-up keeps those out of scope). The card's children (`h1`,
summary `p`, `PostMeta`) have no width cap, so the text wraps at the card's padded inner edge
(FR-003); no inner wrapper is added.

### Decisions and rejected alternatives

- **Remove `mx-auto max-w-3xl` vs. add `md:max-w-none`.** Chosen: remove. FR-002 forbids a
  breakpoint-dependent rule, and the cap never applies below 768 px anyway (the article is
  narrower than 48rem there), so `md:max-w-none` would only add a redundant breakpoint and keep a
  dead class at small widths. `mx-auto` is pointless once the card fills its parent.
- **Widen the card vs. narrow the hero to `max-w-3xl`.** Chosen: widen the card. The spec asks
  for the header to match the image, and FR-004 says the image must not resize.
- **Keep a 48rem text measure inside the wider card.** Rejected by the Clarifications session
  (text runs the full card width).
- **A `w-full` or explicit width on the card.** Not needed; a block element already fills its
  container, and the questions-panel grid does not wrap the card.

### Astro documentation (Principle IV)

Consulted through the Astro Docs MCP (`astro-docs`):

- Combining classes with `class:list` — https://docs.astro.build/en/guides/styling/#combining-classes-with-classlist
  and https://docs.astro.build/en/reference/directives-reference/#classlist. The card keeps its
  existing `class:list` array; only the static string entry changes.
- Tailwind in Astro — https://docs.astro.build/en/guides/styling/#tailwind. The width is set by
  removing Tailwind utilities; no scoped `<style>` or new CSS is introduced.

No Astro API, configuration or integration changes.

## Tests (written first, seen to fail)

Layer rule from `docs/testing.md` "Where a test goes": one primary layer per behaviour.

1. **E2E (primary layer for FR-001, FR-002, SC-001)** — add a `test.describe("title card width")`
   block to the existing `tests/e2e/blog-fixtures.spec.ts`, using the existing `LEAD`
   (`/writing/every-part/`, which has a feature image and no caption) and `TEXT_ONLY` constants:
   - For each width in `[768, 1024, 1280, 1440]`: on `LEAD`, the `[data-title-card]` bounding
     box's left and right edges are within 1 px of `[data-post-hero] img`'s left and right edges.
     Fails today at 1024 px and up (card 768 px, image wider); 768 px passes before and after and
     guards the lower bound.
   - At 1280 px on `TEXT_ONLY` (no feature image): the card's left and right edges are within
     1 px of `#main > article`'s edges (edge case "No feature image"). Fails today.
   - Reason this is E2E: the width match is layout geometry only a browser can show. Placed in
     `blog-fixtures.spec.ts` rather than `questions.spec.ts` because the questions placement
     tests use `text-only`, which has no hero image to compare against.
2. **No component test.** A class-list assertion in `tests/component/post/PostLayout.test.ts`
   would test the same behaviour at a second layer without a reason that earns it; skipped. The
   existing component, theme-token and placement tests stay as they are (none assert the card's
   width classes).
3. **FR-003 (text runs full width)** is covered by the same E2E edge check: the card's children
   have no cap, so a full-width card means full-width text. No separate test.
4. **Accessibility (FR-005, SC-003)** — existing `a11y.spec.ts` scan of the post templates,
   unchanged; must stay green. No sideways scroll at 320 px is already covered by the "very long
   title" test (`long-title` at 320 px) and the questions placement tests.
5. **Visual (SC-004)** — the `post-template-*` element shots of `/writing/every-part/` change
   (the card is wider at desktop; phone shots should be unchanged). Refresh both sets:
   - macOS: `pnpm run test:visual:update`
   - Linux: `pnpm run test:visual:update:linux` (Docker), or the `visual-baselines` PR label
     and the `visual-baselines-linux` artifact (copy only `*-linux.png`).
   Inspect the diffs: only `post-template-desktop-{light,dark}` should change, and only the
   card's width and text wrapping. Any other changed shot is a regression to fix, not a baseline
   to refresh.

No new spec file, no edits to shared helpers (`tests/e2e/templates.ts`,
`tests/e2e/csp-violations.ts`, `tests/component/html.ts`, `tests/fixtures/`) and no Playwright or
Vitest config changes are needed.

## Constitution Check

*GATE: passes before and after design.*

| Principle | Status |
| --- | --- |
| I. Test-First | Pass. The E2E width test is written and seen to fail (1024 px and up, and the no-image case) before the class edit. |
| II. Automated Release Gate | Pass. Full gate in CI; nothing skipped or weakened; baselines refreshed, not loosened. |
| III. Human Review for Major Changes | No criterion fires. No dependency, contact data, cost, CI/infra or constitution change. The design-system/layout criterion does not fire: this changes one template's internal layout (the post title card's width), not the design tokens, the site-wide shell (header, footer, navigation) or the visual identity. The visual-baseline refresh is limited to the post-template shots. If the orchestrator reads a post-template width change as "site-wide layout", it should promote to /deliver; this plan's read is that it is not. |
| IV. First-Party Before Custom | Pass. Tailwind utilities removed inside the existing `class:list`; Astro docs cited above via the Astro Docs MCP. No custom code. |
| V. Static by Default | Pass. Prerendered page, no JavaScript, no endpoint change. |
| VI. Content as Files | Pass. No content or schema change. |
| VII. Private Data | Pass. Not touched. |
| VIII. Cloudflare Best Practices | Pass. No Worker or configuration change. |
| IX. Cost Ceiling | Pass. No cost change. |
| X. Accessible, Fast and Private | Pass. Reading order, heading structure and colours unchanged; reflow at 320 px unchanged; CSS shrinks by nothing measurable. a11y scan stays green. |
| XI. Spec Kit Workflow | Pass. Spec Kit branch and directory; one feature; isolated worktree. `PostLayout.astro` is a shared file, but no sibling feature is known to edit it now. |

## Project Structure

### Documentation (this feature)

```text
specs/023-post-header-width/
├── spec.md
├── plan.md              # this file
├── checklists/
└── tasks.md             # /speckit-tasks output (not created here)
```

research.md, data-model.md, contracts/ and quickstart.md are not generated: there are no
unknowns, no data, no interfaces, and the validation steps are the tests listed above.

### Source Code (repository root)

```text
src/layouts/PostLayout.astro                      # remove `mx-auto max-w-3xl` from the title card
tests/e2e/blog-fixtures.spec.ts                   # new "title card width" describe block
tests/e2e/visual.spec.ts-snapshots/post-template-desktop-*-{darwin,linux}.png   # refreshed
```

**Structure Decision**: existing single Astro project; no new files.

## Complexity Tracking

No violations.
