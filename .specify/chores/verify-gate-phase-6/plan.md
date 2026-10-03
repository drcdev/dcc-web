# Chore plan: verify-gate-phase-6 (issue #26, phase 6, final)

Branch: `chore/verify-gate-phase-6`, at `main`'s code (commit 75e73fc, after #36 merged). This is
the last phase of https://github.com/drcdev/dcc-web/issues/26. Under the recommended decision
outcome the PR body says `Closes #26`.

## Goal

Phases 1 to 5 shipped in #29 (D1, D2, `docs/testing.md`), #30 (D3, D4), #31 (visual lazy
images), #32 (D5, D6) and #36 (D7). Issue plan item 6 says: "Re-measure and record the numbers
here." This run records the final CI and local gate times in the repository, in a new dated
"Measured gate times" section of `docs/testing.md`. Before this run they existed only in issue
comments and chore reports. It also posts the closing status on #26, and it acts on D8. D8 says
to open a follow-up "only if the Playwright stage is still the long pole". It still is: `e2e`
takes 341 to 451 s of every `main` run. So the Playwright work goes to a new issue. This run
changes no code, no test and no CI configuration.

## Acceptance

Mechanical criteria for this chore:

1. `docs/testing.md` has a new `## Measured gate times` section after `## Build budget`. It holds
   the date, the before/after table, the per-job shape of the representative CI run, the long
   pole, and the method for both numbers. No existing heading is renamed, moved or removed:
   `grep -n '^## \|^### ' docs/testing.md` shows the same lines as on `main`, plus the new one at
   the end.
2. The local figure is the orchestrator's measurement (`LOCAL_GATE_SECONDS` and the test counts),
   copied as given. No subagent re-runs the gate to get it.
3. `tests/unit/setup` and `tests/unit/ci` stay green. They read `docs/testing.md` and the
   pipelines (`pipeline-test-placement.test.ts`, `pipeline-verify-wording.test.ts`, and the drift
   guard in `changed-paths.test.ts`).
4. The diff touches only `docs/testing.md` and `.specify/chores/verify-gate-phase-6/`.
5. The #26 closing comment is posted, and the D8 follow-up issue is opened (W2, W3,
   `[ORCHESTRATOR]`).

Issue #26 acceptance, with the before and final measurements:

| Criterion | Target | Before (2026-10-01) | Final | Status |
|---|---|---|---|---|
| (a) CI `verify` on `main` | ≤ 10 min | 31 min (run 36814114154) | **6 min 15 s** (run 37090465334, #36 merge, full tier). Every `main` run since #31 is 6:15 to 7:59 | met |
| (b) Local `pnpm run verify`, Mac | ≤ 4 min | 8 to 10 min (issue text); 6 min 36 s after phases 1 and 2 | `LOCAL_GATE_SECONDS` from the orchestrator. Earlier phases: 317 s (phase 3), 5 min 17 s (phase 4), 6 min 0 s (phase 5) | not met unless the figure is ≤ 240 s; see `[NEEDS DECISION]` N1 |
| (c) No coverage lost without a line in `docs/testing.md` | — | — | "Contract-row mapping" and "Build budget" (phase 2), "Change tiers" coverage table (phase 4) | met |
| (d) Pipelines name the layer per test task | — | — | #36 (D7), guarded by `pipeline-test-placement.test.ts` | met |

**The representative CI run** is 37090465334, the push of the #36 merge to `main`. I chose it
because:

- it is the newest `main` run, on exactly the code this branch carries;
- it ran the full tier (a push to `main` is always full, and every job succeeded with none
  skipped);
- it is the cleanest full run so far.

The other `main` runs since #31 bracket it: 450 s (#31), 464 s (#32), 396 s (#33), 479 s (#34).
#33 and #34 probably took the content-only path for `build-tests`. That is inferred from the
252 s `build-tests`, not confirmed from the logs. The record states the range (6:15 to 7:59), so
one fast run is not presented as typical. Run 37035625920 (#30, 1174 s) is left out as an
anomaly, probably a rerun.

Per-job time in run 37090465334: `changes` 15 s, `static` 93 s, `build-tests` 338 s, `e2e`
341 s, `verify` 13 s. `e2e` is the long pole, with `build-tests` close behind.

This PR's own CI run will also be a full-tier run, because `docs/` is not skip-safe. Its number
goes in the PR body as a cross-check, not in the record. A PR run includes the preview
site-check, so it is not comparable with a `main` push.

## Scope

**In:**

- `docs/testing.md`: the new "Measured gate times" section, plus one appended clause in the
  intro paragraph that points to it. If the follow-up issue exists by then, its number replaces
  "(issue #26, D8)" in the E2E row of the Layers table.
- This plan, and the review report later.
- `[ORCHESTRATOR]` items: the #26 closing comment, the D8 follow-up issue, and the PR body.

**Out:**

- Any change to the a11y or no-js matrices, Playwright config, `package.json` scripts or
  `ci.yml`. D8 left these alone, and they go to the follow-up issue.
- Re-running the gate in any subagent. The orchestrator's single measurement is the figure.
- Refreshing the "`verify:quick` takes about 33 s" line. It was measured in phase 4, nothing
  since has changed `verify:quick`'s steps, and this run does not re-measure it.
- The #36 governance follow-ups (layer field in the tasks template, Principle I's layer list, an
  analyze-phase check, the cadence divergence). They are carried into the follow-up issue's
  "Also carried from #26" list, so they survive the closing of #26, but no work on them happens
  here.
- A CHANGELOG. The repository has none, and the record goes in `docs/testing.md`.

**Follow-ups for the PR body:**

1. The new D8 follow-up issue (W3): Playwright stage time, the two matrix options, the fixture
   web server when only `budget` runs, and local `test:e2e` run the CI way.
2. The #36 governance follow-ups, now listed in that issue.

## Constitution Check

- **I. Test-First:** no behaviour changes and no test is added. W1's test line is
  `no behaviour: n/a (documentation of measured figures; nothing reads them)`. The existing
  guards that read `docs/testing.md` are re-run.
- **II. Automated Release Gate:** no check is touched. The full gate runs: once locally by the
  orchestrator (as the measurement), and in CI on the PR, because `docs/` is a full-tier path.
- **III. Human Review for Major Changes:** no criterion fires.
  - No dependency, integration or service is added.
  - No contact data is touched.
  - The design system and layout are unchanged.
  - There is no cost change.
  - `ci.yml`, deploy and infrastructure config are untouched; only a doc describes them.
  - The constitution is not amended.

  Verdict: **not major**. Auto-merge applies unless N1 resolves to option C. That option edits
  Playwright test config, and it would need re-checking. The orchestrator re-checks the verdict
  against the real diff at Finish.
- **IV. First-Party Before Custom:** issue and PR operations use the `gh` CLI
  (`gh issue comment`, `gh issue create`, `gh run view --json jobs`). No script is written, and
  no tool's usage changes.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected. No secrets, and none are printed.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected.
- **X. Accessible, Fast and Private:** unaffected. The a11y matrix stays whole, and any
  reduction is the follow-up issue's call, made under D8.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/verify-gate-phase-6/` and the `after_chore_*` commits.

## [NEEDS DECISION]

**N1. The local ≤ 4 min target (issue #26 acceptance (b)) is not met.** The local gate was 5.3
to 6 min in phases 3 to 5. The orchestrator's measurement now is `LOCAL_GATE_SECONDS`. `e2e`
(Playwright) is the long pole, and D8 deliberately left the a11y and no-js matrices alone.

- **A (Recommended).** Record the target as revised to the achieved figure, rounded up to the
  next whole minute (for example ≤ 6 min if the figure is 5 min 40 s). Close #26 (`Closes #26`).
  The D8 follow-up issue carries the remaining Playwright work and restates 4 min as its own
  target. This follows D8 as ticked, and keeps (b)'s shortfall visible instead of dropping it.
- **B.** Keep the 4 min target open. The PR says `Part of #26`, #26 stays open with this
  comment as its status, and no follow-up issue is opened. The remaining work then lives in #26.
- **C.** Reduce the matrices now in this chore (no-js to a 3-template sample plus one full nav
  pass; axe at one width for non-shell content). This reverses D8's ticked option. It changes
  Playwright test config and coverage. It needs `docs/testing.md` coverage lines and probably
  falls under Principle III. Not recommended.

If `LOCAL_GATE_SECONDS` ≤ 240, N1 is moot. In that case W1 records (b) as met, W2 says so, and
W3 is still opened, because CI `e2e` remains the long pole.

## Work items

### W1 `docs/testing.md`: "Measured gate times" section

- [ ] W1 done

**Files:** `docs/testing.md`.

**Inputs from the orchestrator:** `LOCAL_GATE_SECONDS`, the unit, worker and e2e test counts,
the N1 outcome, and `FOLLOWUP_ISSUE=<n>` if W3 has been opened.

**Test:** `no behaviour: n/a (documentation of measured figures; nothing reads them)`. Before and
after the edit, run
`corepack pnpm exec vitest run --project unit tests/unit/setup tests/unit/ci` (about 3 s).
The guards that read this file and the drift guard must stay green. Then run
`corepack pnpm run lint`. Confirm the heading list with `grep -n '^## \|^### ' docs/testing.md`
(see Acceptance 1).

**Content.** Append after the Build budget section:

- `## Measured gate times`, opening with "Measured on 2026-10-02, after phase 5 (#36), at commit
  75e73fc."
- A before/after table with rows for CI `verify` on `main`, local `pnpm run verify` and their
  targets.
  - CI: 31 min (run 36814114154, 2026-10-01) → 6 min 15 s (run 37090465334), with the range
    6:15 to 7:59 across the `main` runs since #31.
  - Local: 8 to 10 min → the figure from `LOCAL_GATE_SECONDS`, in m:ss.
  - Target column: CI ≤ 10 min, met. Local per N1: under A, "≤ 4 min, revised to ≤ N min;
    remaining work in #FOLLOWUP_ISSUE". Under B, "≤ 4 min, not met; open in #26".
- The per-job table of run 37090465334: `changes` 15 s, `static` 93 s, `build-tests` 338 s,
  `e2e` 341 s, `verify` 13 s. One sentence follows it: `e2e` is the long pole in every `main`
  run (341 to 451 s), `build-tests` is next (338 to 393 s on the full tier), and the matrices
  were left alone under D8.
- The local test counts as given (unit files and tests, worker tests, Playwright tests).
- **Method**, one short list:
  - CI wall time = the earliest job `startedAt` to the `verify` job's `completedAt`, from
    `gh run view <id> --json jobs`, on a push to `main` (always the full tier; PR runs add the
    preview site-check).
  - Local = `date +%s` around one `pnpm run verify` on the Mac, under `perl -e 'alarm N'`, with
    the agent-shell setup, nothing else running, and the 1-minute load average noted if the
    orchestrator gave one.
  - Re-measure when a layer or job changes, and add a dated row rather than overwrite.

Also append one clause to the intro paragraph: "Phase 6 recorded the final gate times (see
'Measured gate times')." If `FOLLOWUP_ISSUE` is set, change the E2E row's "review matrices
(issue #26, D8)" to "review matrices (#FOLLOWUP_ISSUE, from D8 in #26)". Leave every other line
alone.

Keep the house style: plain sentences, no em dashes in new text, figures as given, tables in the
pipe format already used.

### W2 `[ORCHESTRATOR]` Final status comment on issue #26

- [ ] W2 done

**Files:** none (GitHub). **Test:** n/a (not repository work).

The orchestrator posts this at Finish with `gh issue comment 26 --body-file <tmp>`, after the PR
is open so its number can be cited. Content, in the format of the phase 5 comment:

- `## Status as of 2026-10-02 (phase 6, final)`.
- **Phase 6: re-measure and record (#PR).** Final figures recorded in `docs/testing.md`
  "Measured gate times".
- The acceptance table from this plan with the final column filled in. (a) met at 6 min 15 s
  (run 37090465334; `main` range 6:15 to 7:59, from 31 min). (b) gives the local figure and the
  N1 outcome. (c) met. (d) met (#36).
- Per-job shape of run 37090465334, and the sentence that `e2e` is still the long pole.
- Phase list: #29, #30, #31, #32, #36 and this PR, with one line each.
- D8: "Playwright is still the long pole, so per D8 the follow-up is #FOLLOWUP_ISSUE." Under N1
  option B, say instead that the work stays in this issue.
- Under option A, a closing line: "Closed by #PR."

### W3 `[ORCHESTRATOR]` Open the D8 follow-up issue

- [ ] W3 done

**Files:** none (GitHub). **Test:** n/a (not repository work).

Only under N1 option A (or when N1 is moot). Open it with
`gh issue create --title ... --body-file <tmp>` once N1 is answered. Open it before W1 runs if
possible, so W1 can link the number. Draft:

**Title:** `Playwright is the long pole of verify: measure, then trim the a11y and no-js matrices`

**Body:**

> Follow-up to #26 (decision D8). After phases 1 to 5, CI `verify` on `main` takes 6 min 15 s
> (run 37090465334; range 6:15 to 7:59), down from 31 min. The `e2e` job is the long pole in
> every run (341 to 451 s), with `build-tests` next (338 to 393 s). The local `pnpm run verify`
> takes <LOCAL figure>, against #26's original 4 min target. See "Measured gate times" in
> `docs/testing.md`.
>
> ## Measure first
>
> - Per-project time inside `e2e`: `e2e`, `a11y`, `visual`, `sections` under
>   `test:e2e:parallel`, then `budget` alone. Use Playwright's JSON or HTML reporter timings on a
>   `main` run, or `--reporter=list` timings locally.
> - Time spent in the two web servers (`pnpm run build` preview and `build:fixtures`) against
>   time spent in tests.
> - The share of the a11y and no-js template matrices in that total.
>
> ## Decisions
>
> ### M1. no-js matrix
> - [ ] Reduce to a 3-template sample plus one full nav pass (D8's second option).
> - [ ] Leave as is.
>
> ### M2. axe matrix
> - [ ] Keep both themes, one width for non-shell content (D8's second option). The shell keeps
>   both widths.
> - [ ] Leave as is (Principle X: WCAG 2.2 AA per template).
>
> Any reduction needs a line in `docs/testing.md` saying where the coverage went (#26
> acceptance (c)), and it is a change to test coverage, so it is reviewed accordingly.
>
> ## Smaller items (from #30)
> - Make the fixture web server conditional when only `budget` runs, which saves the second
>   `build:fixtures`.
> - Make local `test:e2e` run the way CI does: parallel projects, then `budget` alone at one
>   worker.
>
> ## Also carried from #26 (from #36, not Playwright)
> - Layer field in `.specify/templates/tasks-template.md` and the `speckit-tasks` instructions.
> - Principle I's "Test layers" list could name build, visual and budget tests.
> - Deliver's analyze phase could flag test tasks without a layer.
> - The pipelines now diverge from `.reference/cadence` on test placement.
>
> ## Acceptance
> - `e2e` job ≤ <target> on a `main` run, and local `pnpm run verify` ≤ 4 min on the Mac, or a
>   recorded reason why not.
> - No template or a11y combination loses coverage without a line in `docs/testing.md`.

Judgment call: the four #36 governance items go into this issue instead of a separate one. They
are small, and listing them stops them being lost when #26 closes. The orchestrator may split
them out if Don prefers.

### W4 `[ORCHESTRATOR]` PR body

- [ ] W4 done

**Files:** none. **Test:** n/a.

The PR body covers:

- `Closes #26` (`Part of #26` under N1 option B);
- the acceptance table;
- the CI number from this PR's own run, marked as a PR run (it includes the site-check);
- the follow-ups list from Scope;
- the Principle III verdict (not major, so auto-merge).

Open it from `drc-agents` per CLAUDE.md Merging.

## Docs citations

None needed. No tool's usage changes. `gh issue comment`, `gh issue create` and
`gh run view --json jobs` are used as before in this issue's phases.

## Risks

- **The local figure is load-bound.** A busy Mac can inflate it (the 5.3 to 6 min spread across
  phases 3 to 5). Mitigation: record it with the method, and the load average if given. Never
  replace it with a guess.
- **One fast CI run read as typical.** 6:15 is the best `main` run so far. Mitigation: the
  record gives the range 6:15 to 7:59 next to it.
- **Content-only inference.** That #33 and #34 ran the content-only tier is inferred, not
  confirmed. The record does not rely on it; it cites only the full-tier run 37090465334.
- **Heading drift.** Renaming a heading in `docs/testing.md` would break the placement guard and
  the pipelines' citations. W1 only appends, and Acceptance 1 checks the heading list.
- **Issue ordering.** If W3 is opened after W1, the Layers row keeps "(issue #26, D8)". That is
  still accurate, and the follow-up number then appears only in the #26 comment and the PR body.
