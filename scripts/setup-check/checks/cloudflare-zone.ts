// checks/cloudflare-zone.ts (setup item 3, data-model.md "cloudflare-zone"):
// the Cloudflare zone for doncoleman.ca exists on the Free plan and its id
// equals the configured CLOUDFLARE_ZONE_ID.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { ProviderAccessError } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "cloudflare-zone", order: 3 };

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return couldNotCheck(
      ITEM,
      "Could not read the Cloudflare zone.",
      "CLOUDFLARE_API_TOKEN is not set in .env.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env.",
    );
  }
  const zoneId = ctx.env.get("CLOUDFLARE_ZONE_ID");
  if (!zoneId) {
    return couldNotCheck(
      ITEM,
      "Could not read the Cloudflare zone.",
      "CLOUDFLARE_ZONE_ID is not set in .env.",
      "Add CLOUDFLARE_ZONE_ID to .env (docs/setup.md#local-credentials).",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const expectedZoneName = config?.zone ?? "doncoleman.ca";

  try {
    const zone = await ctx.cloudflare.getZone(zoneId);

    const problems: string[] = [];
    if (zone.id !== zoneId) {
      problems.push(`zone id ${zone.id} does not match the configured CLOUDFLARE_ZONE_ID`);
    }
    if (zone.name.toLowerCase() !== expectedZoneName.toLowerCase()) {
      problems.push(`zone name is ${zone.name}, expected ${expectedZoneName}`);
    }
    const plan = (zone.plan ?? "").toLowerCase();
    if (!plan.includes("free")) {
      problems.push(`zone plan is ${zone.plan ?? "unknown"}, expected the Free plan`);
    }

    if (problems.length > 0) {
      return missing(
        ITEM,
        `The Cloudflare zone does not match what is expected: ${problems.join("; ")}.`,
        "Check the zone in the Cloudflare dashboard: it must be doncoleman.ca on the Free plan, with its id in CLOUDFLARE_ZONE_ID.",
        problems,
      );
    }

    return complete(ITEM, `Zone ${zone.name} exists on the Free plan with id ${zone.id}.`);
  } catch (err) {
    if (err instanceof ProviderAccessError && /not found|1049/i.test(err.reason)) {
      return missing(
        ITEM,
        `The Cloudflare zone ${expectedZoneName} was not found.`,
        `Add ${expectedZoneName} to Cloudflare as a new site on the Free plan, then update CLOUDFLARE_ZONE_ID in .env.`,
      );
    }
    return fromProviderError(
      ITEM,
      "Could not read the Cloudflare zone.",
      err,
      "Check the Cloudflare API token in .env is valid and has Zone: Read access, then try again.",
    );
  }
}
