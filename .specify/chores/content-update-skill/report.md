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
