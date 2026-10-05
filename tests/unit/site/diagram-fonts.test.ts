// Inter in diagram SVGs (specs/020-inter-diagram-social-text; contracts/diagram-svg.md D01 to D08,
// D10; contracts/scripts.md S03, S04). Unit layer: these are static file rules and pure functions,
// so no browser is needed (D11 and D12 live in tests/e2e/diagram-fonts.spec.ts). Every diagram
// under src/content/ that draws text must set Inter at the root, embed the two faces it uses, and
// carry the licence notice; the gate fails naming the file and the fix when it does not.
//
// The two modules under test are loaded with a dynamic import so this file type-checks before the
// modules exist (they arrive in a later phase) and so a missing module fails the tests that need
// it, not the whole run.
import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { codePointsOf } from "../../../src/lib/fonts/charset.ts";
import { filesUnder } from "../../helpers/files.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const fontsDir = join(root, "src/assets/fonts");

const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { fontace } = fromAstro("fontace") as { fontace: (buffer: Buffer) => Face };

type Face = { weight: string; unicodeRangeArray: string[] };
type ReadFace = (buffer: Buffer) => Face;
type DiagramFonts = {
  DIAGRAM_FONT_FAMILY: string;
  DIAGRAM_MAX_BYTES: number;
  labelText: (svg: string) => string[];
  fontBlock: (regularB64: string, boldB64: string) => string;
  withFontBlock: (svg: string, regularB64: string, boldB64: string) => string;
  embeddedFaces: (svg: string) => { weight: string; base64: string }[];
  diagramProblems: (svg: string, file: string, readFace: ReadFace) => string[];
};
type EmbedScript = {
  diagramSubsetArgs: (face: string, input: string, textFile: string, output: string) => string[];
};

const diagramFontsPath = join(root, "scripts/fonts/diagram-fonts.ts");
const embedScriptPath = join(root, "scripts/fonts/embed-diagram-fonts.ts");
const loadDiagramFonts = () => import(/* @vite-ignore */ diagramFontsPath) as Promise<DiagramFonts>;
const loadEmbedScript = () => import(/* @vite-ignore */ embedScriptPath) as Promise<EmbedScript>;

/** Every .svg under src/content/ that draws text, found by globbing, never by name. */
const diagramFiles = filesUnder(join(root, "src/content"))
  .filter((path) => path.endsWith(".svg") && readFileSync(path, "utf-8").includes("<text"))
  .map((path) => relative(root, path));

const regularB64 = readFileSync(join(fontsDir, "Inter-Regular.woff2")).toString("base64");
const boldB64 = readFileSync(join(fontsDir, "Inter-Bold.woff2")).toString("base64");

describe("diagram files", () => {
  it("finds the published diagrams and the template starter", () => {
    expect(diagramFiles.length).toBeGreaterThanOrEqual(2);
    expect(diagramFiles.some((file) => file.includes("/template/"))).toBe(true);
  });

  // D01 to D04, D06 to D08 come from diagramProblems(); each file is its own case so a failure
  // names the file in the test title as well as in the message.
  for (const file of diagramFiles) {
    it(`D01-D04, D06-D08: ${file} sets Inter, embeds both faces, carries the licence, is self-contained and small`, async () => {
      const { diagramProblems } = await loadDiagramFonts();
      const svg = readFileSync(join(root, file), "utf-8");
      const problems = diagramProblems(svg, file, fontace).filter((message) => !message.includes(" is not in the embedded Inter "));
      expect(problems).toEqual([]);
    });
  }

  // D05 is its own case: a label character missing from an embedded face is the failure an editor
  // most often causes. If fontace omits the weight for a WOFF2 file (plan "Risks"), the weight is
  // read from the @font-face rule order (400 then 700), which embeddedFaces() returns.
  for (const file of diagramFiles) {
    it(`D05: every label character in ${file} is in both embedded faces`, async () => {
      const { labelText, embeddedFaces } = await loadDiagramFonts();
      const svg = readFileSync(join(root, file), "utf-8");
      const faces = embeddedFaces(svg);
      expect(faces.map((face) => face.weight), `${file}: embedded weights`).toEqual(["400", "700"]);
      const names: Record<string, string> = { "400": "Regular", "700": "Bold" };
      const missing: string[] = [];
      for (const face of faces) {
        const cmap = codePointsOf(fontace(Buffer.from(face.base64, "base64")).unicodeRangeArray);
        for (const char of new Set(labelText(svg).join(""))) {
          const cp = char.codePointAt(0)!;
          if (cp === 0x20 || cp === 0x0a || cp === 0x0d || cp === 0x09 || cmap.has(cp)) continue;
          const hex = cp.toString(16).toUpperCase().padStart(4, "0");
          missing.push(
            `${file}: U+${hex} ${char} is not in the embedded Inter ${names[face.weight]} glyphs; run pnpm run fonts:diagrams -- ${file}`,
          );
        }
      }
      expect(missing).toEqual([]);
    });
  }
});

describe("guard self-check", () => {
  // D10: the gate can fail. The block is built from the committed full faces so no uvx is needed.
  const file = "src/content/example/diagram.svg";
  const wrap = (rootAttrs: string, body: string, block = true) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100" role="img" aria-label="x"${rootAttrs}>` +
    "\n" +
    (block ? "BLOCK\n" : "") +
    body +
    "</svg>\n";

  async function build(rootAttrs: string, body: string, block = true) {
    const mod = await loadDiagramFonts();
    return wrap(rootAttrs, body, block).replace("BLOCK", mod.fontBlock(regularB64, boldB64));
  }

  it("D10: a clean file has no message other than the size of full faces", async () => {
    const { diagramProblems } = await loadDiagramFonts();
    const svg = await build(' font-family="Inter, sans-serif"', '<text x="10" y="50">Hello</text>');
    const problems = diagramProblems(svg, file, fontace).filter((m) => !m.includes("over the 16 KB diagram limit"));
    expect(problems).toEqual([]);
  });

  it("D10 D01: a system font at the root is reported with the file path", async () => {
    const { diagramProblems } = await loadDiagramFonts();
    const svg = await build(' font-family="system-ui"', '<text x="10" y="50">Hello</text>');
    const problems = diagramProblems(svg, file, fontace);
    expect(problems.some((m) => m.startsWith(file) && m.includes('must set font-family="Inter, sans-serif"'))).toBe(true);
  });

  it("D10 D02: another font-family on a group is reported", async () => {
    const { diagramProblems } = await loadDiagramFonts();
    const svg = await build(' font-family="Inter, sans-serif"', '<g font-family="Georgia"><text x="10" y="50">Hi</text></g>');
    expect(diagramProblems(svg, file, fontace).some((m) => m.startsWith(file) && m.includes("a font other than Inter"))).toBe(true);
  });

  it("D10 D05: a label character missing from the faces names the character and the fix", async () => {
    const { diagramProblems } = await loadDiagramFonts();
    const svg = await build(' font-family="Inter, sans-serif"', '<text x="10" y="50">漢</text>');
    const problems = diagramProblems(svg, file, fontace);
    expect(problems).toContain(
      `${file}: U+6F22 漢 is not in the embedded Inter Regular glyphs; run pnpm run fonts:diagrams -- ${file}`,
    );
  });

  it("D10 D04: a file with no embedded block is reported", async () => {
    const { diagramProblems } = await loadDiagramFonts();
    const svg = await build(' font-family="Inter, sans-serif"', '<text x="10" y="50">Hello</text>', false);
    expect(diagramProblems(svg, file, fontace).some((m) => m.startsWith(file) && m.includes("embedded Inter block is missing or malformed"))).toBe(true);
  });

  it("D10 D06: an over-size file is reported with its byte count", async () => {
    const { diagramProblems, DIAGRAM_MAX_BYTES } = await loadDiagramFonts();
    expect(DIAGRAM_MAX_BYTES).toBe(16 * 1024);
    const padding = `<!-- ${"x".repeat(DIAGRAM_MAX_BYTES)} -->`;
    const svg = await build(' font-family="Inter, sans-serif"', `${padding}<text x="10" y="50">Hello</text>`);
    expect(diagramProblems(svg, file, fontace).some((m) => m.startsWith(file) && /\d+ bytes is over the 16 KB diagram limit/.test(m))).toBe(true);
  });

  it("D10 D08: an external reference is reported", async () => {
    const { diagramProblems } = await loadDiagramFonts();
    const svg = await build(' font-family="Inter, sans-serif"', '<image href="https://example.com/a.png"/><text x="1" y="1">a</text>');
    expect(diagramProblems(svg, file, fontace).some((m) => m.startsWith(file) && m.includes("diagrams must be self-contained"))).toBe(true);
  });
});

describe("font block", () => {
  // S04: the script owns the block; every other byte is the editor's.
  const rootTag = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" role="img" aria-label="x" font-family="Inter, sans-serif">';
  const rest = '<defs/><g><text x="1" y="2">A &amp; B</text></g></svg>\n';
  const squash = (s: string) => s.replace(/\s+/g, "");

  it("S04: inserts the block directly after the root start tag", async () => {
    const { withFontBlock, fontBlock } = await loadDiagramFonts();
    const out = withFontBlock(rootTag + rest, "AAAA", "BBBB");
    const block = fontBlock("AAAA", "BBBB");
    expect(out.startsWith(rootTag)).toBe(true);
    expect(out.slice(rootTag.length).trimStart().startsWith(block)).toBe(true);
    expect(squash(out.replace(block, ""))).toBe(squash(rootTag + rest));
  });

  it("S04: replaces an existing block and leaves every other byte unchanged", async () => {
    const { withFontBlock } = await loadDiagramFonts();
    const once = withFontBlock(rootTag + rest, "AAAA", "BBBB");
    const twice = withFontBlock(once, "CCCC", "DDDD");
    expect(twice.match(/data-inter-subset/g)).toHaveLength(1);
    expect(twice).not.toContain("AAAA");
    expect(twice).toContain("CCCC");
    expect(twice.endsWith(rest)).toBe(true);
    expect(withFontBlock(twice, "CCCC", "DDDD")).toBe(twice);
  });

  it("S04: the block holds the licence notice and two @font-face rules", async () => {
    const { fontBlock } = await loadDiagramFonts();
    const block = fontBlock("AAAA", "BBBB");
    for (const phrase of ["Inter 4.1", "The Inter Project Authors", "SIL Open Font License 1.1", "https://openfontlicense.org", "src/assets/fonts/LICENSE.txt"]) {
      expect(block, phrase).toContain(phrase);
    }
    expect(block.match(/@font-face/g)).toHaveLength(2);
  });

  it("S04: labelText decodes entities and reads tspan text", async () => {
    const { labelText } = await loadDiagramFonts();
    const labels = labelText('<svg><text x="1">A &amp; B</text><text><tspan>one</tspan><tspan>two &lt;3</tspan></text></svg>');
    expect(labels.some((l) => l.includes("A & B"))).toBe(true);
    expect(labels.some((l) => l.includes("one"))).toBe(true);
    expect(labels.some((l) => l.includes("two <3"))).toBe(true);
  });

  it("S04: the family constant is the root value the guard demands", async () => {
    const { DIAGRAM_FONT_FAMILY } = await loadDiagramFonts();
    expect(DIAGRAM_FONT_FAMILY).toBe("Inter, sans-serif");
  });
});

describe("embed script", () => {
  // S03: tests import exports only; uvx runs only under import.meta.main.
  it("S03: diagramSubsetArgs uses the committed WOFF2 inputs and the agreed pyftsubset flags", async () => {
    const { diagramSubsetArgs } = await loadEmbedScript();
    const input = join(fontsDir, "Inter-Regular.woff2");
    const args = diagramSubsetArgs("Regular", input, "/tmp/labels.txt", "/tmp/out.woff2");
    expect(args[0]).toBe(input);
    for (const flag of [
      "--text-file=/tmp/labels.txt",
      "--layout-features=kern",
      "--no-hinting",
      "--name-IDs=0,1,2,3,4,5,6",
      "--flavor=woff2",
      "--output-file=/tmp/out.woff2",
    ]) {
      expect(args, flag).toContain(flag);
    }
  });

  it("S03: the script takes the fonttools pin from subset-inter.ts, not a second literal", () => {
    const source = readFileSync(join(root, "scripts/fonts/embed-diagram-fonts.ts"), "utf-8");
    expect(source).toContain("FONTTOOLS_SPEC");
    expect(source).not.toMatch(/fonttools\[woff\]==/);
  });
});
