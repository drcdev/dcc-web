# Research: Wayfinder self-assessment

**Feature**: `037-wayfinder-self-assessment` | **Date**: 2026-10-11 | **Plan**: [plan.md](./plan.md)

The Astro Docs MCP server (`astro-docs`) was available and was used for every Astro decision
below; each one names the page it relied on. No Cloudflare product is added: the feature has no
server code. There was no NEEDS CLARIFICATION left in the Technical Context; the items below
record the design choices that the spec left to the plan.

## R1. Where the single source lives: a `assessments` data collection

- **Decision**: A new build-time content collection `assessments`, loaded with the `glob()`
  loader from `src/content/assessments/*.yaml`, one assessment per file. The Wayfinder file is
  `src/content/assessments/wayfinder.yaml` (entry id `wayfinder`). The schema is a strict Zod
  object (exactly five shifts, exactly three statements per shift, an integration week), so a
  missing or misspelled field fails the build with Astro's own "does not match schema" error
  naming the file (FR-004).
- **Rationale**: Content collections with schemas are Astro's first-party answer to "validated
  content Don edits without touching code", and YAML is the friendliest data format for prose
  strings. One file per assessment keeps the id equal to the file name, like posts and projects.
  Docs: "Content collections" (docs.astro.build/en/guides/content-collections/#the-glob-loader,
  #defining-the-collection-schema) and "Astro Content Loader API" (`glob()` supports YAML,
  docs.astro.build/en/reference/content-loader-reference/#glob-loader).
- **Alternatives considered**: `file()` loader with one YAML file holding every assessment
  (rejected: one assessment exists, and an entry per file matches the site's other collections);
  frontmatter on the post (rejected: the post schema is shared by every post, and 15 statements
  plus 6 weeks of text would swamp it); a TypeScript module in `src/config/` (rejected: not
  "content as files", and no schema error naming the content file); JSON (rejected: worse for
  multi-line prose).

## R2. Rendering the post's text from the data: MDX components passed through `components`

- **Decision**: Three Astro components in `src/components/assessment/`:
  `PracticalApplication` (`assessment`, `shift` props), `DevelopmentPlan` (`assessment`) and
  `SelfAssessment` (`assessment`). Each reads its entry with `getEntry("assessments", id)`; an
  optional `data` prop replaces the lookup for component tests (the `RecentWriting` pattern).
  They are passed to the post body through the post route's existing
  `<Content components={...} />`, so the MDX file needs no import.
  `validatePageBody(..., "post")` accepts these three names in posts only; pages keep the
  current section list.
- **Rationale**: Passing components to MDX content is the documented way to render shared
  components from content files without imports, and it is how the route already supplies
  `Figure` and friends (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content).
  Reading the collection inside the component keeps the post body to one short tag per place.
  Docs: `getEntry()` (docs.astro.build/en/reference/modules/astro-content/#getentry).
- **Alternatives considered**: Adding the three to the page `sectionNames` registry (rejected:
  pages have no use for them, and the docs-structure test would demand page documentation);
  a remark/rehype plugin that expands a directive (rejected: custom code where the MDX
  components prop already does the job); importing the YAML directly in MDX (rejected: skips
  the collection schema).

## R3. Client-side behaviour: a plain processed `<script>` that lazy-imports one module

- **Decision**: `SelfAssessment.astro` carries a small processed `<script>` (bundled, hashed
  into the CSP by Astro). It does two things only: if the address fragment starts with
  `result=`, it imports the assessment module at once (the earlier result is shown at once,
  FR-012); otherwise it watches the assessment with an `IntersectionObserver`
  (`rootMargin` of one viewport height) and imports the module when the reader gets near it.
  The module (`src/lib/assessment/client.ts`, plus the pure modules it imports) is a separate
  Vite chunk served from `/_astro/`, which `script-src 'self'` already allows. No framework.
- **Rationale**: Astro renders a component's `<script>` only where the component is rendered
  (scripts are rendered directly as declared since v5,
  docs.astro.build/en/guides/upgrade-to/v5/#script-tags-are-rendered-directly-as-declared), so
  other pages ship nothing (FR-017, SC-005). A plain script needs no UI framework
  (docs.astro.build/en/guides/client-side-scripts/), and data reaches it through `data-*`
  attributes (#pass-frontmatter-variables-to-scripts), as the questions panel already does.
- **First-party option considered**: `client:visible={{ rootMargin }}` on a framework island
  (docs.astro.build/en/reference/directives-reference/#client-directives) is Astro's own
  "load when near" feature. It falls short here for three reasons: hydration directives are not
  supported on components passed via the MDX `components` prop (same page); it needs a UI
  framework integration and its runtime, a new dependency that would eat most of the 10 KB
  per-page JavaScript budget; and the page must also load at once when the fragment holds a
  result, which the directive cannot express. The custom part is one `IntersectionObserver`
  and one `import()`, both platform APIs.

## R4. Results link format

- **Decision**: `#result=<version>.<yyyymmdd>.<s1>-<s2>-<s3>-<s4>-<s5>`, where `version` is the
  8-hex-character statement set version (R5), the date is the local date the result was made,
  and each `sN` is the **sum** of that shift's three answers (3–15) in the data file's shift
  order. Example: `#result=3fa9c2d0.20261011.7-12-15-9-3`. The score shown is `sum / 3`.
  The page writes it with `history.replaceState` (no history entry, no `hashchange`, no
  scroll) and removes it with `replaceState` to `pathname + search` on clear.
  Full grammar and parse rules: [contracts/results-link.md](./contracts/results-link.md).
- **Rationale**: Sums are exact integers, so a reloaded result reproduces the same one-decimal
  scores and the same low-band and plan order (a stored rounded mean would not). Every
  character is legal in a fragment without escaping, so the link survives copy and paste and
  email clients. The fragment is never sent in an HTTP request (FR-012, SC-004). Nothing goes
  to browser storage.
- **Alternatives considered**: Query string (rejected: sent to the server and logged at the
  edge, breaking FR-016); base64 JSON (rejected: longer and opaque to Don when debugging);
  storing one-decimal means (rejected: lossy); `localStorage` (rejected by the spec).

## R5. Statement set version

- **Decision**: Computed at build time, not written by hand: the first 8 hex characters of
  SHA-256 over the JSON of the shift ids and the fifteen statement texts, in order
  (`src/lib/assessment/version.ts`, using `node:crypto` on the server only). The component
  passes it to the client in a data attribute.
- **Rationale**: Any wording change gives a new version automatically, so Don cannot forget to
  bump it and an earlier result is never wrongly compared (FR-014). Edits to reminders, week
  activities, shift names or From/To wording do not change it, because they do not change what
  the reader answered.
- **Alternatives considered**: A hand-written `version: 1` in the YAML (rejected: relies on
  memory, and a missed bump silently compares different questions). Accepted cost: fixing a
  typo in a statement makes older links show "made with an earlier set of questions".

## R6. Low-band links without losing the results fragment

- **Decision**: Each low-band link is a real `<a href="#<heading id>">` (so it can be opened
  or copied), but the module handles the click: it calls `scrollIntoView` on the heading,
  moves focus to it (`tabindex="-1"`) and does not change the fragment. The same handling
  applies to the "Your earlier result is below" link. The site header is not sticky on post
  pages, so a heading scrolled to the top of the window is not covered; the E2E check asserts
  the heading is in the viewport and not overlapped by the header element (Story 2,
  scenario 2), so a future sticky header would fail it rather than hide the heading. The heading ids are taken from the shift's `anchor` in the data file and
  checked at build against the post's rendered headings (`render(entry).headings`); a missing
  anchor fails the build naming the post file and the shift.
- **Rationale**: Following a plain in-page link would replace `#result=...` in the address bar,
  so a reload would lose the newest result, which FR-012 forbids.
- **Alternatives considered**: Encoding both the result and the section in the fragment
  (rejected: fragile, and the browser would not scroll to it natively anyway).

## R7. Printing only the plan

- **Decision**: When a result is shown, the module builds the plan sheet and appends it as a
  direct child of `<body>` (`<section data-assessment-plan-sheet hidden>`), and sets
  `data-assessment-plan` on `<html>`. A `<style is:global>` block in `SelfAssessment.astro`
  holds the print rules: under `@media print`, `html[data-assessment-plan] body > :not([data-assessment-plan-sheet])`
  is `display: none` and the sheet is shown in black on white. Without that root attribute,
  print shows the post with the assessment's statement list instead of the form. "Print my
  plan" calls `window.print()`; the browser's own Print menu uses the same CSS (FR-011).
  Clearing removes the sheet and the attribute.
- **Rationale**: `display: none` on everything else gives a plan that is the only content, so
  it fits on two pages. The `visibility: hidden` trick leaves the hidden post's height in the
  print layout and adds blank pages. A global style in this one component is scoped by the root
  attribute only this script sets, so no other page changes. Docs: `is:global`
  (docs.astro.build/en/reference/directives-reference/#isglobal). The CSP allows it:
  Astro bundles the style into a stylesheet under `'self'`.
- **Alternatives considered**: A separate print page (rejected: the result would have to be
  passed in a URL or storage, and printing from the menu would still print the post);
  `beforeprint` DOM swaps (rejected: unreliable across browsers and unnecessary with CSS).

## R8. Chart without inline styles

- **Decision**: The chart is an inline SVG built by the module with `createElementNS`. Each
  shift is one row: the shift name and its From/To wording in HTML (so long text wraps at
  320 px), and below it an SVG track (`viewBox="0 0 100 12"`) with the marker placed by the
  `cx` / `x` **attributes**. The new result is a filled circle, the earlier result a hollow
  diamond, with a text legend, so they differ by shape as well as colour (FR-013). Colours come
  from `currentColor` and Tailwind classes on the SVG, with `forced-colors` variants. The
  chart has `role="img"` and a short `aria-label` pointing to the text summary, which is the
  full accessible equivalent (FR-007).
- **Rationale**: The page CSP has no `'unsafe-inline'` for styles, so the module must not set
  `style` attributes (the questions panel follows the same rule). SVG geometry attributes are
  not styles. No chart library is added (spec Assumptions; Principle X).
- **Alternatives considered**: CSS custom properties per marker (rejected: needs inline
  `style`); a canvas (rejected: no DOM for tests or forced colours); a chart library (rejected:
  third-party script and budget).

## R9. Answer controls and the form

- **Decision**: The form is server-rendered: one `<form>` holding five groups (one per shift,
  each with an `h3` naming the shift), each with three `<fieldset>`s whose `<legend>` is the
  statement and whose five native radio buttons are labelled "Rarely", "Sometimes", "Often",
  "Usually", "Almost always" (values 1–5). The submit control is `<button type="button">`
  ("Show my results"), so the form can never be submitted as a GET request carrying answers,
  even before the module loads. The form is hidden until the root has the `js` class (the
  theme pre-paint script sets it), and the no-JavaScript note and statement list show in its
  place otherwise.
- **Rationale**: Native radios give keyboard and screen-reader support for free (Story 1,
  scenario 5); a fieldset and legend per statement is the WCAG technique for grouped radios.
  Labels on every point satisfy FR-003. A type="button" control is the guard for FR-016.
- **Five-point labels**: the spec fixes only the ends ("Rarely" to "Almost always"); the middle
  three are a plan choice and live in the data file (`scale`), so Don can edit them.

## R10. Announcing results and validation errors

- **Decision**: One polite live region (`role="status"`) in the component. Showing results
  sets it to "Your results are ready below." (or "Your results are updated."); the results
  container follows the button in DOM order. When statements are missing, no results are shown,
  an error summary lists the unanswered statements as links, each unanswered fieldset gets
  `aria-invalid` and an inline "Choose an answer" message, and focus moves to the first
  unanswered radio (FR-006).
- **Rationale**: WCAG 4.1.3 (status messages) and 3.3.1 (error identification); moving focus to
  the first error is the pattern Story 1, scenario 3 asks for.

## R11. Where tests run without naming real content

- **Decision**: Unit tests use inline neutral data. Component tests pass `data` props. The
  build-error rows use broken fixture posts and a fixture assessment in `tests/fixtures/`.
  The browser journeys (E2E, a11y, print, budget) run on the real build (port 4321) against
  the post found through `tests/helpers/content.ts`: a new helper returns every post whose body
  uses `<SelfAssessment`, and expectations are computed from that assessment's YAML. The
  Playwright fixture site is not changed.
- **Rationale**: `docs/testing.md` ("Real content in tests") forbids naming a real post but
  allows reading content through the helper. Adding a fixture post to the fixture site would
  change its fixed post counts (16) and risk the listing and post-template snapshots for no
  gain.
- **Alternatives considered**: A fixture post on the fixture site (rejected above); a fixture
  page (rejected: pages have no share area or post layout, which the print rules must hide).

## R12. Performance budget

- **Decision**: The bootstrap script is a few hundred bytes. The lazy module, including scoring,
  link, plan and chart code, targets at most 6 KB compressed, so the post stays under the
  10 KB JavaScript budget with the questions panel's script. `tests/e2e/budget.spec.ts` gains
  a case for each post using the assessment, measured at load, and a second measurement after
  scrolling to the assessment so the lazily loaded module counts too.
- **Rationale**: SC-005 and Principle X; the budget limits are not raised.

## R13. Keeping the questions API source complete

- **Finding**: `prepareQuestionSource()` strips tags from the MDX body, so once the Practical
  Application paragraphs and the 6-Week Development Plan move into components, the question
  source text for this post would no longer contain them. Today the whole post (about 20.6 KB of
  MDX) fits under `MAX_INPUT_CHARS` (24,000), so all of it reaches the questions.
- **Decision**: Keep the source complete (spec FR-021). A pure build-side helper,
  `src/lib/assessment/question-text.ts`, replaces each `<PracticalApplication ... />` with
  `**Practical Application**: <text>` and each `<DevelopmentPlan ... />` with the six
  `**Week N: <name>**` paragraphs, in place, and drops `<SelfAssessment ... />`. The post route
  and `question-source.json.ts` pass the expanded body to `prepareQuestionSource()` unchanged, so
  the source text matches the pre-move text apart from the new assessment heading line, and the
  hash covers the YAML text too. `prepareQuestionSource()` and the Worker are untouched.
- **Rationale**: Cheap (one pure function, two call sites), and it avoids a silent regression in
  an existing feature. The data file is committed site content, so the source is still only the
  site's own post (Principle V's questions API rule, Principle VI).
- **Cost**: The hash changes once, so the cached set for this post regenerates once on its next
  request, one generation from the existing bucket; no recurring cost.
- **Alternatives considered**: Accepting the loss as follow-up work (rejected: the fix is cheap
  and the plan activities are exactly what a reader might be quizzed on); expanding every MDX
  component generically (rejected: no other component carries prose the questions need).

## R14. Web Analytics and the fragment

- **Finding**: Cloudflare Web Analytics' beacon is injected at the edge on production only (not
  on previews or in CI). Its SPA mode hooks `history.pushState` only and does not support hash
  routing (developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/); the site uses
  `replaceState`, which the beacon does not hook. The beacon source
  (`static.cloudflareinsights.com/beacon.min.js`, `versions.js` "2026.10.0", read on
  2026-10-11) passes the page address and the referrer through a sanitiser that sets
  `hash = ""` and `search = ""` (and clears any user name and password) before building the
  payload's `location` and `referrer` fields, so a page view of `.../#result=...` is recorded as
  `.../`. This is observed behaviour, not documented, and Cloudflare can change the script.
- **Decision**: The site itself sends no analytics event (FR-016). The beacon is covered by a
  concrete post-release check with a pass/fail rule and a fallback (spec FR-016b): Don inspects
  one production beacon request with a results link open; pass when no payload field holds `#`,
  `result=` or the fragment; on a fail, the same day he adds a Web Analytics rule excluding the
  Wayfinder post's path and files an issue. CI covers every request the site's own code and the
  browser make (SC-004: an E2E request recorder over a results-link journey).
- **Alternatives considered**: Running the real beacon in E2E (rejected: third-party script in
  CI, and the edge injection cannot be reproduced locally); stripping the fragment before the
  beacon runs and restoring it after (rejected: racy, and it fights FR-012's reload behaviour);
  moving the result out of the address (rejected: the clarify answer chose the address bar).
