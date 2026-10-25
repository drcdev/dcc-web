# Review report: content-only-data-tier (issue #199)

Reviewer: fresh-eyes review phase, 2026-10-25, on `a73e2490` (`git diff main...HEAD`).

## Summary

W1 and W2 are done as planned and nothing beyond them. The diff touches `scripts/ci/changed-paths.ts`, `tests/unit/ci/changed-paths.test.ts`, `docs/testing.md`, `.claude/skills/content/SKILL.md` and the plan: 4 files outside `.specify/`, +48/-7. No `.github/`, `package.json`, schema, loader, component, page, fixture or baseline file changed, so nothing changes for a reader. No check is removed or weakened, and the tier rule still fails closed. The content-only tier still runs lint, type check, unit tests, worker tests, `e2e` (the real `pnpm run build`) and `test:build:content`, where `indexing.test.ts` runs `astro build` on the real content in two environments.

## Checks

| Check | Result |
|---|---|
| W1 pattern as planned | Yes. `CONTENT_DATA` (`scripts/ci/changed-paths.ts:74-75`) is anchored `^...$` and names `career`, `reading-paths` and `assessments` one by one. It allows `[A-Za-z0-9._-]+\.yaml` with no `/`, so no sub-folder, and matches `now/now.mdx` by exact name. There is no broad `src/content/` prefix and no image pattern for the data folders. `isMalformed` still runs first (`:78`). |
| Rejects what it should | The plan's rows and these extra probes all give `false`: `.yml`, `.md`, a sub-folder, `now/other.mdx`, `now/now.md`, `career/images/x.png`, `x.yaml.ts`, `a b.yaml`, `schemas/career.ts`, `careerx/a.yaml`, a trailing `/`, `now.mdx.bak`, the prefix `xsrc/...`, a `..` path and an embedded newline. The existing malformed rows (`..`, leading `/`, `\`, space) still give `false`. |
| Tests named in the plan present | Yes. 4 `CONTENT_TRUE` rows, 10 `CONTENT_FALSE` rows (the 9 planned plus `a b.yaml`) and 4 `decide()` cases (all data kinds, data + docs, data + `src/lib/now.ts`, data + schema). They are at the unit layer, as the plan names, and use made-up entry names. |
| Tests green | `tests/unit/ci/changed-paths.test.ts` 183 passed and `tests/unit/ci/content-tier.test.ts` 3 passed, both under `perl -e 'alarm 300'` on node 24.4.1. |
| #199 safety claim | True. `.github/workflows/ci.yml:104-110` runs `test:build:content` on content-only. `e2e` (`:115`) and the `static` unit step (`:74`) run on every tier except skip-safe and docs. `package.json:23` keeps the four real-content build files. The four newly listed skipped build tests (`career-timeline`, `home-sections`, `assessment-scripts`, `question-source`) use `tests/fixtures`. |
| Docs match code | `docs/testing.md:62` (content-only row), the new coverage row at `:89`, the header comment at `changed-paths.ts:11-12` and the `/content` "Gate" section all agree. The `#199` / "State today: a YAML" grep on the skill prints nothing. `_shared/verify-gate.md:20` lists no file kinds, so it stays correct, and no `_shared/` block is restated. |

## Findings

### CRITICAL
None.

### HIGH
None.

### LOW
1. `tests/unit/ci/changed-paths.test.ts:205-228`: the new `decide()` data-file cases sit inside `describe("decide() docs tier")` (`:173`), not the general `describe("decide()")` block at `:237`. They test the content-only tier, so the block name misleads a reader. This is cosmetic; the cases run and pass.
2. `docs/testing.md:89`: the new coverage row says "the rule against naming real entries in tests covers it". The guard for that rule, `tests/unit/content/no-real-content-in-tests.test.ts`, builds its search strings from posts, projects and pages only (`docs/testing.md:155-160`). It does not check career, reading-path or assessment file names, so for data entries the rule is written policy, not an automated check. The plan's Risks section accepts this, so the issue is wording, not a gap the diff introduces.
3. `docs/testing.md:87-89`: the fixture builds in the skipped files are not purely fixture data. `tests/build/fixture-site.ts` keeps the real `src/content/now/now.mdx` (unless `now` is passed) and the real `src/content/assessments/wayfinder.yaml` in every copy. `fixture-site.test.ts:113-118` (S2, `realPosts`) keeps the real reading paths and lists their names. No gap follows: the Now and assessment files stand alone and use the same schema as the real build. S2 reads names from the folder at run time instead of naming an entry. `indexing.test.ts` and `pnpm run build` still cover every one of these files. The coverage rows could say so.

## Measurement

| | Before (`f7f62cd8`, plan) | After (`a73e2490`, this review) |
|---|---|---|
| `isContentOnly()` on the 11 real data files (7 career, 2 reading-paths, `assessments/wayfinder.yaml`, `now/now.mdx`) | `false` for all 11; a diff of only them prints `tier=full` | `true` for all 11; `decide()` on all 11 returns `content-only` |
| `tests/unit/ci/changed-paths.test.ts` | 165 passed | 183 passed (+18: 4 true rows, 10 false rows, 4 `decide()` cases) |

## Follow-ups for the PR body

- Optional: move the four data-file `decide()` cases into the `decide()` block, or rename `decide() docs tier` (LOW 1).
- Optional: add career, reading-path and assessment file names to the search strings in `no-real-content-in-tests.test.ts`, so the rule against real entries in tests is checked for data collections as it is for posts and projects (LOW 2).
- Optional: say in the `docs/testing.md` coverage table that fixture builds carry the real Now and assessment files and that S2 keeps the real reading paths (LOW 3).
- CI runs the full tier on this PR because it changes `scripts/ci/`; CI is the gate.
