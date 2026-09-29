// SC-002 and US3: one file is enough to publish a page, and adding or editing
// it changes nothing else in the site (FR-002, FR-006, FR-015, SC-008).
// Needs the page route and the launch pages (Phase 3).
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const results: FixtureSiteResult[] = [];
afterEach(() => {
  for (const result of results.splice(0)) result.cleanup();
});

const robotsMeta = (html: string) => /<meta[^>]+name="robots"[^>]*>/.exec(html)?.[0] ?? "";
const navList = (html: string) => /<ul[^>]+id="primary-nav-list"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? "";
const withoutCurrent = (html: string) => html.replace(/\s+aria-current="page"/g, "");

describe("a page that is one file", () => {
  it("publishes /workshops/ with its metadata, a sitemap entry and unchanged navigation", async () => {
    const result = await buildFixtureSite(["workshops.mdx"]);
    results.push(result);
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);

    const html = result.read("workshops/index.html");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*Workshops\s*<\/h1>/);
    expect(html).toContain("Half-day and full-day workshops on systems leadership.");
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/workshops\/"/);
    expect(html).toMatch(/<meta[^>]+property="og:image"[^>]+content="[^"]*og-default\.png"/);

    const sitemap = result.read("sitemap-0.xml");
    expect(sitemap).toContain("/workshops/");

    // Header navigation is the launch navigation: no entry for the new page.
    const about = result.read("about/index.html");
    expect(navList(html)).not.toContain("Workshops");
    expect(withoutCurrent(navList(html))).toBe(withoutCurrent(navList(about)));

    // Not a draft: no notice, and the robots meta matches a draft launch page's.
    expect(html).not.toContain("data-draft-notice");
    expect(about).toContain("data-draft-notice");
    expect(robotsMeta(html)).not.toBe("");
    expect(robotsMeta(html)).toBe(robotsMeta(about));
  });

  it("changes only its own HTML file when one word in it changes", async () => {
    const first = await buildFixtureSite(["workshops.mdx"]);
    results.push(first);
    expect(first.ok, first.message).toBe(true);
    const before = first.htmlFiles();

    const second = await buildFixtureSite([{ from: "workshops.mdx", replace: ["ordinary", "plain"] }]);
    results.push(second);
    expect(second.ok, second.message).toBe(true);
    const after = second.htmlFiles();

    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
    const changed = [...after.keys()].filter((path) => before.get(path) !== after.get(path));
    expect(changed).toEqual(["workshops/index.html"]);
  });
});
