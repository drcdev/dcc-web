# Tasks: Plain Markdown for standard content

**Input**: Design documents from `/specs/028-plain-markdown-content/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-rules.md, quickstart.md

**Tests**: Mandatory (Principle I). Tests come first and are seen to fail before the code they cover. Each test task names its one primary layer (`docs/testing.md`, "Where a test goes"); a second layer carries a written reason.

**Organization**: by user story, with one exception forced by the build. US3 (build rejects removed tags, P2) and US1 (Work with me rewrite, P1) share one phase: every build, including the fixture site the e2e and visual projects use, reads `src/content/pages/work-with-me.mdx` and `tests/fixtures/pages/sections.mdx`, and both use the removed sections. Dropping them from the registry without rewriting both files in the same phase would commit a red build. So Phase 3 is atomic: registry change, page rewrite, fixture edit and the `sections-*` baseline refresh land in one phase commit, which ends green. US2 (guides) follows in Phase 4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- Node comes from nvm: run `node -v` first and follow CLAUDE.md "Local toolchain" before any `pnpm` command.

---

## Phase 1: Setup

- [X] T001 Confirm the toolchain and a clean baseline: run `node -v` against `.nvmrc`, then `pnpm exec vitest run tests/unit/content tests/unit/site/docs-content-structure.test.ts` and note it is green before any edit. Check `lsof -i :4321 -i :4322` for sibling worktree servers (plan Risks).

---

## Phase 2: Foundational

No shared prerequisite beyond Phase 1. The registry change (T007) and the page and fixture rewrites (T010, T011) are not foundational on their own: they must land together in Phase 3 (see Organization).

---

## Phase 3: User Stories 3 and 1 - Remove the sections and rewrite Work with me (US3 P2, US1 P1; one atomic phase)

**Goal**: `<TextBlock>`, `<Offerings>` and `<Offering>` fail the build with the existing "is not a section" error; the eight remaining sections are unchanged; `/work-with-me/` is plain Markdown (`Lead` and `CallToAction` only) with the same words in the same order and twelve linkable headings; the sections fixture page uses no removed section and its baselines are refreshed. The phase ends with the real site and the fixture site building green.

**Independent Test**: `pnpm exec vitest run tests/unit/content tests/component/sections tests/build/local-site.test.ts` is green; a `<TextBlock>` in a page file fails the build (quickstart step 3); `grep -o '<h[23] id="[^"]*"' dist/work-with-me/index.html` lists twelve ids; `pnpm exec playwright test --project=sections --project=a11y --project=visual` is green.

### Tests (write all first, run them and see them fail)

- [X] T002 [P] [US3] Layer: unit. In `tests/unit/content/body.test.ts` add cases: each of `<TextBlock title="x">`, `<Offerings>`, `<Offering title="x">` in a page body and in a post body throws "is not a section", names the file ("Page file" / "Post file") and lists the eight names in FR-003 order; self-closing (`<TextBlock />`), nested (`<Offering>` inside `<Lead>`) and `<Textblock>` forms throw; the same tags inside a fenced block (backticks and tildes) and inline code do not throw; the first unknown tag in the file is the one reported. These fail while the three are registered. A second layer (build) is not needed: `validatePageBody` is the single check and is a pure function (FR-002, SC-003).
- [X] T003 [P] [US3] Layer: unit. In `tests/unit/content/section-schemas.test.ts` change the expected `sectionNames` to exactly the eight in FR-003 order, delete the `TextBlock` and `Offerings and Offering` describe blocks, and drop `offerings` from `withContent` and any `content` summary expectation. Fails until T007 and T009 land.
- [X] T004 [P] [US1] Layer: unit. In `tests/unit/content/launch-content.test.ts` rewrite the Work with me structure tests against the Markdown source: only `Lead` and `CallToAction` tags; `Lead` first, `CallToAction` last with href `/contact/`; `##` headings in FR-005 order (Speaking topics, Past talks, Consulting, Kinds of work, How I work, What I don't do); three `###` under Speaking topics and three under Kinds of work; no `#` heading in the body; the no-practice note after `## Consulting`; "What I don't do" items remain a Markdown list; drop the three removed names from `registered`. This is the primary layer for the page's source structure (FR-004, FR-005). Fails on today's page.
- [X] T005 [P] [US1] Layer: build. In `tests/build/local-site.test.ts` rewrite the Work with me test to check only what the real `astro build` shows: (a) in `<main>`, one h1 (the page title comes from the template, so only the built page shows it next to the body headings) and no skipped level from it down (FR-005); (b) every h2 to h6 in `<main>` after the page title (twelve) has a non-empty `id`, all unique, read from the built HTML rather than hard-coded, with a single spot check that Consulting has `id="consulting"` (FR-006, SC-001); (c) no `data-offering` or `data-text-block` markup remains. Do not repeat the source-order and h3-count checks of T004. No e2e for the no-JS jump (US1 scenarios 1 and 5): the id is in the static HTML and the jump is the browser's native fragment behaviour with no script, so the build is the cheapest layer that shows it. Fails on today's page.
- [X] T006 [P] [US2] Layer: e2e (journey and browser-only: focus, underline, no-JS). Update `tests/e2e/sections.spec.ts` so it expects the new fixture: the no-JS text list drops "How I work" and "What I offer"; the target-size/focus test checks the CTA only (an inline link is exempt from WCAG 2.5.8); the inline Markdown link `Architecture reviews` (`/contact/`) keeps the focus-indicator and underline checks (FR-007, FR-012). Fails against the old fixture.

### Implementation (one commit at the end of the phase; the build is red between T007 and T011)

- [X] T007 [US3] Remove `TextBlock`, `Offerings` and `Offering` from `sectionNames` and `sectionComponents` in `src/components/sections/index.ts`, keeping the eight in FR-003 order (`Lead`, `CallToAction`, `Figure`, `WideImage`, `FullImage`, `SideImage`, `ContactForm`, `RecentWriting`) (FR-001, FR-003).
- [X] T008 [P] [US3] Delete `src/components/sections/TextBlock.astro`, `src/components/sections/Offerings.astro`, `src/components/sections/Offering.astro` and the component tests `tests/component/sections/TextBlock.test.ts`, `tests/component/sections/Offerings.test.ts` (FR-001).
- [X] T009 [US3] In `src/components/sections/schemas.ts` delete the three schemas and the `offerings` content counter; in `src/components/sections/validate.ts` drop `offerings` from `summarise()` and its comment. Run `pnpm exec tsc --noEmit` (or `pnpm run check`) and grep `src/` for leftover references.
- [X] T010 [US1] Rewrite `src/content/pages/work-with-me.mdx` as plain Markdown: frontmatter and draft settings unchanged; `<Lead>` and `<CallToAction>` kept; `##` for the six sections, `###` for the three topics and three kinds of work; paragraphs, bold passages and the "What I don't do" list as Markdown. Copy wording verbatim from the current file (every word, punctuation mark and bold passage); only line wrapping, blank lines and wrapper tags change (FR-004, FR-005, FR-010). Do not put a heading inside a component.
- [X] T011 [US2] Edit `tests/fixtures/pages/sections.mdx`: remove the `TextBlock` and `Offerings` blocks and add one paragraph containing the inline link `[Architecture reviews](/contact/)`. Keep every other section as is (FR-012).
- [X] T012 [US3] [US1] Run `pnpm exec vitest run tests/unit/content tests/component/sections tests/build/local-site.test.ts` and confirm T002 to T005 pass and the remaining component tests pass unedited (FR-003). Compare the old and new rendered Work with me text (from git history vs `dist/work-with-me/index.html`) to confirm no wording change (FR-005). Then run `pnpm exec playwright test --project=sections --project=a11y` (quickstart step 4; rerun when no sibling worktree holds ports 4321/4322) and confirm green, including the `/work-with-me/` a11y cases at phone and desktop, light and dark, with no horizontal scroll (FR-011).
- [X] T013 [US2] Update the visual baselines in this phase (FR-012, SC-005), following `.claude/skills/_shared/visual-baselines.md` exactly. Layer: visual (page templates and the fixture page). Order: first `pnpm run test:visual:update` (macOS); then `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don with an `AskUserQuestion` whose question text carries the instruction, and do not fall back to CI without asking; do not run the macOS update while Docker builds `dist`). Expected change: only the eight `tests/e2e/visual.spec.ts-snapshots/sections-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png`. Check `git status tests/e2e/visual.spec.ts-snapshots` shows no other PNG changed (an unpredicted diff is a regression to fix, not a baseline to refresh), and compare the `-previous.png` images for the removed blocks only.

**Checkpoint**: removed tags are rejected; the other eight sections pass their own tests; Work with me is plain Markdown with twelve linkable headings; the site, the fixture site and the visual project are green. Commit the phase only now.

---

## Phase 4: User Story 2 - Write standard content as plain Markdown (Priority: P1)

**Goal**: `docs/pages.md` states the rule once and documents exactly the eight components; `docs/posts.md` names only `Lead` and `CallToAction`.

**Independent Test**: `pnpm exec vitest run tests/unit/site/docs-content-structure.test.ts` is green; the T018 grep finds nothing.

### Tests (write first, see them fail)

- [X] T014 [US2] Layer: unit (a text test over the guide files; no rendering is needed). In `tests/unit/site/docs-content-structure.test.ts` replace the existing "has an example of %s" list with the eight names in FR-003 order (drop `TextBlock`, `Offerings`, `Offering`; add `ContactForm`, `RecentWriting`) and extend the `docs/pages.md` checks to cover FR-008 fully, each as its own assertion: (a) the rule appears once, naming headings, paragraphs, lists, tables, quotes, links and emphasis as plain Markdown and the components-only-for list; (b) the eight components appear in FR-003 order, each with the props it takes and one example; (c) examples show a `##` heading followed by text and a `##` group with `###` items, `###` never directly after the page title; (d) the guide says how heading addresses are formed (lower case, spaces to hyphens, most punctuation dropped, `-1` / `-2` for repeats) and shows a `/page/#heading-text` link; (e) the guide shows a Markdown link inside a heading or item text; (f) the guide says headings go in the body, not inside a component; (g) the file contains no `<TextBlock`, `<Offerings` or `<Offering` anywhere, code included; (h) every example the guide shows for a component is accepted by `validatePageBody` as written. For `docs/posts.md`: its list of page sections usable in posts names `Lead` and `CallToAction` and none of the three removed names (FR-008, FR-009, SC-004). Fails on today's guides.
- [X] T015 [US2] Layer: unit. Add a guard in `tests/unit/site/docs-content-structure.test.ts` that no file under `docs/` or `.claude/skills/` names a removed section (FR-009); `specs/` and `.specify/chores/` are excluded as records. As built, `CLAUDE.md` is not in the guard: reading it from a unit test trips the changed-paths drift guard (`READ_BY_CHECKS`), so it is covered by the T018 grep only (it names no removed section; spec Follow-up). `src/` is not in the guard: after Phase 3 the registry rejects the tags in content, and T018 greps the rest. Same file as T014, so run after it. Fails on today's `docs/pages.md` and `docs/posts.md`.

### Implementation

- [X] T016 [US2] Update `docs/pages.md` to satisfy T014: state the rule once, document the eight components in FR-003 order with props and one accepted example each, show `##` / `###` Markdown for a titled passage and a list of items, a Markdown link in a heading, heading-address formation and the `-1` / `-2` rule, headings in the body only, and remove every mention of the removed sections (no "do not write `<TextBlock>`" examples). Plain language, no filler (constitution, Development Workflow).
- [X] T017 [P] [US2] Update `docs/posts.md` so its list of page sections that work in posts names `Lead` and `CallToAction` only and refers to `docs/pages.md` for the rule instead of restating it (FR-009). Leave `docs/projects.md` unchanged.
- [X] T018 [US2] Run `pnpm exec vitest run tests/unit/site/docs-content-structure.test.ts` and confirm T014 and T015 pass. Grep the repository (excluding `specs/`, `.specify/chores/`, `.reference/`, `node_modules/`, `dist/`, and the two test files that name the tags on purpose: `tests/unit/content/body.test.ts` and `tests/unit/site/docs-content-structure.test.ts`) for `TextBlock`, `Offerings`, `Offering`, `offerings` and `data-text-block`, and confirm nothing remains (SC-002).

**Checkpoint**: guides agree with the plain-Markdown rule.

---

## Phase 5: Polish and release

- [x] T019 Run quickstart steps 1 to 3 once more end to end, including the manual rejection check (add `<TextBlock title="x">` to a scratch page, confirm the build fails naming the file and tag, revert). Not parallel: it rebuilds `dist`.
- [ ] T020 Release gate: ask Don before running, then merge `origin/main`, check `lsof -i :4321` is clear, and run the full `pnpm run verify` (with `ASTRO_PREVIEW_BACKGROUND=1`, under `perl -e 'alarm N; exec @ARGV'`, via the wrapper in the background; read the `VERIFY_EXIT=` line). Everything must be green; never loosen a check. Rerun once if the failure is load-bound or a runner-capacity cancel (CLAUDE.md and memory notes).
- [ ] T021 Open the PR from `drc-agents` (`gh auth switch --user drc-agents`, then back to `drcdev`), body saying in one line that the slice is classified not major and why (plan "Major-change classification"), with no `[PREVIEW-CHECK]` item (Don chose "merge as usual"). After the final push, `gh pr merge --auto --merge`; the merge waits for Don's approval and green `verify`. After it merges, switch to `main`, pull and delete the local branch.

---

## Coverage

| Requirement | Tasks |
|-------------|-------|
| FR-001 | T003, T007, T008 |
| FR-002, SC-003 | T002, T019 |
| FR-003 | T002, T003, T007, T012, T014 |
| FR-004, FR-005 | T004, T005, T010, T012 |
| FR-006, SC-001 | T005 |
| FR-007 | T006 (link underline and focus); headings, paragraphs, lists, tables, quotes and emphasis keep the existing typography styles and their existing tests, and SC-005's unchanged baselines (T013) show no style moved; this feature adds no styles, so no new test |
| FR-008, SC-004 | T014, T016 |
| FR-009 | T014, T015, T017 |
| FR-010, SC-005 | T010, T012, T013, T020 |
| FR-011 | T012 (a11y project), T020 |
| FR-012 | T006, T011, T013 |
| SC-002 | T018 |

## Dependencies and order

- T001 first. Within a phase: tests before the implementation they cover (T002-T006 before T007-T011; T014/T015 before T016/T017).
- Phase 3 is atomic: T007-T011 together leave both builds green again, and the phase is committed only after T012 and T013 pass. Do not commit between T007 and T011.
- Phase 4 after Phase 3 (T014 (h) checks the guide's examples against the eight-name registry).
- T019 after Phase 4, then T020, then T021.

## Parallel examples

- T002 to T006 (different files); T008 alongside T007; T016 and T017.

## Implementation strategy

MVP is Phase 3 (registry change, page rewrite and fixture, which the build requires together). Then US2 guides, then the gate and the PR.

## Summary

21 tasks: Setup 1, Foundational 0, US3 + US1 atomic phase 12 (T002-T013), US2 5 (T014-T018), Polish and release 3 (T019-T021). No `[PREVIEW-CHECK]` tasks (Don chose merge as usual).
