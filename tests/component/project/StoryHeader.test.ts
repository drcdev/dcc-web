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

  it("lists the seven chapters in an 'In this story' navigation as an ordered list of in-page links", async () => {
    const html = await render(StoryHeader, props);
    const nav = byName(html, "nav");
    expect(nav).toHaveLength(1);
    expect(nav[0]!.attrs["aria-label"]).toBe("In this story");
    expect(byName(html, "ol")).toHaveLength(1);
    expect(byName(html, "a").map((t) => t.attrs.href)).toEqual([
      "#problem",
      "#constraints",
      "#options",
      "#built",
      "#outcome",
      "#lessons",
      "#invitation",
    ]);
    expect(html).toContain("The problem");
    expect(html).toContain("Have a problem like this?");
  });

  it("shows the draft notice only for a draft", async () => {
    expect(await render(StoryHeader, props)).not.toContain("data-draft-notice");
    const html = await render(StoryHeader, { ...props, draft: true });
    expect(byName(html, "p").filter((t) => "data-draft-notice" in t.attrs)).toHaveLength(1);
    expect(html).toContain("Draft");
  });
});
