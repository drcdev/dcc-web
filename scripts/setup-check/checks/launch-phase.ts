// checks/launch-phase.ts: the one shared reading of where the launch stands
// (011-launch data-model.md "LaunchPhase", research R2). The phase is `switched` only when
// Cloudflare lists a Workers Custom Domain for the zone apex on the site's Worker; otherwise it is
// `before-switch` (which also covers a rollback). The read is read-only and never guessed: a missing
// token or account id, or a failed read, throws ProviderAccessError and each caller maps it to
// `could-not-check`. Nothing here prints a token, account id or other environment value (FR-026).
import { redact } from "../redact.ts";
import { ProviderAccessError } from "../types.ts";
import type { ProviderContext, SetupConfig } from "../types.ts";

export type LaunchPhase = "before-switch" | "switched";

export async function detectLaunchPhase(ctx: ProviderContext): Promise<LaunchPhase> {
  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    throw new ProviderAccessError("CLOUDFLARE_API_TOKEN is not set in .env, so the launch phase cannot be read.");
  }
  const accountId = ctx.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!accountId) {
    throw new ProviderAccessError("CLOUDFLARE_ACCOUNT_ID is not set in .env, so the launch phase cannot be read.");
  }
  const secrets = [ctx.env.get("CLOUDFLARE_API_TOKEN"), accountId];

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const zone = config?.zone ?? "doncoleman.ca";
  const workerName = config?.workerName ?? "dcc-web";

  try {
    const domains = await ctx.cloudflare.listWorkerDomains(accountId, zone);
    return domains.some((d) => d.hostname === zone && d.service === workerName) ? "switched" : "before-switch";
  } catch (err) {
    const reason = err instanceof ProviderAccessError ? err.reason : err instanceof Error ? err.message : String(err);
    throw new ProviderAccessError(`Could not read the Worker's Custom Domains: ${redact(reason, secrets)}`);
  }
}
