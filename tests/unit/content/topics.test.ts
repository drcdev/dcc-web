// The controlled topic list (data-model.md "Topic"; research R2; FR-016,
// FR-017) and the colour classes of the pills, banners and marks. Contrast is
// computed from the palette tokens in src/styles/global.css, so the pairs axe
// cannot measure (a class that only appears in some states) are still proven.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { topicIds, topics } from "../../../src/config/topics.ts";
import { draftLabel, featuredMark, topicStyles } from "../../../src/components/post/topic-styles.ts";

const read = (path: string) => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf-8");
const css = read("src/styles/global.css");

const PALETTES = ["rust", "sage", "lavender", "mist", "sand", "mauve", "dusk"];
const SHADE_LIGHTNESS: Record<string, Record<number, number>> = {};

// `--color-x-N: hsl(from var(--color-x-BASE) h s L%)`: the shade keeps the
// hue and saturation of the BASE colour and sets the lightness.
for (const palette of [...PALETTES, "accent"]) {
  SHADE_LIGHTNESS[palette] = {};
  for (const [, shade, lightness] of css.matchAll(
    new RegExp(`--color-${palette}-(\\d+):\\s*hsl\\(from var\\(--color-${palette}-BASE\\) h s (\\d+)%\\)`, "g"),
  )) {
    SHADE_LIGHTNESS[palette]![Number(shade)] = Number(lightness);
  }
}

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}

/** The rgb (0 to 1) of a token such as `rust-100`, `white` or `black`. */
function colourOf(token: string): [number, number, number] {
  if (token === "white") return [1, 1, 1];
  if (token === "black") return [0, 0, 0];
  const [, palette, shade] = /^([a-z]+)-(\d+)$/.exec(token) ?? [];
  const base = new RegExp(`--color-${palette}-BASE:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1];
  const lightness = SHADE_LIGHTNESS[palette!]?.[Number(shade)];
  if (!base || lightness === undefined) throw new Error(`unknown colour token ${token}`);
  const [h, s] = hexToHsl(base);
  return hslToRgb(h, s, lightness / 100);
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(colourOf(a)), luminance(colourOf(b))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The text and background tokens a class string sets, for the light theme and (falling back to light) the dark theme. */
function pairs(classes: string): { theme: string; bg: string; text: string }[] {
  const list = classes.split(/\s+/).filter(Boolean);
  const token = /^(?:[a-z]+-\d+|white|black)$/;
  const pick = (prefix: string, kind: "bg" | "text") => {
    const match = list.find((c) => c.startsWith(`${prefix}${kind}-`) && token.test(c.slice(prefix.length + kind.length + 1)));
    return match?.slice(prefix.length + kind.length + 1);
  };
  const lightBg = pick("", "bg");
  const lightText = pick("", "text");
  const result = [];
  if (lightBg && lightText) result.push({ theme: "light", bg: lightBg, text: lightText });
  const darkBg = pick("dark:", "bg") ?? lightBg;
  const darkText = pick("dark:", "text") ?? lightText;
  if (darkBg && darkText) result.push({ theme: "dark", bg: darkBg, text: darkText });
  return result;
}

describe("topics", () => {
  it("starts with the four agreed topics in order, each with its colour", () => {
    expect(topics.map((t) => [t.id, t.colour])).toEqual([
      ["compliant-data", "rust"],
      ["technology-teams", "sage"],
      ["agentic-ai", "lavender"],
      ["healthcare-leadership", "mist"],
    ]);
    expect([...topicIds]).toEqual(topics.map((t) => t.id));
  });

  it("uses ids of lower-case letters, digits and hyphens, at most 40 characters", () => {
    for (const { id } of topics) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
      expect(id.length).toBeLessThanOrEqual(40);
    }
  });

  it("has unique ids and unique colours", () => {
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
    expect(new Set(topics.map((t) => t.colour)).size).toBe(topics.length);
  });

  it("gives every topic a name and a description", () => {
    for (const t of topics) {
      expect(t.name.trim()).not.toBe("");
      expect(t.description.trim()).not.toBe("");
    }
  });

  it("uses only colours that are existing palettes", () => {
    for (const t of topics) expect(PALETTES, t.id).toContain(t.colour);
  });

  it("has a style entry for every topic colour", () => {
    for (const t of topics) {
      const style = topicStyles[t.colour];
      expect(style, `topic-styles.ts has no entry for ${t.colour}`).toBeDefined();
      expect(style!.pill).toBeTruthy();
      expect(style!.border).toBeTruthy();
      expect(style!.banner).toBeTruthy();
    }
  });
});

describe("colour contrast of the topic classes (FR-017)", () => {
  const draftNotice = /class="([^"]*)"/.exec(read("src/components/page/DraftNotice.astro"))?.[1] ?? "";
  const cases: [string, string][] = [
    ...topics.flatMap((t) => [
      [`${t.id} pill`, topicStyles[t.colour]!.pill] as [string, string],
      [`${t.id} banner`, topicStyles[t.colour]!.banner] as [string, string],
    ]),
    ["Featured mark", featuredMark],
    ["Draft label", draftLabel],
    ["Draft notice", draftNotice],
  ];

  it.each(cases)("%s has a class pair in both themes", (_name, classes) => {
    expect(pairs(classes).map((p) => p.theme)).toEqual(["light", "dark"]);
  });

  it.each(cases)("%s has at least 4.5:1 in light and dark", (_name, classes) => {
    for (const { theme, bg, text } of pairs(classes)) {
      expect(contrast(bg, text), `${theme}: ${text} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
