# Chore plan: verify-gate-phase-5 (issue #26, phase 5)

Branch: `chore/verify-gate-phase-5`. Part of https://github.com/drcdev/dcc-web/issues/26, phase 5
of 6. The PR body says `Part of #26`: phase 6 (re-measure and record the numbers on the issue) is
not in-repo work and follows the merge.

## Goal

Phases 1 to 4 shipped in PRs #29, #30 and #32 (with #31 between). They moved tests to their
cheapest layer and cut CI `verify` from 31 min to about 7 min. Nothing yet stops the next
feature from putting the same behaviour back into four layers. This run delivers **phase 5** of
the plan in [issue #26](https://github.com/drcdev/dcc-web/issues/26), under ticked decision
**D7**: a **test-placement rule** in the Development Workflow section of the constitution, and
in the pipelines' instructions. Every behaviour gets **one primary layer**, the cheapest layer
that can observe it. E2E is for journeys and for what only a browser can show. Build tests are
for what only the real build can show. Accessibility and visual tests cover templates, not
stories. Every planned test names its layer, and a second layer needs a written reason. The
issue names `/deliver`, `/tweak` and `/squash`. `/chore` gets the same rule at its plan
work-item test field, because CLAUDE.md requires shared pipeline text to land in all four
together. This closes the issue's acceptance line "The three pipelines name the layer for each
test task".

## Acceptance

Mechanical criteria (no timing change is expected or claimed from this phase):

1. `.specify/memory/constitution.md` Development Workflow carries a test-placement bullet
   containing the phrases `one primary layer` and `names its layer`. The footer reads
   `**Version**: 2.1.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-10-02`. The Sync
   Impact Report comment at the top is rewritten for 2.0.0 → 2.1.0 in the existing format.
2. Each of `.claude/skills/{deliver,tweak,squash,chore}/SKILL.md` contains the identical
   **Test placement** bullet (W1 constant `bullet`) exactly once, after whitespace flattening.
3. Each pipeline names the layer where its tests are planned, with the exact phrases W1 defines:
   the tasks row (deliver, tweak), the fix row and the assess row (squash), and the plan row,
   implement step and review row (chore). Each requires a reason for any second layer.
4. The stale per-story layer lists are gone. These three phrases are absent: deliver's `every
   story gets unit/schema, component, E2E and accessibility test tasks`, tweak's `an E2E or
   accessibility case where the change is visible in the browser`, and squash's `whichever
   layer the bug lives in`.
5. New guard `tests/unit/setup/pipeline-test-placement.test.ts` asserts 2, 3 and 4, plus the
   constitution phrases from 1 and the `docs/testing.md` "Where a test goes" heading, rule
   phrase and constitution pointer. It is written first and seen red.
6. `CLAUDE.md` "Keep the four pipelines aligned" lists the test-placement bullet and the
   layer-naming phrases as one more shared section.
7. `pipeline-verify-wording.test.ts` and `pipeline-pr-author.test.ts` stay green, unchanged.
   The "Inner loop and gate" paragraph, the `verify:quick` sentence and the PR author block are
   byte-identical to `main`. Check this with `git diff main -- .claude/skills`, which must show
   no hunk inside them.
8. `pnpm run test:unit` is green, at 172 files (one more than before). Full `pnpm run verify`
   is green, locally or in CI per the orchestrator's call.

**Before-measurement** (explore phase):

- `pnpm run test:unit`: 171 files, 2405 tests, 6.5 s.
- Guard files: `pipeline-verify-wording.test.ts` (72 lines), `pipeline-pr-author.test.ts` (66).
- SKILL.md sizes: deliver 313 lines, tweak 277, squash 249, chore 366.
- Constitution: 219 lines, v2.0.0.
- CI wall time, from the issue comments: 31 min originally; 14.5 min after phases 1 and 2
  (run 36930871071); 8 min 1 s (PR #30, run 37030816886); 7 min 5 s (PR #31, run 37039859610).
- Local full gate: about 5.3 min, against a 4 min target that is not yet met.
- The issue acceptance row "Pipelines name the layer per test task" is open.

The review phase re-runs `pnpm run test:unit` for the after pair. The CI number from this PR's
own `verify` run goes in the PR body and the phase 6 issue comment.

## Scope

**In:**

- the constitution amendment (Development Workflow bullet, version, Sync Impact Report);
- the four pipeline SKILL.md files;
- the `CLAUDE.md` alignment list;
- a pointer sentence in `docs/testing.md` "Where a test goes";
- the new guard test.

**Out:**

- `.claude/skills/speckit-tasks/SKILL.md`, `.specify/templates/*` (the tasks template's "Tests
  are OPTIONAL" and its example test tasks) and `.specify/extensions/bug/commands/*`. The
  pipelines already override "optional" through the tasks-row text the subagent is given, and
  the same channel now carries the layer rule. That is enough for the tasks phase to name a
  layer. A template change would also be undone by a Spec Kit reinstall.
- Principle I's "Test layers" list. It does not name build, visual or budget tests. The new
  bullet defines them where it uses them, so the rule reads without it.
- Deliver's analyze phase checking layer names. The guard proves the instruction exists, not
  that subagents follow it.
- D8: the a11y and no-js matrices stay as they are.
- The "Inner loop and gate" paragraph (D6, phase 4), which stays untouched.
- Re-measurement numbers, which go in the PR body and the issue #26 comment (phase 6).
- `.reference/cadence`. Three pipelines came from it, but this is a local governance rule with
  no upstream counterpart, so no diff against it is needed. The PR body notes that the
  pipelines now diverge from cadence here.

**Follow-ups for the PR body:**

1. Add a layer field to `.specify/templates/tasks-template.md` and the `speckit-tasks`
   instructions, or contribute it upstream.
2. A future amendment could list build, visual and budget tests in Principle I's "Test layers".
3. Deliver's analyze phase could flag test tasks without a layer.
4. Phase 6: re-measure and close #26.

## Constitution Check

- **I. Test-First:** strengthened, since this is the rule's purpose. W1 writes the guard first
  and sees it red. W2 and W3 turn it green.
- **II. Automated Release Gate:** no check is weakened or skipped. Editing the constitution and
  the pipeline skills forces the full CI gate, because they are in `READ_BY_CHECKS`.
- **III. Human Review for Major Changes:** the criterion **"the constitution itself"** fires
  (`.specify/memory/constitution.md` is a CODEOWNERS @drcdev path, and Governance says
  amendments are reviewed as a major change). No other criterion fires:
  - no dependency is added;
  - CI, deployment and infrastructure configuration are unchanged;
  - contact data, design and layout are unchanged;
  - there is no cost change.

  Verdict: **MAJOR**. No auto-merge; Don's approval is needed. Open the PR from `drc-agents`.
- **IV. First-Party Before Custom:** no tool usage changes. The guard is plain Vitest reading
  files, in the same pattern as `pipeline-verify-wording.test.ts`.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected (no secrets, no data).
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected.
- **X. Accessible, Fast and Private:** unaffected. Accessibility keeps its full template matrix,
  and the rule states that a11y covers templates.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, plan in
  `.specify/chores/verify-gate-phase-5/`. The amendment is made by running the
  `speckit-constitution` skill in W3, as Governance requires ("Amendments are made through
  Spec Kit's constitution command"). The skill writes the Sync Impact Report and the version
  footer.

## Design decisions (made in this plan)

1. **Version bump: MINOR, 2.0.0 → 2.1.0.** Governance says MINOR is "adding a principle or
   materially expanding one", and the speckit-constitution skill says "MINOR: New
   principle/section added or materially expanded guidance". The bullet adds a binding
   requirement to every tasks list (name a layer, justify a second one). That materially
   expands how Principle I's test layers are applied, which is more than wording (PATCH). No
   principle is removed or redefined (MAJOR). The conservative reading of a new obligation is
   MINOR.
2. **Where the shared text lives.** One identical **Test placement** bullet sits in each
   pipeline's `## Rules` constitution list, as a sibling directly after the
   `**Test-first (Principle I).**` bullet. Each pipeline also gets its own phrase in the row
   where tests are planned. The row phrases repeat the substance ("one primary layer, the
   cheapest layer that can observe ...", with the `docs/testing.md` citation), so a subagent
   given only the row text still applies the rule. The guard checks the shared bullet in all
   four and each row phrase in its pipeline.
3. **`docs/testing.md`.** It already holds the detailed rule. It gains one pointer sentence to
   the constitution and does not repeat the rule. The constitution and the pipelines cite "Where
   a test goes" for the detail.
4. **Tasks template unchanged.** See Scope. This is a follow-up.
5. **`.reference/cadence` not needed.** See Scope.
6. **Red between items.** After W1 the guard is red. After W2 only its constitution and
   docs-pointer cases are red, and W3 turns them green. During W1 and W2, `verify:quick` is
   expected to be red **only** on `pipeline-test-placement.test.ts`. Any other red is a real
   failure, and the item must stop. Commits on the branch may carry these known-red cases,
   because the gate counts only before the PR.

## Work items

### W1 New guard `tests/unit/setup/pipeline-test-placement.test.ts` (red)

- [x] W1 done

**Files:** `tests/unit/setup/pipeline-test-placement.test.ts` (new).

**Test:** new-first. Write the file, then run
`pnpm exec vitest run --project unit tests/unit/setup/pipeline-test-placement.test.ts`. Every
pipeline-bullet, row-phrase, stale-phrase and constitution case must fail. The `docs/testing.md`
heading and `one primary layer` cases pass already, because they pin existing text. The
docs-pointer case fails. Record which cases fail. The existing tests
`tests/unit/setup/pipeline-verify-wording.test.ts`, `tests/unit/setup/pipeline-pr-author.test.ts`
and `tests/unit/ci/changed-paths.test.ts` (its drift guard scans this new file) must pass,
before and after.

**Shape:** copy the structure of `pipeline-verify-wording.test.ts`: the `pipelines` const array
`["deliver", "tweak", "squash", "chore"]`, `skillText(name)` reading
`` `../../../.claude/skills/${name}/SKILL.md` `` through `new URL(..., import.meta.url)`,
`flat()`, `count()`, and `describe.each(pipelines)`. Read the constitution through the literal
`"../../../.specify/memory/constitution.md"` and the docs through
`"../../../docs/testing.md"`. Both are fine with the drift guard: the constitution and the four
skills are in `READ_BY_CHECKS`, and `docs/` is not skip-safe. **Do not quote any other skill
name as a string** (for example `"speckit-tasks"`). The drift guard expands `${name}` to every
skill whose name appears quoted in the file, and a speckit skill is skip-safe, so it would be
reported.

**Constants**, held in the test exactly as below, each passed through `flat()`. Quotes and
backticks are literal characters in the skill text.

- `bullet`, exactly once in all four pipelines:

  > **Test placement.** Every behaviour gets one primary layer: the cheapest layer that can
  > observe it. E2E is for journeys and for anything only a browser can show; build tests are
  > for what only the real build can show; accessibility and visual tests cover templates, not
  > stories. Every planned test (a test task, a reproducing test or a work item's test) names
  > its layer (unit, component, build, worker, E2E, accessibility, visual or budget), and
  > testing the same behaviour at a second layer needs a written reason. The constitution's
  > Development Workflow makes this binding; "Where a test goes" in `docs/testing.md` has the
  > detail.

- `taskPhrase`, exactly once in deliver and in tweak:

  > Each test task names its one primary layer, the cheapest layer that can observe the
  > behaviour ("Where a test goes" in `docs/testing.md`), and gives the reason for any second
  > layer in the task text.

- `squashFixPhrase`, exactly once in squash:

  > at its one primary layer, the cheapest layer that can observe the symptom ("Where a test
  > goes" in `docs/testing.md`)

- `squashAssessPhrase`, exactly once in squash:

  > Name the layer the reproducing test belongs at.

- `chorePlanPhrase`, exactly once in chore:

  > for a new or moved test, its one primary layer, the cheapest layer that can observe the
  > behaviour ("Where a test goes" in `docs/testing.md`), with the reason for any second layer

- `choreImplementPhrase`, exactly once in chore:

  > write or adjust the test the plan names, at the layer it names,

- `choreReviewPhrase`, exactly once in chore:

  > every new or moved test at the layer the plan names;

- `stale`, a map of phrases that must be absent:
  - deliver: `every story gets unit/schema, component, E2E and accessibility test tasks`;
  - tweak: `an E2E or accessibility case where the change is visible in the browser`;
  - squash: `whichever layer the bug lives in`.

**Cases:**

- `describe.each(pipelines)`: the bullet appears exactly once.
- One `it` per pipeline-specific phrase above, each exactly once.
- One `it` per stale phrase, each absent.
- An alignment `it` that loops all four for the bullet, with a message per pipeline (as the
  verify-wording file does).
- Constitution: slice the text from `## Development Workflow` to `## Governance`, flatten it,
  and expect it to contain `one primary layer` and `names its layer`. Do **not** assert the
  version number, so the next amendment does not break this test.
- `docs/testing.md`: contains `## Where a test goes`. Its "Where a test goes" section (sliced
  to the next `## ` heading) contains `one primary layer` and `Development Workflow`. The last
  one is the pointer W3 adds.

Header comment: one line saying the test guards the issue #26 D7 test-placement rule across
the four pipelines, the constitution and `docs/testing.md`, and that CLAUDE.md lists the text
as a shared section. Do not touch `pipeline-verify-wording.test.ts` or
`pipeline-pr-author.test.ts`.

### W2 Pipelines and CLAUDE.md: the bullet and the layer-naming phrases

- [ ] W2 done

**Files:** `.claude/skills/deliver/SKILL.md`, `.claude/skills/tweak/SKILL.md`,
`.claude/skills/squash/SKILL.md`, `.claude/skills/chore/SKILL.md`, `CLAUDE.md`.

**Test:** existing (the W1 guard). Run it before the change (red) and after it. Every
pipeline, row and stale case must be green afterwards. Only the constitution `names its layer`
case and the docs-pointer case may stay red, until W3. `pipeline-verify-wording.test.ts`,
`pipeline-pr-author.test.ts` and `tests/unit/ci/changed-paths.test.ts` must pass before and
after. **Do not alter**:

- the `**Inner loop and gate.**` paragraph;
- the `Then run pnpm run verify:quick ... counts as the gate.` sentence;
- the `**PR author account (required).**` block.

Do not add a line starting `5. ` before that block. Edit around these texts, never inside them.

**Edits.** The bullet and phrase texts are the W1 constants, word for word. Wrap at the
file's usual width; the test flattens whitespace.

1. **All four, `## Rules`.** Insert the Test placement bullet as a nested list item (`  - `)
   directly after the `**Test-first (Principle I).**` bullet, and before `**Release gate
   (Principle II).**`. Put the bullet text right after the `- ` marker.
2. **deliver, tasks row (phase 5).** Replace `every story gets unit/schema, component, E2E and
   accessibility test tasks as the plan's test layers require, ordered before the
   implementation they cover.` with `every story gets the test tasks its behaviour needs,
   ordered before the implementation they cover.`, followed by `taskPhrase`. Keep the rest of
   the row (visual baselines, `[PREVIEW-CHECK]`), and keep the row on one table line.
3. **tweak, tasks row (phase 4).** Replace `unit/component tests for the changed code, an E2E
   or accessibility case where the change is visible in the browser.` with `usually a unit or
   component test for the changed code, and an E2E case only where the change is something
   only a browser can show.`, followed by `taskPhrase`. Keep the rest of the row.
4. **squash, fix row (phase 3).** Replace `(unit, component or E2E — whichever layer the bug
   lives in)` with `squashFixPhrase`, so the row reads "First add a failing test that
   reproduces the symptom at its one primary layer, the cheapest layer that can observe the
   symptom ("Where a test goes" in `docs/testing.md`), see it fail, ...". In the row's
   `Return:` list, change `tests added` to `tests added with the layer of each and the reason
   for any second layer`.
5. **squash, assess row (phase 2).** Insert `squashAssessPhrase` as a sentence before `Commit
   with event after_bug_assess.`.
6. **chore, plan row (phase 2).** After `` its test (existing / new-first / unit over config /
   `no behaviour: n/a (<reason>)`) ``, insert `, ` + `chorePlanPhrase`. Keep the rest of the
   row.
7. **chore, Phase 3 implement step 2.** Change `write or adjust the test the plan names, run
   it and see it fail` to `write or adjust the test the plan names, at the layer it names, run
   it and see it fail`.
8. **chore, review row (phase 4).** In the Check list, after `every test named in the plan
   present and green per the implement summaries;`, insert `choreReviewPhrase`.
9. **CLAUDE.md, "Keep the four pipelines aligned".** Add a bullet after the "Inner loop and
   gate" bullet:

   > the "Test placement" bullet in the Rules section and the layer-naming phrase where each
   > pipeline plans its tests (tasks row, fix and assess rows, or plan, implement and review
   > steps); a unit test checks the bullet is identical in all four.

Then run the W1 file and the two existing guard files. Run `pnpm run verify:quick` under the
perl alarm; it is expected red only on the W1 file's two pending cases.

### W3 Constitution amendment 2.1.0 and the `docs/testing.md` pointer

- [ ] W3 done

**Files:** `.specify/memory/constitution.md`, `docs/testing.md`.

**Test:** existing (the W1 guard). The constitution and docs-pointer cases go from red to
green, and the whole file is green. `pipeline-verify-wording.test.ts`,
`pipeline-pr-author.test.ts`, `tests/unit/ci/changed-paths.test.ts`,
`tests/unit/ci/workflows.test.ts` and `tests/unit/setup/drift.test.ts` (CODEOWNERS still
lists the constitution) must pass. Then run `pnpm run verify:quick`; it must now be fully
green.

**Constitution amendment: run the `speckit-constitution` skill.** Do not edit
`.specify/memory/constitution.md` by hand. Invoke the skill (Skill tool, `speckit-constitution`)
with the amendment below as its input, and let it write the Development Workflow bullet, the
Sync Impact Report comment and the version footer. Pass it this input, verbatim:

> Amend the constitution (currently 2.0.0). Add one bullet to the Development Workflow section,
> directly after "Tasks are ordered so tests come before the implementation they cover.", with
> this text:
>
> "Test placement: every behaviour gets one primary layer, the cheapest layer that can observe
> it. End-to-end tests are for journeys and for anything only a browser can show; build tests,
> which run the real `astro build`, are for what only the real build can show; accessibility
> and visual checks cover page templates, not each user story. Every test task names its layer,
> and testing the same behaviour at a second layer needs a written reason. `docs/testing.md`
> ("Where a test goes") holds the working detail."
>
> Version bump: MINOR, 2.0.0 → 2.1.0. Rationale: the Development Workflow section gains a
> binding test-placement rule (one primary layer per behaviour, named per test task, a reason
> for any second layer), which materially expands how Principle I's test layers are applied;
> no principle is removed or redefined, and it is more than a wording change. Source: issue #26
> decision D7. Ratified stays 2026-09-28; Last Amended is 2026-10-02. Change nothing else in
> the constitution: no principle text, no other section. In the Sync Impact Report: modified
> principles none (Principle I's text is unchanged); added sections none; removed sections
> none; other changes: the Development Workflow test-placement bullet. Templates reviewed:
> plan-template.md and spec-template.md need no change; tasks-template.md still calls tests
> optional and has no layer field, and the /deliver, /tweak, /squash and /chore pipeline
> instructions override it and now require the layer, so the template change is deferred; the
> four pipeline skills were updated in the same change. Follow-up TODOs: a layer field in the
> tasks template and speckit-tasks; Principle I's layer list does not yet name build, visual
> or budget tests. No placeholders deferred. Do not modify any template files.

If the skill proposes changes beyond this input (rewording principles, editing templates),
decline them and keep the amendment to the bullet, the report and the footer.

**Verify the skill's result** before moving on:

- `grep -n 'one primary layer' .specify/memory/constitution.md` and
  `grep -n 'names its layer' .specify/memory/constitution.md` each hit inside Development
  Workflow, between `## Development Workflow` and `## Governance`.
- `grep -n '^\*\*Version\*\*' .specify/memory/constitution.md` prints exactly
  `**Version**: 2.1.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-10-02`.
- The top HTML comment reads `Version change: 2.0.0 → 2.1.0` with a MINOR rationale, and lists
  modified principles, added and removed sections, templates reviewed and follow-up TODOs.
  It contains no bracket placeholder tokens.
- `git diff main -- .specify/memory/constitution.md` shows changes only in the report comment,
  the new bullet and the footer. If anything else changed, revert that part and note it.
- No file under `.specify/templates/` changed.

Then run the W1 guard file, which must now be fully green, and the other tests listed above.

**`docs/testing.md` edit:** in `## Where a test goes`, add this sentence as a paragraph after
the bullet list that ends with `A second layer needs a reason, written in the test's
comment.`. It is not a bullet:

> The constitution's Development Workflow makes this rule binding: every test task in the
> pipelines names its layer and gives the reason for any second layer.

Do not restate the rule elsewhere in the doc.

## Docs citations (Principle IV)

- No Astro, Vitest, Playwright, Wrangler or GitHub Actions usage changes. The guard uses the
  same Vitest `describe.each` and `node:fs` reads as the existing
  `pipeline-verify-wording.test.ts`, so no new docs page is needed and the Astro Docs MCP is
  not consulted.
- Constitution amendment: the procedure **is** the `speckit-constitution` skill
  (`.claude/skills/speckit-constitution/SKILL.md`), run in W3. The constitution's Governance
  section requires it ("Amendments are made through Spec Kit's constitution command, reviewed
  as a major change, and versioned"). The skill applies its own semantic version rules (step 2:
  "MINOR: New principle/section added or materially expanded guidance"). It writes the Sync
  Impact Report as an HTML comment (step 4: version change, modified principles, added and
  removed sections, follow-up TODOs) and validates it (step 5). The bump decision in this plan
  is the input to the skill, not a replacement for it.

## Risks

- **The rule is text, not enforcement.** The guard proves the instruction is present in every
  pipeline, not that a tasks subagent obeys it. Mitigation: the row phrases carry the rule's
  substance, and the chore review checks layers. The analyze-phase check is a named follow-up.
- **Speckit template contradiction.** `speckit-tasks` and the tasks template still say tests
  are optional and show example tasks without layers. Pipelines already override this ("the
  constitution wins"). The amendment's Sync Impact Report records the deferral.
- **Breaking an alignment guard by accident.** Editing rows near the `verify:quick` sentence
  (tweak tasks row, squash fix row, chore implement step) could alter it. W2 runs both
  existing guards and checks `git diff` for no hunk inside the protected texts.
- **Drift guard trips on the new test.** A quoted speckit skill name in the new file would
  expand the `${name}` read to a skip-safe skill. W1 forbids such literals and runs
  `changed-paths.test.ts`.
- **Wording too loose or too strict for squash and chore.** "Test task" does not exist in
  those pipelines, so the shared bullet says "every planned test (a test task, a reproducing
  test or a work item's test)".
- **Known-red commits mid-branch.** W1 and W2 commit with pending guard cases (decision 6).
  The full gate before the PR must be green.
- **Divergence from cadence.** Three pipelines now differ from `.reference/cadence` in the
  Rules list and rows. The PR body notes this, so a later port does not drop the bullet.
- **Full CI gate.** This change runs the full CI gate, because the skills and the constitution
  are in `READ_BY_CHECKS`. That is expected for a major change.

## [PREVIEW-CHECK] items

None. No page, worker or deployment output changes.
