# Review report: shared-pipeline-wording (issue #96)

Reviewed `git diff ffeeec4...HEAD` (origin/main at ffeeec4) on `chore/shared-pipeline-wording`,
commits 669cdf5 (plan) and f1f851e, cfbf05c, 1479dcd, 59fd3b5, e19ba82 (W1 to W5). Written by
the orchestrator from the review subagent's returned text (the subagent may not write files).

## Verdict

All five work items are done as planned, and nothing outside the plan changed. The diff covers
17 files: the plan, four new `_shared/*.md`, four `SKILL.md`, four deleted tests, `CLAUDE.md`,
`docs/testing.md`, `scripts/ci/changed-paths.ts` and `tests/unit/ci/changed-paths.test.ts`.
`tests/unit/ci` is green (5 files, 150 tests, drift guard included). `tests/unit/setup` with
`tests/unit/setup-check` is green (51 files, 664 tests).

**Findings: CRITICAL 0, HIGH 0, LOW 7.**

## Checks

- **Work items.** W1 deleted exactly the four test files. W2 created exactly `verify-gate.md`,
  `visual-baselines.md`, `preview-check.md` and `open-pr.md`, with no `SKILL.md` in
  `_shared/`. W3 matches the plan item by item and keeps chore's "A chore that changes the gate
  itself…" sentence, the per-skill visual lead-ins and the per-skill major-change remarks
  (chore `.github/`, squash contact API/headers/CI, tweak's triage re-check). W4 and W5 match
  the plan.
- **Tests named in the plan.** `tests/unit/ci/changed-paths.test.ts` is green, with the new
  SAFE entries, the reduced UNSAFE list, the "skips when only pipeline skills, shared wording,
  CLAUDE.md or the constitution change" case and the setup-walkthrough deny-list case.
- **Coverage mapping.** Honest. pr-author, the inner-loop paragraph, the verify:quick sentence
  and visual S1 to S3 now exist once in `_shared/`. The tombstones, the alignment checks, the
  layer-naming phrases, the constitution and `docs/testing.md` section texts and the
  `package.json` `verify:quick` check are explicitly retired. The pointers resolve: the
  constitution's "## Development Workflow" has the test-placement bullet, and `docs/testing.md`
  has "## Where a test goes".
- **No shared block restated.** None of these occurs in any of the four skills:
  `A visual diff nobody predicted`, `gh auth switch --user drc-agents`, `## Local toolchain`,
  `E2E is for journeys`, ``only the full `pnpm run verify` ``. The inner-loop body text occurs 0
  times in the skills and in `CLAUDE.md`.
- **Pointers at the point of use and in subagent prompts.** Every skill names `verify-gate.md`
  (3 times), `visual-baselines.md` (2) and `open-pr.md` (2). deliver, tweak and chore name
  `preview-check.md`; squash does not, as planned. The common prompt frame of all four skills
  has the Local toolchain sentence. The implement and fix prompts, and every "dispatch a fix
  subagent" line, name `verify-gate.md`. LOW-1 and LOW-2 cover two prompt gaps.
- **Shared files standalone.** No "step N", "above" or "below" references (see LOW-3).
- **Moved text vs. old.** The inner-loop paragraph and visual S1 to S3 are verbatim (S2's
  trailing colon became a period). The additions are deliberate and come from `CLAUDE.md` or
  the plan: the Docker image note, "Do not fall back to CI without asking" and "copy only the
  `*-linux.png` files". The verify:quick sentence gains the targeted-run line, as planned.
  `open-pr.md` shrinks the merge wording as Don directed on the issue (LOW-4). The
  classification step no longer copies the Principle III list; it points to the constitution's
  list, which has the same six criteria.
- **CLAUDE.md pointers.** The Visual baselines section and the Docker bullet point to
  `_shared/visual-baselines.md`, which exists. The Orchestration skills paragraph keeps one line
  of cadence history, and the alignment list is one paragraph naming `_shared/`.
- **docs/testing.md.** The skip-safe row lists only `setup-walkthrough`'s `SKILL.md` as read by
  a check, and adds a sentence on pipeline skills, `_shared/`, `CLAUDE.md` and the constitution.
- **Stale references.** Outside `.specify/chores/`, `.specify/bugs/` and `specs/`, nothing names
  the deleted test files.
- **Principle III.** Still right: **major**, because `scripts/ci/changed-paths.ts` decides the
  CI tier (criterion: CI, deployment or infrastructure configuration). No other criterion fires.
- **No check weakened beyond intent.** Only `READ_BY_CHECKS` changed. Newly skip-safe: the four
  pipeline `SKILL.md` files, `CLAUDE.md` and `.specify/memory/constitution.md`, with
  `_shared/*.md` under the existing `.claude/` prefix. No test reads any of them, and the drift
  guard still fails closed if a test starts reading one.

### Ruling on acceptance criterion 2 vs. the W3 pointer wording

Criterion 2 asks for 0 occurrences of `**Inner loop and gate.**` in the skills. W3 prescribes
the pointer "**Inner loop and gate.** Read `.claude/skills/_shared/verify-gate.md` and follow it
exactly", so each skill keeps the label once. **The W3 wording governs, and criterion 2 is met
in intent:** the paragraph body occurs 0 times in the skills. Report 4 pointer labels and 0
paragraph bodies.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. `.claude/skills/deliver/SKILL.md:170-179`: the quoted phase 7 implement prompt does not name
   `_shared/preview-check.md` itself; only step 4 (lines 185-187) tells the orchestrator to pass
   it on. This predates the chore, but it is the issue's "agent skips the read" risk.
2. `.claude/skills/chore/SKILL.md:194` and `:202-216`: the plan row and the phase 3 quoted prompt
   do not name `_shared/preview-check.md`; only step 5 does. "Tick the item in `plan.md`"
   conflicts with "leave unticked" unless the step 5 pointer is added. Predates the chore.
3. `.claude/skills/_shared/preview-check.md:3`: says squash reaches it "through `open-pr.md`",
   but `open-pr.md` mentions the marker without naming `preview-check.md`. Nothing breaks, but
   the sentence overstates the link.
4. `.claude/skills/_shared/open-pr.md:10-22`: shorter than the old PR author block. It drops "so
   Don knows how closely to read it…", "so `gh` is never left on `drc-agents`" and "do not work
   around the ruleset". Behaviour is unchanged and this follows Don's direction on the issue;
   the PR body should call it a deliberate wording change.
5. `.claude/skills/deliver/SKILL.md:103`, `tweak/SKILL.md:147` and `squash/SKILL.md:107`: the
   tasks and fix rows still name the baseline commands instead of pointing to
   `_shared/visual-baselines.md`. The plan left these rows alone.
6. `.claude/skills/chore/SKILL.md:193`: the explore row still lists "an alignment rule" as a
   constraint to look for. Generic and harmless.
7. Cosmetic: prose lines over 100 characters at `CLAUDE.md:18`, `deliver/SKILL.md:203`,
   `deliver/SKILL.md:219` and `chore/SKILL.md:187`, and nested parentheses in "via the `perl`
   alarm (CLAUDE.md, Local toolchain)" in all four skills.

## Before / after

| Measure | Before (ffeeec4) | After (e19ba82) |
| --- | --- | --- |
| `SKILL.md` lines: deliver / tweak / squash / chore | 320 / 286 / 255 / 369 = **1230** | 246 / 221 / 185 / 292 = **944** (−286) |
| `_shared/*.md` lines | 0 | open-pr 22 + preview-check 11 + verify-gate 20 + visual-baselines 29 = **82** |
| Alignment tests (4 files) | **354 lines** | **0** |
| `**Inner loop and gate.**` in skills / `_shared/` | 4 / 0 | 4 pointer labels (0 bodies) / 1 |
| `A visual diff nobody predicted` in skills / `_shared/` | 4 / 0 | 0 / 1 |
| `gh auth switch --user drc-agents` in skills / `_shared/` | 4 / 0 | 0 / 1 |
| `## Local toolchain` in the skills | 4 | 0 |
| `E2E is for journeys` in the skills | 4 | 0 |
| ``only the full `pnpm run verify` `` in the skills | 4 | 0 |
| `READ_BY_CHECKS` entries | **7** | **1** |
| `CLAUDE.md` lines | 101 | 79 |

## Follow-ups for the PR body

1. `tests/component/PageLayout.test.ts:57` "adds no share bar" asserts no `share` substring
   anywhere in the rendered HTML. Dev renders emit `data-astro-source-file` with the absolute
   path, so it fails in any checkout whose path contains "share", as this worktree's does. Fix:
   assert on the share-bar element instead.
2. LOW-1 and LOW-2: move the `preview-check.md` pointer into the deliver phase 7 quoted prompt
   and the chore plan row and phase 3 prompt, and resolve the "Tick the item" conflict.
3. LOW-5: point the deliver and tweak tasks rows and the squash fix row at
   `_shared/visual-baselines.md`.
4. Carried over from the plan: `CLAUDE.md` "Merging" overlaps `_shared/open-pr.md`; similar but
   unshared per-skill wording is now unguarded; the classifier blocking `gh pr merge` from
   background jobs is not in `open-pr.md`; historical plans and reports naming the deleted tests
   are left as they are.
