# Chore plan: image-folder-per-entry (issue #201)

Branch: `chore/image-folder-per-entry`. Closes [#201](https://github.com/drcdev/dcc-web/issues/201)
"Same image folder layout for all content".

## Goal

Project images already sit in one folder per project, but post and page images share one flat
folder per collection, the shared portrait lives in the pages image folder while a component imports
it, and the template's folder (`images/template/`) does not match its file (`_template.mdx`). This
chore gives pages, posts and projects one layout: `src/content/<collection>/images/<entry>/`, named
after the entry, so retiring an entry means deleting its file and its folder
([#201](https://github.com/drcdev/dcc-web/issues/201)). The portrait moves to `src/assets/`. A new
build-time check fails the build, naming the folder, when an image folder has no matching entry, and
naming the file, when an image sits outside an entry folder or no entry uses it. A draft entry counts
as an entry. The fixtures and both fixture-site builders move to the same layout, so every build the
tests run passes the new check. Image bytes, alt text and page markup do not change, so no reader
sees a difference.

## Acceptance

**Before** (measured 2026-10-25 on `69f3883b`, node v24.4.1):

- `npx vitest run --project unit`: 196 files, 2925 tests, all pass.
- `find src/content -path '*/images/*' -type f ! -name '.*' | awk -F/ '{print NF}' | sort | uniq -c`
  shows 18 files at depth 5 (directly in `pages/images/` or `posts/images/`) and 16 at depth 6
  (`projects/images/<slug>/`). Of the 16, one is in `projects/images/template/`, which matches no
  file. So **19 images** are not in their entry's folder: 13 post images, 5 page images (including
  `don-coleman.jpg`) and the template diagram.
- `grep -rn "content/pages/images" src/components` prints `AuthorCard.astro:10`.
- Nothing fails the build for an image no entry uses. `tests/fixtures/projects/images/draft-only.png`
  is used by no fixture file (only `tests/build/drafts.test.ts` points a copy at it), and the build
  harness leaves the removed real posts' and projects' pictures in the copied site unreferenced.
- `.claude/skills/content/SKILL.md` "Images" starts with "State today." and names #201.

**After:**

1. Every non-dot file under `src/content/{pages,posts,projects}/images/` sits in
   `images/<entry>/`, where `<entry>` is the entry's folder name (see Scope, "Folder names"). The
   depth command above prints only depth 6 (no nested page has images today). There is no
   `projects/images/template/`; there is `projects/images/_template/diagram.svg`.
2. `src/assets/don-coleman.jpg` exists and `src/content/pages/images/don-coleman.jpg` does not.
   `grep -rn "src/content\|content/pages" src/components` prints nothing.
3. `pnpm run build` passes on the real content. A build with an extra folder
   `src/content/pages/images/no-such-page/` fails with a message naming
   `src/content/pages/images/no-such-page/` (build test, W7). Unit tests show that an image directly
   in `images/` and an image no entry uses each fail with the file named (W7).
4. `src/lib/prune-unreferenced-assets.ts` is unchanged (`git diff --stat origin/main -- src/lib/prune-unreferenced-assets.ts`
   prints nothing), and `tests/build/drafts.test.ts` still proves that a draft-only image is pruned and
   that an image shared with a built page is kept.
5. `grep -rn "\./images/[a-z0-9-]*\.\(png\|jpe\?g\|webp\|svg\)" src/content docs tests/fixtures scripts .claude/skills/content`
   prints nothing: every image path names an entry folder. (Broken fixtures that point at a missing
   file use the per-entry form too.)
6. `pnpm run test:unit` passes with **2936 tests in 197 files** (+11 tests, +1 file): +8 in
   `tests/unit/content/images.test.ts` (W7) and +3 in the new `tests/unit/site/fixture-images.test.ts`
   (W5). No moved test changes what it asserts. `astro check` reports 0 errors, `pnpm run lint`
   passes, and the full verify gate passes in CI with no visual baseline change.
7. `docs/pages.md`, `docs/posts.md` and `docs/projects.md` say where images go in the new layout and
   list the new build errors. `.claude/skills/content/SKILL.md` "Images" states the layout and the
   check, and `grep -n "State today\|#201" .claude/skills/content/SKILL.md` prints nothing.

## Scope

**In:** W1 to W9 below. Decisions this plan takes (no ticked decisions came with the issue):

- **Folder names.** A post's folder is its slug (`slugFromPostPath`). A project's folder is its file
  name without the extension, so the template's folder is `_template`, matching `_template.mdx`
  (the issue's first option; the file keeps its name, which the loader's `!**/_*` pattern and
  `docs/projects.md` rely on). A page's folder is its entry id: the path without the extension, with
  a trailing `/index` dropped, so `privacy/tempo.mdx` → `images/privacy/tempo/` and the home page
  `index.mdx` → `images/index/` (matches the collection id `idFromPath` gives; the home page needs no
  folder today because its only image moves to `src/assets/`). The landing files (`writing.mdx`,
  `projects.mdx`) are entries too.
- **What counts as an entry.** Every `.md`/`.mdx` file of the collection folder outside `images/`,
  read from the file system, whatever its front matter: drafts, hidden pages, and the `_`-prefixed
  project template all count. The check does not depend on what the loader's pattern includes.
- **What counts as a use.** Any relative path in an entry file's whole text (front matter and body)
  that resolves, from the file's folder, to the image. This covers `src:` in front matter, `![]()`
  in the body and linked images, and needs no parser. A reference from another entry also counts
  (see Out). A path inside a code sample also counts; that can only hide an orphan, never fail a
  good build.
- **What counts as an image.** Every file under `images/` whose name does not start with `.`
  (`.gitkeep`, `.DS_Store` are ignored). Any other stray file in an image folder is reported like an
  unused image.
- **Where the check runs.** A pure function in `src/lib/content/images.ts` (the shared image
  helper, beside `assertImagesExist`) decides; a small reader turns a content root into its input; an
  Astro integration in the same module runs it from the `astro:build:start` hook, with the project
  root taken from `astro:config:done`. Astro runs the content sync before `astro:build:start`
  (`node_modules/astro/dist/core/build/index.js`: `setup()` calls `syncInternal`, then `build()`
  calls `runHookBuildStart`), so every schema and loader error is still reported first and keeps its
  message. It runs in every `astro build`: `pnpm run build` (verify gate, CI, Workers Builds), the
  build test harness (`tests/build/fixture-site.ts`, build mode) and the Playwright fixture site
  (`scripts/build-fixture-site.ts`). It does not run in `astro dev` or `astro sync`/`astro check`,
  so a writer can add a picture before using it while the dev server runs. The per-entry loader hook
  (`generateId`) cannot do this, because it sees one file at a time.
- **Error wording** (through `contentError`, so it reads like the other content errors):
  - folder with no entry: `<Kind> file src/content/<dir>/images/<folder>/: no <kind> is named <folder>. Rename the folder after the <kind> that uses it, or delete it.`
  - image directly in `images/`: `<Kind> file src/content/<dir>/images/<name>: sits directly in images/. Move it into images/<entry>/, the folder named after the <kind> that uses it.`
  - unused image: `<Kind> file src/content/<dir>/images/<folder>/<name>: no <kind> uses this image. Use it, or delete it.`
  Problems are found in sorted path order and the first one is thrown, as the other checks do.
- **Shared fixture images.** Each fixture entry that uses a picture gets its own folder with its own
  copy (Git stores identical files once). The one deliberate share stays: `shared-image.png` lives in
  `tests/fixtures/pages/images/hidden-page/`, and `visible-page.mdx` points at it, because
  `tests/build/drafts.test.ts` proves that pruning by reference keeps an image a built page shares
  with a hidden one. It belongs to the hidden page because `tests/build/navigation.test.ts` builds
  the hidden page alone. `draft-only.png` moves to `tests/fixtures/projects/images/draft/`.
- **The build harnesses copy only what the copied files use.** Copying every fixture picture into
  every fixture build would fail the new check in almost every build test. A new helper,
  `scripts/fixture-images.ts`, copies the image files a copied fixture file references, renames the
  fixture's own folder to the target name when a test copies it under another name (`to:`), and
  rewrites those paths in the copied text. Both builders use it. When the harness removes the real
  posts, the real projects or a page, it removes their image folders too.
- **Component-test picture.** Eight component tests and `tests/component/sections/figure-in-mdx.mdx`
  import `tests/fixtures/pages/images/sample.png`. They move to `tests/fixtures/assets/sample.png`, so
  component tests do not depend on a fixture page's folder (the same rule as "components do not
  import from `src/content/`").
- **#199 and `changed-paths.test.ts`.** #199 merged in PR #208, so no sibling branch edits that file
  now. The finish step still merges `origin/main` before opening the PR, as the issue asks.

**Out (follow-ups for the PR body):**

- **References into another entry's folder.** The check allows them (the issue asks only for orphan
  folders and unused images, and the prune fixture needs one). No real entry does it today. A rule
  that an entry may use only its own folder would make "retire = delete the folder" airtight; it is a
  separate change.
- **The check in `astro dev`.** Not run, by design (see Scope). If Don wants it in dev, it is a
  one-line hook change plus a decision about half-finished drafts.
- **The portrait's tier.** `src/assets/don-coleman.jpg` is outside `src/content/`, so changing the
  portrait later is a full-tier change in `scripts/ci/changed-paths.ts`. Left as is: it changes
  rarely.

**Not changed:** `src/lib/prune-unreferenced-assets.ts`, `scripts/ci/changed-paths.ts` (the
`CONTENT_IMAGE` pattern already allows sub-folders), any schema, loader pattern or `generateId`,
`assertImagesExist`'s messages, page markup, image bytes, `.github/workflows/`, `package.json`.

## Constitution Check

- I Test-First: the check's unit tests (W7) and the fixture helper's unit tests (W5) are written and
  seen to fail before the code; the build wiring test is seen to fail before the integration is
  added. Moves keep every existing assertion and stay green after each item.
- II Release Gate: a new check is added; none is removed or weakened. The full gate runs in CI (the
  diff changes `src/lib/**`, so the tier is full).
- III Human Review: normal PR from `drc-agents`, auto-merge armed, Don approves.
- IV First-Party: content collections and the `image()` helper keep validating each image; the
  check uses the documented Astro Integration API hooks (`astro:config:done`, `astro:build:start`),
  as `pruneDraftAssets` already does. Astro has no first-party unused-asset check, and `generateId`
  sees one entry at a time, so the whole-folder rule is custom code (docs cited below).
- V Static: no runtime, endpoint or prerender change.
- VI Content as Files: images stay beside their content as files; a bad layout fails the build with
  the path named.
- VII Private Data: N/A (no data handling changes; the portrait is already public).
- VIII Cloudflare: N/A.
- IX Cost: none.
- X Accessible/Fast/Private: same images, same alt text, same markup; no bundle change.
- XI Spec Kit: chore flow on `chore/<slug>`, plan in `.specify/chores/<slug>/`.

## Work items

Common to every item:

- Run every toolchain command under the `CLAUDE.md` Local toolchain rules.
- Each item ends green on `pnpm run test:unit`, `pnpm exec astro check` (0 errors) and
  `pnpm run lint`. Items that touch content or the build harness also run the build tests they name.
- Move files with `git mv`. Keep every alt text, caption and image byte as it is.
- Tests never name a real post or project (`docs/testing.md` "Real content in tests"); read real
  content through `tests/helpers/content.ts` or use neutral example names.

### [x] W1 — Shared portrait to `src/assets/`

**Files:** `git mv src/content/pages/images/don-coleman.jpg src/assets/don-coleman.jpg`.
`src/content/pages/index.mdx` line 11: `src: ../../assets/don-coleman.jpg` (relative to the file, as
`image()` resolves it; `assertImagesExist` resolves the same way). `src/components/post/AuthorCard.astro`:
`import portrait from "../../assets/don-coleman.jpg";`.

**Test:** existing: `tests/component/post/AuthorCard*` and `HomeIntro` component tests,
`tests/unit/content/site-pages.test.ts`, and `pnpm run build` (the home page and a post page import
the file). No behaviour: n/a (same file, new path).

### W2 — Post images into one folder per post

**Files:** for each real post and the sample post, `git mv src/content/posts/images/<file>
src/content/posts/images/<slug>/<file>`, where `<slug>` is the post file name without `.mdx` (13
files, 5 folders; the exploration notes list which file belongs to which post). In each post, change
every `./images/<file>` (front matter `featureImage.src` and body images) to
`./images/<slug>/<file>`. `src/content/posts/sample-everything.mdx` uses `sample-figure.png` three
times; change all three.

`tests/unit/content/sample-posts.test.ts` "keeps every sample image small": read
`${dir}images/sample-everything/` instead of `${dir}images/` (the sample post is the FR-035 draft by
contract, so naming it is allowed). The assertion is unchanged.

**Test:** existing (the sample-posts test above, `tests/unit/content/no-real-content-in-tests.test.ts`,
`pnpm run build`, which renders every post and fails on a missing image). No behaviour: n/a (paths
only).

### W3 — Page images into one folder per page, and the template's folder

**Files:**

- `git mv` `about-feature.webp`, `2026-ih-coe-social-post.png`, `2024-cchl-chapter-award.png` and
  `2024-cchl-profile.png` from `src/content/pages/images/` to `src/content/pages/images/about/`.
  Update the four paths in `src/content/pages/about.mdx` (one front matter, three body).
- `git mv src/content/projects/images/template src/content/projects/images/_template`. Update the two
  `./images/template/diagram.svg` paths in `src/content/projects/_template.mdx`.
- `tests/unit/content/project-template.test.ts` line 25: `images/_template/diagram.svg`.

**Test:** existing (`project-template.test.ts`, `tests/build/project-template.test.ts` X01/X02 in
the content tier, `pnpm run build`). No behaviour: n/a (paths only).

### W4 — Component tests use their own picture

**Files:** copy `tests/fixtures/pages/images/sample.png` to `tests/fixtures/assets/sample.png`
(the original stays for W5 to move into the fixture page's folder). Repoint the imports in
`tests/component/FeatureImage.test.ts`, `PageLayout.test.ts`, `HomeIntro.test.ts`,
`tests/component/post/{fixtures.ts,PostImage.test.ts,PostHero.test.ts,PostCard.test.ts}` and the image
path in `tests/component/sections/figure-in-mdx.mdx` to the new file.

**Test:** existing component tests (`pnpm run test:component` or the component project). No
behaviour: n/a (test asset path only).

### W5 — Fixture images per entry, and a build harness that copies only used images

**Files:**

- **Fixture layout.** Move each fixture picture into the folder of the fixture file that uses it,
  named after that file's base name, and update the paths in the fixture files:
  - `tests/fixtures/pages/images/sections/sample.png` (`sections.mdx`, five uses);
    `tests/fixtures/pages/images/hidden-page/{hidden-only.png,shared-image.png}` (`hidden-page.mdx`);
    `visible-page.mdx` points at `./images/hidden-page/shared-image.png` (see Scope).
  - `tests/fixtures/posts/images/{minimal,long-title,every-part}/sample.png` for
    `posts/valid/{minimal,long-title,every-part}.mdx`.
  - `tests/fixtures/projects/images/<name>/sample.png` for every project fixture that references
    `sample.png` (`minimal`, `every-part`, `every-setting`, `draft`, `retired`, and the broken
    `27-bad-file-name`, `RP04-missing-replacement`, `R01-removed-order`, `story-mdx-element`,
    `story-malformed-table`, which must keep a real image so they fail for their own reason).
    `draft-only.png` moves to `tests/fixtures/projects/images/draft/`.
  - Broken fixtures that point at a missing file use the per-entry form with a file that does not
    exist: `posts/broken/p09-image-missing.mdx`, `p22-body-image-missing.mdx`,
    `projects/broken/17-missing-image.mdx`, `pages/broken/06-missing-image-frontmatter.mdx`,
    `07-missing-image-body.mdx` (for example `./images/p09-image-missing/missing.png`). Their tests
    assert the message contains the path as written in the fixture; update any asserted path.
  - Remove the flat `tests/fixtures/{pages,posts,projects}/images/*.png` files once every reference
    is moved.
- **New helper `scripts/fixture-images.ts`:**
  `copyReferencedImages({ text, sourceId, targetId, fromImages, toImages }): string`. For each
  `./images/<folder>/<path>` in `text` whose file exists under `fromImages`, copy it to `toImages`,
  into `<targetId>/` when `<folder>` is `sourceId` and into `<folder>/` otherwise, and return the text
  with `./images/<sourceId>/` rewritten to `./images/<targetId>/`. A reference to a missing file is
  left as written (broken fixtures need it). A target nested below the collection folder that
  references images throws a plain `Error` (no fixture does this; supporting `../images/` is not
  needed).
- **`tests/build/fixture-site.ts`:** stop copying whole `images/` trees. `copyFixtures` gains the
  collection's fixture images folder and uses the helper for each copied page, post and project file
  (after `replace`, so a test's replacement path is what decides the copy; the ids come from the
  source and target base names, `to` included). When it removes the real posts (no `realPosts`),
  remove `src/content/posts/images/<slug>/` for each removed post; with `withoutRealProjects`, remove
  `src/content/projects/images/<slug>/` for each removed project (the `_template` folder stays with
  its file); with `removePages`, remove the page's folder if there is one. Update the doc comments
  that say pictures stay unreferenced or that the whole images folder is copied.
- **`tests/build/drafts.test.ts`:** the `draftWithAssets` replacements become
  `["src: ./images/draft/sample.png", "src: ./images/draft/draft-only.png"]` and the visual
  `src: ./images/draft/draft-only.png`. The assertions are unchanged.
- **`tests/build/fixture-site.test.ts`:** the two image-existence assertions point at the per-entry
  paths (`projects/images/minimal/sample.png`, `posts/images/minimal/sample.png`), and the "real
  posts left out" test also asserts that no real post's image folder is in the copy (computed from
  the real post names it already reads).

**Tests:**

- New first, unit layer: `tests/unit/site/fixture-images.test.ts` (temp directories, like
  `tests/unit/content/images.test.ts`), 3 tests: copies only the referenced files; renames the
  fixture's own folder and rewrites the text for a `to:` copy while leaving another entry's folder
  name alone; leaves a missing file's reference as written and copies nothing for it. Seen to fail
  before the helper exists.
- Existing build tests are the regression check for the harness: run `tests/build/fixture-site.test.ts`,
  `drafts.test.ts`, `navigation.test.ts`, `page-validation.test.ts`, `post-validation.test.ts`,
  `project-validation.test.ts` and `project-template.test.ts` (`vitest run --project build <files>`).
  No assertion is removed; the fixture-site test gains one expectation (real image folders gone).

### W6 — Playwright fixture site in the same layout

**Files:** `scripts/build-fixture-site.ts`:

- `generateFixturePosts()`: each generated post's `featureImage.src` becomes
  `./images/<slug>/<name>`, and `prepareFixtureSite` writes the PNG to `posts/images/<slug>/<name>`.
- Fixture pages (`FIXTURE_PAGES`), fixture posts (`FIXTURE_POSTS`) and fixture projects (the
  non-broken files in `tests/fixtures/projects/`) are copied file by file with
  `copyReferencedImages` instead of copying whole `images/` trees. Update the header comments that
  name `tests/fixtures/*/images/`.

`tests/unit/site/fixture-posts.test.ts` line 56: expect `./images/${post.slug}/${post.image.name}`.

**Test:** existing: `tests/unit/site/fixture-posts.test.ts`, `fixture-site-content.test.ts`,
`font-coverage.test.ts`, and `node scripts/build-fixture-site.ts` (the Playwright fixture build) must
pass. Run the fixture e2e specs that show images if time allows; otherwise CI covers them. No
behaviour: n/a (same pictures, new paths).

### W7 — The image folder check

**Files:**

- `src/lib/content/images.ts`: add
  `checkImageFolders(kind: ContentKind, entries: readonly { file: string; text: string }[], images: readonly string[]): void`.
  `file` and image paths are relative to the collection folder (`about.mdx`, `images/about/x.webp`).
  It applies the rules in Scope ("Folder names", "What counts as …", "Error wording"): an image
  directly in `images/` fails naming the file; an image whose folder (its directory below `images/`)
  is no entry's folder name fails naming the folder; an image no entry's text references fails naming
  the file. Add `readImageFolders(contentRoot: string)` (lists the three collections' entry files with
  their text and their image files, ignoring dot files) and
  `imageFolderCheck(): AstroIntegration` (stores `config.root` in `astro:config:done`, runs the check
  for pages, posts and projects in `astro:build:start`). Header comment cites the integrations
  reference and #201.
- `astro.config.mjs`: add `imageFolderCheck()` to `integrations`, with a one-line comment.

**Tests:**

- New first, unit layer (`tests/unit/content/images.test.ts`, new `describe("checkImageFolders (#201)")`,
  8 tests, in-memory input except the last):
  1. passes when every image is in its entry's folder and used, with a page, a nested page
     (`privacy/policy.mdx` → `images/privacy/policy/`), the home page (`images/index/`), a draft post
     and a `_`-prefixed project file;
  2. a folder with no entry fails naming `src/content/posts/images/<folder>/`;
  3. an image directly in `images/` fails naming the file;
  4. an image no entry uses fails naming the file;
  5. a body image reference (`![a](./images/x/y.png)`) and a front matter `src:` both count as uses;
  6. dot files (`.gitkeep`, `.DS_Store`) are ignored;
  7. a reference from another entry counts as a use (the documented allowance);
  8. `readImageFolders` over a temp root with all three collections returns what the check needs and
     the check throws for an orphan placed there.
  Neutral names only (`example-post`, `example-page`). Seen to fail before the function exists.
- New, build layer (one test, in `tests/build/page-validation.test.ts`, in its build-mode block):
  "an image folder with no page fails the build naming the folder (#201)": `buildFixtureSite([],
  { mode: "build", write: { "src/content/pages/images/no-such-page/x.png": <a few bytes> } })`, expect
  failure and the folder path in the message. Reason for the second layer (comment in the test): only a
  real build shows the integration is registered and that its error reaches the output. One case is
  enough; the unit tests cover every rule.
- Before committing, confirm the real build and both fixture builds pass with the check on:
  `pnpm run build`, `node scripts/build-fixture-site.ts`, and the build tests listed in W5. A
  failure there means a W1 to W6 path was missed; fix the path, never the check.

### W8 — Example paths in `changed-paths.test.ts`

**Files:** `tests/unit/ci/changed-paths.test.ts`: the content-only image examples (lines 81 to 85)
and the tier example (line 256) use the per-entry form with neutral names, for example
`src/content/pages/images/example-page/feature.webp`, `src/content/posts/images/example-post/hero.jpg`,
`src/content/posts/images/example-post/figure.png`, `src/content/projects/images/example-project/architecture.svg`,
`src/content/projects/images/example-project/clip.webm`. The negative examples
(`pages/images/x.ts`, `notes.txt`) become `pages/images/example-page/x.ts` and `.../notes.txt`.
`scripts/ci/changed-paths.ts` is not touched.

**Test:** existing (same assertions on renamed example paths). No behaviour: n/a (examples only;
the pattern is unchanged).

### W9 — Docs and the `/content` skill

**Files:**

- `docs/posts.md`: line 22 says pictures go in `src/content/posts/images/<post-file-name>/` and are
  written `./images/<post-file-name>/name.png`; update the examples (lines 36, 106, 112, 118, 123),
  the `featureImage` row (51) and error rows P9 and P22 ("add the file to the post's folder in
  `images/`"); add the three new build errors to the error table.
- `docs/pages.md`: line 18 (`src/content/pages/images/<page>/`, with `index` for the home page and
  the nested address for a nested page, for example `images/privacy/tempo/`), the examples (139, 145,
  151, 163), and the three new errors in "Build errors you may see".
- `docs/projects.md`: lines 21 and 22 already describe per-project folders; add that the folder is
  named exactly like the file (the template's is `_template`), and the new errors under "Build
  errors you may see".
- `docs/design-source.md` rows 58 to 60: "(+ `images/<entry>/`)" and "one image folder per
  entry". Name `src/assets/don-coleman.jpg` where the doc lists `src/assets/` if it does.
- `docs/testing.md`: if it describes the build harness copying fixture images, say it copies only
  the images the copied fixtures use; add the new tests to any coverage table that lists image
  checks.
- `.claude/skills/content/SKILL.md` "## Images": delete the "State today." paragraph (including the
  #201 sentence). State: one folder per entry, `src/content/<collection>/images/<entry>/`, named after
  the entry (post or project file name, page id, `index` for the home page, nested address for a
  nested page); paths start `./images/<entry>/` and are relative to the file; retiring an entry means
  deleting its file and its folder; the build fails naming a folder with no entry and an image no
  entry uses (drafts count) (`lib/content/images.ts`); the shared portrait is
  `src/assets/don-coleman.jpg`. Keep the alt text and diagram sentences.

**Test:** existing doc guards (`tests/unit/site/docs-content-structure.test.ts`,
`projects-guide.test.ts`, the skills checks under `tests/unit/`); run `pnpm run test:unit`. No
behaviour: n/a (documentation).

## Docs citations

- Astro Integration API, `astro:config:done` (the resolved `config`, including `root`) and
  `astro:build:start` ("after the `astro:config:done` event, but before the production build
  begins"): https://docs.astro.build/en/reference/integrations-reference/#astroconfigdone and
  https://docs.astro.build/en/reference/integrations-reference/#astrobuildstart (retrieved through
  the Astro Docs MCP, 2026-10-25). Hook order against the content sync confirmed in the installed
  Astro 7.3.5 (`dist/core/build/index.js`).
- Images in content collections: a front matter image path is relative to the entry's folder and
  validated by the `image()` helper, so `../../assets/don-coleman.jpg` from
  `src/content/pages/index.mdx` resolves to `src/assets/don-coleman.jpg`:
  https://docs.astro.build/en/guides/images/#images-in-content-collections (Astro Docs MCP).
- Existing precedent in this repository: `pruneDraftAssets` (`astro:build:done`) in
  `src/lib/prune-unreferenced-assets.ts`.

## Risks

- **A build test fails with the new orphan error instead of its own.** The harness must leave no
  orphan in any build-mode run. W5 lands before W7 and W7 runs every harness build test with the
  check on. Errors raised during the content sync are not affected, because the check runs after it.
- **A fixture copied under another name** (`to:`) brings its own folder, renamed by the helper. A
  copy whose images live in another entry's folder (`visible-page.mdx` → `hidden-page/`) needs that
  entry in the same build; today only `drafts.test.ts` copies `visible-page.mdx` in build mode, and it
  copies `hidden-page.mdx` too.
- **Hashed asset names may change** because files moved. Pixels, sizes and alt text do not, so no
  visual baseline should change; if one does, stop and investigate rather than refresh it.
- **False negatives.** A path that appears only in a code sample counts as a use, so such an orphan
  passes. Accepted: it can never fail a good build.
- **Playwright fixture site** is built by e2e runs locally and in CI; W6 and W7 both run
  `node scripts/build-fixture-site.ts` so a missed path shows before CI.
- **Parallel worktrees** collide on ports 4321/4322 during local e2e; prefer CI for the e2e tier as
  the memory notes describe.
