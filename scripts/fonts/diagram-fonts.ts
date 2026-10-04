// Pure rules for Inter inside diagram SVGs (specs/020-inter-diagram-social-text, contracts/
// diagram-svg.md D01 to D08 and contracts/scripts.md). No side effects: the gate test and the
// hand-run embed script both import this. The face reader (fontace) is injected by the caller.
import { codePointsOf } from "../../src/lib/fonts/charset.ts";

export const DIAGRAM_FONT_FAMILY = "Inter, sans-serif";
export const DIAGRAM_MAX_BYTES = 16 * 1024;

type Face = { weight: string; unicodeRangeArray: string[] };
type ReadFace = (buffer: Buffer) => Face;

const LICENCE_COMMENT =
  "<!-- Inter 4.1, Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter). " +
  "Glyph subset licensed under the SIL Open Font License 1.1: https://openfontlicense.org " +
  "(full text in src/assets/fonts/LICENSE.txt). " +
  "Written by scripts/fonts/embed-diagram-fonts.ts: edit a label, then re-run it. -->";

const BLOCK_PATTERN = /\s*<!--(?:(?!-->)[\s\S])*-->\s*<style data-inter-subset="">[\s\S]*?<\/style>/;
const FACE_PATTERN = /@font-face\s*\{([^}]*)\}/g;

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Decoded character data of each `<text>` element (its `<tspan>` text included). */
export function labelText(svg: string): string[] {
  const labels: string[] = [];
  for (const match of svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
    labels.push(decodeEntities(match[1]!.replace(/<[^>]*>/g, "")));
  }
  return labels;
}

/** The licence comment plus the `<style data-inter-subset="">` element with both faces. */
export function fontBlock(regularB64: string, boldB64: string): string {
  const face = (weight: number, base64: string) =>
    `@font-face{font-family:Inter;font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${base64}) format("woff2")}`;
  return `${LICENCE_COMMENT}\n  <style data-inter-subset="">${face(400, regularB64)}${face(700, boldB64)}</style>`;
}

/** Insert the font block directly after the root start tag, or replace the existing one. */
export function withFontBlock(svg: string, regularB64: string, boldB64: string): string {
  const stripped = svg.replace(BLOCK_PATTERN, "");
  const root = /<svg\b[^>]*>/.exec(stripped);
  if (!root) throw new Error("No root <svg> element found");
  const end = root.index + root[0].length;
  return `${stripped.slice(0, end)}\n  ${fontBlock(regularB64, boldB64)}${stripped.slice(end)}`;
}

/** The `@font-face` rules inside the font block, in order. */
export function embeddedFaces(svg: string): { weight: string; base64: string }[] {
  const style = /<style data-inter-subset="">([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? "";
  const faces: { weight: string; base64: string }[] = [];
  for (const match of style.matchAll(FACE_PATTERN)) {
    const body = match[1]!;
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const base64 = /url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/.exec(body)?.[1];
    if (weight && base64) faces.push({ weight, base64 });
  }
  return faces;
}

/** Every D01 to D08 message for one diagram; empty when it passes. */
export function diagramProblems(svg: string, file: string, readFace: ReadFace): string[] {
  const problems: string[] = [];
  const hint = `run pnpm run fonts:diagrams -- ${file}`;

  const rootTag = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
  const rootFamily = /\sfont-family="([^"]*)"/.exec(rootTag)?.[1];
  if (rootFamily !== DIAGRAM_FONT_FAMILY) {
    problems.push(
      `${file}: the root <svg> must set font-family="${DIAGRAM_FONT_FAMILY}" (found ${rootFamily === undefined ? "none" : `"${rootFamily}"`})`,
    );
  }

  // The font block is checked on its own; the rest of the file is the editor's.
  const rest = svg.replace(BLOCK_PATTERN, "").replace(rootTag, "");
  const body = rest.replace(/<!--[\s\S]*?-->/g, "");
  for (const match of body.matchAll(/<([a-zA-Z][\w:-]*)\b[^>]*?\sfont-family="([^"]*)"/g)) {
    problems.push(`${file}: text asks for a font other than Inter (<${match[1]}> font-family="${match[2]}")`);
  }
  for (const match of body.matchAll(/<([a-zA-Z][\w:-]*)\b[^>]*?\sstyle="[^"]*"/g)) {
    problems.push(`${file}: text asks for a font other than Inter (<${match[1]}> has a style attribute)`);
  }
  if (/<style\b(?![^>]*data-inter-subset)/.test(body)) {
    problems.push(`${file}: text asks for a font other than Inter (an extra <style> element)`);
  }

  for (const match of body.matchAll(/\sfont-weight="([^"]*)"/g)) {
    if (match[1] !== "400" && match[1] !== "700") problems.push(`${file}: font-weight ${match[1]} has no embedded Inter face`);
  }
  if (/\sfont-style="/.test(body)) problems.push(`${file}: font-style has no embedded Inter face`);

  const styles = [...svg.matchAll(/<style data-inter-subset="">([\s\S]*?)<\/style>/g)];
  const malformed = `${file}: the embedded Inter block is missing or malformed; ${hint}`;
  const faces = embeddedFaces(svg);
  let validFaces: { weight: string; cmap: Set<number> }[] = [];
  if (styles.length !== 1 || (styles[0]![1]!.match(/@font-face/g) ?? []).length !== 2 || faces.length !== 2) {
    problems.push(malformed);
  } else {
    const css = styles[0]![1]!;
    const ruleOk = [...css.matchAll(FACE_PATTERN)].every(
      (m) => /font-family:\s*Inter\b/.test(m[1]!) && /font-style:\s*normal/.test(m[1]!),
    );
    try {
      const read = faces.map((face) => ({ ...face, parsed: readFace(Buffer.from(face.base64, "base64")) }));
      const weightsOk =
        faces[0]!.weight === "400" && faces[1]!.weight === "700" && read.every((f) => String(f.parsed.weight) === f.weight);
      if (!ruleOk || !weightsOk) problems.push(malformed);
      else validFaces = read.map((f) => ({ weight: f.weight, cmap: codePointsOf(f.parsed.unicodeRangeArray) }));
    } catch {
      problems.push(malformed);
    }
  }

  const bytes = Buffer.byteLength(svg);
  if (bytes > DIAGRAM_MAX_BYTES) problems.push(`${file}: ${bytes} bytes is over the 16 KB diagram limit`);

  const notice = /<!--((?:(?!-->)[\s\S])*)-->\s*<style data-inter-subset="">/.exec(svg)?.[1] ?? "";
  const phrases = [
    "Inter 4.1",
    "The Inter Project Authors",
    "SIL Open Font License 1.1",
    "https://openfontlicense.org",
    "src/assets/fonts/LICENSE.txt",
  ];
  if (!phrases.every((phrase) => notice.includes(phrase))) problems.push(`${file}: the Inter licence notice is missing`);

  for (const match of svg.matchAll(/url\(\s*['"]?([^'")]*)/g)) {
    const target = match[1]!;
    if (!target.startsWith("#") && !target.startsWith("data:")) {
      problems.push(`${file}: references another file (${target}); diagrams must be self-contained`);
    }
  }
  for (const match of svg.matchAll(/\s(?:xlink:)?href="([^"]*)"/g)) {
    if (!match[1]!.startsWith("#")) problems.push(`${file}: references another file (${match[1]}); diagrams must be self-contained`);
  }

  const names: Record<string, string> = { "400": "Regular", "700": "Bold" };
  const chars = new Set(labelText(svg).join(""));
  for (const face of validFaces) {
    for (const char of chars) {
      const cp = char.codePointAt(0)!;
      if (cp === 0x20 || cp === 0x0a || cp === 0x0d || cp === 0x09 || face.cmap.has(cp)) continue;
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      problems.push(`${file}: U+${hex} ${char} is not in the embedded Inter ${names[face.weight]} glyphs; ${hint}`);
    }
  }
  return problems;
}
