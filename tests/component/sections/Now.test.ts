// Now (spec 040 US1; contracts/home-sections.md): the home page's dated Now section.
import { describe, expect, it } from "vitest";
import Now from "../../../src/components/sections/Now.astro";
import { byName, tags, textOf } from "../html.ts";
import OpenTo from "./NowOpenTo.astro";
import { render } from "./helpers.ts";

const now = {
  updated: "2026-10-01",
  topics: {
    workingOn: "Working text.",
    reading: "Reading text.",
    mbaResearch: "Research text.",
    aiExperiments: "Experiment text.",
  },
  OpenTo,
};

describe("Now", () => {
  it("is a region labelled by its h2 'Now'", async () => {
    const html = await render(Now, { now });
    const section = tags(html).find((t) => t.name === "section");
    expect(byName(html, "h2")).toHaveLength(1);
    expect(byName(html, "h2")[0]?.attrs.id).toBe(section?.attrs["aria-labelledby"]);
    expect(textOf(html, "h2")).toBe("Now");
  });

  it("shows the date as 'Updated <time datetime>'", async () => {
    const html = await render(Now, { now });
    expect(html).toMatch(/Updated\s*<time datetime="2026-10-01"[^>]*>October 1, 2026<\/time>/);
  });

  it("lists the four labels in order, each paired with its text", async () => {
    const html = await render(Now, { now });
    const dts = [...html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => [m[1]!.trim(), m[2]!.trim()]);
    expect(dts).toEqual([
      ["Working on", "Working text."],
      ["Reading", "Reading text."],
      ["MBA research", "Research text."],
      ["AI experiments", "Experiment text."],
    ]);
    expect(byName(html, "dl")).toHaveLength(1);
  });

  it("has the open-to paragraph with a link to /contact/", async () => {
    const html = await render(Now, { now });
    const open = html.slice(html.indexOf("data-now-open-to"));
    expect(byName(open, "a").some((a) => a.attrs.href === "/contact/")).toBe(true);
  });

  it("ships no script", async () => {
    expect(await render(Now, { now })).not.toContain("<script");
  });
});
