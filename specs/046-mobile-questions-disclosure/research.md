# Research: Collapsible questions panel on small screens

Feature 046, issue #183. Every unknown from the plan's Technical Context is resolved here. The
Astro Docs MCP (`astro-docs`) was available and was used for R2 and R8.

## R1. Disclosure mechanism: native `<details>`/`<summary>` or a scripted button

**Decision**: A scripted disclosure button (APG "Disclosure" pattern): a native
`<button type="button" aria-expanded aria-controls>` inside the panel's `h2`, controlling a
content wrapper. The button's `aria-expanded` attribute is the only state; CSS derives the
content's visibility and the arrow's direction from it. The panel's existing processed script
gains one click handler that flips that attribute. This is the pattern the site header's menu
button already uses (`src/components/SiteHeader.astro`).

**Rationale**: `<details>` is the first-party HTML disclosure and was the first option
considered (Principle IV). It falls short on four requirements of this spec:

1. **The xl sidebar must always be open with no trigger (FR-006).** A `<details>` is either open
   or closed for every width. The prerendered markup can therefore only be right for one layout:
   closed (correct below xl) shows a closed panel at 1280 px until a script sets `open`, which is
   a layout shift at 1280 px (FR-010, SC-003 at 1280×800); open (correct at xl) shows the full
   panel on phones until a script closes it, the shift the issue is about. Forcing the content
   visible at xl with `::details-content` leaves a closed `<details>` whose content is painted but
   whose state (and, in some engines, accessibility exposure and find-in-page) still says
   closed, and the `summary` would still need hiding. A button whose state lives in an attribute
   lets CSS choose per width: content shown at xl whatever the attribute says, hidden below xl
   unless it says expanded, with no script on resize.
2. **The state must survive crossing 1280 px (FR-007).** With the button, the attribute is never
   touched by a resize, so the small-layout state is restored for free. With `<details>`, a
   script would have to force `open` at xl, remember the small-layout value and restore it, on a
   `matchMedia` listener: more code and more states than the button.
3. **The panel heading and landmark (FR-002, P07).** APG puts the disclosure button inside the
   heading (`h2 > button`). A `summary` cannot sit inside a heading, and a heading inside a
   `summary` loses its heading role in several screen reader and browser pairs (the summary's
   button role makes its children presentational), so the panel would drop out of heading
   navigation on phones.
4. **JavaScript off (FR-008).** The advantage of `<details>` is that it works without
   JavaScript, but this panel must not be shown at all without JavaScript (its content is
   useless without the script), so the advantage does not apply. The site's other `<details>`
   (the self-assessment, `SelfAssessment.astro`) is the right choice there precisely because that
   content must work with JavaScript off.

**CSP**: the handler only sets `aria-expanded` (an attribute). No `style` attribute, no inline
style and no new inline script: the code goes in the component's existing processed `<script>`,
which Astro bundles (R8) and the CSP already allows. State is never written with
`element.style` (the CSP blocks it, as feature 022 found).

**Alternatives considered**:
- `<details>`/`<summary>` with `::details-content` overrides at xl: rejected for the four
  reasons above.
- Popover API (`popover` + `popovertarget`): first-party and declarative, but a popover is a
  top-layer overlay, not in-flow content that pushes the body down; it is light-dismissed and
  does not fit "the card grows to show the content" (clarification 2).
- A `hidden` attribute on the content toggled by script: Tailwind v4's preflight hides
  `[hidden]` with `!important`, so `xl:block` could not override it and the xl sidebar would
  need script on resize. Rejected.
- A second `data-open` attribute on the aside next to `aria-expanded`: two copies of one state
  that could drift. Rejected for the single `aria-expanded` source.

## R2. Avoiding layout shift (FR-010, SC-003)

**Decision**: Render the closed state in the prerendered HTML: the button carries
`aria-expanded="false"` from the server and the content wrapper is hidden below xl by CSS
alone. The panel stays `hidden [.js_&]:block` (the `js` class is set by the pre-paint inline
script in `BaseLayout.astro` before the stylesheet applies), so with JavaScript on the closed
bar is painted at its final size on first paint, and the processed module that later attaches
the click handler changes nothing visible.

**Rationale**: Astro's processed scripts are deferred modules
(docs.astro.build/en/guides/client-side-scripts/#script-processing), so anything the script
did on load would happen after first paint and shift the page. Nothing in the closed state
depends on the module.

**Alternatives considered**: closing the panel from the module on load (shifts the page);
an extra inline pre-paint script (unneeded, and a new hashed inline script in the CSP).

## R3. Heading, landmark name and button name (FR-002, FR-003, spec Assumptions)

**Decision**:
- The `h2` holds two children: the disclosure button (displayed below xl only) and a plain
  `span` "Think while you read" (displayed from xl only). Below xl the heading's text is the
  button's; at xl it is the span's.
- The button's visible label is two lines: "Think while you read" and, smaller, "Optional AI
  critical thinking questions", followed by a decorative chevron `svg` with
  `aria-hidden="true"`. Its accessible name is its text content, so it contains the visible
  label (WCAG 2.5.3) and its state comes from `aria-expanded`, not from the arrow alone.
- The aside is named by `aria-label="Think while you read"`, from the same frontmatter constant
  as both visible copies, so the landmark name is exactly that string at every width.
  `aria-labelledby` pointing at the `h2` (022 P07) would make the name below xl include the
  second line; pointing at one of the two spans would rely on naming from a `display: none`
  element at one of the widths. `aria-label` avoids both.
- `aria-controls` names the content wrapper's `id`.

**Alternatives considered**: button outside the heading (loses heading navigation on phones);
heading text visually hidden at small widths (two names to keep in step); `aria-labelledby` to a
hidden span (relies on hidden-reference naming at one width).

## R4. Live region while closed (FR-009)

**Decision**: Keep the single status region (022 P08) inside the content wrapper. While the
panel is closed below xl the wrapper is `display: none`, so a status change made then (a request
that finishes after the reader closed the panel) is not announced; its text is in place and is
seen and read when the panel is reopened. No second live region is added.

**Rationale**: the reader chose to close the panel; announcing into a hidden area is not
reliable across browsers anyway, and a duplicate region is excluded by FR-009. Moving the status
outside the wrapper would show the message in the closed bar, which clarification 3 rules out.

**Focus consequence**: when "Get questions" succeeds, the script moves focus to "New
questions" (022 state table). If the panel was closed meanwhile, that button is not rendered and
`focus()` does nothing, so focus stays where the reader left it (normally the trigger). The
plan adds no special case; an E2E test proves focus is not lost.

## R5. Closed bar size and layout (FR-001, SC-002, clarification 5)

**Decision**: Below xl the aside's card padding moves to its parts: the aside keeps its border,
radius, background and `mt-6`, with no padding; the button is a full-width row (`w-full`,
`min-h-11`, text left, chevron right, `px-4 py-3`); the content wrapper carries the padding the
card has today, minus the top. From xl the aside keeps `p-6` and today's look.

**Arithmetic at 390 px, default text**: first line `text-lg` (line height 1.75rem) + second
line `text-sm` (1.25rem) + `py-3` (1.5rem) + 2 px border ≈ 4.63rem ≤ 5rem. At 390 px the second
line fits on one line with `px-4` and the chevron; at 320 px it may wrap, which the spec allows
(the 5rem limit is measured at 390 px; the edge case asks that it wrap rather than overflow).
The E2E check measures the real box rather than trusting this sum.

## R6. Motion (clarification 7)

**Decision**: no transition on the content or the chevron. The chevron is rotated by a
class derived from `aria-expanded` (a static transform, not an animation). The existing
"runs no CSS transitions while loading" a11y check and 022 P22 already cover this.

## R7. Storage (FR-011)

**Decision**: none. The state lives only in the DOM attribute, so every load starts closed.
022's "sets no cookie and writes nothing to local or session storage" test keeps covering it.

## R8. First-party options per capability (Principle IV)

| Capability | First-party option | Used? |
|---|---|---|
| Disclosure behaviour | HTML `<details>`/`<summary>` | Not used; falls short on FR-006, FR-007, FR-002 (R1). A native `<button>` with ARIA disclosure attributes is used instead, also standard HTML. |
| Interactivity | Astro processed `<script>` in the component (docs.astro.build/en/guides/client-side-scripts/, "Scripts and event handling" and "Script processing") | Used: the existing panel script gains one handler. No UI framework island. |
| Passing state to the script | `data-*` attributes (docs.astro.build/en/guides/client-side-scripts/#pass-frontmatter-variables-to-scripts) | Already used by the panel; unchanged. |
| Per-width layout | Tailwind CSS (the site's design system) `xl:` and `max-xl:` variants, the site's `js` custom variant | Used. No custom stylesheet rule is needed beyond Tailwind classes. |
| Component tests | Astro Container API (docs.astro.build/en/reference/container-reference/, docs.astro.build/en/guides/testing/#vitest-and-container-api) | Used, as in `QuestionsPanel.test.ts`. |
| Hosting | Cloudflare Workers static assets | Unchanged; no Worker, binding or route change. |
| Fly.io | Not used by this site | N/A. |

No dependency is added.

## R9. Visual baselines

`post-template` element shots of the fixture post `/writing/every-part/` change:

| Image | Platforms | Why |
|---|---|---|
| `post-template-phone-light-visual` | darwin, linux | closed bar replaces the full panel (390 px) |
| `post-template-phone-dark-visual` | darwin, linux | same |
| `post-template-desktop-light-visual` | darwin, linux | heading now "Think while you read" (1280 px) |
| `post-template-desktop-dark-visual` | darwin, linux | same |

Eight images in all; any other visual diff is a regression. Refresh per
`.claude/skills/_shared/visual-baselines.md` (macOS `test:visual:update`, Linux
`test:visual:update:linux` in Docker).

## R10. Parallel work

Sibling worktrees `045-post-footer-consolidation`, `049-post-card-full-click` and
`050-page-container-harmony` may also change `PostLayout.astro` or the `post-template`
baselines. This feature edits `QuestionsPanel.astro` and its tests; `PostLayout.astro` changes
only in its comment, if at all. Whichever branch merges second merges `origin/main`, keeps both
sides of any code conflict, and regenerates the `post-template` baselines on both platforms
rather than picking either side's images.
