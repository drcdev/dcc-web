// HomeIntro: the home page's introduction card (port of Flux
// layout-author-hero.hbs; contracts/page-dom.md "Home page"; FR-013, FR-016,
// FR-017).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import HomeIntro from "../../src/components/page/HomeIntro.astro";
import SiteFooter from "../../src/components/SiteFooter.astro";
import sample from "../fixtures/pages/images/sample.png";
import { byName, classList, focusable, tags, textOf } from "./html.ts";

const intro = {
  photo: { src: sample, alt: "Don Coleman smiling, outdoors" },
  name: "Don Coleman",
  tagline: "Technology where healthcare meets emerging tech",
  bio: "A short bio about Don.",
  cta: { label: "Work with Don", href: "/services/" },
};

let html = "";
let footer = "";

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(HomeIntro, { props: { intro } });
  footer = await container.renderToString(SiteFooter, { request: new Request("https://example.test/") });
});

/** Plain text of the card in source order, tags stripped. */
function words(): string[] {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

describe("HomeIntro structure", () => {
  it("has a gradient wrapper around the card", () => {
    const wrapper = tags(html).find((t) => classList(t).includes("bg-gradient-to-br"));
    expect(wrapper).toBeDefined();
    for (const c of ["from-rust-400", "via-sage-400", "to-lavender-400"]) expect(classList(wrapper!)).toContain(c);
  });

  it("renders the name as the only <h1>", () => {
    expect(byName(html, "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toBe("Don Coleman");
    expect(byName(html, "h2")).toHaveLength(0);
  });

  it("renders the photo with its alt text, eager and high priority", () => {
    const [img] = byName(html, "img");
    expect(img!.attrs.alt).toBe(intro.photo.alt);
    expect(img!.attrs.loading).toBe("eager");
    expect(img!.attrs.fetchpriority).toBe("high");
    expect(img!.attrs.width).toBeTruthy();
    expect(img!.attrs.height).toBeTruthy();
  });

  it("renders the tagline in italics and the bio", () => {
    const tagline = tags(html).find((t) => t.name === "p" && classList(t).includes("italic"));
    expect(tagline).toBeDefined();
    expect(html).toContain(intro.tagline);
    expect(html).toContain(intro.bio);
  });

  it("adds no landmark and no region name", () => {
    for (const t of tags(html)) {
      expect(t.attrs.role, t.raw).toBeUndefined();
      expect(t.attrs["aria-label"], t.raw).toBeUndefined();
      expect(t.attrs["aria-labelledby"], t.raw).toBeUndefined();
    }
    for (const n of ["nav", "aside", "header", "footer", "main"]) expect(byName(html, n)).toHaveLength(0);
  });
});

describe("HomeIntro links", () => {
  it("lists GitHub and LinkedIn with the footer's hrefs and accessible names", () => {
    expect(byName(html, "ul")).toHaveLength(1);
    expect(byName(html, "li")).toHaveLength(2);
    const links = byName(html, "a").filter((a) => a.attrs.href?.startsWith("https://"));
    const footerLinks = byName(footer, "a").filter((a) => a.attrs.href?.startsWith("https://"));
    expect(links.map((a) => a.attrs.href)).toEqual(footerLinks.map((a) => a.attrs.href));
    expect(html).toMatch(/sr-only[^>]*>\s*GitHub\s*</);
    expect(html).toMatch(/sr-only[^>]*>\s*LinkedIn\s*</);
  });

  it("links the call to action to /services/ and says nothing about Subscribe", () => {
    const cta = byName(html, "a").filter((a) => a.attrs.href === "/services/");
    expect(cta).toHaveLength(1);
    expect(html).toContain("Work with Don");
    expect(html.toLowerCase()).not.toContain("subscribe");
  });

  it("drops the Website, X and Bluesky links", () => {
    for (const name of ["Website", "Bluesky", "Twitter", "X (Twitter)"]) expect(html).not.toContain(name);
  });

  it("hides every icon from assistive technology", () => {
    const svgs = byName(html, "svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    for (const svg of svgs) expect(svg.attrs["aria-hidden"]).toBe("true");
  });

  it("makes only the links focusable, in order GitHub, LinkedIn, call to action", () => {
    const hrefs = focusable(html).map((t) => `${t.name}:${t.attrs.href}`);
    expect(hrefs).toEqual([
      "a:https://github.com/drcdev",
      "a:https://www.linkedin.com/in/drcdev",
      "a:/services/",
    ]);
  });

  it("gives the gradient border no accessible content", () => {
    const wrapper = tags(html).find((t) => classList(t).includes("bg-gradient-to-br"))!;
    expect(wrapper.name).toBe("div");
  });
});

describe("HomeIntro source order", () => {
  it("is photo, name, tagline, bio, GitHub, LinkedIn, call to action", () => {
    const at = [
      html.indexOf("<img"),
      html.indexOf("<h1"),
      html.indexOf(intro.tagline),
      html.indexOf(intro.bio),
      html.indexOf("https://github.com"),
      html.indexOf("https://www.linkedin.com"),
      html.indexOf('href="/services/"'),
    ];
    expect(at.every((n) => n >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(words().length).toBeGreaterThan(4);
  });
});
