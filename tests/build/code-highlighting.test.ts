// Spike 1 (specs/008-blog/tasks.md T003; research R7, R8): Shiki output must be
// class-based so the page content security policy needs no `'unsafe-inline'` for
// styles. A placeholder semantic theme gives every token category a unique
// colour, a transformer swaps each colour for an `hl-*` class and deletes the
// `style` attributes, and a `root` hook fails the build if any style survives.
// The highlighted `<pre>` must still reach a `components.pre` override in MDX.
// This test is the permanent build-level guard for US1 (T031 reuses it).
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteOptions, type FixtureSiteResult } from "./fixture-site.ts";

const results: FixtureSiteResult[] = [];
afterEach(() => {
  for (const result of results.splice(0)) result.cleanup();
});

const fixture = { from: "../posts/valid/code-spike.mdx", to: "code-spike.mdx" };

/** Placeholder colour for each token category, and the class that replaces it. */
const categories = {
  text: ["#010101", "hl-text"],
  comment: ["#010102", "hl-comment"],
  keyword: ["#010103", "hl-keyword"],
  string: ["#010104", "hl-string"],
  number: ["#010105", "hl-number"],
  function: ["#010106", "hl-function"],
  type: ["#010107", "hl-type"],
  variable: ["#010108", "hl-variable"],
  punctuation: ["#010109", "hl-punctuation"],
} as const;

const scopes: Record<keyof typeof categories, string[]> = {
  text: [],
  comment: ["comment"],
  keyword: ["keyword", "storage", "storage.type"],
  string: ["string"],
  number: ["constant.numeric"],
  function: ["entity.name.function"],
  type: ["support.type", "entity.name.type", "meta.type.annotation"],
  variable: ["variable"],
  punctuation: ["punctuation", "keyword.operator"],
};

/** Source of the spike module written into the copied site: a theme and the transformers. */
function shikiModule(omit: keyof typeof categories | null): string {
  const theme = {
    name: "spike",
    type: "dark",
    fg: categories.text[0],
    bg: "#020202",
    settings: Object.entries(scopes)
      .filter(([name]) => name !== "text")
      .map(([name, scope]) => ({
        scope,
        settings: { foreground: categories[name as keyof typeof categories][0] },
      })),
  };
  const map = Object.fromEntries(
    Object.entries(categories)
      .filter(([name]) => name !== omit)
      .map(([, [colour, cls]]) => [colour, cls]),
  );
  return `export const theme = ${JSON.stringify(theme)};
const classes = ${JSON.stringify(map)};
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}
export const transformers = [
  {
    name: "spike-classes",
    pre(node) {
      delete node.properties.style;
      const caption = /caption="([^"]*)"/.exec(this.options.meta?.__raw ?? "")?.[1];
      if (caption) node.properties["data-caption"] = caption;
    },
    span(node) {
      const style = String(node.properties.style ?? "");
      const colour = /(?:^|;)\\s*color:\\s*(#[0-9a-fA-F]{6})/.exec(style)?.[1]?.toLowerCase();
      if (!colour) return;
      const cls = classes[colour];
      if (!cls) throw new Error("No class for highlight colour " + colour);
      node.properties.class = [node.properties.class, cls].flat().filter(Boolean).join(" ");
      delete node.properties.style;
    },
    root(root) {
      walk(root, (node) => {
        if (node.properties?.style !== undefined) {
          throw new Error("A style attribute survived on <" + node.tagName + ">: " + node.properties.style);
        }
      });
    },
  },
];
`;
}

const passthrough = `---
const props = Astro.props;
---
<div data-code-override><pre {...props}><slot /></pre></div>
`;

function options(omit: keyof typeof categories | null): FixtureSiteOptions {
  return {
    overrides: {
      "spike-shiki.mjs": shikiModule(omit),
      "src/components/SpikePre.astro": passthrough,
      "astro.config.mjs": (config) =>
        `import { theme, transformers } from "./spike-shiki.mjs";\n` +
        config.replace(
          `trailingSlash: "always",`,
          `trailingSlash: "always",\n  markdown: { shikiConfig: { theme, transformers } },`,
        ),
      "src/pages/[...slug].astro": (route) =>
        route
          .replace(
            `import PageLayout`,
            `import SpikePre from "../components/SpikePre.astro";\nimport PageLayout`,
          )
          .replace(
            `<Content components={sectionComponents} />`,
            `<Content components={{ ...sectionComponents, pre: SpikePre }} />`,
          ),
    },
  };
}

const cspOf = (html: string) =>
  /<meta[^>]+http-equiv="content-security-policy"[^>]*content="([^"]*)"/i.exec(html)?.[1] ?? "";
const codeBlocks = (html: string) => html.match(/<pre[^>]*class="[^"]*astro-code[^"]*"[\s\S]*?<\/pre>/g) ?? [];

describe("class-based syntax highlighting under the page CSP", () => {
  it("renders highlighted code inside the pre override with classes and no style attributes", async () => {
    const result = await buildFixtureSite([fixture], options(null));
    results.push(result);
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);

    const html = result.read("code-spike/index.html");
    const blocks = codeBlocks(html);
    expect(blocks).toHaveLength(2);

    // The highlighted <pre> is passed through the components.pre override.
    expect(html).toMatch(/<div data-code-override>\s*<pre[^>]*class="[^"]*astro-code/);

    const [typed, plain] = blocks;
    expect(typed).toMatch(/class="[^"]*\bhl-keyword\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-comment\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-string\b/);
    expect(typed).toContain('data-caption="Reading a setting"');
    // Code without a language still goes through the same box.
    expect(plain).toContain("plain text without a language");

    for (const block of blocks) expect(block).not.toContain('style="');
  });

  it("leaves the content security policy exactly as the site's current one", async () => {
    const baseline = await buildFixtureSite([fixture]);
    results.push(baseline);
    const spike = await buildFixtureSite([fixture], options(null));
    results.push(spike);
    expect(baseline.ok).toBe(true);
    expect(spike.ok).toBe(true);

    const before = cspOf(baseline.read("code-spike/index.html"));
    const after = cspOf(spike.read("code-spike/index.html"));
    expect(after).not.toBe("");
    expect(after).toBe(before);
    const styleSrc = /style-src[^;]*/.exec(after)?.[0] ?? "";
    expect(styleSrc).toContain("'self'");
    expect(styleSrc).not.toContain("'unsafe-inline'");
    expect(after).not.toContain("'unsafe-inline'");
  });

  it("fails the build, naming the colour, when a token colour has no class", async () => {
    const result = await buildFixtureSite([fixture], options("comment"));
    results.push(result);
    expect(result.ok).toBe(false);
    expect(result.message).toContain(categories.comment[0]);
  });
});
