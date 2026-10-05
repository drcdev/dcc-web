// Unit tests for merging page navigation entries with the fixed ones
// (data-model.md "NavigationItem"; contracts/build-errors.md row 15; FR-008,
// FR-025) and for the error message format (data-model.md "PageContentError").
import { describe, expect, it } from "vitest";
import { futureDestinations } from "../../../src/config/navigation.ts";
import { PageContentError, contentError } from "../../../src/lib/content/errors.ts";
import { mergeNavigation, type NavigationPage } from "../../../src/lib/content/navigation.ts";

const page = (file: string, address: string, title: string, nav?: NavigationPage["nav"]): NavigationPage => ({
  file: `src/content/pages/${file}`,
  address,
  title,
  nav,
});

const launchPages = [
  page("index.mdx", "/", "Don Coleman", { position: 1, label: "Home" }),
  page("services.mdx", "/services/", "Services", { position: 2 }),
  page("speaking.mdx", "/speaking/", "Speaking", { position: 3 }),
  page("about.mdx", "/about/", "About", { position: 6 }),
  page("privacy-policy.mdx", "/privacy-policy/", "Privacy policy"),
];

describe("mergeNavigation", () => {
  it("returns the seven launch items in order with the foundation's hrefs", () => {
    const items = mergeNavigation(launchPages);
    expect(items.map(({ label, href }) => [label, href])).toEqual([
      ["Home", "/"],
      ["Services", "/services/"],
      ["Speaking", "/speaking/"],
      ["Writing", "/writing/"],
      ["Projects", "/projects/"],
      ["About", "/about/"],
      ["Contact", "/contact/"],
    ]);
    expect(items.every((item) => item.kind === "primary")).toBe(true);
  });

  it("defaults the label to the page title", () => {
    const items = mergeNavigation([page("workshops.mdx", "/workshops/", "Workshops", { position: 8 })]);
    expect(items.map((item) => item.label)).toEqual(["Writing", "Projects", "Contact", "Workshops"]);
    expect(items.at(-1)?.href).toBe("/workshops/");
  });

  it("leaves out pages without nav", () => {
    const items = mergeNavigation([page("terms.mdx", "/terms/", "Terms")]);
    expect(items.map((item) => item.label)).toEqual(["Writing", "Projects", "Contact"]);
  });

  it("sorts by position whatever the order of the pages", () => {
    const items = mergeNavigation([...launchPages].reverse());
    expect(items.map((item) => item.position)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("fails when two pages use the same position, naming both files and the position", () => {
    const run = () =>
      mergeNavigation([
        page("a.mdx", "/a/", "A", { position: 2 }),
        page("b.mdx", "/b/", "B", { position: 2 }),
      ]);
    expect(run).toThrow(PageContentError);
    expect(run).toThrow("src/content/pages/a.mdx");
    expect(run).toThrow("src/content/pages/b.mdx");
    expect(run).toThrow("2");
  });

  it.each([
    [4, "Writing"],
    [5, "Projects"],
    [7, "Contact"],
  ])("fails when a page asks for fixed position %i, naming the page and the fixed entry", (position, label) => {
    const run = () => mergeNavigation([page("a.mdx", "/a/", "A", { position })]);
    expect(run).toThrow("src/content/pages/a.mdx");
    expect(run).toThrow(label);
    expect(run).toThrow("src/config/navigation.ts");
    expect(run).toThrow(String(position));
  });
});

describe("the Writing entry", () => {
  it("is still a fixed primary entry at /writing/ now that the blog builds that address", () => {
    const writing = mergeNavigation([]).find((item) => item.label === "Writing");
    expect(writing?.href).toBe("/writing/");
    expect(writing?.position).toBe(4);
    expect(futureDestinations).not.toContain("/writing/");
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
