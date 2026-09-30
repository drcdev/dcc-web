// Shared prototype pieces (FR-025, FR-033, FR-037, FR-050).
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, classList, tags, textOf } from "../../html.ts";
import PrototypeNotice from "../../../../src/prototypes/portfolio/shared/PrototypeNotice.astro";
import DraftMark from "../../../../src/prototypes/portfolio/shared/DraftMark.astro";
import PlaceholderFrame from "../../../../src/prototypes/portfolio/shared/PlaceholderFrame.astro";
import ArchitectureDiagram from "../../../../src/prototypes/portfolio/shared/ArchitectureDiagram.astro";
import OptionsDiagram from "../../../../src/prototypes/portfolio/shared/OptionsDiagram.astro";
import StatusBadge from "../../../../src/prototypes/portfolio/shared/StatusBadge.astro";
import ThemePills from "../../../../src/prototypes/portfolio/shared/ThemePills.astro";
import VisualView from "../../../../src/prototypes/portfolio/shared/VisualView.astro";

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("PrototypeNotice", () => {
  it("says the page is a prototype and links to the hub", async () => {
    const html = await render(PrototypeNotice);
    expect(plain(html)).toContain("Design prototype for review. Not part of the live site.");
    const link = byName(html, "a").find((a) => a.attrs.href === "/design/portfolio/");
    expect(link).toBeDefined();
  });
});

describe("DraftMark", () => {
  it("is readable text, not a hidden badge", async () => {
    const html = await render(DraftMark);
    expect(plain(html)).toBe("Draft for review");
    const mark = tags(html).find((t) => "data-draft-mark" in t.attrs);
    expect(mark).toBeDefined();
    expect(tags(html).some((t) => "aria-hidden" in t.attrs)).toBe(false);
    expect(tags(html).some((t) => "aria-label" in t.attrs)).toBe(false);
  });
});

describe("PlaceholderFrame", () => {
  let html = "";
  beforeAll(async () => {
    html = await render(PlaceholderFrame, {
      media: "screenshot",
      label: "Screenshot of a chat",
      description: "A conversation asking for tasks due tomorrow.",
    });
  });
  it("shows Placeholder, the label and the description as text", () => {
    expect(plain(html)).toContain("Placeholder");
    expect(plain(html)).toContain("Screenshot of a chat");
    expect(plain(html)).toContain("A conversation asking for tasks due tomorrow.");
    expect(tags(html).some((t) => "data-placeholder" in t.attrs)).toBe(true);
  });
  it("has no image and no inline style", () => {
    expect(byName(html, "img")).toHaveLength(0);
    expect(tags(html).some((t) => "style" in t.attrs)).toBe(false);
  });
});

describe.each([
  ["ArchitectureDiagram", ArchitectureDiagram],
  ["OptionsDiagram", OptionsDiagram],
] as const)("%s", (_name, Component) => {
  let html = "";
  beforeAll(async () => {
    html = await render(Component, { label: "A diagram label", description: "What the diagram shows.", idPrefix: "t" });
  });
  it("is an image with a label and a description", () => {
    const img = tags(html).find((t) => t.attrs.role === "img");
    expect(img).toBeDefined();
    const labelledby = img!.attrs["aria-labelledby"];
    expect(labelledby).toBeTruthy();
    const firstId = labelledby!.split(/\s+/)[0]!;
    expect(html).toContain(`id="${firstId}"`);
    expect(plain(html)).toContain("A diagram label");
    expect(plain(html)).toContain("What the diagram shows.");
  });
  it("has no style attribute and no literal colours", () => {
    expect(tags(html).some((t) => "style" in t.attrs)).toBe(false);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/);
  });
  it("draws with currentColor so forced colours keeps it visible", () => {
    expect(html).toContain("currentColor");
  });
});

describe("StatusBadge", () => {
  it.each([
    ["shipped", "Shipped"],
    ["experiment", "Experiment"],
    ["in-progress", "In progress"],
  ] as const)("shows %s as text", async (status, label) => {
    const html = await render(StatusBadge, { status });
    expect(plain(html)).toBe(label);
    expect(tags(html).some((t) => t.attrs["data-status"] === status)).toBe(true);
  });
});

describe("ThemePills", () => {
  it("lists each theme as text", async () => {
    const html = await render(ThemePills, { themes: ["Web", "Mobile"] });
    expect(byName(html, "li").map((_, i) => i)).toHaveLength(2);
    expect(plain(html)).toContain("Web");
    expect(plain(html)).toContain("Mobile");
    expect(textOf(html, "ul") ?? "").not.toBe("");
    expect(classList(byName(html, "ul")[0]!).length).toBeGreaterThan(0);
  });
});

describe("VisualView", () => {
  it("renders placeholders and diagrams by kind", async () => {
    const placeholder = await render(VisualView, {
      visual: { kind: "placeholder", media: "clip", label: "Clip", description: "A short clip." },
    });
    expect(plain(placeholder)).toContain("Placeholder");
    const diagram = await render(VisualView, {
      visual: { kind: "diagram", id: "architecture", label: "Architecture", description: "Parts." },
    });
    expect(tags(diagram).some((t) => t.attrs.role === "img")).toBe(true);
  });
});
