# Review report: content-update-skill (round 1)

Fresh-eyes review of `chore/content-update-skill` against `plan.md` and `git diff main...HEAD`
(8 files: new `.claude/skills/content/SKILL.md`; one-line edits to `tweak/SKILL.md`,
`chore/SKILL.md`, `_shared/open-pr.md`, `_shared/verify-gate.md`, `CLAUDE.md`, `docs/testing.md`;
`plan.md`).

## Plan conformance

- W1, W2 and W3 done as planned, nothing beyond them. No change to `src/`, `tests/`, `scripts/`,
  `.github/`, schemas or content.
- Acceptance 1–5 and 7 hold: tweak-shaped frontmatter; seven sections in order with issue pointers
  (#199 Gate, #200/#202 Collection guide, #201 Images, #203 Where the rules live); routing clauses
  in tweak, chore and content; CLAUDE.md sentence and "five pipelines"; forbidden-wording greps
  empty; `_shared/` read by reference; test:unit 189 files / 2878 tests and lint:secrets green.
- No check weakened: CI tiers, workflows and tests untouched; CI stays the gate.

## Accuracy spot-checks

Checked against `src/content.config.ts`, `src/content/schemas/*.ts`, `src/lib/content/*.ts`,
`package.json`, `playwright.config.ts`, `tests/e2e/visual.spec.ts`, `.github/workflows/ci.yml` and
the docs headings. Globs, ID rules, schema rules, script names, the four `test:build:content` files,
cited docs headings and tests, image folders, the `content/<slug>` → `content-<slug>` preview alias
and the YAML/`.md` → `tier=full` claim are all correct.

## Findings

### CRITICAL

None.

### HIGH

- **H1** `SKILL.md:106-107` says content cannot move a visual baseline. `tests/e2e/visual.spec.ts:117-140`
  shoots the header, footer, open mobile menu and not-found page on the real site, and their menus
  come from real page `nav` settings. A menu change (add, hide, reorder a menu page, change a
  `nav.label`, `visible`/`draft` or a menu page's title) moves the `header-*`, `footer-*`,
  `menu-open-*` and `not-found-*` baselines, and the skill gives no refresh route. The same claim is
  in `_shared/visual-baselines.md:7-8`.
- **H2** `SKILL.md:33-34` says #202 merges "career, reading paths, Now"; #202 names Now, reading
  paths and assessment.

### LOW

- **L1** `SKILL.md:93-94` "no code" list misses `src/pages/`, `src/layouts/`, `src/styles/`,
  `src/config/`, `public/`. Say "anything outside `src/content/`, plus `src/content/schemas/`".
- **L2** `SKILL.md:65` "run from `generateId`" overstates; several checks run from readers or routes
  at build time.
- **L3** `SKILL.md:39` pages row omits the one-position-per-menu rule
  (`src/lib/content/navigation.ts:31-36`).
- **L4** `SKILL.md:83` `content:` is not a conventional commit type used here; use `docs(content):`
  or `feat(content):`.
- **L5** `_shared/preview-check.md:3` "Included by" omits `/content`, which references it.
- **L6** `SKILL.md:57` alt text is enforced only for front-matter images.

## Measurement

Acceptance is a reviewable artifact. After `git fetch origin`,
`node scripts/ci/changed-paths.ts --base origin/main` printed
`tier=docs: 6 documentation file(s) and 2 skip-safe file(s), running secretlint and the unit tests`.

## Follow-ups for the PR body

- Author docs for the YAML collections (career, reading paths, Now, assessments).
- #199–#203 each update their named section of `/content` when they land.

## Round 2

Re-review of `chore/content-update-skill` after `dd411bca` (round 1 fixes), against `plan.md`,
the round 1 findings and `git diff main...HEAD` (11 files).

### Round 1 findings

- **H1 fixed, with one inaccuracy (R2-L1).** `SKILL.md:105-111` now names the exception and
  routes it to `_shared/visual-baselines.md`; `_shared/visual-baselines.md:7-9` gains one clause.
  Confirmed against the repo: `tests/e2e/visual.spec.ts:115-141` shoots `header-*`, `footer-*`,
  `not-found-*` and `menu-open-phone-*` on port 4321 (the real-content `wrangler dev` build;
  the `visual` project in `playwright.config.ts:74-78` has no fixture `baseURL`).
  `SiteHeader.astro`, `SiteFooter.astro` and `src/pages/404.astro:13-15` take their menus from
  `getNavigation()` (`src/lib/pages.ts:38-59`), which builds them from page `nav`, `nav.label`
  and `title`. The footer's social links come from `src/config/navigation.ts`, not content.
- **H2 fixed.** `SKILL.md:33-34` names Now, reading paths and assessment, matching #202's body.
- **L1 fixed** (`SKILL.md:92`: "nothing outside `src/content/`, no file under
  `src/content/schemas/`, and no test"). **L2 fixed** (`:64`). **L3 fixed** (`:39`, matches
  `src/lib/content/navigation.ts:31-37`). **L4 fixed** (`:82`; `feat(content):` is used on
  `main`, e.g. e9946235). **L5 fixed** (`_shared/preview-check.md:3`). **L6 fixed** (`:56`).

### Shared files and scope

- `_shared/visual-baselines.md` (Included-by line plus one clause) and `_shared/preview-check.md`
  (Included-by line) are minimal and accurate. Both go beyond Acceptance 5's "no other wording in
  `_shared/` changes", but they are the round 1 fixes recorded in `plan.md` W1, so not scope creep.
- No `_shared/` wording is restated in `content/SKILL.md`: the three Acceptance 4 strings occur
  0 times, and `TextBlock|Offerings` does not occur. The skill's "why this is enough" sentence
  (`:105-107`) paraphrases the visual-baselines premise for the content case and points to the file
  for the procedure; acceptable.
- Nothing beyond plan + round 1 fixes. No change to `src/`, `tests/`, `scripts/`, `.github/`,
  schemas or content. No check weakened.

### Spot-checks (all correct)

`test:build:content` script lists the four build tests and `tests/build/indexing.test.ts:36-40`
runs `astro build` for main and preview environments; `verify:quick`, `fonts:diagrams`,
`lint:secrets` exist in `package.json`; project file names up to 64 characters
(`src/lib/content/addresses.ts:59`), `problem` at most 140 characters and 1 to 4 themes
(`schemas/project.ts:20,57`); Now topics up to 200 characters (`schemas/now.ts:17`); reading-path
description ends in a full stop and position 1 to 4 (`schemas/reading-path*.ts:20,32`); assessment
five shifts of three statements, scale "Rarely" to "Almost always" (`schemas/assessment.ts:19-34`);
docs headings "Landing files", "Components", "Assessment components", "Text in a diagram",
"Where a test goes", "Real content in tests" exist; the three cited guard tests exist.

### Findings

#### CRITICAL

None.

#### HIGH

None.

#### LOW

- **R2-L1** `.claude/skills/content/SKILL.md:108-109` lists "hiding", "`visible` or `draft`" as
  menu changes that move the shell baselines. They do not: the Playwright build has no
  `WORKERS_CI`, so `includeDrafts()` is true (`src/lib/build-mode.ts:18-19`) and `getPages()`
  keeps `visible: false` pages in the menus (`src/lib/pages.ts:29-30`); `draft` never filters
  menus. Only adding, removing or moving a `nav` setting, a `nav.label`, or the title of a menu
  page without a label moves them. The error is on the safe side (an unneeded Docker refresh
  and a question to Don), so LOW. Suggested wording: "a menu change (adding, removing or moving a
  page's `nav`, a `nav.label`, or the title of a menu page)".
- **R2-L2** `.claude/skills/content/SKILL.md:56`, `:64`, `:82` are unwrapped long lines from the
  round 1 edits, unlike the ~100-column wrap of the rest of the file. Cosmetic.

### Measurement

After `git fetch origin`, `node scripts/ci/changed-paths.ts --base origin/main` printed
`tier=docs: 8 documentation file(s) and 3 skip-safe file(s), running secretlint and the unit tests`.
Local gate for this tier: `pnpm run lint:secrets && pnpm run test:unit` (unchanged since W3, no
code touched by the round 1 fixes).

### Follow-ups for the PR body

- Author docs for the YAML collections (career, reading paths, Now, assessments).
- #199–#203 each update their named section of `/content` when they land.
- If R2-L1 is left as is, note that a `visible`/`draft` flip on a menu page does not in fact need
  a baseline refresh.
