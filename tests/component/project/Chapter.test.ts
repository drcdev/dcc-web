import { describe, expect, it } from "vitest";
import Chapter from "../../../src/components/project/blocks/Chapter.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";
import { makeProject, renderWithProject } from "./helpers.ts";

describe("Chapter", () => {
  it("renders a labelled section with number, one h2 and the text", async () => {
    const html = await renderWithProject(Chapter, { stage: "options" }, "<p>Body text.</p>");
    const [section] = byName(html, "section");
    expect(section!.attrs.id).toBe("options");
    expect(section!.attrs["aria-labelledby"]).toBe("options-heading");
    expect(section!.attrs["data-stage"]).toBe("options");
    expect(html).toContain("Chapter 3 of 7");
    const h2 = byName(html, "h2");
    expect(h2).toHaveLength(1);
    expect(h2[0]!.attrs.id).toBe("options-heading");
    expect(h2[0]!.attrs["data-reveal"]).toBeDefined();
    expect(textOf(html, "h2")).toBe("Options considered");
    expect(html).toContain("Body text.");
  });

  it("has no visual panel and a no-visual hook without a visual", async () => {
    const html = await renderWithProject(Chapter, { stage: "problem" }, "<p>x</p>");
    expect(html).not.toContain("data-chapter-visual");
    expect(html).toContain('data-has-visual="false"');
  });

  it("renders the named visual in the panel", async () => {
    const html = await renderWithProject(Chapter, { stage: "problem", visual: "screenshot" }, "<p>x</p>");
    expect(html).toContain("data-chapter-visual");
    expect(html).toContain('data-has-visual="true"');
    expect(byName(html, "img")[0]!.attrs.alt).toBe("A screenshot of the tool");
  });

  it("renders the embedded demo as the chapter's visual panel", async () => {
    const project = makeProject({ demo: { href: "https://demo.drc.dev/fp", embed: true } });
    const html = await renderWithProject(Chapter, { stage: "built", visual: "demo" }, "<p>x</p>", project);
    expect(html).toContain("data-chapter-visual");
    expect(html).toContain('data-has-visual="true"');
    expect(byName(html, "iframe")).toHaveLength(1);
    expect(byName(html, "iframe")[0]!.attrs.src).toBe("https://demo.drc.dev/fp");
  });

  it('fails naming the project file when visual="demo" is used without an embedded demo', async () => {
    await expect(renderWithProject(Chapter, { stage: "built", visual: "demo" }, "x")).rejects.toThrow(/focus-pocus\.mdx.*embed/s);
  });

  it("marks a draft chapter", async () => {
    const html = await renderWithProject(Chapter, { stage: "lessons", draft: true }, "<p>x</p>");
    expect(html).toContain("Draft for review");
    const plain = await renderWithProject(Chapter, { stage: "lessons" }, "<p>x</p>");
    expect(plain).not.toContain("Draft for review");
  });

  it("throws for an unknown stage or an unknown visual, naming the project file", async () => {
    await expect(renderWithProject(Chapter, { stage: "epilogue" }, "x")).rejects.toThrow(/<Chapter>.*stage/s);
    await expect(renderWithProject(Chapter, { stage: "problem", visual: "nope" }, "x")).rejects.toThrow(
      /focus-pocus\.mdx.*nope/s,
    );
  });

  it("throws when the route has not provided a project", async () => {
    await expect(render(Chapter, { stage: "problem" }, "x")).rejects.toThrow(/project/i);
  });
});
