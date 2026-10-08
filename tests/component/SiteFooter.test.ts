// Component tests for src/components/SiteFooter.astro via Astro's Container API
// (contracts/shell-dom.md "Footer"; research R4, R15; FR-004, FR-008, FR-008a,
// FR-010a).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SiteFooter from "../../src/components/SiteFooter.astro";
import { byName, focusable, tags, textOf, type Tag } from "./html.ts";

const NAVIGATION = [
  { label: "Privacy policy", href: "/privacy-policy/", kind: "footer" },
  { label: "Terms of use", href: "/terms-of-use/", kind: "footer" },
  { label: "Technology", href: "/technology/", kind: "footer" },
] as const;

let html = "";
let emptyHtml = "";

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(SiteFooter, {
    props: { navigation: [...NAVIGATION] },
    request: new Request("https://example.test/"),
  });
  emptyHtml = await container.renderToString(SiteFooter, {
    props: { navigation: [] },
    request: new Request("https://example.test/"),
  });
});

/** Text of the element that starts at `tag`, up to its matching close tag (non-nested use only). */
function innerText(tag: Tag): string {
  const start = tag.index + tag.raw.length;
  const end = html.indexOf(`</${tag.name}>`, start);
  return html
    .slice(start, end)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function link(href: string): Tag {
  const found = byName(html, "a").filter((a) => a.attrs.href === href);
  expect(found, href).toHaveLength(1);
  return found[0]!;
}

describe("SiteFooter landmark", () => {
  it("renders exactly one <footer>", () => {
    expect(byName(html, "footer")).toHaveLength(1);
  });

  it("links the site name home", () => {
    const first = byName(html, "a")[0]!;
    expect(first.attrs.href).toBe("/");
    expect(innerText(first)).toBe("Don Coleman");
  });
});

describe("SiteFooter links", () => {
  it.each([
    ["/privacy-policy/", "Privacy policy"],
    ["/terms-of-use/", "Terms of use"],
    ["/technology/", "Technology"],
  ])("links to %s", (href, text) => {
    expect(innerText(link(href))).toBe(text);
  });

  it.each([
    ["https://github.com/drcdev", "GitHub"],
    ["https://www.linkedin.com/in/drcdev", "LinkedIn"],
  ])("links to %s named %s with a decorative icon", (href, name) => {
    const a = link(href);
    expect(a.attrs["aria-label"]).toBeUndefined();
    expect(innerText(a)).toBe(name);
    const end = html.indexOf("</a>", a.index);
    const svgs = byName(html, "svg").filter((s) => s.index > a.index && s.index < end);
    expect(svgs).toHaveLength(1);
    expect(svgs[0]!.attrs["aria-hidden"]).toBe("true");
  });

  it("puts the site links, then the theme switch, then the social links in source order", () => {
    const order = focusable(html).map((t) => (t.name === "button" ? "button" : t.attrs.href));
    expect(order).toEqual([
      "/",
      "/privacy-policy/",
      "/terms-of-use/",
      "/technology/",
      "button",
      "https://github.com/drcdev",
      "https://www.linkedin.com/in/drcdev",
    ]);
  });
});

describe("SiteFooter copyright", () => {
  it("states the build year and Don's name", () => {
    const text = textOf(html, "footer")!;
    expect(text).toContain(`© ${new Date().getFullYear()} Don Coleman. All rights reserved.`);
  });
});

describe("SiteFooter theme switch", () => {
  it("includes the theme switch button", () => {
    const buttons = byName(html, "button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.attrs["data-theme-toggle"]).toBeDefined();
  });
});

describe("SiteFooter leaves out Ghost-only and unused pieces", () => {
  it("has no Subscribe, Account, portal, Facebook or X links", () => {
    expect(html).not.toMatch(/#\/portal|facebook\.com|twitter\.com|x\.com/i);
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/\bSubscribe\b|\bAccount\b|\bFacebook\b|\bTwitter\b/i);
  });

  it("uses no inline event handlers (CSP)", () => {
    for (const t of tags(html)) {
      expect(Object.keys(t.attrs).filter((a) => a.startsWith("on"))).toEqual([]);
    }
  });
});

// FR-006a, SC-006: an empty footer menu leaves out the page-link list and nothing else.
describe("SiteFooter with no page links", () => {
  it("renders no list of page links", () => {
    expect(byName(emptyHtml, "ul")).toHaveLength(0);
    expect(emptyHtml).not.toContain("/privacy-policy/");
  });

  it("keeps the site name, copyright, theme switch and social links", () => {
    expect(byName(emptyHtml, "footer")).toHaveLength(1);
    expect(textOf(emptyHtml, "footer")).toContain(`© ${new Date().getFullYear()} Don Coleman. All rights reserved.`);
    expect(byName(emptyHtml, "a")[0]!.attrs.href).toBe("/");
    expect(byName(emptyHtml, "button")).toHaveLength(1);
    const hrefs = byName(emptyHtml, "a").map((a) => a.attrs.href);
    expect(hrefs).toContain("https://github.com/drcdev");
    expect(hrefs).toContain("https://www.linkedin.com/in/drcdev");
  });
});
