// checks/launch-main-checks.ts (setup item 26, contracts/setup-items.md; FR-003, FR-004): the
// newest `verify` check run on main succeeded.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing, pending } from "./shared.ts";

const ITEM = { id: "launch-main-checks", order: 26 };
const READ_FAILED = "Could not read the verify check on main.";
const READ_NEXT = "Run gh auth status to confirm the sign-in, then try again.";

interface CheckRun {
  name?: string;
  status: string;
  conclusion: string | null;
  started_at?: string | null;
  html_url?: string | null;
}

interface CheckRunsResponse {
  check_runs: CheckRun[];
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const response = await ctx.github.api<CheckRunsResponse>(
      `repos/${owner}/${repo}/commits/main/check-runs?check_name=verify&per_page=10`,
    );
    const runs = [...(response.check_runs ?? [])].sort((a, b) =>
      (b.started_at ?? "").localeCompare(a.started_at ?? ""),
    );
    const latest = runs[0];
    if (!latest) {
      return couldNotCheck(
        ITEM,
        READ_FAILED,
        "No verify run has been recorded on main yet.",
        "Merge the launch pull request or push to main so the verify check runs, then try again.",
      );
    }
    if (latest.status !== "completed") {
      return pending(
        ITEM,
        "The newest verify run on main is still in progress.",
        "Wait for it to finish, then run the check again.",
        latest.html_url ? [latest.html_url] : [],
      );
    }
    if (latest.conclusion !== "success") {
      const url = latest.html_url ?? "(no run URL recorded)";
      return missing(
        ITEM,
        `The newest verify run on main did not succeed (${latest.conclusion ?? "unknown"}).`,
        `Open the failing run (${url}), fix it, and push a new commit to main.`,
        [`Run: ${url}`],
      );
    }
    return complete(ITEM, "The newest verify run on main succeeded.");
  } catch (err) {
    return fromProviderError(ITEM, READ_FAILED, err, READ_NEXT);
  }
}
