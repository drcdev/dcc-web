// checks/workers-builds.ts (setup item 9, data-model.md "workers-builds"):
// the latest commit on main has a successful Workers Builds check run, and
// the latest open pull request (if any) has one too, with a preview URL
// (FR-017, FR-018). The GitHub Checks API run name is matched by the
// "Workers Builds" prefix (plan.md Risks): if Cloudflare renames the check,
// this reports could-not-check rather than a false pass. Per spec Edge Cases
// ("Sole maintainer approval") the setup check does not inspect individual
// pull requests beyond their build status — who authored the open PR has no
// effect on this item.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing, pending } from "./shared.ts";

const ITEM = { id: "workers-builds", order: 9 };
const RUN_NAME_PREFIX = "Workers Builds";

interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  details_url?: string;
}

interface CheckRunsResponse {
  check_runs: CheckRun[];
}

interface PullRequestSummary {
  number: number;
  state: string;
  head: { sha: string };
}

function findWorkersBuildsRun(response: CheckRunsResponse): CheckRun | undefined {
  return response.check_runs.find((run) => run.name.startsWith(RUN_NAME_PREFIX));
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const mainRuns = await ctx.github.api<CheckRunsResponse>(`repos/${owner}/${repo}/commits/main/check-runs`);
    const mainRun = findWorkersBuildsRun(mainRuns);

    if (!mainRun) {
      return missing(
        ITEM,
        "No Workers Builds check run was found on the latest commit on main.",
        "Confirm the Git integration is connected: Cloudflare dashboard → Workers & Pages → dcc-web → Settings → Build → Git integration.",
      );
    }
    if (mainRun.status !== "completed") {
      return pending(
        ITEM,
        "Workers Builds is running for the latest commit on main.",
        "Nothing to do; wait for the build to finish, then run the check again.",
      );
    }
    if (mainRun.conclusion !== "success") {
      return missing(
        ITEM,
        `The latest Workers Builds run on main did not succeed (${mainRun.conclusion ?? "unknown"}).`,
        "Open the build log in Cloudflare dashboard → Workers & Pages → dcc-web → Deployments, fix the issue, and push a new commit.",
      );
    }

    const prs = await ctx.github.api<PullRequestSummary[]>(
      `repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=1`,
    );
    const openPr = prs[0];
    if (!openPr) {
      return complete(ITEM, "Workers Builds succeeded on main; no open pull request to check for a preview.");
    }

    const prRuns = await ctx.github.api<CheckRunsResponse>(
      `repos/${owner}/${repo}/commits/${openPr.head.sha}/check-runs`,
    );
    const prRun = findWorkersBuildsRun(prRuns);

    if (!prRun) {
      return missing(
        ITEM,
        "Workers Builds succeeded on main, but the open pull request's latest commit has no Workers Builds run yet.",
        "Push a commit or wait for Workers Builds to start on the pull request, then run the check again.",
      );
    }
    if (prRun.status !== "completed") {
      return pending(
        ITEM,
        "Workers Builds succeeded on main; the preview build for the open pull request is still running.",
        "Nothing to do; wait for the preview build to finish, then run the check again.",
      );
    }
    if (prRun.conclusion !== "success" || !prRun.details_url) {
      return missing(
        ITEM,
        "Workers Builds succeeded on main, but the open pull request does not have a successful preview build.",
        "Open the build log for the pull request in Cloudflare dashboard → Workers & Pages → dcc-web → Deployments and fix the issue.",
      );
    }

    return complete(ITEM, "Workers Builds succeeded on main and produced a preview URL for the open pull request.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the Workers Builds check runs.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
