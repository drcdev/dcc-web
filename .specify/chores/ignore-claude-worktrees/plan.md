# Chore plan: ignore-claude-worktrees (no issue)

Branch: `chore/ignore-claude-worktrees`. Ad-hoc chore that Don asked for in chat after the full gate
on PR #205 failed for this reason. No issue to close.

## Goal

`.claude/worktrees/**` holds sibling Claude Code worktree checkouts. It is gitignored and is not
this checkout's code. When a worktree is present, `pnpm run lint` walks into it and fails on every
file with "Parsing error: No tsconfigRootDir was set, and multiple candidate TSConfigRootDirs are
present". Add the directory to ESLint's global ignores so that lint covers only this checkout.

## Acceptance

Before (measured during exploration, with `.claude/worktrees/constitution-current-site` present):

- `pnpm run lint` reports 857 errors and exits non-zero;
- `eslint . --ignore-pattern '.claude/worktrees/**'` exits 0, so the ignore is the whole fix.

After:

1. The global `ignores` block in `eslint.config.js` contains `".claude/worktrees/**"`, with a
   comment written like the others in the block.
2. A new unit test in `tests/unit/site/config-files.test.ts` checks that some config object's
   `ignores` contains `.claude/worktrees/**`. It was seen failing before W1's config change and
   passes after it.
3. With a sibling worktree present under `.claude/worktrees/`, `pnpm run lint` exits 0. If no
   worktree exists when this runs, criterion 2 shows the same thing without one.
4. The existing ESLint tests are unchanged and still pass: `config-mdx.test.ts:35` (`.cache/**`)
   and the worker-block test at `config-files.test.ts:357-372`.

## Scope

**In:** W1 only (`eslint.config.js` plus one unit test).

**Checked, not changed:**

- `tsconfig.json`: `tsc --listFilesOnly` lists 2467 files and none are under `.claude/worktrees`.
  `worker/tsconfig.json` lists none either.
- `.secretlintignore`: secretlint passes in 1.5 s with the worktree present, because it honours
  `.gitignore`.
- Vitest (includes only `tests/unit`, `tests/component` and `tests/build`), Playwright
  (`testDir ./tests/e2e`) and `scripts/` (none of them walks the root). The repo has no Prettier.

**Out:**

- A root-level `tsconfigRootDir` or `projectService` for the default block. The ignore removes the
  cause, and changing parser options would widen the change.
- Changes to `scripts/ci/changed-paths.ts`. It classifies `eslint.config.js` as code, so the
  change runs the full tier.

**Follow-ups:** none.

## Constitution Check

- I Test-First: the unit test is written first and seen failing before the config edit.
- II Release Gate: lint gets more accurate. No check is skipped or weakened, and every path in
  this checkout is still linted.
- III Human Review: a normal PR from `drc-agents` with auto-merge armed. Don approves it.
- IV First-Party: uses ESLint's own flat-config global `ignores` and adds no plugin or wrapper. No
  Astro feature is involved, so the Astro Docs MCP is not needed.
- V Static: N/A, no runtime change.
- VI Content: N/A.
- VII Private Data: N/A.
- VIII Cloudflare: N/A.
- IX Cost: no cost.
- X Accessible/Fast/Private: N/A, nothing visible changes.
- XI Spec Kit: chore flow on a `chore/<slug>` branch, with the plan in `.specify/chores/<slug>/`.

## Work items

### [x] W1 Ignore `.claude/worktrees/**` in ESLint

- **Test first** (unit layer, the cheapest; this file already imports `eslint.config.js`): add an
  `it` to the "worker workspace and tooling wiring" describe in
  `tests/unit/site/config-files.test.ts`. Import the default export the same way the worker-block
  test does (with `HEAVY_IMPORT_TIMEOUT`) and assert
  `configs.some((c) => c.ignores?.includes(".claude/worktrees/**"))`. Run it and see it fail.
- **Change:** in the `ignores` array of `eslint.config.js`, after `.reference/**`, add:
  ```js
      // Claude Code worktrees: full sibling checkouts, gitignored, not this
      // checkout's code.
      ".claude/worktrees/**",
  ```
- **Verify:** the new test passes, and so do the two existing ESLint tests. With the sibling
  worktree present, `pnpm run lint` exits 0. Do not modify anything under `.claude/worktrees/`.

## Docs citations

- ESLint, "Ignore Files" (flat config): https://eslint.org/docs/latest/use/configure/ignore. A
  config object whose only key is `ignores` acts as a global ignore, and a pattern ending in
  `/**` ignores everything under that directory.

## Risks

- **No worktree when the acceptance runs.** Then criterion 3 cannot show a difference. Criterion 2
  and the before-measurement above cover it.
- **The glob does not match.** ESLint resolves global ignore patterns against the config file's
  directory, so `.claude/worktrees/**` matches the repo-root path. The `--ignore-pattern` run in
  the before-measurement confirmed this pattern works.
- **Full tier cost.** `eslint.config.js` is code, so the PR runs the full CI tier. This is
  expected.
