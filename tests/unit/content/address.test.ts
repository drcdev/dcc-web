// Unit tests for page addresses (data-model.md "derived values" and invariants
// 3 and 9; contracts/build-errors.md rows 13, 14, 17; FR-003, FR-008).
import { describe, expect, it } from "vitest";
import {
  addressFromPath,
  assertUniqueAddresses,
  idFromPath,
} from "../../../src/lib/content/address.ts";

describe("addressFromPath", () => {
  it.each([
    ["index.mdx", "/"],
    ["about.mdx", "/about/"],
    ["about.md", "/about/"],
    ["x/index.mdx", "/x/"],
    ["legal/accessibility.mdx", "/legal/accessibility/"],
    ["legal/index.md", "/legal/"],
    ["a/b/c.mdx", "/a/b/c/"],
    ["privacy-policy.mdx", "/privacy-policy/"],
    ["2026-plan.mdx", "/2026-plan/"],
  ])("maps %s to %s", (path, address) => {
    expect(addressFromPath(path)).toBe(address);
  });

  it.each(["About_Me.mdx", "about me.mdx", "About.mdx", "legal/Notice.mdx", "Legal/notice.mdx", "a.b.mdx"])(
    "rejects %s with the file name and the naming rule",
    (path) => {
      expect(() => addressFromPath(path)).toThrow(path);
      expect(() => addressFromPath(path)).toThrow("lower-case letters, digits and hyphens");
    },
  );
});

describe("idFromPath", () => {
  it("gives the collection id: index for the home page, else the address without slashes at the ends", () => {
    expect(idFromPath("index.mdx")).toBe("index");
    expect(idFromPath("about.mdx")).toBe("about");
    expect(idFromPath("x/index.mdx")).toBe("x");
    expect(idFromPath("legal/accessibility.mdx")).toBe("legal/accessibility");
  });
});

describe("assertUniqueAddresses", () => {
  const check = (input: { pageFiles: string[]; routeFiles?: string[]; reserved?: string[] }) =>
    assertUniqueAddresses({ routeFiles: [], reserved: [], ...input });

  it("accepts distinct addresses", () => {
    expect(() =>
      check({
        pageFiles: ["index.mdx", "about.mdx", "legal/index.mdx", "legal/terms.mdx"],
        routeFiles: ["404.astro", "[...slug].astro"],
        reserved: ["/writing/"],
      }),
    ).not.toThrow();
  });

  it("fails for two page files with the same address, naming both and the address", () => {
    const run = () => check({ pageFiles: ["about.md", "about.mdx"] });
    expect(run).toThrow("Page files");
    expect(run).toThrow("src/content/pages/about.md");
    expect(run).toThrow("src/content/pages/about.mdx");
    expect(run).toThrow("/about/");
  });

  it("fails for x.mdx together with x/index.mdx", () => {
    const run = () => check({ pageFiles: ["x.mdx", "x/index.mdx"] });
    expect(run).toThrow("src/content/pages/x.mdx");
    expect(run).toThrow("src/content/pages/x/index.mdx");
    expect(run).toThrow("/x/");
  });

  it("fails for a page against a route file in src/pages", () => {
    const run = () => check({ pageFiles: ["404.mdx"], routeFiles: ["404.astro"] });
    expect(run).toThrow("src/content/pages/404.mdx");
    expect(run).toThrow("src/pages/404.astro");
    expect(run).toThrow("/404/");
  });

  it("fails for a page against a generated route file such as robots.txt.ts", () => {
    const run = () => check({ pageFiles: ["robots.mdx"], routeFiles: ["robots.txt.ts"] });
    expect(run).toThrow("src/content/pages/robots.mdx");
    expect(run).toThrow("src/pages/robots.txt.ts");
  });

  it("fails for the home page against src/pages/index.astro", () => {
    expect(() => check({ pageFiles: ["index.mdx"], routeFiles: ["index.astro"] })).toThrow("src/pages/index.astro");
  });

  it("fails for a page under the fixed prefix of a route with a variable part", () => {
    const run = () => check({ pageFiles: ["writing/intro.mdx"], routeFiles: ["writing/[slug].astro"] });
    expect(run).toThrow("src/content/pages/writing/intro.mdx");
    expect(run).toThrow("src/pages/writing/[slug].astro");
  });

  it("fails for a page file under the projects story route's prefix", () => {
    const run = () => check({ pageFiles: ["projects/x.md"], routeFiles: ["projects/[slug].astro"] });
    expect(run).toThrow("src/content/pages/projects/x.md");
    expect(run).toThrow("src/pages/projects/[slug].astro");
  });

  it("ignores the pages route itself and pages outside a variable route's prefix", () => {
    expect(() =>
      check({ pageFiles: ["about.mdx", "notes/x.mdx"], routeFiles: ["[...slug].astro", "writing/[slug].astro"] }),
    ).not.toThrow();
  });

  it.each(["/writing/", "/projects/", "/contact/"])("fails for reserved address %s", (address) => {
    const file = `${address.replaceAll("/", "")}.mdx`;
    const run = () => check({ pageFiles: [file], reserved: ["/writing/", "/projects/", "/contact/"] });
    expect(run).toThrow(`src/content/pages/${file}`);
    expect(run).toThrow("reserved");
    expect(run).toThrow(address);
  });

  it("reports an invalid file name before checking for conflicts", () => {
    expect(() => check({ pageFiles: ["About_Me.mdx"] })).toThrow("lower-case letters, digits and hyphens");
  });
});
