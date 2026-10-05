# Chore plan: shared-pipeline-wording (issue #96)

Branch: `chore/shared-pipeline-wording`, from `main` at ffeeec4 (after #108 merged).
Issue: https://github.com/drcdev/dcc-web/issues/96. The PR body says `Closes #96`.

## Goal

[#96](https://github.com/drcdev/dcc-web/issues/96): the four pipeline skills (`/deliver`,
`/tweak`, `/squash`, `/chore`) each carry the same blocks of wording: local toolchain, inner loop
and gate, visual baselines, test placement, `[PREVIEW-CHECK]` and the PR author account. Four unit
tests (354 lines) check that the copies match, and one of them holds a whole paragraph as a string.
So one wording change is made five or six times, and because the skills are on `READ_BY_CHECKS`,
it runs the full CI gate. This chore moves each shared block into one file under
`.claude/skills/_shared/`, which each skill tells its phase to read and follow exactly. This is the
pattern cadence uses (`.reference/cadence/.claude/skills/_shared/e2e-watch-rules.md`). With one
copy there is nothing to drift, so the four alignment tests and their tombstone cases are deleted.
`READ_BY_CHECKS` shrinks to the one file a test still reads, and the `CLAUDE.md` alignment list
becomes one line. The merge wording shrinks to what Don stated on the issue: open the PR from
`drc-agents` and arm auto-merge, which waits for his approval. The pre-PR pause already left all
four skills in PR #105, so nothing is moved for it. No visitor-facing behaviour changes, and no
page, route, style or script changes.

## Acceptance

Before-measurement (2026-10-05, `wc -l` and `grep -cF` at ffeeec4):

| Measure | Before |
|---|---|
| `SKILL.md` lines: deliver / tweak / squash / chore | 320 / 286 / 255 / 369 = **1230** |
| Alignment tests `tests/unit/setup/pipeline-{pr-author,test-placement,verify-wording,visual-baselines}.test.ts` | 66 + 157 + 72 + 59 = **354 lines**, 4 files |
| Copies across the four skills of `**Inner loop and gate.**`, `A visual diff nobody predicted`, `gh auth switch --user drc-agents`, `## Local toolchain`, `E2E is for journeys`, ``only the full `pnpm run verify` `` | **4 each** |
| `READ_BY_CHECKS` entries | **7** (five `SKILL.md`, `CLAUDE.md`, the constitution) |
| `CLAUDE.md` lines | 101 |

Mechanical criteria once done:

1. `.claude/skills/_shared/` holds exactly `verify-gate.md`, `visual-baselines.md`,
   `preview-check.md` and `open-pr.md`, and no `SKILL.md`.
2. Each of the six phrases in the table occurs **0** times across the four `SKILL.md` files.
   Each of `**Inner loop and gate.**`, `A visual diff nobody predicted` and
   `gh auth switch --user drc-agents` occurs exactly **once** under `.claude/skills/_shared/`.
3. Each of the four `SKILL.md` files names `_shared/verify-gate.md`,
   `_shared/visual-baselines.md` and `_shared/open-pr.md`. deliver, tweak and chore also name
   `_shared/preview-check.md`. Each skill's common subagent prompt frame names the Local toolchain
   section of `CLAUDE.md`. Check with `grep -c`.
4. The four `tests/unit/setup/pipeline-*.test.ts` alignment files are gone.
   `tests/unit/setup-check/checks/pipeline-secrets.test.ts` is unrelated and stays.
5. `READ_BY_CHECKS` in `scripts/ci/changed-paths.ts` is exactly
   `[".claude/skills/setup-walkthrough/SKILL.md"]`. `tests/unit/ci/changed-paths.test.ts`
   is green, drift guard included, and treats the four pipeline skills, `_shared/*.md`,
   `CLAUDE.md` and the constitution as skip-safe.
6. In `CLAUDE.md`:
   - the "Keep the four pipelines aligned" list is one line naming `.claude/skills/_shared/`;
   - "Diff against it when porting further changes" is gone, and cadence is at most one line of
     history;
   - the Visual baselines section points to `_shared/visual-baselines.md` and no longer
     contains S1 to S3.
7. The skip-safe row of the change-tiers table in `docs/testing.md` lists only
   `setup-walkthrough`'s `SKILL.md` as read by a check.
8. Outside `.specify/chores/`, `.specify/bugs/` and `specs/`, nothing names the deleted test files
   (`grep -rn "pipeline-pr-author\|pipeline-test-placement\|pipeline-verify-wording\|pipeline-visual-baselines"`).
9. No new test restates skill, doc or config text. `pnpm run verify:quick` passes after each
   item, and the orchestrator runs the full `pnpm run verify` before the PR.

Expected after: the four skills shrink by roughly 200 to 250 lines in total, the tests lose 354
lines, and `_shared/` gains about 80 lines. The review records the real figures.

## Scope

**In:** W1 to W5 below.

**Out (follow-ups for the PR body):**

1. **`CLAUDE.md` "Local toolchain" and "Merging".** These are `CLAUDE.md`'s general rules for every
   agent, not copies inside the four skills. They stay. The skills point to Local toolchain
   instead of copying it (judgment call J1). Merging overlaps `_shared/open-pr.md`. If Don wants
   Merging cut to a pointer as well, that is a small follow-up.
2. **Per-skill wording that is similar but not shared:**
   - the layer-naming phrases in the tasks, fix, assess, plan, implement and review rows;
   - the "foreground with an explicit time limit" verify step;
   - the per-pipeline lead-ins to the major-change and visual steps.

   These say different things per pipeline and stay in each skill. Their guards are retired with
   the tests (W1). They are not moved.
3. **The classifier blocking `gh pr merge` from background jobs** (memory note) is not written
   into `open-pr.md`. That would add behaviour, not move wording.
4. Historical plans and reports under `.specify/chores/`, `.specify/bugs/` and `specs/` that name
   the deleted tests or the old alignment rule are not edited.

## Constitution Check

- **I. Test-First:**
  - W4 changes behaviour (which files `isSkipSafe` treats as skip-safe). It is test-first: the
    `changed-paths.test.ts` expectations change first and are seen failing, then
    `READ_BY_CHECKS` changes.
  - W1 removes tests, with every assertion mapped below.
  - W2, W3 and W5 are agent instructions and docs: `no behaviour` lines. Principle I lists code
    and configuration, not agent instructions (issue #96).
- **II. Automated Release Gate:** no check is weakened. The text the alignment tests compared will
  exist only once, so there is nothing left to compare. `verify` stays required. The skip-safe
  tier already exists for unread files. Files no test reads moving into it follows the module's
  own rule ("A path is skip-safe only when no check reads it"), and the drift guard still fails
  if a test starts reading one.
- **III. Human Review for Major Changes:** fires **CI, deployment or infrastructure
  configuration**: `scripts/ci/changed-paths.ts` decides which CI tier runs. Nothing else fires
  (no dependency, contact data, design, cost or constitution change). Verdict: **major**. The
  verdict and criterion go in the PR body. Auto-merge is armed by default, and the PR merges on
  Don's approval and a green `verify`.
- **IV. First-Party Before Custom:** uses Claude Code's documented supporting-files pattern
  (Markdown files read on demand, referenced from `SKILL.md`). No custom loader and no new test
  harness.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected. No secrets are touched, and `.env` is not read.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected. CI minutes go down, because skill-only edits now run the
  skip-safe tier.
- **X. Accessible, Fast and Private:** unaffected. No visual baselines change.
- **XI. Spec Kit Workflow:** chore pipeline, on a `chore/` branch with the plan in
  `.specify/chores/shared-pipeline-wording/`. The `/chore` alignment rule is rewritten in W3 to
  point at `_shared/`.

## Decisions

The issue has no tick-box decisions. Don's direction on the issue and in PR #105 applies:

- every PR needs one approval, and the major-change flow is retired;
- the pre-PR pause is gone and is not moved;
- the shared merge wording shrinks to: open from `drc-agents` and arm auto-merge, which waits for
  his approval;
- no new tests restate config text.

There are no `[NEEDS DECISION]` items. The review may challenge any of these calls:

- **J1. The Local toolchain lives in `CLAUDE.md`, not in `_shared/`.**
  - The four skills' toolchain block is a strict subset of `CLAUDE.md`'s Local toolchain section.
  - `CLAUDE.md` is loaded into every agent's context, subagents included, so it is already one
    copy that is always present.
  - A `_shared/local-toolchain.md` would be either a second copy or a pointer to a pointer.
  - Each skill's common prompt frame (the top of every phase) points to it instead. That also
    meets the issue's "risk" note better than a `_shared` file could, because there is no file
    to skip.
  - This departs from the issue's literal "shared blocks live in `_shared/`" for this one block,
    and the PR body says so.
- **J2. Test placement gets no shared file.** As the issue asks, the bullet becomes a pointer to
  the constitution's Development Workflow and "Where a test goes" in `docs/testing.md`. Those two
  are where the rule lives.
- **J3. `[PREVIEW-CHECK]` gets a small shared definition (`preview-check.md`).**
  - Today the wording varies per skill and nothing guards it.
  - One definition fixes what the marker means and what subagents and the orchestrator do with
    it.
  - Which artifact holds it (`tasks.md` or `plan.md`) stays in each skill.
- **J4. The major-change classification moves into `open-pr.md` and points to the
  constitution's Principle III list instead of restating it.** The per-pipeline remarks stay in
  each skill:
  - chore: "chores fire these more often… `.github/` is major";
  - squash: "a bug fix rarely fires one…";
  - tweak: the re-check of triage condition 1.
- **J5. Delete all four test files whole.** This includes the non-alignment cases:
  - the constitution and `docs/testing.md` section texts;
  - `package.json` defining `verify:quick`;
  - the layer-naming phrases and the tombstones.

  They all assert that document or config text exists (Don's "no tests restate config text"),
  and keeping any of them would keep a file on `READ_BY_CHECKS`. The mapping below is honest
  about what is retired.
- **J6. `CLAUDE.md` Visual baselines becomes a pointer.** Baselines are refreshed rarely and
  only by the pipelines or by Don on request, so a pointer costs little. It removes the fifth
  copy that the visual test guarded.

## Work items

Every implement subagent: use the run wrapper the orchestrator names (node 24, the pnpm shim, the
perl alarm). Run the targeted vitest files before and after, then `pnpm run verify:quick`.
Nothing in this chore changes a page, so no visual baselines.

### W1 — Delete the four alignment tests

- [x] W1 done
- **Files:** delete these, one `git rm` per call:
  - `tests/unit/setup/pipeline-pr-author.test.ts`
  - `tests/unit/setup/pipeline-test-placement.test.ts`
  - `tests/unit/setup/pipeline-verify-wording.test.ts`
  - `tests/unit/setup/pipeline-visual-baselines.test.ts`

  This item comes first because W3's skill edits would turn them red.
- **Test:** existing. `tests/unit/ci/changed-paths.test.ts` (drift guard) must stay green, and so
  must `pnpm run verify:quick`. `READ_BY_CHECKS` is still a superset at this point, so the drift
  guard passes.
- **Layer:** none added or moved.
- **Coverage mapping:**

  | Removed assertion | Where the guarantee lives now |
  |---|---|
  | pr-author: switch to `drc-agents` before `gh pr create` and back to `drcdev` after, "whether it succeeded or failed" (×4 skills) | `_shared/open-pr.md`, the only copy. Every skill's Finish points to it. A test that the text exists is retired (restates instruction text; Don, PR #105). |
  | pr-author: `gh pr view <n> --json author`, `author.login`, stop unless `drc-agents` (×4) | Same: `_shared/open-pr.md`. Presence test retired. GitHub's own-approval rule still blocks a `drcdev`-authored PR from being approved. |
  | pr-author: denied / keyring / `AskUserQuestion` / never open as `drcdev` (×4) | Same: `_shared/open-pr.md`. Presence test retired. |
  | pr-author: block identical in all four | Guarantee retired: one copy cannot drift. |
  | verify-wording: Inner loop and gate paragraph exactly once per skill | `_shared/verify-gate.md`, the only copy. Retired as a text test. |
  | verify-wording: verify:quick sentence exactly once per skill | `_shared/verify-gate.md`, the subagent rule. The implement and fix prompts point to it. Retired as a text test. |
  | verify-wording: no "There is no scoped or tiered E2E" (tombstone) | Guarantee retired: the stale sentence is gone, and the only copy is reviewed on every PR. |
  | verify-wording: alignment (all four) | Guarantee retired: one copy. |
  | verify-wording: `package.json` defines `verify:quick` | Guarantee retired. No CI job runs `verify:quick`. A missing script fails loudly the first time an implement or fix subagent runs it (`pnpm` reports a missing script), and `docs/testing.md` "Inner loop" documents it. That is detection at use, not in the gate, and it is accepted as such. |
  | visual-baselines: S1, S2 and S3 exactly once in each skill and in `CLAUDE.md` | `_shared/visual-baselines.md`, the only copy. `CLAUDE.md` and the skills point to it. Retired as a text test. |
  | visual-baselines: no "compares each snapshotted page" (tombstone) | Guarantee retired: the stale text is gone. |
  | test-placement: bullet exactly once per skill, and alignment | The rule lives in the constitution's Development Workflow (binding), with the detail in `docs/testing.md` "Where a test goes". Each skill's bullet points there (W3). Retired as a text test. |
  | test-placement: seven layer-naming phrase tests (deliver/tweak tasks rows, squash fix and assess rows, chore plan row, implement step and review row) | The phrases stay unchanged in each skill (W3 does not touch them), but nothing guards them. Guarantee retired. The binding rule is Development Workflow ("Every test task names its layer"), and the `/chore` review phase checks layers. |
  | test-placement: three stale per-story layer lists (tombstones) | Guarantee retired: the stale text is gone. |
  | test-placement: constitution Development Workflow carries "one primary layer" / "names its layer" | Guarantee retired. The constitution changes only through `speckit-constitution` and is reviewed on every PR that amends it (Governance). |
  | test-placement: `docs/testing.md` has "## Where a test goes" with the rule and the constitution pointer | Guarantee retired. If the heading is renamed, the skills' pointer dangles (see Risks). The review phase greps for it. |

### W2 — Create the shared files in `.claude/skills/_shared/`

- [x] W2 done
- **Files** (new). Each one opens with a heading, then one line saying it is included by
  `/deliver`, `/tweak`, `/squash` and `/chore` and must be followed exactly by the orchestrator
  and by every subagent told to read it, as cadence's `e2e-watch-rules.md` does. Text moves
  verbatim from the current skills unless noted.
  - `verify-gate.md`, "Inner loop and gate (shared)":
    1. The **Inner loop and gate** paragraph, verbatim (from deliver line 233).
    2. **For implement and fix subagents:** run the targeted vitest files or Playwright projects
       for the changed paths under the perl alarm. Then run `pnpm run verify:quick` under the
       perl alarm as the inner-loop check. Only the full `pnpm run verify`, which the
       orchestrator runs before the PR, counts as the gate. Never mark work done on a red suite.
       This is the current sentence, plus the targeted-run line that squash and chore already
       carry.
  - `visual-baselines.md`, "Visual baselines (shared)":
    1. S1 and S2, verbatim.
    2. The macOS update command (`pnpm run test:visual:update`) for the phase that changed a
       snapshotted surface on purpose.
    3. The Linux regeneration (`pnpm run test:visual:update:linux`, needs Docker Desktop).
    4. Ask Don to start Docker with an `AskUserQuestion` whose question text carries the
       instruction.
    5. Commit and push the images before opening the PR.
    6. The label fallback: `visual-baselines` label → `update-baselines` job →
       `gh run download` of `visual-baselines-linux` → copy only `*-linux.png` → review, commit,
       push. Until it lands, `verify` is expected red on visual only, and the PR body says so.
    7. S3, verbatim.

    Item 6 adds "copy only `*-linux.png`", which Don's agent memory records as required (the
    artifact holds both platforms). It is wording, not new behaviour.
  - `preview-check.md`, "The `[PREVIEW-CHECK]` marker (shared)":
    - Work a subagent cannot verify locally (it needs the preview deployment or Don's eyes) gets
      the suffix `[PREVIEW-CHECK]` in the phase artifact.
    - Subagents leave such items unticked and list them in their summary.
    - The orchestrator collects them for the PR body and the final report.
    - Auto-merge stays off while any are open (see `open-pr.md`).
  - `open-pr.md`, "Classify, open the PR and arm auto-merge (shared)":
    1. **Classification:** decide whether the change is a major change against the list in
       Constitution Principle III, without restating it. When in doubt, it is major. Put the
       verdict and the criteria that fired (or "none") in the PR body. The verdict does not
       change how the PR merges.
    2. **PR author account (required):** GitHub does not count an author's approval on their own
       PR, so open every PR from `drc-agents`:
       1. push as `drcdev`;
       2. `gh auth switch --user drc-agents`. If it is denied, fails, or the account is not in
          the keyring, stop and ask Don with `AskUserQuestion` (instruction in the question
          text). Never open the PR as `drcdev`;
       3. `gh pr create …`;
       4. `gh auth switch --user drcdev` straight after, whether it succeeded or failed;
       5. `gh pr view <n> --json author`. If `author.login` is not `drc-agents`, stop and tell
          Don the PR must be closed and reopened from `drc-agents`.
    3. **Auto-merge:** as `drcdev`, run `gh pr merge --auto --merge`. It waits for Don's approval
       and a green `verify`. Leave it off only while `[PREVIEW-CHECK]` items are open, and say so
       in the PR body.
- **Test:** `no behaviour: n/a (agent instructions; Principle I lists code and configuration,
  issue #96)`. Checked by acceptance criteria 1 to 3 (grep) and by the review.
- **Layer:** none.

### W3 — Point the four skills at `_shared/` and CLAUDE.md

- [x] W3 done
- **Files:** `.claude/skills/{deliver,tweak,squash,chore}/SKILL.md`. Apply the same edits to all
  four. The "Read … and follow it exactly" lines use the same wording in every skill.
  1. **Local toolchain (J1).**
     - Delete the `## Local toolchain` section.
     - Add one sentence to the common subagent prompt frame (the quoted block every phase
       gets): "Follow the Local toolchain section of `CLAUDE.md` for every `pnpm`, `astro`,
       `playwright` or `wrangler` call."
     - Add one line in Rules telling the orchestrator to do the same.
     - Replace "via the `perl` alarm above" (deliver 225, tweak 210, squash 175, chore 279)
       with "via the `perl` alarm (CLAUDE.md, Local toolchain)".
  2. **Test placement (J2).** Replace the Rules bullet with: "**Test placement.** Follow the
     test-placement rule in the constitution's Development Workflow; "Where a test goes" in
     `docs/testing.md` has the detail and the layer names." Leave the per-row layer-naming
     phrases unchanged.
  3. **Verify gate.**
     - Replace the Inner loop and gate paragraph (deliver Long-running-suites bullet; tweak,
       squash and chore under `## Verify`) with "**Inner loop and gate.** Read
       `.claude/skills/_shared/verify-gate.md` and follow it exactly."
     - Keep chore's extra sentence ("A chore that changes the gate itself…") after the pointer.
     - In each implement or fix prompt, replace the verify:quick sentence (and the targeted-run
       sentence where present) with "Read `.claude/skills/_shared/verify-gate.md` and follow
       it exactly." Put it at the start of the prompt's instructions:
       - deliver: the phase 7 step 2 prompt;
       - tweak: the implement row;
       - squash: the fix row;
       - chore: the phase 3 step 2 prompt.
     - Also name it in the "dispatch a fix subagent" lines of Verify and Finish.
  4. **Visual baselines.**
     - Keep each skill's own lead-in, reworded to stand alone:
       - deliver: "If the slice altered the shell, a template or the design system on purpose,
         the implement phase updated the macOS baselines.";
       - tweak: the same with "change";
       - squash: "A bug fix rarely changes them; if the fix phase reported an intended change,
         it updated the macOS baselines.";
       - chore: "A chore changes none of them, except a chore about the baselines themselves
         (a Playwright or browser upgrade) whose plan said so up front.".
     - After the lead-in: "Read `.claude/skills/_shared/visual-baselines.md` and follow it
       exactly." Delete S1 to S3 and the regeneration and fallback text.
     - Finish step 5 "the CI-label fallback from …" now names `_shared/visual-baselines.md`.
  5. **`[PREVIEW-CHECK]` (J3).** Where a skill defines or instructs the marker, replace the
     definition with "Read `.claude/skills/_shared/preview-check.md` and follow it exactly" and
     keep which artifact holds it:
     - deliver: phase 7 step 4;
     - tweak: the tasks and implement rows;
     - chore: phase 3 step 5.

     squash has no definition today, and none is added. Its Finish reaches it through
     `open-pr.md`.
  6. **Classify and open the PR (J4).** Finish step 3 keeps its title, the diff command and the
     per-pipeline remark, and drops the criteria list and the three bullets for "Classify per
     `.claude/skills/_shared/open-pr.md`". Step 4 keeps the per-skill PR body list, then: "Open
     the PR and arm auto-merge: read `.claude/skills/_shared/open-pr.md` and follow it
     exactly." Delete the `**PR author account (required).**` block (steps 1 to 6).
  7. **chore only.**
     - The Rules "Alignment rule" bullet becomes: "**Shared wording (CLAUDE.md, Orchestration
       skills).** Wording the four pipelines share lives once in `.claude/skills/_shared/`. A
       chore that edits a pipeline skill changes the shared file, not a copy, and the review
       phase checks that no skill restates it." This drops the stale "the pre-PR pause".
     - Review row: "the alignment rule when a pipeline skill changed" becomes "no shared block
       restated in a pipeline skill".
- **Test:** `no behaviour: n/a (agent instructions)`. Checked by acceptance criteria 2 and 3:
  run the grep counts and record them in the item's summary. `pnpm run verify:quick` stays
  green.
- **Layer:** none.

### W4 — Shrink `READ_BY_CHECKS` (test first) and update the tier docs

- [x] W4 done
- **Files:**
  - `tests/unit/ci/changed-paths.test.ts` (first):
    - `SAFE` gains `CLAUDE.md`, the four pipeline `SKILL.md` paths,
      `.specify/memory/constitution.md` and `.claude/skills/_shared/verify-gate.md`.
    - `UNSAFE` loses those, keeping `.claude/skills/setup-walkthrough/SKILL.md` and the rest.
    - The `it.each(["deliver","tweak","squash"])` "runs everything when the %s skill changes"
      case becomes "skips when only pipeline skills, shared wording, CLAUDE.md or the
      constitution change". It is one `decide()` case over those paths: `full` and
      `contentOnly` false.
    - The "deny-listed file" case uses `.claude/skills/setup-walkthrough/SKILL.md` and still
      expects `full` true.
    - The `CLAUDE.md` input in "never reports contentOnly without full" stays, because the
      invariant still holds.
    - Run it and see the new SAFE and skip expectations fail.
  - `scripts/ci/changed-paths.ts`: `READ_BY_CHECKS` becomes
    `[".claude/skills/setup-walkthrough/SKILL.md"]`. Run again: green, drift guard included.
    The drift guard scans `src/`, `scripts/` and `tests/`. After W1 only `skill-behaviour.test.ts`
    names a skip-safe-prefix path, and that is the one kept.
  - `docs/testing.md`, "Change tiers" skip-safe row: "except the files a test or check reads
    (`setup-walkthrough`'s `SKILL.md`)". Add one sentence: edits to the pipeline skills,
    `_shared/`, `CLAUDE.md` and the constitution run the skip-safe tier.
- **Test:** existing `tests/unit/ci/changed-paths.test.ts`, adjusted first (unit over a script).
- **Layer:** unit. This is the cheapest layer: `isSkipSafe` and `decide` are pure functions.
- **Coverage mapping:**
  - "runs everything when the deliver/tweak/squash skill changes" and "deny-listed constitution"
    → the opposite is now asserted (skip-safe), because no check reads them.
  - The deny-list mechanism itself stays asserted, via setup-walkthrough.

### W5 — Cut the `CLAUDE.md` alignment list and visual section to pointers

- [ ] W5 done
- **Files:** `CLAUDE.md`:
  - **Orchestration skills, paragraph 1:** replace "The first three were ported from Don's
    `cadence` project, whose read-only clone lives at `.reference/cadence` (gitignored, like
    `.reference/flux` for the design theme). Diff against it when porting further changes." with
    one line of history: "The first three began as ports from Don's `cadence` project
    (read-only clone at `.reference/cadence`, gitignored like `.reference/flux` for the design
    theme)." The `.reference/flux` mention stays because other notes rely on it.
  - **"Keep the four pipelines aligned…" and its seven bullets:** replace with one line: "Wording
    the four pipelines share lives once in `.claude/skills/_shared/`. Each skill reads it at the
    point of use, and no skill restates it; the Local toolchain rules live above in this file."
  - **`## Visual baselines`:** replace the body with a pointer. The visual project, its
    per-platform baselines and how to refresh them (macOS, Linux via Docker, the CI label
    fallback) are in `.claude/skills/_shared/visual-baselines.md`. Read it before changing or
    refreshing a baseline.
  - **Local toolchain's Docker bullet:** "(below)" becomes "(see
    `.claude/skills/_shared/visual-baselines.md`)".
- **Test:** `no behaviour: n/a (agent notes)`. Checked by acceptance criterion 6 (grep).
- **Layer:** none.

## Docs citations

- Claude Code skills, "Add supporting files" (https://code.claude.com/docs/en/skills, read
  2026-10-05):
  - a skill directory may hold Markdown files besides `SKILL.md`, which `SKILL.md` references
    and Claude reads "only when needed", not at skill load;
  - `SKILL.md` is required for a directory to be a skill, so `.claude/skills/_shared/` (no
    `SKILL.md`) is not a skill and does not appear in the skill list.

  The docs show supporting files inside one skill's own directory. A sibling `_shared/`
  referenced by repository path is the same on-demand read, shared by four skills, and is
  cadence's working precedent (`.reference/cadence/.claude/skills/_shared/e2e-watch-rules.md`).
- Vitest: no new API is used. The existing `it.each` and `describe` cases are edited.
- Astro: none (no Astro usage changes).

## Risks

- **An agent skips the "read `_shared/…`" line** (the issue's own risk). Mitigations:
  - the pointer is the first instruction at each point of use and in each subagent prompt;
  - the toolchain needs no pointer, because `CLAUDE.md` is auto-loaded (J1);
  - the `/chore` review phase checks that no skill restates shared text.

  Residual: a subagent prompt paraphrased by an orchestrator could drop the pointer. The
  cadence file's "pass them by reference" line is copied into each shared file's header.
- **Skill-only PRs now run the skip-safe tier (secretlint only).** This is the issue's intent,
  and nothing tests these files any more. A broken skill is found when a pipeline runs, not in
  CI.
- **The constitution becomes skip-safe.** An amendment PR that touches only the constitution
  runs secretlint only. It still needs Don's approval (every PR does), and amendments are major
  changes flagged in the PR body. No test reads it, so the full gate would assert nothing more.
- **Dangling pointers.** If `docs/testing.md` "Where a test goes", the constitution's
  Development Workflow or a `_shared/` file is renamed, a skill's pointer dangles and no test
  catches it. The review phase greps every `_shared/` path and heading the skills name. A rename
  is a reviewed PR.
- **W1 before W3 ordering.** If W3 ran first, the alignment tests would turn red. If W4 ran
  before W1, the drift guard would flag the four test files reading now skip-safe skills. The
  order W1 → W2 → W3 → W4 → W5 avoids both.
- **Parallel worktrees.** Ports 4321 and 4322 collide in `verify:quick`'s build only if a
  sibling runs Playwright. If so, wait and rerun (memory note).
