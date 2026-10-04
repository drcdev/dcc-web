// The local fixture site: one shared set of default-environment builds (verify-gate phase 2, D2).
// Each build runs once in `beforeAll`, one after the other (parallel builds starve each other when
// the whole build suite runs at once), and every describe below reads from those results. The
// describes were separate files before; each keeps the contract it was written for:
//   - a page that is one file (SC-002, US3), a post that is one file, a project that is one file (SC-004, US7)
//   - class-based syntax highlighting under the page policy (008-blog T003, T031; FR-053)
//   - the page policy of project pages (FR-047; no frame source since 014)
//   - a story with a picture on every part (014), the story of an every-setting project (US1, FR-080)
//   - `getPostSummaries` in a real build (T017, T020; R3, R6)
//   - things that are not errors, and posts that must build (contracts/build-errors.md)
//   - drafts in a local or test build (SC-004, FR-032, FR-045, FR-046)
//   - the harness does not leak the runner's WORKERS_CI into a build
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteOptions, type FixtureSiteResult } from "./fixture-site.ts";

// L1: the default environment, with every page, post and project the describes below need.
// L2: L1 with one word changed in workshops.mdx. L3: L1 plus one new project file.
// Code baseline: code-spike with Astro's default Shiki configuration. Code broken: code-spike
// with a token colour that has no class.
let l1: FixtureSiteResult;
let l2: FixtureSiteResult;
let l3: FixtureSiteResult;
let codeBaseline: FixtureSiteResult;
let codeBroken: FixtureSiteResult;

const route = `import { getPostSummaries } from "../lib/posts.ts";
export async function GET() {
  const posts = await getPostSummaries();
  return new Response(JSON.stringify(posts.map((p) => ({ slug: p.slug, draft: p.draft, minutesRead: p.minutesRead, href: p.href }))));
}
`;

const codeFixture = { from: "../posts/valid/code-spike.mdx", to: "code-spike.mdx" };

const l1Options: FixtureSiteOptions = {
  posts: [
    "valid/published.mdx",
    "valid/draft.mdx",
    "valid/text-only.mdx",
    // Dated earlier than published so the home page's three newest posts still include it.
    { from: "valid/unknown-language.mdx", replace: ["2026-08-27", "2026-08-09"] },
    "valid/untagged.mdx",
    "valid/free-form-only.mdx",
    "valid/series-and-free-form.mdx",
    { from: "valid/published.mdx", to: "future-post.mdx", replace: ["2026-08-27", "2099-01-01"] },
  ],
  projects: ["minimal.mdx", "every-setting.mdx", "every-part.mdx"],
  overrides: { "src/pages/summaries.json.ts": route },
};

beforeAll(async () => {
  // The runner's own WORKERS_CI and WORKERS_CI_BRANCH are set while L1 builds. The harness must not
  // pass them on, so L1 still shows the draft post and the Draft label (replaces the fixture-site
  // "does not leak" build).
  const saved = { ci: process.env.WORKERS_CI, branch: process.env.WORKERS_CI_BRANCH };
  process.env.WORKERS_CI = "1";
  process.env.WORKERS_CI_BRANCH = "main";
  try {
    l1 = await buildFixtureSite(["workshops.mdx", codeFixture], l1Options);
  } finally {
    if (saved.ci === undefined) delete process.env.WORKERS_CI;
    else process.env.WORKERS_CI = saved.ci;
    if (saved.branch === undefined) delete process.env.WORKERS_CI_BRANCH;
    else process.env.WORKERS_CI_BRANCH = saved.branch;
  }
  l2 = await buildFixtureSite([{ from: "workshops.mdx", replace: ["ordinary", "plain"] }, codeFixture], l1Options);
  l3 = await buildFixtureSite(["workshops.mdx", codeFixture], {
    ...l1Options,
    projects: [...l1Options.projects!, { from: "every-setting.mdx", to: "brand-new.mdx" }],
  });
  codeBaseline = await buildFixtureSite([codeFixture], {
    overrides: { "astro.config.mjs": (config) => config.replace(/\n[ \t]*shikiConfig:[^\n]*/, "") },
  });
  codeBroken = await buildFixtureSite([codeFixture], {
    overrides: {
      "src/lib/markdown/shiki-theme.ts": (theme) =>
        theme.replace(
          "settings: { foreground: colourOf(cls) },",
          'settings: { foreground: cls === "hl-comment" ? "#0a0b0c" : colourOf(cls) },',
        ),
    },
  });
}, 900_000);

afterAll(() => {
  for (const build of [l1, l2, l3, codeBaseline, codeBroken]) build?.cleanup();
});

const robotsMeta = (html: string) => /<meta[^>]+name="robots"[^>]*>/.exec(html)?.[0] ?? "";
const navList = (html: string) => /<ul[^>]+id="primary-nav-list"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? "";
// The current-page marker is `aria-current` plus underline styling; strip both so
// only the list of items is compared.
const withoutCurrent = (html: string) =>
  html.replace(/\s+aria-current="page"/g, "").replace(/<a href="([^"]*)" class="[^"]*"/g, '<a href="$1"');
const policyOf = (html: string) =>
  html.match(/<meta[^>]+http-equiv="content-security-policy"[^>]+content="([^"]*)"/i)?.[1] ?? "";
const cspOf = (html: string) =>
  /<meta[^>]+http-equiv="content-security-policy"[^>]*content="([^"]*)"/i.exec(html)?.[1] ?? "";
const codeBlocks = (html: string) => html.match(/<pre[^>]*class="[^"]*astro-code[^"]*"[\s\S]*?<\/pre>/g) ?? [];
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;
const written = (build: FixtureSiteResult, path: string) => (existsSync(join(build.dist, path)) ? build.read(path) : "");

describe("the local site", () => {
  it("builds", () => {
    expect(l1.message).toBe("");
    expect(l1.ok).toBe(true);
  });

  it("does not leak WORKERS_CI from the test runner's own environment into a build", () => {
    expect(l1.message).toBe("");
    expect(l1.read("sitemap-0.xml")).toContain("https://doncoleman.ca/");
    expect(l1.read("sitemap-0.xml")).not.toContain("new.doncoleman.ca");
  });
});

describe("a page that is one file", () => {
  it("publishes /workshops/ with its metadata, a sitemap entry and unchanged navigation", () => {
    const html = l1.read("workshops/index.html");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*Workshops\s*<\/h1>/);
    expect(html).toContain("Half-day and full-day workshops on systems leadership.");
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/workshops\/"/);
    expect(html).toMatch(/<meta[^>]+property="og:image"[^>]+content="[^"]*og-default\.png"/);

    const sitemap = l1.read("sitemap-0.xml");
    expect(sitemap).toContain("/workshops/");

    // Header navigation is the launch navigation: no entry for the new page.
    const about = l1.read("about/index.html");
    expect(navList(html)).not.toContain("Workshops");
    expect(withoutCurrent(navList(html))).toBe(withoutCurrent(navList(about)));

    // Not a draft: no notice, and the robots meta matches a draft launch page's (Services is
    // still a draft; About went live with feature 010).
    const services = l1.read("services/index.html");
    expect(html).not.toContain("data-draft-notice");
    expect(services).toContain("data-draft-notice");
    expect(robotsMeta(html)).not.toBe("");
    expect(robotsMeta(html)).toBe(robotsMeta(services));
  });

  it("changes only its own HTML file when one word in it changes", () => {
    expect(l2.ok, l2.message).toBe(true);
    const before = l1.htmlFiles();
    const after = l2.htmlFiles();

    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
    const changed = [...after.keys()].filter((path) => before.get(path) !== after.get(path));
    expect(changed).toEqual(["workshops/index.html"]);
  });

  // The wiring for contract row 15 (two pages with the same navigation position): the header holds
  // the About entry, which comes only from src/content/pages/about.mdx's `nav` setting, between the
  // fixed Projects and Contact entries.
  it("lists the page-sourced About entry in the header, between Projects and Contact", () => {
    const nav = navList(l1.read("workshops/index.html"));
    const labels = [...nav.matchAll(/<a\b[^>]*>\s*([^<]*?)\s*<\/a>/g)].map((m) => m[1]);
    expect(labels).toContain("About");
    expect(labels.indexOf("Projects")).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf("About")).toBeGreaterThan(labels.indexOf("Projects"));
    expect(labels.indexOf("About")).toBeLessThan(labels.indexOf("Contact"));
  });
});

describe("a post that is one file", () => {
  it("builds", () => {
    expect(l1.message).toBe("");
    expect(l1.ok).toBe(true);
  });

  it("publishes /writing/{slug}/ with its own title, description and canonical address", () => {
    const html = l1.read("writing/published/index.html");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*A published post\s*<\/h1>/);
    expect(html).toContain("A published post used by the build tests.");
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/writing\/published\/"/);
    expect(html).not.toContain("data-draft-notice");
  });

  it("adds the post to the sitemap", () => {
    expect(l1.read("sitemap-0.xml")).toContain("/writing/published/");
  });

  it("lists the post on the landing page", () => {
    expect(l1.read("writing/index.html")).toContain('href="/writing/published/"');
  });

  it("lists the post on the all posts page (Phase 6)", () => {
    expect(l1.read("writing/all/index.html")).toContain('href="/writing/published/"');
  });

  it("lists the post on the page of its topic (Phase 6)", () => {
    expect(l1.read("writing/topics/agentic-ai/index.html")).toContain('href="/writing/published/"');
  });

  it("adds the post to the feed (Phase 8)", () => {
    expect(l1.read("writing/rss.xml")).toContain("/writing/published/");
  });

  it("adds the post to the home page section (Phase 9)", () => {
    expect(l1.read("index.html")).toContain('href="/writing/published/"');
  });

  it("publishes a post dated in the future like any other (no scheduling)", () => {
    expect(l1.read("writing/future-post/index.html")).toMatch(/<h1[^>]*>\s*A published post\s*<\/h1>/);
    expect(l1.read("sitemap-0.xml")).toContain("/writing/future-post/");
    expect(l1.read("writing/index.html")).toContain('href="/writing/future-post/"');
  });
});

describe("a project that is one file", () => {
  it("publishes the story and lists it on the index, touching no other page", () => {
    expect(l3.ok, l3.message).toBe(true);
    const before = l1.htmlFiles();
    const after = l3.htmlFiles();

    const story = after.get("projects/brand-new/index.html") ?? "";
    expect(story).toContain("Every setting");
    expect(after.get("projects/index.html")).toContain("/projects/brand-new/");
    expect(l3.read("sitemap-0.xml")).toContain("/projects/brand-new/");

    const changed = [...after.keys()].filter((path) => before.get(path) !== after.get(path)).sort();
    const expected = ["projects/brand-new/index.html", "projects/index.html"];
    // Other pages may only differ by the header or footer if navigation listed projects; it does not.
    expect(changed).toEqual(expected);
  });
});

describe("class-based syntax highlighting with the production configuration", () => {
  it("renders highlighted code with classes and no style attribute anywhere in it", () => {
    expect(l1.message).toBe("");
    expect(l1.ok).toBe(true);

    const html = l1.read("code-spike/index.html");
    const blocks = codeBlocks(html);
    expect(blocks).toHaveLength(3);
    const [typed, plain, unknown] = blocks;

    expect(typed).toMatch(/class="[^"]*\bhl-keyword\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-comment\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-string\b/);
    expect(typed).toMatch(/class="[^"]*\bhl-number\b/);
    expect(typed).toContain('data-caption="Reading a setting"');

    // No language: the same box, plain text.
    expect(plain).toContain("plain text without a language");
    expect(plain).not.toContain("data-caption");
    // An unknown language is plain text too, not an error.
    expect(unknown).toContain("text in a language nobody has heard of");

    for (const block of blocks) expect(block).not.toContain("style=");
    // The whole page: highlighting adds no inline style anywhere.
    expect(html.match(/<code[\s\S]*?<\/code>/g)?.join("") ?? "").not.toContain("style=");
  });

  it("leaves the content security policy exactly as it is without the highlighting configuration", () => {
    expect(codeBaseline.ok).toBe(true);
    expect(l1.ok).toBe(true);

    const before = cspOf(codeBaseline.read("code-spike/index.html"));
    const after = cspOf(l1.read("code-spike/index.html"));
    expect(after).not.toBe("");
    expect(after).toBe(before);
    const styleSrc = /style-src[^;]*/.exec(after)?.[0] ?? "";
    expect(styleSrc).toContain("'self'");
    expect(styleSrc).not.toContain("'unsafe-inline'");
    expect(after).not.toContain("'unsafe-inline'");
  });

  it("fails the build, naming the colour, when a token colour has no class", () => {
    expect(codeBroken.ok).toBe(false);
    expect(codeBroken.message).toContain("#0a0b0c");
  });
});

describe("the page policy of project pages", () => {
  it("builds", () => {
    expect(l1.message).toBe("");
  });

  it("leaves every project page, the index and other pages on the site policy, with no frame source", () => {
    for (const path of ["projects/every-setting/index.html", "projects/minimal/index.html", "projects/index.html", "about/index.html"]) {
      const policy = policyOf(l1.read(path));
      expect(policy, path).not.toContain("frame-src");
      expect(policy, path).toContain("default-src 'self'");
    }
  });

  it("does not put a frame source in public/_headers", () => {
    const headers = readFileSync(new URL("../../public/_headers", import.meta.url), "utf-8");
    expect(headers).not.toContain("frame-src");
    expect(headers).not.toContain("drc.dev");
  });

  it("has no element with an inline style attribute on the index or any story (FR-047)", () => {
    for (const [path, html] of l1.htmlFiles()) {
      if (!path.startsWith("projects/")) continue;
      expect(html, path).not.toMatch(/<[a-z][^>]*\sstyle=/i);
    }
  });

  it("renders no frame on any project page", () => {
    for (const [path, html] of l1.htmlFiles()) {
      if (!path.startsWith("projects/")) continue;
      expect(html, path).not.toContain("<iframe");
    }
  });
});

describe("a story with a picture on every part", () => {
  let html = "";
  beforeAll(() => {
    html = l1.read("projects/every-part/index.html");
  });

  it("builds", () => expect(l1.message).toBe(""));

  it("renders four parts, a picture beside each, the table, the stand-in and source links and the invitation", () => {
    expect(count(html, /<section[^>]*\sdata-part="/g)).toBe(4);
    expect(count(html, /data-part-picture/g)).toBe(4);
    expect(html).toContain("data-options-table");
    expect(html).toContain("Every part stand-in");
    expect(html).toContain("This is not a live demo.");
    expect(html).toContain("Source code for Every part");
    expect(html).toContain("If you have a problem shaped like this one, tell me about it.");
    expect(html).toContain("/contact/?project=every-part");
  });

  it("renders the placeholder mark and a sub-heading inside its part, and leaves the Build table a plain table", () => {
    expect(html).toContain("data-placeholder");
    expect(html).toContain("A sub-heading");
    expect(count(html, /<table[\s>]/g)).toBe(2);
  });
});

describe("the story of a valid every-setting project", () => {
  let html = "";
  beforeAll(() => {
    html = l1.read("projects/every-setting/index.html");
  });

  it("builds", () => {
    expect(l1.message).toBe("");
    expect(l1.ok).toBe(true);
  });

  it("has one h1 with the title and four parts with h2 headings", () => {
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>\s*Every setting\s*<\/h1>/);
    expect(count(html, /<h2[\s>]/g)).toBe(4);
  });

  it("has the four parts in order, with no contents list or chapter numbers", () => {
    const names = [...html.matchAll(/<section[^>]*\sdata-part="([a-z]+)"/g)].map((m) => m[1]);
    expect(names).toEqual(["problem", "options", "build", "lessons"]);
    expect(html).not.toMatch(/In this story|data-chapter|Chapter \d/);
  });

  it("links the live demo and shows its own invitation sentence with the contact link", () => {
    expect(html).toContain("Open the Every setting demo");
    expect(html).toContain("If a setting here looks like your problem, tell me about it.");
    expect(html).toContain('href="/contact/?project=every-setting"');
  });

  it("carries its own title, description, canonical and sharing image (FR-080)", () => {
    expect(html).toMatch(/<title>Every setting · [^<]+<\/title>/);
    expect(html).toContain('content="A project file that uses every setting."');
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/projects\/every-setting\/"/);
    expect(html).toMatch(/<meta[^>]+property="og:title"[^>]+content="Every setting"/);
    expect(html).toMatch(/<meta[^>]+property="og:image"[^>]+content="[^"]*\/_astro\/[^"]+\.png"/);
    expect(html).toMatch(/<meta[^>]+property="og:image:alt"[^>]+content="A sharing image"/);
  });

  it("is not a draft, so shows no draft notice", () => {
    expect(html).not.toContain("data-draft-notice");
  });

  it("ships no page script beyond the shell's", () => {
    const about = l1.read("about/index.html");
    const scripts = (page: string) => count(page, /<script\b/g);
    expect(scripts(html)).toBe(scripts(about));
  });
});

describe("getPostSummaries", () => {
  const summaries = () =>
    JSON.parse(l1.read("summaries.json")) as { slug: string; draft: boolean; minutesRead: number; href: string }[];

  it("includes drafts and reading time in a build that is not production", () => {
    expect(l1.message).toBe("");
    const posts = summaries();
    const slugs = posts.map((p) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(["published", "draft", "sample-everything", "text-only"]));
    expect(posts.find((p) => p.slug === "draft")?.draft).toBe(true);
    expect(posts.find((p) => p.slug === "published")?.href).toBe("/writing/published/");
    for (const post of posts) expect(Number.isInteger(post.minutesRead) && post.minutesRead >= 1).toBe(true);
    expect(posts.find((p) => p.slug === "text-only")?.minutesRead).toBe(1);
    expect(posts.find((p) => p.slug === "sample-everything")?.minutesRead).toBeGreaterThanOrEqual(1);
  });

  it("sorts newest first", () => {
    const posts = summaries();
    // published (2026-08-27) is newer than text-only (2026-08-10).
    expect(posts.map((p) => p.slug).indexOf("published")).toBeLessThan(posts.map((p) => p.slug).indexOf("text-only"));
  });
});

describe("things that are not errors", () => {
  it("builds a post whose code fence names an unknown language (shown as plain text)", () => {
    expect(l1.message).toBe("");
    expect(l1.read("writing/unknown-language/index.html")).toContain("text in a language nobody has heard of");
  });
});

describe("posts that must build (contracts/build-errors.md)", () => {
  const mustBuild = [
    ["untagged", "untagged"],
    ["free-form only", "free-form-only"],
    ["series plus others", "series-and-free-form"],
  ] as const;
  it.each(mustBuild)("builds a post that is %s, with a silent build", (_label, slug) => {
    expect(l1.ok, l1.message).toBe(true);
    expect(l1.message).toBe("");
    expect(existsSync(join(l1.dist, "writing", slug, "index.html"))).toBe(true);
  });
});

describe("a local or test build (no environment)", () => {
  const robots = (html: string) => /<meta[^>]+name="robots"[^>]*>/.exec(html)?.[0] ?? "";

  it("builds the draft page with a Draft notice and a noindex robots tag", () => {
    expect(l1.message).toBe("");
    const html = l1.read("writing/draft/index.html");
    expect(html).toMatch(/data-draft-notice[^>]*>\s*<strong>Draft\.<\/strong>/);
    expect(robots(html)).toMatch(/^<meta name="robots" content="noindex"\s*\/?>$/);
  });

  it("does not show a notice on a published post", () => {
    expect(l1.read("writing/published/index.html")).not.toContain("data-draft-notice");
  });

  it("lists the draft with a Draft label on the landing page and in the sitemap", () => {
    expect(l1.read("writing/index.html")).toMatch(/data-draft-label[^>]*>\s*Draft\s*</);
    expect(l1.read("sitemap-0.xml")).toContain("/writing/draft/");
  });

  it("keeps drafts out of the feed on every build (Phase 8)", () => {
    expect(written(l1, "writing/rss.xml")).not.toContain("/writing/draft/");
  });
});

describe("self-hosted fonts in the build", () => {
  // Layer build: only the real `astro build` shows the hashed output (F09; FR-004, FR-015).
  const listFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
    );

  it("emits exactly four hashed woff2 files, identical to the sources, and no other font file", () => {
    const fontsDir = join(l1.dist, "_astro", "fonts");
    const emitted = readdirSync(fontsDir).sort();
    expect(emitted).toHaveLength(4);
    for (const name of emitted) expect(name).toMatch(/^[0-9a-f]+\.woff2$/);
    const sources = readdirSync("src/assets/fonts")
      .filter((n) => n.endsWith(".woff2"))
      .map((n) => readFileSync(join("src/assets/fonts", n)));
    const outputs = emitted.map((n) => readFileSync(join(fontsDir, n)));
    expect(sources).toHaveLength(4);
    for (const source of sources) expect(outputs.some((o) => o.equals(source))).toBe(true);
    const stray = listFiles(l1.dist).filter((f) => /\.(woff2?|ttf|otf|eot)$/i.test(f) && !f.startsWith(fontsDir));
    expect(stray).toEqual([]);
  });
});
