# Research: page container harmony (050)

The Astro Docs MCP (`astro-docs`) was available and consulted. No item in Technical Context was
left as NEEDS CLARIFICATION; the decisions below record the choices made.

## R1. Where the card's markup lives

- **Decision**: A new Astro component `src/components/page/ContentCard.astro` that renders
  `<section id="content-section" class="…">` around a default `<slot />`. `PageLayout.astro` and
  `404.astro` both use it.
- **Rationale**: The bug is that two files carried two copies of one class string and drifted
  (they matched only by hand). One component is the first-party Astro way to share markup: Astro's
  own recipe "Style rendered Markdown with Tailwind Typography"
  (https://docs.astro.build/en/recipes/tailwind-rendered-markdown/) wraps `prose` classes in a
  `<Prose />` component with a `<slot />`, and "Components > Slots"
  (https://docs.astro.build/en/basics/astro-components/#slots) describes the slot pattern. No
  `class` pass-through prop is needed (Astro docs, "Styles and CSS > Passing a class to a child
  component", https://docs.astro.build/en/guides/styling/#passing-a-class-to-a-child-component),
  because both callers want the identical card.
- **Alternatives considered**:
  - Edit the class string in both files: smallest diff, but keeps the duplication that caused the
    asymmetry; parity would rest on a test alone.
  - A Tailwind `@utility content-card` or `@apply` rule in `global.css`: works, but Tailwind and
    Astro both favour component extraction over `@apply` for markup reuse, and it would split the
    card between CSS and markup. Rejected.
  - Make `404.astro` render `PageLayout`: would add the title section and change the not-found
    page's structure and its component tests; out of scope.

## R2. The class list

- **Decision**:
  `prose lg:prose-lg dark:prose-invert prose-accent mx-auto mb-8 max-w-screen-lg rounded-2xl
  border border-dusk-200/80 bg-white p-4 shadow-xs sm:p-6 md:p-8 dark:border-dusk-700/80
  dark:bg-dusk-800`
- **Rationale**: Taken from issue #181 and the spec. `rounded-2xl` is today's 1rem dark radius
  (FR-001). `border` (1 px) in both themes (FR-001/FR-002). `p-4 sm:p-6 md:p-8` is 1rem / 1.5rem /
  2rem at the site's default `sm` (40rem = 640 px) and `md` (48rem = 768 px) breakpoints (FR-003;
  the theme does not override `--breakpoint-*`). Only colour utilities have `dark:` variants, so
  radius, border width, padding and max width are identical in both themes by construction
  (FR-005). The issue's `dark:p-6` is dropped: it would override `md:p-8` in dark mode and break
  FR-003 (the spec's Assumptions already choose the responsive scale for both themes).
  Tailwind's preflight sets `box-sizing: border-box`, so the 1 px border sits inside the 64rem
  cap and the card's outer box does not move (FR-004).
- **Alternatives considered**: `dark:border-transparent` with a border only in light: rejected,
  FR-002 asks for a visible dark edge.

## R3. Which shadow

- **Decision**: `shadow-xs` (Tailwind 4: `0 1px 2px 0 rgb(0 0 0 / 0.05)`), in both themes.
- **Rationale**: It is the value issue #181 names. The spec says "the theme's smallest shadow";
  Tailwind 4 also ships `shadow-2xs` (`0 1px rgb(0 0 0 / 0.05)`), which has no blur and reads as a
  hard 1 px line under the border rather than a soft lift. `shadow-xs` is the smallest *blurred*
  shadow and matches the issue's explicit class, so it is chosen; the theme defines no custom
  shadows. Applied in both themes (no `dark:shadow-none`): it costs nothing, has no layout effect,
  and keeps the class list theme-symmetric; on the dusk page it is near invisible, which the spec
  accepts.
- **Alternatives considered**: `shadow-sm` (used by the post title card and author card): stronger
  than "subtle"; rejected to follow the issue. `shadow-2xs`: see above. If Don prefers the literal
  smallest, the change is one class and the four refreshed baselines.

## R4. Wide and full-width images inside a padded card

- **Decision**: No CSS change.
- **Rationale**: `.kg-width-wide` and `.kg-width-full` (`src/styles/global.css`) compute their
  margins from `50%` of the containing block and `50cqw` of the page container. Percent margins
  resolve against the card's content box, which stays centred because the padding is symmetric,
  so `calc(50% - 50cqw)` still lands on the page edge. Dark mode already proves this with 1.5rem
  padding. `sections.spec.ts` (fixture `/sections/`) keeps asserting wide > column and
  full = viewport (FR-009).

## R5. Colour tokens and contrast

- **Decision**: Light card `bg-white` on the white page; dark card `bg-dusk-800` on `dusk-BASE`
  (as today). Borders `dusk-200/80` and `dusk-700/80`. No new colour (FR-010).
- **Rationale**: Text and link colours already pass AA on white (light page) and on `dusk-800`
  (dark card); the backgrounds behind text do not change in either theme, so contrast is unchanged
  (FR-008). The border is decorative and is not a WCAG 1.4.11 component boundary (the card is not
  an interactive control), so its low contrast is acceptable; forced-colours mode draws it in
  `CanvasText`.

## R6. Test placement (one primary layer per behaviour)

| Behaviour | Layer | Where | Why this layer |
|---|---|---|---|
| Card box, padding and first-paragraph x/width identical in both themes at 390/640/768/1280 (SC-001, SC-002, FR-003–FR-005) | E2E (geometry) | new `tests/e2e/content-card.spec.ts`, `e2e` project, About + `/nope/` | Only a browser computes layout; measured by flipping the `dark` class in place (as `theme-tokens.spec.ts` does), so both themes are read from one load. |
| Padding values 16/24/32 px at the three widths (FR-003) | same spec, same loads | — | Read from computed `padding-*`; no extra load. |
| Light card has a visible edge: border width ≥ 1 px and non-`none` box-shadow (SC-003) | same spec | — | Same load. |
| Card background and border colour resolve to the right tokens per theme (FR-001, FR-002) | E2E (theme tokens) | `tests/e2e/theme-tokens.spec.ts` probe on fixture `/sections/` `#content-section` | That spec owns token-per-theme. Border tokens carry `/80`, so the probe helper learns an `alpha` form (`dusk-200/80` → `color-mix(in oklab, var(--color-dusk-200) 80%, transparent)`, Tailwind 4's own output), still with no colour literal. |
| Not-found page uses the same card as `PageLayout` (FR-006) | Component | `tests/component/NotFound.test.ts` | Cheapest: render both and compare the `#content-section` class lists; content-independent. |
| No horizontal scroll at 320 px (SC-004) | Already covered | `tests/e2e/geometry.spec.ts` (every template incl. about and not-found at 320 px) | Not duplicated (Development Workflow). |
| Zero axe violations every template, both themes (SC-005, FR-008) | Already covered | `tests/e2e/a11y.spec.ts` and siblings | Unchanged; must stay green. |
| Pixel look of the card (FR-011) | Visual | `tests/e2e/visual.spec.ts` | Refresh only the predicted baselines (R7). |
| Wide/full image break-out (FR-009) | Already covered | `tests/e2e/sections.spec.ts` | Unchanged; must stay green. |

Each new test is written and seen to fail before the component change (Principle I).

## R7. Predicted visual baseline changes

A visual diff nobody predicted is a regression (`.claude/skills/_shared/visual-baselines.md`).
Predicted to change, each at phone and desktop, light and dark, on darwin and linux:

- `not-found-*` (full page; card in light, padding change in dark)
- `sections-*` (fixture `/sections/` is a `PageLayout` page; full page)
- `home-now-start-here-*` (fixture home; full page)
- `contact-form-*` (element shot of `[data-contact]`; its width follows the card's content width)

That is 32 images per platform, 64 in all. Predicted **unchanged**: `header-*`, `footer-*`,
`menu-open-*`, `post-template-*`, `story-template-*`, `lead-story-*`, `listing-cards-*`,
`series-*`, `project-row-*`, `retired-story-header-*` (other layouts or shell only). If any of
these changes, stop and investigate.
