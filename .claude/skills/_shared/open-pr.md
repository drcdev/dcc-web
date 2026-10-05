# Classify, open the PR and arm auto-merge (shared)

Included by `/deliver`, `/tweak`, `/squash` and `/chore`. These rules are **mandatory** for the
orchestrator. Do not paraphrase them into a subagent prompt; pass them by reference.

1. **Classification.** Decide whether the change is a major change against the list in
   Constitution Principle III; do not restate the list. When in doubt, it is major. Put the
   verdict and the criteria that fired (or "none") in the PR body. The verdict does not change
   how the PR merges.
2. **PR author account (required).** GitHub does not count an author's approval on their own PR,
   so open every PR from `drc-agents`:
   1. Push as `drcdev`.
   2. Run `gh auth switch --user drc-agents`. If it is denied, fails, or the account is not in
      the keyring, stop and ask Don with `AskUserQuestion`, with the instruction in the question
      text. Never open the PR as `drcdev`.
   3. Run `gh pr create …`.
   4. Run `gh auth switch --user drcdev` straight after, whether it succeeded or failed.
   5. Run `gh pr view <n> --json author`. If `author.login` is not `drc-agents`, stop and tell
      Don the PR must be closed and reopened from `drc-agents`.
3. **Auto-merge.** As `drcdev`, run `gh pr merge --auto --merge`. It waits for Don's approval and
   a green `verify`. Leave it off only while `[PREVIEW-CHECK]` items are open, and say so in the
   PR body.
