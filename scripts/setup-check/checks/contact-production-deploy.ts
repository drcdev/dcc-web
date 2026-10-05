// checks/contact-production-deploy.ts (setup item 24, after merge, contracts/setup-items.md):
// dcc-web's production build trigger deploys with `pnpm run deploy:production`, the
// production database has every migration, and dcc-web has its Cron Trigger.
import type { CheckResult, ProviderContext } from "../types.ts";
import {
  PRODUCTION_DEPLOY_COMMAND,
  isCheckResult,
  isNonProductionTrigger,
  readContactConfig,
  requireCloudflareAccess,
  unappliedMigrations,
  workerNames,
  wranglerUnreadable,
} from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-production-deploy", order: 24 };
const SUMMARY = "Could not read the production migrations and schedule.";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const config = readContactConfig(ctx);
  if (!config) return wranglerUnreadable(ITEM, SUMMARY);
  const worker = workerNames(ctx).production;

  try {
    const details: string[] = [];

    const triggers = (await ctx.cloudflare.listBuildTriggers(access.accountId, worker)).filter(
      (t) => !isNonProductionTrigger(t),
    );
    if (triggers.length === 0) {
      details.push(`${worker} has no production build trigger.`);
    } else if (triggers.some((t) => t.deployCommand !== PRODUCTION_DEPLOY_COMMAND)) {
      details.push(`${worker}'s production deploy command is not "${PRODUCTION_DEPLOY_COMMAND}".`);
    }

    const databases = await ctx.cloudflare.listD1Databases(access.accountId);
    const database = databases.find((d) => d.name === config.production.name);
    if (!database) {
      details.push(`The production database ${config.production.name} does not exist yet (setup item 18).`);
    } else {
      const applied = await ctx.cloudflare.listD1AppliedMigrations(access.accountId, database.uuid);
      const notApplied = unappliedMigrations(ctx, applied);
      if (notApplied.length > 0) {
        details.push(`${config.production.name} has not applied: ${notApplied.join(", ")}.`);
      }
    }

    const crons = await ctx.cloudflare.listWorkerCrons(access.accountId, worker);
    if (!crons.includes(config.productionCron)) {
      details.push(`${worker} has no Cron Trigger "${config.productionCron}" registered.`);
    }

    if (details.length > 0) {
      return missing(
        ITEM,
        "The production migrations or clean-up schedule are not in place yet.",
        "After the pull request merges: set dcc-web's production deploy command to pnpm run deploy:production (Settings → Build), then Retry the latest main build (docs/setup.md#contact-production-deploy).",
        details,
      );
    }
    return complete(ITEM, `${worker} deploys with ${PRODUCTION_DEPLOY_COMMAND}; migrations and the clean-up schedule are in place.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → D1: Read, Workers Builds Configuration: Read and Workers Scripts: Read, then try again.",
    );
  }
}
