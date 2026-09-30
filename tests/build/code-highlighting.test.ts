// Class-based syntax highlighting under the page content security policy
// (specs/008-blog/tasks.md T003, T031; research R7, R8; FR-053). Astro's Shiki
// output is inline styles, which the site's policy forbids, so the production
// configuration in astro.config.mjs sets a semantic theme and a transformer that
// turns every colour into a class. This test builds a fixture site with that
// production configuration (nothing is patched in except where a case names it)
// and checks the built HTML.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteOptions, type FixtureSiteResult } from "./fixture-site.ts";

const results: FixtureSiteResult[] = [];
afterEach(() => {
  for (const result of results.splice(0)) result.cleanup();
});

const fixture = { from: "../posts/valid/code-spike.mdx", to: "code-spike.mdx" };

/** The site's configuration with Shiki left at Astro's defaults, for comparing the policy. */
const withoutShikiConfig: FixtureSiteOptions = {
  overrides: { "astro.config.mjs": (config) => config.replace(/\n[ \t]*shikiConfig:[^\n]*/, "") },
};

const cspOf = (html: string) =>
  /<meta[^>]+http-equiv="content-security-policy"[^>]*content="([^"]*)"/i.exec(html)?.[1] ?? "";
const codeBlocks = (html: string) => html.match(/<pre[^>]*class="[^"]*astro-code[^"]*"[\s\S]*?<\/pre>/g) ?? [];

describe("class-based syntax highlighting with the production configuration", () => {
  it("renders highlighted code with classes and no style attribute anywhere in it", async () => {
    const result = await buildFixtureSite([fixture]);
    results.push(result);
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);

    const html = result.read("code-spike/index.html");
    const blocks = codeBlocks(html);
    expect(blocks).toHaveLength(3);
    const [typed, plain, unknown] = blocks;

    expect(typed).toMatch(/class="[^"]*\bhl-keyword\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-comment\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-string\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-number\b/);
    expect(typed).toContain('data-caption="Reading a setting"');

    // No language: the same box, plain text.
    expect(plain).toContain("plain text without a language");
    expect(plain).not.toContain("data-caption");
    // An unknown language is plain text too, not an error.
    expect(unknown).toContain("text in a language nobody has heard of");

    for (const block of blocks) expect(block).not.toContain("style=");
    // The whole page: highlighting adds no inline style anywhere.
    expect(html.match(/<code[\s\S]*?<\/code>/g)?.join("") ?? "").not.toContain("style=");
  });

  it("leaves the content security policy exactly as it is without the highlighting configuration", async () => {
    const baseline = await buildFixtureSite([fixture], withoutShikiConfig);
    results.push(baseline);
    const configured = await buildFixtureSite([fixture]);
    results.push(configured);
    expect(baseline.ok).toBe(true);
    expect(configured.ok).toBe(true);

    const before = cspOf(baseline.read("code-spike/index.html"));
    const after = cspOf(configured.read("code-spike/index.html"));
    expect(after).not.toBe("");
    expect(after).toBe(before);
    const styleSrc = /style-src[^;]*/.exec(after)?.[0] ?? "";
    expect(styleSrc).toContain("'self'");
    expect(styleSrc).not.toContain("'unsafe-inline'");
    expect(after).not.toContain("'unsafe-inline'");
  });

  it("fails the build, naming the colour, when a token colour has no class", async () => {
    const result = await buildFixtureSite([fixture], {
      overrides: {
        "src/lib/markdown/shiki-theme.ts": (theme) =>
          theme.replace(
            "settings: { foreground: colourOf(cls) },",
            'settings: { foreground: cls === "hl-comment" ? "#0a0b0c" : colourOf(cls) },',
          ),
      },
    });
    results.push(result);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("#0a0b0c");
  });
});
