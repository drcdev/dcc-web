// checks/web-analytics.ts (setup item 18, data-model.md "web-analytics"): a
// Web Analytics site for new.doncoleman.ca exists with automatic setup on,
// and the served page references the Cloudflare beacon (FR-022). Stays
// missing while review-address is not complete.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { check as checkReviewAddress } from "./review-address.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "web-analytics", order: 18 };
const BEACON_MARKER = "static.cloudflareinsights.com/beacon";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const reviewAddress = await checkReviewAddress(ctx);
  if (reviewAddress.status !== "complete") {
    return missing(
      ITEM,
      "Review address (step 16) is not complete yet.",
      "Complete the review address first: finish step 16 (review address), then try Web Analytics.",
    );
  }

  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return couldNotCheck(
      ITEM,
      "Could not read the Web Analytics site.",
      "CLOUDFLARE_API_TOKEN is not set in .env.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env.",
    );
  }
  const accountId = ctx.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!accountId) {
    return couldNotCheck(
      ITEM,
      "Could not read the Web Analytics site.",
      "CLOUDFLARE_ACCOUNT_ID is not set in .env.",
      "Add CLOUDFLARE_ACCOUNT_ID to .env (docs/setup.md#local-credentials).",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const reviewHost = config?.reviewHost ?? "new.doncoleman.ca";

  try {
    const sites = await ctx.cloudflare.listWebAnalyticsSites(accountId);
    const site = sites.find((s) => s.host === reviewHost);

    if (!site) {
      return missing(
        ITEM,
        `No Web Analytics site exists for ${reviewHost} yet.`,
        `Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → ${reviewHost} → Enable (automatic setup).`,
      );
    }
    if (!site.autoInstall) {
      return missing(
        ITEM,
        `Web Analytics for ${reviewHost} exists, but automatic setup is off.`,
        `Turn on automatic setup for ${reviewHost} in Cloudflare dashboard → Analytics & Logs → Web Analytics.`,
      );
    }

    const response = await ctx.http.get(`https://${reviewHost}/`);
    if (!response.body.includes(BEACON_MARKER)) {
      return missing(
        ITEM,
        `Web Analytics is on for ${reviewHost}, but the served page does not reference the Cloudflare beacon yet.`,
        "Wait a few minutes for Cloudflare to inject the beacon automatically, then run the check again.",
      );
    }

    return complete(
      ITEM,
      `Web Analytics is set up for ${reviewHost} with automatic setup on, and the served page references the beacon.`,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      `Could not confirm Web Analytics for ${reviewHost}.`,
      err,
      "Check the Cloudflare API token in .env is valid and has Web Analytics: Read access, then try again.",
    );
  }
}
