// Coverage guard for the self-hosted Inter subset (F18, FR-016, SC-008): every character the
// shell, templates and fixture site can draw is in all four committed font files, or is on the
// explicit exclusion list. Reads the real cmaps, not the declared unicode-range, so a wrong subset
// is caught as well as a wrong range. No browser; real content under src/content is not read.
import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { codePointsOf } from "../../../src/lib/fonts/charset.ts";
import { FIXTURE_PAGES, FIXTURE_POSTS, generateFixturePosts } from "../../../scripts/build-fixture-site.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const fontsDir = join(root, "src/assets/fonts");

const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { fontace } = fromAstro("fontace") as {
  fontace: (buffer: Buffer) => { unicodeRangeArray: string[] };
};

type Covered = { family: string; points: Set<number> };

/** Per family, the code points present in all four faces of that family. fontace reports U+FFFF (the cmap end marker); drop it. */
function coveredByFamily(): Covered[] {
  return [
    { family: "Inter", dir: fontsDir },
    { family: "JetBrains Mono", dir: join(fontsDir, "jetbrains-mono") },
  ].map(({ family, dir }) => {
    const files = readdirSync(dir).filter((name) => name.endsWith(".woff2"));
    const sets = files.map((name) => {
      const points = codePointsOf(fontace(readFileSync(join(dir, name))).unicodeRangeArray);
      points.delete(0xffff);
      return { name, points };
    });
    expect(sets).toHaveLength(4);
    const points = new Set([...sets[0]!.points].filter((cp) => sets.every((set) => set.points.has(cp))));
    return { family, points };
  });
}

const EMOJI = /\p{Extended_Pictographic}/u;

/** Characters that are deliberately not drawn by Inter, each with its reason. */
function isExcluded(cp: number, char: string): boolean {
  if (EMOJI.test(char)) return true; // emoji stay on the system emoji fonts
  if (cp === 0xfe0f || cp === 0x200d) return true; // variation selector-16, zero width joiner
  if (cp >= 0x2500 && cp <= 0x257f) return true; // box drawing: system fonts draw it
  if (cp === 0x00ad) return true; // soft hyphen is never drawn as a glyph
  return cp === 0x09 || cp === 0x0a || cp === 0x0d; // whitespace and line breaks
}

/** Every uncovered, non-excluded character in the text, per family, as `U+XXXX <char> <label> (<family>, <file>)`. */
function uncovered(text: string, label: string, covered: Covered[]): string[] {
  const found = new Set<string>();
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    if (isExcluded(cp, char)) continue;
    for (const { family, points } of covered) {
      if (points.has(cp)) continue;
      found.add(`U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${char} ${label} (${family})`);
    }
  }
  return [...found];
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const TEXT_FILE = /\.(astro|ts|tsx|js|mjs|mdx?|css|json|svg)$/;

function sources(): Array<{ label: string; text: string }> {
  const shell = ["src/components", "src/layouts", "src/pages", "src/config", "src/scripts", "src/styles"]
    .flatMap((dir) => filesUnder(join(root, dir)))
    .filter((path) => TEXT_FILE.test(path));
  const fixtures = [
    ...FIXTURE_PAGES.map((name) => join(root, "tests/fixtures/pages", name)),
    ...FIXTURE_POSTS.map((name) => join(root, "tests/fixtures/posts/valid", name)),
    ...readdirSync(join(root, "tests/fixtures/projects"))
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => join(root, "tests/fixtures/projects", name)),
  ];
  return [
    ...[...shell, ...fixtures].map((path) => ({ label: relative(root, path), text: readFileSync(path, "utf-8") })),
    ...generateFixturePosts().map((post) => ({ label: `generated ${post.slug}`, text: post.source })),
  ];
}

describe("font coverage guard", () => {
  it("reports a character outside the four faces (the guard can fail)", () => {
    expect(uncovered("Ā", "self-check", coveredByFamily())).toEqual([
      "U+0100 Ā self-check (Inter)",
      "U+0100 Ā self-check (JetBrains Mono)",
    ]);
  });

  it("reports a character missing from Inter only (self-check, M19)", () => {
    const covered = coveredByFamily();
    const inter = covered.find((c) => c.family === "Inter")!;
    const withoutA = { family: "Inter", points: new Set([...inter.points].filter((cp) => cp !== 0x41)) };
    const result = uncovered("A", "self-check", [withoutA, covered.find((c) => c.family === "JetBrains Mono")!]);
    expect(result).toEqual(["U+0041 A self-check (Inter)"]);
  });

  it("reports a character missing from JetBrains Mono only (self-check, M19)", () => {
    const covered = coveredByFamily();
    const mono = covered.find((c) => c.family === "JetBrains Mono")!;
    const withoutA = { family: "JetBrains Mono", points: new Set([...mono.points].filter((cp) => cp !== 0x41)) };
    const result = uncovered("A", "self-check", [covered.find((c) => c.family === "Inter")!, withoutA]);
    expect(result).toEqual(["U+0041 A self-check (JetBrains Mono)"]);
  });

  it("does not report excluded characters", () => {
    expect(uncovered("─ \u{1F600} ­\n", "self-check", coveredByFamily())).toEqual([]);
  });

  it("covers every character in the shell, templates and fixture site in both families (F18, F19)", () => {
    const covered = coveredByFamily();
    const missing = sources().flatMap(({ label, text }) => uncovered(text, label, covered));
    expect(missing).toEqual([]);
  });
});
