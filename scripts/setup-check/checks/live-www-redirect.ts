// checks/live-www-redirect.ts (setup item 29, 011-launch contracts/setup-items.md; FR-010a, FR-013):
// once switched, `www` answers with one permanent redirect to the same path on the bare domain, over
// https and over http. Settling DNS and a missing certificate are `pending`.
import type { CheckResult, HttpResponseSummary, ProviderContext } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";
import { dnsSettling, gateOnSwitch, isTlsError, pendingLive } from "./live-shared.ts";

const ITEM = { id: "live-www-redirect", order: 29 };
const PATH = "/about/?launch-check=1";

function location(response: HttpResponseSummary): string | undefined {
  const key = Object.keys(response.headers).find((k) => k.toLowerCase() === "location");
  return key ? response.headers[key] : undefined;
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const gate = await gateOnSwitch(
    ctx,
    ITEM,
    "Waiting for the switch: www is checked once the bare domain is live.",
    "Could not tell whether the domain has switched, so www cannot be checked.",
  );
  if ("result" in gate) return gate.result;
  const { zone } = gate.setup;
  const www = `www.${zone}`;
  const expected = `https://${zone}${PATH}`;

  try {
    const settling = await dnsSettling(ctx, www);
    if (settling.length > 0) {
      return pendingLive(ITEM, `DNS for ${www} is still settling.`, "Wait for DNS to finish updating, then run this check again.", settling);
    }

    const problems: string[] = [];
    for (const scheme of ["https", "http"] as const) {
      const url = `${scheme}://${www}${PATH}`;
      let response: HttpResponseSummary;
      try {
        response = await ctx.http.get(url, { redirect: "manual" });
      } catch (err) {
        if (scheme === "https" && isTlsError(err)) {
          return pendingLive(ITEM, `The certificate for ${www} is not issued yet.`, "Wait for Cloudflare to issue the certificate, then run this check again.");
        }
        return fromProviderError(ITEM, `Could not reach ${url}.`, err, "Check the network connection, then run this check again.");
      }
      const found = location(response);
      if (response.status !== 301 || found !== expected) {
        problems.push(`${url}: returned ${response.status}${found ? ` with Location ${found}` : " with no Location"}, expected 301 to ${expected}`);
      }
    }

    if (problems.length > 0) {
      return missing(
        ITEM,
        "Problem: www does not permanently redirect to the bare domain.",
        `Fix the Redirect Rule for ${www} as set out in docs/launch.md step L12 (301, keep the path and query string, target ${zone}), then run this check again.`,
        problems,
      );
    }
    return complete(ITEM, `${www} redirects permanently to ${zone}, on https and http.`);
  } catch (err) {
    return fromProviderError(ITEM, `Could not check ${www}.`, err, "Check the network connection, then run this check again.");
  }
}
