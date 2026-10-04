import { describe, expect, it } from "vitest";
import ProjectRow from "../../../src/components/project/ProjectRow.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";
import { image } from "./helpers.ts";

const props = {
  slug: "focus-pocus",
  title: "Focus Pocus",
  problem: "Managing OmniFocus meant switching apps.",
  status: "experiment",
  themes: ["AI integration", "macOS"],
  visual: { kind: "image", src: image, alt: "Claude Desktop answering a question" },
  draft: false,
};

describe("ProjectRow", () => {
  it("is a list item with a text part and a visual part (two-column hooks)", async () => {
    const html = await render(ProjectRow, props);
    const [li] = byName(html, "li").filter((t) => "data-project" in t.attrs);
    expect(li!.attrs["data-project"]).toBe("focus-pocus");
    expect(li!.attrs["data-themes"]).toBe("ai-integration|macos");
    expect(byName(html, "div").filter((t) => "data-project-text" in t.attrs)).toHaveLength(1);
    expect(byName(html, "div").filter((t) => "data-project-visual" in t.attrs)).toHaveLength(1);
    expect(html.indexOf("data-project-text")).toBeLessThan(html.indexOf("data-project-visual"));
  });

  it("has one link, named by the title, to the story", async () => {
    const html = await render(ProjectRow, props);
    const links = byName(html, "a");
    expect(links).toHaveLength(1);
    expect(links[0]!.attrs.href).toBe("/projects/focus-pocus/");
    expect(textOf(html, "a")).toBe("Focus Pocus");
    expect(textOf(html, "h2")).toBe("Focus Pocus");
  });

  it("shows the problem, the status as text and the themes", async () => {
    const html = await render(ProjectRow, props);
    expect(byName(html, "p").some((t) => "data-project-problem" in t.attrs)).toBe(true);
    expect(html).toContain("Managing OmniFocus meant switching apps.");
    expect(byName(html, "span").find((t) => t.attrs["data-status"])!.attrs["data-status"]).toBe("experiment");
    expect(html).toContain("Experiment");
    expect(byName(html, "ul").find((t) => t.attrs["aria-label"] === "Themes")).toBeDefined();
    expect(html).toContain("AI integration");
  });

  it("shows the visual with its alt text", async () => {
    const html = await render(ProjectRow, props);
    const [img] = byName(html, "img");
    expect(img!.attrs.alt).toBe("Claude Desktop answering a question");
  });

  it("carries the view-transition name project-<slug> on the title", async () => {
    const html = await render(ProjectRow, props);
    const [h2] = byName(html, "h2");
    expect(h2!.attrs["data-title-slug"]).toBe("focus-pocus");
    expect(html).not.toMatch(/data-astro-transition-scope/);
  });

  it("marks a draft in text, and only a draft", async () => {
    const draft = await render(ProjectRow, { ...props, draft: true });
    expect(byName(draft, "p").filter((t) => "data-draft-mark" in t.attrs)).toHaveLength(1);
    expect(draft).toContain("Draft");
    const published = await render(ProjectRow, props);
    expect(published).not.toContain("data-draft-mark");
  });

  it("shows the Retired pill for a retired project and changes nothing else", async () => {
    const html = await render(ProjectRow, { ...props, status: "retired" });
    expect(byName(html, "span").some((t) => t.attrs["data-status"] === "retired")).toBe(true);
    expect(html).toContain("Retired");
    expect(byName(html, "li").find((t) => "data-project" in t.attrs)!.attrs["data-themes"]).toBe("ai-integration|macos");
    expect(byName(html, "a")).toHaveLength(1);
    expect(byName(html, "a")[0]!.attrs.href).toBe("/projects/focus-pocus/");
  });
});
