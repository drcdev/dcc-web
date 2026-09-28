// checks/cloudflare-worker.ts (setup item 7, data-model.md "cloudflare-worker"):
// Worker `dcc-web` exists with its workers.dev address and preview URLs
// turned on. The CloudflareReader surface exposes account-level workers.dev
// subdomain enablement (there is no separate per-script preview-URLs read),
// so both workers.dev and preview URLs are confirmed together through that
// one read, alongside the script itself existing.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "cloudflare-worker", order: 7 };

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
        `Worker ${workerName} exists, but workers.dev and preview URLs are not enabled.`,
        "Turn on workers.dev and preview URLs for the Worker in Settings → Domains & Routes.",
      );
    }

    return complete(ITEM, `Worker ${workerName} exists with workers.dev and preview URLs enabled.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the Cloudflare Worker.",
      err,
      "Check the Cloudflare API token in .env is valid and has Workers Scripts: Read access, then try again.",
    );
  }
}
