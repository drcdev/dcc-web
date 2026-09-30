// checks/contact-d1-databases.ts (setup item 19, contracts/setup-items.md): both D1 databases
// exist, their IDs equal the ones committed in wrangler.jsonc (a placeholder ID counts as
// missing), and each reports region WNAM. The region comes from `running_in_region`, which is
// not in Cloudflare's published schema (research R2): when it is absent the check reports
// missing ("region could not be confirmed") and never passes without positive evidence.
import type { CheckResult, ProviderContext } from "../types.ts";
import {
  EXPECTED_REGION,
  isCheckResult,
  readContactConfig,
  requireCloudflareAccess,
  wranglerUnreadable,
  type ContactDatabaseConfig,
} from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-d1-databases", order: 19 };
const SUMMARY = "Could not read the contact databases.";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const config = readContactConfig(ctx);
  if (!config) return wranglerUnreadable(ITEM, SUMMARY);

  try {
    const databases = await ctx.cloudflare.listD1Databases(access.accountId);
    const details: string[] = [];

    for (const expected of [config.production, config.preview] satisfies ContactDatabaseConfig[]) {
      const found = databases.find((d) => d.name === expected.name);
      if (!found) {
        details.push(`${expected.name}: does not exist in this account.`);
        continue;
      }
      if (expected.placeholder) {
        details.push(`${expected.name}: exists, but wrangler.jsonc still has a placeholder database_id.`);
      } else if (found.uuid !== expected.id) {
        details.push(`${expected.name}: its ID does not match wrangler.jsonc.`);
      }
      if (found.runningInRegion === undefined) {
        details.push(`${expected.name}: region could not be confirmed (Cloudflare did not report one).`);
      } else if (found.runningInRegion.toUpperCase() !== EXPECTED_REGION) {
        details.push(`${expected.name}: is in region ${found.runningInRegion}, not ${EXPECTED_REGION}.`);
      }
    }

    if (details.length > 0) {
      return missing(
        ITEM,
        "The contact databases are not fully set up yet.",
        "Follow docs/setup.md#contact-d1-databases: create each missing database with pnpm exec wrangler d1 create <name> --location wnam, then put the IDs from pnpm exec wrangler d1 list --json into wrangler.jsonc.",
        details,
      );
    }
    return complete(ITEM, `Both contact databases exist in ${EXPECTED_REGION} and match wrangler.jsonc.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → D1: Read, then try again.",
    );
  }
}
