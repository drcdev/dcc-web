# Chore plan: untrack-feature-json (ad-hoc, no issue)

Branch: `chore/untrack-feature-json`, from `main` at a96b3dfe (after #192 merged).
No issue; the PR body describes the chore and closes nothing.

## Goal

`.specify/feature.json` is per-worktree state: the specify command writes the path of the
feature it is working on (`{"feature_directory": "specs/049-post-card-full-click"}` on `main`
today). Because the file is tracked, every feature PR commits its own value. When one sibling PR
merges, every other open feature PR conflicts on this file, goes DIRTY, and no `pull_request`
CI run fires until someone merges `origin/main` by hand (seen on PR #157).

This chore adds `.specify/feature.json` to `.gitignore` and removes it from the index with
`git rm --cached`, so the file stays on disk in each worktree but is never committed again.
`main` is protected, so the untrack lands through this branch's PR. Nothing on the site changes.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Test seen failing first.** The W1 unit test fails before W2 (the file is tracked and not
   ignored) and passes after. The implement summary records the red run.
2. **Ignored.** `git check-ignore -v --no-index .specify/feature.json` exits 0 and names the new
   `.gitignore` line.
3. **Untracked.** `git ls-files .specify/feature.json` prints nothing, and
   `git diff --name-status main -- .specify/feature.json` shows `D`.
4. **Working copy kept.** `.specify/feature.json` still exists on disk in this worktree after W2
   (`git rm --cached`, never plain `git rm`).
5. **Scripts still resolve.** With the file on disk and no `SPECIFY_FEATURE_DIRECTORY` set,
   `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` still prints the
   `FEATURE_DIR` from the file (the resolver reads it from disk; tracking does not matter).
6. **Scope of the diff:** `git diff --name-only main` lists only `.gitignore`,
   `.specify/feature.json` (deleted from the index), `tests/unit/site/config-files.test.ts` and
   `.specify/chores/untrack-feature-json/**`.
7. Local gate: the changed-paths tier (`.gitignore` puts it in the full tier) per CLAUDE.md and
   the check-in-before-full-gate rule; CI `verify` green before merge.

**Before measurement** (at a96b3dfe):

| What | Before |
|---|---|
| `git ls-files .specify/feature.json` | `.specify/feature.json` (tracked) |
| `git check-ignore -v --no-index .specify/feature.json` | no output, exit 1 |
| Content on `main` | `{"feature_directory": "specs/049-post-card-full-click"}` |
| Open feature PRs that conflict when a sibling merges | every one that committed its own value |

## Scope

**In:**

- `.gitignore`: one entry, `.specify/feature.json`, with a short `#` header comment, placed
  beside the `# Spec Kit extension catalog cache` group.
- `git rm --cached .specify/feature.json`.
- `tests/unit/site/config-files.test.ts`: one test (W1).
- This plan, and the review report later.

**Out:**

- `.specify/scripts/bash/common.sh`, `create-new-feature.sh`, `check-prerequisites.sh` and
  `.claude/skills/speckit-specify/SKILL.md`: they keep writing and reading the file on disk,
  which is still correct. These are Spec Kit's own files (Principle XI: no custom conventions on
  top of it).
- A branch-name fallback in the feature resolver (see follow-ups).
- `tests/unit/ci/changed-paths.test.ts`: it uses `.specify/feature.json` only as a sample path
  string for the skip-safe classifier; the path still classifies the same and the test stays
  green without the file being tracked.
- Historical records under `specs/`, `.specify/chores/` and `.specify/bugs/` that mention the
  file: they record what happened then.
- CLAUDE.md and the `/deliver`, `/tweak`, `/squash`, `/chore` skills: nothing in them depends on
  the file being tracked.

**Follow-ups for the PR body:**

- **Resumed worktree with no feature.json.** A fresh worktree that checks out an existing
  feature branch now has no `.specify/feature.json`, and the resolver (`common.sh`, env var →
  file → hard error) fails plan/tasks/implement until `SPECIFY_FEATURE_DIRECTORY` is set or
  specify runs again. This is not a regression worth fixing here: before this chore such a
  worktree held whatever value the branch last committed, which for a branch cut from `main`
  was a stale pointer to the last merged feature, so it was wrong silently instead of failing
  loudly. `/deliver` runs specify first and writes the file locally. A branch-name fallback, if
  wanted, is a separate change to Spec Kit's scripts.
- **One last conflict for in-flight PRs.** Feature PRs open when this merges will see a
  modify/delete conflict on `.specify/feature.json` the next time they merge `origin/main`.
  Resolve by keeping the deletion (`git rm --cached .specify/feature.json`, keep the local
  copy). After that the conflict cannot recur.

## Constitution Check

- **I. Test-First:** W1 (unit) is written and seen failing before W2.
- **II. Automated Release Gate:** no check is skipped or weakened; one test is added.
- **III. Human Review of Every Change:** normal PR from `drc-agents`, Don approves, auto-merge
  armed after the final push.
- **IV. First-Party Before Custom:** uses git's own `.gitignore` and `git rm --cached`; no
  tooling added. No Astro or Cloudflare choice is made, so no Astro Docs lookup is needed.
- **V. Static by Default:** unchanged; nothing ships.
- **VI. Content as Files:** unchanged; `feature.json` is pipeline state, not content.
- **VII. Private Data:** unchanged.
- **VIII. Cloudflare Best Practices:** unchanged.
- **IX. Cost Ceiling:** unchanged; no recurring cost.
- **X. Accessible, Fast and Private:** unchanged.
- **XI. Spec Kit Workflow:** Spec Kit's scripts and naming are untouched; the change removes a
  file that parallel worktrees all edited, which is what XI asks to avoid.

## Work items

### W1: Unit test that `.specify/feature.json` is ignored and untracked (test first)

- **Files:** `tests/unit/site/config-files.test.ts` (new `it` beside "ignores .cache/ in git").
- **Test:** one case, titled for the rule ("never tracks the per-worktree
  .specify/feature.json"). It runs `git check-ignore -q --no-index .specify/feature.json` (exit
  0) and `git ls-files .specify/feature.json` (empty output) from the repo root with
  `node:child_process` `execFileSync`. `--no-index` makes the ignore check read the rules even
  while the file is still tracked, so the test is red before W2 on both counts.
- **Layer:** unit. It is the cheapest layer that sees the repository's ignore rules and index;
  no build or browser is involved. No second layer. This is an invariant (per-worktree state is
  never committed), not a mirror of a config value, and follows the existing `.cache/` and
  `.reference/` ignore tests. CI checks out a full git work tree, so `git` is available.

- [x] W1 done (test seen red: `check-ignore --no-index` exits 1 before W2)

### W2: Ignore and untrack `.specify/feature.json`

- **Files:** `.gitignore` (add
  `# Spec Kit current-feature pointer, written per worktree by specify` and
  `.specify/feature.json`, next to `.specify/extensions/.cache/`); index removal of
  `.specify/feature.json` via `git rm --cached .specify/feature.json`.
- **Test:** W1 turns green; acceptance 2–5 checked by hand and recorded in the implement
  summary.
- **Layer:** unit (W1).
- **Note:** after this, the `speckit-git-commit` auto-commits never stage the file, because
  ignored untracked files are skipped by `git add -A`.

## Docs citations

- gitignore: "A gitignore file specifies intentionally untracked files that Git should ignore.
  Files already tracked by Git are not affected" — hence the `git rm --cached` step.
  https://git-scm.com/docs/gitignore
- `git rm --cached`: "Use this option to unstage and remove paths only from the index. Working
  tree files, whether modified or not, will be left alone."
  https://git-scm.com/docs/git-rm#Documentation/git-rm.txt---cached
- `git check-ignore --no-index`: "Don't look in the index when undertaking the checks", so a
  tracked path still reports its matching rule. https://git-scm.com/docs/git-check-ignore

## Risks

- **Modify/delete conflict on in-flight PRs** (see follow-ups). One-time; resolution is to keep
  the deletion.
- **Pulling this deletes the local copy once.** `git rm --cached` keeps the file only in this
  worktree; in other worktrees git removes a tracked file from the working tree when a merge
  deletes it. A worktree that pulls
  this change loses its local `feature.json` once and must re-run specify or set
  `SPECIFY_FEATURE_DIRECTORY` to resume. Low impact: only worktrees mid-feature are affected,
  and they will be resolving the conflict above at the same moment (keep a copy before
  resolving if needed).
- **Test depends on git in the test environment.** Vitest runs from a git checkout locally and
  in CI; if `git` were missing the test fails loudly rather than passing falsely.
