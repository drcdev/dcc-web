// checks/web-analytics.ts (setup item 17, data-model.md "web-analytics"): a
// Web Analytics site covers the zone apex with automatic setup on, and
// the served page references the Cloudflare beacon (FR-022). The dashboard's
// automatic setup registers the zone (ruleset.zone_name, host empty), not a
// hostname, so a zone-level automatic site for the configured zone counts as
// covering the apex; a JS-snippet site records the hostname instead.
// The item does not depend on any other item.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "web-analytics", order: 17 };
const BEACON_MARKER = "static.cloudflareinsights.com/beacon";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
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
  const zoneName = config?.zone ?? "doncoleman.ca";

  try {
    const host = zoneName;
    const sites = await ctx.cloudflare.listWebAnalyticsSites(accountId);
    const site =
      sites.find((s) => s.host === host) ??
      sites.find((s) => s.host === null && s.zoneName === zoneName);

    if (!site) {
      return missing(
        ITEM,
        `No Web Analytics site exists for ${host} (or the ${zoneName} zone) yet.`,
        `Add a site with automatic setup: Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → select ${zoneName} → Enable.`,
      );
    }
    if (!site.autoInstall) {
      return missing(
        ITEM,
        `Web Analytics for ${host} exists, but automatic setup is off.`,
        `Turn on automatic setup for ${host} in Cloudflare dashboard → Analytics & Logs → Web Analytics.`,
      );
    }

    const response = await ctx.http.get(`https://${host}/`);
    if (!response.body.includes(BEACON_MARKER)) {
      return missing(
        ITEM,
        `Web Analytics is on for ${host}, but the served page does not reference the Cloudflare beacon yet.`,
        "Wait a few minutes for Cloudflare to inject the beacon automatically, then run the check again.",
      );
    }

    return complete(
      ITEM,
      `Web Analytics is set up for ${host} with automatic setup on, and the served page references the beacon.`,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not confirm Web Analytics.",
      err,
      "Check the Cloudflare API token in .env is valid and has Account Settings: Read access, then try again.",
    );
  }
}
