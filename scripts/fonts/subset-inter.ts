// One-off recipe that makes the four committed Inter files in src/assets/fonts/. It is not part
// of any gate: run it when Inter is upgraded, then commit the outputs.
//
//   node scripts/fonts/subset-inter.ts      (needs `uv` and `unzip`)
//
// Reproducibility. A re-run gives byte-identical files (checked twice).
// Release:         https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
// Archive SHA-256: 9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e
// Per face (Regular, Italic, Bold, BoldItalic), from extras/ttf/Inter-<face>.ttf in the archive:
//   uvx --from "fonttools[woff]==4.60.2" pyftsubset Inter-<face>.ttf \
//     --unicodes=U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2192,U+2713,U+2717 \
//     --layout-features=kern --no-hinting --flavor=woff2 --output-file=src/assets/fonts/Inter-<face>.woff2
// Outputs (SHA-256, bytes):
//   Inter-Regular.woff2     ec3ad8fb97298f5a68a0a83836db7d64a67a6d4544af8173f948bbd7a1a7d132  11364
//   Inter-Italic.woff2      3f210da2f9a9849f5882c0f8986e1e24af09de0351daedf1c2b5fa195782e901  12308
//   Inter-Bold.woff2        fde7b48132e4150ee9f4fb70a963badc15d641f6f8601c517bc7d45ee65463ac  11516
//   Inter-BoldItalic.woff2  7dbfe53fac47fe85d3b0da1d45d5a6295cdeafeef50f8a57c360c3045a2f8aeb  12560
//   LICENSE.txt             262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { INTER_UNICODE_RANGE } from "../../src/lib/fonts/charset.ts";

export const INTER_VERSION = "4.1";
export const INTER_ZIP_URL = `https://github.com/rsms/inter/releases/download/v${INTER_VERSION}/Inter-${INTER_VERSION}.zip`;
export const INTER_ZIP_SHA256 = "9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e";
export const FONTTOOLS_SPEC = "fonttools[woff]==4.60.2";
export const FACES = ["Regular", "Italic", "Bold", "BoldItalic"] as const;

/** The `pyftsubset` arguments for one face. */
export function pyftsubsetArgs(_face: string, input: string, output: string): string[] {
  return [
    input,
    `--unicodes=${INTER_UNICODE_RANGE.join(",")}`,
    "--layout-features=kern",
    "--no-hinting",
    "--flavor=woff2",
    `--output-file=${output}`,
  ];
}

async function main(): Promise<void> {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const cache = process.env.INTER_CACHE_DIR ?? `${root}.cache/fonts`;
  const outDir = `${root}src/assets/fonts`;
  mkdirSync(cache, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const zip = `${cache}/Inter-${INTER_VERSION}.zip`;
  if (!existsSync(zip)) {
    const res = await fetch(INTER_ZIP_URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  }
  const sha = createHash("sha256").update(readFileSync(zip)).digest("hex");
  if (sha !== INTER_ZIP_SHA256) throw new Error(`Checksum mismatch: ${sha}`);

  const extracted = `${cache}/inter-${INTER_VERSION}`;
  const members = [...FACES.map((f) => `extras/ttf/Inter-${f}.ttf`), "LICENSE.txt"];
  execFileSync("unzip", ["-o", "-q", zip, ...members, "-d", extracted], { stdio: "inherit" });

  for (const face of FACES) {
    const args = pyftsubsetArgs(face, `${extracted}/extras/ttf/Inter-${face}.ttf`, `${outDir}/Inter-${face}.woff2`);
    try {
      execFileSync("uvx", ["--from", FONTTOOLS_SPEC, "pyftsubset", ...args], { stdio: "inherit" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error("uvx not found. Install uv: brew install uv");
      }
      throw error;
    }
  }
  copyFileSync(`${extracted}/LICENSE.txt`, `${outDir}/LICENSE.txt`);
}

if (import.meta.main) {
  await main();
}
