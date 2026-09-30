// Direction C "Chapters" index (T054; FR-020, FR-021, FR-024, FR-025).
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, tags } from "../../html.ts";
import ChapterIndex from "../../../../src/prototypes/portfolio/c/ChapterIndex.astro";
import { allEntries } from "../../../../src/prototypes/portfolio/sample.ts";
import { STATUS_LABELS } from "../../../../src/prototypes/portfolio/types.ts";

const plain = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

let html = "";
beforeAll(async () => {
  html = await render(ChapterIndex, { entries: allEntries });
});

/** The HTML of one entry, from its opening tag to the next entry or the end. */
function entryHtml(slug: string): string {
  const starts = tags(html).filter((t) => "data-entry" in t.attrs);
  const i = starts.findIndex((t) => t.attrs["data-entry"] === slug);
  const from = starts[i]!.index;
  const to = starts[i + 1]?.index ?? html.length;
  return html.slice(from, to);
}

describe("ChapterIndex", () => {
  it("lists five entries with every field", () => {
    const entries = tags(html).filter((t) => "data-entry" in t.attrs);
    expect(entries.map((e) => e.attrs["data-entry"])).toEqual(allEntries.map((e) => e.slug));
    for (const entry of allEntries) {
      const chunk = entryHtml(entry.slug);
      const text = plain(chunk);
      expect(text).toContain(entry.title);
      expect(text).toContain(entry.problem);
      expect(text).toContain(entry.visual.label);
      for (const theme of entry.themes) expect(text).toContain(theme);
      expect(text).toContain(STATUS_LABELS[entry.status]);
      expect(tags(chunk).find((t) => "data-entry" in t.attrs)!.attrs["data-themes"]).toBe(entry.themes.join("|"));
    }
  });

  it("links only Focus Pocus to the C story; the others link only to drc.dev", () => {
    for (const entry of allEntries) {
      const hrefs = byName(entryHtml(entry.slug), "a").map((a) => a.attrs.href);
      if (entry.storyPath) {
        expect(hrefs).toContain("/design/portfolio/c/focus-pocus/");
      } else {
        expect(hrefs).toEqual([entry.externalHref]);
      }
    }
    expect(byName(html, "a").filter((a) => a.attrs.href === "/design/portfolio/c/focus-pocus/")).toHaveLength(1);
  });

  it("includes the filter markup", () => {
    expect(byName(html, "portfolio-filter")).toHaveLength(1);
    expect(html).toContain("Filter by theme");
    expect(html).toContain("data-filter-status");
  });

  it("opts the Focus Pocus title into the view transition and no other title", () => {
    const named = tags(html).filter((t) => "data-vt-title" in t.attrs);
    expect(named).toHaveLength(1);
    expect(entryHtml("focus-pocus")).toContain("data-vt-title");
  });

  it("lays the entries out as a chapter list, not cards", () => {
    const entries = tags(html).filter((t) => "data-entry" in t.attrs);
    expect(entries.every((t) => t.attrs.class?.includes("cc-entry"))).toBe(true);
    expect(entries.every((t) => t.name === "li")).toBe(true);
  });

  it("uses no inline style", () => {
    expect(tags(html).some((t) => "style" in t.attrs)).toBe(false);
  });
});
