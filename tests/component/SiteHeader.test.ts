// Component tests for src/components/SiteHeader.astro via Astro's Container API
// (contracts/shell-dom.md "Header"; research R4, R6, R15; FR-004, FR-006,
// FR-007, FR-007a, FR-008a, FR-009).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SiteHeader from "../../src/components/SiteHeader.astro";
import type { NavigationItem } from "../../src/config/navigation.ts";
import { byName, classList, tags, type Tag } from "./html.ts";

const PRIMARY = [
  ["Home", "/"],
  ["Services", "/services/"],
  ["Speaking", "/speaking/"],
  ["Writing", "/writing/"],
  ["Projects", "/projects/"],
  ["About", "/about/"],
  ["Contact", "/contact/"],
] as const;

let container: AstroContainer;

const NAVIGATION: NavigationItem[] = PRIMARY.map(([label, href]) => ({ label, href, kind: "primary" }));

async function render(pathname: string, navigation: NavigationItem[] = NAVIGATION): Promise<string> {
  return container.renderToString(SiteHeader, {
    props: { navigation },
    request: new Request(`https://example.test${pathname}`),
  });
}

/** Text of the element that starts at `tag`, up to its matching close tag (non-nested use only). */
function innerText(html: string, tag: Tag): string {
  const start = tag.index + tag.raw.length;
  const end = html.indexOf(`</${tag.name}>`, start);
  return html
    .slice(start, end)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The <ul id="primary-nav-list"> and the links inside it, in source order. */
function navList(html: string) {
  const all = tags(html);
  const ul = all.find((t) => t.name === "ul" && t.attrs.id === "primary-nav-list");
  if (!ul) return { ul: undefined, links: [] as Tag[] };
  const end = html.indexOf("</ul>", ul.index);
  const links = all.filter((t) => t.name === "a" && t.index > ul.index && t.index < end);
  return { ul, links };
}

let home = "";
let services = "";

beforeAll(async () => {
  container = await AstroContainer.create();
  home = await render("/");
  services = await render("/services/");
});

describe("SiteHeader landmarks", () => {
  it("renders exactly one <header> containing one <nav aria-label=\"Main\">", () => {
    expect(byName(home, "header")).toHaveLength(1);
    const navs = byName(home, "nav");
    expect(navs).toHaveLength(1);
    expect(navs[0]!.attrs["aria-label"]).toBe("Main");
    expect(navs[0]!.index).toBeGreaterThan(byName(home, "header")[0]!.index);
  });
});

describe("SiteHeader site name", () => {
  it('is the first link, with text "Don Coleman" and href="/"', () => {
    const first = byName(home, "a")[0]!;
    expect(first.attrs.href).toBe("/");
    expect(innerText(home, first)).toBe("Don Coleman");
  });
});

describe("SiteHeader primary navigation", () => {
  it('renders one <ul id="primary-nav-list"> inside the nav', () => {
    const lists = byName(home, "ul").filter((t) => t.attrs.id === "primary-nav-list");
    expect(lists).toHaveLength(1);
    expect(lists[0]!.index).toBeGreaterThan(byName(home, "nav")[0]!.index);
    expect(home.indexOf("</nav>")).toBeGreaterThan(lists[0]!.index);
  });

  it("lists the seven primary links in order", () => {
    const { links } = navList(home);
    expect(links.map((a) => [innerText(home, a), a.attrs.href])).toEqual(PRIMARY.map((p) => [...p]));
  });

  it("keeps the list visible without JavaScript and collapses it only with the js class at phone width", () => {
    const { ul } = navList(home);
    const classes = classList(ul!);
    expect(classes).not.toContain("hidden");
    expect(classes).toContain("flex-wrap");
    expect(classes).toContain("js:max-md:hidden");
    expect(ul!.attrs.hidden).toBeUndefined();
  });
});

describe("SiteHeader current page", () => {
  it('marks only Home with aria-current="page" on /', () => {
    const { links } = navList(home);
    const current = links.filter((a) => a.attrs["aria-current"] === "page");
    expect(current.map((a) => a.attrs.href)).toEqual(["/"]);
  });

  it('marks only Services with aria-current="page" on /services/', () => {
    const { links } = navList(services);
    const current = links.filter((a) => a.attrs["aria-current"] === "page");
    expect(current.map((a) => a.attrs.href)).toEqual(["/services/"]);
  });

  it("gives the current link an underline that other links do not have (not colour alone)", () => {
    const { links } = navList(home);
    const [current, ...others] = links;
    expect(classList(current!)).toContain("underline");
    for (const other of others) expect(classList(other)).not.toContain("underline");
  });

  it("marks nothing as current on an address outside the navigation", async () => {
    const { links } = navList(await render("/nope/"));
    expect(links.filter((a) => a.attrs["aria-current"] !== undefined)).toHaveLength(0);
  });
});

describe("SiteHeader current section (FR-004)", () => {
  const writing = async (pathname: string) => navList(await render(pathname)).links.find((a) => a.attrs.href === "/writing/")!;

  it('marks Writing with aria-current="page" on /writing/ and gives it the current style', async () => {
    const link = await writing("/writing/");
    expect(link.attrs["aria-current"]).toBe("page");
    expect(classList(link)).toContain("underline");
  });

  it.each(["/writing/some-post/", "/writing/all/", "/writing/all/2/", "/writing/topics/agentic-ai/"])(
    'marks Writing with aria-current="true" and the same style on %s',
    async (pathname) => {
      const link = await writing(pathname);
      expect(link.attrs["aria-current"]).toBe("true");
      expect(classList(link)).toContain("underline");
    },
  );

  it("marks only one link, and leaves Writing unmarked elsewhere", async () => {
    const html = await render("/writing/some-post/");
    expect(navList(html).links.filter((a) => a.attrs["aria-current"] !== undefined)).toHaveLength(1);
    expect((await writing("/services/")).attrs["aria-current"]).toBeUndefined();
    expect((await writing("/writing-tips/")).attrs["aria-current"]).toBeUndefined();
  });
});

describe("SiteHeader menu button", () => {
  const button = () => byName(home, "button");

  it("renders one native button that discloses the list", () => {
    expect(button()).toHaveLength(1);
    const [b] = button();
    expect(b!.attrs.type).toBe("button");
    expect(b!.attrs["aria-controls"]).toBe("primary-nav-list");
    expect(b!.attrs["aria-expanded"]).toBe("false");
    expect(b!.attrs["aria-haspopup"]).toBeUndefined();
  });

  it('is named "Menu" by its text content', () => {
    const [b] = button();
    expect(b!.attrs["aria-label"]).toBeUndefined();
    expect(innerText(home, b!)).toBe("Menu");
  });

  it("contains a decorative SVG icon", () => {
    const [b] = button();
    const end = home.indexOf("</button>", b!.index);
    const svgs = byName(home, "svg").filter((s) => s.index > b!.index && s.index < end);
    expect(svgs).toHaveLength(1);
    expect(svgs[0]!.attrs["aria-hidden"]).toBe("true");
  });

  it("is hidden unless the js class is present and the viewport is below 48rem", () => {
    const classes = classList(button()[0]!);
    expect(classes).toContain("hidden");
    expect(classes.some((c) => /^js:max-md:(inline-)?flex$|^js:max-md:(inline-)?block$/.test(c))).toBe(true);
  });

  it("comes after the site name and before the navigation links in source order", () => {
    const [b] = button();
    const siteName = byName(home, "a")[0]!;
    const { ul } = navList(home);
    expect(b!.index).toBeGreaterThan(siteName.index);
    expect(b!.index).toBeLessThan(ul!.index);
  });
});

describe("SiteHeader leaves out Ghost-only pieces", () => {
  it("has no search, Subscribe, Sign in, Account or portal markup", () => {
    expect(home).not.toMatch(/data-ghost-search|data-portal|#\/portal/);
    const text = home.replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/\bSubscribe\b|\bSign in\b|\bAccount\b|\bSearch\b/i);
  });

  it("uses no inline event handlers (CSP)", () => {
    for (const t of tags(home)) {
      expect(Object.keys(t.attrs).filter((a) => a.startsWith("on"))).toEqual([]);
    }
  });
});

describe("SiteHeader navigation prop (FR-025, FR-025b)", () => {
  const custom: NavigationItem[] = [
    { label: "Alpha", href: "/alpha/", kind: "primary" },
    { label: "Beta", href: "/alpha/beta/", kind: "primary" },
  ];

  it("renders exactly the items it is given, in order", async () => {
    const html = await render("/", custom);
    const { links } = navList(html);
    expect(links.map((a) => [innerText(html, a), a.attrs.href])).toEqual([
      ["Alpha", "/alpha/"],
      ["Beta", "/alpha/beta/"],
    ]);
  });

  it('marks the section link with aria-current="true" on a page below it when no link is exact', async () => {
    const html = await render("/alpha/gamma/", custom);
    const { links } = navList(html);
    expect(links.filter((a) => a.attrs["aria-current"] === "page")).toHaveLength(0);
    expect(links.filter((a) => a.attrs["aria-current"] === "true").map((a) => a.attrs.href)).toEqual(["/alpha/"]);
  });

  it("marks the current page only on the exact address", async () => {
    const html = await render("/alpha/beta/", custom);
    const { links } = navList(html);
    expect(links.filter((a) => a.attrs["aria-current"] === "page").map((a) => a.attrs.href)).toEqual(["/alpha/beta/"]);
  });
});
