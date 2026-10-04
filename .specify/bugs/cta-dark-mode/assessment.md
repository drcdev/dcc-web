# Bug Assessment: Call-to-action button has no dark-mode style

- **Slug**: cta-dark-mode
- **Created**: 2026-10-03
- **Source**: GitHub issue #47 "Give the call-to-action a dark-mode style" (pasted text; no URL fetched)
- **Verdict**: valid
- **Severity**: low

## Report (verbatim or summarized)

> The call-to-action looks the same in light and dark mode, so it stands out from the dark page
> around it. It should get dark-mode colours from the theme like the other components, and the
> theme-token checks should cover it. Follow-up from #43.

PR #43 (issue #40 phase 3) listed as a follow-up: "The CTA button has no dark variant; a dark
variant would be a design change". The invariance was deliberate then; issue #47 now asks for
the design change.

## Symptom

The call-to-action button (`CallToAction` section, and the home introduction's button that made
the same colour choice) renders `rust-600` with white text in both themes. Every other
component has a `dark:` value, so in dark mode the saturated mid-tone button does not belong to
the dusk page around it. Expected: a dark-mode fill and text taken from existing theme tokens,
pinned by the theme-token E2E check.

## Reproduction

1. Build and serve the fixture site (port 4322, Playwright's second web server).
2. Open `/sections/` with `localStorage["color-theme"] = "dark"`.
3. The "Get in touch" button (from `tests/fixtures/pages/sections.mdx` line 48) computes
   `background-color` = `--color-rust-600` and `color` = white, exactly as in light mode.
4. Same on the real home page `/` in dark mode for the introduction card's button
   (`intro.cta`, links to `/services/`).

Confirmed by reading the code and the test that pins it: `tests/e2e/theme-tokens.spec.ts`
"CTA button" probe expects `["rust-600", "rust-600"]` and `["white", "white"]`, and passes today.

## Suspected Code Paths

- `src/components/sections/CallToAction.astro:21` — anchor classes
  `bg-rust-600 ... text-white ... hover:bg-rust-700`, no `dark:` classes. Header comment
  (lines 2–4) states "rust-600 with white text, both themes". Line 18 (message) already has
  `dark:text-mist-300`.
- `src/components/page/HomeIntro.astro:67` — the home introduction's call-to-action, same
  `bg-rust-600 text-white hover:bg-rust-700`, no `dark:` classes. `CallToAction.astro`'s comment
  names it as the source of the same colour swap.
- `tests/e2e/theme-tokens.spec.ts:25-28, 92-99` — head comment and probe pin the button as
  theme-invariant "by design today", so the per-component theme check cannot catch the gap.

## Root Cause Hypothesis

Confidence: high. When the CTA colours were set (the nearest passing shades for AA contrast,
issue #40 phases), only a light-theme pair was chosen and it was applied to both themes; no
`dark:` variant was added, and the theme-token spec was written to pin that invariance rather
than a dark token. This is a design gap, not a cascade bug: there is simply no dark rule.

## Proposed Remediation

**Preferred**: give both call-to-action buttons an inverted dark-mode fill from existing tokens,
following the repo's own precedent for a filled control in dark mode
(`src/components/project/portfolio.css:295`, the pressed filter button:
`bg-accent-700 text-white dark:bg-accent-300 dark:text-dusk-900`) and the established dark rust
shade (`Share.astro`: `dark:border-rust-300 dark:text-rust-300`):

- `dark:bg-rust-300 dark:text-dusk-900 dark:hover:bg-rust-200`, added alongside the existing
  light classes on `CallToAction.astro:21` and `HomeIntro.astro:67`.
- Update the `CallToAction.astro` header comment to describe both themes.
- The focus ring stays `accent-500` / `accent-400` (unchanged; the probe already checks it).

Contrast (computed from `global.css`: rust base `#d68844` ≈ hsl(28 64% 55%), dusk base
`#1c1a29` ≈ hsl(248 22% 13%)): rust-300 (L 70%) has relative luminance ≈ 0.49, dusk-900
(L 10%) ≈ 0.009, so text contrast ≈ 9.1:1 (AA needs 4.5:1). The hover fill rust-200 (L 80%)
is lighter still, so its contrast is higher. The button fill against the dusk page is ≈ 9:1 as a
non-text boundary. White text on rust-300 would be ≈ 2:1 and fails, which is why the text
flips to dusk-900.

**Alternatives**:
- `dark:bg-rust-400 dark:text-dusk-BASE dark:hover:bg-rust-300` (Flux's newsletter button:
  `bg-rust-400 text-white dark:text-dusk-BASE`). Contrast ≈ 6.9:1, passes, but closer to the
  saturated mid-tone the issue objects to and has no precedent in this repo's components.
- Muted tint, `dark:bg-rust-900 dark:text-rust-100` (topic-pill pattern). Fits the page best but
  makes the page's one primary action look like a tag; rejected for a call-to-action.
- Change only `CallToAction.astro` and leave the home intro button invariant. Smallest diff, but
  leaves the same symptom on the most-visited page and splits two buttons the code treats as one
  visual role.

**Files likely to change**:
- `src/components/sections/CallToAction.astro`
- `src/components/page/HomeIntro.astro`
- `tests/e2e/theme-tokens.spec.ts`
- `tests/e2e/visual.spec.ts-snapshots/sections-{phone,desktop}-dark-visual-{darwin,linux}.png`

**Tests to add or update** (primary layer: **E2E**, in `tests/e2e/theme-tokens.spec.ts`):
- Reproducing test: change the "CTA button" probe to
  `"background-color": ["rust-600", "rust-300"], color: ["white", "dusk-900"]`, remove the
  "Theme-invariant by design today" comment and the head-comment note (lines 25–28). It fails
  before the fix (dark computes rust-600 / white) and passes after. `expectFlipsAreReal` also
  confirms the two tokens differ.
- Add a probe for the home intro button on path `/` of the fixture site (selector
  `main section a[href="/services/"]`, the selector `pages.spec.ts` already uses, `first: true`)
  with the same token pairs. Fails before, passes after.
- Hover is not probed: the spec reads resting and focus states only, and adding a hover state is
  outside the minimal fix; `a11y` does not see hover either. Record as a known gap.
- Layer reasoning: which token an element computes in a theme comes out of Tailwind's `dark:`
  variant in the cascade, which only a browser shows (`docs/testing.md`, "Where a test goes").
  A component test sees class strings, not tokens, and would pin implementation, so **no second
  layer**. `a11y` (axe, both themes) and the visual `sections-*` dark baselines already cover the
  template and are updated, not added.

## Risks & Considerations

- **Major change (Constitution Principle III)**: changing a section template's and the home
  card's dark colours changes the design system / visual identity. Recommend treating the PR as
  major: auto-merge off, Don checks the preview in dark mode before approving.
- **Expected visual diff, stated up front**: the dark `sections-phone-dark` and
  `sections-desktop-dark` baselines (darwin and linux) will change, because the fixture
  `/sections/` page contains the CTA. Light `sections-*` baselines must NOT change. The header,
  footer, menu and not-found shots must not change (the home intro card is not snapshotted: it
  is review-only per `docs/testing.md`). The fix phase refreshes the macOS baselines; the
  orchestrator refreshes the Linux ones (Docker or the `visual-baselines` label). Any other
  diff is a regression.
- **Accessibility**: axe in `tests/e2e/a11y.spec.ts` runs both themes; with the chosen tokens
  contrast rises in dark mode, so no new failure is expected.
- `tests/e2e/pages.spec.ts:215` looks for `bg-rust` links inside `#content-section` (below the
  home card); the home intro button sits in the card, so adding `dark:` classes does not affect
  it.
- The CTA text is underlined; the underline takes `currentColor`, so it follows the dusk-900
  text in dark mode with no extra class.

## Open Questions

None blocking. Decisions taken in automated mode, for review:

- Scope includes the home intro button (`HomeIntro.astro:67`) as well as `CallToAction`: both are
  the site's call-to-action role and the code names one as copying the other.
- Dark tokens: `rust-300` fill, `dusk-900` text, `rust-200` hover (inverted filled-button
  precedent from `portfolio.css:295`).
