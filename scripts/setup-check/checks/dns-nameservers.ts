// checks/dns-nameservers.ts (setup item 5, data-model.md "dns-nameservers"):
// public NS answers for the zone equal the zone's assigned Cloudflare
// nameservers and Cloudflare reports the zone active; `pending` while
// delegation propagates. Stays `missing` with "complete DNS parity first"
// while dns-records-parity is not complete (FR-037) — evaluated by calling
// that item's own check with the same context, per data-model.md's dependsOn
// rule ("its own check is not run" while a prerequisite is incomplete).
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { check as checkDnsRecordsParity } from "./dns-records-parity.ts";
import { complete, fromProviderError, missing, pending } from "./shared.ts";

const ITEM = { id: "dns-nameservers", order: 5 };

function normNs(value: string): string {
  return value.toLowerCase().replace(/\.$/, "");
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const parity = await checkDnsRecordsParity(ctx);
  if (parity.status !== "complete") {
    return missing(
      ITEM,
      "DNS records parity (step 4) is not complete yet.",
      "Complete DNS parity first: finish step 4 (DNS records parity), then try the nameserver switch.",
    );
  }

  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return missing(
      ITEM,
      "Could not read the Cloudflare zone.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env as CLOUDFLARE_API_TOKEN.",
    );
  }
  const zoneId = ctx.env.get("CLOUDFLARE_ZONE_ID");
  if (!zoneId) {
    return missing(
      ITEM,
      "Could not read the Cloudflare zone.",
      "Add CLOUDFLARE_ZONE_ID to .env (docs/setup.md#local-credentials).",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const zoneName = config?.zone ?? "doncoleman.ca";

  try {
    const [zone, publicAnswers] = await Promise.all([
      ctx.cloudflare.getZone(zoneId),
      ctx.dns.resolveNameservers(zoneName),
    ]);

    const cfNs = new Set(zone.nameServers.map(normNs));
    const publicNs = new Set(publicAnswers.map(normNs));
    const setsEqual = cfNs.size > 0 && cfNs.size === publicNs.size && [...cfNs].every((ns) => publicNs.has(ns));
    const anyOverlap = [...cfNs].some((ns) => publicNs.has(ns));

    if (setsEqual && zone.status === "active") {
      return complete(ITEM, `Public nameservers for ${zoneName} equal Cloudflare's assigned nameservers, and the zone is active.`);
    }

    if (setsEqual || anyOverlap) {
      return pending(
        ITEM,
        "Nameserver delegation to Cloudflare is propagating.",
        "Nothing to do now; delegation is still propagating and can take up to 24 hours. Run pnpm setup:check --item dns-nameservers again later.",
        [...publicAnswers],
      );
    }

    return missing(
      ITEM,
      `Public nameservers for ${zoneName} still point at Squarespace.`,
      `Change the nameservers at Squarespace's domain settings for ${zoneName} to the two Cloudflare assigns for the zone, having read the rollback procedure first.`,
      [...publicAnswers],
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not confirm the domain's nameservers.",
      err,
      "Check the Cloudflare API token in .env is valid, and that public DNS is reachable, then try again.",
    );
  }
}
