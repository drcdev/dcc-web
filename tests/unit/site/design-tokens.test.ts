import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const globalCssPath = fileURLToPath(new URL("../../../src/styles/global.css", import.meta.url));
const css = readFileSync(globalCssPath, "utf-8");

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const PALETTES = ["dusk", "rust", "sage", "lavender", "mist", "sand", "mauve"] as const;

describe("src/styles/global.css design tokens", () => {
  it.each(PALETTES)("defines a BASE custom property for %s", (palette) => {
    expect(css).toMatch(new RegExp(`--color-${palette}-BASE:\\s*#[0-9a-fA-F]{3,8}`));
  });

  it.each(PALETTES)("derives all eleven shades (50-950) for %s from its BASE", (palette) => {
    for (const shade of SHADES) {
      const pattern = new RegExp(
        `--color-${palette}-${shade}:\\s*hsl\\(from var\\(--color-${palette}-BASE\\)[^)]*\\)`,
      );
      expect(css, `missing derived shade --color-${palette}-${shade}`).toMatch(pattern);
    }
  });

  it("defines --color-accent-BASE as #d68844", () => {
    expect(css).toMatch(/--color-accent-BASE:\s*#d68844\b/i);
  });

  it("derives all eleven accent shades (50-950) from --color-accent-BASE", () => {
    for (const shade of SHADES) {
      const pattern = new RegExp(
        `--color-accent-${shade}:\\s*hsl\\(from var\\(--color-accent-BASE\\)[^)]*\\)`,
      );
      expect(css, `missing derived shade --color-accent-${shade}`).toMatch(pattern);
    }
  });

  it("defines the dark custom variant", () => {
    expect(css).toMatch(/@custom-variant\s+dark\s*\(&:where\(\.dark,\s*\.dark \*\)\);/);
  });

  it("defines the js custom variant", () => {
    expect(css).toMatch(/@custom-variant\s+js\s*\(&:where\(\.js,\s*\.js \*\)\);/);
  });

  it("keeps the 'change the BASE value to update the palette' comment", () => {
    expect(css.toLowerCase()).toContain("change");
    expect(css.toLowerCase()).toContain("base");
    expect(css.toLowerCase()).toMatch(/change.*base.*palette|base value.*update.*palette/s);
  });

  it("defines .prose-accent heading colours: H1/H2 rust, H3 sage, H4 lavender", () => {
    expect(css).toMatch(/\.prose-accent\s+h1,\s*\n?\s*\.prose-accent\s+h2\s*\{[^}]*rust/s);
    expect(css).toMatch(/\.prose-accent\s+h3\s*\{[^}]*sage/s);
    expect(css).toMatch(/\.prose-accent\s+h4\s*\{[^}]*lavender/s);
  });

  it("defines .table-wrapper rules", () => {
    expect(css).toMatch(/\.table-wrapper\s*\{/);
    expect(css).toMatch(/\.table-wrapper\s+table\s*\{/);
  });

  it("defines a visible focus ring of at least 2px with 2px offset in the accent colour", () => {
    const match = css.match(/a:focus-visible,\s*\n?\s*button:focus-visible\s*\{([^}]*)\}/s);
    expect(match, "missing a:focus-visible, button:focus-visible rule").not.toBeNull();
    const body = match?.[1] ?? "";
    // Either raw CSS (outline: 2px solid ...; outline-offset: 2px;) or Tailwind @apply utilities
    // (outline-2 outline-offset-2 outline-accent-*) satisfy "at least 2px, offset 2px, accent colour".
    const hasRawOutline = /outline(-width)?:\s*(\d+)px/.test(body) && /outline-offset:\s*2px/.test(body);
    const hasRawWidth = body.match(/outline(?:-width)?:\s*(\d+)px/);
    const rawWidthOk = hasRawWidth ? Number(hasRawWidth[1]) >= 2 : false;
    const hasApplyUtilities =
      /outline-(?:[2-9]|[1-9]\d)\b/.test(body) &&
      /outline-offset-2\b/.test(body) &&
      /outline-accent-/.test(body);
    expect(
      (hasRawOutline && rawWidthOk) || hasApplyUtilities,
      `focus ring rule did not satisfy >=2px solid, 2px offset, accent colour: ${body}`,
    ).toBe(true);
    expect(body).toMatch(/accent/);
  });

  it("has a forced-colors fallback for the focus ring using a system colour", () => {
    const forcedColorsBlock = css.match(/@media\s*\(forced-colors:\s*active\)\s*\{([\s\S]*?)\n\}/);
    expect(forcedColorsBlock, "missing @media (forced-colors: active) block").not.toBeNull();
    const block = forcedColorsBlock?.[1] ?? "";
    expect(block).toMatch(/focus-visible/);
    expect(block).toMatch(/outline-color:\s*CanvasText/i);
  });

  it("sets --font-body and --font-heading to the self-hosted Inter variable (F07)", () => {
    expect(css.match(/--font-body:\s*([^;]+);/)?.[1]?.trim()).toBe("var(--font-inter)");
    expect(css.match(/--font-heading:\s*([^;]+);/)?.[1]?.trim()).toBe("var(--font-inter)");
  });

  // Supersedes "keeps pre and code in the body-font element rule" (feature 018 D2): code now has
  // its own face (feature 019, FR-001).
  it("sets --font-mono to the self-hosted JetBrains Mono variable (M07, FR-001)", () => {
    expect(css.match(/--font-mono:\s*([^;]+);/)?.[1]?.trim()).toBe("var(--font-jetbrains-mono)");
  });

  it("keeps pre and code out of the body-font element rule (M07)", () => {
    const rule = css.match(/([^{}]*)\{\s*font-family:\s*var\(--font-body\);\s*\}/)?.[1] ?? "";
    expect(rule).toMatch(/\bspan\b/);
    expect(rule).not.toMatch(/\bpre\b/);
    expect(rule).not.toMatch(/\bcode\b/);
  });

  it("gives pre, code, kbd, samp and their descendants the mono font, after the body rule (M07)", () => {
    const rules = [...css.matchAll(/([^{}]*)\{\s*font-family:\s*var\(--font-mono\);\s*\}/g)];
    const rule = rules.find((m) => /\bkbd\b/.test(m[1]!));
    expect(rule).toBeDefined();
    for (const el of ["pre", "code", "kbd", "samp"]) expect(rule![1]).toMatch(new RegExp(`\\b${el}\\b`));
    expect(rule![1]).toMatch(/\*/);
    const bodyRule = css.match(/[^{}]*\{\s*font-family:\s*var\(--font-body\);\s*\}/)!;
    expect(rule!.index!).toBeGreaterThan(bodyRule.index!);
  });

  it("sets no size, colour, weight, style, spacing, synthesis or feature declaration for code (M08, FR-004, FR-009)", () => {
    const rule = css.match(/[^{}]*\bkbd\b[^{}]*\{([^{}]*)\}/g)?.find((r) => /--font-mono/.test(r)) ?? "";
    expect(rule).not.toBe("");
    expect(rule).not.toMatch(/font-size|color|font-weight|font-style|padding|line-height|font-synthesis|font-feature-settings/);
    const hl = css.match(/\.hl-[^{}]*\{[^{}]*\}/g) ?? [];
    for (const r of hl) expect(r).not.toMatch(/font-style|font-weight/);
  });

  it("has no @font-face declaration", () => {
    expect(css).not.toMatch(/@font-face/);
  });

  it("has no @import or url() pointing at another host", () => {
    const importLines = css.match(/@import[^;]+;/g) ?? [];
    for (const line of importLines) {
      expect(line).not.toMatch(/https?:\/\//);
    }
    const urlCalls = css.match(/url\([^)]*\)/g) ?? [];
    for (const call of urlCalls) {
      expect(call).not.toMatch(/https?:\/\//);
    }
  });
});
