// The Shiki class transformer and its semantic theme (specs/008-blog/research.md
// R7; FR-053). Every colour Shiki would write into a `style` attribute becomes a
// class, so the page content security policy needs no `'unsafe-inline'` for
// styles. The highlighter is Astro's own (the one @astrojs/markdown-satteri
// uses), so the transformer runs in the same pipeline as a real build.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { createClassTransformer, shikiClassTransformer } from "../../../src/lib/markdown/shiki-classes.ts";
import { highlightClasses, shikiTheme } from "../../../src/lib/markdown/shiki-theme.ts";

interface Highlighter {
  codeToHtml(
    code: string,
    lang?: string,
    options?: { transformers?: unknown[]; meta?: string },
  ): Promise<string>;
}

let highlighter: Highlighter;
beforeAll(async () => {
  // @astrojs/internal-helpers is Astro's own dependency, so it is resolved from where Astro's
  // Markdown processor lives rather than from the project's own node_modules.
  const fromProcessor = createRequire(createRequire(import.meta.url).resolve("@astrojs/markdown-satteri"));
  const helpers = await import(pathToFileURL(fromProcessor.resolve("@astrojs/internal-helpers/shiki")).href);
  highlighter = await helpers.createShikiHighlighter({ theme: shikiTheme });
});

const highlight = (code: string, lang: string, meta?: string, transformers: unknown[] = [shikiClassTransformer]) =>
  highlighter.codeToHtml(code, lang, { transformers, ...(meta ? { meta } : {}) });

const samples: Record<string, { lang: string; code: string; expected: string[] }> = {
  typescript: {
    lang: "ts",
    code: `// read a setting\nconst { title }: Entry = entry.data;\nconsole.log("title", 42);\n`,
    expected: ["hl-comment", "hl-keyword", "hl-string", "hl-number"],
  },
  javascript: {
    lang: "js",
    code: `function add(a, b) {\n  return a + b;\n}\n`,
    expected: ["hl-keyword", "hl-function"],
  },
  css: {
    lang: "css",
    code: `.card { color: #fff; margin: 0 auto; }\n`,
    expected: ["hl-number"],
  },
  html: {
    lang: "html",
    code: `<a href="/writing/">Writing</a>\n`,
    expected: ["hl-tag", "hl-string"],
  },
  json: {
    lang: "json",
    code: `{ "name": "dcc", "count": 3, "ok": true }\n`,
    expected: ["hl-string", "hl-number"],
  },
  shell: {
    lang: "sh",
    code: `# fetch\ncurl --silent "https://example.com" | jq .\n`,
    expected: ["hl-comment", "hl-string"],
  },
  python: {
    lang: "python",
    code: `def add(a, b):\n    return a + b  # sum\n`,
    expected: ["hl-keyword", "hl-function", "hl-comment"],
  },
};

describe("class-based highlighting (R7)", () => {
  for (const [name, sample] of Object.entries(samples)) {
    it(`writes classes and no style attribute for ${name}`, async () => {
      const html = await highlight(sample.code, sample.lang);
      expect(html).toContain('class="astro-code');
      expect(html).not.toMatch(/\sstyle=/);
      for (const cls of sample.expected) expect(html, cls).toMatch(new RegExp(`class="[^"]*\\b${cls}\\b`));
      // Code is kept exactly, including indentation and line breaks.
      const text = html
        .replace(/<[^>]+>/g, "")
        .replace(/&#x3C;/g, "<")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x26;/g, "&")
        .replace(/&amp;/g, "&");
      expect(text.trimEnd()).toBe(sample.code.trimEnd());
    });
  }

  it("treats plain text (no language, or an unknown one) as text with no style attribute", async () => {
    for (const lang of ["plaintext", "text", "not-a-real-language"]) {
      const html = await highlight("This text has no language.\n    Indentation stays.\n", lang);
      expect(html, lang).toContain('class="astro-code');
      expect(html, lang).not.toMatch(/\sstyle=/);
      expect(html, lang).toContain("Indentation stays.");
    }
  });

  it("uses only classes the theme declares", async () => {
    const declared = new Set<string>(Object.values(highlightClasses));
    for (const sample of Object.values(samples)) {
      const html = await highlight(sample.code, sample.lang);
      for (const match of html.matchAll(/\bhl-[a-z]+/g)) expect(declared.has(match[0]), match[0]).toBe(true);
    }
  });

  it("gives every category one distinct placeholder colour and one distinct class", () => {
    const colours = Object.keys(highlightClasses);
    expect(new Set(colours.map((c) => c.toLowerCase())).size).toBe(colours.length);
    expect(new Set(Object.values(highlightClasses)).size).toBe(colours.length);
    for (const cls of Object.values(highlightClasses)) expect(cls).toMatch(/^hl-[a-z]+$/);
  });

  it("carries no font style in the theme, so no style attribute can come from one", () => {
    const json = JSON.stringify(shikiTheme);
    expect(json).not.toContain("fontStyle");
  });
});

describe("caption on the fence's meta string", () => {
  it("reads caption=\"...\" into data-caption on the pre element", async () => {
    const html = await highlight("const a = 1;\n", "ts", 'caption="Reading a post\'s settings"');
    expect(html).toMatch(/<pre[^>]*\sdata-caption="Reading a post&#x27;s settings"/);
  });

  it("finds the caption among other meta words", async () => {
    const html = await highlight("const a = 1;\n", "ts", '{1,2} caption="Two words" showLineNumbers');
    expect(html).toMatch(/<pre[^>]*\sdata-caption="Two words"/);
  });

  it("adds no data-caption when the fence has none", async () => {
    expect(await highlight("const a = 1;\n", "ts")).not.toContain("data-caption");
    expect(await highlight("const a = 1;\n", "ts", "showLineNumbers")).not.toContain("data-caption");
  });
});

describe("build guards", () => {
  it("fails, naming the colour, when a token colour has no class", async () => {
    const partial = { ...highlightClasses } as Record<string, string>;
    const comment = Object.keys(partial).find((colour) => partial[colour] === "hl-comment")!;
    delete partial[comment];
    const transformer = createClassTransformer(partial);
    await expect(highlight("// a comment\nconst a = 1;\n", "ts", undefined, [transformer])).rejects.toThrow(comment);
  });

  it("fails when a style attribute survives, naming the element", async () => {
    const adder = {
      name: "adds-a-style",
      span(node: { properties: Record<string, unknown> }) {
        node.properties.style = "color:red";
      },
    };
    await expect(highlight("const a = 1;\n", "ts", undefined, [shikiClassTransformer, adder])).rejects.toThrow(
      /style attribute/i,
    );
  });
});
