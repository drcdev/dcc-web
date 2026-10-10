# Chore plan: retire-baseline-label-fallback

Branch: `chore/retire-baseline-label-fallback`, from `main` at 508587c (after #139 merged).
Closes [#77](https://github.com/drcdev/dcc-web/issues/77).

## Goal

Since Inter became self-hosted (PR #72, issue #62), Linux visual baselines made locally in Docker
(`pnpm run test:visual:update:linux`) have matched CI on the first run. The agent notes and the four
pipeline skills still describe a CI fallback for a predicted visual change: add the
`visual-baselines` label, wait for the `update-baselines` job in
`.github/workflows/visual-baselines.yml`, download the `visual-baselines-linux` artifact and copy
the `*-linux.png` files. [Issue #77](https://github.com/drcdev/dcc-web/issues/77) asks that, once
a few more PRs with predicted visual changes land green first time, the guidance be simplified so
the Docker route is the only documented path and the label fallback is removed or demoted. This
chore makes that change. Don chose to remove the fallback (decision D1, recorded on #77), so it
also deletes the fallback workflow, its unit-test block and the label, leaving nothing undocumented behind. No page, test subject or baseline
image changes.

**Before evidence (the issue's condition, orchestrator-verified):** since PR #72, PRs #80, #112,
#114 and #115 committed Docker-made Linux baselines that passed CI first time, and none of them
used the `visual-baselines` label. The condition in #77 ("after a few more pull requests with
predicted visual changes land green first time") is met. No runtime measurement applies.

## Acceptance

1. `.claude/skills/_shared/visual-baselines.md` has no fallback step: no mention of the
   `visual-baselines` label, `update-baselines`, the `visual-baselines-linux` artifact or
   `gh run download`. Step 2 tells the agent to ask Don to start Docker Desktop (question text
   carries the instruction) and to wait for it, with no "fall back to CI" wording. The file names
   `pnpm run test:visual:update:linux` as the only way to make Linux baselines.
2. `CLAUDE.md` names no CI or label fallback: the Local toolchain Docker bullet drops "do not fall
   back to CI without asking", and the Visual baselines section drops "the CI label fallback".
3. None of `.claude/skills/{deliver,tweak,squash,chore}/SKILL.md` contains "CI-label" or "Docker
   could not be started"; each Finish list loses the old step 5 and is renumbered 1–6 with no
   dangling "step N" reference.
4. `.github/workflows/visual-baselines.yml` no longer exists, and
   `tests/unit/ci/workflows.test.ts` has no `describe(".github/workflows/visual-baselines.yml")`
   block; every other block in that file is unchanged.
5. `docs/setup.md` item 10 does not mention `visual-baselines.yml` or the label; it keeps one
   sentence naming `pnpm run test:visual:update:linux` (Docker Desktop) as how Linux baselines are
   made, and "the workflows use" becomes "the workflow uses".
6. The header comment of `scripts/visual-baselines-linux.sh` describes what the script does
   without referring to the deleted job; the script's commands are unchanged.
7. A repository search, excluding the historical records under `.specify/chores/`,
   `.specify/bugs/` and `specs/`, finds no `visual-baselines` label or workflow, no
   `update-baselines` and no `visual-baselines-linux` artifact. `scripts/visual-baselines-linux.sh`
   and the `test:visual:update:linux` script in `package.json` stay (the file name matches
   `visual-baselines-linux`; that is expected).
8. `git diff --name-only main` lists only the files named in W1–W5 plus
   `.specify/chores/retire-baseline-label-fallback/**`. No `src/`, `worker/`, `public/`,
   `tests/e2e/` or snapshot image changes.
9. The PR body flags the change as major under Principle III (CI configuration) and lists the
   follow-ups below. Verify is green (CI sorts it to `tier=full`, because `.github/`, `tests/`,
   `scripts/` and `docs/` paths change).

## Scope

**In:** W1–W5 (shared doc, CLAUDE.md, four skills, the workflow and its tests, setup guide and
script comment) and W6 (delete the GitHub label after merge).

**Out (follow-ups for the PR body):**

- **Agent memory notes** (outside the repository, orchestrator's job after merge):
  `visual-baselines-ci-fallback-flow.md` and `docker-linux-baselines-can-differ-from-ci.md`
  describe the label route as live. Update or retire them so future runs do not reach for it.
- **Historical records** under `specs/` (for example `specs/019-code-monospace-font/`),
  `.specify/chores/` and `.specify/bugs/` mention the label. They record what happened then; leave
  them.
- **If Docker ever drifts from CI again** (new glyphs, a Playwright image change), the response is
  a reviewed change that fixes the cause or restores a CI route from git history, not an
  undocumented workaround. Nothing to do now.
- The failure-only `playwright-output` artifact in `ci.yml` (which includes `test-results/`)
  is unchanged; it is for diagnosing a red run, not a baseline source, and this chore does not
  document it as one.

## Constitution Check

- **I. Test-First:** no behaviour changes. One unit-test block is removed because the file it
  checks is deleted (coverage mapping in W4); no new test is needed, since text guidance has no
  alignment test (removed in PR #109) and a "file does not exist" test would only mirror the diff.
- **II. Automated Release Gate:** nothing in `ci.yml` or `verify` changes; the deleted workflow
  was never part of the gate. No check is skipped or weakened.
- **III. Human Review for Major Changes:** **"changes CI, deployment or
  infrastructure configuration" fires**: a GitHub Actions workflow file is deleted. No other
  criterion fires (no dependency, integration or service change; the label is repository
  metadata, not an integration; no contact data, design, cost or constitution change).
  **Verdict: major change (CI configuration)**, flagged in the PR body; it merges on Don's
  approval like any PR, so auto-merge may be armed.
- **IV. First-Party Before Custom:** unchanged; the remaining route is Playwright's own Docker
  image, already in use. No new tool.
- **V. Static by Default:** unchanged.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** unchanged.
- **VIII. Cloudflare Best Practices:** unchanged; no Worker or Cloudflare configuration touched.
- **IX. Cost Ceiling:** unchanged (CI minutes for a labelled run are no longer possible; no cost
  added).
- **X. Accessible, Fast and Private:** unchanged; no page output or baseline image changes.
- **XI. Spec Kit Workflow:** one chore on its own `chore/<slug>` branch via `/chore`. No sibling
  worktree is known to edit these files; if one does, merge `origin/main` before the gate.

## Decision D1 — Remove the CI label fallback (decided)

Don chose **(A) Remove** (2026-10-09; the decision record is on issue #77): delete the workflow,
its tests and the label, and document Docker as the only route. (B) Demote (keep the workflow,
reduced to a one-line last resort) was considered and rejected, because it keeps a second
documented path where the issue asks for Docker to be the only one.

## Work items

### [x] W1 — Shared visual-baselines doc: Docker only

- **Files:** `.claude/skills/_shared/visual-baselines.md`.
- **What:** delete step 4 ("Fallback only if Docker cannot be started …", lines 23–27). In step 2,
  replace "Do not fall back to CI without asking." with wording that makes Docker the only route,
  for example: "Wait for Don to start it; there is no other way to make the Linux baselines." Keep
  steps 1, 2 and 3 otherwise as they are, and the closing "A visual diff nobody predicted …"
  sentence. Add one sentence to step 3: if CI's visual check then fails on images Docker made,
  stop and tell Don (Docker has drifted from CI; fixing that is its own change), rather than
  refreshing from a CI run. This file stays the single copy of the wording.

- **Test:** no behaviour: n/a (agent guidance; no test reads this file since PR #109).

### [x] W2 — CLAUDE.md: drop the fallback mentions

- **Files:** `CLAUDE.md` (Local toolchain "Docker Desktop is normally off" bullet, lines 17–20;
  "Visual baselines" section, lines 24–26).
- **What:** the Docker bullet ends at "… with an `AskUserQuestion` whose question text carries the
  instruction." (remove "; do not fall back to CI without asking"). The Visual baselines section
  reads "(macOS, and Linux via Docker)" instead of "(macOS, Linux via Docker, the CI label
  fallback)".
- **Test:** no behaviour: n/a (agent notes; `CLAUDE.md` is skip-safe and no check reads it).

### [x] W3 — Four pipeline skills: remove Finish step 5

- **Files:** `.claude/skills/deliver/SKILL.md` (lines 237–238), `.claude/skills/tweak/SKILL.md`
  (212–213), `.claude/skills/squash/SKILL.md` (177–178), `.claude/skills/chore/SKILL.md`
  (279–280).
- **What:** delete the identical step "5. If Linux baselines are still owed because Docker could
  not be started, run the CI-label fallback …" and renumber the following Finish steps (6 → 5,
  7 → 6, and so on). No "step 6"/"step 7" cross-reference exists in these files (checked); the
  implementer re-checks after renumbering. The verify-phase pointers to
  `_shared/visual-baselines.md` and the tasks-row Docker mentions stay.
- **Test:** no behaviour: n/a (agent guidance; no alignment test since PR #109).

### [x] W4 — Delete the fallback workflow and its tests

- **Files:** `.github/workflows/visual-baselines.yml` (delete), `tests/unit/ci/workflows.test.ts`
  (delete the `describe(".github/workflows/visual-baselines.yml", …)` block, lines 141–179).
- **What:** remove the file and the block. Nothing else references the workflow: `ci.yml` does
  not, and `verify` never depended on it. `USES_PATTERN` and `read` remain in use by the `ci.yml`
  blocks.
- **Test:** test removal. Primary layer of the removed tests: unit (config). Coverage mapping —
  each removed assertion guarded a property of `visual-baselines.yml` itself, so with the file
  gone the guarantee is no longer needed:
  - "sets permissions: contents: read" → guarded the deleted workflow's token scope; gone with it.
    `ci.yml`'s identical assertion stays.
  - "grants no job a write permission" → same; `ci.yml`'s copy stays.
  - "pins every third-party action to a 40-character SHA" → same; the `ci.yml` block keeps its
    SHA-pin assertion.
  - "installs with --frozen-lockfile" → same; `ci.yml` keeps its own.
  - "never commits or pushes anything itself" → guarded that the baseline job could not push
    images; no job that produces images remains.
  - "has no continue-on-error, no always-false if:, and no secrets other than GITHUB_TOKEN" →
    guarded the deleted job; gone with it.
  A future workflow file would need its own block (no generic all-workflows test exists today;
  adding one is out of scope).

### W5 — Setup guide item 10 and the script comment

- **Files:** `docs/setup.md` (item 10, lines 266–273 and the "Secrets" line 288),
  `scripts/visual-baselines-linux.sh` (header comment, lines 4–5).
- **What:** in `docs/setup.md`, remove the sentences describing `visual-baselines.yml`, the label
  and `gh workflow run`; keep one sentence: "Linux visual baselines are regenerated locally with
  `pnpm run test:visual:update:linux`, which runs in the Playwright Docker image matching
  `@playwright/test` and needs Docker Desktop running." Change "the workflows use only" to "the
  workflow uses only". In the script, replace "Runs the same steps as the `update-baselines` job in
  .github/workflows/visual-baselines.yml, inside the official Playwright image …" with "Builds the
  site and runs `pnpm run test:visual:update` inside the official Playwright image …", keeping the
  rest of the comment. No command in the script changes. The `scripts/build-fixture-site.ts:141`
  comment names the script, not the workflow; leave it.
- **Test:** no behaviour: n/a (documentation and a comment; `docs-content-structure.test.ts`
  bans only removed section names, `TextBlock`/`Offerings`, and is unaffected).

### W6 — Delete the `visual-baselines` label (orchestrator, after merge)

- **Files:** none (repository metadata). The label exists today: "Add to a PR to generate Linux
  visual baselines as a workflow artifact". It is not in `setup/` or any committed config.
- **What:** after the PR merges, run `gh label delete visual-baselines --repo drcdev/dcc-web
  --yes`. If the shell is not allowed to, hand Don that command. Deleting it earlier would leave
  the label route half-removed while the PR is open.
- **Test:** no behaviour: n/a (repository label).

## Docs citations

- GitHub CLI `gh label delete`: https://cli.github.com/manual/gh_label_delete (W6).
- GitHub Actions, removing a workflow: a workflow runs only while its file exists in
  `.github/workflows` on the triggering ref ("About workflows",
  https://docs.github.com/en/actions/writing-workflows/about-workflows); deleting the file stops
  both the `pull_request: labeled` and `workflow_dispatch` triggers. Past runs stay in the Actions
  history.

No Astro or Cloudflare usage changes, so no Astro Docs MCP lookup is needed.

## Risks

- **Docker drifts from CI later.** With the workflow gone there is no CI route to fall back on. Mitigation: four
  first-time matches since #72; W1's new step 3 sentence sends a drift to Don as its own change;
  the workflow is one `git show` away in history.
- **Docker Desktop unavailable when Don is away.** A pipeline needing Linux baselines waits for
  Don. That is already the rule ("ask Don … do not fall back to CI without asking");
  this change only removes the asked-for exception.
- **Full CI tier for a mostly-docs change.** W4 and W5 touch `.github/`, `tests/` and `scripts/`,
  so CI runs the full gate (~6 minutes). Acceptable for one PR; the local gate covers only a deleted
  unit block, so the orchestrator puts the local full-gate run to Don rather than running it by
  default.
- **Renumbering slip in W3.** A missed renumber leaves two step 5s or a gap. The review phase checks
  each Finish list reads 1–6 in order.
- **Sibling worktrees.** Another open branch editing the same skill Finish lists or
  `workflows.test.ts` would conflict; merge `origin/main` before the gate.
