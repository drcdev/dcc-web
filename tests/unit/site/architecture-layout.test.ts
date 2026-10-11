// Layout module rows L01-L09 (specs/036-technology-architecture-diagram/contracts/diagram-dom.md).
// Pure data, so a unit test observes every row.
import { describe, expect, it } from "vitest";
import { layout, type LayoutPart } from "../../../src/lib/architecture/layout.ts";

const PINNED = [
  "browser", "questions-panel", "contact-form", "production", "static-pages", "worker-api",
  "database", "ai-model", "bot-check", "email-path", "inbox", "preview",
];
const PART_SIZE = 15;
const CONNECTION_SIZE = 12.5;
const GLYPH = 0.6;
const PADDING = 4;

const byId = new Map(layout.parts.map((part) => [part.id, part]));
const part = (id: string): LayoutPart => {
  const found = byId.get(id);
  if (!found) throw new Error(`no part ${id}`);
  return found;
};
type Rect = { x: number; y: number; width: number; height: number };
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;
const onEdge = (p: [number, number], r: Rect) => {
  const [x, y] = p;
  const withinX = x >= r.x && x <= r.x + r.width;
  const withinY = y >= r.y && y <= r.y + r.height;
  return (withinX && (y === r.y || y === r.y + r.height)) || (withinY && (x === r.x || x === r.x + r.width));
};
const connection = (from: string, to: string) => layout.connections.find((c) => c.from === from && c.to === to);

describe("architecture layout", () => {
  it("L01: has the 12 pinned parts with unique ids", () => {
    expect(layout.parts.map((p) => p.id).sort()).toEqual([...PINNED].sort());
    expect(new Set(layout.parts.map((p) => p.id)).size).toBe(12);
  });

  it("L02: keeps every shape and label inside the viewBox", () => {
    const view = { x: 0, y: 0, width: layout.viewBox.width, height: layout.viewBox.height };
    for (const p of layout.parts) {
      expect(inside(p, view), p.id).toBe(true);
      if (p.tab) expect(inside(p.tab, p), `${p.id} tab`).toBe(true);
    }
    for (const c of layout.connections) {
      for (const [x, y] of c.points) expect(inside({ x, y, width: 0, height: 0 }, view)).toBe(true);
      if (c.labelAt && c.label) {
        const width = c.label.length * GLYPH * CONNECTION_SIZE;
        const left = c.labelAt.anchor === "end" ? c.labelAt.x - width : c.labelAt.x;
        expect(inside({ x: left, y: c.labelAt.y - CONNECTION_SIZE, width, height: CONNECTION_SIZE }, view), c.label).toBe(true);
      }
    }
  });

  it("L03: overlaps nothing except a group frame around exactly its contained boxes", () => {
    for (const a of layout.parts) {
      for (const b of layout.parts) {
        if (a.id >= b.id) continue;
        const contained = a.contains?.includes(b.id) || b.contains?.includes(a.id);
        if (contained) continue;
        expect(overlaps(a, b), `${a.id} and ${b.id}`).toBe(false);
      }
      for (const id of a.contains ?? []) {
        expect(inside(part(id), a), `${id} in ${a.id}`).toBe(true);
        if (a.tab) expect(overlaps(part(id), a.tab), `${id} on ${a.id} tab`).toBe(false);
      }
    }
  });

  it("L04: starts and ends every connection on the edges of its parts", () => {
    for (const c of layout.connections) {
      expect(onEdge(c.points[0], part(c.from)), `${c.from} start`).toBe(true);
      expect(onEdge(c.points.at(-1)!, part(c.to)), `${c.to} end`).toBe(true);
    }
  });

  it("L05: connects only existing parts", () => {
    for (const c of layout.connections) {
      expect(byId.has(c.from)).toBe(true);
      expect(byId.has(c.to)).toBe(true);
    }
  });

  it("L06: has exactly the nine connections and follows the flow rules", () => {
    const pairs = layout.connections.map((c) => `${c.from}>${c.to}`).sort();
    expect(pairs).toEqual(
      [
        "browser>static-pages", "questions-panel>worker-api", "contact-form>worker-api",
        "contact-form>bot-check", "worker-api>database", "worker-api>ai-model",
        "worker-api>bot-check", "worker-api>email-path", "email-path>inbox",
      ].sort(),
    );
    expect(layout.connections.filter((c) => c.to === "ai-model").every((c) => c.from === "worker-api")).toBe(true);
    expect(layout.connections.filter((c) => c.to === "inbox").every((c) => c.from === "email-path")).toBe(true);
    expect(layout.connections.filter((c) => c.to === "email-path").every((c) => c.from === "worker-api")).toBe(true);
    expect(connection("browser", "static-pages")?.label).toBeTruthy();
    expect(connection("questions-panel", "worker-api")?.label).toContain("/api/");
    expect(connection("contact-form", "worker-api")?.label).toContain("/api/");
    expect(layout.connections.some((c) => c.from === "preview" || c.to === "preview")).toBe(false);
  });

  it("L07: uses a 240-wide viewBox and the two label sizes", () => {
    expect(layout.viewBox.width).toBe(240);
    expect(layout.labelSizes).toEqual({ part: PART_SIZE, connection: CONNECTION_SIZE });
  });

  it("L08: lists parts top to bottom, then left to right", () => {
    const keys = layout.parts.map((p) => [p.y, p.x]);
    const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(keys).toEqual(sorted);
  });

  it("L09: fits each label inside its box or tab", () => {
    for (const p of layout.parts) {
      const area = p.tab ?? p;
      const widest = Math.max(...p.lines.map((line) => line.length)) * GLYPH * PART_SIZE;
      expect(widest + PADDING * 2, p.id).toBeLessThanOrEqual(area.width);
      if (!p.tab) expect(p.lines.length * PART_SIZE + PADDING * 2, `${p.id} height`).toBeLessThanOrEqual(p.height);
    }
  });
});
