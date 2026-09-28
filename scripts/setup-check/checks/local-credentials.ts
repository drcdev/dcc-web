// checks/local-credentials.ts (setup item 2, data-model.md "local-credentials"):
// the gitignored .env file has every required name with a non-empty value, and
// Cloudflare's own token-verify call reports the configured token as active.
import type { CheckResult, ProviderContext } from "../types.ts";
import { secretManifest } from "../secrets.ts";
import { complete, fromProviderError, missing, missingEnvNames } from "./shared.ts";

const ITEM = { id: "local-credentials", order: 2 };

const REQUIRED_NAMES = secretManifest.filter((s) => s.store === "local-env").map((s) => s.name);

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const missingNames = missingEnvNames(REQUIRED_NAMES, ctx.env.has);

  if (missingNames.length > 0) {
    return missing(
      ITEM,
      `.env is missing a value for ${missingNames.join(", ")}.`,
      `Copy .env.example to .env and fill in ${missingNames.join(", ")}.`,
      missingNames,
    );
  }

  try {
    const result = await ctx.cloudflare.verifyToken();
    if (result.status !== "active") {
      return missing(
        ITEM,
        `Cloudflare reports the API token status as ${result.status}, not active.`,
        "Create a new read-only Cloudflare API token and update CLOUDFLARE_API_TOKEN in .env.",
      );
    }
    return complete(ITEM, "Every required .env value is set, and Cloudflare reports the API token active.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not verify the Cloudflare API token.",
      err,
      "Check the token in .env is correct and has not been revoked, then try again.",
    );
  }
}
