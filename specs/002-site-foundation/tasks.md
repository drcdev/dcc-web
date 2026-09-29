---

description: "Task list for site foundation for doncoleman.ca"
---

# Tasks: Site foundation for doncoleman.ca

**Input**: Design documents from `/specs/002-site-foundation/` (plan.md, spec.md, research.md,
data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md — all
present and read.

**Tests**: MANDATORY per Constitution Principle I (test-first, non-negotiable). Every test task is
ordered before every implementation task it covers, with the instruction: write the test, run it,
see it fail, then implement. No task is marked done on a red suite (Principle II); each phase ends
with a task that runs its own tests, and the final phases run `pnpm run verify`.

**Organization**: The constitution's build order (plan.md "Build order for the tasks phase")
overrides the default per-user-story phase grouping for this feature, because the shell, themes,
SEO and security layers are built incrementally on top of one another rather than as independent
vertical slices. Each phase still names which user story (`[USx]`) its tasks serve where a single
story applies; cross-cutting infrastructure, security and polish tasks carry no story label, as the
task-format rules specify for setup/foundational/polish work.

## Execution environment (read before starting any phase)

Each phase is written to be executed by a fresh subagent that has only this repository and the
artifacts in `specs/002-site-foundation/`. Before starting a phase, read `spec.md`, `plan.md`,
`research.md`, `data-model.md` and the contracts named in the phase's tasks, and confirm every
earlier phase's checkpoint holds (its end-of-phase test task passes).

- **E2E runner (applies to every Playwright run in every phase).** Playwright never runs against
  `astro dev` or `astro preview`. It runs against the production build served by Cloudflare's
  local runtime: first `pnpm run build` (writes `dist/`), then Playwright's `webServer` starts
  `pnpm exec wrangler dev --ip 127.0.0.1 --port 4321` (with `WRANGLER_SEND_METRICS=false`), which
  serves `dist/` with `public/_headers` and `not_found_handling` applied, at
  `http://127.0.0.1:4321`. Always rebuild before a Playwright run after changing anything under
  `src/`, `public/`, `astro.config.mjs` or `wrangler.jsonc`. All Playwright projects use Chromium
  and run with zero retries (FR-027, FR-027a). T018 makes this the configured behaviour; until
  T018 lands the old `astro preview` runner is still in place and no new E2E test is run.
- **Flux reference copy.** `.reference/flux` is gitignored, so a fresh checkout does not have it.
  Any task that reads Flux first runs, if the folder is missing,
  `gh repo clone drcdev/flux .reference/flux -- --depth 1` from the repository root. Treat it as
  read-only: read and port by hand, never import, bundle or copy it into the repository
  (FR-033). If it cannot be cloned, stop and report; do not guess the design (spec Assumptions).
- **Secrets.** No task adds a secret or variable to GitHub Actions, the repository or client
  code. Local credentials (`docs/setup.md` item 2) may be read by tools but their values are
  never printed, logged or committed.
- **[PREVIEW-CHECK] tasks** (Phase 11) need the live preview, the Cloudflare dashboard, Web
  Analytics, LinkedIn Post Inspector or Don's own eyes; an implementing subagent never marks them
  done.
- **Visual baselines** are per operating system (`-darwin`, `-linux`); a missing baseline fails
  the run (FR-005b).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unmet dependency on an incomplete task)
- **[USx]**: Maps to the user story of that ID in spec.md (US1 shell, US2 themes, US3 pipeline,
  US4 SEO/sharing, US5 not-found, US6 statistics, US7 design-source document)
- **[PREVIEW-CHECK]**: Needs the live preview, the Cloudflare dashboard, LinkedIn Post Inspector,
  Web Analytics, or Don's own eyes — collected in Phase 11, cannot be verified by an implementing
  subagent working locally
- File paths are exact and relative to the repository root

---

## Phase 1: Design source doc + reference screenshots

**Purpose**: FR-032 requires this document before any other implementation work, so this phase
comes first and changes no code or configuration; the Ghost
reference screenshots (FR-005) must exist before any styling task so Don has something to compare
against later. [US7] [US1]

- [X] T001 [P] [US7] Write a failing unit test `tests/unit/site/design-source.test.ts` asserting
  every requirement in
  [contracts/design-source-doc.md](../specs/002-site-foundation/contracts/design-source-doc.md):
  the five required headings, the `gh repo clone drcdev/flux .reference/flux -- --depth 1` command
  and "read-only"/"gitignored"/"never imported" language, all 18 mapping rows with every Flux name
  listed in the contract and an owner of Foundation, Pages, Blog, Portfolio, Contact or "Each
  feature", every "what doesn't carry over" item, every current-URL pattern and the words "no
  redirects"; plus that `.gitignore` contains `.reference/` and no file under `src/` contains the
  string `.reference` (FR-032, FR-033, SC-010). Run it and confirm it fails (the document does not
  exist yet).
- [X] T002 [US7] Write `docs/design-source.md` to satisfy T001: "How to get Flux", "Mapping"
  (18-row table, columns `Flux part | Becomes | Owner`, content from plan.md "Design source
  document (first task)", checked against `.reference/flux` — clone it first if missing, per the
  Execution environment section), "What doesn't carry over", "Current live URLs", and
  "Accessibility adjustments" (initially "None").
- [X] T003 Run `pnpm exec vitest run tests/unit/site/design-source.test.ts` and confirm it passes.
- [X] T004 [P] [US1] Write a failing unit test `tests/unit/site/reference-screenshots.test.ts`
  asserting `tests/reference/ghost/` holds exactly the 12 files
  `{home|post|about}-{phone|desktop}-{dark|light}.png`, each a valid PNG (signature check) whose
  IHDR width is 390 for `phone` and 1280 for `desktop`, and a `README.md` naming the capture date
  and the post URL used (FR-005). Run it and confirm it fails.
- [X] T005 [P] [US1] Write `tests/reference/playwright.config.ts`, a standalone Playwright config
  (not part of the `e2e`/`a11y`/`budget`/`visual` projects or `verify`) targeting
  `https://www.doncoleman.ca` (research R13).
- [X] T006 [US1] Write `tests/reference/capture-ghost.spec.ts`: for pages home (`/`), the first
  post linked from home (matched by `/(drift|convergence|news)/\d{4}/`), and `/about/`, at widths
  phone 390×844 and desktop 1280×800, in themes dark and light (set via
  `addInitScript(() => localStorage.setItem("color-theme", …))`), save full-page PNGs to
  `tests/reference/ghost/{page}-{phone|desktop}-{theme}.png` (12 files) (FR-005, research R13).
  If the live site is unreachable, the spec fails loudly rather than guessing (spec Assumptions).
- [X] T007 [US1] Run `pnpm exec playwright test --config tests/reference/playwright.config.ts`
  against the live site (the `reference:capture` package script that wraps this is added in
  Phase 2); write
  `tests/reference/ghost/README.md` recording the capture date and the post URL used; commit all
  12 PNGs plus the README (FR-005).
- [X] T008 Run `pnpm exec vitest run tests/unit/site/design-source.test.ts
  tests/unit/site/reference-screenshots.test.ts` and confirm both pass before moving to Phase 2.

**Checkpoint**: `docs/design-source.md` is committed and content-tested; the 12 Ghost reference
screenshots are committed and tested for Don's later by-eye comparison.

---

## Phase 2: Setup & dependencies

**Purpose**: Add the new tooling, wire the E2E server to `wrangler dev`, extend the `verify`
gate's configuration, and give every later phase a working `resolveSiteOrigin` so
`astro.config.mjs`'s `site` value is correct before any page is built. Tests T009–T014 are
written and seen failing before any implementation task T015–T025.

- [X] T009 [P] Extend `tests/unit/site/config-files.test.ts` with failing assertions (read each
  file as text or import it; do not start a server): `wrangler.jsonc` has
  `assets.not_found_handling === "404-page"` and still no `main` (FR-016, FR-023);
  `astro.config.mjs` sets no `adapter` and no `output: "server"` (FR-023); `playwright.config.ts`
  has `retries: 0`, `webServer.command` `pnpm exec wrangler dev --ip 127.0.0.1 --port 4321` with
  `env.WRANGLER_SEND_METRICS === "false"`, no `ASTRO_PREVIEW_BACKGROUND`, `baseURL`
  `http://127.0.0.1:4321`, exactly the projects `e2e`, `a11y`, `budget`, `visual` each using
  Chromium, `updateSnapshots: "none"` (a missing baseline fails, FR-005b), and
  `expect.toHaveScreenshot` defaults `maxDiffPixelRatio: 0.001`, `animations: "disabled"`,
  `caret: "hide"` (FR-005a); every existing `tests/e2e/*.spec.ts` file (including
  `placeholder.a11y.spec.ts` and `placeholder.budget.spec.ts`) is matched by exactly one project,
  so no check silently stops running (FR-030a); `vitest.config.ts` includes
  `tests/unit/**/*.test.ts` and `tests/component/**/*.test.ts`; `package.json` `scripts.verify`
  is exactly the sequence in
  [contracts/verify-gate.md](../specs/002-site-foundation/contracts/verify-gate.md)
  (`lint:secrets && lint && typecheck && test && build && test:e2e`), `test:e2e` runs all four
  projects, `test:a11y`/`test:budget`/`test:visual` each run one project, `test:visual:update`
  runs the `visual` project with `--update-snapshots`, `reference:capture` uses
  `tests/reference/playwright.config.ts`, and `deploy:preview` runs `scripts/deploy/preview.ts`;
  and `package.json` lists `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/typography` and
  `@astrojs/sitemap` (FR-027, FR-027a). Run it and confirm it fails.
- [X] T010 [P] Extend `tests/unit/ci/workflows.test.ts` with failing assertions that
  `.github/workflows/ci.yml` job `verify` still runs `pnpm run verify` after installing only
  Chromium, and has a step after it with `if: failure()` using `actions/upload-artifact` pinned to
  a 40-character SHA that uploads `playwright-report/`, `test-results/` and
  `tests/e2e/**/*-snapshots/**`; the existing "no secrets other than GITHUB_TOKEN" and "no
  continue-on-error" assertions stay (FR-005b, FR-027a, FR-031). Run it and confirm it fails.
- [X] T011 [P] Write a failing unit test `tests/unit/site/site-origin.test.ts` for
  `resolveSiteOrigin(env, config)` and `previewAlias(branch)` per
  [contracts/site-origin.md](../specs/002-site-foundation/contracts/site-origin.md) (every row of
  the resolution table, plus the `previewAlias` examples) (FR-017, FR-017a). Run it and confirm it
  fails (module does not exist yet).
- [X] T012 [P] Write a failing unit test `tests/unit/site/astro-config.test.ts` that sets
  `process.env` and re-imports `astro.config.mjs` (`vi.resetModules()` + dynamic import) and
  asserts: with no `WORKERS_CI`, `site` is `https://doncoleman.ca`; with `WORKERS_CI=1` and
  `WORKERS_CI_BRANCH=main`, `site` is `https://new.doncoleman.ca`; with `WORKERS_CI=1` and
  `WORKERS_CI_BRANCH=002-site-foundation`, `site` equals
  `resolveSiteOrigin(env, <setup/config.json>)`; `trailingSlash` is `"always"`; the
  `@astrojs/sitemap` integration is registered; the Tailwind Vite plugin is registered (FR-017,
  FR-017a, FR-018). Run it and confirm it fails.
- [X] T013 [P] Extend `tests/unit/setup/schemas.test.ts` with failing assertions that the
  setup-config schema in `scripts/setup-check/schemas.ts` accepts a config with no
  `workersSubdomain` and one with a valid lowercase DNS label, and rejects an empty or invalid
  one; the existing assertions stay (FR-017a, research R2). Run it and confirm it fails.
- [X] T014 [P] Write a failing unit test `tests/unit/site/deploy-preview.test.ts` for
  `scripts/deploy/preview.ts`: its exported `previewUploadArgs(env)` returns
  `["versions", "upload", "--preview-alias", "br-002-site-foundation"]` for
  `WORKERS_CI_BRANCH=002-site-foundation`, and throws an error with a plain-language message when
  `WORKERS_CI_BRANCH` is missing, is `main`, or yields a `null` alias; running the script as a
  child process with a missing branch exits non-zero without printing any environment values.
  Also assert that `docs/setup.md` section `{#workers-builds}` names `pnpm run deploy:preview` as
  the non-production branch deploy command and says the build and production deploy commands are
  unchanged (FR-017a, FR-028, FR-031). Run it and confirm it fails.
- [X] T015 Add Tailwind v4 with `pnpm astro add tailwind` (installs `tailwindcss` +
  `@tailwindcss/vite`, creates `src/styles/global.css`); add `@tailwindcss/typography` as a
  devDependency (research R3).
- [X] T016 Add the official sitemap integration with `pnpm astro add sitemap` (installs
  `@astrojs/sitemap`, registers it in `astro.config.mjs`) (FR-018, research R9).
- [X] T017 [P] Update `wrangler.jsonc` to add `"not_found_handling": "404-page"` inside the
  existing `assets` block (research R7) to pass T009's wrangler assertions.
- [X] T018 Update `playwright.config.ts` to pass T009: `webServer.command`
  `pnpm exec wrangler dev --ip 127.0.0.1 --port 4321`, `url`/`baseURL`
  `http://127.0.0.1:4321`, `env: { WRANGLER_SEND_METRICS: "false" }`, drop the
  `ASTRO_PREVIEW_BACKGROUND` workaround, `retries: 0`, `updateSnapshots: "none"`,
  `expect.toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: "disabled", caret: "hide" }`,
  and four Chromium projects — `a11y` (`testMatch: /a11y\.spec\.ts$/`), `budget`
  (`/budget\.spec\.ts$/`), `visual` (`/visual\.spec\.ts$/`), and `e2e` (every other
  `tests/e2e/*.spec.ts`, via `testIgnore` of the other three patterns) — so the two placeholder
  specs keep running in `a11y`/`budget` until their successors replace them in T039/T040
  (research R11, R14).
- [X] T019 [P] Update `vitest.config.ts` `test.include` to add `"tests/component/**/*.test.ts"`
  alongside `"tests/unit/**/*.test.ts"` (research R11).
- [X] T020 Extend `package.json` `scripts` per contracts/verify-gate.md to pass T009 (FR-027,
  FR-027a): `test` runs
  Vitest over unit + component tests, `test:e2e` runs all four Playwright projects, add
  `test:a11y`, `test:budget`, `test:visual`, `test:visual:update`, `reference:capture`,
  `deploy:preview`; `verify` stays
  `pnpm run lint:secrets && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build && pnpm run test:e2e`.
- [X] T021 [P] Update `.github/workflows/ci.yml` to pass T010: add a step after "Run the verify
  gate" with `if: failure()` that uploads `playwright-report/`, `test-results/` and
  `tests/e2e/**/*-snapshots/**` via a pinned-SHA `actions/upload-artifact` (research R14, R16; no
  new GitHub secrets or variables).
- [X] T022 Implement `src/lib/site-origin.ts` (`FALLBACK_ORIGIN`, `previewAlias`,
  `resolveSiteOrigin`) to pass T011 (research R2).
- [X] T023 Add the optional `workersSubdomain` field to the setup-config schema in
  `scripts/setup-check/schemas.ts` and the `SetupConfig` type in `scripts/setup-check/types.ts`
  to pass T013. Set its value in `setup/config.json` from the account's public `workers.dev`
  subdomain, read with the local read-only Cloudflare credentials (`docs/setup.md` item 2) or
  from any existing preview URL; never print the credential. If neither source is available,
  leave the field out (previews then use the fallback origin) and note it in the task's commit
  message so T099 has Don supply it (research R2).
- [X] T024 Update `astro.config.mjs` to pass T012: compute `site` with
  `resolveSiteOrigin(process.env, setupConfigJson)` (reading `setup/config.json` at build time),
  set `trailingSlash: "always"`, keep the `sitemap()` integration from T016 and the Tailwind Vite
  plugin from T015 (FR-017, FR-017a).
- [X] T025 Implement `scripts/deploy/preview.ts` (exports `previewUploadArgs`; when run, calls
  `pnpm exec wrangler` with those arguments, exiting non-zero with a plain message when the
  branch is missing, `main`, or its alias is `null`) and update `docs/setup.md` item 10 (Workers
  Builds) to document the one-time dashboard change — the non-production branch deploy command
  becomes `pnpm run deploy:preview` — leaving the build command and production deploy command
  unchanged and keeping the item's existing labelled parts so `tests/unit/setup/` stays green;
  pass T014 (research R2, quickstart step 4.1).
- [X] T026 Run `pnpm exec vitest run tests/unit/site tests/unit/setup tests/unit/ci`,
  `pnpm run lint` and `pnpm run typecheck`; then `pnpm run build && pnpm exec playwright test` to
  confirm the placeholder specs still pass under the new `wrangler dev` runner. Fix anything red
  before moving to Phase 3.

**Checkpoint**: dependencies installed, E2E server is `wrangler dev`, the `verify` sequence and
Playwright projects are configured and unit-tested, `resolveSiteOrigin` is tested and wired into
`astro.config.mjs`, `deploy:preview` exists and is tested.

---

## Phase 3: Design tokens & global styles

**Purpose**: Port Flux's design system into Tailwind tokens before any component uses them. [US1]

- [X] T027 [P] [US1] Write a failing unit test `tests/unit/site/design-tokens.test.ts` reading
  `src/styles/global.css` as text and asserting: for each of `dusk`, `rust`, `sage`, `lavender`,
  `mist`, `sand`, `mauve`, a `BASE` custom property plus all eleven shades (50–950) derived from
  it with `hsl(from var(--color-X-BASE) …)` (FR-001, FR-002); `--color-accent-BASE` equals
  `#d68844` with its own eleven derived shades (FR-003); `@custom-variant dark` and
  `@custom-variant js` are defined; `.prose-accent` heading colours (H1/H2 rust, H3 sage, H4
  lavender) and `.table-wrapper` rules exist (FR-001); an `a:focus-visible, button:focus-visible`
  rule with a solid outline of at least 2px, offset 2px, in the accent colour, and a
  `@media (forced-colors: active)` fallback using a system colour (FR-020a); `--font-body` and
  `--font-heading` are system font stacks, and the file has no `@font-face` and no `@import` or
  `url(` pointing at another host (FR-003). Run it and confirm it fails.
- [X] T028 [US1] Port the seven Flux `@theme` palettes from `.reference/flux/assets/css/screen.css`
  into `src/styles/global.css` by hand (never imported), keeping the
  `hsl(from var(--color-X-BASE) h s N%)` derivation so changing one `BASE` value updates the whole
  palette (FR-001, FR-002); add the fixed `accent-*` palette derived from `#d68844` (FR-003).
- [X] T029 [US1] Add `@custom-variant dark (&:where(.dark, .dark *));` and
  `@custom-variant js (&:where(.js, .js *));` to `src/styles/global.css` (research R3, R6).
- [X] T030 [US1] Port `.prose-accent` (with `@tailwindcss/typography` registered), heading colours
  (H1/H2 rust, H3 sage, H4 lavender, H5/H6), `.table-wrapper` rules, and the
  `a:focus-visible, button:focus-visible` focus ring — including the `forced-colors` fallback
  (`outline-color: CanvasText`) — into `src/styles/global.css`, as-is from Flux (FR-001,
  FR-020a). Port colour pairings unchanged here; any
  contrast adjustment is made in T087, driven by the failing accessibility spec (FR-001a).
- [X] T031 [US1] Add `--font-body` / `--font-heading` tokens set to Tailwind's default system font
  stack (no web fonts, no font service) and apply them to body and heading elements as Flux's two
  font rules do (FR-003).
- [X] T032 Run `pnpm exec vitest run tests/unit/site/design-tokens.test.ts` and
  `pnpm run typecheck`; fix anything red before moving to Phase 4.

**Checkpoint**: every palette is ported and unit-tested; global styles are ready for components to
consume.

---

## Phase 4: Gate specs, base layout, head metadata, theme script

**Purpose**: Write the accessibility, budget and visual-baseline suites (the successors of the
placeholder specs) and the build-environment test before any page template exists, then build the
document-level shell (landmarks, skip link, per-page metadata) and the pre-paint theme script,
with placeholder header/footer components that Phases 5–6 fill in. [US1] [US2] [US3]

- [X] T033 [P] [US2] Write a failing unit test `tests/unit/site/theme.test.ts` for `parseTheme`,
  `nextTheme` (`dark → light → system → dark`), and `isDark(choice, prefersDark)` per
  [contracts/theme.md](../specs/002-site-foundation/contracts/theme.md) and data-model.md
  `ThemeChoice` (FR-011, FR-012, FR-015). Run it and confirm it fails.
- [X] T034 [P] [US2] Write a failing unit test `tests/unit/site/theme-init.test.ts` for
  `src/scripts/theme-init.js` against a stubbed `document`/`localStorage`: adds `js` to `<html>`;
  sets/removes `dark` per the stored choice, resolving `system` via
  `matchMedia('(prefers-color-scheme: dark)')`; treats absence, a throwing `localStorage`, or an
  unrecognised value as `dark`; never throws; does not write storage on first visit; file size
  ≤ 1 KB and no network API used (FR-013, FR-015). Run it and confirm it fails.
- [X] T035 [P] [US1] Write a failing component test `tests/component/BaseLayout.test.ts` (Astro
  Container API, `renderToString`) asserting `<html lang="en" class="dark …">`, exactly one
  `<header>`, one `<nav aria-label="Main">`, one `<main id="main" tabindex="-1">`, one `<footer>`,
  exactly one `<h1>` with no skipped heading levels, the skip link as the first focusable
  element, no positive `tabindex` anywhere, and the inline theme-init script placed before the
  stylesheet link, per [contracts/shell-dom.md](../specs/002-site-foundation/contracts/shell-dom.md)
  and data-model.md (FR-010, FR-010a, FR-013, FR-020b). Run it and confirm it fails.
- [X] T036 [P] [US1] Write a failing component test `tests/component/SkipLink.test.ts` for
  `src/components/SkipLink.astro`: `<a href="#main">Skip to main content</a>`, visually hidden
  until focused (FR-010). Run it and confirm it fails.
- [X] T037 [P] [US4] Write a failing component test `tests/component/Seo.test.ts` for
  `src/components/Seo.astro` per
  [contracts/head-metadata.md](../specs/002-site-foundation/contracts/head-metadata.md): title
  format, description/canonical/robots `noindex`/OG/twitter tags, `og:type` `website`, defaults
  from `src/config/site.ts`, per-field overrides (overriding only the image keeps the default
  description), absolute image URL with alt text, canonical and `og:url` omitted when
  `canonical=false` (FR-017, FR-017b, FR-017c, FR-019). Run it and confirm it fails.
- [X] T038 [P] [US4] Write a failing test `tests/unit/site/build-env.test.ts` (Vitest, timeout
  ≥ 180 s) that runs `astro build` into two temporary `outDir`s — once with `WORKERS_CI=1`,
  `WORKERS_CI_BRANCH=main` and once with `WORKERS_CI=1`,
  `WORKERS_CI_BRANCH=002-site-foundation` — and for each build asserts: every HTML file has a
  `noindex` robots meta tag; the home page's canonical and `og:url` start with the origin
  `resolveSiteOrigin` returns for that environment and the committed `setup/config.json`; every
  absolute address in the build uses that one origin; `_headers` in the output carries
  `X-Robots-Tag: noindex` (FR-017a, FR-019: the main-branch build is checked the same way as a
  preview build). Temporary directories are removed afterwards. Run it and confirm it fails.
- [X] T039 [P] [US3] Write `tests/e2e/a11y.spec.ts`, the successor of
  `tests/e2e/placeholder.a11y.spec.ts`, and delete the placeholder in the same task.
  `@axe-core/playwright` with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`,
  `wcag22aa` against the home (`/`) and not-found (`/nope/`) templates, each at phone (390) and
  desktop (1280) widths, in dark and light themes, plus the mobile menu open at phone width, plus
  JavaScript disabled at phone width — asserting zero violations of any impact level in every
  case (FR-020, FR-020b, FR-022a, FR-027, SC-002). Carry forward every still-valid placeholder
  assertion, for both templates: exactly one `main`, exactly one `h1` and no skipped heading
  levels, non-empty title, `lang="en"`, no horizontal scroll at 320 CSS px and at 200% zoom
  (FR-020b, FR-021), readable with JavaScript disabled, and the first Tab stop has an accessible
  name and a visible focus style (now the skip link). Add: a forced-colours run
  (`forcedColors: "active"`) asserting focus outlines stay visible (`outline-style` not `none`,
  ≥ 2px) and links, the menu button and the theme switch remain visible (FR-020a); a
  reduced-motion run (`reducedMotion: "reduce"`) asserting computed transition and animation
  durations of `0` on the menu, the theme-affected elements and the switch, and
  `scroll-behavior: auto` (FR-021a); a WCAG 1.4.12 text-spacing override stylesheet at 320 px
  asserting no horizontal scroll and no clipped navigation link (FR-020). Deliberately dropped
  placeholder assertions (they contradict this feature's spec): "no non-text content" and "first
  Tab stop is the link to the current site"; list them for the PR description (T097, FR-030a).
  Run `pnpm run build && pnpm exec playwright test --project=a11y` and confirm it fails.
- [X] T040 [P] [US3] Write `tests/e2e/budget.spec.ts`, the successor of
  `tests/e2e/placeholder.budget.spec.ts`, and delete the placeholder in the same task: for the
  home and not-found templates, independently, using CDP `Network.emulateNetworkConditions`
  (150 ms RTT, 1.6 Mbps down, 750 kbps up) and `Emulation.setCPUThrottlingRate(4)` at 390×844,
  assert LCP ≤ 2500 ms, CLS < 0.1, total long-task time ≤ 200 ms, JS transferred ≤ 10 KB, total
  transferred ≤ 100 KB, with no averaging across templates (FR-027, SC-004). Carry forward
  "readable with JavaScript disabled", "has a noindex robots meta tag" and `lang="en"` for both
  templates. Deliberately dropped (superseded by the spec's budget): "zero `<script>` elements",
  "CLS exactly 0" and "total under 30 KB"; list them for the PR description (T097, FR-030a). Run
  `pnpm exec playwright test --project=budget` and confirm it fails.
- [X] T041 [P] [US1] Write `tests/e2e/visual.spec.ts`: `expect(locator).toHaveScreenshot()` for
  the header, the footer and the full not-found page at phone (390) and desktop (1280) widths, and
  the open mobile menu at phone width only, each in dark and light themes (14 images), using the
  config defaults from T018 (`maxDiffPixelRatio: 0.001`, animations disabled, caret hidden)
  (FR-005a). Run `pnpm exec playwright test --project=visual` and confirm it fails (no baselines
  exist; `updateSnapshots: "none"` makes a missing baseline a failure, FR-005b).
- [X] T042 [US2] Implement `src/lib/theme.ts` (`parseTheme`, `nextTheme`, `isDark`) to pass T033.
- [X] T043 [US2] Implement `src/scripts/theme-init.js` (plain JS, ≤ 1 KB, no network access) to
  pass T034 (research R5).
- [X] T044 [US1] [US4] Implement `src/config/site.ts` (`SiteConfig`: `name`, `defaultDescription`,
  `defaultImage`, `defaultImageAlt`, `locale: "en_CA"`, `indexable: false`, `copyrightName`) per
  data-model.md `SiteConfig`, then implement `src/components/Seo.astro` to pass T037.
- [X] T045 [US1] Implement `src/components/SkipLink.astro` to pass T036.
- [X] T046 [P] [US1] Create minimal placeholder `src/components/SiteHeader.astro` (a bare
  `<header>` landmark containing `<nav aria-label="Main">`) and `src/components/SiteFooter.astro`
  (a bare `<footer>` landmark) so `BaseLayout` can compose them now; Phase 5 and Phase 6 replace
  their contents.
- [X] T047 [US1] Implement `src/layouts/BaseLayout.astro`: `<html lang="en" class="dark
  motion-safe:scroll-smooth">`, imports `src/styles/global.css`, renders the inline
  `theme-init.js` script (via `?raw`) before the stylesheet link, renders `<Seo />`, `<SkipLink
  />`, `<SiteHeader />`, `<main id="main" tabindex="-1">` with a slot, `<SiteFooter />` — to pass
  T035 (FR-013, FR-021).
- [X] T048 Replace `src/pages/index.astro` with a minimal placeholder home page that uses
  `BaseLayout` and has one `<h1>` (FR-020b, FR-023; spec Assumptions: real content is a later
  feature); run
  T038 and make it pass.
- [X] T049 Run `pnpm exec vitest run tests/unit/site/theme.test.ts tests/unit/site/theme-init.test.ts
  tests/unit/site/build-env.test.ts tests/component/BaseLayout.test.ts
  tests/component/SkipLink.test.ts tests/component/Seo.test.ts` and `pnpm run typecheck`; fix
  anything red before moving to Phase 5. The `a11y`, `budget` and `visual` projects written in
  T039–T041 are expected to stay red until Phase 9 (they need the full shell and the not-found
  page); they are not run in Phases 5–8.

**Checkpoint**: every page has one set of landmarks, a language attribute, a skip link, and
site-wide metadata; the pre-paint theme script applies the stored choice (dark by default) before
first paint; the toggle comes in Phase 6. The gate specs for accessibility, budget and visual
baselines exist and fail.

---

## Phase 5: Header, navigation & mobile menu

**Purpose**: Replace the header placeholder with the real site name, seven-link navigation and
progressively-enhanced mobile menu. [US1]

- [X] T050 [P] [US1] Write a failing unit test `tests/unit/site/navigation.test.ts` for
  `src/config/navigation.ts` (primary items Home/Services/Speaking/Writing/Projects/About/Contact
  in order, footer items, social items, `futureDestinations`) and `src/lib/nav.ts`
  `isCurrent(pathname, href)` (trailing-slash normalised, `/` matches only `/`) per data-model.md
  `NavigationItem` (FR-006, FR-009). Run it and confirm it fails.
- [X] T051 [P] [US1] Write a failing component test `tests/component/SiteHeader.test.ts` per
  [contracts/shell-dom.md](../specs/002-site-foundation/contracts/shell-dom.md): site name link
  text `Don Coleman` / `href="/"`; the seven primary links in order inside one `<ul
  id="primary-nav-list">` within `<nav aria-label="Main">`; current-page link has
  `aria-current="page"` plus a non-colour visible style difference (for example an underline
  class); menu button `<button type="button" aria-controls="primary-nav-list"
  aria-expanded="false">` named `Menu` with a decorative (`aria-hidden="true"`) icon; no
  search/Subscribe/Sign-in/Account/portal markup (FR-004, FR-006, FR-007a, FR-008a, FR-009). Run
  it and confirm it fails.
- [X] T052 [P] [US1] Write a failing E2E test `tests/e2e/menu.spec.ts` covering every row of the
  mobile-menu behaviour table in contracts/shell-dom.md (page load, activate, activate again
  keeps focus on the button, Escape returns focus to the button, choosing a link closes it, click
  outside closes it, Tab or Shift+Tab out of the nav closes it, resizing to ≥ 48rem resets to
  closed and moves focus to the first nav link if it was on the now-hidden button, Tab past the
  last link does not trap focus), and a failing E2E test `tests/e2e/no-js.spec.ts` asserting that
  with JavaScript disabled, on home and not-found at 390 and 1280 px: the navigation renders as a
  plain wrapping `<ul>` inside the "Main" nav landmark with no visible menu button and no theme
  switch; every navigation link is reachable with Tab and activates with Enter; the page is dark;
  header, main content and footer are readable; and the served HTML's `<script>` elements are
  only the inline theme-init script and Astro-bundled same-origin module scripts, none with a
  third-party `src` (FR-007, FR-007a, FR-013, FR-022, FR-022a). Run both and confirm they fail.
- [X] T053 [P] [US1] Write a failing E2E test `tests/e2e/shell.spec.ts` (header part) asserting on
  home and not-found: the header (site name, seven links in order) appears identically;
  current-page marking on `/`; the skip link is the first Tab stop, becomes visible when focused
  and hides again on blur, and activating it moves focus to `<main>` so the next Tab reaches the
  first focusable element after the header; Tab and Shift+Tab walk skip link → site name → (menu
  button, phone width with JS only) → the seven nav links in order, with a visible focus outline
  at every stop; each header link activates with Enter and the menu button with Enter and Space;
  a known future destination (for example `/services/`) is an ordinary link that loads the
  not-found page; no horizontal scroll at 320 px, including with a very long page title (FR-006,
  FR-009, FR-010, FR-010a, FR-021, SC-005). Run it and confirm it fails.
- [X] T054 [US1] Implement `src/config/navigation.ts` to pass T050 (research R4): primary `Home /`,
  `Services /services/`, `Speaking /speaking/`, `Writing /writing/`, `Projects /projects/`, `About
  /about/`, `Contact /contact/`; footer `/privacy-policy/`, `/terms-of-use/`, `/technology/`;
  social `https://github.com/drcdev`, `https://www.linkedin.com/in/drcdev`; `futureDestinations`
  exporting every internal href no page builds yet.
- [X] T055 [US1] Implement `src/lib/nav.ts` (`isCurrent`) to pass T050.
- [X] T056 [P] [US1] Port `src/icons/menu.svg` from `.reference/flux/partials/Icons/*` as an Astro
  SVG component, decorative (`aria-hidden="true"`) (research R15); covered by T051.
- [X] T057 [US1] Implement `src/components/SiteHeader.astro` markup (no script yet) to pass T051.
- [X] T058 [US1] Add the bundled menu script to `src/components/SiteHeader.astro`: toggles
  `aria-expanded`/visibility, closes on Escape (focus returns to the button), on choosing a link,
  on outside click, and on focus leaving the nav; a `matchMedia('(min-width: 48rem)')` listener
  resets state to closed on crossing the breakpoint; all transitions wrapped in `motion-safe:`
  (research R6) — to pass T052 and the header part of T053.
- [X] T059 Run `pnpm exec vitest run tests/unit/site/navigation.test.ts
  tests/component/SiteHeader.test.ts`, then `pnpm run build && pnpm exec playwright test
  tests/e2e/menu.spec.ts tests/e2e/no-js.spec.ts tests/e2e/shell.spec.ts --project=e2e`; fix
  anything red before moving to Phase 6.

**Checkpoint**: header, navigation and the mobile menu meet FR-006/FR-007/FR-007a/FR-009 on every
page.

---

## Phase 6: Footer, theme toggle & icons

**Purpose**: Replace the footer placeholder with the real links, copyright and theme switch,
completing US1 and delivering US2 (dark/light/system without a flash). [US1] [US2]

- [X] T060 [P] [US1] Write a failing component test `tests/component/SiteFooter.test.ts` per
  contracts/shell-dom.md: links to `/privacy-policy/`, `/terms-of-use/`, `/technology/`; social
  links to `https://github.com/drcdev` (name "GitHub") and
  `https://www.linkedin.com/in/drcdev` (name "LinkedIn") with decorative (`aria-hidden="true"`)
  icons; copyright text `© {build year} Don Coleman. All rights reserved.`; the theme switch
  present; no Facebook/X/portal links (FR-004, FR-008, FR-008a). Run it and confirm it fails.
- [X] T061 [P] [US2] Write a failing component test `tests/component/ThemeToggle.test.ts` per
  [contracts/theme.md](../specs/002-site-foundation/contracts/theme.md): visible label `Theme:`
  then a `<button type="button">`; accessible name `Theme: Dark` / `Theme: Light` / `Theme: Match
  device`; decorative icons; a visually hidden `aria-live="polite"` region; hidden when
  JavaScript is off (FR-008a, FR-012, FR-012a). Run it and confirm it fails.
- [X] T062 [P] [US2] Write a failing E2E test `tests/e2e/theme.spec.ts` implementing the
  first-paint guarantee (SC-003) from contracts/theme.md: for each stored value (`dark`, `light`,
  `system` with the device set to light and to dark, absent, `garbage`), across first load,
  reload, following an in-site link, and back/forward navigation, at least 5 loads each, record
  `<html>`'s `dark` class via a `MutationObserver` at the moment `<body>` is inserted and assert
  it matches the expected theme every time. Also assert: the toggle cycles dark → light → system
  → dark with click, Enter and Space, one step per activation, keeping keyboard focus on the same
  (updated, not replaced) button; the accessible name and the polite live region announce each
  new choice; on load the switch shows the stored choice, including "Match device"; in `system`
  mode a device theme change is followed within 500 ms with no reload, and a second page opened
  in the background shows the current device setting when brought to the front; in `dark` or
  `light` mode a device change does not change the theme; with `localStorage` throwing on
  write, the switch still changes the current page with no page error and the next load uses the
  stored value or dark; with `localStorage` throwing on read, the page is dark with no error
  (FR-011, FR-012, FR-012a, FR-013, FR-014, FR-015). Run it and confirm it fails.
- [X] T063 [P] [US1] Extend `tests/e2e/shell.spec.ts` with failing footer assertions on home and
  not-found: footer links (`/privacy-policy/`, `/terms-of-use/`, `/technology/`, GitHub,
  LinkedIn) and the copyright line with the build year are present; Tab continues from main
  content through the footer's links and then the theme switch in visual order, and Shift+Tab
  walks back; every footer link activates with Enter and the theme switch with Enter and Space;
  visible focus at every stop; no keyboard trap anywhere on the page (FR-008, FR-010a, SC-005).
  Run it and confirm it fails.
- [X] T064 [P] [US1] Port `src/icons/sun.svg`, `src/icons/moon.svg`, `src/icons/github.svg`, and
  `src/icons/linkedin.svg` from `.reference/flux/partials/Icons/*`, keeping `fill="none"
  stroke="currentColor"` (research R15); decorative, `aria-hidden="true"`; covered by T060/T061.
- [X] T065 [US1] Implement `src/components/SiteFooter.astro` using `src/config/navigation.ts`'s
  footer/social items to pass T060.
- [X] T066 [US2] Implement `src/components/ThemeToggle.astro` (uses `src/lib/theme.ts` helpers; a
  bundled script cycles `dark → light → system → dark` on activation, applies the class
  immediately, writes `localStorage["color-theme"]` wrapped in `try` (FR-015), announces the
  change via the live region, and — in `system` mode — re-applies the theme on a `matchMedia`
  change and on `visibilitychange` without reload (FR-014)) to pass T061.
- [X] T067 Wire `ThemeToggle` into `SiteFooter.astro`, confirm `BaseLayout.astro` composes the
  now-complete `SiteHeader`/`SiteFooter`, and fix any wiring between `theme-init.js` and
  `ThemeToggle.astro` until T062 and T063 pass (FR-012, FR-013, SC-003).
- [X] T068 Run `pnpm exec vitest run tests/component/SiteFooter.test.ts
  tests/component/ThemeToggle.test.ts` and `pnpm run build && pnpm exec playwright test
  tests/e2e/shell.spec.ts tests/e2e/menu.spec.ts tests/e2e/no-js.spec.ts tests/e2e/theme.spec.ts
  --project=e2e`; fix anything red — this is the checkpoint for both US1 and US2 together.

**Checkpoint**: US1 (recognisable shell) and US2 (theme without a flash) are both fully functional
and independently testable per their spec.md acceptance scenarios.

---

## Phase 7: Not-found page

**Purpose**: Deliver a helpful, correctly-statused not-found page inside the full shell. [US5]

- [X] T069 [P] [US5] Write a failing component test `tests/component/NotFound.test.ts` (Container
  API) for `src/pages/404.astro`: renders the full shell (skip link, header, footer), exactly one
  `<h1>` "Page not found", a plain-language explanation that mentions older blog addresses have
  moved, a link to the home page and the main navigation, a title, description, sharing title,
  description and image, `noindex`, and no `canonical`/`og:url` (FR-016, FR-017c). Run it and
  confirm it fails.
- [X] T070 [P] [US5] Write a failing E2E test `tests/e2e/not-found.spec.ts` with separate tests
  for status and content: requesting `/drift/2025/x/`, `/convergence/`, `/news/`, `/topic/x/`,
  `/author/x/`, and each entry of `futureDestinations` (for example `/services/`,
  `/privacy-policy/`) returns HTTP 404; separately, each shows the not-found page body with the
  header and footer, in the visitor's currently-chosen theme (set a stored `light` choice and
  confirm the 404 renders light); and built addresses (`/`, `/robots.txt` once it exists) return
  200 (FR-006, FR-016). Run it and confirm it fails.
- [X] T071 [US5] Implement `src/pages/404.astro` using `BaseLayout`, `Seo` with `canonical={false}`
  to pass T069 and T070 (research R7).
- [X] T072 Run `pnpm run build`, then `pnpm exec vitest run tests/component/NotFound.test.ts` and
  `pnpm exec playwright test tests/e2e/not-found.spec.ts --project=e2e`; also set the not-found
  entry's `built` flag to `true` in `tests/e2e/templates.ts` (Phase 5 marked the not-found cases
  of `shell.spec.ts` and `no-js.spec.ts` as `fixme` until the page exists) and run
  `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/no-js.spec.ts --project=e2e`;
  fix anything red before moving to Phase 8.

**Checkpoint**: every unknown address, including retired blog addresses and not-yet-built nav
destinations, serves a 404 with the not-found page in the site's design (US5 independent test).

---

## Phase 8: Head metadata, sitemap, robots.txt & security headers

**Purpose**: Finish per-page search/sharing metadata and the sitemap (US4), and lock down security
headers, CSP and statistics resilience (US6, and the FR-024 series with no dedicated story). Tests
T073–T079 are written and seen failing before implementation tasks T080–T085.

- [x] T073 [P] Write a failing unit test `tests/unit/site/csp.test.ts` asserting the
  `astro.config.mjs` `security.csp` configuration matches
  [contracts/http-responses.md](../specs/002-site-foundation/contracts/http-responses.md)'s "Meta
  CSP on every HTML page" table: required directives present, the `theme-init.js` SHA-256 hash
  present in `script-src`, `https://static.cloudflareinsights.com` in `script-src`,
  `https://cloudflareinsights.com` in `connect-src`, and none of `unsafe-inline`, `unsafe-eval`,
  `web3forms`, `jsdelivr`, `supabase`, or a bare `https:` source anywhere, and no development-only
  source (FR-024a, FR-024b, FR-024c). In the same file, assert no file under `src/` or `public/`
  contains Web Analytics code or a token (`beacon.min.js`, `data-cf-beacon`,
  `cloudflareinsights.com/cdn-cgi`) (FR-025). Run it and confirm it fails.
- [x] T074 [P] Extend `tests/unit/site/headers.test.ts` (existing file) asserting the `/*` rule in
  `public/_headers` carries the full FR-024 header set — `Content-Security-Policy:
  frame-ancestors 'none'; object-src 'none'; base-uri 'self'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(),
  microphone=(), geolocation=(), payment=(), usb=()`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000` —
  alongside the existing `X-Robots-Tag: noindex`, and that no rule ever sets `Set-Cookie`
  (FR-019, FR-024). Run it and confirm it fails.
- [x] T075 [P] Write a failing unit test `tests/unit/site/sitemap.test.ts` asserting the
  `@astrojs/sitemap` `filter` excludes any page whose pathname starts with `/404`, and that the
  configured `site` is used for its entries (FR-018). Run it and confirm it fails.
- [x] T076 [P] [US4] Write a failing E2E test `tests/e2e/seo.spec.ts`: every built public HTML
  page has a unique `<title>`, non-empty description, `noindex` robots meta, correct
  canonical/OG/twitter tags per contracts/head-metadata.md with `og:type` `website`; page
  addresses end with `/` and appear identically in canonical, `og:url` and sitemap entries;
  `og:image` is an absolute same-origin URL with alt text, and fetching it returns a PNG whose
  IHDR is 1200×630; `/sitemap-index.xml` lists exactly the set of built public pages (the home
  page only, never `/404`); `/robots.txt` is `User-agent: *`, `Allow: /`, no `Disallow`, and a
  `Sitemap:` line using the same resolved origin as the page canonicals; the not-found page has
  a title, description, sharing image and `noindex`, but no canonical and no `og:url` (FR-017,
  FR-017a, FR-017b, FR-017c, FR-018, FR-019, SC-006). Run it and confirm it fails.
- [x] T077 [P] [US4] Extend `tests/unit/site/build-env.test.ts` (T038) so both builds also assert
  that `robots.txt`'s `Sitemap:` line and every sitemap entry use that build's resolved origin
  (FR-017a, FR-018). Run it and confirm it fails.
- [x] T078 [P] Write a failing E2E test `tests/e2e/headers.spec.ts` asserting every response
  served by `wrangler dev` — home, a 404 address, `/robots.txt`, `/sitemap-index.xml`, and a
  static asset — carries the full FR-024 header set including `X-Robots-Tag: noindex` and no
  `Set-Cookie`, with the correct status code (200 or 404), and that every HTML page carries the
  meta CSP from contracts/http-responses.md (FR-019, FR-024, FR-024a, FR-024c). Run it and
  confirm it fails.
- [x] T079 [P] [US6] Write a failing E2E test `tests/e2e/analytics.spec.ts` asserting: (a) the
  built CSP allows both Cloudflare Web Analytics hosts in `script-src`/`connect-src`, and a
  served page with a simulated beacon `<script src="https://static.cloudflareinsights.com/…">`
  injected (response fulfilled by `page.route`) loads with no CSP violation (FR-024b); (b) with
  the beacon request aborted via `page.route`, pages load, navigation and the theme switch still
  work, and there are no page errors (FR-026); (c) after browsing several pages,
  `context.cookies()` is empty (SC-009, FR-025). Run it and confirm it fails.
- [x] T080 Configure `security.csp` in `astro.config.mjs` (research R8: computed hash of
  `src/scripts/theme-init.js`, `scriptDirective`/`styleDirective` resources, the fixed
  `directives` list) to pass T073.
- [x] T081 Extend `public/_headers` `/*` rule with the full FR-024 header set (keeping
  `X-Robots-Tag: noindex`) to pass T074 (research R8).
- [x] T082 Configure the sitemap `filter` in `astro.config.mjs` to pass T075 (research R9).
- [x] T083 [US4] Implement `src/pages/robots.txt.ts` as a prerendered static endpoint per
  [contracts/head-metadata.md](../specs/002-site-foundation/contracts/head-metadata.md):
  `User-agent: *`, `Allow: /`, blank line, `Sitemap: {origin}/sitemap-index.xml`, no `Disallow`
  line (FR-018, FR-019).
- [x] T084 [US4] Write `scripts/og-image/render.ts` (a one-off Playwright render of a small HTML
  template in the Flux colours: dusk background, rust name) and run it once to produce
  `public/og-default.png` (1200×630); commit the PNG (FR-017b, research R9).
- [x] T085 [US4] Set `defaultImage: "/og-default.png"` and `defaultImageAlt: "Don Coleman"` in
  `src/config/site.ts` (already scaffolded in Phase 4) and fix any mismatch in
  `Seo.astro`/`index.astro`/`404.astro` until T076 and T077 pass.
- [x] T086 Run `pnpm run build` then `pnpm exec vitest run tests/unit/site/csp.test.ts
  tests/unit/site/headers.test.ts tests/unit/site/sitemap.test.ts
  tests/unit/site/build-env.test.ts` and `pnpm exec playwright test tests/e2e/seo.spec.ts
  tests/e2e/headers.spec.ts tests/e2e/analytics.spec.ts tests/e2e/not-found.spec.ts
  --project=e2e`; fix anything red before moving to Phase 9.

**Checkpoint**: US4 (found and shared well) and US6's functional half (statistics resilience,
zero cookies, no analytics code) are complete; every response meets the tightened security policy.

---

## Phase 9: CI verify — accessibility, performance budget & visual baselines green

**Purpose**: Make the accessibility, budget and visual-baseline suites written in Phase 4 pass
against the finished templates, and get `pnpm run verify` fully green. This phase completes US3
(every change tested) together with the FR-005a/FR-005b shell baselines that are part of US1's
acceptance scenario 7. No assertion written in T039–T041 may be loosened here; a genuinely wrong
assertion is fixed only with a matching spec change (FR-030a).

- [X] T087 Run `pnpm run build && pnpm exec playwright test --project=a11y`; fix any violation
  (contrast, landmark, heading, reflow, forced colours or motion) in the source until every run is
  green, recording every Flux colour-pairing change in `docs/design-source.md`'s
  "Accessibility adjustments" section with the pairing, its failing ratio and the replacement
  shade — replacing only the failing utility with the nearest passing shade of the same palette
  and leaving the palette tokens unchanged (FR-001a, SC-002).
- [X] T088 Run `pnpm exec playwright test --project=budget`; trim inline script size or ported
  CSS/assets until both templates pass every threshold (SC-004).
- [X] T089 Run `pnpm run test:visual:update` on macOS to generate the 14 `-darwin` baseline images
  under `tests/e2e/visual.spec.ts-snapshots/`; review each image by eye against
  `tests/reference/ghost/` and commit them (FR-005a, FR-005b).
- [X] T090 Run `pnpm exec playwright test --project=visual` to confirm the freshly-committed darwin
  baselines now pass with zero diff.
- [X] T091 Run `pnpm run verify` end to end on a clean tree; fix anything red. CI's `-linux`
  visual baselines will be missing on the first CI run by design (FR-005b); they are handled in
  T095.

**Checkpoint**: `pnpm run verify` passes locally (darwin baselines); the CI run is expected to
still need its Linux baselines reviewed and committed once uploaded (handled in Phase 10).

---

## Phase 10: Polish & full verify

**Purpose**: Close out remaining requirement coverage, get CI green including its own baseline
set, and prepare the pull request for major-change review.

- [X] T092 [P] Run `pnpm run typecheck` and `pnpm run lint` across the whole repository; fix any
  remaining strict-mode or lint error introduced by this feature.
- [X] T093 Re-read `docs/design-source.md`'s "Accessibility adjustments" section against every
  shade change made in Phase 9 (T087) and confirm each entry names the pairing,
  its failing ratio and the replacement shade (FR-001a).
- [X] T094 Walk the "Requirement coverage" table at the end of this file against the tests
  actually written in Phases 1–9 and confirm every FR and SC listed has at least one passing
  assertion (or, for [PREVIEW-CHECK] items, a Phase 11 task); add any missing test, seen failing
  first, before continuing.
- [x] T095 Push the branch, open the pull request as the `drc-agents` machine account. The
  `verify` check's `playwright-output` failure artifact does not carry the 14 `-linux` images
  because `updateSnapshots: "none"` (FR-005b) stops Playwright writing actual images on a
  missing-baseline failure — so generate them with a dedicated workflow instead:
  `.github/workflows/visual-baselines.yml` (`workflow_dispatch` plus a labeled `pull_request`
  trigger, job-guarded to only run on dispatch or the `visual-baselines` label, same
  checkout/pnpm/Node/Playwright setup as `ci.yml`, SHA-pinned actions). `workflow_dispatch` only
  registers once the workflow file exists on the default branch, so on this PR branch trigger it
  by adding the `visual-baselines` label to the pull request instead (remove and re-add to run
  again); once the file is on `main`, `gh workflow run visual-baselines.yml --ref <branch>` also
  works. Either way, wait for the run, download its `visual-baselines-linux` artifact with
  `gh run download <run-id>`, review the 14 `-linux` images by eye, and commit them so CI's
  `visual` project passes on this branch (FR-005b, research R13). The workflow only builds and
  regenerates snapshots; it never commits or pushes itself — committing stays a reviewed,
  human-approved step.
- [ ] T096 Run `pnpm run verify` one more time locally, and confirm the pushed branch's `verify`
  check is green on GitHub Actions, before treating any task in this feature as done (Principle
  II — never mark done on a red suite).
  - Local half done 2026-09-29: `pnpm run verify` green (Vitest 670/670 in 54 files; Playwright
    196/196: e2e 138, a11y 36, budget 8, visual 14 darwin). CI half pending T095.
- [x] T097 Label the pull request `major-change` and write its description to include: the design
  deviations recorded in `docs/design-source.md` (if any); the reconciliation note on Workers
  Builds vs. the feature input's original GitHub Actions deploy description (plan.md "Deployment
  reconciliation"); the placeholder-spec successors — which assertions carried forward and which
  were dropped, with reasons (T039, T040; FR-030a); and a checklist of the [PREVIEW-CHECK] items
  in Phase 11 that still need Don's confirmation before merge (Principle III, plan "Major-change
  verdict").
- [X] T098 Follow steps 1–3 of [quickstart.md](../specs/002-site-foundation/quickstart.md)
  locally one final time (full local gate, look at it locally, compare with the reference
  screenshots) as a last self-check before asking Don to review the preview.

**Checkpoint**: the pull request is open, labelled `major-change`, `verify` is green both locally
and in CI, and every automated (non-preview) requirement in the spec has a passing test.

---

## Phase 11: Preview checks [PREVIEW-CHECK]

**Purpose**: Everything here needs the live preview, the Cloudflare dashboard, LinkedIn's Post
Inspector, Web Analytics, or Don's own judgement — none of it can be confirmed by a subagent
working only in the repository. These are the plan's build-order step 12 preconditions (a)–(d)
and the release-gate items from spec.md's [PREVIEW-CHECK] markers and SC-011(f).

- [ ] T099 [PREVIEW-CHECK] [US3] Don sets the Cloudflare Workers Builds non-production branch
  deploy command to `pnpm run deploy:preview` (Workers & Pages → `dcc-web` → Settings → Build; see
  `docs/setup.md` item 10, updated in T025), confirms `setup/config.json` has the correct
  `workersSubdomain` (supplying it if T023 could not), and confirms this pull request's preview
  build's canonical, `og:url` and `robots.txt` `Sitemap:` line equal the address it is actually
  served from (FR-017a, FR-028, quickstart steps 4.1–4.4).
- [ ] T100 [PREVIEW-CHECK] [US3] Run `pnpm setup:check --item workers-builds` and confirm it
  reports a successful preview build for this pull request, available within 10 minutes of the
  push; run `pnpm setup:check --item pipeline-secrets` and confirm GitHub Actions still has no
  secrets or variables (FR-028, FR-031, SC-007, quickstart step 4.6).
- [ ] T101 [PREVIEW-CHECK] [US3] Run `pnpm setup:check --item github-main-protection` and confirm
  it reports complete, verifying that `main`'s required `verify` check has no bypass on an
  up-to-date branch (FR-029, FR-030, FR-030a).
- [ ] T102 [PREVIEW-CHECK] [US4] Confirm the pull request's preview sends
  `X-Robots-Tag: noindex` on its served responses (FR-019).
- [ ] T103 [PREVIEW-CHECK] [US1] Don compares the pull request's preview against
  `tests/reference/ghost/` at phone and desktop widths in both themes, confirming colours,
  typography, spacing, header and footer match closely and no Ghost-only elements appear; walks
  the preview with the keyboard only (spec Assumptions); reviews each entry in
  `docs/design-source.md`'s "Accessibility adjustments" (FR-001a); then approves the
  `major-change`-labelled pull request (SC-001, SC-011(b), SC-011(d)).
- [ ] T104 [PREVIEW-CHECK] [US4] Run the preview's home page through LinkedIn's Post Inspector and
  confirm the title, description and image render correctly (US4 independent test, FR-017).
- [ ] T105 [PREVIEW-CHECK] [US3] After merge, confirm the main build at
  `https://new.doncoleman.ca` is live within 10 minutes of the merge commit and its canonical
  uses `https://new.doncoleman.ca` (FR-029, SC-007, SC-011(e)).
- [ ] T106 [PREVIEW-CHECK] [US6] After merge, confirm `https://new.doncoleman.ca` sends
  `X-Robots-Tag: noindex`, loads the edge-injected Cloudflare Web Analytics beacon with no CSP
  violation in the browser console, and the visit appears in the Web Analytics dashboard, while
  a visit to the preview does not (FR-019, FR-024b, FR-025).
- [ ] T107 [PREVIEW-CHECK] [US6] Run `pnpm setup:check --item review-address-noindex` and
  `pnpm setup:check --item web-analytics`; confirm both still report complete after merge
  (quickstart step 5).
- [ ] T108 [PREVIEW-CHECK] [US6] Browse a few pages on the live main build, then check DevTools →
  Application → Cookies and confirm zero cookies are set (SC-009).
- [ ] T109 [PREVIEW-CHECK] [US3] On a throwaway branch, deliberately break one assertion (for
  example change a navigation label), push it, and confirm the `verify` check fails, the merge
  button stays blocked, and nothing reaches `main` (FR-030, SC-008, quickstart step 6).

**Done when**: every item in this phase is checked off, matching SC-011(f) ("every [PREVIEW-CHECK]
item in this spec is confirmed").

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Design source + reference screenshots)**: no dependencies; start immediately. It
  comes first because FR-032 requires the design source document before any other
  implementation work, and FR-005 requires the reference screenshots before any styling. It uses
  only tools already installed (Vitest, Playwright).
- **Phase 2 (Setup)**: depends on Phase 1.
- **Phase 3 (Design tokens)**: depends on Phase 2 (Tailwind installed) and Phase 1 (reference
  screenshots exist before styling).
- **Phase 4 (Gate specs, base layout, head metadata, theme script)**: depends on Phase 3
  (global.css) and Phase 2 (`site` resolution, Playwright projects).
- **Phase 5 (Header/nav/menu)**: depends on Phase 4 (`BaseLayout`, placeholder `SiteHeader`).
- **Phase 6 (Footer/theme toggle/icons)**: depends on Phase 5 (the footer part of
  `shell.spec.ts` extends the header part, and the combined shell checkpoint T068 needs both
  phases' components wired into `BaseLayout`).
- **Phase 7 (Not-found page)**: depends on Phase 6 (full `BaseLayout` with real header/footer) and
  Phase 2 (`not_found_handling`).
- **Phase 8 (Head metadata/sitemap/robots/security)**: depends on Phase 4 (`Seo.astro`,
  `build-env.test.ts`), Phase 7 (404 page), and Phase 2 (sitemap integration, `_headers`).
- **Phase 9 (A11y/budget/visual green)**: depends on every template existing (Phases 4–8).
- **Phase 10 (Polish & full verify)**: depends on Phase 9 passing locally.
- **Phase 11 (Preview checks)**: depends on Phase 10's pull request being open and `verify` green.

### Within each phase

- Every test task precedes every implementation task it covers; each phase ends with a task that
  runs that phase's own tests before the next phase starts.
- Tasks marked `[P]` touch different files and can run in parallel with other `[P]` tasks in the
  same phase; unmarked tasks depend on a preceding task in the same phase (usually the test they
  make pass, or a shared file another task also edits).

### Parallel opportunities

- Within Phase 1: T001 and T004/T005 can run in parallel (different files/tools).
- Within Phase 2: the test tasks T009–T014 can be written in parallel (different files); T017,
  T019 and T021 can run in parallel once the tests exist.
- Within Phase 4: T033–T041 (all test files) can be written in parallel.
- Within Phases 5, 6 and 8: every test task can be written in parallel; icon-porting tasks (T056,
  T064) can run in parallel with them.

---

## Parallel Example: Phase 2

```bash
# Can be written together — different files, no shared dependency yet:
Task: "Extend tests/unit/site/config-files.test.ts for wrangler, playwright, vitest, package.json (T009)"
Task: "Extend tests/unit/ci/workflows.test.ts for the on-failure artifact upload step (T010)"
Task: "Write failing unit test tests/unit/site/site-origin.test.ts (T011)"
Task: "Write failing unit test tests/unit/site/astro-config.test.ts (T012)"
Task: "Extend tests/unit/setup/schemas.test.ts for workersSubdomain (T013)"
Task: "Write failing unit test tests/unit/site/deploy-preview.test.ts (T014)"
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
spec.md. The gate specs for accessibility, budget and visual baselines are written in Phase 4,
before any template, so they are seen failing before the implementation they cover.

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

## Requirement coverage

Every functional requirement and success criterion in spec.md, with the tasks that test (T) and
build (B) it. `PC` marks a [PREVIEW-CHECK] task.

| Req | Tests | Build / confirm |
|---|---|---|
| FR-001 | T027, T039 | T028, T030 |
| FR-001a | T039 | T087, T093, T103 (PC) |
| FR-002 | T027 | T028 |
| FR-003 | T027 | T028, T031 |
| FR-004 | T051, T060 | T057, T065 |
| FR-005 | T004 | T005, T006, T007 |
| FR-005a | T009, T041 | T018, T089, T090 |
| FR-005b | T009, T010, T041 | T018, T021, T089, T095 |
| FR-006 | T050, T051, T053, T070 | T054, T057 |
| FR-007 | T052 | T058 |
| FR-007a | T051, T052 | T057, T058 |
| FR-008 | T060, T063 | T064, T065 |
| FR-008a | T051, T060, T061 | T057, T065, T066 |
| FR-009 | T050, T051, T053 | T055, T057 |
| FR-010 | T035, T036, T053 | T045, T047 |
| FR-010a | T035, T053, T063 | T047, T057, T067 |
| FR-011 | T033, T062 | T042, T043 |
| FR-012 | T033, T061, T062 | T066 |
| FR-012a | T061, T062 | T066 |
| FR-013 | T034, T035, T052, T062 | T043, T047 |
| FR-014 | T062 | T066 |
| FR-015 | T033, T034, T062 | T042, T043, T066 |
| FR-016 | T009, T069, T070 | T017, T071 |
| FR-017 | T011, T012, T037, T076 | T022, T024, T044, T085, T104 (PC) |
| FR-017a | T011, T012, T014, T038, T076, T077 | T022, T023, T024, T025, T099 (PC) |
| FR-017b | T037, T076 | T044, T084, T085 |
| FR-017c | T037, T069, T076 | T044, T071 |
| FR-018 | T012, T075, T076, T077 | T016, T082, T083 |
| FR-019 | T037, T038, T074, T076, T078 | T044, T081, T083, T102 (PC), T106 (PC) |
| FR-020 | T039 | T087 |
| FR-020a | T027, T039, T053 | T030, T087 |
| FR-020b | T035, T039 | T047, T087 |
| FR-021 | T039, T053 | T047, T087 |
| FR-021a | T039 | T058, T066, T087 |
| FR-022 | T034, T052 | T043, T058, T066 |
| FR-022a | T039, T052 | T057, T087 |
| FR-023 | T009 | T017, T083 |
| FR-024 | T074, T078 | T081 |
| FR-024a | T073, T078 | T080 |
| FR-024b | T073, T079 | T080, T106 (PC) |
| FR-024c | T073, T074, T078 | T080, T081 |
| FR-025 | T073, T079 | T106 (PC), T107 (PC), T108 (PC) |
| FR-026 | T079 | T080 |
| FR-027 | T009, T039, T040, T041 | T018, T020, T087, T088, T091 |
| FR-027a | T009, T010 | T018, T020, T021 |
| FR-028 | T014 | T025, T099 (PC), T100 (PC) |
| FR-029 | — | T101 (PC), T105 (PC) |
| FR-030 | T009 (no orphaned spec) | T101 (PC), T109 (PC) |
| FR-030a | T009, T039, T040 | T097, T101 (PC) |
| FR-031 | T010, T014 | T025, T100 (PC) |
| FR-032 | T001 | T002 |
| FR-033 | T001 | T002 |
| SC-001 | T041 | T089, T090, T103 (PC) |
| SC-002 | T039 | T087 |
| SC-003 | T062 | T067 |
| SC-004 | T040 | T088 |
| SC-005 | T053, T063 | T058, T067 |
| SC-006 | T076 | T085 |
| SC-007 | — | T100 (PC), T105 (PC) |
| SC-008 | — | T109 (PC) |
| SC-009 | T079 | T108 (PC) |
| SC-010 | T001 | T002 |
| SC-011 | — | T096, T097, T099–T109 (PC) |

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
