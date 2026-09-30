// checks/contact-turnstile-site-key.ts (setup item 23, contracts/setup-items.md): the build
// variable PUBLIC_TURNSTILE_SITE_KEY exists on every Workers Builds trigger of both Workers.
// Only variable names are read; the site key itself is never returned by the reader.
import type { CheckResult, ProviderContext } from "../types.ts";
import { SITE_KEY_VARIABLE, isCheckResult, requireCloudflareAccess, workerNames } from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-turnstile-site-key", order: 23 };
const SUMMARY = "Could not read the site key build variable.";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const names = workerNames(ctx);

  try {
    const details: string[] = [];
    for (const worker of [names.production, names.preview]) {
      const triggers = await ctx.cloudflare.listBuildTriggers(access.accountId, worker);
      if (triggers.length === 0) {
        details.push(`${worker} has no build trigger yet, so the variable cannot be set.`);
        continue;
      }
      for (const trigger of triggers) {
        const variables = await ctx.cloudflare.listBuildVariableNames(access.accountId, trigger.uuid);
        if (!variables.includes(SITE_KEY_VARIABLE)) {
          details.push(`${worker} trigger "${trigger.name}" has no ${SITE_KEY_VARIABLE} build variable.`);
        }
      }
    }

    if (details.length > 0) {
      return missing(
        ITEM,
        `The ${SITE_KEY_VARIABLE} build variable is not set everywhere yet.`,
        `Add ${SITE_KEY_VARIABLE} as a plain-text build variable under Settings → Build → Variables and secrets on each Worker (docs/setup.md#contact-turnstile-site-key).`,
        details,
      );
    }
    return complete(ITEM, `${SITE_KEY_VARIABLE} is set on every build trigger of both Workers.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → Workers Builds Configuration: Read, then try again.",
    );
  }
}
