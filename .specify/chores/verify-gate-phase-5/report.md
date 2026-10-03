# Review report: verify-gate-phase-5 (issue #26 phase 5, D7)

Reviewed `git diff main...HEAD` (commits c27f67b, 4800aa5, 2cd3be3, 2814769) against `plan.md`
with fresh eyes. Read-only on everything except this file.

## Verdict

All three work items are done as planned and nothing beyond them. The guard is green (17/17),
the existing alignment guards are unchanged and green, and the full unit suite is green at 172
files / 2422 tests. No CRITICAL or HIGH findings. Principle III verdict **MAJOR** (the
constitution itself) stands: no auto-merge.

## Checks

1. **Scope.** The diff touches only the four pipeline `SKILL.md` files, `CLAUDE.md`,
   `docs/testing.md`, `.specify/memory/constitution.md`, the new guard and `plan.md`. Nothing
   under `src/`, `scripts/`, `.github/` or `.specify/templates/` changed.
   `pipeline-verify-wording.test.ts` and `pipeline-pr-author.test.ts` are not in the diff.
2. **Tests present and green.** `tests/unit/setup/pipeline-test-placement.test.ts` exists with
   every case the plan names: `describe.each` bullet-once (4), seven row phrases, three stale
   phrases, the alignment loop, the constitution slice and the `docs/testing.md` section.
   Re-run: `vitest run --project unit tests/unit/setup tests/unit/ci` gave 59 files /
   878 tests passed, 3.1 s (this includes `changed-paths.test.ts`, whose drift guard scans the
   new file, `workflows.test.ts` and `drift.test.ts`).
3. **The guard asserts what the plan says.** The constants match the plan word for word. Each
   check uses `count(flat(skillText(name)), phrase) === 1`, so it pins presence and
   uniqueness while ignoring line wrapping. If one pipeline lost the bullet, `count` would
   return 0, and both its `describe.each` case and the alignment loop (`${name}: bullet`)
   would fail. A reworded copy in one file fails the same way, because the needle is the
   exact flattened text. The constitution case slices `## Development Workflow` to
   `## Governance` and asserts both phrases without pinning the version. The docs case
   slices "Where a test goes" up to the next `\n## ` and asserts `one primary layer` and
   `Development Workflow`. The file has no `specs/` literal and no other quoted skill name.
4. **Alignment.** CLAUDE.md "Keep the four pipelines aligned" gains the test-placement entry
   after the Inner loop entry (CLAUDE.md:81-83). The bullet sits in `## Rules` directly
   between the Test-first and Release gate bullets in all four (deliver:40, tweak:89,
   squash:40, chore:88). The squash fix row and the chore implement step changed in the same
   line or hunk as the `verify:quick` sentence, but the sentence itself is unchanged. The
   word diff shows edits only before it, and `pipeline-verify-wording.test.ts` passes
   unchanged. The Inner loop paragraph and the PR author block have no hunks.
5. **Constitution.** The new bullet (constitution.md:193-198) covers every part of D7. It
   gives one primary layer, the cheapest that can observe the behaviour, and keeps E2E for
   journeys and browser-only behaviour. Build tests cover build-only behaviour, and a11y and
   visual checks cover templates, not stories. Every test task names its layer, and a second
   layer needs a written reason. The bullet sits right after "Tasks are ordered so tests
   come before…".
   The Sync Impact Report has the version change, the MINOR rationale, modified principles
   (none), added and removed sections (none), other changes, templates reviewed and
   follow-up TODOs. It has no bracket placeholder tokens. The footer reads `2.1.0 |
   Ratified 2026-09-28 | Last Amended 2026-10-02`, with ISO dates that match the report.
   MINOR fits Governance ("materially expanding" a principle's application, with nothing
   removed or redefined). Nothing else in the constitution changed. All of the
   `speckit-constitution` skill's required file outputs (steps 2, 4, 5 and 6) are present.
   The step-7 chat summary is transient and cannot be checked from the diff. The optional
   `after_constitution` git hook matches commit 2814769.
6. **docs/testing.md.** One paragraph was added after the "Where a test goes" bullet list
   (docs/testing.md:108-109). It points to the constitution and does not restate the rule.
   The layer table and contract mapping are untouched.
7. **Principle III and checks.** The verdict is MAJOR (the constitution itself), and no other
   criterion fires. No check is weakened: guards were only added. There are no secrets.
8. **Markdown.** Table rows in all four skills stay single lines. The bullets are nested
   `  - ` items like their siblings. No sentence is duplicated.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **`.specify/memory/constitution.md:197`.** The constitution says "Every **test task**
   names its layer". The pipelines' shared bullet says "Every **planned test** (a test task,
   a reproducing test or a work item's test)". The `docs/testing.md:108` pointer also says
   "every test task". `/squash` and `/chore` have no "test tasks", so the binding text is
   narrower than the pipelines apply it. That is harmless in practice, because the pipelines
   are stricter. A later PATCH amendment could say "every planned test". This follows the
   plan's verbatim amendment input, so it is not a deviation.
2. **`docs/testing.md:107` vs `:108-109`.** The doc says a second layer's reason is "written
   in the test's comment". The new pointer and the pipeline rows put the reason "in the task
   text". These are complementary, not contradictory (the task gives the reason and the test
   carries it). A future edit could say both explicitly.
3. **`.claude/skills/chore/SKILL.md:227`.** The implement step's line grew to 96 characters
   because the insertion was not re-wrapped. This is cosmetic. Re-wrapping would touch the
   same lines as the `verify:quick` sentence's paragraph, and the guard flattens whitespace,
   so it is safe either way. Leaving it as is avoids churn near protected text.
4. **`tests/unit/setup/pipeline-test-placement.test.ts:83-87`.** The guard pins the bullet's
   presence and uniqueness, not its position in `## Rules`. A move to another section would
   pass. This is acceptable, because the alignment intent is the text, as for the PR author
   guard.

## Measurement

| Measure                                   | Before (plan) | After (review)            |
| ----------------------------------------- | ------------- | ------------------------- |
| `pnpm run test:unit` files                | 171           | 172                       |
| `pnpm run test:unit` tests                | 2405          | 2422 (+17, the new guard) |
| `pnpm run test:unit` duration             | 6.5 s         | 6.8 s                     |
| `.claude/skills/deliver/SKILL.md` lines   | 313           | 323                       |
| `.claude/skills/tweak/SKILL.md` lines     | 277           | 287                       |
| `.claude/skills/squash/SKILL.md` lines    | 249           | 259                       |
| `.claude/skills/chore/SKILL.md` lines     | 366           | 376                       |
| `.specify/memory/constitution.md` lines   | 219 (v2.0.0)  | 214 (v2.1.0)              |
| `pipeline-verify-wording.test.ts` lines   | 72            | 72 (unchanged)            |
| `pipeline-pr-author.test.ts` lines        | 66            | 66 (unchanged)            |
| `pipeline-test-placement.test.ts` lines   | n/a           | 157 (new)                 |
| `CLAUDE.md` / `docs/testing.md` lines     | n/a           | 93 / 319 (+3 each)        |

No timing change is expected or claimed from this phase. The constitution is shorter because
the 2.0.0 Sync Impact Report was longer than the 2.1.0 one. CI wall time comes from this PR's
own `verify` run and goes in the PR body and the phase 6 comment on issue #26.

## Follow-ups for the PR body

1. Add a layer field to `.specify/templates/tasks-template.md` and the `speckit-tasks`
   instructions, or contribute it upstream. (These still call tests optional; the pipelines
   override that.)
2. A future amendment could list build, visual and budget tests in Principle I's "Test
   layers". It could also widen "every test task" to "every planned test" (LOW 1).
3. Deliver's analyze phase could flag test tasks that have no layer.
4. Phase 6: re-measure and close #26 (the PR says `Part of #26`).
5. Note the divergence from `.reference/cadence`: deliver, tweak and squash now carry the
   test-placement bullet and row phrases, which cadence lacks, so a later port must not drop
   them.
6. Review is MAJOR (constitution amendment). Open the PR from `drc-agents` and leave
   auto-merge off.
