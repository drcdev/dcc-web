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
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { configSchema } from "../../scripts/setup-check/schemas.ts";
import { isProductionBuild } from "../../src/lib/build-mode.ts";
import { resolveSiteOrigin } from "../../src/lib/site-origin.ts";
import { inBuild, pages, posts, projects, isSample, sitemapPaths } from "../helpers/content.ts";
import { filesUnder } from "../helpers/files.ts";

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

const environments = [
  { label: "main branch", env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } },
  { label: "preview branch", env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "002-site-foundation", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } },
] as const;

describe.each(environments)("astro build with the $label environment", ({ env }) => {
  const expectedOrigin = resolveSiteOrigin(env, setupConfig);
  const production = isProductionBuild(env);
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
    files = filesUnder(outDir);
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

  // A draft or not-visible standalone page is noindex in every build, so the main build's "no robots meta" rule
  // covers the published pages only.
  const isDraftPage = (file: string): boolean => {
    const address = `/${relative(outDir, file).replace(/(^|\/)index\.html$/, "")}`;
    const normalised = address === "/" ? "/" : `${address}/`;
    return pages.some((page) => (page.draft || !page.visible) && page.address === normalised);
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
    // The sitemap lists every page, the listings and one page per topic, and the posts and projects
    // the build contains: a production build leaves drafts out, any other build lists them.
    const expected = sitemapPaths({ production });
    expect([...entries].sort()).toEqual(expected.map((path) => `${expectedOrigin}${path}`).sort());
  });

  // The merged page is listed once while it is published and not at all while it is a draft, and
  // the two removed pages are never listed (FR-008, issue #119).
  it("lists /work-with-me/ at most once, only when published, and neither /services/ nor /speaking/", () => {
    const entries = [...readFileSync(join(outDir, "sitemap-0.xml"), "utf-8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1]!,
    );
    const published = !pages.find((page) => page.address === "/work-with-me/")?.draft;
    expect(entries.filter((loc) => loc === `${expectedOrigin}/work-with-me/`)).toHaveLength(published ? 1 : 0);
    for (const removed of ["/services/", "/speaking/"]) {
      expect(entries, removed).not.toContain(`${expectedOrigin}${removed}`);
    }
  });

  const drafts = [...posts, ...projects].filter((entry) => entry.draft);
  const pageFile = (address: string) => join(outDir, address, "index.html");
  const listingOf = (entry: (typeof drafts)[number]) =>
    readFileSync(join(outDir, entry.collection === "posts" ? "writing/all" : "projects", "index.html"), "utf-8");

  it("has a draft to check: the test-owned sample post is a draft", () => {
    expect(posts.filter(isSample).every((post) => post.draft)).toBe(true);
    expect(posts.some(isSample)).toBe(true);
  });

  it.each(drafts.map((entry) => [entry.address, entry] as const))(
    "leaves the draft %s out of production and builds it, labelled, elsewhere (FR-032, FR-046)",
    (_address, entry) => {
      const label = entry.collection === "posts" ? "data-draft-label" : "data-draft-mark";
      if (production) {
        expect(existsSync(pageFile(entry.address)), entry.address).toBe(false);
        expect(listingOf(entry)).not.toContain(`href="${entry.address}"`);
        expect(listingOf(entry)).not.toContain(label);
      } else {
        const html = readFileSync(pageFile(entry.address), "utf-8");
        expect(html).toContain("data-draft-notice");
        expect(html).toMatch(/<meta\s+name="robots"\s+content="noindex"\s*\/?>/);
        expect(listingOf(entry)).toContain(`href="${entry.address}"`);
        expect(listingOf(entry)).toContain(label);
      }
    },
  );

  it("lists every post and project the build contains on its listing", () => {
    const writing = readFileSync(join(outDir, "writing/all/index.html"), "utf-8");
    for (const post of inBuild(posts, { production })) expect(writing, post.address).toContain(`href="${post.address}"`);
    const listing = readFileSync(join(outDir, "projects/index.html"), "utf-8");
    for (const project of inBuild(projects, { production })) expect(listing, project.address).toContain(`href="${project.address}"`);
  });

  // The launch paths are checked against the main-branch build: the production environment with the
  // repository's real content. A draft page is built but not listed, and setup item 26 already
  // requires the launch pages to be published, so only published launch paths are checked here.
  it.runIf(env.WORKERS_CI_BRANCH === "main")("lists every launch.expectedPaths entry in the production sitemap", () => {
    const index = readFileSync(join(outDir, "sitemap-index.xml"), "utf-8");
    expect(index).toContain("https://doncoleman.ca/");
    const sitemap = readFileSync(join(outDir, "sitemap-0.xml"), "utf-8");
    const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const draftAddresses = new Set(pages.filter((page) => page.draft).map((page) => page.address));
    for (const path of launchConfig.launch!.expectedPaths.filter((address) => !draftAddresses.has(address))) {
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

  it("copies _headers with the workers.dev noindex rule and no site-wide noindex", () => {
    const headers = readFileSync(join(outDir, "_headers"), "utf-8");
    const starBlock = /^\/\*\s*\n((?:[ \t]+.*\n?)*)/m.exec(headers)?.[1] ?? "";
    expect(starBlock).not.toMatch(/x-robots-tag/i);
    expect(headers).toMatch(/^https:\/\/:worker\.:subdomain\.workers\.dev\/\*\s*\n\s+X-Robots-Tag:\s*noindex\s*$/m);
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
