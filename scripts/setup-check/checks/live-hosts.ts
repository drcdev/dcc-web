// checks/live-hosts.ts (setup item 18, spec 034 contracts/setup-check.md): the live hosts match the
// main-address arrangement. www.doncoleman.ca serves the site; http://www, the bare domain and
// http://bare answer 301 to it, keeping the path and query; the old Ghost address reaches its page on
// www from both hosts. Public requests only: no credentials, no Cloudflare API call. Each hop is one GET
// with `redirect: "manual"`, at most 3 redirects per probe, no retry. Only the www and bare hosts are
// ever followed, so a redirect to a foreign host is reported, never requested. Every HTTPS response
// (the redirect hops and the final page) must also carry Strict-Transport-Security with includeSubDomains
// and a positive max-age (the zone HSTS setting, docs/setup.md#live-hosts); plain http replies are not
// required to, and the max-age value itself is not pinned.
import { FALLBACK_ORIGIN } from "../../../src/lib/site-origin.ts";
import { ProviderAccessError } from "../types.ts";
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing, pending } from "./shared.ts";

const ITEM = { id: "live-hosts", order: 18 };
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** The old Ghost address the setup check probes, and the page spec 030 maps it to. */
export const GHOST_PROBE = {
  from: "/drift/2025/self-contained-development-for-ghost-themes/",
  to: "/writing/self-contained-development-for-ghost-themes/",
};

interface Probe {
  start: string;
  expectedEnd: string;
  allowedHops: number[];
  /** For a 2-hop chain, the required middle URL; absent means any 2-hop chain is accepted. */
  via?: string;
  /** True when the 2-hop chain must go through `via` (the http bare-domain probe). */
  strictVia?: boolean;
}

interface Hop {
  url: string;
  status: number;
  location: string | null;
  hsts: string | null;
}

function buildProbes(mainHost: string, bareHost: string): Probe[] {
  const www = `https://${mainHost}`;
  const bare = `https://${bareHost}`;
  const probes: Probe[] = [];
  for (const p of ["/", "/writing/?page=2"]) {
    probes.push({ start: `${www}${p}`, expectedEnd: `${www}${p}`, allowedHops: [0] });
    probes.push({ start: `http://${mainHost}${p}`, expectedEnd: `${www}${p}`, allowedHops: [1] });
    probes.push({ start: `${bare}${p}`, expectedEnd: `${www}${p}`, allowedHops: [1] });
    probes.push({
      start: `http://${bareHost}${p}`,
      expectedEnd: `${www}${p}`,
      allowedHops: [1, 2],
      via: `${bare}${p}`,
      strictVia: true,
    });
  }
  probes.push({ start: `${www}${GHOST_PROBE.from}`, expectedEnd: `${www}${GHOST_PROBE.to}`, allowedHops: [1] });
  probes.push({ start: `${bare}${GHOST_PROBE.from}`, expectedEnd: `${www}${GHOST_PROBE.to}`, allowedHops: [1, 2] });
  return probes;
}

class WwwTlsError extends Error {}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const mainHost = new URL(FALLBACK_ORIGIN).host;
  const bareHost = ctx.fs.readJson<SetupConfig>("setup/config.json")?.zone ?? "doncoleman.ca";
  const followable = new Set([mainHost, bareHost]);

  async function runProbe(probe: Probe): Promise<string | null> {
    const hops: Hop[] = [];
    let url = probe.start;
    let finalBody = "";
    let finalStatus = 0;
    let finalHsts: string | null = null;
    for (;;) {
      let response;
      try {
        response = await ctx.http.get(url, { redirect: "manual" });
      } catch (err) {
        if (err instanceof ProviderAccessError && err.kind === "tls") {
          if (new URL(url).host === mainHost) throw new WwwTlsError(url);
          return `${describe(probe, hops)}: certificate failure on ${new URL(url).host}`;
        }
        throw err;
      }
      if (!REDIRECT_STATUSES.has(response.status)) {
        finalStatus = response.status;
        finalBody = response.body;
        finalHsts = response.headers["strict-transport-security"] ?? null;
        break;
      }
      const raw = response.headers["location"] ?? null;
      hops.push({ url, status: response.status, location: raw, hsts: response.headers["strict-transport-security"] ?? null });
      if (hops.length > MAX_REDIRECTS) {
        return `${describe(probe, hops)}: more than ${MAX_REDIRECTS} redirects (loop?)`;
      }
      if (!raw) return `${describe(probe, hops)}: redirect without a Location header`;
      const next = new URL(raw, url);
      url = next.href;
      if (!followable.has(next.host)) {
        return `${describe(probe, hops)}: ends on ${url}, expected ${probe.expectedEnd}`;
      }
    }

    const broken = rule(probe, hops, url, finalStatus, finalBody, finalHsts, mainHost, bareHost);
    return broken ? `${describe(probe, hops, url, finalStatus)}: ${broken}` : null;
  }

  const problems: string[] = [];
  try {
    for (const probe of buildProbes(mainHost, bareHost)) {
      const problem = await runProbe(probe);
      if (problem) problems.push(problem);
    }
  } catch (err) {
    if (err instanceof WwwTlsError) {
      return pending(
        ITEM,
        `The certificate for ${mainHost} is not issued yet.`,
        "Wait a few minutes for Cloudflare to issue it, then run the check again.",
      );
    }
    return fromProviderError(ITEM, "Could not reach the live hosts.", err, "Check the network connection, then run this check again.");
  }

  if (problems.length > 0) {
    return missing(
      ITEM,
      "Problem: the live hosts do not match the main-address arrangement.",
      "Finish the live swap in docs/setup.md#live-hosts (or roll back as described there), or turn zone HSTS back on as described in its Zone HSTS section, then run the check again.",
      problems,
    );
  }
  return complete(
    ITEM,
    `${mainHost} serves the site; the bare domain and http redirect to it permanently, keeping the path and query; the old Ghost address reaches its page on www; every HTTPS response carries HSTS with includeSubDomains.`,
  );
}

function describe(probe: Probe, hops: Hop[], end?: string, finalStatus?: number): string {
  const chain = hops.map((h) => `${h.status} ${h.location ?? "(no Location)"}`);
  if (end !== undefined) chain.push(`${finalStatus}`);
  return `${probe.start} -> ${chain.join(" -> ") || "(no response)"}`;
}

/** The first rule the chain breaks, or null when the probe passes. */
function rule(
  probe: Probe,
  hops: Hop[],
  end: string,
  finalStatus: number,
  body: string,
  finalHsts: string | null,
  mainHost: string,
  bareHost: string,
): string | null {
  for (const hop of hops) {
    if (hop.status !== 301) return `${hop.status}, expected 301`;
  }
  if (!probe.allowedHops.includes(hops.length)) {
    return hops.length === 0
      ? `no redirect, expected a 301 to ${probe.expectedEnd}`
      : `${hops.length} redirect(s), expected ${probe.allowedHops.join(" or ")}`;
  }
  for (const hop of hops) {
    const from = new URL(hop.url);
    const to = new URL(hop.location!, hop.url);
    if (from.host === bareHost && to.host === mainHost) {
      if (from.search !== to.search) return "query string dropped";
      if (from.pathname !== to.pathname) {
        return `path changed to ${to.pathname}`;
      }
    }
  }
  if (probe.strictVia && hops.length === 2 && hops[1]!.url !== probe.via) {
    return `middle hop is ${hops[1]!.url}, expected ${probe.via}`;
  }
  if (end !== probe.expectedEnd) return `ends on ${end}, expected ${probe.expectedEnd}`;
  if (finalStatus !== 200) return `final response ${finalStatus}, expected 200`;
  if (!body.includes(`<link rel="canonical" href="https://${mainHost}/`)) {
    return "200 without the site's canonical link";
  }
  for (const hop of hops) {
    if (!hop.url.startsWith("https:")) continue;
    const problem = hstsProblem(hop.hsts);
    if (problem) return `${hop.url}: ${problem}`;
  }
  if (end.startsWith("https:")) {
    const problem = hstsProblem(finalHsts);
    if (problem) return `${end}: ${problem}`;
  }
  return null;
}

/** What is wrong with an HTTPS response's Strict-Transport-Security value, or null when it is fine. */
function hstsProblem(value: string | null): string | null {
  if (value === null) return "no Strict-Transport-Security header";
  const directives = value.split(";").map((d) => d.trim().toLowerCase());
  if (!directives.includes("includesubdomains")) return "Strict-Transport-Security without includeSubDomains";
  const maxAge = /max-age=\s*"?(\d+)/.exec(value.toLowerCase());
  if (!maxAge || Number(maxAge[1]) <= 0) return "Strict-Transport-Security without a positive max-age";
  return null;
}
