---

description: "Task list for the portfolio (projects index and story pages)"
---

# Tasks: The portfolio

**Input**: Design documents in `specs/009-portfolio/` (plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/, checklists/)

**Prerequisites**: plan.md, spec.md, `.specify/memory/constitution.md` (Principle I overrides the template: tests are mandatory and come first)

**Tests**: MANDATORY (Constitution Principle I). Every story has unit/schema, component, Playwright E2E (default, reduced-motion and JavaScript-disabled runs) and accessibility tasks as plan.md "Test strategy" requires. Within a phase, every **Test** task comes BEFORE the implementation it covers: write it, run it, see it fail for the right reason, then implement until it passes.

**Organization**: Grouped by user story (US1..US9, priorities from spec.md). Phases are sized for one agent run each; every phase ends with the suite green (`corepack pnpm exec vitest run` plus any Playwright project touched).

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[US#]**: user story from spec.md (setup, foundational and polish tasks carry none)
- **Test**: a test task. **[PREVIEW-CHECK]** suffix: cannot be verified locally, needs the preview deployment or Don's eyes (leave unchecked, record in the PR body)

## Local toolchain (read before running anything)

- Node comes from nvm. Run `node -v`; it must show the `.nvmrc` major (the current shell already does). If not, `source ~/.nvm/nvm.sh && nvm use` in the SAME Bash command as the toolchain call.
- In this worktree use `corepack pnpm` (not bare `pnpm`) for every package command.
- macOS has no `timeout`. Bound long runs: `perl -e 'alarm N; exec @ARGV' <cmd...>`.
- `pnpm run verify` in an agent shell needs `ASTRO_PREVIEW_BACKGROUND=1` (the full gate takes about 8 minutes; parallel worktrees collide on port 4321, so rerun when idle on spurious ECONNREFUSED).
- Copy `.reference/flux` into the worktree if missing (real directory of symlinks). The prototype to port is at commit `1f35eae` (`src/prototypes/portfolio/c/*`, `shared/*`, `filter.ts`, `contact-link.ts`).
- The changed-paths drift guard rejects `specs/` path literals in tests; do not reference `specs/009-portfolio` from test files.
- Consult the Astro Docs MCP (`astro-docs`) before each Astro API use; research.md names the page per decision.
- Shared files with the parallel blog feature (keep both sides on any conflict): `src/content.config.ts`, `src/config/navigation.ts`, `src/lib/nav.ts`, `src/lib/build-mode.ts`, `src/components/Pill.astro`, `tests/e2e/templates.ts`, `tests/e2e/visual.spec.ts`, `tests/build/fixture-site.ts`, `scripts/build-fixture-site.ts`, `playwright.config.ts`, `docs/pages.md`, `docs/design-source.md`, `src/pages/[...slug].astro`.

## Phase 1: Foundations (shared pure logic, no UI)

**Purpose**: the small pure modules everything else imports. Nothing user-visible changes.

- [ ] T001 [P] Test: `tests/unit/content/build-mode.test.ts` for `isProductionBuild(env)` (true only when `WORKERS_CI==="1"` and `WORKERS_CI_BRANCH==="main"`; false locally, in tests, on other branches, with missing vars). Shared file note: if `src/lib/build-mode.ts` already exists from the blog, extend its tests instead.
- [ ] T002 [P] Test: `tests/unit/content/themes.test.ts` for `themeKey`, `themesOf` (dedupe variants such as "AI integration" and "ai  integration", first spelling as label, stable sort by label), `parseThemeParam` (known, unknown, missing, mixed case, `%20`), and `matches`.
- [ ] T003 [P] Test: `tests/unit/content/contact-link.test.ts` for `contactHref(slug)` (`/contact/?project=<slug>`, rejects slugs not matching `^[a-z0-9-]{1,64}$`) and `tests/unit/content/stages.test.ts` for the seven stages, their ids, order and headings (data-model.md "Stage and Chapter").
- [ ] T004 [P] Test: `tests/unit/content/project-address.test.ts` for slug from file name (`^[a-z0-9-]{1,64}$`, message "lower-case letters, digits and hyphens"), `.md`/`.mdx` twin clash, nested file, and `projectFileError` / `projectFilesError` message shape (`Project file <path>: <problem>`).
- [ ] T005 Implement `src/lib/build-mode.ts` (`isProductionBuild`), making T001 pass.
- [ ] T006 [P] Implement `src/lib/content/themes.ts` (`themeKey`, `themesOf`, `parseThemeParam`, `matches`), making T002 pass.
- [ ] T007 [P] Implement `src/lib/content/contact-link.ts` and `src/lib/content/stages.ts`, making T003 pass.
- [ ] T008 [P] Implement `src/lib/content/project-address.ts` and add `projectFileError` / `projectFilesError` to `src/lib/content/errors.ts`, making T004 pass.
- [ ] T009 Run `corepack pnpm exec vitest run tests/unit`, `corepack pnpm run lint` and the type check; confirm green.

**Checkpoint**: pure logic done and unit-tested.

## Phase 2: Project schema and collection (US7 core, P1)

**Goal**: a project file is validated by a strict schema in a new `projects` collection.

**Independent test**: a valid fixture parses; each schema-level broken fixture fails with the file and setting named.

- [ ] T010 [P] [US7] Test: `tests/unit/content/project-schema.test.ts` covering data-model.md: required settings, optional settings, unknown and wrongly typed settings (strict), status set, `problem` one sentence and at most 140 characters, 1 to 4 themes with no duplicates after normalising, demo on `drc.dev` over HTTPS (accepts `https://drc.dev/…` and `https://x.drc.dev/…`; rejects `http://`, `drc.dev.example.com`, `evildrc.dev`, `https://drc.dev@example.com/`, a port and a user-info part, FR-042), stand-in and source HTTPS, `order` rejects 0, negative and non-whole values (FR-016), demo and stand-in not both, comparison rules (at least one option and constraint, exactly one chosen, chosen has a reason, no reason on an unchosen option, unique option and constraint ids, fit for every constraint and no extra fit ids), visual kinds with required alt/description, visual name pattern, clip fields, no clip as the index visual, reserved visual name `demo` (FR-073 as amended).
- [ ] T011 [P] [US7] Test: `tests/unit/content/project-order.test.ts` for `getPublishedProjects` ordering (order ascending with defined first, then date descending, then title) and draft filtering by `isProductionBuild`.
- [ ] T012 [US7] Implement `src/content/schemas/project.ts` (`projectSchema({ image })`, strict Zod via `astro/zod`, `superRefine` invariants), making T010 pass.
- [ ] T013 [US7] Add the `projects` collection to `src/content.config.ts` (glob loader over `src/content/projects/*.mdx`, `generateId` enforcing file-name rules and image existence like `pages`, schema from T012; shared file: keep the blog's collections and export all). Add `src/content/projects/images/.gitkeep`.
- [ ] T014 [US7] Implement `src/lib/projects.ts` (`getPublishedProjects`, ordering, file names), making T011 pass.
- [ ] T015 [P] [US7] Create fixture project files in `tests/fixtures/projects/` (valid minimal, valid every-setting, draft) and extend `tests/build/fixture-site.ts` and `scripts/build-fixture-site.ts` to copy fixture projects and their images into `src/content/projects/` of the fixture site (shared files: keep both copies).
- [ ] T016 [US7] Run unit tests, `corepack pnpm exec astro check` and lint; confirm `corepack pnpm run build` still succeeds with an empty collection.

**Checkpoint**: collection and schema in place, no pages yet.

## Phase 3: Story building blocks (US8 part 1, supports US1 and US3)

**Goal**: `Pill`, `StatusPill`, `ThemePills`, `Chapter`, `Visual`, `Demo` (link forms) and `Invitation` exist and are tested through the Container API.

**Independent test**: each component renders the DOM in contracts/pages-dom.md.

- [ ] T017 [P] [US8] Test: `tests/component/project/Pill.test.ts`, `StatusPill.test.ts`, `ThemePills.test.ts` (plain label pill with a tone, optional `href`, status shown as text, theme list `aria-label="Themes"`; FR-017 single pill style).
- [ ] T018 [P] [US8] Test: `tests/component/project/Chapter.test.ts` (`section` with `id`, `aria-labelledby`, "Chapter N of 7", one `h2` with `data-reveal`, visual/no-visual layout hooks, `draft` mark "Draft for review", `data-stage`).
- [ ] T019 [P] [US8] Test: `tests/component/project/Visual.test.ts` (image with `alt`; diagram with reachable visible description and `aria-describedby`; clip `<video controls muted playsinline preload="none" poster>` with no `autoplay` and a visible description; placeholder shows a visible "Placeholder" mark; first visual eager, others `loading="lazy"`).
- [ ] T020 [P] [US3] Test: `tests/component/project/Invitation.test.ts` (href `/contact/?project=<slug>`, accessible name includes the title, plain link, no script) and `tests/component/project/Demo.test.ts` link forms (open-demo link text, stand-in link with "This is not a live demo.", source-code link "Source code for <title>", all same-tab with no `target`).
- [ ] T021 [P] [US8] Test: `tests/unit/content/project-blocks.test.ts` for the block registry (`storyBlockNames` is the closed set Chapter, Visual, OptionComparison, Demo, Invitation) and the prop schemas in `blocks/schemas.ts`.
- [ ] T022 [US8] Implement `src/components/Pill.astro` (shared; if the blog's version exists, keep it and add `tone`/`href`), `src/components/project/StatusPill.astro` and `ThemePills.astro`, making T017 pass.
- [ ] T023 [US8] Implement `src/components/project/blocks/{schemas.ts,index.ts,Chapter.astro,Visual.astro}` and the start of `src/components/project/portfolio.css` (tokens only, ported from the Direction C prototype), making T018, T019 and T021 pass.
- [ ] T024 [US3] Implement `src/components/project/blocks/Invitation.astro` and the link forms of `Demo.astro` (embed comes in Phase 8), making T020 pass.
- [ ] T025 Run `corepack pnpm exec vitest run tests/component tests/unit`, lint and `astro check`; confirm green.

**Checkpoint**: blocks render in isolation.

## Phase 4: Option comparison and body validation (US2, US7)

**Goal**: the comparison table renders accessibly and the seven-chapter body check works.

**Independent test**: component tests plus body-check unit tests pass; the comparison is a labelled, keyboard-reachable table with the chosen option in text.

- [ ] T026 [P] [US2] Test: `tests/component/project/OptionComparison.test.ts` (data table, `<caption>`, `th scope="col"` per option and `scope="row"` per constraint, region with `tabindex="0"` and accessible name, "Chosen" in text plus `data-chosen`, reason paragraph, fit as text with the decorative mark `aria-hidden`, "In its favour" and "Against it" rows only when some option has them, empty cell for a missing list, constraint detail as small text).
- [ ] T027 [P] [US7] Test: `tests/unit/content/project-body.test.ts` for `validateProjectBody()` (seven chapters in order; missing, repeated and out-of-order; unknown block such as `<Timeline>`; unknown visual name; `visual="demo"` without `demo.embed`; OptionComparison once and only in the options chapter; Invitation once and only in the invitation chapter; Demo at most once, only in built, required when demo/standIn/source is set; no `#` or `##` headings; body image without alt; code fences ignored; every error names the file).
- [ ] T028 [P] [US2] Test: extend `tests/unit/content/project-schema.test.ts` for rows 12 to 15 and 31 of contracts/build-errors.md (exactly one chosen, chosen reason, fit gaps, empty comparison) and fix the schema if any fails.
- [ ] T029 [US2] Implement `src/components/project/blocks/OptionComparison.astro` (register it) and its CSS in `portfolio.css` (scroll inside the region, forced-colours-safe chosen mark), making T026 pass.
- [ ] T030 [US7] Implement `src/lib/content/project-body.ts` (`validateProjectBody`, same pattern as `validatePageBody`), making T027 pass; it is wired into the story route in Phase 5.
- [ ] T031 Run unit and component suites, lint and `astro check`; confirm green.

**Checkpoint**: comparison and body check ready for the story page.

## Phase 5: Story page and Focus Pocus (US1, US3, US9)

**Goal**: `/projects/focus-pocus/` renders the seven-chapter story from the real project file.

**Independent test**: build and open the story: header, "In this story" list, seven chapters in order, comparison, stand-in link, invitation link to `/contact/?project=focus-pocus`.

- [ ] T032 [P] [US1] Test: `tests/component/project/StoryHeader.test.ts` (one `h1` with title, problem line, status pill, theme pills, "In this story" `nav` with an ordered list of seven in-page links, draft mark only for non-production drafts), `ReadingProgress.test.ts` (`aria-hidden="true"`, no text) and `DraftMark.test.ts`.
- [ ] T033 [P] [US1] Test: `tests/build/project-story.test.ts` on the fixture site: a valid every-setting fixture builds `/projects/<slug>/` with `h1`, seven `h2`, ids `problem` to `invitation`, chapter numbers, no page script beyond the shell, title/description/canonical/sharing metadata from the project (FR-080), and the build fails for an invalid body.
- [ ] T034 [P] [US9] Test: `tests/build/focus-pocus.test.ts` (real site build): `focus-pocus.mdx` exists with `draft: false`, every draft chapter carries `<Chapter draft>`, every placeholder visual has `placeholder: true`, stand-in address set, JXA-behind-MCP option chosen, all seven chapters present, and no file under `src/components`, `src/layouts`, `src/pages`, `src/lib`, `src/styles` or `astro.config.mjs` names `focus-pocus` (FR-082).
- [ ] T035 [P] [US3] Test: `tests/e2e/projects.spec.ts` (story part, fails until built): status 200; seven chapters in order; "In this story" links jump to each chapter; comparison region reachable by keyboard; invitation goes to `/contact/?project=focus-pocus` and the contact form shows "About: focus-pocus"; invitation sets no cookie and makes no request to a new origin (FR-053).
- [ ] T036 [US1] Implement `src/components/project/{StoryHeader,ReadingProgress,DraftMark}.astro`, making T032 pass.
- [ ] T037 [US1] Implement `src/layouts/ProjectLayout.astro` and `src/pages/projects/[slug].astro` (`getStaticPaths` over `getPublishedProjects(process.env)`, `<Content components={storyBlockComponents} />`, body check from T030, per-project SEO and sharing image resized with `getImage()`, draft notice in non-production). Run `validateProjectBody` over every collection entry, drafts included, before filtering drafts out (FR-073), so a production build fails on a broken draft. Leave `futureDestinations` and `src/lib/content/address.ts` unchanged here: `/projects/` stays reserved until the index lands in Phase 6 (T046), and the route's `/projects/` prefix claim already blocks page files there.
- [ ] T038 [US9] Write `src/content/projects/focus-pocus.mdx` (draft copy from public sources, chapter headings from `stages.ts`, `<Chapter draft>` on every chapter, options comparison, `standIn`, `source`) and its images in `src/content/projects/images/focus-pocus/` (index visual, screenshot placeholders with `placeholder: true`, `architecture.svg` diagram with description), per contracts/project-file.md.
- [ ] T039 [US1] Extend `src/components/project/portfolio.css` for the story layout (chapter grid, visual beside text at wide widths, header, "In this story", typography from existing tokens; static final state, motion comes in Phase 7), making T033 to T035 pass.
- [ ] T040 Run `corepack pnpm run build`, `corepack pnpm exec vitest run` and the `e2e` Playwright project for `tests/e2e/projects.spec.ts`; fix until green.

**Checkpoint**: MVP story page working with real content.

## Phase 6: Projects index, filter and navigation (US4)

**Goal**: `/projects/` lists projects in ruled two-column rows, filterable by theme, and Projects is live in navigation.

**Independent test**: follow Projects in the header, see one row per project, filter by theme, clear, reload with `?theme=`.

- [ ] T041 [P] [US4] Test: `tests/unit/site/navigation.test.ts` (update: `futureDestinations` no longer contains `/projects/` and `/projects/` is a live entry) and `tests/unit/site/nav.test.ts` for `isCurrent` (exact and section-level, so `/projects/<slug>/` marks Projects current; `/projects-old/` does not). In the same test task, before any implementation (FR-081): add `/projects/` and `/projects/focus-pocus/` to `tests/e2e/templates.ts`; drop `/projects/` from `NOT_BUILT` in `tests/e2e/pages.spec.ts` and require `/projects/` and every story page to answer 200; update any `tests/build/*` assertion that treats `/projects/` as reserved; add a unit case in the address tests that a page file at `projects/x.md` fails against the `src/pages/projects/[slug].astro` route claim. Shared files `src/config/navigation.ts`, `src/lib/nav.ts`, `tests/e2e/templates.ts`.
- [ ] T042 [P] [US4] Test: `tests/component/project/ProjectRow.test.ts` (two-column hooks, single link named by the title and the only link, problem, status, themes, visual with alt, view-transition name `project-<slug>` on the title, draft mark), `ProjectFilter.test.ts` (all projects in HTML, controls/status/empty message `hidden`, one button per theme, group named "Filter by theme", `data-total`) and `EmptyProjects.test.ts` ("No projects are published yet.").
- [ ] T043 [P] [US4] Test: `tests/unit/content/filter-logic.test.ts` covering the behaviour table in contracts/filter-island.md at the pure-function level (status text singular/plural, unknown-theme text that never contains the `?theme=` value, URL update value, a `?theme=` value carrying markup such as `<img src=x onerror=…>` treated as unknown and never returned as markup, FR-014).
- [ ] T044 [P] [US4] Test: extend `tests/e2e/projects.spec.ts` (index part): status 200; header Projects link `aria-current="page"` on the index and on a story; two-column row at 1280 px and single column at 390 px; no horizontal scroll from 320 px; row link opens the story; back from a story restores the index with `?theme=`; the header's Projects link always opens the unfiltered `/projects/`.
- [ ] T045 [P] [US4] Test: `tests/e2e/projects-fixtures.spec.ts` on the fixture site (port 4322; add it to the 4322 project's `testMatch` in `playwright.config.ts` as one alternation, shared file): multi-row index, filter by theme with announced count, clear ("All projects" and "Show all projects"), `?theme=` reload and share, unknown theme message with kept address, theme variants collapse to one button, focus stays on the pressed button, targets at least 24x24 px, buttons wrap with many themes and no horizontal scroll at 320 px, status announced once per change; changing the filter twice then pressing Back leaves the index (replaceState, no history entries, FR-014); an unknown `?theme=` carrying markup renders no element from it and is not repeated in the message.
- [ ] T046 [US4] Implement `src/config/navigation.ts` (remove `"/projects/"` from `futureDestinations`, leaving `"/writing/"` unless the blog has already removed it; keep the export and comment) and `src/lib/nav.ts` (section-level current), making T041 pass (the not-found spec derives its list from `futureDestinations`, so it follows automatically).
- [ ] T047 [US4] Implement `src/components/project/{ProjectRow,EmptyProjects}.astro`, the pure filter logic (in `src/lib/content/themes.ts`), and `src/components/project/ProjectFilter.astro` (custom element island, processed script, `data-ready`, `history.replaceState`, polite status), making T042 and T043 pass.
- [ ] T048 [US4] Implement `src/pages/projects/index.astro` (h1 "Projects", one plain line, list or empty message, SEO title and description) and index CSS in `portfolio.css` (ruled rows, Direction A two-column split at 64rem and above), making T044 and T045 pass.
- [ ] T049 [US4] Run `corepack pnpm run build`; run the `e2e` and `sections` Playwright projects and `corepack pnpm exec vitest run`; confirm green, including existing shell, menu and header tests with the new nav entry.

**Checkpoint**: index and story both reachable from the header.

## Phase 7: Motion, no-JavaScript and resilience (US5)

**Goal**: motion is CSS-only and optional; every reader gets the whole story.

**Independent test**: reduced-motion, JS-off and forced-colours runs show all content with no dependence on motion or script.

- [ ] T050 [P] [US5] Test: `tests/e2e/projects-motion.spec.ts` (reduced motion: no progress bar, no heading animation, visual not sticky, clips not playing, no `@view-transition`; default motion: progress bar present, sticky visual at 80rem and above that stops at its chapter's end and never overlaps the next chapter, a heading already in or above the viewport on load (opened at `#options`) fully uncovered (FR-025), `@view-transition { navigation: auto }` present, no content hidden by default when `animation-timeline` is unsupported).
- [ ] T051 [P] [US5] Test: `tests/e2e/projects-no-js.spec.ts` (JavaScript off on index and story: every chapter, alt text, full comparison, all links, every project listed, no filter controls or empty message shown, no dead controls; the story has no `<script>` beyond the shell's; with the island script blocked, controls stay hidden).
- [ ] T052 [P] [US5] Test: `tests/e2e/projects-forced-colors.spec.ts` (chosen mark, status, progress bar, focus and borders visible, FR-024) and confirm the `templates.ts`-driven runs in `tests/e2e/no-js.spec.ts` and `tests/e2e/shell.spec.ts` now include the two templates added in T041, adding any template-specific assertion they lack.
- [ ] T053 [P] [US5] Test: `tests/unit/site/portfolio-css.test.ts` asserting every effect is guarded (`prefers-reduced-motion: no-preference`, `@supports (animation-timeline: view())`, `@media print` hides the progress bar, sticky only at 80rem with no-preference, scroll-margin so focus is never under the bar or panel).
- [ ] T054 [US5] Implement motion CSS in `portfolio.css` and `ReadingProgress.astro`: `scroll(root)` progress bar, `view()` heading uncover, sticky visual panel, `@view-transition { navigation: auto }` with title pairing (if Astro does not emit `transition:name` styles under the CSP, add a hashed inline rule via `Astro.csp.insertStyleHash()`, research R4), all gated per contracts/pages-dom.md "Motion", making T050 to T053 pass.
- [ ] T055 [US5] Fix `ProjectFilter.astro` if T051 shows any control visible without a ready island.
- [ ] T056 Run `corepack pnpm run build` and the `e2e` project (all new specs) plus `corepack pnpm exec vitest run`; confirm green.

**Checkpoint**: resilience contracts met.

## Phase 8: Demos, clips and drafts (US6, US7 drafts)

**Goal**: embedded and link-only demos work with a scoped CSP; draft projects stay out of production.

**Independent test**: the embed page gets `frame-src`, a link-only page does not; a draft is absent from a production-mode build and marked otherwise.

- [ ] T057 [P] [US6] Test: extend `tests/component/project/Demo.test.ts` with the embed (`<iframe>` with `title`, `loading="lazy"`, `sandbox="allow-scripts allow-same-origin allow-forms"`, `referrerpolicy="strict-origin-when-cross-origin"`, no `allow` attribute, open-demo link kept outside the frame) and the chapter `visual="demo"` panel in `Chapter.test.ts`.
- [ ] T058 [P] [US6] Test: `tests/build/project-csp.test.ts` (embed page CSP meta contains `frame-src https://drc.dev https://*.drc.dev`; link-only and index pages unchanged; `public/_headers` unchanged; no element with an inline `style` attribute on the index or any story, FR-047).
- [ ] T059 [P] [US7] Test: `tests/build/project-drafts.test.ts` (production env: draft absent from index, routes, sitemap, sharing metadata, and no draft-only image or clip file in `dist/`; a draft with an invalid body or settings still fails the production build naming the file, FR-073; preview env: present and marked "Draft"; published project unaffected).
- [ ] T060 [P] [US6] Test: `tests/build/project-clips.test.ts` (tiny committed WebM in `tests/fixtures/projects/`; a missing clip and a clip over 5 MB fail naming file and path; clip renders with poster, controls, muted and no autoplay).
- [ ] T061 [P] [US6] Test: extend `tests/e2e/projects-fixtures.spec.ts` (embedded-demo story: lazy iframe and no CSP violation; link-only story has no iframe; clip controls visible and clip not playing).
- [ ] T062 [US6] Implement the embed in `Demo.astro` and the demo visual in `Chapter.astro`; call `Astro.csp.insertDirective("frame-src https://drc.dev https://*.drc.dev")` from route frontmatter only when the project embeds (before layout render), making T057 and T058 pass.
- [ ] T063 [US6] Implement clip support in `Visual.astro` and the clip check in the schema (Vite `import.meta.glob(..., { query: "?url" })`, existence and 5 MB limit) and ensure production builds drop draft-only assets, making T059 to T061 pass.
- [ ] T064 Run `corepack pnpm exec vitest run` (including the build project), the `sections` Playwright project and lint; confirm green.

**Checkpoint**: demos and drafts done.

## Phase 9: Authoring: validation errors, one-file project, every block, guide (US7, US8)

**Goal**: Don adds a project with one file; every mistake fails the build in plain language naming the file.

**Independent test**: 32 broken fixtures each fail with the contracted phrase; adding one file plus images publishes a project.

- [ ] T065 [P] [US7] Test: create broken fixtures `tests/fixtures/projects/broken/01-*.mdx` to `32-*.mdx` (contracts/build-errors.md) and `tests/build/project-validation.test.ts` asserting each build fails naming the file and the contracted phrase and that no message contains an environment value (fails until T068 closes any gap).
- [ ] T066 [P] [US7] Test: `tests/build/one-file-project.test.ts` (adding one `.mdx` plus images publishes the project on the index and at `/projects/<slug>/`, touching no other file; SC-004) and `tests/build/project-routes.test.ts` (duplicate slug `x.md` + `x.mdx`, nested file, and a page file under `/projects/…` fail).
- [ ] T067 [P] [US8] Test: `tests/unit/content/projects-guide.test.ts` (every setting and block name from the schema and registry appears in `docs/projects.md`, FR-075), plus an every-block fixture `tests/fixtures/projects/every-block.mdx` with `tests/build/every-block.test.ts` (builds; page sections `Figure`, `TextBlock`, `Lead`, `CallToAction` usable inside a chapter).
- [ ] T068 [US7] Fix any gaps T065 to T067 expose in `project-body.ts`, `project.ts`, `content.config.ts` `generateId` and error wording (plain language, FR-076) until all 32 rows pass.
- [ ] T069 [US7] Write `docs/projects.md` (plain-language authoring guide: location, every setting, every block, skeleton, images and clips, drafts, how errors read), link it from `docs/pages.md` and add the content-structure rows to `docs/design-source.md` (shared files: keep both sides).
- [ ] T070 [P] [US8] Test: extend `tests/e2e/projects-fixtures.spec.ts` with the every-block story (all blocks render, comparison keyboard scroll, placeholder marks, draft chapter mark) and confirm it passes.
- [ ] T071 Run `corepack pnpm exec vitest run` (build project included), lint and `astro check`; confirm green.

**Checkpoint**: authoring contract enforced and documented.

## Phase 10: Accessibility, budget, sharing metadata and hardening (US5, FR-080 to FR-085)

**Goal**: the gate passes on both templates in both themes.

- [ ] T072 [P] [US5] Test: `tests/e2e/a11y.spec.ts` picks up `/projects/` and `/projects/focus-pocus/` through `TEMPLATES` (both themes, 390 and 1280 px, JS off, reduced motion, reflow at 320 px, text spacing); add an axe run on the every-block fixture story and on the filtered and empty index states; add keyboard tests (Tab reaches the comparison region; focus never hidden under the sticky panel or progress bar).
- [ ] T073 [P] Test: `tests/e2e/budget.spec.ts` covers both templates (LCP, CLS, long tasks, JS at most 10 KB, total at most 100 KB); `tests/e2e/seo.spec.ts` covers title, description, canonical, sharing image and sitemap entries for `/projects/` and the story; `tests/e2e/headers.spec.ts` confirms unchanged headers and no CSP violation on both templates.
- [ ] T074 Fix any axe, budget, CSP or SEO failure found by T072 and T073 in `src/components/project/*`, `portfolio.css`, `ProjectLayout.astro` or images (fix sizing, never loosen the budget; contrast in both themes).
- [ ] T075 Run `corepack pnpm run test:a11y` and `corepack pnpm run test:budget`; confirm green.

**Checkpoint**: accessibility and performance gates green.

## Phase 11: Visual baselines and full gate (FR-084)

**Purpose**: the new snapshotted pages and changed navigation get baselines; nothing else may change.

- [ ] T076 Test: add `projects-{phone,desktop}-{light,dark}` and `project-story-{phone,desktop}-{light,dark}` (full page, reduced motion emulated so every chapter is final) to `tests/e2e/visual.spec.ts` (shared file: keep both sides).
- [ ] T077 Update macOS baselines: `corepack pnpm run test:visual:update`. Review the diff: only the eight new `projects-*` / `project-story-*` images may be new; any changed existing image (header, footer, home, about, contact, sections, not-found, menu) is a regression to fix, not to refresh.
- [ ] T078 Update Linux baselines: `corepack pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, report that Don must start it and stop; the fallback is the `visual-baselines` PR label plus `gh run download` of `visual-baselines-linux`). Review the diffs the same way and commit the images.
- [ ] T079 Run the full gate: `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm run verify` (rerun on port-collision noise); confirm secrets lint, ESLint, types, Vitest, build and all Playwright projects are green.

## Phase 12: Preview checks and polish (needs Don)

- [ ] T080 Re-read the four checklists in `specs/009-portfolio/checklists/` and confirm every requirement has a test; fix or note gaps in the PR body.
- [ ] T081 [P] Confirm no production import from `src/prototypes/portfolio`, no new dependency in `package.json`, and `public/_headers` unchanged (`git diff main -- package.json public/_headers`).
- [ ] T082 Write the PR notes: major change under Principle III (navigation, new page type and transitions, per-page `frame-src`), $0 added cost, auto-merge left off because of the `[PREVIEW-CHECK]` items below.
- [ ] T083 Check on the preview deployment, in both themes: Projects nav, index rows at 1280 and 390 px, Focus Pocus story, comparison keyboard scroll, stand-in and source links [PREVIEW-CHECK]
- [ ] T084 Check page transition feel on the preview: the title carries from index row to story header in Chromium, no flash, and nothing under reduced motion [PREVIEW-CHECK]
- [ ] T085 Check both themes on the preview for progress bar and chapter uncover feel and the sticky visual at 1280 px [PREVIEW-CHECK]
- [ ] T086 Check on the deployed contact form that following the invitation shows "About: focus-pocus" and the project is carried through on submit [PREVIEW-CHECK]
- [ ] T087 Check the demo embed framing on drc.dev: drc.dev allows framing from doncoleman.ca (its own `frame-ancestors`) and the embed displays in the sandbox; the demo link works regardless [PREVIEW-CHECK]
- [ ] T088 Review the Focus Pocus draft copy, every draft chapter mark and placeholder visual against the Direction C screenshots in `docs/design/portfolio.md`, and decide which marks to remove [PREVIEW-CHECK]

## Dependencies and order

- Phase 1, then Phase 2 (schema needs `isProductionBuild`, themes, address), then Phases 3 and 4 (blocks and body check need the schema), then Phase 5 (story needs blocks, body check, comparison), then Phase 6 (index needs the story route and Focus Pocus), then Phase 7 (motion needs both templates), then Phase 8 (demos need blocks and route), then Phase 9 (validation covers everything built), then Phase 10, then Phase 11 (baselines last so appearance is final), then Phase 12.
- Phases 3 and 4 touch different files; Phases 7 and 8 are independent of each other after Phase 6. They are kept sequential for one agent each.
- Within each phase: **Test** tasks first, seen failing; then implementation; then the phase's run task.

## Implementation strategy

- MVP: Phases 1 to 5 deliver one readable Focus Pocus story at `/projects/focus-pocus/` (US1, US2, US3, US9). Phase 6 adds the index and navigation (US4). Phases 7 to 9 add resilience, demos and authoring (US5, US6, US7, US8). Phases 10 and 11 close the gate and baselines; Phase 12 is Don's review.
- Never refresh a baseline to hide an unexpected diff. Keep changes inside this feature's scope; the contact form showing the project title, RSS and multi-select filtering are follow-up work per the spec.
