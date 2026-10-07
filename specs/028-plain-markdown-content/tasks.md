# Tasks: Plain Markdown for standard content

**Input**: Design documents from `/specs/028-plain-markdown-content/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-rules.md, quickstart.md

**Tests**: Mandatory (Principle I). Tests come first and are seen to fail before the code they cover. Each test task names its one primary layer (`docs/testing.md`, "Where a test goes"); a second layer carries a written reason.

**Organization**: by user story. US1 (headings linkable) and US2 (plain Markdown rule and guides) are both P1; US3 (build rejects removed tags) is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- Node comes from nvm: run `node -v` first and follow CLAUDE.md "Local toolchain" before any `pnpm` command.

---

## Phase 1: Setup

- [ ] T001 Confirm the toolchain and a clean baseline: run `node -v` against `.nvmrc`, then `pnpm exec vitest run tests/unit/content tests/unit/site/docs-content-structure.test.ts` and note it is green before any edit. Check `lsof -i :4321 -i :4322` for sibling worktree servers (plan Risks).

---

## Phase 2: Foundational

No shared prerequisite beyond Phase 1: the registry change (T009) belongs to US3, and the page rewrite (T010) to US1.

---

## Phase 3: User Story 3 - The build rejects the removed sections (Priority: P2, built first because US1 depends on the registry)

**Goal**: `<TextBlock>`, `<Offerings>` and `<Offering>` fail the build with the existing "is not a section" error; the eight remaining sections are unchanged.

**Independent Test**: `pnpm exec vitest run tests/unit/content/body.test.ts tests/unit/content/section-schemas.test.ts` is green; a `<TextBlock>` in a page file fails the build (quickstart step 3).

### Tests (write first, see them fail)

- [ ] T002 [P] [US3] Layer: unit. In `tests/unit/content/body.test.ts` add cases: each of `<TextBlock title="x">`, `<Offerings>`, `<Offering title="x">` in a page body and in a post body throws "is not a section", names the file ("Page file" / "Post file") and lists the eight names in FR-003 order; self-closing (`<TextBlock />`), nested (`<Offering>` inside `<Lead>`) and `<Textblock>` forms throw; the same tags inside a fenced block (backticks and tildes) and inline code do not throw; the first unknown tag in the file is the one reported. These fail while the three are registered. A second layer (build) is not needed: `validatePageBody` is the single check and is a pure function (FR-002, SC-003).
- [ ] T003 [P] [US3] Layer: unit. In `tests/unit/content/section-schemas.test.ts` change the expected `sectionNames` to exactly the eight in FR-003 order, delete the `TextBlock` and `Offerings and Offering` describe blocks, and drop `offerings` from `withContent` and any `content` summary expectation. Fails until T009/T011 land.

### Implementation

- [ ] T004 [US3] Remove `TextBlock`, `Offerings` and `Offering` from `sectionNames` and `sectionComponents` in `src/components/sections/index.ts`, keeping the eight in FR-003 order (`Lead`, `CallToAction`, `Figure`, `WideImage`, `FullImage`, `SideImage`, `ContactForm`, `RecentWriting`).
- [ ] T005 [P] [US3] Delete `src/components/sections/TextBlock.astro`, `src/components/sections/Offerings.astro`, `src/components/sections/Offering.astro` and the component tests `tests/component/sections/TextBlock.test.ts`, `tests/component/sections/Offerings.test.ts`.
- [ ] T006 [US3] In `src/components/sections/schemas.ts` delete the three schemas and the `offerings` content counter; in `src/components/sections/validate.ts` drop `offerings` from `summarise()`. Run `pnpm exec tsc --noEmit` (or `pnpm run check`) and grep `src/` for leftover references.
- [ ] T007 [US3] Run `pnpm exec vitest run tests/unit/content/body.test.ts tests/unit/content/section-schemas.test.ts tests/component/sections` and confirm T002 and T003 now pass and the remaining component tests pass unedited (FR-003).

**Checkpoint**: removed tags are rejected; the other eight sections still pass their own tests. (The Work with me page fails the build until T012; run build-level checks after US1.)

---

## Phase 4: User Story 1 - Link to any heading on Work with me (Priority: P1)

**Goal**: `/work-with-me/` is plain Markdown (`Lead` and `CallToAction` only), with the same words in the same order, and each of its twelve headings has a unique non-empty id.

**Independent Test**: build, then `grep -o '<h[23] id="[^"]*"' dist/work-with-me/index.html` lists twelve ids `speaking-topics` through `what-i-dont-do`; `/work-with-me/#consulting` opens at Consulting with JavaScript off.

### Tests (write first, see them fail)

- [ ] T008 [P] [US1] Layer: unit. In `tests/unit/content/launch-content.test.ts` rewrite the Work with me structure tests against the Markdown source: only `Lead` and `CallToAction` tags; `Lead` first, `CallToAction` last with href `/contact/`; `##` headings in FR-005 order (Speaking topics, Past talks, Consulting, Kinds of work, How I work, What I don't do); three `###` under Speaking topics and three under Kinds of work; no `#` heading in the body and no skipped level; the no-practice note after `## Consulting`; "What I don't do" items remain a Markdown list; drop the three removed names from `registered`. Fails on today's page. Source-structure only, so a build-level repeat is limited to ids (T009).
- [ ] T009 [P] [US1] Layer: build (what only the real `astro build` shows: ids). In `tests/build/local-site.test.ts` rewrite the Work with me test: h2 titles come from the source's `^## ` lines; three h3 in each of the two list sections; heading levels in `<main>` after the h1 never skip; every h2 to h6 in `<main>` after the page title (twelve) has a non-empty `id`, all unique, read from the built HTML rather than hard-coded, with a single spot check that Consulting has `id="consulting"` (FR-006, SC-001); no `data-offering-*` or `data-text-block` markup remains. Fails on today's page.

### Implementation

- [ ] T010 [US1] Rewrite `src/content/pages/work-with-me.mdx` as plain Markdown: frontmatter and draft settings unchanged; `<Lead>` and `<CallToAction>` kept; `##` for the six sections, `###` for the three topics and three kinds of work; paragraphs, bold passages and the "What I don't do" list as Markdown. Copy wording verbatim from the current file (every word, punctuation mark and bold passage); only line wrapping, blank lines and wrapper tags change (FR-004, FR-005). Do not put a heading inside a component.
- [ ] T011 [US1] Run T008 and T009 (`pnpm exec vitest run tests/unit/content/launch-content.test.ts tests/build/local-site.test.ts`) and confirm green. Compare the old and new rendered text (from git history vs `dist/work-with-me/index.html`) to confirm no wording change.

**Checkpoint**: US1 and US3 verified; the site builds.

---

## Phase 5: User Story 2 - Write standard content as plain Markdown (Priority: P1)

**Goal**: `docs/pages.md` states the rule once and documents exactly the eight components; `docs/posts.md` names only `Lead` and `CallToAction`; the fixture page shows Markdown only for text.

**Independent Test**: `pnpm exec vitest run tests/unit/site/docs-content-structure.test.ts` is green; grep finds no `<TextBlock`, `<Offerings` or `<Offering` in `docs/`, `tests/fixtures/` or `src/` (outside specs and chore records).

### Tests (write first, see them fail)

- [ ] T012 [US2] Layer: unit (a text test over the guide files; no rendering is needed). In `tests/unit/site/docs-content-structure.test.ts` extend the `docs/pages.md` checks to cover FR-008 fully, each as its own assertion: (a) the rule appears once, naming headings, paragraphs, lists, tables, quotes, links and emphasis as plain Markdown and the components-only-for list; (b) the eight components appear in FR-003 order, each with the props it takes and one example (adds `ContactForm` and `RecentWriting`); (c) examples show a `##` heading followed by text and a `##` group with `###` items, `###` never directly after the page title; (d) the guide says how heading addresses are formed (lower case, spaces to hyphens, most punctuation dropped, `-1` / `-2` for repeats) and shows a `/page/#heading-text` link; (e) the guide shows a Markdown link inside a heading or item text; (f) the guide says headings go in the body, not inside a component; (g) the file contains no `<TextBlock`, `<Offerings` or `<Offering` anywhere, code included; (h) every example the guide shows for a component is accepted by `validatePageBody` as written. For `docs/posts.md`: its list of page sections usable in posts names `Lead` and `CallToAction` and none of the three removed names. Fails on today's guides.
- [ ] T013 [P] [US2] Layer: unit. Add a guard in `tests/unit/site/docs-content-structure.test.ts` (or the nearest existing doc-scan test) that no file under `docs/`, `CLAUDE.md`, `.claude/skills/` and `src/` names a removed section (FR-009); `specs/` and `.specify/chores/` are excluded as records. Same file as T012, so run after it.

### Implementation

- [ ] T014 [US2] Update `docs/pages.md` to satisfy T012: state the rule once, document the eight components in FR-003 order with props and one accepted example each, show `##` / `###` Markdown for a titled passage and a list of items, a Markdown link in a heading, heading-address formation and the `-1` / `-2` rule, headings in the body only, and remove every mention of the removed sections (no "do not write `<TextBlock>`" examples). Plain language, no filler (constitution, Development Workflow).
- [ ] T015 [P] [US2] Update `docs/posts.md` so its list of page sections that work in posts names `Lead` and `CallToAction` only and refers to `docs/pages.md` for the rule instead of restating it (FR-009). Leave `docs/projects.md` unchanged.
- [ ] T016 [US2] Run `pnpm exec vitest run tests/unit/site/docs-content-structure.test.ts` and confirm T012 and T013 pass; grep the repository (excluding `specs/`, `.specify/chores/`, `.reference/`, `node_modules/`, `dist/`) for `TextBlock`, `Offerings`, `Offering` and `offerings` and confirm nothing remains.

### Fixture and browser checks for plain Markdown (FR-007, FR-012)

- [ ] T017 [US2] Layer: e2e (journey and browser-only: focus, underline, no-JS). Update `tests/e2e/sections.spec.ts` first so it expects the new fixture: the no-JS text list drops "How I work" and "What I offer"; the target-size/focus test checks the CTA only (an inline link is exempt from WCAG 2.5.8); the inline Markdown link `Architecture reviews` (`/contact/`) keeps the focus-indicator and underline checks. Fails against the old fixture.
- [ ] T018 [US2] Edit `tests/fixtures/pages/sections.mdx`: remove the `TextBlock` and `Offerings` blocks and add one paragraph containing the inline link `[Architecture reviews](/contact/)`. Keep every other section as is. Then run `pnpm exec playwright test --project=sections --project=a11y` (quickstart step 4; rerun when no sibling worktree holds ports 4321/4322) and confirm green, including the `/work-with-me/` a11y cases at phone and desktop, light and dark, with no horizontal scroll (FR-011).

**Checkpoint**: guides, fixture and browser checks agree with the plain-Markdown rule.

---

## Phase 6: Polish and release

- [ ] T019 Update the visual baselines (FR-012, SC-005), following `.claude/skills/_shared/visual-baselines.md` exactly. Layer: visual (page templates and the fixture page). Order: first `pnpm run test:visual:update` (macOS); then `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don with an `AskUserQuestion` whose question text carries the instruction, and do not fall back to CI without asking; do not run the macOS update while Docker builds `dist`). Expected change: only the eight `tests/e2e/visual.spec.ts-snapshots/sections-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png`. Check `git status tests/e2e/visual.spec.ts-snapshots` shows no other PNG changed (an unpredicted diff is a regression to fix, not a baseline to refresh), and compare the `-previous.png` images for the removed blocks only. Commit and push the images before opening the PR.
- [ ] T020 [P] Run quickstart steps 1 to 3 once more end to end, including the manual rejection check (add `<TextBlock title="x">` to a scratch page, confirm the build fails naming the file and tag, revert).
- [ ] T021 Release gate: ask Don before running, then merge `origin/main`, check `lsof -i :4321` is clear, and run the full `pnpm run verify` (with `ASTRO_PREVIEW_BACKGROUND=1`, under `perl -e 'alarm N; exec @ARGV'`, via the wrapper in the background; read the `VERIFY_EXIT=` line). Everything must be green; never loosen a check. Rerun once if the failure is load-bound or a runner-capacity cancel (CLAUDE.md and memory notes).
- [ ] T022 Open the PR from `drc-agents` (`gh auth switch --user drc-agents`, then back to `drcdev`), body saying in one line that the slice is classified not major and why (plan "Major-change classification"), with no `[PREVIEW-CHECK]` item (Don chose "merge as usual"). After the final push, `gh pr merge --auto --merge`; the merge waits for Don's approval and green `verify`. After it merges, switch to `main`, pull and delete the local branch.

---

## Dependencies and order

- T001 first. Within a phase: tests before the implementation they cover (T002/T003 before T004-T006; T008/T009 before T010; T012/T013 before T014/T015; T017 before T018).
- T004 precedes T010 only for rejection semantics; T010 must land before any full build because the old page uses the removed tags (so T004-T006 and T010 are committed close together).
- US3 (registry) then US1 (page); US2 guides can run in parallel with US1 after T007.
- T019 after T018 and T010 (final page state), then T021, then T022.

## Parallel examples

- T002 and T003 (different files); T005 alongside T004; T008 and T009; T012 with T008; T014 and T015.

## Implementation strategy

MVP is US3 plus US1 (registry change and page rewrite, which the build requires together). Then US2 guides and fixture, then baselines, the gate and the PR.

## Summary

22 tasks: Setup 1, Foundational 0, US3 6 (T002-T007), US1 4 (T008-T011), US2 7 (T012-T018), Polish and release 4 (T019-T022). No `[PREVIEW-CHECK]` tasks (Don chose merge as usual).
