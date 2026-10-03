import { describe, expect, it } from "vitest";
import StoryHeader from "../../../src/components/project/StoryHeader.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";

const props = {
  title: "Focus Pocus",
  problem: "Managing OmniFocus meant switching apps.",
  status: "experiment",
  themes: ["AI integration", "macOS"],
};

describe("StoryHeader", () => {
  it("has one h1 with the title, the problem line, the status and the themes", async () => {
    const html = await render(StoryHeader, props);
    expect(byName(html, "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toBe("Focus Pocus");
    expect(byName(html, "p").some((t) => "data-story-problem" in t.attrs)).toBe(true);
    expect(html).toContain("Managing OmniFocus meant switching apps.");
    expect(byName(html, "span").some((t) => t.attrs["data-status"] === "experiment")).toBe(true);
    expect(html).toContain("Experiment");
    expect(byName(html, "ul").some((t) => t.attrs["aria-label"] === "Themes")).toBe(true);
    expect(html).toContain("AI integration");
  });

  it("names the h1 for the view transition when given a slug", async () => {
    const html = await render(StoryHeader, { ...props, slug: "focus-pocus" });
    expect(byName(html, "h1")[0]!.attrs["data-title-slug"]).toBe("focus-pocus");
  });

  it("has no contents list, chapter numbers or in-page links", async () => {
    const html = await render(StoryHeader, props);
    expect(byName(html, "nav")).toHaveLength(0);
    expect(byName(html, "ol")).toHaveLength(0);
    expect(byName(html, "a")).toHaveLength(0);
    expect(html).not.toContain("In this story");
    expect(html).not.toContain("data-story-contents");
    expect(html).not.toMatch(/data-chapter|Chapter \d/);
  });

  it("shows the draft notice only for a draft", async () => {
    expect(await render(StoryHeader, props)).not.toContain("data-draft-notice");
    const html = await render(StoryHeader, { ...props, draft: true });
    expect(byName(html, "p").filter((t) => "data-draft-notice" in t.attrs)).toHaveLength(1);
    expect(html).toContain("Draft");
  });
});
