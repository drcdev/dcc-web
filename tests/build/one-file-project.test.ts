// SC-004 and US7: one .mdx file plus its images is enough to publish a project. It
// appears on the index and at /projects/<slug>/, and adding it changes no other
// file's output except the index (and the sitemap).
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const results: FixtureSiteResult[] = [];
afterEach(() => {
  for (const result of results.splice(0)) result.cleanup();
});

describe("a project that is one file", () => {
  it("publishes the story and lists it on the index, touching no other page", async () => {
    const without = await buildFixtureSite([], { projects: ["minimal.mdx"] });
    results.push(without);
    expect(without.ok, without.message).toBe(true);
    const before = without.htmlFiles();

    const withNew = await buildFixtureSite([], {
      projects: ["minimal.mdx", { from: "every-setting.mdx", to: "brand-new.mdx" }],
    });
    results.push(withNew);
    expect(withNew.ok, withNew.message).toBe(true);
    const after = withNew.htmlFiles();

    const story = after.get("projects/brand-new/index.html") ?? "";
    expect(story).toContain("Every setting");
    expect(after.get("projects/index.html")).toContain("/projects/brand-new/");
    expect(withNew.read("sitemap-0.xml")).toContain("/projects/brand-new/");

    const changed = [...after.keys()].filter((path) => before.get(path) !== after.get(path)).sort();
    const expected = ["projects/brand-new/index.html", "projects/index.html"];
    // Other pages may only differ by the header or footer if navigation listed projects; it does not.
    expect(changed).toEqual(expected);
  });
});
