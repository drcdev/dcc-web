// The drawing of the architecture diagram on the Technology page (specs/036-technology-architecture-
// diagram/data-model.md §2-§4). Pure data: the component draws it, the unit tests check it. Each part's
// `id` is the name of its file in src/content/architecture/ and the page fragment for its entry.
// One vertical viewBox, 240 units wide, so a 320 px phone scales it up and labels stay readable.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutPart extends Rect {
  id: string;
  /** A group is a frame around other parts; its link is the frame's tab. */
  kind: "box" | "group";
  /** Group only: the clickable label tab at the frame's top left. */
  tab?: Rect;
  /** Label line breaks; `lines.join(" ")` equals the part file's `name`. */
  lines: string[];
  /** Group only: ids drawn inside the frame. */
  contains?: string[];
  /** Preview group only: decorative pictures. */
  glyphs?: ("worker" | "database")[];
}

export interface Connection {
  from: string;
  to: string;
  label?: string;
  /** Where the label's text is drawn (SVG `text-anchor`: start or end). */
  labelAt?: { x: number; y: number; anchor: "start" | "end" };
  /** A polyline: first point on `from`'s edge, last on `to`'s edge. */
  points: [number, number][];
}

export interface Layout {
  viewBox: { width: 240; height: number };
  labelSizes: { part: 15; connection: 12.5 };
  parts: LayoutPart[];
  connections: Connection[];
}

export const layout: Layout = {
  viewBox: { width: 240, height: 640 },
  labelSizes: { part: 15, connection: 12.5 },
  parts: [
    {
      id: "browser", kind: "group", x: 10, y: 10, width: 220, height: 78,
      tab: { x: 10, y: 10, width: 120, height: 26 },
      lines: ["Your browser"], contains: ["questions-panel", "contact-form"],
    },
    { id: "questions-panel", kind: "box", x: 20, y: 40, width: 96, height: 40, lines: ["Questions", "panel"] },
    { id: "contact-form", kind: "box", x: 124, y: 40, width: 96, height: 40, lines: ["Contact", "form"] },
    {
      id: "production", kind: "group", x: 10, y: 124, width: 220, height: 140,
      tab: { x: 10, y: 124, width: 98, height: 26 },
      lines: ["Production"], contains: ["database", "static-pages", "worker-api"],
    },
    { id: "database", kind: "box", x: 20, y: 154, width: 80, height: 40, lines: ["D1", "database"] },
    { id: "static-pages", kind: "box", x: 140, y: 154, width: 86, height: 40, lines: ["Static", "pages"] },
    { id: "worker-api", kind: "box", x: 20, y: 210, width: 200, height: 40, lines: ["Worker API"] },
    { id: "ai-model", kind: "box", x: 20, y: 330, width: 90, height: 40, lines: ["Workers", "AI model"] },
    { id: "bot-check", kind: "box", x: 134, y: 330, width: 90, height: 40, lines: ["Turnstile", "bot check"] },
    { id: "email-path", kind: "box", x: 77, y: 410, width: 90, height: 40, lines: ["Email", "sending"] },
    { id: "inbox", kind: "box", x: 77, y: 490, width: 90, height: 40, lines: ["Contact", "inbox"] },
    {
      id: "preview", kind: "group", x: 10, y: 570, width: 220, height: 60,
      tab: { x: 10, y: 570, width: 100, height: 26 },
      lines: ["Preview"], glyphs: ["worker", "database"],
    },
  ],
  connections: [
    {
      from: "browser", to: "static-pages", label: "other pages",
      labelAt: { x: 136, y: 148, anchor: "start" },
      points: [[224, 88], [224, 154]],
    },
    {
      from: "questions-panel", to: "worker-api", label: "/api/questions",
      labelAt: { x: 110, y: 108, anchor: "end" },
      points: [[114, 80], [114, 210]],
    },
    {
      from: "contact-form", to: "worker-api", label: "/api/contact",
      labelAt: { x: 130, y: 108, anchor: "start" },
      points: [[128, 80], [128, 210]],
    },
    {
      from: "contact-form", to: "bot-check", label: "token",
      labelAt: { x: 233, y: 316, anchor: "end" },
      points: [[220, 60], [235, 60], [235, 350], [224, 350]],
    },
    {
      from: "worker-api", to: "database", label: "cache",
      labelAt: { x: 66, y: 205, anchor: "start" },
      points: [[60, 210], [60, 194]],
    },
    {
      from: "worker-api", to: "ai-model", label: "new set",
      labelAt: { x: 69, y: 282, anchor: "start" },
      points: [[65, 250], [65, 330]],
    },
    {
      from: "worker-api", to: "bot-check", label: "verify",
      labelAt: { x: 170, y: 298, anchor: "end" },
      points: [[174, 250], [174, 330]],
    },
    {
      from: "worker-api", to: "email-path", label: "if accepted",
      labelAt: { x: 128, y: 390, anchor: "start" },
      points: [[122, 250], [122, 410]],
    },
    {
      from: "email-path", to: "inbox", label: "fixed address",
      labelAt: { x: 128, y: 474, anchor: "start" },
      points: [[122, 450], [122, 490]],
    },
  ],
};
