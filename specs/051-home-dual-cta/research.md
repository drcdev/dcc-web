# Research: Second call to action in the home introduction card

No NEEDS CLARIFICATION items remained after the spec's clarification session. These notes record
the decisions the plan rests on.

## R1. Schema shape for the second call to action

- **Decision**: `secondaryCta: z.strictObject({ label: requiredText, href: linkTarget }).optional()`
  inside the `intro` strict object, sharing one `callToAction` constant with `cta`.
- **Rationale**: Astro content collections validate front matter with `astro/zod`; an invalid file
  fails the build with a named field (Principle VI). Reusing the existing `requiredText` and
  `linkTarget` validators keeps the protocol-relative guard (#95) and every other `cta` rule.
  Docs: [Content collections, "Defining the collection schema"](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema)
  (via the Astro Docs MCP).
- **Alternatives considered**: `ctas: [...]` array (rejected: changes the required `cta` field and
  every existing test, and allows more than two buttons); a `variant` field on one object
  (rejected: the spec fixes the field name `secondaryCta`).

## R2. Layout technique

- **Decision**: Plain Tailwind flex utilities. Social `<ul>` and the button group stack in a column
  at every width; the group is `flex-col` with stretched children below `sm` (640 px) and
  `sm:flex-row sm:w-auto` above. Equal heights come from `min-h-11` (44 px) on both and flex
  `align-items: stretch` in the row. The main button gets `border border-transparent` so its box
  matches the outlined one.
- **Rationale**: Tailwind 4 through the Vite plugin is the site's styling layer
  ([Styles and CSS, "Tailwind"](https://docs.astro.build/en/guides/styling/#tailwind)). `sm` is the
  breakpoint where the card already switches to photo-beside-text. No CSS grid or container query
  is needed for two items.
- **Alternatives considered**: a shared `Button.astro` component (rejected: two links in one
  component do not earn an abstraction; the site has no button component today); container
  queries (rejected: the spec defines behaviour by viewport width).

## R3. Colours and contrast

Theme colours are `hsl(from BASE h s L%)`: dusk BASE `#1c1a29`, rust and accent `#d68844`, mist
`#e2e3e6`. Card background is white (light) and dusk-800 (dark). Ratios computed with the WCAG
relative-luminance formula:

| Pair | Light | Dark |
|---|---|---|
| Main text on fill, at rest | white on rust-600: 4.77 | dusk-900 on rust-300: 9.33 |
| Main text on fill, hover | white on rust-700: 7.36 | dusk-900 on rust-200: 11.82 |
| Second text on card, at rest | dusk-800 on white: 14.29 | mist-200 on dusk-800: 11.30 |
| Second text on tint, hover | dusk-800 on mist-200: 11.30 | mist-200 on dusk-700: 8.26 |
| Second outline vs card | dusk-500 vs white: 5.41 | dusk-400 vs dusk-800: 4.00 |

- **Decision**: Second button `border-dusk-500 text-dusk-800 hover:bg-mist-200` / `dark:border-dusk-400
  dark:text-mist-200 dark:hover:bg-dusk-700`. Main button keeps its current colours and hover.
- **Rationale**: FR-009 requires 3:1 for the outline. The issue's suggested `border-dusk-300` (2.46:1)
  and `dark:border-dusk-600` (1.91:1) fail; dusk-500 and dusk-400 are the nearest passing steps
  that still read as quieter than the filled button. All colours are existing theme tokens (FR-012).
  Hover tints are the ones fixed in Clarifications.
- **Alternatives considered**: rust-coloured outline (rejected: competes with the main button);
  dusk-600 border in light mode (passes at 7.48 but looks heavier than needed).

## R4. Testing approach

- **Decision**: Extend existing tests only: schema unit test, HomeIntro component test (Container
  API), and the "home introduction card" block in `tests/e2e/pages.spec.ts`; regenerate the 8
  `home-now-start-here-*` visual baselines. Existing a11y, geometry, no-JS and budget sweeps
  already cover the home template.
- **Rationale**: One primary layer per behaviour (constitution, Development Workflow). Axe checks
  text contrast but not borders or hover states, so those two checks are explicit e2e
  assertions. Component tests use [`renderToString`](https://docs.astro.build/en/reference/container-reference/#rendertostring).
- **Alternatives considered**: a new `home-cta.spec.ts` (rejected: the caller and `docs/testing.md`
  prefer extending the existing home-card block).

## R5. Cost

- **Decision / finding**: $0 a month. No service, binding, dependency or request path is added.
