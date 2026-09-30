// FR-013: the blog prototypes use only the site's existing palettes and system
// font stack. Scans src/pages/design/blog/ for colour literals and font
// declarations. Sample SVG illustrations cannot use Tailwind classes (they
// load as images), so a hex colour is allowed only when it is one of the
// palette base colours declared in src/styles/global.css. Prototype-only:
// deleted with the prototypes.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { directions } from "../../../src/pages/design/blog/_data/samples.ts";

const ROOT = new URL("../../../src/pages/design/blog/", import.meta.url).pathname;
const GLOBAL_CSS = new URL("../../../src/styles/global.css", import.meta.url).pathname;
const TEXT_FILE = /\.(astro|ts|svg|css|md|mdx)$/;

const paletteHexes = new Set(
  [...readFileSync(GLOBAL_CSS, "utf-8").matchAll(/--color-[a-z]+-BASE:\s*(#[0-9a-fA-F]{6})/g)].map((m) =>
    m[1]!.toLowerCase(),
  ),
);

/** Returns each offending fragment: colour literals outside the palette, @font-face and font-family. */
export function findNewTokens(source: string, allowed: ReadonlySet<string> = paletteHexes): string[] {
  const hexes = (source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).filter((hex) => !allowed.has(hex.toLowerCase()));
  const others = [
    /\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/g,
    /@font-face/g,
    /font-family\s*:/g,
    /font-family=/g,
  ].flatMap((pattern) => source.match(pattern) ?? []);
  return [...hexes, ...others];
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("blog prototypes add no colours or fonts", () => {
  it("reads the palette base colours from global.css", () => {
    expect(paletteHexes.has("#d68844")).toBe(true);
    expect(paletteHexes.size).toBeGreaterThanOrEqual(7);
  });

  it("flags a known-bad fixture", () => {
    const bad = `<p style="color:#ff00aa">hi</p><style>@font-face{font-family: Foo}</style> rgb(1,2,3)`;
    expect(findNewTokens(bad).length).toBeGreaterThanOrEqual(4);
    expect(findNewTokens(`<p class="text-rust-500 dark:text-sage-200" data-x="#d68844">fine</p>`)).toEqual([]);
  });

  it("finds none in the prototype files", () => {
    const offences: string[] = [];
    for (const file of walk(ROOT).filter((f) => TEXT_FILE.test(f))) {
      for (const hit of findNewTokens(readFileSync(file, "utf-8"))) offences.push(`${file.slice(ROOT.length)}: ${hit}`);
    }
    expect(offences).toEqual([]);
  });

  it("declares no new colours or fonts for any direction", () => {
    for (const direction of directions) expect(direction.newColoursOrFonts).toEqual([]);
  });
});
