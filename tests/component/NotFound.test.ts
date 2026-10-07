// Component test for src/pages/404.astro via Astro's Container API
// (contracts/shell-dom.md; FR-016, FR-017c; T069). The not-found page renders
// the full shell (skip link, header, footer) with helpful copy and site
// metadata that omits canonical/og:url, matching Seo's `canonical={false}`
// contract (tests/component/Seo.test.ts).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it, vi } from "vitest";

// The page reads its menus from the content collections, which a component test does not sync.
// A fixed pair of menus is enough: this test is about the shell the page renders.
vi.mock("../../src/lib/pages", () => ({
  getNavigation: async () => ({
    header: [{ label: "Home", href: "/", kind: "primary" }],
    footer: [{ label: "Privacy policy", href: "/privacy-policy/", kind: "footer" }],
  }),
}));

import NotFound from "../../src/pages/404.astro";
import { byName, meta, textOf } from "./html.ts";

const ORIGIN = "https://example.test";

let html = "";

beforeAll(async () => {
  const container = await AstroContainer.create({ astroConfig: { site: ORIGIN } });
  html = await container.renderToString(NotFound, {
    request: new Request(`${ORIGIN}/nope/`),
  });
});

describe("404 page shell", () => {
  it("renders the skip link, header and footer", () => {
    expect(html).toContain("Skip to main content");
    expect(byName(html, "header")).toHaveLength(1);
    expect(byName(html, "footer")).toHaveLength(1);
  });

  it("has exactly one h1 reading 'Page not found'", () => {
    expect(byName(html, "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toBe("Page not found");
  });

  it("explains, in plain language, that older blog addresses have moved", () => {
    const text = html.toLowerCase();
    expect(text).toContain("older blog addresses");
    expect(text).toContain("moved");
  });

  it("links to the home page", () => {
    const homeLinks = byName(html, "a").filter((a) => a.attrs.href === "/");
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("keeps the main navigation", () => {
    const mainNavs = byName(html, "nav").filter((n) => n.attrs["aria-label"] === "Main");
    expect(mainNavs).toHaveLength(1);
  });
});

describe("404 page metadata", () => {
  it("sets a title and a non-empty description", () => {
    expect(textOf(html, "title")).toBe("Page not found · Don Coleman");
    const description = meta(html, "name", "description")[0]?.attrs.content;
    expect(description?.trim().length).toBeGreaterThan(0);
  });

  it("sets a sharing title, description and image", () => {
    expect(meta(html, "property", "og:title")[0]?.attrs.content).toBe("Page not found");
    expect(meta(html, "property", "og:description")[0]?.attrs.content?.trim().length).toBeGreaterThan(0);
    expect(meta(html, "property", "og:image")[0]?.attrs.content).toBe(`${ORIGIN}/og-default.png`);
    expect(meta(html, "property", "og:image:alt")[0]?.attrs.content?.trim().length).toBeGreaterThan(0);
  });

  it("asks search engines not to index the page (FR-017c)", () => {
    expect(meta(html, "name", "robots")[0]?.attrs.content).toBe("noindex");
  });

  it("has no canonical link and no og:url (FR-017c)", () => {
    expect(byName(html, "link").filter((l) => l.attrs.rel === "canonical")).toHaveLength(0);
    expect(meta(html, "property", "og:url")).toHaveLength(0);
  });
});
