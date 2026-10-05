// The controlled topic list (data-model.md "Topic"; research R2; FR-016,
// FR-017) and the colour classes of the pills, banners and marks. Contrast is
// computed from the palette tokens in src/styles/global.css, so the pairs axe
// cannot measure (a class that only appears in some states) are still proven.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  controlledIds,
  findTopic,
  otherSeries,
  pillRowTopics,
  seriesIds,
  topicHref,
  topicIds,
  topics,
} from "../../../src/config/topics.ts";
import { cardEdge, draftLabel, featuredMark, topicStyles } from "../../../src/components/post/topic-styles.ts";

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

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number];
}

/** The rgb (0 to 1) of a token such as `rust-100`, `white` or `black`. */
function colourOf(token: string): [number, number, number] {
  if (token === "white") return [1, 1, 1];
  if (token === "black") return [0, 0, 0];
  if (token === "dusk-BASE") return hexToRgb(/--color-dusk-BASE:\s*(#[0-9a-fA-F]{6})/.exec(css)![1]!);
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
  it("lists the six controlled topics in the FR-010a order, each with its colour", () => {
    expect(topics.map((t) => [t.id, t.colour])).toEqual([
      ["compliant-data", "rust"],
      ["technology-teams", "sand"],
      ["agentic-ai", "mauve"],
      ["healthcare-leadership", "mist"],
      ["drift", "lavender"],
      ["convergence", "sage"],
    ]);
    expect([...controlledIds]).toEqual(topics.map((t) => t.id));
    expect([...topicIds]).toEqual(topics.map((t) => t.id));
  });

  it("pins the series descriptions to the agreed copy (R8)", () => {
    expect(findTopic("convergence")?.description).toBe(
      "Systems leadership: how to create alignment, work through complexity and lead change when the path forward isn't clear.",
    );
    expect(findTopic("drift")?.description).toBe(
      "Hands-on exploration of emerging technology: trying new tools, building real projects and writing up what worked and what didn't.",
    );
  });

  it("marks drift and convergence, and only those, as series", () => {
    expect(topics.filter((t) => "series" in t && t.series).map((t) => t.id)).toEqual(["drift", "convergence"]);
    expect([...seriesIds]).toEqual(["drift", "convergence"]);
  });

  it("leaves series out of the pill row", () => {
    expect(pillRowTopics.map((t) => t.id)).toEqual([
      "compliant-data",
      "technology-teams",
      "agentic-ai",
      "healthcare-leadership",
    ]);
  });

  it("addresses a series at /writing/{id}/ and any other topic at /writing/topics/{id}/", () => {
    expect(topicHref("drift")).toBe("/writing/drift/");
    expect(topicHref("convergence")).toBe("/writing/convergence/");
    expect(topicHref("agentic-ai")).toBe("/writing/topics/agentic-ai/");
    expect(topicHref("cloud-cost")).toBe("/writing/topics/cloud-cost/");
  });

  it("names the other series", () => {
    expect(otherSeries("drift")).toBe("convergence");
    expect(otherSeries("convergence")).toBe("drift");
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

describe("colour contrast of the topic classes (FR-017, FR-010, FR-016c)", () => {
  const draftNotice = /class="([^"]*)"/.exec(read("src/components/page/DraftNotice.astro"))?.[1] ?? "";
  const cases: [string, string][] = [
    ...topics.flatMap((t) => [
      [`${t.id} pill`, topicStyles[t.colour]!.pill] as [string, string],
      [`${t.id} banner`, topicStyles[t.colour]!.banner] as [string, string],
    ]),
    ...topics
      .filter((t) => "series" in t && t.series)
      .map((t) => [`${t.id} series marker`, topicStyles[t.colour]!.marker] as [string, string]),
    ["free-form (dusk) pill", topicStyles.dusk!.pill],
    ["plain (dusk) banner", topicStyles.dusk!.banner],
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

describe("series marker outline (FR-016c)", () => {
  const series = topics.filter((t) => "series" in t && t.series);

  it.each(series.map((t) => [t.id, t.colour] as [string, string]))("%s marker has a 2px outline in shade 700 light and 300 dark", (_id, colour) => {
    const marker = topicStyles[colour as keyof typeof topicStyles]!.marker;
    expect(marker).toMatch(/(^|\s)border-2(\s|$)/);
    expect(marker).toContain(`border-${colour}-700`);
    expect(marker).toContain(`dark:border-${colour}-300`);
    expect(marker).toContain("font-semibold");
    expect(marker).toContain("forced-colors:");
  });

  it.each(series.map((t) => [t.id, t.colour] as [string, string]))("%s outline has at least 3:1 against fill and surface", (_id, colour) => {
    const marker = topicStyles[colour as keyof typeof topicStyles]!.marker;
    const [lightFill] = pairs(marker).map((p) => p.bg);
    const darkFill = pairs(marker)[1]!.bg;
    expect(contrast(`${colour}-700`, lightFill!), "light fill").toBeGreaterThanOrEqual(3);
    expect(contrast(`${colour}-700`, "white"), "light surface").toBeGreaterThanOrEqual(3);
    expect(contrast(`${colour}-300`, darkFill), "dark fill").toBeGreaterThanOrEqual(3);
    expect(contrast(`${colour}-300`, "dusk-BASE"), "dark surface").toBeGreaterThanOrEqual(3);
  });
});

describe("dark-mode edges of cards and series tiles (FR-012, FR-014, FR-015)", () => {
  const series = topics.filter((t) => "series" in t && t.series);
  const darkToken = (classes: string) => /(?:^|\s)dark:border-([a-z]+-\d+)(?:\s|$)/.exec(classes)?.[1];
  const edges: [string, string | undefined][] = [
    ...series.map((t) => [`${t.id} outline`, darkToken(topicStyles[t.colour]!.outline)] as [string, string | undefined]),
    ["card edge", darkToken(cardEdge)],
    ...topics
      .filter((t) => !("series" in t && t.series))
      .map((t) => [`${t.id} text-only border`, darkToken(topicStyles[t.colour]!.border)] as [string, string | undefined]),
    ["free-form text-only border", darkToken(topicStyles.dusk!.border)],
  ];

  it.each(edges)("%s has a dark token with at least 3:1 against the page", (_name, token) => {
    expect(token).toBeDefined();
    expect(contrast(token!, "dusk-BASE")).toBeGreaterThanOrEqual(3);
  });

  it("series outline is the 300 shade of the series colour", () => {
    for (const t of series) expect(darkToken(topicStyles[t.colour]!.outline)).toBe(`${t.colour}-300`);
  });

  it("card edge keeps the light dusk-200 border and uses dusk-500 in dark", () => {
    expect(cardEdge).toBe("border border-dusk-200 dark:border-dusk-500");
  });

  it("every outline includes the forced-colors classes", () => {
    for (const t of series) {
      const outline = topicStyles[t.colour]!.outline;
      expect(outline).toContain("forced-colors:border");
      expect(outline).toContain("forced-colors:border-[CanvasText]");
    }
  });

  it("uses only existing palette tokens", () => {
    const all = [cardEdge, ...series.map((t) => topicStyles[t.colour]!.outline)].join(" ");
    for (const [, token] of all.matchAll(/border-([a-z]+-\d+)/g)) {
      expect(() => colourOf(token!), token).not.toThrow();
    }
  });
});

describe("neutral (dusk) pill edge in dark mode (issue #46)", () => {
  // The neutral pill's dark fill is dusk-800, the same token as the card it sits on, so only a
  // visible edge keeps its shape in dark mode. 3:1 is the non-text-contrast bar (WCAG 1.4.11).
  const edge = /(?:^|\s)dark:border-(dusk-\d+)(?:\s|$)/.exec(topicStyles.dusk!.pill)?.[1];

  it("carries a dark:border-dusk-N class", () => {
    expect(edge, "dark border token on the dusk pill").toBeDefined();
  });

  it("has an edge of at least 3:1 against the card surface and the page", () => {
    expect(edge).toBeDefined();
    expect(contrast(edge!, "dusk-800"), "card surface").toBeGreaterThanOrEqual(3);
    expect(contrast(edge!, "dusk-BASE"), "page surface").toBeGreaterThanOrEqual(3);
  });
});
