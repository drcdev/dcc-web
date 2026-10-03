# Review report: visual-refocus-phase-2 (issue #40, phase 2)

Reviewed on `chore/visual-refocus-phase-2` at 40cfe98 (`git diff main...HEAD`, commits e9a90db
to 40cfe98 plus the plan commit b75bb01). Fresh-eyes review, read-only on code, tests and docs.

## Verdict

W1 to W6 are done as planned and nothing beyond them. No CRITICAL or HIGH finding. Two LOW
findings, neither blocking. The Principle III verdict "not major" holds against the real diff.

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| LOW | 2 |

## Findings

### LOW-1: the prose-link focus probe cannot see a missing focus ring in dark

`tests/e2e/theme-tokens.spec.ts:173-178` ("prose link focus ring"). In dark, the prose link
colour is `accent-400` (`.dark .prose-accent { --tw-prose-links: var(--color-accent-400) }`,
`src/styles/global.css:186-190`), and the focus ring is also `accent-400`
(`src/styles/global.css:282-285`). An unfocused element's `outline-color` computes to
`currentcolor`, so in dark the probe passes whether the focus ring applies or not. The light
half does distinguish them (`accent-600` link, `accent-500` ring), so a removed `:focus-visible`
rule still fails the test once per run. The CTA and build-link focus probes are distinct in both
themes. Optional hardening (a later change, or now by the orchestrator): also assert
`outline-style` is `solid` for every `focus: true` probe.

### LOW-2: `FIXTURE` duplicates `FIXTURE_SITE`

`tests/e2e/visual.spec.ts:115` defines `const FIXTURE = "http://localhost:4322"`, while
`tests/e2e/templates.ts:11` already exports `FIXTURE_SITE` with the same value and
`theme-tokens.spec.ts` imports it. Because the new call is a template literal
(`visual.spec.ts:199`), the plan's Acceptance 1 grep `open\(page, "` no longer lists it. The
criterion holds in substance (every new path is on port 4322), but importing `FIXTURE_SITE`
would keep one source for the port. Cosmetic.

## Checks

### Scope (Development Workflow)

- `git diff --name-only main...HEAD` lists only `tests/**`, `scripts/build-fixture-site.ts`,
  `docs/testing.md` and `.specify/chores/visual-refocus-phase-2/plan.md`. Nothing under `src/`,
  `.github/`, `.claude/`, `public/`; no `playwright.config.ts`, `package.json`,
  `wrangler.jsonc`, `CLAUDE.md` or constitution change.
- W1: `every-part.mdx` matches the plan text exactly; `fixture-cards` added as the last topic of
  `text-only.mdx` and `long-title.mdx`; `FIXTURE_POSTS` and the head comments updated; three new
  unit cases; `blog-fixtures.spec.ts` lead, Featured (plus the new `FOCUS_POCUS` zero-count),
  Recent writing and series comment as planned; comment-only edits in
  `blog-pagination.spec.ts` and `budget.spec.ts`.
- W2: `contact-form.mdx` as planned; `FIXTURE_PAGES` exported and copied in a loop with the
  `existsSync` guard and the images copy kept; three new unit cases.
- W3: `theme-tokens.spec.ts`, 6 tests in the `e2e` project, no config change.
- W4: eight subjects, existing loops and names untouched (36 existing baselines unchanged).
- W5: `git diff --name-status main...HEAD -- tests/e2e/visual.spec.ts-snapshots/` is 32 `A`
  lines, all `*-darwin.png`. No `*-linux.png`, no `test-results/` or `playwright-report/`
  output, no `.env*` file committed. Working tree clean.
- W6: `docs/testing.md` as planned (below).

### Tests re-run in this review (macOS, under the perl alarm)

| Run | Result |
|---|---|
| vitest `unit`: `tests/unit/site/fixture-posts.test.ts`, `tests/unit/content/sample-posts.test.ts`, `tests/unit/setup`, `tests/unit/ci`, `tests/unit/site/config-mdx.test.ts` | 63 files, 936 passed |
| `playwright test --project=visual` | 50 passed (18.6 s) |
| `playwright test --project=e2e tests/e2e/theme-tokens.spec.ts` | 6 passed |
| `playwright test --list` | 1429 tests in 28 files (plan: 1429 in 28) |
| `playwright test --project=e2e --list` | 625 tests in 19 files (plan: 625 in 19) |
| `pnpm run test:e2e:parallel` | 1354 passed, 2 skipped, exit 0 |

### Test layers

- The fixture-shape guards are unit tests that read files: cheapest layer, no build needed.
- `theme-tokens.spec.ts` is E2E: which token the cascade gives an element (Tailwind `dark:`
  variants, `.dark .prose-accent` against `dark:prose-invert`, component CSS) is only visible in
  computed style. The second-layer reason (axe checks ratios, not identity; snapshots do not
  name the token) is in the spec's head comment.
- The eight subjects are visual-layer shots; the second-layer reason is in the comment above the
  block (`visual.spec.ts:108-114`).

### Coverage mapping

The dropped assertion (home Recent writing's third card is text-only with no `img`) is
asserted at `tests/e2e/blog-fixtures.spec.ts:58-64` ("shows the text-only post as a card with no
image and no empty picture box": one `[data-text-only]` card, href `TEXT_ONLY`, zero `img`), and
the text-only card's pixels are in the new `listing-cards-*` baselines. Home count and order are
still asserted. The mapping is true.

### V5 assertions are real

- Expected values are computed in the page from `var(--color-<token>, rgb(1, 2, 3))` on a probe
  span, so a wrong colour fails `toHaveCSS`, and a misspelt or unemitted token fails by name.
- After the in-place `classList.toggle("dark")` every probe is re-checked against the other
  theme's token, and `expectFlipsAreReal` proves each differing token pair is two different
  colours, so a component that fails to flip fails. The CTA pair is pinned equal on purpose.
- The `html` class is asserted before each pass, and every probe's locator must match exactly
  one element.
- Probe list against the issue's components: header (rule, background, site name, theme switch),
  footer (background, rule, copyright), pills (compliant-data topic, free-form, series marker,
  featured mark, status pill), buttons (CTA, Copy code), code block (card, text), table (cell,
  header rule), callouts (prose blockquote, mapping documented), links (prose link, build link,
  invitation), focus rings (CTA, prose link, build link). All covered. See LOW-1 for the one
  focus probe that is only effective in light.
- The implement summary records the swapped-token, skipped-toggle and misspelt-token variants
  seen red.

### V3 subjects are on frozen fixture content only

| Subject | Locator | Why no real content can enter |
|---|---|---|
| `post-template` | `#main > article` on `/writing/every-part/` | Related posts render after `</article>` (`src/layouts/PostLayout.astro:51-79`); the views note comes from `src/config/blog.ts` |
| `story-template` | `article[data-story]` on `/projects/every-part/` | Article holds only the fixture story's header, parts and the `ProjectInvitation` component |
| `lead-story` | `[data-lead-story]` on `/writing/` | Lead href asserted `/writing/every-part/` (2099 date) before the shot |
| `listing-cards` | `ul[data-topic-grid]` on `/writing/topics/fixture-cards/` | Only fixture posts carry `fixture-cards`; 3 cards asserted |
| `series-banner` | `header[data-series-banner]` on `/writing/drift/` | Banner text is the series description in `src/config/topics.ts`, not a post |
| `project-row-minimal`, `project-row-every-setting` | `li[data-project="..."]` on `/projects/` | Fixture projects from `tests/fixtures/projects/`; a row has no siblings in its own box |
| `contact-form` | `[data-contact]` on `/contact-form/` | Fixture page; all text is `ContactForm.astro` copy |

W5's content-edit proof (real post `summary` and `tempo.mdx` `problem` edited, 50 of 50 passed,
reverted) confirms it.

### macOS baselines (viewed: the eight desktop-light PNGs, `listing-cards-phone-dark`, `story-template-phone-dark`)

All show the intended element and only fixture text; images painted; the post shot ends at the
Share area with no Related posts; the lead is "Every part of a post". The three W5 oddities:

- **(a) `story-template` cropped to the wrapper, body flush left, title indented: the template
  as designed.** `[data-story]` is `max-w-screen-xl` and spans the article, while
  `[data-story-header]` is `mx-auto max-w-screen-lg` (`src/components/project/portfolio.css:24-26,
  40-42`), so at 1280 the header is centred about 112 px in from the parts. The locator is the
  whole article, which is right. Not a finding.
- **(b) dark `listing-cards` "Fixture cards" pill with no visible background: a pre-existing
  design issue.** The neutral free-form pill is `dark:bg-dusk-800`
  (`src/components/post/topic-styles.ts:71`), the same token as the card
  (`src/components/post/PostCard.astro:38`, `dark:bg-dusk-800`) and the post title card, so its
  fill disappears on both. The light pill is `dusk-100` on white, so it shows. The snapshot and
  `theme-tokens.spec.ts` now pin this as current behaviour; changing it is a design change
  (follow-up), not part of this chore.
- **(c) dark-phone `story-template` comparison table cut off at the right: the template as
  designed.** `[data-options-table]` is `overflow-x-auto`
  (`src/components/project/portfolio.css:103-105`), a keyboard-reachable scroll region; at 358 px
  the "Fast" column sits in its scroll area and the element shot captures the region's visible
  viewport. Not a finding.

### `docs/testing.md`

- The Visual row names the new fixture subjects; the E2E row gains the theme-token clause.
- Every former gap clause in "Visual coverage" says where its snapshot lives; `home` says the
  intro card is review-only by decision.
- The closing paragraph is rewritten, and the theme-tokens paragraph is added.
- `### Visual refocus, #40 phase 2 (2026-10-03)` has the before figures and
  `pending (#40 phase 2 PR run)` after cells. Its "Visual PNGs 100" row is true only once W7
  commits the 32 `*-linux.png` (68 today).
- "Where a test goes" is not in the diff (byte-identical); the `tests/unit/setup` run above
  includes `pipeline-test-placement` and `pipeline-visual-baselines`, green.

### Alignment rule and V6

No pipeline `SKILL.md` and no CLAUDE.md change. The shared sentences still hold: the visual
project "snapshots only the shell (header, footer and open mobile menu), the not-found page and
the fixture site, never real content", and baselines change "only when the shell, a template or
the design system changes" (here new subjects are added; no existing baseline moved).

### Principle III

Not major, confirmed on the real diff: no dependency, no `src/` change (so no design-system,
layout, navigation or contact-data change), no `.github/`, `wrangler.jsonc`, `package.json` or
`playwright.config.ts` change, no constitution amendment, no cost. `scripts/build-fixture-site.ts`
is the test harness. The 64 new baselines pin current templates; they do not alter them.

### Plan-vs-issue deviation

The issue's V3 says "full page"; the plan takes element shots instead and justifies it at
plan lines 654-671 (Related posts and real draft rows on the same pages, shell duplication, the
footer's build-time year; `mask` and `stylePath` considered and rejected). Recorded below for the
PR body.

## Measurement

| What | Before (CI run 37141574364, `main` push of #41) | After |
|---|---|---|
| `e2e` job | 305 s | pending CI (this PR's first green run) |
| `test:e2e:parallel` step | 208 s | pending CI (this PR's first green run) |
| Visual tests | 18 | 50 |
| E2E tests (`--project=e2e --list`) | 619 in 18 files | 625 in 19 files |
| All Playwright tests (`--list`) | 1391 in 27 files | 1429 in 28 files |

Local proxy, after only: `pnpm run test:e2e:parallel` on this branch (macOS, 2026-10-03):
Playwright summary "1354 passed, 2 skipped (1.9m)", wrapper wall clock 117 s, exit 0. There is no
local before figure, so this is not a comparison with the CI before; it only shows the 38 new
tests run green and cheaply on macOS. The comparable after is the PR run's
`test:e2e:parallel` step.

## Follow-ups for the PR body

1. #40 phase 3: record the before and after `e2e` times on the issue.
2. Footer year: `SiteFooter.astro` renders the build year, so the `footer-*`, `not-found-*` and
   `sections-*` baselines fail on the first build in 2027 (fixed build year or a `mask`). The
   new element shots avoid the footer.
3. Shared Playwright theme helper for the six specs that set `color-theme` (refactor).
4. CTA button has no dark variant (`bg-rust-600 text-white` in both themes); V5 pins it as
   invariant. A dark variant would be a design change (Principle III).
5. Projects index draft mark and in-progress index row have no row snapshot.
6. New from this review: the neutral free-form topic pill is `dark:bg-dusk-800` on a
   `dark:bg-dusk-800` card and post title card, so its fill is invisible in dark (visible in
   `listing-cards-*-dark` and `post-template-*-dark`). A design change if Don wants it fixed.
7. Optional (LOW-1): add an `outline-style` check to the focus probes so the dark prose-link
   probe can see a missing ring.
8. PR body notes: element shots instead of the issue's "full page" wording for V3, with the plan's
   reasons; the `blog-fixtures.spec.ts` expectation changes and their coverage mapping; the
   "callouts" to blockquote mapping; the W5 note that the content-edit word goes before the full
   stop of `problem` (one-sentence schema).
