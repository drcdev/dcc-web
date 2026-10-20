// Component test (primary layer: component) for the previous / all projects / next block that closes a
// project story (spec 042 FR-001, FR-003, FR-005). The component takes its two neighbours as props.
import { describe, expect, it } from "vitest";
import StoryNav from "../../../src/components/project/StoryNav.astro";
import { byName, tags } from "../html.ts";
import { render } from "../sections/helpers.ts";

const previous = { slug: "newer-one", title: "Newer one" };
const next = { slug: "older-one", title: "Older one" };
const nav = (props: Record<string, unknown> = { previous, next }) => render(StoryNav, props);
// The visible text of the i-th link, tags stripped and whitespace collapsed.
const text = (html: string, i: number) =>
  [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)][i]![1]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

describe("StoryNav", () => {
  it("is a navigation landmark named Projects, marked for the story styles", async () => {
    const [el] = byName(await nav(), "nav");
    expect(el!.attrs["aria-label"]).toBe("Projects");
    expect(el!.attrs["data-story-nav"]).toBeDefined();
  });

  it("lists previous, all projects, next in that order with the right addresses", async () => {
    const links = byName(await nav(), "a");
    expect(links.map((a) => a.attrs.href)).toEqual(["/projects/newer-one/", "/projects/", "/projects/older-one/"]);
    expect(links[0]!.attrs.rel).toBe("prev");
    expect(links[2]!.attrs.rel).toBe("next");
    expect(links[1]!.attrs.rel).toBeUndefined();
  });

  it("puts the direction and the title in the visible link text", async () => {
    const html = await nav();
    expect(text(html, 0)).toBe("Previous: Newer one");
    expect(text(html, 1)).toBe("All projects");
    expect(text(html, 2)).toBe("Next: Older one");
  });

  it("hides the arrows from assistive technology and gives the links no competing label", async () => {
    const html = await nav();
    const arrows = byName(html, "span").filter((s) => s.attrs["aria-hidden"] === "true");
    expect(arrows).toHaveLength(2);
    for (const a of byName(html, "a")) expect(a.attrs["aria-label"]).toBeUndefined();
  });

  it("renders no previous item when there is none", async () => {
    const html = await nav({ next });
    expect(byName(html, "li")).toHaveLength(2);
    expect(byName(html, "a").map((a) => a.attrs.href)).toEqual(["/projects/", "/projects/older-one/"]);
    expect(html).not.toContain("Previous");
  });

  it("renders no next item when there is none", async () => {
    const html = await nav({ previous });
    expect(byName(html, "li")).toHaveLength(2);
    expect(byName(html, "a").map((a) => a.attrs.href)).toEqual(["/projects/newer-one/", "/projects/"]);
    expect(html).not.toContain("Next");
  });

  it("keeps only All projects for a single project", async () => {
    const html = await nav({});
    expect(byName(html, "li")).toHaveLength(1);
    expect(byName(html, "a")).toHaveLength(1);
  });

  it("shows no status text, script or button", async () => {
    const html = await nav();
    expect(byName(html, "script")).toHaveLength(0);
    expect(byName(html, "button")).toHaveLength(0);
    expect(tags(html).some((t) => "aria-live" in t.attrs || t.attrs.role === "status")).toBe(false);
  });
});
