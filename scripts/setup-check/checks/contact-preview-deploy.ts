// checks/contact-preview-deploy.ts (setup item 24, contracts/setup-items.md): the preview
// database's applied migrations equal the files in migrations/, and dcc-web-preview has its
// Cron Trigger. Together they confirm, indirectly, that the Workers Builds token can edit D1
// (research R13). `pending` while a dcc-web-preview build is still running.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import {
  isCheckResult,
  readContactConfig,
  requireCloudflareAccess,
  unappliedMigrations,
  workerNames,
  wranglerUnreadable,
} from "./contact-shared.ts";
import { complete, fromProviderError, missing, pending } from "./shared.ts";

const ITEM = { id: "contact-preview-deploy", order: 24 };
const SUMMARY = "Could not read the preview migrations and schedule.";
const RUN_PREFIX = "Workers Builds: ";

interface CheckRunsResponse {
  check_runs: Array<{ name: string; status: string }>;
}

/** Best effort: true when the open pull request's latest commit has an unfinished dcc-web-preview build. Never throws. */
async function previewBuildRunning(ctx: ProviderContext, previewWorker: string): Promise<boolean> {
  try {
    const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
    const owner = config?.owner ?? "drcdev";
    const repo = config?.repo ?? "dcc-web";
    const prs = await ctx.github.api<Array<{ head: { sha: string } }>>(
      `repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=1`,
    );
    const sha = prs[0]?.head.sha;
    if (!sha) return false;
    const runs = await ctx.github.api<CheckRunsResponse>(`repos/${owner}/${repo}/commits/${sha}/check-runs`);
    return runs.check_runs.some((r) => r.name.startsWith(`${RUN_PREFIX}${previewWorker}`) && r.status !== "completed");
  } catch {
    return false;
  }
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const config = readContactConfig(ctx);
  if (!config) return wranglerUnreadable(ITEM, SUMMARY);
  const previewWorker = workerNames(ctx).preview;

  try {
    const databases = await ctx.cloudflare.listD1Databases(access.accountId);
    const database = databases.find((d) => d.name === config.preview.name);
    if (!database) {
      return missing(
        ITEM,
        `The preview database ${config.preview.name} does not exist yet.`,
        "Finish setup item 19 (contact databases) first.",
      );
    }

    const details: string[] = [];
    const applied = await ctx.cloudflare.listD1AppliedMigrations(access.accountId, database.uuid);
    const notApplied = unappliedMigrations(ctx, applied);
    if (notApplied.length > 0) {
      details.push(`${config.preview.name} has not applied: ${notApplied.join(", ")}.`);
    }
    const crons = await ctx.cloudflare.listWorkerCrons(access.accountId, previewWorker);
    if (!crons.includes(config.previewCron)) {
      details.push(`${previewWorker} has no Cron Trigger "${config.previewCron}" registered.`);
    }

    if (details.length === 0) {
      return complete(ITEM, `${config.preview.name} has every migration and ${previewWorker} has its clean-up schedule.`);
    }
    if (await previewBuildRunning(ctx, previewWorker)) {
      return pending(
        ITEM,
        `A ${previewWorker} build is running.`,
        "Nothing to do; wait for the build to finish, then run the check again.",
        details,
      );
    }
    return missing(
      ITEM,
      "The preview migrations or clean-up schedule are not in place yet.",
      "Add Account → D1: Edit to the API token Workers Builds uses (docs/setup.md#contact-preview-deploy), then push the branch or choose Retry build on dcc-web-preview.",
      details,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → D1: Read and Workers Scripts: Read, then try again.",
    );
  }
}
