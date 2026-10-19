# Research: Two-column editorial layout for the contact page

**Feature**: `052-contact-editorial-layout` | **Date**: 2026-10-19

The Astro Docs MCP server (`astro-docs`) was available and was used for every Astro decision
below. Astro is 7.3.5 (`node_modules/astro/package.json`). No item in the Technical Context was
left as NEEDS CLARIFICATION; the decisions below settle how each requirement is built.

## R1. How the note gets from the content file into the left column

- **Decision**: `<ContactForm>` takes two slots from `src/content/pages/contact.mdx`. A child
  `<div slot="note">…</div>` holds the note's Markdown and goes to a named slot, `note`. Every
  other child (the existing privacy paragraph) goes to the default slot. The component lays out
  the columns. It renders the note slot in the left column under its own `h2`, and the default
  slot in the form column, between the "Send a message" heading and the fields.
- **Rationale**: FR-009 keeps the note text in the content file, and FR-008 moves the privacy
  paragraph into the form column, under a heading the component owns. Only the component can
  place content inside its own `<form>`, so both pieces have to be slots. Named slots are Astro's
  own feature: "use the `slot` attribute on any child element to specify the name of the slot",
  and `Astro.slots.has()` lets a component "only render the wrapper elements when the slot is
  being used" (docs.astro.build/en/basics/astro-components/#named-slots,
  docs.astro.build/en/reference/astro-syntax/#astroslots). The page route already passes the
  section components to `<Content components={…} />` (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content).
  MDX children reach the component through Astro's JSX renderer, which moves any child with a
  `slot` prop into that named slot (`astro/dist/runtime/server/jsx.js`, the `"slot" in child.props`
  branch). The note must be "an immediate child of the component", which it is.
- **Why a `div` and not `<Fragment slot="note">`**: `validatePageBody` (`src/lib/content/body.ts`)
  rejects any capitalised tag that is not a registered section, so `<Fragment>` would fail the
  build. A lowercase `div` passes and renders as one plain wrapper.
- **Alternatives considered**:
  - *A separate `<ContactNote>` section placed before `<ContactForm />`*. Rejected. The two
    siblings sit inside the page's `prose` section, and the grid would need a parent that neither
    owns (a `:has()` rule on `#content-section` or a third wrapper section). It also adds a
    registry entry, a schema and a contract row for no gain.
  - *Moving the privacy paragraph into the component as fixed copy*. Rejected. It takes page copy
    out of the content file (Principle VI), and `tests/unit/content/site-pages.test.ts`
    ("Contact note (FR-015)") pins the retention wording in `contact.mdx`. Keeping it in the file
    keeps that test valid with no edit.
  - *A front matter field for the note*. Rejected. Markdown inside YAML loses links and
    paragraphs, and the page collection schema would need a contact-only field.

## R2. Two columns at 1024 px and up

- **Decision**: Tailwind utilities on the component's existing wrapper. When the note slot is
  used, the `[data-contact]` wrapper gets `lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12`,
  the note column `lg:col-span-5`, and the form column `lg:col-span-7`. Below `lg` the columns are
  plain blocks in source order (note, then form), with a top margin on the form column.
- **Rationale**: Tailwind CSS is the design baseline (Technology Constraints), and `lg` is
  Tailwind 4's default `64rem` (1024 px). `src/styles/global.css` does not override the
  breakpoints, and the site already uses `lg:` (`CardGrid.astro`, `SiteFooter.astro`). A 12-column
  grid gives the spec's 5 to 7 split exactly. `items-start` top-aligns the columns (FR-001) and
  keeps the note column from stretching when the success panel replaces the form.
- **Width**: no new container. The wrapper keeps `mx-auto max-w-screen-lg`, and the page's
  `#content-section` keeps its own `max-w-screen-lg`, so 1920 px screens get the same content
  width as every other page (edge case "Very wide screens").
- **Alternatives considered**: a custom breakpoint or a CSS file with a media query. Rejected: the
  theme already has the breakpoint, and a hand-written media query duplicates it.

## R3. Reading and keyboard order

- **Decision**: DOM order is the visual order at every width: note `h2`, note text, quick links,
  then the form column (`h2` "Send a message", privacy paragraph, the existing notices, fields,
  Send). No `order-*`, `flex-row-reverse` or positive `tabindex` is used.
- **Rationale**: FR-003 and WCAG 2.4.3 / 1.3.2 hold when the source order matches the visual order.
  The grid places the columns by source order, so nothing has to be reordered.

## R4. The note heading

- **Decision**: The component renders `<h2 id="contact-note-heading">Before you write</h2>` at the
  top of the note column, with the same classes as "Send a message". The note column is a
  `<section aria-labelledby="contact-note-heading">`.
- **Rationale**: FR-001a fixes the exact text and the level, like "Send a message", which the
  component already owns. A heading in the component cannot drift to `###` or vanish in an edit.
  Tests may also name it. The `no-real-content-in-tests` guard treats a quoted page-body
  heading of two or more words as real copy, but it does not collect component strings.
- **Alternative**: `## Before you write` inside the slot Markdown. Rejected for the reasons above.
  It would also be the only heading in the page body that tests could not name.

## R5. Text styles inside the slots

- **Decision**: The slots get explicit Tailwind utilities, not `prose`. The note body uses the
  pattern of the home "open to" line (`Now.astro`): `[&_p]` spacing, `[&_a]:underline
  [&_a]:underline-offset-4 [&_a]:font-medium`, text `dusk-900`/`white`, and hover `rust-700`/
  `rust-400`. The privacy paragraph keeps the size and link style the form already uses (`text-sm`,
  the component's `link` classes).
- **Rationale**: The component's wrapper is `not-prose`, and the typography plugin's selectors
  exclude every descendant of a `not-prose` element, so a nested `prose` class has no effect.
  The existing e2e test "the page note links the privacy policy, underlined, in a new tab" needs
  the privacy link to stay underlined after the move. Reusing the colour pairs already measured
  for the form and the Now line meets FR-015 contrast in both themes. The axe scans confirm it.

## R6. Quick links (GitHub, LinkedIn, email)

- **Decision**: The component renders a `<ul data-contact-links>` under the note text. GitHub and
  LinkedIn come from `socialNavigation` (`src/config/navigation.ts`) with the existing
  `src/icons/github.svg` and `linkedin.svg`, each beside its visible label. They have no `target`,
  so they open in the same tab, like `SiteFooter.astro` and `HomeIntro.astro`. The email link is
  `mailto:` + a new `contactEmail` field in `src/config/site.ts`, with the address as its visible
  text. Each icon is imported as a component with `aria-hidden="true"` and `size-5`.
- **Rationale**: FR-007 requires the same list as the footer and home page. Importing
  `socialNavigation` keeps the three in step by construction. The icons come in through Astro's
  SVG components, the pattern the footer, header and theme toggle already use
  (docs.astro.build/en/guides/images/#svg-components).
- **Why a config field for the address**: the address appears today only as page copy in
  `privacy-policy.mdx` and `terms-of-use.mdx`, and as `CONTACT_DESTINATION` in the Worker. The
  Worker constant is the delivery destination (Principle VII). It is a separate fact from the
  address the site displays, so the page does not import it. A single `site.contactEmail` keeps
  the shown address out of component markup. A unit test checks that the privacy policy publishes
  the same address, so the two cannot drift (FR-007, "the address the privacy policy ... already
  publish").
- **Alternative**: the email link as Markdown in the note slot. Rejected. Markdown links cannot
  carry the icon, and the link would then be styled differently from GitHub and LinkedIn.

## R7. The envelope icon

- **Decision**: Add `src/icons/mail.svg`: `fill="currentColor"`, `aria-hidden="true"`, 24 × 24 like
  `github.svg`. Its paths are the envelope already drawn inside the form's Email field
  (`viewBox="0 0 20 16"`), so the page uses one envelope shape. The Email field's inline SVG is not
  touched (FR-011: field markup unchanged).
- **Rationale**: The spec clarification asks for a decorative envelope "in the same style as the
  GitHub and LinkedIn icons": filled, `currentColor`, the same size. Astro imports a local SVG
  as a component, so it needs no icon package (Principle IV).
- **Alternative**: an icon library (`astro-icon`, Heroicons). Rejected: a new dependency for one
  glyph, when Astro's SVG components already cover it.

## R8. Fixture page and visual coverage

- **Decision**: `tests/fixtures/pages/contact-form.mdx` gains a fixture note
  (`<div slot="note">`) and a fixture privacy paragraph, in ASCII, so the `contact-form-*` element
  shots show the new layout: two columns at 1280 px and stacked at 390 px. The "form without a
  note" case (spec edge case) is covered at the component layer: with no `note` slot the
  component renders no note column and no grid classes, and the form fills the wrapper as today.
- **Rationale**: Visual tests cover templates on fixture content (`docs/testing.md`, "Visual
  coverage"). The contact template now *is* the two-column layout, so the shot has to show it.
  A second fixture page, kept only for the no-note case, would add eight baselines for markup
  that a component test proves more cheaply.
- **Consequence**: `tests/unit/site/fixture-posts.test.ts` checks for `<ContactForm />` in the
  fixture source. It becomes `<ContactForm` (the element is no longer self-closing). The ASCII
  check stays, so the fixture note uses a plain hyphen rather than an em dash.

## R9. Client script and CSP

- **Decision**: No script change. The island script looks up elements by id
  (`contact-form`, `contact-success`, …), and none of those ids or their nesting inside
  `[data-contact]` changes. `allowTurnstile(Astro.csp)` stays in both the component and the page
  route (`/<ContactForm\b/` still matches `<ContactForm>`).
- **Rationale**: FR-012 to FR-014 and FR-016. The CSP route check uses `\b`, so the
  non-self-closing tag still triggers it. The e2e test "/contact/ allows the Turnstile host in its
  CSP and the home page does not" confirms this.

## R10. Test placement (docs/testing.md "Where a test goes")

| Behaviour | Primary layer | File | Second layer and reason |
|-----------|---------------|------|-------------------------|
| Note column markup: `h2` text and level, `aria-labelledby`, slot rendered, quick links from `socialNavigation` (same tab), `mailto:` link with the address as text, icons `aria-hidden`, grid classes `lg:grid-cols-12` / `lg:col-span-5` / `lg:col-span-7`, DOM order note → form | Component | `tests/component/sections/ContactForm.test.ts` | — |
| Privacy slot sits after the "Send a message" heading and before `#contact-js-required` and the first field | Component | same | — |
| No `note` slot → no note column, no grid classes, form markup unchanged (fixture case) | Component | same | — |
| Shown address equals the one the privacy policy publishes | Unit | `tests/unit/site/privacy-policy.test.ts` | — |
| `contact.mdx` puts the note in `slot="note"` and keeps the privacy link outside it | Unit | `tests/unit/content/site-pages.test.ts` | — |
| Columns side by side, top-aligned, form column wider at 1024 and 1280 px; stacked with the note above the form at 1023 and 375 px; no sideways scroll at 1023 px | E2E (only a browser computes layout) | `tests/e2e/contact.spec.ts` (project `e2e`, real `/contact/`, asserts by `data-*` hooks, no copy) | — |
| Tab order: the quick links come before Name | E2E | same | — |
| Valid send and the `?project=` line at phone width | E2E | same | Second width for SC-003: the stacked layout must not hide or cover a control. The existing journeys keep the default desktop viewport. |
| No sideways scroll at 320/390/1280 px, JS on and off | E2E (existing) | `geometry.spec.ts`, `no-js.spec.ts` via `TEMPLATES` | Unchanged; already include `/contact/` |
| Axe in both themes at both widths, idle and in the error/success states | A11y (existing) | `a11y.spec.ts` (`TEMPLATES` + "contact form states") | Unchanged |
| The layout as drawn | Visual | `visual.spec.ts` `contact-form` subject (fixture) | Baselines refreshed |
| Budget | Budget (existing) | `budget.spec.ts` | Unchanged; no script is added |

Copy rules for the note (FR-004 to FR-006, FR-010) are not restated in tests ("Invariants, not
mirrors"). They are `[PREVIEW-CHECK]` items for Don.
