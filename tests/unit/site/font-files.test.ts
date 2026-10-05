// Self-hosted Inter: the shipped character set, the subset recipe and the committed font files
// (contract rows F09 source side, F19, F20; FR-002, FR-004, FR-005, FR-013). Layer: unit. The
// charset and recipe are constants and pure functions; the font files are static inputs read
// from disk, so no browser or build is needed.
import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  INTER_UNICODE_RANGE,
  MONO_FALLBACK_STACK,
  NOT_IN_INTER,
  SYSTEM_FONT_STACK,
  codePointsOf,
} from "../../../src/lib/fonts/charset.ts";
import {
  FACES,
  FONTTOOLS_SPEC,
  INTER_VERSION,
  INTER_ZIP_SHA256,
  INTER_ZIP_URL,
  pyftsubsetArgs,
} from "../../../scripts/fonts/subset-inter.ts";
import {
  FACES as MONO_FACES,
  FONTTOOLS_SPEC as MONO_FONTTOOLS_SPEC,
  JBM_VERSION,
  JBM_ZIP_SHA256,
  JBM_ZIP_URL,
  pyftsubsetArgs as monoPyftsubsetArgs,
} from "../../../scripts/fonts/subset-jetbrains-mono.ts";
import { createHash } from "node:crypto";
import { filesUnder } from "../../helpers/files.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const fontsDir = `${root}src/assets/fonts/`;

// fontace is Astro's own font reader; it is resolved through Astro's package, so there is no new
// dependency (the same way tests/helpers/content.ts loads Astro's front matter parser).
const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { fontace } = fromAstro("fontace") as {
  fontace: (buffer: Buffer) => {
    family: string;
    style: string;
    weight: string;
    unicodeRangeArray: string[];
  };
};

describe("charset", () => {
  it("lists the tokens of the shipped set", () => {
    expect([...INTER_UNICODE_RANGE]).toEqual([
      "U+0020-007E",
      "U+00A0-00FF",
      "U+2013",
      "U+2014",
      "U+2018",
      "U+2019",
      "U+201C",
      "U+201D",
      "U+2022",
      "U+2026",
      "U+2192",
      "U+2713",
      "U+2717",
    ]);
  });

  it("expands tokens to 202 code points", () => {
    const set = codePointsOf(INTER_UNICODE_RANGE);
    expect(set.size).toBe(202);
    expect(set.has(0x20)).toBe(true);
    expect(set.has(0x7e)).toBe(true);
    expect(set.has(0x7f)).toBe(false);
    expect(set.has(0xff)).toBe(true);
    expect(set.has(0x100)).toBe(false);
    expect(set.has(0x2713)).toBe(true);
  });

  it("expands single code points and ranges", () => {
    expect([...codePointsOf(["U+41", "U+43-45"])].sort()).toEqual([0x41, 0x43, 0x44, 0x45]);
  });

  it("sets only the soft hyphen aside as not in Inter", () => {
    expect([...NOT_IN_INTER]).toEqual([0x00ad]);
    expect(codePointsOf(INTER_UNICODE_RANGE).has(0x00ad)).toBe(true);
  });

  it("keeps today's system families with the generic sans-serif last", () => {
    expect([...SYSTEM_FONT_STACK]).toEqual([
      "ui-sans-serif",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "sans-serif",
    ]);
  });
});

describe("subset recipe", () => {
  it("pins the Inter 4.1 release URL and SHA-256 (F20)", () => {
    expect(INTER_VERSION).toBe("4.1");
    expect(INTER_ZIP_URL).toBe(
      "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip",
    );
    expect(INTER_ZIP_SHA256).toBe(
      "9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e",
    );
  });

  it("pins fonttools 4.60.2 with the woff extra", () => {
    expect(FONTTOOLS_SPEC).toBe("fonttools[woff]==4.60.2");
  });

  it("covers the four faces", () => {
    expect([...FACES]).toEqual(["Regular", "Italic", "Bold", "BoldItalic"]);
  });

  it("builds the pyftsubset arguments from the shared charset", () => {
    expect(pyftsubsetArgs("Regular", "in.ttf", "out.woff2")).toEqual([
      "in.ttf",
      `--unicodes=${INTER_UNICODE_RANGE.join(",")}`,
      "--layout-features=kern",
      "--no-hinting",
      "--flavor=woff2",
      "--output-file=out.woff2",
    ]);
  });
});

describe("committed font files", () => {
  const files: Record<string, { weight: string; style: string }> = {
    "Inter-Regular.woff2": { weight: "400", style: "normal" },
    "Inter-Italic.woff2": { weight: "400", style: "italic" },
    "Inter-Bold.woff2": { weight: "700", style: "normal" },
    "Inter-BoldItalic.woff2": { weight: "700", style: "italic" },
  };
  const shipped = [...codePointsOf(INTER_UNICODE_RANGE)]
    .filter((cp) => !NOT_IN_INTER.includes(cp))
    .sort((a, b) => a - b);

  it.each(Object.entries(files))("%s is Inter with the right weight and style", (name, want) => {
    const meta = fontace(readFileSync(fontsDir + name));
    expect(meta.family).toBe("Inter");
    expect(meta.weight).toBe(want.weight);
    expect(meta.style).toBe(want.style);
  });

  it.each(Object.keys(files))("%s has a cmap equal to the shipped set minus U+00AD", (name) => {
    const meta = fontace(readFileSync(fontsDir + name));
    // fontace reports U+FFFF, the end marker of a format 4 cmap subtable, as a covered code point.
    // fontTools confirms the real cmap holds the 201 shipped code points and not U+FFFF.
    const cmap = [...codePointsOf(meta.unicodeRangeArray)]
      .filter((cp) => cp !== 0xffff)
      .sort((a, b) => a - b);
    expect(cmap).toEqual(shipped);
  });

  it("holds exactly the four woff2 files and the licence", () => {
    expect(readdirSync(fontsDir).sort()).toEqual(
      ["LICENSE.txt", "jetbrains-mono", ...Object.keys(files)].sort(),
    );
  });

  it("totals at most 50,000 bytes", () => {
    const total = Object.keys(files).reduce((sum, name) => sum + statSync(fontsDir + name).size, 0);
    expect(total).toBeLessThanOrEqual(50_000);
  });

  it("ships the SIL Open Font License 1.1", () => {
    const text = readFileSync(`${fontsDir}LICENSE.txt`, "utf-8");
    expect(text).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(text).toContain("Inter");
  });

  it("keeps fonts out of public/", () => {
    const publicDir = `${root}public`;
    expect(existsSync(publicDir)).toBe(true);
    expect(filesUnder(publicDir).filter((f) => /\.(woff2?|ttf|otf|eot)$/i.test(f))).toEqual([]);
  });
});

describe("mono charset", () => {
  it("is Tailwind's default mono families with the generic monospace last (FR-006, M03)", () => {
    expect([...MONO_FALLBACK_STACK]).toEqual([
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "Monaco",
      "Consolas",
      "Liberation Mono",
      "Courier New",
      "monospace",
    ]);
  });

  it("leaves the shipped Inter range unchanged", () => {
    expect(INTER_UNICODE_RANGE).toHaveLength(13);
    expect(codePointsOf(INTER_UNICODE_RANGE).size).toBe(202);
  });
});

describe("mono subset recipe", () => {
  it("pins the JetBrains Mono 2.304 release URL and SHA-256 (M11)", () => {
    expect(JBM_VERSION).toBe("2.304");
    expect(JBM_ZIP_URL).toBe(
      "https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip",
    );
    expect(JBM_ZIP_SHA256).toBe("6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf");
  });

  it("pins fonttools 4.60.2 with the woff extra and the four faces", () => {
    expect(MONO_FONTTOOLS_SPEC).toBe("fonttools[woff]==4.60.2");
    expect([...MONO_FACES]).toEqual(["Regular", "Italic", "Bold", "BoldItalic"]);
  });

  it("keeps no layout features, so no ligatures (FR-003)", () => {
    expect(monoPyftsubsetArgs("Regular", "in.ttf", "out.woff2")).toEqual([
      "in.ttf",
      `--unicodes=${INTER_UNICODE_RANGE.join(",")}`,
      "--layout-features=",
      "--no-hinting",
      "--flavor=woff2",
      "--output-file=out.woff2",
    ]);
  });
});

describe("mono font files", () => {
  const monoDir = `${fontsDir}jetbrains-mono/`;
  const files: Record<string, { weight: string; style: string; sha: string }> = {
    "JetBrainsMono-Regular.woff2": {
      weight: "400",
      style: "normal",
      sha: "c7db62fa593d7a626f8eb77646a6f0944c01e3ba586ac3ceca55e8b36888bd18",
    },
    "JetBrainsMono-Italic.woff2": {
      weight: "400",
      style: "italic",
      sha: "3e6abb338d565e42430dc0d7612f261eb92d62b89a1f77c021cc9e7daa5d9dc0",
    },
    "JetBrainsMono-Bold.woff2": {
      weight: "700",
      style: "normal",
      sha: "504d5a6ee14ff269ca94e8c5d2b661c92a6cd3290c11735c7099fd5a71bc83c0",
    },
    "JetBrainsMono-BoldItalic.woff2": {
      weight: "700",
      style: "italic",
      sha: "62e2d56f1471aa78550024fc0432303c351d9c4141ba7a5331b267c8c2015fdf",
    },
  };
  const shipped = [...codePointsOf(INTER_UNICODE_RANGE)].sort((a, b) => a - b);

  it("holds exactly the four woff2 files and the licence", () => {
    expect(readdirSync(monoDir).sort()).toEqual(["OFL.txt", ...Object.keys(files)].sort());
  });

  it("keeps Inter's directory as it was", () => {
    expect(readdirSync(fontsDir).sort()).toEqual(
      [
        "Inter-Bold.woff2",
        "Inter-BoldItalic.woff2",
        "Inter-Italic.woff2",
        "Inter-Regular.woff2",
        "LICENSE.txt",
        "jetbrains-mono",
      ].sort(),
    );
  });

  it.each(Object.entries(files))("%s is JetBrains Mono, pinned", (name, want) => {
    const buffer = readFileSync(monoDir + name);
    const meta = fontace(buffer);
    expect(meta.family).toBe("JetBrains Mono");
    expect(meta.weight).toBe(want.weight);
    expect(meta.style).toBe(want.style);
    expect(createHash("sha256").update(buffer).digest("hex")).toBe(want.sha);
  });

  it.each(Object.keys(files))("%s has a cmap equal to the 202 shipped code points", (name) => {
    const meta = fontace(readFileSync(monoDir + name));
    const cmap = [...codePointsOf(meta.unicodeRangeArray)]
      .filter((cp) => cp !== 0xffff) // format 4 end marker, as for Inter
      .sort((a, b) => a - b);
    expect(cmap).toEqual(shipped);
  });

  it("totals at most 60,000 bytes", () => {
    const total = Object.keys(files).reduce((sum, n) => sum + statSync(monoDir + n).size, 0);
    expect(total).toBeLessThanOrEqual(60_000);
  });

  it("ships the OFL unmodified", () => {
    const buffer = readFileSync(`${monoDir}OFL.txt`);
    expect(createHash("sha256").update(buffer).digest("hex")).toBe(
      "30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad",
    );
    const text = buffer.toString("utf-8");
    expect(text).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(text).toContain("JetBrains Mono");
  });
});
