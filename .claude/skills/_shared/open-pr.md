# Open the PR and arm auto-merge (shared)

Included by `/deliver`, `/tweak`, `/squash` and `/chore`. These rules are **mandatory** for the
orchestrator. Do not paraphrase them into a subagent prompt; pass them by reference.

1. **PR author account (required).** GitHub does not count an author's approval on their own PR,
   so open every PR from `drc-agents`:
   1. Push as `drcdev`.
   2. Run `gh auth switch --user drc-agents`. If it is denied, fails, or the account is not in
      the keyring, stop and ask Don with `AskUserQuestion`, with the instruction in the question
      text. Never open the PR as `drcdev`.
   3. Run `gh pr create …`.
   4. Run `gh auth switch --user drcdev` straight after, whether it succeeded or failed.
   5. Run `gh pr view <n> --json author`. If `author.login` is not `drc-agents`, stop and tell
      Don the PR must be closed and reopened from `drc-agents`.
2. **Auto-merge.** As `drcdev`, run `gh pr merge --auto --merge` on every PR, right after the
   final push; arm it only after the last commit you mean to push. It waits for Don's approval and
   a green `verify`, and his approval is the gate. Open `[PREVIEW-CHECK]` items go in the PR body
   under their own heading; Don walks them on the preview before approving. If the command is
   blocked, hand Don the command.
