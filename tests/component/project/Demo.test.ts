import { describe, expect, it } from "vitest";
import Demo from "../../../src/components/project/blocks/Demo.astro";
import { byName } from "../html.ts";
import { makeProject, renderWithProject } from "./helpers.ts";

const withData = (data: Record<string, unknown>) => renderWithProject(Demo, {}, undefined, makeProject(data));

describe("Demo link forms", () => {
  it("links to an open demo", async () => {
    const html = await withData({ demo: { href: "https://demo.drc.dev/fp", embed: false } });
    expect(byName(html, "a")[0]!.attrs.href).toBe("https://demo.drc.dev/fp");
    expect(html).toContain("Open the Focus Pocus demo");
    expect(html).not.toContain("not a live demo");
  });

  it("uses the demo title in the link text", async () => {
    const html = await withData({ demo: { href: "https://demo.drc.dev/fp", title: "Pocus", embed: false } });
    expect(html).toContain("Open the Pocus demo");
  });

  it("links to a stand-in with the not-a-live-demo note", async () => {
    const html = await withData({
      standIn: { href: "https://drc.dev/projects/focus-pocus", label: "Focus Pocus on drc.dev" },
    });
    expect(html).toContain("Focus Pocus on drc.dev");
    expect(html).toContain("This is not a live demo.");
  });

  it("links to the source code", async () => {
    const html = await withData({ source: "https://github.com/drcdev/focus-pocus" });
    expect(html).toContain("Source code for Focus Pocus");
    expect(byName(html, "a")[0]!.attrs.href).toBe("https://github.com/drcdev/focus-pocus");
  });

  it("opens every link in the same tab", async () => {
    const html = await withData({
      demo: { href: "https://demo.drc.dev/fp", embed: false },
      source: "https://github.com/drcdev/focus-pocus",
    });
    expect(byName(html, "a")).toHaveLength(2);
    for (const a of byName(html, "a")) expect(a.attrs.target).toBeUndefined();
    expect(byName(html, "ul")[0]!.attrs["data-demo-links"]).toBeDefined();
  });
});
