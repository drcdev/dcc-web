# Tasks: Two-column editorial layout for the contact page

**Input**: `specs/052-contact-editorial-layout/` (spec.md, plan.md, research.md R10, data-model.md, contracts/contact-page.md, quickstart.md)

**Tests are mandatory** (constitution Principle I). Every test task names its one primary layer (the cheapest that can observe the behaviour, per `docs/testing.md` "Where a test goes") and gives the reason for any second layer. Test tasks come before the implementation they cover and must be seen to fail first.

**Format**: `- [ ] T### [P?] [Story] Description with file path`. `[P]` = different files, no dependency on an open task. `[PREVIEW-CHECK]` items follow `.claude/skills/_shared/preview-check.md`: left unticked by the subagent and listed for Don.

**Toolchain**: run `node -v` before any `pnpm` or `playwright` call; if it is not the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the same command (CLAUDE.md).

## Phase 1: Setup

- [X] T001 Confirm the worktree is clean on branch `052-contact-editorial-layout`, `.specify/feature.json` points at `specs/052-contact-editorial-layout`, and `.reference/flux` is present (symlink or copy from the main checkout if missing)

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: the shared pieces every story's tests and markup need.

- [X] T002 [P] Test, primary layer **Unit**: in `tests/unit/site/privacy-policy.test.ts` assert the privacy policy and terms of use both publish `mailto:${site.contactEmail}` (FR-007b, no drift). Fails until T005 adds the field
- [X] T003 [P] Extend the `render()` helper in `tests/component/sections/helpers.ts` to accept named slots, keeping the existing default-slot signature
- [X] T004 [P] Add the decorative envelope icon `src/icons/mail.svg`, same style, size and `currentColor` use as `src/icons/github.svg`
- [X] T005 Add `contactEmail: "contact@doncoleman.ca"` to `SiteConfig` and the site object in `src/config/site.ts` (no other config change); T002 now passes

**Checkpoint**: helper, icon and config exist; the new unit test is green.

---

## Phase 3: User Story 1 - Wide screen: note beside the form (Priority: P1) MVP

**Goal**: at 1024 px and up, the note (h2 "Before you write", copy, three quick links) sits left, the form column right, 5:7, top-aligned, with the privacy paragraph under "Send a message".

**Independent test**: open `/contact/` at 1280 px: two columns, note left, form right, both starting level under the title.

### Tests (write first, see them fail)

All test tasks T006 to T010 are written and seen to fail before any implementation task (T011 onward). T010 is the US2 layout test: it sits here because the markup that makes it pass is written in T011, and Principle I needs it failing before then.

- [ ] T006 [P] [US1] Test, primary layer **Component** (Container API): in `tests/component/sections/ContactForm.test.ts` add rows L1, L3, L4, L5, L6, L7, L8, L9, L10, L11 (grid classes including `lg:gap-x-12`, DOM order, h2 text and `aria-labelledby`, one quick link per `socialNavigation` entry in the same tab followed by a query-free `mailto:` with the address as text, every `socialNavigation` entry has an icon, icons `aria-hidden`, the focus-outline classes on each note link, privacy slot placement, success panel inside the form column, `min-w-0`, `min-h-6`/`break-words`) and N1, N2 (no note slot: no grid, no note, form markup as today). No second layer: markup contracts are cheapest here
- [ ] T007 [P] [US1] Test, primary layer **Unit**: in `tests/unit/content/site-pages.test.ts` assert `src/content/pages/contact.mdx` puts the note in one `<div slot="note">`, keeps the privacy policy link outside it, and the note holds no heading (FR-009, P1 to P3). The copy rules (FR-004 to FR-006, FR-010, including no job title) are not restated in tests (research.md R10); they are T022
- [ ] T008 [P] [US1] Test, primary layer **Unit**: in `tests/unit/site/fixture-posts.test.ts` change the `<ContactForm />` assertion to `<ContactForm` (fixture is no longer self-closing). This keeps an existing guard working after T013 rather than adding behaviour, so it is not expected to fail first
- [ ] T009 [US1] Test, primary layer **E2E** (only a browser computes layout): in `tests/e2e/contact.spec.ts` add a "layout" describe on the real `/contact/`, asserting by `data-*` hooks and not copy: at 1024 and 1280 px the note and form columns are side by side, their top edges within 1 px beneath the title, the gap between them is 48 px, the form column is wider (about 7:5) and at least 300 px wide (FR-017); at 1920 px `[data-contact]` is at most 1024 px wide and centred; the note is first in DOM and focus order. No second layer: axe and visual shots do not prove geometry
- [ ] T010 [US2] Test, primary layer **E2E**, same "layout" describe (sequential with T009, same file): at 1023 and 375 px the note's bottom is above the form column's top, the gap is 40 px, and the document has no horizontal scroll; the three quick links come before Name in Tab order at 1280 and 375 px (SC-006), and no request goes to the spam-check service while tabbing through the note links, only once Name gets focus (FR-013); a valid send and a `?project=` journey at 375 px (SC-003, second width: the stacked layout must not hide or cover a control)

### Implementation

- [ ] T011 [US1] Edit `src/components/sections/ContactForm.astro`: add the named `note` slot and default slot; when `Astro.slots.has("note")` wrap in `lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12`, render `section[data-contact-note]` (`lg:col-span-5`, h2 `#contact-note-heading` "Before you write", `data-contact-note-body` with `max-w-prose lg:max-w-none`, `ul[data-contact-links]` from `socialNavigation` plus the mailto using `site.contactEmail` and `mail.svg`, links `min-h-6 break-words` with the form's focus outline) and `div[data-contact-form-column]` (`lg:col-span-7`, `mt-10 lg:mt-0`, `min-w-0`) holding the unchanged form and `#contact-success`; render `[data-contact-privacy]` under the "Send a message" heading; without the slot render as today (contract L1 to L11, N1, N2)
- [ ] T012 [US1] Edit `src/content/pages/contact.mdx`: wrap in `<ContactForm>`, put the note Markdown (speaking and mentoring on systems leadership and AI experiments; reads every message and replies by email within a few days; "Vancouver Island, BC — Pacific Time"; no consulting, no job title, plain language) in `<div slot="note">`, move the privacy paragraph word for word inside as the default slot, delete the old first paragraph
- [ ] T013 [US1] Edit `tests/fixtures/pages/contact-form.mdx`: same shape with an ASCII fixture note and fixture privacy paragraph (no real content, `no-real-content-in-tests`)
- [ ] T014 [US1] Run the T002 and T006 to T009 tests plus the existing `contact.spec.ts` and `tests/unit/content/site-pages.test.ts`; all green

**Checkpoint**: US1 works and is testable alone.

---

## Phase 4: User Story 2 - Phone: stacked, note first (Priority: P1)

**Goal**: below 1024 px one column, note above form with a 40 px gap, no sideways scroll from 320 px.

**Independent test**: `/contact/` at 375 and 1023 px is one column, note first, no horizontal scroll.

- [ ] T015 [US2] Make T010 pass; the stacked behaviour should already come from T011 (no `lg:` classes below 1024 px). Adjust only `src/components/sections/ContactForm.astro` classes if it fails (note body `max-w-prose lg:max-w-none`, links `break-words` so the address wraps at 320 px)

**Checkpoint**: US1 and US2 both pass.

---

## Phase 5: User Story 3 - Existing form behaviour unchanged (Priority: P1)

**Goal**: `?project=`, the lazy spam check, validation announcements, sending and the success message behave exactly as before.

**Independent test**: the existing `contact.spec.ts` journeys, CSP test and `a11y.spec.ts` contact states pass with no edits to their expectations.

- [ ] T016 [US3] Verification, no new test (existing coverage is the primary layer; a duplicate would restate it): run `tests/e2e/contact.spec.ts` (journeys, CSP, tab order from Name, honeypot, `?project=`, privacy note), `no-js.spec.ts`, `geometry.spec.ts`, `a11y.spec.ts` ("contact form states" and `TEMPLATES` for `/contact/`) and `budget.spec.ts` for `/contact/`; fix any regression in `ContactForm.astro` without editing those expectations
- [ ] T017 [US3] Confirm by inspection that the island script, ids, field markup and the CSP for `/contact/` are untouched (`git diff` limited to the files listed in plan.md)

**Checkpoint**: all stories pass.

---

## Phase 6: Polish and cross-cutting

Visual baseline tasks follow `.claude/skills/_shared/visual-baselines.md` (read it first; it is not restated here).

- [ ] T018 Sibling check: if 050-page-container-harmony has merged, merge `origin/main` (keep this feature's `.specify/feature.json`) and rerun the T009 and T010 layout tests before refreshing baselines, since a changed container width moves the geometry and the shots. If it merges after T019 and T020, repeat this task and both refreshes before the final push
- [ ] T019 Refresh the macOS visual baselines: `pnpm run test:visual:update` (run via the nvm and pnpm shim wrapper in the background under `perl alarm`); expect only `contact-form-{desktop,phone}-{light,dark}-visual-darwin.png` to change; compare `-previous.png`. Any other changed image is a regression to fix, not a baseline to refresh
- [ ] T020 Refresh the Linux visual baselines: `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, Don is asked to start it through an `AskUserQuestion` whose question text carries the instruction, and the task waits; there is no other route to Linux baselines); expect only the four `-visual-linux.png` contact-form files to change. Do not run T019 while Docker is building dist. Commit and push all eight images before the PR opens; if CI's visual check then fails on the Docker images, stop and tell Don (Docker has drifted from CI) and do not refresh from a CI run
- [ ] T021 Run the local gate for the changed paths only (`changed-paths.ts --base origin/main` tier, per CLAUDE.md and memory notes); ask Don before any full `pnpm run verify`. Check the unit guards `no-real-content-in-tests` and the literal guard pass
- [ ] T022 [PREVIEW-CHECK] Don reads the note copy on the preview and confirms the wording (FR-004 to FR-006, FR-010: speaking and mentoring, reply within a few days, "Vancouver Island, BC — Pacific Time", no job title or role, plain language)
- [ ] T023 [PREVIEW-CHECK] Don sends a real message from the preview (Turnstile needs a browser) and sees it arrive as a preview-marked email; also checks SC-001 and SC-005 at 1280 x 800 (note heading, "Send a message", reply expectation, "Pacific Time" and all three links visible without scrolling), 200% zoom reflow, the visible focus outline on the note links in both themes, and the WCAG 1.4.12 text-spacing values (nothing clips or overlaps) (SC-004, FR-002, FR-015)

---

## Dependencies and order

- Phase 1, then Phase 2 (T002 to T004 parallel, T005 after T002 is seen failing), then the Phase 3 tests T006 to T010 (all written and seen failing), then T011 to T014, then US2 (T015) and US3 (T016, T017) in parallel, then Polish (T018, then T019 before T020, all after T016; T021 after the images are committed).
- Within the tests: T006 to T008 in parallel (different files); T009 then T010 sequential (same file).
- `[P]` candidates: T002, T003, T004; T006, T007, T008.

## Implementation strategy

MVP is Phase 1 to 3 (US1). The stacked layout falls out of the same markup, so US2 mostly adds proof, and US3 is regression proof. Visual baselines are refreshed last, once the markup is final.
