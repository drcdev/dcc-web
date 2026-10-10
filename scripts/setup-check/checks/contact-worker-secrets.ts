// checks/contact-worker-secrets.ts (setup item 18, contracts/setup-items.md): the secret NAMES
// TURNSTILE_SECRET_KEY, CONTACT_READ_TOKEN and IP_HASH_SALT exist on both the production and
// the preview Worker. Only names are read; the reader never returns a value. Missing names are
// listed per Worker.
import type { CheckResult, ProviderContext } from "../types.ts";
import { REQUIRED_WORKER_SECRETS, isCheckResult, requireCloudflareAccess, workerNames } from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-worker-secrets", order: 18 };
const SUMMARY = "Could not read the contact secrets.";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const names = workerNames(ctx);

  try {
    const details: string[] = [];
    for (const [worker, env] of [
      [names.production, ""],
      [names.preview, " --env preview"],
    ] as const) {
      if (!(await ctx.cloudflare.getWorkerScript(access.accountId, worker))) {
        details.push(`${worker} does not exist yet, so none of its secrets are set${env ? " (the first preview secret command creates it)" : ""}.`);
        continue;
      }
      const present = new Set(await ctx.cloudflare.listWorkerSecretNames(access.accountId, worker));
      const absent = REQUIRED_WORKER_SECRETS.filter((s) => !present.has(s));
      if (absent.length > 0) details.push(`${worker} is missing: ${absent.join(", ")}.`);
    }

    if (details.length > 0) {
      return missing(
        ITEM,
        "Some contact secrets are not set yet.",
        "Run pnpm exec wrangler secret put <NAME> for each missing name (add --env preview for dcc-web-preview) as described in docs/setup.md#contact-worker-secrets. Type the value at the prompt; never paste it into a chat or a file.",
        details,
      );
    }
    return complete(ITEM, `All three contact secrets exist on ${names.production} and ${names.preview}.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Workers Scripts: Read access, then try again.",
    );
  }
}
