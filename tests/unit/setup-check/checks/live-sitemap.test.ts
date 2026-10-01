import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/live-sitemap.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import type { ProviderAccessError, HttpResponseSummary } from "../../../../scripts/setup-check/types.ts";
import { emptyAnswers, expectPendingSuffix, ghostAnswers, liveContext, tlsError } from "./live-helpers.ts";

const ORIGIN = "https://doncoleman.ca";
const xml = (...paths: string[]) =>
  `<?xml version="1.0"?><urlset>${paths.map((p) => `<url><loc>${ORIGIN}${p}</loc></url>`).join("")}</urlset>`;
const ok = (body: string): HttpResponseSummary => ({ status: 200, headers: {}, body });
const ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap-index.xml\n`;

function site(overrides: Record<string, HttpResponseSummary | ProviderAccessError> = {}, paths = ["/", "/about/"]) {
  const index = `<sitemapindex><sitemap><loc>${ORIGIN}/sitemap-0.xml</loc></sitemap></sitemapindex>`;
  const table: Record<string, HttpResponseSummary | ProviderAccessError> = {
    [`${ORIGIN}/robots.txt`]: ok(ROBOTS),
    [`${ORIGIN}/sitemap-index.xml`]: ok(index),
    [`${ORIGIN}/sitemap-0.xml`]: ok(xml(...paths)),
    ...Object.fromEntries(paths.map((p) => [`${ORIGIN}${p}`, ok("<html></html>")])),
    ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [`${ORIGIN}${k}`, v])),
  };
  return (url: string) => table[url] ?? { status: 404, headers: {}, body: "" };
}

describe("checks/live-sitemap (item 30)", () => {
  it("is waiting before the switch", async () => {
    const result = await check(liveContext({ phase: "before-switch" }));
    expect(result.status).toBe("waiting");
    expect(result.step).toBe(`Step 30 of ${setupItems.length}`);
  });

  it("is pending while DNS settles", async () => {
    const result = await check(
      liveContext({ dns: (name, type) => (type === "A" ? ghostAnswers(name, "A", "49.13.201.194") : emptyAnswers), get: site() }),
    );
    expectPendingSuffix(result);
  });

  it("is pending on a TLS error", async () => {
    const result = await check(liveContext({ get: () => tlsError() }));
    expectPendingSuffix(result);
  });

  it("is complete when every sitemap page loads, robots.txt names the sitemap and expected paths are present", async () => {
    const ctx = liveContext({ get: site() });
    const result = await check(ctx);
    expect(result.status).toBe("complete");
    expect(result.summary).toBe("All 2 sitemap pages on doncoleman.ca return a page.");
    expect(ctx.calls.every((c) => c.redirect === "manual")).toBe(true);
  });

  it("is a Problem with one detail per failing page", async () => {
    const result = await check(liveContext({ get: site({ "/about/": { status: 404, headers: {}, body: "" } }) }));
    expect(result.status).toBe("missing");
    expect(result.summary.startsWith("Problem:")).toBe(true);
    expect(result.details).toEqual(["/about/: returned 404"]);
  });

  it("is a Problem when robots.txt does not name the sitemap", async () => {
    const result = await check(liveContext({ get: site({ "/robots.txt": ok("User-agent: *\nAllow: /\n") }) }));
    expect(result.status).toBe("missing");
    expect(result.details).toEqual([`robots.txt: does not name Sitemap: ${ORIGIN}/sitemap-index.xml`]);
  });

  it("is a Problem for each expected path missing from the sitemap", async () => {
    const result = await check(liveContext({ get: site({}, ["/"]) }));
    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["/about/: expected in the sitemap but not listed"]);
  });

  it("is a Problem when the sitemap names another origin", async () => {
    const wrong = site({ "/sitemap-0.xml": ok(xml("/", "/about/").replaceAll(ORIGIN, "https://new.doncoleman.ca")) });
    const result = await check(liveContext({ get: wrong }));
    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("https://new.doncoleman.ca");
  });

  it("is missing and names the config field when launch.expectedPaths is absent", async () => {
    const result = await check(liveContext({ get: site(), config: { zone: "doncoleman.ca", workerName: "dcc-web" } }));
    expect(result.status).toBe("missing");
    expect(result.summary).toContain("launch.expectedPaths");
  });
});
