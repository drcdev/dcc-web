// checks/cloudflare-worker.ts (setup item 6, data-model.md "cloudflare-worker"):
// Worker `dcc-web` exists and the account's workers.dev subdomain is on (the
// preview Worker needs it; production itself is served on the Custom Domain
// only, with workers.dev and preview URLs off in wrangler.jsonc). The
// CloudflareReader surface exposes account-level subdomain enablement only.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "cloudflare-worker", order: 6 };

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return couldNotCheck(
      ITEM,
      "Could not read the Cloudflare Worker.",
      "CLOUDFLARE_API_TOKEN is not set in .env.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env.",
    );
  }
  const accountId = ctx.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!accountId) {
    return couldNotCheck(
      ITEM,
      "Could not read the Cloudflare Worker.",
      "CLOUDFLARE_ACCOUNT_ID is not set in .env.",
      "Add CLOUDFLARE_ACCOUNT_ID to .env (docs/setup.md#local-credentials).",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const workerName = config?.workerName ?? "dcc-web";

  try {
    const script = await ctx.cloudflare.getWorkerScript(accountId, workerName);
    if (!script) {
      return missing(
        ITEM,
        `Worker ${workerName} does not exist yet.`,
        "Create it: Cloudflare dashboard → Workers & Pages → Create → Import a repository → drcdev/dcc-web.",
      );
    }

    const subdomain = await ctx.cloudflare.getWorkersSubdomain(accountId);
    if (!subdomain.enabled) {
      return missing(
        ITEM,
        `Worker ${workerName} exists, but the account's workers.dev subdomain is not on.`,
        "Turn on the account's workers.dev subdomain (Workers & Pages → Account details → workers.dev subdomain); the preview Worker needs it.",
      );
    }

    return complete(ITEM, `Worker ${workerName} exists and the account's workers.dev subdomain is on (used by the preview Worker).`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the Cloudflare Worker.",
      err,
      "Check the Cloudflare API token in .env is valid and has Workers Scripts: Read access, then try again.",
    );
  }
}
