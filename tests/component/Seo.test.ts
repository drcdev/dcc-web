// Component tests for src/components/Seo.astro (contracts/head-metadata.md;
// data-model.md PageMetadata/SiteConfig; FR-017, FR-017b, FR-017c, FR-019).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("asks search engines not to index the page in a build that is not production (FR-019)", async () => {
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

describe("Seo article times (FR-030)", () => {
  const publishedTime = new Date("2026-08-27");
  const modifiedTime = new Date("2026-09-15");

  it("emits article:published_time and article:modified_time for an article", async () => {
    const html = await render({ title: "A post", type: "article", publishedTime, modifiedTime }, "/writing/a-post/");
    expect(content(html, "property", "og:type")).toBe("article");
    expect(content(html, "property", "article:published_time")).toBe("2026-08-27");
    expect(content(html, "property", "article:modified_time")).toBe("2026-09-15");
  });

  it("omits article:modified_time when there is none", async () => {
    const html = await render({ title: "A post", type: "article", publishedTime }, "/writing/a-post/");
    expect(meta(html, "property", "article:modified_time")).toHaveLength(0);
    expect(content(html, "property", "article:published_time")).toBe("2026-08-27");
  });

  it("emits neither on a website page, even when given", async () => {
    const html = await render({ publishedTime, modifiedTime });
    expect(meta(html, "property", "article:published_time")).toHaveLength(0);
    expect(meta(html, "property", "article:modified_time")).toHaveLength(0);
  });
});

// The default follows the build decision (isIndexableBuild); an explicit noindex wins (FR-010d).
describe("Seo robots meta follows the build", () => {
  afterEach(() => {
    vi.doUnmock("astro:env/server");
    vi.resetModules();
  });

  async function renderIn(env: { WORKERS_CI?: string; WORKERS_CI_BRANCH?: string }, props: Record<string, unknown> = {}) {
    vi.resetModules();
    vi.doMock("astro:env/server", () => env);
    const { default: FreshSeo } = await import("../../src/components/Seo.astro");
    const container = await AstroContainer.create({ astroConfig: { site: ORIGIN } });
    return container.renderToString(FreshSeo, { props, request: new Request(`${ORIGIN}/about/`) });
  }

  it("leaves the robots meta tag out of a main build", async () => {
    const html = await renderIn({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" });
    expect(meta(html, "name", "robots")).toHaveLength(0);
  });

  it("adds noindex to a preview branch build", async () => {
    const html = await renderIn({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "042-sample-feature" });
    expect(content(html, "name", "robots")).toBe("noindex");
  });

  it("lets an explicit noindex win in a main build (draft pages, not-found page)", async () => {
    const html = await renderIn({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }, { noindex: true });
    expect(content(html, "name", "robots")).toBe("noindex");
  });
});
