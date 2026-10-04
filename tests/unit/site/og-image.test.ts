// The sharing-image script draws in Inter Bold (specs/020-inter-diagram-social-text; contracts/
// scripts.md O01 to O03). Unit layer: ogHtml() is a pure string, so no browser is launched. The
// gate checks the script, not the PNG; re-render with `node scripts/og-image/render.ts` and commit
// public/og-default.png whenever the script changes.
//
// render.ts is loaded with a dynamic import, and only after its source shows the browser launch is
// guarded by import.meta.main. Today it launches a browser and rewrites the PNG on import, which a
// unit test must never do, so an unguarded script fails here instead of being imported.
import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SYSTEM_FONT_STACK } from "../../../src/lib/fonts/charset.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const scriptPath = join(root, "scripts/og-image/render.ts");

type OgModule = { OG_FONT_FILE: string; ogHtml: (fontBase64: string) => string };
let mod: OgModule;

beforeAll(async () => {
  const source = readFileSync(join(root, "scripts/og-image/render.ts"), "utf-8");
  expect(source, "render.ts must keep the browser launch under import.meta.main so it can be imported").toContain(
    "import.meta.main",
  );
  mod = (await import(/* @vite-ignore */ scriptPath)) as OgModule;
});

describe("sharing image script", () => {
  const fontFile = join(root, "src/assets/fonts/Inter-Bold.woff2");

  it("O01: OG_FONT_FILE is the committed Inter Bold WOFF2 and exists", () => {
    expect(mod.OG_FONT_FILE).toBe(fontFile);
    expect(existsSync(mod.OG_FONT_FILE)).toBe(true);
  });

  it("O02: one @font-face, Inter 700 normal, from the file's own base64", () => {
    const base64 = readFileSync(fontFile).toString("base64");
    const html = mod.ogHtml(base64);
    expect(html.match(/@font-face/g)).toHaveLength(1);
    const face = /@font-face\s*{([^}]*)}/.exec(html)![1]!;
    expect(face).toMatch(/font-family:\s*["']?Inter["']?/);
    expect(face).toMatch(/font-weight:\s*700/);
    expect(face).toMatch(/font-style:\s*normal/);
    expect(face).toContain(`url(data:font/woff2;base64,${base64})`);
    expect(face).toContain('format("woff2")');
  });

  it("O02: every font-family is Inter, with no system or generic family", () => {
    const html = mod.ogHtml("AAAA");
    const families = [...html.matchAll(/font-family:\s*([^;}]+)/g)].map((m) => m[1]!.trim().replace(/["']/g, ""));
    expect(families.length).toBeGreaterThan(0);
    for (const family of families) expect(family).toBe("Inter");
    for (const name of [...SYSTEM_FONT_STACK, "serif", "monospace"]) {
      expect(html, name).not.toContain(name);
    }
  });

  it("O03: size, colours, heading and rule are unchanged", () => {
    const html = mod.ogHtml("AAAA");
    expect(html).toContain("width: 1200px");
    expect(html).toContain("height: 630px");
    expect(html).toContain("#1c1a29");
    expect(html).toContain("#d68844");
    expect(html).toMatch(/font-size:\s*112px/);
    expect(html).toMatch(/font-weight:\s*700/);
    expect(html).toContain("letter-spacing: -0.02em");
    expect(html).toMatch(/width:\s*160px/);
    expect(html).toMatch(/height:\s*8px/);
    expect(html).toContain("margin-top: 40px");
    expect(html).toContain("border-radius: 4px");
    expect(html).toContain("padding: 0 96px");
    expect(html).toContain("Don Coleman");
  });
});
