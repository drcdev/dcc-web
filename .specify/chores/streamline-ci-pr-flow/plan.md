# Chore plan: streamline-ci-pr-flow

Branch: `chore/streamline-ci-pr-flow`, from `main` at d9de5a5 (after #144 merged).
Closes [#143](https://github.com/drcdev/dcc-web/issues/143).

## Goal

Since PR #105, every pull request needs Don's code-owner approval, so the "major change"
classification no longer changes how anything merges. It survives only as a plan and PR-body
label, and as the one reason auto-merge is sometimes left off (open `[PREVIEW-CHECK]` items).
[Issue #143](https://github.com/drcdev/dcc-web/issues/143) asks for one flow for every PR:
auto-merge is always armed, because Don's approval is the gate, and the major/minor distinction
is removed everywhere (constitution, the four pipeline skills, `_shared/`, `CLAUDE.md`, docs and
agent memory). It also asks that changes under `.specify/` and `.claude/` stop triggering full
verify runs, and that anything else safe to cut is cut. This chore removes the classification,
makes auto-merge unconditional, widens the CI skip-safe tier to every non-code file under
`.claude/` and `.specify/` (plus `VOICE.md`), routes skill files to the docs tier because a unit
test reads them, closes the drift-guard gap that hid that read, and gives the pipelines a local
tier so a skip-safe or docs branch no longer runs the ~8-minute local gate. No page, test subject
or snapshot changes.

## Acceptance

**Before-measurement** (from the explore phase, `gh run list` / `gh run view`, wall time
createdAt→updatedAt):

| Change | Tier today | CI wall time today |
|---|---|---|
| Constitution only (PR #146, run 38063348319) | skip-safe | 51 s (static 28 s) |
| Docs only (PR #139, run 38030592543; main push 38030667825) | docs | 52 s / 51 s |
| `.specify/extensions/.registry`, any `.txt`/`.toml`/extensionless file under `.claude/` or `.specify/`, `VOICE.md` | full | ~604 s (PR #144 run 38034742498); main pushes 376–581 s |
| Local gate for any pipeline branch, whatever it touches | full `pnpm run verify` | ~5:39 to ~8 min (memory: verify-gate profile) |

Latent defect found while planning: `tests/unit/site/docs-content-structure.test.ts:142` walks
every `.md/.mdx/.txt/.yml/.yaml/.json` file under `.claude/skills`, but those files are
skip-safe today, so a skill edit skips the unit tests that read it. The drift guard in
`tests/unit/ci/changed-paths.test.ts` misses it because it only expands file literals, not a
directory literal (`".claude/skills"`).

Criteria:

1. `.specify/memory/constitution.md` is version **3.0.0**, amended through the
   `speckit-constitution` skill (the Sync Impact Report names it). Outside the HTML comment it
   contains no "major change" or "major-change" (case-insensitive); Principle III is titled
   **Human Review of Every Change**, still requires Don's approval on every PR through the
   ruleset and CODEOWNERS, still requires the machine account, and says auto-merge is armed on
   every PR and merges only after Don approves and the release gate passes.
2. A case-insensitive search for `major[- ]change` and for `Human Review for Major Changes`
   across `CLAUDE.md`, `.claude/`, `docs/`, `.github/` and `scripts/` finds nothing. Historical
   records (`.specify/chores/`, `.specify/bugs/`, `specs/`) and the constitution's Sync Impact
   Report are excluded.
3. `.claude/skills/_shared/open-pr.md` has no classification step and tells the orchestrator to
   arm auto-merge on every PR right after the final push, with no exception for
   `[PREVIEW-CHECK]` items. `preview-check.md` says open items are listed in the PR body for Don
   to walk before approving and do not hold back auto-merge.
4. None of the four pipeline skills has a "Major-change classification" Finish step, a
   "major-change verdict" in the PR body or final report, or a plan/review instruction about
   Principle III criteria; each Finish list is numbered without gaps.
5. `decide()` sorts these single-file pull requests as stated (new unit cases in
   `changed-paths.test.ts`):
   - skip-safe: `.specify/extensions/.registry`, `.specify/notes.txt`, `.claude/settings.json`,
     `.claude/agents/x.md`, `.specify/templates/x.toml`, `VOICE.md`, plus everything skip-safe
     today except the skill files;
   - docs: `.claude/skills/deliver/SKILL.md`, `.claude/skills/_shared/open-pr.md`,
     `.claude/skills/setup-walkthrough/SKILL.md` (today: full), `.claude/skills/x/notes.txt`;
   - full: `.claude/hooks/check.ts`, `.claude/x.js`, `.specify/x.mjs`, `.claude/skills/x/run.ts`,
     `.specify/x.astro`, `.github/CODEOWNERS`, `.github/dependabot.yml`,
     `setup/github-ruleset.json`, `nested/CLAUDE.md`, `nested/VOICE.md`, and every case in the
     current `UNSAFE` list except `.specify/extensions/.registry` and the setup-walkthrough skill.
6. The drift guard expands a directory literal to every file under it. With the W2 test change
   and the old classifier, it fails naming `docs-content-structure.test.ts` and at least one
   `.claude/skills/` file (seen red); with the W2 classifier it passes.
7. `node scripts/ci/changed-paths.ts --base origin/main`, run on a branch, prints
   `tier=<tier>: <reason>` for `git diff origin/main...HEAD` and writes no `GITHUB_OUTPUT`;
   a base that is not a plain ref (leading `-`, `..`, whitespace) prints `tier=full`.
   `_shared/verify-gate.md` tells the orchestrator to run it before the gate and maps
   skip-safe → `pnpm run lint:secrets`, docs → `pnpm run lint:secrets && pnpm run test:unit`,
   content-only or full → the full `pnpm run verify`.
8. `docs/testing.md` "Change tiers" and the `docs/setup.md` item 10 paragraph describe the new
   skip-safe and docs rules and the local tier, and the three `docs/setup.md` "Constitution
   principle" lines read "III (Human Review of Every Change)".
9. `CLAUDE.md` Merging says to arm auto-merge on every PR after the final push and no longer has
   the "Leave auto-merge off" bullet or a major-change sentence.
10. The memory files named in W9 no longer state the major-change classification, the
    "auto-merge off while PREVIEW-CHECK is open" rule, or "always ask before the full gate" for
    branches the local tier sorts as skip-safe or docs.
11. `git diff --name-only main` lists only files named in W1–W8 plus
    `.specify/chores/streamline-ci-pr-flow/**` (and a merge of `origin/main` if #146 lands
    first). `.github/workflows/ci.yml`, `scripts/ci/verify-needs.ts`, `.github/CODEOWNERS`,
    `src/`, `worker/`, `public/`, `tests/e2e/` and snapshots are unchanged.
12. **After-measurement:** the review phase reruns `decide()` over the criterion-5 lists (the
    unit tests) and times `pnpm run lint:secrets && pnpm run test:unit` locally under the perl
    alarm as the docs-tier local gate, against the ~5:39–8 min full gate. This PR itself is
    full tier in CI (`scripts/` and `tests/` change); verify must be green.

## Scope

**In:** W1–W9.

**Out (follow-ups for the PR body):**

- **No AGENTS.md exists** in the repository; none is created.
- **`.github/CODEOWNERS` is unchanged.** Its comment cites Principle III for "every pull request
  needs Don's approval", which stays true: Principle III keeps its number and that rule.
- **`specs/` keeps its extension allowlist.** The issue names `.specify` and `.claude`; `specs/`
  already skips for its Markdown and JSON, and has no other file types today.
- **Merge the skip-safe and docs tiers.** The skip-safe constitution run (51 s) and the docs run
  (52 s) differ by seconds because install dominates. One "agent and docs" tier running
  secretlint and the unit tests would drop a tier and the `READ_BY_CHECKS` idea entirely, at the
  cost of a `ci.yml`, `verify-needs.ts` and `workflows.test.ts` change. Not done here.
- **The full run on the merge-commit push to `main`.** With merge commits and "branch must be up
  to date", the tree pushed to `main` is the tree the PR run already verified, so the 376–581 s
  main run repeats work. Removing or narrowing it touches Principle II ("production deploys only
  … after CI passes") and is Don's call, not a chore's.
- **Historical records** under `.specify/chores/`, `.specify/bugs/`, `specs/` and the older
  per-issue memory notes mention major changes; they record what happened then and stay.
- **Accepted risk, carried:** nothing notices a non-unit check that starts reading `docs/` or
  `.claude/skills/` (docs tier). The docs/testing.md note is widened to name both.

## Constitution Check

Judged against the constitution on `main` (2.3.0), because that is what this PR is reviewed under.

- **I. Test-First:** the classifier change (W2) and local tier (W3) start with failing unit tests;
  the drift-guard fix is seen red first. Skill, doc and memory edits have no behaviour to test.
- **II. Automated Release Gate:** CI still runs every check that reads a changed file; the docs
  tier now catches skill edits that today skip their unit test, so the gate gets stricter. The
  local tier only narrows the agent's pre-PR run; CI stays the gate. No check is skipped,
  disabled or weakened.
- **III. Human Review for Major Changes:** **fires** — "changes CI … configuration"
  (`scripts/ci/changed-paths.ts` decides which CI jobs run) and "amends this constitution" (W1).
  The PR body flags both this one last time; after the merge the classification no longer exists.
- **IV. First-Party Before Custom:** GitHub's own `paths`/`paths-ignore` filters are the
  first-party option; they fall short because a workflow skipped by a path filter leaves its
  required check pending and blocks the merge (cited below), which is why the tier script and
  job-level `if:` exist. W3 reuses that script rather than adding a tool. Docs cited below.
- **V. Static by Default:** unaffected; no page or endpoint changes.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected; secretlint still runs on every tier, including the widened
  skip-safe one.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** no new cost; CI minutes go down. W1 keeps the duty to state a new
  recurring cost.
- **X. Accessible, Fast and Private:** unaffected; the visual, a11y and budget projects run on
  every non-skip-safe, non-docs change as before.
- **XI. Spec Kit Workflow:** chore branch and `.specify/chores/` layout as the `/chore` skill
  defines; the constitution changes only through `speckit-constitution`.

## Work items

### W1 — Amend the constitution to 3.0.0 (via `speckit-constitution`) [x] done

- **Files:** `.specify/memory/constitution.md`.
- **Order note:** first `git fetch origin` and check PR #146 (`gh pr view 146 --json state`). If
  it has merged, `git merge origin/main` before amending, so the amendment starts from 2.3.1. If
  it is still open, amend from 2.3.0; the orchestrator merges `origin/main` after #146 lands and
  resolves the design-baseline line to #146's wording without its "major change" sentence, and
  the Sync Impact Report's "from" version becomes 2.3.1.
- **What:** run the `speckit-constitution` skill with this amendment (never a hand edit):
  - **Principle III** retitled **Human Review of Every Change**. Keep: every PR needs Don's
    approving review; the `main` ruleset enforces it and CODEOWNERS names Don for every path;
    agents open PRs from a separate machine account because GitHub does not count an author's
    own approval. Add: every PR follows the same flow; auto-merge is armed on every PR once it is
    opened and merges only after Don approves and the release gate passes; Don withholds
    approval until he has checked whatever the PR body asks him to check, including on the
    preview deployment. Remove: the major-change list, the classification and flag sentence, and
    "when in doubt, treat the change as major".
  - **Principle IX:** "Any change that could add a recurring cost is a major change and must
    state…" → any change that could add a recurring cost states the expected monthly cost in its
    plan and its PR body.
  - **Technology Constraints:** design baseline drops "Deviations from it are major changes" (the
    blocking visual baselines already catch a design-system change; Principle III review covers
    it). "New tools, services or libraries outside this list require a major-change review" →
    they follow Principle IV: the plan names the first-party option considered and why it falls
    short.
  - **Governance:** amendments are "reviewed as a major change" → reviewed in a pull request like
    any other change.
  - Security Baseline's "(… ; Principle III)" stays (still the review principle).
- **Version:** **MAJOR, 2.3.x → 3.0.0.** The Governance rule makes "removing or redefining a
  principle" MAJOR. Principle III is redefined (retitled; its classification, which IX, the
  Technology Constraints and Governance relied on, is removed). The skill's Sync Impact Report
  lists the modified principles (III, IX), the modified sections (Technology Constraints,
  Governance), the templates reviewed, and that the per-issue history is unchanged.
- **Test:** no behaviour: n/a (no test reads the constitution; confirmed by the explore phase).

### W2 — Widen the skip-safe tier, route skills to docs, fix the drift guard

- **Files:** `scripts/ci/changed-paths.ts`, `tests/unit/ci/changed-paths.test.ts`.
- **Tests first (unit over config; primary layer unit — the classifier is a pure function and
  the guard reads source files, nothing needs a build or browser):**
  1. Move `.specify/extensions/.registry` from `UNSAFE` to `SAFE`; add the criterion-5 skip-safe
     paths to `SAFE`; add the criterion-5 full paths to `UNSAFE`; move the skill paths
     (`deliver`, `tweak`, `squash`, `chore`, `_shared/verify-gate.md`, `other`) out of `SAFE` and
     into the docs-tier true list together with `setup-walkthrough/SKILL.md` and
     `.claude/skills/x/notes.txt`; add `.claude/skills/x/run.ts` to the docs-tier false list.
  2. Rewrite "skips when only pipeline skills, shared wording, CLAUDE.md or the constitution
     change" to expect `docs`, and add "skips when only CLAUDE.md, VOICE.md, the constitution and
     Spec Kit files change" expecting `skip-safe`. "runs everything when a deny-listed file
     changes" becomes "runs the docs tier when the setup-walkthrough skill changes".
  3. Drift guard: when a matched literal names a directory in the repository (no placeholder),
     expand it to every file under it (reuse the `walk(…, true)` helper). Extend the pattern to
     `VOICE.md`. The assertion message names the docs tier as the fix for a unit-test reader.
     Run it against the old classifier and see it fail on `docs-content-structure.test.ts`.
- **Then the code:** in `changed-paths.ts`:
  - `SKIP_SAFE_FILES = ["CLAUDE.md", "VOICE.md"]` (no file reads `VOICE.md`; grep found no
    reader in `src/`, `scripts/`, `tests/` or the configs).
  - Under `.claude/` and `.specify/`, any file is skip-safe unless its extension is one that
    `eslint .` or `astro check`/`tsc` reads: `CODE_EXTENSIONS = [".js", ".mjs", ".cjs", ".jsx",
    ".ts", ".mts", ".cts", ".tsx", ".astro"]` (ESLint's flat-config default patterns plus the
    typescript-eslint and Astro plugin patterns, and `tsconfig.json` `include: ["**/*"]`). Those
    stay full. `specs/` keeps `SKIP_SAFE_EXTENSIONS` unchanged.
  - Files under `.claude/skills/` are not skip-safe; a non-code file there is docs tier
    (`isDocs` becomes "a `.md` file under `docs/`, or a non-code file under `.claude/skills/`").
    `READ_BY_CHECKS` is removed: its one entry is read by a unit test and is now docs tier. Keep
    the `..`, leading `/` and backslash rejections in every predicate.
  - Update the header comment and the `isDocs` doc comment to say what each tier now holds.
- **Excluded, one line each (stay full):** `.github/CODEOWNERS` — governs required reviewers and
  `setup-check` reads it; `.github/dependabot.yml` — CI configuration read by
  `tests/unit/ci/dependabot.test.ts`; `setup/*.json` — read by `setup-check` and
  `tests/unit/setup/drift.test.ts` (there is no `setup/*.md`); `.env.example`, `.nvmrc` — read by
  tests or the toolchain.
- **Included, one line each:** `.claude/settings*.json` — read only by the local Claude Code
  harness, never by CI or the build; `.specify/scripts/**`, `.specify/extensions/**` — run only
  locally by Spec Kit hooks (no reference from `.github/`, `package.json`, `scripts/` or
  `tests/`); `VOICE.md` — read by no check.
- **Coverage mapping (cases moved, none removed):** `.specify/extensions/.registry` full →
  skip-safe (no reader; drift guard proves it); `.claude/skills/setup-walkthrough/SKILL.md` full
  → docs (its only reader, `tests/unit/setup/skill-behaviour.test.ts`, runs in `test:unit`, which
  the docs tier runs); other skill files skip-safe → docs (their reader,
  `docs-content-structure.test.ts`, also runs in `test:unit`). The old "deny-listed file" case is
  now asserted as a docs-tier case.

### W3 — Local tier: `changed-paths.ts --base <ref>`

- **Files:** `scripts/ci/changed-paths.ts`, `tests/unit/ci/changed-paths.test.ts`.
- **Tests first (new-first; primary layer unit — `collectFiles` and `decide` take an injected git
  runner):** `collectFiles({ event: "local", base: "origin/main" }, git)` calls
  `["diff", "--name-only", "--no-renames", "origin/main...HEAD"]` and never fetches; a base that
  starts with `-`, contains `..`, whitespace or a backslash, or is empty returns `null` without
  calling git; `decide({ event: "local", files })` sorts like a pull request.
- **Then the code:** accept `event: "local"` in `decide` and `collectFiles`; `main()` reads
  `--base <ref>` from `process.argv`, uses event `local`, prints the same `tier=…: reason` line
  and changed-file list, and writes `GITHUB_OUTPUT` only when that variable is set (unchanged).
  No new dependency; `node:util` `parseArgs` is the first-party option if argument parsing is
  needed.
- **Why:** the local `pnpm run verify` is the pipelines' pre-PR gate and costs ~5:39–8 min and a
  question to Don each time. CI already sorts the same branch into the same tier; W5 tells the
  orchestrator to run only that tier's checks locally.

### W4 — Docs: tiers, setup guide, design note

- **Files:** `docs/testing.md` (Change tiers table and the accepted-risk note, lines ~49–72; the
  Visual row's "(Principle III)" at line 26), `docs/setup.md` (item 10 paragraph lines ~269–272;
  "Constitution principle" lines 193, 301, 325), `docs/design/blog.md` (line 298).
- **What:** tier table: skip-safe = `CLAUDE.md`, `VOICE.md`, and any file under `.claude/` or
  `.specify/` except code files (list the extensions) and `.claude/skills/`, plus the listed
  extensions under `specs/`; docs = `.md` under `docs/` and non-code files under `.claude/skills/`
  (unit tests read both). Widen the accepted-risk note to name `.claude/skills/`. Add one
  paragraph: pipelines run `node scripts/ci/changed-paths.ts --base origin/main` and run only
  that tier's checks locally; CI remains the gate. `docs/setup.md` item 10: say the same in its
  plain style; lines 193/301/325 read "III (Human Review of Every Change)". `docs/testing.md:26`:
  "A diff is a design-system change (Principle III)" → "A diff is a design-system change, reviewed
  on its pull request". `docs/design/blog.md:298`: drop "(Principle III)" and "and reviewed as
  one".
- **Test:** no behaviour: n/a (documentation). `tests/unit/setup/docs-structure.test.ts` and
  `docs-content-structure.test.ts` read these files and must stay green (run them).

### W5 — Shared pipeline wording

- **Files:** `.claude/skills/_shared/open-pr.md`, `preview-check.md`, `visual-baselines.md`,
  `verify-gate.md`.
- **What:**
  - `open-pr.md`: title "Open the PR and arm auto-merge (shared)"; delete step 1
    (classification) and renumber; the auto-merge step runs `gh pr merge --auto --merge` as
    `drcdev` on every PR right after the final push, with no exception. Open `[PREVIEW-CHECK]`
    items go in the PR body under their own heading; Don walks them before approving, and his
    approval is the gate. Keep "arm only after the last commit you mean to push" (the #59
    lesson). If the command is blocked, hand Don the command (existing practice).
  - `preview-check.md`: last bullet → open items are listed in the PR body for Don to walk on the
    preview before approving; they do not hold back auto-merge.
  - `visual-baselines.md:10`: drop ", which is a major change under Principle III in any case".
  - `verify-gate.md`: replace "There is no scoped or tiered local gate …" with the W3 local tier:
    before the gate, run `node scripts/ci/changed-paths.ts --base origin/main` (after
    `git fetch origin`); skip-safe → `pnpm run lint:secrets`; docs →
    `pnpm run lint:secrets && pnpm run test:unit`; content-only or full → the full
    `pnpm run verify`. Only the full-gate case needs Don's go-ahead (memory rule); the others are
    seconds. CI runs the same tier and is the gate.
- **Test:** no behaviour: n/a (agent guidance; no test reads `_shared/` except the
  `docs-content-structure` name ban, which these edits do not trip).

### W6 — `/deliver` and `/tweak` skills

- **Files:** `.claude/skills/deliver/SKILL.md`, `.claude/skills/tweak/SKILL.md`.
- **What:**
  - deliver: phase 3 plan row drops "Flag whether the slice is a **major change** under
    Principle III and why."; Finish drops step 3 and renumbers (no dangling "step N"); the PR body
    and final report drop "the major-change verdict and criteria" and keep "whether auto-merge is
    armed". The Finish gate step points to `_shared/verify-gate.md` for the local tier.
  - tweak: frontmatter description ends "… never for a dependency, CI, deployment, design-system
    or constitution change" instead of "a major change under Constitution Principle III";
    triage condition 1 becomes **"No platform change."** with the same concrete list (it is now
    tweak's own size boundary, not a constitution classification); the paragraph "Condition 1 is
    deliberately the constitution's own major-change list …" is replaced by one sentence saying
    condition 1 keeps `/tweak` to changes the short pipeline can cover, re-checked against the
    real diff in Finish. Finish step 3 becomes "Re-check triage condition 1 against the real
    diff; if it fails, say so in the PR body" (no classification), PR body and report drop the
    verdict.
- **Test:** no behaviour: n/a (agent guidance; no test reads these files except the name ban).

### W7 — `/squash` and `/chore` skills

- **Files:** `.claude/skills/squash/SKILL.md`, `.claude/skills/chore/SKILL.md`.
- **What:**
  - squash: Finish drops step 3 and renumbers; PR body and final report drop the verdict.
  - chore: delete the "A chore **may be a major change** under Principle III …" paragraph (lines
    ~53–57), or reduce it to "Every chore opens and merges like any other PR (see
    `_shared/open-pr.md`)."; phase 2 plan row: Constitution Check is "every principle in one line
    each" with no Principle III criteria clause, and the return drops "the Principle III verdict";
    phase 4 review row drops "the Principle III verdict still right against the real diff";
    Finish drops step 3 and renumbers; PR body and final report drop the verdict. The local gate
    step points to `_shared/verify-gate.md` for the tier. (This is the skill running this
    pipeline; the change applies from the next run.)
- **Test:** no behaviour: n/a (agent guidance).

### W8 — `CLAUDE.md` Merging

- **Files:** `CLAUDE.md` (Merging, lines ~43–50).
- **What:** "Enable auto-merge by default …" → **Arm auto-merge on every PR**: run
  `gh pr merge --auto --merge` right after the final push. Branch protection holds the merge until
  Don approves and `verify` is green. Replace the "Leave auto-merge off only when …" bullet with:
  open `[PREVIEW-CHECK]` items are listed in the PR body; Don checks them on the preview before
  approving, so they do not hold back auto-merge. Drop the major-change sentence. No AGENTS.md is
  created.
- **Test:** no behaviour: n/a (agent notes; no test reads `CLAUDE.md`).

### W9 — Agent memory (outside the repository)

- **Files** (in `/Users/doncoleman/.claude/projects/-Users-doncoleman-Repos-dcc-web/memory/`):
  `single-approval-pr-105.md`, `prs-open-from-drc-agents.md`,
  `watching-pr-checks-from-worktree.md`, `chore-in-enterworktree.md`,
  `auto-merge-beats-after-figures-push.md`, `deliver-pipeline-origin.md`, `docs-only-gate-031.md`,
  `check-in-before-full-verify-gate.md`, and the matching index lines in `MEMORY.md`.
- **What:** edit only the sentences that state a now-stale rule: the major-change gate or
  classification, "approved major-change PRs need auto-merge by hand", auto-merge off while
  `[PREVIEW-CHECK]` is open, and "ask Don before every full verify" (now: only when the local tier
  is content-only or full). State the new rule in one line where the old one stood, citing #143.
  Do not touch the historical per-issue notes (they record what happened then).
- **Test:** no behaviour: n/a (memory files are outside the repository; nothing reads them in CI).
  Not committed (outside the worktree); the implement summary lists the files changed.

## Docs citations

- GitHub, skipped but required checks: a workflow skipped by `paths`/`paths-ignore` leaves its
  required check "Pending" and blocks the merge, while a job skipped by an `if:` conditional
  reports success. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/troubleshooting-required-status-checks#handling-skipped-but-required-checks
  — why the tier stays a script plus job-level `if:` (no `ci.yml` change in this chore).
- GitHub Actions job conditionals: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution
  (existing `needs.changes.outputs.tier` conditions, unchanged).
- GitHub auto-merge: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request
  and `gh pr merge --auto`: https://cli.github.com/manual/gh_pr_merge — auto-merge waits for every
  required review and check, so arming it on every PR does not bypass Don's approval.
- Code owners and required review: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- `git diff A...B` (merge-base diff) for the local tier: https://git-scm.com/docs/git-diff
- Node `util.parseArgs` (first-party argument parsing, W3): https://nodejs.org/api/util.html#utilparseargsconfig
- ESLint flat-config file matching (which extensions `eslint .` reads, W2 code-extension list):
  https://eslint.org/docs/latest/use/configure/configuration-files#specifying-files-and-ignores
- Constitution: amended only through the `speckit-constitution` skill (Spec Kit's constitution
  command), per Governance.

No Astro or Cloudflare usage changes, so no Astro Docs MCP lookup is needed.

## Risks

- **Constitution conflict with PR #146** (2.3.0 → 2.3.1, same file, design-baseline line). W1's
  order note handles it; the final version is 3.0.0 either way.
- **Code-extension list drifts from ESLint/tsc.** If a new linted extension (for example `.vue`)
  is added to `eslint.config.js`, a file of that type under `.claude/` or `.specify/` would skip
  lint. Mitigation: no code lives there today; the header comment in `changed-paths.ts` names the
  list's source so the next lint change updates it.
- **Docs tier misses a non-unit reader** of `.claude/skills/` (same accepted risk as `docs/`);
  named in `docs/testing.md`. The widened drift guard covers skip-safe paths, not docs-tier ones.
- **Skill edits get slightly slower in CI** (skip-safe 51 s → docs ~52 s): the price of running
  the unit tests that read them; correctness over seconds.
- **Local tier trusts the branch diff.** A stale `origin/main` gives a wrong diff; W5 says to
  `git fetch origin` first. CI recomputes the tier independently, so a wrong local tier can only
  delay a red result to CI, never merge one.
- **Auto-merge with open `[PREVIEW-CHECK]` items** merges as soon as Don approves. That is the
  intended flow: his approval is the gate, and the PR body lists what to check first.
- **This PR is full tier in CI** (`scripts/`, `tests/` change). The local gate under the old rule
  is the full `pnpm run verify`; the orchestrator asks Don before running it (or relies on CI per
  his standing okay when local load is high).
- **The chore skill edits itself** (W7). Later phases of this run follow the version loaded at
  start; the change applies from the next run.
