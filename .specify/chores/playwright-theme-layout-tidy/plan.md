# Chore plan: playwright-theme-layout-tidy (issue #49)

Branch: `chore/playwright-theme-layout-tidy`, at `main`'s code (commit fb9dd8e, after #54 merged).
Issue: https://github.com/drcdev/dcc-web/issues/49. The PR body says `Closes #49`.

## Goal

[#49](https://github.com/drcdev/dcc-web/issues/49) asks for three clean-ups in the browser
tests, left over from #41 and #43. First, one shared theme-switching helper replaces the copies
of the same `page.addInitScript` snippet that write `color-theme` to `localStorage`. There are
seven full copies, not six: the explore pass missed `blog-fixture.a11y.spec.ts`. A lighter
eighth sits in `not-found.spec.ts`. Second, the older per-template sideways-scroll checks that
repeat what the layout geometry test (`tests/e2e/geometry.spec.ts`) already asserts move into
it. The geometry test gains a 320 px width, and the repeated checks are removed. Third, the
focus-ring probe in `theme-tokens.spec.ts` learns to prove a real ring in dark mode, where the
prose link and its ring are both `accent-400`. No page, component, style or script of the site
changes. Only `tests/e2e/**` and `docs/testing.md` change.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **One theme helper.**
   - `grep -rnF '"color-theme"' tests/e2e` hits only `tests/e2e/color-theme.ts` and
     `theme.spec.ts`'s `KEY` constant (see W1).
   - `grep -rnF '(?!.*\bdark' tests/e2e` hits only `tests/e2e/color-theme.ts`.
2. **Sideways-scroll fold.**
   - `geometry.spec.ts` `WIDTHS` holds 320, 390 and 1280.
   - `a11y.spec.ts` no longer has "reflows without horizontal scroll at 320 CSS px wide". It
     keeps the 200% zoom and text-spacing tests.
   - `pages.spec.ts` runs "does not scroll sideways" only for paths not in `TEMPLATES`
     (today only `/privacy/tempo/`).
   - `projects.spec.ts` no longer has its "does not scroll sideways" loop.
3. **Dark-mode focus ring.** On both focus probes (`prose link focus ring` and
   `build link focus ring`), in both themes and after the class flip, `theme-tokens.spec.ts`
   asserts four things:
   - before focus, `outline-style` is `none`;
   - when focused, `outline-style` is `solid`, `outline-width` is `2px` and `outline-offset` is
     `2px`, so the ring is drawn by the site's rule;
   - the ring has the token colour (the existing assertion);
   - the ring keeps that colour while the element's own `color` is overridden in place.

   A scratch run with `a:focus-visible { outline-color: currentColor !important }` injected
   makes the dark run fail on the new check, while the old colour assertion alone passes. The
   implement summary records that.
4. **Test counts** (local `playwright test --list`):

   | Project | Before | After |
   |---|---|---|
   | `e2e` | 615 | 609 (geometry +18; `pages.spec.ts` -21; `projects.spec.ts` -3) |
   | `a11y` | 626 | 608 (-18) |
   | `visual` | 50 | 50 |
   | `sections` | 55 | 55 |
   | `budget` | 73 | 73 |
   | All | 1419 in 28 files | 1395 in 28 files |

   `geometry.spec.ts` goes from 36 to 54 tests, and `theme-tokens.spec.ts` stays at 6.
5. **No visual change.** `git diff --name-only main -- tests/e2e/visual.spec.ts-snapshots/`
   is empty, and `--project=visual` passes on the new helper.
6. **Green.**
   - The `e2e`, `a11y`, `visual` and `sections` projects pass.
   - `verify:quick` passes, including `tests/unit/site/config-files.test.ts` (FR-030a: every
     `*.spec.ts` in exactly one project; the helper is not a spec).
   - `tests/unit/site/design-tokens.test.ts` is unchanged and passes.
7. **Scope of the diff.** `git diff --name-only main` lists only `tests/e2e/**`,
   `docs/testing.md` and `.specify/chores/playwright-theme-layout-tidy/**`. Nothing under
   `src/`, `.github/`, `.claude/` or `public/` changes, and neither do `playwright.config.ts`,
   `package.json` or `CLAUDE.md`.

**Before measurement** (CI run 37161130853, the `main` push of fb9dd8e (#54), full tier,
success; local counts from `playwright test --list` on fb9dd8e):

| What | Before |
|---|---|
| `e2e` job | 445 s (23:14:51Z to 23:22:16Z) |
| `test:e2e:parallel` step ("Run the end-to-end, accessibility, visual and sections projects") | 318 s (23:15:44Z to 23:21:02Z) |
| Budget step | 71 s |
| Playwright tests, local `--list` | 1419 in 28 files (e2e 615, a11y 626, visual 50, sections 55, budget 73) |

Net change: 42 single-page tests removed and 18 added, so about 24 fewer page loads. At 4
workers that is a few seconds, which is noise on one run. The step time is recorded, not
targeted.

## Scope

**In:**

- `tests/e2e/color-theme.ts` (new): the shared helper.
- The eight specs that adopt it: `a11y`, `blog.a11y`, `blog-fixture.a11y`, `sections`,
  `theme-tokens`, `visual`, `projects-motion` and `not-found`.
- `tests/e2e/geometry.spec.ts`: the 320 width and the head comment.
- `tests/e2e/a11y.spec.ts`: drop the 320 reflow test and update the head comment.
- `tests/e2e/pages.spec.ts` and `tests/e2e/projects.spec.ts`: the sideways-scroll loops.
- `tests/e2e/theme-tokens.spec.ts`: the ring checks and the head comment.
- `docs/testing.md`: the E2E Layers row, the theme-tokens paragraph and a "Measured gate times"
  entry.
- This plan, and the review report later.

**Out (left as they are, with the reason):**

- **`theme.spec.ts` `seed()`.** It is the theme feature's own test harness. It removes the key,
  writes raw and invalid values, and seeds a `BrowserContext`. Folding it into a
  `"dark" | "light"` helper would weaken it.
- **`tests/reference/capture-ghost.spec.ts`.** It belongs to the Flux reference project and
  uses Flux's key.
- **Sideways-scroll checks that assert something geometry does not:**
  - `shell.spec.ts`: a very long title injected, with JavaScript on and off;
  - `no-js.spec.ts`: JavaScript off;
  - `a11y.spec.ts`: 200% zoom and WCAG 1.4.12 text spacing;
  - `blog.a11y.spec.ts`: text spacing and broken images;
  - `blog.spec.ts`: the table and code blocks scroll inside their own boxes, and wide and full
    images at five widths;
  - the fixture-site and `sections`-project specs, on pages that geometry does not visit.

  The blog checks call `noSidewaysScroll` on a page they load anyway. Removing that one line
  saves no page load and loses the baseline taken before the overrides.
- **Anything under `src/`,** including the CSS focus rule. `design-tokens.test.ts` stays
  unchanged.

**Follow-ups for the PR body:** none planned. If W2's 320 px geometry run finds an element
outside the viewport, that is a site bug and gets its own issue (see Risks).

## Constitution Check

- **I. Test-First:** W1 is a refactor with no new behaviour; the specs that call the helper are
  its tests and stay green. W2 adds the 320 geometry case first, sees it red once with a scratch
  wide element, and only then removes the repeated checks, with a coverage mapping. W3 writes
  the ring checks first and sees them red on a scratch `currentColor` ring that the old
  assertion lets through.
- **II. Automated Release Gate:** no check is weakened. Every removed assertion has a stronger
  equivalent in geometry, at the same width and on the same page (mapping in W2). The `a11y`
  project keeps its zoom and text-spacing reflow checks. The full gate runs, because `tests/`
  and `docs/` are full-tier paths.
- **III. Human Review for Major Changes:** no criterion fires.
  - no dependency, integration or service change;
  - no contact-data change;
  - no design-system, layout, navigation or identity change (no CSS, template or baseline
    changes);
  - no running-cost increase (CI time goes down slightly);
  - no CI, deployment or infrastructure configuration change (`playwright.config.ts`,
    `.github/` and `package.json` are untouched);
  - no constitution amendment.

  Verdict: **not major**. Auto-merge can go on once the after-figures are pushed.
- **IV. First-Party Before Custom:**
  - The helper wraps Playwright's own `page.addInitScript`, the documented way to run code
    before a page's scripts, which is what the site's pre-paint theme script needs. The helper
    is a shared function around a first-party API, not custom scripting.
  - Three first-party alternatives were considered and rejected:
    - **A `test.extend` option fixture** (`test.use({ colorTheme })`). Every caller picks the
      theme per test inside a `for (const theme of THEMES)` loop, often together with a
      viewport. Several pick it inside a helper (`visual.spec.ts` `open()`,
      `theme-tokens.spec.ts`). An option fixture would need a `describe` plus `test.use` per
      theme in eight files: more churn and no gain.
    - **`storageState` with `origins[].localStorage`.** It is context-wide and origin-bound,
      and the callers use two origins (4321 and 4322).
    - **`page.emulateMedia({ colorScheme })`.** The site reads the media query only when the
      stored value is `system` (`src/scripts/theme-init.js`), so it cannot choose light or dark.
  - The ring check uses `expect(locator).toHaveCSS()`. Its one in-page step is
    `CSSStyleDeclaration.setProperty`, which the site's CSP permits. This copies the existing
    `colourOf()` precedent in the same file.
  - No Astro decision is made, so the Astro Docs MCP was not consulted.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected.
- **X. Accessible, Fast and Private:**
  - WCAG 1.4.10 reflow at 320 px stays covered, now by geometry. That check is stronger: it also
    asserts that no element sits outside the viewport, and that the header and footer stay clear
    of the main content.
  - The 2.4.7 focus-visible coverage gets stronger in dark mode.
  - axe and the budget are unchanged.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/playwright-theme-layout-tidy/` and the `after_chore_*` commits.

## Work items

**Preamble for every implement subagent:**

- **Toolchain.**
  - Run every pnpm command through the shim
    `/Users/doncoleman/.claude/jobs/81d02a68/tmp/bin/pnpm`, which loads nvm's Node 24.
  - Bound each run with `perl -e 'alarm N; exec @ARGV' <cmd...>`. macOS has no `timeout`.
  - Run every command from the worktree. Never `cd` into `/Users/doncoleman/Repos/dcc-web`.
- **Before any Playwright run:** check `lsof -i :4321 -i :4322`. A sibling worktree's server on
  either port gives spurious 404s or ECONNREFUSED (`reuseExistingServer`). If one is up, wait
  and rerun.
- **After each item:** run its targeted projects, then `pnpm run verify:quick`. Never run the
  full `pnpm run verify`; the orchestrator runs it.
- **No site changes.** Do not touch `src/`. If a test can only pass by changing the site, stop
  and report it.

Order: W1 → W2 → W3 → W4, then W5 (orchestrator). Each item leaves the suite green on its own.
W3 builds on W1's import in `theme-tokens.spec.ts`.

### W1 — Shared theme helper, adopted by eight specs

**Files:**

- `tests/e2e/color-theme.ts` (new). The name follows the storage key and avoids confusion with
  the existing `theme.spec.ts`.
- `tests/e2e/a11y.spec.ts`, `blog.a11y.spec.ts`, `blog-fixture.a11y.spec.ts`,
  `sections.spec.ts`, `theme-tokens.spec.ts`, `visual.spec.ts`, `projects-motion.spec.ts` and
  `not-found.spec.ts`.

**Change:**

1. **The helper.** It uses plain named exports like `templates.ts`, imported with the `.ts`
   extension, and exports three things:
   - `type Theme = "dark" | "light"`;
   - `setTheme(page: Page, theme: Theme)`: the current `addInitScript` body, with its
     `try`/`catch` and the "falls back to dark" comment;
   - `expectThemeClass(page: Page, theme: Theme)`: the repeated
     `toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/)` on `html`.
2. **Delete each copy and import the helper instead:**
   - the local `setTheme` in `a11y`, `blog.a11y`, `blog-fixture.a11y` and `sections`;
   - `startIn` in `theme-tokens`, whose local `Theme` type also goes;
   - the inline block in `visual.spec.ts` `open()`;
   - the inline block in `projects-motion.spec.ts`. Its comment said "default theme", which is
     dark, so the helper's comment is correct.
3. **Class assertions.** Every verbatim class assertion becomes `expectThemeClass`:
   - `a11y.spec.ts` (two);
   - `blog-fixture.a11y.spec.ts`;
   - `visual.spec.ts` `open()`;
   - `projects-motion.spec.ts`;
   - `theme-tokens.spec.ts` `expectTheme`.
4. **`not-found.spec.ts`.** "renders in the visitor's currently-chosen theme" switches to
   `setTheme(page, "light")` and `expectThemeClass(page, "light")`. This is a clear win: one
   mechanism everywhere, and the assertion is equivalent to its current
   `not.toHaveClass(/\bdark\b/)`.
5. **`theme.spec.ts`** is left alone (see Scope).

**Test:** existing. The eight specs are the helper's tests, and the refactor adds no behaviour.

- Run `--project=e2e` on `blog.a11y`, `blog-fixture.a11y`, `theme-tokens`, `projects-motion`
  and `not-found`.
- Run `--project=a11y`, `--project=visual` and `--project=sections`.
- All must pass, with the count unchanged (1419).
- `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` must be empty. A snapshot diff
  is a regression, not a baseline to refresh.

- [ ] done

### W2 — Fold the repeated sideways-scroll checks into the geometry test

**Files:** `tests/e2e/geometry.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/pages.spec.ts`
and `tests/e2e/projects.spec.ts`.

**Change:**

1. **Test first: the 320 px geometry case.**
   - Add `{ name: "narrow", width: 320, height: 640 }` as the first entry of geometry's
     `WIDTHS`. The height matches the a11y reflow test it replaces.
   - Rewrite geometry's "Overlap with other specs" comment. Geometry now owns the per-template
     sideways-scroll check at 320, 390 and 1280 with JavaScript on, including WCAG 1.4.10
     reflow at 320. `no-js.spec.ts` keeps the check with JavaScript off, and `a11y.spec.ts`
     keeps it at 200% zoom and with text spacing.
   - **Seen red once,** in a scratch edit that is never committed:
     - after `goto`, append a 400 px-wide `div` to `body`, set with
       `el.style.setProperty("width", "400px")`, which the CSP permits;
     - run `--project=e2e geometry.spec.ts -g narrow` and confirm that both the scroll
       assertion and the offenders assertion fail;
     - revert, then run the 54 geometry tests green.
2. **Remove the repeated checks.**
   - **`a11y.spec.ts`:** delete "reflows without horizontal scroll at 320 CSS px wide".
     - In the head comment, change "no horizontal scroll at 320 px and at 200% zoom" to say
       that the 320 px check lives in `geometry.spec.ts`.
     - `expectNoHorizontalScroll` stays: the zoom and text-spacing tests use it.
   - **`pages.spec.ts`:** wrap the `for (const width of [320, 390, 1280])` loop in
     `if (!TEMPLATES.some((t) => t.path === path))`.
     - Import `TEMPLATES` from `./templates.ts`.
     - Add a one-line comment saying that templates are covered by `geometry.spec.ts` at the
       same widths.
     - Today the loop then runs only for `/privacy/tempo/`. A path added to `PAGES` later but
       not to `TEMPLATES` keeps its check without anyone having to remember.
   - **`projects.spec.ts`:** delete the "does not scroll sideways" loop on `INDEX`
     (`/projects/`, which is a template).

**Test:** new-first for the geometry width, then removal with the mapping below.

- **Layer:** E2E (`e2e` project), because only a browser lays the page out.
- **No second layer.** The `a11y` project's remaining reflow checks test different conditions
  (zoom and text spacing), not the same behaviour.
- **Runs:** `--project=e2e` on `geometry`, `pages` and `projects`, then `--project=a11y`.

**Coverage mapping** (removed assertion → where it now lives). Every removed test asserted
`scrollWidth <= clientWidth`.

| Removed | Now in |
|---|---|
| `a11y.spec.ts` "reflows without horizontal scroll at 320 CSS px wide": 18 templates, 320×640, JavaScript on | `geometry.spec.ts` "`<template>` at narrow width keeps its layout inside the viewport": the same 18 templates at 320×640 with JavaScript on. Same assertion, plus no element outside the viewport and the header, main and footer order. It adds reduced motion, which only settles the story chapters. |
| `pages.spec.ts` "does not scroll sideways at 320/390/1280px" for `/`, `/services/`, `/speaking/`, `/about/`, `/privacy-policy/`, `/terms-of-use/` and `/technology/`: 21 tests, height 800 | `geometry.spec.ts` at narrow, phone and desktop for the same seven templates (heights 640, 844 and 800). At a fixed width, horizontal scroll does not depend on height. `/privacy/tempo/` is not a template, so it keeps its three tests in `pages.spec.ts`. |
| `projects.spec.ts` "does not scroll sideways at 320/390/1280px" on `/projects/`: 3 tests | `geometry.spec.ts` `projects` at narrow, phone and desktop. |

- [ ] done

### W3 — Focus-ring probes that prove a real ring in dark mode

**Files:** `tests/e2e/theme-tokens.spec.ts`.

**Why the current check is blind in dark mode.** When no rule sets `outline-color`, it computes
to `currentColor`, the element's text colour. In dark mode the prose link is `accent-400`
(`.dark .prose-accent`, `--tw-prose-links`), and so is the ring (`dark:outline-accent-400`).
The `a:focus-visible` rule could stop applying or lose its colour utilities, and
`outline-color` would still read `accent-400`, so the probe would pass. The light case is safe:
there the link is `accent-600` and the ring `accent-500`.

**Change:** in `expectTheme`, for every probe with `focus: true`:

1. **Before focus.** Before `locator.focus()`, assert `toHaveCSS("outline-style", "none")`. With
   no focus there is no ring, so any ring that appears after focus comes from the focus rule.
2. **Ring shape.** After the existing colour assertions, assert with `toHaveCSS` that
   `outline-style` is `solid`, `outline-width` is `2px` and `outline-offset` is `2px`. That is
   the site's rule (`outline-2 outline-offset-2`). Chromium's own `:focus-visible` default is
   `auto`, 1px and offset 0, so it cannot pass.
3. **Ring colour does not follow the text colour.**
   - Override the element's own colour in place:
     `locator.evaluate((el) => (el as HTMLElement).style.setProperty("color", "rgb(1, 2, 3)"))`.
   - Assert that `outline-color` still equals the ring token's colour. That is the `expected`
     value already computed for the `outline-color` property.
   - Then call `removeProperty("color")`.
   - A ring that falls back to `currentColor` turns `rgb(1, 2, 3)`; a token ring does not.
4. **Shape of the code.** Put steps 2 and 3 in a small
   `expectRealRing(locator, ringColour, label)` function next to `expectTheme`. Its failure
   messages name the probe and the theme, and say "outline follows the text colour".
5. **Head comment.** Add a sentence: in dark mode the prose link and its ring share
   `accent-400`, so the focus probes also prove that the ring is the site's rule and not
   `currentColor`.

Both focus probes (prose link and build link) get the check. It adds no page load. The probe
tables and the test count (6) stay the same.

**Test:** new-first.

- **Layer:** E2E (`e2e` project), where the probe already lives. Only a browser's computed style
  shows the result of the cascade.
- **Not a second layer.** `design-tokens.test.ts` keeps guarding the CSS source text. The unit
  test reads the rule as written, and this test reads what the browser resolves, so they do not
  test the same behaviour.
- **Seen red,** in a scratch edit that is never committed:
  - Right after `ready(page)` in the test body, inject a constructed stylesheet holding
    `a:focus-visible { outline-color: currentColor !important; }`. Use the `adoptedStyleSheets`
    pattern from `a11y.spec.ts`, because the CSP blocks `<style>`.
  - Run `--project=e2e theme-tokens.spec.ts`. The `/writing/every-part/` "dark then light" test
    must fail on the new `currentColor` check, while the old `outline-color` assertion on the
    prose link still passes in dark.
  - Revert, then run all 6 tests green.

- [ ] done

### W4 — `docs/testing.md`

**Files:** `docs/testing.md`.

**Change:**

- **Layers table, E2E row.** "layout geometry per template (no sideways scroll, ...)" becomes
  "layout geometry per template at 320, 390 and 1280 px (no sideways scroll, ...)".
- **Visual coverage, theme-tokens paragraph.** Add one sentence: the focus-ring probes also
  check that the ring is the site's 2px rule and keeps its token colour when the text colour
  changes. That matters in dark mode, where the prose link and its ring share `accent-400`.
- **Measured gate times.** Add a dated entry, `### Playwright theme and layout tidy, #49
  (<date>)`, as the section's Method asks ("add a dated row rather than overwrite"):
  - the before column from Acceptance: run 37161130853, `e2e` job 445 s, step 318 s, E2E tests
    615, accessibility tests 626, all Playwright tests 1419;
  - the after column: the counts from W2 (609, 608 and 1395), and `pending (#49 PR run)` for
    the two times.
- The "Where a test goes" bullets stay byte-identical, and CLAUDE.md is not touched.

**Test:** `no behaviour: n/a (documentation only)`. `verify:quick` runs the unit checks that
read `docs/testing.md`.

- [ ] done

### W5 — `[ORCHESTRATOR]` Full gate, after-measurement, PR

**Files:** `docs/testing.md` (the `pending` cells). Not for an implement subagent.

1. **Full gate.** After the review phase and its fixes, ask Don before running it. Check
   `lsof -i :4321` first, then run `pnpm run verify` in the background under `perl alarm` and
   read the `VERIFY_EXIT=` line.
2. **No baselines.** No snapshot changes, so this chore has no visual-baselines step. If any
   snapshot differs, stop: it is a regression.
3. **After-measurement,** from the PR's first green CI run:
   - take the `e2e` job time and the `test:e2e:parallel` step time from
     `gh run view <id> --json jobs`;
   - fill the `pending` cells, and note that this is a PR run with the preview site-check, so
     the step time is the comparable number;
   - commit `docs(testing): record #49 e2e times` and push.
4. **PR.**
   - The body has `Closes #49`, the before/after table, the W2 coverage mapping, the note that
     `blog-fixture.a11y.spec.ts` held a copy the issue did not count, and the Principle III
     verdict (not major).
   - Open it from `drc-agents`, per CLAUDE.md Merging.
   - Enable auto-merge after the after-figures push.

- [ ] done

## Docs citations

Playwright (the only tool whose usage changes):

- `page.addInitScript`, the helper's mechanism: it runs before any page script on every
  navigation. https://playwright.dev/docs/api/class-page#page-add-init-script
- Fixtures, `test.extend` and option fixtures (considered for the helper and rejected under
  Principle IV): https://playwright.dev/docs/test-fixtures
- Parameterised tests in loops, and option fixtures for parameters:
  https://playwright.dev/docs/test-parameterize
- `test.use` options and `storageState` (considered and rejected):
  https://playwright.dev/docs/test-use-options and
  https://playwright.dev/docs/api/class-browser#browser-new-context-option-storage-state
- `page.emulateMedia({ colorScheme, reducedMotion })`:
  https://playwright.dev/docs/api/class-page#page-emulate-media
- `expect(locator).toHaveCSS()`, which reads the computed style and retries:
  https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-css
- `expect(locator).toHaveClass()`:
  https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-class
- `locator.focus()`, `locator.blur()` and `locator.evaluate()`:
  - https://playwright.dev/docs/api/class-locator#locator-focus
  - https://playwright.dev/docs/api/class-locator#locator-blur
  - https://playwright.dev/docs/api/class-locator#locator-evaluate
- Test CLI (`--list`, `--project`, `-g`): https://playwright.dev/docs/test-cli

Web platform, used inside the page:

- `outline-color` (initial value `currentcolor`):
  https://developer.mozilla.org/en-US/docs/Web/CSS/outline-color
- `:focus-visible`: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- `CSSStyleDeclaration.setProperty()`, and `removeProperty()` with it:
  https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty
- WCAG 2.2 Success Criterion 1.4.10, Reflow (320 CSS px):
  https://www.w3.org/WAI/WCAG22/Understanding/reflow

Astro: no Astro decision is made, so the Astro Docs MCP was not consulted.

## Risks

- **Geometry at 320 px may find a real offender.** The element walk has never run at 320.
  - If one of the 18 new cases fails, do not weaken the walk and do not add an exemption.
  - Keep the a11y 320 test, and mark that one geometry case `test.fail()` with a comment naming
    a new bug issue.
  - Report it to the orchestrator. The fix changes site behaviour, so it belongs in `/squash`.
- **`locator.focus()` and `:focus-visible`.** In Chromium, a programmatic focus matches
  `:focus-visible` only if no pointer interaction came before it. The existing light-mode probe
  already passes on `accent-500`, so focus matches today. If that ever changes, the new
  `outline-style: solid` assertion fails loudly instead of passing silently.
- **The inline colour override leaking.** W3 removes the property straight after the
  assertion, before `blur()`. The class flip that follows reads fresh computed values. A
  failure between the set and the remove affects only the page of that failed test.
- **Visual shots through the new helper.** The helper's body is identical to the copies, so no
  pixel can move. Acceptance 5 checks this.
- **Port collisions with sibling worktrees** on 4321 and 4322: check `lsof`, wait and rerun.
- **Conflicts with other branches** that touch the same specs: none known at fb9dd8e. Merge
  `main` before the PR if it moves.
