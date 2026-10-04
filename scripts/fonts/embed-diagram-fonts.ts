// Hand-run script: embed the Inter glyphs a diagram uses into the SVG itself
// (specs/020-inter-diagram-social-text, contracts/scripts.md S01 to S08). Not part of the build,
// CI or any test; tests import the exported pure functions only.
//
//   pnpm run fonts:diagrams [-- <file.svg> ...]     (needs `uv`: brew install uv)
//
// Edit a label, then re-run this for the file. With no arguments it covers every .svg under
// src/content/ that contains <text.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { diagramProblems, labelText, withFontBlock } from "./diagram-fonts.ts";
import { FONTTOOLS_SPEC } from "./subset-inter.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const fontsDir = join(root, "src/assets/fonts");
const contentDir = join(root, "src/content");

/** The `pyftsubset` arguments for one face and one diagram's label characters. */
export function diagramSubsetArgs(_face: string, input: string, textFile: string, output: string): string[] {
  return [
    input,
    `--text-file=${textFile}`,
    "--layout-features=kern",
    "--no-hinting",
    "--name-IDs=0,1,2,3,4,5,6",
    "--flavor=woff2",
    `--output-file=${output}`,
  ];
}

function svgFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? svgFilesUnder(path) : path.endsWith(".svg") ? [path] : [];
  });
}

function subset(face: "Regular" | "Bold", textFile: string, work: string): string {
  const output = join(work, `${face}.woff2`);
  const args = diagramSubsetArgs(face, join(fontsDir, `Inter-${face}.woff2`), textFile, output);
  try {
    execFileSync("uvx", ["--from", FONTTOOLS_SPEC, "pyftsubset", ...args], { stdio: ["ignore", "inherit", "inherit"] });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("uvx not found. Install uv: brew install uv");
    throw error;
  }
  return readFileSync(output).toString("base64");
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const files = args.length
    ? args.map((arg) => resolve(arg))
    : svgFilesUnder(contentDir).filter((path) => readFileSync(path, "utf-8").includes("<text"));
  for (const file of files) {
    if (relative(contentDir, file).startsWith("..") || !readFileSync(file, "utf-8").includes("<text")) {
      throw new Error(`${relative(root, file)}: not a diagram under src/content/ with <text> labels`);
    }
  }

  const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
  const { fontace } = fromAstro("fontace") as {
    fontace: (buffer: Buffer) => { weight: string; unicodeRangeArray: string[] };
  };

  const work = mkdtempSync(join(tmpdir(), "diagram-fonts-"));
  let failed = false;
  try {
    for (const file of files) {
      const rel = relative(root, file);
      const before = readFileSync(file, "utf-8");
      const textFile = join(work, "labels.txt");
      writeFileSync(textFile, [...new Set(labelText(before).join("") + " ")].join(""), "utf-8");
      const after = withFontBlock(before, subset("Regular", textFile, work), subset("Bold", textFile, work));
      const problems = diagramProblems(after, rel, fontace);
      if (problems.length) {
        failed = true;
        console.error(problems.join("\n"));
        continue;
      }
      writeFileSync(file, after, "utf-8");
      console.log(`${rel}: ${Buffer.byteLength(before)} -> ${Buffer.byteLength(after)} bytes`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  if (failed) process.exitCode = 1;
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}
