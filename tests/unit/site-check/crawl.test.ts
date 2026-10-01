import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  crawl,
  extractLinks,
  formatFailures,
  parseSitemap,
  type CrawlOptions,
  type FetchResult,
} from "../../../scripts/site-check/crawl.ts";

const fixture = (name: string) =>
  readFileSync(new URL(`../../fixtures/site-check/${name}`, import.meta.url), "utf-8");

const BASE = "http://127.0.0.1:4321";

type Route = Partial<FetchResult> | (() => Partial<FetchResult>);

function makeFetcher(routes: Record<string, Route>) {
  const calls: string[] = [];
  const fetcher = async (url: string): Promise<FetchResult> => {
    calls.push(url);
    const path = url.replace(BASE, "");
    const route = routes[path];
    if (route === undefined) return { status: 404, headers: {}, body: "", location: null };
    const r = typeof route === "function" ? route() : route;
    return { status: 200, headers: {}, body: "", location: null, ...r };
  };
  return { fetcher, calls };
}

const okSite = (): Record<string, Route> => ({
  "/robots.txt": { body: fixture("robots.txt") },
  "/sitemap-index.xml": { body: fixture("sitemap-index.xml") },
  "/sitemap-0.xml": { body: fixture("sitemap-0.xml") },
  "/": { body: fixture("index.html") },
  "/about/": { body: fixture("about-clean.html") },
});

const opts = (routes: Record<string, Route>, extra: Partial<CrawlOptions> = {}) => {
  const { fetcher, calls } = makeFetcher(routes);
  return {
    calls,
    options: {
      base: BASE,
      checkLinks: true,
      concurrency: 4,
      fetcher,
      sleep: async () => {},
      ...extra,
    } satisfies CrawlOptions,
  };
};

describe("parseSitemap", () => {
  it("returns every <loc> in order", () => {
    expect(parseSitemap(fixture("sitemap-0.xml"))).toEqual([
      "https://doncoleman.ca/",
      "https://doncoleman.ca/about/",
    ]);
    expect(parseSitemap(fixture("sitemap-index.xml"))).toEqual(["https://doncoleman.ca/sitemap-0.xml"]);
  });
});

describe("extractLinks", () => {
  it("returns anchor hrefs only", () => {
    const links = extractLinks(fixture("index.html"));
    expect(links).toContain("/about/");
    expect(links).not.toContain("/style.css");
  });
  it("handles single quotes and entities", () => {
    expect(extractLinks(`<a class="x" href='/a/?b=1&amp;c=2'>t</a>`)).toEqual(["/a/?b=1&c=2"]);
  });
});

describe("crawl", () => {
  it("passes a healthy site and maps the declared origin onto the base", async () => {
    const { options } = opts(okSite());
    const result = await crawl(options);
    expect(result.failures).toEqual([]);
    expect(result.declaredOrigin).toBe("https://doncoleman.ca");
    expect(result.pagesChecked).toBe(2);
    expect(result.linksChecked).toBeGreaterThan(0);
  });

  it("drops fragments and ignores mailto, other origins and fragment-only links", async () => {
    const { options, calls } = opts(okSite());
    await crawl(options);
    expect(calls.some((c) => c.includes("#"))).toBe(false);
    expect(calls.some((c) => c.includes("elsewhere"))).toBe(false);
  });

  it("follows links that use the declared origin", async () => {
    const routes = okSite();
    routes["/"] = { body: `<a href="https://doncoleman.ca/about/">a</a>` };
    const { options } = opts(routes);
    expect((await crawl(options)).failures).toEqual([]);
  });

  it("reports a broken link naming the target and every linking page", async () => {
    const routes = okSite();
    routes["/"] = { body: `<a href="/about/">a</a><a href="/does-not-exist/">b</a>` };
    routes["/about/"] = { body: fixture("about.html") };
    const { options } = opts(routes);
    const result = await crawl(options);
    expect(result.failures).toEqual([
      { kind: "link", target: "/does-not-exist/", status: 404, reason: "returned 404", linkedFrom: ["/", "/about/"] },
    ]);
    expect(formatFailures(result)).toEqual([
      "link  /does-not-exist/  returned 404  (linked from /, /about/)",
    ]);
  });

  it("treats a sitemap entry that redirects as a page failure", async () => {
    const routes = okSite();
    routes["/about/"] = { status: 301, location: "/about-us/" };
    routes["/about-us/"] = { body: "" };
    const { options } = opts(routes);
    const result = await crawl(options);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ kind: "page", target: "/about/", reason: "redirected to /about-us/" }),
    );
  });

  it("follows a same-site link redirect for up to 5 hops", async () => {
    const routes = okSite();
    routes["/"] = { body: `<a href="/r0/">x</a>` };
    for (let i = 0; i < 5; i++) routes[`/r${i}/`] = { status: 301, location: `/r${i + 1}/` };
    routes["/r5/"] = { body: "" };
    const { options } = opts(routes);
    expect((await crawl(options)).failures).toEqual([]);
  });

  it("fails a link redirect chain longer than 5 hops", async () => {
    const routes = okSite();
    routes["/"] = { body: `<a href="/r0/">x</a>` };
    for (let i = 0; i < 7; i++) routes[`/r${i}/`] = { status: 301, location: `/r${i + 1}/` };
    const { options } = opts(routes);
    const result = await crawl(options);
    expect(result.failures).toContainEqual(expect.objectContaining({ kind: "link", target: "/r0/" }));
  });

  it("retries a 5xx once", async () => {
    const routes = okSite();
    let n = 0;
    routes["/about/"] = () => (n++ === 0 ? { status: 503 } : { body: fixture("about-clean.html") });
    const { options } = opts(routes);
    expect((await crawl(options)).failures).toEqual([]);
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it("fails after the retry when a page keeps returning 5xx", async () => {
    const routes = okSite();
    routes["/about/"] = { status: 500 };
    const { options } = opts(routes);
    const result = await crawl(options);
    expect(result.failures).toContainEqual(expect.objectContaining({ kind: "page", target: "/about/", status: 500 }));
  });

  it("reports a network error as a null status", async () => {
    const { fetcher } = makeFetcher(okSite());
    const options: CrawlOptions = {
      base: BASE,
      checkLinks: false,
      concurrency: 4,
      sleep: async () => {},
      fetcher: async (url) => {
        if (url.endsWith("/about/")) throw new Error("boom");
        return fetcher(url);
      },
    };
    const result = await crawl(options);
    expect(result.failures).toContainEqual(expect.objectContaining({ kind: "page", target: "/about/", status: null }));
  });

  it("reports a missing child sitemap", async () => {
    const routes = okSite();
    delete routes["/sitemap-0.xml"];
    const { options } = opts(routes);
    const result = await crawl(options);
    expect(result.failures).toContainEqual(expect.objectContaining({ kind: "sitemap", target: "/sitemap-0.xml" }));
  });

  it("falls back to /sitemap-index.xml when robots.txt has no Sitemap line", async () => {
    const routes = okSite();
    routes["/robots.txt"] = { body: "User-agent: *\n" };
    const { options } = opts(routes);
    expect((await crawl(options)).failures).toEqual([]);
  });

  it("fails an origin that differs from expectOrigin", async () => {
    const { options } = opts(okSite(), { expectOrigin: "https://other.example" });
    const result = await crawl(options);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        kind: "origin",
        reason: "sitemap names https://doncoleman.ca, expected https://other.example",
      }),
    );
  });

  it("fails a sitemap that mixes origins", async () => {
    const routes = okSite();
    routes["/sitemap-0.xml"] = {
      body: `<urlset><url><loc>https://doncoleman.ca/</loc></url><url><loc>https://x.example/about/</loc></url></urlset>`,
    };
    const { options } = opts(routes);
    expect((await crawl(options)).failures.some((f) => f.kind === "origin")).toBe(true);
  });

  it("requires X-Robots-Tag noindex on every page with expectNoindex", async () => {
    const routes = okSite();
    routes["/"] = { body: fixture("index.html"), headers: { "x-robots-tag": "noindex" } };
    const { options } = opts(routes, { expectNoindex: true });
    const result = await crawl(options);
    expect(result.failures.filter((f) => f.kind === "noindex").map((f) => f.target)).toEqual(["/about/"]);
  });

  it("skips link checks with checkLinks false", async () => {
    const routes = okSite();
    routes["/"] = { body: `<a href="/nope/">x</a>` };
    const { options } = opts(routes, { checkLinks: false });
    const result = await crawl(options);
    expect(result.failures).toEqual([]);
    expect(result.linksChecked).toBe(0);
  });
});

describe("formatFailures", () => {
  it("names kind, address, problem and linking pages", () => {
    expect(
      formatFailures({
        declaredOrigin: null,
        pagesChecked: 0,
        linksChecked: 0,
        failures: [
          { kind: "page", target: "/a/", status: 404, reason: "returned 404", linkedFrom: [] },
          { kind: "link", target: "/b/", status: 404, reason: "returned 404", linkedFrom: ["/x/", "/y/"] },
        ],
      }),
    ).toEqual(["page  /a/  returned 404", "link  /b/  returned 404  (linked from /x/, /y/)"]);
  });
});
