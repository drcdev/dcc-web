// checks/contact-preview-builds.ts (setup item 21, contracts/setup-items.md): Worker
// dcc-web-preview exists and its Workers Builds triggers, for both the production branch and
// non-production branches, deploy with `pnpm run deploy:preview`; dcc-web itself no longer
// builds non-production branches. Only the documented trigger fields are read.
import type { CheckResult, ProviderContext } from "../types.ts";
import {
  PREVIEW_DEPLOY_COMMAND,
  isCheckResult,
  isNonProductionTrigger,
  requireCloudflareAccess,
  workerNames,
} from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-preview-builds", order: 21 };
const SUMMARY = "Could not read the preview Worker builds.";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const names = workerNames(ctx);
  const nextAction =
    "Follow docs/setup.md#contact-preview-builds: connect drcdev/dcc-web to dcc-web-preview with deploy command pnpm run deploy:preview for both the production branch and non-production branches, and turn non-production branch builds off on dcc-web.";

  try {
    if (!(await ctx.cloudflare.getWorkerScript(access.accountId, names.preview))) {
      return missing(ITEM, `Worker ${names.preview} does not exist yet.`, nextAction);
    }

    const details: string[] = [];
    const previewTriggers = await ctx.cloudflare.listBuildTriggers(access.accountId, names.preview);
    const previewProduction = previewTriggers.filter((t) => !isNonProductionTrigger(t));
    const previewBranches = previewTriggers.filter(isNonProductionTrigger);

    if (previewProduction.length === 0) {
      details.push(`${names.preview} has no production-branch build trigger.`);
    }
    if (previewBranches.length === 0) {
      details.push(`${names.preview} has no non-production branch build trigger.`);
    }
    for (const trigger of previewTriggers) {
      if (trigger.deployCommand !== PREVIEW_DEPLOY_COMMAND) {
        details.push(
          `${names.preview} trigger "${trigger.name}" deploys with "${trigger.deployCommand ?? "the default command"}", not "${PREVIEW_DEPLOY_COMMAND}".`,
        );
      }
    }

    const productionTriggers = await ctx.cloudflare.listBuildTriggers(access.accountId, names.production);
    if (productionTriggers.some(isNonProductionTrigger)) {
      details.push(`${names.production} still builds non-production branches; turn that off (Settings → Build → Branch control).`);
    }

    if (details.length > 0) {
      return missing(ITEM, "The preview Worker builds are not set up yet.", nextAction, details);
    }
    return complete(
      ITEM,
      `${names.preview} builds branches with ${PREVIEW_DEPLOY_COMMAND}, and ${names.production} no longer builds them.`,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → Workers Builds Configuration: Read, then try again.",
    );
  }
}
