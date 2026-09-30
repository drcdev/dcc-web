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

describe("Demo link privacy (FR-046)", () => {
  it("opens demo, stand-in and source links in the same tab, so there is no opener, and adds no tracking parameters", async () => {
    const html = await withData({
      demo: { href: "https://demo.drc.dev/fp", embed: false },
      standIn: { href: "https://drc.dev/projects/focus-pocus", label: "Focus Pocus on drc.dev" },
      source: "https://github.com/drcdev/focus-pocus",
    });
    const links = byName(html, "a");
    expect(links).toHaveLength(3);
    for (const a of links) {
      expect(a.attrs.target).toBeUndefined();
      expect(a.attrs.href).not.toMatch(/[?&](utm_|ref=|fbclid|gclid)/i);
      // Nothing may loosen the site's referrer policy for these links.
      expect(a.attrs.referrerpolicy ?? "strict-origin-when-cross-origin").toMatch(/^(no-referrer|origin|strict-origin(-when-cross-origin)?)$/);
    }
  });
});

describe("Demo embed", () => {
  const embedded = { demo: { href: "https://demo.drc.dev/fp", embed: true } };
  const frameOf = (data: Record<string, unknown>) => renderWithProject(Demo, { frame: true }, undefined, makeProject(data));

  it("renders no frame in the built chapter, which keeps the open-demo link", async () => {
    const html = await withData(embedded);
    expect(byName(html, "iframe")).toHaveLength(0);
    expect(html).toContain("Open the Focus Pocus demo");
  });

  it("renders a lazy, sandboxed frame with a title, no allow attribute and the address as src", async () => {
    const html = await frameOf(embedded);
    const [frame] = byName(html, "iframe");
    expect(byName(html, "iframe")).toHaveLength(1);
    expect(frame!.attrs.src).toBe("https://demo.drc.dev/fp");
    expect(frame!.attrs.title).toBe("Focus Pocus demo");
    expect(frame!.attrs.loading).toBe("lazy");
    expect(frame!.attrs.sandbox).toBe("allow-scripts allow-same-origin allow-forms");
    expect(frame!.attrs.referrerpolicy).toBe("strict-origin-when-cross-origin");
    expect("allow" in frame!.attrs).toBe(false);
  });

  it("keeps the open-demo link outside the frame", async () => {
    const html = await frameOf(embedded);
    expect(byName(html, "a")).toHaveLength(0);
  });

  it("titles the frame with the demo title when there is one", async () => {
    const html = await frameOf({ demo: { href: "https://demo.drc.dev/fp", title: "Pocus", embed: true } });
    expect(byName(html, "iframe")[0]!.attrs.title).toBe("Pocus demo");
  });

  it("fails naming the project file when the project does not embed a demo", async () => {
    await expect(frameOf({})).rejects.toThrow(/focus-pocus\.mdx.*embed/s);
    await expect(frameOf({ demo: { href: "https://demo.drc.dev/fp", embed: false } })).rejects.toThrow(/embed/);
  });
});
