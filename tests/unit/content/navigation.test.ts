// Unit tests for building the header and footer menus from the page files
// (data-model.md "SiteNavigation"; contracts/page-settings.md V6, V11; FR-005, FR-008,
// FR-009) and for the error message format (data-model.md "PageContentError").
import { describe, expect, it } from "vitest";
import { PageContentError, contentError } from "../../../src/lib/content/errors.ts";
import { buildMenus, type NavigationPage } from "../../../src/lib/content/navigation.ts";

const page = (file: string, address: string, title: string, nav?: NavigationPage["nav"]): NavigationPage => ({
  file: `src/content/pages/${file}`,
  address,
  title,
  nav,
});

const launchPages = [
  page("index.mdx", "/", "Don Coleman", { location: "header", position: 1, label: "Home" }),
  page("work-with-me.mdx", "/work-with-me/", "Work with me", { location: "header", position: 2 }),
  page("writing.mdx", "/writing/", "Writing", { location: "header", position: 4 }),
  page("projects.mdx", "/projects/", "Projects", { location: "header", position: 5 }),
  page("about.mdx", "/about/", "About", { location: "header", position: 6 }),
  page("contact.mdx", "/contact/", "Contact", { location: "header", position: 7 }),
  page("privacy-policy.mdx", "/privacy-policy/", "Privacy policy", { location: "footer", position: 1 }),
  page("terms-of-use.mdx", "/terms-of-use/", "Terms of use", { location: "footer", position: 2 }),
  page("technology.mdx", "/technology/", "Technology", { location: "footer", position: 3 }),
  page("privacy/example-app.mdx", "/privacy/example-app/", "Example app privacy"),
];

describe("buildMenus", () => {
  it("splits the entries by location and orders each menu by position", () => {
    const { header, footer } = buildMenus([...launchPages].reverse());
    expect(header.map(({ label, href }) => [label, href])).toEqual([
      ["Home", "/"],
      ["Work with me", "/work-with-me/"],
      ["Writing", "/writing/"],
      ["Projects", "/projects/"],
      ["About", "/about/"],
      ["Contact", "/contact/"],
    ]);
    expect(footer.map(({ label, href }) => [label, href])).toEqual([
      ["Privacy policy", "/privacy-policy/"],
      ["Terms of use", "/terms-of-use/"],
      ["Technology", "/technology/"],
    ]);
    expect(header.every((item) => item.kind === "primary")).toBe(true);
    expect(footer.every((item) => item.kind === "footer")).toBe(true);
  });

  it("defaults the label to the page title and keeps an explicit label", () => {
    const { header } = buildMenus(launchPages);
    expect(header.find((item) => item.href === "/")?.label).toBe("Home");
    expect(header.find((item) => item.href === "/about/")?.label).toBe("About");
  });

  it("leaves out pages without nav", () => {
    const { header, footer } = buildMenus(launchPages);
    expect([...header, ...footer].some((item) => item.href === "/privacy/example-app/")).toBe(false);
  });

  it("records the page file as the source of each item", () => {
    const { header } = buildMenus(launchPages);
    expect(header[0]?.source).toBe("src/content/pages/index.mdx");
  });

  it("returns an empty array for a menu with no entries", () => {
    expect(buildMenus([])).toEqual({ header: [], footer: [] });
    const onlyHeader = buildMenus([page("a.mdx", "/a/", "A", { location: "header", position: 1 })]);
    expect(onlyHeader.footer).toEqual([]);
  });

  it("allows the same position in the header and the footer", () => {
    const { header, footer } = buildMenus([
      page("a.mdx", "/a/", "A", { location: "header", position: 1 }),
      page("b.mdx", "/b/", "B", { location: "footer", position: 1 }),
    ]);
    expect(header).toHaveLength(1);
    expect(footer).toHaveLength(1);
  });

  it("fails when two pages use one position in a menu, naming both files in path order, the menu and the position", () => {
    const run = () =>
      buildMenus([
        page("b.mdx", "/b/", "B", { location: "header", position: 2 }),
        page("a.mdx", "/a/", "A", { location: "header", position: 2 }),
      ]);
    expect(run).toThrow(PageContentError);
    expect(run).toThrow(
      "Page files src/content/pages/a.mdx and src/content/pages/b.mdx: both use header position 2. Change the position in one of them.",
    );
  });

  it("reports the first pair of a three-way clash", () => {
    const run = () =>
      buildMenus([
        page("c.mdx", "/c/", "C", { location: "footer", position: 3 }),
        page("a.mdx", "/a/", "A", { location: "footer", position: 3 }),
        page("b.mdx", "/b/", "B", { location: "footer", position: 3 }),
      ]);
    expect(run).toThrow("src/content/pages/a.mdx and src/content/pages/b.mdx: both use footer position 3");
  });

  it("fails when two entries in one menu show the same link text, ignoring case and spaces (V11)", () => {
    const run = () =>
      buildMenus([
        page("a.mdx", "/a/", "Notes", { location: "header", position: 1 }),
        page("b.mdx", "/b/", "Other", { location: "header", position: 2, label: "  notes " }),
      ]);
    expect(run).toThrow(PageContentError);
    expect(run).toThrow(
      'Page files src/content/pages/a.mdx and src/content/pages/b.mdx: both show "Notes" in the header. Give one of them a different label.',
    );
  });

  it("allows the same link text in the header and the footer", () => {
    expect(() =>
      buildMenus([
        page("a.mdx", "/a/", "Notes", { location: "header", position: 1 }),
        page("b.mdx", "/b/", "Notes", { location: "footer", position: 1 }),
      ]),
    ).not.toThrow();
  });
});

describe("PageContentError messages", () => {
  it("starts a one-file message with `Page file <path>:`", () => {
    const error = contentError("page", "src/content/pages/a.mdx", "the title is missing");
    expect(error).toBeInstanceOf(PageContentError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Page file src/content/pages/a.mdx: the title is missing");
  });

  it("starts a two-file message with `Page files <a> and <b>:`", () => {
    const error = contentError("page", ["a.mdx", "b.mdx"], "they share an address");
    expect(error.message).toBe("Page files a.mdx and b.mdx: they share an address");
  });
});
