// Builds the site twice, once with the main-branch Workers Builds environment
// and once with a preview-branch environment, and checks the output: a main build
// has no robots meta on public pages (the not-found page stays noindex) and names
// https://doncoleman.ca everywhere; a branch build is noindex everywhere and names
// its alias origin; _headers holds the host rules, not a site-wide noindex
// (FR-010a, FR-010d, FR-017a, FR-019; contracts/indexing-and-origin.md). The main-branch build also
// stands in for the production build the launch checks read (T012): setup/config.json `launch`
// (data-model.md "SetupConfig") must match the repository's content and this build's sitemap.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { topicHref, topics } from "../../src/config/topics.ts";
import { configSchema } from "../../scripts/setup-check/schemas.ts";
import { resolveSiteOrigin } from "../../src/lib/site-origin.ts";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));
const setupConfig = JSON.parse(readFileSync(join(root, "setup/config.json"), "utf-8"));
const launchConfig = configSchema.parse(setupConfig);
const themeInitSource = readFileSync(join(root, "src/scripts/theme-init.js"), "utf-8").trim();

const BUILD_TIMEOUT = 300_000;

/** Hosts a build could use for its own address; any URL on these hosts must use the build's origin. */
function isSiteHost(host: string): boolean {
  return (
    host === "doncoleman.ca" ||
    host.endsWith(".doncoleman.ca") ||
    host === setupConfig.reviewHost ||
    host.endsWith(".workers.dev")
  );
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const environments = [
  { label: "main branch", env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } },
  { label: "preview branch", env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "002-site-foundation", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } },
] as const;

describe.each(environments)("astro build with the $label environment", ({ env }) => {
  const expectedOrigin = resolveSiteOrigin(env, setupConfig);
  let outDir = "";
  let files: string[] = [];

  beforeAll(async () => {
    outDir = mkdtempSync(join(tmpdir(), "dcc-web-build-env-"));
    const childEnv: NodeJS.ProcessEnv = { ...process.env, ...env, ASTRO_TELEMETRY_DISABLED: "1" };
    // Vitest sets these; they would change how Astro/Vite build.
    delete childEnv.VITEST;
    delete childEnv.VITEST_MODE;
    delete childEnv.VITEST_POOL_ID;
    delete childEnv.VITEST_WORKER_ID;
    delete childEnv.NODE_ENV;
    await run(process.execPath, [join(root, "node_modules/astro/bin/astro.mjs"), "build", "--outDir", outDir], {
      cwd: root,
      env: childEnv,
      maxBuffer: 64 * 1024 * 1024,
    });
    files = walk(outDir);
  }, BUILD_TIMEOUT);

  afterAll(() => {
    if (outDir) rmSync(outDir, { recursive: true, force: true });
  });

  it("resolves to an https origin distinct per environment", () => {
    expect(expectedOrigin).toMatch(/^https:\/\/[^/]+$/);
    if (env.WORKERS_CI_BRANCH === "main") {
      expect(expectedOrigin).toBe("https://doncoleman.ca");
    } else {
      expect(expectedOrigin).toMatch(/\.workers\.dev$/);
    }
  });

  // A draft standalone page is noindex in every build, so the main build's "no robots meta" rule
  // covers the published pages only.
  const isDraftPage = (file: string): boolean => {
    const slug = relative(outDir, file).replace(/(^|\/)index\.html$/, "") || "index";
    const source = join(root, "src/content/pages", `${slug}.mdx`);
    return existsSync(source) && /^draft:\s*true\s*$/m.test(readFileSync(source, "utf-8"));
  };

  it("sets the robots meta tag by build: none on published pages in main, noindex everywhere else", () => {
    const htmlFiles = files.filter((f) => f.endsWith(".html"));
    expect(htmlFiles.length).toBeGreaterThan(0);
    const isMain = env.WORKERS_CI_BRANCH === "main";
    for (const file of htmlFiles) {
      const html = readFileSync(file, "utf-8");
      const isNotFound = file === join(outDir, "404.html");
      if (isMain && !isNotFound && !isDraftPage(file)) {
        expect(html, file).not.toMatch(/<meta\s+name="robots"/);
      } else {
        expect(html, file).toMatch(/<meta\s+name="robots"\s+content="noindex"\s*\/?>/);
      }
    }
  });

  it("names the resolved origin in the writing feed", () => {
    const feed = readFileSync(join(outDir, "writing/rss.xml"), "utf-8");
    const links = [...feed.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]!);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(new URL(link).origin, link).toBe(expectedOrigin);
  });

  it("uses the resolved origin for the home page's canonical and og:url", () => {
    const html = readFileSync(join(outDir, "index.html"), "utf-8");
    const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/.exec(html)?.[1];
    const ogUrl = /<meta\s+property="og:url"\s+content="([^"]+)"/.exec(html)?.[1];
    expect(canonical).toBe(`${expectedOrigin}/`);
    expect(ogUrl).toBe(`${expectedOrigin}/`);
  });

  it("uses that one origin for every site address in the build", () => {
    const textFiles = files.filter((f) => /\.(html|xml|txt)$/.test(f));
    let checked = 0;
    for (const file of textFiles) {
      const text = readFileSync(file, "utf-8");
      for (const match of text.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
        const url = new URL(match[0]);
        if (!isSiteHost(url.host)) continue;
        checked += 1;
        expect(url.origin, `${file}: ${match[0]}`).toBe(expectedOrigin);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("points robots.txt's Sitemap line at the resolved origin (FR-018)", () => {
    const robots = readFileSync(join(outDir, "robots.txt"), "utf-8");
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow:/im);
    expect(robots.match(/^Sitemap: (.+)$/m)?.[1]).toBe(`${expectedOrigin}/sitemap-index.xml`);
  });

  it("uses the resolved origin for every sitemap entry and excludes the not-found page (FR-017a, FR-018)", () => {
    const index = readFileSync(join(outDir, "sitemap-index.xml"), "utf-8");
    const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(sitemaps).toEqual([`${expectedOrigin}/sitemap-0.xml`]);
    const entries = [...readFileSync(join(outDir, "sitemap-0.xml"), "utf-8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1]!,
    );
    // A preview build includes the sample post, which is a draft; production leaves it out (spec 008 R3).
    // The listing pages are published on every build: all posts and one page per topic (spec 008 US4).
    const pages = [
      "/",
      "/about/",
      "/contact/",
      "/privacy-policy/",
      "/projects/",
      "/projects/focus-pocus/",
      "/services/",
      "/speaking/",
      "/technology/",
      "/terms-of-use/",
      "/writing/",
      "/writing/all/",
      ...topics.map((topic) => topicHref(topic.id)),
    ];
    // Don's real posts (feature 010) are published, so every build lists them.
    const realPosts = [
      "/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/",
      "/writing/self-contained-development-for-ghost-themes/",
      "/writing/starting-something-new/",
      "/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/",
    ];
    const samplePosts = ["/writing/sample-everything/"];
    const expected = env.WORKERS_CI_BRANCH === "main" ? [...pages, ...realPosts] : [...pages, ...realPosts, ...samplePosts];
    expect([...entries].sort()).toEqual(expected.map((path) => `${expectedOrigin}${path}`).sort());
  });

  it("leaves the draft sample post out of production and builds it, labelled, elsewhere (FR-032, FR-046)", () => {
    const page = join(outDir, "writing/sample-everything/index.html");
    if (env.WORKERS_CI_BRANCH === "main") {
      expect(files.some((f) => f.includes(`${join("writing", "sample-")}`))).toBe(false);
      // The listing shows the real posts and links to no sample.
      const listing = readFileSync(join(outDir, "writing/index.html"), "utf-8");
      expect(listing).toContain('href="/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/"');
      expect(listing).not.toContain("/writing/sample-");
      expect(listing).not.toContain("data-draft-label");
    } else {
      const html = readFileSync(page, "utf-8");
      expect(html).toMatch(/data-draft-notice[^>]*>\s*<strong>Draft\.<\/strong>/);
      expect(html).toMatch(/<meta\s+name="robots"\s+content="noindex"\s*\/?>/);
      expect(readFileSync(join(outDir, "writing/index.html"), "utf-8")).toContain("data-draft-label");
    }
  });

  // The launch paths are checked against the main-branch build: the production environment with the
  // repository's real content.
  it.runIf(env.WORKERS_CI_BRANCH === "main")("lists every launch.expectedPaths entry in the production sitemap", () => {
    const index = readFileSync(join(outDir, "sitemap-index.xml"), "utf-8");
    expect(index).toContain("https://doncoleman.ca/");
    const sitemap = readFileSync(join(outDir, "sitemap-0.xml"), "utf-8");
    const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    for (const path of launchConfig.launch!.expectedPaths) {
      expect(locs.has(`https://doncoleman.ca${path}`), `the sitemap has no entry for ${path}`).toBe(true);
    }
  });

  it("places the pre-paint theme script before the stylesheet in the built home page", () => {
    const html = readFileSync(join(outDir, "index.html"), "utf-8");
    const head = html.slice(0, html.indexOf("</head>"));
    const scriptAt = head.indexOf(themeInitSource);
    expect(scriptAt).toBeGreaterThan(-1);
    const stylesheetAt = head.search(/<link\s[^>]*rel="stylesheet"|<style[\s>]/);
    expect(stylesheetAt).toBeGreaterThan(-1);
    expect(scriptAt).toBeLessThan(stylesheetAt);
  });

  it("copies _headers with the two host noindex rules and no site-wide noindex", () => {
    const headers = readFileSync(join(outDir, "_headers"), "utf-8");
    const starBlock = /^\/\*\s*\n((?:[ \t]+.*\n?)*)/m.exec(headers)?.[1] ?? "";
    expect(starBlock).not.toMatch(/x-robots-tag/i);
    expect(headers).toMatch(/^https:\/\/:worker\.:subdomain\.workers\.dev\/\*\s*\n\s+X-Robots-Tag:\s*noindex\s*$/m);
    expect(headers).toMatch(/^https:\/\/new\.doncoleman\.ca\/\*\s*\n\s+X-Robots-Tag:\s*noindex\s*$/m);
  });
});

describe("launch.expectedPages and launch.expectedPaths", () => {
  it("are declared in setup/config.json, and the review host is kept", () => {
    expect(launchConfig.reviewHost).toBe("new.doncoleman.ca");
    expect(launchConfig.launch?.expectedPages.length).toBeGreaterThan(0);
    expect(launchConfig.launch?.expectedPaths.length).toBeGreaterThan(0);
  });

  it("names a file in src/content/pages/ for every expected page id", () => {
    for (const id of launchConfig.launch!.expectedPages) {
      expect(existsSync(join(root, `src/content/pages/${id}.mdx`)), `src/content/pages/${id}.mdx is missing`).toBe(true);
    }
  });
});
