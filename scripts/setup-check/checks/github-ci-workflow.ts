// checks/github-ci-workflow.ts (setup item 11, data-model.md
// "github-ci-workflow"): .github/workflows/ci.yml and major-change.yml exist
// on main, and the latest verify (ci.yml) run on main succeeded (FR-015,
// FR-016).
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-ci-workflow", order: 11 };
const REQUIRED_WORKFLOW_PATHS = [".github/workflows/ci.yml", ".github/workflows/major-change.yml"];

interface WorkflowSummary {
  path: string;
  name: string;
}

interface WorkflowsResponse {
  workflows: WorkflowSummary[];
}

interface WorkflowRun {
  name: string;
  head_branch: string;
  status: string;
  conclusion: string | null;
  head_sha: string;
}

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const workflows = await ctx.github.api<WorkflowsResponse>(`repos/${owner}/${repo}/actions/workflows`);
    const present = new Set(workflows.workflows.map((w) => w.path));
    const missingPaths = REQUIRED_WORKFLOW_PATHS.filter((path) => !present.has(path));
    if (missingPaths.length > 0) {
      return missing(
        ITEM,
        `${missingPaths.join(" and ")} ${missingPaths.length > 1 ? "are" : "is"} missing from main.`,
        "This slice's pull request adds these workflow files; confirm it has merged to main.",
        missingPaths,
      );
    }

    const runs = await ctx.github.api<WorkflowRunsResponse>(
      `repos/${owner}/${repo}/actions/workflows/ci.yml/runs?branch=main&per_page=1`,
    );
    const latest = runs.workflow_runs[0];

    if (!latest) {
      return missing(
        ITEM,
        "No verify run has been recorded on main yet.",
        "Push a commit to main (this slice's pull request, once merged) and confirm the verify workflow runs.",
      );
    }
    if (latest.status !== "completed") {
      return missing(
        ITEM,
        "The latest verify run on main is still in progress.",
        "Wait for it to finish, then run the check again.",
      );
    }
    if (latest.conclusion !== "success") {
      return missing(
        ITEM,
        `The latest verify run on main did not succeed (${latest.conclusion ?? "unknown"}).`,
        "Open the failing run in GitHub Actions, fix it, and push a new commit to main.",
      );
    }

    return complete(ITEM, "ci.yml and major-change.yml exist on main, and the latest verify run on main succeeded.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the CI workflows or their runs on main.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
