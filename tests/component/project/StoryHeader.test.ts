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

  describe("the retired note", () => {
    const retired = { ...props, status: "retired" };
    const note = (html: string) => byName(html, "p").filter((t) => "data-retired-note" in t.attrs);
    const lead = "Retired. I no longer use or maintain this project.";
    // The note's text with tags removed (the dev build adds source attributes to every tag).
    const noteText = (html: string) =>
      /<p[^>]*data-retired-note[^>]*>([\s\S]*?)<\/p>/.exec(html)![1]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    it("says only that the project is retired when there is no replacement", async () => {
      const html = await render(StoryHeader, retired);
      expect(note(html)).toHaveLength(1);
      expect(noteText(html)).toBe(lead);
      expect(html).toMatch(/<strong[^>]*>Retired\.<\/strong>/);
      expect(html).not.toContain("replaced by");
      expect(byName(html, "a")).toHaveLength(0);
    });

    it("names a replacement without a link", async () => {
      const html = await render(StoryHeader, { ...retired, replacement: { name: "Metronome" } });
      expect(noteText(html)).toBe(`${lead} It was replaced by Metronome.`);
      expect(byName(html, "a")).toHaveLength(0);
    });

    it("links the replacement's name in the same tab", async () => {
      const html = await render(StoryHeader, { ...retired, replacement: { name: "Metronome", href: "/projects/metronome/" } });
      const links = byName(html, "a");
      expect(links).toHaveLength(1);
      expect(links[0]!.attrs.href).toBe("/projects/metronome/");
      expect(links[0]!.attrs.target).toBeUndefined();
      expect(textOf(html, "a")).toBe("Metronome");
      expect(noteText(html)).toBe(`${lead} It was replaced by Metronome.`);
      expect(links[0]!.attrs.class ?? "").toContain("underline");
    });

    it("has no note on other statuses, even with a replacement", async () => {
      const html = await render(StoryHeader, { ...props, replacement: { name: "Metronome" } });
      expect(note(html)).toHaveLength(0);
    });

    it("puts the draft notice before the header and the note after the meta", async () => {
      const html = await render(StoryHeader, { ...retired, draft: true });
      expect(html.indexOf("data-draft-notice")).toBeLessThan(html.indexOf("data-story-header"));
      expect(html.indexOf("data-story-meta")).toBeLessThan(html.indexOf("data-retired-note"));
      expect(html.indexOf("data-retired-note")).toBeLessThan(html.indexOf("</header>"));
    });

    it("adds no role, aria attribute or script to the pill or the note", async () => {
      const html = await render(StoryHeader, { ...retired, replacement: { name: "Metronome", href: "/projects/metronome/" } });
      expect(byName(html, "script")).toHaveLength(0);
      const tags = [...note(html), ...byName(html, "span").filter((t) => t.attrs["data-status"] === "retired")];
      expect(tags).toHaveLength(2);
      for (const tag of tags) {
        expect(Object.keys(tag.attrs).filter((k) => k === "role" || k.startsWith("aria-"))).toEqual([]);
      }
    });
  });
});
