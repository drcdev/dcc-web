import { describe, expect, it } from "vitest";
import PartPicture from "../../../src/components/project/PartPicture.astro";
import { byName } from "../html.ts";
import { renderWithProject } from "./helpers.ts";

describe("PartPicture", () => {
  it("renders an image with alt text in a figure", async () => {
    const html = await renderWithProject(PartPicture, { name: "screenshot" });
    expect(byName(html, "figure")).toHaveLength(1);
    expect(byName(html, "img")[0]!.attrs.alt).toBe("A screenshot of the tool");
  });

  it("shows a visible Placeholder mark only for placeholders", async () => {
    const placeholder = await renderWithProject(PartPicture, { name: "screenshot" });
    expect(placeholder).toContain("Placeholder");
    const real = await renderWithProject(PartPicture, { name: "architecture" });
    expect(real).not.toContain("Placeholder");
  });

  it("renders a diagram with a reachable visible description", async () => {
    const html = await renderWithProject(PartPicture, { name: "architecture" });
    const img = byName(html, "img")[0]!;
    const id = img.attrs["aria-describedby"];
    expect(id).toBeTruthy();
    const described = byName(html, "figcaption").find((t) => t.attrs.id === id);
    expect(described).toBeDefined();
    expect(html).toContain("Three boxes in a row.");
  });

  it("is lazy unless it is the first picture on the page", async () => {
    const lazy = await renderWithProject(PartPicture, { name: "screenshot" });
    expect(byName(lazy, "img")[0]!.attrs.loading).toBe("lazy");
    const eager = await renderWithProject(PartPicture, { name: "screenshot", eager: true });
    expect(byName(eager, "img")[0]!.attrs.loading).toBe("eager");
  });

  it("throws for a picture the project does not have, naming the file", async () => {
    await expect(renderWithProject(PartPicture, { name: "nope" })).rejects.toThrow(/focus-pocus\.mdx.*nope/s);
  });
});
