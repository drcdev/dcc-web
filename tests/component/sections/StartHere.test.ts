// Start here (spec 040 US2; contracts/home-sections.md): the home page's reading paths.
import { describe, expect, it } from "vitest";
import StartHere from "../../../src/components/sections/StartHere.astro";
import { byName, tags, textOf } from "../html.ts";
import { render } from "./helpers.ts";

const paths = [
  {
    id: "first-path",
    title: "First path",
    description: "For readers of the first path.",
    items: [
      { kind: "post", title: "A post title", href: "/writing/a-post/", minutesRead: 6 },
      { kind: "project", title: "A project title", href: "/projects/a-project/", minutesRead: 1 },
    ],
  },
  {
    id: "second-path",
    title: "Second path",
    description: "For readers of the second path.",
    items: [{ kind: "post", title: "Another post", href: "/writing/another/", minutesRead: 12 }],
  },
];

describe("StartHere", () => {
  it("has an h2 'Start here' and one h3 per path, each path a region labelled by its h3", async () => {
    const html = await render(StartHere, { paths });
    expect(textOf(html, "h2")).toBe("Start here");
    const h3s = byName(html, "h3");
    expect(h3s).toHaveLength(2);
    const labelled = tags(html).filter((t) => t.name === "section" && t.attrs["data-reading-path"]);
    expect(labelled.map((s) => s.attrs["aria-labelledby"])).toEqual(h3s.map((h) => h.attrs.id));
  });

  it("labels a single path the same way", async () => {
    const html = await render(StartHere, { paths: paths.slice(1) });
    expect(byName(html, "h3")).toHaveLength(1);
    expect(tags(html).filter((t) => t.attrs["data-reading-path"])).toHaveLength(1);
  });

  it("lists each path's items in an ordered list, in order, with the full title as link text and the reading time", async () => {
    const html = await render(StartHere, { paths });
    expect(byName(html, "ol")).toHaveLength(2);
    const links = tags(html).filter((t) => t.name === "a");
    expect(links.map((a) => a.attrs.href)).toEqual(["/writing/a-post/", "/projects/a-project/", "/writing/another/"]);
    expect(html).toContain("A post title</a>");
    expect(html).toContain("6 min read");
    expect(html).toContain("1 min read");
    expect(html).toContain("12 min read");
  });

  it("shows the path name and description", async () => {
    const html = await render(StartHere, { paths });
    expect(html).toContain("For readers of the first path.");
    expect(textOf(html, "h3")).toContain("First path");
  });

  it("shows the visible label 'Project' on project items only", async () => {
    const html = await render(StartHere, { paths });
    const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[0]);
    expect(items).toHaveLength(3);
    expect(items.map((li) => /\bProject\b/.test(li.replace(/<a[\s\S]*?<\/a>/, "")))).toEqual([false, true, false]);
  });

  it("renders nothing when there are no paths", async () => {
    const html = await render(StartHere, { paths: [] });
    expect(html.trim()).toBe("");
  });

  it("ships no script", async () => {
    expect(await render(StartHere, { paths })).not.toContain("<script");
  });
});
