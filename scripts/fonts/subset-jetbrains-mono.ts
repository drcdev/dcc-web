// One-off recipe that makes the four committed JetBrains Mono files in
// src/assets/fonts/jetbrains-mono/. It is not part of any gate: run it when JetBrains Mono is
// upgraded, then commit the outputs. Mirrors scripts/fonts/subset-inter.ts.
//
//   node scripts/fonts/subset-jetbrains-mono.ts      (needs `uv` and `unzip`)
//
// Reproducibility. A re-run gives byte-identical files (checked).
// Release:         https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip
// Archive SHA-256: 6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf
// Per face (Regular, Italic, Bold, BoldItalic), from fonts/ttf/JetBrainsMono-<face>.ttf:
//   uvx --from "fonttools[woff]==4.60.2" pyftsubset JetBrainsMono-<face>.ttf \
//     --unicodes=U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2192,U+2713,U+2717 \
//     --layout-features= --no-hinting --flavor=woff2 \
//     --output-file=src/assets/fonts/jetbrains-mono/JetBrainsMono-<face>.woff2
// Outputs (SHA-256, bytes; total 31,656):
//   JetBrainsMono-Regular.woff2     c7db62fa593d7a626f8eb77646a6f0944c01e3ba586ac3ceca55e8b36888bd18  7460
//   JetBrainsMono-Italic.woff2      3e6abb338d565e42430dc0d7612f261eb92d62b89a1f77c021cc9e7daa5d9dc0  8256
//   JetBrainsMono-Bold.woff2        504d5a6ee14ff269ca94e8c5d2b661c92a6cd3290c11735c7099fd5a71bc83c0  7544
//   JetBrainsMono-BoldItalic.woff2  62e2d56f1471aa78550024fc0432303c351d9c4141ba7a5331b267c8c2015fdf  8396
//   OFL.txt                         30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad  (unmodified from the release)
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { INTER_UNICODE_RANGE } from "../../src/lib/fonts/charset.ts";

export const JBM_VERSION = "2.304";
export const JBM_ZIP_URL = `https://github.com/JetBrains/JetBrainsMono/releases/download/v${JBM_VERSION}/JetBrainsMono-${JBM_VERSION}.zip`;
export const JBM_ZIP_SHA256 = "6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf";
export const FONTTOOLS_SPEC = "fonttools[woff]==4.60.2";
export const FACES = ["Regular", "Italic", "Bold", "BoldItalic"] as const;

/**
 * The `pyftsubset` arguments for one face. `--layout-features=` is empty on purpose: the
 * programming ligatures live in `calt`, so with no features none can be shipped or switched on.
 */
export function pyftsubsetArgs(_face: string, input: string, output: string): string[] {
  return [
    input,
    `--unicodes=${INTER_UNICODE_RANGE.join(",")}`,
    "--layout-features=",
    "--no-hinting",
    "--flavor=woff2",
    `--output-file=${output}`,
  ];
}

async function main(): Promise<void> {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const cache = process.env.JBM_CACHE_DIR ?? `${root}.cache/fonts`;
  const outDir = `${root}src/assets/fonts/jetbrains-mono`;
  mkdirSync(cache, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const zip = `${cache}/JetBrainsMono-${JBM_VERSION}.zip`;
  if (!existsSync(zip)) {
    const res = await fetch(JBM_ZIP_URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  }
  const sha = createHash("sha256").update(readFileSync(zip)).digest("hex");
  if (sha !== JBM_ZIP_SHA256) throw new Error(`Checksum mismatch: ${sha}`);

  const extracted = `${cache}/jetbrains-mono-${JBM_VERSION}`;
  const members = [...FACES.map((f) => `fonts/ttf/JetBrainsMono-${f}.ttf`), "OFL.txt"];
  execFileSync("unzip", ["-o", "-q", zip, ...members, "-d", extracted], { stdio: "inherit" });

  for (const face of FACES) {
    const args = pyftsubsetArgs(
      face,
      `${extracted}/fonts/ttf/JetBrainsMono-${face}.ttf`,
      `${outDir}/JetBrainsMono-${face}.woff2`,
    );
    try {
      execFileSync("uvx", ["--from", FONTTOOLS_SPEC, "pyftsubset", ...args], { stdio: "inherit" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error("uvx not found. Install uv: brew install uv");
      }
      throw error;
    }
  }
  copyFileSync(`${extracted}/OFL.txt`, `${outDir}/OFL.txt`);
}

if (import.meta.main) {
  await main();
}
