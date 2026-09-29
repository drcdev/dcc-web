// checks/review-address.ts (setup item 16, data-model.md "review-address"):
// new.doncoleman.ca is a Custom Domain on the dcc-web Worker and returns 200
// over HTTPS (FR-020). Stays missing while dns-nameservers or workers-builds
// is not complete (registry dependsOn), evaluated by calling each
// prerequisite's own check with the same context, per data-model.md's
// dependsOn rule — same pattern as checks/dns-nameservers.ts.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { check as checkDnsNameservers } from "./dns-nameservers.ts";
import { check as checkWorkersBuilds } from "./workers-builds.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "review-address", order: 16 };

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const nameservers = await checkDnsNameservers(ctx);
  if (nameservers.status !== "complete") {
    return missing(
      ITEM,
      "DNS nameservers (step 5) is not complete yet.",
      "Complete DNS nameservers first: finish step 5 (DNS nameservers), then try the review address.",
    );
  }
  const workersBuilds = await checkWorkersBuilds(ctx);
  if (workersBuilds.status !== "complete") {
    return missing(
      ITEM,
      "Workers Builds (step 10) is not complete yet.",
      "Complete Workers Builds first: finish step 10 (Workers Builds), then try the review address.",
    );
  }

  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return couldNotCheck(
      ITEM,
      "Could not read the Worker's Custom Domains.",
      "CLOUDFLARE_API_TOKEN is not set in .env.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env.",
    );
  }
  const accountId = ctx.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!accountId) {
    return couldNotCheck(
      ITEM,
      "Could not read the Worker's Custom Domains.",
      "CLOUDFLARE_ACCOUNT_ID is not set in .env.",
      "Add CLOUDFLARE_ACCOUNT_ID to .env (docs/setup.md#local-credentials).",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const workerName = config?.workerName ?? "dcc-web";
  const reviewHost = config?.reviewHost ?? "new.doncoleman.ca";

  try {
    const domains = await ctx.cloudflare.listWorkerDomains(accountId, reviewHost);
    const found = domains.some((d) => d.hostname === reviewHost && d.service === workerName);
    if (!found) {
      return missing(
        ITEM,
        `${reviewHost} is not set up as a Custom Domain on ${workerName} yet.`,
        `Add a Custom Domain for ${reviewHost}: Cloudflare dashboard → Workers & Pages → ${workerName} → Settings → Domains & Routes → Add Custom Domain.`,
      );
    }

    const response = await ctx.http.get(`https://${reviewHost}/`);
    if (response.status !== 200) {
      return missing(
        ITEM,
        `https://${reviewHost}/ returned status ${response.status} instead of 200.`,
        "Confirm the Worker is deployed and the Custom Domain's certificate is active, then try again.",
      );
    }

    return complete(ITEM, `${reviewHost} is a Custom Domain on ${workerName} and returns 200 over HTTPS.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      `Could not confirm ${reviewHost} serves the Worker over HTTPS.`,
      err,
      "Check the Cloudflare API token in .env is valid, and that the review address is reachable, then try again.",
    );
  }
}
