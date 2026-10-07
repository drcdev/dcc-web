// Unit tests for page, post and project addresses and slugs, and the checks that nothing else
// claims them (data-model.md "derived values" and invariants; contracts/build-errors.md page rows
// 13, 14, 17, post rows P13 to P17, project rows 26 and 27; FR-003, FR-008).
import { globSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { PageContentError } from "../../../src/lib/content/errors.ts";
import {
  addressFromPath,
  assertNoTwin,
  assertPageAddressesFree,
  assertPostFiles,
  idFromPath,
  postHref,
  projectHref,
  slugFromPath,
  slugFromPostPath,
} from "../../../src/lib/content/addresses.ts";

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

describe("slugFromPostPath and postHref", () => {
  it("returns the file name without .mdx", () => {
    expect(slugFromPostPath("my-first-post.mdx")).toBe("my-first-post");
    expect(slugFromPostPath("2026-recap.mdx")).toBe("2026-recap");
  });

  it("also drops .md, so a wrong extension is still seen as the same slug", () => {
    expect(slugFromPostPath("x.md")).toBe("x");
  });

  it("builds the address /writing/{slug}/", () => {
    expect(postHref("my-first-post")).toBe("/writing/my-first-post/");
  });

  it("builds the project address /projects/{slug}/", () => {
    expect(projectHref("x")).toBe("/projects/x/");
  });
});

describe("slugFromPath (projects)", () => {
  it.each([
    ["example-project.mdx", "example-project"],
    ["example-project.md", "example-project"],
    ["2026-plan.mdx", "2026-plan"],
  ])("maps %s to %s", (path, slug) => {
    expect(slugFromPath(path)).toBe(slug);
  });

  it.each(["Example.mdx", "example project.mdx", "example_project.mdx", "a.b.mdx", `${"a".repeat(65)}.mdx`, ".mdx"])(
    "rejects %s with the file name and the naming rule",
    (path) => {
      expect(() => slugFromPath(path)).toThrow(path);
      expect(() => slugFromPath(path)).toThrow("lower-case letters, digits and hyphens");
    },
  );

  it("rejects a nested file", () => {
    expect(() => slugFromPath("x/y.mdx")).toThrow("x/y.mdx");
    expect(() => slugFromPath("x/y.mdx")).toThrow(PageContentError);
    expect(() => slugFromPath("x/y.mdx")).toThrow("not in a subfolder");
  });
});

describe("assertNoTwin", () => {
  const root = mkdtempSync(join(tmpdir(), "twin-test-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const folder = (name: string, files: string[]): string => {
    const base = join(root, name);
    for (const file of files) {
      mkdirSync(dirname(join(base, file)), { recursive: true });
      writeFileSync(join(base, file), "x");
    }
    return base;
  };

  const pages = folder("pages", ["about.md", "about.mdx", "x.mdx", "x/index.mdx", "solo.mdx", "legal/index.mdx", "_t.mdx"]);
  const posts = folder("posts", ["x.mdx", "x.md", "a-post.mdx", "_template.mdx"]);
  const projects = folder("projects", ["x.md", "x.mdx", "a-project.mdx", "_template.mdx"]);

  it("fails for two page files with the same address, naming both and the address (row 13)", () => {
    const run = () => assertNoTwin("page", pages, "about.md");
    expect(run).toThrow(PageContentError);
    expect(run).toThrow(
      "Page files src/content/pages/about.md and src/content/pages/about.mdx: both make the address /about/. Keep one of them.",
    );
  });

  it("fails for x.mdx together with x/index.mdx, with the same message from either entry (row 13)", () => {
    const message =
      "Page files src/content/pages/x.mdx and src/content/pages/x/index.mdx: both make the address /x/. Keep one of them.";
    expect(() => assertNoTwin("page", pages, "x.mdx")).toThrow(message);
    expect(() => assertNoTwin("page", pages, "x/index.mdx")).toThrow(message);
  });

  it("fails for two post files with one slug, naming both files and the address (P17)", () => {
    const message =
      "Post files src/content/posts/x.md and src/content/posts/x.mdx: both make the address /writing/x/. Keep one of them.";
    expect(() => assertNoTwin("post", posts, "x.mdx")).toThrow(message);
    expect(() => assertNoTwin("post", posts, "x.md")).toThrow(message);
  });

  it("fails for two project files with one slug, naming both files and the slug (row 26)", () => {
    const message =
      "Project files src/content/projects/x.md and src/content/projects/x.mdx: both make the slug x. Keep one of them.";
    expect(() => assertNoTwin("project", projects, "x.mdx")).toThrow(message);
    expect(() => assertNoTwin("project", projects, "x.md")).toThrow(message);
  });

  it("accepts a file with no twin, in every collection", () => {
    expect(() => assertNoTwin("page", pages, "solo.mdx")).not.toThrow();
    expect(() => assertNoTwin("page", pages, "legal/index.mdx")).not.toThrow();
    expect(() => assertNoTwin("post", posts, "a-post.mdx")).not.toThrow();
    expect(() => assertNoTwin("project", projects, "a-project.mdx")).not.toThrow();
  });

  it("does not treat a template file as a twin of anything", () => {
    expect(() => assertNoTwin("post", posts, "a-post.mdx")).not.toThrow();
    expect(() => assertNoTwin("project", projects, "a-project.mdx")).not.toThrow();
  });
});

describe("assertPageAddressesFree", () => {
  const check = (input: { pageFiles: string[]; routeFiles?: string[] }) =>
    assertPageAddressesFree({ routeFiles: [], ...input });

  it("accepts distinct addresses", () => {
    expect(() =>
      check({
        pageFiles: ["index.mdx", "about.mdx", "legal/index.mdx", "legal/terms.mdx"],
        routeFiles: ["404.astro", "[...slug].astro"],
      }),
    ).not.toThrow();
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

  it("reports an invalid file name before checking for conflicts", () => {
    expect(() => check({ pageFiles: ["About_Me.mdx"] })).toThrow("lower-case letters, digits and hyphens");
  });

  it("row 14: page addresses against the real route files (/projects/ prefix)", () => {
    // The same pattern as the pages route's import.meta.glob, minus the route itself.
    const routeFiles = globSync("**/*.{astro,md,mdx,ts,js}", { cwd: "src/pages" })
      .map((path) => path.replaceAll("\\", "/"))
      .filter((path) => path !== "[...slug].astro");
    const real = { routeFiles };

    const notFound = () => assertPageAddressesFree({ ...real, pageFiles: ["404.mdx"] });
    expect(notFound).toThrow("src/content/pages/404.mdx");
    expect(notFound).toThrow("src/pages/404.astro");
    expect(notFound).toThrow("/404/");

    const writing = () => assertPageAddressesFree({ ...real, pageFiles: ["writing.mdx"] });
    expect(writing).toThrow("src/content/pages/writing.mdx");
    expect(writing).toThrow("src/pages/writing/");

    const projects = () => assertPageAddressesFree({ ...real, pageFiles: ["projects.mdx"] });
    expect(projects).toThrow("src/content/pages/projects.mdx");
    expect(projects).toThrow("src/pages/projects/");

    const workshops = () => assertPageAddressesFree({ ...real, pageFiles: ["projects/workshops.mdx"] });
    expect(workshops).toThrow("src/content/pages/projects/workshops.mdx");
    expect(workshops).toThrow("src/pages/projects/[slug].astro");

    // The landing files are menu settings, not pages: the pages route leaves them out (029).
    const pageFiles = globSync("**/*.{md,mdx}", { cwd: "src/content/pages" })
      .map((path) => path.replaceAll("\\", "/"))
      .filter((path) => !/^(writing|projects)\.mdx?$/.test(path));
    expect(pageFiles.length).toBeGreaterThan(0);
    expect(() => assertPageAddressesFree({ ...real, pageFiles })).not.toThrow();
  });
});

describe("assertPostFiles", () => {
  const check = (...files: string[]) => () => assertPostFiles(files);

  it("accepts top-level .mdx files with valid names, and anything under images/", () => {
    expect(check("a.mdx", "b-2.mdx", "images/a.png", "images/deep/b.jpg", "images/notes.mdx")).not.toThrow();
    expect(check()).not.toThrow();
  });

  it("rejects a .md file, naming the file and saying to rename it to .mdx (P13)", () => {
    const run = check("notes.md");
    expect(run).toThrow("src/content/posts/notes.md");
    expect(run).toThrow("rename it to .mdx");
  });

  it("rejects a post in a sub-folder, naming the file and the sub-folder (P14)", () => {
    const run = check("2026/recap.mdx");
    expect(run).toThrow("src/content/posts/2026/recap.mdx");
    expect(run).toThrow("sub-folder");
  });

  it.each(["My Post.mdx", "my_post.mdx", "MyPost.mdx", "post!.mdx", "café.mdx"])("rejects the file name %s (P15)", (name) => {
    const run = check(name);
    expect(run).toThrow(`src/content/posts/${name}`);
    expect(run).toThrow("lower-case letters, digits and hyphens");
  });

  it.each(["all", "topics"])("rejects the reserved slug %s, naming the address (P16)", (slug) => {
    const run = check(`${slug}.mdx`);
    expect(run).toThrow(`src/content/posts/${slug}.mdx`);
    expect(run).toThrow(`/writing/${slug}/`);
    expect(run).toThrow("reserved");
  });

  it.each(["drift", "convergence"])("rejects the series slug %s, naming the address (P25)", (slug) => {
    const run = check(`${slug}.mdx`);
    expect(run).toThrow(`src/content/posts/${slug}.mdx`);
    expect(run).toThrow(`/writing/${slug}/`);
    expect(run).toThrow("reserved for the series page");
  });

  it.each(["all", "topics"])("says listing page for %s", (slug) => {
    expect(check(`${slug}.mdx`)).toThrow("reserved for a listing page");
  });

  it("errors start with Post file", () => {
    expect(check("x.md")).toThrow(/^Post file src\/content\/posts\/x\.md: /);
  });
});
