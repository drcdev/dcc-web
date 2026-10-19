# Implementation Plan: Clickable project row visuals

**Branch**: `044-portfolio-row-visual-link` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/044-portfolio-row-visual-link/spec.md` (issue #187)

## Summary

On the projects index, wrap each row's visual in a second link to the same story, hidden from
assistive technology (`aria-hidden="true"`, `tabindex="-1"`). The image inside it gets
`alt=""`, and the visual's description moves to a screen-reader-only `<span>` placed right
before the link inside the same visual container, so a screen reader still hears it at the same
point in the row. A pointer-only hover lowers the image's opacity a little, with no change to
its box. Under reduced motion the change has no transition. Everything is markup plus CSS in
two existing files (`ProjectRow.astro`, `portfolio.css`). No script, no schema change, no new
route.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, as pinned in `package.json`), Tailwind CSS v4

**Primary Dependencies**: none new. Uses `astro:assets` `<Image>` (already used) and Tailwind's `sr-only` utility (already used in `ThemeToggle.astro`, `SiteHeader.astro`, `SiteFooter.astro`)

**Storage**: N/A

**Testing**: Vitest component tests with the Astro Container API (`tests/component/project/ProjectRow.test.ts`); Playwright E2E (existing `tests/e2e/projects.spec.ts`, `tests/e2e/projects-motion.spec.ts`); axe accessibility and visual projects unchanged

**Target Platform**: static pages on Cloudflare Workers static assets

**Project Type**: static web site (Astro)

**Performance Goals**: no change. No new JavaScript, no new requests, image loading attributes (`loading`, `decoding`, `widths`, `sizes`) unchanged

**Constraints**: row at rest pixel-identical (SC-004); no layout shift on hover (SC-005); one accessible link and one tab stop per row (SC-002); WCAG 2.2 AA

**Scale/Scope**: one component, one stylesheet section, one component test file, two added E2E cases in existing spec files

## Design

### Markup (`src/components/project/ProjectRow.astro`)

```astro
<div data-project-visual>
  <span class="sr-only">{visual.alt}</span>
  <a href={projectHref(slug)} aria-hidden="true" tabindex="-1" data-project-visual-link>
    <Image src={...} alt="" widths={[480, 800]} sizes="..." loading={...} decoding={...} />
  </a>
</div>
```

- The `href` comes from the same `projectHref(slug)` the title uses, so the two links cannot
  drift apart.
- `alt=""` is allowed by `<Image>`: the alt attribute is required but an empty string marks the
  image as one screen readers skip (Astro docs: [Images, "Alt Text"](https://docs.astro.build/en/guides/images/#alt-text);
  [Error reference, ImageMissingAlt](https://docs.astro.build/en/reference/errors/image-missing-alt/)).
  The description is not lost: it is the `sr-only` text beside the link (FR-003, clarification
  2026-10-19).
- The span sits before the link, inside `[data-project-visual]`, so reading order matches
  today's (text, then the visual's description).
- `<Image>` passes extra attributes through to the `<img>` and keeps inferring width and height,
  so the CLS protection is unchanged (Astro docs: [Images, "Astro components for images"](https://docs.astro.build/en/guides/images/#astro-components-for-images)).
- The `data-project-visual-link` hook is for CSS and tests, matching the component's
  data-attribute convention.
- The header comment's "The title is the row's only link" becomes "the title is the row's only
  link exposed to assistive technology; the visual repeats it as a hidden pointer target".

### Styles (`src/components/project/portfolio.css`, Index section)

The stylesheet is already imported by the component and is the place every index style lives;
the change follows that pattern rather than adding a scoped `<style>` (Astro docs:
[Styles and CSS](https://docs.astro.build/en/guides/styling/), external/imported stylesheets).

```css
[data-project-visual-link] {
  display: block;            /* no inline line box around the image: footprint unchanged */
}
@media (hover: hover) {
  [data-project-visual-link]:hover img {
    opacity: 0.85;
  }
}
@media (prefers-reduced-motion: no-preference) {
  [data-project-visual-link] img {
    transition: opacity 150ms ease-out;
  }
}
```

- Opacity only, no `transform: scale`: opacity cannot change layout, and it keeps the reduced
  motion rule simple (the change still happens, just without a transition, per FR-004).
- `(hover: hover)` keeps the effect off touch screens, where a tap would otherwise leave a stuck
  hover state on the way to the story.
- The browser's link pointer comes from the `<a href>`; no `cursor` rule is needed.
- Forced colours: no new borders or colours, so the existing forced-colours block needs no
  change. Opacity on a raster image is acceptable there.
- The image already has `display: block; width: 100%; height: auto` via
  `[data-project-visual] img`, which still matches inside the link.

## Test changes (written first, seen to fail)

Each behaviour has one primary layer (constitution, Development Workflow; `docs/testing.md`).

1. **Component** — `tests/component/project/ProjectRow.test.ts` (primary layer for the markup)
   - "has one link, named by the title, to the story" becomes "exposes one link to assistive
     technology and keyboard, named by the title": `focusable(html)` (existing helper in
     `tests/component/html.ts`, which already drops `tabindex="-1"`) has length 1 and is the
     title link; links without `aria-hidden="true"` have length 1.
   - New: "the visual is a hidden link to the same story": the second `<a>` has the same `href`
     as the title link, `aria-hidden="true"`, `tabindex="-1"`, and contains the `<img>`.
   - "shows the visual with its alt text" becomes "keeps the visual's description as
     screen-reader-only text": the `<img>` has `alt=""`, and a `span.sr-only` inside
     `[data-project-visual]`, outside the link, holds "Claude Desktop answering a question".
   - The retired-pill test's `byName(html, "a")` length-1 check becomes the same
     focusable/non-hidden count, still asserting the title href.
   - No helper file changes.
2. **E2E** — `tests/e2e/projects.spec.ts`, "the projects index" block (only a browser can show
   click navigation and hover geometry): one test that hovers the first row's visual, asserts
   the `[data-project-text]` and `[data-project-visual]` bounding boxes are unchanged and the
   image's computed opacity is below 1, then clicks the visual and lands on that row's story.
3. **E2E** — `tests/e2e/projects-motion.spec.ts`, existing "with reduced motion" block: one
   test that the visual image's computed `transition-duration` is `0s` on `/projects/`.
4. **Unchanged, still guarding**: `tests/e2e/projects-no-js.spec.ts` (`row.getByRole("link")`
   count 1 per row; Playwright role queries skip `aria-hidden` subtrees, so this keeps holding
   and covers SC-002 with JavaScript off), the axe template checks (SC-003; an
   `aria-hidden` link with `tabindex="-1"` satisfies `aria-hidden-focus`), and the projects
   index visual shots (SC-004).

**Visual baselines**: not expected to change. At rest the image box, position and opacity are
the same (`display: block` on the link reproduces today's block image), and the visual project
does not hover. If a baseline diff appears, it means the resting state moved and is a bug to
fix, not a baseline to refresh.

## Constitution Check

*Gate before design, re-checked after design: PASS, no exceptions.*

| Principle | How this plan meets it |
|---|---|
| I. Test-First | Component tests rewritten and two E2E cases added before the markup and CSS change; each test names its layer above. |
| II. Automated Release Gate | No check is skipped or loosened. The link-count assertion changes what it counts, not what it protects (one link exposed to assistive technology). |
| III. Human Review | Normal PR from `drc-agents`, Don approves, auto-merge armed. |
| IV. First-Party Before Custom | Astro `<Image>` with `alt=""` and an imported stylesheet, both cited from the Astro Docs MCP above. Tailwind's own `sr-only` utility, already in use. No custom code beyond markup and CSS. Astro Docs MCP was available. |
| V. Static by Default | Prerendered page, a plain `<a>`, no client JavaScript; works with JavaScript off. |
| VI. Content as Files | No content or schema change; the visual's `alt` from the story frontmatter is reused as is. |
| VII. Private Data | Not touched. |
| VIII. Cloudflare Best Practices | No Worker, binding or config change. |
| IX. Cost Ceiling | No cost. |
| X. Accessible, Fast and Private | One accessible link and one tab stop per row, description kept, hover respects reduced motion and causes no layout shift, no new script or request. |
| XI. Spec Kit Workflow | Spec Kit branch and directory; files touched are not shared with a sibling feature. |
| Security Baseline | Headers, CSP and ruleset untouched; no inline style or script added. |

## /tweak scope confirmation

Triage condition 1 still holds:

- No dependency, integration or service change.
- No contact-data change.
- No design-system, site-wide layout, navigation or visual-identity change: one component on one
  page, resting appearance unchanged, no Tailwind theme edit.
- No cost increase.
- No CI, deploy or infrastructure config change.
- No constitution amendment.

Also confirmed: no content schema change, no new route, no new E2E spec file (cases go into
existing `projects.spec.ts` and `projects-motion.spec.ts`), no edits to shared test helpers
(`tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`, `tests/component/html.ts`,
`tests/fixtures/`, Playwright or Vitest configs), and no client JavaScript.

## Alternatives ruled out

- **Stretched-link overlay** (title link's `::after` covering the row, or the visual): one real
  link, but the whole row becomes a click target, text selection in the problem statement
  breaks, and the spec puts whole-row linking out of scope.
- **Second visible, focusable link on the image** with the alt as its name: doubles tab stops
  and link announcements (fails FR-002, SC-002).
- **`aria-hidden` link keeping the image's alt**: `aria-hidden` hides the alt too, so the
  description would be lost (fails FR-003). Settled in the spec's clarification.
- **Click handler on the image**: adds client JavaScript and fails without it (Principle V,
  FR-005).
- **`transform: scale` hover**: works without layout shift inside `overflow: hidden`, but needs a
  clipping wrapper and a reduced-motion override for the scale itself. Opacity is simpler.

## Project Structure

### Documentation (this feature)

```text
specs/044-portfolio-row-visual-link/
├── spec.md
├── plan.md              # this file
├── quickstart.md        # manual check on the preview
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output
```

research.md, data-model.md and contracts/ are not produced: there are no open questions, no
entities and no external interface.

### Source Code (files this change touches)

```text
src/components/project/
├── ProjectRow.astro     # hidden visual link, alt="", sr-only description
└── portfolio.css        # [data-project-visual-link] display and hover rules

tests/component/project/
└── ProjectRow.test.ts   # link counts, hidden link attributes, sr-only description

tests/e2e/
├── projects.spec.ts         # hover geometry + click opens story (added case)
└── projects-motion.spec.ts  # no transition under reduced motion (added case)
```

**Structure Decision**: existing single Astro project; the change stays in the project row
component, its stylesheet and their existing tests.

## Complexity Tracking

No constitution violations to justify.

## Risks

- A sibling worktree editing `portfolio.css` or `ProjectRow.astro` would conflict; none is known.
- If a project's visual description is long, the screen-reader-only span reads exactly what the
  alt read before, so behaviour for assistive technology is unchanged.
