// Pagination: the "Pages" navigation of a listing (contracts/blog-pages.md
// "Pagination"; FR-012, FR-049).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Pagination from "../../../src/components/post/Pagination.astro";
import { byName, classList, tags } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (props: Record<string, unknown>) => container.renderToString(Pagination, { props });
const base = "/writing/all/";
const numbered = (html: string) => byName(html, "a").filter((a) => /^Page \d+$/.test(a.attrs["aria-label"] ?? ""));

describe("Pagination", () => {
  it("renders nothing for one page", async () => {
    expect((await render({ currentPage: 1, lastPage: 1, base })).trim()).toBe("");
  });

  it('is one <nav aria-label="Pages">', async () => {
    const navs = byName(await render({ currentPage: 2, lastPage: 3, base }), "nav");
    expect(navs).toHaveLength(1);
    expect(navs[0]!.attrs["aria-label"]).toBe("Pages");
  });

  it("has one link per other page number, named Page n, with page 1 at the bare address", async () => {
    const html = await render({ currentPage: 2, lastPage: 4, base });
    expect(numbered(html).map((a) => [a.attrs["aria-label"], a.attrs.href])).toEqual([
      ["Page 1", "/writing/all/"],
      ["Page 3", "/writing/all/3/"],
      ["Page 4", "/writing/all/4/"],
    ]);
  });

  it("shows every page number, never shortening the list", async () => {
    const html = await render({ currentPage: 1, lastPage: 15, base });
    expect(numbered(html)).toHaveLength(14);
    expect(html).not.toContain("…");
  });

  it("shows the current page as a link-free item with aria-current=page", async () => {
    const html = await render({ currentPage: 2, lastPage: 3, base });
    const current = tags(html).filter((t) => t.attrs["aria-current"] === "page");
    expect(current).toHaveLength(1);
    expect(current[0]!.name).not.toBe("a");
    expect(html.slice(current[0]!.index)).toMatch(/^<[a-z]+[^>]*>\s*2\s*</);
  });

  it("links Previous page and Next page in the middle", async () => {
    const links = byName(await render({ currentPage: 3, lastPage: 5, base }), "a");
    expect(links[0]!.attrs.href).toBe("/writing/all/2/");
    expect(links.at(-1)!.attrs.href).toBe("/writing/all/4/");
  });

  it("points Previous page from page 2 at the bare address", async () => {
    const html = await render({ currentPage: 2, lastPage: 3, base: "/writing/topics/agentic-ai/" });
    expect(byName(html, "a")[0]!.attrs.href).toBe("/writing/topics/agentic-ai/");
  });

  it("leaves Previous page out on the first page and Next page on the last, not disabled", async () => {
    const first = await render({ currentPage: 1, lastPage: 3, base });
    expect(first).not.toContain("Previous page");
    expect(first).toContain("Next page");
    const last = await render({ currentPage: 3, lastPage: 3, base });
    expect(last).toContain("Previous page");
    expect(last).not.toContain("Next page");
    expect(first + last).not.toContain("disabled");
  });

  it("gives every link a target of at least 24 by 24 CSS px", async () => {
    const html = await render({ currentPage: 2, lastPage: 3, base });
    for (const a of byName(html, "a")) expect(classList(a)).toEqual(expect.arrayContaining(["min-h-6", "min-w-6"]));
  });
});
