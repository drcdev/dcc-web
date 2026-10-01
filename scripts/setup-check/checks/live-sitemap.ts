// checks/live-sitemap.ts (setup item 30, 011-launch contracts/setup-items.md; FR-014, FR-010a): once
// switched, the crawler (scripts/site-check/crawl.ts) walks the live sitemap with link checking off
// and the apex as the expected origin; robots.txt must name the sitemap index and every
// `launch.expectedPaths` entry must be listed. The crawler swallows request errors, so the adapter
// records a TLS failure to tell "certificate not issued yet" (pending) from a real failure.
import { crawl, parseSitemap } from "../../site-check/crawl.ts";
import type { FetchResult } from "../../site-check/crawl.ts";
import type { CheckResult, ProviderContext } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";
import { dnsSettling, gateOnSwitch, isTlsError, pendingLive } from "./live-shared.ts";

const ITEM = { id: "live-sitemap", order: 30 };

function pathOf(loc: string): string | null {
  try {
    const url = new URL(loc);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const gate = await gateOnSwitch(
    ctx,
    ITEM,
    "Waiting for the switch: the live sitemap is checked once the bare domain is live.",
    "Could not tell whether the domain has switched, so the live sitemap cannot be checked.",
  );
  if ("result" in gate) return gate.result;
  const { config, zone } = gate.setup;
  const origin = `https://${zone}`;

  const expectedPaths = config?.launch?.expectedPaths;
  if (!expectedPaths) {
    return missing(
      ITEM,
      "Problem: setup/config.json launch.expectedPaths is missing.",
      "Add launch.expectedPaths (the site paths that must be in the sitemap) to setup/config.json, then run this check again.",
    );
  }

  try {
    const settling = await dnsSettling(ctx, zone);
    if (settling.length > 0) {
      return pendingLive(ITEM, `DNS for ${zone} is still settling.`, "Wait for DNS to finish updating, then run this check again.", settling);
    }

    let tlsFailed = false;
    let robotsBody: string | null = null;
    const listed = new Set<string>();
    const fetcher = async (url: string): Promise<FetchResult> => {
      try {
        const response = await ctx.http.get(url, { redirect: "manual" });
        const key = Object.keys(response.headers).find((k) => k.toLowerCase() === "location");
        if (url === `${origin}/robots.txt` && response.status === 200) robotsBody = response.body;
        if (response.status === 200 && /<urlset\b/i.test(response.body)) {
          for (const loc of parseSitemap(response.body)) {
            const path = pathOf(loc);
            if (path) listed.add(path);
          }
        }
        return { status: response.status, headers: response.headers, body: response.body, location: key ? (response.headers[key] ?? null) : null };
      } catch (err) {
        if (isTlsError(err)) tlsFailed = true;
        throw err;
      }
    };

    const result = await crawl({ base: origin, expectOrigin: origin, checkLinks: false, fetcher });
    if (tlsFailed) {
      return pendingLive(ITEM, `The certificate for ${zone} is not issued yet.`, "Wait for Cloudflare to issue the certificate, then run this check again.");
    }

    const details = result.failures.map((f) => `${f.target}: ${f.reason}`);
    const sitemapLine = `Sitemap: ${origin}/sitemap-index.xml`;
    const robotsText = robotsBody as string | null;
    const namesSitemap = robotsText !== null && robotsText.split(/\r?\n/).some((line) => line.trim().toLowerCase() === sitemapLine.toLowerCase());
    if (!namesSitemap) details.push(`robots.txt: does not name ${sitemapLine}`);
    if (!result.failures.some((f) => f.kind === "sitemap")) {
      for (const path of expectedPaths) {
        if (!listed.has(path)) details.push(`${path}: expected in the sitemap but not listed`);
      }
    }

    if (details.length > 0) {
      return missing(
        ITEM,
        `Problem: ${details.length} live sitemap problem(s) on ${zone}.`,
        "Fix each page listed and redeploy, then run this check again; if the site cannot be fixed within minutes, follow docs/launch.md#rollback.",
        details,
      );
    }
    return complete(ITEM, `All ${result.pagesChecked} sitemap pages on ${zone} return a page.`);
  } catch (err) {
    return fromProviderError(ITEM, `Could not check the live sitemap on ${zone}.`, err, "Check the network connection, then run this check again.");
  }
}
