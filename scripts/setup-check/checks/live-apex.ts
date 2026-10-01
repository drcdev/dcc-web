// checks/live-apex.ts (setup item 28, 011-launch contracts/setup-items.md; FR-013, FR-018, FR-010a):
// once switched, the bare domain serves the new site over https and http redirects to https.
// Order: DNS settling and a missing certificate are `pending` (with the 24-hour sentence), any other
// network failure is `could-not-check`, anything wrong with the page is a `Problem:`.
import type { CheckResult, HttpResponseSummary, ProviderContext } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";
import { dnsSettling, gateOnSwitch, isTlsError, pendingLive } from "./live-shared.ts";

const ITEM = { id: "live-apex", order: 28 };

function header(response: HttpResponseSummary, name: string): string | undefined {
  const key = Object.keys(response.headers).find((k) => k.toLowerCase() === name);
  return key ? response.headers[key] : undefined;
}

function canonicalHref(body: string): string | null {
  for (const tag of body.matchAll(/<link\b[^>]*>/gi)) {
    if (/\brel\s*=\s*["']?canonical["']?/i.test(tag[0])) {
      return tag[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find((v) => v !== undefined) ?? null;
    }
  }
  return null;
}

function hasNoindexMeta(body: string): boolean {
  return [...body.matchAll(/<meta\b[^>]*>/gi)].some(
    (tag) => /\bname\s*=\s*["']?robots["']?/i.test(tag[0]) && /\bcontent\s*=\s*["'][^"']*noindex/i.test(tag[0]),
  );
}

/** The Ghost generator tag is the marker: a body that merely mentions Ghost (a post about Ghost themes) is not Ghost. */
function hasGhostMarker(body: string, marker: string): boolean {
  return [...body.matchAll(/<meta\b[^>]*>/gi)].some(
    (tag) => /\bname\s*=\s*["']?generator["']?/i.test(tag[0]) && tag[0].toLowerCase().includes(marker.toLowerCase()),
  );
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const gate = await gateOnSwitch(
    ctx,
    ITEM,
    "Waiting for the switch: the bare domain is checked once it is live.",
    "Could not tell whether the domain has switched, so the bare domain cannot be checked.",
  );
  if ("result" in gate) return gate.result;
  const { config, zone } = gate.setup;
  const origin = `https://${zone}`;

  try {
    const settling = await dnsSettling(ctx, zone);
    if (settling.length > 0) {
      return pendingLive(ITEM, `DNS for ${zone} is still settling.`, "Wait for DNS to finish updating, then run this check again.", settling);
    }

    let page: HttpResponseSummary;
    try {
      page = await ctx.http.get(`${origin}/`, { redirect: "manual" });
    } catch (err) {
      if (isTlsError(err)) {
        return pendingLive(ITEM, `The certificate for ${zone} is not issued yet.`, "Wait for Cloudflare to issue the certificate, then run this check again.");
      }
      return fromProviderError(ITEM, `Could not reach ${origin}/.`, err, "Check the network connection, then run this check again.");
    }

    const notNewSite: string[] = [];
    const indexing: string[] = [];
    if (page.status !== 200) notNewSite.push(`status: ${origin}/ returned ${page.status}, expected 200`);
    const canonical = canonicalHref(page.body);
    if (canonical !== `${origin}/`) {
      notNewSite.push(`canonical: found ${canonical ?? "no canonical link"}, expected ${origin}/`);
    }
    const robotsHeader = header(page, "x-robots-tag");
    if (robotsHeader && /noindex/i.test(robotsHeader)) indexing.push(`X-Robots-Tag: the response header says ${robotsHeader}`);
    if (hasNoindexMeta(page.body)) indexing.push("meta: the page has <meta name=\"robots\" content=\"noindex\">");
    const marker = config?.ghostMarker;
    if (marker && hasGhostMarker(page.body, marker)) notNewSite.push(`Ghost: the page carries the Ghost marker "${marker}"`);

    if (notNewSite.length > 0 || indexing.length > 0) {
      return missing(
        ITEM,
        "Problem: the bare domain does not serve the new site correctly.",
        notNewSite.length > 0
          ? "Open docs/launch.md#rollback and restore Ghost if the new site cannot be fixed within minutes."
          : "Fix the indexing rules (public/_headers and the host rules in specs/011-launch/contracts/indexing-and-origin.md), redeploy, then run this check again.",
        [...notNewSite, ...indexing],
      );
    }

    let plain: HttpResponseSummary;
    try {
      plain = await ctx.http.get(`http://${zone}/`, { redirect: "manual" });
    } catch (err) {
      return fromProviderError(ITEM, `Could not reach http://${zone}/.`, err, "Check the network connection, then run this check again.");
    }
    if (![301, 308].includes(plain.status) || header(plain, "location") !== `${origin}/`) {
      return missing(
        ITEM,
        `Problem: http://${zone}/ does not redirect permanently to ${origin}/.`,
        "Turn on Always Use HTTPS (Cloudflare dashboard → SSL/TLS → Edge Certificates), then run this check again.",
        [`http://${zone}/ returned ${plain.status}${header(plain, "location") ? ` with Location ${header(plain, "location")}` : ""}`],
      );
    }

    return complete(ITEM, `${zone} serves the new site over https, and http redirects to https.`);
  } catch (err) {
    return fromProviderError(ITEM, `Could not check ${zone}.`, err, "Check the network connection, then run this check again.");
  }
}
