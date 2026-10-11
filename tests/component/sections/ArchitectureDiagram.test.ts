// ArchitectureDiagram markup rows M01-M05 and M09 (specs/036-technology-architecture-diagram/
// contracts/diagram-dom.md). Neutral parts are fed through the `parts` prop, named from the layout's
// ids so the test never depends on the real part files' wording.
import { describe, expect, it } from "vitest";
import ArchitectureDiagram from "../../../src/components/sections/ArchitectureDiagram.astro";
import { layout } from "../../../src/lib/architecture/layout.ts";
import { byName, tags } from "../html.ts";
import { render } from "./helpers.ts";

const parts = layout.parts.map((part) => ({
  id: part.id,
  name: part.lines.join(" "),
  html: `<p>Neutral text for ${part.id}.</p>`,
}));

const diagram = async () => render(ArchitectureDiagram, { parts });

describe("ArchitectureDiagram", () => {
  it("M06: lists one entry per part after the diagram, in layout order, with a heading and a back link", async () => {
    const html = await diagram();
    expect(byName(html, "h2").map((h) => h.attrs.id)).toEqual(["how-each-part-works"]);
    expect(html.indexOf("</figure>")).toBeLessThan(html.indexOf("how-each-part-works"));
    const entries = byName(html, "article");
    expect(entries.map((e) => e.attrs.id)).toEqual(layout.parts.map((p) => p.id));
    for (const entry of entries) {
      expect(entry.attrs.tabindex).toBe("-1");
      expect(entry.attrs["data-entry"]).toBe(entry.attrs.id);
    }
    expect(byName(html, "h3").length).toBe(12);
    const back = byName(html, "a").filter((a) => "data-back" in a.attrs);
    expect(back).toHaveLength(12);
    for (const link of back) expect(link.attrs.href).toBe("#architecture-diagram");
    expect(html).toContain("Neutral text for worker-api.");
  });

  it("M06: the Connects to line comes from the layout and is left out when a part has no outgoing connection", async () => {
    const html = await diagram();
    const lines = byName(html, "p").filter((p) => "data-connects" in p.attrs);
    expect(lines).toHaveLength(new Set(layout.connections.map((c) => c.from)).size);
    const from = layout.connections.find((c) => c.from === "email-path")!;
    expect(html).toContain(`Connects to: ${parts.find((p) => p.id === from.to)!.name} (${from.label}).`);
  });

  it("M07: a source link opens a new tab and is left out when a part has no source", async () => {
    const html = await render(ArchitectureDiagram, {
      parts: parts.map((p) => (p.id === "worker-api" ? { ...p, source: "worker/src/index.ts" } : p)),
    });
    const links = byName(html, "a").filter((a) => a.attrs.target === "_blank");
    expect(links).toHaveLength(1);
    expect(links[0]?.attrs.href).toBe("https://github.com/drcdev/dcc-web/blob/main/worker/src/index.ts");
    expect(links[0]?.attrs.rel).toBe("noopener");
    expect(html).toContain("Source: worker/src/index.ts");
    expect(html).toContain("(opens in a new tab)");
  });

  it("M01, M02: is a figure with a caption and one grouped svg named by it", async () => {
    const html = await diagram();
    const figure = byName(html, "figure");
    expect(figure).toHaveLength(1);
    expect(figure[0]?.attrs.id).toBe("architecture-diagram");
    expect(figure[0]?.attrs.class).toContain("not-prose");
    const caption = byName(html, "figcaption");
    expect(caption).toHaveLength(1);
    expect(caption[0]?.attrs.id).toBeTruthy();
    const svg = byName(html, "svg");
    expect(svg).toHaveLength(1);
    expect(svg[0]?.attrs.role).toBe("group");
    expect(svg[0]?.attrs["aria-labelledby"]).toBe(caption[0]?.attrs.id);
    expect(svg[0]?.attrs.viewbox).toMatch(/^0 0 240 \d+$/);
  });

  it("M03: has exactly one link per part, labelled by tspans and without aria-label", async () => {
    const html = await diagram();
    const links = byName(html, "a").filter((a) => "data-part" in a.attrs);
    expect(links).toHaveLength(12);
    expect(links.map((a) => a.attrs["data-part"])).toEqual(layout.parts.map((p) => p.id));
    for (const link of links) {
      expect(link.attrs.href).toBe(`#${link.attrs["data-part"]}`);
      expect("aria-label" in link.attrs).toBe(false);
    }
    for (const part of layout.parts) {
      const start = html.indexOf(`data-part="${part.id}"`);
      const end = html.indexOf("</a>", start);
      const inner = html.slice(start, end);
      const spans = [...inner.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g)].map((m) => m[1]);
      expect(spans.join(" ")).toBe(part.lines.join(" "));
    }
  });

  it("M04: hides boxes, frames, lines, arrowheads and connection labels from assistive technology", async () => {
    const html = await diagram();
    const svgOnly = html.slice(html.indexOf("<svg"), html.indexOf("</svg>"));
    for (const shape of ["rect", "polyline", "path"]) {
      for (const tag of tags(svgOnly).filter((t) => t.name === shape)) {
        expect(tag.attrs["aria-hidden"], `${shape} is aria-hidden: ${tag.raw}`).toBe("true");
      }
    }
    const connectionLabels = tags(svgOnly).filter((t) => t.name === "text" && t.attrs.class?.includes("arch-connection-label"));
    expect(connectionLabels).toHaveLength(layout.connections.length);
    for (const label of connectionLabels) expect(label.attrs["aria-hidden"]).toBe("true");
  });

  it("M04: a group's link covers only its tab, so no link contains another", async () => {
    const html = await diagram();
    for (const group of layout.parts.filter((p) => p.kind === "group")) {
      const start = html.indexOf(`data-part="${group.id}"`);
      const end = html.indexOf("</a>", start);
      const inner = html.slice(start, end);
      expect(inner.match(/data-part="/g)).toHaveLength(1);
      expect(inner).not.toContain("<a ");
      for (const other of layout.parts.filter((p) => p.id !== group.id)) {
        expect(inner).not.toContain(`>${other.lines[0]}<`);
      }
      const rects = tags(inner).filter((t) => t.name === "rect");
      expect(rects).toHaveLength(1);
      expect(Number(rects[0]?.attrs.width)).toBe(group.tab?.width);
    }
  });

  it("M05: part labels and connection labels carry their classes", async () => {
    const html = await diagram();
    const texts = tags(html).filter((t) => t.name === "text");
    expect(texts.filter((t) => t.attrs.class?.includes("arch-part-label"))).toHaveLength(12);
    expect(texts.filter((t) => t.attrs.class?.includes("arch-connection-label"))).toHaveLength(9);
  });

  it("M09: no element has a style attribute", async () => {
    const html = await diagram();
    expect(tags(html).filter((t) => "style" in t.attrs)).toEqual([]);
  });
});
