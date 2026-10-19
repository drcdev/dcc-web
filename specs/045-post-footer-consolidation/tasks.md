---

description: "Task list for feature 045 post footer consolidation"
---

# Tasks: One footer block at the end of posts

**Input**: Design documents from `/specs/045-post-footer-consolidation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/post-footer.md, quickstart.md

**Tests**: Mandatory (constitution Principle I). Every test task names its one primary layer (the
cheapest that can observe the behaviour, `docs/testing.md` "Where a test goes") and gives the
reason for any second layer. Test tasks come before the implementation they cover and must be seen
to fail first. Contract row ids (F1 to F13) go in test titles or comments.

**Organization**: Grouped by user story. US1 and US2 are both P1 and share the same components, so
US1 builds the box and US2 the caption; US3 proves nothing regressed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 (user story phases only)
- Run `node -v` first; if it is not the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the
  same Bash command (see CLAUDE.md "Local toolchain").

## Phase 1: Setup

**Purpose**: Establish the starting point.

- [x] T001 Read `specs/045-post-footer-consolidation/contracts/post-footer.md` and `research.md`, then run `pnpm run test:unit -- tests/component/post` and note the current state of `tests/component/post/{AuthorCard,ViewsNote,Share,PostLayout}.test.ts` (all should pass before any change); record nothing in the repository.

---

## Phase 2: User Story 1 - The end of a post reads as one footer (Priority: P1)

**Goal**: One bordered box after the post text holding author part, views note and share part, with the 40 px gaps, the divider and the title card's edges.

**Independent Test**: Open a fixture post (`/writing/every-part/`) in both themes at 375 and 1440 px: one bordered box, no separate views-note line, no gradient Share box, equal 40 px gaps.

### Tests for User Story 1 (write first, confirm they fail)

- [x] T002 [P] [US1] Create `tests/component/post/PostFooter.test.ts` (layer: component, Astro Container API): `PostFooter` renders one `div[data-post-footer]` with no `role`, `aria-label` or `aria-labelledby`, carrying the title-card box classes (`rounded-xl border border-dusk-200 bg-white p-6 shadow-sm dark:border-dusk-700 dark:bg-dusk-800`) and `mt-10`; contains the author card then the share part in that order; no `footer`, `aside` or `hr` element; both headings are `h2` (rows F1, F3, F4).
- [x] T003 [P] [US1] In `tests/component/post/AuthorCard.test.ts` (layer: component): add the no-box assertion: the `section[data-author-card]` carries no border, background, radius, shadow or `mt-8` classes (row F4); add the placement assertion: `[data-views-note]` is inside the card's text column, after the `ul` and before the `img` (row F2), and update A6 so `paragraphs()` excludes `[data-views-note]` and A14 so the image position check accounts for the note; add that the text column carries `[overflow-wrap:anywhere]` so a long word breaks inside the box (spec Edge Cases "Long text"); keep A1/A9 (one `section`, nothing hidden). The placement belongs to US1 because `PostLayout` stops rendering the note itself in T013, so the note must move into the card in the same story or the page loses it.
- [x] T004 [P] [US1] In `tests/component/post/Share.test.ts` add (layer: component): no gradient, no radius, no side borders, no `mt-8`; has `mt-6 border-t border-dusk-200 pt-6 dark:border-dusk-700` (rows F4, F5 markup half; the rendered 24 px spacing is proven in T007 because only a browser lays it out).
- [x] T005 [P] [US1] Rewrite the 039 A2 case in `tests/component/post/PostLayout.test.ts` as rows F1/F2 (layer: component, because `PostLayout` is rendered through the Container API with no build): for the four post kinds (plain, with related posts, with questions panel, draft) `[data-post-footer]` appears once and is the last element child of the `<article>`; the card and the share part are inside it in that DOM order; Related posts is outside the article and after it.
- [x] T006 [P] [US1] In `tests/build/blog-listing.test.ts` extend the 039 describe (layer: build, because only the real build shows output across pages): every built post page has exactly one `data-post-footer`, one `data-views-note`, one `data-author-card` and one `data-share`; the writing index, feed output and other pages have none of the four (row F1, FR-002, SC-001).
- [x] T007 [US1] In `tests/e2e/blog.spec.ts` update and add geometry tests on the fixture site (layer: e2e, because layout can only be measured in a browser), titled with row ids: (a) F6 edges of `[data-post-footer]` equal the title card's within 1 px at 320, 375, 768, 1024 and 1440 px, with and without the questions panel (replace the 035 edge loop over the three old selectors and the 039 A3 edges); (b) F7 top gap (from the bottom of the wrapper's previous sibling) and bottom gap (to the "Related posts" heading box top) are each 40 +/- 1 px at 375 and 1440 px; (c) F5 divider spacing is 24 +/- 1 px above and below; (d) F8 alignment below and from 768 px, share heading left edge in line with the photo's left edge, share links right on one row; (e) change the related-order test to author top < note top < share top < related top by `y`. Depends on T005 only for naming; different file from T002 to T006.
- [x] T008 [P] [US1] In `tests/e2e/blog-forced-colors.spec.ts` move the A15 `expectEdge` from `[data-author-card]` to `[data-post-footer]`, add an `expectEdge` on `[data-share]` for the divider, and assert the views note is visible with a text colour different from the box background (layer: e2e with forced-colors emulation, the only layer that can show system-colour rendering; row F12).
- [x] T009 [P] [US1] In `tests/e2e/blog.spec.ts` extend the "without scripts" test (layer: e2e, JavaScript disabled is a browser setting) so the whole block is present: both headings, photo with alt text, both lines, three author links, the views note, two share links; the Share button is hidden and not in the tab order (row F11, FR-012, FR-014 keyboard order). Same file as T007, so do it after T007.

### Implementation for User Story 1

- [x] T010 [US1] Create `src/components/post/PostFooter.astro`: props `{ topics, title, href }`; `div[data-post-footer]` with `mt-10 rounded-xl border border-dusk-200 bg-white p-6 shadow-sm dark:border-dusk-700 dark:bg-dusk-800`, rendering `<AuthorCard topics={topics} />` then `<Share title={title} href={href} />`; header comment names the spec and contract.
- [x] T011 [US1] Edit `src/components/post/AuthorCard.astro`: remove the box classes and `mt-8` from the `section`; render `<ViewsNote />` after the `ul` inside the text column (DOM before the `img`; the photo stays first visually); add `[overflow-wrap:anywhere]` to the text column; keep alignment, photo and links; update the header comment. The note keeps its current classes until T019.
- [x] T012 [US1] Edit `src/components/post/Share.astro`: remove `mt-8 rounded-lg border-rust-200 bg-gradient-to-r … p-4` and the dark gradient and border; add `mt-6 border-t border-dusk-200 pt-6 dark:border-dusk-700`; confirm the heading starts at the box's inner left edge (true once the share part has no padding; no extra class needed) and the links stay right and wrap right-aligned from 768 px (FR-008); leave the script untouched; update the comment.
- [x] T013 [US1] Edit `src/layouts/PostLayout.astro`: replace the views-note wrapper, `<AuthorCard>` and `<Share>` with `<PostFooter topics={post.topics} title={post.title} href={post.href} />` as the article's last child; fix imports and the header comment. Related posts stays outside the article with no margin beyond the 40 px gap (FR-007; adjust its top margin only if T007(b) shows extra space).
- [x] T014 [US1] Run `pnpm run test:unit -- tests/component/post` then `pnpm run test:build` for `blog-listing`, and the Playwright `e2e` tests touched in T007 to T009 against the fixture site; all US1 tests must now pass. Mind the parallel-worktree port rule in the memory notes (lsof 4321/4322 first).

**Checkpoint**: One box with divider and gaps exists; the note sits inside the author part but still has its old rule and centring classes, so it is not yet a caption.

---

## Phase 3: User Story 2 - The views note is still there and easy to read (Priority: P1)

**Goal**: The note is one small italic grey paragraph inside the author part, after the links, readable in both themes.

**Independent Test**: Open any post in both themes; the note's exact wording appears once, under the author links and above the divider; contrast at least 4.5:1.

### Tests for User Story 2 (write first, confirm they fail)

- [x] T015 [P] [US2] In `tests/component/post/AuthorCard.test.ts` (layer: component; the placement half of F2 is already in T003): the `[data-views-note]` rendered inside the card has no `border-t`, `pt-4` or own `text-center`/`md:text-left` classes, so it inherits the card's alignment (FR-003, FR-005 "no rule of its own"). Must fail before T019.
- [x] T016 [P] [US2] In `tests/component/post/ViewsNote.test.ts` (layer: component): still one plain `p`, exact wording from `src/config/blog.ts`, no role, not a heading; add that it carries `text-sm italic text-dusk-600 dark:text-dusk-300` and no border or padding classes (FR-003).
- [x] T017 [US2] In `tests/e2e/blog.spec.ts` add the F9 computed-style test (layer: e2e; the class alone does not prove the rendered size): the note's `font-size` is 14 px at default zoom, smaller than the author lines' 16 px, `font-style` is italic, and the note appears exactly once on the page. Different `describe` block from T007; do it after T009 since the file is shared.
- [x] T018 [P] [US2] In `tests/e2e/blog.a11y.spec.ts` (layer: a11y/axe, the layer that measures contrast on the real rendered box): confirm the post template scan covers the footer in both themes and widths with zero violations (row F9, SC-004); the target-size selector list stays as it is (the note is not a target). Add one test that hovers each author link and each share link in turn and runs axe's `color-contrast` rule scoped to `[data-post-footer]` in both themes (FR-015 hover state; axe's default scan sees only the resting state). Add the dark focus-ring check in T021, not here.

### Implementation for User Story 2

- [x] T019 [US2] Edit `src/components/post/ViewsNote.astro`: classes become `m-0 mt-4 text-sm italic text-dusk-600 dark:text-dusk-300` (no border, no padding, no own alignment); wording still comes from the blog settings; update the comment.
- [x] T020 [US2] Run the T015 to T018 tests plus `tests/e2e/fonts.spec.ts` (note stays Inter-Italic) and confirm they pass; update the `AuthorCard.astro` header comment if it still describes the note as separate.

**Checkpoint**: The note is a caption, readable, once per page.

---

## Phase 4: User Story 3 - Author and share links work as before (Priority: P2)

**Goal**: No regression in links, Share button, focus and CSP; the dark focus ring fix of FR-015a.

**Independent Test**: Follow every author and share link on a Drift, a Convergence and a no-series post; Share button on a capable device.

### Tests for User Story 3 (write first, confirm they fail where new)

- [x] T021 [P] [US3] In `tests/component/post/Share.test.ts` add row F13 (layer: component, a class on the control; axe does not check focus rings): the two links and the Share button carry `focus-visible:outline-rust-600` and `dark:focus-visible:outline-rust-300`. Must fail before T023.
- [x] T022 [P] [US3] Confirm, without loosening, that the existing link and behaviour tests still pass unchanged (layer: existing component and e2e tests, row F10): `tests/component/post/AuthorCard.test.ts` links, `tests/component/post/Share.test.ts` addresses and encoding, `tests/e2e/blog.spec.ts` share and Share-button tests, `tests/e2e/site-links.spec.ts`. Add one build-layer assertion in `tests/build/blog-listing.test.ts` (layer: build, the generated markup is what the CSP cares about) that the built post page footer has no inline `style` attribute, no inline `<script>` or event-handler attribute inside `[data-post-footer]`, and no `target`, `rel`, `ping` or `referrerpolicy` on the LinkedIn link (FR-010a, FR-011). This build assertion is a regression guard that passes from the start (no implementation task covers it); say so in its comment. That `public/_headers` is unchanged is covered by the existing headers tests, which must stay green.

### Implementation for User Story 3

- [x] T023 [US3] Edit `src/components/post/Share.astro`: add `dark:focus-visible:outline-rust-300` to the link and button control classes (FR-015a); no change to hrefs, encoding, text or script. Run T021 and T022 tests and `tests/e2e/theme-tokens.spec.ts`; all pass.

**Checkpoint**: All three stories pass at their layers.

---

## Phase 5: Polish, baselines and gate

- [X] T024 [P] Update `specs/008-blog/contracts/blog-pages.md` "Post" items 5, 5a and 6 to point to `specs/045-post-footer-consolidation/contracts/post-footer.md` (plan "Files"); touch no other doc.
- [X] T025 Update `docs/testing.md` only if the visual coverage text names the three old end-of-post pieces; otherwise leave it.
- [X] T026 Refresh the visual baselines after all implementation is done (layer: visual; a diff is a design-system change). Read `.claude/skills/_shared/visual-baselines.md` first. Run `pnpm run test:visual:update` (macOS) via the nvm plus pnpm shim wrapper in the background, then `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, report that Don must start Docker, do not skip). Only the eight `tests/e2e/visual.spec.ts-snapshots/post-template-{desktop,phone}-{light,dark}-visual-{darwin,linux}.png` files may change (FR-018, SC-006); revert any other changed baseline and investigate it as a regression.
- [ ] T027 Run `git fetch origin` and `node scripts/ci/changed-paths.ts --base origin/main`; run the checks of the tier it prints (this slice is full tier: `pnpm run verify:quick`, then ask Don before the full `pnpm run verify`, per the memory note). Confirm `pnpm run budget` assertions (no JS added, CLS under 0.1) via the existing `budget` project, and `public/_headers` has no diff (`git diff origin/main -- public/_headers` is empty). Confirm the Share button's bundled script is unchanged (SC-005, FR-011): `git diff origin/main -- src/components/post/Share.astro` shows no change between `<script>` and `</script>`, so the built module and its byte count are the same.
- [ ] T028 [P] [PREVIEW-CHECK] Don checks the footer on the preview (a Drift, a Convergence and a no-series post) in both themes at 375 and 1440 px for the overall "one footer" look (US1).
- [ ] T029 [P] [PREVIEW-CHECK] Don reads the footer with a screen reader: author heading, lines, links, views note, photo description, then "Share this post" (FR-014).
- [ ] T030 [P] [PREVIEW-CHECK] Don tabs through the block: a focused control is never hidden, order is three author links, LinkedIn, email, then Share where shown (FR-016).
- [ ] T031 [P] [PREVIEW-CHECK] Don views the block at 200% text zoom at 320 px and with text-spacing overrides: no clipping, overlap or sideways scroll (FR-016a).
- [ ] T032 [P] [PREVIEW-CHECK] Don views the block in forced-colours mode: border, divider, note, headings, links and focus rings visible (Edge Cases, F12).

---

## Dependencies and order

- Phase 1, then Phase 2 (US1), then Phase 3 (US2), then Phase 4 (US3), then Phase 5.
- US2 builds on US1's `AuthorCard.astro` and the box; US3 edits `Share.astro` after US1's edit.
- Within a phase, tests (red) come before implementation (green). Tests in the same file
  (`tests/e2e/blog.spec.ts`: T007, T009, T017) run in sequence; `[P]` tasks touch different files.
- T026 (baselines) only after T023; T027 after T026.
- Sibling branches 046, 049 and 050 may touch `PostLayout.astro` and `post-template` baselines;
  merge `origin/main` before T026 and regenerate baselines after any merge (research R7).

## Parallel examples

- Phase 2 tests: T002, T003, T004, T005, T006, T008 together (six different files).
- Phase 3 tests: T015, T016, T018 together; T017 after T009 (same file).
- Phase 5: T028 to T032 are open PREVIEW-CHECK items, left unticked by the implementing subagent.

## Implementation strategy

MVP is Phase 2 (US1): one box, divider, gaps and edges. Add the caption (US2), then the focus-ring
fix and regression proof (US3), then baselines and the gate. Each phase is sized for one subagent.

---

## Phase 6: Convergence

- [ ] T033 Amend the wording of FR-011 in `specs/045-post-footer-consolidation/spec.md` (and the matching F10 row in `contracts/post-footer.md` if it repeats it) to match the delivered page: the Share button's script is Astro's processed module, which Astro inlines into the built page as a `<script type="module">` (as on `main` before 045) and which the page's Astro-generated CSP `<meta>` allows by hash (`astro.config.mjs` `security.csp`); its source is unchanged, so the emitted module and its byte count are the same. Replace "loaded from the site's own origin" and qualify "no inline script" as "no inline script other than that unchanged Share module", consistent with the existing guard in `tests/build/blog-listing.test.ts` ("the post footer block and the CSP"). Documentation only: no code, test or `public/_headers` change, per FR-011 (contradicts)
