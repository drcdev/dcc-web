# The `[PREVIEW-CHECK]` marker (shared)

Included by `/deliver`, `/tweak` and `/chore`, and reached from `/squash` through `open-pr.md`.
These rules are **mandatory** for the orchestrator and for every subagent told to read this file.
Do not paraphrase them into a subagent prompt; pass them by reference.

- Work a subagent cannot verify locally (it needs the preview deployment or Don's eyes) gets the
  suffix `[PREVIEW-CHECK]` in the phase artifact. Which artifact holds it stays in each skill.
- Subagents leave such items unticked and list them in their summary.
- The orchestrator collects them for the PR body and the final report.
- Open items are listed in the PR body for Don to walk on the preview before approving; they do
  not hold back auto-merge (see `open-pr.md`).
