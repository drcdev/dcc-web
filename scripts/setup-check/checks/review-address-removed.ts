// checks/review-address-removed.ts (setup item 16, 011-launch contracts/setup-items.md): once the
// bare domain is live, new.doncoleman.ca goes away. Waiting before the switch; missing while a
// Custom Domain for the review host still exists; pending while a public resolver still answers
// (cached answers expire within the record's TTL); complete when both resolvers are empty.
import type { CheckResult, DnsRecordType, ProviderContext, SetupConfig } from "../types.ts";
import { detectLaunchPhase } from "./launch-phase.ts";
import { complete, fromProviderError, missing, pending, waiting } from "./shared.ts";

const ITEM = { id: "review-address-removed", order: 16 };
const ANSWER_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME"];

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const reviewHost = config?.reviewHost ?? "new.doncoleman.ca";

  try {
    if ((await detectLaunchPhase(ctx)) === "before-switch") {
      return waiting(ITEM, `Waiting for the switch: ${reviewHost} stays until the bare domain is live.`);
    }

    const accountId = ctx.env.get("CLOUDFLARE_ACCOUNT_ID")!;
    const domains = await ctx.cloudflare.listWorkerDomains(accountId, reviewHost);
    if (domains.some((d) => d.hostname === reviewHost)) {
      return missing(
        ITEM,
        `${reviewHost} is still a Custom Domain on a Worker.`,
        `Remove the Custom Domain ${reviewHost}: Cloudflare dashboard → Workers & Pages → ${config?.workerName ?? "dcc-web"} → Settings → Domains & Routes → delete ${reviewHost}.`,
      );
    }

    const stillAnswering: string[] = [];
    for (const type of ANSWER_TYPES) {
      for (const { resolver, answers } of await ctx.dns.resolveEach(reviewHost, type)) {
        if (answers.length > 0) stillAnswering.push(`${resolver} still answers ${type} for ${reviewHost}`);
      }
    }
    if (stillAnswering.length > 0) {
      return pending(
        ITEM,
        `${reviewHost} is removed, but public DNS still answers for it.`,
        "Wait for cached answers to expire (they last up to the record's TTL), then run this check again.",
        stillAnswering,
      );
    }

    return complete(ITEM, `${reviewHost} is removed: no Custom Domain, and public DNS no longer answers for it.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      `Could not confirm ${reviewHost} was removed.`,
      err,
      "Check CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env are set and valid, then try again.",
    );
  }
}
