// The menus of a real build (specs/029-page-visible-draft: US3 scenario 7, US1 scenario 4, FR-011).
// Only a build shows every built page at once, so this compares the header and footer links of
// each built page, the not-found page included, with the menus computed from the page files by
// tests/helpers/content.ts. Production and preview each build the hidden-page fixture
// (`visible: false`, footer 9) beside the real pages.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";
import { menusOf, readEntries, type MenuLink } from "../helpers/content.ts";

const hidden = readEntries("pages", "tests/fixtures/pages").filter((entry) => entry.file.endsWith("/hidden-page.mdx"));

const builds: Record<"production" | "preview", FixtureSiteResult> = {} as never;

beforeAll(async () => {
  // One after the other: parallel builds starve each other when the build suite runs at once.
  builds.production = await buildFixtureSite(["hidden-page.mdx"], { env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" } });
  builds.preview = await buildFixtureSite(["hidden-page.mdx"], { env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "some-branch" } });
}, 900_000);

afterAll(() => {
  for (const build of Object.values(builds)) build?.cleanup();
});

const links = (html: string): MenuLink[] =>
  [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    label: m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    href: m[1]!,
  }));

/** The header links and the footer page links of one built page; null when the page has no shell. */
function shellMenus(html: string): { header: MenuLink[]; footer: MenuLink[] } | null {
  const header = /<ul[^>]+id="primary-nav-list"[\s\S]*?<\/ul>/.exec(html)?.[0];
  // The site footer is the last <footer>: a post or project story may hold its own inside <main>.
  const footerStart = html.lastIndexOf("<footer");
  const footer = footerStart === -1 ? undefined : html.slice(footerStart, html.indexOf("</footer>", footerStart));
  if (!header || !footer) return null;
  // The page links are the footer's first list; the social links follow the theme switch, outside it.
  const list = /<ul[\s\S]*?<\/ul>/.exec(footer)?.[0] ?? "";
  return { header: links(header), footer: links(list) };
}

describe("production menus", () => {
  it("builds", () => expect(builds.production.message).toBe(""));

  it("show the menus computed from the page files on every built page, the not-found page included", () => {
    const expected = menusOf({ production: true }, hidden);
    const files = builds.production.htmlFiles();
    expect(files.has("404.html"), "the not-found page is built").toBe(true);
    let checked = 0;
    for (const [path, html] of files) {
      const found = shellMenus(html);
      if (!found) continue;
      checked++;
      expect(found.header, `${path} header`).toEqual(expected.header);
      expect(found.footer, `${path} footer`).toEqual(expected.footer);
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("leave the not-visible fixture out of the footer", () => {
    const found = shellMenus(builds.production.read("index.html"))!;
    expect(found.footer.map((link) => link.href)).not.toContain("/hidden-page/");
  });
});

describe("preview menus", () => {
  it("builds", () => expect(builds.preview.message).toBe(""));

  it("link the not-visible fixture in the footer, in position order", () => {
    const expected = menusOf({ production: false }, hidden);
    expect(expected.footer.at(-1)?.href).toBe("/hidden-page/");
    for (const path of ["index.html", "about/index.html", "404.html"]) {
      const found = shellMenus(builds.preview.read(path))!;
      expect(found.footer, path).toEqual(expected.footer);
      expect(found.header, path).toEqual(expected.header);
    }
  });
});
