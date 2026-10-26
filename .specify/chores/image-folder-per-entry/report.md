# Review report: image-folder-per-entry (issue #201)

Reviewed 2026-10-25 on `7314eae7` (node v24.4.1), fresh eyes, against `plan.md` and `git diff main...HEAD` (98 files).

## Verdict

W1 to W9 are done as planned and nothing beyond them. No user-visible behaviour changes: image bytes, alt text and markup are untouched (only paths move; the portrait import and the home page's `intro.photo.src` resolve to the same file). No check is weakened; one new build check is added. `src/lib/prune-unreferenced-assets.ts`, `scripts/ci/changed-paths.ts`, `.github/`, `package.json`, the schemas and loaders are unchanged.

**Findings: 0 CRITICAL, 0 HIGH, 5 LOW.**

## Tests run

- `vitest run --project unit` on the changed unit files (`images`, `fixture-images`, `sample-posts`, `project-template`, `diagram-fonts`, `fixture-posts`, `changed-paths`, `no-real-content-in-tests`): 8 files, 375 tests, all pass.
- Full unit project: **197 files, 2936 tests, all pass** (plan target: 2936 in 197). Matches.
- `vitest run --project build` on `fixture-site`, `drafts`, `navigation`, `page-validation`, `post-validation`, `project-validation`, `project-template`: 7 files, 108 tests, all pass (190 s). This includes the new build-layer test at `tests/build/page-validation.test.ts:122`, which proves the integration is registered in `astro.config.mjs` and its error reaches the build output. Every existing broken-fixture test still fails for its own reason (the check runs after the content sync).
- Failing-first: not re-run (it would need edits outside `report.md`). It holds by construction: on `main`, `checkImageFolders`, `readImageFolders` and `copyReferencedImages` do not exist (the import fails), and a build with an orphan folder succeeds (no check).
- `pnpm run build` and `node scripts/build-fixture-site.ts` were not re-run here; CI runs both in the full tier. Instead, `readImageFolders` and `checkImageFolders` were run over the real `src/content`: pages 10 entries / 4 images, posts 5 / 13, projects 7 / 15, no error.

## Scrutiny of the check (`src/lib/content/images.ts:65-146`)

- **Folder with no entry:** fails naming `src/content/<dir>/images/<folder>/` for pages, posts and projects. Nested `privacy/policy`, and `legal/index.mdx` using `../images/legal/x.png`, both pass. An orphan `images/privacy/nope/` fails naming that folder.
- **Image directly in `images/`:** fails naming the file.
- **Unused image:** fails naming the file.
- **Drafts:** every `.md`/`.mdx` file on disk is an entry, whatever its front matter, so drafts, hidden pages and `_template.mdx` all count.
- **References:** front matter `src:` and body `./images/...` or `../images/...` are both detected. One regex runs over the whole text and each path is resolved with `posix.join`.
- **Substring masking:** none. Uses are exact resolved paths in a Set, so `s.png.bak` does not count as a use of `s.png` (the probe fails, as it should).
- **Dot files:** ignored. Any other non-dot file under `images/` must be used.
- **Portrait reference:** the `index.mdx` reference `../../assets/don-coleman.jpg` resolves outside `images/` and is ignored by the check. `image()` still validates it.
- **Where it runs:** in `astro:build:start`. That covers `pnpm run build`, the build-test harness and the Playwright fixture site, because both copy `astro.config.mjs`. It does not run in `astro dev`, `sync` or `check`, as planned.

## Fixture builders

- `scripts/fixture-images.ts` only filters fixture sources, which are not site content. Real pages, the sample post and `_template` are copied whole and checked whole, so no real orphan is hidden.
- All 17 fixture images are referenced by their fixture file.
- No needed image is dropped: the build tests pass, including `drafts.test.ts`, which checks that the draft-only image is pruned and the shared image is kept.
- The prune module is untouched.

## `tests/unit/content/sample-posts.test.ts`

"keeps every sample image small" reads `images/sample-everything/`, asserts `names.length > 0`, and checks 4 images today. The `if (!existsSync(images)) return;` guard (line 112) is pre-existing. It returns early only if the folder is missing, and in that state the same file's "exactly one sample-everything.mdx" test fails and the build fails on the sample post's own image references. So the test is not vacuous today; see L1.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

- **L1** `tests/unit/content/sample-posts.test.ts:112`: the early return is now dead weight. Drop it so the size test fails on its own.
- **L2** `tests/build/fixture-site.ts:264`: `removePages` computes the home page's folder id as `""` for `index.mdx`, while the check uses `images/index/` (`src/lib/content/images.ts:70`). Removing the home page in a build test would leave `images/index/` behind as an orphan. This is latent: no `images/index/` exists and no test removes `index.mdx`.
- **L3** `src/lib/content/images.ts:99`: for a nested folder the message says "no page is named nope" (the last segment) instead of `privacy/nope`. A sub-folder inside an entry folder (`images/about/sub/`) gets "no page is named sub". The path in the prefix is right; this is wording only.
- **L4** `src/lib/content/images.ts:89`: a path followed by prose punctuation (`./images/a/s.png.`) or a `#`/`?` suffix is not counted as a use, so that image would fail the build as unused. This errs safe and no current content hits it.
- **L5** Plan acceptance 2: `grep -rn "src/content\|content/pages" src/components` still prints three pre-existing comment lines (`CareerTimeline.astro:4`, `Now.astro:4`, `StartHere.astro:3`). The intent holds: `grep -rn "content/pages/images" src/components` prints nothing. This is plan wording only.

## Docs accuracy

- **`docs/posts.md`:** the layout line, examples, `featureImage` row and P9/P22 wording are updated. The new rows P27 (directly in `images/`), P28 (folder with no post) and P29 (unused) match the check's three errors and their order.
- **`docs/pages.md`:** `images/<page>/`, `index` for the home page, the nested address (`images/privacy/tempo/`) and the new error bullet match the code.
- **`docs/projects.md`:** the folder named like the file, `_template` for the template, and the new error bullet match the code.
- **`docs/design-source.md`:** rows say `images/<entry>/`. The doc does not list `src/assets/`, so no portrait line was needed.
- **`docs/testing.md`:** unchanged. No test layer moved, so no update was required.
- **`.claude/skills/content/SKILL.md` "Images":** "State today" and #201 are gone. The layout, retire rule, three errors, drafts rule, portrait path and diagram sentence are present and accurate. No `_shared/` block is restated.

## Measurement

| | Images not in their entry's folder | Depth histogram |
|---|---|---|
| Before (`69f3883b`) | **19** | 18 at depth 5, 16 at depth 6 |
| After (`7314eae7`) | **0** | 32 at depth 6 |

- `src/assets/don-coleman.jpg` exists; `src/content/pages/images/don-coleman.jpg` does not.
- The flat `./images/<file>` grep prints nothing.
- Unit tests: 2925 → 2936, files 196 → 197.

## Follow-ups for the PR body

- **From the plan:**
  - References into another entry's folder are allowed; an "own folder only" rule would be a separate change.
  - The check does not run in `astro dev`.
  - The portrait now lives in `src/assets/`, so changing it runs the full gate.
- **L1:** drop the early return in the sample image size test.
- **L2:** make `removePages` use `index` as the home page's folder id, as the check does.
- **L3/L4 (optional):** word nested-folder messages with the full folder path, and trim trailing punctuation from matched paths.
