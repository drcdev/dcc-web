import { describe, expect, it } from "vitest";
import Visual from "../../../src/components/project/blocks/Visual.astro";
import { byName } from "../html.ts";
import { renderWithProject } from "./helpers.ts";

describe("Visual", () => {
  it("renders an image with alt text in a figure", async () => {
    const html = await renderWithProject(Visual, { name: "screenshot" });
    expect(byName(html, "figure")).toHaveLength(1);
    expect(byName(html, "img")[0]!.attrs.alt).toBe("A screenshot of the tool");
  });

  it("shows a visible Placeholder mark only for placeholders", async () => {
    const placeholder = await renderWithProject(Visual, { name: "screenshot" });
    expect(placeholder).toContain("Placeholder");
    const real = await renderWithProject(Visual, { name: "architecture" });
    expect(real).not.toContain("Placeholder");
  });

  it("renders a diagram with a reachable visible description", async () => {
    const html = await renderWithProject(Visual, { name: "architecture" });
    const img = byName(html, "img")[0]!;
    const id = img.attrs["aria-describedby"];
    expect(id).toBeTruthy();
    const described = byName(html, "figcaption").find((t) => t.attrs.id === id);
    expect(described).toBeDefined();
    expect(html).toContain("Three boxes in a row.");
  });

  // A clip that resolves needs a real file under src/content/projects, which only a
  // built site has; tests/build/project-clips.test.ts renders one (controls, muted,
  // poster, no autoplay, description). Here the component's own failure is checked.
  it("throws naming the project file and the path for a clip that is not there", async () => {
    await expect(renderWithProject(Visual, { name: "walkthrough" })).rejects.toThrow(
      /focus-pocus\.mdx.*\.\/images\/clip\.webm/s,
    );
  });

  it("is lazy unless it is the first visual", async () => {
    const lazy = await renderWithProject(Visual, { name: "screenshot" });
    expect(byName(lazy, "img")[0]!.attrs.loading).toBe("lazy");
    const eager = await renderWithProject(Visual, { name: "screenshot", eager: true });
    expect(byName(eager, "img")[0]!.attrs.loading).toBe("eager");
  });

  it("throws for a visual the project does not have, naming the file", async () => {
    await expect(renderWithProject(Visual, { name: "nope" })).rejects.toThrow(/focus-pocus\.mdx.*nope/s);
  });
});
