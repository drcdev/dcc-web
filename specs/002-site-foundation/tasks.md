---

description: "Task list for site foundation for doncoleman.ca"
---

# Tasks: Site foundation for doncoleman.ca

**Input**: Design documents from `/specs/002-site-foundation/` (plan.md, spec.md, research.md,
data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md — all
present and read.

**Tests**: MANDATORY per Constitution Principle I (test-first, non-negotiable). Every test task is
ordered before the implementation task it covers, with the instruction: write the test, run it,
see it fail, then implement. No task is marked done on a red suite (Principle II); each phase ends
with a task that runs its own tests, and the final phases run `pnpm run verify`.

**Organization**: The constitution's build order (plan.md "Build order for the tasks phase")
overrides the default per-user-story phase grouping for this feature, because the shell, themes,
SEO and security layers are built incrementally on top of one another rather than as independent
vertical slices. Each phase still names which user story (`[USx]`) its tasks serve where a single
story applies; cross-cutting infrastructure, security and polish tasks carry no story label, as the
task-format rules specify for setup/foundational/polish work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unmet dependency on an incomplete task)
- **[USx]**: Maps to the user story of that ID in spec.md (US1 shell, US2 themes, US3 pipeline,
  US4 SEO/sharing, US5 not-found, US6 statistics, US7 design-source document)
- **[PREVIEW-CHECK]**: Needs the live preview, the Cloudflare dashboard, LinkedIn Post Inspector,
  Web Analytics, or Don's own eyes — collected in Phase 11, cannot be verified by an implementing
  subagent working locally
- File paths are exact and relative to the repository root

---

## Phase 1: Setup & dependencies

**Purpose**: Add the new tooling, wire the E2E server to `wrangler dev`, and give every later
phase a working `resolveSiteOrigin` so `astro.config.mjs`'s `site` value is correct before any
page is built.

- [ ] T001 Add Tailwind v4 with `pnpm astro add tailwind` (installs `tailwindcss` +
  `@tailwindcss/vite`, creates `src/styles/global.css`); add `@tailwindcss/typography` as a
  devDependency (research R3).
- [ ] T002 [P] Add the official sitemap integration with `pnpm astro add sitemap` (installs
  `@astrojs/sitemap`, registers it in `astro.config.mjs`) (FR-018, research R9).
- [ ] T003 [P] Write a failing unit test in `tests/unit/site/config-files.test.ts` (extend the
  existing `wrangler.jsonc` describe block) asserting `assets.not_found_handling === "404-page"`
  (FR-016, FR-023). Run it and confirm it fails.
- [ ] T004 Update `wrangler.jsonc` to add `"assets": { "directory": "./dist", "not_found_handling":
  "404-page" }` to pass T003 (research R7).
- [ ] T005 Update `playwright.config.ts`: change `webServer.command` to
  `pnpm exec wrangler dev --ip 127.0.0.1 --port 4321` with `env: { WRANGLER_SEND_METRICS: "false"
  }`, drop the `ASTRO_PREVIEW_BACKGROUND` workaround, set `retries: 0` (FR-027a), and add four
  projects — `e2e`, `a11y`, `budget`, `visual` — each pointed at its own `testMatch` under
  `tests/e2e/` (research R11, R14).
- [ ] T006 [P] Update `vitest.config.ts` `test.include` to add `"tests/component/**/*.test.ts"`
  alongside `"tests/unit/**/*.test.ts"` (research R11).
- [ ] T007 Extend `package.json` `scripts`: `test` runs Vitest over unit + component tests,
  `test:e2e` runs all four Playwright projects, add `test:a11y`, `test:budget`, `test:visual`,
  `test:visual:update` (single-project convenience scripts), `reference:capture` (runs
  `tests/reference/capture-ghost.spec.ts` with its own config), `deploy:preview` (runs
  `scripts/deploy/preview.ts`); update `verify` to
  `lint:secrets && lint && typecheck && test && build && test:e2e` (contracts/verify-gate.md).
- [ ] T008 [P] Update `.github/workflows/ci.yml`: add a step after "Run the verify gate" with
  `if: failure()` that uploads `playwright-report/`, `test-results/` and
  `tests/e2e/**/*-snapshots/**` via a pinned-SHA `actions/upload-artifact` (research R14, R16; no
  new GitHub secrets).
- [ ] T009 [P] Write a failing unit test `tests/unit/site/site-origin.test.ts` for
  `resolveSiteOrigin(env, config)` and `previewAlias(branch)` per
  [contracts/site-origin.md](../specs/002-site-foundation/contracts/site-origin.md) (every row of
  the resolution table, plus the `previewAlias` examples) (FR-017a). Run it and confirm it fails
  (module does not exist yet).
- [ ] T010 Implement `src/lib/site-origin.ts` (`FALLBACK_ORIGIN`, `previewAlias`,
  `resolveSiteOrigin`) to pass T009 (research R2).
- [ ] T011 Add an optional `workersSubdomain` field to `setup/config.json` and to the
  `SetupConfig` type/schema in `scripts/setup-check/schemas.ts` so `astro check` and the existing
  setup-check tests keep passing (research R2; plan "Project Structure").
- [ ] T012 Update `astro.config.mjs` to compute `site` with
  `resolveSiteOrigin(process.env, setupConfigJson)` (reading `setup/config.json` at build time),
  register the `sitemap()` integration from T002, and register the Tailwind Vite plugin from T001
  (FR-017, FR-017a).
- [ ] T013 Implement `scripts/deploy/preview.ts` running
  `wrangler versions upload --preview-alias <previewAlias(WORKERS_CI_BRANCH)>`, exiting non-zero
  with a plain message when `WORKERS_CI_BRANCH` is missing or its alias is `null`; update
  `docs/setup.md` item 10 (Workers Builds) to document the one-time dashboard change — the
  non-production branch deploy command becomes `pnpm run deploy:preview` — leaving the build
  command and production deploy command unchanged (research R2, quickstart step 4.1).
- [ ] T014 Run `pnpm exec vitest run tests/unit/site/site-origin.test.ts
  tests/unit/site/config-files.test.ts`, `pnpm run lint`, and `pnpm run typecheck`; fix anything
  red before moving to Phase 2.

**Checkpoint**: dependencies installed, E2E server is `wrangler dev`, `resolveSiteOrigin` is
tested and wired into `astro.config.mjs`, `deploy:preview` exists.

---

## Phase 2: Design source doc + reference screenshots

**Purpose**: FR-032 requires this document before any other implementation work; the Ghost
reference screenshots (FR-005) must exist before any styling task so Don has something to compare
against later. [US7] [US1]

- [ ] T015 [P] [US7] Write a failing unit test `tests/unit/site/design-source.test.ts` asserting
  every requirement in
  [contracts/design-source-doc.md](../specs/002-site-foundation/contracts/design-source-doc.md):
  the five required headings, the `gh repo clone drcdev/flux .reference/flux -- --depth 1` command
  and "read-only"/"gitignored"/"never imported" language, all 18 mapping rows with every Flux name
  listed in the contract, every "what doesn't carry over" item, every current-URL pattern and the
  words "no redirects"; plus that `.gitignore` contains `.reference/` and no file under `src/`
  contains the string `.reference` (FR-032, FR-033). Run it and confirm it fails (the document does
  not exist yet).
- [ ] T016 [US7] Write `docs/design-source.md` to satisfy T015: "How to get Flux", "Mapping"
  (18-row table, columns `Flux part | Becomes | Owner`, using `.reference/flux` — already cloned —
  read by hand, never imported), "What doesn't carry over", "Current live URLs", and
  "Accessibility adjustments" (initially "None") (plan.md "Design source document (first task)").
- [ ] T017 Run `pnpm exec vitest run tests/unit/site/design-source.test.ts` and confirm it passes.
- [ ] T018 [P] [US1] Write `tests/reference/playwright.config.ts`, a standalone Playwright config
  (not part of the `e2e`/`a11y`/`budget`/`visual` projects or `verify`) targeting
  `https://www.doncoleman.ca` (research R13).
- [ ] T019 [US1] Write `tests/reference/capture-ghost.spec.ts`: for pages home (`/`), the first
  post linked from home (matched by `/(drift|convergence|news)/\d{4}/`), and `/about/`, at widths
  phone 390×844 and desktop 1280×800, in themes dark and light (set via
  `addInitScript(() => localStorage.setItem("color-theme", …))`), save full-page PNGs to
  `tests/reference/ghost/{page}-{width}-{theme}.png` (12 files) (FR-005, research R13). If the live
  site is unreachable, the spec fails loudly rather than guessing (spec Assumptions).
- [ ] T020 [US1] Run `pnpm run reference:capture` against the live site; write
  `tests/reference/ghost/README.md` recording the capture date and the post URL used; commit all
  12 PNGs plus the README (FR-005).
- [ ] T021 Confirm all 12 reference files exist with the expected names and non-zero size before
  moving to Phase 3 (`ls tests/reference/ghost/*.png | wc -l` → 12).

**Checkpoint**: `docs/design-source.md` is committed and content-tested; the 12 Ghost reference
screenshots are committed for Don's later by-eye comparison.

---

## Phase 3: Design tokens & global styles

**Purpose**: Port Flux's design system into Tailwind tokens before any component uses them. [US1]

- [ ] T022 [P] [US1] Write a failing unit test `tests/unit/site/design-tokens.test.ts` asserting
  `src/styles/global.css` defines, for each of `dusk`, `rust`, `sage`, `lavender`, `mist`, `sand`,
  `mauve`, a `BASE` custom property plus all eleven derived shades (50–950), and that
  `--color-accent-BASE` equals `#d68844` with its own eleven derived shades (FR-001, FR-002,
  FR-003). Run it and confirm it fails.
- [ ] T023 [US1] Port the seven Flux `@theme` palettes from `.reference/flux/assets/css/screen.css`
  into `src/styles/global.css` by hand (never imported), keeping the
  `hsl(from var(--color-X-BASE) h s N%)` derivation so changing one `BASE` value updates the whole
  palette (FR-001, FR-002); add the fixed `accent-*` palette derived from `#d68844` (FR-003) to
  pass T022.
- [ ] T024 [US1] Add `@custom-variant dark (&:where(.dark, .dark *));` and a new
  `@custom-variant js (&:where(.js, .js *));` to `src/styles/global.css` (research R3, R6).
- [ ] T025 [US1] Port `.prose-accent` (with `@tailwindcss/typography` registered), heading colours
  (H1/H2 rust, H3 sage, H4 lavender, H5/H6), `.table-wrapper` rules, and the
  `a:focus-visible, button:focus-visible` focus ring — including a `forced-colors` fallback
  (`outline-color: CanvasText`) — into `src/styles/global.css`, as-is from Flux (FR-001, FR-020a).
  Record any pairing that fails AA contrast in `docs/design-source.md`'s "Accessibility
  adjustments" section, replacing only the failing utility with the nearest passing shade of the
  same palette (FR-001a).
- [ ] T026 [US1] Add `--font-body` / `--font-heading` tokens set to Tailwind's default system font
  stack (no web fonts) and apply them to body and heading elements as Flux's two font rules do
  (FR-003).
- [ ] T027 Run `pnpm exec vitest run tests/unit/site/design-tokens.test.ts` and `pnpm run
  typecheck`; fix anything red before moving to Phase 4.

**Checkpoint**: every palette is ported and unit-tested; global styles are ready for components to
consume.

---

## Phase 4: Base layout, head metadata, theme script

**Purpose**: Build the document-level shell (landmarks, skip link, per-page metadata) and the
pre-paint theme script, with placeholder header/footer components that Phases 5–6 fill in. [US1]
[US2]

- [ ] T028 [P] [US2] Write a failing unit test `tests/unit/site/theme.test.ts` for `parseTheme`,
  `nextTheme` (`dark → light → system → dark`), and `isDark(choice, prefersDark)` per
  [contracts/theme.md](../specs/002-site-foundation/contracts/theme.md) and data-model.md
  `ThemeChoice` (FR-011, FR-012, FR-015). Run it and confirm it fails.
- [ ] T029 [US2] Implement `src/lib/theme.ts` (`parseTheme`, `nextTheme`, `isDark`) to pass T028.
- [ ] T030 [P] [US2] Write a failing unit test `tests/unit/site/theme-init.test.ts` for
  `src/scripts/theme-init.js` against a stubbed `document`/`localStorage`: adds `js` to `<html>`;
  sets/removes `dark` per the stored choice, resolving `system` via
  `matchMedia('(prefers-color-scheme: dark)')`; treats absence, a throwing `localStorage`, or an
  unrecognised value as `dark`; never throws; does not write storage on first visit (FR-013,
  FR-015). Run it and confirm it fails.
- [ ] T031 [US2] Implement `src/scripts/theme-init.js` (plain JS, ≤ 1 KB, no network access) to
  pass T030 (research R5).
- [ ] T032 [P] [US1] Write a failing component test `tests/component/BaseLayout.test.ts` (Astro
  Container API, `renderToString`) asserting `<html lang="en" class="dark …">`, exactly one
  `<header>`, one `<nav aria-label="Main">`, one `<main id="main" tabindex="-1">`, one `<footer>`,
  exactly one `<h1>` with no skipped heading levels, and the skip link as the first focusable
  element, per [contracts/shell-dom.md](../specs/002-site-foundation/contracts/shell-dom.md) and
  data-model.md (FR-010, FR-010a, FR-020b). Run it and confirm it fails.
- [ ] T033 [P] [US1] Write a failing component test `tests/component/SkipLink.test.ts` for
  `src/components/SkipLink.astro`: `<a href="#main">Skip to main content</a>`, visually hidden
  until focused (FR-010). Run it and confirm it fails.
- [ ] T034 [P] [US4] Write a failing component test `tests/component/Seo.test.ts` for
  `src/components/Seo.astro` per
  [contracts/head-metadata.md](../specs/002-site-foundation/contracts/head-metadata.md): title
  format, description/canonical/robots/OG/twitter tags, defaults from `src/config/site.ts`,
  per-field overrides, canonical and `og:url` omitted when `canonical=false` (FR-017, FR-017b,
  FR-017c). Run it and confirm it fails.
- [ ] T035 [US1] [US4] Implement `src/config/site.ts` (`SiteConfig`: `name`, `defaultDescription`,
  `defaultImage`, `defaultImageAlt`, `locale: "en_CA"`, `indexable: false`, `copyrightName`) per
  data-model.md `SiteConfig`, then implement `src/components/Seo.astro` to pass T034.
- [ ] T036 [US1] Implement `src/components/SkipLink.astro` to pass T033.
- [ ] T037 [P] [US1] Create minimal placeholder `src/components/SiteHeader.astro` (a bare
  `<header>` landmark) and `src/components/SiteFooter.astro` (a bare `<footer>` landmark) so
  `BaseLayout` can compose them now; Phase 5 and Phase 6 replace their contents.
- [ ] T038 [US1] Implement `src/layouts/BaseLayout.astro`: `<html lang="en" class="dark
  motion-safe:scroll-smooth">`, imports `src/styles/global.css`, renders the inline
  `theme-init.js` script (via `?raw`) before the stylesheet link, renders `<Seo />`, `<SkipLink
  />`, `<SiteHeader />`, `<main id="main" tabindex="-1">` with a slot, `<SiteFooter />` — to pass
  T032 (FR-013, FR-021).
- [ ] T039 Wire `src/pages/index.astro` to use `BaseLayout` as a minimal placeholder home page
  (spec Assumptions: real content is a later feature).
- [ ] T040 Run `pnpm exec vitest run tests/unit/site/theme.test.ts tests/unit/site/theme-init.test.ts
  tests/component/BaseLayout.test.ts tests/component/SkipLink.test.ts tests/component/Seo.test.ts`
  and `pnpm run typecheck`; fix anything red before moving to Phase 5.

**Checkpoint**: every page has one set of landmarks, a language attribute, a skip link, and
site-wide metadata; the theme is dark by default with no flash mechanism in place (toggle comes in
Phase 6).

---

## Phase 5: Header, navigation & mobile menu

**Purpose**: Replace the header placeholder with the real site name, seven-link navigation and
progressively-enhanced mobile menu. [US1]

- [ ] T041 [P] [US1] Write a failing unit test `tests/unit/site/navigation.test.ts` for
  `src/config/navigation.ts` (primary items Home/Services/Speaking/Writing/Projects/About/Contact
  in order, footer items, social items, `futureDestinations`) and `src/lib/nav.ts`
  `isCurrent(pathname, href)` (trailing-slash normalised, `/` matches only `/`) per data-model.md
  `NavigationItem` (FR-006, FR-009). Run it and confirm it fails.
- [ ] T042 [US1] Implement `src/config/navigation.ts` to pass T041 (research R4): primary `Home /`,
  `Services /services/`, `Speaking /speaking/`, `Writing /writing/`, `Projects /projects/`, `About
  /about/`, `Contact /contact/`; footer `/privacy-policy/`, `/terms-of-use/`, `/technology/`;
  social `https://github.com/drcdev`, `https://www.linkedin.com/in/drcdev`; `futureDestinations`
  exporting every internal href no page builds yet.
- [ ] T043 [US1] Implement `src/lib/nav.ts` (`isCurrent`) to pass T041.
- [ ] T044 [P] [US1] Port `src/icons/menu.svg` from `.reference/flux/partials/Icons/*` as an Astro
  SVG component, decorative (`aria-hidden="true"`) (research R15).
- [ ] T045 [P] [US1] Write a failing component test `tests/component/SiteHeader.test.ts` per
  [contracts/shell-dom.md](../specs/002-site-foundation/contracts/shell-dom.md): site name link
  text `Don Coleman` / `href="/"`; the seven primary links in order inside one `<ul
  id="primary-nav-list">` within `<nav aria-label="Main">`; current-page link has
  `aria-current="page"` plus a visible style difference; menu button
  `<button type="button" aria-controls="primary-nav-list" aria-expanded="false">` named `Menu`;
  no search/Subscribe/Sign-in/Account/portal markup (FR-004, FR-006, FR-007a, FR-008a, FR-009).
  Run it and confirm it fails.
- [ ] T046 [US1] Implement `src/components/SiteHeader.astro` markup (no script yet) to pass T045.
- [ ] T047 [P] [US1] Write a failing E2E test `tests/e2e/menu.spec.ts` covering the mobile-menu
  behaviour table in contracts/shell-dom.md (page load, activate, activate again, Escape returns
  focus to the button, choosing a link closes it, click outside closes it, focus leaving the nav
  closes it, resizing to ≥ 48rem resets to closed and moves focus off the now-hidden button, Tab
  past the last link does not trap focus) and a failing E2E test `tests/e2e/no-js.spec.ts`
  asserting that with JavaScript disabled the navigation renders as a plain wrapping `<ul>` inside
  the "Main" nav landmark with no visible menu button (FR-007, FR-007a, FR-022a). Run both and
  confirm they fail.
- [ ] T048 [US1] Add the bundled menu script to `src/components/SiteHeader.astro`: toggles
  `aria-expanded`/visibility, closes on Escape (focus returns to the button), on choosing a link,
  on outside click, and on focus leaving the nav; a `matchMedia('(min-width: 48rem)')` listener
  resets state to closed on crossing the breakpoint; all transitions wrapped in `motion-safe:`
  (research R6) — to pass T047.
- [ ] T049 [P] [US1] Write a failing E2E test `tests/e2e/shell.spec.ts` asserting the header (site
  name, seven links in order, current-page marking) appears identically on every built page, the
  skip link is the first focusable element, and Tab order runs skip link → site name → (menu
  button, phone width only) → nav links → main content → footer (FR-006, FR-009, FR-010, FR-010a).
  Run it and confirm it fails on the still-incomplete shell.
- [ ] T050 Build the app once (`pnpm run build`) and run `pnpm exec vitest run
  tests/unit/site/navigation.test.ts tests/component/SiteHeader.test.ts`, then
  `pnpm exec playwright test tests/e2e/menu.spec.ts tests/e2e/no-js.spec.ts tests/e2e/shell.spec.ts
  --project=e2e` against `wrangler dev`; fix anything red before moving to Phase 6 (footer
  assertions in `shell.spec.ts` will still fail until Phase 6 — note which assertions are
  footer-specific and defer only those).

**Checkpoint**: header, navigation and the mobile menu meet FR-006/FR-007/FR-007a/FR-009 on every
page.

---

## Phase 6: Footer, theme toggle & icons

**Purpose**: Replace the footer placeholder with the real links, copyright and theme switch,
completing US1 and delivering US2 (dark/light/system without a flash). [US1] [US2]

- [ ] T051 [P] [US1] Port `src/icons/sun.svg`, `src/icons/moon.svg`, `src/icons/github.svg`, and
  `src/icons/linkedin.svg` from `.reference/flux/partials/Icons/*`, keeping `fill="none"
  stroke="currentColor"` (research R15); decorative, `aria-hidden="true"`.
- [ ] T052 [P] [US1] Write a failing component test `tests/component/SiteFooter.test.ts` per
  contracts/shell-dom.md: links to `/privacy-policy/`, `/terms-of-use/`, `/technology/`; social
  links to `https://github.com/drcdev` (name "GitHub") and
  `https://www.linkedin.com/in/drcdev` (name "LinkedIn") with decorative icons; copyright text
  `© {build year} Don Coleman. All rights reserved.`; the theme switch present (FR-008, FR-008a).
  Run it and confirm it fails.
- [ ] T053 [US1] Implement `src/components/SiteFooter.astro` using `src/config/navigation.ts`'s
  footer/social items, with no Facebook/X/portal links, to pass T052.
- [ ] T054 [P] [US2] Write a failing component test `tests/component/ThemeToggle.test.ts` per
  [contracts/theme.md](../specs/002-site-foundation/contracts/theme.md): visible label `Theme:`
  then a `<button type="button">`; accessible name `Theme: Dark` / `Theme: Light` / `Theme: Match
  device`; a visually hidden `aria-live="polite"` region; hidden when JavaScript is off (FR-012,
  FR-012a). Run it and confirm it fails.
- [ ] T055 [US2] Implement `src/components/ThemeToggle.astro` (uses `src/lib/theme.ts` helpers; a
  bundled script cycles `dark → light → system → dark` on click, applies the class immediately,
  writes `localStorage["color-theme"]` wrapped in `try` (FR-015), announces the change via the
  live region, and — in `system` mode — re-applies the theme on a `matchMedia` change without
  reload (FR-014)) to pass T054.
- [ ] T056 Wire `ThemeToggle` into `SiteFooter.astro`, and replace `BaseLayout.astro`'s Phase-4
  placeholder `<SiteHeader />`/`<SiteFooter />` imports with the now-complete components.
- [ ] T057 [P] [US2] Write a failing E2E test `tests/e2e/theme.spec.ts` implementing the
  first-paint guarantee (SC-003) from contracts/theme.md: for each stored value (`dark`, `light`,
  `system` with the device set to light and to dark, absent, `garbage`), across first load,
  reload, following an in-site link, and back/forward navigation, record `<html>`'s `dark` class
  via a `MutationObserver` at the moment `<body>` is inserted and assert it matches the expected
  theme every time; assert the toggle cycles dark → light → system → dark and announces each
  change; assert a device theme change in `system` mode is followed within 500 ms with no reload;
  assert a blocked `localStorage` still lets the switch change the current page (FR-011, FR-012,
  FR-012a, FR-013, FR-014, FR-015). Run it and confirm it fails.
- [ ] T058 Fix any remaining wiring between `theme-init.js` and `ThemeToggle.astro` until T057
  passes.
- [ ] T059 Run `pnpm exec vitest run tests/component/SiteFooter.test.ts
  tests/component/ThemeToggle.test.ts` and `pnpm exec playwright test tests/e2e/shell.spec.ts
  tests/e2e/menu.spec.ts tests/e2e/no-js.spec.ts tests/e2e/theme.spec.ts --project=e2e`; fix
  anything red — this is the checkpoint for both US1 and US2 together.

**Checkpoint**: US1 (recognisable shell) and US2 (theme without a flash) are both fully functional
and independently testable per their spec.md acceptance scenarios.

---

## Phase 7: Not-found page

**Purpose**: Deliver a helpful, correctly-statused not-found page inside the full shell. [US5]

- [ ] T060 [P] [US5] Write a failing component test `tests/component/NotFound.test.ts` (Container
  API) for `src/pages/404.astro`: renders the full shell (skip link, header, footer), heading
  "Page not found", a plain-language explanation that mentions older blog addresses have moved, a
  link to the home page and to the main navigation, `noindex` set and no `canonical`/`og:url`
  (FR-016, FR-017c). Run it and confirm it fails.
- [ ] T061 [US5] Implement `src/pages/404.astro` using `BaseLayout`, `Seo` with `canonical={false}`
  to pass T060 (research R7).
- [ ] T062 [P] [US5] Write a failing E2E test `tests/e2e/not-found.spec.ts`: requesting
  `/drift/2025/x/`, `/convergence/`, `/news/`, `/topic/x/`, `/author/x/`, and a not-yet-built nav
  destination (e.g. `/services/`) each returns HTTP 404 with the not-found page body, in the
  visitor's currently-chosen theme, with the header and footer present (FR-006, FR-016). Run it
  and confirm it fails (`wrangler.jsonc`'s `not_found_handling` needs a fresh `pnpm run build`).
- [ ] T063 Run `pnpm run build`, then `pnpm exec vitest run tests/component/NotFound.test.ts` and
  `pnpm exec playwright test tests/e2e/not-found.spec.ts --project=e2e` against `wrangler dev`;
  fix anything red before moving to Phase 8.

**Checkpoint**: every unknown address, including retired blog addresses and not-yet-built nav
destinations, serves a 404 with the not-found page in the site's design (US5 independent test).

---

## Phase 8: Head metadata, sitemap, robots.txt & security headers

**Purpose**: Finish per-page search/sharing metadata and the sitemap (US4), and lock down security
headers, CSP and statistics resilience (US6, and the FR-024 series with no dedicated story).

- [ ] T064 [P] Write a failing unit test `tests/unit/site/csp.test.ts` asserting the
  `astro.config.mjs` `security.csp` configuration matches
  [contracts/http-responses.md](../specs/002-site-foundation/contracts/http-responses.md)'s "Meta
  CSP on every HTML page" table: required directives present, the `theme-init.js` SHA-256 hash
  present in `script-src`, `https://static.cloudflareinsights.com` in `script-src`,
  `https://cloudflareinsights.com` in `connect-src`, and none of `unsafe-inline`, `unsafe-eval`,
  `web3forms`, `jsdelivr`, `supabase`, or a bare `https:` scheme anywhere (FR-024a, FR-024b,
  FR-024c). Run it and confirm it fails.
- [ ] T065 Configure `security.csp` in `astro.config.mjs` (research R8: computed hash of
  `src/scripts/theme-init.js`, `scriptDirective`/`styleDirective` resources, the fixed
  `directives` list) to pass T064.
- [ ] T066 [P] Extend `tests/unit/site/headers.test.ts` (existing file) asserting the `/*` rule in
  `public/_headers` carries the full FR-024 header set — `Content-Security-Policy:
  frame-ancestors 'none'; object-src 'none'; base-uri 'self'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(),
  microphone=(), geolocation=(), payment=(), usb=()`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000` —
  alongside the existing `X-Robots-Tag: noindex`, and that no rule ever sets `Set-Cookie`
  (FR-024). Run it and confirm it fails.
- [ ] T067 Extend `public/_headers` `/*` rule with the full FR-024 header set (keeping
  `X-Robots-Tag: noindex`) to pass T066 (research R8).
- [ ] T068 [P] Write a failing unit test `tests/unit/site/sitemap.test.ts` asserting the
  `@astrojs/sitemap` `filter` excludes any page whose pathname starts with `/404`, and that the
  configured `site` is used for its entries (FR-018). Run it and confirm it fails.
- [ ] T069 Configure the sitemap `filter` in `astro.config.mjs` to pass T068 (research R9).
- [ ] T070 [US4] Implement `src/pages/robots.txt.ts` as a static endpoint per
  [contracts/head-metadata.md](../specs/002-site-foundation/contracts/head-metadata.md):
  `User-agent: *`, `Allow: /`, blank line, `Sitemap: {origin}/sitemap-index.xml`, no `Disallow`
  line (FR-018, FR-019).
- [ ] T071 [P] [US4] Write a failing E2E test `tests/e2e/seo.spec.ts`: every built HTML page has a
  unique `<title>`, non-empty description, `noindex` robots meta, correct canonical/OG/twitter
  tags per contracts/head-metadata.md; `/sitemap-index.xml` lists the home page only (never
  `/404`); `/robots.txt`'s `Sitemap:` line uses the same resolved origin as the page canonicals;
  the not-found page has no canonical and no `og:url` (FR-017, FR-017a, FR-017b, FR-017c, FR-018,
  FR-019). Run it and confirm it fails.
- [ ] T072 [US4] Write `scripts/og-image/render.ts` (a one-off Playwright render of a small HTML
  template in the Flux colours: dusk background, rust name) and run it once to produce
  `public/og-default.png` (1200×630); commit the PNG (FR-017b, research R9).
- [ ] T073 [US4] Set `defaultImage: "/og-default.png"` and `defaultImageAlt: "Don Coleman"` in
  `src/config/site.ts` (already scaffolded in Phase 4) and confirm `Seo.astro`/`index.astro`/
  `404.astro` metadata pass T071; fix any mismatch.
- [ ] T074 [P] Write a failing E2E test `tests/e2e/headers.spec.ts` asserting every response served
  by `wrangler dev` — home, 404, `/robots.txt`, `/sitemap-index.xml`, and a static asset — carries
  the full FR-024 header set and the correct status code (FR-024, FR-024c). Run it and confirm it
  fails.
- [ ] T075 [P] [US6] Write a failing E2E test `tests/e2e/analytics.spec.ts` asserting: (a) the
  built CSP allows both Cloudflare Web Analytics hosts in `script-src`/`connect-src` (FR-024b);
  (b) injecting a simulated beacon `<script>` tag into a served page and aborting its request via
  `page.route` produces no page errors, no CSP violation, and navigation and the theme switch
  still work (FR-026); (c) after browsing several pages, `context.cookies()` is empty (SC-009,
  FR-025). Run it and confirm it fails.
- [ ] T076 Run `pnpm run build` then `pnpm exec vitest run tests/unit/site/csp.test.ts
  tests/unit/site/headers.test.ts tests/unit/site/sitemap.test.ts` and
  `pnpm exec playwright test tests/e2e/seo.spec.ts tests/e2e/headers.spec.ts
  tests/e2e/analytics.spec.ts --project=e2e` against `wrangler dev`; fix anything red before
  moving to Phase 9.

**Checkpoint**: US4 (found and shared well) and US6's functional half (statistics resilience,
zero cookies) are complete; every response meets the tightened security policy.

---

## Phase 9: CI verify — accessibility, performance budget & visual baselines

**Purpose**: Replace the two placeholder Playwright specs with the real accessibility, budget and
visual-baseline suites required by Principle I and FR-005a/FR-027; get `pnpm run verify` fully
green. This phase covers the rest of US3 (every change tested) together with the FR-005a/FR-005b
shell baselines that are part of US1's acceptance scenario 7.

- [ ] T077 Delete `tests/e2e/placeholder.a11y.spec.ts` and `tests/e2e/placeholder.budget.spec.ts`;
  note in the pull-request description which of their assertions carry forward unchanged into the
  new specs below, per FR-030a's rule that a successor keeps every assertion that still applies.
- [ ] T078 [P] [US3] Write `tests/e2e/a11y.spec.ts`: `@axe-core/playwright` with WCAG
  2.0/2.1/2.2 A+AA tags against the home and not-found templates, each at phone (390) and desktop
  (1280) widths, in dark and light themes, plus the mobile menu open, plus JavaScript disabled at
  phone width — asserting zero violations of any impact level in every case (FR-020, FR-020b,
  FR-022a, SC-002).
- [ ] T079 [P] [US3] Extend `tests/e2e/a11y.spec.ts` with a forced-colours run
  (`page.emulateMedia({ forcedColors: "active" })` or the browser-context equivalent) asserting
  focus outlines stay visible (`outline-style` not `none`, ≥ 2px) and links, the menu button and
  the theme switch remain identifiable (FR-020a).
- [ ] T080 [P] [US3] Extend `tests/e2e/a11y.spec.ts` with a reduced-motion run
  (`reducedMotion: "reduce"`) asserting computed transition/animation durations of `0` on the
  menu, the theme-affected elements and the switch, and `scroll-behavior: auto` (FR-021a).
- [ ] T081 Run `pnpm exec playwright test tests/e2e/a11y.spec.ts --project=a11y` against `wrangler
  dev`; fix any violation (contrast, landmark, heading, or motion) until every run is green,
  recording any further Flux colour-pairing change in `docs/design-source.md`'s "Accessibility
  adjustments" section (FR-001a, SC-002).
- [ ] T082 [P] [US3] Write `tests/e2e/budget.spec.ts`: for the home and not-found templates,
  independently, using CDP `Network.emulateNetworkConditions` (150 ms RTT, 1.6 Mbps down, 750 kbps
  up) and `Emulation.setCPUThrottlingRate(4)` at 390×844, assert LCP ≤ 2500 ms, CLS < 0.1, total
  long-task time ≤ 200 ms, JS transferred ≤ 10 KB, total transferred ≤ 100 KB, with no averaging
  across templates (FR-027, SC-004).
- [ ] T083 Run `pnpm exec playwright test tests/e2e/budget.spec.ts --project=budget`; trim inline
  script size or ported CSS/assets until both templates pass every threshold.
- [ ] T084 [P] [US1] Write `tests/e2e/visual.spec.ts`: `expect(locator).toHaveScreenshot()` for the
  header, the footer, the open mobile menu (phone width only — it does not exist at desktop), and
  the full not-found page, each at phone (390) and desktop (1280) widths, in dark and light themes
  (14 subjects), with `maxDiffPixelRatio: 0.001`, `animations: "disabled"`, and the caret hidden
  (FR-005a).
- [ ] T085 Run `pnpm run test:visual:update` on macOS to generate the 14 `-darwin` baseline images
  under `tests/e2e/**/*-snapshots/**`; review each image by eye and commit them (FR-005b).
- [ ] T086 Run `pnpm exec playwright test tests/e2e/visual.spec.ts --project=visual` to confirm the
  freshly-committed darwin baselines now pass with zero diff.
- [ ] T087 Run `pnpm run verify` end to end on a clean tree; fix anything red. Note in the PR
  description that CI's `linux` visual baselines will be missing on the first run by design
  (FR-005b) — the CI artifact must be downloaded, reviewed and committed before `verify` can pass
  on this branch in CI.

**Checkpoint**: `pnpm run verify` passes locally (darwin baselines); the CI run is expected to
still need its Linux baselines reviewed and committed once uploaded (handled in Phase 10).

---

## Phase 10: Polish & full verify

**Purpose**: Close out remaining requirement coverage, get CI green including its own baseline
set, and prepare the pull request for major-change review.

- [ ] T088 [P] Run `pnpm run typecheck` and `pnpm run lint` across the whole repository; fix any
  remaining strict-mode or lint error introduced by this feature.
- [ ] T089 Re-read `docs/design-source.md`'s "Accessibility adjustments" section against every
  shade change made in Phase 3 and Phase 9 (T025, T081) and confirm it is complete and accurate
  (FR-001a).
- [ ] T090 Walk every suffixed requirement added in the checklist-resolution pass — FR-001a,
  FR-005a, FR-005b, FR-007a, FR-008a, FR-010a, FR-012a, FR-017a, FR-017b, FR-017c, FR-020a,
  FR-020b, FR-021a, FR-022a, FR-024a, FR-024b, FR-024c, FR-027a, FR-030a — against the tests
  written in Phases 1–9 and confirm each has at least one assertion; add any missing test before
  continuing (constitution override on this pipeline run).
- [ ] T091 Push the branch, open the pull request, and once the `verify` check runs on GitHub
  Actions, download the Linux visual-baseline artifact with `gh run download <run-id>`, review the
  14 `-linux` images by eye, and commit them so CI's `visual` project passes on this branch
  (FR-005b, research R13).
- [ ] T092 Run `pnpm run verify` one more time locally, and confirm the pushed branch's `verify`
  check is green on GitHub Actions, before treating any task in this feature as done (Principle
  II — never mark done on a red suite).
- [ ] T093 Label the pull request `major-change` and write its description to include: the design
  deviations recorded in `docs/design-source.md` (if any), the reconciliation note on Workers
  Builds vs. the feature input's original GitHub Actions deploy description (plan.md "Deployment
  reconciliation"), and a checklist of the [PREVIEW-CHECK] items in Phase 11 that still need
  Don's confirmation before merge (Principle III, plan "Major-change verdict").
- [ ] T094 Run `pnpm run quickstart` steps 1–3 from
  [quickstart.md](../specs/002-site-foundation/quickstart.md) locally one final time (full local
  gate, look at it locally, compare with the reference screenshots) as a last self-check before
  asking Don to review the preview.

**Checkpoint**: the pull request is open, labelled `major-change`, `verify` is green both locally
and in CI, and every automated (non-preview) requirement in the spec has a passing test.

---

## Phase 11: Preview checks [PREVIEW-CHECK]

**Purpose**: Everything here needs the live preview, the Cloudflare dashboard, LinkedIn's Post
Inspector, Web Analytics, or Don's own judgement — none of it can be confirmed by a subagent
working only in the repository. These are the plan's build-order step 12 preconditions (a)–(d)
and the release-gate items from spec.md's [PREVIEW-CHECK] markers and SC-011(f).

- [ ] T095 [PREVIEW-CHECK] [US3] Don sets the Cloudflare Workers Builds non-production branch
  deploy command to `pnpm run deploy:preview` (Workers & Pages → `dcc-web` → Settings → Build; see
  `docs/setup.md` item 10, updated in T013) and confirms this pull request's preview build's
  canonical address equals the address it is actually served from (FR-017a, quickstart step 4.1).
- [ ] T096 [PREVIEW-CHECK] [US3] Run `pnpm setup:check --item workers-builds` and confirm it
  reports a successful preview build for this pull request (FR-031, quickstart step 4.6).
- [ ] T097 [PREVIEW-CHECK] [US3] Run `pnpm setup:check --item github-main-protection` and confirm
  it reports complete, verifying that `main`'s required `verify` check has no bypass on an
  up-to-date branch (FR-030a).
- [ ] T098 [PREVIEW-CHECK] [US4] Confirm the pull request's preview sends
  `X-Robots-Tag: noindex` on its served responses (FR-019).
- [ ] T099 [PREVIEW-CHECK] [US1] Don compares the pull request's preview against
  `tests/reference/ghost/` at phone and desktop widths in both themes, confirming colours,
  typography, spacing, header and footer match closely and no Ghost-only elements appear, then
  approves the `major-change`-labelled pull request (SC-001, SC-011(b), SC-011(d)).
- [ ] T100 [PREVIEW-CHECK] [US4] Run the preview's home page through LinkedIn's Post Inspector and
  confirm the title, description and image render correctly (US4 independent test, FR-017).
- [ ] T101 [PREVIEW-CHECK] [US3] After merge, confirm the main build at
  `https://new.doncoleman.ca` is live within about 10 minutes and its canonical uses
  `https://new.doncoleman.ca` (SC-007, SC-011(e)).
- [ ] T102 [PREVIEW-CHECK] [US6] After merge, confirm `https://new.doncoleman.ca` sends
  `X-Robots-Tag: noindex`, loads the edge-injected Cloudflare Web Analytics beacon with no CSP
  violation in the browser console, and the visit appears in the Web Analytics dashboard
  (FR-024b, FR-025).
- [ ] T103 [PREVIEW-CHECK] [US6] Run `pnpm setup:check --item review-address-noindex` and
  `pnpm setup:check --item web-analytics`; confirm both still report complete after merge
  (quickstart step 5).
- [ ] T104 [PREVIEW-CHECK] [US6] Browse a few pages on the live main build, then check DevTools →
  Application → Cookies and confirm zero cookies are set (SC-009).
- [ ] T105 [PREVIEW-CHECK] [US3] On a throwaway branch, deliberately break one assertion (for
  example change a navigation label), push it, and confirm the `verify` check fails, the merge
  button stays blocked, and nothing reaches `main` (SC-008, quickstart step 6).

**Done when**: every item in this phase is checked off, matching SC-011(f) ("every [PREVIEW-CHECK]
item in this spec is confirmed").

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies; start immediately.
- **Phase 2 (Design source + reference screenshots)**: depends on Phase 1 only for tooling
  scripts (`reference:capture`); the document itself has no code dependency. Must finish before
  any styling task (Phase 3+), per FR-032 and the plan's build order.
- **Phase 3 (Design tokens)**: depends on Phase 1 (Tailwind installed).
- **Phase 4 (Base layout, head metadata, theme script)**: depends on Phase 3 (global.css) and
  Phase 1 (`site` resolution for `Seo.astro`).
- **Phase 5 (Header/nav/menu)**: depends on Phase 4 (`BaseLayout`, placeholder `SiteHeader`).
- **Phase 6 (Footer/theme toggle/icons)**: depends on Phase 4 (placeholder `SiteFooter`, `theme.ts`
  stub from Phase 4's theme tasks) and can run its icon/footer-markup tasks in parallel with
  Phase 5, but the combined shell checkpoint (T059) needs both phases' components wired into
  `BaseLayout`.
- **Phase 7 (Not-found page)**: depends on Phase 6 (full `BaseLayout` with real header/footer) and
  Phase 1 (`not_found_handling`).
- **Phase 8 (Head metadata/sitemap/robots/security)**: depends on Phase 4 (`Seo.astro`), Phase 7
  (404 page needs `noindex`/no-canonical checked against something), and Phase 1 (sitemap
  integration, `_headers`).
- **Phase 9 (A11y/budget/visual)**: depends on every template existing (Phases 4–8), since it tests
  home and not-found together across every axis.
- **Phase 10 (Polish & full verify)**: depends on Phase 9 passing locally.
- **Phase 11 (Preview checks)**: depends on Phase 10's pull request being open and `verify` green.

### Within each phase

- Every test task precedes the implementation task it names; each phase ends with a task that runs
  that phase's own tests before the next phase starts.
- Tasks marked `[P]` touch different files and can run in parallel with other `[P]` tasks in the
  same phase; unmarked tasks depend on a preceding task in the same phase (usually the test they
  make pass, or a shared file another task also edits).

### Parallel opportunities

- Within Phase 1: T002, T003, T006, T008, T009 can run in parallel with each other (different
  files); T001 must finish before T023 (Phase 3) needs `global.css` to exist, but not before T002.
- Within Phase 2: T015 and T018 can run in parallel (different files/tools).
- Within Phase 4: T028/T030 (theme unit tests) can run in parallel with T032/T033/T034 (component
  tests) since they touch different files.
- Within Phase 5 and Phase 6: icon-porting tasks (T044, T051) can run in parallel with the test
  tasks in the same phase.
- Within Phase 9: T078, T082, T084 (the three new spec files) can be written in parallel; running
  them (T081, T083, T086) is sequential only because they share the same `wrangler dev` server and
  fixes may touch the same source files.

---

## Parallel Example: Phase 1

```bash
# Can be written/run together — different files, no shared dependency yet:
Task: "Add @astrojs/sitemap via `pnpm astro add sitemap` (T002)"
Task: "Write failing unit test tests/unit/site/config-files.test.ts for not_found_handling (T003)"
Task: "Update vitest.config.ts include for tests/component/**/*.test.ts (T006)"
Task: "Update .github/workflows/ci.yml to add the on-failure artifact upload step (T008)"
Task: "Write failing unit test tests/unit/site/site-origin.test.ts (T009)"
```

---

## Implementation Strategy

### Build order (why this feature is not organised by user story)

Every later user story sits visually and technically inside the shell Phases 3–6 build, and the
theme, metadata and security layers are ported once and shared by every page. Building "US1 only"
in isolation would mean re-doing the base layout, global styles and metadata scaffolding for each
later story. The plan's build order (design source → reference screenshots → tooling → design
tokens → shell → themes → not-found → SEO/security → verify hardening → preview checks) is
therefore used as the phase order, with each phase's story label(s) noted for traceability back to
spec.md.

### Incremental delivery checkpoints

1. Phase 1–2 complete → tooling ready, design source doc and Ghost references committed.
2. Phase 3–6 complete → **US1 and US2 fully functional and independently testable** (the closest
   thing to an MVP checkpoint for this feature, since there is no page content yet).
3. Phase 7 complete → US5 functional.
4. Phase 8 complete → US4 functional, US6's functional half in place.
5. Phase 9 complete → US3's remaining accessibility/budget/visual gate is green locally.
6. Phase 10 complete → pull request open, `major-change` labelled, CI green.
7. Phase 11 complete → SC-011's every condition holds; feature is done.

---

## Notes

- [P] tasks touch different files and have no unmet dependency within their phase.
- [USx] labels trace each task back to its user story in spec.md; cross-cutting infrastructure,
  security and polish tasks carry no story label.
- Every test task must be run and seen to fail before its paired implementation task starts
  (Constitution Principle I).
- No task is complete while its own phase's test run, or `pnpm run verify`, is red (Principle II).
- Commit after each task or small logical group; stop at any phase checkpoint to validate before
  continuing.
- Phase 11's [PREVIEW-CHECK] tasks cannot be completed by an implementing subagent alone — they
  need Don, the live preview, or an external tool, and are the last gate before SC-011 is fully
  satisfied.
