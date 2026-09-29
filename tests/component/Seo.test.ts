// Component tests for src/components/Seo.astro (contracts/head-metadata.md;
// data-model.md PageMetadata/SiteConfig; FR-017, FR-017b, FR-017c, FR-019).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Seo from "../../src/components/Seo.astro";
import { site } from "../../src/config/site.ts";
import { byName, meta, textOf } from "./html.ts";

const ORIGIN = "https://example.test";

async function render(props: Record<string, unknown> = {}, path = "/about/") {
  const container = await AstroContainer.create({ astroConfig: { site: ORIGIN } });
  return container.renderToString(Seo, {
    props,
    request: new Request(`${ORIGIN}${path}`),
  });
}

function content(html: string, key: "name" | "property", value: string): string | undefined {
  const found = meta(html, key, value);
  expect(found, `${key}=${value}`).toHaveLength(1);
  return found[0]!.attrs.content;
}

describe("site config defaults", () => {
  it("matches data-model.md SiteConfig", () => {
    expect(site.name).toBe("Don Coleman");
    expect(site.defaultDescription.trim().length).toBeGreaterThan(0);
    expect(site.defaultImage).toBe("/og-default.png");
    expect(site.defaultImageAlt).toBe("Don Coleman");
    expect(site.locale).toBe("en_CA");
    expect(site.indexable).toBe(false);
    expect(site.copyrightName).toBe("Don Coleman");
  });
});

describe("Seo with defaults", () => {
  it('renders the site name alone as the title on a page with no title ("home")', async () => {
    const html = await render({}, "/");
    expect(textOf(html, "title")).toBe("Don Coleman");
    expect(content(html, "property", "og:title")).toBe("Don Coleman");
  });

  it("renders the default description, OG and twitter tags", async () => {
    const html = await render({}, "/");
    expect(content(html, "name", "description")).toBe(site.defaultDescription);
    expect(content(html, "property", "og:description")).toBe(site.defaultDescription);
    expect(content(html, "property", "og:type")).toBe("website");
    expect(content(html, "property", "og:site_name")).toBe("Don Coleman");
    expect(content(html, "property", "og:locale")).toBe("en_CA");
    expect(content(html, "name", "twitter:card")).toBe("summary_large_image");
  });

  it("renders the default image as an absolute URL with alt text", async () => {
    const html = await render({}, "/");
    expect(content(html, "property", "og:image")).toBe(`${ORIGIN}/og-default.png`);
    expect(content(html, "property", "og:image:alt")).toBe("Don Coleman");
  });

  it("renders canonical and og:url as the origin plus the current path", async () => {
    const html = await render({}, "/about/");
    const canonical = byName(html, "link").filter((l) => l.attrs.rel === "canonical");
    expect(canonical).toHaveLength(1);
    expect(canonical[0]!.attrs.href).toBe(`${ORIGIN}/about/`);
    expect(content(html, "property", "og:url")).toBe(`${ORIGIN}/about/`);
  });

  it("asks search engines not to index the page (FR-019)", async () => {
    const html = await render();
    expect(content(html, "name", "robots")).toBe("noindex");
  });

  it("links the sitemap index", async () => {
    const html = await render();
    const sitemap = byName(html, "link").filter((l) => l.attrs.rel === "sitemap");
    expect(sitemap).toHaveLength(1);
    expect(sitemap[0]!.attrs.href).toBe("/sitemap-index.xml");
  });
});

describe("Seo with overrides", () => {
  it('formats a page title as "{title} · Don Coleman" and keeps og:title without the suffix', async () => {
    const html = await render({ title: "About" });
    expect(textOf(html, "title")).toBe("About · Don Coleman");
    expect(content(html, "property", "og:title")).toBe("About");
  });

  it("overrides the description field by field", async () => {
    const html = await render({ description: "About Don." });
    expect(content(html, "name", "description")).toBe("About Don.");
    expect(content(html, "property", "og:description")).toBe("About Don.");
    expect(content(html, "property", "og:image")).toBe(`${ORIGIN}/og-default.png`);
  });

  it("overriding only the image keeps the default description", async () => {
    const html = await render({ image: "/images/about.png", imageAlt: "Don speaking" });
    expect(content(html, "property", "og:image")).toBe(`${ORIGIN}/images/about.png`);
    expect(content(html, "property", "og:image:alt")).toBe("Don speaking");
    expect(content(html, "name", "description")).toBe(site.defaultDescription);
  });

  it("keeps an already absolute image URL", async () => {
    const html = await render({ image: `${ORIGIN}/x.png`, imageAlt: "X" });
    expect(content(html, "property", "og:image")).toBe(`${ORIGIN}/x.png`);
  });

  it("omits canonical and og:url when canonical is false (not-found page, FR-017c)", async () => {
    const html = await render({ title: "Page not found", canonical: false }, "/404/");
    expect(byName(html, "link").filter((l) => l.attrs.rel === "canonical")).toHaveLength(0);
    expect(meta(html, "property", "og:url")).toHaveLength(0);
    expect(content(html, "name", "robots")).toBe("noindex");
    expect(content(html, "property", "og:image")).toBe(`${ORIGIN}/og-default.png`);
  });

  it("escapes metadata values", async () => {
    const html = await render({ title: 'A "quoted" <title>' });
    expect(html).not.toContain("<title>A \"quoted\" <title>");
    expect(textOf(html, "title")).toBe('A "quoted" <title> · Don Coleman');
  });
});
