// Component tests for src/layouts/BaseLayout.astro via Astro's Container API
// (contracts/shell-dom.md; data-model.md; FR-010, FR-010a, FR-013, FR-020b).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import BaseLayout from "../../src/layouts/BaseLayout.astro";
import { byName, classList, focusable, tags } from "./html.ts";

const themeInitSource = readFileSync(
  fileURLToPath(new URL("../../src/scripts/theme-init.js", import.meta.url)),
  "utf-8",
);

let html = "";

beforeAll(async () => {
  const container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
  html = await container.renderToString(BaseLayout, {
    partial: false,
    props: {
      title: "Test page",
      navigation: [
        { label: "Alpha", href: "/alpha/", kind: "primary" },
        { label: "Beta", href: "/beta/", kind: "primary" },
      ],
    },
    request: new Request("https://example.test/test-page/"),
    slots: { default: "<h1>Test page</h1><h2>Section</h2><p>Body text.</p>" },
  });
});

describe("BaseLayout document", () => {
  it('renders <html lang="en"> with the dark class server-side', () => {
    const [root, ...rest] = byName(html, "html");
    expect(rest).toHaveLength(0);
    expect(root?.attrs.lang).toBe("en");
    expect(classList(root!)).toContain("dark");
  });

  it("uses motion-safe smooth scrolling on <html> (FR-021)", () => {
    const [root] = byName(html, "html");
    expect(classList(root!)).toContain("motion-safe:scroll-smooth");
    expect(classList(root!)).not.toContain("scroll-smooth");
  });

  it("has exactly one header, one Main nav, one main#main[tabindex=-1] and one footer", () => {
    expect(byName(html, "header")).toHaveLength(1);
    const navs = byName(html, "nav");
    expect(navs.filter((n) => n.attrs["aria-label"] === "Main")).toHaveLength(1);
    const mains = byName(html, "main");
    expect(mains).toHaveLength(1);
    expect(mains[0]!.attrs.id).toBe("main");
    expect(mains[0]!.attrs.tabindex).toBe("-1");
    expect(byName(html, "footer")).toHaveLength(1);
  });

  it("places header before main before footer", () => {
    const header = byName(html, "header")[0]!.index;
    const main = byName(html, "main")[0]!.index;
    const footer = byName(html, "footer")[0]!.index;
    expect(header).toBeLessThan(main);
    expect(main).toBeLessThan(footer);
  });

  it("has exactly one h1 and no skipped heading levels", () => {
    const levels = tags(html)
      .filter((t) => /^h[1-6]$/.test(t.name))
      .map((t) => Number(t.name.slice(1)));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    let previous = 0;
    for (const level of levels) {
      expect(level - previous).toBeLessThanOrEqual(1);
      previous = level;
    }
  });

  it("makes the skip link the first focusable element", () => {
    const [first] = focusable(html);
    expect(first?.name).toBe("a");
    expect(first?.attrs.href).toBe("#main");
    expect(html).toContain("Skip to main content");
  });

  it("uses no positive tabindex anywhere", () => {
    for (const tag of tags(html)) {
      if (tag.attrs.tabindex !== undefined) {
        expect(Number(tag.attrs.tabindex)).toBeLessThanOrEqual(0);
      }
    }
  });

  it("renders the slot inside main", () => {
    const mainStart = html.indexOf("<main");
    const mainEnd = html.indexOf("</main>");
    const h1 = html.indexOf("<h1");
    expect(h1).toBeGreaterThan(mainStart);
    expect(h1).toBeLessThan(mainEnd);
  });
});

describe("BaseLayout head", () => {
  const head = () => html.slice(html.indexOf("<head"), html.indexOf("</head>"));

  it("renders the theme-init script inline in <head>, unprocessed", () => {
    const scripts = byName(head(), "script");
    const inline = scripts.filter((s) => !("src" in s.attrs));
    expect(inline.length).toBeGreaterThanOrEqual(1);
    expect(head()).toContain(themeInitSource.trim());
    // An inline, unprocessed script is a classic script: not a module, not deferred.
    const themeScriptTag = inline[0]!;
    expect(themeScriptTag.attrs.type).toBeUndefined();
    expect("defer" in themeScriptTag.attrs).toBe(false);
    expect("async" in themeScriptTag.attrs).toBe(false);
  });

  it("places the theme-init script before any stylesheet and any other script", () => {
    const h = head();
    const scriptAt = h.indexOf(themeInitSource.trim());
    expect(scriptAt).toBeGreaterThan(-1);
    for (const tag of tags(h)) {
      if (tag.name === "link" && tag.attrs.rel === "stylesheet") {
        expect(scriptAt).toBeLessThan(tag.index);
      }
      if (tag.name === "style") expect(scriptAt).toBeLessThan(tag.index);
    }
    const firstScript = byName(h, "script")[0]!;
    expect(h.indexOf(themeInitSource.trim())).toBeGreaterThan(firstScript.index);
    expect(h.indexOf(themeInitSource.trim())).toBeLessThan(h.indexOf("</script>", firstScript.index));
  });

  it("sets charset and a responsive viewport", () => {
    expect(byName(head(), "meta").some((m) => m.attrs.charset?.toLowerCase() === "utf-8")).toBe(true);
    const viewport = byName(head(), "meta").find((m) => m.attrs.name === "viewport");
    expect(viewport?.attrs.content).toContain("width=device-width");
    expect(viewport?.attrs.content).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/);
  });

  it("renders the page metadata (title and noindex) through Seo", () => {
    expect(head()).toContain("<title>Test page · Don Coleman</title>");
    const robots = byName(head(), "meta").find((m) => m.attrs.name === "robots");
    expect(robots?.attrs.content).toContain("noindex");
  });
});

describe("BaseLayout navigation prop (FR-025)", () => {
  it("passes navigation to the header and leaves footer and social links unchanged", () => {
    const list = /<ul[^>]+id="primary-nav-list"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? "";
    expect(list).toContain('href="/alpha/"');
    expect(list).toContain('href="/beta/"');
    expect(list).not.toContain("Services");
    const footer = /<footer[\s\S]*<\/footer>/.exec(html)?.[0] ?? "";
    for (const href of ["/privacy-policy/", "/terms-of-use/", "/technology/", "https://github.com/drcdev", "https://www.linkedin.com/in/drcdev"]) {
      expect(footer).toContain(`href="${href}"`);
    }
  });
});

describe("BaseLayout page container", () => {
  it("wraps main in the full-width container that wide and full-width images measure against", () => {
    const wrapper = tags(html).find((t) => classList(t).includes("page-container"));
    expect(wrapper).toBeDefined();
    expect(html.indexOf('class="page-container"')).toBeLessThan(html.indexOf("<main"));
    expect(html.indexOf("</main>")).toBeLessThan(html.indexOf("<footer"));
  });
});

describe("BaseLayout head slot (blog feed link; research R3)", () => {
  const feedLink = '<link rel="alternate" type="application/rss+xml" title="Feed" href="https://example.test/writing/rss.xml">';

  async function renderWith(slots: Record<string, string>) {
    const container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
    return container.renderToString(BaseLayout, {
      partial: false,
      props: { title: "Test page", navigation: [{ label: "Alpha", href: "/alpha/", kind: "primary" }] },
      request: new Request("https://example.test/test-page/"),
      slots: { default: "<h1>Test page</h1>", ...slots },
    });
  }

  it("renders content passed to the named head slot inside <head>", async () => {
    const withHead = await renderWith({ head: feedLink });
    const head = withHead.slice(withHead.indexOf("<head"), withHead.indexOf("</head>"));
    expect(head).toContain(feedLink);
    expect(withHead.indexOf(feedLink)).toBeLessThan(withHead.indexOf("<body"));
  });

  it("leaves the output byte-identical when the slot is not used", async () => {
    const without = await renderWith({});
    const withHead = await renderWith({ head: feedLink });
    expect(withHead.replace(feedLink, "")).toBe(without);
    expect(without).not.toContain("application/rss+xml");
  });
});

